import { useState, useEffect } from "react";
import * as api from "../../utils/api";
import { toast } from "sonner";
import { logEnvironmentInfo } from "../../utils/environment";
import { logger } from "../../utils/logger";
import { LinkSentView } from "./Auth/LinkSentView";
import { SignUpView } from "./Auth/SignUpView";
import { Modal } from "../shared";
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
    <Modal
      onClose={onClose || (() => {})}
      children={
        <>
          {authMode === "magic-link-sent" ? (
            <LinkSentView
              email={email}
              onResend={() => setAuthMode("magic-link")}
            />
          ) : authMode === "magic-link" ? (
            <SignUpView
              email={email}
              setEmail={setEmail}
              honeypot={honeypot}
              setHoneypot={setHoneypot}
              handleKeyDown={handleKeyDown}
              handleSendMagicLink={handleSendMagicLink}
              handleGoogleSignIn={handleGoogleSignIn}
              loading={loading}
            />
          ) : null}
        </>
      }
    ></Modal>
  );
}
