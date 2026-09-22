const fs = require('fs');
let code = fs.readFileSync('src/components/DetailView.tsx', 'utf-8');

code = code.replace(
  /<button\s+type="button"\s+onClick=\{\(\) => setActiveTagTab\(activeTagTab === 'diet' \? null : 'diet'\)\}/g,
  '{dietTag && (<button type="button" onClick={() => setActiveTagTab(activeTagTab === \'diet\' ? null : \'diet\')}'
);
code = code.replace(
  /<span className="text-xs font-extrabold text-stone-800 truncate block">\{dietTag\}<\/span>\s*<\/div>\s*<\/button>/g,
  '<span className="text-xs font-extrabold text-stone-800 truncate block">{dietTag}</span></div></button>)}'
);

code = code.replace(
  /<button\s+type="button"\s+onClick=\{\(\) => setActiveTagTab\(activeTagTab === 'size' \? null : 'size'\)\}/g,
  '{sizeTag && (<button type="button" onClick={() => setActiveTagTab(activeTagTab === \'size\' ? null : \'size\')}'
);
code = code.replace(
  /<span className="text-xs font-extrabold text-stone-800 truncate block">\{sizeTag\}<\/span>\s*<\/div>\s*<\/button>/g,
  '<span className="text-xs font-extrabold text-stone-800 truncate block">{sizeTag}</span></div></button>)}'
);

fs.writeFileSync('src/components/DetailView.tsx', code);
