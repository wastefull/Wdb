import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import * as api from "../../utils/api";
import { Material, MATERIAL_CATEGORIES } from "../../types/material";
import {
  buildMaterialPermalinkPath,
  parseMaterialPermalinkPath,
} from "../../utils/permalinks";
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
import { logger } from "../../utils/logger";

interface SuggestMaterialEditFormProps {
  material: Material;
  allMaterials?: Material[];
  onClose: () => void;
  onSubmitSuccess: () => void;
  isAdminMode?: boolean;
}

export function SuggestMaterialEditForm({
  material,
  allMaterials = [],
  onClose,
  onSubmitSuccess,
  isAdminMode = false,
}: SuggestMaterialEditFormProps) {
  const [name, setName] = useState(material.name);
  const [category, setCategory] = useState<string>(material.category);
  const [description, setDescription] = useState(material.description || "");
  const [aliases, setAliases] = useState(material.aliases?.join(", ") || "");
  const [isHub, setIsHub] = useState(
    material.isHub || material.category === "Elements" || false,
  );
  const [linkedMaterialIds, setLinkedMaterialIds] = useState<string[]>(
    material.linkedMaterialIds || [],
  );
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  useEffect(() => {
    setName(material.name);
    setCategory(material.category);
    setDescription(material.description || "");
    setAliases(material.aliases?.join(", ") || "");
    setIsHub(material.isHub || material.category === "Elements" || false);
    setLinkedMaterialIds(material.linkedMaterialIds || []);
    setLinkSearchQuery("");
  }, [material]);

  const normalizeIds = (ids: string[] = []) => {
    return [...new Set(ids)].sort();
  };

  const availableLinkedMaterials = useMemo(() => {
    const query = linkSearchQuery.trim().toLowerCase();
    const candidates = allMaterials.filter((m) => m.id !== material.id);

    if (!query) return candidates;

    return candidates.filter((m) => {
      const aliases = m.aliases || [];
      return (
        m.name.toLowerCase().includes(query) ||
        aliases.some((alias) => alias.toLowerCase().includes(query))
      );
    });
  }, [allMaterials, linkSearchQuery, material.id]);

  const linkedMaterialNameById = useMemo(() => {
    return new Map(allMaterials.map((m) => [m.id, m.name]));
  }, [allMaterials]);

  const parsedAliases = aliases
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const hasChanges = () => {
    const originalAliases = material.aliases?.join(", ") || "";
    const normalizedCurrentLinks = normalizeIds(linkedMaterialIds);
    const normalizedOriginalLinks = normalizeIds(
      material.linkedMaterialIds || [],
    );

    return (
      name.trim() !== material.name ||
      category !== material.category ||
      description.trim() !== (material.description || "") ||
      aliases.trim() !== originalAliases ||
      isHub !== (material.isHub || material.category === "Elements" || false) ||
      JSON.stringify(normalizedCurrentLinks) !==
        JSON.stringify(normalizedOriginalLinks)
    );
  };

  const toggleLinkedMaterial = (materialId: string) => {
    setLinkedMaterialIds((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges()) {
      toast.error("No changes detected");
      return;
    }

    if (!isAdminMode && !changeReason.trim()) {
      toast.error("Please explain why you're suggesting this change");
      return;
    }

    try {
      setSubmitting(true);

      if (isAdminMode) {
        const normalizedLinks = normalizeIds(linkedMaterialIds);
        const updatedMaterial: Material = {
          ...material,
          name: name.trim(),
          category: category as Material["category"],
          description: description.trim() || undefined,
          aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
          isHub: isHub || undefined,
          linkedMaterialIds:
            isHub && normalizedLinks.length > 0 ? normalizedLinks : undefined,
        };

        // Admin: apply changes directly without a submission
        const savedMaterial = await api.updateMaterial(updatedMaterial);

        // If this edit is being made from a material permalink route,
        // keep the URL in sync immediately after a rename.
        if (parseMaterialPermalinkPath(window.location.pathname)) {
          const canonicalPath = buildMaterialPermalinkPath(savedMaterial);
          if (window.location.pathname !== canonicalPath) {
            window.history.replaceState(
              {},
              "",
              `${canonicalPath}${window.location.search}${window.location.hash}`,
            );
          }
        }

        toast.success(`Updated ${name.trim()} successfully`);
      } else {
        const normalizedLinks = normalizeIds(linkedMaterialIds);
        // Regular user: create a submission for review
        await api.createSubmission({
          type: "edit_material",
          content_data: {
            name: name.trim(),
            category,
            description: description.trim() || undefined,
            aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
            isHub: isHub || undefined,
            linkedMaterialIds:
              isHub && normalizedLinks.length > 0 ? normalizedLinks : undefined,
            change_reason: changeReason.trim(),
          },
          original_content_id: material.id,
        });
        toast.success(
          "Edit suggestion submitted! You'll be notified when it's reviewed.",
        );
      }

      onSubmitSuccess();
      onClose();
    } catch (error) {
      logger.error("Error submitting edit:", error);
      toast.error(
        isAdminMode
          ? "Failed to update material"
          : "Failed to submit edit suggestion",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 w-full max-w-4xl shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c] dark:border-white/20 sticky top-0 bg-white dark:bg-[#2a2825] z-10">
          <h3 className="normal">
            {isAdminMode ? "Edit Material" : "Suggest Edit"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} className="normal" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-waste-reuse dark:bg-[#2a3235] border border-[#211f1c] dark:border-white/20 rounded-md p-3 mb-4">
            <p className="text-[11px] normal">
              ✏️ <strong>Editing:</strong> {material.name}
            </p>
            {!isAdminMode && (
              <p className="text-[10px] text-black/70 dark:text-white/70 mt-1">
                Your suggested changes will be reviewed by an admin before being
                applied.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-[12px] normal">
                  Material Name *
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-category" className="text-[12px] normal">
                  Category *
                </Label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="edit-category" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-aliases" className="text-[12px] normal">
                  Aliases{" "}
                  <span className="text-black/50 dark:text-white/50">
                    (comma-separated)
                  </span>
                </Label>
                <Input
                  id="edit-aliases"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  placeholder="e.g. PET, Polyethylene terephthalate"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="edit-isHub"
                  type="checkbox"
                  checked={isHub}
                  onChange={(e) => setIsHub(e.target.checked)}
                  className="w-4 h-4 accent-waste-recycle"
                />
                <Label
                  htmlFor="edit-isHub"
                  className="text-[12px] normal cursor-pointer"
                >
                  Hub page{" "}
                  <span className="text-black/50 dark:text-white/50">
                    (links to related materials)
                  </span>
                </Label>
              </div>

              <div>
                <Label
                  htmlFor="edit-description"
                  className="text-[12px] normal"
                >
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-20"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <div className="border border-[#211f1c]/20 dark:border-white/10 rounded-md p-3 h-full">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Label
                    htmlFor="linked-material-search"
                    className="text-[12px] normal"
                  >
                    Linked Materials
                  </Label>
                  <span className="text-[10px] text-black/50 dark:text-white/50">
                    {linkedMaterialIds.length} selected
                  </span>
                </div>

                {!isHub && (
                  <p className="text-[10px] text-black/60 dark:text-white/60 mb-3">
                    Enable "Hub page" to link related materials.
                  </p>
                )}

                <Input
                  id="linked-material-search"
                  value={linkSearchQuery}
                  onChange={(e) => setLinkSearchQuery(e.target.value)}
                  placeholder="Search materials to link..."
                  className="mb-3"
                  disabled={!isHub}
                />

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {availableLinkedMaterials.map((candidate) => {
                    const checked = linkedMaterialIds.includes(candidate.id);
                    return (
                      <label
                        key={candidate.id}
                        className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                          isHub
                            ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                            : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!isHub}
                          onChange={() => toggleLinkedMaterial(candidate.id)}
                          className="w-3.5 h-3.5 accent-waste-recycle"
                        />
                        <span className="text-[11px]">
                          {candidate.name}
                          <span className="text-black/50 dark:text-white/50">
                            {` (${candidate.category})`}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {isHub && linkedMaterialIds.length > 0 && (
                  <p className="mt-3 text-[10px] text-black/60 dark:text-white/60">
                    Linked:{" "}
                    {linkedMaterialIds
                      .map((id) => linkedMaterialNameById.get(id) || id)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!isAdminMode && (
            <div className="pt-2 border-t border-[#211f1c]/20 dark:border-white/10">
              <Label htmlFor="change-reason" className="text-[12px] normal">
                Reason for Change *
              </Label>
              <Textarea
                id="change-reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Explain why you're suggesting this change..."
                className="mt-1 min-h-[70px]"
                rows={3}
                required
              />
              <p className="mt-1 text-[10px] text-black/50 dark:text-white/50">
                Help reviewers understand the benefit of your changes.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-waste-compost hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-waste-reuse hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !hasChanges()}
            >
              {submitting
                ? "Saving..."
                : isAdminMode
                  ? "Save Changes"
                  : "Submit Suggestion"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
