import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Interpreter } from './pages/Interpreter';
import { SupplyChain } from './pages/SupplyChain';
import { Consultant } from './pages/Consultant';
import { AccountantGuide } from './pages/AccountantGuide';
import { ActionGuide } from './pages/ActionGuide';
import { Onboarding } from './pages/Onboarding';
import { Landing } from './pages/Landing';
import { SalesPage } from './pages/SalesPage';
import { StartupPopup } from './components/StartupPopup';
import { MotorTributarioPopup } from './components/MotorTributarioPopup';
import { UpsellPopup } from './components/UpsellPopup';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Pricing } from './pages/Pricing';
import { ForgotPassword } from './pages/ForgotPassword';
import { UserRole, AuthView } from './types';

function App() {
  // ─── Auth State ──────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [registrationData, setRegistrationData] = useState<{name: string, phone: string, email: string, role: UserRole} | null>(null);

  // ─── App State ───────────────────────────────────────────────────────────
  const [showLanding, setShowLanding] = useState(true);
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);
  const [showPublicOnboarding, setShowPublicOnboarding] = useState(false);
  const [publicOnboardingStep, setPublicOnboardingStep] = useState(0);
  const [showSalesPage, setShowSalesPage] = useState(false);
  const [showStartupPopup, setShowStartupPopup] = useState(false);
  const [showMotorPopup, setShowMotorPopup] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  // ─── Navigation State ────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<'dashboard' | 'supply-chain' | 'interpreter' | 'consultant' | 'accountant-guide' | 'action-guide'>('dashboard');
  const [selectedAction, setSelectedAction] = useState<{id: string, title: string} | null>(null);
  const [interpreterInitialText, setInterpreterInitialText] = useState("");
  const [userRole, setUserRole] = useState<UserRole>(UserRole.EMPRESARIO);

  // ─── Motor Tributário Popup — aparece 3 min após login ───────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const dismissed = sessionStorage.getItem('motor_popup_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setShowMotorPopup(true), 180000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleEnterPlatform = () => {
    setShowLanding(false);
    setAuthView('login');
  };

  const handleStartPublicOnboarding = (step: number = 0) => {
    setPublicOnboardingStep(step);
    setShowLanding(false);
    setShowPublicOnboarding(true);
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeWizard(false);
  };

  const handlePublicOnboardingComplete = () => {
    setShowPublicOnboarding(false);
    setAuthView('login');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowWelcomeWizard(true);

    // Incrementa contador de logins para upsell freemium
    const count = parseInt(localStorage.getItem('login_count') || '0', 10);
    localStorage.setItem('login_count', String(count + 1));

    // Mostra upsell a partir do 2º login se for usuário free
    const plan = localStorage.getItem('user_plan');
    if (plan === 'free' && count >= 1) {
      setShowUpsell(true);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setAuthView('login');
    setShowLanding(true);
    sessionStorage.removeItem('motor_popup_dismissed');
    sessionStorage.removeItem('upsell_dismissed');
  };

  // ─── 1. Landing Page ─────────────────────────────────────────────────────
  if (showLanding) {
    return <Landing onEnter={handleEnterPlatform} onStartOnboarding={handleStartPublicOnboarding} />;
  }

  // ─── 1b. Public Onboarding ────────────────────────────────────────────────
  if (showPublicOnboarding) {
    return <Onboarding initialStep={publicOnboardingStep} onComplete={handlePublicOnboardingComplete} onLearnMore={() => {}} />;
  }

  // ─── 2. Auth Views ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    if (showSalesPage) {
      return <SalesPage onBack={() => setShowSalesPage(false)} onBuy={() => { setShowSalesPage(false); setAuthView('signup'); }} />;
    }
    switch (authView) {
      case 'login':
        return <Login onLogin={handleLoginSuccess} onNavigate={setAuthView} />;
      case 'signup':
        return (
          <SignUp
            onNavigate={setAuthView}
            onSignUpSuccess={(data) => {
              setRegistrationData(data);
              setAuthView('pricing');
            }}
          />
        );
      case 'pricing':
        return <Pricing onNavigate={setAuthView} userData={registrationData} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={setAuthView} />;
      default:
        return <Login onLogin={handleLoginSuccess} onNavigate={setAuthView} />;
    }
  }

  // ─── 3. Welcome Wizard (pós-login) ────────────────────────────────────────
  if (showWelcomeWizard) {
    return <Onboarding onComplete={handleWelcomeComplete} onLearnMore={() => {}} />;
  }

  // ─── 4. Main App ──────────────────────────────────────────────────────────
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            userRole={userRole}
            onViewChange={setCurrentView}
            onActionSelect={(id, title) => { setSelectedAction({ id, title }); setCurrentView('action-guide'); }}
            onNavigateToInterpreter={(text) => { setInterpreterInitialText(text); setCurrentView('interpreter'); }}
          />
        );
      case 'action-guide':
        return (
          <ActionGuide
            actionId={selectedAction?.id || ''}
            actionTitle={selectedAction?.title || ''}
            onNavigateHome={() => setCurrentView('dashboard')}
            onNavigateToInterpreter={(text) => { setInterpreterInitialText(text); setCurrentView('interpreter'); }}
          />
        );
      case 'consultant':
        return <Consultant userRole={userRole} onNavigateHome={() => setCurrentView('dashboard')} />;
      case 'accountant-guide':
        return <AccountantGuide onNavigateHome={() => setCurrentView('dashboard')} />;
      case 'supply-chain':
        return <SupplyChain onNavigateHome={() => setCurrentView('dashboard')} />;
      case 'interpreter':
        return <Interpreter userRole={userRole} onNavigateHome={() => setCurrentView('dashboard')} initialText={interpreterInitialText} />;
      default:
        return (
          <Dashboard
            userRole={userRole}
            onViewChange={setCurrentView}
            onActionSelect={(id, title) => { setSelectedAction({ id, title }); setCurrentView('action-guide'); }}
            onNavigateToInterpreter={(text) => { setInterpreterInitialText(text); setCurrentView('interpreter'); }}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* Startup Popup */}
      {showStartupPopup && !showWelcomeWizard && (
        <StartupPopup onClose={() => setShowStartupPopup(false)} />
      )}

      {/* Upsell Freemium — aparece no 2º acesso */}
      {showUpsell && (
        <UpsellPopup onClose={() => setShowUpsell(false)} />
      )}

      {/* Motor Tributário 5.0 — aparece após 3 min */}
      {showMotorPopup && (
        <MotorTributarioPopup
          onClose={() => {
            setShowMotorPopup(false);
            sessionStorage.setItem('motor_popup_dismissed', '1');
          }}
          autoShowAfterMs={0}
        />
      )}

      <Sidebar currentView={currentView} onViewChange={setCurrentView} userRole={userRole} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          userRole={userRole}
          onRoleChange={setUserRole}
          onNavigateToProfile={() => {}}
          onNavigateHome={() => setCurrentView('dashboard')}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
