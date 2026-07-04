export const Colors = {
  // Primárias — gradiente azul do logo
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#7C3AED',
  primaryGradient: ['#2563EB', '#7C3AED'] as const,
  primaryGradientDark: ['#1D4ED8', '#6D28D9'] as const,

  // Fundos
  background: '#F0F4FF',
  backgroundDark: '#0F172A',
  card: '#FFFFFF',
  cardDark: '#1E293B',

  // Textos
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Tab bar
  tabBarBg: '#FFFFFF',
  tabBarActive: '#2563EB',
  tabBarInactive: '#94A3B8',

  // Bordas e sombras
  border: '#E2E8F0',
  shadow: '#2563EB',
} as const;
