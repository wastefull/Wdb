import { motion } from "motion/react";

export function LoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        className="w-16 h-16 rounded-full border-4 border-waste-reuse border-t-[#211f1c]"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
