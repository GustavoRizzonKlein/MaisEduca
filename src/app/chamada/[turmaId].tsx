import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  Button,
  Card,
  DayStrip,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  PageHeader,
  Screen,
  UnauthorizedState,
} from '@/components/ui';
import { MinTouchSize, Palette, Radius, Spacing, Tones } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { addDays, formatLongDate, formatWeekRange, getStartOfWeek, getWeekDays, isSameWeek, todayKey } from '@/lib/dates';
import { listPresencasDoDia, saveChamada } from '@/services/attendance-service';
import { listAlunosByTurma, listTurmas } from '@/services/school-service';
import { can } from '@/types/auth';
import type { AttendanceStatus } from '@/types/education';
import type { Aluno } from '@/types/school';

type Marks = Record<string, AttendanceStatus | undefined>;

export default function ChamadaScreen() {
  const { turmaId: routeTurmaId } = useLocalSearchParams<{ turmaId: string | string[] }>();
  const turmaId = Array.isArray(routeTurmaId) ? routeTurmaId[0] : routeTurmaId;
  const { user } = useAuth();
  const allowed = can(user?.role, 'frequencia:edit');

  const [turmaNome, setTurmaNome] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [weekAnchor, setWeekAnchor] = useState(() => getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [saved, setSaved] = useState<Marks>({});
  const [marks, setMarks] = useState<Marks>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const isFuture = selectedDate > todayKey();

  useEffect(() => {
    if (!weekDays.includes(selectedDate)) setSelectedDate(weekDays.find((day) => day <= todayKey()) ?? weekDays[0]);
  }, [selectedDate, weekDays]);

  const load = useCallback(async () => {
    if (!turmaId) return;
    setLoading(true);
    setLoadError(null);
    try {
      // RLS: o Professor de Apoio recebe só os alunos vinculados a ele.
      const [turmas, nextAlunos] = await Promise.all([listTurmas(), listAlunosByTurma(turmaId)]);
      setTurmaNome(turmas.find((turma) => turma.id === turmaId)?.nome ?? null);
      setAlunos(nextAlunos);
      const presencas = await listPresencasDoDia(nextAlunos.map((aluno) => aluno.id), selectedDate);
      const existing = Object.fromEntries(presencas.map((presenca) => [presenca.alunoId, presenca.status])) as Marks;
      setSaved(existing);
      setMarks(existing);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar a chamada.');
    } finally {
      setLoading(false);
    }
  }, [turmaId, selectedDate]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (!allowed) return <UnauthorizedState />;

  const marked = alunos.filter((aluno) => marks[aluno.id]).length;
  const presentes = alunos.filter((aluno) => marks[aluno.id] === 'presente').length;
  const changed = alunos.some((aluno) => marks[aluno.id] !== saved[aluno.id]);

  async function handleSave() {
    setFeedback(null);
    const entries = alunos
      .filter((aluno) => marks[aluno.id])
      .map((aluno) => ({ alunoId: aluno.id, data: selectedDate, status: marks[aluno.id] as AttendanceStatus }));
    if (entries.length === 0) {
      setFeedback({ tone: 'error', message: 'Marque presença ou ausência de pelo menos um aluno.' });
      return;
    }
    setSaving(true);
    try {
      await saveChamada(entries);
      setSaved({ ...marks });
      setFeedback({ tone: 'success', message: `Chamada salva: ${entries.length} ${entries.length === 1 ? 'aluno' : 'alunos'}.` });
    } catch (error: unknown) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar a chamada.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={<PageHeader title="Chamada" subtitle={turmaNome ?? undefined} showBack backFallback="/alunos" />}>
      <DayStrip
        days={weekDays}
        selectedDate={selectedDate}
        onSelect={(day) => {
          setFeedback(null);
          setSelectedDate(day);
        }}
        weekLabel={isSameWeek(weekAnchor, new Date()) ? 'Esta semana' : formatWeekRange(weekAnchor)}
        onPreviousWeek={() => setWeekAnchor((current) => addDays(current, -7))}
        onNextWeek={() => setWeekAnchor((current) => addDays(current, 7))}
      />
      <ThemedText type="heading">{formatLongDate(selectedDate)}</ThemedText>

      {loading ? (
        <LoadingState rows={4} label="Carregando chamada" />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : alunos.length === 0 ? (
        <EmptyState icon="students" tone="green" title="Nenhum aluno nesta turma" description="Não há alunos desta turma no seu escopo." />
      ) : (
        <>
          {isFuture ? <Notice tone="info" message="Não é possível registrar chamada para datas futuras." /> : null}
          <Card style={styles.summary}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
              {marked} de {alunos.length} marcados • {presentes} presentes
            </ThemedText>
            <Button
              title="Todos presentes"
              size="small"
              variant="secondary"
              fullWidth={false}
              disabled={isFuture}
              onPress={() => setMarks(Object.fromEntries(alunos.map((aluno) => [aluno.id, 'presente'])) as Marks)}
            />
          </Card>
          <View style={styles.list}>
            {alunos.map((aluno) => (
              <Card key={aluno.id} style={styles.row}>
                <Avatar name={aluno.nome} size="small" />
                <ThemedText type="subtitle" style={styles.flex} numberOfLines={2}>{aluno.nome}</ThemedText>
                <View style={styles.toggles}>
                  <MarkButton
                    label="Presente"
                    active={marks[aluno.id] === 'presente'}
                    tone="green"
                    disabled={isFuture}
                    onPress={() => setMarks((current) => ({ ...current, [aluno.id]: 'presente' }))}
                  />
                  <MarkButton
                    label="Ausente"
                    active={marks[aluno.id] === 'ausente'}
                    tone="peach"
                    disabled={isFuture}
                    onPress={() => setMarks((current) => ({ ...current, [aluno.id]: 'ausente' }))}
                  />
                </View>
              </Card>
            ))}
          </View>
          {feedback ? <Notice tone={feedback.tone} message={feedback.message} /> : null}
          <Button
            title={changed ? 'Salvar chamada' : 'Chamada salva'}
            icon="check"
            onPress={handleSave}
            loading={saving}
            disabled={isFuture || !changed}
          />
        </>
      )}
    </Screen>
  );
}

function MarkButton({
  label,
  active,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  tone: 'green' | 'peach';
  disabled?: boolean;
  onPress: () => void;
}) {
  const colors = Tones[tone];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.mark,
        active && { backgroundColor: colors.light, borderColor: colors.primary },
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}>
      {active ? <AppIcon name="check" color={colors.ink} size={12} /> : null}
      <ThemedText type="caption" style={{ color: active ? colors.ink : Palette.textSecondary, fontWeight: '600' }}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flexWrap: 'wrap' },
  toggles: { flexDirection: 'row', gap: Spacing.two },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: MinTouchSize - 4,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
});
