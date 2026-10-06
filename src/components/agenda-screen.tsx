import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAgenda } from '@/contexts/agenda-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { mockStudents } from '@/mocks/teacher';
import { can } from '@/types/auth';
import type { AgendaItem, AgendaItemType } from '@/types/education';

const agendaTypes: { label: string; value: AgendaItemType }[] = [
  { label: 'Atividade', value: 'atividade' },
  { label: 'Aula', value: 'aula' },
  { label: 'Intervalo', value: 'intervalo' },
  { label: 'Terapia', value: 'terapia' },
  { label: 'Evento', value: 'evento' },
  { label: 'Outro', value: 'outro' },
];

const typeIcon: Record<AgendaItemType, AppIconName> = {
  atividade: { ios: 'pencil', android: 'edit_note', web: 'edit_note' },
  aula: { ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' },
  intervalo: { ios: 'cup.and.saucer.fill', android: 'coffee', web: 'coffee' },
  terapia: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  evento: { ios: 'calendar', android: 'event', web: 'event' },
  outro: { ios: 'ellipsis.circle.fill', android: 'more_horiz', web: 'more_horiz' },
};

const typeTone: Record<AgendaItemType, StatusTone> = {
  atividade: 'information',
  aula: 'learning',
  intervalo: 'success',
  terapia: 'learning',
  evento: 'attention',
  outro: 'neutral',
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

export function AgendaScreen({ studentId, fallbackRoute }: { studentId: string; fallbackRoute: Href }) {
  const { items, createItem, updateItem, deleteItem } = useAgenda();
  const { user } = useAuth();
  const theme = useTheme();
  const canEdit = can(user?.role, 'agenda:edit');
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [formItem, setFormItem] = useState<AgendaItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
    if (!canEdit) return;
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(fallbackRoute);
              }
            }}
            style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText style={[styles.backButtonText, { color: theme.text }]}>‹</ThemedText>
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

          <View style={[styles.weekNavigator, { backgroundColor: theme.backgroundElement }]}>
            <Pressable onPress={() => setWeekAnchor((current) => addDays(current, -7))} style={[styles.navButton, { backgroundColor: theme.brandSoft }]}>
              <ThemedText style={[styles.navButtonText, { color: theme.brand }]}>‹</ThemedText>
            </Pressable>
            <ThemedText style={[styles.weekLabel, { color: theme.text }]}>{weekLabel}</ThemedText>
            <Pressable onPress={() => setWeekAnchor((current) => addDays(current, 7))} style={[styles.navButton, { backgroundColor: theme.brandSoft }]}>
              <ThemedText style={[styles.navButtonText, { color: theme.brand }]}>›</ThemedText>
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
                  style={[
                    styles.dayItem,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    isSelected && [styles.dayItemSelected, { backgroundColor: theme.brandSoft, borderColor: theme.brand }],
                  ]}
                >
                  <ThemedText type="small" style={[styles.dayName, { color: theme.textSecondary }, isSelected && [styles.dayNameSelected, { color: theme.brand }]]}>{dayName}</ThemedText>
                  <ThemedText style={[styles.dayNumberText, { color: theme.text }, isSelected && [styles.dayNumberSelected, { color: theme.brand }]]}>{dayNumber}</ThemedText>
                  {isToday && <View style={[styles.todayDot, { backgroundColor: theme.success }]} />}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.daySummary}>
            <ThemedText type="smallBold" style={[styles.daySummaryText, { color: theme.text }]}>{formatLongDate(selectedDate)}</ThemedText>
            {selectedDate === formatDate(new Date()) && <StatusBadge label="Hoje" tone="information" />}
          </View>

          {selectedDateItems.length === 0 ? (
            <ThemedView type="backgroundElement" style={[styles.emptyState, { borderColor: theme.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.informationSoft }]}>
                <AppIcon name={{ ios: 'book.closed.fill', android: 'auto_stories', web: 'auto_stories' }} color={theme.information} size={28} />
              </View>
              <ThemedText type="subtitle" style={styles.emptyTitle}>Nenhuma atividade</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>Não há atividades cadastradas para este dia.</ThemedText>
              {canEdit && (
                <Pressable onPress={handleCreate} style={[styles.primaryAction, { backgroundColor: theme.brandAction, borderColor: theme.border }]}>
                  <ThemedText style={[styles.primaryActionText, { color: theme.brand }]}>+ Adicionar atividade</ThemedText>
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
                    <ThemedText style={[styles.timeLabel, { color: theme.textSecondary }]}>
                      {item.horarioInicio}{item.horarioFim ? ` – ${item.horarioFim}` : ''}
                    </ThemedText>
                    <ThemedView type="backgroundElement" style={[styles.activityCard, { borderColor: theme.border }]}>
                      <View style={styles.cardHeader}>
                        <StatusBadge icon={typeIcon[item.tipo]} label={typeLabel} tone={typeTone[item.tipo]} />
                      </View>
                      <ThemedText style={[styles.activityTitle, { color: theme.text }]}>{item.titulo}</ThemedText>
                      {disciplineLabel && <ThemedText themeColor="textSecondary" style={styles.activityMeta}>{disciplineLabel}</ThemedText>}
                      {item.descricao && item.descricao !== disciplineLabel
                        ? <ThemedText themeColor="textSecondary" style={styles.activityDescription}>{item.descricao}</ThemedText>
                        : null}
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
          {actionError && <ThemedText style={authStyles.error}>{actionError}</ThemedText>}
        </ScrollView>
      </SafeAreaView>

      <AgendaDetailModal
        item={selectedItem}
        canEdit={canEdit}
        theme={theme}
        onClose={() => setSelectedItem(null)}
        onEdit={() => {
          if (!canEdit || !selectedItem) return;
          setFormItem({ ...selectedItem });
          setSelectedItem(null);
        }}
        onDelete={() => {
          if (!canEdit || !selectedItem) return;

          Alert.alert('Excluir atividade?', `Tem certeza que deseja excluir "${selectedItem.titulo}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Excluir',
              style: 'destructive',
              onPress: () => {
                try {
                  deleteItem(selectedItem.id);
                  setSelectedItem(null);
                  setActionError(null);
                } catch (error) {
                  setActionError(error instanceof Error ? error.message : 'Não foi possível excluir a atividade.');
                }
              },
            },
          ]);
        }}
      />

      <AgendaFormModal
        item={formItem}
        theme={theme}
        onClose={() => setFormItem(null)}
        onSave={(item) => {
          if (!canEdit) return;
          const savedItem = {
            ...item,
            alunoId: studentId,
            data: item.data.trim(),
            horarioInicio: item.horarioInicio.trim(),
            horarioFim: item.horarioFim?.trim() ?? '',
          };

          try {
            if (item.id) {
              updateItem(savedItem);
            } else {
              createItem(savedItem);
            }
            setActionError(null);
            setFormItem(null);
          } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Não foi possível salvar a atividade.');
          }
        }}
      />
    </ThemedView>
  );
}

function AgendaDetailModal({
  item,
  canEdit,
  theme,
  onClose,
  onEdit,
  onDelete,
}: {
  item: AgendaItem | null;
  canEdit: boolean;
  theme: ReturnType<typeof useTheme>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!item) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: theme.modalOverlay }]}>
        <ThemedView type="backgroundElement" style={styles.modalSheet}>
          <Pressable onPress={onClose} style={styles.modalCloseArea}>
            <ThemedText style={[styles.modalBackText, { color: theme.brand }]}>← Detalhes</ThemedText>
          </Pressable>

          <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>{item.titulo}</ThemedText>

          <StatusBadge
            icon={typeIcon[item.tipo]}
            label={agendaTypes.find((entry) => entry.value === item.tipo)?.label ?? 'Atividade'}
            tone={typeTone[item.tipo]}
          />

          <View style={styles.detailList}>
            <DetailRow icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} text={formatLongDate(item.data)} />
            <DetailRow icon={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }} text={`${item.horarioInicio}${item.horarioFim ? ` - ${item.horarioFim}` : ''}`} />
            {item.disciplina ? <DetailRow icon={{ ios: 'book.closed.fill', android: 'auto_stories', web: 'auto_stories' }} text={item.disciplina} /> : null}
            {item.local ? <DetailRow icon={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} text={item.local} /> : null}
          </View>

          {item.observacao ? (
            <View style={[styles.observationBlock, { backgroundColor: theme.learningSoft }]}>
              <ThemedText type="smallBold" style={[styles.observationTitle, { color: theme.text }]}>Observação</ThemedText>
              <ThemedText style={[styles.observationText, { color: theme.text }]}>{item.observacao}</ThemedText>
            </View>
          ) : null}

          {canEdit ? (
            <View style={styles.modalButtons}>
              <PrimaryButton title="Editar atividade" onPress={onEdit} />
              <Pressable onPress={onDelete} style={styles.deleteAction}>
                <ThemedText style={[styles.deleteActionText, { color: theme.danger }]}>Excluir atividade</ThemedText>
              </Pressable>
            </View>
          ) : null}
        </ThemedView>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, text }: { icon: AppIconName; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <AppIcon name={icon} color={theme.textSecondary} size={18} />
      <ThemedText themeColor="textSecondary">{text}</ThemedText>
    </View>
  );
}

function AgendaFormModal({
  item,
  theme,
  onClose,
  onSave,
}: {
  item: AgendaItem | null;
  theme: ReturnType<typeof useTheme>;
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
    if (
      !draft?.titulo.trim()
      || !draft.data.trim()
      || !draft.horarioInicio.trim()
      || !draft.tipo
      || !/^\d{4}-\d{2}-\d{2}$/.test(draft.data.trim())
      || !/^\d{2}:\d{2}$/.test(draft.horarioInicio.trim())
      || (draft.horarioFim?.trim() && !/^\d{2}:\d{2}$/.test(draft.horarioFim.trim()))
    ) {
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
      <View style={[styles.modalBackdrop, { backgroundColor: theme.modalOverlay }]}>
        <ThemedView type="backgroundElement" style={styles.formSheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>{item.id ? 'Editar atividade' : 'Nova atividade'}</ThemedText>
            <FormField label="Título" value={draft?.titulo ?? ''} onChangeText={(value) => update('titulo', value)} />
            <View style={styles.fieldWrap}>
              <ThemedText type="smallBold" style={[styles.fieldLabel, { color: theme.text }]}>Tipo</ThemedText>
              <View style={styles.typeSelectorRow}>
                {agendaTypes.map((entry) => {
                  const isSelected = (draft?.tipo ?? 'atividade') === entry.value;
                  return (
                    <Pressable
                      key={entry.value}
                      onPress={() => update('tipo', entry.value)}
                      style={[
                        styles.typeSelectorChip,
                        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                        isSelected && [styles.typeSelectorChipSelected, { backgroundColor: theme.brandSoft, borderColor: theme.brand }],
                      ]}
                    >
                      <ThemedText type="small" style={[styles.typeSelectorText, { color: theme.textSecondary }, isSelected && [styles.typeSelectorTextSelected, { color: theme.brand }]]}>{entry.label}</ThemedText>
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
            {error ? <ThemedText style={[styles.errorText, { color: theme.danger }]}>{error}</ThemedText> : null}

            <View style={styles.formActions}>
              <Pressable onPress={onClose} style={styles.cancelAction}>
                <ThemedText style={[styles.cancelText, { color: theme.textSecondary }]}>Cancelar</ThemedText>
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
  const theme = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <ThemedText type="smallBold" style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border },
          multiline && styles.multilineInput,
        ]}
        placeholderTextColor={theme.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BrandColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.backgroundElement,
    ...Shadows.card,
  },
  backButtonText: { fontSize: 28, lineHeight: 32, color: BrandColors.text },
  headerTextWrap: { flex: 1, alignItems: 'center', marginRight: 36 },
  studentHeader: { marginTop: Spacing.one, marginBottom: Spacing.three },
  studentName: { fontSize: 28, lineHeight: 36 },
  studentClass: { marginTop: Spacing.one, fontSize: 16 },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.backgroundElement,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
    ...Shadows.card,
  },
  navButton: { width: 40, height: 40, borderRadius: Radius.pill, backgroundColor: BrandColors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  navButtonText: { color: BrandColors.brand, fontSize: 24, lineHeight: 28, fontWeight: '700' },
  weekLabel: { color: BrandColors.text, fontSize: 16, fontWeight: '700' },
  daySelector: { paddingRight: Spacing.one, paddingBottom: Spacing.one },
  dayItem: {
    width: 72,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    borderRadius: Radius.medium,
    backgroundColor: BrandColors.backgroundElement,
    marginRight: Spacing.two,
    position: 'relative',
  },
  dayItemSelected: { backgroundColor: BrandColors.brandSoft, borderWidth: 1, borderColor: BrandColors.brand },
  dayName: { fontSize: 12, lineHeight: 18, color: BrandColors.textSecondary, textTransform: 'uppercase' },
  dayNameSelected: { color: BrandColors.brand, fontWeight: '700' },
  dayNumberText: { marginTop: Spacing.one, fontSize: 22, lineHeight: 28, color: BrandColors.text, fontWeight: '700' },
  dayNumberSelected: { color: BrandColors.brand },
  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.success,
  },
  daySummary: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daySummaryText: { color: BrandColors.text, fontSize: 16 },
  listWrap: { gap: Spacing.three },
  activityItem: { gap: Spacing.one },
  timeLabel: { color: BrandColors.textSecondary, fontSize: 14, fontWeight: '700', marginLeft: 4 },
  activityCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    ...Shadows.card,
  },
  cardHeader: { marginBottom: Spacing.two },
  activityTitle: { color: BrandColors.text, fontSize: 20, lineHeight: 28, fontWeight: '700', marginBottom: Spacing.one },
  activityMeta: { fontSize: 14, lineHeight: 20 },
  activityDescription: { fontSize: 14, lineHeight: 21 },
  emptyState: {
    borderRadius: Radius.large,
    padding: Spacing.five,
    alignItems: 'center',
    backgroundColor: BrandColors.backgroundElement,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginTop: Spacing.two,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    marginBottom: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  emptyTitle: { fontSize: 25, lineHeight: 30, marginBottom: Spacing.one },
  emptyText: { textAlign: 'center', marginBottom: Spacing.three },
  primaryAction: { backgroundColor: BrandColors.brandAction, borderColor: BrandColors.border, borderWidth: 1, borderRadius: Radius.medium, paddingVertical: Spacing.three, paddingHorizontal: Spacing.four, marginTop: Spacing.one },
  primaryActionText: { color: BrandColors.onBrand, fontWeight: '700' },
  footerButtonWrap: { marginTop: Spacing.four },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    minHeight: '72%',
  },
  modalCloseArea: { marginBottom: Spacing.two },
  modalBackText: { color: BrandColors.brand, fontSize: 16, fontWeight: '700' },
  modalTitle: { color: BrandColors.text, fontSize: 26, lineHeight: 34, marginBottom: Spacing.three },
  detailList: { gap: Spacing.two },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  detailIcon: { fontSize: 18 },
  observationBlock: { backgroundColor: BrandColors.learningSoft, borderRadius: Radius.medium, padding: Spacing.three, marginTop: Spacing.three },
  observationTitle: { color: BrandColors.text, marginBottom: Spacing.one },
  observationText: { color: BrandColors.text, lineHeight: 22 },
  modalButtons: { marginTop: Spacing.three, gap: Spacing.two },
  deleteAction: { alignItems: 'center', paddingVertical: Spacing.two },
  deleteActionText: { color: BrandColors.danger, fontWeight: '700' },
  formSheet: { borderTopLeftRadius: Radius.large, borderTopRightRadius: Radius.large, paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.five, maxHeight: '92%' },
  fieldWrap: { marginBottom: Spacing.three },
  fieldLabel: { color: BrandColors.text, marginBottom: Spacing.one },
  typeSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  typeSelectorChip: { backgroundColor: BrandColors.backgroundElement, borderColor: BrandColors.border, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  typeSelectorChipSelected: { backgroundColor: BrandColors.brandSoft, borderColor: BrandColors.brand },
  typeSelectorText: { color: BrandColors.textSecondary },
  typeSelectorTextSelected: { color: BrandColors.brand, fontWeight: '700' },
  input: {
    backgroundColor: BrandColors.inputBackground,
    borderColor: BrandColors.border,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: BrandColors.text,
    fontSize: 16,
  },
  multilineInput: { minHeight: 92, textAlignVertical: 'top' },
  errorText: { color: BrandColors.danger, marginBottom: Spacing.two },
  formActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.two },
  cancelAction: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two },
  cancelText: { color: BrandColors.textSecondary, fontWeight: '700' },
});
