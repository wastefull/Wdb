/**
 * categoryColors.ts
 * Central source of truth for per-material-category colors.
 * Fetches from the backend (KV store) and applies as CSS custom properties
 * so that all components that render category chips/tags pick them up dynamically.
 *
 * Colors are keyed by category ID (stable slug, e.g. "paper-cardboard"),
 * not by display name. CSS vars are --cat-{slug}.
 *
 * Dark mode and No-Pastel mode variants are auto-derived from the base color
 * and applied automatically when the .dark / .no-pastel class is present on
 * <html>. No separate admin configuration is needed.
 */
import { apiCall } from "./api";
import { logger } from "./logger";

/** Record<categoryId, hexColor> — keys are stable slugs, not display names. */
export type CategoryColorMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Module-level color storage so we can switch between modes without re-fetching
// ---------------------------------------------------------------------------
let _baseColors: CategoryColorMap = {};
let _darkColors: CategoryColorMap = {};
let _npColors: CategoryColorMap = {};

// ---------------------------------------------------------------------------
// HSL utilities
// ---------------------------------------------------------------------------

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const s1 = s / 100;
  const l1 = l / 100;
  const a = s1 * Math.min(l1, 1 - l1);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l1 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Derive a dark-mode variant from a pastel base color.
 * Reduces lightness to ~50% so it reads well on dark backgrounds,
 * and boosts saturation slightly to prevent muddiness.
 */
function deriveDarkVariant(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const [h, s, l] = hexToHsl(hex);
  const darkL = Math.max(38, l - 28); // e.g. 76% → 48%
  const darkS = Math.min(68, s + 12);
  return hslToHex(h, darkS, darkL);
}

/**
 * Derive a no-pastel variant from a pastel base color.
 * Significantly boosts saturation and reduces lightness for a vivid,
 * non-washed-out chip on light backgrounds.
 */
function deriveNoPastelVariant(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const [h, s, l] = hexToHsl(hex);
  const npL = Math.max(32, l - 36); // e.g. 76% → 40%
  const npS = Math.min(80, s + 38);
  return hslToHex(h, npS, npL);
}

function getCurrentMode(): "dark" | "np" | "base" {
  if (typeof document === "undefined") return "base";
  const cl = document.documentElement.classList;
  if (cl.contains("no-pastel")) return "np";
  if (cl.contains("dark")) return "dark";
  return "base";
}

/**
 * Re-apply --cat-{id} CSS vars for the currently active mode (base / dark / np).
 * Called automatically by applyCategoryColors and by the MutationObserver in
 * CategoryContext whenever .dark or .no-pastel is toggled on <html>.
 */
export function updateColorModeVars(): void {
  if (typeof document === "undefined") return;
  const mode = getCurrentMode();
  const map =
    mode === "dark" ? _darkColors : mode === "np" ? _npColors : _baseColors;
  const root = document.documentElement;
  for (const [slug, color] of Object.entries(map)) {
    root.style.setProperty(`--cat-${slug}`, color);
  }
}

/**
 * Converts any category name or ID to a stable CSS custom property slug.
 * Idempotent: works on both "Paper & Cardboard" and "paper-cardboard".
 * e.g. "Paper & Cardboard" → "paper-cardboard"
 */
export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Converts a category name or ID to a CSS custom property name.
 * e.g. "Paper & Cardboard" → "--cat-paper-cardboard"
 *      "paper-cardboard"   → "--cat-paper-cardboard"
 */
export function categoryToCssVar(category: string): string {
  return `--cat-${categoryToSlug(category)}`;
}

/**
 * Default colors keyed by category ID (slug).
 * These match the DEFAULT_CATEGORIES in the backend.
 */
export const DEFAULT_CATEGORY_COLORS: CategoryColorMap = {
  plastics: "#b8c8cb",
  metals: "#e4e3ac",
  glass: "#bae1c3",
  "paper-cardboard": "#d4c9a8",
  "fabrics-textiles": "#b8c8cb",
  "electronics-batteries": "#b8c8cb",
  "building-materials": "#bae1c3",
  "organic-natural-waste": "#e6beb5",
  elements: "#e4e3ac",
};

/**
 * Apply a color map to the document root as CSS custom properties.
 * Also derives and stores dark-mode and no-pastel variants so they can
 * be swapped in automatically when the corresponding class is active.
 * Keys may be slugs ("paper-cardboard") or display names — both are slugified.
 */
export function applyCategoryColors(colors: CategoryColorMap): void {
  _baseColors = {};
  _darkColors = {};
  _npColors = {};
  for (const [category, color] of Object.entries(colors)) {
    const slug = categoryToSlug(category);
    _baseColors[slug] = color;
    _darkColors[slug] = deriveDarkVariant(color);
    _npColors[slug] = deriveNoPastelVariant(color);
  }
  updateColorModeVars();
}

/** Fetch colors from the backend and apply them. Falls back to defaults silently. */
export async function loadAndApplyCategoryColors(): Promise<CategoryColorMap> {
  try {
    const data = await apiCall("/settings/category-colors", {}, true);
    const colors: CategoryColorMap = {
      ...DEFAULT_CATEGORY_COLORS,
      ...(data.colors as CategoryColorMap),
    };
    applyCategoryColors(colors);
    return colors;
  } catch (err) {
    logger.warn("Failed to load category colors, using defaults:", err);
    applyCategoryColors(DEFAULT_CATEGORY_COLORS);
    return DEFAULT_CATEGORY_COLORS;
  }
}

/** Save colors to the backend and apply immediately. */
export async function saveCategoryColors(
  colors: CategoryColorMap,
): Promise<CategoryColorMap> {
  const data = await apiCall("/settings/category-colors", {
    method: "PATCH",
    body: JSON.stringify({ colors }),
  });
  const updated: CategoryColorMap = {
    ...DEFAULT_CATEGORY_COLORS,
    ...(data.colors as CategoryColorMap),
  };
  applyCategoryColors(updated);
  return updated;
}
