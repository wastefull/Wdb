import { useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Download,
  FileUp,
  Upload,
  ChevronDown,
  Eye,
  Save,
  X,
} from "lucide-react";
import { Material } from "../../types/material";
import { getArticleCount } from "../../utils/materialArticles";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SourceLibraryManager } from "../evidence/SourceLibraryManager";
import { SourceDataComparison } from "../evidence/SourceDataComparison";
import { ChartRasterizationDemo } from "../charts/ChartRasterizationDemo";

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
  userRole: "user" | "admin";
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

  const categoryOptions = [
    "Plastics",
    "Metals",
    "Glass",
    "Paper & Cardboard",
    "Fabrics & Textiles",
    "Electronics & Batteries",
    "Building Materials",
    "Organic/Natural Waste",
  ];

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
          "CSV must include: name, category, compostability, recyclability, reusability"
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

        const newMaterial: Material = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: row.name,
          category: row.category,
          description: row.description || "",
          compostability: Math.min(
            100,
            Math.max(0, parseInt(row.compostability) || 0)
          ),
          recyclability: Math.min(
            100,
            Math.max(0, parseInt(row.recyclability) || 0)
          ),
          reusability: Math.min(
            100,
            Math.max(0, parseInt(row.reusability) || 0)
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
          }`
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
        ].join(",")
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
            </div>
          </div>

          {/* Import Options */}
          {showImportOptions && (
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

          <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#211f1c] dark:border-white/20 bg-waste-recycle">
                    <TableHead className="text-[12px] text-black">
                      Name
                    </TableHead>
                    <TableHead className="text-[12px] text-black">
                      Category
                    </TableHead>
                    <TableHead className="text-[12px] text-black">
                      Description
                    </TableHead>
                    <TableHead className="text-[12px] text-black text-center">
                      Compostability
                    </TableHead>
                    <TableHead className="text-[12px] text-black text-center">
                      Recyclability
                    </TableHead>
                    <TableHead className="text-[12px] text-black text-center">
                      Reusability
                    </TableHead>
                    <TableHead className="text-[12px] text-black text-center">
                      Articles
                    </TableHead>
                    <TableHead className="text-[12px] text-black text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => {
                    const isEditing = editingId === material.id;
                    return (
                      <TableRow
                        key={material.id}
                        className="border-b border-[#211f1c]/20 dark:border-white/10 hover:bg-[#211f1c]/5 dark:hover:bg-white/5"
                      >
                        <TableCell className="text-[11px]">
                          {isEditing ? (
                            <Input
                              value={editData.name || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  name: e.target.value,
                                })
                              }
                              className="h-7 text-[11px] border-[#211f1c] dark:border-white/20"
                            />
                          ) : (
                            <button
                              onClick={() => onViewMaterial(material.id)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-left flex items-center gap-1.5 group"
                            >
                              <Eye
                                size={12}
                                className="opacity-0 group-hover:opacity-60 transition-opacity"
                              />
                              {material.name}
                            </button>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editData.category || material.category}
                              onValueChange={(value: string) =>
                                setEditData({
                                  ...editData,
                                  category: value as Material["category"],
                                })
                              }
                            >
                              <SelectTrigger className="h-7 text-[9px] border-[#211f1c] dark:border-white/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
                                {categoryOptions.map((cat: string) => (
                                  <SelectItem
                                    key={cat}
                                    value={cat}
                                    className="text-[9px]"
                                  >
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="tag-cyan">
                              {material.category}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] text-black/70 dark:text-white/70 max-w-xs">
                          {isEditing ? (
                            <Input
                              value={editData.description || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  description: e.target.value,
                                })
                              }
                              className="h-7 text-[11px] border-[#211f1c] dark:border-white/20"
                            />
                          ) : (
                            <span className="truncate block">
                              {material.description || "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={
                                editData.compostability ??
                                material.compostability
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  compostability: Math.min(
                                    100,
                                    Math.max(0, parseInt(e.target.value) || 0)
                                  ),
                                })
                              }
                              className="h-7 w-16 text-[11px] border-[#211f1c] dark:border-white/20 text-center"
                            />
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <span className="text-[11px] normal">
                                {material.compostability}
                              </span>
                              <div className="w-12 h-1.5 bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-waste-compost rounded-full"
                                  style={{
                                    width: `${material.compostability}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={
                                editData.recyclability ?? material.recyclability
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  recyclability: Math.min(
                                    100,
                                    Math.max(0, parseInt(e.target.value) || 0)
                                  ),
                                })
                              }
                              className="h-7 w-16 text-[11px] border-[#211f1c] dark:border-white/20 text-center"
                            />
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <span className="text-[11px] normal">
                                {material.recyclability}
                              </span>
                              <div className="w-12 h-1.5 bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-waste-recycle rounded-full"
                                  style={{
                                    width: `${material.recyclability}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={
                                editData.reusability ?? material.reusability
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  reusability: Math.min(
                                    100,
                                    Math.max(0, parseInt(e.target.value) || 0)
                                  ),
                                })
                              }
                              className="h-7 w-16 text-[11px] border-[#211f1c] dark:border-white/20 text-center"
                            />
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <span className="text-[11px] normal">
                                {material.reusability}
                              </span>
                              <div className="w-12 h-1.5 bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-waste-reuse rounded-full"
                                  style={{ width: `${material.reusability}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[9px] normal">
                            {getArticleCount(material, "compostability")} /{" "}
                            {getArticleCount(material, "recyclability")} /{" "}
                            {getArticleCount(material, "reusability")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={handleSave}
                                className="p-1.5 bg-waste-reuse rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                              >
                                <Save size={12} className="text-black" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-1.5 bg-waste-compost rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                              >
                                <X size={12} className="text-black" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleEdit(material)}
                                className="p-1.5 bg-waste-recycle rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                                title="Edit material"
                              >
                                <Edit2 size={12} className="text-black" />
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="p-1.5 bg-waste-compost rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                                    title="Delete material"
                                  >
                                    <Trash2 size={12} className="text-black" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="normal">
                                      Delete Material?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-black/70 dark:text-white/70">
                                      Are you sure you want to delete "
                                      {material.name}"? This will permanently
                                      remove the material and all its associated
                                      articles. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-waste-reuse border-[#211f1c] dark:border-white/20">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        onDeleteMaterial(material.id)
                                      }
                                      className="bg-waste-compost text-black border-[1.5px] border-[#211f1c] dark:border-white/20 hover:bg-waste-compost/80"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {materials.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[16px] text-black/50 dark:text-white/50">
                  No materials in database yet.
                </p>
              </div>
            )}
          </div>
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
