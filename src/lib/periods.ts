import { addDays, formatDate, getStartOfWeek, parseDate } from '@/lib/dates';
import type { PeriodPreset, ReportPeriod } from '@/types/performance';

export const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mês' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: 'personalizado', label: 'Personalizado' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Mesmo limite validado no banco (`desempenho_por_aluno`). */
export const MAX_PERIOD_DAYS = 366;

export function isValidDateKey(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  return formatDate(parseDate(value)) === value;
}

function daysBetween(inicio: string, fim: string) {
  return Math.round((parseDate(fim).getTime() - parseDate(inicio).getTime()) / 86_400_000);
}

export function validateRange(inicio: string, fim: string): string | null {
  if (!isValidDateKey(inicio) || !isValidDateKey(fim)) return 'Use datas válidas no formato AAAA-MM-DD.';
  if (inicio > fim) return 'A data inicial deve ser anterior ou igual à final.';
  if (daysBetween(inicio, fim) > MAX_PERIOD_DAYS) return 'O período máximo é de um ano.';
  return null;
}

/** Converte um preset em datas locais inclusivas, relativo a `today`. */
export function resolvePeriod(preset: Exclude<PeriodPreset, 'personalizado'>, today = new Date()): ReportPeriod {
  const todayKey = formatDate(today);
  switch (preset) {
    case 'hoje':
      return { preset, inicio: todayKey, fim: todayKey };
    case 'semana':
      return { preset, inicio: formatDate(getStartOfWeek(today)), fim: todayKey };
    case 'mes':
      return { preset, inicio: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), fim: todayKey };
    case '30dias':
      return { preset, inicio: formatDate(addDays(today, -29)), fim: todayKey };
  }
}

/** Lê o período dos parâmetros da rota (mantém o mesmo filtro entre telas). */
export function periodFromParams(params: { periodo?: string; inicio?: string; fim?: string }): ReportPeriod {
  const preset = PERIOD_OPTIONS.some((option) => option.value === params.periodo) ? (params.periodo as PeriodPreset) : 'semana';
  if (preset === 'personalizado' && params.inicio && params.fim && !validateRange(params.inicio, params.fim)) {
    return { preset, inicio: params.inicio, fim: params.fim };
  }
  return resolvePeriod(preset === 'personalizado' ? 'semana' : preset);
}

export function periodToParams(period: ReportPeriod) {
  return { periodo: period.preset, inicio: period.inicio, fim: period.fim };
}

export function formatShortDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function formatPeriodLabel(period: ReportPeriod) {
  if (period.inicio === period.fim) return formatShortDate(period.inicio);
  return `${formatShortDate(period.inicio)} – ${formatShortDate(period.fim)}`;
}
