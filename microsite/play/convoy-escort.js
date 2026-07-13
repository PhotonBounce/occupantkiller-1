/* ───────────────────────────────────────────────────────────────────────────
   convoy-escort.js — Convoy Escort Mini-Game
   API: window.ConvoyEscort = { init, update, reset }
   Controls:
     C + E keys together  → start convoy escort mission
     WASD                 → drive lead Humvee (when boarded)
     E                    → board / exit lead Humvee
     D                    → call MEDEVAC helicopter (drops repair crate)
     Space                → fire weapon at enemies / shoot IED
   ─────────────────────────────────────────────────────────────────────────── */
window.ConvoyEscort = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _active          = false;
  var _missionDone     = false;
  var _missionFailed   = false;
  var _score           = 0;
  var _lastTime        = 0;

  /* ── C+E launch tracking ──────────────────────────────────────────────── */
  var _cPressTime      = 0;
  var _ePressTime      = 0;
  var CE_WINDOW        = 0.4;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys            = {};

  /* ── Convoy ─────────────────────────────────────────────────────────────── */
  var CONVOY_SPEED     = 8;      // units/s
  var FORMATION_GAP    = 10;     // gap between vehicles
  var TRUCK_MAX_HP     = 200;

  var _trucks          = [];     // { group, hp, destroyed, fallTimer, labelEl, cargoMeshes }
  var _leadHumvee      = null;   // { group, hp }
  var _wpIndex         = 0;
  var _convoyHalted    = false;
  var _haltTimer       = 0;
  var _haltDuration    = 3;      // seconds to wait at each waypoint

  /* ── Waypoints ─────────────────────────────────────────────────────────── */
  var WAYPOINTS = [
    new THREE.Vector3(  0,  0,   0),
    new THREE.Vector3( 80,  0,  60),
    new THREE.Vector3(160,  0,   0),
    new THREE.Vector3(240,  0,  60)
  ];
  var _waypointRings   = [];

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _playerGroup     = null;
  var _playerPos       = new THREE.Vector3(-10, 1, -5);
  var _playerBoarded   = false;  // true when driving lead Humvee
  var _playerHP        = 100;

  /* ── Ambush ─────────────────────────────────────────────────────────────── */
  var AMBUSH_ZONES     = [
    { z: 30, triggered: false },
    { z: 150, triggered: false }
  ];
  var _enemies         = [];   // { group, hp, alive, target, fireTimer, isRPG, isIED }
  var _ambushActive    = false;

  /* ── IED ──────────────────────────────────────────────────────────────────── */
  var _iedMesh         = null;
  var _iedTriggered    = false;
  var _iedDefused      = false;
  var _iedWarning      = false;

  /* ── Roadblock ────────────────────────────────────────────────────────────── */
  var _roadblockGroup  = null;
  var _roadblockActive = false;
  var _roadblockTimer  = 30;
  var _roadblockCleared= false;

  /* ── RPG projectiles ──────────────────────────────────────────────────────── */
  var _rockets         = [];   // { mesh, vel, gravity, life, target }

  /* ── MEDEVAC ──────────────────────────────────────────────────────────────── */
  var _medevac         = null;  // { group, rotorL, rotorR, crate, stage, timer, target }
  var _medevacCooldown = 0;
  var _supplyCrates    = [];   // { mesh, landed, timer }

  /* ── Bullets (player shots) ───────────────────────────────────────────────── */
  var _bullets         = [];   // { mesh, vel, life }

  /* ── Explosions ───────────────────────────────────────────────────────────── */
  var _explosions      = [];   // { mesh, light, life }

  /* ── HUD ───────────────────────────────────────────────────────────────────── */
  var _hudEl           = null;
  var _bannerEl        = null;
  var _truckLabels     = [];   // HP label divs per truck

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildHumvee() {
    var group = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(3, 1.5, 2);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4A5A3A });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    group.add(body);

    /* Roof cab */
    var cabGeo  = new THREE.BoxGeometry(2, 0.7, 1.5);
    var cabMat  = new THREE.MeshLambertMaterial({ color: 0x3A4A2A });
    var cab     = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, 1.85, 0);
    group.add(cab);

    /* Wheels */
    var wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wPositions = [
      [-1.5, 0.4, 0.85],
      [ 1.5, 0.4, 0.85],
      [-1.5, 0.4,-0.85],
      [ 1.5, 0.4,-0.85]
    ];
    for (var wi = 0; wi < wPositions.length; wi++) {
      var wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(wPositions[wi][0], wPositions[wi][1], wPositions[wi][2]);
      group.add(wm);
    }

    return group;
  }

  function buildTruck() {
    var group = new THREE.Group();

    /* Cab section */
    var cabGeo  = new THREE.BoxGeometry(2, 2, 2);
    var cabMat  = new THREE.MeshLambertMaterial({ color: 0x6B6B4A });
    var cab     = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(-1.5, 1, 0);
    group.add(cab);

    /* Bed / flatbed */
    var bedGeo  = new THREE.BoxGeometry(5, 2, 2.5);
    var bedMat  = new THREE.MeshLambertMaterial({ color: 0x6B6B4A });
    var bed     = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(1.5, 1, 0);
    group.add(bed);

    /* Cargo boxes on bed */
    var cargos = [];
    var cBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    var cBoxMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var cargoPositions = [
      [ 0.5, 2.5, 0.5],
      [ 0.5, 2.5,-0.5],
      [ 2.0, 2.5, 0.5],
      [ 2.0, 2.5,-0.5]
    ];
    for (var ci = 0; ci < cargoPositions.length; ci++) {
      var cm = new THREE.Mesh(cBoxGeo, cBoxMat);
      cm.position.set(cargoPositions[ci][0], cargoPositions[ci][1], cargoPositions[ci][2]);
      group.add(cm);
      cargos.push(cm);
    }

    /* Wheels */
    var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 8);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var truckWheelPos = [
      [-2.5, 0.5, 1.2],
      [ 2.5, 0.5, 1.2],
      [-2.5, 0.5,-1.2],
      [ 2.5, 0.5,-1.2],
      [ 0,   0.5, 1.2],
      [ 0,   0.5,-1.2]
    ];
    for (var twi = 0; twi < truckWheelPos.length; twi++) {
      var twm = new THREE.Mesh(wheelGeo, wheelMat);
      twm.rotation.z = Math.PI / 2;
      twm.position.set(truckWheelPos[twi][0], truckWheelPos[twi][1], truckWheelPos[twi][2]);
      group.add(twm);
    }

    return { group: group, cargoMeshes: cargos };
  }

  function buildEnemy(isRPG) {
    var group = new THREE.Group();
    /* Torso */
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);
    /* Head */
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    group.add(head);

    if (isRPG) {
      /* RPG tube */
      var tubeGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6);
      var tubeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var tube    = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0.7, 0.9, 0);
      group.add(tube);
    }
    return group;
  }

  function buildIED() {
    var geo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCC2200 });
    var mesh = new THREE.Mesh(geo, mat);
    /* Slightly above ground so it's just visible */
    mesh.position.y = -0.3;
    return mesh;
  }

  function buildRoadblockGroup() {
    var group = new THREE.Group();
    var barrierGeo = new THREE.BoxGeometry(2, 1.5, 0.6);
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    /* 3 concrete barriers */
    for (var bi = 0; bi < 3; bi++) {
      var b = new THREE.Mesh(barrierGeo, barrierMat);
      b.position.set((bi - 1) * 2.5, 0.75, 0);
      group.add(b);
    }
    return group;
  }

  function buildMedevac() {
    var group = new THREE.Group();
    /* Fuselage */
    var bodyGeo = new THREE.BoxGeometry(4, 1.5, 1.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    group.add(body);
    /* Tail boom */
    var tailGeo = new THREE.BoxGeometry(2, 0.4, 0.4);
    var tailMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
    var tail    = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(3, 0.3, 0);
    group.add(tail);
    /* Main rotor disc */
    var rotorGeo = new THREE.BoxGeometry(6, 0.08, 0.3);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var rotorL   = new THREE.Mesh(rotorGeo, rotorMat);
    rotorL.position.y = 1;
    group.add(rotorL);
    /* Tail rotor */
    var tailRotorGeo = new THREE.BoxGeometry(0.1, 1.5, 0.2);
    var tailRotorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var rotorR       = new THREE.Mesh(tailRotorGeo, tailRotorMat);
    rotorR.position.set(4, 0.3, 0);
    group.add(rotorR);
    return { group: group, rotorL: rotorL, rotorR: rotorR };
  }

  function buildRocket() {
    var geo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  function buildBullet() {
    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFF44 });
    return new THREE.Mesh(geo, mat);
  }

  /* ════════════════════════════════════════════════════════════════════════
     WAYPOINT RINGS
  ════════════════════════════════════════════════════════════════════════ */

  function buildWaypointRings() {
    _waypointRings = [];
    for (var wi = 0; wi < WAYPOINTS.length; wi++) {
      var geo  = new THREE.CylinderGeometry(3, 3, 0.3, 24, 1, true);
      var mat  = new THREE.MeshLambertMaterial({
        color:       0x00FF88,
        transparent: true,
        opacity:     0.7,
        side:        THREE.DoubleSide
      });
      var ring = new THREE.Mesh(geo, mat);
      ring.position.copy(WAYPOINTS[wi]);
      ring.position.y = 0.15;
      _scene.add(ring);
      _waypointRings.push(ring);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchMission() {
    if (_active) return;
    _active         = true;
    _missionDone    = false;
    _missionFailed  = false;
    _score          = 0;
    _wpIndex        = 0;
    _convoyHalted   = false;
    _haltTimer      = 0;
    _ambushActive   = false;
    _iedTriggered   = false;
    _iedDefused     = false;
    _iedWarning     = false;
    _roadblockActive= false;
    _roadblockCleared = false;
    _roadblockTimer = 30;
    _playerBoarded  = false;
    _playerHP       = 100;
    _medevacCooldown= 0;

    /* Reset ambush zone triggers */
    for (var ai = 0; ai < AMBUSH_ZONES.length; ai++) {
      AMBUSH_ZONES[ai].triggered = false;
    }

    /* Player mesh (simple soldier shape) */
    _playerGroup = new THREE.Group();
    var pg_body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.8, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x4A5A3A })
    );
    pg_body.position.y = 0.7;
    _playerGroup.add(pg_body);
    var pg_head = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.35),
      new THREE.MeshLambertMaterial({ color: 0xCC9966 })
    );
    pg_head.position.y = 1.35;
    _playerGroup.add(pg_head);
    _playerGroup.position.copy(_playerPos);
    _scene.add(_playerGroup);

    /* Lead Humvee */
    var humveeGroup = buildHumvee();
    humveeGroup.position.copy(WAYPOINTS[0]);
    humveeGroup.position.x += 0;
    _scene.add(humveeGroup);
    _leadHumvee = { group: humveeGroup, hp: 200 };

    /* 3 Supply Trucks */
    _trucks = [];
    _truckLabels = [];
    for (var ti = 0; ti < 3; ti++) {
      var tResult  = buildTruck();
      var tGroup   = tResult.group;
      var tCargos  = tResult.cargoMeshes;
      tGroup.position.copy(WAYPOINTS[0]);
      tGroup.position.z -= (ti + 1) * FORMATION_GAP;
      _scene.add(tGroup);

      /* HP label div */
      var labelEl = document.createElement('div');
      labelEl.style.cssText = [
        'position:fixed',
        'color:#00FF88',
        'font-family:monospace',
        'font-size:11px',
        'font-weight:bold',
        'background:rgba(0,0,0,0.5)',
        'padding:2px 5px',
        'border-radius:3px',
        'pointer-events:none',
        'z-index:850',
        'display:none'
      ].join(';');
      document.body.appendChild(labelEl);
      _truckLabels.push(labelEl);

      _trucks.push({
        group:       tGroup,
        hp:          TRUCK_MAX_HP,
        destroyed:   false,
        fallTimer:   0,
        labelEl:     labelEl,
        cargoMeshes: tCargos
      });
    }

    /* Waypoint rings */
    buildWaypointRings();

    /* IED — placed midway along route segment 1→2 */
    var iedPos = WAYPOINTS[1].clone().lerp(WAYPOINTS[2], 0.5);
    _iedMesh   = buildIED();
    _iedMesh.position.copy(iedPos);
    _scene.add(_iedMesh);

    /* Roadblock at waypoint index 2 position */
    _roadblockGroup = buildRoadblockGroup();
    _roadblockGroup.position.copy(WAYPOINTS[2]);
    _roadblockGroup.position.z += 2;
    _scene.add(_roadblockGroup);
    _roadblockActive = true;

    /* Ambient light for scene */
    if (!_scene.getObjectByName('_ce_ambient')) {
      var ambLight = new THREE.AmbientLight(0x888888, 0.6);
      ambLight.name = '_ce_ambient';
      _scene.add(ambLight);
      var dirLight = new THREE.DirectionalLight(0xFFFFDD, 0.8);
      dirLight.name = '_ce_dirlight';
      dirLight.position.set(50, 100, 30);
      _scene.add(dirLight);
    }

    /* Position camera behind convoy */
    if (_camera) {
      _camera.position.set(0, 20, -30);
      _camera.lookAt(WAYPOINTS[0]);
    }

    showHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function showHUD() {
    _hudEl.style.display = 'block';
    updateHUD();
  }

  function updateHUD() {
    if (!_hudEl || !_active) return;
    var trucksAlive = 0;
    for (var ti = 0; ti < _trucks.length; ti++) {
      if (!_trucks[ti].destroyed) trucksAlive++;
    }
    var threat = _ambushActive ? 'HIGH' : (_iedWarning ? 'MEDIUM' : 'LOW');
    var iedMsg  = _iedWarning  ? ' | IED AHEAD!'  : '';
    var rbMsg   = (_roadblockActive && !_roadblockCleared && _wpIndex >= 2) ? ' | ROADBLOCK!' : '';
    _hudEl.textContent =
      'ESCORT [TRUCKS: ' + trucksAlive + '/3] ' +
      '[WP: ' + Math.min(_wpIndex, WAYPOINTS.length) + '/' + WAYPOINTS.length + '] ' +
      '[THREAT: ' + threat + ']' +
      iedMsg + rbMsg;
  }

  /* ════════════════════════════════════════════════════════════════════════
     WORLD-TO-SCREEN PROJECTION FOR HP LABELS
  ════════════════════════════════════════════════════════════════════════ */

  function worldToScreen(worldPos) {
    if (!_camera || !_canvas) return null;
    var vec = worldPos.clone();
    vec.project(_camera);
    var w = _canvas.clientWidth  || _canvas.width  || window.innerWidth;
    var h = _canvas.clientHeight || _canvas.height || window.innerHeight;
    return {
      x: (vec.x * 0.5 + 0.5) * w,
      y: (1 - (vec.y * 0.5 + 0.5)) * h,
      behind: vec.z > 1
    };
  }

  function updateTruckLabels() {
    for (var ti = 0; ti < _trucks.length; ti++) {
      var truck  = _trucks[ti];
      var label  = _truckLabels[ti];
      if (!label) continue;
      if (truck.destroyed || !_active) {
        label.style.display = 'none';
        continue;
      }
      var above = truck.group.position.clone();
      above.y += 4;
      var sc = worldToScreen(above);
      if (!sc || sc.behind) {
        label.style.display = 'none';
      } else {
        label.style.display = 'block';
        label.style.left = Math.round(sc.x) + 'px';
        label.style.top  = Math.round(sc.y) + 'px';
        label.textContent = 'HP ' + Math.max(0, Math.round(truck.hp)) + '/' + TRUCK_MAX_HP;
        var ratio = truck.hp / TRUCK_MAX_HP;
        label.style.color = ratio > 0.5 ? '#00FF88' : (ratio > 0.25 ? '#FFAA00' : '#FF4444');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updateConvoy(dt) {
    if (!_active || _missionDone || _missionFailed) return;

    /* If halted at waypoint, count down then continue */
    if (_convoyHalted && _wpIndex > 0 && _wpIndex < WAYPOINTS.length) {
      _haltTimer -= dt;
      if (_haltTimer <= 0) {
        _convoyHalted = false;
      }
      /* Spin waypoint ring while waiting */
      if (_waypointRings[_wpIndex - 1]) {
        _waypointRings[_wpIndex - 1].rotation.y += dt * 2;
      }
      return;
    }

    /* All waypoints visited */
    if (_wpIndex >= WAYPOINTS.length) {
      if (!_missionDone) checkMissionComplete();
      return;
    }

    var targetWP = WAYPOINTS[_wpIndex];

    /* Roadblock check — convoy must stop until cleared */
    if (_wpIndex === 2 && _roadblockActive && !_roadblockCleared) {
      _roadblockTimer -= dt;
      updateHUD();
      if (_roadblockTimer <= 0) {
        /* Timeout — convoy stays stuck (halted) */
      }
      return;
    }

    /* IED warning */
    var iedPos  = WAYPOINTS[1].clone().lerp(WAYPOINTS[2], 0.5);
    var leadPos = _playerBoarded
      ? _leadHumvee.group.position
      : (_trucks.length > 0 ? _trucks[0].group.position : null);

    if (leadPos && !_iedTriggered && !_iedDefused && _iedMesh) {
      var distToIED = leadPos.distanceTo(_iedMesh.position);
      _iedWarning = distToIED < 30;
      if (distToIED < 4) {
        triggerIED();
      }
    }

    /* Check ambush zones */
    var leaderZ = _leadHumvee ? _leadHumvee.group.position.z : 0;
    for (var ai = 0; ai < AMBUSH_ZONES.length; ai++) {
      var az = AMBUSH_ZONES[ai];
      if (!az.triggered && Math.abs(leaderZ - az.z) < 15) {
        az.triggered = true;
        spawnAmbush(_leadHumvee.group.position);
      }
    }

    /* Move lead Humvee toward waypoint (unless player is driving) */
    if (!_playerBoarded && _leadHumvee) {
      var toWP    = new THREE.Vector3().subVectors(targetWP, _leadHumvee.group.position);
      toWP.y      = 0;
      var distToWP = toWP.length();

      if (distToWP < 3) {
        /* Reached waypoint — halt briefly */
        _wpIndex++;
        if (_wpIndex <= WAYPOINTS.length) {
          _convoyHalted = true;
          _haltTimer    = _haltDuration;
          /* Deactivate passed ring */
          if (_waypointRings[_wpIndex - 2]) {
            _waypointRings[_wpIndex - 2].material.color.setHex(0x888888);
          }
        }
        return;
      }

      var dir  = toWP.clone().normalize();
      var move = dir.multiplyScalar(CONVOY_SPEED * dt);
      _leadHumvee.group.position.add(move);
      /* Face direction of travel */
      _leadHumvee.group.lookAt(
        _leadHumvee.group.position.clone().add(dir)
      );
    }

    /* Move trucks in formation behind lead */
    for (var ti = 0; ti < _trucks.length; ti++) {
      var truck = _trucks[ti];
      if (truck.destroyed) continue;

      /* Compute formation slot position */
      var slotPos;
      if (ti === 0) {
        /* First truck follows lead Humvee */
        var behindLead = _leadHumvee.group.position.clone();
        var leadFwd    = new THREE.Vector3(0, 0, -1).applyQuaternion(_leadHumvee.group.quaternion);
        behindLead.addScaledVector(leadFwd, -FORMATION_GAP);
        slotPos = behindLead;
      } else {
        /* Follow previous truck */
        var prevTruck = _trucks[ti - 1];
        if (prevTruck.destroyed) {
          /* Skip to one before */
          slotPos = _trucks[ti - 1].group.position.clone();
          slotPos.z -= FORMATION_GAP;
        } else {
          var prevFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(prevTruck.group.quaternion);
          slotPos     = prevTruck.group.position.clone().addScaledVector(prevFwd, -FORMATION_GAP);
        }
      }

      var toSlot  = new THREE.Vector3().subVectors(slotPos, truck.group.position);
      toSlot.y    = 0;
      var slotDist = toSlot.length();
      if (slotDist > 1) {
        var slotDir = toSlot.clone().normalize();
        truck.group.position.addScaledVector(slotDir, Math.min(CONVOY_SPEED * dt, slotDist));
        truck.group.lookAt(truck.group.position.clone().add(slotDir));
      }

      /* Fall animation for destroyed truck */
      if (truck.fallTimer > 0) {
        truck.fallTimer -= dt;
        var tiltProgress = 1 - Math.max(0, truck.fallTimer) / 2;
        truck.group.rotation.z = tiltProgress * (Math.PI / 2);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     IED
  ════════════════════════════════════════════════════════════════════════ */

  function triggerIED() {
    if (_iedTriggered) return;
    _iedTriggered = true;
    _iedWarning   = false;

    /* Destroy first non-destroyed truck */
    for (var ti = 0; ti < _trucks.length; ti++) {
      if (!_trucks[ti].destroyed) {
        destroyTruck(ti, 9999);
        break;
      }
    }

    spawnExplosion(_iedMesh.position.clone());
    _scene.remove(_iedMesh);
    _iedMesh = null;
    updateHUD();
  }

  function defuseIED() {
    if (_iedDefused || _iedTriggered || !_iedMesh) return;
    _iedDefused = true;
    _iedWarning = false;
    _scene.remove(_iedMesh);
    _iedMesh    = null;
    _score     += 200;
    showBanner('IED DEFUSED! +200', '#00FF88', 2000);
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     TRUCK DAMAGE / DESTRUCTION
  ════════════════════════════════════════════════════════════════════════ */

  function damageTruck(idx, amount) {
    if (idx < 0 || idx >= _trucks.length) return;
    var truck = _trucks[idx];
    if (truck.destroyed) return;
    truck.hp -= amount;
    if (truck.hp <= 0) {
      destroyTruck(idx, amount);
    }
    updateHUD();
  }

  function destroyTruck(idx, amount) {
    var truck = _trucks[idx];
    if (truck.destroyed) return;
    truck.destroyed = true;
    truck.hp        = 0;
    truck.fallTimer = 2.0;  /* 2s fall animation */
    spawnExplosion(truck.group.position.clone());
    if (truck.labelEl) {
      truck.labelEl.style.display = 'none';
    }
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     AMBUSH / ENEMIES
  ════════════════════════════════════════════════════════════════════════ */

  function spawnAmbush(centerPos) {
    _ambushActive = true;
    updateHUD();

    /* Spawn 6 enemies: 3 from each side of road */
    for (var si = 0; si < 6; si++) {
      var side    = (si < 3) ? 1 : -1;
      var isRPG   = (si === 2 || si === 5);   /* one RPG per side */
      var isIEDgr = (si === 1);               /* one IED group member */

      var enemyGroup = buildEnemy(isRPG);
      var spawnOffset = new THREE.Vector3(
        side * (8 + Math.random() * 5),
        1,
        (si % 3) * 6 - 6
      );
      enemyGroup.position.copy(centerPos).add(spawnOffset);
      enemyGroup.position.y = 1;
      _scene.add(enemyGroup);

      _enemies.push({
        group:     enemyGroup,
        hp:        50,
        alive:     true,
        fireTimer: 1.5 + Math.random() * 2,
        isRPG:     isRPG,
        isIED:     isIEDgr,
        target:    null
      });
    }
  }

  function updateEnemies(dt) {
    var allDead = true;
    for (var ei = _enemies.length - 1; ei >= 0; ei--) {
      var e = _enemies[ei];
      if (!e.alive) continue;
      allDead = false;

      /* Find nearest truck as target */
      var nearestTruck = null;
      var nearestDist  = Infinity;
      for (var ti = 0; ti < _trucks.length; ti++) {
        if (_trucks[ti].destroyed) continue;
        var d = e.group.position.distanceTo(_trucks[ti].group.position);
        if (d < nearestDist) {
          nearestDist  = d;
          nearestTruck = ti;
        }
      }

      e.target = nearestTruck;

      /* Move toward nearest truck (infantry approach) */
      if (nearestTruck !== null && !e.isRPG) {
        var toTruck = new THREE.Vector3().subVectors(
          _trucks[nearestTruck].group.position,
          e.group.position
        );
        toTruck.y = 0;
        var dist = toTruck.length();
        if (dist > 5) {
          e.group.position.addScaledVector(toTruck.clone().normalize(), 3 * dt);
        }
      }

      /* RPG fires rockets */
      if (e.isRPG && nearestTruck !== null) {
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && nearestDist < 40) {
          fireRocket(e.group.position, _trucks[nearestTruck].group.position);
          e.fireTimer = 4 + Math.random() * 3;
        }
      }

      /* Infantry attacks truck at close range */
      if (!e.isRPG && nearestTruck !== null) {
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && nearestDist < 8) {
          damageTruck(nearestTruck, 10);
          e.fireTimer = 1.5 + Math.random();
        }
      }
    }

    /* Clear ambush flag when all enemies dead */
    if (allDead && _ambushActive && _enemies.length > 0) {
      _ambushActive = false;
      updateHUD();
    }
  }

  function killEnemy(idx) {
    var e = _enemies[idx];
    if (!e || !e.alive) return;
    e.alive = false;
    _scene.remove(e.group);
    _score += 100;
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     ROCKETS (RPG)
  ════════════════════════════════════════════════════════════════════════ */

  function fireRocket(fromPos, toPos) {
    var mesh = buildRocket();
    mesh.position.copy(fromPos);
    mesh.position.y += 1;
    _scene.add(mesh);

    var dir = new THREE.Vector3().subVectors(toPos, fromPos).normalize();
    _rockets.push({
      mesh:    mesh,
      vel:     dir.multiplyScalar(12),
      gravity: 0,
      life:    6,
      target:  toPos.clone()
    });
  }

  function updateRockets(dt) {
    for (var ri = _rockets.length - 1; ri >= 0; ri--) {
      var r = _rockets[ri];
      r.life -= dt;
      if (r.life <= 0) {
        _scene.remove(r.mesh);
        _rockets.splice(ri, 1);
        continue;
      }

      /* Arc: add slight upward then gravity */
      r.gravity += 4 * dt;
      r.mesh.position.addScaledVector(r.vel, dt);
      r.mesh.position.y -= r.gravity * dt * 0.3;

      /* Check hit on trucks */
      var hitSomething = false;
      for (var ti = 0; ti < _trucks.length; ti++) {
        if (_trucks[ti].destroyed) continue;
        if (r.mesh.position.distanceTo(_trucks[ti].group.position) < 4) {
          damageTruck(ti, 60);
          spawnExplosion(r.mesh.position.clone());
          _scene.remove(r.mesh);
          _rockets.splice(ri, 1);
          hitSomething = true;
          break;
        }
      }

      /* Ground hit */
      if (!hitSomething && r.mesh.position.y < 0) {
        spawnExplosion(r.mesh.position.clone());
        _scene.remove(r.mesh);
        _rockets.splice(ri, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ROADBLOCK CLEARING
  ════════════════════════════════════════════════════════════════════════ */

  function clearRoadblock() {
    if (!_roadblockGroup || _roadblockCleared) return;
    _roadblockCleared = true;
    _scene.remove(_roadblockGroup);
    _roadblockGroup = null;
    _score += 150;
    showBanner('ROADBLOCK CLEARED! +150', '#00FF88', 2000);
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     MEDEVAC
  ════════════════════════════════════════════════════════════════════════ */

  function callMedevac() {
    if (!_active || _medevacCooldown > 0) return;
    if (_medevac) return;
    _medevacCooldown = 60;

    var heliData = buildMedevac();
    var group    = heliData.group;
    /* Spawn above convoy */
    var spawnPos = _leadHumvee
      ? _leadHumvee.group.position.clone()
      : WAYPOINTS[_wpIndex].clone();
    spawnPos.y = 40;
    spawnPos.x += 20;
    group.position.copy(spawnPos);
    _scene.add(group);

    /* Find most damaged truck */
    var targetTruckIdx = -1;
    var lowestHP       = Infinity;
    for (var ti = 0; ti < _trucks.length; ti++) {
      if (!_trucks[ti].destroyed && _trucks[ti].hp < lowestHP) {
        lowestHP       = _trucks[ti].hp;
        targetTruckIdx = ti;
      }
    }

    _medevac = {
      group:     group,
      rotorL:    heliData.rotorL,
      rotorR:    heliData.rotorR,
      crate:     null,
      stage:     'approach',  /* approach → hover → drop → depart */
      timer:     0,
      targetTruckIdx: targetTruckIdx
    };

    showBanner('MEDEVAC INCOMING!', '#00FF88', 2000);
  }

  function updateMedevac(dt) {
    if (!_medevac) {
      _medevacCooldown = Math.max(0, _medevacCooldown - dt);
      return;
    }
    var mv = _medevac;

    /* Spin rotors */
    mv.rotorL.rotation.y += dt * 20;
    mv.rotorR.rotation.z += dt * 30;

    mv.timer += dt;
    _medevacCooldown = Math.max(0, _medevacCooldown - dt);

    var targetPos;
    if (mv.targetTruckIdx >= 0 && !_trucks[mv.targetTruckIdx].destroyed) {
      targetPos = _trucks[mv.targetTruckIdx].group.position.clone();
      targetPos.y = 15;
    } else {
      targetPos = (_leadHumvee ? _leadHumvee.group.position.clone() : WAYPOINTS[0].clone());
      targetPos.y = 15;
    }

    if (mv.stage === 'approach') {
      var toTarget = new THREE.Vector3().subVectors(targetPos, mv.group.position);
      var dist     = toTarget.length();
      if (dist < 3) {
        mv.stage = 'hover';
        mv.timer = 0;
      } else {
        mv.group.position.addScaledVector(toTarget.normalize(), Math.min(20 * dt, dist));
      }
    } else if (mv.stage === 'hover') {
      if (mv.timer > 2) {
        /* Drop supply crate */
        var crateGeo  = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        var crateMat  = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
        var crateMesh = new THREE.Mesh(crateGeo, crateMat);
        crateMesh.position.copy(mv.group.position);
        _scene.add(crateMesh);
        _supplyCrates.push({ mesh: crateMesh, landed: false, timer: 0 });
        mv.crate = crateMesh;
        mv.stage = 'depart';
        mv.timer = 0;
      }
    } else if (mv.stage === 'depart') {
      /* Fly away */
      mv.group.position.x += 15 * dt;
      mv.group.position.y += 5  * dt;
      if (mv.timer > 4) {
        _scene.remove(mv.group);
        _medevac = null;
      }
    }
  }

  function updateSupplyCrates(dt) {
    for (var ci = _supplyCrates.length - 1; ci >= 0; ci--) {
      var sc = _supplyCrates[ci];
      if (!sc.landed) {
        sc.mesh.position.y -= 8 * dt;
        if (sc.mesh.position.y <= 1) {
          sc.mesh.position.y = 1;
          sc.landed = true;
          sc.timer  = 5;  /* pickup window */
        }
      } else {
        sc.timer -= dt;
        /* Check if player or any truck is near */
        var pickedUp = false;
        if (_playerGroup && sc.mesh.position.distanceTo(_playerGroup.position) < 5) {
          /* Apply to most damaged truck */
          for (var ti = 0; ti < _trucks.length; ti++) {
            if (!_trucks[ti].destroyed) {
              _trucks[ti].hp = Math.min(TRUCK_MAX_HP, _trucks[ti].hp + 100);
              showBanner('+100 HP REPAIR KIT APPLIED!', '#00FF88', 2000);
              pickedUp = true;
              break;
            }
          }
        }
        if (pickedUp || sc.timer <= 0) {
          _scene.remove(sc.mesh);
          _supplyCrates.splice(ci, 1);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (!_active) return;

    var moveSpeed = 8;
    var moved     = false;
    var fwd       = new THREE.Vector3();
    var right     = new THREE.Vector3();

    if (_camera) {
      _camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();
      right.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    } else {
      fwd.set(0, 0, 1);
      right.set(1, 0, 0);
    }

    if (_playerBoarded && _leadHumvee) {
      /* Drive lead Humvee */
      var driveDir = new THREE.Vector3();
      if (_keys['w'] || _keys['W']) driveDir.add(fwd);
      if (_keys['s'] || _keys['S']) driveDir.sub(fwd);
      if (_keys['a'] || _keys['A']) driveDir.sub(right);
      if (_keys['d'] || _keys['D']) driveDir.add(right);
      if (driveDir.length() > 0) {
        driveDir.normalize();
        _leadHumvee.group.position.addScaledVector(driveDir, moveSpeed * dt);
        _leadHumvee.group.lookAt(
          _leadHumvee.group.position.clone().add(driveDir)
        );
        moved = true;
      }
      /* Sync player invisible inside vehicle */
      _playerGroup.position.copy(_leadHumvee.group.position);
      _playerPos.copy(_playerGroup.position);

      /* Player controls humvee which then acts as convoy lead */
      /* Check waypoint advance manually */
      if (_wpIndex < WAYPOINTS.length) {
        var wpTarget = WAYPOINTS[_wpIndex];
        var wpDist   = _leadHumvee.group.position.distanceTo(wpTarget);
        if (wpDist < 5) {
          _wpIndex++;
          if (_wpIndex < WAYPOINTS.length) {
            _convoyHalted = true;
            _haltTimer    = _haltDuration;
            if (_waypointRings[_wpIndex - 2]) {
              _waypointRings[_wpIndex - 2].material.color.setHex(0x888888);
            }
          }
        }
      }

      /* Check roadblock collision */
      if (_roadblockActive && !_roadblockCleared && _roadblockGroup) {
        if (_leadHumvee.group.position.distanceTo(_roadblockGroup.position) < 5) {
          clearRoadblock();
        }
      }
    } else {
      /* On-foot movement */
      var footDir = new THREE.Vector3();
      if (_keys['w'] || _keys['W']) footDir.add(fwd);
      if (_keys['s'] || _keys['S']) footDir.sub(fwd);
      if (_keys['a'] || _keys['A']) footDir.sub(right);
      if (_keys['d'] || _keys['D']) footDir.add(right);
      if (footDir.length() > 0) {
        footDir.normalize();
        _playerGroup.position.addScaledVector(footDir, moveSpeed * dt);
        _playerPos.copy(_playerGroup.position);
        moved = true;
      }

      /* Check IED defuse proximity */
      if (_iedMesh && !_iedDefused && !_iedTriggered) {
        if (_playerGroup.position.distanceTo(_iedMesh.position) < 3) {
          defuseIED();
        }
      }

      /* Check roadblock clear by proximity + shooting handled in fireBullet */
      if (_roadblockActive && !_roadblockCleared && _roadblockGroup) {
        if (_playerGroup.position.distanceTo(_roadblockGroup.position) < 6) {
          clearRoadblock();
        }
      }
    }

    /* Camera follows player / boarded vehicle */
    if (_camera) {
      var camTarget = _playerBoarded && _leadHumvee
        ? _leadHumvee.group.position
        : _playerGroup.position;

      var desiredCamPos = camTarget.clone();
      desiredCamPos.y  += 15;
      desiredCamPos.z  -= 20;
      _camera.position.lerp(desiredCamPos, dt * 5);
      _camera.lookAt(camTarget);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BULLETS (PLAYER FIRE)
  ════════════════════════════════════════════════════════════════════════ */

  function fireBullet() {
    if (!_active || !_playerGroup) return;

    var bulletMesh = buildBullet();
    bulletMesh.position.copy(_playerGroup.position);
    bulletMesh.position.y += 1;
    _scene.add(bulletMesh);

    /* Direction: forward from camera */
    var dir = new THREE.Vector3(0, 0, 1);
    if (_camera) {
      _camera.getWorldDirection(dir);
    }

    _bullets.push({
      mesh: bulletMesh,
      vel:  dir.clone().multiplyScalar(60),
      life: 3
    });
  }

  function updateBullets(dt) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(bi, 1);
        continue;
      }
      b.mesh.position.addScaledVector(b.vel, dt);

      /* Check enemy hits */
      var hitEnemy = false;
      for (var ei = 0; ei < _enemies.length; ei++) {
        var e = _enemies[ei];
        if (!e.alive) continue;
        if (b.mesh.position.distanceTo(e.group.position) < 2) {
          e.hp -= 50;
          if (e.hp <= 0) killEnemy(ei);
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
          hitEnemy = true;
          break;
        }
      }
      if (hitEnemy) continue;

      /* Check IED hit (shoot to defuse / destroy) */
      if (_iedMesh && !_iedDefused && !_iedTriggered) {
        if (b.mesh.position.distanceTo(_iedMesh.position) < 2) {
          defuseIED();
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
          continue;
        }
      }

      /* Check roadblock hit */
      if (_roadblockGroup && _roadblockActive && !_roadblockCleared) {
        if (b.mesh.position.distanceTo(_roadblockGroup.position) < 5) {
          clearRoadblock();
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
          continue;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos) {
    var geo  = new THREE.SphereGeometry(2.5, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF5500, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    var lt = new THREE.PointLight(0xFF4400, 8, 25);
    lt.position.copy(pos);
    _scene.add(lt);
    _explosions.push({ mesh: mesh, light: lt, life: 1.2 });
  }

  function updateExplosions(dt) {
    for (var xi = _explosions.length - 1; xi >= 0; xi--) {
      var ex = _explosions[xi];
      ex.life -= dt;
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _scene.remove(ex.light);
        _explosions.splice(xi, 1);
        continue;
      }
      ex.mesh.material.opacity = ex.life / 1.2 * 0.9;
      ex.light.intensity       = ex.life / 1.2 * 8;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION COMPLETE / FAIL
  ════════════════════════════════════════════════════════════════════════ */

  function checkMissionComplete() {
    if (_missionDone || _missionFailed) return;

    var trucksAlive = 0;
    for (var ti = 0; ti < _trucks.length; ti++) {
      if (!_trucks[ti].destroyed) trucksAlive++;
    }

    if (_wpIndex < WAYPOINTS.length) return;

    _missionDone = true;

    if (trucksAlive >= 2) {
      /* Success */
      var bonus = 0;
      if (trucksAlive === 3) bonus = 1000;
      else if (trucksAlive === 2) bonus = 600;
      _score += bonus;
      showBanner(
        'CONVOY DELIVERED!\n+' + bonus + ' pts (' + trucksAlive + '/3 trucks)',
        '#00FF88',
        8000
      );
    } else {
      /* Fail — fewer than 2 trucks */
      triggerMissionFail();
    }
    updateHUD();
  }

  function triggerMissionFail() {
    if (_missionFailed) return;
    _missionFailed = true;
    _missionDone   = true;
    showBanner('MISSION FAILED\nToo many trucks lost!', '#FF4444', 8000);
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     BANNER
  ════════════════════════════════════════════════════════════════════════ */

  function showBanner(text, color, duration) {
    if (!_bannerEl) return;
    _bannerEl.innerHTML = text.split('\n').join('<br>');
    _bannerEl.style.color   = color || '#00FF88';
    _bannerEl.style.display = 'block';
    clearTimeout(_bannerEl._hideTimer);
    _bannerEl._hideTimer = setTimeout(function () {
      if (_bannerEl) _bannerEl.style.display = 'none';
    }, duration || 3000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* C+E simultaneous launch */
    if (e.key === 'c' || e.key === 'C') _cPressTime = Date.now();
    if (e.key === 'e' || e.key === 'E') _ePressTime = Date.now();

    var ceDiff = Math.abs(_cPressTime - _ePressTime) / 1000;
    if ((_keys['c'] || _keys['C']) && (_keys['e'] || _keys['E']) && ceDiff < CE_WINDOW && !_active) {
      launchMission();
      return;
    }

    if (!_active) return;

    /* E — board / exit Humvee */
    if ((e.key === 'e' || e.key === 'E') && _active) {
      if (_playerBoarded) {
        /* Exit */
        _playerBoarded = false;
        _playerGroup.position.copy(_leadHumvee.group.position);
        _playerGroup.position.x += 3;
        _playerGroup.visible = true;
        showBanner('Exited Humvee', '#AAFFAA', 1500);
      } else {
        /* Board if close enough */
        if (_leadHumvee && _playerGroup.position.distanceTo(_leadHumvee.group.position) < 6) {
          _playerBoarded = true;
          _playerGroup.visible = false;
          showBanner('Boarded Lead Humvee — WASD to drive', '#00FF88', 2000);
        }
      }
    }

    /* D — call MEDEVAC */
    if ((e.key === 'd' || e.key === 'D') && _active) {
      if (_medevacCooldown <= 0) {
        callMedevac();
      } else {
        showBanner('MEDEVAC on cooldown: ' + Math.ceil(_medevacCooldown) + 's', '#FFAA00', 1500);
      }
    }

    /* Space — fire */
    if (e.key === ' ' && _active) {
      e.preventDefault();
      fireBullet();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API — init
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    /* HUD element */
    _hudEl = document.createElement('div');
    _hudEl.id = 'convoy-escort-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* Banner element */
    _bannerEl = document.createElement('div');
    _bannerEl.id = 'convoy-escort-banner';
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'text-align:center',
      'background:rgba(0,0,0,0.75)',
      'padding:20px 40px',
      'border-radius:8px',
      'pointer-events:none',
      'display:none',
      'z-index:910',
      'text-shadow:0 0 16px #00FF88',
      'white-space:pre-line'
    ].join(';');
    document.body.appendChild(_bannerEl);

    /* Input listeners */
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API — update
  ════════════════════════════════════════════════════════════════════════ */

  function update(delta) {
    if (!_active || !_scene) return;

    var dt = delta || 0.016;

    updatePlayer(dt);
    updateConvoy(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateRockets(dt);
    updateExplosions(dt);
    updateMedevac(dt);
    updateSupplyCrates(dt);
    updateTruckLabels();
    updateHUD();

    /* Spin active waypoint rings */
    for (var wi = _wpIndex; wi < _waypointRings.length; wi++) {
      if (_waypointRings[wi]) {
        _waypointRings[wi].rotation.y += dt * 1.5;
      }
    }

    /* Mission complete check */
    if (_wpIndex >= WAYPOINTS.length && !_missionDone) {
      checkMissionComplete();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API — reset
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active        = false;
    _missionDone   = false;
    _missionFailed = false;
    _score         = 0;
    _wpIndex       = 0;
    _convoyHalted  = false;
    _ambushActive  = false;

    /* Remove player */
    if (_playerGroup && _scene) {
      _scene.remove(_playerGroup);
      _playerGroup = null;
    }
    _playerBoarded = false;

    /* Remove lead humvee */
    if (_leadHumvee && _scene) {
      _scene.remove(_leadHumvee.group);
      _leadHumvee = null;
    }

    /* Remove trucks + labels */
    for (var ti = 0; ti < _trucks.length; ti++) {
      if (_scene) _scene.remove(_trucks[ti].group);
      if (_trucks[ti].labelEl) {
        _trucks[ti].labelEl.style.display = 'none';
        document.body.removeChild(_trucks[ti].labelEl);
      }
    }
    _trucks      = [];
    _truckLabels = [];

    /* Remove waypoint rings */
    for (var wi = 0; wi < _waypointRings.length; wi++) {
      if (_scene) _scene.remove(_waypointRings[wi]);
    }
    _waypointRings = [];

    /* Remove enemies */
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].group && _scene) _scene.remove(_enemies[ei].group);
    }
    _enemies = [];

    /* Remove rockets */
    for (var ri = 0; ri < _rockets.length; ri++) {
      if (_scene) _scene.remove(_rockets[ri].mesh);
    }
    _rockets = [];

    /* Remove bullets */
    for (var bi = 0; bi < _bullets.length; bi++) {
      if (_scene) _scene.remove(_bullets[bi].mesh);
    }
    _bullets = [];

    /* Remove explosions */
    for (var xi = 0; xi < _explosions.length; xi++) {
      if (_scene) {
        _scene.remove(_explosions[xi].mesh);
        _scene.remove(_explosions[xi].light);
      }
    }
    _explosions = [];

    /* Remove IED */
    if (_iedMesh && _scene) {
      _scene.remove(_iedMesh);
      _iedMesh = null;
    }

    /* Remove roadblock */
    if (_roadblockGroup && _scene) {
      _scene.remove(_roadblockGroup);
      _roadblockGroup = null;
    }

    /* Remove medevac */
    if (_medevac && _scene) {
      _scene.remove(_medevac.group);
      _medevac = null;
    }

    /* Remove supply crates */
    for (var ci = 0; ci < _supplyCrates.length; ci++) {
      if (_scene) _scene.remove(_supplyCrates[ci].mesh);
    }
    _supplyCrates = [];

    /* Reset ambush zones */
    for (var ai = 0; ai < AMBUSH_ZONES.length; ai++) {
      AMBUSH_ZONES[ai].triggered = false;
    }

    /* Reset IED/roadblock state */
    _iedTriggered     = false;
    _iedDefused       = false;
    _iedWarning       = false;
    _roadblockActive  = false;
    _roadblockCleared = false;
    _roadblockTimer   = 30;
    _medevacCooldown  = 0;

    /* Hide HUD elements */
    if (_hudEl)    _hudEl.style.display    = 'none';
    if (_bannerEl) _bannerEl.style.display = 'none';

    /* Clear keys */
    _keys = {};
  }

  return { init: init, update: update, reset: reset };

}());
