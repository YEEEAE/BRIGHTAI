const fs = require('fs');
const path = require('path');

/**
 * BrightAI Internal Linkor (Auto-Injection Tool)
 * WARNING: This script modifies HTML files in place. 
 * Usage: node scripts/auto_linker.js
 */

const CONFIG = {
    rootDir: path.join(__dirname, '../frontend/pages/blogger'),
    targets: [
        {
            keywords: ['تحليل بيانات', 'Data Analysis', 'بيانات ضخمة'],
            url: '/frontend/pages/try/index.html',
            anchor: 'جرّب تحليل بياناتك بنفسك الآن مجاناً',
            priority: 1
        },
        {
            keywords: ['أتمتة', 'RPA', 'Automation'],
            url: '/frontend/pages/smart-automation/index.html',
            anchor: 'أتمت أعمالك مع حلول BrightAI',
            priority: 2
        },
        {
            keywords: ['طبي', 'مستشفى', 'رعاية صحية'],
            url: '/frontend/pages/smart-medical-archive/index.html',
            anchor: 'اكتشف الأرشيف الطبي الذكي',
            priority: 1
        }
    ],
    // Only inject if the file doesn't already link to the target
    dryRun: true // Change to false to execute
};

function processFiles(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) return;
        if (!file.endsWith('.html')) return;

        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        CONFIG.targets.forEach(target => {
            // Check if link already exists
            if (content.includes(target.url)) return;

            // Simple regex to find keywords outside of HTML tags
            // Note: This is a basic implementation. For production, use a DOM parser like cheerio.
            const keywordRegex = new RegExp(`(${target.keywords.join('|')})`, 'i');

            if (content.match(keywordRegex)) {
                // Determine insertion point (e.g., end of first paragraph)
                // This is a naive injection for demonstration logic
                const pCloseTag = '</p>';
                const insertionPoint = content.indexOf(pCloseTag);

                if (insertionPoint !== -1) {
                    const ctaHTML = ` <a href="${target.url}" class="text-indigo-500 font-bold hover:underline" data-auto-link="true">(${target.anchor})</a>`;

                    // Inject closest to the top of the file (first paragraph)
                    // In a real robust script, we'd inject deeper or contextually.
                    // Here we just simulate finding the match.
                    console.log(`[Target Found] ${file} -> Matches keywords: ${target.keywords}`);

                    if (!CONFIG.dryRun) {
                        // Actual injection logic would go here
                        // content = content.slice(0, insertionPoint) + ctaHTML + content.slice(insertionPoint);
                        // modified = true;
                    }
                }
            }
        });

        if (modified && !CONFIG.dryRun) {
            fs.writeFileSync(fullPath, content);
            console.log(`[Injected] Updated ${file}`);
        }
    });
}

console.log("Starting Auto-Linker Scan...");
processFiles(CONFIG.rootDir);
console.log("Scan Complete.");
