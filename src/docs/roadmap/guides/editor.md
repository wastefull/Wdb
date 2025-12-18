# Guide Editor

## **Updated:** December 18, 2025

## **Status:** Implemented

# Overview

Implement a rich structured editor for guides using Tiptap with custom extensions. This will allow guide authors to create richly formatted content with specialized blocks for tips, warnings, steps, and resources - all stored as JSONB in the database.

---

## Dependencies

- `@tiptap/react` - React wrapper (~30KB gzipped)

- `@tiptap/starter-kit` - Basic formatting (bold, italic, lists, etc.)

- `@tiptap/extension-image` - Image support

- `@tiptap/extension-link` - Link support

- `@tiptap/extension-placeholder` - Placeholder text

---

# Custom Extensions

### Created Custom Node Types

- Section Block (`/src/components/editor/extensions/Section.ts`)

- Tip Block (`/src/components/editor/extensions/Tip.ts`)

- Warning Block (`/src/components/editor/extensions/Warning.ts`)

- Step List (`/src/components/editor/extensions/StepList.ts`)

- Resource Block (`/src/components/editor/extensions/Resource.ts`)

# Editor

- Main Guide Editor (`/src/components/editor/GuideEditor.tsx`)

- Editor Toolbar (`/src/components/editor/EditorToolbar.tsx`)

- Section Component (`/src/components/editor/nodes/SectionComponent.tsx`)

- Tip Component (`/src/components/editor/nodes/TipComponent.tsx`)

- Warning Component (`/src/components/editor/nodes/WarningComponent.tsx`)

- Resource Component (`/src/components/editor/nodes/ResourceComponent.tsx`)

- Updated Guide Types (`/src/types/guide.ts`)

- Migrated SQL (`/supabase/migrations/20251217000002_update_guides_structure.sql`)

- Updated SubmitGuideForm Component (`/src/components/forms/SubmitGuideForm.tsx`)

- Created GuideRenderer Component (`/src/components/guides/GuideRenderer.tsx`)

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

## Future Enhancement Ideas

- Collaborative editing (Yjs integration)
- Version history
- Rich media uploads
- AI-powered content suggestions
- Export to PDF
- Print-optimized layouts
- Accessibility improvements (ARIA labels, keyboard nav)
