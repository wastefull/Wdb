import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Lightbulb,
  AlertCircle,
  ExternalLink,
  Layout,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Section } from "./extensions/Section";
import { Tip } from "./extensions/Tip";
import { Warning } from "./extensions/Warning";
import { StepList, StepItem } from "./extensions/StepList";
import { Resource } from "./extensions/Resource";
import { CheckItem } from "./extensions/CheckItem";

interface GuideEditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
}

// Helper to remove bold marks from heading nodes (Sniglet looks bad in bold)
const stripBoldFromHeadings = (content: any): any => {
  if (!content) return content;

  if (Array.isArray(content)) {
    return content.map(stripBoldFromHeadings);
  }

  if (typeof content === "object") {
    const node = { ...content };

    // If this is a heading, strip bold marks from its content
    if (node.type === "heading" && node.content) {
      node.content = node.content.map((child: any) => {
        if (child.type === "text" && child.marks) {
          return {
            ...child,
            marks: child.marks.filter((mark: any) => mark.type !== "bold"),
          };
        }
        return child;
      });
    }

    // Recursively process children
    if (node.content) {
      node.content = stripBoldFromHeadings(node.content);
    }

    return node;
  }

  return content;
};

export default function GuideEditor({
  initialContent,
  onChange,
  placeholder = "Start writing your guide...",
}: GuideEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
      Section,
      Tip,
      Warning,
      StepList,
      StepItem,
      Resource,
      CheckItem,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Strip bold marks from headings before passing to onChange
      const sanitizedContent = stripBoldFromHeadings(editor.getJSON());
      onChange?.(sanitizedContent);
    },
  });

  // Update editor content when initialContent changes (e.g., from import)
  useEffect(() => {
    if (editor && initialContent) {
      // Only update if the content is different from what's in the editor
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(initialContent);
      if (currentContent !== newContent) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className="guide-editor">
      {/* Toolbar */}
      <div className="retro-card p-2 mb-4 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`retro-icon-button ${
            editor.isActive("bold") ? "active" : ""
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`retro-icon-button ${
            editor.isActive("italic") ? "active" : ""
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`retro-icon-button ${
            editor.isActive("heading", { level: 2 }) ? "active" : ""
          }`}
          title="Heading"
        >
          <Heading2 size={16} />
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`retro-icon-button ${
            editor.isActive("bulletList") ? "active" : ""
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`retro-icon-button ${
            editor.isActive("orderedList") ? "active" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Custom Blocks */}
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "section",
                attrs: { title: "New Section" },
                content: [{ type: "paragraph" }],
              })
              .run()
          }
          className="retro-icon-button"
          title="Add Section"
        >
          <Layout size={16} />
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({ type: "tip", content: [{ type: "paragraph" }] })
              .run()
          }
          className="retro-icon-button"
          title="Add Tip"
        >
          <Lightbulb size={16} />
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "warning",
                content: [{ type: "paragraph" }],
              })
              .run()
          }
          className="retro-icon-button"
          title="Add Warning"
        >
          <AlertCircle size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCheckItems().run()}
          className="retro-icon-button"
          title="Add Check Item (✅) - or convert selected list"
        >
          <CheckCircle
            size={16}
            className="text-green-600 dark:text-green-400"
          />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCrossItems().run()}
          className="retro-icon-button"
          title="Add Cross Item (❌) - or convert selected list"
        >
          <XCircle size={16} className="text-red-600 dark:text-red-400" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "resource",
                attrs: { title: "", url: "", type: "article" },
              })
              .run()
          }
          className="retro-icon-button"
          title="Add Resource"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="retro-card p-6 min-h-[500px] prose prose-sm max-w-none"
      />
    </div>
  );
}
