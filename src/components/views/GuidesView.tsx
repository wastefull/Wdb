import React, { useState, useEffect } from "react";
import { BookOpen, Wrench, Factory, FlaskConical, Plus } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { SubmitGuideForm } from "../forms";
import { Guide } from "../../types/guide";
import { getPublishedGuides, createGuide } from "../../utils/guides";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { toast } from "sonner";

interface GuidesViewProps {
  onBack: () => void;
}

export function GuidesView({ onBack }: GuidesViewProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const { materials } = useMaterialsContext();
  const { isAuthenticated } = useAuthContext();

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

  return (
    <PageTemplate
      title="Guides"
      description="Step-by-step guides for different waste management methods and materials"
      onBack={onBack}
    >
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-[13px] text-black/60 dark:text-white/60">
            Loading guides...
          </p>
        </div>
      ) : guides.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen
            size={48}
            className="mx-auto mb-4 text-black/30 dark:text-white/30"
          />
          <p className="text-[13px] text-black/60 dark:text-white/60 mb-4">
            No guides available yet. Be the first to submit one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide) => {
            const Icon = getIconForMethod(guide.method);
            return (
              <button
                key={guide.id}
                className="retro-card-button p-6 text-left"
                onClick={() => {
                  // TODO: Navigate to guide detail
                  console.log("Navigate to guide:", guide.id);
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`icon-box ${getIconClassForMethod(
                      guide.method
                    )}`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] normal mb-2">{guide.title}</h3>
                    <p className="text-[12px] text-black/60 dark:text-white/60 mb-2">
                      {guide.description}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="tag-cyan">{guide.method}</span>
                      {guide.material_name && (
                        <span className="tag-green">{guide.material_name}</span>
                      )}
                      {guide.difficulty_level && (
                        <span className="tag-yellow">
                          {guide.difficulty_level}
                        </span>
                      )}
                    </div>
                  </div>
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
