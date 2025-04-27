# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   yarn install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
yarn run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Theme System

The theme system is the foundation of the UI, providing consistent styling across the app.

### Theme Tokens

Core values that define the visual identity:

- Colors: Brand colors, feedback colors, text colors, etc.
- Typography: Font families, sizes, weights, etc.
- Spacing: Consistent spacing scale
- Shadows: Elevation levels for depth

### Theme Provider

The `ThemeProvider` component provides theme context to the app:

```tsx
// Example usage
import { ThemeProvider } from '@/theme';

export default function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Theme Hooks

Custom hooks for accessing theme values:

- `useTheme()`: Access the entire theme object
- `useColors()`: Access the theme colors
- `useTypography()`: Access the typography styles
- `useSpacing()`: Access the spacing scale
- `useShadows()`: Access the shadow values
- `useDarkMode()`: Check if dark mode is active

```tsx
// Example usage
import { useTheme, useColors } from '@/theme';

function MyComponent() {
  const theme = useTheme();
  const colors = useColors();

  return (
    <View
      style={{
        padding: theme.spacing.md,
        backgroundColor: colors.background.default,
      }}
    >
      {/* Component content */}
    </View>
  );
}
```

## Component Library

### Core Components

Base components with theme integration:

- `ThemeView`: Themed replacement for View
- `ThemeText`: Themed replacement for Text
- `ThemeImage`: Themed replacement for Image
- `ThemeTouchable`: Themed replacement for TouchableOpacity
- `ThemeButton`: Configurable button component
- `ThemeInput`: Themed text input component

```tsx
// Example usage
import { ThemeView, ThemeText } from '@/components/core';

function MyComponent() {
  return (
    <ThemeView padded rounded elevation={2}>
      <ThemeText variant="h2">Hello World</ThemeText>
    </ThemeView>
  );
}
```

### UI Components

Specialized components for specific UI patterns:

- `Card`: Container with elevation and rounded corners
- `Tag`: Label with optional icon and close button
- `SearchInput`: Search input with icon and clear button
- `ArticleCard`: Card for displaying article information
- `FilterTabs`: Horizontal tabs for filtering content
- `ActionMenu`: Modal menu for item actions
- `NoItemsFound`: Empty state component

```tsx
// Example usage
import { Card, Tag, SearchInput } from '@/components/ui';

function MyComponent() {
  return (
    <Card>
      <SearchInput placeholder="Search..." />
      <Tag label="Important" active />
    </Card>
  );
}
```

### Core Component API

#### ThemeView

A themed replacement for the standard View component.

```tsx
<ThemeView
  backgroundColor="string" // Optional custom background color
  elevation={0 - 5} // Optional shadow elevation (0-5)
  padded={true | 'xs' | 'sm' | 'md' | 'lg' | 'xl'} // Optional padding
  margin={true | 'xs' | 'sm' | 'md' | 'lg' | 'xl'} // Optional margin
  rounded={true | 'sm' | 'md' | 'lg' | 'full'} // Optional border radius
  centered={true | false} // Center children (both axes)
  row={true | false} // Use row direction
  style={StyleProp} // Optional additional styles
  {...ViewProps} // All standard View props
/>
```

#### ThemeText

A themed replacement for the standard Text component.

```tsx
<ThemeText
  variant="h1"|"h2"|"h3"|"h4"|"h5"|"h6"|"body1"|"body2"|"body1Bold"|"body2Bold"|"subtitle1"|"subtitle2"|"caption"|"overline"|"button"
  color="string" // Optional custom text color
  align="auto"|"left"|"right"|"center"|"justify" // Text alignment
  bold={true|false} // Make text bold
  italic={true|false} // Make text italic
  underline={true|false} // Add underline
  uppercase={true|false} // Transform to uppercase
  lowercase={true|false} // Transform to lowercase
  capitalize={true|false} // Capitalize first letter of each word
  style={StyleProp} // Optional additional styles
  {...TextProps} // All standard Text props
/>
```

#### ThemeButton

A configurable button component with various styles.

```tsx
<ThemeButton
  title="string" // Button text
  onPress={function} // Press handler
  variant="filled"|"outlined"|"text" // Button style variant
  size="sm"|"md"|"lg" // Button size
  color="primary"|"secondary"|"success"|"error"|"warning"|"info" // Button color
  disabled={true|false} // Disable button
  loading={true|false} // Show loading indicator
  fullWidth={true|false} // Take full width
  leftIcon={ReactNode} // Optional icon on the left
  rightIcon={ReactNode} // Optional icon on the right
  style={StyleProp} // Optional container styles
  textStyle={StyleProp} // Optional text styles
  uppercase={true|false} // Transform text to uppercase
/>
```

### UI Component Examples

#### Card

```tsx
<Card elevation={2} padded="md" rounded="md" contentStyle={{ gap: 16 }}>
  <ThemeText variant="h6">Card Title</ThemeText>
  <ThemeText>Card content goes here.</ThemeText>
</Card>
```

#### ArticleCard

```tsx
<ArticleCard
  item={{
    id: 1,
    title: 'Article Title',
    source: 'Source Name',
    readTime: 5,
    thumbnail: 'https://example.com/image.jpg',
    favorite: true,
    tags: ['Technology', 'Science'],
  }}
  onPress={() => console.log('Article pressed')}
  onMenuPress={() => console.log('Menu pressed')}
/>
```

#### FilterTabs

```tsx
<FilterTabs
  currentFilter="all"
  onFilterChange={(filter) => console.log('Filter changed:', filter)}
  options={[
    { id: 'all', label: 'All', icon: 'list-outline' },
    { id: 'favorites', label: 'Favorites', icon: 'star-outline' },
    { id: 'tagged', label: 'Tagged', icon: 'pricetag-outline' },
  ]}
/>
```

## State Management

The app uses Redux with RTK Query for state management and API interactions.

### Redux Store

The store is configured with:

- Redux Persist: For persisting state across sessions
- RTK Query: For data fetching and caching
- Custom Middleware: For side effects like token refresh

### Redux Slices

Feature-specific state modules:

- Auth Slice: Authentication state
- Theme Slice: Theme preference state
- Network Slice: Network connectivity state

### API Services

RTK Query services for data fetching:

- Items API: CRUD operations for items
- Auth API: Authentication operations
- User API: User profile operations

## Best Practices

### Component Design

- Props Interface: Define clear prop interfaces for each component
- Default Props: Provide sensible defaults
- Composition: Build complex components from simpler ones
- Memoization: Use React.memo() for expensive renders
- Hooks: Extract complex logic into custom hooks

### Styling

- Theme-First: Use the theme system for all styling
- Responsive Design: Support different screen sizes
- Consistent Spacing: Use the spacing scale
- Typography Scale: Use the typography variants
- Color System: Use the color tokens

### State Management

- Normalized State: Store entities in normalized form
- Selectors: Use selectors to access state
- Action Creators: Use typed action creators
- Immutability: Never mutate state directly
- Side Effects: Handle side effects in middleware or thunks

### Performance

- Virtualization: Use FlatList for long lists
- Lazy Loading: Load resources on demand
- Memoization: Memoize expensive calculations
- API Caching: Use RTK Query's caching
- Image Optimization: Use appropriate image sizes and formats

## Extending the System

### Adding New Components

1. Create a new file in the appropriate directory
2. Define the component's props interface
3. Implement the component using existing core components
4. Document the component's API
5. Export the component from the index file

### Adding New Theme Tokens

1. Extend the appropriate token file (colors.ts, typography.ts, etc.)
2. Update the Theme interface if necessary
3. Add the new tokens to both light and dark themes

### Adding New Redux Features

1. Create a new slice file
2. Define the state interface and initial state
3. Implement reducers for state changes
4. Export action creators and reducer
5. Add the reducer to the root reducer
