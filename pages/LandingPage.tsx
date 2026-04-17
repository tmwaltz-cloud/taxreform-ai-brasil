import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onLogin }) => {
  const [activePersona, setActivePersona] = useState<'empresario' | 'contador' | 'consultor'>('empresario');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const personas = {
    empresario: {
      icon: '🏢',
      label: 'Empresário',
      color: 'emerald',
      title: 'Você precisa saber quanto vai pagar — antes que a conta chegue',
      description: 'Não tem tempo para ler 400 páginas de lei complementar. Precisa saber se vai pagar mais imposto, quando mudar de regime e como proteger sua margem.',
      benefits: [
        'Descubra se seu imposto vai aumentar ou diminuir em 2027',
        'Simule o impacto do Split Payment no seu fluxo de caixa',
        'Saiba se vale migrar para o Simples Híbrido antes de set/2026',
        'Alertas automáticos sobre prazos críticos antes que virem multa',
        'Compare cenários de preço com a nova carga tributária',
      ],
    },
    contador: {
      icon: '📊',
      label: 'Contador',
      color: 'blue',
      title: 'Seus clientes já estão perguntando. Você precisa de respostas certas agora',
      description: 'A reforma muda tudo o que você conhecia de PIS/COFINS, ICMS e ISS. Responder errado um cliente custará a sua credibilidade — ou um processo.',
      benefits: [
        'Interprete textos da LC 214/2025 com base legal citada automaticamente',
        'Compare regimes tributários com simulações numéricas precisas',
        'Guia estratégico para migrar do operacional ao consultivo',
        'Legislação atualizada sem pesquisar no Diário Oficial diariamente',
        'Modelos de análise prontos para apresentar ao cliente',
      ],
    },
    consultor: {
      icon: '🎯',
      label: 'Consultor',
      color: 'purple',
      title: 'Amplie sua capacidade analítica sem aumentar o tempo de entrega',
      description: 'Seus clientes pagam por diagnósticos precisos e estratégia. Você precisa de uma ferramenta que faça o trabalho pesado de legislação para você focar no que gera valor.',
      benefits: [
        'Analise cadeias de valor completas com 4 regimes simultaneamente',
        'Identifique crédito CBS+IBS não aproveitado na cadeia do cliente',
        'Diagnóstico tributário completo em minutos, não horas',
        'Radar de inteligência para antecipar movimentos regulatórios',
        'Relatórios estruturados prontos para apresentação executiva',
      ],
    },
  };

  const problems = [
    {
      num: '01',
      color: 'from-red-500 to-orange-500',
      title: 'Você não sabe quanto vai pagar de imposto em 2027',
      desc: 'PIS/COFINS some. CBS de 8,8% chega. ICMS começa a cair. O IVA Dual de 26,5% parece alto, mas com créditos pode ser menor que hoje — ou muito maior. Depende do seu regime e setor.',
    },
    {
      num: '02',
      color: 'from-amber-500 to-orange-500',
      title: 'O Split Payment vai mudar seu caixa em janeiro/2027',
      desc: 'O imposto será retido automaticamente no pagamento. A cada R$ 1.000 recebidos, até R$ 265 ficam retidos. Quem não provisionar capital de giro agora quebrará o caixa.',
    },
    {
      num: '03',
      color: 'from-purple-500 to-pink-500',
      title: 'Empresas no Simples perdem clientes B2B sem perceber',
      desc: 'No Simples convencional você gera apenas 2,7% de crédito CBS+IBS. Seu concorrente no Lucro Presumido gera 26,5%. Clientes PJ vão preferir comprar de quem gera mais crédito.',
    },
    {
      num: '04',
      color: 'from-blue-500 to-cyan-500',
      title: 'Os prazos críticos já estão correndo — alguns passaram',
      desc: 'Simples Híbrido: setembro/2026. ERP para NF-e: abril/2026. CBS plena: janeiro/2027. Quem perde o prazo não pode voltar atrás — as perdas competitivas são imediatas e permanentes.',
    },
  ];

  const features = [
    { icon: '📡', title: 'Radar de Inteligência', desc: 'Monitora atualizações da Reforma em tempo real — LC 214/2025, CGIBS, Simples Nacional — filtradas por perfil e urgência.', tag: 'Ao vivo' },
    { icon: '🔗', title: 'Cadeia de Valor', desc: 'Simula o impacto tributário Fornecedor → Você → Cliente. Calcula créditos CBS+IBS, Split Payment e compara 4 regimes com dados reais.', tag: 'Cálculo exato' },
    { icon: '🤖', title: 'JaxAI — Consultor 24h', desc: 'Consultor tributário com IA que responde sobre IBS, CBS, ICMS, Split Payment e obrigações acessórias. Adaptado ao seu perfil profissional.', tag: 'IA especialista' },
    { icon: '⚖️', title: 'Intérprete Legal', desc: 'Cole qualquer trecho da LC 214/2025, EC 132/2023 ou PLP 68/2024 e receba explicação prática com aplicação direta ao seu negócio.', tag: 'Base legal citada' },
    { icon: '📋', title: 'Guia do Contador 4.0', desc: 'Roteiro estratégico para contadores navegarem a transição — do operacional ao consultivo. Competências, fases e como monetizar a reforma.', tag: 'Para contadores' },
    { icon: '🗓️', title: 'Cronograma de Riscos', desc: 'Linha do tempo de 2026 a 2033 com marcos críticos, prazos fatais e os riscos específicos de cada etapa — atualizada conforme a legislação evolui.', tag: 'Alertas automáticos' },
  ];

  const timeline = [
    { period: 'Jan/2026', status: 'done', title: 'Fase-teste CBS 0,9% + IBS 0,1% nas NF-e', desc: 'Obrigatório destacar CBS e IBS na nota fiscal.', risk: null },
    { period: 'Abr/2026', status: 'current', title: 'Fim do período de tolerância ERP', desc: 'Sistemas devem estar adaptados para o destaque de IBS/CBS.', risk: 'Multa por NF-e incorreta' },
    { period: 'Set/2026', status: 'warning', title: 'Prazo fatal: opção pelo Simples Híbrido', desc: 'Último momento para empresas do Simples optarem pelo regime que gera crédito integral B2B.', risk: 'Perda de competitividade permanente' },
    { period: 'Jan/2027', status: 'future', title: 'Extinção do PIS/COFINS. CBS plena (8,8%)', desc: 'Split Payment entra em vigor. Fluxo de caixa muda para todas as empresas.', risk: 'Descasamento de caixa' },
    { period: '2029–2033', status: 'future', title: 'ICMS e ISS extintos. IVA Dual pleno.', desc: 'Sistema completo CBS+IBS em vigor. Transição encerrada.', risk: null },
  ];

  const p = personas[activePersona];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur border-b border-white/5' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xl">⚡</span>
            <span className="font-bold text-white tracking-tight">TaxReform<span className="text-emerald-400">.ai</span> Brasil</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5">
              Entrar
            </button>
            <button onClick={onEnter} className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm px-4 py-2 rounded-lg transition">
              Começar grátis →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-widest uppercase px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Plataforma ativa · Reforma 2026 em curso
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.02] tracking-tight mb-6">
            <span className="text-white">A reforma tributária</span><br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">vai mudar tudo.</span><br />
            <span className="text-white">Você está pronto?</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            TaxReform.ai Brasil traduz 400 páginas de legislação em decisões práticas — para empresários, contadores e consultores que não podem errar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <button onClick={onEnter} className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-base px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/20">
              Começar agora — é grátis →
            </button>
            <button onClick={onLogin} className="bg-white/5 hover:bg-white/10 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/10 transition">
              Já tenho conta
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5 max-w-2xl mx-auto">
            {[
              { num: '26,5%', label: 'IVA Dual a partir de 2027' },
              { num: 'Set/26', label: 'Prazo Simples Híbrido' },
              { num: '7 anos', label: 'de transição até 2033' },
              { num: '5', label: 'tributos extintos' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-950 px-4 py-5 text-center">
                <div className="text-2xl font-black text-emerald-400">{s.num}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">Para quem é</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Cada profissional enfrenta<br />
            <span className="text-gray-500">um risco diferente</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mb-12">
            A reforma afeta empresários, contadores e consultores de formas distintas. Veja como a plataforma resolve o seu problema específico.
          </p>

          {/* Persona tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {(['empresario', 'contador', 'consultor'] as const).map(key => (
              <button
                key={key}
                onClick={() => setActivePersona(key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition border ${
                  activePersona === key
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/3 border-white/8 text-gray-400 hover:text-white hover:border-white/15'
                }`}
              >
                {personas[key].icon} {personas[key].label}
              </button>
            ))}
          </div>

          {/* Persona content */}
          <div className="bg-gray-900/60 border border-white/8 rounded-2xl p-8 md:p-10">
            <h3 className="text-2xl md:text-3xl font-black mb-4 leading-tight">{p.title}</h3>
            <p className="text-gray-400 text-base mb-8 max-w-2xl leading-relaxed">{p.description}</p>
            <ul className="grid md:grid-cols-2 gap-3">
              {p.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-emerald-400 font-bold mt-0.5 flex-shrink-0">→</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PROBLEMAS ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">Por que você precisa disso</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            4 problemas que<br />
            <span className="text-gray-500">custam caro se você ignorar</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-12">
            {problems.map((p, i) => (
              <div key={i} className="bg-gray-900/60 border border-white/8 rounded-2xl p-7 relative overflow-hidden group hover:border-white/15 transition">
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${p.color}`} />
                <div className="text-5xl font-black text-white/4 leading-none mb-4 select-none">{p.num}</div>
                <h3 className="text-lg font-bold mb-3 leading-snug">{p.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">O que a plataforma faz</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Inteligência tributária<br />
            <span className="text-gray-500">em 6 módulos</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-900/60 border border-white/8 rounded-2xl p-6 hover:border-emerald-500/20 transition group">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center text-xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{f.desc}</p>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/15 text-emerald-400">
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">Cronograma</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            O relógio está correndo.<br />
            <span className="text-gray-500">Cada prazo perdido custa.</span>
          </h2>
          <div className="mt-12 relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-white/8" />
            <div className="space-y-8">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 z-10 border ${
                    t.status === 'done' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                    t.status === 'current' ? 'bg-emerald-500 border-emerald-500 text-gray-950' :
                    t.status === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                    'bg-white/3 border-white/10 text-gray-500'
                  }`}>
                    {t.status === 'done' ? '✓' : t.status === 'current' ? '!' : t.period.slice(0, 2)}
                  </div>
                  <div className="pt-1.5 pb-6">
                    <div className={`text-xs font-semibold tracking-widest uppercase mb-1 ${
                      t.status === 'done' ? 'text-gray-500' :
                      t.status === 'current' ? 'text-emerald-400' :
                      t.status === 'warning' ? 'text-amber-400' : 'text-gray-600'
                    }`}>{t.period}</div>
                    <h4 className="font-bold text-base mb-1">{t.title}</h4>
                    <p className="text-sm text-gray-400">{t.desc}</p>
                    {t.risk && (
                      <div className="inline-flex items-center gap-2 mt-2 text-xs px-3 py-1.5 rounded-md bg-red-500/8 border border-red-500/15 text-red-400">
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

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-500/8 to-cyan-500/5 border border-emerald-500/15 rounded-3xl p-12 md:p-16 text-center">
          <div className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-6">Comece agora</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
            Não espere a reforma<br />chegar na sua porta
          </h2>
          <p className="text-gray-400 text-lg max-w-md mx-auto mb-10 leading-relaxed">
            Cada semana sem planejamento é uma semana mais próxima de tomar uma decisão errada — de regime, de preço, de caixa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onEnter} className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-base px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/20">
              Entrar na plataforma →
            </button>
            <button onClick={onLogin} className="bg-white/5 hover:bg-white/10 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/10 transition">
              Já tenho conta
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-gray-600">
          TaxReform.ai Brasil — Powered by ARG4 Negócios e Inteligência Empresarial<br />
          Base legal: EC 132/2023 · LC 214/2025 · PLP 68/2024
        </p>
      </footer>

    </div>
  );
};
