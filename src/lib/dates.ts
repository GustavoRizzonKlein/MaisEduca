/** Utilitários de data no formato `AAAA-MM-DD` usado pelo modelo `AgendaItem`. */

export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return formatDate(new Date());
}

export function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function getStartOfWeek(date: Date) {
  const copy = new Date(date);
  const dayIndex = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - dayIndex);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Dias úteis (segunda a sexta) da semana que contém `date`. */
export function getWeekDays(date: Date) {
  const start = getStartOfWeek(date);
  return Array.from({ length: 5 }, (_, index) => formatDate(addDays(start, index)));
}

export function isSameWeek(first: Date, second: Date) {
  return formatDate(getStartOfWeek(first)) === formatDate(getStartOfWeek(second));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatWeekRange(startDate: Date) {
  const endDate = addDays(startDate, 4);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  return `${startDate.toLocaleDateString('pt-BR', options)} – ${endDate.toLocaleDateString('pt-BR', options)}`;
}

export function formatLongDate(value: string) {
  return capitalize(
    parseDate(value).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
  );
}

export function formatWeekdayShort(value: string) {
  return capitalize(parseDate(value).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3));
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
