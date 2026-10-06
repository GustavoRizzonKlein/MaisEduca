import { getSupabase } from '@/lib/supabase';
import type { Aluno, Turma } from '@/types/school';

function throwIfError(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback);
}

export async function listTurmas(): Promise<Turma[]> {
  const { data, error } = await getSupabase().from('turmas').select('*').order('nome');
  throwIfError(error, 'Não foi possível listar turmas.');
  return data ?? [];
}

export async function createTurma(nome: string): Promise<Turma> {
  const { data, error } = await getSupabase().from('turmas').insert({ nome: nome.trim() }).select('*').single();
  throwIfError(error, 'Não foi possível criar a turma.');
  return data;
}

export async function updateTurma(id: string, nome: string): Promise<Turma> {
  const { data, error } = await getSupabase()
    .from('turmas')
    .update({ nome: nome.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  throwIfError(error, 'Não foi possível atualizar a turma.');
  return data;
}

export async function deleteTurma(id: string): Promise<void> {
  const { error } = await getSupabase().from('turmas').delete().eq('id', id);
  throwIfError(error, 'Não foi possível excluir a turma.');
}

export async function listAlunos(): Promise<Aluno[]> {
  const { data, error } = await getSupabase().from('alunos').select('*').order('nome');
  throwIfError(error, 'Não foi possível listar alunos.');
  return data ?? [];
}

export async function listAlunosByTurma(turmaId: string): Promise<Aluno[]> {
  const { data, error } = await getSupabase()
    .from('alunos')
    .select('*')
    .eq('turma_id', turmaId)
    .order('nome');
  throwIfError(error, 'Não foi possível carregar os alunos da turma.');
  return data ?? [];
}

async function getAlunoById(id: string): Promise<Aluno> {
  const { data, error } = await getSupabase().from('alunos').select('*').eq('id', id).single();
  throwIfError(error, 'Não foi possível carregar o aluno salvo.');
  return data;
}

export async function createAlunoWithResponsavel(
  nome: string,
  turmaId: string,
  responsavelId: string,
): Promise<Aluno> {
  if (!nome.trim() || !turmaId || !responsavelId) {
    throw new Error('Informe o nome, a turma e um responsável para cadastrar o aluno.');
  }
  const { data: alunoId, error } = await getSupabase().rpc('create_aluno_with_responsavel', {
    p_nome: nome.trim(),
    p_turma_id: turmaId,
    p_responsavel_id: responsavelId,
  });
  throwIfError(error, 'Não foi possível cadastrar o aluno com o responsável selecionado.');
  if (typeof alunoId !== 'string') throw new Error('O cadastro não retornou o aluno criado.');
  return getAlunoById(alunoId);
}

export async function updateAlunoWithResponsavel(
  alunoId: string,
  nome: string,
  responsavelId: string,
): Promise<Aluno> {
  if (!nome.trim() || !alunoId || !responsavelId) {
    throw new Error('Informe o nome e um responsável para atualizar o aluno.');
  }
  const { data: updatedAlunoId, error } = await getSupabase().rpc('update_aluno_with_responsavel', {
    p_aluno_id: alunoId,
    p_nome: nome.trim(),
    p_responsavel_id: responsavelId,
  });
  throwIfError(error, 'Não foi possível atualizar o aluno e seu responsável.');
  if (typeof updatedAlunoId !== 'string') throw new Error('A atualização não retornou o aluno.');
  return getAlunoById(updatedAlunoId);
}

export async function deleteAluno(id: string): Promise<void> {
  const { error } = await getSupabase().from('alunos').delete().eq('id', id);
  throwIfError(error, 'Não foi possível excluir o aluno.');
}

export async function listProfessorTurmas(professorId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('professor_turmas')
    .select('turma_id')
    .eq('professor_id', professorId);
  throwIfError(error, 'Não foi possível listar vínculos do professor.');
  return (data ?? []).map((row) => row.turma_id);
}

export async function setProfessorTurmas(professorId: string, turmaIds: string[]): Promise<void> {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase.from('professor_turmas').delete().eq('professor_id', professorId);
  throwIfError(deleteError, 'Não foi possível atualizar vínculos do professor.');
  if (turmaIds.length === 0) return;
  const { error } = await supabase
    .from('professor_turmas')
    .insert(turmaIds.map((turma_id) => ({ professor_id: professorId, turma_id })));
  throwIfError(error, 'Não foi possível associar turmas ao professor.');
}

export async function listProfessorApoioAlunos(professorId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('professor_apoio_alunos')
    .select('aluno_id')
    .eq('professor_id', professorId);
  throwIfError(error, 'Não foi possível listar vínculos do professor de apoio.');
  return (data ?? []).map((row) => row.aluno_id);
}

export async function setProfessorApoioAlunos(professorId: string, alunoIds: string[]): Promise<void> {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase
    .from('professor_apoio_alunos')
    .delete()
    .eq('professor_id', professorId);
  throwIfError(deleteError, 'Não foi possível atualizar vínculos do professor de apoio.');
  if (alunoIds.length === 0) return;
  const { error } = await supabase
    .from('professor_apoio_alunos')
    .insert(alunoIds.map((aluno_id) => ({ professor_id: professorId, aluno_id })));
  throwIfError(error, 'Não foi possível associar alunos ao professor de apoio.');
}

export async function listResponsavelAlunos(responsavelId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('responsavel_alunos')
    .select('aluno_id')
    .eq('responsavel_id', responsavelId);
  throwIfError(error, 'Não foi possível listar vínculos do responsável.');
  return (data ?? []).map((row) => row.aluno_id);
}

export async function listResponsaveisDosAlunos(
  alunoIds: string[],
): Promise<{ aluno_id: string; responsavel_id: string }[]> {
  if (alunoIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from('responsavel_alunos')
    .select('aluno_id, responsavel_id')
    .in('aluno_id', alunoIds);
  throwIfError(error, 'Não foi possível carregar os responsáveis dos alunos.');
  return data ?? [];
}

export async function setResponsavelAlunos(responsavelId: string, alunoIds: string[]): Promise<void> {
  const { error } = await getSupabase().rpc('set_responsavel_alunos', {
    p_responsavel_id: responsavelId,
    p_aluno_ids: alunoIds,
  });
  throwIfError(error, 'Não foi possível atualizar os vínculos do responsável.');
}
