import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Download,
  FileUp,
  Upload,
  ChevronDown,
  Database,
  UploadCloud,
} from "lucide-react";
import {
  Material,
  MATERIAL_CATEGORIES,
  SAFE_WIKI_IMAGE_LICENSES,
} from "../../types/material";
import { toast } from "sonner";
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
import { Textarea } from "../ui/textarea";
import { SourceLibraryManager } from "../evidence/SourceLibraryManager";
import { SourceDataComparison } from "../evidence/SourceDataComparison";
import { ChartRasterizationDemo } from "../charts/ChartRasterizationDemo";
import { logger } from "../../utils/logger";
import { GlideStaticTable } from "./GlideStaticTable";

interface DataManagementViewProps {
  materials: Material[];
  onBack: () => void;
  onUpdateMaterial: (material: Material) => void;
  onUpdateMaterials: (materials: Material[]) => void;
  onBulkImport: (materials: Material[]) => void;
  onDeleteAllData: () => void;
  onDeleteMaterial: (materialId: string) => void;
  onViewMaterial: (materialId: string) => void;
  user: any;
  userRole: "user" | "staff" | "admin";
}

export function DataManagementView({
  materials,
  onBack,
  onUpdateMaterial,
  onUpdateMaterials,
  onBulkImport,
  onDeleteAllData,
  onDeleteMaterial,
  onViewMaterial,
  user,
  userRole,
}: DataManagementViewProps) {
  const [activeTab, setActiveTab] = useState("materials");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Material>>({});
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [pasteData, setPasteData] = useState("");
  const isAdmin = userRole === "admin";

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([...MATERIAL_CATEGORIES, ...materials.map((m) => m.category)]),
      ),
    [materials],
  );

  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setEditData({
      name: material.name,
      category: material.category,
      description: material.description,
      compostability: material.compostability,
      recyclability: material.recyclability,
      reusability: material.reusability,
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    const material = materials.find((m) => m.id === editingId);
    if (!material) return;

    const updatedMaterial = {
      ...material,
      ...editData,
    };
    onUpdateMaterial(updatedMaterial);
    setEditingId(null);
    setEditData({});
    toast.success("Material updated successfully");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const processCSVText = (text: string) => {
    try {
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error("CSV must have headers and at least one row");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredHeaders = [
        "name",
        "category",
        "compostability",
        "recyclability",
        "reusability",
      ];
      const hasRequired = requiredHeaders.every((h) => headers.includes(h));

      if (!hasRequired) {
        toast.error(
          "CSV must include: name, category, compostability, recyclability, reusability",
        );
        return;
      }

      const newMaterials: Material[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        if (!row.name || !row.category) continue;

        const category = row.category as Material["category"];
        if (!MATERIAL_CATEGORIES.includes(category)) {
          logger.warn(
            `Skipping material "${row.name}" with invalid category: ${row.category}`,
          );
          continue;
        }

        const newMaterial: Material = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: row.name,
          category: category,
          description: row.description || "",
          compostability: Math.min(
            100,
            Math.max(0, parseInt(row.compostability) || 0),
          ),
          recyclability: Math.min(
            100,
            Math.max(0, parseInt(row.recyclability) || 0),
          ),
          reusability: Math.min(
            100,
            Math.max(0, parseInt(row.reusability) || 0),
          ),
          articles: {
            compostability: [],
            recyclability: [],
            reusability: [],
          },
        };

        newMaterials.push(newMaterial);
      }

      // Import all materials at once
      if (newMaterials.length > 0) {
        onBulkImport(newMaterials);
        toast.success(
          `Imported ${newMaterials.length} material${
            newMaterials.length !== 1 ? "s" : ""
          }`,
        );
      } else {
        toast.error("No valid materials found in CSV");
      }
    } catch (error) {
      toast.error("Failed to parse CSV data");
    }
  };

  const handlePasteImport = () => {
    if (!pasteData.trim()) {
      toast.error("Please paste CSV data first");
      return;
    }
    processCSVText(pasteData);
    setPasteData("");
    setShowImportOptions(false);
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSVText(text);
      event.target.value = ""; // Reset file input
      setShowImportOptions(false);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const headers = [
      "name",
      "category",
      "description",
      "compostability",
      "recyclability",
      "reusability",
    ];
    const csvContent = [
      headers.join(","),
      ...materials.map((m) =>
        [
          m.name,
          m.category,
          m.description || "",
          m.compostability,
          m.recyclability,
          m.reusability,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wastedb-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  // Full JSON backup with all scientific data
  const handleExportBackup = () => {
    const backup = {
      version: "1.1",
      exported_at: new Date().toISOString(),
      exported_by: user?.email || "unknown",
      material_count: materials.length,
      materials: materials,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wastedb-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Backup created: ${materials.length} materials with full scientific data`,
    );
  };

  // Import from JSON backup
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);

        if (!backup.materials || !Array.isArray(backup.materials)) {
          toast.error("Invalid backup file format");
          return;
        }

        // Validate materials have required fields
        const validMaterials = backup.materials.filter(
          (m: any) =>
            m.name &&
            m.category &&
            typeof m.compostability === "number" &&
            typeof m.recyclability === "number" &&
            typeof m.reusability === "number",
        );

        if (validMaterials.length === 0) {
          toast.error("No valid materials found in backup");
          return;
        }

        // Sanitize wiki blocks: strip any wiki subobject whose image license
        // is present but not on the safe-license whitelist. Materials without
        // a wiki block (pre-wiki backups) are passed through untouched.
        let wikiStrippedCount = 0;
        const sanitizedMaterials = validMaterials.map((m: any) => {
          if (!m.wiki) return m; // old backup or no wiki data — fine as-is
          const licName = m.wiki.imageLicenseName;
          if (
            licName &&
            !(SAFE_WIKI_IMAGE_LICENSES as readonly string[]).includes(licName)
          ) {
            wikiStrippedCount++;
            const { wiki: _stripped, ...rest } = m;
            return rest;
          }
          return m;
        });

        if (wikiStrippedCount > 0) {
          toast.warning(
            `${wikiStrippedCount} material(s) had wiki image data with an unrecognized license — wiki block removed for those records.`,
          );
        }

        onBulkImport(sanitizedMaterials);
        toast.success(
          `Restored ${sanitizedMaterials.length} materials from backup (dated ${
            backup.exported_at || "unknown"
          })`,
        );
      } catch (error) {
        toast.error("Failed to parse backup file");
      }
      event.target.value = ""; // Reset file input
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="text-[18px] normal">Database Management</h2>
          <p className="text-[12px] text-black/60 dark:text-white/60">
            Manage materials and scientific operations
          </p>
        </div>
      </div>

      {/* Tabs for Material Management and Source Library */}
      <div className="mb-6">
        <div className="flex gap-1 md:gap-2 border-b border-[#211f1c]/20 dark:border-white/20 flex-wrap overflow-x-auto">
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-2 md:px-4 py-2 text-[10px] md:text-[12px] transition-colors whitespace-nowrap ${
              activeTab === "materials"
                ? "normal border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            Materials
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-2 md:px-4 py-2 text-[10px] md:text-[12px] transition-colors whitespace-nowrap ${
              activeTab === "sources" || activeTab === "comparison"
                ? "normal border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            Sources
          </button>
        </div>
      </div>

      {activeTab === "materials" ? (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <p className="text-[12px] text-black/60 dark:text-white/60">
                {materials.length} material{materials.length !== 1 ? "s" : ""}{" "}
                total
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCSV}
                className="bg-waste-reuse h-9 px-3 md:px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] text-[11px] md:text-[12px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-1 md:gap-2"
              >
                <Download size={14} className="text-black" />
                <span className="whitespace-nowrap">Export CSV</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowImportOptions(!showImportOptions)}
                  className={`bg-waste-recycle h-9 px-3 md:px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] text-[11px] md:text-[12px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-1 md:gap-2 ${
                    showImportOptions
                      ? "translate-y-px shadow-[1px_2px_0px_-1px_#000000]"
                      : ""
                  }`}
                >
                  <FileUp size={14} className="text-black" />
                  <span className="whitespace-nowrap">Import CSV</span>
                  <ChevronDown
                    size={14}
                    className={`text-black transition-transform ${
                      showImportOptions ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="bg-waste-compost h-9 px-3 md:px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] text-[11px] md:text-[12px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-1 md:gap-2">
                      <Trash2 size={14} className="text-black" />
                      <span className="whitespace-nowrap">Delete All</span>
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="normal">
                        Delete All Data?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-black/70 dark:text-white/70">
                        This will permanently delete all {materials.length}{" "}
                        material{materials.length !== 1 ? "s" : ""} and their
                        associated articles. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-waste-reuse border-[#211f1c] dark:border-white/20">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDeleteAllData}
                        className="bg-waste-compost text-black border-[1.5px] border-[#211f1c] dark:border-white/20 hover:bg-waste-compost/80"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Backup Section */}
          {isAdmin && (
            <div className="retro-card-flat mb-4 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[14px] normal">Full Database Backup</h3>
                  <p className="text-[11px] text-black/60 dark:text-white/60">
                    Export/import all materials with complete scientific data
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportBackup}
                    className="bg-waste-science h-9 px-3 md:px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] text-[11px] md:text-[12px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-1 md:gap-2"
                  >
                    <Database size={14} className="text-black" />
                    <span className="whitespace-nowrap">Download Backup</span>
                  </button>
                  {isAdmin && (
                    <label className="bg-waste-recycle h-9 px-3 md:px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] text-[11px] md:text-[12px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-1 md:gap-2 cursor-pointer">
                      <UploadCloud size={14} className="text-black" />
                      <span className="whitespace-nowrap">Restore Backup</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-black/50 dark:text-white/50">
                Backups include all scientific parameters (CR, CC, RU values),
                sources, and articles. Use this for weekly backups or before
                making major changes.
              </p>
            </div>
          )}
          {/* Import Options */}
          {isAdmin && showImportOptions && (
            <div className="retro-card-flat mb-4 p-4">
              <h3 className="text-[14px] normal mb-4">Import CSV Data</h3>

              <div className="space-y-4">
                {/* Paste CSV Option */}
                <div className="space-y-2">
                  <label className="text-[12px] normal">Paste CSV Data</label>
                  <Textarea
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder="name,category,description,compostability,recyclability,reusability&#10;PET Plastic,Plastics,Clear plastic bottles,0,85,40&#10;Aluminum Can,Metals,Beverage container,0,95,75"
                    className="text-[11px] min-h-[120px] border-[#211f1c] dark:border-white/20 dark:bg-[#1a1917] dark:text-white"
                  />
                  <button
                    onClick={handlePasteImport}
                    className="w-full bg-waste-reuse h-9 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] text-[12px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                  >
                    Import from Paste
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#211f1c]/20 dark:border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-[#2a2825] px-2 text-[11px] text-black/60 dark:text-white/60">
                      OR
                    </span>
                  </div>
                </div>

                {/* Upload File Option */}
                <div className="space-y-2">
                  <label className="text-[12px] normal">Upload CSV File</label>
                  <label className="w-full bg-waste-recycle h-9 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] text-[12px] text-black hover:translate-y-px hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={14} className="text-black" />
                    Choose File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <GlideStaticTable
            materials={materials}
            editingId={editingId}
            editData={editData}
            setEditData={setEditData}
            categoryOptions={categoryOptions}
            isAdmin={isAdmin}
            onViewMaterial={onViewMaterial}
            onEditMaterial={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onDeleteMaterial={onDeleteMaterial}
          />
        </div>
      ) : activeTab === "sources" ? (
        <SourceLibraryManager
          onBack={() => {}} // Empty since we're in a tab
          materials={materials}
          isAuthenticated={!!user}
          isAdmin={userRole === "admin"}
        />
      ) : activeTab === "comparison" ? (
        <SourceDataComparison
          onBack={() => {}} // Empty since we're in a tab
          materials={materials}
        />
      ) : activeTab === "charts" ? (
        <ChartRasterizationDemo />
      ) : null}
    </div>
  );
}
