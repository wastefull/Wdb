import {
  CarrotIcon,
  CatIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleArrowLeftIcon,
  EyeClosedIcon,
  UndoIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { ScrollHintArrow } from "./ScrollHintArrow";
import { motion, MotionConfig } from "motion/react";

interface SidebarProps {
  side: "left" | "right";
  /** Label shown on the always-visible binder tab */
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function Sidebar({
  side,
  label,
  isOpen,
  onToggle,
  children,
}: SidebarProps) {
  // Outer border separates the sidebar column from the main content
  const outerBorder =
    side === "left"
      ? "border-r-[1.5px] border-[#211f1c] dark:border-white/20"
      : "border-l-[1.5px] border-[#211f1c] dark:border-white/20";

  // writing-mode rotates text AND affects layout dimensions — no overflow.
  // vertical-rl reads top→bottom; adding rotate-180 flips it to bottom→top.
  const labelRotation = side === "left" ? "rotate-180" : "";

  // Rounded corners face outward from the panel edge
  const tabRounding =
    side === "left"
      ? "!rounded-l-none rounded-r-none"
      : "!rounded-r-none rounded-l-none";

  const tab = (
    <div className="flex items-start pt-2">
      <button
        type="button"
        onClick={onToggle}
        title={isOpen ? `Hide ${label}` : `Show ${label}`}
        className={`
          flex items-center justify-center
          border-[--border]
          bg-[--secondary]
          hover:bg-[--ring]
          transition-colors cursor-pointer select-none
          ${tabRounding} caption card-muted
          !pl-1 !pr-1
        `}
      >
        {isOpen ? (
          <UndoIcon
            size={10}
            className={`${side == "right" ? "rotate-180" : ""}`}
            aria-label={`Close ${label}`}
          />
        ) : (
          <MotionConfig reducedMotion="user">
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
            >
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "easeInOut",
                }}
                className="flex flex-row items-center gap-0 text--muted"
              >
                {/* Chevron sits between the panel border and the label on both sides */}
                {side === "left" && <ChevronLeft size={10} />}
                <span
                  style={{ writingMode: "vertical-rl" }}
                  className={`block ${labelRotation} text-xs uppercase tracking-wider`}
                >
                  {label}
                </span>
                {side === "right" && <ChevronRight size={10} />}
              </motion.div>
            </motion.div>
          </MotionConfig>
        )}
      </button>
    </div>
  );

  return (
    <div className="hidden md:flex items-stretch shrink-0">
      {/* Right panel: tab is outside/left of the bordered aside */}
      {side === "right" && tab}

      {isOpen && (
        <aside className={`w-48 lg:w-64 h-full ${outerBorder}`}>
          {children}
        </aside>
      )}

      {/* Left panel: tab is outside/right of the bordered aside */}
      {side === "left" && tab}
    </div>
  );
}
