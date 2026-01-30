/**
 * Phase 1 Critical Fixes Verification Script
 * Verifies that all critical fixes from tasks 1-4 are correctly implemented
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  log(`\n📄 Checking: ${filePath}`, 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`  ❌ File not found!`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;
  
  for (const check of checks) {
    const passed = check.test(content);
    if (passed) {
      log(`  ✅ ${check.name}`, 'green');
    } else {
      log(`  ❌ ${check.name}`, 'red');
      if (check.hint) {
        log(`     💡 ${check.hint}`, 'yellow');
      }
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Task 1: Fix medical.js API endpoint error
const medicalChecks = [
  {
    name: 'Uses config.gemini.endpoint (not baseUrl)',
    test: (content) => content.includes('config.gemini.endpoint') && !content.includes('config.gemini.baseUrl'),
    hint: 'Should use config.gemini.endpoint instead of config.gemini.baseUrl'
  },
  {
    name: 'Follows correct URL pattern',
    test: (content) => content.includes('${config.gemini.endpoint}/${config.gemini.model}:generateContent'),
    hint: 'URL should match pattern: ${config.gemini.endpoint}/${config.gemini.model}:generateContent'
  },
  {
    name: 'Has proper error handling',
    test: (content) => content.includes('errorCode') && content.includes('خدمة الذكاء الاصطناعي غير متاحة حالياً'),
    hint: 'Should have Arabic error messages with errorCode'
  }
];

// Task 2: Fix summary.js prompt text
const summaryChecks = [
  {
    name: 'Prompt is fully in Arabic',
    test: (content) => {
      const promptMatch = content.match(/const prompt = `([^`]+)`/s);
      if (!promptMatch) return false;
      const prompt = promptMatch[1];
      // Check for German/English words that shouldn't be there
      return !prompt.includes('Lese') && 
             prompt.includes('اقرأ النص التالي') &&
             prompt.includes('باللغة العربية');
    },
    hint: 'Prompt should be fully in Arabic, no German/English mixed in'
  },
  {
    name: 'References Saudi audience and Vision 2030',
    test: (content) => (content.includes('الجمهور السعودي') || content.includes('للجمهور السعودي')) && (content.includes('رؤية المملكة 2030') || (content.includes('رؤية') && content.includes('2030'))),
    hint: 'Should explicitly mention Saudi audience and Vision 2030'
  },
  {
    name: 'Error messages are in Arabic',
    test: (content) => content.includes('يجب تقديم نص للتلخيص') && content.includes('خدمة الذكاء الاصطناعي غير متاحة حالياً'),
    hint: 'All error messages should be in Arabic'
  },
  {
    name: 'Uses correct config.gemini.endpoint',
    test: (content) => content.includes('config.gemini.endpoint'),
    hint: 'Should use config.gemini.endpoint for API calls'
  }
];

// Task 3: Handle URL field in summary endpoint
const summaryUrlChecks = [
  {
    name: 'URL field validation removed or handled',
    test: (content) => {
      // Check that we're not validating url field anymore, or if we are, it's properly handled
      const hasUrlValidation = content.includes('url') && content.includes('req.body');
      if (!hasUrlValidation) return true; // URL validation removed - good
      // If URL validation exists, it should have proper error handling
      return content.includes('url') && content.includes('errorCode');
    },
    hint: 'URL field should either be removed from validation or properly handled with error messages'
  },
  {
    name: 'Only validates text field',
    test: (content) => content.includes('const { text }') && content.includes('if (!text)'),
    hint: 'Should validate text field is present'
  }
];

// Task 4: Clean package.json
const packageJsonChecks = [
  {
    name: 'pdfjs-dist removed from dependencies',
    test: (content) => {
      const pkg = JSON.parse(content);
      return !pkg.dependencies || !pkg.dependencies['pdfjs-dist'];
    },
    hint: 'pdfjs-dist should be removed from dependencies (will be added back in Phase 8)'
  },
  {
    name: 'Has required dependencies',
    test: (content) => {
      const pkg = JSON.parse(content);
      return pkg.dependencies && pkg.dependencies.dotenv;
    },
    hint: 'Should have dotenv in dependencies'
  },
  {
    name: 'Has test dependencies',
    test: (content) => {
      const pkg = JSON.parse(content);
      return pkg.devDependencies && 
             pkg.devDependencies.vitest && 
             pkg.devDependencies['fast-check'];
    },
    hint: 'Should have vitest and fast-check in devDependencies'
  }
];

// Additional checks for consistency
const configChecks = [
  {
    name: 'Config has gemini.endpoint defined',
    test: (content) => content.includes("endpoint: 'https://generativelanguage.googleapis.com"),
    hint: 'Config should define gemini.endpoint'
  },
  {
    name: 'Has isApiKeyConfigured helper',
    test: (content) => content.includes('isApiKeyConfigured'),
    hint: 'Should export isApiKeyConfigured helper function'
  }
];

// Run all checks
log('\n🔍 Phase 1 Critical Fixes Verification\n', 'blue');
log('=' .repeat(50), 'blue');

let allTestsPassed = true;

// Task 1
log('\n📋 Task 1: Fix medical.js API endpoint', 'yellow');
allTestsPassed = checkFile('server/endpoints/medical.js', medicalChecks) && allTestsPassed;

// Task 2
log('\n📋 Task 2: Fix summary.js prompt text', 'yellow');
allTestsPassed = checkFile('server/endpoints/summary.js', summaryChecks) && allTestsPassed;

// Task 3
log('\n📋 Task 3: Handle URL field in summary', 'yellow');
allTestsPassed = checkFile('server/endpoints/summary.js', summaryUrlChecks) && allTestsPassed;

// Task 4
log('\n📋 Task 4: Clean package.json', 'yellow');
allTestsPassed = checkFile('package.json', packageJsonChecks) && allTestsPassed;

// Additional checks
log('\n📋 Additional: Config consistency', 'yellow');
allTestsPassed = checkFile('server/config/index.js', configChecks) && allTestsPassed;

// Summary
log('\n' + '='.repeat(50), 'blue');
if (allTestsPassed) {
  log('\n✅ All Phase 1 critical fixes verified successfully!', 'green');
  log('✅ Ready to proceed to Phase 2: Testing Infrastructure\n', 'green');
  process.exit(0);
} else {
  log('\n❌ Some checks failed. Please review the issues above.', 'red');
  log('❌ Fix the issues before proceeding to Phase 2.\n', 'red');
  process.exit(1);
}
