/* ============================================================
 *  DAMAGE-NUMBERS.JS — Floating damage text (passive)
 *
 *  Tracks every enemy's HP each frame via WeakMap. On any HP
 *  drop, projects the enemy's 3D position to screen coords
 *  (camera.project) and spawns a rising div showing the damage.
 *
 *  Color tiers:
 *    white  — < 50 dmg (normal hit)
 *    orange — 50-149 dmg (heavy hit)
 *    red    — ≥ 150 dmg (critical / power weapon)
 *    gold   — if enemy died this hit (LETHAL)
 *
 *  Numbers rise 55px and fade over 0.70s via CSS animation.
 *  Max 25 active floaters (oldest removed on overflow).
 * ============================================================ */
var DamageNumbers = (function () {
  'use strict';

  var MAX_FLOATERS  = 25;
  var ANIM_DUR      = 0.70;

  var _prevHp       = new WeakMap();
  var _init         = false;
  var _lastTs       = 0;
  var _cam          = null;
  var _floaters     = [];   /* DOM elements currently animating */
  var _style        = null;

  /* ── Inject keyframe CSS ───────────────────── */
  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes dnRise{',
        'from{transform:translate(-50%,0);opacity:1;}',
        'to  {transform:translate(-50%,-55px);opacity:0;}',
      '}',
      '.dn-num{',
        'position:fixed;pointer-events:none;z-index:500;',
        'font-family:"Courier New",monospace;font-weight:bold;',
        'font-size:13px;letter-spacing:0.08em;',
        'text-shadow:0 1px 4px rgba(0,0,0,0.85);',
        'animation:dnRise ' + ANIM_DUR + 's ease-out forwards;',
        'white-space:nowrap;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  /* ── Get (or cache) the camera ─────────────── */
  function _getCamera() {
    if (!_cam) {
      try { _cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  /* ── Project 3D world pos → screen px ──────── */
  function _toScreen(wx, wy, wz) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    try {
      var v = new THREE.Vector3(wx, wy, wz);
      v.project(cam);
      /* v.z > 1 means behind camera */
      if (v.z > 1) return null;
      var sx = (v.x * 0.5 + 0.5) * window.innerWidth;
      var sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
      /* Clamp to viewport */
      if (sx < 20 || sx > window.innerWidth - 20) return null;
      if (sy < 10 || sy > window.innerHeight - 10) return null;
      return { x: sx, y: sy };
    } catch (e) { return null; }
  }

  /* ── Spawn a floating number ───────────────── */
  function _spawn(damage, killed, wx, wy, wz) {
    var sc = _toScreen(wx, wy + 1.8, wz);
    if (!sc) return;

    /* Evict oldest if over cap */
    if (_floaters.length >= MAX_FLOATERS) {
      var old = _floaters.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }

    var el   = document.createElement('div');
    el.className = 'dn-num';

    /* Color + text */
    var text  = Math.round(damage).toString();
    var color;
    if (killed) {
      text  = '★ ' + text;
      color = '#ffdd00';
    } else if (damage >= 150) {
      color = '#ff4444';
    } else if (damage >= 50) {
      color = '#ff9933';
    } else {
      color = '#ffffff';
    }
    el.style.color = color;
    el.textContent = text;

    /* Add slight X jitter so stacked hits don't overlap */
    var jitterX = (Math.random() - 0.5) * 30;
    el.style.left = (sc.x + jitterX) + 'px';
    el.style.top  = sc.y + 'px';

    /* Slightly larger for big hits */
    if (damage >= 150) el.style.fontSize = '16px';
    if (killed)        el.style.fontSize = '15px';

    document.body.appendChild(el);
    _floaters.push(el);

    /* Auto-remove after animation */
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      var idx = _floaters.indexOf(el);
      if (idx >= 0) _floaters.splice(idx, 1);
    }, ANIM_DUR * 1000 + 50);
  }

  /* ── rAF tick ──────────────────────────────── */
  var _frameN = 0;
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Only scan enemies every 2 frames — plenty for 60fps visual */
    if (_frameN % 2 !== 0) return;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;

        var curHp  = e.hp !== undefined ? e.hp : null;
        if (curHp === null) continue;

        var prevHp = _prevHp.has(e) ? _prevHp.get(e) : curHp;
        var drop   = prevHp - curHp;

        if (drop >= 1) {
          var killed = (curHp <= 0 && prevHp > 0);
          _spawn(drop, killed, e.mesh.position.x, e.mesh.position.y, e.mesh.position.z);
        }

        _prevHp.set(e, curHp);
      }
    } catch (err) {}
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.DamageNumbers = DamageNumbers;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DamageNumbers.init(); });
} else {
  DamageNumbers.init();
}
