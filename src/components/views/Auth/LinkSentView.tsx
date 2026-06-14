import { ArrowLeft, Mail } from "lucide-react";
export function LinkSentView({
  email,
  onResend,
}: {
  email: string;
  onResend: () => void;
}) {
  return (
    
    <div className="text-center space-y-3">
      <div className="p-5 bg-waste-recycle/30 dark:bg-waste-recycle/10 border border-[#211f1c]/20 dark:border-white/20 rounded-xl">
        <Mail size={28} className="mx-auto mb-2 normal" />
        <h3 className="text-[14px] normal mb-2">Magic Link Sent!</h3>
        <p className="text-[12px] text-black/70 dark:text-white/70 mb-3">
          We've sent a secure sign-in link to <strong>{email}</strong>. Click
          the link in your email to sign in instantly.
        </p>
        <p className="text-xs text-black/50 dark:text-white/50">
          The link will expire in 1 hour for security.
        </p>
      </div>

      <button
        onClick={onResend}
        className="w-full h-9 retro-btn-primary arcade-bg-cyan arcade-btn-cyan text-[12px] flex items-center justify-center gap-2"
      >
        <ArrowLeft size={14} />
        Send Another Link
      </button>
    </div>
  );
}
