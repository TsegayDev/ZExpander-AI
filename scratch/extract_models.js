const fs = require('fs');
// Read file with potential UTF-16LE encoding from PowerShell
const content = fs.readFileSync('d:\\Coding\\ZExpander-AI\\scratch\\models_list.json', 'utf16le');
const data = JSON.parse(content);
const models = data.models.map(m => m.name);
console.log(models.join('\n'));
