import { useState } from "react";
import { Material } from "../../types/material";

export interface MaterialFormProps {
  material?: Material;
  onSave: (material: Omit<Material, "id">) => void;
  onCancel: () => void;
}

export function MaterialForm({
  material,
  onSave,
  onCancel,
}: MaterialFormProps) {
  const [formData, setFormData] = useState({
    name: material?.name || "",
    category:
      material?.category ||
      ("Plastics" as
        | "Plastics"
        | "Metals"
        | "Glass"
        | "Paper & Cardboard"
        | "Fabrics & Textiles"
        | "Electronics & Batteries"
        | "Building Materials"
        | "Organic/Natural Waste"),
    compostability: material?.compostability || 0,
    recyclability: material?.recyclability || 0,
    reusability: material?.reusability || 0,
    description: material?.description || "",
  });

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Prevent Figma from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      articles: material?.articles || {
        compostability: [],
        recyclability: [],
        reusability: [],
      },
    });
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
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          />
        </div>

        <div>
          <label className="text-[13px] text-black block mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value as typeof formData.category,
              })
            }
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            <option value="Plastics">Plastics</option>
            <option value="Metals">Metals</option>
            <option value="Glass">Glass</option>
            <option value="Paper & Cardboard">Paper & Cardboard</option>
            <option value="Fabrics & Textiles">Fabrics & Textiles</option>
            <option value="Electronics & Batteries">
              Electronics & Batteries
            </option>
            <option value="Building Materials">Building Materials</option>
            <option value="Organic/Natural Waste">Organic/Natural Waste</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] text-black block mb-1">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            onKeyDownCapture={handleKeyDown}
            rows={3}
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
          />
        </div>

        {/* Note about sustainability scores */}
        <div className="bg-[#e5e4dc] dark:bg-[#3a3835] rounded-[8px] p-3 border border-[#211f1c]/20 dark:border-white/20">
          <p className="text-[11px] text-black/70 dark:text-white/70">
            ℹ️ Sustainability scores (Compostability, Recyclability,
            Reusability) will be calculated by admins in the Data Management
            area based on scientific parameters.
          </p>
        </div>

        <div className="flex gap-3 mt-2 justify-center">
          <button
            type="submit"
            className="bg-[#e4e3ac] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {material ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#e6beb5] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
