import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

interface ScrollHintArrowProps {
  cta: string;
}

export function ScrollHintArrow({ cta }: ScrollHintArrowProps) {
  return (
    <motion.div
      className="md:hidden flex justify-center pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center gap-1 text-black/30 dark:text-white/30"
      >
        <span className="text-[10px] uppercase tracking-wider">{cta}</span>
        <ChevronDown size={16} />
      </motion.div>
    </motion.div>
  );
}
