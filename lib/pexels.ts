// Busca imagens de produtos via Pexels API
// Gratuita, alta qualidade, sem watermark para uso comercial
// Documentação: https://www.pexels.com/api/documentation/

const PEXELS_KEY = process.env.EXPO_PUBLIC_PEXELS_KEY ?? '';

export interface PexelsPhoto {
  id: number;
  url: string;
  thumbnailUrl: string;
  photographer: string;
  width: number;
  height: number;
}

export async function searchPexels(query: string, page: number = 1, perPage: number = 20): Promise<{
  photos: PexelsPhoto[];
  totalResults: number;
  hasMore: boolean;
}> {
  if (!PEXELS_KEY) throw new Error('Chave Pexels não configurada');

  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodedQuery}&page=${page}&per_page=${perPage}&orientation=square`,
    { headers: { Authorization: PEXELS_KEY } },
  );

  if (!response.ok) throw new Error('Erro ao buscar imagens');

  const data = await response.json();

  return {
    photos: data.photos.map((p: any) => ({
      id: p.id,
      url: p.src.large,
      thumbnailUrl: p.src.medium,
      photographer: p.photographer,
      width: p.width,
      height: p.height,
    })),
    totalResults: data.total_results,
    hasMore: data.page * perPage < data.total_results,
  };
}

// Busca curada para produtos de supermercado/importados
export const PRODUCT_SEARCH_SUGGESTIONS = [
  'smartphone', 'perfume', 'chocolate', 'wine bottle', 'shoes',
  'headphones', 'coffee', 'cosmetics', 'watch', 'handbag',
  'rice bag', 'cooking oil', 'cleaning products', 'toys',
  'clothing', 'electronics', 'food products', 'beverages',
];
