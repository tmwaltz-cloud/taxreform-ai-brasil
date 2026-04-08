import React, { useState } from 'react';
import { Activity, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Bell } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onNavigate: (view: any) => void;
}

// ─── Formulário de Newsletter ──────────────────────────────────────────────
const NewsletterForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', accept: false });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (phone: string) => /^\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/.test(phone.replace(/\s/g, ''));
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.phone) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('E-mail inválido.');
      return;
    }
    if (!validatePhone(form.phone)) {
      setError('WhatsApp inválido. Use o formato (15) 99999-9999.');
      return;
    }
    if (!form.accept) {
      setError('Você precisa aceitar receber comunicações.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">Inscrição confirmada!</h3>
        <p className="text-slate-500 text-sm mb-4">
          Você receberá nossa newsletter semanal com atualizações da Reforma Tributária.
        </p>
        <button onClick={onClose} className="text-brand-600 text-sm font-medium hover:underline">
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Seu nome"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Empresa</label>
        <input
          type="text"
          value={form.company}
          onChange={e => setForm({ ...form, company: e.target.value })}
          placeholder="Nome da empresa (opcional)"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">E-mail *</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="seu@email.com"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp * <span className="text-slate-400">(com DDD)</span></label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          placeholder="(15) 99999-9999"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>
      <div className="flex items-start gap-2">
        <input
          id="accept-newsletter"
          type="checkbox"
          checked={form.accept}
          onChange={e => setForm({ ...form, accept: e.target.checked })}
          className="h-4 w-4 mt-0.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
        />
        <label htmlFor="accept-newsletter" className="text-xs text-slate-600 leading-relaxed">
          Aceito receber ofertas e atualizações da <span className="font-semibold text-slate-700">ARG4 Negócios</span> por e-mail e WhatsApp. Você pode cancelar a qualquer momento.
        </label>
      </div>
      {error && (
        <p className="text-red-500 text-xs bg-red-50 p-2 rounded-md">{error}</p>
      )}
      <button
        onClick={handleSubmit}
        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition"
      >
        Quero receber a newsletter
      </button>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* ── Logo + título ── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-brand-600 p-2 rounded-xl">
            <Activity className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Ou{' '}
          <button
            onClick={() => onNavigate('pricing')}
            className="font-medium text-brand-600 hover:text-brand-500 transition"
          >
            veja nossos planos
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-lg sm:px-10 border border-slate-100">

          {/* ── Formulário de login ── */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                E-mail corporativo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 pr-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Lembrar + Esqueci */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Lembrar de mim
                </label>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-sm font-medium text-brand-600 hover:text-brand-500"
              >
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>

          {/* ── Divisor ── */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400">Novo na plataforma?</span>
              </div>
            </div>

            {/* ── Ver Planos (sem cadastro) ── */}
            <div className="mt-4">
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
              >
                Ver planos e preços
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>

            {/* ── Ainda não sou cliente ── */}
            <div className="mt-3">
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Ainda não sou cliente
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* ── Newsletter ── */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            {!showNewsletter ? (
              <button
                onClick={() => setShowNewsletter(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-brand-300 text-brand-600 text-sm font-medium hover:bg-brand-50 transition"
              >
                <Bell className="w-4 h-4" />
                Cadastre-se e receba nossa newsletter semanal
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-600" />
                    Newsletter Semanal — ARG4 Negócios
                  </h3>
                  <button
                    onClick={() => setShowNewsletter(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕ fechar
                  </button>
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
