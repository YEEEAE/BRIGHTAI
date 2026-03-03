const fs = require('fs');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(f => f.isDirectory() ? walk(d + '/' + f.name) : d + '/' + f.name).filter(f => f.endsWith('.html'));
const files = walk('frontend/pages').concat(['index.html', 'docs.html']);
let missing = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (!/<link[^>]+rel=["']canonical["'][^>]*>/i.test(h)) missing++;
});
console.log('Missing canonical:', missing);
