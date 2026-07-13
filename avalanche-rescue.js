// ============================================================
//  avalanche-rescue.js — Avalanche Rescue FPS Module
//  Activation: A+V simultaneous keypress (both keys within 400ms)
//  Features:
//    1. Mountain ski resort hit by avalanche
//    2. 10 survivors buried in snow/collapsed buildings
//    3. 15 armed gang looters (+ 1 gang leader with radio)
//    4. Secondary avalanche mechanic from explosions/gunshots
//    5. Rescue equipment: shovel, flares, medical kits, rope
//    6. Rescue helicopter LZ as extraction point
//    7. HUD: AVALANCHE RESCUE [SURVIVORS: N/10 RESCUED] [ALIVE: N/10] [GANG: N] [TIMER: MM:SS] [AVALANCHE RISK: LOW/HIGH/IMMINENT]
//  Win: rescue 8+ survivors within 12 minutes
//  Lose: fewer than 8 rescued when timer runs out OR gang leader calls backup
//  Public API: init, update, reset
// ============================================================
window.AvalancheRescue = (function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  var ACTIVATION_WINDOW         = 400;   // ms between A and V keypresses
  var MISSION_DURATION          = 720;   // 12 minutes in seconds
  var NUM_SURVIVORS             = 10;
  var NUM_LOOTERS               = 15;
  var WIN_RESCUE_COUNT          = 8;

  var SURVIVOR_HP_MAX           = 100;
  var SURVIVOR_DRAIN_RATE       = 3;    // HP/min if not rescued
  var DIG_DURATION              = 4;    // seconds to dig out a survivor
  var ESCORT_SPEED              = 2.5;
  var LZ_RADIUS                 = 6;
  var BEACON_RANGE              = 15;   // units for thermal beacon visibility
  var FLARE_DURATION            = 60;   // seconds
  var MEDKIT_TIME_BONUS         = 180;  // 3 minutes extra survival time
  var MED_INTERACT_TIME         = 2;    // seconds to apply medkit

  var LOOTER_HP                 = 70;
  var LOOTER_SPEED              = 4;
  var LOOTER_DETECT_RANGE       = 18;
  var LOOTER_ATTACK_RANGE       = 20;
  var LOOTER_ATTACK_RATE        = 2;    // shots per second
  var LOOTER_DAMAGE             = 8;
  var LOOTER_LOOT_RANGE         = 4;
  var LEADER_HP                 = 280;
  var LEADER_RADIO_TIME         = 240;  // 4 min after detection before calling backup
  var BACKUP_REINFORCEMENTS     = 8;

  var PLAYER_HP_MAX             = 100;
  var PLAYER_SPEED              = 8;
  var PLAYER_FIRE_RANGE         = 30;
  var PLAYER_DAMAGE             = 20;
  var PLAYER_FIRE_RATE          = 0.15; // seconds between shots

  var AVALANCHE_EXPLOSION_CHANCE = 0.4;
  var AVALANCHE_SHOT_COUNT      = 3;    // consecutive shots near cliff
  var MINI_SLIDE_BLOCKS         = 4;
  var MINI_SLIDE_DAMAGE         = 15;
  var SLIDE_BLOCK_SPEED         = 8;

  var INTERACT_RANGE            = 3;

  // Colors
  var COLOR_SNOW_TERRAIN        = 0xEEEEFF;
  var COLOR_SNOW_DRIFT          = 0xDDEEFF;
  var COLOR_SKI_LODGE           = 0x886655;
  var COLOR_CABLE_STATION       = 0x556655;
  var COLOR_CHALET              = 0x776644;
  var COLOR_SURVIVOR            = 0x886655;
  var COLOR_LOOTER              = 0x443322;
  var COLOR_LEADER              = 0x332211;
  var COLOR_LZ                  = 0x445544;
  var COLOR_FLARE               = 0xFF6600;
  var COLOR_DEBRIS              = 0xDDEEFF;
  var COLOR_GONDOLA             = 0x557799;
  var COLOR_WHEEL               = 0x444444;
  var COLOR_CLIFF               = 0x887766;
  var COLOR_TREE_TRUNK          = 0x664422;
  var COLOR_TREE_SNOW           = 0xDDEEFF;
  var COLOR_ROPE                = 0xAA8866;
  var COLOR_LZ_LINE             = 0xFFFF00;
  var COLOR_HELI                = 0x445566;

  // ── State ─────────────────────────────────────────────────────
  var missionActive             = false;
  var missionSuccess            = false;
  var missionFailed             = false;
  var failReason                = '';

  var missionTimer              = MISSION_DURATION;
  var playerHP                  = PLAYER_HP_MAX;
  var playerFireCooldown        = 0;

  var survivors                 = [];
  var looters                   = [];
  var gangLeader                = null;
  var leaderDetectTimer         = -1;
  var reinforcementsSpawned     = false;

  var digTarget                 = null;
  var digTimer                  = 0;
  var medTarget                 = null;
  var medTimer                  = 0;

  var survivorsRescued          = 0;

  var flares                    = [];
  var flarePickups              = [];
  var medKitPickups             = [];
  var flareCount                = 3;
  var medKitCount               = 2;

  var debrisBlocks              = [];
  var slideBlocks               = [];

  var nearCliffShotCount        = 0;
  var nearCliffShotTimer        = 0;

  var avalancheRisk             = 0; // 0=low,1=high,2=imminent
  var avalancheRiskTimer        = 0;

  var lzMesh                    = null;
  var lzMarker                  = null;
  var heliMesh                  = null;
  var heliLanded                = false;
  var heliTimer                 = -1;

  var hudElement                = null;
  var keyState                  = {};
  var keyTimestamps             = {};

  var _scene                    = null;
  var _addedKeyListener         = false;
  var _objects                  = [];

  // ── Helpers ───────────────────────────────────────────────────

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

  function randInt(lo, hi) {
    return Math.floor(lo + Math.random() * (hi - lo + 1));
  }

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
    if (sc && obj) { sc.remove(obj); }
  }

  function makeBox(w, h, d, color, opts) {
    return makeMesh(new THREE.BoxGeometry(w, h, d), makeMat(color, opts));
  }

  function makeCyl(rt, rb, h, segs, color, opts) {
    return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), makeMat(color, opts));
  }

  function makeSphere(r, ws, hs, color, opts) {
    return makeMesh(new THREE.SphereGeometry(r, ws, hs), makeMat(color, opts));
  }

  function makeCone(r, h, segs, color, opts) {
    return makeMesh(new THREE.ConeGeometry(r, h, segs), makeMat(color, opts));
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
      if (missionActive) handleActionKey(e.code);
    });
    document.addEventListener('keyup', function (e) {
      keyState[e.code] = false;
    });
  }

  function checkActivation(code) {
    if (missionActive) return;
    if (code === 'KeyA' || code === 'KeyV') {
      var other = (code === 'KeyA') ? 'KeyV' : 'KeyA';
      var ts = keyTimestamps[other];
      if (ts && (Date.now() - ts) <= ACTIVATION_WINDOW) {
        activateMission();
      }
    }
  }

  function handleActionKey(code) {
    // E: dig/interact
    if (code === 'KeyE') {
      tryInteract();
    }
    // F: throw flare
    if (code === 'KeyF') {
      throwFlare();
    }
    // Q: use medkit on nearby survivor
    if (code === 'KeyQ') {
      applyMedKit();
    }
    // Mouse1 / Space: fire weapon
    if (code === 'Space') {
      fireWeapon();
    }
    // G: grenade (triggers avalanche risk)
    if (code === 'KeyG') {
      throwGrenade();
    }
  }

  // ── Environment Build ─────────────────────────────────────────

  function buildEnvironment() {
    var sc = getScene();
    if (!sc) return;

    sc.background = new THREE.Color(0xCCDDEE);
    sc.fog = new THREE.FogExp2(0xBBCCDD, 0.018);

    var ambient = new THREE.AmbientLight(0xAABBCC, 0.9);
    sc.add(ambient);
    _objects.push(ambient);

    var sun = new THREE.DirectionalLight(0xDDEEFF, 0.7);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sc.add(sun);
    _objects.push(sun);

    // Ground — snow-covered flat base
    var ground = makeBox(300, 1, 300, COLOR_SNOW_TERRAIN);
    ground.position.set(0, -0.5, 0);
    addToScene(ground);

    // Slope: angled terrain block creating the mountain feel
    var slopeA = makeBox(120, 8, 80, COLOR_SNOW_TERRAIN);
    slopeA.rotation.x = 0.18;
    slopeA.position.set(0, 3, -60);
    addToScene(slopeA);

    var slopeB = makeBox(100, 12, 60, COLOR_SNOW_TERRAIN);
    slopeB.rotation.x = 0.3;
    slopeB.position.set(10, 8, -110);
    addToScene(slopeB);

    // Snow drifts scattered across slope
    var driftPositions = [
      {x:-25,z:-20},{x:30,z:-15},{x:-40,z:-45},{x:15,z:-55},
      {x:-10,z:20},{x:45,z:5},{x:-55,z:10},{x:20,z:35},
      {x:-30,z:55},{x:50,z:-30}
    ];
    for (var di = 0; di < driftPositions.length; di++) {
      var dp = driftPositions[di];
      var dw = randRange(5, 12);
      var dh = randRange(1.5, 3.5);
      var dd = randRange(4, 8);
      var drift = makeBox(dw, dh, dd, COLOR_SNOW_DRIFT);
      drift.position.set(dp.x, dh / 2, dp.z);
      drift.rotation.y = randRange(0, Math.PI);
      addToScene(drift);
    }

    // Avalanche debris field
    var debrisPositions = [
      {x:-20,z:-30},{x:-15,z:-25},{x:-25,z:-35},{x:-10,z:-32},
      {x:5,z:-28},{x:-30,z:-20},{x:0,z:-40},{x:-35,z:-50},
      {x:10,z:-45},{x:-5,z:-52}
    ];
    for (var dbi = 0; dbi < debrisPositions.length; dbi++) {
      var dbp = debrisPositions[dbi];
      var dbw = randRange(2, 5);
      var dbh = randRange(1, 3);
      var dbd = randRange(2, 5);
      var debris = makeBox(dbw, dbh, dbd, COLOR_DEBRIS);
      debris.position.set(dbp.x, dbh / 2, dbp.z);
      debris.rotation.y = randRange(0, Math.PI);
      debris._isDebris = true;
      debris._small = (dbw * dbd < 8);
      addToScene(debris);
      debrisBlocks.push(debris);
    }

    // Ski lodge — half-buried
    buildSkiLodge(sc);

    // Cable car station
    buildCableStation(sc);

    // Ski chalet ruins
    buildChalet(sc);

    // Cliff face (trigger zone for avalanche)
    buildCliff(sc);

    // Trees
    buildTrees(sc);

    // Rescue LZ
    buildLZ(sc);

    // Rescue helicopter (parked, waits for survivors)
    buildHelicopter(sc);
  }

  function buildSkiLodge(sc) {
    // Main body — half buried, spec says 30x4x20
    var lodge = makeBox(30, 4, 20, COLOR_SKI_LODGE);
    lodge.position.set(-10, 0, 10); // y=0 means half buried at y level
    addToScene(lodge);
    lodge._isStructure = true;

    // Collapsed roof section
    var roof = makeBox(32, 1.5, 22, COLOR_SKI_LODGE, { color: 0x775544 });
    roof.position.set(-10, 2.5, 10);
    roof.rotation.z = 0.25;
    addToScene(roof);

    // Rubble piles
    var r1 = makeBox(6, 2, 4, COLOR_DEBRIS);
    r1.position.set(-22, 1, 8);
    addToScene(r1);

    var r2 = makeBox(4, 1.5, 6, COLOR_DEBRIS);
    r2.position.set(-10, 1, 20);
    addToScene(r2);
  }

  function buildCableStation(sc) {
    // Main building 15x8x10
    var station = makeBox(15, 8, 10, COLOR_CABLE_STATION);
    station.position.set(35, 4, -20);
    addToScene(station);
    station._isStructure = true;

    // Cable wheels (CylinderGeometry)
    var wheel1 = makeCyl(2, 2, 1, 12, COLOR_WHEEL);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(28, 10, -20);
    addToScene(wheel1);

    var wheel2 = makeCyl(2, 2, 1, 12, COLOR_WHEEL);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(42, 10, -20);
    addToScene(wheel2);

    // Cable (LineSegments)
    var cablePoints = [
      new THREE.Vector3(28, 10, -20),
      new THREE.Vector3(10, 14, -50),
      new THREE.Vector3(-10, 18, -80)
    ];
    var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    var cable = new THREE.Line(cableGeo, cableMat);
    addToScene(cable);

    // Gondola cars (BoxGeometry)
    var gondola1 = makeBox(3, 2.5, 2, COLOR_GONDOLA);
    gondola1.position.set(18, 11, -35);
    addToScene(gondola1);

    var gondola2 = makeBox(3, 2.5, 2, COLOR_GONDOLA);
    gondola2.position.set(4, 14, -60);
    addToScene(gondola2);
  }

  function buildChalet(sc) {
    // Main floor 20x3x15 spec
    var chalet = makeBox(20, 3, 15, COLOR_CHALET);
    chalet.position.set(-45, 1.5, -30);
    addToScene(chalet);
    chalet._isStructure = true;

    // Collapsed walls
    var wall1 = makeBox(20, 4, 1, COLOR_CHALET);
    wall1.position.set(-45, 2, -37);
    wall1.rotation.z = 0.4;
    addToScene(wall1);

    var wall2 = makeBox(1, 4, 15, COLOR_CHALET);
    wall2.position.set(-35, 2, -30);
    wall2.rotation.x = 0.3;
    addToScene(wall2);

    var wall3 = makeBox(1, 3, 15, COLOR_CHALET);
    wall3.position.set(-55, 1.5, -30);
    addToScene(wall3);

    // Rubble
    var wr = makeBox(5, 2, 4, COLOR_DEBRIS);
    wr.position.set(-45, 1, -23);
    addToScene(wr);
  }

  function buildCliff(sc) {
    // Cliff face at the back of the scene
    var cliff = makeBox(120, 30, 8, COLOR_CLIFF);
    cliff.position.set(0, 15, -130);
    addToScene(cliff);

    // Cliff overhang
    var overhang = makeBox(100, 5, 15, COLOR_CLIFF);
    overhang.position.set(0, 29, -123);
    addToScene(overhang);

    // Mark cliff as trigger zone
    cliff._isCliff = true;
    cliff._triggerZone = true;
  }

  function buildTrees(sc) {
    var treePositions = [
      {x:55,z:-5},{x:60,z:10},{x:55,z:25},{x:65,z:-15},
      {x:-60,z:0},{x:-65,z:15},{x:-60,z:-15},{x:-70,z:-5},
      {x:20,z:55},{x:35,z:60},{x:5,z:60}
    ];
    for (var ti = 0; ti < treePositions.length; ti++) {
      var tp = treePositions[ti];
      var trunk = makeCyl(0.3, 0.5, 4, 6, COLOR_TREE_TRUNK);
      trunk.position.set(tp.x, 2, tp.z);
      addToScene(trunk);
      trunk._isStructure = true; // trees absorb avalanche slides

      var canopy = makeCone(2.5, 5, 8, COLOR_TREE_SNOW);
      canopy.position.set(tp.x, 6.5, tp.z);
      addToScene(canopy);
    }
  }

  function buildLZ(sc) {
    // Landing zone platform
    lzMesh = makeBox(14, 0.3, 14, COLOR_LZ);
    lzMesh.position.set(30, 0.15, 40);
    addToScene(lzMesh);

    // LZ cross marker (LineSegments)
    var lzLineGeo = new THREE.BufferGeometry();
    var lzVerts = new Float32Array([
      // horizontal bar
      23, 0.5, 40,  37, 0.5, 40,
      // vertical bar
      30, 0.5, 33,  30, 0.5, 47,
      // outer box corners
      23, 0.5, 33,  37, 0.5, 33,
      37, 0.5, 33,  37, 0.5, 47,
      37, 0.5, 47,  23, 0.5, 47,
      23, 0.5, 47,  23, 0.5, 33
    ]);
    lzLineGeo.setAttribute('position', new THREE.BufferAttribute(lzVerts, 3));
    var lzLineMat = new THREE.LineBasicMaterial({ color: COLOR_LZ_LINE });
    lzMarker = new THREE.LineSegments(lzLineGeo, lzLineMat);
    addToScene(lzMarker);

    // LZ ambient light
    var lzLight = new THREE.PointLight(0x44FF44, 1.5, 20);
    lzLight.position.set(30, 3, 40);
    addToScene(lzLight);
  }

  function buildHelicopter(sc) {
    // Heli body
    var heliBody = makeBox(8, 2.5, 3, COLOR_HELI);
    heliBody.position.set(30, 4, 40);
    addToScene(heliBody);

    // Tail boom
    var tailBoom = makeBox(6, 1, 1, COLOR_HELI);
    tailBoom.position.set(26, 4, 40);
    addToScene(tailBoom);

    // Tail rotor (flat box)
    var tailRotor = makeBox(0.3, 2, 0.2, COLOR_WHEEL);
    tailRotor.position.set(23, 5, 40);
    addToScene(tailRotor);

    // Cockpit bubble (sphere)
    var cockpit = makeSphere(1.5, 8, 6, 0x88AACC, { transparent: true, opacity: 0.6 });
    cockpit.position.set(34, 5, 40);
    addToScene(cockpit);

    heliMesh = heliBody;
  }

  // ── Spawn Survivors ───────────────────────────────────────────

  function spawnSurvivors() {
    var positions = [
      // Buried in debris field
      {x:-20,z:-30,buried:true},
      {x:-15,z:-25,buried:true},
      {x:5,z:-28,buried:true},
      {x:-30,z:-20,buried:true},
      // Inside chalet ruins
      {x:-48,z:-28,buried:false},
      {x:-43,z:-32,buried:false},
      {x:-45,z:-26,buried:false},
      // Near lodge
      {x:-5,z:14,buried:true},
      {x:-18,z:8,buried:true},
      // Open slope
      {x:10,z:-42,buried:true}
    ];

    for (var i = 0; i < NUM_SURVIVORS; i++) {
      var sp = positions[i];
      var yPos = sp.buried ? -0.6 : 0.7; // partially buried below ground

      var sGeo = new THREE.BoxGeometry(0.8, 1.6, 0.5);
      var sMat = makeMat(COLOR_SURVIVOR);
      var sMesh = makeMesh(sGeo, sMat);
      sMesh.position.set(sp.x, yPos, sp.z);
      addToScene(sMesh);

      // Thermal beacon light
      var beacon = new THREE.PointLight(0xFF4400, 0, BEACON_RANGE);
      beacon.position.copy(sMesh.position);
      beacon.position.y += 0.5;
      addToScene(beacon);

      var surv = {
        mesh: sMesh,
        beacon: beacon,
        hp: SURVIVOR_HP_MAX,
        buried: sp.buried,
        freed: false,
        rescued: false,
        dead: false,
        following: false,
        beaconPulse: Math.random() * Math.PI * 2,
        extraTime: 0,
        digProgress: 0
      };
      survivors.push(surv);
    }
  }

  // ── Spawn Looters ─────────────────────────────────────────────

  function spawnLooters() {
    var positions = [
      {x:-8,z:-10},{x:5,z:-15},{x:25,z:-5},{x:-30,z:5},
      {x:15,z:20},{x:-40,z:-10},{x:20,z:-35},{x:-5,z:30},
      {x:35,z:-25},{x:-50,z:20},{x:0,z:-50},{x:40,z:15},
      {x:-20,z:40},{x:10,z:50},{x:-55,z:-25}
    ];

    for (var i = 0; i < NUM_LOOTERS; i++) {
      var lp = positions[i];
      var lGeo = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var lMat = makeMat(COLOR_LOOTER);
      var lMesh = makeMesh(lGeo, lMat);
      lMesh.position.set(lp.x, 0.9, lp.z);
      addToScene(lMesh);

      // Eye (small sphere shows alert state)
      var eyeGeo = new THREE.SphereGeometry(0.12, 6, 6);
      var eyeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      var eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0, 0.4, 0.3);
      lMesh.add(eye);

      var looter = {
        mesh: lMesh,
        hp: LOOTER_HP,
        dead: false,
        alerted: false,
        patrol: {
          origin: { x: lp.x, z: lp.z },
          angle: Math.random() * Math.PI * 2,
          timer: 0
        },
        attackTimer: 0,
        target: null
      };
      looters.push(looter);
    }

    // Gang leader
    var leaderGeo = new THREE.BoxGeometry(1.0, 2.0, 0.6);
    var leaderMat = makeMat(COLOR_LEADER);
    var leaderMesh = makeMesh(leaderGeo, leaderMat);
    leaderMesh.position.set(-25, 1.0, -40);
    addToScene(leaderMesh);

    // Radio prop
    var radioGeo = new THREE.BoxGeometry(0.3, 0.5, 0.2);
    var radioMat = makeMat(0x222222);
    var radio = new THREE.Mesh(radioGeo, radioMat);
    radio.position.set(0.55, 0, 0.3);
    leaderMesh.add(radio);

    // Leader light (red aura)
    var leaderLight = new THREE.PointLight(0xFF2200, 0.8, 8);
    leaderLight.position.copy(leaderMesh.position);
    leaderLight.position.y += 2;
    addToScene(leaderLight);

    gangLeader = {
      mesh: leaderMesh,
      light: leaderLight,
      hp: LEADER_HP,
      dead: false,
      alerted: false,
      radioUsed: false,
      detectTimer: 0,
      patrol: {
        origin: { x: -25, z: -40 },
        angle: Math.PI,
        timer: 0
      },
      attackTimer: 0
    };
  }

  // ── Spawn Equipment Pickups ───────────────────────────────────

  function spawnEquipment() {
    // Flare pickups (3 total, already have them by default)
    var flarePosns = [
      {x:0,z:0},{x:-35,z:-15},{x:20,z:10}
    ];
    for (var fi = 0; fi < flarePosns.length; fi++) {
      var fp = flarePosns[fi];
      var flareBox = makeBox(0.4, 0.4, 0.4, COLOR_FLARE);
      flareBox.position.set(fp.x, 0.5, fp.z);
      addToScene(flareBox);
      flarePickups.push({ mesh: flareBox, collected: false });
    }

    // Med kit pickups
    var medPosns = [
      {x:-10,z:5},{x:30,z:-10}
    ];
    for (var mi = 0; mi < medPosns.length; mi++) {
      var mp = medPosns[mi];
      var medBox = makeBox(0.5, 0.5, 0.5, 0xFF3333);
      medBox.position.set(mp.x, 0.5, mp.z);
      // Cross marking
      var crossBar1 = makeBox(0.55, 0.1, 0.15, 0xFFFFFF);
      medBox.add(crossBar1);
      var crossBar2 = makeBox(0.15, 0.1, 0.55, 0xFFFFFF);
      medBox.add(crossBar2);
      addToScene(medBox);
      medKitPickups.push({ mesh: medBox, collected: false });
    }
  }

  // ── Interaction ───────────────────────────────────────────────

  function tryInteract() {
    var pp = getPlayerPos();
    if (!pp) return;

    // Check if near a buried survivor to start digging
    for (var i = 0; i < survivors.length; i++) {
      var s = survivors[i];
      if (s.dead || s.rescued || s.following) continue;
      if (s.buried && !s.freed) {
        var d = dist2D(pp, s.mesh.position);
        if (d <= INTERACT_RANGE) {
          if (digTarget !== s) {
            digTarget = s;
            digTimer = 0;
          }
          return;
        }
      } else if (!s.buried || s.freed) {
        // Freed survivor — start following
        var d2 = dist2D(pp, s.mesh.position);
        if (d2 <= INTERACT_RANGE && !s.following) {
          s.following = true;
          return;
        }
      }
    }
    digTarget = null;
  }

  function throwFlare() {
    if (flareCount <= 0) return;
    var pp = getPlayerPos();
    var cam = getCamera();
    if (!pp || !cam) return;

    flareCount--;

    var flareLight = new THREE.PointLight(0xFF6600, 3, 25);
    var throwDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    flareLight.position.set(
      pp.x + throwDir.x * 8,
      0.5,
      pp.z + throwDir.z * 8
    );
    addToScene(flareLight);

    var flareMark = makeBox(0.3, 0.6, 0.3, COLOR_FLARE);
    flareMark.position.copy(flareLight.position);
    addToScene(flareMark);

    var flareObj = {
      light: flareLight,
      mesh: flareMark,
      timer: FLARE_DURATION,
      active: true
    };
    flares.push(flareObj);
  }

  function applyMedKit() {
    if (medKitCount <= 0) return;
    var pp = getPlayerPos();
    if (!pp) return;

    for (var i = 0; i < survivors.length; i++) {
      var s = survivors[i];
      if (s.dead || s.rescued) continue;
      if (dist2D(pp, s.mesh.position) <= INTERACT_RANGE) {
        medKitCount--;
        s.hp = Math.min(SURVIVOR_HP_MAX, s.hp + 40);
        s.extraTime += MEDKIT_TIME_BONUS;
        showHudMessage('MEDKIT APPLIED — Survivor stabilized');
        return;
      }
    }
  }

  function throwGrenade() {
    var pp = getPlayerPos();
    var cam = getCamera();
    if (!pp || !cam) return;

    var throwDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    var gx = pp.x + throwDir.x * 10;
    var gz = pp.z + throwDir.z * 10;

    // Explosion flash
    var expLight = new THREE.PointLight(0xFF8800, 8, 20);
    expLight.position.set(gx, 2, gz);
    addToScene(expLight);

    // Damage looters in radius
    var expRadius = 8;
    for (var i = 0; i < looters.length; i++) {
      var l = looters[i];
      if (l.dead) continue;
      if (dist2D(l.mesh.position, { x: gx, z: gz }) < expRadius) {
        l.hp -= 50;
        if (l.hp <= 0) killLooter(l);
      }
    }
    if (gangLeader && !gangLeader.dead) {
      if (dist2D(gangLeader.mesh.position, { x: gx, z: gz }) < expRadius) {
        gangLeader.hp -= 50;
        if (gangLeader.hp <= 0) killGangLeader();
      }
    }

    // Avalanche chance
    nearCliffShotCount += 3; // grenade counts as 3 shots
    if (Math.random() < AVALANCHE_EXPLOSION_CHANCE) {
      triggerMiniSlide(gx, gz);
      updateAvalancheRisk(2);
    } else {
      updateAvalancheRisk(Math.min(2, avalancheRisk + 1));
    }

    // Remove flash after brief delay (track via timer trick in state)
    var expTimer = { light: expLight, ttl: 0.3 };
    slideBlocks.push(expTimer); // reuse array to track temporary lights
  }

  function fireWeapon() {
    var pp = getPlayerPos();
    var cam = getCamera();
    if (!pp || !cam) return;
    if (playerFireCooldown > 0) return;

    playerFireCooldown = PLAYER_FIRE_RATE;

    // Raycast direction
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);

    // Check looters in cone
    var bestDist = PLAYER_FIRE_RANGE;
    var bestTarget = null;
    var targetType = '';

    for (var i = 0; i < looters.length; i++) {
      var l = looters[i];
      if (l.dead) continue;
      var toL = new THREE.Vector3(
        l.mesh.position.x - pp.x,
        l.mesh.position.y - pp.y,
        l.mesh.position.z - pp.z
      );
      var dist = toL.length();
      if (dist > PLAYER_FIRE_RANGE) continue;
      toL.normalize();
      if (toL.dot(dir) > 0.95) {
        if (dist < bestDist) {
          bestDist = dist;
          bestTarget = l;
          targetType = 'looter';
        }
      }
    }

    if (gangLeader && !gangLeader.dead) {
      var toLeader = new THREE.Vector3(
        gangLeader.mesh.position.x - pp.x,
        gangLeader.mesh.position.y - pp.y,
        gangLeader.mesh.position.z - pp.z
      );
      var leaderDist = toLeader.length();
      if (leaderDist <= PLAYER_FIRE_RANGE) {
        toLeader.normalize();
        if (toLeader.dot(dir) > 0.95 && leaderDist < bestDist) {
          bestTarget = gangLeader;
          bestDist = leaderDist;
          targetType = 'leader';
        }
      }
    }

    if (bestTarget) {
      bestTarget.hp -= PLAYER_DAMAGE;
      if (targetType === 'leader') {
        if (bestTarget.hp <= 0) killGangLeader();
      } else {
        if (bestTarget.hp <= 0) killLooter(bestTarget);
      }
    }

    // Near cliff shot tracking
    if (pp.z < -80) {
      nearCliffShotCount++;
      nearCliffShotTimer = 5;
      if (nearCliffShotCount >= AVALANCHE_SHOT_COUNT) {
        triggerMiniSlide(pp.x + randRange(-10, 10), pp.z);
        nearCliffShotCount = 0;
        updateAvalancheRisk(2);
      } else {
        updateAvalancheRisk(Math.min(2, avalancheRisk + 1));
      }
    }
  }

  function killLooter(l) {
    l.dead = true;
    l.mesh.position.y = -0.5;
    l.mesh.rotation.z = Math.PI / 2;
    if (l.mesh.children[0]) {
      l.mesh.children[0].material.color.setHex(0x333333);
    }
  }

  function killGangLeader() {
    gangLeader.dead = true;
    gangLeader.mesh.position.y = -0.5;
    gangLeader.mesh.rotation.z = Math.PI / 2;
    if (gangLeader.light) {
      gangLeader.light.intensity = 0;
    }
    showHudMessage('GANG LEADER NEUTRALIZED — Threat level reduced');
  }

  function updateAvalancheRisk(level) {
    avalancheRisk = level;
    avalancheRiskTimer = 30; // stays elevated for 30s
  }

  // ── Avalanche Mini-Slide ──────────────────────────────────────

  function triggerMiniSlide(originX, originZ) {
    var sc = getScene();
    if (!sc) return;

    var count = randInt(MINI_SLIDE_BLOCKS - 1, MINI_SLIDE_BLOCKS + 1);
    for (var i = 0; i < count; i++) {
      var sw = randRange(1.5, 3);
      var sh = randRange(1, 2);
      var sd = randRange(1.5, 3);
      var sBlock = makeBox(sw, sh, sd, COLOR_DEBRIS);
      sBlock.position.set(
        originX + randRange(-8, 8),
        sh / 2 + 15,
        originZ + randRange(-4, 4)
      );
      addToScene(sBlock);

      var slideBlock = {
        mesh: sBlock,
        vel: { x: randRange(-2, 2), y: -5, z: randRange(3, 8) },
        active: true,
        damage: MINI_SLIDE_DAMAGE,
        ttl: 5
      };
      slideBlocks.push(slideBlock);
    }
    showHudMessage('WARNING: MINI-SLIDE TRIGGERED!');
  }

  // ── AI Update ─────────────────────────────────────────────────

  function updateLooterAI(looter, dt) {
    if (looter.dead) return;

    var pp = getPlayerPos();
    if (!pp) return;

    var distToPlayer = dist2D(looter.mesh.position, pp);

    // Detection
    if (distToPlayer < LOOTER_DETECT_RANGE) {
      looter.alerted = true;
    }

    if (looter.alerted) {
      // Check if near any freed survivor to loot
      var nearSurvivor = null;
      for (var i = 0; i < survivors.length; i++) {
        var s = survivors[i];
        if (s.dead || s.rescued) continue;
        var ds = dist2D(looter.mesh.position, s.mesh.position);
        if (ds < LOOTER_LOOT_RANGE) {
          nearSurvivor = s;
          break;
        }
      }

      if (nearSurvivor && distToPlayer > 12) {
        // Loot the survivor
        nearSurvivor.hp -= 20 * dt;
        if (nearSurvivor.hp <= 0) {
          nearSurvivor.dead = true;
          nearSurvivor.mesh.position.y = -0.8;
        }
      } else {
        // Chase player
        var dx = pp.x - looter.mesh.position.x;
        var dz = pp.z - looter.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        dx /= len; dz /= len;

        if (distToPlayer > 5) {
          looter.mesh.position.x += dx * LOOTER_SPEED * dt;
          looter.mesh.position.z += dz * LOOTER_SPEED * dt;
        }

        // Rotate to face player
        looter.mesh.rotation.y = Math.atan2(dx, dz);

        // Attack
        looter.attackTimer -= dt;
        if (distToPlayer < LOOTER_ATTACK_RANGE && looter.attackTimer <= 0) {
          looter.attackTimer = 1 / LOOTER_ATTACK_RATE;
          playerHP -= LOOTER_DAMAGE;
          if (playerHP < 0) playerHP = 0;
        }
      }
    } else {
      // Patrol
      looter.patrol.timer -= dt;
      if (looter.patrol.timer <= 0) {
        looter.patrol.angle += randRange(-0.8, 0.8);
        looter.patrol.timer = randRange(2, 5);
      }
      var px = Math.cos(looter.patrol.angle) * LOOTER_SPEED * 0.6 * dt;
      var pz = Math.sin(looter.patrol.angle) * LOOTER_SPEED * 0.6 * dt;
      var nx = looter.mesh.position.x + px;
      var nz = looter.mesh.position.z + pz;
      var odx = nx - looter.patrol.origin.x;
      var odz = nz - looter.patrol.origin.z;
      if (Math.sqrt(odx * odx + odz * odz) < 20) {
        looter.mesh.position.x = nx;
        looter.mesh.position.z = nz;
      } else {
        looter.patrol.angle += Math.PI;
      }
    }
  }

  function updateLeaderAI(dt) {
    if (!gangLeader || gangLeader.dead) return;

    var pp = getPlayerPos();
    if (!pp) return;

    var distToPlayer = dist2D(gangLeader.mesh.position, pp);

    if (distToPlayer < LOOTER_DETECT_RANGE) {
      gangLeader.alerted = true;
    }

    if (gangLeader.alerted) {
      // Track how long player detected
      gangLeader.detectTimer += dt;

      if (!gangLeader.radioUsed && gangLeader.detectTimer >= LEADER_RADIO_TIME) {
        callReinforcements();
      }

      // Chase at slower pace, hang back
      var dx = pp.x - gangLeader.mesh.position.x;
      var dz = pp.z - gangLeader.mesh.position.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      dx /= len; dz /= len;

      if (distToPlayer > 15) {
        gangLeader.mesh.position.x += dx * (LOOTER_SPEED * 0.7) * dt;
        gangLeader.mesh.position.z += dz * (LOOTER_SPEED * 0.7) * dt;
      }
      gangLeader.mesh.rotation.y = Math.atan2(dx, dz);

      // Leader light follows
      gangLeader.light.position.copy(gangLeader.mesh.position);
      gangLeader.light.position.y += 2;

      // Attack
      gangLeader.attackTimer -= dt;
      if (distToPlayer < LOOTER_ATTACK_RANGE && gangLeader.attackTimer <= 0) {
        gangLeader.attackTimer = 0.5; // slower, more deliberate
        playerHP -= LOOTER_DAMAGE * 1.5;
        if (playerHP < 0) playerHP = 0;
      }
    } else {
      // Patrol
      gangLeader.patrol.timer -= dt;
      if (gangLeader.patrol.timer <= 0) {
        gangLeader.patrol.angle += randRange(-0.5, 0.5);
        gangLeader.patrol.timer = randRange(3, 6);
      }
      var px = Math.cos(gangLeader.patrol.angle) * LOOTER_SPEED * 0.5 * dt;
      var pz = Math.sin(gangLeader.patrol.angle) * LOOTER_SPEED * 0.5 * dt;
      gangLeader.mesh.position.x += px;
      gangLeader.mesh.position.z += pz;
    }
  }

  function callReinforcements() {
    if (gangLeader.radioUsed) return;
    gangLeader.radioUsed = true;

    showHudMessage('GANG LEADER CALLED BACKUP! REINFORCEMENTS INCOMING!');
    updateAvalancheRisk(2);

    // Spawn backup after short delay (tracked via a flag + timer)
    var sc = getScene();
    if (!sc) return;

    for (var i = 0; i < BACKUP_REINFORCEMENTS; i++) {
      var angle = (i / BACKUP_REINFORCEMENTS) * Math.PI * 2;
      var rx = Math.cos(angle) * 60;
      var rz = Math.sin(angle) * 60;

      var rGeo = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var rMat = makeMat(0x221111);
      var rMesh = makeMesh(rGeo, rMat);
      rMesh.position.set(rx, 0.9, rz);
      addToScene(rMesh);

      var reinforcement = {
        mesh: rMesh,
        hp: LOOTER_HP,
        dead: false,
        alerted: true,
        patrol: { origin: { x: rx, z: rz }, angle: Math.random() * Math.PI * 2, timer: 0 },
        attackTimer: 0,
        target: null
      };
      looters.push(reinforcement);
    }
  }

  // ── Survivor Update ───────────────────────────────────────────

  function updateSurvivors(dt) {
    var pp = getPlayerPos();
    var aliveSurvivors = 0;

    for (var i = 0; i < survivors.length; i++) {
      var s = survivors[i];
      if (s.rescued) { aliveSurvivors++; continue; }
      if (s.dead) continue;

      aliveSurvivors++;

      // Health drain
      s.hp -= (SURVIVOR_DRAIN_RATE / 60) * dt;
      if (s.extraTime > 0) {
        s.extraTime -= dt;
        s.hp += (SURVIVOR_DRAIN_RATE / 60) * dt * 0.7; // partial mitigation
      }

      if (s.hp <= 0) {
        s.dead = true;
        s.hp = 0;
        s.beacon.intensity = 0;
        s.mesh.position.y = -0.9;
        continue;
      }

      // Beacon pulse
      s.beaconPulse += dt * 2;
      if (pp) {
        var beaconDist = dist2D(pp, s.mesh.position);
        if (beaconDist < BEACON_RANGE) {
          s.beacon.intensity = (Math.sin(s.beaconPulse) * 0.5 + 0.5) * 1.5;
        } else {
          s.beacon.intensity = 0;
        }
      }

      // Digging progress
      if (digTarget === s && pp) {
        var dd = dist2D(pp, s.mesh.position);
        if (dd <= INTERACT_RANGE) {
          digTimer += dt;
          if (digTimer >= DIG_DURATION) {
            s.buried = false;
            s.freed = true;
            s.mesh.position.y = 0.7;
            s.beacon.position.y = 1.2;
            digTarget = null;
            digTimer = 0;
            showHudMessage('SURVIVOR DUG OUT — Walk them to the LZ!');
          }
        } else {
          digTarget = null;
          digTimer = 0;
        }
      }

      // Following player
      if (s.following && pp) {
        var fdx = pp.x - s.mesh.position.x;
        var fdz = pp.z - s.mesh.position.z;
        var fdist = Math.sqrt(fdx * fdx + fdz * fdz);
        if (fdist > 2.5) {
          var fspeed = ESCORT_SPEED * dt;
          s.mesh.position.x += (fdx / fdist) * fspeed;
          s.mesh.position.z += (fdz / fdist) * fspeed;
          s.beacon.position.copy(s.mesh.position);
          s.beacon.position.y += 0.8;
        }

        // Check if at LZ
        if (lzMesh) {
          var ldx = s.mesh.position.x - lzMesh.position.x;
          var ldz = s.mesh.position.z - lzMesh.position.z;
          if (Math.sqrt(ldx * ldx + ldz * ldz) < LZ_RADIUS) {
            s.rescued = true;
            s.following = false;
            survivorsRescued++;
            removeFromScene(s.mesh);
            s.beacon.intensity = 0;
            showHudMessage('SURVIVOR RESCUED! (' + survivorsRescued + '/10)');
          }
        }
      }
    }

    return aliveSurvivors;
  }

  // ── Slide Block Physics ───────────────────────────────────────

  function updateSlideBlocks(dt) {
    var pp = getPlayerPos();
    var toRemove = [];

    for (var i = 0; i < slideBlocks.length; i++) {
      var sb = slideBlocks[i];

      // Temporary light objects stored here too
      if (sb.light && sb.ttl !== undefined) {
        sb.ttl -= dt;
        if (sb.ttl <= 0) {
          removeFromScene(sb.light);
          toRemove.push(i);
        }
        continue;
      }

      if (!sb.active) { toRemove.push(i); continue; }

      sb.ttl -= dt;
      if (sb.ttl <= 0) {
        sb.active = false;
        removeFromScene(sb.mesh);
        toRemove.push(i);
        continue;
      }

      // Gravity
      sb.vel.y -= 9.8 * dt;

      sb.mesh.position.x += sb.vel.x * dt;
      sb.mesh.position.y += sb.vel.y * dt;
      sb.mesh.position.z += sb.vel.z * dt;

      // Ground collision
      if (sb.mesh.position.y <= 0.5) {
        sb.mesh.position.y = 0.5;
        sb.vel.y = 0;
        sb.vel.x *= 0.85;
        sb.vel.z *= 0.85;
      }

      // Damage player
      if (pp && sb.active) {
        var sdist = dist3D(sb.mesh.position, pp);
        if (sdist < 1.5) {
          playerHP -= sb.damage;
          if (playerHP < 0) playerHP = 0;
          sb.active = false;
          removeFromScene(sb.mesh);
          toRemove.push(i);
        }
      }
    }

    // Remove in reverse to avoid index shifting
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      slideBlocks.splice(toRemove[ri], 1);
    }
  }

  // ── Flare Update ──────────────────────────────────────────────

  function updateFlares(dt) {
    var toRemove = [];
    for (var i = 0; i < flares.length; i++) {
      var f = flares[i];
      if (!f.active) { toRemove.push(i); continue; }
      f.timer -= dt;
      if (f.timer <= 0) {
        f.active = false;
        removeFromScene(f.light);
        removeFromScene(f.mesh);
        toRemove.push(i);
      } else {
        // Flicker
        f.light.intensity = 2.5 + Math.sin(Date.now() * 0.01) * 0.8;
      }
    }
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      flares.splice(toRemove[ri], 1);
    }
  }

  // ── Equipment Pickup Update ───────────────────────────────────

  function updatePickups(dt) {
    var pp = getPlayerPos();
    if (!pp) return;

    for (var i = 0; i < flarePickups.length; i++) {
      var fp = flarePickups[i];
      if (fp.collected) continue;
      if (dist2D(pp, fp.mesh.position) < 1.5) {
        fp.collected = true;
        removeFromScene(fp.mesh);
        flareCount++;
        showHudMessage('FLARE COLLECTED (' + flareCount + ' flares)');
      } else {
        fp.mesh.rotation.y += dt * 1.5;
      }
    }

    for (var mi = 0; mi < medKitPickups.length; mi++) {
      var mp = medKitPickups[mi];
      if (mp.collected) continue;
      if (dist2D(pp, mp.mesh.position) < 1.5) {
        mp.collected = true;
        removeFromScene(mp.mesh);
        medKitCount++;
        showHudMessage('MEDKIT COLLECTED (' + medKitCount + ' kits)');
      } else {
        mp.mesh.rotation.y += dt * 1.2;
      }
    }
  }

  // ── Win/Lose Conditions ───────────────────────────────────────

  function checkEndConditions() {
    // Win: 8+ rescued
    if (survivorsRescued >= WIN_RESCUE_COUNT) {
      missionSuccess = true;
      missionActive = false;
      showEndScreen(true, 'ALL SURVIVORS SECURED — MISSION COMPLETE');
      return;
    }

    // Lose: timer expired
    if (missionTimer <= 0) {
      missionTimer = 0;
      missionFailed = true;
      missionActive = false;
      failReason = survivorsRescued >= WIN_RESCUE_COUNT
        ? 'SUCCESS' : 'TIME EXPIRED — Only ' + survivorsRescued + '/10 survivors rescued';
      showEndScreen(false, failReason);
      return;
    }

    // Lose: gang leader called backup and overwhelming force
    if (gangLeader && gangLeader.radioUsed && !gangLeader.dead) {
      var aliveLooterCount = 0;
      for (var i = 0; i < looters.length; i++) {
        if (!looters[i].dead) aliveLooterCount++;
      }
      // If more than 12 looters alive after reinforcements with < 4 rescued
      if (aliveLooterCount > 14 && survivorsRescued < 4 && missionTimer < 480) {
        missionFailed = true;
        missionActive = false;
        failReason = 'OVERWHELMED — Gang reinforcements took control. Only ' + survivorsRescued + ' rescued.';
        showEndScreen(false, failReason);
      }
    }

    // Player death
    if (playerHP <= 0) {
      missionFailed = true;
      missionActive = false;
      failReason = 'PLAYER KIA — Mission failed. ' + survivorsRescued + ' survivors rescued.';
      showEndScreen(false, failReason);
    }
  }

  // ── HUD ───────────────────────────────────────────────────────

  function buildHUD() {
    if (hudElement) return;
    hudElement = document.createElement('div');
    hudElement.id = 'avalanche-rescue-hud';
    hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#EEEEFF',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(hudElement);

    // Message overlay
    var msgEl = document.createElement('div');
    msgEl.id = 'avalanche-rescue-msg';
    msgEl.style.cssText = [
      'position:fixed',
      'top:55px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(200,60,0,0.85)',
      'color:#FFFFFF',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 14px',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'opacity:0',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(msgEl);

    // Controls help (bottom)
    var helpEl = document.createElement('div');
    helpEl.id = 'avalanche-rescue-help';
    helpEl.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#AABBCC',
      'font-family:monospace',
      'font-size:11px',
      'padding:5px 14px',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    helpEl.textContent = '[SPACE] SHOOT  [E] DIG/ESCORT  [F] FLARE  [Q] MEDKIT  [G] GRENADE';
    document.body.appendChild(helpEl);
  }

  var _msgTimer = 0;
  var _msgEl = null;

  function showHudMessage(msg) {
    if (!_msgEl) _msgEl = document.getElementById('avalanche-rescue-msg');
    if (!_msgEl) return;
    _msgEl.textContent = msg;
    _msgEl.style.opacity = '1';
    _msgTimer = 3;
  }

  function updateHUD(dt) {
    if (!hudElement) return;

    var mins = Math.floor(missionTimer / 60);
    var secs = Math.floor(missionTimer % 60);
    var timerStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var aliveSurv = 0;
    for (var i = 0; i < survivors.length; i++) {
      if (!survivors[i].dead && !survivors[i].rescued) aliveSurv++;
    }

    var aliveGang = 0;
    for (var j = 0; j < looters.length; j++) {
      if (!looters[j].dead) aliveGang++;
    }
    if (gangLeader && !gangLeader.dead) aliveGang++;

    var riskStr = avalancheRisk === 0 ? 'LOW' : (avalancheRisk === 1 ? 'HIGH' : 'IMMINENT');
    var riskColor = avalancheRisk === 0 ? '#88FF88' : (avalancheRisk === 1 ? '#FFAA00' : '#FF3333');

    var digStr = (digTarget && !digTarget.dead) ? '  [DIGGING: ' + Math.floor((digTimer / DIG_DURATION) * 100) + '%]' : '';
    var flareStr = '  [FLARES:' + flareCount + ']  [MEDS:' + medKitCount + ']';

    hudElement.innerHTML =
      'AVALANCHE RESCUE' +
      '  [RESCUED: <span style="color:#88FF88">' + survivorsRescued + '/10</span>]' +
      '  [ALIVE: <span style="color:#FFAA00">' + aliveSurv + '/10</span>]' +
      '  [GANG: <span style="color:#FF6666">' + aliveGang + '</span>]' +
      '  [TIMER: <span style="color:#AADDFF">' + timerStr + '</span>]' +
      '  [RISK: <span style="color:' + riskColor + '">' + riskStr + '</span>]' +
      '  [HP: <span style="color:' + (playerHP > 50 ? '#88FF88' : '#FF4444') + '">' + Math.max(0, Math.floor(playerHP)) + '</span>]' +
      flareStr + digStr;

    // Message fade
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _msgEl) {
        _msgEl.style.opacity = '0';
      }
    }
  }

  function showEndScreen(win, message) {
    var el = document.createElement('div');
    el.id = 'avalanche-rescue-end';
    el.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'background:rgba(0,0,0,0.85)',
      'color:' + (win ? '#88FF88' : '#FF4444'),
      'font-family:monospace',
      'font-size:28px',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'z-index:99999',
      'pointer-events:none'
    ].join(';');

    var title = document.createElement('div');
    title.textContent = win ? '— MISSION COMPLETE —' : '— MISSION FAILED —';
    title.style.marginBottom = '20px';

    var sub = document.createElement('div');
    sub.style.fontSize = '16px';
    sub.style.color = '#FFFFFF';
    sub.textContent = message;

    var score = document.createElement('div');
    score.style.fontSize = '14px';
    score.style.color = '#AAAAAA';
    score.style.marginTop = '16px';
    score.textContent = 'Survivors rescued: ' + survivorsRescued + '/10';

    var hint = document.createElement('div');
    hint.style.fontSize = '12px';
    hint.style.color = '#666666';
    hint.style.marginTop = '24px';
    hint.textContent = 'Press A+V to restart';

    el.appendChild(title);
    el.appendChild(sub);
    el.appendChild(score);
    el.appendChild(hint);
    document.body.appendChild(el);
  }

  // ── Avalanche Risk Decay ──────────────────────────────────────

  function updateAvalancheRiskDecay(dt) {
    if (avalancheRiskTimer > 0) {
      avalancheRiskTimer -= dt;
      if (avalancheRiskTimer <= 0) {
        avalancheRisk = Math.max(0, avalancheRisk - 1);
        if (avalancheRisk > 0) avalancheRiskTimer = 20;
      }
    }

    // Near cliff shot counter timeout
    if (nearCliffShotTimer > 0) {
      nearCliffShotTimer -= dt;
      if (nearCliffShotTimer <= 0) {
        nearCliffShotCount = 0;
      }
    }
  }

  // ── Mission Activation ────────────────────────────────────────

  function activateMission() {
    if (missionActive) return;
    missionActive = true;
    missionSuccess = false;
    missionFailed = false;

    // Remove old end screen if restarting
    var oldEnd = document.getElementById('avalanche-rescue-end');
    if (oldEnd && oldEnd.parentNode) oldEnd.parentNode.removeChild(oldEnd);

    buildEnvironment();
    spawnSurvivors();
    spawnLooters();
    spawnEquipment();
    buildHUD();

    // Position player camera
    var cam = getCamera();
    if (cam) {
      cam.position.set(0, 1.7, 30);
      cam.rotation.set(0, Math.PI, 0);
    }

    showHudMessage('AVALANCHE RESCUE — Locate and dig out 8+ survivors before time runs out!');
  }

  // ── Public API: init ──────────────────────────────────────────

  function init(scene) {
    _scene = scene || null;
    setupKeys();
  }

  // ── Public API: update ────────────────────────────────────────

  function update(dt) {
    if (!missionActive) return;

    dt = dt || 0.016;

    // Timer
    missionTimer -= dt;

    // Cooldowns
    if (playerFireCooldown > 0) playerFireCooldown -= dt;

    // AI
    for (var i = 0; i < looters.length; i++) {
      updateLooterAI(looters[i], dt);
    }
    updateLeaderAI(dt);

    // Survivors
    updateSurvivors(dt);

    // Physics
    updateSlideBlocks(dt);

    // Flares
    updateFlares(dt);

    // Pickups
    updatePickups(dt);

    // Avalanche risk
    updateAvalancheRiskDecay(dt);

    // HUD
    updateHUD(dt);

    // Win/Lose
    checkEndConditions();
  }

  // ── Public API: reset ─────────────────────────────────────────

  function reset() {
    missionActive = false;
    missionSuccess = false;
    missionFailed = false;
    missionTimer = MISSION_DURATION;
    playerHP = PLAYER_HP_MAX;
    playerFireCooldown = 0;

    // Remove all spawned objects
    for (var i = 0; i < _objects.length; i++) {
      var sc = getScene();
      if (sc) sc.remove(_objects[i]);
    }
    _objects = [];

    survivors = [];
    looters = [];
    gangLeader = null;
    leaderDetectTimer = -1;
    reinforcementsSpawned = false;
    digTarget = null;
    digTimer = 0;
    medTarget = null;
    medTimer = 0;
    survivorsRescued = 0;
    flares = [];
    flarePickups = [];
    medKitPickups = [];
    flareCount = 3;
    medKitCount = 2;
    debrisBlocks = [];
    slideBlocks = [];
    nearCliffShotCount = 0;
    nearCliffShotTimer = 0;
    avalancheRisk = 0;
    avalancheRiskTimer = 0;
    lzMesh = null;
    lzMarker = null;
    heliMesh = null;
    heliLanded = false;
    heliTimer = -1;

    // Remove HUD
    var hudEl = document.getElementById('avalanche-rescue-hud');
    if (hudEl && hudEl.parentNode) hudEl.parentNode.removeChild(hudEl);
    var msgEl = document.getElementById('avalanche-rescue-msg');
    if (msgEl && msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
    var helpEl = document.getElementById('avalanche-rescue-help');
    if (helpEl && helpEl.parentNode) helpEl.parentNode.removeChild(helpEl);
    var endEl = document.getElementById('avalanche-rescue-end');
    if (endEl && endEl.parentNode) endEl.parentNode.removeChild(endEl);

    hudElement = null;
    _msgEl = null;
    _msgTimer = 0;
  }

  // ── Export ────────────────────────────────────────────────────

  return { init: init, update: update, reset: reset };

}());
