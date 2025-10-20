import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

// WasteDB Server - v1.0.2
const app = new Hono();

// Add logger middleware
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify authentication
async function verifyAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - missing token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  
  // Skip verification for public anon key (for backward compatibility during development)
  const publicAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (token === publicAnonKey) {
    await next();
    return;
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }
    
    // Store user ID and email in context for use in route handlers
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

// Sign up endpoint (public)
app.post("/make-server-17cae920/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split('@')[0] },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true,
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message || 'Failed to create user' }, 400);
    }

    return c.json({ 
      user: { 
        id: data.user.id, 
        email: data.user.email,
        name: data.user.user_metadata?.name 
      } 
    });
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({ error: 'Server error during signup', details: String(error) }, 500);
  }
});

// Sign in endpoint (public)
app.post("/make-server-17cae920/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Signin error:', error);
      return c.json({ error: error.message || 'Invalid credentials' }, 401);
    }

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
    return c.json({ error: 'Server error during signin', details: String(error) }, 500);
  }
});

// Get all materials (protected)
app.get("/make-server-17cae920/materials", verifyAuth, async (c) => {
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
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');
    
    let userRole = await kv.get(`user_role:${userId}`);
    
    // Initialize role if not set
    if (!userRole) {
      userRole = (userEmail === 'natto@wastefull.org') ? 'admin' : 'user';
      await kv.set(`user_role:${userId}`, userRole);
    }
    
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

// ==================== WHITEPAPER ROUTES ====================

// Get all whitepapers (public, no auth required)
app.get('/make-server-17cae920/whitepapers', async (c) => {
  try {
    const whitepapers = await kv.getByPrefix('whitepaper:');
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
        'Y (Yield)', 'D (Degradability)', 'C (Contamination)', 'M (Maturity)', 'E (Energy)',
        'CR Practical Mean', 'CR Practical CI Lower', 'CR Practical CI Upper',
        'CR Theoretical Mean', 'CR Theoretical CI Lower', 'CR Theoretical CI Upper',
        'Compostability (0-100)', 'Recyclability (0-100)', 'Reusability (0-100)',
        'Confidence Level', 'Source Count', 'Whitepaper Version', 'Method Version',
        'Calculation Timestamp'
      ];
      
      const rows = materials.map(m => [
        m.id,
        m.name,
        m.category,
        m.description || '',
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

// Run initialization
initializeAdminUser();
initializeWhitepapers();

Deno.serve(app.fetch);