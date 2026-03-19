// All available permissions in the system
export const PERMISSIONS = {
  // Materials
  "materials.create": "Create materials",
  "materials.edit": "Edit materials",
  "materials.delete": "Delete materials",
  "materials.batch": "Batch import/replace materials",

  // Material Articles
  "articles.create": "Create articles",
  "articles.edit.own": "Edit own articles",
  "articles.edit.any": "Edit any article",
  "articles.delete.own": "Delete own articles",
  "articles.delete.any": "Delete any article",

  // Guides
  "guides.create": "Create guides",
  "guides.edit.own": "Edit own guides",
  "guides.edit.any": "Edit any guide",
  "guides.delete.own": "Delete own guides",
  "guides.delete.any": "Delete any guide",

  // Blog
  "blog.create": "Create blog posts",
  "blog.edit.own": "Edit own blog posts",
  "blog.edit.any": "Edit any blog post",
  "blog.delete.own": "Delete own blog posts",
  "blog.delete.any": "Delete any blog post",

  // Users
  "users.view": "View all users",
  "users.manage": "Manage users (edit, delete)",
  "users.roles": "Change user roles",

  // Assets
  "assets.upload": "Upload assets",
  "assets.delete": "Delete assets",

  // Sources & Evidence
  "sources.manage": "Manage source library",
  "sources.upload": "Upload source PDFs & screenshots",

  // Calculations
  "calculations.run": "Run sustainability calculations",
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES: {
  label: string;
  permissions: Permission[];
}[] = [
  {
    label: "Materials",
    permissions: [
      "materials.create",
      "materials.edit",
      "materials.delete",
      "materials.batch",
    ],
  },
  {
    label: "Material Articles",
    permissions: [
      "articles.create",
      "articles.edit.own",
      "articles.edit.any",
      "articles.delete.own",
      "articles.delete.any",
    ],
  },
  {
    label: "Guides",
    permissions: [
      "guides.create",
      "guides.edit.own",
      "guides.edit.any",
      "guides.delete.own",
      "guides.delete.any",
    ],
  },
  {
    label: "Blog",
    permissions: [
      "blog.create",
      "blog.edit.own",
      "blog.edit.any",
      "blog.delete.own",
      "blog.delete.any",
    ],
  },
  {
    label: "User Management",
    permissions: ["users.view", "users.manage", "users.roles"],
  },
  {
    label: "Assets",
    permissions: ["assets.upload", "assets.delete"],
  },
  {
    label: "Sources & Evidence",
    permissions: ["sources.manage", "sources.upload"],
  },
  {
    label: "Calculations",
    permissions: ["calculations.run"],
  },
];

// Default permissions per role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  user: [
    "articles.create",
    "articles.edit.own",
    "articles.delete.own",
    "guides.create",
    "guides.edit.own",
    "guides.delete.own",
    "blog.create",
    "blog.edit.own",
    "blog.delete.own",
  ],
  staff: [
    "articles.create",
    "articles.edit.own",
    "articles.delete.own",
    "guides.create",
    "guides.edit.own",
    "guides.delete.own",
    "blog.create",
    "blog.edit.own",
    "blog.delete.own",
    "sources.upload",
  ],
  // Admin always has all permissions (hardcoded, not stored)
};
