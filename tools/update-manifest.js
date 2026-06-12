/**
 * update-manifest.js — Regenerates microsite/gallery/manifest.json from disk.
 * Scans all G*.jpg files, extracts tags from filenames, writes updated manifest.
 */
const fs = require('fs');
const path = require('path');

const GALLERY = path.resolve(__dirname, '../microsite/gallery');
const MANIFEST = path.join(GALLERY, 'manifest.json');

const files = fs.readdirSync(GALLERY)
  .filter(f => /^G\d+.*\.jpg$/i.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/^G(\d+)/)[1], 10);
    const nb = parseInt(b.match(/^G(\d+)/)[1], 10);
    return na - nb;
  });

function tagFromName(f) {
  // G0001-tag-subtag.jpg -> "tag subtag"
  const m = f.match(/^G\d+[-_](.+)\.jpg$/i);
  if (!m) return f.replace(/\.jpg$/i, '');
  return m[1].replace(/[-_]/g, ' ');
}

function categoryFromTag(tag) {
  if (/kyiv/.test(tag)) return 'Kyiv Defense';
  if (/bradley/.test(tag)) return 'Bradley Mission';
  if (/airborne/.test(tag)) return 'Airborne Assault';
  if (/urban/.test(tag)) return 'Urban Breakout';
  if (/gather/.test(tag)) return 'Gather';
  if (/expand/.test(tag)) return 'Expand';
  if (/recon/.test(tag)) return 'Recon';
  if (/defense/.test(tag)) return 'Defense';
  if (/escort/.test(tag)) return 'Escort';
  if (/infiltrate/.test(tag)) return 'Infiltrate';
  if (/clear/.test(tag)) return 'Clear Building';
  return 'Combat';
}

const entries = files.map((f, i) => {
  const num = parseInt(f.match(/^G(\d+)/)[1], 10);
  const tag = tagFromName(f);
  return {
    id: `G${String(num).padStart(4,'0')}`,
    file: f,
    tag,
    category: categoryFromTag(tag.toLowerCase()),
    index: i,
  };
});

const manifest = {
  generated: new Date().toISOString(),
  total: entries.length,
  images: entries,
};

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`✅ manifest.json updated: ${entries.length} images`);
