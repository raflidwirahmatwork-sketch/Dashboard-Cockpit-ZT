const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Fix clampedHealth >= 65 to clampedHealth >= 40
content = content.replace(/clampedHealth >= 65/g, 'clampedHealth >= 40');

// Fix Segment 1
content = content.replace(
  /\/\/ Segment 1[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n/s,
  `// Segment 1 (Intervensi DZ - Red/Rose): 0% - 40% (180 to 252 degrees)\n` +
  `              const r1_s = (180 * Math.PI) / 180;\n` +
  `              const r1_e = (252 * Math.PI) / 180;\n` +
  `              const p1_sx = cx + r * Math.cos(r1_s);\n` +
  `              const p1_sy = cy + r * Math.sin(r1_s);\n` +
  `              const p1_ex = cx + r * Math.cos(r1_e);\n` +
  `              const p1_ey = cy + r * Math.sin(r1_e);\n`
);

// Fix Segment 2
content = content.replace(
  /\/\/ Segment 2[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n/s,
  `// Segment 2 (Perhatian - Amber/Yellow): 40% - 80% (252 to 324 degrees)\n` +
  `              const r2_s = (252 * Math.PI) / 180;\n` +
  `              const r2_e = (324 * Math.PI) / 180;\n` +
  `              const p2_sx = cx + r * Math.cos(r2_s);\n` +
  `              const p2_sy = cy + r * Math.sin(r2_s);\n` +
  `              const p2_ex = cx + r * Math.cos(r2_e);\n` +
  `              const p2_ey = cy + r * Math.sin(r2_e);\n`
);

// Fix Segment 3
content = content.replace(
  /\/\/ Segment 3[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n/s,
  `// Segment 3 (Sehat - Green/Emerald): 80% - 100% (324 to 360 degrees)\n` +
  `              const r3_s = (324 * Math.PI) / 180;\n` +
  `              const r3_e = (360 * Math.PI) / 180;\n` +
  `              const p3_sx = cx + r * Math.cos(r3_s);\n` +
  `              const p3_sy = cy + r * Math.sin(r3_s);\n` +
  `              const p3_ex = cx + r * Math.cos(r3_e);\n` +
  `              const p3_ey = cy + r * Math.sin(r3_e);\n`
);

fs.writeFileSync('src/components/DashboardView.tsx', content);
