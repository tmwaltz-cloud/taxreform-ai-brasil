import React, { useState, useEffect, useRef } from 'react';
import { Activity, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Bell, AlertTriangle, Crown } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: () => void;
  onNavigate: (view: any) => void;
}

// ─── Formulário de Newsletter ──────────────────────────────────────────────
const NewsletterForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', accept: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (p: string) => /^\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/.test(p.replace(/\s/g, ''));
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) { setError('Preencha todos os campos obrigatórios.'); return; }
    if (!validateEmail(form.email)) { setError('E-mail inválido.'); return; }
    if (!validatePhone(form.phone)) { setError('WhatsApp inválido. Use o formato (15) 99999-9999.'); return; }
    if (!form.accept) { setError('Você precisa aceitar receber comunicações.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('newsletter_subscribers')
        .insert({ name: form.name, email: form.email, phone: form.phone, company: form.company, accepted_terms: form.accept });
      if (dbError && dbError.code !== '23505') throw dbError;
      setSubmitted(true);
    } catch { setError('Erro ao salvar inscrição. Tente novamente.'); }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="text-center py-6">
      <div className="text-4xl mb-3">✅</div>
      <h3 className="font-bold text-slate-800 text-lg mb-1">Inscrição confirmada!</h3>
      <p className="text-slate-500 text-sm mb-4">Você receberá nossa newsletter semanal com atualizações da Reforma Tributária.</p>
      <button onClick={onClose} className="text-brand-600 text-sm font-medium hover:underline">Fechar</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div><label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Seu nome"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
      <div><label className="block text-xs font-medium text-slate-600 mb-1">Empresa</label>
        <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Nome da empresa (opcional)"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
      <div><label className="block text-xs font-medium text-slate-600 mb-1">E-mail *</label>
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
      <div><label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp * <span className="text-slate-400">(com DDD)</span></label>
        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(15) 99999-9999"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
      <div className="flex items-start gap-2">
        <input id="accept-nl" type="checkbox" checked={form.accept} onChange={e => setForm({ ...form, accept: e.target.checked })}
          className="h-4 w-4 mt-0.5 text-brand-600 border-slate-300 rounded" />
        <label htmlFor="accept-nl" className="text-xs text-slate-600 leading-relaxed">
          Aceito receber ofertas e atualizações da <span className="font-semibold text-slate-700">ARG4 Negócios</span> por e-mail e WhatsApp.
        </label>
      </div>
      {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-md">{error}</p>}
      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex justify-center">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Quero receber a newsletter'}
      </button>
    </div>
  );
};

// ─── Banner de plano vencido com countdown ────────────────────────────────
interface ExpiredBannerProps {
  planLabel: string;
  onGoToPricing: () => void;
}

const ExpiredBanner: React.FC<ExpiredBannerProps> = ({ planLabel, onGoToPricing }) => {
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onGoToPricing();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [onGoToPricing]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <Crown className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Seu {planLabel} expirou
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Seu período de acesso encerrou. Escolha um plano para continuar usando todos os recursos da plataforma.
        </p>

        {/* Barra de progresso do countdown */}
        <div className="relative w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-amber-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 5) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          Redirecionando para os planos em <span className="font-bold text-amber-600">{countdown}s</span>
        </p>

        <button
          onClick={() => { clearInterval(timerRef.current!); onGoToPricing(); }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm transition shadow-lg"
        >
          Ver planos agora →
        </button>
      </div>
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────
export const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showNewsletter, setShowNewsletter] = useState(false);

  // Estado do banner de vencimento
  const [expiredPlanLabel, setExpiredPlanLabel] = useState<string | null>(null);

  // ── Verifica plano após login bem-sucedido ──────────────────────────────
  const checkPlanAfterLogin = async (userId: string) => {
    try {
      const { data, error: dbError } = await supabase
        .from('user_profiles')
        .select('plan_id, plan_status, trial_ends_at, expires_at')
        .eq('user_id', userId)
        .single();

      if (dbError || !data) {
        // Sem perfil → vai para plataforma normalmente
        onLogin();
        return;
      }

      const now = new Date();
      const planId = data.plan_id as string;
      const planStatus = data.plan_status as string;

      // Verifica se o plano freemium expirou
      if (planId === 'free') {
        const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        if (trialEnd && now > trialEnd) {
          setExpiredPlanLabel('Freemium (7 dias)');
          return;
        }
      }

      // Verifica se o plano mensal expirou
      if (planId === 'monthly') {
        const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
        if (expiresAt && now > expiresAt) {
          setExpiredPlanLabel('Plano Mensal');
          return;
        }
        // Ou status cancelado/suspenso
        if (planStatus === 'cancelled' || planStatus === 'suspended') {
          setExpiredPlanLabel('Plano Mensal');
          return;
        }
      }

      // Plano ok → entra na plataforma
      onLogin();
    } catch (err) {
      console.error('[Login] Erro ao verificar plano:', err);
      // Em caso de erro na verificação → entra mesmo assim
      onLogin();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Por favor, preencha todos os campos.'); return; }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Após login bem-sucedido, verifica o plano antes de redirecionar
      if (data.user?.id) {
        await checkPlanAfterLogin(data.user.id);
      } else {
        onLogin();
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.');
      } else {
        setError(err.message || 'Erro ao fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* Banner de plano vencido — aparece sobre tudo após login */}
      {expiredPlanLabel && (
        <ExpiredBanner
          planLabel={expiredPlanLabel}
          onGoToPricing={() => {
            setExpiredPlanLabel(null);
            onNavigate('pricing');
          }}
        />
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-brand-600 p-2 rounded-xl">
            <Activity className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Acesse sua conta</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Ou{' '}
          <button onClick={() => onNavigate('pricing')} className="font-medium text-brand-600 hover:text-brand-500 transition">
            veja nossos planos
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">E-mail</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="seu@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input id="password" type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 pr-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">Lembrar de mim</label>
              </div>
              <button type="button" onClick={() => onNavigate('forgot-password')}
                className="text-sm font-medium text-brand-600 hover:text-brand-500">
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400">Novo na plataforma?</span>
              </div>
            </div>
            <div className="mt-4">
              <button onClick={() => onNavigate('pricing')}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm">
                Ver planos e preços <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            <div className="mt-3">
              <button onClick={() => onNavigate('pricing')}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 rounded-lg bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                Ainda não sou cliente <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            {!showNewsletter ? (
              <button onClick={() => setShowNewsletter(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-brand-300 text-brand-600 text-sm font-medium hover:bg-brand-50 transition">
                <Bell className="w-4 h-4" />
                Cadastre-se e receba nossa newsletter semanal
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-600" /> Newsletter Semanal — ARG4 Negócios
                  </h3>
                  <button onClick={() => setShowNewsletter(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕ fechar</button>
                </div>
                <NewsletterForm onClose={() => setShowNewsletter(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
