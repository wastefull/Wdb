# WasteDB Quick Start Guide

## First-Time Setup (5 minutes)

### 1. Access the Site

```
https://db.wastefull.org
```

### 2. Sign In as Admin

1. Click **"Sign In"** in the top-right corner
2. Enter: `natto@wastefull.org`
3. Check email for magic link from `auth@wastefull.org`
4. Click the sign-in button in the email
5. You'll be automatically redirected and signed in

### 3. Enable Admin Mode

1. After signing in, click the **"Admin"** button in the top bar
2. Admin features will now be visible

### 4. Upload Logo (Optional)

1. Click **"Database Management"**
2. Go to **"Assets"** tab
3. Upload your Wastefull logo
4. Copy the public URL
5. Update `/supabase/functions/server/index.tsx` line 522 (see EMAIL_LOGO_SETUP.md)

---

## 📋 Common Tasks

### Adding a Material

```
1. Main view → "Add Material" button
2. Fill in:
   - Name
   - Category (dropdown)
   - Description
   - Sustainability scores (0-100):
     * Compostability
     * Recyclability
     * Reusability
3. Click "Save Material"
```

### Adding Scientific Data

```
1. Material card → "Edit Scientific Data" icon
2. Enter parameters (0-1 scale):
   - Y_value (Yield/recovery rate)
   - D_value (Degradation)
   - C_value (Contamination tolerance)
   - M_value (Maturity/infrastructure)
   - E_value (Energy demand)
3. Add source citations
4. Save
```

### Adding Articles

```
1. Material card → Click a sustainability score
2. Click "+" button
3. Fill in article details:
   - Title
   - Category (DIY/Industrial/Experimental)
   - Overview image (optional)
   - Introduction
   - Supplies
   - Step 1
4. Save
```

### Managing Users

```
1. "User Management" button
2. View all registered users
3. Change roles (user ↔ admin)
4. Delete users (cannot delete yourself)
```

### Exporting Data

```
Public Export (no auth required):
- Main view → "Export Data (Open Access)"
- Choose format: JSON, CSV, or API instructions

Admin CSV Export:
- "Database Management" → "Material Management" tab
- Click "Export CSV"
```

### Importing Data

```
1. "Database Management" → "Material Management" tab
2. Click "Import CSV" dropdown
3. Either:
   - Paste CSV data directly
   - Upload CSV file
4. Required columns:
   - name, category, compostability, recyclability, reusability
```

---

## 🎨 Accessibility Features

Access via the **three colored buttons** in the top-left:

### 🔴 Red Button - Reset

- Reset all accessibility settings to default

### 🟡 Yellow Button - Font Size

- Adjust text size: Small / Medium / Large

### 🔵 Blue Button - Visual Options

- **High Contrast**: Increase contrast for better readability
- **No Pastel**: Remove pastel colors
- **Reduce Motion**: Disable animations
- **Dark Mode**: Toggle dark theme

---

## Search Tips

```
Search by:
- Material name (e.g., "Aluminum")
- Category (e.g., "Metals")
- Description keywords (e.g., "recyclable")
- Partial matches work
```

---

## 🔐 User Roles

### Public (Not Signed In)

✅ Browse all materials  
✅ Search database  
✅ Read articles & whitepapers  
✅ Export data  
❌ Edit/Delete  
❌ Add materials/articles

### User Role (Signed In)

✅ Everything public can do  
✅ Authenticated access  
❌ CRUD operations  
❌ Admin features

### Admin Role (@wastefull.org emails)

✅ Everything users can do  
✅ Create/Edit/Delete materials  
✅ Add/Edit/Delete articles  
✅ Manage users  
✅ Batch operations  
✅ Upload assets  
✅ Database management

---

## Understanding Scores

### Sustainability Scores (0-100)

- **0-33**: Low sustainability
- **34-66**: Moderate sustainability
- **67-100**: High sustainability

### Scientific Parameters (0-1)

- **Y**: Yield - How much material is recovered
- **D**: Degradation - Quality loss per cycle
- **C**: Contamination - Tolerance to impurities
- **M**: Maturity - Infrastructure availability
- **E**: Energy - Processing energy demand

### Confidence Levels

- **High**: Multiple peer-reviewed sources
- **Medium**: Limited sources or data gaps
- **Low**: Preliminary or estimated data

---

## Material Categories

1. **Plastics** - PET, HDPE, PVC, etc.
2. **Metals** - Aluminum, steel, copper
3. **Glass** - Bottles, containers
4. **Paper & Cardboard** - Packaging, newsprint
5. **Fabrics & Textiles** - Clothing, upholstery
6. **Electronics & Batteries** - E-waste, lithium-ion
7. **Building Materials** - Concrete, wood, insulation
8. **Organic/Natural Waste** - Food scraps, yard waste

---

## 🆘 Troubleshooting

### "Not Syncing to Cloud"

- Check internet connection
- Verify you're signed in
- Try clicking "Retry Sync" button
- Data is always saved locally first

### "Unauthorized" Error

- Your session expired - sign in again
- Clear browser cache if persists
- Check you have admin role for admin features

### Magic Link Not Arriving

- Check spam/junk folder
- Verify email address spelling
- Wait 2-3 minutes (rate limiting)
- Check Resend dashboard for delivery status

### Images Not Loading

- Check file size < 5MB
- Supported formats: PNG, JPG, SVG, WebP
- Verify internet connection
- Try refreshing the page

---

## 💡 Pro Tips

1. **Use Batch Operations** for updating multiple materials at once
2. **Tag sources** in Source Library for easy filtering
3. **Export data regularly** as backup
4. **Enable debug logging** in browser console with `wastedbLogger.setTestMode(true)`

---

## Debugging & Development

### Enable Console Logging

WasteDB uses a smart logging system that automatically suppresses console output in production.

**In Browser Console:**

```javascript
// Enable all logging
wastedbLogger.setTestMode(true);

// Check current configuration
wastedbLogger.info();

// Disable logging
wastedbLogger.setTestMode(false);
```

**In Development:**

- Logging is **enabled by default** in Figma Make environment
- Logging is **disabled by default** in production
- Errors are **always visible** regardless of mode

**For Developers:**

```typescript
// Import logger in your code
import { log, error, warn } from "./utils/logger";

log("Debug message"); // Suppressed in production
error("Error occurred"); // Always visible
warn("Warning message"); // Suppressed in production
```

📖 See [Logger Usage Guide](/docs/LOGGER_USAGE_GUIDE.md) for complete documentation 4. **Use scientific editor** for detailed recyclability calculations 5. **Share article permalinks** for direct access 6. **Enable dark mode** for night work sessions 7. **Use CSV import** for bulk data entry 8. **Check confidence levels** when citing data

---

## 📱 Mobile Usage

WasteDB is fully responsive:

- Swipe through tabs
- Tap scores to view articles
- All features available
- Touch-optimized buttons

---

## 🔗 Important URLs

- **Production**: https://db.wastefull.org
- **Support Email**: natto@wastefull.org
- **Magic Link Sender**: auth@wastefull.org

---

## Additional Documentation

- `DEPLOYMENT_CHECKLIST.md` - Full testing guide
- `ASSET_STORAGE_GUIDE.md` - Asset upload details
- `EMAIL_LOGO_SETUP.md` - Logo customization
- `SECURITY.md` - Security features & RBAC
- `SUPABASE_INTEGRATION.md` - Database architecture
- `DATA_PIPELINE.md` - Scientific methodology

---

## 🎉 You're Ready!

The system is fully configured and ready for production use. Start by signing in, enabling admin mode, and exploring the features. All data is automatically synced to Supabase for persistence.

**Questions?** Check the full documentation or reach out to the team.
