Here is the first draft of the guides concept, which was really quickly thrown together - don't assume that we want to use these data structures - in fact, we likely do not. We also do not want to move away from the CSS framework we are using. This is just to get the idea across for discussion.

# data/guides.ts

```ts
/**
 * Guides Data
 * Educational resources for composting, recycling, art, and repair
 */

export type GuideCategory = "composting" | "recycling" | "art" | "repair";

export interface Guide {
  id: string;
  title: string;
  category: GuideCategory;
  description: string;
  author: string;
  lastUpdated: string;
  readTime: number; // minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  thumbnail?: string;
  content: GuideContent;
  downloads?: number;
  pdfUrl?: string;
  videoUrl?: string;
}

export interface GuideContent {
  overview: string;
  sections: GuideSection[];
  tips?: string[];
  commonMistakes?: string[];
  resources?: Resource[];
}

export interface GuideSection {
  title: string;
  content: string;
  steps?: string[];
  image?: string;
  warning?: string;
}

export interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "pdf" | "website";
}

// Example guides
export const guides: Guide[] = [
  {
    id: "paper-recycling-101",
    title: "Paper Recycling 101: A Complete Guide",
    category: "recycling",
    description:
      "Learn how to properly recycle paper products in most jurisdictions, including what's accepted, preparation steps, and common mistakes to avoid.",
    author: "WasteDB Team",
    lastUpdated: "2025-12-17",
    readTime: 8,
    difficulty: "beginner",
    thumbnail:
      "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&q=80",
    downloads: 0,
    content: {
      overview: `Paper recycling is one of the easiest and most impactful ways to reduce waste. In most jurisdictions, paper products make up 25-40% of household waste, and the majority can be recycled. This guide covers everything you need to know about recycling paper correctly, from identifying recyclable paper types to preparing them for your curbside bin.`,

      sections: [
        {
          title: "What Paper Can Be Recycled?",
          content:
            "Most clean, dry paper products are recyclable. The key is understanding which types are accepted in your local program.",
          steps: [
            "✅ **Office paper** - printer paper, notebook paper, letterhead",
            "✅ **Newspapers and magazines** - including glossy pages and inserts",
            "✅ **Cardboard boxes** - flattened (see separate cardboard guide for details)",
            "✅ **Paper bags** - shopping bags, lunch bags, and kraft paper",
            "✅ **Mail and envelopes** - including windowed envelopes (windows are OK)",
            "✅ **Junk mail** - catalogs, postcards, and flyers",
            "✅ **Wrapping paper** - plain paper only, not foil or plastic-coated",
            "✅ **Paperback books** - hardcover books require cover removal",
            "✅ **Phone books** - accepted in most programs",
            "✅ **Paper egg cartons** - clean and dry only",
          ],
        },
        {
          title: "What Paper CANNOT Be Recycled?",
          content:
            "These items contaminate recycling streams and should go in trash or compost (where applicable):",
          steps: [
            "❌ **Soiled paper** - greasy pizza boxes (bottom), food-stained napkins, paper towels",
            "❌ **Waxed paper** - includes most milk/juice cartons (check for plastic lining)",
            "❌ **Thermal paper** - receipts, some fax paper, lottery tickets",
            "❌ **Laminated paper** - ID badges, some business cards",
            "❌ **Tissue paper** - facial tissues, paper towels, napkins (compost instead)",
            "❌ **Metallic/foil wrapping paper** - contains non-paper materials",
            "❌ **Sticker paper** - labels with adhesive backing",
            "❌ **Carbon paper** - old-fashioned copy paper",
            "❌ **Photographs** - coated with chemicals",
            "❌ **Wallpaper** - contains adhesives and coatings",
          ],
          warning:
            "⚠️ When in doubt, check your local recycling guidelines. Rules vary by municipality and recycling facility capabilities.",
        },
        {
          title: "How to Prepare Paper for Recycling",
          content:
            "Proper preparation ensures your paper actually gets recycled and doesn't contaminate other materials.",
          steps: [
            "**1. Remove contaminants** - Take out plastic windows from envelopes, remove spiral bindings from notebooks, tear off tape from boxes",
            "**2. Keep it dry** - Wet paper clogs machinery. Store recyclables indoors or use covered bins",
            "**3. No bagging** - Place paper loose in your recycling bin, never in plastic bags",
            "**4. Flatten boxes** - Break down cardboard to save space and make processing easier",
            "**5. Don't shred** - Unless your facility specifically accepts it. Shredded paper is hard to sort",
            "**6. Small pieces matter** - Items smaller than a credit card often fall through sorting machinery",
          ],
        },
        {
          title: "The Paper Recycling Process",
          content:
            "Understanding what happens after collection helps you recycle better:",
          steps: [
            "**Collection** - Your curbside bin or drop-off is transported to a Materials Recovery Facility (MRF)",
            "**Sorting** - Paper is separated by grade (newsprint, office paper, cardboard) using screens and optical scanners",
            "**Baling** - Sorted paper is compressed into 1,000+ pound bales for transport",
            "**Pulping** - At the mill, paper is mixed with water and chemicals to break down fibers",
            "**Cleaning** - Inks, staples, and adhesives are removed through screening and centrifuging",
            "**De-inking** - Soaps and chemicals separate ink particles from fiber",
            "**Refining** - Fibers are beaten to make them bond better in new paper",
            "**New products** - Recycled pulp becomes newspaper, cardboard, tissue, or office paper",
          ],
        },
        {
          title: "Environmental Impact",
          content: "The benefits of paper recycling are significant:",
          steps: [
            "🌳 **Saves trees** - Recycling 1 ton of paper saves 17 trees",
            "💧 **Conserves water** - Uses 70% less water than making virgin paper",
            "⚡ **Reduces energy** - Requires 40% less energy than making new paper from trees",
            "🌍 **Cuts emissions** - Reduces greenhouse gas emissions by up to 74%",
            "🗑️ **Saves landfill space** - Paper takes 2-6 weeks to decompose but releases methane in landfills",
            "♻️ **Creates jobs** - Recycling creates 4x more jobs than landfilling",
          ],
        },
        {
          title: "Special Considerations",
          content: "Some paper items require extra attention:",
          steps: [
            "**Pizza boxes** - Clean tops can be recycled, greasy bottoms should be composted or trashed",
            "**Shredded paper** - Some facilities accept it in clear bags; others reject it entirely",
            "**Mixed materials** - Padded envelopes, spiral notebooks, and hardcover books need components separated",
            "**Confidential documents** - Use secure shredding services that recycle the output",
            "**Wet strength paper** - Paper plates/cups designed to hold liquids often can't be recycled",
          ],
        },
      ],

      tips: [
        "Set up a dedicated paper recycling bin in your home office to make it a habit",
        'Use the "scrunch test" - if paper springs back after crumpling, it may have plastic coating',
        "Contact your local waste management department for a specific list of accepted materials",
        "Reuse paper when possible before recycling - print on both sides, use as scratch paper",
        'Buy recycled paper products to support the market - look for "post-consumer recycled content"',
        "Paper can typically be recycled 5-7 times before fibers become too short",
        "Staples are OK! They're removed during the pulping process",
        "Window envelopes are accepted in most programs - the plastic window is filtered out",
      ],

      commonMistakes: [
        "**Wishcycling** - Putting non-recyclable items in the bin hoping they'll be recycled. This contaminates entire loads.",
        "**Bagging recyclables** - Plastic bags jam sorting equipment. Always empty loose into the bin.",
        "**Ignoring local rules** - Recycling capabilities vary. What's OK in one city might not be in another.",
        "**Mixing food waste** - Even a small amount of grease can make entire bales unsellable.",
        "**Over-shredding** - Tiny paper pieces can't be processed. Keep documents whole when possible.",
        "**Throwing out good items** - Many paper items that can't be recycled can be composted instead.",
      ],

      resources: [
        {
          title: "Earth911 Recycling Search",
          url: "https://earth911.com/recycling-center-search-guides/",
          type: "website",
        },
        {
          title: "EPA Paper Recycling Guide",
          url: "https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables",
          type: "article",
        },
        {
          title: "How Paper Recycling Works (Video)",
          url: "https://www.youtube.com/watch?v=example",
          type: "video",
        },
      ],
    },
  },
];

// Helper functions
export function getGuidesByCategory(category: GuideCategory): Guide[] {
  return guides.filter((g) => g.category === category);
}

export function getGuideById(id: string): Guide | undefined {
  return guides.find((g) => g.id === id);
}

export function getAllCategories(): GuideCategory[] {
  return ["composting", "recycling", "art", "repair"];
}

export function getCategoryDisplayName(category: GuideCategory): string {
  const names: Record<GuideCategory, string> = {
    composting: "Composting",
    recycling: "Recycling",
    art: "Creative Reuse & Art",
    repair: "Repair & Maintenance",
  };
  return names[category];
}

export function getCategoryIcon(category: GuideCategory): string {
  const icons: Record<GuideCategory, string> = {
    composting: "🌱",
    recycling: "♻️",
    art: "🎨",
    repair: "🔧",
  };
  return icons[category];
}

export function getCategoryColor(category: GuideCategory): string {
  const colors: Record<GuideCategory, string> = {
    composting: "#c8e5c8",
    recycling: "#a8c5d8",
    art: "#f0e68c",
    repair: "#e8a593",
  };
  return colors[category];
}
```

# components/views/GuidesView.tsx

```tsx
import { motion } from "motion/react";
import {
  Book,
  Clock,
  TrendingUp,
  FileText,
  Video,
  Download,
} from "lucide-react";
import {
  guides,
  getAllCategories,
  getCategoryDisplayName,
  getCategoryIcon,
  getCategoryColor,
  getGuidesByCategory,
  type GuideCategory,
  type Guide,
} from "../../data/guides";
import { useState } from "react";

interface GuidesViewProps {
  onViewGuide: (guideId: string) => void;
  initialCategory?: GuideCategory;
}

export function GuidesView({ onViewGuide, initialCategory }: GuidesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    GuideCategory | "all"
  >(initialCategory || "all");

  const categories = getAllCategories();
  const filteredGuides =
    selectedCategory === "all" ? guides : getGuidesByCategory(selectedCategory);

  const getDifficultyColor = (difficulty: Guide["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-[#c8e5c8] text-black";
      case "intermediate":
        return "bg-[#f0e68c] text-black";
      case "advanced":
        return "bg-[#e8a593] text-black";
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-['Fredoka_One',_sans-serif] text-[32px] text-black dark:text-white mb-2">
          Learning Guides
        </h1>
        <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/60 dark:text-white/60 max-w-2xl mx-auto">
          Practical guides to help you compost, recycle, create, and repair
          sustainably
        </p>
      </motion.div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                     font-['Sniglet:Regular',_sans-serif] text-[14px] transition-all
                     hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                     ${
                       selectedCategory === "all"
                         ? "bg-[#b8c8cb] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]"
                         : "bg-white dark:bg-[#2a2825]"
                     }`}
        >
          <span className="text-black dark:text-white">All Guides</span>
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                       font-['Sniglet:Regular',_sans-serif] text-[14px] transition-all
                       hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                       ${
                         selectedCategory === category
                           ? "shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]"
                           : ""
                       }`}
            style={{
              backgroundColor:
                selectedCategory === category
                  ? getCategoryColor(category)
                  : undefined,
            }}
          >
            <span className="text-black dark:text-white">
              {getCategoryIcon(category)} {getCategoryDisplayName(category)}
            </span>
          </button>
        ))}
      </div>

      {/* Guides Grid */}
      {filteredGuides.length === 0 ? (
        <div className="text-center py-12">
          <Book
            size={48}
            className="mx-auto mb-4 text-black/20 dark:text-white/20"
          />
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/40 dark:text-white/40">
            No guides available in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide, index) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onViewGuide(guide.id)}
              className="bg-white dark:bg-[#2a2825] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                         overflow-hidden cursor-pointer transition-all
                         hover:shadow-[5px_6px_0px_-1px_#000000] dark:hover:shadow-[5px_6px_0px_-1px_rgba(255,255,255,0.2)]
                         hover:translate-y-[-2px]"
            >
              {/* Thumbnail */}
              {guide.thumbnail && (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${guide.thumbnail})` }}
                />
              )}

              {/* Content */}
              <div className="p-4">
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-1 rounded-md text-[10px] font-['Sniglet:Regular',_sans-serif]"
                    style={{
                      backgroundColor: getCategoryColor(guide.category),
                    }}
                  >
                    {getCategoryIcon(guide.category)}{" "}
                    {getCategoryDisplayName(guide.category)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-['Sniglet:Regular',_sans-serif] ${getDifficultyColor(
                      guide.difficulty
                    )}`}
                  >
                    {guide.difficulty}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-2">
                  {guide.title}
                </h3>

                {/* Description */}
                <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60 mb-3 line-clamp-2">
                  {guide.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-[11px] text-black/50 dark:text-white/50 font-['Sniglet:Regular',_sans-serif]">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{guide.readTime} min</span>
                  </div>

                  {guide.downloads !== undefined && guide.downloads > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      <span>{guide.downloads} downloads</span>
                    </div>
                  )}

                  {guide.pdfUrl && (
                    <div className="flex items-center gap-1">
                      <FileText size={12} />
                      <span>PDF</span>
                    </div>
                  )}

                  {guide.videoUrl && (
                    <div className="flex items-center gap-1">
                      <Video size={12} />
                      <span>Video</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-6 bg-[#e4e3ac] dark:bg-[#2a2825] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 text-center"
      >
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-2">
          Want to contribute?
        </h3>
        <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60 mb-4">
          Have expertise to share? We're always looking for new guides on
          sustainable practices.
        </p>
        <button
          className="px-4 py-2 bg-[#b8c8cb] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                         shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                         hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)]
                         transition-all font-['Sniglet:Regular',_sans-serif] text-[14px] text-black"
        >
          Contact Us
        </button>
      </motion.div>
    </div>
  );
}
```

# components/views/GuideDetailView.tsx

```tsx
import { motion } from "motion/react";
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Download,
  Video,
  Share2,
  Printer,
  Bookmark,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getGuideById,
  getCategoryIcon,
  getCategoryColor,
  getCategoryDisplayName,
} from "../../data/guides";
import { toast } from "sonner";

interface GuideDetailViewProps {
  guideId: string;
  onBack: () => void;
}

export function GuideDetailView({ guideId, onBack }: GuideDetailViewProps) {
  const guide = getGuideById(guideId);

  if (!guide) {
    return (
      <div className="p-6 text-center">
        <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white mb-4">
          Guide not found
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#b8c8cb] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                     shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                     hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)]
                     transition-all font-['Sniglet:Regular',_sans-serif] text-[14px] text-black"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    if (guide.pdfUrl) {
      window.open(guide.pdfUrl, "_blank");
      toast.success("Opening PDF...");
    } else {
      toast.info("PDF download coming soon!");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?guide=${guide.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: guide.title,
          text: guide.description,
          url,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success("Opening print dialog...");
  };

  const handleBookmark = () => {
    // In a real implementation, this would save to localStorage or user preferences
    toast.success("Bookmarked! (Feature coming soon)");
  };

  const getDifficultyColor = (difficulty: typeof guide.difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "bg-[#c8e5c8] text-black";
      case "intermediate":
        return "bg-[#f0e68c] text-black";
      case "advanced":
        return "bg-[#e8a593] text-black";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto print:p-0">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8c8cb] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                     shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                     hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)]
                     transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
          <span className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black">
            Back to Guides
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            className="p-2 bg-white dark:bg-[#2a2825] rounded-[8px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                       hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]
                       transition-all"
            title="Bookmark this guide"
          >
            <Bookmark size={16} className="text-black dark:text-white" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 bg-white dark:bg-[#2a2825] rounded-[8px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                       hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]
                       transition-all"
            title="Share this guide"
          >
            <Share2 size={16} className="text-black dark:text-white" />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 bg-white dark:bg-[#2a2825] rounded-[8px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                       hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]
                       transition-all"
            title="Print this guide"
          >
            <Printer size={16} className="text-black dark:text-white" />
          </button>

          {guide.pdfUrl && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#e8a593] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                         shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                         hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)]
                         transition-all"
            >
              <Download size={16} className="text-black" />
              <span className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black">
                Download PDF
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Image */}
      {guide.thumbnail && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[11.46px] overflow-hidden border-[1.5px] border-[#211f1c] dark:border-white/20 mb-6 print:hidden"
        >
          <img
            src={guide.thumbnail}
            alt={guide.title}
            className="w-full h-64 object-cover"
          />
        </motion.div>
      )}

      {/* Title & Meta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-3 py-1 rounded-md font-['Sniglet:Regular',_sans-serif] text-[12px]"
            style={{ backgroundColor: getCategoryColor(guide.category) }}
          >
            {getCategoryIcon(guide.category)}{" "}
            {getCategoryDisplayName(guide.category)}
          </span>
          <span
            className={`px-3 py-1 rounded-md font-['Sniglet:Regular',_sans-serif] text-[12px] ${getDifficultyColor(
              guide.difficulty
            )}`}
          >
            {guide.difficulty}
          </span>
        </div>

        <h1 className="font-['Fredoka_One',_sans-serif] text-[28px] md:text-[36px] text-black dark:text-white mb-3">
          {guide.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-[12px] text-black/60 dark:text-white/60 font-['Sniglet:Regular',_sans-serif]">
          <div className="flex items-center gap-1">
            <User size={14} />
            <span>{guide.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>
              Updated {new Date(guide.lastUpdated).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{guide.readTime} min read</span>
          </div>
        </div>
      </motion.div>

      {/* Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 bg-[#e4e3ac]/30 dark:bg-[#2a2825]/50 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 mb-8"
      >
        <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white leading-relaxed">
          {guide.content.overview}
        </p>
      </motion.div>

      {/* Video (if available) */}
      {guide.videoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 print:hidden"
        >
          <div className="flex items-center gap-2 mb-3">
            <Video size={20} className="text-black dark:text-white" />
            <h2 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
              Video Tutorial
            </h2>
          </div>
          <div className="rounded-[11.46px] overflow-hidden border-[1.5px] border-[#211f1c] dark:border-white/20 aspect-video bg-black/10">
            <iframe
              src={guide.videoUrl}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </motion.div>
      )}

      {/* Sections */}
      {guide.content.sections.map((section, index) => (
        <motion.section
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * (index + 3) }}
          className="mb-8"
        >
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-4">
            {section.title}
          </h2>

          {section.content && (
            <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/80 dark:text-white/80 mb-4 leading-relaxed">
              {section.content}
            </p>
          )}

          {section.warning && (
            <div className="p-4 bg-[#e8a593]/30 dark:bg-[#2a2825]/50 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 mb-4 flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-black dark:text-white shrink-0 mt-0.5"
              />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                {section.warning}
              </p>
            </div>
          )}

          {section.steps && (
            <ul className="space-y-3 ml-4">
              {section.steps.map((step, stepIndex) => {
                const isCheckmark = step.startsWith("✅");
                const isCross = step.startsWith("❌");
                const cleanStep = step.replace(/^[✅❌]\s*/, "");

                return (
                  <li
                    key={stepIndex}
                    className="flex items-start gap-3 font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 dark:text-white/80"
                  >
                    {isCheckmark && (
                      <CheckCircle
                        size={16}
                        className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                      />
                    )}
                    {isCross && (
                      <XCircle
                        size={16}
                        className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                      />
                    )}
                    {!isCheckmark && !isCross && (
                      <span className="text-black/40 dark:text-white/40 shrink-0">
                        •
                      </span>
                    )}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: cleanStep.replace(
                          /\*\*(.*?)\*\*/g,
                          "<strong>$1</strong>"
                        ),
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {section.image && (
            <img
              src={section.image}
              alt={section.title}
              className="mt-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 w-full"
            />
          )}
        </motion.section>
      ))}

      {/* Tips */}
      {guide.content.tips && guide.content.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-[#c8e5c8]/30 dark:bg-[#2a2825]/50 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-black dark:text-white" />
            <h2 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
              Pro Tips
            </h2>
          </div>
          <ul className="space-y-2">
            {guide.content.tips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-3 font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 dark:text-white/80"
              >
                <span className="text-black/40 dark:text-white/40">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Common Mistakes */}
      {guide.content.commonMistakes &&
        guide.content.commonMistakes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 bg-[#e8a593]/30 dark:bg-[#2a2825]/50 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-black dark:text-white" />
              <h2 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
                Common Mistakes to Avoid
              </h2>
            </div>
            <ul className="space-y-3">
              {guide.content.commonMistakes.map((mistake, index) => {
                const parts = mistake.split(" - ");
                const title = parts[0].replace(/^\*\*|\*\*$/g, "");
                const description = parts[1];

                return (
                  <li
                    key={index}
                    className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 dark:text-white/80"
                  >
                    <strong className="text-black dark:text-white">
                      {title}
                    </strong>
                    {description && ` - ${description}`}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}

      {/* Resources */}
      {guide.content.resources && guide.content.resources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-4">
            Additional Resources
          </h2>
          <div className="space-y-3">
            {guide.content.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white dark:bg-[#2a2825] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                           hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                           transition-all group"
              >
                <ExternalLink
                  size={16}
                  className="text-black dark:text-white"
                />
                <div className="flex-1">
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white group-hover:underline">
                    {resource.title}
                  </p>
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 dark:text-white/50">
                    {resource.type}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="p-6 bg-[#e4e3ac] dark:bg-[#2a2825] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 text-center print:hidden"
      >
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-2">
          Was this guide helpful?
        </h3>
        <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60 mb-4">
          Share it with others or explore more guides to continue your
          sustainable journey.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-[#b8c8cb] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                       shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                       hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)]
                       transition-all font-['Sniglet:Regular',_sans-serif] text-[14px] text-black"
          >
            Share Guide
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#c8e5c8] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 
                       shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]
                       hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)]
                       transition-all font-['Sniglet:Regular',_sans-serif] text-[14px] text-black"
          >
            More Guides
          </button>
        </div>
      </motion.div>
    </div>
  );
}
```
