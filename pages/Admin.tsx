import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, BarChart2, Mail, Database, Settings,
  ArrowLeft, RefreshCw, Search, CheckCircle, XCircle,
  Crown, Zap, AlertTriangle, Send, Eye, EyeOff,
  TrendingUp, UserCheck, UserX, Clock,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AdminProps {
  onBack: () => void;
}

type AdminTab = 'users' | 'metrics' | 'email' | 'database' | 'settings';

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
    { id: 'users',    label: 'Usuários',      icon: <Users size={16} /> },
    { id: 'metrics',  label: 'Métricas',      icon: <BarChart2 size={16} /> },
    { id: 'email',    label: 'Comunicação',   icon: <Mail size={16} /> },
    { id: 'database', label: 'Banco de Dados', icon: <Database size={16} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header do painel */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">⚡</span> Painel Administrativo
          </h1>
          <p className="text-gray-500 text-xs">TaxReform.ai Brasil — Acesso restrito</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Conteúdo */}
      <div className="p-6">
        {activeTab === 'users'    && <TabUsers />}
        {activeTab === 'metrics'  && <TabMetrics />}
        {activeTab === 'email'    && <TabEmail />}
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
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updatePlan = async (userId: string, planId: string, planStatus: string) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from('user_profiles')
      .update({ plan_id: planId, plan_status: planStatus, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) {
      setMsg('❌ Erro: ' + error.message);
    } else {
      setMsg('✅ Plano atualizado com sucesso!');
      fetchUsers();
    }
    setActionLoading(null);
    setTimeout(() => setMsg(''), 3000);
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
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-emerald-400">
          {msg}
        </div>
      )}

      {/* Contagem */}
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
                      <div className="font-medium text-white truncate max-w-[160px]">
                        {user.full_name || '—'}
                      </div>
                      <div className="text-gray-500 text-xs truncate max-w-[160px]">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${plan.color}`}>
                        {plan.icon} {plan.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(user.created_at)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {fmt(user.expires_at ?? user.trial_ends_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {/* Tornar Mensal */}
                        {user.plan_id !== 'monthly' && (
                          <button
                            disabled={isLoading}
                            onClick={() => updatePlan(user.user_id, 'monthly', 'active')}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition disabled:opacity-50"
                            title="Tornar Mensal"
                          >
                            <Zap size={11} />
                          </button>
                        )}
                        {/* Promover para Vitalício */}
                        {user.plan_id !== 'lifetime' && (
                          <button
                            disabled={isLoading}
                            onClick={() => updatePlan(user.user_id, 'lifetime', 'active')}
                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-medium border border-amber-500/20 transition disabled:opacity-50"
                            title="Promover para Vitalício"
                          >
                            <Crown size={11} />
                          </button>
                        )}
                        {/* Suspender / Reativar */}
                        {user.plan_status !== 'suspended' ? (
                          <button
                            disabled={isLoading}
                            onClick={() => updatePlan(user.user_id, user.plan_id, 'suspended')}
                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-medium border border-red-500/20 transition disabled:opacity-50"
                            title="Suspender acesso"
                          >
                            <UserX size={11} />
                          </button>
                        ) : (
                          <button
                            disabled={isLoading}
                            onClick={() => updatePlan(user.user_id, user.plan_id, 'active')}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition disabled:opacity-50"
                            title="Reativar acesso"
                          >
                            <UserCheck size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
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

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('plan_id, plan_status, created_at');

      if (!error && data) {
        const total = data.length;
        const free = data.filter(u => u.plan_id === 'free').length;
        const monthly = data.filter(u => u.plan_id === 'monthly').length;
        const lifetime = data.filter(u => u.plan_id === 'lifetime').length;
        const active = data.filter(u => ['active', 'trialing'].includes(u.plan_status)).length;
        const suspended = data.filter(u => u.plan_status === 'suspended').length;

        // Agrupar cadastros reais por data (todos os dados)
        const countByDate: Record<string, number> = {};
        data.forEach(u => {
          if (!u.created_at) return;
          // Converter para data local no formato YYYY-MM-DD
          const d = new Date(u.created_at);
          const dateKey = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
          countByDate[dateKey] = (countByDate[dateKey] || 0) + 1;
        });

        // Gerar eixo X: do cadastro mais antigo até hoje
        const allDates = Object.keys(countByDate).sort();
        const startDate = allDates.length > 0
          ? new Date(allDates[0])
          : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const today = new Date();
        const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysToShow = Math.max(daysDiff, 14);

        const recentSignups = Array.from({ length: daysToShow }, (_, i) => {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          const dateKey = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
          return { date: dateKey, count: countByDate[dateKey] || 0 };
        });

        setMetrics({ total, free, monthly, lifetime, active, suspended, recentSignups });
      }
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <RefreshCw size={20} className="text-emerald-500 animate-spin" />
    </div>
  );

  if (!metrics) return null;

  const convRate = metrics.total > 0
    ? (((metrics.monthly + metrics.lifetime) / metrics.total) * 100).toFixed(1)
    : '0.0';

  const cards = [
    { label: 'Total de Cadastros', value: metrics.total, icon: <Users size={18} />, color: 'text-white' },
    { label: 'Freemium', value: metrics.free, icon: <Clock size={18} />, color: 'text-blue-400' },
    { label: 'Plano Mensal', value: metrics.monthly, icon: <Zap size={18} />, color: 'text-emerald-400' },
    { label: 'Plano Vitalício', value: metrics.lifetime, icon: <Crown size={18} />, color: 'text-amber-400' },
    { label: 'Usuários Ativos', value: metrics.active, icon: <UserCheck size={18} />, color: 'text-emerald-400' },
    { label: 'Taxa de Conversão', value: `${convRate}%`, icon: <TrendingUp size={18} />, color: 'text-purple-400' },
  ];

  const maxCount = Math.max(...metrics.recentSignups.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`mb-2 ${card.color}`}>{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-gray-500 text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de cadastros */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          📈 Cadastros — últimos 14 dias
        </h3>
        <div className="flex items-end gap-1 h-32">
          {metrics.recentSignups.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-gray-600">{day.count > 0 ? day.count : ''}</div>
              <div
                className="w-full rounded-sm bg-emerald-500/70 hover:bg-emerald-400 transition min-h-[2px]"
                style={{ height: `${(day.count / maxCount) * 100}%` }}
                title={`${day.date}: ${day.count} cadastro(s)`}
              />
              <div className="text-[9px] text-gray-600 rotate-45 origin-left mt-1">
                {day.date.slice(5)}
              </div>
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
    if (!subject || !body) {
      setResult('❌ Preencha assunto e mensagem.');
      return;
    }
    if (segment === 'single' && !to) {
      setResult('❌ Informe o email do destinatário.');
      return;
    }

    setSending(true);
    setResult('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ to, segment, subject, body }),
      });

      const json = await response.json();
      if (response.ok) {
        setResult(`✅ Email enviado com sucesso! (${json.sent ?? 1} destinatário(s))`);
        setSubject('');
        setBody('');
        setTo('');
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

        {/* Segmento */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Destinatário</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'single', label: '📧 Email específico' },
              { id: 'all',    label: '👥 Todos os usuários' },
              { id: 'free',   label: '🎁 Apenas freemium' },
              { id: 'paid',   label: '💎 Apenas pagantes' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setSegment(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  segment === s.id
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email específico */}
        {segment === 'single' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Email do destinatário</label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Assunto */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Assunto</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Assunto do email..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Corpo */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Mensagem</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Escreva a mensagem aqui..."
            rows={8}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none font-mono"
          />
          <p className="text-gray-600 text-xs mt-1">Suporta HTML básico: &lt;b&gt;, &lt;i&gt;, &lt;a&gt;, &lt;br&gt;</p>
        </div>

        {result && (
          <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm">
            {result}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition disabled:opacity-50"
        >
          {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? 'Enviando...' : 'Enviar Email'}
        </button>
      </div>
    </div>
  );
};

// ─── ABA 4: Banco de Dados ────────────────────────────────────────────────────

const TabDatabase: React.FC = () => {
  const [activeTable, setActiveTable] = useState('user_profiles');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(20);

  const TABLES = ['user_profiles', 'pending_activations', 'newsletter_subscribers'];

  const fetchTable = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from(activeTable)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && rows) setData(rows);
    else setData([]);
    setLoading(false);
  }, [activeTable, limit]);

  useEffect(() => { fetchTable(); }, [fetchTable]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {TABLES.map(t => (
            <button
              key={t}
              onClick={() => setActiveTable(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeTable === t
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none"
        >
          <option value={20}>20 linhas</option>
          <option value={50}>50 linhas</option>
          <option value={100}>100 linhas</option>
        </select>
        <button
          onClick={fetchTable}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition"
        >
          <RefreshCw size={12} /> Atualizar
        </button>
        <span className="text-gray-600 text-xs">{data.length} linha(s)</span>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw size={20} className="text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-900 text-gray-500 uppercase tracking-wide">
                {columns.map(col => (
                  <th key={col} className="px-3 py-2.5 text-left whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.map((row, i) => (
                <tr key={i} className="bg-gray-900/50 hover:bg-gray-800/50 transition">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 text-gray-300 max-w-[200px]">
                      <div className="truncate" title={String(row[col] ?? '')}>
                        {row[col] === null ? (
                          <span className="text-gray-700">null</span>
                        ) : String(row[col])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="py-12 text-center text-gray-600 text-sm">
              Tabela vazia ou sem permissão de acesso.
            </div>
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

      {/* Variáveis de ambiente */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">⚙️ Variáveis de Ambiente</h3>
          <button
            onClick={() => setShowEnv(!showEnv)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition"
          >
            {showEnv ? <EyeOff size={13} /> : <Eye size={13} />}
            {showEnv ? 'Ocultar' : 'Mostrar status'}
          </button>
        </div>
        {showEnv && (
          <div className="space-y-2">
            {envVars.map(v => (
              <div key={v.key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <code className="text-xs text-gray-400">{v.key}</code>
                {v.status ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs">
                    <CheckCircle size={12} /> Configurada
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 text-xs">
                    <XCircle size={12} /> Não encontrada
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links rápidos */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">🔗 Acesso Rápido</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {links.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 hover:text-white transition"
            >
              <span className="text-emerald-500">↗</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Info do sistema */}
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

    </div>
  );
};
