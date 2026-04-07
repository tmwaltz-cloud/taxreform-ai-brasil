import React, { useEffect, useState } from 'react';
import { getActionGuide } from '../services/geminiService';
import { Brain, CheckSquare, ArrowRight, Home, Download, BookOpenCheck } from 'lucide-react';

interface ActionGuideProps {
  actionId: string;
  actionTitle: string;
  onNavigateHome?: () => void;
  onNavigateToInterpreter?: (text: string) => void;
}

export const ActionGuide: React.FC<ActionGuideProps> = ({ actionId, actionTitle, onNavigateHome, onNavigateToInterpreter }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const guideData = await getActionGuide(actionId, actionTitle);
        setData(guideData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [actionId, actionTitle]);

  const handleExport = () => window.print();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Gerando passo a passo personalizado...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-900 p-2 rounded-lg">
              <BookOpenCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
              <p className="text-slate-500 text-sm mt-0.5">Guia Prático de Implementação</p>
            </div>
          </div>
          <div className="flex gap-2">
              {onNavigateHome && (
                <button onClick={onNavigateHome} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition shadow-sm">
                   <Home className="w-4 h-4 mr-2" />
                   Voltar
                </button>
              )}
              <button onClick={handleExport} className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition">
                 <Download className="w-4 h-4 mr-2" /> PDF
              </button>
           </div>
        </div>

        {/* Context Section */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800">O que é e para que serve?</h2>
          <p className="text-slate-600 leading-relaxed">{data.description}</p>
          
          <div 
            className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => onNavigateToInterpreter && onNavigateToInterpreter(data.legislation)}
          >
            <Brain className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 text-sm flex items-center">
                Base Legal / Legislação
                <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Clique para interpretar</span>
              </h4>
              <p className="text-amber-700 text-sm mt-1">{data.legislation}</p>
            </div>
          </div>
        </div>

        {/* Step by Step */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center">
            <CheckSquare className="w-6 h-6 mr-2 text-brand-600" />
            Passo a Passo Prático
          </h2>
          <div className="space-y-6">
            {data.steps.map((step: any, idx: number) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1">
                  <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {data.tips && data.tips.length > 0 && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              Dicas Estratégicas
            </h2>
            <ul className="space-y-3">
              {data.tips.map((tip: string, idx: number) => (
                <li key={idx} className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-brand-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
