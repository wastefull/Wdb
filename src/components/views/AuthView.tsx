import { useState, useEffect } from "react";
import { LogIn, UserPlus, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import * as api from "../../utils/api";
import { toast } from "sonner";
import { isDevelopment, logEnvironmentInfo } from "../../utils/environment";
import { logger } from "../../utils/logger";
import { StatusBar } from "../layout/StatusBar";

interface AuthViewProps {
  onAuthSuccess: (user: { id: string; email: string; name?: string }) => void;
  onClose?: () => void;
}

export function AuthView({ onAuthSuccess, onClose }: AuthViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // Anti-bot honeypot field
  // Detect environment and set initial auth mode
  const showPasswordAuth = isDevelopment();
  const [authMode, setAuthMode] = useState<
    "traditional" | "magic-link" | "magic-link-sent"
  >(showPasswordAuth ? "traditional" : "magic-link");

  // Log environment info on mount
  useEffect(() => {
    logEnvironmentInfo();
    logger.log("Auth View - Password auth enabled:", showPasswordAuth);
    logger.log(
      "🔐 Initial auth mode:",
      showPasswordAuth ? "traditional" : "magic-link"
    );
  }, [showPasswordAuth]);

  // Auto-redirect to correct mode based on environment
  useEffect(() => {
    if (showPasswordAuth && authMode === "magic-link") {
      // In development, default to password
      logger.log("Development environment - using Password auth");
      setAuthMode("traditional");
    } else if (!showPasswordAuth && authMode === "traditional") {
      // In production, default to magic link
      logger.log("Production environment - switching to Magic Link auth");
      setAuthMode("magic-link");
    }
  }, [showPasswordAuth, authMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent browser from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const data = await api.signIn(email, password, honeypot);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      onAuthSuccess(data.user);
    } catch (error: any) {
      console.error("Sign in error:", error);

      // Display user-friendly error messages
      const errorMsg = error.message || "Failed to sign in";
      if (errorMsg.includes("confirm your email")) {
        toast.error(
          "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
          {
            duration: 6000,
          }
        );
      } else if (errorMsg.includes("Rate limit")) {
        toast.error("Too many attempts. Please wait a moment and try again.");
      } else if (errorMsg.includes("failed login")) {
        toast.error("Too many failed attempts. Account temporarily locked.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      // Sign up
      const signupData = await api.signUp(email, password, name, honeypot);

      // Show confirmation message
      toast.success(
        "Account created! Please check your email to confirm your account.",
        {
          duration: 6000,
        }
      );

      // Clear form
      setEmail("");
      setPassword("");
      setName("");

      // Note: Do NOT auto sign-in - user must confirm email first
    } catch (error: any) {
      console.error("Sign up error:", error);

      // Display user-friendly error messages
      const errorMsg = error.message || "Failed to sign up";
      if (errorMsg.includes("Rate limit")) {
        toast.error("Too many signup attempts. Please try again later.");
      } else if (errorMsg.includes("too weak")) {
        toast.error("Password is too weak. Please use a stronger password.");
      } else if (errorMsg.includes("already created")) {
        toast.error("Account already exists. Please try signing in instead.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
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
      console.error("Magic link error:", error);

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
      console.error("Magic link verification error:", error);
      toast.error(error.message || "Failed to verify magic link");
      setAuthMode("magic-link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Auth Window */}
        <div className="retro-card overflow-hidden backdrop-blur-md !bg-white/70 dark:!bg-[#2a2825]/70">
          {/* Mini Status Bar */}
          <StatusBar variant="mini" title="Welcome back!" onClose={onClose} />

          {/* Form Content */}
          <div className="p-6 bg-[#faf7f2]/90 dark:bg-[#2a2825]/90">
            {authMode === "magic-link-sent" ? (
              <div className="text-center space-y-3">
                <div className="p-5 bg-[#e4e3ac]/30 dark:bg-[#e4e3ac]/10 border border-[#211f1c]/20 dark:border-white/20 rounded-[8px]">
                  <Mail
                    size={28}
                    className="mx-auto mb-2 text-black dark:text-white"
                  />
                  <h3 className="text-[14px] text-black dark:text-white mb-2">
                    Magic Link Sent!
                  </h3>
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
                  className="w-full h-[36px] retro-btn-primary arcade-bg-cyan arcade-btn-cyan text-[12px] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} />
                  Send Another Link
                </button>
              </div>
            ) : authMode === "magic-link" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] text-black dark:text-white block mb-1">
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
                  className="w-full h-[40px] retro-btn-primary arcade-bg-amber arcade-btn-amber text-[13px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  {loading ? "Sending..." : "Send Magic Link"}
                </button>
              </div>
            ) : authMode === "traditional" && showPasswordAuth ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] text-black dark:text-white block mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDownCapture={handleKeyDown}
                    placeholder="Your name"
                    className="retro-input"
                  />
                  <p className="text-[9px] text-black/50 dark:text-white/50 mt-1">
                    Only used when creating a new account
                  </p>
                </div>

                <div>
                  <label className="text-[12px] text-black dark:text-white block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDownCapture={handleKeyDown}
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

                <div>
                  <label className="text-[12px] text-black dark:text-white block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDownCapture={handleKeyDown}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSignIn();
                        }
                      }}
                      placeholder="At least 8 characters"
                      className="retro-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Email Confirmation Notice */}
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-[8px]">
                  <p className="text-[10px] text-blue-800 dark:text-blue-200">
                    New accounts require email confirmation. You'll receive a
                    confirmation link after signing up.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="flex-1 h-[40px] retro-btn-primary arcade-bg-cyan arcade-btn-cyan text-[13px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <LogIn size={16} />
                    {loading ? "Loading..." : "Sign In"}
                  </button>
                  <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="flex-1 h-[40px] retro-btn-primary arcade-bg-amber arcade-btn-amber text-[13px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} />
                    {loading ? "Loading..." : "Sign Up"}
                  </button>
                </div>
              </div>
            ) : (
              /* Fallback: If password auth is disabled but mode is traditional, show magic link */
              <div className="space-y-3">
                <div className="p-3 bg-[#e4e3ac]/40 dark:bg-[#e4e3ac]/20 border-2 border-[#211f1c]/30 dark:border-white/30 rounded-[8px]">
                  <p className="text-[11px] text-black dark:text-white text-center mb-2">
                    Password authentication is not available in production.
                  </p>
                  <button
                    onClick={() => setAuthMode("magic-link")}
                    className="w-full h-[36px] retro-btn-primary arcade-bg-amber arcade-btn-amber text-[12px] flex items-center justify-center gap-2"
                  >
                    <Mail size={14} />
                    Use Magic Link Instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
