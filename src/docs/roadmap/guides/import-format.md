# Guide Import Format

**Last Updated:** December 18, 2025

This document describes the JSON structure required for importing guides into WasteDB via the admin import feature in the Guide Editor.

## Overview

Guides can be imported by pasting JSON that matches the `GuideSubmission` type. The import will populate all form fields and the Tiptap rich text editor content.

## Required Structure

```json
{
  "title": "Your Guide Title",
  "slug": "your-guide-slug",
  "description": "A brief description of the guide (max 500 chars).",
  "method": "DIY",
  "content": {
    "type": "doc",
    "content": [
      // Array of TiptapNode objects
    ]
  }
}
```

## Field Reference

### Top-Level Fields

| Field                | Type                                             | Required | Description                                         |
| -------------------- | ------------------------------------------------ | -------- | --------------------------------------------------- |
| `title`              | string                                           | ✅       | Guide title (displayed in listings)                 |
| `slug`               | string                                           | ❌       | URL-friendly identifier (auto-generated if omitted) |
| `description`        | string                                           | ✅       | Brief description, used for previews and SEO        |
| `method`             | `"DIY"` \| `"Industrial"` \| `"Experimental"`    | ✅       | Guide category                                      |
| `difficulty_level`   | `"beginner"` \| `"intermediate"` \| `"advanced"` | ❌       | Skill level required                                |
| `estimated_time`     | string                                           | ❌       | e.g., "30 minutes", "2 hours"                       |
| `cover_image_url`    | string                                           | ❌       | URL to cover/hero image                             |
| `required_materials` | string[]                                         | ❌       | List of materials/tools needed                      |
| `tags`               | string[]                                         | ❌       | Searchable tags                                     |
| `material_id`        | string                                           | ❌       | UUID linking to a WasteDB material                  |
| `content`            | TiptapContent                                    | ✅       | Rich text content (see below)                       |

### Content Structure (TiptapContent)

The `content` field must be valid Tiptap JSON with `type: "doc"` as the root:

```json
{
  "type": "doc",
  "content": [
    // Array of TiptapNode
  ]
}
```

## Supported Node Types

### Standard Tiptap Nodes

| Node Type        | Description          | Has Attrs             | Has Content     |
| ---------------- | -------------------- | --------------------- | --------------- |
| `paragraph`      | Basic text paragraph | ❌                    | ✅ (text/marks) |
| `heading`        | Heading (h1-h6)      | `level` (1-6)         | ✅              |
| `bulletList`     | Unordered list       | ❌                    | ✅ (listItems)  |
| `orderedList`    | Numbered list        | ❌                    | ✅ (listItems)  |
| `listItem`       | List item            | ❌                    | ✅ (paragraph)  |
| `blockquote`     | Quote block          | ❌                    | ✅              |
| `codeBlock`      | Code snippet         | `language`            | ✅ (text)       |
| `horizontalRule` | Divider line         | ❌                    | ❌              |
| `image`          | Image embed          | `src`, `alt`, `title` | ❌              |

### Custom WasteDB Extensions

#### `section`

Collapsible section with title header.

```json
{
  "type": "section",
  "attrs": {
    "title": "Section Title Here"
  },
  "content": [
    // Paragraph, list, or other nodes
  ]
}
```

#### `tip`

Green-highlighted tip/advice box.

```json
{
  "type": "tip",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Pro tip: ..." }]
    }
  ]
}
```

#### `warning`

Yellow/orange-highlighted warning box.

```json
{
  "type": "warning",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Warning: ..." }]
    }
  ]
}
```

#### `resource`

External link resource with title.

```json
{
  "type": "resource",
  "attrs": {
    "title": "Resource Name",
    "url": "https://example.com/resource"
  }
}
```

#### `checkItem`

Checkable list item (green check or red cross).

```json
{
  "type": "checkItem",
  "attrs": {
    "checked": true,
    "variant": "check" // "check" (green ✓) or "cross" (red ✗)
  },
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Item text" }]
    }
  ]
}
```

### Text Marks

Text nodes can have marks for formatting:

```json
{
  "type": "text",
  "text": "Bold text here",
  "marks": [{ "type": "bold" }]
}
```

Supported marks:

- `bold` - **Bold text**
- `italic` - _Italic text_
- `underline` - Underlined text
- `strike` - ~~Strikethrough~~
- `code` - `Inline code`
- `link` - Hyperlink (attrs: `href`, `target`)

## Complete Example

```json
{
  "title": "Paper Recycling 101",
  "slug": "paper-recycling-101",
  "description": "Learn how to properly recycle paper products.",
  "method": "DIY",
  "difficulty_level": "beginner",
  "estimated_time": "8 minutes",
  "cover_image_url": "https://images.unsplash.com/photo-...",
  "required_materials": ["Paper products", "Recycling bin"],
  "tags": ["recycling", "paper", "beginner"],
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Introduction paragraph here." }]
      },
      {
        "type": "section",
        "attrs": { "title": "What Can Be Recycled?" },
        "content": [
          {
            "type": "bulletList",
            "content": [
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      {
                        "type": "text",
                        "text": "Office paper",
                        "marks": [{ "type": "bold" }]
                      },
                      {
                        "type": "text",
                        "text": " - printer paper, notebook paper"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "tip",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Set up a dedicated paper bin to make it a habit!"
              }
            ]
          }
        ]
      },
      {
        "type": "resource",
        "attrs": {
          "title": "EPA Paper Recycling Guide",
          "url": "https://www.epa.gov/recycle"
        }
      }
    ]
  }
}
```

## Import Validation

The import function validates:

1. **JSON syntax** - Must be valid JSON
2. **Content structure** - Must have `content.type === "doc"`
3. **Required fields** - Title, description, method, and content are required

If validation fails, an error toast will display the issue.

## Tips for Successful Import

1. **Test with a minimal example first** - Start with just title, description, method, and a simple paragraph
2. **Use an online JSON validator** - Validate syntax before importing
3. **Check node nesting** - Lists require `listItem` wrappers, sections need `attrs.title`
4. **Escape special characters** - Quotes and backslashes in text need escaping

## TypeScript Types

For programmatic generation, see `src/types/guide.ts`:

```typescript
interface TiptapContent {
  type: "doc";
  content: TiptapNode[];
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

type GuideMethod = "DIY" | "Industrial" | "Experimental";
```

## Related Documentation

- [Guide System Roadmap](./README.md)
- [Tiptap JSON Documentation](https://tiptap.dev/docs/editor/guide/output-json-html)
