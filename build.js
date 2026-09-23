/* Builds index.html (the deployable app) and preview.html (local testing).
   Run:  node build.js                                                        */
const fs = require('fs'), path = require('path');
const R = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');

const core = ['core_a.js', 'core_b.js', 'core_c.js', 'core_c2.js', 'core_d.js'].map(f => R('src/' + f)).join('');
const wild = ['wild_a.js', 'wild_b.js', 'wild_b2.js', 'wild_c.js', 'wild_d.js'].map(f => R('src/' + f)).join('');
fs.writeFileSync(path.join(__dirname, 'src/core.js'), core);
fs.writeFileSync(path.join(__dirname, 'src/wild.js'), wild);

const out = R('src/shell.html')
  .replace('/*__CORE__*/', core)
  .replace('/*__WILD__*/', wild)
  .replace('/*__APP__*/', R('src/app.js'));
fs.writeFileSync(path.join(__dirname, 'index.html'), out);

/* preview.html mirrors the wrapper the Artifact host injects, for local testing */
const pre = '<!doctype html><html><head><meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\n' +
  'body{margin:0;font:14px system-ui,sans-serif;background:#fafaf9}img{max-width:100%}[hidden]{display:none!important}</style>\n' +
  '</head><body>\n';
fs.writeFileSync(path.join(__dirname, 'preview.html'), pre + out + '\n</body></html>');
console.log('built index.html (' + out.length + ' bytes) and preview.html');
