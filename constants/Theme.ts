/**
 * Theme — imports all tokens from single source of truth.
 * Use this for JS/StyleSheet-based theming.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tokens = require('./tokens');
import { Colors } from './Colors';

const { spacing, fontSize, fontWeight, borderRadius, shadow, animation, size, fonts } = tokens;

export { spacing, fontSize, fontWeight, borderRadius, shadow, animation, size, fonts };

export const theme = {
    light: {
        colors: {
            ...Colors.light,
            primary: Colors.primary,
            secondary: Colors.secondary,
            // backward compat aliases
            icon:       Colors.light.textMuted,
        },
        primary: Colors.primary,
        secondary: Colors.secondary,
        success: Colors.success,
        error: Colors.error,
        warning: Colors.warning,
        spacing,
        fontSize,
        fontWeight,
        borderRadius,
        shadow,
        animation,
        size,
        // Backward-compat aliases (matches old Theme shape)
        radius: borderRadius,
        shadows: shadow,
        typography: {
            fontSizes: fontSize,
            fontWeights: fontWeight,
            fonts,
        },
    },
    dark: {
        colors: {
            ...Colors.dark,
            primary: Colors.primary,
            secondary: Colors.secondary,
            // backward compat aliases
            icon:       Colors.dark.textMuted,
        },
        primary: Colors.primary,
        secondary: Colors.secondary,
        success: Colors.success,
        error: Colors.error,
        warning: Colors.warning,
        spacing,
        fontSize,
        fontWeight,
        borderRadius,
        shadow,
        animation,
        size,
        // Backward-compat aliases
        radius: borderRadius,
        shadows: shadow,
        typography: {
            fontSizes: fontSize,
            fontWeights: fontWeight,
            fonts,
        },
    },
};

export default theme;
