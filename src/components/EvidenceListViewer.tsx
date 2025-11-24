import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Search,
  FileText,
  ExternalLink,
  Filter,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

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

const PILOT_MATERIALS = [
  { id: "aluminum", name: "Aluminum" },
  { id: "pet", name: "PET" },
  { id: "cardboard", name: "Cardboard" },
];

export function EvidenceListViewer({
  materialFilter,
  parameterFilter,
}: EvidenceListViewerProps) {
  const [mius, setMius] = useState<MIU[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    materialFilter || "all"
  );
  const [selectedParameter, setSelectedParameter] = useState<string>(
    parameterFilter || "all"
  );
  const [selectedMIU, setSelectedMIU] = useState<MIU | null>(null);

  useEffect(() => {
    loadMIUs();
  }, []);

  const loadMIUs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.evidence) {
          // Filter to only pilot materials and CR dimension
          const pilotMIUs = data.evidence.filter(
            (miu: MIU) =>
              ["aluminum", "pet", "cardboard"].includes(
                miu.material_id.toLowerCase()
              ) && miu.dimension === "CR"
          );
          setMius(pilotMIUs);
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
          <CardTitle className="font-['Fredoka_One'] text-[18px] flex items-center gap-2">
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
                  <SelectItem value="all">All Materials</SelectItem>
                  {PILOT_MATERIALS.map((mat) => (
                    <SelectItem key={mat.id} value={mat.id}>
                      {mat.name}
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
                  <SelectItem value="all">All Parameters</SelectItem>
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
        <Button
          onClick={loadMIUs}
          variant="outline"
          size="sm"
          className="font-['Sniglet'] text-[12px] border-2 border-[#211f1c] dark:border-white/20"
        >
          Refresh
        </Button>
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
                          <DialogTitle className="font-['Fredoka_One'] text-[20px]">
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
                            <p className="font-['Sniglet'] text-[12px] mt-1">
                              {miu.citation}
                            </p>
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
                      <p className="font-['Sniglet'] text-[12px] text-muted-foreground line-clamp-1">
                        {miu.citation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
