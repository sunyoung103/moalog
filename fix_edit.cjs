const fs = require('fs');
let code = fs.readFileSync('src/components/EditSpecimenModal.tsx', 'utf-8');

code = code.replace(
  /\{ key: 'mammals', label: '포유류' \},/,
  "{ key: 'mammals', label: '포유류' },\n                { key: 'reptiles', label: '파충류' },\n                { key: 'amphibians', label: '양서류' },\n                { key: 'fishes', label: '어류' },\n                { key: 'others', label: '기타/미분류' },"
);

fs.writeFileSync('src/components/EditSpecimenModal.tsx', code);
