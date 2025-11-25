# WasteDB Unified Visualization Model (Integrated)

**Core idea:** One renderer for three dimensions—**Recyclability (CR)**, **Compostability (CC)**, **Reusability (RU)**—with the same dot–halo–gap grammar, fed by the dual-scale data layer (scientific 0–1, public 0–100).

## 1. Data Contract (shared across CR/CC/RU)

```ts
// 0–1 normalized inputs from Supabase (KV)
export type VizDatum = {
  metric: "recyclability" | "compostability" | "reusability";
  practicalMean: number; // e.g., 0.37
  theoreticalMean: number; // e.g., 0.57
  practicalCI95: [number, number]; // [lower, upper]
  theoreticalCI95: [number, number];
  confidenceLevel: "High" | "Medium" | "Low";
  name?: string; // material label (optional, for ARIA)
};
```

**Renderer-derived values:**

```ts
const gap = Math.abs(d.theoreticalMean - d.practicalMean); // 0–1
const overlap =
  d.practicalCI95[1] >= d.theoreticalCI95[0] &&
  d.theoreticalCI95[1] >= d.practicalCI95[0];

type Mode = "overlap" | "near-overlap" | "gap";
const mode: Mode = overlap ? "overlap" : gap < 0.1 ? "near-overlap" : "gap";
```

## 2. Color & Accessibility Tokens

Centralize theme in CSS variables so React code stays lean and WCAG variants are toggled via data attributes or `<html>` classes. Values mirror your spec exactly.

```css
/* Base (Normal Mode) */
:root {
  /* Main visualization */
  --halo-theoretical: rgba(0, 102, 204, 0.3); /* Light Blue */
  --halo-practical: rgba(160, 160, 160, 0.4); /* Gray */
  --dots-overlap: #2d5a87; /* Navy Blue */
  --gap-left: #a0a0a0; /* Medium Gray */
  --gap-right: #0066cc; /* Bright Blue */

  /* Score bars (dimension-specific, Pastel) */
  --bar-recyc: #e4e3ac; /* Pale Yellow */
  --bar-comp: #e6beb5; /* Soft Coral Beige */
  --bar-reuse: #b8c8cb; /* Dusty Blue-Gray */

  /* High-contrast bar overrides */
  --bar-recyc-hc: #d4b400; /* Golden Yellow */
  --bar-comp-hc: #c74444; /* Brick Red */
  --bar-reuse-hc: #4a90a4; /* Steel Blue */

  /* Strokes, axis, text */
  --axis-line: rgba(34, 34, 34, 0.3);
  --tick: rgba(34, 34, 34, 0.4);
  --text: #000000;
  --bar-stroke: #211f1c; /* Dark Brown */
  --tooltip-bg: #ffffff;
  --tooltip-border: #211f1c80; /* 1.5px in component */
}

/* High Contrast Mode */
[data-contrast="high"] {
  --halo-theoretical: rgba(51, 51, 102, 0.6); /* Dark Purple */
  --halo-practical: rgba(102, 102, 102, 0.7); /* Dark Gray */
  --dots-overlap: #000000; /* Black */
  --gap-pattern: #666666; /* for checkerboard fill */
}

/* Dark Mode */
[data-theme="dark"] {
  --text: #ffffff;
  --bar-stroke: rgba(255, 255, 255, 0.2);
  --tooltip-bg: #2a2825; /* Charcoal Brown */
  --tooltip-border: rgba(255, 255, 255, 0.2);
  /* Axis and ticks remain same opacity by spec */
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .viz-dot-entrance {
    transition: none !important;
  }
  .viz-halo {
    transition: none !important;
  }
}
```

> **Note:** If you’d like distinct compostability/reusability **halo hues** later, you can introduce per-metric tokens (e.g., `--halo-theoretical-cc`, `--halo-practical-ru`) without touching component logic. For now, we use your unified blue/gray scheme.

## 3. Opacity States (exact to spec)

```ts
const opacityByMode = {
  overlap: {
    practical: { default: 0.3, hover: 0.6 },
    theoretical: { default: 0.25, hover: 0.5 },
  },
  "near-overlap": {
    practical: { default: 0.4, hover: 0.7 },
    theoretical: { default: 0.3, hover: 0.6 },
  },
  gap: {
    practical: { default: 0.5, hover: 0.8 },
    theoretical: { default: 0.4, hover: 0.7 },
  },
} as const;
```

## 4. React Component API

A single component, **`<SustainabilityViz />`**, renders CR/CC/RU with the same grammar. It accepts flags for accessibility modes, but you can also set them globally with `data-` attributes on `<html>`.

```tsx
import * as React from "react";

type Props = {
  data: VizDatum;
  width?: number;
  height?: number;
  showAxis?: boolean;
  reducedMotion?: boolean; // optional override
  className?: string;
  id?: string;
};

export function SustainabilityViz({
  data,
  width = 640,
  height = 120,
  showAxis = true,
  reducedMotion,
  className,
  id,
}: Props) {
  const mode: Mode = computeMode(data);
  const op = opacityByMode[mode];

  // accessibility: respect prefers-reduced-motion unless explicitly overridden
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const rm = reducedMotion ?? prefersReduced;

  return (
    <figure
      aria-label={`${labelForMetric(data.metric)} for ${
        data.name ?? "material"
      }`}
      role="group"
      className={className}
      id={id}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden={false}
      >
        {/* Axis */}
        {showAxis && <Axis width={width} height={height} />}

        {/* Halos */}
        <Halo
          ci={data.practicalCI95}
          color="var(--halo-practical)"
          opacityDefault={op.practical.default}
          opacityHover={op.practical.hover}
          rm={rm}
          label="Practical confidence interval"
        />
        <Halo
          ci={data.theoreticalCI95}
          color="var(--halo-theoretical)"
          opacityDefault={op.theoretical.default}
          opacityHover={op.theoretical.hover}
          rm={rm}
          label="Theoretical confidence interval"
        />

        {/* Gap Zone */}
        {!overlaps(data) && (
          <GapZone
            from={data.practicalCI95[1]}
            to={data.theoreticalCI95[0]}
            gradientLeft="var(--gap-left)"
            gradientRight="var(--gap-right)"
            patternHC="var(--gap-pattern)" /* used only in high-contrast */
          />
        )}

        {/* Quantile Dots */}
        <QuantileDots
          data={data}
          mode={mode}
          color="var(--dots-overlap)"
          rm={rm}
          dotCount={dotCountForViewport(width)}
        />

        {/* Connectors + Labels */}
        <ConnectorLabel data={data} mode={mode} />
      </svg>

      <figcaption className="sr-only">
        {captionForScreenReaders(data)}
      </figcaption>
    </figure>
  );
}
```

> **Implementation notes**
>
> - Use shadcn/ui for surrounding cards/tooltips; inside the SVG, keep focusable elements (`tabindex="0"`) for keyboard hover equivalents.
> - Tooltips should read the full string:
>   `Practical: 37 ± 3 %; Theoretical: 57 ± 2 %; Gap: 20 pts; Confidence: High.`
> - For high contrast, add `[data-contrast="high"]` to `<html>` via a user setting (store in Supabase profile + localStorage).

## 5. Tooltip & Interaction (shadcn/ui)

Use `Tooltip` for consistent a11y:

```tsx
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function DotWithTooltip({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <circle
            cx={x}
            cy={y}
            r={4}
            fill="var(--dots-overlap)"
            stroke="var(--text)"
            strokeWidth={0.5}
            tabIndex={0}
          />
        </TooltipTrigger>
        <TooltipContent
          className="rounded-xl bg-[var(--tooltip-bg)] border"
          style={{ borderColor: "var(--tooltip-border)", borderWidth: 1.5 }}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

## 6. Score Bars (dimension-specific)

These are your pastel vs high-contrast bars, independent of the halo/dot grammar. They should switch tokens by mode:

```tsx
function barColor(metric: VizDatum["metric"], isHighContrast: boolean) {
  if (metric === "recyclability")
    return `var(${isHighContrast ? "--bar-recyc-hc" : "--bar-recyc"})`;
  if (metric === "compostability")
    return `var(${isHighContrast ? "--bar-comp-hc" : "--bar-comp"})`;
  return `var(${isHighContrast ? "--bar-reuse-hc" : "--bar-reuse"})`;
}
```

Use `stroke: var(--bar-stroke)` and swap with dark-mode tokens automatically via `[data-theme="dark"]`.

## 7. Motion & Reduced Motion

- **Normal**: dot entrance `opacity/scale` stagger ≤ 300 ms total; halo crossfades ~500 ms.
- **Reduced Motion**: instant appearance (`opacity: 0.85; scale: 1`), no transitions.

```ts
const DOT_MS = rm ? 0 : 300;
const HALO_MS = rm ? 0 : 500;
```

## 8. Axis & Scaling

- Public axis: **0–100** (multiply normalized values by 100).
- Internally compute positions in 0–1, then map to SVG width.
- Ticks every 10 units; same colors in dark and light mode per spec.

```ts
function xScale(width: number, v01: number) {
  return Math.round(16 + v01 * (width - 32));
} // 16px padding
```

## 9. Supabase & Edge integration

- **Fetch**: `select practicalMean, theoreticalMean, practicalCI95, theoreticalCI95, confidenceLevel, method_version, calculation_timestamp` from KV-backed view.
- **Versioning**: include `whitepaper_version` and `method_version` in tooltip footers on “Advanced view.”
- **Auth/roles**: Admins toggle “show parameter detail” (Y, D, C, M, E) via a prop; public mode hides it.
- **Offline**: cache material viz payloads in `localStorage` keyed by `material_id@method_version@calculation_timestamp`.

## 10) ARIA & Text Equivalents

- Container `role="group"` with `aria-label` like:
  “Recyclability visualization for PET bottle.”
- Each interactive region (halos, gap) gets `aria-label`:

  - Practical CI range: “Practical 95% CI: 34–40%.”
  - Theoretical CI range: “Theoretical 95% CI: 55–59%.”
  - Gap zone (if present): “Unrealized potential: 15–21 points.”

- High-contrast: no color-only meaning—gap area adds pattern (checkerboard using `--gap-pattern`).

## 10. ARIA & Text Equivalents

- **Overlap**: dense dots across intersection; faint halos; label “Shared range: x–y%.”
- **Near-overlap**: dots bridge means; halos softly merged; label “Minor difference…”
- **Gap**: separate halos + neutral gap (or checkerboard in HC); connector line with “Gap = {pts}”.

---

### TL;DR for the dev team

- **One component, three metrics**, share logic; theming via CSS variables.
- **Exact color/opacity** now matches the spec you provided (normal, high-contrast, dark, reduced motion).
- **A11y-first**: all states keyboardable, ARIA-rich, WCAG-compliant.
- **Infra-aligned**: slots neatly into our Supabase KV + Edge + shadcn/ui setup with local caching.
