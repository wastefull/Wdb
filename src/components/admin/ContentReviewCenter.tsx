import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  Flag,
  Package,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import * as api from "../../utils/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ReviewModal } from "../shared/ReviewModal";

interface Submission {
  id: string;
  type:
    | "new_material"
    | "edit_material"
    | "new_article"
    | "update_article"
    | "delete_material"
    | "delete_article";
  content_data: any;
  original_content_id?: string;
  status:
    | "pending_review"
    | "approved"
    | "rejected"
    | "needs_revision"
    | "flagged";
  feedback?: string;
  submitted_by: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  flagged_reason?: string;
}

interface ContentReviewCenterProps {
  onBack: () => void;
  currentUserId: string;
}

export function ContentReviewCenter({
  onBack,
  currentUserId,
}: ContentReviewCenterProps) {
  const [activeTab, setActiveTab] = useState<
    "review" | "pending" | "moderation"
  >("review");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await api.getSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleFlag = async (submission: Submission) => {
    const reason = prompt("Enter reason for flagging this submission:");
    if (!reason) return;

    try {
      await api.updateSubmission(submission.id, {
        status: "flagged",
        feedback: reason,
        reviewed_by: currentUserId,
      });
      toast.success("Submission flagged for moderation");
      loadSubmissions();
    } catch (error) {
      console.error("Error flagging submission:", error);
      toast.error("Failed to flag submission");
    }
  };

  const handleApprove = async (
    submissionId: string,
    editedContent?: any,
    wasEditedByAdmin: boolean = false
  ) => {
    try {
      // Update submission status
      await api.updateSubmission(submissionId, {
        status: "approved",
        reviewed_by: currentUserId,
      });

      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) return;

      // Get submitter's profile for attribution
      let writerName = "Anonymous";
      try {
        const writerProfile = await api.getUserProfile(submission.submitted_by);
        writerName =
          writerProfile.name ||
          writerProfile.email?.split("@")[0] ||
          "Anonymous";
      } catch (error) {
        console.error("Error fetching writer profile:", error);
      }

      // Get editor's name if edited by admin
      let editorName;
      if (wasEditedByAdmin) {
        try {
          const editorProfile = await api.getUserProfile(currentUserId);
          editorName = editorProfile.name || editorProfile.email?.split("@")[0];
        } catch (error) {
          console.error("Error fetching editor profile:", error);
        }
      }

      // Process based on submission type
      if (submission.type === "new_material") {
        // Create new material
        const materialData = editedContent || submission.content_data;
        await api.saveMaterial({
          name: materialData.name,
          category: materialData.category,
          description: materialData.description,
          compostability: materialData.compostability || 0,
          recyclability: materialData.recyclability || 0,
          reusability: materialData.reusability || 0,
          created_by: submission.submitted_by,
          writer_name: writerName,
          ...(wasEditedByAdmin && editorName
            ? {
                edited_by: currentUserId,
                editor_name: editorName,
              }
            : {}),
        });
      } else if (
        submission.type === "edit_material" &&
        submission.original_content_id
      ) {
        // Update existing material
        const materialData = editedContent || submission.content_data;
        await api.updateMaterial(submission.original_content_id, {
          name: materialData.name,
          category: materialData.category,
          description: materialData.description,
          ...(wasEditedByAdmin && editorName
            ? {
                edited_by: currentUserId,
                editor_name: editorName,
              }
            : {}),
        });
      } else if (submission.type === "new_article") {
        // Create new article
        const articleData = editedContent || submission.content_data;
        // Note: This requires article creation API which will be implemented in Phase 6.4
        console.log("Article approval:", articleData);
      }

      // Send approval email and notification
      try {
        const writerProfile = await api.getUserProfile(submission.submitted_by);
        const contentName =
          submission.content_data?.name || submission.content_data?.title;

        await api.sendApprovalEmail({
          submitterEmail: writerProfile.email,
          submitterName: writerProfile.name,
          submissionType: submission.type,
          contentName,
        });

        // Create notification for submitter
        await api.createNotification({
          user_id: submission.submitted_by,
          type: "submission_approved",
          content_id: submission.id,
          content_type: "submission",
          message: `Your ${submission.type.replace(
            /_/g,
            " "
          )} submission has been approved and is now live!`,
        });
      } catch (emailError) {
        console.error("Error sending approval email/notification:", emailError);
        // Don't fail the approval if email/notification fails
      }

      const creditMessage =
        wasEditedByAdmin && editorName
          ? `Submission approved and published with dual credit (Writer: ${writerName}, Editor: ${editorName})`
          : "Submission approved and published";
      toast.success(creditMessage);

      loadSubmissions();
      setShowReviewModal(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve submission");
    }
  };

  const handleReject = async (submissionId: string, feedback: string) => {
    try {
      await api.updateSubmission(submissionId, {
        status: "rejected",
        feedback,
        reviewed_by: currentUserId,
      });

      // Send rejection email and notification
      const submission = submissions.find((s) => s.id === submissionId);
      if (submission) {
        try {
          const profile = await api.getUserProfile(submission.submitted_by);

          await api.sendRejectionEmail({
            submitterEmail: profile.email,
            submitterName: profile.name,
            submissionType: submission.type,
            feedback,
          });

          // Create notification for submitter
          await api.createNotification({
            user_id: submission.submitted_by,
            type: "feedback_received",
            content_id: submissionId,
            content_type: "submission",
            message: `Your ${submission.type.replace(
              /_/g,
              " "
            )} submission was not approved. Feedback has been provided.`,
          });
        } catch (emailError) {
          console.error(
            "Error sending rejection email/notification:",
            emailError
          );
          // Don't fail the rejection if email/notification fails
        }
      }

      toast.success("Submission rejected with feedback");
      loadSubmissions();
      setShowReviewModal(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject submission");
    }
  };

  const handleRequestRevision = async (
    submissionId: string,
    feedback: string
  ) => {
    try {
      // Update submission status
      await api.updateSubmission(submissionId, {
        status: "needs_revision",
        feedback,
        reviewed_by: currentUserId,
      });

      // Get submission details for email and notification
      const submission = submissions.find((s) => s.id === submissionId);
      if (submission) {
        try {
          // Get submitter's profile to get their email
          const profile = await api.getUserProfile(submission.submitted_by);

          // Send revision request email
          await api.sendRevisionRequestEmail({
            submissionId: submission.id,
            feedback,
            submitterEmail: profile.email,
            submitterName: profile.name,
            submissionType: submission.type,
          });

          // Create notification for submitter
          await api.createNotification({
            user_id: submission.submitted_by,
            type: "feedback_received",
            content_id: submissionId,
            content_type: "submission",
            message: `Revision requested for your ${submission.type.replace(
              /_/g,
              " "
            )} submission. Please review the feedback.`,
          });

          toast.success("Revision requested and email sent");
        } catch (emailError) {
          console.error(
            "Error sending revision email/notification:",
            emailError
          );
          // Still show success since the submission was updated
          toast.success("Revision requested (email notification failed)");
        }
      } else {
        toast.success("Revision requested");
      }

      loadSubmissions();
      setShowReviewModal(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Failed to request revision");
    }
  };

  const handleRemitToReview = async (submissionId: string) => {
    try {
      await api.updateSubmission(submissionId, {
        status: "pending_review",
        reviewed_by: currentUserId,
      });
      toast.success("Submission remitted to review queue");
      loadSubmissions();
    } catch (error) {
      console.error("Error remitting submission:", error);
      toast.error("Failed to remit submission");
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this submission? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.deleteSubmission(submissionId);
      toast.success("Submission deleted");
      loadSubmissions();
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission");
    }
  };

  const getSubmissionsByStatus = () => {
    switch (activeTab) {
      case "review":
        return submissions.filter((s) => s.status === "pending_review");
      case "pending":
        return submissions.filter(
          (s) => s.status === "needs_revision" || s.status === "approved"
        );
      case "moderation":
        return submissions.filter(
          (s) => s.status === "flagged" || s.status === "rejected"
        );
      default:
        return [];
    }
  };

  const filteredSubmissions = getSubmissionsByStatus();

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <h2 className="font-['Fredoka_One',_sans-serif] text-black dark:text-white">
          Content Review Center
        </h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
          <TabsTrigger
            value="review"
            className="text-[10px] md:text-sm px-2 py-2 data-[state=active]:bg-[#c8e5c8]"
          >
            <Clock size={12} className="mr-1 shrink-0" />
            <span className="truncate">
              Review (
              {submissions.filter((s) => s.status === "pending_review").length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="text-[10px] md:text-sm px-2 py-2 data-[state=active]:bg-[#f4d3a0]"
          >
            <AlertTriangle size={12} className="mr-1 shrink-0" />
            <span className="truncate">
              Pending (
              {
                submissions.filter(
                  (s) =>
                    s.status === "needs_revision" || s.status === "approved"
                ).length
              }
              )
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="moderation"
            className="text-[10px] md:text-sm px-2 py-2 data-[state=active]:bg-[#e6beb5]"
          >
            <Flag size={12} className="mr-1 shrink-0" />
            <span className="truncate">
              Moderation (
              {
                submissions.filter(
                  (s) => s.status === "flagged" || s.status === "rejected"
                ).length
              }
              )
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[14px] text-black/70 dark:text-white/70">
                Loading submissions...
              </p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                {activeTab === "review" && (
                  <Clock
                    size={48}
                    className="mx-auto text-black/20 dark:text-white/20"
                  />
                )}
                {activeTab === "pending" && (
                  <AlertTriangle
                    size={48}
                    className="mx-auto text-black/20 dark:text-white/20"
                  />
                )}
                {activeTab === "moderation" && (
                  <Flag
                    size={48}
                    className="mx-auto text-black/20 dark:text-white/20"
                  />
                )}
              </div>
              <p className="text-[14px] text-black/70 dark:text-white/70">
                {activeTab === "review" && "No submissions awaiting review"}
                {activeTab === "pending" && "No pending items"}
                {activeTab === "moderation" && "No flagged items"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onReview={() => handleReview(submission)}
                  onFlag={() => handleFlag(submission)}
                  onRemitToReview={() => handleRemitToReview(submission.id)}
                  onDelete={() => handleDelete(submission.id)}
                  activeTab={activeTab}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showReviewModal && selectedSubmission && (
        <ReviewModal
          submission={selectedSubmission}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSubmission(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestRevision={handleRequestRevision}
        />
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  onReview,
  onFlag,
  onRemitToReview,
  onDelete,
  activeTab,
}: {
  submission: Submission;
  onReview: () => void;
  onFlag: () => void;
  onRemitToReview: () => void;
  onDelete: () => void;
  activeTab: string;
}) {
  const getSubmissionIcon = () => {
    switch (submission.type) {
      case "new_material":
        return <Package size={16} className="text-black dark:text-white" />;
      case "edit_material":
        return <Edit3 size={16} className="text-black dark:text-white" />;
      case "new_article":
      case "update_article":
        return <FileText size={16} className="text-black dark:text-white" />;
      default:
        return <FileText size={16} className="text-black dark:text-white" />;
    }
  };

  const getSubmissionTitle = () => {
    switch (submission.type) {
      case "new_material":
      case "edit_material":
        return submission.content_data?.name || "Untitled Material";
      case "new_article":
      case "update_article":
        return submission.content_data?.title || "Untitled Article";
      default:
        return "Submission";
    }
  };

  const getSubmissionLabel = () => {
    switch (submission.type) {
      case "new_material":
        return "New Material";
      case "edit_material":
        return "Material Edit";
      case "new_article":
        return "New Article";
      case "update_article":
        return "Article Update";
      default:
        return submission.type;
    }
  };

  const getSubmissionSnippet = () => {
    if (
      submission.type === "edit_material" &&
      submission.content_data?.change_reason
    ) {
      return submission.content_data.change_reason;
    }
    return (
      submission.content_data?.description ||
      submission.content_data?.content?.substring(0, 100) ||
      "No description"
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-[#1a1917] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-4 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-[#b8c8cb] dark:bg-[#2a3235] border border-[#211f1c] dark:border-white/20 shrink-0">
          {getSubmissionIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-black dark:text-white truncate">
              {getSubmissionTitle()}
            </h3>
            <span className="shrink-0 text-[10px] text-black/50 dark:text-white/50">
              {formatDate(submission.created_at)}
            </span>
          </div>
          <p className="text-[11px] text-black/60 dark:text-white/60 mb-2">
            {getSubmissionLabel()}
          </p>
          <p className="text-[11px] text-black/70 dark:text-white/70 line-clamp-2 mb-3">
            {getSubmissionSnippet()}
          </p>
          {submission.feedback && (
            <div className="bg-[#e4e3ac] dark:bg-[#3a3825] border border-[#211f1c] dark:border-white/20 rounded-md p-2 mb-3">
              <p className="text-[10px] text-black dark:text-white">
                <strong>Feedback:</strong> {submission.feedback}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            {activeTab === "review" && (
              <>
                <button
                  onClick={onReview}
                  className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#c8e5c8] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black flex items-center gap-1"
                >
                  <CheckCircle size={12} />
                  Review
                </button>
                <button
                  onClick={onFlag}
                  className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black flex items-center gap-1"
                >
                  <Flag size={12} />
                  Flag
                </button>
              </>
            )}
            {activeTab === "pending" && (
              <>
                <button
                  onClick={onReview}
                  className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#b8c8cb] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black"
                >
                  View Details
                </button>
                {submission.status === "needs_revision" && (
                  <button
                    onClick={onRemitToReview}
                    className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#e4e3ac] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black flex items-center gap-1"
                  >
                    <Clock size={12} />
                    Remit to Review
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black flex items-center gap-1"
                >
                  <XCircle size={12} />
                  Delete
                </button>
              </>
            )}
            {activeTab === "moderation" && (
              <>
                <button
                  onClick={onReview}
                  className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#f4d3a0] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black"
                >
                  Review Moderation
                </button>
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black flex items-center gap-1"
                >
                  <XCircle size={12} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
