import { auth } from './firebase';

// A Public Key é a única credencial do Mercado Pago segura para o bundle do app.
// O Access Token fica só no backend/ (Express no Railway) e nunca chega aqui.
export const MERCADOPAGO_PUBLIC_KEY = process.env.EXPO_PUBLIC_MP_PUBLIC_KEY ?? '';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export type BillingCycle = 'monthly' | 'yearly';
export type SubscribablePlanId = 'pro' | 'business';
export type MpPlanKey = 'pro_monthly' | 'pro_yearly' | 'business_monthly' | 'business_yearly';

export interface MpPlanOption {
  key: MpPlanKey;
  planId: SubscribablePlanId;
  cycle: BillingCycle;
  reason: string;
  amount: number;
  monthlyEquivalent?: number;
  discountLabel?: string;
}

// Espelha backend/mercadopago.js (PLAN_DEFINITIONS) — mantenha os dois em sincronia.
export const MP_PLANS: Record<MpPlanKey, MpPlanOption> = {
  pro_monthly: { key: 'pro_monthly', planId: 'pro', cycle: 'monthly', reason: 'Tab Pro Mensal', amount: 69.9 },
  pro_yearly: {
    key: 'pro_yearly',
    planId: 'pro',
    cycle: 'yearly',
    reason: 'Tab Pro Anual',
    amount: 599.0,
    monthlyEquivalent: 49.9,
    discountLabel: '29% OFF',
  },
  business_monthly: { key: 'business_monthly', planId: 'business', cycle: 'monthly', reason: 'Tab Business Mensal', amount: 149.9 },
  business_yearly: {
    key: 'business_yearly',
    planId: 'business',
    cycle: 'yearly',
    reason: 'Tab Business Anual',
    amount: 1299.0,
    monthlyEquivalent: 108.25,
    discountLabel: '28% OFF',
  },
};

export function getMpPlanKey(planId: SubscribablePlanId, cycle: BillingCycle): MpPlanKey {
  return `${planId}_${cycle}` as MpPlanKey;
}

export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// Chama o backend próprio (Railway) autenticado com o ID token do Firebase do usuário logado —
// o backend verifica esse token com o Admin SDK antes de aceitar a requisição.
async function authorizedFetch(path: string, options: RequestInit = {}): Promise<any> {
  if (!BACKEND_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL não configurada.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Você precisa estar logado.');
  }
  const token = await user.getIdToken();

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Falha na requisição (${res.status}).`);
  }
  return json;
}

interface CreateSubscriptionResult {
  initPoint: string;
  preapprovalId: string;
}

// Cria (via backend) a assinatura (preapproval) no Mercado Pago para o plano escolhido e
// retorna o init_point para o app abrir no navegador via Linking.openURL.
export async function createSubscription(
  _uid: string,
  planId: MpPlanKey,
  payerEmail: string,
): Promise<CreateSubscriptionResult> {
  return authorizedFetch('/create-subscription', {
    method: 'POST',
    body: JSON.stringify({ planKey: planId, payerEmail }),
  });
}

// Consulta o status atual da assinatura direto no Mercado Pago (checagem manual/pontual;
// a atualização "oficial" do plano do usuário acontece via webhook em backend/index.js).
export async function getSubscriptionStatus(subscriptionId: string): Promise<string> {
  const result = await authorizedFetch(`/subscription-status/${subscriptionId}`, { method: 'GET' });
  return result.status;
}
