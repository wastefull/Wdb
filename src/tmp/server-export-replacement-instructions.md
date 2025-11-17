# Server Export Endpoint Replacement Instructions

## What to Replace

In `/supabase/functions/server/index.tsx`, replace BOTH export endpoints with simple module calls.

### 1. Public Export Endpoint (around line 2364-2423)

**Replace:**
```typescript
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
```

**With:**
```typescript
// Public export endpoint - lay-friendly data (0-100 scale)
app.get('/make-server-17cae920/export/public', async (c) => {
  return handlePublicExport(c);
});
```

### 2. Research Export Endpoint (around line 2425-2595)

**Replace the entire function from:**
```typescript
// Full research export endpoint - raw scientific data (v2.0 with MIU evidence)
app.get('/make-server-17cae920/export/full', async (c) => {
  ...entire body...
});
```

**With:**
```typescript
// Full research export endpoint - raw scientific data with v2.0 MIU evidence
app.get('/make-server-17cae920/export/full', async (c) => {
  return handleResearchExport(c);
});
```

## Result

Both endpoints will now use the modular, v2.0-compliant code from `/supabase/functions/server/exports.tsx` which includes:
- MIU evidence points with full traceability
- Provenance metadata (curator, timestamps)
- Locators (page, figure, table)
- Export versioning (v2.0)
- Compression flag support
- Enhanced metadata documentation

The import statement has already been added:
```typescript
import { handlePublicExport, handleResearchExport } from "./exports.tsx";
```
