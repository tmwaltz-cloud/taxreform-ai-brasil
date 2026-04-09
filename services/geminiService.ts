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

// ─── Timeline dinâmico ────────────────────────────────────────────────────
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
    // ⚠️ googleSearch NÃO é compatível com responseMimeType — usar só systemInstruction
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
      },
    });

    const items = JSON.parse(cleanJsonOutput(response.text)) as TimelineItem[];
    timelineCache.data = items;
    timelineCache.timestamp = now;
    return items;

  } catch (error) {
    console.warn('fetchReformTimeline error (fallback):', error);
    const fallback: TimelineItem[] = [
      { period: 'Jan 2026', status: 'done', title: 'NF-e com IBS e CBS obrigatória', description: 'Empresas do regime geral passaram a destacar IBS (0,1%) e CBS (0,9%) nas notas fiscais.', urgencyTag: 'CONCLUÍDO' },
      { period: 'Abr 2026', status: 'current', title: 'Fim da tolerância para erros', description: 'A Receita Federal encerrou o prazo de tolerância para erros nas obrigações acessórias.', urgencyTag: 'AGORA' },
      { period: 'Set 2026', status: 'warning', title: 'Decisão: Simples Híbrido', description: 'Prazo estimado para empresas do Simples optarem pelo Regime Híbrido.', urgencyTag: 'DECISIVO' },
      { period: '2027', status: 'upcoming', title: 'Extinção do PIS/COFINS', description: 'CBS entra com alíquota cheia (~8,8%). PIS, COFINS e IPI extintos.', urgencyTag: 'CRÍTICO' },
      { period: '2029–2032', status: 'future', title: 'Escalonamento IBS', description: 'Redução progressiva do ICMS e ISS.' },
      { period: '2033', status: 'future', title: 'Sistema tributário pleno', description: 'Extinção total do ICMS e ISS. IVA Dual em vigência plena.' },
    ];
    timelineCache.data = fallback;
    timelineCache.timestamp = now;
    return fallback;
  }
};

// ─── News ─────────────────────────────────────────────────────────────────
const newsCache: { [key: string]: { data: NewsItem[], timestamp: number } } = {};
const CACHE_DURATION_MS = 1000 * 60 * 15;

export const fetchLatestUpdates = async (role: UserRole, topic?: string): Promise<NewsItem[]> => {
  const cacheKey = `${role}-${topic || 'general'}`;
  const now = Date.now();
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp < CACHE_DURATION_MS)) {
    return newsCache[cacheKey].data;
  }

  const model = "gemini-2.5-flash";
  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const topicContext = topic ? `Foque especificamente no tópico: ${topic}.` : '';

  const prompt = `
    DATA E HORA DO ACESSO: ${currentDate} às ${currentTime}.
    Atue como algoritmo de "Trending Topics" Financeiro/Tributário em Tempo Real.
    Busque notícias MAIS RECENTES (últimas 24h a 7 dias) sobre Reforma Tributária do Brasil (IBS/CBS, PLP 68/2024, Receita Federal).
    ${topicContext}
    Retorne JSON com 3 a 4 itens. Cada item: title, summary, impactLevel ("Alto"/"Médio"/"Baixo"), date, sourceUrl.
    IMPORTANTE: JSON válido sem markdown. Data de hoje: ${currentDate}.
  `;

  try {
    // ⚠️ googleSearch NÃO é compatível com responseMimeType
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + getRoleInstruction(role)
      }
    });

    const jsonText = cleanJsonOutput(response.text);
    const items = JSON.parse(jsonText) as NewsItem[];
    newsCache[cacheKey] = { data: items, timestamp: now };
    return items;
  } catch (error: any) {
    console.warn("Error fetching updates (fallback):", error.message);
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return [
      { title: "IBS e CBS: Regulamentação em Pauta (Modo Offline)", summary: "O sistema não conseguiu conectar aos servidores de notícias em tempo real. Acompanhe a tramitação final do PLP 68/2024 no Senado.", impactLevel: "Alto", date: todayStr },
      { title: "Split Payment: Preparação Bancária", summary: "Bancos seguem adaptando sistemas para a retenção automática do imposto.", impactLevel: "Médio", date: todayStr },
      { title: "Simples Nacional e Créditos", summary: "Empresas do Simples que não optarem pelo regime híbrido podem perder competitividade em cadeias B2B longas.", impactLevel: "Alto", date: todayStr }
    ];
  }
};

// ─── Tax Simulation ───────────────────────────────────────────────────────
export const runTaxSimulation = async (input: SimulationInput, role: UserRole): Promise<SimulationResult> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Realize uma simulação de impactos da Reforma Tributária (EC 132/2023).
    DADOS:
    - Faturamento: R$ ${input.annualRevenue}
    - Compras: R$ ${input.annualCosts}
    - Regime: ${input.regime}
    - Setor: ${input.sector}
    - % Crédito Entrada: ${input.creditGenerationPercentage}%
    - Clientes: ${input.customerProfile}
    - Fornecedores: ${input.supplierRegime}
    REGRAS 2026-2033:
    1. 2026: Teste (0.9% CBS + 0.1% IBS).
    2. 2027: Extinção PIS/COFINS. CBS Cheia (~9%). IBS 0.1%.
    3. 2029-2032: Escalonamento IBS. Redução ICMS/ISS.
    4. 2033: Vigência Plena (CBS+IBS).
    Gere JSON estritamente válido. Não use markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_SIMULATOR,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentLoad: { type: Type.OBJECT, properties: { total: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }, breakdown: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } } } } },
            reformLoad: { type: Type.OBJECT, properties: { total: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }, breakdown: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } } } } },
            transitionProjection: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { year: { type: Type.NUMBER }, phase: { type: Type.STRING }, currentSystemLoad: { type: Type.NUMBER }, reformSystemLoad: { type: Type.NUMBER }, totalLoad: { type: Type.NUMBER }, description: { type: Type.STRING } } } },
            purchaseAnalysis: { type: Type.OBJECT, properties: { current: { type: Type.OBJECT, properties: { grossValue: { type: Type.NUMBER }, taxesInside: { type: Type.NUMBER }, netValue: { type: Type.NUMBER }, creditTaken: { type: Type.NUMBER } } }, reform: { type: Type.OBJECT, properties: { netValue: { type: Type.NUMBER }, ivaOutside: { type: Type.NUMBER }, newGrossValue: { type: Type.NUMBER }, creditFuture: { type: Type.NUMBER } } }, creditLossIfSimples: { type: Type.NUMBER } } },
            creditEfficiency: { type: Type.OBJECT, properties: { grossPurchaseValue: { type: Type.NUMBER }, supplierTaxCredit: { type: Type.NUMBER }, netAcquisitionCost: { type: Type.NUMBER }, costWithoutCredit: { type: Type.NUMBER }, efficiencyGain: { type: Type.NUMBER }, taxLiabilityOnSale: { type: Type.NUMBER }, netTaxPayable: { type: Type.NUMBER }, cashFlowDescription: { type: Type.STRING } } },
            marginAnalysis: { type: Type.OBJECT, properties: { currentMarginPercent: { type: Type.NUMBER }, newMarginPercent: { type: Type.NUMBER }, costImpactDescription: { type: Type.STRING }, isB2C: { type: Type.BOOLEAN } } },
            negotiationStrategy: { type: Type.OBJECT, properties: { requiredSupplierDiscount: { type: Type.NUMBER }, requiredPriceIncrease: { type: Type.NUMBER }, creditLossValue: { type: Type.NUMBER }, explanation: { type: Type.STRING } } },
            analysis: { type: Type.STRING },
            cashFlowImpact: { type: Type.STRING },
            strategicAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            roleSpecificInsights: { type: Type.OBJECT, properties: { empresario: { type: Type.ARRAY, items: { type: Type.STRING } }, contador: { type: Type.ARRAY, items: { type: Type.STRING } }, advogado: { type: Type.ARRAY, items: { type: Type.STRING } }, financeiro: { type: Type.ARRAY, items: { type: Type.STRING } } } }
          }
        }
      }
    });
    const cleanJson = cleanJsonOutput(response.text);
    return JSON.parse(cleanJson) as SimulationResult;
  } catch (error) {
    console.error("Simulation error:", error);
    return {
      currentLoad: { total: input.annualRevenue * 0.18, percentage: 18, breakdown: [{ name: 'PIS/COFINS/ICMS', value: input.annualRevenue * 0.18 }] },
      reformLoad: { total: input.annualRevenue * 0.25, percentage: 25, breakdown: [{ name: 'IBS/CBS', value: input.annualRevenue * 0.25 }] },
      transitionProjection: [
        { year: 2026, phase: 'Teste', currentSystemLoad: 10000, reformSystemLoad: 1000, totalLoad: 11000, description: 'Fase de Teste' },
        { year: 2027, phase: 'Virada', currentSystemLoad: 8000, reformSystemLoad: 3000, totalLoad: 11000, description: 'Início CBS' }
      ],
      purchaseAnalysis: { current: { grossValue: 1000, taxesInside: 180, netValue: 820, creditTaken: 180 }, reform: { netValue: 820, ivaOutside: 200, newGrossValue: 1020, creditFuture: 200 }, creditLossIfSimples: 0 },
      creditEfficiency: { grossPurchaseValue: 0, supplierTaxCredit: 0, netAcquisitionCost: 0, costWithoutCredit: 0, efficiencyGain: 0, taxLiabilityOnSale: 0, netTaxPayable: 0, cashFlowDescription: 'Simulação offline' },
      marginAnalysis: { currentMarginPercent: 15, newMarginPercent: 12, costImpactDescription: 'Redução estimada', isB2C: false },
      negotiationStrategy: { requiredSupplierDiscount: 5, requiredPriceIncrease: 0, creditLossValue: 0, explanation: 'Dados simulados (Erro API)' },
      analysis: "O sistema não pôde processar a simulação em tempo real. Tente novamente em alguns instantes.",
      cashFlowImpact: "Não calculado (Offline)",
      strategicAlerts: ["Verifique sua conexão ou tente novamente."],
      roleSpecificInsights: { empresario: [], contador: [], advogado: [], financeiro: [] }
    } as SimulationResult;
  }
};

// ─── Supply Chain ─────────────────────────────────────────────────────────
export function simuladorEstrategicoIva(input: SupplyChainInput, futureRegime?: string) {
  const valor_base = 1000.00;
  const preco_venda_atual = 1500.00;
  let aliq_iva = 0.275;
  if (futureRegime === 'Simples Nacional') aliq_iva = 0.10;
  const aliq_pis_cofins_presumido = 0.0365;
  const aliq_credito_atual = 0.0925;
  const compra_atual_bruta = valor_base;
  const credito_atual = compra_atual_bruta * aliq_credito_atual;
  const custo_atual_liquido = compra_atual_bruta - credito_atual;
  const imposto_venda_atual = preco_venda_atual * aliq_pis_cofins_presumido;
  const margem_atual_bruta = preco_venda_atual - custo_atual_liquido - imposto_venda_atual;
  const compra_reforma_bruta = valor_base;
  const credito_reforma = input.supplierRegime === 'Simples Nacional' ? 0 : compra_reforma_bruta * aliq_iva;
  const custo_reforma_liquido = compra_reforma_bruta - credito_reforma;
  const preco_venda_reforma = (custo_reforma_liquido + margem_atual_bruta) / (1 - aliq_iva);
  const imposto_venda_reforma = preco_venda_reforma * aliq_iva;
  const imposto_liquido_reforma = imposto_venda_reforma - credito_reforma;
  const diff_imposto_pago = imposto_liquido_reforma - imposto_venda_atual;
  const var_preco_venda = ((preco_venda_reforma / preco_venda_atual) - 1) * 100;
  const nova_margem_percentual = (margem_atual_bruta / preco_venda_reforma) * 100;
  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;
  const conceptualSimulation = [
    { etapa: "1. Custo de Aquisição (Bruto)", atual: formatCurrency(compra_atual_bruta), reforma: formatCurrency(compra_reforma_bruta) },
    { etapa: "2. (-) Créditos Tributários na Compra", atual: formatCurrency(credito_atual), reforma: formatCurrency(credito_reforma) },
    { etapa: "3. (=) Custo Líquido da Mercadoria", atual: formatCurrency(custo_atual_liquido), reforma: formatCurrency(custo_reforma_liquido) },
    { etapa: "4. (+) Margem de Lucro (Desejada)", atual: formatCurrency(margem_atual_bruta), reforma: formatCurrency(margem_atual_bruta) },
    { etapa: "5. (+) Impostos sobre a Venda", atual: formatCurrency(imposto_venda_atual), reforma: formatCurrency(imposto_venda_reforma) },
    { etapa: "6. (=) Preço de Venda Final", atual: formatCurrency(preco_venda_atual), reforma: formatCurrency(preco_venda_reforma) }
  ];
  const chainEfficiency = {
    currentFinalCost: formatCurrency(preco_venda_atual),
    reformFinalCost: formatCurrency(preco_venda_reforma),
    efficiencyGain: `${var_preco_venda > 0 ? '+' : ''}${var_preco_venda.toFixed(1)}% no Preço`,
    description: `Para manter a mesma margem em reais (R$ ${margem_atual_bruta.toFixed(2)}), o preço variou ${var_preco_venda.toFixed(1)}%. Diferença de imposto pago: R$ ${diff_imposto_pago.toFixed(2)}. Nova margem: ${nova_margem_percentual.toFixed(1)}%.`
  };
  const simulationTable = [
    { etapa: "Compra Fornecedor", valorVenda: formatCurrency(compra_reforma_bruta), ibsCbsDebito: formatCurrency(credito_reforma), creditoSplit: "R$ 0,00", impostoLiquido: formatCurrency(credito_reforma) },
    { etapa: "Sua Empresa", valorVenda: formatCurrency(preco_venda_reforma), ibsCbsDebito: formatCurrency(imposto_venda_reforma), creditoSplit: formatCurrency(credito_reforma), impostoLiquido: formatCurrency(imposto_liquido_reforma) }
  ];
  return { conceptualSimulation, chainEfficiency, simulationTable, diff_imposto_pago, aliq_iva, aliq_pis_cofins_presumido };
}

export const runSupplyChainAnalysis = async (input: SupplyChainInput): Promise<SupplyChainResult> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Atue como consultor tributário explicando para um EMPREENDEDOR LEIGO.
    Analise o impacto tributário na Cadeia de Valor: Fornecedor -> Sua Empresa -> Cliente.
    CENÁRIO: Fornecedor: ${input.supplierSector}/${input.supplierRegime} | Empresa: ${input.companySector}/${input.companyRegime} | Cliente: ${input.customerType}
    Retorne JSON com: currentScenario, reformScenario, impactSummary, flowAnalysis, swotAnalysis, simulationTable, conceptualSimulation, chainEfficiency, companyRegimeComparisons.
    JSON válido sem markdown.
  `;
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json"
      }
    });
    const cleanJson = cleanJsonOutput(response.text);
    const result = JSON.parse(cleanJson) as SupplyChainResult;
    const metrics = simuladorEstrategicoIva(input);
    result.conceptualSimulation = metrics.conceptualSimulation;
    result.chainEfficiency = metrics.chainEfficiency;
    result.simulationTable = metrics.simulationTable;
    return result;
  } catch (error) {
    console.error("Supply chain error:", error);
    return {
      currentScenario: { taxResiduePercent: 10, recoverableTaxPercent: 5, description: "Hoje você paga imposto sobre imposto.", inefficiencyAlert: "Custo oculto na cadeia." },
      reformScenario: { taxResiduePercent: 0, recoverableTaxPercent: 100, description: "No futuro, o imposto será transparente.", creditGain: "Recuperação total." },
      impactSummary: { buyerCostReductionPercent: 5, priceCompetitiveness: "Aumenta", strategicAdvice: "Avalie mudar para o regime híbrido." },
      flowAnalysis: { step1_supplier_impact: "Fornecedor não gera crédito total.", step2_company_impact: "Empresa repassa custo.", step3_customer_impact: "Cliente paga mais caro." },
      swotAnalysis: { strengths: ["Crédito imediato (Split Payment)"], weaknesses: ["Aumento B2C"], opportunities: ["Revisão contratos Simples"], threats: ["Perda clientes B2B"] },
      companyRegimeComparisons: [
        { regime: "Simples Nacional", taxBurden: "Menor carga", creditGenerated: "Não gera crédito", netResult: "Perda B2B", recommendation: "Só pessoa física." },
        { regime: "Simples Híbrido", taxBurden: "Média", creditGenerated: "Gera crédito integral", netResult: "Ganho B2B", recommendation: "Ideal para B2B." },
        { regime: "Lucro Presumido", taxBurden: "Alta", creditGenerated: "Gera crédito integral", netResult: "Neutro", recommendation: "Avaliar custos." },
        { regime: "Lucro Real", taxBurden: "Sobre lucro", creditGenerated: "Gera crédito integral", netResult: "Ganho margem baixa", recommendation: "Margens apertadas." }
      ],
      simulationTable: [
        { etapa: "Fornecedor", valorVenda: "R$ 1.000,00", ibsCbsDebito: "R$ 285,00", creditoSplit: "R$ 0,00", impostoLiquido: "R$ 285,00" },
        { etapa: "Sua Empresa", valorVenda: "R$ 1.500,00", ibsCbsDebito: "R$ 427,50", creditoSplit: "R$ 285,00", impostoLiquido: "R$ 142,50" },
        { etapa: "Cliente Final", valorVenda: "R$ 2.000,00", ibsCbsDebito: "R$ 570,00", creditoSplit: "R$ 427,50", impostoLiquido: "R$ 142,50" }
      ]
    };
  }
};

// ─── Interpreter ──────────────────────────────────────────────────────────
export const interpretLegalText = async (text: string, role: UserRole): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `Analise o texto legislativo: "${text}" Para o perfil: ${role} Formate em Markdown.`;
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + getRoleInstruction(role) }
    });
    return response.text || "Sem resposta.";
  } catch (error) {
    console.error("Interpretation error", error);
    return "Não foi possível interpretar o texto no momento.";
  }
};

// ─── Consultant ───────────────────────────────────────────────────────────
export const askTaxConsultant = async (question: string, role: UserRole): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `PERGUNTA (${role}): "${question}" Responda como JaxAI (Consultor Tributário). Use Markdown.`;
  try {
    // ⚠️ googleSearch NÃO é compatível com responseMimeType — OK aqui pois não usamos responseMimeType
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + getRoleInstruction(role),
      }
    });
    return response.text || "Sem resposta.";
  } catch (error) {
    console.error("Consultant error", error);
    return "JaxAI: No momento, meus servidores de consulta estão sobrecarregados. Por favor, tente novamente em alguns instantes.";
  }
};

// ─── Action Guide ─────────────────────────────────────────────────────────
export const getActionGuide = async (actionId: string, actionTitle: string): Promise<any> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Você é consultor tributário especialista na Reforma Tributária Brasileira (EC 132/2023, PLP 68/2024).
    Crie um guia passo a passo para a ação: "${actionTitle}" (ID: ${actionId})
    Retorne APENAS JSON: { title, description, legislation, steps: [{title, description}], tips: [string] }
  `;
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            legislation: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "legislation", "steps", "tips"]
        }
      }
    });
    return JSON.parse(cleanJsonOutput(response.text));
  } catch (error) {
    console.error("Action guide error:", error);
    return {
      title: actionTitle,
      description: "Guia gerado em modo offline.",
      legislation: "Reforma Tributária (EC 132/2023)",
      steps: [
        { title: "Mapeamento Inicial", description: "Reúna as informações necessárias do seu ERP." },
        { title: "Análise de Impacto", description: "Avalie como as novas regras afetam esta área." },
        { title: "Plano de Ação", description: "Defina responsáveis e prazos." }
      ],
      tips: ["Consulte seu contador ou advogado tributarista para validação final."]
    };
  }
};

// ─── Accountant Guide ─────────────────────────────────────────────────────
export const getAccountantStrategicGuide = async (): Promise<AccountantGuideData> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Gere guia estratégico para Contadores 2026 sobre a Reforma Tributária.
    Retorne APENAS JSON: { profileShift: {from, to, description}, competencies: [{title, description, icon}], actionPlan: [{phase, actions: []}], consultancyTips: [] }
  `;
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + getRoleInstruction(UserRole.CONTADOR),
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(cleanJsonOutput(response.text)) as AccountantGuideData;
  } catch (error) {
    console.error("Accountant guide error:", error);
    return {
      profileShift: { from: "Operador de Conformidade (Reativo)", to: "Arquiteto da Estratégia Fiscal (Proativo)", description: "Mudança para análise estratégica (Modo Offline)." },
      competencies: [
        { title: "Visão Estratégica", description: "Análise de impacto no negócio.", icon: "Brain" },
        { title: "Domínio Tecnológico", description: "Automação fiscal.", icon: "Cpu" }
      ],
      actionPlan: [{ phase: "Imediato", actions: ["Revisar NCMs", "Simular Carga"] }],
      consultancyTips: ["Ofereça diagnóstico preventivo."]
    };
  }
};
