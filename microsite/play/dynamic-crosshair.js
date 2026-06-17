/* ============================================================
 *  DYNAMIC-CROSSHAIR.JS — Responsive canvas crosshair (passive)
 *
 *  Replaces the static HTML crosshair (#crosshair / .crosshair)
 *  with a canvas one that responds to gameplay:
 *
 *  - 4-line gap crosshair whose gap size grows with player movement
 *    and jump-kicks on each shot fired (recoil spread).
 *  - Hit-flash: turns bright + briefly scales on enemy kill.
 *  - Ammo ring: a thin arc around center reflects clip% (inner ring).
 *  - Weapon colour: rifle=cyan, shotgun=amber, sniper=red, melee=grey.
 *  - Dot: solid center dot, hidden when gap > threshold (ADS feel).
 *  - Smooth spring interpolation on all dynamic values.
 * ============================================================ */
var DynamicCrosshair = (function () {
  'use strict';

  /* ---- tunables ---- */
  var BASE_GAP   = 6;    /* px gap from center at rest */
  var MAX_SPREAD = 28;   /* max extra gap from movement/recoil */
  var ARM_LEN    = 9;    /* px length of each arm */
  var LINE_W     = 1.8;  /* arm line width */
  var DOT_R      = 1.8;  /* center dot radius */
  var RING_R     = 14;   /* ammo arc radius from center */
  var RING_W     = 2.2;  /* ammo arc stroke width */

  var SPRING_K   = 12;   /* spread spring stiffness */
  var SPRING_D   = 0.62; /* spread spring damping */

  /* ---- state ---- */
  var _canvas    = null;
  var _ctx       = null;
  var _init      = false;
  var _frameN    = 0;
  var _lastTs    = 0;

  var _spread    = 0;
  var _spreadV   = 0;   /* velocity for spring */
  var _spreadT   = 0;   /* target spread */

  var _hitFlash  = 0;   /* 0‒1 hit flash intensity, decays */
  var _hitScale  = 1.0; /* scale on kill flash */

  var _prevPos   = null;
  var _prevClip  = null;
  var _prevHp    = new WeakMap();
  var _counted   = new WeakSet();

  var COLORS = {
    RIFLE:    'rgba(80, 220, 180, ALPHA)',
    SHOTGUN:  'rgba(255, 160, 50, ALPHA)',
    SNIPER:   'rgba(255, 80, 80, ALPHA)',
    LAUNCHER: 'rgba(255, 220, 50, ALPHA)',
    MELEE:    'rgba(160, 160, 170, ALPHA)',
    DEFAULT:  'rgba(200, 220, 200, ALPHA)',
  };

  function _getWeaponColor(alpha) {
    var col = COLORS.DEFAULT;
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getCurrentType) {
        var t = (Weapons.getCurrentType() || '').toUpperCase();
        if (t.indexOf('SHOTGUN') >= 0)      col = COLORS.SHOTGUN;
        else if (t.indexOf('SNIPER') >= 0)  col = COLORS.SNIPER;
        else if (t.indexOf('LAUNCH') >= 0 || t.indexOf('RPG') >= 0 || t.indexOf('GRENADE') >= 0) col = COLORS.LAUNCHER;
        else if (t.indexOf('MELEE') >= 0 || t.indexOf('KNIFE') >= 0 || t.indexOf('AXE') >= 0)  col = COLORS.MELEE;
        else                                col = COLORS.RIFLE;
      }
    } catch (e) {}
    return col.replace('ALPHA', alpha.toFixed(2));
  }

  function _getClipRatio() {
    try {
      if (typeof Weapons === 'undefined' || !Weapons.getState || !Weapons.getCurrent) return 1;
      var st  = Weapons.getState();
      var cur = Weapons.getCurrent();
      if (!st || !cur || !cur.clipSize) return 1;
      return Math.max(0, Math.min(1, st.clip / cur.clipSize));
    } catch (e) { return 1; }
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:450;',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);

    /* Hide any existing static crosshair */
    _hideStatic();
  }

  function _hideStatic() {
    /* Try common IDs/classes the game engine might use */
    var ids = ['crosshair', 'hud-crosshair', 'ch', 'reticle'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    var cls = document.querySelectorAll('.crosshair, .reticle, .hud-crosshair');
    for (var i = 0; i < cls.length; i++) cls[i].style.display = 'none';
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _draw(ts) {
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    var W = _canvas.width;
    var H = _canvas.height;
    var CX = W / 2;
    var CY = H / 2;
    var ctx = _ctx;

    ctx.clearRect(0, 0, W, H);

    /* ---- movement spread ---- */
    var moveDelta = 0;
    try {
      if (window.player && window.player.position) {
        var pp = window.player.position;
        if (_prevPos) {
          var dx = pp.x - _prevPos.x;
          var dz = pp.z - _prevPos.z;
          moveDelta = Math.sqrt(dx * dx + dz * dz) / dt;
        }
        _prevPos = { x: pp.x, z: pp.z };
      }
    } catch (e) {}

    var moveSpread = Math.min(MAX_SPREAD * 0.6, moveDelta * 0.7);

    /* ---- shot detection → recoil kick ---- */
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getState) {
        var st = Weapons.getState();
        var isMelee = (typeof Weapons.getCurrentType === 'function' && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
        if (!isMelee && _prevClip !== null && st.clip < _prevClip) {
          var shots = _prevClip - st.clip;
          if (shots >= 1 && shots <= 5) {
            _spreadV += shots * 18;
          }
        }
        _prevClip = st ? st.clip : _prevClip;
      }
    } catch (e) {}

    /* ---- kill flash ---- */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;
          var cur  = e.hp !== undefined ? e.hp : null;
          if (cur === null) continue;
          var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
          if (cur <= 0 && prev > 0 && !_counted.has(e)) {
            _counted.add(e);
            _hitFlash = 1.0;
            _hitScale = 1.35;
          }
          _prevHp.set(e, cur);
        }
      }
    } catch (er) {}

    /* ---- spring physics ---- */
    _spreadT = moveSpread;
    var force = (_spreadT - _spread) * SPRING_K - _spreadV * SPRING_D * 2 * Math.sqrt(SPRING_K);
    _spreadV += force * dt;
    _spread  += _spreadV * dt;
    _spread   = Math.max(0, Math.min(MAX_SPREAD, _spread));

    /* ---- decay ---- */
    _hitFlash  = Math.max(0, _hitFlash - dt * 4.5);
    _hitScale  = 1.0 + (_hitScale - 1.0) * Math.max(0, 1 - dt * 8);
    if (_hitScale < 1.001) _hitScale = 1.0;

    /* ---- render ---- */
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(_hitScale, _hitScale);

    var gap     = BASE_GAP + _spread;
    var alpha   = 0.82 + _hitFlash * 0.18;
    var stroke  = _hitFlash > 0.01
      ? 'rgba(255, 80, 80, ' + alpha.toFixed(2) + ')'
      : _getWeaponColor(alpha);

    /* Arms */
    ctx.strokeStyle = stroke;
    ctx.lineWidth   = LINE_W;
    ctx.lineCap     = 'round';
    ctx.shadowColor = stroke;
    ctx.shadowBlur  = _hitFlash > 0.01 ? 10 : 4;
    ctx.beginPath();
    /* up */    ctx.moveTo(0, -(gap)); ctx.lineTo(0, -(gap + ARM_LEN));
    /* down */  ctx.moveTo(0,  (gap)); ctx.lineTo(0,  (gap + ARM_LEN));
    /* left */  ctx.moveTo(-(gap), 0); ctx.lineTo(-(gap + ARM_LEN), 0);
    /* right */ ctx.moveTo( (gap), 0); ctx.lineTo( (gap + ARM_LEN), 0);
    ctx.stroke();

    /* Center dot (hide when very spread) */
    if (_spread < MAX_SPREAD * 0.6) {
      ctx.beginPath();
      ctx.arc(0, 0, DOT_R, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.shadowBlur = 4;
      ctx.fill();
    }

    /* Ammo ring arc */
    var clipRatio = _getClipRatio();
    if (clipRatio < 1) {
      var arcEnd  = -Math.PI / 2 + clipRatio * 2 * Math.PI;
      var ringCol = clipRatio <= 0.2
        ? 'rgba(255, 60, 60, 0.75)'
        : 'rgba(80, 200, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, RING_R, -Math.PI / 2, arcEnd);
      ctx.strokeStyle = ringCol;
      ctx.lineWidth   = RING_W;
      ctx.shadowBlur  = 0;
      ctx.stroke();
    }

    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (!_ctx) return;
    _draw(ts);
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.DynamicCrosshair = DynamicCrosshair;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DynamicCrosshair.init(); });
} else {
  DynamicCrosshair.init();
}