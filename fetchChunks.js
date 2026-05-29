const fs = require('fs');

async function fetchAndSearch(filename) {
  try {
    const r = await fetch('https://anime.streamxtv.tech/assets/' + filename);
    const code = await r.text();
    fs.writeFileSync(filename, code);
    console.log(`\n--- ${filename} ---`);
    
    // Find URL-like strings
    const urls = code.match(/(?:`|'|")https?:\/\/[^`'"]+(?:`|'|")/g) || [];
    console.log("URLs:", [...new Set(urls)]);
    
    // Find relative endpoints
    const endpoints = code.match(/(?:`|'|")\/[a-z0-9_-]+\/[^`'"]+(?:`|'|")/gi) || [];
    console.log("Endpoints:", [...new Set(endpoints)].filter(e => e.includes('api') || e.includes('watch') || e.includes('anime') || e.includes('stream') || e.includes('source') || e.includes('episode') || e.includes('info')));
    
    // Find any fetch or axios calls
    const fetches = code.match(/(?:fetch|axios)\([^)]+\)/g) || [];
    console.log("Fetches:", fetches.slice(0, 10));
    
  } catch(e) {
    console.error(e);
  }
}

async function main() {
  await fetchAndSearch('AnimeDetail-C42y3W19.js');
  await fetchAndSearch('play-mxA6gF2k.js');
  await fetchAndSearch('useAnime-BGLUHA6u.js');
}

main();
