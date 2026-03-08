import { StyleSheet } from 'react-native';
import { Colors } from './Colors';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tokens = require('./tokens');

const { borderRadius, shadow } = tokens;

export const userStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: tokens.fontSize['2xl'],
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: tokens.fontSize.md,
    color: Colors.light.textSecondary,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: borderRadius.input,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  errorText: {
    color: Colors.error,
    fontSize: tokens.fontSize.sm,
    marginBottom: 10,
    marginLeft: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: Colors.light.text,
    fontSize: tokens.fontSize.md,
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: tokens.fontSize.sm,
  },
  imagePicker: {
    backgroundColor: Colors.light.surfaceAlt,
    height: 200,
    borderRadius: borderRadius.card,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: borderRadius.btn,
    alignItems: 'center',
    marginBottom: 20,
    ...shadow.md,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: tokens.fontSize.lg,
    fontWeight: 'bold' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: Colors.light.textSecondary,
    fontSize: tokens.fontSize.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.avatar,
    backgroundColor: Colors.light.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  signupText: {
    color: Colors.light.textSecondary,
    fontSize: tokens.fontSize.sm,
  },
  signupLink: {
    color: Colors.primary,
    fontSize: tokens.fontSize.sm,
    fontWeight: '600' as const,
  },
  dropdown: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...shadow.sm,
    marginBottom: 20,
  },
  dropdownItem: {
    paddingVertical: 8,
    fontSize: tokens.fontSize.md,
    color: Colors.light.text,
  },
  comboBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: borderRadius.input,
    paddingHorizontal: 15,
    height: 50,
  },
  hiddenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: borderRadius.input,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
});