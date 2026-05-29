const fs = require('fs');
const code = fs.readFileSync('streamxtv.js', 'utf8');

const regex = /(?:'|")[^'"]+\.js(?:'|")/g;
const matches = code.match(regex) || [];
console.log("JS Chunks:", [...new Set(matches)].join('\n'));
