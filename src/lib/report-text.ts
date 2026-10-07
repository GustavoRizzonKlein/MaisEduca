import { attendanceBreakdown, count, formatRate, recordCategoryConfig, studentRate, weeklyAttendance } from '@/lib/performance';
import { formatPeriodLabel, formatShortDate } from '@/lib/periods';
import type { Presenca, Registro } from '@/types/education';
import type { DailyAttendance, PerformanceByStudent, PerformanceSummary, ReportPeriod } from '@/types/performance';

function summaryLines(summary: PerformanceSummary) {
  return [
    `Frequência: ${formatRate(summary.attendanceRate)} (${attendanceBreakdown(summary.presencas, summary.ausencias)})`,
    `Atividades planejadas na agenda: ${summary.activitiesCount}`,
    `Registros de acompanhamento: ${summary.recordsCount}`,
  ];
}

function weeklyLines(daily: DailyAttendance[]) {
  const weeks = weeklyAttendance(daily);
  if (weeks.length === 0) return ['Sem chamadas no período.'];
  return weeks.map((week) => `Semana de ${formatShortDate(week.semanaInicio)}: ${formatRate(week.attendanceRate)} (${week.presencas}P / ${week.ausencias}A)`);
}

function header(title: string, subject: string, period: ReportPeriod) {
  return [`MaisEduca — ${title}`, subject, `Período: ${formatPeriodLabel(period)}`, `Gerado em: ${new Date().toLocaleString('pt-BR')}`, ''];
}

/** Texto do relatório da turma (compartilhado pelo menu nativo). */
export function buildClassReportText(input: {
  turmaNome: string;
  period: ReportPeriod;
  summary: PerformanceSummary;
  rows: PerformanceByStudent[];
  daily: DailyAttendance[];
}) {
  return [
    ...header('Relatório da turma', `Turma: ${input.turmaNome} (${count(input.summary.studentsCount, 'aluno')})`, input.period),
    'RESUMO',
    ...summaryLines(input.summary),
    '',
    'FREQUÊNCIA POR SEMANA',
    ...weeklyLines(input.daily),
    '',
    'ALUNOS (ordem alfabética)',
    ...input.rows.map((row) =>
      `${row.alunoNome}: frequência ${formatRate(studentRate(row))} (${row.presencas}P / ${row.ausencias}A) • ${count(row.registros, 'registro')} • ${count(row.atividades, 'atividade')}`),
  ].join('\n');
}

/** Texto do relatório individual — contém apenas dados do próprio aluno. */
export function buildStudentReportText(input: {
  alunoNome: string;
  turmaNome: string | null;
  period: ReportPeriod;
  summary: PerformanceSummary;
  daily: DailyAttendance[];
  registros: Registro[];
  ausencias: Presenca[];
}) {
  return [
    ...header('Relatório do aluno', `Aluno: ${input.alunoNome}${input.turmaNome ? ` • ${input.turmaNome}` : ''}`, input.period),
    'RESUMO',
    ...summaryLines(input.summary),
    '',
    'FREQUÊNCIA POR SEMANA',
    ...weeklyLines(input.daily),
    '',
    'AUSÊNCIAS',
    ...(input.ausencias.length ? input.ausencias.map((ausencia) => `• ${formatShortDate(ausencia.data)}`) : ['Nenhuma ausência registrada.']),
    '',
    'REGISTROS',
    ...(input.registros.length
      ? input.registros.map((registro) => `• ${formatShortDate(registro.data)} — ${recordCategoryConfig(registro.categoria).label}: ${registro.texto}`)
      : ['Nenhum registro no período.']),
  ].join('\n');
}
