declare module 'react-native-global-props' {
  import { ReactNode } from 'react';
  import {
    TextProps,
    TextInputProps,
    ViewProps,
    ImageProps,
    ScrollViewProps,
    TouchableOpacityProps,
    StyleProp,
    TextStyle,
    ViewStyle,
  } from 'react-native';

  export function setCustomText(customProps: TextProps): void;
  export function setCustomTextInput(customProps: TextInputProps): void;
  export function setCustomView(customProps: ViewProps): void;
  export function setCustomImage(customProps: ImageProps): void;
  export function setCustomScrollView(customProps: ScrollViewProps): void;
  export function setCustomTouchableOpacity(customProps: TouchableOpacityProps): void;
}
