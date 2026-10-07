import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, ConfirmDialog, DayStrip, EmptyState, ErrorState, LoadingState, Notice, StatusBadge } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAgendaItems } from '@/hooks/use-agenda-items';
import {
  addDays,
  formatDate,
  formatLongDate,
  formatWeekRange,
  getStartOfWeek,
  getWeekDays,
  isSameWeek,
  parseDate,
  todayKey,
} from '@/lib/dates';
import { can } from '@/types/auth';
import type { AgendaItem } from '@/types/education';

import { sortAgendaItems } from './agenda-config';
import { AgendaDetailSheet } from './agenda-detail-sheet';
import { AgendaFormSheet } from './agenda-form-sheet';
import { AgendaItemCard } from './agenda-item-card';

type AgendaPanelProps = {
  alunoId: string;
  /** Linha de contexto exibida nos cards (ex.: turma). */
  context?: string | null;
};

/**
 * Agenda semanal de um aluno: seletor de data, linha do tempo e, para perfis
 * com `agenda:edit`, criação/edição/exclusão. Dados persistidos em `agenda_itens`.
 */
export function AgendaPanel({ alunoId, context }: AgendaPanelProps) {
  const { user } = useAuth();
  const canEdit = can(user?.role, 'agenda:edit');

  const [weekAnchor, setWeekAnchor] = useState(() => getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [formItem, setFormItem] = useState<AgendaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AgendaItem | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const { items, loading, error, reload, createItem, updateItem, deleteItem } = useAgendaItems({
    alunoId,
    from: weekDays[0],
    to: weekDays[weekDays.length - 1],
  });
  const studentItems = useMemo(() => sortAgendaItems(items), [items]);
  const markedDays = useMemo(() => new Set(studentItems.map((item) => item.data)), [studentItems]);
  const dayItems = useMemo(() => studentItems.filter((item) => item.data === selectedDate), [studentItems, selectedDate]);

  useEffect(() => {
    if (!weekDays.includes(selectedDate)) {
      setSelectedDate(weekDays.find((day) => day >= todayKey()) ?? weekDays[0]);
    }
  }, [selectedDate, weekDays]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const weekLabel = isSameWeek(weekAnchor, new Date()) ? 'Esta semana' : formatWeekRange(weekAnchor);

  function openCreate() {
    if (!canEdit) return;
    setFormItem({
      id: '',
      alunoId,
      titulo: '',
      data: selectedDate,
      horarioInicio: '08:00',
      horarioFim: '',
      tipo: 'atividade',
      descricao: '',
      disciplina: '',
      local: '',
      observacao: '',
    });
  }

  async function handleSave(item: AgendaItem) {
    if (!canEdit) return;
    const savedItem = {
      ...item,
      alunoId,
      data: item.data.trim(),
      horarioInicio: item.horarioInicio.trim(),
      horarioFim: item.horarioFim?.trim() ?? '',
    };
    setSaving(true);
    try {
      if (item.id) await updateItem(savedItem);
      else await createItem(savedItem);
      setFormItem(null);
      setFeedback({ tone: 'success', message: item.id ? 'Atividade atualizada.' : 'Atividade adicionada à agenda.' });
      const savedDate = parseDate(savedItem.data);
      setWeekAnchor(getStartOfWeek(savedDate));
      setSelectedDate(formatDate(savedDate));
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar a atividade.' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canEdit || !pendingDelete) return;
    setSaving(true);
    try {
      await deleteItem(pendingDelete.id);
      setFeedback({ tone: 'success', message: 'Atividade excluída.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível excluir a atividade.' });
    } finally {
      setSaving(false);
      setPendingDelete(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <DayStrip
        days={weekDays}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        weekLabel={weekLabel}
        onPreviousWeek={() => setWeekAnchor((current) => addDays(current, -7))}
        onNextWeek={() => setWeekAnchor((current) => addDays(current, 7))}
        markedDays={markedDays}
      />

      <View style={styles.dayHeader}>
        <View style={styles.dayTitle}>
          <ThemedText type="heading">{formatLongDate(selectedDate)}</ThemedText>
          {selectedDate === todayKey() ? <StatusBadge status="hoje" /> : null}
        </View>
        {canEdit ? (
          <Button title="Nova" icon="plus" size="small" variant="secondary" fullWidth={false} onPress={openCreate} />
        ) : null}
      </View>

      {feedback ? <Notice tone={feedback.tone} message={feedback.message} /> : null}

      {loading && items.length === 0 ? (
        <LoadingState rows={2} label="Carregando agenda" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : dayItems.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Nenhuma atividade neste dia"
          description={canEdit ? 'Adicione atividades, aulas ou rotinas para este aluno.' : 'Quando houver atividades planejadas, elas aparecerão aqui.'}
          actionLabel={canEdit ? 'Adicionar atividade' : undefined}
          onAction={canEdit ? openCreate : undefined}
        />
      ) : (
        <View style={styles.list}>
          {dayItems.map((item, index) => (
            <AgendaItemCard
              key={item.id}
              item={item}
              context={context}
              isLast={index === dayItems.length - 1}
              onPress={() => setSelectedItem(item)}
            />
          ))}
        </View>
      )}


      <AgendaDetailSheet
        item={selectedItem}
        canEdit={canEdit}
        onClose={() => setSelectedItem(null)}
        onEdit={() => {
          if (!selectedItem) return;
          setFormItem({ ...selectedItem });
          setSelectedItem(null);
        }}
        onDelete={() => {
          setPendingDelete(selectedItem);
          setSelectedItem(null);
        }}
      />
      <AgendaFormSheet item={formItem} saving={saving} onClose={() => setFormItem(null)} onSave={handleSave} />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Excluir atividade?"
        message={pendingDelete ? `Tem certeza que deseja excluir "${pendingDelete.titulo}"?` : ''}
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  dayTitle: { flex: 1, gap: Spacing.one, alignItems: 'flex-start' },
  list: { gap: Spacing.three },
});
