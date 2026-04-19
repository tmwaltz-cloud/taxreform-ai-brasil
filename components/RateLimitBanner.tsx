import React from 'react';
import { Zap, ArrowRight, X } from 'lucide-react';

// Mapa de nomes amigáveis por chave de rate limit
const MODULE_LABELS: Record<string, { name: string; icon: string }> = {
  consultant:   { name: 'Consultor JaxAI',        icon: '🤖' },
  supplyChain:  { name: 'Cadeia de Valor',         icon: '🔗' },
  interpreter:  { name: 'Intérprete Legal',         icon: '⚖️' },
  actionGuide:  { name: 'Guias de Ação',            icon: '📋' },
  accountant:   { name: 'Guia do Contador 4.0',    icon: '📊' },
  timeline:     { name: 'Cronograma da Reforma',   icon: '🗓️' },
  news:         { name: 'Radar de Inteligência',   icon: '📡' },
};

// Limites por plano — para mostrar o que o usuário ganha ao assinar
const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free:     { consultant: 3,  supplyChain: 1,  interpreter: 2,  actionGuide: 3,  accountant: 1 },
  monthly:  { consultant: 15, supplyChain: 5,  interpreter: 10, actionGuide: 10, accountant: 3 },
  lifetime: { consultant: 20, supplyChain: 10, interpreter: 15, actionGuide: 15, accountant: 5 },
};

interface RateLimitBannerProps {
  rateLimitKey: string;
  limit: number;
  onUpgrade: () => void;
  onClose?: () => void;
  inline?: boolean; // true = banner inline, false = modal overlay (default)
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({
  rateLimitKey,
  limit,
  onUpgrade,
  onClose,
  inline = false,
}) => {
  const module = MODULE_LABELS[rateLimitKey] ?? { name: rateLimitKey, icon: '⚡' };
  const monthlyLimit = PLAN_LIMITS.monthly[rateLimitKey] ?? limit * 3;
  const lifetimeLimit = PLAN_LIMITS.lifetime[rateLimitKey] ?? limit * 4;

  const content = (
    <div className={`${inline ? 'rounded-xl border border-amber-200 bg-amber-50' : 'bg-white rounded-2xl shadow-2xl max-w-md w-full'} p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
            {module.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">
              Limite diário atingido
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">{module.name}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Mensagem */}
      <p className="text-sm text-slate-600 leading-relaxed mb-5">
        Você usou todas as <span className="font-semibold text-amber-700">{limit} consultas</span> disponíveis
        hoje para o {module.name}. Reinicia à meia-noite.
      </p>

      {/* Comparativo de planos */}
      <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Desbloqueie mais consultas
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">Freemium</span>
            <span className="text-xs text-slate-500">atual</span>
          </div>
          <span className="text-xs font-bold text-slate-700">{limit}/dia</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">⚡ Mensal R$27</span>
          </div>
          <span className="text-xs font-bold text-blue-700">{monthlyLimit}/dia</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">💎 Vitalício R$97</span>
          </div>
          <span className="text-xs font-bold text-emerald-700">{lifetimeLimit}/dia</span>
        </div>
      </div>

      {/* CTAs */}
      <button
        onClick={onUpgrade}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 mb-2"
      >
        <Zap size={15} />
        Ver planos e desbloquear →
      </button>
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          Continuar com o limite atual
        </button>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
};

// Hook utilitário para detectar RateLimitError e controlar o banner
export function useRateLimit(onUpgrade: () => void) {
  const [rateLimitInfo, setRateLimitInfo] = React.useState<{
    key: string;
    limit: number;
  } | null>(null);

  const handleError = React.useCallback((err: any) => {
    if (err?.name === 'RateLimitError' || err?.message?.includes('Limite diário')) {
      setRateLimitInfo({ key: err.key ?? 'unknown', limit: err.limit ?? 0 });
      return true; // foi rate limit
    }
    return false; // outro tipo de erro
  }, []);

  const clearRateLimit = React.useCallback(() => setRateLimitInfo(null), []);

  const banner = rateLimitInfo ? (
    <RateLimitBanner
      rateLimitKey={rateLimitInfo.key}
      limit={rateLimitInfo.limit}
      onUpgrade={() => { clearRateLimit(); onUpgrade(); }}
      onClose={clearRateLimit}
    />
  ) : null;

  return { handleError, clearRateLimit, banner, isBlocked: !!rateLimitInfo };
}
