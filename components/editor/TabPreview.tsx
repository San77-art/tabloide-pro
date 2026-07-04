import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Product } from '../../types';
import { TitleSize } from '../../stores/useTabStore';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const TITLE_FONT_SIZES: Record<TitleSize, number> = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 30,
};

interface TabPreviewProps {
  title: string;
  products: Product[];
  marketName: string;
  validUntil: string;
  gradient?: [string, string] | null;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  textColor?: string;
  titleSize?: TitleSize;
  elements?: string[];
  showWatermark?: boolean;
}

function ProductCell({ product }: { product: Product }) {
  const intPart = Math.floor(product.price).toString();
  const centsPart = (product.price % 1).toFixed(2).slice(1);

  return (
    <View style={styles.productCell}>
      <View style={styles.productImagePlaceholder}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} contentFit="cover" />
        ) : (
          <Text style={styles.productEmoji}>🛒</Text>
        )}
      </View>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.pricePrefix}>R$</Text>
        <Text style={styles.priceInt}>{intPart}</Text>
        <Text style={styles.priceCents}>{centsPart}</Text>
      </View>
    </View>
  );
}

export function TabPreview({
  title,
  products,
  marketName,
  validUntil,
  gradient = ['#1A0A4D', '#2563EB'],
  backgroundColor = '#2563EB',
  backgroundImageUrl,
  textColor = '#F59E0B',
  titleSize = 'lg',
  elements = [],
  showWatermark = false,
}: TabPreviewProps) {
  const displayProducts = products.slice(0, 4);
  const titleFontSize = TITLE_FONT_SIZES[titleSize];

  const content = (
    <>
      {backgroundImageUrl && (
        <Image source={{ uri: backgroundImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      {backgroundImageUrl && <View style={styles.imageOverlay} />}

      {elements.length > 0 && (
        <View style={styles.elementsRow}>
          {elements.map((el, i) => (
            <View key={i} style={styles.elementBadge}>
              <Text style={styles.elementText}>{el}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.starburst}>
        <Text style={styles.starburstText}>OFERTA{'\n'}IMPERDÍVEL</Text>
      </View>

      <Text style={[styles.title, { color: textColor, fontSize: titleFontSize }]}>{title}</Text>
      <View style={[styles.dividerLine, { backgroundColor: textColor }]} />

      <View style={styles.grid}>
        {displayProducts.map((product) => (
          <ProductCell key={product.id} product={product} />
        ))}
        {displayProducts.length === 0 && (
          <View style={styles.emptyGrid}>
            <Text style={styles.emptyText}>Selecione produtos para visualizar</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLogo}>🏪 {marketName}</Text>
        <Text style={styles.footerDate}>Ofertas válidas até {validUntil}</Text>
      </View>
      {showWatermark && (
        <Text style={styles.watermark}>Criado com Tab</Text>
      )}
    </>
  );

  if (backgroundImageUrl) {
    return (
      <View style={styles.container}>
        <View style={[styles.preview, { backgroundColor: backgroundColor }]}>
          {content}
        </View>
      </View>
    );
  }

  if (gradient) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradient} style={styles.preview}>
          {content}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.preview, { backgroundColor }]}>
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Layout.shadow.button,
  },
  preview: {
    padding: 16,
    minHeight: 340,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  elementsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginBottom: 8, zIndex: 5,
  },
  elementBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
  },
  elementText: {
    fontFamily: 'Poppins_700Bold', fontSize: 9, color: Colors.text,
  },
  starburst: {
    position: 'absolute',
    top: 12, right: 12,
    width: 64, height: 64,
    backgroundColor: Colors.warning,
    borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  starburstText: {
    fontFamily: 'Poppins_900Black', fontSize: 8,
    color: Colors.text, textAlign: 'center', lineHeight: 10,
  },
  title: {
    fontFamily: 'Poppins_900Black',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 8, marginBottom: 8,
    paddingRight: 60,
    zIndex: 1,
  },
  dividerLine: {
    height: 2,
    marginBottom: 12,
    opacity: 0.5,
    zIndex: 1,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, flex: 1, zIndex: 1,
  },
  productCell: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Layout.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
  },
  productImagePlaceholder: {
    width: 56, height: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Layout.borderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 28 },
  productName: {
    fontFamily: 'Inter_500Medium', fontSize: 10,
    color: '#fff', textAlign: 'center', lineHeight: 13, marginBottom: 4,
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  pricePrefix: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: Colors.warning, marginTop: 3 },
  priceInt: { fontFamily: 'Poppins_900Black', fontSize: 22, color: Colors.warning, lineHeight: 26 },
  priceCents: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: Colors.warning, marginTop: 3 },
  emptyGrid: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: 'rgba(255,255,255,0.6)', textAlign: 'center',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8, zIndex: 1,
  },
  footerLogo: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#fff' },
  footerDate: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  watermark: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 4,
    zIndex: 1,
  },
});
