// ============================================================
//  recon-balloon.js — Recon Balloon: aerial overhead minimap view
//  Press B to deploy a balloon at player position.
//  Balloon rises to Y=30 over 8 seconds, then provides a 30-second
//  overhead minimap showing enemy/player positions.
//  AA guns (window._aaGunsFired) can shoot it down.
//  Cooldown: 60 seconds. Uses per level: 2.
//  Public API: init(scene, camera, renderer), update(dt), deploy(), reset()
// ============================================================
window.ReconBalloon = (function () {
  'use strict';

  /* ── Constants ───────────────────────────────────────────── */
  var RISE_DURATION    = 8;      // seconds to reach altitude
  var ALTITUDE         = 30;     // target Y
  var VIEW_DURATION    = 30;     // seconds of overhead view
  var COOLDOWN         = 60;     // seconds between uses
  var USES_PER_LEVEL   = 2;
  var ROPE_HEIGHT      = 10;
  var MAP_SIZE         = 120;    // px
  var DRIFT_SPEED      = 3;      // units/s when drifting away after expiry

  /* ── Private state ───────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  var _balloon  = null;   // active balloon object or null
  var _cooldownTimer  = 0;
  var _usesLeft = USES_PER_LEVEL;
  var _keyHandlerAttached = false;

  /* ── Shared geometries (lazy) ────────────────────────────── */
  var _balloonGeo = null;
  var _ropeGeo    = null;
  var _smokeGeo   = null;

  function _lazyGeos() {
    if (!_balloonGeo) _balloonGeo = new THREE.SphereGeometry(0.8, 12, 12);
    if (!_ropeGeo)    _ropeGeo    = new THREE.CylinderGeometry(0.02, 0.02, ROPE_HEIGHT, 6);
    if (!_smokeGeo)   _smokeGeo   = new THREE.SphereGeometry(0.12, 5, 5);
  }

  /* ── HUD / DOM elements ──────────────────────────────────── */
  var _hudEl      = null;   // "🎈 RECON UP [28s]" badge
  var _mapCanvas  = null;   // overhead minimap canvas element
  var _mapCtx     = null;   // 2D context for minimap

  /* ── Build the Three.js balloon group ───────────────────── */
  function _createBalloonGroup(startPos) {
    _lazyGeos();

    var group = new THREE.Group();
    group.position.copy(startPos);

    // Balloon sphere
    var balloonMat = new THREE.MeshLambertMaterial({ color: 0xD4A017 });
    var balloonMesh = new THREE.Mesh(_balloonGeo, balloonMat);
    balloonMesh.position.y = ROPE_HEIGHT;  // top of rope
    group.add(balloonMesh);

    // Rope cylinder
    var ropeMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var ropeMesh = new THREE.Mesh(_ropeGeo, ropeMat);
    ropeMesh.position.y = ROPE_HEIGHT * 0.5;
    group.add(ropeMesh);

    return {
      group:       group,
      balloonMesh: balloonMesh,
      balloonMat:  balloonMat,
      ropeMesh:    ropeMesh,
      ropeMat:     ropeMat,
    };
  }

  /* ── Spawn pop smoke particles ───────────────────────────── */
  function _spawnPopSmoke(pos) {
    if (!_scene) return;
    _lazyGeos();
    var particles = [];
    for (var i = 0; i < 10; i++) {
      var mat = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      });
      var mesh = new THREE.Mesh(_smokeGeo, mat);
      mesh.position.copy(pos);
      mesh.position.y += ROPE_HEIGHT;
      var s = 0.3 + Math.random() * 0.7;
      mesh.scale.setScalar(s);
      _scene.add(mesh);
      particles.push({
        mesh: mesh,
        mat:  mat,
        life: 1.5 + Math.random() * 0.8,
        maxLife: 2.0,
        vx: (Math.random() - 0.5) * 3,
        vy: 1 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 3,
      });
    }
    return particles;
  }

  /* ── Create minimap canvas overlay ──────────────────────── */
  function _createMapCanvas() {
    var existing = document.getElementById('recon-balloon-map');
    if (existing) {
      existing.style.display = 'block';
      _mapCanvas = existing;
      _mapCtx    = existing.getContext('2d');
      return;
    }
    var canvas = document.createElement('canvas');
    canvas.id     = 'recon-balloon-map';
    canvas.width  = MAP_SIZE;
    canvas.height = MAP_SIZE;
    canvas.style.cssText = (
      'position:fixed;top:12px;right:12px;' +
      'width:' + MAP_SIZE + 'px;height:' + MAP_SIZE + 'px;' +
      'border:2px solid #D4A017;border-radius:50%;' +
      'background:rgba(0,20,0,0.75);' +
      'z-index:310;pointer-events:none;'
    );
    document.body.appendChild(canvas);
    _mapCanvas = canvas;
    _mapCtx    = canvas.getContext('2d');
  }

  /* ── Hide minimap canvas ─────────────────────────────────── */
  function _hideMapCanvas() {
    if (_mapCanvas) _mapCanvas.style.display = 'none';
  }

  /* ── Draw one frame of the overhead minimap ──────────────── */
  function _drawMinimap() {
    if (!_mapCtx || !_camera) return;

    var ctx  = _mapCtx;
    var half = MAP_SIZE * 0.5;
    var range = 80;  // world units visible on each side

    ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Background circle clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(half, half, half - 1, 0, Math.PI * 2);
    ctx.clip();

    // Dark fill
    ctx.fillStyle = 'rgba(0,20,0,0.8)';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Grid lines
    ctx.strokeStyle = 'rgba(80,120,80,0.3)';
    ctx.lineWidth   = 0.5;
    var gridStep = MAP_SIZE / 4;
    for (var g = 0; g <= 4; g++) {
      ctx.beginPath();
      ctx.moveTo(g * gridStep, 0);
      ctx.lineTo(g * gridStep, MAP_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, g * gridStep);
      ctx.lineTo(MAP_SIZE, g * gridStep);
      ctx.stroke();
    }

    var ox = _camera.position.x;
    var oz = _camera.position.z;

    function worldToMap(wx, wz) {
      var px = half + (wx - ox) / range * half;
      var py = half + (wz - oz) / range * half;
      return { x: px, y: py };
    }

    // Draw enemies as red dots
    var enemyList = window.enemies;
    if (Array.isArray(enemyList)) {
      ctx.fillStyle = '#ff2222';
      for (var ei = 0; ei < enemyList.length; ei++) {
        var enemy = enemyList[ei];
        if (!enemy || !enemy.mesh) continue;
        var ep = worldToMap(enemy.mesh.position.x, enemy.mesh.position.z);
        if (ep.x < 0 || ep.x > MAP_SIZE || ep.y < 0 || ep.y > MAP_SIZE) continue;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw player as green dot at center
    ctx.fillStyle = '#22ff44';
    ctx.beginPath();
    ctx.arc(half, half, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player facing triangle
    var camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    ctx.fillStyle = '#22ff44';
    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(Math.atan2(camDir.x, camDir.z));
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Border ring
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(half, half, half - 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* ── Create / update the HUD badge ──────────────────────── */
  function _ensureHUD() {
    if (_hudEl) return;
    var el = document.createElement('div');
    el.id = 'recon-balloon-hud';
    el.style.cssText = (
      'display:none;position:fixed;bottom:420px;left:50%;' +
      'transform:translateX(-50%);' +
      'color:#D4A017;font-size:12px;font-family:monospace;' +
      'z-index:300;pointer-events:none;' +
      'background:rgba(0,0,0,0.55);padding:2px 10px;' +
      'border-radius:4px;border:1px solid #D4A017;' +
      'text-shadow:0 0 6px rgba(212,160,23,0.8);'
    );
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHUD(label) {
    _ensureHUD();
    if (!label) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.textContent = label;
    _hudEl.style.display = 'block';
  }

  /* ── Destroy the active balloon's Three.js objects ───────── */
  function _destroyBalloonObjects(b) {
    if (!b) return;
    if (_scene && b.vis && b.vis.group) {
      _scene.remove(b.vis.group);
    }
    if (b.vis) {
      if (b.vis.balloonMat && b.vis.balloonMat.dispose) b.vis.balloonMat.dispose();
      if (b.vis.ropeMat    && b.vis.ropeMat.dispose)    b.vis.ropeMat.dispose();
    }
    // Clean up pop smoke
    if (b.smokeParticles) {
      for (var i = 0; i < b.smokeParticles.length; i++) {
        var p = b.smokeParticles[i];
        if (_scene) _scene.remove(p.mesh);
        if (p.mat && p.mat.dispose) p.mat.dispose();
      }
      b.smokeParticles = [];
    }
  }

  /* ── Shoot-down / pop the balloon ────────────────────────── */
  function _popBalloon(b) {
    if (!b || b.state === 'popped') return;
    b.state = 'popped';

    // Shrink animation (handled in update loop)
    b.popTimer = 0;

    // Spawn smoke burst at balloon position
    if (b.vis && b.vis.group) {
      b.smokeParticles = _spawnPopSmoke(b.vis.group.position) || [];
    }

    // Hide minimap
    _hideMapCanvas();
    window._reconBalloonActive = false;

    // HUD notification
    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup('RECON BALLOON SHOT DOWN!', '#ff4400');
    }
    _updateHUD(null);
  }

  /* ── Register B key handler ──────────────────────────────── */
  function _attachKeyHandler() {
    if (_keyHandlerAttached) return;
    _keyHandlerAttached = true;
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyB') {
        e.preventDefault();
        deploy();
      }
    });
  }

  /* ── Public: init ────────────────────────────────────────── */
  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _balloon  = null;
    _cooldownTimer = 0;
    _usesLeft = USES_PER_LEVEL;
    window._reconBalloonActive = false;
    _ensureHUD();
    _attachKeyHandler();
  }

  /* ── Public: deploy ──────────────────────────────────────── */
  function deploy() {
    if (!_scene || !_camera) return;

    // Block if already active
    if (_balloon && (_balloon.state === 'rising' || _balloon.state === 'viewing' || _balloon.state === 'drifting')) {
      if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
        window.HUD.notifyPickup('RECON BALLOON ALREADY ACTIVE', '#D4A017');
      }
      return;
    }

    // Block if on cooldown
    if (_cooldownTimer > 0) {
      var secs = Math.ceil(_cooldownTimer);
      if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
        window.HUD.notifyPickup('RECON BALLOON COOLDOWN: ' + secs + 's', '#D4A017');
      }
      return;
    }

    // Block if out of uses
    if (_usesLeft <= 0) {
      if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
        window.HUD.notifyPickup('RECON BALLOON: NO USES LEFT THIS LEVEL', '#D4A017');
      }
      return;
    }

    _usesLeft--;
    _cooldownTimer = COOLDOWN;

    var startPos = _camera.position.clone();
    startPos.y   = Math.max(startPos.y - 1.5, 0);  // near ground/feet

    var vis = _createBalloonGroup(startPos);
    if (_scene) _scene.add(vis.group);

    _balloon = {
      vis:          vis,
      startY:       startPos.y,
      targetY:      startPos.y + ALTITUDE,
      riseTimer:    0,
      viewTimer:    0,
      popTimer:     0,
      state:        'rising',   // rising | viewing | drifting | popped | done
      smokeParticles: [],
      driftDir:     new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.3,
        (Math.random() - 0.5) * 2
      ).normalize(),
    };

    window._reconBalloonActive = false;
    _updateHUD('🎈 RECON RISING…');

    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup('RECON BALLOON DEPLOYED [B]', '#D4A017');
    }
  }

  /* ── Public: update(dt) ──────────────────────────────────── */
  function update(dt) {
    if (!dt || dt <= 0) return;

    // Tick cooldown
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer < 0) _cooldownTimer = 0;
    }

    if (!_balloon) return;

    var b = _balloon;

    // Update pop smoke particles regardless of state
    if (b.smokeParticles && b.smokeParticles.length > 0) {
      for (var si = b.smokeParticles.length - 1; si >= 0; si--) {
        var sp = b.smokeParticles[si];
        sp.life -= dt;
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        var t = Math.max(0, sp.life / sp.maxLife);
        sp.mat.opacity = t * 0.7;
        sp.mesh.scale.setScalar(0.3 + (1 - t) * 1.2);
        if (sp.life <= 0) {
          if (_scene) _scene.remove(sp.mesh);
          if (sp.mat && sp.mat.dispose) sp.mat.dispose();
          b.smokeParticles.splice(si, 1);
        }
      }
    }

    /* ── STATE: rising ─────────────────────────────────────── */
    if (b.state === 'rising') {
      b.riseTimer += dt;
      var t = Math.min(b.riseTimer / RISE_DURATION, 1);
      // Ease-out lerp
      var tEase = 1 - (1 - t) * (1 - t);
      b.vis.group.position.y = b.startY + tEase * ALTITUDE;

      // Gentle sway
      var time = (typeof performance !== 'undefined') ? performance.now() * 0.001 : 0;
      b.vis.group.position.x += Math.sin(time * 0.7) * 0.003;
      b.vis.group.position.z += Math.cos(time * 0.5) * 0.002;

      if (t >= 1) {
        // Reached altitude — switch to viewing
        b.state     = 'viewing';
        b.viewTimer = 0;
        window._reconBalloonActive = true;
        _createMapCanvas();
        _updateHUD('🎈 RECON UP [' + VIEW_DURATION + 's]');

        if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
          window.HUD.notifyPickup('RECON BALLOON AT ALTITUDE — MINIMAP ACTIVE', '#D4A017');
        }
      } else {
        var riseSecs = Math.ceil(RISE_DURATION - b.riseTimer);
        _updateHUD('🎈 RECON RISING [' + riseSecs + 's]');
      }

      // Check for AA shoot-down while rising
      _checkAAShotDown(b);
      return;
    }

    /* ── STATE: viewing ────────────────────────────────────── */
    if (b.state === 'viewing') {
      b.viewTimer += dt;

      // Gentle drift at altitude
      var time2 = (typeof performance !== 'undefined') ? performance.now() * 0.001 : 0;
      b.vis.group.position.x += Math.sin(time2 * 0.4) * 0.005;
      b.vis.group.position.z += Math.cos(time2 * 0.6) * 0.004;

      // Update minimap
      _drawMinimap();

      var remaining = Math.max(0, VIEW_DURATION - b.viewTimer);
      _updateHUD('🎈 RECON UP [' + Math.ceil(remaining) + 's]');

      // Check for AA shoot-down
      _checkAAShotDown(b);

      if (b.viewTimer >= VIEW_DURATION) {
        // Time up — balloon drifts away
        b.state = 'drifting';
        window._reconBalloonActive = false;
        _hideMapCanvas();
        _updateHUD(null);
        if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
          window.HUD.notifyPickup('RECON BALLOON DRIFTING AWAY', '#888888');
        }
      }
      return;
    }

    /* ── STATE: drifting (post-view drift-off) ─────────────── */
    if (b.state === 'drifting') {
      b.vis.group.position.x += b.driftDir.x * DRIFT_SPEED * dt;
      b.vis.group.position.y += b.driftDir.y * DRIFT_SPEED * dt;
      b.vis.group.position.z += b.driftDir.z * DRIFT_SPEED * dt;

      // Fade balloon out
      if (b.vis.balloonMat) {
        b.vis.balloonMat.transparent = true;
        b.vis.balloonMat.opacity = Math.max(0, b.vis.balloonMat.opacity - dt * 0.3);
      }
      if (b.vis.ropeMat) {
        b.vis.ropeMat.transparent = true;
        b.vis.ropeMat.opacity = Math.max(0, b.vis.ropeMat.opacity - dt * 0.3);
      }

      // Remove once fully faded
      if (b.vis.balloonMat && b.vis.balloonMat.opacity <= 0) {
        _destroyBalloonObjects(b);
        _balloon = null;
      }
      return;
    }

    /* ── STATE: popped ─────────────────────────────────────── */
    if (b.state === 'popped') {
      b.popTimer += dt;

      // Shrink balloon mesh
      if (b.vis && b.vis.balloonMesh) {
        var shrink = Math.max(0, 1 - b.popTimer * 2);
        b.vis.balloonMesh.scale.setScalar(shrink);
      }
      // Hide rope quickly
      if (b.vis && b.vis.ropeMesh) {
        b.vis.ropeMesh.visible = (b.popTimer < 0.3);
      }

      // Once smoke/shrink done, remove
      if (b.popTimer > 2.5 && (!b.smokeParticles || b.smokeParticles.length === 0)) {
        _destroyBalloonObjects(b);
        _balloon = null;
      }
      return;
    }
  }

  /* ── AA shoot-down check ─────────────────────────────────── */
  function _checkAAShotDown(b) {
    if (!b) return;

    // Check window._aaGunsFired flag set by AA gun systems
    if (window._aaGunsFired) {
      window._aaGunsFired = false;
      _popBalloon(b);
      return;
    }

    // Random chance per frame: ~0.2% per second at altitude (very low but possible)
    if (b.state === 'viewing') {
      var roll = Math.random();
      // 0.002 probability per second — multiply by approx 60fps denominator
      if (roll < 0.002 / 60) {
        _popBalloon(b);
      }
    }
  }

  /* ── Public: reset (call on level end / new level) ───────── */
  function reset() {
    if (_balloon) {
      _destroyBalloonObjects(_balloon);
      _balloon = null;
    }
    _cooldownTimer = 0;
    _usesLeft      = USES_PER_LEVEL;
    window._reconBalloonActive = false;
    _hideMapCanvas();
    _updateHUD(null);
  }

  /* ── Expose public API ───────────────────────────────────── */
  return {
    init:   init,
    update: update,
    deploy: deploy,
    reset:  reset,
  };

})();
