import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { UserCircle, Bell, Home, X, Info, Maximize, Minimize, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─── Email do administrador ───────────────────────────────────────────────────
// Altere para o seu email real
const ADMIN_EMAIL = 'rogerio@arg4.com.br';

interface HeaderProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateToProfile: () => void;
  onNavigateHome: () => void;
  onNavigateToAdmin?: () => void; // opcional — só aparece para admin
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  onRoleChange,
  onNavigateToProfile,
  onNavigateHome,
  onNavigateToAdmin,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // ── Verificar se usuário logado é admin ───────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
      }
    });
  }, []);

  // ── Fullscreen ────────────────────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm relative z-20">
      <div className="flex items-center gap-4">
        {/* Home */}
        <button
          onClick={onNavigateHome}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 rounded-full transition"
          title="Voltar para o Início"
        >
          <Home className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-slate-800 hidden md:block">
          Plataforma de Inteligência Tributária
        </h2>
        <h2 className="text-lg font-semibold text-slate-800 md:hidden">
          TaxReform.ai Brasil
        </h2>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Fullscreen */}
        <button
          onClick={toggleFullScreen}
          className="p-2 text-slate-500 hover:text-brand-600 transition hover:bg-slate-100 rounded-full focus:outline-none hidden md:block"
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Botão Admin — visível APENAS para o administrador */}
        {isAdmin && onNavigateToAdmin && (
          <button
            onClick={onNavigateToAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition"
            title="Painel Administrativo"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
