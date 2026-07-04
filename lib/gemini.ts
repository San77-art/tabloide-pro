import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '' });
const MODEL = 'gemini-2.0-flash';

async function ask(prompt: string): Promise<string> {
  const response = await genai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  return response.text ?? '';
}

async function askJSON<T>(prompt: string, fallback: T): Promise<T> {
  try {
    const raw = await ask(prompt + '\n\nResponda APENAS com JSON válido, sem markdown, sem explicações.');
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export async function suggestTabTitle(
  theme: string,
  type: string,
  marketName: string,
): Promise<string[]> {
  return askJSON<string[]>(
    `Você é um especialista em marketing de supermercado brasileiro.
Sugira 5 títulos criativos e chamativos para um tabloide de ofertas.
Tema: ${theme}
Tipo: ${type}
Nome do mercado: ${marketName}
Retorne um array JSON com 5 strings, ex: ["TÍTULO 1", "TÍTULO 2", ...]`,
    ['OFERTAS DA SEMANA', 'PROMOÇÕES IMPERDÍVEIS', 'ECONOMIZE MAIS', 'PREÇOS BAIXOS', 'SUPER DESCONTOS'],
  );
}

export async function suggestProducts(category: string): Promise<Array<{ name: string; price: number; oldPrice?: number }>> {
  return askJSON(
    `Sugira 8 produtos brasileiros da categoria "${category}" com preços reais de supermercado (em BRL, 2025).
Retorne JSON: [{"name": "Nome Produto Qtd", "price": 9.99, "oldPrice": 12.99}, ...]
oldPrice deve ser 10-30% maior que price para produtos em promoção (opcional).`,
    [],
  );
}

export async function generateTabLayout(
  products: Array<{ name: string; price: number }>,
  theme: string,
): Promise<{ highlights: string[]; order: string[]; primaryColor: string; accentColor: string }> {
  const names = products.map((p) => p.name).join(', ');
  return askJSON(
    `Para um tabloide de supermercado com tema "${theme}" e produtos: ${names}.
Retorne JSON: {
  "highlights": ["produto1", "produto2"],
  "order": ["produto_destaque", "produto2", ...],
  "primaryColor": "#HEX",
  "accentColor": "#HEX"
}
highlights: até 2 produtos para destacar em tamanho maior.
Cores devem combinar com o tema.`,
    { highlights: [], order: [], primaryColor: '#2563EB', accentColor: '#F59E0B' },
  );
}

export async function chatAssistant(message: string, context: string): Promise<string> {
  try {
    return await ask(
      `Você é um assistente virtual do app Tab, que ajuda donos de supermercado a criar tabloides de ofertas.
Contexto atual do usuário: ${context}
Pergunta/mensagem: ${message}
Responda de forma concisa, amigável e útil em português brasileiro.`,
    );
  } catch {
    return 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
  }
}
