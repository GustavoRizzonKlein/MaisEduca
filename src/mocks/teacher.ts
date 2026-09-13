import type { Student, StudentNote } from '@/types/education';

export const mockStudents: Student[] = [
  {
    id: 'student-joao',
    name: 'João Martins',
    className: '5º ano A',
    supportNeed: 'Acompanhamento em leitura',
    responsibleName: 'Responsável de João',
  },
  {
    id: 'student-maria',
    name: 'Maria Oliveira',
    className: '5º ano A',
    supportNeed: 'Apoio na organização das atividades',
    responsibleName: 'Responsável de Maria',
  },
  {
    id: 'student-pedro',
    name: 'Pedro Santos',
    className: '4º ano B',
    supportNeed: 'Acompanhamento em matemática',
    responsibleName: 'Responsável de Pedro',
  },
];

export const mockStudentNotes: StudentNote[] = [
  {
    id: 'note-joao-1',
    studentId: 'student-joao',
    date: '12/09/2026',
    teacherName: 'Ana Souza',
    category: 'Dificuldade',
    text: 'O aluno apresentou dificuldade durante a atividade de leitura.',
  },
  {
    id: 'note-joao-2',
    studentId: 'student-joao',
    date: '13/09/2026',
    teacherName: 'Carlos Lima',
    category: 'Avanço',
    text: 'O aluno conseguiu realizar a atividade utilizando apoio visual.',
  },
  {
    id: 'note-joao-3',
    studentId: 'student-joao',
    date: '15/09/2026',
    teacherName: 'Ana Souza',
    category: 'Atividade',
    text: 'Participou da leitura compartilhada e pediu ajuda quando necessário.',
  },
  {
    id: 'note-maria-1',
    studentId: 'student-maria',
    date: '14/09/2026',
    teacherName: 'Ana Souza',
    category: 'Avanço',
    text: 'Organizou os materiais com um lembrete visual e iniciou a atividade no tempo combinado.',
  },
  {
    id: 'note-pedro-1',
    studentId: 'student-pedro',
    date: '15/09/2026',
    teacherName: 'Carlos Lima',
    category: 'Atividade',
    text: 'Resolveu problemas de adição utilizando material concreto.',
  },
];
