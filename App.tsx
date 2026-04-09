import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import PricingPage from './pages/PricingPage';
import SalesPage from './pages/SalesPage';
import Dashboard from './pages/Dashboard';
import ConsultantPage from './pages/ConsultantPage';
import InterpreterPage from './pages/InterpreterPage';
import SupplyChainPage from './pages/SupplyChainPage';
import AccountantGuidePage from './pages/AccountantGuidePage';
import ActionGuidePage from './pages/ActionGuidePage';
import OnboardingPage from './pages/OnboardingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StartupPopup from './components/StartupPopup';
import MotorTributarioPopup from './components/MotorTributarioPopup';
import UpsellPopup from './components/UpsellPopup';

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
  | 'action-guide';

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Rota inicial após auth ───────────────────────────────
  useEffect(() => {
    if (loading) return;

    if (session) {
      // Usuário autenticado — verificar se está numa página pública
      const isPublicPage = ['landing', 'login', 'signup', 'pricing', 'sales'].includes(currentPage);
      if (isPublicPage) {
        // Redirecionar para dashboard
        setCurrentPage('dashboard');
      }
    }
  }, [session, loading]);

  // ─── Controle de popups na plataforma ────────────────────
  useEffect(() => {
    if (!session || !PLATFORM_PAGES.includes(currentPage)) return;

    // Popup de boas-vindas (1º acesso)
    const hasSeenStartup = localStorage.getItem('taxreform_startup_seen');
    if (!hasSeenStartup) {
      setShowStartupPopup(true);
      localStorage.setItem('taxreform_startup_seen', 'true');
      return;
    }

    // Popup upsell freemium (2º acesso, plano free)
    const accessCount = parseInt(localStorage.getItem('taxreform_access_count') || '0') + 1;
    localStorage.setItem('taxreform_access_count', String(accessCount));

    if (accessCount === 2 && selectedPlanId === 'free') {
      setTimeout(() => setShowUpsellPopup(true), 3000);
      return;
    }

    // Motor Tributário popup (após 3 min na plataforma)
    const motorTimer = setTimeout(() => {
      const hasDismissedMotor = localStorage.getItem('taxreform_motor_dismissed');
      if (!hasDismissedMotor) setShowMotorPopup(true);
    }, 180_000); // 3 minutos

    return () => clearTimeout(motorTimer);
  }, [currentPage, session]);

  // ─── Handlers de navegação ────────────────────────────────

  /**
   * Chamado pela PricingPage quando usuário seleciona um plano.
   * - Se 'free': vai direto para signup sem passar por Kiwify
   * - Se pago: vai para signup (Kiwify processa após cadastro)
   */
  const handlePlanSelect = (planId: PlanId) => {
    setSelectedPlanId(planId);
    setCurrentPage('signup');
  };

  /**
   * Chamado pela SignUpPage após cadastro bem-sucedido.
   * - Se plano free: entra direto na plataforma (onboarding)
   * - Se plano pago: redireciona para Kiwify
   */
  const handleSignUpSuccess = (planId: PlanId) => {
    if (planId === 'free') {
      // ✅ CORREÇÃO PRINCIPAL: free entra direto, não volta para pricing
      setCurrentPage('onboarding');
    } else {
      // Pago: redirecionar para Kiwify (a SignUpPage já deve abrir a URL)
      // Após retorno (webhook confirma), usuário faz login e cai no dashboard
      setCurrentPage('login');
    }
  };

  /**
   * Chamado pela OnboardingPage quando usuário conclui onboarding.
   */
  const handleOnboardingComplete = () => {
    setCurrentPage('dashboard');
  };

  const navigate = (page: PageType) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

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

  // ─── Páginas públicas (sem sidebar) ──────────────────────
  const renderPublicPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            onNavigate={navigate}
            onPlanSelect={handlePlanSelect}
          />
        );
      case 'login':
        return (
          <LoginPage
            onNavigate={navigate}
            onLoginSuccess={() => navigate('dashboard')}
          />
        );
      case 'signup':
        return (
          <SignUpPage
            selectedPlanId={selectedPlanId}
            onNavigate={navigate}
            onSignUpSuccess={handleSignUpSuccess}
          />
        );
      case 'pricing':
        return (
          <PricingPage
            onNavigate={navigate}
            onPlanSelect={handlePlanSelect}
          />
        );
      case 'sales':
        return <SalesPage onNavigate={navigate} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={navigate} />;
      case 'onboarding':
        return (
          <OnboardingPage
            onComplete={handleOnboardingComplete}
            onNavigate={navigate}
          />
        );
      default:
        return (
          <LandingPage
            onNavigate={navigate}
            onPlanSelect={handlePlanSelect}
          />
        );
    }
  };

  // ─── Páginas da plataforma (com sidebar + header) ─────────
  const renderPlatformPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} session={session} />;
      case 'consultant':
        return <ConsultantPage onNavigate={navigate} session={session} />;
      case 'interpreter':
        return <InterpreterPage onNavigate={navigate} session={session} />;
      case 'supply-chain':
        return <SupplyChainPage onNavigate={navigate} session={session} />;
      case 'accountant-guide':
        return <AccountantGuidePage onNavigate={navigate} session={session} />;
      case 'action-guide':
        return <ActionGuidePage onNavigate={navigate} session={session} />;
      default:
        return <Dashboard onNavigate={navigate} session={session} />;
    }
  };

  // ─── Sem sessão → páginas públicas ───────────────────────
  if (!session) {
    return renderPublicPage();
  }

  // ─── Com sessão → layout da plataforma ───────────────────
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedPlanId={selectedPlanId}
        session={session}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={navigate}
          session={session}
          onLogout={async () => {
            await supabase.auth.signOut();
            navigate('landing');
          }}
        />
        <main className="flex-1 overflow-auto">
          {renderPlatformPage()}
        </main>
      </div>

      {/* Popups */}
      {showStartupPopup && (
        <StartupPopup
          onClose={() => setShowStartupPopup(false)}
          onNavigate={navigate}
        />
      )}
      {showMotorPopup && (
        <MotorTributarioPopup
          onClose={() => {
            setShowMotorPopup(false);
            localStorage.setItem('taxreform_motor_dismissed', 'true');
          }}
        />
      )}
      {showUpsellPopup && (
        <UpsellPopup
          onClose={() => setShowUpsellPopup(false)}
          onUpgrade={() => {
            setShowUpsellPopup(false);
            navigate('pricing');
          }}
        />
      )}
    </div>
  );
};

export default App;
