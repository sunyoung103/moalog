const fs = require('fs');
let code = fs.readFileSync('src/components/RecentSpecimenBasket.tsx', 'utf-8');

code = code.replace(
  /: sp\.category === 'fishes'\s*\?\s*'🐟'\s*: sp\.category === 'mammals'\s*\?\s*'🦊'\s*: sp\.category === 'others'\s*\?\s*'✨'\s*\?\s*'🐟'\s*:\s*'🦊';/g,
  ": sp.category === 'fishes'\n                ? '🐟'\n                : sp.category === 'mammals'\n                ? '🦊'\n                : '✨';"
);

fs.writeFileSync('src/components/RecentSpecimenBasket.tsx', code);
