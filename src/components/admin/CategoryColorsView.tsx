import { useState, useEffect, useCallback } from "react";
import {
  Save,
  RotateCcw,
  Palette,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { useCategoryContext } from "../../contexts/CategoryContext";
import {
  DEFAULT_CATEGORY_COLORS,
  type CategoryColorMap,
  categoryToCssVar,
  loadAndApplyCategoryColors,
  saveCategoryColors,
  applyCategoryColors,
} from "../../utils/categoryColors";
import { toast } from "sonner";
import { logger as log } from "../../utils/logger";

// ---------------------------------------------------------------------------
// Curated pastel palette — 48 swatches, 8 hue families × 6 shades
// ---------------------------------------------------------------------------
const PASTEL_PALETTE: string[] = [
  // Pinks/Reds
  "#ffd4d4",
  "#ffb3b3",
  "#f9c8d4",
  "#f7c5d5",
  "#f5d0dc",
  "#f0c8d8",
  // Oranges/Peach
  "#ffe5cc",
  "#ffd5b8",
  "#ffcba4",
  "#f8c8a0",
  "#fddbb4",
  "#f5d8c0",
  // Yellows
  "#fffac0",
  "#fff5a0",
  "#f5f0a8",
  "#faf0c0",
  "#f0e8b0",
  "#f8f0d0",
  // Greens
  "#d0eccc",
  "#c8ecc8",
  "#bae1c3",
  "#b8e8b8",
  "#a8e8b8",
  "#c8f0c8",
  // Teals/Cyans
  "#b8e8e4",
  "#b8e0e8",
  "#b8e8e0",
  "#a8e0d8",
  "#c0e8e8",
  "#c8ecec",
  // Blues
  "#c8daf8",
  "#b8d0f4",
  "#b8c8e8",
  "#b0c8f0",
  "#b8d4f0",
  "#c0d4f4",
  // Purples/Lavenders
  "#e8d0f8",
  "#dcc8f0",
  "#d0b8e8",
  "#d8c0f0",
  "#d4c0f0",
  "#e0c8f8",
  // Neutrals/Beiges
  "#e8e0d0",
  "#e0d4b8",
  "#d4c9a8",
  "#d8d0c0",
  "#c8c0b0",
  "#d0c8b8",
];

interface CategoryColorsViewProps {
  onBack: () => void;
}

export function CategoryColorsView({ onBack }: CategoryColorsViewProps) {
  const { categories } = useCategoryContext();
  const [colors, setColors] = useState<CategoryColorMap>(
    DEFAULT_CATEGORY_COLORS,
  );
  const [original, setOriginal] = useState<CategoryColorMap>(
    DEFAULT_CATEGORY_COLORS,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isDirty = categories.some((cat) => colors[cat.id] !== original[cat.id]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const loaded = await loadAndApplyCategoryColors();
      setColors(loaded);
      setOriginal(loaded);
    } catch (err) {
      log.error("Error loading category colors:", err);
      toast.error("Failed to load category colors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Apply the full color map so dark/no-pastel variants are also updated
  const handleColorChange = (categoryId: string, value: string) => {
    const updated = { ...colors, [categoryId]: value };
    setColors(updated);
    applyCategoryColors(updated);
  };

  const handleHexInput = (categoryId: string, raw: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      handleColorChange(categoryId, raw);
    } else if (/^#[0-9a-fA-F]{0,6}$/.test(raw)) {
      setColors((prev) => ({ ...prev, [categoryId]: raw }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await saveCategoryColors(colors);
      setColors(updated);
      setOriginal(updated);
      toast.success("Category colors saved");
    } catch (err) {
      log.error("Error saving category colors:", err);
      toast.error("Failed to save category colors");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setColors(original);
    applyCategoryColors(original);
    setExpandedId(null);
  };

  const handleResetToDefaults = async () => {
    try {
      setSaving(true);
      const updated = await saveCategoryColors(DEFAULT_CATEGORY_COLORS);
      setColors(updated);
      setOriginal(updated);
      toast.success("Reset to default colors");
    } catch (err) {
      log.error("Error resetting category colors:", err);
      toast.error("Failed to reset category colors");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTemplate
      title="Material Category Colors"
      description="Configure the base color for each category. Dark mode and No-Pastel mode colors are derived automatically."
      onBack={onBack}
      maxWidth="2xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#211f1c] dark:border-white/60 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info banner */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-black/4 dark:bg-white/5 text-[12px] text-black/55 dark:text-white/55">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>
              Pick from the pastel palette by clicking a category row. Dark mode
              and No-Pastel mode variants are derived automatically — no
              separate configuration needed.
            </span>
          </div>

          {/* Color rows */}
          <div className="retro-card">
            {categories.map((cat, i) => {
              const currentColor =
                colors[cat.id] ?? DEFAULT_CATEGORY_COLORS[cat.id] ?? "#d1d5db";
              const defaultColor = DEFAULT_CATEGORY_COLORS[cat.id] ?? "#d1d5db";
              const isChanged = currentColor !== original[cat.id];
              const isOpen = expandedId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={
                    i > 0
                      ? "border-t border-[#211f1c]/8 dark:border-white/8"
                      : ""
                  }
                >
                  {/* Main row — click anywhere to open/close the palette */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : cat.id)}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-black/3 dark:hover:bg-white/3 transition-colors text-left"
                    aria-expanded={isOpen}
                    aria-label={`${cat.name} — click to ${isOpen ? "close" : "open"} color palette`}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-8 h-8 rounded-md border border-[#211f1c]/15 dark:border-white/15 shrink-0 transition-colors duration-100"
                      style={{ backgroundColor: currentColor }}
                    />

                    {/* Category name */}
                    <span className="flex-1 font-sniglet text-[13px] text-left">
                      {cat.name}
                    </span>

                    {/* Hex value */}
                    <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
                      {/^#[0-9a-fA-F]{6}$/.test(currentColor)
                        ? currentColor
                        : "—"}
                    </span>

                    {/* Changed indicator */}
                    {isChanged && (
                      <span className="text-[10px] text-black/35 dark:text-white/35 italic">
                        modified
                      </span>
                    )}

                    {/* Expand chevron */}
                    {isOpen ? (
                      <ChevronUp
                        size={14}
                        className="text-black/40 dark:text-white/40 shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={14}
                        className="text-black/40 dark:text-white/40 shrink-0"
                      />
                    )}
                  </button>

                  {/* Expanded palette */}
                  {isOpen && (
                    <div className="px-5 pb-4 border-t border-[#211f1c]/6 dark:border-white/6 bg-black/2 dark:bg-white/2">
                      {/* Swatch grid */}
                      <div className="grid grid-cols-8 gap-1.5 py-3">
                        {PASTEL_PALETTE.map((swatch) => (
                          <button
                            key={swatch}
                            type="button"
                            onClick={() => handleColorChange(cat.id, swatch)}
                            className={[
                              "w-7 h-7 rounded-md transition-transform hover:scale-110 border-2",
                              currentColor === swatch
                                ? "border-[#211f1c] dark:border-white scale-110"
                                : "border-transparent hover:border-[#211f1c]/30 dark:hover:border-white/30",
                            ].join(" ")}
                            style={{ backgroundColor: swatch }}
                            title={swatch}
                          />
                        ))}
                      </div>

                      {/* Hex input + per-row actions */}
                      <div className="flex items-center gap-3 mt-1">
                        <label className="text-[11px] text-black/45 dark:text-white/45 font-sniglet">
                          Custom hex:
                        </label>
                        <input
                          type="text"
                          value={currentColor}
                          onChange={(e) =>
                            handleHexInput(cat.id, e.target.value)
                          }
                          placeholder="#rrggbb"
                          maxLength={7}
                          className="font-mono text-[12px] px-2 py-1 rounded border border-[#211f1c]/15 dark:border-white/15 bg-transparent w-24 text-center"
                          aria-label={`${cat.name} hex value`}
                        />
                        {isChanged && (
                          <button
                            type="button"
                            onClick={() =>
                              handleColorChange(cat.id, defaultColor)
                            }
                            className="text-[11px] text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live preview */}
          <div className="retro-card p-4 space-y-2">
            <p className="text-[11px] text-black/50 dark:text-white/50 uppercase tracking-wide font-sniglet">
              Live Preview
            </p>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="px-2.5 py-1 rounded-full text-[11px] font-sniglet border border-[#211f1c]/10 dark:border-white/10 transition-colors duration-100"
                  style={{
                    backgroundColor: `var(${categoryToCssVar(cat.id)})`,
                    color: "black",
                  }}
                >
                  {cat.name}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-black/35 dark:text-white/35 italic">
              Uses the live CSS var — reflects dark mode and no-pastel
              overrides.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="retro-btn-primary flex py-2 px-2 items-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Colors"}
            </button>

            {isDirty && (
              <button
                onClick={handleReset}
                disabled={saving}
                className="retro-icon-button flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Discard Changes
              </button>
            )}

            <button
              onClick={handleResetToDefaults}
              disabled={saving}
              className="retro-icon-button flex items-center gap-2 ml-auto text-black/40 dark:text-white/40"
              title="Reset all to factory defaults"
            >
              <Palette size={14} />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
