import React from 'react';
import { LayoutDashboard, FileText, Activity, Link as LinkIcon, MessageSquareText, BookOpenCheck, ListChecks } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: 'dashboard' | 'supply-chain' | 'interpreter' | 'consultant' | 'accountant-guide' | 'action-guide';
  onViewChange: (view: any) => void;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, userRole }) => {
  const menuItems = [
    { id: 'dashboard',       label: 'Legislação & Radar',    icon: LayoutDashboard },
    { id: 'consultant',      label: 'Consultor IA',          icon: MessageSquareText },
    { id: 'supply-chain',    label: 'Cadeia de Valor',       icon: LinkIcon },
    { id: 'accountant-guide',label: 'Guia do Contador 4.0',  icon: BookOpenCheck },
    { id: 'action-guide',    label: 'Guias de Ação',         icon: ListChecks },
    { id: 'interpreter',     label: 'Intérprete Legal',      icon: FileText },
  ];

  return (
    <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col items-center md:items-stretch transition-all duration-300 z-10">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-700">
        <Activity className="h-8 w-8 text-brand-500" />
        <span className="hidden md:block ml-3 font-bold text-lg tracking-tight">
          TaxReform<span className="text-brand-500">.ai Brasil</span>
        </span>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center p-3 md:px-6 transition-colors duration-200 rounded-none
                ${isActive
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : ''}`} />
              <span className="hidden md:block ml-3 font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="hidden md:block text-xs text-slate-500 text-center">
          © 2026 TaxReform.ai Brasil<br />Powered by Gemini
        </div>
      </div>
    </aside>
  );
};
