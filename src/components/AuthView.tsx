import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
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
      const data = await api.signIn(email, password);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      onAuthSuccess(data.user);
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Sign up
      const signupData = await api.signUp(email, password, name);
      toast.success(`Account created! Welcome, ${signupData.user.name || signupData.user.email}!`);
      
      // Auto sign in after signup
      const signinData = await api.signIn(email, password);
      onAuthSuccess(signinData.user);
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const data = await api.signIn('demo@wastedb.app', 'demo123');
      toast.success('Signed in as demo user');
      onAuthSuccess(data.user);
    } catch (error: any) {
      // If demo account doesn't exist, create it
      try {
        await api.signUp('demo@wastedb.app', 'demo123', 'Demo User');
        const data = await api.signIn('demo@wastedb.app', 'demo123');
        toast.success('Signed in as demo user');
        onAuthSuccess(data.user);
      } catch (createError: any) {
        console.error('Demo login error:', createError);
        toast.error('Failed to create demo account');
      }
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
          {/* Form */}
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
                className="w-full px-3 py-2 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
              />
            </div>

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
                  placeholder="At least 6 characters"
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

          {/* Demo Account */}
          <div className="mt-6 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-[#e6beb5] h-[36px] rounded-[8px] border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[13px] text-black hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Try Demo Account
            </button>
            <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 dark:text-white/50 text-center mt-2">
              Quick access with pre-configured demo data
            </p>
          </div>

          {/* Info Note */}
          <div className="mt-4 p-3 bg-[#e4e3ac]/30 dark:bg-[#e4e3ac]/10 border border-[#211f1c]/20 dark:border-white/20 rounded-[8px]">
            <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70">
              💡 No email verification needed - accounts are instantly active
            </p>
          </div>
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
