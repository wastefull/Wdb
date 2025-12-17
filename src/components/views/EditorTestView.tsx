import { useState } from "react";
import GuideEditor from "../editor/GuideEditor";
import GuideRenderer from "../editor/GuideRenderer";

export default function EditorTestView() {
  const [content, setContent] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-display text-black dark:text-white">
          Guide Editor Test
        </h1>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="retro-button"
        >
          {showPreview ? "Show Editor" : "Show Preview"}
        </button>
      </div>

      {showPreview ? (
        <div>
          <h2 className="text-[18px] font-display mb-4 text-black dark:text-white">
            Preview
          </h2>
          {content ? (
            <GuideRenderer content={content} />
          ) : (
            <p className="text-black/60 dark:text-white/60 text-[13px]">
              No content to preview. Create something in the editor first.
            </p>
          )}

          <details className="mt-8">
            <summary className="text-[13px] text-black/60 dark:text-white/60 cursor-pointer">
              View JSON
            </summary>
            <pre className="mt-2 p-4 bg-black/5 dark:bg-white/5 rounded-md text-[11px] overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <GuideEditor
          onChange={setContent}
          placeholder="Start writing your guide... Try adding sections, tips, warnings, and resources!"
        />
      )}
    </div>
  );
}
