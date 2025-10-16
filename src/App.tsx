import { useState, useEffect } from 'react';
import svgPaths from "./imports/svg-qhqftidoeu";
import { Plus, Edit2, Trash2, Search, ArrowLeft, Upload, Image as ImageIcon, ChevronDown, Copy, Check } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './components/ui/collapsible';
import { RadialBarChart, RadialBar, ResponsiveContainer, Legend, Tooltip, PolarAngleAxis, Cell, Text } from 'recharts';

interface ArticleSection {
  image?: string; // base64 encoded image
  content: string;
}

interface Article {
  id: string;
  title: string;
  category: 'DIY' | 'Industrial' | 'Experimental';
  overview: {
    image?: string;
  };
  introduction: ArticleSection;
  supplies: ArticleSection;
  step1: ArticleSection;
  dateAdded: string;
}

interface Material {
  id: string;
  name: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  articles: {
    compostability: Article[];
    recyclability: Article[];
    reusability: Article[];
  };
}

type CategoryType = 'compostability' | 'recyclability' | 'reusability';

function RetroButtons({ title }: { title: string }) {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center px-[7px] py-[2px] relative size-full">
          <div className="relative shrink-0 size-[12px]">
            <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(230, 188, 181, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <circle cx="7" cy="7" fill="var(--fill-0, #E6BCB5)" r="6.5" stroke="var(--stroke-0, #211F1C)" />
              </svg>
            </div>
          </div>
          <div className="relative shrink-0 size-[12px]">
            <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(228, 227, 172, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <circle cx="7" cy="7" fill="var(--fill-0, #E4E3AC)" r="6.5" stroke="var(--stroke-0, #211F1C)" />
              </svg>
            </div>
          </div>
          <div className="relative shrink-0 size-[12px]">
            <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(184, 200, 203, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <circle cx="7" cy="7" fill="var(--fill-0, #B8C8CB)" r="6.5" stroke="var(--stroke-0, #211F1C)" />
              </svg>
            </div>
          </div>
          <p className="basis-0 font-['Sniglet:Regular',_sans-serif] grow leading-[25px] min-h-px min-w-px not-italic relative shrink-0 text-[20px] text-black text-center uppercase">{title}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ title }: { title: string }) {
  return (
    <div className="h-[42px] min-w-[400px] relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#211f1c] border-[0px_0px_1.5px] border-solid inset-0 pointer-events-none" />
      <div className="min-w-inherit size-full">
        <div className="box-border content-stretch flex h-[42px] items-start justify-between min-w-inherit px-[5px] py-0 relative w-full">
          <RetroButtons title={title} />
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <div className="h-[16px] relative shrink-0 w-[18px]">
      <div className="absolute inset-[-3.11%_-4.26%_-1.44%_-2.92%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 18">
          <g>
            <path d={svgPaths.p3623ed00} fill="var(--stroke-0, #211F1C)" />
            <path d={svgPaths.p3c786300} fill="var(--stroke-0, #211F1C)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative rounded-[11.46px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#211f1c] border-[1.5px] border-solid inset-[-0.75px] pointer-events-none rounded-[12.21px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[15px] items-center justify-start px-[12px] py-[8px] relative w-full">
          <SearchIcon />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search materials..."
            className="font-['Sniglet:Regular',_sans-serif] bg-transparent border-none outline-none text-[15px] text-black placeholder:text-black/50 flex-1"
          />
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ 
  score, 
  label, 
  color, 
  articleCount,
  onClick 
}: { 
  score: number; 
  label: string; 
  color: string; 
  articleCount?: number;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <button
          onClick={onClick}
          className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black hover:underline cursor-pointer text-left flex items-center gap-1"
        >
          <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black">{label}</span>
          {articleCount !== undefined && articleCount > 0 && (
            <span className="font-['Sniglet:Regular',_sans-serif] text-[9px] text-black/60">({articleCount})</span>
          )}
        </button>
        <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black">{score}</span>
      </div>
      <div className="h-[8px] bg-[#211f1c]/10 rounded-full overflow-hidden border border-[#211f1c]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Custom label component for clickable chart labels
const ClickableChartLabel = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, value, name, categoryKey, onLabelClick } = props;
  
  // Calculate the middle of the radial bar
  const radius = innerRadius + (outerRadius - innerRadius) * 0.3; // Position closer to inner edge
  const angle = startAngle + (endAngle - startAngle) / 2;
  const angleInRadians = (Math.PI / 180) * -angle;
  
  const x = cx + radius * Math.cos(angleInRadians);
  const y = cy + radius * Math.sin(angleInRadians);
  
  return (
    <text
      x={x}
      y={y}
      fill="#211f1c"
      fontFamily="Sniglet:Regular, sans-serif"
      fontSize="13px"
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onLabelClick && categoryKey) {
          onLabelClick(categoryKey);
        }
      }}
    >
      {value}% {name}
    </text>
  );
};

function MaterialCard({ 
  material, 
  onEdit, 
  onDelete,
  onViewArticles 
}: { 
  material: Material; 
  onEdit: () => void; 
  onDelete: () => void;
  onViewArticles: (category: CategoryType) => void;
}) {
  return (
    <div className="bg-white relative rounded-[11.464px] p-4 shadow-[3px_4px_0px_-1px_#000000] border-[1.5px] border-[#211f1c]">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black flex-1">{material.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-[#e6beb5] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {material.description && (
        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 mb-3 line-clamp-2">{material.description}</p>
      )}
      
      <div className="flex flex-col gap-2">
        <ScoreBar 
          score={material.compostability} 
          label="Compostability" 
          color="#e6beb5" 
          articleCount={material.articles.compostability.length}
          onClick={() => onViewArticles('compostability')}
        />
        <ScoreBar 
          score={material.recyclability} 
          label="Recyclability" 
          color="#e4e3ac" 
          articleCount={material.articles.recyclability.length}
          onClick={() => onViewArticles('recyclability')}
        />
        <ScoreBar 
          score={material.reusability} 
          label="Reusability" 
          color="#b8c8cb" 
          articleCount={material.articles.reusability.length}
          onClick={() => onViewArticles('reusability')}
        />
      </div>
    </div>
  );
}

function MaterialForm({ material, onSave, onCancel }: { material?: Material; onSave: (material: Omit<Material, 'id'>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    compostability: material?.compostability || 0,
    recyclability: material?.recyclability || 0,
    reusability: material?.reusability || 0,
    description: material?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      articles: material?.articles || {
        compostability: [],
        recyclability: [],
        reusability: []
      }
    });
  };

  return (
    <div className="bg-white relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Material Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          />
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Description (optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
          />
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
            Compostability: {formData.compostability}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.compostability}
            onChange={(e) => setFormData({ ...formData, compostability: Number(e.target.value) })}
            className="w-full h-2 bg-[#e6beb5] rounded-full outline-none slider"
          />
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
            Recyclability: {formData.recyclability}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.recyclability}
            onChange={(e) => setFormData({ ...formData, recyclability: Number(e.target.value) })}
            className="w-full h-2 bg-[#e4e3ac] rounded-full outline-none slider"
          />
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
            Reusability: {formData.reusability}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.reusability}
            onChange={(e) => setFormData({ ...formData, reusability: Number(e.target.value) })}
            className="w-full h-2 bg-[#b8c8cb] rounded-full outline-none slider"
          />
        </div>

        <div className="flex gap-3 mt-2 justify-center">
          <button
            type="submit"
            className="bg-[#e4e3ac] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {material ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#e6beb5] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ImageUploadArea({ 
  image, 
  onImageChange,
  label 
}: { 
  image?: string; 
  onImageChange: (image: string | undefined) => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">{label}</label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-[1.5px] border-dashed rounded-[8px] p-4 transition-all ${
          isDragging 
            ? 'border-[#211f1c] bg-[#211f1c]/5' 
            : 'border-[#211f1c]/30 bg-white'
        }`}
      >
        {image ? (
          <div className="relative">
            <img 
              src={image} 
              alt="Preview" 
              className="w-full h-auto rounded-[4px] border border-[#211f1c]"
            />
            <button
              type="button"
              onClick={() => onImageChange(undefined)}
              className="absolute top-2 right-2 bg-[#e6beb5] px-3 py-1 rounded-md border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] font-['Sniglet:Regular',_sans-serif] text-[11px] text-black hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-row items-center justify-center gap-2 py-3">
            <ImageIcon size={18} className="text-black/40" />
            <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60">
              Drop image here or click to upload
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ 
  article, 
  onEdit, 
  onDelete,
  hideActions = false
}: { 
  article: Article; 
  onEdit: () => void; 
  onDelete: () => void;
  hideActions?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const permalink = `${window.location.origin}${window.location.pathname}?article=${article.id}`;

  const copyPermalink = () => {
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if this article should be opened from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId === article.id) {
      setIsOpen(true);
      // Clear the URL parameter after opening
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [article.id]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-white relative rounded-[11.464px] p-4 shadow-[3px_4px_0px_-1px_#000000] border-[1.5px] border-[#211f1c]">
        <div className="flex justify-between items-start mb-3">
          <CollapsibleTrigger className="flex-1 text-left group">
            <div className="flex items-center gap-2">
              <h4 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black group-hover:underline">
                {article.title}
              </h4>
              <ChevronDown 
                size={16} 
                className={`text-black/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
            <span className="inline-block mt-1 px-2 py-0.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
              {article.category}
            </span>
          </CollapsibleTrigger>
          {!hideActions && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="p-1.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 bg-[#e6beb5] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
        
        {!isOpen && (
          <>
            {article.overview.image && (
              <img 
                src={article.overview.image} 
                alt={article.title}
                className="w-full h-32 object-cover rounded-[4px] border border-[#211f1c] mb-2"
              />
            )}
            
            <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 mb-2 line-clamp-2">
              {article.introduction.content.substring(0, 100)}...
            </p>
            
            <p className="font-['Sniglet:Regular',_sans-serif] text-[9px] text-black/50">
              Added: {new Date(article.dateAdded).toLocaleDateString()}
            </p>
          </>
        )}

        <CollapsibleContent>
          <div className="mt-4 space-y-4">
            {/* Overview Section */}
            <div>
              <h5 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black mb-2">Overview</h5>
              {article.overview.image && (
                <img 
                  src={article.overview.image} 
                  alt="Overview"
                  className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-2"
                />
              )}
            </div>

            {/* Introduction Section */}
            <div>
              <h5 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black mb-2">Introduction</h5>
              {article.introduction.image && (
                <img 
                  src={article.introduction.image} 
                  alt="Introduction"
                  className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-2"
                />
              )}
              <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 whitespace-pre-wrap">
                {article.introduction.content}
              </p>
            </div>

            {/* Supplies Section */}
            <div>
              <h5 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black mb-2">Supplies</h5>
              {article.supplies.image && (
                <img 
                  src={article.supplies.image} 
                  alt="Supplies"
                  className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-2"
                />
              )}
              <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 whitespace-pre-wrap">
                {article.supplies.content}
              </p>
            </div>

            {/* Step 1 Section */}
            <div>
              <h5 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black mb-2">Step 1</h5>
              {article.step1.image && (
                <img 
                  src={article.step1.image} 
                  alt="Step 1"
                  className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-2"
                />
              )}
              <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 whitespace-pre-wrap">
                {article.step1.content}
              </p>
            </div>

            <div className="pt-2 border-t border-[#211f1c]/20 space-y-1">
              <p className="font-['Sniglet:Regular',_sans-serif] text-[9px] text-black/50">
                Added: {new Date(article.dateAdded).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                <p className="font-['Sniglet:Regular',_sans-serif] text-[9px] text-black/50 truncate flex-1">
                  Permalink: {permalink}
                </p>
                <button
                  onClick={copyPermalink}
                  className="p-1 bg-[#e4e3ac] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all shrink-0"
                  title="Copy permalink"
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ArticleForm({ 
  article, 
  onSave, 
  onCancel 
}: { 
  article?: Article; 
  onSave: (article: Omit<Article, 'id' | 'dateAdded'>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    category: article?.category || 'DIY' as 'DIY' | 'Industrial' | 'Experimental',
    overview: {
      image: article?.overview.image || undefined,
    },
    introduction: {
      image: article?.introduction.image || undefined,
      content: article?.introduction.content || '',
    },
    supplies: {
      image: article?.supplies.image || undefined,
      content: article?.supplies.content || '',
    },
    step1: {
      image: article?.step1.image || undefined,
      content: article?.step1.content || '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Overview Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ImageUploadArea
                image={formData.overview.image}
                onImageChange={(img) => setFormData({
                  ...formData,
                  overview: { ...formData.overview, image: img }
                })}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
                />
              </div>
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'DIY' | 'Industrial' | 'Experimental' })}
                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
                >
                  <option value="DIY">DIY</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Experimental">Experimental</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Introduction</h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.introduction.image}
              onImageChange={(img) => setFormData({
                ...formData,
                introduction: { ...formData.introduction, image: img }
              })}
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Content</label>
              <textarea
                value={formData.introduction.content}
                onChange={(e) => setFormData({
                  ...formData,
                  introduction: { ...formData.introduction, content: e.target.value }
                })}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="Describe what this guide is about..."
              />
            </div>
          </div>
        </div>

        {/* Supplies Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Supplies</h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.supplies.image}
              onImageChange={(img) => setFormData({
                ...formData,
                supplies: { ...formData.supplies, image: img }
              })}
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Content</label>
              <textarea
                value={formData.supplies.content}
                onChange={(e) => setFormData({
                  ...formData,
                  supplies: { ...formData.supplies, content: e.target.value }
                })}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="List the supplies needed..."
              />
            </div>
          </div>
        </div>

        {/* Step 1 Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Step 1</h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.step1.image}
              onImageChange={(img) => setFormData({
                ...formData,
                step1: { ...formData.step1, image: img }
              })}
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Content</label>
              <textarea
                value={formData.step1.content}
                onChange={(e) => setFormData({
                  ...formData,
                  step1: { ...formData.step1, content: e.target.value }
                })}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="Describe the first step..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            type="submit"
            className="bg-[#e4e3ac] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {article ? 'Update' : 'Add Article'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#e6beb5] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ArticlesView({ 
  material, 
  category, 
  onBack,
  onUpdateMaterial
}: { 
  material: Material; 
  category: CategoryType;
  onBack: () => void;
  onUpdateMaterial: (material: Material) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const categoryColors = {
    compostability: '#e6beb5',
    recyclability: '#e4e3ac',
    reusability: '#b8c8cb',
  };

  const categoryLabels = {
    compostability: 'Compostability',
    recyclability: 'Recyclability',
    reusability: 'Reusability',
  };

  const articles = material.articles[category];

  const handleAddArticle = (articleData: Omit<Article, 'id' | 'dateAdded'>) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
    };
    
    const updatedMaterial = {
      ...material,
      articles: {
        ...material.articles,
        [category]: [...material.articles[category], newArticle]
      }
    };
    
    onUpdateMaterial(updatedMaterial);
    setShowForm(false);
  };

  const handleUpdateArticle = (articleData: Omit<Article, 'id' | 'dateAdded'>) => {
    if (!editingArticle) return;
    
    const updatedArticles = material.articles[category].map(a => 
      a.id === editingArticle.id 
        ? { ...articleData, id: a.id, dateAdded: a.dateAdded } 
        : a
    );
    
    const updatedMaterial = {
      ...material,
      articles: {
        ...material.articles,
        [category]: updatedArticles
      }
    };
    
    onUpdateMaterial(updatedMaterial);
    setEditingArticle(null);
    setShowForm(false);
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updatedMaterial = {
        ...material,
        articles: {
          ...material.articles,
          [category]: material.articles[category].filter(a => a.id !== id)
        }
      };
      
      onUpdateMaterial(updatedMaterial);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black">
            {material.name} - {categoryLabels[category]}
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingArticle(null);
          }}
          className="bg-[#b8c8cb] h-[40px] px-6 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all flex items-center gap-2"
          style={{ backgroundColor: categoryColors[category] }}
        >
          <Plus size={16} />
          Add Article
        </button>
      </div>

      {showForm && (
        <ArticleForm
          article={editingArticle || undefined}
          onSave={editingArticle ? handleUpdateArticle : handleAddArticle}
          onCancel={() => {
            setShowForm(false);
            setEditingArticle(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onEdit={() => {
              setEditingArticle(article);
              setShowForm(true);
            }}
            onDelete={() => handleDeleteArticle(article.id)}
          />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50">
            No articles yet. Add your first one!
          </p>
        </div>
      )}
    </div>
  );
}

function AllArticlesView({ 
  category, 
  materials, 
  onBack 
}: { 
  category: CategoryType; 
  materials: Material[]; 
  onBack: () => void;
}) {
  const categoryLabels = {
    compostability: 'Compost',
    recyclability: 'Recycling',
    reusability: 'Reuse'
  };

  // Collect all articles for this category across all materials
  const articlesWithMaterial = materials.flatMap(material => {
    const categoryArticles = material.articles?.[category];
    if (!categoryArticles || !Array.isArray(categoryArticles)) return [];
    return categoryArticles.map(article => ({
      article,
      material
    }));
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black">
            All {categoryLabels[category]} Articles
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60">
            {articlesWithMaterial.length} article{articlesWithMaterial.length !== 1 ? 's' : ''} across all materials
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articlesWithMaterial.map(({ article, material }) => (
          <div key={`${material.id}-${article.id}`} className="relative">
            <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-md border border-[#211f1c] z-10">
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black">
                {material.name}
              </p>
            </div>
            <ArticleCard
              article={article}
              onEdit={() => {}}
              onDelete={() => {}}
              hideActions
            />
          </div>
        ))}
      </div>

      {articlesWithMaterial.length === 0 && (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50">
            No {categoryLabels[category].toLowerCase()} articles yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentView, setCurrentView] = useState<{ type: 'materials' } | { type: 'articles'; materialId: string; category: CategoryType } | { type: 'all-articles'; category: CategoryType }>({ type: 'materials' });
  const [articleToOpen, setArticleToOpen] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('materials');
    if (stored) {
      try {
        const parsedMaterials = JSON.parse(stored);
        // Ensure all materials have articles structure
        const materialsWithArticles = parsedMaterials.map((m: any) => ({
          ...m,
          articles: m.articles || {
            compostability: [],
            recyclability: [],
            reusability: []
          }
        }));
        setMaterials(materialsWithArticles);
      } catch (e) {
        console.error('Error parsing stored materials:', e);
        initializeSampleData();
      }
    } else {
      initializeSampleData();
    }

    // Check for article permalink in URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId) {
      setArticleToOpen(articleId);
    }
  }, []);

  // Navigate to article when articleToOpen is set and materials are loaded
  useEffect(() => {
    if (articleToOpen && materials.length > 0) {
      // Find the article in all materials
      for (const material of materials) {
        for (const category of ['compostability', 'recyclability', 'reusability'] as CategoryType[]) {
          const article = material.articles[category].find(a => a.id === articleToOpen);
          if (article) {
            setCurrentView({ type: 'articles', materialId: material.id, category });
            setArticleToOpen(null);
            return;
          }
        }
      }
    }
  }, [articleToOpen, materials]);

  const initializeSampleData = () => {
    const sampleMaterials: Material[] = [
      {
        id: '1',
        name: 'Cardboard',
        compostability: 85,
        recyclability: 95,
        reusability: 70,
        description: 'Made from thick paper stock or heavy paper-pulp. Widely used for packaging.',
        articles: {
          compostability: [
            {
              id: '1a',
              title: 'Composting Cardboard at Home',
              category: 'DIY',
              overview: {},
              introduction: {
                content: 'Cardboard breaks down easily in compost bins. Remove any tape or labels, shred into smaller pieces, and layer with green materials for best results.',
              },
              supplies: {
                content: '• Cardboard boxes\n• Scissors or shredder\n• Compost bin\n• Brown and green materials',
              },
              step1: {
                content: 'Remove all tape, labels, and any non-cardboard materials from your boxes. Flatten the boxes to make them easier to work with.',
              },
              dateAdded: new Date().toISOString(),
            }
          ],
          recyclability: [],
          reusability: []
        }
      },
      {
        id: '2',
        name: 'Glass',
        compostability: 0,
        recyclability: 100,
        reusability: 95,
        description: 'Infinitely recyclable without loss of quality. Excellent for reuse.',
        articles: {
          compostability: [],
          recyclability: [
            {
              id: '2a',
              title: 'Glass Recycling Process',
              category: 'Industrial',
              overview: {},
              introduction: {
                content: 'Glass can be recycled endlessly without loss in quality or purity. It saves raw materials and reduces energy consumption.',
              },
              supplies: {
                content: '• Clean glass containers\n• Recycling bin\n• Access to recycling facility',
              },
              step1: {
                content: 'Rinse all glass containers thoroughly to remove any food residue. Remove lids and caps as they are often made of different materials.',
              },
              dateAdded: new Date().toISOString(),
            }
          ],
          reusability: []
        }
      },
      {
        id: '3',
        name: 'Plastic (PET)',
        compostability: 0,
        recyclability: 75,
        reusability: 60,
        description: 'Common plastic type used in bottles and containers.',
        articles: {
          compostability: [],
          recyclability: [],
          reusability: []
        }
      },
    ];
    setMaterials(sampleMaterials);
    localStorage.setItem('materials', JSON.stringify(sampleMaterials));
  };

  const saveMaterials = (newMaterials: Material[]) => {
    setMaterials(newMaterials);
    localStorage.setItem('materials', JSON.stringify(newMaterials));
  };

  const handleAddMaterial = (materialData: Omit<Material, 'id'>) => {
    const newMaterial: Material = {
      ...materialData,
      id: Date.now().toString(),
    };
    saveMaterials([...materials, newMaterial]);
    setShowForm(false);
  };

  const handleUpdateMaterial = (materialData: Omit<Material, 'id'> | Material) => {
    if ('id' in materialData) {
      // Direct update with full material (from ArticlesView)
      const updated = materials.map(m => m.id === materialData.id ? materialData : m);
      saveMaterials(updated);
    } else {
      // Update from form (preserves id and articles)
      if (!editingMaterial) return;
      const updated = materials.map(m => 
        m.id === editingMaterial.id 
          ? { ...materialData, id: m.id, articles: m.articles } 
          : m
      );
      saveMaterials(updated);
      setEditingMaterial(null);
      setShowForm(false);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      saveMaterials(materials.filter(m => m.id !== id));
    }
  };

  const handleViewArticles = (materialId: string, category: CategoryType) => {
    setCurrentView({ type: 'articles', materialId, category });
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMaterial = currentView.type === 'articles' 
    ? materials.find(m => m.id === currentView.materialId) 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f2] via-[#f5f0e8] to-[#ebe4d8] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#faf7f2] rounded-[11.464px] border-[1.5px] border-[#211f1c] overflow-hidden mb-6">
          <StatusBar title="WasteDB" />
          
          {currentView.type === 'materials' ? (
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingMaterial(null);
                  }}
                  className="bg-[#b8c8cb] h-[40px] px-6 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Material
                </button>
              </div>

              {showForm && (
                <div className="mb-6">
                  <MaterialForm
                    material={editingMaterial || undefined}
                    onSave={editingMaterial ? handleUpdateMaterial : handleAddMaterial}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingMaterial(null);
                    }}
                  />
                </div>
              )}

              {!searchQuery && materials.length > 0 && currentView.type === 'materials' && (() => {
                // Compute chart data once so we can reference it in the label
                const chartData = [
                  {
                    name: 'Compostable',
                    shortName: 'compostable',
                    categoryKey: 'compostability',
                    value: Math.round(materials.reduce((sum, m) => sum + m.compostability, 0) / materials.length),
                    articleCount: materials.reduce((sum, m) => sum + m.articles.compostability.length, 0),
                    fill: '#e6beb5'
                  },
                  {
                    name: 'Recyclable',
                    shortName: 'recyclable',
                    categoryKey: 'recyclability',
                    value: Math.round(materials.reduce((sum, m) => sum + m.recyclability, 0) / materials.length),
                    articleCount: materials.reduce((sum, m) => sum + m.articles.recyclability.length, 0),
                    fill: '#e4e3ac'
                  },
                  {
                    name: 'Reusable',
                    shortName: 'reusable',
                    categoryKey: 'reusability',
                    value: Math.round(materials.reduce((sum, m) => sum + m.reusability, 0) / materials.length),
                    articleCount: materials.reduce((sum, m) => sum + m.articles.reusability.length, 0),
                    fill: '#b8c8cb'
                  }
                ];

                return (
                  <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-6 mb-6 shadow-sm">
                    <h3 className="font-['Sniglet:Regular',_sans-serif] text-black mb-4">What options do I have for my waste?</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="20%" 
                        outerRadius="90%"
                        data={chartData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <defs>
                          <filter id="contrastFilter">
                            <feColorMatrix
                              type="matrix"
                              values="3 0 0 0 -1
                                      0 3 0 0 -1
                                      0 0 3 0 -1
                                      0 0 0 1 0"
                            />
                          </filter>
                          <pattern id="grayTexture" patternUnits="userSpaceOnUse" width="3" height="3">
                            <rect width="3" height="3" fill="#fff" />
                            <image href="https://www.transparenttextures.com/patterns/3px-tile.png" x="0" y="0" width="3" height="3" filter="url(#contrastFilter)" />
                          </pattern>
                        </defs>
                        <PolarAngleAxis 
                          type="number" 
                          domain={[0, 100]} 
                          angleAxisId={0} 
                          tick={false}
                          stroke="none"
                        />
                        <RadialBar
                          background={{ fill: 'url(#grayTexture)' }}
                          dataKey="value"
                          cornerRadius={10}
                          stroke="#211f1c"
                          strokeWidth={0.5}
                          strokeOpacity={0.2}
                          animationDuration={2000}
                          animationEasing="ease-in-out"
                          onClick={(data) => {
                            if (data && data.categoryKey) {
                              setCurrentView({ type: 'all-articles', category: data.categoryKey as CategoryType });
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                          label={{
                            position: 'insideStart',
                            fill: '#211f1c',
                            fontFamily: 'Sniglet:Regular, sans-serif',
                            fontSize: '13px',
                            formatter: (value: number) => {
                              // Find the matching data entry by value
                              const dataEntry = chartData.find(d => d.value === value);
                              return dataEntry ? `${value}% is ${dataEntry.shortName}` : `${value}% is`;
                            }
                          }}
                        />
                        <Tooltip 
                          cursor={false}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const articleCount = data.articleCount;
                              const articleText = articleCount === 1 ? 'article' : 'articles';
                              const categoryMap: { [key: string]: string } = {
                                'Compostable': 'compost',
                                'Recyclable': 'recycling',
                                'Reusable': 'reuse'
                              };
                              const categoryLabel = categoryMap[data.name] || data.name.toLowerCase();
                              return (
                                <div style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  borderRadius: '8px',
                                  fontFamily: 'Sniglet:Regular, sans-serif',
                                  fontSize: '12px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  padding: '8px 12px',
                                  color: '#211f1c'
                                }}>
                                  {articleCount} {categoryLabel} {articleText}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            fontFamily: 'Sniglet:Regular, sans-serif',
                            fontSize: '13px',
                            paddingTop: '10px'
                          }}
                          iconType="circle"
                          formatter={(value) => <span style={{ color: '#211f1c' }}>{value}</span>}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map(material => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onEdit={() => {
                      setEditingMaterial(material);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDeleteMaterial(material.id)}
                    onViewArticles={(category) => handleViewArticles(material.id, category)}
                  />
                ))}
              </div>

              {filteredMaterials.length === 0 && (
                <div className="text-center py-12">
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50">
                    {searchQuery ? 'No materials found matching your search.' : 'No materials yet. Add your first one!'}
                  </p>
                </div>
              )}
            </div>
          ) : currentMaterial && currentView.type === 'articles' ? (
            <ArticlesView
              material={currentMaterial}
              category={currentView.category}
              onBack={() => setCurrentView({ type: 'materials' })}
              onUpdateMaterial={handleUpdateMaterial}
            />
          ) : currentView.type === 'all-articles' ? (
            <AllArticlesView
              category={currentView.category}
              materials={materials}
              onBack={() => setCurrentView({ type: 'materials' })}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}