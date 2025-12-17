import React, { useState } from "react";
import { BookOpen, X, Loader2 } from "lucide-react";
import { Guide, GuideMethod, GuideSubmission } from "../../types/guide";
import { Material } from "../../types/material";
import GuideEditor from "../editor/GuideEditor";
import type { TiptapContent } from "../../types/guide";

interface EditGuideFormProps {
  guide: Guide;
  onClose: () => void;
  onSubmit: (
    guideId: string,
    updates: Partial<GuideSubmission>
  ) => Promise<void>;
  materials: Material[];
}

export function EditGuideForm({
  guide,
  onClose,
  onSubmit,
  materials,
}: EditGuideFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse content if it's a JSON string
  const parseContent = (content: any): TiptapContent => {
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error("Error parsing guide content:", error);
        return { type: "doc", content: [] };
      }
    }
    return content as TiptapContent;
  };

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
      console.error("Error updating guide:", error);
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
          <button
            onClick={onClose}
            className="icon-box-sm hover:bg-black/5 dark:hover:bg-white/10"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

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
              className="input-field min-h-[80px]"
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
              <select
                value={formData.material_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    material_id: e.target.value || undefined,
                  })
                }
                className="input-field"
              >
                <option key="none" value="">
                  None
                </option>
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
