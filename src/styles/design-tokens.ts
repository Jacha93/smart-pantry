// Smart Pantry Design Tokens
// Brand Identity: Vibrant Cyan (#17f6fe) + Electric Purple (#a10dfd)

export const colors = {
  // Backgrounds
  background: {
    primary: '#09090b',      // Fast Schwarz - Haupthintergrund
    secondary: '#0c0c0e',    // Leicht heller für Depth
    elevated: '#18181b',     // Cards, Modals
    glass: 'rgba(24, 24, 27, 0.6)', // Glassmorphism Base
  },
  
  // ⚡ SMART PANTRY BRAND COLORS ⚡
  brand: {
    // Primary - Vibrant Cyan
    primary: '#17f6fe',           // Haupt-Buttons, Links, Active States
    primaryLight: '#4ff8ff',      // Hover State
    primaryDark: '#0cc5cc',       // Pressed State
    primaryMuted: 'rgba(23, 246, 254, 0.15)', // Subtle Backgrounds
    
    // Accent - Electric Purple
    accent: '#a10dfd',            // Akzent-Elemente, Badges, Secondary Actions
    accentLight: '#b83fff',       // Hover State
    accentDark: '#7a0ac4',        // Pressed State
    accentMuted: 'rgba(161, 13, 253, 0.15)', // Subtle Backgrounds
  },
  
  // Semantic Colors
  semantic: {
    success: '#22c55e',      // Grün für Erfolg
    warning: '#f59e0b',      // Orange für Warnungen
    error: '#ef4444',        // Rot für Fehler
    info: '#3b82f6',         // Blau für Info
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',      // Weiß - Haupt-Text
    secondary: '#a1a1aa',    // Grau - Beschreibungen
    muted: '#71717a',        // Dunkler Grau - Placeholders
    inverse: '#09090b',      // Für helle Buttons
    brand: '#17f6fe',        // Brand-farbener Text
    accent: '#a10dfd',       // Accent-farbener Text
  },
  
  // Border Colors
  border: {
    default: 'rgba(255, 255, 255, 0.1)',   // 10% Weiß
    hover: 'rgba(255, 255, 255, 0.2)',     // 20% Weiß
    focus: 'rgba(23, 246, 254, 0.5)',      // 50% Primary Cyan
    accent: 'rgba(161, 13, 253, 0.3)',     // 30% Accent Purple
  },
} as const;

export const glows = {
  // Button Glows
  primaryButton: '0 0 20px rgba(23, 246, 254, 0.4), 0 0 40px rgba(23, 246, 254, 0.2)',
  accentButton: '0 0 20px rgba(161, 13, 253, 0.4), 0 0 40px rgba(161, 13, 253, 0.2)',
  
  // Viewport Glows (Top & Bottom)
  viewportTop: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(23, 246, 254, 0.12), transparent)',
  viewportBottom: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(161, 13, 253, 0.08), transparent)',
  
  // Card Hover Glow
  cardHover: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(23, 246, 254, 0.1)',
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
} as const;

export const layout = {
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px - Buttons
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px - Cards
    '2xl': '1.5rem', // 24px
    full: '9999px',  // Pills, Badges
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    modal: 1050,
    tooltip: 1070,
  },
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  hover: {
    lift: 'translateY(-4px)',
    scale: 'scale(1.02)',
  },
} as const;
