/* ───────────────────────────────────────────────────────────────────────────
   artillery-duel.js — Artillery Duel Mini-Game
   API: window.ArtilleryDuel = { init, update, reset }
   Controls:
     A + L (together within 400ms)  → activate module
     W / S                          → elevate barrel up / down
     A / D                          → traverse barrel left / right
     Space                          → fire friendly shell
     R                              → toggle radar overlay
     T                              → show trajectory preview
     B                              → barrage mode (3 rapid shots)
   ─────────────────────────────────────────────────────────────────────────── */
window.ArtilleryDuel = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active       = false;
  var _keyPressTime = { A: 0, L: 0 };
  var ACTIVATE_WINDOW = 400; // ms

  /* ── Constants ─────────────────────────────────────────────────────────── */
  var FRIENDLY_AMMO_MAX  = 12;
  var RESUPPLY_AMMO      = 8;
  var RESUPPLY_INTERVAL  = 60;
  var ENEMY_FIRE_MIN     = 15;
  var ENEMY_FIRE_MAX     = 25;
  var SHELL_FLIGHT_TIME  = 5;
  var DAMAGE_RADIUS      = 10;
  var SUPPRESS_DURATION  = 5;
  var BARRAGE_INTERVAL   = 1.5;
  var BARRAGE_SHELLS     = 3;
  var FLANK_RANGE        = 15;
  var ENEMY_COUNT        = 3;
  var CREW_COUNT         = 3;
  var INFANTRY_COUNT     = 4;

  /* ── Friendly howitzer ─────────────────────────────────────────────────── */
  var _howitzerGroup  = null;
  var _barrel         = null;
  var _barrelPitch    = 0.4;   // radians elevation
  var _barrelYaw      = 0;     // radians traverse
  var _PITCH_MIN      = 0.1;
  var _PITCH_MAX      = 1.2;

  /* ── Ammo and reload ───────────────────────────────────────────────────── */
  var _ammo           = FRIENDLY_AMMO_MAX;
  var _reloadTimer    = 0;
  var _RELOAD_TIME    = 5;
  var _reloading      = false;

  /* ── Crew ──────────────────────────────────────────────────────────────── */
  var _crew           = [];   // { mesh, alive, role }
  var _crewAlive      = CREW_COUNT;

  /* ── Enemy guns ────────────────────────────────────────────────────────── */
  var _enemyGuns      = [];   // { group, pos, alive, suppressed, suppressTimer, fireTimer, revealed, revealTimer, destroyed, fallAnim }

  /* ── Shells in flight ──────────────────────────────────────────────────── */
  var _shells         = [];   // { mesh, light, start, end, startTime, duration, friendly, exploded }

  /* ── Explosions ────────────────────────────────────────────────────────── */
  var _explosions     = [];   // { light, life, maxLife }

  /* ── Trajectory preview ────────────────────────────────────────────────── */
  var _trajectoryLine = null;
  var _showTrajectory = false;

  /* ── Radar ─────────────────────────────────────────────────────────────── */
  var _radarActive    = false;
  var _radarCanvas    = null;
  var _radarCtx       = null;
  var _radarWrapper   = null;

  /* ── Resupply truck ────────────────────────────────────────────────────── */
  var _truckMesh      = null;
  var _truckTimer     = 0;
  var _truckActive    = false;
  var _truckPos       = null;
  var _truckTarget    = null;
  var _truckDelivered = false;

  /* ── Infantry escort ───────────────────────────────────────────────────── */
  var _infantry       = [];   // { mesh, pos, alive, advancing, flankTimer, target }

  /* ── Barrage ───────────────────────────────────────────────────────────── */
  var _barrageActive  = false;
  var _barrageShots   = 0;
  var _barrageTimer   = 0;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud            = null;

  /* ── Incoming timer display ────────────────────────────────────────────── */
  var _nextIncoming   = 0;

  /* ── Guns destroyed count ──────────────────────────────────────────────── */
  var _gunsDown       = 0;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys           = {};

  /* ── Audio ─────────────────────────────────────────────────────────────── */
  var _audioCtx       = null;

  /* ══════════════════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════════════════ */

  function init(sceneRef, cameraRef, rendererRef) {
    _scene    = sceneRef;
    _camera   = cameraRef;
    _renderer = rendererRef;

    _createHUD();
    _createRadar();

    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup',   handleKeyUp,   false);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE  (called each frame by the host game loop)
  ══════════════════════════════════════════════════════════════════════════ */

  function update(delta) {
    if (!_active) return;

    _processAim(delta);
    updateShells(delta);
    _updateEnemyFire(delta);
    updateResupplyTruck(delta);
    updateInfantry(delta);
    _updateExplosions(delta);
    _updateReload(delta);
    _updateBarrage(delta);
    _updateFallAnimations(delta);

    if (_showTrajectory) showTrajectory();

    updateRadar();
    updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RESET
  ══════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active = false;

    /* Remove all scene objects */
    if (_howitzerGroup) { _scene.remove(_howitzerGroup); _howitzerGroup = null; }

    var i;
    for (i = 0; i < _enemyGuns.length; i++) {
      if (_enemyGuns[i].group) _scene.remove(_enemyGuns[i].group);
    }
    _enemyGuns = [];

    for (i = 0; i < _shells.length; i++) {
      if (_shells[i].mesh)  _scene.remove(_shells[i].mesh);
      if (_shells[i].light) _scene.remove(_shells[i].light);
    }
    _shells = [];

    for (i = 0; i < _explosions.length; i++) {
      if (_explosions[i].light) _scene.remove(_explosions[i].light);
    }
    _explosions = [];

    for (i = 0; i < _crew.length; i++) {
      if (_crew[i].mesh) _scene.remove(_crew[i].mesh);
    }
    _crew = [];

    for (i = 0; i < _infantry.length; i++) {
      if (_infantry[i].mesh) _scene.remove(_infantry[i].mesh);
    }
    _infantry = [];

    if (_truckMesh) { _scene.remove(_truckMesh); _truckMesh = null; }
    if (_trajectoryLine) { _scene.remove(_trajectoryLine); _trajectoryLine = null; }

    _ammo          = FRIENDLY_AMMO_MAX;
    _gunsDown      = 0;
    _crewAlive     = CREW_COUNT;
    _barrageActive = false;
    _barrageShots  = 0;
    _barrageTimer  = 0;
    _reloading     = false;
    _reloadTimer   = 0;
    _truckActive   = false;
    _truckTimer    = 0;
    _truckDelivered= false;
    _showTrajectory= false;
    _radarActive   = false;

    if (_hud) _hud.style.display = 'none';
    if (_radarWrapper) _radarWrapper.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SCENE BUILDERS
  ══════════════════════════════════════════════════════════════════════════ */

  function createHowitzer() {
    _howitzerGroup = new THREE.Group();

    /* Carriage — BoxGeometry */
    var carriageGeo = new THREE.BoxGeometry(3, 1.5, 2);
    var carriageMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var carriage    = new THREE.Mesh(carriageGeo, carriageMat);
    carriage.position.set(0, 0.75, 0);
    _howitzerGroup.add(carriage);

    /* Wheel left */
    var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 10);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var wL       = new THREE.Mesh(wheelGeo, wheelMat);
    wL.rotation.z = Math.PI / 2;
    wL.position.set(-1.6, 0.6, 0);
    _howitzerGroup.add(wL);

    /* Wheel right */
    var wR = new THREE.Mesh(wheelGeo, wheelMat);
    wR.rotation.z = Math.PI / 2;
    wR.position.set(1.6, 0.6, 0);
    _howitzerGroup.add(wR);

    /* Barrel pivot group */
    var barrelPivot = new THREE.Group();
    barrelPivot.position.set(0, 1.8, 0);

    /* Barrel — CylinderGeometry */
    var barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    _barrel       = new THREE.Mesh(barrelGeo, barrelMat);
    _barrel.rotation.x = -Math.PI / 2;    // point forward along -Z
    _barrel.position.set(0, 0, -2);       // offset so pivot is at breech
    barrelPivot.add(_barrel);

    _howitzerGroup.add(barrelPivot);
    _howitzerGroup._barrelPivot = barrelPivot;

    _howitzerGroup.position.set(0, 0, 0);
    _scene.add(_howitzerGroup);
  }

  function createEnemyGun(position) {
    var group = new THREE.Group();

    /* Enemy carriage */
    var carriageGeo = new THREE.BoxGeometry(2.5, 1.2, 1.8);
    var carriageMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    var carriage    = new THREE.Mesh(carriageGeo, carriageMat);
    carriage.position.set(0, 0.6, 0);
    group.add(carriage);

    /* Enemy gun barrel */
    var barrelGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.5, 8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    var barrel    = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = -Math.PI / 2;
    barrel.position.set(0, 1.5, -1.5);
    group.add(barrel);

    group.position.copy(position);
    _scene.add(group);

    return {
      group:          group,
      pos:            position.clone(),
      alive:          true,
      suppressed:     false,
      suppressTimer:  0,
      fireTimer:      ENEMY_FIRE_MIN + Math.random() * (ENEMY_FIRE_MAX - ENEMY_FIRE_MIN),
      revealed:       false,
      revealTimer:    0,
      destroyed:      false,
      fallAnim:       0
    };
  }

  function _createCrew() {
    var crewPositions = [
      new THREE.Vector3(-1.5, 1.5, 1.2),
      new THREE.Vector3( 0,   1.5, 1.5),
      new THREE.Vector3( 1.5, 1.5, 1.2)
    ];
    var roles = ['loader', 'aimer', 'commander'];
    _crew = [];
    for (var i = 0; i < CREW_COUNT; i++) {
      var crewGeo = new THREE.BoxGeometry(0.4, 0.8, 0.3);
      var crewMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
      var crewMesh= new THREE.Mesh(crewGeo, crewMat);
      crewMesh.position.copy(crewPositions[i]);
      _howitzerGroup.add(crewMesh);
      _crew.push({ mesh: crewMesh, alive: true, role: roles[i] });
    }
    _crewAlive = CREW_COUNT;
  }

  function _createInfantry() {
    _infantry = [];
    for (var i = 0; i < INFANTRY_COUNT; i++) {
      var geo  = new THREE.BoxGeometry(0.4, 0.9, 0.3);
      var mat  = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var mesh = new THREE.Mesh(geo, mat);
      var startPos = new THREE.Vector3(
        (i - 1.5) * 2,
        0.45,
        5 + Math.random() * 3
      );
      mesh.position.copy(startPos);
      _scene.add(mesh);
      _infantry.push({
        mesh:        mesh,
        pos:         startPos.clone(),
        alive:       true,
        advancing:   true,
        flankTimer:  0,
        target:      null
      });
    }
  }

  function _createResupplyTruck() {
    var geo  = new THREE.BoxGeometry(3, 1.5, 5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x6B6B4A });
    _truckMesh = new THREE.Mesh(geo, mat);
    /* Start from map edge */
    _truckPos    = new THREE.Vector3(-60, 0.75, -60);
    _truckTarget = new THREE.Vector3(-4, 0.75, 5);
    _truckMesh.position.copy(_truckPos);
    _scene.add(_truckMesh);
    _truckActive   = true;
    _truckDelivered= false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ══════════════════════════════════════════════════════════════════════════ */

  function _activateModule() {
    if (_active) return;
    _active = true;

    /* Reset state */
    _ammo          = FRIENDLY_AMMO_MAX;
    _gunsDown      = 0;
    _crewAlive     = CREW_COUNT;
    _barrageActive = false;
    _barrageShots  = 0;
    _barrageTimer  = 0;
    _reloading     = false;
    _reloadTimer   = 0;
    _truckActive   = false;
    _truckTimer    = 0;
    _truckDelivered= false;
    _showTrajectory= false;
    _barrelPitch   = 0.4;
    _barrelYaw     = 0;
    _shells        = [];
    _explosions    = [];
    _nextIncoming  = ENEMY_FIRE_MIN;

    createHowitzer();
    _createCrew();

    /* Spawn 3 enemy guns at 60-100 unit range */
    _enemyGuns = [];
    var angles = [0.8, 2.4, 4.2];   // radians spread
    for (var i = 0; i < ENEMY_COUNT; i++) {
      var dist = 60 + Math.random() * 40;
      var ang  = angles[i] + (Math.random() - 0.5) * 0.5;
      var pos  = new THREE.Vector3(
        Math.sin(ang) * dist,
        0,
        -Math.cos(ang) * dist
      );
      _enemyGuns.push(createEnemyGun(pos));
    }

    _createInfantry();

    if (_hud) _hud.style.display = 'block';
    if (_radarWrapper) _radarWrapper.style.display = 'none';

    updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     AIMING
  ══════════════════════════════════════════════════════════════════════════ */

  function _processAim(delta) {
    if (!_howitzerGroup) return;
    var TRAVERSE_SPEED = 1.0; // rad/s
    var ELEVATE_SPEED  = 0.8;
    var aimChanged     = false;

    if (_keys['w'] || _keys['W']) {
      _barrelPitch = Math.min(_PITCH_MAX, _barrelPitch + ELEVATE_SPEED * delta);
      aimChanged = true;
    }
    if (_keys['s'] || _keys['S']) {
      _barrelPitch = Math.max(_PITCH_MIN, _barrelPitch - ELEVATE_SPEED * delta);
      aimChanged = true;
    }
    if (_keys['a'] || _keys['A']) {
      _barrelYaw += TRAVERSE_SPEED * delta;
      aimChanged = true;
    }
    if (_keys['d'] || _keys['D']) {
      _barrelYaw -= TRAVERSE_SPEED * delta;
      aimChanged = true;
    }

    if (aimChanged) {
      var pivot = _howitzerGroup._barrelPivot;
      if (pivot) {
        pivot.rotation.y = _barrelYaw;
        if (_barrel) {
          _barrel.rotation.x = -Math.PI / 2 - _barrelPitch;
        }
      }
      if (_showTrajectory) showTrajectory();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHELL FIRING
  ══════════════════════════════════════════════════════════════════════════ */

  function fireFriendlyShell() {
    if (!_active) return;
    if (_reloading) return;
    if (_ammo <= 0) return;

    _ammo--;
    _reloading    = true;
    _reloadTimer  = _RELOAD_TIME;

    /* Compute muzzle direction from barrel orientation */
    var dir = new THREE.Vector3(
      Math.sin(_barrelYaw) * Math.cos(_barrelPitch),
      Math.sin(_barrelPitch),
      -Math.cos(_barrelYaw) * Math.cos(_barrelPitch)
    );

    var startPos = _howitzerGroup.position.clone().add(new THREE.Vector3(0, 2, 0));
    var range    = 80 + Math.random() * 20;
    var endPos   = startPos.clone().addScaledVector(dir, range);
    endPos.y     = 0;

    _spawnShell(startPos, endPos, true);
    playSound(80, 0.6);

    /* Resupply truck countdown */
    if (!_truckActive && !_truckDelivered && _ammo <= FRIENDLY_AMMO_MAX - 4) {
      _truckTimer = RESUPPLY_INTERVAL;
    }
  }

  function fireEnemyShell(gun) {
    if (!gun.alive || gun.suppressed || gun.destroyed) return;

    gun.revealed    = true;
    gun.revealTimer = 2;   // revealed for 2 seconds on radar

    var startPos = gun.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
    /* Aim at howitzer position with some scatter */
    var target   = _howitzerGroup
      ? _howitzerGroup.position.clone()
      : new THREE.Vector3(0, 0, 0);
    target.x    += (Math.random() - 0.5) * 8;
    target.z    += (Math.random() - 0.5) * 8;
    target.y     = 0;

    _spawnShell(startPos, target, false);
    playSound(120, 0.5);

    /* Randomise next fire time */
    gun.fireTimer = ENEMY_FIRE_MIN + Math.random() * (ENEMY_FIRE_MAX - ENEMY_FIRE_MIN);
    _updateNextIncomingDisplay();
  }

  function _spawnShell(start, end, friendly) {
    var geo  = new THREE.SphereGeometry(0.4, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: friendly ? 0x88AA44 : 0x333333 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start);
    _scene.add(mesh);

    _shells.push({
      mesh:      mesh,
      light:     null,
      start:     start.clone(),
      end:       end.clone(),
      startTime: 0,
      elapsed:   0,
      duration:  SHELL_FLIGHT_TIME,
      friendly:  friendly,
      exploded:  false
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE SHELLS  (parabolic arc)
  ══════════════════════════════════════════════════════════════════════════ */

  function updateShells(delta) {
    var i, s, t, pos, midY, dx, dz, dist, j, gun, crewMember;

    for (i = _shells.length - 1; i >= 0; i--) {
      s = _shells[i];
      if (s.exploded) continue;

      s.elapsed += delta;
      t          = Math.min(s.elapsed / s.duration, 1);

      /* Parabolic interpolation */
      pos  = new THREE.Vector3().lerpVectors(s.start, s.end, t);
      dist = s.start.distanceTo(s.end);
      midY = dist * 0.35;
      pos.y += midY * 4 * t * (1 - t);

      s.mesh.position.copy(pos);

      if (t >= 1) {
        /* Shell landed */
        s.exploded = true;
        createExplosion(s.end.clone());

        if (!s.friendly) {
          /* Check damage to howitzer / crew */
          if (_howitzerGroup) {
            dx   = s.end.x - _howitzerGroup.position.x;
            dz   = s.end.z - _howitzerGroup.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < DAMAGE_RADIUS) {
              /* Kill a random alive crew member */
              for (j = 0; j < _crew.length; j++) {
                crewMember = _crew[j];
                if (crewMember.alive) {
                  crewMember.alive = false;
                  crewMember.mesh.visible = false;
                  _crewAlive = Math.max(0, _crewAlive - 1);
                  break;
                }
              }
            }
          }
        } else {
          /* Friendly shell — check enemy gun hits */
          for (j = 0; j < _enemyGuns.length; j++) {
            gun = _enemyGuns[j];
            if (!gun.alive || gun.destroyed) continue;
            dx   = s.end.x - gun.pos.x;
            dz   = s.end.z - gun.pos.z;
            var d = Math.sqrt(dx * dx + dz * dz);
            if (d < 2.5) {
              /* Direct hit — destroy gun */
              _destroyEnemyGun(gun);
            } else if (d < DAMAGE_RADIUS) {
              /* Near miss — suppress crew */
              gun.suppressed    = true;
              gun.suppressTimer = SUPPRESS_DURATION;
            }
          }
          /* Check infantry flanking eligibility */
          _checkInfantryFlank(s.end);
        }

        _scene.remove(s.mesh);
        _shells.splice(i, 1);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY FIRE AI
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateEnemyFire(delta) {
    var minNext = 9999;
    for (var i = 0; i < _enemyGuns.length; i++) {
      var gun = _enemyGuns[i];
      if (!gun.alive || gun.destroyed) continue;

      if (gun.suppressed) {
        gun.suppressTimer -= delta;
        if (gun.suppressTimer <= 0) {
          gun.suppressed = false;
        }
        continue;
      }

      if (gun.revealed && gun.revealTimer > 0) {
        gun.revealTimer -= delta;
        if (gun.revealTimer <= 0) gun.revealed = false;
      }

      gun.fireTimer -= delta;
      if (gun.fireTimer < minNext) minNext = gun.fireTimer;

      if (gun.fireTimer <= 0) {
        fireEnemyShell(gun);
      }
    }
    _nextIncoming = Math.max(0, minNext);
  }

  function _updateNextIncomingDisplay() {
    var min = 9999;
    for (var i = 0; i < _enemyGuns.length; i++) {
      var g = _enemyGuns[i];
      if (g.alive && !g.destroyed && !g.suppressed && g.fireTimer < min) {
        min = g.fireTimer;
      }
    }
    _nextIncoming = Math.max(0, min);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DESTROY ENEMY GUN
  ══════════════════════════════════════════════════════════════════════════ */

  function _destroyEnemyGun(gun) {
    gun.alive     = false;
    gun.destroyed = true;
    gun.fallAnim  = 0;
    _gunsDown++;
    createExplosion(gun.pos.clone().add(new THREE.Vector3(0, 1, 0)));
  }

  function _updateFallAnimations(delta) {
    for (var i = 0; i < _enemyGuns.length; i++) {
      var gun = _enemyGuns[i];
      if (!gun.destroyed) continue;
      gun.fallAnim += delta;
      if (gun.fallAnim < 1.5 && gun.group) {
        gun.group.rotation.z = gun.fallAnim * 0.8;
        gun.group.position.y = -gun.fallAnim * gun.fallAnim * 0.5;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ══════════════════════════════════════════════════════════════════════════ */

  function createExplosion(pos) {
    var light = new THREE.PointLight(0xFF8800, 8, 20);
    light.position.copy(pos);
    light.position.y += 1;
    _scene.add(light);
    _explosions.push({ light: light, life: 0.8, maxLife: 0.8 });
  }

  function _updateExplosions(delta) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= delta;
      if (ex.life <= 0) {
        _scene.remove(ex.light);
        _explosions.splice(i, 1);
      } else {
        ex.light.intensity = (ex.life / ex.maxLife) * 8;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RELOAD
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateReload(delta) {
    if (!_reloading) return;

    /* Loader crew speeds up reload */
    var loaderAlive = false;
    for (var i = 0; i < _crew.length; i++) {
      if (_crew[i].role === 'loader' && _crew[i].alive) { loaderAlive = true; break; }
    }
    var rate = loaderAlive ? 1.3 : 1.0;
    _reloadTimer -= delta * rate;

    if (_reloadTimer <= 0) {
      _reloading = false;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BARRAGE MODE
  ══════════════════════════════════════════════════════════════════════════ */

  function startBarrage() {
    if (!_active) return;
    if (_barrageActive) return;
    if (_ammo < BARRAGE_SHELLS) return;
    if (_reloading) return;

    _barrageActive = true;
    _barrageShots  = BARRAGE_SHELLS;
    _barrageTimer  = 0;

    /* Fire first shot immediately */
    fireFriendlyShell();
    _barrageShots--;
  }

  function _updateBarrage(delta) {
    if (!_barrageActive) return;
    if (_barrageShots <= 0) { _barrageActive = false; return; }

    _barrageTimer += delta;
    if (_barrageTimer >= BARRAGE_INTERVAL) {
      _barrageTimer = 0;
      if (!_reloading) {
        fireFriendlyShell();
        _barrageShots--;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TRAJECTORY PREVIEW
  ══════════════════════════════════════════════════════════════════════════ */

  function showTrajectory() {
    if (_trajectoryLine) {
      _scene.remove(_trajectoryLine);
      _trajectoryLine = null;
    }
    if (!_showTrajectory || !_howitzerGroup) return;

    var dir = new THREE.Vector3(
      Math.sin(_barrelYaw) * Math.cos(_barrelPitch),
      Math.sin(_barrelPitch),
      -Math.cos(_barrelYaw) * Math.cos(_barrelPitch)
    );

    var startPos = _howitzerGroup.position.clone().add(new THREE.Vector3(0, 2, 0));
    var range    = 80;
    var endPos   = startPos.clone().addScaledVector(dir, range);
    endPos.y     = 0;

    var STEPS    = 24;
    var points   = [];
    var dist     = startPos.distanceTo(endPos);
    var midY     = dist * 0.35;

    for (var i = 0; i <= STEPS; i++) {
      var t   = i / STEPS;
      var p   = new THREE.Vector3().lerpVectors(startPos, endPos, t);
      p.y    += midY * 4 * t * (1 - t);
      points.push(p.x, p.y, p.z);
    }

    var geo  = new THREE.BufferGeometry();
    var arr  = new Float32Array(points);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));

    /* Build LineSegments from point pairs */
    var pairPoints = [];
    for (var j = 0; j < STEPS; j++) {
      pairPoints.push(
        points[j * 3], points[j * 3 + 1], points[j * 3 + 2],
        points[(j + 1) * 3], points[(j + 1) * 3 + 1], points[(j + 1) * 3 + 2]
      );
    }
    var segGeo  = new THREE.BufferGeometry();
    var segArr  = new Float32Array(pairPoints);
    segGeo.setAttribute('position', new THREE.BufferAttribute(segArr, 3));
    var segMat  = new THREE.LineBasicMaterial({ color: 0xFFFF00, opacity: 0.6, transparent: true });
    _trajectoryLine = new THREE.LineSegments(segGeo, segMat);
    _scene.add(_trajectoryLine);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RESUPPLY TRUCK
  ══════════════════════════════════════════════════════════════════════════ */

  function updateResupplyTruck(delta) {
    if (_truckDelivered) return;

    /* Start countdown after first shells fired */
    if (!_truckActive && _ammo < FRIENDLY_AMMO_MAX) {
      _truckTimer -= delta;
      if (_truckTimer <= 0 && _ammo < FRIENDLY_AMMO_MAX) {
        _createResupplyTruck();
      }
      return;
    }

    if (!_truckActive || !_truckMesh) return;

    /* Drive toward target */
    var toTarget = new THREE.Vector3().subVectors(_truckTarget, _truckMesh.position);
    var dist     = toTarget.length();
    if (dist < 1.5) {
      /* Deliver ammo */
      _ammo          = Math.min(FRIENDLY_AMMO_MAX, _ammo + RESUPPLY_AMMO);
      _truckDelivered= true;
      _truckActive   = false;

      /* Drive truck off map after a delay */
      var departTarget = new THREE.Vector3(60, 0.75, 60);
      _truckTarget     = departTarget;
      /* keep mesh for 3 seconds then remove */
      _truckMesh._departTimer = 3;
    } else {
      var TRUCK_SPEED = 8;
      toTarget.normalize().multiplyScalar(TRUCK_SPEED * delta);
      _truckMesh.position.add(toTarget);
    }

    /* Departure animation */
    if (_truckDelivered && _truckMesh) {
      if (_truckMesh._departTimer !== undefined) {
        _truckMesh._departTimer -= delta;
        var toDepart = new THREE.Vector3().subVectors(_truckTarget, _truckMesh.position);
        toDepart.normalize().multiplyScalar(8 * delta);
        _truckMesh.position.add(toDepart);
        if (_truckMesh._departTimer <= 0) {
          _scene.remove(_truckMesh);
          _truckMesh = null;
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INFANTRY
  ══════════════════════════════════════════════════════════════════════════ */

  function updateInfantry(delta) {
    for (var i = 0; i < _infantry.length; i++) {
      var inf = _infantry[i];
      if (!inf.alive) continue;

      /* Advance between shots — move forward (toward enemy) */
      if (inf.advancing && !_reloading) {
        var MARCH_SPEED = 2;
        inf.pos.z      -= MARCH_SPEED * delta;
        inf.mesh.position.copy(inf.pos);

        /* If flank target assigned and in range */
        if (inf.target && !inf.target.destroyed) {
          var toGun = new THREE.Vector3().subVectors(inf.target.pos, inf.pos);
          if (toGun.length() < FLANK_RANGE) {
            /* Disable gun */
            inf.target.suppressed    = true;
            inf.target.suppressTimer = 8;
            inf.advancing            = false;
          }
        }
      }
    }
  }

  function _checkInfantryFlank(shellLandPos) {
    /* Assign nearest suppressed gun as flank target for idle infantry */
    for (var i = 0; i < _infantry.length; i++) {
      var inf = _infantry[i];
      if (!inf.alive || inf.target) continue;
      for (var j = 0; j < _enemyGuns.length; j++) {
        var gun = _enemyGuns[j];
        if (!gun.alive || gun.destroyed) continue;
        var dx = shellLandPos.x - gun.pos.x;
        var dz = shellLandPos.z - gun.pos.z;
        if (Math.sqrt(dx * dx + dz * dz) < DAMAGE_RADIUS && gun.suppressed) {
          inf.target    = gun;
          inf.advancing = true;
          break;
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RADAR OVERLAY
  ══════════════════════════════════════════════════════════════════════════ */

  function _createRadar() {
    _radarWrapper = document.createElement('div');
    _radarWrapper.style.cssText = [
      'position:fixed',
      'top:80px',
      'right:16px',
      'width:200px',
      'height:200px',
      'background:rgba(0,20,0,0.85)',
      'border:1px solid #0f0',
      'display:none',
      'z-index:9999'
    ].join(';');

    var label = document.createElement('div');
    label.textContent = 'RADAR';
    label.style.cssText = 'color:#0f0;font-family:monospace;font-size:10px;text-align:center;padding:2px;';
    _radarWrapper.appendChild(label);

    _radarCanvas = document.createElement('canvas');
    _radarCanvas.width  = 200;
    _radarCanvas.height = 188;
    _radarWrapper.appendChild(_radarCanvas);
    _radarCtx = _radarCanvas.getContext('2d');

    document.body.appendChild(_radarWrapper);
  }

  function updateRadar() {
    if (!_radarActive || !_radarCtx) return;

    var ctx = _radarCtx;
    var W   = _radarCanvas.width;
    var H   = _radarCanvas.height;
    var CX  = W / 2;
    var CY  = H / 2;
    var SCALE = 1.5; /* pixels per world unit */

    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = 'rgba(0,10,0,0.9)';
    ctx.fillRect(0, 0, W, H);

    /* Range rings */
    ctx.strokeStyle = '#004400';
    ctx.lineWidth   = 1;
    for (var r = 20; r <= 100; r += 20) {
      ctx.beginPath();
      ctx.arc(CX, CY, r * SCALE * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* Cross */
    ctx.strokeStyle = '#004400';
    ctx.beginPath();
    ctx.moveTo(CX, 0); ctx.lineTo(CX, H);
    ctx.moveTo(0, CY); ctx.lineTo(W, CY);
    ctx.stroke();

    /* Friendly howitzer (center) */
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(CX, CY, 4, 0, Math.PI * 2);
    ctx.fill();

    /* Enemy guns — only show if revealed */
    for (var i = 0; i < _enemyGuns.length; i++) {
      var gun = _enemyGuns[i];
      if (!gun.alive || gun.destroyed) continue;
      if (!gun.revealed) continue;

      var rx = gun.pos.x * SCALE * 0.5 + CX;
      var ry = -gun.pos.z * SCALE * 0.5 + CY;

      /* Bearing line */
      var bearing = Math.atan2(gun.pos.x, -gun.pos.z);
      var range   = Math.sqrt(gun.pos.x * gun.pos.x + gun.pos.z * gun.pos.z);

      ctx.strokeStyle = '#FF4400';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + Math.sin(bearing) * Math.min(range * SCALE * 0.5, 90),
                 CY - Math.cos(bearing) * Math.min(range * SCALE * 0.5, 90));
      ctx.stroke();

      ctx.fillStyle = gun.suppressed ? '#FFAA00' : '#FF0000';
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();

      /* Range/bearing text */
      ctx.fillStyle = '#AAFFAA';
      ctx.font      = '9px monospace';
      var deg = Math.round(bearing * 180 / Math.PI);
      if (deg < 0) deg += 360;
      ctx.fillText(Math.round(range) + 'm/' + deg + 'deg', rx + 6, ry);
    }

    /* Shells in flight */
    for (var j = 0; j < _shells.length; j++) {
      var sh = _shells[j];
      if (sh.exploded) continue;
      var sx = sh.mesh.position.x * SCALE * 0.5 + CX;
      var sy = -sh.mesh.position.z * SCALE * 0.5 + CY;
      ctx.fillStyle = sh.friendly ? '#88FF44' : '#FF8800';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#CCFFCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #44AA44',
      'display:none',
      'z-index:9999',
      'white-space:nowrap',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function updateHUD() {
    if (!_active || !_hud) return;

    var radarState  = _radarActive ? 'ON' : 'OFF';
    var incomingSec = Math.ceil(_nextIncoming);
    var incomingStr = incomingSec < 10 ? '0' + incomingSec : '' + incomingSec;
    var reloadStr   = _reloading ? ' [RELOADING: ' + Math.ceil(_reloadTimer) + 's]' : '';

    _hud.textContent =
      'ARTY DUEL' +
      ' [SHELLS: ' + _ammo + '/' + FRIENDLY_AMMO_MAX + ']' +
      ' [GUNS DOWN: ' + _gunsDown + '/' + ENEMY_COUNT + ']' +
      ' [CREW: ' + _crewAlive + '/' + CREW_COUNT + ']' +
      ' [RADAR: ' + radarState + ']' +
      reloadStr +
      ' | INCOMING: 00:' + incomingStr;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SOUND
  ══════════════════════════════════════════════════════════════════════════ */

  function playSound(freq, duration) {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.setValueAtTime(freq, _audioCtx.currentTime);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.18, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, _audioCtx.currentTime + duration);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + duration);
    } catch (e) { /* AudioContext may not be available */ }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT
  ══════════════════════════════════════════════════════════════════════════ */

  function handleKeyDown(e) {
    var k = e.key;
    _keys[k] = true;

    /* Activation: A + L within 400ms */
    if (k === 'A' || k === 'a') {
      _keyPressTime['A'] = Date.now();
    }
    if (k === 'L' || k === 'l') {
      _keyPressTime['L'] = Date.now();
      var diff = Math.abs(_keyPressTime['L'] - _keyPressTime['A']);
      if (diff < ACTIVATE_WINDOW) {
        _activateModule();
        return;
      }
    }
    /* Also check reverse order */
    if (k === 'A' || k === 'a') {
      var diffA = Math.abs(_keyPressTime['A'] - _keyPressTime['L']);
      if (_keyPressTime['L'] > 0 && diffA < ACTIVATE_WINDOW) {
        _activateModule();
        return;
      }
    }

    if (!_active) return;

    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      fireFriendlyShell();
    }
    if (k === 'r' || k === 'R') {
      _radarActive = !_radarActive;
      if (_radarWrapper) {
        _radarWrapper.style.display = _radarActive ? 'block' : 'none';
      }
    }
    if (k === 't' || k === 'T') {
      _showTrajectory = !_showTrajectory;
      if (!_showTrajectory && _trajectoryLine) {
        _scene.remove(_trajectoryLine);
        _trajectoryLine = null;
      }
    }
    if (k === 'b' || k === 'B') {
      startBarrage();
    }
  }

  function handleKeyUp(e) {
    _keys[e.key] = false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  return { init: init, update: update, reset: reset };

})();
