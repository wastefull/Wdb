import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, Edit3, Package } from 'lucide-react';
import * as api from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Submission {
  id: string;
  type: 'new_material' | 'edit_material' | 'new_article' | 'update_article' | 'delete_material' | 'delete_article';
  content_data: any;
  original_content_id?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
  feedback?: string;
  submitted_by: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

interface MySubmissionsViewProps {
  onBack: () => void;
}

export function MySubmissionsView({ onBack }: MySubmissionsViewProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await api.getMySubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionIcon = (type: Submission['type']) => {
    switch (type) {
      case 'new_material':
        return <Package size={16} className="text-black dark:text-white" />;
      case 'edit_material':
        return <Edit3 size={16} className="text-black dark:text-white" />;
      case 'new_article':
      case 'update_article':
        return <FileText size={16} className="text-black dark:text-white" />;
      default:
        return <FileText size={16} className="text-black dark:text-white" />;
    }
  };

  const getSubmissionLabel = (type: Submission['type']) => {
    switch (type) {
      case 'new_material':
        return 'New Material';
      case 'edit_material':
        return 'Material Edit';
      case 'new_article':
        return 'New Article';
      case 'update_article':
        return 'Article Update';
      case 'delete_material':
        return 'Delete Material';
      case 'delete_article':
        return 'Delete Article';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#f4d3a0] dark:bg-[#4a3f2a] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white">
            <Clock size={10} />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#c8e5c8] dark:bg-[#2a3f2a] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white">
            <CheckCircle size={10} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#e6beb5] dark:bg-[#3f2a2a] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white">
            <XCircle size={10} />
            Rejected
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#e4e3ac] dark:bg-[#3a3825] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white">
            <Edit3 size={10} />
            Needs Revision
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getSubmissionTitle = (submission: Submission) => {
    switch (submission.type) {
      case 'new_material':
      case 'edit_material':
        return submission.content_data?.name || 'Untitled Material';
      case 'new_article':
      case 'update_article':
        return submission.content_data?.title || 'Untitled Article';
      default:
        return 'Submission';
    }
  };

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
          My Submissions
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/70 dark:text-white/70">
            Loading submissions...
          </p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/70 dark:text-white/70">
            You haven't made any submissions yet.
          </p>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/50 dark:text-white/50 mt-2">
            Submit a new material or article to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white dark:bg-[#1a1917] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-4 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-md bg-[#b8c8cb] dark:bg-[#2a3235] border border-[#211f1c] dark:border-white/20">
                    {getSubmissionIcon(submission.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
                        {getSubmissionTitle(submission)}
                      </h3>
                    </div>
                    <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60 mb-2">
                      {getSubmissionLabel(submission.type)} • Submitted {formatDate(submission.created_at)}
                    </p>
                    {submission.feedback && (
                      <div className="bg-[#e4e3ac] dark:bg-[#3a3825] border border-[#211f1c] dark:border-white/20 rounded-md p-2 mt-2">
                        <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white">
                          <strong>Feedback:</strong> {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {getStatusBadge(submission.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
