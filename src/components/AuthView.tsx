import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, Shield, Mail, ArrowLeft } from 'lucide-react';
import * as api from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface AuthViewProps {
  onAuthSuccess: (user: { id: string; email: string; name?: string }) => void;
}

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot field
  const [authMode, setAuthMode] = useState<'traditional' | 'magic-link' | 'magic-link-sent'>('magic-link');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent Figma from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const data = await api.signIn(email, password, honeypot);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      onAuthSuccess(data.user);
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Display user-friendly error messages
      const errorMsg = error.message || 'Failed to sign in';
      if (errorMsg.includes('Rate limit')) {
        toast.error('Too many attempts. Please wait a moment and try again.');
      } else if (errorMsg.includes('failed login')) {
        toast.error('Too many failed attempts. Account temporarily locked.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // Sign up
      const signupData = await api.signUp(email, password, name, honeypot);
      
      // Check for @wastefull.org email
      const isOrgEmail = email.toLowerCase().endsWith('@wastefull.org');
      if (isOrgEmail) {
        toast.success(`Admin account created! Welcome, ${signupData.user.name || signupData.user.email}!`);
      } else {
        toast.success(`Account created! Welcome, ${signupData.user.name || signupData.user.email}!`);
      }
      
      // Auto sign in after signup
      const signinData = await api.signIn(email, password, honeypot);
      onAuthSuccess(signinData.user);
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Display user-friendly error messages
      const errorMsg = error.message || 'Failed to sign up';
      if (errorMsg.includes('Rate limit')) {
        toast.error('Too many signup attempts. Please try again later.');
      } else if (errorMsg.includes('too weak')) {
        toast.error('Password is too weak. Please use a stronger password.');
      } else if (errorMsg.includes('already created')) {
        toast.error('Account already exists. Please try signing in instead.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await api.sendMagicLink(email, honeypot);
      toast.success('Magic link sent! Check your email.');
      setAuthMode('magic-link-sent');
    } catch (error: any) {
      console.error('Magic link error:', error);
      
      const errorMsg = error.message || 'Failed to send magic link';
      if (errorMsg.includes('Rate limit')) {
        toast.error('Too many requests. Please wait a moment and try again.');
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
      console.error('Magic link verification error:', error);
      toast.error(error.message || 'Failed to verify magic link');
      setAuthMode('magic-link');
      setDevMagicToken(null);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#faf7f2] dark:bg-[#1a1917]"
      style={{
        backgroundImage: `url("https://www.transparenttextures.com/patterns/3px-tile.png")`,
        backgroundSize: '3px 3px'
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-['Sniglet:Regular',_sans-serif] text-[32px] text-black dark:text-white mb-2 uppercase">
            WasteDB
          </h1>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/60 dark:text-white/60">
            Material Sustainability Database
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-8">
          {/* Security Notice */}
          <div className="mb-6 p-3 bg-[#b8c8cb]/20 dark:bg-[#b8c8cb]/10 border border-[#211f1c]/20 dark:border-white/20 rounded-[8px]">
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-black dark:text-white mt-0.5 shrink-0" />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/70 dark:text-white/70">
                Protected by rate limiting & anti-abuse measures
              </p>
            </div>
          </div>

          {/* Auth Mode Toggle */}
          {authMode !== 'magic-link-sent' && (
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setAuthMode('magic-link')}
                className={`flex-1 h-[32px] rounded-[6px] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-all flex items-center justify-center gap-1 ${
                  authMode === 'magic-link' 
                    ? 'bg-[#e4e3ac] text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]'
                    : 'bg-white dark:bg-[#1a1917] text-black dark:text-white hover:bg-[#e4e3ac] dark:hover:bg-[#e4e3ac]/20'
                }`}
              >
                <Mail size={14} />
                Magic Link
              </button>
              <button
                onClick={() => setAuthMode('traditional')}
                className={`flex-1 h-[32px] rounded-[6px] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-all flex items-center justify-center gap-1 ${
                  authMode === 'traditional'
                    ? 'bg-[#b8c8cb] text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]'
                    : 'bg-white dark:bg-[#1a1917] text-black dark:text-white hover:bg-[#b8c8cb] dark:hover:bg-[#b8c8cb]/20'
                }`}
              >
                <LogIn size={14} />
                Password
              </button>
            </div>
          )}

          {/* Form */}
          {authMode === 'magic-link-sent' ? (
            <div className="text-center space-y-4">
              <div className="p-6 bg-[#e4e3ac]/30 dark:bg-[#e4e3ac]/10 border border-[#211f1c]/20 dark:border-white/20 rounded-[8px]">
                <Mail size={32} className="mx-auto mb-3 text-black dark:text-white" />
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-2">
                  Magic Link Sent!
                </h3>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/70 dark:text-white/70 mb-4">
                  We've sent a secure sign-in link to <strong>{email}</strong>.
                  Click the link in your email to sign in instantly.
                </p>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 dark:text-white/50">
                  The link will expire in 1 hour for security.
                </p>
              </div>
              
              <button
                onClick={() => setAuthMode('magic-link')}
                className="w-full bg-[#b8c8cb] h-[36px] rounded-[8px] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[13px] text-black hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} />
                Send Another Link
              </button>
            </div>
          ) : authMode === 'magic-link' ? (
            <div className="space-y-4">
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDownCapture={handleKeyDown}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMagicLink();
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                />
                <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/50 dark:text-white/50 mt-1">
                  Use @wastefull.org email for admin access
                </p>
              </div>

              {/* Honeypot field - hidden from users, catches bots */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* Magic Link Info */}
              <div className="p-3 bg-[#e4e3ac]/30 dark:bg-[#e4e3ac]/10 border border-[#211f1c]/20 dark:border-white/20 rounded-[8px]">
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70">
                  ✨ No password needed! We'll send a secure sign-in link to your email.
                </p>
              </div>

              <button
                onClick={handleSendMagicLink}
                disabled={loading}
                className="w-full bg-[#e4e3ac] h-[44px] rounded-[8px] border border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[15px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white block mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDownCapture={handleKeyDown}
                  placeholder="Your name"
                  className="w-full px-3 py-2 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                />
                <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/50 dark:text-white/50 mt-1">
                  Only used when creating a new account
                </p>
              </div>

              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDownCapture={handleKeyDown}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 outline-none focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                />
                <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/50 dark:text-white/50 mt-1">
                  Use @wastefull.org email for admin access
                </p>
              </div>

              {/* Honeypot field - hidden from users, catches bots */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDownCapture={handleKeyDown}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSignIn();
                      }
                    }}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
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

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="flex-1 bg-[#b8c8cb] h-[44px] rounded-[8px] border border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[15px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  {loading ? 'Loading...' : 'Sign In'}
                </button>
                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="flex-1 bg-[#e4e3ac] h-[44px] rounded-[8px] border border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[15px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  {loading ? 'Loading...' : 'Sign Up'}
                </button>
              </div>
            </div>
          )}


        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 dark:text-white/50">
            Your data is securely stored with Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
