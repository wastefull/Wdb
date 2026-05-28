import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../ui/utils";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  panelClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const DEFAULT_OVERLAY_CLASS_NAME =
  "fixed inset-0 z-200 bg-black/40 dark:bg-black/60 flex items-start justify-center overflow-y-auto pt-10 px-4";

const DEFAULT_PANEL_CLASS_NAME =
  "mt-10 bg-white dark:bg-[#2a2825] rounded-(--retro-rounding) retro-card";

export function Modal({
  onClose,
  children,
  className,
  overlayClassName,
  panelClassName,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const portalTarget =
    typeof document !== "undefined" ? document.documentElement : null;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!closeOnEscape || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, onClose]);

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className={cn(DEFAULT_OVERLAY_CLASS_NAME, overlayClassName)}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={cn(DEFAULT_PANEL_CLASS_NAME, className, panelClassName)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    portalTarget,
  );
}
