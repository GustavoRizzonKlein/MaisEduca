import { addDays, formatDate, formatWeekdayShort, parseDate } from '@/lib/dates';
import { attendanceRate, weeklyAttendance } from '@/lib/performance';
import { formatShortDate } from '@/lib/periods';
import type { DailyAttendance, ReportPeriod } from '@/types/performance';

import type { BarDatum } from './charts';

const MAX_DAILY_BARS = 7;

/**
 * Série de frequência para o gráfico: por dia em períodos curtos (até 7 dias,
 * incluindo dias sem chamada como "sem dados") e por semana nos demais.
 */
export function attendanceChartData(daily: DailyAttendance[], period: ReportPeriod): { data: BarDatum[]; granularity: 'dia' | 'semana' } {
  const start = parseDate(period.inicio);
  const end = parseDate(period.fim);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (days <= MAX_DAILY_BARS) {
    const byDate = new Map(daily.map((day) => [day.data, day]));
    const data = Array.from({ length: days }, (_, index) => {
      const key = formatDate(addDays(start, index));
      const day = byDate.get(key);
      return {
        key,
        label: formatWeekdayShort(key),
        value: day ? attendanceRate(day.presencas, day.ausencias) : null,
        detail: key.slice(8, 10),
      };
    });
    return { data, granularity: 'dia' };
  }

  const data = weeklyAttendance(daily)
    .slice(-8)
    .map((week) => ({
      key: week.semanaInicio,
      label: formatShortDate(week.semanaInicio).slice(0, 5),
      value: week.attendanceRate,
      detail: `${week.presencas + week.ausencias} ch.`,
    }));
  return { data, granularity: 'semana' };
}
