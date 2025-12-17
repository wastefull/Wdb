import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Wrench,
  Factory,
  FlaskConical,
  Plus,
  Clock,
  Leaf,
  Recycle,
  Palette,
  Settings,
} from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { SubmitGuideForm } from "../forms";
import { Guide, GuideMethod } from "../../types/guide";
import { getPublishedGuides, createGuide } from "../../utils/guides";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useNavigationContext } from "../../contexts/NavigationContext";
import { toast } from "sonner";

type GuideCategory = "all" | "composting" | "recycling" | "art" | "repair";

interface GuidesViewProps {
  onBack: () => void;
}

export function GuidesView({ onBack }: GuidesViewProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<GuideCategory>("all");
  const { materials } = useMaterialsContext();
  const { isAuthenticated } = useAuthContext();
  const { navigateTo } = useNavigationContext();

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    setIsLoading(true);
    const fetchedGuides = await getPublishedGuides();
    setGuides(fetchedGuides);
    setIsLoading(false);
  };

  const handleSubmitGuide = async (guideData: any) => {
    try {
      await createGuide(guideData);
      toast.success("Guide submitted successfully!");
      await loadGuides();
    } catch (error) {
      toast.error("Failed to submit guide");
      console.error(error);
    }
  };

  const getIconForMethod = (method: string) => {
    switch (method) {
      case "DIY":
        return Wrench;
      case "Industrial":
        return Factory;
      case "Experimental":
        return FlaskConical;
      default:
        return BookOpen;
    }
  };

  const getIconClassForMethod = (method: string) => {
    switch (method) {
      case "DIY":
        return "arcade-bg-green arcade-btn-green";
      case "Industrial":
        return "arcade-bg-cyan arcade-btn-cyan";
      case "Experimental":
        return "arcade-bg-amber arcade-btn-amber";
      default:
        return "arcade-bg-green arcade-btn-green";
    }
  };

  const getCategoryIcon = (category: GuideCategory) => {
    switch (category) {
      case "composting":
        return Leaf;
      case "recycling":
        return Recycle;
      case "art":
        return Palette;
      case "repair":
        return Settings;
      default:
        return BookOpen;
    }
  };

  const getCategoryColor = (category: GuideCategory) => {
    switch (category) {
      case "composting":
        return "arcade-bg-green arcade-btn-green";
      case "recycling":
        return "arcade-bg-cyan arcade-btn-cyan";
      case "art":
        return "arcade-bg-amber arcade-btn-amber";
      case "repair":
        return "arcade-bg-red arcade-btn-red";
      default:
        return "arcade-bg-gray";
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "beginner":
        return "tag-green";
      case "intermediate":
        return "tag-yellow";
      case "advanced":
        return "tag-red";
      default:
        return "tag-gray";
    }
  };

  // Map guides to categories based on tags
  const getGuideCategory = (guide: Guide): GuideCategory => {
    if (!guide.tags) return "all";
    const tags = guide.tags.map((t) => t.toLowerCase());
    if (tags.includes("composting")) return "composting";
    if (tags.includes("recycling")) return "recycling";
    if (tags.includes("art") || tags.includes("creative")) return "art";
    if (tags.includes("repair") || tags.includes("maintenance"))
      return "repair";
    return "all";
  };

  // Filter guides by category
  const filteredGuides =
    selectedCategory === "all"
      ? guides
      : guides.filter((guide) => getGuideCategory(guide) === selectedCategory);

  return (
    <PageTemplate
      title="Guides"
      description="Practical guides to help you compost, recycle, create, and repair sustainably"
      onBack={onBack}
    >
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`retro-button text-[12px] ${
            selectedCategory === "all" ? "arcade-bg-gray" : ""
          }`}
        >
          All Guides
        </button>
        <button
          onClick={() => setSelectedCategory("composting")}
          className={`retro-button text-[12px] ${
            selectedCategory === "composting"
              ? getCategoryColor("composting")
              : ""
          }`}
        >
          <Leaf
            size={14}
            className="inline-block mr-1.5 text-green-600 dark:text-green-400"
          />
          Composting
        </button>
        <button
          onClick={() => setSelectedCategory("recycling")}
          className={`retro-button text-[12px] ${
            selectedCategory === "recycling"
              ? getCategoryColor("recycling")
              : ""
          }`}
        >
          <Recycle
            size={14}
            className="inline-block mr-1.5 text-blue-600 dark:text-blue-400"
          />
          Recycling
        </button>
        <button
          onClick={() => setSelectedCategory("art")}
          className={`retro-button text-[12px] ${
            selectedCategory === "art" ? getCategoryColor("art") : ""
          }`}
        >
          <Palette
            size={14}
            className="inline-block mr-1.5 text-purple-600 dark:text-purple-400"
          />
          Creative Reuse & Art
        </button>
        <button
          onClick={() => setSelectedCategory("repair")}
          className={`retro-button text-[12px] ${
            selectedCategory === "repair" ? getCategoryColor("repair") : ""
          }`}
        >
          <Settings size={14} className="inline-block mr-1.5" />
          Repair & Maintenance
        </button>
      </div>

      {/* Regular Guides List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-[13px] text-black/60 dark:text-white/60">
            Loading guides...
          </p>
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen
            size={48}
            className="mx-auto mb-4 text-black/30 dark:text-white/30"
          />
          <p className="text-[13px] text-black/60 dark:text-white/60 mb-4">
            {selectedCategory === "all"
              ? "No guides available yet. Be the first to submit one!"
              : `No ${selectedCategory} guides available yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => {
            const Icon = getIconForMethod(guide.method);
            return (
              <button
                key={guide.id}
                className="retro-card-button text-left overflow-hidden group"
                onClick={() => {
                  navigateTo({ type: "guide-detail", guideId: guide.id });
                }}
              >
                {/* Thumbnail */}
                {guide.cover_image_url && (
                  <div className="w-full h-48 overflow-hidden mb-4">
                    <img
                      src={guide.cover_image_url}
                      alt={guide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="p-4">
                  {/* Badges: Difficulty, Method, Material */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {guide.difficulty_level && (
                      <span
                        className={`tag-sm ${getDifficultyColor(
                          guide.difficulty_level
                        )}`}
                      >
                        {guide.difficulty_level}
                      </span>
                    )}
                    <span className="tag-sm tag-cyan">{guide.method}</span>
                    {guide.material_name && (
                      <span className="tag-sm tag-green">
                        {guide.material_name}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[16px] font-display mb-2 text-black dark:text-white">
                    {guide.title}
                  </h3>

                  {/* Description snippet */}
                  <p className="text-[12px] text-black/60 dark:text-white/60 mb-3 line-clamp-2">
                    {guide.description}
                  </p>

                  {/* Time estimate at bottom */}
                  {guide.estimated_time && (
                    <div className="flex items-center gap-1 text-[11px] text-black/50 dark:text-white/50">
                      <Clock size={10} />
                      {guide.estimated_time}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 border border-[#211f1c]/20 dark:border-white/20 rounded-lg">
        <p className="text-[12px] text-black/60 dark:text-white/60">
          <BookOpen size={16} className="inline-block mr-2" />
          Guides are community-contributed resources related to specific
          materials and methods. They differ from articles by providing
          step-by-step instructions and practical advice.
        </p>
      </div>

      {/* Submit Button - always visible at bottom */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            if (!isAuthenticated) {
              toast.error("Please sign in to submit a guide");
              return;
            }
            setShowSubmitForm(true);
          }}
          className="retro-btn-primary px-6 py-3 bg-waste-science text-black text-[13px] flex items-center gap-2"
        >
          <Plus size={18} />
          Submit a Guide
        </button>
      </div>

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <SubmitGuideForm
          onClose={() => setShowSubmitForm(false)}
          onSubmit={handleSubmitGuide}
          materials={materials}
        />
      )}
    </PageTemplate>
  );
}
