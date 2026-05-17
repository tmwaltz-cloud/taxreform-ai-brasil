// src/components/PlanGate.tsx
// Wrapper de paywall — envolva qualquer feature paga com este componente

import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { PlanType } from '../hooks/usePlan';

interface PlanGateProps {
  isPaid:       boolean;
  isLoading?:   boolean;
  feature?:     string;           // ex: "Consultor JaxAI"
  blur?:        boolean;          // mostra preview borrado em vez de ocultar
  onUpgrade?:   () => void;       // callback para abrir modal/redirecionar
  children:     React.ReactNode;
}

export const PlanGate: React.FC<PlanGateProps> = ({
  isPaid,
  isLoading = false,
  feature = 'este recurso',
  blur = true,
  onUpgrade,
  children,
}) => {
  if (isLoading) return null;
  if (isPaid)    return <>{children}</>;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Dispara evento global — App.tsx pode ouvir e abrir modal de upgrade
      window.dispatchEvent(new CustomEvent('taxreform:upgrade'));
    }
  };

  return (
    <div className="relative">
      {/* Preview borrado */}
      {blur && (
        <div className="pointer-events-none select-none blur-sm opacity-40 saturate-50">
          {children}
        </div>
      )}

      {/* Overlay de paywall */}
      <div className={`
        ${blur ? 'absolute inset-0' : ''}
        flex flex-col items-center justify-center
        bg-white/80 backdrop-blur-sm rounded-xl
        border border-brand-100 p-6 text-center
        ${!blur ? 'py-10' : ''}
      `}>
        <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-brand-500" />
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-1">
          {feature} é exclusivo para assinantes
        </p>
        <p className="text-xs text-slate-500 mb-4 max-w-xs">
          Acesse a partir de <strong>R$&nbsp;27/mês</strong> ou <strong>R$&nbsp;97 vitalício</strong>
        </p>
        <button
          onClick={handleUpgrade}
          className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Zap className="w-4 h-4 mr-1.5" /> Quero acesso completo
        </button>
      </div>
    </div>
  );
};

// ─── Banner de upgrade (faixa discreta, não bloqueia) ────────────────────────
interface UpgradeBannerProps {
  plan:       PlanType;
  onUpgrade?: () => void;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ plan, onUpgrade }) => {
  if (plan !== 'free') return null;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.dispatchEvent(new CustomEvent('taxreform:upgrade'));
    }
  };

  return (
    <div className="bg-gradient-to-r from-brand-600 to-purple-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm mb-4">
      <div className="flex items-center">
        <Zap className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium">
          Você está no plano gratuito — acesso limitado a 3 notícias e sem JaxAI
        </span>
      </div>
      <button
        onClick={handleUpgrade}
        className="ml-4 flex-shrink-0 bg-white text-brand-700 text-xs font-bold px-3 py-1 rounded-full hover:bg-brand-50 transition-colors"
      >
        Assinar
      </button>
    </div>
  );
};
