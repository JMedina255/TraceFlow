/**
 * Tokens de diseño centralizados del Tema UPT para TraceFlow SCM
 * Basado en la paleta oficial de referencia UPT
 */

export const UPT_PALETTE = {
  primary: '#0E3167',
  institutional: '#2D366F',
  secondary: '#1E4686',
  brightBlue: '#3267BE',
  gold: '#9F7C3A',
  yellow: '#FECE22',
  pageBackground: '#F3F4F6',
  surface: '#FFFFFF',
  primaryText: '#111D39',
  secondaryText: '#25396A',
  mutedText: '#6B7280',
  defaultBorder: '#E5E7EB',
  success: '#16803C',
  error: '#B42318',
} as const;

export type UptPaletteKey = keyof typeof UPT_PALETTE;
