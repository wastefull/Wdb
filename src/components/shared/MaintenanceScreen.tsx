import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

interface MaintenanceScreenProps {
  startedAt: number | null;
  onSignIn: () => void;
}

function useCountUp(startedAt: number | null): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

const MESSAGES = ["Scheduled maintenance in progress"];

export function MaintenanceScreen({
  startedAt,
  onSignIn,
}: MaintenanceScreenProps) {
  const elapsed = useCountUp(startedAt);
  const [msgIndex] = useState(() =>
    Math.floor(Math.random() * MESSAGES.length),
  );

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-[#1a1917] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Animated icon */}
        <div className="mb-8 flex justify-center">
          <div
            className="w-24 h-24 rounded-full border-4 border-[#211f1c] dark:border-white/30 bg-[--waste-compost] flex items-center justify-center"
            style={{ animation: "spin 6s linear infinite" }}
          >
            <Wrench size={40} className="text-[#211f1c]" />
          </div>
        </div>

        {/* Main card */}
        <div className="retro-card p-8 mb-6">
          <h1 className="text-2xl font-black tracking-tight mb-2">
            Under Maintenance
          </h1>
          <p className="text-sm opacity-60 mb-6">{MESSAGES[msgIndex]}</p>

          {/* Timer */}
          {startedAt && (
            <div className="bg-[#211f1c] dark:bg-white/10 rounded-lg px-6 py-4 mb-6 inline-block">
              <p className="text-sm uppercase tracking-widest opacity-50 text-white mb-1">
                Down for
              </p>
              <span className="font-mono font-black text-3xl text-[--waste-recycle] tracking-[0.15em]">
                {elapsed}
              </span>
            </div>
          )}

          <p className="text-xs opacity-50 leading-relaxed">
            We'll be back soon — thanks for your patience!
          </p>
        </div>

        {/* Sign in link */}
        <button
          onClick={onSignIn}
          className="text-xs opacity-40 hover:opacity-70 underline underline-offset-2 transition-opacity"
        >
          Admin
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
