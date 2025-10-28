import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

// WasteDB Server - v1.1.0 (Hardened Security)
const app = new Hono();

// Add logger middleware
app.use('*', logger(console.log));

// ==================== SECURITY MIDDLEWARE ====================

// Rate limiting configuration
const RATE_LIMITS = {
  AUTH: { window: 60000, maxRequests: 5 }, // 5 auth requests per minute
  API: { window: 60000, maxRequests: 100 }, // 100 API requests per minute
  SIGNUP: { window: 3600000, maxRequests: 3 }, // 3 signups per hour per IP
};

// Get client identifier (IP + User-Agent hash)
function getClientId(c: any): string {
  const forwarded = c.req.header('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';
  // Simple hash to avoid storing full user agents
  const uaHash = userAgent.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `${ip}:${uaHash}`;
}

// Rate limiting middleware factory
function rateLimit(type: keyof typeof RATE_LIMITS) {
  return async (c: any, next: any) => {
    const clientId = getClientId(c);
    const key = `ratelimit:${type}:${clientId}`;
    const now = Date.now();
    
    try {
      // Get existing rate limit data
      const data = await kv.get(key) as { requests: number[], firstRequest: number } | null;
      
      const limit = RATE_LIMITS[type];
      const windowStart = now - limit.window;
      
      if (data) {
        // Filter out old requests outside the time window
        const recentRequests = data.requests.filter(timestamp => timestamp > windowStart);
        
        if (recentRequests.length >= limit.maxRequests) {
          const oldestRequest = Math.min(...recentRequests);
          const resetIn = Math.ceil((oldestRequest + limit.window - now) / 1000);
          
          console.log(`Rate limit exceeded for ${clientId} on ${type}: ${recentRequests.length}/${limit.maxRequests}`);
          
          return c.json({ 
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: resetIn 
          }, 429);
        }
        
        // Add current request
        recentRequests.push(now);
        await kv.set(key, { requests: recentRequests, firstRequest: data.firstRequest });
      } else {
        // First request in window
        await kv.set(key, { requests: [now], firstRequest: now });
      }
      
      await next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - don't block on rate limit errors
      await next();
    }
  };
}

// Email domain validation
const ALLOWED_EMAIL_PATTERNS = [
  /@wastefull\.org$/i,  // Official organization emails
  /@wastedb\.app$/i,    // Demo/testing emails
  /.+@.+\..+/,          // Any valid email for regular users (will be non-admin)
];

function validateEmail(email: string): { valid: boolean; isOrgEmail: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, isOrgEmail: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic format validation
  if (!/.+@.+\..+/.test(trimmedEmail)) {
    return { valid: false, isOrgEmail: false, error: 'Invalid email format' };
  }
  
  // Check for suspicious patterns
  if (trimmedEmail.includes('..') || trimmedEmail.includes('+') && trimmedEmail.split('+').length > 2) {
    return { valid: false, isOrgEmail: false, error: 'Email contains suspicious patterns' };
  }
  
  // Validate length
  if (trimmedEmail.length > 254) {
    return { valid: false, isOrgEmail: false, error: 'Email is too long' };
  }
  
  // Check if it's an organization email
  const isOrgEmail = /@wastefull\.org$/i.test(trimmedEmail);
  
  return { valid: true, isOrgEmail };
}

// Password strength validation
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwertyui', 'admin123', 'letmein1'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { valid: false, error: 'Password is too weak. Please choose a stronger password.' };
  }
  
  return { valid: true };
}

// Honeypot validation (checks for bot-submitted hidden field)
function checkHoneypot(honeypot: any): boolean {
  // If honeypot field is filled, it's likely a bot
  return !honeypot || honeypot === '';
}

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Session-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==================== STORAGE INITIALIZATION ====================

// Initialize Supabase Storage buckets on startup
async function initializeStorage() {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const bucketName = 'make-17cae920-assets';

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // Create public bucket for assets (logo, images, etc.)
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
      });

      if (error) {
        console.error('Error creating storage bucket:', error);
      } else {
        console.log(`✅ Created public storage bucket: ${bucketName}`);
      }
    } else {
      console.log(`✅ Storage bucket already exists: ${bucketName}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize storage on server startup
initializeStorage();

// Middleware to verify authentication
async function verifyAuth(c: any, next: any) {
  // Check for custom session token in X-Session-Token header
  const sessionToken = c.req.header('X-Session-Token');
  console.log('verifyAuth: X-Session-Token header:', sessionToken ? `${sessionToken.substring(0, 8)}...` : 'missing');
  
  // If no session token, check Authorization header for backward compatibility
  if (!sessionToken) {
    const authHeader = c.req.header('Authorization');
    console.log('verifyAuth: Authorization header:', authHeader ? `Bearer ${authHeader.split(' ')[1]?.substring(0, 8)}...` : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('verifyAuth: Missing or invalid Authorization header');
      return c.json({ error: 'Unauthorized - missing token' }, 401);
    }

    const token = authHeader.split(' ')[1];
    console.log('verifyAuth: Token extracted:', token.substring(0, 8) + '...');
    
    // Skip verification for public anon key (for backward compatibility during development)
    const publicAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (token === publicAnonKey) {
      console.log('verifyAuth: Using public anon key (skipping verification)');
      await next();
      return;
    }
  }
  
  const token = sessionToken || c.req.header('Authorization')?.split(' ')[1] || '';

  try {
    // First, check if this is a custom session token (magic link)
    console.log('verifyAuth: Checking for custom session token in KV...');
    console.log(`verifyAuth: Looking up key: session:${token}`);
    const sessionData = await kv.get(`session:${token}`) as {
      userId: string;
      email: string;
      expiry: number;
      createdAt: number;
    } | null;
    
    console.log('verifyAuth: Session data found:', sessionData ? `userId: ${sessionData.userId}, email: ${sessionData.email}, expiry: ${new Date(sessionData.expiry).toISOString()}` : 'null');
    if (!sessionData) {
      console.log('verifyAuth: No session found in KV for this token');
    }
    
    if (sessionData) {
      // Verify session hasn't expired
      if (Date.now() > sessionData.expiry) {
        console.log('verifyAuth: Session expired');
        await kv.del(`session:${token}`);
        return c.json({ error: 'Session expired - please sign in again' }, 401);
      }
      
      // Session is valid - set context and continue
      console.log('verifyAuth: Session valid, setting context');
      c.set('userId', sessionData.userId);
      c.set('userEmail', sessionData.email);
      await next();
      return;
    }
    
    // If not a custom session, try Supabase JWT token (for backward compatibility)
    console.log('verifyAuth: No custom session, trying Supabase JWT...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('verifyAuth: Supabase JWT validation failed:', error);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }
    
    // Store user ID and email in context for use in route handlers
    console.log('verifyAuth: Supabase JWT valid, user:', user.email);
    c.set('userId', user.id);
    c.set('userEmail', user.email);
    await next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return c.json({ error: 'Unauthorized - verification failed' }, 401);
  }
}

// Middleware to verify admin role
async function verifyAdmin(c: any, next: any) {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized - authentication required' }, 401);
  }
  
  try {
    // Get user role from KV store
    const userRole = await kv.get(`user_role:${userId}`);
    
    // If no role is set, check if this is an admin email
    if (!userRole) {
      // Initialize role for natto@wastefull.org as admin
      if (userEmail === 'natto@wastefull.org') {
        await kv.set(`user_role:${userId}`, 'admin');
        c.set('userRole', 'admin');
        await next();
        return;
      }
      // Default role is 'user'
      await kv.set(`user_role:${userId}`, 'user');
      return c.json({ error: 'Forbidden - admin role required' }, 403);
    }
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden - admin role required' }, 403);
    }
    
    c.set('userRole', userRole);
    await next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return c.json({ error: 'Authorization check failed', details: String(error) }, 500);
  }
}

// Health check endpoint (public)
app.get("/make-server-17cae920/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint (public, rate-limited)
app.post("/make-server-17cae920/auth/signup", rateLimit('SIGNUP'), async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, honeypot } = body;
    
    // Check honeypot (anti-bot)
    if (!checkHoneypot(honeypot)) {
      console.log('Honeypot triggered for signup attempt');
      // Return success to not alert bots
      return c.json({ 
        user: { id: 'blocked', email: 'blocked', name: 'blocked' } 
      });
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return c.json({ error: emailValidation.error || 'Invalid email' }, 400);
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.error || 'Invalid password' }, 400);
    }
    
    // Check for duplicate signups from same IP (additional anti-abuse)
    const clientId = getClientId(c);
    const recentSignupsKey = `recent_signups:${clientId}`;
    const recentSignups = await kv.get(recentSignupsKey) as string[] | null;
    
    if (recentSignups && recentSignups.includes(email.toLowerCase())) {
      return c.json({ error: 'Account already created from this location' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create user with admin API
    // Note: Email confirmation is required. Users must verify their email before signing in.
    // Configure email templates in Supabase Dashboard > Authentication > Email Templates
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      user_metadata: { 
        name: name || email.split('@')[0],
        isOrgEmail: emailValidation.isOrgEmail,
        signupIp: getClientId(c).split(':')[0],
        signupTimestamp: new Date().toISOString()
      },
      // Require email confirmation for security
      email_confirm: false,
    });

    if (error) {
      console.error('Signup error:', error);
      
      // Don't reveal if user already exists (security best practice)
      if (error.message?.includes('already registered')) {
        return c.json({ error: 'Unable to create account. Please try signing in instead.' }, 400);
      }
      
      return c.json({ error: 'Failed to create account. Please try again.' }, 400);
    }
    
    // Track recent signup
    const updatedSignups = recentSignups ? [...recentSignups, email.toLowerCase()] : [email.toLowerCase()];
    await kv.set(recentSignupsKey, updatedSignups.slice(-10)); // Keep last 10
    
    // Initialize user role (users default to 'user', @wastefull.org gets 'admin')
    const initialRole = emailValidation.isOrgEmail ? 'admin' : 'user';
    await kv.set(`user_role:${data.user.id}`, initialRole);
    
    // Initialize user profile
    const initialProfile = {
      user_id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      bio: '',
      social_link: '',
      avatar_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await kv.set(`user_profile:${data.user.id}`, initialProfile);
    
    console.log(`New user created: ${email} (role: ${initialRole}) - awaiting email confirmation`);

    return c.json({ 
      user: { 
        id: data.user.id, 
        email: data.user.email,
        name: data.user.user_metadata?.name 
      },
      message: 'Account created! Please check your email to confirm your account before signing in.' 
    });
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({ error: 'Server error during signup. Please try again.' }, 500);
  }
});

// Sign in endpoint (public, rate-limited)
app.post("/make-server-17cae920/auth/signin", rateLimit('AUTH'), async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, honeypot } = body;
    
    // Check honeypot (anti-bot)
    if (!checkHoneypot(honeypot)) {
      console.log('Honeypot triggered for signin attempt');
      // Delay response to slow down bots
      await new Promise(resolve => setTimeout(resolve, 2000));
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Track failed login attempts per email
    const failedAttemptsKey = `failed_logins:${email.toLowerCase()}`;
    const failedAttempts = await kv.get(failedAttemptsKey) as { count: number, lastAttempt: number } | null;
    
    // Lock account after 5 failed attempts within 15 minutes
    if (failedAttempts && failedAttempts.count >= 5) {
      const lockDuration = 15 * 60 * 1000; // 15 minutes
      const timeSinceLastAttempt = Date.now() - failedAttempts.lastAttempt;
      
      if (timeSinceLastAttempt < lockDuration) {
        const remainingMinutes = Math.ceil((lockDuration - timeSinceLastAttempt) / 60000);
        console.log(`Account locked: ${email} (${failedAttempts.count} failed attempts)`);
        return c.json({ 
          error: `Too many failed login attempts. Please try again in ${remainingMinutes} minute(s).` 
        }, 429);
      } else {
        // Reset after lock duration
        await kv.del(failedAttemptsKey);
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      console.error('Signin error:', error);
      
      // Check if the error is due to unconfirmed email
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        // Don't track as failed attempt for unconfirmed emails
        return c.json({ 
          error: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.',
          code: 'EMAIL_NOT_CONFIRMED'
        }, 403);
      }
      
      // Track failed attempt
      const newCount = failedAttempts ? failedAttempts.count + 1 : 1;
      await kv.set(failedAttemptsKey, { count: newCount, lastAttempt: Date.now() });
      
      // Use generic error message to prevent user enumeration
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    
    // Additional check: verify user's email is confirmed
    if (data.user && !data.user.email_confirmed_at) {
      console.log(`Sign in blocked for unconfirmed email: ${email}`);
      return c.json({ 
        error: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.',
        code: 'EMAIL_NOT_CONFIRMED'
      }, 403);
    }
    
    // Clear failed attempts on successful login
    await kv.del(failedAttemptsKey);
    
    // Log successful login
    console.log(`Successful login: ${email}`);

    return c.json({ 
      access_token: data.session.access_token,
      user: { 
        id: data.user.id, 
        email: data.user.email,
        name: data.user.user_metadata?.name 
      } 
    });
  } catch (error) {
    console.error('Signin exception:', error);
    return c.json({ error: 'Server error during signin. Please try again.' }, 500);
  }
});

// Send magic link (public, rate-limited)
app.post("/make-server-17cae920/auth/magic-link", rateLimit('AUTH'), async (c) => {
  try {
    const body = await c.req.json();
    const { email, honeypot } = body;
    
    // Check honeypot (anti-bot)
    if (!checkHoneypot(honeypot)) {
      console.log('Honeypot triggered for magic link attempt');
      // Delay response to slow down bots
      await new Promise(resolve => setTimeout(resolve, 2000));
      return c.json({ error: 'Invalid request' }, 400);
    }
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return c.json({ error: emailValidation.error || 'Invalid email' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const trimmedEmail = email.toLowerCase().trim();
    
    // Generate a secure random token
    const magicToken = crypto.randomUUID();
    const tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour from now
    
    // Store the magic link token with expiry
    await kv.set(`magic_token:${magicToken}`, {
      email: trimmedEmail,
      expiry: tokenExpiry,
      used: false
    });
    
    // Generate magic link pointing to the frontend app
    // In production, this should be https://db.wastefull.org
    const appUrl = Deno.env.get('APP_URL') || 'https://db.wastefull.org';
    const magicLink = `${appUrl}?magic_token=${magicToken}`;
    
    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return c.json({ error: 'Email service not configured. Please contact support.' }, 500);
    }
    
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'WasteDB <auth@wastefull.org>',
          to: [trimmedEmail],
          subject: 'Your WasteDB Magic Link',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <div style="background: white; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 15px;">
                    <h1 style="color: #65a30d; margin: 0; font-size: 32px; font-family: 'Comic Sans MS', cursive, sans-serif;">Wastefull</h1>
                  </div>
                  <p style="color: white; margin: 10px 0 0 0; font-weight: 600;">Materials Database & Sustainability Scoring</p>
                </div>
                
                <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #1f2937; margin-top: 0;">Sign in to WasteDB</h2>
                  
                  <p style="color: #4b5563; font-size: 16px;">
                    Click the button below to securely sign in to your WasteDB account. This link will expire in <strong>1 hour</strong>.
                  </p>
                  
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${magicLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                      Sign In to WasteDB
                    </a>
                  </div>
                  
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 25px 0;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                      <strong>Security tip:</strong> This link can only be used once. If you didn't request this email, you can safely ignore it.
                    </p>
                  </div>
                  
                  <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <span style="word-break: break-all; color: #667eea;">${magicLink}</span>
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                  <p>WasteDB - Sustainable Materials Intelligence</p>
                  <p style="margin: 5px 0;">This email was sent to ${trimmedEmail}</p>
                </div>
              </body>
            </html>
          `,
        }),
      });
      
      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error('Resend API error:', errorData);
        throw new Error(`Failed to send email: ${emailResponse.status}`);
      }
      
      const emailData = await emailResponse.json();
      console.log(`Magic link email sent to ${trimmedEmail} (Resend ID: ${emailData.id})`);
      
      return c.json({ 
        message: 'Magic link sent successfully',
        email: trimmedEmail
      });
    } catch (emailError) {
      console.error('Error sending magic link email:', emailError);
      // Still log to console for debugging
      console.log(`Fallback: Magic link for ${trimmedEmail}: ${magicLink}`);
      return c.json({ error: 'Failed to send email. Please try again or contact support.' }, 500);
    }
  } catch (error) {
    console.error('Magic link exception:', error);
    return c.json({ error: 'Server error sending magic link. Please try again.' }, 500);
  }
});

// Verify magic link token (public)
app.post("/make-server-17cae920/auth/verify-magic-link", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;
    
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    // Get the magic link token data
    const tokenData = await kv.get(`magic_token:${token}`) as {
      email: string;
      expiry: number;
      used: boolean;
    } | null;

    if (!tokenData) {
      return c.json({ error: 'Invalid or expired magic link' }, 401);
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiry) {
      await kv.del(`magic_token:${token}`);
      return c.json({ error: 'Magic link has expired' }, 401);
    }

    // Check if token has already been used
    if (tokenData.used) {
      return c.json({ error: 'Magic link has already been used' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const trimmedEmail = tokenData.email;
    let userData;

    // Check if user exists by listing users with email filter
    const { data: listResult, error: getUserError } = await supabase.auth.admin.listUsers();
    const existingUser = listResult?.users?.find(u => u.email === trimmedEmail);
    
    if (existingUser) {
      // User exists
      userData = { user: existingUser };
      console.log(`Existing user found for magic link: ${trimmedEmail}`);
    } else {
      // User doesn't exist, create them
      console.log(`User not found, creating new user for: ${trimmedEmail}`);
      const emailValidation = validateEmail(trimmedEmail);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: trimmedEmail,
        user_metadata: { 
          name: trimmedEmail.split('@')[0],
          isOrgEmail: emailValidation.isOrgEmail,
          signupTimestamp: new Date().toISOString(),
          authMethod: 'magic-link'
        },
        // Magic links auto-confirm since clicking the link verifies email ownership
        email_confirm: true,
      });
      
      if (createError) {
        console.error('Error creating user for magic link:', createError);
        
        // If user already exists (race condition), try to get them again
        if (createError.message?.includes('already been registered') || createError.code === 'email_exists') {
          const { data: retryListResult } = await supabase.auth.admin.listUsers();
          const retryUser = retryListResult?.users?.find(u => u.email === trimmedEmail);
          if (retryUser) {
            userData = { user: retryUser };
            console.log(`User found on retry: ${trimmedEmail}`);
          } else {
            return c.json({ error: 'Failed to retrieve existing account.' }, 400);
          }
        } else {
          return c.json({ error: 'Failed to create account. Please try again.' }, 400);
        }
      } else {
        userData = newUser;
        
        // Initialize user role
        const initialRole = emailValidation.isOrgEmail ? 'admin' : 'user';
        await kv.set(`user_role:${userData.user.id}`, initialRole);
        console.log(`New magic link user created: ${trimmedEmail} (role: ${initialRole})`);
      }
    }
    
    // Ensure user role is set (in case it's an existing user without a role)
    const existingRole = await kv.get(`user_role:${userData.user.id}`);
    if (!existingRole) {
      const emailValidation = validateEmail(trimmedEmail);
      const initialRole = emailValidation.isOrgEmail ? 'admin' : 'user';
      await kv.set(`user_role:${userData.user.id}`, initialRole);
      console.log(`Role initialized for existing user: ${trimmedEmail} (role: ${initialRole})`);
    }

    // Mark token as used
    await kv.set(`magic_token:${token}`, {
      ...tokenData,
      used: true
    });

    // Generate a custom access token for this session
    const accessToken = crypto.randomUUID();
    const sessionExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    console.log(`Creating session for user ${userData.user.id} with token: ${accessToken}`);
    console.log(`Session will be stored with key: session:${accessToken}`);
    
    // Store the session
    await kv.set(`session:${accessToken}`, {
      userId: userData.user.id,
      email: userData.user.email,
      expiry: sessionExpiry,
      createdAt: Date.now()
    });
    
    // Verify the session was stored
    const verifySession = await kv.get(`session:${accessToken}`);
    console.log(`Session storage verification:`, verifySession ? 'SUCCESS' : 'FAILED');
    if (verifySession) {
      console.log(`Verified session data:`, JSON.stringify(verifySession));
    }

    console.log(`Successful magic link verification: ${trimmedEmail}`);
    console.log(`Returning access_token to frontend: ${accessToken}`);

    // Return user data and access token
    return c.json({ 
      access_token: accessToken,
      user: { 
        id: userData.user.id, 
        email: userData.user.email,
        name: userData.user.user_metadata?.name 
      } 
    });
  } catch (error) {
    console.error('Magic link verification exception:', error);
    return c.json({ error: 'Server error during verification. Please try again.' }, 500);
  }
});

// Get all materials (protected, rate-limited)
app.get("/make-server-17cae920/materials", rateLimit('API'), verifyAuth, async (c) => {
  try {
    const userId = c.get('userId');
    // Get materials for this user (or all if using public key for backward compat)
    const materials = await kv.getByPrefix("material:");
    return c.json({ materials: materials || [] });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return c.json({ error: "Failed to fetch materials", details: String(error) }, 500);
  }
});

// Create a new material (protected - admin only)
app.post("/make-server-17cae920/materials", verifyAuth, verifyAdmin, async (c) => {
  try {
    const material = await c.req.json();
    if (!material.id) {
      return c.json({ error: "Material ID is required" }, 400);
    }
    await kv.set(`material:${material.id}`, material);
    return c.json({ material });
  } catch (error) {
    console.error("Error creating material:", error);
    return c.json({ error: "Failed to create material", details: String(error) }, 500);
  }
});

// Batch save materials (protected - admin only)
app.post("/make-server-17cae920/materials/batch", verifyAuth, verifyAdmin, async (c) => {
  try {
    const { materials } = await c.req.json();
    if (!Array.isArray(materials)) {
      return c.json({ error: "Materials must be an array" }, 400);
    }
    
    // Use mset for batch operations - separate keys and values
    const keys = materials.map(m => `material:${m.id}`);
    const values = materials;
    await kv.mset(keys, values);
    
    return c.json({ success: true, count: materials.length });
  } catch (error) {
    console.error("Error batch saving materials:", error);
    return c.json({ error: "Failed to batch save materials", details: String(error) }, 500);
  }
});

// Update a material (protected - admin only)
app.put("/make-server-17cae920/materials/:id", verifyAuth, verifyAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const material = await c.req.json();
    
    // Verify the material exists
    const existing = await kv.get(`material:${id}`);
    if (!existing) {
      return c.json({ error: "Material not found" }, 404);
    }
    
    await kv.set(`material:${id}`, material);
    return c.json({ material });
  } catch (error) {
    console.error("Error updating material:", error);
    return c.json({ error: "Failed to update material", details: String(error) }, 500);
  }
});

// Delete a material (protected - admin only)
app.delete("/make-server-17cae920/materials/:id", verifyAuth, verifyAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`material:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return c.json({ error: "Failed to delete material", details: String(error) }, 500);
  }
});

// Delete all materials (protected - admin only)
app.delete("/make-server-17cae920/materials", verifyAuth, verifyAdmin, async (c) => {
  try {
    const materials = await kv.getByPrefix("material:");
    if (materials && materials.length > 0) {
      const keys = materials.map(m => `material:${m.id}`);
      await kv.mdel(keys);
    }
    return c.json({ success: true, deleted: materials?.length || 0 });
  } catch (error) {
    console.error("Error deleting all materials:", error);
    return c.json({ error: "Failed to delete all materials", details: String(error) }, 500);
  }
});

// Get current user's role (protected)
app.get("/make-server-17cae920/users/me/role", verifyAuth, async (c) => {
  console.log('🔍 GET /users/me/role - Endpoint reached after verifyAuth');
  console.log('✅ GET /users/me/role endpoint reached after verifyAuth');
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');
    console.log(`Getting role for user: ${userId} (${userEmail})`);
    
    let userRole = await kv.get(`user_role:${userId}`);
    console.log(`Retrieved role from KV: ${userRole}`);
    
    // Initialize role if not set
    if (!userRole) {
      userRole = (userEmail === 'natto@wastefull.org') ? 'admin' : 'user';
      await kv.set(`user_role:${userId}`, userRole);
      console.log(`Initialized role for user: ${userRole}`);
    }
    
    console.log(`Returning role: ${userRole}`);
    return c.json({ role: userRole });
  } catch (error) {
    console.error("Error getting user role:", error);
    return c.json({ error: "Failed to get user role", details: String(error) }, 500);
  }
});

// Get all users (admin only)
app.get("/make-server-17cae920/users", verifyAuth, verifyAdmin, async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Get all users from Supabase Auth
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return c.json({ error: 'Failed to list users' }, 500);
    }
    
    // Get roles for all users
    const usersWithRoles = await Promise.all(
      data.users.map(async (user) => {
        let role = await kv.get(`user_role:${user.id}`);
        
        // Initialize role if not set
        if (!role) {
          role = (user.email === 'natto@wastefull.org') ? 'admin' : 'user';
          await kv.set(`user_role:${user.id}`, role);
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          role: role,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        };
      })
    );
    
    return c.json({ users: usersWithRoles });
  } catch (error) {
    console.error("Error listing users:", error);
    return c.json({ error: "Failed to list users", details: String(error) }, 500);
  }
});

// Update user role (admin only)
app.put("/make-server-17cae920/users/:id/role", verifyAuth, verifyAdmin, async (c) => {
  try {
    const userId = c.req.param("id");
    const { role } = await c.req.json();
    
    if (!role || !['user', 'admin'].includes(role)) {
      return c.json({ error: "Invalid role. Must be 'user' or 'admin'" }, 400);
    }
    
    await kv.set(`user_role:${userId}`, role);
    
    return c.json({ success: true, userId, role });
  } catch (error) {
    console.error("Error updating user role:", error);
    return c.json({ error: "Failed to update user role", details: String(error) }, 500);
  }
});

// Delete user (admin only)
app.delete("/make-server-17cae920/users/:id", verifyAuth, verifyAdmin, async (c) => {
  try {
    const userId = c.req.param("id");
    const currentUserId = c.get('userId');
    
    // Prevent self-deletion
    if (userId === currentUserId) {
      return c.json({ error: "Cannot delete your own account" }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Delete user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return c.json({ error: error.message || 'Failed to delete user' }, 500);
    }
    
    // Delete user role from KV store
    await kv.del(`user_role:${userId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Failed to delete user", details: String(error) }, 500);
  }
});

// Update user details (admin only)
app.put("/make-server-17cae920/users/:id", verifyAuth, verifyAdmin, async (c) => {
  try {
    const userId = c.req.param("id");
    const { name, email, password } = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const updateData: any = {};
    
    if (email) {
      updateData.email = email;
    }
    
    if (password) {
      updateData.password = password;
    }
    
    if (name) {
      updateData.user_metadata = { name };
    }
    
    const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData);
    
    if (error) {
      console.error('Error updating user:', error);
      return c.json({ error: error.message || 'Failed to update user' }, 500);
    }
    
    return c.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user", details: String(error) }, 500);
  }
});

// ==================== ASSET STORAGE ROUTES ====================

// Upload asset to Supabase Storage (admin only)
app.post('/make-server-17cae920/assets/upload', verifyAuth, verifyAdmin, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only images are allowed.' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      return c.json({ error: 'File too large. Maximum size is 5MB.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const bucketName = 'make-17cae920-assets';
    
    // Generate filename with timestamp to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${file.name.split('.')[0]}-${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading to storage:', error);
      return c.json({ error: 'Failed to upload file', details: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log(`✅ Asset uploaded: ${fileName} -> ${publicUrl}`);

    return c.json({ 
      success: true, 
      fileName,
      publicUrl,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Error in asset upload:', error);
    return c.json({ error: 'Failed to upload asset', details: String(error) }, 500);
  }
});

// List all assets (admin only)
app.get('/make-server-17cae920/assets', verifyAuth, verifyAdmin, async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const bucketName = 'make-17cae920-assets';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list();

    if (error) {
      console.error('Error listing assets:', error);
      return c.json({ error: 'Failed to list assets', details: error.message }, 500);
    }

    // Get public URLs for all files
    const assets = data.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(file.name);
      
      return {
        name: file.name,
        publicUrl,
        size: file.metadata?.size,
        createdAt: file.created_at,
        updatedAt: file.updated_at
      };
    });

    return c.json({ assets });
  } catch (error) {
    console.error('Error in asset listing:', error);
    return c.json({ error: 'Failed to list assets', details: String(error) }, 500);
  }
});

// Delete an asset (admin only)
app.delete('/make-server-17cae920/assets/:fileName', verifyAuth, verifyAdmin, async (c) => {
  try {
    const fileName = c.req.param('fileName');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const bucketName = 'make-17cae920-assets';

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting asset:', error);
      return c.json({ error: 'Failed to delete asset', details: error.message }, 500);
    }

    console.log(`✅ Asset deleted: ${fileName}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error in asset deletion:', error);
    return c.json({ error: 'Failed to delete asset', details: String(error) }, 500);
  }
});

// ==================== WHITEPAPER ROUTES ====================

// Get all whitepapers (public, no auth required)
app.get('/make-server-17cae920/whitepapers', async (c) => {
  try {
    const whitepapers = await kv.getByPrefix('whitepaper:');
    console.log('📚 Fetching all whitepapers:', {
      count: whitepapers?.length || 0,
      whitepapers: whitepapers?.map(wp => ({
        slug: wp?.slug,
        title: wp?.title,
        contentLength: wp?.content?.length || 0,
        hasContent: !!wp?.content
      }))
    });
    return c.json({ whitepapers });
  } catch (error) {
    console.error("Error fetching whitepapers:", error);
    return c.json({ error: "Failed to fetch whitepapers", details: String(error) }, 500);
  }
});

// Get a single whitepaper by slug (public, no auth required)
app.get('/make-server-17cae920/whitepapers/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const whitepaper = await kv.get(`whitepaper:${slug}`);
    
    console.log('🔍 Retrieving whitepaper:', {
      slug,
      found: !!whitepaper,
      title: whitepaper?.title,
      contentType: typeof whitepaper?.content,
      contentLength: whitepaper?.content?.length || 0,
      contentPreview: typeof whitepaper?.content === 'string' ? whitepaper.content.substring(0, 100) : 'NOT A STRING',
      keys: whitepaper ? Object.keys(whitepaper) : []
    });
    
    if (!whitepaper) {
      return c.json({ error: "Whitepaper not found" }, 404);
    }
    
    return c.json({ whitepaper });
  } catch (error) {
    console.error("Error fetching whitepaper:", error);
    return c.json({ error: "Failed to fetch whitepaper", details: String(error) }, 500);
  }
});

// Create or update a whitepaper (admin only)
app.post('/make-server-17cae920/whitepapers', verifyAuth, verifyAdmin, async (c) => {
  try {
    const { slug, title, content } = await c.req.json();
    
    console.log('📝 Saving whitepaper:', { 
      slug, 
      title,
      contentType: typeof content,
      contentLength: content?.length || 0,
      contentPreview: typeof content === 'string' ? content.substring(0, 100) : 'NOT A STRING'
    });
    
    if (!slug || !title || !content) {
      return c.json({ error: "Missing required fields: slug, title, content" }, 400);
    }
    
    const whitepaper = {
      slug,
      title,
      content,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`whitepaper:${slug}`, whitepaper);
    
    // Verify it was saved correctly
    const verification = await kv.get(`whitepaper:${slug}`);
    console.log('✅ Verification after save:', {
      slug: verification?.slug,
      title: verification?.title,
      contentType: typeof verification?.content,
      contentLength: verification?.content?.length || 0,
      hasContent: !!verification?.content
    });
    
    return c.json({ whitepaper });
  } catch (error) {
    console.error("Error saving whitepaper:", error);
    return c.json({ error: "Failed to save whitepaper", details: String(error) }, 500);
  }
});

// Delete a whitepaper (admin only)
app.delete('/make-server-17cae920/whitepapers/:slug', verifyAuth, verifyAdmin, async (c) => {
  try {
    const slug = c.req.param('slug');
    await kv.del(`whitepaper:${slug}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting whitepaper:", error);
    return c.json({ error: "Failed to delete whitepaper", details: String(error) }, 500);
  }
});

// Get whitepaper source files from filesystem (admin only)
app.get('/make-server-17cae920/whitepapers-source', verifyAuth, verifyAdmin, async (c) => {
  try {
    // Define the whitepaper manifest
    const whitepaperFiles = [
      { slug: 'recyclability', filename: 'Recyclability.md', title: 'WasteDB Recyclability Methodology (CR-v1)' },
      { slug: 'compostability', filename: 'CC-v1.md', title: 'WasteDB Compostability Methodology (CC-v1)' },
      { slug: 'reusability', filename: 'RU-v1.md', title: 'WasteDB Reusability Methodology (RU-v1)' },
      { slug: 'visualization', filename: 'VIZ-v1.md', title: 'WasteDB Visualization Methodology (VIZ-v1)' },
      { slug: 'calculation-methodology', filename: 'Calculation_Methodology.md', title: 'WasteDB Calculation Methodology' },
    ];

    const whitepapers = [];
    
    for (const file of whitepaperFiles) {
      try {
        // Read the markdown file from the whitepapers directory
        // In Deno, we need to construct the path relative to the current working directory
        const content = await Deno.readTextFile(`./whitepapers/${file.filename}`);
        
        whitepapers.push({
          slug: file.slug,
          title: file.title,
          filename: file.filename,
          content: content
        });
        
        console.log(`✅ Read ${file.filename}: ${content.length} characters`);
      } catch (error) {
        console.error(`❌ Failed to read ${file.filename}:`, error);
        // Continue with other files even if one fails
        whitepapers.push({
          slug: file.slug,
          title: file.title,
          filename: file.filename,
          content: '',
          error: String(error)
        });
      }
    }

    return c.json({ whitepapers });
  } catch (error) {
    console.error("Error reading whitepaper source files:", error);
    return c.json({ error: "Failed to read whitepaper files", details: String(error) }, 500);
  }
});

// Initialize admin user on startup
async function initializeAdminUser() {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if admin user exists
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminExists = users?.users?.some(u => u.email === 'natto@wastefull.org');

    if (!adminExists) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'natto@wastefull.org',
        password: 'admin123',
        user_metadata: { name: 'Nao' },
        email_confirm: true,
      });

      if (!error && data) {
        // Set admin role in KV store
        await kv.set(`user_role:${data.user.id}`, 'admin');
      }
    }
  } catch (error) {
    // Silently fail - admin can be created manually if needed
  }
}

// Initialize default whitepapers on startup
async function initializeWhitepapers() {
  try {
    // Check if Recyclability whitepaper already exists
    const existing = await kv.get('whitepaper:recyclability');
    
    if (!existing) {
      // Upload the Recyclability methodology whitepaper
      const recyclabilityContent = `---

# **WasteDB: Statistical and Accessibility Methodology**

## **Organization Overview**

**Organization:** Wastefull
**Location:** San Jose, California
**Project:** WasteDB
**Focus:** Advancing biological and technological recycling through open data, research, and community collaboration.

**Mission Statement:**
Wastefull develops open scientific infrastructure to measure, understand, and improve material circularity. Our mission is to empower communities, researchers, and industries to make data-driven decisions that reduce waste and expand what is materially possible. Wastefull treats recyclability not as a fixed property but as a moving boundary that science and design can continually push outward.

---

## **1. Purpose and Philosophy**

WasteDB balances *scientific optimism* with *practical realism*.
We assume that, with sufficient progress, any material can ultimately be recycled.
However, the database quantifies **current recyclability** to guide real-world decisions in manufacturing, product design, and consumer behavior.

WasteDB computes **two complementary recyclability indices**:

* **Theoretical Recyclability ($CR_{theo}$):** reflects scientific or technical potential under ideal conditions (clean inputs, mature infrastructure).
* **Practical Recyclability ($CR_{prac}$):** reflects real-world performance under typical consumer and industrial conditions (contamination, existing facilities).

Every data point and score is traceable to at least three independent sources.

---

## **2. Core Parameters**

| Symbol | Parameter               | Definition                                                                      | Empirical Basis                                             |
| :----: | ----------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
|  **Y** | Yield                   | Fraction of material successfully recovered after processing                    | Laboratory recovery data, industrial trials, LCA datasets   |
|  **D** | Degradability           | Quality or functional loss per recycling cycle                                  | Material-science and composting studies, UV/weathering data |
|  **C** | Contamination Tolerance | Sensitivity of the process to contaminants (food residue, mixed polymers, etc.) | Facility process data, waste-stream analyses                |
|  **M** | Maturity                | Availability and readiness of recycling infrastructure                          | Industrial reports, government data, TRL assessments        |
|  **E** | Energy Demand           | Net energy input per kg for recovery or transformation                          | LCA and process energy audits                               |

> **Note:** $E$ is tracked separately as an **energy score**, not folded into $CR$.
> This preserves transparency in trade-offs between feasibility and sustainability.

---

## **3. Data Collection Standards**

Each data point must meet the following requirements:

* **≥ 3 independent sources**, including at least one peer-reviewed or government dataset.
* **Full citation traceability** (DOI, accession, or public dataset link).
* **Standardized units** (MJ kg⁻¹, %, g CO₂e kg⁻¹).
* **Source weighting** recorded in metadata for transparency.

### **3.1 Source Weight Parameters**

| Source Type                       | Weight ($w_i$) | Rationale                     |
| --------------------------------- | :------------: | ----------------------------- |
| Peer-reviewed paper               |       1.0      | Highest verification standard |
| Government / international report |       0.9      | Large-scale, high reliability |
| Industrial white paper or LCA     |       0.7      | Empirical but possible bias   |
| NGO / nonprofit study             |       0.6      | Often regional, smaller scope |
| Internal or unpublished data      |       0.3      | Provisional; to be validated  |

Weighted means and confidence intervals:

$$
\\bar{x}_w = \\frac{\\sum_i w_i x_i}{\\sum_i w_i}
$$

$$
SE_w = \\sqrt{\\frac{\\sum_i w_i (x_i - \\bar{x}_w)^2}{(\\sum_i w_i)(n-1)}}
$$

$$
CI_{95\\%} = \\bar{x}_w \\pm 1.96 \\cdot SE_w
$$

---

## **4. Statistical Handling**

* **Aggregation:** Weighted mean and SD across sources.
* **Confidence Intervals:** Computed with weighted $SE_w$.
* **Covariance Tracking (Stage II):** Future work will map correlations (e.g., $Y$–$D$, $C$–$M$) for improved uncertainty propagation.

---

## **5. Dual Recyclability Scoring**

WasteDB reports two composite indices for each material:

| Field                                            | Meaning                                        | Default Assumptions                                  |
| ------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------- |
| **CR_theoretical_mean**                          | Recyclability under ideal conditions           | $U_{clean}=1.0$ (clean input); optimistic $M$        |
| **CR_practical_mean**                            | Recyclability under typical conditions         | $U_{clean}=0.6$ (realistic cleanliness); current $M$ |
| **CR_theoretical_CI95**, **CR_practical_CI95**   | 95 % confidence intervals                      | Derived from parameter SEs                           |
| **CR_theoretical_label**, **CR_practical_label** | Public categories ("Easily recyclable," etc.)  | Mapped from Table below                              |
| **E_value**, **E_CI95**                          | Separate energy score (MJ kg⁻¹ and normalized) | Displayed in parallel to $CR$                        |

**Label thresholds**

| $CR$ Range  | Label                       | Guidance                                  |
| ----------- | --------------------------- | ----------------------------------------- |
| 0.80 – 1.00 | Easily recyclable           | Routinely recycled at scale.              |
| 0.60 – 0.79 | Recyclable with care        | Requires clean sorting or mature systems. |
| 0.40 – 0.59 | Limited recyclability       | Recycled in specialized facilities only.  |
| 0.20 – 0.39 | Technically recyclable      | Feasible but rarely done commercially.    |
| 0.00 – 0.19 | Unrecyclable / Experimental | No established pathway today.             |

WasteDB's interface defaults to \`CR_practical_label\` for public display, with optional toggling to view \`CR_theoretical_label\` for researchers.

---

## **6. Accessibility and Visual Design**

All numeric confidence values are accompanied by accessible visual cues.

| Confidence                 | Color   | Pattern        | Icon | Accessibility Notes                  |
| -------------------------- | ------- | -------------- | ---- | ------------------------------------ |
| **High**                   | #003366 | solid          | ▲    | High contrast; readable in grayscale |
| **Medium**                 | #6A7BA2 | diagonal hatch | ■    | Distinct texture and shape           |
| **Low**                    | #D0D0D0 | cross-hatch    | ●    | Legible in monochrome                |
| **Unverified/Conflicting** | #E57E25 | checkerboard   | !    | Flag for user attention              |

> Confidence indicators use redundant color, texture, and shape cues, achieving **WCAG 2.1 AA** compliance.
> Screen readers use descriptive text ("High confidence, blue triangle") rather than color cues.

---

## **7. Transparency and Version Control**

All WasteDB datasets and derived values are:

* **Versioned** with public changelogs.
* **Openly licensed** whenever possible.
* **Traceable** from visualization back to raw data sources.

All statistical methods and weight configurations are stored in \`/methods\`, with timestamps, contributor IDs, and configuration histories for reproducibility.

---

## **8. Future Work**

1. Develop covariance models for $Y$, $D$, $C$, and $E$.
2. Automate source weight calibration via metadata quality scoring.
3. Deploy interactive WasteDB dashboard showing $CR_{theo}$ vs $CR_{prac}$.
4. Integrate probabilistic forecasts for recyclability improvement based on research trends.
5. Publish WasteDB as a public API with FAIR-compliant metadata access.

---

## **Appendix A: Metadata Schema and Representation**

### **A.1 Overview**

Each WasteDB material record contains empirical recyclability data and metadata for traceability, confidence assessment, and accessibility.
The schema is compatible with **JSON-LD**, **CSV**, and **SQL**.

### **A.2 Core Schema (with dual-score support)**

| Field                  | Type                | Description                                 |
| ---------------------- | ------------------- | ------------------------------------------- |
| \`material_id\`          | UUID                | Unique identifier                           |
| \`material_name\`        | String              | Common or trade name                        |
| \`category\`             | Enum                | Public taxonomy (e.g. "Plastics," "Metals") |
| \`Y_value\`              | Float               | Weighted mean yield                         |
| \`Y_CI95\`               | Tuple(Float, Float) | 95 % CI for yield                           |
| \`D_value\`              | Float               | Weighted degradability score                |
| \`C_value\`              | Float               | Weighted contamination tolerance            |
| \`M_value\`              | Float               | Infrastructure maturity score               |
| \`E_value_MJkg\`         | Float               | Absolute energy use                         |
| \`E_norm\`               | Float               | Normalized energy (0–1)                     |
| \`CR_practical_mean\`    | Float               | Practical recyclability index               |
| \`CR_practical_CI95\`    | Tuple(Float, Float) | Confidence interval                         |
| \`CR_practical_label\`   | Enum                | Public label (default display)              |
| \`CR_theoretical_mean\`  | Float               | Theoretical recyclability index             |
| \`CR_theoretical_CI95\`  | Tuple(Float, Float) | Confidence interval                         |
| \`CR_theoretical_label\` | Enum                | R&D label                                   |
| \`recyclability_label\`  | Alias               | Default = \`CR_practical_label\`              |
| \`confidence_level\`     | Enum                | High / Medium / Low / Unverified            |
| \`source_list\`          | Array[Object]       | Source metadata and weights                 |
| \`last_reviewed\`        | ISO Date            | Last update                                 |
| \`version\`              | String              | Repository version                          |
| \`reviewed_by\`          | String              | Contributor(s)                              |
| \`notes\`                | Text                | Contextual notes                            |

*(See Appendix A.3–A.7 for full metadata and accessibility fields.)*

---

## **Appendix B: Composite Recyclability Index (CR)**

Formulas, uncertainty propagation, and worked examples are provided for both $CR_{theo}$ and $CR_{prac}$, including weighting defaults, behavioral cleanliness factors, and energy treatment.
See Appendix B in the technical documentation for implementation details.

---
`;
      
      await kv.set('whitepaper:recyclability', {
        slug: 'recyclability',
        title: 'WasteDB: Statistical and Accessibility Methodology',
        content: recyclabilityContent,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Check if Calculation Methodology whitepaper already exists
    const calcMethodology = await kv.get('whitepaper:calculation-methodology');
    
    if (!calcMethodology) {
      const calculationContent = `# WasteDB Calculation Methodology

## Overview

This document describes the scientific methodology used to calculate the Composite Recyclability Index (CR) in WasteDB.

## Composite Recyclability Index (CR)

The Composite Recyclability Index provides a quantitative measure of how recyclable a material is, based on multiple factors.

### Formula

The CR is calculated using the following formula:

$
CR = Y \\times D \\times C \\times M \\times U_{clean}
$

Where each parameter is normalized to a 0-1 scale:

- **Y (Yield)**: Material recovery rate - fraction successfully recovered in the recycling process
- **D (Degradability)**: Quality retention - higher values indicate better quality preservation through recycling cycles
- **C (Contamination)**: Contamination tolerance - how well the material handles impurities
- **M (Maturity)**: Infrastructure maturity - availability and readiness of recycling infrastructure
- **$U_{clean}$**: Cleanliness factor - input material quality

### Operating Modes

The methodology supports two operating modes:

#### Theoretical Mode (Ideal Conditions)
- $U_{clean} = 1.0$ (perfectly clean input)
- Represents the maximum theoretical recyclability
- Used for research and best-case scenario analysis

#### Practical Mode (Realistic Conditions) 
- $U_{clean} = 0.6$ (realistic contamination levels)
- Reflects real-world recycling conditions
- Used for public-facing scores and practical applications

### Score Interpretation

The calculated CR value (0-1 scale) is converted to a percentage (0-100) for display:

- **High (>70%)**: Excellent recyclability with established infrastructure
- **Medium (30-70%)**: Moderate recyclability with some limitations
- **Low (<30%)**: Poor recyclability or limited infrastructure

## Confidence Intervals

To account for measurement uncertainty and data quality:

- **95% Confidence Intervals** are calculated around the mean CR value
- Default margin: ±10% of the calculated value
- Adjusted based on source quality and data completeness

## Data Quality Levels

Materials are assigned confidence levels based on supporting evidence:

- **High Confidence**: 3+ peer-reviewed sources, complete parameter data
- **Medium Confidence**: 2+ credible sources, partial parameter data
- **Low Confidence**: 0-1 sources, preliminary or estimated data

## Parameter Estimation

When specific parameter data is not available, estimates are derived from:

1. Category-level averages from published literature
2. Expert assessments based on material properties
3. Comparative analysis with similar materials

### Default Parameter Values by Category

| Category | Y (Yield) | D (Quality) | C (Contamination) | M (Infrastructure) |
|----------|-----------|-------------|-------------------|-------------------|
| Glass | 0.95 | 1.00 | 0.85 | 0.95 |
| Metals | 0.90 | 0.95 | 0.80 | 0.90 |
| Paper & Cardboard | 0.70 | 0.60 | 0.65 | 0.85 |
| Plastics | 0.60 | 0.50 | 0.40 | 0.70 |
| Electronics & Batteries | 0.50 | 0.40 | 0.30 | 0.50 |
| Fabrics & Textiles | 0.40 | 0.45 | 0.35 | 0.40 |
| Building Materials | 0.65 | 0.70 | 0.60 | 0.60 |
| Organic/Natural Waste | 0.20 | 0.30 | 0.25 | 0.30 |

## Citation and Sources

All scientific data should be supported by citations from peer-reviewed literature, industry reports, or authoritative sources. Sources are tracked with:

- Title and authors
- Publication year
- DOI (when available)
- Source weight (for aggregating multiple studies)

## Versioning

The methodology is versioned to track changes over time:

- **Methodology Version**: Current version identifier (e.g., "CR-v1")
- **Whitepaper Version**: Reference to methodology whitepaper version (e.g., "2025.1")
- **Calculation Timestamp**: ISO 8601 timestamp of when scores were calculated

## References

For a complete description of the methodology and validation studies, see:
- Recyclability.md - Full technical whitepaper
- DATA_PIPELINE.md - Data processing pipeline documentation
- ROADMAP.md - Future enhancements and methodology updates

---

**Last Updated**: January 2025  
**Methodology Version**: CR-v1  
**Whitepaper Version**: 2025.1
`;
      
      await kv.set('whitepaper:calculation-methodology', {
        slug: 'calculation-methodology',
        title: 'Calculation Methodology Reference',
        content: calculationContent,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    // Silently fail - whitepapers can be uploaded manually if needed
  }
}

// ==================== EXPORT ROUTES (PUBLIC) ====================

// Helper function to convert scientific data to public format (0-100 scale)
function convertToPublicFormat(material: any) {
  return {
    id: material.id,
    name: material.name,
    category: material.category,
    description: material.description || '',
    
    // Public scores (0-100 scale)
    compostability: material.compostability || 0,
    recyclability: material.recyclability || 0,
    reusability: material.reusability || 0,
    
    // Add estimation flag for low confidence
    isEstimated: material.confidence_level === 'Low',
    confidenceLevel: material.confidence_level || 'Medium',
    
    // Metadata
    lastUpdated: material.calculation_timestamp || new Date().toISOString(),
    whitepaperVersion: material.whitepaper_version || 'N/A',
  };
}

// Helper function to format CSV
function arrayToCSV(headers: string[], rows: any[][]): string {
  const csvRows = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma or quote
      const cellStr = String(cell ?? '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ];
  return csvRows.join('\n');
}

// Public export endpoint - lay-friendly data (0-100 scale)
app.get('/make-server-17cae920/export/public', async (c) => {
  try {
    const format = c.req.query('format') || 'json'; // 'json' or 'csv'
    
    // Get all materials
    const materials = await kv.getByPrefix('material:');
    
    if (!materials || materials.length === 0) {
      if (format === 'csv') {
        return c.text('', 200, { 'Content-Type': 'text/csv' });
      }
      return c.json({ materials: [] });
    }
    
    // Convert to public format
    const publicData = materials.map(convertToPublicFormat);
    
    if (format === 'csv') {
      const headers = [
        'ID', 'Name', 'Category', 'Description',
        'Compostability', 'Recyclability', 'Reusability',
        'Is Estimated', 'Confidence Level', 'Last Updated', 'Whitepaper Version'
      ];
      
      const rows = publicData.map(m => [
        m.id,
        m.name,
        m.category,
        m.description,
        m.compostability,
        m.recyclability,
        m.reusability,
        m.isEstimated ? 'Yes' : 'No',
        m.confidenceLevel,
        m.lastUpdated,
        m.whitepaperVersion
      ]);
      
      const csv = arrayToCSV(headers, rows);
      
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="wastedb-public-${new Date().toISOString().split('T')[0]}.csv"`
      });
    }
    
    // Return JSON by default
    return c.json({
      exportDate: new Date().toISOString(),
      format: 'public',
      scale: '0-100',
      count: publicData.length,
      materials: publicData
    });
  } catch (error) {
    console.error('Error exporting public data:', error);
    return c.json({ error: 'Failed to export data', details: String(error) }, 500);
  }
});

// Full research export endpoint - raw scientific data
app.get('/make-server-17cae920/export/full', async (c) => {
  try {
    const format = c.req.query('format') || 'json'; // 'json' or 'csv'
    
    // Get all materials
    const materials = await kv.getByPrefix('material:');
    
    if (!materials || materials.length === 0) {
      if (format === 'csv') {
        return c.text('', 200, { 'Content-Type': 'text/csv' });
      }
      return c.json({ materials: [] });
    }
    
    if (format === 'csv') {
      const headers = [
        'ID', 'Name', 'Category', 'Description',
        // CR parameters
        'Y (Yield)', 'D (Degradability)', 'C (Contamination)', 'M (Maturity)', 'E (Energy)',
        'CR Practical Mean', 'CR Practical CI Lower', 'CR Practical CI Upper',
        'CR Theoretical Mean', 'CR Theoretical CI Lower', 'CR Theoretical CI Upper',
        // CC parameters
        'B (Biodegradation)', 'N (Nutrient Balance)', 'T (Toxicity)', 'H (Habitat Adaptability)',
        'CC Practical Mean', 'CC Practical CI Lower', 'CC Practical CI Upper',
        'CC Theoretical Mean', 'CC Theoretical CI Lower', 'CC Theoretical CI Upper',
        // RU parameters
        'L (Lifetime)', 'R (Repairability)', 'U (Upgradability)', 'C_RU (Contamination)',
        'RU Practical Mean', 'RU Practical CI Lower', 'RU Practical CI Upper',
        'RU Theoretical Mean', 'RU Theoretical CI Lower', 'RU Theoretical CI Upper',
        // Public scores and metadata
        'Compostability (0-100)', 'Recyclability (0-100)', 'Reusability (0-100)',
        'Confidence Level', 'Source Count', 'Whitepaper Version', 'Method Version',
        'Calculation Timestamp'
      ];
      
      const rows = materials.map(m => [
        m.id,
        m.name,
        m.category,
        m.description || '',
        // CR parameters
        m.Y_value?.toFixed(4) || '',
        m.D_value?.toFixed(4) || '',
        m.C_value?.toFixed(4) || '',
        m.M_value?.toFixed(4) || '',
        m.E_value?.toFixed(4) || '',
        m.CR_practical_mean?.toFixed(4) || '',
        m.CR_practical_CI95?.lower?.toFixed(4) || '',
        m.CR_practical_CI95?.upper?.toFixed(4) || '',
        m.CR_theoretical_mean?.toFixed(4) || '',
        m.CR_theoretical_CI95?.lower?.toFixed(4) || '',
        m.CR_theoretical_CI95?.upper?.toFixed(4) || '',
        // CC parameters
        m.B_value?.toFixed(4) || '',
        m.N_value?.toFixed(4) || '',
        m.T_value?.toFixed(4) || '',
        m.H_value?.toFixed(4) || '',
        m.CC_practical_mean?.toFixed(4) || '',
        m.CC_practical_CI95?.lower?.toFixed(4) || '',
        m.CC_practical_CI95?.upper?.toFixed(4) || '',
        m.CC_theoretical_mean?.toFixed(4) || '',
        m.CC_theoretical_CI95?.lower?.toFixed(4) || '',
        m.CC_theoretical_CI95?.upper?.toFixed(4) || '',
        // RU parameters
        m.L_value?.toFixed(4) || '',
        m.R_value?.toFixed(4) || '',
        m.U_value?.toFixed(4) || '',
        m.C_RU_value?.toFixed(4) || '',
        m.RU_practical_mean?.toFixed(4) || '',
        m.RU_practical_CI95?.lower?.toFixed(4) || '',
        m.RU_practical_CI95?.upper?.toFixed(4) || '',
        m.RU_theoretical_mean?.toFixed(4) || '',
        m.RU_theoretical_CI95?.lower?.toFixed(4) || '',
        m.RU_theoretical_CI95?.upper?.toFixed(4) || '',
        // Public scores and metadata
        m.compostability || '',
        m.recyclability || '',
        m.reusability || '',
        m.confidence_level || '',
        m.sources?.length || '0',
        m.whitepaper_version || '',
        m.method_version || '',
        m.calculation_timestamp || ''
      ]);
      
      const csv = arrayToCSV(headers, rows);
      
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="wastedb-research-${new Date().toISOString().split('T')[0]}.csv"`
      });
    }
    
    // Return full JSON with all scientific metadata
    const fullData = materials.map(m => ({
      // Basic info
      id: m.id,
      name: m.name,
      category: m.category,
      description: m.description,
      
      // Public scores
      compostability: m.compostability,
      recyclability: m.recyclability,
      reusability: m.reusability,
      
      // Raw parameters
      Y_value: m.Y_value,
      D_value: m.D_value,
      C_value: m.C_value,
      M_value: m.M_value,
      E_value: m.E_value,
      
      // Composite scores
      CR_practical_mean: m.CR_practical_mean,
      CR_theoretical_mean: m.CR_theoretical_mean,
      CR_practical_CI95: m.CR_practical_CI95,
      CR_theoretical_CI95: m.CR_theoretical_CI95,
      
      // Metadata
      confidence_level: m.confidence_level,
      sources: m.sources,
      whitepaper_version: m.whitepaper_version,
      method_version: m.method_version,
      calculation_timestamp: m.calculation_timestamp,
    }));
    
    return c.json({
      exportDate: new Date().toISOString(),
      format: 'research',
      scale: '0-1 normalized + 0-100 public',
      count: fullData.length,
      materials: fullData,
      metadata: {
        note: 'CR values are normalized 0-1. Public scores (compostability, recyclability, reusability) are 0-100.',
        confidenceLevels: ['High', 'Medium', 'Low'],
        parameters: {
          Y: 'Yield - Fraction of material successfully recovered',
          D: 'Degradability - Quality retention per cycle',
          C: 'Contamination Tolerance - Sensitivity to contaminants',
          M: 'Maturity - Infrastructure availability',
          E: 'Energy - Net energy input (normalized)'
        }
      }
    });
  } catch (error) {
    console.error('Error exporting research data:', error);
    return c.json({ error: 'Failed to export data', details: String(error) }, 500);
  }
});

// ==================== SOURCE LIBRARY ROUTES ====================

// Get all sources (public, no auth required)
app.get('/make-server-17cae920/sources', async (c) => {
  try {
    const sources = await kv.getByPrefix('source:');
    return c.json({ sources: sources || [] });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return c.json({ error: "Failed to fetch sources", details: String(error) }, 500);
  }
});

// Create a new source (admin only)
app.post('/make-server-17cae920/sources', verifyAuth, verifyAdmin, async (c) => {
  try {
    const source = await c.req.json();
    if (!source.id) {
      return c.json({ error: "Source ID is required" }, 400);
    }
    await kv.set(`source:${source.id}`, source);
    return c.json({ source });
  } catch (error) {
    console.error("Error creating source:", error);
    return c.json({ error: "Failed to create source", details: String(error) }, 500);
  }
});

// Update a source (admin only)
app.put('/make-server-17cae920/sources/:id', verifyAuth, verifyAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const source = await c.req.json();
    
    // Verify the source exists
    const existing = await kv.get(`source:${id}`);
    if (!existing) {
      return c.json({ error: "Source not found" }, 404);
    }
    
    await kv.set(`source:${id}`, source);
    return c.json({ source });
  } catch (error) {
    console.error("Error updating source:", error);
    return c.json({ error: "Failed to update source", details: String(error) }, 500);
  }
});

// Delete a source (admin only)
app.delete('/make-server-17cae920/sources/:id', verifyAuth, verifyAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`source:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting source:", error);
    return c.json({ error: "Failed to delete source", details: String(error) }, 500);
  }
});

// Batch save sources (admin only)
app.post('/make-server-17cae920/sources/batch', verifyAuth, verifyAdmin, async (c) => {
  try {
    const { sources } = await c.req.json();
    if (!Array.isArray(sources)) {
      return c.json({ error: "Sources must be an array" }, 400);
    }
    
    const keys = sources.map(s => `source:${s.id}`);
    const values = sources;
    await kv.mset(keys, values);
    
    return c.json({ success: true, count: sources.length });
  } catch (error) {
    console.error("Error batch saving sources:", error);
    return c.json({ error: "Failed to batch save sources", details: String(error) }, 500);
  }
});

// ==================== CALCULATION ENDPOINTS ====================

/**
 * Calculate Composite Compostability Index (CC)
 * Based on CC-v1 methodology whitepaper
 * Formula: CC = w_B·B + w_N·N + w_H·H + w_M·M − w_T·T
 */
app.post('/make-server-17cae920/calculate/compostability', verifyAuth, verifyAdmin, async (c) => {
  try {
    const { B, N, T, H, M, mode } = await c.req.json();
    
    // Validate inputs (all should be 0-1)
    const params = { B, N, T, H, M };
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) {
        return c.json({ error: `Invalid ${key} value. Must be between 0 and 1.` }, 400);
      }
    }
    
    // Default weights (from CC-v1 whitepaper)
    const weights = mode === 'theoretical' 
      ? { w_B: 0.45, w_N: 0.15, w_H: 0.15, w_M: 0.15, w_T: 0.10 }
      : { w_B: 0.35, w_N: 0.15, w_H: 0.20, w_M: 0.20, w_T: 0.10 };
    
    // Calculate CC
    const CC = (weights.w_B * (B || 0)) + 
               (weights.w_N * (N || 0)) + 
               (weights.w_H * (H || 0)) + 
               (weights.w_M * (M || 0)) - 
               (weights.w_T * (T || 0));
    
    // Constrain to 0-1
    const CC_constrained = Math.max(0, Math.min(1, CC));
    
    return c.json({
      CC_mean: CC_constrained,
      CC_public: Math.round(CC_constrained * 100), // 0-100 scale
      mode: mode || 'practical',
      weights,
      inputs: params,
      whitepaper_version: '2025.1',
      method_version: 'CC-v1',
      calculation_timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating compostability:', error);
    return c.json({ error: 'Failed to calculate compostability', details: String(error) }, 500);
  }
});

/**
 * Calculate Composite Reusability Index (RU)
 * Based on RU-v1 methodology whitepaper
 * Formula: RU = w_L·L + w_R·R + w_U·U + w_M·M − w_C·C
 */
app.post('/make-server-17cae920/calculate/reusability', verifyAuth, verifyAdmin, async (c) => {
  try {
    const { L, R, U, C, M, mode } = await c.req.json();
    
    // Validate inputs (all should be 0-1)
    const params = { L, R, U, C, M };
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) {
        return c.json({ error: `Invalid ${key} value. Must be between 0 and 1.` }, 400);
      }
    }
    
    // Default weights (from RU-v1 whitepaper)
    const weights = mode === 'theoretical'
      ? { w_L: 0.35, w_R: 0.20, w_U: 0.15, w_M: 0.20, w_C: 0.10 }
      : { w_L: 0.25, w_R: 0.25, w_U: 0.15, w_M: 0.25, w_C: 0.10 };
    
    // Calculate RU
    const RU = (weights.w_L * (L || 0)) + 
               (weights.w_R * (R || 0)) + 
               (weights.w_U * (U || 0)) + 
               (weights.w_M * (M || 0)) - 
               (weights.w_C * (C || 0));
    
    // Constrain to 0-1
    const RU_constrained = Math.max(0, Math.min(1, RU));
    
    return c.json({
      RU_mean: RU_constrained,
      RU_public: Math.round(RU_constrained * 100), // 0-100 scale
      mode: mode || 'practical',
      weights,
      inputs: params,
      whitepaper_version: '2025.1',
      method_version: 'RU-v1',
      calculation_timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating reusability:', error);
    return c.json({ error: 'Failed to calculate reusability', details: String(error) }, 500);
  }
});

/**
 * Batch calculate all three dimensions for a material
 * Returns CR, CC, and RU values
 */
app.post('/make-server-17cae920/calculate/all-dimensions', verifyAuth, verifyAdmin, async (c) => {
  try {
    const params = await c.req.json();
    const { mode } = params;
    
    const results: any = {
      mode: mode || 'practical',
      calculation_timestamp: new Date().toISOString(),
      whitepaper_version: '2025.1'
    };
    
    // Calculate CR if Y, D, C, M, E are provided
    if (params.Y !== undefined || params.D !== undefined || params.C !== undefined || 
        params.M !== undefined || params.E !== undefined) {
      // CR calculation logic (existing)
      // For now, we'll just indicate it needs implementation
      results.CR = { 
        message: 'CR calculation implementation needed',
        requires: ['Y', 'D', 'C', 'M', 'E']
      };
    }
    
    // Calculate CC if B, N, T, H, M are provided
    if (params.B !== undefined || params.N !== undefined || params.T !== undefined || 
        params.H !== undefined) {
      const weights = mode === 'theoretical' 
        ? { w_B: 0.45, w_N: 0.15, w_H: 0.15, w_M: 0.15, w_T: 0.10 }
        : { w_B: 0.35, w_N: 0.15, w_H: 0.20, w_M: 0.20, w_T: 0.10 };
      
      const CC = (weights.w_B * (params.B || 0)) + 
                 (weights.w_N * (params.N || 0)) + 
                 (weights.w_H * (params.H || 0)) + 
                 (weights.w_M * (params.M || 0)) - 
                 (weights.w_T * (params.T || 0));
      
      const CC_constrained = Math.max(0, Math.min(1, CC));
      
      results.CC = {
        mean: CC_constrained,
        public: Math.round(CC_constrained * 100),
        method_version: 'CC-v1',
        weights
      };
    }
    
    // Calculate RU if L, R, U, C, M are provided
    if (params.L !== undefined || params.R !== undefined || params.U !== undefined || 
        params.C_RU !== undefined) {
      const weights = mode === 'theoretical'
        ? { w_L: 0.35, w_R: 0.20, w_U: 0.15, w_M: 0.20, w_C: 0.10 }
        : { w_L: 0.25, w_R: 0.25, w_U: 0.15, w_M: 0.25, w_C: 0.10 };
      
      const RU = (weights.w_L * (params.L || 0)) + 
                 (weights.w_R * (params.R || 0)) + 
                 (weights.w_U * (params.U || 0)) + 
                 (weights.w_M * (params.M || 0)) - 
                 (weights.w_C * (params.C_RU || 0));
      
      const RU_constrained = Math.max(0, Math.min(1, RU));
      
      results.RU = {
        mean: RU_constrained,
        public: Math.round(RU_constrained * 100),
        method_version: 'RU-v1',
        weights
      };
    }
    
    return c.json(results);
  } catch (error) {
    console.error('Error calculating all dimensions:', error);
    return c.json({ error: 'Failed to calculate dimensions', details: String(error) }, 500);
  }
});

// ==================== PHASE 6: CONTENT MANAGEMENT ROUTES ====================

// ===== USER PROFILES =====

// Get user profile
app.get('/make-server-17cae920/profile/:userId', verifyAuth, async (c) => {
  try {
    const userId = c.req.param('userId');
    let profile = await kv.get(`user_profile:${userId}`);
    
    // If profile doesn't exist, create a default one (for existing users)
    if (!profile) {
      console.log(`Profile not found for user ${userId}, creating default profile`);
      
      // Try to get user email from context or from Supabase
      let userEmail = c.get('userEmail');
      let userName = userEmail ? userEmail.split('@')[0] : 'User';
      
      // If we don't have email in context, try to get it from Supabase
      if (!userEmail) {
        try {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          );
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          if (userData?.user) {
            userEmail = userData.user.email || '';
            userName = userData.user.user_metadata?.name || userEmail.split('@')[0];
          }
        } catch (err) {
          console.error('Error fetching user data from Supabase:', err);
        }
      }
      
      profile = {
        user_id: userId,
        email: userEmail || '',
        name: userName,
        bio: '',
        social_link: '',
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await kv.set(`user_profile:${userId}`, profile);
      console.log(`Created default profile for user ${userId}`);
    }
    
    return c.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile', details: String(error) }, 500);
  }
});

// Update user profile
app.put('/make-server-17cae920/profile/:userId', verifyAuth, async (c) => {
  try {
    const userId = c.req.param('userId');
    const requestingUserId = c.get('userId');
    
    // Users can only update their own profile
    if (userId !== requestingUserId) {
      return c.json({ error: 'Unauthorized - can only update own profile' }, 403);
    }
    
    const updates = await c.req.json();
    const existing = await kv.get(`user_profile:${userId}`) || {};
    
    // Merge updates (bio, social_link, avatar_url only)
    const updatedProfile = {
      ...existing,
      bio: updates.bio,
      social_link: updates.social_link,
      avatar_url: updates.avatar_url,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`user_profile:${userId}`, updatedProfile);
    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile', details: String(error) }, 500);
  }
});

// ===== ARTICLES =====

// Get all articles (public)
app.get('/make-server-17cae920/articles', async (c) => {
  try {
    const status = c.req.query('status') || 'published';
    const materialId = c.req.query('material_id');
    
    let articles = await kv.getByPrefix('article:');
    
    // Filter by status
    if (status) {
      articles = articles?.filter(a => a.status === status) || [];
    }
    
    // Filter by material_id
    if (materialId) {
      articles = articles?.filter(a => a.material_id === materialId) || [];
    }
    
    return c.json({ articles: articles || [] });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return c.json({ error: 'Failed to fetch articles', details: String(error) }, 500);
  }
});

// Get single article
app.get('/make-server-17cae920/articles/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const article = await kv.get(`article:${id}`);
    
    if (!article) {
      return c.json({ error: 'Article not found' }, 404);
    }
    
    return c.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return c.json({ error: 'Failed to fetch article', details: String(error) }, 500);
  }
});

// Create article (authenticated users)
app.post('/make-server-17cae920/articles', verifyAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const articleData = await c.req.json();
    
    const article = {
      id: crypto.randomUUID(),
      ...articleData,
      author_id: userId,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`article:${article.id}`, article);
    return c.json({ article });
  } catch (error) {
    console.error('Error creating article:', error);
    return c.json({ error: 'Failed to create article', details: String(error) }, 500);
  }
});

// Update article
app.put('/make-server-17cae920/articles/:id', verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const updates = await c.req.json();
    
    const existing = await kv.get(`article:${id}`);
    if (!existing) {
      return c.json({ error: 'Article not found' }, 404);
    }
    
    // Check permission (author or admin)
    const userRole = await kv.get(`user_role:${userId}`);
    if (existing.author_id !== userId && userRole !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const updatedArticle = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`article:${id}`, updatedArticle);
    return c.json({ article: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);
    return c.json({ error: 'Failed to update article', details: String(error) }, 500);
  }
});

// Delete article (author or admin)
app.delete('/make-server-17cae920/articles/:id', verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    
    const existing = await kv.get(`article:${id}`);
    if (!existing) {
      return c.json({ error: 'Article not found' }, 404);
    }
    
    // Check permission
    const userRole = await kv.get(`user_role:${userId}`);
    if (existing.author_id !== userId && userRole !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    await kv.del(`article:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return c.json({ error: 'Failed to delete article', details: String(error) }, 500);
  }
});

// ===== SUBMISSIONS =====

// Get all submissions (admin only)
app.get('/make-server-17cae920/submissions', verifyAuth, verifyAdmin, async (c) => {
  try {
    const status = c.req.query('status');
    let submissions = await kv.getByPrefix('submission:');
    
    if (status) {
      submissions = submissions?.filter(s => s.status === status) || [];
    }
    
    return c.json({ submissions: submissions || [] });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return c.json({ error: 'Failed to fetch submissions', details: String(error) }, 500);
  }
});

// Get user's own submissions
app.get('/make-server-17cae920/submissions/my', verifyAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const submissions = await kv.getByPrefix('submission:');
    const userSubmissions = submissions?.filter(s => s.submitted_by === userId) || [];
    
    return c.json({ submissions: userSubmissions });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return c.json({ error: 'Failed to fetch submissions', details: String(error) }, 500);
  }
});

// Create submission (authenticated users)
app.post('/make-server-17cae920/submissions', verifyAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const submissionData = await c.req.json();
    
    const submission = {
      id: crypto.randomUUID(),
      ...submissionData,
      submitted_by: userId,
      status: 'pending_review',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`submission:${submission.id}`, submission);
    
    // Create notification for admins
    const adminNotification = {
      id: crypto.randomUUID(),
      user_id: 'admin', // Special case for admin notifications
      type: 'new_review_item',
      content_id: submission.id,
      content_type: 'submission',
      message: `New ${submission.type} submission from user`,
      read: false,
      created_at: new Date().toISOString()
    };
    
    await kv.set(`notification:${adminNotification.id}`, adminNotification);
    
    return c.json({ submission });
  } catch (error) {
    console.error('Error creating submission:', error);
    return c.json({ error: 'Failed to create submission', details: String(error) }, 500);
  }
});

// Update submission (admin only)
app.put('/make-server-17cae920/submissions/:id', verifyAuth, verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const updates = await c.req.json();
    
    const existing = await kv.get(`submission:${id}`);
    if (!existing) {
      return c.json({ error: 'Submission not found' }, 404);
    }
    
    const updatedSubmission = {
      ...existing,
      ...updates,
      reviewed_by: userId,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`submission:${id}`, updatedSubmission);
    
    // If approved/rejected, notify the submitter
    if (updates.status === 'approved' || updates.status === 'rejected') {
      const notification = {
        id: crypto.randomUUID(),
        user_id: existing.submitted_by,
        type: 'submission_approved',
        content_id: id,
        content_type: 'submission',
        message: updates.status === 'approved' ? 'Your submission was approved!' : 'Your submission was rejected',
        read: false,
        created_at: new Date().toISOString()
      };
      
      await kv.set(`notification:${notification.id}`, notification);
    }
    
    // If feedback provided, notify submitter
    if (updates.feedback) {
      const notification = {
        id: crypto.randomUUID(),
        user_id: existing.submitted_by,
        type: 'feedback_received',
        content_id: id,
        content_type: 'submission',
        message: 'You received feedback on your submission',
        read: false,
        created_at: new Date().toISOString()
      };
      
      await kv.set(`notification:${notification.id}`, notification);
    }
    
    return c.json({ submission: updatedSubmission });
  } catch (error) {
    console.error('Error updating submission:', error);
    return c.json({ error: 'Failed to update submission', details: String(error) }, 500);
  }
});

// Delete submission (admin only)
app.delete('/make-server-17cae920/submissions/:id', verifyAuth, verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`submission:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return c.json({ error: 'Failed to delete submission', details: String(error) }, 500);
  }
});

// ===== NOTIFICATIONS =====

// Get user notifications
app.get('/make-server-17cae920/notifications/:userId', verifyAuth, async (c) => {
  try {
    const userId = c.req.param('userId');
    const requestingUserId = c.get('userId');
    const userRole = await kv.get(`user_role:${requestingUserId}`);
    
    // Users can only see their own notifications, admins see all admin notifications
    if (userId !== requestingUserId && !(userRole === 'admin' && userId === 'admin')) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const allNotifications = await kv.getByPrefix('notification:');
    const userNotifications = allNotifications?.filter(n => n.user_id === userId) || [];
    
    return c.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications', details: String(error) }, 500);
  }
});

// Mark notification as read
app.put('/make-server-17cae920/notifications/:id/read', verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const notification = await kv.get(`notification:${id}`);
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    notification.read = true;
    await kv.set(`notification:${id}`, notification);
    
    return c.json({ notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Failed to update notification', details: String(error) }, 500);
  }
});

// Mark all notifications as read for a user
app.put('/make-server-17cae920/notifications/:userId/read-all', verifyAuth, async (c) => {
  try {
    const userId = c.req.param('userId');
    const requestingUserId = c.get('userId');
    
    if (userId !== requestingUserId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const allNotifications = await kv.getByPrefix('notification:');
    const userNotifications = allNotifications?.filter(n => n.user_id === userId && !n.read) || [];
    
    for (const notification of userNotifications) {
      notification.read = true;
      await kv.set(`notification:${notification.id}`, notification);
    }
    
    return c.json({ success: true, count: userNotifications.length });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return c.json({ error: 'Failed to update notifications', details: String(error) }, 500);
  }
});

// Catch-all 404 handler for debugging
app.all('*', (c) => {
  console.log(`❌ 404 - Unmatched route: ${c.req.method} ${c.req.url}`);
  console.log(`❌ Path: ${c.req.path}`);
  console.log(`❌ Headers:`, JSON.stringify(Object.fromEntries(c.req.header())));
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

// Run initialization
initializeAdminUser();
initializeWhitepapers();

Deno.serve(app.fetch);