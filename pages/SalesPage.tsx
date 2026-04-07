import React from 'react';
import { CheckCircle, Clock, FileText, TrendingUp, AlertTriangle, ArrowRight, X, ShieldCheck, PieChart, ArrowLeft } from 'lucide-react';

interface SalesPageProps {
  onBack: () => void;
  onBuy: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({ onBack, onBuy }) => {
  const handleWhatsAppClick = () => {
    const text = `Olá! Tenho interesse no Diagnóstico Estratégico da Reforma Tributária. Gostaria de saber mais sobre a contratação.`;
    window.open(`https://wa.me/5515996648895?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-y-auto">
      {/* Header / Nav */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={onBack} className="flex items-center text-slate-300 hover:text-white transition">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </button>
          <span className="font-bold text-lg tracking-tight">TaxReform<span className="text-brand-500">.ai Brasil</span></span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-900/20 rounded-l-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block bg-brand-600/20 border border-brand-500/50 rounded-full px-4 py-1 mb-6">
            <span className="text-brand-300 font-semibold text-sm uppercase tracking-wider">Oferta Exclusiva de Lançamento</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Para um desafio estratégico,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">uma solução estratégica.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Quanto vale não perder <strong>30% do mercado</strong> para um concorrente que se preparou?
            Esta não é uma questão de <em>compliance</em> que seu contador resolve. É uma reestruturação do seu modelo de negócio.
          </p>
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-brand-600 hover:bg-brand-500 text-white text-lg font-bold py-4 px-10 rounded-xl shadow-lg shadow-brand-900/50 transform hover:-translate-y-1 transition-all flex items-center mx-auto"
          >
            Quero Blindar Minha Empresa <ArrowRight className="ml-2 w-6 h-6" />
          </button>
        </div>
      </section>

      {/* The Problem: Traditional vs Strategic */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que seu contador atual não é suficiente?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A Reforma Tributária não é apenas sobre mudar alíquotas. É sobre competitividade, precificação e sobrevivência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Old Way */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <FileText className="w-32 h-32 text-slate-800" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                <X className="w-6 h-6 text-red-500 mr-2" /> O Contador Tradicional
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start text-slate-600">
                  <span className="mr-3 mt-1 text-slate-400">•</span>
                  Olha para o <strong>passado</strong> (retroativo).
                </li>
                <li className="flex items-start text-slate-600">
                  <span className="mr-3 mt-1 text-slate-400">•</span>
                  Foco em <strong>apuração e guias</strong> (compliance).
                </li>
                <li className="flex items-start text-slate-600">
                  <span className="mr-3 mt-1 text-slate-400">•</span>
                  Garante apenas que você pague os impostos (muitas vezes a maior).
                </li>
              </ul>
            </div>

            {/* New Way */}
            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden transform md:-translate-y-4 border border-brand-500/30">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-32 h-32 text-brand-400" />
              </div>
              <h3 className="text-xl font-bold text-brand-400 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-brand-500 mr-2" /> Nós, Como Estrategistas Fiscais
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start text-slate-300">
                  <CheckCircle className="w-5 h-5 text-brand-500 mr-3 mt-0.5 flex-shrink-0" />
                  Olhamos para o <strong>futuro</strong> (projeção 2026-2033).
                </li>
                <li className="flex items-start text-slate-300">
                  <CheckCircle className="w-5 h-5 text-brand-500 mr-3 mt-0.5 flex-shrink-0" />
                  Foco em <strong>modelo de negócio, precificação e lucro</strong>.
                </li>
                <li className="flex items-start text-slate-300">
                  <CheckCircle className="w-5 h-5 text-brand-500 mr-3 mt-0.5 flex-shrink-0" />
                  Usamos a reforma como ferramenta de <strong>vantagem competitiva</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Scope of Analysis */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">O que entregamos?</h2>
            <p className="text-lg text-slate-600">Uma simulação de impactos completa e personalizada para sua empresa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Análise da Carga Tributária", desc: "Diagnóstico claro do aumento ou redução de impostos no seu CNAE.", icon: PieChart },
              { title: "Impacto em Preços e Custos", desc: "Análise item a item para ajustar preços e renegociar com fornecedores.", icon: FileText },
              { title: "Projeções Individualizadas", desc: "Simulações por produto e serviço para decisões precisas.", icon: TrendingUp },
              { title: "Janelas de Transição", desc: "Mapeamento financeiro das janelas de reprecificação (2027-2033).", icon: Clock },
              { title: "Análise da Cadeia de Valor", desc: "Identificação de elos frágeis em fornecedores e clientes (risco de crédito).", icon: AlertTriangle },
              { title: "Maximização de Créditos", desc: "Levantamento de oportunidades ocultas para recuperar impostos.", icon: ShieldCheck }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-start p-6 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition">
                <div className="bg-brand-100 p-3 rounded-lg mb-4">
                  <item.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables & Process */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Entregáveis Claros e Acionáveis</h3>
                <p className="text-slate-600 mb-6">Ao final da análise, você não recebe apenas números soltos. Recebe um plano de guerra.</p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-slate-100 p-3 rounded-lg mr-4">
                      <FileText className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Relatório Técnico Completo (PDF)</h4>
                      <p className="text-sm text-slate-500">Documento detalhado com simulação completa, premissas e cálculos. Seu guia mestre.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-slate-100 p-3 rounded-lg mr-4">
                      <TrendingUp className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Apresentação Executiva</h4>
                      <p className="text-sm text-slate-500">Reunião online com especialistas para expor resultados e recomendações estratégicas.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                   <div className="flex items-center text-slate-800 font-bold">
                      <Clock className="w-5 h-5 mr-2 text-brand-600" />
                      Prazo de Entrega: <span className="text-brand-600 ml-1">Até 10 dias úteis</span>
                   </div>
                   <p className="text-xs text-slate-400 mt-2">Metodologia ágil desenhada para gerar inteligência rápida.</p>
                </div>
              </div>
              <div className="bg-slate-900 p-10 flex flex-col justify-center items-center text-center text-white relative overflow-hidden">
                 <div className="absolute inset-0 bg-brand-600/20 pattern-grid-lg opacity-20"></div>
                 <h3 className="text-2xl font-bold mb-6 relative z-10">Proteja seu Capital de Giro</h3>
                 <blockquote className="text-xl italic font-serif text-brand-100 mb-6 relative z-10">
                   "Quanto custa para sua empresa ficar 1 mês sem capital de giro por erro de cálculo tributário?"
                 </blockquote>
                 <div className="w-full bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20 relative z-10">
                    <p className="text-sm font-medium">O valor investido neste diagnóstico é uma fração do prejuízo potencial da falta de preparação.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Table Layout */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Investimento Estratégico</h2>
            <p className="text-slate-600 mt-2">Um investimento para proteger a continuidade do seu negócio.</p>
          </div>

          <div className="border-2 border-brand-900 rounded-lg overflow-hidden text-slate-800 shadow-sm">
            
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 bg-brand-50 border-b-2 border-brand-900 font-bold text-brand-900 text-center">
              <div className="col-span-4 p-4 border-r border-brand-900 flex items-center justify-center">Regime & Documentação</div>
              <div className="col-span-4 p-4 border-r border-brand-900 flex items-center justify-center">Valor do Investimento</div>
              <div className="col-span-4 p-4 flex items-center justify-center">Condições</div>
            </div>

            {/* Row 1: Simples Nacional */}
            <div className="grid grid-cols-1 md:grid-cols-12 bg-brand-50 border-b-2 border-brand-900 last:border-b-0">
              <div className="col-span-1 md:col-span-4 p-6 border-b md:border-b-0 md:border-r border-brand-900 flex flex-col justify-center">
                <h3 className="text-xl font-extrabold text-brand-900 mb-4">Simples Nacional</h3>
                <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Documentos Essenciais</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Habilitação e-CAC</li>
                  <li>• Arquivos PGDAs</li>
                  <li>• XMLs de entrada/saída (12 meses)</li>
                </ul>
              </div>
              <div className="col-span-1 md:col-span-4 p-6 border-b md:border-b-0 md:border-r border-brand-900 flex items-center justify-center bg-brand-50/50">
                <div className="text-center">
                   <span className="block text-3xl font-extrabold text-brand-900">02</span>
                   <span className="text-sm font-bold text-brand-900 uppercase">salários mínimos vigentes</span>
                </div>
              </div>
              <div className="col-span-1 md:col-span-4 p-6 flex items-center justify-center">
                 <div className="text-center font-bold text-brand-900 leading-relaxed">
                   50% na contratação<br/>
                   <span className="block w-8 h-px bg-brand-300 mx-auto my-1"></span>
                   50% na entrega
                 </div>
              </div>
            </div>

            {/* Row 2: Lucro Presumido/Real */}
            <div className="grid grid-cols-1 md:grid-cols-12 bg-brand-50">
              <div className="col-span-1 md:col-span-4 p-6 border-b md:border-b-0 md:border-r border-brand-900 flex flex-col justify-center">
                <h3 className="text-xl font-extrabold text-brand-900 mb-4">Lucro Presumido / Real</h3>
                <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Documentos Essenciais</p>
                <ul className="text-sm text-slate-600 space-y-1">
                   <li>• Habilitação e-CAC</li>
                   <li>• Arquivos SPED Contribuições/Fiscal (12 meses)</li>
                </ul>
              </div>
              <div className="col-span-1 md:col-span-4 p-6 border-b md:border-b-0 md:border-r border-brand-900 flex items-center justify-center bg-brand-50/50">
                <div className="text-center">
                   <span className="block text-3xl font-extrabold text-brand-900">03</span>
                   <span className="text-sm font-bold text-brand-900 uppercase">salários mínimos vigentes</span>
                </div>
              </div>
              <div className="col-span-1 md:col-span-4 p-6 flex items-center justify-center">
                 <div className="text-center font-bold text-brand-900 leading-relaxed">
                   50% na contratação<br/>
                   <span className="block w-8 h-px bg-brand-300 mx-auto my-1"></span>
                   50% na entrega
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-slate-500 text-center">
             *Valores para matriz. Para filiais, consultar condições.
          </div>

          <div className="mt-8 text-center">
             <button 
               onClick={handleWhatsAppClick} 
               className="text-brand-800 hover:text-brand-600 font-bold underline transition"
             >
                Entre em contato via WhatsApp para contratar
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="mb-4">TaxReform.ai Brasil &copy; 2025</p>
          <p className="text-sm">
            Obs: O prazo de entrega pode variar de acordo com a complexidade dos dados a serem processados e do ramo de atuação do cliente.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-800">
             <button onClick={onBuy} className="text-white hover:text-brand-400 transition underline">
                Já tenho uma conta, quero acessar a plataforma
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};