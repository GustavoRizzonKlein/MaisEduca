/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#17324D',
    background: '#F5F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E4F3EF',
    textSecondary: '#607487',
    border: '#DCE7EC',
    inputBackground: '#F8FBFC',
    brand: '#168A78',
    brandSoft: '#E4F3EF',
    information: '#2E7DBA',
    informationSoft: '#EAF4FB',
    learning: '#7866C8',
    learningSoft: '#F0EDFC',
    attention: '#D88932',
    attentionSoft: '#FFF3E5',
    danger: '#C65353',
    dangerSoft: '#FDEEEE',
    onBrand: '#FFFFFF',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    border: '#3A4148',
    inputBackground: '#181A1D',
    brand: '#54C7B3',
    brandSoft: '#183C37',
    information: '#78B9E8',
    informationSoft: '#193247',
    learning: '#B4A8F0',
    learningSoft: '#302A50',
    attention: '#F2B56E',
    attentionSoft: '#4B341E',
    danger: '#F08A8A',
    dangerSoft: '#4D2424',
    onBrand: '#12342E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BrandColors = Colors.light;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#17324D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
