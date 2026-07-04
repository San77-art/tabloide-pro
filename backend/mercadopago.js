const MP_API_BASE = 'https://api.mercadopago.com';

// Fonte da verdade dos planos pagos — espelha lib/mercadopago.ts (MP_PLANS) no app.
// Os dois lados precisam ser mantidos em sincronia manualmente porque são runtimes separados.
const PLAN_DEFINITIONS = {
  pro_monthly: { planId: 'pro', cycle: 'monthly', reason: 'Tab Pro Mensal', amount: 69.9, frequency: 1 },
  pro_yearly: { planId: 'pro', cycle: 'yearly', reason: 'Tab Pro Anual', amount: 599.0, frequency: 12 },
  business_monthly: { planId: 'business', cycle: 'monthly', reason: 'Tab Business Mensal', amount: 149.9, frequency: 1 },
  business_yearly: { planId: 'business', cycle: 'yearly', reason: 'Tab Business Anual', amount: 1299.0, frequency: 12 },
};

const PLAN_LIMITS = { free: 20, pro: 200, business: Infinity, enterprise: Infinity };

function accessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado no backend.');
  return token;
}

async function mpRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${MP_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Mercado Pago API ${path} falhou (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

// Garante que o preapproval_plan exista no MP, criando (e cacheando o id no Firestore) na primeira vez.
async function ensurePreapprovalPlanId(db, planKey) {
  const def = PLAN_DEFINITIONS[planKey];
  if (!def) throw new Error(`Plano desconhecido: ${planKey}`);

  const ref = db.collection('mp_plans').doc(planKey);
  const snap = await ref.get();
  if (snap.exists && snap.data().preapprovalPlanId) {
    return snap.data().preapprovalPlanId;
  }

  const created = await mpRequest('/preapproval_plan', {
    method: 'POST',
    body: {
      reason: def.reason,
      auto_recurring: {
        frequency: def.frequency,
        frequency_type: 'months',
        transaction_amount: def.amount,
        currency_id: 'BRL',
      },
      back_url: 'https://tab-pro-b6c19.web.app/',
    },
  });

  await ref.set({
    preapprovalPlanId: created.id,
    planId: def.planId,
    cycle: def.cycle,
    reason: def.reason,
    amount: def.amount,
    createdAt: new Date().toISOString(),
  });

  return created.id;
}

module.exports = { PLAN_DEFINITIONS, PLAN_LIMITS, mpRequest, ensurePreapprovalPlanId };
