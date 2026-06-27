const fs = require('fs');
const file = 'src/app/dashboard/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// The Zone: Mangalore Metro text
// It currently has text-blue-900/80
code = code.replace(/text-blue-900\/80/g, 'text-blue-50');

// Also remove any stray duplicate dark:text-slate-500
code = code.replace(/dark:text-slate-400 dark:text-slate-500/g, 'dark:text-slate-400');

fs.writeFileSync(file, code);
console.log('Fixed Zone badge text color');
