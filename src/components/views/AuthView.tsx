import { useState, useEffect } from "react";
import { Mail, ArrowLeft, Link } from "lucide-react";
import * as api from "../../utils/api";
import { toast } from "sonner";
import { logEnvironmentInfo } from "../../utils/environment";
import { logger } from "../../utils/logger";
import { StatusBar } from "../layout/StatusBar";

interface AuthViewProps {
  onAuthSuccess: (user: { id: string; email: string; name?: string }) => void;
  onClose?: () => void;
}

export function AuthView({ onAuthSuccess, onClose }: AuthViewProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // Anti-bot honeypot field
  const [authMode, setAuthMode] = useState<"magic-link" | "magic-link-sent">(
    "magic-link",
  );

  // Log environment info on mount
  useEffect(() => {
    logEnvironmentInfo();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent browser from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSendMagicLink = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await api.sendMagicLink(email, honeypot);
      toast.success("Magic link sent! Check your email.");
      setAuthMode("magic-link-sent");
    } catch (error: any) {
      logger.error("Magic link error:", error);

      const errorMsg = error.message || "Failed to send magic link";
      if (errorMsg.includes("Rate limit")) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMagicLink = async (token: string) => {
    setLoading(true);
    try {
      const data = await api.verifyMagicLink(token);
      toast.success(`Welcome, ${data.user.name || data.user.email}!`);
      onAuthSuccess(data.user);
    } catch (error: any) {
      logger.error("Magic link verification error:", error);
      toast.error(error.message || "Failed to verify magic link");
      setAuthMode("magic-link");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await api.startGoogleOAuthSignIn();
    } catch (error: any) {
      logger.error("Google OAuth start error:", error);
      toast.error(error.message || "Failed to start Google sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Auth Window */}
        <div className="retro-card overflow-hidden backdrop-blur-md bg-white/70! dark:bg-[#2a2825]/70!">
          {/* Mini Status Bar */}
          <StatusBar variant="mini" title="Welcome back!" onClose={onClose} />

          {/* Form Content */}
          <div className="p-6 bg-[#faf7f2]/90 dark:bg-[#2a2825]/90">
            {authMode === "magic-link-sent" ? (
              <div className="text-center space-y-3">
                <div className="p-5 bg-waste-recycle/30 dark:bg-waste-recycle/10 border border-[#211f1c]/20 dark:border-white/20 rounded-xl">
                  <Mail size={28} className="mx-auto mb-2 normal" />
                  <h3 className="text-[14px] normal mb-2">Magic Link Sent!</h3>
                  <p className="text-[12px] text-black/70 dark:text-white/70 mb-3">
                    We've sent a secure sign-in link to <strong>{email}</strong>
                    . Click the link in your email to sign in instantly.
                  </p>
                  <p className="text-[10px] text-black/50 dark:text-white/50">
                    The link will expire in 1 hour for security.
                  </p>
                </div>

                <button
                  onClick={() => setAuthMode("magic-link")}
                  className="w-full h-9 retro-btn-primary arcade-bg-cyan arcade-btn-cyan text-[12px] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} />
                  Send Another Link
                </button>
              </div>
            ) : authMode === "magic-link" ? (
              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-10 retro-btn-primary arcade-bg-cyan arcade-btn-cyan text-[13px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  <Link size={16} />
                  {loading
                    ? "Redirecting to Google..."
                    : "Continue with Google (@wastefull.org)"}
                </button>

                <div className="text-center text-[10px] text-black/50 dark:text-white/50">
                  or use a one-time magic link
                </div>

                <div>
                  <label className="text-[12px] normal block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDownCapture={handleKeyDown}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMagicLink();
                      }
                    }}
                    placeholder="you@example.com"
                    className="retro-input"
                  />
                </div>

                {/* Honeypot field - hidden from users, catches bots */}
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                  }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <button
                  onClick={handleSendMagicLink}
                  disabled={loading}
                  className="w-full h-10 retro-btn-primary arcade-bg-amber arcade-btn-amber text-[13px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  {loading ? "Sending..." : "Send Magic Link"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
