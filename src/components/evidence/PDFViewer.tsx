/**
 * PDFViewer Component
 *
 * Interactive PDF viewer using PDF.js with:
 * - Text selection → auto-copy to snippet field
 * - Page number tracking → auto-fill locator field
 * - Zoom controls and navigation
 * - Search within PDF
 *
 * Phase 9.2: Curation Workbench PDF Tooling
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
// Note: We build the text layer manually instead of using TextLayer class
// because the TextLayer uses transforms that make selection difficult
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  Copy,
  Check,
  FileText,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// Debug logging
// Reduce debug logging now that basic functionality works
const DEBUG = false;
const log = (...args: unknown[]) => {
  if (DEBUG) console.log("[PDFViewer]", ...args);
};

export interface PageTextContent {
  pageNumber: number;
  text: string;
}

interface PDFViewerProps {
  /** URL of the PDF to display */
  pdfUrl: string;
  /** Callback when text is selected - receives selected text */
  onTextSelect?: (text: string, pageNumber: number) => void;
  /** Callback when page changes */
  onPageChange?: (pageNumber: number) => void;
  /** Callback when PDF text is extracted - provides all page text for scanning */
  onTextExtracted?: (pages: PageTextContent[]) => void;
  /** External page navigation request */
  goToPage?: number;
  /** Title of the document */
  title?: string;
  /** Height of the viewer */
  height?: string;
}

export function PDFViewer({
  pdfUrl,
  onTextSelect,
  onPageChange,
  onTextExtracted,
  goToPage: externalGoToPage,
  title,
  height = "600px",
}: PDFViewerProps) {
  // PDF document state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    let isCancelled = false;

    const loadPdf = async () => {
      if (!pdfUrl) return;

      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          // Enable text layer
          cMapUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/cmaps/",
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;

        if (isCancelled) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);

        // Extract text from all pages for keyword scanning
        if (onTextExtracted) {
          const pages: PageTextContent[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items
              .filter((item): boolean => "str" in item)
              .map((item) => (item as { str: string }).str)
              .join(" ");
            pages.push({ pageNumber: i, text });
          }
          onTextExtracted(pages);
        }
      } catch (err: any) {
        if (isCancelled) return;

        console.error("Error loading PDF:", err);
        setError(err.message || "Failed to load PDF");
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
    // Note: onTextExtracted intentionally excluded from deps to prevent reload loops
    // It's called once after PDF loads successfully
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl]);

  // Handle external page navigation requests
  useEffect(() => {
    if (
      externalGoToPage &&
      externalGoToPage >= 1 &&
      externalGoToPage <= numPages
    ) {
      setCurrentPage(externalGoToPage);
    }
  }, [externalGoToPage, numPages]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        // Cancel any in-progress render
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(currentPage);

        if (isCancelled) return;

        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        // Calculate viewport
        const viewport = page.getViewport({ scale });

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Clear the canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (isCancelled) return;

        // Render text layer for selection
        // Re-check ref after async operation since component could have unmounted
        const textLayer = textLayerRef.current;
        if (textLayer) {
          const textContent = await page.getTextContent();
          log("Text content items:", textContent.items.length);

          if (isCancelled) return;

          // Clear previous text layer
          textLayer.innerHTML = "";

          // Set exact dimensions to match canvas
          textLayer.style.width = `${viewport.width}px`;
          textLayer.style.height = `${viewport.height}px`;

          // Build text layer manually from raw text content
          // This avoids PDF.js's problematic transform-based positioning
          textContent.items.forEach((item) => {
            // Skip non-text items
            if (!("str" in item) || !item.str) return;

            const textItem = item as {
              str: string;
              transform: number[];
              width: number;
              height: number;
            };

            // The transform array is [scaleX, skewX, skewY, scaleY, translateX, translateY]
            const tx = textItem.transform;

            // Apply viewport transform to get screen coordinates
            // PDF coordinates have origin at bottom-left, screen at top-left
            const [a, b, c, d, e, f] = tx;

            // Transform the point through the viewport
            const screenX =
              viewport.transform[0] * e +
              viewport.transform[2] * f +
              viewport.transform[4];
            const screenY =
              viewport.transform[1] * e +
              viewport.transform[3] * f +
              viewport.transform[5];

            // Calculate font size from the transform matrix
            // The scale factors in the transform indicate the font size
            const fontSize = Math.sqrt(d * d + c * c) * viewport.scale;

            // Create span element
            const span = document.createElement("span");
            span.textContent = textItem.str;
            span.style.position = "absolute";
            span.style.left = `${screenX}px`;
            span.style.top = `${screenY - fontSize}px`; // Adjust for baseline
            span.style.fontSize = `${fontSize}px`;
            span.style.fontFamily = "sans-serif";
            span.style.color = "transparent";
            span.style.whiteSpace = "pre";
            span.style.pointerEvents = "auto";
            span.style.userSelect = "text";
            span.style.webkitUserSelect = "text";
            span.style.cursor = "text";
            // Add slight padding to make selection easier without gaps
            span.style.padding = "1px 0";
            span.style.margin = "0";
            span.style.lineHeight = "1";

            textLayer.appendChild(span);
          });

          // Container should NOT be selectable - only the spans inside
          // This prevents "runover" selection of the entire layer
          textLayer.style.userSelect = "none";
          (textLayer.style as any).webkitUserSelect = "none";
          textLayer.style.pointerEvents = "auto";

          // Debug: Check positioning
          const spans = textLayer.querySelectorAll("span");
          log("Manual text layer built, spans:", spans.length);

          if (spans.length > 0) {
            const firstSpan = spans[0] as HTMLElement;
            const spanBounds = firstSpan.getBoundingClientRect();
            log("First span position:");
            log("  - textContent:", firstSpan.textContent?.substring(0, 30));
            log("  - bounds:", {
              w: spanBounds.width,
              h: spanBounds.height,
              t: spanBounds.top,
              l: spanBounds.left,
            });
            log("  - fontSize:", firstSpan.style.fontSize);
          }
        }

        // Notify page change
        onPageChange?.(currentPage);
      } catch (err: any) {
        // Ignore cancellation errors - they're expected when navigating quickly
        if (err?.name === "RenderingCancelledException") {
          return;
        }
        console.error("Error rendering page:", err);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      // Cancel any in-progress render on cleanup
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, scale, onPageChange]);

  // Handle text selection using selectionchange event
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleSelectionChange = () => {
      // Debounce to wait for selection to stabilize
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        // Check if selection involves our text layer
        // Use multiple checks since commonAncestorContainer can be a parent when selecting across spans
        if (
          textLayerRef.current &&
          selection?.rangeCount &&
          text &&
          text.length > 0
        ) {
          const range = selection.getRangeAt(0);

          // Check if either endpoint or the common ancestor is in our text layer
          const anchorInTextLayer =
            selection.anchorNode &&
            textLayerRef.current.contains(selection.anchorNode);
          const focusInTextLayer =
            selection.focusNode &&
            textLayerRef.current.contains(selection.focusNode);
          const commonInTextLayer = textLayerRef.current.contains(
            range.commonAncestorContainer
          );

          const isInTextLayer =
            anchorInTextLayer || focusInTextLayer || commonInTextLayer;

          log("Selection change detected");
          log(
            "  - Text:",
            text?.substring(0, 50),
            text.length > 50 ? "..." : ""
          );
          log("  - Length:", text.length);
          log("  - Type:", selection?.type);
          log("  - In text layer:", isInTextLayer, {
            anchorInTextLayer,
            focusInTextLayer,
            commonInTextLayer,
          });

          if (isInTextLayer) {
            setSelectedText(text);
          }
        }
      }, 100);
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      clearTimeout(debounceTimer);
    };
  }, []);

  // Copy selected text to snippet
  const copyToSnippet = useCallback(() => {
    if (selectedText && onTextSelect) {
      onTextSelect(selectedText, currentPage);
      setCopiedText(true);
      toast.success(`Copied to snippet (Page ${currentPage})`);
      setTimeout(() => setCopiedText(false), 2000);
    } else if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setCopiedText(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedText(false), 2000);
    }
  }, [selectedText, currentPage, onTextSelect]);

  // Navigation handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  const previousPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);

  // Zoom handlers
  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3.0));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setScale(1.0);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-[#f5f4f0] dark:bg-[#1a1917] rounded-lg border-2 border-[#211f1c]/20 dark:border-white/20"
        style={{ height }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-black/40 dark:text-white/40 mb-2" />
        <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">
          Loading PDF...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800"
        style={{ height }}
      >
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="font-['Sniglet'] text-[12px] text-red-600 dark:text-red-400 mb-1">
          Failed to load PDF
        </p>
        <p className="font-['Sniglet'] text-[10px] text-red-500/80 dark:text-red-400/80 max-w-[300px] text-center">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-[#f5f4f0] dark:bg-[#1a1917] rounded-lg border-2 border-[#211f1c]/20 dark:border-white/20 overflow-hidden h-full"
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 border-b border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825]">
        {/* Left: Document info */}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-black/60 dark:text-white/60 shrink-0" />
          {title && (
            <span className="font-['Sniglet'] text-[11px] text-black/80 dark:text-white/80 truncate max-w-[150px]">
              {title}
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[9px] font-['Sniglet'] shrink-0"
          >
            Page {currentPage} of {numPages}
          </Badge>
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousPage}
            disabled={currentPage <= 1}
            className="h-7 w-7 p-0"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Input
            type="number"
            min={1}
            max={numPages}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="w-12 h-7 text-center text-[11px] p-1"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={nextPage}
            disabled={currentPage >= numPages}
            className="h-7 w-7 p-0"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Right: Zoom and tools */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-7 w-7 p-0"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <button
            onClick={resetZoom}
            className="font-['Sniglet'] text-[10px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white px-1"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="h-7 w-7 p-0"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-[#211f1c]/20 dark:bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className={`h-7 w-7 p-0 ${
              showSearch ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            title="Search in PDF"
          >
            <Search className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 w-7 p-0"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 p-2 border-b border-[#211f1c]/20 dark:border-white/20 bg-[#e5e4dc] dark:bg-[#3a3835]">
          <Search className="w-4 h-4 text-black/40 dark:text-white/40" />
          <Input
            type="text"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-7 text-[11px]"
          />
          <span className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40">
            (Search coming soon)
          </span>
        </div>
      )}

      {/* Selected text toolbar */}
      {selectedText && (
        <div className="flex items-center justify-between gap-2 p-2 border-b border-[#211f1c]/20 dark:border-white/20 bg-[#a8d5ba]/30 dark:bg-[#a8d5ba]/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-['Sniglet'] text-[10px] text-black/60 dark:text-white/60 shrink-0">
              Selected:
            </span>
            <span className="font-['Sniglet'] text-[11px] text-black/80 dark:text-white/80 truncate max-w-[300px]">
              "{selectedText.substring(0, 100)}
              {selectedText.length > 100 ? "..." : ""}"
            </span>
            <Badge variant="outline" className="text-[8px] shrink-0">
              {selectedText.length} chars
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={copyToSnippet}
            className={`h-7 text-[10px] ${
              copiedText
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#211f1c] hover:bg-[#3a3835]"
            }`}
          >
            {copiedText ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                {onTextSelect ? "Copy to Snippet" : "Copy"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* PDF canvas container */}
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-[#e5e4dc] dark:bg-[#2a2825]">
        <div
          className="relative"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {/* Canvas renders the visual PDF - pointer-events: none lets clicks through to text layer */}
          <canvas ref={canvasRef} className="block pointer-events-none" />
          {/* Text layer sits on top and receives all mouse events for selection */}
          <div ref={textLayerRef} className="textLayer" />
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="p-2 border-t border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <p className="font-['Sniglet'] text-[9px] text-black/50 dark:text-white/50 text-center">
          💡 Select text in the PDF to copy it to the snippet field. Page number
          will be auto-filled.
        </p>
      </div>
    </div>
  );
}

// Additional CSS overrides for text selection
const textLayerOverrides = `
  .textLayer {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
    pointer-events: auto;
    /* Container is NOT selectable - prevents runover selection */
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  
  .textLayer span {
    pointer-events: auto !important;
    /* Only spans are selectable */
    user-select: text !important;
    -webkit-user-select: text !important;
  }

  .textLayer ::selection {
    background: rgba(0, 100, 200, 0.4);
  }
  
  .textLayer span::selection {
    background: rgba(0, 100, 200, 0.4);
  }
`;

// Inject override styles
if (typeof document !== "undefined") {
  const styleId = "pdf-text-layer-overrides";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = textLayerOverrides;
    document.head.appendChild(style);
  }
}
