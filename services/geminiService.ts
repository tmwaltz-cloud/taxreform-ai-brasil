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
// gemini-1.5 e gemini-2.0 foram desligados para novos projetos
// Usar apenas família 2.5 com retry por sobrecarga (503)
const MODELS = [
  'gemini-2.5-flash',      // 1º — principal (pode dar 503 em picos)
  'gemini-2.5-flash-lite', // 2º — mais leve, menos sobrecarregado
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

/**
 * Executa fn(model) tentando cada modelo da lista MODELS em cascata.
 * Para cada modelo, tenta até `retriesPerModel` vezes antes de cair para o próximo.
 */
async function withModelFallback<T>(
  fn: (model: string) => Promise<T>,
  retriesPerModel = 3,   // 3 tentativas por modelo (era 2)
  baseDelay = 3000       // 3s, 6s, 9s (era 2s)
): Promise<T> {
  let lastError: any;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= retriesPerModel; attempt++) {
      try {
        const result = await fn(model);
        // Logar se usou fallback
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

        // Erro não-503: não adianta retry, pular para próximo modelo
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
    // Fallback estático
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
const NEWS_CACHE_DURATION_MS = 1000 * 60 * 15; // 15 minutos

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

// ─── Simulador Estratégico IVA — Motor de cálculo local ─────────────────────
// Base legal: LC 214/2025 (CBS 8,8% | IBS 17,7% | IVA Dual ref. 26,5%)
// PIS/COFINS LP: 3,65% | LR: 9,25% | SN: ~3,5% (LC 123/2006)
// Crédito Simples Nacional: ~20% do IVA (LC 214/2025 regime híbrido)

export const simuladorEstrategicoIva = (input: SupplyChainInput, futureRegime?: string) => {
  const regimeFuturo = futureRegime || input.companyRegime;

  // Alíquotas IVA Dual (referência MF — LC 214/2025)
  const aliq_iva      = 0.265;
  const fator_simples = 0.20;  // crédito reduzido SN (~20%)

  // Alíquotas PIS/COFINS atuais por regime
  const aliq_pis_cofins_presumido = 0.0365; // LP cumulativo (Lei 9.718/98)
  const aliq_pis_cofins_real      = 0.0925; // LR não-cumulativo (Lei 10.637+10.833)
  const aliq_pis_cofins_simples   = 0.0350; // SN embutido DAS (LC 123/2006)

  const getAliqAtual = (regime: string): number => {
    if (regime.includes('Lucro Real'))  return aliq_pis_cofins_real;
    if (regime.includes('Simples'))     return aliq_pis_cofins_simples;
    return aliq_pis_cofins_presumido;
  };

  const getCreditoFator = (regime: string): number => {
    if (regime.includes('Simples Dual') || regime.includes('Híbrido')) return 1.0;
    if (regime.includes('Simples Nacional')) return fator_simples;
    return 1.0; // LP e LR — crédito integral
  };

  // Valores base da cadeia (exemplificativos)
  const venda_forn   = 1000.00;
  const venda_emp    = 1500.00;
  const venda_cli    = 2000.00;
  const margem       = 0.3375;

  // Alíquotas atuais
  const aliq_atual_forn  = getAliqAtual(input.supplierRegime);
  const aliq_atual_emp   = getAliqAtual(input.companyRegime);
  const aliq_atual_fut   = getAliqAtual(regimeFuturo);

  // Imposto atual empresa
  const imp_atual_emp = +(venda_emp * aliq_atual_emp).toFixed(2);

  // Crédito atual (LR tem crédito; LP/SN não)
  const credito_atual = input.companyRegime.includes('Lucro Real')
    ? +(venda_forn * aliq_pis_cofins_real).toFixed(2) : 0;
  const custo_liq_atual = +(venda_forn - credito_atual).toFixed(2);
  const preco_atual = +(custo_liq_atual * (1 + margem) * (1 + aliq_atual_emp)).toFixed(2);

  // Crédito IVA entrada (pós-reforma)
  const cred_fator_forn = getCreditoFator(input.supplierRegime);
  const cred_fator_fut  = getCreditoFator(regimeFuturo);
  const credito_iva_entrada = +(venda_forn * aliq_iva * cred_fator_forn).toFixed(2);
  const custo_liq_reforma   = +(venda_forn - credito_iva_entrada).toFixed(2);
  const iva_debito_saida    = +(venda_emp * aliq_iva).toFixed(2);
  const iva_liq_empresa     = +(iva_debito_saida - credito_iva_entrada).toFixed(2);
  const preco_reforma       = +(custo_liq_reforma * (1 + margem) * (1 + aliq_iva * cred_fator_fut)).toFixed(2);

  // Delta imposto a pagar
  const diff_imposto_pago = +(iva_liq_empresa - imp_atual_emp).toFixed(2);

  // Simulação conceitual — ARRAY de rows para tabela DRE
  const conceptualSimulation = [
    { etapa: '1. Custo de Aquisição (Bruto)',          atual: `R$ ${venda_forn.toFixed(2).replace('.', ',')}`,                         reforma: `R$ ${venda_forn.toFixed(2).replace('.', ',')}` },
    { etapa: '2. (-) Créditos Tributários na Compra',  atual: `R$ ${credito_atual.toFixed(2).replace('.', ',')}`,                       reforma: `R$ ${credito_iva_entrada.toFixed(2).replace('.', ',')}` },
    { etapa: '3. (=) Custo Líquido de Mercadoria',     atual: `R$ ${custo_liq_atual.toFixed(2).replace('.', ',')}`,                     reforma: `R$ ${custo_liq_reforma.toFixed(2).replace('.', ',')}` },
    { etapa: '4. (+) Margem de Lucro (Desejada)',       atual: `R$ ${(custo_liq_atual * margem).toFixed(2).replace('.', ',')}`,          reforma: `R$ ${(custo_liq_reforma * margem).toFixed(2).replace('.', ',')}` },
    { etapa: '5. (+) Impostos sobre a Venda',           atual: `R$ ${imp_atual_emp.toFixed(2).replace('.', ',')}`,                       reforma: `R$ ${iva_debito_saida.toFixed(2).replace('.', ',')}` },
    { etapa: '6. (=) Preço de Venda Final',             atual: `R$ ${preco_atual.toFixed(2).replace('.', ',')}`,                         reforma: `R$ ${preco_reforma.toFixed(2).replace('.', ',')}` },
  ];

  // chainEfficiency alinhado com types.ts
  const chainEfficiency = {
    currentFinalCost:  `R$ ${preco_atual.toFixed(2).replace('.', ',')}`,
    reformFinalCost:   `R$ ${preco_reforma.toFixed(2).replace('.', ',')}`,
    efficiencyGain:    `${diff_imposto_pago > 0 ? '-' : '+'}R$ ${Math.abs(diff_imposto_pago).toFixed(2).replace('.', ',')}`,
    description:       diff_imposto_pago > 0
      ? `Com o regime ${regimeFuturo}, o imposto líquido aumenta R$ ${diff_imposto_pago.toFixed(2)} em relação ao cenário atual.`
      : `Com o regime ${regimeFuturo}, o imposto líquido reduz R$ ${Math.abs(diff_imposto_pago).toFixed(2)} em relação ao cenário atual.`,
  };

  // simulationTable — formato original
  const simulationTable = [
    { etapa: 'Fornecedor',    valorVenda: `R$ ${venda_forn.toFixed(2)}`, ibsCbsDebito: `R$ ${(venda_forn * aliq_iva).toFixed(2)}`,   creditoSplit: `R$ 0,00`,                              impostoLiquido: `R$ ${(venda_forn * aliq_iva).toFixed(2)}` },
    { etapa: 'Sua Empresa',   valorVenda: `R$ ${venda_emp.toFixed(2)}`,  ibsCbsDebito: `R$ ${iva_debito_saida.toFixed(2)}`,          creditoSplit: `R$ ${credito_iva_entrada.toFixed(2)}`,  impostoLiquido: `R$ ${iva_liq_empresa.toFixed(2)}` },
    { etapa: 'Cliente Final', valorVenda: `R$ ${venda_cli.toFixed(2)}`,  ibsCbsDebito: `R$ ${(venda_cli * aliq_iva).toFixed(2)}`,    creditoSplit: `R$ ${iva_debito_saida.toFixed(2)}`,    impostoLiquido: `R$ ${((venda_cli * aliq_iva) - iva_debito_saida).toFixed(2)}` },
  ];

  return {
    conceptualSimulation,
    chainEfficiency,
    simulationTable,
    aliq_pis_cofins_presumido: aliq_atual_emp,
    aliq_iva,
    diff_imposto_pago,
  };
};

export const analyzeSupplyChain = async (input: SupplyChainInput): Promise<SupplyChainResult> => {
  checkRateLimit('supplyChain');

  const prompt = `
    Você é um auditor fiscal especialista na Reforma Tributária Brasileira (EC 132/2023, LC 214/2025).
    Analise o impacto tributário na Cadeia de Valor com o seguinte cenário:
    - Fornecedor: Setor ${input.supplierSector}, Regime ${input.supplierRegime}
    - Sua Empresa: Setor ${input.companySector}, Regime ${input.companyRegime}
    - Cliente: ${input.customerType}

    RETORNE OBRIGATORIAMENTE este JSON completo (todos os campos são obrigatórios):
    {
      "currentScenario": {
        "taxResiduePercent": <number>,
        "recoverableTaxPercent": <number>,
        "description": "<texto explicando cenário atual>",
        "inefficiencyAlert": "<alerta sobre ineficiência atual>"
      },
      "reformScenario": {
        "taxResiduePercent": <number>,
        "recoverableTaxPercent": <number>,
        "description": "<texto explicando cenário pós-reforma>",
        "creditGain": "<ganho de crédito esperado>"
      },
      "impactSummary": {
        "buyerCostReductionPercent": <number>,
        "priceCompetitiveness": "Aumenta" | "Mantém" | "Diminui",
        "strategicAdvice": "<conselho estratégico direto>"
      },
      "flowAnalysis": {
        "step1_supplier_impact": "<como a reforma impacta o fornecedor ${input.supplierSector}/${input.supplierRegime} — 2-3 frases>",
        "step2_company_impact": "<como a reforma impacta SUA EMPRESA ${input.companySector}/${input.companyRegime} — 2-3 frases, destaque o impacto no caixa>",
        "step3_customer_impact": "<como a reforma impacta o cliente ${input.customerType} — 2-3 frases>"
      },
      "swotAnalysis": {
        "strengths": ["<força 1>", "<força 2>", "<força 3>"],
        "weaknesses": ["<fraqueza 1>", "<fraqueza 2>"],
        "opportunities": ["<oportunidade 1>", "<oportunidade 2>", "<oportunidade 3>"],
        "threats": ["<ameaça 1>", "<ameaça 2>"]
      },
      "companyRegimeComparisons": [
        {
          "regime": "Simples Nacional (Normal)",
          "taxBurden": "<Baixa|Média|Alta>",
          "creditGenerated": "<descrição do crédito gerado>",
          "netResult": "<Positivo para B2C|Neutro|Negativo para B2B>",
          "recommendation": "<recomendação específica para o contexto do usuário>"
        },
        {
          "regime": "Simples Nacional (Híbrido)",
          "taxBurden": "<Baixa|Média|Alta>",
          "creditGenerated": "<descrição>",
          "netResult": "<resultado>",
          "recommendation": "<recomendação>"
        },
        {
          "regime": "Lucro Presumido / IVA Padrão",
          "taxBurden": "<Baixa|Média|Alta>",
          "creditGenerated": "<descrição>",
          "netResult": "<resultado>",
          "recommendation": "<recomendação>"
        },
        {
          "regime": "Lucro Real",
          "taxBurden": "<Baixa|Média|Alta>",
          "creditGenerated": "<descrição>",
          "netResult": "<resultado>",
          "recommendation": "<recomendação>"
        }
      ]
    }
    JSON válido sem markdown. Todos os campos obrigatórios.
  `;

  try {
    const result = await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          responseMimeType: 'application/json',
        },
      });
      return JSON.parse(cleanJsonOutput(response.text)) as SupplyChainResult;
    });

    const metrics = simuladorEstrategicoIva(input);
    result.conceptualSimulation = metrics.conceptualSimulation;
    result.chainEfficiency = metrics.chainEfficiency;
    result.simulationTable = metrics.simulationTable;
    return result;
  } catch (error) {
    console.error('[Gemini] Supply chain error:', error);
    const metrics = simuladorEstrategicoIva(input);
    return {
      currentScenario: { taxResiduePercent: 10, recoverableTaxPercent: 5, description: 'Hoje você paga imposto sobre imposto.', inefficiencyAlert: 'Custo oculto na cadeia.' },
      reformScenario: { taxResiduePercent: 0, recoverableTaxPercent: 100, description: 'No futuro, o imposto será transparente.', creditGain: 'Recuperação total.' },
      impactSummary: { buyerCostReductionPercent: 5, priceCompetitiveness: 'Aumenta', strategicAdvice: 'Avalie mudar para o regime híbrido.' },
      flowAnalysis: { step1_supplier_impact: 'Fornecedor não gera crédito total.', step2_company_impact: 'Empresa repassa custo.', step3_customer_impact: 'Cliente paga mais caro.' },
      swotAnalysis: { strengths: ['Crédito imediato (Split Payment)'], weaknesses: ['Aumento B2C'], opportunities: ['Revisão contratos Simples'], threats: ['Perda clientes B2B'] },
      companyRegimeComparisons: [
        { regime: 'Simples Nacional', taxBurden: 'Menor carga', creditGenerated: 'Não gera crédito', netResult: 'Perda B2B', recommendation: 'Só pessoa física.' },
        { regime: 'Simples Híbrido', taxBurden: 'Média', creditGenerated: 'Gera crédito integral', netResult: 'Ganho B2B', recommendation: 'Ideal para B2B.' },
        { regime: 'Lucro Presumido', taxBurden: 'Alta', creditGenerated: 'Gera crédito integral', netResult: 'Neutro', recommendation: 'Avaliar custos.' },
        { regime: 'Lucro Real', taxBurden: 'Sobre lucro', creditGenerated: 'Gera crédito integral', netResult: 'Ganho margem baixa', recommendation: 'Margens apertadas.' },
      ],
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
      // googleSearch só funciona sem responseMimeType — OK aqui
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
// Dashboard.tsx usa: fetchLatestUpdates
export const fetchLatestUpdates = fetchTaxNews;
// SupplyChain.tsx usa: runSupplyChainAnalysis (simuladorEstrategicoIva já é export)
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
