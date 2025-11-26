/**
 * Sources Tab - Shared citation management across all dimensions
 */

import { useState } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Search,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import {
  SOURCE_LIBRARY,
  getSourcesByMaterial,
  type Source as LibrarySource,
} from "../../data/sources";
import type { Material, Source } from "./types";
import {
  getSuggestedConfidenceLevel,
  PARAMETER_NAMES,
  autoAssignParameters,
} from "./utils";
import * as api from "../../utils/api";

// Helper function to generate Google Scholar search URL
const getGoogleScholarUrl = (title: string, authors?: string): string => {
  const query = authors ? `${title} ${authors}` : title;
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
};

interface SourcesTabProps {
  material: Material;
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  onParameterChange: (key: keyof Material, value: any) => void;
}

export function SourcesTab({
  material,
  sources,
  onSourcesChange,
  onParameterChange,
}: SourcesTabProps) {
  const [showSourceLibrary, setShowSourceLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [newSource, setNewSource] = useState<Source>({
    title: "",
    authors: "",
    year: undefined,
    doi: "",
    url: "",
    weight: 1.0,
  });

  const handleAddSource = () => {
    if (!newSource.title.trim()) {
      toast.error("Source title is required");
      return;
    }

    onSourcesChange([...sources, { ...newSource }]);
    setNewSource({
      title: "",
      authors: "",
      year: undefined,
      doi: "",
      url: "",
      weight: 1.0,
    });
    toast.success("Source added");
  };

  const handleRemoveSource = (index: number) => {
    onSourcesChange(sources.filter((_, i) => i !== index));
    toast.success("Source removed");
  };

  const handleAddFromLibrary = (librarySource: LibrarySource) => {
    // Check if already added
    const alreadyAdded = sources.some(
      (s) => s.title === librarySource.title && s.doi === librarySource.doi
    );
    if (alreadyAdded) {
      toast.error("This source has already been added");
      return;
    }

    // Auto-assign parameters based on source tags
    const parameters = autoAssignParameters(librarySource.tags || []);

    // Convert library source to material source format
    const newSource: Source = {
      title: librarySource.title,
      authors: librarySource.authors,
      year: librarySource.year,
      doi: librarySource.doi,
      url: librarySource.url,
      weight: librarySource.weight,
      parameters,
    };

    onSourcesChange([...sources, newSource]);
    toast.success("Source added from library");
  };

  const totalWeight = sources.reduce((sum, s) => sum + (s.weight || 1.0), 0);
  const suggestedLevel = getSuggestedConfidenceLevel(
    sources.length,
    totalWeight
  );
  const currentLevel = material.confidence_level || "Medium";

  const levelHierarchy: Record<"High" | "Medium" | "Low", number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return (
    <div className="space-y-4">
      {/* Confidence Level Warning */}
      {levelHierarchy[currentLevel] > levelHierarchy[suggestedLevel] && (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-[11px] text-amber-800 dark:text-amber-200">
            <strong>Confidence Level Mismatch:</strong> Current level is "
            {currentLevel}" but you only have {sources.length} source(s).
            {sources.length === 0 &&
              " Add at least 2 sources for Medium confidence or 3+ for High confidence."}
            {sources.length === 1 &&
              " Add at least 1 more source for Medium confidence or 2+ more for High confidence."}
            {sources.length === 2 &&
              " Add at least 1 more source for High confidence."}
          </AlertDescription>
        </Alert>
      )}

      {/* Metadata Card */}
      <Card className="panel">
        <h3 className="text-[14px] text-black dark:text-white mb-3">
          Metadata
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px]">Confidence Level</Label>
            <Select
              value={currentLevel}
              onValueChange={(value: "High" | "Medium" | "Low") =>
                onParameterChange("confidence_level", value)
              }
            >
              <SelectTrigger className="text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High (3+ sources)</SelectItem>
                <SelectItem value="Medium">Medium (2+ sources)</SelectItem>
                <SelectItem value="Low">Low (0-1 sources)</SelectItem>
              </SelectContent>
            </Select>
            {suggestedLevel !== currentLevel && (
              <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1">
                Recommended: {suggestedLevel} ({sources.length} sources)
              </p>
            )}
          </div>

          <div>
            <Label className="text-[10px]">Whitepaper Version</Label>
            <Input
              type="text"
              value={material.whitepaper_version || ""}
              onChange={(e) =>
                onParameterChange("whitepaper_version", e.target.value)
              }
              placeholder="e.g., 2025.1"
              className="text-[12px]"
            />
          </div>
        </div>
      </Card>

      {/* Existing Sources */}
      <Card className="panel">
        <h3 className="text-[14px] text-black dark:text-white mb-3">
          Citation Sources ({sources.length})
        </h3>

        <div className="space-y-2 mb-4">
          {sources.map((source, index) => (
            <div
              key={index}
              className="p-3 bg-white dark:bg-[#2a2825] border border-[#211f1c] dark:border-white/20 rounded-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] text-black dark:text-white font-medium">
                    {source.title}
                  </p>
                  {source.authors && (
                    <p className="text-[9px] text-black/60 dark:text-white/60">
                      {source.authors}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {source.year && (
                      <Badge variant="outline" className="text-[8px]">
                        {source.year}
                      </Badge>
                    )}
                    {source.doi ? (
                      <a
                        href={`https://doi.org/${source.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        DOI <ExternalLink className="w-2 h-2" />
                      </a>
                    ) : source.pdfFileName ? (
                      <a
                        href={api.getSourcePdfViewUrl(source.pdfFileName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="View uploaded PDF"
                      >
                        <BookOpen className="w-2 h-2" /> View PDF
                      </a>
                    ) : (
                      <a
                        href={getGoogleScholarUrl(source.title, source.authors)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                        title="Search on Google Scholar"
                      >
                        <GraduationCap className="w-2 h-2" /> Scholar
                      </a>
                    )}
                    {source.weight !== undefined && source.weight !== 1.0 && (
                      <Badge variant="outline" className="text-[8px]">
                        Weight: {source.weight.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  {source.parameters && source.parameters.length > 0 && (
                    <div className="mt-2 text-[9px] text-black/60 dark:text-white/60">
                      <span className="italic">Used for:</span>{" "}
                      {source.parameters
                        .map((param) => PARAMETER_NAMES[param] || param)
                        .join(", ")}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handleRemoveSource(index)}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {sources.length === 0 && (
            <p className="text-[11px] text-black/60 dark:text-white/60 text-center py-4">
              No sources added yet
            </p>
          )}
        </div>

        {/* Source Library Browser */}
        <div className="pt-4 border-t border-[#211f1c] dark:border-white/20">
          <Dialog open={showSourceLibrary} onOpenChange={setShowSourceLibrary}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-[#211f1c] dark:border-white/20"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Source Library ({SOURCE_LIBRARY.length} available)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="">
                  Source Library
                </DialogTitle>
                <DialogDescription className="text-[11px]">
                  Browse and add academic sources from our curated library to
                  support your scientific data.
                </DialogDescription>
              </DialogHeader>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                  <Input
                    type="text"
                    placeholder="Search by title, author, or tags..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="pl-10 text-[12px]"
                  />
                </div>
              </div>

              {/* Material-specific sources */}
              {(() => {
                const materialSources = getSourcesByMaterial(material.name);
                if (materialSources.length > 0) {
                  return (
                    <div className="mb-4">
                      <h4 className="text-[12px] text-black dark:text-white mb-2">
                        Recommended for {material.name}
                      </h4>
                      <div className="space-y-2">
                        {materialSources.map((source) => (
                          <Card
                            key={source.id}
                            className="p-3 bg-blue-50 dark:bg-blue-900/20"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-[11px] text-black dark:text-white font-medium">
                                  {source.title}
                                </p>
                                {source.authors && (
                                  <p className="caption">
                                    {source.authors}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {source.year && (
                                    <Badge
                                      variant="outline"
                                      className="text-[8px]"
                                    >
                                      {source.year}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="text-[8px]"
                                  >
                                    {source.type}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-[8px]"
                                  >
                                    Weight: {source.weight?.toFixed(1)}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleAddFromLibrary(source)}
                                size="sm"
                                className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black shrink-0"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* All sources */}
              <div>
                <h4 className="text-[12px] text-black dark:text-white mb-2">
                  All Sources
                </h4>
                <div className="space-y-2">
                  {SOURCE_LIBRARY.filter((source) => {
                    if (!librarySearch) return true;
                    const search = librarySearch.toLowerCase();
                    return (
                      source.title.toLowerCase().includes(search) ||
                      source.authors?.toLowerCase().includes(search) ||
                      source.tags?.some((tag) => tag.includes(search)) ||
                      source.abstract?.toLowerCase().includes(search)
                    );
                  }).map((source) => (
                    <Card key={source.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-[11px] text-black dark:text-white font-medium">
                            {source.title}
                          </p>
                          {source.authors && (
                            <p className="caption">
                              {source.authors}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {source.year && (
                              <Badge variant="outline" className="text-[8px]">
                                {source.year}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[8px]">
                              {source.type}
                            </Badge>
                            {source.tags &&
                              source.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[8px]"
                                >
                                  {tag}
                                </Badge>
                              ))}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddFromLibrary(source)}
                          size="sm"
                          className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black shrink-0"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
