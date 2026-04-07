import React from 'react';
import { Check, Shield, Zap, Star, ArrowLeft, Infinity, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface PricingProps {
  onNavigate: (view: any) => void;
  userData?: {
    name: string;
    phone: string;
    role: UserRole;
  } | null;
}

export const Pricing: React.FC<PricingProps> = ({ onNavigate, userData }) => {
  const whatsappNumber = "5515996648895";

  // ─── SUBSTITUA AQUI OS LINKS DA KIWIFY QUANDO CRIAR OS PRODUTOS ───
  const kiwifyLinks = {
    basico:     'https://pay.kiwify.com.br/SEU-LINK-BASICO',     // R$47 lifetime
    pro:        'https://pay.kiwify.com.br/SEU-LINK-PRO',        // R$77 lifetime
    enterprise: 'https://pay.kiwify.com.br/SEU-LINK-ENTERPRISE', // R$97 lifetime
  };
  // ─────────────────────────────────────────────────────────────────

  const handlePlanSelection = (planName: string, kiwifyUrl: string) => {
    // Se o link da Kiwify ainda não foi configurado, redireciona para WhatsApp
    if (kiwifyUrl.includes('SEU-LINK')) {
      const name = userData?.name || 'Cliente';
      const phone = userData?.phone || 'Não informado';
      const role = userData?.role || 'Não informado';
      const text = `Olá! Tenho interesse no plano ${planName} do TaxReform.ai Brasil.\n\nNome: ${name}\nTelefone: ${phone}\nPerfil: ${role}\nPlano: ${planName}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      // Redireciona direto para o checkout da Kiwify
      window.open(kiwifyUrl, '_blank');
    }
  };

  const plans = [
    {
      name: 'Básico',
      price: '47',
      originalPrice: '97',
      kiwifyUrl: kiwifyLinks.basico,
      color: 'from-slate-600 to-slate-700',
      iconBg: 'bg-slate-600',
      features: [
        { text: 'Radar de Inteligência em tempo real', included: true },
        { text: 'Dashboard com cronograma 2026-2033', included: true },
        { text: 'Legislação & Radar (CBS, IBS, IS)', included: true },
        { text: 'Simulador de Cadeia de Valor', included: false },
        { text: 'Consultor IA (JaxAI)', included: false },
        { text: 'Intérprete Legislativo', included: false },
        { text: 'Suporte prioritário', included: false },
      ],
      icon: Shield,
      cta: 'Começar Agora',
      tag: null,
    },
    {
      name: 'Pro',
      price: '77',
      originalPrice: '197',
      kiwifyUrl: kiwifyLinks.pro,
      color: 'from-brand-600 to-brand-700',
      iconBg: 'bg-brand-600',
      features: [
        { text: 'Radar de Inteligência em tempo real', included: true },
        { text: 'Dashboard com cronograma 2026-2033', included: true },
        { text: 'Legislação & Radar (CBS, IBS, IS)', included: true },
        { text: 'Simulador de Cadeia de Valor', included: true },
        { text: 'Consultor IA (JaxAI)', included: true },
        { text: 'Intérprete Legislativo', included: true },
        { text: 'Suporte prioritário', included: false },
      ],
      icon: Zap,
      cta: 'Quero o Pro',
      tag: 'Mais Popular',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '97',
      originalPrice: '297',
      kiwifyUrl: kiwifyLinks.enterprise,
      color: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-500',
      features: [
        { text: 'Radar de Inteligência em tempo real', included: true },
        { text: 'Dashboard com cronograma 2026-2033', included: true },
        { text: 'Legislação & Radar (CBS, IBS, IS)', included: true },
        { text: 'Simulador de Cadeia de Valor', included: true },
        { text: 'Consultor IA (JaxAI)', included: true },
        { text: 'Intérprete Legislativo', included: true },
        { text: 'Suporte prioritário + Atualizações vitalícias', included: true },
      ],
      icon: Star,
      cta: 'Acesso Total',
      tag: 'Melhor Custo-Benefício',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <button 
            onClick={() => onNavigate('login')} 
            className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </button>

          {/* Lifetime badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
            <Infinity className="w-4 h-4" />
            Acesso Vitalício — Pague uma vez, use para sempre
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Escolha seu plano
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Domine a Reforma Tributária 2026 com inteligência artificial. 
            Sem mensalidade. Sem surpresas.
          </p>

          {/* Urgência */}
          <div className="mt-6 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg">
            ⚠️ Preço de lançamento — válido por tempo limitado
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border ${
                plan.popular 
                  ? 'border-brand-500 bg-[#151e32] shadow-2xl shadow-brand-900/30 scale-105' 
                  : 'border-slate-700 bg-[#111827]'
              } flex flex-col overflow-hidden`}
            >
              {/* Tag */}
              {plan.tag && (
                <div className={`text-center text-xs font-bold py-2 uppercase tracking-wider text-white ${
                  plan.popular ? 'bg-brand-600' : 'bg-amber-500'
                }`}>
                  {plan.tag}
                </div>
              )}

              <div className="p-8 flex-1">
                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
                    <plan.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 text-sm line-through">R${plan.originalPrice}</span>
                    <span className="text-xs text-green-400 font-bold">
                      {Math.round((1 - parseInt(plan.price) / parseInt(plan.originalPrice)) * 100)}% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline mt-1">
                    <span className="text-slate-400 text-lg">R$</span>
                    <span className="text-5xl font-extrabold text-white mx-1">{plan.price}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Infinity className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400 text-xs font-bold">Pagamento único — acesso vitalício</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        feature.included 
                          ? 'bg-green-500/20' 
                          : 'bg-slate-700'
                      }`}>
                        {feature.included 
                          ? <Check className="w-3 h-3 text-green-400" />
                          : <span className="w-2 h-0.5 bg-slate-600 rounded"></span>
                        }
                      </div>
                      <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-6 border-t border-slate-700/50">
                <button
                  onClick={() => handlePlanSelection(plan.name, plan.kiwifyUrl)}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                    plan.popular 
                      ? 'bg-brand-600 hover:bg-brand-500 shadow-brand-900/40' 
                      : plan.name === 'Enterprise'
                      ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/40'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {plan.cta}
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-500">Pagamento 100% seguro via Kiwify</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Garantia */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-4 rounded-2xl">
            <Shield className="w-6 h-6 flex-shrink-0" />
            <div className="text-left">
              <div className="font-bold text-sm">Garantia de 7 dias</div>
              <div className="text-xs text-green-500/80">Não gostou? Devolvemos 100% do seu dinheiro, sem perguntas.</div>
            </div>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-sm font-bold text-white">Acesso imediato</div>
            <div className="text-xs text-slate-400 mt-1">Libera na hora após o pagamento</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl mb-2">♾️</div>
            <div className="text-sm font-bold text-white">Sem mensalidade</div>
            <div className="text-xs text-slate-400 mt-1">Pague uma vez e use sempre</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl mb-2">📲</div>
            <div className="text-sm font-bold text-white">Suporte via WhatsApp</div>
            <div className="text-xs text-slate-400 mt-1">Time disponível para te ajudar</div>
          </div>
        </div>

        {/* Já pagou */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 mb-2 text-sm">Já realizou o pagamento?</p>
          <button
            onClick={() => onNavigate('login')}
            className="text-brand-400 font-semibold hover:text-brand-300 hover:underline text-sm transition"
          >
            Clique aqui para acessar a plataforma
          </button>
        </div>

      </div>
    </div>
  );
};
