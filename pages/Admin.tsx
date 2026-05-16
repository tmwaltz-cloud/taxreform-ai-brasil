import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, BarChart2, Mail, Database, Settings,
  ArrowLeft, RefreshCw, Search, CheckCircle, XCircle,
  Crown, Zap, AlertTriangle, Send, Eye, EyeOff,
  TrendingUp, UserCheck, UserX, Clock, Trash2, Info, Radio,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AdminProps {
  onBack: () => void;
}

type AdminTab = 'users' | 'metrics' | 'email' | 'database' | 'settings' | 'monitor';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  plan_id: string;
  plan_status: string;
  activated_at: string | null;
  expires_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

interface Metrics {
  total: number;
  free: number;
  monthly: number;
  lifetime: number;
  active: number;
  suspended: number;
  recentSignups: { date: string; count: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free:     { label: 'Freemium',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   icon: <Clock size={10} /> },
  monthly:  { label: 'Mensal',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: <Zap size={10} /> },
  lifetime: { label: 'Vitalício', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: <Crown size={10} /> },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Ativo',      color: 'text-emerald-400' },
  trialing:  { label: 'Trial',      color: 'text-blue-400' },
  cancelled: { label: 'Cancelado',  color: 'text-red-400' },
  suspended: { label: 'Suspenso',   color: 'text-orange-400' },
  inactive:  { label: 'Inativo',    color: 'text-gray-500' },
};

const fmt = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('pt-BR') : '—';

// ─── Componente principal ─────────────────────────────────────────────────────

export const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'users',    label: 'Usuários',       icon: <Users size={16} /> },
    { id: 'metrics',  label: 'Métricas',       icon: <BarChart2 size={16} /> },
    { id: 'email',    label: 'Comunicação',    icon: <Mail size={16} /> },
    { id: 'monitor',  label: 'Monitor News',   icon: <Radio size={16} /> },
    { id: 'database', label: 'Banco de Dados', icon: <Database size={16} /> },
    { id: 'settings', label: 'Configurações',  icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">⚡</span> Painel Administrativo
          </h1>
          <p className="text-gray-500 text-xs">TaxReform.ai Brasil — Acesso restrito</p>
        </div>
      </div>

      <div className="bg-gray-900 border-b border-gray-800 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'users'    && <TabUsers />}
        {activeTab === 'metrics'  && <TabMetrics />}
        {activeTab === 'email'    && <TabEmail />}
        {activeTab === 'monitor'  && <TabMonitor />}
        {activeTab === 'database' && <TabDatabase />}
        {activeTab === 'settings' && <TabSettings />}
      </div>
    </div>
  );
};

// ─── ABA 1: Usuários ──────────────────────────────────────────────────────────

const TabUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' }>({ text: '', type: 'ok' });
  const [deleteConfirm, setDeleteConfirm] = useState<UserProfile | null>(null);

  const showMsg = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'ok' }), 4000);
  };

  // ── Fetch: tenta query direta primeiro; se RLS bloquear, usa Edge Function ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    // Tentativa 1: query direta (funciona se RLS tiver policy de admin)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setUsers(data);
      setLoading(false);
      return;
    }

    // Tentativa 2: Edge Function admin-list-users (service_role bypassa RLS)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${supabaseUrl}/functions/v1/admin-list-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setUsers(json.users ?? []);
        setLoading(false);
        return;
      }

      const json = await res.json().catch(() => ({}));
      setFetchError(
        `RLS bloqueou acesso direto e a Edge Function retornou erro: ${json.error ?? res.statusText}. ` +
        `Execute o SQL em supabase/rls_admin_fix.sql e faça deploy da função admin-list-users.`
      );
    } catch (fnErr: any) {
      setFetchError(
        `Erro ao carregar usuários: ${error?.message ?? fnErr.message}. ` +
        `Execute o SQL em supabase/rls_admin_fix.sql para configurar as policies RLS.`
      );
    }

    setUsers([]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Atualizar plano ─────────────────────────────────────────────────────────
  const updatePlan = async (userId: string, planId: string, planStatus: string) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from('user_profiles')
      .update({ plan_id: planId, plan_status: planStatus, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) {
      showMsg('❌ Erro ao atualizar plano: ' + error.message, 'err');
    } else {
      showMsg('✅ Plano atualizado com sucesso!');
      fetchUsers();
    }
    setActionLoading(null);
  };

  // ── Deletar usuário ─────────────────────────────────────────────────────────
  // IMPORTANTE: deletar de auth.users diretamente via anon key SEMPRE falha.
  // O fluxo correto é:
  //   1. Deletar de user_profiles (permitido via RLS com policy de admin)
  //   2. Chamar Edge Function com service_role key para deletar de auth.users
  const deleteUser = async (user: UserProfile) => {
    setActionLoading(user.user_id);
    setDeleteConfirm(null);

    try {
      // Passo 1: deletar o perfil (FK de user_profiles → auth.users)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.user_id);

      if (profileError) {
        showMsg(`❌ Erro ao remover perfil: ${profileError.message}`, 'err');
        setActionLoading(null);
        return;
      }

      // Passo 2: chamar Edge Function para deletar de auth.users (requer service_role)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId: user.user_id }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        // Perfil já foi deletado. Apenas avisa que o auth.users precisa de atenção.
        showMsg(
          `⚠️ Perfil removido, mas auth.users não foi deletado: ${json.error ?? res.statusText}. Crie a Edge Function admin-delete-user.`,
          'err'
        );
      } else {
        showMsg('✅ Usuário deletado com sucesso!');
      }

      fetchUsers();
    } catch (err: any) {
      showMsg(`❌ Erro inesperado: ${err.message}`, 'err');
    }

    setActionLoading(null);
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchPlan = filterPlan === 'all' || u.plan_id === filterPlan;
    return matchSearch && matchPlan;
  });

  return (
    <div className="space-y-4">
      {/* Modal de confirmação de delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-white">Confirmar exclusão</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Deseja excluir o usuário <strong className="text-white">{deleteConfirm.email}</strong>?
                  Esta ação é irreversível.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteUser(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os planos</option>
            <option value="free">Freemium</option>
            <option value="monthly">Mensal</option>
            <option value="lifetime">Vitalício</option>
          </select>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* Mensagem de feedback */}
      {msg.text && (
        <div className={`px-4 py-2 rounded-lg border text-sm ${
          msg.type === 'ok'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Erro de fetch com diagnóstico */}
      {fetchError && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <XCircle size={14} /> {fetchError}
          </div>
          <div className="text-red-300/70 text-xs flex items-start gap-1.5 mt-1">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            <span>
              Verifique se a tabela <code className="bg-red-500/20 px-1 rounded">user_profiles</code> tem
              RLS habilitado com policy permitindo leitura para admins, ou se a
              <code className="bg-red-500/20 px-1 rounded ml-1">VITE_SUPABASE_ANON_KEY</code> está correta no Vercel.
            </span>
          </div>
        </div>
      )}

      <p className="text-gray-500 text-xs">{filtered.length} usuário(s) encontrado(s)</p>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw size={20} className="text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Plano</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Cadastro</th>
                <th className="px-4 py-3 text-left">Expira</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(user => {
                const plan = PLAN_LABELS[user.plan_id] ?? PLAN_LABELS.free;
                const status = STATUS_LABELS[user.plan_status] ?? STATUS_LABELS.inactive;
                const isLoading = actionLoading === user.user_id;

                return (
                  <tr key={user.id} className="bg-gray-900/50 hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white truncate max-w-[160px]">{user.full_name || '—'}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[160px]">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${plan.color}`}>
                        {plan.icon} {plan.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(user.created_at)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(user.expires_at ?? user.trial_ends_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {user.plan_id !== 'monthly' && (
                          <button disabled={isLoading} onClick={() => updatePlan(user.user_id, 'monthly', 'active')}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition disabled:opacity-50" title="Tornar Mensal">
                            <Zap size={11} />
                          </button>
                        )}
                        {user.plan_id !== 'lifetime' && (
                          <button disabled={isLoading} onClick={() => updatePlan(user.user_id, 'lifetime', 'active')}
                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-medium border border-amber-500/20 transition disabled:opacity-50" title="Promover para Vitalício">
                            <Crown size={11} />
                          </button>
                        )}
                        {user.plan_status !== 'suspended' ? (
                          <button disabled={isLoading} onClick={() => updatePlan(user.user_id, user.plan_id, 'suspended')}
                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-medium border border-red-500/20 transition disabled:opacity-50" title="Suspender acesso">
                            <UserX size={11} />
                          </button>
                        ) : (
                          <button disabled={isLoading} onClick={() => updatePlan(user.user_id, user.plan_id, 'active')}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition disabled:opacity-50" title="Reativar acesso">
                            <UserCheck size={11} />
                          </button>
                        )}
                        {/* Botão de delete — abre modal de confirmação */}
                        <button
                          disabled={isLoading}
                          onClick={() => setDeleteConfirm(user)}
                          className="px-2 py-1 rounded bg-gray-700/50 hover:bg-red-500/20 text-gray-500 hover:text-red-400 text-[11px] font-medium border border-gray-700 hover:border-red-500/30 transition disabled:opacity-50"
                          title="Deletar usuário"
                        >
                          {isLoading ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && !fetchError && (
            <div className="py-12 text-center text-gray-600 text-sm">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── ABA 2: Métricas ──────────────────────────────────────────────────────────

const TabMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setFetchError(null);

      // Tentativa 1: query direta
      let rows: any[] | null = null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('plan_id, plan_status, created_at');

      if (!error && data && data.length > 0) {
        rows = data;
      } else {
        // Tentativa 2: Edge Function (bypassa RLS via service_role)
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`${supabaseUrl}/functions/v1/admin-list-users`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
          });
          if (res.ok) {
            const json = await res.json();
            rows = json.users ?? [];
          } else {
            setFetchError(`Sem permissão de admin. Execute supabase/rls_admin_fix.sql e faça deploy de admin-list-users.`);
            setLoading(false);
            return;
          }
        } catch (fnErr: any) {
          setFetchError(`Erro: ${fnErr.message}`);
          setLoading(false);
          return;
        }
      }

      if (rows) {
        const data = rows;
        const total = data.length;
        const free = data.filter(u => u.plan_id === 'free').length;
        const monthly = data.filter(u => u.plan_id === 'monthly').length;
        const lifetime = data.filter(u => u.plan_id === 'lifetime').length;
        const active = data.filter(u => ['active', 'trialing'].includes(u.plan_status)).length;
        const suspended = data.filter(u => u.plan_status === 'suspended').length;

        const countByDate: Record<string, number> = {};
        data.forEach(u => {
          if (!u.created_at) return;
          const d = new Date(u.created_at);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          countByDate[dateKey] = (countByDate[dateKey] || 0) + 1;
        });

        const recentSignups = Array.from({ length: 21 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (20 - i));
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return { date: dateKey, count: countByDate[dateKey] || 0 };
        });

        setMetrics({ total, free, monthly, lifetime, active, suspended, recentSignups });
      }
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><RefreshCw size={20} className="text-emerald-500 animate-spin" /></div>;

  if (fetchError) return (
    <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      <XCircle size={14} className="inline mr-2" />{fetchError}
    </div>
  );

  if (!metrics) return null;

  const convRate = metrics.total > 0
    ? (((metrics.monthly + metrics.lifetime) / metrics.total) * 100).toFixed(1)
    : '0.0';

  const cards = [
    { label: 'Total de Cadastros', value: metrics.total,    icon: <Users size={18} />,     color: 'text-white' },
    { label: 'Freemium',           value: metrics.free,     icon: <Clock size={18} />,     color: 'text-blue-400' },
    { label: 'Plano Mensal',       value: metrics.monthly,  icon: <Zap size={18} />,       color: 'text-emerald-400' },
    { label: 'Plano Vitalício',    value: metrics.lifetime, icon: <Crown size={18} />,     color: 'text-amber-400' },
    { label: 'Usuários Ativos',    value: metrics.active,   icon: <UserCheck size={18} />, color: 'text-emerald-400' },
    { label: 'Taxa de Conversão',  value: `${convRate}%`,   icon: <TrendingUp size={18} />,color: 'text-purple-400' },
  ];

  const maxCount = Math.max(...metrics.recentSignups.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`mb-2 ${card.color}`}>{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-gray-500 text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">📈 Cadastros — últimos 21 dias</h3>
        <div className="flex items-end gap-1 h-32">
          {metrics.recentSignups.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-gray-600">{day.count > 0 ? day.count : ''}</div>
              <div className="w-full rounded-sm bg-emerald-500/70 hover:bg-emerald-400 transition min-h-[2px]"
                style={{ height: `${(day.count / maxCount) * 100}%` }}
                title={`${day.date}: ${day.count} cadastro(s)`}
              />
              <div className="text-[9px] text-gray-600 rotate-45 origin-left mt-1">{day.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ABA 3: Comunicação ───────────────────────────────────────────────────────

const TabEmail: React.FC = () => {
  const [to, setTo] = useState('');
  const [segment, setSegment] = useState<'single' | 'all' | 'free' | 'paid'>('single');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const handleSend = async () => {
    if (!subject || !body) { setResult('❌ Preencha assunto e mensagem.'); return; }
    if (segment === 'single' && !to) { setResult('❌ Informe o email do destinatário.'); return; }

    setSending(true); setResult('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ to, segment, subject, body }),
      });

      const json = await response.json();
      if (response.ok) {
        setResult(`✅ Email enviado com sucesso! (${json.sent ?? 1} destinatário(s))`);
        setSubject(''); setBody(''); setTo('');
      } else {
        setResult(`❌ Erro: ${json.error ?? 'Falha ao enviar'}`);
      }
    } catch (err: any) {
      setResult(`❌ Erro: ${err.message}`);
    }

    setSending(false);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">✉️ Enviar Email</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Destinatário</label>
          <div className="flex flex-wrap gap-2">
            {[{ id: 'single', label: '📧 Email específico' }, { id: 'all', label: '👥 Todos' }, { id: 'free', label: '🎁 Freemium' }, { id: 'paid', label: '💎 Pagantes' }].map(s => (
              <button key={s.id} onClick={() => setSegment(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${segment === s.id ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {segment === 'single' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Email do destinatário</label>
            <input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="usuario@email.com"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Assunto</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Mensagem</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Mensagem..." rows={8}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none font-mono" />
          <p className="text-gray-600 text-xs mt-1">Suporta HTML básico: &lt;b&gt;, &lt;i&gt;, &lt;a&gt;, &lt;br&gt;</p>
        </div>
        {result && <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm">{result}</div>}
        <button onClick={handleSend} disabled={sending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition disabled:opacity-50">
          {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? 'Enviando...' : 'Enviar Email'}
        </button>
      </div>
    </div>
  );
};

// ─── ABA: Monitor Tributário ──────────────────────────────────────────────────

const TabMonitor: React.FC = () => {
  const [running, setRunning]     = useState(false);
  const [result, setResult]       = useState<{ ok?: boolean; news_count?: number; error?: string } | null>(null);
  const [runs, setRuns]           = useState<any[]>([]);
  const [news, setNews]           = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = async () => {
    setLoadingData(true);
    const [runsRes, newsRes] = await Promise.all([
      supabase.from('monitor_runs').select('*').order('started_at', { ascending: false }).limit(10),
      supabase.from('tax_news').select('*').order('date_pub', { ascending: false }).limit(20),
    ]);
    setRuns(runsRes.data ?? []);
    setNews(newsRes.data ?? []);
    setLoadingData(false);
  };

  useEffect(() => { fetchData(); }, []);

  const runMonitor = async () => {
    setRunning(true);
    setResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/monitor-tributario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ triggered_by: 'manual' }),
      });
      const json = await res.json();
      setResult(json);
      await fetchData();
    } catch (err: any) {
      setResult({ error: err.message });
    }
    setRunning(false);
  };

  const statusColor = (s: string) =>
    s === 'success' ? 'text-emerald-400' : s === 'error' ? 'text-red-400' : 'text-yellow-400';

  const urgencyColor = (u: string) =>
    u === 'high' ? 'text-red-400 bg-red-400/10 border-red-400/20'
    : u === 'medium' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    : 'text-gray-400 bg-gray-400/10 border-gray-400/20';

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Controle do Monitor */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Radio size={16} className="text-emerald-400" /> Monitor Tributário Automático
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Roda automaticamente todo dia às 07h (Brasília) via pg_cron + Gemini Google Search.
              Use o botão abaixo para disparo manual.
            </p>
          </div>
          <button
            onClick={runMonitor}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-lg transition disabled:opacity-50"
          >
            {running ? <RefreshCw size={14} className="animate-spin" /> : <Radio size={14} />}
            {running ? 'Executando...' : 'Rodar Agora'}
          </button>
        </div>

        {result && (
          <div className={`px-4 py-3 rounded-lg border text-sm ${result.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {result.ok
              ? `✅ Monitor executado com sucesso — ${result.news_count} notícias salvas no banco.`
              : `❌ Erro: ${result.error}`}
          </div>
        )}
      </div>

      {/* Histórico de execuções */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">📋 Histórico de Execuções</h3>
          <button onClick={fetchData} disabled={loadingData}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition">
            <RefreshCw size={12} className={loadingData ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
        {loadingData ? (
          <div className="flex justify-center py-6"><RefreshCw size={16} className="text-emerald-500 animate-spin" /></div>
        ) : runs.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">Nenhuma execução registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-wide border-b border-gray-800">
                  <th className="py-2 text-left">Data/Hora</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Notícias</th>
                  <th className="py-2 text-left">Trigger</th>
                  <th className="py-2 text-left">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {runs.map(r => (
                  <tr key={r.id}>
                    <td className="py-2 text-gray-400">{new Date(r.started_at).toLocaleString('pt-BR')}</td>
                    <td className={`py-2 font-medium ${statusColor(r.status)}`}>{r.status}</td>
                    <td className="py-2 text-gray-300">{r.news_count ?? '—'}</td>
                    <td className="py-2 text-gray-500">{r.triggered_by}</td>
                    <td className="py-2 text-red-400 max-w-[200px] truncate">{r.error_msg ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notícias no banco */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">📰 Notícias no Banco ({news.length})</h3>
        {loadingData ? (
          <div className="flex justify-center py-6"><RefreshCw size={16} className="text-emerald-500 animate-spin" /></div>
        ) : news.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">Nenhuma notícia. Rode o monitor para popular.</p>
        ) : (
          <div className="space-y-3">
            {news.map(n => (
              <div key={n.id} className="border border-gray-800 rounded-lg p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white font-medium leading-snug">{n.title}</p>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${urgencyColor(n.urgency)}`}>
                    {n.urgency}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{n.summary}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-600">
                  <span>{n.source}</span>
                  <span>•</span>
                  <span>{new Date(n.date_pub).toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span className="text-emerald-600">{n.category}</span>
                  {n.source_url && (
                    <a href={n.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400">↗ Link</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ABA 4: Banco de Dados ────────────────────────────────────────────────────

const TabDatabase: React.FC = () => {
  const [activeTable, setActiveTable] = useState('user_profiles');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);

  const TABLES = ['user_profiles', 'tax_news', 'monitor_runs', 'pending_activations', 'newsletter_subscribers'];

  const fetchTable = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data: rows, error } = await supabase
      .from(activeTable)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      setFetchError(`Erro ao carregar ${activeTable}: ${error.message} (${error.code})`);
      setData([]);
    } else {
      setData(rows ?? []);
    }
    setLoading(false);
  }, [activeTable, limit]);

  useEffect(() => { fetchTable(); }, [fetchTable]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {TABLES.map(t => (
            <button key={t} onClick={() => setActiveTable(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeTable === t ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none">
          <option value={20}>20 linhas</option>
          <option value={50}>50 linhas</option>
          <option value={100}>100 linhas</option>
        </select>
        <button onClick={fetchTable} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
        <span className="text-gray-600 text-xs">{data.length} linha(s)</span>
      </div>

      {/* Aviso sobre delete direto no Dashboard Supabase */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Sobre deletar usuários:</strong> nunca delete direto pela tabela no Dashboard Supabase — a FK
          <code className="bg-amber-500/20 px-1 mx-1 rounded">user_profiles → auth.users</code>
          causa o erro "Database error deleting user". Use o botão 🗑️ na aba Usuários, que remove o perfil primeiro
          e depois chama a Edge Function <code className="bg-amber-500/20 px-1 mx-1 rounded">admin-delete-user</code>.
        </span>
      </div>

      {fetchError && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <XCircle size={14} /> {fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw size={20} className="text-emerald-500 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-900 text-gray-500 uppercase tracking-wide">
                {columns.map(col => <th key={col} className="px-3 py-2.5 text-left whitespace-nowrap">{col}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.map((row, i) => (
                <tr key={i} className="bg-gray-900/50 hover:bg-gray-800/50 transition">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 text-gray-300 max-w-[200px]">
                      <div className="truncate" title={String(row[col] ?? '')}>
                        {row[col] === null ? <span className="text-gray-700">null</span> : String(row[col])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !fetchError && (
            <div className="py-12 text-center text-gray-600 text-sm">Tabela vazia ou sem permissão de acesso.</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── ABA 5: Configurações ─────────────────────────────────────────────────────

const TabSettings: React.FC = () => {
  const [showEnv, setShowEnv] = useState(false);

  const envVars = [
    { key: 'VITE_SUPABASE_URL',      status: !!import.meta.env.VITE_SUPABASE_URL },
    { key: 'VITE_SUPABASE_ANON_KEY', status: !!import.meta.env.VITE_SUPABASE_ANON_KEY },
    { key: 'VITE_GEMINI_API_KEY',    status: !!import.meta.env.VITE_GEMINI_API_KEY },
  ];

  const links = [
    { label: 'Supabase Dashboard',  url: 'https://supabase.com/dashboard/project/bmbjjbedjlldonjhnmfo' },
    { label: 'Supabase SQL Editor', url: 'https://supabase.com/dashboard/project/bmbjjbedjlldonjhnmfo/sql' },
    { label: 'Vercel Dashboard',    url: 'https://vercel.com/dashboard' },
    { label: 'Resend Dashboard',    url: 'https://resend.com/emails' },
    { label: 'Kiwify Dashboard',    url: 'https://app.kiwify.com.br' },
    { label: 'GitHub Repositório',  url: 'https://github.com/tmwaltz-cloud/taxreform-ai-brasil' },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">⚙️ Variáveis de Ambiente</h3>
          <button onClick={() => setShowEnv(!showEnv)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition">
            {showEnv ? <EyeOff size={13} /> : <Eye size={13} />}
            {showEnv ? 'Ocultar' : 'Mostrar status'}
          </button>
        </div>
        {showEnv && (
          <div className="space-y-2">
            {envVars.map(v => (
              <div key={v.key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <code className="text-xs text-gray-400">{v.key}</code>
                {v.status
                  ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={12} /> Configurada</span>
                  : <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={12} /> Não encontrada</span>
                }
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">🔗 Acesso Rápido</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {links.map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 hover:text-white transition">
              <span className="text-emerald-500">↗</span>{link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">📋 Informações do Sistema</h3>
        <div className="space-y-2 text-xs">
          {[
            { label: 'Projeto Supabase', value: 'bmbjjbedjlldonjhnmfo' },
            { label: 'Projeto Vercel',   value: 'taxreform-ai-brasil-slt5' },
            { label: 'Repositório',      value: 'tmwaltz-cloud/taxreform-ai-brasil' },
            { label: 'WhatsApp Suporte', value: '5515996648895' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-gray-500">{item.label}</span>
              <code className="text-gray-300">{item.value}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Instruções para criar a Edge Function de delete */}
      <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <AlertTriangle size={14} /> Edge Function necessária: admin-delete-user
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Para deletar usuários do <code className="bg-gray-800 px-1 rounded">auth.users</code> pelo painel,
          crie esta Edge Function no Supabase com a <code className="bg-gray-800 px-1 rounded">service_role key</code>:
        </p>
        <pre className="bg-gray-950 rounded-lg p-4 text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">{`// supabase/functions/admin-delete-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { userId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
})`}
        </pre>
        <p className="text-[11px] text-gray-500 mt-2">
          Deploy: <code className="bg-gray-800 px-1 rounded">supabase functions deploy admin-delete-user</code>
        </p>
      </div>
    </div>
  );
};
