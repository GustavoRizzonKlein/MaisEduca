import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomSheet, Button, Chip, Input } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { AgendaItem } from '@/types/education';

import { agendaTypes } from './agenda-config';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

type FieldErrors = Partial<Record<'titulo' | 'data' | 'horarioInicio' | 'horarioFim', string>>;

function validate(draft: AgendaItem): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.titulo.trim()) errors.titulo = 'Informe o título da atividade.';
  if (!DATE_PATTERN.test(draft.data.trim())) errors.data = 'Use o formato AAAA-MM-DD.';
  if (!TIME_PATTERN.test(draft.horarioInicio.trim())) errors.horarioInicio = 'Use o formato HH:MM.';
  if (draft.horarioFim?.trim() && !TIME_PATTERN.test(draft.horarioFim.trim())) {
    errors.horarioFim = 'Use o formato HH:MM.';
  }
  return errors;
}

type AgendaFormSheetProps = {
  item: AgendaItem | null;
  onClose: () => void;
  onSave: (item: AgendaItem) => void;
};

export function AgendaFormSheet({ item, onClose, onSave }: AgendaFormSheetProps) {
  const [draft, setDraft] = useState<AgendaItem | null>(item);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setDraft(item);
    setErrors({});
  }, [item]);

  if (!item || !draft) return null;

  function update(field: keyof AgendaItem, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function save() {
    if (!draft) return;
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      ...draft,
      titulo: draft.titulo.trim(),
      descricao: draft.descricao?.trim() ?? '',
      disciplina: draft.disciplina?.trim() ?? '',
      local: draft.local?.trim() ?? '',
      observacao: draft.observacao?.trim() ?? '',
    });
  }

  return (
    <BottomSheet
      visible
      title={item.id ? 'Editar atividade' : 'Nova atividade'}
      onClose={onClose}
      footer={
        <>
          <Button title="Salvar" icon="check" onPress={save} />
          <Button title="Cancelar" variant="outline" onPress={onClose} />
        </>
      }>
      <Input
        label="Título"
        required
        value={draft.titulo}
        onChangeText={(value) => update('titulo', value)}
        placeholder="Ex.: Leitura e interpretação"
        error={errors.titulo}
      />
      <View style={styles.group}>
        <ThemedText type="smallBold">Tipo</ThemedText>
        <View style={styles.chips}>
          {agendaTypes.map((entry) => (
            <Chip
              key={entry.value}
              label={entry.label}
              selected={draft.tipo === entry.value}
              onPress={() => update('tipo', entry.value)}
            />
          ))}
        </View>
      </View>
      <Input
        label="Data"
        required
        icon="calendar"
        value={draft.data}
        onChangeText={(value) => update('data', value)}
        placeholder="AAAA-MM-DD"
        helperText="Formato AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
        error={errors.data}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input
            label="Início"
            required
            icon="clock"
            value={draft.horarioInicio}
            onChangeText={(value) => update('horarioInicio', value)}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            error={errors.horarioInicio}
          />
        </View>
        <View style={styles.flex}>
          <Input
            label="Fim"
            icon="clock"
            value={draft.horarioFim ?? ''}
            onChangeText={(value) => update('horarioFim', value)}
            placeholder="08:30"
            keyboardType="numbers-and-punctuation"
            error={errors.horarioFim}
          />
        </View>
      </View>
      <Input
        label="Área / disciplina"
        value={draft.disciplina ?? ''}
        onChangeText={(value) => update('disciplina', value)}
        placeholder="Ex.: Português"
      />
      <Input
        label="Local"
        icon="location"
        value={draft.local ?? ''}
        onChangeText={(value) => update('local', value)}
        placeholder="Ex.: Sala 04"
      />
      <Input
        label="Descrição"
        value={draft.descricao ?? ''}
        onChangeText={(value) => update('descricao', value)}
        placeholder="O que será feito"
        multiline
      />
      <Input
        label="Observação"
        value={draft.observacao ?? ''}
        onChangeText={(value) => update('observacao', value)}
        placeholder="Orientações para a família ou equipe"
        multiline
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1 },
});
