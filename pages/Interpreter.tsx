import React, { useState } from 'react';
import { UserRole } from '../types';
import { interpretLegalText } from '../services/geminiService';
import { BookOpen, Zap, CheckCircle, AlertTriangle, Home, Save, Download, Loader2 } from 'lucide-react';

interface InterpreterProps {
  userRole: UserRole;
  onNavigateHome: () => void;
  initialText?: string;
}

export const Interpreter: React.FC<InterpreterProps> = ({ userRole, onNavigateHome, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const handleInterpret = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await interpretLegalText(text, userRole);
      setInterpretation(result);
    } catch (error) {
      alert("Erro ao interpretar texto.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!interpretation) return;
    setSaving(true);
    try {
      // Mock save functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Interpretação salva com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar interpretação.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => window.print();

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold text-slate-900">Intérprete Legislativo</h1>
               <button onClick={onNavigateHome} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition shadow-sm" title="Voltar ao Início">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
               </button>
            </div>
            <p className="text-slate-500 mt-1">Cole trechos de leis, emendas ou regulamentações para receber uma tradução simplificada.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!interpretation || saving} className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition">
               {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Salvar
            </button>
            <button onClick={handleExport} disabled={!interpretation} className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition">
               <Download className="w-4 h-4 mr-2" /> PDF
            </button>
         </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input */}
          <div className="flex flex-col h-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">Texto Original (Norma Técnica)</label>
            <textarea
              className="flex-1 w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono text-sm leading-relaxed resize-none shadow-sm min-h-[300px]"
              placeholder="Cole aqui o artigo da lei ou texto jurídico..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
               <button
                 onClick={handleInterpret}
                 disabled={loading || !text.trim()}
                 className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
               >
                 <Zap className={`w-4 h-4 mr-2 ${loading ? 'text-yellow-300' : ''}`} />
                 {loading ? 'Analisando...' : 'Traduzir para ' + userRole}
               </button>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col h-full">
             <label className="block text-sm font-medium text-slate-700 mb-2">Interpretação ({userRole})</label>
             <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-y-auto min-h-[300px]">
                {!interpretation && !loading && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <BookOpen className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm">O resultado aparecerá aqui.</p>
                   </div>
                )}
                
                {loading && (
                   <div className="h-full flex flex-col items-center justify-center space-y-4">
                      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-500 animate-pulse">Processando complexidade jurídica...</p>
                   </div>
                )}

                {interpretation && !loading && (
                   <div className="prose prose-sm prose-slate max-w-none">
                      <div className="whitespace-pre-wrap">{interpretation}</div>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm">Linguagem Simples</h3>
              <p className="text-xs text-slate-500 mt-1">Remove jargões desnecessários mantendo a precisão técnica.</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm">Foco em Risco</h3>
              <p className="text-xs text-slate-500 mt-1">Identifica passivos ocultos e novas obrigações.</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <BookOpen className="w-5 h-5 text-brand-600 mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm">Contexto Atualizado</h3>
              <p className="text-xs text-slate-500 mt-1">Considera as últimas emendas constitucionais.</p>
           </div>
        </div>
      </div>
    </div>
  );
};