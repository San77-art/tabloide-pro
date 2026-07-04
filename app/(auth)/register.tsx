import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckSquare, Square } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { GoogleButton } from '../../components/ui/GoogleButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RegisterScreen() {
  const { registerWithEmail, loginWithGoogle, googleReady, googleLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const handleGoogle = async () => {
    if (!termsAccepted) { Alert.alert('Atenção', 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.'); return; }
    try {
      const result = await loginWithGoogle();
      if (result.type === 'error') {
        Alert.alert('Erro ao criar conta', 'Não foi possível continuar com o Google.');
      }
    } catch (e: any) {
      Alert.alert('Erro ao criar conta', e.message ?? 'Não foi possível continuar com o Google.');
    }
  };

  const handleRegister = async () => {
    if (!email || !password) { Alert.alert('Erro', 'Preencha todos os campos.'); return; }
    if (password !== confirm) { Alert.alert('Erro', 'As senhas não coincidem.'); return; }
    if (password.length < 6) { Alert.alert('Erro', 'A senha deve ter ao menos 6 caracteres.'); return; }
    if (!termsAccepted) { Alert.alert('Atenção', 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.'); return; }
    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Erro ao criar conta', e.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1D4ED8', '#0F172A']} style={styles.gradient}>
      {/* Marca d'água */}
      <Text style={styles.watermark}>Tab</Text>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.logoArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cardWrapper}
      >
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.cardScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Comece a criar seus tabloides de ofertas</Text>

            <View style={[styles.field, emailFocused && styles.fieldFocused]}>
              <Mail size={18} color={emailFocused ? Colors.primary : Colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Seu e-mail"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={[styles.field, passFocused && styles.fieldFocused]}>
              <Lock size={18} color={passFocused ? Colors.primary : Colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                {showPass
                  ? <EyeOff size={18} color={Colors.textMuted} />
                  : <Eye size={18} color={Colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <View style={[styles.field, confirmFocused && styles.fieldFocused]}>
              <Lock size={18} color={confirmFocused ? Colors.primary : Colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                placeholderTextColor={Colors.textLight}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAccepted((v) => !v)}
              activeOpacity={0.7}
            >
              {termsAccepted
                ? <CheckSquare size={20} color={Colors.primary} />
                : <Square size={20} color={Colors.border} />}
              <Text style={styles.termsText}>
                Li e aceito os{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/legal/terms')}>
                  Termos de Uso
                </Text>
                {' '}e a{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/legal/privacy')}>
                  Política de Privacidade
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={Colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Criar conta</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleButton
              onPress={handleGoogle}
              disabled={!googleReady}
              loading={googleLoading}
              label="Cadastrar com Google"
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem conta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.footerLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  watermark: {
    position: 'absolute',
    fontSize: 140,
    fontFamily: 'Poppins_900Black',
    color: 'rgba(255,255,255,0.05)',
    bottom: SCREEN_HEIGHT * 0.42,
    right: -16,
    transform: [{ rotate: '-15deg' }],
    zIndex: 0,
  },
  safeArea: {
    zIndex: 1,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: Layout.spacing.lg,
    top: Layout.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: SCREEN_HEIGHT * 0.78,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  cardScroll: {
    padding: Layout.spacing['2xl'],
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Layout.spacing['2xl'],
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md,
    height: 54,
    marginBottom: Layout.spacing.md,
  },
  fieldFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: Layout.spacing.lg,
    marginTop: Layout.spacing.sm,
  },
  termsText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  primaryBtn: {
    height: 54,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginHorizontal: Layout.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing['2xl'],
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  footerLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
  },
});
