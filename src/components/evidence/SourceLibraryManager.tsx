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
  AlertTriangle,
  Copy,
  Link,
  Loader2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
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
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [showUrlImportDialog, setShowUrlImportDialog] = useState<string | null>(
    null
  ); // sourceId for URL import
  const [importingPdfUrl, setImportingPdfUrl] = useState(false);
  const [pdfUrlInput, setPdfUrlInput] = useState("");
  // CrossRef lookup state
  const [crossRefData, setCrossRefData] = useState<any>(null);
  const [fetchingCrossRef, setFetchingCrossRef] = useState(false);
  const [crossRefError, setCrossRefError] = useState<string | null>(null);
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
    citation_count: undefined,
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
      citation_count: formData.citation_count,
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

    // For cloud-synced sources, try API deletion first before updating local state
    if (isAuthenticated && isAdmin) {
      try {
        await api.deleteSource(sourceId);
        // Only update local state after successful API deletion
        setSources(sources.filter((s) => s.id !== sourceId));
        toast.success("Source deleted");
        setCloudSynced(true);
      } catch (error: any) {
        console.error("Failed to delete source:", error);
        // Show the actual error message from the server
        const errorMessage = error?.message || "Failed to delete source";
        if (errorMessage.includes("dependent evidence")) {
          toast.error(
            "Cannot delete: Source has dependent evidence (MIUs). Delete the evidence first."
          );
        } else {
          toast.error(errorMessage);
        }
        // Don't update local state - source still exists
      }
    } else {
      // Local-only deletion (non-admin or not authenticated)
      setSources(sources.filter((s) => s.id !== sourceId));
      toast.success("Source removed from library");
    }
  };

  const handleDeleteAllSources = async () => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    try {
      setDeletingAll(true);
      const result = await api.deleteAllSources();

      // Update local state - clear all sources or keep skipped ones
      if (result.skippedCount > 0) {
        // Keep only the sources that were skipped (have dependencies)
        setSources(sources.filter((s) => result.skippedIds.includes(s.id)));
        toast.warning(
          `Deleted ${result.deletedCount} sources. ${result.skippedCount} sources skipped (have dependent evidence).`
        );
      } else {
        setSources([]);
        toast.success(
          `Successfully deleted all ${result.deletedCount} sources.`
        );
      }

      setCloudSynced(true);
    } catch (error: any) {
      console.error("Failed to delete all sources:", error);
      toast.error(error.message || "Failed to delete all sources");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    try {
      setRemovingDuplicates(true);
      const result = await api.removeDuplicateSources();

      if (result.deletedCount > 0) {
        // Remove deleted sources from local state
        setSources(sources.filter((s) => !result.deletedIds.includes(s.id)));

        if (result.skippedCount > 0) {
          toast.warning(
            `Removed ${result.deletedCount} duplicates. ${result.skippedCount} skipped (have dependencies).`
          );
        } else {
          toast.success(
            `Successfully removed ${result.deletedCount} duplicate sources.`
          );
        }
      } else if (result.duplicatesFound > 0) {
        toast.info(
          `Found ${result.duplicatesFound} duplicates but all have dependencies.`
        );
      } else {
        toast.info("No duplicate sources found.");
      }

      setCloudSynced(true);
    } catch (error: any) {
      console.error("Failed to remove duplicates:", error);
      toast.error(error.message || "Failed to remove duplicates");
    } finally {
      setRemovingDuplicates(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSource(null);
    setCrossRefData(null);
    setCrossRefError(null);
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
      citation_count: undefined,
    });
  };

  // Fetch metadata from CrossRef API
  const handleFetchCrossRef = async () => {
    const doi = formData.doi?.trim();
    if (!doi) {
      setCrossRefError("Please enter a DOI first");
      return;
    }

    // Clean the DOI (remove URL prefix if present)
    const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");

    try {
      setFetchingCrossRef(true);
      setCrossRefError(null);
      setCrossRefData(null);

      const response = await fetch(
        `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("DOI not found in CrossRef");
        }
        throw new Error(`CrossRef API error: ${response.status}`);
      }

      const data = await response.json();
      const message = data.message;

      // Format the data for display
      const formatted = {
        title: message.title?.[0] || "",
        authors:
          message.author
            ?.map((a: any) => {
              if (a.given && a.family) return `${a.family}, ${a.given}`;
              if (a.family) return a.family;
              if (a.name) return a.name;
              return "";
            })
            .filter(Boolean)
            .join("; ") || "",
        year:
          message.published?.["date-parts"]?.[0]?.[0] ||
          message.created?.["date-parts"]?.[0]?.[0] ||
          "",
        journal: message["container-title"]?.[0] || "",
        url: message.URL || `https://doi.org/${cleanDoi}`,
        abstract: message.abstract?.replace(/<[^>]*>/g, "") || "", // Strip HTML tags
        tags: message.subject?.join(", ") || "", // CrossRef uses "subject" for tags/keywords
        type: message.type || "",
        publisher: message.publisher || "",
        issn: message.ISSN?.[0] || "",
        license: message.license?.[0]?.URL || "",
        citationCount: message["is-referenced-by-count"] || 0, // Citation count from CrossRef
      };

      setCrossRefData(formatted);

      // Auto-update citation count for existing sources that don't have one
      if (
        editingSource &&
        !editingSource.citation_count &&
        formatted.citationCount > 0
      ) {
        try {
          const updatedSource = {
            ...editingSource,
            citation_count: formatted.citationCount,
          };
          await api.updateSource(editingSource.id, updatedSource);
          // Update local state
          setSources((prev) =>
            prev.map((s) => (s.id === editingSource.id ? updatedSource : s))
          );
          setEditingSource(updatedSource);
          setFormData((prev) => ({
            ...prev,
            citation_count: formatted.citationCount,
          }));
          toast.success(
            `Citation count (${formatted.citationCount.toLocaleString()}) saved automatically`
          );
        } catch (error) {
          console.error("Failed to auto-update citation count:", error);
          // Silent fail - user can still manually save
        }
      }
    } catch (error) {
      console.error("CrossRef fetch error:", error);
      setCrossRefError(
        error instanceof Error ? error.message : "Failed to fetch from CrossRef"
      );
    } finally {
      setFetchingCrossRef(false);
    }
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
        console.log("☁️ Syncing updated source to cloud...", {
          sourceId,
          pdfFileName: updatedSource.pdfFileName,
          fullSource: updatedSource,
        });
        const syncResult = await api.updateSource(sourceId, updatedSource);
        console.log("☁️ Sync result:", syncResult);
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

  // Import PDF from external URL (Open Access sources)
  const handlePdfImportFromUrl = async (sourceId: string, url: string) => {
    console.log("🔗 handlePdfImportFromUrl called:", { sourceId, url });

    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required to import PDFs");
      return;
    }

    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setImportingPdfUrl(true);
      console.log("⏳ Importing PDF from URL...");

      const result = await api.importPdfFromUrl(url.trim(), sourceId);
      console.log("✅ Import result:", result);

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

      toast.success(
        `PDF imported successfully (${Math.round(result.size / 1024)}KB)`
      );
      setShowUrlImportDialog(null);
      setPdfUrlInput("");
    } catch (error: any) {
      console.error("❌ Failed to import PDF:", error);

      // Check if the error suggests manual download
      const errorMessage = error?.message || "Unknown error";
      const isAuthError =
        errorMessage.includes("authentication") ||
        errorMessage.includes("blocks automated") ||
        errorMessage.includes("403") ||
        errorMessage.includes("401");

      if (isAuthError) {
        toast.error(
          "This publisher blocks automated downloads. Please download the PDF manually and use the upload button.",
          { duration: 6000 }
        );
      } else {
        toast.error(`Failed to import PDF: ${errorMessage}`);
      }
    } finally {
      setImportingPdfUrl(false);
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

  // Toggle Open Access status manually (override Unpaywall)
  const handleToggleOAStatus = async (sourceId: string) => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    const source = sources.find((s) => s.id === sourceId);
    if (!source) return;

    // Determine current OA status (from manual override, oaStatus state, or source field)
    const currentOaFromState = oaStatus.get(sourceId);
    const currentIsOA =
      source.is_open_access ?? currentOaFromState?.is_open_access ?? false;
    const newIsOA = !currentIsOA;

    // Update local state
    const updatedSources = sources.map((s) =>
      s.id === sourceId
        ? {
            ...s,
            is_open_access: newIsOA,
            manual_oa_override: true,
            oa_status: newIsOA ? "manual" : "closed",
          }
        : s
    );
    setSources(updatedSources);

    // Also update the oaStatus map so the UI reflects immediately
    setOaStatus((prev) => {
      const newMap = new Map(prev);
      newMap.set(sourceId, {
        is_open_access: newIsOA,
        oa_status: newIsOA ? "manual" : "closed",
        manual_override: true,
      });
      return newMap;
    });

    // Sync to cloud
    try {
      const updatedSource = updatedSources.find((s) => s.id === sourceId);
      if (updatedSource) {
        await api.updateSource(sourceId, updatedSource);
        toast.success(
          newIsOA
            ? "Marked as Open Access (manual override)"
            : "Marked as Closed Access (manual override)"
        );
        setCloudSynced(true);
      }
    } catch (error) {
      console.error("Failed to update OA status:", error);
      toast.error("Failed to save OA status");
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

      // Store OA status in state
      setOaStatus((prev) => new Map(prev).set(sourceId, data));

      // Also persist to source object and cloud (clears manual override)
      const updatedSources = sources.map((s) =>
        s.id === sourceId
          ? {
              ...s,
              is_open_access: data.is_open_access,
              oa_status: data.oa_status || null,
              best_oa_url: data.best_oa_location?.url || null,
              manual_oa_override: false, // Clear manual override since we just checked via Unpaywall
            }
          : s
      );
      setSources(updatedSources);

      // Sync to cloud if admin
      if (isAuthenticated && isAdmin) {
        const updatedSource = updatedSources.find((s) => s.id === sourceId);
        if (updatedSource) {
          try {
            await api.updateSource(sourceId, updatedSource);
            setCloudSynced(true);
          } catch (err) {
            console.error("Failed to sync OA status to cloud:", err);
          }
        }
      }

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
            <p className="text-[14px] text-black/50 dark:text-white/50">
              Loading sources...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
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
              <h1 className="text-[16px] text-black dark:text-white">
                Source Library Management
              </h1>
              {cloudSynced ? (
                <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <CloudOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <p className="text-[12px] text-black/60 dark:text-white/60">
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

            {/* Remove Duplicates button */}
            {isAuthenticated && isAdmin && sources.length > 1 && (
              <Button
                onClick={handleRemoveDuplicates}
                variant="outline"
                className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 text-[11px] md:text-sm"
                disabled={removingDuplicates}
              >
                <Copy className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="whitespace-nowrap">
                  {removingDuplicates ? "Removing..." : "Remove Duplicates"}
                </span>
              </Button>
            )}

            {/* Delete All Sources button with confirmation */}
            {isAuthenticated && isAdmin && sources.length > 0 && (
              <Dialog
                open={showDeleteAllDialog}
                onOpenChange={setShowDeleteAllDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-500/50 text-red-600 hover:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 text-[11px] md:text-sm"
                    disabled={deletingAll}
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    <span className="whitespace-nowrap">
                      {deletingAll ? "Deleting..." : "Delete All"}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-md bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20"
                  style={{
                    top: "50vh",
                    left: "50vw",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Delete All Sources
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="space-y-3 text-black/70 dark:text-white/70">
                        <p>
                          Are you sure you want to delete{" "}
                          <strong>all {sources.length} sources</strong> from the
                          library?
                        </p>
                        <p className="text-amber-600 dark:text-amber-400">
                          ⚠️ This action cannot be undone. Sources with
                          dependent evidence points will be skipped.
                        </p>
                        <p className="text-sm text-black/50 dark:text-white/50">
                          A single audit email will be sent summarizing this
                          bulk deletion.
                        </p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="border-[#211f1c] dark:border-white/20"
                      onClick={() => setShowDeleteAllDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteAllDialog(false);
                        handleDeleteAllSources();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Yes, Delete All
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
            <Table className="table-fixed w-[99%]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] w-[38%]">Source</TableHead>
                  <TableHead className="text-[11px] w-[9%]">Type</TableHead>
                  <TableHead className="text-[11px] w-[7%]">Weight</TableHead>
                  <TableHead className="text-[11px] w-[17%]">Tags</TableHead>
                  <TableHead className="text-[11px] text-center w-[9%]">
                    Usage
                  </TableHead>
                  <TableHead className="text-[11px] w-[20%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => {
                  const usage = getSourceUsage(source.title, source.doi);
                  return (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p
                            className="text-[11px] text-black dark:text-white font-medium truncate"
                            title={source.title}
                          >
                            {source.title}
                          </p>
                          {source.authors && (
                            <p
                              className="text-[9px] text-black/60 dark:text-white/60 truncate"
                              title={source.authors}
                            >
                              {source.authors}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {source.year && (
                              <Badge variant="outline" className="text-[8px]">
                                {source.year}
                              </Badge>
                            )}
                            {source.citation_count !== undefined &&
                              source.citation_count > 0 && (
                                <Badge
                                  className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 text-[8px]"
                                  title={`${source.citation_count.toLocaleString()} citations at entry time (from CrossRef)`}
                                >
                                  {source.citation_count >= 1000
                                    ? `${(source.citation_count / 1000).toFixed(
                                        1
                                      )}k`
                                    : source.citation_count}{" "}
                                  cited
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
                                {/* OA Status Badge - check source field first, then oaStatus state */}
                                {(() => {
                                  // Determine OA status: source field (manual override) > oaStatus state > unknown
                                  const hasManualOverride =
                                    source.manual_oa_override === true;
                                  // Check for stored OA status (handles both undefined and null)
                                  const hasSourceOA =
                                    source.is_open_access === true ||
                                    source.is_open_access === false;
                                  const hasStateOA = oaStatus.has(source.id);

                                  const isOA = hasSourceOA
                                    ? source.is_open_access
                                    : hasStateOA
                                    ? oaStatus.get(source.id)?.is_open_access
                                    : undefined;

                                  const oaStatusText = hasManualOverride
                                    ? "Manual"
                                    : source.oa_status ||
                                      oaStatus.get(source.id)?.oa_status ||
                                      "";

                                  // Show status badge if we have OA info (from source or state)
                                  if (isOA === true) {
                                    return (
                                      <div className="flex items-center gap-1">
                                        <Badge
                                          className={`text-[8px] cursor-pointer ${
                                            hasManualOverride
                                              ? "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300 border border-teal-400 dark:border-teal-600"
                                              : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                          }`}
                                          title={`Open Access${
                                            hasManualOverride
                                              ? " (Manual Override)"
                                              : ""
                                          }: ${oaStatusText || "Available"}${
                                            isAdmin ? " - Click to toggle" : ""
                                          }`}
                                          onClick={() => {
                                            if (isAdmin) {
                                              handleToggleOAStatus(source.id);
                                            } else {
                                              const url = oaStatus.get(
                                                source.id
                                              )?.best_oa_location?.url;
                                              if (url)
                                                window.open(url, "_blank");
                                            }
                                          }}
                                        >
                                          <Unlock className="w-2 h-2 mr-1" />
                                          OA{hasManualOverride ? "*" : ""}
                                        </Badge>
                                        {/* Refresh button to re-check via Unpaywall */}
                                        {isAdmin && (
                                          <button
                                            onClick={() =>
                                              checkOAStatus(
                                                source.id,
                                                source.doi!
                                              )
                                            }
                                            disabled={checkingOA.has(source.id)}
                                            className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded"
                                            title="Re-check via Unpaywall"
                                          >
                                            <RefreshCw
                                              className={`w-2.5 h-2.5 text-black/40 dark:text-white/40 ${
                                                checkingOA.has(source.id)
                                                  ? "animate-spin"
                                                  : ""
                                              }`}
                                            />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  } else if (isOA === false) {
                                    return (
                                      <div className="flex items-center gap-1">
                                        <Badge
                                          className={`text-[8px] ${
                                            isAdmin ? "cursor-pointer" : ""
                                          } ${
                                            hasManualOverride
                                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-400 dark:border-orange-600"
                                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                          }`}
                                          title={`Closed Access${
                                            hasManualOverride
                                              ? " (Manual Override)"
                                              : " - Per Unpaywall (may be inaccurate for gov/IGO sources)"
                                          }${
                                            isAdmin ? " - Click to toggle" : ""
                                          }`}
                                          onClick={() => {
                                            if (isAdmin) {
                                              handleToggleOAStatus(source.id);
                                            }
                                          }}
                                        >
                                          <Lock className="w-2 h-2 mr-1" />
                                          Closed{hasManualOverride ? "*" : ""}
                                        </Badge>
                                        {/* Refresh button to re-check via Unpaywall */}
                                        {isAdmin && (
                                          <button
                                            onClick={() =>
                                              checkOAStatus(
                                                source.id,
                                                source.doi!
                                              )
                                            }
                                            disabled={checkingOA.has(source.id)}
                                            className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded"
                                            title="Re-check via Unpaywall"
                                          >
                                            <RefreshCw
                                              className={`w-2.5 h-2.5 text-black/40 dark:text-white/40 ${
                                                checkingOA.has(source.id)
                                                  ? "animate-spin"
                                                  : ""
                                              }`}
                                            />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // Unknown - show check button
                                    return (
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
                                    );
                                  }
                                })()}
                                {/* Show PDF link for sources with DOI that also have uploaded PDF */}
                                {source.pdfFileName && (
                                  <a
                                    href={api.getSourcePdfViewUrl(
                                      source.pdfFileName
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 cursor-pointer"
                                    title="View uploaded PDF"
                                  >
                                    <BookOpen className="w-2 h-2" /> PDF
                                  </a>
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
                                      source.pdfFileName!
                                    );
                                    logger.log(
                                      `   URL:`,
                                      api.getSourcePdfViewUrl(
                                        source.pdfFileName!
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
                                      source.pdfFileName!
                                    );
                                    try {
                                      const diagnostics =
                                        await api.getSourcePdfDiagnostics(
                                          source.pdfFileName!
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
                        <div className="flex gap-1">
                          {isAdmin && (
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
                                <>
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
                                    disabled={
                                      uploadingPdf === source.id ||
                                      importingPdfUrl
                                    }
                                    title="Upload PDF from file"
                                  >
                                    {uploadingPdf === source.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Upload className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setShowUrlImportDialog(source.id);
                                      // Pre-fill with source URL if it looks like a PDF
                                      if (
                                        source.url
                                          ?.toLowerCase()
                                          .endsWith(".pdf")
                                      ) {
                                        setPdfUrlInput(source.url);
                                      } else {
                                        setPdfUrlInput("");
                                      }
                                    }}
                                    disabled={
                                      uploadingPdf === source.id ||
                                      importingPdfUrl
                                    }
                                    title="Import PDF from URL (Open Access)"
                                  >
                                    <Link className="w-3 h-3" />
                                  </Button>
                                </>
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
              <p className="text-[14px] text-black/50 dark:text-white/50">
                No sources found
              </p>
            </div>
          )}
        </Card>

        {/* Add/Edit Source Dialog */}
        <Dialog
          open={showForm}
          onOpenChange={(open: boolean) => !open && resetForm()}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="">
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
                  value={formData.title || ""}
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
                  value={formData.authors || ""}
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
                  <div className="flex gap-1">
                    <Input
                      value={formData.doi || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, doi: e.target.value })
                      }
                      placeholder="10.1016/j.example.2024.01.001"
                      className="text-[12px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFetchCrossRef}
                      disabled={!formData.doi || fetchingCrossRef}
                      title="Fetch metadata from CrossRef"
                    >
                      {fetchingCrossRef ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {crossRefError && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {crossRefError}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-[11px]">URL</Label>
                  <Input
                    value={formData.url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://..."
                    className="text-[12px]"
                  />
                </div>
              </div>

              {/* CrossRef Metadata Panel */}
              {crossRefData && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-[11px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-800">
                      CrossRef Metadata (for reference)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCrossRefData(null)}
                      className="h-5 w-5 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    {crossRefData.title && (
                      <div>
                        <span className="font-medium">Title:</span>{" "}
                        <span className="select-all">{crossRefData.title}</span>
                      </div>
                    )}
                    {crossRefData.authors && (
                      <div>
                        <span className="font-medium">Authors:</span>{" "}
                        <span className="select-all">
                          {crossRefData.authors}
                        </span>
                      </div>
                    )}
                    {crossRefData.year && (
                      <div>
                        <span className="font-medium">Year:</span>{" "}
                        <span className="select-all">{crossRefData.year}</span>
                      </div>
                    )}
                    {crossRefData.journal && (
                      <div>
                        <span className="font-medium">Journal:</span>{" "}
                        <span className="select-all">
                          {crossRefData.journal}
                        </span>
                      </div>
                    )}
                    {crossRefData.url && (
                      <div>
                        <span className="font-medium">URL:</span>{" "}
                        <a
                          href={crossRefData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline select-all"
                        >
                          {crossRefData.url}
                        </a>
                      </div>
                    )}
                    {crossRefData.tags && (
                      <div>
                        <span className="font-medium">Tags:</span>{" "}
                        <span className="select-all">{crossRefData.tags}</span>
                      </div>
                    )}
                    {crossRefData.citationCount !== undefined &&
                      crossRefData.citationCount > 0 && (
                        <div>
                          <span className="font-medium">Citations:</span>{" "}
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 text-[9px]">
                            {crossRefData.citationCount.toLocaleString()} cited
                          </Badge>
                        </div>
                      )}
                    {crossRefData.abstract && (
                      <div className="mt-2">
                        <span className="font-medium">Abstract:</span>
                        <p className="mt-1 text-[10px] leading-relaxed select-all text-gray-600 max-h-32 overflow-y-auto">
                          {crossRefData.abstract}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: crossRefData.title || formData.title,
                          authors: crossRefData.authors || formData.authors,
                          year: crossRefData.year || formData.year,
                          url: crossRefData.url || formData.url,
                          abstract: crossRefData.abstract || formData.abstract,
                          tags: crossRefData.tags
                            ? crossRefData.tags
                                .split(", ")
                                .map((t: string) => t.trim())
                                .filter(Boolean)
                            : formData.tags,
                          citation_count:
                            crossRefData.citationCount || undefined,
                        });
                        toast.success("Form populated with CrossRef data");
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px]"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Auto-fill Form with CrossRef Data
                    </Button>
                  </div>
                </div>
              )}

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
                <p className="caption">
                  Confidence weight for aggregation calculations
                </p>
              </div>

              {/* Abstract */}
              <div>
                <Label className="text-[11px]">Abstract</Label>
                <Textarea
                  value={formData.abstract || ""}
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
                <Label className="text-[11px]">
                  Tags (comma or semicolon-separated)
                </Label>
                <Input
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .replace(/;/g, ",") // Convert semicolons to commas
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="PET, recycling, HDPE, yield"
                  className="text-[12px]"
                />
                <p className="caption">
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

        {/* PDF Import from URL Dialog */}
        <Dialog
          open={showUrlImportDialog !== null}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setShowUrlImportDialog(null);
              setPdfUrlInput("");
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Import PDF from URL
              </DialogTitle>
              <DialogDescription className="text-[11px]">
                Download and store a PDF from an external URL. Works best with
                Open Access sources (MDPI, arXiv, PubMed Central, etc.).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-[11px]">PDF URL</Label>
                <Input
                  value={pdfUrlInput}
                  onChange={(e) => setPdfUrlInput(e.target.value)}
                  placeholder="https://www.mdpi.com/.../pdf or https://arxiv.org/pdf/..."
                  className="text-[12px]"
                  disabled={importingPdfUrl}
                />
                <p className="text-[9px] text-muted-foreground mt-1">
                  ✅ Works: MDPI, arXiv, PubMed Central, bioRxiv, Zenodo,
                  ResearchGate (some)
                </p>
              </div>

              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-[10px] text-amber-800 dark:text-amber-200">
                  <strong>Blocked publishers:</strong> Science.org, Nature,
                  Springer, Wiley, Elsevier, IEEE, ACM block automated
                  downloads. For these, download the PDF in your browser and use
                  the <Upload className="w-3 h-3 inline mx-0.5" /> upload
                  button.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUrlImportDialog(null);
                    setPdfUrlInput("");
                  }}
                  disabled={importingPdfUrl}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (showUrlImportDialog) {
                      handlePdfImportFromUrl(showUrlImportDialog, pdfUrlInput);
                    }
                  }}
                  disabled={importingPdfUrl || !pdfUrlInput.trim()}
                >
                  {importingPdfUrl ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-2" />
                      Import PDF
                    </>
                  )}
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
