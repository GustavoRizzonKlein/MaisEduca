import { Redirect, router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
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
  homeRouteForRole,
  roleLabel,
  type ManagedProfile,
  type ManagedUserRole,
} from '@/types/auth';
import type { Aluno, Turma } from '@/types/school';

type Mode = 'list' | 'create' | 'edit';

export default function DirecaoUsuariosScreen() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
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
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    if (!user || !canManageUsers(user.role)) return;
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar usuários.');
    });
  }, [user, refresh]);

  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (!canManageUsers(user.role)) return <Redirect href={homeRouteForRole(user.role)} />;

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
    setInfo(null);
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
        setInfo(
          created.passwordResetEmailSent
            ? 'Usuário criado. E-mail de redefinição de senha enviado.'
            : `Usuário criado.${created.passwordResetWarning ? ` Aviso: ${created.passwordResetWarning}` : ' Não foi possível enviar o e-mail de redefinição.'}`,
        );
        await openEdit(created.user);
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

  async function handleDelete(profile: ManagedProfile) {
    const confirmation = profile.role === 'responsavel'
      ? `Remover ${profile.nome}? Transfira os alunos vinculados antes de excluir este responsável.`
      : `Remover ${profile.nome}? Os vínculos serão apagados.`;
    Alert.alert('Excluir usuário?', confirmation, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          deleteManagedUser(profile.id)
            .then(async () => {
              setMode('list');
              setSelected(null);
              await refresh();
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : 'Não foi possível excluir.');
            })
            .finally(() => setBusy(false));
        },
      },
    ]);
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

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => (mode === 'list' ? router.replace('/direcao' as Href) : setMode('list'))}>
            <ThemedText style={[styles.back, { color: theme.brand }]}>‹ Voltar</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>
            {mode === 'list' ? 'Usuários' : mode === 'create' ? 'Novo usuário' : 'Editar usuário'}
          </ThemedText>

          {mode === 'list' ? (
            <>
              <PrimaryButton title="Novo usuário" onPress={openCreate} loading={busy} />
              <View style={styles.list}>
                {users.map((profile) => (
                  <Pressable key={profile.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]} onPress={() => openEdit(profile)}>
                    <View style={styles.cardCopy}>
                      <ThemedText type="smallBold">{profile.nome}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {roleLabel(profile.role)} · {profile.email}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={[styles.cardAction, { color: theme.attention }]}>
                      Editar ›
                    </ThemedText>
                  </Pressable>
                ))}
                {users.length === 0 && (
                  <ThemedText themeColor="textSecondary">Nenhum usuário gerenciável cadastrado.</ThemedText>
                )}
              </View>
            </>
          ) : (
            <View style={authStyles.form}>
              <AuthField label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" />
              <AuthField
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="email@escola.com"
              />
              <AuthField
                label={mode === 'create' ? 'Senha inicial' : 'Nova senha (opcional)'}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                placeholder="Mínimo de 6 caracteres"
              />
              <ThemedText type="smallBold">Perfil</ThemedText>
              <View style={styles.roleGrid}>
                {MANAGED_USER_ROLES.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setRole(option);
                      setSelectedIds([]);
                    }}
                    style={[styles.roleOption, { borderColor: theme.border }, role === option && [styles.roleOptionSelected, { borderColor: theme.brand, backgroundColor: theme.brandSoft }]]}>
                    <ThemedText type="smallBold">{roleLabel(option)}</ThemedText>
                  </Pressable>
                ))}
              </View>

              {mode === 'edit' && (
                <>
                  <ThemedText type="smallBold" style={styles.sectionLabel}>
                    {role === 'professor'
                      ? 'Turmas do professor'
                      : role === 'apoio'
                        ? 'Alunos do professor de apoio'
                        : 'Alunos do responsável'}
                  </ThemedText>
                  {associationOptions.length === 0 ? (
                    <ThemedText themeColor="textSecondary">
                      Cadastre {role === 'professor' ? 'turmas' : 'alunos'} antes de associar.
                    </ThemedText>
                  ) : (
                    associationOptions.map((option) => {
                      const checked = selectedIds.includes(option.id);
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => toggleId(option.id)}
                          style={[styles.checkRow, { borderColor: theme.border }, checked && [styles.checkRowSelected, { borderColor: theme.brand, backgroundColor: theme.brandSoft }]]}>
                          <ThemedText type="smallBold">
                            {checked ? '✓ ' : '○ '}
                            {option.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })
                  )}
                </>
              )}

              {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
              {info && <ThemedText style={[styles.info, { color: theme.brand, backgroundColor: theme.brandSoft }]}>{info}</ThemedText>}
              <PrimaryButton title="Salvar" onPress={handleSave} loading={busy} />
              {selected && (
                <>
                  <PrimaryButton
                    title="Enviar redefinição de senha"
                    onPress={() => handleResendReset(selected)}
                    disabled={busy}
                    variant="outline"
                  />
                  <PrimaryButton title="Excluir usuário" onPress={() => handleDelete(selected)} disabled={busy} variant="danger" />
                </>
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
  back: { color: BrandColors.brand, fontWeight: '700', marginBottom: Spacing.one },
  title: { marginBottom: Spacing.two },
  list: { gap: Spacing.two, marginTop: Spacing.three },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.three,
    backgroundColor: BrandColors.backgroundElement,
    ...Shadows.card,
  },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { color: BrandColors.attention, fontWeight: '700' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  roleOption: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    minWidth: '30%',
    flexGrow: 1,
  },
  roleOptionSelected: {
    borderColor: BrandColors.brand,
    backgroundColor: BrandColors.brandSoft,
  },
  sectionLabel: { marginTop: Spacing.two },
  checkRow: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  checkRowSelected: {
    borderColor: BrandColors.brand,
    backgroundColor: BrandColors.brandSoft,
  },
  info: {
    color: BrandColors.brand,
    backgroundColor: BrandColors.brandSoft,
    borderRadius: Radius.small,
    padding: Spacing.three,
  },
});
