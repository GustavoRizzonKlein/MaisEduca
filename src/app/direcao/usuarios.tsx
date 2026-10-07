import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  ListItem,
  LoadingState,
  Notice,
  PageHeader,
  Screen,
  SearchInput,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing, type Tone } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  createManagedUser,
  deleteManagedUser,
  listManagedUsers,
  sendManagedUserPasswordReset,
  updateManagedUser,
} from '@/services/manage-users-service';
import {
  listAlunos,
  listProfessorApoioAlunos,
  listProfessorTurmas,
  listResponsavelAlunos,
  listTurmas,
  setProfessorApoioAlunos,
  setProfessorTurmas,
  setResponsavelAlunos,
} from '@/services/school-service';
import {
  MANAGED_USER_ROLES,
  canManageUsers,
  roleLabel,
  type ManagedProfile,
  type ManagedUserRole,
} from '@/types/auth';
import type { Aluno, Turma } from '@/types/school';

type Mode = 'list' | 'create' | 'edit';

const roleTone: Record<ManagedUserRole, Tone> = { professor: 'blue', apoio: 'purple', responsavel: 'green' };

export default function DirecaoUsuariosScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('list');
  const [users, setUsers] = useState<ManagedProfile[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selected, setSelected] = useState<ManagedProfile | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<ManagedUserRole>('professor');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ManagedProfile | null>(null);

  const refresh = useCallback(async () => {
    const [nextUsers, nextTurmas, nextAlunos] = await Promise.all([
      listManagedUsers(),
      listTurmas(),
      listAlunos(),
    ]);
    setUsers(nextUsers);
    setTurmas(nextTurmas);
    setAlunos(nextAlunos);
  }, []);

  const loadWithFeedback = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    refresh()
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar usuários.');
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!user || !canManageUsers(user.role)) return;
    loadWithFeedback();
  }, [user, loadWithFeedback]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return users;
    return users.filter((profile) =>
      `${profile.nome} ${profile.email} ${roleLabel(profile.role)}`.toLocaleLowerCase('pt-BR').includes(query));
  }, [search, users]);

  if (!user || !canManageUsers(user.role)) return <UnauthorizedState />;

  function openCreate() {
    setMode('create');
    setSelected(null);
    setNome('');
    setEmail('');
    setSenha('');
    setRole('professor');
    setSelectedIds([]);
    setError(null);
    setInfo(null);
  }

  async function openEdit(profile: ManagedProfile) {
    setMode('edit');
    setSelected(profile);
    setNome(profile.nome);
    setEmail(profile.email);
    setSenha('');
    setRole(profile.role);
    setError(null);
    setBusy(true);
    try {
      if (profile.role === 'professor') setSelectedIds(await listProfessorTurmas(profile.id));
      else if (profile.role === 'apoio') setSelectedIds(await listProfessorApoioAlunos(profile.id));
      else setSelectedIds(await listResponsavelAlunos(profile.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar vínculos.');
    } finally {
      setBusy(false);
    }
  }

  function toggleId(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleSave() {
    setError(null);
    setInfo(null);
    if (!nome.trim() || !email.trim() || !role) {
      setError('Preencha nome, e-mail e perfil.');
      return;
    }
    if (mode === 'create' && !senha) {
      setError('Defina a senha inicial.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'create') {
        const created = await createManagedUser({ nome, email, senha, role });
        await openEdit(created.user);
        setInfo(
          created.passwordResetEmailSent
            ? 'Usuário criado. E-mail de redefinição de senha enviado.'
            : `Usuário criado.${created.passwordResetWarning ? ` Aviso: ${created.passwordResetWarning}` : ' Não foi possível enviar o e-mail de redefinição.'}`,
        );
      } else if (selected) {
        const updated = await updateManagedUser({
          id: selected.id,
          nome,
          email,
          role,
          senha: senha || undefined,
        });
        if (role === 'professor') await setProfessorTurmas(updated.id, selectedIds);
        if (role === 'apoio') await setProfessorApoioAlunos(updated.id, selectedIds);
        if (role === 'responsavel') await setResponsavelAlunos(updated.id, selectedIds);
        setInfo('Usuário atualizado.');
        setSelected(updated);
      }
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    deleteManagedUser(pendingDelete.id)
      .then(async () => {
        setMode('list');
        setSelected(null);
        setInfo('Usuário removido.');
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

  async function handleResendReset(profile: ManagedProfile) {
    setBusy(true);
    setError(null);
    try {
      await sendManagedUserPasswordReset(profile.email);
      setInfo('E-mail de redefinição enviado.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar redefinição.');
    } finally {
      setBusy(false);
    }
  }

  const associationOptions =
    role === 'professor'
      ? turmas.map((turma) => ({ id: turma.id, label: turma.nome }))
      : alunos.map((aluno) => ({ id: aluno.id, label: aluno.nome }));

  const associationTitle =
    role === 'professor' ? 'Turmas do professor' : role === 'apoio' ? 'Alunos do professor de apoio' : 'Alunos do responsável';

  if (mode === 'list') {
    return (
      <Screen
        edges={['top', 'left', 'right', 'bottom']}
        header={
          <PageHeader title="Usuários" subtitle="Professores, professores de apoio e responsáveis" showBack>
            {users.length > 0 ? <SearchInput value={search} onChangeText={setSearch} placeholder="Buscar por nome, e-mail ou perfil" /> : null}
          </PageHeader>
        }>
        <Button title="Novo usuário" icon="plus" onPress={openCreate} disabled={busy} />
        {info ? <Notice tone="success" message={info} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
        {loading ? (
          <LoadingState rows={4} label="Carregando usuários" />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadWithFeedback} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon="users"
            tone="peach"
            title={users.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum resultado'}
            description={users.length === 0 ? 'Cadastre professores, professores de apoio e responsáveis.' : 'Tente buscar por outro termo.'}
          />
        ) : (
          <View style={styles.list}>
            {filteredUsers.map((profile) => (
              <ListItem
                key={profile.id}
                title={profile.nome}
                subtitle={profile.email}
                leading={<Avatar name={profile.nome} tone={roleTone[profile.role]} />}
                trailing={<Badge label={roleLabel(profile.role)} tone={roleTone[profile.role]} />}
                onPress={() => {
                  setInfo(null);
                  void openEdit(profile);
                }}
                accessibilityHint="Abre a edição do usuário"
              />
            ))}
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={
        <PageHeader
          title={mode === 'create' ? 'Novo usuário' : 'Editar usuário'}
          subtitle={selected?.email}
          showBack
          onBack={() => {
            setMode('list');
            setError(null);
          }}
        />
      }>
      <Card style={styles.form}>
        <Input label="Nome" required icon="student" value={nome} onChangeText={setNome} placeholder="Nome completo" editable={!busy} />
        <Input
          label="E-mail"
          required
          icon="mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="email@escola.com"
          editable={!busy}
        />
        <Input
          label={mode === 'create' ? 'Senha inicial' : 'Nova senha (opcional)'}
          required={mode === 'create'}
          icon="lock"
          password
          value={senha}
          onChangeText={setSenha}
          placeholder="Mínimo de 6 caracteres"
          editable={!busy}
        />
        <View style={styles.group}>
          <ThemedText type="smallBold">Perfil</ThemedText>
          <View style={styles.chips}>
            {MANAGED_USER_ROLES.map((option) => (
              <Chip
                key={option}
                label={roleLabel(option)}
                selected={role === option}
                onPress={() => {
                  setRole(option);
                  setSelectedIds([]);
                }}
              />
            ))}
          </View>
        </View>
      </Card>

      {mode === 'edit' ? (
        <Card style={styles.form}>
          <ThemedText type="heading">{associationTitle}</ThemedText>
          {associationOptions.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Cadastre {role === 'professor' ? 'turmas' : 'alunos'} antes de associar.
            </ThemedText>
          ) : (
            <View style={styles.chips}>
              {associationOptions.map((option) => (
                <Chip key={option.id} label={option.label} selected={selectedIds.includes(option.id)} onPress={() => toggleId(option.id)} />
              ))}
            </View>
          )}
        </Card>
      ) : (
        <Notice tone="info" message="Depois de criar o usuário, você poderá vincular turmas ou alunos." />
      )}

      {error ? <Notice tone="error" message={error} /> : null}
      {info ? <Notice tone="success" message={info} /> : null}

      <View style={styles.actions}>
        <Button title="Salvar" icon="check" onPress={handleSave} loading={busy} />
        {selected ? (
          <>
            <Button title="Enviar redefinição de senha" icon="mail" variant="secondary" onPress={() => handleResendReset(selected)} disabled={busy} />
            <Button title="Excluir usuário" icon="trash" variant="danger" onPress={() => setPendingDelete(selected)} disabled={busy} />
          </>
        ) : null}
      </View>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Excluir usuário?"
        message={
          pendingDelete?.role === 'responsavel'
            ? `Remover ${pendingDelete.nome}? Transfira os alunos vinculados antes de excluir este responsável.`
            : `Remover ${pendingDelete?.nome ?? ''}? Os vínculos serão apagados.`
        }
        confirmLabel="Excluir"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  form: { gap: Spacing.three },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actions: { gap: Spacing.two },
});
