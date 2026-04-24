import { useState } from "react";
import { Eye } from "lucide-react";
import { CategoryType } from "../../types/material";
import { getArticleCount } from "../../utils/materialArticles";
import { AnimatedWasteChart } from "../charts";
import { useNavigationContext } from "../../contexts/NavigationContext";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useAccessibility } from "./AccessibilityContext";

export function MaterialsDonutChart() {
  const [showChart, setShowChart] = useState(false);
  const { navigateTo } = useNavigationContext();
  const { materials } = useMaterialsContext();
  const { user, userRole } = useAuthContext();
  const { settings } = useAccessibility();

  const isAdminModeActive = !!(
    user &&
    userRole === "admin" &&
    settings.adminMode
  );

  if (!materials.length) return null;

  if (isAdminModeActive && !showChart) {
    return (
      <div className="mt-4 flex items-center justify-center">
        <button
          onClick={() => setShowChart(true)}
          className="p-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-waste-recycle hover:bg-waste-recycle/80 transition-all hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]"
          aria-label="Show chart (work in progress)"
        >
          <Eye size={32} className="text-black" />
        </button>
      </div>
    );
  }

  if (!showChart) return null;

  const chartData = [
    {
      name: "Compostable",
      shortName: "compostable",
      categoryKey: "compostability",
      value: Math.round(
        materials.reduce((sum, m) => sum + m.compostability, 0) /
          materials.length,
      ),
      articleCount: materials.reduce(
        (sum, m) => sum + getArticleCount(m, "compostability"),
        0,
      ),
      fill: "#e8a593",
    },
    {
      name: "Recyclable",
      shortName: "recyclable",
      categoryKey: "recyclability",
      value: Math.round(
        materials.reduce((sum, m) => sum + m.recyclability, 0) /
          materials.length,
      ),
      articleCount: materials.reduce(
        (sum, m) => sum + getArticleCount(m, "recyclability"),
        0,
      ),
      fill: "#f0e68c",
    },
    {
      name: "Reusable",
      shortName: "reusable",
      categoryKey: "reusability",
      value: Math.round(
        materials.reduce((sum, m) => sum + m.reusability, 0) / materials.length,
      ),
      articleCount: materials.reduce(
        (sum, m) => sum + getArticleCount(m, "reusability"),
        0,
      ),
      fill: "#a8c5d8",
    },
  ];

  return (
    <div className="mt-6 w-full max-w-md">
      <AnimatedWasteChart
        chartData={chartData}
        onCategoryClick={(categoryKey) =>
          navigateTo({
            type: "all-articles",
            category: categoryKey as CategoryType,
          })
        }
      />
    </div>
  );
}
