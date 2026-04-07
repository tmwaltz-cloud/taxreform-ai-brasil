import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { askTaxConsultant } from '../services/geminiService';
import { MessageSquareText, Send, User, Bot, Sparkles, Home, ArrowRight, Save, Download, Loader2 } from 'lucide-react';

interface ConsultantProps {
  userRole: UserRole;
  onNavigateHome: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Como a reforma impacta clínicas médicas no Lucro Presumido?",
  "Vale a pena migrar do Simples para o Híbrido sendo indústria?",
  "Quais são as regras para cashback na cesta básica?",
  "Como fica a tributação de softwares (SaaS) no novo IVA?"
];

export const Consultant: React.FC<ConsultantProps> = ({ userRole, onNavigateHome }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, questionOverride?: string) => {
    e?.preventDefault();
    const question = questionOverride || input;
    
    if (!question.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: question } as Message];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await askTaxConsultant(question, userRole);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: "Erro ao processar sua consulta. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (messages.length === 0) return;
    setSaving(true);
    try {
      // Mock save functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Consulta salva no histórico!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar consulta.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => window.print();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-brand-100 p-2 rounded-lg">
             <MessageSquareText className="w-6 h-6 text-brand-600" />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-slate-900">Consultor Tributário (JaxAI)</h1>
              <p className="text-slate-500 text-sm mt-0.5">Inteligência Estratégica estilo IOB / Big 4</p>
           </div>
        </div>
        <div className="flex gap-2">
            <button onClick={onNavigateHome} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition shadow-sm" title="Voltar ao Início">
               <Home className="w-4 h-4 mr-2" />
               Voltar ao Início
            </button>
            <button onClick={handleSave} disabled={messages.length === 0 || saving} className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition">
               {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Salvar
            </button>
            <button onClick={handleExport} disabled={messages.length === 0} className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition">
               <Download className="w-4 h-4 mr-2" /> PDF
            </button>
         </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-4 md:p-6 shadow-inner space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-80">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
               <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Olá! Eu sou o JaxAI.</h3>
            <p className="text-slate-500 max-w-md mt-2 mb-8">
              Sou seu consultor sênior em Reforma Tributária. Posso analisar seu modelo de negócio e sugerir estratégias de transição.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSubmit(undefined, q)}
                  className="text-left text-sm p-4 bg-white border border-slate-200 rounded-lg hover:border-brand-400 hover:shadow-md transition text-slate-700 flex justify-between items-center group"
                >
                  {q}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-brand-500 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'assistant' && (
               <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-1">
                 <Bot className="w-5 h-5 text-white" />
               </div>
             )}
             
             <div className={`max-w-3xl rounded-2xl p-5 shadow-sm ${
               msg.role === 'user' 
                 ? 'bg-slate-800 text-white rounded-tr-none' 
                 : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none prose prose-sm prose-slate'
             }`}>
               {msg.role === 'user' ? (
                 <p className="whitespace-pre-wrap">{msg.content}</p>
               ) : (
                 // Simple Markdown Rendering for Assistant
                 <div className="markdown-body">
                    {msg.content.split('\n').map((line, i) => {
                      // Headers
                      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-brand-700 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                      if (line.startsWith('JaxAI:')) return <div key={i} className="font-bold text-slate-400 text-xs uppercase mb-2 tracking-widest">{line}</div>;
                      // Lists
                      if (line.trim().startsWith('* ')) return <li key={i} className="ml-4 list-disc">{line.replace('* ', '')}</li>;
                      if (line.trim().match(/^\d+\. /)) return <div key={i} className="font-semibold text-slate-800 mt-2">{line}</div>;
                      // Bold
                      if (line.includes('**') || line.includes('*')) {
                         // Very basic bold parser for this specific use case
                         const parts = line.split('*');
                         return (
                           <p key={i} className="mb-2">
                             {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx}>{part}</strong> : part)}
                           </p>
                         );
                      }
                      return <p key={i} className="mb-2">{line}</p>;
                    })}
                 </div>
               )}
             </div>

             {msg.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                 <User className="w-5 h-5 text-slate-500" />
               </div>
             )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                 <Bot className="w-5 h-5 text-white" />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 flex-shrink-0">
        <form onSubmit={(e) => handleSubmit(e)} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida tributária..."
            className="w-full pl-6 pr-14 py-4 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700 placeholder-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-2">
           O JaxAI oferece orientações baseadas na legislação, mas não substitui um parecer jurídico oficial.
        </p>
      </div>
    </div>
  );
};