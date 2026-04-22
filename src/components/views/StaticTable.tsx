import { Edit2, Eye, Save, Trash2, X } from "lucide-react";
import { Material } from "../../types/material";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface StaticTableProps {
  materials: Material[];
  editingId: string | null;
  editData: Partial<Material>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<Material>>>;
  categoryOptions: string[];
  isAdmin: boolean;
  onViewMaterial: (materialId: string) => void;
  onEditMaterial: (material: Material) => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteMaterial: (materialId: string) => void;
}

export function StaticTable({
  materials,
  editingId,
  editData,
  setEditData,
  categoryOptions,
  isAdmin,
  onViewMaterial,
  onEditMaterial,
  onSave,
  onCancel,
  onDeleteMaterial,
}: StaticTableProps) {
  return (
    <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#211f1c] dark:border-white/20 bg-waste-recycle">
              <TableHead className="text-[12px] text-black">Name</TableHead>
              <TableHead className="text-[12px] text-black">Category</TableHead>
              <TableHead className="text-[12px] text-black">
                Description
              </TableHead>
              {/* <TableHead className="text-[12px] text-black text-center">
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
              </TableHead> */}
              {isAdmin && (
                <TableHead className="text-[12px] text-black text-center">
                  Actions
                </TableHead>
              )}
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
                      <span className="tag-cyan">{material.category}</span>
                    )}
                  </TableCell>
                  {/* Recyclability Scores */}
                  {/* <TableCell className="text-center">
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
                                    Math.max(0, parseInt(e.target.value) || 0),
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
                                    Math.max(0, parseInt(e.target.value) || 0),
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
                                    Math.max(0, parseInt(e.target.value) || 0),
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
                        </TableCell> */}
                  {/* Articles: */}
                  {/* <TableCell className="text-center">
                          <span className="text-[9px] normal">
                            {getArticleCount(material, "compostability")} /{" "}
                            {getArticleCount(material, "recyclability")} /{" "}
                            {getArticleCount(material, "reusability")}
                          </span>
                        </TableCell> */}
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
                  {isAdmin && (
                    <TableCell className="text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={onSave}
                            className="p-1.5 bg-waste-reuse rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          >
                            <Save size={12} className="text-black" />
                          </button>
                          <button
                            onClick={onCancel}
                            className="p-1.5 bg-waste-compost rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          >
                            <X size={12} className="text-black" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => onEditMaterial(material)}
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
                                  {material.name}"? This will permanently remove
                                  the material and all its associated articles.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-waste-reuse border-[#211f1c] dark:border-white/20">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteMaterial(material.id)}
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
                  )}
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
  );
}
