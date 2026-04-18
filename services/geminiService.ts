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

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

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
4. CONTEXTO TEMPORAL (SIMULAÇÃO): Estamos em ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}. A reforma já iniciou sua fase de testes (cobrança simbólica de IBS/CBS de 1%). Foque nas ações imediatas de 2026 e na preparação para a extinção do PIS/COFINS em 2027.
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
  consultant: 15, simulation: 0, supplyChain: 5, interpreter: 10,
  news: 30, timeline: 5, actionGuide: 10, accountant: 3,
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

// ─── Retry + Fallback ─────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function is503(error: any): boolean {
  return error?.message?.includes('503') || error?.message?.includes('UNAVAILABLE') || error?.message?.includes('high demand') || error?.status === 503;
}

async function withModelFallback<T>(fn: (model: string) => Promise<T>, retriesPerModel = 3, baseDelay = 3000): Promise<T> {
  let lastError: any;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= retriesPerModel; attempt++) {
      try {
        const result = await fn(model);
        if (model !== MODELS[0]) console.info(`[Gemini] Usando modelo fallback: ${model}`);
        return result;
      } catch (error: any) {
        lastError = error;
        if (is503(error)) {
          if (attempt < retriesPerModel) { await sleep(baseDelay * attempt); continue; }
          else { console.warn(`[Gemini] 503 ${model} — esgotado.`); continue; }
        }
        console.warn(`[Gemini] Erro não-503 em ${model}:`, error?.message);
        break;
      }
    }
  }
  throw lastError ?? new Error('[Gemini] Todos os modelos falharam');
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
export interface TimelineItem { period: string; status: 'done' | 'current' | 'warning' | 'upcoming' | 'future'; title: string; description: string; urgencyTag?: string; }
const timelineCache: { data: TimelineItem[] | null; timestamp: number } = { data: null, timestamp: 0 };

export const fetchReformTimeline = async (): Promise<TimelineItem[]> => {
  const now = Date.now();
  if (timelineCache.data && now - timelineCache.timestamp < 86400000) return timelineCache.data;
  checkRateLimit('timeline');
  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `DATA DE HOJE: ${currentDate}\nVocê é especialista em Reforma Tributária Brasileira (EC 132/2023, LC 214/2025).\nGere um cronograma atualizado da transição tributária.\nREGRAS: 1. Passados: "done" 2. Atual: "current" 3. Próximos 3 meses: "warning" 4. Futuros: "upcoming" 5. 2029+: "future" 6. Máximo 6 itens\nMARCOS: Jan/2026 NF-e IBS/CBS, Abr/2026 fim tolerância, 2027 extinção PIS/COFINS, 2027 Simples Híbrido, 2029-2032 IBS escalonamento, 2033 sistema pleno.\nRetorne APENAS JSON válido, array de objetos com: period, status, title, description, urgencyTag (opcional).`;
  try {
    const data = await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json' } });
      return JSON.parse(cleanJsonOutput(response.text)) as TimelineItem[];
    });
    timelineCache.data = data; timelineCache.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('[Gemini] Timeline error:', error);
    return [
      { period: 'Jan/2026', status: 'done', title: 'Início da fase-teste IBS/CBS', description: 'NF-e começa a exibir CBS 0,9% e IBS 0,1%.' },
      { period: 'Abr/2026', status: 'current', title: 'Fim do período de tolerância', description: 'Empresas devem estar com ERP adaptado.' },
      { period: 'Jan/2027', status: 'warning', title: 'Extinção do PIS/COFINS', description: 'CBS entra em vigor plena (8,8%).' },
      { period: '2027', status: 'upcoming', title: 'Simples Nacional Híbrido', description: 'Opção pelo regime híbrido de IVA.' },
      { period: '2029–2032', status: 'future', title: 'Escalonamento do IBS', description: 'IBS substitui ICMS/ISS gradualmente.' },
      { period: 'Jan/2033', status: 'future', title: 'Sistema CBS+IBS pleno', description: 'ICMS e ISS extintos.' },
    ];
  }
};

// ─── Notícias ─────────────────────────────────────────────────────────────────
const newsCache: { data: NewsItem[] | null; timestamp: number } = { data: null, timestamp: 0 };

export const fetchTaxNews = async (userRole?: UserRole, topic?: string): Promise<NewsItem[]> => {
  const now = Date.now();
  // Cache de 12 horas
  if (!topic && newsCache.data && now - newsCache.timestamp < 43_200_000) return newsCache.data;
  checkRateLimit('news');
  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const cutoffDate  = new Date(now - 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
  const roleContext = userRole ? `Perfil do usuário: ${userRole}. Priorize notícias relevantes para este perfil.` : '';
  const topicFilter = topic ? `Filtre exclusivamente pelo tema: ${topic}.` : '';
  const prompt = `DATA ATUAL: ${currentDate}\nJANELA: notícias dos últimos 15 dias (desde ${cutoffDate}).\nVocê é analista tributário sênior. Use busca para encontrar notícias REAIS e RECENTES sobre Reforma Tributária Brasileira.\n${roleContext}\n${topicFilter}\nFoco: IBS, CBS, LC 214/2025, Split Payment, Simples Nacional, CGIBS.\nRetorne APENAS JSON: array com id (string), title, summary (2-3 frases), source, date (dd/mm/aaaa), category, urgency (low|medium|high), impactLevel (Alto|Médio|Baixo), url.\nMáximo 8 itens. Ordene do mais recente ao mais antigo. NUNCA invente notícias.`;
  try {
    const data = await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }], systemInstruction: SYSTEM_INSTRUCTION_BASE } });
      return JSON.parse(cleanJsonOutput(response.text)) as NewsItem[];
    });
    newsCache.data = data; newsCache.timestamp = Date.now();
    return data;
  } catch (error) { console.error('[Gemini] News error:', error); return []; }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULADOR ESTRATÉGICO IVA — Cadeia de Valor
// ═══════════════════════════════════════════════════════════════════════════════
// Lógica derivada de:
//   1. fluxo_caixa_reforma_tributaria_CORRIGIDO.xlsx (Configuração, Cadeia de Valor, Comparativo)
//   2. simples_hibrido_vs_convencional.xlsx (Dados da Empresa, Comparativo, Cenários)
// Base legal: LC 214/2025 | EC 132/2023 | Lei 9.718/98 | Lei 10.637/02 | Lei 10.833/03 | LC 123/2006
//
// ALÍQUOTAS:
//   CBS: 8,8% (fixada — art.12) | IBS: 17,7% (referência MF — art.15) | IVA Dual: 26,5%
//   Lucro Real: PIS 1,65% + COFINS 7,60% = 9,25% (não-cumulativo)
//   Lucro Presumido: PIS 0,65% + COFINS 3,00% = 3,65% (cumulativo)
//   Simples Nacional: DAS ~6% efetivo, fração CBS+IBS ≈ 45% → crédito ~2,7%
//   ICMS/ISS médio: 5%
// PARÂMETROS PLANILHA:
//   % compras c/ crédito PIS/COFINS: 70% (somente LR) | ICMS: 50% | IBS/CBS: 85%
//   Split Payment: 25 dias float perdido

export const simuladorEstrategicoIva = (input: SupplyChainInput, futureRegime?: string) => {
  const regimeFuturo = futureRegime || input.companyRegime;

  // Alíquotas
  const aliq_cbs = 0.088;
  const aliq_ibs = 0.177;
  const aliq_iva = aliq_cbs + aliq_ibs; // 26,5%
  const aliq_lr  = 0.0165 + 0.076;      // 9,25%
  const aliq_lp  = 0.0065 + 0.030;      // 3,65%
  const aliq_sn  = 0.035;               // ~3,5% (fração PIS/COFINS do DAS)
  const aliq_icms = 0.05;

  // Simples: DAS ~6%, fração CBS+IBS ≈ 45% → crédito ~2,7%
  const das_efetivo = 0.06;
  const das_fracao_ibs_cbs = 0.45;
  const cred_sn_conv = das_efetivo * das_fracao_ibs_cbs; // ~2,7%

  // Parâmetros planilha
  const perc_cred_pis  = 0.70;
  const perc_cred_icms = 0.50;
  const perc_cred_iva  = 0.85;

  // Helpers
  const getAliqPisCofins = (r: string) => r.includes('Lucro Real') ? aliq_lr : r.includes('Simples') ? aliq_sn : aliq_lp;
  const getAliqIcmsIss   = (r: string) => r.includes('Simples') ? 0 : aliq_icms;
  const getCreditoIvaForn = (r: string) => {
    if (r.includes('Híbrido') || r.includes('Dual')) return aliq_iva;
    if (r.includes('Simples')) return cred_sn_conv;
    return aliq_iva;
  };

  // Valores base
  const vForn = 1_000.00;
  const vEmp  = 1_500.00;

  // Alíquotas do cenário
  const aliq_piscof_emp = getAliqPisCofins(input.companyRegime);
  const aliq_icms_emp   = getAliqIcmsIss(input.companyRegime);
  const aliq_piscof_forn = getAliqPisCofins(input.supplierRegime);
  const aliq_icms_forn   = getAliqIcmsIss(input.supplierRegime);

  // CENÁRIO ATUAL — débitos
  const piscof_debito_emp = +(vEmp * aliq_piscof_emp).toFixed(2);
  const icms_debito_emp   = +(vEmp * aliq_icms_emp).toFixed(2);
  const imp_bruto_atual   = +(piscof_debito_emp + icms_debito_emp).toFixed(2);

  // CENÁRIO ATUAL — créditos (sobre compras do fornecedor)
  const temCredPis  = input.companyRegime.includes('Lucro Real');
  const temCredIcms = !input.companyRegime.includes('Simples');
  const cred_pis_emp  = temCredPis  ? +(vForn * perc_cred_pis * aliq_piscof_forn).toFixed(2)  : 0;
  const cred_icms_emp = temCredIcms ? +(vForn * perc_cred_icms * aliq_icms_forn).toFixed(2)    : 0;
  const cred_total_atual = +(cred_pis_emp + cred_icms_emp).toFixed(2);
  const trib_liq_atual   = +(imp_bruto_atual - cred_total_atual).toFixed(2);

  // PÓS-REFORMA — IVA Dual
  const iva_bruto_emp = +(vEmp * aliq_iva).toFixed(2);
  const aliq_cred_forn = getCreditoIvaForn(input.supplierRegime);
  const cred_iva_emp   = +(vForn * aliq_cred_forn * perc_cred_iva).toFixed(2);
  const iva_liq_emp    = +(iva_bruto_emp - cred_iva_emp).toFixed(2);

  const split_retido    = iva_liq_emp;
  const float_perdido   = +(vEmp * aliq_iva * (25/30)).toFixed(2);
  const diff_imposto_pago = +(iva_liq_emp - trib_liq_atual).toFixed(2);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const fmtPerc = (v: number) => `${(v * 100).toFixed(2).replace('.', ',')}%`;

  // Tabela DRE Conceitual
  const conceptualSimulation = [
    { etapa: '1. Receita Bruta / Valor da Nota',           atual: fmt(vEmp), reforma: fmt(vEmp) },
    { etapa: '2. (-) Impostos sobre Receita (débito)',     atual: fmt(imp_bruto_atual), reforma: fmt(iva_bruto_emp) },
    { etapa: '3. (+) Créditos Fiscais sobre Compras',      atual: fmt(cred_total_atual), reforma: fmt(cred_iva_emp) },
    { etapa: '4. (=) Tributo Líquido a Pagar',             atual: fmt(trib_liq_atual), reforma: fmt(iva_liq_emp) },
    { etapa: '5. Split Payment (retido automaticamente)',   atual: 'Não se aplica', reforma: fmt(split_retido) },
    { etapa: '6. (=) Caixa Efetivamente Recebido',         atual: fmt(vEmp - trib_liq_atual), reforma: fmt(vEmp - split_retido) },
  ];

  const simulationTable = [
    { etapa: 'Fornecedor', valorVenda: fmt(vForn), ibsCbsDebito: fmt(+(vForn * aliq_iva).toFixed(2)), creditoSplit: 'R$ 0,00', impostoLiquido: fmt(+(vForn * aliq_iva).toFixed(2)) },
    { etapa: 'Sua Empresa', valorVenda: fmt(vEmp), ibsCbsDebito: fmt(iva_bruto_emp), creditoSplit: fmt(cred_iva_emp), impostoLiquido: fmt(iva_liq_emp) },
  ];

  const chainEfficiency = {
    currentFinalCost: fmt(vEmp - trib_liq_atual),
    reformFinalCost:  fmt(vEmp - split_retido),
    efficiencyGain:   fmt(Math.abs(diff_imposto_pago)),
    description: diff_imposto_pago > 0
      ? `Com o regime ${regimeFuturo}, o IVA líquido aumenta ${fmt(Math.abs(diff_imposto_pago))} vs cenário atual. Split Payment retém ${fmt(split_retido)} automaticamente.`
      : `Com o regime ${regimeFuturo}, os créditos IVA superam os tributos atuais — redução de ${fmt(Math.abs(diff_imposto_pago))} no imposto pago.`,
  };

  // ═══ EXPLICAÇÃO DO MOTIVO + CTA ═══
  let impactReason = '';
  let impactCta = '';

  if (diff_imposto_pago > 0) {
    const isServicos = input.companySector.includes('Serviço');
    const isSimples = input.companyRegime.includes('Simples') && !input.companyRegime.includes('Híbrido');
    const fornSimples = input.supplierRegime.includes('Simples') && !input.supplierRegime.includes('Híbrido');

    if (isServicos && (input.companyRegime.includes('Lucro Presumido') || isSimples)) {
      impactReason = `O aumento de ${fmt(Math.abs(diff_imposto_pago))} ocorre porque empresas de serviços no ${input.companyRegime} tinham carga PIS/COFINS de apenas ${fmtPerc(aliq_piscof_emp)}${aliq_icms_emp > 0 ? ` + ISS ${fmtPerc(aliq_icms_emp)}` : ''}, sem direito a crédito de entrada. Com a reforma, a alíquota sobe para ${fmtPerc(aliq_iva)}, e mesmo com créditos de ${fmt(cred_iva_emp)} sobre compras, o tributo líquido é maior. Este é o efeito mais impactante para o setor de serviços — historicamente subtributado em PIS/COFINS (Lei 9.718/98).`;
    } else if (fornSimples) {
      impactReason = `O aumento de ${fmt(Math.abs(diff_imposto_pago))} é agravado porque seu fornecedor está no Simples Nacional convencional, que gera apenas ~${fmtPerc(cred_sn_conv)} de crédito CBS+IBS (≈20% do IVA integral). Se o fornecedor migrasse para o Simples Híbrido ou Lucro Presumido, o crédito subiria para ${fmtPerc(aliq_iva)}, reduzindo seu tributo líquido em até ${fmt(vForn * (aliq_iva - cred_sn_conv) * perc_cred_iva)}/nota.`;
    } else {
      impactReason = `O aumento de ${fmt(Math.abs(diff_imposto_pago))} ocorre porque a alíquota IVA Dual (${fmtPerc(aliq_iva)}) supera a carga atual (${fmtPerc(aliq_piscof_emp + aliq_icms_emp)}), e os créditos de compras (${fmt(cred_iva_emp)}) não compensam integralmente o diferencial. Empresas com baixa proporção de compras tributadas sofrem mais esse efeito.`;
    }
    impactCta = '💡 Quer saber exatamente quanto vai pagar a mais com seus dados reais? Solicite um diagnóstico tributário personalizado e descubra oportunidades de economia antes da CBS entrar em vigor plena em jan/2027.';
  } else if (diff_imposto_pago < 0) {
    impactReason = `A redução de ${fmt(Math.abs(diff_imposto_pago))} ocorre porque a não-cumulatividade plena do IVA Dual permite creditar ${fmt(cred_iva_emp)} sobre compras (${fmtPerc(perc_cred_iva)} das aquisições geram crédito), compensando a alíquota maior de ${fmtPerc(aliq_iva)}. Seu fornecedor no ${input.supplierRegime} gera crédito ${getCreditoIvaForn(input.supplierRegime) >= aliq_iva ? 'integral' : 'parcial'}, favorecendo a cadeia.`;
    impactCta = '💡 Sua cadeia tem potencial de economia! Um planejamento tributário detalhado pode maximizar seus créditos e preparar contratos com cláusulas de repasse fiscal. Solicite uma análise com dados reais.';
  } else {
    impactReason = `O impacto é neutro: a carga tributária atual (${fmtPerc(aliq_piscof_emp + aliq_icms_emp)}) equivale ao IVA líquido pós-reforma. Porém, o Split Payment altera o fluxo de caixa — você receberá ${fmt(split_retido)} a menos por venda, retido automaticamente.`;
    impactCta = '💡 Mesmo sem aumento de imposto, o Split Payment impacta seu capital de giro. Simule com seus dados reais para planejar a transição e evitar descasamento de caixa em jan/2027.';
  }

  return {
    conceptualSimulation, chainEfficiency, simulationTable,
    aliq_pis_cofins_presumido: aliq_piscof_emp,
    aliq_icms_atual: aliq_icms_emp,
    aliq_iva, diff_imposto_pago, trib_liq_atual, iva_liq_emp,
    split_retido, float_perdido, cred_iva_emp, cred_total_atual,
    imp_bruto_atual, iva_bruto_emp,
    impactReason, impactCta,
  };
};

// ─── Fallback local Supply Chain ──────────────────────────────────────────────

function buildLocalSupplyChainResult(input: SupplyChainInput): Omit<SupplyChainResult, 'conceptualSimulation' | 'chainEfficiency' | 'simulationTable'> {
  const isSimples = input.companyRegime.includes('Simples') && !input.companyRegime.includes('Híbrido');
  const isB2B = input.customerType.includes('B2B');
  const fornSimples = input.supplierRegime.includes('Simples') && !input.supplierRegime.includes('Híbrido');

  return {
    currentScenario: {
      taxResiduePercent: isSimples ? 5 : 10,
      recoverableTaxPercent: isSimples ? 0 : (input.companyRegime.includes('Lucro Real') ? 70 : 5),
      description: 'Análise gerada localmente com base na LC 214/2025 e EC 132/2023.',
      inefficiencyAlert: isSimples ? 'Simples Nacional: imposto cumulativo, sem crédito B2B.' : 'Cumulatividade parcial PIS/COFINS na cadeia atual.',
    },
    reformScenario: {
      taxResiduePercent: 0,
      recoverableTaxPercent: isSimples ? 20 : 100,
      description: 'IVA Dual (CBS 8,8% + IBS 17,7% = 26,5%): não-cumulatividade plena.',
      creditGain: isSimples ? 'Crédito reduzido (~2,7%). Considere o Simples Dual.' : 'Recuperação total dos créditos CBS+IBS.',
    },
    impactSummary: {
      buyerCostReductionPercent: isB2B ? 8 : 3,
      priceCompetitiveness: isB2B ? 'Aumenta' as const : 'Mantém' as const,
      strategicAdvice: isSimples && isB2B ? 'Migre para o Simples Dual para crédito integral B2B.' : 'Avalie o regime futuro para otimizar créditos.',
    },
    flowAnalysis: {
      step1_supplier_impact: fornSimples
        ? `O fornecedor (${input.supplierSector}/${input.supplierRegime}) gera apenas ~2,7% de crédito CBS+IBS (≈20% do IVA). Considere renegociar ou exigir Simples Híbrido contratualmente.`
        : `O fornecedor (${input.supplierSector}/${input.supplierRegime}) gerará crédito integral de CBS+IBS (26,5%). Split Payment reterá automaticamente o IVA na transação.`,
      step2_company_impact: isSimples
        ? `Sua empresa (${input.companySector}/${input.companyRegime}) gera crédito reduzido (~2,7%) para clientes B2B. ${isB2B ? 'Avalie o Simples Dual.' : 'Para B2C, carga menor é vantajosa.'}`
        : `Sua empresa (${input.companySector}/${input.companyRegime}) gera crédito integral (26,5%). Split Payment reterá o IVA líquido automaticamente.`,
      step3_customer_impact: isB2B
        ? `O cliente B2B aproveitará o crédito IVA. ${isSimples ? 'Crédito reduzido diminui atratividade vs concorrentes LP/LR.' : 'Crédito integral: sua oferta é competitiva.'}`
        : `Cliente B2C arca com o IVA no preço final, sem recuperação de crédito.`,
    },
    swotAnalysis: {
      strengths: ['Não-cumulatividade plena elimina tributação em cascata (LC 214/2025)', 'Crédito automático via Split Payment', 'Simplificação: CBS+IBS substituem 5 tributos'],
      weaknesses: ['Transição 2026-2033: dois sistemas simultâneos', input.companySector.includes('Serviço') ? 'Serviços: carga sobe de ~3,65% para ~26,5% (maior impacto setorial)' : 'Alíquota IVA pode superar carga atual dependendo do mix de créditos', 'Split Payment reduz caixa líquido recebido por venda'],
      opportunities: ['Reavaliação de fornecedores por qualidade fiscal (crédito gerado)', 'Cláusulas Tax Trigger em contratos', 'PER/DCOMP: recuperação de créditos PIS/COFINS dos últimos 5 anos'],
      threats: ['Concorrentes também se beneficiam da não-cumulatividade', 'Alíquotas IBS estaduais ainda indefinidas (CGIBS)', 'Descasamento de caixa na transição: planejar capital de giro para jan/2027'],
    },
    companyRegimeComparisons: [
      { regime: `Atual: ${input.companyRegime}`, taxBurden: input.companyRegime.includes('Lucro Real') ? '9,25% + ICMS 5%' : input.companyRegime.includes('Simples') ? '~6% DAS' : '3,65% + ICMS 5%', creditGenerated: input.companyRegime.includes('Lucro Real') ? 'Integral' : input.companyRegime.includes('Simples') ? '~2,7%' : 'Sem crédito PIS/COFINS', netResult: 'Referência', recommendation: 'Compare com os cenários abaixo.' },
      { regime: 'Simples Convencional', taxBurden: '~6% DAS', creditGenerated: '~2,7% (20% IVA)', netResult: isB2B ? 'Negativo B2B' : 'Positivo B2C', recommendation: isB2B ? 'Não recomendado para B2B: crédito reduzido.' : 'Menor carga para vendas B2C.' },
      { regime: 'Simples Híbrido (Dual)', taxBurden: 'DAS parcial + IVA 26,5%', creditGenerated: 'Integral (26,5%)', netResult: isB2B ? 'Positivo B2B' : 'Negativo B2C', recommendation: isB2B ? 'Recomendado: crédito integral. Opção até SET/2026.' : 'Sobrecarga sem benefício B2C.' },
      { regime: 'Lucro Presumido / Real', taxBurden: 'IVA 26,5%', creditGenerated: 'Integral (26,5%)', netResult: isB2B ? 'Positivo B2B' : 'Neutro', recommendation: 'Crédito integral. Avaliar faturamento vs complexidade SPED.' },
    ],
  };
}

// Validador
function validateAndMergeSupplyChainResult(geminiData: any, fallback: Omit<SupplyChainResult, 'conceptualSimulation' | 'chainEfficiency' | 'simulationTable'>): Omit<SupplyChainResult, 'conceptualSimulation' | 'chainEfficiency' | 'simulationTable'> {
  const safe = (val: any, fb: any) => (val !== undefined && val !== null && val !== '') ? val : fb;
  const safeArr = (val: any, fb: any[]) => (Array.isArray(val) && val.length > 0) ? val : fb;
  return {
    currentScenario: { taxResiduePercent: safe(geminiData?.currentScenario?.taxResiduePercent, fallback.currentScenario.taxResiduePercent), recoverableTaxPercent: safe(geminiData?.currentScenario?.recoverableTaxPercent, fallback.currentScenario.recoverableTaxPercent), description: safe(geminiData?.currentScenario?.description, fallback.currentScenario.description), inefficiencyAlert: safe(geminiData?.currentScenario?.inefficiencyAlert, fallback.currentScenario.inefficiencyAlert) },
    reformScenario: { taxResiduePercent: safe(geminiData?.reformScenario?.taxResiduePercent, fallback.reformScenario.taxResiduePercent), recoverableTaxPercent: safe(geminiData?.reformScenario?.recoverableTaxPercent, fallback.reformScenario.recoverableTaxPercent), description: safe(geminiData?.reformScenario?.description, fallback.reformScenario.description), creditGain: safe(geminiData?.reformScenario?.creditGain, fallback.reformScenario.creditGain) },
    impactSummary: { buyerCostReductionPercent: safe(geminiData?.impactSummary?.buyerCostReductionPercent, fallback.impactSummary.buyerCostReductionPercent), priceCompetitiveness: safe(geminiData?.impactSummary?.priceCompetitiveness, fallback.impactSummary.priceCompetitiveness), strategicAdvice: safe(geminiData?.impactSummary?.strategicAdvice, fallback.impactSummary.strategicAdvice) },
    flowAnalysis: { step1_supplier_impact: safe(geminiData?.flowAnalysis?.step1_supplier_impact, fallback.flowAnalysis.step1_supplier_impact), step2_company_impact: safe(geminiData?.flowAnalysis?.step2_company_impact, fallback.flowAnalysis.step2_company_impact), step3_customer_impact: safe(geminiData?.flowAnalysis?.step3_customer_impact, fallback.flowAnalysis.step3_customer_impact) },
    swotAnalysis: { strengths: safeArr(geminiData?.swotAnalysis?.strengths, fallback.swotAnalysis.strengths), weaknesses: safeArr(geminiData?.swotAnalysis?.weaknesses, fallback.swotAnalysis.weaknesses), opportunities: safeArr(geminiData?.swotAnalysis?.opportunities, fallback.swotAnalysis.opportunities), threats: safeArr(geminiData?.swotAnalysis?.threats, fallback.swotAnalysis.threats) },
    companyRegimeComparisons: safeArr(geminiData?.companyRegimeComparisons, fallback.companyRegimeComparisons),
  };
}

export const analyzeSupplyChain = async (input: SupplyChainInput): Promise<SupplyChainResult> => {
  checkRateLimit('supplyChain');
  const localFallback = buildLocalSupplyChainResult(input);
  const metrics = simuladorEstrategicoIva(input);

  const prompt = `Atue como consultor tributário sênior explicando para um EMPREENDEDOR LEIGO.\nAnalise o impacto da Reforma Tributária na Cadeia de Valor.\n\nCENÁRIO: Fornecedor: ${input.supplierSector}/${input.supplierRegime} | Empresa: ${input.companySector}/${input.companyRegime} | Cliente: ${input.customerType}\n\nCONTEXTO: IVA Dual 26,5% (CBS 8,8% + IBS 17,7%), Split Payment (arts.47-55), Simples gera ~2,7% crédito, Híbrido gera integral.\n\nRetorne APENAS JSON com: flowAnalysis {step1_supplier_impact, step2_company_impact, step3_customer_impact}, swotAnalysis {strengths[], weaknesses[], opportunities[], threats[]}, companyRegimeComparisons [{regime, taxBurden, creditGenerated, netResult, recommendation}], currentScenario {taxResiduePercent, recoverableTaxPercent, description, inefficiencyAlert}, reformScenario {taxResiduePercent, recoverableTaxPercent, description, creditGain}, impactSummary {buyerCostReductionPercent, priceCompetitiveness, strategicAdvice}.\n\nREGRAS: linguagem simples, 4 regimes em comparisons, sem simulationTable/conceptualSimulation/chainEfficiency. JSON válido sem markdown.`;

  try {
    const geminiResult = await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({ model, contents: prompt, config: { systemInstruction: SYSTEM_INSTRUCTION_BASE, responseMimeType: 'application/json' } });
      return JSON.parse(cleanJsonOutput(response.text));
    });
    return { ...validateAndMergeSupplyChainResult(geminiResult, localFallback), ...metrics };
  } catch (error) {
    console.error('[Gemini] Supply chain error:', error);
    return { ...localFallback, ...metrics };
  }
};

// ─── Interpreter ──────────────────────────────────────────────────────────────
export const interpretLegalText = async (text: string, role: UserRole): Promise<string> => {
  checkRateLimit('interpreter');
  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({ model, contents: `Analise o texto legislativo: "${text}" Para o perfil: ${role} Formate em Markdown.`, config: { systemInstruction: SYSTEM_INSTRUCTION_BASE + '\n' + getRoleInstruction(role) } });
      return response.text || 'Sem resposta.';
    });
  } catch (error) { console.error('[Gemini] Interpreter error:', error); return 'Não foi possível interpretar o texto no momento.'; }
};

// ─── Consultant ───────────────────────────────────────────────────────────────
export const askTaxConsultant = async (question: string, role: UserRole): Promise<string> => {
  checkRateLimit('consultant');
  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({ model, contents: `PERGUNTA (${role}): "${question}" Responda como JaxAI. Use Markdown.`, config: { tools: [{ googleSearch: {} }], systemInstruction: SYSTEM_INSTRUCTION_BASE + '\n' + getRoleInstruction(role) } });
      return response.text || 'Sem resposta.';
    });
  } catch (error) { console.error('[Gemini] Consultant error:', error); return 'JaxAI: Servidores sobrecarregados. Tente em instantes.'; }
};

// ─── Action Guide ─────────────────────────────────────────────────────────────
export const getActionGuide = async (actionId: string, actionTitle: string): Promise<any> => {
  checkRateLimit('actionGuide');
  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({ model, contents: `Crie guia passo a passo para: "${actionTitle}" (ID: ${actionId})\nRetorne APENAS JSON: { title, description, legislation, steps: [{title, description}], tips: [string] }`, config: { systemInstruction: SYSTEM_INSTRUCTION_BASE, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, legislation: { type: Type.STRING }, steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'description'] } }, tips: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['title', 'description', 'legislation', 'steps', 'tips'] } } });
      return JSON.parse(cleanJsonOutput(response.text));
    });
  } catch (error) {
    console.error('[Gemini] Action guide error:', error);
    return { title: actionTitle, description: 'Guia offline.', legislation: 'EC 132/2023', steps: [{ title: 'Mapeamento', description: 'Reúna informações do ERP.' }, { title: 'Análise', description: 'Avalie impacto.' }, { title: 'Plano', description: 'Defina responsáveis.' }], tips: ['Consulte seu contador.'] };
  }
};

// ─── Aliases ─────────────────────────────────────────────────────────────────
export const fetchLatestUpdates = fetchTaxNews;
export const runSupplyChainAnalysis = analyzeSupplyChain;

// ─── Accountant Guide ─────────────────────────────────────────────────────────
export const getAccountantStrategicGuide = async (): Promise<AccountantGuideData> => {
  checkRateLimit('accountant');
  try {
    return await withModelFallback(async (model) => {
      const response = await ai.models.generateContent({ model, contents: `Gere guia estratégico para Contadores 2026.\nRetorne APENAS JSON: { profileShift: {from, to, description}, competencies: [{title, description, icon}], actionPlan: [{phase, actions: []}], consultancyTips: [] }`, config: { systemInstruction: SYSTEM_INSTRUCTION_BASE + '\n' + getRoleInstruction(UserRole.CONTADOR), responseMimeType: 'application/json' } });
      return JSON.parse(cleanJsonOutput(response.text)) as AccountantGuideData;
    });
  } catch (error) {
    console.error('[Gemini] Accountant guide error:', error);
    return { profileShift: { from: 'Operador Reativo', to: 'Arquiteto Fiscal Proativo', description: 'Modo offline.' }, competencies: [{ title: 'Visão Estratégica', description: 'Análise de impacto.', icon: 'Brain' }], actionPlan: [{ phase: 'Imediato', actions: ['Revisar NCMs', 'Simular Carga'] }], consultancyTips: ['Diagnóstico preventivo.'] };
  }
};
