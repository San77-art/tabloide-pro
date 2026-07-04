import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type ActivityType =
  | 'tabloid_created'
  | 'campaign_published'
  | 'product_added'
  | 'price_adjusted';

export async function logActivity(uid: string, type: ActivityType, description: string) {
  await addDoc(collection(db, 'activities', uid, 'items'), {
    type,
    description,
    createdAt: serverTimestamp(),
  });
}
