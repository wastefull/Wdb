import { Lightbulb, AlertCircle, ExternalLink } from "lucide-react";

interface GuideRendererProps {
  content: any; // Tiptap JSON content
}

export default function GuideRenderer({ content }: GuideRendererProps) {
  // Parse content if it's a string
  let parsedContent = content;
  if (typeof content === "string") {
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("Error parsing guide content:", error);
      return (
        <p className="text-black/60 dark:text-white/60 text-[13px]">
          Error displaying content.
        </p>
      );
    }
  }

  if (!parsedContent?.content) {
    return (
      <p className="text-black/60 dark:text-white/60 text-[13px]">
        No content to display.
      </p>
    );
  }

  const renderNode = (node: any, index: number) => {
    switch (node.type) {
      case "section":
        return (
          <div key={index} className="retro-card p-4 my-6">
            <h2 className="text-[18px] font-display mb-4 text-black dark:text-white">
              {node.attrs?.title || "Section"}
            </h2>
            <div className="prose prose-sm max-w-none">
              {node.content?.map(renderNode)}
            </div>
          </div>
        );

      case "tip":
        return (
          <div
            key={index}
            className="retro-card p-4 my-4 bg-[var(--waste-compost)]/10 border-l-4 border-[var(--waste-compost)]"
          >
            <div className="flex items-start gap-3">
              <Lightbulb
                size={18}
                className="text-[var(--waste-compost)] mt-1 shrink-0"
              />
              <div className="flex-1 text-[13px]">
                {node.content?.map(renderNode)}
              </div>
            </div>
          </div>
        );

      case "warning":
        return (
          <div
            key={index}
            className="retro-card p-4 my-4 bg-[var(--waste-reuse)]/10 border-l-4 border-[var(--waste-reuse)]"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-[var(--waste-reuse)] mt-1 shrink-0"
              />
              <div className="flex-1 text-[13px]">
                {node.content?.map(renderNode)}
              </div>
            </div>
          </div>
        );

      case "resource":
        return (
          <div key={index} className="my-3">
            <a
              href={node.attrs?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="retro-card-button w-full p-3 flex items-center gap-3 no-underline"
            >
              <ExternalLink
                size={16}
                className="text-black dark:text-white shrink-0"
              />
              <div className="text-left">
                <div className="text-[13px] font-medium text-black dark:text-white">
                  {node.attrs?.title || "Resource"}
                </div>
                <div className="text-[11px] text-black/60 dark:text-white/60">
                  {node.attrs?.type || "link"}
                </div>
              </div>
            </a>
          </div>
        );

      case "paragraph":
        return (
          <p
            key={index}
            className="mb-3 text-[13px] text-black dark:text-white"
          >
            {node.content?.map((child: any, i: number) =>
              renderInline(child, i)
            )}
          </p>
        );

      case "heading":
        const level = node.attrs?.level || 2;
        const headingClassName = "font-display mb-2 text-black dark:text-white";
        const headingStyle = { fontSize: level === 2 ? "16px" : "14px" };
        const children = node.content?.map((child: any, i: number) =>
          renderInline(child, i)
        );

        if (level === 2) {
          return (
            <h2 key={index} className={headingClassName} style={headingStyle}>
              {children}
            </h2>
          );
        }
        return (
          <h3 key={index} className={headingClassName} style={headingStyle}>
            {children}
          </h3>
        );

      case "bulletList":
        return (
          <ul key={index} className="list-disc list-inside mb-3 space-y-1">
            {node.content?.map(renderNode)}
          </ul>
        );

      case "orderedList":
        return (
          <ol key={index} className="list-decimal list-inside mb-3 space-y-1">
            {node.content?.map(renderNode)}
          </ol>
        );

      case "listItem":
        return (
          <li key={index} className="text-[13px] text-black dark:text-white">
            {node.content?.map((child: any, i: number) => {
              if (child.type === "paragraph") {
                return (
                  <span key={i}>
                    {child.content?.map((c: any, j: number) =>
                      renderInline(c, j)
                    )}
                  </span>
                );
              }
              return renderNode(child, i);
            })}
          </li>
        );

      case "stepList":
        return (
          <ol key={index} className="space-y-2 my-4">
            {node.content?.map((step: any, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="font-display text-[13px] text-black dark:text-white">
                  {i + 1}.
                </span>
                <div className="flex-1 text-[13px] text-black dark:text-white">
                  {step.content?.map((child: any, j: number) => {
                    if (child.type === "paragraph") {
                      return (
                        <span key={j}>
                          {child.content?.map((c: any, k: number) =>
                            renderInline(c, k)
                          )}
                        </span>
                      );
                    }
                    return renderNode(child, j);
                  })}
                </div>
              </li>
            ))}
          </ol>
        );

      case "checkItem":
        const isCheck = node.attrs?.variant !== "cross";
        return (
          <div key={index} className="flex items-start gap-3 my-2">
            <span
              className={`mt-0.5 shrink-0 text-base ${
                isCheck
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isCheck ? "✓" : "✗"}
            </span>
            <div className="flex-1 text-[13px] text-black dark:text-white">
              {node.content?.map((child: any, i: number) => {
                if (child.type === "paragraph") {
                  return (
                    <span key={i}>
                      {child.content?.map((c: any, j: number) =>
                        renderInline(c, j)
                      )}
                    </span>
                  );
                }
                return renderNode(child, i);
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderInline = (node: any, index: number) => {
    if (node.type === "text") {
      let text = node.text;

      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === "bold") {
            text = <strong key={index}>{text}</strong>;
          }
          if (mark.type === "italic") {
            text = <em key={index}>{text}</em>;
          }
          if (mark.type === "link") {
            text = (
              <a
                key={index}
                href={mark.attrs.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-black dark:text-white hover:opacity-60"
              >
                {text}
              </a>
            );
          }
        });
      }

      return text;
    }
    return null;
  };

  return (
    <div className="guide-renderer">
      {parsedContent.content.map(renderNode)}
    </div>
  );
}
