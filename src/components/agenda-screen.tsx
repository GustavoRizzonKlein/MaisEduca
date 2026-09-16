import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAgenda } from '@/contexts/agenda-context';
import { mockStudents } from '@/mocks/teacher';
import type { AgendaItem, AgendaItemType } from '@/types/education';

const agendaTypes: { label: string; value: AgendaItemType }[] = [
  { label: 'Atividade', value: 'atividade' },
  { label: 'Aula', value: 'aula' },
  { label: 'Intervalo', value: 'intervalo' },
  { label: 'Terapia', value: 'terapia' },
  { label: 'Evento', value: 'evento' },
  { label: 'Outro', value: 'outro' },
];

const typeIcon: Record<AgendaItemType, string> = {
  atividade: '✏️',
  aula: '📚',
  intervalo: '☕',
  terapia: '🧩',
  evento: '📌',
  outro: '🗓️',
};

const defaultActivity: Omit<AgendaItem, 'id'> = {
  alunoId: '',
  titulo: '',
  data: '',
  horarioInicio: '08:00',
  horarioFim: '',
  tipo: 'atividade',
  descricao: '',
  disciplina: '',
  local: '',
  observacao: '',
};

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function getStartOfWeek(date: Date) {
  const copy = new Date(date);
  const dayIndex = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - dayIndex);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekDays(date: Date) {
  const start = getStartOfWeek(date);
  return Array.from({ length: 5 }, (_, index) => formatDate(addDays(start, index)));
}

function isSameWeek(first: Date, second: Date) {
  const firstStart = getStartOfWeek(first);
  const secondStart = getStartOfWeek(second);
  return formatDate(firstStart) === formatDate(secondStart);
}

function formatWeekRange(startDate: Date) {
  const endDate = addDays(startDate, 4);
  const startLabel = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const endLabel = endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${startLabel} • ${endLabel}`;
}

function formatLongDate(value: string) {
  return parseDate(value).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).replace(/(^\w)/, (match) => match.toUpperCase());
}

function isSameDay(date: string, other: string) {
  return date === other;
}

export function AgendaScreen({ studentId, canEdit }: { studentId: string; canEdit: boolean }) {
  const { items, createItem, updateItem, deleteItem } = useAgenda();
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [formItem, setFormItem] = useState<AgendaItem | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(() => getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));

  const student = mockStudents.find((candidate) => candidate.id === studentId);
  const weeklyItems = useMemo(
    () => items
      .filter((item) => item.alunoId === studentId)
      .sort((a, b) => {
        const dateDiff = parseDate(a.data).getTime() - parseDate(b.data).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.horarioInicio.localeCompare(b.horarioInicio);
      }),
    [items, studentId],
  );

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);

  useEffect(() => {
    if (!weekDays.some((day) => isSameDay(day, selectedDate))) {
      const nextSelected = weekDays.find((day) => day >= formatDate(new Date())) ?? weekDays[0];
      setSelectedDate(nextSelected);
    }
  }, [selectedDate, weekDays]);

  const selectedDateItems = useMemo(
    () => weeklyItems.filter((item) => item.data === selectedDate),
    [selectedDate, weeklyItems],
  );

  const isCurrentWeek = useMemo(() => isSameWeek(weekAnchor, new Date()), [weekAnchor]);

  if (!student) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Aluno não encontrado.</ThemedText>
      </ThemedView>
    );
  }

  const handleCreate = () => {
    setFormItem({
      ...defaultActivity,
      id: '',
      alunoId: studentId,
      data: selectedDate,
      horarioInicio: '08:00',
      horarioFim: '',
      tipo: 'atividade',
    });
  };

  const weekLabel = isCurrentWeek ? 'Esta semana' : formatWeekRange(weekAnchor);

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>‹</ThemedText>
          </Pressable>
          <View style={styles.headerTextWrap}>
            <ThemedText type="small" themeColor="textSecondary">Agenda</ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.studentHeader}>
            <ThemedText type="subtitle" style={styles.studentName}>{student.name}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.studentClass}>{student.className}</ThemedText>
          </View>

          <View style={styles.weekNavigator}>
            <Pressable onPress={() => setWeekAnchor((current) => addDays(current, -7))} style={styles.navButton}>
              <ThemedText style={styles.navButtonText}>‹</ThemedText>
            </Pressable>
            <ThemedText style={styles.weekLabel}>{weekLabel}</ThemedText>
            <Pressable onPress={() => setWeekAnchor((current) => addDays(current, 7))} style={styles.navButton}>
              <ThemedText style={styles.navButtonText}>›</ThemedText>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelector}>
            {weekDays.map((day) => {
              const isSelected = day === selectedDate;
              const isToday = day === formatDate(new Date());
              const dateObj = parseDate(day);
              const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3).toUpperCase();
              const dayNumber = dateObj.getDate();

              return (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDate(day)}
                  style={[styles.dayItem, isSelected && styles.dayItemSelected]}
                >
                  <ThemedText type="small" style={[styles.dayName, isSelected && styles.dayNameSelected]}>{dayName}</ThemedText>
                  <ThemedText style={[styles.dayNumberText, isSelected && styles.dayNumberSelected]}>{dayNumber}</ThemedText>
                  {isToday && <View style={styles.todayDot} />}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.daySummary}>
            <ThemedText type="smallBold" style={styles.daySummaryText}>{formatLongDate(selectedDate)}</ThemedText>
            {selectedDate === formatDate(new Date()) && <View style={styles.todayBadge}><ThemedText type="smallBold" style={styles.todayBadgeText}>HOJE</ThemedText></View>}
          </View>

          {selectedDateItems.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyState}>
              <ThemedText style={styles.emptyIcon}>📚</ThemedText>
              <ThemedText type="subtitle" style={styles.emptyTitle}>Nenhuma atividade</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>Não há atividades cadastradas para este dia.</ThemedText>
              {canEdit && (
                <Pressable onPress={handleCreate} style={styles.primaryAction}>
                  <ThemedText style={styles.primaryActionText}>+ Adicionar atividade</ThemedText>
                </Pressable>
              )}
            </ThemedView>
          ) : (
            <View style={styles.listWrap}>
              {selectedDateItems.map((item) => {
                const typeLabel = agendaTypes.find((entry) => entry.value === item.tipo)?.label ?? 'Atividade';
                const disciplineLabel = item.disciplina ?? item.descricao ?? 'Disciplina';
                const locationLabel = item.local ? `📍 ${item.local}` : '';

                return (
                  <Pressable key={item.id} onPress={() => setSelectedItem(item)} style={styles.activityItem}>
                    <ThemedText style={styles.timeLabel}>{item.horarioInicio}</ThemedText>
                    <ThemedView type="backgroundElement" style={styles.activityCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.typePill}>
                          <ThemedText style={styles.typePillText}>{typeIcon[item.tipo]} {typeLabel.toUpperCase()}</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={styles.activityTitle}>{item.titulo}</ThemedText>
                      {disciplineLabel && <ThemedText themeColor="textSecondary" style={styles.activityMeta}>{disciplineLabel}</ThemedText>}
                      {locationLabel ? <ThemedText themeColor="textSecondary" style={styles.activityMeta}>{locationLabel}</ThemedText> : null}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          )}

          {canEdit && (
            <View style={styles.footerButtonWrap}>
              <PrimaryButton title="+ Adicionar atividade" onPress={handleCreate} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AgendaDetailModal
        item={selectedItem}
        canEdit={canEdit}
        onClose={() => setSelectedItem(null)}
        onEdit={() => {
          if (!selectedItem) return;
          setFormItem({ ...selectedItem });
          setSelectedItem(null);
        }}
        onDelete={() => {
          if (!selectedItem) return;

          Alert.alert('Excluir atividade?', `Tem certeza que deseja excluir "${selectedItem.titulo}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Excluir',
              style: 'destructive',
              onPress: () => {
                deleteItem(selectedItem.id);
                setSelectedItem(null);
              },
            },
          ]);
        }}
      />

      <AgendaFormModal
        item={formItem}
        onClose={() => setFormItem(null)}
        onSave={(item) => {
          if (item.id) {
            updateItem(item);
          } else {
            createItem(item);
          }
          setFormItem(null);
        }}
      />
    </ThemedView>
  );
}

function AgendaDetailModal({
  item,
  canEdit,
  onClose,
  onEdit,
  onDelete,
}: {
  item: AgendaItem | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!item) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ThemedView style={styles.modalSheet}>
          <Pressable onPress={onClose} style={styles.modalCloseArea}>
            <ThemedText style={styles.modalBackText}>← Detalhes</ThemedText>
          </Pressable>

          <ThemedText type="subtitle" style={styles.modalTitle}>{item.titulo}</ThemedText>

          <View style={styles.detailList}>
            <DetailRow icon="📅" text={formatLongDate(item.data)} />
            <DetailRow icon="🕐" text={`${item.horarioInicio}${item.horarioFim ? ` - ${item.horarioFim}` : ''}`} />
            {item.disciplina ? <DetailRow icon="📚" text={item.disciplina} /> : null}
            {item.local ? <DetailRow icon="📍" text={item.local} /> : null}
          </View>

          {item.observacao ? (
            <View style={styles.observationBlock}>
              <ThemedText type="smallBold" style={styles.observationTitle}>Observação</ThemedText>
              <ThemedText style={styles.observationText}>{item.observacao}</ThemedText>
            </View>
          ) : null}

          {canEdit ? (
            <View style={styles.modalButtons}>
              <PrimaryButton title="Editar atividade" onPress={onEdit} />
              <Pressable onPress={onDelete} style={styles.deleteAction}>
                <ThemedText style={styles.deleteActionText}>Excluir atividade</ThemedText>
              </Pressable>
            </View>
          ) : null}
        </ThemedView>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailIcon}>{icon}</ThemedText>
      <ThemedText themeColor="textSecondary">{text}</ThemedText>
    </View>
  );
}

function AgendaFormModal({
  item,
  onClose,
  onSave,
}: {
  item: AgendaItem | null;
  onClose: () => void;
  onSave: (item: AgendaItem) => void;
}) {
  const [draft, setDraft] = useState<AgendaItem | null>(item);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(item);
    setError(null);
  }, [item]);

  if (!item) return null;

  const update = (field: keyof AgendaItem, value: string) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  function save() {
    if (!draft?.titulo.trim() || !draft.data || !draft.horarioInicio || !draft.tipo) {
      setError('Preencha título, data, horário inicial e tipo.');
      return;
    }

    onSave({
      ...draft,
      titulo: draft.titulo.trim(),
      descricao: draft.descricao?.trim() ?? '',
      disciplina: draft.disciplina?.trim() ?? '',
      local: draft.local?.trim() ?? '',
      observacao: draft.observacao?.trim() ?? '',
    });
    setError(null);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ThemedView style={styles.formSheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText type="subtitle" style={styles.modalTitle}>{item.id ? 'Editar atividade' : 'Nova atividade'}</ThemedText>
            <FormField label="Título" value={draft?.titulo ?? ''} onChangeText={(value) => update('titulo', value)} />
            <View style={styles.fieldWrap}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>Tipo</ThemedText>
              <View style={styles.typeSelectorRow}>
                {agendaTypes.map((entry) => {
                  const isSelected = (draft?.tipo ?? 'atividade') === entry.value;
                  return (
                    <Pressable
                      key={entry.value}
                      onPress={() => update('tipo', entry.value)}
                      style={[styles.typeSelectorChip, isSelected && styles.typeSelectorChipSelected]}
                    >
                      <ThemedText type="small" style={[styles.typeSelectorText, isSelected && styles.typeSelectorTextSelected]}>{entry.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <FormField label="Data" value={draft?.data ?? ''} onChangeText={(value) => update('data', value)} />
            <FormField label="Horário inicial" value={draft?.horarioInicio ?? ''} onChangeText={(value) => update('horarioInicio', value)} />
            <FormField label="Horário final" value={draft?.horarioFim ?? ''} onChangeText={(value) => update('horarioFim', value)} />
            <FormField label="Área / disciplina" value={draft?.disciplina ?? ''} onChangeText={(value) => update('disciplina', value)} />
            <FormField label="Local" value={draft?.local ?? ''} onChangeText={(value) => update('local', value)} />
            <FormField label="Descrição" value={draft?.descricao ?? ''} onChangeText={(value) => update('descricao', value)} multiline />
            <FormField label="Observação" value={draft?.observacao ?? ''} onChangeText={(value) => update('observacao', value)} multiline />
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

            <View style={styles.formActions}>
              <Pressable onPress={onClose} style={styles.cancelAction}>
                <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
              </Pressable>
              <PrimaryButton title="Salvar" onPress={save} />
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  value,
  multiline,
  onChangeText,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <ThemedText type="smallBold" style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor={Colors.light.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121217' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121217' },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 34, lineHeight: 34, color: '#F5F5F7' },
  headerTextWrap: { flex: 1, alignItems: 'center', marginRight: 36 },
  studentHeader: { marginTop: Spacing.one, marginBottom: Spacing.three },
  studentName: { fontSize: 28, lineHeight: 34, color: '#F5F5F7' },
  studentClass: { marginTop: Spacing.one, fontSize: 16 },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1D1D23',
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  navButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#24252D', alignItems: 'center', justifyContent: 'center' },
  navButtonText: { color: '#F5F5F7', fontSize: 26, lineHeight: 26, fontWeight: '700' },
  weekLabel: { color: '#F5F5F7', fontSize: 16, fontWeight: '700' },
  daySelector: { paddingRight: Spacing.one, paddingBottom: Spacing.one },
  dayItem: {
    width: 72,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    borderRadius: Radius.medium,
    backgroundColor: '#17181E',
    marginRight: Spacing.two,
    position: 'relative',
  },
  dayItemSelected: { backgroundColor: '#1E6BFF', borderWidth: 1, borderColor: '#3C8EFF' },
  dayName: { fontSize: 12, lineHeight: 18, color: '#A8A8B3', textTransform: 'uppercase' },
  dayNameSelected: { color: '#F5F5F7' },
  dayNumberText: { marginTop: Spacing.one, fontSize: 22, lineHeight: 28, color: '#F5F5F7', fontWeight: '700' },
  dayNumberSelected: { color: '#FFFFFF' },
  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#54C7B3',
  },
  daySummary: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daySummaryText: { color: '#F5F5F7', fontSize: 16, textTransform: 'capitalize' },
  todayBadge: { backgroundColor: '#1E6BFF', borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  todayBadgeText: { color: '#F5F5F7', fontSize: 11, fontWeight: '700' },
  listWrap: { gap: Spacing.three },
  activityItem: { gap: Spacing.one },
  timeLabel: { color: '#A8A8B3', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  activityCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: '#1D1D23',
    borderWidth: 1,
    borderColor: '#2C2D35',
    ...Shadows.card,
  },
  cardHeader: { marginBottom: Spacing.two },
  typePill: { alignSelf: 'flex-start', backgroundColor: '#1F2A38', borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  typePillText: { color: '#9FD1FF', fontSize: 11, fontWeight: '700' },
  activityTitle: { color: '#F5F5F7', fontSize: 20, lineHeight: 28, fontWeight: '700', marginBottom: Spacing.one },
  activityMeta: { fontSize: 14, lineHeight: 20 },
  emptyState: {
    borderRadius: Radius.large,
    padding: Spacing.five,
    alignItems: 'center',
    backgroundColor: '#1D1D23',
    borderWidth: 1,
    borderColor: '#2C2D35',
    marginTop: Spacing.two,
  },
  emptyIcon: { fontSize: 32, marginBottom: Spacing.one },
  emptyTitle: { fontSize: 25, lineHeight: 30, marginBottom: Spacing.one },
  emptyText: { textAlign: 'center', marginBottom: Spacing.three },
  primaryAction: { backgroundColor: '#1E6BFF', borderRadius: Radius.medium, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, marginTop: Spacing.one },
  primaryActionText: { color: '#F5F5F7', fontWeight: '700' },
  footerButtonWrap: { marginTop: Spacing.four },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    backgroundColor: '#17181E',
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    minHeight: '72%',
  },
  modalCloseArea: { marginBottom: Spacing.two },
  modalBackText: { color: '#F5F5F7', fontSize: 18, fontWeight: '700' },
  modalTitle: { color: '#F5F5F7', fontSize: 30, lineHeight: 38, marginBottom: Spacing.three },
  detailList: { gap: Spacing.two },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  detailIcon: { fontSize: 18 },
  observationBlock: { backgroundColor: '#1D1D23', borderRadius: Radius.medium, padding: Spacing.three, marginTop: Spacing.three },
  observationTitle: { color: '#F5F5F7', marginBottom: Spacing.one },
  observationText: { color: '#D0D3D9', lineHeight: 22 },
  modalButtons: { marginTop: Spacing.three, gap: Spacing.two },
  deleteAction: { alignItems: 'center', paddingVertical: Spacing.two },
  deleteActionText: { color: '#FF8A8A', fontWeight: '700' },
  formSheet: { backgroundColor: '#17181E', borderTopLeftRadius: Radius.large, borderTopRightRadius: Radius.large, paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.five, maxHeight: '92%' },
  fieldWrap: { marginBottom: Spacing.three },
  fieldLabel: { color: '#F5F5F7', marginBottom: Spacing.one },
  typeSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  typeSelectorChip: { backgroundColor: '#1D1D23', borderColor: '#2C2D35', borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  typeSelectorChipSelected: { backgroundColor: '#1E6BFF', borderColor: '#3C8EFF' },
  typeSelectorText: { color: '#D7D9DF' },
  typeSelectorTextSelected: { color: '#F5F5F7', fontWeight: '700' },
  input: {
    backgroundColor: '#1D1D23',
    borderColor: '#2C2D35',
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#F5F5F7',
    fontSize: 16,
  },
  multilineInput: { minHeight: 92, textAlignVertical: 'top' },
  errorText: { color: '#FFB4B4', marginBottom: Spacing.two },
  formActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.two },
  cancelAction: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two },
  cancelText: { color: '#F5F5F7', fontWeight: '700' },
});

