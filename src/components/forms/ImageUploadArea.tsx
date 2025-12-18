import { useState } from "react";
import { Image as ImageIcon, Link, Upload } from "lucide-react";

export interface ImageUploadAreaProps {
  image?: string;
  onImageChange: (image: string | undefined) => void;
  label?: string;
}

export function ImageUploadArea({
  image,
  onImageChange,
  label,
}: ImageUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
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

  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    if (
      trimmedUrl &&
      (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://"))
    ) {
      onImageChange(trimmedUrl);
      setUrlInput("");
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUrlSubmit();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-[13px] text-black dark:text-white block mb-2">
          {label}
        </label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-[1.5px] border-dashed rounded-xl p-4 transition-all ${
          isDragging
            ? "border-[#211f1c] dark:border-white bg-[#211f1c]/5 dark:bg-white/5"
            : "border-[#211f1c]/30 dark:border-white/30 bg-white dark:bg-[#2a2825]"
        }`}
      >
        {image ? (
          <div className="relative">
            <img
              src={image}
              alt="Preview"
              className="w-full h-auto rounded-lg border border-[#211f1c] dark:border-white/20"
            />
            <button
              type="button"
              onClick={() => onImageChange(undefined)}
              className="absolute top-2 right-2 bg-waste-compost px-3 py-1 rounded-md border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] text-[11px] text-black hover:translate-y-px hover:shadow-[1px_1px_0px_0px_#000000] transition-all"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Mode toggle */}
            <div className="flex justify-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg w-fit mx-auto">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
                  mode === "upload"
                    ? "bg-white dark:bg-[#2a2825] shadow-sm text-black dark:text-white"
                    : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                }`}
              >
                <Upload size={12} />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
                  mode === "url"
                    ? "bg-white dark:bg-[#2a2825] shadow-sm text-black dark:text-white"
                    : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                }`}
              >
                <Link size={12} />
                URL
              </button>
            </div>

            {mode === "upload" ? (
              <label className="cursor-pointer flex flex-row items-center justify-center gap-2 py-3">
                <ImageIcon
                  size={18}
                  className="text-black/40 dark:text-white/40"
                />
                <p className="text-[11px] text-black/60 dark:text-white/60">
                  Drop image here or click to upload
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileChange(e.target.files[0])
                  }
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={handleUrlKeyDown}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 bg-white dark:bg-[#1a1817] border border-[#211f1c]/20 dark:border-white/20 rounded-lg text-[12px] text-black dark:text-white outline-none focus:border-[#211f1c] dark:focus:border-white/50 transition-all"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-3 py-2 bg-waste-recycle rounded-lg border border-[#211f1c] text-[11px] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:translate-y-px transition-all"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
