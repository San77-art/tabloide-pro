import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../lib/firebase';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { GoogleButton } from '../../components/ui/GoogleButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const { loginWithEmail, loginWithGoogle, googleReady, googleLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleGoogle = async () => {
    try {
      const result = await loginWithGoogle();
      if (result.type === 'error') {
        Alert.alert('Erro ao entrar', 'Não foi possível entrar com o Google.');
      }
    } catch (e: any) {
      Alert.alert('Erro ao entrar', e.message ?? 'Não foi possível entrar com o Google.');
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt
      ? Alert.prompt(
          'Esqueci minha senha',
          'Digite seu e-mail para receber o link de recuperação:',
          async (inputEmail) => {
            if (!inputEmail) return;
            try {
              await sendPasswordResetEmail(auth, inputEmail.trim());
              Alert.alert('E-mail enviado!', 'Verifique sua caixa de entrada para redefinir a senha.');
            } catch (e: any) {
              Alert.alert('Erro', e.message ?? 'Não foi possível enviar o e-mail.');
            }
          },
          'plain-text',
          email,
        )
      : Alert.alert(
          'Esqueci minha senha',
          'Um e-mail de recuperação será enviado para: ' + (email || '(preencha seu e-mail acima)'),
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Enviar',
              onPress: async () => {
                if (!email) { Alert.alert('Atenção', 'Preencha seu e-mail antes.'); return; }
                try {
                  await sendPasswordResetEmail(auth, email.trim());
                  Alert.alert('E-mail enviado!', 'Verifique sua caixa de entrada para redefinir a senha.');
                } catch (e: any) {
                  Alert.alert('Erro', e.message ?? 'Não foi possível enviar o e-mail.');
                }
              },
            },
          ],
        );
  };

  const handleEmail = async () => {
    if (!email || !password) { Alert.alert('Erro', 'Preencha email e senha.'); return; }
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Erro ao entrar', e.message ?? 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1D4ED8', '#0F172A']} style={styles.gradient}>
      {/* Marca d'água */}
      <Text style={styles.watermark}>Tab</Text>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>

      {/* Card inferior */}
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
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>

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
                placeholder="Sua senha"
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

            <TouchableOpacity onPress={handleEmail} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={Colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Entrar</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleButton onPress={handleGoogle} disabled={!googleReady} loading={googleLoading} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem conta? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>Criar conta</Text>
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
    bottom: SCREEN_HEIGHT * 0.35,
    right: -16,
    transform: [{ rotate: '-15deg' }],
    zIndex: 0,
  },
  safeArea: {
    zIndex: 1,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.lg,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
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
    maxHeight: SCREEN_HEIGHT * 0.72,
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
  forgotBtn: {
    alignSelf: 'center',
    marginTop: Layout.spacing.md,
  },
  forgotText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.primary,
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
    marginTop: Layout.spacing.lg,
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
