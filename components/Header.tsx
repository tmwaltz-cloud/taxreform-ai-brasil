import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Home, Maximize, Minimize, ShieldCheck, LogOut, Menu } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const ADMIN_EMAIL = 'tmwaltz@gmail.com';

interface HeaderProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateToProfile: () => void;
  onNavigateHome: () => void;
  onNavigateToAdmin?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  onRoleChange,
  onNavigateToProfile,
  onNavigateHome,
  onNavigateToAdmin,
  onLogout,
  onToggleSidebar,
  isMobile,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
      }
    });
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    onLogout?.();
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 md:px-8 shadow-sm relative z-20">
      {/* Seção esquerda: Hamburger (mobile) + Logo/Título */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Botão Hamburger - Visível apenas em mobile (lg:hidden) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 rounded-full transition lg:hidden flex-shrink-0"
            title="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Botão Home */}
        <button
          onClick={onNavigateHome}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 rounded-full transition flex-shrink-0"
          title="Voltar para o Início"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Título responsivo */}
        <div className="hidden sm:block truncate">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800 whitespace-nowrap">
            Plataforma Tributária
          </h2>
        </div>
        <div className="block sm:hidden truncate">
          <h2 className="text-sm font-semibold text-slate-800 whitespace-nowrap">
            TaxReform.ai
          </h2>
        </div>
      </div>

      {/* Seção direita: Ações */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        {/* Fullscreen - Hidden em mobile */}
        <button
          onClick={toggleFullScreen}
          className="p-2 text-slate-500 hover:text-brand-600 transition hover:bg-slate-100 rounded-full focus:outline-none hidden md:flex items-center justify-center"
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Admin Button */}
        {isAdmin && onNavigateToAdmin && (
          <button
            onClick={onNavigateToAdmin}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition whitespace-nowrap"
            title="Painel Administrativo"
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap"
          title="Sair da plataforma"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </header>
  );
};
