import { useState, useEffect } from "react";
import { Save, X, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Material } from "../../types/material";
import { Article } from "../../types/article";
import { logger } from "../../utils/logger";
interface ArticleEditorProps {
  article?: Article;
  materials: Material[];
  onSave: (article: Article) => Promise<void>;
  onCancel: () => void;
}

export function ArticleEditor({
  article,
  materials,
  onSave,
  onCancel,
}: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [content, setContent] = useState(article?.content_markdown || "");
  const [articleType, setArticleType] = useState<
    "DIY" | "Industrial" | "Experimental"
  >(article?.article_type || article?.category || "DIY");
  const [sustainabilityCategory, setSustainabilityCategory] = useState<
    "compostability" | "recyclability" | "reusability"
  >(article?.sustainability_category || "recyclability");
  const [materialId, setMaterialId] = useState(article?.material_id || "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Auto-generate slug from title
  useEffect(() => {
    if (!article && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  }, [title, slug, article]);

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!slug.trim()) {
      toast.error("Please enter a slug");
      return;
    }
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (!materialId) {
      toast.error("Please select a material");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        id: article?.id || crypto.randomUUID(),
        title,
        slug,
        content_markdown: content,
        article_type: articleType,
        sustainability_category: sustainabilityCategory,
        material_id: materialId,
        status: article?.status || "draft",
        author_id: article?.author_id || "",
        created_at: article?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: (article?.version || 0) + 1,
        dateAdded: article?.dateAdded || new Date().toISOString(),
        overview: article?.overview || {},
        introduction: article?.introduction || { content: "" },
        supplies: article?.supplies || { content: "" },
        step1: article?.step1 || { content: "" },
      });
    } catch (error) {
      logger.error("Error saving article:", error);
      toast.error("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  // Markdown formatting helpers
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="normal mb-2">
          {article ? "Edit Article" : "New Article"}
        </h2>
        <p className="text-[13px] text-black/70 dark:text-white/70">
          Write helpful content about material sustainability
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="normal">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="How to compost PLA cups at home"
            className="text-[13px]"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="normal">
            Slug (URL path)
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="how-to-compost-pla-cups"
            className="text-[13px] font-mono"
          />
          <p className="text-[11px] text-black/60 dark:text-white/60">
            URL: /articles/{slug || "your-slug-here"}
          </p>
        </div>

        {/* Category and Material */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="articleType" className="normal">
              Article Type
            </Label>
            <Select
              value={articleType}
              onValueChange={(val: any) => setArticleType(val)}
            >
              <SelectTrigger id="articleType" className="">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIY">DIY</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Experimental">Experimental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sustainabilityCategory" className="normal">
              Sustainability Category
            </Label>
            <Select
              value={sustainabilityCategory}
              onValueChange={(val: any) => setSustainabilityCategory(val)}
            >
              <SelectTrigger id="sustainabilityCategory" className="">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compostability">Compostability</SelectItem>
                <SelectItem value="recyclability">Recyclability</SelectItem>
                <SelectItem value="reusability">Reusability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Material */}
        <div className="space-y-2">
          <Label htmlFor="material" className="normal">
            Material
          </Label>
          <Select value={materialId} onValueChange={setMaterialId}>
            <SelectTrigger id="material" className="">
              <SelectValue placeholder="Select material..." />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Editor with Markdown Toolbar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content" className="normal">
              Content
            </Label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="btn-ghost"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="btn-ghost"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("\n## ")}
                className="btn-ghost"
                title="Heading"
              >
                H
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](url)")}
                className="btn-ghost"
                title="Link"
              >
                🔗
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("\n- ")}
                className="btn-ghost"
                title="List"
              >
                •
              </button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="">
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="">
                <Eye size={14} className="mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-2">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here using Markdown..."
                rows={15}
                className="text-[13px] font-mono"
              />
              <p className="mt-2 text-[11px] text-black/60 dark:text-white/60">
                Supports Markdown: **bold**, *italic*, ## headings,
                [links](url), lists
              </p>
            </TabsContent>

            <TabsContent value="preview" className="mt-2">
              <div className="min-h-[400px] p-4 rounded-md border border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825]">
                {content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[13px]">
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="normal mb-4" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="normal mb-3 mt-6" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="normal mb-2 mt-4" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="normal mb-4" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="normal mb-4 list-disc pl-6"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="normal mb-4 list-decimal pl-6"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="normal mb-1" {...props} />
                        ),
                        a: ({ node, ...props }) => (
                          <a
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="" {...props} />
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[13px] text-black/50 dark:text-white/50 italic">
                    Nothing to preview yet
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#c8e5c8] text-black hover:bg-[#b8d5b8] border border-[#211f1c] dark:border-white/20"
        >
          <Save size={14} />
          {saving ? "Saving..." : article ? "Update Article" : "Create Article"}
        </Button>
        <Button
          onClick={onCancel}
          disabled={saving}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X size={14} />
          Cancel
        </Button>
      </div>
    </div>
  );
}
