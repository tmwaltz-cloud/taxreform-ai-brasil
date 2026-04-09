import React, { useState } from 'react';
import { Activity, User, Phone, Mail, Lock, Briefcase, ArrowLeft, Loader2, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import { getSelectedPlanUrl, clearSelectedPlan } from './Pricing';

interface SignUpData {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
}

interface SignUpProps {
  onNavigate: (view: any) => void;
  onSignUpSuccess: (data: SignUpData) => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onNavigate, onSignUpSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'free-success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: UserRole.EMPRESARIO,
  });

  const selectedPlanUrl = getSelectedPlanUrl();
  const selectedPlanId = sessionStorage.getItem('selectedPlanId') || '';
  const isFree = selectedPlanId === 'free' || !selectedPlanUrl;
  const planLabel = selectedPlanId === 'vitalicio' ? 'Vitalício R$97'
    : selectedPlanId === 'mensal' ? 'Mensal R$27/mês' : '';

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 9) value = `${value.slice(0, 9)}-${value.slice(9)}`;
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name, phone: formData.phone, role: formData.role } },
      });
      if (authError) throw authError;

      if (isFree) {
        // Freemium → mostra tela de boas-vindas com CTA
        setStep('free-success');
      } else {
        // Plano pago → abre Kiwify e vai para Pricing
        if (selectedPlanUrl) {
          window.open(selectedPlanUrl, '_blank', 'noopener,noreferrer');
          clearSelectedPlan();
        }
        onSignUpSuccess({ name: formData.name, phone: formData.phone, email: formData.email, role: formData.role });
      }
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
      } else if (err.message?.includes('Password should be')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnterApp = () => {
    // Marca que é usuário freemium e o login count
    localStorage.setItem('user_plan', 'free');
    localStorage.setItem('login_count', '1');
    onSignUpSuccess({ name: formData.name, phone: formData.phone, email: formData.email, role: formData.role });
  };

  // ─── Tela de boas-vindas Freemium ─────────────────────────────────────────
  if (step === 'free-success') {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-900/50 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              🎉
            </div>
            <h1 className="text-3xl font-bold mb-2">Bem-vindo ao TaxReform.ai Brasil!</h1>
            <p className="text-slate-400">Sua conta foi criada. Você tem <span className="text-emerald-400 font-semibold">7 dias de acesso gratuito</span>.</p>
          </div>

          {/* O que você pode fazer */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> O que você pode fazer agora:
            </h2>
            <ul className="space-y-3">
              {[
                { icon: '📡', text: 'Radar de Inteligência — notícias tributárias em tempo real' },
                { icon: '🗓️', text: 'Cronograma da Reforma — datas críticas atualizadas por IA' },
                { icon: '🤖', text: 'JaxAI — 3 perguntas por dia sobre a Reforma Tributária' },
                { icon: '📊', text: 'Dashboard de Inteligência — visão geral do cenário fiscal' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-base shrink-0">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Por que assinar */}
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-emerald-300 mb-3">🔓 Desbloqueie o acesso completo:</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                'JaxAI ilimitado (15-20/dia)',
                'Cadeia de Valor fiscal',
                'Guia do Contador 4.0',
                'Guias de Ação Práticos',
                'Intérprete Legislativo',
                'Atualizações da Reforma',
              ].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { window.open('https://pay.kiwify.com.br/DM37j2q', '_blank'); }}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold border border-slate-600 transition"
              >
                Mensal R$27
              </button>
              <button
                onClick={() => { window.open('https://pay.kiwify.com.br/myXjxAN', '_blank'); }}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-bold transition shadow-[0_4px_15px_rgba(52,211,153,0.3)]"
              >
                Vitalício R$97 ⭐
              </button>
            </div>
          </div>

          {/* Botão principal — acessar app */}
          <button
            onClick={handleEnterApp}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white transition"
          >
            Acessar a plataforma agora <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-slate-600 text-xs mt-3">
            Você pode assinar a qualquer momento dentro da plataforma
          </p>
        </div>
      </div>
    );
  }

  // ─── Formulário de cadastro ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button onClick={() => onNavigate('pricing')} className="flex items-center text-slate-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Planos
        </button>
        <div className="flex justify-center">
          <div className="bg-brand-600 p-2 rounded-xl">
            <Activity className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Crie sua conta</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isFree ? 'Comece gratuitamente por 7 dias.' : 'Comece a transformar sua gestão tributária hoje.'}
        </p>

        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {['Plano escolhido', 'Criar conta', isFree ? 'Acessar' : 'Pagamento'].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                i === 0 ? 'bg-emerald-500 text-white' : i === 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{i === 0 ? '✓' : i + 1}</span>
              <span className={`text-xs ${i === 0 ? 'text-emerald-600 font-medium' : i === 1 ? 'text-brand-600 font-medium' : 'text-slate-400'}`}>{s}</span>
              {i < 2 && <div className="w-5 h-px bg-slate-300 ml-1" />}
            </div>
          ))}
        </div>

        {/* Badge do plano */}
        {isFree ? (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-center">
            <p className="text-blue-700 text-sm font-medium">🎁 Freemium — 7 dias grátis</p>
            <p className="text-blue-600 text-xs mt-0.5">Sem cartão de crédito necessário</p>
          </div>
        ) : planLabel ? (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center">
            <p className="text-emerald-700 text-sm font-medium">✅ Plano: <span className="font-bold">{planLabel}</span></p>
            <p className="text-emerald-600 text-xs mt-0.5">Após o cadastro você será direcionado ao pagamento</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5" placeholder="Seu nome" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Telefone (WhatsApp)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-slate-400" /></div>
                <input type="text" required value={formData.phone} onChange={handlePhoneChange}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5" placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Perfil Profissional</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Briefcase className="h-5 w-5 text-slate-400" /></div>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5 bg-white">
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">E-mail</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5" placeholder="seu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</div>}
            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isFree ? 'Criar Conta Gratuita →' : 'Criar Conta e Ir para Pagamento →'}
              </button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-500">
              Ao se cadastrar, você concorda com nossos{' '}
              <a href="#" className="text-brand-600 hover:underline">Termos de Uso</a> e{' '}
              <a href="#" className="text-brand-600 hover:underline">Política de Privacidade</a>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
