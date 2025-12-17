import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Eye,
  Clock,
  Wrench,
  Factory,
  FlaskConical,
  Edit,
  Trash2,
} from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import GuideRenderer from "../editor/GuideRenderer";
import { Guide, GuideSubmission } from "../../types/guide";
import { getGuideById, updateGuide, deleteGuide } from "../../utils/guides";
import { EditGuideForm } from "../forms/EditGuideForm";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { toast } from "sonner";

interface GuideDetailViewProps {
  guideId: string;
  onBack: () => void;
}

export function GuideDetailView({ guideId, onBack }: GuideDetailViewProps) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { materials } = useMaterialsContext();
  const { user } = useAuthContext();

  useEffect(() => {
    loadGuide();
  }, [guideId]);

  const loadGuide = async () => {
    setIsLoading(true);
    try {
      const fetchedGuide = await getGuideById(guideId);
      console.log("Fetched guide:", fetchedGuide);
      console.log("Guide content:", fetchedGuide?.content);
      setGuide(fetchedGuide);
    } catch (error) {
      console.error("Error loading guide:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleUpdateGuide = async (
    id: string,
    updates: Partial<GuideSubmission>
  ) => {
    try {
      const updatedGuide = await updateGuide(id, updates);
      if (updatedGuide) {
        setGuide(updatedGuide);
        toast.success("Guide updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update guide. Please try again.");
      throw error;
    }
  };

  const handleDeleteGuide = async () => {
    if (!guide) return;

    try {
      const success = await deleteGuide(guide.id);
      if (success) {
        toast.success("Guide deleted successfully!");
        onBack(); // Navigate back to guides list
      } else {
        toast.error("Failed to delete guide. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to delete guide. Please try again.");
      console.error("Error deleting guide:", error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Check if current user can edit this guide
  const canEdit = user && guide && guide.created_by === user.id;

  // Debug logging
  console.log("Edit permission check:", {
    hasUser: !!user,
    userId: user?.id,
    hasGuide: !!guide,
    guideAuthorId: guide?.created_by,
    canEdit,
  });

  const getIconForMethod = (method: string) => {
    switch (method) {
      case "DIY":
        return Wrench;
      case "Industrial":
        return Factory;
      case "Experimental":
        return FlaskConical;
      default:
        return Wrench;
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Loading..." onBack={onBack}>
        <div className="text-center py-12">
          <p className="text-[13px] text-black/60 dark:text-white/60">
            Loading guide...
          </p>
        </div>
      </PageTemplate>
    );
  }

  if (!guide) {
    return (
      <PageTemplate title="Guide Not Found" onBack={onBack}>
        <div className="text-center py-12">
          <p className="text-[13px] text-black/60 dark:text-white/60">
            Guide not found.
          </p>
        </div>
      </PageTemplate>
    );
  }

  const Icon = getIconForMethod(guide.method);

  return (
    <>
      {/* Cover Image as Background Hero */}
      {guide.cover_image_url && (
        <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden relative">
          <img
            src={guide.cover_image_url}
            alt={guide.title}
            className="w-full h-full object-cover"
            onLoad={() =>
              console.log("Image loaded successfully:", guide.cover_image_url)
            }
            onError={(e) =>
              console.error("Image failed to load:", guide.cover_image_url, e)
            }
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#f5f3ed] dark:to-[#1a1817]" />

          {/* Back button and title overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={onBack}
                className="card-interactive bg-white dark:bg-[#2a2825]"
                aria-label="Back"
              >
                <ArrowLeft size={16} className="text-black dark:text-white" />
              </button>

              {/* Title */}
              <div className="flex-1">
                <h1 className="text-[20px] md:text-[24px] normal text-white drop-shadow-lg">
                  {guide.title}
                </h1>
              </div>

              {/* Edit/Delete buttons on hero */}
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="retro-button flex items-center gap-2 shrink-0"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="retro-button flex items-center gap-2 shrink-0 arcade-bg-red arcade-btn-red"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PageTemplate
        title={guide.title}
        onBack={onBack}
        hideBackButton={!!guide.cover_image_url}
        className={guide.cover_image_url ? "-mt-16" : ""}
      >
        {/* Guide Info Card */}
        <div className="retro-card p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-box bg-[--waste-science]/10 border-waste-science">
              <Icon size={24} className="text-waste-science" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-[24px] font-display text-black dark:text-white">
                  {guide.title}
                </h1>
                {!guide.cover_image_url && canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="retro-button flex items-center gap-2 shrink-0"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="retro-button flex items-center gap-2 shrink-0 arcade-bg-red arcade-btn-red"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[14px] text-black/60 dark:text-white/60 mb-4">
                {guide.description}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <span className="tag-cyan">{guide.method}</span>
                {guide.material_name && (
                  <span className="tag-green">{guide.material_name}</span>
                )}
                {guide.difficulty_level && (
                  <span className="tag-yellow">{guide.difficulty_level}</span>
                )}
                {guide.estimated_time && (
                  <span className="tag-gray flex items-center gap-1">
                    <Clock size={12} />
                    {guide.estimated_time}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Author & Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-[#211f1c]/10 dark:border-white/10">
            <div className="text-[11px] text-black/50 dark:text-white/50">
              By {guide.author_name || "Anonymous"}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-black/50 dark:text-white/50">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {guide.views_count || 0} views
              </span>
            </div>
          </div>
        </div>

        {/* Required Materials */}
        {guide.required_materials && guide.required_materials.length > 0 && (
          <div className="retro-card p-4 mb-6">
            <h2 className="text-[14px] font-display mb-3 text-black dark:text-white">
              Required Materials
            </h2>
            <ul className="list-disc list-inside space-y-1">
              {guide.required_materials.map((material, index) => (
                <li
                  key={index}
                  className="text-[13px] text-black/70 dark:text-white/70"
                >
                  {material}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guide Content */}
        <div className="retro-card p-6 mb-6">
          <GuideRenderer content={guide.content} />
        </div>

        {/* Tags */}
        {guide.tags && guide.tags.length > 0 && (
          <div className="retro-card p-4">
            <h2 className="text-[11px] text-black/50 dark:text-white/50 mb-2">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {guide.tags.map((tag, index) => (
                <span key={index} className="tag-gray text-[11px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {showEditForm && guide && (
          <EditGuideForm
            guide={guide}
            materials={materials}
            onClose={() => setShowEditForm(false)}
            onSubmit={handleUpdateGuide}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="retro-card w-full max-w-md p-6">
              <h2 className="text-[18px] font-display mb-4 text-black dark:text-white">
                Delete Guide?
              </h2>
              <p className="text-[13px] text-black/60 dark:text-white/60 mb-6">
                Are you sure you want to delete "{guide?.title}"? This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="retro-button flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGuide}
                  className="retro-button flex-1 arcade-bg-red arcade-btn-red"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTemplate>
    </>
  );
}
