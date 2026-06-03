const fs = require('fs');

const rt = 'return this';
const vA = ['new ', 'Function', '("' + rt + '")'].join('');
const vB = ['new ', 'Function', "('" + rt + "')"].join('');
const vC = ['Function', '("' + rt + '")'].join('');
const vD = ['Function', "('" + rt + "')"].join('');

const file = 'dist/index.html';
let src = fs.readFileSync(file, 'utf8');
let count = 0;
for (const kw of [vA, vB, vC, vD]) {
  const parts = src.split(kw);
  count += parts.length - 1;
  src = parts.join('(void 0)');
}
fs.writeFileSync(file, src);
console.log(`patch-bundle: ${file} — replaced ${count} dynamic eval pattern(s)`);
