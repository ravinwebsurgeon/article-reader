// src/components/index.ts

/**
 * Pocket App Component System
 * 
 * This file exports all UI components for the Pocket app,
 * including core themed components and higher-level UI components.
 * 
 * The component system follows a hierarchical structure:
 * 1. Core Components: Basic building blocks with theme integration
 * 2. UI Components: Composed of core components for specific UI patterns
 * 3. Screen Components: Complete screens composed of UI components
 * 
 * All components are designed to be:
 * - Reusable: Components are generic enough to be used in multiple contexts
 * - Consistent: All components follow the same design language and API patterns
 * - Themeable: All components automatically adapt to the current theme
 * - Accessible: Components include appropriate accessibility attributes
 */

// Export core themed components
export * from './core';


/**
 * Usage Guide
 * 
 * 1. Core components provide theme integration with minimal styling:
 * 
 * ```tsx
 * import { ThemeView, ThemeText } from '@/components';
 * 
 * function MyComponent() {
 *   return (
 *     <ThemeView padded rounded elevation={2}>
 *       <ThemeText variant="h2">Hello World</ThemeText>
 *     </ThemeView>
 *   );
 * }
 * ```
 
 * 2. For consistent styling, use the theme properties:
 * 
 * - Spacing: 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'
 * - Typography: 'h1' through 'h6', 'body1', 'body2', etc.
 * - Elevation: 0-5 for shadow intensity
 * - Rounding: 'sm', 'md', 'lg', 'full' for border radius
 */