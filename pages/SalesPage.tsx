import React from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Shield, Zap, Users, TrendingUp, Clock, Star, ChevronDown } from 'lucide-react';

interface SalesPageProps {
  onBack: () => void;
  onBuy: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({ onBack, onBuy }) => {

  const handleWhatsApp = (msg?: string) => {
    const text = msg || `Olá, Rogério! Quero saber mais sobre o TaxReform.ai Brasil e como ele pode ajudar minha empresa na Reforma Tributária.`;
    window.open(`https://wa.me/5515996648895?text=${encodeURIComponent(text)}`, '_blank');
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans overflow-y-auto">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#0B1120]/95 backdrop-blur border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </button>
          <span className="font-bold text-lg">TaxReform<span className="text-emerald-400">.ai Brasil</span></span>
          <button
            onClick={() => scrollTo('planos')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Ver planos
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        {/* Fundo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-900/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/50 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              Lançamento — Acesso limitado
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            A Reforma Tributária<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              já começou. Você está<br />pronto?
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
            O TaxReform.ai Brasil é a plataforma de inteligência tributária que traduz a maior reforma fiscal dos últimos 50 anos em <strong className="text-white">ações práticas para o seu negócio</strong>.
          </p>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-10">
            Para contadores que querem liderar a transição. Para empresários que não podem perder competitividade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollTo('planos')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-4 px-8 rounded-xl shadow-[0_4px_30px_rgba(52,211,153,0.4)] transition-all hover:-translate-y-0.5 text-base"
            >
              Começar agora — 7 dias grátis <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleWhatsApp()}
              className="flex items-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold py-4 px-8 rounded-xl transition text-base"
            >
              Falar com especialista
            </button>
          </div>

          <p className="text-slate-600 text-xs mt-4">Sem cartão de crédito · Cancele quando quiser</p>
        </div>

        <div className="flex justify-center mt-12">
          <button onClick={() => scrollTo('publicos')} className="text-slate-600 hover:text-slate-400 transition animate-bounce">
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* ── Números ── */}
      <section className="border-y border-slate-800/50 py-10 px-4 bg-slate-900/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 'Set/2026', label: 'Prazo decisão Simples Híbrido' },
            { value: '2027', label: 'Extinção do PIS/COFINS' },
            { value: '28,5%', label: 'Alíquota consolidada IVA' },
            { value: '2033', label: 'Sistema pleno IBS + CBS' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 mb-1">{value}</p>
              <p className="text-slate-500 text-xs leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section id="publicos" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Para quem é o TaxReform.ai Brasil?</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">Dois públicos. Uma plataforma. O mesmo objetivo: dominar a Reforma antes dos concorrentes.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contador */}
            <div className="rounded-2xl p-8 border border-emerald-800/40 bg-gradient-to-b from-emerald-950/40 to-slate-900/40">
              <div className="w-12 h-12 bg-emerald-900/60 rounded-xl flex items-center justify-center text-2xl mb-5">🧮</div>
              <h3 className="text-xl font-bold text-emerald-300 mb-3">Para Contadores e Escritórios</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                A Reforma muda o papel do contador. Quem continuar só apurando impostos vai perder clientes para quem oferece estratégia.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Interprete textos legislativos em segundos',
                  'Entregue diagnósticos tributários completos',
                  'Oriente clientes sobre Simples Híbrido',
                  'Seja o consultor estratégico que eles precisam',
                  'Guia do Contador 4.0 — visão completa da transição',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresário */}
            <div className="rounded-2xl p-8 border border-cyan-800/40 bg-gradient-to-b from-cyan-950/40 to-slate-900/40">
              <div className="w-12 h-12 bg-cyan-900/60 rounded-xl flex items-center justify-center text-2xl mb-5">🏢</div>
              <h3 className="text-xl font-bold text-cyan-300 mb-3">Para Empresários e Gestores</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                A Reforma vai mudar sua precificação, seu fluxo de caixa e sua competitividade. Quem se preparar agora sai na frente.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Simule o impacto na sua cadeia de valor',
                  'Entenda o Split Payment no seu caixa',
                  'Saiba quando e como ajustar seus preços',
                  'Compare regimes: Simples x Híbrido x Presumido',
                  'JaxAI responde suas dúvidas em linguagem simples',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ferramentas ── */}
      <section className="py-20 px-4 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">O que está dentro da plataforma?</h2>
          <p className="text-slate-400 text-center mb-12">5 ferramentas de inteligência tributária integradas.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '🤖',
                title: 'JaxAI — Consultor IA',
                desc: 'Pergunte qualquer coisa sobre a Reforma. JaxAI responde com base na LC 214/2025 e dados em tempo real do Google.',
                tag: 'Powered by Gemini',
              },
              {
                icon: '📡',
                title: 'Radar de Inteligência',
                desc: 'Notícias tributárias filtradas por impacto. Saiba o que aconteceu hoje no Congresso, na Receita Federal e no CGIBS.',
                tag: 'Tempo real',
              },
              {
                icon: '🔗',
                title: 'Simulador Cadeia de Valor',
                desc: 'Analise o impacto fiscal em cada elo: fornecedor → sua empresa → cliente. Veja quem gera crédito e quem perde.',
                tag: 'IVA Dual',
              },
              {
                icon: '📋',
                title: 'Guia do Contador 4.0',
                desc: 'Roteiro completo para contadores navegarem a transição: do operacional ao estratégico.',
                tag: 'Para contadores',
              },
              {
                icon: '⚡',
                title: 'Guias de Ação Práticos',
                desc: 'Passo a passo para as principais ações: revisar NCMs, simular regimes, preparar o ERP, renegociar contratos.',
                tag: 'Action plan',
              },
              {
                icon: '⚖️',
                title: 'Intérprete Legislativo',
                desc: 'Cole qualquer artigo da EC 132, LC 214/2025 ou PLP 68/2024 e receba uma análise em linguagem de negócios.',
                tag: 'EC 132/2023',
              },
            ].map(({ icon, title, desc, tag }) => (
              <div key={title} className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-5 hover:border-emerald-700/40 transition">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-slate-100">{title}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 whitespace-nowrap shrink-0">{tag}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cronograma urgência ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">O relógio está correndo</h2>
          <p className="text-slate-400 text-center mb-10">Cada mês sem preparação é um mês de vantagem para o concorrente.</p>

          <div className="space-y-4">
            {[
              { period: 'Jan 2026', status: 'done', label: 'CONCLUÍDO', title: 'IBS e CBS nas notas fiscais', desc: 'Obrigação iniciada. Empresas do regime geral já emitem com os novos campos.' },
              { period: 'Abr 2026', status: 'current', label: 'AGORA', title: 'Fim da tolerância para erros', desc: 'A Receita Federal encerrou o prazo de tolerância. ERPs devem estar configurados.' },
              { period: 'Set 2026', status: 'warning', label: 'DECISIVO', title: 'Prazo: Simples Híbrido', desc: 'Empresas do Simples precisam decidir sobre o regime híbrido. Quem perder pode perder clientes B2B em 2027.' },
              { period: '2027', status: 'upcoming', label: 'CRÍTICO', title: 'Extinção do PIS/COFINS', desc: 'CBS entra com alíquota cheia (~8,8%). Impacto direto no caixa de todas as empresas.' },
            ].map(({ period, status, label, title, desc }) => {
              const colors: Record<string, string> = {
                done: 'border-slate-600 text-slate-500',
                current: 'border-emerald-500 text-emerald-400',
                warning: 'border-red-500 text-red-400',
                upcoming: 'border-amber-500 text-amber-400',
              };
              const tagColors: Record<string, string> = {
                done: 'bg-slate-800 text-slate-500',
                current: 'bg-emerald-900/50 text-emerald-400',
                warning: 'bg-red-900/50 text-red-400',
                upcoming: 'bg-amber-900/50 text-amber-400',
              };
              return (
                <div key={period} className={`flex gap-4 p-4 rounded-xl border ${colors[status]} bg-slate-900/40`}>
                  <div className="shrink-0 text-right w-20">
                    <p className="font-bold text-sm">{period}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagColors[status]}`}>{label}</span>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <p className="font-semibold text-sm text-slate-200 mb-0.5">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="py-20 px-4 bg-slate-900/40 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Escolha seu plano</h2>
          <p className="text-slate-400 text-center mb-12">Comece grátis. Evolua quando quiser.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Freemium',
                price: 'Grátis',
                period: '',
                tag: '🎁 7 dias',
                highlight: false,
                badge: null,
                desc: 'Experimente sem compromisso.',
                features: ['Notícias em tempo real', 'Cronograma dinâmico', 'JaxAI — 3 perguntas/dia', 'Dashboard'],
                missing: ['Cadeia de Valor', 'Guia do Contador 4.0', 'Guias de Ação', 'Intérprete Legislativo'],
                cta: 'Começar Grátis',
                action: () => onBuy(),
              },
              {
                name: 'Mensal',
                price: 'R$27',
                period: '/mês',
                tag: null,
                highlight: false,
                badge: null,
                desc: 'Acesso completo. Cancele quando quiser.',
                features: ['Tudo do Freemium', 'JaxAI — 15 perguntas/dia', 'Cadeia de Valor — 5/dia', 'Guia do Contador 4.0', 'Guias de Ação — 10/dia', 'Intérprete — 10/dia'],
                missing: ['Acesso vitalício'],
                cta: 'Assinar Agora',
                action: () => { window.open('https://pay.kiwify.com.br/DM37j2q', '_blank'); },
              },
              {
                name: 'Vitalício',
                price: 'R$97',
                period: ' único',
                tag: null,
                highlight: true,
                badge: '⭐ Melhor custo-benefício',
                desc: 'Pague uma vez. Use para sempre.',
                features: ['Tudo do Mensal', 'JaxAI — 20 perguntas/dia', 'Cadeia de Valor — 10/dia', 'Guias de Ação — 15/dia', 'Intérprete — 15/dia', 'Todas as atualizações futuras', 'Acesso vitalício garantido'],
                missing: [],
                cta: 'Garantir Acesso Vitalício',
                action: () => { window.open('https://pay.kiwify.com.br/myXjxAN', '_blank'); },
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border flex flex-col transition-all ${
                  plan.highlight
                    ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-950/60 to-slate-900/40 shadow-[0_0_40px_rgba(52,211,153,0.15)]'
                    : 'border-slate-700/50 bg-slate-900/40'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {plan.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-slate-700 text-slate-300 text-[11px] font-bold px-4 py-1 rounded-full border border-slate-600 whitespace-nowrap">
                      {plan.tag}
                    </span>
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-emerald-300' : 'text-slate-200'}`}>{plan.name}</h3>
                  <p className="text-slate-500 text-xs mb-4">{plan.desc}</p>
                  <div className="flex items-end gap-1 mb-5">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-100'}`}>{plan.price}</span>
                    <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-600 line-through">
                        <span className="w-3.5 h-3.5 shrink-0">✕</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={plan.action}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-[0_4px_20px_rgba(52,211,153,0.3)]'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600/50'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-slate-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Garantia de 7 dias · Sem burocracia · Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-4">
            {[
              { q: 'Para qual tipo de empresa é indicado?', a: 'Para qualquer empresa brasileira: MEI, Simples Nacional, Lucro Presumido ou Lucro Real. Cada regime tem impactos específicos na Reforma e a plataforma cobre todos eles.' },
              { q: 'Preciso ter conhecimento tributário para usar?', a: 'Não. O JaxAI traduz os termos técnicos em linguagem de negócio. Empresários e gestores usam sem dificuldade.' },
              { q: 'As informações são atualizadas?', a: 'Sim. O Radar de Inteligência usa Google Search em tempo real. O Cronograma é atualizado via IA com base na legislação mais recente.' },
              { q: 'O que acontece após os 7 dias grátis?', a: 'Você mantém acesso limitado (notícias + 3 perguntas/dia ao JaxAI). Para acesso completo, basta escolher o plano Mensal ou Vitalício.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
                <p className="font-semibold text-slate-200 text-sm mb-2">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-950/30 to-slate-900/40 border-t border-emerald-900/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Setembro de 2026 está chegando.
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            A decisão sobre o Simples Híbrido não espera. O impacto no Split Payment não espera.
            <br />Sua preparação pode começar hoje — gratuitamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo('planos')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-4 px-8 rounded-xl shadow-[0_4px_30px_rgba(52,211,153,0.4)] transition-all hover:-translate-y-0.5"
            >
              Começar grátis agora <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleWhatsApp('Olá, Rogério! Vi a landing page do TaxReform.ai Brasil e quero tirar algumas dúvidas antes de assinar.')}
              className="flex items-center justify-center gap-2 border border-slate-600 hover:border-emerald-600 text-slate-300 hover:text-white font-semibold py-4 px-8 rounded-xl transition"
            >
              Falar no WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900/80 border-t border-slate-800 py-10 px-4 text-center">
        <p className="text-slate-500 text-sm mb-2">TaxReform.ai Brasil © 2026 — Powered by ARG4 Negócios</p>
        <p className="text-slate-600 text-xs mb-6">Plataforma de inteligência tributária para a Reforma de 2026</p>
        <button onClick={onBuy} className="text-emerald-500 hover:text-emerald-400 transition text-sm underline">
          Já tenho conta — acessar a plataforma
        </button>
      </footer>
    </div>
  );
};
