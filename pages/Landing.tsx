import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
  onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter, onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const [activePersona, setActivePersona] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const personas = [
    {
      emoji: '🏢',
      label: 'Empresário',
      title: 'Pare de descobrir o imposto na hora da multa',
      desc: 'Você toca o negócio e não tem tempo para ler 400 páginas de lei. Mas em 2027, quem não se preparou vai pagar mais imposto, perder caixa com o Split Payment e perder clientes B2B para concorrentes mais preparados.',
      points: [
        'Veja quanto vai pagar de imposto em 2027 antes que a conta chegue',
        'Simule o impacto do Split Payment no seu fluxo de caixa',
        'Descubra se vale migrar para o Simples Híbrido antes de set/2026',
        'Alertas automáticos de prazos críticos antes que virem multa',
      ],
    },
    {
      emoji: '📊',
      label: 'Contador',
      title: 'Seus clientes já estão perguntando. Você precisa de respostas certas agora.',
      desc: 'PIS/COFINS some. CBS chega. ICMS vai caindo. Responder errado para um cliente pode custar a credibilidade de anos de relacionamento. A reforma exige uma nova postura — de operacional para estratégico.',
      points: [
        'Interprete textos da LC 214/2025 em segundos com base legal citada',
        'Compare regimes tributários com cálculos precisos por cenário',
        'Guia estratégico: como migrar do operacional para o consultivo',
        'Legislação atualizada sem precisar pesquisar no Diário Oficial',
      ],
    },
    {
      emoji: '🎯',
      label: 'Consultor',
      title: 'Entregue diagnósticos em horas, não em dias',
      desc: 'Seus clientes pagam por precisão e estratégia. Você precisa de uma ferramenta que faça o trabalho pesado de legislação para você focar no que realmente gera valor: a recomendação e o relacionamento.',
      points: [
        'Analise cadeias de valor com 4 regimes tributários simultaneamente',
        'Identifique crédito CBS+IBS não aproveitado na cadeia do cliente',
        'Diagnóstico tributário completo em minutos, não horas',
        'Radar de inteligência para antecipar movimentos regulatórios',
      ],
    },
  ];

  const problems = [
    {
      bar: 'from-red-500 to-orange-500',
      num: '01',
      title: 'Você não sabe quanto vai pagar em 2027',
      desc: 'PIS/COFINS some. CBS de 8,8% chega. ICMS cai gradualmente. O IVA Dual de 26,5% parece alto, mas com créditos pode ser menor — ou muito maior. Depende do seu regime e do seu setor.',
    },
    {
      bar: 'from-amber-500 to-yellow-500',
      num: '02',
      title: 'O Split Payment vai bloquear parte do seu caixa',
      desc: 'A partir de jan/2027, o imposto é retido automaticamente no pagamento. A cada R$ 1.000 recebidos, até R$ 265 ficam retidos. Quem não provisionar capital de giro vai sentir na conta.',
    },
    {
      bar: 'from-purple-500 to-pink-500',
      num: '03',
      title: 'No Simples, você perde clientes B2B sem perceber',
      desc: 'No Simples convencional você gera apenas ~2,7% de crédito CBS+IBS. Seu concorrente no Lucro Presumido gera 26,5%. Clientes PJ vão preferir comprar de quem gera mais crédito.',
    },
    {
      bar: 'from-blue-500 to-cyan-500',
      num: '04',
      title: 'Prazos fatais já estão correndo',
      desc: 'Simples Híbrido: setembro/2026. ERP para NF-e: abril/2026. CBS plena: janeiro/2027. Perder qualquer desses prazos gera multa ou perda competitiva imediata — e irreversível.',
    },
  ];

  const features = [
    { icon: '📡', title: 'Radar de Inteligência', desc: 'Notícias e atualizações da Reforma em tempo real, filtradas por perfil e urgência.', tag: 'Ao vivo' },
    { icon: '🔗', title: 'Cadeia de Valor', desc: 'Simula créditos CBS+IBS, Split Payment e compara 4 regimes da sua cadeia completa.', tag: 'Cálculo exato' },
    { icon: '🤖', title: 'JaxAI — Consultor 24h', desc: 'Responde sobre IBS, CBS, ICMS, Split Payment e obrigações. Adaptado ao seu perfil.', tag: 'IA especialista' },
    { icon: '⚖️', title: 'Intérprete Legal', desc: 'Cole qualquer trecho da LC 214/2025 e receba explicação prática com base legal citada.', tag: 'Base legal citada' },
    { icon: '📋', title: 'Guia do Contador 4.0', desc: 'Roteiro do operacional ao consultivo: competências, fases e como monetizar a reforma.', tag: 'Para contadores' },
    { icon: '🗓️', title: 'Cronograma de Riscos', desc: 'Linha do tempo 2026–2033 com prazos fatais e riscos específicos de cada etapa.', tag: 'Alertas' },
  ];

  const timeline = [
    { period: 'Jan/2026', done: true, current: false, warn: false, title: 'Fase-teste CBS 0,9% + IBS 0,1% nas NF-e', risk: null },
    { period: 'Abr/2026', done: false, current: true, warn: false, title: 'Fim do período de tolerância ERP', risk: 'Multa por NF-e incorreta' },
    { period: 'Set/2026', done: false, current: false, warn: true, title: 'Prazo fatal: opção pelo Simples Híbrido', risk: 'Perda de competitividade B2B permanente' },
    { period: 'Jan/2027', done: false, current: false, warn: false, title: 'Extinção PIS/COFINS. CBS plena. Split Payment.', risk: 'Descasamento de caixa' },
    { period: '2029–2033', done: false, current: false, warn: false, title: 'ICMS e ISS extintos. IVA Dual pleno.', risk: null },
  ];

  return (
    <div className="min-h-screen bg-[#05090F] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#05090F]/95 backdrop-blur border-b border-white/5 shadow-lg' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white tracking-tight text-sm sm:text-base">
              TaxReform<span className="text-emerald-400">.ai Brasil</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onEnter} className="text-xs sm:text-sm text-gray-400 hover:text-white transition px-2 sm:px-3 py-1.5">
              Entrar
            </button>
            <button
              onClick={onGetStarted}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition"
            >
              Começar grátis →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-medium tracking-widest uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            Reforma 2026 em curso · EC 132/2023 · LC 214/2025
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.04] tracking-tight mb-5 sm:mb-6">
            <span className="text-white">A reforma tributária</span><br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">vai mudar tudo.</span><br />
            <span className="text-white">Você está pronto?</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            TaxReform.ai Brasil traduz 400 páginas de legislação em decisões práticas — para empresários, contadores e consultores que não podem errar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 sm:mb-16">
            <button
              onClick={onGetStarted}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm sm:text-base px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/20"
            >
              Começar grátis →
            </button>
            <button
              onClick={onEnter}
              className="bg-white/5 hover:bg-white/10 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-white/10 transition"
            >
              Já tenho conta
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 max-w-2xl mx-auto">
            {[
              { num: '26,5%', label: 'IVA Dual 2027' },
              { num: 'Set/26', label: 'Prazo Simples Híbrido' },
              { num: '7 anos', label: 'Transição até 2033' },
              { num: '5', label: 'Tributos extintos' },
            ].map((s, i) => (
              <div key={i} className="bg-[#05090F] px-3 sm:px-4 py-4 sm:py-5 text-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">{s.num}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-4">Para quem é</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Cada profissional enfrenta<br />
            <span className="text-gray-500">um risco diferente</span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mb-8 sm:mb-12">
            Veja como a plataforma resolve o problema específico do seu perfil.
          </p>

          <div className="flex gap-2 mb-6 sm:mb-8 flex-wrap">
            {personas.map((p, i) => (
              <button
                key={i}
                onClick={() => setActivePersona(i as 0 | 1 | 2)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition border ${
                  activePersona === i
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/3 border-white/8 text-gray-400 hover:text-white hover:border-white/15'
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-900/60 border border-white/8 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-3 sm:mb-4 leading-tight">
              {personas[activePersona].title}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl leading-relaxed">
              {personas[activePersona].desc}
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 sm:gap-3">
              {personas[activePersona].points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-300">
                  <span className="text-emerald-400 font-bold mt-0.5 flex-shrink-0">→</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PROBLEMAS ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-4">Por que você precisa disso</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-8 sm:mb-12">
            4 problemas que<br />
            <span className="text-gray-500">custam caro se você ignorar</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {problems.map((p, i) => (
              <div key={i} className="bg-gray-900/60 border border-white/8 rounded-xl sm:rounded-2xl p-5 sm:p-7 relative overflow-hidden group hover:border-white/15 transition">
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${p.bar}`} />
                <div className="text-4xl sm:text-5xl font-black text-white/4 leading-none mb-3 sm:mb-4 select-none">{p.num}</div>
                <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 leading-snug">{p.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-4">O que a plataforma faz</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-8 sm:mb-12">
            Inteligência tributária<br />
            <span className="text-gray-500">em 6 módulos</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-900/60 border border-white/8 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:border-emerald-500/20 transition">
                <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-3 sm:mb-4">{f.desc}</p>
                <span className="text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/15 text-emerald-400">
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-4">Cronograma</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-8 sm:mb-12">
            O relógio está correndo.<br />
            <span className="text-gray-500">Cada prazo perdido custa.</span>
          </h2>
          <div className="relative">
            <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-px bg-white/8" />
            <div className="space-y-6 sm:space-y-8">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-4 sm:gap-6 items-start">
                  <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black flex-shrink-0 z-10 border ${
                    t.done ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                    t.current ? 'bg-emerald-500 border-emerald-500 text-gray-950' :
                    t.warn ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                    'bg-white/3 border-white/10 text-gray-500'
                  }`}>
                    {t.done ? '✓' : t.current ? '!' : t.period.slice(0, 2)}
                  </div>
                  <div className="pt-1 sm:pt-1.5 pb-4 sm:pb-6">
                    <div className={`text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-0.5 sm:mb-1 ${
                      t.done ? 'text-gray-500' : t.current ? 'text-emerald-400' : t.warn ? 'text-amber-400' : 'text-gray-600'
                    }`}>{t.period}</div>
                    <h4 className="font-bold text-sm sm:text-base mb-0.5 sm:mb-1">{t.title}</h4>
                    {t.risk && (
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-red-500/8 border border-red-500/15 text-red-400">
                        ⚠ Risco: {t.risk}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-500/8 to-cyan-500/5 border border-emerald-500/15 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center">
          <div className="text-emerald-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-4 sm:mb-6">Comece agora</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-5">
            Não espere a reforma<br />chegar na sua porta
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed">
            Cada semana sem planejamento é mais uma semana perto de uma decisão errada de regime, preço ou caixa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm sm:text-base px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/20"
            >
              Começar grátis →
            </button>
            <button
              onClick={onEnter}
              className="bg-white/5 hover:bg-white/10 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-white/10 transition"
            >
              Já tenho conta
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-6 sm:py-8 px-4 sm:px-6 text-center">
        <p className="text-[10px] sm:text-xs text-gray-600">
          TaxReform.ai Brasil — Powered by ARG4 Negócios e Inteligência Empresarial<br />
          Base legal: EC 132/2023 · LC 214/2025 · PLP 68/2024
        </p>
      </footer>
    </div>
  );
};
