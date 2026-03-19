import { useState, useEffect } from "react";
import { Save, RotateCcw, Shield, Lock } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import {
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS,
  Permission,
} from "../../types/permissions";
import * as api from "../../utils/api";
import { toast } from "sonner";
import { logger as log } from "../../utils/logger";

interface RolePermissionsViewProps {
  onBack: () => void;
}

const EDITABLE_ROLES = ["user", "staff"] as const;
const ALL_ROLES = ["user", "staff", "admin"] as const;

export function RolePermissionsView({ onBack }: RolePermissionsViewProps) {
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.getRolePermissions();
      setPermissions(data.permissions);
      setDirty(false);
    } catch (error) {
      log.error("Error loading permissions:", error);
      toast.error("Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (role: string, permission: string) => {
    if (role === "admin") return; // Admin is always all permissions

    setPermissions((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];
      return { ...prev, [role]: updated };
    });
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      for (const role of EDITABLE_ROLES) {
        await api.updateRolePermissions(role, permissions[role] || []);
      }
      toast.success("Role permissions updated");
      setDirty(false);
    } catch (error) {
      log.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPermissions((prev) => ({
      ...prev,
      user: [...(DEFAULT_ROLE_PERMISSIONS.user || [])],
      staff: [...(DEFAULT_ROLE_PERMISSIONS.staff || [])],
    }));
    setDirty(true);
  };

  const hasPermission = (role: string, permission: string) => {
    if (role === "admin") return true;
    return (permissions[role] || []).includes(permission);
  };

  if (loading) {
    return (
      <PageTemplate title="Role Permissions" onBack={onBack}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse normal text-[14px]">
            Loading permissions...
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Role Permissions" onBack={onBack}>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] normal opacity-70">
            Configure what each role can do. Admin always has full access.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="retro-btn flex items-center gap-1.5 text-[12px] px-3 py-1.5"
              disabled={saving}
            >
              <RotateCcw size={13} />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="retro-btn-primary flex items-center gap-1.5 text-[12px] px-3 py-1.5 disabled:opacity-50"
            >
              <Save size={13} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Permissions grid */}
        <div className="border border-[#211f1c]/10 dark:border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#211f1c]/5 dark:bg-white/5">
                <th className="text-left text-[12px] font-sniglet normal px-4 py-3 w-[45%]">
                  Permission
                </th>
                {ALL_ROLES.map((role) => (
                  <th
                    key={role}
                    className="text-center text-[12px] font-sniglet normal px-4 py-3"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {role === "admin" && <Shield size={12} />}
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                      {role === "admin" && (
                        <Lock size={10} className="opacity-50" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_CATEGORIES.map((category) => (
                <>
                  {/* Category header row */}
                  <tr
                    key={`cat-${category.label}`}
                    className="bg-[#211f1c]/3 dark:bg-white/3"
                  >
                    <td
                      colSpan={ALL_ROLES.length + 1}
                      className="px-4 py-2 text-[11px] font-bold normal uppercase tracking-wider opacity-60"
                    >
                      {category.label}
                    </td>
                  </tr>

                  {/* Permission rows */}
                  {category.permissions.map((permission) => (
                    <tr
                      key={permission}
                      className="border-t border-[#211f1c]/5 dark:border-white/5 hover:bg-[#211f1c]/2 dark:hover:bg-white/2 transition-colors"
                    >
                      <td className="px-4 py-2.5 pl-8">
                        <div>
                          <span className="text-[13px] normal">
                            {PERMISSIONS[permission as Permission]}
                          </span>
                          <span className="text-[11px] normal opacity-40 ml-2">
                            {permission}
                          </span>
                        </div>
                      </td>
                      {ALL_ROLES.map((role) => (
                        <td key={role} className="text-center px-4 py-2.5">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasPermission(role, permission)}
                              onChange={() =>
                                togglePermission(role, permission)
                              }
                              disabled={role === "admin"}
                              className={`
                                w-4 h-4 rounded border-2 transition-colors
                                ${
                                  role === "admin"
                                    ? "border-waste-science/40 bg-waste-science/20 text-waste-science cursor-not-allowed accent-waste-science"
                                    : "border-[#211f1c]/20 dark:border-white/20 accent-waste-recycle cursor-pointer"
                                }
                              `}
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] normal opacity-50">
          <div className="flex items-center gap-1.5">
            <Shield size={11} />
            <span>Admin always has all permissions (cannot be modified)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 border border-[#211f1c]/20 dark:border-white/20 rounded" />
            <span>
              &quot;Own&quot; = only content the user created; &quot;Any&quot; =
              all content regardless of author
            </span>
          </div>
        </div>

        {/* Unsaved changes warning */}
        {dirty && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg px-4 py-3 text-[12px] text-amber-800 dark:text-amber-200">
            You have unsaved changes. Click &quot;Save Changes&quot; to apply.
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
