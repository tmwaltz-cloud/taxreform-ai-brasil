import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { UserCircle, Bell, Home, X, Info, Maximize, Minimize } from 'lucide-react';

interface HeaderProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateToProfile: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userRole, onRoleChange, onNavigateToProfile, onNavigateHome }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm relative z-20">
      <div className="flex items-center gap-4">
        {/* Home Button available on all pages */}
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

      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Full Screen Toggle */}
        <button 
          onClick={toggleFullScreen}
          className="p-2 text-slate-500 hover:text-brand-600 transition hover:bg-slate-100 rounded-full focus:outline-none hidden md:block"
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        >
           {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};