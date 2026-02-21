const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const basePath = '/Users/yzydalshmry/Desktop/BrightAI';
const sitemapPath = path.join(basePath, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');

const locMatches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const relPathToCanonical = {};

for (const loc of locMatches) {
    let relPathStr = decodeURI(loc.replace('https://brightai.site/', ''));
    // if relPathStr ends with '/', it corresponds to '.../index.html' locally
    if (relPathStr.endsWith('/')) {
        relPathStr += 'index.html';
    } else if (relPathStr === '') {
        relPathStr = 'index.html';
    }
    relPathToCanonical[relPathStr] = loc;
}

// Ensure the root index.html maps cleanly if the above missed it
relPathToCanonical['index.html'] = 'https://brightai.site/';

// Ensure ai-workflows mapping is correct. It was written wrongfully in user's example? 
// The real file is frontend/pages/ai-workflows/index.html
relPathToCanonical['frontend/pages/ai-workflows/index.html'] = 'https://brightai.site/frontend/pages/ai-workflows/index.html';

relPathToCanonical['frontend/pages/blogger/production-line-2.html'] = 'https://brightai.site/frontend/pages/blogger/production-line.html';
relPathToCanonical['frontend/pages/blogger/Generative artificial intelligence.html'] = 'https://brightai.site/frontend/pages/blogger/Generative-artificial-intelligence.html';

let updatedFilesCount = 0;

function fixFile(filePath) {
    const relPath = path.relative(basePath, filePath);

    let expectedCanonical = relPathToCanonical[relPath];
    if (!expectedCanonical) {
        if (relPath.endsWith('/index.html')) {
            let altRel = relPath.replace(/\/index\.html$/, '/');
            if (relPathToCanonical[altRel]) expectedCanonical = relPathToCanonical[altRel];
        }
    }
    if (!expectedCanonical) {
        expectedCanonical = 'https://brightai.site/' + encodeURI(relPath);
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    const linkCanonicalRegex1 = /(<link[^>]*?rel=["']canonical["'][^>]*?href=["'])([^"']*?)(["'][^>]*>)/gi;
    const linkCanonicalRegex2 = /(<link[^>]*?href=["'])([^"']*?)(["'][^>]*?rel=["']canonical["'][^>]*>)/gi;

    content = content.replace(linkCanonicalRegex1, "$1" + expectedCanonical + "$3");
    content = content.replace(linkCanonicalRegex2, "$1" + expectedCanonical + "$3");

    const ogUrlRegex1 = /(<meta[^>]*?property=["']og:url["'][^>]*?content=["'])([^"']*?)(["'][^>]*>)/gi;
    const ogUrlRegex2 = /(<meta[^>]*?content=["'])([^"']*?)(["'][^>]*?property=["']og:url["'][^>]*>)/gi;

    content = content.replace(ogUrlRegex1, "$1" + expectedCanonical + "$3");
    content = content.replace(ogUrlRegex2, "$1" + expectedCanonical + "$3");

    const twUrlRegex1 = /(<meta[^>]*?name=["']twitter:url["'][^>]*?content=["'])([^"']*?)(["'][^>]*>)/gi;
    const twUrlRegex2 = /(<meta[^>]*?content=["'])([^"']*?)(["'][^>]*?name=["']twitter:url["'][^>]*>)/gi;

    content = content.replace(twUrlRegex1, "$1" + expectedCanonical + "$3");
    content = content.replace(twUrlRegex2, "$1" + expectedCanonical + "$3");

    const hreflangRegex1 = /(<link[^>]*?hreflang=["'](?:ar|ar-sa|ar-SA|x-default)["'][^>]*?href=["'])([^"']*?)(["'][^>]*>)/gi;
    const hreflangRegex2 = /(<link[^>]*?href=["'])([^"']*?)(["'][^>]*?hreflang=["'](?:ar|ar-sa|ar-SA|x-default)["'][^>]*>)/gi;

    content = content.replace(hreflangRegex1, "$1" + expectedCanonical + "$3");
    content = content.replace(hreflangRegex2, "$1" + expectedCanonical + "$3");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        updatedFilesCount++;
        if (updatedFilesCount <= 20) {
            console.log(`[UPDATED] ${relPath} -> ${expectedCanonical}`);
        }
    }
}

const htmlFilesStr = execSync('find ' + basePath + ' -name "*.html" -not -path "*/node_modules/*"').toString();
const htmlFiles = htmlFilesStr.split('\n').filter(Boolean);

console.log('Total HTML files to process:', htmlFiles.length);
htmlFiles.forEach(fixFile);
console.log('Total files updated:', updatedFilesCount);
