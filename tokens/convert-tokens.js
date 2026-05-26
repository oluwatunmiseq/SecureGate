// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// File paths
const colorTokensPath = path.join(__dirname, 'color-tokens.json');
const typographyTokensPath = path.join(__dirname, 'design-tokens.tokens.json');
const outputPath = path.join(__dirname, 'tokens.css');

console.log('🚀 Starting Design Tokens Conversion...');

// Helper to convert camelCase to kebab-case
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper to slugify token names (e.g. "display large" -> "display-large")
function slugify(str) {
  return str.trim().toLowerCase().replace(/\s+/g, '-');
}

// HSL Color Parser
function parseHSL(hslStr) {
  if (typeof hslStr !== 'string') return null;
  const match = hslStr.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*([\d.]+)%\s*\)/i);
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3])
  };
}

// HSL Interpolator for missing palette shades (e.g., 4, 6, 12, 17, 22, 24)
function interpolatePaletteColor(palette, keyStr) {
  const targetKey = parseFloat(keyStr);
  if (isNaN(targetKey)) return undefined;
  
  // Get all defined numeric keys in the palette
  const keys = Object.keys(palette)
    .map(k => parseFloat(k))
    .filter(k => !isNaN(k))
    .sort((a, b) => a - b);
    
  if (keys.length === 0) return undefined;
  
  // Return early if we exceed bounds
  if (targetKey <= keys[0]) return palette[keys[0].toString()];
  if (targetKey >= keys[keys.length - 1]) return palette[keys[keys.length - 1].toString()];
  
  // Find lower and upper bounds
  let lowerKey = keys[0];
  let upperKey = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (targetKey > keys[i] && targetKey < keys[i + 1]) {
      lowerKey = keys[i];
      upperKey = keys[i + 1];
      break;
    }
  }
  
  const lowerVal = palette[lowerKey.toString()];
  const upperVal = palette[upperKey.toString()];
  
  const lowerHSL = parseHSL(lowerVal);
  const upperHSL = parseHSL(upperVal);
  
  if (!lowerHSL || !upperHSL) return undefined;
  
  // Calculate interpolation factor
  const t = (targetKey - lowerKey) / (upperKey - lowerKey);
  
  // Smart HSL Interpolation: if one color has 0% saturation, preserve the other's hue
  let h;
  if (lowerHSL.s === 0) {
    h = upperHSL.h;
  } else if (upperHSL.s === 0) {
    h = lowerHSL.h;
  } else {
    // Normal linear interpolation of hue
    h = Math.round(lowerHSL.h + t * (upperHSL.h - lowerHSL.h));
  }
  
  const s = Math.round(lowerHSL.s + t * (upperHSL.s - lowerHSL.s));
  const l = parseFloat((lowerHSL.l + t * (upperHSL.l - lowerHSL.l)).toFixed(1));
  
  const resultHSL = `hsl(${h}, ${s}%, ${l}%)`;
  console.log(`  💡 Interpolated missing palette token: "${targetKey}" between "${lowerKey}" and "${upperKey}" -> ${resultHSL}`);
  return resultHSL;
}

// Case-insensitive recursive reference resolver with circular dependency check
function resolveToken(ref, obj, visited = new Set()) {
  if (typeof ref !== 'string') return ref;
  
  if (ref.startsWith('{') && ref.endsWith('}')) {
    if (visited.has(ref)) {
      throw new Error(`Circular reference detected: ${Array.from(visited).join(' -> ')} -> ${ref}`);
    }
    visited.add(ref);
    
    const pathParts = ref.slice(1, -1).split('.');
    let current = obj;
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (!current) break;
      
      const keys = Object.keys(current);
      const matchedKey = keys.find(k => k.toLowerCase() === part.toLowerCase());
      
      if (matchedKey !== undefined) {
        current = current[matchedKey];
      } else {
        // If segment is missing, check if it's the last segment, parent is a palette, and segment is numeric
        const isLastSegment = (i === pathParts.length - 1);
        if (isLastSegment && !isNaN(part)) {
          const interpolated = interpolatePaletteColor(current, part);
          if (interpolated !== undefined) {
            current = interpolated;
            break;
          }
        }
        current = current[part];
      }
    }
    
    // Recursively resolve references if the resolved value is also a reference
    return resolveToken(current, obj, visited);
  }
  
  return ref;
}

try {
  // Load and parse token JSON files
  console.log(`📖 Reading ${path.basename(colorTokensPath)}...`);
  const colorTokens = JSON.parse(fs.readFileSync(colorTokensPath, 'utf8'));

  console.log(`📖 Reading ${path.basename(typographyTokensPath)}...`);
  const typographyTokens = JSON.parse(fs.readFileSync(typographyTokensPath, 'utf8'));

  // 1. Process Typography Tokens
  console.log('✍️ Processing typography tokens...');
  const typographyVars = [];
  const typographyObj = typographyTokens.typography;

  if (!typographyObj) {
    throw new Error('Could not find "typography" object in design-tokens.tokens.json');
  }

  for (const [tokenName, tokenData] of Object.entries(typographyObj)) {
    const tokenSlug = slugify(tokenName);
    typographyVars.push(`  /* ${tokenName} */`);
    
    for (const [propName, propData] of Object.entries(tokenData)) {
      const cssPropName = camelToKebab(propName);
      let value = propData.value;
      
      if (propData.type === 'dimension') {
        if (typeof value === 'number') {
          value = `${value}px`;
        }
      } else if (propName === 'fontFamily') {
        // Enclose font family in quotes and add generic fallback
        value = `'${value}', sans-serif`;
      }
      
      typographyVars.push(`  --typography-${tokenSlug}-${cssPropName}: ${value};`);
    }
    typographyVars.push(''); // spacing line
  }

  // 2. Process Color Role Tokens
  console.log('🎨 Processing color role tokens...');
  const lightColorVars = [];
  const darkColorVars = [];

  const lightRolesObj = colorTokens.color?.role?.light;
  const darkRolesObj = colorTokens.color?.role?.dark;

  if (!lightRolesObj || !darkRolesObj) {
    throw new Error('Could not find color role objects for light or dark in color-tokens.json');
  }

  // Generate Light Mode Roles
  console.log('🌅 Resolving light mode roles...');
  for (const [roleName, refValue] of Object.entries(lightRolesObj)) {
    const cssRoleName = camelToKebab(roleName);
    const resolvedValue = resolveToken(refValue, colorTokens);
    if (resolvedValue === undefined) {
      console.warn(`⚠️ Warning: Could not resolve light mode role "${roleName}" (${refValue})`);
    }
    lightColorVars.push(`  --color-${cssRoleName}: ${resolvedValue};`);
  }

  // Generate Dark Mode Roles
  console.log('🌃 Resolving dark mode roles...');
  for (const [roleName, refValue] of Object.entries(darkRolesObj)) {
    const cssRoleName = camelToKebab(roleName);
    const resolvedValue = resolveToken(refValue, colorTokens);
    if (resolvedValue === undefined) {
      console.warn(`⚠️ Warning: Could not resolve dark mode role "${roleName}" (${refValue})`);
    }
    darkColorVars.push(`  --color-${cssRoleName}: ${resolvedValue};`);
  }

  // 3. Assemble and Write CSS Output
  console.log('📄 Assembling variables.css content...');
  const cssContent = `/**
 * Do not edit directly
 * Generated automatically by convert-tokens.js from:
 *   - color-tokens.json
 *   - design-tokens.tokens.json
 */

:root {
  /* ==========================================
     TYPOGRAPHY TOKENS
     ========================================== */
${typographyVars.join('\n')}
  /* ==========================================
     COLOR ROLES - LIGHT MODE (DEFAULT)
     ========================================== */
${lightColorVars.join('\n')}
}

/* ==========================================
   COLOR ROLES - SYSTEM DARK MODE PREFERENCE
   ========================================== */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkColorVars.join('\n')}
  }
}

/* ==========================================
   COLOR ROLES - EXPLICIT THEME OVERRIDES
   ========================================== */
[data-theme="light"] {
${lightColorVars.join('\n')}
}

[data-theme="dark"] {
${darkColorVars.join('\n')}
}
`;

  fs.writeFileSync(outputPath, cssContent, 'utf8');
  console.log(`✨ Successfully generated: ${outputPath}`);
  console.log(`📁 CSS Variables generated summary:
  - Typography Tokens: ${Object.keys(typographyObj).length} sets
  - Color Roles (Light): ${lightColorVars.length} variables
  - Color Roles (Dark): ${darkColorVars.length} variables`);

} catch (error) {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
}
