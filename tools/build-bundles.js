// Regenerates bundles/bundle-*.js from the root-level source files.
//
// index.html loads ~14 concatenated bundles for the ~1000 side modules (only
// the core files are <script>-ed individually). There was no build step in the
// repo, so editing a root .js that lives in a bundle changed nothing in the
// running game. This reconstructs each bundle from the member list recorded in
// its own "/* === name.js === */" markers, so membership and order are
// preserved exactly; only the file bodies are refreshed.
//
// Usage: node tools/build-bundles.js [--check]
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'bundles');
const CHECK = process.argv.includes('--check');
const MARK = /^\/\* === (.+?) === \*\/$/;

function members(txt) {
  const out = [];
  for (const line of txt.split('\n')) { const m = line.match(MARK); if (m) out.push(m[1]); }
  return out;
}
// Each module is wrapped so one broken file cannot take the whole bundle down.
function wrap(name, body) {
  return '/* === ' + name + ' === */\ntry {\n;\n' + body + '\n;\n} catch(_e){ if(window.console&&console.warn)console.warn("mod fail '
    + name + '",_e&&_e.message); }\n';
}

let changed = 0, missing = [];
for (const f of fs.readdirSync(DIR).filter(n => /^bundle-\d+\.js$/.test(n)).sort()) {
  const p = path.join(DIR, f);
  const cur = fs.readFileSync(p, 'utf8');
  let out = '';
  for (const name of members(cur)) {
    const src = path.join(ROOT, name);
    if (!fs.existsSync(src)) { missing.push(f + ' -> ' + name); continue; }
    out += wrap(name, fs.readFileSync(src, 'utf8').replace(/\n+$/, ''));
  }
  if (out === cur) { console.log('  same  ' + f); continue; }
  changed++;
  const a = cur.split('\n').length, b = out.split('\n').length;
  console.log((CHECK ? '  STALE ' : '  wrote ') + f + '  (' + a + ' -> ' + b + ' lines)');
  if (!CHECK) fs.writeFileSync(p, out);
}
if (missing.length) console.log('missing sources:\n  ' + missing.join('\n  '));
console.log(changed + ' bundle(s) ' + (CHECK ? 'stale' : 'rebuilt'));
if (CHECK && changed) process.exit(1);
