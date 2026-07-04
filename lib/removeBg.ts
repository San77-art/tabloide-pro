// Remove fundo de imagens usando a API remove.bg
// Custo: ~$0,02 por imagem (R$ 0,11)
// Documentação: https://www.remove.bg/api
import { PlanId } from '../types';

const REMOVE_BG_API_KEY = process.env.EXPO_PUBLIC_REMOVE_BG_KEY ?? '';

const REMOVE_BG_LIMITS: Record<PlanId, number> = { free: 0, pro: 20, business: 100, enterprise: 999 };

export async function removeBackground(imageUri: string): Promise<string> {
  if (!REMOVE_BG_API_KEY) throw new Error('Chave remove.bg não configurada');

  // Converte a imagem para base64
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);

  // Chama a API remove.bg
  const formData = new FormData();
  formData.append('image_file_b64', base64.split(',')[1]);
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const result = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
    body: formData,
  });

  if (!result.ok) {
    const error = await result.json();
    if (result.status === 402) throw new Error('Créditos remove.bg esgotados');
    if (result.status === 429) throw new Error('Limite de requisições atingido. Tente em alguns minutos.');
    throw new Error(error.errors?.[0]?.title ?? 'Erro ao remover fundo');
  }

  const arrayBuffer = await result.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  const resultBase64 = btoa(binaryString);
  return `data:image/png;base64,${resultBase64}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Verifica se o plano do lojista dá direito a remover fundo de imagem
export async function checkRemoveBgUsage(uid: string, plan: PlanId): Promise<boolean> {
  return (REMOVE_BG_LIMITS[plan] ?? 0) > 0;
}
