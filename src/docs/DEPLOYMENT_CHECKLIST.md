# WasteDB Deployment Checklist ✅

## DNS & Infrastructure Status

✅ **Resend DNS** - Verified and propagated  
✅ **Figma Make Hosting** - db.wastefull.org configured  
✅ **SSL Certificates** - Active  
✅ **Supabase Storage** - Bucket initialized  
✅ **Asset Upload API** - Ready for logo hosting  

---

## Testing Sequence

### Phase 1: Basic Access ✅
- [ ] Navigate to `https://db.wastefull.org`
- [ ] Verify WasteDB loads correctly
- [ ] Check that all materials are visible (public read access)
- [ ] Test search functionality (no auth required)
- [ ] Navigate to Methodology & Whitepapers (public access)
- [ ] Test Export Data feature (public access)

### Phase 2: Magic Link Authentication 🔐
- [ ] Click "Sign In" button
- [ ] Enter email address: `natto@wastefull.org`
- [ ] Submit magic link request
- [ ] Check inbox for email from `WasteDB <auth@wastefull.org>`
- [ ] Verify email has Wastefull green branding
- [ ] Click "Sign In to WasteDB" button in email
- [ ] Verify successful authentication and redirect
- [ ] Check that user indicator shows in top bar

### Phase 3: Admin Role Verification 👤
- [ ] After signing in, verify "Admin" button appears in status bar
- [ ] Click "Admin" button to enable admin mode
- [ ] Verify admin-only buttons appear:
  - [ ] "Add Material" button
  - [ ] "Database Management" button  
  - [ ] "User Management" button
- [ ] Check that material edit/delete buttons are visible

### Phase 4: Asset Upload & Logo Setup 🖼️
- [ ] Navigate to **Database Management**
- [ ] Click **Assets** tab
- [ ] Upload Wastefull logo (PNG/SVG recommended)
- [ ] Verify upload success message
- [ ] Click **Copy** icon to copy public URL
- [ ] Save URL for email template update
- [ ] Verify logo appears in asset list with thumbnail
- [ ] Test opening logo in new tab

### Phase 5: Email Template Update 📧
- [ ] Open `/supabase/functions/server/index.tsx`
- [ ] Navigate to line 522 (inside `sendMagicLinkEmail` function)
- [ ] Replace the `<h1>` tag with logo `<img>` tag (see EMAIL_LOGO_SETUP.md)
- [ ] Save changes
- [ ] Sign out from WasteDB
- [ ] Request new magic link
- [ ] Verify email now shows logo instead of text

### Phase 6: CRUD Operations 📝
- [ ] Create new material (admin only)
- [ ] Edit existing material
- [ ] Add articles to material (any sustainability category)
- [ ] Upload images to articles
- [ ] Delete article
- [ ] Delete material
- [ ] Verify changes sync to Supabase (check sync status indicator)

### Phase 7: User Management 👥
- [ ] Navigate to **User Management**
- [ ] View all registered users
- [ ] Test inviting a new user via magic link
- [ ] Verify role assignment (admin vs user)
- [ ] Test that non-admin users cannot access admin features

### Phase 8: Database Management 🗄️
- [ ] **Material Management Tab**
  - [ ] Test inline editing in table view
  - [ ] Export materials as CSV
  - [ ] Import materials via CSV paste
  - [ ] Import materials via CSV file upload
  - [ ] Test Data Migration Tool for scientific parameters
- [ ] **Batch Operations Tab**
  - [ ] Test batch scientific data updates
  - [ ] Verify confidence level calculations
- [ ] **Source Library Tab**
  - [ ] Browse 25+ curated sources
  - [ ] Filter by tags
  - [ ] Copy citation formats (APA, BibTeX, JSON)
- [ ] **Assets Tab**
  - [ ] Upload additional images
  - [ ] Delete test assets
  - [ ] Verify public URL access

### Phase 9: Scientific Data Features 🔬
- [ ] View material with scientific metadata
- [ ] Edit scientific parameters (Y, D, C, M, E values)
- [ ] Verify CR calculations display
- [ ] Check confidence intervals (CI95)
- [ ] View source citations
- [ ] Test whitepaper version tracking

### Phase 10: Public Features (Unauthenticated) 🌐
- [ ] Sign out completely
- [ ] Verify materials are still browsable
- [ ] Test search while unauthenticated
- [ ] Read methodology whitepapers
- [ ] Export data (JSON, CSV, API)
- [ ] View material details and articles
- [ ] Verify no edit/delete buttons appear
- [ ] Check that "Sign In" prompt appears for admin features

---

## Environment Variables Confirmed

✅ **SUPABASE_URL** - Set  
✅ **SUPABASE_ANON_KEY** - Set  
✅ **SUPABASE_SERVICE_ROLE_KEY** - Set  
✅ **SUPABASE_DB_URL** - Set  
✅ **RESEND_API_KEY** - Set  

---

## Known Configuration

### Email Sender
- **From**: `WasteDB <auth@wastefull.org>`
- **Domain**: `wastefull.org`
- **Status**: ✅ Verified with Resend

### Application URL
- **Production**: `https://db.wastefull.org`
- **Admin Email**: `natto@wastefull.org` (auto-assigned admin role)

### Storage Bucket
- **Name**: `make-17cae920-assets`
- **Type**: Public (read), Admin-only (write/delete)
- **Limit**: 5MB per file
- **Formats**: PNG, JPG, SVG, WebP

### Rate Limits (Server)
- **Auth requests**: 5 per minute per IP
- **API requests**: 100 per minute per IP  
- **Signups**: 3 per hour per IP

---

## Security Features Active

✅ Honeypot protection on signup  
✅ Email validation with pattern detection  
✅ Role-based access control (RBAC)  
✅ Magic link token expiry (1 hour)  
✅ Single-use magic links  
✅ Auto-admin for @wastefull.org emails  
✅ Rate limiting on all auth endpoints  
✅ Session token validation  

---

## Rollback Plan

If issues are encountered:

1. **Magic Link Emails Failing**
   - Verify Resend API key is valid
   - Check Resend dashboard for bounce/spam reports
   - Test with alternative email addresses
   - Fallback: Use console-logged magic links for development

2. **Asset Upload Issues**
   - Verify Supabase Storage bucket exists
   - Check service role key permissions
   - Confirm file size < 5MB
   - Check allowed MIME types

3. **Authentication Issues**
   - Clear browser cache and sessionStorage
   - Verify tokens in sessionStorage
   - Check server logs for auth errors
   - Test with incognito/private browsing

4. **DNS/SSL Issues**
   - Verify DNS records with `nslookup db.wastefull.org`
   - Check SSL cert with `openssl s_client -connect db.wastefull.org:443`
   - Clear DNS cache locally
   - Wait additional 5-10 minutes for propagation

---

## Success Criteria

All tests pass when:

- ✅ Site loads at db.wastefull.org with SSL
- ✅ Magic link emails arrive from auth@wastefull.org
- ✅ Admin can sign in and access all features
- ✅ Logo displays in emails after template update
- ✅ Public users can browse without authentication
- ✅ CRUD operations work and sync to Supabase
- ✅ Asset uploads work and return public URLs
- ✅ No console errors in browser dev tools
- ✅ All scientific data features functional

---

## Post-Deployment Tasks

After successful testing:

1. **Update Logo**
   - Upload final Wastefull logo via Assets tab
   - Update email template with logo URL
   - Test branded email delivery

2. **Invite Team Members**
   - Use User Management to send magic links
   - Assign appropriate roles (admin/user)
   - Document access procedures

3. **Monitor Initial Usage**
   - Check Supabase dashboard for API usage
   - Review Resend dashboard for email deliverability
   - Monitor error logs for any issues

4. **Backup Initial Data**
   - Export materials as CSV
   - Save scientific source library
   - Document any custom configurations

5. **Documentation**
   - Share access with team
   - Provide user guide for basic operations
   - Document admin workflows

---

## Support Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Resend Dashboard**: https://resend.com/emails
- **Figma Make Console**: (check for deployment logs)

---

## Notes

- All auth operations include detailed logging for troubleshooting
- Public access is intentional - data is open for research
- Admin features are fully hidden from non-admin users
- Asset URLs are permanent and CDN-backed

**Ready to test!** 🚀

Start with Phase 1 and work through each section systematically. Report any issues encountered during testing.
