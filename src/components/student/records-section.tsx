import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingState,
  Notice,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { todayKey } from '@/lib/dates';
import { RECORD_CATEGORIES, recordCategoryConfig } from '@/lib/performance';
import { formatShortDate, isValidDateKey } from '@/lib/periods';
import { createRegistro, deleteRegistro, listRegistros } from '@/services/records-service';
import type { RecordCategory, Registro } from '@/types/education';

/** Registros qualitativos de acompanhamento (avanços, dificuldades, atividades, participação). */
export function RecordsSection({ alunoId, canEdit }: { alunoId: string; canEdit: boolean }) {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Registro | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRegistros(await listRegistros({ alunoId, limit: 50 }));
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os registros.');
    } finally {
      setLoading(false);
    }
  }, [alunoId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteRegistro(pendingDelete.id);
      setFeedback({ tone: 'success', message: 'Registro excluído.' });
      await load();
    } catch (deleteError: unknown) {
      setFeedback({ tone: 'error', message: deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir.' });
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  }

  const canDelete = (registro: Registro) => canEdit && (registro.criadoPor === user?.id || user?.role === 'direcao');

  return (
    <View style={styles.wrap}>
      {canEdit ? <Button title="Novo registro" icon="plus" variant="secondary" onPress={() => setFormOpen(true)} /> : null}
      {feedback ? <Notice tone={feedback.tone} message={feedback.message} /> : null}
      {loading ? (
        <LoadingState rows={2} label="Carregando registros" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : registros.length === 0 ? (
        <EmptyState
          icon="notes"
          tone="yellow"
          title="Nenhum registro ainda"
          description={canEdit ? 'Registre avanços, dificuldades e a participação do aluno.' : 'Quando a escola registrar observações, elas aparecerão aqui.'}
        />
      ) : (
        <View style={styles.list}>
          {registros.map((registro) => {
            const category = recordCategoryConfig(registro.categoria);
            return (
              <Card key={registro.id} style={styles.card}>
                <View style={styles.header}>
                  <Badge label={category.label} tone={category.tone} />
                  <ThemedText type="caption" themeColor="textMuted" style={styles.flex}>{formatShortDate(registro.data)}</ThemedText>
                  {canDelete(registro) ? (
                    <IconButton icon="trash" accessibilityLabel="Excluir registro" onPress={() => setPendingDelete(registro)} />
                  ) : null}
                </View>
                <ThemedText type="small">{registro.texto}</ThemedText>
              </Card>
            );
          })}
        </View>
      )}

      <RecordFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={async (input) => {
          await createRegistro({ alunoId, ...input });
          setFormOpen(false);
          setFeedback({ tone: 'success', message: 'Registro adicionado.' });
          await load();
        }}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Excluir registro?"
        message="Esta observação será removida do histórico do aluno."
        confirmLabel="Excluir"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

function RecordFormSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (input: { data: string; categoria: RecordCategory; texto: string }) => Promise<void>;
}) {
  const [categoria, setCategoria] = useState<RecordCategory>('avanco');
  const [data, setData] = useState(todayKey());
  const [texto, setTexto] = useState('');
  const [errors, setErrors] = useState<{ data?: string; texto?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCategoria('avanco');
    setData(todayKey());
    setTexto('');
    setErrors({});
  }, [visible]);

  async function save() {
    const nextErrors: typeof errors = {};
    if (!isValidDateKey(data.trim())) nextErrors.data = 'Use uma data válida no formato AAAA-MM-DD.';
    else if (data.trim() > todayKey()) nextErrors.data = 'O registro não pode ter data futura.';
    if (!texto.trim()) nextErrors.texto = 'Descreva a observação.';
    else if (texto.trim().length > 2000) nextErrors.texto = 'Use no máximo 2000 caracteres.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await onSave({ data: data.trim(), categoria, texto });
    } catch (saveError: unknown) {
      setErrors({ form: saveError instanceof Error ? saveError.message : 'Não foi possível salvar o registro.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      title="Novo registro"
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button title="Salvar registro" icon="check" onPress={save} loading={saving} />
          <Button title="Cancelar" variant="outline" onPress={onClose} disabled={saving} />
        </>
      }>
      <View style={styles.group}>
        <ThemedText type="smallBold">Categoria</ThemedText>
        <View style={styles.chips}>
          {RECORD_CATEGORIES.map((option) => (
            <Chip key={option.value} label={option.label} selected={categoria === option.value} onPress={() => setCategoria(option.value)} />
          ))}
        </View>
      </View>
      <Input
        label="Data"
        required
        icon="calendar"
        value={data}
        onChangeText={setData}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
        error={errors.data}
      />
      <Input
        label="Observação"
        required
        value={texto}
        onChangeText={setTexto}
        placeholder="Ex.: Leu o texto com apoio visual e participou da roda."
        multiline
        error={errors.texto}
        helperText={`${texto.trim().length}/2000`}
      />
      {errors.form ? <Notice tone="error" message={errors.form} /> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  list: { gap: Spacing.two },
  card: { gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
