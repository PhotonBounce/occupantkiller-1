/* ───────────────────────────────────────────────────────────────────────────
   jungle-river.js — Mekong River patrol boat FPS game module

   THEME: Player commands patrol boat down the Mekong River, intercepting
   arms dealers and armed crews at river villages and floating markets.

   KEYBINDS:
     J then R (within 400ms)  — toggle jungle-river module HUD
     WASD                     — patrol boat movement
     SPACE                    — fire

   API: window.JungleRiver = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.JungleRiver = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var RIVER_WIDTH         = 40;
  var RIVER_LENGTH        = 300;
  var WATER_Y             = 0;
  var BOAT_SPEED          = 15;
  var BOAT_TURN_RATE      = 0.05;
  var ENEMY_FIRE_RATE     = 2.0;
  var ENEMY_SPEED         = 4;
  var SHIPMENT_GOAL       = 3;
  var RIPPLE_SPEED        = 2.0;
  var BOB_SPEED           = 1.5;
  var BIRD_SPEED          = 8;
  var KEYBIND_DELAY       = 400;  // ms for J+R

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene           = null;
  var _camera          = null;
  var _playerPos       = null;
  var _playerHealth    = null;
  var _initialized     = false;
  var _active          = false;
  var _sceneObjects    = [];  // track all added objects for reset()

  /* patrol boat (player) */
  var _boat = {
    group:      null,
    speedZ:     0,
    heading:    0,  // rotation around Y
    health:     100
  };

  /* HUD state */
  var _hudEl             = null;
  var _shipmentsDown     = 0;
  var _dealersDown       = 0;
  var _riverKm           = 0;
  var _lastKeyJ          = null;
  var _keybindActive     = false;

  /* river & environment */
  var _river = {
    mesh:    null,
    emissiveIntensity: 0.3
  };

  /* enemies */
  var _enemies = [];  // { group, pos, health, type, fireCooldown }
  var _villages = [];  // { pos, group }
  var _markets = [];  // { group, bobOffset }

  /* animated objects */
  var _birds = [];  // { group, time, pathArc }
  var _rippleTime = 0;
  var _projectiles = [];  // { mesh, dir, dist }

  /* ── helper: make color ───────────────────────────────────────────────── */
  function _makeColor(hex) {
    var color = new THREE.Color();
    color.setHex(hex);
    return color;
  }

  /* ── helper: clamp ────────────────────────────────────────────────────── */
  function _clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /* ── helper: random range ─────────────────────────────────────────────── */
  function _randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /* ── helper: random int ───────────────────────────────────────────────── */
  function _randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  /* ── helper: track object for reset ───────────────────────────────────── */
  function _track(obj) {
    if (obj) {
      _sceneObjects.push(obj);
    }
    return obj;
  }

  /* ── init: create river surface ───────────────────────────────────────── */
  function _createRiver() {
    var geo = new THREE.BoxGeometry(RIVER_WIDTH, 0.5, RIVER_LENGTH);
    var mat = new THREE.MeshStandardMaterial({
      color:    0x2d5a3d,  // murky green-brown
      emissive: 0x1a3a2a,
      emissiveIntensity: _river.emissiveIntensity,
      roughness: 0.4,
      metalness: 0.1
    });
    _river.mesh = new THREE.Mesh(geo, mat);
    _river.mesh.position.y = WATER_Y - 0.25;
    _river.material = mat;
    _scene.add(_river.mesh);
    _track(_river.mesh);
  }

  /* ── init: create patrol boat ─────────────────────────────────────────── */
  function _createPatrolBoat() {
    var group = new THREE.Group();
    group.position.set(0, WATER_Y + 0.5, -RIVER_LENGTH / 2 + 20);

    /* hull */
    var hullGeo = new THREE.BoxGeometry(3, 0.8, 8);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x1a472a });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0;
    group.add(hull);

    /* bridge (cabin) */
    var bridgeGeo = new THREE.BoxGeometry(2, 1.5, 2);
    var bridgeMat = new THREE.MeshStandardMaterial({ color: 0x0d2a15 });
    var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 1.2, 1);
    group.add(bridge);

    /* engine (cylinder) */
    var engGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    var engMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var engine = new THREE.Mesh(engGeo, engMat);
    engine.position.set(0, 0.8, -2);
    group.add(engine);

    _scene.add(group);
    _boat.group = group;
    _track(group);
  }

  /* ── init: create river villages on stilts ────────────────────────────── */
  function _createVillages() {
    var zPositions = [-80, -40, 20, 80, 140];
    zPositions.forEach(function (zPos) {
      var xPos = _randRange(-RIVER_WIDTH / 2 + 3, RIVER_WIDTH / 2 - 3);
      var villageGroup = new THREE.Group();
      villageGroup.position.set(xPos, WATER_Y, zPos);

      /* stilts (cylinders) */
      for (var i = 0; i < 2; i++) {
        var stiltGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
        var stiltMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e });
        var stilt = new THREE.Mesh(stiltGeo, stiltMat);
        stilt.position.set(i === 0 ? -0.6 : 0.6, 1.5, 0);
        villageGroup.add(stilt);
      }

      /* huts (stacked boxes) */
      for (var j = 0; j < 3; j++) {
        var hutGeo = new THREE.BoxGeometry(1.2, 1, 1.2);
        var hutMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47 });
        var hut = new THREE.Mesh(hutGeo, hutMat);
        hut.position.set(j * 1.5 - 1.5, 3 + j * 0.8, 0);
        villageGroup.add(hut);
      }

      _scene.add(villageGroup);
      _villages.push({ group: villageGroup, pos: new THREE.Vector3(xPos, WATER_Y, zPos) });
      _track(villageGroup);
    });
  }

  /* ── init: create floating markets ────────────────────────────────────── */
  function _createFloatingMarkets() {
    var zPositions = [-120, 0, 100];
    zPositions.forEach(function (zPos) {
      var xPos = _randRange(-RIVER_WIDTH / 2 + 4, RIVER_WIDTH / 2 - 4);
      var marketGroup = new THREE.Group();
      marketGroup.position.set(xPos, WATER_Y + 0.1, zPos);

      /* raft (large flat box) */
      var raftGeo = new THREE.BoxGeometry(6, 0.3, 5);
      var raftMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
      var raft = new THREE.Mesh(raftGeo, raftMat);
      raft.position.y = 0;
      marketGroup.add(raft);

      /* stalls (small boxes) */
      for (var i = 0; i < 4; i++) {
        var stallGeo = new THREE.BoxGeometry(1.2, 1.5, 1);
        var stallMat = new THREE.MeshStandardMaterial({ color: 0xd4af37 });
        var stall = new THREE.Mesh(stallGeo, stallMat);
        stall.position.set((i - 1.5) * 1.5, 1.2, 0);
        marketGroup.add(stall);
      }

      _scene.add(marketGroup);
      _markets.push({ group: marketGroup, bobOffset: Math.random() * Math.PI * 2 });
      _track(marketGroup);
    });
  }

  /* ── init: create mangrove trees ──────────────────────────────────────── */
  function _createMangroves() {
    var positions = [
      { x: -18, z: -100 },
      { x: 15, z: -50 },
      { x: -12, z: 50 },
      { x: 18, z: 120 },
      { x: -16, z: 180 }
    ];

    positions.forEach(function (pos) {
      var treeGroup = new THREE.Group();
      treeGroup.position.set(pos.x, WATER_Y, pos.z);

      /* trunk */
      var trunkGeo = new THREE.CylinderGeometry(0.6, 1, 8, 8);
      var trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 4;
      treeGroup.add(trunk);

      /* foliage clusters (hanging spheres) */
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 2; j++) {
          var foliageGeo = new THREE.SphereGeometry(0.8, 6, 6);
          var foliageMat = new THREE.MeshStandardMaterial({
            color: 0x2d5a3d,
            emissive: 0x1a3a2a,
            emissiveIntensity: 0.1
          });
          var foliage = new THREE.Mesh(foliageGeo, foliageMat);
          foliage.position.set((j - 0.5) * 2, 7 - i * 1.5, 0);
          treeGroup.add(foliage);
        }
      }

      _scene.add(treeGroup);
      _track(treeGroup);
    });
  }

  /* ── init: create arms crates (glowing red) ──────────────────────────── */
  function _createArmsCrates() {
    var cratePositions = [
      { pos: new THREE.Vector3(-12, WATER_Y + 0.5, -60), village: _villages[0] },
      { pos: new THREE.Vector3(10, WATER_Y + 0.5, 40), village: _villages[2] },
      { pos: new THREE.Vector3(-8, WATER_Y + 0.5, 150), village: _villages[4] }
    ];

    cratePositions.forEach(function (item) {
      var crateGroup = new THREE.Group();
      crateGroup.position.copy(item.pos);

      /* stack of 2x2x2 crates */
      for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
          var crateGeo = new THREE.BoxGeometry(1, 1, 1);
          var crateMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
          });
          var crate = new THREE.Mesh(crateGeo, crateMat);
          crate.position.set(i * 1.1 - 0.55, j * 1.1, 0);
          crateGroup.add(crate);
        }
      }

      _scene.add(crateGroup);
      _track(crateGroup);
    });
  }

  /* ── init: create river buoys ─────────────────────────────────────────── */
  function _createBuoys() {
    var buoyCount = 8;
    for (var i = 0; i < buoyCount; i++) {
      var zPos = -RIVER_LENGTH / 2 + 40 + i * (RIVER_LENGTH / buoyCount);
      var xPos = (i % 2 === 0) ? -RIVER_WIDTH / 2 + 2 : RIVER_WIDTH / 2 - 2;

      var buoyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
      var buoyMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
      var buoy = new THREE.Mesh(buoyGeo, buoyMat);
      buoy.position.set(xPos, WATER_Y + 0.4, zPos);
      _scene.add(buoy);
      _track(buoy);
    }
  }

  /* ── init: create enemy dealers at villages ────────────────────────────── */
  function _createEnemyDealers() {
    _villages.slice(0, 2).forEach(function (village, idx) {
      var enemyGroup = new THREE.Group();
      var offset = idx * 5;
      enemyGroup.position.copy(village.pos);
      enemyGroup.position.y = WATER_Y + 2;

      /* body (brown box for civilian) */
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0;
      enemyGroup.add(body);

      /* head (sphere) */
      var headGeo = new THREE.SphereGeometry(0.3, 6, 6);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xd9a882 });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.8;
      enemyGroup.add(head);

      _scene.add(enemyGroup);
      _enemies.push({
        group: enemyGroup,
        pos: new THREE.Vector3().copy(enemyGroup.position),
        health: 50,
        type: 'dealer',
        fireCooldown: 0
      });
      _track(enemyGroup);
    });
  }

  /* ── init: create armed junk boats ──────────────────────────────────────– */
  function _createJunkBoats() {
    var junkPositions = [60, 180];
    junkPositions.forEach(function (zPos) {
      var xPos = _randRange(-8, 8);
      var junkGroup = new THREE.Group();
      junkGroup.position.set(xPos, WATER_Y + 0.3, zPos);

      /* hull */
      var hullGeo = new THREE.BoxGeometry(4, 0.6, 6);
      var hullMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
      var hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.y = 0;
      junkGroup.add(hull);

      /* cabin */
      var cabinGeo = new THREE.BoxGeometry(2.5, 1.8, 2);
      var cabinMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      var cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.4, -1);
      junkGroup.add(cabin);

      /* crew (armed) */
      for (var i = 0; i < 2; i++) {
        var crewGroup = new THREE.Group();
        crewGroup.position.set((i - 0.5) * 1.5, 2.5, 0);

        var crewBodyGeo = new THREE.BoxGeometry(0.5, 1.2, 0.4);
        var crewMat = new THREE.MeshStandardMaterial({ color: 0x2d2117 });
        var crewBody = new THREE.Mesh(crewBodyGeo, crewMat);
        crewGroup.add(crewBody);

        var crewHeadGeo = new THREE.SphereGeometry(0.25, 6, 6);
        var crewHeadMat = new THREE.MeshStandardMaterial({ color: 0xc9a880 });
        var crewHead = new THREE.Mesh(crewHeadGeo, crewHeadMat);
        crewHead.position.y = 0.75;
        crewGroup.add(crewHead);

        junkGroup.add(crewGroup);
      }

      _scene.add(junkGroup);
      _enemies.push({
        group: junkGroup,
        pos: new THREE.Vector3().copy(junkGroup.position),
        health: 80,
        type: 'crew',
        fireCooldown: 0
      });
      _track(junkGroup);
    });
  }

  /* ── init: create flying birds ────────────────────────────────────────── */
  function _createBirds() {
    for (var i = 0; i < 3; i++) {
      var birdGroup = new THREE.Group();
      var startZ = -100 + i * 100;
      birdGroup.position.set(-15, 12, startZ);

      /* body (small box) */
      var bodyGeo = new THREE.BoxGeometry(0.3, 0.2, 0.6);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      birdGroup.add(body);

      /* head (small sphere) */
      var headGeo = new THREE.SphereGeometry(0.12, 4, 4);
      var headMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.z = 0.3;
      birdGroup.add(head);

      _scene.add(birdGroup);
      _birds.push({
        group: birdGroup,
        time: 0,
        pathArc: startZ
      });
      _track(birdGroup);
    }
  }

  /* ── init: create HUD ─────────────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'jungle-river-hud';
    _hudEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border: 2px solid #00ff00;
      pointer-events: none;
      z-index: 10001;
      display: none;
      white-space: pre-line;
      line-height: 1.6;
    `;
    document.body.appendChild(_hudEl);
  }

  /* ── init: setup keybinds ─────────────────────────────────────────────── */
  function _setupKeybinds() {
    document.addEventListener('keydown', function (e) {
      var now = Date.now();
      if (e.key.toLowerCase() === 'j') {
        if (_lastKeyJ && now - _lastKeyJ < KEYBIND_DELAY) {
          _lastKeyJ = null;
          e.preventDefault();
          return;  // waiting for R
        }
        _lastKeyJ = now;
      } else if (e.key.toLowerCase() === 'r' && _lastKeyJ && now - _lastKeyJ < KEYBIND_DELAY) {
        _lastKeyJ = null;
        _keybindActive = !_keybindActive;
        if (_hudEl) {
          _hudEl.style.display = _keybindActive ? 'block' : 'none';
        }
        e.preventDefault();
      }
    });
  }

  /* ── update: patrol boat movement ─────────────────────────────────────── */
  function _updateBoatMovement(delta) {
    if (!_boat.group) return;

    var keys = window._gameKeys || {};  // assume global key state

    /* forward/backward (Z axis) */
    if (keys['w'] || keys['W']) {
      _boat.speedZ = Math.min(_boat.speedZ + delta * 5, BOAT_SPEED);
    } else if (keys['s'] || keys['S']) {
      _boat.speedZ = Math.max(_boat.speedZ - delta * 5, -BOAT_SPEED / 2);
    } else {
      _boat.speedZ *= 0.95;
    }

    /* steering (heading) */
    if (keys['a'] || keys['A']) {
      _boat.heading += BOAT_TURN_RATE * delta;
    }
    if (keys['d'] || keys['D']) {
      _boat.heading -= BOAT_TURN_RATE * delta;
    }

    /* apply movement in boat's forward direction */
    var cos = Math.cos(_boat.heading);
    var sin = Math.sin(_boat.heading);
    _boat.group.position.z += _boat.speedZ * delta * cos;
    _boat.group.position.x += _boat.speedZ * delta * sin;

    /* clamp to river bounds */
    _boat.group.position.x = _clamp(
      _boat.group.position.x,
      -RIVER_WIDTH / 2 + 2,
      RIVER_WIDTH / 2 - 2
    );
    _boat.group.position.z = _clamp(
      _boat.group.position.z,
      -RIVER_LENGTH / 2,
      RIVER_LENGTH / 2
    );

    /* rotate boat */
    _boat.group.rotation.y = _boat.heading;

    /* update river km */
    _riverKm = (-_boat.group.position.z + RIVER_LENGTH / 2) / 100;
  }

  /* ── update: river ripples ────────────────────────────────────────────── */
  function _updateRipples(delta) {
    _rippleTime += delta * RIPPLE_SPEED;
    if (_river.material) {
      _river.material.emissiveIntensity = 0.3 + 0.15 * Math.sin(_rippleTime);
    }
  }

  /* ── update: floating markets bob ─────────────────────────────────────── */
  function _updateMarkets(delta) {
    _markets.forEach(function (market) {
      var bobAmount = 0.4 * Math.sin(_rippleTime + market.bobOffset);
      market.group.position.y = WATER_Y + 0.1 + bobAmount;
    });
  }

  /* ── update: flying birds ─────────────────────────────────────────────── */
  function _updateBirds(delta) {
    _birds.forEach(function (bird) {
      bird.time += delta;
      var t = bird.time % 30;  // loop every 30 seconds
      bird.group.position.z = bird.pathArc + t * BIRD_SPEED;
      bird.group.position.x = -15 + 8 * Math.sin(t * 0.2);
      bird.group.position.y = 12 + 2 * Math.sin(t * 0.5);
    });
  }

  /* ── update: enemy movement & fire ────────────────────────────────────── */
  function _updateEnemies(delta) {
    _enemies.forEach(function (enemy) {
      if (enemy.health <= 0) return;

      /* move toward boat */
      var dx = _boat.group.position.x - enemy.group.position.x;
      var dz = _boat.group.position.z - enemy.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var speed = ENEMY_SPEED;

      if (dist > 0.5) {
        var nx = dx / dist;
        var nz = dz / dist;
        enemy.group.position.x += nx * speed * delta;
        enemy.group.position.z += nz * speed * delta;
      }

      /* fire at boat */
      enemy.fireCooldown -= delta;
      if (enemy.fireCooldown <= 0 && dist < 30) {
        enemy.fireCooldown = ENEMY_FIRE_RATE;
        /* would create projectile here */
      }
    });
  }

  /* ── update: HUD display ──────────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl || !_keybindActive) return;

    var text = 'JUNGLE RIVER PATROL\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n';
    text += 'SHIPMENTS INTERCEPTED: ' + _shipmentsDown + '/' + SHIPMENT_GOAL + '\n';
    text += 'DEALERS DOWN: ' + _dealersDown + '\n';
    text += 'RIVER KM: ' + _riverKm.toFixed(1) + '\n';
    text += 'BOAT HEALTH: ' + Math.round(_boat.health) + '/100\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n';
    text += 'WASD: Move | SPACE: Fire\n';
    text += 'J+R: Toggle HUD\n';

    _hudEl.textContent = text;
  }

  /* ── public: init ─────────────────────────────────────────────────────── */
  function init(scene, camera) {
    if (_initialized) return;
    _scene = scene;
    _camera = camera;

    /* add fog */
    scene.fog = new THREE.Fog(0x4a5f4f, 100, 250);

    _createRiver();
    _createPatrolBoat();
    _createVillages();
    _createFloatingMarkets();
    _createMangroves();
    _createArmsCrates();
    _createBuoys();
    _createEnemyDealers();
    _createJunkBoats();
    _createBirds();
    _createHUD();
    _setupKeybinds();

    _initialized = true;
    _active = true;
  }

  /* ── public: update ───────────────────────────────────────────────────── */
  function update(delta) {
    if (!_initialized || !_active) return;

    _updateBoatMovement(delta);
    _updateRipples(delta);
    _updateMarkets(delta);
    _updateBirds(delta);
    _updateEnemies(delta);
    _updateHUD();
  }

  /* ── public: reset ────────────────────────────────────────────────────── */
  function reset() {
    /* remove all tracked objects */
    _sceneObjects.forEach(function (obj) {
      if (obj && obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj && obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function (mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });
    _sceneObjects = [];

    /* hide HUD */
    if (_hudEl) {
      _hudEl.style.display = 'none';
    }

    /* reset state */
    _boat = {
      group: null,
      speedZ: 0,
      heading: 0,
      health: 100
    };
    _shipmentsDown = 0;
    _dealersDown = 0;
    _riverKm = 0;
    _enemies = [];
    _villages = [];
    _markets = [];
    _birds = [];
    _rippleTime = 0;
    _projectiles = [];
    _river = { mesh: null, emissiveIntensity: 0.3 };

    _initialized = false;
    _active = false;
  }

  /* ── return API ───────────────────────────────────────────────────────── */
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
