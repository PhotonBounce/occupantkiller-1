/* ============================================================
 *  WAR-CRY.JS — Terror shout (Alt+W)
 *
 *  Instant activation. All enemies within 20u are terrified for
 *  3s: detection/ranged ranges zeroed AND their mesh.position is
 *  pushed away from the player each frame at 4u/s — they visibly
 *  scatter and flee. Each fleeing enemy gets a yellow PointLight
 *  that bobs as they "sprint". HUD: "X ENEMIES TERRIFIED".
 *  1 per wave, 18s cooldown.
 * ============================================================ */
var WarCry = (function () {
  'use strict';

  var RANGE        = 20;
  var DURATION     = 3.0;
  var FLEE_SPEED   = 4.5;
  var STOCK_MAX    = 1;
  var COOLDOWN     = 18.0;

  var _stock       = STOCK_MAX;
  var _cd          = 0;
  var _waveWas     = -1;
  var _init        = false;
  var _lastTs      = 0;
  var _scene       = null;

  var _terrified   = [];   /* { e, t, savedDet, savedRng, glow, fleeDir } */
  var _shoutEl     = null; /* full-screen shout text */
  var _shoutT      = 0;
  var _hintEl      = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'warcry-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '145px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(255,220,80,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+W] WAR CRY ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Shout text overlay ────────────────────── */
  function _buildShout() {
    _shoutEl = document.createElement('div');
    Object.assign(_shoutEl.style, {
      position: 'fixed', top: '38%', left: '50%',
      transform: 'translate(-50%,-50%)',
      fontFamily: "'Courier New', monospace",
      fontSize: '42px', fontWeight: 'bold',
      letterSpacing: '0.4em',
      color: 'rgba(255,220,0,0)',
      textShadow: '0 0 18px rgba(255,180,0,0.9)',
      zIndex: 340, pointerEvents: 'none'
    });
    _shoutEl.textContent = 'AAAAAARGH!';
    document.body.appendChild(_shoutEl);
  }

  /* ── Fire ──────────────────────────────────── */
  function _fire() {
    var player = window.player;
    if (!player || !player.position) return;
    var px = player.position.x, pz = player.position.z;
    var count = 0;
    var scene = _getScene();

    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || e.dead || !e.mesh) continue;
          var dx = e.mesh.position.x - px;
          var dz = e.mesh.position.z - pz;
          var dist = Math.sqrt(dx*dx + dz*dz);
          if (dist > RANGE) continue;

          /* Don't double-terrify */
          var already = false;
          for (var ti = 0; ti < _terrified.length; ti++) { if (_terrified[ti].e === e) { already = true; break; } }
          if (already) continue;

          var savedDet = e.detectionRange, savedRng = e.rangedRange;
          e.detectionRange = 0.01; e.rangedRange = 0.01;

          /* Flee direction: away from player, normalized */
          var fl = dist > 0.1 ? { x: dx/dist, z: dz/dist } : { x: Math.random()-0.5, z: Math.random()-0.5 };
          /* Add slight random scatter angle */
          var scatter = (Math.random() - 0.5) * 0.5;
          var cosS = Math.cos(scatter), sinS = Math.sin(scatter);
          fl = { x: fl.x*cosS - fl.z*sinS, z: fl.x*sinS + fl.z*cosS };

          /* Yellow panic glow */
          var glow = null;
          if (scene) {
            try {
              glow = new THREE.PointLight(0xffcc00, 2.0, 6);
              glow.position.copy(e.mesh.position); glow.position.y += 1;
              scene.add(glow);
            } catch (ge) {}
          }

          _terrified.push({ e: e, t: DURATION, savedDet: savedDet, savedRng: savedRng, glow: glow, fleeDir: fl });
          count++;
        }
      }
    } catch (err) {}

    /* Shout overlay */
    if (_shoutEl) {
      _shoutEl.style.color = 'rgba(255,220,0,1.0)';
      _shoutEl.style.fontSize = '50px';
      _shoutT = 0.7;
    }

    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.40, 0.20); } catch (e) {}

    var msg = count > 0 ? ('😱 WAR CRY — ' + count + ' ENEM' + (count > 1 ? 'IES' : 'Y') + ' TERRIFIED ' + DURATION + 's') : '😱 WAR CRY';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup(msg); } catch (e) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_cd > 0)     { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('WAR CRY CD ' + Math.ceil(_cd) + 's'); } catch (e) {} return; }
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('WAR CRY — NO CHARGE'); } catch (e) {} return; }
    _stock--;
    _cd = COOLDOWN;
    _hintEl.textContent = '[Alt+W] WAR CRY ×' + _stock;
    _hintEl.style.color = 'rgba(255,220,80,0.3)';
    _fire();
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt   = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs  = ts;
    var tSec = ts / 1000;

    /* Restock */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _cd = 0;
          _hintEl.textContent = '[Alt+W] WAR CRY ×' + _stock;
          _hintEl.style.color = 'rgba(255,220,80,0.55)';
          var sc = _getScene();
          for (var ci = 0; ci < _terrified.length; ci++) {
            var t0 = _terrified[ci];
            t0.e.detectionRange = t0.savedDet; t0.e.rangedRange = t0.savedRng;
            if (sc && t0.glow) sc.remove(t0.glow);
          }
          _terrified = [];
        }
      }
    } catch (e) {}

    /* Cooldown */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[Alt+W] WAR CRY ×' + _stock; _hintEl.style.color = 'rgba(255,220,80,0.55)'; }
    }

    /* Shout text fade */
    if (_shoutT > 0 && _shoutEl) {
      _shoutT -= dt;
      var prog = Math.max(0, _shoutT / 0.7);
      _shoutEl.style.color = 'rgba(255,220,0,' + prog + ')';
      _shoutEl.style.fontSize = (50 + (1 - prog) * 20) + 'px';
      if (_shoutT <= 0) _shoutEl.style.color = 'rgba(255,220,0,0)';
    }

    /* Flee + maintain terror */
    var scene = _getScene();
    for (var ti = _terrified.length - 1; ti >= 0; ti--) {
      var t = _terrified[ti];
      t.t -= dt;

      if (t.e.dead || t.t <= 0) {
        t.e.detectionRange = t.savedDet;
        t.e.rangedRange    = t.savedRng;
        if (scene && t.glow) scene.remove(t.glow);
        _terrified.splice(ti, 1);
        continue;
      }

      /* Maintain zero detection each frame */
      t.e.detectionRange = 0.01;
      t.e.rangedRange    = 0.01;

      /* Push mesh in flee direction each frame */
      t.e.mesh.position.x += t.fleeDir.x * FLEE_SPEED * dt;
      t.e.mesh.position.z += t.fleeDir.z * FLEE_SPEED * dt;

      /* Keep on terrain */
      try {
        if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
          var gy = VoxelWorld.getTerrainHeight(t.e.mesh.position.x, t.e.mesh.position.z);
          t.e.mesh.position.y = gy;
        }
      } catch (te) {}

      /* Panic glow follows enemy + bobs */
      if (t.glow && t.e.mesh) {
        t.glow.position.set(t.e.mesh.position.x, t.e.mesh.position.y + 1 + Math.sin(tSec * 8) * 0.15, t.e.mesh.position.z);
        t.glow.intensity = 1.5 + Math.sin(tSec * 12) * 0.5;
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyW' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    _buildShout();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.WarCry = WarCry;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WarCry.init(); });
} else {
  WarCry.init();
}
