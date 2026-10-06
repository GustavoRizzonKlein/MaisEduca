import { Redirect, router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { createTurma, deleteTurma, listTurmas, updateTurma } from '@/services/school-service';
import { canManageTurmas, homeRouteForRole } from '@/types/auth';
import type { Turma } from '@/types/school';

export default function DirecaoTurmasScreen() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [nome, setNome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTurmas(await listTurmas());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !canManageTurmas(user.role)) return;
    refresh().catch((err: unknown) => {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar as turmas. Tente novamente.');
    });
  }, [user, refresh]);

  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (!canManageTurmas(user.role)) return <Redirect href={homeRouteForRole(user.role)} />;

  async function handleSave() {
    if (!nome.trim()) {
      setError('Informe o nome da turma.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) await updateTurma(editing.id, nome);
      else await createTurma(nome);
      setNome('');
      setEditing(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a turma.');
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(turma: Turma) {
    Alert.alert('Excluir turma?', `Remover ${turma.nome}? Vínculos com professores serão removidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          deleteTurma(turma.id)
            .then(refresh)
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : 'Não foi possível excluir.');
            })
            .finally(() => setBusy(false));
        },
      },
    ]);
  }

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.replace('/direcao' as Href)}>
            <ThemedText style={[styles.back, { color: theme.brand }]}>‹ Voltar</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>Turmas</ThemedText>
          <ThemedText themeColor="textSecondary">Escolha uma turma para visualizar e cadastrar seus alunos.</ThemedText>
          {loadError && (
            <View style={styles.loadError}>
              <ThemedText style={authStyles.error}>{loadError}</ThemedText>
              <PrimaryButton
                title="Tentar novamente"
                onPress={() => refresh().catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar as turmas. Tente novamente.'))}
                variant="outline"
              />
            </View>
          )}
          <View style={authStyles.form}>
            <AuthField
              label={editing ? 'Editar turma' : 'Nova turma'}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: 5º ano A"
            />
            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
            <PrimaryButton title={editing ? 'Salvar alterações' : 'Criar turma'} onPress={handleSave} loading={busy} />
            {editing && (
              <PrimaryButton
                title="Cancelar edição"
                onPress={() => {
                  setEditing(null);
                  setNome('');
                }}
                disabled={busy}
                variant="outline"
              />
            )}
          </View>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.brand} />
              <ThemedText themeColor="textSecondary">Carregando turmas...</ThemedText>
            </View>
          ) : (
            <View style={styles.list}>
              {turmas.map((turma) => (
                <View key={turma.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver alunos da turma ${turma.nome}`}
                    style={styles.openClass}
                    onPress={() => router.push(`/direcao/turmas/${turma.id}` as Href)}>
                    <ThemedText type="smallBold" style={styles.cardTitle}>{turma.nome}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.brand }}>Ver alunos ›</ThemedText>
                  </Pressable>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => {
                        setEditing(turma);
                        setNome(turma.nome);
                      }}>
                      <ThemedText style={[styles.link, { color: theme.brand }]}>Editar</ThemedText>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(turma)}>
                      <ThemedText style={[styles.danger, { color: theme.danger }]}>Excluir</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
              {turmas.length === 0 && !loadError && (
                <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <ThemedText style={[styles.emptyIcon, { color: theme.learning }]}>▦</ThemedText>
                  <ThemedText type="smallBold">Nenhuma turma cadastrada</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">Crie uma turma para começar a organizar a escola.</ThemedText>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start', gap: Spacing.three },
  back: { color: BrandColors.brand, fontWeight: '700' },
  title: { marginBottom: Spacing.one },
  list: { gap: Spacing.two, marginTop: Spacing.four },
  loading: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  loadError: { gap: Spacing.two },
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: BrandColors.backgroundElement,
    ...Shadows.card,
    gap: Spacing.two,
  },
  openClass: { gap: Spacing.one, minHeight: 44, justifyContent: 'center' },
  cardTitle: { flex: 1 },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.backgroundElement,
  },
  emptyIcon: { color: BrandColors.learning, fontSize: 24 },
  actions: { flexDirection: 'row', gap: Spacing.four },
  link: { color: BrandColors.brand, fontWeight: '700' },
  danger: { color: BrandColors.danger, fontWeight: '700' },
});
