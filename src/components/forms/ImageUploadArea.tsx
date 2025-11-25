import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

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

  return (
    <div className="w-full">
      {label && (
        <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
          {label}
        </label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-[1.5px] border-dashed rounded-[8px] p-4 transition-all ${
          isDragging
            ? "border-[#211f1c] bg-[#211f1c]/5"
            : "border-[#211f1c]/30 bg-white"
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
              onChange={(e) =>
                e.target.files?.[0] && handleFileChange(e.target.files[0])
              }
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
