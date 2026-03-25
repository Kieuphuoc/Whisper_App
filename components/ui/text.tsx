import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useMemo } from 'react';

const fontFamilyMap: Record<string | number, string> = {
  '300': 'Quicksand_300Light',
  '400': 'Quicksand_400Regular',
  '500': 'Quicksand_500Medium',
  '600': 'Quicksand_600SemiBold',
  '700': 'Quicksand_700Bold',
  '800': 'Quicksand_700Bold',
  '900': 'Quicksand_700Bold',
  'light': 'Quicksand_300Light',
  'normal': 'Quicksand_400Regular',
  'bold': 'Quicksand_700Bold',
};

export function Text(props: TextProps) {
  const style = useMemo(() => {
    const flatStyle = StyleSheet.flatten(props.style) || {};
    const weight = flatStyle.fontWeight || '400';
    const fontFamily = fontFamilyMap[weight] || 'Quicksand_400Regular';

    // Remove fontWeight from the combined style to avoid conflicts with custom font families
    const { fontWeight, ...styleWithoutWeight } = flatStyle;

    return [
      { fontFamily },
      styleWithoutWeight,
    ];
  }, [props.style]);

  return <RNText {...props} style={style} />;
}

