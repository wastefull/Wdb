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

  const parseCommaSeparated = (value: string): string[] =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(
        (entry, idx, arr) => entry.length > 0 && arr.indexOf(entry) === idx,
      );

  const materialByNameLower = useMemo(() => {
    const lookup = new Map<string, Material>();
    for (const material of materials) {
      lookup.set(material.name.toLowerCase(), material);
    }
    return lookup;
  }, [materials]);

  const materialNameById = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const material of materials) {
      lookup.set(material.id, material.name);
    }
    return lookup;
  }, [materials]);

  const columns: GridColumn[] = useMemo(() => {
    const base: GridColumn[] = [
      { id: "viewAction", title: "View", width: 92 },
      { id: "name", title: "Name", width: 180 },
      { id: "aliases", title: "Aliases", width: 130 },
      { id: "category", title: "Category", width: 160 },
      { id: "description", title: "Description", width: 160 },
      { id: "isHub", title: "Hub", width: 50 },
      { id: "linkedMaterials", title: "Linked Materials", width: 200 },
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
    const columnId = String(columns[col]?.id || "");

    const isEditing = editingId === material.id;

    const nameValue = isEditing
      ? (editData.name ?? material.name)
      : material.name;
    const aliasesValue = isEditing
      ? Array.isArray(editData.aliases)
        ? editData.aliases.join(", ")
        : typeof editData.aliases === "string"
          ? editData.aliases
          : (material.aliases || []).join(", ")
      : (material.aliases || []).join(", ");
    const categoryValue = isEditing
      ? (editData.category ?? material.category)
      : material.category;
    const descriptionValue = isEditing
      ? (editData.description ?? material.description ?? "-")
      : material.description || "-";
    const isHubValue = isEditing
      ? (editData.isHub ?? material.isHub ?? material.category === "Elements")
      : (material.isHub ?? material.category === "Elements");
    const linkedMaterialsValue = isEditing
      ? Array.isArray(editData.linkedMaterialIds)
        ? editData.linkedMaterialIds
            .map((id) => materialNameById.get(id) || id)
            .join(", ")
        : (material.linkedMaterialIds || [])
            .map((id) => materialNameById.get(id) || id)
            .join(", ")
      : (material.linkedMaterialIds || [])
          .map((id) => materialNameById.get(id) || id)
          .join(", ");

    if (columnId === "viewAction") {
      return buildTextCell("👁 View", {
        style: "faded",
      });
    }

    if (columnId === "name") {
      return buildTextCell(nameValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (columnId === "aliases") {
      return buildTextCell(aliasesValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (columnId === "category") {
      return buildTextCell(categoryValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (columnId === "description") {
      return buildTextCell(descriptionValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (columnId === "isHub") {
      return buildTextCell(isHubValue ? "Yes" : "No", {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (columnId === "linkedMaterials") {
      return buildTextCell(linkedMaterialsValue, {
        readonly: !(isAdmin && isEditing),
      });
    }

    if (isAdmin && columnId === "editSave") {
      return buildTextCell(isEditing ? "💾 Save" : "✏ Edit", {
        style: "faded",
      });
    }

    if (isAdmin && columnId === "deleteCancel") {
      return buildTextCell(isEditing ? "✖ Cancel" : "🗑 Delete", {
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
    const columnId = String(columns[col]?.id || "");

    const value = newValue.data.trim();

    if (columnId === "name") {
      setEditData((prev) => ({ ...prev, name: value }));
      return;
    }

    if (columnId === "aliases") {
      setEditData((prev) => ({
        ...prev,
        aliases: parseCommaSeparated(value),
      }));
      return;
    }

    if (columnId === "category") {
      const normalizedCategory =
        categoryOptions.find((option) => option === value) || value;
      setEditData((prev) => ({
        ...prev,
        category: normalizedCategory as Material["category"],
      }));
      return;
    }

    if (columnId === "description") {
      setEditData((prev) => ({ ...prev, description: value }));
      return;
    }

    if (columnId === "isHub") {
      const normalized = value.toLowerCase();
      const yesValues = ["yes", "true", "1", "hub", "y"];
      const noValues = ["no", "false", "0", "none", "n"];

      if (yesValues.includes(normalized)) {
        setEditData((prev) => ({ ...prev, isHub: true }));
        return;
      }

      if (noValues.includes(normalized)) {
        setEditData((prev) => ({ ...prev, isHub: false }));
      }
      return;
    }

    if (columnId === "linkedMaterials") {
      const linkedIds = parseCommaSeparated(value)
        .map((entry) => materialByNameLower.get(entry.toLowerCase())?.id || "")
        .filter((id, idx, arr) => id.length > 0 && arr.indexOf(id) === idx)
        .filter((id) => id !== material.id);

      setEditData((prev) => ({ ...prev, linkedMaterialIds: linkedIds }));
    }
  };

  const handleCellClicked = ([col, row]: Item) => {
    const material = materials[row];
    if (!material) return;
    const columnId = String(columns[col]?.id || "");

    const isEditing = editingId === material.id;

    if (columnId === "viewAction") {
      onViewMaterial(material.id);
      return;
    }

    if (!isAdmin) return;

    if (columnId === "editSave") {
      if (isEditing) {
        onSave();
      } else {
        onEditMaterial(material);
      }
      return;
    }

    if (columnId === "deleteCancel") {
      if (isEditing) {
        onCancel();
      } else {
        setDeleteTarget(material);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#2a2825] rounded-(--retro-rounding) border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden">
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
