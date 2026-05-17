// src/hooks/usePlan.ts
// Hook central de plano — use em qualquer componente que precise saber o plano do usuário

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export type PlanType = 'free' | 'mensal' | 'vitalicio';

export interface PlanInfo {
  plan:          PlanType;
  planExpiresAt: string | null;
  isPaid:        boolean;   // mensal ou vitalicio com validade ok
  isLoading:     boolean;
}

const DEFAULT: PlanInfo = {
  plan:          'free',
  planExpiresAt: null,
  isPaid:        false,
  isLoading:     true,
};

export function usePlan(): PlanInfo {
  const [info, setInfo] = useState<PlanInfo>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setInfo({ ...DEFAULT, isLoading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      const plan          = (profile?.plan ?? 'free') as PlanType;
      const planExpiresAt = profile?.plan_expires_at ?? null;

      // mensal expirado → trata como free
      const isActive =
        plan === 'vitalicio' ||
        (plan === 'mensal' && !!planExpiresAt && new Date(planExpiresAt) > new Date());

      setInfo({
        plan:          isActive ? plan : 'free',
        planExpiresAt,
        isPaid:        isActive,
        isLoading:     false,
      });
    };

    load();

    // Atualiza se sessão mudar (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return info;
}
