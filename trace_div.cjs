const fs = require('fs');
const content = fs.readFileSync('src/pages/POS.tsx', 'utf-8');
const lines = content.split('\n');
let d = 0;
for (let i = 330; i < lines.length; i++) {
    if (!lines[i]) continue;
    const l = lines[i];
    const open = (l.match(/<div(\s|>)/g) || []).length;
    const close = (l.match(/<\/div>/g) || []).length;
    d += open - close;
    if (open || close) {
        console.log(`${i+1}: d=${d} (+${open} -${close}) ${l.trim().substring(0, 40)}`);
    }
}
