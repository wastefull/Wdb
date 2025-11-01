# Chart Rasterization Testing Guide

**Phase 8.1: Chart Rasterization**  
**Date**: November 1, 2025

## Quick Start

### Accessing the Test Interface

1. **Login as Admin**: Use `natto@wastefull.org` credentials
2. **Navigate to Database Management**: Click "Database Management" in the menu
3. **Select "Chart Testing" tab**: Click the new "Chart Testing" tab in the admin view

## Testing Checklist

### ✅ Visual Comparison Test

**Location**: Side-by-Side tab

**Steps**:
1. Observe the four test cases (Overlap, Near-Overlap, Gap, Simplified)
2. Compare left column (Live SVG) vs right column (Rasterized)
3. **Expected**: Both should look identical
4. Click "Refresh All" button
5. **Expected**: Rasterized charts load instantly from cache

**What to Look For**:
- ✅ Visual parity between SVG and rasterized versions
- ✅ Both respect dark mode (toggle with moon icon)
- ✅ Both respond to high contrast mode (accessibility settings)
- ✅ All interactive features work (hover tooltips, click handlers)

### ✅ Cache Verification Test

**Location**: Cache Manager tab

**Steps**:
1. Navigate to "Cache Manager" tab
2. View cache statistics:
   - **Cached Charts**: Should show number of cached charts
   - **Cache Size**: Total storage used
   - **Oldest/Newest Cache**: Timestamps
3. Test cache clearing:
   - Click "Clear All" button
   - Confirm the action
   - **Expected**: Cache count drops to 0
4. Go back to "Side-by-Side" tab
5. **Expected**: Charts re-rasterize and cache rebuilds

**What to Look For**:
- ✅ Cache statistics update correctly
- ✅ Cache clearing works without errors
- ✅ Charts regenerate after cache clear

### ✅ Browser DevTools Inspection

**Chrome/Edge DevTools Method**:

#### Test 1: IndexedDB Storage
1. Press `F12` to open DevTools
2. Navigate to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Find `wastedb-chart-cache` database
5. Click `charts` store
6. **Expected**: See cached chart entries with PNG data URLs

#### Test 2: DOM Node Count
1. Go to **Side-by-Side** tab in app
2. In DevTools, go to **Elements** tab
3. Inspect a Live SVG chart
4. **Expected**: ~150-200 DOM nodes (circles, ellipses, paths)
5. Inspect a Rasterized chart
6. **Expected**: Single `<img>` tag (1 DOM node)

#### Test 3: Network Activity
1. Open **Network** tab in DevTools
2. Click "Refresh All" in the app
3. **Expected**: No network requests for rasterized images
4. **Expected**: All loads from cache (0ms load time)

#### Test 4: Performance Profile
1. Open **Performance** tab in DevTools
2. Click record button
3. Scroll in the "Stress Test" tab (render 20+ charts)
4. Stop recording
5. **Expected**: Rasterized version shows faster render times

### ✅ Performance Test

**Location**: Performance tab

**Steps**:
1. Navigate to "Performance" tab
2. Set number of charts (try 10, 20, 50)
3. Click "Run Performance Test"
4. **Expected**: See improvement percentage
5. **Typical Results**: 60-80% improvement for rasterized

**What to Look For**:
- ✅ Rasterized time < SVG time
- ✅ Higher chart counts = bigger improvement
- ✅ No errors during test

### ✅ Stress Test

**Location**: Stress Test tab

**Steps**:
1. Navigate to "Stress Test" tab
2. Set chart count to 20
3. Check "Use rasterization" checkbox
4. Click "Start Stress Test"
5. **Expected**: Smooth rendering, good scroll performance
6. Clear charts, uncheck "Use rasterization"
7. Start test again
8. **Expected**: Slower, possible frame drops

**What to Look For**:
- ✅ Rasterized: Smooth 60 FPS scrolling
- ✅ Live SVG: Frame drops with 20+ charts
- ✅ No console errors

## Advanced Testing

### Test Cache Invalidation

**Steps**:
1. Render charts in "Side-by-Side" tab
2. Open browser console (F12 → Console)
3. Run: 
   ```javascript
   const { invalidateMaterialCache } = await import('./utils/chartCache.js');
   await invalidateMaterialCache('test-overlap');
   ```
4. Refresh the page
5. **Expected**: That specific chart re-rasterizes

### Test Accessibility Features

**Steps**:
1. Click the accessibility button (three dots in top bar)
2. Enable "High Contrast Mode"
3. **Expected**: Both SVG and rasterized charts update
4. Enable "Reduce Motion"
5. **Expected**: Animations disabled in both versions
6. Toggle "Dark Mode"
7. **Expected**: Both versions respect theme

### Test with Screen Reader

**Steps (macOS)**:
1. Enable VoiceOver: `Cmd + F5`
2. Navigate to rasterized chart: `Ctrl + Option + Right Arrow`
3. **Expected**: Hear full ARIA label description
4. **Expected**: "Practical X%, Theoretical Y%, Click for details"

**Steps (Windows)**:
1. Enable Narrator: `Win + Ctrl + Enter`
2. Navigate to rasterized chart
3. **Expected**: Hear full ARIA label description

### Test Keyboard Navigation

**Steps**:
1. Click in the app to focus
2. Press `Tab` to navigate
3. When a chart is focused, press `Enter`
4. **Expected**: Click handler fires (if configured)
5. **Expected**: Same behavior for SVG and rasterized

## Known Issues & Expected Behavior

### ✅ Expected

- **First load slower**: Initial rasterization adds ~100-200ms per chart (includes font loading)
- **Cache warm-up**: First render builds cache, subsequent instant
- **Storage growth**: Each chart ~20-100KB in IndexedDB (high-res PNGs)
- **Simplified mode**: Automatically bypasses rasterization
- **Font loading**: Sniglet font must load before rasterization (handled automatically)
- **High-DPI support**: Charts render at 2x+ pixel ratio for crisp display

### ⚠️ Potential Issues

- **Browser quota**: IndexedDB has ~50-100MB limit per origin
  - **Solution**: Cache auto-expires after 7 days
- **Very old browsers**: IndexedDB support required
  - **Solution**: Graceful fallback to live SVG
- **Font loading**: If fonts fail to load, fallback fonts may be used
  - **Solution**: Check network connection and Google Fonts availability
- **Pixelation on first load**: Brief moment before high-res version renders
  - **Solution**: This is normal, the high-res version will replace it

## Performance Benchmarks

### Target Metrics

| Metric | SVG (Live) | Rasterized | Improvement |
|--------|-----------|------------|-------------|
| DOM Nodes per Chart | 150-200 | 1 | -99% |
| Render Time (First) | 50ms | 150ms | -200% |
| Render Time (Cached) | 50ms | 10ms | +80% |
| Memory per Chart | 30KB | 5KB | +83% |
| Scroll FPS (50 charts) | 40 FPS | 58 FPS | +45% |

### Your Results

Test Date: _______________

| Test | Result | Notes |
|------|--------|-------|
| Visual Parity | ☐ Pass ☐ Fail | |
| Cache Storage | ☐ Pass ☐ Fail | |
| Performance Improvement | ___% | |
| Accessibility | ☐ Pass ☐ Fail | |
| Stress Test (20 charts) | ___FPS | |

## Troubleshooting

### Charts Not Caching

**Symptoms**: Rasterized charts always show loading state

**Check**:
1. Open Console, look for errors
2. Check IndexedDB is enabled in browser
3. Verify not in private/incognito mode (may restrict IndexedDB)

**Solution**:
```javascript
// Check if IndexedDB is available
console.log('IndexedDB available:', !!window.indexedDB);
```

### Visual Differences Between SVG and Rasterized

**Symptoms**: Rasterized looks different from SVG

**Check**:
1. Ensure same dimensions (width/height)
2. Check dark mode state matches
3. Verify high contrast setting matches
4. Check if fonts have loaded (Sniglet font required)
5. Verify pixel ratio is correct for your display

**Solution**: 
- Clear cache and regenerate
- Check browser console for font loading errors
- Wait a few seconds for fonts to load, then refresh

### Performance Not Improving

**Symptoms**: No performance difference

**Possible Causes**:
1. Cache not being used (check IndexedDB)
2. Too few charts to notice difference (try 50+)
3. Browser is already optimizing SVG well

**Validation**: Run stress test with 50+ charts

## Next Steps After Testing

### If Tests Pass ✅

1. Document your test results
2. Ready for Phase 8.2 integration
3. Can start using RasterizedQuantileVisualization in production

### If Tests Fail ❌

1. Note specific failure scenarios
2. Check console for errors
3. Report issues with:
   - Browser version
   - Error messages
   - Steps to reproduce
   - Screenshots

## Integration Preview

Once testing is complete, integrate into production:

```tsx
// Before
<QuantileVisualization
  scoreType="recyclability"
  data={material.quantileData}
  onClick={handleClick}
/>

// After (Phase 8.2)
<RasterizedQuantileVisualization
  materialId={material.id}
  scoreType="recyclability"
  data={material.quantileData}
  onClick={handleClick}
  enableRasterization={true}
/>
```

## Support

For issues or questions:
- Check `/docs/PHASE_8_CHART_RASTERIZATION.md` for technical details
- Review console errors
- Test in different browsers
- Verify IndexedDB quota not exceeded

---

**Testing Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete  
**Tester**: _______________  
**Date**: _______________  
**Browser**: _______________  
**Result**: ☐ Pass ☐ Fail
