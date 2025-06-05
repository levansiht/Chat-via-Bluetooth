export const COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  background: '#f7fafc',
  white: 'white',
  whiteTransparent: 'rgba(255, 255, 255, 0.9)',
  text: {
    primary: '#2d3748',
    secondary: '#718096',
    tertiary: '#4a5568',
  },
  status: {
    success: '#48bb78',
    error: '#e53e3e',
    errorDark: '#c53030',
    disabled: '#a0aec0',
    disabledDark: '#718096',
  },
  shadow: '#000',
  blue: '#0000ff',
  primaryWithOpacity: 'rgba(102, 126, 234, 0.1)',
};

export const SPACING = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  huge: 40,
  massive: 60,
};

export const BORDER_RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 28,
  xxxl: 32,
};

export const FONT_WEIGHTS = {
  normal: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const SHADOWS = {
  light: {
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  colored: {
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  heavy: {
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Gradient colors được sử dụng nhiều
export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.primaryDark],
  error: [COLORS.status.error, COLORS.status.errorDark],
  disabled: [COLORS.status.disabled, COLORS.status.disabledDark],
  success: ['#48bb78', '#38a169'],
};

export const LAYOUT = {
  containerPadding: SPACING.xxl,
  itemMargin: SPACING.xl,
  borderRadius: BORDER_RADIUS.md,
};
