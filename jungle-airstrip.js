/* ───────────────────────────────────────────────────────────────────────────
   jungle-airstrip.js — Hidden Jungle Drug Cartel Airstrip
   API: window.JungleAirstrip = { init, update, reset }
   Activation: J then A within 400ms (sequential, not simultaneous)

   Objectives:
     - Destroy 3 cartel aircraft before they take off
     - Blow up 2 fuel depot tank clusters
     - Neutralize cartel security force
     - Reach extraction zone once objectives complete
   ─────────────────────────────────────────────────────────────────────────── */
window.JungleAirstrip = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Activation key tracking (J then A within 400ms) ───────────────────── */
  var _jPressTime  = 0;
  var _ACTIVATE_WINDOW = 400;

  /* ── Game state ─────────────────────────────────────────────────────────── */
  var _active          = false;
  var _missionComplete = false;
  var _missionFailed   = false;

  /* ── Tracked scene objects for cleanup ─────────────────────────────────── */
  var _sceneObjects = [];

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _playerGroup  = null;
  var _playerPos    = new THREE.Vector3(0, 0, 80);
  var _playerVel    = new THREE.Vector3();
  var _playerHP     = 100;
  var _shootCooldown = 0;

  /* ── Input ──────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Aircraft (3 planes that taxi toward takeoff) ───────────────────────── */
  var _aircraft = [];
  /*
    Each: { group, hp, state: 'taxiing'|'airborne'|'destroyed',
            taxiSpeed, taxiPos, destroyed }
  */
  var _aircraftDestroyed = 0;
  var AIRCRAFT_TOTAL     = 3;

  /* ── Fuel depots (2 clusters of cylinders) ──────────────────────────────── */
  var _fuelDepots = [];
  /*
    Each: { group, hp, blown, explosion }
  */
  var _fuelDepotsBlown = 0;
  var FUEL_DEPOT_TOTAL = 2;

  /* ── Cartel guards ──────────────────────────────────────────────────────── */
  var _guards = [];
  /*
    Each: { group, hp, alive, alert, fireTimer, wanderDir, wanderTimer }
  */

  /* ── Bullets ─────────────────────────────────────────────────────────────── */
  var _bullets = [];
  /* Each: { mesh, vel, life, owner } */

  /* ── Explosions ──────────────────────────────────────────────────────────── */
  var _explosions = [];
  /* Each: { group, life, maxLife } */

  /* ── Runway lights ───────────────────────────────────────────────────────── */
  var _runwayLightTime = 0;
  var _runwayLightMeshes = [];

  /* ── Fog reference (to restore on reset) ───────────────────────────────── */
  var _prevFog  = null;

  /* ── HUD / DOM ───────────────────────────────────────────────────────────── */
  var _hudEl    = null;
  var _msgEl    = null;
  var _vigEl    = null;
  var _msgTimer = null;

  /* ══════════════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function makeBox(w, h, d, color, emissive) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var opt = { color: color };
    if (emissive !== undefined) {
      opt.emissive = emissive;
      opt.emissiveIntensity = 0.9;
    }
    var mat = new THREE.MeshLambertMaterial(opt);
    return new THREE.Mesh(geo, mat);
  }

  function makeCyl(rTop, rBot, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, segs, color) {
    var geo = new THREE.SphereGeometry(r, segs, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function trackAdd(obj) {
    _scene.add(obj);
    _sceneObjects.push(obj);
    return obj;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD SCENE
  ══════════════════════════════════════════════════════════════════════════ */

  function buildScene() {

    /* Lighting */
    var ambient = new THREE.AmbientLight(0x1a2a10, 0.8);
    trackAdd(ambient);

    var sun = new THREE.DirectionalLight(0xCCDD99, 0.7);
    sun.position.set(30, 60, 20);
    trackAdd(sun);

    /* Ground — dark jungle dirt */
    var ground = makeBox(300, 0.4, 300, 0x1a2a0a);
    ground.position.set(0, -0.2, 0);
    trackAdd(ground);

    /* ── Runway ───────────────────────────────────────────────────────────── */
    var runway = makeBox(12, 0.3, 180, 0x444444);
    runway.position.set(0, 0.15, 0);
    trackAdd(runway);

    /* Runway center line dashes */
    for (var li = 0; li < 18; li++) {
      var dash = makeBox(0.5, 0.05, 4, 0xCCCCCC);
      dash.position.set(0, 0.32, -80 + li * 10);
      trackAdd(dash);
    }

    /* ── Runway lights along edges ──────────────────────────────────────── */
    _runwayLightMeshes = [];
    for (var rl = 0; rl < 20; rl++) {
      var lz = -90 + rl * 9.5;

      var ltLeft  = makeBox(0.4, 0.6, 0.4, 0x222222, 0xFFFF44);
      ltLeft.position.set(-7, 0.3, lz);
      trackAdd(ltLeft);
      _runwayLightMeshes.push(ltLeft);

      var ltRight = makeBox(0.4, 0.6, 0.4, 0x222222, 0xFFFF44);
      ltRight.position.set(7, 0.3, lz);
      trackAdd(ltRight);
      _runwayLightMeshes.push(ltRight);
    }

    /* ── Hangar building ─────────────────────────────────────────────────── */
    var hangar = makeBox(28, 10, 22, 0x3a4a2a);
    hangar.position.set(-24, 5, -50);
    trackAdd(hangar);

    /* Hangar roof ridge */
    var hangarRoof = makeBox(28, 3, 22, 0x2a3a1a);
    hangarRoof.position.set(-24, 11.5, -50);
    trackAdd(hangarRoof);

    /* Hangar door frame */
    var hangarDoor = makeBox(14, 9, 0.4, 0x2a2a1a);
    hangarDoor.position.set(-24, 4.5, -39.2);
    trackAdd(hangarDoor);

    /* Second smaller shelter */
    var shelter = makeBox(14, 6, 12, 0x3a4a2a);
    shelter.position.set(22, 3, -48);
    trackAdd(shelter);

    /* Control shack */
    var shack = makeBox(6, 4, 6, 0x4a5a3a);
    shack.position.set(18, 2, 20);
    trackAdd(shack);

    var shackRoof = makeBox(7, 0.5, 7, 0x2a3a1a);
    shackRoof.position.set(18, 4.25, 20);
    trackAdd(shackRoof);

    /* ── Fuel depots ─────────────────────────────────────────────────────── */
    buildFuelDepot(0, new THREE.Vector3(-30, 0, 10));
    buildFuelDepot(1, new THREE.Vector3( 30, 0, 30));

    /* ── Jungle tree line ────────────────────────────────────────────────── */
    buildTreeLine();

    /* ── Aircraft ────────────────────────────────────────────────────────── */
    buildAircraft(0, new THREE.Vector3(-2, 0, -55), 0xAAAA88);  /* in hangar */
    buildAircraft(1, new THREE.Vector3( 2, 0, -30), 0x997755);  /* on apron  */
    buildAircraft(2, new THREE.Vector3(-1, 0, -10), 0x889977);  /* taxiing   */

    /* ── Guards ──────────────────────────────────────────────────────────── */
    buildGuards();

    /* ── Player ──────────────────────────────────────────────────────────── */
    buildPlayer();

    /* ── Extraction zone marker ──────────────────────────────────────────── */
    var extMarker = makeBox(6, 0.15, 6, 0x00AA44);
    extMarker.position.set(0, 0.08, 88);
    trackAdd(extMarker);

    var extLabel = makeBox(1, 2, 0.2, 0x00FF66, 0x00FF66);
    extLabel.position.set(0, 1.5, 90);
    trackAdd(extLabel);

    /* ── Jungle fog ──────────────────────────────────────────────────────── */
    _prevFog = _scene.fog;
    _scene.fog = new THREE.Fog(0x0a1a05, 30, 140);
  }

  /* ─── Fuel depot ─────────────────────────────────────────────────────────── */

  function buildFuelDepot(idx, worldPos) {
    var g = new THREE.Group();
    g.position.copy(worldPos);

    /* Berm / base pad */
    var pad = makeBox(12, 0.5, 10, 0x2a3a1a);
    pad.position.set(0, 0.25, 0);
    g.add(pad);

    /* Two large cylindrical tanks */
    var tankA = makeCyl(1.8, 1.8, 5, 10, 0x665533);
    tankA.position.set(-3, 2.75, 0);
    g.add(tankA);

    var tankB = makeCyl(1.8, 1.8, 5, 10, 0x665533);
    tankB.position.set(3, 2.75, 0);
    g.add(tankB);

    /* Small connector pipe */
    var pipe = makeCyl(0.25, 0.25, 6.5, 6, 0x443322);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 2.0, 0);
    g.add(pipe);

    /* Warning stripes on tanks */
    var stripeA = makeBox(3.7, 0.4, 0.1, 0xFF4400);
    stripeA.position.set(-3, 3.5, 1.85);
    g.add(stripeA);

    var stripeB = makeBox(3.7, 0.4, 0.1, 0xFF4400);
    stripeB.position.set(3, 3.5, 1.85);
    g.add(stripeB);

    trackAdd(g);

    _fuelDepots.push({
      group: g,
      hp:    80,
      blown: false,
      worldPos: worldPos.clone()
    });
  }

  /* ─── Aircraft ───────────────────────────────────────────────────────────── */

  function buildAircraft(idx, startPos, color) {
    var g = new THREE.Group();
    g.position.copy(startPos);

    /* Fuselage */
    var fuselage = makeBox(2.2, 1.4, 8, color);
    fuselage.position.set(0, 0.9, 0);
    g.add(fuselage);

    /* Nose cone */
    var nose = makeBox(1.2, 1.0, 2, color);
    nose.position.set(0, 0.9, 4.8);
    g.add(nose);

    /* Wings */
    var wingL = makeBox(7, 0.25, 3.5, color);
    wingL.position.set(-4.5, 0.85, 0);
    g.add(wingL);

    var wingR = makeBox(7, 0.25, 3.5, color);
    wingR.position.set(4.5, 0.85, 0);
    g.add(wingR);

    /* Wing tips */
    var tipL = makeBox(0.3, 0.8, 1.2, color);
    tipL.position.set(-8, 1.1, 0);
    g.add(tipL);

    var tipR = makeBox(0.3, 0.8, 1.2, color);
    tipR.position.set(8, 1.1, 0);
    g.add(tipR);

    /* Tail fin */
    var tailV = makeBox(0.3, 2.2, 2, color);
    tailV.position.set(0, 2.2, -3.5);
    g.add(tailV);

    /* Horizontal stabilizers */
    var stabL = makeBox(3.5, 0.2, 1.5, color);
    stabL.position.set(-2, 1.6, -3.8);
    g.add(stabL);

    var stabR = makeBox(3.5, 0.2, 1.5, color);
    stabR.position.set(2, 1.6, -3.8);
    g.add(stabR);

    /* Propeller */
    var prop = makeBox(3.5, 0.2, 0.2, 0x222222);
    prop.position.set(0, 0.9, 5.9);
    g.add(prop);

    /* Cockpit window */
    var cockpit = makeBox(1.0, 0.7, 1.0, 0x445566);
    cockpit.position.set(0, 1.65, 2.5);
    g.add(cockpit);

    /* Landing gear stubs */
    var gearL = makeCyl(0.15, 0.15, 0.8, 5, 0x333333);
    gearL.position.set(-1, 0.3, 0.5);
    g.add(gearL);

    var gearR = makeCyl(0.15, 0.15, 0.8, 5, 0x333333);
    gearR.position.set(1, 0.3, 0.5);
    g.add(gearR);

    /* Drug cartel markings — a red stripe */
    var stripe = makeBox(2.3, 0.2, 8.2, 0xCC2222);
    stripe.position.set(0, 1.6, 0);
    g.add(stripe);

    trackAdd(g);

    /* Stagger start positions so they taxi at different times */
    var taxiSpeed = 1.5 + idx * 0.8;
    var liftoffZ  = 85; /* z position at which plane "lifts off" */

    _aircraft.push({
      group:      g,
      hp:         60,
      state:      'taxiing',
      taxiSpeed:  taxiSpeed,
      liftoffZ:   liftoffZ,
      startDelay: idx * 18,  /* seconds before this plane starts taxiing */
      delayTimer: idx * 18,
      prop:       prop,
      destroyed:  false
    });
  }

  /* ─── Tree line ──────────────────────────────────────────────────────────── */

  function buildTreeLine() {
    var positions = [];
    var i;

    /* Left flank */
    for (i = 0; i < 28; i++) {
      positions.push(new THREE.Vector3(
        -18 - Math.random() * 30,
        0,
        -100 + i * 7 + (Math.random() - 0.5) * 4
      ));
    }
    /* Right flank */
    for (i = 0; i < 28; i++) {
      positions.push(new THREE.Vector3(
        18 + Math.random() * 30,
        0,
        -100 + i * 7 + (Math.random() - 0.5) * 4
      ));
    }
    /* Far end behind runway */
    for (i = 0; i < 14; i++) {
      positions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        0,
        -108 - Math.random() * 20
      ));
    }

    for (i = 0; i < positions.length; i++) {
      var p = positions[i];
      var h = 5 + Math.random() * 6;

      /* Trunk */
      var trunk = makeCyl(0.3, 0.45, h, 5, 0x2a1a08);
      trunk.position.set(p.x, h / 2, p.z);
      trackAdd(trunk);

      /* Canopy — layered spheres for fullness */
      var cr = 2.2 + Math.random() * 1.8;
      var canopy = makeSphere(cr, 6, 0x0a2a05 + Math.floor(Math.random() * 0x051000));
      canopy.position.set(p.x, h + cr * 0.6, p.z);
      trackAdd(canopy);

      /* Second smaller canopy layer */
      var canopy2 = makeSphere(cr * 0.65, 5, 0x112a08);
      canopy2.position.set(
        p.x + (Math.random() - 0.5) * 1.2,
        h + cr * 1.1,
        p.z + (Math.random() - 0.5) * 1.2
      );
      trackAdd(canopy2);
    }
  }

  /* ─── Guards ─────────────────────────────────────────────────────────────── */

  function buildGuards() {
    _guards = [];
    var positions = [
      new THREE.Vector3(-15,  0,  15),
      new THREE.Vector3( 15,  0,  15),
      new THREE.Vector3(-18,  0, -20),
      new THREE.Vector3( 18,  0, -20),
      new THREE.Vector3(-10,  0,  40),
      new THREE.Vector3( 10,  0,  40),
      new THREE.Vector3(-28,  0,   5),
      new THREE.Vector3( 28,  0,   5),
      new THREE.Vector3(  0,  0,  -5),
      new THREE.Vector3( 22,  0, -45)
    ];

    for (var i = 0; i < positions.length; i++) {
      var g = new THREE.Group();
      g.position.copy(positions[i]);

      /* Body — jungle camo green */
      var body = makeBox(0.75, 1.7, 0.55, 0x2a4a1a);
      body.position.set(0, 0.85, 0);
      g.add(body);

      /* Head */
      var head = makeBox(0.6, 0.6, 0.6, 0xBB9966);
      head.position.set(0, 1.85, 0);
      g.add(head);

      /* Helmet */
      var helmet = makeBox(0.68, 0.3, 0.68, 0x1a3a0a);
      helmet.position.set(0, 2.1, 0);
      g.add(helmet);

      /* Rifle */
      var rifle = makeBox(0.12, 0.12, 1.1, 0x1a1a0a);
      rifle.position.set(0.5, 1.1, 0.6);
      g.add(rifle);

      /* Camo patches */
      var patch = makeBox(0.77, 0.4, 0.57, 0x1a2a08);
      patch.position.set(0, 1.1, 0);
      g.add(patch);

      trackAdd(g);

      _guards.push({
        group:       g,
        hp:          50,
        alive:       true,
        alert:       false,
        fireTimer:   1.5 + Math.random() * 2,
        wanderDir:   new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize(),
        wanderTimer: Math.random() * 4
      });
    }
  }

  /* ─── Player ─────────────────────────────────────────────────────────────── */

  function buildPlayer() {
    _playerGroup = new THREE.Group();
    _playerGroup.position.copy(_playerPos);

    var body = makeBox(0.7, 1.6, 0.5, 0x334422);
    body.position.set(0, 0.8, 0);
    _playerGroup.add(body);

    var head = makeBox(0.55, 0.55, 0.55, 0xBB9966);
    head.position.set(0, 1.75, 0);
    _playerGroup.add(head);

    var helmet = makeBox(0.6, 0.28, 0.6, 0x223311);
    helmet.position.set(0, 2.0, 0);
    _playerGroup.add(helmet);

    trackAdd(_playerGroup);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    var speed = 9;
    var dir   = new THREE.Vector3();

    if (_keys['w'] || _keys['W'] || _keys['ArrowUp'])    dir.z -= 1;
    if (_keys['s'] || _keys['S'] || _keys['ArrowDown'])  dir.z += 1;
    if (_keys['a'] || _keys['A'] || _keys['ArrowLeft'])  dir.x -= 1;
    if (_keys['d'] || _keys['D'] || _keys['ArrowRight']) dir.x += 1;

    if (dir.length() > 0) dir.normalize();

    /* Rotate movement by camera yaw */
    var camFwd = new THREE.Vector3();
    _camera.getWorldDirection(camFwd);
    var camYaw = Math.atan2(camFwd.x, camFwd.z);
    var cosY   = Math.cos(camYaw);
    var sinY   = Math.sin(camYaw);
    var mx     = dir.x * cosY + dir.z * sinY;
    var mz     = -dir.x * sinY + dir.z * cosY;
    dir.set(mx, 0, mz);

    _playerVel.lerp(dir.multiplyScalar(speed), dt * 10);
    _playerGroup.position.addScaledVector(_playerVel, dt);
    _playerGroup.position.y = 0;

    /* Camera follow */
    var desired = _playerGroup.position.clone().add(new THREE.Vector3(0, 14, 20));
    _camera.position.lerp(desired, dt * 6);
    _camera.lookAt(_playerGroup.position.clone().add(new THREE.Vector3(0, 1, 0)));

    /* Shoot cooldown */
    _shootCooldown = Math.max(0, _shootCooldown - dt);

    /* Check extraction if all objectives done */
    if (_aircraftDestroyed >= AIRCRAFT_TOTAL && _fuelDepotsBlown >= FUEL_DEPOT_TOTAL) {
      var extPos = new THREE.Vector3(0, 0, 88);
      if (_playerGroup.position.distanceTo(extPos) < 6) {
        endMissionSuccess();
      }
    }
  }

  function updateAircraft(dt) {
    for (var i = 0; i < _aircraft.length; i++) {
      var ac = _aircraft[i];
      if (ac.destroyed) continue;

      /* Spin propeller */
      if (ac.state === 'taxiing') {
        ac.prop.rotation.x += dt * 15;
      }

      /* Delay before this plane starts moving */
      if (ac.delayTimer > 0) {
        ac.delayTimer -= dt;
        continue;
      }

      if (ac.state === 'taxiing') {
        ac.group.position.z += ac.taxiSpeed * dt;
        ac.group.position.y = 0;

        if (ac.group.position.z >= ac.liftoffZ) {
          ac.state = 'airborne';
          showMessage('AIRCRAFT ESCAPED! Mission compromised!', 3000);
          /* Count as if destroyed for simplicity of mission tracking,
             but mark as a failure-nudge — plane escapes with drugs */
          ac.destroyed = true;
          _aircraftDestroyed++;
          updateHUD();
        }
      }
    }
  }

  function updateGuards(dt) {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;

      var dist = g.group.position.distanceTo(_playerGroup.position);

      /* Spot player within 22 units */
      if (dist < 22 && !g.alert) {
        g.alert = true;
      }

      if (g.alert) {
        /* Chase player */
        if (dist > 1.5) {
          var toPlayer = new THREE.Vector3().subVectors(_playerGroup.position, g.group.position);
          toPlayer.y = 0;
          toPlayer.normalize().multiplyScalar(4.5);
          g.group.position.addScaledVector(toPlayer, dt);
        }

        /* Shoot */
        g.fireTimer -= dt;
        if (g.fireTimer <= 0 && dist < 28) {
          spawnEnemyBullet(g.group.position.clone(), _playerGroup.position.clone());
          g.fireTimer = 1.2 + Math.random() * 1.5;
        }

      } else {
        /* Wander patrol */
        g.wanderTimer -= dt;
        if (g.wanderTimer <= 0) {
          g.wanderDir.set((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();
          g.wanderTimer = 2 + Math.random() * 3;
        }
        var wanderStep = g.wanderDir.clone().multiplyScalar(2 * dt);
        g.group.position.add(wanderStep);
      }

      g.group.position.y = 0;
    }
  }

  function updateBullets(dt) {
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
        var hitSomething = false;

        /* Hit aircraft */
        for (var ai = 0; ai < _aircraft.length && !hitSomething; ai++) {
          var ac = _aircraft[ai];
          if (ac.destroyed) continue;
          if (b.mesh.position.distanceTo(ac.group.position) < 5) {
            ac.hp -= 25;
            if (ac.hp <= 0) {
              destroyAircraft(ac);
            }
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            hitSomething = true;
          }
        }
        if (hitSomething) continue;

        /* Hit fuel depot */
        for (var fi = 0; fi < _fuelDepots.length && !hitSomething; fi++) {
          var fd = _fuelDepots[fi];
          if (fd.blown) continue;
          if (b.mesh.position.distanceTo(fd.group.position) < 7) {
            fd.hp -= 30;
            if (fd.hp <= 0) {
              blowFuelDepot(fd);
            }
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            hitSomething = true;
          }
        }
        if (hitSomething) continue;

        /* Hit guards */
        for (var gi = 0; gi < _guards.length && !hitSomething; gi++) {
          var guard = _guards[gi];
          if (!guard.alive) continue;
          if (b.mesh.position.distanceTo(guard.group.position) < 1.5) {
            guard.hp -= 35;
            guard.alert = true;
            if (guard.hp <= 0) {
              killGuard(guard);
            }
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            hitSomething = true;
          }
        }

      } else {
        /* Enemy bullet hits player */
        if (b.mesh.position.distanceTo(_playerGroup.position) < 1.2) {
          _playerHP -= 12;
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          if (_playerHP <= 0) {
            endMissionFail('Agent KIA — the cartel wins this round.');
          }
        }
      }
    }
  }

  function updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      if (ex.life <= 0) {
        _scene.remove(ex.group);
        _explosions.splice(i, 1);
        continue;
      }
      var ratio = ex.life / ex.maxLife;
      ex.group.scale.setScalar(1 + (1 - ratio) * 2.5);
      ex.group.children[0].material.opacity = ratio * 0.9;
      if (ex.group.children[1]) {
        ex.group.children[1].intensity = ratio * 8;
      }
    }
  }

  function updateRunwayLights(dt) {
    _runwayLightTime += dt;
    /* Blink every 0.6 seconds */
    var on = ((_runwayLightTime % 0.6) < 0.3);
    for (var i = 0; i < _runwayLightMeshes.length; i++) {
      _runwayLightMeshes[i].material.emissiveIntensity = on ? 1.0 : 0.1;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DESTRUCTION
  ══════════════════════════════════════════════════════════════════════════ */

  function destroyAircraft(ac) {
    ac.destroyed = true;
    ac.state = 'destroyed';
    spawnExplosion(ac.group.position.clone(), 3.5);
    ac.group.visible = false;
    _aircraftDestroyed++;
    updateHUD();

    if (_aircraftDestroyed >= AIRCRAFT_TOTAL) {
      showMessage('ALL AIRCRAFT DESTROYED! Reach extraction point (North end)!', 4000);
    } else {
      showMessage('Aircraft destroyed! ' + _aircraftDestroyed + '/' + AIRCRAFT_TOTAL, 2500);
    }
    checkWinCondition();
  }

  function blowFuelDepot(fd) {
    fd.blown = true;
    spawnExplosion(fd.group.position.clone(), 5);
    spawnExplosion(fd.group.position.clone().add(new THREE.Vector3(3, 0, 0)), 3.5);
    fd.group.visible = false;
    _fuelDepotsBlown++;
    updateHUD();

    if (_fuelDepotsBlown >= FUEL_DEPOT_TOTAL) {
      showMessage('ALL FUEL DEPOTS DESTROYED! No resupply!', 3000);
    } else {
      showMessage('Fuel depot blown! ' + _fuelDepotsBlown + '/' + FUEL_DEPOT_TOTAL, 2500);
    }
    checkWinCondition();
  }

  function killGuard(g) {
    g.alive = false;
    g.group.rotation.z = Math.PI / 2;
    g.group.position.y = 0.5;
  }

  function checkWinCondition() {
    if (_aircraftDestroyed >= AIRCRAFT_TOTAL && _fuelDepotsBlown >= FUEL_DEPOT_TOTAL) {
      showMessage('OBJECTIVES COMPLETE!\nReach extraction point (Green pad to the North)!', 5000);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SPAWN HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function spawnPlayerBullet() {
    if (!_active || _shootCooldown > 0) return;
    _shootCooldown = 0.12;

    var geo = new THREE.SphereGeometry(0.09, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFEE44 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(_playerGroup.position);
    mesh.position.y = 1.3;
    _scene.add(mesh);

    /* Direction from camera forward */
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    _bullets.push({ mesh: mesh, vel: dir.multiplyScalar(65), life: 2.5, owner: 'player' });
  }

  function spawnEnemyBullet(from, to) {
    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF3300 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    mesh.position.y = 1.3;
    _scene.add(mesh);

    var dir = new THREE.Vector3().subVectors(to, from);
    dir.y = 0;
    dir.normalize();
    dir.x += (Math.random() - 0.5) * 0.35;
    dir.z += (Math.random() - 0.5) * 0.35;
    dir.normalize();

    _bullets.push({ mesh: mesh, vel: dir.multiplyScalar(38), life: 2.2, owner: 'enemy' });
  }

  function spawnExplosion(pos, radius) {
    var g = new THREE.Group();
    g.position.copy(pos);

    var geo = new THREE.SphereGeometry(radius || 2.5, 8, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFF6600,
      transparent: true,
      opacity: 0.9
    });
    var mesh = new THREE.Mesh(geo, mat);
    g.add(mesh);

    var lt = new THREE.PointLight(0xFF6600, 8, 30 + (radius || 2.5) * 4);
    lt.position.set(0, 0, 0);
    g.add(lt);

    /* Inner core */
    var core = new THREE.Mesh(
      new THREE.SphereGeometry((radius || 2.5) * 0.5, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xFFDD00 })
    );
    g.add(core);

    _scene.add(g);
    _explosions.push({ group: g, life: 1.2, maxLife: 1.2 });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'jungleairstrip-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#44FF88',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.7)',
      'padding:7px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:1px',
      'white-space:nowrap',
      'text-shadow:0 0 8px #00FF44'
    ].join(';');
    document.body.appendChild(_hudEl);

    _msgEl = document.createElement('div');
    _msgEl.id = 'jungleairstrip-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#44FF88',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'text-align:center',
      'background:rgba(0,20,0,0.82)',
      'padding:18px 36px',
      'border-radius:8px',
      'pointer-events:none',
      'display:none',
      'z-index:910',
      'white-space:pre-line',
      'text-shadow:0 0 16px #00FF66',
      'border:1px solid #224422'
    ].join(';');
    document.body.appendChild(_msgEl);

    _vigEl = document.createElement('div');
    _vigEl.id = 'jungleairstrip-vig';
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
      'background:radial-gradient(ellipse at center,transparent 55%,rgba(180,0,0,0.9) 100%)'
    ].join(';');
    document.body.appendChild(_vigEl);
  }

  function updateHUD() {
    if (!_hudEl) return;
    var guardsAlive = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i].alive) guardsAlive++;
    }
    _hudEl.textContent =
      'AIRCRAFT DESTROYED: ' + _aircraftDestroyed + '/' + AIRCRAFT_TOTAL +
      '  |  FUEL DEPOTS BLOWN: ' + _fuelDepotsBlown + '/' + FUEL_DEPOT_TOTAL +
      '  |  GUARDS: ' + guardsAlive +
      '  |  HP: ' + Math.max(0, Math.ceil(_playerHP));
  }

  function showHUD() {
    if (_hudEl) _hudEl.style.display = 'block';
    updateHUD();
  }

  function showMessage(text, duration) {
    if (!_msgEl) return;
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    if (_msgTimer) clearTimeout(_msgTimer);
    if (duration) {
      _msgTimer = setTimeout(function () {
        if (_msgEl) _msgEl.style.display = 'none';
      }, duration);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MISSION END
  ══════════════════════════════════════════════════════════════════════════ */

  function endMissionSuccess() {
    if (_missionComplete || _missionFailed) return;
    _missionComplete = true;
    _active = false;
    showMessage('MISSION COMPLETE\nAirstrip neutralised — extraction successful!\nCartel supply line severed.', 0);
  }

  function endMissionFail(reason) {
    if (_missionComplete || _missionFailed) return;
    _missionFailed = true;
    _active = false;
    showMessage('MISSION FAILED\n' + reason, 0);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT
  ══════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* J then A activation sequence */
    if (e.key === 'j' || e.key === 'J') {
      _jPressTime = Date.now();
    }
    if ((e.key === 'a' || e.key === 'A') && _jPressTime > 0) {
      var elapsed = Date.now() - _jPressTime;
      if (elapsed <= _ACTIVATE_WINDOW) {
        _jPressTime = 0;
        if (!_active && !_missionComplete && !_missionFailed) {
          launchMission();
          return;
        } else if (_active || _missionComplete || _missionFailed) {
          /* Toggle off */
          if (_active) {
            _active = false;
            showMessage('JUNGLE AIRSTRIP — deactivated', 2000);
          }
          return;
        }
      }
    }

    if (!_active) return;

    if (e.key === ' ') e.preventDefault();
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) spawnPlayerBullet();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LAUNCH
  ══════════════════════════════════════════════════════════════════════════ */

  function launchMission() {
    _active          = false; /* prevent double-launch during build */
    _missionComplete = false;
    _missionFailed   = false;
    _aircraftDestroyed = 0;
    _fuelDepotsBlown   = 0;
    _playerHP        = 100;
    _playerPos.set(0, 0, 80);
    _playerVel.set(0, 0, 0);
    _shootCooldown   = 0;
    _bullets         = [];
    _explosions      = [];
    _guards          = [];
    _aircraft        = [];
    _fuelDepots      = [];
    _sceneObjects    = [];
    _runwayLightMeshes = [];
    _runwayLightTime   = 0;
    _playerGroup     = null;

    buildScene();
    buildHUD();
    showHUD();
    showMessage('JUNGLE AIRSTRIP\nDestroy aircraft before takeoff\nBlow up fuel depots\nReach extraction point (North)', 6000);

    _active = true;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    document.addEventListener('keydown',   onKeyDown);
    document.addEventListener('keyup',     onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
  }

  function update(delta) {
    if (!_active) return;

    var dt = delta || 0.016;

    updatePlayer(dt);
    updateAircraft(dt);
    updateGuards(dt);
    updateBullets(dt);
    updateExplosions(dt);
    updateRunwayLights(dt);
    updateHUD();

    /* Damage vignette */
    if (_vigEl) {
      var dmgRatio = Math.max(0, 1 - _playerHP / 100);
      _vigEl.style.opacity = String(dmgRatio * 0.9);
    }
  }

  function reset() {
    _active          = false;
    _missionComplete = false;
    _missionFailed   = false;

    /* Remove all tracked scene objects */
    for (var i = 0; i < _sceneObjects.length; i++) {
      if (_scene) _scene.remove(_sceneObjects[i]);
    }
    _sceneObjects = [];

    /* Remove loose bullet meshes */
    for (var bi = 0; bi < _bullets.length; bi++) {
      if (_scene) _scene.remove(_bullets[bi].mesh);
    }
    _bullets = [];

    /* Remove explosion groups */
    for (var ei = 0; ei < _explosions.length; ei++) {
      if (_scene) _scene.remove(_explosions[ei].group);
    }
    _explosions = [];

    /* Restore fog */
    if (_scene) _scene.fog = _prevFog;
    _prevFog = null;

    /* Reset state */
    _aircraft          = [];
    _fuelDepots        = [];
    _guards            = [];
    _runwayLightMeshes = [];
    _runwayLightTime   = 0;
    _aircraftDestroyed = 0;
    _fuelDepotsBlown   = 0;
    _playerGroup       = null;
    _playerHP          = 100;
    _playerPos.set(0, 0, 80);
    _playerVel.set(0, 0, 0);
    _shootCooldown     = 0;
    _jPressTime        = 0;
    _keys              = {};

    /* DOM cleanup */
    if (_hudEl)  { _hudEl.style.display  = 'none'; }
    if (_msgEl)  { _msgEl.style.display  = 'none'; }
    if (_vigEl)  { _vigEl.style.opacity  = '0';    }
    if (_msgTimer) { clearTimeout(_msgTimer); _msgTimer = null; }
  }

  return { init: init, update: update, reset: reset };

}());
