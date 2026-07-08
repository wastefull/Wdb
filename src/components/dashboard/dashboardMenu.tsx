import type { ReactNode } from "react";
import { AlertTriangle, Database, FlaskConical, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { BackButton } from "../ui/backButton";
import {
  AdminDashboardProps,
  DashboardActionMap,
  DashboardLink,
  DashboardLinkCategory,
  DashboardType,
  getDashboardProps,
  StaffDashboardProps,
  toDashboardActionMap,
} from "./data";

interface DashboardMenuProps {
  menuType: DashboardType;
  onBack: () => void;
  navProps: AdminDashboardProps | StaffDashboardProps;
}

export function DashboardMenu({
  menuType,
  onBack,
  navProps,
}: DashboardMenuProps) {
  const { dashboardName, sections, links } = getDashboardProps(menuType);
  const actionMap = toDashboardActionMap(navProps);

  return (
    <aside className="dashboard-menu">
      <div>
        <BackButton onBack={onBack} />
      </div>

      <h2>{dashboardName}</h2>

      <Accordion type="multiple" className="w-full">
        {sections.map((section) => (
          <MenuSection
            key={section}
            title={section}
            menuType={menuType}
            actionMap={actionMap}
            section={section}
            links={links.filter((link) => link.category === section)}
          />
        ))}
      </Accordion>
    </aside>
  );
}

export function MenuSection({
  title,
  menuType,
  actionMap,
  links,
  section,
}: {
  title: string;
  menuType: DashboardType;
  actionMap: DashboardActionMap;
  links: DashboardLink[];
  section: DashboardLinkCategory;
}) {
  const iconBySection: Record<DashboardLinkCategory, ReactNode> = {
    [DashboardLinkCategory.Moderation]: <AlertTriangle size={24} />,
    [DashboardLinkCategory.Admin]: <Users size={24} />,
    [DashboardLinkCategory.Database]: <Database size={24} />,
    [DashboardLinkCategory.Testing]: <FlaskConical size={24} />,
  };

  const icon = iconBySection[section];

  const isStaffTestingSection =
    menuType === "staff" && section === DashboardLinkCategory.Testing;

  const transformTestingLink = links.find(
    (link) => link.key === "transformTesting",
  );
  const chartsLink = links.find((link) => link.key === "charts");
  const roadmapLink = links.find((link) => link.key === "roadmapOverview");

  return (
    <AccordionItem value={section}>
      <AccordionTrigger>
        <span>{icon}</span>
        <span> {title}</span>
      </AccordionTrigger>
      <AccordionContent>
        <>
          {isStaffTestingSection ? (
            <>
              {transformTestingLink &&
                typeof actionMap[transformTestingLink.action] ===
                  "function" && (
                  <button
                    onClick={() => actionMap[transformTestingLink.action]?.()}
                    className="menu-item"
                  >
                    {transformTestingLink.label}
                  </button>
                )}

              {chartsLink &&
                typeof actionMap[chartsLink.action] === "function" && (
                  <>
                    <div className="menu-subheader">Performance</div>
                    <button
                      onClick={() => actionMap[chartsLink.action]?.()}
                      className="menu-item-nested"
                    >
                      {chartsLink.label}
                    </button>
                  </>
                )}

              {roadmapLink &&
                typeof actionMap[roadmapLink.action] === "function" && (
                  <>
                    <div className="menu-subheader">Roadmap</div>
                    <button
                      onClick={() => actionMap[roadmapLink.action]?.()}
                      className="menu-item-nested"
                    >
                      {roadmapLink.label}
                    </button>
                  </>
                )}
            </>
          ) : (
            links.map((link) => {
              const action = actionMap[link.action];
              if (typeof action !== "function") {
                return null;
              }

              return (
                <button
                  key={link.key}
                  onClick={() => action()}
                  className="menu-item"
                >
                  {link.label}
                </button>
              );
            })
          )}
        </>
      </AccordionContent>
    </AccordionItem>
  );
}
