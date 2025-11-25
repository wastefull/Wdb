import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Copy, ExternalLink, Image } from "lucide-react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { PageTemplate } from "../shared/PageTemplate";
import { useNavigationContext } from "../../contexts/NavigationContext";

interface Asset {
  name: string;
  publicUrl: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function AssetsManagementPage() {
  const { navigateToAdminDashboard } = useNavigationContext();
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const accessToken = sessionStorage.getItem("wastedb_access_token");

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
      toast.success("Asset uploaded successfully");

      // Refresh asset list
      await fetchAssets();

      // Reset file input
      e.target.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload asset");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetName: string) => {
    if (!confirm(`Are you sure you want to delete "${assetName}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/assets/${encodeURIComponent(
          assetName
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

      toast.success("Asset deleted successfully");
      await fetchAssets();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete asset");
    }
  };

  const copyToClipboard = (url: string) => {
    try {
      // Use fallback method directly since Clipboard API is blocked in this environment
      const input = document.createElement("input");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices

      const successful = document.execCommand("copy");
      document.body.removeChild(input);

      if (successful) {
        toast.success("URL copied to clipboard");
      } else {
        throw new Error("Copy command failed");
      }
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy URL. Please copy manually.");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <PageTemplate
      title="Assets Management"
      description="Upload and manage images and files for WasteDB"
      onBack={navigateToAdminDashboard}
    >
      <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Upload className="size-6 text-blue-600" />
              <div>
                <CardTitle>Upload Asset</CardTitle>
                <CardDescription>
                  Upload images (PNG, JPG, SVG, WebP) - Max 5MB
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-upload">Choose File</Label>
                <Input
                  id="asset-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleUpload}
                  disabled={uploading || !accessToken}
                  className="cursor-pointer"
                />
              </div>
              {uploading && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assets List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Image className="size-6 text-green-600" />
              <div>
                <CardTitle>Uploaded Assets</CardTitle>
                <CardDescription>
                  {assets.length} asset{assets.length !== 1 ? "s" : ""} in
                  storage
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading assets...</p>
            ) : assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assets uploaded yet
              </p>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div
                    key={asset.name}
                    className="flex items-center gap-4 p-4 border border-[#211f1c]/10 dark:border-white/10 rounded-lg"
                  >
                    {/* Asset Preview */}
                    <div className="size-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={asset.publicUrl}
                        alt={asset.name}
                        className="size-full object-cover"
                      />
                    </div>

                    {/* Asset Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white truncate">
                        {asset.name}
                      </p>
                      <p className="text-[11px] text-black/50 dark:text-white/50">
                        {formatFileSize(asset.size)}
                      </p>
                      <p className="text-[10px] text-black/40 dark:text-white/40 font-mono truncate">
                        {asset.publicUrl}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(asset.publicUrl)}
                        title="Copy URL"
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(asset.publicUrl, "_blank")}
                        title="Open in new tab"
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(asset.name)}
                        title="Delete asset"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}
