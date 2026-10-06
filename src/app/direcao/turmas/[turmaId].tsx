import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, authStyles, PrimaryButton } from '@/components/auth-ui';
import { SurfaceCard } from '@/components/surface-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  createAlunoWithResponsavel,
  deleteAluno,
  listAlunosByTurma,
  listResponsaveisDosAlunos,
  listTurmas,
  updateAlunoWithResponsavel,
} from '@/services/school-service';
import { listManagedUsers } from '@/services/manage-users-service';
import { canManageAlunos, homeRouteForRole, type ManagedProfile } from '@/types/auth';
import type { Aluno, Turma } from '@/types/school';

export default function DirecaoTurmaAlunosScreen() {
  const { turmaId: routeTurmaId } = useLocalSearchParams<{ turmaId: string | string[] }>();
  const turmaId = Array.isArray(routeTurmaId) ? routeTurmaId[0] : routeTurmaId;
  const { user, isLoading: authLoading } = useAuth();
  const theme = useTheme();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [responsaveis, setResponsaveis] = useState<ManagedProfile[]>([]);
  const [responsavelPorAluno, setResponsavelPorAluno] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showResponsaveis, setShowResponsaveis] = useState(false);
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [nome, setNome] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [busy, setBusy] = useState(false);

  const responsavelById = useMemo(
    () => new Map(responsaveis.map((responsavel) => [responsavel.id, responsavel.nome])),
    [responsaveis],
  );

  const refresh = useCallback(async () => {
    if (!turmaId) throw new Error('Não foi possível identificar a turma.');
    setLoading(true);
    setError(null);
    try {
      const [turmas, nextAlunos, users] = await Promise.all([
        listTurmas(),
        listAlunosByTurma(turmaId),
        listManagedUsers(),
      ]);
      const selectedTurma = turmas.find((item) => item.id === turmaId);
      if (!selectedTurma) throw new Error('Turma não encontrada ou indisponível.');

      const nextResponsaveis = users.filter((profile) => profile.role === 'responsavel');
      const associations = await listResponsaveisDosAlunos(nextAlunos.map((aluno) => aluno.id));
      setTurma(selectedTurma);
      setAlunos(nextAlunos);
      setResponsaveis(nextResponsaveis);
      setResponsavelPorAluno(Object.fromEntries(associations.map(({ aluno_id, responsavel_id }) => [aluno_id, responsavel_id])));
    } finally {
      setLoading(false);
    }
  }, [turmaId]);

  useEffect(() => {
    if (!user || !canManageAlunos(user.role)) return;
    refresh().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados. Tente novamente.');
    });
  }, [user, refresh]);

  if (authLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (!canManageAlunos(user.role)) return <Redirect href={homeRouteForRole(user.role)} />;

  function openCreateForm() {
    setEditing(null);
    setNome('');
    setResponsavelId('');
    setShowResponsaveis(false);
    setShowForm(true);
    setError(null);
    setNotice(null);
  }

  function openEditForm(aluno: Aluno) {
    setEditing(aluno);
    setNome(aluno.nome);
    setResponsavelId(responsavelPorAluno[aluno.id] ?? '');
    setShowResponsaveis(false);
    setShowForm(true);
    setError(null);
    setNotice(null);
  }

  async function handleSave() {
    setError(null);
    setNotice(null);
    if (!nome.trim()) {
      setError('Informe o nome do aluno.');
      return;
    }
    if (!responsavelId) {
      setError('Selecione um responsável para continuar.');
      return;
    }
    if (!turmaId) {
      setError('Não foi possível identificar a turma. Volte e tente novamente.');
      return;
    }

    setBusy(true);
    try {
      if (editing) await updateAlunoWithResponsavel(editing.id, nome, responsavelId);
      else await createAlunoWithResponsavel(nome, turmaId, responsavelId);
      setShowForm(false);
      setEditing(null);
      setNotice(editing ? 'Aluno atualizado.' : 'Aluno cadastrado com sucesso.');
      await refresh();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o aluno. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(aluno: Aluno) {
    Alert.alert('Excluir aluno?', `Remover ${aluno.nome}? Os vínculos com professores e responsável serão removidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          deleteAluno(aluno.id)
            .then(async () => {
              setNotice('Aluno removido.');
              await refresh();
            })
            .catch((deleteError: unknown) => {
              setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o aluno.');
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
          <Pressable onPress={() => router.replace('/direcao/turmas' as Href)}>
            <ThemedText style={[styles.back, { color: theme.brand }]}>‹ Voltar para turmas</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>Alunos</ThemedText>
          <SurfaceCard style={[styles.classCard, { borderColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">Turma selecionada</ThemedText>
            <ThemedText type="subtitle">{turma?.nome ?? 'Carregando turma...'}</ThemedText>
          </SurfaceCard>

          {notice && <ThemedText style={[styles.notice, { backgroundColor: theme.successSoft, color: theme.success }]}>{notice}</ThemedText>}
          {error && !showForm && (
            <View style={styles.errorBlock}>
              <ThemedText style={authStyles.error}>{error}</ThemedText>
              {!loading && <PrimaryButton title="Tentar novamente" onPress={() => refresh().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados. Tente novamente.'))} variant="outline" />}
            </View>
          )}

          {showForm ? (
            <SurfaceCard style={styles.form}>
              <ThemedText type="subtitle">{editing ? 'Editar aluno' : 'Cadastrar aluno'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">O aluno será vinculado à turma {turma?.nome ?? ''}.</ThemedText>
              <AuthField label="Nome do aluno" value={nome} onChangeText={setNome} placeholder="Nome completo" />
              <ThemedText type="smallBold">Turma</ThemedText>
              <View style={[styles.readOnlyField, { borderColor: theme.border, backgroundColor: theme.neutralSoft }]}>
                <ThemedText>{turma?.nome ?? 'Carregando turma...'}</ThemedText>
              </View>
              <ThemedText type="smallBold">Responsável *</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={responsavelId ? `Responsável: ${responsavelById.get(responsavelId) ?? 'selecionado'}` : 'Selecionar responsável obrigatório'}
                onPress={() => setShowResponsaveis((visible) => !visible)}
                style={[styles.responsavelPicker, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                <ThemedText>{responsavelById.get(responsavelId) ?? 'Selecionar responsável'}</ThemedText>
                <ThemedText themeColor="textSecondary">{showResponsaveis ? '⌃' : '⌄'}</ThemedText>
              </Pressable>
              {showResponsaveis && responsaveis.map((responsavel) => (
                <Pressable
                  key={responsavel.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setResponsavelId(responsavel.id);
                    setShowResponsaveis(false);
                    setError(null);
                  }}
                  style={[
                    styles.responsavelOption,
                    { borderColor: theme.border },
                    responsavelId === responsavel.id && { borderColor: theme.brand, backgroundColor: theme.brandSoft },
                  ]}>
                  <ThemedText type="smallBold">{responsavel.nome}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{responsavel.email}</ThemedText>
                </Pressable>
              ))}
              {responsaveis.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  Cadastre um usuário com perfil Responsável em Cadastros → Usuários antes de continuar.
                </ThemedText>
              )}
              {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
              <PrimaryButton title={editing ? 'Salvar alterações' : 'Cadastrar aluno'} onPress={handleSave} loading={busy} disabled={busy || responsaveis.length === 0} />
              <PrimaryButton
                title="Cancelar"
                onPress={() => {
                  setShowForm(false);
                  setEditing(null);
                  setError(null);
                }}
                disabled={busy}
                variant="outline"
              />
            </SurfaceCard>
          ) : (
            <>
              {!loading && (
                <PrimaryButton title="+ Cadastrar aluno" onPress={openCreateForm} disabled={busy} />
              )}
              {loading ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={theme.brand} />
                  <ThemedText themeColor="textSecondary">Carregando alunos...</ThemedText>
                </View>
              ) : error ? null : alunos.length === 0 ? (
                <SurfaceCard style={[styles.emptyState, { borderColor: theme.border }]}>
                  <ThemedText type="subtitle">Nenhum aluno cadastrado</ThemedText>
                  <ThemedText themeColor="textSecondary">Esta turma ainda não possui alunos.</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">O cadastro de cada aluno exige a escolha de um responsável.</ThemedText>
                </SurfaceCard>
              ) : (
                <View style={styles.list}>
                  {alunos.map((aluno) => {
                    const guardianId = responsavelPorAluno[aluno.id];
                    const guardianName = guardianId ? responsavelById.get(guardianId) : undefined;
                    return (
                      <SurfaceCard key={aluno.id} style={[styles.studentCard, { borderColor: theme.border }]}>
                        <View style={styles.studentCopy}>
                          <ThemedText type="smallBold">{aluno.nome}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            Responsável: {guardianName ?? (guardianId ? 'Cadastro indisponível' : 'Não informado')}
                          </ThemedText>
                        </View>
                        <View style={styles.actions}>
                          <Pressable accessibilityRole="button" onPress={() => openEditForm(aluno)} disabled={busy}>
                            <ThemedText style={{ color: theme.brand, fontWeight: '700' }}>Editar</ThemedText>
                          </Pressable>
                          <Pressable accessibilityRole="button" onPress={() => handleDelete(aluno)} disabled={busy}>
                            <ThemedText style={{ color: theme.danger, fontWeight: '700' }}>Excluir</ThemedText>
                          </Pressable>
                        </View>
                      </SurfaceCard>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start', gap: Spacing.three },
  back: { fontWeight: '700', minHeight: 44, textAlignVertical: 'center' },
  title: { marginBottom: 0 },
  classCard: { borderWidth: 1 },
  form: { gap: Spacing.three },
  readOnlyField: { borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.three, minHeight: 52, justifyContent: 'center' },
  responsavelPicker: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  responsavelOption: { borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.one },
  list: { gap: Spacing.two },
  studentCard: { borderWidth: 1, gap: Spacing.three },
  studentCopy: { gap: Spacing.one },
  actions: { flexDirection: 'row', gap: Spacing.four },
  emptyState: { alignItems: 'center', borderWidth: 1, gap: Spacing.two },
  loading: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  errorBlock: { gap: Spacing.two },
  notice: { borderRadius: Radius.small, padding: Spacing.three },
});
