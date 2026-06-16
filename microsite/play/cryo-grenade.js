/* ============================================================
 *  CRYO-GRENADE.JS — Freeze grenade (Alt+C)
 *
 *  Ballistic-arc throw. On impact: enemies within 7u are frozen
 *  for 4s — their mesh position is pinned each frame, detection
 *  ranges zeroed, materials get an ice-blue emissive tint.
 *  Visual: pale blue expanding frost sphere + PointLight burst.
 *  Enemies appear to shiver (tiny positional jitter allowed).
 *  2 per wave, 20s cooldown.
 * ============================================================ */
var CryoGrenade = (function () {
  'use strict';

  var FREEZE_RADIUS  = 7.0;
  var FREEZE_DUR     = 4.0;
  var THROW_SPEED    = 20;
  var THROW_ARC      = 8;
  var STOCK_MAX      = 2;
  var COOLDOWN       = 20.0;

  var _stock         = STOCK_MAX;
  var _cd            = 0;
  var _waveWas       = -1;
  var _init          = false;
  var _lastTs        = 0;
  var _scene         = null;
  var _projectile    = null;
  var _frozen        = [];   /* { e, t, pinnedPos, savedDet, savedRng, savedEmissives } */
  var _blasts        = [];   /* frost sphere animations */
  var _hintEl        = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint label ─────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'cryo-hint';
    Object.assign(_hintEl.style, {
      position:      'fixed',
      bottom:        '46px',
      left:          '12px',
      fontFamily:    "'Courier New', monospace",
      fontSize:      '9px',
      letterSpacing: '1.5px',
      color:         'rgba(100,200,255,0.55)',
      zIndex:        250,
      pointerEvents: 'none',
      whiteSpace:    'nowrap'
    });
    _hintEl.textContent = '[Alt+C] CRYO ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Frost sphere visual ─────────────────── */
  function _spawnFrost(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      var geo  = new THREE.SphereGeometry(0.5, 8, 6);
      var mat  = new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0.75, wireframe: false, depthWrite: false });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.y += 0.5;
      scene.add(mesh);

      /* Outer glow */
      var geo2  = new THREE.SphereGeometry(0.5, 6, 5);
      var mat2  = new THREE.MeshBasicMaterial({ color: 0xaaeeff, transparent: true, opacity: 0.30, depthWrite: false });
      var mesh2 = new THREE.Mesh(geo2, mat2);
      mesh2.position.copy(mesh.position);
      scene.add(mesh2);

      var light = new THREE.PointLight(0x44bbff, 4.5, FREEZE_RADIUS + 2);
      light.position.copy(mesh.position);
      scene.add(light);

      _blasts.push({ mesh: mesh, mesh2: mesh2, mat: mat, mat2: mat2, light: light,
                     t: 0.45, maxT: 0.45, scene: scene });
    } catch (err) {}
  }

  /* ── Apply ice tint to enemy ─────────────── */
  function _applyIce(e) {
    var saved = [];
    try {
      e.mesh.traverse(function (obj) {
        if (obj.isMesh && obj.material) {
          var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(function (mat) {
            if (mat.emissive) {
              saved.push({ mat: mat, r: mat.emissive.r, g: mat.emissive.g, b: mat.emissive.b });
              mat.emissive.setRGB(0, 0.2, 0.8);
            }
          });
        }
      });
    } catch (err) {}
    return saved;
  }

  /* ── Restore enemy materials ─────────────── */
  function _removeIce(savedEmissives) {
    try {
      savedEmissives.forEach(function (s) {
        s.mat.emissive.setRGB(s.r, s.g, s.b);
      });
    } catch (err) {}
  }

  /* ── Freeze enemies in radius ────────────── */
  function _freezeArea(pos) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    try {
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || e.dead || !e.mesh) continue;
        var dx = e.mesh.position.x - pos.x;
        var dz = e.mesh.position.z - pos.z;
        if (dx*dx + dz*dz > FREEZE_RADIUS * FREEZE_RADIUS) continue;

        /* Don't re-freeze */
        var alreadyFrozen = false;
        for (var fi = 0; fi < _frozen.length; fi++) { if (_frozen[fi].e === e) { alreadyFrozen = true; break; } }
        if (alreadyFrozen) continue;

        var savedDet = e.detectionRange;
        var savedRng = e.rangedRange;
        e.detectionRange = 0.01;
        e.rangedRange    = 0.01;

        var emissives = _applyIce(e);
        _frozen.push({ e: e, t: FREEZE_DUR, pinnedPos: e.mesh.position.clone(), savedDet: savedDet, savedRng: savedRng, savedEmissives: emissives });
      }
      var count = _frozen.length;
      if (count > 0 && typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('❄ CRYO — ' + count + ' ENEMIES FROZEN ' + FREEZE_DUR + 's');
    } catch (err) {}
  }

  /* ── Throw projectile ────────────────────── */
  function _throw() {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var player = window.player;
    if (!player || !player.position) return;

    try {
      var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
      var fwd = new THREE.Vector3(0, 0, -1);
      if (cam) fwd.applyQuaternion(cam.quaternion).normalize();

      var start = player.position.clone();
      start.y  += 1.5;
      var vel   = fwd.clone().multiplyScalar(THROW_SPEED);
      vel.y     = Math.abs(vel.y) + THROW_ARC;

      var geo  = new THREE.SphereGeometry(0.1, 5, 4);
      var mat  = new THREE.MeshBasicMaterial({ color: 0x88ddff });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(start);
      scene.add(mesh);
      _projectile = { mesh: mesh, vel: vel, scene: scene };
    } catch (err) {}
  }

  /* ── Activate ────────────────────────────── */
  function _activate() {
    if (_cd > 0)     { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('CRYO CD ' + Math.ceil(_cd) + 's'); return; }
    if (_stock <= 0) { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('CRYO — NO STOCK'); return; }
    if (_projectile) return;
    _stock--;
    _cd = COOLDOWN;
    _throw();
    _hintEl.textContent = '[Alt+C] CRYO ×' + _stock;
    _hintEl.style.color = 'rgba(100,200,255,0.3)';
  }

  /* ── rAF tick ────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _cd = 0;
          /* Unfreeze all */
          for (var ci = 0; ci < _frozen.length; ci++) {
            var f = _frozen[ci];
            f.e.detectionRange = f.savedDet;
            f.e.rangedRange    = f.savedRng;
            _removeIce(f.savedEmissives);
          }
          _frozen = [];
          _hintEl.textContent = '[Alt+C] CRYO ×' + _stock;
          _hintEl.style.color = 'rgba(100,200,255,0.55)';
        }
      }
    } catch (e) {}

    /* Cooldown */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[Alt+C] CRYO ×' + _stock; _hintEl.style.color = 'rgba(100,200,255,0.55)'; }
    }

    /* Projectile */
    if (_projectile) {
      var p = _projectile;
      p.vel.y -= 20 * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      var gy = 0;
      try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) gy = VoxelWorld.getTerrainHeight(p.mesh.position.x, p.mesh.position.z); } catch (e) {}
      if (p.mesh.position.y <= gy + 0.1) {
        var landPos = p.mesh.position.clone(); landPos.y = gy;
        p.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
        _projectile = null;
        _spawnFrost(landPos);
        _freezeArea(landPos);
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.2, 0.18);
      }
    }

    /* Animate frost blasts */
    for (var bi = _blasts.length - 1; bi >= 0; bi--) {
      var b = _blasts[bi];
      b.t -= dt;
      var prog = Math.max(0, b.t / b.maxT);
      var sc   = 1 + (1 - prog) * (FREEZE_RADIUS / 0.5);
      b.mesh.scale.setScalar(sc); b.mesh2.scale.setScalar(sc);
      b.mat.opacity  = prog * 0.75;
      b.mat2.opacity = prog * 0.30;
      b.light.intensity = prog * 4.5;
      if (b.t <= 0) {
        b.scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mat.dispose();
        b.scene.remove(b.mesh2); b.mesh2.geometry.dispose(); b.mat2.dispose();
        b.scene.remove(b.light);
        _blasts.splice(bi, 1);
      }
    }

    /* Maintain freeze */
    for (var fi = _frozen.length - 1; fi >= 0; fi--) {
      var f = _frozen[fi];
      f.t -= dt;
      if (f.e.dead || f.t <= 0) {
        f.e.detectionRange = f.savedDet;
        f.e.rangedRange    = f.savedRng;
        _removeIce(f.savedEmissives);
        _frozen.splice(fi, 1);
        continue;
      }
      /* Pin position — override any movement this frame */
      f.e.mesh.position.copy(f.pinnedPos);
      /* Keep detection zeroed (newly set per frame in case game resets it) */
      f.e.detectionRange = 0.01;
      f.e.rangedRange    = 0.01;
    }
  }

  /* ── Key handler ─────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyC' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.CryoGrenade = CryoGrenade;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { CryoGrenade.init(); });
} else {
  CryoGrenade.init();
}
