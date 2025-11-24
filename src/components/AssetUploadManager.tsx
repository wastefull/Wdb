import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Copy, ExternalLink } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface Asset {
  name: string;
  publicUrl: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AssetUploadManagerProps {
  accessToken: string | null;
}

export function AssetUploadManager({ accessToken }: AssetUploadManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchAssets();
    }
  }, [accessToken]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/assets`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only images are allowed.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/assets/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      toast.success(`Uploaded: ${data.fileName}`);

      // Refresh asset list
      await fetchAssets();

      // Reset input
      e.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/assets/${encodeURIComponent(
          fileName
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }

      toast.success("Asset deleted");
      await fetchAssets();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete asset");
    }
  };

  const copyUrl = async (url: string) => {
    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch (error) {
      // Fallback for when Clipboard API is blocked
      try {
        // Create a temporary textarea
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);

        // Select and copy
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        const successful = document.execCommand("copy");

        // Clean up
        document.body.removeChild(textarea);

        if (successful) {
          toast.success("URL copied to clipboard");
        } else {
          throw new Error("Copy command failed");
        }
      } catch (fallbackError) {
        // If all else fails, show the URL for manual copying
        console.error("Copy failed:", error, fallbackError);
        toast.error("Copy failed. URL: " + url, { duration: 10000 });
      }
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (!accessToken) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Manager</CardTitle>
        <CardDescription>
          Upload and manage assets (logo, images, etc.) for use in emails and
          the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="asset-upload">Upload Asset</Label>
          <div className="flex gap-2">
            <Input
              id="asset-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading && (
              <span className="text-sm text-muted-foreground">
                Uploading...
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Supported: PNG, JPG, SVG, WebP • Max 5MB
          </p>
        </div>

        {/* Assets List */}
        <div className="space-y-2">
          <Label>Uploaded Assets</Label>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading assets...</p>
          ) : assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assets uploaded yet
            </p>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => (
                <div
                  key={asset.name}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Preview */}
                  <div className="w-12 h-12 rounded border overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={asset.publicUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(asset.size)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyUrl(asset.publicUrl)}
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(asset.publicUrl, "_blank")}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(asset.name)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Copy for Logo */}
        {assets.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              💡 Tip: Upload your logo, then copy its URL to use in the magic
              link email template
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
