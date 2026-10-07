import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  BottomSheet,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FloatingActionButton,
  IconButton,
  Input,
  ListItem,
  LoadingState,
  Notice,
  PageHeader,
  Screen,
  Select,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { listManagedUsers } from '@/services/manage-users-service';
import {
  createAlunoWithResponsavel,
  deleteAluno,
  listAlunosByTurma,
  listResponsaveisDosAlunos,
  listTurmas,
  updateAlunoWithResponsavel,
} from '@/services/school-service';
import { canManageAlunos, type ManagedProfile } from '@/types/auth';
import type { Aluno, Turma } from '@/types/school';

export default function DirecaoTurmaAlunosScreen() {
  const { turmaId: routeTurmaId } = useLocalSearchParams<{ turmaId: string | string[] }>();
  const turmaId = Array.isArray(routeTurmaId) ? routeTurmaId[0] : routeTurmaId;
  const { user } = useAuth();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [responsaveis, setResponsaveis] = useState<ManagedProfile[]>([]);
  const [responsavelPorAluno, setResponsavelPorAluno] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ nome?: string; responsavel?: string }>({});
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [nome, setNome] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Aluno | null>(null);

  const responsavelById = useMemo(
    () => new Map(responsaveis.map((responsavel) => [responsavel.id, responsavel.nome])),
    [responsaveis],
  );

  const refresh = useCallback(async () => {
    if (!turmaId) throw new Error('Não foi possível identificar a turma.');
    setLoading(true);
    setLoadError(null);
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

  const loadWithFeedback = useCallback(() => {
    refresh().catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar os dados. Tente novamente.');
    });
  }, [refresh]);

  useEffect(() => {
    if (!user || !canManageAlunos(user.role)) return;
    loadWithFeedback();
  }, [user, loadWithFeedback]);

  if (!user || !canManageAlunos(user.role)) return <UnauthorizedState />;

  function openForm(aluno: Aluno | null) {
    setEditing(aluno);
    setNome(aluno?.nome ?? '');
    setResponsavelId(aluno ? responsavelPorAluno[aluno.id] ?? '' : '');
    setFormError(null);
    setFieldErrors({});
    setNotice(null);
    setShowForm(true);
  }

  async function handleSave() {
    setFormError(null);
    const nextErrors: typeof fieldErrors = {};
    if (!nome.trim()) nextErrors.nome = 'Informe o nome do aluno.';
    if (!responsavelId) nextErrors.responsavel = 'Selecione um responsável para continuar.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!turmaId) {
      setFormError('Não foi possível identificar a turma. Volte e tente novamente.');
      return;
    }

    setBusy(true);
    try {
      if (editing) await updateAlunoWithResponsavel(editing.id, nome, responsavelId);
      else await createAlunoWithResponsavel(nome, turmaId, responsavelId);
      setShowForm(false);
      setNotice({ tone: 'success', message: editing ? 'Aluno atualizado.' : 'Aluno cadastrado com sucesso.' });
      setEditing(null);
      await refresh();
    } catch (saveError: unknown) {
      setFormError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o aluno. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    deleteAluno(pendingDelete.id)
      .then(async () => {
        setNotice({ tone: 'success', message: 'Aluno removido.' });
        await refresh();
      })
      .catch((deleteError: unknown) => {
        setNotice({ tone: 'error', message: deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o aluno.' });
      })
      .finally(() => {
        setBusy(false);
        setPendingDelete(null);
      });
  }

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={
        <PageHeader
          title={turma?.nome ?? 'Turma'}
          subtitle={loading ? 'Carregando...' : `${alunos.length} ${alunos.length === 1 ? 'aluno' : 'alunos'}`}
          showBack
          backFallback="/direcao/turmas"
        />
      }
      overlay={!loading && !loadError ? (
        <FloatingActionButton accessibilityLabel="Cadastrar aluno" onPress={() => openForm(null)} />
      ) : null}>
      {notice ? <Notice tone={notice.tone} message={notice.message} /> : null}

      {loading ? (
        <LoadingState rows={4} label="Carregando alunos" />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={loadWithFeedback} />
      ) : alunos.length === 0 ? (
        <EmptyState
          icon="students"
          tone="green"
          title="Nenhum aluno cadastrado"
          description="Esta turma ainda não possui alunos. O cadastro de cada aluno exige a escolha de um responsável."
          actionLabel="Cadastrar aluno"
          onAction={() => openForm(null)}
        />
      ) : (
        <View style={styles.list}>
          {alunos.map((aluno) => {
            const guardianId = responsavelPorAluno[aluno.id];
            const guardianName = guardianId ? responsavelById.get(guardianId) : undefined;
            return (
              <ListItem
                key={aluno.id}
                title={aluno.nome}
                subtitle={`Responsável: ${guardianName ?? (guardianId ? 'cadastro indisponível' : 'não informado')}`}
                leading={<Avatar name={aluno.nome} />}
                onPress={() => router.push(`/alunos/${aluno.id}` as Href)}
                showChevron={false}
                trailing={
                  <View style={styles.actions}>
                    <IconButton icon="edit" accessibilityLabel={`Editar ${aluno.nome}`} onPress={() => openForm(aluno)} />
                    <IconButton icon="trash" accessibilityLabel={`Excluir ${aluno.nome}`} onPress={() => setPendingDelete(aluno)} />
                  </View>
                }
              />
            );
          })}
        </View>
      )}

      <BottomSheet
        visible={showForm}
        title={editing ? 'Editar aluno' : 'Cadastrar aluno'}
        onClose={() => !busy && setShowForm(false)}
        footer={
          <>
            <Button
              title={editing ? 'Salvar alterações' : 'Cadastrar aluno'}
              icon="check"
              onPress={handleSave}
              loading={busy}
              disabled={responsaveis.length === 0}
            />
            <Button title="Cancelar" variant="outline" onPress={() => setShowForm(false)} disabled={busy} />
          </>
        }>
        <Input
          label="Nome do aluno"
          required
          icon="student"
          value={nome}
          onChangeText={(value) => {
            setNome(value);
            setFieldErrors((current) => ({ ...current, nome: undefined }));
          }}
          placeholder="Nome completo"
          error={fieldErrors.nome}
          editable={!busy}
        />
        <Input label="Turma" icon="classes" value={turma?.nome ?? ''} editable={false} helperText="O aluno será vinculado a esta turma." />
        <Select
          label="Responsável"
          required
          placeholder="Selecionar responsável"
          value={responsavelId || null}
          onChange={(value) => {
            setResponsavelId(value);
            setFieldErrors((current) => ({ ...current, responsavel: undefined }));
          }}
          options={responsaveis.map((responsavel) => ({ value: responsavel.id, label: responsavel.nome, description: responsavel.email }))}
          error={fieldErrors.responsavel}
          helperText={responsaveis.length === 0 ? 'Cadastre um usuário com perfil Responsável em Usuários antes de continuar.' : undefined}
          disabled={busy}
        />
        {formError ? <Notice tone="error" message={formError} /> : null}
      </BottomSheet>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Excluir aluno?"
        message={pendingDelete ? `Remover ${pendingDelete.nome}? Os vínculos com professores e responsável serão removidos.` : ''}
        confirmLabel="Excluir"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  actions: { flexDirection: 'row', gap: Spacing.two },
});
