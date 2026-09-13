export type ObservationCategory = 'Dificuldade' | 'Avanço' | 'Atividade';

export type Student = {
  id: string;
  name: string;
  className: string;
  supportNeed: string;
  responsibleName: string;
};

export type StudentNote = {
  id: string;
  studentId: string;
  date: string;
  teacherName: string;
  category: ObservationCategory;
  text: string;
};

export type AgendaItemType =
  | 'atividade'
  | 'aula'
  | 'intervalo'
  | 'terapia'
  | 'evento'
  | 'outro';

export type AgendaItem = {
  id: string;
  alunoId: string;
  titulo: string;
  descricao?: string;
  data: string;
  horarioInicio: string;
  horarioFim?: string;
  tipo: AgendaItemType;
  observacao?: string;
};
