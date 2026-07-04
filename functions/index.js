const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// A integração com o Mercado Pago (createSubscription, getSubscriptionStatus,
// webhookMercadoPago) foi migrada para backend/ (Express no Railway) — Cloud Functions
// exigiria o plano pago Blaze do Firebase para fazer chamadas de rede à API do MP.
// Veja backend/index.js.

// Mesma API gratuita usada no app (lib/exchangeRate.ts), sem necessidade de chave.
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,USD-PYG';
const FIELD = { BRL: 'USDBRL', PYG: 'USDPYG' };

async function fetchRates() {
  const res = await fetch(AWESOME_API_URL);
  if (!res.ok) throw new Error(`AwesomeAPI respondeu ${res.status}`);
  return res.json();
}

async function sendPriceAlert(uid, changePercent, currency) {
  const tokenDoc = await db.collection('push_tokens').doc(uid).get();
  const token = tokenDoc.exists ? tokenDoc.data().token : null;
  if (!token) return;

  const direction = changePercent > 0 ? 'subiu' : 'desceu';
  const message = {
    to: token,
    sound: 'default',
    title: '💵 Cotação do dólar mudou!',
    body: `Dólar ${direction} ${Math.abs(changePercent).toFixed(1)}%! Toque para reajustar seus preços.`,
    data: { screen: 'exchange' },
  };

  // Expo Push API (o token registrado pelo app via expo-notifications é um Expo push token).
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(message),
  });
}

async function autoAdjustProducts(uid, currentRate) {
  const productsSnap = await db.collection('products')
    .where('uid', '==', uid)
    .where('manualOverride', '==', false)
    .get();

  if (productsSnap.empty) return;

  const batch = db.batch();
  productsSnap.docs.forEach((docSnap) => {
    const product = docSnap.data();
    if (product.costUSD == null) return;
    const sellPrice = product.costUSD * currentRate * (1 + (product.marginPercent ?? 0) / 100);
    batch.update(docSnap.ref, { price: sellPrice, lastPriceUpdate: admin.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
}

exports.checkExchangeRate = functions.pubsub.schedule('every 15 minutes').onRun(async () => {
  const rates = await fetchRates();
  const configsSnap = await db.collection('exchange_rates').get();
  const updateBatch = db.batch();

  await Promise.all(configsSnap.docs.map(async (docSnap) => {
    const config = docSnap.data();
    const uid = docSnap.id;
    const currency = config.baseCurrency === 'PYG' ? 'PYG' : 'BRL';
    const currentRate = parseFloat(rates[FIELD[currency]]?.bid);
    if (!Number.isFinite(currentRate)) return;

    const previousRate = config.lastKnownRate || currentRate;
    const changePercent = previousRate > 0 ? ((currentRate - previousRate) / previousRate) * 100 : 0;
    const threshold = config.alertThreshold ?? 2;

    updateBatch.set(docSnap.ref, {
      lastKnownRate: currentRate,
      lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    if (previousRate > 0 && Math.abs(changePercent) >= threshold) {
      await sendPriceAlert(uid, changePercent, currency);
      if (config.autoAdjustEnabled) {
        await autoAdjustProducts(uid, currentRate);
      }
    }
  }));

  await updateBatch.commit();
  return null;
});

// INSTRUÇÕES DE DEPLOY:
// 1. cd functions && npm install
// 2. firebase deploy --only functions
//
// ATENÇÃO — PLANO BLAZE NECESSÁRIO:
// Cloud Functions agendadas (pubsub.schedule) usam o Cloud Scheduler por baixo dos panos,
// que não está disponível no plano gratuito Spark — é preciso migrar para o plano Blaze
// (pay-as-you-go). Isso não significa que vai custar caro: o Blaze mantém as mesmas cotas
// gratuitas do Spark (2 milhões de invocações de functions/mês, etc.) e cobra apenas o que
// passar disso. Essa função roda a cada 15 min (~2.880 execuções/mês) e faz poucas leituras/
// escritas no Firestore por usuário — para uma base pequena/média de lojistas, o custo
// estimado é de R$0 a R$2/mês (o Cloud Scheduler cobra ~US$0,10/mês por job agendado).
