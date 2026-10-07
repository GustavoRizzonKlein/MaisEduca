import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  IconContainer,
  Input,
  ListItem,
  LoadingState,
  Notice,
  PageHeader,
  Screen,
  SectionHeader,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing, type Tone } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { createTurma, deleteTurma, listTurmas, updateTurma } from '@/services/school-service';
import { canManageTurmas } from '@/types/auth';
import type { Turma } from '@/types/school';

const tileTones: Tone[] = ['purple', 'blue', 'green', 'peach', 'yellow', 'pink'];

export default function DirecaoTurmasScreen() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [nome, setNome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Turma | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTurmas(await listTurmas());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWithFeedback = useCallback(() => {
    refresh().catch((err: unknown) => {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar as turmas. Tente novamente.');
    });
  }, [refresh]);

  useEffect(() => {
    if (!user || !canManageTurmas(user.role)) return;
    loadWithFeedback();
  }, [user, loadWithFeedback]);

  if (!user || !canManageTurmas(user.role)) return <UnauthorizedState />;

  async function handleSave() {
    setNotice(null);
    if (!nome.trim()) {
      setError('Informe o nome da turma.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) await updateTurma(editing.id, nome);
      else await createTurma(nome);
      setNotice(editing ? 'Turma atualizada.' : 'Turma criada com sucesso.');
      setNome('');
      setEditing(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a turma.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const turma = pendingDelete;
    setBusy(true);
    setNotice(null);
    deleteTurma(turma.id)
      .then(async () => {
        if (editing?.id === turma.id) {
          setEditing(null);
          setNome('');
        }
        setNotice('Turma removida.');
        await refresh();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Não foi possível excluir.');
      })
      .finally(() => {
        setBusy(false);
        setPendingDelete(null);
      });
  }

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={<PageHeader title="Turmas" subtitle="Escolha uma turma para ver e cadastrar alunos" showBack />}>
      <Card style={styles.form}>
        <ThemedText type="heading">{editing ? 'Editar turma' : 'Nova turma'}</ThemedText>
        <Input
          label="Nome da turma"
          required
          icon="classes"
          value={nome}
          onChangeText={(value) => {
            setNome(value);
            setError(null);
          }}
          placeholder="Ex.: 1º ano A"
          error={error}
          editable={!busy}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <Button title={editing ? 'Salvar alterações' : 'Criar turma'} icon={editing ? 'check' : 'plus'} onPress={handleSave} loading={busy} />
        {editing ? (
          <Button
            title="Cancelar edição"
            variant="outline"
            onPress={() => {
              setEditing(null);
              setNome('');
              setError(null);
            }}
            disabled={busy}
          />
        ) : null}
      </Card>

      {notice ? <Notice tone="success" message={notice} /> : null}

      <View style={styles.section}>
        <SectionHeader title="Turmas cadastradas" />
        {loading ? (
          <LoadingState rows={3} label="Carregando turmas" />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadWithFeedback} />
        ) : turmas.length === 0 ? (
          <EmptyState
            icon="classes"
            tone="purple"
            title="Nenhuma turma cadastrada"
            description="Crie uma turma para começar a organizar a escola."
          />
        ) : (
          <View style={styles.list}>
            {turmas.map((turma, index) => (
              <ListItem
                key={turma.id}
                title={turma.nome}
                subtitle="Ver e cadastrar alunos"
                leading={<IconContainer icon="classes" tone={tileTones[index % tileTones.length]} />}
                onPress={() => router.push(`/direcao/turmas/${turma.id}` as Href)}
                showChevron={false}
                trailing={
                  <View style={styles.actions}>
                    <IconButton
                      icon="edit"
                      accessibilityLabel={`Editar turma ${turma.nome}`}
                      onPress={() => {
                        setEditing(turma);
                        setNome(turma.nome);
                        setError(null);
                        setNotice(null);
                      }}
                    />
                    <IconButton
                      icon="trash"
                      accessibilityLabel={`Excluir turma ${turma.nome}`}
                      onPress={() => setPendingDelete(turma)}
                    />
                  </View>
                }
              />
            ))}
          </View>
        )}
      </View>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Excluir turma?"
        message={pendingDelete ? `Remover ${pendingDelete.nome}? Vínculos com professores serão removidos.` : ''}
        confirmLabel="Excluir"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  section: { gap: Spacing.three },
  list: { gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
});
