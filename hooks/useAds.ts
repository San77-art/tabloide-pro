import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSubscription } from './useSubscription';
import { PlanId } from '../types';

const CACHE_KEY = '@tab/ads/cache';
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface Ad {
  id: string;
  brandName: string;
  logoUrl?: string;
  imageUrl?: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  category?: string;
  targetPlans: PlanId[];
  isActive: boolean;
  priority: number;
}

interface AdsCache {
  ads: Ad[];
  cachedAt: number;
}

async function fetchAdsFromFirestore(): Promise<Ad[]> {
  const q = query(collection(db, 'ads'), where('isActive', '==', true), orderBy('priority', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ad);
}

// Busca anúncios ativos do Firestore ordenados por priority, filtrados pelo plano do lojista.
// Cacheia localmente por 30 minutos para não sobrecarregar o Firestore em toda abertura da aba.
export function useAds() {
  const { plan } = useSubscription();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached: AdsCache = JSON.parse(raw);
          if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
            if (!cancelled) setAds(cached.ads);
            if (!cancelled) setLoading(false);
            return;
          }
        }
      } catch {
        // cache local indisponível — segue para buscar do Firestore
      }

      try {
        const fresh = await fetchAdsFromFirestore();
        if (!cancelled) setAds(fresh);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ads: fresh, cachedAt: Date.now() } as AdsCache));
      } catch {
        // sem conexão e sem cache válido — mantém lista vazia
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const adsForPlan = ads.filter((ad) => ad.targetPlans.includes(plan));

  return { ads: adsForPlan, loading };
}
