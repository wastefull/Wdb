import { useState } from "react";
import { Upload, X } from "lucide-react";
import { ArticleFormProps } from "../../types/article";
import { TiptapContent } from "../../types/guide";
import { ImageUploadArea } from "./ImageUploadArea";
import GuideEditor from "../editor/GuideEditor";
import { toast } from "sonner";

export function ArticleForm({ article, onSave, onCancel }: ArticleFormProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");

  // Initialize content from either new TiptapContent or migrate from legacy sections
  const getInitialContent = (): TiptapContent => {
    if (article?.content) {
      return article.content;
    }
    // Migrate from legacy section-based content
    if (
      article?.introduction?.content ||
      article?.supplies?.content ||
      article?.step1?.content
    ) {
      const nodes: any[] = [];

      if (article.introduction?.content) {
        nodes.push({
          type: "section",
          attrs: { title: "Introduction" },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: article.introduction.content }],
            },
          ],
        });
      }
      if (article.supplies?.content) {
        nodes.push({
          type: "section",
          attrs: { title: "Supplies" },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: article.supplies.content }],
            },
          ],
        });
      }
      if (article.step1?.content) {
        nodes.push({
          type: "section",
          attrs: { title: "Step 1" },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: article.step1.content }],
            },
          ],
        });
      }

      return { type: "doc", content: nodes };
    }
    return { type: "doc", content: [{ type: "paragraph" }] };
  };

  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    article_type:
      article?.article_type ||
      article?.category ||
      ("DIY" as "DIY" | "Industrial" | "Experimental"),
    sustainability_category:
      article?.sustainability_category ||
      ("recyclability" as "compostability" | "recyclability" | "reusability"),
    content_markdown: article?.content_markdown || "",
    material_id: article?.material_id || "",
    author_id: article?.author_id || "",
    status: article?.status || ("draft" as "draft" | "published" | "archived"),
    version: article?.version || 1,
    created_at: article?.created_at || new Date().toISOString(),
    updated_at: article?.updated_at || new Date().toISOString(),
    cover_image_url:
      article?.cover_image_url || article?.overview?.image || undefined,
    content: getInitialContent(),
    // Legacy fields for backward compatibility (empty defaults)
    overview: { image: undefined as string | undefined },
    introduction: { image: undefined as string | undefined, content: "" },
    supplies: { image: undefined as string | undefined, content: "" },
    step1: { image: undefined as string | undefined, content: "" },
  });

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Prevent browser from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  // Handle importing article data from JSON
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
        content: parsed.content,
        article_type: parsed.article_type || prev.article_type,
        sustainability_category:
          parsed.sustainability_category || prev.sustainability_category,
        cover_image_url: parsed.cover_image_url || prev.cover_image_url,
      }));

      setShowImportModal(false);
      setImportJson("");
      toast.success("Article data imported successfully!");
    } catch (error) {
      toast.error("Invalid JSON. Please check the format and try again.");
      console.error("Import error:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="relative rounded-[11.464px] p-6 ">
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2a2825] rounded-xl border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-black dark:text-white">
                Import Article from JSON
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportJson("");
                }}
                className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-[12px] text-black/60 dark:text-white/60 mb-4">
              Paste your article JSON below. It should include a "content" field
              with Tiptap format (type: "doc").
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"title": "My Article", "content": {"type": "doc", "content": [...]}}'
              className="w-full h-64 px-3 py-2 bg-white dark:bg-[#1a1817] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl text-[13px] text-black dark:text-white font-mono outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transition-all"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportJson("");
                }}
                className="px-4 py-2 text-[13px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="bg-waste-recycle h-9 px-6 rounded-[6px] border border-[#211f1c] shadow-[2px_3px_0px_-1px_#000000] text-[13px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header with Import Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] text-black dark:text-white">
            {article ? "Edit Article" : "New Article"}
          </h2>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white border border-[#211f1c]/30 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <Upload size={14} />
            Import JSON
          </button>
        </div>

        {/* Overview Section */}
        <div className="bg-white dark:bg-[#1a1817] rounded-xl border-[1.5px] border-[#211f1c] dark:border-white/20 p-4">
          <h3 className="text-[15px] text-black dark:text-white mb-4">
            Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ImageUploadArea
                image={formData.cover_image_url}
                onImageChange={(img) =>
                  setFormData({
                    ...formData,
                    cover_image_url: img,
                  })
                }
                label="Cover Image"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[13px] text-black dark:text-white block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  onKeyDownCapture={handleKeyDown}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl text-[14px] text-black dark:text-white outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transition-all"
                />
              </div>
              <div>
                <label className="text-[13px] text-black dark:text-white block mb-1">
                  Article Type
                </label>
                <select
                  value={formData.article_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      article_type: e.target.value as
                        | "DIY"
                        | "Industrial"
                        | "Experimental",
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl text-[14px] text-black dark:text-white outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transition-all"
                >
                  <option value="DIY">DIY</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Experimental">Experimental</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] text-black dark:text-white block mb-1">
                  Sustainability Category
                </label>
                <select
                  value={formData.sustainability_category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sustainability_category: e.target.value as
                        | "compostability"
                        | "recyclability"
                        | "reusability",
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl text-[14px] text-black dark:text-white outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transition-all"
                >
                  <option value="compostability">Compostability</option>
                  <option value="recyclability">Recyclability</option>
                  <option value="reusability">Reusability</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white dark:bg-[#1a1817] rounded-xl border-[1.5px] border-[#211f1c] dark:border-white/20 p-4">
          <h3 className="text-[15px] text-black dark:text-white mb-4">
            Content
          </h3>
          <GuideEditor
            initialContent={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Start writing your article content... Use sections, tips, warnings, and lists to organize your content."
          />
        </div>

        <div className="flex gap-3 justify-center">
          <button
            type="submit"
            className="bg-waste-recycle h-10 px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[14px] text-black hover:translate-y-px hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {article ? "Update" : "Add Article"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-waste-compost h-10 px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[14px] text-black hover:translate-y-px hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
