import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Tag, ExternalLink, Megaphone } from 'lucide-react-native';
import { useAds, Ad } from '../../hooks/useAds';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const BANNER_INTERVAL_MS = 4000;
const ADVERTISE_WHATSAPP_MESSAGE = 'Olá! Quero anunciar minha marca no app Tab.';

async function openWhatsApp(message: string) {
  const encoded = encodeURIComponent(message);
  try {
    const canOpen = await Linking.canOpenURL(`whatsapp://send?text=${encoded}`);
    if (canOpen) {
      await Linking.openURL(`whatsapp://send?text=${encoded}`);
      return;
    }
  } catch {
    // segue para o fallback web
  }
  await Linking.openURL(`https://wa.me/?text=${encoded}`);
}

function BannerCarousel({ ads }: { ads: Ad[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ads.length);
    }, BANNER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;
  const ad = ads[index % ads.length];

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.9}
      onPress={() => ad.ctaUrl && Linking.openURL(ad.ctaUrl)}
    >
      {ad.imageUrl ? (
        <Image source={{ uri: ad.imageUrl }} style={styles.bannerImage} contentFit="cover" />
      ) : (
        <LinearGradient colors={Colors.primaryGradient} style={styles.bannerImage} />
      )}
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle} numberOfLines={2}>{ad.title}</Text>
        <Text style={styles.bannerBrand}>{ad.brandName}</Text>
      </View>
      {ads.length > 1 && (
        <View style={styles.bannerDots}>
          {ads.map((_, i) => (
            <View key={i} style={[styles.bannerDot, i === index && styles.bannerDotActive]} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function AdCard({ ad }: { ad: Ad }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {ad.logoUrl ? (
          <Image source={{ uri: ad.logoUrl }} style={styles.cardLogo} contentFit="cover" />
        ) : (
          <View style={styles.cardLogoFallback}>
            <Tag size={16} color={Colors.primary} />
          </View>
        )}
        <Text style={styles.cardBrand} numberOfLines={1}>{ad.brandName}</Text>
      </View>
      <Text style={styles.cardTitle}>{ad.title}</Text>
      <Text style={styles.cardDescription}>{ad.description}</Text>
      <TouchableOpacity
        style={styles.ctaBtn}
        activeOpacity={0.85}
        onPress={() => ad.ctaUrl && Linking.openURL(ad.ctaUrl)}
      >
        <Text style={styles.ctaBtnText}>{ad.ctaText}</Text>
        <ExternalLink size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function PromotionsScreen() {
  const { ads, loading } = useAds();
  const bannerAds = ads.slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Promoções & Parceiros</Text>
        <Text style={styles.headerSubtitle}>Ofertas exclusivas para você</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!loading && <BannerCarousel ads={bannerAds} />}

        <Text style={styles.sectionLabel}>Ofertas para sua loja</Text>
        {!loading && ads.length === 0 && (
          <View style={styles.emptyCard}>
            <Tag size={22} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma oferta disponível no momento.</Text>
          </View>
        )}
        {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}

        <View style={styles.advertiseCard}>
          <Megaphone size={22} color={Colors.primary} />
          <Text style={styles.advertiseTitle}>Anuncie aqui</Text>
          <Text style={styles.advertiseText}>
            Sua marca pode aparecer para milhares de lojistas que usam o Tab todos os dias.
          </Text>
          <TouchableOpacity
            style={styles.advertiseBtn}
            activeOpacity={0.85}
            onPress={() => openWhatsApp(ADVERTISE_WHATSAPP_MESSAGE)}
          >
            <Text style={styles.advertiseBtnText}>Quero anunciar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Os anúncios ajudam a manter o Tab gratuito para todos os lojistas 💙</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Layout.spacing.lg, paddingVertical: 18 },
  headerTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: '#fff' },
  headerSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  scroll: { padding: Layout.spacing.lg, paddingBottom: 32 },
  banner: {
    height: 160, borderRadius: Layout.borderRadius.lg, overflow: 'hidden',
    marginBottom: Layout.spacing.xl, ...Layout.shadow.card,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(15,23,42,0.55)', padding: Layout.spacing.md,
  },
  bannerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff' },
  bannerBrand: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  bannerDots: {
    position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 4,
  },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  bannerDotActive: { backgroundColor: '#fff' },
  sectionLabel: {
    fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.text, marginBottom: Layout.spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl, alignItems: 'center', gap: 8, marginBottom: Layout.spacing.lg,
  },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg, marginBottom: Layout.spacing.md, ...Layout.shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardLogo: { width: 28, height: 28, borderRadius: 14 },
  cardLogoFallback: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBrand: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted, flex: 1 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text, marginBottom: 4 },
  cardDescription: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 14 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md, paddingVertical: 11,
  },
  ctaBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },
  advertiseCard: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl, alignItems: 'center', marginTop: Layout.spacing.md,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  advertiseTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.text, marginTop: 8, marginBottom: 4 },
  advertiseText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  advertiseBtn: {
    backgroundColor: Colors.secondary, borderRadius: Layout.borderRadius.md,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  advertiseBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },
  footer: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted,
    textAlign: 'center', marginTop: Layout.spacing.xl, lineHeight: 17,
  },
});
