export type AgendaItemType =
  | 'atividade'
  | 'aula'
  | 'intervalo'
  | 'terapia'
  | 'evento'
  | 'outro';

/** Item de agenda — persistido em `public.agenda_itens`. */
export type AgendaItem = {
  id: string;
  alunoId: string;
  titulo: string;
  descricao?: string;
  data: string;
  horarioInicio: string;
  horarioFim?: string;
  tipo: AgendaItemType;
  disciplina?: string;
  local?: string;
  observacao?: string;
};

export type AttendanceStatus = 'presente' | 'ausente';

/** Chamada de um aluno em um dia — `public.presencas`. */
export type Presenca = {
  id: string;
  alunoId: string;
  data: string;
  status: AttendanceStatus;
};

export type RecordCategory = 'avanco' | 'dificuldade' | 'atividade' | 'participacao';

/** Registro qualitativo de acompanhamento — `public.registros`. */
export type Registro = {
  id: string;
  alunoId: string;
  data: string;
  categoria: RecordCategory;
  texto: string;
  criadoPor: string | null;
  createdAt: string;
};
