/**
 * Cálculos do Painel de Desempenho.
 *
 * Regras (todas objetivas, sem "nota" ou classificação subjetiva):
 * - Frequência = presenças / (presenças + ausências) × 100.
 *   Sem chamada no período → `null` ("sem dados"), nunca 0%.
 * - Frequência de grupos (turma, escola) soma as chamadas dos alunos —
 *   não é média de percentuais — para que painel, turma e relatório batam.
 * - Atenção: frequência abaixo de 75%, mínimo exigido pela LDB
 *   (Lei 9.394/96, art. 24, VI).
 * - O arredondamento acontece uma única vez, só na exibição (`formatRate`).
 */
import { formatDate, getStartOfWeek, parseDate } from '@/lib/dates';
import type { Tone } from '@/constants/theme';
import type { RecordCategory, Registro } from '@/types/education';
import type {
  AttentionItem,
  DailyAttendance,
  PerformanceByClass,
  PerformanceByStudent,
  PerformanceSummary,
  WeeklyAttendance,
} from '@/types/performance';

export const MIN_ATTENDANCE_RATE = 75;

export function attendanceRate(presencas: number, ausencias: number): number | null {
  const total = presencas + ausencias;
  if (total <= 0) return null;
  return (presencas / total) * 100;
}

export function formatRate(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate)}%`;
}

export type AttendanceStatus = { label: string; tone: Tone; meetsMinimum: boolean | null };

export function attendanceStatus(rate: number | null): AttendanceStatus {
  if (rate === null) return { label: 'Sem chamadas no período', tone: 'neutral', meetsMinimum: null };
  if (rate < MIN_ATTENDANCE_RATE) return { label: `Abaixo de ${MIN_ATTENDANCE_RATE}%`, tone: 'peach', meetsMinimum: false };
  return { label: `A partir de ${MIN_ATTENDANCE_RATE}%`, tone: 'green', meetsMinimum: true };
}

export function summarize(rows: PerformanceByStudent[]): PerformanceSummary {
  const totals = rows.reduce(
    (acc, row) => {
      acc.presencas += row.presencas;
      acc.ausencias += row.ausencias;
      acc.activitiesCount += row.atividades;
      acc.recordsCount += row.registros;
      if (row.registros > 0) acc.studentsWithRecords += 1;
      if (row.presencas + row.ausencias > 0) acc.studentsWithAttendance += 1;
      return acc;
    },
    { presencas: 0, ausencias: 0, activitiesCount: 0, recordsCount: 0, studentsWithRecords: 0, studentsWithAttendance: 0 },
  );
  return {
    ...totals,
    studentsCount: rows.length,
    chamadas: totals.presencas + totals.ausencias,
    attendanceRate: attendanceRate(totals.presencas, totals.ausencias),
  };
}

export function studentRate(row: PerformanceByStudent) {
  return attendanceRate(row.presencas, row.ausencias);
}

/** Agrupa por turma (ordem alfabética — comparação de turmas, não de crianças). */
export function groupByClass(rows: PerformanceByStudent[]): PerformanceByClass[] {
  const groups = new Map<string, PerformanceByStudent[]>();
  for (const row of rows) {
    const key = row.turmaId ?? 'sem-turma';
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()]
    .map(([key, classRows]) => ({
      ...summarize(classRows),
      turmaId: key === 'sem-turma' ? null : key,
      turmaNome: classRows[0].turmaNome ?? 'Sem turma',
    }))
    .sort((a, b) => a.turmaNome.localeCompare(b.turmaNome, 'pt-BR'));
}

/** Alunos com frequência abaixo do mínimo legal, em ordem alfabética (sem ranking). */
export function attentionList(rows: PerformanceByStudent[]): AttentionItem[] {
  return rows
    .map((student) => ({ student, attendanceRate: studentRate(student) }))
    .filter((item): item is AttentionItem => item.attendanceRate !== null && item.attendanceRate < MIN_ATTENDANCE_RATE)
    .sort((a, b) => a.student.alunoNome.localeCompare(b.student.alunoNome, 'pt-BR'));
}

/** Agrupa a série diária em semanas (segunda-feira como início). */
export function weeklyAttendance(daily: DailyAttendance[]): WeeklyAttendance[] {
  const weeks = new Map<string, { presencas: number; ausencias: number }>();
  for (const day of daily) {
    const key = formatDate(getStartOfWeek(parseDate(day.data)));
    const current = weeks.get(key) ?? { presencas: 0, ausencias: 0 };
    current.presencas += day.presencas;
    current.ausencias += day.ausencias;
    weeks.set(key, current);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semanaInicio, totals]) => ({
      data: semanaInicio,
      semanaInicio,
      ...totals,
      attendanceRate: attendanceRate(totals.presencas, totals.ausencias),
    }));
}

export const RECORD_CATEGORIES: { value: RecordCategory; label: string; tone: Tone }[] = [
  { value: 'avanco', label: 'Avanço', tone: 'green' },
  { value: 'dificuldade', label: 'Dificuldade', tone: 'peach' },
  { value: 'atividade', label: 'Atividade', tone: 'blue' },
  { value: 'participacao', label: 'Participação', tone: 'purple' },
];

export function recordCategoryConfig(value: RecordCategory) {
  return RECORD_CATEGORIES.find((category) => category.value === value) ?? RECORD_CATEGORIES[0];
}

/** Quantidade de registros por categoria (dado bruto, sem pontuação). */
export function recordsByCategory(registros: Registro[]) {
  return RECORD_CATEGORIES.map((category) => ({
    ...category,
    count: registros.filter((registro) => registro.categoria === category.value).length,
  }));
}

const PLURALS = {
  presenca: ['presença', 'presenças'],
  ausencia: ['ausência', 'ausências'],
  chamada: ['chamada', 'chamadas'],
  registro: ['registro', 'registros'],
  atividade: ['atividade', 'atividades'],
  aluno: ['aluno', 'alunos'],
} as const;

/** "1 ausência", "3 ausências" — contagem com plural correto. */
export function count(value: number, noun: keyof typeof PLURALS) {
  return `${value} ${PLURALS[noun][value === 1 ? 0 : 1]}`;
}

/** "9 presenças • 1 ausência • 10 chamadas" */
export function attendanceBreakdown(presencas: number, ausencias: number) {
  return `${count(presencas, 'presenca')} • ${count(ausencias, 'ausencia')} • ${count(presencas + ausencias, 'chamada')}`;
}
