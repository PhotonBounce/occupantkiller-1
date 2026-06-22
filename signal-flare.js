// ============================================================
//  signal-flare.js — Signal flare: mark targets for precision fire support
//  Player throws a signal flare (F6) to mark a ground position for 10s.
//  - RadioSupport airstrike targets the flare position if active
//  - EnemyAirstrike and MortarEmplacement can use the flare as auto-target
//  - Enemies near active flare become more aggressive
//  Public API: init(scene, camera, renderer), update(dt), throwFlare(),
//              getActive(), reset()
// ============================================================
window.SignalFlare = (function () {
  'use strict';

  /* ── Private state ───────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  var _flares   = [];        // active flare objects (max 2)
  var _MAX_FLARES = 2;
  var _BURN_DURATION = 10;   // seconds
  var _FLICKER_START = 3;    // last N seconds flicker

  var _hudEl    = null;      // HUD countdown element
  var _markersEl = null;     // screen marker container

  /* ── Geometries / materials (shared, lazy created) ─────── */
  var _bodyGeo  = null;
  var _flameGeo = null;
  var _smokeGeo = null;

  /* ── Key binding registration ───────────────────────────── */
  var _keyHandlerAttached = false;

  /* ── Helpers ─────────────────────────────────────────────── */
  function _lazyGeos() {
    if (!_bodyGeo)  _bodyGeo  = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
    if (!_flameGeo) _flameGeo = new THREE.SphereGeometry(0.08, 6, 6);
    if (!_smokeGeo) _smokeGeo = new THREE.SphereGeometry(0.06, 4, 4);
  }

  function _makeFlareVisual() {
    _lazyGeos();
    var group = new THREE.Group();

    // Red cylinder body
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc1111 });
    var body = new THREE.Mesh(_bodyGeo, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Bright flame sphere at top
    var flameMat = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
    var flame = new THREE.Mesh(_flameGeo, flameMat);
    flame.position.y = 0.28;
    group.add(flame);

    // Point light for orange glow
    var light = new THREE.PointLight(0xFF4400, 3, 5);
    light.position.y = 0.28;
    group.add(light);

    return { group: group, flame: flame, light: light, bodyMat: bodyMat, flameMat: flameMat };
  }

  /* ── Create a single flare object (in-flight) ───────────── */
  function _createFlare(pos, dir) {
    var vis = _makeFlareVisual();
    var group = vis.group;

    // Start at camera eye slightly forward
    group.position.copy(pos);
    group.position.y -= 0.1; // slightly below eye level

    if (_scene) _scene.add(group);

    return {
      group:      group,
      flame:      vis.flame,
      light:      vis.light,
      bodyMat:    vis.bodyMat,
      flameMat:   vis.flameMat,
      // physics
      vx:         dir.x * 10,
      vy:         8,
      vz:         dir.z * 10,
      landed:     false,
      // burn
      burnTimer:  0,
      active:     true,
      // smoke particles
      smokeParticles: [],
      smokeTimer: 0,
      // screen marker DOM element (created after landing)
      markerEl:   null,
      // position reference for external systems
      position:   group.position,
    };
  }

  /* ── Spawn a smoke particle rising above flare ──────────── */
  function _spawnSmoke(flare) {
    if (!_scene) return;
    _lazyGeos();
    var mat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    var mesh = new THREE.Mesh(_smokeGeo, mat);
    mesh.position.copy(flare.group.position);
    mesh.position.y += 0.3;
    var s = 0.5 + Math.random() * 0.5;
    mesh.scale.set(s, s, s);
    _scene.add(mesh);
    flare.smokeParticles.push({ mesh: mesh, mat: mat, life: 2, maxLife: 2 });
    // Cap per flare
    if (flare.smokeParticles.length > 20) {
      var old = flare.smokeParticles.shift();
      if (_scene) _scene.remove(old.mesh);
      if (old.mat && old.mat.dispose) old.mat.dispose();
    }
  }

  /* ── Update smoke particles for one flare ───────────────── */
  function _updateSmoke(flare, dt) {
    for (var i = flare.smokeParticles.length - 1; i >= 0; i--) {
      var p = flare.smokeParticles[i];
      p.life -= dt;
      p.mesh.position.y += 0.2 * dt;
      p.mesh.position.x += (Math.random() - 0.5) * 0.02;
      p.mesh.position.z += (Math.random() - 0.5) * 0.02;
      var t = Math.max(0, p.life / p.maxLife);
      p.mat.opacity = t * 0.5;
      p.mesh.scale.setScalar(0.5 + (1 - t) * 0.8);
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        if (p.mat && p.mat.dispose) p.mat.dispose();
        flare.smokeParticles.splice(i, 1);
      }
    }
  }

  /* ── Remove all Three.js objects for a flare ────────────── */
  function _destroyFlare(flare) {
    if (_scene && flare.group) _scene.remove(flare.group);
    for (var i = 0; i < flare.smokeParticles.length; i++) {
      var p = flare.smokeParticles[i];
      if (_scene) _scene.remove(p.mesh);
      if (p.mat && p.mat.dispose) p.mat.dispose();
    }
    flare.smokeParticles = [];
    if (flare.bodyMat  && flare.bodyMat.dispose)  flare.bodyMat.dispose();
    if (flare.flameMat && flare.flameMat.dispose) flare.flameMat.dispose();
    if (flare.markerEl && flare.markerEl.parentNode) {
      flare.markerEl.parentNode.removeChild(flare.markerEl);
      flare.markerEl = null;
    }
    flare.active = false;
  }

  /* ── Create / update screen-space 2D marker for a flare ─── */
  function _ensureMarkerEl(flare) {
    if (flare.markerEl) return;
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:290;font-size:14px;font-family:monospace;color:#ff4444;text-shadow:0 0 6px rgba(255,68,68,0.8);display:none;transform:translateX(-50%);';
    el.innerHTML = '&#x1F534;';
    (_markersEl || document.body).appendChild(el);
    flare.markerEl = el;
  }

  function _updateMarker(flare) {
    if (!flare.markerEl || !_camera || !_renderer) return;
    var el = flare.markerEl;
    var pos = flare.group.position.clone();
    pos.project(_camera);
    // Only show if in front of camera (z < 1) and within screen bounds
    if (pos.z >= 1 || pos.x < -1.1 || pos.x > 1.1 || pos.y < -1.1 || pos.y > 1.1) {
      el.style.display = 'none';
      return;
    }
    var w = window.innerWidth;
    var h = window.innerHeight;
    var sx = (pos.x * 0.5 + 0.5) * w;
    var sy = (-pos.y * 0.5 + 0.5) * h;
    // Distance in "meters" (game units ≈ metres)
    var dist = 0;
    if (_camera) {
      dist = _camera.position.distanceTo(flare.group.position);
    }
    var remaining = Math.max(0, _BURN_DURATION - flare.burnTimer).toFixed(1);
    el.style.display = 'block';
    el.style.left = sx + 'px';
    el.style.top  = (sy - 20) + 'px';
    el.innerHTML = '&#x1F534; ' + Math.round(dist) + 'm';
  }

  /* ── Update the HUD countdown element ───────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    // Find the flare with the most time remaining
    var best = null;
    for (var i = 0; i < _flares.length; i++) {
      var f = _flares[i];
      if (f.active && f.landed) {
        if (!best || f.burnTimer < best.burnTimer) best = f;
      }
    }
    if (!best) {
      _hudEl.style.display = 'none';
      return;
    }
    var rem = Math.max(0, _BURN_DURATION - best.burnTimer);
    _hudEl.textContent = 'FLARE: ' + rem.toFixed(1) + 's';
    _hudEl.style.display = 'block';
  }

  /* ── Update global _activeFlarePosition window variable ──── */
  function _updateActiveFlareGlobal() {
    var best = null;
    for (var i = 0; i < _flares.length; i++) {
      var f = _flares[i];
      if (f.active && f.landed) {
        if (!best || f.burnTimer < best.burnTimer) best = f;
      }
    }
    window._activeFlarePosition = best ? best.group.position : null;
  }

  /* ── Update enemy aggression near flares ────────────────── */
  function _updateEnemyReaction() {
    if (typeof window.enemies === 'undefined') return;
    var enemyList = window.enemies;
    if (!Array.isArray(enemyList)) return;
    for (var ei = 0; ei < enemyList.length; ei++) {
      var enemy = enemyList[ei];
      if (!enemy || !enemy.mesh) continue;
      var epos = enemy.mesh.position;
      var nearFlare = null;
      for (var fi = 0; fi < _flares.length; fi++) {
        var fl = _flares[fi];
        if (!fl.active || !fl.landed) continue;
        var dx = epos.x - fl.group.position.x;
        var dz = epos.z - fl.group.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= 15) {
          nearFlare = fl;
          break;
        }
      }
      if (nearFlare) {
        enemy._flareTarget = nearFlare.group.position;
      } else {
        if (enemy._flareTarget) enemy._flareTarget = null;
      }
    }
  }

  /* ── Register keydown handler for F6 ────────────────────── */
  function _attachKeyHandler() {
    if (_keyHandlerAttached) return;
    _keyHandlerAttached = true;
    document.addEventListener('keydown', function (e) {
      if (e.code === 'F6') {
        e.preventDefault();
        throwFlare();
      }
    });
  }

  /* ── Public: init ────────────────────────────────────────── */
  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _flares   = [];

    // HUD element
    var existing = document.getElementById('signal-flare-hud');
    if (!existing) {
      var el = document.createElement('div');
      el.id = 'signal-flare-hud';
      el.style.cssText = 'display:none;position:fixed;bottom:395px;left:50%;transform:translateX(-50%);' +
        'color:#ff4400;font-size:11px;font-family:monospace;z-index:200;pointer-events:none;' +
        'background:rgba(0,0,0,0.5);padding:2px 8px;border-radius:3px;border:1px solid #ff4400;';
      document.body.appendChild(el);
      _hudEl = el;
    } else {
      _hudEl = existing;
    }

    // Marker container
    var mc = document.getElementById('signal-flare-markers');
    if (!mc) {
      mc = document.createElement('div');
      mc.id = 'signal-flare-markers';
      mc.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:289;';
      document.body.appendChild(mc);
    }
    _markersEl = mc;

    _attachKeyHandler();
    window._activeFlarePosition = null;
  }

  /* ── Public: throwFlare ──────────────────────────────────── */
  function throwFlare() {
    if (!_scene || !_camera) return;
    if (_flares.length >= _MAX_FLARES) {
      // Remove the oldest flare to make room
      _destroyFlare(_flares[0]);
      _flares.splice(0, 1);
    }

    // Direction from camera look
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    var startPos = _camera.position.clone();

    var flare = _createFlare(startPos, dir);
    _flares.push(flare);

    // Notify HUD
    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup('SIGNAL FLARE THROWN [F6]', '#ff4400');
    }
  }

  /* ── Public: update(dt) ──────────────────────────────────── */
  function update(dt) {
    if (!dt || dt <= 0) return;

    var time = (typeof performance !== 'undefined') ? performance.now() * 0.001 : 0;

    for (var i = _flares.length - 1; i >= 0; i--) {
      var f = _flares[i];
      if (!f.active) {
        _flares.splice(i, 1);
        continue;
      }

      if (!f.landed) {
        // ── In-flight physics ──
        f.vx += 0;        // no horizontal drag for simplicity
        f.vy -= 9.8 * dt;
        f.group.position.x += f.vx * dt;
        f.group.position.y += f.vy * dt;
        f.group.position.z += f.vz * dt;

        // Tumble rotation while flying
        f.group.rotation.x += dt * 4;
        f.group.rotation.z += dt * 3;

        // Landing check — Y ≤ 0 (or terrain height if available)
        var groundY = 0;
        if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
          groundY = VoxelWorld.getTerrainHeight(f.group.position.x, f.group.position.z) || 0;
        }
        if (f.group.position.y <= groundY) {
          f.group.position.y = groundY;
          f.landed = true;
          f.group.rotation.set(0, Math.random() * Math.PI * 2, 0);

          // Create screen marker element
          _ensureMarkerEl(f);
        }
      } else {
        // ── Burning on ground ──
        f.burnTimer += dt;

        if (f.burnTimer >= _BURN_DURATION) {
          // Flare burned out
          _destroyFlare(f);
          _flares.splice(i, 1);
          continue;
        }

        var remaining = _BURN_DURATION - f.burnTimer;

        // Flame pulse animation
        var pulseFq = 3 + Math.sin(time * 1.5) * 0.5;
        var pulseScale = 0.8 + Math.sin(time * pulseFq) * 0.25;
        f.flame.scale.setScalar(pulseScale);

        // Flickering in last 3 seconds
        var intensity;
        if (remaining <= _FLICKER_START) {
          intensity = 0.5 + Math.abs(Math.sin(time * 12)) * 2.5;
        } else {
          intensity = 3;
        }
        f.light.intensity = intensity;

        // Smoke emission every 0.3 s
        f.smokeTimer += dt;
        if (f.smokeTimer >= 0.3) {
          f.smokeTimer = 0;
          _spawnSmoke(f);
        }

        // Update smoke particles
        _updateSmoke(f, dt);

        // Update 2D screen marker
        _updateMarker(f);
      }
    }

    // Update global pointer + HUD + enemy reaction
    _updateActiveFlareGlobal();
    _updateHUD();
    _updateEnemyReaction();
  }

  /* ── Public: getActive ───────────────────────────────────── */
  function getActive() {
    var result = [];
    for (var i = 0; i < _flares.length; i++) {
      if (_flares[i].active && _flares[i].landed) result.push(_flares[i]);
    }
    return result;
  }

  /* ── Public: reset ───────────────────────────────────────── */
  function reset() {
    for (var i = 0; i < _flares.length; i++) {
      _destroyFlare(_flares[i]);
    }
    _flares = [];
    window._activeFlarePosition = null;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ── Expose public API ───────────────────────────────────── */
  return {
    init:       init,
    update:     update,
    throwFlare: throwFlare,
    getActive:  getActive,
    reset:      reset,
  };

})();
