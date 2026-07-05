const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { PLAN_DEFINITIONS, PLAN_LIMITS, mpRequest, ensurePreapprovalPlanId } = require('./mercadopago');

// Credenciais do Firebase Admin: em produção (Railway) cole o JSON da service account
// inteiro na variável FIREBASE_SERVICE_ACCOUNT_JSON (não é possível commitar o arquivo,
// veja backend/.gitignore). Em desenvolvimento local, GOOGLE_APPLICATION_CREDENTIALS
// aponta para o arquivo copiado em backend/service-account.json.
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    throw new Error(
      'Credenciais do Firebase Admin não encontradas. Defina FIREBASE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS.',
    );
  }
}

const db = admin.firestore();
const app = express();

const ALLOWED_WEB_ORIGINS = ['https://tab-pro-b6c19.web.app', 'https://tab-pro-b6c19.firebaseapp.com'];

app.use(
  cors({
    origin(origin, callback) {
      // Apps mobile (Expo Go / build nativo) não enviam header Origin — sempre liberados.
      if (!origin || ALLOWED_WEB_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origem não permitida pelo CORS'));
    },
  }),
);
app.use(express.json());

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Token de autenticação ausente.' });
    return;
  }
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token de autenticação inválido.' });
  }
}

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'tab-backend' });
});

// Cria uma assinatura (preapproval) no Mercado Pago para o plano escolhido e retorna
// o init_point (URL de checkout) para o app abrir no navegador.
app.post('/create-subscription', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { planKey, payerEmail: bodyEmail } = req.body || {};
    const def = PLAN_DEFINITIONS[planKey];
    if (!def) {
      res.status(400).json({ error: 'Plano inválido.' });
      return;
    }

    const payerEmail = req.user.email || bodyEmail;
    if (!payerEmail) {
      res.status(400).json({ error: 'E-mail do pagador não encontrado.' });
      return;
    }

    const preapprovalPlanId = await ensurePreapprovalPlanId(db, planKey);
    const preapproval = await mpRequest('/preapproval', {
      method: 'POST',
      body: {
        preapproval_plan_id: preapprovalPlanId,
        reason: def.reason,
        payer_email: payerEmail,
        external_reference: `${uid}::${planKey}`,
        back_url: 'tab://upgrade?mp_return=1',
      },
    });

    res.json({ initPoint: preapproval.init_point, preapprovalId: preapproval.id });
  } catch (err) {
    console.error('Erro em /create-subscription:', err);
    res.status(500).json({ error: 'Não foi possível criar a assinatura.' });
  }
});

// Consulta o status atual de uma assinatura diretamente no Mercado Pago.
app.get('/subscription-status/:id', requireAuth, async (req, res) => {
  try {
    const preapproval = await mpRequest(`/preapproval/${req.params.id}`);
    const [ownerUid] = String(preapproval.external_reference || '').split('::');
    if (ownerUid !== req.user.uid) {
      res.status(403).json({ error: 'Assinatura não pertence a este usuário.' });
      return;
    }
    res.json({ status: preapproval.status });
  } catch (err) {
    console.error('Erro em /subscription-status:', err);
    res.status(500).json({ error: 'Não foi possível consultar a assinatura.' });
  }
});

// Valida o header x-signature enviado pelo Mercado Pago, conforme
// https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks#Assinatura-do-webhook
// Isso garante que a notificação realmente veio do MP, e não de um terceiro forjando o payload.
function isValidMpSignature(req, resourceId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error('MP_WEBHOOK_SECRET não configurada — recusando notificação do webhook.');
    return false;
  }

  const signatureHeader = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  if (!signatureHeader || !requestId || !resourceId) return false;

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(',')
      .map((part) => part.split('=').map((s) => s.trim()))
      .filter(([key, value]) => key && value),
  );
  const { ts, v1: receivedHash } = parts;
  if (!ts || !receivedHash) return false;

  const manifest = `id:${String(resourceId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expectedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const receivedBuf = Buffer.from(receivedHash, 'hex');
  return expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

// Recebe as notificações do Mercado Pago para assinaturas (preapproval).
// Por segurança, nunca confiamos no status enviado no corpo da notificação: buscamos
// o preapproval real na API do MP (usando o Access Token) antes de atualizar o Firestore.
app.post('/webhook/mp', async (req, res) => {
  try {
    const preapprovalId = req.body?.data?.id || req.body?.id || req.query.id || req.query['data.id'];
    const type = req.body?.type || req.query.topic;

    if (!isValidMpSignature(req, preapprovalId)) {
      res.sendStatus(401);
      return;
    }

    if (!preapprovalId || (type && type !== 'subscription_preapproval' && type !== 'preapproval')) {
      res.sendStatus(200);
      return;
    }

    const preapproval = await mpRequest(`/preapproval/${preapprovalId}`);
    const [uid, planKey] = String(preapproval.external_reference || '').split('::');
    if (!uid) {
      res.sendStatus(200);
      return;
    }

    const def = PLAN_DEFINITIONS[planKey];

    if (preapproval.status === 'authorized' && def) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + def.frequency);

      await db.collection('subscriptions').doc(uid).set(
        {
          plan: def.planId,
          status: 'active',
          productLimit: PLAN_LIMITS[def.planId],
          mpPreapprovalId: preapproval.id,
          mpPlanKey: planKey,
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } else if (preapproval.status === 'cancelled') {
      await db.collection('subscriptions').doc(uid).set(
        {
          plan: 'free',
          status: 'cancelled',
          productLimit: PLAN_LIMITS.free,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook do Mercado Pago:', err);
    // Responde 200 mesmo em erro para evitar reenvios agressivos do MP; o erro já foi logado.
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`tab-backend rodando na porta ${PORT}`));
