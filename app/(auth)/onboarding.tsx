import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Store } from 'lucide-react-native';
import { useMarket } from '../../hooks/useMarket';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export default function OnboardingScreen() {
  const { createMarket } = useMarket();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Erro', 'Digite o nome do seu mercado.'); return; }
    setLoading(true);
    try {
      await createMarket(name.trim());
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
          <View style={styles.iconBox}>
            <Store size={40} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Configure seu mercado</Text>
          <Text style={styles.headerSub}>Esse é o primeiro passo para criar seus tabloides de ofertas</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.label}>Nome do mercado</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Mercado do João"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoFocus
          />
          <Text style={styles.hint}>Esse nome aparecerá nos seus tabloides</Text>

          <TouchableOpacity onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={Colors.primaryGradient} style={styles.btn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Começar agora 🚀</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1 },
  header: {
    padding: Layout.spacing['3xl'],
    paddingTop: 60,
    paddingBottom: 80,
    alignItems: 'center',
  },
  iconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#fff', textAlign: 'center' },
  headerSub: {
    fontFamily: 'Inter_400Regular', fontSize: 14,
    color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.xl,
    margin: Layout.spacing.lg,
    marginTop: -40,
    padding: Layout.spacing['2xl'],
    ...Layout.shadow.button,
  },
  label: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Layout.spacing.sm,
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md, height: 52,
    fontFamily: 'Inter_400Regular', fontSize: 16,
    color: Colors.text, marginBottom: 8,
  },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: Layout.spacing['2xl'] },
  btn: {
    height: 52, borderRadius: Layout.borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    ...Layout.shadow.button,
  },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
});
