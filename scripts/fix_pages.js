const fs = require('fs');
const path = require('path');

const pagesDir = path.resolve(__dirname, '../frontend/pages');

// Check if directory exists
if (!fs.existsSync(pagesDir)) {
    console.error(`Directory not found: ${pagesDir}`);
    process.exit(1);
}

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    console.log(`Processing ${file}...`);

    // 1. Fix Home Link "/" -> "../index.html"
    content = content.replace(/href="\/"/g, 'href="../index.html"');

    // 2. Fix explicit frontend paths (if copied from root index.html)
    // href="frontend/css/..." -> href="../css/..."
    content = content.replace(/href="frontend\/css\//g, 'href="../css/');
    content = content.replace(/'frontend\/css\//g, '\'../css/'); // JS strings

    // src="frontend/js/..." -> src="../js/..."
    content = content.replace(/src="frontend\/js\//g, 'src="../js/');
    content = content.replace(/'frontend\/js\//g, '\'../js/'); // JS strings

    // src="frontend/assets/..." -> src="../assets/..." (If applicable)
    content = content.replace(/src="frontend\/assets\//g, 'src="../assets/');

    // 3. Fix sibling page links
    // href="frontend/pages/try.html" -> href="try.html"
    content = content.replace(/href="frontend\/pages\/([^"]+)"/g, 'href="$1"');

    // Also, if links are just "try.html" (sibling), they are fine. 
    // But check if they link to "pages/try.html" (wrong relative path from inside pages)
    content = content.replace(/href="pages\/([^"]+)"/g, 'href="$1"');


    // 4. Fix Root folders (h, Smart-Medical-Archive)
    // These need to go up one level: href="h/..." -> href="../h/..."
    // We use a negative lookbehind/lookahead or just simple checks to avoid double dots if already fixed.
    // Simplest: replace `href="h/` with `href="../h/`
    content = content.replace(/href="h\//g, 'href="../h/');
    content = content.replace(/href="Smart-Medical-Archive\//g, 'href="../Smart-Medical-Archive/');

    // 5. Fix Image src="Gemini.png" specific case
    // If it's just "Gemini.png", it expects it in current dir. It should be in assets.
    content = content.replace(/src="Gemini.png"/g, 'src="../assets/images/Gemini.png"');

    // 6. Fix "Active State" - Simple text replacement for current page link
    // If we are in 'about-us.html', find the link to 'about-us.html' and make it gold/active.
    // The link might be `href="about-us.html"`. 
    // We want to add a class or change color.
    // Common pattern in this template: class="... text-slate-400 ..."
    // We can replace `href="${file}" class="... text-slate-400"` with `class="... text-gold-400"`
    // This is brittle but might work for the "Strict" requirement.

    // Let's try to highlight the current page in the nav
    // Find: href="CURRENT_FILE" ... text-slate-400
    // Replace: href="CURRENT_FILE" ... text-gold-400
    const fileLinkRegex = new RegExp(`href="${file}"([^>]*?)text-slate-400`, 'g');
    content = content.replace(fileLinkRegex, `href="${file}"$1text-gold-400`);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`  -> Modified ${file}`);
    } else {
        console.log(`  -> No changes needed.`);
    }
});

console.log('Done fixing pages.');
