import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function OverviewScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">
            MaisEduca
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            Um acompanhamento mais próximo
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Este protótipo acadêmico reúne recursos para aproximar professores, escola e famílias.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Etapa atual</ThemedText>
            <ThemedText style={styles.cardTitle}>Acompanhamento do professor</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Consulte alunos acompanhados e mantenha um histórico claro de observações.
            </ThemedText>
          </ThemedView>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Próximas áreas do MVP
          </ThemedText>
          <ThemedText style={styles.nextItem}>• Comunicação com famílias</ThemedText>
          <ThemedText style={styles.nextItem}>• Registro de presença e avisos de ausência</ThemedText>
          <ThemedText style={styles.nextItem}>• Visão geral para a coordenação</ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  title: {
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.five,
    gap: Spacing.one,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  nextItem: {
    marginBottom: Spacing.two,
  },
});
