import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui';
import { Palette, Radius, Shadows, Spacing, Tones } from '@/constants/theme';
import type { AgendaItem } from '@/types/education';

import { agendaTypeConfig, formatTimeRange } from './agenda-config';

type AgendaItemCardProps = {
  item: AgendaItem;
  /** Linha de contexto (ex.: nome do aluno ou turma). */
  context?: string | null;
  onPress?: () => void;
  /** Exibe a linha do tempo à esquerda. */
  timeline?: boolean;
  isLast?: boolean;
};

/** Item da agenda em formato de linha do tempo. */
export function AgendaItemCard({ item, context, onPress, timeline = true, isLast = false }: AgendaItemCardProps) {
  const type = agendaTypeConfig(item.tipo);
  const tone = Tones[type.tone];
  const timeRange = formatTimeRange(item);

  return (
    <View style={styles.row}>
      {timeline ? (
        <View style={styles.rail}>
          <View style={[styles.railDot, { backgroundColor: tone.primary, borderColor: tone.light }]} />
          {!isLast ? <View style={styles.railLine} /> : null}
        </View>
      ) : null}
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${timeRange}, ${type.label}: ${item.titulo}${context ? `, ${context}` : ''}`}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.header}>
          <View style={styles.time}>
            <AppIcon name="clock" color={Palette.textMuted} size={14} />
            <ThemedText type="smallBold" themeColor="textSecondary">{timeRange}</ThemedText>
          </View>
          <Badge label={type.label} tone={type.tone} icon={type.icon} />
        </View>
        <ThemedText type="subtitle" numberOfLines={2}>{item.titulo}</ThemedText>
        {item.descricao ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{item.descricao}</ThemedText>
        ) : null}
        {context || item.local ? (
          <View style={styles.metaRow}>
            {context ? <ThemedText type="caption" themeColor="textMuted">{context}</ThemedText> : null}
            {item.local ? (
              <View style={styles.meta}>
                <AppIcon name="location" color={Palette.textMuted} size={12} />
                <ThemedText type="caption" themeColor="textMuted">{item.local}</ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  rail: { width: 14, alignItems: 'center', paddingTop: Spacing.four },
  railDot: { width: 14, height: 14, borderRadius: Radius.pill, borderWidth: 3 },
  railLine: { flex: 1, width: 2, backgroundColor: Palette.borderSoft, marginTop: Spacing.one, marginBottom: -Spacing.three },
  card: {
    flex: 1,
    gap: Spacing.one + 2,
    padding: Spacing.three,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
    ...Shadows.card,
  },
  pressed: { opacity: 0.9 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  time: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.half },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
