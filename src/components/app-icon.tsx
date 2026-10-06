import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

export type AppIconName = ComponentProps<typeof SymbolView>['name'];

type AppIconProps = {
  name: AppIconName;
  color: string;
  size?: number;
};

export function AppIcon({ name, color, size = 20 }: AppIconProps) {
  return <SymbolView name={name} tintColor={color} size={size} />;
}
