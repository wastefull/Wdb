import { useState, useEffect } from "react";
import { ArrowLeft, Edit2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

interface RecyclabilityCalculationViewProps {
  onBack: () => void;
}

export function RecyclabilityCalculationView({
  onBack,
}: RecyclabilityCalculationViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");

  useEffect(() => {
    // Add KaTeX CSS to document head
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    link.integrity =
      "sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);

    // Load markdown content from localStorage or use default
    const storedContent = localStorage.getItem("recyclabilityMarkdown");
    if (storedContent) {
      setMarkdownContent(storedContent);
    } else {
      const defaultContent = `# How is recyclability calculated?

1234

The recyclability category score is calculated using the following formula:

$
R_{category} = \\frac{\\sum_i R_{s,i} \\times \\text{Market Share}_i}{\\sum_i \\text{Market Share}_i}
$

Where:
- $R_{category}$ is the recyclability score for the category
- $R_{s,i}$ is the recyclability score for each subcategory $i$
- $\\text{Market Share}_i$ is the market share of subcategory $i$
`;
      setMarkdownContent(defaultContent);
    }

    return () => {
      // Cleanup: remove the link when component unmounts
      document.head.removeChild(link);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent browser from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSave = () => {
    localStorage.setItem("recyclabilityMarkdown", markdownContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reload from localStorage
    const storedContent = localStorage.getItem("recyclabilityMarkdown");
    if (storedContent) {
      setMarkdownContent(storedContent);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-waste-reuse rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-[18px] text-black flex-1">
          Recyclability Calculation
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-waste-recycle rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            <Edit2 size={14} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-waste-recycle h-9 px-6 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[13px] text-black hover:translate-y-px hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-waste-compost h-9 px-6 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] text-[13px] text-black hover:translate-y-px hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-6 max-w-3xl mx-auto">
        {isEditing ? (
          <div>
            <label className="text-[13px] text-black block mb-2">
              Markdown Content (use $...$ for inline math, $...$ for block math)
            </label>
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              onKeyDownCapture={handleKeyDown}
              rows={20}
              className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-xl font-mono text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-y"
              placeholder="Enter markdown content..."
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-[20px] text-black mb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-[18px] text-black mb-3" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-[16px] text-black mb-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-[13px] text-black/80 mb-4 leading-relaxed"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="text-[13px] text-black/80 mb-4 list-disc pl-6"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-6">
                    <table
                      className="w-full border-[1.5px] border-[#211f1c] rounded-xl"
                      {...props}
                    />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead
                    className="bg-waste-recycle border-b-[1.5px] border-[#211f1c]"
                    {...props}
                  />
                ),
                tbody: ({ node, ...props }) => <tbody {...props} />,
                tr: ({ node, ...props }) => (
                  <tr className="border-b border-[#211f1c]/20" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="text-[12px] text-black px-3 py-2 text-left border-r border-[#211f1c]/20 last:border-r-0"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className="text-[11px] text-black/80 px-3 py-2 border-r border-[#211f1c]/20 last:border-r-0"
                    {...props}
                  />
                ),
                code: ({ node, ...props }) => {
                  const isInline =
                    node?.position?.start.line === node?.position?.end.line;
                  return isInline ? (
                    <code
                      className="bg-[#211f1c]/5 px-1.5 py-0.5 rounded border border-[#211f1c]/20 text-black"
                      style={{
                        fontSize: "14px",
                        fontFamily:
                          "DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace",
                      }}
                      {...props}
                    />
                  ) : (
                    <code
                      className="text-black block"
                      style={{
                        fontSize: "12px",
                        fontFamily:
                          "DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace",
                      }}
                      {...props}
                    />
                  );
                },
                pre: ({ node, ...props }) => (
                  <pre
                    className="bg-[#211f1c]/5 border-[1.5px] border-[#211f1c] rounded-xl p-4 mb-4 overflow-x-auto"
                    style={{
                      fontFamily:
                        "DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace",
                    }}
                    {...props}
                  />
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
