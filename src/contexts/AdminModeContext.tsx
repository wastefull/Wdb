/**
 * Admin Mode Context
 *
 * Tracks whether an authenticated admin has toggled "admin mode" on, which
 * reveals admin-only affordances (edit/delete controls, admin dashboards,
 * etc.) throughout the app. This was previously bundled into
 * AccessibilityContext even though it has nothing to do with accessibility -
 * it's a curator/admin workflow preference. Extracted into its own context
 * so accessibility tooling can be removed/rebuilt independently.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "./AuthContext";

interface AdminModeContextType {
  /** True only when the user is signed in, has the admin role, AND has toggled admin mode on. */
  isActive: boolean;
  /** Raw toggle state, regardless of auth/role (mirrors isActive for admins). */
  isToggledOn: boolean;
  toggle: () => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "wastedb-admin-mode";

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const { user, userRole, isAuthenticated } = useAuthContext();
  const [isToggledOn, setIsToggledOn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  // Auto-disable when the user is no longer authenticated (sign out, session expiry, etc.)
  useEffect(() => {
    if (!isAuthenticated && isToggledOn) {
      setIsToggledOn(false);
    }
  }, [isAuthenticated, isToggledOn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isToggledOn));
  }, [isToggledOn]);

  const toggle = () => setIsToggledOn((prev) => !prev);

  const isActive = !!(user && userRole === "admin" && isToggledOn);

  return (
    <AdminModeContext.Provider value={{ isActive, isToggledOn, toggle }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within AdminModeProvider");
  }
  return context;
}
