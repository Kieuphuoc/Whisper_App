import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useMemo } from 'react';

const fontFamilyMap: Record<string | number, string> = {
  '300': 'Quicksand_300Light',
  '400': 'Quicksand_400Regular',
  '500': 'Quicksand_500Medium',
  '600': 'Quicksand_600SemiBold',
  '700': 'Quicksand_700Bold',
  'light': 'Quicksand_300Light',
  'normal': 'Quicksand_400Regular',
  'bold': 'Quicksand_700Bold',
};

export function Text(props: TextProps) {
  const style = useMemo(() => {
    const flatStyle = StyleSheet.flatten(props.style) || {};
    const fontWeight = flatStyle.fontWeight || '400';
    const fontFamily = fontFamilyMap[fontWeight] || 'Quicksand_400Regular';

    return [
      { fontFamily },
      props.style,
    ];
  }, [props.style]);

  return <RNText {...props} style={style} />;
}

