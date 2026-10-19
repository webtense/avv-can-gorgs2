const fs = require('fs');
const pkg = require('../package.json');
const buildId = `${pkg.version}-${process.env.GITHUB_SHA?.substring(0, 7) || 'dev'}`;
const swTemplate = fs.readFileSync('public/sw.template.js', 'utf8');
const swContent = swTemplate.replace('__CACHE_NAME__', `cache-${buildId}`);
fs.writeFileSync('public/sw.js', swContent);
console.log(`Service worker generated: cache-${buildId}`);
