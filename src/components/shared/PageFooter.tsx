import { AlertCircle, CircleOff, FlaskConical } from "lucide-react";
import { motion } from "motion/react";
import { useNavigationContext } from "../../contexts/NavigationContext";

export function PageFooter() {
  const { navigateToScienceHub, navigateToLegalHub, navigateToPrivacyPolicy } =
    useNavigationContext();

  return (
    <div className="p-6">
      <footer className="mt-8 text-center border-t border-[#211f1c]/10 dark:border-white/10 pt-6">
        {/* Science and Legal links */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={navigateToScienceHub}
              className="text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white md:hover:underline transition-colors flex items-center gap-1"
            >
              <FlaskConical className="w-5 h-5 md:w-3 md:h-3" />
              <span className="hidden md:inline">Science</span>
            </button>
            <span className="text-black/30 dark:text-white/30">•</span>
            <button
              onClick={navigateToLegalHub}
              className="text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white md:hover:underline transition-colors flex items-center gap-1"
            >
              <AlertCircle className="w-5 h-5 md:w-3 md:h-3" />
              <span className="hidden md:inline">Legal</span>
            </button>
            <span className="text-black/30 dark:text-white/30">•</span>
            <button
              onClick={navigateToPrivacyPolicy}
              className="text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white md:hover:underline transition-colors flex items-center gap-1"
            >
              <CircleOff className="w-5 h-5 md:w-3 md:h-3" />
              <span className="hidden md:inline">We Do Not Sell Your Data</span>
            </button>
          </motion.div>
        </div>

        <p className="text-[11px] md:text-[12px] text-black/60 dark:text-white/60 max-w-3xl mx-auto px-4">
          <a
            href="https://wastefull.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors underline"
          >
            Wastefull, Inc.
          </a>{" "}
          is a registered California 501(c)(3) nonprofit organization. Donations
          to the organization may be tax deductible.
        </p>
      </footer>
    </div>
  );
}
