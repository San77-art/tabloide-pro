import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { uploadImageToCloudinary } from '../lib/cloudinary';

export interface Market {
  uid: string;
  name: string;
  logoUrl?: string;
  plan: 'free' | 'pro';
  colors: { primary: string; secondary: string };
  createdAt?: unknown;
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

  const createMarket = async (name: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');
    await setDoc(doc(db, 'markets', uid), {
      name,
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
