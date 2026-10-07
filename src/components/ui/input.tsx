import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: IconKey;
  error?: string | null;
  helperText?: string;
  /** Campo de senha com botão para mostrar/ocultar. */
  password?: boolean;
  required?: boolean;
};

/** Campo de formulário padrão: label, ícone, foco, erro, disabled e helper text. */
export function Input({
  label,
  icon,
  error,
  helperText,
  password = false,
  required = false,
  editable = true,
  multiline,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const disabled = editable === false;

  const borderColor = error ? Palette.error : focused ? Palette.bluePrimary : Palette.border;
  const iconColor = error ? Palette.errorInk : focused ? Palette.blueInk : Palette.textMuted;

  return (
    <View style={styles.group}>
      {label ? (
        <ThemedText type="smallBold">
          {label}
          {required ? <ThemedText type="smallBold" style={{ color: Palette.errorInk }}> *</ThemedText> : null}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.multilineField,
          { borderColor, backgroundColor: disabled ? Palette.surfaceSecondary : Palette.surface },
          focused && styles.focused,
        ]}>
        {icon ? <AppIcon name={icon} color={iconColor} size={18} /> : null}
        <TextInput
          {...props}
          editable={editable}
          multiline={multiline}
          secureTextEntry={password ? hidden : props.secureTextEntry}
          placeholderTextColor={Palette.textMuted}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.multilineInput, disabled && styles.disabledText]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}
            style={styles.trailing}>
            <AppIcon name={hidden ? 'eye' : 'eyeOff'} color={Palette.textMuted} size={18} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <AppIcon name="alert" color={Palette.errorInk} size={14} />
          <ThemedText type="caption" style={{ color: Palette.errorInk, flex: 1 }}>{error}</ThemedText>
        </View>
      ) : helperText ? (
        <ThemedText type="caption" themeColor="textMuted">{helperText}</ThemedText>
      ) : null}
    </View>
  );
}

type SearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterActive?: boolean;
};

/** Busca com ícone de lupa e ação opcional de filtro. */
export function SearchInput({ value, onChangeText, placeholder = 'Buscar...', onFilterPress, filterActive }: SearchInputProps) {
  return (
    <View style={styles.searchRow}>
      <View style={[styles.field, styles.searchField]}>
        <AppIcon name="search" color={Palette.textMuted} size={18} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.textMuted}
          accessibilityLabel={placeholder}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={8} onPress={() => onChangeText('')}>
            <AppIcon name="close" color={Palette.textMuted} size={16} />
          </Pressable>
        ) : null}
      </View>
      {onFilterPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtrar"
          accessibilityState={{ selected: filterActive }}
          onPress={onFilterPress}
          style={({ pressed }) => [
            styles.filterButton,
            filterActive && { backgroundColor: Palette.blueLight, borderColor: Palette.blueSoft },
            pressed && { opacity: 0.85 },
          ]}>
          <AppIcon name="filter" color={filterActive ? Palette.blueInk : Palette.textSecondary} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  focused: { boxShadow: '0px 0px 0px 3px rgba(108, 182, 227, 0.18)' },
  multilineField: { alignItems: 'flex-start', paddingVertical: Spacing.two },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    color: Palette.textPrimary,
    paddingVertical: Spacing.two,
  },
  multilineInput: { minHeight: 88, textAlignVertical: 'top' },
  disabledText: { color: Palette.textMuted },
  trailing: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  searchField: { flex: 1, minHeight: 48 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
