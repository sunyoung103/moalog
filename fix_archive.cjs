const fs = require('fs');
let code = fs.readFileSync('src/components/ArchiveView.tsx', 'utf-8');

code = code.replace(
  /\} from 'lucide-react';/,
  ', Fish, HelpCircle } from \'lucide-react\';'
);

code = code.replace(
  /\{ id: 'amphibians', label: '양서류', icon: Droplets \},\s*\];/,
  "{ id: 'amphibians', label: '양서류', icon: Droplets },\n    { id: 'fishes', label: '어류', icon: Fish },\n    { id: 'others', label: '기타/미분류', icon: HelpCircle },\n  ];"
);

fs.writeFileSync('src/components/ArchiveView.tsx', code);
