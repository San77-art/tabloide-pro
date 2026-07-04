import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useProducts } from './useProducts';
import { PlanId, Subscription } from '../types';

export const PLAN_LIMITS: Record<PlanId, number> = {
  free: 20,
  pro: 200,
  business: Infinity,
  enterprise: Infinity,
};

export interface PlanInfo {
  label: string;
  price: string;
  color: string;
  productLimit: number;
  tabloidLimit: number;
  imageBankLimit: number;
  dollarAlerts: boolean;
  aiSuggestions: boolean;
  watermark: boolean;
  features: string[];
}

export const PLAN_INFO: Record<PlanId, PlanInfo> = {
  free: {
    label: 'Free',
    price: 'Grátis',
    color: '#64748B',
    productLimit: 20,
    tabloidLimit: 3,
    imageBankLimit: 10,
    dollarAlerts: false,
    aiSuggestions: false,
    watermark: true,
    features: [
      'Até 20 produtos cadastrados',
      'Até 3 tabloides por mês',
      '10 fotos do banco de imagens',
      'Cotação do dólar (visualização)',
      "Exportar com marca d'água Tab",
      '❌ Geração de fundo com IA',
    ],
  },
  pro: {
    label: 'Pro',
    price: 'R$ 69,90/mês',
    color: '#2563EB',
    productLimit: 200,
    tabloidLimit: 30,
    imageBankLimit: 50,
    dollarAlerts: true,
    aiSuggestions: true,
    watermark: false,
    features: [
      'Até 200 produtos cadastrados',
      'Até 30 tabloides por mês',
      '50 fotos do banco de imagens',
      'Alertas manuais de variação do dólar',
      'IA para sugestões de título e produtos',
      "Exportar sem marca d'água",
      '✅ 10 fundos com IA por mês',
      'Suporte por email prioritário',
    ],
  },
  business: {
    label: 'Business',
    price: 'R$ 149,90/mês',
    color: '#7C3AED',
    productLimit: Infinity,
    tabloidLimit: Infinity,
    imageBankLimit: Infinity,
    dollarAlerts: true,
    aiSuggestions: true,
    watermark: false,
    features: [
      'Produtos ilimitados',
      'Tabloides ilimitados',
      'Banco de imagens completo (97+ produtos)',
      'Alertas automáticos de variação do dólar',
      'IA para sugestões de título e produtos',
      "Exportar sem marca d'água",
      '✅ Fundos com IA ilimitados',
      'Suporte via WhatsApp direto',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Sob consulta',
    color: '#0F172A',
    productLimit: Infinity,
    tabloidLimit: Infinity,
    imageBankLimit: Infinity,
    dollarAlerts: true,
    aiSuggestions: true,
    watermark: false,
    features: [
      'Tudo do Business',
      'Múltiplas lojas na mesma conta',
      'Prompt de IA personalizado pelo seu designer',
      'Integrações customizadas',
      'Gerente de conta dedicado',
      'SLA garantido',
      'Treinamento da equipe',
    ],
  },
};

export function useSubscription() {
  const uid = auth.currentUser?.uid;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { allProducts } = useProducts();

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'subscriptions', uid), (snap) => {
      if (snap.exists()) {
        setSubscription({ uid, ...snap.data() } as Subscription);
      } else {
        const fallback: Omit<Subscription, 'uid'> = { plan: 'free', status: 'active', productLimit: PLAN_LIMITS.free };
        setSubscription({ uid, ...fallback });
        setDoc(doc(db, 'subscriptions', uid), { ...fallback, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(() => {});
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const plan: PlanId = subscription?.plan ?? 'free';
  const planDetails = PLAN_INFO[plan];
  const productLimit = PLAN_LIMITS[plan];
  const productCount = allProducts.length;
  const limitReached = Number.isFinite(productLimit) && productCount >= productLimit;
  const canUseAutoAlerts = plan !== 'free';

  return {
    subscription,
    loading,
    plan,
    productLimit,
    productCount,
    limitReached,
    canUseAutoAlerts,
    planInfo: PLAN_INFO,
    tabloidLimit: planDetails.tabloidLimit,
    imageBankLimit: planDetails.imageBankLimit,
    watermark: planDetails.watermark,
    aiSuggestions: planDetails.aiSuggestions,
  };
}
