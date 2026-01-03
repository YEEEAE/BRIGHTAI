/**
 * Script to automatically add missing SEO elements to all HTML files
 * This ensures all pages have:
 * - Canonical tags
 * - Open Graph tags
 * - Twitter Card tags
 * - Proper meta descriptions
 * - At least one H1 tag
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Get all HTML files
const htmlFiles = glob.sync('**/*.html', {
  ignore: [
    'node_modules/**',
    'backups/**',
    '.git/**',
    '.kiro/**',
    'tests/**'
  ]
});

console.log(`Found ${htmlFiles.length} HTML files to process`);

// Function to extract title from HTML
function extractTitle(content) {
  const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : 'مُشرقة AI - حلول الذكاء الاصطناعي';
}

// Function to check if element exists
function hasElement(content, pattern) {
  return pattern.test(content);
}

// Function to add canonical tag if missing
function ensureCanonical(content, filePath) {
  if (hasElement(content, /<link\s+rel=["']canonical["']/i)) {
    return content;
  }
  
  const url = `https://brightai.site/${filePath}`;
  const canonical = `  <link rel="canonical" href="${url}">`;
  
  // Insert after viewport meta tag or after charset
  if (/<meta\s+name=["']viewport["']/i.test(content)) {
    return content.replace(
      /(<meta\s+name=["']viewport["'][^>]*>)/i,
      `$1\n${canonical}`
    );
  } else if (/<meta\s+charset=/i.test(content)) {
    return content.replace(
      /(<meta\s+charset=[^>]*>)/i,
      `$1\n${canonical}`
    );
  }
  
  return content;
}

// Function to add meta description if missing
function ensureMetaDescription(content, title) {
  if (hasElement(content, /<meta\s+name=["']description["']/i)) {
    return content;
  }
  
  const description = `${title} - مُشرقة AI الشركة السعودية الرائدة في الذكاء الاصطناعي`;
  const metaDesc = `  <meta name="description" content="${description}">`;
  
  // Insert after title tag
  if (/<title[^>]*>/i.test(content)) {
    return content.replace(
      /(<title[^>]*>[^<]+<\/title>)/i,
      `$1\n${metaDesc}`
    );
  }
  
  return content;
}

// Function to add Open Graph tags if missing
function ensureOpenGraphTags(content, filePath, title) {
  if (hasElement(content, /<meta\s+property=["']og:title["']/i)) {
    return content; // Already has OG tags
  }
  
  const url = `https://brightai.site/${filePath}`;
  const ogTags = `
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${title} - مُشرقة AI الشركة السعودية الرائدة في الذكاء الاصطناعي">
  <meta property="og:image" content="https://www2.0zz0.com/2025/06/23/22/317775783.png">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:site_name" content="مُشرقة AI">`;
  
  // Insert before </head>
  return content.replace(
    /(<\/head>)/i,
    `${ogTags}\n  $1`
  );
}

// Function to add Twitter Card tags if missing
function ensureTwitterCardTags(content, title) {
  if (hasElement(content, /<meta\s+name=["']twitter:card["']/i)) {
    return content; // Already has Twitter Card tags
  }
  
  const twitterTags = `
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${title} - مُشرقة AI الشركة السعودية الرائدة في الذكاء الاصطناعي">
  <meta name="twitter:image" content="https://www2.0zz0.com/2025/06/23/22/317775783.png">`;
  
  // Insert before </head>
  return content.replace(
    /(<\/head>)/i,
    `${twitterTags}\n  $1`
  );
}

// Function to ensure H1 tag exists
function ensureH1Tag(content, title) {
  // Check if H1 exists
  if (/<h1[^>]*>/i.test(content)) {
    return content; // Already has H1
  }
  
  // Try to find the first H2 and convert it to H1
  if (/<h2[^>]*>/i.test(content)) {
    return content.replace(/<h2([^>]*)>/, '<h1$1>').replace(/<\/h2>/, '</h1>');
  }
  
  // If no H2, try to add H1 after body tag
  if (/<body[^>]*>/i.test(content)) {
    return content.replace(
      /(<body[^>]*>)/i,
      `$1\n  <h1 style="display:none;">${title}</h1>`
    );
  }
  
  return content;
}

// Process each file
let fixedCount = 0;
let errorCount = 0;

htmlFiles.forEach((filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Extract title
    const title = extractTitle(content);
    
    // Apply fixes
    content = ensureCanonical(content, filePath);
    content = ensureMetaDescription(content, title);
    content = ensureOpenGraphTags(content, filePath, title);
    content = ensureTwitterCardTags(content, title);
    content = ensureH1Tag(content, title);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      fixedCount++;
      console.log(`✓ Fixed: ${filePath}`);
    }
  } catch (error) {
    errorCount++;
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nSummary:`);
console.log(`- Total files: ${htmlFiles.length}`);
console.log(`- Fixed: ${fixedCount}`);
console.log(`- Errors: ${errorCount}`);
console.log(`- Unchanged: ${htmlFiles.length - fixedCount - errorCount}`);
