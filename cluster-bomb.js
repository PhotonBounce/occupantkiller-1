/* ============================================================
 *  CLUSTER-BOMB.JS — Cluster munition grenade (Alt+K)
 *
 *  Throw a parent shell (ballistic arc). On terrain impact it
 *  splits into 5 sub-bomblets scattered ±3.5u. Each bomblet
 *  arms, blinks red, then detonates with 0.2s stagger between
 *  them: spawnExplosion(1.2) + damageInRadius(3u, 80dmg) +
 *  distance-scaled shake. Creates a 1.5s carpet-bomb sequence.
 *  2 per wave, 22s cooldown.
 * ============================================================ */
var ClusterBomb = (function () {
  'use strict';

  var CHILD_COUNT   = 5;
  var CHILD_RADIUS  = 3.0;
  var CHILD_DMG     = 80;
  var CHILD_DELAY   = 0.20;   /* stagger between detonations */
  var SCATTER_R     = 3.5;    /* how far bomblets scatter from landing */
  var THROW_SPEED   = 18;
  var THROW_ARC     = 9;
  var STOCK_MAX     = 2;
  var COOLDOWN      = 22.0;

  var _stock        = STOCK_MAX;
  var _cd           = 0;
  var _waveWas      = -1;
  var _init         = false;
  var _lastTs       = 0;
  var _scene        = null;

  var _projectile   = null;          /* parent shell in flight */
  var _bomblets     = [];            /* { mesh, mat, light, x,y,z, armed, timer, phase } */
  var _hintEl       = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'cluster-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '57px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(255,160,40,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+K] CLUSTER ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Terrain height helper ─────────────────── */
  function _ty(x, z) {
    try { return (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ? VoxelWorld.getTerrainHeight(x, z) : 0; } catch (e) { return 0; }
  }

  /* ── Detonate one bomblet ──────────────────── */
  function _detonate(b) {
    var scene = _getScene();
    if (scene) {
      if (b.mesh) { scene.remove(b.mesh); if (b.mesh.geometry) b.mesh.geometry.dispose(); if (b.mat) b.mat.dispose(); }
      if (b.light) scene.remove(b.light);
    }
    var pos = { x: b.x, y: b.y, z: b.z };
    try { if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(pos, 1.2); } catch (e) {}
    try { if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) Enemies.damageInRadius(pos, CHILD_RADIUS, CHILD_DMG); } catch (e) {}
    try {
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        var player = window.player;
        if (player) {
          var dx = b.x - player.position.x, dz = b.z - player.position.z;
          var dist = Math.sqrt(dx*dx + dz*dz);
          var mag  = Math.max(0, 0.55 * (1 - dist / 20));
          if (mag > 0.05) CameraSystem.shake(mag, 0.15);
        }
      }
    } catch (e) {}
    b.dead = true;
  }

  /* ── Spawn bomblets at landing pos ────────── */
  function _spawnBomblets(landPos) {
    var scene = _getScene();
    var spawned = [];
    for (var i = 0; i < CHILD_COUNT; i++) {
      var angle = (i / CHILD_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 1.0;
      var r     = SCATTER_R * (0.5 + Math.random() * 0.5);
      var cx    = landPos.x + Math.cos(angle) * r;
      var cz    = landPos.z + Math.sin(angle) * r;
      var cy    = _ty(cx, cz);

      var b = { x: cx, y: cy, z: cz, armed: false, timer: i * CHILD_DELAY, phase: 0, dead: false };

      if (scene && typeof THREE !== 'undefined') {
        try {
          var geo  = new THREE.BoxGeometry(0.18, 0.22, 0.18);
          var mat  = new THREE.MeshBasicMaterial({ color: 0xff4400 });
          var mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(cx, cy + 0.11, cz);
          scene.add(mesh);
          var light = new THREE.PointLight(0xff2200, 0, 5);
          light.position.set(cx, cy + 0.3, cz);
          scene.add(light);
          b.mesh  = mesh;
          b.mat   = mat;
          b.light = light;
        } catch (err) {}
      }
      spawned.push(b);
    }
    return spawned;
  }

  /* ── Throw parent shell ────────────────────── */
  function _throw() {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var player = window.player;
    if (!player || !player.position) return;
    try {
      var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
      var fwd = new THREE.Vector3(0, 0, -1);
      if (cam) fwd.applyQuaternion(cam.quaternion).normalize();

      var start = player.position.clone(); start.y += 1.5;
      var vel   = fwd.clone().multiplyScalar(THROW_SPEED);
      vel.y     = Math.abs(vel.y) + THROW_ARC;

      var geo  = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6);
      var mat  = new THREE.MeshBasicMaterial({ color: 0xff8800 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(start);
      scene.add(mesh);
      _projectile = { mesh: mesh, mat: mat, vel: vel, scene: scene };
    } catch (err) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_cd > 0)     { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('CLUSTER CD ' + Math.ceil(_cd) + 's'); return; }
    if (_stock <= 0) { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('CLUSTER — NO STOCK'); return; }
    if (_projectile) return;
    _stock--;
    _cd = COOLDOWN;
    _throw();
    _hintEl.textContent = '[Alt+K] CLUSTER ×' + _stock;
    _hintEl.style.color = 'rgba(255,160,40,0.3)';
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('CLUSTER BOMB AWAY');
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Restock */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _cd = 0;
          _hintEl.textContent = '[Alt+K] CLUSTER ×' + _stock;
          _hintEl.style.color = 'rgba(255,160,40,0.55)';
          /* Clean up any stray bomblets */
          var sc = _getScene();
          for (var ci = 0; ci < _bomblets.length; ci++) {
            var b0 = _bomblets[ci];
            if (sc && b0.mesh) sc.remove(b0.mesh);
            if (sc && b0.light) sc.remove(b0.light);
          }
          _bomblets = [];
          if (_projectile && sc) sc.remove(_projectile.mesh);
          _projectile = null;
        }
      }
    } catch (e) {}

    /* Cooldown */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[Alt+K] CLUSTER ×' + _stock; _hintEl.style.color = 'rgba(255,160,40,0.55)'; }
    }

    /* Parent shell flight */
    if (_projectile) {
      var p = _projectile;
      p.vel.y -= 20 * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.mesh.rotation.x += dt * 8;
      var gy = _ty(p.mesh.position.x, p.mesh.position.z);
      if (p.mesh.position.y <= gy + 0.1) {
        var lp = p.mesh.position.clone(); lp.y = gy;
        p.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mat.dispose();
        _projectile = null;
        var newBomblets = _spawnBomblets(lp);
        for (var ni = 0; ni < newBomblets.length; ni++) _bomblets.push(newBomblets[ni]);
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.3, 0.12);
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('💥 CLUSTER — ' + CHILD_COUNT + ' BOMBLETS ARMED');
      }
    }

    /* Bomblet lifecycle */
    var tSec = ts / 1000;
    for (var bi = _bomblets.length - 1; bi >= 0; bi--) {
      var b = _bomblets[bi];
      if (b.dead) { _bomblets.splice(bi, 1); continue; }

      b.timer -= dt;

      if (!b.armed && b.timer <= 0) {
        /* Arm — start blinking */
        b.armed = true;
        b.blinkT = 0;
      }

      if (b.armed) {
        b.blinkT  = (b.blinkT || 0) + dt;
        /* Blink rate accelerates 4→12 Hz */
        var rate  = 4 + b.blinkT * 4;
        var blink = Math.sin(b.blinkT * Math.PI * rate) > 0;
        if (b.light) b.light.intensity = blink ? 3.0 : 0;
        if (b.mat)   b.mat.color.setHex(blink ? 0xff0000 : 0x660000);

        /* Detonate after 0.6s armed */
        if (b.blinkT >= 0.6) _detonate(b);
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyK' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ClusterBomb = ClusterBomb;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ClusterBomb.init(); });
} else {
  ClusterBomb.init();
}
