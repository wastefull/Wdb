import React, { useState } from "react";
import { BookOpen, X, Loader2, Upload } from "lucide-react";
import { Guide, GuideMethod, GuideSubmission } from "../../types/guide";
import { Material } from "../../types/material";
import GuideEditor from "../editor/GuideEditor";
import type { TiptapContent } from "../../types/guide";
import { toast } from "sonner";
import { logger } from "../../utils/logger";
interface EditGuideFormProps {
  guide: Guide;
  onClose: () => void;
  onSubmit: (
    guideId: string,
    updates: Partial<GuideSubmission>
  ) => Promise<void>;
  materials: Material[];
  isAdmin?: boolean;
}

export function EditGuideForm({
  guide,
  onClose,
  onSubmit,
  materials,
  isAdmin = false,
}: EditGuideFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");

  // Parse content if it's a JSON string
  const parseContent = (content: any): TiptapContent => {
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch (error) {
        logger.error("Error parsing guide content:", error);
        return { type: "doc", content: [] };
      }
    }
    return content as TiptapContent;
  };

  // Check if the guide references a material that no longer exists (orphaned)
  const isOrphanedMaterial =
    guide.material_id && !materials.find((m) => m.id === guide.material_id);

  const [formData, setFormData] = useState<GuideSubmission>({
    title: guide.title,
    description: guide.description,
    content: parseContent(guide.content),
    method: guide.method,
    material_id: guide.material_id,
    difficulty_level: guide.difficulty_level,
    estimated_time: guide.estimated_time || "",
    required_materials: guide.required_materials || [],
    tags: guide.tags || [],
    cover_image_url: guide.cover_image_url || "",
    meta_description: guide.meta_description || "",
  });

  const [materialsInput, setMaterialsInput] = useState(
    guide.required_materials?.join(", ") || ""
  );
  const [tagsInput, setTagsInput] = useState(guide.tags?.join(", ") || "");

  // Handle importing guide data from JSON
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);

      // Validate required fields
      if (!parsed.content || parsed.content.type !== "doc") {
        toast.error(
          "Invalid content format. Must have a 'content' field with type 'doc'."
        );
        return;
      }

      // Update form data with imported values
      setFormData((prev) => ({
        ...prev,
        title: parsed.title || prev.title,
        description: parsed.description || prev.description,
        content: parsed.content,
        method: parsed.method || prev.method,
        difficulty_level: parsed.difficulty_level || prev.difficulty_level,
        estimated_time: parsed.estimated_time || prev.estimated_time,
        required_materials:
          parsed.required_materials || prev.required_materials,
        tags: parsed.tags || prev.tags,
        cover_image_url: parsed.cover_image_url || prev.cover_image_url,
        meta_description: parsed.meta_description || prev.meta_description,
      }));

      // Update comma-separated inputs
      if (parsed.required_materials) {
        setMaterialsInput(parsed.required_materials.join(", "));
      }
      if (parsed.tags) {
        setTagsInput(parsed.tags.join(", "));
      }

      setShowImportModal(false);
      setImportJson("");
      toast.success("Guide data imported successfully!");
    } catch (error) {
      toast.error("Invalid JSON. Please check the format and try again.");
      logger.error("Import error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updates: Partial<GuideSubmission> = {
        ...formData,
        required_materials: materialsInput
          ? materialsInput
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean)
          : [],
        tags: tagsInput
          ? tagsInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      await onSubmit(guide.id, updates);
      onClose();
    } catch (error) {
      logger.error("Error updating guide:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-[#2a2825] border-b border-[#211f1c]/20 dark:border-white/20 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-box arcade-bg-green arcade-btn-green">
              <BookOpen size={24} />
            </div>
            <h2 className="text-[18px] font-display text-black dark:text-white">
              Edit Guide
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="retro-icon-button flex items-center gap-1 px-3"
                title="Import guide data from JSON"
              >
                <Upload size={16} />
                <span className="text-[12px]">Import</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="icon-box-sm hover:bg-black/5 dark:hover:bg-white/10"
              disabled={isSubmitting}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
            <div className="retro-card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-[#211f1c]/20 dark:border-white/20 flex items-center justify-between">
                <h3 className="text-[16px] font-display text-black dark:text-white">
                  Import Guide Data
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportJson("");
                  }}
                  className="icon-box-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-[13px] text-black/70 dark:text-white/70">
                  Paste guide JSON to import. This will overwrite the current
                  form data. See{" "}
                  <a
                    href="https://github.com/wastefull/Wdb/blob/main/src/docs/roadmap/guides/import-format.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 dark:text-blue-400"
                  >
                    import format documentation
                  </a>{" "}
                  for the required structure.
                </p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="input-field min-h-[300px] font-mono text-[12px]"
                  placeholder='{"title": "...", "content": {"type": "doc", "content": [...]}}'
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportJson("");
                    }}
                    className="retro-button flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importJson.trim()}
                    className="retro-button arcade-bg-cyan arcade-btn-cyan flex-1"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-[12px] normal mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input-field"
              placeholder="e.g., How to Make Compost at Home"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] normal mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field min-h-20"
              placeholder="Brief overview of what this guide covers"
            />
          </div>

          {/* Method and Material */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] normal mb-2">
                Method <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.method}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    method: e.target.value as GuideMethod,
                  })
                }
                className="input-field"
              >
                <option key="diy" value="DIY">
                  DIY
                </option>
                <option key="industrial" value="Industrial">
                  Industrial
                </option>
                <option key="experimental" value="Experimental">
                  Experimental
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] normal mb-2">
                Related Material (Optional)
              </label>
              {isOrphanedMaterial && (
                <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded text-[11px] text-amber-800 dark:text-amber-200">
                  ⚠️ This guide was linked to a material that no longer exists
                  {guide.material_name && (
                    <span className="font-medium">
                      {" "}
                      ("{guide.material_name}")
                    </span>
                  )}
                  . Please select a new material or choose "None".
                </div>
              )}
              <select
                value={formData.material_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    material_id: e.target.value || undefined,
                  })
                }
                className={`input-field ${
                  isOrphanedMaterial &&
                  formData.material_id === guide.material_id
                    ? "border-amber-500 dark:border-amber-500"
                    : ""
                }`}
              >
                <option key="none" value="">
                  None
                </option>
                {/* Show orphaned material option so the current value is visible */}
                {isOrphanedMaterial &&
                  formData.material_id === guide.material_id && (
                    <option
                      key="orphaned"
                      value={guide.material_id}
                      disabled
                      className="text-amber-600"
                    >
                      ⚠️ {guide.material_name || guide.material_id} (deleted)
                    </option>
                  )}
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] normal mb-2">
                Difficulty Level
              </label>
              <select
                value={formData.difficulty_level || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty_level: e.target.value as any,
                  })
                }
                className="input-field"
              >
                <option key="beginner" value="beginner">
                  Beginner
                </option>
                <option key="intermediate" value="intermediate">
                  Intermediate
                </option>
                <option key="advanced" value="advanced">
                  Advanced
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] normal mb-2">
                Estimated Time
              </label>
              <input
                type="text"
                value={formData.estimated_time || ""}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_time: e.target.value })
                }
                className="input-field"
                placeholder="e.g., 30 minutes, 2 hours"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-[12px] normal mb-2">
              Guide Content <span className="text-red-500">*</span>
            </label>
            <div className="border border-[#211f1c]/20 dark:border-white/20 rounded-lg overflow-hidden">
              <GuideEditor
                initialContent={formData.content}
                onChange={(content) =>
                  setFormData({
                    ...formData,
                    content: content as TiptapContent,
                  })
                }
                placeholder="Write your guide here... Use the toolbar to add sections, tips, warnings, and resources."
              />
            </div>
            <p className="caption mt-1">
              Use the toolbar to format text and add special blocks like tips,
              warnings, and step-by-step instructions.
            </p>
          </div>

          {/* Required Materials */}
          <div>
            <label className="block text-[12px] normal mb-2">
              Required Materials/Tools
            </label>
            <input
              type="text"
              value={materialsInput}
              onChange={(e) => setMaterialsInput(e.target.value)}
              className="input-field"
              placeholder="Comma-separated list: compost bin, kitchen scraps, brown materials"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[12px] normal mb-2">Tags</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="input-field"
              placeholder="Comma-separated tags: composting, organic, beginner-friendly"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-[12px] normal mb-2">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.cover_image_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, cover_image_url: e.target.value })
              }
              className="input-field"
              placeholder="https://images.unsplash.com/photo-..."
            />
            <p className="caption mt-1">
              Use a direct image URL (e.g., from Unsplash, right-click image →
              Copy Image Address). Unsplash page URLs won't work - you need the
              CDN URL starting with images.unsplash.com
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="retro-button flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="retro-button arcade-bg-green arcade-btn-green flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Guide"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
