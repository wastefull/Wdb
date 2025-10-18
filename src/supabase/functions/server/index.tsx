import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
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

Deno.serve(app.fetch);