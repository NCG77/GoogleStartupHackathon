/**
 * SafeRoute Visual Identity — deep burgundy, near-black and warm white, Inter typography.
 * Light + dark schemes share the same token keys.
 * Burgundy is the brand; danger / SOS stays a distinct red so emergencies never read as branding.
 */

export type ColorTokens = {
  primary: string;
  primaryPressed: string;
  primaryContainer: string;
  primaryOnContainer: string;
  secondary: string;
  secondaryContainer: string;

  accent: string;
  accentContainer: string;

  success: string;
  successContainer: string;
  successText: string;
  warning: string;
  warningContainer: string;
  danger: string;
  dangerContainer: string;
  dangerPressed: string;
  errorText: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceVariant: string;
  surfaceGlass: string;

  textPrimary: string;
  textSecondary: string;
  textLabel: string;
  textTertiary: string;
  textOnPrimary: string;
  textOnDanger: string;
  textDisabled: string;
  textLink: string;

  charcoal: string;
  border: string;
  borderFocus: string;
  divider: string;
  overlay: string;
  scrim: string;

  heroWash: string;
  indigoGlow: string;
  headerWash: readonly [string, string];

  /** Legacy aliases */
  info: string;
  textLight: string;
  backgroundLight: string;
  backgroundSelected: string;
  lightGray: string;
  cardBackground: string;
  primaryLight: string;
};

/**
 * Light — burgundy on warm off-white.
 * Body text on background/surface stays ≥ 4.5:1; #929098 is reserved for tertiary text and icons.
 */
export const lightColors: ColorTokens = {
  primary: "#800020",
  primaryPressed: "#66001A",
  primaryContainer: "#F5E6E9",
  primaryOnContainer: "#4A0E1C",
  secondary: "#4A0E1C",
  secondaryContainer: "#EFE4E6",

  accent: "#9E3A52",
  accentContainer: "#F5E6E9",

  success: "#2F8F5B",
  successContainer: "#E4F2EA",
  successText: "#1F6B43",
  warning: "#C77700",
  warningContainer: "#FBF0DC",
  danger: "#D92D20",
  dangerContainer: "#FDE8E6",
  dangerPressed: "#B42318",
  errorText: "#B42318",

  background: "#F7F5F4",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceVariant: "#EFECEA",
  surfaceGlass: "rgba(255, 255, 255, 0.96)",

  textPrimary: "#111113",
  textSecondary: "#66646B",
  textLabel: "#3D3B41",
  textTertiary: "#929098",
  textOnPrimary: "#FFFFFF",
  textOnDanger: "#FFFFFF",
  textDisabled: "#C9C6C4",
  textLink: "#800020",

  charcoal: "#111113",
  border: "#E8E3E1",
  borderFocus: "#800020",
  divider: "#ECE8E6",
  overlay: "rgba(17, 17, 19, 0.48)",
  scrim: "rgba(17, 17, 19, 0.32)",

  heroWash: "#F5E6E9",
  indigoGlow: "rgba(128, 0, 32, 0.12)",
  headerWash: ["#F3EAEB", "#F7F5F4"] as const,

  info: "#3B5B8C",
  textLight: "#F7F5F4",
  backgroundLight: "#F7F5F4",
  backgroundSelected: "#F5E6E9",
  lightGray: "#EFECEA",
  cardBackground: "#FFFFFF",
  primaryLight: "#F5E6E9",
};

/**
 * Dark — near-black canvas with charcoal surfaces.
 * Primary is a lifted burgundy so it keeps contrast on #111113 and under white labels.
 */
export const darkColors: ColorTokens = {
  primary: "#B3364F",
  primaryPressed: "#9A2B43",
  primaryContainer: "#3A0F1B",
  primaryOnContainer: "#F2C5CF",
  secondary: "#D9A3AF",
  secondaryContainer: "#2E1A20",

  accent: "#E08A9E",
  accentContainer: "#3A0F1B",

  success: "#4CC38A",
  successContainer: "#133626",
  successText: "#7FD8A9",
  warning: "#F0B44C",
  warningContainer: "#3D2A0C",
  danger: "#F2564B",
  dangerContainer: "#4A1512",
  dangerPressed: "#E0453A",
  errorText: "#FF9A91",

  background: "#111113",
  surface: "#1C1C20",
  surfaceElevated: "#242429",
  surfaceVariant: "#26262B",
  surfaceGlass: "rgba(28, 28, 32, 0.97)",

  textPrimary: "#F5F3F2",
  textSecondary: "#B4B1B8",
  textLabel: "#D6D3D9",
  textTertiary: "#929098",
  textOnPrimary: "#FFFFFF",
  textOnDanger: "#FFFFFF",
  textDisabled: "#4D4B52",
  textLink: "#E58A9C",

  charcoal: "#F5F3F2",
  border: "#2E2D33",
  borderFocus: "#C9536B",
  divider: "#2A292E",
  overlay: "rgba(0, 0, 0, 0.6)",
  scrim: "rgba(0, 0, 0, 0.5)",

  heroWash: "#2A0E16",
  indigoGlow: "rgba(179, 54, 79, 0.2)",
  headerWash: ["#1C1C20", "#111113"] as const,

  info: "#8FA8D6",
  textLight: "#F5F3F2",
  backgroundLight: "#111113",
  backgroundSelected: "#3A0F1B",
  lightGray: "#26262B",
  cardBackground: "#1C1C20",
  primaryLight: "#3A0F1B",
};

/** @deprecated Prefer useAppTheme().colors — defaults to light for StyleSheet modules */
export const colors = lightColors;

export function paletteFor(scheme: "light" | "dark"): ColorTokens {
  return scheme === "dark" ? darkColors : lightColors;
}

/**
 * Restrained fills. Brand gradients are near-flat burgundy (a hint of depth, not a rainbow);
 * icon tiles are flat tonal containers.
 */
export const lightGradients = {
  primaryButton: ["#8C0A2C", "#6E001B"] as const,
  safetyBadge: ["#2F8F5B", "#3FA26C"] as const,
  safetyMid: ["#C77700", "#D98E1C"] as const,
  safetyHigh: ["#D92D20", "#E5483C"] as const,
  sos: ["#E0352B", "#C21F16"] as const,
  navActive: ["#800020", "#800020"] as const,
  greeting: ["#4A0E1C", "#800020"] as const,
  important: ["#800020", "#4A0E1C"] as const,
  iconPrimary: ["#F5E6E9", "#F5E6E9"] as const,
  iconSuccess: ["#E4F2EA", "#E4F2EA"] as const,
  iconWarning: ["#FBF0DC", "#FBF0DC"] as const,
  iconDanger: ["#FDE8E6", "#FDE8E6"] as const,
  iconAccent: ["#EFECEA", "#EFECEA"] as const,
  header: ["#F3EAEB", "#F7F5F4"] as const,
} as const;

export const darkGradients = {
  primaryButton: ["#B3364F", "#8E2239"] as const,
  safetyBadge: ["#2F8F5B", "#4CC38A"] as const,
  safetyMid: ["#B86E00", "#F0B44C"] as const,
  safetyHigh: ["#C8281C", "#F2564B"] as const,
  sos: ["#E0352B", "#C21F16"] as const,
  navActive: ["#B3364F", "#B3364F"] as const,
  greeting: ["#F2C5CF", "#E58A9C"] as const,
  important: ["#B3364F", "#7A1A2F"] as const,
  iconPrimary: ["#3A0F1B", "#3A0F1B"] as const,
  iconSuccess: ["#133626", "#133626"] as const,
  iconWarning: ["#3D2A0C", "#3D2A0C"] as const,
  iconDanger: ["#4A1512", "#4A1512"] as const,
  iconAccent: ["#26262B", "#26262B"] as const,
  header: ["#1C1C20", "#111113"] as const,
} as const;

export const gradients = lightGradients;

export function gradientsFor(scheme: "light" | "dark") {
  return scheme === "dark" ? darkGradients : lightGradients;
}

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

/** Prefer 24px (xl) for cards / surfaces */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  search: 24,
  hero: 24,
  pill: 999,
  full: 9999,
} as const;

/**
 * Inter scale — Display 42 · H1 34 · H2 28 · H3 22 · Body 16 · Caption 13
 * Line-heights ~135%. Large headings: letterSpacing ≈ −1%.
 */
export const typography = {
  fontFamily: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  size: {
    caption: 13,
    body: 16,
    bodyLarge: 16,
    title: 22, // H3
    headline: 34, // H1
    display: 28, // H2
    hero: 42, // Display
  },
  lineHeight: {
    caption: 18, // ~138%
    body: 22, // ~138%
    bodyLarge: 22,
    title: 30, // ~136%
    headline: 46, // ~135%
    display: 38, // ~136%
    hero: 56, // ~133%
  },
  /** −1% tracking for large headings */
  tracking: {
    tight: -0.42,
    heading: -0.34,
    title: -0.22,
    body: 0,
  },
} as const;

/** Soft, neutral shadows — borders carry most of the separation */
export const elevation = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: "#111113",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLift: {
    shadowColor: "#111113",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  floating: {
    shadowColor: "#111113",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  fab: {
    shadowColor: "#111113",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  sheet: {
    shadowColor: "#111113",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;

/** Dark mode: plain black shadows; surfaces separate by tone and hairline borders */
export const elevationDark = {
  none: elevation.none,
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLift: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  fab: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  sheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;

export function elevationFor(scheme: "light" | "dark") {
  return scheme === "dark" ? elevationDark : elevation;
}

export const touch = {
  minTarget: 48,
  buttonHeight: 56,
  sosSize: 72,
  fabSize: 56,
  tabBarHeight: 90,
} as const;

export function tabContentBottomInset(safeBottom: number): number {
  const floatBottom = Math.max(safeBottom, spacing.sm);
  return touch.tabBarHeight + floatBottom + spacing.sm;
}

/** Micro-motion window: 150–300ms; screen-level transitions up to ~400ms */
export const motion = {
  micro: 150,
  fast: 180,
  normal: 220,
  slow: 280,
  page: 220,
  screen: 360,
  stagger: 60,
  pressScale: 0.97,
  pressScaleCard: 0.985,
  cardLift: -2,
  iconActive: 1.08,
  sosBreath: 2000,
  unreadPulse: 3000,
  toastIn: 260,
  toastOut: 200,
  toastVisibleMs: 3600,
  /** Spring for press feedback — settles quickly without bounce */
  pressSpring: { damping: 18, stiffness: 320, mass: 0.6 },
} as const;

export function safetyTone(score: number): {
  from: string;
  to: string;
  label: string;
} {
  if (score >= 70) {
    return {
      from: gradients.safetyBadge[0],
      to: gradients.safetyBadge[1],
      label: "Low risk",
    };
  }
  if (score >= 40) {
    return {
      from: gradients.safetyMid[0],
      to: gradients.safetyMid[1],
      label: "Medium",
    };
  }
  return {
    from: gradients.safetyHigh[0],
    to: gradients.safetyHigh[1],
    label: "High risk",
  };
}

export const theme = {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  elevation,
  touch,
  motion,
  safetyTone,
} as const;

export type Theme = typeof theme;
export type ColorToken = keyof ColorTokens;
