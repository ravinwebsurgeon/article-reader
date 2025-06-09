# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `yarn install` - Install dependencies
- `npx expo start` - Start development server
- `yarn android` - Run on Android
- `yarn ios` - Run on iOS
- `yarn web` - Start web version
- `yarn test` - Run Jest tests with watch mode
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript compiler check (no emit)
- `yarn lint-type-check` - Run both lint and type check
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check formatting without writing

### Build Commands

- `eas build` - Build with EAS (Expo Application Services)

## Architecture Overview

### App Structure

This is an Expo React Native app using:

- **File-based routing** with Expo Router
- **WatermelonDB** for local database with sync capabilities
- **Redux Toolkit** with RTK Query for state management
- **Custom theme system** with light/dark mode support

### Key Architectural Layers

#### 1. Database Layer (WatermelonDB)

- **Models**: `Item`, `Tag`, `ItemTag`, `Annotation` - core data entities
- **Sync Engine**: Handles bidirectional sync between local database and server
- **Real-time Updates**: WebSocket listener for server changes (`ServerChangesListener`)
- **Content Syncing**: Separate `ItemContentSyncer` for article content
- **Database Provider**: React context providing database access throughout app

#### 2. State Management (Redux + RTK Query)

- **Store**: Persisted with Redux Persist (auth, theme)
- **API Services**: `authApi`, `userApi`, main `api` service
- **Slices**: `authSlice`, `themeSlice`, `networkSlice`
- **Middleware**: Custom token refresh middleware

#### 3. Theme System

- **ThemeProvider**: Manages light/dark/system theme modes
- **Theme Tokens**: Colors, typography, spacing, shadows in `/theme/tokens/`
- **Theme Components**: `ThemeView`, `ThemeText`, `ThemeButton`, etc. with built-in theme integration
- **Path**: `@/theme` contains all theme-related code

#### 4. Component Architecture

- **Primitives**: `ThemeView`, `ThemeText`, `ThemeInput`, etc. (`/components/primitives/`)
- **Shared Components**: Reusable UI components (`/components/shared/`)
- **Feature Components**: Item-specific, reader-specific components
- **UI Components**: Form inputs, buttons (`/components/ui/`)

#### 5. Navigation Structure

- **(auth)**: Authentication flow (login, signup)
- **(tabs)**: Main app tabs (index, discover, settings, connect-extension)
- **reader/[id]**: Article reader with dynamic routing
- **Modals**: edit-tags, add-article

### Data Flow Patterns

#### Sync Architecture

1. **Local Changes**: Database changes trigger auto-sync via `watchForChanges()`
2. **Server Changes**: WebSocket notifications trigger sync from server
3. **Debounced Sync**: 250ms debounce prevents excessive sync operations
4. **Content Sync**: Article content synced separately after main sync

#### Authentication Flow

- Token stored in Redux (persisted) and AsyncStorage
- Token refresh middleware handles expired tokens
- SyncEngine automatically uses current auth token

### File-based Routing

- `app/` directory contains all routes
- `_layout.tsx` files define nested layouts
- `[id].tsx` for dynamic routes
- Groups: `(auth)`, `(tabs)` for organizing routes

### Internationalization

- i18next with react-i18next
- Language files in `/i18n/` (en, de, es, fr, zh)
- Localization context available throughout app

### Platform Considerations

- Cross-platform components with `.web.tsx` variants where needed
- Platform-specific sync optimizations (turbo mode disabled on web)
- Share extension support for iOS/Android

## Development Patterns

### Database Operations

Use hooks from `/database/hooks/`:

- `withItems` - Item queries and operations
- `withTags` - Tag management
- `withAnnotations` - Reader annotations
- Access via `useDatabase()` hook from DatabaseProvider

### Theme Usage

```tsx
import { useTheme, useColors } from "@/theme";
// Or use theme components directly
import { ThemeView, ThemeText } from "@/components/primitives";
```

### API Calls

Use RTK Query hooks from `/redux/services/`:

```tsx
import { useGetUserQuery } from "@/redux/services/userApi";
```

### Path Aliases

- `@/*` resolves to project root
- Used throughout for clean imports

### Sync Considerations

- Sync operations are debounced and promise-based
- Only one sync can run at a time
- Manual sync via `syncEngine.sync()`
- First sync uses turbo mode for performance (except web)

## Development Notes

### Running Linting/Type Checking

Always run `yarn lint-type-check` before committing changes. The project uses TypeScript strict mode.

### Database Migrations

Database schema changes require proper WatermelonDB migrations in `/database/migration/`.

### Testing

Jest tests configured with `jest-expo` preset. Run `yarn test` for watch mode.

### Fonts

Custom fonts (Inter, Literata) loaded in app/\_layout.tsx. Base64 encoded versions available for web compatibility.

### Share Functionality

App supports receiving shared URLs via `ShareHandler` - handles both cold starts and hot links.
