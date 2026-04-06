import fs from 'fs';
import path from 'path';

const gtagSnippetContent = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-8LLESL207Q'); 
</script>`;

function findHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    // Ignore node_modules
    if (file === 'node_modules' || file === '.git' || file === '.next') {
        return;
    }
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else {
      if (path.extname(file) === '.html') {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Find HTML files in current directory
const files = findHtmlFiles('./');

let modifiedCount = 0;

for (const file of files) {
  const absPath = path.resolve(file);
  let content = fs.readFileSync(absPath, 'utf-8');
  const initialContent = content;

  // Strip existing GTag scripts
  content = content.replace(/<!-- Google tag \(gtag\.js\) -->\s*/gi, '');
  content = content.replace(/<script[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-8LLESL207Q"[^>]*><\/script>\s*/gi, '');
  
  // This will match <script> tags that contain dataLayer.push and G-8LLESL207Q across newlines
  const anyInlineScriptRegex = /<script>[^<]*dataLayer\.push[^<]*'G-8LLESL207Q'[^<]*<\/script>\s*/gi;
  content = content.replace(anyInlineScriptRegex, '');

  // Add standard snippet right after <head>
  const headMatch = content.match(/<head([^>]*)>/i);
  if (headMatch) {
    const headFullStr = headMatch[0];
    
    const index = content.indexOf(headFullStr) + headFullStr.length;
    content = content.substring(0, index) + gtagSnippetContent + content.substring(index);
  }

  if (content !== initialContent) {
    fs.writeFileSync(absPath, content, 'utf-8');
    modifiedCount++;
  }
}

console.log("Total updated: " + modifiedCount);
