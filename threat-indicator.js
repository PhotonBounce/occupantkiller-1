/* ============================================================
 *  THREAT-INDICATOR.JS — Directional damage indicator
 *
 *  Monitors player.hp. When HP drops, finds the nearest hostile
 *  enemy and shows a red arc sector at the screen edge pointing
 *  toward the threat — same mechanic as CoD's hit indicator.
 *
 *  Renders as a canvas arc at screen edge, fades over 2s.
 *  Multiple simultaneous threats each show their own arc.
 *  No key bindings. Fully automatic.
 * ============================================================ */
var ThreatIndicator = (function () {
  'use strict';

  var FADE_TTL  = 2000;   /* ms */
  var ARC_HALF  = 0.28;   /* half arc width in radians */
  var INDICATORS = [];    /* { angle, born, intensity } */

  var _initialized = false;
  var _canvas      = null;
  var _ctx         = null;
  var _lastHp      = -1;
  var _lastTs      = 0;
  var _frameN      = 0;

  /* ── Find likely shooter ─────────────────── */
  function _findShooter() {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return null;
      var player = window.player;
      if (!player || !player.position) return null;
      var all = Enemies.getAll();
      var best = null, bestScore = Infinity;
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.dead) continue;
        var dx = e.mesh.position.x - player.position.x;
        var dz = e.mesh.position.z - player.position.z;
        var d  = Math.sqrt(dx*dx + dz*dz);
        /* Prefer close enemies that have ranged capability */
        var score = d;
        if (e.typeCfg && e.typeCfg.rangedRange && d < e.typeCfg.rangedRange * 1.3) score *= 0.5;
        if (score < bestScore) { bestScore = score; best = { x: dx, z: dz, dist: d }; }
      }
      return best;
    } catch(e){ return null; }
  }

  /* ── World direction → screen angle ─────── */
  function _worldToScreenAngle(dx, dz) {
    var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
    if (!cam) return 0;
    /* Camera forward direction on XZ plane */
    var camDir = new THREE.Vector3();
    cam.getWorldDirection(camDir);
    var camAngle = Math.atan2(camDir.x, camDir.z);
    /* Attacker angle in world */
    var worldAngle = Math.atan2(dx, dz);
    /* Relative angle (screen-space: 0=top, CW positive) */
    return worldAngle - camAngle;
  }

  /* ── Add a new indicator ─────────────────── */
  function _addIndicator(dx, dz) {
    var angle = _worldToScreenAngle(dx, dz);
    /* Merge if close to existing one */
    for (var i = 0; i < INDICATORS.length; i++) {
      var diff = Math.abs(((INDICATORS[i].angle - angle) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      if (diff < ARC_HALF * 2) {
        INDICATORS[i].born = Date.now();
        INDICATORS[i].angle = angle;
        return;
      }
    }
    INDICATORS.push({ angle: angle, born: Date.now() });
    if (INDICATORS.length > 6) INDICATORS.shift();
  }

  /* ── Draw indicators ─────────────────────── */
  function _draw() {
    var w = window.innerWidth, h = window.innerHeight;
    if (_canvas.width !== w || _canvas.height !== h) {
      _canvas.width = w; _canvas.height = h;
    }
    var ctx = _ctx;
    ctx.clearRect(0, 0, w, h);

    var cx = w / 2, cy = h / 2;
    var R  = Math.min(w, h) * 0.32; /* radius from center */
    var now = Date.now();

    for (var i = INDICATORS.length - 1; i >= 0; i--) {
      var ind = INDICATORS[i];
      var age = now - ind.born;
      if (age > FADE_TTL) { INDICATORS.splice(i, 1); continue; }

      var alpha = (1 - age / FADE_TTL);
      alpha = alpha * alpha; /* ease in */

      /* Update angle to match current camera */
      var player = window.player;
      if (player && player.position) {
        try {
          /* Recompute from stored world angle each frame */
          var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
          if (cam) {
            var cd = new THREE.Vector3();
            cam.getWorldDirection(cd);
            var camA = Math.atan2(cd.x, cd.z);
            /* ind._worldAngle was stored at creation, subtract current cam */
            if (typeof ind._worldAngle !== 'undefined') {
              ind.angle = ind._worldAngle - camA;
            }
          }
        } catch(ex){}
      }

      var a = ind.angle;

      /* Arc at edge of screen circle */
      ctx.save();
      ctx.translate(cx, cy);

      /* Outer glow */
      ctx.beginPath();
      ctx.arc(0, 0, R + 8, a - ARC_HALF - 0.04, a + ARC_HALF + 0.04);
      ctx.lineWidth = 22;
      ctx.strokeStyle = 'rgba(255,30,0,' + (alpha * 0.25) + ')';
      ctx.stroke();

      /* Main arc */
      ctx.beginPath();
      ctx.arc(0, 0, R, a - ARC_HALF, a + ARC_HALF);
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(255,30,0,' + (alpha * 0.85) + ')';
      ctx.stroke();

      /* Inner bright line */
      ctx.beginPath();
      ctx.arc(0, 0, R - 5, a - ARC_HALF * 0.6, a + ARC_HALF * 0.6);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255,180,100,' + (alpha * 0.9) + ')';
      ctx.stroke();

      /* Arrow tip pointing toward threat */
      var tip = R - 18;
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * (tip + 12), -Math.cos(a) * (tip + 12));
      ctx.lineTo(Math.sin(a - 0.12) * tip,  -Math.cos(a - 0.12) * tip);
      ctx.lineTo(Math.sin(a + 0.12) * tip,  -Math.cos(a + 0.12) * tip);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,60,0,' + (alpha * 0.9) + ')';
      ctx.fill();

      ctx.restore();
    }
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Check HP drop every 3 frames */
    if (_frameN % 3 === 0) {
      try {
        var player = window.player;
        if (player) {
          var hp = player.hp;
          if (_lastHp > 0 && hp < _lastHp) {
            /* HP dropped — find shooter */
            var shooter = _findShooter();
            if (shooter) {
              var worldAngle = Math.atan2(shooter.x, shooter.z);
              /* Compute current camera angle and derive screen-space */
              var ind = { angle: 0, born: Date.now(), _worldAngle: worldAngle };
              INDICATORS.push(ind);
              if (INDICATORS.length > 6) INDICATORS.shift();
            }
          }
          _lastHp = hp;
        }
      } catch(e) {}
    }

    /* Draw */
    try { _draw(); } catch(e){}
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    _canvas = document.createElement('canvas');
    _canvas.id = 'threat-canvas';
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:108;',
    ].join('');
    _ctx = _canvas.getContext('2d');
    document.body.appendChild(_canvas);

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ThreatIndicator = ThreatIndicator;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ThreatIndicator.init(); });
} else {
  ThreatIndicator.init();
}
