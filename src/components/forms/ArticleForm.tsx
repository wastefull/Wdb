import { useState } from "react";
import { ArticleFormProps } from "../../types/article";
import { ImageUploadArea } from "./ImageUploadArea";

export function ArticleForm({ article, onSave, onCancel }: ArticleFormProps) {
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
    overview: {
      image: article?.overview.image || undefined,
    },
    introduction: {
      image: article?.introduction.image || undefined,
      content: article?.introduction.content || "",
    },
    supplies: {
      image: article?.supplies.image || undefined,
      content: article?.supplies.content || "",
    },
    step1: {
      image: article?.step1.image || undefined,
      content: article?.step1.content || "",
    },
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
    onSave(formData);
  };

  return (
    <div className="bg-white relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Overview Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">
            Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ImageUploadArea
                image={formData.overview.image}
                onImageChange={(img) =>
                  setFormData({
                    ...formData,
                    overview: { ...formData.overview, image: img },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">
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
                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
                />
              </div>
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">
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
                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
                >
                  <option value="DIY">DIY</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Experimental">Experimental</option>
                </select>
              </div>
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">
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
                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
                >
                  <option value="compostability">Compostability</option>
                  <option value="recyclability">Recyclability</option>
                  <option value="reusability">Reusability</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">
            Introduction
          </h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.introduction.image}
              onImageChange={(img) =>
                setFormData({
                  ...formData,
                  introduction: { ...formData.introduction, image: img },
                })
              }
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">
                Content
              </label>
              <textarea
                value={formData.introduction.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    introduction: {
                      ...formData.introduction,
                      content: e.target.value,
                    },
                  })
                }
                onKeyDownCapture={handleKeyDown}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="Describe what this guide is about..."
              />
            </div>
          </div>
        </div>

        {/* Supplies Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">
            Supplies
          </h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.supplies.image}
              onImageChange={(img) =>
                setFormData({
                  ...formData,
                  supplies: { ...formData.supplies, image: img },
                })
              }
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">
                Content
              </label>
              <textarea
                value={formData.supplies.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    supplies: { ...formData.supplies, content: e.target.value },
                  })
                }
                onKeyDownCapture={handleKeyDown}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="List the supplies needed..."
              />
            </div>
          </div>
        </div>

        {/* Step 1 Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">
            Step 1
          </h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.step1.image}
              onImageChange={(img) =>
                setFormData({
                  ...formData,
                  step1: { ...formData.step1, image: img },
                })
              }
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">
                Content
              </label>
              <textarea
                value={formData.step1.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    step1: { ...formData.step1, content: e.target.value },
                  })
                }
                onKeyDownCapture={handleKeyDown}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="Describe the first step..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            type="submit"
            className="bg-[#e4e3ac] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {article ? "Update" : "Add Article"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#e6beb5] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
