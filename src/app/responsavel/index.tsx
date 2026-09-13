import { Redirect, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Spacing } from '@/constants/theme';

const professorRoute: Href = '/professor' as Href;

export default function ResponsavelHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'responsavel') return <Redirect href={professorRoute} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">Área do responsável</ThemedText>
          <ThemedText type="subtitle" style={styles.title}>Olá, {user.nome}!</ThemedText>
          <ThemedText themeColor="textSecondary">Bem-vindo ao MaisEduca.</ThemedText>
          <View style={styles.cards}>
            <Placeholder title="Agenda da criança" description="A agenda compartilhada será exibida aqui." />
            <Placeholder title="Anotações" description="Você poderá acompanhar as informações liberadas pelo professor." />
          </View>
          <PrimaryButton title="Sair" onPress={logout} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one },
  cards: { gap: Spacing.three, marginTop: Spacing.five, marginBottom: Spacing.five },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
});
