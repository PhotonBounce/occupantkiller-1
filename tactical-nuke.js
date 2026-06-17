/* ============================================================
 *  TACTICAL-NUKE.JS — Grand finale weapon (F12)
 *
 *  THE ULTIMATE KILLSTREAK. 1 per wave.
 *
 *  Phase 1 — Warning (2.5s):
 *    Blinking red "☢ NUCLEAR LAUNCH DETECTED" overlay.
 *    Game canvas filter: red desaturate pulse.
 *
 *  Phase 2 — Detonation:
 *    Full-white screen flash.
 *    damageInRadius(player.pos, 40u, 800 dmg).
 *    CameraSystem.shake(2.0, 0.80).
 *    THREE.js mushroom cloud: rising fireball sphere + flat cap
 *    disk + stem cylinder. Massive PointLight burst.
 *
 *  Phase 3 — Fallout (6s):
 *    Green radioactive vignette canvas fades out.
 *    Game canvas: sepia(0.6) brightness(0.8) hue-rotate(80deg).
 * ============================================================ */
var TacticalNuke = (function () {
  'use strict';

  var BLAST_RADIUS  = 40;
  var BLAST_DMG     = 800;
  var WARN_DUR      = 2.5;
  var FALLOUT_DUR   = 6.0;
  var STOCK_MAX     = 1;

  var _stock        = STOCK_MAX;
  var _waveWas      = -1;
  var _init         = false;
  var _lastTs       = 0;
  var _scene        = null;
  var _phase        = 0;   /* 0=idle, 1=warning, 2=strike, 3=fallout */
  var _phaseT       = 0;
  var _nukePos      = null;

  /* DOM */
  var _warnEl       = null;
  var _flashEl      = null;
  var _falloutCanvas= null;
  var _falloutCtx   = null;
  var _hintEl       = null;
  var _gameCanvas   = null;

  /* THREE.js mushroom */
  var _mushroom     = [];   /* { mesh, mat, type, scene } */
  var _nukeLight    = null;

  function _getScene() {
    if (!_scene) { try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {} }
    return _scene;
  }
  function _getGameCanvas() {
    if (!_gameCanvas) _gameCanvas = document.querySelector('canvas#game-canvas') || document.querySelector('canvas');
    return _gameCanvas;
  }

  /* ── Hint ────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'nuke-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '178px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(255,60,60,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[F12] NUKE ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Warning overlay ─────────────────────── */
  function _buildWarn() {
    _warnEl = document.createElement('div');
    Object.assign(_warnEl.style, {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      fontFamily: "'Courier New', monospace",
      fontSize: '22px', fontWeight: 'bold',
      letterSpacing: '0.3em', textAlign: 'center',
      color: 'rgba(255,40,40,0)',
      textShadow: '0 0 20px rgba(255,0,0,0.95)',
      zIndex: 345, pointerEvents: 'none', lineHeight: '1.6'
    });
    _warnEl.innerHTML = '☢ NUCLEAR LAUNCH DETECTED<br><span style="font-size:13px;letter-spacing:0.5em">SEEK COVER IMMEDIATELY</span>';
    document.body.appendChild(_warnEl);
  }

  /* ── Screen flash ─────────────────────────── */
  function _buildFlash() {
    _flashEl = document.createElement('div');
    Object.assign(_flashEl.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'white', zIndex: 360, pointerEvents: 'none', opacity: 0
    });
    document.body.appendChild(_flashEl);
  }

  /* ── Fallout canvas ───────────────────────── */
  function _buildFallout() {
    _falloutCanvas = document.createElement('canvas');
    Object.assign(_falloutCanvas.style, {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 295, opacity: 0
    });
    document.body.appendChild(_falloutCanvas);
    _falloutCtx = _falloutCanvas.getContext('2d');
  }

  /* ── Draw fallout vignette ────────────────── */
  function _drawFallout(intensity) {
    var ctx = _falloutCtx, cv = _falloutCanvas;
    if (!ctx || !cv) return;
    var w = window.innerWidth, h = window.innerHeight;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    ctx.clearRect(0, 0, w, h);
    var grad = ctx.createRadialGradient(w/2, h/2, h * 0.1, w/2, h/2, h * 0.72);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(40,80,0,' + (intensity * 0.3) + ')');
    grad.addColorStop(1,   'rgba(20,60,0,' + (intensity * 0.75) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  /* ── Spawn mushroom cloud ─────────────────── */
  function _spawnMushroom(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      /* Fireball core — starts small, grows */
      var fbGeo  = new THREE.SphereGeometry(1, 10, 8);
      var fbMat  = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.92, depthWrite: false });
      var fireball = new THREE.Mesh(fbGeo, fbMat);
      fireball.position.set(pos.x, pos.y + 1, pos.z);
      scene.add(fireball);
      _mushroom.push({ mesh: fireball, mat: fbMat, type: 'ball', scene: scene, t: 0, baseY: pos.y + 1 });

      /* Cap disk — flat torus on top of fireball */
      var capGeo = new THREE.TorusGeometry(5, 1.8, 6, 22);
      var capMat = new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.80, depthWrite: false });
      var cap    = new THREE.Mesh(capGeo, capMat);
      cap.position.set(pos.x, pos.y + 1, pos.z);
      scene.add(cap);
      _mushroom.push({ mesh: cap, mat: capMat, type: 'cap', scene: scene, t: 0, baseY: pos.y + 1 });

      /* Stem cylinder */
      var stemGeo = new THREE.CylinderGeometry(0.6, 2.0, 6, 8);
      var stemMat = new THREE.MeshBasicMaterial({ color: 0xdd5500, transparent: true, opacity: 0.75, depthWrite: false });
      var stem    = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(pos.x, pos.y + 1, pos.z);
      scene.add(stem);
      _mushroom.push({ mesh: stem, mat: stemMat, type: 'stem', scene: scene, t: 0, baseY: pos.y + 1 });

      /* Dust ring at ground */
      var dustGeo = new THREE.TorusGeometry(2, 0.6, 5, 20);
      var dustMat = new THREE.MeshBasicMaterial({ color: 0xaa8833, transparent: true, opacity: 0.70, depthWrite: false });
      var dust    = new THREE.Mesh(dustGeo, dustMat);
      dust.position.set(pos.x, pos.y + 0.2, pos.z);
      dust.rotation.x = Math.PI / 2;
      scene.add(dust);
      _mushroom.push({ mesh: dust, mat: dustMat, type: 'dust', scene: scene, t: 0, baseY: pos.y + 0.2 });

      /* Massive nuke light */
      _nukeLight = new THREE.PointLight(0xff6600, 25.0, 60);
      _nukeLight.position.set(pos.x, pos.y + 8, pos.z);
      scene.add(_nukeLight);
    } catch (err) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_phase > 0) return;
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('NUKE — NO CHARGE'); } catch (e) {} return; }
    var player = window.player;
    if (!player || !player.position) return;

    _stock--;
    _phase   = 1;
    _phaseT  = WARN_DUR;
    _nukePos = player.position.clone ? player.position.clone() : { x: player.position.x, y: player.position.y, z: player.position.z };

    _hintEl.textContent = '[F12] NUKE ×' + _stock;
    _hintEl.style.color = 'rgba(255,60,60,0.3)';
    if (_warnEl) _warnEl.style.color = 'rgba(255,40,40,1.0)';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('☢ NUCLEAR LAUNCH — BRACE FOR IMPACT'); } catch (e) {}
  }

  var _flashT = 0;

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
          _waveWas = w; _stock = STOCK_MAX; _phase = 0; _phaseT = 0;
          _hintEl.textContent = '[F12] NUKE ×' + _stock;
          _hintEl.style.color = 'rgba(255,60,60,0.55)';
          if (_warnEl) _warnEl.style.color = 'rgba(255,40,40,0)';
          if (_falloutCanvas) _falloutCanvas.style.opacity = 0;
          var gc0 = _getGameCanvas(); if (gc0) gc0.style.filter = '';
        }
      }
    } catch (e) {}

    /* Flash decay */
    if (_flashT > 0 && _flashEl) {
      _flashT -= dt;
      _flashEl.style.opacity = Math.max(0, _flashT / 0.25);
      if (_flashT <= 0) _flashEl.style.opacity = 0;
    }

    /* Warning phase */
    if (_phase === 1) {
      _phaseT -= dt;
      /* Blink warning */
      if (_warnEl) {
        var blink = Math.sin(tSec * Math.PI * 5) > 0;
        _warnEl.style.color = blink ? 'rgba(255,40,40,1.0)' : 'rgba(255,40,40,0.2)';
      }
      /* Red game canvas pulse */
      var gc = _getGameCanvas();
      if (gc) {
        var rPulse = 0.3 + Math.abs(Math.sin(tSec * 4)) * 0.2;
        gc.style.filter = 'saturate(0.3) brightness(0.9) sepia(' + rPulse + ')';
      }
      if (_phaseT <= 0) {
        /* DETONATE */
        _phase  = 3;
        _phaseT = FALLOUT_DUR;
        if (_warnEl) _warnEl.style.color = 'rgba(255,40,40,0)';
        if (_flashEl) { _flashEl.style.opacity = 1; _flashT = 0.25; }
        if (_nukePos) _spawnMushroom(_nukePos);
        try { if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) Enemies.damageInRadius(_nukePos, BLAST_RADIUS, BLAST_DMG); } catch (e) {}
        try { if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(_nukePos, 7.0); } catch (e) {}
        try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(2.0, 0.80); } catch (e) {}
        try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('☢ NUCLEAR DETONATION — ' + BLAST_RADIUS + 'u RADIUS'); } catch (e) {}
        /* Fallout filter on game canvas */
        var gc2 = _getGameCanvas();
        if (gc2) gc2.style.filter = 'sepia(0.55) brightness(0.85) hue-rotate(80deg)';
        if (_falloutCanvas) _falloutCanvas.style.opacity = 1;
      }
    }

    /* Fallout phase */
    if (_phase === 3) {
      _phaseT -= dt;
      var fallProg = Math.max(0, _phaseT / FALLOUT_DUR);
      _drawFallout(fallProg * 0.85);

      /* Mushroom cloud animation */
      var elapsed = FALLOUT_DUR - _phaseT;
      for (var mi = _mushroom.length - 1; mi >= 0; mi--) {
        var m = _mushroom[mi];
        m.t = elapsed;
        var rise   = Math.min(elapsed * 5, 18);
        var grow   = Math.min(1, elapsed * 0.8);
        var fade   = fallProg;

        if (m.type === 'ball') {
          m.mesh.position.y = m.baseY + rise;
          var bs = 1 + grow * 7;
          m.mesh.scale.setScalar(bs);
          m.mat.opacity = fade * 0.9;
        } else if (m.type === 'cap') {
          m.mesh.position.y = m.baseY + rise + 3;
          var cs = Math.min(1, grow * 1.5);
          m.mesh.scale.setScalar(cs);
          m.mat.opacity = fade * 0.80;
        } else if (m.type === 'stem') {
          m.mesh.position.y = m.baseY + Math.min(rise * 0.4, 4);
          m.mat.opacity = fade * 0.75;
        } else if (m.type === 'dust') {
          var ds = 1 + elapsed * 3;
          m.mesh.scale.setScalar(Math.min(ds, 5));
          m.mat.opacity = fade * 0.70;
        }

        if (_phaseT <= 0) {
          m.scene.remove(m.mesh); m.mesh.geometry.dispose(); m.mat.dispose();
          _mushroom.splice(mi, 1);
        }
      }

      if (_nukeLight) {
        _nukeLight.intensity = fallProg * 25.0;
        if (_phaseT <= 0) { var sc = _getScene(); if (sc) sc.remove(_nukeLight); _nukeLight = null; }
      }

      if (_phaseT <= 0) {
        _phase = 0;
        if (_falloutCanvas) _falloutCanvas.style.opacity = 0;
        var gc3 = _getGameCanvas(); if (gc3) gc3.style.filter = '';
        _hintEl.textContent = '[F12] NUKE ×' + _stock;
        _hintEl.style.color = _stock > 0 ? 'rgba(255,60,60,0.55)' : 'rgba(255,60,60,0.2)';
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'F12' && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    _buildWarn();
    _buildFlash();
    _buildFallout();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.TacticalNuke = TacticalNuke;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TacticalNuke.init(); });
} else {
  TacticalNuke.init();
}
