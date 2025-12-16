import { useState } from "react";
import {
  Download,
  Database,
  FileJson,
  FileText,
  ArrowLeft,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

interface PublicExportViewProps {
  onBack: () => void;
  materialsCount: number;
}

export function PublicExportView({
  onBack,
  materialsCount,
}: PublicExportViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"public" | "research">("public");

  const handleDownload = async (
    format: "json" | "csv",
    exportType: "public" | "full"
  ) => {
    setDownloading(true);

    try {
      const endpoint =
        exportType === "public" ? "export/public" : "export/full";
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/${endpoint}?format=${format}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      let blob: Blob;
      let filename: string;

      if (format === "json") {
        const data = await response.json();
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        filename = `wastedb-${exportType}-${
          new Date().toISOString().split("T")[0]
        }.json`;
      } else {
        const text = await response.text();
        blob = new Blob([text], { type: "text/csv" });
        filename = `wastedb-${exportType}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
      }

      // Download the file
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download export");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ed] dark:bg-[#1a1817] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="card-interactive">
            <ArrowLeft size={16} className="text-black" />
          </button>
          <div className="flex-1">
            <h1 className="text-[24px] normal mb-1">Export WasteDB Data</h1>
            <p className="text-[12px] text-black/60 dark:text-white/60">
              Download {materialsCount} materials with 3D circularity data (CR,
              CC, RU)
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-[12px] text-blue-800 dark:text-blue-200">
            Open Data Access
          </AlertTitle>
          <AlertDescription className="text-[10px] text-blue-700 dark:text-blue-300">
            All WasteDB data is freely available under open license. Complete
            scientific data for all three dimensions: Recyclability,
            Compostability, and Reusability.
          </AlertDescription>
        </Alert>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "public" | "research")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="public">Public Data (0-100)</TabsTrigger>
            <TabsTrigger value="research">Research Data (Full)</TabsTrigger>
          </TabsList>

          {/* Public Export Tab */}
          <TabsContent value="public" className="space-y-6">
            <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 arcade-bg-amber arcade-btn-amber rounded-md border border-[#211f1c] dark:border-white/20">
                  <Database className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[18px] normal mb-2">
                    Public-Friendly Data Export
                  </h2>
                  <p className="text-[12px] text-black/70 dark:text-white/70 mb-4">
                    Simplified data for general audiences, educators, and
                    product designers. All scores are on a 0-100 scale for easy
                    interpretation across all three circular economy pathways.
                  </p>

                  <div className="space-y-2 mb-4">
                    <h3 className="text-[14px] normal">
                      Included Fields (8 columns):
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Material Name & Category
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Description
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Recyclability (0-100)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Compostability (0-100)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Reusability (0-100)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Confidence Level
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Button
                  onClick={() => handleDownload("csv", "public")}
                  disabled={downloading}
                  className="arcade-bg-amber arcade-btn-amber hover:opacity-90 h-auto py-4"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="text-[13px]">Download CSV</div>
                    <div className="text-[9px] opacity-70">
                      For Excel, Google Sheets
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleDownload("json", "public")}
                  disabled={downloading}
                  className="arcade-bg-cyan arcade-btn-cyan hover:opacity-90 h-auto py-4"
                >
                  <FileJson className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="text-[13px]">Download JSON</div>
                    <div className="text-[9px] opacity-70">
                      For web apps, APIs
                    </div>
                  </div>
                </Button>
              </div>

              <div className="mt-4 p-3 bg-[#faf9f6] dark:bg-[#1a1918] rounded-md border border-[#211f1c] dark:border-white/20">
                <p className="text-[10px] text-black/60 dark:text-white/60">
                  <strong>Best for:</strong> Product labeling, educational
                  materials, consumer-facing applications, sustainability
                  reports, quick analysis
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Research Export Tab */}
          <TabsContent value="research" className="space-y-6">
            <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 arcade-bg-red arcade-btn-red rounded-md border border-[#211f1c] dark:border-white/20">
                  <Database className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[18px] normal mb-2">
                    Research-Grade Data Export
                  </h2>
                  <p className="text-[12px] text-black/70 dark:text-white/70 mb-4">
                    Complete scientific metadata for all three dimensions
                    including normalized parameters, confidence intervals,
                    source citations, and calculation timestamps. For academic
                    research and advanced analysis.
                  </p>

                  <div className="space-y-2 mb-4">
                    <h3 className="text-[14px] normal">
                      Included Fields (39 columns):
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        All Public Fields (8 cols)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        CR Parameters: Y, D, C, M, E (0-1)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        CC Parameters: B, N, T, H (0-1)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        RU Parameters: L, R, U, C (0-1)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        CR Practical & Theoretical (0-1)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        CC Practical & Theoretical (0-1)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        RU Practical & Theoretical (0-1)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        95% Confidence Intervals (all 3)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Source Citations (DOI links)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Calculation Timestamps
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Method Versions (CR-v1, CC-v1, RU-v1)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] justify-start"
                      >
                        Whitepaper Version (2025.1)
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Button
                  onClick={() => handleDownload("csv", "full")}
                  disabled={downloading}
                  className="arcade-bg-red arcade-btn-red hover:opacity-90 h-auto py-4"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="text-[13px]">Download CSV (39 cols)</div>
                    <div className="text-[9px] opacity-70">
                      For R, Python, statistical analysis
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleDownload("json", "full")}
                  disabled={downloading}
                  className="arcade-bg-cyan arcade-btn-cyan hover:opacity-90 h-auto py-4"
                >
                  <FileJson className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="text-[13px]">Download JSON</div>
                    <div className="text-[9px] opacity-70">
                      With full metadata & citations
                    </div>
                  </div>
                </Button>
              </div>

              <div className="mt-4 p-3 bg-[#faf9f6] dark:bg-[#1a1918] rounded-md border border-[#211f1c] dark:border-white/20">
                <p className="text-[10px] text-black/60 dark:text-white/60">
                  <strong>Best for:</strong> Academic research, peer review,
                  reproducible studies, methodology validation, LCA databases,
                  multi-dimensional analysis
                </p>
              </div>
            </Card>

            {/* Methodology Reference */}
            <Card className="p-4 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 normal" />
                <h3 className="text-[14px] normal">Methodology References</h3>
              </div>
              <p className="text-[11px] text-black/70 dark:text-white/70 mb-3">
                For detailed information about parameters, formulas, and data
                collection standards, please refer to the WasteDB methodology
                whitepapers (CR-v1, CC-v1, RU-v1).
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-[11px] font-medium normal mb-2">
                    Recyclability (CR) Parameters:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="tag-yellow">
                      Y = Yield (recovery fraction)
                    </Badge>
                    <Badge className="tag-yellow">
                      D = Degradability (quality retention)
                    </Badge>
                    <Badge className="tag-yellow">
                      C = Contamination tolerance
                    </Badge>
                    <Badge className="tag-yellow">
                      M = Infrastructure maturity
                    </Badge>
                    <Badge className="tag-yellow">E = Energy demand</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-medium normal mb-2">
                    Compostability (CC) Parameters:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="tag-pink">B = Biodegradation rate</Badge>
                    <Badge className="tag-pink">N = Nutrient balance</Badge>
                    <Badge className="tag-pink">T = Toxicity (inverted)</Badge>
                    <Badge className="tag-pink">H = Habitat adaptability</Badge>
                    <Badge className="tag-pink">
                      M = Infrastructure maturity (shared)
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-medium normal mb-2">
                    Reusability (RU) Parameters:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="tag-cyan">
                      L = Lifetime (functional cycles)
                    </Badge>
                    <Badge className="tag-cyan">R = Repairability</Badge>
                    <Badge className="tag-cyan">U = Upgradability</Badge>
                    <Badge className="tag-cyan">
                      C = Contamination (functional loss, inverted)
                    </Badge>
                    <Badge className="tag-cyan">
                      M = Infrastructure maturity (shared)
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Format Examples */}
        <Card className="mt-6 p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <h3 className="text-[16px] normal mb-3">Data Format Information</h3>

          <div className="space-y-3">
            <div>
              <h4 className="text-[12px] font-medium normal mb-1">
                CSV Format
              </h4>
              <p className="text-[10px] text-black/70 dark:text-white/70">
                Comma-separated values compatible with Excel, Google Sheets, R,
                and Python pandas. Public export: 8 columns. Research export: 39
                columns with complete scientific metadata. First row contains
                column headers. All text fields are quoted for safety.
              </p>
            </div>

            <div>
              <h4 className="text-[12px] font-medium normal mb-1">
                JSON Format
              </h4>
              <p className="text-[10px] text-black/70 dark:text-white/70">
                Structured JSON with metadata including export date, format
                type, and material count. Research exports include all 15
                parameters across three dimensions, confidence intervals,
                parameter definitions, and source citations with DOI links.
              </p>
            </div>

            <div>
              <h4 className="text-[12px] font-medium normal mb-1">
                Confidence Levels
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="tag-green">
                  High: ≥80% complete + 2+ peer-reviewed sources
                </Badge>
                <Badge className="tag-yellow">Medium: ≥60% complete data</Badge>
                <Badge className="tag-pink">
                  Low: &lt;60% complete (estimated)
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-medium normal mb-1">
                Dual-Mode Scoring
              </h4>
              <p className="text-[10px] text-black/70 dark:text-white/70">
                Each dimension includes both <strong>Practical</strong>{" "}
                (real-world infrastructure) and <strong>Theoretical</strong>{" "}
                (ideal conditions) scores. The gap between them represents
                innovation potential and infrastructure development
                opportunities.
              </p>
            </div>
          </div>
        </Card>

        {/* License & Attribution */}
        <Card className="mt-6 p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <h3 className="text-[16px] normal mb-3">License & Attribution</h3>
          <p className="text-[11px] text-black/70 dark:text-white/70 mb-3">
            WasteDB is maintained by <strong>Wastefull</strong> (San Jose, CA)
            as an open scientific resource. All data is freely available for
            research, education, and commercial use.
          </p>
          <p className="text-[10px] text-black/60 dark:text-white/60 mb-3">
            When using WasteDB data in publications, please cite: <br />
            <em>
              WasteDB: Open Materials Sustainability Database. Wastefull,{" "}
              {new Date().getFullYear()}. Available at: wastedb.wastefull.org
            </em>
          </p>
          <p className="text-[10px] text-black/60 dark:text-white/60">
            <strong>Methodology versions:</strong> CR-v1 (Recyclability), CC-v1
            (Compostability), RU-v1 (Reusability), VIZ-v1 (Visualization) — All
            version 2025.1
          </p>
        </Card>
      </div>
    </div>
  );
}
