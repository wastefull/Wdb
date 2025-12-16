import { Search, BookOpen, Newspaper, Info, Heart } from "lucide-react";

export type NavTabId = "search" | "guides" | "blog" | "about" | "donate";
export type NavTabColor = "reuse" | "science" | "recycle" | "compost";

export interface NavTabsProps {
  /** Currently active tab */
  activeTab?: NavTabId;
  /** Tab change handler */
  onTabChange?: (tab: NavTabId) => void;
}

const tabs: {
  id: NavTabId;
  label: string;
  icon: React.ReactNode;
  color: NavTabColor;
}[] = [
  { id: "search", label: "Search", icon: <Search size={14} />, color: "reuse" },
  {
    id: "guides",
    label: "Guides",
    icon: <BookOpen size={14} />,
    color: "science",
  },
  {
    id: "blog",
    label: "Blog",
    icon: <Newspaper size={14} />,
    color: "recycle",
  },
  { id: "about", label: "About", icon: <Info size={14} />, color: "reuse" },
  {
    id: "donate",
    label: "Donate",
    icon: <Heart size={14} />,
    color: "compost",
  },
];

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  const activeTabColor = tabs.find((t) => t.id === activeTab)?.color;

  return (
    <nav className="nav-tabs" data-color={activeTabColor}>
      <div className="nav-tabs-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`nav-tab ${
              activeTab === tab.id ? "nav-tab-active" : ""
            }`}
            data-color={tab.color}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === "search" && <span className="nav-tab-badge">Beta</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
