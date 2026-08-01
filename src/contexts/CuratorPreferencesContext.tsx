/**
 * Curator Preferences Context
 *
 * Holds curator/staff workflow preferences that are unrelated to
 * accessibility (previously bundled into AccessibilityContext).
 * Currently just `prioritizeOA` (prefer Open Access sources during
 * evidence curation) - a stub with no consuming search/filter logic yet.
 */
import React, { createContext, useContext, useEffect, useState } from "react";

interface CuratorPreferencesContextType {
  prioritizeOA: boolean;
  togglePrioritizeOA: () => void;
}

const CuratorPreferencesContext = createContext<
  CuratorPreferencesContextType | undefined
>(undefined);

const STORAGE_KEY = "wastedb-curator-prefs";

export function CuratorPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prioritizeOA, setPrioritizeOA] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(prioritizeOA));
  }, [prioritizeOA]);

  const togglePrioritizeOA = () => setPrioritizeOA((prev) => !prev);

  return (
    <CuratorPreferencesContext.Provider
      value={{ prioritizeOA, togglePrioritizeOA }}
    >
      {children}
    </CuratorPreferencesContext.Provider>
  );
}

export function useCuratorPreferences() {
  const context = useContext(CuratorPreferencesContext);
  if (!context) {
    throw new Error(
      "useCuratorPreferences must be used within CuratorPreferencesProvider",
    );
  }
  return context;
}
