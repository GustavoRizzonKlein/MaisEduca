import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  Chip,
  EmptyState,
  ErrorState,
  ListItem,
  LoadingState,
  PageHeader,
  Screen,
  SearchInput,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useStudents } from '@/hooks/use-students';
import { canAccessProfessorArea, canManageAlunos, canViewAcompanhamento } from '@/types/auth';

export default function AlunosTabScreen() {
  const { user } = useAuth();
  const { students, turmas, loading, error, reload } = useStudents();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [turmaFilter, setTurmaFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return students.filter(
      (student) =>
        (!turmaFilter || student.turma_id === turmaFilter)
        && (!query || student.nome.toLocaleLowerCase('pt-BR').includes(query)),
    );
  }, [search, students, turmaFilter]);

  if (!user || !canViewAcompanhamento(user.role)) return <UnauthorizedState />;

  const isResponsavel = user.role === 'responsavel';
  const manageHref: Href | null = canManageAlunos(user.role)
    ? '/direcao/turmas'
    : canAccessProfessorArea(user.role)
      ? '/professor/turmas'
      : null;

  return (
    <Screen
      onRefresh={reload}
      refreshing={loading && students.length > 0}
      header={
        <PageHeader
          title={isResponsavel ? 'Meus filhos' : 'Alunos'}
          subtitle={loading ? 'Carregando...' : `${students.length} ${students.length === 1 ? 'aluno' : 'alunos'}`}
          action={
            manageHref
              ? {
                  icon: 'classes',
                  accessibilityLabel: canManageAlunos(user.role) ? 'Gerenciar turmas e alunos' : 'Ver minhas turmas',
                  onPress: () => router.push(manageHref),
                }
              : undefined
          }>
          {students.length > 0 ? (
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar aluno..."
              onFilterPress={turmas.length > 1 ? () => setShowFilters((value) => !value) : undefined}
              filterActive={showFilters || turmaFilter !== null}
            />
          ) : null}
          {showFilters && turmas.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              <Chip label="Todas as turmas" selected={turmaFilter === null} onPress={() => setTurmaFilter(null)} />
              {turmas.map((turma) => (
                <Chip
                  key={turma.id}
                  label={turma.nome}
                  selected={turmaFilter === turma.id}
                  onPress={() => setTurmaFilter((current) => (current === turma.id ? null : turma.id))}
                />
              ))}
            </ScrollView>
          ) : null}
        </PageHeader>
      }>
      {loading && students.length === 0 ? (
        <LoadingState rows={5} label="Carregando alunos" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="students"
          tone="green"
          title={students.length === 0 ? 'Nenhum aluno encontrado' : 'Nenhum resultado'}
          description={
            students.length === 0
              ? isResponsavel
                ? 'Quando a escola vincular uma criança à sua conta, ela aparecerá aqui.'
                : 'Quando houver alunos vinculados ao seu perfil, eles aparecerão aqui.'
              : 'Tente buscar por outro nome ou remover o filtro de turma.'
          }
          actionLabel={students.length > 0 ? 'Limpar busca' : undefined}
          onAction={() => {
            setSearch('');
            setTurmaFilter(null);
          }}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((student) => (
            <ListItem
              key={student.id}
              title={student.nome}
              subtitle={student.turmaNome ?? 'Sem turma'}
              leading={<Avatar name={student.nome} />}
              onPress={() => router.push(`/alunos/${student.id}` as Href)}
              accessibilityHint="Abre os detalhes do aluno"
            />
          ))}
          {turmaFilter || search ? (
            <ThemedText type="caption" themeColor="textMuted" style={styles.count}>
              Mostrando {filtered.length} de {students.length}
            </ThemedText>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: Spacing.two, paddingRight: Spacing.three },
  list: { gap: Spacing.two },
  count: { textAlign: 'center', marginTop: Spacing.two },
});
