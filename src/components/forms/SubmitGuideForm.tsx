import React, { useState } from "react";
import { BookOpen, X, Loader2 } from "lucide-react";
import { Guide, GuideMethod, GuideSubmission } from "../../types/guide";
import { Material } from "../../types/material";

interface SubmitGuideFormProps {
  onClose: () => void;
  onSubmit: (guide: GuideSubmission) => Promise<void>;
  materials: Material[];
}

export function SubmitGuideForm({
  onClose,
  onSubmit,
  materials,
}: SubmitGuideFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<GuideSubmission>({
    title: "",
    description: "",
    content: "",
    method: "DIY",
    material_id: undefined,
    difficulty_level: "beginner",
    estimated_time: "",
    required_materials: [],
    tags: [],
    cover_image_url: "",
    meta_description: "",
  });

  const [materialsInput, setMaterialsInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse comma-separated lists
      const guide: GuideSubmission = {
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

      await onSubmit(guide);
      onClose();
    } catch (error) {
      console.error("Error submitting guide:", error);
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
              Submit a Guide
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
              placeholder="e.g., How to Start Composting at Home"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] normal mb-2">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="textarea-field h-20"
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
                <option value="DIY">DIY</option>
                <option value="Industrial">Industrial</option>
                <option value="Experimental">Experimental</option>
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
                <option value="">None</option>
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
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
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
              Guide Content (Markdown) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="textarea-field h-64 font-mono text-[11px]"
              placeholder="Write your guide content here using Markdown formatting..."
            />
            <p className="caption mt-1">
              Supports Markdown: **bold**, *italic*, # headings, - lists, etc.
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
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 retro-btn px-4 py-3 bg-white dark:bg-[#2a2825] text-black dark:text-white text-[13px]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 retro-btn-primary px-4 py-3 bg-waste-science text-black text-[13px] flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <BookOpen size={16} />
                  Submit Guide
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
