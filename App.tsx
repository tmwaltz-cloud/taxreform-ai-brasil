
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Interpreter } from './pages/Interpreter';
import { SupplyChain } from './pages/SupplyChain';
import { Consultant } from './pages/Consultant';
import { AccountantGuide } from './pages/AccountantGuide';
import { ActionGuide } from './pages/ActionGuide';
import { Onboarding } from './pages/Onboarding'; // This is now the "Welcome" wizard
import { Landing } from './pages/Landing'; // The new entry point
import { SalesPage } from './pages/SalesPage';
import { StartupPopup } from './components/StartupPopup';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Pricing } from './pages/Pricing';
import { ForgotPassword } from './pages/ForgotPassword';
import { UserRole, AuthView } from './types';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('login');
  
  // Temporary Registration Data for Pricing Flow
  const [registrationData, setRegistrationData] = useState<{name: string, phone: string, email: string, role: UserRole} | null>(null);

  // App State
  const [showLanding, setShowLanding] = useState(false); // Default to Landing
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false); // Controls the 2026/Split Payment guide AFTER login
  const [showPublicOnboarding, setShowPublicOnboarding] = useState(false); // Controls pre-login onboarding
  const [publicOnboardingStep, setPublicOnboardingStep] = useState(0);

  const [showSalesPage, setShowSalesPage] = useState(false);
  const [showStartupPopup, setShowStartupPopup] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'supply-chain' | 'interpreter' | 'consultant' | 'accountant-guide' | 'action-guide'>('dashboard');
  const [selectedAction, setSelectedAction] = useState<{id: string, title: string} | null>(null);
  const [interpreterInitialText, setInterpreterInitialText] = useState("");
  const [userRole, setUserRole] = useState<UserRole>(UserRole.EMPRESARIO);

  // Initialize Auth Listener
  useEffect(() => {
    // Auth bypass for direct app access
  }, []);

  // Called when user clicks "Entrar" on Landing Page
  const handleEnterPlatform = () => {
    setShowLanding(false);
    setAuthView('login');
  };

  // Called when user clicks "Ver Tour" on Landing Page
  const handleStartPublicOnboarding = (step: number = 0) => {
    setPublicOnboardingStep(step);
    setShowLanding(false);
    setShowPublicOnboarding(true);
  };

  // Called when user finishes the "Welcome/Onboarding" wizard (Post-Login)
  const handleWelcomeComplete = () => {
    setShowWelcomeWizard(false);
  };

  // Called when user finishes the "Public" onboarding (Pre-Login)
  const handlePublicOnboardingComplete = () => {
    setShowPublicOnboarding(false);
    setAuthView('login');
  };

  // Called after successful login form submission
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowWelcomeWizard(true); // Show the wizard after fresh login
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setAuthView('login');
    setShowLanding(true); // Return to Landing on logout
  };

  // 1. Landing Page (The "Inteligência Estratégica" screen)
  if (showLanding) {
    return <Landing onEnter={handleEnterPlatform} onStartOnboarding={handleStartPublicOnboarding} />;
  }

  // 1b. Public Onboarding (Pre-login Tour)
  if (showPublicOnboarding) {
    return <Onboarding initialStep={publicOnboardingStep} onComplete={handlePublicOnboardingComplete} onLearnMore={() => {/* Link to docs */}} />;
  }

  // 2. Auth Views
  if (!isAuthenticated) {
    if (showSalesPage) {
        return <SalesPage onBack={() => setShowSalesPage(false)} onBuy={() => { setShowSalesPage(false); setAuthView('signup'); }} />;
    }

    switch(authView) {
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

  // 3. Post-Login "Welcome" Wizard (The 2026/Split Payment Guide)
  if (showWelcomeWizard) {
    return <Onboarding onComplete={handleWelcomeComplete} onLearnMore={() => {/* Maybe link to docs */}} />;
  }

  // 4. Main App (Dashboard & Tools)
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard userRole={userRole} onViewChange={setCurrentView} onActionSelect={(id, title) => { setSelectedAction({id, title}); setCurrentView('action-guide'); }} onNavigateToInterpreter={(text) => { setInterpreterInitialText(text); setCurrentView('interpreter'); }} />;
      case 'action-guide':
        return <ActionGuide actionId={selectedAction?.id || ''} actionTitle={selectedAction?.title || ''} onNavigateHome={() => setCurrentView('dashboard')} onNavigateToInterpreter={(text) => { setInterpreterInitialText(text); setCurrentView('interpreter'); }} />;
      case 'consultant':
        return <Consultant userRole={userRole} onNavigateHome={() => setCurrentView('dashboard')} />;
      case 'accountant-guide':
        return <AccountantGuide onNavigateHome={() => setCurrentView('dashboard')} />;
      case 'supply-chain':
        return <SupplyChain onNavigateHome={() => setCurrentView('dashboard')} />;
      case 'interpreter':
        return <Interpreter userRole={userRole} onNavigateHome={() => setCurrentView('dashboard')} initialText={interpreterInitialText} />;
      default:
        return <Dashboard userRole={userRole} onViewChange={setCurrentView} onActionSelect={(id, title) => { setSelectedAction({id, title}); setCurrentView('action-guide'); }} onNavigateToInterpreter={(text) => { setInterpreterInitialText(text); setCurrentView('interpreter'); }} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {showStartupPopup && !showWelcomeWizard && <StartupPopup onClose={() => setShowStartupPopup(false)} />}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} userRole={userRole} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header userRole={userRole} onRoleChange={setUserRole} onNavigateToProfile={() => {}} onNavigateHome={() => setCurrentView('dashboard')} />
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