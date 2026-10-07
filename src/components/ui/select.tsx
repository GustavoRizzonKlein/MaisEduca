import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Palette, Radius, Spacing } from '@/constants/theme';

export type SelectOption = { value: string; label: string; description?: string };

type SelectProps = {
  label?: string;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
};

/** Seleção única aberta em BottomSheet. */
export function Select({
  label,
  placeholder = 'Selecionar',
  value,
  options,
  onChange,
  error,
  helperText,
  required,
  disabled,
  emptyMessage = 'Nenhuma opção disponível.',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.group}>
      {label ? (
        <ThemedText type="smallBold">
          {label}
          {required ? <ThemedText type="smallBold" style={{ color: Palette.errorInk }}> *</ThemedText> : null}
        </ThemedText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label ?? placeholder}: ${selected?.label ?? 'nenhum selecionado'}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          { borderColor: error ? Palette.error : Palette.border },
          disabled && styles.disabled,
          pressed && { opacity: 0.9 },
        ]}>
        <ThemedText style={styles.value} themeColor={selected ? 'text' : 'textMuted'} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </ThemedText>
        <AppIcon name="chevronDown" color={Palette.textMuted} size={16} />
      </Pressable>
      {error ? (
        <ThemedText type="caption" style={{ color: Palette.errorInk }}>{error}</ThemedText>
      ) : helperText ? (
        <ThemedText type="caption" themeColor="textMuted">{helperText}</ThemedText>
      ) : null}

      <BottomSheet visible={open} title={label ?? placeholder} onClose={() => setOpen(false)}>
        {options.length === 0 ? (
          <ThemedText themeColor="textSecondary">{emptyMessage}</ThemedText>
        ) : (
          options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && { opacity: 0.85 },
                ]}>
                <View style={styles.optionCopy}>
                  <ThemedText type="subtitle">{option.label}</ThemedText>
                  {option.description ? (
                    <ThemedText type="small" themeColor="textSecondary">{option.description}</ThemedText>
                  ) : null}
                </View>
                {isSelected ? <AppIcon name="check" color={Palette.blueInk} size={18} /> : null}
              </Pressable>
            );
          })
        )}
      </BottomSheet>
    </View>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Chip selecionável (filtros, tipos, seleção múltipla). */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.85 }]}>
      {selected ? <AppIcon name="check" color={Palette.blueInk} size={14} /> : null}
      <ThemedText type="smallBold" style={{ color: selected ? Palette.blueInk : Palette.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    backgroundColor: Palette.surface,
  },
  value: { flex: 1 },
  disabled: { backgroundColor: Palette.surfaceSecondary, opacity: 0.7 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 56,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
  },
  optionSelected: { borderColor: Palette.blueSoft, backgroundColor: Palette.blueLight },
  optionCopy: { flex: 1, gap: Spacing.half },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  chipSelected: { borderColor: Palette.blueSoft, backgroundColor: Palette.blueLight },
});
