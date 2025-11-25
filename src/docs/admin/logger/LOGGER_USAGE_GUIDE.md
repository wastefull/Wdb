# WasteDB Logger Usage Guide

**Created:** October 23, 2025  
**Status:** Active

## Overview

WasteDB uses a centralized logging system that suppresses console output unless explicitly in TEST mode. This keeps production environments clean while allowing full debugging capabilities during development.

---

## Quick Start

### Import the Logger

```typescript
// Individual imports
import { log, error, warn, info, debug } from "./utils/logger";

// Or use the namespace
import { logger } from "./utils/logger";
logger.log("Hello world");
```

### Basic Usage

```typescript
import { log, error, warn } from "./utils/logger";

// Standard logging (suppressed in production)
log("User clicked button");
log("Data loaded:", materials);

// Errors (ALWAYS logged, even in production)
error("Failed to fetch materials:", err);

// Warnings (suppressed in production)
warn("Deprecated API usage detected");
```

---

## TEST_MODE Behavior

### Default Behavior

| Environment                                         | TEST_MODE Default | Logging Enabled? |
| --------------------------------------------------- | ----------------- | ---------------- |
| **figma-make** (localhost, _.figma.com, _.figma.io) | `TRUE`            | ✅ Yes           |
| **production** (custom domains)                     | `FALSE`           | ❌ No            |

### Override TEST_MODE

```typescript
import { setTestMode } from "./utils/logger";

// Enable logging for debugging session
setTestMode(true);

// Disable all logging
setTestMode(false);

// Reset to environment default
setTestMode(null);
```

### Check Current Mode

```typescript
import { getTestMode, loggerInfo } from "./utils/logger";

// Get boolean value
const isLogging = getTestMode(); // true or false

// Display full configuration
loggerInfo();
// Output:
//  Logger Configuration: {
//   TEST_MODE: 'auto (environment-based)',
//   effectiveMode: true,
//   environment: 'figma-make',
//   hostname: 'localhost'
// }
```

---

## Available Methods

### Standard Logging (Suppressed in Production)

```typescript
import { log, warn, info, debug, table } from "./utils/logger";

log("Message", data); // console.log
warn("Warning message"); // console.warn
info("Info message"); // console.info
debug("Debug data:", obj); // console.debug
table(arrayData); // console.table
```

### Error Logging (ALWAYS Active)

```typescript
import { error } from "./utils/logger";

// Errors always log, even in production
error("Critical error:", errorObject);
```

**Why?** Errors indicate bugs or issues that need immediate attention, regardless of environment.

### Grouped Logging

```typescript
import { group, groupCollapsed, groupEnd, log } from "./utils/logger";

group("Material Calculation");
log("Input values:", inputs);
log("Intermediate result:", intermediate);
log("Final score:", score);
groupEnd();

// Collapsed by default
groupCollapsed("Network Requests");
log("Fetching materials...");
log("Response:", data);
groupEnd();
```

### Performance Tracking

```typescript
import { time, timeEnd } from "./utils/logger";

time("Material Fetch");
await fetchMaterials();
timeEnd("Material Fetch");
// Output (if TEST_MODE): Material Fetch: 142.35ms
```

### Stack Traces

```typescript
import { trace } from "./utils/logger";

function deeplyNestedFunction() {
  trace("How did we get here?");
}
```

---

## Migration Guide

### Replace Existing Console Calls

**Before:**

```typescript
console.log("Loading materials...");
console.error("Failed to save:", error);
console.warn("Deprecated field used");
console.table(materials);
```

**After:**

```typescript
import { log, error, warn, table } from "./utils/logger";

log("Loading materials...");
error("Failed to save:", error); // Still uses console.error
warn("Deprecated field used");
table(materials);
```

### Component Example

**Before:**

```typescript
export function MaterialCard({ material }: Props) {
  console.log("Rendering MaterialCard:", material.id);

  const handleClick = () => {
    console.log("Card clicked:", material.name);
  };

  return <div onClick={handleClick}>...</div>;
}
```

**After:**

```typescript
import { log } from "./utils/logger";

export function MaterialCard({ material }: Props) {
  log("Rendering MaterialCard:", material.id);

  const handleClick = () => {
    log("Card clicked:", material.name);
  };

  return <div onClick={handleClick}>...</div>;
}
```

---

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
import { log, info, warn, error } from "./utils/logger";

// General debugging
log("User viewed material:", materialId);

// Informational (less verbose than log)
info("Authentication successful");

// Potential issues
warn("Using deprecated API endpoint");

// Actual errors
error("Failed to authenticate:", err);
```

### 2. Add Context to Logs

```typescript
// ❌ Bad
log(material);

// ✅ Good
log("Material loaded from API:", material);
log("User action:", { action: "click", target: "submit", userId });
```

### 3. Group Related Logs

```typescript
import { group, groupEnd, log } from "./utils/logger";

group("Form Submission");
log("Validating form data...");
log("Form data:", formData);
log("Calling API...");
log("Response:", response);
groupEnd();
```

### 4. Keep Errors Always Visible

```typescript
try {
  await dangerousOperation();
} catch (err) {
  // ALWAYS use error() for caught exceptions
  error("Operation failed:", err);
  toast.error("Something went wrong");
}
```

### 5. Use Time Tracking for Performance

```typescript
import { time, timeEnd } from "./utils/logger";

time("Batch Operation");
await processBatchUpdate(materials);
timeEnd("Batch Operation");
// Logs: Batch Operation: 1234.56ms
```

---

## Debugging Workflows

### Enable Logging for a Session

**In Browser Console:**

```javascript
// Option 1: Direct access (if logger is exposed globally)
window.setTestMode?.(true);

// Option 2: Add to component temporarily
import { setTestMode } from "./utils/logger";
setTestMode(true); // At top of file
```

**Temporary Debug File:**

```typescript
// Add to App.tsx temporarily
import { setTestMode } from "./utils/logger";

if (window.location.search.includes("debug=true")) {
  setTestMode(true);
}

// Usage: https://yourapp.com?debug=true
```

### Inspect Logger Configuration

```typescript
import { loggerInfo } from "./utils/logger";

// In browser console or component
loggerInfo();
```

### Production Debugging

```typescript
// Even in production, errors still log
// To temporarily enable full logging:
import { setTestMode } from "./utils/logger";
setTestMode(true);

// Remember to disable before committing!
```

---

## Common Patterns

### API Call Logging

```typescript
import { log, error, time, timeEnd } from "./utils/logger";

async function fetchMaterials() {
  log("Fetching materials from API...");
  time("Material Fetch");

  try {
    const response = await fetch("/api/materials");
    const data = await response.json();

    timeEnd("Material Fetch");
    log("Materials fetched:", data.length);

    return data;
  } catch (err) {
    error("Failed to fetch materials:", err);
    throw err;
  }
}
```

### State Change Logging

```typescript
import { log } from "./utils/logger";

const [materials, setMaterials] = useState<Material[]>([]);

useEffect(() => {
  log("Materials state updated:", materials.length, "items");
}, [materials]);
```

### Form Validation Logging

```typescript
import { log, warn } from "./utils/logger";

function validateForm(data: FormData) {
  log("Validating form data:", data);

  if (!data.name) {
    warn("Validation failed: name is required");
    return false;
  }

  log("Validation passed");
  return true;
}
```

---

## Environment Detection Logic

The logger automatically detects the environment:

```typescript
// Figma Make Environment (TEST_MODE = true)
- localhost
- 127.0.0.1
- *.figma.com
- *.figma.io
- *.figma.site

// Production Environment (TEST_MODE = false)
- Custom domains
- Deployed apps
```

---

## Performance Impact

### Suppressed Logs (Production)

```typescript
log("Heavy object:", massiveArray);
// NO performance impact - function returns immediately
```

### Error Logs (Always Active)

```typescript
error("Error:", massiveObject);
// Minimal impact - only fires on actual errors
```

**Recommendation:** Don't worry about performance. Suppressed logs have near-zero overhead.

---

## Testing & Debugging

### Unit Tests

```typescript
import { log, setTestMode } from "./utils/logger";

describe("MyComponent", () => {
  beforeEach(() => {
    // Suppress logs in tests
    setTestMode(false);
  });

  it("should render", () => {
    // Test without console noise
  });
});
```

### Integration Tests

```typescript
import { setTestMode } from "./utils/logger";

// Enable logging for debugging test failures
setTestMode(true);

describe("Material CRUD", () => {
  // Logs will show during test runs
});
```

---

## FAQ

### Q: Will this break my existing code?

**A:** No. The logger is opt-in. Existing `console.log` calls continue to work. Migrate gradually.

### Q: What about third-party library logs?

**A:** Third-party libraries using `console.*` directly are unaffected. Only code using our logger is controlled.

### Q: Can I log in production if needed?

**A:** Yes! Use `setTestMode(true)` in the browser console or add a debug URL parameter.

### Q: What happens to errors in production?

**A:** Errors (`error()`) ALWAYS log, even in production. They're too important to suppress.

### Q: How do I debug production issues?

**A:**

1. Check error logs (always visible)
2. Temporarily enable TEST_MODE with `setTestMode(true)`
3. Use browser DevTools to inspect network/state
4. Add targeted `error()` calls for critical paths

### Q: Should I remove all logs before production?

**A:** No! Keep them. They're automatically suppressed. Only remove truly unnecessary logs.

---

## Checklist for New Features

When adding new features, ensure:

- [ ] Import logger functions instead of using console directly
- [ ] Use `log()` for general debugging
- [ ] Use `error()` for all caught exceptions
- [ ] Use `warn()` for deprecation notices or potential issues
- [ ] Add `time()`/`timeEnd()` for performance-critical operations
- [ ] Group related logs with `group()`/`groupEnd()`
- [ ] Test both with TEST_MODE enabled and disabled

---

## Related Documentation

- [Environment Detection](/utils/environment.ts)
- [Quick Start Guide](/docs/QUICK_START.md)
- [Security Guidelines](/docs/SECURITY.md)

---

**Last Updated:** October 23, 2025  
**Maintainer:** WasteDB Team
