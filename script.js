const fs = require('fs');
let code = fs.readFileSync('src/app/onboarding/page.tsx', 'utf8');

// Replace wrapper
code = code.replace(/bg-slate-50 text-slate-900/g, 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100');

// Replace borders
code = code.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-800');
code = code.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-800/60');
code = code.replace(/border-blue-100/g, 'border-blue-100 dark:border-blue-800/30');

// Replace backgrounds
code = code.replace(/bg-white/g, 'bg-white dark:bg-slate-900');
code = code.replace(/bg-slate-50(?![\/0-9])/g, 'bg-slate-50 dark:bg-slate-950');
code = code.replace(/bg-blue-50(?![\/0-9])/g, 'bg-blue-50 dark:bg-blue-900/20');
code = code.replace(/bg-slate-100/g, 'bg-slate-100 dark:bg-slate-800');

// Handle partial opacities correctly
code = code.replace(/bg-slate-50\/50/g, 'bg-slate-50/50 dark:bg-slate-950/50'); 
code = code.replace(/bg-slate-50\/80/g, 'bg-slate-50/80 dark:bg-slate-950/80');

// Text colors
code = code.replace(/text-slate-900/g, 'text-slate-900 dark:text-white');
code = code.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
code = code.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
code = code.replace(/text-slate-400/g, 'text-slate-400 dark:text-slate-500');

// placeholder
code = code.replace(/placeholder-slate-400/g, 'placeholder-slate-400 dark:placeholder-slate-500'); 

// Specific overrides to clean up accidental double darks or unwanted hits
code = code.replace(/text-white dark:text-slate-300/g, 'text-white');
code = code.replace(/text-white dark:text-white/g, 'text-white');
code = code.replace(/text-slate-400 dark:text-slate-500 dark:text-slate-500/g, 'text-slate-400 dark:text-slate-500');

fs.writeFileSync('src/app/onboarding/page.tsx', code);
console.log('Done onboarding page');
