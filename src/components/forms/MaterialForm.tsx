import { useState, useRef } from "react";
import {
  Material,
  MATERIAL_CATEGORIES,
  MaterialCategory,
} from "../../types/material";
import { UserSelector } from "./UserSelector";
import { DiscardChangesDialog } from "../shared/DiscardChangesDialog";

export interface MaterialFormProps {
  material?: Material;
  onSave: (
    material: Omit<Material, "id">,
    options?: { onBehalfOf?: string },
  ) => void;
  onCancel: () => void;
  /** Whether admin mode is active (shows UserSelector) */
  isAdminMode?: boolean;
}

export function MaterialForm({
  material,
  onSave,
  onCancel,
  isAdminMode = false,
}: MaterialFormProps) {
  const [formData, setFormData] = useState({
    name: material?.name || "",
    category: (material?.category || "Plastics") as MaterialCategory,
    compostability: material?.compostability || 0,
    recyclability: material?.recyclability || 0,
    reusability: material?.reusability || 0,
    description: material?.description || "",
    aliases: material?.aliases?.join(", ") || "",
    isHub: material?.isHub || material?.category === "Elements" || false,
  });

  // Admin-only: user to attribute the material to
  const [onBehalfOfUserId, setOnBehalfOfUserId] = useState<string | null>(null);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    // Prevent browser from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const initialFormData = useRef(JSON.stringify(formData));
  const isDirty = () => JSON.stringify(formData) !== initialFormData.current;

  const handleRequestCancel = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preserve all existing scientific/wiki fields not shown in this form.
    const existingFields: Partial<Omit<Material, "id">> = {};
    if (material) {
      const { id: _id, ...rest } = material;
      Object.assign(existingFields, rest);
    }
    const parsedAliases = formData.aliases
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    onSave(
      {
        ...existingFields,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        compostability: formData.compostability || 0,
        recyclability: formData.recyclability || 0,
        reusability: formData.reusability || 0,
        aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
        isHub: formData.isHub || undefined,
        articles: material?.articles || {
          compostability: [],
          recyclability: [],
          reusability: [],
        },
      },
      onBehalfOfUserId ? { onBehalfOf: onBehalfOfUserId } : undefined,
    );
  };

  return (
    <div className="bg-white relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[13px] text-black block mb-1">
            Material Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDownCapture={handleKeyDown}
            required
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-xl text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          />
        </div>

        <div>
          <label className="text-[13px] text-black block mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value as MaterialCategory,
                isHub: e.target.value === "Elements" ? true : formData.isHub,
              })
            }
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-xl text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            {MATERIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] text-black block mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            onKeyDownCapture={handleKeyDown}
            rows={3}
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-xl text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
          />
        </div>

        <div>
          <label className="text-[13px] text-black block mb-1">
            Aliases <span className="text-black/50">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={formData.aliases}
            onChange={(e) =>
              setFormData({ ...formData, aliases: e.target.value })
            }
            onKeyDownCapture={handleKeyDown}
            placeholder="e.g. PET, Polyethylene terephthalate"
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-xl text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isHub"
            type="checkbox"
            checked={formData.isHub}
            onChange={(e) =>
              setFormData({ ...formData, isHub: e.target.checked })
            }
            className="w-4 h-4 accent-waste-recycle"
          />
          <label
            htmlFor="isHub"
            className="text-[13px] text-black cursor-pointer"
          >
            Hub page{" "}
            <span className="text-black/50">(links to related materials)</span>
          </label>
        </div>

        {/* Note about sustainability scores */}
        <div className="bg-[#e5e4dc] dark:bg-[#3a3835] rounded-xl p-3 border border-[#211f1c]/20 dark:border-white/20">
          <p className="text-[11px] text-black/70 dark:text-white/70">
            ℹ️ Sustainability scores (Compostability, Recyclability,
            Reusability) will be calculated by admins in the Data Management
            area based on scientific parameters.
          </p>
        </div>

        {/* Admin-only: Post on behalf of another user */}
        {isAdminMode && !material && (
          <UserSelector
            selectedUserId={onBehalfOfUserId}
            onSelectUser={setOnBehalfOfUserId}
            label="Post on behalf of"
            isVisible={true}
          />
        )}

        <div className="flex gap-3 mt-2 justify-center">
          <button
            type="submit"
            className="bg-waste-recycle h-10 px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[14px] text-black hover:translate-y-px hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {material ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={handleRequestCancel}
            className="bg-waste-compost h-10 px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[14px] text-black hover:translate-y-px hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
      {showDiscardConfirm && (
        <DiscardChangesDialog
          onKeepEditing={() => setShowDiscardConfirm(false)}
          onDiscard={onCancel}
        />
      )}
    </div>
  );
}
