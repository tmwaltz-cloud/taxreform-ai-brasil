import React, { useState } from 'react';
import { Activity, LayoutDashboard, Calculator, FileText, ArrowRight, ArrowLeft, AlertTriangle, Calendar, Wallet, TrendingUp, CheckCircle, AlertOctagon } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onLearnMore: () => void;
  initialStep?: number; // New prop
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onLearnMore, initialStep = 0 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const steps = [
    // Step 0: Welcome / The Hook
    {
      title: "Domine a Reforma Tributária",
      subtitle: "A maior mudança fiscal dos últimos 50 anos começou.",
      content: (
        <div className="space-y-6">
          <p className="text-lg text-slate-300 leading-relaxed">
            Não é apenas uma mudança de alíquota. É uma mudança completa na <strong>lógica de negócios</strong>. 
            Empresas que não se adaptarem em 2026 correm risco real de insolvência ou perda brutal de mercado.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <AlertOctagon className="w-8 h-8 text-red-500 mb-2" />
                <h3 className="font-bold text-white">Risco Imediato</h3>
                <p className="text-sm text-slate-400">Multas por erro no cClassTrib e bloqueio de caixa pelo Split Payment.</p>
             </div>
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <TrendingUp className="w-8 h-8 text-brand-500 mb-2" />
                <h3 className="font-bold text-white">Oportunidade</h3>
                <p className="text-sm text-slate-400">Quem dominar os créditos tributários terá o preço mais competitivo.</p>
             </div>
          </div>
        </div>
      )
    },
    // Step 1: Structural Changes
    {
      title: "O Que Muda na Prática?",
      subtitle: "3 Pilares que vão alterar sua precificação.",
      content: (
        <div className="grid grid-cols-1 gap-4">
           <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-brand-500">
              <h3 className="font-bold text-white text-lg flex items-center mb-1">
                 <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded mr-2">1</span>
                 Destino (Onde consome)
              </h3>
              <p className="text-slate-400 text-sm">
                 O imposto deixa de ser devido onde você produz e passa a ser devido onde o cliente está. 
                 <br/><span className="text-brand-300">Impacto:</span> Fim da guerra fiscal e dos incentivos regionais atuais.
              </p>
           </div>
           <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-purple-500">
              <h3 className="font-bold text-white text-lg flex items-center mb-1">
                 <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded mr-2">2</span>
                 Cálculo "Por Fora"
              </h3>
              <p className="text-slate-400 text-sm">
                 O imposto não compõe mais a própria base. Acaba o "imposto sobre imposto". 
                 <br/><span className="text-purple-300">Impacto:</span> Transparência total, mas alíquotas nominais parecerão mais altas (26.5% estimado).
              </p>
           </div>
           <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-emerald-500">
              <h3 className="font-bold text-white text-lg flex items-center mb-1">
                 <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded mr-2">3</span>
                 Não-Cumulatividade Plena
              </h3>
              <p className="text-slate-400 text-sm">
                 Tudo gera crédito: energia, marketing, uso e consumo. 
                 <br/><span className="text-emerald-300">Impacto:</span> Empresas no Lucro Real/Híbrido podem se tornar muito mais baratas para clientes B2B.
              </p>
           </div>
        </div>
      )
    },
    // Step 2: Split Payment (Cash Flow)
    {
      title: "Alerta de Caixa: Split Payment",
      subtitle: "O dinheiro não entra mais todo na sua conta.",
      content: (
        <div className="space-y-6">
           <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl flex items-start gap-4">
              <Wallet className="w-12 h-12 text-red-500 flex-shrink-0" />
              <div>
                 <h3 className="font-bold text-white text-lg">Bloqueio Automático na Fonte</h3>
                 <p className="text-slate-300 mt-2 text-sm leading-relaxed">
                    Ao passar o cartão ou pagar um boleto/Pix, o banco irá <strong>separar automaticamente</strong> a parte do imposto (IBS/CBS) e enviar direto ao governo.
                 </p>
                 <p className="text-white font-bold mt-2 text-sm">
                    ⚠️ Você só recebe o valor líquido. Se seu capital de giro depende do "float" do imposto a pagar no dia 20, sua empresa vai parar.
                 </p>
              </div>
           </div>
           <div className="text-center">
              <p className="text-slate-400 text-sm">
                 Nossa plataforma simula exatamente qual será seu novo fluxo de caixa líquido.
              </p>
           </div>
        </div>
      )
    },
    // Step 3: 2026 Timeline (Specifics)
    {
      title: "Cronograma Crítico 2026",
      subtitle: "Datas que definem o futuro do Simples Nacional.",
      content: (
        <div className="relative border-l-2 border-slate-700 ml-4 space-y-8 my-4">
           {/* Jan */}
           <div className="relative pl-8">
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-900 border-2 border-brand-500 rounded-full"></div>
              <h4 className="font-bold text-white">Janeiro 2026</h4>
              <p className="text-sm text-slate-400">Início da fase piloto. Cobrança de 0,9% (CBS) e 0,1% (IBS). Ajuste de sistemas.</p>
           </div>
           {/* April */}
           <div className="relative pl-8">
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-900 border-2 border-amber-500 rounded-full"></div>
              <h4 className="font-bold text-white flex items-center">
                 Abril 2026 <span className="ml-2 bg-amber-500 text-black text-[10px] font-bold px-1.5 rounded uppercase">Atenção</span>
              </h4>
              <p className="text-sm text-slate-400">
                 Previsão de início da segregação de parcelas do IBS/CBS no DAS. O sistema começa a preparar quem vai migrar.
              </p>
           </div>
           {/* September */}
           <div className="relative pl-8">
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-900 border-2 border-red-500 rounded-full animate-pulse"></div>
              <h4 className="font-bold text-white flex items-center">
                 Setembro 2026 <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded uppercase">Decisivo</span>
              </h4>
              <p className="text-sm text-slate-400">
                 <strong>Prazo final estimado</strong> para empresas do Simples optarem pelo "Regime Híbrido" (pagar IBS/CBS por fora para transferir crédito integral).
                 <br/><span className="text-red-400 text-xs font-bold">Quem perder esse prazo pode perder todos os clientes B2B em 2027.</span>
              </p>
           </div>
           {/* 2027 */}
           <div className="relative pl-8">
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-700 rounded-full"></div>
              <h4 className="font-bold text-slate-500">2027</h4>
              <p className="text-sm text-slate-600">Extinção do PIS/COFINS. Vigência plena da CBS.</p>
           </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-brand-900/20 rounded-bl-full -z-0 pointer-events-none blur-3xl"></div>
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 z-20">
         <div 
           className="h-full bg-brand-500 transition-all duration-500 ease-out" 
           style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
         ></div>
      </div>

      <nav className="p-6 md:p-8 z-10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <Activity className="h-8 w-8 text-brand-500" />
          <span className="ml-3 font-bold text-xl tracking-tight">TaxReform<span className="text-brand-500">.ai Brasil</span></span>
        </div>
        <div className="text-sm font-medium text-slate-400 hidden md:block">
           Passo {currentStep + 1} de {steps.length}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 max-w-4xl mx-auto w-full my-auto">
         
         <div className="w-full bg-slate-800/30 backdrop-blur-md border border-slate-700/50 p-8 md:p-12 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">
               {steps[currentStep].title}
            </h1>
            <p className="text-lg text-brand-400 font-medium mb-8">
               {steps[currentStep].subtitle}
            </p>

            <div className="text-left min-h-[300px] flex flex-col justify-center">
               {steps[currentStep].content}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-slate-700/50 pt-8">
               <button 
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`flex items-center text-slate-400 hover:text-white transition ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
               >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Anterior
               </button>

               <div className="flex space-x-2">
                  {steps.map((_, idx) => (
                     <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentStep ? 'bg-brand-500 scale-125' : 'bg-slate-700'}`}></div>
                  ))}
               </div>

               <button 
                  onClick={handleNext}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-brand-900/50 flex items-center"
               >
                  {currentStep === steps.length - 1 ? "Acessar Plataforma" : "Próximo"}
                  <ArrowRight className="ml-2 w-5 h-5" />
               </button>
            </div>
         </div>
         
         {currentStep === 0 && (
            <button onClick={onComplete} className="mt-8 text-slate-500 hover:text-slate-300 text-sm underline transition">
               Pular introdução e ir para o sistema
            </button>
         )}

      </main>
    </div>
  );
};