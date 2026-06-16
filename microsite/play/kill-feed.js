/* ============================================================
 *  KILL-FEED.JS — Rolling combat log (top-right corner)
 *
 *  Intercepts HUD.notifyPickup and Enemies events to build a
 *  real-time scrolling kill feed showing:
 *    - Enemy type eliminated
 *    - Distance at time of kill
 *    - Weapon used (inferred from last-fired weapon state)
 *    - Kill streak badge if one is active
 *  Each entry fades after 5s. Max 8 entries visible.
 * ============================================================ */
var KillFeed = (function () {
  'use strict';

  var MAX_ENTRIES = 8;
  var ENTRY_TTL   = 5000; /* ms before fade starts */
  var FADE_MS     = 600;

  var _initialized = false;
  var _feedEl      = null;
  var _entries     = []; /* { el, born } */
  var _lastWeapon  = 'RIFLE';
  var _deadSet     = new WeakSet();

  /* ── Detect current weapon from HUD state ── */
  var WEAPON_LABELS = {
    'ak47': 'AK-47', 'ak-47': 'AK-47', 'ak': 'AK-47',
    'ar15': 'AR-15', 'ar-15': 'AR-15',
    'm4':  'M4A1',  'm4a1': 'M4A1',
    'sniper': 'SVD',  'svd': 'SVD',   'dragunov': 'SVD',
    'rpg':    'RPG',  'grenade': 'GRENADE', 'frag': 'GRENADE',
    'pistol': 'PM',   'pm': 'PM',
    'shotgun':'SG',   'sg12': 'SG12',
    'lmg': 'PKM',     'pkm': 'PKM',
    'smg': 'AKS-74U',
  };

  function _weaponLabel() {
    try {
      var w = window.player && window.player.weapon;
      if (w && w.name) {
        var n = w.name.toLowerCase();
        for (var k in WEAPON_LABELS) {
          if (n.indexOf(k) !== -1) return WEAPON_LABELS[k];
        }
        return w.name.toUpperCase();
      }
    } catch(e) {}
    return _lastWeapon;
  }

  /* ── Add a feed entry ─────────────────────── */
  function _addEntry(text, color, icon) {
    var el = document.createElement('div');
    el.className = 'kf-entry';
    el.style.cssText = [
      'display:flex;align-items:center;gap:6px;',
      'background:rgba(0,8,18,0.78);',
      'border-left:2px solid ' + (color || '#44aaff') + ';',
      'padding:3px 8px 3px 6px;margin-bottom:3px;',
      'font-family:monospace;font-size:10px;white-space:nowrap;',
      'border-radius:0 2px 2px 0;',
      'box-shadow:0 1px 4px rgba(0,0,0,0.4);',
      'transition:opacity ' + (FADE_MS/1000) + 's linear;',
      'opacity:1;',
    ].join('');
    el.innerHTML = '<span style="font-size:12px">' + (icon || '×') + '</span>'
      + '<span style="color:' + (color || '#ccd') + '">' + text + '</span>';

    _feedEl.insertBefore(el, _feedEl.firstChild);

    var entry = { el: el, born: Date.now() };
    _entries.unshift(entry);

    /* Trim overflow */
    while (_entries.length > MAX_ENTRIES) {
      var old = _entries.pop();
      if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
    }
  }

  /* ── Type labels ─────────────────────────── */
  var TYPE_MAP = {
    'conscript':  ['CONSCRIPT',  '#aabbcc', '✕'],
    'stormer':    ['STORMER',    '#ff8844', '✕'],
    'engineer':   ['ENGINEER',   '#44ccff', '⚙'],
    'sniper':     ['SNIPER',     '#ff4466', '◎'],
    'medic':      ['MEDIC',      '#44ff88', '✚'],
    'shielded':   ['SHIELDED',   '#cc88ff', '⬡'],
    'wagner':     ['WAGNER',     '#ff3322', '☠'],
    'spetsnaz':   ['SPETSNAZ',   '#ff6600', '★'],
    'tank':       ['TANK CREW',  '#ffcc00', '⊙'],
    'officer':    ['OFFICER',    '#ffcc44', '★'],
  };

  function _typeLabel(e) {
    if (!e) return ['ENEMY', '#ccd', '✕'];
    var n = ((e.typeCfg && e.typeCfg.name) || '').toLowerCase();
    for (var k in TYPE_MAP) {
      if (n.indexOf(k) !== -1) return TYPE_MAP[k];
    }
    return ['ENEMY', '#ccd', '✕'];
  }

  /* ── Scan for newly dead enemies each frame ─ */
  function _scanEnemies() {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      var player = window.player;
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        if (!e.dead) { _deadSet.delete(e); continue; }
        if (_deadSet.has(e)) continue;
        _deadSet.add(e);

        var tl = _typeLabel(e);
        var dist = 0;
        if (player && player.position && e.mesh.position) {
          var dx = e.mesh.position.x - player.position.x;
          var dz = e.mesh.position.z - player.position.z;
          dist = Math.round(Math.sqrt(dx*dx + dz*dz));
        }
        var weapon = _weaponLabel();
        var ksTag  = '';
        try {
          if (window.KillStreak && KillStreak.getCount) {
            var ks = KillStreak.getCount();
            if (ks >= 2) ksTag = ' <span style="color:#ffcc44">×' + ks + '</span>';
          }
        } catch(ex) {}

        _addEntry(
          tl[0] + '  ' + weapon + '  <span style="color:rgba(150,180,220,0.6)">' + dist + 'u</span>' + ksTag,
          tl[1],
          tl[2]
        );
        _lastWeapon = weapon;
      }
    } catch(err) {}
  }

  /* ── Intercept friendly-fire / special kills via HUD ─ */
  var _origNotify = null;
  function _hookHUD() {
    if (typeof HUD === 'undefined' || !HUD.notifyPickup || _origNotify) return;
    _origNotify = HUD.notifyPickup;
    HUD.notifyPickup = function (msg, color) {
      _origNotify.call(HUD, msg, color);
      /* Vehicle kills */
      if (typeof msg === 'string') {
        if (msg.indexOf('VEHICLE') !== -1 || msg.indexOf('DESTROYED') !== -1) {
          _addEntry('VEHICLE DESTROYED  ' + _weaponLabel(), '#ff8800', '💥');
        }
        if (msg.indexOf('AIRSTRIKE') !== -1) {
          _addEntry('AIRSTRIKE KILLS  ' + _weaponLabel(), '#ff4400', '✈');
        }
      }
    };
  }

  /* ── Fade TTL loop ──────────────────────── */
  var _lastScan = 0;
  function _tick(ts) {
    requestAnimationFrame(_tick);

    /* Scan every 100ms */
    if (ts - _lastScan > 100) {
      _lastScan = ts;
      _scanEnemies();
      _hookHUD();
    }

    /* Fade out old entries */
    var now = Date.now();
    for (var i = _entries.length - 1; i >= 0; i--) {
      var age = now - _entries[i].born;
      if (age > ENTRY_TTL + FADE_MS) {
        var old = _entries.splice(i, 1)[0];
        if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
      } else if (age > ENTRY_TTL) {
        _entries[i].el.style.opacity = String(1 - (age - ENTRY_TTL) / FADE_MS);
      }
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    _feedEl = document.createElement('div');
    _feedEl.id = 'kill-feed';
    _feedEl.style.cssText = [
      'position:fixed;top:44px;right:10px;',
      'z-index:210;pointer-events:none;',
      'display:flex;flex-direction:column;align-items:flex-end;',
      'max-width:280px;',
    ].join('');
    document.body.appendChild(_feedEl);

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.KillFeed = KillFeed;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillFeed.init(); });
} else {
  KillFeed.init();
}
