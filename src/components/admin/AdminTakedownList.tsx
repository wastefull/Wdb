import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { projectId } from "../../utils/supabase/info";
import { useNavigationContext } from "../../contexts/NavigationContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { TakedownDebugPanel } from "./TakedownDebugPanel";
import { PageTemplate } from "../shared/PageTemplate";

interface TakedownRequest {
  requestID: string;
  fullName: string;
  email: string;
  organization?: string;
  workTitle: string;
  workDOI?: string;
  relationship: string;
  wastedbURL: string;
  miuID?: string;
  contentDescription: string;
  status: "pending" | "under_review" | "resolved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  resolution:
    | "full_removal"
    | "partial_redaction"
    | "attribution_correction"
    | "no_action"
    | null;
  reviewNotes: string | null;
}

export function AdminTakedownList() {
  const [requests, setRequests] = useState<TakedownRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<TakedownRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [reviewData, setReviewData] = useState({
    status: "under_review" as TakedownRequest["status"],
    resolution: null as TakedownRequest["resolution"],
    reviewNotes: "",
  });

  const { goBack, navigateToTakedownStatus } = useNavigationContext();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get access token from sessionStorage
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        setError("Not authenticated. Please sign in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/takedown`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        console.log("🔍 API Response received:", data);
        console.log("🔍 Number of requests:", data.requests?.length);
        console.log("🔍 First request sample:", data.requests?.[0]);

        // Deduplicate requests by requestID, preferring records with more fields (complete data)
        const uniqueRequests =
          data.requests?.reduce(
            (acc: TakedownRequest[], request: TakedownRequest) => {
              const existingIndex = acc.findIndex(
                (r) => r.requestID === request.requestID
              );
              if (existingIndex === -1) {
                // No duplicate found, add this record
                acc.push(request);
              } else {
                // Duplicate found - keep the one with more fields
                const existing = acc[existingIndex];
                const existingFieldCount = Object.keys(existing).length;
                const newFieldCount = Object.keys(request).length;
                if (newFieldCount > existingFieldCount) {
                  console.log(
                    `🔄 Replacing duplicate ${request.requestID}: ${existingFieldCount} fields → ${newFieldCount} fields`
                  );
                  acc[existingIndex] = request;
                }
              }
              return acc;
            },
            []
          ) || [];

        console.log("🔍 Unique requests after dedup:", uniqueRequests.length);
        console.log("🔍 Unique requests data:", uniqueRequests);

        setRequests(uniqueRequests);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch requests");
      }
    } catch (err) {
      console.error("Error fetching takedown requests:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (request: TakedownRequest) => {
    setSelectedRequest(request);
    setReviewData({
      status: request.status,
      resolution: request.resolution,
      reviewNotes: request.reviewNotes || "",
    });
    setReviewDialogOpen(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      setUpdating(true);

      // Get access token from sessionStorage
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        alert("Not authenticated. Please sign in again.");
        setUpdating(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/takedown/${selectedRequest.requestID}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewData),
        }
      );

      if (response.ok) {
        setReviewDialogOpen(false);
        fetchRequests(); // Refresh list
      } else {
        const errorData = await response.json();
        alert(`Failed to update: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error updating request:", err);
      alert("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Handle undefined/null status
    const safeStatus = status || "pending";

    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ReactNode;
      }
    > = {
      pending: { variant: "secondary", icon: <Clock className="size-3" /> },
      under_review: {
        variant: "default",
        icon: <Loader2 className="size-3 animate-spin" />,
      },
      resolved: {
        variant: "outline",
        icon: <CheckCircle2 className="size-3" />,
      },
      rejected: {
        variant: "destructive",
        icon: <XCircle className="size-3" />,
      },
    };

    const config = variants[safeStatus] || variants["pending"];

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {safeStatus.replace("_", " ")}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
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

  return (
    <PageTemplate
      title="DMCA Takedown Requests"
      description="Review and manage copyright takedown requests. 72-hour response guarantee."
      maxWidth="6xl"
      onBack={goBack}
    >
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={fetchRequests}>
            Refresh
          </Button>
        </div>

        {/* Debug Panel */}
        <TakedownDebugPanel />

        <Card>
          <CardContent className="pt-6">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="size-12 mx-auto mb-4 opacity-50" />
                <p>No takedown requests submitted yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Work Title</TableHead>
                    <TableHead>WasteDB URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.requestID}>
                      <TableCell className="font-mono text-xs">
                        {request.requestID.split("-")[1]}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-xs truncate"
                          title={request.workTitle}
                        >
                          {request.workTitle}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.wastedbURL ? (
                          <a
                            href={request.wastedbURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            View <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No URL provided
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(request.submittedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(request)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Takedown Request</DialogTitle>
              <DialogDescription>
                {selectedRequest?.requestID}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                {/* Request Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Requester</Label>
                    <p className="font-medium">{selectedRequest.fullName}</p>
                    <p className="text-muted-foreground">
                      {selectedRequest.email}
                    </p>
                  </div>
                  <div>
                    <Label>Organization</Label>
                    <p>{selectedRequest.organization || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Work Title</Label>
                    <p className="font-medium">{selectedRequest.workTitle}</p>
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <p>{selectedRequest.relationship}</p>
                  </div>
                  <div>
                    <Label>DOI/URL</Label>
                    <p className="break-all">
                      {selectedRequest.workDOI || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label>WasteDB URL</Label>
                    <a
                      href={selectedRequest.wastedbURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedRequest.wastedbURL}
                    </a>
                  </div>
                </div>

                <div>
                  <Label>Content Description</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded">
                    {selectedRequest.contentDescription || (
                      <span className="italic text-muted-foreground">
                        No description provided
                      </span>
                    )}
                  </p>
                </div>

                {/* Update Fields */}
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={reviewData.status}
                      onValueChange={(value: string) =>
                        setReviewData({
                          ...reviewData,
                          status: value as TakedownRequest["status"],
                        })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">
                          Under Review
                        </SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select
                      value={reviewData.resolution || "none"}
                      onValueChange={(value: string | null) =>
                        setReviewData({
                          ...reviewData,
                          resolution:
                            value === "none"
                              ? null
                              : (value as TakedownRequest["resolution"]),
                        })
                      }
                    >
                      <SelectTrigger id="resolution">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Resolution Yet</SelectItem>
                        <SelectItem value="full_removal">
                          Full Removal
                        </SelectItem>
                        <SelectItem value="partial_redaction">
                          Partial Redaction
                        </SelectItem>
                        <SelectItem value="attribution_correction">
                          Attribution Correction
                        </SelectItem>
                        <SelectItem value="no_action">
                          No Action (Fair Use)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reviewNotes">Internal Review Notes</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewData.reviewNotes}
                      onChange={(e) =>
                        setReviewData({
                          ...reviewData,
                          reviewNotes: e.target.value,
                        })
                      }
                      placeholder="Add internal notes about the review decision..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      These notes are internal only and not visible to the
                      requester
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRequest} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTemplate>
  );
}
