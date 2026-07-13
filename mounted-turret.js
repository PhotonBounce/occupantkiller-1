// ============================================================
//  mounted-turret.js — Static heavy machine gun player can man
//  Placement: 1-2 turrets per level at fixed strategic positions
//  Public API: init(scene, camera, controls), update(dt), interact(), reset()
// ============================================================
window.MountedTurret = (function () {
  'use strict';

  // ── Globals ───────────────────────────────────────────────
  window._mountedTurrets = [];
  window._playerMountedTurret = null;

  // ── Internal state ────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _controls = null;
  var _playerPos = null;   // reference updated via update()

  var SPAWN_POINTS = [
    { x: 15, y: 2, z: 0 },
    { x: -15, y: 2, z: 8 }
  ];

  var INTERACT_DIST = 2;
  var TURRET_HP_MAX = 150;
  var FIRE_DAMAGE = 55;
  var FIRE_RATE = 0.08;        // seconds between shots
  var OVERHEAT_SHOTS = 150;    // continuous shots before overheat
  var OVERHEAT_DURATION = 10;  // seconds overheated
  var COOLDOWN_DURATION = 5;   // seconds to cool after overheat
  var MAX_YAW = Math.PI / 3;   // ±60 degrees horizontal limit

  // HUD elements
  var _hudEl = null;
  var _hudBarEl = null;
  var _hudPctEl = null;
  var _dismountEl = null;

  // Mouse tracking for turret rotation
  var _mouseDeltaX = 0;
  var _mouseMoveHandler = null;
  var _keyDownHandler = null;
  var _fireLoopHandle = null;

  // ── Material cache ────────────────────────────────────────
  var _matSandbag = null;
  var _matMgBody = null;
  var _matBarrel = null;
  var _matAmmoBelt = null;
  var _matBipod = null;
  var _matShield = null;
  var _matTracer = null;

  function _getMats() {
    if (!_matSandbag) {
      _matSandbag  = new THREE.MeshLambertMaterial({ color: 0xC8A060 });
      _matMgBody   = new THREE.MeshLambertMaterial({ color: 0x333333 });
      _matBarrel   = new THREE.MeshLambertMaterial({ color: 0x222222 });
      _matAmmoBelt = new THREE.MeshLambertMaterial({ color: 0xAA8833 });
      _matBipod    = new THREE.MeshLambertMaterial({ color: 0x444444 });
      _matShield   = new THREE.MeshLambertMaterial({ color: 0x555566 });
      _matTracer   = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    }
  }

  // ── Build turret mesh ──────────────────────────────────────
  function _buildTurretMesh() {
    _getMats();
    var root = new THREE.Group();

    // --- Sandbag base: 3 BoxGeometry(1,0.4,0.6) in U-shape ---
    var sbGeo = new THREE.BoxGeometry(1, 0.4, 0.6);
    // Center back
    var sb0 = new THREE.Mesh(sbGeo, _matSandbag);
    sb0.position.set(0, 0, 0.5);
    root.add(sb0);
    // Left arm
    var sb1 = new THREE.Mesh(sbGeo, _matSandbag);
    sb1.position.set(-0.65, 0, -0.1);
    sb1.rotation.y = Math.PI / 2;
    root.add(sb1);
    // Right arm
    var sb2 = new THREE.Mesh(sbGeo, _matSandbag);
    sb2.position.set(0.65, 0, -0.1);
    sb2.rotation.y = Math.PI / 2;
    root.add(sb2);

    // --- Pivot group (rotates with mouse) ---
    var pivot = new THREE.Group();
    pivot.position.set(0, 0.5, 0);
    root.add(pivot);

    // MG body: BoxGeometry(0.3, 0.25, 1.2)
    var mgGeo = new THREE.BoxGeometry(0.3, 0.25, 1.2);
    var mgBody = new THREE.Mesh(mgGeo, _matMgBody);
    mgBody.position.set(0, 0, -0.1);
    pivot.add(mgBody);

    // Barrel: CylinderGeometry(0.06, 0.06, 0.8) protruding forward (negative Z)
    var barrelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10);
    var barrel = new THREE.Mesh(barrelGeo, _matBarrel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -0.85);
    pivot.add(barrel);

    // Ammo belt: looping CylinderGeometry(0.04) segments hanging from receiver
    var beltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6);
    for (var bi = 0; bi < 6; bi++) {
      var beltSeg = new THREE.Mesh(beltGeo, _matAmmoBelt);
      beltSeg.position.set(
        0.2 + bi * 0.06,
        -0.12 - bi * 0.04,
        0.1
      );
      beltSeg.rotation.z = 0.3 + bi * 0.08;
      pivot.add(beltSeg);
    }

    // Bipod legs: two thin rods angling down
    var legGeo = new THREE.BoxGeometry(0.04, 0.55, 0.04);
    var leg1 = new THREE.Mesh(legGeo, _matBipod);
    leg1.position.set(-0.12, -0.27, -0.55);
    leg1.rotation.z = 0.25;
    pivot.add(leg1);
    var leg2 = new THREE.Mesh(legGeo, _matBipod);
    leg2.position.set(0.12, -0.27, -0.55);
    leg2.rotation.z = -0.25;
    pivot.add(leg2);

    // HMG shield: BoxGeometry(0.8, 0.6, 0.05) in front
    var shieldGeo = new THREE.BoxGeometry(0.8, 0.6, 0.05);
    var shield = new THREE.Mesh(shieldGeo, _matShield);
    shield.position.set(0, 0.05, -0.45);
    // Vision slit (thin dark box cut across upper third)
    var slitGeo = new THREE.BoxGeometry(0.5, 0.06, 0.06);
    var slitMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    var slit = new THREE.Mesh(slitGeo, slitMat);
    slit.position.set(0, 0.13, 0);
    shield.add(slit);
    pivot.add(shield);

    return { root: root, pivot: pivot };
  }

  // ── Spawn all turrets ─────────────────────────────────────
  function _spawnTurrets() {
    window._mountedTurrets = [];
    for (var i = 0; i < SPAWN_POINTS.length; i++) {
      var sp = SPAWN_POINTS[i];
      var meshData = _buildTurretMesh();
      meshData.root.position.set(sp.x, sp.y, sp.z);
      _scene.add(meshData.root);

      var turret = {
        mesh: meshData.root,
        pivot: meshData.pivot,
        baseYaw: 0,           // current yaw offset from base direction
        hp: TURRET_HP_MAX,
        manned: false,
        fireCooldown: 0,
        shotCount: 0,
        overheatTimer: 0,
        coolTimer: 0,
        isOverheated: false,
        position: new THREE.Vector3(sp.x, sp.y, sp.z),
        active: true,
        tracers: []
      };
      window._mountedTurrets.push(turret);
    }
  }

  // ── HUD ───────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'turret-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'border:1px solid #ff8800',
      'border-radius:6px',
      'padding:8px 18px',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'z-index:500',
      'display:none',
      'text-align:center',
      'min-width:220px'
    ].join(';');

    _hudEl.innerHTML = [
      '<div style="color:#ff8800;font-weight:bold;letter-spacing:2px;margin-bottom:4px">&#9711; TURRET</div>',
      '<div style="font-size:11px;color:#aaa;margin-bottom:6px">OVERHEAT</div>',
      '<div style="background:#222;border:1px solid #555;border-radius:3px;height:10px;width:180px;margin:0 auto 6px">',
      '  <div id="turret-overheat-bar" style="height:100%;width:0%;background:#ff4400;border-radius:3px;transition:width 0.1s"></div>',
      '</div>',
      '<div id="turret-overheat-pct" style="font-size:11px;color:#ff8800;margin-bottom:4px">0%</div>',
      '<div id="turret-dismount-hint" style="font-size:11px;color:#aaa">E: DISMOUNT</div>'
    ].join('');

    document.body.appendChild(_hudEl);
    _hudBarEl  = document.getElementById('turret-overheat-bar');
    _hudPctEl  = document.getElementById('turret-overheat-pct');
    _dismountEl = document.getElementById('turret-dismount-hint');
  }

  function _showHUD(show) {
    if (_hudEl) _hudEl.style.display = show ? 'block' : 'none';
  }

  function _updateHUDBar(pct) {
    if (!_hudBarEl) return;
    var p = Math.max(0, Math.min(100, pct));
    _hudBarEl.style.width = p + '%';
    _hudBarEl.style.background = p > 80 ? '#ff0000' : '#ff4400';
    if (_hudPctEl) _hudPctEl.textContent = Math.round(p) + '%';
  }

  // ── Interaction prompt ────────────────────────────────────
  var _promptEl = null;
  function _showPrompt(show, turret) {
    if (!_promptEl) {
      _promptEl = document.createElement('div');
      _promptEl.id = 'turret-interact-prompt';
      _promptEl.style.cssText = [
        'position:fixed',
        'bottom:140px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.65)',
        'border:1px solid #aaa',
        'border-radius:4px',
        'padding:5px 14px',
        'color:#fff',
        'font-family:monospace',
        'font-size:12px',
        'z-index:500',
        'display:none',
        'pointer-events:none'
      ].join(';');
      _promptEl.textContent = '[E] MAN TURRET';
      document.body.appendChild(_promptEl);
    }
    _promptEl.style.display = (show && turret && turret.hp > 0) ? 'block' : 'none';
  }

  // ── Man / dismount ────────────────────────────────────────
  function _manTurret(turret) {
    if (turret.manned || !turret.active || turret.hp <= 0) return;
    turret.manned = true;
    window._playerMountedTurret = turret;

    // Lock player movement — disable PointerLockControls movement
    if (_controls && typeof _controls.lock === 'function') {
      // Keep pointer lock but block movement via flag
    }
    window._turretManning = true;

    // Listen to mouse X for yaw
    _mouseDeltaX = 0;
    _mouseMoveHandler = function (e) {
      if (!window._playerMountedTurret) return;
      _mouseDeltaX += e.movementX || 0;
    };
    window.addEventListener('mousemove', _mouseMoveHandler);

    // E key to dismount; also fire on mousedown while manned
    _keyDownHandler = function (e) {
      if (e.code === 'KeyE') {
        _dismountTurret(turret);
      }
    };
    window.addEventListener('keydown', _keyDownHandler);

    _showHUD(true);
    _showPrompt(false);
    console.log('[MountedTurret] Player manned turret');
  }

  function _dismountTurret(turret) {
    if (!turret || !turret.manned) return;
    turret.manned = false;
    window._playerMountedTurret = null;
    window._turretManning = false;

    if (_mouseMoveHandler) {
      window.removeEventListener('mousemove', _mouseMoveHandler);
      _mouseMoveHandler = null;
    }
    if (_keyDownHandler) {
      window.removeEventListener('keydown', _keyDownHandler);
      _keyDownHandler = null;
    }

    _showHUD(false);
    console.log('[MountedTurret] Player dismounted turret');
  }

  // ── Fire tracer round ─────────────────────────────────────
  function _fireTracer(turret) {
    if (!_scene) return;
    var pivot = turret.pivot;
    // World direction turret faces (negative Z in local space)
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(pivot.getWorldQuaternion(new THREE.Quaternion()));

    var startPos = new THREE.Vector3();
    pivot.getWorldPosition(startPos);
    startPos.addScaledVector(dir, 0.9); // start at barrel tip

    var tracerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
    var tracer = new THREE.Mesh(tracerGeo, _matTracer);
    tracer.position.copy(startPos);
    tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    _scene.add(tracer);

    turret.tracers.push({
      mesh: tracer,
      dir: dir.clone(),
      speed: 80,
      life: 0.4
    });

    // Camera shake
    if (_camera) {
      var shakeAmt = 0.05;
      _camera.position.x += (Math.random() - 0.5) * shakeAmt;
      _camera.position.y += (Math.random() - 0.5) * shakeAmt;
    }

    // Audio
    if (window.AudioSystem && typeof window.AudioSystem.playGunshot === 'function') {
      window.AudioSystem.playGunshot();
    }

    // Hit detection — simple raycast
    var raycaster = new THREE.Raycaster(startPos, dir, 0, 120);
    var hits = [];
    if (window._enemies && Array.isArray(window._enemies)) {
      for (var ei = 0; ei < window._enemies.length; ei++) {
        var enemy = window._enemies[ei];
        if (enemy && enemy.mesh && enemy.hp > 0) {
          hits.push(enemy.mesh);
        }
      }
    }
    if (hits.length > 0) {
      var intersects = raycaster.intersectObjects(hits, true);
      if (intersects.length > 0) {
        var hitObj = intersects[0].object;
        // Walk up to find enemy
        for (var ei2 = 0; ei2 < window._enemies.length; ei2++) {
          var en = window._enemies[ei2];
          if (en && en.mesh && (hitObj === en.mesh || en.mesh.getObjectById(hitObj.id))) {
            en.hp -= FIRE_DAMAGE;
            if (window.AudioSystem && typeof window.AudioSystem.playHit === 'function') {
              window.AudioSystem.playHit();
            }
            break;
          }
        }
      }
    }
  }

  // ── Turret death explosion ────────────────────────────────
  function _explodeTurret(turret) {
    if (!_scene || !turret.active) return;
    turret.active = false;
    _scene.remove(turret.mesh);

    // Simple flash sphere
    var expGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var expMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var expMesh = new THREE.Mesh(expGeo, expMat);
    expMesh.position.copy(turret.position);
    _scene.add(expMesh);

    var startTime = performance.now();
    function fadeOut() {
      var elapsed = (performance.now() - startTime) / 1000;
      if (elapsed > 0.5) {
        _scene.remove(expMesh);
        return;
      }
      expMat.opacity = 0.9 * (1 - elapsed / 0.5);
      expMesh.scale.setScalar(1 + elapsed * 3);
      requestAnimationFrame(fadeOut);
    }
    fadeOut();

    if (window.AudioSystem && typeof window.AudioSystem.playExplosion === 'function') {
      window.AudioSystem.playExplosion();
    }

    if (turret.manned) {
      _dismountTurret(turret);
    }
  }

  // ── Public: interact (E key from game-manager or player) ──
  function interact() {
    // If already manned, dismount
    if (window._playerMountedTurret) {
      _dismountTurret(window._playerMountedTurret);
      return;
    }
    // Find nearest turret within range
    if (!window._mountedTurrets || !_camera) return;
    var playerPos = _camera.position;
    for (var i = 0; i < window._mountedTurrets.length; i++) {
      var t = window._mountedTurrets[i];
      if (!t.active || t.hp <= 0) continue;
      var dist = playerPos.distanceTo(t.position);
      if (dist <= INTERACT_DIST) {
        _manTurret(t);
        return;
      }
    }
  }

  // ── Public: update (dt in seconds) ────────────────────────
  function update(dt) {
    if (!_scene || !window._mountedTurrets) return;
    var playerPos = _camera ? _camera.position : null;

    // Check proximity for interact prompt
    var nearTurret = null;
    if (playerPos && !window._playerMountedTurret) {
      for (var i = 0; i < window._mountedTurrets.length; i++) {
        var t0 = window._mountedTurrets[i];
        if (!t0.active || t0.hp <= 0) continue;
        if (playerPos.distanceTo(t0.position) <= INTERACT_DIST) {
          nearTurret = t0;
          break;
        }
      }
    }
    _showPrompt(!!nearTurret, nearTurret);

    // Update each turret
    for (var j = 0; j < window._mountedTurrets.length; j++) {
      var turret = window._mountedTurrets[j];
      if (!turret.active) continue;

      // Update tracers
      for (var ti = turret.tracers.length - 1; ti >= 0; ti--) {
        var tr = turret.tracers[ti];
        tr.life -= dt;
        if (tr.life <= 0) {
          _scene.remove(tr.mesh);
          turret.tracers.splice(ti, 1);
        } else {
          tr.mesh.position.addScaledVector(tr.dir, tr.speed * dt);
        }
      }

      if (!turret.manned) continue;

      // Rotate pivot with mouse delta
      if (_mouseDeltaX !== 0) {
        var sensitivity = 0.003;
        turret.baseYaw -= _mouseDeltaX * sensitivity;
        // Clamp to ±60°
        turret.baseYaw = Math.max(-MAX_YAW, Math.min(MAX_YAW, turret.baseYaw));
        turret.pivot.rotation.y = turret.baseYaw;
        _mouseDeltaX = 0;
      }

      // Overheat logic
      if (turret.isOverheated) {
        turret.overheatTimer -= dt;
        if (turret.overheatTimer <= 0) {
          turret.isOverheated = false;
          turret.overheatTimer = 0;
          turret.coolTimer = COOLDOWN_DURATION;
          turret.shotCount = 0;
        }
        _updateHUDBar(100);
        continue; // cannot fire while overheated
      }

      // Cooling down after overheat
      if (turret.coolTimer > 0) {
        turret.coolTimer -= dt;
        var coolPct = (1 - turret.coolTimer / COOLDOWN_DURATION) * 0; // bar goes to 0
        _updateHUDBar(turret.coolTimer / COOLDOWN_DURATION * 100);
        if (turret.coolTimer <= 0) turret.coolTimer = 0;
      } else {
        // Normal heat display proportional to shot count
        _updateHUDBar((turret.shotCount / OVERHEAT_SHOTS) * 100);
      }

      // Auto-fire while mouse is held (check global flag set by game-manager or mousedown)
      var isFiring = window._turretFiring === true;
      if (isFiring) {
        turret.fireCooldown -= dt;
        if (turret.fireCooldown <= 0) {
          turret.fireCooldown = FIRE_RATE;
          _fireTracer(turret);
          turret.shotCount++;
          if (turret.shotCount >= OVERHEAT_SHOTS) {
            turret.isOverheated = true;
            turret.overheatTimer = OVERHEAT_DURATION;
          }
        }
      } else {
        // Passive cool-down when not firing
        if (turret.shotCount > 0 && turret.coolTimer <= 0) {
          turret.shotCount = Math.max(0, turret.shotCount - dt * 15);
        }
        turret.fireCooldown = 0;
      }

      // Dismount if player moved too far (camera drifted away while manned)
      if (playerPos && playerPos.distanceTo(turret.position) > INTERACT_DIST + 1.5) {
        _dismountTurret(turret);
      }
    }
  }

  // ── Damage a turret (callable by enemy AI) ────────────────
  function damageTurret(turret, amount) {
    if (!turret || !turret.active) return;
    turret.hp -= amount;
    if (turret.hp <= 0) {
      turret.hp = 0;
      _explodeTurret(turret);
    }
  }
  window._damageMountedTurret = damageTurret;

  // ── Public: init ──────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene;
    _camera   = camera;
    _controls = controls;

    window._mountedTurrets = [];
    window._playerMountedTurret = null;
    window._turretManning = false;
    window._turretFiring  = false;

    _getMats();
    _createHUD();
    _spawnTurrets();

    // Listen for mousedown/up to set fire flag while manned
    window.addEventListener('mousedown', function (e) {
      if (e.button === 0 && window._playerMountedTurret) {
        window._turretFiring = true;
      }
    });
    window.addEventListener('mouseup', function (e) {
      if (e.button === 0) {
        window._turretFiring = false;
      }
    });

    console.log('[MountedTurret] init — ' + window._mountedTurrets.length + ' turret(s) spawned');
  }

  // ── Public: reset (call between levels) ───────────────────
  function reset() {
    // Dismount if manned
    if (window._playerMountedTurret) {
      _dismountTurret(window._playerMountedTurret);
    }

    // Remove old meshes
    if (_scene && window._mountedTurrets) {
      for (var i = 0; i < window._mountedTurrets.length; i++) {
        var t = window._mountedTurrets[i];
        if (t.mesh) _scene.remove(t.mesh);
        // Remove any stray tracers
        for (var ti = 0; ti < t.tracers.length; ti++) {
          _scene.remove(t.tracers[ti].mesh);
        }
      }
    }

    window._mountedTurrets = [];
    window._playerMountedTurret = null;
    window._turretManning = false;
    window._turretFiring  = false;

    if (_scene) {
      _spawnTurrets();
      console.log('[MountedTurret] reset — ' + window._mountedTurrets.length + ' turret(s) respawned');
    }
  }

  // ── Expose API ────────────────────────────────────────────
  return {
    init: init,
    update: update,
    interact: interact,
    reset: reset
  };

})();
