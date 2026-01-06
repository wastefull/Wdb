import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Target,
  Clipboard,
  Hash,
  Info,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Lock,
  Unlock,
  Calendar,
  Users,
  Globe,
  Building2,
  FileSearch,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { Alert, AlertDescription } from "../ui/alert";
import { SOURCE_LIBRARY } from "../../data/sources";
import { PDFViewer } from "./PDFViewer";

interface CurationWorkbenchProps {
  onBack: () => void;
}

// Pilot materials for Phase 9.2 (matched by name, case-insensitive)
const PILOT_MATERIAL_PATTERNS = ["cardboard", "pet", "hdpe", "paper", "glass"];

// CR (Compostability/Recyclability) parameters only for Phase 9.2
const CR_PARAMETERS = [
  {
    code: "Y",
    name: "Years to Degrade",
    description: "Time required for complete degradation",
    unit: "years",
  },
  {
    code: "D",
    name: "Degradability",
    description: "Rate of material breakdown",
    unit: "score",
  },
  {
    code: "C",
    name: "Compostability",
    description: "Ability to break down in composting conditions",
    unit: "score",
  },
  {
    code: "M",
    name: "Methane Production",
    description: "Methane emissions during decomposition",
    unit: "score",
  },
  {
    code: "E",
    name: "Ecotoxicity",
    description: "Environmental toxicity impact",
    unit: "score",
  },
];

interface MIUFormData {
  material_id: string;
  parameter_code: string;
  snippet: string;
  raw_value: string;
  raw_unit: string;
  source_ref: string;
  citation: string;
  page_number: string;
  figure_number: string;
  table_number: string;
  confidence_level: "high" | "medium" | "low";
  notes: string;
}

interface UnitsOntology {
  version: string;
  parameters: Record<
    string,
    {
      name: string;
      canonical_unit: string;
      allowed_units: string[];
      conversions: Record<string, any>;
      validation: {
        min?: number;
        max?: number;
        description: string;
      };
    }
  >;
}

export function CurationWorkbench({ onBack }: CurationWorkbenchProps) {
  const { materials } = useMaterialsContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [unitsOntology, setUnitsOntology] = useState<UnitsOntology | null>(
    null
  );
  const [unitValidationError, setUnitValidationError] = useState<string>("");

  const [formData, setFormData] = useState<MIUFormData>({
    material_id: "",
    parameter_code: "",
    snippet: "",
    raw_value: "",
    raw_unit: "",
    source_ref: "",
    citation: "",
    page_number: "",
    figure_number: "",
    table_number: "",
    confidence_level: "medium",
    notes: "",
  });

  // Get pilot materials (filter by name patterns, case-insensitive)
  const pilotMaterials = materials.filter(
    (m) =>
      m?.name &&
      PILOT_MATERIAL_PATTERNS.some((pattern) =>
        m.name.toLowerCase().includes(pattern)
      )
  );

  // Load sources for the source viewer
  useEffect(() => {
    loadSources();
    loadUnitsOntology();
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
        if (data.success && data.sources && data.sources.length > 0) {
          setSources(data.sources);
        } else {
          // Fallback to local SOURCE_LIBRARY if API returns empty
          setSources([...SOURCE_LIBRARY]);
        }
      } else {
        // Fallback to local SOURCE_LIBRARY on API error
        setSources([...SOURCE_LIBRARY]);
      }
    } catch (error) {
      console.error("Error loading sources:", error);
      // Fallback to local SOURCE_LIBRARY
      setSources([...SOURCE_LIBRARY]);
      toast.error("Using local source library (API unavailable)");
    } finally {
      setLoadingSources(false);
    }
  };

  const loadUnitsOntology = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/units`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ontology) {
          setUnitsOntology(data.ontology);
        }
      }
    } catch (error) {
      console.error("Error loading units ontology:", error);
      // Don't show error toast - validation will just be disabled
    }
  };

  // Validate unit when parameter or unit changes
  useEffect(() => {
    if (!formData.parameter_code || !formData.raw_unit || !unitsOntology) {
      setUnitValidationError("");
      return;
    }

    const parameterDef = unitsOntology.parameters[formData.parameter_code];
    if (!parameterDef) {
      setUnitValidationError("");
      return;
    }

    const isValidUnit = parameterDef.allowed_units.includes(formData.raw_unit);
    if (!isValidUnit) {
      setUnitValidationError(
        `Invalid unit for parameter ${
          formData.parameter_code
        }. Allowed units: ${parameterDef.allowed_units.join(", ")}`
      );
    } else {
      setUnitValidationError("");
    }
  }, [formData.parameter_code, formData.raw_unit, unitsOntology]);

  // Get allowed units for the selected parameter
  const getAllowedUnits = (parameterCode: string): string[] => {
    if (!unitsOntology || !parameterCode) return [];
    const parameterDef = unitsOntology.parameters[parameterCode];
    return parameterDef?.allowed_units || [];
  };

  // Get canonical unit for the selected parameter
  const getCanonicalUnit = (parameterCode: string): string => {
    if (!unitsOntology || !parameterCode) return "";
    const parameterDef = unitsOntology.parameters[parameterCode];
    return parameterDef?.canonical_unit || "";
  };

  const handleSourceSelect = (source: any) => {
    setSelectedSource(source);
    setFormData({
      ...formData,
      source_ref: source.id,
      citation: source.citation || source.title || "",
    });
  };

  const handleSubmit = async () => {
    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      if (!accessToken) {
        toast.error("Please sign in to create evidence points");
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
            source_type: "whitepaper",
            source_ref: formData.source_ref,
            citation: formData.citation,
            confidence_level: formData.confidence_level,
            notes: formData.notes || null,
            page_number: formData.page_number
              ? parseInt(formData.page_number)
              : null,
            figure_number: formData.figure_number || null,
            table_number: formData.table_number || null,
            dimension: "CR",
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("✅ MIU created successfully!");
        resetForm();
        setCurrentStep(1);
      } else {
        toast.error(data.error || "Failed to create MIU");
      }
    } catch (error) {
      console.error("Error creating MIU:", error);
      toast.error("Failed to create MIU");
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: "",
      parameter_code: "",
      snippet: "",
      raw_value: "",
      raw_unit: "",
      source_ref: "",
      citation: "",
      page_number: "",
      figure_number: "",
      table_number: "",
      confidence_level: "medium",
      notes: "",
    });
    setSelectedSource(null);
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2:
        return !!selectedSource;
      case 3:
        return !!formData.material_id;
      case 4:
        return !!formData.parameter_code;
      case 5:
        return (
          !!formData.snippet && !!formData.raw_value && !!formData.raw_unit
        );
      default:
        return true;
    }
  };

  const steps = [
    { number: 1, title: "Select Source", icon: BookOpen },
    { number: 2, title: "Choose Material", icon: Target },
    { number: 3, title: "Pick Parameter", icon: Clipboard },
    { number: 4, title: "Extract Value", icon: Hash },
    { number: 5, title: "Add Metadata", icon: Info },
  ];

  return (
    <div className="h-full flex flex-col bg-[#e5e4dc] dark:bg-[#1a1917]">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="heading-xl">Curation Workbench</h2>
          <p className="label-muted">
            Phase 9.2: CR Parameters Only (Aluminum, PET, Cardboard)
          </p>
        </div>
        <Badge className="bg-[#a8d5ba] border-[#211f1c] dark:border-white/20 text-black font-['Sniglet']">
          Pilot Mode
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-[#2a2825] border-b border-[#211f1c]/20 dark:border-white/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (isCompleted || isActive) {
                      setCurrentStep(step.number);
                    }
                  }}
                  disabled={!isCompleted && !isActive}
                  className={`flex items-center gap-3 transition-all ${
                    isActive || isCompleted
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-40"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-[#a8d5ba] border-[#211f1c] dark:border-white"
                        : isActive
                        ? "bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
                        : "bg-[#e5e4dc] dark:bg-[#3a3835] border-[#211f1c]/20 dark:border-white/20"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={18} className="text-black" />
                    ) : (
                      <Icon size={18} className="normal" />
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <div
                      className={`font-['Tilt_Warp'] text-[11px] ${
                        isActive ? "normal" : "text-black/40 dark:text-white/40"
                      }`}
                    >
                      Step {step.number}
                    </div>
                    <div
                      className={`font-['Sniglet'] text-[10px] ${
                        isActive ? "normal" : "text-black/40 dark:text-white/40"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight
                    size={16}
                    className="mx-4 text-black/20 dark:text-white/20 hidden md:block"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Split-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Source Viewer */}
        <div className="flex-1 min-w-[500px] bg-white dark:bg-[#2a2825] flex flex-col border-r border-[#211f1c]/20 dark:border-white/20">
          <div className="panel-bordered">
            <h3 className="font-['Tilt_Warp'] text-[16px] normal mb-1">
              Source Viewer
            </h3>
            <p className="label-muted-sm">
              {selectedSource
                ? `Viewing: ${selectedSource.title || selectedSource.citation}`
                : "Select a source to begin"}
            </p>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {currentStep === 1 ? (
              /* Step 1: Source Selection */
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-4">
                  {loadingSources ? (
                    <div className="text-center py-12">
                      <p className="label-muted">Loading sources...</p>
                    </div>
                  ) : sources.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText
                        size={48}
                        className="mx-auto mb-4 text-black/20 dark:text-white/20"
                      />
                      <h4 className="font-['Tilt_Warp'] text-[14px] normal mb-2">
                        No Sources Available
                      </h4>
                      <p className="label-muted-sm">
                        Please add sources to the library first
                      </p>
                    </div>
                  ) : (
                    sources.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceSelect(source)}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                          selectedSource?.id === source.id
                            ? "border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
                            : "border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40"
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <BookOpen
                            size={14}
                            className="text-black/60 dark:text-white/60 mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-['Tilt_Warp'] text-[13px] normal truncate">
                              {source.title || "Untitled"}
                            </h4>
                            <p className="label-muted-sm line-clamp-2">
                              {source.citation ||
                                source.authors ||
                                "No citation available"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {source.year && (
                            <Badge
                              variant="secondary"
                              className="font-['Sniglet'] text-[9px]"
                            >
                              {source.year}
                            </Badge>
                          )}
                          {/* OA Status Badge */}
                          {source.is_open_access === true && (
                            <Badge
                              className={`text-[8px] ${
                                source.manual_oa_override
                                  ? "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                              }`}
                              title={`Open Access${
                                source.manual_oa_override ? " (Manual)" : ""
                              }`}
                            >
                              <Unlock className="w-2 h-2 mr-0.5" />
                              OA
                            </Badge>
                          )}
                          {source.is_open_access === false && (
                            <Badge
                              className={`text-[8px] ${
                                source.manual_oa_override
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              }`}
                              title={`Closed Access${
                                source.manual_oa_override ? " (Manual)" : ""
                              }`}
                            >
                              <Lock className="w-2 h-2 mr-0.5" />
                              Closed
                            </Badge>
                          )}
                          {source.pdfFileName && (
                            <Badge
                              variant="outline"
                              className="text-[8px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              title="PDF Available"
                            >
                              PDF
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            ) : (
              /* Steps 2-5: Show selected source content with PDF viewer prominent */
              <>
                {selectedSource ? (
                  <>
                    {/* Compact source metadata bar */}
                    <div className="p-3 border-b border-[#211f1c]/20 dark:border-white/20 bg-[#f5f4f0] dark:bg-[#1a1917] shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-['Tilt_Warp'] text-[12px] truncate">
                            {selectedSource.title || "Untitled Source"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {selectedSource.authors && (
                              <span className="font-['Sniglet'] text-[9px] text-black/60 dark:text-white/60 truncate max-w-[150px]">
                                {selectedSource.authors}
                              </span>
                            )}
                            {selectedSource.year && (
                              <span className="font-['Sniglet'] text-[9px] text-black/60 dark:text-white/60">
                                ({selectedSource.year})
                              </span>
                            )}
                            {selectedSource.is_open_access === true && (
                              <Badge className="text-[7px] bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 h-4">
                                <Unlock className="w-2 h-2 mr-0.5" />
                                OA
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Quick links */}
                        <div className="flex items-center gap-1 shrink-0">
                          {selectedSource.doi && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                window.open(
                                  `https://doi.org/${selectedSource.doi}`,
                                  "_blank"
                                )
                              }
                              title="Open via DOI"
                            >
                              <ExternalLink size={12} />
                            </Button>
                          )}
                          {selectedSource.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                window.open(selectedSource.url, "_blank")
                              }
                              title="Open Source URL"
                            >
                              <Globe size={12} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PDF Viewer - takes most of the space */}
                    {selectedSource.pdfFileName ? (
                      <div className="flex-1 p-2 overflow-hidden min-h-0">
                        <PDFViewer
                          pdfUrl={`https://${projectId}.supabase.co/storage/v1/object/public/make-17cae920-source-pdfs/${selectedSource.pdfFileName}`}
                          title={selectedSource.title}
                          height="100%"
                          onTextSelect={(text, pageNumber) => {
                            // Auto-fill snippet and page number
                            setFormData((prev) => ({
                              ...prev,
                              snippet: text,
                              page_number: pageNumber.toString(),
                            }));
                            toast.success(
                              `Text copied to snippet field (Page ${pageNumber})`
                            );
                          }}
                          onPageChange={(pageNumber) => {
                            // Keep track of current page for manual entry
                          }}
                        />
                      </div>
                    ) : (
                      /* No PDF - show abstract and access helpers */
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 space-y-4">
                          {/* Quick Access Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {selectedSource.doi && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={() =>
                                  window.open(
                                    `https://doi.org/${selectedSource.doi}`,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink size={10} className="mr-1" />
                                Open via DOI
                              </Button>
                            )}
                            {selectedSource.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={() =>
                                  window.open(selectedSource.url, "_blank")
                                }
                              >
                                <Globe size={10} className="mr-1" />
                                Open Source URL
                              </Button>
                            )}
                            {(selectedSource.doi || selectedSource.title) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={() =>
                                  window.open(
                                    `https://scholar.google.com/scholar?q=${encodeURIComponent(
                                      selectedSource.doi || selectedSource.title
                                    )}`,
                                    "_blank"
                                  )
                                }
                              >
                                <FileSearch size={10} className="mr-1" />
                                Google Scholar
                              </Button>
                            )}
                          </div>

                          {/* Abstract */}
                          <div>
                            <Label className="font-['Tilt_Warp'] text-[10px] text-black/60 dark:text-white/60">
                              ABSTRACT / SUMMARY
                            </Label>
                            <p className="font-['Sniglet'] text-[11px] normal mt-2 leading-relaxed">
                              {selectedSource.abstract ||
                                selectedSource.summary ||
                                "No abstract available. Use the buttons above to access the full document."}
                            </p>
                          </div>

                          {/* No PDF helper */}
                          <div className="p-3 bg-[#fff9e6] dark:bg-[#3a3220] border border-[#f4d5a6] dark:border-[#5a4820] rounded-md space-y-2">
                            <p className="font-['Sniglet'] text-[10px] text-black/80 dark:text-white/80">
                              💡 <strong>No PDF uploaded yet.</strong>
                            </p>
                            <p className="font-['Sniglet'] text-[9px] text-black/60 dark:text-white/60">
                              Use the buttons above to access the source
                              document. Once you have the PDF, upload it via the
                              Source Library Manager to enable inline viewing
                              here.
                            </p>
                          </div>
                        </div>
                      </ScrollArea>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FileText
                        size={48}
                        className="mx-auto mb-4 text-black/20 dark:text-white/20"
                      />
                      <p className="label-muted-sm">No source selected</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Pane: Evidence Wizard */}
        <div className="w-[380px] min-w-[320px] max-w-[420px] bg-white dark:bg-[#2a2825] flex flex-col">
          <div className="panel-bordered">
            <h3 className="font-['Tilt_Warp'] text-[16px] normal mb-1">
              Evidence Wizard
            </h3>
            <p className="label-muted-sm">5-Step MIU Creation Flow</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Step 1: Source Selection Confirmation */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-['Tilt_Warp'] ${
                        selectedSource
                          ? "bg-[#a8d5ba] border-[#211f1c] text-black"
                          : "border-[#211f1c]/40 text-black/40 dark:text-white/40"
                      }`}
                    >
                      1
                    </div>
                    <Label className="font-['Tilt_Warp'] text-[13px]">
                      Select Source
                    </Label>
                  </div>

                  {selectedSource ? (
                    <Card className="border-2 border-[#211f1c] dark:border-white/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-['Tilt_Warp'] text-[14px]">
                          {selectedSource.title || "Untitled Source"}
                        </CardTitle>
                        <CardDescription className="font-['Sniglet'] text-[11px]">
                          {selectedSource.authors || selectedSource.citation}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedSource.year && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {selectedSource.year}
                            </Badge>
                            {selectedSource.type && (
                              <Badge variant="outline" className="text-[10px]">
                                {selectedSource.type}
                              </Badge>
                            )}
                          </div>
                        )}
                        {selectedSource.abstract && (
                          <div>
                            <Label className="font-['Tilt_Warp'] text-[10px] text-black/60 dark:text-white/60">
                              ABSTRACT
                            </Label>
                            <p className="font-['Sniglet'] text-[11px] text-black/80 dark:text-white/80 mt-1 line-clamp-4">
                              {selectedSource.abstract}
                            </p>
                          </div>
                        )}
                        {selectedSource.doi && (
                          <div>
                            <Label className="font-['Tilt_Warp'] text-[10px] text-black/60 dark:text-white/60">
                              DOI
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <a
                                href={`https://doi.org/${selectedSource.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-['Sniglet'] text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                {selectedSource.doi}
                                <ExternalLink size={10} />
                              </a>
                              {/* OA Status Badge */}
                              {selectedSource.is_open_access === true && (
                                <Badge
                                  className={`text-[8px] ${
                                    selectedSource.manual_oa_override
                                      ? "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  }`}
                                  title={`Open Access${
                                    selectedSource.manual_oa_override
                                      ? " (Manual Override)"
                                      : ""
                                  }`}
                                >
                                  <Unlock className="w-2 h-2 mr-0.5" />
                                  OA
                                </Badge>
                              )}
                              {selectedSource.is_open_access === false && (
                                <Badge
                                  className={`text-[8px] ${
                                    selectedSource.manual_oa_override
                                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                  }`}
                                  title={`Closed Access${
                                    selectedSource.manual_oa_override
                                      ? " (Manual Override)"
                                      : ""
                                  }`}
                                >
                                  <Lock className="w-2 h-2 mr-0.5" />
                                  Closed
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-[#211f1c]/20 dark:border-white/20 rounded-lg text-center">
                      <FileText
                        size={32}
                        className="mx-auto mb-3 text-black/20 dark:text-white/20"
                      />
                      <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">
                        Select a source from the list on the left to begin
                        extracting evidence.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Material Selection */}
              {currentStep >= 2 && (
                <div
                  className={`space-y-3 ${
                    currentStep !== 2 ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-['Tilt_Warp'] ${
                        formData.material_id
                          ? "bg-[#a8d5ba] border-[#211f1c] text-black"
                          : "border-[#211f1c]/40 text-black/40 dark:text-white/40"
                      }`}
                    >
                      2
                    </div>
                    <Label className="font-['Tilt_Warp'] text-[13px]">
                      Select Material
                    </Label>
                  </div>
                  <Select
                    value={formData.material_id}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, material_id: value })
                    }
                    disabled={currentStep !== 2}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose pilot material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pilotMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          <div className="flex items-center gap-2">
                            <span>{material.name}</span>
                            <Badge variant="secondary" className="text-[9px]">
                              Pilot
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 3: Parameter Selection */}
              {currentStep >= 3 && (
                <div
                  className={`space-y-3 ${
                    currentStep !== 3 ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-['Tilt_Warp'] ${
                        formData.parameter_code
                          ? "bg-[#a8d5ba] border-[#211f1c] text-black"
                          : "border-[#211f1c]/40 text-black/40 dark:text-white/40"
                      }`}
                    >
                      3
                    </div>
                    <Label className="font-['Tilt_Warp'] text-[13px]">
                      Select Parameter (CR Dimension)
                    </Label>
                  </div>
                  <Select
                    value={formData.parameter_code}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, parameter_code: value })
                    }
                    disabled={currentStep !== 3}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose CR parameter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CR_PARAMETERS.map((param) => (
                        <SelectItem key={param.code} value={param.code}>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {param.code} - {param.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {param.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 4: Extract Value */}
              {currentStep >= 4 && (
                <div
                  className={`space-y-3 ${
                    currentStep !== 4 ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-['Tilt_Warp'] ${
                        formData.raw_value &&
                        formData.raw_unit &&
                        formData.snippet
                          ? "bg-[#a8d5ba] border-[#211f1c] text-black"
                          : "border-[#211f1c]/40 text-black/40 dark:text-white/40"
                      }`}
                    >
                      4
                    </div>
                    <Label className="font-['Tilt_Warp'] text-[13px]">
                      Extract Value & Context
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="snippet"
                      className="font-['Sniglet'] text-[11px]"
                    >
                      Text Snippet
                    </Label>
                    <Textarea
                      id="snippet"
                      placeholder="Paste the relevant text from the source..."
                      value={formData.snippet}
                      onChange={(e) =>
                        setFormData({ ...formData, snippet: e.target.value })
                      }
                      disabled={currentStep !== 4}
                      rows={4}
                      className="font-['Sniglet'] text-[11px]"
                    />
                    <p className="text-[10px] text-muted-foreground font-['Sniglet']">
                      {formData.snippet.length}/250 words • Must be verbatim
                      from source
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="raw_value"
                        className="font-['Sniglet'] text-[11px]"
                      >
                        Numeric Value
                      </Label>
                      <Input
                        id="raw_value"
                        type="number"
                        step="any"
                        placeholder="e.g. 12.5"
                        value={formData.raw_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            raw_value: e.target.value,
                          })
                        }
                        disabled={currentStep !== 4}
                        className="font-['Sniglet'] text-[11px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="raw_unit"
                        className="font-['Sniglet'] text-[11px]"
                      >
                        Unit{" "}
                        {formData.parameter_code && unitsOntology && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[9px] font-normal"
                          >
                            Canonical:{" "}
                            {getCanonicalUnit(formData.parameter_code)}
                          </Badge>
                        )}
                      </Label>
                      {formData.parameter_code &&
                      getAllowedUnits(formData.parameter_code).length > 0 ? (
                        <Select
                          value={formData.raw_unit}
                          onValueChange={(value: string) =>
                            setFormData({ ...formData, raw_unit: value })
                          }
                          disabled={currentStep !== 4}
                        >
                          <SelectTrigger className="w-full font-['Sniglet'] text-[11px]">
                            <SelectValue placeholder="Select unit..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAllowedUnits(formData.parameter_code).map(
                              (unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="raw_unit"
                          placeholder="e.g. years, %"
                          value={formData.raw_unit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              raw_unit: e.target.value,
                            })
                          }
                          disabled={currentStep !== 4}
                          className="font-['Sniglet'] text-[11px]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Unit validation error */}
                  {unitValidationError && currentStep === 4 && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                      <AlertCircle className="size-4 text-red-600" />
                      <AlertDescription className="font-['Sniglet'] text-[11px] text-red-800 dark:text-red-200">
                        {unitValidationError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Unit info card */}
                  {formData.parameter_code &&
                    unitsOntology &&
                    currentStep === 4 &&
                    !unitValidationError && (
                      <div className="p-3 bg-[#e8f5e9] dark:bg-[#1b3a1f] border border-[#a5d6a7] dark:border-[#2e5a32] rounded-md">
                        <p className="font-['Sniglet'] text-[10px] text-black/80 dark:text-white/80">
                          ✅{" "}
                          <strong>
                            Valid unit for {formData.parameter_code}
                          </strong>
                          {formData.raw_unit &&
                            formData.raw_unit !==
                              getCanonicalUnit(formData.parameter_code) && (
                              <>
                                {" "}
                                • Will be converted to{" "}
                                {getCanonicalUnit(formData.parameter_code)}
                              </>
                            )}
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* Step 5: Metadata */}
              {currentStep >= 5 && (
                <div
                  className={`space-y-3 ${
                    currentStep !== 5 ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-[#211f1c]/40 flex items-center justify-center text-[11px] font-['Tilt_Warp'] text-black/40 dark:text-white/40">
                      5
                    </div>
                    <Label className="font-['Tilt_Warp'] text-[13px]">
                      Add Metadata
                    </Label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="page_number"
                        className="font-['Sniglet'] text-[11px]"
                      >
                        Page
                      </Label>
                      <Input
                        id="page_number"
                        type="number"
                        placeholder="e.g. 42"
                        value={formData.page_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            page_number: e.target.value,
                          })
                        }
                        disabled={currentStep !== 5}
                        className="font-['Sniglet'] text-[11px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="figure_number"
                        className="font-['Sniglet'] text-[11px]"
                      >
                        Figure
                      </Label>
                      <Input
                        id="figure_number"
                        placeholder="e.g. 3a"
                        value={formData.figure_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            figure_number: e.target.value,
                          })
                        }
                        disabled={currentStep !== 5}
                        className="font-['Sniglet'] text-[11px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="table_number"
                        className="font-['Sniglet'] text-[11px]"
                      >
                        Table
                      </Label>
                      <Input
                        id="table_number"
                        placeholder="e.g. 2"
                        value={formData.table_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            table_number: e.target.value,
                          })
                        }
                        disabled={currentStep !== 5}
                        className="font-['Sniglet'] text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confidence_level"
                      className="font-['Sniglet'] text-[11px]"
                    >
                      Confidence Level
                    </Label>
                    <Select
                      value={formData.confidence_level}
                      onValueChange={(value: "high" | "medium" | "low") =>
                        setFormData({ ...formData, confidence_level: value })
                      }
                      disabled={currentStep !== 5}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">
                          High - Direct measurement
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium - Calculated/inferred
                        </SelectItem>
                        <SelectItem value="low">Low - Estimated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="notes"
                      className="font-['Sniglet'] text-[11px]"
                    >
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional context or observations..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      disabled={currentStep !== 5}
                      rows={3}
                      className="font-['Sniglet'] text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Navigation Footer */}
          <div className="p-4 border-t border-[#211f1c]/20 dark:border-white/20 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex-1"
            >
              Previous
            </Button>
            {currentStep < 5 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToStep(currentStep + 1)}
                className="flex-1 bg-[#a8d5ba] hover:bg-[#a8d5ba]/90 border border-[#211f1c] text-black"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.snippet || !formData.raw_value || !formData.raw_unit
                }
                className="flex-1 bg-[#a8d5ba] hover:bg-[#a8d5ba]/90 border border-[#211f1c] text-black"
              >
                Create MIU
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
