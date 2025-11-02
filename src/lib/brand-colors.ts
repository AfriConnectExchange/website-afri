/**
 * AfriConnect Exchange - Official Brand Color Palette
 * 
 * These colors follow the official branding guide and should be used
 * consistently across all components and pages.
 */

export const brandColors = {
  // Primary Colors
  primaryBlack: '#000000',      // Logo text, headings
  diasporaOrange: '#F4B400',    // Accent, buttons, highlights, "EXCHANGE" text
  progressBlue: '#0072CE',      // Links, icons, UI accents
  growthGreen: '#34A853',       // Success states, call-to-action areas
  deepIndigo: '#2C2A4A',        // Backgrounds, overlays, footer
  warmClay: '#D96C06',          // Cultural highlights, hover states
  neutralWhite: '#FFFFFF',      // Backgrounds, content areas
} as const;

/**
 * Gradient colors for the circular arrow motif
 * Used in logo and progress indicators
 */
export const logoGradient = {
  start: brandColors.growthGreen,   // #34A853
  middle: brandColors.progressBlue, // #0072CE
  end: brandColors.diasporaOrange,  // #F4B400
} as const;

/**
 * Semantic color mappings for UI components
 */
export const semanticColors = {
  // Buttons
  buttonPrimary: {
    bg: brandColors.diasporaOrange,
    text: brandColors.neutralWhite,
    hover: brandColors.warmClay,
  },
  buttonSecondary: {
    bg: brandColors.neutralWhite,
    text: brandColors.diasporaOrange,
    border: brandColors.diasporaOrange,
    hover: brandColors.diasporaOrange,
  },
  
  // States
  success: brandColors.growthGreen,
  error: '#D93025',
  warning: brandColors.diasporaOrange,
  info: brandColors.progressBlue,
  
  // Links
  link: {
    default: brandColors.progressBlue,
    hover: brandColors.deepIndigo,
  },
  
  // Forms
  input: {
    border: '#CCCCCC',
    focus: brandColors.progressBlue,
    error: '#D93025',
    success: brandColors.growthGreen,
  },
  
  // Navigation
  nav: {
    bg: brandColors.neutralWhite,
    text: brandColors.primaryBlack,
    hover: brandColors.diasporaOrange,
  },
  
  // Footer
  footer: {
    bg: brandColors.deepIndigo,
    text: brandColors.neutralWhite,
    icons: brandColors.progressBlue,
  },
} as const;

/**
 * CSS gradient string for the logo arrow effect
 */
export const logoGradientCSS = `linear-gradient(90deg, ${logoGradient.start} 0%, ${logoGradient.middle} 50%, ${logoGradient.end} 100%)`;

/**
 * Tailwind CSS custom color configuration
 * Add these to your tailwind.config.ts:
 */
export const tailwindColorConfig = {
  'brand-black': brandColors.primaryBlack,
  'brand-orange': brandColors.diasporaOrange,
  'brand-blue': brandColors.progressBlue,
  'brand-green': brandColors.growthGreen,
  'brand-indigo': brandColors.deepIndigo,
  'brand-clay': brandColors.warmClay,
  'brand-white': brandColors.neutralWhite,
} as const;

/**
 * Helper function to get brand color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default brandColors;
