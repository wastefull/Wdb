# Page Template Guide

## Overview

The `PageTemplate` component provides a standardized layout for informational pages in WasteDB. It ensures consistency across features like Testing Pages, Legal/Copyright pages, API Documentation, and other content-heavy views.

## Key Features

✅ **Consistent Back Navigation** - Automatic back button with customizable behavior  
✅ **Responsive Layout** - Mobile-first design that adapts to all screen sizes  
✅ **Typography Standards** - Uses Fredoka One for headers, Sniglet for body text  
✅ **Accessibility Ready** - Respects all WasteDB accessibility settings  
✅ **Flexible Width Control** - Choose from multiple max-width constraints

## Basic Usage

```tsx
import { PageTemplate } from './components/PageTemplate';

export function MyInformationalPage() {
  return (
    <PageTemplate 
      title="My Page Title"
      description="Brief description of what this page is about"
    >
      {/* Your content goes here */}
      <div className="space-y-6">
        <p>Page content...</p>
      </div>
    </PageTemplate>
  );
}
```

## Props Reference

### Required Props

- **title** `string` - The page title displayed at the top
- **children** `React.ReactNode` - The main content of the page

### Optional Props

- **description** `string` - Optional subtitle/description below the title
- **backButtonLabel** `string` - Custom text for back button (default: "Back")
- **onBack** `() => void` - Custom back button handler (default: navigates to materials)
- **hideBackButton** `boolean` - Hide the back button entirely (default: false)
- **className** `string` - Additional CSS classes for the outer container
- **maxWidth** `'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full'` - Max width constraint (default: '4xl')

## Common Patterns

### With Custom Back Navigation

```tsx
<PageTemplate 
  title="Takedown Request"
  onBack={() => navigateToLegalHub()}
  backButtonLabel="Back to Legal Hub"
>
  <TakedownForm />
</PageTemplate>
```

### Wider Layout

```tsx
<PageTemplate 
  title="Data Visualization"
  maxWidth="6xl"
>
  <WideChartComponent />
</PageTemplate>
```

### No Back Button

```tsx
<PageTemplate 
  title="Welcome"
  hideBackButton={true}
>
  <OnboardingContent />
</PageTemplate>
```

## Styling Guidelines

### Typography

The PageTemplate automatically applies:
- **Fredoka One** for the main title (h1)
- **Sniglet** for description and body content

You don't need to manually add font classes to the title or description.

### Content Styling

Within the `children`, you should use standard WasteDB patterns:

```tsx
<PageTemplate title="My Page">
  <div className="space-y-6">
    {/* Cards for grouped content */}
    <Card>
      <CardHeader>
        <CardTitle>Section Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
    
    {/* Alerts for important notices */}
    <Alert>
      <AlertCircle className="size-4" />
      <AlertDescription>
        Important information here
      </AlertDescription>
    </Alert>
  </div>
</PageTemplate>
```

### Responsive Spacing

The template includes responsive padding:
- Mobile: `p-4` (1rem)
- Tablet: `p-6` (1.5rem)
- Desktop: `p-8` (2rem)

Your content should use `space-y-*` utilities for vertical spacing.

## Migration Example

### Before (without template)

```tsx
export function Phase9TestingPage() {
  const { navigateToMaterials } = useNavigationContext();
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button onClick={navigateToMaterials}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
      
      <div>
        <h1 className="text-2xl font-bold">Phase 9.0 Day 1 Testing</h1>
        <p>Legal & Licensing Infrastructure</p>
      </div>
      
      <Card>
        {/* Content */}
      </Card>
    </div>
  );
}
```

### After (with template)

```tsx
export function Phase9TestingPage() {
  return (
    <PageTemplate 
      title="Phase 9.0 Day 1 Testing"
      description="Legal & Licensing Infrastructure"
    >
      <Card>
        {/* Content */}
      </Card>
    </PageTemplate>
  );
}
```

## Best Practices

1. **Always use PageTemplate** for informational pages (testing, docs, legal, etc.)
2. **Don't override fonts** in the title/description - let the template handle it
3. **Use semantic HTML** within children (headings, sections, etc.)
4. **Keep max-width appropriate** - most content pages work best with '4xl' (default)
5. **Provide descriptions** when helpful for user orientation
6. **Custom back handlers** should be used sparingly - default behavior works for most cases

## Accessibility Notes

The PageTemplate automatically inherits all WasteDB accessibility features:
- Font size scaling (controlled by yellow button)
- Dark mode support
- High contrast mode
- Reduced motion
- No pastel mode

You don't need to add special accessibility classes - the template and global CSS handle it.

## Common Use Cases

### Testing/QA Pages
```tsx
<PageTemplate title="Phase X Testing" description="Feature description">
  <TestScenarios />
</PageTemplate>
```

### Legal/Policy Pages
```tsx
<PageTemplate title="Takedown Request" description="DMCA Copyright Claim">
  <TakedownForm />
</PageTemplate>
```

### Documentation Pages
```tsx
<PageTemplate title="API Documentation" maxWidth="6xl">
  <ApiDocs />
</PageTemplate>
```

### Status/Info Pages
```tsx
<PageTemplate title="Request Status" hideBackButton={true}>
  <StatusTracker />
</PageTemplate>
```

## Troubleshooting

**Q: My title isn't using Fredoka One**  
A: Make sure you're not overriding the title with your own h1 tags. Let PageTemplate render the title.

**Q: The layout isn't responsive**  
A: Check that you're not adding fixed widths to your content. Use responsive utilities like `grid-cols-1 md:grid-cols-2`.

**Q: The back button goes to the wrong place**  
A: Use the `onBack` prop to specify custom navigation behavior.

**Q: I need multiple columns on desktop**  
A: The template provides vertical layout. Use flexbox/grid within the children for column layouts.
