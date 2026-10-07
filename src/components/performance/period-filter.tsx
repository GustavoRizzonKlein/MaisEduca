import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Input, Select } from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { PERIOD_OPTIONS, formatPeriodLabel, resolvePeriod, validateRange } from '@/lib/periods';
import type { PeriodPreset, ReportPeriod } from '@/types/performance';

type PeriodFilterProps = {
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
};

/** Filtro de período: presets ou intervalo personalizado (inclusivo). */
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [custom, setCustom] = useState({ inicio: value.inicio, fim: value.fim });
  const [error, setError] = useState<string | null>(null);
  const [editingCustom, setEditingCustom] = useState(value.preset === 'personalizado');

  useEffect(() => {
    setCustom({ inicio: value.inicio, fim: value.fim });
  }, [value.inicio, value.fim]);

  function handlePreset(preset: string) {
    setError(null);
    if (preset === 'personalizado') {
      setEditingCustom(true);
      return;
    }
    setEditingCustom(false);
    onChange(resolvePeriod(preset as Exclude<PeriodPreset, 'personalizado'>));
  }

  function applyCustom() {
    const validation = validateRange(custom.inicio.trim(), custom.fim.trim());
    setError(validation);
    if (validation) return;
    onChange({ preset: 'personalizado', inicio: custom.inicio.trim(), fim: custom.fim.trim() });
  }

  return (
    <View style={styles.wrap}>
      <Select
        label="Período"
        value={editingCustom ? 'personalizado' : value.preset}
        onChange={handlePreset}
        options={PERIOD_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        helperText={editingCustom ? undefined : formatPeriodLabel(value)}
      />
      {editingCustom ? (
        <View style={styles.custom}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Input
                label="De"
                icon="calendar"
                value={custom.inicio}
                onChangeText={(inicio) => setCustom((current) => ({ ...current, inicio }))}
                placeholder="AAAA-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.flex}>
              <Input
                label="Até"
                icon="calendar"
                value={custom.fim}
                onChangeText={(fim) => setCustom((current) => ({ ...current, fim }))}
                placeholder="AAAA-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          {error ? <ThemedText type="caption" style={styles.error}>{error}</ThemedText> : null}
          <Button title="Aplicar período" size="small" variant="secondary" onPress={applyCustom} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  custom: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1 },
  error: { color: Palette.errorInk },
});
