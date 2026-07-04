// Geração de fundos para tabloides usando DALL-E 3 (OpenAI)
// O prompt base é controlado internamente — o lojista só vê as temáticas e o chat
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY ?? '';

export const PRO_MONTHLY_LIMIT = 10;

// Prompt base do designer — nunca exposto ao lojista
// Define o estilo visual padrão de todos os fundos gerados
const BASE_PROMPT = `
Professional advertising background for a retail store promotional flyer.
Style: modern, clean, commercial advertising quality, vibrant colors, no text, no products, no people, no faces.
Format: landscape orientation, suitable as background image.
Quality: photorealistic, high resolution, professional photography or digital art.
Important: the background must be visually appealing but not distracting — products will be placed on top of it.
`.trim();

// Temáticas predefinidas com descrições em inglês para melhor resultado do DALL-E
export const TEMATICAS = [
  { id: 'natal', label: 'Natal 🎄', description: 'Christmas theme, red and gold decorations, snowflakes, festive atmosphere, warm lighting' },
  { id: 'pascoa', label: 'Páscoa 🐣', description: 'Easter theme, pastel colors, spring flowers, colorful eggs, soft natural lighting' },
  { id: 'maes', label: 'Dia das Mães 💐', description: "Mother's Day theme, pink and rose flowers, elegant feminine style, soft romantic atmosphere" },
  { id: 'pais', label: 'Dia dos Pais 👔', description: "Father's Day theme, classic masculine style, dark blue and brown tones, sophisticated atmosphere" },
  { id: 'black_friday', label: 'Black Friday 🖤', description: 'Black Friday theme, dark dramatic background, neon accents, modern tech feel, bold contrast' },
  { id: 'volta_aulas', label: 'Volta às Aulas 📚', description: 'Back to school theme, colorful school supplies, bright cheerful colors, energetic atmosphere' },
  { id: 'carnaval', label: 'Carnaval 🎭', description: 'Carnival theme, vibrant tropical colors, confetti, festive Brazilian carnival atmosphere' },
  { id: 'junina', label: 'Festa Junina 🌽', description: 'Brazilian June festival theme, rustic barn style, colorful flags, warm golden lighting' },
  { id: 'importados', label: 'Importados 🌎', description: 'International imports theme, world map elements, premium cosmopolitan feel, luxury atmosphere' },
  { id: 'eletronicos', label: 'Eletrônicos ⚡', description: 'Electronics theme, tech circuit patterns, blue and cyan neon lights, futuristic digital atmosphere' },
  { id: 'perfumaria', label: 'Perfumaria 🌸', description: 'Perfume and beauty theme, elegant luxury style, rose gold and purple tones, glamorous atmosphere' },
  { id: 'liquidacao', label: 'Liquidação 🏷️', description: 'Sale and discount theme, dynamic energetic style, bright orange and yellow, exciting promotional atmosphere' },
  { id: 'lancamentos', label: 'Lançamentos ✨', description: 'New product launch theme, modern minimalist style, silver and white tones, innovative premium feel' },
  { id: 'fim_ano', label: 'Fim de Ano 🎆', description: 'New Year celebration theme, fireworks, gold and silver sparkles, midnight celebration atmosphere' },
  { id: 'verao', label: 'Verão ☀️', description: 'Summer theme, tropical beach vibes, bright yellow and turquoise, sunny cheerful atmosphere' },
  { id: 'inverno', label: 'Inverno ❄️', description: 'Winter theme, cool blue and white tones, snowflakes and ice crystals, cozy sophisticated atmosphere' },
  { id: 'saude', label: 'Saúde & Bem-estar 💚', description: 'Health and wellness theme, green natural tones, fresh herbs and plants, clean organic atmosphere' },
  { id: 'esportes', label: 'Esportes 🏃', description: 'Sports and fitness theme, dynamic motion blur, bold primary colors, energetic athletic atmosphere' },
  { id: 'casa', label: 'Casa & Decoração 🏠', description: 'Home decor theme, warm interior design, cozy modern home atmosphere, neutral elegant tones' },
  { id: 'moda', label: 'Moda & Estilo 👗', description: 'Fashion theme, runway style, elegant editorial feel, sophisticated neutral tones with accent colors' },
];

export interface GeneratedBackground {
  url: string;
  themeId: string;
  prompt: string;
}

const STYLE_VARIATIONS = [
  'photorealistic photography style',
  'digital art illustration style',
  'gradient abstract style',
  'watercolor artistic style',
];

// Gera 4 fundos em paralelo para uma temática predefinida
export async function generateBackgrounds(themeId: string): Promise<GeneratedBackground[]> {
  const theme = TEMATICAS.find((t) => t.id === themeId);
  if (!theme) throw new Error('Temática não encontrada');

  const fullPrompt = `${BASE_PROMPT}\nTheme: ${theme.description}`;
  return generateFromPrompt(fullPrompt, themeId);
}

// Gera 4 fundos a partir de uma descrição livre do lojista
export async function generateBackgroundsFromText(userDescription: string): Promise<GeneratedBackground[]> {
  // Sanitiza o input do usuário para não quebrar o prompt base
  const sanitized = userDescription
    .replace(/[<>{}[\]\\]/g, '')
    .substring(0, 200);

  const fullPrompt = `${BASE_PROMPT}\nCustom theme described by the store owner: ${sanitized}`;
  return generateFromPrompt(fullPrompt, 'custom');
}

async function generateFromPrompt(prompt: string, themeId: string): Promise<GeneratedBackground[]> {
  if (!OPENAI_KEY) throw new Error('Chave OpenAI não configurada');

  // Gera 4 imagens em paralelo (mais rápido que sequencial)
  const promises = STYLE_VARIATIONS.map(async (style) => {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `${prompt}. Visual style: ${style}.`,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message ?? 'Erro ao gerar imagem');
    }

    const data = await response.json();
    return { url: data.data[0].url, themeId, prompt };
  });

  return Promise.all(promises);
}

// Chat para descrever o fundo livremente
export async function chatForBackground(
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  if (!OPENAI_KEY) throw new Error('Chave OpenAI não configurada');

  const systemPrompt = `Você é um assistente criativo especializado em design de tabloides e materiais promocionais para lojas.
Seu papel é ajudar o lojista a descrever o fundo ideal para o tabloide dele.
Faça perguntas sobre: tipo de loja, produtos em destaque, cores preferidas, estilo visual desejado, data/evento.
Quando tiver informações suficientes (máximo 3 perguntas), gere uma descrição final em português dizendo algo como:
"Ótimo! Vou gerar fundos para: [descrição completa do que será gerado]"
Seja simpático, use linguagem informal e emojis. Respostas curtas e diretas.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message ?? 'Erro ao conversar com a IA');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Lê o total de gerações do mês atual (reseta automaticamente quando o mês muda)
export async function getAIUsageCount(uid: string): Promise<number> {
  const snap = await getDoc(doc(db, 'ai_usage', uid));
  if (!snap.exists()) return 0;
  const data = snap.data();
  return data.month === currentMonth() ? (data.backgroundGenerations ?? 0) : 0;
}

// Incrementa o contador mensal de gerações (cria/reseta o documento se o mês mudou)
export async function incrementAIUsage(uid: string): Promise<void> {
  const ref = doc(db, 'ai_usage', uid);
  const snap = await getDoc(ref);
  const month = currentMonth();
  if (snap.exists() && snap.data().month === month) {
    await setDoc(ref, { backgroundGenerations: increment(1), updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(ref, { uid, backgroundGenerations: 1, month, updatedAt: serverTimestamp() });
  }
}
