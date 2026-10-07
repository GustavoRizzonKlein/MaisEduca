import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { listAlunos, listTurmas } from '@/services/school-service';
import type { Aluno, Turma } from '@/types/school';

export type StudentSummary = Aluno & { turmaNome: string | null };

/**
 * Alunos e turmas visíveis ao usuário logado.
 * O escopo por perfil é garantido pelo RLS do Supabase (`can_access_student` /
 * `can_access_class`): Direção vê todos, Professor vê suas turmas, Professor de
 * Apoio vê seus alunos e Responsável vê apenas os próprios filhos.
 */
export function useStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextAlunos, nextTurmas] = await Promise.all([listAlunos(), listTurmas()]);
      const turmaNames = new Map(nextTurmas.map((turma) => [turma.id, turma.nome]));
      setTurmas(nextTurmas);
      setStudents(
        nextAlunos.map((aluno) => ({
          ...aluno,
          turmaNome: aluno.turma_id ? turmaNames.get(aluno.turma_id) ?? null : null,
        })),
      );
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os alunos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  return { students, turmas, loading, error, reload: load };
}
