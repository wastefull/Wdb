import { SearchIcon } from "./SearchIcon";
import { useIsMobile } from "../ui/use-mobile";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const isMobile = useIsMobile();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent Figma from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }

    // Trigger search on Enter key
    if (e.key === "Enter" && onSearch && value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <div className="relative rounded-[11.46px] shrink-0 w-full bg-white dark:bg-[#2a2825]">
      <div
        aria-hidden="true"
        className="absolute border-[#211f1c] dark:border-white/20 border-[1.5px] border-solid inset-[-0.75px] pointer-events-none rounded-[12.21px]"
      />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[15px] items-center justify-start px-[12px] py-[8px] relative w-full">
          <SearchIcon />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDownCapture={handleKeyDown}
            placeholder={isMobile ? "Search…" : "What do I do with…?"}
            className="font-['Sniglet:Regular',_sans-serif] bg-transparent border-none outline-none text-[15px] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 flex-1 min-w-0"
            aria-label="Search materials"
          />
        </div>
      </div>
    </div>
  );
}
