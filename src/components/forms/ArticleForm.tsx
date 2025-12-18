import { useState } from "react";
import { ArticleFormProps } from "../../types/article";
import { TiptapContent } from "../../types/guide";
import { ImageUploadArea } from "./ImageUploadArea";
import GuideEditor from "../editor/GuideEditor";

export function ArticleForm({ article, onSave, onCancel }: ArticleFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white dark:bg-[#2a2825] relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
