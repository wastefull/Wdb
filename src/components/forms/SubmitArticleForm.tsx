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

const ARTICLE_CATEGORIES = ["Compostability", "Recyclability", "Reusability"];

interface SubmitArticleFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
  preselectedCategory?: string;
  preselectedMaterialId?: string;
}

export function SubmitArticleForm({
  onClose,
  onSubmitSuccess,
  preselectedCategory,
  preselectedMaterialId,
}: SubmitArticleFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(preselectedCategory || "");
  const [materialId, setMaterialId] = useState(preselectedMaterialId || "");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const allMaterials = await api.getAllMaterials();
      setMaterials(allMaterials);
    } catch (error) {
      console.error("Error loading materials:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter an article title");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    if (!materialId) {
      toast.error("Please select a material");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter article content");
      return;
    }

    try {
      setSubmitting(true);

      // Create submission for new article
      await api.createSubmission({
        type: "new_article",
        content_data: {
          title: title.trim(),
          category,
          material_id: materialId,
          content: content.trim(),
        },
      });

      toast.success(
        "Article submitted for review! You'll be notified when it's reviewed."
      );
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting article:", error);
      toast.error("Failed to submit article");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMaterial = materials.find((m) => m.id === materialId);

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 w-full max-w-2xl shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c] dark:border-white/20 sticky top-0 bg-white dark:bg-[#2a2825] z-10">
          <h3 className="font-['Fredoka_One',_sans-serif] text-black dark:text-white">
            Submit New Article
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} className="text-black dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[#e4e3ac] dark:bg-[#3a3825] border border-[#211f1c] dark:border-white/20 rounded-md p-3 mb-4">
            <p className="text-[11px] text-black dark:text-white">
              📝 <strong>Note:</strong> Your article will be reviewed by an
              admin before publication. You can use Markdown formatting in the
              content field.
            </p>
          </div>

          <div>
            <Label
              htmlFor="article-title"
              className="text-[12px] text-black dark:text-white"
            >
              Article Title *
            </Label>
            <Input
              id="article-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to Compost Pizza Boxes"
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="article-category"
                className="text-[12px] text-black dark:text-white"
              >
                Category *
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="article-category"
                  className="mt-1"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className=""
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="article-material"
                className="text-[12px] text-black dark:text-white"
              >
                Related Material *
              </Label>
              <Select
                value={materialId}
                onValueChange={setMaterialId}
                disabled={loadingMaterials}
              >
                <SelectTrigger
                  id="article-material"
                  className="mt-1"
                >
                  <SelectValue
                    placeholder={
                      loadingMaterials ? "Loading..." : "Select material"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem
                      key={material.id}
                      value={material.id}
                      className=""
                    >
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedMaterial && (
            <div className="bg-[#b8c8cb]/30 dark:bg-[#2a3235]/30 border border-[#211f1c]/20 dark:border-white/10 rounded-md p-2">
              <p className="text-[10px] text-black/70 dark:text-white/70">
                <strong>Selected:</strong> {selectedMaterial.name} (
                {selectedMaterial.category})
              </p>
            </div>
          )}

          <div>
            <Label
              htmlFor="article-content"
              className="text-[12px] text-black dark:text-white"
            >
              Article Content *{" "}
              <span className="text-[10px] text-black/50 dark:text-white/50">
                (Markdown supported)
              </span>
            </Label>
            <Textarea
              id="article-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article here using Markdown formatting...&#10;&#10;## Example Heading&#10;&#10;Here's some **bold text** and *italic text*.&#10;&#10;- Bullet point 1&#10;- Bullet point 2"
              className="mt-1 font-['DaddyTimeMono_Nerd_Font_Mono',_'Press_Start_2P',_ui-monospace,_monospace] text-[11px] min-h-[300px]"
              rows={15}
              required
            />
            <p className="mt-1 text-[10px] text-black/50 dark:text-white/50">
              Use **bold**, *italic*, headings (##), lists (-), and links
              ([text](url))
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[40px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-[40px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#c8e5c8] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
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
