import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing, Tones, type Tone } from '@/constants/theme';
import { MIN_ATTENDANCE_RATE, formatRate } from '@/lib/performance';

export type BarDatum = {
  key: string;
  label: string;
  /** Percentual 0–100; `null` = sem dados (barra tracejada, não zero). */
  value: number | null;
  detail?: string;
};

type BarChartProps = {
  data: BarDatum[];
  tone?: Tone;
  /** Linha de referência opcional (ex.: mínimo de frequência). */
  reference?: number;
  referenceLabel?: string;
  height?: number;
};

/**
 * Gráfico de barras verticais em percentual. Feito com Views (sem biblioteca),
 * sempre acompanhado de rótulos textuais e descrição acessível.
 */
export function BarChart({ data, tone = 'blue', reference = MIN_ATTENDANCE_RATE, referenceLabel, height = 140 }: BarChartProps) {
  const colors = Tones[tone];
  const description = data
    .map((datum) => `${datum.label}: ${datum.value === null ? 'sem dados' : formatRate(datum.value)}`)
    .join('; ');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Gráfico de barras. ${description}`} style={styles.wrap}>
      <View style={[styles.plot, { height }]}>
        <View style={[styles.reference, { bottom: (reference / 100) * height }]}>
          <ThemedText type="caption" themeColor="textMuted" style={styles.referenceLabel}>
            {referenceLabel ?? `${reference}%`}
          </ThemedText>
        </View>
        {data.map((datum) => (
          <View key={datum.key} style={styles.column}>
            {datum.value === null ? (
              <View style={[styles.emptyBar, { height: 8 }]} />
            ) : (
              <>
                <ThemedText type="caption" style={{ color: colors.ink, fontWeight: '600' }}>{formatRate(datum.value)}</ThemedText>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, (datum.value / 100) * (height - 20)),
                      backgroundColor: datum.value < reference ? Tones.peach.soft : colors.soft,
                    },
                  ]}
                />
              </>
            )}
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((datum) => (
          <View key={datum.key} style={styles.labelCell}>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>{datum.label}</ThemedText>
            {datum.detail ? (
              <ThemedText type="caption" themeColor="textMuted" numberOfLines={1} style={styles.detail}>{datum.detail}</ThemedText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Barra de progresso horizontal com o percentual em texto. */
export function ProgressBar({ value, tone = 'blue', label }: { value: number | null; tone?: Tone; label?: string }) {
  const colors = Tones[tone];
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label ?? 'Progresso'}: ${value === null ? 'sem dados' : formatRate(value)}`}
      style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        {value !== null ? (
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: colors.primary }]} />
        ) : null}
      </View>
      <ThemedText type="smallBold" style={{ color: value === null ? Palette.textMuted : colors.ink, minWidth: 44, textAlign: 'right' }}>
        {formatRate(value)}
      </ThemedText>
    </View>
  );
}

export type CountDatum = { key: string; label: string; count: number; tone: Tone };

/** Barras horizontais de contagem (ex.: registros por categoria). Sem ranking de alunos. */
export function CountBars({ data }: { data: CountDatum[] }) {
  const max = Math.max(1, ...data.map((datum) => datum.count));
  return (
    <View style={styles.countList}>
      {data.map((datum) => (
        <View
          key={datum.key}
          style={styles.countRow}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${datum.label}: ${datum.count}`}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.countLabel} numberOfLines={1}>{datum.label}</ThemedText>
          <View style={styles.countTrack}>
            <View style={[styles.countFill, { width: `${(datum.count / max) * 100}%`, backgroundColor: Tones[datum.tone].soft }]} />
          </View>
          <ThemedText type="smallBold" style={styles.countValue}>{datum.count}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, position: 'relative' },
  reference: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.border,
  },
  referenceLabel: { position: 'absolute', right: 0, top: -16, backgroundColor: Palette.surface, paddingHorizontal: 2 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.one },
  bar: { width: '70%', maxWidth: 36, borderTopLeftRadius: Radius.small, borderTopRightRadius: Radius.small },
  emptyBar: {
    width: '70%',
    maxWidth: 36,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.border,
  },
  labels: { flexDirection: 'row', gap: Spacing.two },
  labelCell: { flex: 1, alignItems: 'center' },
  detail: { fontSize: 11 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  progressTrack: { flex: 1, height: 10, borderRadius: Radius.pill, backgroundColor: '#EEF2F6', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  countList: { gap: Spacing.two + 2 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  countLabel: { width: 96 },
  countTrack: { flex: 1, height: 10, borderRadius: Radius.pill, backgroundColor: '#EEF2F6', overflow: 'hidden' },
  countFill: { height: '100%', borderRadius: Radius.pill },
  countValue: { minWidth: 24, textAlign: 'right' },
});
