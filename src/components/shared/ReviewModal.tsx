import { useState } from 'react';
import { X, CheckCircle, XCircle, Edit3, Package, FileText } from 'lucide-react';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const CATEGORIES = [
  'Packaging',
  'Textiles',
  'Electronics',
  'Construction',
  'Food & Organic',
  'Plastics',
  'Metals',
  'Other'
];

interface Submission {
  id: string;
  type: 'new_material' | 'edit_material' | 'new_article' | 'update_article' | 'delete_material' | 'delete_article';
  content_data: any;
  original_content_id?: string;
  status: string;
  feedback?: string;
  submitted_by: string;
  created_at: string;
}

interface ReviewModalProps {
  submission: Submission;
  onClose: () => void;
  onApprove: (submissionId: string, editedContent?: any, wasEditedByAdmin?: boolean) => void;
  onReject: (submissionId: string, feedback: string) => void;
  onRequestRevision: (submissionId: string, feedback: string) => void;
}

export function ReviewModal({
  submission,
  onClose,
  onApprove,
  onReject,
  onRequestRevision
}: ReviewModalProps) {
  const [action, setAction] = useState<'approve' | 'edit' | 'suggest' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [editedContent, setEditedContent] = useState<any>(submission.content_data);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      if (action === 'approve' || action === 'edit') {
        const wasEdited = action === 'edit';
        await onApprove(submission.id, wasEdited ? editedContent : undefined, wasEdited);
      } else if (action === 'reject') {
        if (!feedback.trim()) {
          alert('Please provide feedback for rejection');
          setProcessing(false);
          return;
        }
        await onReject(submission.id, feedback);
      } else if (action === 'suggest') {
        if (!feedback.trim()) {
          alert('Please provide suggestions for revision');
          setProcessing(false);
          return;
        }
        await onRequestRevision(submission.id, feedback);
      }
    } finally {
      setProcessing(false);
    }
  };

  const getSubmissionIcon = () => {
    switch (submission.type) {
      case 'new_material':
      case 'edit_material':
        return <Package size={20} className="text-black dark:text-white" />;
      case 'new_article':
      case 'update_article':
        return <FileText size={20} className="text-black dark:text-white" />;
      default:
        return <FileText size={20} className="text-black dark:text-white" />;
    }
  };

  const getSubmissionTitle = () => {
    switch (submission.type) {
      case 'new_material':
        return 'New Material Submission';
      case 'edit_material':
        return 'Material Edit Suggestion';
      case 'new_article':
        return 'New Article Submission';
      case 'update_article':
        return 'Article Update Submission';
      default:
        return 'Submission Review';
    }
  };

  const renderMaterialContent = () => {
    if (action === 'edit') {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name" className="text-[12px] text-black dark:text-white">
              Material Name *
            </Label>
            <Input
              id="edit-name"
              value={editedContent.name || ''}
              onChange={(e) => setEditedContent({ ...editedContent, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-category" className="text-[12px] text-black dark:text-white">
              Category *
            </Label>
            <Select
              value={editedContent.category || ''}
              onValueChange={(value) => setEditedContent({ ...editedContent, category: value })}
            >
              <SelectTrigger id="edit-category" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-description" className="text-[12px] text-black dark:text-white">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={editedContent.description || ''}
              onChange={(e) => setEditedContent({ ...editedContent, description: e.target.value })}
              className="mt-1 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="card-muted">
          <p className="text-[11px] text-black/70 dark:text-white/70 mb-1">
            <strong>Name:</strong>
          </p>
          <p className="text-[13px] text-black dark:text-white">
            {submission.content_data.name}
          </p>
        </div>
        <div className="card-muted">
          <p className="text-[11px] text-black/70 dark:text-white/70 mb-1">
            <strong>Category:</strong>
          </p>
          <p className="text-[13px] text-black dark:text-white">
            {submission.content_data.category}
          </p>
        </div>
        {submission.content_data.description && (
          <div className="card-muted">
            <p className="text-[11px] text-black/70 dark:text-white/70 mb-1">
              <strong>Description:</strong>
            </p>
            <p className="text-[13px] text-black dark:text-white">
              {submission.content_data.description}
            </p>
          </div>
        )}
        {submission.type === 'edit_material' && submission.content_data.change_reason && (
          <div className="bg-[#e4e3ac] dark:bg-[#3a3825] border border-[#211f1c] dark:border-white/20 rounded-md p-3">
            <p className="text-[11px] text-black dark:text-white mb-1">
              <strong>Reason for Change:</strong>
            </p>
            <p className="text-[12px] text-black dark:text-white">
              {submission.content_data.change_reason}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderArticleContent = () => {
    if (action === 'edit') {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title" className="text-[12px] text-black dark:text-white">
              Article Title *
            </Label>
            <Input
              id="edit-title"
              value={editedContent.title || ''}
              onChange={(e) => setEditedContent({ ...editedContent, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-content" className="text-[12px] text-black dark:text-white">
              Content *
            </Label>
            <Textarea
              id="edit-content"
              value={editedContent.content || ''}
              onChange={(e) => setEditedContent({ ...editedContent, content: e.target.value })}
              className="mt-1 font-['DaddyTimeMono_Nerd_Font_Mono',_'Press_Start_2P',_ui-monospace,_monospace] text-[11px] min-h-[200px]"
              rows={10}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="card-muted">
          <p className="text-[11px] text-black/70 dark:text-white/70 mb-1">
            <strong>Title:</strong>
          </p>
          <p className="text-[13px] text-black dark:text-white">
            {submission.content_data.title}
          </p>
        </div>
        <div className="card-muted">
          <p className="text-[11px] text-black/70 dark:text-white/70 mb-1">
            <strong>Category:</strong>
          </p>
          <p className="text-[13px] text-black dark:text-white">
            {submission.content_data.category}
          </p>
        </div>
        {submission.content_data.content && (
          <div className="card-muted max-h-[300px] overflow-y-auto">
            <p className="text-[11px] text-black/70 dark:text-white/70 mb-1">
              <strong>Content:</strong>
            </p>
            <pre className="font-['DaddyTimeMono_Nerd_Font_Mono',_'Press_Start_2P',_ui-monospace,_monospace] text-[11px] text-black dark:text-white whitespace-pre-wrap">
              {submission.content_data.content}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 w-full max-w-3xl shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c] dark:border-white/20 sticky top-0 bg-white dark:bg-[#2a2825] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#b8c8cb] dark:bg-[#2a3235] border border-[#211f1c] dark:border-white/20">
              {getSubmissionIcon()}
            </div>
            <h3 className="font-['Fredoka_One',_sans-serif] text-black dark:text-white">
              {getSubmissionTitle()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} className="text-black dark:text-white" />
          </button>
        </div>

        <div className="p-6">
          {!action ? (
            <div className="space-y-6">
              <div className="mb-4">
                <p className="text-[11px] text-black/60 dark:text-white/60 mb-4">
                  Submitted {new Date(submission.created_at).toLocaleString()}
                </p>
                {(submission.type === 'new_material' || submission.type === 'edit_material') && renderMaterialContent()}
                {(submission.type === 'new_article' || submission.type === 'update_article') && renderArticleContent()}
              </div>

              <div className="border-t border-[#211f1c]/20 dark:border-white/10 pt-6">
                <p className="text-[12px] text-black dark:text-white mb-4">
                  Choose an action:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAction('approve')}
                    className="p-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#c8e5c8] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-black" />
                      <span className="text-[13px] text-black">Approve</span>
                    </div>
                    <p className="text-[10px] text-black/70">
                      Accept and publish as-is
                    </p>
                  </button>

                  <button
                    onClick={() => setAction('edit')}
                    className="p-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#b8c8cb] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 size={16} className="text-black" />
                      <span className="text-[13px] text-black">Edit Directly</span>
                    </div>
                    <p className="text-[10px] text-black/70">
                      Make changes and publish
                    </p>
                  </button>

                  <button
                    onClick={() => setAction('suggest')}
                    className="p-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#e4e3ac] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 size={16} className="text-black" />
                      <span className="text-[13px] text-black">Suggest Edits</span>
                    </div>
                    <p className="text-[10px] text-black/70">
                      Request revisions from submitter
                    </p>
                  </button>

                  <button
                    onClick={() => setAction('reject')}
                    className="p-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle size={16} className="text-black" />
                      <span className="text-[13px] text-black">Reject</span>
                    </div>
                    <p className="text-[10px] text-black/70">
                      Decline with feedback
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {action === 'edit' && (
                <>
                  <div className="bg-[#b8c8cb] dark:bg-[#2a3235] border border-[#211f1c] dark:border-white/20 rounded-md p-3 mb-4">
                    <p className="text-[11px] text-black dark:text-white">
                      ✏️ <strong>Edit Mode:</strong> Make your changes below. You'll be credited as editor.
                    </p>
                  </div>
                  {(submission.type === 'new_material' || submission.type === 'edit_material') && renderMaterialContent()}
                  {(submission.type === 'new_article' || submission.type === 'update_article') && renderArticleContent()}
                </>
              )}

              {(action === 'suggest' || action === 'reject') && (
                <div>
                  <Label htmlFor="feedback" className="text-[12px] text-black dark:text-white">
                    {action === 'suggest' ? 'Suggestions for Improvement *' : 'Reason for Rejection *'}
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={action === 'suggest' ? 'Explain what changes you\'d like to see...' : 'Explain why this submission is being rejected...'}
                    className="mt-1 min-h-[100px]"
                    rows={5}
                  />
                </div>
              )}

              {action === 'approve' && (
                <div className="bg-[#c8e5c8] dark:bg-[#2a3f2a] border border-[#211f1c] dark:border-white/20 rounded-md p-3">
                  <p className="text-[12px] text-black dark:text-white">
                    ✅ Ready to approve and publish this submission?
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setAction(null);
                    setFeedback('');
                    setEditedContent(submission.content_data);
                  }}
                  className="flex-1 h-[40px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black"
                  disabled={processing}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 h-[40px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#c8e5c8] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
