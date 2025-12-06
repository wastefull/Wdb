import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Filter,
  BookOpen,
  Database,
  FileText,
  Link as LinkIcon,
  Edit,
  Trash2,
  Globe,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Library,
  List,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { useAuthContext } from "../../contexts/AuthContext";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import * as api from "../../utils/api";
import type { CrossRefSearchResult, DOILookupResult } from "../../utils/api";
import { EvidenceListViewer } from "../evidence/EvidenceListViewer";

type ViewMode = "evidence" | "source-search" | "browse-all";

interface EvidenceLabViewProps {
  onBack: () => void;
}

// MIU = Minimum Information Unit (Evidence Point)
interface MIU {
  id: string;
  material_id: string;
  parameter_code: string; // Y, D, C, M, E, B, N, T, H, L, R, U, C_RU
  raw_value: number;
  raw_unit: string;
  transformed_value: number | null;
  transform_version: string;
  snippet: string;
  source_type: "whitepaper" | "article" | "external" | "manual";
  citation: string;
  confidence_level: "high" | "medium" | "low";
  notes?: string | null;
  page_number?: number | null;
  figure_number?: string | null;
  table_number?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function EvidenceLabView({ onBack }: EvidenceLabViewProps) {
  const { user } = useAuthContext();
  const { materials } = useMaterialsContext();
  const [viewMode, setViewMode] = useState<ViewMode>("evidence");
  const [selectedParameter, setSelectedParameter] = useState<string | null>(
    null
  );
  const [selectedMIU, setSelectedMIU] = useState<MIU | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [evidencePoints, setEvidencePoints] = useState<MIU[]>([]);
  const [allEvidenceCounts, setAllEvidenceCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Source search state
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [sourceSearchResults, setSourceSearchResults] = useState<
    CrossRefSearchResult[]
  >([]);
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<CrossRefSearchResult | null>(null);
  const [searchingCrossRef, setSearchingCrossRef] = useState(false);
  const [checkingOA, setCheckingOA] = useState(false);
  const [oaStatus, setOaStatus] = useState<{
    is_open_access: boolean;
    oa_status?: string | null;
    best_oa_location?: { url: string; url_for_pdf?: string } | null;
  } | null>(null);
  const [addingSource, setAddingSource] = useState(false);
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false);
  const [sourceToAdd, setSourceToAdd] = useState<Partial<api.Source> | null>(
    null
  );

  // Form state for create/edit
  const [formData, setFormData] = useState({
    material_id: "",
    parameter_code: "",
    raw_value: "",
    raw_unit: "",
    snippet: "",
    source_type: "manual" as "whitepaper" | "article" | "external" | "manual",
    citation: "",
    confidence_level: "medium" as "high" | "medium" | "low",
    notes: "",
    page_number: "",
    figure_number: "",
    table_number: "",
  });

  // Parameter definitions
  const parameters = [
    { code: "Y", name: "Years to Degrade", color: "#e6beb5" },
    { code: "D", name: "Degradability", color: "#b8c8cb" },
    { code: "C", name: "Compostability", color: "#a8d5ba" },
    { code: "M", name: "Methane Production", color: "#f4d5a6" },
    { code: "E", name: "Ecotoxicity", color: "#d4a5a5" },
    { code: "B", name: "Biodegradability", color: "#c4b5d5" },
    { code: "N", name: "Novelty", color: "#f5e6d3" },
    { code: "T", name: "Toxicity", color: "#e5c3c6" },
    { code: "H", name: "Human Health Impact", color: "#d4e4f7" },
    { code: "L", name: "Leachate Potential", color: "#d5e8d4" },
    { code: "R", name: "Recyclability", color: "#fff2cc" },
    { code: "U", name: "Reusability", color: "#ffe6cc" },
    { code: "C_RU", name: "Combined R+U", color: "#e1d5e7" },
  ];

  // Load all evidence counts on mount (includes test data)
  useEffect(() => {
    loadAllEvidenceCounts();
  }, []);

  const loadAllEvidenceCounts = async () => {
    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        // Not logged in - skip loading counts
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.evidence) {
          // Count MIUs per parameter
          const counts: Record<string, number> = {};
          data.evidence.forEach((miu: MIU) => {
            counts[miu.parameter_code] = (counts[miu.parameter_code] || 0) + 1;
          });
          setAllEvidenceCounts(counts);
        }
      }
    } catch (error) {
      console.error("Error loading evidence counts:", error);
    }
  };

  // Load evidence points for selected material and parameter
  useEffect(() => {
    if (materials.length > 0 && selectedParameter) {
      loadEvidenceForAllMaterials();
    }
  }, [selectedParameter, materials]);

  const loadEvidenceForAllMaterials = async () => {
    if (!selectedParameter) return;

    setLoading(true);
    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        // Not logged in - can't load evidence
        setEvidencePoints([]);
        return;
      }

      // Load ALL evidence from authenticated endpoint (includes test materials)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.evidence) {
          // Filter to selected parameter
          const paramEvidence = data.evidence.filter(
            (e: MIU) => e.parameter_code === selectedParameter
          );
          setEvidencePoints(paramEvidence);
        }
      }
    } catch (error) {
      console.error("Error loading evidence:", error);
      toast.error("Failed to load evidence points");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvidence = async () => {
    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        toast.error("Please sign in again to create evidence points");
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            material_id: formData.material_id,
            parameter_code: formData.parameter_code,
            raw_value: parseFloat(formData.raw_value),
            raw_unit: formData.raw_unit,
            snippet: formData.snippet,
            source_type: formData.source_type,
            citation: formData.citation,
            confidence_level: formData.confidence_level,
            notes: formData.notes || null,
            page_number: formData.page_number
              ? parseInt(formData.page_number)
              : null,
            figure_number: formData.figure_number || null,
            table_number: formData.table_number || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Evidence point created successfully");
        setShowCreateDialog(false);
        resetForm();
        loadEvidenceForAllMaterials();
      } else {
        toast.error(data.error || "Failed to create evidence point");
      }
    } catch (error) {
      console.error("Error creating evidence:", error);
      toast.error("Failed to create evidence point");
    }
  };

  const handleUpdateEvidence = async () => {
    if (!selectedMIU) return;

    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        toast.error("Please sign in again to update evidence points");
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${selectedMIU.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw_value: parseFloat(formData.raw_value),
            raw_unit: formData.raw_unit,
            snippet: formData.snippet,
            source_type: formData.source_type,
            citation: formData.citation,
            confidence_level: formData.confidence_level,
            notes: formData.notes || null,
            page_number: formData.page_number
              ? parseInt(formData.page_number)
              : null,
            figure_number: formData.figure_number || null,
            table_number: formData.table_number || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Evidence point updated successfully");
        setShowEditDialog(false);
        setSelectedMIU(null);
        resetForm();
        loadEvidenceForAllMaterials();
      } else {
        toast.error(data.error || "Failed to update evidence point");
      }
    } catch (error) {
      console.error("Error updating evidence:", error);
      toast.error("Failed to update evidence point");
    }
  };

  const handleDeleteEvidence = async () => {
    if (
      !selectedMIU ||
      !confirm("Are you sure you want to delete this evidence point?")
    )
      return;

    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        toast.error("Please sign in again to delete evidence points");
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${selectedMIU.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Evidence point deleted successfully");
        setSelectedMIU(null);
        loadEvidenceForAllMaterials();
      } else {
        toast.error(data.error || "Failed to delete evidence point");
      }
    } catch (error) {
      console.error("Error deleting evidence:", error);
      toast.error("Failed to delete evidence point");
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: "",
      parameter_code: "",
      raw_value: "",
      raw_unit: "",
      snippet: "",
      source_type: "manual",
      citation: "",
      confidence_level: "medium",
      notes: "",
      page_number: "",
      figure_number: "",
      table_number: "",
    });
  };

  const openEditDialog = (miu: MIU) => {
    setFormData({
      material_id: miu.material_id,
      parameter_code: miu.parameter_code,
      raw_value: miu.raw_value.toString(),
      raw_unit: miu.raw_unit,
      snippet: miu.snippet,
      source_type: miu.source_type,
      citation: miu.citation,
      confidence_level: miu.confidence_level,
      notes: miu.notes || "",
      page_number: miu.page_number?.toString() || "",
      figure_number: miu.figure_number || "",
      table_number: miu.table_number || "",
    });
    setShowEditDialog(true);
  };

  // Source search functions
  const handleSourceSearch = async () => {
    if (!sourceSearchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setSearchingCrossRef(true);
    setSourceSearchResults([]);
    setSelectedSearchResult(null);
    setOaStatus(null);

    try {
      const result = await api.searchSources(sourceSearchQuery, 15);
      setSourceSearchResults(result.results);

      if (result.results.length === 0) {
        toast.info("No sources found. Try different search terms.");
      } else {
        toast.success(`Found ${result.results.length} sources`);
      }
    } catch (error) {
      console.error("Error searching sources:", error);
      toast.error("Failed to search for sources");
    } finally {
      setSearchingCrossRef(false);
    }
  };

  const handleSelectSearchResult = async (result: CrossRefSearchResult) => {
    setSelectedSearchResult(result);
    setOaStatus(null);
    setCheckingOA(true);

    try {
      const oa = await api.checkOAStatus(result.doi);
      setOaStatus(oa);
    } catch (error) {
      console.error("Error checking OA status:", error);
      setOaStatus({ is_open_access: false });
    } finally {
      setCheckingOA(false);
    }
  };

  const handlePrepareAddSource = () => {
    if (!selectedSearchResult) return;

    setSourceToAdd({
      id: crypto.randomUUID(),
      title: selectedSearchResult.title,
      authors: selectedSearchResult.authors.join(", "), // Convert array to comma-separated string
      year: selectedSearchResult.year || undefined,
      doi: selectedSearchResult.doi,
      url: `https://doi.org/${selectedSearchResult.doi}`,
      type: "peer-reviewed" as const,
      abstract: selectedSearchResult.abstract || undefined,
      is_open_access: oaStatus?.is_open_access || false,
      oa_status: oaStatus?.oa_status || undefined,
      best_oa_url: oaStatus?.best_oa_location?.url || undefined,
      tags: [], // User can add tags
    });
    setShowAddSourceDialog(true);
  };

  const handleAddSourceToLibrary = async () => {
    if (!sourceToAdd) return;

    setAddingSource(true);
    try {
      // Check for duplicates first
      const duplicate = await api.checkSourceDuplicate({
        doi: sourceToAdd.doi,
      });
      if (duplicate.isDuplicate) {
        toast.error(
          `Source already exists: ${duplicate.existingSource?.title}`
        );
        return;
      }

      // Create the source
      await api.createSource(sourceToAdd as api.Source);
      toast.success("Source added to library!");
      setShowAddSourceDialog(false);
      setSourceToAdd(null);
      setSelectedSearchResult(null);
    } catch (error) {
      console.error("Error adding source:", error);
      toast.error("Failed to add source to library");
    } finally {
      setAddingSource(false);
    }
  };

  // Count evidence points per parameter (uses all evidence, not just loaded materials)
  const getEvidenceCount = (paramCode: string) => {
    return allEvidenceCounts[paramCode] || 0;
  };

  const filteredEvidence = evidencePoints.filter(
    (e) =>
      e.parameter_code === selectedParameter &&
      (searchQuery === "" ||
        e.citation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.snippet.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-[#e5e4dc] dark:bg-[#1a1917]">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="heading-xl">Evidence Lab</h2>
          <p className="label-muted">
            {viewMode === "evidence"
              ? "Collect and organize scientific evidence for material parameters"
              : viewMode === "browse-all"
              ? "Browse and manage all evidence points (including test data)"
              : "Search academic databases for relevant sources"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 bg-[#e5e4dc] dark:bg-[#1a1917] rounded-lg border border-[#211f1c]/20 dark:border-white/20">
          <button
            onClick={() => setViewMode("evidence")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-['Sniglet'] transition-all ${
              viewMode === "evidence"
                ? "bg-white dark:bg-[#2a2825] shadow-sm text-black dark:text-white"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            <Database size={14} className="inline mr-1.5" />
            Evidence
          </button>
          <button
            onClick={() => setViewMode("browse-all")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-['Sniglet'] transition-all ${
              viewMode === "browse-all"
                ? "bg-white dark:bg-[#2a2825] shadow-sm text-black dark:text-white"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            <List size={14} className="inline mr-1.5" />
            Browse All
          </button>
          <button
            onClick={() => setViewMode("source-search")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-['Sniglet'] transition-all ${
              viewMode === "source-search"
                ? "bg-white dark:bg-[#2a2825] shadow-sm text-black dark:text-white"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            <Globe size={14} className="inline mr-1.5" />
            Source Search
          </button>
        </div>

        {viewMode === "evidence" && (
          <Button
            className="bg-[#e6beb5] hover:bg-[#e6beb5]/90 border border-[#211f1c] dark:border-white/20"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus size={16} className="mr-2" />
            New Evidence Point
          </Button>
        )}
      </div>

      {/* Main Content - Conditional based on mode */}
      {viewMode === "evidence" ? (
        /* Evidence Mode - Original Split-Pane Layout */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Parameter Selection */}
          <div className="w-80 border-r border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825] flex flex-col">
            {/* Search */}
            <div className="panel-bordered">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
                />
                <Input
                  placeholder="Search parameters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 font-['Sniglet'] text-[12px]"
                />
              </div>
            </div>

            {/* Parameter List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {parameters.map((param) => (
                  <button
                    key={param.code}
                    onClick={() => setSelectedParameter(param.code)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedParameter === param.code
                        ? "border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
                        : "border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border border-[#211f1c] dark:border-white/20 flex items-center justify-center font-['Fredoka_One'] text-[10px]"
                          style={{ backgroundColor: param.color }}
                        >
                          {param.code}
                        </div>
                        <span className="font-['Sniglet'] text-[13px] text-black dark:text-white">
                          {param.name}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="font-['Sniglet'] text-[9px]"
                      >
                        {getEvidenceCount(param.code)} MIUs
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Middle Pane: MIU List */}
          <div className="flex-1 bg-white dark:bg-[#2a2825] flex flex-col border-r border-[#211f1c]/20 dark:border-white/20">
            {selectedParameter ? (
              <>
                {/* MIU List Header */}
                <div className="panel-bordered">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white">
                      Evidence Points for{" "}
                      {
                        parameters.find((p) => p.code === selectedParameter)
                          ?.name
                      }
                    </h3>
                    <Button variant="outline" size="sm">
                      <Filter size={14} className="mr-2" />
                      Filter
                    </Button>
                  </div>
                  <p className="label-muted-sm">
                    {filteredEvidence.length} evidence points collected
                  </p>
                </div>

                {/* MIU Cards */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {filteredEvidence.map((miu) => (
                      <button
                        key={miu.id}
                        onClick={() => setSelectedMIU(miu)}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                          selectedMIU?.id === miu.id
                            ? "border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
                            : "border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40"
                        }`}
                      >
                        {/* Source Title */}
                        <div className="flex items-start gap-2 mb-2">
                          <BookOpen
                            size={14}
                            className="text-black/40 dark:text-white/40 mt-0.5 flex-shrink-0"
                          />
                          <span className="label">{miu.citation}</span>
                        </div>

                        {/* Value */}
                        <div className="flex items-center gap-2 mb-2">
                          <Database
                            size={14}
                            className="text-black/40 dark:text-white/40"
                          />
                          <span className="font-['Fredoka_One'] text-[14px] text-black dark:text-white">
                            {miu.raw_value} {miu.raw_unit}
                          </span>
                          <Badge
                            variant={
                              miu.confidence_level === "high"
                                ? "default"
                                : "secondary"
                            }
                            className="font-['Sniglet'] text-[9px] ml-auto"
                          >
                            {miu.confidence_level}
                          </Badge>
                        </div>

                        {/* Context (truncated) */}
                        <p className="label-muted-sm line-clamp-2">
                          {miu.snippet}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#211f1c]/10 dark:border-white/10">
                          <span className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40">
                            Page {miu.page_number}
                          </span>
                          <span className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40">
                            •
                          </span>
                          <span className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40">
                            {new Date(miu.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Database
                    size={48}
                    className="mx-auto mb-4 text-black/20 dark:text-white/20"
                  />
                  <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-2">
                    Select a Parameter
                  </h3>
                  <p className="label-muted max-w-xs">
                    Choose a parameter from the left to view and manage its
                    evidence points
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: MIU Detail View */}
          <div className="w-96 bg-white dark:bg-[#2a2825] flex flex-col">
            {selectedMIU ? (
              <>
                {/* Detail Header */}
                <div className="panel-bordered">
                  <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-1">
                    Evidence Point Details
                  </h3>
                  <p className="font-['Sniglet'] text-[10px] text-black/40 dark:text-white/40">
                    ID: {selectedMIU.id}
                  </p>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Source Information */}
                    <div>
                      <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                        SOURCE
                      </label>
                      <div className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
                        <div className="flex items-start gap-2 mb-2">
                          <BookOpen
                            size={14}
                            className="text-black/60 dark:text-white/60 mt-0.5"
                          />
                          <span className="label">{selectedMIU.citation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText
                            size={12}
                            className="text-black/40 dark:text-white/40"
                          />
                          <span className="label-muted-xs">
                            Page {selectedMIU.page_number}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                        EXTRACTED VALUE
                      </label>
                      <div className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
                        <span className="font-['Fredoka_One'] text-[20px] text-black dark:text-white">
                          {selectedMIU.raw_value} {selectedMIU.raw_unit}
                        </span>
                      </div>
                    </div>

                    {/* Context */}
                    <div>
                      <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                        CONTEXT
                      </label>
                      <div className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
                        <p className="label leading-relaxed">
                          {selectedMIU.snippet}
                        </p>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div>
                      <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                        CONFIDENCE LEVEL
                      </label>
                      <Badge
                        variant={
                          selectedMIU.confidence_level === "high"
                            ? "default"
                            : "secondary"
                        }
                        className="font-['Sniglet'] text-[11px]"
                      >
                        {selectedMIU.confidence_level.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Metadata */}
                    <div>
                      <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                        METADATA
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-[#e5e4dc] dark:bg-[#1a1917]">
                          <span className="label-muted-sm">Created by</span>
                          <span className="font-['Sniglet'] text-[11px] text-black dark:text-white">
                            {selectedMIU.created_by}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-[#e5e4dc] dark:bg-[#1a1917]">
                          <span className="label-muted-sm">Created at</span>
                          <span className="font-['Sniglet'] text-[11px] text-black dark:text-white">
                            {new Date(
                              selectedMIU.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(selectedMIU)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleDeleteEvidence}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <FileText
                    size={48}
                    className="mx-auto mb-4 text-black/20 dark:text-white/20"
                  />
                  <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-2">
                    No Selection
                  </h3>
                  <p className="label-muted max-w-xs">
                    Select an evidence point to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === "source-search" ? (
        /* Source Search Mode */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Search */}
          <div className="w-96 border-r border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825] flex flex-col">
            {/* Material-Based Search */}
            <div className="p-4 border-b border-[#211f1c]/20 dark:border-white/20">
              <h3 className="font-['Fredoka_One'] text-[14px] text-black dark:text-white mb-3">
                Search Academic Sources
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="label-muted-sm mb-1.5 block">
                    Search by material or topic
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., cardboard biodegradation"
                      value={sourceSearchQuery}
                      onChange={(e) => setSourceSearchQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSourceSearch()
                      }
                      className="h-9 font-['Sniglet'] text-[12px]"
                    />
                    <Button
                      onClick={handleSourceSearch}
                      disabled={searchingCrossRef}
                      size="sm"
                      className="bg-[#b8c8cb] hover:bg-[#b8c8cb]/90 border border-[#211f1c] text-black"
                    >
                      {searchingCrossRef ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Search size={14} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick search suggestions based on materials */}
                {materials.length > 0 && (
                  <div>
                    <Label className="label-muted-xs mb-1.5 block">
                      Quick search by material:
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {materials.slice(0, 5).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSourceSearchQuery(m.name);
                            handleSourceSearch();
                          }}
                          className="px-2 py-1 text-[10px] font-['Sniglet'] bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20 rounded-md hover:border-[#211f1c]/40 dark:hover:border-white/40 transition-colors"
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Results */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {searchingCrossRef ? (
                  <div className="text-center py-12">
                    <Loader2
                      size={32}
                      className="mx-auto mb-3 animate-spin text-black/40 dark:text-white/40"
                    />
                    <p className="label-muted">Searching CrossRef...</p>
                  </div>
                ) : sourceSearchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe
                      size={48}
                      className="mx-auto mb-4 text-black/20 dark:text-white/20"
                    />
                    <h4 className="font-['Fredoka_One'] text-[14px] text-black dark:text-white mb-2">
                      Search for Sources
                    </h4>
                    <p className="label-muted-sm max-w-xs mx-auto">
                      Enter a material name or topic to find relevant academic
                      papers
                    </p>
                  </div>
                ) : (
                  sourceSearchResults.map((result, idx) => (
                    <button
                      key={`${result.doi}-${idx}`}
                      onClick={() => handleSelectSearchResult(result)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        selectedSearchResult?.doi === result.doi
                          ? "border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
                          : "border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40"
                      }`}
                    >
                      <h4 className="font-['Sniglet'] text-[12px] text-black dark:text-white mb-1 line-clamp-2">
                        {result.title}
                      </h4>
                      <p className="label-muted-xs mb-1">
                        {result.authors.slice(0, 2).join(", ")}
                        {result.authors.length > 2 && " et al."}
                      </p>
                      <div className="flex items-center gap-2">
                        {result.year && (
                          <Badge variant="secondary" className="text-[9px]">
                            {result.year}
                          </Badge>
                        )}
                        {result.journal && (
                          <span className="label-muted-xs truncate max-w-[150px]">
                            {result.journal}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Pane: Source Details */}
          <div className="flex-1 bg-white dark:bg-[#2a2825] flex flex-col">
            {selectedSearchResult ? (
              <>
                {/* Detail Header */}
                <div className="p-4 border-b border-[#211f1c]/20 dark:border-white/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-2">
                        {selectedSearchResult.title}
                      </h3>
                      <p className="label-muted text-[11px]">
                        {selectedSearchResult.authors.join(", ")}
                      </p>
                    </div>
                    <Button
                      onClick={handlePrepareAddSource}
                      className="bg-[#a8d5ba] hover:bg-[#a8d5ba]/90 border border-[#211f1c] text-black"
                    >
                      <Library size={14} className="mr-2" />
                      Add to Library
                    </Button>
                  </div>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSearchResult.year && (
                        <div>
                          <label className="label-muted-xs block mb-1">
                            Year
                          </label>
                          <span className="label">
                            {selectedSearchResult.year}
                          </span>
                        </div>
                      )}
                      {selectedSearchResult.journal && (
                        <div>
                          <label className="label-muted-xs block mb-1">
                            Journal
                          </label>
                          <span className="label">
                            {selectedSearchResult.journal}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DOI */}
                    <div>
                      <label className="label-muted-xs block mb-1">DOI</label>
                      <a
                        href={`https://doi.org/${selectedSearchResult.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="label text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        {selectedSearchResult.doi}
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Open Access Status */}
                    <div>
                      <label className="label-muted-xs block mb-1">
                        Open Access Status
                      </label>
                      {checkingOA ? (
                        <div className="flex items-center gap-2">
                          <Loader2
                            size={14}
                            className="animate-spin text-black/40 dark:text-white/40"
                          />
                          <span className="label-muted">Checking...</span>
                        </div>
                      ) : oaStatus ? (
                        <div className="flex items-center gap-2">
                          {oaStatus.is_open_access ? (
                            <>
                              <CheckCircle
                                size={16}
                                className="text-green-600"
                              />
                              <span className="label text-green-600">
                                Open Access
                              </span>
                              {oaStatus.oa_status && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px]"
                                >
                                  {oaStatus.oa_status}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <>
                              <XCircle size={16} className="text-red-500" />
                              <span className="label text-red-500">
                                Closed Access
                              </span>
                            </>
                          )}
                        </div>
                      ) : null}

                      {oaStatus?.best_oa_location?.url && (
                        <a
                          href={oaStatus.best_oa_location.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-['Sniglet'] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink size={12} />
                          View Open Access Version
                        </a>
                      )}
                    </div>

                    {/* Abstract */}
                    {selectedSearchResult.abstract && (
                      <div>
                        <label className="label-muted-xs block mb-1">
                          Abstract
                        </label>
                        <div
                          className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20"
                          dangerouslySetInnerHTML={{
                            __html: selectedSearchResult.abstract,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <BookOpen
                    size={48}
                    className="mx-auto mb-4 text-black/20 dark:text-white/20"
                  />
                  <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-2">
                    Select a Source
                  </h3>
                  <p className="label-muted max-w-xs">
                    Search for sources and select one to view details and add to
                    your library
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === "browse-all" ? (
        /* Browse All Mode - EvidenceListViewer */
        <div className="flex-1 overflow-auto p-6 bg-[#e5e4dc] dark:bg-[#1a1917]">
          <EvidenceListViewer />
        </div>
      ) : null}

      {/* Create Evidence Point Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Evidence Point</DialogTitle>
            <DialogDescription>
              Add a new evidence point for a material parameter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material_id">Material</Label>
              <Select
                value={formData.material_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, material_id: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parameter_code">Parameter</Label>
              <Select
                value={formData.parameter_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, parameter_code: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a parameter" />
                </SelectTrigger>
                <SelectContent>
                  {parameters.map((param) => (
                    <SelectItem key={param.code} value={param.code}>
                      {param.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raw_value">Raw Value</Label>
              <Input
                id="raw_value"
                type="number"
                value={formData.raw_value}
                onChange={(e) =>
                  setFormData({ ...formData, raw_value: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raw_unit">Raw Unit</Label>
              <Input
                id="raw_unit"
                value={formData.raw_unit}
                onChange={(e) =>
                  setFormData({ ...formData, raw_unit: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="snippet">Snippet</Label>
              <Textarea
                id="snippet"
                value={formData.snippet}
                onChange={(e) =>
                  setFormData({ ...formData, snippet: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_type">Source Type</Label>
              <Select
                value={formData.source_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, source_type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="whitepaper" value="whitepaper">
                    Whitepaper
                  </SelectItem>
                  <SelectItem key="article" value="article">
                    Article
                  </SelectItem>
                  <SelectItem key="external" value="external">
                    External
                  </SelectItem>
                  <SelectItem key="manual" value="manual">
                    Manual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="citation">Citation</Label>
              <Input
                id="citation"
                value={formData.citation}
                onChange={(e) =>
                  setFormData({ ...formData, citation: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence_level">Confidence Level</Label>
              <Select
                value={formData.confidence_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, confidence_level: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a confidence level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="high" value="high">
                    High
                  </SelectItem>
                  <SelectItem key="medium" value="medium">
                    Medium
                  </SelectItem>
                  <SelectItem key="low" value="low">
                    Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_number">Page Number</Label>
              <Input
                id="page_number"
                type="number"
                value={formData.page_number}
                onChange={(e) =>
                  setFormData({ ...formData, page_number: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="figure_number">Figure Number</Label>
              <Input
                id="figure_number"
                value={formData.figure_number}
                onChange={(e) =>
                  setFormData({ ...formData, figure_number: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table_number">Table Number</Label>
              <Input
                id="table_number"
                value={formData.table_number}
                onChange={(e) =>
                  setFormData({ ...formData, table_number: e.target.value })
                }
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateEvidence}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Evidence Point Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Evidence Point</DialogTitle>
            <DialogDescription>
              Update the details of an existing evidence point.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material_id">Material</Label>
              <Select
                value={formData.material_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, material_id: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parameter_code">Parameter</Label>
              <Select
                value={formData.parameter_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, parameter_code: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a parameter" />
                </SelectTrigger>
                <SelectContent>
                  {parameters.map((param) => (
                    <SelectItem key={param.code} value={param.code}>
                      {param.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raw_value">Raw Value</Label>
              <Input
                id="raw_value"
                type="number"
                value={formData.raw_value}
                onChange={(e) =>
                  setFormData({ ...formData, raw_value: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raw_unit">Raw Unit</Label>
              <Input
                id="raw_unit"
                value={formData.raw_unit}
                onChange={(e) =>
                  setFormData({ ...formData, raw_unit: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="snippet">Snippet</Label>
              <Textarea
                id="snippet"
                value={formData.snippet}
                onChange={(e) =>
                  setFormData({ ...formData, snippet: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_type">Source Type</Label>
              <Select
                value={formData.source_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, source_type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="whitepaper" value="whitepaper">
                    Whitepaper
                  </SelectItem>
                  <SelectItem key="article" value="article">
                    Article
                  </SelectItem>
                  <SelectItem key="external" value="external">
                    External
                  </SelectItem>
                  <SelectItem key="manual" value="manual">
                    Manual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="citation">Citation</Label>
              <Input
                id="citation"
                value={formData.citation}
                onChange={(e) =>
                  setFormData({ ...formData, citation: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence_level">Confidence Level</Label>
              <Select
                value={formData.confidence_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, confidence_level: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a confidence level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="high" value="high">
                    High
                  </SelectItem>
                  <SelectItem key="medium" value="medium">
                    Medium
                  </SelectItem>
                  <SelectItem key="low" value="low">
                    Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_number">Page Number</Label>
              <Input
                id="page_number"
                type="number"
                value={formData.page_number}
                onChange={(e) =>
                  setFormData({ ...formData, page_number: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="figure_number">Figure Number</Label>
              <Input
                id="figure_number"
                value={formData.figure_number}
                onChange={(e) =>
                  setFormData({ ...formData, figure_number: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table_number">Table Number</Label>
              <Input
                id="table_number"
                value={formData.table_number}
                onChange={(e) =>
                  setFormData({ ...formData, table_number: e.target.value })
                }
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateEvidence}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Source to Library Dialog */}
      <Dialog open={showAddSourceDialog} onOpenChange={setShowAddSourceDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Source to Library</DialogTitle>
            <DialogDescription>
              Review and add this source to your library.
            </DialogDescription>
          </DialogHeader>
          {sourceToAdd && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={sourceToAdd.title || ""}
                  onChange={(e) =>
                    setSourceToAdd({ ...sourceToAdd, title: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={sourceToAdd.year || ""}
                    onChange={(e) =>
                      setSourceToAdd({
                        ...sourceToAdd,
                        year: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={sourceToAdd.type || "peer-reviewed"}
                    onValueChange={(
                      value:
                        | "peer-reviewed"
                        | "government"
                        | "industrial"
                        | "ngo"
                        | "internal"
                    ) => setSourceToAdd({ ...sourceToAdd, type: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="peer-reviewed" value="peer-reviewed">
                        Peer-Reviewed
                      </SelectItem>
                      <SelectItem key="government" value="government">
                        Government
                      </SelectItem>
                      <SelectItem key="industrial" value="industrial">
                        Industrial
                      </SelectItem>
                      <SelectItem key="ngo" value="ngo">
                        NGO
                      </SelectItem>
                      <SelectItem key="internal" value="internal">
                        Internal
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Authors</Label>
                <Input
                  value={sourceToAdd.authors || ""}
                  onChange={(e) =>
                    setSourceToAdd({
                      ...sourceToAdd,
                      authors: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>DOI</Label>
                <Input
                  value={sourceToAdd.doi || ""}
                  readOnly
                  className="w-full bg-[#e5e4dc] dark:bg-[#1a1917]"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={sourceToAdd.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setSourceToAdd({
                      ...sourceToAdd,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim().toLowerCase())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., cardboard, biodegradation, composting"
                  className="w-full"
                />
              </div>

              {/* Open Access Info */}
              <div className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  {sourceToAdd.is_open_access ? (
                    <>
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="label text-green-600">Open Access</span>
                      {sourceToAdd.oa_status && (
                        <Badge variant="secondary" className="text-[9px]">
                          {sourceToAdd.oa_status}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-red-500" />
                      <span className="label text-red-500">Closed Access</span>
                    </>
                  )}
                </div>
                {sourceToAdd.best_oa_url && (
                  <a
                    href={sourceToAdd.best_oa_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-muted-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink size={10} />
                    {sourceToAdd.best_oa_url}
                  </a>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddSourceDialog(false);
                setSourceToAdd(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddSourceToLibrary}
              disabled={addingSource}
              className="bg-[#a8d5ba] hover:bg-[#a8d5ba]/90 text-black"
            >
              {addingSource ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Library size={14} className="mr-2" />
                  Add to Library
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
