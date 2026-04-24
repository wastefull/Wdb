import type { ReactNode } from "react";
import type { ViewType } from "../../contexts/NavigationContext";

/** Narrow the ViewType union to the variant matching discriminant T. */
export type ViewByType<T extends ViewType["type"]> = Extract<
  ViewType,
  { type: T }
>;

/** Typed renderer for a specific view — receives the narrowed view object. */
export type ViewRenderer<T extends ViewType["type"] = ViewType["type"]> = (
  view: ViewByType<T>,
) => ReactNode;

/** Partial map from each view type to its typed renderer. */
export type ViewRendererMap = {
  [K in ViewType["type"]]?: ViewRenderer<K>;
};

interface ViewConfigurationProps {
  currentView: ViewType;
  views: ViewRendererMap;
  fallback?: ReactNode;
}

export function ViewConfiguration({
  currentView,
  views,
  fallback = null,
}: ViewConfigurationProps): ReactNode {
  const renderer = views[currentView.type];
  if (!renderer) return fallback;
  // Single cast required by TypeScript's correlated-union limitation;
  // all individual call-site renderers are fully typed via ViewRendererMap.
  return (renderer as (v: ViewType) => ReactNode)(currentView);
}
