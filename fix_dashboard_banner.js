const fs = require('fs');

const file = 'src/app/dashboard/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Litre Daily Plan box
code = code.replace(/text-emerald-5/g, 'text-blue-950');

// 2. Manage Subscription button
code = code.replace(/text-emerald-850/g, 'text-blue-950');

// 3. Next Delivery box title
code = code.replace(/text-emerald-200/g, 'text-blue-950/70');

// 4. Next Delivery box value (text-white)
// Only replacing the one right before "Tomorrow, 7:00 AM" or similar dynamic value
code = code.replace(/text-white font-display mt-1\.5/g, 'text-blue-950 dark:text-white font-display mt-1.5');

// also replace any text-emerald-55
code = code.replace(/text-emerald-55\/80/g, 'text-blue-900/80');

fs.writeFileSync(file, code);
console.log('Fixed button text colors in dashboard/page.tsx');
