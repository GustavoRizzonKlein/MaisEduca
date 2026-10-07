export type PeriodPreset = 'hoje' | 'semana' | 'mes' | '30dias' | 'personalizado';

/** Período inclusivo nas duas pontas, datas locais `AAAA-MM-DD`. */
export type ReportPeriod = {
  preset: PeriodPreset;
  inicio: string;
  fim: string;
};

export type ReportFilter = {
  period: ReportPeriod;
  turmaId?: string | null;
  alunoId?: string | null;
};

/** Linha devolvida por `public.desempenho_por_aluno` (já filtrada pelo RLS). */
export type PerformanceByStudent = {
  alunoId: string;
  alunoNome: string;
  turmaId: string | null;
  turmaNome: string | null;
  presencas: number;
  ausencias: number;
  registros: number;
  atividades: number;
  ultimoRegistro: string | null;
};

export type PerformanceSummary = {
  studentsCount: number;
  presencas: number;
  ausencias: number;
  /** Total de chamadas lançadas (presenças + ausências). */
  chamadas: number;
  /** `null` quando não há chamada no período — nunca 0% inventado. */
  attendanceRate: number | null;
  activitiesCount: number;
  recordsCount: number;
  studentsWithRecords: number;
  studentsWithAttendance: number;
};

export type PerformanceByClass = PerformanceSummary & {
  turmaId: string | null;
  turmaNome: string;
};

export type DailyAttendance = {
  data: string;
  presencas: number;
  ausencias: number;
};

export type WeeklyAttendance = DailyAttendance & {
  /** Segunda-feira da semana. */
  semanaInicio: string;
  attendanceRate: number | null;
};

export type AttentionItem = {
  student: PerformanceByStudent;
  attendanceRate: number;
};

export type PerformanceData = {
  rows: PerformanceByStudent[];
  daily: DailyAttendance[];
};
