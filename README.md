# Storybook Urban Heroes

A design system built with Storybook 10, Twig templates, and SCSS running on Node 22 Bookworm.

## Quick Start

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
```

Storybook will be available at [http://localhost:6006](http://localhost:6006)

### Using npm (Local Development)

> **Note**: Storybook 10 requires Node.js 20.19+ or 22.12+. If you have an older version, use Docker instead.

```bash
# Install dependencies
npm install

# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

## Figma Integration

### Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   - `FIGMA_TOKEN`: Get from [Figma Account Settings](https://www.figma.com/developers/api#access-tokens)
   - `FIGMA_FILE_KEY`: Extract from your Figma URL: `https://www.figma.com/file/{FILE_KEY}/...`

### Fetch Design System from Figma

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
├── styles/
│   └── _tokens.scss              # Design tokens (colors, typography, spacing)
├── assets/
│   └── figma/
│       ├── icon-name.svg         # Exported SVG assets
│       └── ...
└── components/
    ├── Button/
    │   ├── Button.twig           # Twig template
    │   └── Button.stories.js     # Storybook story
    └── ...
```

## Project Structure

```
.
├── .storybook/              # Storybook configuration
├── scripts/
│   └── fetch-figma.js       # Figma automation script
├── src/
│   ├── components/          # Component templates & stories
│   ├── stories/             # Documentation stories
│   ├── styles/              # SCSS files and tokens
│   └── assets/              # Static assets
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker image definition
└── package.json             # Node.js dependencies
```

## Tech Stack

- **Node.js**: v22.21.1 (Bookworm)
- **Storybook**: v10.0.5
- **Template Engine**: Twig
- **Styling**: SCSS/Sass
- **Build Tool**: Vite 6
- **API Integration**: Figma REST API

## Available Scripts

- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build static Storybook
- `npm run fetch-figma` - Sync design system from Figma

## Docker Commands

```bash
# Build and start
docker-compose up --build

# Restart after changes
docker-compose restart

# Rebuild image
docker-compose build --no-cache

# Access container shell
docker-compose exec storybook sh
```

## Development Notes

- Hot reload is enabled in both local and Docker environments
- Changes to `.twig`, `.scss`, and `.js` files will auto-reload
- Port 6006 is exposed for Storybook
- Node modules are cached in Docker for faster rebuilds

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 6006
lsof -ti :6006 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "6007:6006"  # Use 6007 instead
```

### Docker Issues

```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up

# View logs
docker-compose logs -f storybook
```

## License

MIT
