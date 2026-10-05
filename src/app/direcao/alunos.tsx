import { Redirect, router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { createAluno, deleteAluno, listAlunos, listTurmas, updateAluno } from '@/services/school-service';
import { canManageAlunos, homeRouteForRole } from '@/types/auth';
import type { Aluno, Turma } from '@/types/school';

export default function DirecaoAlunosScreen() {
  const { user, isLoading } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [nome, setNome] = useState('');
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [nextAlunos, nextTurmas] = await Promise.all([listAlunos(), listTurmas()]);
    setAlunos(nextAlunos);
    setTurmas(nextTurmas);
  }, []);

  useEffect(() => {
    if (!user || !canManageAlunos(user.role)) return;
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar alunos.');
    });
  }, [user, refresh]);

  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (!canManageAlunos(user.role)) return <Redirect href={homeRouteForRole(user.role)} />;

  function turmaNome(id: string | null) {
    if (!id) return 'Sem turma';
    return turmas.find((turma) => turma.id === id)?.nome ?? 'Turma removida';
  }

  async function handleSave() {
    if (!nome.trim()) {
      setError('Informe o nome do aluno.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) await updateAluno(editing.id, nome, turmaId);
      else await createAluno(nome, turmaId);
      setNome('');
      setTurmaId(null);
      setEditing(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o aluno.');
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(aluno: Aluno) {
    Alert.alert('Excluir aluno?', `Remover ${aluno.nome}? Vínculos serão removidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          deleteAluno(aluno.id)
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
            <ThemedText style={styles.back}>‹ Voltar</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>Alunos</ThemedText>
          <View style={authStyles.form}>
            <AuthField
              label={editing ? 'Editar aluno' : 'Novo aluno'}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do aluno"
            />
            <ThemedText type="smallBold">Turma (opcional)</ThemedText>
            <View style={styles.roleGrid}>
              <Pressable
                onPress={() => setTurmaId(null)}
                style={[styles.roleOption, turmaId === null && styles.roleOptionSelected]}>
                <ThemedText type="smallBold">Sem turma</ThemedText>
              </Pressable>
              {turmas.map((turma) => (
                <Pressable
                  key={turma.id}
                  onPress={() => setTurmaId(turma.id)}
                  style={[styles.roleOption, turmaId === turma.id && styles.roleOptionSelected]}>
                  <ThemedText type="smallBold">{turma.nome}</ThemedText>
                </Pressable>
              ))}
            </View>
            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
            <PrimaryButton title={editing ? 'Salvar alterações' : 'Criar aluno'} onPress={handleSave} disabled={busy} />
            {editing && (
              <PrimaryButton
                title="Cancelar edição"
                onPress={() => {
                  setEditing(null);
                  setNome('');
                  setTurmaId(null);
                }}
                disabled={busy}
              />
            )}
          </View>
          <View style={styles.list}>
            {alunos.map((aluno) => (
              <View key={aluno.id} style={styles.card}>
                <View style={styles.cardCopy}>
                  <ThemedText type="smallBold">{aluno.nome}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{turmaNome(aluno.turma_id)}</ThemedText>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => {
                      setEditing(aluno);
                      setNome(aluno.nome);
                      setTurmaId(aluno.turma_id);
                    }}>
                    <ThemedText style={styles.link}>Editar</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(aluno)}>
                    <ThemedText style={styles.danger}>Excluir</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))}
            {alunos.length === 0 && (
              <ThemedText themeColor="textSecondary">Nenhum aluno cadastrado.</ThemedText>
            )}
          </View>
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
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: BrandColors.backgroundElement,
    ...Shadows.card,
    gap: Spacing.two,
  },
  cardCopy: { gap: Spacing.one },
  actions: { flexDirection: 'row', gap: Spacing.four },
  link: { color: BrandColors.brand, fontWeight: '700' },
  danger: { color: BrandColors.danger, fontWeight: '700' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  roleOption: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  roleOptionSelected: {
    borderColor: BrandColors.brand,
    backgroundColor: BrandColors.brandSoft,
  },
});
