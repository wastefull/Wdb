import { useState, useEffect } from "react";
import { useAccessibility } from "../shared/AccessibilityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Search,
  FileText,
  Filter,
  Trash2,
  Edit,
  Save,
  X,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";

interface MIU {
  id: string;
  material_id: string;
  parameter_code: string;
  raw_value: number;
  raw_unit: string;
  snippet: string;
  source_type: string;
  source_ref: string;
  citation: string;
  confidence_level: string;
  page_number?: number;
  figure_number?: string;
  table_number?: string;
  notes?: string;
  dimension: string;
  created_at: string;
  created_by: string;
}

interface Source {
  id: string;
  title: string;
  doi?: string;
  is_open_access?: boolean;
  manual_oa_override?: boolean;
  oa_status?: string;
  pdfFileName?: string;
}

interface EvidenceListViewerProps {
  materialFilter?: string;
  parameterFilter?: string;
}

const CR_PARAMETERS = [
  { code: "Y", name: "Years to Degrade" },
  { code: "D", name: "Degradability" },
  { code: "C", name: "Compostability" },
  { code: "M", name: "Methane Production" },
  { code: "E", name: "Ecotoxicity" },
];

// Pilot materials for Phase 9.2 - all real materials
const PILOT_MATERIALS = [
  { id: "cardboard-corrugated", name: "Cardboard (Corrugated)" },
  { id: "glass-clear", name: "Glass (Clear/Flint)" },
  { id: "glass-colored", name: "Glass (Colored)" },
  { id: "pet-bottles", name: "PET" },
  { id: "paper-mixed", name: "Paper (Mixed)" },
  { id: "hdpe-bottles", name: "HDPE" },
];

export function EvidenceListViewer({
  materialFilter,
  parameterFilter,
}: EvidenceListViewerProps) {
  const { settings } = useAccessibility();
  const [mius, setMius] = useState<MIU[]>([]);
  const [sources, setSources] = useState<Map<string, Source>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    materialFilter || "all"
  );
  const [selectedParameter, setSelectedParameter] = useState<string>(
    parameterFilter || "all"
  );
  const [selectedMIU, setSelectedMIU] = useState<MIU | null>(null);

  // Edit state
  const [editingMIU, setEditingMIU] = useState<MIU | null>(null);
  const [editForm, setEditForm] = useState<{
    value: string;
    unit: string;
    notes: string;
  }>({ value: "", unit: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingMIU, setDeletingMIU] = useState<MIU | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk delete state
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadMIUs();
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sources) {
          const sourceMap = new Map<string, Source>();
          data.sources.forEach((source: Source) => {
            sourceMap.set(source.id, source);
          });
          setSources(sourceMap);
        }
      }
    } catch (error) {
      console.error("Error loading sources:", error);
    }
  };

  const loadMIUs = async () => {
    try {
      setLoading(true);

      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        toast.error("You must be logged in to view evidence points");
        setLoading(false);
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
          // Show all evidence (no pilot material filter - we want to see test data too)
          setMius(data.evidence);
        }
      } else {
        toast.error("Failed to load evidence points");
      }
    } catch (error) {
      console.error("Error loading MIUs:", error);
      toast.error("Failed to load evidence points");
    } finally {
      setLoading(false);
    }
  };

  // Start editing a MIU
  const startEdit = (miu: MIU) => {
    setEditingMIU(miu);
    setEditForm({
      value: miu.raw_value?.toString() || "",
      unit: miu.raw_unit || "",
      notes: miu.notes || "",
    });
    setSelectedMIU(null); // Close view dialog
  };

  // Save edited MIU
  const handleSaveEdit = async () => {
    if (!editingMIU) return;

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${editingMIU.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            value: editForm.value ? parseFloat(editForm.value) : null,
            unit: editForm.unit || null,
            notes: editForm.notes || null,
          }),
        }
      );

      if (response.ok) {
        toast.success("Evidence point updated successfully");
        setEditingMIU(null);
        loadMIUs(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update evidence point");
      }
    } catch (error) {
      console.error("Error updating MIU:", error);
      toast.error("Failed to update evidence point");
    } finally {
      setSaving(false);
    }
  };

  // Delete a MIU
  const handleDelete = async () => {
    if (!deletingMIU) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${deletingMIU.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Evidence point deleted successfully");
        setDeletingMIU(null);
        setSelectedMIU(null);
        loadMIUs(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete evidence point");
      }
    } catch (error) {
      console.error("Error deleting MIU:", error);
      toast.error("Failed to delete evidence point");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete all filtered MIUs
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        toast.error("You must be logged in to delete evidence points");
        return;
      }

      const idsToDelete = filteredMIUs.map((miu) => miu.id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/bulk-delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ evidenceIds: idsToDelete }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`Deleted ${result.deletedCount} evidence points`);
        setShowBulkDeleteConfirm(false);
        setSelectedMIU(null);
        loadMIUs(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to bulk delete evidence points");
      }
    } catch (error) {
      console.error("Error in bulk delete:", error);
      toast.error("Failed to bulk delete evidence points");
    } finally {
      setBulkDeleting(false);
    }
  };

  const filteredMIUs = mius.filter((miu) => {
    const matchesMaterial =
      selectedMaterial === "all" ||
      miu.material_id.toLowerCase() === selectedMaterial.toLowerCase();
    const matchesParameter =
      selectedParameter === "all" || miu.parameter_code === selectedParameter;
    const matchesSearch =
      searchQuery === "" ||
      miu.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      miu.citation.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMaterial && matchesParameter && matchesSearch;
  });

  const getConfidenceBadge = (level: string) => {
    const colors = {
      high: "bg-green-100 text-green-800 border-green-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  const getParameterName = (code: string) => {
    return CR_PARAMETERS.find((p) => p.code === code)?.name || code;
  };

  const getMaterialName = (id: string) => {
    return (
      PILOT_MATERIALS.find((m) => m.id.toLowerCase() === id.toLowerCase())
        ?.name || id
    );
  };

  const getLocatorText = (miu: MIU) => {
    const parts = [];
    if (miu.page_number) parts.push(`p. ${miu.page_number}`);
    if (miu.figure_number) parts.push(`Fig. ${miu.figure_number}`);
    if (miu.table_number) parts.push(`Table ${miu.table_number}`);
    return parts.join(", ") || "No locator";
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="border-2 border-[#211f1c] dark:border-white/20 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
        <CardHeader>
          <CardTitle className="font-['Tilt_Warp'] text-[18px] flex items-center gap-2">
            <Filter className="size-5" />
            Filter Evidence Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="font-['Sniglet'] text-[12px]">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search snippets or citations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
                />
              </div>
            </div>

            {/* Material Filter */}
            <div className="space-y-2">
              <Label className="font-['Sniglet'] text-[12px]">Material</Label>
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              >
                <SelectTrigger className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-materials" value="all">
                    All Materials (
                    {[...new Set(mius.map((m) => m.material_id))].length})
                  </SelectItem>
                  {/* Show pilot materials first */}
                  {PILOT_MATERIALS.filter((mat) =>
                    mius.some(
                      (m) =>
                        m.material_id.toLowerCase() === mat.id.toLowerCase()
                    )
                  ).map((mat) => (
                    <SelectItem key={mat.id} value={mat.id}>
                      {mat.name}
                    </SelectItem>
                  ))}
                  {/* Show other materials (test data, etc.) */}
                  {[...new Set(mius.map((m) => m.material_id))]
                    .filter(
                      (id) =>
                        !PILOT_MATERIALS.some(
                          (p) => p.id.toLowerCase() === id.toLowerCase()
                        )
                    )
                    .sort()
                    .map((id) => (
                      <SelectItem key={id} value={id}>
                        {id.startsWith("test-") ? `🧪 ${id}` : id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parameter Filter */}
            <div className="space-y-2">
              <Label className="font-['Sniglet'] text-[12px]">Parameter</Label>
              <Select
                value={selectedParameter}
                onValueChange={setSelectedParameter}
              >
                <SelectTrigger className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20">
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-parameters" value="all">
                    All Parameters
                  </SelectItem>
                  {CR_PARAMETERS.map((param) => (
                    <SelectItem key={param.code} value={param.code}>
                      {param.code} - {param.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-2">
        <p className="font-['Sniglet'] text-[12px] text-muted-foreground">
          Showing {filteredMIUs.length} of {mius.length} evidence points
        </p>
        <div className="flex gap-2">
          {settings.adminMode && filteredMIUs.length > 0 && (
            <Button
              onClick={() => setShowBulkDeleteConfirm(true)}
              variant="outline"
              size="sm"
              className="font-['Sniglet'] text-[12px] border-2 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="size-3 mr-1" />
              Delete All ({filteredMIUs.length})
            </Button>
          )}
          <Button
            onClick={loadMIUs}
            variant="outline"
            size="sm"
            className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* MIU List */}
      <ScrollArea className="h-[600px] rounded-md border-2 border-[#211f1c] dark:border-white/20">
        <div className="space-y-3 p-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="font-['Sniglet'] text-[14px] text-muted-foreground">
                Loading evidence points...
              </p>
            </div>
          ) : filteredMIUs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-['Sniglet'] text-[14px] text-muted-foreground">
                No evidence points found
              </p>
              <p className="font-['Sniglet'] text-[12px] text-muted-foreground mt-2">
                Try adjusting your filters or create new MIUs in the Curation
                Workbench
              </p>
            </div>
          ) : (
            filteredMIUs.map((miu) => (
              <Card
                key={miu.id}
                className="border-2 border-[#211f1c] dark:border-white/20 hover:shadow-[4px_4px_0px_0px_#000000] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#bae1ff] text-black border-[#211f1c] font-['Sniglet'] text-[10px]">
                          {getMaterialName(miu.material_id)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-[#211f1c] dark:border-white/20 font-['Sniglet'] text-[10px]"
                        >
                          {miu.parameter_code} -{" "}
                          {getParameterName(miu.parameter_code)}
                        </Badge>
                        <Badge
                          className={`${getConfidenceBadge(
                            miu.confidence_level
                          )} font-['Sniglet'] text-[10px]`}
                        >
                          {miu.confidence_level}
                        </Badge>
                      </div>
                      <CardTitle className="font-['Sniglet'] text-[14px] text-muted-foreground">
                        {getLocatorText(miu)}
                      </CardTitle>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMIU(miu)}
                          className="font-['Sniglet'] text-[12px]"
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl border-2 border-[#211f1c] dark:border-white/20">
                        <DialogHeader>
                          <DialogTitle className="font-['Tilt_Warp'] text-[20px]">
                            Evidence Point Details
                          </DialogTitle>
                          <DialogDescription className="font-['Sniglet'] text-[12px]">
                            MIU ID: {miu.id}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                Material
                              </Label>
                              <p className="font-['Sniglet'] text-[14px]">
                                {getMaterialName(miu.material_id)}
                              </p>
                            </div>
                            <div>
                              <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                Parameter
                              </Label>
                              <p className="font-['Sniglet'] text-[14px]">
                                {miu.parameter_code} -{" "}
                                {getParameterName(miu.parameter_code)}
                              </p>
                            </div>
                            <div>
                              <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                Value
                              </Label>
                              <p className="font-['Sniglet'] text-[14px]">
                                {miu.raw_value} {miu.raw_unit}
                              </p>
                            </div>
                            <div>
                              <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                Confidence
                              </Label>
                              <Badge
                                className={`${getConfidenceBadge(
                                  miu.confidence_level
                                )} font-['Sniglet'] text-[10px]`}
                              >
                                {miu.confidence_level}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                              Text Snippet
                            </Label>
                            <div className="mt-1 p-3 bg-muted rounded-md border border-[#211f1c] dark:border-white/20">
                              <p className="font-['Sniglet'] text-[12px] italic">
                                &ldquo;{miu.snippet}&rdquo;
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                              Citation
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-['Sniglet'] text-[12px]">
                                {miu.citation}
                              </p>
                              {/* OA Status Badge from source */}
                              {(() => {
                                const source = sources.get(miu.source_ref);
                                if (!source) return null;
                                if (source.is_open_access === true) {
                                  return (
                                    <Badge
                                      className={`text-[8px] ${
                                        source.manual_oa_override
                                          ? "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300"
                                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                      }`}
                                      title={`Open Access${
                                        source.manual_oa_override
                                          ? " (Manual)"
                                          : ""
                                      }`}
                                    >
                                      <Unlock className="w-2 h-2 mr-0.5" />
                                      OA
                                    </Badge>
                                  );
                                }
                                if (source.is_open_access === false) {
                                  return (
                                    <Badge
                                      className={`text-[8px] ${
                                        source.manual_oa_override
                                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                      }`}
                                      title={`Closed Access${
                                        source.manual_oa_override
                                          ? " (Manual)"
                                          : ""
                                      }`}
                                    >
                                      <Lock className="w-2 h-2 mr-0.5" />
                                      Closed
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            {miu.page_number && (
                              <div>
                                <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                  Page
                                </Label>
                                <p className="font-['Sniglet'] text-[14px]">
                                  {miu.page_number}
                                </p>
                              </div>
                            )}
                            {miu.figure_number && (
                              <div>
                                <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                  Figure
                                </Label>
                                <p className="font-['Sniglet'] text-[14px]">
                                  {miu.figure_number}
                                </p>
                              </div>
                            )}
                            {miu.table_number && (
                              <div>
                                <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                  Table
                                </Label>
                                <p className="font-['Sniglet'] text-[14px]">
                                  {miu.table_number}
                                </p>
                              </div>
                            )}
                          </div>

                          {miu.notes && (
                            <div>
                              <Label className="font-['Sniglet'] text-[12px] text-muted-foreground">
                                Curator Notes
                              </Label>
                              <p className="font-['Sniglet'] text-[12px] mt-1">
                                {miu.notes}
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground font-['Sniglet'] pt-4 border-t">
                            Created{" "}
                            {new Date(miu.created_at).toLocaleDateString()} by{" "}
                            {miu.created_by}
                          </div>
                        </div>
                        <DialogFooter className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(miu)}
                            className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
                          >
                            <Edit className="size-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingMIU(miu)}
                            className="font-['Sniglet'] text-[12px]"
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-['Sniglet'] text-[12px] font-semibold min-w-[60px]">
                        Value:
                      </span>
                      <span className="font-['Sniglet'] text-[12px]">
                        {miu.raw_value} {miu.raw_unit}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-['Sniglet'] text-[12px] font-semibold min-w-[60px]">
                        Snippet:
                      </span>
                      <p className="font-['Sniglet'] text-[12px] text-muted-foreground line-clamp-2">
                        &ldquo;{miu.snippet}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-['Sniglet'] text-[12px] font-semibold min-w-[60px]">
                        Source:
                      </span>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <p className="font-['Sniglet'] text-[12px] text-muted-foreground line-clamp-1 flex-1">
                          {miu.citation}
                        </p>
                        {/* OA Status Badge */}
                        {(() => {
                          const source = sources.get(miu.source_ref);
                          if (!source) return null;
                          if (source.is_open_access === true) {
                            return (
                              <Badge
                                className={`text-[7px] shrink-0 ${
                                  source.manual_oa_override
                                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                }`}
                                title="Open Access"
                              >
                                <Unlock className="w-2 h-2 mr-0.5" />
                                OA
                              </Badge>
                            );
                          }
                          if (source.is_open_access === false) {
                            return (
                              <Badge
                                className={`text-[7px] shrink-0 ${
                                  source.manual_oa_override
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                }`}
                                title="Closed Access"
                              >
                                <Lock className="w-2 h-2 mr-0.5" />
                                Closed
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit MIU Dialog */}
      <Dialog
        open={!!editingMIU}
        onOpenChange={(open: boolean) => !open && setEditingMIU(null)}
      >
        <DialogContent className="max-w-md border-2 border-[#211f1c] dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="font-['Tilt_Warp'] text-[20px]">
              Edit Evidence Point
            </DialogTitle>
            <DialogDescription className="font-['Sniglet'] text-[12px]">
              Update the value, unit, or notes for this MIU.
            </DialogDescription>
          </DialogHeader>

          {editingMIU && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md border border-[#211f1c] dark:border-white/20">
                <p className="font-['Sniglet'] text-[12px] text-muted-foreground">
                  <strong>Material:</strong>{" "}
                  {getMaterialName(editingMIU.material_id)} |
                  <strong> Parameter:</strong> {editingMIU.parameter_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-['Sniglet'] text-[12px]">Value</Label>
                  <Input
                    type="number"
                    step="any"
                    value={editForm.value}
                    onChange={(e) =>
                      setEditForm({ ...editForm, value: e.target.value })
                    }
                    placeholder="e.g., 75.5"
                    className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-['Sniglet'] text-[12px]">Unit</Label>
                  <Input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm({ ...editForm, unit: e.target.value })
                    }
                    placeholder="e.g., %"
                    className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-['Sniglet'] text-[12px]">Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="Add curator notes..."
                  className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20 min-h-20"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingMIU(null)}
              disabled={saving}
              className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
            >
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="font-['Sniglet'] text-[12px] bg-[#baffc9] text-black border-2 border-[#211f1c] hover:bg-[#a0e8b0]"
            >
              <Save className="size-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingMIU}
        onOpenChange={(open: boolean) => !open && setDeletingMIU(null)}
      >
        <DialogContent className="max-w-md border-2 border-[#211f1c] dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="font-['Tilt_Warp'] text-[20px] flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-6" />
              Delete Evidence Point
            </DialogTitle>
            <DialogDescription className="font-['Sniglet'] text-[12px]">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingMIU && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md border-2 border-red-300 dark:border-red-800">
                <p className="font-['Sniglet'] text-[14px] mb-2">
                  <strong>Material:</strong>{" "}
                  {getMaterialName(deletingMIU.material_id)}
                </p>
                <p className="font-['Sniglet'] text-[14px] mb-2">
                  <strong>Parameter:</strong> {deletingMIU.parameter_code} -{" "}
                  {getParameterName(deletingMIU.parameter_code)}
                </p>
                <p className="font-['Sniglet'] text-[12px] text-muted-foreground">
                  <strong>Value:</strong> {deletingMIU.raw_value}{" "}
                  {deletingMIU.raw_unit}
                </p>
              </div>

              <p className="font-['Sniglet'] text-[12px] text-muted-foreground">
                Are you sure you want to permanently delete this evidence point?
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingMIU(null)}
              disabled={deleting}
              className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="font-['Sniglet'] text-[12px]"
            >
              <Trash2 className="size-4 mr-2" />
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
      >
        <DialogContent className="max-w-md border-2 border-[#211f1c] dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="font-['Tilt_Warp'] text-[20px] text-red-600 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Bulk Delete Evidence
            </DialogTitle>
            <DialogDescription className="font-['Sniglet'] text-[12px]">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="font-['Sniglet'] text-[14px] text-red-800 dark:text-red-200 font-medium">
                You are about to delete {filteredMIUs.length} evidence points.
              </p>
              <p className="font-['Sniglet'] text-[12px] text-red-600 dark:text-red-300 mt-2">
                Current filters:
              </p>
              <ul className="font-['Sniglet'] text-[11px] text-red-600 dark:text-red-300 mt-1 ml-4 list-disc">
                <li>
                  Material:{" "}
                  {selectedMaterial === "all" ? "All" : selectedMaterial}
                </li>
                <li>
                  Parameter:{" "}
                  {selectedParameter === "all" ? "All" : selectedParameter}
                </li>
                {searchQuery && <li>Search: "{searchQuery}"</li>}
              </ul>
            </div>

            <p className="font-['Sniglet'] text-[12px] text-muted-foreground">
              This will send one consolidated audit notification instead of{" "}
              {filteredMIUs.length} individual emails.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={bulkDeleting}
              className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="font-['Sniglet'] text-[12px]"
            >
              <Trash2 className="size-4 mr-2" />
              {bulkDeleting
                ? "Deleting..."
                : `Delete ${filteredMIUs.length} Points`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
