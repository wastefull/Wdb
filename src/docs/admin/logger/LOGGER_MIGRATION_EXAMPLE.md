# Logger Migration Example

**Date:** October 23, 2025  
**Status:** Reference Document

## Overview

This document demonstrates how to migrate existing `console.*` calls to the new WasteDB logger system.

---

## Quick Reference

### Import Statement

```typescript
// Add to top of file
import { logger } from "./utils/logger";

// Or import individual functions
import { log, error, warn, info } from "./utils/logger";
```

### Basic Replacement

```typescript
// Before
console.log("Message");
console.error("Error:", err);
console.warn("Warning");
console.info("Info");

// After
import { log, error, warn, info } from "./utils/logger";

log("Message");
error("Error:", err); // Errors always log
warn("Warning");
info("Info");
```

---

## Example: App.tsx Magic Link Authentication

### Before Migration

```typescript
// Magic link authentication flow
if (magicToken) {
  console.log("Detected magic token in URL, verifying...");
  try {
    const response = await api.verifyMagicLink(magicToken);
    console.log("Magic link verification response:", response);

    if (response.access_token && response.user) {
      console.log(
        "App.tsx: Storing access token again:",
        response.access_token.substring(0, 8) + "..."
      );
      api.setAccessToken(response.access_token);

      const storedToken = sessionStorage.getItem("wastedb_access_token");
      console.log(
        "App.tsx: Verified token in storage before getUserRole:",
        storedToken?.substring(0, 8) + "..."
      );

      console.log("App.tsx: About to fetch user role...");
      const role = await api.getUserRole();
      console.log("App.tsx: Got user role:", role);
      setUserRole(role);

      console.log("Magic link authentication successful");
      toast.success(`Welcome back, ${response.user.email}!`);
    }
  } catch (error) {
    console.error("Error processing magic link:", error);
    toast.error("Magic link verification failed");
  }
}
```

### After Migration

```typescript
import { log, error } from "./utils/logger";

// Magic link authentication flow
if (magicToken) {
  log("Detected magic token in URL, verifying...");
  try {
    const response = await api.verifyMagicLink(magicToken);
    log("Magic link verification response:", response);

    if (response.access_token && response.user) {
      log(
        "App.tsx: Storing access token again:",
        response.access_token.substring(0, 8) + "..."
      );
      api.setAccessToken(response.access_token);

      const storedToken = sessionStorage.getItem("wastedb_access_token");
      log(
        "App.tsx: Verified token in storage before getUserRole:",
        storedToken?.substring(0, 8) + "..."
      );

      log("App.tsx: About to fetch user role...");
      const role = await api.getUserRole();
      log("App.tsx: Got user role:", role);
      setUserRole(role);

      log("Magic link authentication successful");
      toast.success(`Welcome back, ${response.user.email}!`);
    }
  } catch (error) {
    error("Error processing magic link:", error); // Error always logs
    toast.error("Magic link verification failed");
  }
}
```

**Benefits:**

- ✅ Logs suppressed in production (unless TEST_MODE enabled)
- ✅ Errors still visible for debugging
- ✅ Can enable logging with `setTestMode(true)` if needed
- ✅ Clean production console

---

## Example: AuthView Component

### Before Migration

```typescript
useEffect(() => {
  logEnvironmentInfo();
  console.log("🔐 Auth View - Password auth enabled:", showPasswordAuth);
  console.log(
    "🔐 Initial auth mode:",
    showPasswordAuth ? "traditional" : "magic-link"
  );
}, [showPasswordAuth]);

useEffect(() => {
  if (showPasswordAuth && authMode === "magic-link") {
    console.log("🔄 Figma Make environment - using Password auth");
    setAuthMode("traditional");
  } else if (!showPasswordAuth && authMode === "traditional") {
    console.log("🔄 Production environment - using Magic Link auth");
    setAuthMode("magic-link");
  }
}, [authMode, showPasswordAuth]);
```

### After Migration

```typescript
import { log } from "./utils/logger";

useEffect(() => {
  logEnvironmentInfo();
  log("🔐 Auth View - Password auth enabled:", showPasswordAuth);
  log("🔐 Initial auth mode:", showPasswordAuth ? "traditional" : "magic-link");
}, [showPasswordAuth]);

useEffect(() => {
  if (showPasswordAuth && authMode === "magic-link") {
    log("🔄 Figma Make environment - using Password auth");
    setAuthMode("traditional");
  } else if (!showPasswordAuth && authMode === "traditional") {
    log("🔄 Production environment - using Magic Link auth");
    setAuthMode("magic-link");
  }
}, [authMode, showPasswordAuth]);
```

---

## Example: API Error Handling

### Before Migration

```typescript
async function fetchMaterials() {
  try {
    console.log("Fetching materials...");
    const data = await api.getMaterials();
    console.log("Materials fetched:", data.length);
    return data;
  } catch (err) {
    console.error("Failed to fetch materials:", err);
    throw err;
  }
}
```

### After Migration

```typescript
import { log, error } from "./utils/logger";

async function fetchMaterials() {
  try {
    log("Fetching materials...");
    const data = await api.getMaterials();
    log("Materials fetched:", data.length);
    return data;
  } catch (err) {
    error("Failed to fetch materials:", err); // Errors always visible
    throw err;
  }
}
```

---

## Example: Form Validation

### Before Migration

```typescript
function validateMaterialForm(data: MaterialFormData) {
  console.log("Validating material form:", data);

  if (!data.name) {
    console.warn("Validation failed: name is required");
    return { valid: false, error: "Name is required" };
  }

  if (data.compostability < 0 || data.compostability > 100) {
    console.warn("Validation failed: invalid compostability score");
    return { valid: false, error: "Invalid score" };
  }

  console.log("Validation passed");
  return { valid: true };
}
```

### After Migration

```typescript
import { log, warn } from "./utils/logger";

function validateMaterialForm(data: MaterialFormData) {
  log("Validating material form:", data);

  if (!data.name) {
    warn("Validation failed: name is required");
    return { valid: false, error: "Name is required" };
  }

  if (data.compostability < 0 || data.compostability > 100) {
    warn("Validation failed: invalid compostability score");
    return { valid: false, error: "Invalid score" };
  }

  log("Validation passed");
  return { valid: true };
}
```

---

## Example: Component Lifecycle Logging

### Before Migration

```typescript
function MaterialCard({ material }: Props) {
  useEffect(() => {
    console.log("MaterialCard mounted:", material.id);
    return () => {
      console.log("MaterialCard unmounted:", material.id);
    };
  }, [material.id]);

  const handleClick = () => {
    console.log("Card clicked:", material.name);
    onSelect(material);
  };

  return <div onClick={handleClick}>...</div>;
}
```

### After Migration

```typescript
import { log } from "./utils/logger";

function MaterialCard({ material }: Props) {
  useEffect(() => {
    log("MaterialCard mounted:", material.id);
    return () => {
      log("MaterialCard unmounted:", material.id);
    };
  }, [material.id]);

  const handleClick = () => {
    log("Card clicked:", material.name);
    onSelect(material);
  };

  return <div onClick={handleClick}>...</div>;
}
```

---

## Example: Performance Tracking

### Before Migration

```typescript
async function processBatchUpdate(materials: Material[]) {
  console.time("Batch Update");

  for (const material of materials) {
    console.log("Processing material:", material.id);
    await api.updateMaterial(material);
  }

  console.timeEnd("Batch Update");
  console.log("Batch update complete");
}
```

### After Migration

```typescript
import { time, timeEnd, log } from "./utils/logger";

async function processBatchUpdate(materials: Material[]) {
  time("Batch Update");

  for (const material of materials) {
    log("Processing material:", material.id);
    await api.updateMaterial(material);
  }

  timeEnd("Batch Update");
  log("Batch update complete");
}
```

---

## Decision Tree: Which Log Level?

```
Is it an error/exception?
├─ YES → Use error()  [Always logs]
└─ NO
   │
   Is it a potential problem/warning?
   ├─ YES → Use warn()  [Suppressed in production]
   └─ NO
      │
      Is it important state change?
      ├─ YES → Use info()  [Suppressed in production]
      └─ NO → Use log()  [Suppressed in production]
```

---

## Migration Checklist

When migrating a file:

- [ ] Add logger import at top of file
- [ ] Replace `console.log()` with `log()`
- [ ] Replace `console.error()` with `error()`
- [ ] Replace `console.warn()` with `warn()`
- [ ] Replace `console.info()` with `info()`
- [ ] Replace `console.debug()` with `debug()`
- [ ] Replace `console.table()` with `table()`
- [ ] Replace `console.time()` / `console.timeEnd()` with `time()` / `timeEnd()`
- [ ] Replace `console.group()` with `group()`
- [ ] Test in both TEST_MODE enabled and disabled states

---

## Testing Migration

### Test in Browser Console

```javascript
// Check current mode
wastedbLogger.info();

// Disable logging
wastedbLogger.setTestMode(false);

// Re-trigger component action
// Verify logs are suppressed

// Re-enable logging
wastedbLogger.setTestMode(true);

// Re-trigger component action
// Verify logs appear
```

---

## Notes

### Don't Migrate These

Some console calls should NOT be migrated:

**Environment initialization logs** (already conditional)

```typescript
// Keep as-is
if (process.env.NODE_ENV === "development") {
  console.log("Development mode");
}
```

**Critical startup logs** (need to always show)

```typescript
// Keep as-is - app initialization
console.log("WasteDB initialized");
```

**Third-party library debug logs** (not ours to change)

```typescript
// Keep as-is - library code
import someLib from "some-library";
```

---

**Last Updated:** October 23, 2025  
**See Also:** [Logger Usage Guide](./LOGGER_USAGE_GUIDE.md)
