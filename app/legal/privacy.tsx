import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Última atualização: junho de 2025</Text>

        <Section title="1. Dados que Coletamos">
          <P>
            Ao utilizar o Tab, coletamos os seguintes dados:{'\n\n'}
            • Dados de conta: endereço de e-mail e senha (armazenada de forma criptografada){'\n'}
            • Dados do negócio: nome do mercado, logotipo{'\n'}
            • Produtos cadastrados: nome, preço, custo, categoria, imagens{'\n'}
            • Tabloides criados: título, layout, conteúdo visual{'\n'}
            • Dados de uso: interações com o app, horários de acesso{'\n'}
            • Dados de dispositivo: sistema operacional, versão do app
          </P>
        </Section>

        <Section title="2. Como Usamos seus Dados">
          <P>
            Utilizamos seus dados exclusivamente para:{'\n\n'}
            • Fornecer e melhorar os serviços do Tab{'\n'}
            • Calcular preços com base na cotação do dólar{'\n'}
            • Enviar alertas de variação cambial (se configurado){'\n'}
            • Suporte técnico e atendimento ao cliente{'\n'}
            • Análise de performance e melhoria do produto{'\n\n'}
            Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros
            para fins de marketing.
          </P>
        </Section>

        <Section title="3. Processadores de Dados">
          <P>
            Para prestar nossos serviços, utilizamos os seguintes parceiros:{'\n\n'}
            • Firebase / Google: autenticação, banco de dados, hospedagem{'\n'}
            • Cloudinary: armazenamento e otimização de imagens{'\n'}
            • Google Gemini: assistente de IA para sugestões de conteúdo{'\n\n'}
            Todos os parceiros estão em conformidade com regulamentos de proteção de dados
            aplicáveis (LGPD, GDPR).
          </P>
        </Section>

        <Section title="4. Armazenamento e Segurança">
          <P>
            Seus dados são armazenados em servidores seguros da Google (Firebase) localizados
            nos EUA e/ou na União Europeia. Utilizamos criptografia em trânsito (HTTPS/TLS)
            e em repouso para proteger suas informações.
          </P>
        </Section>

        <Section title="5. Retenção de Dados">
          <P>
            Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta,
            seus dados são removidos permanentemente em até 30 dias, exceto onde a retenção
            for exigida por lei.
          </P>
        </Section>

        <Section title="6. Seus Direitos (LGPD)">
          <P>
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:{'\n\n'}
            • Confirmação da existência do tratamento de dados{'\n'}
            • Acesso aos dados que temos sobre você{'\n'}
            • Correção de dados incompletos ou incorretos{'\n'}
            • Exclusão de dados desnecessários{'\n'}
            • Portabilidade dos seus dados{'\n'}
            • Revogação do consentimento a qualquer momento{'\n\n'}
            Para exercer esses direitos, entre em contato: privacidade@tabapp.com.br
          </P>
        </Section>

        <Section title="7. Cookies e Tecnologias Similares">
          <P>
            O aplicativo utiliza armazenamento local (AsyncStorage) para manter sua sessão
            ativa e salvar preferências. Não utilizamos cookies de rastreamento de terceiros.
          </P>
        </Section>

        <Section title="8. Crianças">
          <P>
            O Tab é destinado exclusivamente a maiores de 18 anos ou empreendedores com
            capacidade jurídica para celebrar contratos. Não coletamos intencionalmente
            dados de menores de 13 anos.
          </P>
        </Section>

        <Section title="9. Contato">
          <P>
            Controlador de dados: Tab Tecnologia LTDA{'\n'}
            Encarregado de dados: privacidade@tabapp.com.br{'\n'}
            Para dúvidas gerais: suporte@tabapp.com.br
          </P>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text },
  scroll: { paddingHorizontal: Layout.spacing.lg, paddingTop: Layout.spacing.lg },
  lastUpdated: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted,
    marginBottom: Layout.spacing.lg,
  },
  section: { marginBottom: Layout.spacing['2xl'] },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text, marginBottom: 10 },
  paragraph: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted,
    lineHeight: 22,
  },
});
