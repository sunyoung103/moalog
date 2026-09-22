const fs = require('fs');
let code = fs.readFileSync('src/components/ReportView.tsx', 'utf-8');

code = code.replace(
  /const fishCount = collectedList\.filter\(\(s\) => s\.category === 'fishes'\)\.length;/,
  "const fishCount = collectedList.filter((s) => s.category === 'fishes').length;\n  const otherCount = collectedList.filter((s) => s.category === 'others').length;"
);

code = code.replace(
  /const fishPct = Math\.round\(\(fishCount \/ totalCollectedCount\) \* 100\);/,
  "const fishPct = Math.round((fishCount / totalCollectedCount) * 100);\n  const otherPct = Math.round((otherCount / totalCollectedCount) * 100);"
);

code = code.replace(
  /const fishOffset = -\(plantPct \+ birdPct \+ insectPct \+ mammalPct \+ reptilePct \+ amphibianPct\);/,
  "const fishOffset = -(plantPct + birdPct + insectPct + mammalPct + reptilePct + amphibianPct);\n  const otherOffset = -(plantPct + birdPct + insectPct + mammalPct + reptilePct + amphibianPct + fishPct);"
);

code = code.replace(
  /\{\/\* Fish Segment \*\/\}/,
  `{/* Other Segment */}
                  {otherPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#78716c"
                      strokeWidth="5"
                      strokeDasharray={\`\${otherPct}, 100\`}
                      strokeDashoffset={otherOffset}
                    />
                  )}
                  {/* Fish Segment */}`
);

code = code.replace(
  /\{fishCount > 0 && \([\s\S]*?어류[\s\S]*?<\!/g,
  function(match) { return match; } // Just finding it
);
