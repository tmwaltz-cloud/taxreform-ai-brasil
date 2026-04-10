import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Pages — todos com export nomeado
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Pricing } from './pages/Pricing';
import { SalesPage } from './pages/SalesPage';
import { Dashboard } from './pages/Dashboard';
import { Consultant } from './pages/Consultant';
import { Interpreter } from './pages/Interpreter';
import { SupplyChain } from './pages/SupplyChain';
import { AccountantGuide } from './pages/AccountantGuide';
import { ActionGuide } from './pages/ActionGuide';
import { Onboarding } from './pages/Onboarding';
import { ForgotPassword } from './pages/ForgotPassword';
import { Admin } from './pages/Admin';

// Components
import Sidebar from './components/Sidebar';
import { Header } from './components/Header';
import { StartupPopup } from './components/StartupPopup';
import { MotorTributarioPopup } from './components/MotorTributarioPopup';
import { UpsellPopup } from './components/UpsellPopup';

// ─── Email do administrador ───────────────────────────────────────────────────
const ADMIN_EMAIL = 'rogerio@arg4.com.br'; // ← altere para o seu email real

export type PageType =
  | 'landing'
  | 'login'
  | 'signup'
  | 'pricing'
  | 'sales'
  | 'onboarding'
  | 'forgot-password'
  | 'dashboard'
  | 'consultant'
  | 'interpreter'
  | 'supply-chain'
  | 'accountant-guide'
  | 'action-guide'
  | 'admin';

export type PlanId = 'free' | 'monthly' | 'lifetime';

const PLATFORM_PAGES: PageType[] = [
  'dashboard',
  'consultant',
  'interpreter',
  'supply-chain',
  'accountant-guide',
  'action-guide',
];

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Popups ───────────────────────────────────────────────
  const [showStartupPopup, setShowStartupPopup] = useState(false);
  const [showMotorPopup, setShowMotorPopup] = useState(false);
  const [showUpsellPopup, setShowUpsellPopup] = useState(false);

  // ─── Auth listener ────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Rota inicial após auth ───────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (session) {
      const isPublicPage = ['landing', 'login', 'signup', 'pricing', 'sales'].includes(currentPage);
      if (isPublicPage) setCurrentPage('dashboard');
    }
  }, [session, loading]);

  // ─── Controle de popups na plataforma ────────────────────
  useEffect(() => {
    if (!session || !PLATFORM_PAGES.includes(currentPage)) return;

    const hasSeenStartup = localStorage.getItem('taxreform_startup_seen');
    if (!hasSeenStartup) {
      setShowStartupPopup(true);
      localStorage.setItem('taxreform_startup_seen', 'true');
      return;
    }

    const accessCount = parseInt(localStorage.getItem('taxreform_access_count') || '0') + 1;
    localStorage.setItem('taxreform_access_count', String(accessCount));

    if (accessCount === 2 && selectedPlanId === 'free') {
      setTimeout(() => setShowUpsellPopup(true), 3000);
      return;
    }

    const motorTimer = setTimeout(() => {
      if (!localStorage.getItem('taxreform_motor_dismissed')) {
        setShowMotorPopup(true);
      }
    }, 180_000);

    return () => clearTimeout(motorTimer);
  }, [currentPage, session]);

  // ─── Navegação ────────────────────────────────────────────
  const navigate = (page: PageType) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handlePlanSelect = (planId: PlanId) => {
    setSelectedPlanId(planId);
    setCurrentPage('signup');
  };

  const handleSignUpSuccess = (planId: PlanId) => {
    if (planId === 'free') {
      setCurrentPage('onboarding');
    } else {
      setCurrentPage('login');
    }
  };

  const handleOnboardingComplete = () => {
    setCurrentPage('dashboard');
  };

  const userRole = session?.user?.user_metadata?.role;
  const userPhone = session?.user?.user_metadata?.phone ?? '';
  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // ─── Loading splash ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando TaxReform.ai...</p>
        </div>
      </div>
    );
  }

  // ─── Sem sessão → páginas públicas ───────────────────────
  if (!session) {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={() => navigate('dashboard')} onNavigate={navigate} />;
      case 'signup':
        return (
          <SignUp
            selectedPlanId={selectedPlanId}
            onNavigate={navigate}
            onSignUpSuccess={handleSignUpSuccess}
          />
        );
      case 'pricing':
        return <Pricing onNavigate={navigate} userData={null} />;
      case 'sales':
        return <SalesPage onBack={() => navigate('landing')} onBuy={() => navigate('pricing')} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={navigate} />;
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} onLearnMore={() => navigate('pricing')} />;
      default:
        return <Landing onEnter={() => navigate('login')} onStartOnboarding={() => navigate('signup')} />;
    }
  }

  // ─── Painel Admin (tela cheia, sem sidebar) ───────────────
  if (currentPage === 'admin') {
    if (!isAdmin) {
      // Segurança: redireciona se não for admin
      navigate('dashboard');
      return null;
    }
    return <Admin onBack={() => navigate('dashboard')} />;
  }

  // ─── Páginas da plataforma ────────────────────────────────
  const renderPlatformPage = () => {
    switch (currentPage) {
      case 'consultant':
        return <Consultant userRole={userRole} onNavigateHome={() => navigate('dashboard')} />;
      case 'interpreter':
        return <Interpreter userRole={userRole} onNavigateHome={() => navigate('dashboard')} />;
      case 'supply-chain':
        return <SupplyChain onNavigateHome={() => navigate('dashboard')} />;
      case 'accountant-guide':
        return <AccountantGuide onNavigateHome={() => navigate('dashboard')} />;
      case 'action-guide':
        return (
          <ActionGuide
            actionId=""
            actionTitle=""
            onNavigateHome={() => navigate('dashboard')}
            onNavigateToInterpreter={() => navigate('interpreter')}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard
            userRole={userRole}
            onViewChange={(view: any) => navigate(view as PageType)}
            onActionSelect={() => navigate('action-guide')}
          />
        );
    }
  };

  // ─── Layout com sidebar + header ─────────────────────────
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedPlanId={selectedPlanId}
        session={session}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          userRole={userRole}
          onRoleChange={() => {}}
          onNavigateToProfile={() => {}}
          onNavigateHome={() => navigate('dashboard')}
          onNavigateToAdmin={isAdmin ? () => navigate('admin') : undefined}
          onLogout={async () => {
            await supabase.auth.signOut();
            navigate('landing');
          }}
        />
        <main className="flex-1 overflow-auto">
          {renderPlatformPage()}
        </main>
      </div>

      {showStartupPopup && (
        <StartupPopup onClose={() => setShowStartupPopup(false)} />
      )}
      {showMotorPopup && (
        <MotorTributarioPopup
          userPhone={userPhone}
          onClose={() => {
            setShowMotorPopup(false);
            localStorage.setItem('taxreform_motor_dismissed', 'true');
          }}
        />
      )}
      {showUpsellPopup && (
        <UpsellPopup
          onClose={() => setShowUpsellPopup(false)}
        />
      )}
    </div>
  );
};

export default App;
