# Guide Editor Implementation Plan - Option A: Tiptap

**Status:** Planning  
**Timeline:** 2-3 days  
**Cost:** $0 (Tiptap is MIT licensed, completely free)

---

## Overview

Implement a rich structured editor for guides using Tiptap with custom extensions. This will allow guide authors to create richly formatted content with specialized blocks for tips, warnings, steps, and resources - all stored as JSONB in the database.

---

## Phase 1: Dependencies & Setup (2 hours)

### Install Required Packages

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
```

**All packages are MIT licensed and free.**

### Core Dependencies

- `@tiptap/react` - React wrapper (~30KB gzipped)
- `@tiptap/starter-kit` - Basic formatting (bold, italic, lists, etc.)
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-link` - Link support
- `@tiptap/extension-placeholder` - Placeholder text

---

## Phase 2: Custom Extensions (4-6 hours)

### Create Custom Node Types

#### 1. Section Block (`/src/components/editor/extensions/Section.ts`)

```typescript
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import SectionComponent from "./SectionComponent";

export const Section = Node.create({
  name: "section",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      title: {
        default: "Section Title",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "section" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionComponent);
  },
});
```

#### 2. Tip Block (`/src/components/editor/extensions/Tip.ts`)

```typescript
export const Tip = Node.create({
  name: "tip",
  group: "block",
  content: "paragraph",

  parseHTML() {
    return [{ tag: 'div[data-type="tip"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "tip",
        class: "tip-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TipComponent);
  },
});
```

#### 3. Warning Block (`/src/components/editor/extensions/Warning.ts`)

```typescript
export const Warning = Node.create({
  name: "warning",
  group: "block",
  content: "paragraph",

  parseHTML() {
    return [{ tag: 'div[data-type="warning"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "warning",
        class: "warning-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WarningComponent);
  },
});
```

#### 4. Step List (`/src/components/editor/extensions/StepList.ts`)

```typescript
export const StepList = Node.create({
  name: "stepList",
  group: "block",
  content: "stepItem+",

  parseHTML() {
    return [{ tag: 'ol[data-type="step-list"]' }];
  },

  renderHTML() {
    return ["ol", { "data-type": "step-list", class: "step-list" }, 0];
  },
});

export const StepItem = Node.create({
  name: "stepItem",
  content: "paragraph",

  parseHTML() {
    return [{ tag: 'li[data-type="step"]' }];
  },

  renderHTML() {
    return ["li", { "data-type": "step" }, 0];
  },
});
```

#### 5. Resource Block (`/src/components/editor/extensions/Resource.ts`)

```typescript
export const Resource = Node.create({
  name: "resource",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      title: { default: "" },
      url: { default: "" },
      type: { default: "article" }, // article | video | pdf | website
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="resource"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "resource" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResourceComponent);
  },
});
```

---

## Phase 3: Editor Component (4-6 hours)

### Main Guide Editor (`/src/components/editor/GuideEditor.tsx`)

```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Section,
  Tip,
  Warning,
  StepList,
  StepItem,
  Resource,
} from "./extensions";
import { EditorToolbar } from "./EditorToolbar";
import { GuideContent } from "../../types/guide";

interface GuideEditorProps {
  initialContent?: GuideContent;
  onChange: (content: GuideContent) => void;
}

export function GuideEditor({ initialContent, onChange }: GuideEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3], // h2 and h3 only
        },
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your guide...",
      }),
      Section,
      Tip,
      Warning,
      StepList,
      StepItem,
      Resource,
    ],
    content: initialContent?.json || "",
    onUpdate: ({ editor }) => {
      // Convert editor JSON to GuideContent structure
      const json = editor.getJSON();
      onChange(parseEditorJSON(json));
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="guide-editor">
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 border border-gray-300 rounded-lg min-h-[500px]"
      />
    </div>
  );
}

// Helper to convert Tiptap JSON to GuideContent structure
function parseEditorJSON(json: any): GuideContent {
  const sections: GuideSection[] = [];
  const tips: string[] = [];
  const commonMistakes: string[] = [];
  const resources: Resource[] = [];
  let overview = "";

  json.content?.forEach((node: any) => {
    switch (node.type) {
      case "section":
        sections.push({
          title: node.attrs.title,
          content: extractText(node),
          steps: extractSteps(node),
          warning: extractWarning(node),
        });
        break;
      case "tip":
        tips.push(extractText(node));
        break;
      case "paragraph":
        if (!overview) overview = extractText(node);
        break;
      case "resource":
        resources.push({
          title: node.attrs.title,
          url: node.attrs.url,
          type: node.attrs.type,
        });
        break;
    }
  });

  return { overview, sections, tips, commonMistakes, resources };
}
```

### Editor Toolbar (`/src/components/editor/EditorToolbar.tsx`)

```typescript
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Image,
  Lightbulb,
  AlertCircle,
  FileText,
  CheckSquare,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-300 rounded-t-lg">
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        icon={<Bold size={16} />}
        label="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        icon={<Italic size={16} />}
        label="Italic"
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        icon={<List size={16} />}
        label="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        icon={<ListOrdered size={16} />}
        label="Numbered List"
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Custom Blocks */}
      <ToolbarButton
        onClick={() => addSection(editor)}
        icon={<FileText size={16} />}
        label="Add Section"
      />
      <ToolbarButton
        onClick={() => addTip(editor)}
        icon={<Lightbulb size={16} />}
        label="Add Tip"
      />
      <ToolbarButton
        onClick={() => addWarning(editor)}
        icon={<AlertCircle size={16} />}
        label="Add Warning"
      />
      <ToolbarButton
        onClick={() => addStepList(editor)}
        icon={<CheckSquare size={16} />}
        label="Add Steps"
      />
    </div>
  );
}

function ToolbarButton({ onClick, active, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        active ? "bg-gray-300" : ""
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}

function addSection(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "section",
      attrs: { title: "New Section" },
      content: [{ type: "paragraph" }],
    })
    .run();
}

function addTip(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "tip",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Enter tip here..." }],
        },
      ],
    })
    .run();
}

function addWarning(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "warning",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Enter warning here..." }],
        },
      ],
    })
    .run();
}

function addStepList(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "stepList",
      content: [
        {
          type: "stepItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Step 1" }] },
          ],
        },
        {
          type: "stepItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Step 2" }] },
          ],
        },
      ],
    })
    .run();
}
```

---

## Phase 4: Node View Components (3-4 hours)

### Section Component (`/src/components/editor/nodes/SectionComponent.tsx`)

```typescript
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { useState } from "react";

export default function SectionComponent({ node, updateAttributes }: any) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <NodeViewWrapper className="section-block my-4 p-4 border-l-4 border-blue-500 bg-blue-50">
      {isEditing ? (
        <input
          value={node.attrs.title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          onBlur={() => setIsEditing(false)}
          className="text-xl font-bold mb-2 w-full bg-transparent border-b border-blue-300"
          autoFocus
        />
      ) : (
        <h2
          onClick={() => setIsEditing(true)}
          className="text-xl font-bold mb-2 cursor-pointer hover:bg-blue-100"
        >
          {node.attrs.title}
        </h2>
      )}
      <NodeViewContent className="section-content" />
    </NodeViewWrapper>
  );
}
```

### Tip Component (`/src/components/editor/nodes/TipComponent.tsx`)

```typescript
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Lightbulb } from "lucide-react";

export default function TipComponent() {
  return (
    <NodeViewWrapper className="tip-block my-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
      <div className="flex items-start gap-2">
        <Lightbulb size={20} className="text-green-600 mt-1" />
        <NodeViewContent className="flex-1" />
      </div>
    </NodeViewWrapper>
  );
}
```

### Warning Component (`/src/components/editor/nodes/WarningComponent.tsx`)

```typescript
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { AlertCircle } from "lucide-react";

export default function WarningComponent() {
  return (
    <NodeViewWrapper className="warning-block my-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
      <div className="flex items-start gap-2">
        <AlertCircle size={20} className="text-red-600 mt-1" />
        <NodeViewContent className="flex-1" />
      </div>
    </NodeViewWrapper>
  );
}
```

### Resource Component (`/src/components/editor/nodes/ResourceComponent.tsx`)

```typescript
import { NodeViewWrapper } from "@tiptap/react";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

export default function ResourceComponent({
  node,
  updateAttributes,
  deleteNode,
}: any) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div className="p-4 bg-gray-50 border border-gray-300 rounded my-2">
          <input
            placeholder="Resource title"
            value={node.attrs.title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          />
          <input
            placeholder="URL"
            value={node.attrs.url}
            onChange={(e) => updateAttributes({ url: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          />
          <select
            value={node.attrs.type}
            onChange={(e) => updateAttributes({ type: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          >
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="website">Website</option>
          </select>
          <button onClick={() => setIsEditing(false)} className="btn-primary">
            Save
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div
        className="p-3 bg-white border border-gray-200 rounded my-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-center gap-2">
          <ExternalLink size={16} />
          <div>
            <div className="font-medium">
              {node.attrs.title || "Untitled Resource"}
            </div>
            <div className="text-xs text-gray-500">{node.attrs.type}</div>
          </div>
        </div>
        <button
          onClick={deleteNode}
          className="text-red-500 hover:text-red-700"
        >
          ×
        </button>
      </div>
    </NodeViewWrapper>
  );
}
```

---

## Phase 5: Database Schema Updates (1 hour)

### Update Guide Types (`/src/types/guide.ts`)

```typescript
export interface GuideContent {
  overview: string;
  sections: GuideSection[];
  tips?: string[];
  commonMistakes?: string[];
  resources?: Resource[];
  json?: any; // Raw Tiptap JSON for re-editing
}

export interface GuideSection {
  title: string;
  content: string;
  steps?: string[];
  image?: string;
  warning?: string;
}

export interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "pdf" | "website";
}

export interface Guide {
  // ... existing fields ...
  content: GuideContent; // Changed from string to GuideContent
  thumbnail?: string; // Add thumbnail field
  read_time?: number; // Add read time in minutes
  pdf_url?: string;
  video_url?: string;
}
```

### Migration SQL (`/supabase/migrations/20251217000002_update_guides_structure.sql`)

```sql
-- Add new columns to guides table
ALTER TABLE guides
  ADD COLUMN IF NOT EXISTS thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS read_time INTEGER,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Change content column to JSONB
ALTER TABLE guides
  ALTER COLUMN content TYPE JSONB USING content::jsonb;

-- Add GIN index for JSONB querying
CREATE INDEX IF NOT EXISTS idx_guides_content_gin ON guides USING GIN (content);

-- Update reading time trigger to calculate from JSONB
CREATE OR REPLACE FUNCTION calculate_guide_reading_time()
RETURNS TRIGGER AS $$
DECLARE
  word_count INTEGER;
BEGIN
  -- Count words in all text content
  word_count := (
    SELECT SUM(length(value::text) - length(replace(value::text, ' ', '')) + 1)
    FROM jsonb_each_text(NEW.content)
  );

  NEW.read_time := GREATEST(1, CEIL(word_count / 200.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guides_calculate_reading_time
  BEFORE INSERT OR UPDATE OF content ON guides
  FOR EACH ROW
  EXECUTE FUNCTION calculate_guide_reading_time();
```

---

## Phase 6: Integration (2-3 hours)

### Update SubmitGuideForm

```typescript
import { GuideEditor } from "../editor/GuideEditor";
import { GuideContent } from "../../types/guide";

export function SubmitGuideForm() {
  const [content, setContent] = useState<GuideContent>({
    overview: "",
    sections: [],
    tips: [],
    commonMistakes: [],
    resources: [],
  });

  const handleContentChange = (newContent: GuideContent) => {
    setContent(newContent);
  };

  const handleSubmit = async () => {
    const guideData = {
      // ... other fields ...
      content,
    };
    await createGuide(guideData);
  };

  return (
    <div>
      {/* Other form fields */}
      <GuideEditor initialContent={content} onChange={handleContentChange} />
      <button onClick={handleSubmit}>Submit Guide</button>
    </div>
  );
}
```

---

## Phase 7: Guide Renderer (2-3 hours)

### Create GuideRenderer Component (`/src/components/guides/GuideRenderer.tsx`)

```typescript
import { GuideContent } from "../../types/guide";
import {
  Lightbulb,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface GuideRendererProps {
  content: GuideContent;
}

export function GuideRenderer({ content }: GuideRendererProps) {
  return (
    <div className="guide-content prose prose-sm max-w-none">
      {/* Overview */}
      {content.overview && (
        <div className="overview bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-8">
          <p className="text-sm leading-relaxed">{content.overview}</p>
        </div>
      )}

      {/* Sections */}
      {content.sections?.map((section, index) => (
        <section key={index} className="mb-8">
          <h2 className="text-xl font-bold mb-4">{section.title}</h2>
          {section.content && <p className="mb-4">{section.content}</p>}

          {section.warning && (
            <div className="warning-block flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded mb-4">
              <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm">{section.warning}</p>
            </div>
          )}

          {section.steps && (
            <ul className="space-y-3 ml-4 mb-4">
              {section.steps.map((step, stepIndex) => {
                const isCheckmark = step.startsWith("✅");
                const isCross = step.startsWith("❌");
                const cleanStep = step.replace(/^[✅❌]\s*/, "");

                return (
                  <li key={stepIndex} className="flex items-start gap-3">
                    {isCheckmark && (
                      <CheckCircle
                        size={16}
                        className="text-green-600 mt-0.5 shrink-0"
                      />
                    )}
                    {isCross && (
                      <XCircle
                        size={16}
                        className="text-red-600 mt-0.5 shrink-0"
                      />
                    )}
                    {!isCheckmark && !isCross && (
                      <span className="text-gray-400">•</span>
                    )}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: cleanStep.replace(
                          /\*\*(.*?)\*\*/g,
                          "<strong>$1</strong>"
                        ),
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {section.image && (
            <img
              src={section.image}
              alt={section.title}
              className="rounded-lg border my-4"
            />
          )}
        </section>
      ))}

      {/* Tips */}
      {content.tips && content.tips.length > 0 && (
        <div className="tips-block p-6 bg-green-50 border-l-4 border-green-500 rounded mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-green-600" />
            <h2 className="text-xl font-bold">Pro Tips</h2>
          </div>
          <ul className="space-y-2">
            {content.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <span>💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Mistakes */}
      {content.commonMistakes && content.commonMistakes.length > 0 && (
        <div className="mistakes-block p-6 bg-red-50 border-l-4 border-red-500 rounded mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-red-600" />
            <h2 className="text-xl font-bold">Common Mistakes to Avoid</h2>
          </div>
          <ul className="space-y-3">
            {content.commonMistakes.map((mistake, index) => (
              <li key={index}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources */}
      {content.resources && content.resources.length > 0 && (
        <div className="resources mb-8">
          <h2 className="text-xl font-bold mb-4">Additional Resources</h2>
          <div className="space-y-3">
            {content.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              >
                <ExternalLink size={16} />
                <div>
                  <div className="font-medium">{resource.title}</div>
                  <div className="text-xs text-gray-500">{resource.type}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Timeline Summary

| Phase     | Task                 | Time       | Cost   |
| --------- | -------------------- | ---------- | ------ |
| 1         | Install dependencies | 2h         | $0     |
| 2         | Custom extensions    | 4-6h       | $0     |
| 3         | Editor component     | 4-6h       | $0     |
| 4         | Node view components | 3-4h       | $0     |
| 5         | Database updates     | 1h         | $0     |
| 6         | Integration          | 2-3h       | $0     |
| 7         | Renderer             | 2-3h       | $0     |
| **Total** |                      | **18-25h** | **$0** |

---

## Testing Strategy

1. **Unit Tests** - Test custom extensions in isolation
2. **Integration Tests** - Test full editor flow (create → save → render)
3. **Manual Testing** - Create the Paper Recycling guide from mockup
4. **Performance Tests** - Ensure editor is responsive with large guides

---

## Migration Path

### For Existing Markdown Guides

```typescript
// Migration script to convert Markdown to structured content
async function migrateMarkdownGuides() {
  const guides = await getAllGuides();

  for (const guide of guides) {
    if (typeof guide.content === "string") {
      // Parse Markdown and convert to GuideContent structure
      const structured = parseMarkdownToGuideContent(guide.content);
      await updateGuide(guide.id, { content: structured });
    }
  }
}
```

---

## Success Criteria

- ✅ Can create the Paper Recycling guide from mockup
- ✅ Editor feels responsive (< 100ms interaction latency)
- ✅ Content structure matches mockup exactly
- ✅ Guides render beautifully on frontend
- ✅ No paid dependencies or API costs
- ✅ Bundle size increase < 150KB gzipped

---

## Future Enhancements (Post-MVP)

- Collaborative editing (Yjs integration)
- Version history
- Rich media uploads
- AI-powered content suggestions
- Export to PDF
- Print-optimized layouts
- Accessibility improvements (ARIA labels, keyboard nav)

---

## Questions/Decisions Needed

1. Should we allow HTML in content or sanitize everything?
2. Image hosting - use Supabase Storage or external CDN?
3. Max guide size limit (to prevent abuse)?
4. Should tips/warnings support rich formatting or plain text only?

---

**Ready to implement?** Let me know and I'll start with Phase 1!
