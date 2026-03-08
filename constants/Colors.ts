/**
 * Colors — imported from tokens.js (single source of truth)
 * Use this file for JS/StyleSheet values.
 * For NativeWind className, tokens are already in tailwind.config.js.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tokens = require('./tokens');

const { palette, semantic } = tokens;

// ─── Raw palette (re-export for direct use) ───────────────────────────────
export { palette };

// ─── Semantic light/dark colors ───────────────────────────────────────────
export const Colors = {
  // System
  primary:   palette.purple[500],
  secondary: palette.pink[500],
  success:   palette.green[500],
  error:     palette.red[500],
  warning:   palette.yellow[500],
  white:     palette.white,
  black:     palette.black,

  // Light mode
  light: {
    ...semantic.light,
    tint:           palette.purple[500],
    tabIconDefault: palette.gray[400],
    tabIconSelected: palette.purple[500],
  },

  // Dark mode
  dark: {
    ...semantic.dark,
    tint:           palette.purple[400],
    tabIconDefault: palette.gray[500],
    tabIconSelected: palette.purple[400],
  },

  // Legacy (backward compat — dùng dần thay bằng semantic)
  cardBackground:  'rgba(30, 30, 47, 0.6)',
  shadow:          '#00000080',
};

export default Colors;
