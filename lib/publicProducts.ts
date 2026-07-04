import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { toCloudinaryFetchUrl } from './cloudinary';

export const PUBLIC_PRODUCTS_DATA = [
  // Alimentos
  { name: 'Arroz Branco 5kg', price: 24.90, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
  { name: 'Feijão Carioca 1kg', price: 8.99, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1604155798197-b4c4d21c3a6c?w=400&q=80' },
  { name: 'Macarrão Espaguete 500g', price: 4.49, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80' },
  { name: 'Óleo de Soja 900ml', price: 6.99, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { name: 'Açúcar Cristal 5kg', price: 18.90, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1561304429-94a5e96c5618?w=400&q=80' },
  { name: 'Café Torrado 500g', price: 15.90, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80' },
  { name: 'Leite Integral 1L', price: 4.99, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80' },
  { name: 'Manteiga 200g', price: 9.90, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80' },
  { name: 'Ovos Caipiras 12un', price: 12.90, category: 'Alimentos', imageUrl: 'https://images.unsplash.com/photo-1518569656558-1f25e69d2d2d?w=400&q=80' },
  // Bebidas
  { name: 'Refrigerante Cola 2L', price: 9.90, category: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
  { name: 'Suco de Laranja 1L', price: 7.49, category: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
  { name: 'Água Mineral 6x1.5L', price: 14.90, category: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80' },
  { name: 'Cerveja Long Neck 355ml', price: 4.49, category: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80' },
  // Limpeza
  { name: 'Detergente 500ml', price: 2.49, category: 'Limpeza', imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80' },
  { name: 'Sabão em Pó 1kg', price: 12.90, category: 'Limpeza', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { name: 'Amaciante 2L', price: 11.90, category: 'Limpeza', imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=400&q=80' },
  // Higiene
  { name: 'Shampoo 400ml', price: 11.90, category: 'Higiene', imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80' },
  { name: 'Sabonete 90g (4un)', price: 8.90, category: 'Higiene', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80' },
  { name: 'Creme Dental 90g', price: 6.49, category: 'Higiene', imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&q=80' },
  // Frios
  { name: 'Presunto Cozido 200g', price: 9.90, category: 'Frios', imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92a03a05?w=400&q=80' },
  { name: 'Mortadela Bologna 200g', price: 7.90, category: 'Frios', imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80' },
  { name: 'Linguiça Toscana 500g', price: 13.90, category: 'Frios', imageUrl: 'https://images.unsplash.com/photo-1588347785102-2944b0df8900?w=400&q=80' },
  // Padaria
  { name: 'Pão de Forma 500g', price: 7.49, category: 'Padaria', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80' },
  { name: 'Biscoito Recheado 120g', price: 3.49, category: 'Padaria', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
];

export async function seedPublicProducts(): Promise<void> {
  const snap = await getDocs(collection(db, 'public_products'));
  if (!snap.empty) return;

  const batch = writeBatch(db);
  PUBLIC_PRODUCTS_DATA.forEach((product) => {
    const ref = doc(collection(db, 'public_products'));
    batch.set(ref, { ...product, imageUrl: toCloudinaryFetchUrl(product.imageUrl) });
  });
  await batch.commit();
}
