// Categorias típicas de produtos importados de fronteira (Pedro Juan Caballero, Ciudad del Este).
export const PRODUCT_CATEGORIES = [
  'Eletrônicos',
  'Perfumaria',
  'Brinquedos',
  'Roupas',
  'Calçados',
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Higiene',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
