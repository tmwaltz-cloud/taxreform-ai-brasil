import { GoogleGenAI, Type } from "@google/genai";
import { UserRole, SimulationInput, SimulationResult, NewsItem, SupplyChainInput, SupplyChainResult, AccountantGuideData } from "../types";

// Initialize Gemini Client
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

// Helper to clean JSON output from LLM which might include markdown code blocks
const cleanJsonOutput = (text: string | undefined): string => {
  if (!text) return "[]";
  // Remove markdown code blocks ```json and ```
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

// ─── Tipo para itens do cronograma dinâmico ───────────────────────────────
export interface TimelineItem {
  period: string;       // Ex: "Janeiro 2026", "2027", "Setembro 2026"
  status: 'done' | 'current' | 'warning' | 'upcoming' | 'future';
  title: string;
  description: string;
  urgencyTag?: string;  // Ex: "CONCLUÍDO", "AGORA", "DECISIVO", "ATENÇÃO"
}

// Cache do cronograma — 24 horas
const timelineCache: { data: TimelineItem[] | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const TIMELINE_CACHE_DURATION_MS = 1000 * 60 * 60 * 24; // 24 horas

export const fetchReformTimeline = async (): Promise<TimelineItem[]> => {
  const now = Date.now();

  // Retorna cache se ainda válido
  if (timelineCache.data && now - timelineCache.timestamp < TIMELINE_CACHE_DURATION_MS) {
    return timelineCache.data;
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const prompt = `
    DATA DE HOJE: ${currentDate}

    Você é um especialista em Reforma Tributária Brasileira (EC 132/2023, LC 214/2025).
    
    Gere um cronograma atualizado da transição tributária com base na data de hoje.
    
    REGRAS:
    1. Marcos já passados devem ter status "done"
    2. O marco atual (mês/período presente) deve ter status "current"  
    3. Marcos urgentes nos próximos 3 meses: status "warning"
    4. Marcos futuros importantes: status "upcoming"
    5. Marcos distantes (2029+): status "future"
    6. Seja preciso com as datas — não invente prazos
    7. Inclua apenas marcos com impacto real para empresas e contadores
    8. Máximo 6 itens para manter clareza visual
    
    MARCOS CONHECIDOS (valide e atualize conforme legislação mais recente):
    - Jan/2026: Início destaque IBS/CBS nas NF-e (caráter informativo)
    - Abr/2026: Fim da tolerância para erros nas obrigações acessórias
    - 2027: Extinção PIS/COFINS, CBS cheia (~8,8%), IPI zerado
    - 2027: Simples Nacional — decisão sobre regime híbrido
    - 2029-2032: Escalonamento IBS, redução ICMS/ISS
    - 2033: Sistema pleno — ICMS e ISS extintos

    Retorne APENAS JSON válido, sem markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              period:     { type: Type.STRING },
              status:     { type: Type.STRING, enum: ['done', 'current', 'warning', 'upcoming', 'future'] },
              title:      { type: Type.STRING },
              description:{ type: Type.STRING },
              urgencyTag: { type: Type.STRING },
            },
            required: ['period', 'status', 'title', 'description'],
          },
        },
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
      },
    });

    const items = JSON.parse(cleanJsonOutput(response.text)) as TimelineItem[];
    timelineCache.data = items;
    timelineCache.timestamp = now;
    return items;

  } catch (error) {
    console.warn('fetchReformTimeline error (usando fallback):', error);

    // Fallback estático atualizado para abril/2026
    const fallback: TimelineItem[] = [
      {
        period: 'Jan 2026',
        status: 'done',
        title: 'NF-e com IBS e CBS obrigatória',
        description: 'Empresas do regime geral passaram a destacar IBS (0,1%) e CBS (0,9%) nas notas fiscais. Caráter informativo — sem recolhimento real.',
        urgencyTag: 'CONCLUÍDO',
      },
      {
        period: 'Abr 2026',
        status: 'current',
        title: 'Fim da tolerância para erros',
        description: 'A Receita Federal encerrou o prazo de tolerância para erros nas obrigações acessórias. ERPs devem estar com os campos de IBS/CBS corretamente configurados.',
        urgencyTag: 'AGORA',
      },
      {
        period: 'Set 2026',
        status: 'warning',
        title: 'Decisão: Simples Híbrido',
        description: 'Prazo estimado para empresas do Simples optarem pelo Regime Híbrido (pagar IBS/CBS por fora para transferir crédito integral a clientes B2B). Quem perder pode perder contratos.',
        urgencyTag: 'DECISIVO',
      },
      {
        period: '2027',
        status: 'upcoming',
        title: 'Extinção do PIS/COFINS',
        description: 'CBS entra com alíquota cheia (~8,8%). PIS, COFINS e IPI extintos (exceto Zona Franca de Manaus). Cobrança efetiva de IBS e CBS começa.',
        urgencyTag: 'CRÍTICO',
      },
      {
        period: '2029–2032',
        status: 'future',
        title: 'Escalonamento IBS',
        description: 'Redução progressiva do ICMS e ISS. IBS aumenta gradualmente até cobrir 100% da base estadual/municipal.',
      },
      {
        period: '2033',
        status: 'future',
        title: 'Sistema tributário pleno',
        description: 'Extinção total do ICMS e ISS. IVA Dual (IBS + CBS) em vigência plena. Novo modelo tributário brasileiro consolidado.',
      },
    ];

    timelineCache.data = fallback;
    timelineCache.timestamp = now;
    return fallback;
  }
};

// Simple in-memory cache for news updates to improve response time
const newsCache: { [key: string]: { data: NewsItem[], timestamp: number } } = {};
const CACHE_DURATION_MS = 1000 * 60 * 15; // 15 minutes

export const fetchLatestUpdates = async (role: UserRole, topic?: string): Promise<NewsItem[]> => {
  const cacheKey = `${role}-${topic || 'general'}`;
  const now = Date.now();

  // Return cached data if valid
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp < CACHE_DURATION_MS)) {
    return newsCache[cacheKey].data;
  }

  // Switched to flash-preview to reduce quota usage and improve speed.
  const model = "gemini-2.5-flash"; 
  
  // Capture the actual current date for real-time relevance
  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const topicContext = topic ? `Foque especificamente no tópico: ${topic}.` : '';

  const prompt = `
    DATA E HORA DO ACESSO: ${currentDate} às ${currentTime}.
    
    AÇÃO: Atue como um algoritmo de "Trending Topics" Financeiro/Tributário em Tempo Real.
    Realize uma busca no Google para identificar as notícias MAIS RECENTES (últimas 24h a 7 dias) sobre a Reforma Tributária do Brasil (IBS/CBS, PLP 68/2024, Regulamentação, Receita Federal).
    ${topicContext}

    CRITÉRIOS DE CURADORIA (Prioridade Máxima):
    1. O que aconteceu HOJE ou ONTEM que impacta as empresas?
    2. Busque por tramitações recentes no Senado/Câmara, novas portarias da Receita ou falas do Ministro da Fazenda.
    3. Identifique "Keywords" em alta agora (ex: "Split Payment", "Trava Bancária", "Simples Nacional", "Desoneração").
    
    FONTES RECOMENDADAS PARA BUSCA:
    - Diário Oficial da União (DOU)
    - Comitê Gestor do IBS
    - ConJur (Consultor Jurídico)
    - Valor Econômico
    - Receita Federal

    SAÍDA ESPERADA (JSON):
    Retorne um JSON com 3 a 4 itens (para garantir velocidade de resposta). 
    Para cada item:
    - title: Manchete jornalística urgente e direta.
    - summary: Resumo analítico de 1 parágrafo focado na "dor" ou "oportunidade" imediata.
    - impactLevel: "Alto", "Médio" ou "Baixo".
    - date: Data real da notícia (ex: "Hoje, 14:00", "Ontem", ou a data específica).
    - sourceUrl: URL completa da fonte original da notícia (OBRIGATÓRIO).
    
    IMPORTANTE: Traga fatos reais e atuais baseados na data de hoje (${currentDate}).
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              impactLevel: { type: Type.STRING, enum: ["Alto", "Médio", "Baixo"] },
              date: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
            },
            required: ["title", "summary", "impactLevel", "date", "sourceUrl"]
          }
        },
        systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + getRoleInstruction(role)
      }
    });

    const jsonText = cleanJsonOutput(response.text);
    const items = JSON.parse(jsonText) as NewsItem[];
    
    // Save to cache
    newsCache[cacheKey] = { data: items, timestamp: now };
    
    return items;
  } catch (error: any) {
    console.warn("Error fetching updates (using fallback):", error.message);
    
    // Fallback mock data if API fails (429) or search fails
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return [
      {
        title: "IBS e CBS: Regulamentação em Pauta (Modo Offline)",
        summary: "O sistema não conseguiu conectar aos servidores de notícias em tempo real (Quota Excedida ou Erro de Rede). Exibindo dados de contingência: Acompanhe a tramitação final do PLP 68/2024 no Senado.",
        impactLevel: "Alto",
        date: todayStr
      },
      {
        title: "Split Payment: Preparação Bancária",
        summary: "Bancos seguem adaptando sistemas para a retenção automática do imposto. Verifique se seu ERP já está homologado para as chaves de recebimento da reforma.",
        impactLevel: "Médio",
        date: todayStr
      },
      {
        title: "Simples Nacional e Créditos",
        summary: "Empresas do Simples que não optarem pelo regime híbrido podem perder competitividade em cadeias B2B longas. Consulte seu contador.",
        impactLevel: "Alto",
        date: todayStr
      }
    ];
  }
};

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
            currentLoad: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.NUMBER },
                percentage: { type: Type.NUMBER },
                breakdown: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } }
                }
              }
            },
            reformLoad: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.NUMBER },
                percentage: { type: Type.NUMBER },
                breakdown: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } }
                }
              }
            },
            transitionProjection: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.NUMBER },
                  phase: { type: Type.STRING },
                  currentSystemLoad: { type: Type.NUMBER },
                  reformSystemLoad: { type: Type.NUMBER },
                  totalLoad: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            },
            purchaseAnalysis: {
              type: Type.OBJECT,
              properties: {
                current: {
                  type: Type.OBJECT,
                  properties: {
                    grossValue: { type: Type.NUMBER },
                    taxesInside: { type: Type.NUMBER },
                    netValue: { type: Type.NUMBER },
                    creditTaken: { type: Type.NUMBER }
                  }
                },
                reform: {
                  type: Type.OBJECT,
                  properties: {
                    netValue: { type: Type.NUMBER },
                    ivaOutside: { type: Type.NUMBER },
                    newGrossValue: { type: Type.NUMBER },
                    creditFuture: { type: Type.NUMBER }
                  }
                },
                creditLossIfSimples: { type: Type.NUMBER }
              }
            },
            creditEfficiency: {
              type: Type.OBJECT,
              properties: {
                grossPurchaseValue: { type: Type.NUMBER },
                supplierTaxCredit: { type: Type.NUMBER },
                netAcquisitionCost: { type: Type.NUMBER },
                costWithoutCredit: { type: Type.NUMBER },
                efficiencyGain: { type: Type.NUMBER },
                taxLiabilityOnSale: { type: Type.NUMBER },
                netTaxPayable: { type: Type.NUMBER },
                cashFlowDescription: { type: Type.STRING }
              }
            },
            marginAnalysis: {
              type: Type.OBJECT,
              properties: {
                currentMarginPercent: { type: Type.NUMBER },
                newMarginPercent: { type: Type.NUMBER },
                costImpactDescription: { type: Type.STRING },
                isB2C: { type: Type.BOOLEAN }
              }
            },
            negotiationStrategy: {
              type: Type.OBJECT,
              properties: {
                requiredSupplierDiscount: { type: Type.NUMBER },
                requiredPriceIncrease: { type: Type.NUMBER },
                creditLossValue: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              }
            },
            analysis: { type: Type.STRING },
            cashFlowImpact: { type: Type.STRING },
            strategicAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            roleSpecificInsights: {
              type: Type.OBJECT,
              properties: {
                empresario: { type: Type.ARRAY, items: { type: Type.STRING } },
                contador: { type: Type.ARRAY, items: { type: Type.STRING } },
                advogado: { type: Type.ARRAY, items: { type: Type.STRING } },
                financeiro: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    const cleanJson = cleanJsonOutput(response.text);
    return JSON.parse(cleanJson) as SimulationResult;
  } catch (error) {
    console.error("Simulation error:", error);
    // Return a mock fallback if simulation fails due to quota or parsing
    // This ensures the app doesn't crash during demo
    return {
       currentLoad: { total: input.annualRevenue * 0.18, percentage: 18, breakdown: [{name: 'PIS/COFINS/ICMS', value: input.annualRevenue * 0.18}] },
       reformLoad: { total: input.annualRevenue * 0.25, percentage: 25, breakdown: [{name: 'IBS/CBS', value: input.annualRevenue * 0.25}] },
       transitionProjection: [
         { year: 2026, phase: 'Teste', currentSystemLoad: 10000, reformSystemLoad: 1000, totalLoad: 11000, description: 'Fase de Teste' },
         { year: 2027, phase: 'Virada', currentSystemLoad: 8000, reformSystemLoad: 3000, totalLoad: 11000, description: 'Início CBS' }
       ],
       purchaseAnalysis: {
         current: { grossValue: 1000, taxesInside: 180, netValue: 820, creditTaken: 180 },
         reform: { netValue: 820, ivaOutside: 200, newGrossValue: 1020, creditFuture: 200 },
         creditLossIfSimples: 0
       },
       creditEfficiency: { grossPurchaseValue: 0, supplierTaxCredit: 0, netAcquisitionCost: 0, costWithoutCredit: 0, efficiencyGain: 0, taxLiabilityOnSale: 0, netTaxPayable: 0, cashFlowDescription: 'Simulação offline' },
       marginAnalysis: { currentMarginPercent: 15, newMarginPercent: 12, costImpactDescription: 'Redução estimada', isB2C: false },
       negotiationStrategy: { requiredSupplierDiscount: 5, requiredPriceIncrease: 0, creditLossValue: 0, explanation: 'Dados simulados (Erro API)' },
       analysis: "O sistema não pôde processar a simulação em tempo real (Limite de Cota Atingido). Tente novamente em alguns instantes.",
       cashFlowImpact: "Não calculado (Offline)",
       strategicAlerts: ["Verifique sua conexão ou tente novamente."],
       roleSpecificInsights: { empresario: [], contador: [], advogado: [], financeiro: [] }
    } as SimulationResult;
  }
};

export function simuladorEstrategicoIva(input: SupplyChainInput, futureRegime?: string) {
  const valor_base = 1000.00;
  const preco_venda_atual = 1500.00;
  
  // --- PARÂMETROS ---
  let aliq_iva = 0.275;  // 27,5% CBS/IBS
  if (futureRegime === 'Simples Nacional') {
    aliq_iva = 0.10; // Alíquota simplificada (exemplo)
  }
  
  const aliq_pis_cofins_presumido = 0.0365; // 3,65%
  const aliq_credito_atual = 0.0925; // Recupera 9,25% na compra (média indústria)

  // --- CENÁRIO ATUAL (LUCRO PRESUMIDO) ---
  const compra_atual_bruta = valor_base;
  const credito_atual = compra_atual_bruta * aliq_credito_atual;
  const custo_atual_liquido = compra_atual_bruta - credito_atual;
  
  const imposto_venda_atual = preco_venda_atual * aliq_pis_cofins_presumido;
  const margem_atual_bruta = preco_venda_atual - custo_atual_liquido - imposto_venda_atual;

  // --- CENÁRIO REFORMA (NÃO-CUMULATIVO PLENO) ---
  const compra_reforma_bruta = valor_base;
  const credito_reforma = input.supplierRegime === 'Simples Nacional' ? 0 : compra_reforma_bruta * aliq_iva;
  const custo_reforma_liquido = compra_reforma_bruta - credito_reforma;
  
  // Cálculo para MANTER A MESMA MARGEM EM REAIS (Mark-up)
  // Preço = (Custo + Margem Desejada) / (1 - Aliq_IVA)
  const preco_venda_reforma = (custo_reforma_liquido + margem_atual_bruta) / (1 - aliq_iva);
  const imposto_venda_reforma = preco_venda_reforma * aliq_iva;
  const imposto_liquido_reforma = imposto_venda_reforma - credito_reforma;

  // --- RESULTADOS PARA OS CARDS (IMPACTO) ---
  const diff_imposto_pago = imposto_liquido_reforma - imposto_venda_atual;
  const var_preco_venda = ((preco_venda_reforma / preco_venda_atual) - 1) * 100;
  const nova_margem_percentual = (margem_atual_bruta / preco_venda_reforma) * 100;

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  // Formatação estilo Planilha Excel (DRE Simplificada por Produto)
  const conceptualSimulation = [
    {
      etapa: "1. Custo de Aquisição (Bruto)",
      atual: formatCurrency(compra_atual_bruta),
      reforma: formatCurrency(compra_reforma_bruta)
    },
    {
      etapa: "2. (-) Créditos Tributários na Compra",
      atual: formatCurrency(credito_atual),
      reforma: formatCurrency(credito_reforma)
    },
    {
      etapa: "3. (=) Custo Líquido da Mercadoria",
      atual: formatCurrency(custo_atual_liquido),
      reforma: formatCurrency(custo_reforma_liquido)
    },
    {
      etapa: "4. (+) Margem de Lucro (Desejada)",
      atual: formatCurrency(margem_atual_bruta),
      reforma: formatCurrency(margem_atual_bruta)
    },
    {
      etapa: "5. (+) Impostos sobre a Venda",
      atual: formatCurrency(imposto_venda_atual),
      reforma: formatCurrency(imposto_venda_reforma)
    },
    {
      etapa: "6. (=) Preço de Venda Final",
      atual: formatCurrency(preco_venda_atual),
      reforma: formatCurrency(preco_venda_reforma)
    }
  ];

  const chainEfficiency = {
    currentFinalCost: formatCurrency(preco_venda_atual),
    reformFinalCost: formatCurrency(preco_venda_reforma),
    efficiencyGain: `${var_preco_venda > 0 ? '+' : ''}${var_preco_venda.toFixed(1)}% no Preço`,
    description: `Para manter a mesma margem em reais (R$ ${margem_atual_bruta.toFixed(2)}), o preço variou ${var_preco_venda.toFixed(1)}%. Diferença de imposto pago: R$ ${diff_imposto_pago.toFixed(2)}. Nova margem: ${nova_margem_percentual.toFixed(1)}%.`
  };

  const simulationTable = [
    {
      etapa: "Compra Fornecedor",
      valorVenda: formatCurrency(compra_reforma_bruta),
      ibsCbsDebito: formatCurrency(credito_reforma),
      creditoSplit: "R$ 0,00",
      impostoLiquido: formatCurrency(credito_reforma)
    },
    {
      etapa: "Sua Empresa",
      valorVenda: formatCurrency(preco_venda_reforma),
      ibsCbsDebito: formatCurrency(imposto_venda_reforma),
      creditoSplit: formatCurrency(credito_reforma),
      impostoLiquido: formatCurrency(imposto_liquido_reforma)
    }
  ];

  return { conceptualSimulation, chainEfficiency, simulationTable, diff_imposto_pago, aliq_iva, aliq_pis_cofins_presumido };
}

export const runSupplyChainAnalysis = async (input: SupplyChainInput): Promise<SupplyChainResult> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Atue como um consultor tributário explicando para um EMPREENDEDOR LEIGO (que não entende de tributação).
    Analise o impacto tributário na Cadeia de Valor (3 Etapas): Fornecedor -> Sua Empresa -> Cliente.
    
    CENÁRIO ATUAL DA EMPRESA:
    - Fornecedor: ${input.supplierSector} / ${input.supplierRegime}
    - Sua Empresa: ${input.companySector} / ${input.companyRegime}
    - Cliente: ${input.customerType}

    LÓGICA DE CÁLCULO (BASEADA NO IVA DUAL - EC 132/2023):
    O IVA Dual opera pelo método de "imposto líquido", eliminando a cumulatividade em todas as etapas através do mecanismo de débito e crédito.
    Exemplo de Fluxo (Alíquota Consolidada 28,5%):
    1. Fornecedor: Vende por R$ 1.000. Débito R$ 285. Líquido: R$ 285.
    2. Indústria: Compra por R$ 1.000 (Crédito R$ 285). Vende por R$ 1.500. Débito R$ 427,50. Líquido: R$ 427,50 - 285 = R$ 142,50.
    3. Varejo: Compra por R$ 1.500 (Crédito R$ 427,50). Vende por R$ 2.000. Débito R$ 570. Líquido: R$ 570 - 427,50 = R$ 142,50.
    ATENÇÃO: Se o fornecedor ou a empresa for do Simples Nacional (sem ser híbrido), eles NÃO GERAM CRÉDITO PLENO para a etapa seguinte.

    OBJETIVOS DA ANÁLISE:
    1. Explique de forma muito simples e direta como a empresa paga imposto hoje e como será no futuro (ganho ou perda).
    2. Mostre o impacto se a empresa mantiver o regime atual vs mudar para os outros regimes (Simples, Simples Híbrido, Presumido, Real).
    3. Explique como a escolha do fornecedor afeta o imposto da empresa.
       CRÍTICO: Preencha o objeto 'flowAnalysis' detalhando o impacto em cada etapa: step1_supplier_impact, step2_company_impact, step3_customer_impact.
    4. Crie uma tabela de simulação (simulationTable) mostrando o fluxo do produto na cadeia (Fornecedor -> Sua Empresa -> Cliente Final). Assuma um valor inicial de R$ 1.000,00 e aplique uma alíquota consolidada de 28,5% (IBS/CBS) para demonstrar o cálculo do imposto líquido e do crédito (Split Payment). Adapte os valores de crédito dependendo do regime do fornecedor e da sua empresa (ex: Simples Nacional não gera crédito pleno).
       CRÍTICO: Na simulationTable, cada campo (valorVenda, ibsCbsDebito, creditoSplit, impostoLiquido) DEVE conter APENAS o valor numérico formatado (ex: "R$ 1.000,00"). NUNCA coloque textos explicativos ou observações dentro desses campos. Se precisar explicar, use 'strategicAdvice' ou 'flowAnalysis'.
    5. Forneça uma análise SWOT Tributária (swotAnalysis) com Forças, Fraquezas, Oportunidades e Ameaças para a empresa neste cenário.
       CRÍTICO: Você DEVE preencher as 4 listas (strengths, weaknesses, opportunities, threats). Não deixe nenhuma lista vazia e não agrupe tudo em apenas duas.
    6. Crie um comparativo "Simulação Conceitual de Cadeia" (conceptualSimulation) mostrando lado a lado o cenário Atual vs Reforma (IBS/CBS) para cada etapa (Fornecedor, Sua Empresa, Cliente). Mostre o Preço Bruto, Impostos (embutidos no atual, destacados na reforma), Preço Líquido (preço de custo) e o Crédito Gerado.
    7. Calcule a Eficiência da Cadeia (chainEfficiency), comparando o custo final atual vs reforma, o ganho de eficiência e uma breve descrição do impacto no custo final.

    EXEMPLO DE SAÍDA ESPERADA (siga estritamente esta estrutura):
    {
      "currentScenario": {
        "taxResiduePercent": 10,
        "recoverableTaxPercent": 5,
        "description": "Descrição curta",
        "inefficiencyAlert": "Alerta curto"
      },
      "reformScenario": {
        "taxResiduePercent": 0,
        "recoverableTaxPercent": 100,
        "description": "Descrição curta",
        "creditGain": "Ganho curto"
      },
      "impactSummary": {
        "buyerCostReductionPercent": 5,
        "priceCompetitiveness": "Aumenta",
        "strategicAdvice": "Conselho curto"
      },
      "flowAnalysis": {
        "step1_supplier_impact": "Impacto 1",
        "step2_company_impact": "Impacto 2",
        "step3_customer_impact": "Impacto 3"
      },
      "swotAnalysis": {
        "strengths": ["Ponto forte 1", "Ponto forte 2"],
        "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
        "opportunities": ["Oportunidade 1", "Oportunidade 2"],
        "threats": ["Ameaça 1", "Ameaça 2"]
      },
      "simulationTable": [
        {
          "etapa": "Fornecedor",
          "valorVenda": "R$ 1.000,00",
          "ibsCbsDebito": "R$ 285,00",
          "creditoSplit": "R$ 0,00",
          "impostoLiquido": "R$ 285,00"
        }
      ],
      "conceptualSimulation": [
        {
          "etapa": "Fornecedor",
          "currentGrossPrice": "R$ 1.000,00",
          "currentTaxes": "R$ 180,00",
          "currentNetPrice": "R$ 820,00",
          "reformGrossPrice": "R$ 1.000,00",
          "reformTaxes": "R$ 285,00",
          "reformNetPrice": "R$ 715,00",
          "reformCredit": "R$ 285,00"
        }
      ],
      "chainEfficiency": {
        "currentFinalCost": "R$ 2.000,00",
        "reformFinalCost": "R$ 1.850,00",
        "efficiencyGain": "7.5%",
        "description": "A não cumulatividade plena reduziu o custo final em 7.5%."
      },
      "companyRegimeComparisons": [
        {
          "regime": "Lucro Presumido",
          "taxBurden": "Alta",
          "creditGenerated": "Integral",
          "netResult": "Positivo",
          "recommendation": "Avaliar transição"
        }
      ]
    }

    Retorne APENAS um JSON estritamente válido com a estrutura solicitada. Não inclua blocos de código markdown (\`\`\`json).
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
    
    // Inject calculated metrics
    const metrics = simuladorEstrategicoIva(input);
    result.conceptualSimulation = metrics.conceptualSimulation;
    result.chainEfficiency = metrics.chainEfficiency;
    result.simulationTable = metrics.simulationTable;

    return result;
  } catch (error) {
    console.error("Supply chain analysis error:", error);
    // Fallback mock data
    return {
      currentScenario: { taxResiduePercent: 10, recoverableTaxPercent: 5, description: "Hoje você paga imposto sobre imposto.", inefficiencyAlert: "Custo oculto na cadeia." },
      reformScenario: { taxResiduePercent: 0, recoverableTaxPercent: 100, description: "No futuro, o imposto será transparente e gerará crédito.", creditGain: "Recuperação total." },
      impactSummary: { buyerCostReductionPercent: 5, priceCompetitiveness: "Aumenta", strategicAdvice: "Avalie mudar para o regime híbrido se seus clientes forem empresas." },
      flowAnalysis: {
        step1_supplier_impact: "Seu fornecedor atual não gera crédito total.",
        step2_company_impact: "Sua empresa repassa o custo para o preço final.",
        step3_customer_impact: "Seu cliente paga mais caro."
      },
      swotAnalysis: {
        strengths: ["Crédito financeiro imediato (Split Payment)"],
        weaknesses: ["Aumento de carga para serviços B2C"],
        opportunities: ["Revisão de contratos com fornecedores do Simples"],
        threats: ["Perda de clientes B2B se não gerar crédito"]
      },
      companyRegimeComparisons: [
        { regime: "Simples Nacional", taxBurden: "Menor carga direta", creditGenerated: "Não gera crédito para cliente", netResult: "Perda de competitividade B2B", recommendation: "Bom apenas se vender para pessoa física." },
        { regime: "Simples Dual (Híbrido)", taxBurden: "Carga média", creditGenerated: "Gera crédito integral (IBS/CBS)", netResult: "Ganho de competitividade B2B", recommendation: "Ideal se seus clientes forem empresas." },
        { regime: "Lucro Presumido", taxBurden: "Carga alta", creditGenerated: "Gera crédito integral", netResult: "Neutro", recommendation: "Avaliar custos operacionais." },
        { regime: "Lucro Real", taxBurden: "Carga sobre o lucro", creditGenerated: "Gera crédito integral", netResult: "Ganho se margem for baixa", recommendation: "Ideal para margens apertadas." }
      ],
      simulationTable: [
        { etapa: "Fornecedor", valorVenda: "R$ 1.000,00", ibsCbsDebito: "R$ 285,00", creditoSplit: "R$ 0,00", impostoLiquido: "R$ 285,00" },
        { etapa: "Sua Empresa", valorVenda: "R$ 1.500,00", ibsCbsDebito: "R$ 427,50", creditoSplit: "R$ 285,00", impostoLiquido: "R$ 142,50" },
        { etapa: "Cliente Final", valorVenda: "R$ 2.000,00", ibsCbsDebito: "R$ 570,00", creditoSplit: "R$ 427,50", impostoLiquido: "R$ 142,50" }
      ]
    };
  }
};

export const interpretLegalText = async (text: string, role: UserRole): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analise o texto legislativo: "${text}"
    Para o perfil: ${role}
    Formate em Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + getRoleInstruction(role),
      }
    });
    return response.text || "Sem resposta.";
  } catch (error) {
    console.error("Interpretation error", error);
    return "Não foi possível interpretar o texto no momento.";
  }
};

export const askTaxConsultant = async (question: string, role: UserRole): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    PERGUNTA (${role}): "${question}"
    Responda como JaxAI (Consultor Tributário).
    Use Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        // Usa googleSearch para garantir dados atualizados se a pergunta for sobre fatos recentes
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

export const getActionGuide = async (actionId: string, actionTitle: string): Promise<any> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Você é um consultor tributário especialista na Reforma Tributária Brasileira (EC 132/2023, PLP 68/2024).
    O usuário solicitou um guia passo a passo detalhado para a seguinte ação recomendada:
    Ação: "${actionTitle}" (ID: ${actionId})

    Com base na legislação atualizada da reforma tributária, crie um guia prático e direto para que uma empresa ou contador possa executar essa ação.

    EXEMPLO DE SAÍDA ESPERADA (siga estritamente esta estrutura):
    {
      "title": "Título da Ação",
      "description": "Explicação detalhada de por que essa ação é necessária e qual o impacto de não realizá-la.",
      "legislation": "Citação da base legal (ex: EC 132/2023, PLP 68/2024, etc) que fundamenta essa ação.",
      "steps": [
        {
          "title": "Passo 1: Nome do passo",
          "description": "Instrução clara e prática do que deve ser feito."
        },
        {
          "title": "Passo 2: Nome do passo",
          "description": "Instrução clara e prática do que deve ser feito."
        }
      ],
      "tips": [
        "Dica estratégica 1",
        "Dica estratégica 2"
      ]
    }

    Retorne APENAS um JSON estritamente válido com a estrutura solicitada. Não inclua blocos de código markdown (\`\`\`json).
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
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "legislation", "steps", "tips"]
        }
      }
     });
     const cleanJson = cleanJsonOutput(response.text);
     return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Action guide error:", error);
    return {
      title: actionTitle,
      description: "Guia gerado em modo offline devido a instabilidade no servidor.",
      legislation: "Reforma Tributária (EC 132/2023)",
      steps: [
        { title: "Mapeamento Inicial", description: "Reúna as informações necessárias do seu ERP." },
        { title: "Análise de Impacto", description: "Avalie como as novas regras afetam esta área específica." },
        { title: "Plano de Ação", description: "Defina os responsáveis e prazos para adequação." }
      ],
      tips: ["Consulte seu contador ou advogado tributarista para validação final."]
    };
  }
};

export const getAccountantStrategicGuide = async (): Promise<AccountantGuideData> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Gere guia para Contadores 2026.
    
    EXEMPLO DE SAÍDA ESPERADA (siga estritamente esta estrutura):
    {
      "profileShift": {
        "from": "Operador de Conformidade (Reativo)",
        "to": "Arquiteto da Estratégia Fiscal (Proativo)",
        "description": "Mudança para análise estratégica."
      },
      "competencies": [
        { "title": "Visão Estratégica", "description": "Análise de impacto no negócio.", "icon": "Brain" },
        { "title": "Domínio Tecnológico", "description": "Automação fiscal.", "icon": "Cpu" }
      ],
      "actionPlan": [
        { "phase": "Imediato", "actions": ["Revisar NCMs", "Simular Carga"] }
      ],
      "consultancyTips": ["Ofereça diagnóstico preventivo."]
    }

    Retorne APENAS um JSON estritamente válido com a estrutura solicitada. Não inclua blocos de código markdown (\`\`\`json).
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
     const cleanJson = cleanJsonOutput(response.text);
     return JSON.parse(cleanJson) as AccountantGuideData;
  } catch (error) {
    console.error("Accountant guide error:", error);
    // Fallback data
    return {
      profileShift: {
        from: "Operador de Conformidade (Reativo)",
        to: "Arquiteto da Estratégia Fiscal (Proativo)",
        description: "Mudança para análise estratégica (Modo Offline)."
      },
      competencies: [
        { title: "Visão Estratégica", description: "Análise de impacto no negócio.", icon: "Brain" },
        { title: "Domínio Tecnológico", description: "Automação fiscal.", icon: "Cpu" }
      ],
      actionPlan: [
        { phase: "Imediato", actions: ["Revisar NCMs", "Simular Carga"] }
      ],
      consultancyTips: ["Ofereça diagnóstico preventivo."]
    };
  }
};