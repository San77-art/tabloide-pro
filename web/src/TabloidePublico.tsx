import React, { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface TabData {
  title: string;
  type: string;
  theme: string;
  status: string;
  uid: string;
  productSnapshots?: ProductSnapshot[];
  validUntil?: string;
}

interface MarketData {
  name: string;
  logoUrl?: string;
}

function getTabId(): string | null {
  const match = window.location.pathname.match(/\/t\/([^/]+)/);
  return match ? match[1] : null;
}

function ProductCard({ product }: { product: ProductSnapshot }) {
  const int = Math.floor(product.price).toString();
  const cents = (product.price % 1).toFixed(2).slice(1);

  return (
    <div
      style={{
        width: 'calc(50% - 4px)',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 28 }}>🛒</span>
        )}
      </div>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#fff',
          textAlign: 'center',
          lineHeight: '13px',
          marginBottom: 4,
        }}
      >
        {product.name}
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: 10,
            color: '#F59E0B',
            marginTop: 3,
          }}
        >
          R$
        </span>
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 900,
            fontSize: 22,
            color: '#F59E0B',
            lineHeight: '26px',
          }}
        >
          {int}
        </span>
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: 10,
            color: '#F59E0B',
            marginTop: 3,
          }}
        >
          {cents}
        </span>
      </div>
    </div>
  );
}

export default function TabloidePublico() {
  const [tab, setTab] = useState<TabData | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabId = getTabId();

  useEffect(() => {
    if (!tabId) {
      setError('Link inválido.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const tabSnap = await getDoc(doc(db, 'tabloids', tabId!));
        if (!tabSnap.exists()) {
          setError('Tabloide não encontrado.');
          setLoading(false);
          return;
        }

        const tabData = tabSnap.data() as TabData;
        if (tabData.status !== 'published') {
          setError('Este tabloide não está disponível publicamente.');
          setLoading(false);
          return;
        }

        setTab(tabData);

        document.title = `${tabData.title} | Tab`;
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', tabData.title);

        const marketSnap = await getDoc(doc(db, 'markets', tabData.uid));
        if (marketSnap.exists()) {
          const mkt = marketSnap.data() as MarketData;
          setMarket(mkt);
          document
            .querySelector('meta[property="og:description"]')
            ?.setAttribute('content', `Confira as ofertas de ${mkt.name}! 🔥`);
        }
      } catch {
        setError('Erro ao carregar o tabloide. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tabId]);

  const getBackground = (theme: string): React.CSSProperties => {
    if (theme.includes(',')) {
      const [c1, c2] = theme.split(',');
      return { background: `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)` };
    }
    return { backgroundColor: theme };
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#F0F4FF',
        }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#64748B', fontSize: 16 }}>
          Carregando tabloide...
        </p>
      </div>
    );
  }

  if (error || !tab) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 24,
          backgroundColor: '#F0F4FF',
        }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#EF4444', fontSize: 16, textAlign: 'center' }}>
          {error ?? 'Erro desconhecido.'}
        </p>
      </div>
    );
  }

  const products = tab.productSnapshots ?? [];
  const displayProducts = products.slice(0, 4);
  const bgStyle = getBackground(tab.theme);
  const marketName = market?.name ?? 'Meu Mercado';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '24px 16px 48px',
        backgroundColor: '#F0F4FF',
      }}
    >
      {/* Tabloide card */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(37,99,235,0.25)',
          position: 'relative',
          padding: 16,
          ...bgStyle,
        }}
      >
        {/* Starburst badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 64,
            height: 64,
            backgroundColor: '#F59E0B',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <p
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 900,
              fontSize: 8,
              color: '#0F172A',
              textAlign: 'center',
              lineHeight: '10px',
            }}
          >
            OFERTA
            <br />
            IMPERDÍVEL
          </p>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 900,
            fontSize: 22,
            color: '#F59E0B',
            textAlign: 'center',
            letterSpacing: 1,
            marginTop: 8,
            marginBottom: 8,
            paddingRight: 60,
            position: 'relative',
            zIndex: 1,
            lineHeight: '1.2',
          }}
        >
          {tab.title}
        </h1>

        {/* Divider */}
        <div
          style={{
            height: 2,
            backgroundColor: '#F59E0B',
            opacity: 0.5,
            marginBottom: 12,
            position: 'relative',
            zIndex: 1,
          }}
        />

        {/* Products grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {displayProducts.length > 0 ? (
            displayProducts.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <div style={{ width: '100%', textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Sem produtos cadastrados
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: 8,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              color: '#fff',
            }}
          >
            🏪 {marketName}
          </span>
          {tab.validUntil && (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Válido até {tab.validUntil}
            </span>
          )}
        </div>
      </div>

      {/* CTA download */}
      <a
        href="https://play.google.com/store/apps/details?id=com.tab.app"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 32,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#2563EB',
          color: '#fff',
          padding: '14px 28px',
          borderRadius: 14,
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize: 15,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
        }}
      >
        📱 Baixar o Tab
      </a>

      <p
        style={{
          marginTop: 12,
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#94A3B8',
          textAlign: 'center',
        }}
      >
        Crie tabloides de ofertas para o seu mercado
      </p>
    </div>
  );
}
