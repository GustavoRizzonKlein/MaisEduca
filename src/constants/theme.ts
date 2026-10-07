/**
 * Identidade visual do MaisEduca.
 *
 * Toda cor, raio, espaçamento, sombra e tipografia do app sai daqui.
 * Regra de uso: 70–80% branco/off-white, 15–20% tons pastel claros e
 * 5–10% cores de destaque. Os tons `ink` existem apenas para texto/ícone
 * sobre fundos pastel, garantindo contraste legível.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F9FAFB',

  blueLight: '#D9EFF8',
  blueSoft: '#BFE3F5',
  bluePrimary: '#6CB6E3',
  blueInk: '#2C6E96',

  greenLight: '#DDF3E8',
  greenSoft: '#C7E9D8',
  greenPrimary: '#73C6A3',
  greenInk: '#2E7457',

  yellowLight: '#FFF4CC',
  yellowSoft: '#FBE7A6',
  yellowPrimary: '#EBC45E',
  yellowInk: '#806214',

  peachLight: '#FFE5D6',
  peachSoft: '#F8D0BD',
  peachPrimary: '#E99F82',
  peachInk: '#9A5236',

  purpleLight: '#EEE3FA',
  purpleSoft: '#DCC9F0',
  purplePrimary: '#A98AD4',
  purpleInk: '#674C96',

  pinkLight: '#FBE1E5',
  pinkSoft: '#F2C9D0',
  pinkPrimary: '#D99AAA',
  pinkInk: '#9A4A5F',

  textPrimary: '#334155',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  border: '#E2E8F0',
  borderSoft: '#EEF2F6',

  success: '#73C6A3',
  warning: '#EBC45E',
  error: '#E89A9A',
  errorLight: '#FCE8E8',
  errorInk: '#A84343',
  info: '#6CB6E3',

  white: '#FFFFFF',
  overlay: 'rgba(51, 65, 85, 0.28)',
} as const;

/** Tokens semânticos consumidos pelos componentes (via `useTheme`). */
const lightTheme = {
  text: Palette.textPrimary,
  textSecondary: Palette.textSecondary,
  textMuted: Palette.textMuted,
  background: Palette.background,
  surface: Palette.surface,
  surfaceSecondary: Palette.surfaceSecondary,
  border: Palette.border,
  borderSoft: Palette.borderSoft,
  primary: Palette.bluePrimary,
  primarySoft: Palette.blueSoft,
  primaryLight: Palette.blueLight,
  primaryInk: Palette.blueInk,
  onPrimary: Palette.white,
  danger: Palette.errorInk,
  dangerLight: Palette.errorLight,
  overlay: Palette.overlay,
} as const;

export const Colors = {
  light: lightTheme,
  dark: lightTheme,
} as const;

export type ThemeColor = keyof typeof lightTheme;

/**
 * Tons pastel reutilizáveis para ícones, badges e indicadores.
 * `light` = fundo, `soft` = borda/seleção, `primary` = destaque, `ink` = texto.
 */
export type Tone = 'blue' | 'green' | 'yellow' | 'peach' | 'purple' | 'pink' | 'neutral' | 'danger';

export const Tones: Record<Tone, { light: string; soft: string; primary: string; ink: string }> = {
  blue: { light: Palette.blueLight, soft: Palette.blueSoft, primary: Palette.bluePrimary, ink: Palette.blueInk },
  green: { light: Palette.greenLight, soft: Palette.greenSoft, primary: Palette.greenPrimary, ink: Palette.greenInk },
  yellow: { light: Palette.yellowLight, soft: Palette.yellowSoft, primary: Palette.yellowPrimary, ink: Palette.yellowInk },
  peach: { light: Palette.peachLight, soft: Palette.peachSoft, primary: Palette.peachPrimary, ink: Palette.peachInk },
  purple: { light: Palette.purpleLight, soft: Palette.purpleSoft, primary: Palette.purplePrimary, ink: Palette.purpleInk },
  pink: { light: Palette.pinkLight, soft: Palette.pinkSoft, primary: Palette.pinkPrimary, ink: Palette.pinkInk },
  neutral: { light: '#F1F5F9', soft: Palette.border, primary: Palette.textMuted, ink: Palette.textSecondary },
  danger: { light: Palette.errorLight, soft: '#F5C6C6', primary: Palette.error, ink: Palette.errorInk },
};

/** Escolhe um tom estável a partir de um texto (ex.: avatar por nome). */
export function toneFromString(value: string): Tone {
  const options: Tone[] = ['blue', 'green', 'peach', 'purple', 'yellow', 'pink'];
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return options[hash % options.length];
}

export const Radius = {
  small: 10,
  medium: 14,
  large: 20,
  xlarge: 28,
  pill: 999,
} as const;

export const Shadows = {
  card: {
    boxShadow: '0px 4px 14px rgba(51, 65, 85, 0.05)',
    elevation: 1,
  },
  floating: {
    boxShadow: '0px 8px 24px rgba(51, 65, 85, 0.12)',
    elevation: 4,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Margem lateral padrão das telas. */
export const ScreenPadding = 20;

/** Altura mínima de qualquer área tocável (acessibilidade). */
export const MinTouchSize = 44;

export const MaxContentWidth = 640;
