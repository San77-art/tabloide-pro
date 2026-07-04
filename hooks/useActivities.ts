import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ActivityType } from '../lib/activity';

export interface FirestoreActivity {
  id: string;
  type: ActivityType;
  description: string;
  createdAt?: unknown;
}

export function useActivities() {
  const [activities, setActivities] = useState<FirestoreActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const q = query(
      collection(db, 'activities', uid, 'items'),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreActivity)));
      setLoading(false);
    });
    return unsub;
  }, [auth.currentUser?.uid]);

  return { activities, loading };
}
