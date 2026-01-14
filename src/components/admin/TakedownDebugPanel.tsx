import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { projectId } from "../../utils/supabase/info";

export function TakedownDebugPanel() {
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  const fetchRawData = async () => {
    if (!requestId.trim()) {
      setError("Please enter a request ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDebugData(null);

      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        setError("Not authenticated. Please sign in as admin.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/takedown-raw/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching raw data:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Takedown Request Debugger</CardTitle>
        <CardDescription>
          Inspect raw database records to diagnose data issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="requestId">Request ID</Label>
            <Input
              id="requestId"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="TR-1731600000-abc123"
              className="font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchRawData} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="size-4 mr-2" />
                  Inspect
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debugData && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Field Count:</strong> {debugData.fieldCount}
                  </div>
                  <div>
                    <strong>Has fullName:</strong>{" "}
                    {debugData.hasFullName ? "✅ Yes" : "❌ No"}
                  </div>
                  <div>
                    <strong>Has workTitle:</strong>{" "}
                    {debugData.hasWorkTitle ? "✅ Yes" : "❌ No"}
                  </div>
                  <div>
                    <strong>Has contentDescription:</strong>{" "}
                    {debugData.hasContentDescription ? "✅ Yes" : "❌ No"}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div>
              <Label>All Fields Present:</Label>
              <div className="mt-2 p-3 bg-muted rounded text-xs font-mono">
                {debugData.fields.join(", ")}
              </div>
            </div>

            <div>
              <Label>Raw Database Record:</Label>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(debugData.rawData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
