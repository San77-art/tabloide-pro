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
import { logActivity } from '../lib/activity';

export interface FirestoreCampaign {
  id: string;
  uid: string;
  name: string;
  description: string;
  status: 'active' | 'scheduled' | 'finished';
  tabloidIds: string[];
  views: number;
  sales: number;
  thumbnailUrl?: string;
  createdAt?: unknown;
}

type TabFilter = 'active' | 'scheduled' | 'finished';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<FirestoreCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('active');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const q = query(
      collection(db, 'campaigns'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreCampaign)));
      setLoading(false);
    });
    return unsub;
  }, [auth.currentUser?.uid]);

  const filtered = campaigns.filter((c) => c.status === activeTab);

  const createCampaign = async (data: Omit<FirestoreCampaign, 'id' | 'uid' | 'createdAt'>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');
    await addDoc(collection(db, 'campaigns'), { ...data, uid, createdAt: serverTimestamp() });
    if (data.status === 'active') {
      await logActivity(uid, 'campaign_published', `Campanha "${data.name}" foi publicada`);
    }
  };

  const updateCampaign = async (id: string, data: Partial<FirestoreCampaign>) => {
    await updateDoc(doc(db, 'campaigns', id), data);
  };

  const deleteCampaign = async (id: string) => {
    await deleteDoc(doc(db, 'campaigns', id));
  };

  return {
    campaigns: filtered,
    allCampaigns: campaigns,
    loading,
    activeTab,
    setActiveTab,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
