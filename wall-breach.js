// ============================================================
//  wall-breach.js — Building entry breach / explosive door system
//  Features:
//    1. Place breach charge on wall in front of player (F5)
//    2. Detonate (F5 again) — 0.5s delay, 2x3 voxel gap, particles, screen shake
//    3. Slow-motion entry — 1.2s at 0.25x bullet time on detonation
//    4. Flash-bang through hole — white flash + stun enemies within 6m
//    5. Breach shotgun mode — _weaponSpread = 0.18 during entry window
//    6. Multiple charges — 2 per wave, 30s cooldown each
//    7. Rubble — 6 BoxGeometry pieces that fall and settle
//    8. Wall detection — raycast 3m forward, only place on solid voxel
//  Public API: init, update, place, reset
// ============================================================
window.WallBreach = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  var _charges = [];          // active charge objects in scene
  var _chargesAvail = 2;      // charges remaining this wave
  var _cooldowns = [0, 0];    // per-slot cooldown timers (seconds)
  var COOLDOWN_TIME = 30;     // seconds between recharges

  var _pendingDetonation = false;   // waiting for 0.5s delay
  var _detonationTimer = 0;
  var _detonationData = null;       // {charge, hitPos} saved for detonation callback

  var _entryWindowTimer = 0;        // remaining slow-mo / shotgun window (seconds)
  var ENTRY_WINDOW = 1.2;           // seconds of slow-mo after breach

  var _rubblePieces = [];           // {mesh, vy, settled} for physics
  var _particles = [];              // {mesh, vx, vy, vz, life, maxLife}

  // HUD element created at init
  var _hudEl = null;
  var _promptEl = null;

  // ── Tan/khaki material for charge ────────────────────────
  var TAN_COLOR = 0xc2a97d;

  // ── Helpers ──────────────────────────────────────────────
  function _getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      (window.camera) ||
      null;
  }

  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      (window.scene) ||
      null;
  }

  function _showPrompt(text) {
    if (!_promptEl) {
      _promptEl = document.createElement('div');
      _promptEl.style.cssText = [
        'position:fixed',
        'bottom:180px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.72)',
        'border:1px solid rgba(210,180,80,0.8)',
        'color:#e8c840',
        'padding:6px 18px',
        'border-radius:5px',
        'font-size:13px',
        'font-family:monospace',
        'z-index:300',
        'pointer-events:none',
        'text-align:center',
        'letter-spacing:1px'
      ].join(';');
      document.body.appendChild(_promptEl);
    }
    _promptEl.textContent = text;
    _promptEl.style.display = text ? 'block' : 'none';
  }

  function _hidePrompt() {
    if (_promptEl) _promptEl.style.display = 'none';
  }

  function _updateHUD() {
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'wall-breach-hud';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:240px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.6)',
        'border:1px solid rgba(210,140,40,0.6)',
        'color:#d4a830',
        'padding:4px 14px',
        'border-radius:4px',
        'font-size:11px',
        'font-family:monospace',
        'z-index:299',
        'pointer-events:none',
        'letter-spacing:1px'
      ].join(';');
      document.body.appendChild(_hudEl);
    }
    var cd0 = _cooldowns[0] > 0 ? Math.ceil(_cooldowns[0]) + 's' : 'RDY';
    var cd1 = _cooldowns[1] > 0 ? Math.ceil(_cooldowns[1]) + 's' : 'RDY';
    _hudEl.textContent = 'BREACH [F5]  C1:' + cd0 + '  C2:' + cd1;
    _hudEl.style.display = 'block';
  }

  // ── Raycasting wall detection ─────────────────────────────
  function _castForwardRay(cam, dist) {
    // Returns {hit:bool, point:THREE.Vector3, blockX, blockY, blockZ}
    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    var origin = cam.position.clone();
    var hitPoint = origin.clone().addScaledVector(dir, dist);

    // Check VoxelWorld for a solid block at that position
    if (window.VoxelWorld) {
      var bx = Math.round(hitPoint.x);
      var by = Math.round(hitPoint.y);
      var bz = Math.round(hitPoint.z);
      // Try getBlock first, then isSolid
      var isSolid = false;
      try {
        if (typeof window.VoxelWorld.getBlock === 'function') {
          isSolid = !!window.VoxelWorld.getBlock(bx, by, bz);
        } else if (typeof window.VoxelWorld.isSolid === 'function') {
          isSolid = window.VoxelWorld.isSolid(bx, by, bz);
        } else if (typeof window.VoxelWorld.getVoxel === 'function') {
          isSolid = !!window.VoxelWorld.getVoxel(bx, by, bz);
        } else {
          // Fallback: assume there's a wall (permissive)
          isSolid = true;
        }
      } catch (e) {
        isSolid = true;
      }
      return { hit: isSolid, point: hitPoint, bx: bx, by: by, bz: bz };
    }
    // No VoxelWorld — allow placement anyway (permissive fallback)
    return { hit: true, point: hitPoint, bx: Math.round(hitPoint.x), by: Math.round(hitPoint.y), bz: Math.round(hitPoint.z) };
  }

  // ── Charge mesh ──────────────────────────────────────────
  function _makeChargeMesh() {
    var geo = new THREE.OctahedronGeometry(1, 0);
    var mat = new THREE.MeshLambertMaterial({ color: TAN_COLOR });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(0.3, 0.05, 0.3);
    return mesh;
  }

  // ── Particle burst ───────────────────────────────────────
  function _spawnParticles(scene, pos) {
    for (var i = 0; i < 18; i++) {
      var geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      var col = (i % 3 === 0) ? 0xff6600 : (i % 3 === 1) ? 0xffaa00 : 0x888888;
      var mat = new THREE.MeshBasicMaterial({ color: col });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      var speed = 2.5 + Math.random() * 4;
      var angle = Math.random() * Math.PI * 2;
      var vangle = (Math.random() - 0.5) * Math.PI;
      _particles.push({
        mesh: mesh,
        vx: Math.cos(angle) * Math.cos(vangle) * speed,
        vy: Math.abs(Math.sin(vangle)) * speed + 1.5,
        vz: Math.sin(angle) * Math.cos(vangle) * speed,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5
      });
    }
  }

  // ── Screen shake ─────────────────────────────────────────
  var _shakeTimer = 0;
  var _shakeIntensity = 0;

  function _triggerScreenShake(intensity, duration) {
    _shakeTimer = duration;
    _shakeIntensity = intensity;
  }

  function _applyScreenShake(dt, cam) {
    if (_shakeTimer <= 0 || !cam) return;
    _shakeTimer -= dt;
    var amt = _shakeIntensity * (_shakeTimer / 0.35);
    cam.position.x += (Math.random() - 0.5) * amt;
    cam.position.y += (Math.random() - 0.5) * amt;
    if (_shakeTimer < 0) _shakeTimer = 0;
  }

  // ── Rubble ───────────────────────────────────────────────
  function _spawnRubble(scene, pos) {
    for (var i = 0; i < 6; i++) {
      var w = 0.2 + Math.random() * 0.35;
      var h = 0.15 + Math.random() * 0.25;
      var d = 0.2 + Math.random() * 0.35;
      var geo = new THREE.BoxGeometry(w, h, d);
      var shade = Math.floor(0x55 + Math.random() * 0x44);
      var col = (shade << 16) | (shade << 8) | shade;
      var mat = new THREE.MeshLambertMaterial({ color: col });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 1.8,
        pos.y + 0.5 + Math.random() * 0.8,
        pos.z + (Math.random() - 0.5) * 1.8
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(mesh);
      _rubblePieces.push({
        mesh: mesh,
        vy: -(1 + Math.random() * 2),
        settled: false,
        groundY: 0
      });
    }
  }

  // ── Flash-bang overlay ───────────────────────────────────
  var _flashTimer = 0;
  var _flashEl = null;

  function _triggerFlashBang(enemies) {
    // Use existing flashbang-overlay if present, else create one
    _flashEl = document.getElementById('flashbang-overlay');
    if (!_flashEl) {
      _flashEl = document.createElement('div');
      _flashEl.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:#fff',
        'opacity:0',
        'pointer-events:none',
        'z-index:201',
        'transition:opacity 0.05s'
      ].join(';');
      document.body.appendChild(_flashEl);
    }
    _flashEl.style.opacity = '0.8';
    _flashTimer = 1.5;

    // Stun enemies within 6m
    if (enemies && enemies.length) {
      var cam = _getCamera();
      var px = cam ? cam.position.x : 0;
      var py = cam ? cam.position.y : 0;
      var pz = cam ? cam.position.z : 0;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || e.dead || e.health <= 0) continue;
        var ep = e.position || (e.mesh && e.mesh.position);
        if (!ep) continue;
        var dx = ep.x - px, dy = ep.y - py, dz = ep.z - pz;
        var dist2 = dx * dx + dy * dy + dz * dz;
        if (dist2 <= 36) { // 6m radius
          e.stunned = true;
          e.stunnedTimer = 2.5;
        }
      }
    }

    // Play flashbang audio if available
    try {
      if (window.AudioSystem && window.AudioSystem.playFlashbang) {
        window.AudioSystem.playFlashbang();
      }
    } catch (e2) {}
  }

  // ── Voxel removal (2 wide x 3 tall door pattern) ─────────
  function _removeVoxels(bx, by, bz) {
    if (!window.VoxelWorld || typeof window.VoxelWorld.removeBlock !== 'function') return;
    // Door: 2 wide, 3 tall centred on hit point
    // We remove in X-axis width, Y-axis height
    for (var dy = -1; dy <= 1; dy++) {       // 3 tall
      for (var dx = -1; dx <= 0; dx++) {     // 2 wide
        try {
          window.VoxelWorld.removeBlock(bx + dx, by + dy, bz);
          // Also try Z-axis variant in case wall faces differently
          window.VoxelWorld.removeBlock(bx, by + dy, bz + dx);
        } catch (e) {}
      }
    }
  }

  // ── Detonation logic ─────────────────────────────────────
  function _detonate(charge, hitPos) {
    var scene = _getScene();
    if (!scene) return;

    // Remove charge mesh from scene
    scene.remove(charge.mesh);
    charge.detonated = true;

    // Remove voxel blocks
    _removeVoxels(charge.bx, charge.by, charge.bz);

    // Particle burst + screen shake
    _spawnParticles(scene, hitPos);
    _triggerScreenShake(0.18, 0.35);

    // Spawn rubble
    _spawnRubble(scene, hitPos);

    // Play explosion sound
    try {
      if (window.AudioSystem && window.AudioSystem.playExplosion) {
        window.AudioSystem.playExplosion();
      }
    } catch (e) {}

    // Slow-motion entry — 1.2s at 0.25x bullet time
    window._bulletTimeScale = 0.25;
    _entryWindowTimer = ENTRY_WINDOW;

    // Override weapon spread for entry window
    window._weaponSpread = 0.18;

    // Flash-bang through hole — stun enemies
    var enemies = _getEnemies();
    _triggerFlashBang(enemies);

    _hidePrompt();
  }

  // ── Enemy list helper ────────────────────────────────────
  function _getEnemies() {
    try {
      if (window.enemies && window.enemies.length) return window.enemies;
      if (window.GameManager && window.GameManager.enemies) return window.GameManager.enemies;
      if (window.NpcSystem && window.NpcSystem.getEnemies) return window.NpcSystem.getEnemies();
    } catch (e) {}
    return [];
  }

  // ── Place function ────────────────────────────────────────
  function place() {
    // Check if there's already a charge we should detonate
    var activeCharge = null;
    for (var i = 0; i < _charges.length; i++) {
      if (_charges[i] && !_charges[i].detonated) {
        activeCharge = _charges[i];
        break;
      }
    }

    if (activeCharge) {
      // Detonate existing charge (0.5s delay)
      if (!_pendingDetonation) {
        _pendingDetonation = true;
        _detonationTimer = 0.5;
        _detonationData = { charge: activeCharge, hitPos: activeCharge.hitPos };
        _showPrompt('DETONATING...');
      }
      return;
    }

    // No active charge — try to place one
    if (_chargesAvail <= 0 && _cooldowns[0] > 0 && _cooldowns[1] > 0) {
      _showPrompt('NO CHARGES — WAIT ' + Math.ceil(Math.min(_cooldowns[0], _cooldowns[1])) + 's');
      setTimeout(_hidePrompt, 2000);
      return;
    }

    var cam = _getCamera();
    if (!cam) return;

    // Raycast 3m forward for wall detection
    var rayResult = _castForwardRay(cam, 3.0);
    if (!rayResult.hit) {
      _showPrompt('NO WALL DETECTED');
      setTimeout(_hidePrompt, 1800);
      return;
    }

    var scene = _getScene();
    if (!scene) return;

    // Find a free charge slot
    var slot = -1;
    if (_chargesAvail > 0) {
      // Pick slot with no active cooldown or least cooldown
      if (_cooldowns[0] <= 0) { slot = 0; }
      else if (_cooldowns[1] <= 0) { slot = 1; }
    }
    if (slot < 0) {
      _showPrompt('NO CHARGES AVAILABLE');
      setTimeout(_hidePrompt, 1800);
      return;
    }

    // Create charge mesh and position it on the wall
    var chargeMesh = _makeChargeMesh();
    chargeMesh.position.copy(rayResult.point);
    // Face the charge towards the player (flat against wall)
    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    // Orient so the flat face is normal to the player's look direction
    chargeMesh.lookAt(cam.position);
    scene.add(chargeMesh);

    var chargeObj = {
      mesh: chargeMesh,
      hitPos: rayResult.point.clone(),
      bx: rayResult.bx,
      by: rayResult.by,
      bz: rayResult.bz,
      slot: slot,
      detonated: false
    };
    _charges.push(chargeObj);
    _chargesAvail--;
    _cooldowns[slot] = COOLDOWN_TIME;

    _showPrompt('BREACH READY — [F5] DETONATE');
    _updateHUD();
  }

  // ── Init ─────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || null;
    _camera = camera || null;
    _charges = [];
    _chargesAvail = 2;
    _cooldowns = [0, 0];
    _pendingDetonation = false;
    _detonationTimer = 0;
    _detonationData = null;
    _entryWindowTimer = 0;
    _rubblePieces = [];
    _particles = [];
    _shakeTimer = 0;
    _shakeIntensity = 0;
    _flashTimer = 0;

    // Keyboard listener for F5
    if (!window._wallBreachKeyBound) {
      window._wallBreachKeyBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key === 'F5') {
          e.preventDefault();
          place();
        }
      });
    }

    _updateHUD();
  }

  // ── Reset (call on new wave) ──────────────────────────────
  function reset() {
    var scene = _getScene();
    // Remove all active charge meshes
    for (var i = 0; i < _charges.length; i++) {
      if (_charges[i] && _charges[i].mesh && scene) {
        try { scene.remove(_charges[i].mesh); } catch (e) {}
      }
    }
    // Remove rubble
    for (var r = 0; r < _rubblePieces.length; r++) {
      if (_rubblePieces[r].mesh && scene) {
        try { scene.remove(_rubblePieces[r].mesh); } catch (e) {}
      }
    }
    // Remove particles
    for (var p = 0; p < _particles.length; p++) {
      if (_particles[p].mesh && scene) {
        try { scene.remove(_particles[p].mesh); } catch (e) {}
      }
    }

    _charges = [];
    _chargesAvail = 2;
    _cooldowns = [0, 0];
    _pendingDetonation = false;
    _detonationTimer = 0;
    _detonationData = null;
    _entryWindowTimer = 0;
    _rubblePieces = [];
    _particles = [];
    _shakeTimer = 0;
    _flashTimer = 0;

    _hidePrompt();
    _updateHUD();
  }

  // ── Update (call each frame with delta time in seconds) ───
  function update(dt) {
    if (!dt || dt <= 0) return;

    var cam = _getCamera();
    var scene = _getScene();

    // ── Cooldown timers
    for (var s = 0; s < 2; s++) {
      if (_cooldowns[s] > 0) {
        _cooldowns[s] -= dt;
        if (_cooldowns[s] < 0) {
          _cooldowns[s] = 0;
          _chargesAvail = Math.min(2, _chargesAvail + 1);
        }
      }
    }

    // ── Detonation delay
    if (_pendingDetonation) {
      _detonationTimer -= dt;
      if (_detonationTimer <= 0) {
        _pendingDetonation = false;
        if (_detonationData) {
          _detonate(_detonationData.charge, _detonationData.hitPos);
          _detonationData = null;
        }
      }
    }

    // ── Entry window (slow-mo + shotgun spread)
    if (_entryWindowTimer > 0) {
      _entryWindowTimer -= dt;
      if (_entryWindowTimer <= 0) {
        _entryWindowTimer = 0;
        window._bulletTimeScale = 1.0;
        window._weaponSpread = 0;
      }
    }

    // ── Flash fade
    if (_flashTimer > 0) {
      _flashTimer -= dt;
      if (_flashEl) {
        var opacity = Math.max(0, _flashTimer / 1.5) * 0.8;
        _flashEl.style.opacity = opacity.toFixed(3);
      }
      if (_flashTimer <= 0) {
        _flashTimer = 0;
        if (_flashEl) _flashEl.style.opacity = '0';
      }
    }

    // ── Screen shake
    _applyScreenShake(dt, cam);

    // ── Particle physics
    var gravity = 9.8;
    for (var pi = _particles.length - 1; pi >= 0; pi--) {
      var p = _particles[pi];
      p.life += dt;
      if (p.life >= p.maxLife) {
        if (scene) { try { scene.remove(p.mesh); } catch (e) {} }
        _particles.splice(pi, 1);
        continue;
      }
      p.vy -= gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      var fade = 1 - (p.life / p.maxLife);
      p.mesh.material.opacity = fade;
      p.mesh.material.transparent = true;
    }

    // ── Rubble physics (simple settle)
    for (var ri = 0; ri < _rubblePieces.length; ri++) {
      var rb = _rubblePieces[ri];
      if (rb.settled) continue;
      rb.vy -= gravity * dt;
      rb.mesh.position.y += rb.vy * dt;
      rb.mesh.rotation.x += dt * 1.5;
      rb.mesh.rotation.z += dt * 1.0;
      // Ground level check
      var groundY = 0;
      try {
        if (window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
          groundY = window.VoxelWorld.getTerrainHeight(
            rb.mesh.position.x, rb.mesh.position.z
          ) || 0;
        }
      } catch (e) {}
      if (rb.mesh.position.y <= groundY + 0.1) {
        rb.mesh.position.y = groundY + 0.1;
        rb.vy = 0;
        rb.settled = true;
      }
    }

    // ── HUD update (charge count / cooldown)
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init: init,
    update: update,
    place: place,
    reset: reset
  };

})();
