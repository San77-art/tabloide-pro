import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface FirestoreTab {
  id: string;
  uid: string;
  title: string;
  type: 'weekly' | 'monthly' | 'special';
  theme: string;
  products: string[];
  productSnapshots?: ProductSnapshot[];
  status: 'draft' | 'published' | 'archived';
  thumbnailUrl?: string;
  validFrom?: string;
  validUntil?: string;
  createdAt?: unknown;
}

export function useTabloids() {
  const [tabs, setTabs] = useState<FirestoreTab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const q = query(
      collection(db, 'tabloids'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setTabs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreTab)));
      setLoading(false);
    });
    return unsub;
  }, [auth.currentUser?.uid]);

  const getThisMonthCount = () => {
    const now = new Date();
    return tabs.filter((tab) => {
      if (!tab.createdAt) return false;
      const ts = tab.createdAt as { toDate?: () => Date };
      const date = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }).length;
  };

  const createTab = async (
    data: Omit<FirestoreTab, 'id' | 'uid' | 'createdAt'>,
    tabloidLimit?: number,
  ) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');

    if (tabloidLimit !== undefined && Number.isFinite(tabloidLimit)) {
      const monthCount = getThisMonthCount();
      if (monthCount >= tabloidLimit) {
        throw new Error(
          `Limite de ${tabloidLimit} tabloides por mês atingido. Faça upgrade para criar mais.`,
        );
      }
    }

    const docRef = await addDoc(collection(db, 'tabloids'), {
      ...data,
      uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateTab = async (id: string, data: Partial<FirestoreTab>) => {
    await updateDoc(doc(db, 'tabloids', id), data);
  };

  const deleteTab = async (id: string) => {
    await deleteDoc(doc(db, 'tabloids', id));
  };

  const duplicateTab = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');
    const original = tabs.find((t) => t.id === id);
    if (!original) throw new Error('Tabloide não encontrado');
    const { id: _id, createdAt: _ca, ...rest } = original;
    await addDoc(collection(db, 'tabloids'), {
      ...rest,
      title: `${original.title} (cópia)`,
      status: 'draft' as const,
      uid,
      createdAt: serverTimestamp(),
    });
  };

  return {
    tabs,
    loading,
    createTab,
    updateTab,
    deleteTab,
    duplicateTab,
    getThisMonthCount,
  };
}
