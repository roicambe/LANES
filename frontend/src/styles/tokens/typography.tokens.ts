export const typographyTokens = {
  fonts: {
    sans: 'var(--font-geist-sans), system-ui, sans-serif',
    mono: 'var(--font-geist-mono), monospace',
  },
  // Fluid typography scale (min-size, preferred-size based on viewport, max-size)
  // Max sizes match standard Tailwind defaults; Min sizes scale down for mobile
  sizes: {
    xs: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)',
    sm: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
    base: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
    lg: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
    xl: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
    '2xl': 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
    '3xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)',
    '4xl': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
  },
  lineHeights: {
    tight: '1.1',
    snug: '1.3',
    normal: '1.5',
    relaxed: '1.625',
  }
};
