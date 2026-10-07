import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  createAgendaItem,
  deleteAgendaItem,
  listAgendaItems,
  updateAgendaItem,
} from '@/services/agenda-service';
import { can } from '@/types/auth';
import type { AgendaItem } from '@/types/education';

type AgendaFilter = { alunoId?: string; from: string; to: string; limit?: number };

/**
 * Itens de agenda persistidos no Supabase (`agenda_itens`), visíveis conforme
 * o RLS. As mutações checam `agenda:edit` no app e o banco valida novamente.
 */
export function useAgendaItems({ alunoId, from, to, limit }: AgendaFilter) {
  const { user } = useAuth();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listAgendaItems({ alunoId, from, to, limit }));
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  }, [alunoId, from, to, limit]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const canEdit = can(user?.role, 'agenda:edit');
  const assertCanEdit = useCallback(() => {
    if (!canEdit) throw new Error('Seu perfil não pode editar a agenda.');
  }, [canEdit]);

  const createItem = useCallback(async (item: Omit<AgendaItem, 'id'>) => {
    assertCanEdit();
    const created = await createAgendaItem(item);
    await load();
    return created;
  }, [assertCanEdit, load]);

  const updateItem = useCallback(async (item: AgendaItem) => {
    assertCanEdit();
    const updated = await updateAgendaItem(item);
    await load();
    return updated;
  }, [assertCanEdit, load]);

  const deleteItem = useCallback(async (id: string) => {
    assertCanEdit();
    await deleteAgendaItem(id);
    await load();
  }, [assertCanEdit, load]);

  return { items, loading, error, reload: load, createItem, updateItem, deleteItem };
}
