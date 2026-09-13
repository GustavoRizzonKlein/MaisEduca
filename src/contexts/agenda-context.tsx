import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { mockAgendaItems } from '@/mocks/agenda';
import type { AgendaItem } from '@/types/education';

type AgendaContextValue = {
  items: AgendaItem[];
  createItem: (item: Omit<AgendaItem, 'id'>) => void;
  updateItem: (item: AgendaItem) => void;
  deleteItem: (id: string) => void;
};

const AgendaContext = createContext<AgendaContextValue | undefined>(undefined);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AgendaItem[]>(mockAgendaItems);

  const value = useMemo<AgendaContextValue>(
    () => ({
      items,
      createItem: (item) => setItems((current) => [...current, { ...item, id: `agenda-${Date.now()}` }]),
      updateItem: (item) => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? item : currentItem)),
      deleteItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    }),
    [items],
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (!context) throw new Error('useAgenda deve ser usado dentro de AgendaProvider.');
  return context;
}
