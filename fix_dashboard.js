const fs = require('fs');

const files = [
  'src/app/dashboard/layout.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/bills/page.tsx',
  'src/app/dashboard/skip/page.tsx',
  'src/app/dashboard/vacation/page.tsx',
  'src/app/dashboard/extra/page.tsx',
  'src/app/dashboard/quantity/page.tsx',
  'src/app/dashboard/history/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');

  // Backgrounds
  code = code.replace(/bg-white(?! dark:)/g, 'bg-white dark:bg-slate-900');
  code = code.replace(/bg-slate-50(?![\/0-9])(?! dark:)/g, 'bg-slate-50 dark:bg-slate-950');
  code = code.replace(/bg-slate-100(?![\/0-9])(?! dark:)/g, 'bg-slate-100 dark:bg-slate-800');
  code = code.replace(/bg-slate-200(?![\/0-9])(?! dark:)/g, 'bg-slate-200 dark:bg-slate-800');
  code = code.replace(/bg-blue-50(?![\/0-9])(?! dark:)/g, 'bg-blue-50 dark:bg-blue-900/20');
  
  // Borders
  code = code.replace(/border-slate-200(?![\/0-9])(?! dark:)/g, 'border-slate-200 dark:border-slate-800');
  code = code.replace(/border-slate-100(?![\/0-9])(?! dark:)/g, 'border-slate-100 dark:border-slate-800/60');
  code = code.replace(/border-border(?![\/0-9])(?! dark:)/g, 'border-border dark:border-slate-800');

  // Texts
  code = code.replace(/text-slate-900(?! dark:)/g, 'text-slate-900 dark:text-white');
  code = code.replace(/text-slate-800(?! dark:)/g, 'text-slate-800 dark:text-slate-200');
  code = code.replace(/text-slate-700(?! dark:)/g, 'text-slate-700 dark:text-slate-300');
  code = code.replace(/text-slate-600(?! dark:)/g, 'text-slate-600 dark:text-slate-400');
  code = code.replace(/text-slate-500(?! dark:)/g, 'text-slate-500 dark:text-slate-400');
  code = code.replace(/text-slate-400(?! dark:)/g, 'text-slate-400 dark:text-slate-500');

  fs.writeFileSync(file, code);
  console.log('Processed ' + file);
}
