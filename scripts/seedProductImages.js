/**
 * Script de seed do banco de imagens públicas (~20.000 produtos no plano final).
 *
 * Roda FORA do app, uma única vez (ou sempre que quiser ampliar o catálogo público), em Node.js.
 * Lê scripts/products-catalog.json, busca uma imagem relevante de cada produto via Unsplash API,
 * faz upload para o Cloudinary em `public-products/{category}/{slug}` e grava o resultado na
 * coleção Firestore `public_products` (a mesma lida pelo app em lib/publicProducts.ts e pelo
 * modal de banco de imagens em components/product/ImageBankPickerModal.tsx).
 *
 * COMO RODAR:
 * 1. cd scripts && npm install
 * 2. Gere uma chave de conta de serviço no Firebase Console
 *    (Configurações do projeto > Contas de serviço > Gerar nova chave privada)
 *    e salve como scripts/service-account.json (NÃO faça commit desse arquivo).
 * 3. Crie uma conta gratuita em https://unsplash.com/developers e gere um Access Key.
 * 4. Defina a variável de ambiente UNSPLASH_ACCESS_KEY=sua_chave (as credenciais do Cloudinary
 *    são lidas automaticamente do .env na raiz do projeto).
 * 5. node seedProductImages.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BATCH_SIZE = 50;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Defina a variável de ambiente UNSPLASH_ACCESS_KEY antes de rodar o script.');
  process.exit(1);
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`Arquivo de credenciais não encontrado: ${SERVICE_ACCOUNT_PATH}`);
  console.error('Gere uma chave de conta de serviço no Firebase Console e salve nesse caminho.');
  process.exit(1);
}

if (!process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Defina EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, EXPO_PUBLIC_CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no .env.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
});

const db = admin.firestore();

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function fetchUnsplashImage(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
  if (!res.ok) throw new Error(`Unsplash respondeu ${res.status} para "${query}"`);
  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) throw new Error(`Nenhuma imagem encontrada para "${query}"`);
  return { fullUrl: photo.urls.regular, thumbUrl: photo.urls.small };
}

async function uploadToCloudinary(imageUrl, folder, publicId) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder,
    public_id: publicId,
    overwrite: true,
  });
  return result.secure_url;
}

async function seedProduct(product) {
  const slug = slugify(product.name);
  const { fullUrl, thumbUrl } = await fetchUnsplashImage(product.unsplashQuery);
  const folder = `public-products/${product.category}`;

  const imageUrl = await uploadToCloudinary(fullUrl, folder, slug);
  const thumbnailUrl = await uploadToCloudinary(thumbUrl, folder, `${slug}-thumb`);

  return {
    name: product.name,
    category: product.category,
    imageUrl,
    thumbnailUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function loadExistingNames() {
  const snap = await db.collection('public_products').select('name').get();
  return new Set(snap.docs.map((d) => d.data().name));
}

async function run() {
  const catalogPath = path.join(__dirname, 'products-catalog.json');
  const fullCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  console.log(`Catálogo carregado: ${fullCatalog.length} produtos.`);

  const existingNames = await loadExistingNames();
  const catalog = fullCatalog.filter((product) => !existingNames.has(product.name));
  const skipped = fullCatalog.length - catalog.length;
  console.log(`${existingNames.size} produtos já no Firestore. ${skipped} ignorados (já existentes), ${catalog.length} a processar.`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
    const chunk = catalog.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    const results = await Promise.allSettled(chunk.map((product) => seedProduct(product)));

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const ref = db.collection('public_products').doc();
        batch.set(ref, result.value);
        processed += 1;
      } else {
        failed += 1;
        console.error(`Falha ao processar "${chunk[idx].name}":`, result.reason.message);
      }
    });

    await batch.commit();
    console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${processed} processados, ${failed} falhas até agora.`);
  }

  console.log(`Concluído. ${processed} produtos adicionados ao banco de imagens, ${failed} falhas.`);
}

run().catch((err) => {
  console.error('Erro fatal no seed:', err);
  process.exit(1);
});
