import { useState } from "react";
import { UserRole, AuthView } from "../types";

interface PricingProps {
  onNavigate: (view: AuthView) => void;
  userData?: { name: string; phone: string; email: string; role: UserRole } | null;
}

// ─── Configuração dos planos ───────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Freemium",
    badge: null,
    price: 0,
    period: "",
    priceLabel: "Gratuito",
    description: "Teste por 7 dias. Sem cartão. Sem compromisso.",
    cta: "Começar Grátis",
    kiwifyUrl: null, // sem pagamento
    highlight: false,
    tag: "7 dias grátis",
    features: [
      "Notícias tributárias em tempo real",
      "Cronograma dinâmico da Reforma",
      "JaxAI — 3 perguntas por dia",
      "Dashboard de Inteligência",
    ],
    missing: [
      "Cadeia de Valor fiscal",
      "Guia do Contador 4.0",
      "Guias de Ação Práticos",
      "Intérprete Legislativo",
    ],
  },
  {
    id: "mensal",
    name: "Mensal",
    badge: null,
    price: 27,
    period: "/mês",
    priceLabel: null,
    description: "Acesso completo. Cancele quando quiser.",
    cta: "Assinar Agora",
    kiwifyUrl: "https://pay.kiwify.com.br/DM37j2q",
    highlight: false,
    tag: null,
    features: [
      "Tudo do Freemium",
      "JaxAI — 15 perguntas por dia",
      "Cadeia de Valor — 5 análises/dia",
      "Guia do Contador 4.0 completo",
      "Guias de Ação — 10/dia",
      "Intérprete Legislativo — 10/dia",
      "Atualizações contínuas da Reforma",
      "Cancele quando quiser",
    ],
    missing: ["Acesso vitalício garantido"],
  },
  {
    id: "vitalicio",
    name: "Vitalício",
    badge: "Melhor Custo-Benefício",
    price: 97,
    period: " único",
    priceLabel: null,
    description: "Pague uma vez. Use para sempre. Sem surpresas.",
    cta: "Garantir Acesso Vitalício",
    kiwifyUrl: "https://pay.kiwify.com.br/myXjxAN",
    highlight: true,
    tag: null,
    features: [
      "Tudo do Mensal",
      "JaxAI — 20 perguntas por dia",
      "Cadeia de Valor — 10 análises/dia",
      "Guia do Contador 4.0 completo",
      "Guias de Ação — 15/dia",
      "Intérprete Legislativo — 15/dia",
      "Todas as atualizações futuras",
      "Acesso prioritário a novos módulos",
      "Acesso vitalício garantido",
      "Sem renovação obrigatória",
    ],
    missing: [],
  },
];

export const getSelectedPlanUrl = () => sessionStorage.getItem('selectedPlanUrl') || '';
export const clearSelectedPlan = () => sessionStorage.removeItem('selectedPlanUrl');

// ─── Ícones ────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

// ─── Componente principal ──────────────────────────────────────────────────
export function Pricing({ onNavigate, userData }: PricingProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const hasAccount = !!userData?.email;
  const savings = 27 * 12 - 97;

  const handleCTA = (planId: string, kiwifyUrl: string | null) => {
    if (planId === 'free') {
      // Freemium → cadastro direto, sem pagamento
      if (hasAccount) {
        onNavigate('login');
      } else {
        sessionStorage.setItem('selectedPlanUrl', '');
        sessionStorage.setItem('selectedPlanId', 'free');
        onNavigate('signup');
      }
      return;
    }

    if (hasAccount) {
      // Já tem conta → vai direto para Kiwify
      window.open(kiwifyUrl!, "_blank", "noopener,noreferrer");
    } else {
      // Sem conta → salva plano e vai para cadastro
      sessionStorage.setItem('selectedPlanUrl', kiwifyUrl!);
      sessionStorage.setItem('selectedPlanId', planId);
      onNavigate('signup');
    }
  };

  const getButtonStyle = (plan: typeof PLANS[0]) => {
    if (plan.highlight) {
      return "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-[0_4px_20px_rgba(52,211,153,0.35)] hover:shadow-[0_4px_28px_rgba(52,211,153,0.5)] hover:-translate-y-0.5";
    }
    if (plan.id === 'free') {
      return "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50";
    }
    return "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600/50";
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col">

      {/* ── Header ── */}
      <div className="pt-16 pb-10 px-4 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-emerald-400 uppercase mb-3">
          Planos TaxReform.ai Brasil
        </p>
        {userData?.name && (
          <p className="text-slate-400 text-sm mb-2">
            Olá, <span className="text-white font-semibold">{userData.name}</span>! Escolha seu plano para ativar o acesso.
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
          Escolha como você quer<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            dominar a Reforma Tributária
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
          Da inteligência tributária gratuita ao acesso vitalício completo —
          para consultores, contadores e empresários.
        </p>
        <div className="inline-flex items-center gap-2 mt-5 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
          <span className="text-amber-400 text-xs font-semibold">
            💡 Vitalício economiza R${savings} vs 12 meses de assinatura
          </span>
        </div>

        {/* Indicador de etapas */}
        {!hasAccount && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {['Escolha o plano', 'Crie sua conta', 'Pagamento'].map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {i + 1}
                </span>
                <span className={`text-xs ${i === 0 ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>{step}</span>
                {i < 2 && <div className="w-6 h-px bg-slate-700 ml-1" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative rounded-2xl border transition-all duration-300 flex flex-col ${
                plan.highlight
                  ? "border-emerald-500/60 bg-gradient-to-b from-emerald-950/60 to-[#0B1120] shadow-[0_0_40px_rgba(52,211,153,0.12)]"
                  : "border-slate-700/50 bg-slate-900/40"
              } ${hoveredPlan === plan.id ? "scale-[1.02] shadow-xl" : ""}`}
            >
              {/* Badge destaque */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[11px] font-bold tracking-wide px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                    ⭐ {plan.badge}
                  </span>
                </div>
              )}

              {/* Tag freemium */}
              {plan.tag && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-slate-700 text-slate-300 text-[11px] font-bold tracking-wide px-4 py-1 rounded-full border border-slate-600 whitespace-nowrap">
                    🎁 {plan.tag}
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Nome e descrição */}
                <div className="mb-4">
                  <h2 className={`text-lg font-bold mb-1 ${plan.highlight ? "text-emerald-300" : "text-slate-200"}`}>
                    {plan.name}
                  </h2>
                  <p className="text-slate-500 text-xs leading-snug">{plan.description}</p>
                </div>

                {/* Preço */}
                <div className="mb-5">
                  {plan.priceLabel ? (
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-black leading-none ${plan.highlight ? "text-white" : "text-slate-100"}`}>
                        {plan.priceLabel}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-slate-400 text-sm font-medium">R$</span>
                      <span className={`text-4xl font-black leading-none ${plan.highlight ? "text-white" : "text-slate-100"}`}>
                        {plan.price}
                      </span>
                      <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                    </div>
                  )}
                  {plan.id === "free" && (
                    <p className="text-slate-600 text-xs mt-1">após 7 dias, escolha um plano pago</p>
                  )}
                  {plan.id === "mensal" && (
                    <p className="text-slate-600 text-xs mt-1">cobrado mensalmente · cancele quando quiser</p>
                  )}
                  {plan.id === "vitalicio" && (
                    <p className="text-emerald-600 text-xs mt-1 font-medium">pagamento único · acesso para sempre</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-600 line-through">
                      <XIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCTA(plan.id, plan.kiwifyUrl)}
                  className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 ${getButtonStyle(plan)}`}
                >
                  {hasAccount && plan.id !== 'free' ? 'Ir para pagamento' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparativo rápido ── */}
      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-center text-slate-300 text-sm font-semibold mb-5">
              Por que ir além do Freemium?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {[
                { icon: '🤖', title: 'JaxAI ilimitado', desc: 'Consultas tributárias sem restrição diária nos planos pagos' },
                { icon: '🔗', title: 'Cadeia de Valor', desc: 'Analise o impacto fiscal fornecedor → sua empresa → cliente' },
                { icon: '📋', title: 'Guias práticos', desc: 'Contador 4.0 + Guias de Ação + Intérprete Legislativo completos' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl bg-slate-800/30">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="text-slate-200 text-sm font-semibold mb-1">{title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Login e Garantia ── */}
      <div className="text-center pb-6">
        <button onClick={() => onNavigate('login')}
          className="text-slate-500 hover:text-slate-300 text-sm underline transition">
          Já tenho acesso — fazer login
        </button>
      </div>

      <div className="pb-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldIcon />
            <span className="text-slate-400 text-sm font-medium">Garantia de 7 dias</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Não ficou satisfeito? Solicite reembolso total em até 7 dias diretamente pela plataforma Kiwify. Sem burocracia.
          </p>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="pb-16 px-4 border-t border-slate-800/50">
        <div className="max-w-xl mx-auto pt-10">
          <h3 className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-6">
            Dúvidas frequentes
          </h3>
          <div className="space-y-4">
            {[
              { q: "O Freemium expira?", a: "Sim. Após 7 dias você continua com acesso limitado (notícias + cronograma + 3 perguntas/dia ao JaxAI). Para acesso completo, escolha o plano Mensal ou Vitalício." },
              { q: "O que significa acesso vitalício?", a: "Você paga uma única vez e tem acesso permanente à plataforma, incluindo todas as atualizações futuras da Reforma Tributária." },
              { q: "Posso cancelar a assinatura mensal a qualquer momento?", a: "Sim. O cancelamento é feito diretamente na Kiwify, sem multa e sem burocracia." },
              { q: "Os planos incluem as atualizações da Reforma de 2026?", a: "Sim. Toda a plataforma é atualizada conforme as regulamentações do IBS, CBS e Split Payment são publicadas." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
                <p className="text-slate-200 text-sm font-semibold mb-1">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
