import { ReactNode } from "react";

interface SidebarProps {
  side: "left" | "right";
  children: ReactNode;
}

export function Sidebar({ side, children }: SidebarProps) {
  const border =
    side === "left"
      ? "border-r-[1.5px] border-[#211f1c] dark:border-white/20"
      : "border-l-[1.5px] border-[#211f1c] dark:border-white/20";

  return (
    <aside className={`hidden md:block w-52 lg:w-64 shrink-0 ${border}`}>
      <div className="sticky top-0 max-h-[calc(100vh-100px)] overflow-y-auto">
        {children}
      </div>
    </aside>
  );
}
