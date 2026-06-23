import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import { logger as log } from "./logger.tsx";
import {
  normalizeDOI,
  calculateSimilarity,
  areTitlesSimilar,
} from "./string-utils.tsx";
import { handlePublicExport, handleResearchExport } from "./exports.tsx";
import {
  buildEntityBackfillDryRun,
  ENTITY_BACKFILL_APPLY_CONFIRMATION,
  ENTITY_BACKFILL_PHASES,
  ENTITY_BACKFILL_VERSION,
  parseEntityBackfillRecoveryArtifact,
  resumeEntityBackfillApply,
  startEntityBackfillApply,
} from "./graph-migration.tsx";

// Evidence routes are implemented inline here because the previous split module
// depended on app-only utilities that are not accessible in Edge Functions.
// Phase 9.1 routes are now implemented inline in this file instead

// WasteDB Server - v1.1.0 (Hardened Security)
const app = new Hono();

// Add logger middleware
app.use("*", logger(console.log));

// ==================== TRANSFORM DEFINITIONS ====================

const TRANSFORMS_DATA = {
  version: "1.0",
  last_updated: "2025-11-12",
  description:
    "Versioned transform definitions for all 13 WasteDB parameters. Each transform converts raw extracted values to normalized ratios (0-1 scale).",
  transforms: [
    {
      id: "Y_v1.0",
      parameter: "Y",
      dimension: "CR",
      name: "Yield",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is extraction yield as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "D_v1.0",
      parameter: "D",
      dimension: "CR",
      name: "Degradability",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is degradation rate as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "C_v1.0",
      parameter: "C",
      dimension: "CR",
      name: "Contamination",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is contamination tolerance as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "M_v1.0",
      parameter: "M",
      dimension: "CR",
      name: "Maturity",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is market maturity as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "E_v1.0",
      parameter: "E",
      dimension: "CR",
      name: "Energy",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is energy efficiency as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "B_v1.0",
      parameter: "B",
      dimension: "CC",
      name: "Biodegradation",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is biodegradation rate as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "N_v1.0",
      parameter: "N",
      dimension: "CC",
      name: "Nutrient Balance",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is nutrient balance score as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "T_v1.0",
      parameter: "T",
      dimension: "CC",
      name: "Toxicity",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is toxicity safety score as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "H_v1.0",
      parameter: "H",
      dimension: "CC",
      name: "Habitat Adaptability",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is habitat adaptability score as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "L_v1.0",
      parameter: "L",
      dimension: "RU",
      name: "Lifetime",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is expected lifetime score as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "R_v1.0",
      parameter: "R",
      dimension: "RU",
      name: "Repairability",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is repairability score as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "U_v1.0",
      parameter: "U",
      dimension: "RU",
      name: "Upgradability",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is upgradability score as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
    {
      id: "C_RU_v1.0",
      parameter: "C_RU",
      dimension: "RU",
      name: "Contamination (Reusability)",
      formula: "value / 100",
      description:
        "Convert percentage to ratio. Raw value is contamination tolerance for reuse as percentage (0-100%), transformed to ratio (0-1).",
      version: "1.0",
      effective_date: "2025-11-12",
      unit_input: "%",
      unit_output: "ratio",
      changelog: "Initial version - direct percentage to ratio conversion",
    },
  ],
  usage_notes: [
    "All transforms currently use simple percentage-to-ratio conversion (divide by 100)",
    "Future versions may implement non-linear transforms based on research findings",
    "When updating a transform, increment version number and update effective_date",
    "Old transform versions should be preserved in changelog for audit trail",
    "Recompute jobs should be triggered whenever transform formulas change",
  ],
};

// ==================== SECURITY MIDDLEWARE ====================

// Rate limiting configuration
const RATE_LIMITS = {
  AUTH: { window: 60000, maxRequests: 5 }, // 5 auth requests per minute
  API: { window: 60000, maxRequests: 100 }, // 100 API requests per minute
  SIGNUP: { window: 3600000, maxRequests: 3 }, // 3 signups per hour per IP
  TAKEDOWN: { window: 86400000, maxRequests: 2 }, // 2 takedown requests per 24 hours per IP
};

// Get client identifier (IP + User-Agent hash)
function getClientId(c: any): string {
  const forwarded = c.req.header("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const userAgent = c.req.header("user-agent") || "unknown";
  // Simple hash to avoid storing full user agents
  const uaHash = userAgent.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);
  return `${ip}:${uaHash}`;
}

// Rate limiting middleware factory
function rateLimit(
  type: keyof typeof RATE_LIMITS,
  options?: { allowAdminBypass?: boolean },
) {
  return async (c: any, next: any) => {
    // Check for admin bypass if enabled
    if (options?.allowAdminBypass) {
      const authHeader = c.req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          );
          const {
            data: { user },
          } = await supabase.auth.getUser(token);
          if (user) {
            const userRole = await getUserRole(user.id);
            if (userRole === "admin") {
              log.log(`✓ Admin user bypassing ${type} rate limit`);
              await next();
              return;
            }
          }
        } catch (error) {
          // Ignore auth errors - continue with normal rate limiting
        }
      }
    }

    const clientId = getClientId(c);
    const key = `ratelimit:${type}:${clientId}`;
    const now = Date.now();

    try {
      // Get existing rate limit data
      const data = (await kv.get(key)) as {
        requests: number[];
        firstRequest: number;
      } | null;

      const limit = RATE_LIMITS[type];
      const windowStart = now - limit.window;

      if (data) {
        // Filter out old requests outside the time window
        const recentRequests = data.requests.filter(
          (timestamp) => timestamp > windowStart,
        );

        if (recentRequests.length >= limit.maxRequests) {
          const oldestRequest = Math.min(...recentRequests);
          const resetIn = Math.ceil(
            (oldestRequest + limit.window - now) / 1000,
          );

          log.log(
            `Rate limit exceeded for ${clientId} on ${type}: ${recentRequests.length}/${limit.maxRequests}`,
          );

          return c.json(
            {
              error: "Rate limit exceeded. Please try again later.",
              retryAfter: resetIn,
            },
            429,
          );
        }

        // Add current request
        recentRequests.push(now);
        await kv.set(key, {
          requests: recentRequests,
          firstRequest: data.firstRequest,
        });
      } else {
        // First request in window
        await kv.set(key, { requests: [now], firstRequest: now });
      }

      await next();
    } catch (error) {
      log.error("Rate limiting error:", error);
      // Fail open - don't block on rate limit errors
      await next();
    }
  };
}

// Email domain validation
const ALLOWED_EMAIL_PATTERNS = [
  /@wastefull\.org$/i, // Official organization emails
  /@wastedb\.app$/i, // Demo/testing emails
  /.+@.+\..+/, // Any valid email for regular users (will be non-admin)
];

function validateEmail(email: string): {
  valid: boolean;
  isOrgEmail: boolean;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, isOrgEmail: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic format validation
  if (!/.+@.+\..+/.test(trimmedEmail)) {
    return { valid: false, isOrgEmail: false, error: "Invalid email format" };
  }

  // Check for suspicious patterns
  if (
    trimmedEmail.includes("..") ||
    (trimmedEmail.includes("+") && trimmedEmail.split("+").length > 2)
  ) {
    return {
      valid: false,
      isOrgEmail: false,
      error: "Email contains suspicious patterns",
    };
  }

  // Validate length
  if (trimmedEmail.length > 254) {
    return { valid: false, isOrgEmail: false, error: "Email is too long" };
  }

  // Check if it's an organization email
  const isOrgEmail = /@wastefull\.org$/i.test(trimmedEmail);

  return { valid: true, isOrgEmail };
}

// Determine initial role for a user based on email
function getInitialRole(email: string): "user" | "staff" | "admin" {
  if (/@wastefull\.org$/i.test(email)) return "staff";
  return "user";
}

function getPublicContactEmail(): string {
  return Deno.env.get("PUBLIC_CONTACT_EMAIL")?.trim() || "admin@wastefull.org";
}

function getAdminNotificationEmails(): string[] {
  return (
    Deno.env.get("ADMIN_NOTIFICATION_EMAILS") || getPublicContactEmail()
  )
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

async function findAuthUserByEmail(supabase: any, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    log.error("Error listing users while resolving email:", error);
    return null;
  }

  return (
    data?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail) ||
    null
  );
}

async function findAuthUserById(supabase: any, userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    log.error("Error fetching auth user by id:", error);
    return null;
  }
  return data?.user || null;
}

async function resolveCanonicalUserIdFromAlias(
  supabase: any,
  authEmail: string,
  fallbackUserId: string,
) {
  const aliasKey = `auth_email_alias:${authEmail.toLowerCase()}`;
  const aliasRecord = (await kv.get(aliasKey)) as
    | string
    | { targetUserId?: string; targetEmail?: string }
    | null;

  if (!aliasRecord) {
    return fallbackUserId;
  }

  let targetUserId: string | null = null;

  if (typeof aliasRecord === "string") {
    if (aliasRecord.includes("@")) {
      const targetByEmail = await findAuthUserByEmail(supabase, aliasRecord);
      targetUserId = targetByEmail?.id || null;
    } else {
      targetUserId = aliasRecord;
    }
  } else {
    if (aliasRecord.targetUserId) {
      targetUserId = aliasRecord.targetUserId;
    } else if (aliasRecord.targetEmail) {
      const targetByEmail = await findAuthUserByEmail(
        supabase,
        aliasRecord.targetEmail,
      );
      targetUserId = targetByEmail?.id || null;
    }
  }

  if (!targetUserId) {
    log.warn(`Alias exists but target could not be resolved for ${authEmail}`);
    return fallbackUserId;
  }

  return targetUserId;
}

// Password strength validation
function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }

  // Check for common weak passwords
  const weakPasswords = [
    "password",
    "12345678",
    "qwertyui",
    "admin123",
    "letmein1",
  ];
  if (weakPasswords.some((weak) => password.toLowerCase().includes(weak))) {
    return {
      valid: false,
      error: "Password is too weak. Please choose a stronger password.",
    };
  }

  return { valid: true };
}

// Honeypot validation (checks for bot-submitted hidden field)
function checkHoneypot(honeypot: any): boolean {
  // If honeypot field is filled, it's likely a bot
  return !honeypot || honeypot === "";
}

// Enable CORS for all routes and methods
const ALLOWED_ORIGINS = [
  "https://db.wastefull.org",
  "http://localhost:3000",
  "https://down-throb-76669668.figma.site",
  "https://wastefull.org",
  "https://demo.wastefull.org",
  "http://localhost:5173",
  "https://wastefull.github.io/main",
  "https://wastefull.github.io",
];
app.use(
  "/*",
  cors({
    origin: (origin) =>
      ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Session-Token",
      "Cookie",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// ==================== SESSION COOKIE HELPERS ====================

const SESSION_COOKIE_NAME = "wastedb_session";
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function setSessionCookie(c: any, token: string): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_COOKIE_MAX_AGE}; Path=/`,
  );
}

function clearSessionCookie(c: any): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/`,
  );
}

function getSessionCookieToken(c: any): string | null {
  const cookieHeader = c.req.header("Cookie") || "";
  const match = cookieHeader.match(/wastedb_session=([^;]+)/);
  return match?.[1] || null;
}

// ==================== STORAGE INITIALIZATION ====================

// Initialize Supabase Storage buckets on startup
async function initializeStorage() {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const buckets = [
      {
        name: "make-17cae920-assets",
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/svg+xml",
          "image/webp",
        ],
      },
      {
        name: "make-17cae920-source-pdfs",
        public: true, // Public bucket (access still controlled via app logic + UUID filenames)
        fileSizeLimit: 20971520, // 20MB limit for PDFs
        allowedMimeTypes: ["application/pdf"],
      },
    ];

    const { data: existingBuckets } = await supabase.storage.listBuckets();

    for (const bucketConfig of buckets) {
      const existingBucket = existingBuckets?.find(
        (bucket) => bucket.name === bucketConfig.name,
      );

      if (!existingBucket) {
        // Create new bucket
        const { error } = await supabase.storage.createBucket(
          bucketConfig.name,
          {
            public: bucketConfig.public,
            fileSizeLimit: bucketConfig.fileSizeLimit,
            allowedMimeTypes: bucketConfig.allowedMimeTypes,
          },
        );

        if (error) {
          log.error(
            `Error creating storage bucket ${bucketConfig.name}:`,
            error,
          );
        } else {
          log.log(
            `✅ Created ${
              bucketConfig.public ? "public" : "private"
            } storage bucket: ${bucketConfig.name}`,
          );
        }
      } else if (existingBucket.public !== bucketConfig.public) {
        // Bucket exists but has wrong privacy setting - update it
        log.log(
          `⚠️ Bucket ${bucketConfig.name} exists as ${
            existingBucket.public ? "public" : "private"
          }, updating to ${bucketConfig.public ? "public" : "private"}...`,
        );
        const { error } = await supabase.storage.updateBucket(
          bucketConfig.name,
          {
            public: bucketConfig.public,
            fileSizeLimit: bucketConfig.fileSizeLimit,
            allowedMimeTypes: bucketConfig.allowedMimeTypes,
          },
        );

        if (error) {
          log.error(
            `Error updating storage bucket ${bucketConfig.name}:`,
            error,
          );
        } else {
          log.log(
            `✅ Updated bucket ${bucketConfig.name} to ${
              bucketConfig.public ? "public" : "private"
            }`,
          );
        }
      } else {
        log.log(
          `✅ Storage bucket already exists: ${bucketConfig.name} (${
            bucketConfig.public ? "public" : "private"
          })`,
        );
      }
    }
  } catch (error) {
    log.error("Error initializing storage:", error);
  }
}

// Initialize storage on server startup
initializeStorage();

// Middleware to verify authentication
async function verifyAuth(c: any, next: any) {
  // Check for custom session token in X-Session-Token header
  const sessionToken = c.req.header("X-Session-Token");
  log.log("verifyAuth: Custom session token present:", Boolean(sessionToken));

  // Also accept persistent session cookie as a token source
  const cookieToken = getSessionCookieToken(c);

  // If no session token or cookie, check Authorization header for backward compatibility
  if (!sessionToken && !cookieToken) {
    const authHeader = c.req.header("Authorization");
    log.log("verifyAuth: Authorization header present:", Boolean(authHeader));

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      log.log("verifyAuth: Missing or invalid Authorization header");
      return c.json({ error: "Unauthorized - missing token" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const publicAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (token === publicAnonKey) {
      log.log("verifyAuth: Public anonymous key is not user authentication");
      return c.json({ error: "Unauthorized - user authentication required" }, 401);
    }
  }

  const token =
    sessionToken ||
    cookieToken ||
    c.req.header("Authorization")?.split(" ")[1] ||
    "";

  try {
    // First, check if this is a custom session token (magic link)
    log.log("verifyAuth: Checking for custom session token in KV...");
    const sessionData = (await kv.get(`session:${token}`)) as {
      userId: string;
      email: string;
      expiry: number;
      createdAt: number;
    } | null;

    log.log("verifyAuth: Session data found:", Boolean(sessionData));
    if (!sessionData) {
      log.log("verifyAuth: No session found in KV for this token");
    }

    if (sessionData) {
      // Verify session hasn't expired
      if (Date.now() > sessionData.expiry) {
        log.log("verifyAuth: Session expired");
        await kv.del(`session:${token}`);
        return c.json({ error: "Session expired - please sign in again" }, 401);
      }

      // Session is valid - set context and continue
      log.log("verifyAuth: Session valid, setting context");
      c.set("userId", sessionData.userId);
      c.set("userEmail", sessionData.email);
      await next();
      return;
    }

    // If not a custom session, try Supabase JWT token (for backward compatibility)
    log.log("verifyAuth: No custom session, trying Supabase JWT...");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      log.log("verifyAuth: Supabase JWT validation failed:", error);
      return c.json({ error: "Unauthorized - invalid token" }, 401);
    }

    // Store user ID and email in context for use in route handlers
    log.log("verifyAuth: Supabase JWT valid");
    c.set("userId", user.id);
    c.set("userEmail", user.email);
    await next();
  } catch (error) {
    log.error("Auth verification error:", error);
    return c.json({ error: "Unauthorized - verification failed" }, 401);
  }
}

// ─── Role helpers (Step 19) ─────────────────────────────────────────────────
// Roles are stored in user_profiles.role (Postgres). These helpers replace all
// kv.get/set("user_role:*") calls throughout the file.

function _roleClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

async function getUserRole(userId: string): Promise<string> {
  const { data } = await _roleClient()
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role || "user";
}

async function setUserRole(userId: string, role: string): Promise<void> {
  await _roleClient()
    .from("user_profiles")
    .upsert({ id: userId, role }, { onConflict: "id" });
}

// Middleware to verify admin role
// NOTE: User roles are stored in user_profiles.role (Postgres) — see getUserRole().
async function verifyAdmin(c: any, next: any) {
  const userId = c.get("userId");

  log.log("verifyAdmin: Checking explicit role for authenticated user");

  if (!userId) {
    log.log("verifyAdmin: No userId found in context");
    return c.json({ error: "Unauthorized - authentication required" }, 401);
  }

  try {
    const userRole = await getUserRole(userId);
    log.log("verifyAdmin: User role from Postgres:", userRole);

    if (userRole !== "admin") {
      return c.json({ error: "Forbidden - admin role required" }, 403);
    }

    c.set("userRole", userRole);
    await next();
  } catch (error) {
    log.error("Admin verification error:", error);
    return c.json(
      { error: "Authorization check failed", details: String(error) },
      500,
    );
  }
}

// All available permissions in the system
const ALL_PERMISSIONS = [
  "materials.create",
  "materials.edit",
  "materials.delete",
  "materials.batch",
  "articles.create",
  "articles.edit.own",
  "articles.edit.any",
  "articles.delete.own",
  "articles.delete.any",
  "guides.create",
  "guides.edit.own",
  "guides.edit.any",
  "guides.delete.own",
  "guides.delete.any",
  "blog.create",
  "blog.edit.own",
  "blog.edit.any",
  "blog.delete.own",
  "blog.delete.any",
  "users.view",
  "users.manage",
  "users.roles",
  "assets.upload",
  "assets.delete",
  "sources.manage",
  "sources.upload",
  "calculations.run",
];

// Default permissions per role (admin always has all, not stored)
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  user: [
    "articles.create",
    "articles.edit.own",
    "articles.delete.own",
    "guides.create",
    "guides.edit.own",
    "guides.delete.own",
    "blog.create",
    "blog.edit.own",
    "blog.delete.own",
  ],
  staff: [
    "articles.create",
    "articles.edit.own",
    "articles.delete.own",
    "guides.create",
    "guides.edit.own",
    "guides.delete.own",
    "blog.create",
    "blog.edit.own",
    "blog.delete.own",
    "sources.upload",
  ],
};

// Check if a user has a specific permission
async function hasPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  const userRole = await getUserRole(userId);
  // Admin always has all permissions
  if (userRole === "admin") return true;

  const role = userRole || "user";
  // Check for stored custom permissions, fall back to defaults
  const stored = await kv.get(`role_permissions:${role}`);
  const perms: string[] = stored || DEFAULT_ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

// Middleware factory: require a specific permission
function requirePermission(permission: string) {
  return async (c: any, next: any) => {
    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Unauthorized - authentication required" }, 401);
    }
    const allowed = await hasPermission(userId, permission);
    if (!allowed) {
      return c.json(
        { error: `Forbidden - missing permission: ${permission}` },
        403,
      );
    }
    await next();
  };
}

// Health check endpoint (public)
app.get("/make-server-17cae920/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== MAINTENANCE MODE ====================

// GET /maintenance — public, returns current maintenance state
app.get("/make-server-17cae920/maintenance", async (c) => {
  try {
    const data = (await kv.get("site:maintenance_mode")) as {
      enabled: boolean;
      startedAt: number;
    } | null;
    return c.json({
      enabled: data?.enabled ?? false,
      startedAt: data?.enabled ? (data.startedAt ?? null) : null,
    });
  } catch (error) {
    log.error("GET /maintenance error:", error);
    return c.json({ enabled: false, startedAt: null });
  }
});

// POST /maintenance — admin only, toggles maintenance mode
app.post(
  "/make-server-17cae920/maintenance",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const body = await c.req.json();
      const enabled = Boolean(body.enabled);
      if (enabled) {
        await kv.set("site:maintenance_mode", {
          enabled: true,
          startedAt: Date.now(),
        });
      } else {
        await kv.del("site:maintenance_mode");
      }
      const data = enabled
        ? ((await kv.get("site:maintenance_mode")) as {
            enabled: boolean;
            startedAt: number;
          })
        : null;
      log.log(
        `Maintenance mode ${enabled ? "ENABLED" : "DISABLED"} by admin ${c.get("userEmail")}`,
      );
      return c.json({
        enabled,
        startedAt: data?.startedAt ?? null,
      });
    } catch (error) {
      log.error("POST /maintenance error:", error);
      return c.json({ error: "Failed to update maintenance mode" }, 500);
    }
  },
);

// Restore session from persistent cookie (public - handles its own auth via cookie)
app.get("/make-server-17cae920/auth/session", async (c) => {
  try {
    const token = getSessionCookieToken(c);
    if (!token) {
      return c.json({ user: null }, 200);
    }

    const sessionData = (await kv.get(`session:${token}`)) as {
      userId: string;
      email: string;
      canonicalEmail?: string;
      expiry: number;
    } | null;

    if (!sessionData) {
      clearSessionCookie(c);
      return c.json({ user: null }, 200);
    }

    if (Date.now() > sessionData.expiry) {
      await kv.del(`session:${token}`);
      clearSessionCookie(c);
      return c.json({ user: null }, 200);
    }

    const { data: _sessionProfileRow } = await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )
      .from("user_profiles")
      .select("name")
      .eq("id", sessionData.userId)
      .maybeSingle();
    const displayName =
      _sessionProfileRow?.name ||
      (sessionData.canonicalEmail || sessionData.email)?.split("@")[0];

    // Refresh cookie expiry on each use
    setSessionCookie(c, token);

    return c.json({
      access_token: token,
      user: {
        id: sessionData.userId,
        email: sessionData.canonicalEmail || sessionData.email,
        name: displayName,
      },
    });
  } catch (error) {
    log.error("Session restore error:", error);
    return c.json({ error: "Server error" }, 500);
  }
});

// Sign out endpoint (public - clears the session cookie)
app.post("/make-server-17cae920/auth/signout", async (c) => {
  try {
    const token = getSessionCookieToken(c);
    if (token) {
      await kv.del(`session:${token}`);
    }
    clearSessionCookie(c);
    return c.json({ message: "Signed out" });
  } catch (error) {
    log.error("Signout error:", error);
    clearSessionCookie(c);
    return c.json({ message: "Signed out" });
  }
});

// Sign up endpoint (public, rate-limited)
app.post(
  "/make-server-17cae920/auth/signup",
  rateLimit("SIGNUP"),
  async (c) => {
    try {
      const body = await c.req.json();
      const { email, password, name, honeypot } = body;

      // Check honeypot (anti-bot)
      if (!checkHoneypot(honeypot)) {
        log.log("Honeypot triggered for signup attempt");
        // Return success to not alert bots
        return c.json({
          user: { id: "blocked", email: "blocked", name: "blocked" },
        });
      }

      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return c.json({ error: emailValidation.error || "Invalid email" }, 400);
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return c.json(
          { error: passwordValidation.error || "Invalid password" },
          400,
        );
      }

      // Check for duplicate signups from same IP (additional anti-abuse)
      const clientId = getClientId(c);
      const recentSignupsKey = `recent_signups:${clientId}`;
      const recentSignups = (await kv.get(recentSignupsKey)) as string[] | null;

      if (recentSignups && recentSignups.includes(email.toLowerCase())) {
        return c.json(
          { error: "Account already created from this location" },
          400,
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Create user with admin API
      // Note: Email confirmation is required. Users must verify their email before signing in.
      // Configure email templates in Supabase Dashboard > Authentication > Email Templates
      const { data, error } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        user_metadata: {
          name: name || email.split("@")[0],
          isOrgEmail: emailValidation.isOrgEmail,
          signupIp: getClientId(c).split(":")[0],
          signupTimestamp: new Date().toISOString(),
        },
        // Require email confirmation for security
        email_confirm: false,
      });

      if (error) {
        log.error("Signup error:", error);

        // Don't reveal if user already exists (security best practice)
        if (error.message?.includes("already registered")) {
          return c.json(
            {
              error: "Unable to create account. Please try signing in instead.",
            },
            400,
          );
        }

        return c.json(
          { error: "Failed to create account. Please try again." },
          400,
        );
      }

      // Track recent signup
      const updatedSignups = recentSignups
        ? [...recentSignups, email.toLowerCase()]
        : [email.toLowerCase()];
      await kv.set(recentSignupsKey, updatedSignups.slice(-10)); // Keep last 10

      // Initialize user profile + role in Postgres
      const initialRole = getInitialRole(email);
      await supabase.from("user_profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.name || email.split("@")[0],
          bio: "",
          social_link: "",
          avatar_url: "",
          display_email: "",
          show_on_leaderboard: true,
          org_role: "Volunteer",
          role: initialRole,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

      log.log(
        `New user created: ${email} (role: ${initialRole}) - awaiting email confirmation`,
      );

      return c.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
        },
        message:
          "Account created! Please check your email to confirm your account before signing in.",
      });
    } catch (error) {
      log.error("Signup exception:", error);
      return c.json(
        { error: "Server error during signup. Please try again." },
        500,
      );
    }
  },
);

// Sign in endpoint (public, rate-limited)
app.post("/make-server-17cae920/auth/signin", rateLimit("AUTH"), async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, honeypot } = body;

    // Check honeypot (anti-bot)
    if (!checkHoneypot(honeypot)) {
      log.log("Honeypot triggered for signin attempt");
      // Delay response to slow down bots
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return c.json({ error: "Invalid credentials" }, 401);
    }

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Track failed login attempts per email
    const failedAttemptsKey = `failed_logins:${email.toLowerCase()}`;
    const failedAttempts = (await kv.get(failedAttemptsKey)) as {
      count: number;
      lastAttempt: number;
    } | null;

    // Lock account after 5 failed attempts within 15 minutes
    if (failedAttempts && failedAttempts.count >= 5) {
      const lockDuration = 15 * 60 * 1000; // 15 minutes
      const timeSinceLastAttempt = Date.now() - failedAttempts.lastAttempt;

      if (timeSinceLastAttempt < lockDuration) {
        const remainingMinutes = Math.ceil(
          (lockDuration - timeSinceLastAttempt) / 60000,
        );
        log.log(
          `Account locked: ${email} (${failedAttempts.count} failed attempts)`,
        );
        return c.json(
          {
            error: `Too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
          },
          429,
        );
      } else {
        // Reset after lock duration
        await kv.del(failedAttemptsKey);
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      log.error("Signin error:", error);

      // Check if the error is due to unconfirmed email
      if (
        error.message?.includes("Email not confirmed") ||
        error.message?.includes("email_not_confirmed")
      ) {
        // Don't track as failed attempt for unconfirmed emails
        return c.json(
          {
            error:
              "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
            code: "EMAIL_NOT_CONFIRMED",
          },
          403,
        );
      }

      // Track failed attempt
      const newCount = failedAttempts ? failedAttempts.count + 1 : 1;
      await kv.set(failedAttemptsKey, {
        count: newCount,
        lastAttempt: Date.now(),
      });

      // Use generic error message to prevent user enumeration
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Additional check: verify user's email is confirmed
    if (data.user && !data.user.email_confirmed_at) {
      log.log(`Sign in blocked for unconfirmed email: ${email}`);
      return c.json(
        {
          error:
            "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
          code: "EMAIL_NOT_CONFIRMED",
        },
        403,
      );
    }

    // Clear failed attempts on successful login
    await kv.del(failedAttemptsKey);

    // Log successful login
    log.log(`Successful login: ${email}`);

    const { data: _signinProfileRow } = await supabase
      .from("user_profiles")
      .select("name")
      .eq("id", data.user.id)
      .maybeSingle();
    const signinDisplayName =
      _signinProfileRow?.name ||
      data.user.email?.split("@")[0] ||
      email.split("@")[0];

    // Create a persistent KV session (consistent 7-day expiry across all auth methods)
    const signinSessionToken = crypto.randomUUID();
    await kv.set(`session:${signinSessionToken}`, {
      userId: data.user.id,
      email: data.user.email?.toLowerCase(),
      canonicalEmail: data.user.email?.toLowerCase(),
      authProvider: "email",
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });
    await kv.set(`user_last_signin:${data.user.id}`, Date.now());
    await supabase
      .from("user_profiles")
      .update({ last_signin_at: new Date().toISOString() })
      .eq("id", data.user.id);
    setSessionCookie(c, signinSessionToken);

    return c.json({
      access_token: signinSessionToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: signinDisplayName,
      },
    });
  } catch (error) {
    log.error("Signin exception:", error);
    return c.json(
      { error: "Server error during signin. Please try again." },
      500,
    );
  }
});

// Send magic link (public, rate-limited)
app.post(
  "/make-server-17cae920/auth/magic-link",
  rateLimit("AUTH"),
  async (c) => {
    try {
      const body = await c.req.json();
      const { email, honeypot } = body;

      // Check honeypot (anti-bot)
      if (!checkHoneypot(honeypot)) {
        log.log("Honeypot triggered for magic link attempt");
        // Delay response to slow down bots
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return c.json({ error: "Invalid request" }, 400);
      }

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return c.json({ error: emailValidation.error || "Invalid email" }, 400);
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const trimmedEmail = email.toLowerCase().trim();

      // Generate a secure random token
      const magicToken = crypto.randomUUID();
      const tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour from now

      // Store the magic link token with expiry
      await kv.set(`magic_token:${magicToken}`, {
        email: trimmedEmail,
        expiry: tokenExpiry,
        used: false,
      });

      // Generate magic link pointing to the frontend app
      // In production, this should be https://db.wastefull.org
      const appUrl = Deno.env.get("APP_URL") || "https://db.wastefull.org";
      const magicLink = `${appUrl}?magic_token=${magicToken}`;

      // Send email via Resend
      const resendApiKey = Deno.env.get("RESEND_API_KEY");

      if (!resendApiKey) {
        log.error("RESEND_API_KEY not configured");
        return c.json(
          { error: "Email service not configured. Please contact support." },
          500,
        );
      }

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "WasteDB <auth@wastefull.org>",
            to: [trimmedEmail],
            subject: "Your WasteDB Magic Link",
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
          log.error("Resend API error:", errorData);
          throw new Error(`Failed to send email: ${emailResponse.status}`);
        }

        const emailData = await emailResponse.json();
        log.log(
          `Magic link email sent to ${trimmedEmail} (Resend ID: ${emailData.id})`,
        );

        return c.json({
          message: "Magic link sent successfully",
          email: trimmedEmail,
        });
      } catch (emailError) {
        log.error("Error sending magic link email:", emailError);
        // Still log to console for debugging
        log.log(`Fallback: Magic link for ${trimmedEmail}: ${magicLink}`);
        return c.json(
          {
            error: "Failed to send email. Please try again or contact support.",
          },
          500,
        );
      }
    } catch (error) {
      log.error("Magic link exception:", error);
      return c.json(
        { error: "Server error sending magic link. Please try again." },
        500,
      );
    }
  },
);

// Verify magic link token (public)
app.post("/make-server-17cae920/auth/verify-magic-link", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json({ error: "Token is required" }, 400);
    }

    // Get the magic link token data
    const tokenData = (await kv.get(`magic_token:${token}`)) as {
      email: string;
      expiry: number;
      used: boolean;
    } | null;

    if (!tokenData) {
      return c.json({ error: "Invalid or expired magic link" }, 401);
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiry) {
      await kv.del(`magic_token:${token}`);
      return c.json({ error: "Magic link has expired" }, 401);
    }

    // Check if token has already been used
    if (tokenData.used) {
      return c.json({ error: "Magic link has already been used" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const trimmedEmail = tokenData.email;
    let userData;

    // Check if user exists by listing users with email filter
    const { data: listResult, error: getUserError } =
      await supabase.auth.admin.listUsers();
    const existingUser = listResult?.users?.find(
      (u) => u.email === trimmedEmail,
    );

    if (existingUser) {
      // User exists
      userData = { user: existingUser };
      log.log(`Existing user found for magic link: ${trimmedEmail}`);
    } else {
      // User doesn't exist, create them
      log.log(`User not found, creating new user for: ${trimmedEmail}`);
      const emailValidation = validateEmail(trimmedEmail);
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: trimmedEmail,
          user_metadata: {
            name: trimmedEmail.split("@")[0],
            isOrgEmail: emailValidation.isOrgEmail,
            signupTimestamp: new Date().toISOString(),
            authMethod: "magic-link",
          },
          // Magic links auto-confirm since clicking the link verifies email ownership
          email_confirm: true,
        });

      if (createError) {
        log.error("Error creating user for magic link:", createError);

        // If user already exists (race condition), try to get them again
        if (
          createError.message?.includes("already been registered") ||
          createError.code === "email_exists"
        ) {
          const { data: retryListResult } =
            await supabase.auth.admin.listUsers();
          const retryUser = retryListResult?.users?.find(
            (u) => u.email === trimmedEmail,
          );
          if (retryUser) {
            userData = { user: retryUser };
            log.log(`User found on retry: ${trimmedEmail}`);
          } else {
            return c.json(
              { error: "Failed to retrieve existing account." },
              400,
            );
          }
        } else {
          return c.json(
            { error: "Failed to create account. Please try again." },
            400,
          );
        }
      } else {
        userData = newUser;

        // Initialize user role in Postgres
        const initialRole = getInitialRole(trimmedEmail);
        await setUserRole(userData.user.id, initialRole);
        log.log(
          `New magic link user created: ${trimmedEmail} (role: ${initialRole})`,
        );
      }
    }

    // Ensure role is set for existing users (ignoreDuplicates won't help here
    // since the row already exists — use upsert without ignoreDuplicates only
    // if the current role is the default).
    const currentRole = await getUserRole(userData.user.id);
    if (currentRole === "user") {
      const initialRole = getInitialRole(trimmedEmail);
      if (initialRole !== "user") {
        await setUserRole(userData.user.id, initialRole);
        log.log(
          `Role upgraded for existing user: ${trimmedEmail} (role: ${initialRole})`,
        );
      }
    }

    // Mark token as used
    await kv.set(`magic_token:${token}`, {
      ...tokenData,
      used: true,
    });

    // Generate a custom access token for this session
    const accessToken = crypto.randomUUID();
    const sessionExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    log.log(
      `Creating session for user ${userData.user.id} with token: ${accessToken}`,
    );
    log.log(`Session will be stored with key: session:${accessToken}`);

    // Store the session
    await kv.set(`session:${accessToken}`, {
      userId: userData.user.id,
      email: userData.user.email,
      expiry: sessionExpiry,
      createdAt: Date.now(),
    });

    // Track last sign-in time for user management display
    await kv.set(`user_last_signin:${userData.user.id}`, Date.now());
    await supabase
      .from("user_profiles")
      .update({ last_signin_at: new Date().toISOString() })
      .eq("id", userData.user.id);

    // Verify the session was stored
    const verifySession = await kv.get(`session:${accessToken}`);
    log.log(
      `Session storage verification:`,
      verifySession ? "SUCCESS" : "FAILED",
    );
    if (verifySession) {
      log.log(`Verified session data:`, JSON.stringify(verifySession));
    }

    log.log(`Successful magic link verification: ${trimmedEmail}`);
    log.log(`Returning access_token to frontend: ${accessToken}`);

    const { data: _magicLinkProfileRow } = await supabase
      .from("user_profiles")
      .select("name")
      .eq("id", userData.user.id)
      .maybeSingle();
    const magicLinkDisplayName =
      _magicLinkProfileRow?.name ||
      userData.user.email?.split("@")[0] ||
      trimmedEmail.split("@")[0];

    // Return user data and access token
    setSessionCookie(c, accessToken);
    return c.json({
      access_token: accessToken,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        name: magicLinkDisplayName,
      },
    });
  } catch (error) {
    log.error("Magic link verification exception:", error);
    return c.json(
      { error: "Server error during verification. Please try again." },
      500,
    );
  }
});

// Exchange a Supabase OAuth session token for a WasteDB custom session token
app.post(
  "/make-server-17cae920/auth/exchange-supabase-session",
  rateLimit("AUTH"),
  async (c) => {
    try {
      const body = await c.req.json();
      const { accessToken, provider } = body;

      if (!accessToken || typeof accessToken !== "string") {
        return c.json({ error: "accessToken is required" }, 400);
      }

      // Anon-key client for validating the incoming OAuth access token only
      const supabaseAnon = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      // Service-role client for admin operations (alias lookup, user fetch by id)
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const {
        data: { user },
        error,
      } = await supabaseAnon.auth.getUser(accessToken);

      if (error || !user) {
        log.error(
          "OAuth session exchange failed during token validation:",
          error,
        );
        return c.json({ error: "Invalid OAuth session token" }, 401);
      }

      const authEmail = user.email?.toLowerCase().trim();
      if (!authEmail) {
        return c.json({ error: "OAuth account is missing an email" }, 400);
      }

      if (!user.email_confirmed_at) {
        return c.json({ error: "Email must be verified before sign in" }, 403);
      }

      const emailValidation = validateEmail(authEmail);
      if (!emailValidation.valid) {
        return c.json(
          { error: emailValidation.error || "Invalid email address" },
          400,
        );
      }

      if (provider === "google") {
        const userProviders = Array.isArray(user.app_metadata?.providers)
          ? user.app_metadata.providers
          : [];
        const isGoogleAccount =
          user.app_metadata?.provider === "google" ||
          userProviders.includes("google");

        if (!isGoogleAccount) {
          return c.json({ error: "OAuth provider mismatch" }, 403);
        }

        if (!/@wastefull\.org$/i.test(authEmail)) {
          return c.json(
            {
              error:
                "Google sign-in is restricted to verified @wastefull.org accounts",
            },
            403,
          );
        }
      }

      const canonicalUserId = await resolveCanonicalUserIdFromAlias(
        supabaseAdmin,
        authEmail,
        user.id,
      );

      const canonicalUser =
        canonicalUserId === user.id
          ? user
          : await findAuthUserById(supabaseAdmin, canonicalUserId);

      if (!canonicalUser) {
        return c.json(
          { error: "Unable to resolve the linked WasteDB account" },
          404,
        );
      }

      const existingRole = await getUserRole(canonicalUserId);
      if (existingRole === "user") {
        const initialRole = getInitialRole(canonicalUser.email || authEmail);
        if (initialRole !== "user")
          await setUserRole(canonicalUserId, initialRole);
      }

      const accessTokenForSession = crypto.randomUUID();
      const sessionExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await kv.set(`session:${accessTokenForSession}`, {
        userId: canonicalUserId,
        email: authEmail,
        canonicalEmail: canonicalUser.email || authEmail,
        authProvider: provider || user.app_metadata?.provider || "oauth",
        expiry: sessionExpiry,
        createdAt: Date.now(),
      });

      // Track last sign-in time for user management display
      await kv.set(`user_last_signin:${canonicalUserId}`, Date.now());
      await supabaseAdmin
        .from("user_profiles")
        .update({ last_signin_at: new Date().toISOString() })
        .eq("id", canonicalUserId);

      const { data: _oauthProfileRow } = await supabaseAdmin
        .from("user_profiles")
        .select("name")
        .eq("id", canonicalUserId)
        .maybeSingle();
      const preferredDisplayName =
        _oauthProfileRow?.name ||
        canonicalUser.email?.split("@")[0] ||
        authEmail.split("@")[0];

      log.log(
        `OAuth session exchanged for ${authEmail} (canonical user: ${canonicalUserId})`,
      );

      setSessionCookie(c, accessTokenForSession);
      return c.json({
        access_token: accessTokenForSession,
        user: {
          id: canonicalUserId,
          email: canonicalUser.email || authEmail,
          name: preferredDisplayName,
        },
      });
    } catch (error) {
      log.error("OAuth session exchange exception:", error);
      return c.json(
        { error: "Server error during OAuth session exchange" },
        500,
      );
    }
  },
);

// Link one sign-in email alias to an existing auth user account (admin only)
app.post(
  "/make-server-17cae920/auth/link-email-alias",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const body = await c.req.json();
      const {
        aliasEmail,
        targetUserId,
        targetEmail,
      }: {
        aliasEmail?: string;
        targetUserId?: string;
        targetEmail?: string;
      } = body;

      if (!aliasEmail) {
        return c.json({ error: "aliasEmail is required" }, 400);
      }

      const aliasValidation = validateEmail(aliasEmail);
      if (!aliasValidation.valid) {
        return c.json(
          { error: aliasValidation.error || "Invalid aliasEmail" },
          400,
        );
      }

      if (!targetUserId && !targetEmail) {
        return c.json(
          { error: "Either targetUserId or targetEmail is required" },
          400,
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      let resolvedTargetUserId = targetUserId || "";

      if (!resolvedTargetUserId && targetEmail) {
        const targetUser = await findAuthUserByEmail(supabase, targetEmail);
        if (!targetUser) {
          return c.json({ error: "No auth user found for targetEmail" }, 404);
        }
        resolvedTargetUserId = targetUser.id;
      }

      if (!resolvedTargetUserId) {
        return c.json({ error: "Unable to resolve target user" }, 400);
      }

      const targetUser = await findAuthUserById(supabase, resolvedTargetUserId);
      if (!targetUser) {
        return c.json({ error: "Target auth user not found" }, 404);
      }

      const normalizedAlias = aliasEmail.trim().toLowerCase();
      await kv.set(`auth_email_alias:${normalizedAlias}`, resolvedTargetUserId);

      log.log(
        `Linked auth email alias ${normalizedAlias} -> ${resolvedTargetUserId}`,
      );

      return c.json({
        message: "Email alias linked successfully",
        aliasEmail: normalizedAlias,
        targetUserId: resolvedTargetUserId,
        targetEmail: targetUser.email,
      });
    } catch (error) {
      log.error("Link email alias exception:", error);
      return c.json({ error: "Server error while linking email alias" }, 500);
    }
  },
);

// Get all materials (public read access, rate-limited)
const normalizeMaterialFromEntry = (entry: { key: string; value: any }) => {
  const material = entry.value || {};
  const idFromKey = entry.key.startsWith("material:")
    ? entry.key.slice("material:".length)
    : "";

  // Some legacy rows have null/empty ids in value JSON.
  // Derive id from the KV key so records remain manageable/deletable.
  const normalizedId =
    typeof material.id === "string" && material.id.trim().length > 0
      ? material.id
      : idFromKey;

  return {
    ...material,
    id: normalizedId,
  };
};

// ─── Step 13: Postgres → frontend Article shape ───────────────────────────────
function pgArticleToShape(art: any) {
  return {
    id: art.id,
    title: art.title,
    article_type: art.article_type,
    sustainability_category: art.sustainability_category,
    cover_image_url: art.cover_image_url ?? undefined,
    content: art.content,
    dateAdded: art.date_added ?? art.created_at,
    created_by: art.created_by ?? undefined,
    edited_by: art.edited_by ?? undefined,
    writer_name: art.writer_name ?? undefined,
    editor_name: art.editor_name ?? undefined,
    slug: art.slug,
    material_id: art.legacy_material_kv_id,
    author_id: art.created_by ?? undefined,
    created_at: art.created_at,
    updated_at: art.updated_at,
    version: art.version,
    status: art.status,
  };
}

// ─── Step 13: Postgres → frontend Material shape ──────────────────────────────
function pgMaterialToShape(
  row: any,
  categoryNameById: Map<string, string>,
  articles: {
    compostability: any[];
    recyclability: any[];
    reusability: any[];
  },
  sources: any[],
) {
  const num = (v: any) =>
    v !== null && v !== undefined ? Number(v) : undefined;
  return {
    id: row.legacy_kv_id,
    name: row.name,
    aliases: row.aliases ?? undefined,
    // category: prefer display name from categories table; fall back to raw category_id value
    category:
      categoryNameById.get(row.category_id) ?? row.category_id ?? "Plastics",
    categoryId: row.category_id ?? undefined,
    description: row.description ?? undefined,
    isHub: row.is_hub ?? false,
    linkedMaterialIds: row.linked_material_ids ?? undefined,
    compostability: row.compostability ?? 0,
    recyclability: row.recyclability ?? 0,
    reusability: row.reusability ?? 0,
    // CR-v1
    Y_value: num(row.y_value),
    D_value: num(row.d_value),
    C_value: num(row.c_value),
    M_value: num(row.m_value),
    E_value: num(row.e_value),
    CR_practical_mean: num(row.cr_practical_mean),
    CR_theoretical_mean: num(row.cr_theoretical_mean),
    CR_practical_CI95: row.cr_practical_ci95 ?? undefined,
    CR_theoretical_CI95: row.cr_theoretical_ci95 ?? undefined,
    // CC-v1
    B_value: num(row.b_value),
    N_value: num(row.n_value),
    T_value: num(row.t_value),
    H_value: num(row.h_value),
    CC_practical_mean: num(row.cc_practical_mean),
    CC_theoretical_mean: num(row.cc_theoretical_mean),
    CC_practical_CI95: row.cc_practical_ci95 ?? undefined,
    CC_theoretical_CI95: row.cc_theoretical_ci95 ?? undefined,
    // RU-v1
    L_value: num(row.l_value),
    R_value: num(row.r_value),
    U_value: num(row.u_value),
    C_RU_value: num(row.c_ru_value),
    RU_practical_mean: num(row.ru_practical_mean),
    RU_theoretical_mean: num(row.ru_theoretical_mean),
    RU_practical_CI95: row.ru_practical_ci95 ?? undefined,
    RU_theoretical_CI95: row.ru_theoretical_ci95 ?? undefined,
    // Provenance
    confidence_level: row.confidence_level ?? undefined,
    whitepaper_version: row.whitepaper_version ?? undefined,
    calculation_timestamp: row.calculation_timestamp ?? undefined,
    method_version: row.method_version ?? undefined,
    wiki: row.wiki ?? undefined,
    created_by: row.created_by ?? undefined,
    edited_by: row.edited_by ?? undefined,
    writer_name: row.writer_name ?? undefined,
    editor_name: row.editor_name ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    articles,
    sources,
  };
}

// ─── Step 13: GET /materials — reads from Postgres (was: KV scan) ─────────────
app.get("/make-server-17cae920/materials", rateLimit("API"), async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. All materials that have a legacy KV id (service role bypasses RLS)
    const { data: pgMaterials, error: matError } = await supabase
      .from("materials")
      .select("*")
      .not("legacy_kv_id", "is", null);
    if (matError) throw matError;

    // 2. Category display-name lookup
    const { data: categories } = await supabase
      .from("material_categories")
      .select("id, name")
      .eq("deleted", false);
    const categoryNameById = new Map<string, string>(
      (categories ?? []).map((cat: any) => [cat.id, cat.name]),
    );

    // 3. All published articles, grouped by material KV id + sustainability_category
    const { data: pgArticles } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published");
    type ArticleGroup = {
      compostability: any[];
      recyclability: any[];
      reusability: any[];
    };
    const articlesByMaterial = new Map<string, ArticleGroup>();
    for (const art of pgArticles ?? []) {
      const mid = art.legacy_material_kv_id as string;
      if (!articlesByMaterial.has(mid)) {
        articlesByMaterial.set(mid, {
          compostability: [],
          recyclability: [],
          reusability: [],
        });
      }
      const cat = art.sustainability_category as
        | "compostability"
        | "recyclability"
        | "reusability";
      if (
        cat === "compostability" ||
        cat === "recyclability" ||
        cat === "reusability"
      ) {
        articlesByMaterial.get(mid)![cat].push(pgArticleToShape(art));
      }
    }

    // 4. material_sources with embedded source details, grouped by material KV id
    const { data: matSources } = await supabase
      .from("material_sources")
      .select(
        "legacy_material_kv_id, weight, parameters, sources(id, title, authors, year, doi, url, pdf_file_name)",
      );
    const sourcesByMaterial = new Map<string, any[]>();
    for (const ms of matSources ?? []) {
      const mid = ms.legacy_material_kv_id as string;
      if (!sourcesByMaterial.has(mid)) sourcesByMaterial.set(mid, []);
      if (ms.sources) {
        sourcesByMaterial.get(mid)!.push({
          title: ms.sources.title,
          authors: ms.sources.authors ?? undefined,
          year: ms.sources.year ?? undefined,
          doi: ms.sources.doi ?? undefined,
          url: ms.sources.url ?? undefined,
          weight: ms.weight ?? undefined,
          parameters: ms.parameters ?? undefined,
          pdfFileName: ms.sources.pdf_file_name ?? undefined,
        });
      }
    }

    // 5. Map each Postgres row to the frontend Material shape
    const materials = (pgMaterials ?? []).map((row: any) => {
      const kvId = row.legacy_kv_id as string;
      return pgMaterialToShape(
        row,
        categoryNameById,
        articlesByMaterial.get(kvId) ?? {
          compostability: [],
          recyclability: [],
          reusability: [],
        },
        sourcesByMaterial.get(kvId) ?? [],
      );
    });

    return c.json({ materials });
  } catch (error) {
    log.error("Error fetching materials:", error);
    return c.json(
      { error: "Failed to fetch materials", details: String(error) },
      500,
    );
  }
});

// ─── Step 14: Material → Postgres row mapper ─────────────────────────────────
function materialToPostgresRow(material: any) {
  const isUuid = (s: any) =>
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const toUuid = (s: any) => (isUuid(s) ? (s as string) : null);
  const toNum = (v: any) =>
    v !== undefined && v !== null && v !== "" ? Number(v) : null;
  return {
    legacy_kv_id: material.id,
    slug: material.id,
    name: material.name,
    aliases: material.aliases ?? null,
    category_id: material.categoryId ?? material.category ?? null,
    description: material.description ?? null,
    is_hub: material.isHub ?? false,
    linked_material_ids: material.linkedMaterialIds ?? null,
    compostability:
      material.compostability !== undefined && material.compostability !== null
        ? Math.round(Number(material.compostability))
        : null,
    recyclability:
      material.recyclability !== undefined && material.recyclability !== null
        ? Math.round(Number(material.recyclability))
        : null,
    reusability:
      material.reusability !== undefined && material.reusability !== null
        ? Math.round(Number(material.reusability))
        : null,
    y_value: toNum(material.Y_value),
    d_value: toNum(material.D_value),
    c_value: toNum(material.C_value),
    m_value: toNum(material.M_value),
    e_value: toNum(material.E_value),
    cr_practical_mean: toNum(material.CR_practical_mean),
    cr_theoretical_mean: toNum(material.CR_theoretical_mean),
    cr_practical_ci95: material.CR_practical_CI95 ?? null,
    cr_theoretical_ci95: material.CR_theoretical_CI95 ?? null,
    b_value: toNum(material.B_value),
    n_value: toNum(material.N_value),
    t_value: toNum(material.T_value),
    h_value: toNum(material.H_value),
    cc_practical_mean: toNum(material.CC_practical_mean),
    cc_theoretical_mean: toNum(material.CC_theoretical_mean),
    cc_practical_ci95: material.CC_practical_CI95 ?? null,
    cc_theoretical_ci95: material.CC_theoretical_CI95 ?? null,
    l_value: toNum(material.L_value),
    r_value: toNum(material.R_value),
    u_value: toNum(material.U_value),
    c_ru_value: toNum(material.C_RU_value),
    ru_practical_mean: toNum(material.RU_practical_mean),
    ru_theoretical_mean: toNum(material.RU_theoretical_mean),
    ru_practical_ci95: material.RU_practical_CI95 ?? null,
    ru_theoretical_ci95: material.RU_theoretical_CI95 ?? null,
    confidence_level: ["High", "Medium", "Low"].includes(
      material.confidence_level,
    )
      ? material.confidence_level
      : null,
    whitepaper_version: material.whitepaper_version ?? null,
    calculation_timestamp: material.calculation_timestamp ?? null,
    method_version: material.method_version ?? null,
    wiki: material.wiki ?? null,
    status: ["draft", "published", "archived"].includes(material.status)
      ? material.status
      : "published",
    created_by: toUuid(material.created_by),
    edited_by: toUuid(material.edited_by),
    writer_name: material.writer_name ?? null,
    editor_name: material.editor_name ?? null,
    created_at: material.created_at ?? null,
    updated_at: new Date().toISOString(),
  };
}

// ─── Step 14: Sync sources for a material ────────────────────────────────────
// Replaces all material_sources for kvId, deduplicating against existing sources.
async function upsertMaterialSources(
  supabase: any,
  kvId: string,
  sources: any[],
) {
  await supabase
    .from("material_sources")
    .delete()
    .eq("legacy_material_kv_id", kvId);

  if (!sources?.length) return;

  for (const source of sources) {
    if (!source.title) continue;
    let sourceId: string | null = null;

    // 1. Match by DOI
    if (source.doi) {
      const { data: byDoi } = await supabase
        .from("sources")
        .select("id")
        .eq("doi", source.doi)
        .maybeSingle();
      if (byDoi) sourceId = byDoi.id;
    }
    // 2. Fall back to title + year
    if (!sourceId) {
      let q = supabase.from("sources").select("id").eq("title", source.title);
      if (source.year) q = q.eq("year", source.year);
      const { data: byTitle } = await q.maybeSingle();
      if (byTitle) sourceId = byTitle.id;
    }
    // 3. Insert new source
    if (!sourceId) {
      const { data: inserted } = await supabase
        .from("sources")
        .insert({
          title: source.title,
          authors: source.authors ?? null,
          year: source.year ?? null,
          doi: source.doi ?? null,
          url: source.url ?? null,
          pdf_file_name: source.pdfFileName ?? null,
        })
        .select("id")
        .single();
      if (inserted) sourceId = inserted.id;
    }

    if (sourceId) {
      await supabase.from("material_sources").insert({
        legacy_material_kv_id: kvId,
        source_id: sourceId,
        weight: source.weight ?? null,
        parameters: source.parameters ?? null,
      });
    }
  }
}

// ─── Step 14: Create a new material ──────────────────────────────────────────
app.post(
  "/make-server-17cae920/materials",
  verifyAuth,
  requirePermission("materials.create"),
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const adminUserId = c.get("userId");
      const adminEmail = c.get("userEmail");
      const material = await c.req.json();
      if (!material.id) {
        return c.json({ error: "Material ID is required" }, 400);
      }

      // on_behalf_of: validate target user exists in user_profiles
      const onBehalfOf = material.on_behalf_of;
      let effectiveCreator = adminUserId;
      if (onBehalfOf) {
        const { data: targetProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("id", onBehalfOf)
          .maybeSingle();
        if (!targetProfile) {
          log.warn(
            `Admin ${adminEmail} attempted to post on behalf of non-existent user ${onBehalfOf}`,
          );
          return c.json(
            { error: "Target user for on_behalf_of does not exist" },
            400,
          );
        }
        effectiveCreator = onBehalfOf;
        log.log(
          `Admin ${adminEmail} creating material on behalf of user ${onBehalfOf}`,
        );
        delete material.on_behalf_of;
      }

      if (!material.created_by) material.created_by = effectiveCreator;
      if (!material.created_at) material.created_at = new Date().toISOString();
      material.updated_at = new Date().toISOString();

      // Preserve created_at / created_by from any existing Postgres row
      const { data: existingRow } = await supabase
        .from("materials")
        .select("created_at, created_by")
        .eq("legacy_kv_id", material.id)
        .maybeSingle();
      if (existingRow) {
        material.created_at = existingRow.created_at;
        if (!material.created_by) material.created_by = existingRow.created_by;
      }

      const row = materialToPostgresRow(material);
      // Ensure created_by falls back to effective creator
      if (!row.created_by) {
        const isUuid = (s: any) =>
          typeof s === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            s,
          );
        row.created_by = isUuid(effectiveCreator) ? effectiveCreator : null;
      }

      const { error: upsertError } = await supabase
        .from("materials")
        .upsert(row, { onConflict: "legacy_kv_id" });
      if (upsertError) throw upsertError;

      if (material.sources?.length) {
        await upsertMaterialSources(supabase, material.id, material.sources);
      }

      await createAuditLog({
        userId: adminUserId,
        userEmail: adminEmail,
        entityType: "material",
        entityId: material.id,
        action: "create",
        after: {
          ...material,
          _admin_action: onBehalfOf
            ? { on_behalf_of: onBehalfOf, admin_id: adminUserId }
            : undefined,
        },
        req: c,
      });

      return c.json({ material });
    } catch (error) {
      log.error("Error creating material:", error);
      return c.json(
        { error: "Failed to create material", details: String(error) },
        500,
      );
    }
  },
);

// ─── Step 14: Batch save materials ───────────────────────────────────────────
// Replaces all materials with the provided array (destructive bulk operation).
app.post(
  "/make-server-17cae920/materials/batch",
  verifyAuth,
  requirePermission("materials.batch"),
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { materials } = await c.req.json();
      if (!Array.isArray(materials)) {
        return c.json({ error: "Materials must be an array" }, 400);
      }

      // Fetch existing for audit log + created_at / created_by preservation
      const { data: existingRows } = await supabase
        .from("materials")
        .select("id, legacy_kv_id, name, created_at, created_by")
        .not("legacy_kv_id", "is", null);
      const existingByKvId = new Map<string, any>(
        (existingRows ?? []).map((r: any) => [r.legacy_kv_id, r]),
      );
      const existingCount = existingRows?.length ?? 0;

      const isBulkDelete = existingCount > 0 && materials.length === 0;
      const isPotentialDataLoss = existingCount > 1 && materials.length <= 1;
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "materials_bulk",
        entityId: "batch_save",
        action: isBulkDelete ? "delete" : "update",
        before: {
          count: existingCount,
          materials_preview: (existingRows ?? [])
            .slice(0, 5)
            .map((m: any) => ({ id: m.legacy_kv_id, name: m.name })),
        },
        after: {
          count: materials.length,
          is_bulk_delete: isBulkDelete,
          is_potential_data_loss: isPotentialDataLoss,
          materials_preview: materials
            .slice(0, 5)
            .map((m: any) => ({ id: m.id, name: m.name })),
        },
        req: c,
      });
      log.log(
        `AUDIT: Bulk material operation - ${existingCount} → ${materials.length} materials`,
      );

      // Remove all existing material_sources (will be re-added per material below)
      const existingKvIds = (existingRows ?? [])
        .map((r: any) => r.legacy_kv_id)
        .filter(Boolean);
      if (existingKvIds.length > 0) {
        await supabase
          .from("material_sources")
          .delete()
          .in("legacy_material_kv_id", existingKvIds);
      }

      // Delete materials that are not present in the new batch
      const newKvIds = new Set(materials.map((m: any) => m.id));
      const toDeleteKvIds = existingKvIds.filter(
        (id: string) => !newKvIds.has(id),
      );
      if (toDeleteKvIds.length > 0) {
        await supabase
          .from("materials")
          .delete()
          .in("legacy_kv_id", toDeleteKvIds);
        log.log(`Deleted ${toDeleteKvIds.length} removed materials`);
      }

      // Upsert each incoming material, preserving created_at / created_by
      for (const material of materials) {
        const existingRow = existingByKvId.get(material.id);
        if (existingRow) {
          if (!material.created_at)
            material.created_at = existingRow.created_at;
          if (!material.created_by)
            material.created_by = existingRow.created_by;
        }
        if (!material.created_at)
          material.created_at = new Date().toISOString();

        const row = materialToPostgresRow(material);
        const { error } = await supabase
          .from("materials")
          .upsert(row, { onConflict: "legacy_kv_id" });
        if (error) log.error(`Batch upsert error for ${material.id}:`, error);

        if (material.sources?.length) {
          await upsertMaterialSources(supabase, material.id, material.sources);
        }
      }

      log.log(`Batch saved ${materials.length} materials`);
      return c.json({
        success: true,
        count: materials.length,
        deleted: toDeleteKvIds.length,
      });
    } catch (error) {
      log.error("Error batch saving materials:", error);
      return c.json(
        { error: "Failed to batch save materials", details: String(error) },
        500,
      );
    }
  },
);

// ─── Step 14: Update a material ──────────────────────────────────────────────
app.put(
  "/make-server-17cae920/materials/:id",
  verifyAuth,
  requirePermission("materials.edit"),
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const id = c.req.param("id");
      const userId = c.get("userId");
      const material = await c.req.json();

      // Verify the material exists in Postgres
      const { data: existing } = await supabase
        .from("materials")
        .select("id, created_at, created_by")
        .eq("legacy_kv_id", id)
        .maybeSingle();
      if (!existing) {
        return c.json({ error: "Material not found" }, 404);
      }

      // Preserve provenance from existing row
      material.created_at = existing.created_at;
      if (!material.created_by) {
        material.created_by = existing.created_by ?? userId;
      }
      material.updated_at = new Date().toISOString();
      material.id = id;

      const row = materialToPostgresRow(material);
      const { error: updateError } = await supabase
        .from("materials")
        .update(row)
        .eq("legacy_kv_id", id);
      if (updateError) throw updateError;

      if (Array.isArray(material.sources)) {
        await upsertMaterialSources(supabase, id, material.sources);
      }

      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "material",
        entityId: id,
        action: "update",
        before: { legacy_kv_id: id, ...existing },
        after: material,
        req: c,
      });

      return c.json({ material });
    } catch (error) {
      log.error("Error updating material:", error);
      return c.json(
        { error: "Failed to update material", details: String(error) },
        500,
      );
    }
  },
);

// ─── Step 14: Delete a material ──────────────────────────────────────────────
app.delete(
  "/make-server-17cae920/materials/:id",
  verifyAuth,
  requirePermission("materials.delete"),
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const id = c.req.param("id");

      const { data: existing } = await supabase
        .from("materials")
        .select("*")
        .eq("legacy_kv_id", id)
        .maybeSingle();

      await supabase
        .from("material_sources")
        .delete()
        .eq("legacy_material_kv_id", id);
      await supabase.from("articles").delete().eq("legacy_material_kv_id", id);
      await supabase.from("materials").delete().eq("legacy_kv_id", id);

      if (existing) {
        await createAuditLog({
          userId: c.get("userId"),
          userEmail: c.get("userEmail"),
          entityType: "material",
          entityId: id,
          action: "delete",
          before: existing,
          req: c,
        });
      }

      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting material:", error);
      return c.json(
        { error: "Failed to delete material", details: String(error) },
        500,
      );
    }
  },
);

// ─── Step 14: Delete all materials ───────────────────────────────────────────
app.delete(
  "/make-server-17cae920/materials",
  verifyAuth,
  requirePermission("materials.delete"),
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data: previewRows, count } = await supabase
        .from("materials")
        .select("legacy_kv_id, name", { count: "exact" })
        .not("legacy_kv_id", "is", null)
        .limit(10);
      await supabase.from("material_sources").delete().not("id", "is", null);
      await supabase
        .from("articles")
        .delete()
        .not("legacy_material_kv_id", "is", null);
      await supabase.from("materials").delete().not("legacy_kv_id", "is", null);
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "materials_bulk",
        entityId: "delete_all",
        action: "delete",
        before: {
          count: count ?? 0,
          materials_preview: (previewRows ?? []).map((m: any) => ({
            id: m.legacy_kv_id,
            name: m.name,
          })),
        },
        req: c,
      });
      return c.json({ success: true, deleted: count ?? 0 });
    } catch (error) {
      log.error("Error deleting all materials:", error);
      return c.json(
        { error: "Failed to delete all materials", details: String(error) },
        500,
      );
    }
  },
);

// Get current user's role (protected)
app.get("/make-server-17cae920/users/me/role", verifyAuth, async (c) => {
  log.log("🔍 GET /users/me/role - Endpoint reached after verifyAuth");
  log.log("✅ GET /users/me/role endpoint reached after verifyAuth");
  try {
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");
    log.log(`Getting role for user: ${userId} (${userEmail})`);

    const userRole = await getUserRole(userId);
    log.log(`Retrieved role from Postgres: ${userRole}`);
    return c.json({ role: userRole });
  } catch (error) {
    log.error("Error getting user role:", error);
    return c.json(
      { error: "Failed to get user role", details: String(error) },
      500,
    );
  }
});

// Get all users (admin only)
app.get("/make-server-17cae920/users", verifyAuth, verifyAdmin, async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get all users from Supabase Auth
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      log.error("Error listing users:", error);
      return c.json({ error: "Failed to list users" }, 500);
    }

    // Get roles for all users
    const usersWithRoles = await Promise.all(
      data.users.map(async (user) => {
        const { data: _profileRow } = await supabase
          .from("user_profiles")
          .select("name, last_signin_at, role")
          .eq("id", user.id)
          .maybeSingle();

        const role = _profileRow?.role || getInitialRole(user.email || "");

        // Prefer Postgres-tracked last sign-in; fall back to Supabase Auth field
        const lastSignInAt =
          _profileRow?.last_signin_at || user.last_sign_in_at;

        const displayName =
          _profileRow?.name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0];

        return {
          id: user.id,
          email: user.email,
          name: displayName,
          role: role,
          created_at: user.created_at,
          last_sign_in_at: lastSignInAt,
        };
      }),
    );

    return c.json({ users: usersWithRoles });
  } catch (error) {
    log.error("Error listing users:", error);
    return c.json(
      { error: "Failed to list users", details: String(error) },
      500,
    );
  }
});

// Update user role (admin only)
app.put(
  "/make-server-17cae920/users/:id/role",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const userId = c.req.param("id");
      const { role } = await c.req.json();

      if (!role || !["user", "staff", "admin"].includes(role)) {
        return c.json(
          { error: "Invalid role. Must be 'user', 'staff', or 'admin'" },
          400,
        );
      }

      // Get old role for audit log, then update
      const oldRole = await getUserRole(userId);
      await setUserRole(userId, role);

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "user",
        entityId: userId,
        action: "update",
        before: { role: oldRole },
        after: { role },
        req: c,
      });

      return c.json({ success: true, userId, role });
    } catch (error) {
      log.error("Error updating user role:", error);
      return c.json(
        { error: "Failed to update user role", details: String(error) },
        500,
      );
    }
  },
);

// Delete user (admin only)
app.delete(
  "/make-server-17cae920/users/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const userId = c.req.param("id");
      const currentUserId = c.get("userId");

      // Prevent self-deletion
      if (userId === currentUserId) {
        return c.json({ error: "Cannot delete your own account" }, 400);
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Get user info for audit log
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userRole = await getUserRole(userId);

      // Delete user from Supabase Auth (cascade deletes user_profiles row)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        log.error("Error deleting user:", error);
        return c.json({ error: error.message || "Failed to delete user" }, 500);
      }

      // Audit log
      if (userData?.user) {
        await createAuditLog({
          userId: c.get("userId"),
          userEmail: c.get("userEmail"),
          entityType: "user",
          entityId: userId,
          action: "delete",
          before: { email: userData.user.email, role: userRole },
          req: c,
        });
      }

      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting user:", error);
      return c.json(
        { error: "Failed to delete user", details: String(error) },
        500,
      );
    }
  },
);

// Update user details (admin only)
app.put(
  "/make-server-17cae920/users/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const userId = c.req.param("id");
      const { name, email, password } = await c.req.json();

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        updateData,
      );

      if (error) {
        log.error("Error updating user:", error);
        return c.json({ error: error.message || "Failed to update user" }, 500);
      }

      // Keep Postgres user_profiles aligned with admin edits.
      if (name !== undefined || email !== undefined) {
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        const nextEmail =
          email || data.user.email || existingProfile?.email || "";
        const nextName =
          name ||
          existingProfile?.name ||
          data.user.user_metadata?.name ||
          (nextEmail ? nextEmail.split("@")[0] : "User");

        await supabase.from("user_profiles").upsert(
          {
            id: userId,
            email: nextEmail,
            name: nextName,
            bio: existingProfile?.bio || "",
            social_link: existingProfile?.social_link || "",
            avatar_url: existingProfile?.avatar_url || "",
            display_email: existingProfile?.display_email || "",
            show_on_leaderboard: existingProfile?.show_on_leaderboard ?? true,
            org_role: existingProfile?.org_role || "Volunteer",
          },
          { onConflict: "id" },
        );
      }

      return c.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
        },
      });
    } catch (error) {
      log.error("Error updating user:", error);
      return c.json(
        { error: "Failed to update user", details: String(error) },
        500,
      );
    }
  },
);

// ==================== CATEGORY COLOR SETTINGS ROUTES ====================

// Colors are keyed by category ID (slug), e.g. "paper-cardboard": "#d4c9a8".
// CSS custom properties are --cat-{slug}, applied by the frontend.
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  plastics: "#b8c8cb",
  metals: "#e4e3ac",
  glass: "#bae1c3",
  "paper-cardboard": "#d4c9a8",
  "fabrics-textiles": "#b8c8cb",
  "electronics-batteries": "#b8c8cb",
  "building-materials": "#bae1c3",
  "organic-natural-waste": "#e6beb5",
  elements: "#e4e3ac",
};

function slugifyForCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Get material category colors (public)
app.get("/make-server-17cae920/settings/category-colors", async (c) => {
  try {
    const stored = (await kv.get(
      "site_settings:material_category_colors",
    )) as Record<string, string> | null;

    // One-time migration: if stored colors use display-name keys (e.g. "Paper & Cardboard")
    // rather than slug keys (e.g. "paper-cardboard"), migrate them transparently.
    let resolved = stored;
    if (stored && Object.keys(stored).some((k) => /[ &/]/.test(k))) {
      const migrated: Record<string, string> = {};
      for (const [key, value] of Object.entries(stored)) {
        migrated[slugifyForCategory(key)] = value;
      }
      resolved = migrated;
      await kv.set("site_settings:material_category_colors", migrated);
    }

    const colors = { ...DEFAULT_CATEGORY_COLORS, ...(resolved || {}) };
    return c.json({ colors });
  } catch (error) {
    log.error("Error getting category colors:", error);
    return c.json({ colors: DEFAULT_CATEGORY_COLORS });
  }
});

const SLUG_RE = /^[a-z0-9-]+$/;

// Update material category colors (admin only)
app.patch(
  "/make-server-17cae920/settings/category-colors",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const body = await c.req.json();
      const { colors } = body;

      if (!colors || typeof colors !== "object") {
        return c.json({ error: "colors object required" }, 400);
      }

      const HEX_RE = /^#[0-9a-fA-F]{6}$/;

      for (const key of Object.keys(colors)) {
        // Accept slug-format keys (e.g. "paper-cardboard") or display names
        // (which will be slugified). Reject anything structurally invalid.
        const slug = slugifyForCategory(key);
        if (!SLUG_RE.test(slug) || slug.length === 0) {
          return c.json({ error: `Invalid category key: ${key}` }, 400);
        }
        if (!HEX_RE.test(colors[key])) {
          return c.json(
            { error: `Invalid hex color for ${key}: ${colors[key]}` },
            400,
          );
        }
      }

      const current =
        ((await kv.get("site_settings:material_category_colors")) as Record<
          string,
          string
        > | null) || DEFAULT_CATEGORY_COLORS;
      const updated = { ...DEFAULT_CATEGORY_COLORS, ...current, ...colors };

      await kv.set("site_settings:material_category_colors", updated);

      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "site_settings",
        entityId: "material_category_colors",
        action: "update",
        before: { colors: current },
        after: { colors: updated },
        req: c,
      });

      return c.json({ success: true, colors: updated });
    } catch (error) {
      log.error("Error updating category colors:", error);
      return c.json(
        { error: "Failed to update category colors", details: String(error) },
        500,
      );
    }
  },
);

// ==================== MATERIAL CATEGORIES CRUD ====================

interface MaterialCategoryDef {
  id: string; // immutable slug, e.g. "paper-cardboard"
  name: string; // current display name, e.g. "Paper & Cardboard"
  aliases?: string[]; // previous display names for legacy material matching
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_CATEGORIES: MaterialCategoryDef[] = [
  { id: "plastics", name: "Plastics" },
  { id: "metals", name: "Metals" },
  { id: "glass", name: "Glass" },
  { id: "paper-cardboard", name: "Paper & Cardboard" },
  { id: "fabrics-textiles", name: "Fabrics & Textiles" },
  { id: "electronics-batteries", name: "Electronics & Batteries" },
  { id: "building-materials", name: "Building Materials" },
  { id: "organic-natural-waste", name: "Organic/Natural Waste" },
  { id: "elements", name: "Elements" },
];

async function getCategoriesFromKV(): Promise<MaterialCategoryDef[]> {
  const stored = (await kv.get("site_settings:material_categories")) as
    | MaterialCategoryDef[]
    | null;
  return stored ?? DEFAULT_CATEGORIES;
}

async function broadcastCategoriesUpdate(): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: "realtime:site-categories",
            event: "categories:updated",
            payload: { updatedAt: new Date().toISOString() },
          },
        ],
      }),
    });
  } catch (err) {
    log.warn("Failed to broadcast categories update:", err);
  }
}

// GET /settings/categories — public, active categories only
app.get("/make-server-17cae920/settings/categories", async (c) => {
  try {
    const all = await getCategoriesFromKV();
    return c.json({ categories: all.filter((cat) => !cat.deleted) });
  } catch (error) {
    log.error("Error getting categories:", error);
    return c.json({ categories: DEFAULT_CATEGORIES });
  }
});

// GET /settings/categories/all — admin, includes soft-deleted
app.get(
  "/make-server-17cae920/settings/categories/all",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const all = await getCategoriesFromKV();
      return c.json({ categories: all });
    } catch (error) {
      log.error("Error getting all categories:", error);
      return c.json({ categories: DEFAULT_CATEGORIES });
    }
  },
);

// POST /settings/categories — create a new category (admin)
app.post(
  "/make-server-17cae920/settings/categories",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { name } = await c.req.json();
      if (!name || typeof name !== "string" || !name.trim()) {
        return c.json({ error: "name is required" }, 400);
      }
      const trimmedName = name.trim();
      const id = slugifyForCategory(trimmedName);
      if (!id) return c.json({ error: "Invalid category name" }, 400);

      const all = await getCategoriesFromKV();
      if (all.some((cat) => cat.id === id)) {
        return c.json(
          { error: `Category with id "${id}" already exists` },
          409,
        );
      }

      const newCat: MaterialCategoryDef = {
        id,
        name: trimmedName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...all, newCat];
      await kv.set("site_settings:material_categories", updated);

      // Seed a default neutral color for the new category
      const colors = ((await kv.get(
        "site_settings:material_category_colors",
      )) as Record<string, string> | null) ?? { ...DEFAULT_CATEGORY_COLORS };
      if (!colors[id]) {
        colors[id] = "#d1d5db";
        await kv.set("site_settings:material_category_colors", colors);
      }

      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "site_settings",
        entityId: "material_categories",
        action: "create",
        before: null,
        after: { category: newCat },
        req: c,
      });

      await broadcastCategoriesUpdate();
      return c.json({ category: newCat, categories: updated }, 201);
    } catch (error) {
      log.error("Error creating category:", error);
      return c.json({ error: "Failed to create category" }, 500);
    }
  },
);

// PATCH /settings/categories/:id — rename a category (admin)
// The id (slug) is immutable; only the display name changes.
app.patch(
  "/make-server-17cae920/settings/categories/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const { name } = await c.req.json();
      const newName = name?.trim();
      if (!newName) return c.json({ error: "name is required" }, 400);

      const all = await getCategoriesFromKV();
      const idx = all.findIndex((cat) => cat.id === id);
      if (idx === -1) return c.json({ error: "Category not found" }, 404);

      const before = all[idx];
      const updated = [...all];
      // Keep previous name in aliases for legacy material matching
      const aliases = Array.from(
        new Set([...(before.aliases ?? []), before.name]),
      ).filter((a) => a !== newName);
      updated[idx] = {
        ...before,
        name: newName,
        aliases,
        updatedAt: new Date().toISOString(),
      };
      await kv.set("site_settings:material_categories", updated);

      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "site_settings",
        entityId: "material_categories",
        action: "update",
        before: { category: before },
        after: { category: updated[idx] },
        req: c,
      });

      await broadcastCategoriesUpdate();
      return c.json({ category: updated[idx], categories: updated });
    } catch (error) {
      log.error("Error updating category:", error);
      return c.json({ error: "Failed to update category" }, 500);
    }
  },
);

// DELETE /settings/categories/:id — soft-delete a category (admin)
app.delete(
  "/make-server-17cae920/settings/categories/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const all = await getCategoriesFromKV();
      const idx = all.findIndex((cat) => cat.id === id);
      if (idx === -1) return c.json({ error: "Category not found" }, 404);

      // Count materials currently using this category
      const allMaterials =
        ((await kv.getByPrefix("material:")) as any[] | null) ?? [];
      const cat = all[idx];
      const affectedCount = allMaterials.filter((m: any) => {
        if (m.categoryId) return m.categoryId === id;
        // Legacy fallback: match by display name or aliases
        return (
          m.category === cat.name || (cat.aliases ?? []).includes(m.category)
        );
      }).length;

      const updated = [...all];
      updated[idx] = {
        ...updated[idx],
        deleted: true,
        updatedAt: new Date().toISOString(),
      };
      await kv.set("site_settings:material_categories", updated);

      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "site_settings",
        entityId: "material_categories",
        action: "delete",
        before: { category: all[idx] },
        after: { category: updated[idx] },
        req: c,
      });

      await broadcastCategoriesUpdate();
      return c.json({ categories: updated, affectedMaterials: affectedCount });
    } catch (error) {
      log.error("Error deleting category:", error);
      return c.json({ error: "Failed to delete category" }, 500);
    }
  },
);

// POST /settings/categories/:id/restore — restore a soft-deleted category (admin)
app.post(
  "/make-server-17cae920/settings/categories/:id/restore",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const all = await getCategoriesFromKV();
      const idx = all.findIndex((cat) => cat.id === id);
      if (idx === -1) return c.json({ error: "Category not found" }, 404);

      const updated = [...all];
      updated[idx] = {
        ...updated[idx],
        deleted: false,
        updatedAt: new Date().toISOString(),
      };
      await kv.set("site_settings:material_categories", updated);

      await broadcastCategoriesUpdate();
      return c.json({ category: updated[idx], categories: updated });
    } catch (error) {
      log.error("Error restoring category:", error);
      return c.json({ error: "Failed to restore category" }, 500);
    }
  },
);

// POST /settings/categories/migrate-materials — one-time admin operation to
// populate categoryId on all existing material records.
app.post(
  "/make-server-17cae920/settings/categories/migrate-materials",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const allCats = await getCategoriesFromKV();
      const allMaterials =
        ((await kv.getByPrefix("material:")) as any[] | null) ?? [];

      let updated = 0;
      let skipped = 0;

      for (const material of allMaterials) {
        if (material.categoryId) {
          skipped++;
          continue;
        }
        // Resolve category name → ID
        const cat = allCats.find(
          (c) =>
            c.name === material.category ||
            (c.aliases ?? []).includes(material.category),
        );
        if (cat) {
          await kv.set(`material:${material.id}`, {
            ...material,
            categoryId: cat.id,
          });
          updated++;
        } else {
          skipped++;
        }
      }

      return c.json({ updated, skipped, total: allMaterials.length });
    } catch (error) {
      log.error("Error migrating materials:", error);
      return c.json({ error: "Migration failed" }, 500);
    }
  },
);

// ==================== ROLE PERMISSIONS ROUTES ====================

// Get permissions for all roles (admin only)
app.get(
  "/make-server-17cae920/roles/permissions",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const roles = ["user", "staff"];
      const result: Record<string, string[]> = {};

      for (const role of roles) {
        const stored = await kv.get(`role_permissions:${role}`);
        result[role] = stored || DEFAULT_ROLE_PERMISSIONS[role] || [];
      }

      // Admin always has all permissions
      result.admin = [...ALL_PERMISSIONS];

      return c.json({ permissions: result, allPermissions: ALL_PERMISSIONS });
    } catch (error) {
      log.error("Error getting role permissions:", error);
      return c.json(
        { error: "Failed to get role permissions", details: String(error) },
        500,
      );
    }
  },
);

// Update permissions for a role (admin only)
app.put(
  "/make-server-17cae920/roles/:role/permissions",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const role = c.req.param("role");

      if (role === "admin") {
        return c.json({ error: "Cannot modify admin permissions" }, 400);
      }

      if (!["user", "staff"].includes(role)) {
        return c.json({ error: "Invalid role" }, 400);
      }

      const { permissions } = await c.req.json();

      if (!Array.isArray(permissions)) {
        return c.json({ error: "permissions must be an array" }, 400);
      }

      // Validate all permissions are known
      const invalid = permissions.filter(
        (p: string) => !ALL_PERMISSIONS.includes(p),
      );
      if (invalid.length > 0) {
        return c.json(
          { error: `Unknown permissions: ${invalid.join(", ")}` },
          400,
        );
      }

      await kv.set(`role_permissions:${role}`, permissions);

      // Audit log
      const oldPerms = await kv.get(`role_permissions:${role}`);
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "role_permissions",
        entityId: role,
        action: "update",
        before: {
          permissions: oldPerms || DEFAULT_ROLE_PERMISSIONS[role] || [],
        },
        after: { permissions },
        req: c,
      });

      return c.json({ success: true, role, permissions });
    } catch (error) {
      log.error("Error updating role permissions:", error);
      return c.json(
        { error: "Failed to update role permissions", details: String(error) },
        500,
      );
    }
  },
);

// ==================== ASSET STORAGE ROUTES ====================

const ASSET_BUCKET_NAME = "make-17cae920-assets";
const ASSET_UPLOAD_DESTINATIONS: Record<string, string> = {
  root: "",
  "material-doodles": "material-doodles",
};

function getAssetStoragePath(fileName: string, destination: string): string {
  const prefix = ASSET_UPLOAD_DESTINATIONS[destination];
  if (prefix === undefined) {
    throw new Error("Invalid upload destination");
  }

  return prefix ? `${prefix}/${fileName}` : fileName;
}

// Upload asset to Supabase Storage
app.post(
  "/make-server-17cae920/assets/upload",
  verifyAuth,
  requirePermission("assets.upload"),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      // Validate file type
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return c.json(
          { error: "Invalid file type. Only images are allowed." },
          400,
        );
      }

      // Validate file size (5MB max)
      if (file.size > 5242880) {
        return c.json({ error: "File too large. Maximum size is 5MB." }, 400);
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const destination = String(formData.get("destination") || "root");
      if (ASSET_UPLOAD_DESTINATIONS[destination] === undefined) {
        return c.json({ error: "Invalid upload destination" }, 400);
      }

      // Generate filename with timestamp to avoid collisions
      const fileExt = file.name.split(".").pop();
      const fileName = `${file.name.split(".")[0]}-${Date.now()}.${fileExt}`;
      const storagePath = getAssetStoragePath(fileName, destination);

      // Convert File to ArrayBuffer then to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(ASSET_BUCKET_NAME)
        .upload(storagePath, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        log.error("Error uploading to storage:", error);
        return c.json(
          { error: "Failed to upload file", details: error.message },
          500,
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(ASSET_BUCKET_NAME).getPublicUrl(storagePath);

      log.log(`✅ Asset uploaded: ${storagePath} -> ${publicUrl}`);

      return c.json({
        success: true,
        fileName: storagePath,
        publicUrl,
        size: file.size,
        type: file.type,
      });
    } catch (error) {
      log.error("Error in asset upload:", error);
      return c.json(
        { error: "Failed to upload asset", details: String(error) },
        500,
      );
    }
  },
);

// List all assets (admin only)
app.get(
  "/make-server-17cae920/assets",
  verifyAuth,
  requirePermission("assets.upload"),
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data, error } = await supabase.storage.from(ASSET_BUCKET_NAME).list();

      if (error) {
        log.error("Error listing assets:", error);
        return c.json(
          { error: "Failed to list assets", details: error.message },
          500,
        );
      }

      const { data: doodleFiles, error: doodleError } = await supabase.storage
        .from(ASSET_BUCKET_NAME)
        .list("material-doodles");

      if (doodleError) {
        log.error("Error listing material doodles:", doodleError);
        return c.json(
          { error: "Failed to list assets", details: doodleError.message },
          500,
        );
      }

      // Get public URLs for all files
      const rootAssets = data
        .filter((file) => file.name !== "material-doodles")
        .map((file) => ({
          file,
          storagePath: file.name,
        }));
      const doodleAssets = (doodleFiles || []).map((file) => ({
        file,
        storagePath: `material-doodles/${file.name}`,
      }));

      const assets = [...rootAssets, ...doodleAssets].map(({ file, storagePath }) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from(ASSET_BUCKET_NAME).getPublicUrl(storagePath);

        return {
          name: storagePath,
          publicUrl,
          size: file.metadata?.size,
          createdAt: file.created_at,
          updatedAt: file.updated_at,
        };
      });

      return c.json({ assets });
    } catch (error) {
      log.error("Error in asset listing:", error);
      return c.json(
        { error: "Failed to list assets", details: String(error) },
        500,
      );
    }
  },
);

// Delete an asset
app.delete(
  "/make-server-17cae920/assets/:fileName",
  verifyAuth,
  requirePermission("assets.delete"),
  async (c) => {
    try {
      const fileName = c.req.query("path") || c.req.param("fileName");

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { error } = await supabase.storage
        .from(ASSET_BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        log.error("Error deleting asset:", error);
        return c.json(
          { error: "Failed to delete asset", details: error.message },
          500,
        );
      }

      log.log(`Asset deleted: ${fileName}`);

      return c.json({ success: true });
    } catch (error) {
      log.error("Error in asset deletion:", error);
      return c.json(
        { error: "Failed to delete asset", details: String(error) },
        500,
      );
    }
  },
);

// ==================== SOURCE PDF ROUTES ====================

// Upload source PDF
app.post(
  "/make-server-17cae920/source-pdfs/upload",
  verifyAuth,
  requirePermission("sources.upload"),
  async (c) => {
    try {
      log.log("Received PDF upload request");

      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const sourceId = formData.get("sourceId") as string;

      log.log("Form data parsed:", {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        sourceId,
      });

      if (!file) {
        log.log("No file provided");
        return c.json({ error: "No file provided" }, 400);
      }

      if (!sourceId) {
        log.log("No source ID provided");
        return c.json({ error: "Source ID is required" }, 400);
      }

      // Validate file type
      if (file.type !== "application/pdf") {
        log.log(`Invalid file type: ${file.type}`);
        return c.json(
          { error: "Invalid file type. Only PDF files are allowed." },
          400,
        );
      }

      // Validate file size (20MB max)
      if (file.size > 20971520) {
        log.log(`File too large: ${file.size} bytes`);
        return c.json({ error: "File too large. Maximum size is 20MB." }, 400);
      }

      log.log("Validation passed, creating Supabase client");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const bucketName = "make-17cae920-source-pdfs";

      // Generate filename: sourceId-timestamp.pdf
      const fileName = `${sourceId}-${Date.now()}.pdf`;
      log.log(`Generated filename: ${fileName}`);

      // Convert File to ArrayBuffer then to Uint8Array
      log.log("Converting file to Uint8Array...");
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      log.log(`Converted ${uint8Array.length} bytes`);

      // Upload to Supabase Storage
      log.log(`Uploading to bucket: ${bucketName}`);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        log.error("Error uploading PDF to storage:", error);
        return c.json(
          { error: "Failed to upload PDF", details: error.message },
          500,
        );
      }

      log.log(`Source PDF uploaded successfully: ${fileName}`);
      log.log(" Upload data:", data);

      return c.json({
        success: true,
        fileName,
        sourceId,
        size: file.size,
      });
    } catch (error) {
      log.error("💥 Exception in source PDF upload:", error);
      return c.json(
        { error: "Failed to upload source PDF", details: String(error) },
        500,
      );
    }
  },
);

// Import PDF from URL - downloads from external URL and stores in Supabase
app.post(
  "/make-server-17cae920/source-pdfs/import-from-url",
  verifyAuth,
  requirePermission("sources.upload"),
  async (c) => {
    try {
      log.log("Received PDF import-from-url request");

      const { url, sourceId } = await c.req.json();

      log.log("Request params:", { url, sourceId });

      if (!url) {
        return c.json({ error: "URL is required" }, 400);
      }

      if (!sourceId) {
        return c.json({ error: "Source ID is required" }, 400);
      }

      // Validate URL format
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
        if (!parsedUrl.protocol.startsWith("http")) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return c.json(
          { error: "Invalid URL format. Must be http or https." },
          400,
        );
      }

      // Check for known problematic domains that require browser authentication
      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedDomains = [
        "science.org",
        "sciencemag.org",
        "nature.com",
        "springer.com",
        "springerlink.com",
        "wiley.com",
        "onlinelibrary.wiley.com",
        "elsevier.com",
        "sciencedirect.com",
        "tandfonline.com",
        "jstor.org",
        "ieee.org",
        "ieeexplore.ieee.org",
        "acm.org",
        "dl.acm.org",
      ];

      const isBlockedDomain = blockedDomains.some(
        (domain) => hostname === domain || hostname.endsWith("." + domain),
      );

      if (isBlockedDomain) {
        log.log(`Blocked domain detected: ${hostname}`);
        return c.json(
          {
            error: "This publisher blocks automated downloads",
            details: `${hostname} requires browser authentication. Please download the PDF manually in your browser and use the file upload button instead.`,
            suggestion: "manual_download",
          },
          403,
        );
      }

      log.log("Fetching PDF from URL...");

      // Set timeout for fetch (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: Response;
      try {
        // Use browser-like headers to avoid bot detection
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/pdf,application/octet-stream,*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
          },
          redirect: "follow",
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          return c.json(
            {
              error:
                "Request timed out. The PDF server took too long to respond.",
            },
            408,
          );
        }
        log.error("Fetch error:", fetchError);
        return c.json(
          {
            error: "Failed to fetch PDF from URL",
            details: fetchError.message,
          },
          502,
        );
      }

      log.log("Fetch response:", {
        status: response.status,
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });

      if (!response.ok) {
        const suggestion =
          response.status === 403 || response.status === 401
            ? "This PDF requires authentication. Please download it manually in your browser and use the file upload button."
            : response.status === 404
              ? "PDF not found. Check that the URL points directly to a PDF file."
              : "The server returned an error. Try downloading manually.";

        return c.json(
          {
            error: `Failed to download PDF: ${response.status} ${response.statusText}`,
            details: suggestion,
            suggestion:
              response.status === 403 || response.status === 401
                ? "manual_download"
                : undefined,
          },
          502,
        );
      }

      // Validate content type
      const contentType = response.headers.get("content-type") || "";
      if (
        !contentType.includes("application/pdf") &&
        !contentType.includes("octet-stream")
      ) {
        // Check if it's HTML (likely a login page or redirect)
        if (contentType.includes("text/html")) {
          return c.json(
            {
              error: "The URL returned an HTML page instead of a PDF.",
              details:
                "This usually means the PDF requires authentication or the URL is incorrect.",
            },
            400,
          );
        }
        console.warn(
          `Unexpected content-type: ${contentType}, proceeding anyway...`,
        );
      }

      // Check file size from headers (optional, some servers don't provide it)
      const contentLength = parseInt(
        response.headers.get("content-length") || "0",
        10,
      );
      if (contentLength > 20971520) {
        return c.json(
          { error: "PDF is too large. Maximum size is 20MB." },
          400,
        );
      }

      // Download the file
      log.log("Downloading PDF content...");
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      log.log(`Downloaded ${uint8Array.length} bytes`);

      // Validate actual file size
      if (uint8Array.length > 20971520) {
        return c.json(
          { error: "PDF is too large. Maximum size is 20MB." },
          400,
        );
      }

      // Basic PDF validation: check for PDF magic bytes
      const pdfMagic = new TextDecoder().decode(uint8Array.slice(0, 5));
      if (!pdfMagic.startsWith("%PDF-")) {
        return c.json(
          {
            error: "The downloaded file is not a valid PDF.",
            details: "The file does not have the expected PDF header.",
          },
          400,
        );
      }

      log.log("PDF validation passed, uploading to Supabase Storage...");

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const bucketName = "make-17cae920-source-pdfs";
      const fileName = `${sourceId}-${Date.now()}.pdf`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, uint8Array, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        log.error("Error uploading PDF to storage:", error);
        return c.json(
          { error: "Failed to save PDF to storage", details: error.message },
          500,
        );
      }

      log.log(`PDF imported successfully from URL: ${fileName}`);

      return c.json({
        success: true,
        fileName,
        sourceId,
        size: uint8Array.length,
        originalUrl: url,
      });
    } catch (error) {
      log.error("💥 Exception in PDF import from URL:", error);
      return c.json(
        { error: "Failed to import PDF from URL", details: String(error) },
        500,
      );
    }
  },
);

// Direct PDF view endpoint - redirects to public URL (for <a> tag links)
// IMPORTANT: This must come BEFORE the generic /:fileName route to avoid the auth middleware
app.get("/make-server-17cae920/source-pdfs/:fileName/view", async (c) => {
  try {
    const fileName = c.req.param("fileName");
    log.log(`\n========== PDF VIEW REQUEST ==========`);
    log.log(`🔗: ${fileName}`);
    log.log(`🕐: ${new Date().toISOString()}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const bucketName = "make-17cae920-source-pdfs";

    // Ensure bucket is public (check and update if needed)
    log.log(`🔍 Checking bucket privacy settings...`);
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      log.error("Failed to list buckets:", listError);
      return c.text("Failed to access storage", 500);
    }

    log.log(`Found ${buckets?.length || 0} buckets total`);
    const bucket = buckets?.find((b) => b.name === bucketName);

    if (bucket) {
      log.log(`Bucket info:`, {
        name: bucket.name,
        public: bucket.public,
        id: bucket.id,
        created_at: bucket.created_at,
      });

      if (!bucket.public) {
        log.log(`⚠️ Bucket is PRIVATE - updating to PUBLIC...`);
        const { data: updateData, error: updateError } =
          await supabase.storage.updateBucket(bucketName, {
            public: true,
            fileSizeLimit: 20971520,
            allowedMimeTypes: ["application/pdf"],
          });

        if (updateError) {
          log.error("❌ Failed to update bucket to public:", updateError);
          log.error("   Error details:", JSON.stringify(updateError, null, 2));
        } else {
          log.log(`Successfully updated bucket to PUBLIC`);
          log.log(`   Update response:`, updateData);
        }
      } else {
        log.log(`Bucket is already PUBLIC ✓`);
      }
    } else {
      log.error("Bucket not found");
      log.log("   Available buckets:", buckets?.map((b) => b.name).join(", "));
      return c.text("Storage bucket not found", 500);
    }

    // Check if file exists
    log.log(`Checking if file exists: ${fileName}`);
    const { data: fileList, error: listFilesError } = await supabase.storage
      .from(bucketName)
      .list("", { search: fileName });

    if (listFilesError) {
      log.error("Failed to check file existence:", listFilesError);
    } else {
      const fileExists = fileList?.some((f) => f.name === fileName);
      log.log(`File exists: ${fileExists ? "✓ YES" : "✗ NO"}`);
      if (!fileExists) {
        log.log(
          `   Files in bucket:`,
          fileList
            ?.map((f) => f.name)
            .slice(0, 5)
            .join(", "),
        );
      }
    }

    // Get public URL for the PDF
    log.log(`🔗 Generating public URL...`);
    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    if (!data.publicUrl) {
      log.error("Failed to get public URL - data.publicUrl is empty");
      return c.text("Failed to load PDF", 500);
    }

    log.log(`Generated public URL: ${data.publicUrl}`);
    log.log(` Issuing 302 redirect to public URL...`);
    log.log(`======================================\n`);

    // Return 302 redirect to the public URL
    return c.redirect(data.publicUrl, 302);
  } catch (error) {
    log.error("💥 EXCEPTION in PDF redirect:");
    log.error("   Error:", error);
    log.error("   Stack:", error instanceof Error ? error.stack : "N/A");
    log.log(`======================================\n`);
    return c.text("Failed to load PDF", 500);
  }
});

// Diagnostic endpoint to check bucket and file status
app.get("/make-server-17cae920/source-pdfs/:fileName/debug", async (c) => {
  try {
    const fileName = c.req.param("fileName");
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      fileName,
      checks: {},
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const bucketName = "make-17cae920-source-pdfs";

    // Check buckets
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    diagnostics.checks.listBuckets = {
      success: !listError,
      error: listError,
      totalBuckets: buckets?.length || 0,
    };

    const bucket = buckets?.find((b) => b.name === bucketName);
    diagnostics.checks.bucketFound = {
      found: !!bucket,
      details: bucket
        ? {
            name: bucket.name,
            id: bucket.id,
            public: bucket.public,
            created_at: bucket.created_at,
            file_size_limit: bucket.file_size_limit,
            allowed_mime_types: bucket.allowed_mime_types,
          }
        : null,
    };

    // Check if file exists
    if (bucket) {
      const { data: fileList, error: listFilesError } = await supabase.storage
        .from(bucketName)
        .list("", { search: fileName });

      const fileExists = fileList?.some((f) => f.name === fileName);
      diagnostics.checks.fileExists = {
        exists: fileExists,
        error: listFilesError,
        searchResults: fileList?.map((f) => ({
          name: f.name,
          size: f.metadata?.size,
          created_at: f.created_at,
        })),
      };

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      diagnostics.checks.publicUrl = {
        url: urlData.publicUrl,
      };

      // Try to fetch the URL to see what status we get
      if (urlData.publicUrl) {
        try {
          const response = await fetch(urlData.publicUrl, { method: "HEAD" });
          diagnostics.checks.urlAccessibility = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          };
        } catch (fetchError) {
          diagnostics.checks.urlAccessibility = {
            error: String(fetchError),
          };
        }
      }
    }

    return c.json(diagnostics, 200);
  } catch (error) {
    return c.json(
      {
        error: "Diagnostic failed",
        details: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500,
    );
  }
});

// Get signed URL for a source PDF (authenticated users) - API endpoint
// IMPORTANT: This comes AFTER the more specific routes (/view, /debug)
app.get(
  "/make-server-17cae920/source-pdfs/:fileName",
  verifyAuth,
  async (c) => {
    try {
      const fileName = c.req.param("fileName");
      log.log(`📥 Request for PDF URL: ${fileName}`);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const bucketName = "make-17cae920-source-pdfs";
      log.log(`🪣 Using bucket: ${bucketName}`);

      // Generate signed URL valid for 1 hour
      log.log(`🔐 Creating signed URL for ${fileName}...`);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 3600);

      if (error) {
        // Don't log as error if file simply doesn't exist (expected for test cases)
        if (
          error.message?.includes("Object not found") ||
          error.statusCode === "404"
        ) {
          log.log(
            ` PDF not found: ${fileName} (this is expected for test files)`,
          );
        } else {
          log.error("❌ Error creating signed URL:", error);
        }
        return c.json(
          { error: "Failed to get PDF URL", details: error.message },
          500,
        );
      }

      log.log(`✅ Signed URL created successfully`);
      log.log(`📍 URL: ${data.signedUrl?.substring(0, 80)}...`);

      return c.json({
        signedUrl: data.signedUrl,
        expiresIn: 3600,
      });
    } catch (error) {
      log.error("💥 Exception in PDF URL retrieval:", error);
      return c.json(
        { error: "Failed to get PDF URL", details: String(error) },
        500,
      );
    }
  },
);

// Delete a source PDF
app.delete(
  "/make-server-17cae920/source-pdfs/:fileName",
  verifyAuth,
  requirePermission("sources.manage"),
  async (c) => {
    try {
      const fileName = c.req.param("fileName");

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const bucketName = "make-17cae920-source-pdfs";

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        log.error("Error deleting source PDF:", error);
        return c.json(
          { error: "Failed to delete PDF", details: error.message },
          500,
        );
      }

      log.log(`✅ Source PDF deleted: ${fileName}`);

      return c.json({ success: true });
    } catch (error) {
      log.error("Error in source PDF deletion:", error);
      return c.json(
        { error: "Failed to delete PDF", details: String(error) },
        500,
      );
    }
  },
);

// ==================== SCREENSHOT STORAGE ROUTES ====================

// Helper function to generate signed URL for screenshots (24-hour expiry)
async function getScreenshotSignedUrl(
  fileName: string,
): Promise<{ signedUrl: string | null; error?: string }> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const bucketName = "make-17cae920-screenshots";

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, { public: false });
    }

    // Generate signed URL valid for 24 hours (86400 seconds)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 86400);

    if (error) {
      // Don't log as error if file simply doesn't exist (expected for test cases)
      if (
        error.message?.includes("Object not found") ||
        error.statusCode === "404"
      ) {
        log.log(
          `📸 Screenshot not found: ${fileName} (this is expected for test files)`,
        );
      } else {
        log.error("Error creating screenshot signed URL:", error);
      }
      return { signedUrl: null, error: error.message };
    }

    return { signedUrl: data.signedUrl };
  } catch (error) {
    log.error("Exception in screenshot signed URL generation:", error);
    return { signedUrl: null, error: String(error) };
  }
}

// Get signed URL for a screenshot (authenticated users)
app.get(
  "/make-server-17cae920/screenshots/:fileName",
  verifyAuth,
  async (c) => {
    try {
      const fileName = c.req.param("fileName");
      log.log(`📸 Request for screenshot URL: ${fileName}`);

      const result = await getScreenshotSignedUrl(fileName);

      if (result.error || !result.signedUrl) {
        return c.json(
          { error: "Failed to get screenshot URL", details: result.error },
          500,
        );
      }

      log.log(`✅ Screenshot signed URL created (24-hour expiry)`);

      return c.json({
        signedUrl: result.signedUrl,
        expiresIn: 86400, // 24 hours in seconds
      });
    } catch (error) {
      log.error("Exception in screenshot URL retrieval:", error);
      return c.json(
        { error: "Failed to get screenshot URL", details: String(error) },
        500,
      );
    }
  },
);

// Upload screenshot
app.post(
  "/make-server-17cae920/screenshots/upload",
  verifyAuth,
  requirePermission("sources.upload"),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const bucketName = "make-17cae920-screenshots";

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(
        (bucket) => bucket.name === bucketName,
      );

      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, { public: false });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const extension = file.name.split(".").pop() || "png";
      const fileName = `screenshot_${timestamp}_${randomStr}.${extension}`;

      // Upload file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: file.type || "image/png",
        });

      if (uploadError) {
        log.error("Error uploading screenshot:", uploadError);
        return c.json(
          {
            error: "Failed to upload screenshot",
            details: uploadError.message,
          },
          500,
        );
      }

      log.log(`✅ Screenshot uploaded: ${fileName}`);

      // Return signed URL
      const result = await getScreenshotSignedUrl(fileName);

      return c.json({
        success: true,
        fileName,
        signedUrl: result.signedUrl,
        expiresIn: 86400,
      });
    } catch (error) {
      log.error("Error in screenshot upload:", error);
      return c.json(
        { error: "Failed to upload screenshot", details: String(error) },
        500,
      );
    }
  },
);

// Delete screenshot
app.delete(
  "/make-server-17cae920/screenshots/:fileName",
  verifyAuth,
  requirePermission("sources.manage"),
  async (c) => {
    try {
      const fileName = c.req.param("fileName");

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const bucketName = "make-17cae920-screenshots";

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        log.error("Error deleting screenshot:", error);
        return c.json(
          { error: "Failed to delete screenshot", details: error.message },
          500,
        );
      }

      log.log(`✅ Screenshot deleted: ${fileName}`);

      return c.json({ success: true });
    } catch (error) {
      log.error("Error in screenshot deletion:", error);
      return c.json(
        { error: "Failed to delete screenshot", details: String(error) },
        500,
      );
    }
  },
);

// ==================== WHITEPAPER ROUTES ====================

// Get all whitepapers (public, no auth required)
app.get("/make-server-17cae920/whitepapers", async (c) => {
  try {
    const whitepapers = await kv.getByPrefix("whitepaper:");
    log.log(" Fetching all whitepapers:", {
      count: whitepapers?.length || 0,
      whitepapers: whitepapers?.map((wp) => ({
        slug: wp?.slug,
        title: wp?.title,
        contentLength: wp?.content?.length || 0,
        hasContent: !!wp?.content,
      })),
    });
    return c.json({ whitepapers });
  } catch (error) {
    log.error("Error fetching whitepapers:", error);
    return c.json(
      { error: "Failed to fetch whitepapers", details: String(error) },
      500,
    );
  }
});

// Get a single whitepaper by slug (public, no auth required)
app.get("/make-server-17cae920/whitepapers/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const whitepaper = await kv.get(`whitepaper:${slug}`);

    log.log("🔍 Retrieving whitepaper:", {
      slug,
      found: !!whitepaper,
      title: whitepaper?.title,
      contentType: typeof whitepaper?.content,
      contentLength: whitepaper?.content?.length || 0,
      contentPreview:
        typeof whitepaper?.content === "string"
          ? whitepaper.content.substring(0, 100)
          : "NOT A STRING",
      keys: whitepaper ? Object.keys(whitepaper) : [],
    });

    if (!whitepaper) {
      return c.json({ error: "Whitepaper not found" }, 404);
    }

    return c.json({ whitepaper });
  } catch (error) {
    log.error("Error fetching whitepaper:", error);
    return c.json(
      { error: "Failed to fetch whitepaper", details: String(error) },
      500,
    );
  }
});

// Create or update a whitepaper (admin only)
app.post(
  "/make-server-17cae920/whitepapers",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { slug, title, content } = await c.req.json();

      log.log("📝 Saving whitepaper:", {
        slug,
        title,
        contentType: typeof content,
        contentLength: content?.length || 0,
        contentPreview:
          typeof content === "string"
            ? content.substring(0, 100)
            : "NOT A STRING",
      });

      if (!slug || !title || !content) {
        return c.json(
          { error: "Missing required fields: slug, title, content" },
          400,
        );
      }

      // Check if whitepaper exists for audit logging
      const existing = await kv.get(`whitepaper:${slug}`);
      const isUpdate = !!existing;

      const whitepaper = {
        slug,
        title,
        content,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`whitepaper:${slug}`, whitepaper);

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "whitepaper",
        entityId: slug,
        action: isUpdate ? "update" : "create",
        before: isUpdate ? existing : undefined,
        after: whitepaper,
        req: c,
      });

      // Verify it was saved correctly
      const verification = await kv.get(`whitepaper:${slug}`);
      log.log("✅ Verification after save:", {
        slug: verification?.slug,
        title: verification?.title,
        contentType: typeof verification?.content,
        contentLength: verification?.content?.length || 0,
        hasContent: !!verification?.content,
      });

      return c.json({ whitepaper });
    } catch (error) {
      log.error("Error saving whitepaper:", error);
      return c.json(
        { error: "Failed to save whitepaper", details: String(error) },
        500,
      );
    }
  },
);

// Delete a whitepaper (admin only)
app.delete(
  "/make-server-17cae920/whitepapers/:slug",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const slug = c.req.param("slug");

      // Get existing whitepaper for audit log
      const existing = await kv.get(`whitepaper:${slug}`);

      await kv.del(`whitepaper:${slug}`);

      // Audit log
      if (existing) {
        await createAuditLog({
          userId: c.get("userId"),
          userEmail: c.get("userEmail"),
          entityType: "whitepaper",
          entityId: slug,
          action: "delete",
          before: existing,
          req: c,
        });
      }

      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting whitepaper:", error);
      return c.json(
        { error: "Failed to delete whitepaper", details: String(error) },
        500,
      );
    }
  },
);

// Get whitepaper source files from filesystem (admin only)
app.get(
  "/make-server-17cae920/whitepapers-source",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      // Define the whitepaper manifest
      const whitepaperFiles = [
        {
          slug: "recyclability",
          filename: "Recyclability.md",
          title: "WasteDB Recyclability Methodology (CR-v1)",
        },
        {
          slug: "compostability",
          filename: "CC-v1.md",
          title: "WasteDB Compostability Methodology (CC-v1)",
        },
        {
          slug: "reusability",
          filename: "RU-v1.md",
          title: "WasteDB Reusability Methodology (RU-v1)",
        },
        {
          slug: "visualization",
          filename: "VIZ-v1.md",
          title: "WasteDB Visualization Methodology (VIZ-v1)",
        },
        {
          slug: "calculation-methodology",
          filename: "Calculation_Methodology.md",
          title: "WasteDB Calculation Methodology",
        },
      ];

      const whitepapers = [];

      for (const file of whitepaperFiles) {
        try {
          // Read the markdown file from the whitepapers directory
          // In Deno, we need to construct the path relative to the current working directory
          const content = await Deno.readTextFile(
            `./whitepapers/${file.filename}`,
          );

          whitepapers.push({
            slug: file.slug,
            title: file.title,
            filename: file.filename,
            content: content,
          });

          log.log(`✅ Read ${file.filename}: ${content.length} characters`);
        } catch (error) {
          log.error(`❌ Failed to read ${file.filename}:`, error);
          // Continue with other files even if one fails
          whitepapers.push({
            slug: file.slug,
            title: file.title,
            filename: file.filename,
            content: "",
            error: String(error),
          });
        }
      }

      return c.json({ whitepapers });
    } catch (error) {
      log.error("Error reading whitepaper source files:", error);
      return c.json(
        { error: "Failed to read whitepaper files", details: String(error) },
        500,
      );
    }
  },
);

// Initialize default whitepapers on startup
async function initializeWhitepapers() {
  try {
    // Check if Recyclability whitepaper already exists
    const existing = await kv.get("whitepaper:recyclability");

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

      await kv.set("whitepaper:recyclability", {
        slug: "recyclability",
        title: "WasteDB: Statistical and Accessibility Methodology",
        content: recyclabilityContent,
        updatedAt: new Date().toISOString(),
      });
    }

    // Check if Calculation Methodology whitepaper already exists
    const calcMethodology = await kv.get("whitepaper:calculation-methodology");

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
- src/docs/data/EVIDENCE_CURATION.md - Evidence processing documentation
- src/docs/roadmap/README.md - Future enhancements and roadmap conventions

---

**Last Updated**: January 2025  
**Methodology Version**: CR-v1  
**Whitepaper Version**: 2025.1
`;

      await kv.set("whitepaper:calculation-methodology", {
        slug: "calculation-methodology",
        title: "Calculation Methodology Reference",
        content: calculationContent,
        updatedAt: new Date().toISOString(),
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
    description: material.description || "",

    // Public scores (0-100 scale)
    compostability: material.compostability || 0,
    recyclability: material.recyclability || 0,
    reusability: material.reusability || 0,

    // Add estimation flag for low confidence
    isEstimated: material.confidence_level === "Low",
    confidenceLevel: material.confidence_level || "Medium",

    // Metadata
    lastUpdated: material.calculation_timestamp || new Date().toISOString(),
    whitepaperVersion: material.whitepaper_version || "N/A",
  };
}

// Helper function to format CSV
function arrayToCSV(headers: string[], rows: any[][]): string {
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const cellStr = String(cell ?? "");
          if (
            cellStr.includes(",") ||
            cellStr.includes('"') ||
            cellStr.includes("\n")
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(","),
    ),
  ];
  return csvRows.join("\n");
}

// Public export endpoint - lay-friendly data (0-100 scale)
app.get("/make-server-17cae920/export/public", async (c) => {
  return handlePublicExport(c);
});

// Full research export endpoint - raw scientific data with v2.0 MIU evidence
app.get("/make-server-17cae920/export/full", async (c) => {
  return handleResearchExport(c);
});

// TEMP - OLD VERSION TO DELETE
app.get("/make-server-17cae920/export/full-OLD", async (c) => {
  try {
    const format = c.req.query("format") || "json"; // 'json' or 'csv'
    const compress = c.req.query("compress") === "true"; // gzip compression flag

    // Get all materials
    const materials = await kv.getByPrefix("material:");

    if (!materials || materials.length === 0) {
      if (format === "csv") {
        return c.text("", 200, { "Content-Type": "text/csv" });
      }
      return c.json({ materials: [] });
    }

    // Get all evidence points for MIU traceability (NEW in v2.0)
    const allEvidence = await kv.getByPrefix("evidence:");
    log.log(` Retrieved ${allEvidence.length} evidence points for export`);

    // Organize evidence by material ID
    const evidenceByMaterial = new Map();
    for (const evidence of allEvidence) {
      const materialId = evidence.material_id;
      if (!evidenceByMaterial.has(materialId)) {
        evidenceByMaterial.set(materialId, []);
      }
      evidenceByMaterial.get(materialId).push(evidence);
    }

    if (format === "csv") {
      const headers = [
        "ID",
        "Name",
        "Category",
        "Description",
        // CR parameters
        "Y (Yield)",
        "D (Degradability)",
        "C (Contamination)",
        "M (Maturity)",
        "E (Energy)",
        "CR Practical Mean",
        "CR Practical CI Lower",
        "CR Practical CI Upper",
        "CR Theoretical Mean",
        "CR Theoretical CI Lower",
        "CR Theoretical CI Upper",
        // CC parameters
        "B (Biodegradation)",
        "N (Nutrient Balance)",
        "T (Toxicity)",
        "H (Habitat Adaptability)",
        "CC Practical Mean",
        "CC Practical CI Lower",
        "CC Practical CI Upper",
        "CC Theoretical Mean",
        "CC Theoretical CI Lower",
        "CC Theoretical CI Upper",
        // RU parameters
        "L (Lifetime)",
        "R (Repairability)",
        "U (Upgradability)",
        "C_RU (Contamination)",
        "RU Practical Mean",
        "RU Practical CI Lower",
        "RU Practical CI Upper",
        "RU Theoretical Mean",
        "RU Theoretical CI Lower",
        "RU Theoretical CI Upper",
        // Public scores and metadata
        "Compostability (0-100)",
        "Recyclability (0-100)",
        "Reusability (0-100)",
        "Confidence Level",
        "Source Count",
        "Evidence Count",
        "Whitepaper Version",
        "Method Version",
        "Calculation Timestamp",
      ];

      const rows = materials.map((m) => {
        const evidenceCount = evidenceByMaterial.get(m.id)?.length || 0;

        return [
          m.id,
          m.name,
          m.category,
          m.description || "",
          // CR parameters
          m.Y_value?.toFixed(4) || "",
          m.D_value?.toFixed(4) || "",
          m.C_value?.toFixed(4) || "",
          m.M_value?.toFixed(4) || "",
          m.E_value?.toFixed(4) || "",
          m.CR_practical_mean?.toFixed(4) || "",
          m.CR_practical_CI95?.lower?.toFixed(4) || "",
          m.CR_practical_CI95?.upper?.toFixed(4) || "",
          m.CR_theoretical_mean?.toFixed(4) || "",
          m.CR_theoretical_CI95?.lower?.toFixed(4) || "",
          m.CR_theoretical_CI95?.upper?.toFixed(4) || "",
          // CC parameters
          m.B_value?.toFixed(4) || "",
          m.N_value?.toFixed(4) || "",
          m.T_value?.toFixed(4) || "",
          m.H_value?.toFixed(4) || "",
          m.CC_practical_mean?.toFixed(4) || "",
          m.CC_practical_CI95?.lower?.toFixed(4) || "",
          m.CC_practical_CI95?.upper?.toFixed(4) || "",
          m.CC_theoretical_mean?.toFixed(4) || "",
          m.CC_theoretical_CI95?.lower?.toFixed(4) || "",
          m.CC_theoretical_CI95?.upper?.toFixed(4) || "",
          // RU parameters
          m.L_value?.toFixed(4) || "",
          m.R_value?.toFixed(4) || "",
          m.U_value?.toFixed(4) || "",
          m.C_RU_value?.toFixed(4) || "",
          m.RU_practical_mean?.toFixed(4) || "",
          m.RU_practical_CI95?.lower?.toFixed(4) || "",
          m.RU_practical_CI95?.upper?.toFixed(4) || "",
          m.RU_theoretical_mean?.toFixed(4) || "",
          m.RU_theoretical_CI95?.lower?.toFixed(4) || "",
          m.RU_theoretical_CI95?.upper?.toFixed(4) || "",
          // Public scores and metadata
          m.compostability || "",
          m.recyclability || "",
          m.reusability || "",
          m.confidence_level || "",
          m.sources?.length || "0",
          evidenceCount.toString(),
          m.whitepaper_version || "",
          m.method_version || "",
          m.calculation_timestamp || "",
        ];
      });

      const csv = arrayToCSV(headers, rows);

      return c.text(csv, 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wastedb-research-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      });
    }

    // Return full JSON with all scientific metadata
    const fullData = materials.map((m) => ({
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
      format: "research",
      scale: "0-1 normalized + 0-100 public",
      count: fullData.length,
      materials: fullData,
      metadata: {
        note: "CR values are normalized 0-1. Public scores (compostability, recyclability, reusability) are 0-100.",
        confidenceLevels: ["High", "Medium", "Low"],
        parameters: {
          Y: "Yield - Fraction of material successfully recovered",
          D: "Degradability - Quality retention per cycle",
          C: "Contamination Tolerance - Sensitivity to contaminants",
          M: "Maturity - Infrastructure availability",
          E: "Energy - Net energy input (normalized)",
        },
      },
    });
  } catch (error) {
    log.error("Error exporting research data:", error);
    return c.json(
      { error: "Failed to export data", details: String(error) },
      500,
    );
  }
});
// END TEMP - can delete above old endpoint

// ==================== SOURCE LIBRARY ROUTES ====================

// Get all sources (public, no auth required)
app.get("/make-server-17cae920/sources", async (c) => {
  try {
    const sources = await kv.getByPrefix("source:");
    return c.json({ success: true, sources: sources || [] });
  } catch (error) {
    log.error("Error fetching sources:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch sources",
        details: String(error),
      },
      500,
    );
  }
});

// Batch save sources
app.post(
  "/make-server-17cae920/sources/batch",
  verifyAuth,
  requirePermission("sources.manage"),
  async (c) => {
    try {
      const { sources } = await c.req.json();
      if (!Array.isArray(sources)) {
        return c.json({ error: "Sources must be an array" }, 400);
      }

      const keys = sources.map((s) => `source:${s.id}`);
      const values = sources;
      await kv.mset(keys, values);

      return c.json({ success: true, count: sources.length });
    } catch (error) {
      log.error("Error batch saving sources:", error);
      return c.json(
        { error: "Failed to batch save sources", details: String(error) },
        500,
      );
    }
  },
);

// ==================== CALCULATION ENDPOINTS ====================

/**
 * Calculate Composite Compostability Index (CC)
 * Based on CC-v1 methodology whitepaper
 * Formula: CC = w_B·B + w_N·N + w_H·H + w_M·M − w_T·T
 */
app.post(
  "/make-server-17cae920/calculate/compostability",
  verifyAuth,
  requirePermission("calculations.run"),
  async (c) => {
    try {
      const { B, N, T, H, M, mode } = await c.req.json();

      // Validate inputs (all should be 0-1)
      const params = { B, N, T, H, M };
      for (const [key, value] of Object.entries(params)) {
        if (
          value !== undefined &&
          (typeof value !== "number" || value < 0 || value > 1)
        ) {
          return c.json(
            { error: `Invalid ${key} value. Must be between 0 and 1.` },
            400,
          );
        }
      }

      // Default weights (from CC-v1 whitepaper)
      const weights =
        mode === "theoretical"
          ? { w_B: 0.45, w_N: 0.15, w_H: 0.15, w_M: 0.15, w_T: 0.1 }
          : { w_B: 0.35, w_N: 0.15, w_H: 0.2, w_M: 0.2, w_T: 0.1 };

      // Calculate CC
      const CC =
        weights.w_B * (B || 0) +
        weights.w_N * (N || 0) +
        weights.w_H * (H || 0) +
        weights.w_M * (M || 0) -
        weights.w_T * (T || 0);

      // Constrain to 0-1
      const CC_constrained = Math.max(0, Math.min(1, CC));

      return c.json({
        CC_mean: CC_constrained,
        CC_public: Math.round(CC_constrained * 100), // 0-100 scale
        mode: mode || "practical",
        weights,
        inputs: params,
        whitepaper_version: "2025.1",
        method_version: "CC-v1",
        calculation_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      log.error("Error calculating compostability:", error);
      return c.json(
        { error: "Failed to calculate compostability", details: String(error) },
        500,
      );
    }
  },
);

/**
 * Calculate Composite Reusability Index (RU)
 * Based on RU-v1 methodology whitepaper
 * Formula: RU = w_L·L + w_R·R + w_U·U + w_M·M − w_C·C
 */
app.post(
  "/make-server-17cae920/calculate/reusability",
  verifyAuth,
  requirePermission("calculations.run"),
  async (c) => {
    try {
      const { L, R, U, C, M, mode } = await c.req.json();

      // Validate inputs (all should be 0-1)
      const params = { L, R, U, C, M };
      for (const [key, value] of Object.entries(params)) {
        if (
          value !== undefined &&
          (typeof value !== "number" || value < 0 || value > 1)
        ) {
          return c.json(
            { error: `Invalid ${key} value. Must be between 0 and 1.` },
            400,
          );
        }
      }

      // Default weights (from RU-v1 whitepaper)
      const weights =
        mode === "theoretical"
          ? { w_L: 0.35, w_R: 0.2, w_U: 0.15, w_M: 0.2, w_C: 0.1 }
          : { w_L: 0.25, w_R: 0.25, w_U: 0.15, w_M: 0.25, w_C: 0.1 };

      // Calculate RU
      const RU =
        weights.w_L * (L || 0) +
        weights.w_R * (R || 0) +
        weights.w_U * (U || 0) +
        weights.w_M * (M || 0) -
        weights.w_C * (C || 0);

      // Constrain to 0-1
      const RU_constrained = Math.max(0, Math.min(1, RU));

      return c.json({
        RU_mean: RU_constrained,
        RU_public: Math.round(RU_constrained * 100), // 0-100 scale
        mode: mode || "practical",
        weights,
        inputs: params,
        whitepaper_version: "2025.1",
        method_version: "RU-v1",
        calculation_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      log.error("Error calculating reusability:", error);
      return c.json(
        { error: "Failed to calculate reusability", details: String(error) },
        500,
      );
    }
  },
);

/**
 * Batch calculate all three dimensions for a material
 * Returns CR, CC, and RU values
 */
app.post(
  "/make-server-17cae920/calculate/all-dimensions",
  verifyAuth,
  requirePermission("calculations.run"),
  async (c) => {
    try {
      const params = await c.req.json();
      const { mode } = params;

      const results: any = {
        mode: mode || "practical",
        calculation_timestamp: new Date().toISOString(),
        whitepaper_version: "2025.1",
      };

      // Calculate CR if Y, D, C, M, E are provided
      if (
        params.Y !== undefined ||
        params.D !== undefined ||
        params.C !== undefined ||
        params.M !== undefined ||
        params.E !== undefined
      ) {
        // CR calculation logic (existing)
        // For now, we'll just indicate it needs implementation
        results.CR = {
          message: "CR calculation implementation needed",
          requires: ["Y", "D", "C", "M", "E"],
        };
      }

      // Calculate CC if B, N, T, H, M are provided
      if (
        params.B !== undefined ||
        params.N !== undefined ||
        params.T !== undefined ||
        params.H !== undefined
      ) {
        const weights =
          mode === "theoretical"
            ? { w_B: 0.45, w_N: 0.15, w_H: 0.15, w_M: 0.15, w_T: 0.1 }
            : { w_B: 0.35, w_N: 0.15, w_H: 0.2, w_M: 0.2, w_T: 0.1 };

        const CC =
          weights.w_B * (params.B || 0) +
          weights.w_N * (params.N || 0) +
          weights.w_H * (params.H || 0) +
          weights.w_M * (params.M || 0) -
          weights.w_T * (params.T || 0);

        const CC_constrained = Math.max(0, Math.min(1, CC));

        results.CC = {
          mean: CC_constrained,
          public: Math.round(CC_constrained * 100),
          method_version: "CC-v1",
          weights,
        };
      }

      // Calculate RU if L, R, U, C, M are provided
      if (
        params.L !== undefined ||
        params.R !== undefined ||
        params.U !== undefined ||
        params.C_RU !== undefined
      ) {
        const weights =
          mode === "theoretical"
            ? { w_L: 0.35, w_R: 0.2, w_U: 0.15, w_M: 0.2, w_C: 0.1 }
            : { w_L: 0.25, w_R: 0.25, w_U: 0.15, w_M: 0.25, w_C: 0.1 };

        const RU =
          weights.w_L * (params.L || 0) +
          weights.w_R * (params.R || 0) +
          weights.w_U * (params.U || 0) +
          weights.w_M * (params.M || 0) -
          weights.w_C * (params.C_RU || 0);

        const RU_constrained = Math.max(0, Math.min(1, RU));

        results.RU = {
          mean: RU_constrained,
          public: Math.round(RU_constrained * 100),
          method_version: "RU-v1",
          weights,
        };
      }

      return c.json(results);
    } catch (error) {
      log.error("Error calculating all dimensions:", error);
      return c.json(
        { error: "Failed to calculate dimensions", details: String(error) },
        500,
      );
    }
  },
);

// ==================== PHASE 6: CONTENT MANAGEMENT ROUTES ====================

// ===== USER PROFILES =====

// Get user profile
app.get("/make-server-17cae920/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const _profileSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    let { data: pgProfile } = await _profileSupabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // If profile doesn't exist in Postgres, create a default one
    if (!pgProfile) {
      log.log(`Profile not found for user ${userId}, creating default profile`);
      let userEmail = c.get("userEmail");
      let userName = userEmail ? userEmail.split("@")[0] : "User";
      if (!userEmail) {
        try {
          const { data: userData } =
            await _profileSupabase.auth.admin.getUserById(userId);
          if (userData?.user) {
            userEmail = userData.user.email || "";
            userName =
              userData.user.user_metadata?.name || userEmail.split("@")[0];
          }
        } catch (err) {
          log.error("Error fetching user data from Supabase:", err);
        }
      }
      const { data: inserted } = await _profileSupabase
        .from("user_profiles")
        .upsert(
          {
            id: userId,
            email: userEmail || "",
            name: userName,
            bio: "",
            social_link: "",
            avatar_url: "",
            display_email: "",
            show_on_leaderboard: true,
            org_role: "Volunteer",
          },
          { onConflict: "id" },
        )
        .select()
        .maybeSingle();
      pgProfile = inserted;
      log.log(`Created default profile for user ${userId}`);
    }

    // Map Postgres row to the profile shape the frontend expects
    const profile = pgProfile
      ? {
          user_id: pgProfile.id,
          email: pgProfile.email,
          name: pgProfile.name,
          bio: pgProfile.bio,
          social_link: pgProfile.social_link,
          avatar_url: pgProfile.avatar_url,
          display_email: pgProfile.display_email,
          show_on_leaderboard: pgProfile.show_on_leaderboard,
          org_role: pgProfile.org_role,
          role: pgProfile.role,
          created_at: pgProfile.created_at,
          updated_at: pgProfile.updated_at,
        }
      : null;

    return c.json({ profile });
  } catch (error) {
    log.error("Error fetching profile:", error);
    return c.json(
      { error: "Failed to fetch profile", details: String(error) },
      500,
    );
  }
});

// Update user profile
app.put("/make-server-17cae920/profile/:userId", verifyAuth, async (c) => {
  try {
    const userId = c.req.param("userId");
    const requestingUserId = c.get("userId");

    // Users can only update their own profile
    if (userId !== requestingUserId) {
      return c.json(
        { error: "Unauthorized - can only update own profile" },
        403,
      );
    }

    const updates = await c.req.json();
    const _putSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: existing } = await _putSupabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Merge updates (bio, social_link, avatar_url, display_email)
    const patch: Record<string, any> = {
      bio: updates.bio,
      social_link: updates.social_link,
      avatar_url: updates.avatar_url,
      display_email: updates.display_email ?? existing?.display_email ?? "",
      show_on_leaderboard:
        updates.show_on_leaderboard !== undefined
          ? Boolean(updates.show_on_leaderboard)
          : (existing?.show_on_leaderboard ?? true),
    };

    // org_role can only be changed by admins
    if (updates.org_role !== undefined) {
      const requestingUserRole = await getUserRole(requestingUserId);
      if (requestingUserRole === "admin") {
        patch.org_role = updates.org_role;
      }
      // Non-admins silently ignore org_role changes
    }

    const { data: updatedRow } = await _putSupabase
      .from("user_profiles")
      .update(patch)
      .eq("id", userId)
      .select()
      .maybeSingle();

    const updatedProfile = updatedRow
      ? {
          user_id: updatedRow.id,
          email: updatedRow.email,
          name: updatedRow.name,
          bio: updatedRow.bio,
          social_link: updatedRow.social_link,
          avatar_url: updatedRow.avatar_url,
          display_email: updatedRow.display_email,
          show_on_leaderboard: updatedRow.show_on_leaderboard,
          org_role: updatedRow.org_role,
          role: updatedRow.role,
          created_at: updatedRow.created_at,
          updated_at: updatedRow.updated_at,
        }
      : null;
    return c.json({ profile: updatedProfile });
  } catch (error) {
    log.error("Error updating profile:", error);
    return c.json(
      { error: "Failed to update profile", details: String(error) },
      500,
    );
  }
});

// Backfill created_by field for existing materials and articles (admin only)
app.post(
  "/make-server-17cae920/admin/backfill-created-by",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const userId = c.get("userId");
      let materialsUpdated = 0;
      let articlesUpdated = 0;

      // Update materials without created_by
      const allMaterials = (await kv.getByPrefix("material:")) || [];
      for (const material of allMaterials) {
        let materialNeedsUpdate = false;

        // NOTE: Material backfill disabled - materials now must be attributed at creation time
        // Uncomment below if you need to backfill material attributions:
        // if (!material.created_by) {
        //   material.created_by = userId;
        //   materialNeedsUpdate = true;
        //   materialsUpdated++;
        // }

        // Update nested articles without created_by/author_id
        if (material.articles) {
          const categories = [
            "compostability",
            "recyclability",
            "reusability",
          ] as const;
          for (const category of categories) {
            const articleArray = material.articles[category];
            if (Array.isArray(articleArray)) {
              for (const article of articleArray) {
                if (!article.created_by && !article.author_id) {
                  article.created_by = userId;
                  article.author_id = userId;
                  materialNeedsUpdate = true;
                  articlesUpdated++;
                }
              }
            }
          }
        }

        if (materialNeedsUpdate) {
          material.updated_at = new Date().toISOString();
          await kv.set(`material:${material.id}`, material);
        }
      }

      return c.json({
        success: true,
        materialsUpdated,
        articlesUpdated,
        userId,
      });
    } catch (error) {
      log.error("Error backfilling created_by:", error);
      return c.json(
        { error: "Failed to backfill", details: String(error) },
        500,
      );
    }
  },
);

// Backfill articles.created_by from the KV store article-level author_id field.
// The seed migration read art->>'created_by', but KV articles use 'author_id'.
// This endpoint re-reads the KV store and syncs the correct UUID into Postgres.
app.post(
  "/make-server-17cae920/admin/backfill-article-attribution",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      const allMaterials = (await kv.getByPrefix("material:")) || [];
      let updatedCount = 0;
      const errors: string[] = [];

      for (const material of allMaterials) {
        const kvId = (material.id as string) || "";
        if (!kvId) continue;

        const categories = [
          "compostability",
          "recyclability",
          "reusability",
        ] as const;

        for (const category of categories) {
          const artList = (material.articles as any)?.[category];
          if (!Array.isArray(artList)) continue;

          for (const art of artList) {
            // KV articles use author_id; fall back to created_by
            const authorId: string | undefined =
              art.author_id || art.created_by;
            if (!authorId || !uuidRe.test(authorId)) continue;

            const title: string = art.title || "untitled";
            // Reproduce the same slug logic as the seed migration
            const slug: string =
              art.slug?.trim() ||
              title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

            const { data: updated, error: updateErr } = await supabase
              .from("articles")
              .update({ created_by: authorId })
              .eq("legacy_material_kv_id", kvId)
              .eq("sustainability_category", category)
              .eq("slug", slug)
              .select("id");

            if (updateErr) {
              errors.push(`${kvId}/${category}/${slug}: ${updateErr.message}`);
            } else {
              updatedCount += (updated ?? []).length;
            }
          }
        }
      }

      return c.json({
        success: true,
        updatedCount,
        errors: errors.length ? errors : undefined,
      });
    } catch (error) {
      log.error("Error backfilling article attribution:", error);
      return c.json(
        {
          error: "Failed to backfill article attribution",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Backfill: mark all existing draft articles as published (admin only)
app.post(
  "/make-server-17cae920/admin/backfill-article-status",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const allMaterialEntries =
        (await kv.getEntriesByPrefix("material:")) || [];
      let articlesUpdated = 0;

      for (const entry of allMaterialEntries) {
        const material = entry.value || {};
        const idFromKey = entry.key.startsWith("material:")
          ? entry.key.slice("material:".length)
          : "";
        const resolvedId =
          typeof material.id === "string" && material.id.trim().length > 0
            ? material.id
            : idFromKey;

        if (!material.articles) continue;
        let changed = false;
        for (const category of [
          "compostability",
          "recyclability",
          "reusability",
        ]) {
          const articleList = material.articles[category];
          if (!Array.isArray(articleList)) continue;
          for (const article of articleList) {
            if (!article.status || article.status === "draft") {
              article.status = "published";
              article.updated_at =
                article.updated_at || new Date().toISOString();
              articlesUpdated++;
              changed = true;
            }
          }
        }
        if (changed) {
          await kv.set(`material:${resolvedId}`, material);
        }
      }

      return c.json({ success: true, articlesUpdated });
    } catch (error) {
      log.error("Error backfilling article status:", error);
      return c.json(
        { error: "Failed to backfill article status", details: String(error) },
        500,
      );
    }
  },
);

// Generic: insert a single article directly into Postgres (admin only)
app.post(
  "/make-server-17cae920/admin/insert-article",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const body = await c.req.json();

      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const toUuid = (...candidates: unknown[]): string | null => {
        for (const v of candidates) {
          if (typeof v === "string" && UUID_RE.test(v)) return v;
        }
        return null;
      };

      const now = new Date().toISOString();
      const title = String(body.title || "Untitled Article").trim();
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const row = {
        title,
        slug: `${slug || "article"}-${Date.now()}`,
        article_type: body.article_type || "DIY",
        sustainability_category: body.sustainability_category,
        cover_image_url: body.cover_image_url ?? null,
        content: body.content ?? { type: "doc", content: [] },
        legacy_material_kv_id: body.legacy_material_kv_id,
        created_by: toUuid(body.created_by),
        edited_by: null,
        writer_name: body.writer_name ?? null,
        editor_name: body.editor_name ?? null,
        version: Number.isFinite(Number(body.version))
          ? Number(body.version)
          : 1,
        status: "published",
        date_added: body.date_added || body.created_at || now,
        created_at: body.created_at || now,
        updated_at: now,
      };

      const { data: inserted, error } = await supabase
        .from("articles")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;

      return c.json({ success: true, article_id: inserted.id, title });
    } catch (error) {
      log.error("Error inserting article:", error);
      const msg = (error as any)?.message ?? String(error);
      return c.json({ error: "Failed to insert article", details: msg }, 500);
    }
  },
);

// Recovery: migrate KV-only articles (numeric IDs from admin direct-publish) to Postgres
app.post(
  "/make-server-17cae920/admin/migrate-kv-articles-to-postgres",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = (v: unknown) => typeof v === "string" && UUID_RE.test(v);

      const toUuid = (...candidates: unknown[]): string | null => {
        for (const c of candidates) {
          if (isUuid(c)) return c as string;
        }
        return null;
      };

      const normalizeCategory = (value: unknown) => {
        const raw = String(value ?? "")
          .trim()
          .toLowerCase();
        if (raw === "compostability" || raw === "composting")
          return "compostability";
        if (raw === "recyclability" || raw === "recycling")
          return "recyclability";
        if (raw === "reusability" || raw === "reuse") return "reusability";
        return null;
      };

      const normalizeContent = (value: unknown) => {
        if (value && typeof value === "object") return value;
        if (typeof value === "string" && value.trim().length > 0) {
          return {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: value.trim() }],
              },
            ],
          };
        }
        return { type: "doc", content: [{ type: "paragraph" }] };
      };

      const allMaterialEntries =
        (await kv.getEntriesByPrefix("material:")) || [];

      const migrated: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      for (const entry of allMaterialEntries) {
        const material = entry.value || {};
        const materialKvId = entry.key.startsWith("material:")
          ? entry.key.slice("material:".length)
          : "";

        if (!material.articles) continue;

        for (const rawCat of [
          "compostability",
          "recyclability",
          "reusability",
        ]) {
          const articleList = material.articles[rawCat];
          if (!Array.isArray(articleList)) continue;

          for (const article of articleList) {
            // Only migrate articles with numeric/non-UUID IDs (KV-only originals)
            if (isUuid(article.id)) {
              skipped.push(
                `${materialKvId}/${rawCat}/${article.id}: already a UUID, skipping`,
              );
              continue;
            }

            const category = normalizeCategory(rawCat) ?? rawCat;
            const title = String(article.title || "Untitled Article").trim();

            try {
              // Check for an existing Postgres article with same title + material to avoid dupes
              const { data: existing } = await supabase
                .from("articles")
                .select("id")
                .eq("legacy_material_kv_id", materialKvId)
                .eq("sustainability_category", category)
                .eq("title", title)
                .maybeSingle();

              if (existing) {
                skipped.push(
                  `${materialKvId}/${rawCat}/${article.id}: "${title}" already in Postgres as ${existing.id}`,
                );
                continue;
              }

              const now = new Date().toISOString();
              const slug = title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

              const row = {
                title,
                slug: `${slug || "article"}-${Date.now()}`,
                article_type: article.article_type || "DIY",
                sustainability_category: category,
                cover_image_url: article.cover_image_url ?? null,
                content: normalizeContent(article.content),
                legacy_material_kv_id: materialKvId,
                created_by: toUuid(article.created_by, article.author_id),
                edited_by: null,
                writer_name: article.writer_name ?? null,
                editor_name: article.editor_name ?? null,
                version: Number.isFinite(Number(article.version))
                  ? Number(article.version)
                  : 1,
                status: "published",
                date_added: article.dateAdded || article.created_at || now,
                created_at: article.created_at || now,
                updated_at: now,
              };

              const { data: inserted, error: insertErr } = await supabase
                .from("articles")
                .insert(row)
                .select("id")
                .single();
              if (insertErr) throw insertErr;

              migrated.push(
                `${materialKvId}/${rawCat}/${article.id}: inserted as ${inserted.id} ("${title}")`,
              );
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : ((err as any)?.message ?? JSON.stringify(err));
              errors.push(`${materialKvId}/${rawCat}/${article.id}: ${msg}`);
            }
          }
        }
      }

      return c.json({
        success: true,
        migrated: migrated.length,
        skipped: skipped.length,
        errors: errors.length,
        details: { migrated, skipped, errors },
      });
    } catch (error) {
      log.error("Error migrating KV articles:", error);
      return c.json(
        {
          error: "Failed to migrate KV articles",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Recovery: re-apply all approved article submissions to Postgres (admin only)
app.post(
  "/make-server-17cae920/admin/recover-approved-articles",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const allSubmissions = (await kv.getByPrefix("submission:")) || [];

      const approvedArticleSubmissions = allSubmissions.filter(
        (s: any) =>
          s.status === "approved" &&
          (s.type === "new_article" || s.type === "update_article") &&
          s.content_data,
      );

      const normalizeCategory = (value: unknown) => {
        const raw = String(value ?? "")
          .trim()
          .toLowerCase();
        if (raw === "compostability" || raw === "composting")
          return "compostability";
        if (raw === "recyclability" || raw === "recycling")
          return "recyclability";
        if (raw === "reusability" || raw === "reuse") return "reusability";
        return null;
      };

      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const toUuidOrNull = (...candidates: unknown[]): string | null => {
        for (const c of candidates) {
          if (typeof c === "string" && UUID_RE.test(c)) return c;
        }
        return null;
      };

      const buildSlug = (title: string, explicit?: string) => {
        const base = (explicit || title)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        return base || `article-${Date.now()}`;
      };

      const normalizeContent = (value: unknown) => {
        if (value && typeof value === "object") return value;
        if (typeof value === "string" && value.trim().length > 0) {
          return {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: value.trim() }],
              },
            ],
          };
        }
        return { type: "doc", content: [{ type: "paragraph" }] };
      };

      const recovered: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      for (const sub of approvedArticleSubmissions) {
        const data = sub.content_data;
        const now = new Date().toISOString();

        try {
          if (sub.type === "new_article") {
            const materialId = data.material_id;
            const category = normalizeCategory(
              data.sustainability_category || data.category,
            );
            if (!materialId || !category) {
              skipped.push(`${sub.id}: missing material_id or category`);
              continue;
            }

            // Old KV articles used numeric timestamp IDs — discard those, treat as new
            const existingArticleId = toUuidOrNull(data.article_id);
            if (existingArticleId) {
              // Check if already in Postgres
              const { data: existing } = await supabase
                .from("articles")
                .select("id")
                .eq("id", existingArticleId)
                .maybeSingle();
              if (existing) {
                skipped.push(
                  `${sub.id}: article ${existingArticleId} already exists`,
                );
                continue;
              }
            }

            const title = String(data.title || "Untitled Article").trim();
            // Always make slug unique to avoid collisions with deleted/orphaned rows
            const baseSlug = buildSlug(title, data.slug);
            const uniqueSlug = existingArticleId
              ? baseSlug
              : `${baseSlug}-${Date.now()}`;
            const row: Record<string, unknown> = {
              title,
              slug: uniqueSlug,
              article_type: data.article_type || "DIY",
              sustainability_category: category,
              cover_image_url: data.cover_image_url ?? null,
              content: normalizeContent(data.content),
              legacy_material_kv_id: materialId,
              created_by: toUuidOrNull(
                data.created_by,
                data.author_id,
                sub.submitted_by,
              ),
              edited_by: null,
              writer_name: data.writer_name ?? null,
              editor_name: data.editor_name ?? null,
              version: Number.isFinite(Number(data.version))
                ? Number(data.version)
                : 1,
              status: "published",
              date_added: data.dateAdded || data.created_at || now,
              created_at: data.created_at || now,
              updated_at: now,
            };

            let createdArticleId: string;
            if (existingArticleId) {
              // Upsert by id — handles the case where the article already exists
              row.id = existingArticleId;
              const { data: upserted, error: upsertErr } = await supabase
                .from("articles")
                .upsert(row, { onConflict: "id" })
                .select("id")
                .limit(1);
              if (upsertErr) throw upsertErr;
              createdArticleId = upserted?.[0]?.id || existingArticleId;
            } else {
              const { data: inserted, error: insertErr } = await supabase
                .from("articles")
                .insert(row)
                .select("id")
                .single();
              if (insertErr) throw insertErr;
              createdArticleId = inserted.id;
            }

            // Store created id back into submission content_data for link resolution
            await kv.set(`submission:${sub.id}`, {
              ...sub,
              content_data: {
                ...data,
                article_id: createdArticleId,
                sustainability_category: category,
              },
            });

            recovered.push(
              `${sub.id}: inserted article ${createdArticleId} ("${title}")`,
            );
          } else if (sub.type === "update_article") {
            const rawArticleId =
              sub.original_content_id || data.article_id || data.id;
            const articleId = toUuidOrNull(rawArticleId);
            const category = normalizeCategory(
              data.sustainability_category || data.category,
            );

            if (!articleId) {
              // Original article was a KV-only article (numeric ID) — never in Postgres.
              // Treat as a new insert using the submission's content snapshot.
              const materialId = data.material_id;
              if (!materialId || !category) {
                skipped.push(
                  `${sub.id}: update_article with legacy KV id, missing material/category`,
                );
                continue;
              }
              const title = String(data.title || "Untitled Article").trim();
              const row: Record<string, unknown> = {
                title,
                slug: `${buildSlug(title, data.slug)}-${Date.now()}`,
                article_type: data.article_type || "DIY",
                sustainability_category: category,
                cover_image_url: data.cover_image_url ?? null,
                content: normalizeContent(data.content),
                legacy_material_kv_id: materialId,
                created_by: toUuidOrNull(
                  data.created_by,
                  data.author_id,
                  sub.submitted_by,
                ),
                edited_by: null,
                writer_name: data.writer_name ?? null,
                editor_name: data.editor_name ?? null,
                version: Number.isFinite(Number(data.version))
                  ? Number(data.version)
                  : 1,
                status: "published",
                date_added: data.dateAdded || data.created_at || now,
                created_at: data.created_at || now,
                updated_at: now,
              };
              const { data: inserted, error: insertErr } = await supabase
                .from("articles")
                .insert(row)
                .select("id")
                .single();
              if (insertErr) throw insertErr;
              await kv.set(`submission:${sub.id}`, {
                ...sub,
                content_data: {
                  ...data,
                  article_id: inserted.id,
                  sustainability_category: category,
                },
              });
              recovered.push(
                `${sub.id}: inserted (from legacy update) article ${inserted.id} ("${title}")`,
              );
            } else {
              // Article exists in Postgres — update it
              const articleUpdates: Record<string, unknown> = {
                updated_at: now,
                status: "published",
              };
              if (data.title !== undefined) articleUpdates.title = data.title;
              if (data.slug !== undefined) articleUpdates.slug = data.slug;
              if (data.article_type !== undefined)
                articleUpdates.article_type = data.article_type;
              if (data.cover_image_url !== undefined)
                articleUpdates.cover_image_url = data.cover_image_url;
              if (data.content !== undefined)
                articleUpdates.content = normalizeContent(data.content);
              if (data.material_id !== undefined)
                articleUpdates.legacy_material_kv_id = data.material_id;
              if (category) articleUpdates.sustainability_category = category;

              const { data: updatedRows, error: updateErr } = await supabase
                .from("articles")
                .update(articleUpdates)
                .eq("id", articleId)
                .select("id");
              if (updateErr) throw updateErr;
              if (!updatedRows || updatedRows.length === 0) {
                skipped.push(
                  `${sub.id}: article ${articleId} not found in Postgres for update`,
                );
                continue;
              }
              await kv.set(`submission:${sub.id}`, {
                ...sub,
                content_data: {
                  ...data,
                  article_id: articleId,
                  sustainability_category: category,
                },
              });
              recovered.push(`${sub.id}: updated article ${articleId}`);
            }
          }
        } catch (err) {
          const errMsg =
            err instanceof Error
              ? err.message
              : (err as any)?.message
                ? `${(err as any).message} (code: ${(err as any).code ?? "?"})`
                : JSON.stringify(err);
          errors.push(`${sub.id}: ${errMsg}`);
        }
      }

      return c.json({
        success: true,
        total: approvedArticleSubmissions.length,
        recovered: recovered.length,
        skipped: skipped.length,
        errors: errors.length,
        details: { recovered, skipped, errors },
      });
    } catch (error) {
      log.error("Error recovering approved articles:", error);
      return c.json(
        {
          error: "Failed to recover approved articles",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Debug endpoint - get all articles with author info
app.get("/make-server-17cae920/debug/articles", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    log.log(`[DEBUG] Getting data for userId: ${userId}`);

    let allArticles, allMaterials;
    try {
      allArticles = (await kv.getByPrefix("article:")) || [];
      log.log(`[DEBUG] Articles fetch result:`, allArticles);
    } catch (err) {
      log.error(`[DEBUG] Error fetching articles:`, err);
      allArticles = [];
    }

    try {
      allMaterials = (await kv.getByPrefix("material:")) || [];
      log.log(`[DEBUG] Materials fetch result count:`, allMaterials.length);
    } catch (err) {
      log.error(`[DEBUG] Error fetching materials:`, err);
      allMaterials = [];
    }

    const articleInfo = allArticles.map((a) => ({
      id: a.id,
      title: a.title,
      author_id: a.author_id,
      created_by: a.created_by,
      submitted_by: a.submitted_by,
      curator_id: a.curator_id,
      created_at: a.created_at,
    }));

    const materialInfo = allMaterials.map((m) => ({
      id: m.id,
      name: m.name,
      created_by: m.created_by,
      created_at: m.created_at,
    }));

    const result = {
      currentUserId: userId,
      articles: {
        total: allArticles.length,
        data: articleInfo,
        yourArticles: articleInfo.filter((a) => a.author_id === userId),
      },
      materials: {
        total: allMaterials.length,
        data: materialInfo.slice(0, 5), // First 5 only for debugging
        yourMaterials: materialInfo.filter((m) => m.created_by === userId),
      },
    };

    log.log(`[DEBUG] Returning result:`, JSON.stringify(result, null, 2));
    return c.json(result);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get user contribution stats
app.get(
  "/make-server-17cae920/profile/:userId/contributions/stats",
  async (c) => {
    try {
      const userId = c.req.param("userId");
      log.log(`[Contributions] Fetching stats for userId: ${userId}`);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Count materials from Postgres
      const { count: materialsCount, error: mErr } = await supabase
        .from("materials")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId);
      if (mErr) log.error("[Contributions] Error counting materials:", mErr);

      // Count articles from Postgres
      const { count: articlesCount, error: aErr } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId);
      if (aErr) log.error("[Contributions] Error counting articles:", aErr);

      // Count guides from Postgres
      const { count: guidesCount, error: gErr } = await supabase
        .from("guides")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId);
      if (gErr) log.error("[Contributions] Error counting guides:", gErr);

      // MIUs — read from Postgres evidence_points (Step 15)
      const { count: miuCount } = await supabase
        .from("evidence_points")
        .select("*", { count: "exact", head: true })
        .eq("curator_id", userId);

      const mats = materialsCount ?? 0;
      const arts = articlesCount ?? 0;
      const guides = guidesCount ?? 0;
      const stats = {
        materials: mats,
        articles: arts,
        guides,
        mius: miuCount,
        total: mats + arts + guides + miuCount,
      };
      log.log(`[Contributions] Stats:`, stats);

      return c.json({ stats });
    } catch (error) {
      log.error("Error fetching contribution stats:", error);
      return c.json(
        { error: "Failed to fetch contribution stats", details: String(error) },
        500,
      );
    }
  },
);

// Get user activity (for calendar heatmap)
app.get(
  "/make-server-17cae920/profile/:userId/contributions/activity",
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const startDate = c.req.query("start");
      const endDate = c.req.query("end");

      // Default to last 365 days
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Collect all contributions with timestamps
      const contributions: Array<{
        date: string;
        type: string;
      }> = [];

      // Get materials from Postgres
      const { data: userMaterials } = await supabase
        .from("materials")
        .select("created_at")
        .eq("created_by", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      for (const material of userMaterials ?? []) {
        if (material.created_at) {
          contributions.push({
            date: new Date(material.created_at).toISOString().split("T")[0],
            type: "material",
          });
        }
      }

      // Get articles from Postgres
      const { data: userArticles } = await supabase
        .from("articles")
        .select("created_at")
        .eq("created_by", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      for (const article of userArticles ?? []) {
        if (article.created_at) {
          contributions.push({
            date: new Date(article.created_at).toISOString().split("T")[0],
            type: "article",
          });
        }
      }

      // Get guides from Postgres
      const { data: guides } = await supabase
        .from("guides")
        .select("created_at")
        .eq("created_by", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      for (const guide of guides ?? []) {
        if (guide.created_at) {
          contributions.push({
            date: new Date(guide.created_at).toISOString().split("T")[0],
            type: "guide",
          });
        }
      }

      // MIUs — read from Postgres evidence_points (Step 15)
      const { data: miuActivity } = await supabase
        .from("evidence_points")
        .select("created_at")
        .eq("curator_id", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      for (const ep of miuActivity ?? []) {
        if (ep.created_at) {
          contributions.push({
            date: new Date(ep.created_at).toISOString().split("T")[0],
            type: "miu",
          });
        }
      }

      // Aggregate by date
      const dateMap = new Map<
        string,
        { date: string; count: number; types: Set<string> }
      >();

      for (const contrib of contributions) {
        const existing = dateMap.get(contrib.date);
        if (existing) {
          existing.count++;
          existing.types.add(contrib.type);
        } else {
          dateMap.set(contrib.date, {
            date: contrib.date,
            count: 1,
            types: new Set([contrib.type]),
          });
        }
      }

      // Convert to array and add level
      const activity = Array.from(dateMap.values()).map((item) => ({
        date: item.date,
        count: item.count,
        types: Array.from(item.types),
        level: getContributionLevel(item.count),
      }));

      return c.json({ activity });
    } catch (error) {
      log.error("Error fetching activity:", error);
      return c.json(
        { error: "Failed to fetch activity", details: String(error) },
        500,
      );
    }
  },
);

// Get recent contributions
app.get(
  "/make-server-17cae920/profile/:userId/contributions/recent",
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const limit = parseInt(c.req.query("limit") || "10", 10);
      const typeFilter = c.req.query("type"); // Optional: "material", "article", "miu", "guide"

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const contributions: Array<{
        type: "material" | "article" | "miu" | "guide";
        title: string;
        timestamp: string;
        id: string;
        materialId?: string;
        category?: string;
      }> = [];

      // Get materials from Postgres
      if (!typeFilter || typeFilter === "material") {
        const { data: userMaterials } = await supabase
          .from("materials")
          .select("id, name, created_at")
          .eq("created_by", userId)
          .order("created_at", { ascending: false });
        for (const material of userMaterials ?? []) {
          if (material.created_at) {
            contributions.push({
              type: "material",
              title: material.name || "Untitled Material",
              timestamp: material.created_at,
              id: material.id,
            });
          }
        }
      }

      // Get articles from Postgres
      if (!typeFilter || typeFilter === "article") {
        const { data: userArticles } = await supabase
          .from("articles")
          .select(
            "id, title, created_at, legacy_material_kv_id, sustainability_category",
          )
          .eq("created_by", userId)
          .order("created_at", { ascending: false });
        for (const article of userArticles ?? []) {
          if (article.created_at) {
            contributions.push({
              type: "article",
              title: article.title || "Untitled Article",
              timestamp: article.created_at,
              id: article.id,
              materialId: article.legacy_material_kv_id,
              category: article.sustainability_category,
            });
          }
        }
      }

      // Get guides from Postgres
      if (!typeFilter || typeFilter === "guide") {
        const { data: guides } = await supabase
          .from("guides")
          .select("id, title, created_at")
          .eq("created_by", userId)
          .order("created_at", { ascending: false });
        for (const guide of guides ?? []) {
          if (guide.created_at) {
            contributions.push({
              type: "guide",
              title: guide.title || "Untitled Guide",
              timestamp: guide.created_at,
              id: guide.id,
            });
          }
        }
      }

      // MIUs — read from Postgres evidence_points (Step 15)
      if (!typeFilter || typeFilter === "miu") {
        const { data: recentMius } = await supabase
          .from("evidence_points")
          .select(
            "id, parameter, material_legacy_kv_id, created_at, materials(name)",
          )
          .eq("curator_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);
        for (const ep of recentMius ?? []) {
          if (ep.created_at) {
            const matName =
              (ep.materials as any)?.name ??
              (ep.material_legacy_kv_id
                ? `material ${ep.material_legacy_kv_id}`
                : "material");
            contributions.push({
              type: "miu",
              title: `${ep.parameter ?? "Evidence"} for ${matName}`,
              timestamp: ep.created_at,
              id: ep.id,
              materialId: ep.material_legacy_kv_id,
            });
          }
        }
      }

      // Sort by timestamp and limit
      contributions.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      return c.json({ contributions: contributions.slice(0, limit) });
    } catch (error) {
      log.error("Error fetching recent contributions:", error);
      return c.json(
        {
          error: "Failed to fetch recent contributions",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Get admin dashboard stats (public endpoint for totals)
// ─── Step 15: Seed evidence_points from KV material blobs ──────────────────
// One-time admin endpoint. Reads material:* KV blobs and inserts every embedded
// evidence entry into the evidence_points Postgres table.
// Safe to call multiple times — duplicates are skipped via conflict detection.
app.post(
  "/make-server-17cae920/admin/evidence/seed-from-kv",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Parameter → dimension mapping
      const dimensionForParam = (p: string): string | null => {
        if (["Y", "D", "C", "M", "E"].includes(p)) return "CR";
        if (["B", "N", "T", "H"].includes(p)) return "CC";
        if (["L", "R", "U", "C_RU"].includes(p)) return "RU";
        return null;
      };

      // Build a lookup of legacy_kv_id → materials.id (UUID)
      const { data: materialRows } = await supabase
        .from("materials")
        .select("id, legacy_kv_id")
        .not("legacy_kv_id", "is", null);
      const uuidByKvId = new Map<string, string>(
        (materialRows ?? []).map((r: any) => [r.legacy_kv_id, r.id]),
      );

      // Read all material KV blobs
      const allMaterials = (await kv.getByPrefix("material:")) || [];

      let inserted = 0;
      let skipped = 0;
      let errors = 0;
      const errorLog: string[] = [];

      for (const material of allMaterials) {
        if (!material.evidence) continue;
        const kvId = material.id as string;
        const materialId = uuidByKvId.get(kvId) ?? null;

        for (const param in material.evidence) {
          const evidenceList = material.evidence[param];
          if (!Array.isArray(evidenceList)) continue;

          for (const ev of evidenceList) {
            // Skip entries with no useful identity
            if (!ev.curator_id && !ev.timestamp && !ev.id) {
              skipped++;
              continue;
            }

            // Check if already seeded (by legacy_kv_raw identity)
            const evId = ev.id ?? null;
            if (evId) {
              const { data: existing } = await supabase
                .from("evidence_points")
                .select("id")
                .eq("legacy_kv_raw->>id", evId)
                .maybeSingle();
              if (existing) {
                skipped++;
                continue;
              }
            }

            const row: Record<string, any> = {
              material_id: materialId,
              material_legacy_kv_id: kvId,
              parameter: [
                "Y",
                "D",
                "C",
                "M",
                "E",
                "B",
                "N",
                "T",
                "H",
                "L",
                "R",
                "U",
                "C_RU",
              ].includes(param)
                ? param
                : null,
              dimension: dimensionForParam(param),
              curator_id: ev.curator_id ?? null,
              created_at:
                ev.timestamp ?? ev.created_at ?? new Date().toISOString(),
              updated_at:
                ev.timestamp ?? ev.created_at ?? new Date().toISOString(),
              snippet: ev.snippet ?? null,
              source_ref: ev.source_ref ?? ev.sourceRef ?? null,
              source_type: ev.source_type ?? ev.sourceType ?? null,
              value_raw: ev.value_raw ?? ev.valueRaw ?? null,
              units: ev.units ?? null,
              value_norm: ev.value_norm ?? ev.valueNorm ?? null,
              page: ev.page ?? null,
              figure: ev.figure ?? null,
              table_ref: ev.table_ref ?? ev.tableRef ?? null,
              paragraph: ev.paragraph ?? null,
              process: ev.process ?? null,
              stream: ev.stream ?? null,
              region: ev.region ?? null,
              scale: ev.scale ?? null,
              method_completeness: ev.method_completeness ?? null,
              sample_size: ev.sample_size ?? null,
              confidence_notes: ev.confidence_notes ?? null,
              conflict_of_interest: ev.conflict_of_interest ?? null,
              evidence_type: [
                "positive",
                "negative",
                "limit",
                "threshold",
              ].includes(ev.evidence_type)
                ? ev.evidence_type
                : "positive",
              validation_status: [
                "pending",
                "validated",
                "flagged",
                "duplicate",
              ].includes(ev.validation_status)
                ? ev.validation_status
                : "pending",
              codebook_version: ev.codebook_version ?? "v0",
              transform_version: ev.transform_version ?? "v1.0",
              extraction_session_id: ev.extraction_session_id ?? null,
              is_legacy: true,
              legacy_kv_raw: ev,
            };

            const { error: insertError } = await supabase
              .from("evidence_points")
              .insert(row);

            if (insertError) {
              errors++;
              errorLog.push(`${kvId}/${param}: ${insertError.message}`);
            } else {
              inserted++;
            }
          }
        }
      }

      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "evidence_points",
        entityId: "seed-from-kv",
        action: "create",
        after: { inserted, skipped, errors },
        req: c,
      });

      log.log(
        `Evidence seed: inserted=${inserted} skipped=${skipped} errors=${errors}`,
      );
      return c.json({
        success: true,
        inserted,
        skipped,
        errors,
        error_log: errorLog.slice(0, 50),
      });
    } catch (error) {
      log.error("Error seeding evidence_points from KV:", error);
      return c.json({ error: "Seed failed", details: String(error) }, 500);
    }
  },
);

// ─── Step 17: Seed audit_log Postgres table from KV entries ─────────────────
// One-time admin endpoint. Reads all audit:* KV entries and inserts them into
// the audit_log Postgres table. Safe to call multiple times — entries already
// present (matched by id) are skipped.
// IMPORTANT: does NOT call sendAuditEmailNotification or createAuditLog, so
// no emails are triggered during the seed.
app.post(
  "/make-server-17cae920/admin/audit/seed-from-kv",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Paginate directly against kv_store_17cae920 to bypass the 1000-row
      // PostgREST cap that kv.getByPrefix() inherits.
      const PAGE_SIZE = 1000;
      const allKvEntries: any[] = [];
      let page = 0;
      while (true) {
        const { data: pageData, error: pageError } = await supabase
          .from("kv_store_17cae920")
          .select("value")
          .like("key", "audit:%")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (pageError) throw pageError;
        if (!pageData || pageData.length === 0) break;
        allKvEntries.push(...pageData.map((r: any) => r.value));
        if (pageData.length < PAGE_SIZE) break;
        page++;
      }

      let inserted = 0;
      let skipped = 0;
      let errors = 0;
      const errorLog: string[] = [];

      // Use upsert with ignoreDuplicates — fully idempotent against concurrent inserts.
      for (const entry of allKvEntries) {
        const id = entry.id as string | undefined;
        if (!id) {
          skipped++;
          continue;
        }

        // Normalise: KV entries may use camelCase or older shapes
        const timestamp =
          entry.timestamp ?? entry.created_at ?? new Date().toISOString();
        const action = entry.action;
        if (!action) {
          skipped++;
          continue;
        }

        const row: Record<string, any> = {
          id,
          timestamp,
          user_id: entry.userId ?? entry.user_id ?? null,
          user_email: entry.userEmail ?? entry.user_email ?? null,
          entity_type: entry.entityType ?? entry.entity_type ?? null,
          entity_id: entry.entityId ?? entry.entity_id ?? null,
          action,
          before: entry.before ?? null,
          after: entry.after ?? null,
          changes: entry.changes ?? [],
          ip_address: entry.ipAddress ?? entry.ip_address ?? null,
          user_agent: entry.userAgent ?? entry.user_agent ?? null,
        };

        const { error: upsertError } = await supabase
          .from("audit_log")
          .upsert(row, { onConflict: "id", ignoreDuplicates: true });

        if (upsertError) {
          errors++;
          errorLog.push(`${id}: ${upsertError.message}`);
        } else {
          inserted++;
        }
      }

      log.log(
        `Audit seed: inserted=${inserted} skipped=${skipped} errors=${errors} total_kv=${allKvEntries.length}`,
      );
      return c.json({
        success: true,
        inserted,
        skipped,
        errors,
        total_kv: allKvEntries.length,
        error_log: errorLog.slice(0, 50),
      });
    } catch (error) {
      log.error("Error seeding audit_log from KV:", error);
      return c.json(
        { error: "Audit seed failed", details: String(error) },
        500,
      );
    }
  },
);

// ─── Step 19: Seed user_profiles.role from KV user_role:* entries ────────────
// One-time admin endpoint. Reads all user_role:* KV entries and writes the role
// into the matching user_profiles row. Safe to run multiple times — a row whose
// role is already non-default ('user') is skipped unless the KV value differs,
// in which case the KV value wins (KV is authoritative until this seed completes).
app.post(
  "/make-server-17cae920/admin/roles/seed-from-kv",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Paginate through kv_store_17cae920 to get all user_role:* entries
      const PAGE_SIZE = 1000;
      const allKvEntries: Array<{ key: string; value: any }> = [];
      let page = 0;
      while (true) {
        const { data: pageData, error: pageError } = await supabase
          .from("kv_store_17cae920")
          .select("key, value")
          .like("key", "user_role:%")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (pageError) throw pageError;
        if (!pageData || pageData.length === 0) break;
        allKvEntries.push(...pageData);
        if (pageData.length < PAGE_SIZE) break;
        page++;
      }

      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const errorLog: string[] = [];

      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const { key, value } of allKvEntries) {
        // key format: "user_role:<userId>"
        const userId = key.replace("user_role:", "");
        if (!userId || !UUID_RE.test(userId)) {
          skipped++;
          continue;
        }

        // value is the role string (e.g. "admin" or "user")
        const role = typeof value === "string" ? value : "user";

        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ role })
          .eq("id", userId);

        if (updateError) {
          errors++;
          errorLog.push(`${userId}: ${updateError.message}`);
        } else {
          updated++;
        }
      }

      log.log(
        `Role seed: updated=${updated} skipped=${skipped} errors=${errors} total_kv=${allKvEntries.length}`,
      );
      return c.json({
        success: true,
        updated,
        skipped,
        errors,
        total_kv: allKvEntries.length,
        error_log: errorLog.slice(0, 50),
      });
    } catch (error) {
      log.error("Error seeding roles from KV:", error);
      return c.json({ error: "Role seed failed", details: String(error) }, 500);
    }
  },
);

app.get("/make-server-17cae920/admin/stats", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Count materials from Postgres
    const { count: materialsCount } = await supabase
      .from("materials")
      .select("*", { count: "exact", head: true });

    // Count articles from Postgres
    const { count: articlesCount } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true });

    // Count guides from Postgres
    const { count: guidesCount } = await supabase
      .from("guides")
      .select("*", { count: "exact", head: true });

    // Count users from Postgres user_profiles
    const { count: usersCount } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });

    // MIUs — read from Postgres evidence_points (Step 15)
    const { count: miusCount } = await supabase
      .from("evidence_points")
      .select("*", { count: "exact", head: true });

    return c.json({
      stats: {
        materials: materialsCount ?? 0,
        articles: articlesCount ?? 0,
        guides: guidesCount ?? 0,
        mius: miusCount,
        users: usersCount ?? 0,
      },
    });
  } catch (error) {
    log.error("Error fetching admin stats:", error);
    return c.json(
      { error: "Failed to fetch admin stats", details: String(error) },
      500,
    );
  }
});

// Get leaderboard of top contributors (public endpoint)
app.get("/make-server-17cae920/leaderboard", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "10", 10);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Aggregate contributions by user
    const contributionsByUser: Map<
      string,
      {
        userId: string;
        materials: number;
        articles: number;
        guides: number;
        mius: number;
      }
    > = new Map();

    const bump = (
      userId: string,
      field: "materials" | "articles" | "guides" | "mius",
    ) => {
      const entry = contributionsByUser.get(userId) || {
        userId,
        materials: 0,
        articles: 0,
        guides: 0,
        mius: 0,
      };
      entry[field]++;
      contributionsByUser.set(userId, entry);
    };

    // Materials from Postgres
    const { data: allMaterialsData } = await supabase
      .from("materials")
      .select("created_by")
      .not("created_by", "is", null);
    for (const m of allMaterialsData ?? []) {
      if (m.created_by) bump(m.created_by, "materials");
    }

    // Articles from Postgres
    const { data: allArticlesData } = await supabase
      .from("articles")
      .select("created_by")
      .not("created_by", "is", null);
    for (const a of allArticlesData ?? []) {
      if (a.created_by) bump(a.created_by, "articles");
    }

    // Guides from Postgres (published only)
    const { data: allGuides } = await supabase
      .from("guides")
      .select("created_by")
      .eq("status", "published")
      .not("created_by", "is", null);
    for (const g of allGuides ?? []) {
      if (g.created_by) bump(g.created_by, "guides");
    }

    // MIUs — read from Postgres evidence_points (Step 15)
    const { data: allEvidenceData } = await supabase
      .from("evidence_points")
      .select("curator_id")
      .not("curator_id", "is", null);
    for (const ep of allEvidenceData ?? []) {
      if (ep.curator_id) bump(ep.curator_id, "mius");
    }

    // Merge across linked auth identities (email aliases → canonical user)
    const { data: authUsersData, error: authUsersError } =
      await supabase.auth.admin.listUsers();
    if (authUsersError) {
      log.error(
        "Error listing users for leaderboard canonicalization:",
        authUsersError,
      );
    }
    const authUserById = new Map(
      (authUsersData?.users || []).map((user) => [user.id, user]),
    );

    const canonicalContributionsByUser: Map<
      string,
      {
        userId: string;
        materials: number;
        articles: number;
        guides: number;
        mius: number;
      }
    > = new Map();

    for (const [sourceUserId, stats] of contributionsByUser) {
      const authUser = authUserById.get(sourceUserId);
      const canonicalUserId = authUser?.email
        ? await resolveCanonicalUserIdFromAlias(
            supabase,
            authUser.email,
            sourceUserId,
          )
        : sourceUserId;

      const existing = canonicalContributionsByUser.get(canonicalUserId) || {
        userId: canonicalUserId,
        materials: 0,
        articles: 0,
        guides: 0,
        mius: 0,
      };
      existing.materials += stats.materials;
      existing.articles += stats.articles;
      existing.guides += stats.guides;
      existing.mius += stats.mius;
      canonicalContributionsByUser.set(canonicalUserId, existing);
    }

    // Fetch all relevant user profiles from Postgres in one query
    const leaderUserIds = [...canonicalContributionsByUser.keys()];
    const { data: profileRows } =
      leaderUserIds.length > 0
        ? await supabase
            .from("user_profiles")
            .select("id, name, avatar_url, show_on_leaderboard")
            .in("id", leaderUserIds)
        : { data: [] };
    const profileById = new Map((profileRows ?? []).map((p) => [p.id, p]));

    // Build leaderboard
    const leaders = [];
    for (const [userId, stats] of canonicalContributionsByUser) {
      const total =
        stats.materials + stats.articles + stats.guides + stats.mius;
      if (total === 0) continue;

      const profile = profileById.get(userId);

      // Users can opt out from appearing in public leaderboard results.
      if (profile?.show_on_leaderboard === false) continue;

      let name = "Anonymous";
      if (profile?.name) {
        name = profile.name;
      } else {
        const authUser = authUserById.get(userId);
        if (authUser?.email) {
          name = authUser.email.split("@")[0];
        }
      }

      leaders.push({
        userId,
        name,
        avatar_url: profile?.avatar_url ?? null,
        materials: stats.materials,
        articles: stats.articles,
        guides: stats.guides,
        mius: stats.mius,
        total,
      });
    }

    leaders.sort((a, b) => b.total - a.total);

    return c.json({ leaders: leaders.slice(0, limit) });
  } catch (error) {
    log.error("Error fetching leaderboard:", error);
    return c.json(
      { error: "Failed to fetch leaderboard", details: String(error) },
      500,
    );
  }
});

// Helper function to calculate contribution level
function getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

// ===== ARTICLES =====

// Get all articles (public)
app.get("/make-server-17cae920/articles", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const status = c.req.query("status");
    const materialId = c.req.query("material_id");

    let query = supabase
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (materialId) query = query.eq("legacy_material_kv_id", materialId);

    const { data, error } = await query;
    if (error) throw error;

    return c.json({ articles: data ?? [] });
  } catch (error) {
    log.error("Error fetching articles:", error);
    return c.json(
      { error: "Failed to fetch articles", details: String(error) },
      500,
    );
  }
});

// Get single article
app.get("/make-server-17cae920/articles/:id", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const id = c.req.param("id");

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return c.json({ error: "Article not found" }, 404);
    }

    return c.json({ article: data });
  } catch (error) {
    log.error("Error fetching article:", error);
    return c.json(
      { error: "Failed to fetch article", details: String(error) },
      500,
    );
  }
});

// Create article (admin direct-publish → Postgres)
app.post(
  "/make-server-17cae920/articles",
  verifyAuth,
  requirePermission("articles.create"),
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const userId = c.get("userId");
      const d = await c.req.json();

      const now = new Date().toISOString();
      const title = String(d.title || "Untitled Article").trim();
      const slugBase = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const normalizeCategory = (v: unknown) => {
        const raw = String(v ?? "")
          .trim()
          .toLowerCase();
        if (raw === "compostability" || raw === "composting")
          return "compostability";
        if (raw === "recyclability" || raw === "recycling")
          return "recyclability";
        if (raw === "reusability" || raw === "reuse") return "reusability";
        return raw || null;
      };

      const row = {
        title,
        slug: `${slugBase || "article"}-${Date.now()}`,
        article_type: d.article_type || "DIY",
        sustainability_category: normalizeCategory(
          d.sustainability_category || d.category,
        ),
        cover_image_url: d.cover_image_url ?? null,
        content: d.content ?? { type: "doc", content: [] },
        legacy_material_kv_id: d.material_id || d.legacy_material_kv_id || null,
        created_by: d.created_by || userId,
        edited_by: null,
        writer_name: d.writer_name ?? null,
        editor_name: d.editor_name ?? null,
        version: Number.isFinite(Number(d.version)) ? Number(d.version) : 1,
        status: "published",
        date_added: d.date_added || d.dateAdded || now,
        created_at: d.created_at || now,
        updated_at: now,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("articles")
        .insert(row)
        .select()
        .single();
      if (insertErr) throw insertErr;

      await createAuditLog({
        userId,
        userEmail: c.get("userEmail"),
        entityType: "article",
        entityId: inserted.id,
        action: "create",
        after: { title: inserted.title, status: inserted.status },
        req: c,
      });
      return c.json({ article: inserted });
    } catch (error) {
      log.error("Error creating article:", error);
      const msg = (error as any)?.message ?? String(error);
      return c.json({ error: "Failed to create article", details: msg }, 500);
    }
  },
);

// Update article (Postgres)
app.put("/make-server-17cae920/articles/:id", verifyAuth, async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const id = c.req.param("id");
    const userId = c.get("userId");
    const d = await c.req.json();

    const { data: existing, error: fetchErr } = await supabase
      .from("articles")
      .select("id, created_by, title, status")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json({ error: "Article not found" }, 404);

    const isOwner = existing.created_by === userId;
    const canEditOwn =
      isOwner && (await hasPermission(userId, "articles.edit.own"));
    const canEditAny = await hasPermission(userId, "articles.edit.any");
    if (!canEditOwn && !canEditAny)
      return c.json({ error: "Unauthorized" }, 403);

    // Build a safe update object with only known DB columns.
    // The frontend Article type has fields (material_id, author_id, dateAdded)
    // that don't exist as columns in the articles table — passing them raw would
    // cause a Postgres error and silently drop the entire update.
    const safeUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (d.title !== undefined) safeUpdate.title = String(d.title).trim();
    if (d.slug !== undefined) safeUpdate.slug = d.slug;
    if (d.content !== undefined) safeUpdate.content = d.content;
    if (d.cover_image_url !== undefined)
      safeUpdate.cover_image_url = d.cover_image_url ?? null;
    if (d.article_type !== undefined) safeUpdate.article_type = d.article_type;
    if (d.sustainability_category !== undefined)
      safeUpdate.sustainability_category = d.sustainability_category;
    if (d.status !== undefined) safeUpdate.status = d.status;
    if (d.version !== undefined) safeUpdate.version = Number(d.version);
    if (d.writer_name !== undefined)
      safeUpdate.writer_name = d.writer_name ?? null;
    if (d.editor_name !== undefined)
      safeUpdate.editor_name = d.editor_name ?? null;
    if (d.edited_by !== undefined) safeUpdate.edited_by = d.edited_by ?? null;

    const { data: updated, error: updateErr } = await supabase
      .from("articles")
      .update(safeUpdate)
      .eq("id", id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    await createAuditLog({
      userId,
      userEmail: c.get("userEmail"),
      entityType: "article",
      entityId: id,
      action: "update",
      before: { title: existing.title, status: existing.status },
      after: { title: updated.title, status: updated.status },
      req: c,
    });
    return c.json({ article: updated });
  } catch (error) {
    log.error("Error updating article:", error);
    const msg = (error as any)?.message ?? String(error);
    return c.json({ error: "Failed to update article", details: msg }, 500);
  }
});

// Delete article (Postgres)
app.delete("/make-server-17cae920/articles/:id", verifyAuth, async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const id = c.req.param("id");
    const userId = c.get("userId");

    const { data: existing, error: fetchErr } = await supabase
      .from("articles")
      .select("id, created_by, title, status")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json({ error: "Article not found" }, 404);

    const isOwner = existing.created_by === userId;
    const canDeleteOwn =
      isOwner && (await hasPermission(userId, "articles.delete.own"));
    const canDeleteAny = await hasPermission(userId, "articles.delete.any");
    if (!canDeleteOwn && !canDeleteAny)
      return c.json({ error: "Unauthorized" }, 403);

    const { error: deleteErr } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);
    if (deleteErr) throw deleteErr;

    await createAuditLog({
      userId,
      userEmail: c.get("userEmail"),
      entityType: "article",
      entityId: id,
      action: "delete",
      before: { title: existing.title, status: existing.status },
      req: c,
    });
    return c.json({ success: true });
  } catch (error) {
    log.error("Error deleting article:", error);
    const msg = (error as any)?.message ?? String(error);
    return c.json({ error: "Failed to delete article", details: msg }, 500);
  }
});

// ===== SUBMISSIONS =====

// Get all submissions (admin only)
app.get(
  "/make-server-17cae920/submissions",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const status = c.req.query("status");
      let submissions = await kv.getByPrefix("submission:");

      if (status) {
        submissions = submissions?.filter((s) => s.status === status) || [];
      }

      return c.json({ submissions: submissions || [] });
    } catch (error) {
      log.error("Error fetching submissions:", error);
      return c.json(
        { error: "Failed to fetch submissions", details: String(error) },
        500,
      );
    }
  },
);

// Get user's own submissions
app.get("/make-server-17cae920/submissions/my", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const submissions = await kv.getByPrefix("submission:");
    const userSubmissions =
      submissions?.filter((s) => s.submitted_by === userId) || [];

    return c.json({ submissions: userSubmissions });
  } catch (error) {
    log.error("Error fetching user submissions:", error);
    return c.json(
      { error: "Failed to fetch submissions", details: String(error) },
      500,
    );
  }
});

// Create submission (authenticated users)
app.post("/make-server-17cae920/submissions", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const submissionData = await c.req.json();

    const submission = {
      id: crypto.randomUUID(),
      ...submissionData,
      submitted_by: userId,
      status: "pending_review",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`submission:${submission.id}`, submission);

    // Look up submitter's name for the notification
    let submitterName = "a user";
    try {
      const _submissionSupabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data: _submitterRow } = await _submissionSupabase
        .from("user_profiles")
        .select("name, email")
        .eq("id", userId)
        .maybeSingle();
      if (_submitterRow?.name) {
        submitterName = _submitterRow.name;
      } else if (_submitterRow?.email) {
        submitterName = _submitterRow.email.split("@")[0];
      }
    } catch (_) {
      // Fall back to generic name
    }

    const typeLabels: Record<string, string> = {
      new_material: "material",
      edit_material: "material edit",
      new_article: "article",
      update_article: "article update",
      delete_material: "material deletion",
      delete_article: "article deletion",
    };
    const typeLabel =
      typeLabels[submission.type] || submission.type.replace(/_/g, " ");

    // Create notification for admins
    const adminNotification = {
      id: crypto.randomUUID(),
      user_id: "admin", // Special case for admin notifications
      type: "new_review_item",
      content_id: submission.id,
      content_type: "submission",
      message: `New ${typeLabel} submission from ${submitterName}`,
      read: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`notification:${adminNotification.id}`, adminNotification);

    return c.json({ submission });
  } catch (error) {
    log.error("Error creating submission:", error);
    return c.json(
      { error: "Failed to create submission", details: String(error) },
      500,
    );
  }
});

// Resubmit a submission after revision (submitter only)
app.put(
  "/make-server-17cae920/submissions/:id/resubmit",
  verifyAuth,
  async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("userId");
      const { content_data } = await c.req.json();

      const existing = await kv.get(`submission:${id}`);
      if (!existing) {
        return c.json({ error: "Submission not found" }, 404);
      }

      if (existing.submitted_by !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const allowedStatuses = ["needs_revision", "pending_revision"];
      if (!allowedStatuses.includes(existing.status)) {
        return c.json({ error: "Submission is not awaiting revision" }, 400);
      }

      const updatedSubmission = {
        ...existing,
        content_data,
        status: "pending_review",
        feedback: null,
        updated_at: new Date().toISOString(),
      };

      await kv.set(`submission:${id}`, updatedSubmission);

      // Notify admins of the resubmission
      const adminNotification = {
        id: crypto.randomUUID(),
        user_id: "admin",
        type: "new_review_item",
        content_id: id,
        content_type: "submission",
        message: "A revised submission is ready for review",
        read: false,
        created_at: new Date().toISOString(),
      };
      await kv.set(`notification:${adminNotification.id}`, adminNotification);

      return c.json({ submission: updatedSubmission });
    } catch (error) {
      log.error("Error resubmitting submission:", error);
      return c.json(
        { error: "Failed to resubmit submission", details: String(error) },
        500,
      );
    }
  },
);

// Update submission (admin only)
app.put(
  "/make-server-17cae920/submissions/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("userId");
      const updates = await c.req.json();

      const existing = await kv.get(`submission:${id}`);
      if (!existing) {
        return c.json({ error: "Submission not found" }, 404);
      }

      let updatedContentData = existing.content_data;

      // If approved, apply content changes to Postgres (source of truth for reads).
      if (updates.status === "approved" && existing.content_data) {
        const type = existing.type as string;
        const data = existing.content_data;
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const normalizeCategory = (value: unknown) => {
          const raw = String(value ?? "")
            .trim()
            .toLowerCase();
          if (!raw) return null;
          if (raw === "compostability" || raw === "composting") {
            return "compostability";
          }
          if (raw === "recyclability" || raw === "recycling") {
            return "recyclability";
          }
          if (raw === "reusability" || raw === "reuse") {
            return "reusability";
          }
          return null;
        };

        const buildSlug = (title: string, explicit?: string) => {
          const base = (explicit || title)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          return base || `article-${Date.now()}`;
        };

        const normalizeArticleContent = (value: unknown) => {
          if (value && typeof value === "object") return value;
          if (typeof value === "string" && value.trim().length > 0) {
            return {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: value.trim() }],
                },
              ],
            };
          }
          return {
            type: "doc",
            content: [{ type: "paragraph" }],
          };
        };

        const now = new Date().toISOString();

        try {
          if (type === "new_article") {
            const materialId = data.material_id;
            const category = normalizeCategory(
              data.sustainability_category || data.category,
            );
            if (!materialId || !category) {
              throw new Error("Missing material/category for new_article");
            }

            const title = String(data.title || "Untitled Article").trim();
            const row: Record<string, unknown> = {
              title,
              slug: buildSlug(title, data.slug),
              article_type: data.article_type || "DIY",
              sustainability_category: category,
              cover_image_url: data.cover_image_url ?? null,
              content: normalizeArticleContent(data.content),
              legacy_material_kv_id: materialId,
              created_by:
                data.created_by || data.author_id || existing.submitted_by,
              edited_by: null,
              writer_name: data.writer_name ?? null,
              editor_name: data.editor_name ?? null,
              version: Number.isFinite(Number(data.version))
                ? Number(data.version)
                : 1,
              status: "published",
              date_added: data.dateAdded || data.created_at || now,
              created_at: data.created_at || now,
              updated_at: now,
            };

            let createdArticleId: string | undefined;
            if (data.id) {
              row.id = data.id;
              const { data: upsertedRows, error: upsertErr } = await supabase
                .from("articles")
                .upsert(row, { onConflict: "id" })
                .select("id")
                .limit(1);
              if (upsertErr) throw upsertErr;
              createdArticleId = upsertedRows?.[0]?.id || String(data.id);
            } else {
              const { data: inserted, error: insertErr } = await supabase
                .from("articles")
                .insert(row)
                .select("id")
                .single();
              if (insertErr) throw insertErr;
              createdArticleId = inserted?.id;
            }

            updatedContentData = {
              ...data,
              article_id: createdArticleId,
              sustainability_category: category,
            };
          } else if (type === "update_article") {
            const articleId =
              existing.original_content_id || data.article_id || data.id;
            if (!articleId) {
              throw new Error("Missing article id for update_article");
            }

            const category = normalizeCategory(
              data.sustainability_category || data.category,
            );

            const articleUpdates: Record<string, unknown> = {
              updated_at: now,
              status: "published",
              edited_by: userId,
            };

            if (data.title !== undefined) articleUpdates.title = data.title;
            if (data.slug !== undefined) articleUpdates.slug = data.slug;
            if (data.article_type !== undefined) {
              articleUpdates.article_type = data.article_type;
            }
            if (data.cover_image_url !== undefined) {
              articleUpdates.cover_image_url = data.cover_image_url;
            }
            if (data.content !== undefined) {
              articleUpdates.content = normalizeArticleContent(data.content);
            }
            if (data.material_id !== undefined) {
              articleUpdates.legacy_material_kv_id = data.material_id;
            }
            if (category) {
              articleUpdates.sustainability_category = category;
            }
            if (Number.isFinite(Number(data.version))) {
              articleUpdates.version = Number(data.version);
            }
            if (data.writer_name !== undefined) {
              articleUpdates.writer_name = data.writer_name;
            }
            if (data.editor_name !== undefined) {
              articleUpdates.editor_name = data.editor_name;
            }

            const { data: updatedRows, error: updateErr } = await supabase
              .from("articles")
              .update(articleUpdates)
              .eq("id", articleId)
              .select("id")
              .limit(1);
            if (updateErr) throw updateErr;
            if (!updatedRows || updatedRows.length === 0) {
              throw new Error(`Article not found for update: ${articleId}`);
            }

            updatedContentData = {
              ...data,
              article_id: articleId,
              sustainability_category:
                category || data.sustainability_category || data.category,
            };
          } else if (type === "delete_article") {
            const articleId =
              existing.original_content_id || data.article_id || data.id;
            if (!articleId) {
              throw new Error("Missing article id for delete_article");
            }

            const { error: deleteErr } = await supabase
              .from("articles")
              .delete()
              .eq("id", articleId);
            if (deleteErr) throw deleteErr;

            updatedContentData = {
              ...data,
              article_id: articleId,
            };
          }
        } catch (applyErr) {
          log.error(
            "Error applying approved submission to Postgres:",
            applyErr,
          );
          return c.json(
            {
              error: "Failed to apply approved submission",
              details: String(applyErr),
            },
            500,
          );
        }
      }

      const updatedSubmission = {
        ...existing,
        ...updates,
        content_data: updatedContentData,
        reviewed_by: userId,
        updated_at: new Date().toISOString(),
      };

      await kv.set(`submission:${id}`, updatedSubmission);

      // If approved/rejected, notify the submitter
      if (updates.status === "approved" || updates.status === "rejected") {
        const notification = {
          id: crypto.randomUUID(),
          user_id: existing.submitted_by,
          type: "submission_approved",
          content_id: id,
          content_type: "submission",
          message:
            updates.status === "approved"
              ? "Your submission was approved!"
              : "Your submission was rejected",
          read: false,
          created_at: new Date().toISOString(),
        };

        await kv.set(`notification:${notification.id}`, notification);
      }

      // If feedback provided, notify submitter
      if (updates.feedback) {
        const notification = {
          id: crypto.randomUUID(),
          user_id: existing.submitted_by,
          type: "feedback_received",
          content_id: id,
          content_type: "submission",
          message: "You received feedback on your submission",
          read: false,
          created_at: new Date().toISOString(),
        };

        await kv.set(`notification:${notification.id}`, notification);
      }

      return c.json({ submission: updatedSubmission });
    } catch (error) {
      log.error("Error updating submission:", error);
      return c.json(
        { error: "Failed to update submission", details: String(error) },
        500,
      );
    }
  },
);

// Delete own rejected submission (submitter only)
app.delete(
  "/make-server-17cae920/submissions/:id/my",
  verifyAuth,
  async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("userId");
      const submission = await kv.get(`submission:${id}`);

      if (!submission) {
        return c.json({ error: "Submission not found" }, 404);
      }

      if (submission.submitted_by !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      if (submission.status !== "rejected") {
        return c.json(
          { error: "Only rejected submissions can be deleted" },
          400,
        );
      }

      await kv.del(`submission:${id}`);
      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting own rejected submission:", error);
      return c.json(
        {
          error: "Failed to delete own rejected submission",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Delete submission (admin only)
app.delete(
  "/make-server-17cae920/submissions/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      await kv.del(`submission:${id}`);
      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting submission:", error);
      return c.json(
        { error: "Failed to delete submission", details: String(error) },
        500,
      );
    }
  },
);

// ===== NOTIFICATIONS =====

// Create notification (admin only)
app.post(
  "/make-server-17cae920/notifications",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { user_id, type, content_id, content_type, message } =
        await c.req.json();

      if (!user_id || !type || !message) {
        return c.json(
          { error: "Missing required fields: user_id, type, message" },
          400,
        );
      }

      const notificationId = `notif_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const notification = {
        id: notificationId,
        user_id,
        type,
        content_id: content_id || null,
        content_type: content_type || null,
        message,
        read: false,
        created_at: new Date().toISOString(),
      };

      await kv.set(`notification:${notificationId}`, notification);
      log.log("Notification created:", notificationId);

      return c.json({ success: true, notification });
    } catch (error) {
      log.error("Error creating notification:", error);
      return c.json(
        { error: "Failed to create notification", details: String(error) },
        500,
      );
    }
  },
);

// Get user notifications
app.get(
  "/make-server-17cae920/notifications/:userId",
  verifyAuth,
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const requestingUserId = c.get("userId");
      const userRole = await getUserRole(requestingUserId);

      // Users can only see their own notifications, admins see all admin notifications
      if (
        userId !== requestingUserId &&
        !(userRole === "admin" && userId === "admin")
      ) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const allNotifications = await kv.getByPrefix("notification:");
      const userNotifications =
        allNotifications?.filter((n) => n.user_id === userId) || [];

      return c.json({ notifications: userNotifications });
    } catch (error) {
      log.error("Error fetching notifications:", error);
      return c.json(
        { error: "Failed to fetch notifications", details: String(error) },
        500,
      );
    }
  },
);

// Mark notification as read
app.put(
  "/make-server-17cae920/notifications/:id/read",
  verifyAuth,
  async (c) => {
    try {
      const id = c.req.param("id");
      const notification = await kv.get(`notification:${id}`);

      if (!notification) {
        return c.json({ error: "Notification not found" }, 404);
      }

      notification.read = true;
      await kv.set(`notification:${id}`, notification);

      return c.json({ notification });
    } catch (error) {
      log.error("Error marking notification as read:", error);
      return c.json(
        { error: "Failed to update notification", details: String(error) },
        500,
      );
    }
  },
);

// ===== EMAIL NOTIFICATIONS (RESEND) =====

// Send email notification (admin only)
app.post(
  "/make-server-17cae920/email/send",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { to, subject, html, text } = await c.req.json();

      if (!to || !subject || (!html && !text)) {
        return c.json(
          { error: "Missing required fields: to, subject, and html or text" },
          400,
        );
      }

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (!RESEND_API_KEY) {
        log.error("RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      // Send email via Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "WasteDB <no-reply@wastefull.org>",
          to: [to],
          subject,
          html: html || text,
          text: text || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error("Resend API error:", errorText);
        return c.json(
          { error: "Failed to send email", details: errorText },
          500,
        );
      }

      const result = await response.json();
      log.log("Email sent successfully:", result.id);

      return c.json({ success: true, emailId: result.id });
    } catch (error) {
      log.error("Error sending email:", error);
      return c.json(
        { error: "Failed to send email", details: String(error) },
        500,
      );
    }
  },
);

// Send revision request email (admin only)
app.post(
  "/make-server-17cae920/email/revision-request",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const {
        submissionId,
        feedback,
        submitterEmail,
        submitterName,
        submissionType,
      } = await c.req.json();

      if (!submitterEmail || !feedback || !submissionType) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (!RESEND_API_KEY) {
        log.error("RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      // Format submission type for display
      const typeDisplay = submissionType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revision Requested - WasteDB</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Sniglet', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #faf7f2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf7f2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1.5px solid #211f1c; border-radius: 11.464px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #e4e3ac; padding: 30px 40px; border-bottom: 1.5px solid #211f1c; text-align: center;">
              <img src="https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/uplogo_transparent-1761169051994.png" alt="WasteDB Logo" style="width: 120px; height: auto; margin-bottom: 16px;" />
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #211f1c; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px;">
                Content Review System
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #211f1c;">
                Revision Requested
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                ${submitterName ? `Hi ${submitterName},` : "Hello,"}
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                Your <strong>${typeDisplay}</strong> submission has been reviewed, and we'd like to request some revisions before approval.
              </p>
              
              <!-- Feedback Box -->
              <div style="background-color: #faf7f2; border: 1.5px solid #211f1c; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #211f1c; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px;">
                  Reviewer Feedback:
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #211f1c; white-space: pre-wrap;">
${feedback}
                </p>
              </div>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                Please review the feedback above and make any necessary changes. You can view and update your submission in your <strong>My Submissions</strong> dashboard.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="https://db.wastefull.org" style="display: inline-block; background-color: #e4e3ac; color: #211f1c; text-decoration: none; padding: 12px 32px; border: 1.5px solid #211f1c; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 3px 4px 0px -1px #000000;">
                      View My Submissions
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #211f1c; opacity: 0.7;">
                Thank you for contributing to WasteDB! We appreciate your effort in making our materials database more accurate and comprehensive.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf7f2; padding: 24px 40px; border-top: 1.5px solid #211f1c; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #211f1c; opacity: 0.7;">
                <strong>Wastefull</strong> • San Jose, California
              </p>
              <p style="margin: 0; font-size: 11px; color: #211f1c; opacity: 0.5;">
                Building open scientific infrastructure for material circularity
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

      const text = `
WasteDB - Revision Requested

${submitterName ? `Hi ${submitterName},` : "Hello,"}

Your ${typeDisplay} submission has been reviewed, and we'd like to request some revisions before approval.

Reviewer Feedback:
${feedback}

Please review the feedback above and make any necessary changes. You can view and update your submission in your My Submissions dashboard at https://db.wastefull.org

Thank you for contributing to WasteDB!

---
Wastefull • San Jose, California
Building open scientific infrastructure for material circularity
    `;

      // Send email via Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "WasteDB <no-reply@wastefull.org>",
          to: [submitterEmail],
          subject: `[WasteDB] Revision Requested: ${typeDisplay}`,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error("Resend API error:", errorText);
        return c.json(
          { error: "Failed to send email", details: errorText },
          500,
        );
      }

      const result = await response.json();
      log.log("Revision request email sent successfully:", result.id);

      return c.json({ success: true, emailId: result.id });
    } catch (error) {
      log.error("Error sending revision request email:", error);
      return c.json(
        { error: "Failed to send email", details: String(error) },
        500,
      );
    }
  },
);

// Send approval email (admin only)
app.post(
  "/make-server-17cae920/email/approval",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { submitterEmail, submitterName, submissionType, contentName } =
        await c.req.json();

      if (!submitterEmail || !submissionType) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (!RESEND_API_KEY) {
        log.error("RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      // Format submission type for display
      const typeDisplay = submissionType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Submission Approved - WasteDB</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Sniglet', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #faf7f2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf7f2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1.5px solid #211f1c; border-radius: 11.464px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #c8e5c8; padding: 30px 40px; border-bottom: 1.5px solid #211f1c; text-align: center;">
              <img src="https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/uplogo_transparent-1761169051994.png" alt="WasteDB Logo" style="width: 120px; height: auto; margin-bottom: 16px;" />
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #211f1c; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px;">
                Content Review System
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px; line-height: 1;">🎉</span>
              </div>
              
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #211f1c; text-align: center;">
                Submission Approved!
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                ${submitterName ? `Hi ${submitterName},` : "Hello,"}
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                Great news! Your <strong>${typeDisplay}</strong> submission${
                  contentName ? ` <em>"${contentName}"</em>` : ""
                } has been reviewed and approved. It's now live on WasteDB!
              </p>
              
              <!-- Success Box -->
              <div style="background-color: #c8e5c8; border: 1.5px solid #211f1c; border-radius: 8px; padding: 20px; margin: 0 0 24px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #211f1c;">
                  ✅ Your contribution is now public
                </p>
              </div>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                Thank you for contributing to WasteDB! Your effort helps make our materials database more accurate and comprehensive for everyone.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="https://db.wastefull.org" style="display: inline-block; background-color: #c8e5c8; color: #211f1c; text-decoration: none; padding: 12px 32px; border: 1.5px solid #211f1c; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 3px 4px 0px -1px #000000;">
                      View WasteDB
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #211f1c; opacity: 0.7;">
                We'd love to see more contributions from you. Feel free to submit additional materials or articles any time!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf7f2; padding: 24px 40px; border-top: 1.5px solid #211f1c; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #211f1c; opacity: 0.7;">
                <strong>Wastefull, Inc.</strong> • San Jose, California
              </p>
              <p style="margin: 0; font-size: 11px; color: #211f1c; opacity: 0.5;">
                Building open scientific infrastructure for material circularity
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

      const text = `
WasteDB - Submission Approved!

${submitterName ? `Hi ${submitterName},` : "Hello,"}

Great news! Your ${typeDisplay} submission${
        contentName ? ` "${contentName}"` : ""
      } has been reviewed and approved. It's now live on WasteDB!

Thank you for contributing to WasteDB! Your effort helps make our materials database more accurate and comprehensive for everyone.

View WasteDB at https://db.wastefull.org

---
Wastefull • San Jose, California
Building open scientific infrastructure for material circularity
    `;

      // Send email via Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "WasteDB <no-reply@wastefull.org>",
          to: [submitterEmail],
          subject: `[WasteDB] Submission Approved! 🎉`,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error("Resend API error:", errorText);
        return c.json(
          { error: "Failed to send email", details: errorText },
          500,
        );
      }

      const result = await response.json();
      log.log("Approval email sent successfully:", result.id);

      return c.json({ success: true, emailId: result.id });
    } catch (error) {
      log.error("Error sending approval email:", error);
      return c.json(
        { error: "Failed to send email", details: String(error) },
        500,
      );
    }
  },
);

// Send rejection email (admin only)
app.post(
  "/make-server-17cae920/email/rejection",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { submitterEmail, submitterName, submissionType, feedback } =
        await c.req.json();

      if (!submitterEmail || !submissionType) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (!RESEND_API_KEY) {
        log.error("RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      // Format submission type for display
      const typeDisplay = submissionType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Submission Decision - WasteDB</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Sniglet', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #faf7f2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf7f2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1.5px solid #211f1c; border-radius: 11.464px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #e6beb5; padding: 30px 40px; border-bottom: 1.5px solid #211f1c; text-align: center;">
              <img src="https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/uplogo_transparent-1761169051994.png" alt="WasteDB Logo" style="width: 120px; height: auto; margin-bottom: 16px;" />
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #211f1c; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px;">
                Content Review System
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #211f1c;">
                Submission Update
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                ${submitterName ? `Hi ${submitterName},` : "Hello,"}
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                Thank you for your <strong>${typeDisplay}</strong> submission to WasteDB. After careful review, we've decided not to approve this submission at this time.
              </p>
              
              ${
                feedback
                  ? `
              <!-- Feedback Box -->
              <div style="background-color: #faf7f2; border: 1.5px solid #211f1c; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #211f1c; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px;">
                  Reviewer Feedback:
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #211f1c; white-space: pre-wrap;">
${feedback}
                </p>
              </div>
              `
                  : ""
              }
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #211f1c;">
                We appreciate your interest in contributing to WasteDB. If you'd like to submit a different contribution or have questions about this decision, please don't hesitate to reach out.
              </p>
              
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #211f1c; opacity: 0.7;">
                Thank you for helping us maintain the quality and accuracy of our materials database!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf7f2; padding: 24px 40px; border-top: 1.5px solid #211f1c; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #211f1c; opacity: 0.7;">
                <strong>Wastefull</strong> • San Jose, California
              </p>
              <p style="margin: 0; font-size: 11px; color: #211f1c; opacity: 0.5;">
                Building open scientific infrastructure for material circularity
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

      const text = `
WasteDB - Submission Update

${submitterName ? `Hi ${submitterName},` : "Hello,"}

Thank you for your ${typeDisplay} submission to WasteDB. After careful review, we've decided not to approve this submission at this time.

${
  feedback
    ? `
Reviewer Feedback:
${feedback}
`
    : ""
}

We appreciate your interest in contributing to WasteDB. If you'd like to submit a different contribution or have questions about this decision, please don't hesitate to reach out.

Thank you for helping us maintain the quality and accuracy of our materials database!

---
Wastefull • San Jose, California
Building open scientific infrastructure for material circularity
    `;

      // Send email via Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "WasteDB <no-reply@wastefull.org>",
          to: [submitterEmail],
          subject: `[WasteDB] Submission Update: ${typeDisplay}`,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error("Resend API error:", errorText);
        return c.json(
          { error: "Failed to send email", details: errorText },
          500,
        );
      }

      const result = await response.json();
      log.log("Rejection email sent successfully:", result.id);

      return c.json({ success: true, emailId: result.id });
    } catch (error) {
      log.error("Error sending rejection email:", error);
      return c.json(
        { error: "Failed to send email", details: String(error) },
        500,
      );
    }
  },
);

// Delete submission (admin only)
app.delete(
  "/make-server-17cae920/submissions/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const submission = await kv.get(`submission:${id}`);

      if (!submission) {
        return c.json({ error: "Submission not found" }, 404);
      }

      await kv.del(`submission:${id}`);
      log.log(`Submission deleted: ${id}`);

      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting submission:", error);
      return c.json(
        { error: "Failed to delete submission", details: String(error) },
        500,
      );
    }
  },
);

// ===== SOURCE LIBRARY MANAGEMENT =====
// Note: Main GET /sources route is defined earlier in the file (around line 3423)
// Only additional source routes are defined here

// Search CrossRef for academic papers by material/topic
// IMPORTANT: This route must be defined BEFORE /sources/:id to avoid route conflicts
app.get("/make-server-17cae920/sources/search", async (c) => {
  try {
    const query = c.req.query("q");
    const rows = c.req.query("rows") || "10";

    if (!query) {
      return c.json({ error: "Query parameter 'q' is required" }, 400);
    }

    // Build CrossRef API query
    // Add sustainability/waste-related terms to improve relevance
    const searchTerms = `${query} (recycling OR recyclability OR biodegradation OR composting OR waste OR sustainability OR environmental)`;

    const crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(
      searchTerms,
    )}&rows=${rows}&select=DOI,title,author,published-print,published-online,container-title,abstract,type&filter=type:journal-article`;

    const response = await fetch(crossrefUrl, {
      headers: {
        "User-Agent": `WasteDB/1.0 (mailto:${getPublicContactEmail()})`,
      },
    });

    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.message?.items || [];

    // Transform results to our format
    const results = items.map((item: any) => ({
      doi: item.DOI,
      title: item.title?.[0] || "Untitled",
      authors: (item.author || []).map((a: any) =>
        a.given && a.family
          ? `${a.given} ${a.family}`
          : a.family || a.name || "Unknown",
      ),
      year:
        item["published-print"]?.["date-parts"]?.[0]?.[0] ||
        item["published-online"]?.["date-parts"]?.[0]?.[0] ||
        null,
      journal: item["container-title"]?.[0] || null,
      abstract: item.abstract || null,
      type: item.type,
    }));

    return c.json({
      success: true,
      query,
      total: data.message?.["total-results"] || 0,
      results,
    });
  } catch (error) {
    log.error("Error searching CrossRef:", error);
    return c.json(
      {
        error: "Failed to search for sources",
        details: String(error),
      },
      500,
    );
  }
});

// Lookup DOI metadata from CrossRef
// IMPORTANT: This route must be defined BEFORE /sources/:id to avoid route conflicts
app.get("/make-server-17cae920/sources/lookup-doi", async (c) => {
  try {
    const doi = c.req.query("doi");

    if (!doi) {
      return c.json({ error: "DOI parameter is required" }, 400);
    }

    // Normalize DOI
    const normalizedDoi = doi
      .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
      .replace(/^doi:/, "")
      .trim();

    if (!normalizedDoi) {
      return c.json({ error: "Invalid DOI format" }, 400);
    }

    const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(
      normalizedDoi,
    )}`;

    const response = await fetch(crossrefUrl, {
      headers: {
        "User-Agent": `WasteDB/1.0 (mailto:${getPublicContactEmail()})`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return c.json({ error: "DOI not found", doi: normalizedDoi }, 404);
      }
      throw new Error(`CrossRef API error: ${response.status}`);
    }

    const data = await response.json();
    const item = data.message;

    return c.json({
      success: true,
      source: {
        doi: item.DOI,
        title: item.title?.[0] || "Untitled",
        authors: (item.author || []).map((a: any) =>
          a.given && a.family
            ? `${a.given} ${a.family}`
            : a.family || a.name || "Unknown",
        ),
        year:
          item["published-print"]?.["date-parts"]?.[0]?.[0] ||
          item["published-online"]?.["date-parts"]?.[0]?.[0] ||
          null,
        journal: item["container-title"]?.[0] || null,
        abstract: item.abstract || null,
        type: item.type,
        publisher: item.publisher || null,
        issn: item.ISSN?.[0] || null,
        url: item.URL || `https://doi.org/${item.DOI}`,
      },
    });
  } catch (error) {
    log.error("Error looking up DOI:", error);
    return c.json(
      {
        error: "Failed to lookup DOI",
        details: String(error),
      },
      500,
    );
  }
});

// Check Open Access status via Unpaywall API
// IMPORTANT: This route must be defined BEFORE /sources/:id to avoid route conflicts
app.get("/make-server-17cae920/sources/check-oa", async (c) => {
  try {
    const doi = c.req.query("doi");

    if (!doi) {
      return c.json({ error: "DOI parameter is required" }, 400);
    }

    // Normalize DOI (remove https://, http://, doi:, etc.)
    const normalizedDoi = doi
      .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
      .replace(/^doi:/, "")
      .trim();

    if (!normalizedDoi) {
      return c.json({ error: "Invalid DOI format" }, 400);
    }

    // Call Unpaywall API
    // Free API, no key required, just need to provide email
    const unpaywallUrl = `https://api.unpaywall.org/v2/${encodeURIComponent(
      normalizedDoi,
    )}?email=${encodeURIComponent(getPublicContactEmail())}`;

    const response = await fetch(unpaywallUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return c.json({
          is_open_access: false,
          doi: normalizedDoi,
          message: "DOI not found in Unpaywall database",
        });
      }
      throw new Error(`Unpaywall API error: ${response.status}`);
    }

    const data = await response.json();

    return c.json({
      is_open_access: data.is_oa || false,
      doi: normalizedDoi,
      oa_status: data.oa_status || null,
      best_oa_location: data.best_oa_location
        ? {
            url: data.best_oa_location.url,
            url_for_pdf: data.best_oa_location.url_for_pdf,
            version: data.best_oa_location.version,
            license: data.best_oa_location.license,
          }
        : null,
      publisher: data.publisher || null,
      journal: data.journal_name || null,
    });
  } catch (error) {
    log.error("Error checking Open Access status:", error);
    return c.json(
      {
        error: "Failed to check Open Access status",
        details: String(error),
        is_open_access: null, // Unknown status
      },
      500,
    );
  }
});

// Get single source
app.get("/make-server-17cae920/sources/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const source = await kv.get(`source:${id}`);

    if (!source) {
      return c.json({ error: "Source not found" }, 404);
    }

    return c.json({ source });
  } catch (error) {
    log.error("Error fetching source:", error);
    return c.json(
      { error: "Failed to fetch source", details: String(error) },
      500,
    );
  }
});

// Create source (admin only)
app.post(
  "/make-server-17cae920/sources",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const sourceData = await c.req.json();
      const userId = c.get("userId");

      // Validation
      if (!sourceData.title || !sourceData.type) {
        return c.json(
          { error: "Missing required fields: title and type" },
          400,
        );
      }

      // Validate type
      const validTypes = [
        "peer-reviewed",
        "government",
        "industrial",
        "ngo",
        "internal",
      ];
      if (!validTypes.includes(sourceData.type)) {
        return c.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
          400,
        );
      }

      // Validate weight if provided
      if (sourceData.weight !== undefined) {
        const weight = parseFloat(sourceData.weight);
        if (isNaN(weight) || weight < 0 || weight > 1) {
          return c.json(
            { error: "Weight must be a number between 0 and 1" },
            400,
          );
        }
      }

      const source = {
        id:
          sourceData.id ||
          `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: sourceData.title.trim(),
        authors: sourceData.authors?.trim() || undefined,
        year: sourceData.year ? parseInt(sourceData.year) : undefined,
        doi: sourceData.doi?.trim() || undefined,
        url: sourceData.url?.trim() || undefined,
        weight:
          sourceData.weight !== undefined ? parseFloat(sourceData.weight) : 1.0,
        type: sourceData.type,
        abstract: sourceData.abstract?.trim() || undefined,
        tags: Array.isArray(sourceData.tags)
          ? sourceData.tags.filter((t: any) => t && t.trim())
          : [],
        created_at: new Date().toISOString(),
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      await kv.set(`source:${source.id}`, source);
      log.log(`Source created: ${source.id} by user ${userId}`);

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "source",
        entityId: source.id,
        action: "create",
        after: source,
        req: c,
      });

      return c.json({ source });
    } catch (error) {
      log.error("Error creating source:", error);
      return c.json(
        { error: "Failed to create source", details: String(error) },
        500,
      );
    }
  },
);

// Update source (admin only)
app.put(
  "/make-server-17cae920/sources/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const updates = await c.req.json();
      const userId = c.get("userId");

      const existing = await kv.get(`source:${id}`);
      if (!existing) {
        return c.json({ error: "Source not found" }, 404);
      }

      // Validate type if being updated
      if (updates.type) {
        const validTypes = [
          "peer-reviewed",
          "government",
          "industrial",
          "ngo",
          "internal",
        ];
        if (!validTypes.includes(updates.type)) {
          return c.json(
            { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
            400,
          );
        }
      }

      // Validate weight if being updated
      if (updates.weight !== undefined) {
        const weight = parseFloat(updates.weight);
        if (isNaN(weight) || weight < 0 || weight > 1) {
          return c.json(
            { error: "Weight must be a number between 0 and 1" },
            400,
          );
        }
      }

      const updatedSource = {
        ...existing,
        title: updates.title?.trim() || existing.title,
        authors:
          updates.authors !== undefined
            ? updates.authors?.trim() || undefined
            : existing.authors,
        year:
          updates.year !== undefined
            ? updates.year
              ? parseInt(updates.year)
              : undefined
            : existing.year,
        doi:
          updates.doi !== undefined
            ? updates.doi?.trim() || undefined
            : existing.doi,
        url:
          updates.url !== undefined
            ? updates.url?.trim() || undefined
            : existing.url,
        weight:
          updates.weight !== undefined
            ? parseFloat(updates.weight)
            : existing.weight,
        type: updates.type || existing.type,
        abstract:
          updates.abstract !== undefined
            ? updates.abstract?.trim() || undefined
            : existing.abstract,
        tags:
          updates.tags !== undefined
            ? Array.isArray(updates.tags)
              ? updates.tags.filter((t: any) => t && t.trim())
              : existing.tags
            : existing.tags,
        // Open Access fields
        is_open_access:
          updates.is_open_access !== undefined
            ? updates.is_open_access
            : existing.is_open_access,
        oa_status:
          updates.oa_status !== undefined
            ? updates.oa_status
            : existing.oa_status,
        best_oa_url:
          updates.best_oa_url !== undefined
            ? updates.best_oa_url
            : existing.best_oa_url,
        manual_oa_override:
          updates.manual_oa_override !== undefined
            ? updates.manual_oa_override
            : existing.manual_oa_override,
        // PDF filename
        pdfFileName:
          updates.pdfFileName !== undefined
            ? updates.pdfFileName
            : existing.pdfFileName,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };

      await kv.set(`source:${id}`, updatedSource);
      log.log(`Source updated: ${id} by user ${userId}`);

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "source",
        entityId: id,
        action: "update",
        before: existing,
        after: updatedSource,
        req: c,
      });

      return c.json({ source: updatedSource });
    } catch (error) {
      log.error("Error updating source:", error);
      return c.json(
        { error: "Failed to update source", details: String(error) },
        500,
      );
    }
  },
);

// Batch delete ALL sources (admin only) - for cleanup
// NOTE: This route MUST come before /sources/:id to avoid :id matching "batch-delete-all"
app.delete(
  "/make-server-17cae920/sources/batch-delete-all",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const userId = c.get("userId");
      const userEmail = c.get("userEmail");

      // Get all sources
      const allSources = await kv.getByPrefix("source:");

      if (allSources.length === 0) {
        return c.json({
          success: true,
          deletedCount: 0,
          message: "No sources to delete",
        });
      }

      // Check for any sources with dependent evidence
      const sourcesWithDependents: string[] = [];
      const deletableSources: any[] = [];

      for (const source of allSources) {
        // Check indexed evidence
        const evidenceIndexKey = `evidence_index:source:${source.id}`;
        const evidenceIds = (await kv.get(evidenceIndexKey)) || [];

        if (evidenceIds.length > 0) {
          sourcesWithDependents.push(source.id);
        } else {
          deletableSources.push(source);
        }
      }

      // If some sources have dependents, warn but continue with the rest
      if (sourcesWithDependents.length > 0 && deletableSources.length === 0) {
        return c.json(
          {
            error: "All sources have dependent evidence points",
            message: `All ${sourcesWithDependents.length} sources have dependent evidence points (MIUs). Delete evidence points first.`,
            skippedSources: sourcesWithDependents,
          },
          400,
        );
      }

      // Delete all deletable sources
      let deletedCount = 0;
      const deletedIds: string[] = [];

      for (const source of deletableSources) {
        await kv.del(`source:${source.id}`);
        deletedCount++;
        deletedIds.push(source.id);
      }

      log.log(`✓ Batch deleted ${deletedCount} sources by user ${userId}`);

      // Create ONE audit log entry for the batch delete
      const auditId = `audit:${Date.now()}:${crypto.randomUUID()}`;
      const entry: AuditLogEntry = {
        id: auditId,
        timestamp: new Date().toISOString(),
        userId,
        userEmail,
        entityType: "source",
        entityId: "BATCH_DELETE",
        action: "delete",
        before: {
          deletedCount,
          deletedIds,
          skippedCount: sourcesWithDependents.length,
          skippedIds: sourcesWithDependents,
        },
        after: null,
        changes: [
          `Batch deleted ${deletedCount} sources${
            sourcesWithDependents.length > 0
              ? ` (${sourcesWithDependents.length} skipped due to dependencies)`
              : ""
          }`,
        ],
        ipAddress: getClientId(c).split(":")[0],
        userAgent: c.req.header("user-agent") || "unknown",
      };

      await kv.set(auditId, entry);
      log.log(`📝 Audit log created for batch delete: ${auditId}`);

      // Send ONE summary email notification
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        try {
          const adminEmails = getAdminNotificationEmails();
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                  .content { background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
                  .metadata { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; }
                  .metadata-item { margin: 8px 0; }
                  .label { font-weight: 600; color: #374151; }
                  .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2 style="margin: 0;">🗑️ WasteDB Bulk Delete Alert</h2>
                  </div>
                  <div class="content">
                    <p><strong>A bulk source deletion was performed:</strong></p>
                    
                    <div class="metadata">
                      <div class="metadata-item">
                        <span class="label">Sources Deleted:</span> ${deletedCount}
                      </div>
                      ${
                        sourcesWithDependents.length > 0
                          ? `
                      <div class="metadata-item">
                        <span class="label">Sources Skipped (have dependencies):</span> ${sourcesWithDependents.length}
                      </div>
                      `
                          : ""
                      }
                      <div class="metadata-item">
                        <span class="label">Performed By:</span> ${userEmail}
                      </div>
                      <div class="metadata-item">
                        <span class="label">Time:</span> ${new Date().toISOString()}
                      </div>
                    </div>
                    
                    <div class="footer">
                      <p>This is an automated notification from WasteDB.</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "WasteDB <admin@wastefull.org>",
              to: adminEmails,
              subject: `🗑️ WasteDB: Bulk Delete - ${deletedCount} sources removed`,
              html,
            }),
          });
          log.log("📧 Batch delete audit email sent");
        } catch (emailError) {
          log.error("Failed to send batch delete audit email:", emailError);
        }
      }

      return c.json({
        success: true,
        deletedCount,
        deletedIds,
        skippedCount: sourcesWithDependents.length,
        skippedIds: sourcesWithDependents,
        message:
          sourcesWithDependents.length > 0
            ? `Deleted ${deletedCount} sources. ${sourcesWithDependents.length} sources skipped (have dependent evidence).`
            : `Successfully deleted all ${deletedCount} sources.`,
      });
    } catch (error) {
      log.error("Error in batch delete sources:", error);
      return c.json(
        { error: "Failed to batch delete sources", details: String(error) },
        500,
      );
    }
  },
);

// Remove duplicate sources (admin only) - keeps first occurrence, removes exact title duplicates with no dependencies
// NOTE: This route MUST come before /sources/:id to avoid :id matching "remove-duplicates"
app.delete(
  "/make-server-17cae920/sources/remove-duplicates",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const userId = c.get("userId");
      const userEmail = c.get("userEmail");

      // Get all sources
      const allSources = await kv.getByPrefix("source:");

      if (allSources.length === 0) {
        return c.json({
          success: true,
          deletedCount: 0,
          message: "No sources to check for duplicates",
        });
      }

      // Helper function to create a normalized fingerprint of a source
      // Uses all key fields: title, authors, year, type, doi, url
      const getSourceFingerprint = (source: any): string => {
        const parts = [
          (source.title || "").toLowerCase().trim(),
          (source.authors || "").toLowerCase().trim(),
          (source.year || "").toString(),
          (source.doi || "").toLowerCase().trim(),
        ];
        return parts.join("|");
      };

      // Group sources by their fingerprint (all key fields)
      const sourcesByFingerprint: Map<string, any[]> = new Map();
      for (const source of allSources) {
        const fingerprint = getSourceFingerprint(source);
        if (!sourcesByFingerprint.has(fingerprint)) {
          sourcesByFingerprint.set(fingerprint, []);
        }
        sourcesByFingerprint.get(fingerprint)!.push(source);
      }

      // Find duplicates (groups with more than one source with identical fingerprint)
      const duplicatesToDelete: any[] = [];
      const keptSources: string[] = [];

      for (const [fingerprint, sources] of sourcesByFingerprint) {
        if (sources.length > 1) {
          // Sort by created_at to keep the oldest one, or by id if no created_at
          sources.sort((a, b) => {
            if (a.created_at && b.created_at) {
              return (
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
              );
            }
            return (a.id || "").localeCompare(b.id || "");
          });

          // Keep the first (oldest), mark rest as duplicates
          keptSources.push(sources[0].id);
          for (let i = 1; i < sources.length; i++) {
            duplicatesToDelete.push(sources[i]);
          }
        }
      }

      if (duplicatesToDelete.length === 0) {
        return c.json({
          success: true,
          deletedCount: 0,
          message: "No duplicate sources found",
        });
      }

      // Check for dependencies before deleting
      const deletableDuplicates: any[] = [];
      const skippedDuplicates: string[] = [];

      for (const source of duplicatesToDelete) {
        // Check indexed evidence
        const evidenceIndexKey = `evidence_index:source:${source.id}`;
        const evidenceIds = (await kv.get(evidenceIndexKey)) || [];

        if (evidenceIds.length > 0) {
          skippedDuplicates.push(source.id);
        } else {
          deletableDuplicates.push(source);
        }
      }

      // Delete the duplicates without dependencies
      let deletedCount = 0;
      const deletedIds: string[] = [];
      const deletedTitles: string[] = [];

      for (const source of deletableDuplicates) {
        await kv.del(`source:${source.id}`);
        deletedCount++;
        deletedIds.push(source.id);
        deletedTitles.push(source.title);
      }

      log.log(`✓ Removed ${deletedCount} duplicate sources by user ${userId}`);

      // Create ONE audit log entry for the duplicate removal
      const auditId = `audit:${Date.now()}:${crypto.randomUUID()}`;
      const entry: AuditLogEntry = {
        id: auditId,
        timestamp: new Date().toISOString(),
        userId,
        userEmail,
        entityType: "source",
        entityId: "REMOVE_DUPLICATES",
        action: "delete",
        before: {
          totalDuplicatesFound: duplicatesToDelete.length,
          deletedCount,
          deletedIds,
          skippedCount: skippedDuplicates.length,
          skippedIds: skippedDuplicates,
        },
        after: null,
        changes: [
          `Removed ${deletedCount} duplicate sources${
            skippedDuplicates.length > 0
              ? ` (${skippedDuplicates.length} skipped due to dependencies)`
              : ""
          }`,
        ],
        ipAddress: getClientId(c).split(":")[0],
        userAgent: c.req.header("user-agent") || "unknown",
      };

      await kv.set(auditId, entry);
      log.log(`📝 Audit log created for duplicate removal: ${auditId}`);

      // Send ONE summary email notification
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY && deletedCount > 0) {
        try {
          const adminEmails = getAdminNotificationEmails();
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                  .content { background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
                  .metadata { background: #fffbeb; padding: 15px; border-radius: 6px; margin: 15px 0; }
                  .metadata-item { margin: 8px 0; }
                  .label { font-weight: 600; color: #374151; }
                  .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2 style="margin: 0;">🧹 WasteDB Duplicate Removal</h2>
                  </div>
                  <div class="content">
                    <p><strong>Duplicate sources were cleaned up:</strong></p>
                    
                    <div class="metadata">
                      <div class="metadata-item">
                        <span class="label">Duplicates Found:</span> ${
                          duplicatesToDelete.length
                        }
                      </div>
                      <div class="metadata-item">
                        <span class="label">Duplicates Removed:</span> ${deletedCount}
                      </div>
                      ${
                        skippedDuplicates.length > 0
                          ? `
                      <div class="metadata-item">
                        <span class="label">Skipped (have dependencies):</span> ${skippedDuplicates.length}
                      </div>
                      `
                          : ""
                      }
                      <div class="metadata-item">
                        <span class="label">Performed By:</span> ${userEmail}
                      </div>
                      <div class="metadata-item">
                        <span class="label">Time:</span> ${new Date().toISOString()}
                      </div>
                    </div>
                    
                    <div class="footer">
                      <p>This is an automated notification from WasteDB.</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "WasteDB <admin@wastefull.org>",
              to: adminEmails,
              subject: `🧹 WasteDB: Removed ${deletedCount} duplicate sources`,
              html,
            }),
          });
          log.log("📧 Duplicate removal audit email sent");
        } catch (emailError) {
          log.error(
            "Failed to send duplicate removal audit email:",
            emailError,
          );
        }
      }

      return c.json({
        success: true,
        duplicatesFound: duplicatesToDelete.length,
        deletedCount,
        deletedIds,
        skippedCount: skippedDuplicates.length,
        skippedIds: skippedDuplicates,
        message:
          deletedCount === 0
            ? `Found ${duplicatesToDelete.length} duplicates but all have dependencies and were skipped.`
            : skippedDuplicates.length > 0
              ? `Removed ${deletedCount} duplicate sources. ${skippedDuplicates.length} skipped (have dependencies).`
              : `Successfully removed ${deletedCount} duplicate sources.`,
      });
    } catch (error) {
      log.error("Error in remove duplicate sources:", error);
      return c.json(
        { error: "Failed to remove duplicate sources", details: String(error) },
        500,
      );
    }
  },
);

// Delete source (admin only)
app.delete(
  "/make-server-17cae920/sources/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("userId");

      const source = await kv.get(`source:${id}`);
      if (!source) {
        return c.json({ error: "Source not found" }, 404);
      }

      // ===== REFERENTIAL INTEGRITY CHECK (Phase 9.1 - MIU Data Guard) =====
      // Check if any evidence points (MIUs) reference this source
      const evidenceIndexKey = `evidence_index:source:${id}`;
      const evidenceIds = (await kv.get(evidenceIndexKey)) || [];

      if (evidenceIds.length > 0) {
        console.warn(
          `⛔ Cannot delete source ${id}: ${evidenceIds.length} evidence points (MIUs) reference this source`,
        );

        // Get sample evidence points for context (max 5)
        const sampleEvidenceIds = evidenceIds.slice(0, 5);
        const sampleEvidence = [];
        for (const evidenceId of sampleEvidenceIds) {
          const ep = await kv.get(`evidence_point:${evidenceId}`);
          if (ep) {
            sampleEvidence.push({
              id: ep.id,
              material_id: ep.material_id,
              parameter: ep.parameter,
              dimension: ep.dimension,
              created_at: ep.created_at,
            });
          }
        }

        return c.json(
          {
            error: "Cannot delete source with dependent evidence points",
            message: `This source is referenced by ${evidenceIds.length} evidence point(s) (MIUs). You must delete or reassign all evidence points before deleting the source.`,
            dependentCount: evidenceIds.length,
            sampleEvidence,
            hint: "Use the Evidence Lab to review and manage evidence points for this source.",
          },
          400,
        );
      }

      // Legacy check for old evidence format (backward compatibility)
      const allEvidence = await kv.getByPrefix("evidence:");
      const legacyDependentEvidence = allEvidence.filter(
        (evidence: any) => evidence && evidence.source_id === id,
      );

      if (legacyDependentEvidence.length > 0) {
        console.warn(
          `⛔ Cannot delete source ${id}: ${legacyDependentEvidence.length} legacy evidence points reference this source`,
        );
        return c.json(
          {
            error: "Cannot delete source with dependent evidence",
            message: `This source is referenced by ${legacyDependentEvidence.length} legacy evidence point(s). Please migrate or delete them first.`,
            dependentCount: legacyDependentEvidence.length,
          },
          400,
        );
      }

      await kv.del(`source:${id}`);
      log.log(`✓ Source deleted: ${id} by user ${userId}`);

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "source",
        entityId: id,
        action: "delete",
        before: source,
        req: c,
      });

      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting source:", error);
      return c.json(
        { error: "Failed to delete source", details: String(error) },
        500,
      );
    }
  },
);

// Batch save sources (admin only) - for syncing entire library
app.post(
  "/make-server-17cae920/sources/batch",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { sources } = await c.req.json();
      const userId = c.get("userId");

      if (!Array.isArray(sources)) {
        return c.json({ error: "Sources must be an array" }, 400);
      }

      // Save each source
      const savedSources = [];
      for (const sourceData of sources) {
        if (!sourceData.title || !sourceData.type) {
          console.warn("Skipping source without title or type:", sourceData);
          continue;
        }

        const source = {
          ...sourceData,
          id:
            sourceData.id ||
            `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        };

        await kv.set(`source:${source.id}`, source);
        savedSources.push(source);
      }

      await createAuditLog({
        userId,
        userEmail: c.get("userEmail"),
        entityType: "sources_bulk",
        entityId: "batch_save",
        action: "update",
        after: {
          count: savedSources.length,
          sources_preview: savedSources
            .slice(0, 5)
            .map((s: any) => ({ id: s.id, title: s.title })),
        },
        req: c,
      });
      log.log(`Batch saved ${savedSources.length} sources by user ${userId}`);
      return c.json({
        success: true,
        count: savedSources.length,
        sources: savedSources,
      });
    } catch (error) {
      log.error("Error batch saving sources:", error);
      return c.json(
        { error: "Failed to batch save sources", details: String(error) },
        500,
      );
    }
  },
);

// ==================== PUBLIC RESEARCH API ====================
// Public API for researchers and external applications
// No authentication required - read-only access to published data

// API v1: Get all materials with filtering, pagination, and sorting
app.get("/make-server-17cae920/api/v1/materials", async (c) => {
  try {
    // Parse query parameters
    const category = c.req.query("category"); // Filter by category
    const sortBy = c.req.query("sort") || "name"; // Sort field: name, recyclability, compostability, reusability
    const order = c.req.query("order") || "asc"; // Sort order: asc, desc
    const limit = parseInt(c.req.query("limit") || "100"); // Max 100 results per request
    const offset = parseInt(c.req.query("offset") || "0");
    const search = c.req.query("search"); // Search in name/description

    // Get all materials
    let materials = await kv.getByPrefix("material:");

    if (!materials) {
      materials = [];
    }

    // Filter by category if specified
    if (category) {
      materials = materials.filter(
        (m: any) => m.category?.toLowerCase() === category.toLowerCase(),
      );
    }

    // Filter by search term if specified
    if (search) {
      const searchLower = search.toLowerCase();
      materials = materials.filter(
        (m: any) =>
          m.name?.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower),
      );
    }

    // Sort materials
    materials.sort((a: any, b: any) => {
      let aVal, bVal;

      switch (sortBy) {
        case "recyclability":
          aVal = a.recyclability || 0;
          bVal = b.recyclability || 0;
          break;
        case "compostability":
          aVal = a.compostability || 0;
          bVal = b.compostability || 0;
          break;
        case "reusability":
          aVal = a.reusability || 0;
          bVal = b.reusability || 0;
          break;
        case "name":
        default:
          aVal = a.name || "";
          bVal = b.name || "";
          break;
      }

      if (typeof aVal === "string") {
        return order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }
    });

    // Apply pagination
    const total = materials.length;
    const paginatedMaterials = materials.slice(offset, offset + limit);

    // Return response with metadata
    return c.json({
      data: paginatedMaterials,
      meta: {
        total,
        limit,
        offset,
        count: paginatedMaterials.length,
        filters: {
          category: category || null,
          search: search || null,
          sortBy,
          order,
        },
      },
      links: {
        self: `/api/v1/materials?limit=${limit}&offset=${offset}`,
        next:
          offset + limit < total
            ? `/api/v1/materials?limit=${limit}&offset=${offset + limit}`
            : null,
        prev:
          offset > 0
            ? `/api/v1/materials?limit=${limit}&offset=${Math.max(
                0,
                offset - limit,
              )}`
            : null,
      },
    });
  } catch (error) {
    log.error("API error fetching materials:", error);
    return c.json(
      { error: "Failed to fetch materials", details: String(error) },
      500,
    );
  }
});

// API v1: Get single material by ID
app.get("/make-server-17cae920/api/v1/materials/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const material = await kv.get(`material:${id}`);

    if (!material) {
      return c.json({ error: "Material not found" }, 404);
    }

    return c.json({ data: material });
  } catch (error) {
    log.error("API error fetching material:", error);
    return c.json(
      { error: "Failed to fetch material", details: String(error) },
      500,
    );
  }
});

// API v1: Get aggregate statistics
app.get("/make-server-17cae920/api/v1/stats", async (c) => {
  try {
    const materials = (await kv.getByPrefix("material:")) || [];

    // Calculate statistics
    const stats = {
      totalMaterials: materials.length,
      categories: {} as Record<string, number>,
      averages: {
        recyclability: 0,
        compostability: 0,
        reusability: 0,
      },
      ranges: {
        recyclability: { min: 100, max: 0 },
        compostability: { min: 100, max: 0 },
        reusability: { min: 100, max: 0 },
      },
    };

    let totalRecyclability = 0;
    let totalCompostability = 0;
    let totalReusability = 0;

    materials.forEach((material: any) => {
      // Count categories
      const category = material.category || "Unknown";
      stats.categories[category] = (stats.categories[category] || 0) + 1;

      // Sum for averages
      const r = material.recyclability || 0;
      const c = material.compostability || 0;
      const u = material.reusability || 0;

      totalRecyclability += r;
      totalCompostability += c;
      totalReusability += u;

      // Track ranges
      stats.ranges.recyclability.min = Math.min(
        stats.ranges.recyclability.min,
        r,
      );
      stats.ranges.recyclability.max = Math.max(
        stats.ranges.recyclability.max,
        r,
      );
      stats.ranges.compostability.min = Math.min(
        stats.ranges.compostability.min,
        c,
      );
      stats.ranges.compostability.max = Math.max(
        stats.ranges.compostability.max,
        c,
      );
      stats.ranges.reusability.min = Math.min(stats.ranges.reusability.min, u);
      stats.ranges.reusability.max = Math.max(stats.ranges.reusability.max, u);
    });

    // Calculate averages
    if (materials.length > 0) {
      stats.averages.recyclability = Math.round(
        totalRecyclability / materials.length,
      );
      stats.averages.compostability = Math.round(
        totalCompostability / materials.length,
      );
      stats.averages.reusability = Math.round(
        totalReusability / materials.length,
      );
    }

    return c.json({ data: stats });
  } catch (error) {
    log.error("API error calculating stats:", error);
    return c.json(
      { error: "Failed to calculate statistics", details: String(error) },
      500,
    );
  }
});

// API v1: Get list of categories
app.get("/make-server-17cae920/api/v1/categories", async (c) => {
  try {
    const categories = [
      "Plastics",
      "Metals",
      "Glass",
      "Paper & Cardboard",
      "Fabrics & Textiles",
      "Electronics & Batteries",
      "Building Materials",
      "Organic/Natural Waste",
      "Elements",
    ];

    return c.json({ data: categories });
  } catch (error) {
    log.error("API error fetching categories:", error);
    return c.json(
      { error: "Failed to fetch categories", details: String(error) },
      500,
    );
  }
});

// API v1: Get methodology information
app.get("/make-server-17cae920/api/v1/methodology", async (c) => {
  try {
    const whitepapers = (await kv.getByPrefix("whitepaper:")) || [];

    const methodologyInfo = {
      version: "1.0",
      description:
        "WasteDB uses a multi-dimensional scoring system to evaluate material sustainability across three key metrics: recyclability, compostability, and reusability.",
      metrics: [
        {
          name: "Recyclability",
          description:
            "Measures how effectively a material can be recycled, considering yield, degradation, contamination tolerance, infrastructure maturity, and energy demand.",
          scale: "0-100",
          parameters: [
            "Y (Yield)",
            "D (Degradation)",
            "C (Contamination)",
            "M (Maturity)",
            "E (Energy)",
          ],
        },
        {
          name: "Compostability",
          description:
            "Evaluates the biodegradation potential of materials in composting conditions.",
          scale: "0-100",
          parameters: [
            "B (Biodegradation)",
            "N (Nutrient balance)",
            "P (Phytotoxicity)",
            "T (Time)",
            "M (Maturity)",
          ],
        },
        {
          name: "Reusability",
          description:
            "Assesses how well a material maintains functionality through multiple use cycles.",
          scale: "0-100",
          parameters: [
            "L (Lifetime)",
            "V (Versatility)",
            "I (Integrity)",
            "M (Maturity)",
          ],
        },
      ],
      whitepapers: whitepapers.map((wp: any) => ({
        slug: wp.slug,
        title: wp.title,
        link: `/api/v1/whitepapers/${wp.slug}`,
      })),
      lastUpdated: new Date().toISOString(),
    };

    return c.json({ data: methodologyInfo });
  } catch (error) {
    log.error("API error fetching methodology:", error);
    return c.json(
      {
        error: "Failed to fetch methodology information",
        details: String(error),
      },
      500,
    );
  }
});

// API v1: Get whitepapers
app.get("/make-server-17cae920/api/v1/whitepapers", async (c) => {
  try {
    const whitepapers = (await kv.getByPrefix("whitepaper:")) || [];

    const whitepapersData = whitepapers.map((wp: any) => ({
      slug: wp.slug,
      title: wp.title,
      updatedAt: wp.updatedAt,
      link: `/api/v1/whitepapers/${wp.slug}`,
    }));

    return c.json({ data: whitepapersData });
  } catch (error) {
    log.error("API error fetching whitepapers:", error);
    return c.json(
      { error: "Failed to fetch whitepapers", details: String(error) },
      500,
    );
  }
});

// API v1: Get single whitepaper
app.get("/make-server-17cae920/api/v1/whitepapers/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const whitepaper = await kv.get(`whitepaper:${slug}`);

    if (!whitepaper) {
      return c.json({ error: "Whitepaper not found" }, 404);
    }

    return c.json({ data: whitepaper });
  } catch (error) {
    log.error("API error fetching whitepaper:", error);
    return c.json(
      { error: "Failed to fetch whitepaper", details: String(error) },
      500,
    );
  }
});

// API v1: Get articles for a material
app.get("/make-server-17cae920/api/v1/articles", async (c) => {
  try {
    const materialId = c.req.query("material_id");
    const category = c.req.query("category"); // compostability, recyclability, or reusability

    let articles = (await kv.getByPrefix("article:")) || [];

    // Filter by status (only published articles)
    articles = articles.filter((a: any) => a.status === "published");

    // Filter by material if specified
    if (materialId) {
      articles = articles.filter((a: any) => a.material_id === materialId);
    }

    // Filter by category if specified
    if (category) {
      articles = articles.filter(
        (a: any) => a.category?.toLowerCase() === category.toLowerCase(),
      );
    }

    return c.json({ data: articles });
  } catch (error) {
    log.error("API error fetching articles:", error);
    return c.json(
      { error: "Failed to fetch articles", details: String(error) },
      500,
    );
  }
});

// ==================== PHASE 9.0: LEGAL & COMPLIANCE ====================

// Submit DMCA takedown request
app.post(
  "/make-server-17cae920/legal/takedown",
  rateLimit("TAKEDOWN", { allowAdminBypass: true }),
  async (c) => {
    try {
      const requestData = await c.req.json();

      // DEBUG: Log the received data to see what fields are present
      log.log(
        "🔍 Takedown request received. Fields present:",
        Object.keys(requestData),
      );
      log.log("📧 Email:", requestData.email);
      log.log("👤 Full Name:", requestData.fullName);
      log.log(" Work Title:", requestData.workTitle);
      log.log(
        " Content Description length:",
        requestData.contentDescription?.length || 0,
      );

      // Check if the submitter is an admin (to bypass rate limits for testing)
      let isAdmin = false;
      const authHeader = c.req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          );
          const {
            data: { user },
          } = await supabase.auth.getUser(token);
          if (user) {
            const userRole = await getUserRole(user.id);
            if (userRole === "admin") {
              isAdmin = true;
              log.log("✓ Admin user bypassing takedown anti-abuse checks");
            }
          }
        } catch (error) {
          // Ignore auth errors - treat as non-admin
          log.log("Admin check error in takedown handler:", error);
        }
      }

      // ===== ANTI-ABUSE CHECKS =====

      // 1. Honeypot check (anti-bot)
      if (!checkHoneypot(requestData.honeypot)) {
        log.log("⚠️ Takedown honeypot triggered - likely bot attempt");
        // Delay response to slow down bots
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return c.json({ error: "Invalid request" }, 400);
      }

      // 2. Validate required fields
      const requiredFields = [
        "fullName",
        "email",
        "workTitle",
        "relationship",
        "wastedbURL",
        "contentDescription",
        "signature",
      ];

      for (const field of requiredFields) {
        if (!requestData[field]?.trim()) {
          return c.json({ error: `${field} is required` }, 400);
        }
      }

      // 3. Validate email format
      const emailValidation = validateEmail(requestData.email);
      if (!emailValidation.valid) {
        return c.json({ error: emailValidation.error || "Invalid email" }, 400);
      }

      // 4. Check for email-based throttling (max 1 request per email per 7 days) - SKIP FOR ADMINS
      const emailKey = `takedown_email_tracking:${requestData.email
        .toLowerCase()
        .trim()}`;
      if (!isAdmin) {
        const recentRequestByEmail = await kv.get(emailKey);
        if (recentRequestByEmail) {
          const timeSinceLastRequest =
            Date.now() - new Date(recentRequestByEmail.submittedAt).getTime();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (timeSinceLastRequest < sevenDays) {
            const hoursRemaining = Math.ceil(
              (sevenDays - timeSinceLastRequest) / (60 * 60 * 1000),
            );
            log.log(`⚠️ Takedown rate limit by email: ${requestData.email}`);
            return c.json(
              {
                error: `You have already submitted a takedown request recently. Please wait ${hoursRemaining} hours before submitting another request, or contact legal@wastefull.org for urgent matters.`,
              },
              429,
            );
          }
        }
      }

      // 5. Content quality checks
      if (requestData.contentDescription.trim().length < 50) {
        return c.json(
          {
            error:
              "Content description must be at least 50 characters. Please provide detailed information about the alleged infringement.",
          },
          400,
        );
      }

      if (requestData.workTitle.trim().length < 3) {
        return c.json({ error: "Work title is too short" }, 400);
      }

      // 6. Check for duplicate content (similarity detection) - SKIP FOR ADMINS
      if (!isAdmin) {
        const allTakedowns = await kv.getByPrefix("takedown:TR-");
        let isDuplicate = false;
        let duplicateRequestID = "";

        for (const existing of allTakedowns) {
          // Check if same email + same URL within 30 days
          if (
            existing.email.toLowerCase() === requestData.email.toLowerCase() &&
            existing.wastedbURL === requestData.wastedbURL
          ) {
            const daysSinceSubmission =
              (Date.now() - new Date(existing.submittedAt).getTime()) /
              (24 * 60 * 60 * 1000);
            if (daysSinceSubmission < 30) {
              isDuplicate = true;
              duplicateRequestID = existing.requestID;
              break;
            }
          }
        }

        if (isDuplicate) {
          log.log(`⚠️ Duplicate takedown detected: ${duplicateRequestID}`);
          return c.json(
            {
              error: `You have already submitted a takedown request for this URL (Request ID: ${duplicateRequestID}). Please check the status of your existing request or contact legal@wastefull.org.`,
            },
            409,
          );
        }
      }

      // 7. Validate legal statements
      if (
        !requestData.goodFaithBelief ||
        !requestData.accuracyStatement ||
        !requestData.misrepresentationWarning
      ) {
        return c.json(
          { error: "All legal statements must be acknowledged" },
          400,
        );
      }

      // 8. Validate signature matches name
      if (
        requestData.signature.toLowerCase().trim() !==
        requestData.fullName.toLowerCase().trim()
      ) {
        return c.json({ error: "Signature must match full name exactly" }, 400);
      }

      // 9. Detect suspicious patterns (auto-flag for admin review)
      const suspiciousFlags: string[] = [];

      // Very short name (likely fake)
      if (requestData.fullName.trim().length < 5) {
        suspiciousFlags.push("name_too_short");
      }

      // Generic/suspicious email domains
      const suspiciousDomains = [
        "guerrillamail",
        "tempmail",
        "10minutemail",
        "throwaway",
        "mailinator",
      ];
      if (
        suspiciousDomains.some((domain) =>
          requestData.email.toLowerCase().includes(domain),
        )
      ) {
        suspiciousFlags.push("suspicious_email_domain");
      }

      // Excessive caps in description (spam indicator)
      const capsRatio =
        (requestData.contentDescription.match(/[A-Z]/g) || []).length /
        requestData.contentDescription.length;
      if (capsRatio > 0.5) {
        suspiciousFlags.push("excessive_caps");
      }

      // Generic work titles
      const genericTitles = ["test", "sample", "example", "asdf", "qwerty"];
      if (
        genericTitles.some((word) =>
          requestData.workTitle.toLowerCase().includes(word),
        )
      ) {
        suspiciousFlags.push("generic_work_title");
      }

      // Log suspicious activity
      if (suspiciousFlags.length > 0) {
        log.log(
          `⚠️ Suspicious takedown request detected. Flags: ${suspiciousFlags.join(
            ", ",
          )}`,
        );
      }

      // Generate unique request ID
      const requestID = `TR-${Date.now()}-${crypto.randomUUID().split("-")[0]}`;

      // Get client IP for tracking
      const clientIp =
        c.req.header("x-forwarded-for")?.split(",")[0].trim() || "unknown";

      // Store takedown request with abuse detection metadata
      const takedownRecord = {
        ...requestData,
        requestID,
        status: "pending",
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        resolution: null,
        reviewNotes: null,
        // Anti-abuse metadata
        suspiciousFlags: suspiciousFlags.length > 0 ? suspiciousFlags : null,
        flaggedForReview: suspiciousFlags.length >= 2, // Auto-flag if 2+ red flags
        submitterIp: clientIp,
      };

      // DEBUG: Log what's being saved
      log.log(
        "💾 Saving takedown record. Fields:",
        Object.keys(takedownRecord),
      );
      log.log("💾 Record fullName:", takedownRecord.fullName);
      log.log("💾 Record workTitle:", takedownRecord.workTitle);

      await kv.set(`takedown:${requestID}`, takedownRecord);

      // Track email submissions (for rate limiting)
      await kv.set(emailKey, {
        requestID,
        email: requestData.email,
        submittedAt: new Date().toISOString(),
      });

      log.log(
        `Takedown request submitted: ${requestID} by ${requestData.email}${
          suspiciousFlags.length > 0
            ? " [FLAGGED: " + suspiciousFlags.join(", ") + "]"
            : ""
        }`,
      );

      // Track email sending status for debugging
      const emailStatus = {
        complianceEmailSent: false,
        complianceEmailError: null,
        requesterEmailSent: false,
        requesterEmailError: null,
      };

      // Send notification email to compliance team
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (RESEND_API_KEY) {
        log.log(
          `📧 RESEND_API_KEY found, attempting to send emails for ${requestID}...`,
        );
        try {
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #dc2626; }
    .label { font-weight: 600; color: #6b7280; margin-bottom: 4px; }
    .value { color: #111827; }
    .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
    .badge { display: inline-block; padding: 4px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚨 New DMCA Takedown Request</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Request ID: ${requestID}</p>
    </div>
    
    <div class="content">
      ${
        suspiciousFlags.length > 0
          ? `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 8px 0; color: #92400e;">⚠️ ABUSE DETECTION ALERT</h4>
        <div style="font-size: 14px; color: #78350f;">
          This request has been flagged for potential abuse. Flags detected:
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            ${suspiciousFlags
              .map((flag) => `<li>${flag.replace(/_/g, " ")}</li>`)
              .join("")}
          </ul>
          <strong>Action required:</strong> ${
            suspiciousFlags.length >= 2
              ? "Manual review recommended before processing."
              : "Proceed with caution."
          }
        </div>
      </div>
      `
          : ""
      }
      
      <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 2px solid #dc2626;">
        <div class="label">⏰ Response Deadline</div>
        <div class="value" style="font-size: 18px; font-weight: 700; color: #dc2626;">
          72 Hours from Submission
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          Submitted: ${new Date(requestData.signatureDate).toLocaleString(
            "en-US",
            { dateStyle: "full", timeStyle: "short" },
          )}
        </div>
      </div>

      <div class="section">
        <h3 style="margin-top: 0; color: #dc2626;">Contact Information</h3>
        <div style="margin-bottom: 8px;">
          <div class="label">Submitter IP</div>
          <div class="value"><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${clientIp}</code></div>
        </div>
        <div style="margin-bottom: 8px;">
          <div class="label">Name</div>
          <div class="value">${requestData.fullName}</div>
        </div>
        <div style="margin-bottom: 8px;">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${requestData.email}">${
            requestData.email
          }</a></div>
        </div>
        ${
          requestData.phone
            ? `
        <div style="margin-bottom: 8px;">
          <div class="label">Phone</div>
          <div class="value">${requestData.phone}</div>
        </div>
        `
            : ""
        }
        ${
          requestData.organization
            ? `
        <div style="margin-bottom: 8px;">
          <div class="label">Organization</div>
          <div class="value">${requestData.organization}</div>
        </div>
        `
            : ""
        }
      </div>

      <div class="section">
        <h3 style="margin-top: 0; color: #dc2626;">Copyrighted Work</h3>
        <div style="margin-bottom: 8px;">
          <div class="label">Title</div>
          <div class="value">${requestData.workTitle}</div>
        </div>
        <div style="margin-bottom: 8px;">
          <div class="label">Relationship to Copyright</div>
          <div class="value">${requestData.relationship}</div>
        </div>
        ${
          requestData.workDOI
            ? `
        <div style="margin-bottom: 8px;">
          <div class="label">DOI/URL</div>
          <div class="value"><a href="${requestData.workDOI}">${requestData.workDOI}</a></div>
        </div>
        `
            : ""
        }
        ${
          requestData.copyrightRegistration
            ? `
        <div style="margin-bottom: 8px;">
          <div class="label">Copyright Registration #</div>
          <div class="value">${requestData.copyrightRegistration}</div>
        </div>
        `
            : ""
        }
      </div>

      <div class="section">
        <h3 style="margin-top: 0; color: #dc2626;">Infringing Content</h3>
        <div style="margin-bottom: 8px;">
          <div class="label">WasteDB URL</div>
          <div class="value"><a href="${requestData.wastedbURL}">${
            requestData.wastedbURL
          }</a></div>
        </div>
        ${
          requestData.miuID
            ? `
        <div style="margin-bottom: 8px;">
          <div class="label">MIU ID</div>
          <div class="value"><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${requestData.miuID}</code></div>
        </div>
        `
            : ""
        }
        <div style="margin-bottom: 8px;">
          <div class="label">Description of Infringing Content</div>
          <div class="value" style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border-radius: 4px; margin-top: 4px;">${
            requestData.contentDescription
          }</div>
        </div>
      </div>

      <div class="section">
        <h3 style="margin-top: 0; color: #dc2626;">Legal Attestations</h3>
        <div style="margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #059669; font-weight: 700;">✓</span>
            <span>Good faith belief statement acknowledged</span>
          </div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #059669; font-weight: 700;">✓</span>
            <span>Accuracy statement acknowledged</span>
          </div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #059669; font-weight: 700;">✓</span>
            <span>§ 512(f) misrepresentation warning acknowledged</span>
          </div>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div class="label">Electronic Signature</div>
          <div class="value" style="font-style: italic;">${
            requestData.signature
          }</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            Signed on: ${new Date(requestData.signatureDate).toLocaleDateString(
              "en-US",
              { dateStyle: "long" },
            )}
          </div>
        </div>
      </div>

      <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin-top: 15px;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af;">📋 Next Steps</h4>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li>Review request for completeness and validity</li>
          <li>Access admin panel to update status</li>
          <li>Respond within 72 hours (legally required)</li>
          <li>Document decision and notify submitter</li>
        </ol>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">
        This is an automated notification from WasteDB Legal & Compliance System.<br>
        Request ID: ${requestID} • Submitted: ${new Date().toISOString()}
      </p>
    </div>
  </div>
</body>
</html>
        `;

          const emailText = `
NEW DMCA TAKEDOWN REQUEST
Request ID: ${requestID}
${
  suspiciousFlags.length > 0
    ? `
⚠️ ABUSE DETECTION ALERT
This request has been flagged for potential abuse.
Flags: ${suspiciousFlags.join(", ")}
Action: ${
        suspiciousFlags.length >= 2
          ? "Manual review recommended"
          : "Proceed with caution"
      }
`
    : ""
}
⏰ RESPONSE DEADLINE: 72 Hours from Submission
Submitted: ${new Date(requestData.signatureDate).toLocaleString()}

CONTACT INFORMATION
Submitter IP: ${clientIp}
Name: ${requestData.fullName}
Email: ${requestData.email}
${requestData.phone ? `Phone: ${requestData.phone}` : ""}
${requestData.organization ? `Organization: ${requestData.organization}` : ""}

COPYRIGHTED WORK
Title: ${requestData.workTitle}
Relationship: ${requestData.relationship}
${requestData.workDOI ? `DOI/URL: ${requestData.workDOI}` : ""}
${
  requestData.copyrightRegistration
    ? `Registration #: ${requestData.copyrightRegistration}`
    : ""
}

INFRINGING CONTENT
WasteDB URL: ${requestData.wastedbURL}
${requestData.miuID ? `MIU ID: ${requestData.miuID}` : ""}
Description:
${requestData.contentDescription}

LEGAL ATTESTATIONS
✓ Good faith belief statement acknowledged
✓ Accuracy statement acknowledged  
✓ § 512(f) misrepresentation warning acknowledged

Electronic Signature: ${requestData.signature}
Signed on: ${new Date(requestData.signatureDate).toLocaleDateString()}

NEXT STEPS
1. Review request for completeness and validity
2. Access admin panel to update status
3. Respond within 72 hours (legally required)
4. Document decision and notify submitter

---
WasteDB Legal & Compliance System
Request ID: ${requestID}
        `;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "WasteDB Legal <legal@wastefull.org>",
              to: ["compliance@wastefull.org"],
              reply_to: requestData.email,
              subject: `🚨 New DMCA Takedown Request ${requestID}`,
              html: emailHtml,
              text: emailText,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            log.error(
              "❌ Failed to send compliance notification email:",
              errorText,
            );
            log.error(
              "Response status:",
              emailResponse.status,
              emailResponse.statusText,
            );
            emailStatus.complianceEmailError = `${emailResponse.status}: ${errorText}`;
            // Don't fail the request if email fails - just log it
          } else {
            const emailResult = await emailResponse.json();
            log.log(
              `✅ Compliance notification email sent for ${requestID} (Resend ID: ${emailResult.id})`,
            );
            emailStatus.complianceEmailSent = true;
          }
        } catch (emailError) {
          log.error(
            "❌ Error sending compliance notification email:",
            emailError,
          );
          log.error("Full error:", JSON.stringify(emailError, null, 2));
          emailStatus.complianceEmailError = String(emailError);
          // Don't fail the request if email fails - just log it
        }

        // Send confirmation email to requester
        try {
          const appUrl = Deno.env.get("APP_URL") || "https://db.wastefull.org";
          const trackingUrl = `${appUrl}/takedown/track/${requestID}`;

          const requesterEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
    .content { margin: 20px 0; }
    .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Copyright Takedown Request Received</h2>
    </div>
    <div class="content">
      <p>Thank you for submitting a copyright takedown request to WasteDB.</p>
      
      <div class="info-box">
        <p><strong>Request ID:</strong> ${requestID}</p>
        <p><strong>Status:</strong> Pending Review</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString("en-US", {
          dateStyle: "full",
          timeStyle: "short",
        })}</p>
      </div>
      
      <p>Your request is being reviewed by our compliance team. You will receive an email notification when the status is updated.</p>
      
      <p><a href="${trackingUrl}">Track Your Request</a></p>
      
      <p>If you have any questions, please forward this email to <a href="mailto:compliance@wastefull.org">compliance@wastefull.org</a>.</p>
    </div>
    <div class="footer">
      <p>Wastefull • San Jose, California<br>
      Building open scientific infrastructure for material circularity</p>
    </div>
  </div>
</body>
</html>
        `;

          const requesterEmailText = `
Copyright Takedown Request Received

Thank you for submitting a copyright takedown request to WasteDB.

Request ID: ${requestID}
Status: Pending Review
Submitted: ${new Date().toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "short",
          })}

Your request is being reviewed by our compliance team. You will receive an email notification when the status is updated.

Track Your Request: ${trackingUrl}

If you have any questions, please forward this email to compliance@wastefull.org.

---
Wastefull • San Jose, California
Building open scientific infrastructure for material circularity
        `;

          const requesterEmailResponse = await fetch(
            "https://api.resend.com/emails",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "WasteDB <compliance@wastefull.org>",
                to: [requestData.email],
                subject: `Takedown Request Received: ${requestID}`,
                html: requesterEmailHtml,
                text: requesterEmailText,
              }),
            },
          );

          if (!requesterEmailResponse.ok) {
            const errorText = await requesterEmailResponse.text();
            log.error(
              "❌ Failed to send requester confirmation email:",
              errorText,
            );
            log.error(
              "Response status:",
              requesterEmailResponse.status,
              requesterEmailResponse.statusText,
            );
            emailStatus.requesterEmailError = `${requesterEmailResponse.status}: ${errorText}`;
          } else {
            log.log(
              `✅ Confirmation email sent to requester ${requestData.email} for ${requestID}`,
            );
            emailStatus.requesterEmailSent = true;
          }
        } catch (requesterEmailError) {
          log.error(
            "❌ Error sending requester confirmation email:",
            requesterEmailError,
          );
          log.error(
            "Full error:",
            JSON.stringify(requesterEmailError, null, 2),
          );
          emailStatus.requesterEmailError = String(requesterEmailError);
        }
      } else {
        console.warn(
          "⚠️ RESEND_API_KEY not configured - no emails will be sent",
        );
        emailStatus.complianceEmailError = "RESEND_API_KEY not configured";
        emailStatus.requesterEmailError = "RESEND_API_KEY not configured";
      }

      log.log(` Email Status for ${requestID}:`, emailStatus);

      return c.json({
        success: true,
        requestID,
        message: "Takedown request submitted successfully.",
        emailStatus: emailStatus,
      });
    } catch (error) {
      log.error("Error submitting takedown request:", error);
      return c.json(
        { error: "Failed to submit takedown request", details: String(error) },
        500,
      );
    }
  },
);

// DEBUG: Get raw takedown request data (admin only)
app.get(
  "/make-server-17cae920/admin/takedown-raw/:requestId",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const requestId = c.req.param("requestId");
      const request = await kv.get(`takedown:${requestId}`);

      if (!request) {
        return c.json({ error: "Request not found" }, 404);
      }

      // Return raw data with field analysis
      return c.json({
        rawData: request,
        fieldCount: Object.keys(request).length,
        fields: Object.keys(request),
        hasFullName: !!request.fullName,
        hasWorkTitle: !!request.workTitle,
        hasContentDescription: !!request.contentDescription,
      });
    } catch (error) {
      log.error("Error fetching raw takedown data:", error);
      return c.json(
        { error: "Failed to fetch raw data", details: String(error) },
        500,
      );
    }
  },
);

// Get takedown request status (public - no auth required, but needs request ID)
app.get("/make-server-17cae920/legal/takedown/status/:requestId", async (c) => {
  try {
    const requestId = c.req.param("requestId");
    const request = await kv.get(`takedown:${requestId}`);

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Return public-safe data (hide sensitive admin notes)
    return c.json({
      requestID: request.requestID,
      status: request.status,
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      resolution: request.resolution,
      // Don't expose: reviewNotes, internal admin comments
    });
  } catch (error) {
    log.error("Error fetching takedown status:", error);
    return c.json(
      { error: "Failed to fetch status", details: String(error) },
      500,
    );
  }
});

// Admin: List all takedown requests
app.get(
  "/make-server-17cae920/admin/takedown",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const requests = await kv.getByPrefix("takedown:");

      // Filter to only include actual takedown requests (not email tracking records)
      const actualRequests =
        requests?.filter(
          (item: any) => item.requestID && item.requestID.startsWith("TR-"),
        ) || [];

      // Sort by submission date (newest first)
      const sorted = actualRequests.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );

      return c.json({ requests: sorted });
    } catch (error) {
      log.error("Error listing takedown requests:", error);
      return c.json(
        { error: "Failed to list requests", details: String(error) },
        500,
      );
    }
  },
);

// Admin: Update takedown request status
app.patch(
  "/make-server-17cae920/admin/takedown/:requestId",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const requestId = c.req.param("requestId");
      const updates = await c.req.json();

      const existing = await kv.get(`takedown:${requestId}`);
      if (!existing) {
        return c.json({ error: "Request not found" }, 404);
      }

      // Get userId from context (set by verifyAuth middleware)
      const userId = c.get("userId") || c.get("userEmail") || "admin";

      const updated = {
        ...existing,
        ...updates,
        reviewedAt: new Date().toISOString(),
        reviewedBy: userId,
      };

      await kv.set(`takedown:${requestId}`, updated);

      log.log(
        `Takedown request ${requestId} updated by admin ${userId}: status=${updates.status}`,
      );

      // Send email notification to requester
      try {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

        if (RESEND_API_KEY && updated.requesterEmail) {
          const appUrl = Deno.env.get("APP_URL") || "https://db.wastefull.org";
          const trackingUrl = `${appUrl}/takedown/track/${requestId}`;

          // Format status for display
          const statusDisplay =
            updated.status.charAt(0).toUpperCase() + updated.status.slice(1);

          // Build resolution info
          let resolutionInfo = "";
          if (updated.resolutionType) {
            const resolutionMap = {
              full_removal: "Full Removal",
              partial_redaction: "Partial Redaction",
              attribution_correction: "Attribution Correction",
              no_action: "No Action Required",
            };
            resolutionInfo = `\nResolution: ${
              resolutionMap[updated.resolutionType] || updated.resolutionType
            }`;
          }

          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
    .content { margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Copyright Takedown Request Update</h2>
    </div>
    <div class="content">
      <p>Your copyright takedown request has been updated.</p>
      
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Status:</strong> ${statusDisplay}${resolutionInfo}</p>
      
      <p><a href="${trackingUrl}">Check Status</a></p>
      
      <p>If you have any follow-up questions, please forward this email to <a href="mailto:compliance@wastefull.org">compliance@wastefull.org</a>.</p>
    </div>
    <div class="footer">
      <p>Wastefull • San Jose, California<br>
      Building open scientific infrastructure for material circularity</p>
    </div>
  </div>
</body>
</html>
        `;

          const emailText = `
Copyright Takedown Request Update

Your copyright takedown request has been updated.

Request ID: ${requestId}
Status: ${statusDisplay}${resolutionInfo}

Check Status: ${trackingUrl}

If you have any follow-up questions, please forward this email to compliance@wastefull.org.

---
Wastefull • San Jose, California
Building open scientific infrastructure for material circularity
        `;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "WasteDB <compliance@wastefull.org>",
              to: [updated.requesterEmail],
              subject: `Takedown Request Update: ${requestId}`,
              html: emailHtml,
              text: emailText,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            log.error("Failed to send update email:", errorText);
            // Don't fail the request if email fails
          } else {
            log.log(
              `Update email sent to ${updated.requesterEmail} for request ${requestId}`,
            );
          }
        }
      } catch (emailError) {
        log.error("Error sending update email:", emailError);
        // Don't fail the request if email fails
      }

      return c.json({ success: true, request: updated });
    } catch (error) {
      log.error("Error updating takedown request:", error);
      return c.json(
        { error: "Failed to update request", details: String(error) },
        500,
      );
    }
  },
);

// ==================== TRANSFORM GOVERNANCE ROUTES ====================

// Get all transform definitions
app.get("/make-server-17cae920/transforms", async (c) => {
  try {
    return c.json(TRANSFORMS_DATA);
  } catch (error) {
    log.error("Error loading transforms:", error);
    return c.json(
      { error: "Failed to load transforms", details: String(error) },
      500,
    );
  }
});

// List all recompute jobs (admin only) - MUST come before /transforms/:parameter
app.get(
  "/make-server-17cae920/transforms/recompute",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const jobs = await kv.getByPrefix("recompute_job:");

      // Sort by creation date (newest first)
      const sorted =
        jobs?.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ) || [];

      return c.json({ jobs: sorted });
    } catch (error) {
      log.error("Error listing recompute jobs:", error);
      return c.json(
        { error: "Failed to list jobs", details: String(error) },
        500,
      );
    }
  },
);

// Get recompute job status - MUST come before /transforms/:parameter
app.get(
  "/make-server-17cae920/transforms/recompute/:jobId",
  verifyAuth,
  async (c) => {
    try {
      const jobId = c.req.param("jobId");
      const job = await kv.get(`recompute_job:${jobId}`);

      if (!job) {
        return c.json({ error: "Recompute job not found" }, 404);
      }

      return c.json(job);
    } catch (error) {
      log.error("Error fetching recompute job:", error);
      return c.json(
        { error: "Failed to fetch job status", details: String(error) },
        500,
      );
    }
  },
);

// Get transform definition for specific parameter
app.get("/make-server-17cae920/transforms/:parameter", async (c) => {
  try {
    const parameter = c.req.param("parameter");
    const transform = TRANSFORMS_DATA.transforms.find(
      (t: any) => t.parameter === parameter,
    );

    if (!transform) {
      return c.json(
        { error: `Transform not found for parameter: ${parameter}` },
        404,
      );
    }

    return c.json(transform);
  } catch (error) {
    log.error("Error loading transform:", error);
    return c.json(
      { error: "Failed to load transform", details: String(error) },
      500,
    );
  }
});

// Create recompute job (admin only)
app.post(
  "/make-server-17cae920/transforms/recompute",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { parameter, newTransformVersion, reason } = await c.req.json();

      if (!parameter || !newTransformVersion) {
        return c.json(
          { error: "Missing required fields: parameter, newTransformVersion" },
          400,
        );
      }

      // Load current transform definition
      const oldTransform = TRANSFORMS_DATA.transforms.find(
        (t: any) => t.parameter === parameter,
      );
      if (!oldTransform) {
        return c.json(
          { error: `Transform not found for parameter: ${parameter}` },
          404,
        );
      }

      // Generate job ID
      const jobId = `RJ-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      // Create recompute job record
      const job = {
        id: jobId,
        parameter,
        oldTransformId: oldTransform.id,
        oldTransformVersion: oldTransform.version,
        newTransformVersion,
        reason: reason || "Manual recompute triggered",
        status: "pending",
        createdAt: new Date().toISOString(),
        createdBy: c.get("userId"),
        completedAt: null,
        affectedMiusCount: 0,
        errorMessage: null,
      };

      // Store job in KV
      await kv.set(`recompute_job:${jobId}`, job);

      log.log(`Recompute job created: ${jobId} for parameter ${parameter}`);
      log.log(
        `Transform version change: ${oldTransform.version} → ${newTransformVersion}`,
      );

      // TODO: In Phase 9.2, this will trigger actual MIU reprocessing
      // For now, just log the intent
      log.log(
        `⚠️ Recompute job ${jobId} created but not executed (no MIUs exist yet)`,
      );

      return c.json({
        success: true,
        jobId,
        message:
          "Recompute job created. Execution will begin when MIUs are available.",
        estimatedDuration: "N/A (no MIUs yet)",
      });
    } catch (error) {
      log.error("Error creating recompute job:", error);
      return c.json(
        { error: "Failed to create recompute job", details: String(error) },
        500,
      );
    }
  },
);

// ==================== ONTOLOGY ENDPOINTS ====================

// Initialize ontologies (admin only) - Seeds KV store with ontology data
app.post(
  "/make-server-17cae920/ontologies/initialize",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { type } = await c.req.json();

      if (!type || !["units", "context", "all"].includes(type)) {
        return c.json(
          { error: "Invalid type. Must be: units, context, or all" },
          400,
        );
      }

      const UNITS_ONTOLOGY = {
        version: "1.0",
        effective_date: "2025-11-17",
        description:
          "Canonical units and conversion rules for all WasteDB parameters",
        parameters: {
          Y: {
            name: "Yield",
            canonical_unit: "ratio",
            allowed_units: ["%", "ratio", "kg/kg"],
            conversions: {
              "%": {
                to_canonical: "value / 100",
                description: "Convert percentage to ratio",
              },
              ratio: {
                to_canonical: "value",
                description: "Identity conversion (already canonical)",
              },
              "kg/kg": {
                to_canonical: "value",
                description: "Mass ratio is equivalent to dimensionless ratio",
              },
            },
            validation: {
              min: 0,
              max: 1,
              description: "Yield must be between 0 and 1 (0-100%)",
            },
          },
          D: {
            name: "Degradation Rate",
            canonical_unit: "ratio",
            allowed_units: ["%", "ratio", "fraction"],
            conversions: {
              "%": {
                to_canonical: "value / 100",
                description: "Convert percentage to ratio",
              },
              ratio: {
                to_canonical: "value",
                description: "Identity conversion",
              },
              fraction: {
                to_canonical: "value",
                description: "Fraction is equivalent to ratio",
              },
            },
            validation: {
              min: 0,
              max: 1,
              description: "Degradation rate must be between 0 and 1",
            },
          },
          C: {
            name: "Contamination Level",
            canonical_unit: "ppm",
            allowed_units: ["ppm", "mg/kg", "%", "ppb"],
            conversions: {
              ppm: {
                to_canonical: "value",
                description: "Identity conversion",
              },
              "mg/kg": {
                to_canonical: "value",
                description: "mg/kg is equivalent to ppm",
              },
              "%": {
                to_canonical: "value * 10000",
                description: "Convert percentage to ppm (1% = 10,000 ppm)",
              },
              ppb: {
                to_canonical: "value / 1000",
                description: "Convert parts per billion to ppm",
              },
            },
            validation: {
              min: 0,
              description: "Contamination level must be non-negative",
            },
          },
          M: {
            name: "Market Demand Index",
            canonical_unit: "index",
            allowed_units: ["index", "score", "unitless"],
            conversions: {
              index: {
                to_canonical: "value",
                description: "Identity conversion",
              },
              score: {
                to_canonical: "value",
                description: "Score is equivalent to index",
              },
              unitless: {
                to_canonical: "value",
                description: "Dimensionless value",
              },
            },
            validation: {
              min: 0,
              max: 100,
              description: "Market demand index typically 0-100",
            },
          },
          E: {
            name: "Energy Intensity",
            canonical_unit: "MJ/kg",
            allowed_units: ["MJ/kg", "kWh/kg", "GJ/ton", "BTU/lb"],
            conversions: {
              "MJ/kg": {
                to_canonical: "value",
                description: "Identity conversion",
              },
              "kWh/kg": {
                to_canonical: "value * 3.6",
                description: "Convert kWh to MJ (1 kWh = 3.6 MJ)",
              },
              "GJ/ton": {
                to_canonical: "value",
                description: "GJ/ton is equivalent to MJ/kg",
              },
              "BTU/lb": {
                to_canonical: "value * 0.002326",
                description: "Convert BTU/lb to MJ/kg",
              },
            },
            validation: {
              min: 0,
              description: "Energy intensity must be non-negative",
            },
          },
          B: {
            name: "Biodegradability",
            canonical_unit: "ratio",
            allowed_units: ["%", "ratio", "fraction"],
            conversions: {
              "%": {
                to_canonical: "value / 100",
                description: "Convert percentage to ratio",
              },
              ratio: {
                to_canonical: "value",
                description: "Identity conversion",
              },
              fraction: {
                to_canonical: "value",
                description: "Fraction is equivalent to ratio",
              },
            },
            validation: {
              min: 0,
              max: 1,
              description: "Biodegradability must be between 0 and 1",
            },
          },
          N: {
            name: "Nutrient Value",
            canonical_unit: "kg/kg",
            allowed_units: ["kg/kg", "%", "g/kg", "ratio"],
            conversions: {
              "kg/kg": {
                to_canonical: "value",
                description: "Identity conversion",
              },
              "%": {
                to_canonical: "value / 100",
                description: "Convert percentage to mass ratio",
              },
              "g/kg": {
                to_canonical: "value / 1000",
                description: "Convert g/kg to kg/kg",
              },
              ratio: { to_canonical: "value", description: "Mass ratio" },
            },
            validation: {
              min: 0,
              max: 1,
              description: "Nutrient value must be between 0 and 1",
            },
          },
          T: {
            name: "Toxicity Level",
            canonical_unit: "LD50_mg/kg",
            allowed_units: ["LD50_mg/kg", "mg/kg", "g/kg"],
            conversions: {
              "LD50_mg/kg": {
                to_canonical: "value",
                description: "Identity conversion (LD50 in mg/kg)",
              },
              "mg/kg": {
                to_canonical: "value",
                description: "Concentration in mg/kg",
              },
              "g/kg": {
                to_canonical: "value * 1000",
                description: "Convert g/kg to mg/kg",
              },
            },
            validation: {
              min: 0,
              description:
                "Toxicity must be non-negative (lower LD50 = more toxic)",
            },
          },
          H: {
            name: "Health Impact Score",
            canonical_unit: "DALY",
            allowed_units: ["DALY", "QALY", "score"],
            conversions: {
              DALY: {
                to_canonical: "value",
                description: "Disability-Adjusted Life Years",
              },
              QALY: {
                to_canonical: "value * -1",
                description: "Quality-Adjusted Life Years (inverted scale)",
              },
              score: {
                to_canonical: "value",
                description: "Generic health impact score",
              },
            },
            validation: {
              min: 0,
              description: "Health impact must be non-negative",
            },
          },
          L: {
            name: "Labor Intensity",
            canonical_unit: "hours/kg",
            allowed_units: [
              "hours/kg",
              "hours/ton",
              "FTE/year",
              "person-hours/kg",
            ],
            conversions: {
              "hours/kg": {
                to_canonical: "value",
                description: "Identity conversion",
              },
              "hours/ton": {
                to_canonical: "value / 1000",
                description: "Convert hours/ton to hours/kg",
              },
              "FTE/year": {
                to_canonical: "value",
                description: "Full-time equivalent per year",
              },
              "person-hours/kg": {
                to_canonical: "value",
                description: "Equivalent to hours/kg",
              },
            },
            validation: {
              min: 0,
              description: "Labor intensity must be non-negative",
            },
          },
          R: {
            name: "Resource Recovery Rate",
            canonical_unit: "ratio",
            allowed_units: ["%", "ratio", "kg/kg"],
            conversions: {
              "%": {
                to_canonical: "value / 100",
                description: "Convert percentage to ratio",
              },
              ratio: {
                to_canonical: "value",
                description: "Identity conversion",
              },
              "kg/kg": { to_canonical: "value", description: "Mass ratio" },
            },
            validation: {
              min: 0,
              max: 1,
              description: "Resource recovery rate must be between 0 and 1",
            },
          },
          U: {
            name: "Utility Retention",
            canonical_unit: "ratio",
            allowed_units: ["%", "ratio", "score"],
            conversions: {
              "%": {
                to_canonical: "value / 100",
                description: "Convert percentage to ratio",
              },
              ratio: {
                to_canonical: "value",
                description: "Identity conversion",
              },
              score: {
                to_canonical: "value / 100",
                description: "Convert 0-100 score to 0-1 ratio",
              },
            },
            validation: {
              min: 0,
              max: 1,
              description: "Utility retention must be between 0 and 1",
            },
          },
          C_RU: {
            name: "Reusability Contamination",
            canonical_unit: "ppm",
            allowed_units: ["ppm", "mg/kg", "%", "ppb"],
            conversions: {
              ppm: {
                to_canonical: "value",
                description: "Identity conversion",
              },
              "mg/kg": {
                to_canonical: "value",
                description: "mg/kg is equivalent to ppm",
              },
              "%": {
                to_canonical: "value * 10000",
                description: "Convert percentage to ppm (1% = 10,000 ppm)",
              },
              ppb: {
                to_canonical: "value / 1000",
                description: "Convert parts per billion to ppm",
              },
            },
            validation: {
              min: 0,
              description: "Contamination must be non-negative",
            },
          },
        },
      };

      const CONTEXT_ONTOLOGY = {
        version: "1.0",
        effective_date: "2025-11-17",
        description: "Controlled vocabularies for evidence context fields",
        vocabularies: {
          process: {
            description: "Type of waste processing method",
            values: [
              {
                code: "mechanical",
                label: "Mechanical Separation",
                description:
                  "Physical separation methods (sorting, shredding, magnetic separation)",
              },
              {
                code: "chemical",
                label: "Chemical Processing",
                description:
                  "Chemical breakdown or transformation (hydrolysis, solvolysis)",
              },
              {
                code: "thermal",
                label: "Thermal Treatment",
                description:
                  "Heat-based processing (pyrolysis, gasification, incineration)",
              },
              {
                code: "biological",
                label: "Biological Treatment",
                description:
                  "Microbial degradation (composting, anaerobic digestion)",
              },
              {
                code: "manual",
                label: "Manual Sorting",
                description: "Hand-sorting and manual separation",
              },
              {
                code: "automated",
                label: "Automated Processing",
                description: "Robotic or AI-driven sorting and processing",
              },
              {
                code: "hybrid",
                label: "Hybrid Process",
                description: "Combination of multiple processing methods",
              },
              {
                code: "other",
                label: "Other",
                description: "Process not listed above",
              },
            ],
          },
          stream: {
            description: "Waste stream origin and composition",
            values: [
              {
                code: "post-consumer",
                label: "Post-Consumer",
                description: "Waste from end-of-life consumer products",
              },
              {
                code: "post-industrial",
                label: "Post-Industrial",
                description: "Manufacturing scrap and industrial waste",
              },
              {
                code: "pre-consumer",
                label: "Pre-Consumer",
                description: "Production waste before reaching consumers",
              },
              {
                code: "mixed",
                label: "Mixed Municipal Solid Waste",
                description: "Unseparated municipal waste stream",
              },
              {
                code: "source-separated",
                label: "Source-Separated",
                description: "Pre-sorted at point of generation",
              },
              {
                code: "commercial",
                label: "Commercial Waste",
                description: "Waste from commercial establishments",
              },
              {
                code: "institutional",
                label: "Institutional Waste",
                description:
                  "Waste from schools, hospitals, government facilities",
              },
              {
                code: "construction",
                label: "Construction & Demolition",
                description: "Building and demolition waste",
              },
              {
                code: "agricultural",
                label: "Agricultural Waste",
                description: "Crop residues and farming waste",
              },
              {
                code: "other",
                label: "Other",
                description: "Stream not listed above",
              },
            ],
          },
          region: {
            description: "Geographic region where data was collected",
            values: [
              {
                code: "north-america",
                label: "North America",
                description: "United States, Canada, Mexico",
              },
              {
                code: "europe",
                label: "Europe",
                description: "European Union and surrounding countries",
              },
              {
                code: "asia-pacific",
                label: "Asia-Pacific",
                description:
                  "East Asia, Southeast Asia, Australia, New Zealand",
              },
              {
                code: "latin-america",
                label: "Latin America",
                description: "Central and South America",
              },
              {
                code: "middle-east",
                label: "Middle East",
                description: "Middle Eastern countries",
              },
              {
                code: "africa",
                label: "Africa",
                description: "African continent",
              },
              {
                code: "global",
                label: "Global",
                description: "Multi-region or worldwide study",
              },
              {
                code: "other",
                label: "Other",
                description: "Region not listed above",
              },
            ],
          },
          scale: {
            description: "Scale of operation or study",
            values: [
              {
                code: "lab",
                label: "Laboratory Scale",
                description: "Controlled laboratory experiments (<1 kg/day)",
              },
              {
                code: "bench",
                label: "Bench Scale",
                description: "Small-scale laboratory experiments (1-10 kg/day)",
              },
              {
                code: "pilot",
                label: "Pilot Scale",
                description: "Demonstration facilities (10-1000 kg/day)",
              },
              {
                code: "commercial",
                label: "Commercial Scale",
                description: "Full-scale industrial operations (>1 ton/day)",
              },
              {
                code: "municipal",
                label: "Municipal Scale",
                description: "City or county-level facilities (100+ tons/day)",
              },
              {
                code: "theoretical",
                label: "Theoretical/Modeled",
                description: "Computational models or theoretical predictions",
              },
              {
                code: "other",
                label: "Other",
                description: "Scale not listed above",
              },
            ],
          },
          confidence_level: {
            description: "Curator's confidence in the evidence quality",
            values: [
              {
                code: "high",
                label: "High Confidence",
                description: "Peer-reviewed, replicated, well-documented",
              },
              {
                code: "medium",
                label: "Medium Confidence",
                description:
                  "Published but limited replication or documentation",
              },
              {
                code: "low",
                label: "Low Confidence",
                description: "Preliminary, anecdotal, or poorly documented",
              },
            ],
          },
          source_type: {
            description: "Type of evidence source",
            values: [
              {
                code: "whitepaper",
                label: "WasteDB Whitepaper",
                description: "Internal WasteDB methodology document",
              },
              {
                code: "article",
                label: "WasteDB Article",
                description: "Internal WasteDB knowledge base article",
              },
              {
                code: "external",
                label: "External Source",
                description: "Third-party peer-reviewed publication",
              },
              {
                code: "manual",
                label: "Manual Entry",
                description: "Curator-entered data without source document",
              },
            ],
          },
        },
      };

      let initialized: string[] = [];

      if (type === "units" || type === "all") {
        await kv.set("ontology:units:v1.0", UNITS_ONTOLOGY);
        await kv.set("ontology:units:current", "v1.0");
        initialized.push("units");
      }

      if (type === "context" || type === "all") {
        await kv.set("ontology:context:v1.0", CONTEXT_ONTOLOGY);
        await kv.set("ontology:context:current", "v1.0");
        initialized.push("context");
      }

      log.log(`Ontologies initialized: ${initialized.join(", ")}`);

      return c.json({
        success: true,
        initialized,
        message: `Successfully initialized ${initialized.join(
          " and ",
        )} ontolog${initialized.length > 1 ? "ies" : "y"}`,
      });
    } catch (error) {
      log.error("Error initializing ontologies:", error);
      return c.json(
        { error: "Failed to initialize ontologies", details: String(error) },
        500,
      );
    }
  },
);

// Get units ontology
app.get("/make-server-17cae920/ontologies/units", async (c) => {
  try {
    const currentVersion = await kv.get("ontology:units:current");

    if (!currentVersion) {
      return c.json(
        {
          error:
            "Units ontology not initialized. Admin must call POST /ontologies/initialize first.",
        },
        404,
      );
    }

    const unitsOntology = await kv.get(`ontology:units:${currentVersion}`);

    if (!unitsOntology) {
      return c.json(
        {
          error: `Units ontology version ${currentVersion} not found`,
        },
        404,
      );
    }

    return c.json(unitsOntology);
  } catch (error) {
    log.error("Error fetching units ontology:", error);
    return c.json(
      { error: "Failed to fetch units ontology", details: String(error) },
      500,
    );
  }
});

// Get context ontology
app.get("/make-server-17cae920/ontologies/context", async (c) => {
  try {
    const currentVersion = await kv.get("ontology:context:current");

    if (!currentVersion) {
      return c.json(
        {
          error:
            "Context ontology not initialized. Admin must call POST /ontologies/initialize first.",
        },
        404,
      );
    }

    const contextOntology = await kv.get(`ontology:context:${currentVersion}`);

    if (!contextOntology) {
      return c.json(
        {
          error: `Context ontology version ${currentVersion} not found`,
        },
        404,
      );
    }

    return c.json(contextOntology);
  } catch (error) {
    log.error("Error fetching context ontology:", error);
    return c.json(
      { error: "Failed to fetch context ontology", details: String(error) },
      500,
    );
  }
});

// ==================== NOTIFICATION ROUTES ====================

// Create a notification (protected - admin or system only)
app.post("/make-server-17cae920/notifications", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, type, content_id, content_type, message } = body;

    // Validate required fields
    if (!user_id || !type || !message) {
      return c.json(
        { error: "Missing required fields: user_id, type, message" },
        400,
      );
    }

    // Validate notification type
    const validTypes = [
      "submission_approved",
      "feedback_received",
      "new_review_item",
      "article_published",
      "content_flagged",
    ];
    if (!validTypes.includes(type)) {
      return c.json(
        {
          error: `Invalid notification type. Must be one of: ${validTypes.join(
            ", ",
          )}`,
        },
        400,
      );
    }

    // Generate unique notification ID
    const notificationId = `notif_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const notification = {
      id: notificationId,
      user_id,
      type,
      content_id: content_id || null,
      content_type: content_type || null,
      message,
      read: false,
      created_at: new Date().toISOString(),
    };

    // Store notification in KV with user-specific key for efficient retrieval
    await kv.set(`notification:${user_id}:${notificationId}`, notification);

    log.log(`✓ Notification created: ${notificationId} for user ${user_id}`);

    return c.json({ notification }, 201);
  } catch (error) {
    log.error("Error creating notification:", error);
    return c.json(
      { error: "Failed to create notification", details: String(error) },
      500,
    );
  }
});

// Get notifications for a specific user (protected)
app.get(
  "/make-server-17cae920/notifications/:userId",
  verifyAuth,
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const requestingUserId = c.get("userId");

      // Users can only view their own notifications (or 'admin' special case)
      // Admin users can view admin notifications
      if (userId !== "admin" && userId !== requestingUserId) {
        const userRole = await getUserRole(requestingUserId);
        if (userRole !== "admin") {
          return c.json(
            { error: "Unauthorized: You can only view your own notifications" },
            403,
          );
        }
      }

      // Get all notifications for this user
      const notifications =
        (await kv.getByPrefix(`notification:${userId}:`)) || [];

      // Sort by creation date (newest first)
      const sorted = notifications.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      log.log(`✓ Retrieved ${sorted.length} notifications for user ${userId}`);

      return c.json({ notifications: sorted });
    } catch (error) {
      log.error("Error fetching notifications:", error);
      return c.json(
        { error: "Failed to fetch notifications", details: String(error) },
        500,
      );
    }
  },
);

// Mark a notification as read (protected)
app.put(
  "/make-server-17cae920/notifications/:notificationId/read",
  verifyAuth,
  async (c) => {
    try {
      const notificationId = c.req.param("notificationId");
      const requestingUserId = c.get("userId");

      // Find the notification by trying the requesting user's key first,
      // then scanning all user_profiles ids (Postgres replaces user_role: KV scan).
      const _notifSupabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      let notification = null;
      let notificationKey = null;

      // Try the requesting user's own notification first (fast path)
      const ownKey = `notification:${requestingUserId}:${notificationId}`;
      const ownFound = await kv.get(ownKey);
      if (ownFound) {
        notification = ownFound;
        notificationKey = ownKey;
      }

      // Slow path: scan all user IDs from Postgres
      if (!notification) {
        const { data: allProfiles } = await _notifSupabase
          .from("user_profiles")
          .select("id");
        for (const { id: userId } of allProfiles ?? []) {
          const key = `notification:${userId}:${notificationId}`;
          const found = await kv.get(key);
          if (found) {
            notification = found;
            notificationKey = key;
            break;
          }
        }
      }

      // Also check admin notifications
      if (!notification) {
        const adminKey = `notification:admin:${notificationId}`;
        const found = await kv.get(adminKey);
        if (found) {
          notification = found;
          notificationKey = adminKey;
        }
      }

      if (!notification) {
        return c.json({ error: "Notification not found" }, 404);
      }

      // Verify user owns this notification
      if (notification.user_id !== requestingUserId) {
        const userRole = await getUserRole(requestingUserId);
        if (userRole !== "admin" && notification.user_id !== "admin") {
          return c.json(
            {
              error:
                "Unauthorized: You can only mark your own notifications as read",
            },
            403,
          );
        }
      }

      // Update notification
      const updated = {
        ...notification,
        read: true,
      };

      await kv.set(notificationKey, updated);

      log.log(
        `✓ Notification ${notificationId} marked as read by user ${requestingUserId}`,
      );

      return c.json({ notification: updated });
    } catch (error) {
      log.error("Error marking notification as read:", error);
      return c.json(
        {
          error: "Failed to mark notification as read",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Mark all notifications as read for a user (protected)
app.put(
  "/make-server-17cae920/notifications/:userId/read-all",
  verifyAuth,
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const requestingUserId = c.get("userId");

      log.log(
        `📧 Mark all as read - userId: "${userId}", requestingUserId: "${requestingUserId}"`,
      );

      // Check authorization
      // Case 1: Users can mark their own notifications as read
      if (userId === requestingUserId) {
        log.log(`✅ User marking their own notifications as read`);
        // Continue to mark notifications as read
      } else {
        // Case 2: Admins can mark admin notifications as read
        const userRole = await getUserRole(requestingUserId);
        log.log(
          `📧 Authorization check - userRole: "${userRole}" (type: ${typeof userRole}), userId: "${userId}"`,
        );

        const isAdmin = userRole === "admin";
        const isAccessingAdminNotifications = userId === "admin";

        log.log(
          `📧 isAdmin: ${isAdmin}, isAccessingAdminNotifications: ${isAccessingAdminNotifications}`,
        );

        if (!isAdmin || !isAccessingAdminNotifications) {
          log.log(
            `❌ Authorization failed - User must be admin to access admin notifications`,
          );
          return c.json(
            {
              error:
                "Unauthorized: You can only mark your own notifications as read",
            },
            403,
          );
        }

        log.log(`✅ Admin marking admin notifications as read`);
      }

      // Migration-safe bulk update:
      // - New format: notification:{userId}:{notificationId}
      // - Legacy format: notification:{notificationId}
      // We scan entries to preserve the original key used for each record.
      const allEntries = (await kv.getEntriesByPrefix("notification:")) || [];
      const userEntries = allEntries.filter(
        (entry: any) => entry?.value?.user_id === userId,
      );

      // Mark all as read using each entry's real key
      const updatePromises = userEntries.map(async (entry: any) => {
        const updated = {
          ...entry.value,
          read: true,
        };
        await kv.set(entry.key, updated);
        return updated;
      });

      await Promise.all(updatePromises);

      log.log(
        `✓ Marked ${userEntries.length} notifications as read for user ${userId}`,
      );

      return c.json({
        success: true,
        updated_count: userEntries.length,
        message: `Marked ${userEntries.length} notifications as read`,
      });
    } catch (error) {
      log.error("Error marking all notifications as read:", error);
      return c.json(
        {
          error: "Failed to mark all notifications as read",
          details: String(error),
        },
        500,
      );
    }
  },
);

// ==================== EVIDENCE & AGGREGATION ENDPOINTS (Phase 9.1 EXTENSIONS) ====================
// Phase 9.1 ADDS new endpoints to Phase 9.0 base
// Phase 9.0 evidence CRUD (POST/GET/PUT/DELETE) remains below as the BASE

log.log("📦 Registering Phase 9.1 endpoints...");

// TEST ROUTE - Delete after confirming it works
app.get("/make-server-17cae920/test-phase91", (c) => {
  return c.json({ message: "Phase 9.1 route registration is working!" });
});

// Phase 9.1 NEW Endpoints - implemented inline (modules in /utils/ not accessible from Edge Functions)
// Validation workflow (NEW in 9.1)
app.patch(
  "/make-server-17cae920/evidence/:id/validation",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    log.log("🔍 PATCH /evidence/:id/validation handler called");
    try {
      const id = c.req.param("id");
      const userId = c.get("userId");
      const body = await c.req.json();
      const { status } = body;

      if (!["pending", "validated", "flagged", "duplicate"].includes(status)) {
        return c.json({ error: "Invalid validation status" }, 400);
      }

      // Get evidence point
      const evidencePoint = (await kv.get(`evidence:${id}`)) as any;
      if (!evidencePoint) {
        return c.json({ error: "Evidence point not found" }, 404);
      }

      // Update validation status
      const updatedEvidence = {
        ...evidencePoint,
        validation_status: status,
        validated_by: userId,
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await kv.set(`evidence:${id}`, updatedEvidence);

      // Audit log
      await createAuditLog({
        userId,
        userEmail: c.get("userEmail"),
        entityType: "evidence",
        entityId: id,
        action: "update_validation",
        before: evidencePoint,
        after: updatedEvidence,
        req: c,
      });

      return c.json({ success: true, evidence: updatedEvidence });
    } catch (error) {
      log.error("Error updating evidence validation:", error);
      return c.json(
        { error: "Failed to update validation status", details: String(error) },
        500,
      );
    }
  },
);

// Parameter Aggregations (NEW in 9.1)
app.post(
  "/make-server-17cae920/aggregations",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    log.log("🔍 POST /aggregations handler called");
    try {
      const userId = c.get("userId");
      const body = await c.req.json();
      const {
        material_id,
        parameter,
        calculated_value,
        methodology,
        miu_count,
        miu_ids,
        quality_threshold,
        min_sources,
      } = body;

      // Validate required fields
      if (!material_id || !parameter) {
        return c.json(
          { error: "Missing required fields: material_id, parameter" },
          400,
        );
      }

      let finalValue = calculated_value;
      let finalMiuIds = miu_ids || [];
      let finalMiuCount = miu_count || 0;

      // If calculated_value not provided but miu_ids are, compute weighted mean
      if (calculated_value === undefined && miu_ids && miu_ids.length > 0) {
        log.log(`Computing aggregation from ${miu_ids.length} MIUs`);

        // Get all evidence points
        const evidencePoints = await Promise.all(
          miu_ids.map((id: string) => kv.get(`evidence:${id}`)),
        );

        // Filter valid evidence with values (use transformed_value if available, else raw_value)
        const validEvidence = evidencePoints.filter((e: any) => {
          if (!e) return false;
          const value =
            e.transformed_value !== null ? e.transformed_value : e.raw_value;
          return value !== null && value !== undefined;
        });

        if (validEvidence.length === 0) {
          return c.json(
            { error: "No valid evidence points found for aggregation" },
            400,
          );
        }

        // Simple mean for now (can be enhanced with weights later)
        const sum = validEvidence.reduce((acc: number, e: any) => {
          const value =
            e.transformed_value !== null ? e.transformed_value : e.raw_value;
          return acc + value;
        }, 0);
        finalValue = sum / validEvidence.length;
        finalMiuCount = validEvidence.length;

        log.log(`Computed value: ${finalValue} from ${finalMiuCount} MIUs`);
      } else if (calculated_value === undefined) {
        return c.json(
          { error: "Must provide either calculated_value or miu_ids" },
          400,
        );
      }

      // Create aggregation
      const aggregationId = `aggregation_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const aggregation = {
        id: aggregationId,
        material_id,
        parameter,
        calculated_value: finalValue,
        methodology: methodology || "weighted_mean",
        miu_count: finalMiuCount,
        miu_ids: finalMiuIds,
        calculated_by: userId,
        calculated_at: new Date().toISOString(),
        is_current: true,
      };

      await kv.set(`aggregation:${aggregationId}`, aggregation);
      await kv.set(
        `aggregation_current:${material_id}:${parameter}`,
        aggregationId,
      );

      // Audit log
      await createAuditLog({
        userId,
        userEmail: c.get("userEmail"),
        entityType: "aggregation",
        entityId: aggregationId,
        action: "create",
        after: aggregation,
        req: c,
      });

      return c.json({ success: true, aggregation }, 201);
    } catch (error) {
      log.error("Error creating aggregation:", error);
      return c.json(
        { error: "Failed to create aggregation", details: String(error) },
        400,
      );
    }
  },
);
// IMPORTANT: Specific routes must come BEFORE generic :id routes
// Otherwise /aggregations/material/X gets caught by /aggregations/:id

app.get(
  "/make-server-17cae920/aggregations/material/:materialId/stats",
  rateLimit("API"),
  async (c) => {
    log.log("🔍 GET /aggregations/material/:materialId/stats handler called");
    try {
      const materialId = c.req.param("materialId");

      // Get all current aggregations for this material
      const currentRefs = await kv.getByPrefix(
        `aggregation_current:${materialId}:`,
      );

      if (!currentRefs || currentRefs.length === 0) {
        return c.json({
          stats: {
            material_id: materialId,
            total_parameters: 0,
            parameters: [],
          },
        });
      }

      // currentRefs contains aggregation IDs, fetch the actual aggregations
      const aggregationPromises = currentRefs.map((aggregationId: string) =>
        kv.get(`aggregation:${aggregationId}`),
      );
      const aggregations = (await Promise.all(aggregationPromises)).filter(
        (a) => a !== null,
      );

      // Calculate stats from the aggregation objects themselves
      const stats = {
        material_id: materialId,
        total_parameters: aggregations.length,
        parameters: aggregations.map((agg: any) => agg.parameter),
      };

      return c.json({ stats });
    } catch (error) {
      log.error("Error fetching aggregation stats:", error);
      return c.json(
        { error: "Failed to fetch aggregation stats", details: String(error) },
        500,
      );
    }
  },
);

app.get(
  "/make-server-17cae920/aggregations/material/:materialId/history",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const materialId = c.req.param("materialId");
      const parameter = c.req.query("parameter");
      if (!parameter) {
        return c.json(
          { error: "Missing required query parameter: parameter" },
          400,
        );
      }

      // Get all aggregations for this material+parameter (historical)
      const allAggregations = await kv.getByPrefix(`aggregation:`);
      const history = allAggregations
        ? allAggregations
            .filter(
              (agg: any) =>
                agg.material_id === materialId && agg.parameter === parameter,
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.calculated_at).getTime() -
                new Date(a.calculated_at).getTime(),
            )
        : [];

      return c.json({ history, count: history.length });
    } catch (error) {
      log.error("Error fetching aggregation history:", error);
      return c.json(
        {
          error: "Failed to fetch aggregation history",
          details: String(error),
        },
        500,
      );
    }
  },
);

app.get(
  "/make-server-17cae920/aggregations/material/:materialId",
  rateLimit("API"),
  async (c) => {
    log.log("🔍 GET /aggregations/material/:materialId handler called");
    try {
      const materialId = c.req.param("materialId");
      const parameter = c.req.query("parameter");

      // Get current aggregations for this material
      const prefix = parameter
        ? `aggregation_current:${materialId}:${parameter}`
        : `aggregation_current:${materialId}:`;

      const currentRefs = await kv.getByPrefix(prefix);

      if (!currentRefs || currentRefs.length === 0) {
        return c.json({ aggregations: [], count: 0 });
      }

      // Fetch actual aggregation objects
      // currentRefs contains aggregation IDs directly (kv.getByPrefix returns values, not key-value pairs)
      const aggregationPromises = currentRefs.map(
        async (aggregationId: string) => {
          return await kv.get(`aggregation:${aggregationId}`);
        },
      );

      const aggregations = (await Promise.all(aggregationPromises)).filter(
        (a) => a !== null,
      );

      return c.json({ aggregations, count: aggregations.length });
    } catch (error) {
      log.error("Error fetching aggregations:", error);
      return c.json(
        { error: "Failed to fetch aggregations", details: String(error) },
        500,
      );
    }
  },
);

app.get(
  "/make-server-17cae920/aggregations/:id",
  rateLimit("API"),
  async (c) => {
    log.log("🔍 GET /aggregations/:id handler called");
    try {
      const id = c.req.param("id");
      const aggregation = await kv.get(`aggregation:${id}`);
      if (!aggregation) {
        return c.json({ error: "Aggregation not found" }, 404);
      }
      return c.json({ aggregation });
    } catch (error) {
      log.error("Error fetching aggregation:", error);
      return c.json(
        { error: "Failed to fetch aggregation", details: String(error) },
        500,
      );
    }
  },
);

// Data Guards (NEW in 9.1)
app.get(
  "/make-server-17cae920/sources/:sourceRef/can-delete",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    log.log("🔍 GET /sources/:sourceRef/can-delete handler called");
    try {
      const sourceRef = c.req.param("sourceRef");

      // Check if any evidence points reference this source
      const evidenceRefs = await kv.getByPrefix(
        `evidence_by_source:${sourceRef}:`,
      );
      const evidenceCount = evidenceRefs ? evidenceRefs.length : 0;
      const evidenceIds = evidenceRefs
        ? evidenceRefs.map((ref: any) => ref.value || ref)
        : [];

      return c.json({
        canDelete: evidenceCount === 0,
        evidenceCount,
        evidenceIds,
      });
    } catch (error) {
      log.error("Error checking source deletion:", error);
      return c.json(
        { error: "Failed to check source deletion", details: String(error) },
        500,
      );
    }
  },
);

log.log(
  "✅ Phase 9.1 routes registered: PATCH /evidence/:id/validation, POST/GET /aggregations/*, GET /sources/:sourceRef/can-delete",
);

// REMOVED: Phase 9.0 legacy route GET /aggregations/:materialId/:parameterCode
// This route was causing conflicts with Phase 9.1's /aggregations/material/:materialId
// Hono was matching /aggregations/material/X as materialId=material, parameterCode=X
// Phase 9.1 provides superior aggregation endpoints and this legacy route is no longer needed

// ==================== EVIDENCE POINT ENDPOINTS (Phase 9.0 - BASE) ====================
// Phase 9.0 Day 4 - Evidence Collection System
// These are the BASE CRUD endpoints that Phase 9.1 extends

// Unit validation helper - validates units against ontology
async function validateUnit(
  parameterCode: string,
  unit: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Fetch units ontology
    const currentVersion = await kv.get("ontology:units:current");

    if (!currentVersion) {
      return {
        valid: false,
        error: "Units ontology not initialized. Contact system administrator.",
      };
    }

    const unitsOntology = (await kv.get(
      `ontology:units:${currentVersion}`,
    )) as any;

    if (!unitsOntology) {
      return {
        valid: false,
        error: `Units ontology version ${currentVersion} not found`,
      };
    }

    // Check if parameter exists in ontology
    const parameterDef = unitsOntology.parameters[parameterCode];
    if (!parameterDef) {
      return {
        valid: false,
        error: `Parameter ${parameterCode} not found in units ontology`,
      };
    }

    // Check if unit is allowed for this parameter
    if (!parameterDef.allowed_units.includes(unit)) {
      return {
        valid: false,
        error: `Invalid unit "${unit}" for parameter ${parameterCode}. Allowed units: ${parameterDef.allowed_units.join(
          ", ",
        )}`,
      };
    }

    return { valid: true };
  } catch (error) {
    log.error("Error validating unit:", error);
    return { valid: false, error: `Unit validation failed: ${String(error)}` };
  }
}

// Create evidence point (admin only)
app.post(
  "/make-server-17cae920/evidence",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const body = await c.req.json();
      const {
        material_id,
        parameter_code,
        raw_value,
        raw_unit,
        snippet,
        source_type,
        citation,
        confidence_level,
        notes,
        page_number,
        figure_number,
        table_number,
        source_ref, // Phase 9.1 addition (legacy)
        source_id, // Phase 9.1 addition (preferred)
        source_weight, // Phase 9.1 addition
        restricted_content, // Phase 9.1 addition
      } = body;

      // Accept both source_ref and source_id for backward compatibility
      const sourceReference = source_id || source_ref;

      // Validation
      if (
        !material_id ||
        !parameter_code ||
        raw_value === undefined ||
        !raw_unit ||
        !snippet ||
        !source_type ||
        !citation ||
        !confidence_level
      ) {
        return c.json(
          {
            success: false,
            error:
              "Missing required fields: material_id, parameter_code, raw_value, raw_unit, snippet, source_type, citation, confidence_level",
          },
          400,
        );
      }

      // Validate parameter_code exists in transforms
      const transform = TRANSFORMS_DATA.transforms.find(
        (t) => t.parameter === parameter_code,
      );
      if (!transform) {
        return c.json(
          {
            success: false,
            error: `Invalid parameter_code: ${parameter_code}. Must be one of: ${TRANSFORMS_DATA.transforms
              .map((t) => t.parameter)
              .join(", ")}`,
          },
          400,
        );
      }

      // Validate raw_value is numeric
      if (typeof raw_value !== "number") {
        return c.json(
          {
            success: false,
            error: "raw_value must be a number",
          },
          400,
        );
      }

      // Validate confidence_level
      if (!["high", "medium", "low"].includes(confidence_level)) {
        return c.json(
          {
            success: false,
            error: "confidence_level must be one of: high, medium, low",
          },
          400,
        );
      }

      // Validate source_type
      if (
        !["whitepaper", "article", "external", "manual"].includes(source_type)
      ) {
        return c.json(
          {
            success: false,
            error:
              "source_type must be one of: whitepaper, article, external, manual",
          },
          400,
        );
      }

      // Validate unit against ontology
      const unitValidation = await validateUnit(parameter_code, raw_unit);
      if (!unitValidation.valid) {
        return c.json(
          {
            success: false,
            error: unitValidation.error,
          },
          400,
        );
      }

      // Generate evidence ID
      const evidenceId = `evidence_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const userId = c.get("userId");

      // Create evidence point
      const evidencePoint = {
        id: evidenceId,
        material_id,
        parameter_code,
        raw_value,
        raw_unit,
        transformed_value: null, // Will be computed later
        transform_version: transform.version,
        snippet,
        source_type,
        citation,
        confidence_level,
        notes: notes || null,
        page_number: page_number || null,
        figure_number: figure_number || null,
        table_number: table_number || null,
        source_id: sourceReference || null, // Phase 9.1 addition (unified field name)
        source_ref: sourceReference || null, // Phase 9.1 addition (kept for backward compatibility)
        source_weight: source_weight || 1.0, // Phase 9.1 addition
        restricted_content: restricted_content || false, // Phase 9.1 addition
        validation_status: "pending", // Phase 9.1 addition
        validated_by: null, // Phase 9.1 addition
        validated_at: null, // Phase 9.1 addition
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store evidence point
      await kv.set(`evidence:${evidenceId}`, evidencePoint);

      // Store indexes for easy retrieval
      const materialEvidenceKey = `evidence_by_material:${material_id}:${parameter_code}:${evidenceId}`;
      await kv.set(materialEvidenceKey, evidenceId);

      // Phase 9.1: Store source reference index for deletion guards
      if (sourceReference) {
        const sourceEvidenceKey = `evidence_by_source:${sourceReference}:${evidenceId}`;
        await kv.set(sourceEvidenceKey, evidenceId);
      }

      log.log(
        `✓ Created evidence point ${evidenceId} for material ${material_id}, parameter ${parameter_code}`,
      );

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "evidence",
        entityId: evidenceId,
        action: "create",
        after: evidencePoint,
        req: c,
      });

      return c.json({
        success: true,
        evidenceId,
        evidence: evidencePoint,
        message: "Evidence point created successfully",
      });
    } catch (error) {
      log.error("Error creating evidence point:", error);
      return c.json(
        {
          success: false,
          error: "Failed to create evidence point",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Get all evidence points (authenticated users only)
app.get("/make-server-17cae920/evidence", verifyAuth, async (c) => {
  try {
    // Get all evidence IDs
    const evidenceRefs = await kv.getByPrefix("evidence:");

    if (!evidenceRefs || evidenceRefs.length === 0) {
      return c.json({
        success: true,
        evidence: [],
        count: 0,
      });
    }

    // evidenceRefs are the actual evidence objects (getByPrefix returns values)
    const evidence = evidenceRefs.filter((e: any) => e && e.id);

    return c.json({
      success: true,
      evidence,
      count: evidence.length,
    });
  } catch (error) {
    log.error("Error fetching all evidence points:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch evidence points",
        details: String(error),
      },
      500,
    );
  }
});

// Get evidence points for a material (public - no auth required)
app.get("/make-server-17cae920/evidence/material/:materialId", async (c) => {
  try {
    const materialId = c.req.param("materialId");

    // Get all evidence IDs for this material
    const evidenceRefs = await kv.getByPrefix(
      `evidence_by_material:${materialId}:`,
    );

    if (!evidenceRefs || evidenceRefs.length === 0) {
      return c.json({
        success: true,
        evidence: [],
        count: 0,
      });
    }

    // Fetch full evidence objects
    const evidencePromises = evidenceRefs.map(async (ref: any) => {
      const evidenceId = ref.value;
      const evidence = await kv.get(`evidence:${evidenceId}`);
      return evidence;
    });

    const evidence = await Promise.all(evidencePromises);
    const validEvidence = evidence.filter((e) => e !== null);

    log.log(
      `✓ Retrieved ${validEvidence.length} evidence points for material ${materialId}`,
    );

    return c.json({
      success: true,
      evidence: validEvidence,
      count: validEvidence.length,
    });
  } catch (error) {
    log.error("Error retrieving evidence by material:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve evidence",
        details: String(error),
      },
      500,
    );
  }
});

// Get single evidence point (authenticated users only)
app.get("/make-server-17cae920/evidence/:evidenceId", verifyAuth, async (c) => {
  try {
    const evidenceId = c.req.param("evidenceId");

    const evidence = await kv.get(`evidence:${evidenceId}`);

    if (!evidence) {
      return c.json(
        {
          success: false,
          error: "Evidence point not found",
        },
        404,
      );
    }

    log.log(`✓ Retrieved evidence point ${evidenceId}`);

    return c.json({
      success: true,
      evidence,
    });
  } catch (error) {
    log.error("Error retrieving evidence:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve evidence",
        details: String(error),
      },
      500,
    );
  }
});

// Update evidence point (admin only)
app.put(
  "/make-server-17cae920/evidence/:evidenceId",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const evidenceId = c.req.param("evidenceId");
      const updates = await c.req.json();

      // Get existing evidence
      const existing = (await kv.get(`evidence:${evidenceId}`)) as any;

      if (!existing) {
        return c.json(
          {
            success: false,
            error: "Evidence point not found",
          },
          404,
        );
      }

      // Validate parameter_code if being updated
      if (
        updates.parameter_code &&
        updates.parameter_code !== existing.parameter_code
      ) {
        const transform = TRANSFORMS_DATA.transforms.find(
          (t) => t.parameter === updates.parameter_code,
        );
        if (!transform) {
          return c.json(
            {
              success: false,
              error: `Invalid parameter_code: ${updates.parameter_code}`,
            },
            400,
          );
        }
        updates.transform_version = transform.version;
      }

      // Validate raw_value if being updated
      if (
        updates.raw_value !== undefined &&
        typeof updates.raw_value !== "number"
      ) {
        return c.json(
          {
            success: false,
            error: "raw_value must be a number",
          },
          400,
        );
      }

      // Validate confidence_level if being updated
      if (
        updates.confidence_level &&
        !["high", "medium", "low"].includes(updates.confidence_level)
      ) {
        return c.json(
          {
            success: false,
            error: "confidence_level must be one of: high, medium, low",
          },
          400,
        );
      }

      // Validate source_type if being updated
      if (
        updates.source_type &&
        !["whitepaper", "article", "external", "manual"].includes(
          updates.source_type,
        )
      ) {
        return c.json(
          {
            success: false,
            error:
              "source_type must be one of: whitepaper, article, external, manual",
          },
          400,
        );
      }

      // Validate unit if being updated
      if (updates.raw_unit) {
        const parameterCode = updates.parameter_code || existing.parameter_code;
        const unitValidation = await validateUnit(
          parameterCode,
          updates.raw_unit,
        );
        if (!unitValidation.valid) {
          return c.json(
            {
              success: false,
              error: unitValidation.error,
            },
            400,
          );
        }
      }

      // Update evidence point
      const updated = {
        ...existing,
        ...updates,
        id: evidenceId, // Prevent ID change
        created_by: existing.created_by, // Prevent creator change
        created_at: existing.created_at, // Prevent creation date change
        updated_at: new Date().toISOString(),
      };

      await kv.set(`evidence:${evidenceId}`, updated);

      log.log(`✓ Updated evidence point ${evidenceId}`);

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "evidence",
        entityId: evidenceId,
        action: "update",
        before: existing,
        after: updated,
        req: c,
      });

      return c.json({
        success: true,
        evidence: updated,
        message: "Evidence point updated successfully",
      });
    } catch (error) {
      log.error("Error updating evidence:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update evidence",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Delete evidence point (admin only)
app.delete(
  "/make-server-17cae920/evidence/:evidenceId",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const evidenceId = c.req.param("evidenceId");

      // Get existing evidence to find material_id
      const existing = (await kv.get(`evidence:${evidenceId}`)) as any;

      if (!existing) {
        return c.json(
          {
            success: false,
            error: "Evidence point not found",
          },
          404,
        );
      }

      // Delete evidence point
      await kv.del(`evidence:${evidenceId}`);

      // Delete material reference
      const materialEvidenceKey = `evidence_by_material:${existing.material_id}:${existing.parameter_code}:${evidenceId}`;
      await kv.del(materialEvidenceKey);

      log.log(`✓ Deleted evidence point ${evidenceId}`);

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "evidence",
        entityId: evidenceId,
        action: "delete",
        before: existing,
        req: c,
      });

      return c.json({
        success: true,
        message: "Evidence point deleted successfully",
      });
    } catch (error) {
      log.error("Error deleting evidence:", error);
      return c.json(
        {
          success: false,
          error: "Failed to delete evidence",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Bulk delete evidence points (admin only) - single audit log entry, no email spam
app.post(
  "/make-server-17cae920/evidence/bulk-delete",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { evidenceIds } = await c.req.json();

      if (!Array.isArray(evidenceIds) || evidenceIds.length === 0) {
        return c.json(
          { success: false, error: "evidenceIds must be a non-empty array" },
          400,
        );
      }

      const deletedIds: string[] = [];
      const failedIds: string[] = [];
      const deletedDetails: any[] = [];

      for (const evidenceId of evidenceIds) {
        try {
          // Get existing evidence to find material_id
          const existing = (await kv.get(`evidence:${evidenceId}`)) as any;

          if (!existing) {
            failedIds.push(evidenceId);
            continue;
          }

          // Delete evidence point
          await kv.del(`evidence:${evidenceId}`);

          // Delete material reference
          const materialEvidenceKey = `evidence_by_material:${existing.material_id}:${existing.parameter_code}:${evidenceId}`;
          await kv.del(materialEvidenceKey);

          deletedIds.push(evidenceId);
          deletedDetails.push({
            id: evidenceId,
            material_id: existing.material_id,
            parameter_code: existing.parameter_code,
          });
        } catch (err) {
          log.error(`Failed to delete evidence ${evidenceId}:`, err);
          failedIds.push(evidenceId);
        }
      }

      log.log(
        `✓ Bulk deleted ${deletedIds.length} evidence points, ${failedIds.length} failed`,
      );

      // Single consolidated audit log entry (no email notification for bulk operations)
      const auditId = `audit:${Date.now()}:${crypto.randomUUID()}`;
      const entry = {
        id: auditId,
        timestamp: new Date().toISOString(),
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "evidence_bulk",
        entityId: `bulk:${deletedIds.length}_items`,
        action: "delete",
        before: { count: deletedIds.length, ids: deletedIds },
        after: null,
        changes: [
          `Bulk deleted ${deletedIds.length} evidence points`,
          ...deletedDetails
            .slice(0, 10)
            .map(
              (d) => `Deleted ${d.id} (${d.material_id}/${d.parameter_code})`,
            ),
          ...(deletedDetails.length > 10
            ? [`... and ${deletedDetails.length - 10} more`]
            : []),
        ],
        ipAddress: getClientId(c).split(":")[0],
        userAgent: c.req.header("user-agent") || "unknown",
      };
      await kv.set(auditId, entry);
      log.log(`📝 Bulk audit log created: ${auditId}`);

      return c.json({
        success: true,
        message: `Deleted ${deletedIds.length} evidence points`,
        deletedCount: deletedIds.length,
        failedCount: failedIds.length,
        deletedIds,
        failedIds: failedIds.length > 0 ? failedIds : undefined,
      });
    } catch (error) {
      log.error("Error in bulk delete:", error);
      return c.json(
        {
          success: false,
          error: "Failed to bulk delete evidence",
          details: String(error),
        },
        500,
      );
    }
  },
);

// ==================== AGGREGATION ENDPOINTS ====================

/**
 * Compute aggregation for a specific material and parameter
 * This endpoint computes a weighted mean and stores a complete version snapshot
 * including transform_version, ontology_version, weights_used, and miu_ids
 */
app.post(
  "/make-server-17cae920/aggregations/compute",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { material_id, parameter_code } = await c.req.json();

      if (!material_id || !parameter_code) {
        return c.json(
          {
            success: false,
            error: "Missing required fields: material_id, parameter_code",
          },
          400,
        );
      }

      // Validate parameter_code
      const transform = TRANSFORMS_DATA.transforms.find(
        (t) => t.parameter === parameter_code,
      );
      if (!transform) {
        return c.json(
          {
            success: false,
            error: `Invalid parameter_code: ${parameter_code}. Must be one of: ${TRANSFORMS_DATA.transforms
              .map((t) => t.parameter)
              .join(", ")}`,
          },
          400,
        );
      }

      // Get all evidence for this material+parameter
      const evidenceRefs = await kv.getByPrefix(
        `evidence_by_material:${material_id}:${parameter_code}:`,
      );

      if (!evidenceRefs || evidenceRefs.length === 0) {
        return c.json(
          {
            success: false,
            error: `No evidence found for material ${material_id}, parameter ${parameter_code}`,
          },
          404,
        );
      }

      // Fetch full evidence objects
      log.log(
        `Found ${evidenceRefs.length} evidence refs for material ${material_id}, parameter ${parameter_code}`,
      );
      const evidencePromises = evidenceRefs.map(async (evidenceId: string) => {
        log.log(`Fetching evidence: ${evidenceId}`);
        const evidence = await kv.get(`evidence:${evidenceId}`);
        log.log(
          `Evidence ${evidenceId}:`,
          evidence ? "found" : "NOT FOUND",
          evidence ? JSON.stringify(evidence).substring(0, 200) : "",
        );
        return evidence;
      });

      const evidencePoints = (await Promise.all(evidencePromises)).filter(
        (e) => e !== null,
      );
      log.log(`Fetched ${evidencePoints.length} valid evidence points`);

      if (evidencePoints.length === 0) {
        return c.json(
          {
            success: false,
            error: `No valid evidence found for material ${material_id}, parameter ${parameter_code}`,
          },
          404,
        );
      }

      // Confidence weights mapping
      const confidenceWeights: Record<string, number> = {
        high: 1.0,
        medium: 0.7,
        low: 0.4,
      };

      // Compute weighted mean
      let weightedSum = 0;
      let totalWeight = 0;
      const miu_ids: string[] = [];
      const weights_used: Array<{
        miu_id: string;
        confidence_level: string;
        weight: number;
      }> = [];

      for (const evidence of evidencePoints as any[]) {
        // Validate evidence has required fields
        if (!evidence || typeof evidence !== "object") {
          console.warn(`Skipping invalid evidence object:`, evidence);
          continue;
        }

        log.log(
          `Processing evidence - id: ${evidence.id}, raw_value: ${evidence.raw_value}, confidence_level: ${evidence.confidence_level}`,
        );
        log.log(`Evidence keys:`, Object.keys(evidence));

        if (
          !evidence.id ||
          evidence.raw_value === undefined ||
          !evidence.confidence_level
        ) {
          console.warn(
            `Skipping evidence with missing fields - id: ${evidence.id}, raw_value: ${evidence.raw_value}, confidence_level: ${evidence.confidence_level}`,
          );
          console.warn(`Full evidence object:`, JSON.stringify(evidence));
          continue;
        }

        const weight = confidenceWeights[evidence.confidence_level] || 0.5;
        weightedSum += evidence.raw_value * weight;
        totalWeight += weight;
        miu_ids.push(evidence.id);
        weights_used.push({
          miu_id: evidence.id,
          confidence_level: evidence.confidence_level,
          weight,
        });
      }

      // Check if we have any valid evidence after filtering
      if (miu_ids.length === 0 || totalWeight === 0) {
        // Collect diagnostic info
        const diagnostics = evidencePoints.map((e: any) => ({
          id: e?.id || "missing",
          raw_value: e?.raw_value !== undefined ? e.raw_value : "missing",
          confidence_level: e?.confidence_level || "missing",
          keys: e ? Object.keys(e) : [],
        }));

        return c.json(
          {
            success: false,
            error: `No valid evidence with required fields found for material ${material_id}, parameter ${parameter_code}`,
            debug: {
              evidencePoints_count: evidencePoints.length,
              diagnostics,
            },
          },
          404,
        );
      }

      const aggregated_value = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Get current ontology version
      let ontology_version = "1.0"; // Default
      try {
        const unitsData = (await kv.get("ontology:units")) as any;
        if (unitsData && unitsData.version) {
          ontology_version = unitsData.version;
        }
      } catch (error) {
        console.warn("Could not load ontology version, using default 1.0");
      }

      // Create aggregation snapshot with version tracking
      const aggregationId = `aggregation_${material_id}_${parameter_code}_${Date.now()}`;
      const aggregation = {
        id: aggregationId,
        material_id,
        parameter_code,
        aggregated_value,
        miu_count: evidencePoints.length,
        miu_ids,
        weights_used,

        // Version tracking (Policy Snapshot Fields - Task 8)
        transform_version: transform.version,
        ontology_version,
        weight_policy_version: "1.0", // Weight policy: high=1.0, medium=0.7, low=0.4
        codebook_version: "1.0", // Codebook for confidence levels

        computed_at: new Date().toISOString(),
        computed_by: c.get("userId"),
      };

      // Store aggregation
      await kv.set(`aggregation:${aggregationId}`, aggregation);

      // Store latest aggregation reference for this material+parameter
      await kv.set(
        `aggregation_latest:${material_id}:${parameter_code}`,
        aggregationId,
      );

      log.log(
        `✓ Computed aggregation for material ${material_id}, parameter ${parameter_code}: ${aggregated_value.toFixed(
          2,
        )} (${evidencePoints.length} MIUs)`,
      );

      // Audit log
      await createAuditLog({
        userId: c.get("userId"),
        userEmail: c.get("userEmail"),
        entityType: "aggregation",
        entityId: aggregationId,
        action: "compute",
        after: aggregation,
        req: c,
      });

      return c.json({
        success: true,
        aggregation,
        message: `Aggregation computed successfully (${evidencePoints.length} MIUs)`,
      });
    } catch (error) {
      log.error("Error computing aggregation:", error);
      return c.json(
        {
          success: false,
          error: "Failed to compute aggregation",
          details: String(error),
        },
        500,
      );
    }
  },
);

// Get specific aggregation by material and parameter (public read access)
app.get(
  "/make-server-17cae920/aggregations/:materialId/:parameterCode",
  async (c) => {
    try {
      const materialId = c.req.param("materialId");
      const parameterCode = c.req.param("parameterCode");

      // Get the latest aggregation ID for this material+parameter
      const latestAggregationId = await kv.get(
        `aggregation_latest:${materialId}:${parameterCode}`,
      );

      if (!latestAggregationId) {
        return c.json(
          {
            success: false,
            error: `No aggregation found for material ${materialId}, parameter ${parameterCode}`,
          },
          404,
        );
      }

      // Get the aggregation data
      const aggregation = await kv.get(`aggregation:${latestAggregationId}`);

      if (!aggregation) {
        return c.json(
          {
            success: false,
            error: `Aggregation data not found for ID ${latestAggregationId}`,
          },
          404,
        );
      }

      return c.json({
        success: true,
        aggregation,
      });
    } catch (error) {
      log.error("Error retrieving aggregation:", error);
      return c.json(
        {
          success: false,
          error: "Failed to retrieve aggregation",
          details: String(error),
        },
        500,
      );
    }
  },
);

// REMOVED: Duplicate route - moved up with other aggregation routes around line ~5890
// to ensure proper route precedence. Now defined BEFORE /aggregations/:id
// ALSO REMOVED: Duplicate GET /aggregations/material/:materialId - now handled by Phase 9.1 route at line ~5869
// This route was conflicting with GET /aggregations/material/:materialId defined in Phase 9.1
// Phase 9.1 uses aggregations.ts module which provides the same functionality

// ==================== SOURCE DEDUPLICATION ENDPOINTS ====================

// Normalize multiple DOIs (public endpoint for testing)
app.post("/make-server-17cae920/sources/normalize-doi", async (c) => {
  try {
    const { dois } = (await c.req.json()) as { dois: string[] };

    if (!Array.isArray(dois)) {
      return c.json(
        {
          success: false,
          error: "dois must be an array",
        },
        400,
      );
    }

    const normalized = dois.map((doi) => normalizeDOI(doi));

    return c.json({
      success: true,
      normalized,
      original: dois,
    });
  } catch (error) {
    log.error("Error normalizing DOIs:", error);
    return c.json(
      {
        success: false,
        error: "Failed to normalize DOIs",
        details: String(error),
      },
      500,
    );
  }
});

// Check for duplicate sources by DOI or title
app.post("/make-server-17cae920/sources/check-duplicate", async (c) => {
  try {
    const { doi, title } = (await c.req.json()) as {
      doi?: string;
      title?: string;
    };

    if (!doi && !title) {
      return c.json(
        {
          success: false,
          error: "Either doi or title must be provided",
        },
        400,
      );
    }

    // Check DOI duplicate first (100% accurate)
    if (doi) {
      const normalizedDOI = normalizeDOI(doi);

      if (normalizedDOI) {
        // Get all sources and check for DOI match
        const allSources = await kv.getByPrefix("source:");

        for (const sourceData of allSources) {
          const source = sourceData as any;
          if (source.doi) {
            const existingNormalizedDOI = normalizeDOI(source.doi);
            if (existingNormalizedDOI === normalizedDOI) {
              log.log(`⚠️ DOI duplicate detected: ${normalizedDOI}`);
              return c.json({
                success: true,
                isDuplicate: true,
                matchType: "doi",
                confidence: 100,
                existingSource: {
                  id: source.id,
                  title: source.title,
                  doi: source.doi,
                  year: source.year,
                  authors: source.authors,
                },
                message: `This DOI already exists in your library: "${source.title}"`,
              });
            }
          }
        }
      }
    }

    // Check fuzzy title match (90%+ similarity)
    if (title) {
      const allSources = await kv.getByPrefix("source:");
      const SIMILARITY_THRESHOLD = 90; // 90% similarity threshold

      for (const sourceData of allSources) {
        const source = sourceData as any;
        if (source.title) {
          const similarity = calculateSimilarity(title, source.title);

          if (similarity >= SIMILARITY_THRESHOLD) {
            log.log(
              `⚠️ Title similarity detected: "${title}" vs "${source.title}" (${similarity}%)`,
            );
            return c.json({
              success: true,
              isDuplicate: true,
              matchType: "title",
              similarity,
              confidence: similarity,
              existingSource: {
                id: source.id,
                title: source.title,
                doi: source.doi,
                year: source.year,
                authors: source.authors,
              },
              message: `A similar title already exists in your library: "${source.title}" (${similarity}% match)`,
            });
          }
        }
      }
    }

    // No duplicates found
    return c.json({
      success: true,
      isDuplicate: false,
      message: "No duplicates found. Safe to add this source.",
    });
  } catch (error) {
    log.error("Error checking for duplicates:", error);
    return c.json(
      {
        success: false,
        error: "Failed to check duplicates",
        details: String(error),
      },
      500,
    );
  }
});

// Merge duplicate sources (admin only)
app.post(
  "/make-server-17cae920/sources/merge",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { primarySourceId, duplicateSourceId } = (await c.req.json()) as {
        primarySourceId: string;
        duplicateSourceId: string;
      };

      if (!primarySourceId || !duplicateSourceId) {
        return c.json(
          {
            success: false,
            error: "Both primarySourceId and duplicateSourceId are required",
          },
          400,
        );
      }

      if (primarySourceId === duplicateSourceId) {
        return c.json(
          {
            success: false,
            error: "Cannot merge a source with itself",
          },
          400,
        );
      }

      // Get both sources
      const primarySource = (await kv.get(`source:${primarySourceId}`)) as any;
      const duplicateSource = (await kv.get(
        `source:${duplicateSourceId}`,
      )) as any;

      if (!primarySource) {
        return c.json(
          {
            success: false,
            error: "Primary source not found",
          },
          404,
        );
      }

      if (!duplicateSource) {
        return c.json(
          {
            success: false,
            error: "Duplicate source not found",
          },
          404,
        );
      }

      // Find all evidence points referencing the duplicate source
      const allEvidence = await kv.getByPrefix("evidence:");
      let miusMigrated = 0;

      for (const evidenceData of allEvidence) {
        const evidence = evidenceData as any;

        // Check if this evidence references the duplicate source
        if (evidence.source_id === duplicateSourceId) {
          // Update to point to primary source
          const updated = {
            ...evidence,
            source_id: primarySourceId,
            updated_at: new Date().toISOString(),
          };

          await kv.set(`evidence:${evidence.id}`, updated);
          miusMigrated++;

          log.log(
            `✓ Migrated evidence ${evidence.id} from source ${duplicateSourceId} to ${primarySourceId}`,
          );
        }
      }

      // Delete the duplicate source
      await kv.del(`source:${duplicateSourceId}`);

      log.log(
        `✓ Merged sources: kept ${primarySourceId}, deleted ${duplicateSourceId}, migrated ${miusMigrated} MIUs`,
      );

      return c.json({
        success: true,
        primarySource,
        miusMigrated,
        message: `Successfully merged sources. ${miusMigrated} evidence point(s) migrated to the primary source.`,
      });
    } catch (error) {
      log.error("Error merging sources:", error);
      return c.json(
        {
          success: false,
          error: "Failed to merge sources",
          details: String(error),
        },
        500,
      );
    }
  },
);

// ==================== AUDIT LOGGING ====================

// Audit log entry interface
interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  entityType: string; // material, source, evidence, article, whitepaper, user, etc.
  entityId: string;
  action: string; // create, update, delete
  before: any; // previous state (null for create)
  after: any; // new state (null for delete)
  changes: string[]; // human-readable list of changes
  ipAddress?: string;
  userAgent?: string;
}

// Helper function to send audit email notifications
async function sendAuditEmailNotification(entry: AuditLogEntry) {
  // Only send emails for critical events
  const criticalEvents = [
    { entityType: "material", action: "delete" },
    { entityType: "user", action: "delete" },
    { entityType: "user", action: "update" }, // role changes
    { entityType: "source", action: "delete" },
    { entityType: "whitepaper", action: "delete" },
    { entityType: "evidence", action: "delete" },
  ];

  const isCritical = criticalEvents.some(
    (event) =>
      event.entityType === entry.entityType && event.action === entry.action,
  );

  if (!isCritical) {
    return; // Don't send email for non-critical events
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    log.log(
      "⚠️ RESEND_API_KEY not configured, skipping audit email notification",
    );
    return;
  }

  try {
    const adminEmails = getAdminNotificationEmails();

    // Format changes for email
    const changesHtml = entry.changes.map((c) => `<li>${c}</li>`).join("");

    const actionEmoji =
      {
        create: "✨",
        update: "📝",
        delete: "🗑️",
      }[entry.action] || "📋";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
            .metadata { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .metadata-item { margin: 8px 0; }
            .label { font-weight: 600; color: #374151; }
            .changes { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">${actionEmoji} WasteDB Audit Alert</h2>
            </div>
            <div class="content">
              <p><strong>A critical action was performed in WasteDB:</strong></p>
              
              <div class="metadata">
                <div class="metadata-item">
                  <span class="label">Action:</span> ${entry.action.toUpperCase()}
                </div>
                <div class="metadata-item">
                  <span class="label">Entity Type:</span> ${entry.entityType}
                </div>
                <div class="metadata-item">
                  <span class="label">Entity ID:</span> ${entry.entityId}
                </div>
                <div class="metadata-item">
                  <span class="label">Performed By:</span> ${entry.userEmail}
                </div>
                <div class="metadata-item">
                  <span class="label">Timestamp:</span> ${new Date(
                    entry.timestamp,
                  ).toLocaleString()}
                </div>
                ${
                  entry.ipAddress
                    ? `<div class="metadata-item"><span class="label">IP Address:</span> ${entry.ipAddress}</div>`
                    : ""
                }
              </div>
              
              ${
                entry.changes.length > 0
                  ? `
                <div class="changes">
                  <strong>Changes:</strong>
                  <ul style="margin: 10px 0;">
                    ${changesHtml}
                  </ul>
                </div>
              `
                  : ""
              }
              
              <p style="margin-top: 20px;">
                <a href="https://db.wastefull.org/admin/audit-logs" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Audit Logs
                </a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from WasteDB.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
WasteDB Audit Alert

A critical action was performed in WasteDB:

Action: ${entry.action.toUpperCase()}
Entity Type: ${entry.entityType}
Entity ID: ${entry.entityId}
Performed By: ${entry.userEmail}
Timestamp: ${new Date(entry.timestamp).toLocaleString()}
${entry.ipAddress ? `IP Address: ${entry.ipAddress}` : ""}

Changes:
${entry.changes.map((c) => `- ${c}`).join("\n")}

View full audit logs at: https://db.wastefull.org/admin/audit-logs
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "WasteDB Audit <audit@wastefull.org>",
        to: adminEmails,
        subject: `🚨 WasteDB Audit Alert: ${entry.action} ${entry.entityType}`,
        html,
        text,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      log.log(`📧 Audit email notification sent: ${result.id}`);
    } else {
      const errorText = await response.text();
      log.error("❌ Failed to send audit email notification:", errorText);
    }
  } catch (error) {
    log.error("❌ Error sending audit email notification:", error);
    // Don't throw - audit logging should continue even if email fails
  }
}

// Helper function to create audit log entry
async function createAuditLog(params: {
  userId: string;
  userEmail: string;
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete";
  before?: any;
  after?: any;
  req?: any;
}): Promise<string> {
  const auditId = `audit:${Date.now()}:${crypto.randomUUID()}`;

  // Calculate changes
  const changes: string[] = [];
  if (params.action === "create") {
    changes.push("Entity created");
  } else if (params.action === "delete") {
    changes.push("Entity deleted");
  } else if (params.action === "update" && params.before && params.after) {
    // Find differences
    const beforeKeys = Object.keys(params.before);
    const afterKeys = Object.keys(params.after);
    const allKeys = new Set([...beforeKeys, ...afterKeys]);

    for (const key of allKeys) {
      const beforeVal = params.before[key];
      const afterVal = params.after[key];

      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changes.push(
          `Changed ${key}: ${JSON.stringify(beforeVal)} → ${JSON.stringify(
            afterVal,
          )}`,
        );
      }
    }
  }

  const entry: AuditLogEntry = {
    id: auditId,
    timestamp: new Date().toISOString(),
    userId: params.userId,
    userEmail: params.userEmail,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    before: params.before || null,
    after: params.after || null,
    changes,
    ipAddress: params.req ? getClientId(params.req).split(":")[0] : undefined,
    userAgent: params.req
      ? params.req.req.header("user-agent") || "unknown"
      : undefined,
  };

  const _supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  await _supabase.from("audit_log").insert({
    id: auditId,
    timestamp: entry.timestamp,
    user_id: entry.userId,
    user_email: entry.userEmail,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    before: entry.before ?? null,
    after: entry.after ?? null,
    changes: entry.changes,
    ip_address: entry.ipAddress ?? null,
    user_agent: entry.userAgent ?? null,
  });
  log.log(
    `📝 Audit log created: ${auditId} - ${params.action} ${params.entityType}:${params.entityId} by ${params.userEmail}`,
  );

  // Send email notification for critical events
  await sendAuditEmailNotification(entry);

  return auditId;
}

// POST /make-server-17cae920/audit/log - Create audit log entry
app.post("/make-server-17cae920/audit/log", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    const { entityType, entityId, action, before, after } = body;

    if (!entityType || !entityId || !action) {
      return c.json(
        { error: "Missing required fields: entityType, entityId, action" },
        400,
      );
    }

    if (!["create", "update", "delete"].includes(action)) {
      return c.json(
        { error: "Invalid action. Must be create, update, or delete" },
        400,
      );
    }

    const auditId = await createAuditLog({
      userId: c.get("userId"),
      userEmail: c.get("userEmail"),
      entityType,
      entityId,
      action,
      before,
      after,
      req: c,
    });

    return c.json({ success: true, auditId });
  } catch (error) {
    log.error("Error creating audit log:", error);
    return c.json(
      { error: "Failed to create audit log", details: String(error) },
      500,
    );
  }
});

// GET /make-server-17cae920/audit/logs - Get audit logs with filtering
app.get(
  "/make-server-17cae920/audit/logs",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const entityType = c.req.query("entityType");
      const entityId = c.req.query("entityId");
      const userId = c.req.query("userId");
      const action = c.req.query("action");
      const startDate = c.req.query("startDate");
      const endDate = c.req.query("endDate");
      const limit = parseInt(c.req.query("limit") || "100");
      const offset = parseInt(c.req.query("offset") || "0");

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      let query = supabase
        .from("audit_log")
        .select("*", { count: "exact" })
        .order("timestamp", { ascending: false });

      if (entityType) query = query.eq("entity_type", entityType);
      if (entityId) query = query.eq("entity_id", entityId);
      if (userId) query = query.eq("user_id", userId);
      if (action) query = query.eq("action", action);
      if (startDate) query = query.gte("timestamp", startDate);
      if (endDate) query = query.lte("timestamp", endDate);

      const { data, count, error } = await query.range(
        offset,
        offset + limit - 1,
      );
      if (error) throw error;

      // Map snake_case columns → camelCase AuditLogEntry
      const logs = (data ?? []).map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        userId: r.user_id,
        userEmail: r.user_email,
        entityType: r.entity_type,
        entityId: r.entity_id,
        action: r.action,
        before: r.before,
        after: r.after,
        changes: r.changes ?? [],
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
      }));

      return c.json({ logs, total: count ?? 0, offset, limit });
    } catch (error) {
      log.error("Error fetching audit logs:", error);
      return c.json(
        { error: "Failed to fetch audit logs", details: String(error) },
        500,
      );
    }
  },
);

// GET /make-server-17cae920/audit/logs/:id - Get specific audit log
app.get(
  "/make-server-17cae920/audit/logs/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data: r, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!r) return c.json({ error: "Audit log not found" }, 404);

      return c.json({
        log: {
          id: r.id,
          timestamp: r.timestamp,
          userId: r.user_id,
          userEmail: r.user_email,
          entityType: r.entity_type,
          entityId: r.entity_id,
          action: r.action,
          before: r.before,
          after: r.after,
          changes: r.changes ?? [],
          ipAddress: r.ip_address,
          userAgent: r.user_agent,
        },
      });
    } catch (error) {
      log.error("Error fetching audit log:", error);
      return c.json(
        { error: "Failed to fetch audit log", details: String(error) },
        500,
      );
    }
  },
);

// GET /make-server-17cae920/audit/stats - Get audit statistics
app.get(
  "/make-server-17cae920/audit/stats",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const [totalRes, byTypeRes, byActionRes, byUserRes, recentRes] =
        await Promise.all([
          supabase
            .from("audit_log")
            .select("*", { count: "exact", head: true }),
          supabase.rpc("audit_log_count_by_entity_type").catch(() => ({
            data: null,
          })),
          supabase.from("audit_log").select("action").limit(10000),
          supabase.from("audit_log").select("user_id, user_email").limit(10000),
          supabase
            .from("audit_log")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(10),
        ]);

      // Build aggregations in-memory (rpc fallback)
      const byEntityType: Record<string, number> = {};
      const byAction: Record<string, number> = {};
      const byUser: Record<string, { email: string; count: number }> = {};

      (byActionRes.data ?? []).forEach((r: any) => {
        byAction[r.action] = (byAction[r.action] || 0) + 1;
      });
      (byUserRes.data ?? []).forEach((r: any) => {
        if (!byUser[r.user_id]) {
          byUser[r.user_id] = { email: r.user_email, count: 0 };
        }
        byUser[r.user_id].count++;
      });

      // entity_type from recent + action rows (cheap approximation for stats)
      const allSampled = [
        ...(byActionRes.data ?? []),
        ...(recentRes.data ?? []),
      ];
      allSampled.forEach((r: any) => {
        if (r.entity_type) {
          byEntityType[r.entity_type] = (byEntityType[r.entity_type] || 0) + 1;
        }
      });

      const recentActivity = (recentRes.data ?? []).map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        userId: r.user_id,
        userEmail: r.user_email,
        entityType: r.entity_type,
        entityId: r.entity_id,
        action: r.action,
        before: r.before,
        after: r.after,
        changes: r.changes ?? [],
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
      }));

      return c.json({
        stats: {
          total: totalRes.count ?? 0,
          byEntityType,
          byAction,
          byUser,
          recentActivity,
        },
      });
    } catch (error) {
      log.error("Error fetching audit stats:", error);
      return c.json(
        { error: "Failed to fetch audit stats", details: String(error) },
        500,
      );
    }
  },
);

// ==================== DATA RETENTION & DELETION ENDPOINTS ====================

// Get retention statistics (admin only)
app.get(
  "/make-server-17cae920/admin/retention/stats",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const SEVEN_YEARS_MS = 7 * 365 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const sevenYearsAgo = new Date(now - SEVEN_YEARS_MS);

      // Get all sources with screenshots
      const allSources = await kv.getByPrefix("source:");
      const sourcesWithScreenshots = allSources.filter(
        (source: any) => source && source.screenshot_url,
      );

      // Identify expired screenshots (older than 7 years)
      const expiredScreenshots = sourcesWithScreenshots.filter(
        (source: any) => {
          if (!source.created_at) return false;
          const createdDate = new Date(source.created_at);
          return createdDate < sevenYearsAgo;
        },
      );

      // Get all evidence points
      const allEvidence = await kv.getByPrefix("evidence:");

      // Get all audit logs
      const allAuditLogs = await kv.getByPrefix("auditlog:");
      const expiredAuditLogs = allAuditLogs.filter((log: any) => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);
        return logDate < sevenYearsAgo;
      });

      const stats = {
        screenshots: {
          total: sourcesWithScreenshots.length,
          expired: expiredScreenshots.length,
          expiredSources: expiredScreenshots.map((s: any) => ({
            id: s.id,
            title: s.title,
            created_at: s.created_at,
            screenshot_url: s.screenshot_url,
          })),
        },
        auditLogs: {
          total: allAuditLogs.length,
          expired: expiredAuditLogs.length,
          oldestLog:
            allAuditLogs.length > 0
              ? allAuditLogs.reduce((oldest: any, current: any) => {
                  if (!oldest || !oldest.timestamp) return current;
                  if (!current.timestamp) return oldest;
                  return new Date(current.timestamp) <
                    new Date(oldest.timestamp)
                    ? current
                    : oldest;
                })
              : null,
        },
        evidence: {
          total: allEvidence.length,
        },
        lastChecked: new Date().toISOString(),
      };

      return c.json({ stats });
    } catch (error) {
      log.error("Error fetching retention stats:", error);
      return c.json(
        { error: "Failed to fetch retention stats", details: String(error) },
        500,
      );
    }
  },
);

// Clean up expired screenshots (admin only)
app.post(
  "/make-server-17cae920/admin/retention/cleanup-screenshots",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const SEVEN_YEARS_MS = 7 * 365 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const sevenYearsAgo = new Date(now - SEVEN_YEARS_MS);

      // Get all sources with screenshots
      const allSources = await kv.getByPrefix("source:");
      const sourcesWithScreenshots = allSources.filter(
        (source: any) => source && source.screenshot_url,
      );

      // Identify expired screenshots
      const expiredScreenshots = sourcesWithScreenshots.filter(
        (source: any) => {
          if (!source.created_at) return false;
          const createdDate = new Date(source.created_at);
          return createdDate < sevenYearsAgo;
        },
      );

      // Clean up expired screenshots
      const cleanedSources = [];
      for (const source of expiredScreenshots) {
        const updatedSource = {
          ...source,
          screenshot_url: null,
          screenshot_expired_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: c.get("userId"),
        };

        await kv.set(`source:${source.id}`, updatedSource);
        cleanedSources.push({
          id: source.id,
          title: source.title,
          created_at: source.created_at,
          screenshot_url: source.screenshot_url,
        });

        // Audit log
        await createAuditLog({
          userId: c.get("userId"),
          userEmail: c.get("userEmail"),
          entityType: "source",
          entityId: source.id,
          action: "update",
          before: source,
          after: updatedSource,
          req: c,
        });

        log.log(
          `✓ Expired screenshot removed from source ${source.id} (created ${source.created_at})`,
        );
      }

      return c.json({
        success: true,
        cleanedCount: cleanedSources.length,
        cleanedSources,
      });
    } catch (error) {
      log.error("Error cleaning up screenshots:", error);
      return c.json(
        { error: "Failed to clean up screenshots", details: String(error) },
        500,
      );
    }
  },
);

// Clean up expired audit logs (admin only)
app.post(
  "/make-server-17cae920/admin/retention/cleanup-audit-logs",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const SEVEN_YEARS_MS = 7 * 365 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const sevenYearsAgo = new Date(now - SEVEN_YEARS_MS);

      // Get all audit logs
      const allAuditLogs = await kv.getByPrefix("auditlog:");
      const expiredAuditLogs = allAuditLogs.filter((log: any) => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);
        return logDate < sevenYearsAgo;
      });

      // Delete expired logs
      const deletedLogs = [];
      for (const log of expiredAuditLogs) {
        await kv.del(`auditlog:${log.id}`);
        deletedLogs.push({
          id: log.id,
          timestamp: log.timestamp,
          entityType: log.entityType,
          action: log.action,
        });

        log.log(
          `✓ Expired audit log deleted: ${log.id} (timestamp ${log.timestamp})`,
        );
      }

      return c.json({
        success: true,
        deletedCount: deletedLogs.length,
        deletedLogs,
      });
    } catch (error) {
      log.error("Error cleaning up audit logs:", error);
      return c.json(
        { error: "Failed to clean up audit logs", details: String(error) },
        500,
      );
    }
  },
);

// Create test evidence with source_id for testing (admin only)
app.post(
  "/make-server-17cae920/admin/retention/test-evidence",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const { evidenceId, sourceId, materialId } = await c.req.json();

      if (!evidenceId || !sourceId || !materialId) {
        return c.json(
          {
            error: "Missing required fields: evidenceId, sourceId, materialId",
          },
          400,
        );
      }

      // Create minimal evidence record with source_id for testing referential integrity
      const testEvidence = {
        id: evidenceId,
        material_id: materialId,
        parameter_code: "Y",
        source_id: sourceId, // Key field for referential integrity testing
        snippet: "Test snippet for referential integrity check",
        citation: `Test Source: ${sourceId}`,
        confidence_level: "high",
        created_at: new Date().toISOString(),
        created_by: c.get("userId"),
      };

      // Store evidence in KV
      await kv.set(`evidence:${evidenceId}`, testEvidence);
      log.log(`✓ Test evidence created: ${evidenceId} for source ${sourceId}`);

      return c.json({ success: true, evidence: testEvidence });
    } catch (error) {
      log.error("Error creating test evidence:", error);
      return c.json(
        { error: "Failed to create test evidence", details: String(error) },
        500,
      );
    }
  },
);

// Check referential integrity for a source (admin only)
app.get(
  "/make-server-17cae920/admin/retention/check-source/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const id = c.req.param("id");

      const source = await kv.get(`source:${id}`);
      if (!source) {
        return c.json({ error: "Source not found" }, 404);
      }

      // Check for dependent evidence
      const allEvidence = await kv.getByPrefix("evidence:");
      const dependentEvidence = allEvidence.filter(
        (evidence: any) => evidence && evidence.source_id === id,
      );

      return c.json({
        source,
        canDelete: dependentEvidence.length === 0,
        dependentCount: dependentEvidence.length,
        dependentEvidence: dependentEvidence.map((e: any) => ({
          id: e.id,
          material_id: e.material_id,
          parameter_code: e.parameter_code,
          created_at: e.created_at,
          created_by: e.created_by,
        })),
      });
    } catch (error) {
      log.error("Error checking source referential integrity:", error);
      return c.json(
        {
          error: "Failed to check referential integrity",
          details: String(error),
        },
        500,
      );
    }
  },
);

// ==================== GRAPH MIGRATION DRY RUNS ====================

// Non-mutating entity-backfill preview. This intentionally does not create a
// graph_migration_runs row or audit entry: callers can compare repeated reports
// without the dry run changing the source or destination snapshots.
app.post(
  "/make-server-17cae920/graph/migrations/entity-backfill/dry-run",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const requestedLimit = Number(body?.sample_limit);
      const sampleLimit = Number.isFinite(requestedLimit)
        ? Math.trunc(requestedLimit)
        : undefined;
      const report = await buildEntityBackfillDryRun(_roleClient(), {
        sampleLimit,
      });

      return c.json({
        success: true,
        ready_to_apply: report.blocking_issue_count === 0,
        report,
      });
    } catch (error) {
      log.error("Entity backfill dry run failed:", error);
      return c.json(
        {
          success: false,
          ready_to_apply: false,
          error: "Entity backfill dry run failed",
          details: String(error),
        },
        500,
      );
    }
  },
);

app.get(
  "/make-server-17cae920/graph/migrations/entity-backfill/capabilities",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    return c.json({
      migration_version: ENTITY_BACKFILL_VERSION,
      apply_enabled:
        Deno.env.get("GRAPH_MIGRATION_APPLY_ENABLED") === "true",
      apply_confirmation: ENTITY_BACKFILL_APPLY_CONFIRMATION,
      phases: ENTITY_BACKFILL_PHASES,
      graph_reads_enabled: false,
      compatibility_writes_enabled: false,
    });
  },
);

app.post(
  "/make-server-17cae920/graph/migrations/entity-backfill/apply",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    if (Deno.env.get("GRAPH_MIGRATION_APPLY_ENABLED") !== "true") {
      return c.json(
        {
          success: false,
          error:
            "Entity-backfill apply is disabled. Enable it only for an approved migration window.",
        },
        503,
      );
    }

    try {
      const body = await c.req.json();
      if (body?.confirmation !== ENTITY_BACKFILL_APPLY_CONFIRMATION) {
        return c.json(
          {
            success: false,
            error: "Exact entity-backfill confirmation text is required",
          },
          400,
        );
      }
      const expectedReportChecksum =
        typeof body?.expected_report_checksum === "string"
          ? body.expected_report_checksum.trim().toLowerCase()
          : "";
      if (!/^[a-f0-9]{64}$/.test(expectedReportChecksum)) {
        return c.json(
          {
            success: false,
            error: "A reviewed dry-run SHA-256 checksum is required",
          },
          400,
        );
      }
      const recoveryArtifact = parseEntityBackfillRecoveryArtifact(
        body?.recovery_artifact,
      );
      if (!recoveryArtifact) {
        return c.json(
          {
            success: false,
            error:
              "A schema-version 4.0 recovery artifact checksum and location are required",
          },
          400,
        );
      }

      const result = await startEntityBackfillApply(_roleClient(), {
        startedBy: c.get("userId"),
        expectedReportChecksum,
        recoveryArtifact,
      });
      return c.json(result, result.status as any);
    } catch (error) {
      log.error("Entity backfill apply failed:", error);
      return c.json(
        {
          success: false,
          error: "Entity backfill apply failed",
          details: String(error),
        },
        500,
      );
    }
  },
);

app.post(
  "/make-server-17cae920/graph/migrations/entity-backfill/runs/:runId/resume",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    if (Deno.env.get("GRAPH_MIGRATION_APPLY_ENABLED") !== "true") {
      return c.json(
        {
          success: false,
          error:
            "Entity-backfill resume is disabled. Enable it only for an approved migration window.",
        },
        503,
      );
    }

    try {
      const body = await c.req.json();
      if (body?.confirmation !== ENTITY_BACKFILL_APPLY_CONFIRMATION) {
        return c.json(
          {
            success: false,
            error: "Exact entity-backfill confirmation text is required",
          },
          400,
        );
      }
      const expectedReportChecksum =
        typeof body?.expected_report_checksum === "string"
          ? body.expected_report_checksum.trim().toLowerCase()
          : "";
      if (!/^[a-f0-9]{64}$/.test(expectedReportChecksum)) {
        return c.json(
          {
            success: false,
            error: "The original reviewed dry-run checksum is required",
          },
          400,
        );
      }

      const result = await resumeEntityBackfillApply(_roleClient(), {
        runId: c.req.param("runId"),
        expectedReportChecksum,
      });
      return c.json(result, result.status as any);
    } catch (error) {
      log.error("Entity backfill resume failed:", error);
      return c.json(
        {
          success: false,
          error: "Entity backfill resume failed",
          details: String(error),
        },
        500,
      );
    }
  },
);

app.get(
  "/make-server-17cae920/graph/migrations/entity-backfill/runs/:runId",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const client = _roleClient();
      const runId = c.req.param("runId");
      const [runResult, checkpointResult, issueResult] = await Promise.all([
        client
          .from("graph_migration_runs")
          .select("*")
          .eq("id", runId)
          .maybeSingle(),
        client
          .from("graph_migration_checkpoints")
          .select("*")
          .eq("run_id", runId)
          .order("created_at", { ascending: true }),
        client
          .from("graph_migration_issues")
          .select("*")
          .eq("run_id", runId)
          .order("created_at", { ascending: true }),
      ]);
      if (runResult.error) throw runResult.error;
      if (!runResult.data) {
        return c.json({ error: "Entity-backfill run not found" }, 404);
      }
      if (checkpointResult.error) throw checkpointResult.error;
      if (issueResult.error) throw issueResult.error;

      return c.json({
        run: runResult.data,
        checkpoints: checkpointResult.data ?? [],
        issues: issueResult.data ?? [],
      });
    } catch (error) {
      log.error("Failed to load entity-backfill run:", error);
      return c.json(
        {
          error: "Failed to load entity-backfill run",
          details: String(error),
        },
        500,
      );
    }
  },
);

// ==================== BACKUP & RECOVERY ENDPOINTS ====================

const FULL_BACKUP_BASE_POSTGRES_TABLES = [
  "user_profiles",
  "material_categories",
  "materials",
  "articles",
  "sources",
  "material_sources",
  "material_links",
  "evidence_points",
  "audit_log",
  "guides",
  "blog_posts",
  "changelog_entries",
] as const;

const FULL_BACKUP_GRAPH_POSTGRES_TABLES = [
  "entity_types",
  "relationship_types",
  "tag_types",
  "content_roles",
  "lifecycle_focuses",
  "evidence_uses",
  "videos",
  "entities",
  "entity_canonical_bindings",
  "entity_relationships",
  "tags",
  "entity_tags",
  "content_entities",
  "graph_migration_runs",
  "graph_migration_checkpoints",
  "graph_migration_issues",
  "graph_sync_outbox",
] as const;

const FULL_BACKUP_POSTGRES_TABLES = [
  ...FULL_BACKUP_BASE_POSTGRES_TABLES,
  ...FULL_BACKUP_GRAPH_POSTGRES_TABLES,
] as const;

const FULL_BACKUP_ORDER_COLUMNS: Record<string, readonly string[]> = {
  entity_types: ["slug"],
  relationship_types: ["slug"],
  tag_types: ["slug"],
  content_roles: ["slug"],
  lifecycle_focuses: ["slug"],
  evidence_uses: ["slug"],
  entity_canonical_bindings: ["entity_id"],
  entity_tags: ["entity_id", "tag_id"],
};

const FULL_BACKUP_KV_SECTIONS = [
  "materials",
  "sources",
  "whitepapers",
  "evidence",
  "user_profiles",
  "user_roles",
  "audit_logs",
  "notifications",
  "takedown_requests",
  "recompute_jobs",
  "submissions",
] as const;

const BACKUP_PAGE_SIZE = 1000;

async function checksumJson(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchAllPostgresRows(
  client: any,
  table: string,
  orderColumns: readonly string[] = ["id"],
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let offset = 0;

  while (true) {
    let query = client.from(table).select("*");
    for (const column of orderColumns) {
      query = query.order(column, { ascending: true });
    }
    const { data, error } = await query.range(
      offset,
      offset + BACKUP_PAGE_SIZE - 1,
    );
    if (error) {
      const fetchError = new Error(
        `Failed to fetch required backup table '${table}': ${error.message}`,
      );
      (fetchError as Error & { code?: string }).code = error.code;
      throw fetchError;
    }

    const page = JSON.parse(
      JSON.stringify(data ?? []),
    ) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < BACKUP_PAGE_SIZE) break;
    offset += BACKUP_PAGE_SIZE;
  }

  return rows;
}

function isMissingPostgresTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: string }).code;
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    error.message.includes("Could not find the table") ||
    error.message.includes("does not exist")
  );
}

async function fetchGraphBackupRows(client: any): Promise<{
  enabled: boolean;
  rows: Record<string, Record<string, unknown>[]>;
}> {
  const rows: Record<string, Record<string, unknown>[]> = {};
  const present: string[] = [];
  const missing: string[] = [];

  for (const table of FULL_BACKUP_GRAPH_POSTGRES_TABLES) {
    try {
      rows[table] = await fetchAllPostgresRows(
        client,
        table,
        FULL_BACKUP_ORDER_COLUMNS[table],
      );
      present.push(table);
    } catch (error) {
      if (!isMissingPostgresTableError(error)) throw error;
      missing.push(table);
    }
  }

  if (present.length > 0 && missing.length > 0) {
    throw new Error(
      `Partial graph schema detected. Present: ${present.join(
        ", ",
      )}. Missing: ${missing.join(", ")}. Refusing to create an incomplete backup.`,
    );
  }

  return {
    enabled: present.length === FULL_BACKUP_GRAPH_POSTGRES_TABLES.length,
    rows: present.length > 0 ? rows : {},
  };
}

async function fetchAllAuthUsers(
  client: any,
): Promise<Record<string, unknown>[]> {
  const users: Record<string, unknown>[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: BACKUP_PAGE_SIZE,
    });
    if (error) {
      throw new Error(`Failed to fetch auth user metadata: ${error.message}`);
    }

    const batch = JSON.parse(
      JSON.stringify(data?.users ?? []),
    ) as Record<string, unknown>[];
    users.push(...batch);
    if (batch.length < BACKUP_PAGE_SIZE) break;
    page++;
  }

  return users;
}

async function fetchAllKvEntries(
  client: any,
): Promise<Array<{ key: string; value: unknown }>> {
  const entries: Array<{ key: string; value: unknown }> = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from("kv_store_17cae920")
      .select("key, value")
      .order("key", { ascending: true })
      .range(offset, offset + BACKUP_PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Failed to fetch raw KV backup: ${error.message}`);
    }

    const page = (data ?? []) as Array<{ key: string; value: unknown }>;
    entries.push(...page);
    if (page.length < BACKUP_PAGE_SIZE) break;
    offset += BACKUP_PAGE_SIZE;
  }

  return entries;
}

function kvValuesForPrefix(
  entries: Array<{ key: string; value: unknown }>,
  prefix: string,
): unknown[] {
  return entries
    .filter((entry) => entry.key.startsWith(prefix))
    .map((entry) => entry.value);
}

function serializeSectionMap(
  sections: Record<string, readonly unknown[]>,
): string {
  return `{${Object.entries(sections)
    .map(
      ([name, rows]) => `${JSON.stringify(name)}:${JSON.stringify(rows)}`,
    )
    .join(",")}}`;
}

// Export all data as JSON backup (admin only)
app.post(
  "/make-server-17cae920/backup/export",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const startTime = Date.now();
      log.log("📦 Starting backup export...");
      const backupClient = _roleClient();
      const allKvEntries = await fetchAllKvEntries(backupClient);

      // Export all data categories from KV store
      const materials = kvValuesForPrefix(allKvEntries, "material:");
      const sources = kvValuesForPrefix(allKvEntries, "source:");
      const whitepapers = kvValuesForPrefix(allKvEntries, "whitepaper:");
      const evidence = kvValuesForPrefix(allKvEntries, "evidence:");
      const userProfiles = kvValuesForPrefix(allKvEntries, "user_profile:");
      const auditLogs = kvValuesForPrefix(allKvEntries, "audit:");
      const notifications = kvValuesForPrefix(allKvEntries, "notification:");
      const takedownRequests = kvValuesForPrefix(allKvEntries, "takedown:");
      const recomputeJobs = kvValuesForPrefix(allKvEntries, "recompute-job:");
      const submissions = kvValuesForPrefix(allKvEntries, "submission:");
      const roleRows = await fetchAllPostgresRows(backupClient, "user_profiles");
      const userRoles = roleRows.map((r: any) => ({
        key: `user_role:${r.id}`,
        value: r.role,
      }));

      // Create backup manifest
      const backup = {
        metadata: {
          version: "1.1",
          timestamp: new Date().toISOString(),
          exported_by: c.get("userId"),
          database_name: "WasteDB",
          total_records:
            materials.length +
            sources.length +
            whitepapers.length +
            evidence.length +
            userProfiles.length +
            userRoles.length +
            auditLogs.length +
            notifications.length +
            takedownRequests.length +
            recomputeJobs.length +
            submissions.length,
          export_duration_ms: 0, // Will be updated below
        },
        data: {
          materials,
          sources,
          whitepapers,
          evidence,
          user_profiles: userProfiles,
          user_roles: userRoles,
          audit_logs: auditLogs,
          notifications,
          takedown_requests: takedownRequests,
          recompute_jobs: recomputeJobs,
          submissions,
        },
        // Include transform definitions for reference
        transforms: TRANSFORMS_DATA,
      };

      const endTime = Date.now();
      backup.metadata.export_duration_ms = endTime - startTime;

      log.log(
        `✓ Backup export completed in ${backup.metadata.export_duration_ms}ms`,
      );
      log.log(`✓ Total records exported: ${backup.metadata.total_records}`);

      // Create audit log for backup export
      await createAuditLog({
        entity_type: "backup",
        entity_id: "export",
        action: "export",
        user_id: c.get("userId"),
        user_email: c.get("userEmail"),
        changes: {
          total_records: backup.metadata.total_records,
          duration_ms: backup.metadata.export_duration_ms,
        },
        ip_address:
          c.req.header("x-forwarded-for") ||
          c.req.header("x-real-ip") ||
          "unknown",
      });

      return c.json(backup);
    } catch (error) {
      log.error("Error exporting backup:", error);
      return c.json(
        { error: "Failed to export backup", details: String(error) },
        500,
      );
    }
  },
);

// Import/restore data from JSON backup (admin only)
app.post(
  "/make-server-17cae920/backup/import",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const startTime = Date.now();
      const body = await c.req.json();
      const { backup, mode = "merge" } = body; // mode: 'merge' or 'replace'

      log.log(`📥 Starting backup import in ${mode} mode...`);

      // Validate backup structure
      if (!backup || !backup.metadata || !backup.data) {
        return c.json({ error: "Invalid backup format" }, 400);
      }

      log.log(`📋 Backup metadata:`, {
        version: backup.metadata.version,
        timestamp: backup.metadata.timestamp,
        total_records: backup.metadata.total_records,
      });

      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const unresolvedRecords: Array<{
        category: string;
        reason: string;
        record: unknown;
      }> = [];

      // If replace mode, we would need to clear existing data first
      // For safety, we'll only support merge mode for now
      if (mode === "replace") {
        return c.json(
          {
            error:
              "Replace mode not supported for safety reasons. Use merge mode instead.",
            hint: "Merge mode will update existing records and add new ones without deleting.",
          },
          400,
        );
      }

      // Import each data category
      const categories = [
        {
          name: "materials",
          data: backup.data.materials || [],
          prefix: "material:",
        },
        { name: "sources", data: backup.data.sources || [], prefix: "source:" },
        {
          name: "whitepapers",
          data: backup.data.whitepapers || [],
          prefix: "whitepaper:",
        },
        {
          name: "evidence",
          data: backup.data.evidence || [],
          prefix: "evidence:",
        },
        {
          name: "user_profiles",
          data: backup.data.user_profiles || [],
          prefix: "user_profile:",
        },
        { name: "users", data: backup.data.users || [], prefix: "user:" },
        {
          name: "audit_logs",
          data: backup.data.audit_logs || [],
          prefix: "audit:",
        },
        {
          name: "notifications",
          data: backup.data.notifications || [],
          prefix: "notification:",
        },
        {
          name: "takedown_requests",
          data: backup.data.takedown_requests || [],
          prefix: "takedown:",
        },
        {
          name: "recompute_jobs",
          data: backup.data.recompute_jobs || [],
          prefix: "recompute-job:",
        },
        {
          name: "submissions",
          data: backup.data.submissions || [],
          prefix: "submission:",
        },
      ];

      for (const category of categories) {
        log.log(
          `📂 Importing ${category.name}: ${category.data.length} records...`,
        );

        for (const record of category.data) {
          try {
            if (record && record.id) {
              await kv.set(`${category.prefix}${record.id}`, record);
              importedCount++;
            } else {
              console.warn(
                `⚠️ Skipping invalid record in ${category.name}:`,
                record,
              );
              skippedCount++;
              unresolvedRecords.push({
                category: category.name,
                reason: "Record is missing an id",
                record,
              });
            }
          } catch (err) {
            log.error(`❌ Error importing record in ${category.name}:`, err);
            errorCount++;
            unresolvedRecords.push({
              category: category.name,
              reason: String(err),
              record,
            });
          }
        }
      }

      // Preserve role records in the legacy KV namespace. The existing,
      // idempotent admin role-seed action applies them to Postgres after review.
      for (const record of backup.data.user_roles || []) {
        try {
          if (
            record &&
            typeof record.key === "string" &&
            record.key.startsWith("user_role:") &&
            typeof record.value === "string"
          ) {
            await kv.set(record.key, record.value);
            importedCount++;
          } else {
            skippedCount++;
            unresolvedRecords.push({
              category: "user_roles",
              reason:
                "Role record must contain a user_role:* key and string value",
              record,
            });
          }
        } catch (err) {
          errorCount++;
          unresolvedRecords.push({
            category: "user_roles",
            reason: String(err),
            record,
          });
        }
      }

      const supportedCategories = new Set([
        ...categories.map((category) => category.name),
        "user_roles",
      ]);
      for (const [category, records] of Object.entries(backup.data)) {
        if (!supportedCategories.has(category)) {
          const values = Array.isArray(records) ? records : [records];
          skippedCount += values.length;
          for (const record of values) {
            unresolvedRecords.push({
              category,
              reason:
                "Unsupported legacy category; original payload remains in the source backup",
              record,
            });
          }
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      log.log(`✓ Backup import completed in ${duration}ms`);
      log.log(
        `✓ Imported: ${importedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
      );

      // Create audit log for backup import
      await createAuditLog({
        entity_type: "backup",
        entity_id: "import",
        action: "import",
        user_id: c.get("userId"),
        user_email: c.get("userEmail"),
        changes: {
          mode,
          imported_count: importedCount,
          skipped_count: skippedCount,
          error_count: errorCount,
          unresolved_count: unresolvedRecords.length,
          duration_ms: duration,
          backup_metadata: backup.metadata,
        },
        ip_address:
          c.req.header("x-forwarded-for") ||
          c.req.header("x-real-ip") ||
          "unknown",
      });

      return c.json({
        success: errorCount === 0 && unresolvedRecords.length === 0,
        complete: errorCount === 0 && unresolvedRecords.length === 0,
        imported: importedCount,
        skipped: skippedCount,
        errors: errorCount,
        unresolved_records: unresolvedRecords,
        next_action:
          unresolvedRecords.length > 0
            ? "Review unresolved_records before considering recovery complete."
            : "Run the idempotent admin role-seed action if user_roles were restored.",
        duration_ms: duration,
        backup_info: {
          version: backup.metadata.version,
          timestamp: backup.metadata.timestamp,
          original_total: backup.metadata.total_records,
        },
      });
    } catch (error) {
      log.error("Error importing backup:", error);
      return c.json(
        { error: "Failed to import backup", details: String(error) },
        500,
      );
    }
  },
);

// Validate backup file integrity (admin only)
app.post(
  "/make-server-17cae920/backup/validate",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const body = await c.req.json();
      const { backup } = body;

      const issues: string[] = [];
      const warnings: string[] = [];

      // Check backup structure
      if (!backup) {
        issues.push("Backup object is missing");
        return c.json({ valid: false, issues, warnings });
      }

      if (!backup.metadata) {
        issues.push("Backup metadata is missing");
      } else {
        if (!backup.metadata.version && !backup.metadata.schema_version)
          warnings.push("Backup version not specified");
        if (!backup.metadata.timestamp)
          warnings.push("Backup timestamp not specified");
        if (!backup.metadata.exported_by)
          warnings.push("Export user not specified");
      }

      if (backup.kv_data && backup.postgres_data) {
        const rowCounts = backup.manifest?.row_counts ?? {};
        const checksums = backup.manifest?.checksums ?? {};
        const sectionStats: Record<string, number> = {};
        const schemaVersion = backup.metadata?.schema_version;
        const isFullSiteBackup =
          backup.metadata?.format === "wastedb-full-site";
        const supportedSchemaVersions = new Set(["3.0", "4.0"]);
        if (
          isFullSiteBackup &&
          !supportedSchemaVersions.has(schemaVersion)
        ) {
          issues.push(
            `Unsupported full-site backup schema version '${schemaVersion ?? "missing"}'`,
          );
        }
        const requiresCompleteManifest =
          supportedSchemaVersions.has(schemaVersion) || isFullSiteBackup;
        const requiredPostgresTables =
          schemaVersion === "4.0"
            ? FULL_BACKUP_POSTGRES_TABLES
            : FULL_BACKUP_BASE_POSTGRES_TABLES;
        if (requiresCompleteManifest) {
          if (
            !backup.metadata?.export_started_at ||
            !backup.metadata?.export_completed_at
          ) {
            issues.push("Full backup export start/completion timestamps are missing");
          }
          if (backup.manifest?.consistency?.writes_must_be_paused !== true) {
            issues.push("Full backup consistency contract is missing");
          } else {
            warnings.push(
              "Validator cannot prove writes were paused; confirm the pause window in the migration report",
            );
          }
        }

        for (const [namespace, sections] of Object.entries({
          kv: backup.kv_data,
          postgres: backup.postgres_data,
        })) {
          for (const [name, records] of Object.entries(
            sections as Record<string, unknown>,
          )) {
            const manifestName = `${namespace}.${name}`;
            if (!Array.isArray(records)) {
              issues.push(
                `Full backup section '${manifestName}' is not an array`,
              );
              continue;
            }

            sectionStats[manifestName] = records.length;
            const expectedCount = rowCounts[manifestName] ?? rowCounts[name];
            if (expectedCount === undefined) {
              const message = `Full backup section '${manifestName}' has no manifest row count`;
              if (requiresCompleteManifest) issues.push(message);
              else warnings.push(message);
            } else if (expectedCount !== records.length) {
              issues.push(
                `Full backup count mismatch for '${manifestName}': manifest says ${expectedCount}, found ${records.length}`,
              );
            }

            const expectedChecksum =
              checksums[manifestName] ?? checksums[name];
            if (expectedChecksum) {
              const actualChecksum = await checksumJson(records);
              if (actualChecksum !== expectedChecksum) {
                issues.push(
                  `Full backup checksum mismatch for '${manifestName}'`,
                );
              }
            } else {
              const message = `Full backup section '${manifestName}' has no checksum`;
              if (requiresCompleteManifest) issues.push(message);
              else warnings.push(message);
            }
          }
        }

        for (const table of requiredPostgresTables) {
          if (!Array.isArray(backup.postgres_data[table])) {
            issues.push(`Required Postgres table '${table}' is missing`);
          }
          if (
            requiresCompleteManifest &&
            !backup.manifest?.postgres_tables?.includes(table)
          ) {
            issues.push(`Required Postgres table '${table}' is not in manifest`);
          }
        }
        for (const section of FULL_BACKUP_KV_SECTIONS) {
          if (!Array.isArray(backup.kv_data[section])) {
            issues.push(`Required compatibility KV section '${section}' is missing`);
          }
          if (
            requiresCompleteManifest &&
            !backup.manifest?.kv_sections?.includes(section)
          ) {
            issues.push(
              `Required compatibility KV section '${section}' is not in manifest`,
            );
          }
        }
        if (Array.isArray(backup.kv_all_entries)) {
          sectionStats.kv_all_entries = backup.kv_all_entries.length;
          const invalidRawEntries = backup.kv_all_entries.filter(
            (entry: any) => !entry || typeof entry.key !== "string",
          );
          if (invalidRawEntries.length > 0) {
            issues.push(
              `Raw KV snapshot has ${invalidRawEntries.length} entries without valid keys`,
            );
          }
          const rawKeys = backup.kv_all_entries.map((entry: any) => entry.key);
          if (new Set(rawKeys).size !== rawKeys.length) {
            issues.push("Raw KV snapshot contains duplicate keys");
          }
          const expectedCount = rowCounts.kv_all_entries;
          if (expectedCount === undefined) {
            if (requiresCompleteManifest) {
              issues.push(
                "Full backup section 'kv_all_entries' has no manifest row count",
              );
            }
          } else if (expectedCount !== backup.kv_all_entries.length) {
            issues.push(
              `Full backup count mismatch for 'kv_all_entries': manifest says ${expectedCount}, found ${backup.kv_all_entries.length}`,
            );
          }

          if (checksums.kv_all_entries) {
            const actualChecksum = await checksumJson(backup.kv_all_entries);
            if (actualChecksum !== checksums.kv_all_entries) {
              issues.push("Full backup checksum mismatch for 'kv_all_entries'");
            }
          } else if (requiresCompleteManifest) {
            issues.push("Full backup section 'kv_all_entries' has no checksum");
          }
        } else if (requiresCompleteManifest) {
          issues.push(
            "Full backup raw KV snapshot 'kv_all_entries' is missing",
          );
        } else {
          warnings.push(
            "Older full backup has no raw KV snapshot; use categorized KV recovery",
          );
        }

        if (Array.isArray(backup.auth_users)) {
          sectionStats.auth_users = backup.auth_users.length;
          const invalidAuthUsers = backup.auth_users.filter(
            (user: any) => !user || typeof user.id !== "string",
          );
          if (invalidAuthUsers.length > 0) {
            issues.push(
              `Auth user metadata has ${invalidAuthUsers.length} records without valid ids`,
            );
          }
          const expectedCount = rowCounts.auth_users;
          if (expectedCount === undefined) {
            if (requiresCompleteManifest) {
              issues.push(
                "Full backup section 'auth_users' has no manifest row count",
              );
            }
          } else if (expectedCount !== backup.auth_users.length) {
            issues.push(
              `Full backup count mismatch for 'auth_users': manifest says ${expectedCount}, found ${backup.auth_users.length}`,
            );
          }

          if (checksums.auth_users) {
            const actualChecksum = await checksumJson(backup.auth_users);
            if (actualChecksum !== checksums.auth_users) {
              issues.push("Full backup checksum mismatch for 'auth_users'");
            }
          } else if (requiresCompleteManifest) {
            issues.push("Full backup section 'auth_users' has no checksum");
          }
        } else if (requiresCompleteManifest) {
          issues.push("Full backup auth user metadata 'auth_users' is missing");
        } else {
          warnings.push(
            "Older full backup has no auth user metadata; reconcile attribution manually",
          );
        }

        const postgresTotal = Object.entries(sectionStats)
          .filter(([name]) => name.startsWith("postgres."))
          .reduce((total, [, count]) => total + count, 0);
        const fallbackKvTotal = Object.entries(sectionStats)
          .filter(([name]) => name.startsWith("kv."))
          .reduce((total, [, count]) => total + count, 0);
        const totalRecords =
          (Array.isArray(backup.kv_all_entries)
            ? backup.kv_all_entries.length
            : fallbackKvTotal) +
          postgresTotal +
          (Array.isArray(backup.auth_users) ? backup.auth_users.length : 0);
        if (
          backup.metadata?.total_records !== undefined &&
          backup.metadata.total_records !== totalRecords
        ) {
          issues.push(
            `Full backup total mismatch: metadata says ${backup.metadata.total_records}, found ${totalRecords}`,
          );
        }

        return c.json({
          valid: issues.length === 0,
          issues,
          warnings,
          stats: {
            total_records: totalRecords,
            categories: sectionStats,
            metadata: backup.metadata,
          },
          restore_support: {
            automatic: false,
            reason:
              "Full-site relational restores require ordered, reviewed merge operations. Use the documented manual recovery procedure.",
            manual_requirements: [
              "Reconcile Auth user metadata; credentials and sessions are not restorable from JSON.",
              "Use a separately verified provider-level backup for storage object binaries.",
            ],
            manual_document:
              "src/docs/admin/OPERATIONS.md#full-site-manual-recovery",
            schema_version: schemaVersion,
            recovery_path:
              schemaVersion === "4.0"
                ? "Restore domain tables first, then graph tables, and reconcile both layers."
                : "Restore domain tables, then rerun the idempotent graph backfill if graph support is required.",
          },
        });
      }

      if (!backup.data) {
        issues.push("Backup data is missing");
        return c.json({ valid: false, issues, warnings });
      }

      // Check data categories
      const expectedCategories = [
        "materials",
        "sources",
        "whitepapers",
        "evidence",
        "audit_logs",
        "notifications",
        "takedown_requests",
        "recompute_jobs",
        "submissions",
      ];
      const userProfileCategory = backup.data.user_profiles
        ? "user_profiles"
        : "users";
      expectedCategories.push(userProfileCategory);
      if (backup.data.user_roles) expectedCategories.push("user_roles");

      let totalRecords = 0;
      const categoryStats: Record<string, number> = {};

      for (const category of expectedCategories) {
        if (!backup.data[category]) {
          warnings.push(`Category '${category}' is missing`);
          categoryStats[category] = 0;
        } else if (!Array.isArray(backup.data[category])) {
          issues.push(`Category '${category}' is not an array`);
          categoryStats[category] = 0;
        } else {
          categoryStats[category] = backup.data[category].length;
          totalRecords += backup.data[category].length;

          const invalidRecords = backup.data[category].filter((r: any) =>
            category === "user_roles"
              ? !r ||
                typeof r.key !== "string" ||
                !r.key.startsWith("user_role:") ||
                typeof r.value !== "string"
              : !r || !r.id,
          );
          if (invalidRecords.length > 0) {
            warnings.push(
              `Category '${category}' has ${invalidRecords.length} records without valid identifiers`,
            );
          }
        }
      }

      const knownCategories = new Set([
        ...expectedCategories,
        "users",
        "user_profiles",
        "user_roles",
      ]);
      for (const category of Object.keys(backup.data)) {
        if (!knownCategories.has(category)) {
          warnings.push(
            `Unsupported category '${category}' requires manual recovery; its payload remains in the backup`,
          );
        }
      }

      // Check if total matches metadata
      if (
        backup.metadata.total_records &&
        backup.metadata.total_records !== totalRecords
      ) {
        warnings.push(
          `Total record count mismatch: metadata says ${backup.metadata.total_records}, ` +
            `but found ${totalRecords}`,
        );
      }

      const valid = issues.length === 0;

      return c.json({
        valid,
        issues,
        warnings,
        stats: {
          total_records: totalRecords,
          categories: categoryStats,
          metadata: backup.metadata,
        },
      });
    } catch (error) {
      log.error("Error validating backup:", error);
      return c.json(
        {
          valid: false,
          issues: ["Failed to parse backup file: " + String(error)],
          warnings: [],
        },
        400,
      );
    }
  },
);

// Full site backup: every current Postgres domain table plus remaining KV data.
app.get(
  "/make-server-17cae920/backup/full-export",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const startTime = Date.now();
      const exportStartedAt = new Date().toISOString();
      log.log("📦 Starting full site backup export...");

      // Service role is required so drafts and restricted audit records are
      // included. This route is protected by verifyAdmin.
      const pgClient = _roleClient();
      const allKvEntries = await fetchAllKvEntries(pgClient);
      const authUsers = await fetchAllAuthUsers(pgClient);

      // Keep the categorized projection for old consumers while preserving
      // every raw key/value entry, including unknown namespaces.
      const materials = kvValuesForPrefix(allKvEntries, "material:");
      const sources = kvValuesForPrefix(allKvEntries, "source:");
      const whitepapers = kvValuesForPrefix(allKvEntries, "whitepaper:");
      const evidence = kvValuesForPrefix(allKvEntries, "evidence:");
      const userProfiles = kvValuesForPrefix(allKvEntries, "user_profile:");
      const auditLogs = kvValuesForPrefix(allKvEntries, "audit:");
      const notifications = kvValuesForPrefix(allKvEntries, "notification:");
      const takedownRequests = kvValuesForPrefix(allKvEntries, "takedown:");
      const recomputeJobs = kvValuesForPrefix(allKvEntries, "recompute-job:");
      const submissions = kvValuesForPrefix(allKvEntries, "submission:");

      const postgresData: Record<string, Record<string, unknown>[]> = {};
      for (const table of FULL_BACKUP_BASE_POSTGRES_TABLES) {
        postgresData[table] = await fetchAllPostgresRows(
          pgClient,
          table,
          FULL_BACKUP_ORDER_COLUMNS[table],
        );
      }
      const graphBackup = await fetchGraphBackupRows(pgClient);
      Object.assign(postgresData, graphBackup.rows);
      const schemaVersion = graphBackup.enabled ? "4.0" : "3.0";
      const postgresTables = graphBackup.enabled
        ? FULL_BACKUP_POSTGRES_TABLES
        : FULL_BACKUP_BASE_POSTGRES_TABLES;
      const userRoles = postgresData.user_profiles.map((record: any) => ({
        key: `user_role:${record.id}`,
        value: record.role,
      }));

      const kvTotal = allKvEntries.length;
      const postgresTotal = Object.values(postgresData).reduce(
        (total, rows) => total + rows.length,
        0,
      );
      const authTotal = authUsers.length;
      const kvData = {
        materials,
        sources,
        whitepapers,
        evidence,
        user_profiles: userProfiles,
        user_roles: userRoles,
        audit_logs: auditLogs,
        notifications,
        takedown_requests: takedownRequests,
        recompute_jobs: recomputeJobs,
        submissions,
      };
      const rowCounts: Record<string, number> = {};
      const checksums: Record<string, string> = {};
      for (const [name, rows] of Object.entries(kvData)) {
        rowCounts[`kv.${name}`] = rows.length;
        checksums[`kv.${name}`] = await checksumJson(rows);
      }
      for (const [name, rows] of Object.entries(postgresData)) {
        rowCounts[`postgres.${name}`] = rows.length;
        checksums[`postgres.${name}`] = await checksumJson(rows);
      }
      rowCounts.kv_all_entries = allKvEntries.length;
      checksums.kv_all_entries = await checksumJson(allKvEntries);
      rowCounts.auth_users = authUsers.length;
      checksums.auth_users = await checksumJson(authUsers);

      const backup = {
        metadata: {
          schema_version: schemaVersion,
          format: "wastedb-full-site",
          timestamp: exportStartedAt,
          export_started_at: exportStartedAt,
          export_completed_at: "",
          exported_by: c.get("userId"),
          database_name: "WasteDB",
          kv_record_count: kvTotal,
          postgres_record_count: postgresTotal,
          auth_record_count: authTotal,
          total_records: kvTotal + postgresTotal + authTotal,
          export_duration_ms: 0,
        },
        manifest: {
          postgres_tables: [...postgresTables],
          kv_sections: [...FULL_BACKUP_KV_SECTIONS],
          row_counts: rowCounts,
          checksums,
          checksum_algorithm: "SHA-256",
          consistency: {
            transactional_snapshot: false,
            writes_must_be_paused: true,
          },
          compatibility: {
            legacy_kv_import_supported: true,
            pre_graph_schema_3_restore_supported: true,
            graph_schema_4_restore_supported: graphBackup.enabled,
            automatic_full_restore_supported: false,
            auth_credentials_restore_supported: false,
            storage_binaries_included: false,
            provider_storage_backup_required: true,
            manual_recovery_document:
              "src/docs/admin/OPERATIONS.md#full-site-manual-recovery",
          },
        },
        auth_users: authUsers,
        kv_all_entries: allKvEntries,
        kv_data: kvData,
        postgres_data: postgresData,
        transforms: TRANSFORMS_DATA,
      };

      backup.metadata.export_duration_ms = Date.now() - startTime;
      backup.metadata.export_completed_at = new Date().toISOString();

      log.log(
        `✓ Full site backup completed in ${backup.metadata.export_duration_ms}ms`,
      );
      log.log(
        `✓ KV records: ${kvTotal}, Postgres records: ${postgresTotal}, Auth metadata records: ${authTotal}`,
      );

      await createAuditLog({
        entity_type: "backup",
        entity_id: "full-export",
        action: "export",
        user_id: c.get("userId"),
        user_email: c.get("userEmail"),
        changes: {
          schema_version: backup.metadata.schema_version,
          kv_record_count: kvTotal,
          postgres_record_count: postgresTotal,
          auth_record_count: authTotal,
          total_records: backup.metadata.total_records,
          duration_ms: backup.metadata.export_duration_ms,
        },
        ip_address:
          c.req.header("x-forwarded-for") ||
          c.req.header("x-real-ip") ||
          "unknown",
      });

      // Serialize large sections independently to avoid the nested-array issue
      // previously observed in the edge runtime.
      const responseBody =
        `{"metadata":${JSON.stringify(backup.metadata)}` +
        `,"manifest":${JSON.stringify(backup.manifest)}` +
        `,"auth_users":${JSON.stringify(backup.auth_users)}` +
        `,"kv_all_entries":${JSON.stringify(backup.kv_all_entries)}` +
        `,"kv_data":${serializeSectionMap(backup.kv_data)}` +
        `,"postgres_data":${serializeSectionMap(backup.postgres_data)}` +
        `,"transforms":${JSON.stringify(backup.transforms)}}`;
      return new Response(responseBody, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      log.error("Error exporting full site backup:", error);
      return c.json(
        { error: "Failed to export full site backup", details: String(error) },
        500,
      );
    }
  },
);

// Debug endpoint to list all Phase 9.1 routes
app.get("/make-server-17cae920/debug/phase91-status", (c) => {
  return c.json({
    status: "Phase 9.1 routes should be active",
    routes: [
      "PATCH /evidence/:id/validation",
      "POST /aggregations",
      "GET /aggregations/material/:materialId/stats",
      "GET /aggregations/material/:materialId/history",
      "GET /aggregations/material/:materialId",
      "GET /aggregations/:id",
      "GET /sources/:sourceRef/can-delete",
    ],
    note: "Removed conflicting route: GET /aggregations/:materialId/:parameterCode",
    message: "If you are seeing this, the server started successfully",
  });
});

// ==================== GUIDE ROUTES ====================

// Helper: recursively extract plain text from a Tiptap JSON node
function extractTiptapText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (!node.content || !Array.isArray(node.content)) return "";
  return node.content.map(extractTiptapText).join(" ");
}

// Helper: estimate read time in minutes from Tiptap JSON content
// Uses 200 words-per-minute; minimum 1 minute.
function estimateReadTimeMinutes(content: any): number {
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    const text = extractTiptapText(parsed);
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  } catch {
    return 1;
  }
}

// Helper: build the canonical public permalink for a guide
const GUIDE_BASE_URL = "https://db.wastefull.org/guides";
function buildGuidePermalink(slug: string): string {
  return `${GUIDE_BASE_URL}/${slug}`;
}

// Helper: annotate a guide record with computed public fields
function annotateGuide(guide: any): any {
  return {
    ...guide,
    read_time_estimate: estimateReadTimeMinutes(guide.content),
    permalink: buildGuidePermalink(guide.slug),
  };
}

// Get published guides (with optional filters)
app.get("/make-server-17cae920/guides", rateLimit("API"), async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const status = c.req.query("status") || "published";
    const method = c.req.query("method");
    const limitParam = c.req.query("limit");
    const limit = limitParam
      ? Math.min(parseInt(limitParam, 10), 100)
      : undefined;

    let query = supabase
      .from("guides")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (method) {
      query = query.eq("method", method);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      log.error("Error fetching guides:", error);
      return c.json(
        {
          error: "Failed to fetch guides",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        500,
      );
    }

    return c.json((data || []).map(annotateGuide));
  } catch (error) {
    log.error("Error fetching guides:", error);
    return c.json(
      { error: "Failed to fetch guides", details: String(error) },
      500,
    );
  }
});

// Get guide by slug
app.get("/make-server-17cae920/guides/:slug", rateLimit("API"), async (c) => {
  try {
    const slug = c.req.param("slug");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("guides")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) {
      log.error("Error fetching guide by slug:", error);
      return c.json({ error: "Guide not found" }, 404);
    }

    return c.json(annotateGuide(data));
  } catch (error) {
    log.error("Error fetching guide by slug:", error);
    return c.json(
      { error: "Failed to fetch guide", details: String(error) },
      500,
    );
  }
});

// Get guide by ID
app.get(
  "/make-server-17cae920/guides/by-id/:id",
  rateLimit("API"),
  async (c) => {
    try {
      const id = c.req.param("id");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );

      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        log.error("Error fetching guide by ID:", error);
        return c.json({ error: "Guide not found" }, 404);
      }

      return c.json(annotateGuide(data));
    } catch (error) {
      log.error("Error fetching guide by ID:", error);
      return c.json(
        { error: "Failed to fetch guide", details: String(error) },
        500,
      );
    }
  },
);

// Get current user's guides
app.get("/make-server-17cae920/guides/my-guides", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("guides")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      log.error("Error fetching my guides:", error);
      return c.json({ error: "Failed to fetch guides" }, 500);
    }

    return c.json(data || []);
  } catch (error) {
    log.error("Error fetching my guides:", error);
    return c.json(
      { error: "Failed to fetch guides", details: String(error) },
      500,
    );
  }
});

// Create a new guide
app.post(
  "/make-server-17cae920/guides",
  verifyAuth,
  requirePermission("guides.create"),
  async (c) => {
    try {
      const userId = c.get("userId");
      const userEmail = c.get("userEmail");
      const guideData = await c.req.json();

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Get author name from user
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const authorName =
        userData?.user?.user_metadata?.name || userEmail || "Anonymous";

      // Get material name if material_id is provided
      let materialName: string | undefined;
      if (guideData.material_id) {
        const materials = await kv.getByPrefix("material:");
        const material = materials?.find(
          (m: any) => m.id === guideData.material_id,
        );
        materialName = material?.name;
      }

      const { data, error } = await supabase
        .from("guides")
        .insert({
          ...guideData,
          created_by: userId,
          author_name: authorName,
          material_name: materialName,
          status: "published", // Auto-publish for now
          published_at: new Date().toISOString(),
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        log.error("Error creating guide:", error);
        return c.json({ error: "Failed to create guide" }, 500);
      }

      // Audit log
      await createAuditLog({
        userId,
        userEmail,
        entityType: "guide",
        entityId: data.id,
        action: "create",
        after: data,
        req: c,
      });

      return c.json(data);
    } catch (error) {
      log.error("Error creating guide:", error);
      return c.json(
        { error: "Failed to create guide", details: String(error) },
        500,
      );
    }
  },
);

// Update a guide
app.patch("/make-server-17cae920/guides/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");
    const updates = await c.req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get material name if material_id changed
    let materialName: string | undefined;
    if (updates.material_id) {
      const materials = await kv.getByPrefix("material:");
      const material = materials?.find(
        (m: any) => m.id === updates.material_id,
      );
      materialName = material?.name;
    }

    const { data: before } = await supabase
      .from("guides")
      .select("*")
      .eq("id", id)
      .single();

    if (!before) {
      return c.json({ error: "Guide not found" }, 404);
    }

    // Check permission (author with edit.own, or edit.any)
    const isOwner = before.created_by === userId;
    const canEditOwn =
      isOwner && (await hasPermission(userId, "guides.edit.own"));
    const canEditAny = await hasPermission(userId, "guides.edit.any");
    if (!canEditOwn && !canEditAny) {
      return c.json(
        { error: "Unauthorized - you can only edit your own guides" },
        403,
      );
    }

    const { data, error } = await supabase
      .from("guides")
      .update({
        ...updates,
        material_name: materialName,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      log.error("Error updating guide:", error);
      return c.json({ error: "Failed to update guide" }, 500);
    }

    // Audit log
    await createAuditLog({
      userId,
      userEmail,
      entityType: "guide",
      entityId: id,
      action: "update",
      before,
      after: data,
      req: c,
    });

    return c.json(data);
  } catch (error) {
    log.error("Error updating guide:", error);
    return c.json(
      { error: "Failed to update guide", details: String(error) },
      500,
    );
  }
});

// Delete a guide
app.delete("/make-server-17cae920/guides/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: before } = await supabase
      .from("guides")
      .select("*")
      .eq("id", id)
      .single();

    if (!before) {
      return c.json({ error: "Guide not found" }, 404);
    }

    // Check permission (author with delete.own, or delete.any)
    const isOwner = before.created_by === userId;
    const canDeleteOwn =
      isOwner && (await hasPermission(userId, "guides.delete.own"));
    const canDeleteAny = await hasPermission(userId, "guides.delete.any");
    if (!canDeleteOwn && !canDeleteAny) {
      return c.json(
        { error: "Unauthorized - you can only delete your own guides" },
        403,
      );
    }

    const { error } = await supabase.from("guides").delete().eq("id", id);

    if (error) {
      log.error("Error deleting guide:", error);
      return c.json({ error: "Failed to delete guide" }, 500);
    }

    // Audit log
    await createAuditLog({
      userId,
      userEmail,
      entityType: "guide",
      entityId: id,
      action: "delete",
      before,
      req: c,
    });

    return c.json({ success: true });
  } catch (error) {
    log.error("Error deleting guide:", error);
    return c.json(
      { error: "Failed to delete guide", details: String(error) },
      500,
    );
  }
});

// Increment guide views
app.post(
  "/make-server-17cae920/guides/:id/views",
  rateLimit("API"),
  async (c) => {
    try {
      const id = c.req.param("id");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Get current view count
      const { data: guide } = await supabase
        .from("guides")
        .select("views_count")
        .eq("id", id)
        .single();

      if (guide) {
        await supabase
          .from("guides")
          .update({ views_count: (guide.views_count || 0) + 1 })
          .eq("id", id);
      }

      return c.json({ success: true });
    } catch (error) {
      log.error("Error incrementing guide views:", error);
      return c.json(
        { error: "Failed to increment views", details: String(error) },
        500,
      );
    }
  },
);

// Search guides
app.get("/make-server-17cae920/guides/search", rateLimit("API"), async (c) => {
  try {
    const query = c.req.query("q") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("guides")
      .select("*")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      log.error("Error searching guides:", error);
      return c.json({ error: "Failed to search guides" }, 500);
    }

    return c.json(data || []);
  } catch (error) {
    log.error("Error searching guides:", error);
    return c.json(
      { error: "Failed to search guides", details: String(error) },
      500,
    );
  }
});

// ==================== END GUIDE ROUTES ====================

// ==================== BLOG ROUTES ====================

function isValidDateOnlyString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function sanitizeChangelogItems(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) =>
      typeof item === "string" ? item.replace(/^[-*•]\s*/, "").trim() : "",
    )
    .filter((item) => item.length > 0)
    .slice(0, 50);
}

// Get changelog entries
app.get("/make-server-17cae920/blog/changelog", rateLimit("API"), async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const requestedLimit = Number(c.req.query("limit") || "90");
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 365)
      : 90;

    const { data, error } = await supabase
      .from("changelog_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .limit(limit);

    if (error) {
      log.error("Error fetching changelog entries:", error);
      return c.json({ error: "Failed to fetch changelog entries" }, 500);
    }

    return c.json(data || []);
  } catch (error) {
    log.error("Error fetching changelog entries:", error);
    return c.json(
      { error: "Failed to fetch changelog entries", details: String(error) },
      500,
    );
  }
});

// Get changelog entry by date
app.get(
  "/make-server-17cae920/blog/changelog/:date",
  rateLimit("API"),
  async (c) => {
    try {
      const entryDate = c.req.param("date");
      if (!isValidDateOnlyString(entryDate)) {
        return c.json({ error: "Invalid changelog date" }, 400);
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );

      const { data, error } = await supabase
        .from("changelog_entries")
        .select("*")
        .eq("entry_date", entryDate)
        .maybeSingle();

      if (error) {
        log.error("Error fetching changelog entry:", error);
        return c.json({ error: "Failed to fetch changelog entry" }, 500);
      }

      if (!data) {
        return c.json({ error: "Changelog entry not found" }, 404);
      }

      return c.json(data);
    } catch (error) {
      log.error("Error fetching changelog entry:", error);
      return c.json(
        { error: "Failed to fetch changelog entry", details: String(error) },
        500,
      );
    }
  },
);

// Create or update a changelog entry (admin only)
app.put(
  "/make-server-17cae920/blog/changelog/:date",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const entryDate = c.req.param("date");
      const userId = c.get("userId");
      const userEmail = c.get("userEmail");

      if (!isValidDateOnlyString(entryDate)) {
        return c.json({ error: "Invalid changelog date" }, 400);
      }

      const body = await c.req.json();
      const items = sanitizeChangelogItems(body.items);

      if (items.length === 0) {
        return c.json(
          { error: "Changelog entries must include at least one bullet" },
          400,
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data: before, error: beforeError } = await supabase
        .from("changelog_entries")
        .select("*")
        .eq("entry_date", entryDate)
        .maybeSingle();

      if (beforeError) {
        log.error("Error fetching existing changelog entry:", beforeError);
        return c.json({ error: "Failed to save changelog entry" }, 500);
      }

      const query = before
        ? supabase
            .from("changelog_entries")
            .update({ items })
            .eq("id", before.id)
        : supabase.from("changelog_entries").insert({
            entry_date: entryDate,
            items,
            created_by: userId,
          });

      const { data, error } = await query.select().single();

      if (error) {
        log.error("Error saving changelog entry:", error);
        return c.json({ error: "Failed to save changelog entry" }, 500);
      }

      await createAuditLog({
        userId,
        userEmail,
        entityType: "changelog_entry",
        entityId: data.id,
        action: before ? "update" : "create",
        before: before || undefined,
        after: data,
        req: c,
      });

      return c.json(data);
    } catch (error) {
      log.error("Error saving changelog entry:", error);
      return c.json(
        { error: "Failed to save changelog entry", details: String(error) },
        500,
      );
    }
  },
);

// Delete a changelog entry (admin only)
app.delete(
  "/make-server-17cae920/blog/changelog/:date",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    try {
      const entryDate = c.req.param("date");
      const userId = c.get("userId");
      const userEmail = c.get("userEmail");

      if (!isValidDateOnlyString(entryDate)) {
        return c.json({ error: "Invalid changelog date" }, 400);
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data: before, error: beforeError } = await supabase
        .from("changelog_entries")
        .select("*")
        .eq("entry_date", entryDate)
        .maybeSingle();

      if (beforeError) {
        log.error("Error fetching changelog entry for delete:", beforeError);
        return c.json({ error: "Failed to delete changelog entry" }, 500);
      }

      if (!before) {
        return c.json({ error: "Changelog entry not found" }, 404);
      }

      const { error } = await supabase
        .from("changelog_entries")
        .delete()
        .eq("id", before.id);

      if (error) {
        log.error("Error deleting changelog entry:", error);
        return c.json({ error: "Failed to delete changelog entry" }, 500);
      }

      await createAuditLog({
        userId,
        userEmail,
        entityType: "changelog_entry",
        entityId: before.id,
        action: "delete",
        before,
        req: c,
      });

      return c.json({ success: true });
    } catch (error) {
      log.error("Error deleting changelog entry:", error);
      return c.json(
        { error: "Failed to delete changelog entry", details: String(error) },
        500,
      );
    }
  },
);

// Get published blog posts (with optional filters)
app.get("/make-server-17cae920/blog", rateLimit("API"), async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const status = c.req.query("status") || "published";
    const category = c.req.query("category");

    let query = supabase
      .from("blog_posts")
      .select("*")
      .eq("status", status)
      .order("published_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      log.error("Error fetching blog posts:", error);
      return c.json(
        {
          error: "Failed to fetch blog posts",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        500,
      );
    }

    return c.json(data || []);
  } catch (error) {
    log.error("Error fetching blog posts:", error);
    return c.json(
      { error: "Failed to fetch blog posts", details: String(error) },
      500,
    );
  }
});

// Get blog post by slug
app.get("/make-server-17cae920/blog/:slug", rateLimit("API"), async (c) => {
  try {
    const slug = c.req.param("slug");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) {
      log.error("Error fetching blog post by slug:", error);
      return c.json({ error: "Blog post not found" }, 404);
    }

    return c.json(data);
  } catch (error) {
    log.error("Error fetching blog post by slug:", error);
    return c.json(
      { error: "Failed to fetch blog post", details: String(error) },
      500,
    );
  }
});

// Get blog post by ID
app.get("/make-server-17cae920/blog/by-id/:id", rateLimit("API"), async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      log.error("Error fetching blog post by ID:", error);
      return c.json({ error: "Blog post not found" }, 404);
    }

    return c.json(data);
  } catch (error) {
    log.error("Error fetching blog post by ID:", error);
    return c.json(
      { error: "Failed to fetch blog post", details: String(error) },
      500,
    );
  }
});

// Get current user's blog posts
app.get("/make-server-17cae920/blog/my-posts", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      log.error("Error fetching my blog posts:", error);
      return c.json({ error: "Failed to fetch blog posts" }, 500);
    }

    return c.json(data || []);
  } catch (error) {
    log.error("Error fetching my blog posts:", error);
    return c.json(
      { error: "Failed to fetch blog posts", details: String(error) },
      500,
    );
  }
});

// Create a new blog post
app.post(
  "/make-server-17cae920/blog",
  verifyAuth,
  requirePermission("blog.create"),
  async (c) => {
    try {
      const userId = c.get("userId");
      const userEmail = c.get("userEmail");
      const postData = await c.req.json();

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Get author name from user
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const authorName =
        userData?.user?.user_metadata?.name || userEmail || "Anonymous";

      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          ...postData,
          created_by: userId,
          author_name: authorName,
          status: "published", // Auto-publish for now
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        log.error("Error creating blog post:", error);
        return c.json({ error: "Failed to create blog post" }, 500);
      }

      // Audit log
      await createAuditLog({
        userId,
        userEmail,
        entityType: "blog_post",
        entityId: data.id,
        action: "create",
        after: data,
        req: c,
      });

      return c.json(data);
    } catch (error) {
      log.error("Error creating blog post:", error);
      return c.json(
        { error: "Failed to create blog post", details: String(error) },
        500,
      );
    }
  },
);

// Update a blog post
app.patch("/make-server-17cae920/blog/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");
    const updates = await c.req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: before } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (!before) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    // Check permission (author with edit.own, or edit.any)
    const isOwner = before.created_by === userId;
    const canEditOwn =
      isOwner && (await hasPermission(userId, "blog.edit.own"));
    const canEditAny = await hasPermission(userId, "blog.edit.any");
    if (!canEditOwn && !canEditAny) {
      return c.json(
        { error: "Unauthorized - you can only edit your own posts" },
        403,
      );
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      log.error("Error updating blog post:", error);
      return c.json({ error: "Failed to update blog post" }, 500);
    }

    // Audit log
    await createAuditLog({
      userId,
      userEmail,
      entityType: "blog_post",
      entityId: id,
      action: "update",
      before,
      after: data,
      req: c,
    });

    return c.json(data);
  } catch (error) {
    log.error("Error updating blog post:", error);
    return c.json(
      { error: "Failed to update blog post", details: String(error) },
      500,
    );
  }
});

// Delete a blog post
app.delete("/make-server-17cae920/blog/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: before } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (!before) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    // Check permission (author with delete.own, or delete.any)
    const isOwner = before.created_by === userId;
    const canDeleteOwn =
      isOwner && (await hasPermission(userId, "blog.delete.own"));
    const canDeleteAny = await hasPermission(userId, "blog.delete.any");
    if (!canDeleteOwn && !canDeleteAny) {
      return c.json(
        { error: "Unauthorized - you can only delete your own posts" },
        403,
      );
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      log.error("Error deleting blog post:", error);
      return c.json({ error: "Failed to delete blog post" }, 500);
    }

    // Audit log
    await createAuditLog({
      userId,
      userEmail,
      entityType: "blog_post",
      entityId: id,
      action: "delete",
      before,
      req: c,
    });

    return c.json({ success: true });
  } catch (error) {
    log.error("Error deleting blog post:", error);
    return c.json(
      { error: "Failed to delete blog post", details: String(error) },
      500,
    );
  }
});

// Increment blog post views
app.post(
  "/make-server-17cae920/blog/:id/views",
  rateLimit("API"),
  async (c) => {
    try {
      const id = c.req.param("id");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Get current view count
      const { data: post } = await supabase
        .from("blog_posts")
        .select("views_count")
        .eq("id", id)
        .single();

      if (post) {
        await supabase
          .from("blog_posts")
          .update({ views_count: (post.views_count || 0) + 1 })
          .eq("id", id);
      }

      return c.json({ success: true });
    } catch (error) {
      log.error("Error incrementing blog post views:", error);
      return c.json(
        { error: "Failed to increment views", details: String(error) },
        500,
      );
    }
  },
);

// Search blog posts
app.get("/make-server-17cae920/blog/search", rateLimit("API"), async (c) => {
  try {
    const query = c.req.query("q") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order("published_at", { ascending: false });

    if (error) {
      log.error("Error searching blog posts:", error);
      return c.json({ error: "Failed to search blog posts" }, 500);
    }

    return c.json(data || []);
  } catch (error) {
    log.error("Error searching blog posts:", error);
    return c.json(
      { error: "Failed to search blog posts", details: String(error) },
      500,
    );
  }
});

// ==================== END BLOG ROUTES ====================

// Catch-all 404 handler for debugging - MUST be last route
app.all("*", (c) => {
  log.log(`❌ 404 - Unmatched route: ${c.req.method} ${c.req.url}`);
  log.log(`❌ Path: ${c.req.path}`);
  return c.json({ error: "Not found", path: c.req.path }, 404);
});

log.log(
  "✅ Phase 9.1 routes implemented inline (no external module imports needed)",
);

// Run initialization
initializeWhitepapers();

Deno.serve(app.fetch);
