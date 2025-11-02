# Phase 8.2: Hover SVG Fixes

**Date**: November 2, 2025  
**Status**: ✅ Complete

## Issues Resolved

### 1. Duplicate Headers
**Problem**: When hovering on desktop and switching to live SVG, the label and score were duplicated - shown both above the chart container AND as part of the SVG itself.

**Solution**: 
- Added `hideHeader` prop to `QuantileVisualization` component
- When rendering live SVG on hover, pass `hideHeader={true}` to suppress duplicate header
- Header continues to render from `RasterizedDisplay` component, maintaining consistent layout

**Files Modified**:
- `/components/QuantileVisualization.tsx` - Added `hideHeader` prop and conditional rendering
- `/components/RasterizedQuantileVisualization.tsx` - Pass `hideHeader={true}` on hover

### 2. Tooltip Clipping
**Problem**: When hovering on desktop, live SVG tooltips were cut off by `overflow: hidden` on the container.

**Solution**:
- Made overflow behavior dynamic based on what's being displayed:
  - `overflow: hidden` when showing PNG (needed to clip 2px buffer edges)
  - `overflow: visible` when showing live SVG (allows tooltips to overflow)

**Implementation**:
```typescript
style={{ 
  width: `${width}px`,
  height: `${height}px`,
  overflow: (isMobile || !isHovered) ? 'hidden' : 'visible'
}}
```

### 3. Duplicate Tooltips
**Problem**: Both the PNG display and live SVG were showing tooltips, creating confusion.

**Solution**:
- Show custom tooltip only on mobile + hover (PNG always displayed)
- On desktop hover, rely on live SVG's built-in tooltips
- Conditional logic: `{isHovered && isMobile && ...}`

## Behavior Matrix

| Device  | Hover State | Display | Header Source | Tooltip Source | Overflow |
|---------|-------------|---------|---------------|----------------|----------|
| Mobile  | Not hovered | PNG     | RasterizedDisplay | None | Hidden |
| Mobile  | Hovered     | PNG     | RasterizedDisplay | Custom | Hidden |
| Desktop | Not hovered | PNG     | RasterizedDisplay | None | Hidden |
| Desktop | Hovered     | Live SVG| RasterizedDisplay | Built-in SVG | Visible |

## Technical Details

### Header Rendering
```typescript
// QuantileVisualization.tsx
{!hideHeader && (
  <div className="flex justify-between items-center">
    <button onClick={onClick}>
      <span>{label}</span>
      {articleCount > 0 && <span>({articleCount})</span>}
    </button>
    <span>{displayScore}</span>
  </div>
)}
```

### Live SVG on Hover
```typescript
// RasterizedQuantileVisualization.tsx
{isMobile || !isHovered ? (
  <img src={dataUrl} /> // PNG
) : (
  <QuantileVisualization
    {...props}
    hideHeader={true} // Suppress duplicate header
  />
)}
```

### Dynamic Overflow
```typescript
overflow: (isMobile || !isHovered) ? 'hidden' : 'visible'
```

## Benefits

1. **No Duplication**: Single source of truth for labels and scores
2. **Clean Layout**: SVG fits perfectly in container without pushing content
3. **Working Tooltips**: Tooltips display properly without clipping
4. **Consistent UX**: User sees one cohesive chart display, not overlapping elements

## Testing Checklist

- [x] Desktop: Hover shows live SVG without duplicate header
- [x] Desktop: Live SVG tooltips display without clipping
- [x] Desktop: Un-hover returns to PNG smoothly
- [x] Mobile: PNG displays with single header
- [x] Mobile: Custom tooltip shows on hover
- [x] No visual jumps or layout shifts during transitions
- [x] Dark mode works correctly for all states
- [x] High contrast mode preserved

## Related Files

- `/components/QuantileVisualization.tsx` - Added `hideHeader` prop
- `/components/RasterizedQuantileVisualization.tsx` - Smart overflow & tooltip logic
- `/docs/PHASE_8.2_SMART_RASTERIZATION.md` - Overall strategy documentation

## Conclusion

The hover-to-SVG transition now works seamlessly with no duplication or clipping issues. Desktop users get the best of both worlds: fast PNG loads with crisp SVG quality on demand, all with a clean, consistent layout.
