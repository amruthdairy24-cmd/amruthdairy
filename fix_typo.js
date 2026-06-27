const fs = require('fs');
const file = 'src/app/dashboard/page.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/text-blue-9505\/80/g, 'text-blue-900/80');
fs.writeFileSync(file, code);
