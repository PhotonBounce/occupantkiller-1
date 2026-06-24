// ============================================================
//  arctic-rescue.js — Arctic Rescue Mission Module
//  Activation: A+R simultaneous keypress (both keys within 400ms)
//  Features:
//    1. Arctic tundra environment with blizzard cycle
//    2. Body temperature system with hypothermia
//    3. 6 survivors with conditions (stable/injured/critical)
//    4. 8 enemy mercenaries patrolling around survivors
//    5. Snowmobile vehicle with limited fuel
//    6. Signal beacon for helicopter extraction
//    7. HUD: RESCUE [TEMP: N%] [SURVIVORS: N/6 AT BASE] [BLIZZARD] [MERCS: N] | HELI: Xs
//  Public API: init, update, reset
// ============================================================
window.ArcticRescue = (function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  var ACTIVATION_WINDOW      = 400;   // ms between A and R keypresses
  var NUM_SURVIVORS          = 6;
  var NUM_MERCS              = 8;
  var MAP_RADIUS             = 80;

  var TEMP_NORMAL_DRAIN      = 2;     // %/min normally
  var TEMP_BLIZZARD_DRAIN    = 8;     // %/min in blizzard
  var HYPO_HP_DRAIN          = 5;     // HP/s at 0% temperature
  var HAND_WARMER_BONUS      = 20;    // % temperature restored
  var HAND_WARMER_SLOW_DUR   = 60;    // seconds of slowed drain
  var HAND_WARMER_DRAIN_MULT = 0.5;   // multiplier on drain when active

  var BLIZZARD_CYCLE         = 180;   // 3 minutes between blizzard start
  var BLIZZARD_DURATION      = 60;    // blizzard lasts 60s
  var BLIZZARD_FOG_DENSITY   = 0.1;
  var NORMAL_FOG_DENSITY     = 0.025;

  var CRITICAL_DEATH_TIME    = 240;   // 4 minutes for critical to die
  var FIRST_AID_TIME         = 5;     // seconds to apply first aid
  var CARRY_RANGE            = 2.5;
  var INTERACT_RANGE         = 2.5;
  var MERC_DETECT_RANGE      = 10;
  var MERC_EXECUTE_RANGE     = 10;    // mercs execute if player w/in 10u while detected
  var MERC_PATROL_SPEED      = 3;
  var MERC_CHASE_SPEED       = 6;

  var SNOWMOBILE_SPEED       = 14;
  var SNOWMOBILE_CAPACITY    = 2;
  var FUEL_PER_TRIP          = 33.3;  // 3 trips range (100/3)
  var BEACON_PLANT_TIME      = 6;     // seconds to plant signal beacon
  var HELI_ARRIVE_TIME       = 180;   // 3 minutes after beacon

  var PLAYER_NORMAL_SPEED_MULT = 1.0;
  var PLAYER_BLIZZARD_SPEED_MULT = 0.5;

  // Colors
  var COLOR_GROUND           = 0xEEEEFF;
  var COLOR_RIDGE            = 0xCCDDFF;
  var COLOR_BASE             = 0x667788;
  var COLOR_SURVIVOR         = 0xEEDDCC;
  var COLOR_MERC             = 0x334455;
  var COLOR_SNOWMOBILE       = 0x557788;
  var COLOR_SNOWMOBILE_SKI   = 0xCCDDEE;
  var COLOR_HEATER           = 0xFF6600;
  var COLOR_HAND_WARMER      = 0xFF4400;
  var COLOR_FUEL_CAN         = 0xFF8800;
  var COLOR_BEACON           = 0x44FF44;
  var COLOR_WIND_LIGHT       = 0xAABBFF;

  // ── State ─────────────────────────────────────────────────────
  var missionActive          = false;
  var missionSuccess         = false;
  var missionFailed          = false;

  var bodyTemp               = 100;
  var handWarmerActive       = false;
  var handWarmerTimer        = 0;
  var playerHP               = 100;

  var blizzardTimer          = BLIZZARD_CYCLE;
  var blizzardActive         = false;
  var blizzardSecondsLeft    = 0;

  var survivors              = [];
  var mercs                  = [];
  var carriedSurvivor        = null;
  var firstAidTarget         = null;
  var firstAidTimer          = 0;
  var survivorsAtBase        = 0;

  var snowmobile             = null;
  var snowmobileFuel         = 100;
  var drivingSnowmobile      = false;
  var snowmobileCarried      = 0;

  var signalBeacon           = null;
  var beaconPlanted          = false;
  var beaconPlantTimer       = 0;
  var beaconPlanting         = false;
  var helicopterCalled       = false;
  var helicopterTimer        = -1;
  var helicopterLanded       = false;

  var handWarmers            = [];
  var fuelCans               = [];
  var heaterMesh             = null;
  var heaterLight            = null;
  var windLight              = null;
  var windLightTimer         = 0;
  var directionArrow         = null;

  var hudElement             = null;
  var keyState               = {};
  var keyTimestamps          = {};

  var _scene                 = null;
  var _addedKeyListener      = false;
  var _objects               = [];

  // ── Scene / Player helpers ────────────────────────────────────

  function getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene ||
      null;
  }

  function getCamera() {
    return (window.GameManager && window.GameManager.camera) ||
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

  // ── Material / Mesh helpers ───────────────────────────────────

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

  // ── Key listener ──────────────────────────────────────────────

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
    if (code === 'KeyA' || code === 'KeyR') {
      var other = (code === 'KeyA') ? 'KeyR' : 'KeyA';
      var ts = keyTimestamps[other];
      if (ts && (Date.now() - ts) <= ACTIVATION_WINDOW) {
        activateMission();
      }
    }
  }

  // ── Environment Build ─────────────────────────────────────────

  function buildEnvironment() {
    var sc = getScene();
    if (!sc) return;

    // Background and fog
    sc.background = new THREE.Color(0xCCDDEE);
    sc.fog = new THREE.FogExp2(0xAABBCC, NORMAL_FOG_DENSITY);

    // Ambient light
    var ambient = new THREE.AmbientLight(0x99AABB, 0.8);
    sc.add(ambient);
    _objects.push(ambient);

    // Directional light (overcast sun)
    var sun = new THREE.DirectionalLight(0xCCDDFF, 0.6);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sc.add(sun);
    _objects.push(sun);

    // Ground: snow plane
    var groundGeo = new THREE.PlaneGeometry(300, 300, 1, 1);
    var groundMat = makeMat(COLOR_GROUND);
    var ground = makeMesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    sc.add(ground);
    _objects.push(ground);

    // 6 ice ridges as cover
    var ridgePositions = [
      { x: -30, z: -20 }, { x: 25, z: -35 },
      { x: -45, z: 15 },  { x: 40, z: 10 },
      { x: 10, z: 40 },   { x: -15, z: 50 }
    ];
    for (var ri = 0; ri < ridgePositions.length; ri++) {
      var rp = ridgePositions[ri];
      var rw = randRange(8, 16);
      var rh = randRange(3, 6);
      var rd = randRange(4, 8);
      var ridgeGeo = new THREE.BoxGeometry(rw, rh, rd);
      var ridgeMat = makeMat(COLOR_RIDGE, { transparent: true, opacity: 0.9 });
      var ridge = makeMesh(ridgeGeo, ridgeMat);
      ridge.position.set(rp.x, rh / 2, rp.z);
      ridge.rotation.y = randRange(-0.3, 0.3);
      sc.add(ridge);
      _objects.push(ridge);
      ridge._isRidge = true;
      ridge._ridgeIdx = ri;
    }

    // Abandoned base
    var baseGeo = new THREE.BoxGeometry(15, 4, 10);
    var baseMat = makeMat(COLOR_BASE);
    var base = makeMesh(baseGeo, baseMat);
    base.position.set(0, 2, 0);
    sc.add(base);
    _objects.push(base);
    base._isBase = true;

    // Heater inside base
    var heaterGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    var heaterMat = makeMat(COLOR_HEATER);
    heaterMesh = makeMesh(heaterGeo, heaterMat);
    heaterMesh.position.set(0, 0.6, 0);
    sc.add(heaterMesh);
    _objects.push(heaterMesh);

    heaterLight = new THREE.PointLight(COLOR_HEATER, 1.5, 12);
    heaterLight.position.set(0, 2, 0);
    sc.add(heaterLight);
    _objects.push(heaterLight);

    // Wind light (blizzard pulse overlay)
    windLight = new THREE.PointLight(COLOR_WIND_LIGHT, 0, 60);
    windLight.position.set(0, 20, 0);
    sc.add(windLight);
    _objects.push(windLight);

    // Hand warmers scattered
    var hwPositions = [
      { x: -50, z: -30 }, { x: 35, z: 40 }, { x: -20, z: 60 }
    ];
    for (var hi = 0; hi < hwPositions.length; hi++) {
      var hwp = hwPositions[hi];
      var hwGeo = new THREE.BoxGeometry(0.5, 0.3, 0.3);
      var hwMat = makeMat(COLOR_HAND_WARMER);
      var hw = makeMesh(hwGeo, hwMat);
      hw.position.set(hwp.x, 0.15, hwp.z);
      sc.add(hw);
      _objects.push(hw);
      hw._isHandWarmer = true;
      hw._collected = false;
      handWarmers.push(hw);
    }

    // Fuel can at base
    var fcGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    var fcMat = makeMat(COLOR_FUEL_CAN);
    var fc = makeMesh(fcGeo, fcMat);
    fc.position.set(8, 0.5, 0);
    sc.add(fc);
    _objects.push(fc);
    fc._isFuelCan = true;
    fc._collected = false;
    fuelCans.push(fc);

    // Signal beacon (atop first ice ridge)
    var beaconGeo = new THREE.BoxGeometry(0.6, 1.0, 0.6);
    var beaconMat = makeMat(COLOR_BEACON);
    signalBeacon = makeMesh(beaconGeo, beaconMat);
    signalBeacon.position.set(ridgePositions[0].x, 7.0, ridgePositions[0].z);
    signalBeacon._isBeacon = true;
    signalBeacon._planted = false;
    sc.add(signalBeacon);
    _objects.push(signalBeacon);
  }

  // ── Survivor Build ────────────────────────────────────────────

  function buildSurvivorMesh() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.4, 0.4);
    var bodyMat = makeMat(COLOR_SURVIVOR);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);
    // Head
    var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var headMat = makeMat(0xDDCCBB);
    var head = makeMesh(headGeo, headMat);
    head.position.y = 1.6;
    group.add(head);
    return group;
  }

  function buildSurvivors() {
    var conditions = ['stable', 'stable', 'injured', 'injured', 'critical', 'critical'];
    var positions = [
      { x: -50, z: -40 }, { x: 55, z: -30 },
      { x: -30, z: 50 },  { x: 60, z: 45 },
      { x: -60, z: 10 },  { x: 40, z: -55 }
    ];
    for (var i = 0; i < NUM_SURVIVORS; i++) {
      var mesh = buildSurvivorMesh();
      var pos = positions[i];
      mesh.position.set(pos.x, 0, pos.z);
      addToScene(mesh);
      survivors.push({
        mesh: mesh,
        condition: conditions[i],
        alive: true,
        carried: false,
        atBase: false,
        critTimer: (conditions[i] === 'critical') ? CRITICAL_DEATH_TIME : -1,
        firstAided: false,
        boardedHeli: false
      });
    }
  }

  // ── Merc Build ────────────────────────────────────────────────

  function buildMercMesh() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.3, 0.4);
    var bodyMat = makeMat(COLOR_MERC);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.65;
    group.add(body);
    var headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    var headMat = makeMat(0x223344);
    var head = makeMesh(headGeo, headMat);
    head.position.y = 1.49;
    group.add(head);
    // Rifle
    var rifleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.7);
    var rifleMat = makeMat(0x111111);
    var rifle = makeMesh(rifleGeo, rifleMat);
    rifle.position.set(0.38, 0.85, 0.2);
    group.add(rifle);
    return group;
  }

  function buildMercs() {
    var basePositions = [
      { x: -50, z: -40 }, { x: 55, z: -30 },
      { x: -30, z: 50 },  { x: 60, z: 45 },
      { x: -60, z: 10 },  { x: 40, z: -55 },
      { x: 20, z: -45 },  { x: -45, z: 30 }
    ];
    for (var i = 0; i < NUM_MERCS; i++) {
      var mesh = buildMercMesh();
      var bp = basePositions[i % basePositions.length];
      var ox = randRange(-8, 8);
      var oz = randRange(-8, 8);
      mesh.position.set(bp.x + ox, 0, bp.z + oz);
      addToScene(mesh);
      // Generate patrol waypoints around spawn
      var waypoints = [];
      for (var w = 0; w < 4; w++) {
        waypoints.push({
          x: bp.x + randRange(-15, 15),
          z: bp.z + randRange(-15, 15)
        });
      }
      mercs.push({
        mesh: mesh,
        alive: true,
        state: 'patrol',     // patrol | chase | execute
        waypointIdx: 0,
        waypoints: waypoints,
        detectedPlayer: false,
        detectedTimer: 0,
        patrolSpeed: MERC_PATROL_SPEED,
        chaseSpeed: MERC_CHASE_SPEED,
        nearestSurvivorIdx: i % NUM_SURVIVORS
      });
    }
  }

  // ── Snowmobile Build ──────────────────────────────────────────

  function buildSnowmobile() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(3, 1.2, 1.8);
    var bodyMat = makeMat(COLOR_SNOWMOBILE);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);
    // Skis (CylinderGeometry)
    var skiGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.2, 8);
    var skiMat = makeMat(COLOR_SNOWMOBILE_SKI);
    var skiL = makeMesh(skiGeo, skiMat);
    skiL.rotation.z = Math.PI / 2;
    skiL.position.set(0, 0.15, -0.7);
    group.add(skiL);
    var skiR = makeMesh(skiGeo, skiMat);
    skiR.rotation.z = Math.PI / 2;
    skiR.position.set(0, 0.15, 0.7);
    group.add(skiR);

    group.position.set(12, 0, 8);
    addToScene(group);
    snowmobile = {
      mesh: group,
      fuel: 100,
      occupied: false,
      carriedCount: 0
    };
  }

  // ── HUD ───────────────────────────────────────────────────────

  function buildHUD() {
    if (hudElement) return;
    hudElement = document.createElement('div');
    hudElement.id = 'arctic-rescue-hud';
    hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.78)',
      'color:#CCE8FF',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 14px',
      'border-radius:4px',
      'border:1px solid #446688',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (!hudElement) return;
    var blizzardStr = blizzardActive
      ? (Math.ceil(blizzardSecondsLeft) + 's')
      : 'CLEAR';
    var heliStr = helicopterCalled
      ? (helicopterLanded ? 'LANDED' : Math.ceil(helicopterTimer) + 's')
      : (beaconPlanted ? 'SIGNALED' : '---');
    var aliveCount = 0;
    for (var i = 0; i < survivors.length; i++) {
      if (survivors[i].alive) aliveCount++;
    }
    var atBaseCount = survivorsAtBase;
    var mercAlive = 0;
    for (var m = 0; m < mercs.length; m++) {
      if (mercs[m].alive) mercAlive++;
    }
    var tempStr = Math.max(0, Math.round(bodyTemp)) + '%';
    hudElement.textContent =
      'RESCUE [TEMP: ' + tempStr + '] ' +
      '[SURVIVORS: ' + atBaseCount + '/6 AT BASE] ' +
      '[BLIZZARD: ' + blizzardStr + '] ' +
      '[MERCS: ' + mercAlive + '] | ' +
      'HELI: ' + heliStr;
  }

  // ── Direction Arrow (nearest survivor) ───────────────────────

  function buildDirectionArrow() {
    directionArrow = document.createElement('div');
    directionArrow.id = 'arctic-survivor-arrow';
    directionArrow.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'width:0',
      'height:0',
      'border-left:10px solid transparent',
      'border-right:10px solid transparent',
      'border-bottom:20px solid #FFD700',
      'transform-origin:50% 150%',
      'pointer-events:none',
      'z-index:9998',
      'display:none'
    ].join(';');
    document.body.appendChild(directionArrow);
  }

  function updateDirectionArrow() {
    if (!directionArrow) return;
    var ppos = getPlayerPos();
    if (!ppos) { directionArrow.style.display = 'none'; return; }
    var cam = getCamera();
    if (!cam) { directionArrow.style.display = 'none'; return; }

    // Find nearest alive survivor not at base
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < survivors.length; i++) {
      var sv = survivors[i];
      if (!sv.alive || sv.atBase || sv.carried) continue;
      var d = dist2D(ppos, sv.mesh.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = sv;
      }
    }
    if (!nearest) { directionArrow.style.display = 'none'; return; }

    // Compute angle from camera forward to survivor
    var dx = nearest.mesh.position.x - ppos.x;
    var dz = nearest.mesh.position.z - ppos.z;
    var angleToSurvivor = Math.atan2(dx, dz);
    var camAngle = cam.rotation.y;
    var relAngle = angleToSurvivor - camAngle;
    var deg = relAngle * (180 / Math.PI);

    directionArrow.style.display = 'block';
    directionArrow.style.transform = 'translateX(-50%) translateY(-50%) rotate(' + deg + 'deg) translateY(-80px)';
  }

  // ── Mission Activation ────────────────────────────────────────

  function activateMission() {
    if (missionActive) return;
    missionActive = true;
    missionSuccess = false;
    missionFailed = false;

    bodyTemp = 100;
    handWarmerActive = false;
    handWarmerTimer = 0;
    playerHP = 100;

    blizzardTimer = BLIZZARD_CYCLE;
    blizzardActive = false;
    blizzardSecondsLeft = 0;

    survivors = [];
    mercs = [];
    carriedSurvivor = null;
    firstAidTarget = null;
    firstAidTimer = 0;
    survivorsAtBase = 0;
    handWarmers = [];
    fuelCans = [];
    snowmobileFuel = 100;
    drivingSnowmobile = false;
    snowmobileCarried = 0;
    beaconPlanted = false;
    beaconPlantTimer = 0;
    beaconPlanting = false;
    helicopterCalled = false;
    helicopterTimer = -1;
    helicopterLanded = false;
    _objects = [];

    buildEnvironment();
    buildSurvivors();
    buildMercs();
    buildSnowmobile();
    buildHUD();
    buildDirectionArrow();
  }

  // ── Blizzard System ───────────────────────────────────────────

  function updateBlizzard(dt) {
    var sc = getScene();
    if (!sc) return;

    if (blizzardActive) {
      blizzardSecondsLeft -= dt;
      if (blizzardSecondsLeft <= 0) {
        blizzardActive = false;
        blizzardTimer = BLIZZARD_CYCLE;
        if (sc.fog) sc.fog.density = NORMAL_FOG_DENSITY;
        if (windLight) windLight.intensity = 0;
      } else {
        if (sc.fog) sc.fog.density = BLIZZARD_FOG_DENSITY;
        // Pulse wind light
        windLightTimer += dt;
        var pulse = 0.5 + 0.5 * Math.sin(windLightTimer * 4.0);
        if (windLight) windLight.intensity = pulse * 0.8;
      }
    } else {
      blizzardTimer -= dt;
      if (blizzardTimer <= 0) {
        blizzardActive = true;
        blizzardSecondsLeft = BLIZZARD_DURATION;
        if (sc.fog) sc.fog.density = BLIZZARD_FOG_DENSITY;
      }
    }
  }

  // ── Temperature System ────────────────────────────────────────

  function updateTemperature(dt) {
    var ppos = getPlayerPos();

    // Check if near heater
    var nearHeater = false;
    if (ppos && heaterMesh) {
      if (dist3D(ppos, heaterMesh.position) < 4) {
        nearHeater = true;
      }
    }

    if (nearHeater) {
      // Warming up
      bodyTemp = Math.min(100, bodyTemp + 15 * dt);
      handWarmerActive = false;
    } else {
      // Hand warmer timer
      if (handWarmerActive) {
        handWarmerTimer -= dt;
        if (handWarmerTimer <= 0) {
          handWarmerActive = false;
        }
      }

      var drain = blizzardActive ? TEMP_BLIZZARD_DRAIN : TEMP_NORMAL_DRAIN;
      if (handWarmerActive) drain *= HAND_WARMER_DRAIN_MULT;
      bodyTemp -= drain * (dt / 60.0);
      if (bodyTemp < 0) bodyTemp = 0;
    }

    // Hypothermia damage
    if (bodyTemp <= 0) {
      playerHP -= HYPO_HP_DRAIN * dt;
      if (playerHP <= 0) {
        playerHP = 0;
        // Player is incapacitated - mission fails
        failMission('Hypothermia');
      }
    }
  }

  // ── Pickup interactions ───────────────────────────────────────

  function checkPickups(dt) {
    var ppos = getPlayerPos();
    if (!ppos) return;

    // Hand warmers
    for (var hi = 0; hi < handWarmers.length; hi++) {
      var hw = handWarmers[hi];
      if (hw._collected) continue;
      if (dist3D(ppos, hw.position) < 2.0) {
        hw._collected = true;
        hw.visible = false;
        bodyTemp = Math.min(100, bodyTemp + HAND_WARMER_BONUS);
        handWarmerActive = true;
        handWarmerTimer = HAND_WARMER_SLOW_DUR;
      }
    }

    // Fuel cans
    for (var fi = 0; fi < fuelCans.length; fi++) {
      var fc = fuelCans[fi];
      if (fc._collected) continue;
      if (dist3D(ppos, fc.position) < 2.0) {
        fc._collected = true;
        fc.visible = false;
        if (snowmobile) snowmobile.fuel = 100;
      }
    }
  }

  // ── Survivor update ───────────────────────────────────────────

  function updateSurvivors(dt) {
    var ppos = getPlayerPos();
    var eKeyPressed = keyState['KeyE'];

    for (var i = 0; i < survivors.length; i++) {
      var sv = survivors[i];
      if (!sv.alive || sv.atBase) continue;

      // Critical survivor countdown
      if (sv.condition === 'critical') {
        sv.critTimer -= dt;
        if (sv.critTimer <= 0) {
          sv.alive = false;
          sv.mesh.visible = false;
          continue;
        }
      }

      // Carried survivor follows player
      if (sv.carried && ppos) {
        sv.mesh.position.x = ppos.x + 0.8;
        sv.mesh.position.y = 0;
        sv.mesh.position.z = ppos.z + 0.8;

        // Check if reached base (position near 0,0)
        if (dist2D(sv.mesh.position, { x: 0, z: 0 }) < 10) {
          sv.carried = false;
          sv.atBase = true;
          if (carriedSurvivor === sv) carriedSurvivor = null;
          survivorsAtBase++;
          checkWinCondition();
        }
        continue;
      }

      if (!ppos) continue;
      var d = dist2D(ppos, sv.mesh.position);

      // First aid interaction
      if (sv.condition === 'injured' && !sv.firstAided && d < INTERACT_RANGE && eKeyPressed) {
        firstAidTarget = sv;
        firstAidTimer += dt;
        if (firstAidTimer >= FIRST_AID_TIME) {
          sv.firstAided = true;
          sv.condition = 'stable';
          firstAidTarget = null;
          firstAidTimer = 0;
        }
      } else if (firstAidTarget === sv && (!eKeyPressed || d >= INTERACT_RANGE)) {
        firstAidTarget = null;
        firstAidTimer = 0;
      }

      // Carry interaction: E key near stable/firstAided survivor, not carrying yet
      if (!carriedSurvivor && d < CARRY_RANGE && eKeyPressed) {
        if (sv.condition === 'stable' || (sv.condition === 'injured' && sv.firstAided)) {
          sv.carried = true;
          carriedSurvivor = sv;
        }
      }
    }
  }

  // ── Merc AI update ────────────────────────────────────────────

  function updateMercs(dt) {
    var ppos = getPlayerPos();

    for (var i = 0; i < mercs.length; i++) {
      var m = mercs[i];
      if (!m.alive) continue;

      var mp = m.mesh.position;
      var distToPlayer = ppos ? dist2D(ppos, mp) : Infinity;

      // Detection check
      if (distToPlayer < MERC_DETECT_RANGE) {
        m.detectedPlayer = true;
        m.detectedTimer += dt;
      } else {
        m.detectedTimer = Math.max(0, m.detectedTimer - dt * 0.5);
        if (m.detectedTimer <= 0) m.detectedPlayer = false;
      }

      // Execute behavior: if player detected within range and merc still alive near survivor
      if (m.detectedPlayer && distToPlayer < MERC_EXECUTE_RANGE) {
        m.state = 'chase';
        // Check if merc is near a survivor and player is detected - execute survivor
        var svIdx = m.nearestSurvivorIdx;
        if (svIdx >= 0 && svIdx < survivors.length) {
          var sv = survivors[svIdx];
          if (sv.alive && !sv.atBase && dist2D(mp, sv.mesh.position) < 5) {
            // Execute survivor
            sv.alive = false;
            sv.mesh.visible = false;
          }
        }
      } else {
        m.state = 'patrol';
      }

      // Movement
      if (m.state === 'chase' && ppos) {
        var dx = ppos.x - mp.x;
        var dz = ppos.z - mp.z;
        var dl = Math.sqrt(dx * dx + dz * dz);
        if (dl > 0.1) {
          mp.x += (dx / dl) * m.chaseSpeed * dt;
          mp.z += (dz / dl) * m.chaseSpeed * dt;
          m.mesh.rotation.y = Math.atan2(dx, dz);
        }
      } else {
        // Patrol
        var wp = m.waypoints[m.waypointIdx];
        var wpDx = wp.x - mp.x;
        var wpDz = wp.z - mp.z;
        var wpDist = Math.sqrt(wpDx * wpDx + wpDz * wpDz);
        if (wpDist < 1.5) {
          m.waypointIdx = (m.waypointIdx + 1) % m.waypoints.length;
        } else {
          mp.x += (wpDx / wpDist) * m.patrolSpeed * dt;
          mp.z += (wpDz / wpDist) * m.patrolSpeed * dt;
          m.mesh.rotation.y = Math.atan2(wpDx, wpDz);
        }
      }

      // Check if player shot/killed merc (proximity kill by checking collisions handled externally)
      // Mercs take damage from GameManager weapon system
      if (window.GameManager && window.GameManager.checkEnemyHit) {
        // integration point
      }
    }
  }

  // ── Snowmobile update ─────────────────────────────────────────

  function updateSnowmobile(dt) {
    if (!snowmobile) return;
    var ppos = getPlayerPos();
    if (!ppos) return;

    var sm = snowmobile;
    var smp = sm.mesh.position;

    // Enter/exit snowmobile with E key
    if (keyState['KeyE'] && dist2D(ppos, smp) < 3.0) {
      if (!sm.occupied) {
        sm.occupied = true;
        drivingSnowmobile = true;
      }
    }
    if (keyState['KeyQ'] && sm.occupied) {
      sm.occupied = false;
      drivingSnowmobile = false;
    }

    if (!sm.occupied || sm.fuel <= 0) return;

    // WASD driving
    var moved = false;
    var spd = SNOWMOBILE_SPEED;
    var forward = 0, strafe = 0;
    if (keyState['KeyW']) { forward = 1; moved = true; }
    if (keyState['KeyS']) { forward = -1; moved = true; }
    if (keyState['KeyA']) { strafe = -1; moved = true; }
    if (keyState['KeyD']) { strafe = 1; moved = true; }

    if (moved) {
      smp.x += forward * Math.sin(sm.mesh.rotation.y) * spd * dt;
      smp.z += forward * Math.cos(sm.mesh.rotation.y) * spd * dt;
      sm.mesh.rotation.y += strafe * 1.5 * dt;
      sm.fuel -= dt * FUEL_PER_TRIP / 60.0;
      if (sm.fuel < 0) sm.fuel = 0;

      // Move player with snowmobile
      if (ppos) {
        ppos.x = smp.x;
        ppos.z = smp.z;
      }
    }

    // Check if at base to drop carried survivors
    if (dist2D(smp, { x: 0, z: 0 }) < 12 && sm.carriedCount > 0) {
      // Drop carried survivors at base
      for (var i = 0; i < survivors.length; i++) {
        var sv = survivors[i];
        if (sv.carried) {
          sv.carried = false;
          sv.atBase = true;
          sv.mesh.position.set(randRange(-5, 5), 0, randRange(-4, 4));
          survivorsAtBase++;
        }
      }
      sm.carriedCount = 0;
      carriedSurvivor = null;
      checkWinCondition();
    }
  }

  // ── Signal Beacon ─────────────────────────────────────────────

  function updateBeacon(dt) {
    if (beaconPlanted || !signalBeacon) return;
    var ppos = getPlayerPos();
    if (!ppos) return;

    if (dist3D(ppos, signalBeacon.position) < 3.0 && keyState['KeyE']) {
      beaconPlanting = true;
      beaconPlantTimer += dt;
      if (beaconPlantTimer >= BEACON_PLANT_TIME) {
        beaconPlanted = true;
        beaconPlanting = false;
        signalBeacon.material.emissive = new THREE.Color(0x44FF44);
        helicopterCalled = true;
        helicopterTimer = HELI_ARRIVE_TIME;
      }
    } else {
      beaconPlanting = false;
      beaconPlantTimer = 0;
    }
  }

  function updateHelicopter(dt) {
    if (!helicopterCalled || helicopterLanded) return;
    helicopterTimer -= dt;
    if (helicopterTimer <= 0) {
      helicopterLanded = true;
      helicopterTimer = 0;
      // Board all survivors at base
      var boarded = 0;
      for (var i = 0; i < survivors.length; i++) {
        if (survivors[i].atBase && survivors[i].alive) {
          survivors[i].boardedHeli = true;
          boarded++;
        }
      }
      if (boarded === countAliveSurvivors()) {
        winMission();
      }
    }
  }

  function countAliveSurvivors() {
    var count = 0;
    for (var i = 0; i < survivors.length; i++) {
      if (survivors[i].alive) count++;
    }
    return count;
  }

  function checkWinCondition() {
    // All alive survivors at base + helicopter landed = win
    var alive = countAliveSurvivors();
    var atBase = 0;
    for (var i = 0; i < survivors.length; i++) {
      if (survivors[i].alive && survivors[i].atBase) atBase++;
    }
    if (helicopterLanded && atBase === alive && alive > 0) {
      winMission();
    }
  }

  // ── Win / Fail ────────────────────────────────────────────────

  function winMission() {
    if (missionSuccess || missionFailed) return;
    missionSuccess = true;
    showBanner('RESCUE COMPLETE! All survivors evacuated!', '#44FF88');
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(5000);
    }
  }

  function failMission(reason) {
    if (missionSuccess || missionFailed) return;
    missionFailed = true;
    showBanner('MISSION FAILED: ' + (reason || 'Rescue aborted'), '#FF4444');
  }

  function showBanner(msg, color) {
    var banner = document.createElement('div');
    banner.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:' + (color || '#FFFFFF'),
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'padding:18px 32px',
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

  // ── Player speed mod ──────────────────────────────────────────

  function applySpeedMod() {
    var mult = blizzardActive ? PLAYER_BLIZZARD_SPEED_MULT : PLAYER_NORMAL_SPEED_MULT;
    if (window.GameManager && window.GameManager.playerSpeedMult !== undefined) {
      window.GameManager.playerSpeedMult = mult;
    } else if (window.playerSpeedMult !== undefined) {
      window.playerSpeedMult = mult;
    }
  }

  // ── Public API ────────────────────────────────────────────────

  function init(scene) {
    _scene = scene || null;
    setupKeys();
  }

  function update(dt) {
    if (!missionActive || missionSuccess || missionFailed) return;
    if (!dt || isNaN(dt)) dt = 0.016;

    updateBlizzard(dt);
    updateTemperature(dt);
    applySpeedMod();
    checkPickups(dt);
    updateSurvivors(dt);
    updateMercs(dt);
    updateSnowmobile(dt);
    updateBeacon(dt);
    updateHelicopter(dt);
    updateDirectionArrow();
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

    if (directionArrow && directionArrow.parentNode) {
      directionArrow.parentNode.removeChild(directionArrow);
    }
    directionArrow = null;

    survivors = [];
    mercs = [];
    handWarmers = [];
    fuelCans = [];
    snowmobile = null;
    signalBeacon = null;
    heaterMesh = null;
    heaterLight = null;
    windLight = null;
    carriedSurvivor = null;
    firstAidTarget = null;
    survivorsAtBase = 0;
    bodyTemp = 100;
    playerHP = 100;
    blizzardActive = false;
    blizzardTimer = BLIZZARD_CYCLE;
    blizzardSecondsLeft = 0;
    drivingSnowmobile = false;
    beaconPlanted = false;
    helicopterCalled = false;
    helicopterLanded = false;

    // Restore scene fog/background if possible
    var sc = getScene();
    if (sc) {
      sc.fog = null;
      sc.background = null;
    }
    // Restore player speed
    if (window.GameManager && window.GameManager.playerSpeedMult !== undefined) {
      window.GameManager.playerSpeedMult = 1.0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
