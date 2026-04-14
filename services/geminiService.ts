import { GoogleGenAI, Type } from "@google/genai";
import { UserRole, SimulationInput, SimulationResult, NewsItem, SupplyChainInput, SupplyChainResult, AccountantGuideData } from "../types";

const geminiApiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  (typeof process !== 'undefined' && (process.env?.API_KEY || process.env?.GEMINI_API_KEY)) ||
  '';

let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
} catch (e) {
  console.error("Failed to initialize GoogleGenAI", e);
}

// ─── Modelos disponíveis (abril 2026) ────────────────────────────────────────
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

// ─── System Instructions ──────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION_BASE = `
Você é o núcleo de inteligência da plataforma "TaxReform.ai Brasil", especializada na Reforma Tributária do Brasil (EC 132/2023).
Seu papel é atuar simultaneamente como:
• Analista legislativo;
• Economista tributário;
• Consultor empresarial;
• Tradutor de linguagem técnica.

Regras Gerais:
1. Considere a legislação mais recente (PEC 45, EC 132, PLP 68/2024 e regulamentações).
2. Não invente leis. Se houver incerteza, alerte.
3. Responda em Português do Brasil.
`;

const SYSTEM_INSTRUCTION_SIMULATOR = SYSTEM_INSTRUCTION_BASE + `
4. CONTEXTO TEMPORAL (SIMULAÇÃO): Estamos em ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}. A reforma já iniciou sua fase de testes (cobrança simbólica de IBS/CBS de 1%). O planejamento de 2025 já passou. Foque nas ações imediatas de 2026 e na preparação para a extinção do PIS/COFINS em 2027.
`;

const getRoleInstruction = (role: UserRole) => {
  switch (role) {
    case UserRole.EMPRESARIO:
      return "Adapte o tom para 'Empresário': Foco em impacto no lucro, simplicidade, tomada de decisão estratégica e redução de riscos. Evite juridiquês excessivo.";
    case UserRole.CONTADOR:
      return "Adapte o tom para 'Contador': Foco técnico em compliance, obrigações acessórias, alíquotas, base de cálculo e operacionalização.";
    case UserRole.ADVOGADO:
      return "Adapte o tom para 'Advogado': Foco em segurança jurídica, teses tributárias, constitucionalidade e interpretação da norma.";
    case UserRole.GESTOR_FINANCEIRO:
      return "Adapte o tom para 'Gestor Financeiro': Foco em fluxo de caixa, planejamento orçamentário, capital de giro e projeções.";
    default:
      return "";
  }
};

const cleanJsonOutput = (text: string | undefined): string => {
  if (!text) return "[]";
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const RATE_LIMITS = {
  consultant:   15,
  simulation:   0,
  supplyChain:  5,
  interpreter:  10,
  news:         30,
  timeline:     5,
  actionGuide:  10,
  accountant:   3,
};

type RateLimitKey = keyof typeof RATE_LIMITS;

export class RateLimitError extends Error {
  constructor(public key: RateLimitKey, public limit: number) {
    super(`Limite diário de ${limit} consultas atingido para "${key}". Tente novamente amanhã.`);
    this.name = 'RateLimitError';
  }
}

function checkRateLimit(key: RateLimitKey): void {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `rl_${key}_${today}`;
  const current = parseInt(localStorage.getItem(storageKey) || '0', 10);
  const limit = RATE_LIMITS[key];
  if (current >= limit) throw new RateLimitError(key, limit);
  localStorage.setItem(storageKey, String(current + 1));
}

export function getRateLimitUsage(key: RateLimitKey): { used: number; limit: number; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `rl_${key}_${today}`;
  const used = parseInt(localStorage.getItem(storageKey) || '0', 10);
  const limit = RATE_LIMITS[key];
  return { used, limit, remaining: Math.max(0, limit - used) };
}

// ─── Retry + Fallback de modelo ───────────────────────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function is503(error: any): boolean {
  return (
    error?.message?.includes('503') ||
    error?.message?.includes('UNAVAILABLE') ||
    error?.message?.includes('high demand') ||
    error?.status === 503
  );
}

async function withModelFallback<T>(
  fn: (model: string) => Promise<T>,
  retriesPerModel = 3,
  baseDelay = 3000
): Promise<T> {
  let lastError: any;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= retriesPerModel; attempt++) {
      try {
        const result = await fn(model);
        if (model !== MODELS[0]) {
          console.info(`[Gemini] Usando modelo fallback: ${model}`);
        }
        return result;
      } catch (error: any) {
        lastError = error;

        if (is503(error)) {
          if (attempt < retriesPerModel) {
            const delay = baseDelay * attempt;
            console.warn(`[Gemini] 503 ${model} — tentativa ${attempt}/${retriesPerModel}. Aguardando ${delay}ms...`);
            await sleep(delay);
          } else {
            console.warn(`[Gemini] 503 ${model} — esgotado. Tentando próximo modelo...`);
          }
          continue;
        }

        console.warn(`[Gemini] Erro não-503 em ${model}:`, error?.message);
        break;
      }
    }
  }

  throw lastError ?? new Error('[Gemini] Todos os modelos falharam');
}

// ─── Timeline dinâmico ────────────────────────────────────────────────────────

export interface TimelineItem {
  period: string;
  status: 'done' | 'current' | 'warning' | 'upcoming' | 'future';
  title: string;
  description: string;
  urgencyTag?: string;
}

const timelineCache: { data: TimelineItem[] | null; timestamp: number } = { data: null, timestamp: 0 };
const TIMELINE_CACHE_DURATION_MS = 1000 * 60 * 60 * 24;

export const fetchReformTimeline = async (): Promise<TimelineItem[]> => {
  const now = Date.now();
  if (timelineCache.data && now - timelineCache.timestamp < TIMELINE_CACHE_DURATION_MS) {
    return timelineCache.data;
  }
  checkRateLimit('timeline');

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `
    DATA DE HOJE: ${currentDate}
    Você é especialista em Reforma Tributária Brasileira (EC 132/2023, LC 214/2025).
    Gere um cronograma atualizado da transição tributária com base na data de hoje.
    REGRAS:
    1. Marcos já passados: status "done"
    2. Marco atual: status "current"
    3. Próximos 3 meses urgentes: status "warning"
    4. Futuros importantes: status "upcoming"
    5. Distantes (2029+): status "future"
    6. Máximo 6 itens
    MARCOS: Jan/2026 NF-e IBS/CBS, Abr/2026 fim tolerância, 2027 extinção PIS/COFINS, 2027 Simples Híbrido, 2029-2032 IBS escalonamento, 2033 sistema pleno.
    Retorne APENAS JSON válido sem markdown, array de objetos com: period, status, title, description, urgencyTag (opcional).
  `;

  try {
    const data = await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return JSON.parse(cleanJsonOutput(response.text)) as TimelineItem[];
    });

    timelineCache.data = data;
    timelineCache.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('[Gemini] Timeline error:', error);
    return [
      { period: 'Jan/2026', status: 'done', title: 'Início da fase-teste IBS/CBS', description: 'NF-e começa a exibir CBS 0,9% e IBS 0,1%. Cobrança simbólica.' },
      { period: 'Abr/2026', status: 'current', title: 'Fim do período de tolerância', description: 'Empresas devem estar com ERP adaptado para os novos campos.' },
      { period: 'Jan/2027', status: 'warning', title: 'Extinção do PIS/COFINS', description: 'CBS entra em vigor plena (8,8%). PIS/COFINS são extintos.' },
      { period: '2027', status: 'upcoming', title: 'Simples Nacional Híbrido', description: 'Empresas do Simples poderão optar pelo regime híbrido de IVA.' },
      { period: '2029–2032', status: 'future', title: 'Escalonamento do IBS', description: 'IBS substitui ICMS/ISS gradualmente: 25% → 50% → 75% → 87,5%.' },
      { period: 'Jan/2033', status: 'future', title: 'Sistema CBS+IBS pleno', description: 'ICMS e ISS extintos. IVA Dual em plena vigência.' },
    ];
  }
};

// ─── Notícias em tempo real ───────────────────────────────────────────────────

const newsCache: { data: NewsItem[] | null; timestamp: number } = { data: null, timestamp: 0 };
const NEWS_CACHE_DURATION_MS = 1000 * 60 * 15;

export const fetchTaxNews = async (userRole?: UserRole, topic?: string): Promise<NewsItem[]> => {
  const now = Date.now();
  if (!topic && newsCache.data && now - newsCache.timestamp < NEWS_CACHE_DURATION_MS) {
    return newsCache.data;
  }
  checkRateLimit('news');

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const roleContext = userRole ? `Perfil do usuário: ${userRole}. Adapte a relevância das notícias.` : '';
  const topicFilter = topic ? `Filtre as notícias pelo tema: ${topic}.` : '';

  const prompt = `
    DATA ATUAL: ${currentDate}
    Você é analista tributário. Busque as últimas notícias sobre Reforma Tributária Brasileira.
    ${roleContext}
    ${topicFilter}
    Retorne APENAS JSON: array de objetos com: id (string), title, summary, source, date, category, urgency (low|medium|high), impactLevel (Alto|Médio|Baixo), url (se disponível).
    Máximo 8 itens. Foque em: IBS, CBS, LC 214/2025, Split Payment, Simples Nacional, CGIBS.
  `;

  try {
    const data = await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
        },
      });
      const items = JSON.parse(cleanJsonOutput(response.text)) as NewsItem[];
      return items;
    });

    newsCache.data = data;
    newsCache.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('[Gemini] News error:', error);
    return [];
  }
};

// ─── Supply Chain ─────────────────────────────────────────────────────────────

// ─── Simulador Estratégico IVA — baseado na Calculadora de Fluxo de Caixa ────
// Lógica derivada da planilha fluxo_caixa_reforma_tributaria_CORRIGIDO.xlsx
// Base legal: LC 214/2025 | EC 132/2023 | Lei 9.718/98 | Lei 10.637/02 | Lei 10.833/03
//
// Alíquotas (LC 214/2025 art.12 e art.15):
//   CBS: 8,8% (fixada) | IBS: 17,7% (referência MF) | IVA Dual: 26,5%
//   CBS fase-teste 2026: 0,9% + IBS 0,1% (art.340)
// Alíquotas atuais:
//   Lucro Real:      PIS 1,65% + COFINS 7,60% = 9,25% (não-cumulativo)
//   Lucro Presumido: PIS 0,65% + COFINS 3,00% = 3,65% (cumulativo)
//   Simples Nacional: embutido DAS ~3,5%

export const simuladorEstrategicoIva = (input: SupplyChainInput, futureRegime?: string) => {
  const regimeFuturo = futureRegime || input.companyRegime;

  const aliq_cbs       = 0.088;
  const aliq_ibs       = 0.177;
  const aliq_iva       = aliq_cbs + aliq_ibs;  // 26,5%
  const fator_simples  = 0.20;
  const fator_hibrido  = 1.00;

  const aliq_lr   = 0.0165 + 0.076;   // 9,25%
  const aliq_lp   = 0.0065 + 0.030;   // 3,65%
  const aliq_sn   = 0.035;            // ~3,5%
  const aliq_icms = 0.05;

  const getAliqPisCofins = (regime: string): number => {
    if (regime.includes('Lucro Real'))  return aliq_lr;
    if (regime.includes('Simples'))     return aliq_sn;
    return aliq_lp;
  };

  const getCreditoFator = (regime: string): number => {
    if (regime.includes('Simples Dual') || regime.includes('Híbrido')) return fator_hibrido;
    if (regime.includes('Simples Nacional')) return fator_simples;
    return 1.0;
  };

  const vForn = 1_000.00;
  const vEmp  = 1_500.00;
  const vCli  = 2_000.00;

  const aliq_atual_forn = getAliqPisCofins(input.supplierRegime);
  const aliq_atual_emp  = getAliqPisCofins(input.companyRegime);
  const aliq_atual_fut  = getAliqPisCofins(regimeFuturo);

  // CENÁRIO ATUAL
  const pis_cofins_forn = +(vForn * aliq_atual_forn).toFixed(2);
  const icms_forn       = +(vForn * aliq_icms).toFixed(2);
  const pis_cofins_emp  = +(vEmp  * aliq_atual_emp).toFixed(2);
  const icms_emp        = +(vEmp  * aliq_icms).toFixed(2);
  const pis_cofins_cli  = +(vCli  * aliq_atual_fut).toFixed(2);
  const icms_cli        = +(vCli  * aliq_icms).toFixed(2);

  const perc_cred_pis = input.companyRegime.includes('Lucro Real') ? 0.70 : 0;
  const perc_cred_icms = 0.50;

  const cred_pis_emp  = +(vForn * perc_cred_pis * aliq_atual_forn).toFixed(2);
  const cred_icms_emp = +(vForn * perc_cred_icms * aliq_icms).toFixed(2);

  const trib_liq_forn = +(pis_cofins_forn + icms_forn).toFixed(2);
  const trib_liq_emp  = +(pis_cofins_emp + icms_emp - cred_pis_emp - cred_icms_emp).toFixed(2);
  const trib_liq_cli  = +(pis_cofins_cli + icms_cli).toFixed(2);

  // PÓS-REFORMA 2027
  const perc_cred_iva = 0.85;
  const fator_forn = getCreditoFator(input.supplierRegime);

  const iva_bruto_forn = +(vForn * aliq_iva).toFixed(2);
  const iva_bruto_emp  = +(vEmp  * aliq_iva).toFixed(2);
  const iva_bruto_cli  = +(vCli  * aliq_iva).toFixed(2);

  const cred_iva_emp  = +(vForn * aliq_iva * fator_forn * perc_cred_iva).toFixed(2);
  const cred_iva_cli  = +(vEmp  * aliq_iva * getCreditoFator(regimeFuturo) * perc_cred_iva).toFixed(2);

  const iva_liq_forn = +(iva_bruto_forn).toFixed(2);
  const iva_liq_emp  = +(iva_bruto_emp - cred_iva_emp).toFixed(2);
  const iva_liq_cli_b2b = input.customerType.includes('B2B')
    ? +(iva_bruto_cli - cred_iva_cli).toFixed(2)
    : +(iva_bruto_cli).toFixed(2);

  const split_retido = iva_liq_emp;
  const float_perdido = +(vEmp * aliq_iva * (25/30)).toFixed(2);
  const diff_imposto_pago = +(iva_liq_emp - trib_liq_emp).toFixed(2);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const conceptualSimulation = [
    { etapa: '1. Custo de Reposição (Nota)', atual: fmt(vForn), reforma: fmt(vForn) },
    { etapa: '2. (-) Créditos Tributários de Compra', atual: fmt(cred_pis_emp + cred_icms_emp), reforma: fmt(cred_iva_emp) },
    { etapa: '3. (=) Custo Líquido de Mercadoria', atual: fmt(vForn - cred_pis_emp - cred_icms_emp), reforma: fmt(vForn - cred_iva_emp) },
    { etapa: '4. (+) Margem de Lucro (Empresa)', atual: fmt(vEmp - vForn), reforma: fmt(vEmp - vForn) },
    { etapa: '5. (-) Impostos sobre a Venda', atual: fmt(pis_cofins_emp + icms_emp), reforma: fmt(iva_bruto_emp) },
    { etapa: '6. (=) Preço de Venda Final', atual: fmt(vEmp), reforma: fmt(vEmp) },
  ];

  const simulationTable = [
    {
      etapa: 'Fornecedor',
      valorVenda: fmt(vForn),
      ibsCbsDebito: fmt(iva_bruto_forn),
      creditoSplit: 'R$ 0,00',
      impostoLiquido: fmt(iva_liq_forn),
    },
    {
      etapa: 'Sua Empresa',
      valorVenda: fmt(vEmp),
      ibsCbsDebito: fmt(iva_bruto_emp),
      creditoSplit: fmt(cred_iva_emp),
      impostoLiquido: fmt(iva_liq_emp),
    },
    {
      etapa: 'Cliente Final',
      valorVenda: fmt(vCli),
      ibsCbsDebito: fmt(iva_bruto_cli),
      creditoSplit: fmt(cred_iva_cli),
      impostoLiquido: fmt(iva_liq_cli_b2b),
    },
  ];

  const chainEfficiency = {
    currentFinalCost: fmt(vEmp - trib_liq_emp),
    reformFinalCost: fmt(vEmp - split_retido),
    efficiencyGain: fmt(Math.abs(diff_imposto_pago)),
    description: diff_imposto_pago > 0
      ? `Com o regime ${regimeFuturo}, o IVA líquido aumenta R$ ${Math.abs(diff_imposto_pago).toFixed(2).replace('.', ',')} vs cenário atual. Split Payment retém R$ ${fmt(split_retido)} automaticamente.`
      : `Com o regime ${regimeFuturo}, os créditos IVA superam os tributos atuais — redução de R$ ${Math.abs(diff_imposto_pago).toFixed(2).replace('.', ',')} no imposto pago.`,
  };

  return {
    conceptualSimulation,
    chainEfficiency,
    simulationTable,
    aliq_pis_cofins_presumido: aliq_atual_emp,
    aliq_iva,
    diff_imposto_pago,
    trib_liq_emp,
    iva_liq_emp,
    split_retido,
    float_perdido,
    cred_iva_emp,
  };
};

// ─── Fallback local completo para Supply Chain ────────────────────────────────
// Gera dados textuais contextualizados sem depender do Gemini

function buildLocalSupplyChainResult(input: SupplyChainInput): Omit<SupplyChainResult, 'conceptualSimulation' | 'chainEfficiency' | 'simulationTable'> {
  const isSimples = input.companyRegime.includes('Simples') && !input.companyRegime.includes('Híbrido');
  const isHibrido = input.companyRegime.includes('Híbrido') || input.companyRegime.includes('Dual');
  const isB2B = input.customerType.includes('B2B');
  const fornSimples = input.supplierRegime.includes('Simples') && !input.supplierRegime.includes('Híbrido');

  return {
    currentScenario: {
      taxResiduePercent: isSimples ? 5 : 10,
      recoverableTaxPercent: isSimples ? 0 : (input.companyRegime.includes('Lucro Real') ? 70 : 5),
      description: 'Análise gerada localmente com base na legislação vigente (LC 214/2025, EC 132/2023).',
      inefficiencyAlert: isSimples
        ? 'No Simples Nacional atual, o imposto é cumulativo e não gera crédito para clientes B2B.'
        : 'Custo tributário oculto na cadeia por cumulatividade parcial de PIS/COFINS.',
    },
    reformScenario: {
      taxResiduePercent: 0,
      recoverableTaxPercent: isSimples ? 20 : 100,
      description: 'Com o IVA Dual (CBS 8,8% + IBS 17,7% = 26,5%), a não-cumulatividade plena elimina o imposto em cascata.',
      creditGain: isSimples
        ? 'Crédito reduzido (~20% do IVA). Considere o Simples Dual para crédito integral.'
        : 'Recuperação total dos créditos CBS+IBS via Split Payment.',
    },
    impactSummary: {
      buyerCostReductionPercent: isB2B ? 8 : 3,
      priceCompetitiveness: isB2B ? 'Aumenta' as const : 'Mantém' as const,
      strategicAdvice: isSimples && isB2B
        ? 'Migre para o Simples Dual (Híbrido) para gerar crédito integral e manter competitividade B2B.'
        : 'Avalie o regime tributário futuro para otimizar créditos CBS+IBS na cadeia.',
    },
    flowAnalysis: {
      step1_supplier_impact: fornSimples
        ? `O fornecedor (${input.supplierSector}/${input.supplierRegime}) está no Simples Nacional. Na reforma, passará a destacar o IVA (26,5%) na NF-e, mas gera apenas ~20% de crédito para sua empresa. Isso encarece seu custo de aquisição em relação a um fornecedor do Lucro Presumido ou Real, que gera crédito integral. Considere renegociar preços ou diversificar fornecedores.`
        : `O fornecedor (${input.supplierSector}/${input.supplierRegime}) passará a destacar o IVA Dual (CBS 8,8% + IBS 17,7% = 26,5%) nas notas fiscais a partir de 2027. Como está no ${input.supplierRegime}, gera crédito integral de CBS+IBS para sua empresa usar como abatimento. O Split Payment reterá automaticamente o IVA na transação, eliminando a necessidade de pagamento posterior separado.`,
      step2_company_impact: isSimples
        ? `Sua empresa (${input.companySector}/${input.companyRegime}) está no Simples Nacional, que não gera crédito pleno de IVA para clientes B2B. ${isB2B ? 'ATENÇÃO: seus clientes B2B perdem competitividade comprando de você. Considere fortemente migrar para o Simples Dual (Híbrido) para gerar crédito integral.' : 'Para vendas B2C, o Simples Nacional continua vantajoso por ter carga menor. O consumidor final não recupera crédito de qualquer forma.'} O Split Payment reterá o IVA automaticamente no recebimento — planeje seu capital de giro.`
        : `Sua empresa (${input.companySector}/${input.companyRegime}) gera crédito integral de CBS+IBS (26,5%). ${isB2B ? 'Seus clientes B2B poderão aproveitar o crédito total, tornando sua oferta competitiva.' : 'Para clientes B2C, o IVA será embutido no preço final.'} O Split Payment reterá o IVA líquido automaticamente no recebimento — impacto direto no fluxo de caixa. Planeje o capital de giro considerando a retenção automática.`,
      step3_customer_impact: isB2B
        ? `O cliente B2B (${input.customerType}) poderá usar o crédito IVA gerado pela sua empresa como abatimento — tornando sua oferta mais competitiva no mercado B2B. ${isSimples ? 'Porém, como sua empresa está no Simples Nacional, o crédito gerado é reduzido (~20%), o que diminui a atratividade da sua oferta vs concorrentes no Lucro Presumido/Real.' : 'Como sua empresa gera crédito integral, o cliente aproveita 100% do IVA destacado como crédito.'} A transparência do Split Payment facilita a conferência de créditos.`
        : `O cliente final (${input.customerType}) arcará com o IVA embutido no preço final, sem recuperação de crédito. O impacto no preço ao consumidor depende do repasse que sua empresa fizer. A não-cumulatividade reduz custos intermediários, o que pode permitir preços finais competitivos mesmo com a alíquota de 26,5%.`,
    },
    swotAnalysis: {
      strengths: [
        'Não-cumulatividade plena: possibilidade de se creditar de praticamente todos os impostos pagos na cadeia, reduzindo o custo tributário efetivo',
        'Simplificação a longo prazo: menos impostos e regras mais claras para gerenciar',
        'Neutralidade tributária: menos distorções na tomada de decisões de negócios baseadas em incentivos fiscais',
      ],
      weaknesses: [
        `Período de transição: complexidade e curva de aprendizado significativas entre 2026 e 2033, exigindo adaptação de sistemas e processos`,
        isSimples
          ? 'Simples Nacional: crédito reduzido (~20%) para clientes B2B torna a empresa menos competitiva em cadeias B2B'
          : 'Alíquota única: embora simplifique, a alíquota de referência pode ser mais alta que as taxas atuais dependendo do setor',
        'Impacto no fluxo de caixa: Split Payment retém o IVA automaticamente, reduzindo o caixa líquido recebido por venda',
      ],
      opportunities: [
        'Otimização de custos: reavaliação e renegociação com fornecedores com base na nova estrutura de créditos',
        'Reprecificação estratégica: oportunidade de ajustar os preços dos seus serviços de forma mais competitiva',
        'Inovação e investimento: a não-cumulatividade plena incentiva investimentos em tecnologia e equipamentos, pois os impostos geram créditos',
      ],
      threats: [
        'Competição acirrada: outras empresas também se beneficiarão da não-cumulatividade, aumentando a pressão por preços',
        'Variação nas alíquotas: incerteza sobre as alíquotas finais da CBS e do IBS que ainda serão definidas por lei complementar e pelos estados/municípios',
        'Fiscalização e auditoria: maior foco na conformidade e na apuração correta dos créditos, exigindo sistemas robustos',
      ],
    },
    companyRegimeComparisons: [
      {
        regime: `Geral (Atual: ${input.companyRegime})`,
        taxBurden: input.companyRegime.includes('Lucro Real') ? 'Alta (9,25%)' : input.companyRegime.includes('Simples') ? 'Baixa (~3,5%)' : 'Média (3,65%)',
        creditGenerated: input.companyRegime.includes('Lucro Real') ? 'Integral' : input.companyRegime.includes('Simples') ? 'Não gera' : 'Não gera (cumulativo)',
        netResult: isB2B ? (input.companyRegime.includes('Lucro Real') ? 'Positivo' : 'Negativo') : 'Neutro',
        recommendation: `Avalie se a sua carga for suficiente no ${input.companyRegime}. Para economia, considere a simulação abaixo.`,
      },
      {
        regime: 'Simples Nacional (Padrão)',
        taxBurden: 'Baixa (~3,5% DAS)',
        creditGenerated: 'Reduzido (~20%)',
        netResult: isB2B ? 'Negativo para B2B' : 'Positivo para B2C',
        recommendation: isB2B
          ? 'Não recomendado: o cliente B2B perde crédito, tornando seu preço menos competitivo.'
          : 'Eficiente para vendas B2C onde o consumidor não recupera crédito.',
      },
      {
        regime: 'Simples Nacional (Híbrido/Dual)',
        taxBurden: 'Média/Alta',
        creditGenerated: 'Integral',
        netResult: isB2B ? 'Positivo para B2B' : 'Neutro/Negativo',
        recommendation: isB2B
          ? 'Altamente recomendado: gera crédito integral para seus clientes B2B sem sair do Simples.'
          : 'Não faz sentido para B2C: custo tributário maior sem benefício de crédito para o consumidor final.',
      },
      {
        regime: 'Lucro Presumido / IVA Padrão',
        taxBurden: 'Alta (26,5%)',
        creditGenerated: 'Integral',
        netResult: isB2B ? 'Positivo para B2B' : 'Negativo para B2C',
        recommendation: 'Gera crédito integral. Migração para o IVA padrão em 2027 obrigatória para não-Simples. Avaliar impacto no preço final.',
      },
    ],
  };
}

// ─── Validador de resposta do Gemini ─────────────────────────────────────────
// Garante que todos os campos esperados existam, preenchendo com fallback local

function validateAndMergeSupplyChainResult(
  geminiData: any,
  fallback: Omit<SupplyChainResult, 'conceptualSimulation' | 'chainEfficiency' | 'simulationTable'>
): Omit<SupplyChainResult, 'conceptualSimulation' | 'chainEfficiency' | 'simulationTable'> {
  const safe = (val: any, fb: any) => (val !== undefined && val !== null && val !== '') ? val : fb;
  const safeArr = (val: any, fb: any[]) => (Array.isArray(val) && val.length > 0) ? val : fb;

  return {
    currentScenario: {
      taxResiduePercent:    safe(geminiData?.currentScenario?.taxResiduePercent, fallback.currentScenario.taxResiduePercent),
      recoverableTaxPercent: safe(geminiData?.currentScenario?.recoverableTaxPercent, fallback.currentScenario.recoverableTaxPercent),
      description:          safe(geminiData?.currentScenario?.description, fallback.currentScenario.description),
      inefficiencyAlert:    safe(geminiData?.currentScenario?.inefficiencyAlert, fallback.currentScenario.inefficiencyAlert),
    },
    reformScenario: {
      taxResiduePercent:    safe(geminiData?.reformScenario?.taxResiduePercent, fallback.reformScenario.taxResiduePercent),
      recoverableTaxPercent: safe(geminiData?.reformScenario?.recoverableTaxPercent, fallback.reformScenario.recoverableTaxPercent),
      description:          safe(geminiData?.reformScenario?.description, fallback.reformScenario.description),
      creditGain:           safe(geminiData?.reformScenario?.creditGain, fallback.reformScenario.creditGain),
    },
    impactSummary: {
      buyerCostReductionPercent: safe(geminiData?.impactSummary?.buyerCostReductionPercent, fallback.impactSummary.buyerCostReductionPercent),
      priceCompetitiveness:      safe(geminiData?.impactSummary?.priceCompetitiveness, fallback.impactSummary.priceCompetitiveness),
      strategicAdvice:           safe(geminiData?.impactSummary?.strategicAdvice, fallback.impactSummary.strategicAdvice),
    },
    flowAnalysis: {
      step1_supplier_impact: safe(geminiData?.flowAnalysis?.step1_supplier_impact, fallback.flowAnalysis.step1_supplier_impact),
      step2_company_impact:  safe(geminiData?.flowAnalysis?.step2_company_impact, fallback.flowAnalysis.step2_company_impact),
      step3_customer_impact: safe(geminiData?.flowAnalysis?.step3_customer_impact, fallback.flowAnalysis.step3_customer_impact),
    },
    swotAnalysis: {
      strengths:     safeArr(geminiData?.swotAnalysis?.strengths, fallback.swotAnalysis.strengths),
      weaknesses:    safeArr(geminiData?.swotAnalysis?.weaknesses, fallback.swotAnalysis.weaknesses),
      opportunities: safeArr(geminiData?.swotAnalysis?.opportunities, fallback.swotAnalysis.opportunities),
      threats:       safeArr(geminiData?.swotAnalysis?.threats, fallback.swotAnalysis.threats),
    },
    companyRegimeComparisons: safeArr(geminiData?.companyRegimeComparisons, fallback.companyRegimeComparisons),
  };
}

export const analyzeSupplyChain = async (input: SupplyChainInput): Promise<SupplyChainResult> => {
  checkRateLimit('supplyChain');

  // Fallback local SEMPRE pronto — garante que nunca dê erro
  const localFallback = buildLocalSupplyChainResult(input);
  const metrics = simuladorEstrategicoIva(input);

  const prompt = `
Atue como consultor tributário sênior explicando para um EMPREENDEDOR LEIGO.
Analise o impacto da Reforma Tributária (EC 132/2023, LC 214/2025) na Cadeia de Valor de 3 etapas.

CENÁRIO DO CLIENTE:
- Fornecedor: Setor ${input.supplierSector}, regime ${input.supplierRegime}
- Sua Empresa: Setor ${input.companySector}, regime ${input.companyRegime}
- Cliente: ${input.customerType}

CONTEXTO LEGAL:
- IVA Dual: CBS 8,8% + IBS 17,7% = 26,5% (LC 214/2025 arts. 12 e 15)
- Split Payment: retenção automática do IVA no pagamento (arts. 47-55)
- Simples Nacional gera crédito reduzido (~20%), Simples Híbrido gera integral
- Transição: 2026 fase-teste, 2027 CBS plena, 2029-2032 escalonamento IBS, 2033 sistema pleno

RETORNE EXATAMENTE este JSON com os campos abaixo (use EXATAMENTE estes nomes de campo):

{
  "flowAnalysis": {
    "step1_supplier_impact": "Texto detalhado (3-5 frases) explicando como o fornecedor impacta tributariamente a cadeia. Inclua regime atual vs reforma, geração de crédito, e recomendação.",
    "step2_company_impact": "Texto detalhado (3-5 frases) explicando o impacto na empresa do cliente. Inclua Split Payment, crédito gerado, impacto no caixa.",
    "step3_customer_impact": "Texto detalhado (3-5 frases) explicando o impacto no cliente final. Inclua recuperação de crédito (B2B) ou custo embutido (B2C)."
  },
  "swotAnalysis": {
    "strengths": ["3 forças da reforma para esta cadeia específica"],
    "weaknesses": ["3 fraquezas/riscos para esta cadeia específica"],
    "opportunities": ["3 oportunidades estratégicas para esta cadeia"],
    "threats": ["3 ameaças externas para esta cadeia"]
  },
  "companyRegimeComparisons": [
    {
      "regime": "Nome do regime",
      "taxBurden": "Nível de carga (Baixa/Média/Alta com %)",
      "creditGenerated": "Tipo de crédito gerado",
      "netResult": "Resultado líquido para o perfil do cliente",
      "recommendation": "Recomendação contextualizada"
    }
  ],
  "currentScenario": {
    "taxResiduePercent": 10,
    "recoverableTaxPercent": 5,
    "description": "Descrição do cenário tributário atual",
    "inefficiencyAlert": "Alerta de ineficiência"
  },
  "reformScenario": {
    "taxResiduePercent": 0,
    "recoverableTaxPercent": 100,
    "description": "Descrição do cenário pós-reforma",
    "creditGain": "Descrição do ganho de crédito"
  },
  "impactSummary": {
    "buyerCostReductionPercent": 5,
    "priceCompetitiveness": "Aumenta",
    "strategicAdvice": "Conselho estratégico principal"
  }
}

REGRAS:
- Use linguagem SIMPLES e DIRETA para leigos
- Cada item do SWOT deve ter 1-2 frases completas
- companyRegimeComparisons deve incluir 4 regimes: regime atual, Simples Nacional, Simples Dual (Híbrido), Lucro Presumido/Real
- NÃO inclua campos simulationTable, conceptualSimulation ou chainEfficiency (são calculados localmente)
- Retorne APENAS o JSON válido, sem markdown, sem texto antes ou depois
`;

  try {
    const geminiResult = await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          responseMimeType: 'application/json',
        },
      });
      return JSON.parse(cleanJsonOutput(response.text));
    });

    // Validar e mesclar com fallback local (preenche campos faltantes)
    const validated = validateAndMergeSupplyChainResult(geminiResult, localFallback);

    return {
      ...validated,
      ...metrics,
    };
  } catch (error) {
    console.error('[Gemini] Supply chain error:', error);
    // Fallback 100% local — NUNCA falha
    return {
      ...localFallback,
      ...metrics,
    };
  }
};

// ─── Interpreter ──────────────────────────────────────────────────────────────

export const interpretLegalText = async (text: string, role: UserRole): Promise<string> => {
  checkRateLimit('interpreter');

  const prompt = `Analise o texto legislativo: "${text}" Para o perfil: ${role} Formate em Markdown.`;

  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION_BASE + '\n' + getRoleInstruction(role) },
      });
      return response.text || 'Sem resposta.';
    });
  } catch (error) {
    console.error('[Gemini] Interpreter error:', error);
    return 'Não foi possível interpretar o texto no momento. Tente novamente em alguns instantes.';
  }
};

// ─── Consultant (JaxAI) ───────────────────────────────────────────────────────

export const askTaxConsultant = async (question: string, role: UserRole): Promise<string> => {
  checkRateLimit('consultant');

  const prompt = `PERGUNTA (${role}): "${question}" Responda como JaxAI (Consultor Tributário). Use Markdown.`;

  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: SYSTEM_INSTRUCTION_BASE + '\n' + getRoleInstruction(role),
        },
      });
      return response.text || 'Sem resposta.';
    });
  } catch (error) {
    console.error('[Gemini] Consultant error:', error);
    return 'JaxAI: No momento, meus servidores de consulta estão sobrecarregados. Por favor, tente novamente em alguns instantes.';
  }
};

// ─── Action Guide ─────────────────────────────────────────────────────────────

export const getActionGuide = async (actionId: string, actionTitle: string): Promise<any> => {
  checkRateLimit('actionGuide');

  const prompt = `
    Você é consultor tributário especialista na Reforma Tributária Brasileira (EC 132/2023, PLP 68/2024).
    Crie um guia passo a passo para a ação: "${actionTitle}" (ID: ${actionId})
    Retorne APENAS JSON: { title, description, legislation, steps: [{title, description}], tips: [string] }
  `;

  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title:       { type: Type.STRING },
              description: { type: Type.STRING },
              legislation: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'description'] } },
              tips:  { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['title', 'description', 'legislation', 'steps', 'tips'],
          },
        },
      });
      return JSON.parse(cleanJsonOutput(response.text));
    });
  } catch (error) {
    console.error('[Gemini] Action guide error:', error);
    return {
      title: actionTitle,
      description: 'Guia gerado em modo offline.',
      legislation: 'Reforma Tributária (EC 132/2023)',
      steps: [
        { title: 'Mapeamento Inicial', description: 'Reúna as informações necessárias do seu ERP.' },
        { title: 'Análise de Impacto', description: 'Avalie como as novas regras afetam esta área.' },
        { title: 'Plano de Ação', description: 'Defina responsáveis e prazos.' },
      ],
      tips: ['Consulte seu contador ou advogado tributarista para validação final.'],
    };
  }
};

// ─── Aliases — nomes originais mantidos para compatibilidade ─────────────────
export const fetchLatestUpdates = fetchTaxNews;
export const runSupplyChainAnalysis = analyzeSupplyChain;

// ─── Accountant Guide ─────────────────────────────────────────────────────────

export const getAccountantStrategicGuide = async (): Promise<AccountantGuideData> => {
  checkRateLimit('accountant');

  const prompt = `
    Gere guia estratégico para Contadores 2026 sobre a Reforma Tributária.
    Retorne APENAS JSON: { profileShift: {from, to, description}, competencies: [{title, description, icon}], actionPlan: [{phase, actions: []}], consultancyTips: [] }
  `;

  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE + '\n' + getRoleInstruction(UserRole.CONTADOR),
          responseMimeType: 'application/json',
        },
      });
      return JSON.parse(cleanJsonOutput(response.text)) as AccountantGuideData;
    });
  } catch (error) {
    console.error('[Gemini] Accountant guide error:', error);
    return {
      profileShift: { from: 'Operador de Conformidade (Reativo)', to: 'Arquiteto da Estratégia Fiscal (Proativo)', description: 'Mudança para análise estratégica (Modo Offline).' },
      competencies: [
        { title: 'Visão Estratégica', description: 'Análise de impacto no negócio.', icon: 'Brain' },
        { title: 'Domínio Tecnológico', description: 'Automação fiscal.', icon: 'Cpu' },
      ],
      actionPlan: [{ phase: 'Imediato', actions: ['Revisar NCMs', 'Simular Carga'] }],
      consultancyTips: ['Ofereça diagnóstico preventivo.'],
    };
  }
};
