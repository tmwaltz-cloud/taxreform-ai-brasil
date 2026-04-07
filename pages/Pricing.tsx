import { useState } from "react";

// ─── Configuração dos planos ───────────────────────────────────────────────
const PLANS = [
  {
    id: "mensal",
    name: "Assinatura",
    badge: null,
    price: 27,
    period: "/mês",
    description: "Ideal para quem quer começar sem compromisso.",
    cta: "Assinar Agora",
    kiwifyUrl: "https://pay.kiwify.com.br/DM37j2q",
    highlight: false,
    features: [
      "Acesso ao Dashboard de Inteligência",
      "JaxAI — Consultor IA (Gemini)",
      "Intérprete Legislativo",
      "Simulador Cadeia de Valor",
      "Guia do Contador 4.0",
      "Guia de Ações Práticas",
      "Atualizações mensais da Reforma",
      "Cancele quando quiser",
    ],
    missing: [
      "Acesso vitalício garantido",
      "Sem renovação obrigatória",
    ],
  },
  {
    id: "vitalicio",
    name: "Vitalício",
    badge: "Melhor Custo-Benefício",
    price: 97,
    period: " único",
    description: "Pague uma vez. Use para sempre. Sem surpresas.",
    cta: "Garantir Acesso Vitalício",
    kiwifyUrl: "https://pay.kiwify.com.br/myXjxAN",
    highlight: true,
    features: [
      "Acesso ao Dashboard de Inteligência",
      "JaxAI — Consultor IA (Gemini)",
      "Intérprete Legislativo",
      "Simulador Cadeia de Valor",
      "Guia do Contador 4.0",
      "Guia de Ações Práticas",
      "Atualizações mensais da Reforma",
      "Acesso vitalício garantido",
      "Sem renovação obrigatória",
    ],
    missing: [],
  },
];

// ─── Ícones SVG inline ─────────────────────────────────────────────────────
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
export default function Pricing() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const handleCTA = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Economia calculada: 97 vs 27*12 = 324
  const savings = 27 * 12 - 97;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col">
      {/* ── Header ── */}
      <div className="pt-16 pb-10 px-4 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-emerald-400 uppercase mb-3">
          Planos TaxReform.ai Brasil
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
          Escolha como você quer<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            dominar a Reforma Tributária
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
          Acesso à inteligência tributária que os grandes escritórios já usam —
          agora disponível para consultores e contadores independentes.
        </p>

        {/* Economia badge */}
        <div className="inline-flex items-center gap-2 mt-5 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
          <span className="text-amber-400 text-xs font-semibold">
            💡 Vitalício economiza R${savings} vs 12 meses de assinatura
          </span>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`
                relative rounded-2xl border transition-all duration-300 flex flex-col
                ${plan.highlight
                  ? "border-emerald-500/60 bg-gradient-to-b from-emerald-950/60 to-[#0B1120] shadow-[0_0_40px_rgba(52,211,153,0.12)]"
                  : "border-slate-700/50 bg-slate-900/40"
                }
                ${hoveredPlan === plan.id ? "scale-[1.02] shadow-xl" : ""}
              `}
            >
              {/* Badge destaque */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[11px] font-bold tracking-wide px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                    ⭐ {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                {/* Nome e descrição */}
                <div className="mb-5">
                  <h2 className={`text-lg font-bold mb-1 ${plan.highlight ? "text-emerald-300" : "text-slate-200"}`}>
                    {plan.name}
                  </h2>
                  <p className="text-slate-500 text-sm leading-snug">{plan.description}</p>
                </div>

                {/* Preço */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-slate-400 text-sm font-medium">R$</span>
                    <span className={`text-5xl font-black leading-none ${plan.highlight ? "text-white" : "text-slate-100"}`}>
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                  </div>
                  {plan.id === "mensal" && (
                    <p className="text-slate-600 text-xs mt-1">cobrado mensalmente · cancele quando quiser</p>
                  )}
                  {plan.id === "vitalicio" && (
                    <p className="text-emerald-600 text-xs mt-1 font-medium">pagamento único · acesso para sempre</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 line-through">
                      <XIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCTA(plan.kiwifyUrl)}
                  className={`
                    w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200
                    ${plan.highlight
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-[0_4px_20px_rgba(52,211,153,0.35)] hover:shadow-[0_4px_28px_rgba(52,211,153,0.5)] hover:-translate-y-0.5"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600/50"
                    }
                  `}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Garantia ── */}
      <div className="pb-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldIcon />
            <span className="text-slate-400 text-sm font-medium">Garantia de 7 dias</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Não ficou satisfeito? Solicite reembolso total em até 7 dias
            diretamente pela plataforma Kiwify. Sem burocracia.
          </p>
        </div>
      </div>

      {/* ── FAQ rápido ── */}
      <div className="pb-16 px-4 border-t border-slate-800/50">
        <div className="max-w-xl mx-auto pt-10">
          <h3 className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-6">
            Dúvidas frequentes
          </h3>
          <div className="space-y-4">
            {[
              {
                q: "O que significa acesso vitalício?",
                a: "Você paga uma única vez e tem acesso permanente à plataforma, incluindo todas as atualizações futuras da Reforma Tributária.",
              },
              {
                q: "Posso cancelar a assinatura mensal a qualquer momento?",
                a: "Sim. O cancelamento é feito diretamente na Kiwify, sem multa e sem burocracia.",
              },
              {
                q: "Os planos incluem as atualizações da Reforma de 2026?",
                a: "Sim. Toda a plataforma é atualizada conforme as regulamentações do IBS, CBS e Split Payment são publicadas.",
              },
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
