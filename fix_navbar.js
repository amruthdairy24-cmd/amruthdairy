const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// Replace bg-white
code = code.replace(/bg-white\/95/g, 'bg-white/95 dark:bg-slate-950/95');
code = code.replace(/bg-white(?! dark:)/g, 'bg-white dark:bg-slate-950');

// Text colors
code = code.replace(/text-brand-primary\/80/g, 'text-brand-primary/80 dark:text-slate-300');
code = code.replace(/text-brand-primary(?![\/A-Za-z])/g, 'text-brand-primary dark:text-white');

// Background gradients/colors for buttons
code = code.replace(/bg-slate-50\/50/g, 'bg-slate-50/50 dark:bg-slate-800/50');
code = code.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-800');
code = code.replace(/border-border(?![\/A-Za-z])/g, 'border-border dark:border-slate-800');

fs.writeFileSync('src/components/layout/Navbar.tsx', code);
console.log('Fixed Navbar.tsx');
