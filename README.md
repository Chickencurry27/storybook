# 🦸 Storybook Urban Heroes

A modern design system built with **Storybook 10**, **React 18**, and **SCSS** running on Node 22 Bookworm. Features automatic component generation from Figma with full styling and image support.

## ✨ Features

- 🎨 **React Components** - Modern functional components with hooks
- 💅 **SCSS Styling** - Individual SCSS files per component with design tokens
- 🎯 **Storybook 10** - Latest version with Vite 6 for blazing fast development
- 🎭 **Multiple Variants** - Default, WithImage, and custom variants for each component
- 🖼️ **Image Support** - All components support images with proper styling
- 📦 **Figma Integration** - Automatic sync with Figma design files
- 🔄 **Hot Reload** - Instant updates in Docker and local development
- 🎪 **Interactive Controls** - Edit props live in Storybook

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Start Storybook
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop Storybook
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up --build
```

**Storybook will be available at:** [http://localhost:6006](http://localhost:6006)

### Using npm (Local Development)

> **Note**: Storybook 10 requires Node.js 20.19+ or 22.12+. Use Docker if you have an older version.

```bash
# Install dependencies
npm install

# Start Storybook
npm run storybook

# Build static Storybook
npm run build-storybook
```

## 📦 Available Components

### Core Components

- **Avatar** - User avatars with images or initials
  - Circular design with gradient background
  - Supports images and text content
  - Hover animations

- **Block** - Card container for content
  - Flexbox layout with image support
  - Box shadow and hover effects
  - Perfect for product cards

- **Header** - Page header and navigation
  - Responsive layout
  - Supports logos and navigation
  - Border and shadow styling

- **Dataline** - Data display component
  - Icon prefix
  - Left border accent
  - Gray background

- **Icon** - SVG icon component
  - Multiple sizes (sm, md, lg, xl)
  - Figma SVG assets
  - Color customization

## 🎨 Figma Integration

### Setup

1. Get your Figma credentials:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add:
   - `FIGMA_TOKEN`: Personal Access Token from [Figma Settings](https://www.figma.com/developers/api#access-tokens)
   - `FIGMA_FILE_KEY`: Extract from URL: `https://www.figma.com/file/{FILE_KEY}/...`

### Sync from Figma

```bash
# Fetch everything (tokens, components, assets)
npm run fetch-figma

# Only fetch design tokens
npm run fetch-figma -- --tokens-only

# Only fetch components
npm run fetch-figma -- --components-only

# Only fetch assets
npm run fetch-figma -- --assets-only

# Verbose mode
npm run fetch-figma -- --verbose
```

### What Gets Generated

```
src/
├── components/
│   ├── _variables.scss              # Design system variables
│   ├── Avatar/
│   │   ├── Avatar.jsx               # React component
│   │   ├── Avatar.scss              # Component styles
│   │   └── Avatar.stories.jsx       # Storybook stories
│   └── ...
├── styles/
│   └── _tokens.scss                 # Design tokens from Figma
└── assets/
    └── figma/
        └── *.svg                    # Exported SVG icons
```

## 🎯 Using Components

### Basic Usage

```jsx
import { Avatar, Block, Header, Icon } from './components';

// Avatar with initials
<Avatar>JD</Avatar>

// Avatar with image
<Avatar imageSrc="https://i.pravatar.cc/150">JD</Avatar>

// Block/Card with content
<Block imageSrc="https://via.placeholder.com/300x200">
  <h3>Product Name</h3>
  <p>Description</p>
</Block>

// Header with navigation
<Header>
  <nav>
    <a href="#">Home</a>
    <a href="#">Products</a>
  </nav>
</Header>

// Icon
<Icon name="bell" size="md" />
```

### With Custom Styling

```jsx
// Add custom classes
<Avatar className="avatar--large">XL</Avatar>

// Inline styles
<Block style={{ maxWidth: '400px' }}>
  Content
</Block>
```

## 🎨 Styling

### Design Tokens

All components use CSS custom properties from `_variables.scss`:

```scss
// Spacing
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

// Typography
--font-family: sans-serif;
--font-size-sm: 0.875rem;
--font-size-md: 1rem;
--font-size-lg: 1.25rem;

// Colors
--color-primary: #007bff;
--color-success: #28a745;
--color-danger: #dc3545;
```

### Customizing Components

Edit component SCSS files:

```scss
// src/components/Avatar/Avatar.scss
@use '../variables' as *;

.avatar {
  padding: var(--spacing-md);
  background: var(--color-primary);

  // Your custom styles
  &--large {
    width: 100px;
    height: 100px;
  }
}
```

## 📂 Project Structure

```
.
├── .storybook/              # Storybook configuration
│   ├── main.js              # Main config
│   ├── preview.js           # Preview config
│   └── preview-styles.scss  # Global styles
├── scripts/
│   └── fetch-figma.js       # Figma automation script
├── src/
│   ├── components/          # React components
│   │   ├── _variables.scss  # Design tokens
│   │   ├── Avatar/
│   │   ├── Block/
│   │   ├── Header/
│   │   ├── Dataline/
│   │   └── Icon/
│   ├── stories/             # Documentation
│   │   ├── Introduction.stories.jsx
│   │   └── Welcome.stories.js
│   ├── styles/              # Global styles
│   │   └── _tokens.scss
│   └── assets/              # Static assets
│       └── figma/           # Figma exports
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 🛠️ Tech Stack

- **Node.js**: v22.21.1 (Bookworm)
- **React**: 18.3.1
- **Storybook**: 10.0.5
- **Build Tool**: Vite 6
- **Styling**: SCSS/Sass
- **API Integration**: Figma REST API (axios)

## 📖 Story Variants

Each component includes multiple story variants:

- **Default** - Basic component
- **WithImage** - Component with image
- **WithCustomClass** - Custom styling example
- **Composed Examples** - Real-world usage (AvatarGroup, ProductCard, etc.)

## 🎪 Storybook Features

### Controls Panel
- Edit props in real-time
- Change text content
- Add images with URLs
- Toggle classes

### Backgrounds
- Light (default)
- Dark
- Gray

### Docs
- Auto-generated documentation
- Component API
- Props table
- Usage examples

## 🔧 Development

### Adding New Components

1. Create component folder:
   ```bash
   mkdir src/components/MyComponent
   ```

2. Add files:
   - `MyComponent.jsx` - React component
   - `MyComponent.scss` - Styles
   - `MyComponent.stories.jsx` - Stories

3. Or use fetch-figma:
   ```bash
   npm run fetch-figma -- --components-only
   ```

### Docker Commands

```bash
# Build and start
docker-compose up --build

# Restart after changes
docker-compose restart

# Rebuild image
docker-compose build --no-cache

# Access container shell
docker-compose exec storybook sh

# View real-time logs
docker-compose logs -f storybook
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 6006
lsof -ti :6006 | xargs kill -9

# Or use different port
docker-compose down
# Edit docker-compose.yml: "6007:6006"
docker-compose up
```

### Styles Not Loading

1. Check SCSS imports use `@use` not `@import`
2. Restart Storybook: `docker-compose restart`
3. Clear cache: `docker-compose down && docker-compose up --build`

### Figma Variables 403 Error

This is normal! The Variables API requires a Figma Professional plan. Components and assets will still sync successfully. You can manually add design tokens to `src/components/_variables.scss`.

## 📝 Notes

- **Figma Pro Not Required**: Basic features work with free Figma accounts
- **SCSS Styling**: Fully independent of Figma Variables API
- **Image Support**: All components support images out of the box
- **Hot Reload**: Works in both Docker and local development
- **Production Ready**: Build with `npm run build-storybook`

## 🎉 What's Included

✅ 6+ React components with full styling
✅ SCSS design tokens and variables
✅ Storybook 10 with multiple story variants
✅ Figma integration for automatic updates
✅ SVG icon support
✅ Image support in all components
✅ Interactive controls and documentation
✅ Docker setup for consistent development
✅ Hot module replacement
✅ Zero vulnerabilities

## 📄 License

MIT

---

Built with ❤️ using Storybook 10.0.5, React 18, and SCSS
