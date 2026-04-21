import { useEffect, useMemo, useState } from "react";
import { X, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import * as api from "../../utils/api";
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
import {
  searchWikidataForMaterial,
  fetchWikipediaSummary,
  type WikidataSearchResult,
} from "../../utils/wikiEnrichment";
import { Material } from "../../types/material";
import { buildMaterialPermalinkPath } from "../../utils/permalinks";

const CATEGORIES = [
  "Packaging",
  "Textiles",
  "Electronics",
  "Construction",
  "Food & Organic",
  "Plastics",
  "Metals",
  "Other",
];

const MATERIAL_HINT_WORDS = [
  "material",
  "paper",
  "plastic",
  "metal",
  "fabric",
  "textile",
  "organic",
  "packaging",
  "board",
  "cardboard",
  "card stock",
];

const NON_MATERIAL_HINT_WORDS = [
  "city",
  "county",
  "surname",
  "given name",
  "person",
  "village",
  "town",
  "football",
  "album",
  "film",
  "song",
  "disambiguation",
];

function rankCandidates(
  candidates: WikidataSearchResult[],
): WikidataSearchResult[] {
  const score = (c: WikidataSearchResult) => {
    const text = `${c.label} ${c.description ?? ""}`.toLowerCase();
    let points = 0;
    for (const w of MATERIAL_HINT_WORDS) {
      if (text.includes(w)) points += 2;
    }
    for (const w of NON_MATERIAL_HINT_WORDS) {
      if (text.includes(w)) points -= 3;
    }
    return points;
  };
  return [...candidates].sort((a, b) => score(b) - score(a));
}

function guessCategoryFromCandidate(
  candidate: WikidataSearchResult,
): string | null {
  const text =
    `${candidate.label} ${candidate.description ?? ""}`.toLowerCase();
  if (/(paper|cardboard|card stock|carton)/.test(text)) return "Packaging";
  if (/(textile|fabric|cloth|cotton|wool|polyester)/.test(text))
    return "Textiles";
  if (/(metal|steel|iron|aluminum|copper|bronze|alloy)/.test(text))
    return "Metals";
  if (/(plastic|polymer|pet|hdpe|pvc|polypropylene|polyethylene)/.test(text))
    return "Plastics";
  if (/(electronic|battery|lithium|circuit|semiconductor)/.test(text))
    return "Electronics";
  if (
    /(concrete|cement|timber|wood|brick|construction|gypsum|drywall)/.test(text)
  )
    return "Construction";
  if (/(food|organic|compost|biomass|biodegradable)/.test(text))
    return "Food & Organic";
  return null;
}

function normalizeMaterialName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function compactMaterialName(value: string): string {
  return normalizeMaterialName(value).replace(/\s+/g, "");
}

function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const pairsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const pair = a.slice(i, i + 2);
    pairsA.set(pair, (pairsA.get(pair) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const pair = b.slice(i, i + 2);
    const count = pairsA.get(pair) || 0;
    if (count > 0) {
      pairsA.set(pair, count - 1);
      intersection++;
    }
  }

  return (2 * intersection) / (a.length - 1 + (b.length - 1));
}

type DuplicateMatch = {
  material: Material;
  certainty: "exact" | "high";
};

function findDuplicateCandidate(
  inputName: string,
  materials: Material[],
): DuplicateMatch | null {
  const normalizedInput = normalizeMaterialName(inputName);
  const compactInput = compactMaterialName(inputName);
  if (!normalizedInput) return null;

  for (const material of materials) {
    const candidateNorm = normalizeMaterialName(material.name);
    const candidateCompact = compactMaterialName(material.name);
    if (
      normalizedInput === candidateNorm ||
      compactInput === candidateCompact
    ) {
      return { material, certainty: "exact" };
    }
  }

  let best: { material: Material; score: number } | null = null;
  for (const material of materials) {
    const candidateCompact = compactMaterialName(material.name);
    const score = diceCoefficient(compactInput, candidateCompact);
    if (!best || score > best.score) {
      best = { material, score };
    }
  }

  if (
    best &&
    best.score >= 0.92 &&
    compactInput.length >= 6 &&
    compactMaterialName(best.material.name).length >= 6
  ) {
    return { material: best.material, certainty: "high" };
  }

  return null;
}

interface SubmitMaterialFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
  initialName?: string;
}

export function SubmitMaterialForm({
  onClose,
  onSubmitSuccess,
  initialName,
}: SubmitMaterialFormProps) {
  const [name, setName] = useState(initialName || "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Wikidata enrichment state ──────────────────────────────────────────────
  const [wikiSearching, setWikiSearching] = useState(false);
  const [wikiCandidates, setWikiCandidates] = useState<WikidataSearchResult[]>(
    [],
  );
  const [wikiSource, setWikiSource] = useState<{
    qid: string;
    label: string;
    sourceUrl: string;
  } | null>(null);
  const [wikiOffset, setWikiOffset] = useState(0);
  const [wikiSearched, setWikiSearched] = useState(false);

  // Duplicate detection state
  const [knownMaterials, setKnownMaterials] = useState<Material[]>([]);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);

  useEffect(() => {
    if (materialsLoaded) return;
    let active = true;
    const loadMaterials = async () => {
      try {
        const materials = await api.getAllMaterials();
        if (active) {
          setKnownMaterials(materials || []);
          setMaterialsLoaded(true);
        }
      } catch {
        if (active) {
          // Silent fallback: no duplicate warning if fetch fails
          setKnownMaterials([]);
          setMaterialsLoaded(true);
        }
      }
    };
    loadMaterials();
    return () => {
      active = false;
    };
  }, [materialsLoaded]);

  const duplicateMatch = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed || !materialsLoaded || knownMaterials.length === 0)
      return null;
    return findDuplicateCandidate(trimmed, knownMaterials);
  }, [name, knownMaterials, materialsLoaded]);

  const duplicateLink = useMemo(() => {
    if (!duplicateMatch) return null;
    return buildMaterialPermalinkPath(duplicateMatch.material);
  }, [duplicateMatch]);

  const handleWikiSearch = async (mode: "initial" | "more" = "initial") => {
    const query = name.trim();
    if (!query) {
      toast.error("Enter a material name first");
      return;
    }

    const nextOffset = mode === "more" ? wikiOffset + 5 : 0;
    setWikiSearching(true);
    setWikiCandidates([]);
    try {
      const [base, materialHinted] = await Promise.all([
        searchWikidataForMaterial(query, { limit: 8, offset: nextOffset }),
        searchWikidataForMaterial(`${query} material`, {
          limit: 8,
          offset: nextOffset,
        }),
      ]);

      const merged = [...base, ...materialHinted].filter(
        (item, idx, arr) => arr.findIndex((x) => x.qid === item.qid) === idx,
      );
      const ranked = rankCandidates(merged);

      setWikiOffset(nextOffset);
      setWikiSearched(true);
      if (ranked.length === 0) {
        toast.info("No Wikidata results found for this name");
      } else {
        setWikiCandidates(ranked.slice(0, 3));
      }
    } catch {
      toast.error("Wikidata search failed");
    } finally {
      setWikiSearching(false);
    }
  };

  const handleWikiSelect = async (candidate: WikidataSearchResult) => {
    setWikiCandidates([]);

    const suggestedCategory = guessCategoryFromCandidate(candidate);
    if (suggestedCategory && !category) {
      setCategory(suggestedCategory);
      toast.info(`Category auto-selected: ${suggestedCategory}`);
    }

    // If description already has user text, ask before replacing
    if (description.trim()) {
      const ok = window.confirm(
        `Replace your current description with the Wikipedia summary for "${candidate.label}"?`,
      );
      if (!ok) {
        // Still save the QID without touching description
        setWikiSource({
          qid: candidate.qid,
          label: candidate.label,
          sourceUrl: "",
        });
        return;
      }
    }

    try {
      const summary = await fetchWikipediaSummary(candidate.label);
      if (summary?.shortDescription) {
        setDescription(summary.shortDescription);
        setWikiSource({
          qid: candidate.qid,
          label: candidate.label,
          sourceUrl: summary.sourceUrl,
        });
      } else {
        // No summary text — still track the QID
        setWikiSource({
          qid: candidate.qid,
          label: candidate.label,
          sourceUrl: "",
        });
        toast.info(
          "Could not load a Wikipedia summary right now — QID linked, description unchanged",
        );
      }
    } catch {
      toast.error("Failed to fetch Wikipedia summary");
    }
  };

  const clearWikiSource = () => {
    setWikiSource(null);
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a material name");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    try {
      setSubmitting(true);

      await api.createSubmission({
        type: "new_material",
        content_data: {
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          // Default values for new submissions
          recyclability: 0,
          compostability: 0,
          reusability: 0,
          // Wikidata QID pre-seed (if curator confirmed a match)
          ...(wikiSource ? { wikidataQid: wikiSource.qid } : {}),
        },
      });

      toast.success(
        "Material submitted for review! You'll be notified when it's reviewed.",
      );
      onSubmitSuccess();
      onClose();
    } catch (error) {
      logger.error("Error submitting material:", error);
      toast.error("Failed to submit material");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 w-full max-w-md shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c] dark:border-white/20">
          <h3 className="normal">Submit New Material</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} className="normal" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-waste-recycle dark:bg-[#3a3825] border border-[#211f1c] dark:border-white/20 rounded-md p-3 mb-4">
            <p className="text-[11px] text-black dark:text-white leading-relaxed">
              💡{" "}
              <strong className="font-sans font-semibold">
                Material pages
              </strong>{" "}
              <span className="font-sniglet font-normal">
                describe the general properties and uses of a material, without
                judgments about the material or its sustainability — those
                should be submitted as articles linked to the material.
                Submissions are reviewed by our volunteer team before
                publishing. If your material already exists, consider suggesting
                edits to the existing page instead!
              </span>
            </p>
          </div>

          {/* Material Name + Wikipedia enrichment button */}
          <div>
            <Label htmlFor="material-name" className="text-[12px] normal">
              Material Name *
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="material-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setWikiOffset(0);
                  setWikiSearched(false);
                  if (wikiCandidates.length) setWikiCandidates([]);
                }}
                placeholder="e.g., Aluminum Can, Cotton T-Shirt"
                required
              />
              {/* Wikipedia enrichment trigger */}
              <button
                type="button"
                onClick={() => handleWikiSearch("initial")}
                disabled={wikiSearching || !name.trim()}
                title="Look up on Wikipedia / Wikidata"
                className="shrink-0 h-10 w-10 flex items-center justify-center rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-white dark:bg-[#2a2825] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {wikiSearching ? (
                  <Loader2
                    size={14}
                    className="animate-spin text-black/60 dark:text-white/60"
                  />
                ) : (
                  // Wikipedia "W" glyph — inline SVG avoids external logo assets
                  <svg
                    viewBox="0 0 122.88 108.21"
                    width="17"
                    height="17"
                    aria-label="Wikipedia"
                    className="fill-black/70 dark:fill-white/70"
                  >
                    <path d="M0 8.28h26.91v3.19h-7.9L40.55 69.3l14.7-36.48-8.37-20.97-6.73-.57V8.28h28.2v3.19l-7.9.57 21.35 57.48L95.65 26.4c1.33-3.61 2-6.65 2-9.13 0-4.18-2.13-6.27-6.4-6.27h-3.33V7.81h23.96v3.19l-3.71.47c-3.42.57-5.93 3.7-7.53 9.42L76.38 108.21h-3.71L54.28 55.08 35.4 108.21h-3.71L5.22 11.47H0V8.28z" />
                  </svg>
                )}
              </button>
              {wikiSearched && (
                <button
                  type="button"
                  onClick={() => handleWikiSearch("more")}
                  disabled={wikiSearching || !name.trim()}
                  title="Show different matches"
                  className="shrink-0 h-10 w-10 flex items-center justify-center rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-white dark:bg-[#2a2825] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    size={14}
                    className={wikiSearching ? "animate-spin" : ""}
                  />
                </button>
              )}
            </div>

            {/* Disambiguation card */}
            {wikiCandidates.length > 0 && (
              <div className="mt-2 rounded-md border border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#1f1e1c] overflow-hidden">
                <p className="px-3 py-1.5 text-[10px] text-black/50 dark:text-white/50 border-b border-[#211f1c]/10 dark:border-white/10">
                  Select the correct Wikidata entry:
                </p>
                {wikiCandidates.map((c) => (
                  <button
                    key={c.qid}
                    type="button"
                    onClick={() => handleWikiSelect(c)}
                    className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b last:border-b-0 border-[#211f1c]/10 dark:border-white/10"
                  >
                    <span className="block text-[12px] normal">{c.label}</span>
                    {c.description && (
                      <span className="block text-[10px] text-black/50 dark:text-white/50 mt-0.5">
                        {c.description}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWikiCandidates([])}
                  className="w-full px-3 py-1.5 text-[10px] text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors text-center"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="material-category" className="text-[12px] normal">
              Category *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="material-category" className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="material-description"
              className="text-[12px] normal"
            >
              Description (optional)
              {wikiSource && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">
                  <CheckCircle2 size={10} />
                  from Wikipedia
                  {wikiSource.sourceUrl && (
                    <a
                      href={wikiSource.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      ({wikiSource.label})
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={clearWikiSource}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    title="Clear wiki description"
                  >
                    <X size={9} />
                  </button>
                </span>
              )}
            </Label>
            <Textarea
              id="material-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // Detach attribution if curator manually edits wiki-filled text
                if (wikiSource) setWikiSource(null);
              }}
              placeholder="Add any relevant details about this material..."
              className="mt-1 min-h-20"
              rows={3}
            />
            <p className="mt-1 text-[10px] text-black/50 dark:text-white/50">
              Examples: composition, common uses, special properties, etc.
            </p>
          </div>

          {duplicateMatch && duplicateLink && (
            <div className="rounded-md border border-amber-700/30 bg-amber-100/60 dark:bg-amber-900/20 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100">
              Possible duplicate detected:{" "}
              <a
                href={duplicateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                {duplicateMatch.material.name}
              </a>
              . If this is the same material, use the existing page instead.
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
              className="flex-1 h-10 px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#c8e5c8] hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-[12px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
