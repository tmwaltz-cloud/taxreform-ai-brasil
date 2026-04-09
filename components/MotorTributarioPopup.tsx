import { useState, useEffect } from "react";

interface MotorTributarioPopupProps {
  userPhone?: string;  // WhatsApp do usuário logado (do perfil Supabase)
  onClose: () => void;
  autoShowAfterMs?: number; // ms para aparecer automaticamente (padrão: 3 min)
}

// ─── Componente principal ──────────────────────────────────────────────────
export function MotorTributarioPopup({ userPhone, onClose, autoShowAfterMs = 180000 }: MotorTributarioPopupProps) {
  const [visible, setVisible] = useState(false);
  const [formStep, setFormStep] = useState<'cta' | 'form' | 'success'>('cta');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(userPhone || '');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Aparece automaticamente após X minutos
  useEffect(() => {
    // Não mostrar se já foi dispensado antes (sessão atual)
    const dismissed = sessionStorage.getItem('motor_popup_dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), autoShowAfterMs);
    return () => clearTimeout(timer);
  }, [autoShowAfterMs]);

  const handleClose = () => {
    sessionStorage.setItem('motor_popup_dismissed', '1');
    setVisible(false);
    onClose();
  };

  const handleWhatsApp = () => {
    const whatsappNumber = '5515996648895'; // seu WhatsApp
    const msg = encodeURIComponent(
      `Olá, Rogério! Vi o TaxReform.ai Brasil e quero saber mais sobre o Motor Tributário 5.0 — análise produto por produto no meu CNPJ. Pode me dar mais detalhes?`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
    setFormStep('success');
  };

  const handleFormSubmit = async () => {
    if (!name || !phone) return;
    setSubmitting(true);

    // Envia para WhatsApp automaticamente com os dados preenchidos
    const whatsappNumber = '5515996648895';
    const msg = encodeURIComponent(
      `🚀 *Interesse: Motor Tributário 5.0*\n\nNome: ${name}\nTelefone: ${phone}\nEmail: ${email || 'não informado'}\n\nSolicitou acesso antecipado pelo TaxReform.ai Brasil.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');

    setSubmitting(false);
    setFormStep('success');
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #0a0a0f 0%, #0f1a0f 50%, #0a0f0a 100%)',
          border: '1px solid rgba(34,197,94,0.3)',
          boxShadow: '0 0 60px rgba(34,197,94,0.15), 0 25px 50px rgba(0,0,0,0.8)',
        }}
      >
        {/* Barra superior dourada */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #f59e0b, #10b981, transparent)' }} />

        {/* Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full whitespace-nowrap"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}>
            ⚡ Apenas para os primeiros
          </span>
        </div>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          ✕
        </button>

        <div className="px-8 pt-14 pb-8">
          {formStep === 'cta' && (
            <>
              {/* Ícone */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(245,158,11,0.2))', border: '1px solid rgba(16,185,129,0.3)' }}>
                  ⚙️
                </div>
              </div>

              {/* Título */}
              <h2 className="text-center font-bold text-white mb-1" style={{ fontSize: '22px', lineHeight: '1.3' }}>
                Motor Tributário 5.0
              </h2>
              <p className="text-center text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: '#10b981' }}>
                O próximo nível do TaxReform.ai
              </p>

              {/* Texto principal */}
              <p className="text-center leading-relaxed mb-6" style={{ color: '#94a3b8', fontSize: '14px' }}>
                O TaxReform.ai Brasil já mapeia a Reforma para o seu setor.
                <br /><br />
                <span className="font-semibold" style={{ color: '#e2e8f0' }}>
                  O próximo passo analisa o impacto real — produto por produto, nota por nota, no seu CNPJ.
                </span>
              </p>

              {/* Bullets */}
              <div className="space-y-2 mb-7">
                {[
                  'Análise por CNPJ — dados reais da sua empresa',
                  'Impacto produto a produto na cadeia fiscal',
                  'Simulação nota por nota com EFD/SPED',
                  'Diagnóstico completo pré-2027',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm" style={{ color: '#cbd5e1' }}>
                    <span style={{ color: '#10b981', marginTop: '1px', flexShrink: 0 }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <button
                onClick={() => setFormStep('form')}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all mb-3"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                }}
              >
                Eu quero — Garantir acesso antecipado →
              </button>

              <button
                onClick={handleClose}
                className="w-full py-2 text-xs transition-colors"
                style={{ color: '#475569' }}
              >
                Agora não, talvez depois
              </button>
            </>
          )}

          {formStep === 'form' && (
            <>
              <h2 className="text-center font-bold text-white mb-1" style={{ fontSize: '20px' }}>
                Garantir meu acesso antecipado
              </h2>
              <p className="text-center text-sm mb-6" style={{ color: '#64748b' }}>
                Sem compromisso. Entraremos em contato para apresentar.
              </p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>Nome completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:ring-1"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', focusRingColor: '#10b981' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>WhatsApp *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(15) 99999-9999"
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>E-mail (opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              <button
                onClick={handleFormSubmit}
                disabled={submitting || !name || !phone}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all mb-3 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                }}
              >
                {submitting ? 'Enviando...' : 'Enviar pelo WhatsApp →'}
              </button>

              <button
                onClick={() => setFormStep('cta')}
                className="w-full py-2 text-xs transition-colors"
                style={{ color: '#475569' }}
              >
                ← Voltar
              </button>
            </>
          )}

          {formStep === 'success' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-xl font-bold text-white mb-2">Interesse registrado!</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                Você será um dos primeiros a ter acesso ao Motor Tributário 5.0.
                <br /><br />
                Entraremos em contato pelo WhatsApp em breve.
              </p>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}
              >
                Continuar usando a plataforma
              </button>
            </div>
          )}
        </div>

        {/* Barra inferior */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)' }} />
        <div className="px-8 py-3 flex items-center justify-center gap-2">
          <span style={{ color: '#1e293b', fontSize: '11px' }}>🔒</span>
          <span className="text-xs" style={{ color: '#334155' }}>Sem spam · Sem compromisso · Cancele quando quiser</span>
        </div>
      </div>
    </div>
  );
}

// ─── Hook para controlar o popup no App.tsx ────────────────────────────────
// Uso: const { showMotorPopup, setShowMotorPopup } = useMotorPopup();
export function useMotorPopup(delayMs = 180000) {
  const [showMotorPopup, setShowMotorPopup] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('motor_popup_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setShowMotorPopup(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return { showMotorPopup, setShowMotorPopup };
}
