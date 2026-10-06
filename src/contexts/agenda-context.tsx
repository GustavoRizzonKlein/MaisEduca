import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { mockAgendaItems } from '@/mocks/agenda';
import { can } from '@/types/auth';
import type { AgendaItem } from '@/types/education';

type AgendaContextValue = {
  items: AgendaItem[];
  createItem: (item: Omit<AgendaItem, 'id'>) => void;
  updateItem: (item: AgendaItem) => void;
  deleteItem: (id: string) => void;
};

const AgendaContext = createContext<AgendaContextValue | undefined>(undefined);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<AgendaItem[]>(mockAgendaItems);

  const value = useMemo<AgendaContextValue>(
    () => ({
      items,
      createItem: (item) => {
        if (!can(user?.role, 'agenda:edit')) throw new Error('Seu perfil não pode editar a agenda.');
        setItems((current) => [...current, { ...item, id: `agenda-${Date.now()}` }]);
      },
      updateItem: (item) => {
        if (!can(user?.role, 'agenda:edit')) throw new Error('Seu perfil não pode editar a agenda.');
        setItems((current) => current.map((currentItem) => currentItem.id === item.id ? item : currentItem));
      },
      deleteItem: (id) => {
        if (!can(user?.role, 'agenda:edit')) throw new Error('Seu perfil não pode editar a agenda.');
        setItems((current) => current.filter((item) => item.id !== id));
      },
    }),
    [items, user],
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (!context) throw new Error('useAgenda deve ser usado dentro de AgendaProvider.');
  return context;
}
