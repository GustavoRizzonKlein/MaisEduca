import { StyleSheet, View } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Badge, BottomSheet, Button } from '@/components/ui';
import { Palette, Radius, Spacing, Tones } from '@/constants/theme';
import { formatLongDate } from '@/lib/dates';
import type { AgendaItem } from '@/types/education';

import { agendaTypeConfig, formatTimeRange } from './agenda-config';

type AgendaDetailSheetProps = {
  item: AgendaItem | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function AgendaDetailSheet({ item, canEdit, onClose, onEdit, onDelete }: AgendaDetailSheetProps) {
  if (!item) return null;
  const type = agendaTypeConfig(item.tipo);

  return (
    <BottomSheet
      visible
      title={item.titulo}
      onClose={onClose}
      footer={
        canEdit ? (
          <>
            <Button title="Editar atividade" icon="edit" onPress={onEdit} />
            <Button title="Excluir atividade" icon="trash" variant="danger" onPress={onDelete} />
          </>
        ) : null
      }>
      <Badge label={type.label} tone={type.tone} icon={type.icon} />
      <View style={styles.details}>
        <DetailRow icon="calendar" text={formatLongDate(item.data)} />
        <DetailRow icon="clock" text={formatTimeRange(item)} />
        {item.disciplina ? <DetailRow icon="book" text={item.disciplina} /> : null}
        {item.local ? <DetailRow icon="location" text={item.local} /> : null}
      </View>
      {item.descricao ? (
        <View style={styles.block}>
          <ThemedText type="smallBold">Descrição</ThemedText>
          <ThemedText themeColor="textSecondary">{item.descricao}</ThemedText>
        </View>
      ) : null}
      {item.observacao ? (
        <View style={[styles.block, styles.observation]}>
          <ThemedText type="smallBold" style={{ color: Tones.purple.ink }}>Observação</ThemedText>
          <ThemedText>{item.observacao}</ThemedText>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function DetailRow({ icon, text }: { icon: IconKey; text: string }) {
  return (
    <View style={styles.detailRow}>
      <AppIcon name={icon} color={Palette.textMuted} size={18} />
      <ThemedText themeColor="textSecondary" style={styles.detailText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  details: { gap: Spacing.two + 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  detailText: { flex: 1 },
  block: { gap: Spacing.one },
  observation: { backgroundColor: Tones.purple.light, padding: Spacing.three, borderRadius: Radius.medium },
});
