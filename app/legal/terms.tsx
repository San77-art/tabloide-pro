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

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos de Uso</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Última atualização: junho de 2025</Text>

        <Section title="1. Sobre o Serviço">
          <P>
            O Tab é um aplicativo de criação de tabloides digitais desenvolvido para lojistas,
            comerciantes e empreendedores que desejam divulgar suas ofertas de forma profissional.
            O serviço é prestado por Tab Tecnologia LTDA.
          </P>
        </Section>

        <Section title="2. Aceitação dos Termos">
          <P>
            Ao criar uma conta e utilizar o Tab, você concorda com estes Termos de Uso e com nossa
            Política de Privacidade. Caso não concorde, interrompa o uso imediatamente.
          </P>
        </Section>

        <Section title="3. Planos e Preços">
          <P>
            O Tab oferece os seguintes planos:{'\n\n'}
            • Gratuito: até 10 produtos, recursos básicos de criação.{'\n'}
            • Pro: até 100 produtos, alertas de cotação, recursos avançados.{'\n'}
            • Business: produtos ilimitados, reajuste automático, suporte prioritário.{'\n\n'}
            Os preços estão sujeitos a alteração mediante aviso prévio de 30 dias.
          </P>
        </Section>

        <Section title="4. Responsabilidades do Usuário">
          <P>
            O usuário é responsável por:{'\n'}
            • Manter suas credenciais de acesso em sigilo;{'\n'}
            • Garantir a veracidade das informações cadastradas;{'\n'}
            • Utilizar o serviço apenas para fins legais;{'\n'}
            • Não reproduzir conteúdo protegido por direitos autorais sem autorização;{'\n'}
            • Manter backups de seus dados quando necessário.
          </P>
        </Section>

        <Section title="5. Conteúdo do Usuário">
          <P>
            Você retém a propriedade de todo conteúdo criado no Tab (tabloides, produtos, imagens).
            Ao utilizar o serviço, você concede ao Tab uma licença limitada para armazenar e
            exibir esse conteúdo exclusivamente para fins de prestação do serviço.
          </P>
        </Section>

        <Section title="6. Limitação de Responsabilidade">
          <P>
            O Tab não se responsabiliza por:{'\n'}
            • Perdas de dados decorrentes de falhas técnicas ou do usuário;{'\n'}
            • Decisões comerciais tomadas com base nas informações do app;{'\n'}
            • Variações de cotação de moeda que afetem os preços calculados;{'\n'}
            • Indisponibilidade temporária do serviço por manutenção.
          </P>
        </Section>

        <Section title="7. Cancelamento e Exclusão">
          <P>
            Você pode cancelar sua conta a qualquer momento diretamente no aplicativo.
            Ao excluir sua conta, todos os dados serão removidos permanentemente de nossos
            servidores em até 30 dias.
          </P>
        </Section>

        <Section title="8. Alterações nos Termos">
          <P>
            Podemos atualizar estes termos periodicamente. Você será notificado sobre alterações
            significativas através do e-mail cadastrado. O uso continuado após notificação
            constitui aceitação dos novos termos.
          </P>
        </Section>

        <Section title="9. Contato">
          <P>
            Para dúvidas sobre estes termos, entre em contato:{'\n'}
            E-mail: suporte@tabapp.com.br{'\n'}
            Horário: segunda a sexta, 9h às 18h (horário de Brasília)
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
