export type Turma = {
  id: string;
  nome: string;
  created_at?: string;
  updated_at?: string;
};

export type Aluno = {
  id: string;
  nome: string;
  turma_id: string | null;
  created_at?: string;
  updated_at?: string;
};
