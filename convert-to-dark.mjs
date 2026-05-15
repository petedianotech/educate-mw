import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace standard colors for views for elements that haven't been modified yet
content = content.replace(/bg-\[#FAFBFF\]/g, 'bg-gray-950');
// Be careful with bg-white, some cases are valid like in Homeview we already changed it, but maybe remaining bg-white should be bg-gray-900.
content = content.replace(/bg-white/g, 'bg-gray-900');
content = content.replace(/text-gray-900/g, 'text-gray-100');
content = content.replace(/text-gray-700/g, 'text-gray-300');
content = content.replace(/text-gray-500/g, 'text-gray-400');
content = content.replace(/border-gray-100/g, 'border-gray-800');
content = content.replace(/border-gray-50/g, 'border-gray-800');
content = content.replace(/bg-gray-50/g, 'bg-gray-800');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated to dark mode colors');
