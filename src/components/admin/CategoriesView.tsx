import { useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { MaterialCategoryDef } from "../../types/material";
import { useCategoryContext } from "../../contexts/CategoryContext";
import { apiCall } from "../../utils/api";
import { toast } from "sonner";
import { logger as log } from "../../utils/logger";

interface CategoriesViewProps {
  onBack: () => void;
}

interface DeleteConfirmState {
  category: MaterialCategoryDef;
  affectedCount: number | null;
}

export function CategoriesView({ onBack }: CategoriesViewProps) {
  const { refetch } = useCategoryContext();

  // All categories (including deleted) are fetched directly so the admin
  // can see the full list including soft-deleted entries.
  const [allCategories, setAllCategories] = useState<MaterialCategoryDef[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);

  // UI state
  const [newName, setNewName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoadingAll(true);
      setLoadError(false);
      const data = await apiCall("/settings/categories/all");
      setAllCategories(data.categories ?? []);
    } catch (err) {
      log.error("Error fetching all categories:", err);
      setLoadError(true);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  // Load on mount
  useState(() => {
    fetchAll();
  });

  const active = allCategories.filter((c) => !c.deleted);
  const deleted = allCategories.filter((c) => c.deleted);

  // ── Create ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      setSavingNew(true);
      await apiCall("/settings/categories", {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });
      setNewName("");
      setAddingNew(false);
      toast.success(`Category "${trimmed}" created`);
      await fetchAll();
      await refetch();
    } catch (err: any) {
      log.error("Error creating category:", err);
      toast.error(err?.message ?? "Failed to create category");
    } finally {
      setSavingNew(false);
    }
  };

  // ── Rename ───────────────────────────────────────────────────────────────

  const startEdit = (cat: MaterialCategoryDef) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleRename = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      setSavingEdit(true);
      await apiCall(`/settings/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
      });
      setEditingId(null);
      toast.success("Category renamed");
      await fetchAll();
      await refetch();
    } catch (err: any) {
      log.error("Error renaming category:", err);
      toast.error(err?.message ?? "Failed to rename category");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const initiateDelete = async (cat: MaterialCategoryDef) => {
    // Fetch affected material count before showing confirm dialog
    setDeleteConfirm({ category: cat, affectedCount: null });
    try {
      const data = await apiCall(`/settings/categories/${cat.id}`, {
        method: "DELETE",
      });
      // If dry-run returns affected count, use it; otherwise we got a real delete
      // (backend soft-deletes immediately and returns affectedMaterials)
      await fetchAll();
      await refetch();
      setDeleteConfirm(null);
      toast.success(
        `"${cat.name}" removed${data.affectedMaterials ? ` (${data.affectedMaterials} material${data.affectedMaterials !== 1 ? "s" : ""} affected)` : ""}`,
      );
    } catch (err: any) {
      log.error("Error deleting category:", err);
      setDeleteConfirm(null);
      toast.error(err?.message ?? "Failed to delete category");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      await apiCall(`/settings/categories/${deleteConfirm.category.id}`, {
        method: "DELETE",
      });
      toast.success(`"${deleteConfirm.category.name}" deleted`);
      setDeleteConfirm(null);
      await fetchAll();
      await refetch();
    } catch (err: any) {
      log.error("Error deleting category:", err);
      toast.error(err?.message ?? "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  // ── Restore ──────────────────────────────────────────────────────────────

  const handleRestore = async (cat: MaterialCategoryDef) => {
    try {
      setRestoring(cat.id);
      await apiCall(`/settings/categories/${cat.id}/restore`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(`"${cat.name}" restored`);
      await fetchAll();
      await refetch();
    } catch (err: any) {
      log.error("Error restoring category:", err);
      toast.error(err?.message ?? "Failed to restore category");
    } finally {
      setRestoring(null);
    }
  };

  // ── Migration ────────────────────────────────────────────────────────────

  const handleMigrate = async () => {
    try {
      setMigrating(true);
      const data = await apiCall("/settings/categories/migrate-materials", {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(
        `Migration complete — ${data.updated} updated, ${data.skipped} skipped`,
      );
    } catch (err: any) {
      log.error("Error migrating materials:", err);
      toast.error("Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <PageTemplate
      title="Material Categories"
      description="Manage the list of material categories used across the database. Changes broadcast to all active sessions instantly."
      onBack={onBack}
      maxWidth="2xl"
    >
      {loadingAll ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#211f1c] dark:border-white/60 border-t-transparent" />
        </div>
      ) : loadError ? (
        <div className="retro-card p-6 text-center space-y-3">
          <AlertTriangle size={24} className="mx-auto text-amber-500" />
          <p className="text-[13px] text-black/70 dark:text-white/70">
            Failed to load categories. Check your connection and try again.
          </p>
          <button onClick={fetchAll} className="retro-icon-button">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active categories */}
          <div className="retro-card divide-y divide-[#211f1c]/8 dark:divide-white/8">
            {active.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3">
                <Tag
                  size={14}
                  className="text-black/40 dark:text-white/40 shrink-0"
                />

                {editingId === cat.id ? (
                  /* Inline rename */
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(cat.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="input-field py-1 text-[13px] flex-1 min-w-0"
                      aria-label="New category name"
                    />
                    <button
                      onClick={() => handleRename(cat.id)}
                      disabled={savingEdit || !editName.trim()}
                      className="retro-icon-button p-1.5"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      className="retro-icon-button p-1.5"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 font-sniglet text-[13px]">
                      {cat.name}
                    </span>
                    <span className="font-mono text-[10px] text-black/30 dark:text-white/30 shrink-0">
                      {cat.id}
                    </span>
                    <button
                      onClick={() => startEdit(cat)}
                      className="retro-icon-button p-1.5"
                      title="Rename"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => initiateDelete(cat)}
                      className="retro-icon-button p-1.5 text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Add new row */}
            {addingNew ? (
              <div className="flex items-center gap-2 px-5 py-3">
                <Tag
                  size={14}
                  className="text-black/40 dark:text-white/40 shrink-0"
                />
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") {
                      setAddingNew(false);
                      setNewName("");
                    }
                  }}
                  placeholder="New category name…"
                  className="input-field py-1 text-[13px] flex-1 min-w-0"
                />
                <button
                  onClick={handleCreate}
                  disabled={savingNew || !newName.trim()}
                  className="retro-icon-button p-1.5"
                  title="Create"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setAddingNew(false);
                    setNewName("");
                  }}
                  disabled={savingNew}
                  className="retro-icon-button p-1.5"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="px-5 py-3">
                <button
                  onClick={() => setAddingNew(true)}
                  className="retro-icon-button flex items-center gap-2 text-[12px]"
                >
                  <Plus size={14} />
                  Add Category
                </button>
              </div>
            )}
          </div>

          {/* Deleted categories */}
          {deleted.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-black/40 dark:text-white/40 uppercase tracking-wide font-sniglet px-1">
                Deleted Categories
              </p>
              <div className="retro-card divide-y divide-[#211f1c]/8 dark:divide-white/8 opacity-60">
                {deleted.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Tag
                      size={14}
                      className="text-black/30 dark:text-white/30 shrink-0"
                    />
                    <span className="flex-1 font-sniglet text-[13px] line-through text-black/50 dark:text-white/50">
                      {cat.name}
                    </span>
                    <span className="font-mono text-[10px] text-black/20 dark:text-white/20 shrink-0">
                      {cat.id}
                    </span>
                    <button
                      onClick={() => handleRestore(cat)}
                      disabled={restoring === cat.id}
                      className="retro-icon-button p-1.5"
                      title="Restore"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Migration tool */}
          <div className="retro-card p-4 space-y-2">
            <p className="text-[12px] font-sniglet">Material Migration</p>
            <p className="text-[11px] text-black/50 dark:text-white/50">
              Populate the stable{" "}
              <code className="font-mono text-[10px]">categoryId</code> field on
              all existing material records. Run this once after the initial
              deploy, and again after any renames to ensure filters work
              correctly for legacy materials.
            </p>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="retro-icon-button flex items-center gap-2 text-[12px]"
            >
              {migrating ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border border-[#211f1c]/40 dark:border-white/40 border-t-transparent" />
              ) : (
                <RotateCcw size={13} />
              )}
              {migrating ? "Migrating…" : "Run Migration"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="retro-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <div>
                <p className="text-[14px] font-sniglet">
                  Delete "{deleteConfirm.category.name}"?
                </p>
                {deleteConfirm.affectedCount !== null &&
                  deleteConfirm.affectedCount > 0 && (
                    <p className="text-[12px] text-black/60 dark:text-white/60 mt-1">
                      {deleteConfirm.affectedCount} material
                      {deleteConfirm.affectedCount !== 1 ? "s" : ""} currently
                      use this category. They will appear as uncategorized until
                      reassigned or the category is restored.
                    </p>
                  )}
                <p className="text-[12px] text-black/50 dark:text-white/50 mt-1">
                  This is a soft delete — you can restore it later.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="retro-icon-button flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="retro-btn-primary flex-1 !bg-red-500 !border-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
