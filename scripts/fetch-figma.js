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
    styles: path.join(rootDir, 'src/styles/components'), // Centralized SCSS folder
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
 * Check if node has image fills
 */
function hasImageFills(node) {
  if (!node.fills || !Array.isArray(node.fills)) return false;
  return node.fills.some(fill => fill.type === 'IMAGE');
}

/**
 * Find all exportable nodes (images, icons, etc.)
 */
function findExportableNodes(node, exportables = [], depth = 0) {
  let shouldExport = false;
  let reason = '';

  // Check for explicit export settings
  if (node.exportSettings && node.exportSettings.length > 0) {
    shouldExport = true;
    reason = 'has exportSettings';
  }
  // Check for image fills on any node type
  else if (hasImageFills(node)) {
    shouldExport = true;
    reason = 'has image fills';
  }
  // Check for vector/shape nodes
  else if (node.type === 'VECTOR' ||
           node.type === 'BOOLEAN_OPERATION' ||
           node.type === 'STAR' ||
           node.type === 'ELLIPSE' ||
           node.type === 'POLYGON' ||
           node.type === 'LINE') {
    shouldExport = true;
    reason = `is ${node.type}`;
  }

  if (shouldExport) {
    exportables.push(node);
    log.debug(`Found exportable: ${node.name || 'unnamed'} (${reason})`);
  }

  if (node.children) {
    node.children.forEach((child) => findExportableNodes(child, exportables, depth + 1));
  }

  return exportables;
}

/**
 * Export images from Figma
 * Returns a map of node IDs to their exported file paths
 */
async function exportImages(fileData) {
  log.info('Finding exportable images...');

  const exportableNodes = findExportableNodes(fileData.document);

  if (exportableNodes.length === 0) {
    log.warn('No exportable images found');
    return {};
  }

  log.info(`Found ${exportableNodes.length} exportable nodes`);

  // Separate vector nodes from raster image nodes
  const vectorNodes = exportableNodes.filter(node =>
    node.type === 'VECTOR' ||
    node.type === 'BOOLEAN_OPERATION' ||
    node.type === 'STAR' ||
    node.type === 'ELLIPSE' ||
    node.type === 'POLYGON' ||
    node.type === 'LINE'
  );

  const imageNodes = exportableNodes.filter(node => hasImageFills(node));

  log.info(`Vectors: ${vectorNodes.length}, Images: ${imageNodes.length}`);

  await ensureDir(config.outputDirs.assets);

  const assetMap = {};

  // Export vectors as SVG
  if (vectorNodes.length > 0) {
    const vectorAssets = await exportNodesAsFormat(vectorNodes, 'svg', 'SVG');
    Object.assign(assetMap, vectorAssets);
  }

  // Export images as PNG
  if (imageNodes.length > 0) {
    const imageAssets = await exportNodesAsFormat(imageNodes, 'png', 'PNG');
    Object.assign(assetMap, imageAssets);
  }

  return assetMap;
}

/**
 * Export nodes in a specific format
 * Returns a map of node IDs to filenames
 */
async function exportNodesAsFormat(nodes, format, formatLabel) {
  const batchSize = 100;
  const batches = [];
  const assetMap = {};

  for (let i = 0; i < nodes.length; i += batchSize) {
    batches.push(nodes.slice(i, i + batchSize));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const nodeIds = batch.map(node => node.id).join(',');

    try {
      log.info(`Exporting ${formatLabel} batch ${batchIndex + 1}/${batches.length}...`);

      const params = {
        ids: nodeIds,
        format: format,
      };

      if (format === 'svg') {
        params.svg_include_id = true;
      } else if (format === 'png') {
        params.scale = 2; // 2x for retina displays
      }

      const response = await figmaApi.get(`/images/${config.figmaFileKey}`, {
        params: params,
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

          // Use node ID to ensure unique filenames
          const baseName = node.name ? toTokenName(node.name) : 'asset';
          const filename = `${baseName}-${node.id.replace(/:/g, '-')}.${format}`;
          const filePath = path.join(config.outputDirs.assets, filename);

          await fs.writeFile(filePath, imageResponse.data);
          log.success(`Downloaded: ${filename}`);

          // Map node ID to filename
          assetMap[node.id] = filename;
        } catch (error) {
          log.error(`Failed to download ${node.name}: ${error.message}`);
        }
      }
    } catch (error) {
      log.error(`Failed to export batch ${batchIndex + 1}: ${error.message}`);
    }
  }

  return assetMap;
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
 * Generate JSX for child elements with global index tracking
 */
function generateChildJSX(elements, componentClass, indent = 3, globalIndex = {value: 0}) {
  const indentStr = '  '.repeat(indent);
  let jsx = '';

  elements.forEach((el) => {
    globalIndex.value++;
    const className = `${componentClass}__el-${globalIndex.value}`;

    if (el.type === 'TEXT' && el.text) {
      // Render text element
      const escapedText = el.text.replace(/'/g, "\\'");
      jsx += `${indentStr}<span className="${className}">${escapedText}</span>\n`;
    } else if (el.type === 'FRAME' || el.type === 'GROUP' || el.type === 'INSTANCE') {
      // Render frame/group container
      jsx += `${indentStr}<div className="${className}">\n`;

      if (el.children && el.children.length > 0) {
        jsx += generateChildJSX(el.children, componentClass, indent + 1, globalIndex);
      }

      jsx += `${indentStr}</div>\n`;
    } else if (el.type === 'RECTANGLE' || el.type === 'ELLIPSE') {
      // Render shapes as divs
      jsx += `${indentStr}<div className="${className}"></div>\n`;
    } else if (el.type === 'VECTOR' || el.type === 'BOOLEAN_OPERATION') {
      // Render vectors as SVG placeholders
      jsx += `${indentStr}<div className="${className} ${componentClass}__vector"></div>\n`;
    }
  });

  return jsx;
}

/**
 * Generate JSX for child elements with assets and text props
 */
function generateChildJSXWithAssets(elements, componentClass, assets, textProps, indent = 3, globalIndex = {value: 0}, textIndex = {value: 0}, usedNames = new Set()) {
  const indentStr = '  '.repeat(indent);
  let jsx = '';

  elements.forEach((el) => {
    globalIndex.value++;

    // Generate semantic class name from Figma element name
    let baseName = el.name ? toTokenName(el.name) : `el-${globalIndex.value}`;

    // Ensure unique class names
    let elementName = baseName;
    let suffix = 1;
    while (usedNames.has(elementName)) {
      elementName = `${baseName}-${suffix}`;
      suffix++;
    }
    usedNames.add(elementName);

    const className = `${componentClass}__${elementName}`;

    // Find if this element has an associated asset
    const asset = assets.find(a => a.id === el.id);

    if (asset && asset.filename) {
      // Render asset (image or SVG)
      const assetImportName = asset.filename.replace(/[^a-zA-Z0-9]/g, '_');
      if (asset.hasImageFill) {
        jsx += `${indentStr}<img src={${assetImportName}} alt="${el.name || 'asset'}" className="${className}" />\n`;
      } else {
        jsx += `${indentStr}<img src={${assetImportName}} alt="${el.name || 'icon'}" className="${className} ${componentClass}__icon" />\n`;
      }
    } else if (el.type === 'TEXT' && el.text) {
      // Render text element with prop
      textIndex.value++;
      const propName = `text${textIndex.value}`;
      jsx += `${indentStr}<span className="${className}">{${propName}}</span>\n`;
    } else if (el.type === 'FRAME' || el.type === 'GROUP' || el.type === 'INSTANCE') {
      // Render frame/group container
      jsx += `${indentStr}<div className="${className}">\n`;

      if (el.children && el.children.length > 0) {
        jsx += generateChildJSXWithAssets(el.children, componentClass, assets, textProps, indent + 1, globalIndex, textIndex, usedNames);
      }

      jsx += `${indentStr}</div>\n`;
    } else if (el.type === 'RECTANGLE' || el.type === 'ELLIPSE') {
      // Render shapes as divs
      jsx += `${indentStr}<div className="${className}"></div>\n`;
    }
  });

  return jsx;
}

/**
 * Generate React component
 */
function generateReactComponent(component, assetMap = {}) {
  const componentName = sanitizeComponentName(component.name);
  const componentClass = componentName.toLowerCase();
  const data = extractComponentData(component, assetMap);

  // Generate asset imports
  let assetImports = '';
  data.assets.filter(a => a.filename).forEach((asset) => {
    const varName = asset.filename.replace(/[^a-zA-Z0-9]/g, '_');
    assetImports += `import ${varName} from '../../assets/figma/${asset.filename}';\n`;
  });

  // Create text props with defaults
  let textPropsString = '';
  let textPropsDefaults = '';
  data.textStyles.forEach((textStyle, index) => {
    const propName = `text${index + 1}`;
    const escapedText = textStyle.text.replace(/'/g, "\\'");
    textPropsString += `  ${propName} = '${escapedText}',\n`;
  });

  // Generate JSX for child elements with assets and text props
  let childrenJSX = '';
  if (data.childElements && data.childElements.length > 0) {
    childrenJSX = generateChildJSXWithAssets(data.childElements, componentClass, data.assets, data.textStyles);
  }

  return `import React from 'react';
import './${componentName}.scss';
${assetImports}
/**
 * ${componentName} Component
 * Auto-generated from Figma
 *
 * Contains ${data.textStyles.length} text element(s)
 * ${data.childElements.length} child element(s)
 * ${data.assets.length} asset(s)
 */
export const ${componentName} = ({
  className = '',
${textPropsString}  ...props
}) => {
  return (
    <div className={\`${componentClass} \${className}\`.trim()} {...props}>
${childrenJSX}    </div>
  );
};

export default ${componentName};
`;
}

/**
 * Convert Figma color to CSS color string
 */
function figmaColorToCss(color) {
  if (!color) return null;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? color.a : 1;
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Extract text nodes with their styling and metadata
 */
function extractTextNodes(node, textNodes = [], depth = 0) {
  if (node.type === 'TEXT' && node.characters) {
    const textStyle = {
      id: node.id,
      name: node.name,
      text: node.characters,
      fontSize: node.style?.fontSize || null,
      fontWeight: node.style?.fontWeight || null,
      fontFamily: node.style?.fontFamily || null,
      letterSpacing: node.style?.letterSpacing || null,
      lineHeight: node.style?.lineHeightPx || node.style?.lineHeight || null,
      textAlign: node.style?.textAlignHorizontal?.toLowerCase() || null,
      color: null,
      depth: depth,
    };

    // Get text color from fills
    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      const firstFill = node.fills[0];
      if (firstFill.type === 'SOLID' && firstFill.color) {
        textStyle.color = figmaColorToCss(firstFill.color);
      }
    }

    textNodes.push(textStyle);
  }

  if (node.children) {
    node.children.forEach((child) => extractTextNodes(child, textNodes, depth + 1));
  }

  return textNodes;
}

/**
 * Extract all child elements including frames, rectangles, text, etc.
 */
function extractChildElements(node, elements = [], depth = 0) {
  const element = {
    id: node.id,
    name: node.name,
    type: node.type,
    depth: depth,
    children: [],
  };

  // Extract sizing with auto-layout awareness
  if (node.absoluteBoundingBox) {
    element.width = Math.round(node.absoluteBoundingBox.width);
    element.height = Math.round(node.absoluteBoundingBox.height);
  }

  // Store layout sizing mode (FILL, HUG, FIXED)
  if (node.layoutSizingHorizontal) {
    element.layoutSizingHorizontal = node.layoutSizingHorizontal;
  }
  if (node.layoutSizingVertical) {
    element.layoutSizingVertical = node.layoutSizingVertical;
  }
  if (node.layoutGrow !== undefined) {
    element.layoutGrow = node.layoutGrow;
  }

  if (node.backgroundColor) {
    element.backgroundColor = figmaColorToCss(node.backgroundColor);
  }

  // Extract fills for shapes
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const firstFill = node.fills[0];
    if (firstFill.type === 'SOLID' && firstFill.color) {
      element.fill = figmaColorToCss(firstFill.color);
    }
  }

  if (node.cornerRadius !== undefined) {
    element.borderRadius = node.cornerRadius;
  }

  // For text nodes
  if (node.type === 'TEXT' && node.characters) {
    element.text = node.characters;
    element.fontSize = node.style?.fontSize || null;
    element.fontWeight = node.style?.fontWeight || null;
    element.fontFamily = node.style?.fontFamily || null;
    element.lineHeight = node.style?.lineHeightPx || node.style?.lineHeight || null;
    element.textAlign = node.style?.textAlignHorizontal?.toLowerCase() || null;

    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      const firstFill = node.fills[0];
      if (firstFill.type === 'SOLID' && firstFill.color) {
        element.color = figmaColorToCss(firstFill.color);
      }
    }
  }

  // Layout properties
  if (node.layoutMode) {
    element.layoutMode = node.layoutMode;
  }

  if (node.itemSpacing !== undefined) {
    element.gap = node.itemSpacing;
  }

  if (node.paddingLeft !== undefined) {
    element.padding = {
      top: node.paddingTop || 0,
      right: node.paddingRight || 0,
      bottom: node.paddingBottom || 0,
      left: node.paddingLeft || 0,
    };
  }

  // Recursively process children
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      const childElement = extractChildElements(child, [], depth + 1)[0];
      if (childElement) {
        element.children.push(childElement);
      }
    });
  }

  elements.push(element);
  return elements;
}

/**
 * Extract text content from component children recursively
 */
function extractTextContent(node, texts = []) {
  if (node.type === 'TEXT' && node.characters) {
    texts.push(node.characters);
  }

  if (node.children) {
    node.children.forEach((child) => extractTextContent(child, texts));
  }

  return texts;
}

/**
 * Check if component has images recursively
 */
function hasImages(node) {
  // Check for image fills
  if (node.fills && Array.isArray(node.fills)) {
    const hasImageFill = node.fills.some(fill => fill.type === 'IMAGE');
    if (hasImageFill) return true;
  }

  // Check for vector or image nodes
  if (node.type === 'VECTOR' ||
      node.type === 'BOOLEAN_OPERATION' ||
      node.type === 'STAR' ||
      node.type === 'ELLIPSE' ||
      node.type === 'POLYGON') {
    return true;
  }

  // Check children recursively
  if (node.children) {
    return node.children.some(child => hasImages(child));
  }

  return false;
}

/**
 * Find all asset nodes within a component tree
 */
function findComponentAssets(node, assets = []) {
  // Check if this node is an asset
  if (hasImageFills(node) ||
      node.type === 'VECTOR' ||
      node.type === 'BOOLEAN_OPERATION' ||
      node.type === 'STAR' ||
      node.type === 'ELLIPSE' ||
      node.type === 'POLYGON' ||
      node.type === 'LINE') {
    assets.push({
      id: node.id,
      name: node.name,
      type: node.type,
      hasImageFill: hasImageFills(node),
    });
  }

  // Recursively check children
  if (node.children) {
    node.children.forEach((child) => findComponentAssets(child, assets));
  }

  return assets;
}

/**
 * Extract component data (styles, text, images)
 */
function extractComponentData(component, assetMap = {}) {
  const data = {
    styles: {
      width: null,
      height: null,
      backgroundColor: null,
      borderRadius: null,
      padding: null,
      gap: null,
      layout: 'flex',
      direction: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    texts: [],
    textStyles: [],
    childElements: [],
    hasImages: false,
    assets: [],
  };

  // Get bounding box (size)
  if (component.absoluteBoundingBox) {
    data.styles.width = Math.round(component.absoluteBoundingBox.width);
    data.styles.height = Math.round(component.absoluteBoundingBox.height);
  }

  // Get background color
  if (component.backgroundColor) {
    data.styles.backgroundColor = figmaColorToCss(component.backgroundColor);
  }

  // Get border radius
  if (component.cornerRadius !== undefined) {
    data.styles.borderRadius = component.cornerRadius;
  } else if (component.rectangleCornerRadii) {
    data.styles.borderRadius = component.rectangleCornerRadii[0]; // Use first corner
  }

  // Get padding from layout
  if (component.paddingLeft !== undefined) {
    data.styles.padding = {
      top: component.paddingTop || 0,
      right: component.paddingRight || 0,
      bottom: component.paddingBottom || 0,
      left: component.paddingLeft || 0,
    };
  }

  // Get layout properties
  if (component.layoutMode) {
    data.styles.layout = component.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
    data.styles.direction = component.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
  }

  // Get primary axis align (justify-content)
  if (component.primaryAxisAlignItems) {
    const alignMap = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
      'SPACE_BETWEEN': 'space-between',
    };
    data.styles.justifyContent = alignMap[component.primaryAxisAlignItems] || 'flex-start';
  }

  // Get counter axis align (align-items)
  if (component.counterAxisAlignItems) {
    const alignMap = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
    };
    data.styles.alignItems = alignMap[component.counterAxisAlignItems] || 'flex-start';
  }

  // Get gap/spacing
  if (component.itemSpacing !== undefined) {
    data.styles.gap = component.itemSpacing;
  }

  // Extract text content (plain strings)
  data.texts = extractTextContent(component);

  // Extract text nodes with styling
  data.textStyles = extractTextNodes(component);

  // Extract full child tree structure
  if (component.children && component.children.length > 0) {
    data.childElements = extractChildElements(component)[0].children;
  }

  // Check for images
  data.hasImages = hasImages(component);

  // Find all assets in component
  const componentAssets = findComponentAssets(component);
  data.assets = componentAssets.map(asset => ({
    ...asset,
    filename: assetMap[asset.id] || null,
  }));

  return data;
}

/**
 * Generate SCSS for child elements
 */
function generateChildScss(elements, componentClass, scssLines = [], index = 1, usedNames = new Set()) {
  let currentIndex = index;

  elements.forEach((el) => {
    // Generate semantic class name from Figma element name
    let baseName = el.name ? toTokenName(el.name) : `el-${currentIndex}`;

    // Ensure unique class names
    let className = baseName;
    let suffix = 1;
    while (usedNames.has(className)) {
      className = `${baseName}-${suffix}`;
      suffix++;
    }
    usedNames.add(className);

    const bemClassName = `&__${className}`;
    let scss = `\n  ${bemClassName} {`;

    // Add layout if it's a container
    if (el.layoutMode) {
      scss += `\n    display: flex;`;
      scss += `\n    flex-direction: ${el.layoutMode === 'HORIZONTAL' ? 'row' : 'column'};`;
    }

    if (el.gap !== undefined) {
      scss += `\n    gap: ${el.gap}px;`;
    }

    if (el.padding) {
      scss += `\n    padding: ${el.padding.top}px ${el.padding.right}px ${el.padding.bottom}px ${el.padding.left}px;`;
    }

    // Apply width based on layout sizing mode
    if (el.layoutSizingHorizontal === 'FILL') {
      if (el.layoutGrow === 1) {
        scss += `\n    flex: 1;`;
      } else {
        scss += `\n    width: 100%;`;
      }
    } else if (el.layoutSizingHorizontal === 'HUG') {
      // Auto width - don't set width
    } else if (el.width) {
      // FIXED or no layout mode - use absolute width
      scss += `\n    width: ${el.width}px;`;
    }

    // Apply height based on layout sizing mode
    if (el.layoutSizingVertical === 'FILL') {
      scss += `\n    height: 100%;`;
    } else if (el.layoutSizingVertical === 'HUG') {
      // Auto height - don't set height
    } else if (el.height) {
      // FIXED or no layout mode - use absolute height
      scss += `\n    height: ${el.height}px;`;
    }

    // Only add background colors for non-text, non-vector elements
    const isVectorType = el.type === 'VECTOR' || el.type === 'BOOLEAN_OPERATION' ||
                         el.type === 'STAR' || el.type === 'ELLIPSE' ||
                         el.type === 'POLYGON' || el.type === 'LINE';

    if (el.type !== 'TEXT' && !isVectorType) {
      if (el.backgroundColor) {
        scss += `\n    background-color: ${el.backgroundColor};`;
      }

      if (el.fill) {
        scss += `\n    background-color: ${el.fill};`;
      }

      if (el.borderRadius !== undefined) {
        scss += `\n    border-radius: ${el.borderRadius}px;`;
      }
    }

    // Text-specific styles
    if (el.type === 'TEXT') {
      if (el.fontFamily) {
        scss += `\n    font-family: '${el.fontFamily}', sans-serif;`;
      }

      if (el.fontSize) {
        scss += `\n    font-size: ${el.fontSize}px;`;
      }

      if (el.fontWeight) {
        scss += `\n    font-weight: ${el.fontWeight};`;
      }

      if (el.lineHeight) {
        scss += `\n    line-height: ${el.lineHeight}px;`;
      }

      if (el.color) {
        scss += `\n    color: ${el.color};`;
      }

      if (el.textAlign) {
        scss += `\n    text-align: ${el.textAlign};`;
      }
    }

    scss += `\n  }`;
    scssLines.push(scss);

    currentIndex++;

    // Process children recursively
    if (el.children && el.children.length > 0) {
      currentIndex = generateChildScss(el.children, componentClass, scssLines, currentIndex, usedNames);
    }
  });

  return currentIndex;
}

/**
 * Generate SCSS file for a component with Figma styles
 */
function generateComponentScss(component) {
  const componentName = sanitizeComponentName(component.name);
  const componentClass = componentName.toLowerCase();
  const data = extractComponentData(component);
  const styles = data.styles;

  // Build SCSS with extracted styles
  let scss = `@use '../variables' as *;

.${componentClass} {
  display: ${styles.layout === 'row' ? 'inline-flex' : 'flex'};
  flex-direction: ${styles.direction};
  align-items: ${styles.alignItems};
  justify-content: ${styles.justifyContent};`;

  if (styles.gap !== null) {
    scss += `\n  gap: ${styles.gap}px;`;
  }

  if (styles.padding) {
    scss += `\n  padding: ${styles.padding.top}px ${styles.padding.right}px ${styles.padding.bottom}px ${styles.padding.left}px;`;
  }

  if (styles.width !== null) {
    scss += `\n  width: ${styles.width}px;`;
  }

  if (styles.height !== null) {
    scss += `\n  height: ${styles.height}px;`;
  }

  if (styles.backgroundColor) {
    scss += `\n  background-color: ${styles.backgroundColor};`;
  }

  if (styles.borderRadius !== null) {
    scss += `\n  border-radius: ${styles.borderRadius}px;`;
  }

  // Add typography styles from first text node (if available)
  if (data.textStyles.length > 0) {
    const primaryText = data.textStyles[0];

    if (primaryText.fontFamily) {
      scss += `\n  font-family: '${primaryText.fontFamily}', sans-serif;`;
    }

    if (primaryText.fontSize) {
      scss += `\n  font-size: ${primaryText.fontSize}px;`;
    }

    if (primaryText.fontWeight) {
      scss += `\n  font-weight: ${primaryText.fontWeight};`;
    }

    if (primaryText.lineHeight) {
      scss += `\n  line-height: ${primaryText.lineHeight}px;`;
    }

    if (primaryText.letterSpacing) {
      scss += `\n  letter-spacing: ${primaryText.letterSpacing}px;`;
    }

    if (primaryText.color) {
      scss += `\n  color: ${primaryText.color};`;
    }
  }

  scss += `\n`;

  // Add image styling if component has images
  if (data.hasImages) {
    scss += `\n  &__image {
    width: auto;
    height: auto;
    flex-shrink: 0;
  }
`;
  }

  // Generate SCSS for all child elements
  if (data.childElements && data.childElements.length > 0) {
    const childScssLines = [];
    generateChildScss(data.childElements, componentClass, childScssLines);
    scss += childScssLines.join('');
  }

  scss += `\n\n  // Figma component: ${component.name}
  // Original size: ${styles.width || 'auto'}x${styles.height || 'auto'}
  // Child elements: ${data.childElements.length}
}
`;

  return scss;
}

/**
 * Generate Storybook story for a React component
 */
function generateStorybookStory(component, assetMap = {}) {
  const componentName = sanitizeComponentName(component.name);
  const data = extractComponentData(component, assetMap);

  // Use extracted text or fallback to component name
  // Escape single quotes in text to prevent JavaScript syntax errors
  const defaultText = data.texts.length > 0
    ? data.texts.join(' ').replace(/'/g, "\\'")
    : componentName;

  // Build argTypes based on component features
  const argTypes = {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  };

  // Add text prop controls
  data.textStyles.forEach((textStyle, index) => {
    const propName = `text${index + 1}`;
    argTypes[propName] = {
      control: 'text',
      description: `Text content ${index + 1}`,
    };
  });

  if (data.hasImages) {
    argTypes.imageSrc = {
      control: 'text',
      description: 'Image source URL',
    };
    argTypes.imageAlt = {
      control: 'text',
      description: 'Image alt text',
    };
  }

  // Generate stories
  let stories = `import React from 'react';
import { ${componentName} } from './${componentName}';

/**
 * ${componentName} Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/${componentName}',
  component: ${componentName},
  argTypes: ${JSON.stringify(argTypes, null, 4)},
};

const Template = (args) => <${componentName} {...args} />;

export const Default = Template.bind({});
Default.args = {};
`;

  // Only add WithImage story if component has images
  if (data.hasImages) {
    stories += `
export const WithImage = Template.bind({});
WithImage.args = {
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: '${componentName} image',
};
`;
  }

  stories += `
export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  className: 'custom-variant',
};
`;

  return stories;
}

/**
 * Generate components (React components, SCSS, and Storybook stories)
 */
async function generateComponents(fileData, assetMap = {}) {
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
    const reactContent = generateReactComponent(component, assetMap);
    const reactPath = path.join(componentDir, `${componentName}.jsx`);
    await writeFileIfChanged(reactPath, reactContent);

    // Generate SCSS file
    const scssContent = generateComponentScss(component);
    const scssPath = path.join(componentDir, `${componentName}.scss`);
    await writeFileIfChanged(scssPath, scssContent);

    // Generate Storybook story
    const storyContent = generateStorybookStory(component, assetMap);
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

    // Export assets and get asset map
    let assetMap = {};
    if (shouldFetchAssets || shouldFetchComponents) {
      assetMap = await exportImages(fileData);
    }

    // Generate components
    if (shouldFetchComponents) {
      await generateComponents(fileData, assetMap);
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
