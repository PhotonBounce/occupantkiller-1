// chemical-plant.js — Chemical plant destruction FPS module
// IIFE pattern, all var (no let/const), pure browser JS, Three.js as global THREE
//
// Activation: C+P simultaneous keypress (both keys within 400ms)
//
// Public API:
//   ChemicalPlant.init(scene, camera)
//   ChemicalPlant.update(delta)
//   ChemicalPlant.reset()

window.ChemicalPlant = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants

  // Activation
  var ACTIVATION_WINDOW        = 400;        // ms

  // Scene
  var FOG_COLOR                = 0x7a8f2f;   // sickly yellow-green
  var FOG_NEAR                 = 5;
  var FOG_FAR                  = 80;
  var AMBIENT_INTENSITY        = 0.3;

  // Facility layout
  var FACILITY_ORIGIN_X        = 0;
  var FACILITY_ORIGIN_Z        = 0;

  // Storage tanks (large cylinders)
  var TANK_RADIUS              = 4;
  var TANK_HEIGHT              = 15;
  var TANK_COLOR               = 0x445544;
  var TANK_1_X                 = -20;
  var TANK_1_Z                 = -15;
  var TANK_2_X                 = -20;
  var TANK_2_Z                 = 15;
  var TANK_3_X                 = 20;
  var TANK_3_Z                 = -15;
  var TANK_4_X                 = 20;
  var TANK_4_Z                 = 15;

  // Mixing vats
  var VAT_RADIUS               = 2.5;
  var VAT_HEIGHT               = 8;
  var VAT_COLOR                = 0x334444;
  var VAT_1_X                  = 0;
  var VAT_1_Z                  = 0;
  var VAT_2_X                  = -10;
  var VAT_2_Z                  = 5;
  var VAT_3_X                  = 10;
  var VAT_3_Z                  = 5;

  // Pipe networks
  var PIPE_RADIUS              = 0.3;
  var PIPE_COLOR               = 0x667766;

  // Safety shower stations
  var SHOWER_BOX_W             = 1.5;
  var SHOWER_BOX_H             = 2.5;
  var SHOWER_BOX_D             = 1.5;
  var SHOWER_POLE_R            = 0.15;
  var SHOWER_POLE_H            = 3.5;
  var SHOWER_COLOR             = 0x555555;
  var SHOWER_1_X               = -30;
  var SHOWER_1_Z               = 0;
  var SHOWER_2_X               = 30;
  var SHOWER_2_Z               = 0;

  // Laboratory benches
  var BENCH_W                  = 4;
  var BENCH_H                  = 0.8;
  var BENCH_D                  = 2;
  var BENCH_COLOR              = 0x445533;
  var BENCH_1_X                = -12;
  var BENCH_1_Z                = -20;
  var BENCH_2_X                = 12;
  var BENCH_2_Z                = -20;

  // Containment room (sealed box with viewport)
  var CONTAINMENT_W            = 16;
  var CONTAINMENT_H            = 10;
  var CONTAINMENT_D            = 12;
  var CONTAINMENT_COLOR        = 0x335533;
  var CONTAINMENT_X            = 0;
  var CONTAINMENT_Z            = 25;

  // Exhaust chimney stacks
  var CHIMNEY_RADIUS           = 0.8;
  var CHIMNEY_HEIGHT           = 20;
  var CHIMNEY_COLOR            = 0x556655;
  var CHIMNEY_1_X              = -25;
  var CHIMNEY_1_Z              = 30;
  var CHIMNEY_2_X              = 25;
  var CHIMNEY_2_Z              = 30;

  // Hazmat technician
  var TECH_COUNT               = 8;
  var TECH_COLOR               = 0x226633;
  var TECH_HEAD_COLOR          = 0x334433;
  var TECH_VISOR_COLOR         = 0x3388ff;
  var TECH_MOVE_SPEED          = 1.5;
  var TECH_DETECT_RANGE        = 10;
  var TECH_HP                  = 30;

  // Security guards
  var GUARD_COUNT              = 6;
  var GUARD_COLOR              = 0x334466;
  var GUARD_MOVE_SPEED         = 2.2;
  var GUARD_DETECT_RANGE       = 12;
  var GUARD_HP                 = 50;

  // Player
  var PLAYER_HEIGHT            = 1.7;
  var EXPOSURE_RANGE           = 8;      // distance from vat where exposure increases

  // HUD
  var SYNTHESIS_TARGETS        = 4;      // number of tanks to destroy

  // Exposure meter
  var MAX_EXPOSURE             = 100;
  var EXPOSURE_RATE            = 20;     // per second near vat

  // ─────────────────────────────────────────────── state

  var _active                  = false;
  var _scene                   = null;
  var _camera                  = null;
  var _keyPressLog             = [];      // log of recent key presses
  var _allObjects              = [];      // all scene objects to clean up in reset()

  // HUD state
  var _tankCount               = 0;
  var _guardCount              = 0;
  var _exposureLevel           = 0;

  // Enemies
  var _technicians             = [];
  var _guards                  = [];

  // Tanks (destruction targets)
  var _tanks                   = [];

  // Animated objects
  var _animatedObjects         = [];

  // Chimneys (for smoke emission)
  var _chimneys                = [];

  // ─────────────────────────────────────────────── helper functions

  function _makeMat(color) {
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.6
    });
  }

  function _makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeCylinder(rTop, rBot, h, color, x, y, z, segs) {
    segs = segs || 16;
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeCone(r, h, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, 16);
    var mat = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 16, 16);
    var mat = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Build cylindrical pipe between two points
  function _buildPipe(scene, x1, y1, z1, x2, y2, z2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    var pipe = _makeCylinder(PIPE_RADIUS, PIPE_RADIUS, len, PIPE_COLOR, 0, 0, 0);
    pipe.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);

    // Rotate to align with endpoints
    var quat = new THREE.Quaternion();
    var dir = new THREE.Vector3(dx, dy, dz).normalize();
    var axis = new THREE.Vector3(0, 1, 0).cross(dir);
    if (axis.length() > 0.001) {
      var angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(dir));
      quat.setFromAxisAngle(axis.normalize(), angle);
      pipe.quaternion.copy(quat);
    }

    scene.add(pipe);
    _allObjects.push(pipe);
    return pipe;
  }

  // ─────────────────────────────────────────────── chemical plant construction

  function _buildPlant(scene) {
    // Ground plane
    var groundGeo = new THREE.BoxGeometry(100, 0.3, 100);
    var groundMat = _makeMat(0x334433);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.15, 0);
    scene.add(ground);
    _allObjects.push(ground);

    // Storage tanks (synthesis targets)
    var tanks = [
      { x: TANK_1_X, z: TANK_1_Z, label: 'Tank A' },
      { x: TANK_2_X, z: TANK_2_Z, label: 'Tank B' },
      { x: TANK_3_X, z: TANK_3_Z, label: 'Tank C' },
      { x: TANK_4_X, z: TANK_4_Z, label: 'Tank D' }
    ];
    var ti;
    for (ti = 0; ti < tanks.length; ti++) {
      var tank = _makeCylinder(TANK_RADIUS, TANK_RADIUS, TANK_HEIGHT, TANK_COLOR, tanks[ti].x, TANK_HEIGHT / 2, tanks[ti].z, 20);
      tank.userData = {
        isDestructible: true,
        tankIndex: ti,
        destroyed: false
      };
      scene.add(tank);
      _allObjects.push(tank);
      _tanks.push({
        mesh: tank,
        destroyed: false,
        index: ti
      });
    }

    // Mixing vats with glowing reaction
    var vats = [
      { x: VAT_1_X, z: VAT_1_Z },
      { x: VAT_2_X, z: VAT_2_Z },
      { x: VAT_3_X, z: VAT_3_Z }
    ];
    var vi;
    for (vi = 0; vi < vats.length; vi++) {
      var vat = _makeCylinder(VAT_RADIUS, VAT_RADIUS, VAT_HEIGHT, VAT_COLOR, vats[vi].x, VAT_HEIGHT / 2, vats[vi].z);
      vat.userData = {
        isVat: true,
        vatIndex: vi
      };
      scene.add(vat);
      _allObjects.push(vat);

      // Glow light for vat
      var vatLight = new THREE.PointLight(0x88ff44, 0.8, 10);
      vatLight.position.set(vats[vi].x, VAT_HEIGHT / 2, vats[vi].z);
      scene.add(vatLight);
      _allObjects.push(vatLight);

      _animatedObjects.push({
        type: 'vat',
        mesh: vat,
        light: vatLight,
        huePhase: Math.random() * Math.PI * 2
      });
    }

    // Pipe networks connecting tanks to vats
    _buildPipe(scene, TANK_1_X, TANK_HEIGHT, TANK_1_Z, VAT_1_X, VAT_HEIGHT, VAT_1_Z);
    _buildPipe(scene, TANK_2_X, TANK_HEIGHT, TANK_2_Z, VAT_1_X, VAT_HEIGHT, VAT_1_Z);
    _buildPipe(scene, TANK_3_X, TANK_HEIGHT, TANK_3_Z, VAT_1_X, VAT_HEIGHT, VAT_1_Z);
    _buildPipe(scene, TANK_4_X, TANK_HEIGHT, TANK_4_Z, VAT_1_X, VAT_HEIGHT, VAT_1_Z);

    // Condensation drips from pipes
    var condensationPoints = [
      { x: (TANK_1_X + VAT_1_X) / 2, z: (TANK_1_Z + VAT_1_Z) / 2 },
      { x: (TANK_3_X + VAT_1_X) / 2, z: (TANK_3_Z + VAT_1_Z) / 2 }
    ];
    var ci;
    for (ci = 0; ci < condensationPoints.length; ci++) {
      _animatedObjects.push({
        type: 'condensation',
        x: condensationPoints[ci].x,
        z: condensationPoints[ci].z,
        y: 6,
        dropVelocity: -3,
        spawnTime: 0,
        spawnInterval: 0.5
      });
    }

    // Safety shower stations
    var showers = [
      { x: SHOWER_1_X, z: SHOWER_1_Z },
      { x: SHOWER_2_X, z: SHOWER_2_Z }
    ];
    var si;
    for (si = 0; si < showers.length; si++) {
      var showerBase = _makeBox(SHOWER_BOX_W, SHOWER_BOX_H, SHOWER_BOX_D, SHOWER_COLOR, showers[si].x, SHOWER_BOX_H / 2, showers[si].z);
      scene.add(showerBase);
      _allObjects.push(showerBase);

      var showerPole = _makeCylinder(SHOWER_POLE_R, SHOWER_POLE_R, SHOWER_POLE_H, 0x888888, showers[si].x, SHOWER_BOX_H + SHOWER_POLE_H / 2, showers[si].z);
      scene.add(showerPole);
      _allObjects.push(showerPole);

      var showerHead = _makeSphere(0.4, 0x999999, showers[si].x, SHOWER_BOX_H + SHOWER_POLE_H + 0.3, showers[si].z);
      scene.add(showerHead);
      _allObjects.push(showerHead);
    }

    // Laboratory benches with equipment
    var benches = [
      { x: BENCH_1_X, z: BENCH_1_Z },
      { x: BENCH_2_X, z: BENCH_2_Z }
    ];
    var bi;
    for (bi = 0; bi < benches.length; bi++) {
      var bench = _makeBox(BENCH_W, BENCH_H, BENCH_D, BENCH_COLOR, benches[bi].x, BENCH_H / 2, benches[bi].z);
      scene.add(bench);
      _allObjects.push(bench);

      // Small equipment on benches
      var eq1 = _makeCylinder(0.3, 0.3, 0.8, 0x556655, benches[bi].x - 1, BENCH_H + 0.4, benches[bi].z);
      scene.add(eq1);
      _allObjects.push(eq1);

      var eq2 = _makeBox(0.5, 0.6, 0.4, 0x556655, benches[bi].x + 1, BENCH_H + 0.3, benches[bi].z);
      scene.add(eq2);
      _allObjects.push(eq2);
    }

    // Containment room (sealed box with viewport)
    var containmentBox = _makeBox(CONTAINMENT_W, CONTAINMENT_H, CONTAINMENT_D, CONTAINMENT_COLOR, CONTAINMENT_X, CONTAINMENT_H / 2, CONTAINMENT_Z);
    scene.add(containmentBox);
    _allObjects.push(containmentBox);

    // Viewport on containment room
    var viewport = _makeBox(4, 3, 0.2, 0x3388ff, CONTAINMENT_X - CONTAINMENT_W / 2 + 0.2, CONTAINMENT_H / 2, CONTAINMENT_Z);
    viewport.userData.isViewport = true;
    scene.add(viewport);
    _allObjects.push(viewport);

    // Exhaust chimney stacks
    var chimneys = [
      { x: CHIMNEY_1_X, z: CHIMNEY_1_Z },
      { x: CHIMNEY_2_X, z: CHIMNEY_2_Z }
    ];
    var chii;
    for (chii = 0; chii < chimneys.length; chii++) {
      var chimney = _makeCylinder(CHIMNEY_RADIUS, CHIMNEY_RADIUS, CHIMNEY_HEIGHT, CHIMNEY_COLOR, chimneys[chii].x, CHIMNEY_HEIGHT / 2, chimneys[chii].z);
      scene.add(chimney);
      _allObjects.push(chimney);

      _chimneys.push({
        mesh: chimney,
        x: chimneys[chii].x,
        z: chimneys[chii].z,
        smokeParticles: []
      });
    }

    // Ambient facility lights
    var facilityLights = [
      [0, 8, 0],
      [TANK_1_X, 12, TANK_1_Z],
      [TANK_3_X, 12, TANK_3_Z]
    ];
    var fli;
    for (fli = 0; fli < facilityLights.length; fli++) {
      var fl = new THREE.PointLight(0xdddd88, 0.6, 30);
      fl.position.set(facilityLights[fli][0], facilityLights[fli][1], facilityLights[fli][2]);
      scene.add(fl);
      _allObjects.push(fl);
    }

    // Chemical fog
    scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
    scene.background = new THREE.Color(FOG_COLOR);
  }

  // Build hazmat technician mesh
  function _buildTechMesh(color) {
    var root = new THREE.Object3D();

    // Body suit
    var body = _makeBox(0.5, 1.0, 0.35, color, 0, 0.5, 0);
    root.add(body);

    // Helmet (sphere with visor)
    var helmet = _makeSphere(0.35, color, 0, 1.3, 0);
    root.add(helmet);

    // Visor
    var visor = _makeBox(0.4, 0.2, 0.1, TECH_VISOR_COLOR, 0, 1.4, 0.25);
    root.add(visor);

    // Arms
    var larm = _makeBox(0.18, 0.7, 0.15, color, -0.35, 0.5, 0);
    root.add(larm);

    var rarm = _makeBox(0.18, 0.7, 0.15, color, 0.35, 0.5, 0);
    root.add(rarm);

    // Legs
    var lleg = _makeBox(0.2, 0.8, 0.2, color, -0.18, -0.4, 0);
    root.add(lleg);

    var rleg = _makeBox(0.2, 0.8, 0.2, color, 0.18, -0.4, 0);
    root.add(rleg);

    return root;
  }

  // Build security guard mesh
  function _buildGuardMesh(color) {
    var root = new THREE.Object3D();

    // Body
    var body = _makeBox(0.6, 1.0, 0.4, color, 0, 0.5, 0);
    root.add(body);

    // Head
    var head = _makeSphere(0.28, 0xccaa88, 0, 1.25, 0);
    root.add(head);

    // Arms
    var larm = _makeBox(0.2, 0.7, 0.2, color, -0.4, 0.5, 0);
    root.add(larm);

    var rarm = _makeBox(0.2, 0.7, 0.2, color, 0.4, 0.5, 0);
    root.add(rarm);

    // Legs
    var lleg = _makeBox(0.22, 0.8, 0.22, 0x222233, -0.18, -0.4, 0);
    root.add(lleg);

    var rleg = _makeBox(0.22, 0.8, 0.22, 0x222233, 0.18, -0.4, 0);
    root.add(rleg);

    return root;
  }

  // Spawn technician
  function _spawnTechnician(scene, x, z) {
    var mesh = _buildTechMesh(TECH_COLOR);
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    _allObjects.push(mesh);

    var tech = {
      mesh: mesh,
      hp: TECH_HP,
      alive: true,
      pos: new THREE.Vector3(x, 0, z),
      target: new THREE.Vector3(x, 0, z),
      moveSpeed: TECH_MOVE_SPEED,
      state: 'patrol',
      patrolDir: Math.random() * Math.PI * 2
    };

    _technicians.push(tech);
    return tech;
  }

  // Spawn guard
  function _spawnGuard(scene, x, z) {
    var mesh = _buildGuardMesh(GUARD_COLOR);
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    _allObjects.push(mesh);

    var guard = {
      mesh: mesh,
      hp: GUARD_HP,
      alive: true,
      pos: new THREE.Vector3(x, 0, z),
      target: new THREE.Vector3(x, 0, z),
      moveSpeed: GUARD_MOVE_SPEED,
      state: 'patrol',
      patrolDir: Math.random() * Math.PI * 2
    };

    _guards.push(guard);
    return guard;
  }

  // Spawn all enemies
  function _spawnEnemies(scene) {
    // Technicians at various locations
    var techPositions = [
      [TANK_1_X, TANK_1_Z],
      [TANK_2_X, TANK_2_Z],
      [TANK_3_X, TANK_3_Z],
      [VAT_1_X, VAT_1_Z - 3],
      [BENCH_1_X, BENCH_1_Z + 3],
      [BENCH_2_X, BENCH_2_Z + 3],
      [CONTAINMENT_X - 5, CONTAINMENT_Z],
      [CONTAINMENT_X + 5, CONTAINMENT_Z]
    ];
    var ti;
    for (ti = 0; ti < techPositions.length; ti++) {
      _spawnTechnician(scene, techPositions[ti][0], techPositions[ti][1]);
    }

    // Security guards at perimeter and key points
    var guardPositions = [
      [-40, 0],
      [40, 0],
      [0, -30],
      [-25, 20],
      [25, 20],
      [0, 35]
    ];
    var gi;
    for (gi = 0; gi < guardPositions.length; gi++) {
      _spawnGuard(scene, guardPositions[gi][0], guardPositions[gi][1]);
    }
  }

  // ─────────────────────────────────────────────── input handling

  function _onKeyDown(evt) {
    var key = evt.key.toUpperCase();
    var now = Date.now();

    // Clean old keypresses (older than ACTIVATION_WINDOW)
    _keyPressLog = _keyPressLog.filter(function(entry) {
      return (now - entry.time) < ACTIVATION_WINDOW;
    });

    // Add new key
    _keyPressLog.push({ key: key, time: now });

    // Check for C+P sequence
    var keys = _keyPressLog.map(function(entry) { return entry.key; });
    if (keys.indexOf('C') >= 0 && keys.indexOf('P') >= 0) {
      _toggleActive();
      _keyPressLog = [];
    }
  }

  function _toggleActive() {
    _active = !_active;
    if (typeof window.gameHUD !== 'undefined') {
      window.gameHUD.notify(_active ? 'CHEMICAL PLANT ACTIVE' : 'CHEMICAL PLANT INACTIVE');
    }
  }

  // ─────────────────────────────────────────────── HUD updates

  function _updateHUD() {
    if (typeof window.gameHUD !== 'undefined') {
      var statusText = 'SYNTHESIS TANKS DESTROYED: ' + _tankCount + '/' + SYNTHESIS_TARGETS +
                       ' | EXPOSURE LEVEL: ' + Math.floor(_exposureLevel) + '%' +
                       ' | GUARDS DOWN: ' + _guardCount;
      window.gameHUD.setStatus(statusText);
    }
  }

  // ─────────────────────────────────────────────── update loop

  function _updateTanks(delta) {
    var ti;
    for (ti = 0; ti < _tanks.length; ti++) {
      var tank = _tanks[ti];
      if (!tank.destroyed) {
        // Check if tank has been destroyed (health <= 0 or removed from scene)
        if (!_scene.children.includes(tank.mesh)) {
          tank.destroyed = true;
          _tankCount = Math.min(_tankCount + 1, SYNTHESIS_TARGETS);
        }
      }
    }
  }

  function _updateEnemies(delta) {
    // Update technicians
    var ti;
    for (ti = 0; ti < _technicians.length; ti++) {
      var tech = _technicians[ti];
      if (tech.alive) {
        // Patrol behavior
        tech.target.x += Math.cos(tech.patrolDir) * tech.moveSpeed * delta;
        tech.target.z += Math.sin(tech.patrolDir) * tech.moveSpeed * delta;

        // Random direction changes
        if (Math.random() < 0.02) {
          tech.patrolDir += (Math.random() - 0.5) * 1.5;
        }

        // Update position (lerp)
        tech.pos.lerp(tech.target, 0.1);
        tech.mesh.position.copy(tech.pos);
      }
    }

    // Update guards
    var gi;
    for (gi = 0; gi < _guards.length; gi++) {
      var guard = _guards[gi];
      if (guard.alive) {
        // Patrol behavior
        guard.target.x += Math.cos(guard.patrolDir) * guard.moveSpeed * delta;
        guard.target.z += Math.sin(guard.patrolDir) * guard.moveSpeed * delta;

        // Random direction changes
        if (Math.random() < 0.015) {
          guard.patrolDir += (Math.random() - 0.5) * 1.2;
        }

        // Update position
        guard.pos.lerp(guard.target, 0.12);
        guard.mesh.position.copy(guard.pos);
      }
    }
  }

  function _updateAnimations(delta) {
    var ai;
    for (ai = 0; ai < _animatedObjects.length; ai++) {
      var obj = _animatedObjects[ai];

      if (obj.type === 'vat') {
        // Cycle emissive color through green-yellow
        obj.huePhase += delta * 1.5;
        var hue = Math.sin(obj.huePhase) * 0.5 + 0.5;
        var color = new THREE.Color();
        color.setHSL(0.25 + hue * 0.15, 0.9, 0.4);
        obj.mesh.material.emissive.copy(color);
        obj.light.color.copy(color);
      } else if (obj.type === 'condensation') {
        // Spawn and animate falling water drops
        obj.spawnTime += delta;
        if (obj.spawnTime >= obj.spawnInterval) {
          // Create new drop
          var drop = _makeSphere(0.08, 0x88ccff, obj.x, obj.y, obj.z);
          _scene.add(drop);
          _allObjects.push(drop);

          obj.dropParticles = obj.dropParticles || [];
          obj.dropParticles.push({
            mesh: drop,
            y: obj.y,
            vy: obj.dropVelocity
          });
          obj.spawnTime = 0;
        }

        // Update existing drops
        if (obj.dropParticles) {
          var di = obj.dropParticles.length - 1;
          while (di >= 0) {
            var dp = obj.dropParticles[di];
            dp.vy += 9.8 * delta;
            dp.y += dp.vy * delta;
            dp.mesh.position.y = dp.y;

            if (dp.y < 0) {
              _scene.remove(dp.mesh);
              var idx = _allObjects.indexOf(dp.mesh);
              if (idx >= 0) _allObjects.splice(idx, 1);
              obj.dropParticles.splice(di, 1);
            }
            di--;
          }
        }
      }
    }

    // Update chimney smoke
    var chi;
    for (chi = 0; chi < _chimneys.length; chi++) {
      var chimney = _chimneys[chi];

      // Emit smoke puffs
      if (!chimney.smokeCounter) chimney.smokeCounter = 0;
      chimney.smokeCounter += delta;
      if (chimney.smokeCounter > 0.3) {
        var smoke = _makeSphere(0.4, 0x8899aa, chimney.x + (Math.random() - 0.5) * 0.8, CHIMNEY_HEIGHT + 1, chimney.z + (Math.random() - 0.5) * 0.8);
        smoke.userData.isSmoke = true;
        smoke.userData.birthTime = Date.now();
        smoke.material.transparent = true;
        _scene.add(smoke);
        _allObjects.push(smoke);
        chimney.smokeParticles.push(smoke);
        chimney.smokeCounter = 0;
      }

      // Update smoke particles
      var si = chimney.smokeParticles.length - 1;
      while (si >= 0) {
        var sp = chimney.smokeParticles[si];
        var age = (Date.now() - sp.userData.birthTime) / 1000;
        sp.position.y += delta * 2;
        sp.material.opacity = Math.max(0, 1 - age * 2);
        if (age > 2) {
          _scene.remove(sp);
          var idx = _allObjects.indexOf(sp);
          if (idx >= 0) _allObjects.splice(idx, 1);
          chimney.smokeParticles.splice(si, 1);
        }
        si--;
      }
    }
  }

  function _updateExposure(delta) {
    // Calculate exposure based on proximity to vats
    _exposureLevel = Math.max(0, _exposureLevel - delta * 5); // natural decrease

    var vi;
    for (vi = 0; vi < _animatedObjects.length; vi++) {
      var obj = _animatedObjects[vi];
      if (obj.type === 'vat' && _camera) {
        var dist = _camera.position.distanceTo(obj.mesh.position);
        if (dist < EXPOSURE_RANGE) {
          var exposure = EXPOSURE_RATE * (1 - dist / EXPOSURE_RANGE) * delta;
          _exposureLevel = Math.min(MAX_EXPOSURE, _exposureLevel + exposure);
        }
      }
    }

    _updateHUD();
  }

  // ─────────────────────────────────────────────── public API

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;

    // Ambient light
    var ambLight = new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY);
    scene.add(ambLight);
    _allObjects.push(ambLight);

    // Directional light
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(30, 40, 30);
    scene.add(dirLight);
    _allObjects.push(dirLight);

    // Build the plant
    _buildPlant(scene);

    // Spawn enemies
    _spawnEnemies(scene);

    // Input handler
    document.addEventListener('keydown', _onKeyDown);

    return {
      isActive: function() { return _active; },
      getTankCount: function() { return _tankCount; },
      getExposure: function() { return Math.floor(_exposureLevel); }
    };
  }

  function update(delta) {
    if (!_active) return;

    _updateTanks(delta);
    _updateEnemies(delta);
    _updateAnimations(delta);
    _updateExposure(delta);
  }

  function reset() {
    _active = false;
    _tankCount = 0;
    _guardCount = 0;
    _exposureLevel = 0;
    _technicians = [];
    _guards = [];
    _tanks = [];
    _animatedObjects = [];
    _chimneys = [];

    // Remove all objects from scene
    var oi;
    for (oi = _allObjects.length - 1; oi >= 0; oi--) {
      var obj = _allObjects[oi];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
    _allObjects = [];

    // Remove fog
    _scene.fog = null;
    _scene.background = null;

    // Remove input listener
    document.removeEventListener('keydown', _onKeyDown);
  }

  // Return public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
