import React from 'react';
import type { Session } from '@supabase/supabase-js';
import type { PageType, PlanId } from '../App';
import {
  LayoutDashboard,
  Bot,
  Link2,
  BookOpen,
  MapPin,
  FileSearch,
  X,
  Zap,
  Crown,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: PlanId | null;
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
  {
    id: 'dashboard',
    label: 'Legislação & Radar',
    sublabel: 'Monitor em tempo real',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'consultant',
    label: 'Consultor IA',
    sublabel: 'JaxAI responde dúvidas',
    icon: <Bot size={18} />,
    badge: 'IA',
  },
  {
    id: 'supply-chain',
    label: 'Cadeia de Valor',
    sublabel: 'Impacto por setor',
    icon: <Link2 size={18} />,
  },
  {
    id: 'accountant-guide',
    label: 'Guia do Contador 4.0',
    sublabel: 'Atualização profissional',
    icon: <BookOpen size={18} />,
  },
  {
    id: 'action-guide',
    label: 'Guias de Ação',
    sublabel: 'Passo a passo prático',
    icon: <MapPin size={18} />,
  },
  {
    id: 'interpreter',
    label: 'Intérprete Legal',
    sublabel: 'LC 214 em linguagem clara',
    icon: <FileSearch size={18} />,
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  selectedPlanId,
  session,
}) => {
  const isFree = selectedPlanId === 'free' || !selectedPlanId;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-64
          bg-gray-900 border-r border-gray-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + fechar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Zap size={14} className="text-gray-950" />
            </div>
            <div>
              <span className="text-white font-semibold text-sm leading-none">TaxReform</span>
              <span className="text-emerald-400 font-semibold text-sm leading-none">.ai</span>
              <div className="text-gray-500 text-[10px] leading-none mt-0.5">Brasil</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Badge de plano */}
        {isFree && (
          <div className="mx-4 mt-3 mb-1 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
            <Crown size={12} className="text-amber-400" />
            <div>
              <p className="text-amber-300 text-[11px] font-medium leading-none">Plano Freemium</p>
              <p className="text-amber-500/70 text-[10px] leading-none mt-0.5">7 dias de acesso</p>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150 group text-left
                  ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/70 border border-transparent'
                  }
                `}
              >
                {/* Icon */}
                <span
                  className={`flex-shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                >
                  {item.icon}
                </span>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 transition-colors ${
                      isActive ? 'text-emerald-500/70' : 'text-gray-600 group-hover:text-gray-500'
                    }`}
                  >
                    {item.sublabel}
                  </p>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="w-1 h-6 rounded-full bg-emerald-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Upgrade CTA para freemium */}
        {isFree && (
          <div className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30">
            <p className="text-emerald-300 text-xs font-semibold mb-1">🚀 Desbloqueie tudo</p>
            <p className="text-gray-400 text-[11px] mb-2 leading-snug">
              Acesso vitalício por apenas R$97
            </p>
            <a
              href="https://pay.kiwify.com.br/myXjxAN"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors"
            >
              Assinar agora
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800">
          {session?.user?.email && (
            <p className="text-gray-600 text-[11px] truncate">{session.user.email}</p>
          )}
          <p className="text-gray-700 text-[10px] mt-0.5">© 2025 TaxReform.ai Brasil</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
