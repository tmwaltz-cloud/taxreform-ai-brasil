import { useState, useEffect } from "react";

interface UpsellPopupProps {
  onClose: () => void;
}

export function UpsellPopup({ onClose }: UpsellPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostra apenas se for usuário free E for o 2º acesso ou mais
    const plan = localStorage.getItem('user_plan');
    const loginCount = parseInt(localStorage.getItem('login_count') || '0', 10);
    const dismissed = sessionStorage.getItem('upsell_dismissed');

    if (plan === 'free' && loginCount >= 2 && !dismissed) {
      setTimeout(() => setVisible(true), 3000); // aparece após 3s
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('upsell_dismissed', '1');
    setVisible(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #0a0f1a, #0f1a10)',
          border: '1px solid rgba(52,211,153,0.25)',
          boxShadow: '0 0 50px rgba(52,211,153,0.1)',
        }}
      >
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #10b981, #06b6d4, transparent)' }} />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >✕</button>

        <div className="px-6 pt-8 pb-6">
          {/* Ícone */}
          <div className="text-4xl text-center mb-3">🚀</div>

          {/* Título */}
          <h2 className="text-center text-xl font-bold text-white mb-1">
            Você está usando o plano gratuito
          </h2>
          <p className="text-center text-sm text-slate-400 mb-5">
            Desbloqueie todas as ferramentas por apenas <span className="text-emerald-400 font-semibold">R$27/mês</span>
          </p>

          {/* Benefícios */}
          <div className="space-y-2 mb-6">
            {[
              '🤖 JaxAI — 15 perguntas por dia',
              '🔗 Cadeia de Valor fiscal completa',
              '📋 Guia do Contador 4.0',
              '⚡ Guias de Ação Práticos',
              '⚖️ Intérprete Legislativo',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <button
            onClick={() => { window.open('https://pay.kiwify.com.br/myXjxAN', '_blank'); handleClose(); }}
            className="w-full py-3 rounded-xl font-bold text-sm text-white mb-2 transition"
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            }}
          >
            Vitalício R$97 — Acesso para sempre ⭐
          </button>

          <button
            onClick={() => { window.open('https://pay.kiwify.com.br/DM37j2q', '_blank'); handleClose(); }}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-slate-300 mb-3 transition"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Mensal R$27/mês
          </button>

          <button
            onClick={handleClose}
            className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition py-1"
          >
            Continuar com o plano gratuito
          </button>
        </div>
      </div>
    </div>
  );
}
