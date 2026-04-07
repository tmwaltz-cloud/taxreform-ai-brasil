import React from 'react';
import { LayoutDashboard, MessageSquareText, Calculator, ArrowRight, ShieldCheck, Activity, Info } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
  onStartOnboarding: (step: number) => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter, onStartOnboarding }) => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none"></div>

      {/* Header Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
         <Activity className="h-6 w-6 text-brand-500" />
         <span className="font-bold text-lg tracking-tight">TaxReform<span className="text-brand-500">.ai Brasil</span></span>
      </div>

      <div className="max-w-3xl w-full z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Main Card */}
        <div className="bg-[#151e32] border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/50 text-center">
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Inteligência Estratégica
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 font-medium mb-8">
            Não é apenas compliance, é sobrevivência de negócio.
          </p>

          <div className="text-sm text-slate-500 mb-10 leading-relaxed max-w-xl mx-auto">
            Nossa plataforma utiliza IA de última geração para projetar cenários personalizados baseados no seu <strong>CNAE</strong> e <strong>Regime Tributário</strong>.
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 gap-4 mb-10 text-left">
            
            <div className="bg-[#1e293b] hover:bg-[#253248] transition p-4 rounded-xl border border-slate-700 flex items-center group">
              <div className="bg-blue-500/20 p-2.5 rounded-lg mr-4 group-hover:bg-blue-500/30 transition">
                <LayoutDashboard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Radar em Tempo Real</h3>
                <p className="text-xs text-slate-500 mt-0.5">Notícias e normativas filtradas para você.</p>
              </div>
            </div>

            <div className="bg-[#1e293b] hover:bg-[#253248] transition p-4 rounded-xl border border-slate-700 flex items-center group">
              <div className="bg-purple-500/20 p-2.5 rounded-lg mr-4 group-hover:bg-purple-500/30 transition">
                <MessageSquareText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">JaxAI</h3>
                <p className="text-xs text-slate-500 mt-0.5">Seu consultor especialista disponível 24h.</p>
              </div>
            </div>

            <div className="bg-[#1e293b] hover:bg-[#253248] transition p-4 rounded-xl border border-slate-700 flex items-center group">
              <div className="bg-emerald-500/20 p-2.5 rounded-lg mr-4 group-hover:bg-emerald-500/30 transition">
                <Calculator className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Simulador</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cálculo exato de carga e impacto no lucro.</p>
              </div>
            </div>

          </div>

          {/* Divider with loading bars */}
          <div className="flex items-center gap-2 mb-8 justify-center opacity-30">
             <div className="h-1 w-8 bg-brand-500 rounded-full"></div>
             <div className="h-1 w-8 bg-slate-600 rounded-full"></div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button 
               onClick={onEnter}
               className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-brand-900/50 flex items-center justify-center text-sm md:text-base"
             >
               Entrar na Plataforma <ArrowRight className="ml-2 w-5 h-5" />
             </button>

             <button 
               onClick={() => onStartOnboarding(1)} // Start at Step 1 (Page 2)
               className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-4 px-8 rounded-xl transition-all border border-slate-700 flex items-center justify-center text-sm md:text-base"
             >
               <Info className="mr-2 w-5 h-5" /> Entenda o Impacto
             </button>
          </div>

        </div>
        
        {/* Footer Login Link */}
        <div className="mt-8 text-center">
           <a href="#" onClick={(e) => { e.preventDefault(); onEnter(); }} className="text-slate-500 hover:text-slate-300 text-sm transition">
              Acessar Login
           </a>
        </div>

      </div>
    </div>
  );
};