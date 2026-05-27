export type ThemeMode = "light" | "dark";

function parseCssColor(value: string): { r: number; g: number; b: number } | null {
  const v = value.trim();
  if (!v) return null;

  if (v.startsWith("#")) {
    const hex = v.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    return null;
  }

  const rgb = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
    };
  }

  return null;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function isDarkFromHostTokens(): boolean {
  if (typeof document === "undefined") return false;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--background-primary")
    .trim();
  const rgb = parseCssColor(raw);
  if (!rgb) return false;
  return relativeLuminance(rgb.r, rgb.g, rgb.b) < 0.35;
}

/** Resolve light/dark from Port theme.mode, injected tokens, or system preference. */
export function resolveThemeMode(themeMode?: string): ThemeMode {
  const normalized = themeMode?.trim().toLowerCase();
  if (normalized === "dark" || normalized === "dark-mode") return "dark";
  if (normalized === "light" || normalized === "light-mode") return "light";

  if (isDarkFromHostTokens()) return "dark";

  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
}

export function applyDocumentTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}
