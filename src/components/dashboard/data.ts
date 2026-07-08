import { BookOpen, FileText, Package, Users } from "lucide-react";

export enum DashboardLinkCategory {
  Moderation = "Moderation",
  Admin = "Admin",
  Database = "Database",
  Testing = "Testing",
}

export type DashboardType = "admin" | "staff";
type RoadmapNavigation = (section?: string) => void;

export interface DashboardBaseProps {
  onBack: () => void;
  onNavigateToDataManagement?: () => void;
  onNavigateToSourceLibrary?: () => void;
  onNavigateToEvidenceLab?: () => void;
  onNavigateToCurationWorkbench?: () => void;
  onNavigateToTransformTesting?: () => void;
  onNavigateToCharts?: () => void;
  onNavigateToRoadmapOverview?: RoadmapNavigation;
}

export interface StaffDashboardProps extends DashboardBaseProps {}

export interface AdminDashboardProps extends DashboardBaseProps {
  onNavigateToReviewCenter?: () => void;
  onNavigateToUserManagement?: () => void;
  onNavigateToWhitepaperSync?: () => void;
  onNavigateToTransformManager?: () => void;
  onNavigateToAdminTakedownList?: () => void;
  onNavigateToAuditLog?: () => void;
  onNavigateToDataRetention?: () => void;
  onNavigateToWhitepapers?: () => void;
  onNavigateToAssets?: () => void;
  onNavigateToRolePermissions?: () => void;
  onNavigateToCategoryColors?: () => void;
  onNavigateToCategoriesManagement?: () => void;
  onNavigateToMath?: () => void;
  onNavigateToSourceComparison?: () => void;
  onNavigateToContentManagement?: () => void;
  onNavigateToMaintenanceMode?: () => void;
  onNavigateToOneTimeActions?: () => void;
}

export type GenericDashboardProps =
  | ({ type: "admin" } & AdminDashboardProps)
  | ({ type: "staff" } & StaffDashboardProps);

export type DashboardActionKey = keyof Omit<AdminDashboardProps, "onBack">;

export interface DashboardLink {
  key: string;
  action: DashboardActionKey;
  label: string;
  category: DashboardLinkCategory;
}

const statIcons = {
  materials: {
    icon: Package,
    label: "Materials",
  },
  articles: {
    icon: FileText,
    label: "Articles",
  },
  guides: {
    icon: BookOpen,
    label: "Guides",
  },
  users: {
    icon: Users,
    label: "Users",
  },
};
export default statIcons;

const ALL_DASHBOARD_LINKS: DashboardLink[] = [
  {
    key: "reviewCenter",
    action: "onNavigateToReviewCenter",
    label: "Review Center",
    category: DashboardLinkCategory.Moderation,
  },
  {
    key: "dataManagement",
    action: "onNavigateToDataManagement",
    label: "Materials",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "userManagement",
    action: "onNavigateToUserManagement",
    label: "User Management",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "whitepaperSync",
    action: "onNavigateToWhitepaperSync",
    label: "Whitepaper Sync",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "transformManager",
    action: "onNavigateToTransformManager",
    label: "Transform Manager",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "adminTakedownList",
    action: "onNavigateToAdminTakedownList",
    label: "Admin Takedown List",
    category: DashboardLinkCategory.Moderation,
  },
  {
    key: "auditLog",
    action: "onNavigateToAuditLog",
    label: "Audit Log",
    category: DashboardLinkCategory.Moderation,
  },
  {
    key: "dataRetention",
    action: "onNavigateToDataRetention",
    label: "Data Retention",
    category: DashboardLinkCategory.Moderation,
  },
  {
    key: "whitepapers",
    action: "onNavigateToWhitepapers",
    label: "Whitepapers",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "assets",
    action: "onNavigateToAssets",
    label: "Assets",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "rolePermissions",
    action: "onNavigateToRolePermissions",
    label: "Role Permissions",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "categoryColors",
    action: "onNavigateToCategoryColors",
    label: "Category Colors",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "categoriesManagement",
    action: "onNavigateToCategoriesManagement",
    label: "Categories Management",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "math",
    action: "onNavigateToMath",
    label: "Math",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "charts",
    action: "onNavigateToCharts",
    label: "Charts",
    category: DashboardLinkCategory.Testing,
  },
  {
    key: "roadmapOverview",
    action: "onNavigateToRoadmapOverview",
    label: "Overview",
    category: DashboardLinkCategory.Testing,
  },
  {
    key: "sourceLibrary",
    action: "onNavigateToSourceLibrary",
    label: "Source Library",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "sourceComparison",
    action: "onNavigateToSourceComparison",
    label: "Source Comparison",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "evidenceLab",
    action: "onNavigateToEvidenceLab",
    label: "Evidence Lab",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "contentManagement",
    action: "onNavigateToContentManagement",
    label: "Content Management",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "curationWorkbench",
    action: "onNavigateToCurationWorkbench",
    label: "Curation Workbench",
    category: DashboardLinkCategory.Database,
  },
  {
    key: "transformTesting",
    action: "onNavigateToTransformTesting",
    label: "Transform Formula Testing",
    category: DashboardLinkCategory.Testing,
  },
  {
    key: "maintenanceMode",
    action: "onNavigateToMaintenanceMode",
    label: "Maintenance Mode",
    category: DashboardLinkCategory.Admin,
  },
  {
    key: "oneTimeActions",
    action: "onNavigateToOneTimeActions",
    label: "One Time Actions",
    category: DashboardLinkCategory.Admin,
  },
];

const STAFF_LINK_KEYS = [
  "dataManagement",
  "evidenceLab",
  "curationWorkbench",
  "transformTesting",
  "charts",
  "roadmapOverview",
] as const;

const linkByKey = Object.fromEntries(
  ALL_DASHBOARD_LINKS.map((link) => [link.key, link]),
) as Record<string, DashboardLink>;

export const ADMIN_DASHBOARD_LINKS = ALL_DASHBOARD_LINKS;

export const STAFF_DASHBOARD_LINKS: DashboardLink[] = STAFF_LINK_KEYS.map(
  (key) => linkByKey[key],
);

export type DashboardActionMap = Partial<
  Record<DashboardActionKey, (...args: unknown[]) => void>
>;

export function getDashboardLinks(view: DashboardType): DashboardLink[] {
  return view === "admin" ? ADMIN_DASHBOARD_LINKS : STAFF_DASHBOARD_LINKS;
}

export function getDashboardSections(
  view: DashboardType,
): DashboardLinkCategory[] {
  return view === "admin"
    ? Object.values(DashboardLinkCategory)
    : [DashboardLinkCategory.Database, DashboardLinkCategory.Testing];
}

export function getDashboardProps(view: DashboardType): {
  dashboardName: string;
  links: DashboardLink[];
  sections: DashboardLinkCategory[];
} {
  return {
    dashboardName: view === "admin" ? "Admin Dashboard" : "Staff Dashboard",
    links: getDashboardLinks(view),
    sections: getDashboardSections(view),
  };
}

export function toDashboardActionMap(
  props: AdminDashboardProps | StaffDashboardProps,
): DashboardActionMap {
  const { onBack: _onBack, ...actions } = props;
  return actions as DashboardActionMap;
}
