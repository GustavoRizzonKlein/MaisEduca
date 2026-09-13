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

const typeColor: Record<AgendaItemType, string> = {
  atividade: BrandColors.learning,
  aula: BrandColors.information,
  intervalo: BrandColors.textSecondary,
  terapia: BrandColors.brand,
  evento: BrandColors.attention,
  outro: BrandColors.textSecondary,
};

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  return parseDate(value).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function shiftDate(value: string, amount: number) {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);
  return formatDate(date);
}

export function AgendaScreen({ studentId, canEdit }: { studentId: string; canEdit: boolean }) {
  const { items, createItem, updateItem, deleteItem } = useAgenda();
  const [selectedDate, setSelectedDate] = useState('2026-09-14');
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [formItem, setFormItem] = useState<AgendaItem | null>(null);

  const student = mockStudents.find((candidate) => candidate.id === studentId);
  const dayItems = useMemo(
    () => items
      .filter((item) => item.alunoId === studentId && item.data === selectedDate)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio)),
    [items, selectedDate, studentId],
  );

  if (!student) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Aluno não encontrado.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            {canEdit ? 'Agenda do professor' : 'Agenda da criança'}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>{student.name}</ThemedText>
          <ThemedText themeColor="textSecondary">{student.className} · {student.supportNeed}</ThemedText>

          <View style={styles.dateHeader}>
            <Pressable accessibilityLabel="Dia anterior" onPress={() => setSelectedDate(shiftDate(selectedDate, -1))} style={styles.dateButton}>
              <ThemedText style={styles.dateButtonText}>‹</ThemedText>
            </Pressable>
            <View style={styles.dateCopy}>
              <ThemedText type="smallBold" style={styles.dateLabel}>{formatDateLabel(selectedDate)}</ThemedText>
              <Pressable onPress={() => setSelectedDate(formatDate(new Date()))}>
                <ThemedText type="small" style={styles.todayText}>Hoje</ThemedText>
              </Pressable>
            </View>
            <Pressable accessibilityLabel="Próximo dia" onPress={() => setSelectedDate(shiftDate(selectedDate, 1))} style={styles.dateButton}>
              <ThemedText style={styles.dateButtonText}>›</ThemedText>
            </Pressable>
          </View>

          {dayItems.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText style={styles.emptyIcon}>📅</ThemedText>
              <ThemedText type="smallBold">Nenhuma atividade neste dia</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">A agenda está livre nesta data.</ThemedText>
            </ThemedView>
          ) : (
            <View style={styles.timeline}>
              {dayItems.map((item) => (
                <Pressable key={item.id} onPress={() => setSelectedItem(item)} style={styles.itemRow}>
                  <ThemedText type="smallBold" style={styles.time}>{item.horarioInicio}</ThemedText>
                  <ThemedView type="backgroundElement" style={[styles.itemCard, { borderLeftColor: typeColor[item.tipo] }]}>
                    <View style={styles.itemTitleRow}>
                      <ThemedText style={styles.itemIcon}>{typeIcon[item.tipo]}</ThemedText>
                      <ThemedText type="smallBold" style={styles.itemTitle}>{item.titulo}</ThemedText>
                    </View>
                    {item.horarioFim && <ThemedText type="small" themeColor="textSecondary">{item.horarioInicio} - {item.horarioFim}</ThemedText>}
                    {item.descricao && <ThemedText type="small" themeColor="textSecondary">{item.descricao}</ThemedText>}
                  </ThemedView>
                </Pressable>
              ))}
            </View>
          )}

          {canEdit && <PrimaryButton title="+ Adicionar atividade" onPress={() => setFormItem({
            id: '',
            alunoId: studentId,
            titulo: '',
            data: selectedDate,
            horarioInicio: '08:00',
            horarioFim: '09:00',
            tipo: 'atividade',
            descricao: '',
            observacao: '',
          })} />}
        </ScrollView>
      </SafeAreaView>

      <AgendaDetailModal
        item={selectedItem}
        canEdit={canEdit}
        onClose={() => setSelectedItem(null)}
        onEdit={() => {
          setFormItem(selectedItem);
          setSelectedItem(null);
        }}
        onDelete={() => {
          if (!selectedItem) return;
          Alert.alert('Excluir atividade?', `Tem certeza que deseja excluir "${selectedItem.titulo}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: () => { deleteItem(selectedItem.id); setSelectedItem(null); } },
          ]);
        }}
      />
      <AgendaFormModal
        item={formItem}
        onClose={() => setFormItem(null)}
        onSave={(item) => {
          if (item.id) updateItem(item);
          else createItem(item);
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
        <ThemedView style={styles.modalCard}>
          <ThemedText type="subtitle" style={styles.modalTitle}>{item.titulo}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{item.data} · {item.horarioInicio}{item.horarioFim ? ` - ${item.horarioFim}` : ''}</ThemedText>
          {item.descricao && <ThemedText style={styles.modalText}>{item.descricao}</ThemedText>}
          {item.observacao && <ThemedText style={styles.observation}>Observação: {item.observacao}</ThemedText>}
          {!canEdit && <ThemedText type="small" themeColor="textSecondary">Visualização da família</ThemedText>}
          {canEdit && <View style={styles.modalActions}><PrimaryButton title="Editar" onPress={onEdit} /><Pressable onPress={onDelete} style={styles.deleteButton}><ThemedText style={styles.deleteText}>Excluir</ThemedText></Pressable></View>}
          <Pressable onPress={onClose} style={styles.closeButton}><ThemedText style={styles.todayText}>Fechar</ThemedText></Pressable>
        </ThemedView>
      </View>
    </Modal>
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

  const update = (field: keyof AgendaItem, value: string) => setDraft((current) => current ? { ...current, [field]: value } : current);
  function save() {
    if (!draft?.titulo.trim() || !draft.data || !draft.horarioInicio || !draft.tipo) {
      setError('Preencha título, data, horário inicial e tipo.');
      return;
    }
    onSave(draft);
    setError(null);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ThemedView style={styles.formCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText type="subtitle" style={styles.modalTitle}>{item.id ? 'Editar atividade' : 'Nova atividade'}</ThemedText>
            <FormField label="Título" value={draft?.titulo ?? ''} onChangeText={(value) => update('titulo', value)} />
            <FormField label="Descrição" value={draft?.descricao ?? ''} onChangeText={(value) => update('descricao', value)} multiline />
            <FormField label="Data (AAAA-MM-DD)" value={draft?.data ?? ''} onChangeText={(value) => update('data', value)} />
            <FormField label="Horário inicial" value={draft?.horarioInicio ?? ''} onChangeText={(value) => update('horarioInicio', value)} />
            <FormField label="Horário final" value={draft?.horarioFim ?? ''} onChangeText={(value) => update('horarioFim', value)} />
            <ThemedText type="smallBold" style={styles.formLabel}>Tipo</ThemedText>
            <View style={styles.typeRow}>{agendaTypes.map((type) => <Pressable key={type.value} onPress={() => update('tipo', type.value)} style={[styles.typeOption, draft?.tipo === type.value && styles.typeOptionSelected]}><ThemedText type="small">{type.label}</ThemedText></Pressable>)}</View>
            <FormField label="Observação" value={draft?.observacao ?? ''} onChangeText={(value) => update('observacao', value)} multiline />
            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
            <View style={styles.formActions}><Pressable onPress={onClose} style={styles.cancelButton}><ThemedText>Cancelar</ThemedText></Pressable><PrimaryButton title="Salvar" onPress={save} /></View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

function FormField({ label, multiline, ...props }: { label: string; multiline?: boolean; value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.formField}><ThemedText type="smallBold" style={styles.formLabel}>{label}</ThemedText><TextInput {...props} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={Colors.light.textSecondary} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: Spacing.five },
  dateCopy: { alignItems: 'center', gap: Spacing.one, flex: 1 },
  dateLabel: { textTransform: 'capitalize', textAlign: 'center' },
  dateButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.backgroundElement, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.light.border },
  dateButtonText: { fontSize: 28, color: BrandColors.brand },
  todayText: { color: BrandColors.brand, fontWeight: '700' },
  timeline: { gap: Spacing.two, marginBottom: Spacing.four },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  time: { width: 48, marginTop: Spacing.three },
  itemCard: { flex: 1, borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.one, borderLeftWidth: 4, ...Shadows.card },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  itemIcon: { fontSize: 20 },
  itemTitle: { flex: 1 },
  empty: { alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.five, gap: Spacing.one, marginBottom: Spacing.four, backgroundColor: BrandColors.backgroundElement, ...Shadows.card },
  emptyIcon: { fontSize: 30, marginBottom: Spacing.one },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { borderTopLeftRadius: Radius.large, borderTopRightRadius: Radius.large, padding: Spacing.four, gap: Spacing.three },
  formCard: { maxHeight: '92%', borderTopLeftRadius: Radius.large, borderTopRightRadius: Radius.large, padding: Spacing.four },
  modalTitle: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.one },
  modalText: { marginTop: Spacing.two },
  observation: { backgroundColor: BrandColors.informationSoft, borderRadius: Radius.small, padding: Spacing.two, color: BrandColors.information },
  modalActions: { gap: Spacing.two, marginTop: Spacing.two },
  closeButton: { alignSelf: 'center', padding: Spacing.two },
  deleteButton: { alignItems: 'center', padding: Spacing.three },
  deleteText: { color: BrandColors.danger, fontWeight: '700' },
  formField: { marginBottom: Spacing.three, gap: Spacing.one },
  formLabel: { marginBottom: Spacing.one },
  input: { color: Colors.light.text, backgroundColor: Colors.light.inputBackground, borderRadius: Radius.small, borderWidth: 1, borderColor: Colors.light.border, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontSize: 16 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.three },
  typeOption: { borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  typeOptionSelected: { borderColor: BrandColors.brand, backgroundColor: BrandColors.brandSoft },
  formActions: { gap: Spacing.two, marginTop: Spacing.two },
  cancelButton: { alignItems: 'center', padding: Spacing.three },
});
