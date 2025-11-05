#!/usr/bin/env node

/**
 * Figma Design System Automation
 *
 * Fetches design tokens, components, and assets from Figma and generates:
 * - SCSS design tokens (_tokens.scss)
 * - SVG/image assets (src/assets/figma/)
 * - Twig component templates (src/components/{Name}/{Name}.twig)
 * - Storybook stories ({Name}.stories.js)
 *
 * Usage:
 *   node scripts/fetch-figma.js
 *   node scripts/fetch-figma.js --tokens-only
 *   node scripts/fetch-figma.js --components-only
 *   node scripts/fetch-figma.js --assets-only
 */

import axios from 'axios';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Setup ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

// Configuration
const config = {
  figmaToken: process.env.FIGMA_TOKEN,
  figmaFileKey: process.env.FIGMA_FILE_KEY,
  baseUrl: 'https://api.figma.com/v1',
  outputDirs: {
    tokens: path.join(rootDir, 'src/styles'),
    assets: path.join(rootDir, 'src/assets/figma'),
    components: path.join(rootDir, 'src/components'),
  },
};

// CLI flags
const args = process.argv.slice(2);
const flags = {
  tokensOnly: args.includes('--tokens-only'),
  componentsOnly: args.includes('--components-only'),
  assetsOnly: args.includes('--assets-only'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

// Logging utilities
const log = {
  info: (msg) => console.log(`ℹ ${msg}`),
  success: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.error(`✗ ${msg}`),
  warn: (msg) => console.warn(`⚠ ${msg}`),
  debug: (msg) => flags.verbose && console.log(`  ${msg}`),
};

/**
 * Axios instance configured for Figma API
 */
const figmaApi = axios.create({
  baseURL: config.baseUrl,
  headers: {
    'X-Figma-Token': config.figmaToken,
  },
});

/**
 * Validate required environment variables
 */
function validateConfig() {
  if (!config.figmaToken) {
    throw new Error('FIGMA_TOKEN is not set in .env file');
  }
  if (!config.figmaFileKey) {
    throw new Error('FIGMA_FILE_KEY is not set in .env file');
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 */
async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
    log.debug(`Created directory: ${dirPath}`);
  }
}

/**
 * Check if file content has changed before writing
 */
async function writeFileIfChanged(filePath, content) {
  let shouldWrite = true;

  if (existsSync(filePath)) {
    const existingContent = await fs.readFile(filePath, 'utf-8');
    if (existingContent === content) {
      shouldWrite = false;
      log.debug(`Skipped (unchanged): ${path.basename(filePath)}`);
    }
  }

  if (shouldWrite) {
    await fs.writeFile(filePath, content, 'utf-8');
    log.success(`Written: ${path.relative(rootDir, filePath)}`);
  }

  return shouldWrite;
}

/**
 * Fetch the Figma file data
 */
async function fetchFigmaFile() {
  log.info('Fetching Figma file...');

  try {
    const response = await figmaApi.get(`/files/${config.figmaFileKey}`);
    log.success(`Fetched Figma file: ${response.data.name}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch Figma file: ${error.message}`);
  }
}

/**
 * Fetch local variables (design tokens) from Figma
 */
async function fetchVariables() {
  log.info('Fetching design variables...');

  try {
    const response = await figmaApi.get(`/files/${config.figmaFileKey}/variables/local`);
    log.success(`Fetched ${Object.keys(response.data.meta.variables || {}).length} variables`);
    return response.data;
  } catch (error) {
    log.warn(`Could not fetch variables: ${error.message}`);
    return { meta: { variables: {}, variableCollections: {} } };
  }
}

/**
 * Convert Figma color to SCSS format
 */
function figmaColorToScss(color) {
  if (!color) return null;

  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? color.a : 1;

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert variable name to SCSS token name
 */
function toTokenName(name) {
  return name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase();
}

/**
 * Extract design tokens from Figma variables and styles
 */
async function extractDesignTokens(fileData, variablesData) {
  log.info('Extracting design tokens...');

  const tokens = {
    colors: {},
    typography: {},
    spacing: {},
    other: {},
  };

  // Extract from local variables
  const variables = variablesData.meta.variables || {};
  const collections = variablesData.meta.variableCollections || {};

  Object.values(variables).forEach((variable) => {
    const tokenName = toTokenName(variable.name);
    const collection = collections[variable.variableCollectionId];
    const collectionName = collection?.name || 'default';

    // Get the default mode value
    const modeId = Object.keys(variable.valuesByMode)[0];
    const value = variable.valuesByMode[modeId];

    let tokenValue;

    switch (variable.resolvedType) {
      case 'COLOR':
        tokenValue = figmaColorToScss(value);
        if (tokenValue) {
          tokens.colors[tokenName] = tokenValue;
        }
        break;

      case 'FLOAT':
        if (variable.name.toLowerCase().includes('spacing') ||
            variable.name.toLowerCase().includes('space') ||
            variable.name.toLowerCase().includes('gap') ||
            variable.name.toLowerCase().includes('padding') ||
            variable.name.toLowerCase().includes('margin')) {
          tokens.spacing[tokenName] = `${value}px`;
        } else if (variable.name.toLowerCase().includes('font-size') ||
                   variable.name.toLowerCase().includes('line-height')) {
          tokens.typography[tokenName] = `${value}px`;
        } else {
          tokens.other[tokenName] = value;
        }
        break;

      case 'STRING':
        if (variable.name.toLowerCase().includes('font')) {
          tokens.typography[tokenName] = `"${value}"`;
        } else {
          tokens.other[tokenName] = `"${value}"`;
        }
        break;

      default:
        tokens.other[tokenName] = value;
    }
  });

  // Extract colors from document styles (fallback)
  if (fileData.styles) {
    Object.entries(fileData.styles).forEach(([styleId, style]) => {
      if (style.styleType === 'FILL') {
        const tokenName = toTokenName(style.name);
        if (!tokens.colors[tokenName]) {
          // We'd need to fetch the style details to get the actual color
          log.debug(`Found fill style: ${style.name}`);
        }
      } else if (style.styleType === 'TEXT') {
        const tokenName = toTokenName(style.name);
        log.debug(`Found text style: ${style.name}`);
      }
    });
  }

  log.success(`Extracted ${Object.keys(tokens.colors).length} color tokens`);
  log.success(`Extracted ${Object.keys(tokens.typography).length} typography tokens`);
  log.success(`Extracted ${Object.keys(tokens.spacing).length} spacing tokens`);

  return tokens;
}

/**
 * Generate SCSS tokens file
 */
async function generateTokensScss(tokens) {
  log.info('Generating SCSS tokens file...');

  await ensureDir(config.outputDirs.tokens);

  const lines = [
    '/**',
    ' * Design Tokens',
    ' * Auto-generated from Figma',
    ' * Do not edit manually',
    ' */',
    '',
    '// Export tokens as CSS custom properties',
    ':root {',
  ];

  // Colors
  if (Object.keys(tokens.colors).length > 0) {
    lines.push('  // Colors');
    Object.entries(tokens.colors).forEach(([name, value]) => {
      lines.push(`  --${name}: ${value};`);
    });
    lines.push('');
  }

  // Typography
  if (Object.keys(tokens.typography).length > 0) {
    lines.push('  // Typography');
    Object.entries(tokens.typography).forEach(([name, value]) => {
      lines.push(`  --${name}: ${value};`);
    });
    lines.push('');
  }

  // Spacing
  if (Object.keys(tokens.spacing).length > 0) {
    lines.push('  // Spacing');
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      lines.push(`  --${name}: ${value};`);
    });
    lines.push('');
  }

  // Other
  if (Object.keys(tokens.other).length > 0) {
    lines.push('  // Other');
    Object.entries(tokens.other).forEach(([name, value]) => {
      lines.push(`  --${name}: ${value};`);
    });
    lines.push('');
  }

  lines.push('}');
  lines.push('');

  // Also export as SCSS variables for backward compatibility
  lines.push('// SCSS Variables');
  lines.push('');

  if (Object.keys(tokens.colors).length > 0) {
    lines.push('// Colors');
    Object.entries(tokens.colors).forEach(([name, value]) => {
      lines.push(`$${name}: ${value};`);
    });
    lines.push('');
  }

  if (Object.keys(tokens.typography).length > 0) {
    lines.push('// Typography');
    Object.entries(tokens.typography).forEach(([name, value]) => {
      lines.push(`$${name}: ${value};`);
    });
    lines.push('');
  }

  if (Object.keys(tokens.spacing).length > 0) {
    lines.push('// Spacing');
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      lines.push(`$${name}: ${value};`);
    });
    lines.push('');
  }

  const content = lines.join('\n');
  const filePath = path.join(config.outputDirs.tokens, '_tokens.scss');

  await writeFileIfChanged(filePath, content);
}

/**
 * Find all component nodes in the Figma file
 */
function findComponents(node, components = []) {
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    components.push(node);
  }

  if (node.children) {
    node.children.forEach((child) => findComponents(child, components));
  }

  return components;
}

/**
 * Find all exportable nodes (images, icons, etc.)
 */
function findExportableNodes(node, exportables = []) {
  // Look for nodes with exportSettings or vector nodes
  if (node.exportSettings && node.exportSettings.length > 0) {
    exportables.push(node);
  } else if (node.type === 'VECTOR' ||
             node.type === 'BOOLEAN_OPERATION' ||
             node.type === 'STAR' ||
             node.type === 'ELLIPSE' ||
             node.type === 'POLYGON' ||
             node.type === 'RECTANGLE' && node.fills?.[0]?.type === 'IMAGE') {
    exportables.push(node);
  }

  if (node.children) {
    node.children.forEach((child) => findExportableNodes(child, exportables));
  }

  return exportables;
}

/**
 * Export images from Figma
 */
async function exportImages(fileData) {
  log.info('Finding exportable images...');

  const exportableNodes = findExportableNodes(fileData.document);

  if (exportableNodes.length === 0) {
    log.warn('No exportable images found');
    return;
  }

  log.info(`Found ${exportableNodes.length} exportable nodes`);

  // Batch export (Figma API supports up to 100 IDs per request)
  const batchSize = 100;
  const batches = [];

  for (let i = 0; i < exportableNodes.length; i += batchSize) {
    batches.push(exportableNodes.slice(i, i + batchSize));
  }

  await ensureDir(config.outputDirs.assets);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const nodeIds = batch.map(node => node.id).join(',');

    try {
      log.info(`Exporting batch ${batchIndex + 1}/${batches.length}...`);

      // Request SVG exports
      const response = await figmaApi.get(`/images/${config.figmaFileKey}`, {
        params: {
          ids: nodeIds,
          format: 'svg',
          svg_include_id: true,
        },
      });

      const images = response.data.images;

      // Download each image
      for (const node of batch) {
        const imageUrl = images[node.id];

        if (!imageUrl) {
          log.warn(`No image URL for node: ${node.name}`);
          continue;
        }

        try {
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
          });

          const filename = `${toTokenName(node.name)}.svg`;
          const filePath = path.join(config.outputDirs.assets, filename);

          await fs.writeFile(filePath, imageResponse.data);
          log.success(`Downloaded: ${filename}`);
        } catch (error) {
          log.error(`Failed to download ${node.name}: ${error.message}`);
        }
      }
    } catch (error) {
      log.error(`Failed to export batch ${batchIndex + 1}: ${error.message}`);
    }
  }
}

/**
 * Sanitize component name for file system
 */
function sanitizeComponentName(name) {
  // Remove special characters and convert to PascalCase
  return name
    .split(/[^a-zA-Z0-9]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Generate React component
 */
function generateReactComponent(component) {
  const componentName = sanitizeComponentName(component.name);
  const componentClass = componentName.toLowerCase();

  return `import React from 'react';
import './${componentName}.scss';

/**
 * ${componentName} Component
 * Auto-generated from Figma
 */
export const ${componentName} = ({
  children = '${componentName}',
  className = '',
  imageSrc = null,
  imageAlt = '${componentName} image',
  ...props
}) => {
  return (
    <div className={\`${componentClass} \${className}\`.trim()} {...props}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="${componentClass}__image"
        />
      )}
      <div className="${componentClass}__content">
        {children}
      </div>
    </div>
  );
};

export default ${componentName};
`;
}

/**
 * Generate SCSS file for a component
 */
function generateComponentScss(component) {
  const componentName = sanitizeComponentName(component.name);
  const componentClass = componentName.toLowerCase();

  return `@use '../variables' as *;

.${componentClass} {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-md, 1rem);
  font-family: var(--font-family, sans-serif);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 60px;
  min-width: 120px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &__image {
    max-width: 100%;
    height: auto;
    max-height: 200px;
    border-radius: 4px;
  }

  &__content {
    text-align: center;
    width: 100%;
  }

  // Add your custom styles based on Figma design here
}
`;
}

/**
 * Generate Storybook story for a React component
 */
function generateStorybookStory(component) {
  const componentName = sanitizeComponentName(component.name);

  return `import React from 'react';
import { ${componentName} } from './${componentName}';

/**
 * ${componentName} Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/${componentName}',
  component: ${componentName},
  argTypes: {
    children: {
      control: 'text',
      description: 'Component content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    imageSrc: {
      control: 'text',
      description: 'Image source URL',
    },
    imageAlt: {
      control: 'text',
      description: 'Image alt text',
    },
  },
};

const Template = (args) => <${componentName} {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: '${componentName}',
};

export const WithImage = Template.bind({});
WithImage.args = {
  children: '${componentName} with image',
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: '${componentName} placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: '${componentName} with custom class',
  className: 'custom-variant',
};
`;
}

/**
 * Generate components (React components, SCSS, and Storybook stories)
 */
async function generateComponents(fileData) {
  log.info('Finding components...');

  const components = findComponents(fileData.document);

  if (components.length === 0) {
    log.warn('No components found in Figma file');
    return;
  }

  log.info(`Found ${components.length} components`);

  await ensureDir(config.outputDirs.components);

  // Create a _variables.scss file in components folder
  const variablesPath = path.join(config.outputDirs.components, '_variables.scss');
  const variablesContent = `// Design System Variables
// Auto-generated from Figma

// Import main tokens
@use '../styles/tokens';

// CSS Variables
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-info: #17a2b8;
}
`;
  await writeFileIfChanged(variablesPath, variablesContent);

  for (const component of components) {
    const componentName = sanitizeComponentName(component.name);
    const componentDir = path.join(config.outputDirs.components, componentName);

    await ensureDir(componentDir);

    // Generate React component
    const reactContent = generateReactComponent(component);
    const reactPath = path.join(componentDir, `${componentName}.jsx`);
    await writeFileIfChanged(reactPath, reactContent);

    // Generate SCSS file
    const scssContent = generateComponentScss(component);
    const scssPath = path.join(componentDir, `${componentName}.scss`);
    await writeFileIfChanged(scssPath, scssContent);

    // Generate Storybook story
    const storyContent = generateStorybookStory(component);
    const storyPath = path.join(componentDir, `${componentName}.stories.jsx`);
    await writeFileIfChanged(storyPath, storyContent);

    log.debug(`Generated component: ${componentName}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  log.info('Starting Figma sync...');
  console.log('');

  try {
    // Validate configuration
    validateConfig();

    // Determine what to fetch based on flags
    const shouldFetchTokens = !flags.componentsOnly && !flags.assetsOnly;
    const shouldFetchAssets = !flags.tokensOnly && !flags.componentsOnly;
    const shouldFetchComponents = !flags.tokensOnly && !flags.assetsOnly;

    // Fetch Figma data
    const fileData = await fetchFigmaFile();

    // Process design tokens
    if (shouldFetchTokens) {
      const variablesData = await fetchVariables();
      const tokens = await extractDesignTokens(fileData, variablesData);
      await generateTokensScss(tokens);
    }

    // Export assets
    if (shouldFetchAssets) {
      await exportImages(fileData);
    }

    // Generate components
    if (shouldFetchComponents) {
      await generateComponents(fileData);
    }

    console.log('');
    log.success('Figma sync completed successfully!');
    console.log('');
  } catch (error) {
    console.log('');
    log.error(`Sync failed: ${error.message}`);
    if (flags.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main();
