import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  ExternalLink,
  Save,
  X,
  AlertCircle,
  Cloud,
  CloudOff,
  Download,
  Upload,
  RefreshCw,
  GraduationCap,
  Unlock,
  Lock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { toast } from "sonner";
import { Source, SOURCE_LIBRARY } from "../../data/sources";
import * as api from "../../utils/api";
import { logger } from "../../utils/logger";
import { DuplicateSourceWarning } from "./DuplicateSourceWarning";
import { Material } from "../../types/material";

interface SourceLibraryManagerProps {
  onBack: () => void;
  materials: Material[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Helper function to generate Google Scholar search URL
const getGoogleScholarUrl = (title: string, authors?: string): string => {
  const query = authors ? `${title} ${authors}` : title;
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
};

export function SourceLibraryManager({
  onBack,
  materials,
  isAuthenticated,
  isAdmin,
}: SourceLibraryManagerProps) {
  const [sources, setSources] = useState<Source[]>([...SOURCE_LIBRARY]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOAOnly, setShowOAOnly] = useState(false); // Open Access filter
  const [checkingOA, setCheckingOA] = useState<Set<string>>(new Set()); // Track which sources are being checked
  const [oaStatus, setOaStatus] = useState<Map<string, any>>(new Map()); // Track OA status for each source
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPdf, setUploadingPdf] = useState<string | null>(null); // sourceId of PDF being uploaded
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSource, setPendingSource] = useState<Source | null>(null);
  const [formData, setFormData] = useState<Partial<Source>>({
    title: "",
    authors: "",
    year: new Date().getFullYear(),
    doi: "",
    url: "",
    weight: 1.0,
    type: "peer-reviewed",
    abstract: "",
    tags: [],
  });

  // Load sources from cloud on mount
  useEffect(() => {
    loadSourcesFromCloud();
  }, []);

  const loadSourcesFromCloud = async () => {
    try {
      setLoading(true);
      const cloudSources = await api.getAllSources();

      if (cloudSources.length > 0) {
        setSources(cloudSources);
        setCloudSynced(true);
      } else {
        // No cloud sources, use default library
        setSources([...SOURCE_LIBRARY]);
        setCloudSynced(false);
      }
    } catch (error) {
      console.error("Failed to load sources from cloud:", error);
      toast.error("Failed to load sources from cloud");
      setSources([...SOURCE_LIBRARY]);
      setCloudSynced(false);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags from sources
  const allTags = Array.from(
    new Set(sources.flatMap((s) => s.tags || []))
  ).sort();

  // Filter sources
  const filteredSources = sources.filter((source) => {
    const matchesSearch =
      !searchQuery ||
      source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesType = selectedType === "all" || source.type === selectedType;

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => source.tags?.includes(tag));

    const matchesOA = !showOAOnly || source.doi !== undefined;

    return matchesSearch && matchesType && matchesTags && matchesOA;
  });

  // Get usage statistics for a source
  const getSourceUsage = (sourceTitle: string, sourceDoi?: string) => {
    return materials.filter((material) =>
      material.sources?.some(
        (s) =>
          s.title === sourceTitle &&
          (!sourceDoi || !s.doi || s.doi === sourceDoi)
      )
    );
  };

  const handleAdd = async () => {
    // Validation
    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.type) {
      toast.error("Source type is required");
      return;
    }

    if (
      formData.year &&
      (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)
    ) {
      toast.error("Please enter a valid year");
      return;
    }

    if (
      formData.weight !== undefined &&
      (formData.weight < 0 || formData.weight > 1)
    ) {
      toast.error("Weight must be between 0 and 1");
      return;
    }

    // Create the source object
    const newSource: Source = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title.trim(),
      authors: formData.authors?.trim(),
      year: formData.year,
      doi: formData.doi?.trim(),
      url: formData.url?.trim(),
      weight: formData.weight || 1.0,
      type: formData.type as Source["type"],
      abstract: formData.abstract?.trim(),
      tags: formData.tags || [],
    };

    // Check for duplicates using backend API
    try {
      const duplicateCheck = await api.checkSourceDuplicate({
        doi: formData.doi?.trim(),
        title: formData.title.trim(),
      });

      if (duplicateCheck.isDuplicate) {
        // Show warning modal
        setDuplicateWarning(duplicateCheck);
        setPendingSource(newSource);
        setShowDuplicateWarning(true);
        return;
      }
    } catch (error) {
      console.error("Duplicate check failed:", error);
      toast.error("Failed to check for duplicates. Please try again.");
      return;
    }

    // No duplicates, proceed with adding
    await finalizeAddSource(newSource);
  };

  const finalizeAddSource = async (newSource: Source) => {
    // Update local state
    setSources([...sources, newSource]);

    // Sync to cloud if authenticated and admin
    if (isAuthenticated && isAdmin) {
      try {
        await api.createSource(newSource);
        toast.success("Source added and synced to cloud");
        setCloudSynced(true);
      } catch (error) {
        console.error("Failed to sync source to cloud:", error);
        toast.error("Source added locally but failed to sync to cloud");
      }
    } else {
      toast.success("Source added to library");
    }

    resetForm();
  };

  const handleAddAnyway = async () => {
    if (pendingSource) {
      await finalizeAddSource(pendingSource);
      setShowDuplicateWarning(false);
      setDuplicateWarning(null);
      setPendingSource(null);
    }
  };

  const handleMergeSource = async () => {
    // This would handle merging - for now just show message
    toast.info("Merge functionality coming soon");
    setShowDuplicateWarning(false);
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setFormData(source);
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    const updatedSource = { ...editingSource, ...formData } as Source;

    // Update local state
    setSources(
      sources.map((s) => (s.id === editingSource?.id ? updatedSource : s))
    );

    // Sync to cloud if authenticated and admin
    if (isAuthenticated && isAdmin && editingSource) {
      try {
        await api.updateSource(editingSource.id, updatedSource);
        toast.success("Source updated and synced to cloud");
        setCloudSynced(true);
      } catch (error) {
        console.error("Failed to sync source update to cloud:", error);
        toast.error("Source updated locally but failed to sync to cloud");
      }
    } else {
      toast.success("Source updated");
    }

    resetForm();
  };

  const handleDelete = async (sourceId: string) => {
    const source = sources.find((s) => s.id === sourceId);
    const usage = getSourceUsage(source?.title || "", source?.doi);

    if (usage.length > 0) {
      toast.error(`Cannot delete: Used by ${usage.length} material(s)`);
      return;
    }

    // Update local state
    setSources(sources.filter((s) => s.id !== sourceId));

    // Sync to cloud if authenticated and admin
    if (isAuthenticated && isAdmin) {
      try {
        await api.deleteSource(sourceId);
        toast.success("Source removed and synced to cloud");
        setCloudSynced(true);
      } catch (error) {
        console.error("Failed to sync source deletion to cloud:", error);
        toast.error("Source removed locally but failed to sync to cloud");
      }
    } else {
      toast.success("Source removed from library");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSource(null);
    setFormData({
      title: "",
      authors: "",
      year: new Date().getFullYear(),
      doi: "",
      url: "",
      weight: 1.0,
      type: "peer-reviewed",
      abstract: "",
      tags: [],
    });
  };

  const getTypeColor = (type: Source["type"]) => {
    switch (type) {
      case "peer-reviewed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "government":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "industrial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "ngo":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "internal":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getTypeLabel = (type: Source["type"]) => {
    const labels: Record<Source["type"], string> = {
      "peer-reviewed": "Peer-Reviewed",
      government: "Government",
      industrial: "Industrial/LCA",
      ngo: "NGO/Nonprofit",
      internal: "Internal",
    };
    return labels[type];
  };

  const handlePdfUpload = async (sourceId: string, file: File) => {
    console.log("📤 handlePdfUpload called:", {
      sourceId,
      fileName: file.name,
      isAuthenticated,
      isAdmin,
    });

    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required to upload PDFs");
      return;
    }

    try {
      setUploadingPdf(sourceId);
      console.log("⏳ Uploading PDF...");

      const result = await api.uploadSourcePdf(file, sourceId);
      console.log("✅ Upload result:", result);

      // Update the source with the PDF filename
      const updatedSources = sources.map((s) =>
        s.id === sourceId ? { ...s, pdfFileName: result.fileName } : s
      );
      setSources(updatedSources);

      // Sync the updated source to cloud
      const updatedSource = updatedSources.find((s) => s.id === sourceId);
      if (updatedSource) {
        console.log("☁️ Syncing updated source to cloud...");
        await api.updateSource(sourceId, updatedSource);
      }

      toast.success("PDF uploaded successfully");
    } catch (error) {
      console.error("❌ Failed to upload PDF:", error);
      toast.error(
        `Failed to upload PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploadingPdf(null);
    }
  };

  const handlePdfDelete = async (sourceId: string, pdfFileName: string) => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required to delete PDFs");
      return;
    }

    try {
      await api.deleteSourcePdf(pdfFileName);

      // Update the source to remove the PDF filename
      const updatedSources = sources.map((s) =>
        s.id === sourceId ? { ...s, pdfFileName: undefined } : s
      );
      setSources(updatedSources);

      // Sync the updated source to cloud
      const updatedSource = updatedSources.find((s) => s.id === sourceId);
      if (updatedSource) {
        await api.updateSource(sourceId, updatedSource);
      }

      toast.success("PDF deleted successfully");
    } catch (error) {
      console.error("Failed to delete PDF:", error);
      toast.error("Failed to delete PDF");
    }
  };

  // No longer needed - using direct <a> links now
  // const handleViewPdf = async (pdfFileName: string) => { ... };

  const handleSyncToCloud = async () => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required to sync to cloud");
      return;
    }

    try {
      await api.batchSaveSources(sources);
      toast.success(`${sources.length} sources synced to cloud`);
      setCloudSynced(true);
    } catch (error) {
      console.error("Failed to sync sources to cloud:", error);
      toast.error("Failed to sync sources to cloud");
    }
  };

  const handleExportSources = () => {
    try {
      const dataStr = JSON.stringify(sources, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wastedb-sources-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Sources exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export sources");
    }
  };

  const handleImportSources = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required to import sources");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedSources = JSON.parse(content);

        if (!Array.isArray(importedSources)) {
          toast.error("Invalid file format: Expected array of sources");
          return;
        }

        // Validate each source has required fields
        const validSources = importedSources.filter((s) => s.title && s.type);
        if (validSources.length !== importedSources.length) {
          toast.error(
            `Skipped ${
              importedSources.length - validSources.length
            } invalid sources`
          );
        }

        // Merge with existing sources (avoiding duplicates by ID)
        const existingIds = new Set(sources.map((s) => s.id));
        const newSources = validSources.filter((s) => !existingIds.has(s.id));
        const updatedSources = [...sources, ...newSources];

        setSources(updatedSources);
        setCloudSynced(false); // Mark as not synced

        toast.success(`Imported ${newSources.length} new sources`);
      } catch (error) {
        console.error("Import failed:", error);
        toast.error("Failed to import sources: Invalid JSON format");
      } finally {
        event.target.value = ""; // Reset file input
      }
    };

    reader.readAsText(file);
  };

  const handleRefreshFromCloud = async () => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    await loadSourcesFromCloud();
    toast.success("Sources refreshed from cloud");
  };

  // Check Open Access status for a source
  const checkOAStatus = async (sourceId: string, doi: string) => {
    if (!doi) return;

    // Mark as checking
    setCheckingOA((prev) => new Set(prev).add(sourceId));

    try {
      const response = await fetch(
        `https://${
          api.projectId
        }.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(
          doi
        )}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${api.publicAnonKey}` },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Store OA status
      setOaStatus((prev) => new Map(prev).set(sourceId, data));

      // Show success message
      if (data.is_open_access) {
        toast.success(`✓ Open Access: ${data.oa_status || "Available"}`);
      } else {
        toast.info("⊘ Closed Access - Not openly available");
      }
    } catch (error) {
      console.error("Failed to check OA status:", error);
      toast.error("Failed to check Open Access status");
    } finally {
      // Remove from checking set
      setCheckingOA((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Cloud className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20 animate-pulse" />
            <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
              Loading sources...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Back button - only show when onBack is provided and not in tab mode */}
        {onBack && (
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-[#211f1c] dark:border-white/20 text-[11px] md:text-sm"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Back
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white">
                Source Library Management
              </h1>
              {cloudSynced ? (
                <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <CloudOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
              Manage academic sources and citations ({sources.length} sources)
              {cloudSynced ? " • Synced with cloud" : " • Local only"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Export button - always available */}
            <Button
              onClick={handleExportSources}
              variant="outline"
              className="border-[#211f1c] dark:border-white/20 text-[11px] md:text-sm"
              disabled={sources.length === 0}
            >
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="whitespace-nowrap">Export</span>
            </Button>

            {/* Import button - admin only */}
            {isAuthenticated && isAdmin && (
              <Button
                variant="outline"
                className="border-[#211f1c] dark:border-white/20 text-[11px] md:text-sm relative"
                onClick={() =>
                  document.getElementById("import-sources-input")?.click()
                }
              >
                <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="whitespace-nowrap">Import</span>
                <input
                  id="import-sources-input"
                  type="file"
                  accept="application/json"
                  onChange={handleImportSources}
                  className="hidden"
                />
              </Button>
            )}

            {/* Refresh from cloud button */}
            {isAuthenticated && isAdmin && cloudSynced && (
              <Button
                onClick={handleRefreshFromCloud}
                variant="outline"
                className="border-[#211f1c] dark:border-white/20 text-[11px] md:text-sm"
              >
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="whitespace-nowrap">Refresh</span>
              </Button>
            )}

            {/* Sync to cloud button */}
            {isAuthenticated &&
              isAdmin &&
              !cloudSynced &&
              sources.length > 0 && (
                <Button
                  onClick={handleSyncToCloud}
                  variant="outline"
                  className="border-[#211f1c] dark:border-white/20 text-[11px] md:text-sm"
                >
                  <Cloud className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="whitespace-nowrap">Sync to Cloud</span>
                </Button>
              )}

            {/* Add source button */}
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black text-[11px] md:text-sm"
              disabled={!isAuthenticated || !isAdmin}
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="whitespace-nowrap">Add Source</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Label className="text-[11px] mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <Input
                  type="text"
                  placeholder="Search by title, author, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-[12px]"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <Label className="text-[11px] mb-2 block">Source Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="peer-reviewed">Peer-Reviewed</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="industrial">Industrial/LCA</SelectItem>
                  <SelectItem value="ngo">NGO/Nonprofit</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            <div>
              <Label className="text-[11px] mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto p-2 bg-white dark:bg-[#1a1918] border border-[#211f1c] dark:border-white/20 rounded-md">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer text-[9px] ${
                      selectedTags.includes(tag) ? "bg-blue-500 text-white" : ""
                    }`}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Open Access Filter Toggle */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant={showOAOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOAOnly(!showOAOnly)}
              className={
                showOAOnly ? "bg-green-600 hover:bg-green-700 text-white" : ""
              }
            >
              {showOAOnly ? (
                <>
                  <Unlock className="w-3 h-3 mr-2" />
                  Open Access Only
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 mr-2" />
                  Show All Sources
                </>
              )}
            </Button>
            <p className="text-[9px] text-black/60 dark:text-white/60">
              {showOAOnly
                ? "Showing only sources with DOIs"
                : "Toggle to filter Open Access sources"}
            </p>
          </div>

          {(selectedType !== "all" ||
            selectedTags.length > 0 ||
            searchQuery ||
            showOAOnly) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Showing {filteredSources.length} of {sources.length} sources
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("all");
                  setSelectedTags([]);
                  setShowOAOnly(false);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Sources Table */}
        <Card className="bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                    Source
                  </TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                    Type
                  </TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                    Weight
                  </TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                    Tags
                  </TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-center">
                    Usage
                  </TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => {
                  const usage = getSourceUsage(source.title, source.doi);
                  return (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white font-medium">
                            {source.title}
                          </p>
                          {source.authors && (
                            <p className="text-[9px] text-black/60 dark:text-white/60">
                              {source.authors}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {source.year && (
                              <Badge variant="outline" className="text-[8px]">
                                {source.year}
                              </Badge>
                            )}
                            {source.doi ? (
                              <>
                                <a
                                  href={`https://doi.org/${source.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  DOI <ExternalLink className="w-2 h-2" />
                                </a>
                                {/* OA Status Badge */}
                                {oaStatus.has(source.id) ? (
                                  oaStatus.get(source.id)?.is_open_access ? (
                                    <Badge
                                      className="text-[8px] bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 cursor-pointer"
                                      title={`Open Access: ${
                                        oaStatus.get(source.id)?.oa_status ||
                                        "Available"
                                      }`}
                                      onClick={() => {
                                        const url = oaStatus.get(source.id)
                                          ?.best_oa_location?.url;
                                        if (url) window.open(url, "_blank");
                                      }}
                                    >
                                      <Unlock className="w-2 h-2 mr-1" />
                                      OA
                                    </Badge>
                                  ) : (
                                    <Badge
                                      className="text-[8px] bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                      title="Closed Access - Not openly available"
                                    >
                                      <Lock className="w-2 h-2 mr-1" />
                                      Closed
                                    </Badge>
                                  )
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-5 px-2 text-[8px]"
                                    onClick={() =>
                                      checkOAStatus(source.id, source.doi!)
                                    }
                                    disabled={checkingOA.has(source.id)}
                                    title="Check Open Access status"
                                  >
                                    {checkingOA.has(source.id) ? (
                                      <RefreshCw className="w-2 h-2 animate-spin" />
                                    ) : (
                                      <>
                                        <Unlock className="w-2 h-2 mr-1" />
                                        Check OA
                                      </>
                                    )}
                                  </Button>
                                )}
                              </>
                            ) : source.pdfFileName ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={api.getSourcePdfViewUrl(
                                    source.pdfFileName
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  title="View uploaded PDF"
                                  onClick={(e) => {
                                    logger.log(
                                      `🖱️ User clicked "View PDF" for:`,
                                      source.pdfFileName
                                    );
                                    logger.log(
                                      `   URL:`,
                                      api.getSourcePdfViewUrl(
                                        source.pdfFileName
                                      )
                                    );
                                    logger.log(`   Source:`, source.title);
                                  }}
                                >
                                  <BookOpen className="w-2 h-2" /> View PDF
                                </a>
                                <button
                                  onClick={async () => {
                                    logger.log(
                                      `🔍 Running diagnostics for:`,
                                      source.pdfFileName
                                    );
                                    try {
                                      const diagnostics =
                                        await api.getSourcePdfDiagnostics(
                                          source.pdfFileName
                                        );
                                      logger.log(
                                        ` Diagnostics results:`,
                                        diagnostics
                                      );
                                      console.table(diagnostics.checks);

                                      // Show a summary toast
                                      const bucketPublic =
                                        diagnostics.checks.bucketFound?.details
                                          ?.public;
                                      const fileExists =
                                        diagnostics.checks.fileExists?.exists;
                                      const urlStatus =
                                        diagnostics.checks.urlAccessibility
                                          ?.status;

                                      if (
                                        bucketPublic &&
                                        fileExists &&
                                        urlStatus === 200
                                      ) {
                                        toast.success(
                                          "✅ All checks passed! PDF should be accessible."
                                        );
                                      } else {
                                        const issues = [];
                                        if (!bucketPublic)
                                          issues.push("Bucket is PRIVATE");
                                        if (!fileExists)
                                          issues.push("File NOT FOUND");
                                        if (urlStatus !== 200)
                                          issues.push(
                                            `URL returns ${urlStatus}`
                                          );
                                        toast.error(
                                          `❌ Issues: ${issues.join(", ")}`
                                        );
                                      }
                                    } catch (error) {
                                      logger.error(
                                        "❌ Diagnostics failed:",
                                        error
                                      );
                                      toast.error("Failed to run diagnostics");
                                    }
                                  }}
                                  className="text-[9px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Run diagnostics"
                                >
                                  🔍 Debug
                                </button>
                              </div>
                            ) : (
                              <a
                                href={getGoogleScholarUrl(
                                  source.title,
                                  source.authors
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                title="Search on Google Scholar"
                              >
                                <GraduationCap className="w-2 h-2" /> Scholar
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[8px] ${getTypeColor(source.type)}`}
                        >
                          {getTypeLabel(source.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] text-black dark:text-white">
                          {source.weight?.toFixed(1) || "1.0"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {source.tags?.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[8px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {source.tags && source.tags.length > 3 && (
                            <Badge variant="outline" className="text-[8px]">
                              +{source.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {usage.length > 0 ? (
                          <Badge variant="outline" className="text-[9px]">
                            {usage.length} material
                            {usage.length !== 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-black/40 dark:text-white/40">
                            Unused
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          {isAdmin && !source.doi && (
                            <>
                              {source.pdfFileName ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePdfDelete(
                                      source.id,
                                      source.pdfFileName!
                                    )
                                  }
                                  title="Delete PDF"
                                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const input =
                                      document.createElement("input");
                                    input.type = "file";
                                    input.accept = "application/pdf";
                                    input.onchange = (e) => {
                                      const file = (
                                        e.target as HTMLInputElement
                                      ).files?.[0];
                                      if (file)
                                        handlePdfUpload(source.id, file);
                                    };
                                    input.click();
                                  }}
                                  disabled={uploadingPdf === source.id}
                                  title="Upload PDF"
                                >
                                  {uploadingPdf === source.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(source)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(source.id)}
                            disabled={usage.length > 0}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredSources.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20" />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
                No sources found
              </p>
            </div>
          )}
        </Card>

        {/* Add/Edit Source Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Sniglet:Regular',_sans-serif]">
                {editingSource ? "Edit Source" : "Add New Source"}
              </DialogTitle>
              <DialogDescription className="text-[11px]">
                Add or edit academic sources in the library. These sources can
                be cited in scientific data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label className="text-[11px]">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Paper title..."
                  className="text-[12px]"
                />
              </div>

              {/* Authors */}
              <div>
                <Label className="text-[11px]">Authors</Label>
                <Input
                  value={formData.authors}
                  onChange={(e) =>
                    setFormData({ ...formData, authors: e.target.value })
                  }
                  placeholder="Smith, J., Doe, A., et al."
                  className="text-[12px]"
                />
              </div>

              {/* Year and Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="text-[12px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Source Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Source["type"]) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peer-reviewed">
                        Peer-Reviewed (1.0)
                      </SelectItem>
                      <SelectItem value="government">
                        Government (0.9)
                      </SelectItem>
                      <SelectItem value="industrial">
                        Industrial/LCA (0.7)
                      </SelectItem>
                      <SelectItem value="ngo">NGO/Nonprofit (0.6)</SelectItem>
                      <SelectItem value="internal">Internal (0.3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* DOI and URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">DOI</Label>
                  <Input
                    value={formData.doi}
                    onChange={(e) =>
                      setFormData({ ...formData, doi: e.target.value })
                    }
                    placeholder="10.1016/j.example.2024.01.001"
                    className="text-[12px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">URL</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://..."
                    className="text-[12px]"
                  />
                </div>
              </div>

              {/* Weight */}
              <div>
                <Label className="text-[11px]">Weight (0-1)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weight: parseFloat(e.target.value),
                    })
                  }
                  className="text-[12px]"
                />
                <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
                  Confidence weight for aggregation calculations
                </p>
              </div>

              {/* Abstract */}
              <div>
                <Label className="text-[11px]">Abstract</Label>
                <Textarea
                  value={formData.abstract}
                  onChange={(e) =>
                    setFormData({ ...formData, abstract: e.target.value })
                  }
                  placeholder="Brief summary of the source..."
                  rows={3}
                  className="text-[12px]"
                />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-[11px]">Tags (comma-separated)</Label>
                <Input
                  value={formData.tags?.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="plastic, recycling, pet, yield"
                  className="text-[12px]"
                />
                <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
                  Material types, processes, parameters (e.g., glass, recycling,
                  yield)
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={editingSource ? handleUpdate : handleAdd}
                  className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingSource ? "Update" : "Add"} Source
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Alert */}
        {!isAuthenticated || !isAdmin ? (
          <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-[11px] text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Admin access required to modify the source
              library. Sign in with an admin account to add, edit, or delete
              sources.
            </AlertDescription>
          </Alert>
        ) : cloudSynced ? (
          <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
            <Cloud className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-[11px] text-green-800 dark:text-green-200">
              <strong>Cloud Sync Active:</strong> Changes to the source library
              are automatically synced to the cloud and will persist across
              sessions.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mt-4 bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700">
            <CloudOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-[11px] text-orange-800 dark:text-orange-200">
              <strong>Local Only:</strong> Sources are stored locally. Click
              "Sync to Cloud" to save changes permanently.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Duplicate Source Warning Modal */}
      {showDuplicateWarning && duplicateWarning && (
        <DuplicateSourceWarning
          isOpen={showDuplicateWarning}
          onClose={() => {
            setShowDuplicateWarning(false);
            setDuplicateWarning(null);
            setPendingSource(null);
          }}
          onAddAnyway={handleAddAnyway}
          onMerge={isAdmin ? handleMergeSource : undefined}
          duplicateInfo={duplicateWarning}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
