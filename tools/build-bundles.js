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
  // Tolerate CRLF. On a Windows checkout with autocrlf, every line ends \r,
  // the $-anchored marker regex matches nothing, members() returns [], and
  // this tool then faithfully writes an EMPTY bundle — which also destroys
  // the member list, because the manifest lives inside the bundle itself.
  // That exact sequence emptied all 13 bundles on the shared branch once.
  for (const line of txt.split('\n')) { const m = line.replace(/\r$/, '').match(MARK); if (m) out.push(m[1]); }
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
  const list = members(cur);
  // A non-empty bundle with no readable markers means WE cannot parse it —
  // never that it has no members. Writing anything in that state destroys
  // the in-band manifest. Refuse.
  if (cur.trim().length > 0 && list.length === 0) {
    console.error('  ABORT ' + f + ': bundle is non-empty but no member markers parse — refusing to touch it');
    process.exitCode = 1;
    continue;
  }
  let out = '';
  for (const name of list) {
    const src = path.join(ROOT, name);
    if (!fs.existsSync(src)) { missing.push(f + ' -> ' + name); continue; }
    out += wrap(name, fs.readFileSync(src, 'utf8').replace(/\n+$/, ''));
  }
  if (out === cur) { console.log('  same  ' + f); continue; }
  // A rebuild only refreshes file bodies; it can never legitimately halve a
  // bundle. A drastic shrink means member sources failed to resolve (wrong
  // cwd, Windows path issue, deleted files) — refuse rather than write a
  // husk to a shared branch.
  if (out.length < cur.length * 0.5) {
    console.error('  ABORT ' + f + ': rebuild would shrink ' + cur.length + ' -> ' + out.length
      + ' bytes; refusing (missing sources? wrong platform?)');
    process.exitCode = 1;
    continue;
  }
  changed++;
  const a = cur.split('\n').length, b = out.split('\n').length;
  console.log((CHECK ? '  STALE ' : '  wrote ') + f + '  (' + a + ' -> ' + b + ' lines)');
  if (!CHECK) fs.writeFileSync(p, out);
}
if (missing.length) console.log('missing sources:\n  ' + missing.join('\n  '));
console.log(changed + ' bundle(s) ' + (CHECK ? 'stale' : 'rebuilt'));
if (CHECK && changed) process.exit(1);
