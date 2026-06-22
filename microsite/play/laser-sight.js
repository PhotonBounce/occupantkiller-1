window.LaserSight = (function() {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────
  var _enabled = false;           // public — whether laser is active
  var _battery = 100;             // 0-100 %
  var _scene = null;
  var _camera = null;

  // Three.js objects
  var _beam = null;               // CylinderGeometry mesh
  var _dot = null;                // SphereGeometry mesh
  var _beamMaterial = null;
  var _dotMaterial = null;

  // HUD elements
  var _hudBadge = null;
  var _batteryWarning = null;

  // Audio
  var _audioCtx = null;
  var _oscillator = null;
  var _gainNode = null;

  // Constants
  var RANGE = 20;
  var MARCH_STEP = 0.2;
  var MAX_STEPS = 100;            // RANGE / MARCH_STEP = 100
  var DRAIN_RATE = 0.3;           // % per second when on
  var CHARGE_RATE = 1.0;          // % per second when off
  var LOW_BATTERY = 10;
  var SPREAD_REDUCTION = 0.30;    // 30 %
  var ALERT_RADIUS = 15;
  var ALERT_ANGLE_COS = Math.cos(60 * Math.PI / 180); // ±60 deg

  // Temporary vectors (reused to avoid per-frame allocations)
  var _tmpOrigin = null;
  var _tmpDir = null;

  // ── Internal helpers ─────────────────────────────────────────────────────

  function _initTmpVectors() {
    if (typeof THREE === 'undefined') return;
    _tmpOrigin = new THREE.Vector3();
    _tmpDir    = new THREE.Vector3();
  }

  // Ray-march along direction from origin; return hit distance or RANGE
  function _rayMarch(ox, oy, oz, dx, dy, dz) {
    var px = ox, py = oy, pz = oz;
    var i, solid;
    for (i = 0; i < MAX_STEPS; i++) {
      px += dx * MARCH_STEP;
      py += dy * MARCH_STEP;
      pz += dz * MARCH_STEP;
      solid = false;
      if (window.VoxelWorld && window.VoxelWorld.isSolid) {
        solid = window.VoxelWorld.isSolid(px, py, pz);
      } else if (typeof window.isSolid === 'function') {
        solid = window.isSolid(px, py, pz);
      }
      if (solid) {
        return (i + 1) * MARCH_STEP;
      }
    }
    return RANGE;
  }

  // ── Mesh creation ─────────────────────────────────────────────────────────

  function _createBeam() {
    if (typeof THREE === 'undefined') return;
    var geo = new THREE.CylinderGeometry(0.004, 0.004, RANGE, 4);
    // Pivot at bottom so we can position from origin then scale
    geo.translate(0, RANGE / 2, 0);
    _beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    _beam = new THREE.Mesh(geo, _beamMaterial);
    _beam.visible = false;
    if (_scene) _scene.add(_beam);
  }

  function _createDot() {
    if (typeof THREE === 'undefined') return;
    var geo = new THREE.SphereGeometry(0.04, 6, 6);
    _dotMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      depthWrite: false
    });
    _dot = new THREE.Mesh(geo, _dotMaterial);
    _dot.visible = false;
    if (_scene) _scene.add(_dot);
  }

  function _addMeshesToScene() {
    if (!_scene) return;
    if (_beam && !_beam.parent) _scene.add(_beam);
    if (_dot && !_dot.parent) _scene.add(_dot);
  }

  function _removeMeshesFromScene() {
    if (_beam && _beam.parent) _beam.parent.remove(_beam);
    if (_dot && _dot.parent) _dot.parent.remove(_dot);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function _createHUD() {
    // LASER ON badge
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'laser-badge';
    _hudBadge.style.cssText = [
      'position:fixed;bottom:80px;right:16px;',
      'font-family:monospace;font-size:11px;font-weight:bold;',
      'color:#00ff44;background:rgba(0,0,0,0.55);',
      'padding:3px 7px;border:1px solid #00ff44;border-radius:3px;',
      'pointer-events:none;z-index:7100;display:none;',
      'letter-spacing:1px;',
      'text-shadow:0 0 6px rgba(0,255,68,0.7);'
    ].join('');
    _hudBadge.textContent = 'LASER ON';
    document.body.appendChild(_hudBadge);

    // LASER LOW warning
    _batteryWarning = document.createElement('div');
    _batteryWarning.id = 'laser-low';
    _batteryWarning.style.cssText = [
      'position:fixed;bottom:98px;right:16px;',
      'font-family:monospace;font-size:10px;',
      'color:#ffaa00;background:rgba(0,0,0,0.55);',
      'padding:2px 6px;border:1px solid #ffaa00;border-radius:3px;',
      'pointer-events:none;z-index:7100;display:none;',
      'letter-spacing:1px;'
    ].join('');
    _batteryWarning.textContent = 'LASER LOW';
    document.body.appendChild(_batteryWarning);
  }

  function _showHUD() {
    if (_hudBadge) _hudBadge.style.display = 'block';
  }

  function _hideHUD() {
    if (_hudBadge) _hudBadge.style.display = 'none';
    if (_batteryWarning) _batteryWarning.style.display = 'none';
  }

  // ── Audio ────────────────────────────────────────────────────────────────

  function _startHum() {
    try {
      if (_oscillator) return; // already running
      _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      _oscillator = _audioCtx.createOscillator();
      _gainNode   = _audioCtx.createGain();
      _oscillator.type = 'sine';
      _oscillator.frequency.setValueAtTime(5000, _audioCtx.currentTime);
      _gainNode.gain.setValueAtTime(0.0, _audioCtx.currentTime);
      _gainNode.gain.linearRampToValueAtTime(0.1, _audioCtx.currentTime + 0.05);
      _oscillator.connect(_gainNode);
      _gainNode.connect(_audioCtx.destination);
      _oscillator.start();
    } catch (e) {
      // audio not available — silently ignore
    }
  }

  function _stopHum() {
    try {
      if (_oscillator) {
        _gainNode.gain.linearRampToValueAtTime(0.0, _audioCtx.currentTime + 0.05);
        var osc = _oscillator;
        _oscillator = null;
        setTimeout(function() {
          try { osc.stop(); osc.disconnect(); } catch (e2) { /* ignore */ }
        }, 100);
      }
    } catch (e) {
      // ignore
    }
  }

  // ── Accuracy bonus (external hook) ───────────────────────────────────────

  // Weapons/game-manager can call LaserSight.getSpreadMultiplier() to apply bonus
  function getSpreadMultiplier() {
    // Only apply bonus when laser is on and NOT ADS
    var ads = !!(window._adsActive ||
                 (window.GameManager && window.GameManager.isADS && window.GameManager.isADS()));
    if (_enabled && !ads && _battery > 0) {
      return 1 - SPREAD_REDUCTION;
    }
    return 1;
  }

  // ── Enemy alerting ────────────────────────────────────────────────────────

  function _alertEnemiesNearLaser(ox, oy, oz, dx, dy, dz, hitDist) {
    var enemies = null;
    var i, e, dist, ex, ey, ez, laserEndX, laserEndY, laserEndZ, dex, dey, dez, dotDist, enx, eny, enz, dotProd;

    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      enemies = window.Enemies.getAll();
    } else if (typeof window._enemies !== 'undefined') {
      enemies = window._enemies;
    }
    if (!enemies) return;

    laserEndX = ox + dx * hitDist;
    laserEndY = oy + dy * hitDist;
    laserEndZ = oz + dz * hitDist;

    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e || e.dead || !e.alive || !e.mesh) continue;

      ex = e.mesh.position.x - ox;
      ey = e.mesh.position.y - oy;
      ez = e.mesh.position.z - oz;
      dist = Math.sqrt(ex * ex + ey * ey + ez * ez);

      // Check if laser dot is on/near enemy
      dex = e.mesh.position.x - laserEndX;
      dey = e.mesh.position.y - laserEndY;
      dez = e.mesh.position.z - laserEndZ;
      dotDist = Math.sqrt(dex * dex + dey * dey + dez * dez);
      if (dotDist < 1.5) {
        e._laserSpotted = true;
        e.playerSpotted = true;
        continue;
      }

      // Stealth penalty: enemy within 15 units that could see the laser
      if (dist > ALERT_RADIUS) continue;

      // Dot product of (enemy direction from player) with laser direction
      enx = ex / dist;
      eny = ey / dist;
      enz = ez / dist;
      dotProd = enx * dx + eny * dy + enz * dz;
      if (dotProd > ALERT_ANGLE_COS) {
        e._laserSpotted = true;
        e.playerSpotted = true;
      }
    }
  }

  // ── Beam positioning ──────────────────────────────────────────────────────

  function _updateBeamTransform(camera) {
    if (!_beam || !_dot || !camera) return;
    if (typeof THREE === 'undefined') return;

    var axis, scale, hitDist;
    var ox, oy, oz, dx, dy, dz;

    // Camera world position and direction
    camera.getWorldPosition(_tmpOrigin);
    camera.getWorldDirection(_tmpDir);

    ox = _tmpOrigin.x;
    oy = _tmpOrigin.y;
    oz = _tmpOrigin.z;
    dx = _tmpDir.x;
    dy = _tmpDir.y;
    dz = _tmpDir.z;

    // Ray-march to find hit distance
    hitDist = _rayMarch(ox, oy, oz, dx, dy, dz);

    // Position beam at camera origin; geometry extends along +Y from origin
    _beam.position.copy(_tmpOrigin);

    // Rotate cylinder to align with camera direction
    axis = new THREE.Vector3(0, 1, 0);
    _beam.quaternion.setFromUnitVectors(axis, _tmpDir);

    // Scale beam to actual hit distance
    scale = hitDist / RANGE;
    _beam.scale.set(1, scale, 1);
    _beam.visible = true;

    // Dot at beam end
    _dot.position.set(
      ox + dx * hitDist,
      oy + dy * hitDist,
      oz + dz * hitDist
    );
    _dot.visible = true;

    // Alert enemies near the laser
    _alertEnemiesNearLaser(ox, oy, oz, dx, dy, dz, hitDist);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init(camera, scene) {
    _camera = camera || null;
    _scene  = scene  || null;
    _battery = 100;
    _enabled = false;
    window._laserEnabled = false;

    _initTmpVectors();
    _createBeam();
    _createDot();
    _createHUD();

    // Shift+L toggles laser (bare L is taken by crosshair-config / game-manager)
    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyL' && e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggle();
      }
    });
  }

  function toggle() {
    if (_battery <= 0 && !_enabled) {
      // Flash "battery dead" in warning slot
      if (_batteryWarning) {
        _batteryWarning.textContent = 'LASER DEAD';
        _batteryWarning.style.color = '#ff4444';
        _batteryWarning.style.borderColor = '#ff4444';
        _batteryWarning.style.display = 'block';
        setTimeout(function() {
          if (_batteryWarning) {
            _batteryWarning.style.display = 'none';
            _batteryWarning.style.color = '#ffaa00';
            _batteryWarning.style.borderColor = '#ffaa00';
            _batteryWarning.textContent = 'LASER LOW';
          }
        }, 2000);
      }
      return;
    }

    _enabled = !_enabled;
    window._laserEnabled = _enabled;

    if (_enabled) {
      _addMeshesToScene();
      _showHUD();
      _startHum();
    } else {
      if (_beam) _beam.visible = false;
      if (_dot)  _dot.visible  = false;
      _hideHUD();
      _stopHum();
    }
  }

  function update(dt, camera, scene) {
    // Allow late-binding of camera/scene
    if (camera) _camera = camera;
    if (scene && scene !== _scene) {
      _scene = scene;
      _addMeshesToScene();
    }

    if (_enabled && _battery > 0) {
      // Drain battery
      _battery = Math.max(0, _battery - DRAIN_RATE * dt);

      // Low battery warning
      if (_batteryWarning) {
        if (_battery <= LOW_BATTERY && _battery > 0) {
          _batteryWarning.textContent = 'LASER LOW';
          _batteryWarning.style.color = '#ffaa00';
          _batteryWarning.style.borderColor = '#ffaa00';
          _batteryWarning.style.display = 'block';
        } else {
          _batteryWarning.style.display = 'none';
        }
      }

      // Auto-off when battery depleted
      if (_battery <= 0) {
        _enabled = false;
        window._laserEnabled = false;
        if (_beam) _beam.visible = false;
        if (_dot)  _dot.visible  = false;
        _hideHUD();
        _stopHum();
        return;
      }

      // Reposition beam this frame
      _updateBeamTransform(_camera);

    } else if (!_enabled) {
      // Recharge when off
      _battery = Math.min(100, _battery + CHARGE_RATE * dt);
    }
  }

  function reset() {
    _enabled = false;
    window._laserEnabled = false;

    _stopHum();
    _hideHUD();

    if (_beam) _beam.visible = false;
    if (_dot)  _dot.visible  = false;
    _removeMeshesFromScene();

    _battery = 100;
  }

  return {
    init:                init,
    update:              update,
    toggle:              toggle,
    reset:               reset,
    getSpreadMultiplier: getSpreadMultiplier,
    getBattery:          function() { return _battery; },
    isEnabled:           function() { return _enabled; }
  };
})();
