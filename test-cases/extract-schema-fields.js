const fs = require('fs');

const content = fs.readFileSync('src/schemas/objectSchemas.ts', 'utf8');
const titles = [];
const regex = /title:\s*['"]([A-Z][a-zA-Z0-9]+)['"]/g;
let m;
while ((m = regex.exec(content)) !== null) {
    titles.push(m[1]);
}
const unique = [...new Set(titles)].sort();

console.log('Поля из схем (всего ' + unique.length + '):');
unique.forEach(t => console.log('  ' + t));

fs.writeFileSync('scripts/schema-fields.json', JSON.stringify(unique, null, 2));
