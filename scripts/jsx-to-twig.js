#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.join(__dirname, '../src/components');
const outputDir = path.join(__dirname, '../twig-templates');

/**
 * Convert JSX component to Twig template
 */
function jsxToTwig(jsxContent, componentName) {
  let twigContent = jsxContent;

  // Extract the JSX return statement
  const returnMatch = twigContent.match(/return\s*\(([\s\S]*?)\);[\s\S]*?\}/);
  if (!returnMatch) {
    console.warn(`Could not extract JSX from ${componentName}`);
    return null;
  }

  let jsx = returnMatch[1].trim();

  // Extract props from component definition
  const propsMatch = twigContent.match(/export const \w+ = \({([^}]+)\}/);
  let props = [];
  if (propsMatch) {
    const propsString = propsMatch[1];
    // Extract prop names and default values
    const propMatches = propsString.matchAll(/(\w+)\s*=\s*['"](.*?)['"]/g);
    for (const match of propMatches) {
      props.push({
        name: match[1],
        default: match[2]
      });
    }
  }

  // Get base class name from component
  const baseClass = componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');

  // Convert className template literals to use base_class variable
  // {`componentname ${className}`.trim()} -> class="{{ base_class }}"
  jsx = jsx.replace(/className=\{`(\w+)\s+\$\{className\}`\.trim\(\)\}/g, 'class="{{ base_class }}"');

  // First convert className to class
  jsx = jsx.replace(/className=/g, 'class=');

  // Then convert all child class names to use base_class variable
  // class="avatar__image" -> class="{{ base_class }}__image"
  // Must escape special regex characters in component modifiers
  jsx = jsx.replace(/class="[a-z0-9]+__([^"]+)"/g, (match, modifier) => {
    return `class="{{ base_class }}__${modifier}"`;
  });

  // Convert any remaining className to class
  jsx = jsx.replace(/className=/g, 'class=');

  // Convert prop references to Twig variables
  // {text1} -> {{ content.field_text_1 }}
  props.forEach((prop, index) => {
    if (prop.name !== 'className') {
      const fieldName = `field_${prop.name}`;
      const regex = new RegExp(`\\{${prop.name}\\}`, 'g');
      jsx = jsx.replace(regex, `{{ content.${fieldName} }}`);
    }
  });

  // Convert image imports to Twig asset function
  const importMatches = twigContent.matchAll(/import\s+(\w+)\s+from\s+['"]\.\.\/\.\.\/assets\/figma\/([^'"]+)['"]/g);
  const assetMap = {};
  for (const match of importMatches) {
    assetMap[match[1]] = match[2];
  }

  // Replace image src references
  Object.entries(assetMap).forEach(([importName, filename]) => {
    const regex = new RegExp(`src=\\{${importName}\\}`, 'g');
    jsx = jsx.replace(regex, `src="{{ file_url('assets/figma/${filename}') }}"`);
  });

  // Convert {...props} spread to Twig attributes
  jsx = jsx.replace(/\s*\{\.\.\.props\}/g, '');

  // Clean up extra whitespace and fix indentation
  jsx = jsx.trim();

  // Build the complete Twig template with proper structure
  const header = `{{ attach_library('frontend/${baseClass}') }}

{% set base_class = '${baseClass}' %}

`;

  const footer = ``;

  return header + jsx + footer;
}

/**
 * Process all JSX files in components directory
 */
function processComponents() {
  console.log('🔄 Converting JSX components to Twig templates...\n');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all component directories
  const componentDirs = fs.readdirSync(componentsDir).filter(name => {
    const fullPath = path.join(componentsDir, name);
    return fs.statSync(fullPath).isDirectory();
  });

  let successCount = 0;
  let errorCount = 0;

  componentDirs.forEach(componentName => {
    const jsxPath = path.join(componentsDir, componentName, `${componentName}.jsx`);

    if (!fs.existsSync(jsxPath)) {
      console.log(`⚠️  Skipping ${componentName} (no JSX file found)`);
      return;
    }

    try {
      const jsxContent = fs.readFileSync(jsxPath, 'utf-8');
      const twigContent = jsxToTwig(jsxContent, componentName);

      if (twigContent) {
        const twigPath = path.join(outputDir, `${componentName}.html.twig`);
        fs.writeFileSync(twigPath, twigContent, 'utf-8');
        console.log(`✓ Converted: ${componentName}.jsx -> ${componentName}.html.twig`);
        successCount++;
      } else {
        console.log(`✗ Failed: ${componentName}.jsx (could not parse)`);
        errorCount++;
      }
    } catch (error) {
      console.log(`✗ Error processing ${componentName}: ${error.message}`);
      errorCount++;
    }
  });

  console.log(`\n✨ Conversion complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${errorCount}`);
  console.log(`   Output directory: ${outputDir}`);
}

// Run the conversion
processComponents();
