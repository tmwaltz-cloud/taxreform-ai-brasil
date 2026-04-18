import React from 'react';
import type { Session } from '@supabase/supabase-js';
import type { PageType, PlanId } from '../App';
import {
  LayoutDashboard, Bot, Link2, BookOpen,
  MapPin, FileSearch, X, Zap, Crown, Clock,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: PlanId | null;
  // Novas props para exibir plano real e dias restantes
  planLabel?: string;
  planIcon?: string;
  daysLeft?: number | null;
  onUpgrade?: () => void;
  session: Session | null;
}

interface NavItem {
  id: PageType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',       label: 'Legislação & Radar',   sublabel: 'Monitor em tempo real',     icon: <LayoutDashboard size={18} /> },
  { id: 'consultant',      label: 'Consultor IA',         sublabel: 'JaxAI responde dúvidas',    icon: <Bot size={18} />,    badge: 'IA' },
  { id: 'supply-chain',    label: 'Cadeia de Valor',      sublabel: 'Impacto por setor',         icon: <Link2 size={18} /> },
  { id: 'accountant-guide',label: 'Guia do Contador 4.0', sublabel: 'Atualização profissional',  icon: <BookOpen size={18} /> },
  { id: 'action-guide',    label: 'Guias de Ação',        sublabel: 'Passo a passo prático',     icon: <MapPin size={18} /> },
  { id: 'interpreter',     label: 'Intérprete Legal',     sublabel: 'LC 214 em linguagem clara', icon: <FileSearch size={18} /> },
];

const Sidebar: React.FC<SidebarProps> = ({
  currentPage, onNavigate, isOpen, onClose,
  selectedPlanId, planLabel, planIcon, daysLeft, onUpgrade, session,
}) => {
  const isFree = selectedPlanId === 'free' || !selectedPlanId;
  const isMonthly = selectedPlanId === 'monthly';
  const isLifetime = selectedPlanId === 'lifetime';

  // Label e ícone: usa props se vier do App (plano real do Supabase), senão fallback
  const displayLabel = planLabel ?? (isFree ? 'Plano Freemium' : isMonthly ? 'Plano Mensal' : 'Plano Vitalício');
  const displayIcon  = planIcon  ?? (isFree ? '👑' : isMonthly ? '⚡' : '💎');

  // Cor do badge por plano
  const badgeColor = isFree
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    : isMonthly
    ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';

  const subColor = isFree ? 'text-amber-500/70' : isMonthly ? 'text-blue-500/70' : 'text-emerald-500/70';

  // Texto do sub-badge
  const subLabel = isFree
    ? (typeof daysLeft === 'number' && daysLeft >= 0
        ? (daysLeft === 0 ? 'Acesso expirado' : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`)
        : '7 dias de acesso')
    : isMonthly
    ? 'Assinatura ativa'
    : 'Acesso vitalício';

  return (
    <aside className={`
      fixed top-0 left-0 h-full z-30 w-60 sm:w-64
      bg-gray-900 border-r border-gray-800
      flex flex-col
      transition-transform duration-300 ease-in-out
      lg:relative lg:translate-x-0 lg:z-auto
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      overflow-hidden
    `}>

      {/* Logo + fechar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-emerald-500 flex-shrink-0 flex items-center justify-center">
            <Zap size={14} className="text-gray-950" />
          </div>
          <div className="min-w-0">
            <span className="text-white font-semibold text-xs sm:text-sm leading-none block">TaxReform</span>
            <span className="text-emerald-400 font-semibold text-xs sm:text-sm leading-none block">.ai Brasil</span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 p-1">
          <X size={18} />
        </button>
      </div>

      {/* Badge de plano — mostra sempre, com plano real */}
      <div className={`mx-2 sm:mx-4 mt-2 sm:mt-3 mb-1 px-2 sm:px-3 py-2 rounded-lg border flex items-center gap-2 ${badgeColor}`}>
        <span className="text-sm flex-shrink-0">{displayIcon}</span>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold leading-none">{displayLabel}</p>
          <p className={`text-[9px] sm:text-[10px] leading-none mt-0.5 ${subColor} flex items-center gap-1`}>
            {isFree && typeof daysLeft === 'number' && daysLeft <= 3 && daysLeft > 0 && (
              <Clock size={9} className="flex-shrink-0" />
            )}
            {subLabel}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 sm:px-3 py-2 sm:py-3 overflow-y-auto space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
                transition-all duration-150 group text-left min-w-0
                ${isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/70 border border-transparent'}
              `}
            >
              <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium truncate">{item.label}</span>
                  {item.badge && (
                    <span className="flex-shrink-0 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] sm:text-[11px] truncate mt-0.5 transition-colors ${isActive ? 'text-emerald-500/70' : 'text-gray-600 group-hover:text-gray-500'}`}>
                  {item.sublabel}
                </p>
              </div>
              {isActive && <div className="w-1 h-5 sm:h-6 rounded-full bg-emerald-400 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* CTA upgrade — só para freemium, agora vai para tela de planos */}
      {isFree && onUpgrade && (
        <div className="mx-2 sm:mx-3 mb-3 sm:mb-4 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30">
          <p className="text-emerald-300 text-[11px] sm:text-xs font-semibold mb-1">🚀 Desbloqueie tudo</p>
          <p className="text-gray-400 text-[10px] sm:text-[11px] mb-2 leading-snug">
            Acesso vitalício por apenas R$97
          </p>
          {/* ✅ CORRIGIDO: chama onUpgrade (→ pricing) em vez de ir direto para Kiwify */}
          <button
            onClick={() => { onClose(); onUpgrade(); }}
            className="block w-full text-center text-[11px] sm:text-xs font-semibold py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors"
          >
            Assinar agora
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-gray-800">
        {session?.user?.email && (
          <p className="text-gray-600 text-[10px] sm:text-[11px] truncate">{session.user.email}</p>
        )}
        <p className="text-gray-700 text-[9px] sm:text-[10px] mt-0.5">© 2025 TaxReform.ai Brasil</p>
      </div>
    </aside>
  );
};

export default Sidebar;
