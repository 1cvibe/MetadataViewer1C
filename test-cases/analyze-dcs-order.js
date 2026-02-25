const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const reportsDir = 'D:/1C/RZDZUP/src/cf/Reports';

console.log('=== Анализ порядка тегов в Template.xml ===\n');

// Находим все Template.xml файлы
function findTemplateFiles(dir, maxFiles = 10) {
  const results = [];
  
  function scan(currentDir, depth = 0) {
    if (depth > 5 || results.length >= maxFiles) return;
    
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (results.length >= maxFiles) break;
        
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          scan(fullPath, depth + 1);
        } else if (entry.name === 'Template.xml' && fullPath.includes('Templates')) {
          results.push(fullPath);
        }
      }
    } catch (e) {
      // Игнорируем ошибки доступа
    }
  }
  
  scan(dir);
  return results;
}

const templateFiles = findTemplateFiles(reportsDir, 10);
console.log(`Найдено файлов: ${templateFiles.length}\n`);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

// Анализируем порядок тегов
const tagOrders = [];

for (const filePath of templateFiles) {
  try {
    const xml = fs.readFileSync(filePath, 'utf8');
    const parsed = parser.parse(xml);
    
    // Ищем DataCompositionSchema
    const top = Array.isArray(parsed) ? parsed : [parsed];
    const rootEntry = top.find(n => n && typeof n === 'object' && !Array.isArray(n) && 'DataCompositionSchema' in n);
    
    if (!rootEntry) continue;
    
    const rootBody = rootEntry['DataCompositionSchema'] || [];
    const tags = [];
    
    for (const item of rootBody) {
      if (!item || typeof item !== 'object') continue;
      const tag = Object.keys(item).find(k => k !== ':@');
      if (tag && tag !== '#text') {
        // Убираем namespace префиксы
        const localTag = tag.includes(':') ? tag.split(':').pop() : tag;
        tags.push(localTag);
      }
    }
    
    const reportName = path.basename(path.dirname(path.dirname(path.dirname(filePath))));
    tagOrders.push({ report: reportName, tags });
    
  } catch (e) {
    console.error(`Ошибка обработки ${filePath}:`, e.message);
  }
}

console.log('=== Порядок тегов в корне DataCompositionSchema ===\n');

for (const { report, tags } of tagOrders) {
  console.log(`\n${report}:`);
  tags.forEach((tag, i) => {
    console.log(`  ${i + 1}. ${tag}`);
  });
}

// Анализируем общий паттерн
console.log('\n=== Анализ общего порядка ===\n');

const tagPositions = new Map();

for (const { tags } of tagOrders) {
  tags.forEach((tag, index) => {
    if (!tagPositions.has(tag)) {
      tagPositions.set(tag, []);
    }
    tagPositions.get(tag).push(index);
  });
}

const averagePositions = [];
for (const [tag, positions] of tagPositions.entries()) {
  const avg = positions.reduce((a, b) => a + b, 0) / positions.length;
  averagePositions.push({ tag, avg, count: positions.length });
}

averagePositions.sort((a, b) => a.avg - b.avg);

console.log('Типичный порядок тегов (по средней позиции):');
averagePositions.forEach(({ tag, avg, count }) => {
  console.log(`  ${tag.padEnd(25)} (сред. позиция: ${avg.toFixed(1)}, встречается: ${count} раз)`);
});

