import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import * as api from "../../utils/api";
import { Material } from "../../types/material";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { logger } from "../../utils/logger";

const CATEGORIES = [
  "Packaging",
  "Textiles",
  "Electronics",
  "Construction",
  "Food & Organic",
  "Plastics",
  "Metals",
  "Other",
];

interface SuggestMaterialEditFormProps {
  material: Material;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function SuggestMaterialEditForm({
  material,
  onClose,
  onSubmitSuccess,
}: SuggestMaterialEditFormProps) {
  const [name, setName] = useState(material.name);
  const [category, setCategory] = useState(material.category);
  const [description, setDescription] = useState(material.description || "");
  const [changeReason, setChangeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(material.name);
    setCategory(material.category);
    setDescription(material.description || "");
  }, [material]);

  const hasChanges = () => {
    return (
      name.trim() !== material.name ||
      category !== material.category ||
      description.trim() !== (material.description || "")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges()) {
      toast.error("No changes detected");
      return;
    }

    if (!changeReason.trim()) {
      toast.error("Please explain why you're suggesting this change");
      return;
    }

    try {
      setSubmitting(true);

      // Create submission for material edit
      await api.createSubmission({
        type: "edit_material",
        content_data: {
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          change_reason: changeReason.trim(),
        },
        original_content_id: material.id,
      });

      toast.success(
        "Edit suggestion submitted! You'll be notified when it's reviewed."
      );
      onSubmitSuccess();
      onClose();
    } catch (error) {
      logger.error("Error submitting edit:", error);
      toast.error("Failed to submit edit suggestion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 w-full max-w-md shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c] dark:border-white/20 sticky top-0 bg-white dark:bg-[#2a2825] z-10">
          <h3 className="normal">Suggest Edit</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} className="normal" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-waste-reuse dark:bg-[#2a3235] border border-[#211f1c] dark:border-white/20 rounded-md p-3 mb-4">
            <p className="text-[11px] normal">
              ✏️ <strong>Editing:</strong> {material.name}
            </p>
            <p className="text-[10px] text-black/70 dark:text-white/70 mt-1">
              Your suggested changes will be reviewed by an admin before being
              applied.
            </p>
          </div>

          <div>
            <Label htmlFor="edit-name" className="text-[12px] normal">
              Material Name *
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-category" className="text-[12px] normal">
              Category *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-description" className="text-[12px] normal">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-20"
              rows={3}
            />
          </div>

          <div className="pt-2 border-t border-[#211f1c]/20 dark:border-white/10">
            <Label htmlFor="change-reason" className="text-[12px] normal">
              Reason for Change *
            </Label>
            <Textarea
              id="change-reason"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Explain why you're suggesting this change..."
              className="mt-1 min-h-[70px]"
              rows={3}
              required
            />
            <p className="mt-1 text-[10px] text-black/50 dark:text-white/50">
              Help reviewers understand the benefit of your changes.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-waste-compost hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-waste-reuse hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !hasChanges()}
            >
              {submitting ? "Submitting..." : "Submit Suggestion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
