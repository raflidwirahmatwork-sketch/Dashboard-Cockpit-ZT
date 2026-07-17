const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Change gradient 1
content = content.replace(
  /<linearGradient id="g1"[^>]*>[\s\S]*?<\/linearGradient>/,
  `<linearGradient id="g1" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#e11d48" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>`
);

// Change gradient 2
content = content.replace(
  /<linearGradient id="g2"[^>]*>[\s\S]*?<\/linearGradient>/,
  `<linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>`
);

// Change gradient 3
content = content.replace(
  /<linearGradient id="g3"[^>]*>[\s\S]*?<\/linearGradient>/,
  `<linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>`
);

// Remove strokeLinecap="round" from paths to make them butt/connect
content = content.replace(/strokeLinecap="round"/g, 'strokeLinecap="butt"');

fs.writeFileSync('src/components/DashboardView.tsx', content);
