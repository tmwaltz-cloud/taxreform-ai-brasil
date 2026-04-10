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

// ─── Modelos com fallback em cascata ─────────────────────────────────────────
// Tenta o mais capaz primeiro; se der 503, cai para o próximo
const MODELS = [
  'gemini-2.5-flash',   // 1º — mais capaz, mas sobrecarregado
  'gemini-2.0-flash',   // 2º — estável e rápido
  'gemini-1.5-flash',   // 3º — fallback final garantido
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
  retriesPerModel = 2,
  baseDelay = 2000
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

export const fetchTaxNews = async (): Promise<NewsItem[]> => {
  const now = Date.now();
  if (newsCache.data && now - newsCache.timestamp < NEWS_CACHE_DURATION_MS) {
    return newsCache.data;
  }
  checkRateLimit('news');

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `
    DATA ATUAL: ${currentDate}
    Você é analista tributário. Busque as últimas notícias sobre Reforma Tributária Brasileira.
    Retorne APENAS JSON: array de objetos com: id (string), title, summary, source, date, category, urgency (low|medium|high), url (se disponível).
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

// (mantém simuladorEstrategicoIva do original — função local, sem Gemini)
const simuladorEstrategicoIva = (input: SupplyChainInput) => {
  const aliquotaIva = 0.265;
  const fatorSimples = 0.2;
  const creditoFornecedorRegular = input.supplierRegime !== 'Simples Nacional' ? aliquotaIva : aliquotaIva * fatorSimples;
  const creditoClienteRegular = input.companyRegime !== 'Simples Nacional' ? aliquotaIva : aliquotaIva * fatorSimples;

  const conceptualSimulation = {
    fornecedor: { valorVenda: 1000, ibsCbsGerado: +(1000 * aliquotaIva).toFixed(2), creditoRecebido: 0, impostoLiquido: +(1000 * aliquotaIva).toFixed(2) },
    suaEmpresa: { valorVenda: 1500, ibsCbsGerado: +(1500 * aliquotaIva).toFixed(2), creditoRecebido: +(1000 * creditoFornecedorRegular).toFixed(2), impostoLiquido: +((1500 * aliquotaIva) - (1000 * creditoFornecedorRegular)).toFixed(2) },
    cliente:    { valorVenda: 2000, ibsCbsGerado: +(2000 * aliquotaIva).toFixed(2), creditoRecebido: +(1500 * creditoClienteRegular).toFixed(2), impostoLiquido: +((2000 * aliquotaIva) - (1500 * creditoClienteRegular)).toFixed(2) },
  };

  const totalAtual  = conceptualSimulation.fornecedor.impostoLiquido + conceptualSimulation.suaEmpresa.impostoLiquido + conceptualSimulation.cliente.impostoLiquido;
  const chainEfficiency = { totalTaxPaidChain: +totalAtual.toFixed(2), idealTax: +(2000 * aliquotaIva).toFixed(2), inefficiencyPercent: +(((totalAtual - 2000 * aliquotaIva) / (2000 * aliquotaIva)) * 100).toFixed(1) };

  const simulationTable = [
    { etapa: 'Fornecedor',   valorVenda: `R$ ${conceptualSimulation.fornecedor.valorVenda.toFixed(2)}`, ibsCbsDebito: `R$ ${conceptualSimulation.fornecedor.ibsCbsGerado.toFixed(2)}`, creditoSplit: `R$ 0,00`, impostoLiquido: `R$ ${conceptualSimulation.fornecedor.impostoLiquido.toFixed(2)}` },
    { etapa: 'Sua Empresa',  valorVenda: `R$ ${conceptualSimulation.suaEmpresa.valorVenda.toFixed(2)}`, ibsCbsDebito: `R$ ${conceptualSimulation.suaEmpresa.ibsCbsGerado.toFixed(2)}`, creditoSplit: `R$ ${conceptualSimulation.suaEmpresa.creditoRecebido.toFixed(2)}`, impostoLiquido: `R$ ${conceptualSimulation.suaEmpresa.impostoLiquido.toFixed(2)}` },
    { etapa: 'Cliente Final', valorVenda: `R$ ${conceptualSimulation.cliente.valorVenda.toFixed(2)}`, ibsCbsDebito: `R$ ${conceptualSimulation.cliente.ibsCbsGerado.toFixed(2)}`, creditoSplit: `R$ ${conceptualSimulation.cliente.creditoRecebido.toFixed(2)}`, impostoLiquido: `R$ ${conceptualSimulation.cliente.impostoLiquido.toFixed(2)}` },
  ];

  return { conceptualSimulation, chainEfficiency, simulationTable };
};

export const analyzeSupplyChain = async (input: SupplyChainInput): Promise<SupplyChainResult> => {
  checkRateLimit('supplyChain');

  const prompt = `
    Atue como consultor tributário explicando para um EMPREENDEDOR LEIGO.
    Analise o impacto tributário na Cadeia de Valor: Fornecedor -> Sua Empresa -> Cliente.
    CENÁRIO: Fornecedor: ${input.supplierSector}/${input.supplierRegime} | Empresa: ${input.companySector}/${input.companyRegime} | Cliente: ${input.customerType}
    Retorne JSON com: currentScenario, reformScenario, impactSummary, flowAnalysis, swotAnalysis, simulationTable, conceptualSimulation, chainEfficiency, companyRegimeComparisons.
    JSON válido sem markdown.
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
