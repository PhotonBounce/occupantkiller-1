/* ============================================================
 *  CONTROLS-HUD.JS — Tactical key-bindings reference panel
 *
 *  Tab key toggles a full-screen overlay listing all controls.
 *  Groups: Movement, Combat, Tactical Equipment, Support, HUD.
 *  Auto-dismisses if the game is shooting / player is moving.
 * ============================================================ */
var ControlsHUD = (function () {
  'use strict';

  var _initialized = false;
  var _overlay     = null;
  var _visible     = false;

  var CONTROLS = [
    { group: 'MOVEMENT',
      keys: [
        ['W / A / S / D',   'Move'],
        ['Mouse',           'Look / aim'],
        ['Shift',           'Sprint'],
        ['Space',           'Jump'],
      ]
    },
    { group: 'COMBAT',
      keys: [
        ['LMB',             'Fire'],
        ['RMB',             'Aim down sights'],
        ['R',               'Reload'],
        ['G',               'Throw grenade'],
        ['F',               'Silent takedown (backstab)'],
        ['Alt+Z  (hold)',   'Binoculars — mark enemies'],
      ]
    },
    { group: 'TACTICAL EQUIPMENT',
      keys: [
        [';',               'Smoke grenade (3 stock)'],
        ['Alt+H',           'Field medic pack (2 stock)'],
        ["'",               "Place Claymore mine (2 stock)"],
        [']',               'Flashbang grenade — stuns + blinds (2 stock)'],
      ]
    },
    { group: 'SUPPORT STRIKES',
      keys: [
        ['F5',              'CAS airstrike — 10-bomb run (1 per wave)'],
        ['F6',              'Napalm strike — 10 pods walk 60u ahead, 3.5s burn zones (1 per wave)'],
        ['F7',              'Incendiary rounds — 8 shots ignite targets + fire DOT (2 stock)'],
        ['Alt+X',           'Lancet FPV drone — autonomous homing (1 per wave)'],
        ['F8',              'Recon UAV — thermal scout, marks enemies on minimap (1 per wave)'],
        ['[',               'Breach & Clear — 2.5s cinematic slow-mo + enemy stagger (2 stock)'],
        ['Alt+T',           'Place gun turret — auto-targets enemies in 28u (2 max, 1 per wave)'],
      ]
    },
    { group: 'HUD & VISION',
      keys: [
        ['\\',              'Toggle tactical minimap'],
        ['M',               'Deploy mortar (top-down aim cam)'],
        ['Alt+N',           'Night vision goggles (toggle)'],
        ['/',               'This controls panel'],
        ['ESC / Enter',     'Dismiss overlays'],
      ]
    },
    { group: 'SQUAD & SURVIVAL',
      keys: [
        ['Alt+D',           'Supply drop — parachute crate with random bonus (HP/ammo/stock) (1 per wave)'],
        ['Alt+S',           'Call in VOLKOV — AI squadmate follows + fights (1 per wave)'],
        ['Alt+A',           'Equip armor plate — absorbs 75 HP (2 stock, 8s CD)'],
        ['Alt+E',           'Signal flare — 30s illumination, boosts enemy detection'],
        ['Alt+G',           'OVERKILL — activate when kill meter full: ×3 damage for 3.5s'],
        ['F9',              'Ghost camo — 10s active invisibility, enemies lose target lock (1 per wave)'],
        ['Alt+L',           'Lightning strike — 300 dmg bolt on aimed enemy + chain ×2 (1 per wave)'],
        ['Alt+B',           'Black hole — 6s singularity pulls enemies to core, 20 dmg/s (1 per wave)'],
        ['Alt+J',           'Time bomb — 8s fuse charge, 6u AOE 200 dmg on detonation (2 per wave)'],
        ['Alt+F',           'Force blast — 10u shockwave knocks enemies back 4.5u + 50 dmg (2/wave, 18s CD)'],
        ['Alt+M',           'Target painter — mark enemy for ×2 damage for 8s (2 per wave)'],
      ]
    },
    { group: 'VEHICLES',
      keys: [
        ['B',               'Mount / dismount vehicle'],
        ['LMB (mounted)',   'Primary weapon (25mm / main gun)'],
        ['RMB (mounted)',   'Coax / secondary weapon'],
      ]
    },
    { group: 'AIRDROP',
      keys: [
        ['E  (near crate)', 'Collect airdrop (spawns after wave clear)'],
      ]
    },
  ];

  function _build() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes chFadeIn{from{opacity:0}to{opacity:1}}',
      '#ch-overlay{',
        'display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:600;',
        'background:rgba(0,6,14,0.94);overflow-y:auto;',
        'animation:chFadeIn 0.2s ease-out;',
        'font-family:monospace;color:#ccd;}',
      '#ch-inner{max-width:780px;margin:0 auto;padding:32px 24px 40px;}',
      '#ch-title{color:#44aaff;font-size:14px;font-weight:bold;',
        'letter-spacing:0.25em;margin-bottom:4px;}',
      '#ch-sub{color:rgba(68,170,255,0.4);font-size:10px;letter-spacing:0.15em;margin-bottom:24px;}',
      '.ch-group{margin-bottom:18px;}',
      '.ch-group-name{color:#44aaff;font-size:9px;letter-spacing:0.25em;',
        'margin-bottom:6px;opacity:0.7;}',
      '.ch-row{display:flex;align-items:baseline;padding:3px 0;',
        'border-bottom:1px solid rgba(68,170,255,0.05);}',
      '.ch-key{color:#ffcc44;font-size:12px;min-width:180px;flex-shrink:0;}',
      '.ch-desc{color:#aabbd0;font-size:12px;}',
      '#ch-close{display:block;text-align:center;margin-top:24px;',
        'color:rgba(68,170,255,0.4);font-size:11px;letter-spacing:0.15em;cursor:pointer;}',
      '#ch-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 32px;}',
      '@media(max-width:600px){#ch-grid{grid-template-columns:1fr;}}',
    ].join('');
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id = 'ch-overlay';

    var groupsHTML = CONTROLS.map(function (g) {
      var rows = g.keys.map(function (k) {
        return '<div class="ch-row"><span class="ch-key">' + k[0] + '</span><span class="ch-desc">— ' + k[1] + '</span></div>';
      }).join('');
      return '<div class="ch-group"><div class="ch-group-name">▌ ' + g.group + '</div>' + rows + '</div>';
    }).join('');

    el.innerHTML = [
      '<div id="ch-inner">',
        '<div id="ch-title">CONTROLS REFERENCE</div>',
        '<div id="ch-sub">OCCUPANT KILLER · TACTICAL EDITION</div>',
        '<div id="ch-grid">' + groupsHTML + '</div>',
        '<div id="ch-close">[ / / ESC / CLICK TO CLOSE ]</div>',
      '</div>',
    ].join('');

    el.addEventListener('click', _hide);
    document.body.appendChild(el);
    return el;
  }

  function _show() {
    if (!_overlay) _overlay = _build();
    _overlay.style.display = 'block';
    _visible = true;
  }

  function _hide() {
    if (_overlay) _overlay.style.display = 'none';
    _visible = false;
  }

  function init() {
    if (_initialized) return;
    _initialized = true;

    _overlay = _build();

    window.addEventListener('keydown', function (e) {
      if (e.code === 'Slash') {
        e.preventDefault();
        if (_visible) _hide(); else _show();
      }
      if ((e.key === 'Escape') && _visible) { _hide(); }
    });
  }

  return { init: init, show: _show, hide: _hide };
})();

window.ControlsHUD = ControlsHUD;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ControlsHUD.init(); });
} else {
  ControlsHUD.init();
}
