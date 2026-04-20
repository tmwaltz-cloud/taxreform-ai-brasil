import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

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

import Sidebar from './components/Sidebar';
import { Header } from './components/Header';
import { StartupPopup } from './components/StartupPopup';
import { MotorTributarioPopup } from './components/MotorTributarioPopup';
import { UpsellPopup } from './components/UpsellPopup';

const ADMIN_EMAIL = 'tmwaltz@gmail.com';

export type PageType =
  | 'landing' | 'login' | 'signup' | 'pricing' | 'sales'
  | 'onboarding' | 'forgot-password' | 'dashboard' | 'consultant'
  | 'interpreter' | 'supply-chain' | 'accountant-guide' | 'action-guide' | 'admin';

export type PlanId = 'free' | 'monthly' | 'lifetime';

const PLAN_LABELS: Record<PlanId, { label: string; icon: string }> = {
  free:     { label: 'Plano Freemium',  icon: '👑' },
  monthly:  { label: 'Plano Mensal',    icon: '⚡' },
  lifetime: { label: 'Plano Vitalício', icon: '💎' },
};

const PLATFORM_PAGES: PageType[] = [
  'dashboard', 'consultant', 'interpreter',
  'supply-chain', 'accountant-guide', 'action-guide',
];

// ─── Pop-up freemium: dias restantes ────────────────────────────────────────
const FreemiumPopup: React.FC<{
  daysLeft: number;
  onClose: () => void;
  onUpgrade: () => void;
}> = ({ daysLeft, onClose, onUpgrade }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
      <div className="text-4xl">⏳</div>
      <h3 className="text-lg font-bold text-white">
        {daysLeft > 0
          ? `Faltam ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} para seu acesso expirar`
          : 'Seu período gratuito encerrou'}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {daysLeft > 0
          ? 'Você está no plano Freemium. Assine agora para não perder o acesso completo à plataforma.'
          : 'Seu período de 7 dias gratuitos acabou. Escolha um plano para continuar usando todos os recursos.'}
      </p>
      <button
        onClick={onUpgrade}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:from-emerald-400 hover:to-cyan-400 transition"
      >
        Ver planos e assinar agora →
      </button>
      {daysLeft > 0 && (
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xs underline transition">
          Continuar com o Freemium por enquanto
        </button>
      )}
    </div>
  </div>
);

// ─── Lógica de fingerprint anti troca de email ───────────────────────────────
// Gera um ID estável baseado em características do browser (não muda ao trocar email)
function getDeviceFingerprint(): string {
  const existing = localStorage.getItem('_dev_fp');
  if (existing) return existing;
  const fp = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? '',
  ].join('|');
  // hash simples
  let hash = 0;
  for (let i = 0; i < fp.length; i++) {
    hash = ((hash << 5) - hash) + fp.charCodeAt(i);
    hash |= 0;
  }
  const id = Math.abs(hash).toString(36);
  localStorage.setItem('_dev_fp', id);
  return id;
}

// ─── App ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Plano real do Supabase
  const [userPlanId, setUserPlanId] = useState<PlanId>('free');
  const [userPlanStatus, setUserPlanStatus] = useState<string>('trialing');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(7);

  // Popups
  const [showStartupPopup, setShowStartupPopup] = useState(false);
  const [showMotorPopup, setShowMotorPopup] = useState(false);
  const [showUpsellPopup, setShowUpsellPopup] = useState(false);
  const [showFreemiumPopup, setShowFreemiumPopup] = useState(false);

  // ─── Auth ───────────────────────────────────────────────────────────────
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

  // ─── Carregar perfil do usuário (plano real) ─────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadProfile = async () => {
      // Garante que o token JWT está disponível antes da query
      // Evita 401 quando a sessão acaba de ser estabelecida
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('plan_id, plan_status, trial_ends_at')
        .eq('user_id', session.user.id)
        .single();

      if (!error && data) {
        setUserPlanId((data.plan_id as PlanId) || 'free');
        setUserPlanStatus(data.plan_status || 'trialing');
        setTrialEndsAt(data.trial_ends_at);

        // Calcular dias restantes do trial
        if (data.trial_ends_at) {
          const end = new Date(data.trial_ends_at);
          const now = new Date();
          const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setDaysLeft(Math.max(0, diff));
        }

        // ── Proteção anti troca de email — server-side via Supabase RPC ──
        // Usa a função check_device_fingerprint criada no banco (migration_v3.sql)
        // Não depende de localStorage — não adianta limpar o cache do browser
        if (data.plan_id === 'free' || !data.plan_id) {
          const fp = getDeviceFingerprint();
          try {
            const { data: fpResult } = await supabase.rpc('check_device_fingerprint', {
              p_user_id: session.user.id,
              p_fingerprint: fp,
            });
            if (fpResult?.blocked) {
              setUserPlanStatus('suspended');
            }
          } catch (fpErr) {
            console.warn('[Fingerprint] RPC falhou, usando fallback localStorage:', fpErr);
            // Fallback local caso a RPC não esteja disponível
            const fpKey = `_fp_uid_${fp}`;
            const registeredUid = localStorage.getItem(fpKey);
            if (!registeredUid) {
              localStorage.setItem(fpKey, session.user.id);
            } else if (registeredUid !== session.user.id) {
              await supabase
                .from('user_profiles')
                .update({ plan_status: 'suspended' })
                .eq('user_id', session.user.id);
              setUserPlanStatus('suspended');
            }
          }
        }
      }
    };

    loadProfile();
  }, [session]);

  // ─── Listener global de upgrade (disparado pelo RateLimitBanner) ───────────
  useEffect(() => {
    const handler = () => navigate('pricing');
    window.addEventListener('taxreform:upgrade', handler);
    return () => window.removeEventListener('taxreform:upgrade', handler);
  }, []);

  // ─── Resize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const m = window.innerWidth < 1024;
      setIsMobile(m);
      if (m) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Rota inicial após auth ──────────────────────────────────────────────
  // 'pricing' fora da lista: usuário logado pode navegar para pricing para upgrade
  useEffect(() => {
    if (loading) return;
    if (session) {
      const redirectToApp = ['landing', 'login', 'signup', 'sales'].includes(currentPage);
      if (redirectToApp) setCurrentPage('dashboard');
    }
  }, [session, loading]);

  // ─── Pop-up freemium ao entrar na plataforma ─────────────────────────────
  useEffect(() => {
    if (!session || !PLATFORM_PAGES.includes(currentPage)) return;
    if (userPlanId !== 'free') return;

    const lastShown = localStorage.getItem('_freemium_popup_date');
    const today = new Date().toDateString();

    // Mostrar uma vez por dia para usuários freemium
    if (lastShown !== today) {
      setTimeout(() => {
        setShowFreemiumPopup(true);
        localStorage.setItem('_freemium_popup_date', today);
      }, 2000);
    }
  }, [currentPage, session, userPlanId]);

  // ─── Outros popups ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !PLATFORM_PAGES.includes(currentPage)) return;

    const hasSeenStartup = localStorage.getItem('taxreform_startup_seen');
    if (!hasSeenStartup) {
      setShowStartupPopup(true);
      localStorage.setItem('taxreform_startup_seen', 'true');
      return;
    }

    const motorTimer = setTimeout(() => {
      if (!localStorage.getItem('taxreform_motor_dismissed')) {
        setShowMotorPopup(true);
      }
    }, 180_000);

    return () => clearTimeout(motorTimer);
  }, [currentPage, session]);

  // ─── Navegação ───────────────────────────────────────────────────────────
  const navigate = (page: PageType) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handlePlanSelect = (planId: PlanId) => {
    setSelectedPlanId(planId);
    navigate('signup');
  };

  const handleSignUpSuccess = (planId: PlanId) => {
    if (planId === 'free') {
      // Após cadastro free → vai direto para dashboard (não volta para pricing)
      navigate('dashboard');
    } else {
      navigate('login');
    }
  };

  const handleOnboardingComplete = () => navigate('dashboard');

  const userRole = session?.user?.user_metadata?.role;
  const userPhone = session?.user?.user_metadata?.phone ?? '';
  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Dado do plano para o Sidebar
  const planInfo = PLAN_LABELS[userPlanId] ?? PLAN_LABELS.free;

  // ─── Loading ─────────────────────────────────────────────────────────────
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

  // ─── Sem sessão: páginas públicas ────────────────────────────────────────
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
        return (
          <Onboarding
            onComplete={() => navigate('dashboard')}
            onLearnMore={() => navigate('pricing')}
          />
        );
      default:
        return (
          <Landing
            onEnter={() => navigate('login')}
            onStartOnboarding={() => navigate('onboarding')}
          />
        );
    }
  }

  // ─── Pricing para usuário logado (upgrade de plano) ─────────────────────
  // Usuário free pode navegar para pricing sem ser deslogado
  if (currentPage === 'pricing') {
    const isExpired = userPlanId === 'free' && daysLeft <= 0;
    return (
      <Pricing
        onNavigate={(page) => {
          if (page === 'signup') navigate('dashboard');
          else navigate(page as any);
        }}
        planExpired={isExpired}
        userData={session?.user ? {
          name: session.user.user_metadata?.name ?? '',
          phone: session.user.user_metadata?.phone ?? '',
          email: session.user.email ?? '',
          role: session.user.user_metadata?.role,
        } : null}
      />
    );
  }

  // ─── Admin ───────────────────────────────────────────────────────────────
  if (currentPage === 'admin') {
    if (!isAdmin) { navigate('dashboard'); return null; }
    return <Admin onBack={() => navigate('dashboard')} />;
  }

  // ─── Plataforma ──────────────────────────────────────────────────────────
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
            actionId="" actionTitle=""
            onNavigateHome={() => navigate('dashboard')}
            onNavigateToInterpreter={() => navigate('interpreter')}
          />
        );
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

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-gray-950 overflow-hidden">
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed lg:static left-0 top-0 w-64 h-screen bg-gray-900 z-30 lg:z-0 transform transition-transform duration-300 ease-in-out lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={navigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedPlanId={userPlanId}
          planLabel={planInfo.label}
          planIcon={planInfo.icon}
          daysLeft={userPlanId === 'free' ? daysLeft : null}
          onUpgrade={() => navigate('pricing')}
          session={session}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full lg:w-auto overflow-hidden">
        <Header
          userRole={userRole}
          onRoleChange={() => {}}
          onNavigateToProfile={() => {}}
          onNavigateHome={() => navigate('dashboard')}
          onNavigateToAdmin={isAdmin ? () => navigate('admin') : undefined}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-auto w-full px-2 sm:px-4 md:px-6 lg:px-8">
          {renderPlatformPage()}
        </main>
      </div>

      {/* ── Popups ── */}
      {showFreemiumPopup && userPlanId === 'free' && (
        <FreemiumPopup
          daysLeft={daysLeft}
          onClose={() => setShowFreemiumPopup(false)}
          onUpgrade={() => { setShowFreemiumPopup(false); navigate('pricing'); }}
        />
      )}
      {showStartupPopup && (
        <StartupPopup onClose={() => setShowStartupPopup(false)} />
      )}
      {showMotorPopup && (
        <MotorTributarioPopup
          userPhone={userPhone}
          onClose={() => { setShowMotorPopup(false); localStorage.setItem('taxreform_motor_dismissed', 'true'); }}
        />
      )}
      {showUpsellPopup && (
        <UpsellPopup onClose={() => setShowUpsellPopup(false)} />
      )}
    </div>
  );
};

export default App;
