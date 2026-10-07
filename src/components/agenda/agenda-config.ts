import type { IconKey } from '@/components/app-icon';
import type { Tone } from '@/constants/theme';
import type { AgendaItem, AgendaItemType } from '@/types/education';

export const agendaTypes: { value: AgendaItemType; label: string; icon: IconKey; tone: Tone }[] = [
  { value: 'atividade', label: 'Atividade', icon: 'activity', tone: 'blue' },
  { value: 'aula', label: 'Aula', icon: 'book', tone: 'purple' },
  { value: 'intervalo', label: 'Intervalo', icon: 'break', tone: 'green' },
  { value: 'terapia', label: 'Terapia', icon: 'therapy', tone: 'pink' },
  { value: 'evento', label: 'Evento', icon: 'event', tone: 'yellow' },
  { value: 'outro', label: 'Outro', icon: 'more', tone: 'neutral' },
];

export function agendaTypeConfig(type: AgendaItemType) {
  return agendaTypes.find((entry) => entry.value === type) ?? agendaTypes[0];
}

export function formatTimeRange(item: Pick<AgendaItem, 'horarioInicio' | 'horarioFim'>) {
  return item.horarioFim ? `${item.horarioInicio} – ${item.horarioFim}` : item.horarioInicio;
}

export function sortAgendaItems(items: AgendaItem[]) {
  return [...items].sort((a, b) => a.data.localeCompare(b.data) || a.horarioInicio.localeCompare(b.horarioInicio));
}
