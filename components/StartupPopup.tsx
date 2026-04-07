import React, { useEffect, useState } from 'react';
import { fetchLatestUpdates } from '../services/geminiService';
import { NewsItem, UserRole } from '../types';
import { X, Bell, Loader2, ArrowRight } from 'lucide-react';

interface StartupPopupProps {
  onClose: () => void;
}

export const StartupPopup: React.FC<StartupPopupProps> = ({ onClose }) => {
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUrgentNews = async () => {
      try {
        // Fetches news and picks the first high impact one, or just the first one
        const updates = await fetchLatestUpdates(UserRole.EMPRESARIO);
        const highImpact = updates.find(u => u.impactLevel === 'Alto') || updates[0];
        setNews(highImpact);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadUrgentNews();
  }, []);

  if (loading) return null; // Don't show empty shell while loading
  if (!news) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-brand-600 p-4 flex items-center justify-between">
          <div className="flex items-center text-white gap-2">
            <Bell className="w-5 h-5 fill-current" />
            <span className="font-bold">Atualização Urgente</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
              news.impactLevel === 'Alto' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              Impacto {news.impactLevel}
            </span>
            <span className="text-xs text-slate-400 ml-2">{news.date}</span>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">{news.title}</h2>
          <p className="text-slate-600 leading-relaxed mb-6">{news.summary}</p>
          
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition flex items-center justify-center group"
          >
            Entendi, ir para o sistema
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};