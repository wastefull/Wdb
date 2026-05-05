import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
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
  Table2,
  Superscript,
  Eraser,
  Code2,
} from "lucide-react";
import { Section } from "./extensions/Section";
import { Tip } from "./extensions/Tip";
import { Warning } from "./extensions/Warning";
import { StepList, StepItem } from "./extensions/StepList";
import { Resource } from "./extensions/Resource";
import { CheckItem } from "./extensions/CheckItem";
import { Footnote } from "./extensions/Footnote";

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
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        bold: {
          HTMLAttributes: {
            // Inline style so it shows in the editor regardless of CSS cascade
            style:
              "background-color: rgba(251,191,36,0.35); border-radius: 2px; padding: 0 1px; font-weight: 700;",
          },
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
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Footnote,
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

  // Parse selected pipe-delimited text into a Tiptap table, or insert a blank one.
  const handleInsertTable = () => {
    const { from, to } = editor.state.selection;
    const selectedText =
      from !== to
        ? editor.state.doc.textBetween(from, to, "\n", (node) =>
            node.type.name === "hardBreak" ? "\n" : "",
          )
        : "";

    if (selectedText && selectedText.includes("|")) {
      const isSeparatorRow = (line: string) => /^[\s|:\-]+$/.test(line);
      const parseCells = (line: string) => {
        let cells = line.split("|").map((c) => c.trim());
        if (cells[0] === "") cells = cells.slice(1);
        if (cells[cells.length - 1] === "") cells = cells.slice(0, -1);
        return cells;
      };
      const makeCell = (text: string, isHeader: boolean) => ({
        type: isHeader ? "tableHeader" : "tableCell",
        attrs: { colspan: 1, rowspan: 1 },
        content: [
          {
            type: "paragraph",
            content: text ? [{ type: "text", text }] : [],
          },
        ],
      });

      const lines = selectedText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !isSeparatorRow(l));

      if (lines.length > 0) {
        const [headerLine, ...bodyLines] = lines;
        const headers = parseCells(headerLine);
        const colCount = headers.length;
        const tableNode = {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: headers.map((h) => makeCell(h, true)),
            },
            ...bodyLines.map((row) => ({
              type: "tableRow",
              content: parseCells(row)
                .concat(Array(colCount).fill(""))
                .slice(0, colCount)
                .map((cell) => makeCell(cell, false)),
            })),
          ],
        };
        editor.chain().focus().deleteSelection().insertContent(tableNode).run();
        return;
      }
    }

    // Fallback: blank 3×3 table
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="guide-editor">
      {/* Toolbar */}
      <div className="retro-card p-2 mb-4 flex flex-wrap gap-1 sticky top-2 z-10">
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
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          className="retro-icon-button"
          title="Clear formatting (remove bold, italic, etc. from selection)"
        >
          <Eraser size={16} />
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

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Table */}
        <button
          type="button"
          onClick={handleInsertTable}
          className="retro-icon-button"
          title="Insert Table — or highlight pipe-delimited text to convert it"
        >
          <Table2 size={16} />
        </button>

        {/* Footnote — new entry with auto UUID */}
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "footnote",
                attrs: {
                  content: "",
                  refId: crypto.randomUUID(),
                },
              })
              .run()
          }
          className="retro-icon-button"
          title="Insert Footnote — double-click badge to edit text &amp; copy Ref ID"
        >
          <Superscript size={16} />
        </button>

        {/* Back-reference — same footnote number as an existing one */}
        <button
          type="button"
          onClick={() => {
            const refId = window.prompt(
              "Paste the Ref ID of the footnote you want to cite again:",
            );
            if (!refId?.trim()) return;
            editor
              .chain()
              .focus()
              .insertContent({
                type: "footnote",
                attrs: { content: "", refId: refId.trim() },
              })
              .run();
          }}
          className="retro-icon-button"
          title="Insert back-reference (cite same footnote again)"
        >
          <Superscript size={16} className="opacity-50" />
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Source toggle */}
        <button
          type="button"
          onClick={() => {
            if (!sourceMode) {
              // Entering source mode — snapshot current JSON
              setSourceText(JSON.stringify(editor.getJSON(), null, 2));
            } else {
              // Leaving source mode — parse and load edited JSON
              try {
                const parsed = JSON.parse(sourceText);
                editor.commands.setContent(parsed);
                onChange?.(stripBoldFromHeadings(parsed));
              } catch {
                alert(
                  "Invalid JSON — fix syntax errors before switching back.",
                );
                return;
              }
            }
            setSourceMode((m) => !m);
          }}
          className={`retro-icon-button ${sourceMode ? "active" : ""}`}
          title={sourceMode ? "Back to editor" : "View / edit source JSON"}
        >
          <Code2 size={16} />
        </button>
      </div>

      {/* Editor Content */}
      {sourceMode ? (
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="retro-card p-4 w-full font-mono text-[12px] text-black dark:text-white bg-transparent min-h-[500px] resize-y outline-none"
          spellCheck={false}
        />
      ) : (
        <EditorContent
          editor={editor}
          className="retro-card p-6 min-h-[500px] prose prose-sm max-w-none"
        />
      )}
    </div>
  );
}
