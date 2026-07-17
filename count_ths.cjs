const fs = require('fs');
const content = fs.readFileSync('src/components/ProgramTrackerView.tsx', 'utf8');

const regex = /<tr className="bg-slate-50[^>]*>([\s\S]*?)<\/tr>/;
const match = content.match(regex);
if (match) {
  const trContent = match[1];
  const thRegex = /<th[^>]*>/g;
  let thMatches = [...trContent.matchAll(thRegex)];
  console.log(`Total th tags: ${thMatches.length}`);
  
  thMatches.forEach((m, index) => {
    // get some text around it
    const start = m.index;
    const end = trContent.indexOf('</th>', start) + 5;
    const str = trContent.substring(start, end).replace(/\s+/g, ' ');
    console.log(`${index + 1}: ${str.substring(0, 100)}...`);
  });
}
