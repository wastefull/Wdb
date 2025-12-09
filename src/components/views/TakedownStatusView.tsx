import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { useNavigationContext } from "../../contexts/NavigationContext";

interface TakedownStatusViewProps {
  requestId: string;
  className?: string;
}

interface TakedownRequest {
  requestID: string;
  status: "pending" | "under_review" | "resolved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  resolution:
    | "full_removal"
    | "partial_redaction"
    | "attribution_correction"
    | "no_action"
    | null;
}

export function TakedownStatusView({
  requestId,
  className,
}: TakedownStatusViewProps) {
  const [request, setRequest] = useState<TakedownRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { goBack } = useNavigationContext();

  useEffect(() => {
    fetchStatus();
  }, [requestId]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/legal/takedown/status/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      } else if (response.status === 404) {
        setError("Request not found. Please check the request ID.");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch request status");
      }
    } catch (err) {
      console.error("Error fetching takedown status:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="size-5 text-yellow-600" />;
      case "under_review":
        return <Loader2 className="size-5 text-blue-600 animate-spin" />;
      case "resolved":
        return <CheckCircle2 className="size-5 text-green-600" />;
      case "rejected":
        return <AlertCircle className="size-5 text-red-600" />;
      default:
        return <FileText className="size-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "secondary",
      under_review: "default",
      resolved: "outline",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getResolutionText = (resolution: string | null) => {
    if (!resolution) return null;

    const texts: Record<string, string> = {
      full_removal: "Full Removal - Content has been completely removed",
      partial_redaction:
        "Partial Redaction - Snippets redacted, citations preserved",
      attribution_correction:
        "Attribution Corrected - Citation updated per your request",
      no_action: "No Action - Content determined to be fair use",
    };

    return texts[resolution] || resolution;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        className={`max-w-2xl mx-auto flex items-center justify-center py-12 ${
          className || ""
        }`}
      >
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-2xl mx-auto space-y-4 ${className || ""}`}>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="size-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className || ""}`}>
      <Button variant="ghost" onClick={goBack} className="mb-4">
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(request.status)}
              <div>
                <CardTitle>Takedown Request Status</CardTitle>
                <CardDescription>
                  Request ID: {request.requestID}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timeline */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Submitted</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(request.submittedAt)}
                </p>
              </div>
            </div>

            {request.reviewedAt && (
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <CheckCircle2 className="size-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Reviewed</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(request.reviewedAt)}
                  </p>
                </div>
              </div>
            )}

            {!request.reviewedAt && request.status === "pending" && (
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Clock className="size-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Under Review</h3>
                  <p className="text-sm text-muted-foreground">
                    We will respond within 72 hours
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Details */}
          {request.resolution && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Resolution</h3>
              <p className="text-sm">{getResolutionText(request.resolution)}</p>
            </div>
          )}

          {/* Next Steps */}
          {request.status === "pending" && (
            <Alert>
              <Clock className="size-4" />
              <AlertDescription>
                <strong>What happens next?</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Our legal team is reviewing your request</li>
                  <li>You will receive an email update within 72 hours</li>
                  <li>Check this page anytime for the latest status</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {request.status === "under_review" && (
            <Alert>
              <Loader2 className="size-4 animate-spin" />
              <AlertDescription>
                <strong>Currently under review</strong>
                <p className="mt-2 text-sm">
                  Our legal team is actively reviewing your request. We will
                  notify you once a decision has been made.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {request.status === "resolved" && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                <strong>Request resolved</strong>
                <p className="mt-2 text-sm">
                  Your takedown request has been resolved. If you have questions
                  about the resolution, please contact compliance@wastefull.org
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchStatus}>
              Refresh Status
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
              Print Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Email:</strong> compliance@wastefull.org
          </p>
          <p>
            <strong>Response Time:</strong> 72 hours for initial review
          </p>
          <p>
            <strong>Have questions?</strong> Include your request ID (
            {request.requestID}) in any correspondence.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
