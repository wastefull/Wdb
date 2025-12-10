import { useState, useRef } from "react";
import {
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ArrowLeft,
  FolderOpen,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import * as api from "../../utils/api";

interface WhitepaperSyncToolProps {
  onBack: () => void;
  className?: string;
}

interface WhitepaperFile {
  slug: string;
  title: string;
  filename: string;
  content: string;
  size: number;
  error?: string;
}

// Mapping of filenames to whitepaper metadata
const WHITEPAPER_MAPPINGS: { [key: string]: { slug: string; title: string } } =
  {
    "Recyclability.md": {
      slug: "recyclability",
      title: "Recyclability Methodology",
    },
    "CC-v1.md": {
      slug: "compostability",
      title: "Compostability Methodology (CC-v1)",
    },
    "RU-v1.md": {
      slug: "reusability",
      title: "Reusability Methodology (RU-v1)",
    },
    "VIZ-v1.md": {
      slug: "visualization",
      title: "Visualization Methodology (VIZ-v1)",
    },
    "Calculation_Methodology.md": {
      slug: "calculation-methodology",
      title: "Calculation Methodology",
    },
  };

export function WhitepaperSyncTool({
  onBack,
  className,
}: WhitepaperSyncToolProps) {
  const [syncing, setSyncing] = useState(false);
  const [whitepapers, setWhitepapers] = useState<WhitepaperFile[]>([]);
  const [syncResults, setSyncResults] = useState<{
    [key: string]: "success" | "error" | "pending";
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const loadedWhitepapers: WhitepaperFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if it's a markdown file
      if (!file.name.endsWith(".md")) {
        errors.push(`${file.name} is not a markdown file`);
        continue;
      }

      // Check if we have a mapping for this file
      const mapping = WHITEPAPER_MAPPINGS[file.name];
      if (!mapping) {
        errors.push(`${file.name} is not a recognized whitepaper file`);
        continue;
      }

      try {
        // Read the file content
        const content = await readFileAsText(file);

        if (!content || content.length === 0) {
          errors.push(`${file.name} is empty`);
          continue;
        }

        loadedWhitepapers.push({
          slug: mapping.slug,
          title: mapping.title,
          filename: file.name,
          content: content,
          size: file.size,
        });

        console.log(
          `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
        );
      } catch (error) {
        console.error(`Error reading ${file.name}:`, error);
        errors.push(
          `Failed to read ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    setWhitepapers(loadedWhitepapers);

    // Show summary
    if (loadedWhitepapers.length > 0) {
      toast.success(
        `Loaded ${loadedWhitepapers.length} whitepaper${
          loadedWhitepapers.length > 1 ? "s" : ""
        }`
      );
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          resolve(content);
        } else {
          reject(new Error("Failed to read file as text"));
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsText(file);
    });
  };

  const handleSyncAll = async () => {
    if (whitepapers.length === 0) {
      toast.error("No whitepapers loaded. Please upload files first.");
      return;
    }

    setSyncing(true);
    const results: { [key: string]: "success" | "error" | "pending" } = {};

    // Initialize all as pending
    whitepapers.forEach((wp) => {
      results[wp.slug] = "pending";
    });
    setSyncResults({ ...results });

    // Sync each whitepaper
    for (const whitepaper of whitepapers) {
      try {
        console.log(`Syncing whitepaper: ${whitepaper.slug}...`);
        console.log("  - Title:", whitepaper.title);
        console.log("  - Filename:", whitepaper.filename);
        console.log("  - Content length:", whitepaper.content.length);
        console.log(
          "  - Content preview:",
          whitepaper.content.substring(
            0,
            Math.min(100, whitepaper.content.length)
          )
        );

        await api.saveWhitepaper({
          slug: whitepaper.slug,
          title: whitepaper.title,
          content: whitepaper.content,
        });

        results[whitepaper.slug] = "success";
        setSyncResults({ ...results });
        console.log(`Successfully synced: ${whitepaper.slug}`);
      } catch (error) {
        console.error(`Error syncing ${whitepaper.slug}:`, error);
        results[whitepaper.slug] = "error";
        setSyncResults({ ...results });
      }
    }

    setSyncing(false);

    // Show summary toast
    const successCount = Object.values(results).filter(
      (r) => r === "success"
    ).length;
    const errorCount = Object.values(results).filter(
      (r) => r === "error"
    ).length;

    if (errorCount === 0) {
      toast.success(`All ${successCount} whitepapers synced successfully!`);
    } else {
      toast.error(`Synced ${successCount} whitepapers, ${errorCount} failed`);
    }
  };

  const getStatusIcon = (
    status: "success" | "error" | "pending" | undefined
  ) => {
    if (status === "success") {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status === "error") {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (status === "pending") {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div
      className={`min-h-screen bg-[#f5f3ed] dark:bg-[#1a1817] p-6 ${
        className || ""
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="card-interactive">
            <ArrowLeft size={16} className="text-black" />
          </button>
          <div className="flex-1">
            <h1 className="text-[24px] text-black dark:text-white mb-1">
              Whitepaper Sync Tool
            </h1>
            <p className="text-[12px] text-black/60 dark:text-white/60">
              Upload whitepaper markdown files to Supabase
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <h2 className="text-[16px] text-black dark:text-white mb-3">
            About This Tool
          </h2>
          <p className="text-[12px] text-black/70 dark:text-white/70 mb-3">
            Upload whitepaper markdown files from your computer to sync them to
            the Supabase KV store, making them available in the Methodology &
            Whitepapers section.
          </p>
          <div className="bg-[#e4e3ac] dark:bg-[#211f1c] p-3 rounded-md mb-3">
            <p className="text-[11px] text-black/80 dark:text-white/80 mb-2">
              <strong>Expected files:</strong>
            </p>
            <ul className="text-[10px] text-black/70 dark:text-white/70 space-y-1 list-disc list-inside">
              <li>Recyclability.md</li>
              <li>CC-v1.md (Compostability)</li>
              <li>RU-v1.md (Reusability)</li>
              <li>VIZ-v1.md (Visualization)</li>
              <li>Calculation_Methodology.md</li>
            </ul>
          </div>
          <p className="text-[11px] text-black/60 dark:text-white/60">
            <strong>Admin only:</strong> This operation requires admin
            privileges.
          </p>
        </Card>

        {/* File Upload */}
        <Card className="mb-6 p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <h2 className="text-[16px] text-black dark:text-white mb-4">
            Upload Files
          </h2>

          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#211f1c] dark:border-white/20 rounded-md bg-[#faf9f6] dark:bg-[#1a1918]">
            <FolderOpen className="w-12 h-12 text-black/30 dark:text-white/30 mb-4" />
            <p className="text-[12px] text-black/60 dark:text-white/60 mb-4">
              Select markdown files from your /whitepapers folder
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="whitepaper-upload"
            />
            <label htmlFor="whitepaper-upload">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={syncing}
                className="bg-[#e4e3ac] hover:bg-[#d4d39c] text-black"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </label>
            <p className="text-[10px] text-black/50 dark:text-white/50 mt-2">
              You can select multiple .md files at once
            </p>
          </div>
        </Card>

        {/* Loaded Whitepapers List */}
        {whitepapers.length > 0 && (
          <Card className="mb-6 p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] text-black dark:text-white">
                Loaded Whitepapers ({whitepapers.length})
              </h2>
            </div>

            <div className="space-y-3">
              {whitepapers.map((wp) => (
                <div
                  key={wp.slug}
                  className="flex items-center gap-4 p-4 bg-[#faf9f6] dark:bg-[#1a1918] rounded-md border border-[#211f1c] dark:border-white/20"
                >
                  <div className="shrink-0">
                    {getStatusIcon(syncResults[wp.slug])}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] text-black dark:text-white truncate">
                      {wp.title}
                    </h3>
                    <p className="text-[10px] text-black/60 dark:text-white/60">
                      {wp.filename} → whitepaper:{wp.slug} (
                      {(wp.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sync Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSyncAll}
            disabled={syncing || whitepapers.length === 0}
            className="bg-[#e4e3ac] hover:bg-[#d4d39c] text-black h-auto py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Syncing{" "}
                {
                  Object.values(syncResults).filter((r) => r === "success")
                    .length
                }
                /{whitepapers.length}...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {whitepapers.length === 0
                  ? "Upload Files First"
                  : "Sync All Whitepapers to Cloud"}
              </>
            )}
          </Button>
        </div>

        {/* Results Summary */}
        {Object.keys(syncResults).length > 0 && !syncing && (
          <Card className="mt-6 p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
            <h2 className="text-[16px] text-black dark:text-white mb-3">
              Sync Results
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <div className="text-[24px] font-bold text-green-600 dark:text-green-400">
                  {
                    Object.values(syncResults).filter((r) => r === "success")
                      .length
                  }
                </div>
                <div className="text-[11px] text-green-700 dark:text-green-300">
                  Success
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                <div className="text-[24px] font-bold text-red-600 dark:text-red-400">
                  {
                    Object.values(syncResults).filter((r) => r === "error")
                      .length
                  }
                </div>
                <div className="text-[11px] text-red-700 dark:text-red-300">
                  Failed
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="text-[24px] font-bold text-blue-600 dark:text-blue-400">
                  {whitepapers.length}
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300">
                  Total
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
