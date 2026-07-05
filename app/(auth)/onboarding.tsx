import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  Store, MapPin, Camera, ArrowLeft, Check, ImagePlus,
} from 'lucide-react-native';
import { useMarket, MarketSegment, MarketCountry } from '../../hooks/useMarket';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { AppCurrency } from '../../types';

const SEGMENTS: MarketSegment[] = [
  'Supermercado', 'Perfumaria', 'Eletrônicos', 'Roupas', 'Calçados',
  'Importados', 'Farmácia', 'Papelaria', 'Brinquedos', 'Outro',
];

const COUNTRIES: MarketCountry[] = ['Brasil', 'Paraguai', 'Outro'];

const STEP_CONTENT: Record<number, {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle: string;
}> = {
  1: { icon: Store, title: 'Configure sua loja', subtitle: 'Vamos conhecer melhor o seu negócio' },
  2: { icon: MapPin, title: 'Moeda e localização', subtitle: 'Isso ajuda a calcular seus preços certinho' },
  3: { icon: Camera, title: 'Capriche na primeira impressão', subtitle: 'Adicione a logo da sua loja' },
};

function Stepper({ step }: { step: number }) {
  return (
    <View style={styles.stepperRow}>
      {[1, 2, 3].map((s, idx) => (
        <View key={s} style={styles.stepperItem}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            {step > s
              ? <Check size={14} color="#fff" strokeWidth={3} />
              : <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>}
          </View>
          {idx < 2 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const { createMarket } = useMarket();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [segment, setSegment] = useState<MarketSegment | null>(null);
  const [currency, setCurrency] = useState<AppCurrency | null>(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState<MarketCountry | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { icon: HeaderIcon, title, subtitle } = STEP_CONTENT[step];

  const goNext = () => {
    if (step === 1) {
      if (!name.trim()) { Alert.alert('Erro', 'Digite o nome do seu estabelecimento.'); return; }
      if (!segment) { Alert.alert('Erro', 'Selecione o segmento da sua loja.'); return; }
    }
    if (step === 2) {
      if (!currency) { Alert.alert('Erro', 'Selecione a moeda preferida.'); return; }
      if (!country) { Alert.alert('Erro', 'Selecione o país.'); return; }
    }
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Permita acesso à galeria para escolher a logo.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setLogoUri(result.assets[0].uri);
  };

  const handleFinish = async () => {
    if (!segment || !currency || !country) return;
    setLoading(true);
    try {
      await createMarket({
        name: name.trim(),
        segment,
        currency,
        city: city.trim(),
        country,
        logoUri,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <LinearGradient colors={['#1A0A4D', Colors.primary]} style={styles.header}>
          {step > 1 && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          <View style={styles.iconBox}>
            <HeaderIcon size={36} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub}>{subtitle}</Text>
          <Stepper step={step} />
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {step === 1 && (
              <>
                <Text style={styles.label}>Nome do estabelecimento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Mercado do João"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                  autoFocus
                />

                <Text style={[styles.label, styles.labelSpaced]}>Segmento</Text>
                <View style={styles.chipsWrap}>
                  {SEGMENTS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSegment(s)}
                      activeOpacity={0.7}
                      style={[styles.chip, segment === s && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, segment === s && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.label}>Moeda preferida</Text>
                <View style={styles.currencyRow}>
                  <TouchableOpacity
                    onPress={() => setCurrency('BRL')}
                    activeOpacity={0.85}
                    style={[styles.currencyBtn, currency === 'BRL' && styles.currencyBtnActive]}
                  >
                    <Text style={[styles.currencySymbol, currency === 'BRL' && styles.currencyTextActive]}>R$</Text>
                    <Text style={[styles.currencyLabel, currency === 'BRL' && styles.currencyTextActive]}>Real</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCurrency('PYG')}
                    activeOpacity={0.85}
                    style={[styles.currencyBtn, currency === 'PYG' && styles.currencyBtnActive]}
                  >
                    <Text style={[styles.currencySymbol, currency === 'PYG' && styles.currencyTextActive]}>₲</Text>
                    <Text style={[styles.currencyLabel, currency === 'PYG' && styles.currencyTextActive]}>Guarani</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, styles.labelSpaced]}>Cidade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Foz do Iguaçu"
                  placeholderTextColor={Colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                  maxLength={50}
                />

                <Text style={[styles.label, styles.labelSpaced]}>País</Text>
                <View style={styles.chipsWrap}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCountry(c)}
                      activeOpacity={0.7}
                      style={[styles.chip, country === c && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, country === c && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {step === 3 && (
              <View style={styles.logoStep}>
                <TouchableOpacity onPress={handlePickLogo} activeOpacity={0.8} style={styles.logoPicker}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logoPreview} contentFit="cover" />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <ImagePlus size={28} color={Colors.primary} />
                    </View>
                  )}
                  <View style={styles.logoBadge}>
                    <Camera size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.logoHint}>Toque para escolher uma logo</Text>
                <Text style={styles.laterHint}>Você pode adicionar depois nas configurações</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={step === 3 ? handleFinish : goNext}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.btnWrapper}
            >
              <LinearGradient colors={Colors.primaryGradient} style={styles.btn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>{step === 3 ? 'Começar a usar o Tab! 🚀' : 'Avançar'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: Layout.spacing['2xl'] },
  header: {
    padding: Layout.spacing['3xl'],
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: Layout.spacing.lg,
    top: 56,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#fff', textAlign: 'center' },
  headerSub: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
  },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#fff' },
  stepDotText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  stepDotTextActive: { color: Colors.primary },
  stepLine: {
    width: 32, height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: '#fff' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.xl,
    margin: Layout.spacing.lg,
    marginTop: -32,
    padding: Layout.spacing['2xl'],
    ...Layout.shadow.button,
  },
  label: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Layout.spacing.sm,
  },
  labelSpaced: { marginTop: Layout.spacing.xl },
  input: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md, height: 52,
    fontFamily: 'Inter_400Regular', fontSize: 16,
    color: Colors.text,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  chipTextActive: { color: '#fff' },
  currencyRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  currencyBtn: {
    flex: 1,
    height: 88,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  currencySymbol: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.text,
  },
  currencyLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  currencyTextActive: { color: Colors.primary },
  logoStep: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
  },
  logoPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  logoHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
    marginTop: Layout.spacing.md,
  },
  laterHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Layout.spacing.lg,
  },
  btnWrapper: { marginTop: Layout.spacing['2xl'] },
  btn: {
    height: 52, borderRadius: Layout.borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    ...Layout.shadow.button,
  },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
});
