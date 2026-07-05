import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { AppCurrency } from '../types';

export type MarketSegment =
  | 'Supermercado' | 'Perfumaria' | 'Eletrônicos' | 'Roupas' | 'Calçados'
  | 'Importados' | 'Farmácia' | 'Papelaria' | 'Brinquedos' | 'Outro';

export type MarketCountry = 'Brasil' | 'Paraguai' | 'Outro';

export interface Market {
  uid: string;
  name: string;
  segment?: MarketSegment;
  currency?: AppCurrency;
  city?: string;
  country?: MarketCountry;
  logoUrl?: string;
  plan: 'free' | 'pro';
  colors: { primary: string; secondary: string };
  createdAt?: unknown;
}

export interface CreateMarketInput {
  name: string;
  segment: MarketSegment;
  currency: AppCurrency;
  city: string;
  country: MarketCountry;
  logoUri?: string | null;
}

export function useMarket() {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const unsub = onSnapshot(doc(db, 'markets', uid), (snap) => {
      setMarket(snap.exists() ? ({ uid, ...snap.data() } as Market) : null);
      setLoading(false);
    });
    return unsub;
  }, [auth.currentUser?.uid]);

  const createMarket = async (input: CreateMarketInput) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');

    const logoUrl = input.logoUri
      ? await uploadImageToCloudinary(input.logoUri, `logos/${uid}`)
      : undefined;

    await setDoc(doc(db, 'markets', uid), {
      name: input.name,
      segment: input.segment,
      currency: input.currency,
      city: input.city,
      country: input.country,
      ...(logoUrl ? { logoUrl } : {}),
      plan: 'free',
      colors: { primary: '#2563EB', secondary: '#7C3AED' },
      createdAt: serverTimestamp(),
    });
  };

  const updateMarket = async (data: Partial<Omit<Market, 'uid' | 'createdAt'>>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');
    await updateDoc(doc(db, 'markets', uid), data);
  };

  const uploadLogo = async (uri: string): Promise<string> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');
    const url = await uploadImageToCloudinary(uri, `logos/${uid}`);
    await updateDoc(doc(db, 'markets', uid), { logoUrl: url });
    return url;
  };

  return { market, loading, createMarket, updateMarket, uploadLogo };
}
