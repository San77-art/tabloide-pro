import { useState, useEffect, useMemo } from 'react';
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
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { calculateSellPrice } from '../lib/exchangeRate';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { logActivity } from '../lib/activity';

export interface FirestoreProduct {
  id: string;
  uid: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: unknown;
  // Precificação baseada em custo em dólar
  costUSD?: number;
  marginPercent?: number;
  sellPriceCurrency?: 'BRL' | 'PYG';
  manualOverride?: boolean;
  lastPriceUpdate?: unknown;
}

export interface PublicProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

type Category = 'Todos' | string;

export function useProducts() {
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [publicProducts, setPublicProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('Todos');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const q = query(
      collection(db, 'products'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProduct)));
      setLoading(false);
    });
    return unsub;
  }, [auth.currentUser?.uid]);

  const loadPublicProducts = async () => {
    const snap = await getDocs(collection(db, 'public_products'));
    setPublicProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicProduct)));
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'Todos' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const addProduct = async (data: Omit<FirestoreProduct, 'id' | 'uid' | 'createdAt'>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');
    await addDoc(collection(db, 'products'), {
      ...data, uid, createdAt: serverTimestamp(), lastPriceUpdate: serverTimestamp(),
    });
    await logActivity(uid, 'product_added', '1 produto(s) cadastrado(s)');
  };

  const updateProduct = async (id: string, data: Partial<FirestoreProduct>) => {
    const touchesPrice = 'price' in data || 'costUSD' in data || 'marginPercent' in data;
    await updateDoc(doc(db, 'products', id), touchesPrice ? { ...data, lastPriceUpdate: serverTimestamp() } : data);
  };

  const removeProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  };

  const uploadProductImage = async (uri: string): Promise<string> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Não autenticado');
    return uploadImageToCloudinary(uri, `products/${uid}`);
  };

  // Recalcula sellPrice (campo `price`) para produtos com custo em USD e sem trava manual,
  // usada pela tela de Cotação quando o lojista aplica um reajuste em massa.
  const applyRateAdjustment = async (productIds: string[], exchangeRate: number) => {
    const targets = products.filter((p) => productIds.includes(p.id) && p.costUSD != null && !p.manualOverride);
    if (targets.length === 0) return;

    const batch = writeBatch(db);
    targets.forEach((p) => {
      const sellPrice = calculateSellPrice(p.costUSD!, exchangeRate, p.marginPercent ?? 0);
      batch.update(doc(db, 'products', p.id), { price: sellPrice, lastPriceUpdate: serverTimestamp() });
    });
    await batch.commit();
  };

  return {
    products: filtered,
    allProducts: products,
    publicProducts,
    loading,
    search,
    setSearch,
    category,
    setCategory,
    loadPublicProducts,
    addProduct,
    updateProduct,
    removeProduct,
    applyRateAdjustment,
    uploadProductImage,
  };
}
