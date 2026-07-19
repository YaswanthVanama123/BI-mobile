export const colors = {
  primary: {
    50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD', 400: '#60A5FA',
    500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A', 950: '#172554',
  },
  success: {
    50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399',
    500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B',
  },
  warning: {
    50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24',
    500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F',
  },
  danger: {
    50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171',
    500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
  },
  dark: {
    50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF',
    500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827', 950: '#030712',
  },
  white: '#FFFFFF',
};

export const tone = {
  neutral: { bg: colors.dark[100], fg: colors.dark[600], solid: colors.dark[500] },
  info: { bg: colors.primary[50], fg: colors.primary[700], solid: colors.primary[600] },
  success: { bg: colors.success[50], fg: colors.success[700], solid: colors.success[600] },
  warning: { bg: colors.warning[50], fg: colors.warning[700], solid: colors.warning[500] },
  danger: { bg: colors.danger[50], fg: colors.danger[700], solid: colors.danger[600] },
};

export const CHART_COLORS = [
  colors.primary[600], colors.success[500], colors.warning[500], colors.danger[500],
  '#8B5CF6', '#0EA5E9', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

export const theme = {
  colors,
  tone,
  bg: colors.dark[50],
  card: colors.white,
  border: colors.dark[200],
  text: colors.dark[800],
  textMuted: colors.dark[500],
  textFaint: colors.dark[400],
  radius: 12,
  radiusSm: 8,
  space: (n) => n * 4,
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
};

export default theme;
