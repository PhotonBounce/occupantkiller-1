/* ============================================================
 *  NPC-BARK-LABEL.JS — enemy tactical voice barks (passive)
 *
 *  When an enemy NPC is near the player and alive, it periodically
 *  "shouts" a contextual bark label at its 2D screen position.
 *
 *  Bark pools by type:
 *    SNIPER    — "EYES ON!", "СНАЙПЕР!", "STATIONARY TARGET"
 *    HEAVY     — "SUPPRESSING!", "FIRE!", "HEAVY INBOUND!"
 *    TANK/MECH — "ARMOR DETECTED", "WEAPONS HOT", "ENGAGING"
 *    SPETSNAZ  — "СПЕЦНАЗ!", "BREACH!", "ДВИГАЙСЯ!"
 *    WAGNER    — "КОНТРАКТ!", "ЗА ВАГНЕР!", "ASSAULT!"
 *    default   — "CONTACT!", "НА ПОЗИЦИЮ!", "FLANKING!", "COVER!"
 *
 *  Each enemy barks at most once per BARK_COOL=8s.
 *  Labels fade out over 1.2s. MAX_BARKS active at once = 5.
 *  Canvas-free (CSS absolute divs). z-index 454.
 *  Passive — no keybind.
 * ============================================================ */
var NpcBarkLabel = (function () {
  'use strict';

  var BARK_COOL  = 8.0;    /* seconds between barks per enemy */
  var BARK_DIST  = 45;     /* world units — only enemies within this range bark */
  var BARK_LIFE  = 1.2;    /* display duration per label */
  var MAX_BARKS  = 5;
  var CHECK_INT  = 90;     /* frame interval between bark checks per enemy */

  var BARKS = {
    SNIPER:   ['EYES ON!', 'СНАЙПЕР!', 'STATIONARY TARGET', 'I SEE YOU'],
    HEAVY:    ['SUPPRESSING!', 'FIRE!', 'HEAVY INBOUND!', 'UNLOAD!'],
    TANK:     ['ARMOR DETECTED', 'WEAPONS HOT', 'ENGAGING'],
    MECH:     ['MECH ONLINE', 'WEAPONS HOT', 'ENGAGING'],
    SPETSNAZ: ['СПЕЦНАЗ!', 'BREACH!', 'ДВИГАЙСЯ!', 'СНЯТЬ!'],
    WAGNER:   ['КОНТРАКТ!', 'ЗА ВАГНЕР!', 'ASSAULT!', 'ОГОНЬ!'],
    ENGINEER: ['МИНИРУЕМ!', 'FORTIFY!', 'HOLD LINE!'],
    STORMER:  ['CHARGE!', 'RUSH THEM!', 'ВПЕРЁД!'],
    default:  ['CONTACT!', 'НА ПОЗИЦИЮ!', 'FLANKING!', 'COVER!', 'FIRE!', 'ENGAGE!']
  };

  var _pool   = [];       /* { el, life } active label divs */
  var _barkTs = new WeakMap();   /* enemy → last bark timestamp */
  var _init   = false;
  var _lastTs = 0;
  var _frameN = 0;
  var _cam    = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildStyle() {
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes nbFade{',
        '0%{opacity:0;transform:translateY(0)}',
        '12%{opacity:1;transform:translateY(-4px)}',
        '70%{opacity:1;transform:translateY(-8px)}',
        '100%{opacity:0;transform:translateY(-14px)}',
      '}',
      '.nb-label{',
        'position:fixed;',
        'font-family:"Courier New",monospace;',
        'font-size:8px;font-weight:bold;',
        'letter-spacing:2px;',
        'color:rgba(220,200,80,1);',
        'text-shadow:0 0 8px rgba(200,160,0,0.9);',
        'pointer-events:none;z-index:454;',
        'white-space:nowrap;',
        'transform:translateY(0);',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  function _bark(e, cam) {
    var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 1.6, e.mesh.position.z);
    v.project(cam);
    if (v.z > 1) return;
    var sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    var sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
    if (sx < 0 || sx > window.innerWidth || sy < 0 || sy > window.innerHeight) return;

    var type    = (e.type || '').toUpperCase();
    var pool    = BARKS[type] || BARKS.default;
    var text    = pool[Math.floor(Math.random() * pool.length)];

    var el = document.createElement('div');
    el.className = 'nb-label';
    el.textContent = text;
    el.style.left = Math.round(sx - 30) + 'px';
    el.style.top  = Math.round(sy - 20) + 'px';
    el.style.animation = 'nbFade ' + BARK_LIFE + 's ease forwards';
    document.body.appendChild(el);

    _pool.push({ el: el, life: BARK_LIFE });

    /* auto-remove when too many */
    while (_pool.length > MAX_BARKS) {
      var old = _pool.shift();
      if (old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Age and clean pool */
    for (var j = _pool.length - 1; j >= 0; j--) {
      _pool[j].life -= dt;
      if (_pool[j].life <= 0) {
        var el = _pool[j].el;
        if (el && el.parentNode) el.parentNode.removeChild(el);
        _pool.splice(j, 1);
      }
    }

    /* Bark check every CHECK_INT frames (~5fps) */
    if (_frameN % CHECK_INT !== 0) return;
    if (_pool.length >= MAX_BARKS) return;

    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      if (!window.player || !window.player.position) return;
      var pp  = window.player.position;
      var all = Enemies.getAll();

      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.hp <= 0) continue;

        var dx = e.mesh.position.x - pp.x;
        var dz = e.mesh.position.z - pp.z;
        if (dx*dx + dz*dz > BARK_DIST * BARK_DIST) continue;

        var last = _barkTs.has(e) ? _barkTs.get(e) : 0;
        if (now - last < BARK_COOL) continue;

        /* Stagger barks — roll per-enemy */
        if (Math.random() > 0.35) continue;

        _barkTs.set(e, now);
        _bark(e, cam);
        if (_pool.length >= MAX_BARKS) break;
      }
    } catch (er) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.NpcBarkLabel = NpcBarkLabel;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { NpcBarkLabel.init(); });
} else {
  NpcBarkLabel.init();
}
