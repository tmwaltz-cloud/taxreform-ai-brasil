import React, { useEffect, useState } from 'react';
import { fetchLatestUpdates } from '../services/geminiService';
import { NewsItem, UserRole } from '../types';
import { Newspaper, AlertTriangle, ArrowRight, RefreshCw, ExternalLink, Calendar, CheckCircle, Flame, TrendingUp, Radio, ChevronLeft, ChevronRight, X, FileText, Database, DollarSign, Eye, MessageSquareText } from 'lucide-react';

interface DashboardProps {
  userRole: UserRole;
  onViewChange: (view: 'dashboard' | 'supply-chain' | 'interpreter' | 'consultant' | 'accountant-guide' | 'action-guide') => void;
  onActionSelect: (id: string, title: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole, onViewChange, onActionSelect }) => {
  const [updates, setUpdates] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<{ title: string, description: string, deadline: string, steps: string[], legislation?: string, linkTo?: 'supply-chain' | 'interpreter' | 'consultant' | 'accountant-guide', linkText?: string } | null>(null);

  // Trending Topics Simulados (Poderia vir da IA também)
  const trendingTopics = ["#SplitPayment", "#SimplesNacional", "#TravaBancária", "#IBS_CBS", "#PLP68_2024"];

  const loadUpdates = async (topic?: string) => {
    setLoading(true);
    try {
      const news = await fetchLatestUpdates(userRole, topic);
      setUpdates(news);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setCurrentSlide(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates(selectedTopic || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, selectedTopic]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % updates.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + updates.length) % updates.length);
  };

  const handleTopicClick = (topic: string) => {
    if (selectedTopic === topic) {
      setSelectedTopic(null); // Deselect
    } else {
      setSelectedTopic(topic);
    }
  };

  const recommendedActions: { id: string, title: string, icon: React.ReactNode, description: string, deadline: string, steps: string[], legislation?: string, linkTo?: 'supply-chain' | 'interpreter' | 'consultant' | 'accountant-guide', linkText?: string }[] = [
    {
      id: "review-ncm",
      title: "Revisar cadastro de clientes e produtos (NCM)",
      icon: <CheckCircle className="w-4 h-4 text-green-500 mr-3" />,
      description: "A Nomenclatura Comum do Mercosul (NCM) será a base para a definição das alíquotas do IBS e da CBS. Um cadastro incorreto pode levar a tributação maior ou multas.",
      deadline: "Imediato (Antes de 2026)",
      steps: [
        "Extraia a lista completa de produtos do seu ERP.",
        "Valide os códigos NCM atuais com a tabela TIPI mais recente.",
        "Atualize os cadastros de clientes (CPF/CNPJ) para evitar o risco de 'Carga Desacobertada' (multa com alíquota plena).",
        "Atenção à Regra 04: Domicílio Fiscal desatualizado gera multa de 10 UPFs (R$ 2.000,00)."
      ],
      legislation: "Lei Complementar 227/2026 (Penalidades Estruturantes)",
      linkTo: 'interpreter',
      linkText: 'Interpretar Regras de NCM'
    },
    {
      id: "simulate-split-payment",
      title: "Simular impacto do Split Payment no caixa",
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 mr-3" />,
      description: "O Split Payment fará a retenção automática do imposto no momento do pagamento pelo cliente (PIX/Boleto). Isso reduzirá o valor líquido que entra na conta da empresa, afetando o capital de giro.",
      deadline: "Até Dezembro/2025",
      steps: [
        "Levante o faturamento médio mensal e o prazo médio de recebimento.",
        "Calcule a alíquota estimada (IBS + CBS) para o seu setor (ex: Serviços ~10,08%).",
        "Subtraia o valor do imposto do recebimento diário projetado.",
        "Ajuste a necessidade de capital de giro (NCG) para cobrir a diferença de fluxo."
      ],
      legislation: "EC 132/2023 (Regime de Caixa / Split Payment)",
      linkTo: 'consultant',
      linkText: 'Consultar Impacto no Caixa'
    },
    {
      id: "calculate-credits",
      title: "Calcular créditos, prejuízo e estoque",
      icon: <TrendingUp className="w-4 h-4 text-brand-500 mr-3" />,
      description: "Empresas terão direito a aproveitar créditos dos impostos antigos (PIS/COFINS/ICMS) sobre o estoque existente na virada do sistema. É dinheiro que pode ser recuperado.",
      deadline: "Dezembro/2026",
      steps: [
        "Realize um inventário físico e contábil rigoroso no final do ano.",
        "Identifique os impostos embutidos nas mercadorias em estoque.",
        "Prepare a documentação comprobatória (notas fiscais de entrada).",
        "Alinhe com a contabilidade a forma de apropriação desse crédito no novo sistema (Crédito Financeiro Pleno)."
      ],
      legislation: "Regras de Transição da EC 132/2023",
      linkTo: 'accountant-guide',
      linkText: 'Guia Contábil de Transição'
    },
    {
      id: "evaluate-simples",
      title: "Avaliar transição do Simples Nacional",
      icon: <RefreshCw className="w-4 h-4 text-purple-500 mr-3 flex-shrink-0" />,
      description: "Com a reforma, empresas do Simples poderão optar por recolher IBS/CBS por fora (Regime Híbrido) para transferir crédito integral aos clientes B2B.",
      deadline: "Setembro/2026",
      steps: [
        "Mapeie o perfil dos seus clientes (B2B vs B2C).",
        "Se a maioria for B2B (Lucro Real/Presumido), simule o custo do Regime Híbrido.",
        "Compare a perda de clientes (por não dar crédito) com o aumento da carga tributária.",
        "Defina a estratégia de precificação para o novo cenário."
      ],
      legislation: "LC 224/2025 (Regras do Simples Nacional)",
      linkTo: 'supply-chain',
      linkText: 'Simular Cadeia de Valor'
    },
    {
      id: "review-contracts",
      title: "Revisar contratos de longo prazo",
      icon: <FileText className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />,
      description: "Contratos que ultrapassem 2026 precisam prever cláusulas de repasse ou reequilíbrio econômico-financeiro devido à mudança da carga tributária.",
      deadline: "Até Dezembro/2025",
      steps: [
        "Identificar contratos com vigência após 2026.",
        "Incluir cláusula de repasse do IBS/CBS.",
        "Negociar com clientes B2B sobre a transferência de créditos."
      ],
      legislation: "Regras de Transição da EC 132/2023",
      linkTo: 'interpreter',
      linkText: 'Analisar Contratos'
    },
    {
      id: "update-erp",
      title: "Atualizar sistemas de faturamento (ERP)",
      icon: <Database className="w-4 h-4 text-indigo-500 mr-3 flex-shrink-0" />,
      description: "Os sistemas precisarão emitir notas fiscais com o destaque separado do IBS, CBS e Imposto Seletivo, além de suportar o Split Payment.",
      deadline: "Junho/2026",
      steps: [
        "Contatar o fornecedor do ERP.",
        "Mapear cronograma de atualizações do sistema.",
        "Realizar testes de emissão em ambiente de homologação."
      ],
      legislation: "Comitê Gestor do IBS / Receita Federal"
    },
    {
      id: "pricing-strategy",
      title: "Refazer estratégia de precificação (Pricing)",
      icon: <DollarSign className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />,
      description: "A mudança na tributação do consumo altera o custo final. Produtos do setor de serviços podem encarecer, enquanto a indústria pode ter redução.",
      deadline: "Outubro/2026",
      steps: [
        "Calcular a nova carga tributária por produto/serviço.",
        "Analisar a elasticidade de preço do cliente.",
        "Definir nova tabela de preços para 2027."
      ],
      legislation: "EC 132/2023 (Alíquota de Referência)",
      linkTo: 'supply-chain',
      linkText: 'Simular Preços'
    },
    {
      id: "monitor-comite",
      title: "Monitorar resoluções do Comitê Gestor",
      icon: <Eye className="w-4 h-4 text-cyan-500 mr-3 flex-shrink-0" />,
      description: "O Comitê Gestor do IBS publicará normas infralegais constantes sobre obrigações acessórias, fiscalização e distribuição de receitas.",
      deadline: "Contínuo",
      steps: [
        "Acompanhar o Diário Oficial.",
        "Configurar alertas para 'Comitê Gestor do IBS'.",
        "Revisar processos internos a cada nova resolução."
      ],
      legislation: "PLP 108/2024 (Comitê Gestor)"
    }
  ];

  const handleActionClick = (action: any) => {
    onActionSelect(action.id, action.title);
  };

  const timelineSteps = [
    {
      date: "Janeiro 2026 (Atual)",
      title: "Início da cobrança teste (0,9% CBS / 0,1% IBS)",
      description: "Início das mudanças no IRPJ (Lucro Presumido - LC 224/2025). Destaque obrigatório do IBS e CBS na nota fiscal.",
      risk: "Multa por emissão incorreta de NF-e. Risco de interrupção da emissão de notas fiscais se o ERP não estiver atualizado.",
      urgency: "Crítica",
      status: "current"
    },
    {
      date: "Abril 2026",
      title: "Alterações na CSLL e Segregação no DAS",
      description: "Início das alterações na CSLL. Segregação obrigatória no DAS para optantes do Simples Nacional.",
      risk: "Recolhimento a menor de tributos, gerando passivo fiscal e multas (10 UPFs - R$ 2.000,00 por omissão de cadastro).",
      urgency: "Alta",
      status: "upcoming"
    },
    {
      date: "Setembro 2026",
      title: "Opção pelo Regime Híbrido (Simples Nacional)",
      description: "Prazo final para opção de empresas do Simples Nacional pelo recolhimento de IBS/CBS 'por fora' do DAS para transferir crédito.",
      risk: "Perda de competitividade no mercado B2B por não fornecer crédito financeiro pleno aos clientes.",
      urgency: "Média",
      status: "upcoming"
    },
    {
      date: "Janeiro 2027",
      title: "Extinção PIS/COFINS e Início CBS Plena",
      description: "Extinção integral do PIS/COFINS. Início da CBS plena. IPI reduzido a zero (exceto ZFM). Início do Imposto Seletivo.",
      risk: "Paralisação da empresa por incapacidade de precificar produtos corretamente com a nova carga tributária. Multa de 66% por cancelamento indevido de notas.",
      urgency: "Alta",
      status: "future"
    },
    {
      date: "2029 a 2032",
      title: "Transição ICMS/ISS para IBS",
      description: "Redução gradual (1/10 ao ano) de ICMS e ISS, com elevação proporcional do IBS.",
      risk: "Erros no cálculo de alíquotas de transição, gerando autuações fiscais estaduais e municipais.",
      urgency: "Baixa",
      status: "future"
    },
    {
      date: "2033",
      title: "Vigência Plena do IVA Dual",
      description: "Vigência plena do IBS e extinção definitiva do ICMS/ISS.",
      risk: "Incompatibilidade total de sistemas legados, impossibilitando a operação legal da empresa.",
      urgency: "Baixa",
      status: "future"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* TOP HEADER: Trending Bar */}
      <div className="bg-slate-900 rounded-xl p-3 flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide border border-slate-700 shadow-lg">
         <div className="flex items-center text-red-400 font-bold text-xs uppercase tracking-wider mr-4 flex-shrink-0 animate-pulse">
            <Radio className="w-4 h-4 mr-2" /> Ao Vivo
         </div>
         <div className="flex space-x-6">
            {trendingTopics.map((topic, i) => (
               <span 
                 key={i} 
                 onClick={() => handleTopicClick(topic)}
                 className={`text-sm font-medium cursor-pointer transition ${selectedTopic === topic ? 'text-brand-400 underline' : 'text-slate-300 hover:text-white'}`}
               >
                  {topic}
               </span>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         
         {/* LEFT COLUMN: MAIN FEED (8 cols) */}
         <div className="lg:col-span-8 space-y-6">
            
            {/* Header Radar */}
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                     <Newspaper className="w-6 h-6 mr-3 text-brand-600" /> 
                     Radar de Inteligência
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">Monitoramento em tempo real de riscos regulatórios e oportunidades.</p>
               </div>
               <button 
                  onClick={() => loadUpdates(selectedTopic || undefined)} 
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:border-brand-300 transition shadow-sm"
               >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Atualizando...' : 'Atualizar Agora'}
               </button>
            </div>

            {/* Carousel of News */}
            {updates.length > 0 && (
               <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition min-h-[300px] flex flex-col">
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <button onClick={prevSlide} className="bg-white/80 p-2 rounded-r-lg shadow-md hover:bg-white z-10 transition">
                      <ChevronLeft className="w-6 h-6 text-slate-700" />
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button onClick={nextSlide} className="bg-white/80 p-2 rounded-l-lg shadow-md hover:bg-white z-10 transition">
                      <ChevronRight className="w-6 h-6 text-slate-700" />
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-100 flex-1 flex flex-col justify-center px-16">
                     <div className="flex justify-between items-start mb-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center ${
                           updates[currentSlide].impactLevel === 'Alto' ? 'bg-red-100 text-red-700' : 
                           updates[currentSlide].impactLevel === 'Médio' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                           {updates[currentSlide].impactLevel === 'Alto' && <Flame className="w-3 h-3 mr-1" />}
                           Impacto {updates[currentSlide].impactLevel}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">{updates[currentSlide].date}</span>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4 transition">
                        {updates[currentSlide].title}
                     </h2>
                     <p className="text-slate-600 leading-relaxed text-base md:text-lg mb-6">
                        {updates[currentSlide].summary}
                     </p>
                     <div className="mt-auto pt-4 border-t border-slate-100">
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(updates[currentSlide].title + ' Reforma Tributária')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-sm font-medium text-brand-600 hover:underline"
                        >
                           Buscar notícia completa no Google <ExternalLink className="w-4 h-4 ml-1" />
                        </a>
                     </div>
                  </div>
                  <div className="flex justify-center p-3 bg-slate-50 border-t border-slate-200">
                    {updates.map((_, idx) => (
                      <div key={idx} className={`w-2 h-2 rounded-full mx-1 transition-colors ${idx === currentSlide ? 'bg-brand-600' : 'bg-slate-300'}`} />
                    ))}
                  </div>
               </div>
            )}

            {updates.length === 0 && !loading && (
               <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Nenhuma atualização carregada.</p>
                  <p className="text-xs text-slate-400">Clique em "Atualizar Agora" para ativar a IA.</p>
               </div>
            )}
         </div>

         {/* RIGHT COLUMN: CONTEXT & TIMELINE (4 cols) */}
         <div className="lg:col-span-4 space-y-6">
            
            {/* Status Card */}
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col max-h-[400px]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
               <h3 className="text-lg font-bold mb-4 flex items-center relative z-10 flex-shrink-0">
                  <Calendar className="w-5 h-5 mr-2 text-brand-400" /> Cronograma e Riscos
               </h3>
               <div className="space-y-4 relative z-10 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {timelineSteps.map((step, idx) => (
                    <div key={idx} className={`flex items-start ${step.status === 'future' ? 'opacity-75' : ''}`}>
                       <div className="flex-col items-center mr-3 hidden sm:flex">
                          <div className={`w-2 h-2 rounded-full mb-1 ${step.status === 'current' ? 'bg-green-500' : step.status === 'upcoming' ? 'bg-amber-500' : 'bg-slate-500'}`}></div>
                          {idx < timelineSteps.length - 1 && <div className="w-0.5 h-full min-h-[40px] bg-slate-700"></div>}
                       </div>
                       <div className="pb-4">
                          <span className={`text-xs font-bold uppercase ${step.status === 'current' ? 'text-green-400' : step.status === 'upcoming' ? 'text-amber-400' : 'text-slate-400'}`}>{step.date}</span>
                          <h4 className="text-sm font-bold text-white mt-1">{step.title}</h4>
                          <p className="text-xs text-slate-300 mt-1">{step.description}</p>
                          <div className="mt-2 bg-slate-800/50 p-2 rounded border border-slate-700">
                            <span className="text-[10px] font-bold text-red-400 uppercase flex items-center mb-1">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Risco ({step.urgency}):
                            </span>
                            <p className="text-xs text-slate-400">{step.risk}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col max-h-[400px]">
               <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider flex-shrink-0">Ações Recomendadas</h3>
               <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {recommendedActions.map((action, idx) => (
                    <li 
                      key={idx}
                      onClick={() => handleActionClick(action)}
                      className="flex items-center justify-between text-sm text-slate-600 p-2 hover:bg-slate-50 rounded transition cursor-pointer border border-transparent hover:border-slate-200 group"
                    >
                       <div className="flex items-center">
                         {action.icon}
                         <span className="font-medium">{action.title}</span>
                       </div>
                       <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0 ml-2" />
                    </li>
                  ))}
               </ul>
               <div className="mt-4 pt-4 border-t border-slate-100 flex-shrink-0">
                 <div 
                   onClick={() => onViewChange('consultant')}
                   className="bg-brand-50 rounded-lg p-3 border border-brand-100 cursor-pointer hover:bg-brand-100 transition-colors flex items-start group"
                 >
                   <div className="bg-brand-500 p-1.5 rounded-full text-white mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                     <MessageSquareText className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-brand-900">Não encontrou sua dúvida aqui?</p>
                     <p className="text-xs text-brand-700 mt-0.5">Vá à seção Consultor IA e pergunte ao nosso consultor virtual.</p>
                   </div>
                 </div>
               </div>
            </div>

            {/* System Status */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
               <span className="text-xs text-slate-400 uppercase font-bold">Status da Legislação</span>
               <div className="flex items-center justify-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-bold text-slate-700">PLP 68/2024: Aprovado</span>
               </div>
               <p className="text-[10px] text-slate-400 mt-1">Aguardando regulamentação final do Comitê Gestor.</p>
            </div>

         </div>
      </div>
    </div>
  );
};