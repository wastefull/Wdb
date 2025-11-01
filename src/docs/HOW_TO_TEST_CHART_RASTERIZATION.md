# How to Test Chart Rasterization

**Quick Reference**: Everything you need to verify chart rasterization is working.

---

## 🎯 The Fastest Way (30 seconds)

1. **Login**: Use `natto@wastefull.org` credentials
2. **Navigate**: Database Management → **Chart Testing** tab
3. **Look**: You should see 4 chart comparisons (Live SVG on left, Rasterized on right)
4. **Click**: "Refresh All" button
5. **Observe**: Right column (rasterized) loads instantly ⚡

**✅ If rasterized charts load faster = It works!**

---

## 📋 Testing Options

### Option 1: Quick Test (5 minutes)
**Best for**: Fast verification  
**Guide**: `/docs/CHART_RASTERIZATION_QUICK_TEST.md`

**Steps**:
1. Access Chart Testing tab
2. Visual comparison check
3. Cache test (refresh button)
4. Performance test
5. Stress test

### Option 2: Comprehensive Test (30 minutes)
**Best for**: Full validation  
**Guide**: `/docs/CHART_RASTERIZATION_TESTING_GUIDE.md`

**Covers**:
- Visual comparison across all modes
- Cache verification in IndexedDB
- DevTools inspection
- Performance benchmarking
- Accessibility testing
- Keyboard navigation
- Screen reader compatibility

### Option 3: Technical Deep Dive (1 hour)
**Best for**: Understanding internals  
**Guide**: `/docs/PHASE_8_CHART_RASTERIZATION.md`

**Includes**:
- Architecture explanation
- Code walkthrough
- Cache invalidation strategy
- Performance analysis
- Integration guidelines

---

## 🔧 Testing Interface Location

```
Main Menu
  └── Database Management (admin only)
       └── Chart Testing tab
            ├── Side-by-Side (visual comparison)
            ├── Performance (benchmarks)
            ├── Cache Manager (statistics & controls)
            └── Stress Test (scale testing)
```

---

## ✅ What to Verify

### Visual
- [ ] Rasterized charts look identical to SVG versions
- [ ] Dark mode works for both
- [ ] High contrast mode works for both
- [ ] No visual glitches

### Performance
- [ ] Rasterized loads faster after first render
- [ ] Performance test shows 60%+ improvement
- [ ] Smooth scrolling with 20+ charts
- [ ] No lag or stuttering

### Cache
- [ ] Charts appear in IndexedDB
- [ ] Cache statistics update correctly
- [ ] Cache clearing works
- [ ] Charts regenerate after clear

### Accessibility
- [ ] ARIA labels present and accurate
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader announces correctly
- [ ] Tooltips appear on hover

---

## 🔍 DevTools Verification

### IndexedDB Check
```
F12 → Application → IndexedDB → wastedb-chart-cache → charts
```
**Expected**: See chart entries with PNG data URLs

### DOM Node Check
```
F12 → Elements → Inspect chart
```
**Expected**:
- SVG: 150-200 child elements
- Rasterized: 1 `<img>` element

### Network Check
```
F12 → Network → Refresh page
```
**Expected**: No requests for cached chart images

### Performance Check
```
F12 → Performance → Record → Scroll stress test
```
**Expected**: Higher FPS with rasterization

---

## 📊 Success Metrics

| Metric | Target | How to Check |
|--------|--------|--------------|
| Visual Parity | 100% identical | Side-by-side tab |
| Cache Hit Rate | >90% after first load | DevTools Network |
| Performance Gain | >60% improvement | Performance tab |
| Scroll FPS | >55 FPS (50+ charts) | DevTools Performance |
| Accessibility | All features work | Screen reader test |

---

## 🐛 Common Issues & Fixes

### Issue: Charts don't look the same
**Cause**: Different rendering settings  
**Fix**: Clear cache and regenerate

### Issue: No caching happening
**Cause**: Private/incognito mode or IndexedDB disabled  
**Fix**: Use normal browser window

### Issue: Performance not improving
**Cause**: Too few charts to notice  
**Fix**: Run stress test with 50+ charts

### Issue: Console errors
**Cause**: Browser compatibility  
**Fix**: Check browser supports IndexedDB (all modern browsers do)

---

## 🎬 Expected Behavior

### First Load
1. Hidden SVG renders (invisible to user)
2. SVG converts to canvas
3. Canvas exports to PNG data URL
4. PNG stored in IndexedDB
5. Image displayed to user
**Time**: ~100-150ms per chart

### Subsequent Loads
1. Check IndexedDB cache
2. Load PNG from cache
3. Display image
**Time**: ~10ms per chart

### Cache Invalidation
**Automatic**:
- Data changes (material updated)
- Cache expires (7 days old)
- Version mismatch

**Manual**:
- User clears cache in Cache Manager
- Developer calls `invalidateMaterialCache(id)`

---

## 📱 Browser Compatibility

### ✅ Fully Supported
- Chrome 80+
- Edge 80+
- Firefox 75+
- Safari 13+
- Opera 67+

### ⚠️ Fallback Mode
- Older browsers: Falls back to live SVG
- No IndexedDB: Uses live SVG
- Private mode (some browsers): Uses live SVG

**Note**: Fallback is automatic and transparent

---

## 🚀 Next Steps After Testing

### If Tests Pass ✅
1. Mark Phase 8.1 as tested
2. Ready for Phase 8.2 integration
3. Can use in production

### If Tests Fail ❌
1. Note specific failures
2. Check browser console
3. Try different browser
4. Review troubleshooting section
5. Report with:
   - Browser/version
   - Error messages
   - Steps to reproduce

---

## 📚 Documentation Index

| Document | Purpose | Time |
|----------|---------|------|
| `CHART_RASTERIZATION_QUICK_TEST.md` | Fast verification | 5 min |
| `CHART_RASTERIZATION_TESTING_GUIDE.md` | Comprehensive testing | 30 min |
| `PHASE_8_CHART_RASTERIZATION.md` | Technical details | 1 hour |
| `HOW_TO_TEST_CHART_RASTERIZATION.md` | This guide | 2 min |

---

## 💡 Pro Tips

1. **First time**: Do the quick test (5 min)
2. **Before integration**: Do comprehensive test (30 min)
3. **Having issues**: Check DevTools Console first
4. **Testing at scale**: Use stress test with 100 charts
5. **Cache debugging**: Use Cache Manager tab statistics

---

## ⚡ TL;DR

```bash
# The absolute fastest test:
1. Login as admin
2. Go to: Database Management → Chart Testing
3. Click "Refresh All"
4. Watch right column load instantly
5. ✅ Working!
```

---

**Need Help?**
- Check console errors first
- Review `/docs/CHART_RASTERIZATION_TESTING_GUIDE.md`
- Verify IndexedDB is enabled
- Try clearing cache and regenerating

**Status**: Ready for testing!  
**Access**: Database Management → Chart Testing tab  
**Documentation**: Complete ✅
