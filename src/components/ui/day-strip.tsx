import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { MinTouchSize, Palette, Radius, Spacing } from '@/constants/theme';
import { formatLongDate, formatWeekdayShort, parseDate, todayKey } from '@/lib/dates';

type DayStripProps = {
  days: string[];
  selectedDate: string;
  onSelect: (day: string) => void;
  weekLabel: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  /** Dias que possuem atividades recebem um indicador. */
  markedDays?: Set<string>;
};

/** Seletor de data semanal (dias úteis) com navegação entre semanas. */
export function DayStrip({ days, selectedDate, onSelect, weekLabel, onPreviousWeek, onNextWeek, markedDays }: DayStripProps) {
  const today = todayKey();

  return (
    <View style={styles.wrap}>
      <View style={styles.weekRow}>
        <WeekArrow direction="previous" onPress={onPreviousWeek} />
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.weekLabel}>{weekLabel}</ThemedText>
        <WeekArrow direction="next" onPress={onNextWeek} />
      </View>
      <View style={styles.days}>
        {days.map((day) => {
          const selected = day === selectedDate;
          const isToday = day === today;
          const hasItems = markedDays?.has(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`${formatLongDate(day)}${isToday ? ', hoje' : ''}${hasItems ? ', com atividades' : ''}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(day)}
              style={({ pressed }) => [styles.day, selected && styles.daySelected, pressed && !selected && { opacity: 0.8 }]}>
              <ThemedText type="caption" style={{ color: selected ? Palette.white : Palette.textMuted }}>
                {formatWeekdayShort(day)}
              </ThemedText>
              <ThemedText type="heading" style={{ color: selected ? Palette.white : Palette.textPrimary }}>
                {parseDate(day).getDate()}
              </ThemedText>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: hasItems ? (selected ? Palette.white : Palette.bluePrimary) : 'transparent' },
                  isToday && !selected && !hasItems && { backgroundColor: Palette.greenPrimary },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WeekArrow({ direction, onPress }: { direction: 'previous' | 'next'; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'previous' ? 'Semana anterior' : 'Próxima semana'}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.arrow, pressed && { opacity: 0.75 }]}>
      <AppIcon name={direction === 'previous' ? 'chevronLeft' : 'chevronRight'} color={Palette.textSecondary} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekLabel: { flex: 1, textAlign: 'center' },
  arrow: {
    width: MinTouchSize - 8,
    height: MinTouchSize - 8,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
  },
  days: { flexDirection: 'row', gap: Spacing.two },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
  },
  daySelected: { backgroundColor: Palette.bluePrimary, borderColor: Palette.bluePrimary },
  marker: { width: 6, height: 6, borderRadius: Radius.pill, marginTop: Spacing.half },
});
