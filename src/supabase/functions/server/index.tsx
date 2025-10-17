import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
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

// Health check endpoint
app.get("/make-server-17cae920/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all materials
app.get("/make-server-17cae920/materials", async (c) => {
  try {
    const materials = await kv.getByPrefix("material:");
    return c.json({ materials: materials || [] });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return c.json({ error: "Failed to fetch materials", details: String(error) }, 500);
  }
});

// Create a new material
app.post("/make-server-17cae920/materials", async (c) => {
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

// Batch save materials
app.post("/make-server-17cae920/materials/batch", async (c) => {
  try {
    const { materials } = await c.req.json();
    if (!Array.isArray(materials)) {
      return c.json({ error: "Materials must be an array" }, 400);
    }
    
    // Use mset for batch operations
    const kvPairs = materials.map(m => [`material:${m.id}`, m] as [string, any]);
    await kv.mset(kvPairs);
    
    return c.json({ success: true, count: materials.length });
  } catch (error) {
    console.error("Error batch saving materials:", error);
    return c.json({ error: "Failed to batch save materials", details: String(error) }, 500);
  }
});

// Update a material
app.put("/make-server-17cae920/materials/:id", async (c) => {
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

// Delete a material
app.delete("/make-server-17cae920/materials/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`material:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return c.json({ error: "Failed to delete material", details: String(error) }, 500);
  }
});

// Delete all materials
app.delete("/make-server-17cae920/materials", async (c) => {
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

Deno.serve(app.fetch);