import { useEffect, useRef, useState, useCallback } from "react";
import { Material } from "../../types/material";

interface VirtualizedMaterialListProps {
  materials: Material[];
  renderMaterial: (material: Material) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedMaterialList({
  materials,
  renderMaterial,
  itemHeight = 400, // Approximate height of MaterialCard
  overscan = 3, // Number of items to render outside viewport
  className = "",
}: VirtualizedMaterialListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    // Initial height
    setContainerHeight(container.clientHeight);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Calculate which items to render
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    materials.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleMaterials = materials.slice(startIndex, endIndex + 1);
  const totalHeight = materials.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: "100%", position: "relative" }}
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleMaterials.map((material, index) => (
            <div
              key={material.id}
              style={{ height: `${itemHeight}px` }}
              className="pb-4"
            >
              {renderMaterial(material)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Grid-based virtualization for search results
interface VirtualizedMaterialGridProps {
  materials: Material[];
  renderMaterial: (material: Material) => React.ReactNode;
  columns?: number;
  rowHeight?: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedMaterialGrid({
  materials,
  renderMaterial,
  columns = 3,
  rowHeight = 400,
  gap = 16,
  overscan = 2,
  className = "",
}: VirtualizedMaterialGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [actualColumns, setActualColumns] = useState(columns);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateColumns = () => {
      const width = container.clientWidth;
      // Responsive column count based on width
      if (width < 768) {
        setActualColumns(1);
      } else if (width < 1024) {
        setActualColumns(2);
      } else {
        setActualColumns(columns);
      }
    };

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
      updateColumns();
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    // Initial setup
    setContainerHeight(container.clientHeight);
    updateColumns();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [columns]);

  // Calculate rows
  const totalRows = Math.ceil(materials.length / actualColumns);
  const effectiveRowHeight = rowHeight + gap;

  // Calculate which rows to render
  const startRow = Math.max(
    0,
    Math.floor(scrollTop / effectiveRowHeight) - overscan
  );
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / effectiveRowHeight) + overscan
  );

  const startIndex = startRow * actualColumns;
  const endIndex = Math.min(
    materials.length - 1,
    (endRow + 1) * actualColumns - 1
  );

  const visibleMaterials = materials.slice(startIndex, endIndex + 1);
  const totalHeight = totalRows * effectiveRowHeight;
  const offsetY = startRow * effectiveRowHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: "100%", position: "relative" }}
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${actualColumns}, minmax(0, 1fr))`,
            }}
          >
            {visibleMaterials.map((material) => (
              <div key={material.id}>{renderMaterial(material)}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
