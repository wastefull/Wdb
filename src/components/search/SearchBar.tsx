import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "./SearchIcon";
import { useIsMobile } from "../ui/use-mobile";

export interface SearchSuggestion {
  value: string;
  subtitle?: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  suggestions?: SearchSuggestion[];
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  suggestions = [],
}: SearchBarProps) {
  const isMobile = useIsMobile();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleSuggestions = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return [];
    return suggestions.slice(0, 8);
  }, [suggestions, value]);

  const hasSuggestions = visibleSuggestions.length > 0;

  useEffect(() => {
    if (!hasSuggestions) {
      setHighlightedIndex(-1);
    } else if (highlightedIndex >= visibleSuggestions.length) {
      setHighlightedIndex(visibleSuggestions.length - 1);
    }
  }, [hasSuggestions, highlightedIndex, visibleSuggestions.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    if (onSearch) {
      onSearch(suggestion.value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent browser from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }

    if (e.key === "ArrowDown" && hasSuggestions) {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex((prev) =>
        prev < visibleSuggestions.length - 1 ? prev + 1 : 0,
      );
      return;
    }

    if (e.key === "ArrowUp" && hasSuggestions) {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex((prev) =>
        prev <= 0 ? visibleSuggestions.length - 1 : prev - 1,
      );
      return;
    }

    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    // Trigger search on Enter key (including empty search to show all materials)
    if (e.key === "Enter" && onSearch) {
      if (isDropdownOpen && highlightedIndex >= 0 && hasSuggestions) {
        e.preventDefault();
        selectSuggestion(visibleSuggestions[highlightedIndex]);
        return;
      }
      onSearch(value.trim());
      setIsDropdownOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-[11.46px] shrink-0 w-full bg-white dark:bg-[#2a2825]"
    >
      <div
        aria-hidden="true"
        className="absolute border-[#211f1c] dark:border-white/20 border-[1.5px] border-solid inset-[-0.75px] pointer-events-none rounded-[12.21px]"
      />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[15px] items-center justify-start px-3 py-2 relative w-full">
          <SearchIcon />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (hasSuggestions) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDownCapture={handleKeyDown}
            placeholder={isMobile ? "Search…" : "What do I do with…?"}
            className="bg-transparent border-none outline-none text-[15px] normal placeholder:text-black/50 dark:placeholder:text-white/50 flex-1 min-w-0"
            aria-label="Search materials"
            aria-autocomplete="list"
            aria-expanded={isDropdownOpen && hasSuggestions}
            aria-controls="material-search-suggestions"
          />
        </div>
      </div>

      {isDropdownOpen && hasSuggestions && (
        <div
          id="material-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#faf7f2] dark:bg-[#1f1d1a] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.15)] overflow-hidden"
        >
          {visibleSuggestions.map((suggestion, index) => {
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={`${suggestion.value}-${index}`}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full text-left px-3 py-2.5 border-b border-[#211f1c]/10 dark:border-white/10 last:border-b-0 transition-colors ${
                  isHighlighted
                    ? "bg-waste-recycle/40 dark:bg-waste-recycle/20"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="text-[14px] normal truncate">
                  {suggestion.value}
                </div>
                {suggestion.subtitle && (
                  <div className="text-[11px] text-black/55 dark:text-white/55 truncate mt-0.5">
                    {suggestion.subtitle}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
