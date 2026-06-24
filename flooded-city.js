// ============================================================
//  flooded-city.js — Post-Apocalyptic Flooded City Module
//  Activation: F+C simultaneous keypress (both keys within 400ms)
//  Features:
//    1. Post-apocalyptic flooded city environment with water
//    2. Partially submerged buildings with blue fog at water level
//    3. Water surface with ripple animations
//    4. Makeshift bridges between rooftops
//    5. Speedboat with gentle rocking animation
//    6. Water tower with cylinder tank
//    7. Floating debris piles and salvage supplies
//    8. Water pirates as enemies
//    9. HUD: SURVIVORS FOUND: N/4 | PIRATES DOWN: N | WATER LEVEL: RISING
//  Public API: init, update, reset
// ============================================================
window.FloodedCity = (function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────
  var ACTIVATION_WINDOW      = 400;   // ms between F and C keypresses
  var MAP_RADIUS             = 100;
  var WATER_LEVEL            = 15;    // height of water surface

  var NUM_SURVIVORS          = 4;
  var NUM_PIRATES            = 6;
  var NUM_DEBRIS             = 5;
  var NUM_SUPPLIES           = 3;

  var PIRATE_DETECT_RANGE    = 12;
  var PIRATE_ATTACK_RANGE    = 10;
  var PIRATE_PATROL_SPEED    = 2.5;
  var PIRATE_CHASE_SPEED     = 5;
  var SALVAGE_INTERACT_RANGE = 3;
  var SURVIVOR_RESCUE_RANGE  = 4;

  var WATER_RIPPLE_FREQ      = 2.0;
  var WATER_RIPPLE_AMP       = 0.3;
  var BOAT_ROCK_FREQ         = 1.5;
  var BOAT_ROCK_AMP          = 0.4;
  var DEBRIS_BOB_FREQ        = 1.2;
  var DEBRIS_BOB_AMP         = 0.6;

  var RISING_SPEED           = 0.05;   // units per second
  var MAX_WATER_LEVEL        = 35;     // game over if reached
  var FOG_COLOR_WATER        = 0x1A4D6D;
  var FOG_COLOR_CLEAR        = 0x8AAFCC;

  // Colors
  var COLOR_BUILDING         = 0x556677;
  var COLOR_WINDOW           = 0x111111;
  var COLOR_WATER            = 0x2E7D9E;
  var COLOR_WATER_EMISSIVE   = 0x1A5A7D;
  var COLOR_BRIDGE           = 0x8B7355;
  var COLOR_BOAT_HULL        = 0x4A5568;
  var COLOR_PIRATE           = 0x3D3D3D;
  var COLOR_TOWER_TANK       = 0x777777;
  var COLOR_TOWER_LEGS       = 0x554433;
  var COLOR_DEBRIS           = 0x5C4033;
  var COLOR_SUPPLY           = 0xFFD700;
  var COLOR_SUPPLY_GLOW      = 0xFFC700;

  // ── State ─────────────────────────────────────────────────
  var missionActive          = false;
  var missionSuccess         = false;
  var missionFailed          = false;

  var survivorsRescued        = 0;
  var piratesDown             = 0;
  var waterLevel              = WATER_LEVEL;
  var waterLevelTimer         = 0;

  var playerHP                = 100;
  var playerSalvageCollected  = 0;

  var buildings               = [];
  var bridges                 = [];
  var waterSurface            = null;
  var waterSurfacePhase       = 0;
  var speedboat               = null;
  var boatPhase               = 0;
  var waterTower              = null;
  var debrisObjects           = [];
  var debrisPhase             = [];
  var salvageSupplies         = [];
  var pirates                 = [];
  var survivors               = [];

  var hudElement              = null;
  var keyState                = {};
  var keyTimestamps           = {};

  var _scene                  = null;
  var _camera                 = null;
  var _addedKeyListener       = false;
  var _objects                = [];

  // ── Scene / Player helpers ────────────────────────────────

  function getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene ||
      null;
  }

  function getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera ||
      null;
  }

  function getPlayerPos() {
    var cam = getCamera();
    if (cam) return cam.position;
    if (window.player && window.player.position) return window.player.position;
    return null;
  }

  function dist3D(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2D(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function randSign() {
    return Math.random() < 0.5 ? -1 : 1;
  }

  // ── Material / Mesh helpers ───────────────────────────────

  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      for (var k in opts) { params[k] = opts[k]; }
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function addToScene(obj) {
    var sc = getScene();
    if (sc) {
      sc.add(obj);
      _objects.push(obj);
    }
  }

  function removeFromScene(obj) {
    var sc = getScene();
    if (sc && obj) sc.remove(obj);
  }

  // ── Key listener ──────────────────────────────────────────

  function setupKeys() {
    if (_addedKeyListener) return;
    _addedKeyListener = true;
    document.addEventListener('keydown', function (e) {
      if (!keyState[e.code]) {
        keyTimestamps[e.code] = Date.now();
      }
      keyState[e.code] = true;
      checkActivation(e.code);
    });
    document.addEventListener('keyup', function (e) {
      keyState[e.code] = false;
    });
  }

  function checkActivation(code) {
    if (missionActive) return;
    if (code === 'KeyF' || code === 'KeyC') {
      var other = (code === 'KeyF') ? 'KeyC' : 'KeyF';
      var ts = keyTimestamps[other];
      if (ts && (Date.now() - ts) <= ACTIVATION_WINDOW) {
        activateMission();
      }
    }
  }

  // ── Environment Build ─────────────────────────────────────

  function buildEnvironment() {
    var sc = getScene();
    if (!sc) return;

    // Background and fog (murky water)
    sc.background = new THREE.Color(FOG_COLOR_CLEAR);
    sc.fog = new THREE.FogExp2(FOG_COLOR_WATER, 0.035);

    // Ambient light (underwater gloom)
    var ambient = new THREE.AmbientLight(0x6B8A99, 0.7);
    sc.add(ambient);
    _objects.push(ambient);

    // Directional light (filtered through water)
    var sun = new THREE.DirectionalLight(0x99BBCC, 0.5);
    sun.position.set(40, 60, 30);
    sun.castShadow = true;
    sc.add(sun);
    _objects.push(sun);

    // Water surface (large flat emissive plane)
    var waterGeo = new THREE.PlaneGeometry(300, 300, 16, 16);
    var waterMat = new THREE.MeshPhongMaterial({
      color: COLOR_WATER,
      emissive: COLOR_WATER_EMISSIVE,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.85,
      wireframe: false
    });
    waterSurface = new THREE.Mesh(waterGeo, waterMat);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.y = waterLevel;
    waterSurface._waterBaseY = waterLevel;
    waterSurface._waterVertices = [];
    // Store original vertex positions for ripple animation
    for (var vi = 0; vi < waterGeo.attributes.position.count; vi++) {
      waterSurface._waterVertices.push(waterGeo.attributes.position.getY(vi));
    }
    addToScene(waterSurface);
  }

  // ── Buildings Build ───────────────────────────────────────

  function buildBuildings() {
    var buildingConfigs = [
      { x: -50, z: -40, w: 15, h: 45, d: 12 },
      { x: 50, z: -35, w: 12, h: 50, d: 14 },
      { x: -55, z: 45, w: 18, h: 38, d: 10 },
      { x: 60, z: 50, w: 16, h: 42, d: 12 },
      { x: 0, z: -70, w: 20, h: 40, d: 16 },
      { x: -20, z: 70, w: 14, h: 44, d: 11 }
    ];

    for (var bi = 0; bi < buildingConfigs.length; bi++) {
      var cfg = buildingConfigs[bi];
      var buildGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      var buildMat = makeMat(COLOR_BUILDING);
      var building = makeMesh(buildGeo, buildMat);
      building.position.set(cfg.x, cfg.h / 2, cfg.z);
      addToScene(building);
      buildings.push(building);
      building._isBuilding = true;
      building._waterSubmerged = true; // Lower portion is underwater

      // Add windows (small dark boxes)
      for (var wf = 0; wf < 4; wf++) {
        for (var wn = 0; wn < 3; wn++) {
          var winGeo = new THREE.BoxGeometry(1, 1, 0.2);
          var winMat = makeMat(COLOR_WINDOW);
          var window = makeMesh(winGeo, winMat);
          window.position.set(
            cfg.x - cfg.w / 2 + 2 + wn * 3,
            (cfg.h / 2) - 5 - wf * 4,
            cfg.z - cfg.d / 2 - 0.5
          );
          addToScene(window);
        }
      }
    }
  }

  // ── Bridges Build (between rooftops) ───────────────────────

  function buildBridges() {
    var bridgeConfigs = [
      { x1: -50, z1: -40, x2: 50, z2: -35 },
      { x1: 50, z1: -35, x2: 60, z2: 50 },
      { x1: -55, z1: 45, x2: 0, z2: -70 }
    ];

    for (var bi = 0; bi < bridgeConfigs.length; bi++) {
      var cfg = bridgeConfigs[bi];
      var dx = cfg.x2 - cfg.x1;
      var dz = cfg.z2 - cfg.z1;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var mid = { x: (cfg.x1 + cfg.x2) / 2, z: (cfg.z1 + cfg.z2) / 2 };

      var plankGeo = new THREE.BoxGeometry(dist + 2, 0.8, 2);
      var plankMat = makeMat(COLOR_BRIDGE, { transparent: true, opacity: 0.9 });
      var plank = makeMesh(plankGeo, plankMat);
      plank.position.set(mid.x, 38, mid.z);
      plank.rotation.y = Math.atan2(dx, dz);
      addToScene(plank);
      bridges.push(plank);
      plank._isBridge = true;
    }
  }

  // ── Speedboat Build ───────────────────────────────────────

  function buildSpeedboat() {
    var group = new THREE.Group();

    // Hull (box)
    var hullGeo = new THREE.BoxGeometry(4, 1.5, 2);
    var hullMat = makeMat(COLOR_BOAT_HULL);
    var hull = makeMesh(hullGeo, hullMat);
    hull.position.y = 0.75;
    group.add(hull);

    // Cabin (small box on top)
    var cabinGeo = new THREE.BoxGeometry(1.5, 1.2, 1.2);
    var cabinMat = makeMat(0x445566);
    var cabin = makeMesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.8, 0);
    group.add(cabin);

    group.position.set(70, waterLevel, 30);
    group._boatBaseY = waterLevel;
    addToScene(group);
    speedboat = group;
    speedboat._isBoat = true;
  }

  // ── Water Tower Build ─────────────────────────────────────

  function buildWaterTower() {
    var group = new THREE.Group();

    // Tank (cylinder)
    var tankGeo = new THREE.CylinderGeometry(3, 3, 5, 16);
    var tankMat = makeMat(COLOR_TOWER_TANK);
    var tank = makeMesh(tankGeo, tankMat);
    tank.position.y = 10;
    group.add(tank);

    // Legs (4 boxes at base)
    var legPositions = [
      { x: 2, z: 2 }, { x: -2, z: 2 },
      { x: 2, z: -2 }, { x: -2, z: -2 }
    ];
    for (var li = 0; li < legPositions.length; li++) {
      var lpos = legPositions[li];
      var legGeo = new THREE.BoxGeometry(0.4, 8, 0.4);
      var legMat = makeMat(COLOR_TOWER_LEGS);
      var leg = makeMesh(legGeo, legMat);
      leg.position.set(lpos.x, 4, lpos.z);
      group.add(leg);
    }

    group.position.set(-70, 0, 60);
    addToScene(group);
    waterTower = group;
    waterTower._isTower = true;
  }

  // ── Debris Build (floating clusters) ──────────────────────

  function buildDebris() {
    var debrisPositions = [
      { x: 20, z: -50 },
      { x: -40, z: 30 },
      { x: 30, z: 60 },
      { x: -70, z: -20 },
      { x: 45, z: 10 }
    ];

    for (var di = 0; di < debrisPositions.length; di++) {
      var dpos = debrisPositions[di];
      var group = new THREE.Group();

      // Cluster of 3-4 small boxes
      var clusterSize = 3 + Math.floor(Math.random() * 2);
      for (var ci = 0; ci < clusterSize; ci++) {
        var debrisGeo = new THREE.BoxGeometry(
          randRange(0.8, 2),
          randRange(0.6, 1.5),
          randRange(0.8, 2)
        );
        var debrisMat = makeMat(COLOR_DEBRIS);
        var debris = makeMesh(debrisGeo, debrisMat);
        debris.position.set(
          randRange(-2, 2),
          randRange(0, 1),
          randRange(-2, 2)
        );
        debris.rotation.set(
          randRange(-Math.PI, Math.PI),
          randRange(-Math.PI, Math.PI),
          randRange(-Math.PI, Math.PI)
        );
        group.add(debris);
      }

      group.position.set(dpos.x, waterLevel, dpos.z);
      group._debrisBaseY = waterLevel;
      addToScene(group);
      debrisObjects.push(group);
      debrisPhase.push(Math.random() * Math.PI * 2);
      group._isDebris = true;
    }
  }

  // ── Salvage Supplies Build (glowing collectibles) ─────────

  function buildSalvageSupplies() {
    var supplyPositions = [
      { x: 25, z: -45 },
      { x: -35, z: 25 },
      { x: 55, z: 55 }
    ];

    for (var si = 0; si < supplyPositions.length; si++) {
      var spos = supplyPositions[si];
      var supplyGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      var supplyMat = new THREE.MeshPhongMaterial({
        color: COLOR_SUPPLY,
        emissive: COLOR_SUPPLY_GLOW,
        emissiveIntensity: 0.3
      });
      var supply = makeMesh(supplyGeo, supplyMat);
      supply.position.set(spos.x, waterLevel + 1.5, spos.z);
      supply._supplyBaseY = waterLevel + 1.5;
      addToScene(supply);
      salvageSupplies.push({
        mesh: supply,
        collected: false,
        phase: Math.random() * Math.PI * 2
      });
      supply._isSupply = true;
    }
  }

  // ── Pirate Build ──────────────────────────────────────────

  function buildPirateMesh() {
    var group = new THREE.Group();

    // Body (ragged box figure)
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.4, 0.4);
    var bodyMat = makeMat(COLOR_PIRATE);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    var headMat = makeMat(0x2B2B2B);
    var head = makeMesh(headGeo, headMat);
    head.position.y = 1.55;
    group.add(head);

    // Weapon (spear/club)
    var weaponGeo = new THREE.BoxGeometry(0.1, 0.1, 1.2);
    var weaponMat = makeMat(0x8B7355);
    var weapon = makeMesh(weaponGeo, weaponMat);
    weapon.position.set(0.3, 0.9, 0.4);
    group.add(weapon);

    return group;
  }

  function buildPirates() {
    var spawnPositions = [
      { x: -30, z: -50, onBoat: true },
      { x: 70, z: 25, onBoat: true },
      { x: -60, z: 50, onRoof: true },
      { x: 50, z: -30, onRoof: true },
      { x: 25, z: 40, onRoof: false },
      { x: -45, z: 10, onRoof: false }
    ];

    for (var pi = 0; pi < NUM_PIRATES; pi++) {
      var spos = spawnPositions[pi % spawnPositions.length];
      var mesh = buildPirateMesh();
      var startY = spos.onBoat ? waterLevel + 1 : (spos.onRoof ? 32 : waterLevel + 2);
      mesh.position.set(spos.x, startY, spos.z);
      addToScene(mesh);

      // Generate patrol waypoints
      var waypoints = [];
      for (var w = 0; w < 3; w++) {
        waypoints.push({
          x: spos.x + randRange(-20, 20),
          z: spos.z + randRange(-20, 20)
        });
      }

      pirates.push({
        mesh: mesh,
        alive: true,
        health: 50,
        state: 'patrol',
        waypointIdx: 0,
        waypoints: waypoints,
        detectedPlayer: false,
        detectedTimer: 0
      });
    }
  }

  // ── Survivors Build ────────────────────────────────────────

  function buildSurvivors() {
    var positions = [
      { x: -50, z: -40 },
      { x: 50, z: -35 },
      { x: -55, z: 45 },
      { x: 60, z: 50 }
    ];

    for (var si = 0; si < NUM_SURVIVORS; si++) {
      var pos = positions[si];
      var group = new THREE.Group();

      // Body
      var bodyGeo = new THREE.BoxGeometry(0.7, 1.4, 0.4);
      var bodyMat = makeMat(0x8B6F47);
      var body = makeMesh(bodyGeo, bodyMat);
      body.position.y = 0.7;
      group.add(body);

      // Head
      var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var headMat = makeMat(0xCCAA77);
      var head = makeMesh(headGeo, headMat);
      head.position.y = 1.6;
      group.add(head);

      group.position.set(pos.x, 20, pos.z); // On rooftops
      addToScene(group);
      survivors.push({
        mesh: group,
        rescued: false,
        alive: true
      });
    }
  }

  // ── HUD ───────────────────────────────────────────────────

  function buildHUD() {
    if (hudElement) return;
    hudElement = document.createElement('div');
    hudElement.id = 'flooded-city-hud';
    hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(10,30,50,0.8)',
      'color:#4DDBFF',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 16px',
      'border-radius:4px',
      'border:1px solid #2A7F99',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (!hudElement) return;
    var waterLevelStr = Math.round(waterLevel) + 'u';
    var trendStr = waterLevel > WATER_LEVEL ? 'RISING' : 'STABLE';
    hudElement.textContent =
      'SURVIVORS FOUND: ' + survivorsRescued + '/' + NUM_SURVIVORS + ' | ' +
      'PIRATES DOWN: ' + piratesDown + ' | ' +
      'WATER LEVEL: ' + waterLevelStr + ' [' + trendStr + ']';
  }

  // ── Mission Activation ────────────────────────────────────

  function activateMission() {
    if (missionActive) return;
    missionActive = true;
    missionSuccess = false;
    missionFailed = false;

    survivorsRescued = 0;
    piratesDown = 0;
    waterLevel = WATER_LEVEL;
    waterLevelTimer = 0;
    playerHP = 100;
    playerSalvageCollected = 0;

    buildings = [];
    bridges = [];
    waterSurfacePhase = 0;
    speedboat = null;
    boatPhase = 0;
    waterTower = null;
    debrisObjects = [];
    debrisPhase = [];
    salvageSupplies = [];
    pirates = [];
    survivors = [];
    _objects = [];

    buildEnvironment();
    buildBuildings();
    buildBridges();
    buildSpeedboat();
    buildWaterTower();
    buildDebris();
    buildSalvageSupplies();
    buildPirates();
    buildSurvivors();
    buildHUD();

    showNotification('FLOODED CITY - SURVIVORS ON ROOFTOPS. WATER RISING.', '#4DDBFF');
  }

  // ── Water Surface Ripple Animation ────────────────────────

  function updateWaterSurface(dt) {
    if (!waterSurface) return;

    waterSurfacePhase += dt * WATER_RIPPLE_FREQ;

    var geometry = waterSurface.geometry;
    var posAttr = geometry.attributes.position;

    if (waterSurface._waterVertices) {
      for (var vi = 0; vi < posAttr.count; vi++) {
        var baseY = waterSurface._waterVertices[vi];
        var x = posAttr.getX(vi);
        var z = posAttr.getZ(vi);
        var ripple = Math.sin(waterSurfacePhase + x * 0.1 + z * 0.1) * WATER_RIPPLE_AMP;
        posAttr.setY(vi, baseY + ripple);
      }
      posAttr.needsUpdate = true;
    }

    waterSurface.position.y = waterLevel;
  }

  // ── Speedboat Animation ───────────────────────────────────

  function updateSpeedboat(dt) {
    if (!speedboat) return;

    boatPhase += dt * BOAT_ROCK_FREQ;
    var rock = Math.sin(boatPhase) * BOAT_ROCK_AMP;
    speedboat.position.y = speedboat._boatBaseY + rock;
  }

  // ── Debris Animation (bobbing) ────────────────────────────

  function updateDebris(dt) {
    for (var di = 0; di < debrisObjects.length; di++) {
      var debris = debrisObjects[di];
      debrisPhase[di] += dt * DEBRIS_BOB_FREQ;
      var bob = Math.sin(debrisPhase[di]) * DEBRIS_BOB_AMP;
      debris.position.y = debris._debrisBaseY + bob;
    }
  }

  // ── Salvage Supplies Animation & Pickup ───────────────────

  function updateSalvageSupplies(dt) {
    var ppos = getPlayerPos();

    for (var si = 0; si < salvageSupplies.length; si++) {
      var supply = salvageSupplies[si];
      if (supply.collected) continue;

      // Bob animation
      supply.phase += dt * DEBRIS_BOB_FREQ;
      var bob = Math.sin(supply.phase) * (DEBRIS_BOB_AMP * 0.6);
      supply.mesh.position.y = supply.mesh._supplyBaseY + bob;

      // Rotate for glow effect
      supply.mesh.rotation.y += dt * 2;

      // Pickup check
      if (ppos && dist3D(ppos, supply.mesh.position) < SALVAGE_INTERACT_RANGE) {
        supply.collected = true;
        supply.mesh.visible = false;
        playerSalvageCollected++;
      }
    }
  }

  // ── Water Level Rising ────────────────────────────────────

  function updateWaterLevel(dt) {
    waterLevelTimer += dt;
    if (waterLevelTimer >= 2.0) {
      waterLevel += RISING_SPEED;
      waterLevelTimer = 0;
    }

    if (waterLevel >= MAX_WATER_LEVEL) {
      failMission('Water level too high - drowned');
    }
  }

  // ── Pirate AI update ──────────────────────────────────────

  function updatePirates(dt) {
    var ppos = getPlayerPos();

    for (var pi = 0; pi < pirates.length; pi++) {
      var pirate = pirates[pi];
      if (!pirate.alive) continue;

      var pp = pirate.mesh.position;
      var distToPlayer = ppos ? dist2D(ppos, pp) : Infinity;

      // Detection
      if (distToPlayer < PIRATE_DETECT_RANGE) {
        pirate.detectedPlayer = true;
        pirate.detectedTimer += dt;
      } else {
        pirate.detectedTimer = Math.max(0, pirate.detectedTimer - dt * 0.5);
        if (pirate.detectedTimer <= 0) pirate.detectedPlayer = false;
      }

      // State and movement
      if (pirate.detectedPlayer && distToPlayer < PIRATE_ATTACK_RANGE) {
        pirate.state = 'chase';
        // Move toward player
        if (ppos) {
          var dx = ppos.x - pp.x;
          var dz = ppos.z - pp.z;
          var dl = Math.sqrt(dx * dx + dz * dz);
          if (dl > 0.1) {
            pp.x += (dx / dl) * PIRATE_CHASE_SPEED * dt;
            pp.z += (dz / dl) * PIRATE_CHASE_SPEED * dt;
            pirate.mesh.rotation.y = Math.atan2(dx, dz);
          }
        }
      } else {
        pirate.state = 'patrol';
        // Patrol waypoint movement
        var wp = pirate.waypoints[pirate.waypointIdx];
        var wpDx = wp.x - pp.x;
        var wpDz = wp.z - pp.z;
        var wpDist = Math.sqrt(wpDx * wpDx + wpDz * wpDz);
        if (wpDist < 1.5) {
          pirate.waypointIdx = (pirate.waypointIdx + 1) % pirate.waypoints.length;
        } else {
          pp.x += (wpDx / wpDist) * PIRATE_PATROL_SPEED * dt;
          pp.z += (wpDz / wpDist) * PIRATE_PATROL_SPEED * dt;
          pirate.mesh.rotation.y = Math.atan2(wpDx, wpDz);
        }
      }
    }
  }

  // ── Survivor Rescue ───────────────────────────────────────

  function updateSurvivors(dt) {
    var ppos = getPlayerPos();
    if (!ppos) return;

    for (var si = 0; si < survivors.length; si++) {
      var survivor = survivors[si];
      if (!survivor.alive || survivor.rescued) continue;

      var dist = dist3D(ppos, survivor.mesh.position);
      if (dist < SURVIVOR_RESCUE_RANGE) {
        survivor.rescued = true;
        survivor.mesh.visible = false;
        survivorsRescued++;
        showNotification('SURVIVOR RESCUED! [' + survivorsRescued + '/' + NUM_SURVIVORS + ']', '#44FF88');

        if (survivorsRescued >= NUM_SURVIVORS) {
          winMission();
        }
      }
    }
  }

  // ── Win / Fail ────────────────────────────────────────────

  function winMission() {
    if (missionSuccess || missionFailed) return;
    missionSuccess = true;
    showBanner('ALL SURVIVORS RESCUED! EVACUATING...', '#44FF88');
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(3000 + (playerSalvageCollected * 100));
    }
  }

  function failMission(reason) {
    if (missionSuccess || missionFailed) return;
    missionFailed = true;
    showBanner('MISSION FAILED: ' + (reason || 'Objective failed'), '#FF5555');
  }

  function showNotification(msg, color) {
    var notif = document.createElement('div');
    notif.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.8)',
      'color:' + (color || '#FFFFFF'),
      'font-family:monospace',
      'font-size:12px',
      'padding:6px 12px',
      'border-radius:3px',
      'border:1px solid ' + (color || '#FFFFFF'),
      'z-index:9998',
      'pointer-events:none'
    ].join(';');
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(function () {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 3000);
  }

  function showBanner(msg, color) {
    var banner = document.createElement('div');
    banner.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.9)',
      'color:' + (color || '#FFFFFF'),
      'font-family:monospace',
      'font-size:24px',
      'font-weight:bold',
      'padding:20px 40px',
      'border-radius:8px',
      'z-index:10000',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    banner.textContent = msg;
    document.body.appendChild(banner);
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 5000);
  }

  // ── Public API ────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene || null;
    _camera = camera || null;
    setupKeys();
  }

  function update(dt) {
    if (!missionActive || missionSuccess || missionFailed) return;
    if (!dt || isNaN(dt)) dt = 0.016;

    updateWaterLevel(dt);
    updateWaterSurface(dt);
    updateSpeedboat(dt);
    updateDebris(dt);
    updateSalvageSupplies(dt);
    updatePirates(dt);
    updateSurvivors(dt);
    updateHUD();
  }

  function reset() {
    missionActive = false;
    missionSuccess = false;
    missionFailed = false;

    // Remove all objects from scene
    for (var i = 0; i < _objects.length; i++) {
      removeFromScene(_objects[i]);
    }
    _objects = [];

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
    }
    hudElement = null;

    // Reset state
    buildings = [];
    bridges = [];
    waterSurface = null;
    speedboat = null;
    waterTower = null;
    debrisObjects = [];
    debrisPhase = [];
    salvageSupplies = [];
    pirates = [];
    survivors = [];
    survivorsRescued = 0;
    piratesDown = 0;
    waterLevel = WATER_LEVEL;
    waterLevelTimer = 0;
    playerHP = 100;
    playerSalvageCollected = 0;

    // Restore scene state
    var sc = getScene();
    if (sc) {
      sc.fog = null;
      sc.background = null;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
