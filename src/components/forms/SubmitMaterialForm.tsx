import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import * as api from "../../utils/api";
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

interface SubmitMaterialFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function SubmitMaterialForm({
  onClose,
  onSubmitSuccess,
}: SubmitMaterialFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a material name");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    try {
      setSubmitting(true);

      // Create submission for new material
      await api.createSubmission({
        type: "new_material",
        content_data: {
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          // Default values for new submissions
          recyclability: 0,
          compostability: 0,
          reusability: 0,
        },
      });

      toast.success(
        "Material submitted for review! You'll be notified when it's reviewed."
      );
      onSubmitSuccess();
      onClose();
    } catch (error) {
      logger.error("Error submitting material:", error);
      toast.error("Failed to submit material");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 w-full max-w-md shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c] dark:border-white/20">
          <h3 className="normal">Submit New Material</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} className="normal" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-waste-recycle dark:bg-[#3a3825] border border-[#211f1c] dark:border-white/20 rounded-md p-3 mb-4">
            <p className="text-[11px] normal">
              💡 <strong>Note:</strong> Your submission will be reviewed by an
              admin before it appears in the database. You only need to provide
              basic information—admins will add sustainability scores.
            </p>
          </div>

          <div>
            <Label htmlFor="material-name" className="text-[12px] normal">
              Material Name *
            </Label>
            <Input
              id="material-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aluminum Can, Cotton T-Shirt"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="material-category" className="text-[12px] normal">
              Category *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="material-category" className="mt-1">
                <SelectValue placeholder="Select a category" />
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
            <Label
              htmlFor="material-description"
              className="text-[12px] normal"
            >
              Description (optional)
            </Label>
            <Textarea
              id="material-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any relevant details about this material..."
              className="mt-1 min-h-20"
              rows={3}
            />
            <p className="mt-1 text-[10px] text-black/50 dark:text-white/50">
              Examples: composition, common uses, special properties, etc.
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
              className="flex-1 h-10 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#c8e5c8] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
