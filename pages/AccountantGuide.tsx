import React, { useEffect, useState } from 'react';
import { getAccountantStrategicGuide } from '../services/geminiService';
import { AccountantGuideData } from '../types';
import { Brain, Database, Cpu, Users, ArrowRight, CheckSquare, Lightbulb, ShieldAlert, Download, Save, Home, BookOpenCheck } from 'lucide-react';

interface AccountantGuideProps {
  onNavigateHome: () => void;
}

export const AccountantGuide: React.FC<AccountantGuideProps> = ({ onNavigateHome }) => {
  const [data, setData] = useState<AccountantGuideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const guideData = await getAccountantStrategicGuide();
        setData(guideData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleExport = () => window.print();
  const handleSave = () => alert("Guia salvo na sua biblioteca.");

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain': return <Brain className="w-6 h-6 text-brand-500" />;
      case 'Database': return <Database className="w-6 h-6 text-brand-500" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-brand-500" />;
      case 'Users': return <Users className="w-6 h-6 text-brand-500" />;
      default: return <CheckSquare className="w-6 h-6 text-brand-500" />;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Gerando estratégia personalizada para contadores...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-900 p-2 rounded-lg">
            <BookOpenCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Guia do Contador 4.0</h1>
            <p className="text-slate-500 text-sm mt-0.5">Do Operacional ao Estratégico na Reforma Tributária</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={onNavigateHome} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition shadow-sm" title="Voltar ao Início">
               <Home className="w-4 h-4 mr-2" />
               Voltar ao Início
            </button>
            <button onClick={handleSave} className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
               <Save className="w-4 h-4 mr-2" /> Salvar
            </button>
            <button onClick={handleExport} className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition">
               <Download className="w-4 h-4 mr-2" /> PDF
            </button>
         </div>
      </div>

      {/* The Shift Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <h2 className="text-xl font-bold mb-6 flex items-center relative z-10">
           A Mudança de Paradigma
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
           <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600 flex-1 w-full">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">O Passado (DE:)</span>
              <h3 className="text-xl font-semibold text-slate-200 mt-2">{data.profileShift?.from}</h3>
              <p className="text-slate-400 text-sm mt-2">Foco em apuração reativa, entrega de obrigações acessórias e correção de erros.</p>
           </div>
           
           <div className="hidden md:flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-brand-400" />
           </div>

           <div className="bg-brand-600/20 p-6 rounded-xl border border-brand-500/50 flex-1 w-full">
              <span className="text-brand-300 text-xs uppercase tracking-wider font-bold">O Futuro (PARA:)</span>
              <h3 className="text-xl font-bold text-white mt-2">{data.profileShift?.to}</h3>
              <p className="text-brand-100/80 text-sm mt-2">{data.profileShift?.description}</p>
           </div>
        </div>
      </div>

      {/* Competencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {data.competencies?.map((comp, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
               <div className="bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {getIcon(comp.icon)}
               </div>
               <h3 className="font-bold text-slate-800 text-lg mb-2">{comp.title}</h3>
               <p className="text-slate-600 text-sm leading-relaxed">{comp.description}</p>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Action Plan */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-700 flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-brand-600" /> Checklist de Preparação
               </h3>
            </div>
            <div className="p-6 space-y-8">
               {data.actionPlan?.map((phase, idx) => (
                  <div key={idx}>
                     <div className="flex items-center mb-4">
                        <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-1 rounded uppercase mr-3">
                           {phase.phase}
                        </span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                     </div>
                     <ul className="space-y-3">
                        {phase.actions?.map((action, actionIdx) => (
                           <li key={actionIdx} className="flex items-start">
                              <div className="flex-shrink-0 h-5 w-5 rounded border border-slate-300 mr-3 mt-0.5"></div>
                              <span className="text-slate-700 text-sm">{action}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               ))}
            </div>
         </div>

         {/* Consultancy Tips */}
         <div className="space-y-6">
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-6 shadow-sm">
               <h3 className="font-bold text-amber-900 flex items-center mb-4">
                  <Lightbulb className="w-5 h-5 mr-2" /> Como Vender Consultoria
               </h3>
               <ul className="space-y-4">
                  {data.consultancyTips?.map((tip, idx) => (
                     <li key={idx} className="flex items-start text-amber-800/80 text-sm">
                        <span className="font-bold text-amber-500 mr-2">{idx + 1}.</span>
                        {tip}
                     </li>
                  ))}
               </ul>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 shadow-sm">
               <h3 className="font-bold text-slate-800 flex items-center mb-4">
                  <ShieldAlert className="w-5 h-5 mr-2 text-red-500" /> Risco de Inércia
               </h3>
               <p className="text-sm text-slate-600 leading-relaxed">
                  Ignorar a profundidade da transformação (tecnológica e processual) pode custar caro em perda de clientes para escritórios digitalizados e autuações por erros de cadastro (cClassTrib).
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};