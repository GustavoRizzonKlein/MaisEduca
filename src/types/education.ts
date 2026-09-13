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
