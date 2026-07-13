// ============================================================
//  vehicle-turret.js — Vehicle-mounted turret system for Three.js FPS
//  Player can mount a tank-style turret on a vehicle hull.
//  Public API: init, update, spawn, mount, dismount, reset
// ============================================================
window.VehicleTurret = (function () {
  'use strict';

  // ── Module-level globals ──────────────────────────────────
  window._vehicleTurrets = [];
  window._playerMountedVehicleTurret = null;

  // ── Internal state ────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _controls = null;

  // Constants
  var MOUNT_DIST       = 3;       // metres to press F and mount
  var TURRET_HP_MAX    = 800;
  var SHELL_SPEED      = 120;     // m/s
  var SHELL_RELOAD     = 3.0;     // seconds
  var MG_RPM           = 800;
  var MG_BELT_MAX      = 500;
  var MG_DMG           = 20;
  var MG_TRACER_EVERY  = 5;
  var BARREL_ELEV_MIN  = -10 * Math.PI / 180;  // -10°
  var BARREL_ELEV_MAX  =  20 * Math.PI / 180;  // +20°
  var SCREEN_SHAKE_DUR = 0.25;   // seconds

  // Ammo types: [name, damage, blastRadius, speed]
  var AMMO_TYPES = [
    { name: 'APFSDS', dmg: 500, blast: 0.5,  speed: 180, color: 0xCCCCDD },
    { name: 'HEAT',   dmg: 300, blast: 8.0,  speed: 130, color: 0xFFAA00 },
    { name: 'HE',     dmg: 200, blast: 12.0, speed: 110, color: 0xFF4400 }
  ];

  // ── Material cache ────────────────────────────────────────
  var _matHull      = null;
  var _matRing      = null;
  var _matCannon    = null;
  var _matMantlet   = null;
  var _matCupola    = null;
  var _matShell     = null;
  var _matTracer    = null;
  var _matSmoke     = null;
  var _matFlash     = null;
  var _matFire      = null;
  var _matDestroyed = null;

  function _initMats() {
    if (_matHull) return;
    _matHull      = new THREE.MeshLambertMaterial({ color: 0x2D4A1E }); // dark military green
    _matRing      = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
    _matCannon    = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    _matMantlet   = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
    _matCupola    = new THREE.MeshLambertMaterial({ color: 0x3D3D2A });
    _matShell     = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
    _matTracer    = new THREE.MeshBasicMaterial ({ color: 0xFF8800, transparent: true, opacity: 0.9 });
    _matSmoke     = new THREE.MeshBasicMaterial ({ color: 0x888888, transparent: true, opacity: 0.4 });
    _matFlash     = new THREE.MeshBasicMaterial ({ color: 0xFFFFAA, transparent: true, opacity: 0.95 });
    _matFire      = new THREE.MeshBasicMaterial ({ color: 0xFF6600, transparent: true, opacity: 0.75 });
    _matDestroyed = new THREE.MeshLambertMaterial({ color: 0x111111 });
  }

  // ── Build full turret mesh ────────────────────────────────
  function _buildTurretGroup() {
    _initMats();
    var root = new THREE.Group();

    // --- Base hull: BoxGeometry(5×1.5×2.5) ---
    var hullGeo  = new THREE.BoxGeometry(5, 1.5, 2.5);
    var hullMesh = new THREE.Mesh(hullGeo, _matHull);
    hullMesh.position.set(0, 0, 0);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    root.add(hullMesh);

    // --- Turret ring: CylinderGeometry(0.8r, 0.9r, 0.4h) ---
    var ringGeo  = new THREE.CylinderGeometry(0.8, 0.9, 0.4, 16);
    var ringMesh = new THREE.Mesh(ringGeo, _matRing);
    ringMesh.position.set(0, 1.0, 0); // sits on top of hull
    root.add(ringMesh);

    // --- Turret rotating group (ring + mantlet + cannon + cupola) ---
    var turretGroup = new THREE.Group();
    turretGroup.position.set(0, 1.0, 0);
    root.add(turretGroup);

    // Inner ring cap
    var ringCapGeo  = new THREE.CylinderGeometry(0.78, 0.78, 0.1, 16);
    var ringCapMesh = new THREE.Mesh(ringCapGeo, _matRing);
    ringCapMesh.position.set(0, 0.25, 0);
    turretGroup.add(ringCapMesh);

    // --- Gun mantlet: BoxGeometry(1.2×0.7×0.6) angled slightly ---
    var mantletGeo  = new THREE.BoxGeometry(1.2, 0.7, 0.6);
    var mantletMesh = new THREE.Mesh(mantletGeo, _matMantlet);
    mantletMesh.position.set(0, 0.3, -0.9);
    mantletMesh.rotation.x = -0.12; // slight forward tilt
    turretGroup.add(mantletMesh);

    // --- Barrel elevation group (pivots on mantlet) ---
    var barrelGroup = new THREE.Group();
    barrelGroup.position.set(0, 0.3, -0.9);
    turretGroup.add(barrelGroup);

    // --- Main cannon: CylinderGeometry(0.12r, 0.15r, 3.0h) pointing forward ---
    // Three.js cylinders are vertical by default; rotate to point forward (along -Z)
    var cannonGeo  = new THREE.CylinderGeometry(0.12, 0.15, 3.0, 10);
    var cannonMesh = new THREE.Mesh(cannonGeo, _matCannon);
    cannonMesh.rotation.x = Math.PI / 2;   // point along -Z
    cannonMesh.position.set(0, 0, -1.5);   // extend forward from pivot
    barrelGroup.add(cannonMesh);

    // Muzzle brake cap
    var muzzleGeo  = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 8);
    var muzzleMesh = new THREE.Mesh(muzzleGeo, _matCannon);
    muzzleMesh.rotation.x = Math.PI / 2;
    muzzleMesh.position.set(0, 0, -3.05);
    barrelGroup.add(muzzleMesh);

    // Coaxial MG barrel (thinner, next to main cannon)
    var coaxGeo  = new THREE.CylinderGeometry(0.04, 0.05, 1.8, 6);
    var coaxMesh = new THREE.Mesh(coaxGeo, _matCannon);
    coaxMesh.rotation.x = Math.PI / 2;
    coaxMesh.position.set(0.22, -0.18, -0.9);
    barrelGroup.add(coaxMesh);

    // --- Commander's cupola: small cylinder on top of ring ---
    var cupolaGeo  = new THREE.CylinderGeometry(0.28, 0.32, 0.35, 12);
    var cupolaMesh = new THREE.Mesh(cupolaGeo, _matCupola);
    cupolaMesh.position.set(0.3, 0.65, 0.3);
    turretGroup.add(cupolaMesh);

    // Cupola hatch lid
    var hatchGeo  = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 10);
    var hatchMesh = new THREE.Mesh(hatchGeo, _matCannon);
    hatchMesh.position.set(0.3, 0.87, 0.3);
    turretGroup.add(hatchMesh);

    // --- Muzzle flash placeholder (hidden by default) ---
    var flashGeo  = new THREE.SphereGeometry(0.35, 6, 6);
    var flashMesh = new THREE.Mesh(flashGeo, _matFlash);
    flashMesh.position.set(0, 0, -3.1);
    flashMesh.visible = false;
    barrelGroup.add(flashMesh);

    return {
      root:          root,
      turretGroup:   turretGroup,
      barrelGroup:   barrelGroup,
      hullMesh:      hullMesh,
      cannonMesh:    cannonMesh,
      flashMesh:     flashMesh,
      muzzleWorldPos: new THREE.Vector3()
    };
  }

  // ── HUD ───────────────────────────────────────────────────
  var _hud = null;

  function _createHUD() {
    if (_hud) return;
    var el = document.createElement('div');
    el.id = 'vt-hud';
    el.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.75)',
      'border:1px solid #2a6a2a',
      'color:#aaffaa',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:300',
      'text-align:center',
      'min-width:220px'
    ].join(';');
    document.body.appendChild(el);
    _hud = el;
  }

  function _updateHUD(t) {
    if (!_hud) return;
    if (!t || !t.mounted) {
      _hud.style.display = 'none';
      return;
    }
    _hud.style.display = 'block';
    var ammo   = AMMO_TYPES[t.ammoIdx];
    var reload = t.shellReloadTimer > 0 ? ' [RELOADING ' + t.shellReloadTimer.toFixed(1) + 's]' : ' [READY]';
    var mgStr  = 'MG ' + t.mgBelt + '/' + MG_BELT_MAX;
    var hpPct  = Math.max(0, Math.round(t.hp / TURRET_HP_MAX * 100));
    var dest   = t.destroyed ? ' <span style="color:#ff4444">DESTROYED</span>' : '';
    _hud.innerHTML =
      '<b>VEHICLE TURRET</b> ' + dest + '<br>' +
      'ROUND: <span style="color:#ffdd88">' + ammo.name + '</span>' + reload + '<br>' +
      mgStr + ' | HP: <span style="color:' + (hpPct < 25 ? '#ff4444' : '#aaffaa') + '">' + hpPct + '%</span><br>' +
      '<span style="color:#888">[A/D] Rotate &nbsp; [W/S] Elevate &nbsp; [Q] Ammo &nbsp; [E] Exit</span>';
  }

  // ── Muzzle smoke particles ────────────────────────────────
  function _spawnMuzzleSmoke(scene, pos) {
    _initMats();
    var count = 6;
    for (var i = 0; i < count; i++) {
      var geo  = new THREE.SphereGeometry(0.18 + Math.random() * 0.18, 5, 5);
      var mat  = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      var vx = (Math.random() - 0.5) * 1.5;
      var vy = 1.2 + Math.random() * 1.5;
      var vz = (Math.random() - 0.5) * 1.5;
      var life = 0.6 + Math.random() * 0.6;
      (function (m, dvx, dvy, dvz, maxLife) {
        var elapsed = 0;
        var ticker = setInterval(function () {
          elapsed += 0.05;
          if (elapsed >= maxLife) {
            clearInterval(ticker);
            scene.remove(m);
            m.geometry.dispose();
            m.material.dispose();
            return;
          }
          m.position.x += dvx * 0.05;
          m.position.y += dvy * 0.05;
          m.position.z += dvz * 0.05;
          m.material.opacity = 0.5 * (1 - elapsed / maxLife);
          m.scale.setScalar(1 + elapsed * 2);
        }, 50);
      })(mesh, vx, vy, vz, life);
    }
  }

  // ── Screen shake ──────────────────────────────────────────
  var _shakeTime = 0;
  var _shakeAmt  = 0;

  function _triggerScreenShake(amount, duration) {
    _shakeAmt  = amount;
    _shakeTime = duration || SCREEN_SHAKE_DUR;
  }

  function _applyScreenShake(dt) {
    if (!_camera || _shakeTime <= 0) return;
    _shakeTime -= dt;
    var s = _shakeAmt * (_shakeTime / SCREEN_SHAKE_DUR);
    _camera.position.x += (Math.random() - 0.5) * s;
    _camera.position.y += (Math.random() - 0.5) * s;
    if (_shakeTime <= 0) {
      _shakeTime = 0;
    }
  }

  // ── Projectile pool ───────────────────────────────────────
  var _projectiles = [];

  function _fireMainGun(t) {
    if (!t || t.destroyed) return;
    if (t.shellReloadTimer > 0) return;

    var ammo = AMMO_TYPES[t.ammoIdx];
    t.shellReloadTimer = SHELL_RELOAD;

    // Muzzle world position
    var muzzleLocal = new THREE.Vector3(0, 0, -3.1);
    t.barrelGroup.localToWorld(muzzleLocal);

    // Fire direction: barrel group's -Z axis in world space
    var dir = new THREE.Vector3(0, 0, -1);
    t.barrelGroup.getWorldQuaternion(_tmpQ);
    dir.applyQuaternion(_tmpQ);
    dir.normalize();

    // Muzzle flash
    t.flashMesh.visible = true;
    setTimeout(function () { if (t.flashMesh) t.flashMesh.visible = false; }, 80);

    // Muzzle smoke
    _spawnMuzzleSmoke(_scene, muzzleLocal);

    // Screen shake
    _triggerScreenShake(0.15, SCREEN_SHAKE_DUR);

    // Audio
    if (window.AudioSystem && AudioSystem.playTankCannon) {
      AudioSystem.playTankCannon();
    }

    // Projectile sphere
    var geo  = new THREE.SphereGeometry(0.12, 6, 6);
    var mat  = new THREE.MeshBasicMaterial({ color: ammo.color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(muzzleLocal);
    _scene.add(mesh);

    _projectiles.push({
      mesh:     mesh,
      dir:      dir,
      speed:    ammo.speed,
      dmg:      ammo.dmg,
      blast:    ammo.blast,
      life:     4.0,
      isShell:  true
    });
  }

  var _mgTimer    = 0;
  var _mgFiring   = false;
  var _mgRoundCnt = 0;
  var _tmpQ       = new THREE.Quaternion();
  var _tmpV       = new THREE.Vector3();

  function _fireCoaxMG(t, dt) {
    if (!t || t.destroyed) return;
    if (t.mgBelt <= 0) return;

    _mgTimer -= dt;
    if (_mgTimer > 0) return;
    _mgTimer = 60 / MG_RPM;

    t.mgBelt = Math.max(0, t.mgBelt - 1);
    _mgRoundCnt++;

    // Coax muzzle world position (offset from barrel)
    var coaxLocal = new THREE.Vector3(0.22, -0.18, -1.85);
    t.barrelGroup.localToWorld(coaxLocal);

    // Direction with slight random spread
    var dir = new THREE.Vector3(0, 0, -1);
    t.barrelGroup.getWorldQuaternion(_tmpQ);
    dir.applyQuaternion(_tmpQ);
    dir.x += (Math.random() - 0.5) * 0.02;
    dir.y += (Math.random() - 0.5) * 0.02;
    dir.normalize();

    // Tracer every 5th round
    if (_mgRoundCnt % MG_TRACER_EVERY === 0) {
      var tGeo  = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4);
      var tMat  = new THREE.MeshBasicMaterial({ color: 0xFF8800 });
      var tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.copy(coaxLocal);
      // Align tracer to direction
      tMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      _scene.add(tMesh);
      _projectiles.push({
        mesh:    tMesh,
        dir:     dir,
        speed:   400,
        dmg:     MG_DMG,
        blast:   0.3,
        life:    0.5,
        isShell: false
      });
    }

    // Hitscan damage to nearest enemy in direction
    _doHitscanDmg(coaxLocal, dir, MG_DMG);

    // Audio
    if (window.AudioSystem && AudioSystem.playGunshot) {
      AudioSystem.playGunshot();
    }
  }

  function _doHitscanDmg(origin, dir, dmg) {
    if (!window._enemies) return;
    var best = null;
    var bestDist = 200;
    for (var i = 0; i < window._enemies.length; i++) {
      var e = window._enemies[i];
      if (!e || !e.mesh) continue;
      var toE = new THREE.Vector3().subVectors(e.mesh.position, origin);
      var dist = toE.length();
      if (dist > 200) continue;
      toE.normalize();
      var dot = toE.dot(dir);
      if (dot > 0.97 && dist < bestDist) {
        best = e;
        bestDist = dist;
      }
    }
    if (best && best.takeDamage) {
      best.takeDamage(dmg);
    }
  }

  // ── Explosion ─────────────────────────────────────────────
  function _doExplosion(pos, radius, dmg, scene) {
    if (!scene) return;
    // Flash sphere
    var geo  = new THREE.SphereGeometry(radius * 0.5, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF8800, transparent: true, opacity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);

    // Point light
    var light = new THREE.PointLight(0xFF6600, 4, radius * 3);
    light.position.copy(pos);
    scene.add(light);

    // Fade out
    var elapsed = 0;
    var ticker = setInterval(function () {
      elapsed += 0.05;
      if (elapsed > 0.4) {
        clearInterval(ticker);
        scene.remove(mesh);
        scene.remove(light);
        mesh.geometry.dispose();
        mesh.material.dispose();
        return;
      }
      mat.opacity = 0.8 * (1 - elapsed / 0.4);
      light.intensity = 4 * (1 - elapsed / 0.4);
    }, 50);

    // Damage enemies in radius
    if (!window._enemies) return;
    for (var i = 0; i < window._enemies.length; i++) {
      var e = window._enemies[i];
      if (!e || !e.mesh) continue;
      var dist = e.mesh.position.distanceTo(pos);
      if (dist <= radius) {
        var falloff = 1 - dist / radius;
        if (e.takeDamage) e.takeDamage(Math.round(dmg * falloff));
      }
    }
  }

  // ── Destroyed state ───────────────────────────────────────
  function _destroyTurret(t) {
    if (t.destroyed) return;
    t.destroyed = true;

    // Droop barrel
    if (t.barrelGroup) {
      t.barrelGroup.rotation.x = 0.6; // droop ~35°
    }

    // Darken hull
    if (t.hullMesh) {
      t.hullMesh.material = _matDestroyed;
    }

    // Fire flicker light
    var fireLight = new THREE.PointLight(0xFF4400, 2, 5);
    fireLight.position.copy(t.root.position);
    fireLight.position.y += 2;
    _scene.add(fireLight);

    // Fire mesh
    var fGeo  = new THREE.SphereGeometry(0.5, 6, 6);
    var fMat  = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.75 });
    var fMesh = new THREE.Mesh(fGeo, fMat);
    fMesh.position.copy(t.root.position);
    fMesh.position.y += 1.5;
    _scene.add(fMesh);

    t._fireLight = fireLight;
    t._fireMesh  = fMesh;
    t._fireMat   = fMat;

    // Dismount player if mounted
    if (window._playerMountedVehicleTurret === t) {
      dismount();
    }
  }

  // ── Update projectiles ────────────────────────────────────
  function _updateProjectiles(dt) {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var p = _projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _projectiles.splice(i, 1);
        continue;
      }
      var move = p.speed * dt;
      p.mesh.position.addScaledVector(p.dir, move);

      // Hit detection (simple ground plane + enemies)
      if (p.mesh.position.y <= 0.1 && p.isShell) {
        _doExplosion(p.mesh.position.clone(), p.blast, p.dmg, _scene);
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _projectiles.splice(i, 1);
        continue;
      }

      // Enemy hit
      if (window._enemies) {
        var hit = false;
        for (var j = 0; j < window._enemies.length; j++) {
          var e = window._enemies[j];
          if (!e || !e.mesh) continue;
          var dist = e.mesh.position.distanceTo(p.mesh.position);
          if (dist < 1.2) {
            if (p.isShell) {
              _doExplosion(p.mesh.position.clone(), p.blast, p.dmg, _scene);
            } else {
              if (e.takeDamage) e.takeDamage(p.dmg);
            }
            _scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            _projectiles.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }
    }
  }

  // ── Key/mouse state ───────────────────────────────────────
  var _keys           = {};
  var _lmbDown        = false;
  var _rmbDown        = false;
  var _keyHandler     = null;
  var _keyUpHandler   = null;
  var _mouseHandler   = null;
  var _clickHandler   = null;
  var _contextHandler = null;

  function _attachInputHandlers(t) {
    _keyHandler = function (e) {
      _keys[e.code] = true;
      if (!window._playerMountedVehicleTurret) return;

      // Q — cycle ammo type
      if (e.code === 'KeyQ') {
        t.ammoIdx = (t.ammoIdx + 1) % AMMO_TYPES.length;
      }
      // E — dismount
      if (e.code === 'KeyE') {
        dismount();
      }
    };
    _keyUpHandler = function (e) {
      _keys[e.code] = false;
    };
    _mouseHandler = function (e) {
      if (!window._playerMountedVehicleTurret) return;
      e.preventDefault();
    };
    _clickHandler = function (e) {
      if (!window._playerMountedVehicleTurret) return;
      var mt = window._playerMountedVehicleTurret;
      if (e.button === 0) { // LMB
        _lmbDown = true;
        _fireMainGun(mt);
      }
      if (e.button === 2) { // RMB
        _rmbDown = true;
      }
    };
    _contextHandler = function (e) {
      if (window._playerMountedVehicleTurret) e.preventDefault();
    };

    document.addEventListener('keydown',     _keyHandler,     false);
    document.addEventListener('keyup',       _keyUpHandler,   false);
    document.addEventListener('mousedown',   _clickHandler,   false);
    document.addEventListener('mouseup',     function (e) {
      if (e.button === 0) _lmbDown = false;
      if (e.button === 2) _rmbDown = false;
    }, false);
    document.addEventListener('contextmenu', _contextHandler, false);
  }

  function _detachInputHandlers() {
    if (_keyHandler)     document.removeEventListener('keydown',     _keyHandler,     false);
    if (_keyUpHandler)   document.removeEventListener('keyup',       _keyUpHandler,   false);
    if (_clickHandler)   document.removeEventListener('mousedown',   _clickHandler,   false);
    if (_contextHandler) document.removeEventListener('contextmenu', _contextHandler, false);
    _keyHandler     = null;
    _keyUpHandler   = null;
    _mouseHandler   = null;
    _clickHandler   = null;
    _contextHandler = null;
    _keys = {};
    _lmbDown = false;
    _rmbDown = false;
  }

  // ── Mount / dismount ──────────────────────────────────────
  function mount(t) {
    if (!t || t.destroyed) return;
    if (window._playerMountedVehicleTurret) return; // already mounted

    window._playerMountedVehicleTurret = t;
    t.mounted = true;

    // Snap camera to turret cupola position
    if (_camera) {
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      _camera.position.set(wp.x, wp.y + 3.0, wp.z);
      _camera._vtOrigPos = _camera.position.clone(); // stash for return
    }

    // Disable character controls
    if (_controls) {
      if (typeof _controls.lock === 'function') {
        // PointerLockControls — keep locked but override input
      }
      _controls._vtDisabled = true;
    }

    _updateHUD(t);
  }

  function dismount() {
    var t = window._playerMountedVehicleTurret;
    if (!t) return;

    t.mounted = false;
    window._playerMountedVehicleTurret = null;

    // Restore camera position beside hull
    if (_camera && _camera._vtOrigPos) {
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      _camera.position.set(wp.x + 3, wp.y + 1.6, wp.z + 3);
    }

    // Re-enable controls
    if (_controls) {
      _controls._vtDisabled = false;
    }

    _lmbDown = false;
    _rmbDown = false;
    _mgFiring = false;

    _updateHUD(null);
  }

  // ── Per-frame update for mounted turret ───────────────────
  var ROTATE_SPEED = 1.4; // rad/s
  var ELEVATE_SPEED = 0.8;

  function _updateMountedControl(t, dt) {
    if (!t || !t.mounted) return;

    // A/D — rotate turret ring (360° freedom)
    if (_keys['KeyA']) {
      t.turretGroup.rotation.y += ROTATE_SPEED * dt;
    }
    if (_keys['KeyD']) {
      t.turretGroup.rotation.y -= ROTATE_SPEED * dt;
    }

    // W/S — elevate barrel, clamped ±
    if (_keys['KeyW']) {
      t.barrelElevation = Math.max(BARREL_ELEV_MIN, t.barrelElevation - ELEVATE_SPEED * dt);
    }
    if (_keys['KeyS']) {
      t.barrelElevation = Math.min(BARREL_ELEV_MAX, t.barrelElevation + ELEVATE_SPEED * dt);
    }
    t.barrelGroup.rotation.x = t.barrelElevation;

    // Camera follows turret
    if (_camera) {
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      var camX = wp.x + Math.sin(t.turretGroup.rotation.y) * 1.5;
      var camZ = wp.z + Math.cos(t.turretGroup.rotation.y) * 1.5;
      _camera.position.set(camX, wp.y + 2.8, camZ);
      _camera.lookAt(
        wp.x - Math.sin(t.turretGroup.rotation.y) * 8,
        wp.y + 0.8 + Math.sin(-t.barrelElevation) * 5,
        wp.z - Math.cos(t.turretGroup.rotation.y) * 8
      );
    }

    // RMB — coaxial MG fire
    if (_rmbDown) {
      _mgFiring = true;
    } else {
      _mgFiring = false;
    }
    if (_mgFiring) {
      _fireCoaxMG(t, dt);
    } else {
      _mgTimer = 0;
    }

    // Shell reload countdown
    if (t.shellReloadTimer > 0) {
      t.shellReloadTimer -= dt;
      if (t.shellReloadTimer < 0) t.shellReloadTimer = 0;
    }

    _updateHUD(t);
  }

  // ── Spawn ─────────────────────────────────────────────────
  function spawn(scene, x, y, z) {
    if (!scene) { console.warn('[VehicleTurret] spawn() requires scene'); return null; }

    _initMats();
    var parts = _buildTurretGroup();
    parts.root.position.set(x || 0, y || 0, z || 0);
    scene.add(parts.root);

    var t = {
      root:             parts.root,
      turretGroup:      parts.turretGroup,
      barrelGroup:      parts.barrelGroup,
      hullMesh:         parts.hullMesh,
      cannonMesh:       parts.cannonMesh,
      flashMesh:        parts.flashMesh,
      hp:               TURRET_HP_MAX,
      destroyed:        false,
      mounted:          false,
      ammoIdx:          0,           // APFSDS by default
      shellReloadTimer: 0,
      barrelElevation:  0,
      mgBelt:           MG_BELT_MAX,
      _fireLight:       null,
      _fireMesh:        null,
      _fireMat:         null,
      _fireFlicker:     0
    };

    window._vehicleTurrets.push(t);
    return t;
  }

  // ── F-key proximity check (called from game loop or input) ──
  function _checkMountProximity(playerPos) {
    if (window._playerMountedVehicleTurret) return; // already in turret
    for (var i = 0; i < window._vehicleTurrets.length; i++) {
      var t = window._vehicleTurrets[i];
      if (t.destroyed) continue;
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      var dist = wp.distanceTo(playerPos);
      if (dist <= MOUNT_DIST) {
        mount(t);
        return;
      }
    }
  }

  // ── takeDamage (called externally or by explosion) ────────
  function _applyDamage(t, dmg) {
    if (!t || t.destroyed) return;
    t.hp -= dmg;
    if (t.hp <= 0) {
      t.hp = 0;
      _destroyTurret(t);
    }
  }

  // ── Init ─────────────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene    || _scene;
    _camera   = camera   || _camera;
    _controls = controls || _controls;

    _createHUD();
    _attachInputHandlers(null); // handlers are turret-aware via global

    // Listen for F key to mount
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyF') return;
      var playerPos = null;
      if (_camera) {
        playerPos = _camera.position.clone();
        playerPos.y -= 1.5; // approximate ground level
      } else if (window._playerPos) {
        playerPos = window._playerPos.clone();
      }
      if (playerPos) _checkMountProximity(playerPos);
    }, false);
  }

  // ── Update (call every frame with delta time) ─────────────
  function update(dt) {
    if (!dt || dt <= 0) return;

    var mt = window._playerMountedVehicleTurret;

    // Update mounted turret controls
    if (mt) {
      _updateMountedControl(mt, dt);
    }

    // Update projectiles
    if (_scene) _updateProjectiles(dt);

    // Screen shake
    _applyScreenShake(dt);

    // Fire flicker on destroyed turrets
    for (var i = 0; i < window._vehicleTurrets.length; i++) {
      var t = window._vehicleTurrets[i];
      if (t.destroyed && t._fireLight) {
        t._fireFlicker += dt * 8;
        var flicker = 1.5 + Math.sin(t._fireFlicker) * 0.8 + Math.random() * 0.5;
        t._fireLight.intensity = flicker;
        if (t._fireMesh) {
          t._fireMesh.scale.setScalar(0.9 + Math.sin(t._fireFlicker * 1.3) * 0.15);
        }
        if (t._fireMat) {
          t._fireMat.opacity = 0.6 + Math.sin(t._fireFlicker * 0.7) * 0.2;
        }
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────
  function reset() {
    // Dismount if mounted
    if (window._playerMountedVehicleTurret) {
      dismount();
    }

    // Remove all turrets from scene
    for (var i = 0; i < window._vehicleTurrets.length; i++) {
      var t = window._vehicleTurrets[i];
      if (t.root && _scene) _scene.remove(t.root);
      if (t._fireLight && _scene) _scene.remove(t._fireLight);
      if (t._fireMesh  && _scene) _scene.remove(t._fireMesh);
    }
    window._vehicleTurrets = [];

    // Clear projectiles
    for (var j = 0; j < _projectiles.length; j++) {
      var p = _projectiles[j];
      if (_scene) _scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    _projectiles = [];

    // Reset shake
    _shakeTime = 0;
    _shakeAmt  = 0;

    // Hide HUD
    if (_hud) _hud.style.display = 'none';

    _mgTimer    = 0;
    _mgRoundCnt = 0;
    _lmbDown    = false;
    _rmbDown    = false;
    _mgFiring   = false;
    _keys       = {};
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init:     init,
    update:   update,
    spawn:    spawn,
    mount:    mount,
    dismount: dismount,
    reset:    reset
  };

})();
