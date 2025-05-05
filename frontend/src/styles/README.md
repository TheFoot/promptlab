# Styles

This directory contains global styles and styling variables for the PromptLab application. The application uses SCSS for styling.

## Files

- `main.scss` - Main stylesheet with global styles
- `variables.scss` - SCSS variables for consistent theming

## Main.scss

The `main.scss` file contains global styles that apply throughout the application, including:

- CSS reset/normalization
- Typography settings
- Global layout styles
- Utility classes
- Dark/light mode theming

## Variables.scss

The `variables.scss` file defines SCSS variables for consistent styling:

```scss
// Colors
$primary-color: #2c3e50;
$secondary-color: #42b983;
$background-light: #f9f9f9;
$background-dark: #1a1a1a;
$text-light: #333;
$text-dark: #eee;

// Typography
$font-family-base:
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
$font-family-mono: "Fira Code", monospace;
$font-size-base: 16px;
$line-height-base: 1.5;

// Spacing
$spacing-xs: 0.25rem; // 4px
$spacing-sm: 0.5rem; // 8px
$spacing-md: 1rem; // 16px
$spacing-lg: 1.5rem; // 24px
$spacing-xl: 2rem; // 32px

// Breakpoints
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;

// Other
$border-radius: 4px;
$transition-speed: 0.2s;
```

## Usage in Components

To use these styles in Vue components:

```vue
<style scoped lang="scss">
@import "../styles/variables.scss";

.some-element {
  color: $primary-color;
  font-family: $font-family-base;
  padding: $spacing-md;
  border-radius: $border-radius;
  transition: all $transition-speed ease;
}
</style>
```

## Dark Mode Support

The styles include CSS variables for dark/light mode theming:

```scss
:root {
  --bg-color: #{$background-light};
  --text-color: #{$text-light};
}

[data-theme="dark"] {
  --bg-color: #{$background-dark};
  --text-color: #{$text-dark};
}
```

## Adding New Styles

When adding new styles:

1. Use SCSS variables from `variables.scss` for consistency
2. Add component-specific styles in scoped component style blocks
3. Add global styles or utilities in `main.scss`
4. Support both light and dark themes
5. Use responsive design with the defined breakpoints

## Related Documentation

- [Frontend README](../../README.md)
- [Components](../components/README.md)
