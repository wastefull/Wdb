import { useMemo, useState } from "react";
import {
  DataEditor,
  GridCell,
  GridCellKind,
  GridColumn,
  Item,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import { Material } from "../../types/material";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface GlideStaticTableProps {
  materials: Material[];
  editingId: string | null;
  editData: Partial<Material>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<Material>>>;
  categoryOptions: string[];
  isAdmin: boolean;
  onViewMaterial: (materialId: string) => void;
  onEditMaterial: (material: Material) => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteMaterial: (materialId: string) => void;
}

function buildTextCell(
  value: string,
  options?: { readonly?: boolean; style?: "normal" | "faded" },
): GridCell {
  return {
    kind: GridCellKind.Text,
    data: value,
    displayData: value,
    readonly: options?.readonly ?? true,
    allowOverlay: !(options?.readonly ?? true),
    style: options?.style ?? "normal",
  };
}

export function GlideStaticTable({
  materials,
  editingId,
  editData,
  setEditData,
  categoryOptions,
  isAdmin,
  onViewMaterial,
  onEditMaterial,
  onSave,
  onCancel,
  onDeleteMaterial,
}: GlideStaticTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  const columns: GridColumn[] = useMemo(() => {
    const base: GridColumn[] = [
      { id: "name", title: "Name", width: 260 },
      { id: "category", title: "Category", width: 180 },
      { id: "description", title: "Description", width: 420 },
    ];

    if (!isAdmin) return base;

    return [
      ...base,
      { id: "editSave", title: "Edit / Save", width: 120 },
      { id: "deleteCancel", title: "Delete / Cancel", width: 130 },
    ];
  }, [isAdmin]);

  const getCellContent = ([col, row]: Item): GridCell => {
    const material = materials[row];
    if (!material) return buildTextCell("");

    const isEditing = editingId === material.id;

    const nameValue = isEditing
      ? (editData.name ?? material.name)
      : material.name;
    const categoryValue = isEditing
      ? (editData.category ?? material.category)
      : material.category;
    const descriptionValue = isEditing
      ? (editData.description ?? material.description ?? "-")
      : material.description || "-";

    if (col === 0) {
      return buildTextCell(nameValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (col === 1) {
      return buildTextCell(categoryValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (col === 2) {
      return buildTextCell(descriptionValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (isAdmin && col === 3) {
      return buildTextCell(isEditing ? "Save" : "Edit", {
        style: "faded",
      });
    }

    if (isAdmin && col === 4) {
      return buildTextCell(isEditing ? "Cancel" : "Delete", {
        style: "faded",
      });
    }

    return buildTextCell("");
  };

  const handleCellEdited = ([col, row]: Item, newValue: GridCell) => {
    if (!isAdmin) return;
    const material = materials[row];
    if (!material || editingId !== material.id) return;
    if (newValue.kind !== GridCellKind.Text) return;

    const value = newValue.data.trim();

    if (col === 0) {
      setEditData((prev) => ({ ...prev, name: value }));
      return;
    }

    if (col === 1) {
      const normalizedCategory =
        categoryOptions.find((option) => option === value) || value;
      setEditData((prev) => ({
        ...prev,
        category: normalizedCategory as Material["category"],
      }));
      return;
    }

    if (col === 2) {
      setEditData((prev) => ({ ...prev, description: value }));
    }
  };

  const handleCellClicked = ([col, row]: Item) => {
    const material = materials[row];
    if (!material) return;

    const isEditing = editingId === material.id;

    if (col === 0 && !isEditing) {
      onViewMaterial(material.id);
      return;
    }

    if (!isAdmin) return;

    if (col === 3) {
      if (isEditing) {
        onSave();
      } else {
        onEditMaterial(material);
      }
      return;
    }

    if (col === 4) {
      if (isEditing) {
        onCancel();
      } else {
        setDeleteTarget(material);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden">
      <div className="overflow-hidden">
        <DataEditor
          columns={columns}
          rows={materials.length}
          getCellContent={getCellContent}
          onCellEdited={handleCellEdited}
          onCellClicked={handleCellClicked}
          rowHeight={34}
          headerHeight={36}
          width="100%"
          height={Math.max(300, Math.min(700, materials.length * 34 + 80))}
          smoothScrollX
          smoothScrollY
          verticalBorder
          rowMarkers="none"
        />
      </div>

      {materials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[16px] text-black/50 dark:text-white/50">
            No materials in database yet.
          </p>
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="normal">
              Delete Material?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/70 dark:text-white/70">
              Are you sure you want to delete "{deleteTarget?.name}"? This will
              permanently remove the material and all its associated articles.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-waste-reuse border-[#211f1c] dark:border-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                onDeleteMaterial(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="bg-waste-compost text-black border-[1.5px] border-[#211f1c] dark:border-white/20 hover:bg-waste-compost/80"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
