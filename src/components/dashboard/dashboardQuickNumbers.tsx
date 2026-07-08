import React from "react";
import statIcons from "./data";
export function DashboardQuickNumbers({
  loadingStats = true,
  stats,
}: {
  loadingStats?: boolean;
  stats?: any;
}) {
  return (
    <div className="numbers-grid">
      <QuickStat
        icon={statIcons.materials.icon}
        loadingStats={loadingStats}
        stat={stats?.materials}
        statKey="materials"
      />
      <QuickStat
        icon={statIcons.articles.icon}
        loadingStats={loadingStats}
        stat={stats?.articles}
        statKey="articles"
      />
      <QuickStat
        icon={statIcons.guides.icon}
        loadingStats={loadingStats}
        stat={stats?.guides}
        statKey="guides"
      />
      <QuickStat
        icon={statIcons.users.icon}
        loadingStats={loadingStats}
        stat={stats?.users}
        statKey="users"
      />
    </div>
  );
}

function QuickStat({
  icon: Icon,
  loadingStats,
  stat,
  statKey,
}: {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  loadingStats?: boolean;
  stat?: number;
  statKey: string;
}) {
  return (
    <div className="numbers-card">
      <div className="numbers-card-flex">
        <div className="numbers-card-icon">
          {Icon && (
            <Icon width={20} height={20} className="text-waste-recycle" />
          )}
        </div>
        <div>
          <p className="numbers-card-content">
            {statIcons[statKey as keyof typeof statIcons].label ?? "Stat"}
          </p>
          <p className="numbers-card-value">
            {loadingStats ? "..." : (stat ?? "—")}
          </p>
        </div>
      </div>
    </div>
  );
}
