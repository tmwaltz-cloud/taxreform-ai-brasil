import React, { useState } from 'react';
import { Activity, User, Phone, Mail, Lock, Briefcase, ArrowLeft, Loader2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: UserRole.EMPRESARIO,
  });

  // Plano escolhido na tela anterior
  const selectedPlanUrl = getSelectedPlanUrl();
  const selectedPlanId = sessionStorage.getItem('selectedPlanId') || '';
  const planLabel = selectedPlanId === 'vitalicio' ? 'Vitalício R$97' : selectedPlanId === 'mensal' ? 'Mensal R$27/mês' : '';

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
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      // Abre Kiwify em nova aba se houver plano selecionado
      if (selectedPlanUrl) {
        window.open(selectedPlanUrl, '_blank', 'noopener,noreferrer');
        clearSelectedPlan();
      }

      // Passa dados para o App.tsx e vai para Pricing (para mostrar confirmação)
      onSignUpSuccess({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
      });

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
          Comece a transformar sua gestão tributária hoje.
        </p>

        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</span>
            <span className="text-emerald-600 font-medium">Plano escolhido</span>
          </div>
          <div className="w-8 h-px bg-slate-300" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
            <span className="text-brand-600 font-medium">Criar conta</span>
          </div>
          <div className="w-8 h-px bg-slate-300" />
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px]">3</span>
            <span>Pagamento</span>
          </div>
        </div>

        {/* Plano selecionado */}
        {planLabel && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center">
            <p className="text-emerald-700 text-sm font-medium">
              ✅ Plano selecionado: <span className="font-bold">{planLabel}</span>
            </p>
            <p className="text-emerald-600 text-xs mt-0.5">Após o cadastro você será direcionado ao pagamento</p>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="Seu nome" />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Telefone (WhatsApp)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input type="text" required value={formData.phone} onChange={handlePhoneChange}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="(11) 99999-9999" />
              </div>
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Perfil Profissional</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                </div>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5 bg-white">
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">E-mail</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input type="email" required value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="seu@email.com" />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input type="password" required value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                  placeholder="Mínimo 6 caracteres" />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</div>}

            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Conta e Ir para Pagamento →'}
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
