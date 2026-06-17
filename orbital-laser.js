/* ============================================================
 *  ORBITAL-LASER.JS — Orbital strike (Alt+O)
 *
 *  Two-phase orbital strike system. 1 per wave.
 *
 *  Phase 1 — Targeting (2.5s):
 *    Red pulsing torus ring on terrain 30u ahead.
 *    Shrinking inner ring converges to target.
 *    HUD countdown: "ORBITAL 2s … 1s … INCOMING".
 *
 *  Phase 2 — Strike:
 *    Full-white screen flash.
 *    Massive CylinderGeometry beam y+80 → ground, radius 1.2u.
 *    Outer glow beam radius 3u. PointLight(0xffffff, 20, 40).
 *    spawnExplosion(5.0) + damageInRadius(5u, 400 dmg).
 *    CameraSystem.shake(1.2, 0.5). Beam decays 0.45s.
 * ============================================================ */
var OrbitalLaser = (function () {
  'use strict';

  var TARGET_DIST   = 30;
  var CHARGE_TIME   = 2.5;
  var BEAM_RADIUS   = 1.2;
  var BEAM_HEIGHT   = 80;
  var STRIKE_RADIUS = 5;
  var STRIKE_DMG    = 400;
  var BEAM_DECAY    = 0.45;
  var STOCK_MAX     = 1;

  var _stock        = STOCK_MAX;
  var _waveWas      = -1;
  var _init         = false;
  var _lastTs       = 0;
  var _scene        = null;

  /* State */
  var _phase        = 0;   /* 0=idle, 1=targeting, 2=striking */
  var _chargeT      = 0;
  var _targetPos    = null;

  /* Targeting visuals */
  var _ring1        = null; /* outer pulsing ring */
  var _ring2        = null; /* inner converging ring */
  var _rMat1        = null;
  var _rMat2        = null;
  var _targetLight  = null;

  /* Beam visuals */
  var _beams        = [];
  var _flash        = null;
  var _flashT       = 0;
  var _hintEl       = null;
  var _countdownEl  = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint label ──────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'orbital-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '123px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(255,100,100,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+O] ORBITAL ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Countdown HUD ───────────────────────── */
  function _buildCountdown() {
    _countdownEl = document.createElement('div');
    Object.assign(_countdownEl.style, {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: "'Courier New', monospace",
      fontSize: '28px', fontWeight: 'bold',
      letterSpacing: '0.3em',
      color: 'rgba(255,60,60,0)',
      zIndex: 340, pointerEvents: 'none',
      textShadow: '0 0 12px rgba(255,80,80,0.9)',
      transition: 'opacity 0.1s'
    });
    _countdownEl.textContent = '';
    document.body.appendChild(_countdownEl);
  }

  /* ── Screen flash ─────────────────────────── */
  function _buildFlash() {
    _flash = document.createElement('div');
    Object.assign(_flash.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255,255,255,1.0)',
      zIndex: 350, pointerEvents: 'none', opacity: 0
    });
    document.body.appendChild(_flash);
  }

  /* ── Target position (ground 30u ahead) ──── */
  function _getTargetPos() {
    var player = window.player;
    if (!player || !player.position) return null;
    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    if (typeof THREE === 'undefined') return null;
    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).normalize();
    fwd.y = 0; fwd.normalize();
    var tx = player.position.x + fwd.x * TARGET_DIST;
    var tz = player.position.z + fwd.z * TARGET_DIST;
    var ty = 0;
    try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ty = VoxelWorld.getTerrainHeight(tx, tz); } catch (e) {}
    return new THREE.Vector3(tx, ty, tz);
  }

  /* ── Build targeting rings ───────────────── */
  function _buildTargetRings(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      /* Outer ring — stays fixed */
      var geo1 = new THREE.TorusGeometry(3.5, 0.06, 6, 32);
      _rMat1   = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.85 });
      _ring1   = new THREE.Mesh(geo1, _rMat1);
      _ring1.rotation.x = Math.PI / 2;
      _ring1.position.set(pos.x, pos.y + 0.05, pos.z);
      scene.add(_ring1);

      /* Inner ring — starts large, converges to center */
      var geo2 = new THREE.TorusGeometry(3.5, 0.04, 6, 32);
      _rMat2   = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.70 });
      _ring2   = new THREE.Mesh(geo2, _rMat2);
      _ring2.rotation.x = Math.PI / 2;
      _ring2.position.set(pos.x, pos.y + 0.08, pos.z);
      scene.add(_ring2);

      _targetLight = new THREE.PointLight(0xff3300, 2.5, 12);
      _targetLight.position.set(pos.x, pos.y + 1, pos.z);
      scene.add(_targetLight);
    } catch (err) {}
  }

  /* ── Remove targeting rings ──────────────── */
  function _removeTargetRings() {
    var scene = _getScene();
    if (!scene) return;
    if (_ring1)       { scene.remove(_ring1); _ring1.geometry.dispose(); _rMat1.dispose(); _ring1 = null; }
    if (_ring2)       { scene.remove(_ring2); _ring2.geometry.dispose(); _rMat2.dispose(); _ring2 = null; }
    if (_targetLight) { scene.remove(_targetLight); _targetLight = null; }
  }

  /* ── Spawn strike beam ───────────────────── */
  function _spawnBeam(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      var beamTop = pos.y + BEAM_HEIGHT;
      var midY    = pos.y + BEAM_HEIGHT / 2;

      /* Core beam */
      var geo = new THREE.CylinderGeometry(BEAM_RADIUS, BEAM_RADIUS, BEAM_HEIGHT, 8, 1);
      var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, midY, pos.z);
      scene.add(mesh);

      /* Outer glow beam */
      var gGeo = new THREE.CylinderGeometry(BEAM_RADIUS * 2.8, BEAM_RADIUS * 2.8, BEAM_HEIGHT, 8, 1);
      var gMat = new THREE.MeshBasicMaterial({ color: 0xff8866, transparent: true, opacity: 0.35, depthWrite: false });
      var glow = new THREE.Mesh(gGeo, gMat);
      glow.position.set(pos.x, midY, pos.z);
      scene.add(glow);

      /* Massive impact light */
      var light = new THREE.PointLight(0xffffff, 20.0, 40);
      light.position.set(pos.x, pos.y + 1, pos.z);
      scene.add(light);

      /* Secondary orange light */
      var light2 = new THREE.PointLight(0xff4400, 8.0, 25);
      light2.position.set(pos.x, pos.y + 3, pos.z);
      scene.add(light2);

      _beams.push({ mesh: mesh, mat: mat, glow: glow, gMat: gMat, light: light, light2: light2,
                    t: BEAM_DECAY, maxT: BEAM_DECAY, scene: scene });
    } catch (err) {}
  }

  /* ── Execute strike ──────────────────────── */
  function _strike(pos) {
    /* Screen flash */
    if (_flash) { _flash.style.opacity = 1; _flashT = 0.22; }

    /* Countdown hide */
    if (_countdownEl) _countdownEl.style.color = 'rgba(255,60,60,0)';

    _spawnBeam(pos);

    /* Damage */
    try { if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion({ x: pos.x, y: pos.y, z: pos.z }, 5.0); } catch (e) {}
    try { if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) Enemies.damageInRadius({ x: pos.x, y: pos.y, z: pos.z }, STRIKE_RADIUS, STRIKE_DMG); } catch (e) {}
    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(1.2, 0.50); } catch (e) {}
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('☄ ORBITAL STRIKE'); } catch (e) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_phase > 0) return;
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('ORBITAL — NO CHARGE'); } catch (e) {} return; }

    var tPos = _getTargetPos();
    if (!tPos) return;

    _stock--;
    _phase      = 1;
    _chargeT    = CHARGE_TIME;
    _targetPos  = tPos;

    _buildTargetRings(tPos);

    _hintEl.textContent = '[Alt+O] ORBITAL ×' + _stock;
    _hintEl.style.color = 'rgba(255,100,100,0.3)';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('☄ ORBITAL LOCKED — INCOMING'); } catch (e) {}
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var tSec = ts / 1000;

    /* Restock */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _phase = 0; _chargeT = 0;
          _hintEl.textContent = '[Alt+O] ORBITAL ×' + _stock;
          _hintEl.style.color = 'rgba(255,100,100,0.55)';
          _removeTargetRings();
          if (_countdownEl) _countdownEl.style.color = 'rgba(255,60,60,0)';
        }
      }
    } catch (e) {}

    /* Flash decay */
    if (_flashT > 0 && _flash) {
      _flashT -= dt;
      _flash.style.opacity = Math.max(0, _flashT / 0.22);
      if (_flashT <= 0) _flash.style.opacity = 0;
    }

    /* Targeting phase */
    if (_phase === 1) {
      _chargeT -= dt;

      /* Animate outer ring pulse */
      if (_ring1 && _rMat1) {
        var pulse = 0.7 + Math.sin(tSec * 8) * 0.3;
        _rMat1.opacity = pulse * 0.85;
        _ring1.rotation.z += dt * 2.5;
      }
      /* Inner ring converges */
      if (_ring2 && _rMat2 && _targetPos) {
        var shrink = Math.max(0.15, _chargeT / CHARGE_TIME);
        _ring2.scale.setScalar(shrink);
        _rMat2.opacity = (1 - shrink) * 0.9;
        _ring2.rotation.z -= dt * 4;
      }
      if (_targetLight) {
        _targetLight.intensity = 2.0 + Math.sin(tSec * 10) * 1.0;
      }

      /* Countdown text */
      if (_countdownEl) {
        var secs = Math.ceil(_chargeT);
        _countdownEl.textContent = secs > 0 ? ('ORBITAL ' + secs + 's') : 'ORBITAL INCOMING';
        _countdownEl.style.color = 'rgba(255,60,60,0.9)';
      }

      /* Trigger strike */
      if (_chargeT <= 0) {
        _phase = 2;
        _removeTargetRings();
        if (_targetPos) _strike(_targetPos);
        _phase = 0;   /* reset to idle after triggering */
      }
    }

    /* Beam decay */
    for (var bi = _beams.length - 1; bi >= 0; bi--) {
      var b = _beams[bi];
      b.t -= dt;
      var prog = Math.max(0, b.t / b.maxT);
      b.mat.opacity   = prog * 0.95;
      b.gMat.opacity  = prog * 0.35;
      b.light.intensity  = prog * 20.0;
      b.light2.intensity = prog * 8.0;
      if (b.t <= 0) {
        b.scene.remove(b.mesh);  b.mesh.geometry.dispose();  b.mat.dispose();
        b.scene.remove(b.glow);  b.glow.geometry.dispose();  b.gMat.dispose();
        b.scene.remove(b.light); b.scene.remove(b.light2);
        _beams.splice(bi, 1);
        if (_countdownEl) _countdownEl.style.color = 'rgba(255,60,60,0)';
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyO' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    _buildCountdown();
    _buildFlash();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.OrbitalLaser = OrbitalLaser;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { OrbitalLaser.init(); });
} else {
  OrbitalLaser.init();
}
