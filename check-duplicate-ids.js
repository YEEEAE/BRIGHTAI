#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Get all HTML files
function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules, .git, etc.
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'backups') {
                getAllHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Check for duplicate IDs in a single file
function checkDuplicateIdsInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(content);
    const document = dom.window.document;
    
    const idMap = new Map();
    const duplicates = [];
    
    // Get all elements with id attribute
    const elementsWithId = document.querySelectorAll('[id]');
    
    elementsWithId.forEach(element => {
        const id = element.id;
        if (idMap.has(id)) {
            duplicates.push({
                id,
                element: element.tagName.toLowerCase(),
                firstOccurrence: idMap.get(id),
                duplicate: element.outerHTML.substring(0, 100)
            });
        } else {
            idMap.set(id, element.outerHTML.substring(0, 100));
        }
    });
    
    return { file: filePath, duplicates, totalIds: elementsWithId.length };
}

// Main execution
console.log('🔍 Scanning for duplicate button IDs...\n');

const htmlFiles = getAllHtmlFiles('.');
let totalDuplicates = 0;
const filesWithDuplicates = [];

htmlFiles.forEach(file => {
    const result = checkDuplicateIdsInFile(file);
    
    if (result.duplicates.length > 0) {
        totalDuplicates += result.duplicates.length;
        filesWithDuplicates.push(result);
        
        console.log(`❌ ${file}`);
        console.log(`   Total IDs: ${result.totalIds}`);
        result.duplicates.forEach(dup => {
            console.log(`   Duplicate ID: "${dup.id}" on <${dup.element}>`);
        });
        console.log('');
    }
});

if (totalDuplicates === 0) {
    console.log('✅ No duplicate IDs found!');
} else {
    console.log(`\n📊 Summary: Found ${totalDuplicates} duplicate IDs in ${filesWithDuplicates.length} files`);
}

process.exit(totalDuplicates > 0 ? 1 : 0);
