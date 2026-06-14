import { Link, Mail } from "lucide-react";

export function SignUpView({
  email,
  setEmail,
  honeypot,
  setHoneypot,
  handleKeyDown,
  handleSendMagicLink,
  handleGoogleSignIn,
  loading,
}: {
  email: string;
  setEmail: (email: string) => void;
  honeypot: string;
  setHoneypot: (honeypot: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSendMagicLink: () => void;
  handleGoogleSignIn: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-black/50 dark:text-white/50">
        Log in or sign up with just your email
      </div>

      <div>
        <label className="text-[12px] normal block mb-1 uppercase tracking-[0.04em] text-black/70 dark:text-white/70">
          Email Address:
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
          placeholder="awesome.person@example.com"
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
      <div className="text-center text-xs text-black/50 dark:text-white/50">
        or
      </div>
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full h-10 retro-btn-primary arcade-bg-cyan arcade-btn-cyan text-[13px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
      >
        <Link size={16} />
        {loading ? "Redirecting to Google..." : "Staff login (@wastefull.org)"}
      </button>
    </div>
  );
}
