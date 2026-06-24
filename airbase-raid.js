/* ───────────────────────────────────────────────────────────────────────────
   airbase-raid.js — Airbase Raid Mission
   API: window.AirbaseRaid = { init, update, reset }
   Activation: A + B simultaneous keypress (both within 400ms)

   Objectives (choose approach):
     Stealth  — neutralize all 4 AA guns (E, 5s each), steal keycard from
                pilot, reach jet in hangar, board (E)
     Assault  — fight through all 20 personnel, destroy fuel depot
                (shoot tank → fire; 60s to get jet out before fire reaches it)
     Disguise — find mechanic uniform in locker room, walk to jet
                unchallenged, start 10s preflight check

   Jet controls (once boarded):
     WASD  — taxi on runway
     SPACE — full throttle takeoff → mission complete if airborne
   ─────────────────────────────────────────────────────────────────────────── */
window.AirbaseRaid = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key tracking ───────────────────────────────────────────── */
  var _abPressTime = { A: 0, B: 0 };
  var AB_WINDOW    = 400; // ms

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active         = false;
  var _missionComplete = false;
  var _missionFailed  = false;

  /* ── Approach ──────────────────────────────────────────────────────────── */
  var _approach = null; // 'stealth' | 'assault' | 'disguise' | null (not chosen)

  /* ── Jet state ─────────────────────────────────────────────────────────── */
  var _jetState    = 'HANGARED'; // 'HANGARED' | 'PREPPED' | 'AIRBORNE'
  var _jetGroup    = null;
  var _jetBoarded  = false;
  var _jetThrottle = 0;
  var _jetVel      = new THREE.Vector3();
  var _jetOnRunway = false;

  /* ── Alarm / scramble ─────────────────────────────────────────────────── */
  var _alarmTriggered   = false;
  var _scrambleTimer    = 180; // 3 minutes
  var _scrambleActive   = false;
  var _scrambleJets     = []; // { group, vel }
  var _radarDestroyed   = false;

  /* ── AA guns ───────────────────────────────────────────────────────────── */
  var _aaGuns = []; // { group, mesh, disabled, sabotageProgress, sabotaging, arc, pos }

  /* ── Personnel ─────────────────────────────────────────────────────────── */
  var _personnel = []; // { group, mesh, hp, role, alive, alert, vel, pos, fireTimer }

  /* ── Pilot state ─────────────────────────────────────────────────────────*/
  var _pilotKeycardPickedUp = false;
  var _keycardMesh = null;

  /* ── Uniform (disguise) ───────────────────────────────────────────────── */
  var _uniformPickedUp = false;
  var _uniformMesh     = null;
  var _disguiseActive  = false;

  /* ── Fuel depot / fire ───────────────────────────────────────────────────*/
  var _fuelDepotGroup    = null;
  var _fuelTanks         = []; // { mesh }
  var _fuelOnFire        = false;
  var _fireTimer         = 60; // seconds until fire reaches jet
  var _fireMeshes        = []; // visual fire spheres

  /* ── Radar ───────────────────────────────────────────────────────────────*/
  var _radarGroup = null;
  var _radarMesh  = null;
  var _radarLight = null;

  /* ── Preflight (disguise) ─────────────────────────────────────────────── */
  var _preflightProgress = 0;
  var _preflightActive   = false;
  var _preflightDone     = false;

  /* ── Sabotage interaction ─────────────────────────────────────────────── */
  var _sabotageTarget = null;

  /* ── Player ───────────────────────────────────────────────────────────── */
  var _playerPos  = new THREE.Vector3(0, 1, 60); // start outside base
  var _playerHP   = 100;
  var _playerMesh = null;
  var _playerGroup = null;
  var _playerVel  = new THREE.Vector3();

  /* ── Player shooting ──────────────────────────────────────────────────── */
  var _bullets        = []; // { mesh, vel, life }
  var _shootCooldown  = 0;
  var _mouseX         = 0;
  var _mouseY         = 0;

  /* ── Explosions ──────────────────────────────────────────────────────────*/
  var _explosions = []; // { mesh, light, life }

  /* ── Base meshes (static) ────────────────────────────────────────────────*/
  var _baseGroup   = null;
  var _runway      = null;
  var _hangars     = [];
  var _tower       = null;
  var _lockerRoom  = null;

  /* ── Input ──────────────────────────────────────────────────────────────*/
  var _keys = {};

  /* ── HUD / DOM ───────────────────────────────────────────────────────────*/
  var _hud       = null;
  var _msgEl     = null; // big message overlay
  var _vigEl     = null;

  /* ── Interaction prompt ──────────────────────────────────────────────────*/
  var _promptEl  = null;
  var _promptVisible = false;

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function cyl(rTop, rBot, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function buildBase() {
    _baseGroup = new THREE.Group();
    _scene.add(_baseGroup);

    /* Runway */
    _runway = box(8, 0.3, 80, 0x555555);
    _runway.position.set(0, 0.15, 0);
    _baseGroup.add(_runway);

    /* Hangars — one on each side mid-runway */
    var h1 = box(20, 8, 15, 0x667766);
    h1.position.set(-18, 4, -10);
    _baseGroup.add(h1);
    _hangars.push(h1);

    var h2 = box(20, 8, 15, 0x667766);
    h2.position.set(18, 4, -10);
    _baseGroup.add(h2);
    _hangars.push(h2);

    /* Control tower */
    _tower = box(4, 14, 4, 0x556677);
    _tower.position.set(14, 7, 20);
    _baseGroup.add(_tower);

    /* Radar array on top of control tower */
    _radarGroup = new THREE.Group();
    _radarGroup.position.set(14, 15, 20);
    _scene.add(_radarGroup);

    _radarMesh = cyl(0.5, 0.5, 4, 8, 0x445566);
    _radarMesh.position.set(0, 2, 0);
    _radarGroup.add(_radarMesh);

    var dish = box(3, 0.2, 2, 0x556677);
    dish.position.set(0, 4.5, 0);
    _radarGroup.add(dish);

    _radarLight = new THREE.PointLight(0x0088FF, 1.5, 12);
    _radarLight.position.set(0, 5, 0);
    _radarGroup.add(_radarLight);

    /* Fuel depot — south side, cylindrical tanks */
    _fuelDepotGroup = new THREE.Group();
    _fuelDepotGroup.position.set(-20, 0, 20);
    _scene.add(_fuelDepotGroup);

    var tankPositions = [
      new THREE.Vector3(-3, 3, 0),
      new THREE.Vector3(3, 3, 0),
      new THREE.Vector3(0, 3, 4)
    ];
    _fuelTanks = [];
    for (var ti = 0; ti < tankPositions.length; ti++) {
      var tank = cyl(2, 2, 6, 12, 0x885533);
      tank.position.copy(tankPositions[ti]);
      _fuelDepotGroup.add(tank);
      _fuelTanks.push({ mesh: tank, destroyed: false });
    }

    /* Locker room (small building near hangar) */
    _lockerRoom = box(6, 4, 8, 0x556655);
    _lockerRoom.position.set(-28, 2, -20);
    _baseGroup.add(_lockerRoom);

    /* Mechanic uniform pickup */
    _uniformMesh = box(1, 1.5, 0.3, 0xFFFFDD);
    _uniformMesh.position.set(-28, 2.8, -16);
    _scene.add(_uniformMesh);

    /* Ground */
    var ground = box(120, 0.2, 200, 0x3a4a2a);
    ground.position.set(0, -0.1, 0);
    _baseGroup.add(ground);
  }

  function buildAAGuns() {
    _aaGuns = [];
    var corners = [
      new THREE.Vector3(-35, 0,  35),
      new THREE.Vector3( 35, 0,  35),
      new THREE.Vector3(-35, 0, -35),
      new THREE.Vector3( 35, 0, -35)
    ];
    for (var i = 0; i < 4; i++) {
      var g = new THREE.Group();
      g.position.copy(corners[i]);
      _scene.add(g);

      var base = cyl(1.5, 2, 1.5, 8, 0x445544);
      base.position.set(0, 0.75, 0);
      g.add(base);

      var barrel = box(0.4, 0.4, 3, 0x556655);
      barrel.position.set(0, 2, 1.5);
      g.add(barrel);

      var light = new THREE.PointLight(0xFF4400, 0, 8);
      light.position.set(0, 3, 0);
      g.add(light);

      _aaGuns.push({
        group:            g,
        barrel:           barrel,
        light:            light,
        disabled:         false,
        sabotageProgress: 0,
        sabotaging:       false,
        pos:              corners[i].clone()
      });
    }
  }

  function buildPersonnel() {
    _personnel = [];

    /* 12 mechanics */
    for (var m = 0; m < 12; m++) {
      var grp = new THREE.Group();
      var body = box(0.8, 1.8, 0.6, 0x667755);
      body.position.set(0, 0.9, 0);
      var head = box(0.6, 0.6, 0.6, 0xCCAA88);
      head.position.set(0, 1.9, 0);
      grp.add(body);
      grp.add(head);

      var px = (Math.random() - 0.5) * 50;
      var pz = (Math.random() - 0.5) * 60;
      grp.position.set(px, 0, pz);
      _scene.add(grp);

      _personnel.push({
        group:     grp,
        hp:        60,
        role:      'mechanic',
        alive:     true,
        alert:     false,
        vel:       new THREE.Vector3(),
        wanderTimer: Math.random() * 3,
        wanderDir:   new THREE.Vector3((Math.random()-0.5), 0, (Math.random()-0.5)).normalize(),
        fireTimer:   0,
        pos:       grp.position
      });
    }

    /* 7 guards */
    for (var gd = 0; gd < 7; gd++) {
      var gGrp = new THREE.Group();
      var gBody = box(0.8, 1.8, 0.6, 0x334433);
      gBody.position.set(0, 0.9, 0);
      var gHead = box(0.6, 0.6, 0.6, 0xCCAA88);
      gHead.position.set(0, 1.9, 0);
      var gun = box(0.15, 0.15, 0.9, 0x222222);
      gun.position.set(0.55, 1.1, 0.5);
      gGrp.add(gBody);
      gGrp.add(gHead);
      gGrp.add(gun);

      var gx = (Math.random() - 0.5) * 60;
      var gz = (Math.random() - 0.5) * 60;
      gGrp.position.set(gx, 0, gz);
      _scene.add(gGrp);

      _personnel.push({
        group:     gGrp,
        hp:        80,
        role:      'guard',
        alive:     true,
        alert:     false,
        vel:       new THREE.Vector3(),
        wanderTimer: Math.random() * 5,
        wanderDir:   new THREE.Vector3((Math.random()-0.5), 0, (Math.random()-0.5)).normalize(),
        fireTimer:   2 + Math.random() * 2,
        pos:       gGrp.position
      });
    }

    /* 1 pilot — inside hangar */
    var pGrp = new THREE.Group();
    var pBody = box(0.8, 1.8, 0.6, 0x334455);
    pBody.position.set(0, 0.9, 0);
    var pHead = box(0.6, 0.6, 0.6, 0xCCAA88);
    pHead.position.set(0, 1.9, 0);
    var helmet = box(0.65, 0.4, 0.65, 0x334455);
    helmet.position.set(0, 2.15, 0);
    pGrp.add(pBody);
    pGrp.add(pHead);
    pGrp.add(helmet);
    pGrp.position.set(-18, 0, -10);
    _scene.add(pGrp);

    _personnel.push({
      group:     pGrp,
      hp:        150,
      role:      'pilot',
      alive:     true,
      alert:     false,
      vel:       new THREE.Vector3(),
      wanderTimer: 0,
      wanderDir:   new THREE.Vector3(1, 0, 0),
      fireTimer:   1.5,
      pos:       pGrp.position
    });

    /* Pilot keycard on pilot's position (drops when pilot neutralized or stolen in stealth) */
    _keycardMesh = box(0.4, 0.05, 0.25, 0x44FF44);
    _keycardMesh.position.set(-18, 1.5, -10);
    _keycardMesh.visible = false;
    _scene.add(_keycardMesh);
  }

  function buildJet() {
    _jetGroup = new THREE.Group();
    _jetGroup.position.set(-18, 1, -10); // inside hangar

    /* Fuselage */
    var fuseGeo = new THREE.CylinderGeometry(1, 1, 8, 12);
    var fuseMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
    var fuse = new THREE.Mesh(fuseGeo, fuseMat);
    fuse.rotation.x = Math.PI / 2;
    fuse.position.set(0, 1, 0);
    _jetGroup.add(fuse);

    /* Wings */
    var wingL = box(6, 0.2, 2.5, 0x667788);
    wingL.position.set(-3, 1, 0);
    _jetGroup.add(wingL);

    var wingR = box(6, 0.2, 2.5, 0x667788);
    wingR.position.set(3, 1, 0);
    _jetGroup.add(wingR);

    /* Tail fins */
    var tailL = box(0.2, 1.5, 1.5, 0x667788);
    tailL.position.set(-0.8, 2.2, -3.5);
    _jetGroup.add(tailL);

    var tailR = box(0.2, 1.5, 1.5, 0x667788);
    tailR.position.set(0.8, 2.2, -3.5);
    _jetGroup.add(tailR);

    /* Cockpit */
    var cockpit = box(1.2, 0.8, 1.5, 0x445566);
    cockpit.position.set(0, 1.9, 1.5);
    _jetGroup.add(cockpit);

    _scene.add(_jetGroup);
  }

  function buildPlayer() {
    _playerGroup = new THREE.Group();
    _playerGroup.position.copy(_playerPos);

    var body = box(0.7, 1.6, 0.5, 0x2244AA);
    body.position.set(0, 0.8, 0);
    var head = box(0.55, 0.55, 0.55, 0xCCAA88);
    head.position.set(0, 1.75, 0);

    _playerGroup.add(body);
    _playerGroup.add(head);
    _playerMesh = body;

    _scene.add(_playerGroup);
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchAirbaseRaid() {
    if (_active) return;
    _active          = true;
    _missionComplete = false;
    _missionFailed   = false;
    _alarmTriggered  = false;
    _scrambleTimer   = 180;
    _scrambleActive  = false;
    _radarDestroyed  = false;
    _fuelOnFire      = false;
    _fireTimer       = 60;
    _jetBoarded      = false;
    _jetState        = 'HANGARED';
    _jetThrottle     = 0;
    _uniformPickedUp = false;
    _disguiseActive  = false;
    _pilotKeycardPickedUp = false;
    _preflightProgress = 0;
    _preflightActive   = false;
    _preflightDone     = false;
    _approach          = null;
    _playerHP          = 100;
    _playerPos.set(0, 1, 60);
    _playerVel.set(0, 0, 0);
    _sabotageTarget    = null;
    _shootCooldown     = 0;

    buildBase();
    buildAAGuns();
    buildPersonnel();
    buildJet();
    buildPlayer();

    /* Ambient light */
    var ambient = new THREE.AmbientLight(0x334455, 0.6);
    _scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFEECC, 0.8);
    sun.position.set(40, 80, 30);
    _scene.add(sun);

    showHUD();
    showMessage('AIRBASE RAID\nApproach: [S]tealth / [A]ssault / [D]isguise', 6000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ALARM
  ════════════════════════════════════════════════════════════════════════ */

  function triggerAlarm() {
    if (_alarmTriggered) return;
    _alarmTriggered = true;
    if (!_radarDestroyed) {
      showMessage('! ALARM TRIGGERED ! Scramble in 3:00', 3000);
    } else {
      showMessage('! ALARM TRIGGERED ! (Radar destroyed — no scramble)', 3000);
    }
    /* Guards become alert */
    for (var i = 0; i < _personnel.length; i++) {
      if (_personnel[i].role === 'guard' || _personnel[i].role === 'pilot') {
        _personnel[i].alert = true;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     AA GUNS
  ════════════════════════════════════════════════════════════════════════ */

  function countActiveAA() {
    var n = 0;
    for (var i = 0; i < _aaGuns.length; i++) {
      if (!_aaGuns[i].disabled) n++;
    }
    return n;
  }

  function updateAAGuns(dt) {
    for (var i = 0; i < _aaGuns.length; i++) {
      var aa = _aaGuns[i];
      if (aa.disabled) continue;

      /* Track jet if on runway */
      if (_jetBoarded && _jetState !== 'AIRBORNE') {
        var toJet = new THREE.Vector3().subVectors(_jetGroup.position, aa.pos);
        toJet.y = 0;
        var angle = Math.atan2(toJet.x, toJet.z);
        /* 120° arc check — pointing forward (south) */
        var arcOk = Math.abs(angle) < (Math.PI * 60 / 180);
        if (arcOk) {
          aa.barrel.lookAt(
            aa.pos.x + toJet.x,
            aa.pos.y + 2,
            aa.pos.z + toJet.z
          );
        }
      }

      /* Sabotage progress */
      if (aa.sabotaging) {
        aa.sabotageProgress += dt;
        if (aa.sabotageProgress >= 5) {
          aa.disabled = true;
          aa.light.intensity = 0;
          aa.barrel.material.color.setHex(0x222222);
          showMessage('AA Gun disabled! (' + (4 - countActiveAA()) + '/4)', 2000);
        }
      }
    }

    /* Apply AA damage to jet on runway */
    if (_jetBoarded && _jetState !== 'AIRBORNE' && countActiveAA() === 4) {
      _playerHP -= 20 * dt;
      if (_playerHP <= 0) endMissionFail('Jet destroyed by AA fire!');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PERSONNEL AI
  ════════════════════════════════════════════════════════════════════════ */

  function countAlivePersonnel() {
    var n = 0;
    for (var i = 0; i < _personnel.length; i++) {
      if (_personnel[i].alive) n++;
    }
    return n;
  }

  function updatePersonnel(dt) {
    for (var i = 0; i < _personnel.length; i++) {
      var p = _personnel[i];
      if (!p.alive) continue;

      var distToPlayer = p.group.position.distanceTo(_playerGroup.position);

      /* Pilot attacks if jet is approached */
      if (p.role === 'pilot' && !_disguiseActive) {
        var distToJet = p.group.position.distanceTo(_jetGroup.position);
        if (distToJet < 12) {
          p.alert = true;
        }
      }

      /* Guards spot player within 18 units (unless disguised) */
      if (p.role === 'guard' && !_disguiseActive && distToPlayer < 18) {
        if (!p.alert) {
          p.alert = true;
          triggerAlarm();
        }
      }

      /* Mechanics flee from gunfire */
      if (p.role === 'mechanic' && p.alert) {
        var fleeDir = new THREE.Vector3().subVectors(p.group.position, _playerGroup.position).normalize();
        p.vel.lerp(fleeDir.multiplyScalar(4), dt * 3);
        p.group.position.addScaledVector(p.vel, dt);
        continue;
      }

      /* Wander */
      p.wanderTimer -= dt;
      if (p.wanderTimer <= 0) {
        p.wanderDir.set((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();
        p.wanderTimer = 2 + Math.random() * 4;
      }

      if (!p.alert) {
        p.vel.lerp(p.wanderDir.clone().multiplyScalar(2), dt * 2);
        p.group.position.addScaledVector(p.vel, dt);
      } else {
        /* Chase player */
        var toPlayer = new THREE.Vector3().subVectors(_playerGroup.position, p.group.position);
        if (toPlayer.length() > 1) {
          var chaseVel = toPlayer.normalize().multiplyScalar(5);
          p.vel.lerp(chaseVel, dt * 2);
          p.group.position.addScaledVector(p.vel, dt);
        }

        /* Shoot */
        if ((p.role === 'guard' || p.role === 'pilot') && distToPlayer < 30) {
          p.fireTimer -= dt;
          if (p.fireTimer <= 0) {
            spawnEnemyBullet(p.group.position.clone(), _playerGroup.position.clone());
            p.fireTimer = 1 + Math.random() * 1.5;
          }
        }
      }

      p.group.position.y = 0;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BULLETS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnPlayerBullet() {
    if (!_active || _shootCooldown > 0) return;
    _shootCooldown = 0.15;

    var geo = new THREE.SphereGeometry(0.08, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFF44 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(_playerGroup.position);
    mesh.position.y = 1.2;
    _scene.add(mesh);

    /* Direction from camera forward */
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    _bullets.push({ mesh: mesh, vel: dir.multiplyScalar(60), life: 2, owner: 'player' });
  }

  function spawnEnemyBullet(from, to) {
    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF4444 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    mesh.position.y = 1.2;
    _scene.add(mesh);

    var dir = new THREE.Vector3().subVectors(to, from);
    dir.y = 0;
    dir.normalize();
    /* Slight inaccuracy */
    dir.x += (Math.random() - 0.5) * 0.3;
    dir.z += (Math.random() - 0.5) * 0.3;
    dir.normalize();

    _bullets.push({ mesh: mesh, vel: dir.multiplyScalar(40), life: 2, owner: 'enemy' });
  }

  function updateBullets(dt) {
    _shootCooldown = Math.max(0, _shootCooldown - dt);

    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      b.mesh.position.addScaledVector(b.vel, dt);

      if (b.owner === 'player') {
        /* Hit personnel */
        var hitPers = false;
        for (var j = 0; j < _personnel.length; j++) {
          var p = _personnel[j];
          if (!p.alive) continue;
          if (b.mesh.position.distanceTo(p.group.position) < 1.5) {
            p.hp -= 35;
            if (p.hp <= 0) {
              killPersonnel(p);
            } else {
              /* Mechanics become alert (fleeing) on being shot */
              p.alert = true;
              if (!_alarmTriggered) triggerAlarm();
            }
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            hitPers = true;
            break;
          }
        }
        if (hitPers) continue;

        /* Hit fuel tank */
        for (var ft = 0; ft < _fuelTanks.length; ft++) {
          var tank = _fuelTanks[ft];
          if (tank.destroyed) continue;
          var worldTankPos = tank.mesh.position.clone().add(_fuelDepotGroup.position);
          if (b.mesh.position.distanceTo(worldTankPos) < 3) {
            tank.destroyed = true;
            spawnExplosion(worldTankPos);
            if (!_fuelOnFire) {
              _fuelOnFire = true;
              _fireTimer  = 60;
              triggerAlarm();
              showMessage('FUEL DEPOT ON FIRE! 60s to get jet out!', 4000);
              startFuelFire();
            }
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            break;
          }
        }

        /* Hit radar */
        if (!_radarDestroyed && _radarMesh) {
          var worldRadarPos = _radarGroup.position.clone();
          worldRadarPos.y += 2;
          if (b.mesh.position.distanceTo(worldRadarPos) < 3) {
            _radarDestroyed = true;
            _radarLight.intensity = 0;
            _radarMesh.material.color.setHex(0x222222);
            spawnExplosion(worldRadarPos);
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            showMessage('RADAR DESTROYED — No scramble response!', 3000);
            continue;
          }
        }

      } else {
        /* Enemy bullet hits player */
        if (b.mesh.position.distanceTo(_playerGroup.position) < 1.2) {
          _playerHP -= 15;
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          if (_playerHP <= 0) endMissionFail('Operative KIA!');
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     KILL PERSONNEL
  ════════════════════════════════════════════════════════════════════════ */

  function killPersonnel(p) {
    if (!p.alive) return;
    p.alive = false;

    /* Tilt body */
    p.group.rotation.x = Math.PI / 2;
    p.group.position.y = 0.4;

    /* If pilot killed, drop keycard */
    if (p.role === 'pilot' && !_pilotKeycardPickedUp) {
      _keycardMesh.position.copy(p.group.position);
      _keycardMesh.position.y = 0.5;
      _keycardMesh.visible = true;
    }

    /* Trigger alarm on killing guards/pilot */
    if (p.role === 'guard' || p.role === 'pilot') {
      if (!_alarmTriggered) triggerAlarm();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FUEL FIRE
  ════════════════════════════════════════════════════════════════════════ */

  function startFuelFire() {
    _fireMeshes = [];
    for (var f = 0; f < 8; f++) {
      var fireSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random(), 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.85 })
      );
      fireSphere.position.set(
        _fuelDepotGroup.position.x + (Math.random() - 0.5) * 8,
        1 + Math.random() * 3,
        _fuelDepotGroup.position.z + (Math.random() - 0.5) * 8
      );
      _scene.add(fireSphere);
      _fireMeshes.push({ mesh: fireSphere, base: fireSphere.position.y });
    }
    var fireLight = new THREE.PointLight(0xFF4400, 4, 30);
    fireLight.position.copy(_fuelDepotGroup.position);
    fireLight.position.y = 5;
    _scene.add(fireLight);
  }

  function updateFuelFire(dt) {
    if (!_fuelOnFire) return;
    _fireTimer -= dt;

    /* Animate fire */
    for (var f = 0; f < _fireMeshes.length; f++) {
      var fm = _fireMeshes[f];
      fm.mesh.position.y = fm.base + Math.sin(Date.now() * 0.003 + f) * 0.5;
      fm.mesh.material.opacity = 0.7 + Math.sin(Date.now() * 0.005 + f * 1.3) * 0.15;
    }

    if (_fireTimer <= 0 && !_jetBoarded) {
      endMissionFail('Jet destroyed by fire!');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos) {
    var geo  = new THREE.SphereGeometry(2.5, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);

    var lt = new THREE.PointLight(0xFF6600, 6, 25);
    lt.position.copy(pos);
    _scene.add(lt);

    _explosions.push({ mesh: mesh, light: lt, life: 1.0 });
  }

  function updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _scene.remove(ex.light);
        _explosions.splice(i, 1);
        continue;
      }
      ex.mesh.material.opacity = ex.life * 0.9;
      ex.light.intensity       = ex.life * 6;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCRAMBLE JETS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnScrambleJets() {
    _scrambleActive = true;
    showMessage('SCRAMBLE JETS INCOMING! Take off NOW!', 3000);

    for (var i = 0; i < 2; i++) {
      var g = new THREE.Group();
      var fuseGeo = new THREE.BoxGeometry(2, 1, 6, 1, 1, 1);
      var fuseMat = new THREE.MeshLambertMaterial({ color: 0x992222 });
      var fuse = new THREE.Mesh(fuseGeo, fuseMat);
      g.add(fuse);

      var wg = box(8, 0.2, 2, 0x772222);
      g.add(wg);

      g.position.set((i === 0 ? -4 : 4), 1, -120);
      _scene.add(g);

      var lt = new THREE.PointLight(0xFF2200, 1, 10);
      lt.position.copy(g.position);
      _scene.add(lt);

      _scrambleJets.push({
        group: g,
        light: lt,
        vel:   new THREE.Vector3(0, 0, 2.5)
      });
    }
  }

  function updateScramble(dt) {
    if (!_alarmTriggered || _radarDestroyed) return;

    if (!_scrambleActive) {
      _scrambleTimer -= dt;
      if (_scrambleTimer <= 0) {
        spawnScrambleJets();
      }
    } else {
      /* Scramble jets moving toward runway */
      for (var i = 0; i < _scrambleJets.length; i++) {
        var sj = _scrambleJets[i];
        sj.group.position.addScaledVector(sj.vel, dt);
        sj.light.position.copy(sj.group.position);

        /* Block runway if they reach it */
        if (sj.group.position.z > 40 && !_missionComplete) {
          endMissionFail('Scramble jets blocked the runway!');
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (_jetBoarded) {
      updateJetTaxi(dt);
      return;
    }

    var speed = 8;
    var dir   = new THREE.Vector3();

    if (_keys['w'] || _keys['W']) dir.z -= 1;
    if (_keys['s'] || _keys['S']) dir.z += 1;
    if (_keys['a'] || _keys['A']) dir.x -= 1;
    if (_keys['d'] || _keys['D']) dir.x += 1;

    if (dir.length() > 0) dir.normalize();

    /* Rotate movement direction by camera yaw */
    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);
    var camYaw = Math.atan2(camDir.x, camDir.z);
    var cosY   = Math.cos(camYaw);
    var sinY   = Math.sin(camYaw);
    var mx = dir.x * cosY + dir.z * sinY;
    var mz = -dir.x * sinY + dir.z * cosY;
    dir.set(mx, 0, mz);

    _playerVel.lerp(dir.multiplyScalar(speed), dt * 10);
    _playerGroup.position.addScaledVector(_playerVel, dt);
    _playerGroup.position.y = 0;

    /* Camera follow */
    var camOffset = new THREE.Vector3(0, 12, 16);
    var desired = _playerGroup.position.clone().add(camOffset);
    _camera.position.lerp(desired, dt * 6);
    _camera.lookAt(_playerGroup.position.clone().add(new THREE.Vector3(0, 1, 0)));

    /* Check interactions */
    checkInteractions();
  }

  function updateJetTaxi(dt) {
    var forward = 0;
    var turn    = 0;

    if (_keys['w'] || _keys['W']) forward += 1;
    if (_keys['s'] || _keys['S']) forward -= 1;
    if (_keys['a'] || _keys['A']) turn    -= 1;
    if (_keys['d'] || _keys['D']) turn    += 1;

    _jetThrottle += forward * 5 * dt;
    _jetThrottle  = Math.max(-5, Math.min(40, _jetThrottle));
    _jetThrottle *= 0.98; // friction

    _jetGroup.rotation.y += turn * 0.8 * dt;

    var fwd = new THREE.Vector3(
      Math.sin(_jetGroup.rotation.y),
      0,
      Math.cos(_jetGroup.rotation.y)
    );

    _jetGroup.position.addScaledVector(fwd, _jetThrottle * dt);
    _jetGroup.position.y = 1;

    /* Camera behind jet */
    var camOff = new THREE.Vector3(0, 8, 20);
    var backDir = new THREE.Vector3(-fwd.x, 0, -fwd.z);
    var desired = _jetGroup.position.clone()
      .add(backDir.multiplyScalar(20))
      .add(new THREE.Vector3(0, 8, 0));
    _camera.position.lerp(desired, dt * 5);
    _camera.lookAt(_jetGroup.position);

    /* Takeoff */
    if (_keys[' '] && _jetThrottle > 25) {
      _jetState = 'AIRBORNE';
      endMissionSuccess();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTIONS
  ════════════════════════════════════════════════════════════════════════ */

  function checkInteractions() {
    var pos   = _playerGroup.position;
    var shown = false;

    /* AA gun sabotage — stealth */
    _sabotageTarget = null;
    for (var i = 0; i < _aaGuns.length; i++) {
      var aa = _aaGuns[i];
      if (aa.disabled) continue;
      if (pos.distanceTo(aa.pos) < 4) {
        _sabotageTarget = aa;
        showPrompt('[E] Sabotage AA Gun (' + Math.round(aa.sabotageProgress) + '/5s)');
        shown = true;
        break;
      }
    }

    /* Keycard pickup */
    if (!_pilotKeycardPickedUp && _keycardMesh && _keycardMesh.visible) {
      if (pos.distanceTo(_keycardMesh.position) < 2.5) {
        showPrompt('[E] Pick up Pilot Keycard');
        shown = true;
      }
    }

    /* Uniform pickup — disguise */
    if (!_uniformPickedUp && _uniformMesh) {
      if (pos.distanceTo(_uniformMesh.position) < 2.5) {
        showPrompt('[E] Pick up Mechanic Uniform');
        shown = true;
      }
    }

    /* Board jet */
    if (!_jetBoarded) {
      var canBoard = false;
      if (_jetGroup && pos.distanceTo(_jetGroup.position) < 5) {
        if (_approach === 'assault' && countAlivePersonnel() === 0) {
          canBoard = true;
          showPrompt('[E] Board Jet (all personnel cleared)');
          shown = true;
        } else if (_approach === 'stealth' && _pilotKeycardPickedUp && countActiveAA() === 0) {
          canBoard = true;
          showPrompt('[E] Board Jet (keycard + AA disabled)');
          shown = true;
        } else if (_approach === 'disguise' && _preflightDone) {
          canBoard = true;
          showPrompt('[E] Board Jet (preflight complete)');
          shown = true;
        } else if (_approach === null) {
          showPrompt('[S]tealth [A]ssault [D]isguise — choose approach');
          shown = true;
        } else if (_approach === 'disguise' && _disguiseActive && !_preflightDone) {
          showPrompt('[E] Start Preflight Check (10s)');
          shown = true;
        } else {
          showPrompt('Cannot board yet — complete objectives');
          shown = true;
        }
      }

      /* Actually board */
      if (canBoard && _keys['e'] && !_keysHandled['e_board']) {
        _keysHandled['e_board'] = true;
        boardJet();
      }
    }

    if (!shown) hidePrompt();
  }

  /* Key-handled flags to prevent repeated triggers */
  var _keysHandled = {};

  function boardJet() {
    _jetBoarded = true;
    _jetState   = 'PREPPED';
    _scene.remove(_playerGroup);
    showMessage('JET BOARDED! WASD to taxi, SPACE for full throttle takeoff!', 4000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PREFLIGHT CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function updatePreflight(dt) {
    if (!_preflightActive || _preflightDone) return;
    var pos = _playerGroup.position;

    if (_jetGroup && pos.distanceTo(_jetGroup.position) > 5) {
      _preflightActive = false;
      _preflightProgress = 0;
      return;
    }

    _preflightProgress += dt;
    showPrompt('Preflight check: ' + Math.round(_preflightProgress) + '/10s (stay near jet)');

    if (_preflightProgress >= 10) {
      _preflightDone   = true;
      _preflightActive = false;
      showMessage('Preflight complete! Board the jet (E).', 3000);
      hidePrompt();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD / DOM
  ════════════════════════════════════════════════════════════════════════ */

  function showHUD() {
    _hud.style.display = 'block';
    updateHUD();
  }

  function updateHUD() {
    if (!_hud || !_active) return;

    var aaDisabled  = 4 - countActiveAA();
    var personnel   = countAlivePersonnel();
    var alarmStr    = _alarmTriggered ? 'ON' : 'OFF';
    var scrambleStr = '';

    if (_alarmTriggered && !_radarDestroyed && !_scrambleActive) {
      scrambleStr = ' | SCRAMBLE: ' + Math.ceil(_scrambleTimer) + 's';
    } else if (_scrambleActive) {
      scrambleStr = ' | SCRAMBLE: INCOMING!';
    } else if (_radarDestroyed) {
      scrambleStr = ' | SCRAMBLE: SUPPRESSED';
    }

    var fireStr = '';
    if (_fuelOnFire && !_jetBoarded) {
      fireStr = ' | FIRE: ' + Math.ceil(_fireTimer) + 's';
    }

    _hud.textContent =
      'AIRBASE [AA GUNS: ' + aaDisabled + '/4 disabled]' +
      ' [PERSONNEL: ' + personnel + ']' +
      ' [JET: ' + _jetState + ']' +
      ' [ALARM: ' + alarmStr + ']' +
      scrambleStr + fireStr;
  }

  /* ── Big message overlay ─────────────────────────────────────────────── */

  var _msgTimeout = null;

  function showMessage(text, duration) {
    if (!_msgEl) return;
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    if (_msgTimeout) clearTimeout(_msgTimeout);
    if (duration) {
      _msgTimeout = setTimeout(function () {
        if (_msgEl) _msgEl.style.display = 'none';
      }, duration);
    }
  }

  function hideMessage() {
    if (_msgEl) _msgEl.style.display = 'none';
    if (_msgTimeout) { clearTimeout(_msgTimeout); _msgTimeout = null; }
  }

  /* ── Interaction prompt ──────────────────────────────────────────────── */

  function showPrompt(text) {
    if (!_promptEl) return;
    _promptEl.textContent = text;
    _promptEl.style.display = 'block';
    _promptVisible = true;
  }

  function hidePrompt() {
    if (_promptEl) _promptEl.style.display = 'none';
    _promptVisible = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION END
  ════════════════════════════════════════════════════════════════════════ */

  function endMissionSuccess() {
    _missionComplete = true;
    _active = false;
    _jetState = 'AIRBORNE';
    showMessage('MISSION COMPLETE!\nJet airborne — escaped the airbase!', 0);
  }

  function endMissionFail(reason) {
    _missionFailed = true;
    _active = false;
    showMessage('MISSION FAILED\n' + reason, 0);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* A + B activation */
    if (e.key === 'a' || e.key === 'A') _abPressTime.A = Date.now();
    if (e.key === 'b' || e.key === 'B') _abPressTime.B = Date.now();
    var abDiff = Math.abs(_abPressTime.A - _abPressTime.B);
    if ((_keys['a'] || _keys['A']) && (_keys['b'] || _keys['B']) && abDiff < AB_WINDOW && !_active) {
      launchAirbaseRaid();
      return;
    }

    if (!_active) return;

    /* Approach selection */
    if (!_approach) {
      if (e.key === 's' || e.key === 'S') {
        _approach = 'stealth';
        showMessage('STEALTH: Disable 4 AA guns (E near each), steal keycard from pilot, board jet.', 5000);
        return;
      }
      if (e.key === 'a' || e.key === 'A') {
        _approach = 'assault';
        showMessage('ASSAULT: Eliminate all 20 personnel, destroy fuel depot (optional), board jet.', 5000);
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        _approach = 'disguise';
        showMessage('DISGUISE: Get mechanic uniform from locker room, walk to jet, start preflight.', 5000);
        /* Disguise: guards ignore player once uniform equipped */
        return;
      }
    }

    /* E — multi-use interaction */
    if (e.key === 'e' || e.key === 'E') {
      handleInteractPress();
    }

    /* Shoot — left click handled in mousedown; fallback: F key */
    if (e.key === 'f' || e.key === 'F') {
      spawnPlayerBullet();
    }

    /* Space — takeoff (handled in updateJetTaxi as held key) */
    if (e.key === ' ') {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;

    /* Clear key-handled flags on release */
    if (e.key === 'e' || e.key === 'E') {
      _keysHandled['e_board'] = false;
      if (_sabotageTarget) {
        _sabotageTarget.sabotaging = false;
      }
    }
  }

  function onMouseDown(e) {
    if (!_active || _jetBoarded) return;
    if (e.button === 0) spawnPlayerBullet();
  }

  function onMouseMove(e) {
    if (!_canvas) return;
    var rect = _canvas.getBoundingClientRect();
    _mouseX  = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    _mouseY  = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  }

  function handleInteractPress() {
    var pos = _playerGroup.position;

    /* Sabotage AA gun */
    if (_sabotageTarget && !_sabotageTarget.disabled) {
      _sabotageTarget.sabotaging = true;
      return;
    }

    /* Pick up keycard */
    if (!_pilotKeycardPickedUp && _keycardMesh && _keycardMesh.visible) {
      if (pos.distanceTo(_keycardMesh.position) < 2.5) {
        _pilotKeycardPickedUp = true;
        _keycardMesh.visible  = false;
        showMessage('Pilot keycard obtained!', 2000);
        return;
      }
    }

    /* Pick up uniform */
    if (!_uniformPickedUp && _uniformMesh) {
      if (pos.distanceTo(_uniformMesh.position) < 2.5) {
        _uniformPickedUp = true;
        _uniformMesh.visible = false;
        _disguiseActive  = true;
        /* Change player color to overalls */
        _playerMesh.material.color.setHex(0xFFFFDD);
        showMessage('Mechanic uniform equipped — guards ignore you!', 3000);
        return;
      }
    }

    /* Start preflight check (disguise) */
    if (_approach === 'disguise' && _disguiseActive && !_preflightDone && !_preflightActive) {
      if (_jetGroup && pos.distanceTo(_jetGroup.position) < 5) {
        _preflightActive = true;
        _preflightProgress = 0;
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    /* HUD */
    _hud = document.createElement('div');
    _hud.id = 'airbase-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    /* Big message overlay */
    _msgEl = document.createElement('div');
    _msgEl.id = 'airbase-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:24px',
      'font-weight:bold',
      'text-align:center',
      'background:rgba(0,0,0,0.78)',
      'padding:18px 36px',
      'border-radius:8px',
      'pointer-events:none',
      'display:none',
      'z-index:910',
      'white-space:pre-line',
      'text-shadow:0 0 12px #00FF88'
    ].join(';');
    document.body.appendChild(_msgEl);

    /* Interaction prompt */
    _promptEl = document.createElement('div');
    _promptEl.id = 'airbase-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFFF88',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.65)',
      'padding:6px 18px',
      'border-radius:6px',
      'pointer-events:none',
      'display:none',
      'z-index:911'
    ].join(';');
    document.body.appendChild(_promptEl);

    /* Vignette for damage */
    _vigEl = document.createElement('div');
    _vigEl.id = 'airbase-vignette';
    _vigEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'pointer-events:none',
      'z-index:899',
      'opacity:0',
      'transition:opacity 0.1s',
      'background:radial-gradient(ellipse at center, transparent 50%, rgba(180,0,0,0.85) 100%)'
    ].join(';');
    document.body.appendChild(_vigEl);

    /* Input */
    document.addEventListener('keydown',   onKeyDown);
    document.addEventListener('keyup',     onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
  }

  function update(delta) {
    if (!_active && !_missionComplete && !_missionFailed) return;
    if (!_active) return;

    var dt = delta || 0.016;

    updatePlayer(dt);
    updatePersonnel(dt);
    updateAAGuns(dt);
    updateBullets(dt);
    updateExplosions(dt);
    updateFuelFire(dt);
    updateScramble(dt);
    if (_approach === 'disguise') updatePreflight(dt);

    /* Reset sabotage if key released */
    if (_sabotageTarget && !_keys['e'] && !_keys['E']) {
      _sabotageTarget.sabotaging = false;
    }

    /* Damage vignette */
    var hpRatio = Math.max(0, 1 - _playerHP / 100);
    _vigEl.style.opacity = String(hpRatio * 0.85);

    /* Radar pulse animation */
    if (!_radarDestroyed && _radarMesh) {
      var t = Date.now() * 0.001;
      _radarGroup.rotation.y = t * 1.2;
      if (_radarLight) {
        _radarLight.intensity = 1.2 + Math.sin(t * 4) * 0.4;
      }
    }

    updateHUD();
  }

  function reset() {
    _active          = false;
    _missionComplete = false;
    _missionFailed   = false;

    /* Remove base */
    if (_baseGroup && _scene) _scene.remove(_baseGroup);
    _baseGroup = null;

    if (_fuelDepotGroup && _scene) _scene.remove(_fuelDepotGroup);
    _fuelDepotGroup = null;

    if (_radarGroup && _scene) _scene.remove(_radarGroup);
    _radarGroup = null;
    _radarMesh  = null;
    _radarLight = null;

    /* Remove jet */
    if (_jetGroup && _scene) _scene.remove(_jetGroup);
    _jetGroup = null;

    /* Remove player */
    if (_playerGroup && _scene) _scene.remove(_playerGroup);
    _playerGroup = null;
    _playerMesh  = null;

    /* Remove AA guns */
    for (var i = 0; i < _aaGuns.length; i++) {
      if (_scene) _scene.remove(_aaGuns[i].group);
    }
    _aaGuns = [];

    /* Remove personnel */
    for (var j = 0; j < _personnel.length; j++) {
      if (_scene) _scene.remove(_personnel[j].group);
    }
    _personnel = [];

    /* Remove keycard, uniform */
    if (_keycardMesh && _scene) _scene.remove(_keycardMesh);
    _keycardMesh = null;
    if (_uniformMesh && _scene) _scene.remove(_uniformMesh);
    _uniformMesh = null;

    /* Remove bullets */
    for (var k = 0; k < _bullets.length; k++) {
      if (_scene) _scene.remove(_bullets[k].mesh);
    }
    _bullets = [];

    /* Remove explosions */
    for (var x = 0; x < _explosions.length; x++) {
      if (_scene) {
        _scene.remove(_explosions[x].mesh);
        _scene.remove(_explosions[x].light);
      }
    }
    _explosions = [];

    /* Remove fire meshes */
    for (var f = 0; f < _fireMeshes.length; f++) {
      if (_scene) _scene.remove(_fireMeshes[f].mesh);
    }
    _fireMeshes = [];

    /* Remove scramble jets */
    for (var s = 0; s < _scrambleJets.length; s++) {
      if (_scene) {
        _scene.remove(_scrambleJets[s].group);
        _scene.remove(_scrambleJets[s].light);
      }
    }
    _scrambleJets = [];

    /* Remove fuel tanks */
    _fuelTanks = [];
    _hangars   = [];

    /* Reset state */
    _approach             = null;
    _alarmTriggered       = false;
    _scrambleTimer        = 180;
    _scrambleActive       = false;
    _radarDestroyed       = false;
    _fuelOnFire           = false;
    _fireTimer            = 60;
    _jetState             = 'HANGARED';
    _jetBoarded           = false;
    _jetThrottle          = 0;
    _pilotKeycardPickedUp = false;
    _uniformPickedUp      = false;
    _disguiseActive       = false;
    _preflightProgress    = 0;
    _preflightActive      = false;
    _preflightDone        = false;
    _playerHP             = 100;
    _playerPos.set(0, 1, 60);
    _playerVel.set(0, 0, 0);
    _sabotageTarget       = null;
    _shootCooldown        = 0;
    _keys                 = {};
    _keysHandled          = {};

    /* DOM */
    if (_hud)      _hud.style.display      = 'none';
    if (_msgEl)    _msgEl.style.display     = 'none';
    if (_promptEl) _promptEl.style.display  = 'none';
    if (_vigEl)    _vigEl.style.opacity     = '0';
    if (_msgTimeout) { clearTimeout(_msgTimeout); _msgTimeout = null; }
  }

  return { init: init, update: update, reset: reset };

}());
