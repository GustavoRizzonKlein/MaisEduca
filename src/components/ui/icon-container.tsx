import { StyleSheet, View } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { Radius, Tones, type Tone } from '@/constants/theme';

type IconContainerProps = {
  icon: IconKey;
  tone?: Tone;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  shape?: 'rounded' | 'circle';
};

const dimensions = {
  small: { box: 32, icon: 16 },
  medium: { box: 44, icon: 20 },
  large: { box: 56, icon: 26 },
  xlarge: { box: 96, icon: 42 },
} as const;

/** Ícone linear sobre um pequeno fundo pastel. */
export function IconContainer({ icon, tone = 'blue', size = 'medium', shape = 'rounded' }: IconContainerProps) {
  const { box, icon: iconSize } = dimensions[size];
  const colors = Tones[tone];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.container,
        {
          width: box,
          height: box,
          backgroundColor: colors.light,
          borderRadius: shape === 'circle' ? Radius.pill : Math.round(box * 0.32),
        },
      ]}>
      <AppIcon name={icon} color={colors.ink} size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
