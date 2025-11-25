import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookie-consent');
    if (!hasConsented) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="bg-[#b8c8cb] dark:bg-[#2a2a2a] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[4px_5px_0px_-1px_#000000] dark:shadow-[4px_5px_0px_-1px_rgba(255,255,255,0.2)] p-4">
            <div className="flex items-start gap-3">
              <Cookie className="text-black dark:text-white mt-1 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white mb-3">
                  We use cookies for authentication to keep you signed in. By continuing to use WasteDB, you consent to our use of cookies.
                </p>
                <button
                  onClick={handleAccept}
                  className="bg-[#e8a593] dark:bg-[#e8a593] h-[36px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
