/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

const pastelPalette = {
  text: '#334155',
  background: '#F8FAFC',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#EDF6FA',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  inputBackground: '#FFFFFF',
  brand: '#315B70',
  brandSoft: '#D9EFFA',
  brandAction: '#BFE3F5',
  information: '#315B70',
  informationSoft: '#D9EFFA',
  learning: '#66547A',
  learningSoft: '#EEE3FA',
  attention: '#756329',
  attentionSoft: '#FFF4CC',
  success: '#356B55',
  successSoft: '#DDF3E8',
  danger: '#8A4A54',
  dangerSoft: '#FBE1E5',
  neutral: '#64748B',
  neutralSoft: '#F1F5F9',
  modalOverlay: 'rgba(51, 65, 85, 0.18)',
  onBrand: '#334155',
} as const;

export const Colors = {
  light: pastelPalette,
  dark: pastelPalette,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BrandColors = Colors.light;

export const Radius = {
  small: 12,
  medium: 20,
  large: 28,
  pill: 999,
} as const;

export const Shadows = {
  card: {
    boxShadow: '0px 2px 8px rgba(51, 65, 85, 0.04)',
    elevation: 1,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
