const fs = require('fs');
let code = fs.readFileSync('src/components/ReportView.tsx', 'utf-8');

const replacement = `{fishCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    🐟 어류
                  </span>
                  <span className="font-mono font-bold text-blue-800 text-[11px]">{fishCount}종 ({fishPct}%)</span>
                </div>
                )}
                {otherCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-stone-500" />
                    ❓ 기타
                  </span>
                  <span className="font-mono font-bold text-stone-800 text-[11px]">{otherCount}종 ({otherPct}%)</span>
                </div>
                )}`;

code = code.replace(
  /\{fishCount > 0 && \([\s\S]*?\{fishCount\}종 \(\{fishPct\}\%\)<\/span>\s*<\/div>\s*\)\}/g,
  replacement
);

fs.writeFileSync('src/components/ReportView.tsx', code);
