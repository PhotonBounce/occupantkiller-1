// ghost-ops.js — Ghost Ops stealth/action module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, Three.js as global THREE
//
// Activation: G+O simultaneous keypress (both keys within 400ms)
//
// Public API:
//   GhostOps.init(scene, camera)
//   GhostOps.update(delta)
//   GhostOps.reset()

window.GhostOps = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants

  // Activation
  var ACTIVATION_WINDOW        = 400;        // ms

  // Scene
  var FOG_COLOR                = 0x001100;
  var FOG_NEAR                 = 5;
  var FOG_FAR                  = 50;
  var AMBIENT_INTENSITY        = 0.2;

  // Facility layout
  var FACILITY_ORIGIN_X        = 0;
  var FACILITY_ORIGIN_Z        = 0;
  var FENCE_HALF               = 60;         // perimeter half-size

  // Silo
  var SILO_RADIUS              = 6;
  var SILO_HEIGHT              = 30;
  var SILO_COLOR               = 0x334455;
  var SILO_X                   = 0;
  var SILO_Z                   = -30;

  // Control bunker
  var BUNKER_W                 = 20;
  var BUNKER_H                 = 5;
  var BUNKER_D                 = 15;
  var BUNKER_COLOR             = 0x445533;
  var BUNKER_X                 = -20;
  var BUNKER_Z                 = -10;

  // Barracks
  var BARRACKS_W               = 18;
  var BARRACKS_H               = 4;
  var BARRACKS_D               = 10;
  var BARRACKS_COLOR           = 0x556644;
  var BARRACKS_X               = 25;
  var BARRACKS_Z               = 10;

  // Generator
  var GEN_W                    = 5;
  var GEN_H                    = 3;
  var GEN_D                    = 4;
  var GEN_COLOR                = 0x333333;
  var GEN_X                    = 30;
  var GEN_Z                    = -20;

  // Guard towers
  var TOWER_W                  = 4;
  var TOWER_H                  = 12;
  var TOWER_D                  = 4;
  var TOWER_TOP_W              = 5;
  var TOWER_TOP_H              = 3;
  var TOWER_TOP_D              = 5;
  var TOWER_COLOR              = 0x556655;
  var TOWER_1_X                = -55;
  var TOWER_1_Z                = -55;
  var TOWER_2_X                = 55;
  var TOWER_2_Z                = -55;

  // Searchlights
  var SEARCHLIGHT_COUNT        = 5;
  var SEARCHLIGHT_RADIUS       = 0.4;
  var SEARCHLIGHT_HEIGHT       = 3;
  var SEARCHLIGHT_COLOR        = 0xffff88;
  var SEARCHLIGHT_CONE_R_TOP   = 0.1;
  var SEARCHLIGHT_CONE_R_BOT   = 3;
  var SEARCHLIGHT_CONE_H       = 8;
  var SEARCHLIGHT_ROTATE_SPEED = 0.4;        // rad/s
  var SEARCHLIGHT_DETECT_RANGE = 15;

  // Exfil / helicopter LZ
  var EXFIL_X                  = 0;
  var EXFIL_Z                  = 55;
  var EXFIL_RADIUS             = 6;

  // Radio pickup (in barracks)
  var RADIO_X                  = BARRACKS_X;
  var RADIO_Z                  = BARRACKS_Z;

  // Guard
  var GUARD_COUNT              = 15;
  var GUARD_COLOR              = 0x334488;
  var GUARD_FLASHLIGHT_COLOR   = 0xffff44;
  var GUARD_MOVE_SPEED         = 2.8;
  var GUARD_DETECT_RANGE       = 12;
  var GUARD_HP                 = 50;
  var GUARD_SOUND_REACT_RANGE  = 8;

  // Commander
  var COMMANDER_COLOR          = 0x882222;
  var COMMANDER_HP             = 400;
  var COMMANDER_X              = -20;
  var COMMANDER_Z              = -8;

  // Explosive charges
  var CHARGE_PLANT_DURATION    = 5;          // seconds hold
  var CHARGE_PLANT_RANGE       = 3;
  var CHARGE_COUNT_REQUIRED    = 2;

  // Terminal hack
  var HACK_DURATION            = 8;          // seconds hold
  var HACK_RANGE               = 4;
  var TERMINAL_X               = BUNKER_X + 2;
  var TERMINAL_Z               = BUNKER_Z;

  // Generator destroy
  var GEN_DESTROY_HOLD         = 3;          // seconds
  var GEN_DESTROYED_DURATION   = 300;        // 5 min in seconds
  var GEN_LIGHT_REDUCTION      = 0.5;

  // Ghost abilities
  var CLOAK_DURATION           = 6;          // seconds
  var CLOAK_RECHARGE           = 60;         // seconds
  var PISTOL_DAMAGE            = 20;
  var PISTOL_RANGE             = 30;
  var KNIFE_RANGE              = 1.5;

  // Detection / alerts
  var ALERT_SUSPICIOUS_TIME    = 3;          // seconds suspicious before ALARM
  var ALARM_LOSE_TIME          = 180;        // 3 minutes of alarm = lose
  var CROUCH_SOUND_FACTOR      = 0.4;        // sound radius multiplier when crouching

  // Player
  var PLAYER_HP                = 100;
  var PLAYER_MOVE_SPEED        = 5;
  var PLAYER_CROUCH_SPEED      = 2.5;
  var PLAYER_HEIGHT            = 1.7;
  var PLAYER_CROUCH_HEIGHT     = 0.9;
  var PLAYER_SOUND_RADIUS      = 8;          // upright movement noise radius

  // Colours
  var DETECTION_ZONE_COLOR     = 0xffff00;
  var EXFIL_COLOR              = 0x00ff88;
  var CHARGE_COLOR             = 0xff4400;
  var TERMINAL_COLOR           = 0x00aaff;
  var RADIO_COLOR              = 0x44ff44;
  var GEN_GLOW_COLOR           = 0xff8800;

  // Alert levels
  var ALERT_UNDETECTED         = 'UNDETECTED';
  var ALERT_SUSPICIOUS         = 'SUSPICIOUS';
  var ALERT_ALARM              = 'ALARM';

  // Missile states
  var MISSILE_UNARMED          = 'UNARMED';
  var MISSILE_1CHARGE          = '1 CHARGE';
  var MISSILE_ARMED            = 'ARMED';
  var MISSILE_ABORTED          = 'ABORTED';

  // HUD ID
  var HUD_ID                   = 'ghost-ops-hud';

  // ─────────────────────────────────────────────── module state

  var _scene             = null;
  var _camera            = null;
  var _active            = false;

  // Key activation
  var _gPressTime        = 0;
  var _oPressTime        = 0;
  var _keysDown          = {};

  // Meshes / objects
  var _facilityRoot      = null;
  var _siloMesh          = null;
  var _bunkerMesh        = null;
  var _barracksMesh      = null;
  var _genMesh           = null;
  var _tower1            = null;
  var _tower2            = null;
  var _fenceLines        = null;
  var _exfilMarker       = null;
  var _radioMesh         = null;
  var _terminalMesh      = null;
  var _chargeSite1Mesh   = null;
  var _chargeSite2Mesh   = null;

  // Lights
  var _ambientLight      = null;
  var _facilityLights    = [];
  var _searchlights      = [];   // [{mesh, cone, light, angle}]
  var _guardFlashlights  = [];   // parallel to _guards

  // Guards
  var _guards            = [];   // [{mesh, hp, alive, state, patrolPts, ptIdx, flashlight, isCommander, aware, awareTimer, pos}]
  var _commander         = null; // reference into _guards

  // Player state
  var _playerPos         = null; // THREE.Vector3
  var _playerHP          = PLAYER_HP;
  var _isCrouching       = false;
  var _isAiming          = false;
  var _cloakActive       = false;
  var _cloakTimeLeft     = 0;
  var _cloakRechargeLeft = 0;
  var _hasRadio          = false;
  var _atExfil           = false;

  // Mission progress
  var _alertLevel        = ALERT_UNDETECTED;
  var _suspiciousTimer   = 0;
  var _alarmTimer        = 0;
  var _chargesPlanted    = 0;
  var _terminalHacked    = false;
  var _genDestroyed      = false;
  var _genDestroyTimer   = 0;
  var _commanderDead     = false;
  var _commanderSilent   = false;
  var _missileState      = MISSILE_UNARMED;
  var _missionTime       = 0;

  // Interaction progress
  var _plantingCharge    = false;
  var _plantTimer        = 0;
  var _hackingTerminal   = false;
  var _hackTimer         = 0;
  var _destroyingGen     = false;
  var _destroyTimer      = 0;
  var _callingHeli       = false;
  var _heliTimer         = 0;

  // Win/lose
  var _missionOver       = false;
  var _missionWon        = false;
  var _missionLost       = false;

  // Ambient / fog saved state for restore
  var _savedFog          = null;
  var _savedBackground   = null;

  // Noise events
  var _noiseEvents       = [];   // [{x, z, radius, timer}]

  // Additional guards spawned on loud commander kill
  var _reinforcementsSpawned = false;

  // ─────────────────────────────────────────────── helpers

  function _vec3(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _makeMat(color, transparent, opacity) {
    return new THREE.MeshLambertMaterial({
      color: color,
      transparent: !!transparent,
      opacity: (opacity !== undefined) ? opacity : 1.0
    });
  }

  function _makeBox(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeCylinder(rTop, rBot, h, color, x, y, z, segs) {
    var geo  = new THREE.CylinderGeometry(rTop, rBot, h, segs || 16);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeSphere(r, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, 10, 10);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeCone(rBot, h, color, x, y, z) {
    var geo  = new THREE.ConeGeometry(rBot, h, 12);
    var mat  = _makeMat(color, true, 0.22);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Build fence using LineSegments
  function _buildFence(scene) {
    var pts = [];
    var h   = 0.5;
    var n   = FENCE_HALF;
    // Bottom rail
    pts.push(-n, h, -n,  n, h, -n);
    pts.push( n, h, -n,  n, h,  n);
    pts.push( n, h,  n, -n, h,  n);
    pts.push(-n, h,  n, -n, h, -n);
    // Top rail
    pts.push(-n, 3, -n,  n, 3, -n);
    pts.push( n, 3, -n,  n, 3,  n);
    pts.push( n, 3,  n, -n, 3,  n);
    pts.push(-n, 3,  n, -n, 3, -n);
    // Vertical posts every 10 units
    var step = 10;
    var i;
    for (i = -n; i <= n; i += step) {
      pts.push(i, h, -n,  i, 3, -n);
      pts.push(i, h,  n,  i, 3,  n);
      pts.push(-n, h, i, -n, 3, i);
      pts.push( n, h, i,  n, 3, i);
    }
    var geo = new THREE.BufferGeometry();
    var verts = new Float32Array(pts);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var mat  = new THREE.LineBasicMaterial({ color: 0x889988 });
    var lines = new THREE.LineSegments(geo, mat);
    scene.add(lines);
    return lines;
  }

  // Build guard tower
  function _buildTower(scene, x, z) {
    var root = new THREE.Object3D();
    // Shaft
    var shaft = _makeBox(TOWER_W, TOWER_H, TOWER_D, TOWER_COLOR, 0, TOWER_H / 2, 0);
    root.add(shaft);
    // Top cabin
    var cabin = _makeBox(TOWER_TOP_W, TOWER_TOP_H, TOWER_TOP_D, 0x667766, 0, TOWER_H + TOWER_TOP_H / 2, 0);
    root.add(cabin);
    // Ladder (visual lines)
    var lPts = [];
    var li;
    for (li = 1; li < TOWER_H; li += 1.5) {
      lPts.push(-0.5, li, TOWER_D / 2 + 0.1, 0.5, li, TOWER_D / 2 + 0.1);
    }
    lPts.push(-0.5, 0, TOWER_D / 2 + 0.1, -0.5, TOWER_H, TOWER_D / 2 + 0.1);
    lPts.push( 0.5, 0, TOWER_D / 2 + 0.1,  0.5, TOWER_H, TOWER_D / 2 + 0.1);
    var lGeo  = new THREE.BufferGeometry();
    var lVerts = new Float32Array(lPts);
    lGeo.setAttribute('position', new THREE.BufferAttribute(lVerts, 3));
    var lMat  = new THREE.LineBasicMaterial({ color: 0x556655 });
    root.add(new THREE.LineSegments(lGeo, lMat));
    root.position.set(x, 0, z);
    scene.add(root);
    return root;
  }

  // Build one searchlight assembly (base + cone)
  function _buildSearchlight(scene, x, z) {
    var base = _makeCylinder(SEARCHLIGHT_RADIUS, SEARCHLIGHT_RADIUS, SEARCHLIGHT_HEIGHT, 0x445544, x, SEARCHLIGHT_HEIGHT / 2, z, 8);
    scene.add(base);
    // Detection cone (points downward from top of base)
    var cone = _makeCone(SEARCHLIGHT_CONE_R_BOT, SEARCHLIGHT_CONE_H, SEARCHLIGHT_COLOR, x, SEARCHLIGHT_HEIGHT + SEARCHLIGHT_CONE_H / 2, z);
    cone.rotation.x = Math.PI; // point downward
    scene.add(cone);
    // Point light at beam tip
    var light = new THREE.PointLight(SEARCHLIGHT_COLOR, 1.2, SEARCHLIGHT_DETECT_RANGE);
    light.position.set(x, 1.5, z);
    scene.add(light);
    return { base: base, cone: cone, light: light, angle: Math.random() * Math.PI * 2 };
  }

  // Build guard body
  function _buildGuardMesh(color) {
    var root = new THREE.Object3D();
    // Body
    var body = _makeBox(0.6, 1.0, 0.4, color, 0, 0.5, 0);
    root.add(body);
    // Head
    var head = _makeSphere(0.25, 0xddbb99, 0, 1.25, 0);
    root.add(head);
    // Left arm
    var larm = _makeBox(0.2, 0.7, 0.2, color, -0.4, 0.5, 0);
    root.add(larm);
    // Right arm
    var rarm = _makeBox(0.2, 0.7, 0.2, color, 0.4, 0.5, 0);
    root.add(rarm);
    // Left leg
    var lleg = _makeBox(0.22, 0.8, 0.22, 0x222233, -0.18, -0.4, 0);
    root.add(lleg);
    // Right leg
    var rleg = _makeBox(0.22, 0.8, 0.22, 0x222233, 0.18, -0.4, 0);
    root.add(rleg);
    return root;
  }

  // Build player capsule (invisible by default, used for collision reference only)
  function _buildPlayerMarker(scene) {
    var mesh = _makeCylinder(0.3, 0.3, PLAYER_HEIGHT, 0x00ff00, 0, PLAYER_HEIGHT / 2, 0, 8);
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  }

  // ─────────────────────────────────────────────── facility construction

  function _buildFacility(scene) {
    _facilityRoot = new THREE.Object3D();
    scene.add(_facilityRoot);

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(140, 0.3, 140);
    var groundMat = _makeMat(0x1a2b1a);
    var ground    = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.15, 0);
    scene.add(ground);

    // Perimeter fence
    _fenceLines = _buildFence(scene);

    // Guard towers
    _tower1 = _buildTower(scene, TOWER_1_X, TOWER_1_Z);
    _tower2 = _buildTower(scene, TOWER_2_X, TOWER_2_Z);

    // Missile silo
    _siloMesh = _makeCylinder(SILO_RADIUS, SILO_RADIUS, SILO_HEIGHT, SILO_COLOR, SILO_X, SILO_HEIGHT / 2, SILO_Z);
    scene.add(_siloMesh);
    // Silo cap
    var siloCap = _makeCylinder(SILO_RADIUS + 0.5, SILO_RADIUS + 0.5, 1.5, 0x223344, SILO_X, SILO_HEIGHT + 0.75, SILO_Z);
    scene.add(siloCap);
    // Silo base ring markers for charge sites
    _chargeSite1Mesh = _makeCylinder(0.5, 0.5, 0.3, CHARGE_COLOR, SILO_X - 5, 0.15, SILO_Z);
    _chargeSite1Mesh.userData.chargeIdx = 0;
    scene.add(_chargeSite1Mesh);
    _chargeSite2Mesh = _makeCylinder(0.5, 0.5, 0.3, CHARGE_COLOR, SILO_X + 5, 0.15, SILO_Z);
    _chargeSite2Mesh.userData.chargeIdx = 1;
    scene.add(_chargeSite2Mesh);

    // Control bunker
    _bunkerMesh = _makeBox(BUNKER_W, BUNKER_H, BUNKER_D, BUNKER_COLOR, BUNKER_X, BUNKER_H / 2, BUNKER_Z);
    scene.add(_bunkerMesh);
    // Bunker antenna
    var ant = _makeCylinder(0.1, 0.1, 4, 0x888888, BUNKER_X + 8, BUNKER_H + 2, BUNKER_Z - 5);
    scene.add(ant);

    // Hack terminal marker (inside bunker, raised slightly)
    _terminalMesh = _makeBox(1.2, 1.5, 0.4, TERMINAL_COLOR, TERMINAL_X, BUNKER_H / 2 + 0.75, TERMINAL_Z);
    scene.add(_terminalMesh);
    // Terminal screen glow
    var tScreen = _makeBox(0.9, 0.7, 0.1, 0x0066ff, TERMINAL_X, BUNKER_H / 2 + 1.0, TERMINAL_Z - 0.3);
    scene.add(tScreen);

    // Barracks
    _barracksMesh = _makeBox(BARRACKS_W, BARRACKS_H, BARRACKS_D, BARRACKS_COLOR, BARRACKS_X, BARRACKS_H / 2, BARRACKS_Z);
    scene.add(_barracksMesh);
    // Barracks door
    var door = _makeBox(1.5, 2.5, 0.2, 0x334433, BARRACKS_X - 8, BARRACKS_H / 2 - 0.75, BARRACKS_Z - BARRACKS_D / 2 - 0.1);
    scene.add(door);

    // Radio pickup inside barracks
    _radioMesh = _makeBox(0.6, 0.4, 0.3, RADIO_COLOR, RADIO_X, BARRACKS_H / 2 + 0.2, RADIO_Z);
    scene.add(_radioMesh);

    // Generator building
    _genMesh = _makeBox(GEN_W, GEN_H, GEN_D, GEN_COLOR, GEN_X, GEN_H / 2, GEN_Z);
    scene.add(_genMesh);
    // Generator exhaust pipe
    var pipe = _makeCylinder(0.2, 0.2, 2, 0x444444, GEN_X + 1, GEN_H + 1, GEN_Z);
    scene.add(pipe);

    // Exfil LZ (helicopter pad) at north end
    _exfilMarker = _makeCylinder(EXFIL_RADIUS, EXFIL_RADIUS, 0.1, EXFIL_COLOR, EXFIL_X, 0.05, EXFIL_Z, 20);
    scene.add(_exfilMarker);
    // Helipad H marking (LineSegments)
    var hPts = [
      -3, 0.12, EXFIL_Z,  3, 0.12, EXFIL_Z,
      -3, 0.12, EXFIL_Z, -3, 0.12, EXFIL_Z - 4,
       3, 0.12, EXFIL_Z,  3, 0.12, EXFIL_Z - 4,
      -3, 0.12, EXFIL_Z - 2,  3, 0.12, EXFIL_Z - 2
    ];
    var hGeo   = new THREE.BufferGeometry();
    var hVerts = new Float32Array(hPts);
    hGeo.setAttribute('position', new THREE.BufferAttribute(hVerts, 3));
    var hMat   = new THREE.LineBasicMaterial({ color: 0xffffff });
    scene.add(new THREE.LineSegments(hGeo, hMat));

    // Facility point lights (yellow warm detection zones)
    var facilityLightPositions = [
      [BUNKER_X, 8, BUNKER_Z],
      [BARRACKS_X, 6, BARRACKS_Z],
      [SILO_X, 10, SILO_Z],
      [GEN_X, 5, GEN_Z],
      [0, 5, 0]
    ];
    var fli;
    for (fli = 0; fli < facilityLightPositions.length; fli++) {
      var flPos   = facilityLightPositions[fli];
      var fl      = new THREE.PointLight(0xffdd44, 1.0, 20);
      fl.position.set(flPos[0], flPos[1], flPos[2]);
      scene.add(fl);
      _facilityLights.push(fl);
      // Visual cone for each light
      var flCone = _makeCone(6, 12, DETECTION_ZONE_COLOR, flPos[0], flPos[1] - 6, flPos[2]);
      flCone.rotation.x = Math.PI;
      scene.add(flCone);
    }
  }

  // ─────────────────────────────────────────────── searchlights

  function _buildSearchlights(scene) {
    var positions = [
      [-40, 0, -55],
      [ 40, 0, -55],
      [-55, 0,   0],
      [ 55, 0,   0],
      [  0, 0, -55]
    ];
    var si;
    for (si = 0; si < SEARCHLIGHT_COUNT; si++) {
      var sp = positions[si];
      var sl = _buildSearchlight(scene, sp[0], sp[2]);
      sl.offsetAngle = (Math.PI * 2 / SEARCHLIGHT_COUNT) * si;
      _searchlights.push(sl);
    }
  }

  // ─────────────────────────────────────────────── guards

  function _spawnGuard(scene, x, z, isCommander, patrolPts) {
    var color = isCommander ? COMMANDER_COLOR : GUARD_COLOR;
    var mesh  = _buildGuardMesh(color);
    mesh.position.set(x, 0, z);
    scene.add(mesh);

    // Flashlight attached to guard
    var fl   = new THREE.PointLight(GUARD_FLASHLIGHT_COLOR, 0.8, 8);
    fl.position.set(x, 1.5, z);
    scene.add(fl);
    _guardFlashlights.push(fl);

    var guard = {
      mesh:        mesh,
      flashlight:  fl,
      hp:          isCommander ? COMMANDER_HP : GUARD_HP,
      alive:       true,
      isCommander: isCommander,
      patrolPts:   patrolPts,
      ptIdx:       0,
      ptDir:       1,
      state:       'patrol',   // patrol | investigate | alert | dead
      aware:       false,
      awareTimer:  0,
      investigatePos: null,
      investigateTimer: 0,
      pos:         new THREE.Vector3(x, 0, z)
    };

    if (isCommander) {
      _commander = guard;
    }

    _guards.push(guard);
    return guard;
  }

  function _spawnAllGuards(scene) {
    // Patrol routes: sets of waypoints
    var routes = [
      // Guards around the fence perimeter
      [[-50,0,-50],[-50,0,50],[50,0,50],[50,0,-50]],
      [[-45,0,0],[-45,0,-45],[0,0,-45],[0,0,0]],
      [[50,0,0],[50,0,-50],[0,0,-50],[0,0,0]],
      [[-30,0,30],[-30,0,-30],[30,0,-30],[30,0,30]],
      [[10,0,10],[10,0,-10],[-10,0,-10],[-10,0,10]],
      // Guards around silo
      [[SILO_X-8,0,SILO_Z],[SILO_X,0,SILO_Z-8],[SILO_X+8,0,SILO_Z],[SILO_X,0,SILO_Z+8]],
      [[SILO_X-5,0,SILO_Z+5],[SILO_X+5,0,SILO_Z+5],[SILO_X+5,0,SILO_Z-5],[SILO_X-5,0,SILO_Z-5]],
      // Guards at bunker
      [[BUNKER_X-8,0,BUNKER_Z],[BUNKER_X+8,0,BUNKER_Z],[BUNKER_X,0,BUNKER_Z+6]],
      [[BUNKER_X,0,BUNKER_Z-8],[BUNKER_X-5,0,BUNKER_Z+5],[BUNKER_X+5,0,BUNKER_Z-5]],
      // Guards at barracks
      [[BARRACKS_X-6,0,BARRACKS_Z],[BARRACKS_X+6,0,BARRACKS_Z],[BARRACKS_X,0,BARRACKS_Z+6]],
      // Guards at generator
      [[GEN_X-5,0,GEN_Z],[GEN_X+5,0,GEN_Z],[GEN_X,0,GEN_Z+5],[GEN_X,0,GEN_Z-5]],
      // Tower guards
      [[TOWER_1_X,0,TOWER_1_Z],[TOWER_1_X+10,0,TOWER_1_Z],[TOWER_1_X,0,TOWER_1_Z+10]],
      [[TOWER_2_X,0,TOWER_2_Z],[TOWER_2_X-10,0,TOWER_2_Z],[TOWER_2_X,0,TOWER_2_Z+10]],
      // Roaming guards
      [[-20,0,20],[-20,0,-20],[20,0,-20],[20,0,20]],
      [[0,0,30],[0,0,-20],[15,0,-20],[15,0,30]]
    ];

    var gi;
    for (gi = 0; gi < GUARD_COUNT; gi++) {
      var route  = routes[gi % routes.length];
      var startPt = route[gi % route.length];
      _spawnGuard(scene, startPt[0], startPt[2], false, route);
    }

    // Commander
    _spawnGuard(scene, COMMANDER_X, COMMANDER_Z, true, [
      [COMMANDER_X, 0, COMMANDER_Z],
      [COMMANDER_X + 10, 0, COMMANDER_Z],
      [COMMANDER_X + 10, 0, COMMANDER_Z + 10],
      [COMMANDER_X, 0, COMMANDER_Z + 10]
    ]);
  }

  // ─────────────────────────────────────────────── scene setup

  function _setupScene(scene) {
    // Save existing fog and background
    _savedFog        = scene.fog;
    _savedBackground = scene.background;

    // Night sky
    scene.background = new THREE.Color(0x000808);
    scene.fog        = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

    // Ambient (dim)
    _ambientLight    = new THREE.AmbientLight(0x113311, AMBIENT_INTENSITY);
    scene.add(_ambientLight);

    // Stars (SphereGeometry spheres as tiny points)
    var starCount = 80;
    var si2;
    for (si2 = 0; si2 < starCount; si2++) {
      var starMesh = _makeSphere(0.08, 0xffffff,
        (Math.random() - 0.5) * 200,
        20 + Math.random() * 30,
        (Math.random() - 0.5) * 200);
      scene.add(starMesh);
    }
  }

  // ─────────────────────────────────────────────── HUD

  function _getOrCreateHud() {
    var el = document.getElementById(HUD_ID);
    if (!el) {
      el            = document.createElement('div');
      el.id         = HUD_ID;
      el.style.position   = 'fixed';
      el.style.top        = '8px';
      el.style.left       = '50%';
      el.style.transform  = 'translateX(-50%)';
      el.style.background = 'rgba(0,20,0,0.82)';
      el.style.color      = '#00ff44';
      el.style.fontFamily = 'monospace';
      el.style.fontSize   = '13px';
      el.style.padding    = '6px 14px';
      el.style.borderRadius = '4px';
      el.style.border     = '1px solid #00aa44';
      el.style.zIndex     = '9999';
      el.style.pointerEvents = 'none';
      el.style.whiteSpace = 'nowrap';
      document.body.appendChild(el);
    }
    return el;
  }

  function _updateHud() {
    var el = _getOrCreateHud();

    // Timer
    var totalSec = Math.floor(_missionTime);
    var mm       = Math.floor(totalSec / 60);
    var ss       = totalSec % 60;
    var timerStr = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;

    // Cloak status
    var cloakStr;
    if (_cloakActive) {
      cloakStr = 'ACTIVE ' + Math.ceil(_cloakTimeLeft) + 's';
    } else if (_cloakRechargeLeft > 0) {
      cloakStr = Math.ceil(_cloakRechargeLeft) + 's';
    } else {
      cloakStr = 'READY';
    }

    // Alert color
    var alertColor = '#00ff44';
    if (_alertLevel === ALERT_SUSPICIOUS) {
      alertColor = '#ffff00';
    } else if (_alertLevel === ALERT_ALARM) {
      alertColor = '#ff2200';
    }

    // Guard count (alive)
    var aliveCount = 0;
    var gi2;
    for (gi2 = 0; gi2 < _guards.length; gi2++) {
      if (_guards[gi2].alive) { aliveCount++; }
    }

    el.style.color = alertColor;

    var statusLine = 'GHOST OPS' +
      ' [STATUS: ' + _alertLevel + ']' +
      ' [MISSILE: ' + _missileState + ']' +
      ' [COMMANDER: ' + (_commanderDead ? 'DEAD' : 'ALIVE') + ']' +
      ' [TIMER: ' + timerStr + ']' +
      ' [CLOAK: ' + cloakStr + ']' +
      ' [GUARDS: ' + aliveCount + ']' +
      ' [HP: ' + _playerHP + ']';

    // Progress sub-line
    var progressLine = '';
    if (_plantingCharge) {
      progressLine = ' | PLANTING CHARGE: ' + Math.floor(_plantTimer * 10) / 10 + 's';
    } else if (_hackingTerminal) {
      progressLine = ' | HACKING TERMINAL: ' + Math.floor(_hackTimer * 10) / 10 + 's';
    } else if (_destroyingGen) {
      progressLine = ' | DESTROYING GEN: ' + Math.floor(_destroyTimer * 10) / 10 + 's';
    } else if (_callingHeli) {
      progressLine = ' | CALLING HELI: ' + Math.floor(_heliTimer * 10) / 10 + 's';
    }

    // Objective hints
    var objLine = '';
    if (_chargesPlanted < CHARGE_COUNT_REQUIRED) {
      objLine += ' [OBJ: Plant charges at silo (' + _chargesPlanted + '/' + CHARGE_COUNT_REQUIRED + ')]';
    } else if (!_terminalHacked) {
      objLine += ' [OBJ: Hack terminal in bunker]';
    } else if (!_hasRadio) {
      objLine += ' [OBJ: Collect radio from barracks]';
    } else if (!_atExfil) {
      objLine += ' [OBJ: Reach helicopter LZ]';
    }

    var winLoseStr = '';
    if (_missionWon)  { winLoseStr = ' *** MISSION COMPLETE ***'; el.style.color = '#00ff88'; }
    if (_missionLost) { winLoseStr = ' *** MISSION FAILED ***'; el.style.color = '#ff0000'; }

    el.innerHTML = statusLine + progressLine + objLine + winLoseStr;
  }

  function _removeHud() {
    var el = document.getElementById(HUD_ID);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // ─────────────────────────────────────────────── key handlers

  function _onKeyDown(e) {
    if (!_active) { return; }
    var key = e.key ? e.key.toLowerCase() : '';
    _keysDown[key] = true;

    // Crouch toggle
    if (key === 'c') {
      _isCrouching = !_isCrouching;
    }

    // Cloak (V)
    if (key === 'v') {
      _activateCloak();
    }

    // Knife takedown (E)
    if (key === 'e') {
      _tryInteract();
    }

    // Aim (Q - hold handled in update)
    if (key === 'q') {
      _isAiming = true;
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    _keysDown[key] = false;

    // Activation check: G+O
    if (key === 'g') {
      _gPressTime = Date.now();
    }
    if (key === 'o') {
      _oPressTime = Date.now();
    }
    if (!_active) {
      if (Math.abs(_gPressTime - _oPressTime) < ACTIVATION_WINDOW && _gPressTime > 0 && _oPressTime > 0) {
        _activate();
      }
    }

    if (key === 'q') {
      _isAiming = false;
    }
  }

  // ─────────────────────────────────────────────── abilities

  function _activateCloak() {
    if (_cloakActive || _cloakRechargeLeft > 0) { return; }
    _cloakActive   = true;
    _cloakTimeLeft = CLOAK_DURATION;
  }

  function _shootSilenced() {
    if (!_isAiming || !_active) { return; }
    // Find closest guard in front within pistol range
    var camDir = _vec3(0, 0, -1);
    camDir.applyQuaternion(_camera.quaternion);
    camDir.y = 0;
    camDir.normalize();

    var best    = null;
    var bestD   = PISTOL_RANGE;
    var gi3;
    for (gi3 = 0; gi3 < _guards.length; gi3++) {
      var g = _guards[gi3];
      if (!g.alive) { continue; }
      var gx  = g.pos.x;
      var gz  = g.pos.z;
      var px  = _playerPos.x;
      var pz  = _playerPos.z;
      var d   = _dist2D(px, pz, gx, gz);
      if (d > PISTOL_RANGE) { continue; }
      // Check roughly in aim direction
      var toGx = gx - px;
      var toGz = gz - pz;
      var len  = Math.sqrt(toGx * toGx + toGz * toGz);
      if (len < 0.01) { continue; }
      var dot  = (camDir.x * toGx / len) + (camDir.z * toGz / len);
      if (dot < 0.6) { continue; }
      if (d < bestD) {
        bestD = d;
        best  = g;
      }
    }

    if (best) {
      best.hp -= PISTOL_DAMAGE;
      if (best.hp <= 0) {
        _killGuard(best, true);
      }
      // Silenced — no noise, no alert escalation unless in alarm state
    }
  }

  function _tryInteract() {
    if (!_active) { return; }
    var px = _playerPos.x;
    var pz = _playerPos.z;

    // Knife takedown: find unaware guard within knife range
    var gi4;
    for (gi4 = 0; gi4 < _guards.length; gi4++) {
      var g = _guards[gi4];
      if (!g.alive) { continue; }
      var d = _dist2D(px, pz, g.pos.x, g.pos.z);
      if (d <= KNIFE_RANGE && !g.aware) {
        _killGuard(g, true);   // silent kill
        return;
      }
    }

    // Check charge plant at silo
    var c1d = _dist2D(px, pz, _chargeSite1Mesh.position.x, _chargeSite1Mesh.position.z);
    var c2d = _dist2D(px, pz, _chargeSite2Mesh.position.x, _chargeSite2Mesh.position.z);
    if (_chargesPlanted === 0 && c1d <= CHARGE_PLANT_RANGE) {
      _plantingCharge = true;
      return;
    }
    if (_chargesPlanted === 1 && c2d <= CHARGE_PLANT_RANGE) {
      _plantingCharge = true;
      return;
    }

    // Check terminal hack
    var td = _dist2D(px, pz, TERMINAL_X, TERMINAL_Z);
    if (!_terminalHacked && td <= HACK_RANGE) {
      _hackingTerminal = true;
      return;
    }

    // Check radio pickup
    if (!_hasRadio) {
      var rd = _dist2D(px, pz, RADIO_X, RADIO_Z);
      if (rd <= 3.0) {
        _hasRadio = true;
        _radioMesh.visible = false;
      }
    }

    // Check generator destroy
    var gd = _dist2D(px, pz, GEN_X, GEN_Z);
    if (!_genDestroyed && gd <= 4.0) {
      _destroyingGen = true;
    }

    // Call heli at exfil
    if (_hasRadio) {
      var ed = _dist2D(px, pz, EXFIL_X, EXFIL_Z);
      if (ed <= EXFIL_RADIUS) {
        _callingHeli = true;
      }
    }
  }

  function _killGuard(guard, silent) {
    guard.alive = false;
    guard.hp    = 0;
    guard.state = 'dead';
    guard.mesh.rotation.z = Math.PI / 2;
    guard.mesh.position.y = -0.2;
    if (guard.flashlight) {
      guard.flashlight.intensity = 0;
    }

    if (guard.isCommander) {
      _commanderDead   = true;
      _commanderSilent = silent;
      if (!silent && !_reinforcementsSpawned) {
        // Loud commander kill spawns 10 more guards
        _reinforcementsSpawned = true;
        _spawnReinforcements(_scene, 10);
        _setAlert(ALERT_ALARM);
      }
    }

    if (!silent) {
      // Gunshot sound — escalate alert
      _addNoise(guard.pos.x, guard.pos.z, 20);
    }
  }

  function _spawnReinforcements(scene, count) {
    var angles = [];
    var ri;
    for (ri = 0; ri < count; ri++) {
      var angle = (Math.PI * 2 / count) * ri;
      var rx    = Math.cos(angle) * 40;
      var rz    = Math.sin(angle) * 40;
      var route = [[rx, 0, rz], [rx * 0.5, 0, rz * 0.5], [0, 0, 0]];
      _spawnGuard(scene, rx, rz, false, route);
    }
  }

  // ─────────────────────────────────────────────── detection / alerts

  function _setAlert(level) {
    if (_alertLevel === level) { return; }
    _alertLevel = level;
    if (level === ALERT_ALARM) {
      // All guards become alert
      var gi5;
      for (gi5 = 0; gi5 < _guards.length; gi5++) {
        if (_guards[gi5].alive) {
          _guards[gi5].aware = true;
          _guards[gi5].state = 'alert';
        }
      }
    }
    if (level !== ALERT_ALARM) {
      _alarmTimer = 0;
    }
  }

  function _addNoise(x, z, radius) {
    _noiseEvents.push({ x: x, z: z, radius: radius, timer: 3.0 });
  }

  function _playerSoundRadius() {
    var r = PLAYER_SOUND_RADIUS;
    if (_isCrouching) { r *= CROUCH_SOUND_FACTOR; }
    if (_cloakActive)  { r *= 0.1; }
    return r;
  }

  // ─────────────────────────────────────────────── guard AI update

  function _updateGuards(delta) {
    var px   = _playerPos.x;
    var pz   = _playerPos.z;
    var gi6;

    for (gi6 = 0; gi6 < _guards.length; gi6++) {
      var g = _guards[gi6];
      if (!g.alive) { continue; }

      // Move along patrol
      if (g.state === 'patrol') {
        var tPt = g.patrolPts[g.ptIdx];
        var tx  = tPt[0];
        var tz  = tPt[2] !== undefined ? tPt[2] : tPt[1]; // handle [x,y,z] or [x,z] patrol points
        // Patrol points stored as [x, y, z]
        tx = tPt[0];
        tz = tPt[2];
        var dx   = tx - g.pos.x;
        var dz   = tz - g.pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.5) {
          g.ptIdx = (g.ptIdx + 1) % g.patrolPts.length;
        } else {
          var speed = GUARD_MOVE_SPEED * delta;
          g.pos.x += (dx / dist) * speed;
          g.pos.z += (dz / dist) * speed;
        }
      } else if (g.state === 'investigate') {
        if (g.investigatePos) {
          var idx = tx; // reuse variable
          var ivx = g.investigatePos.x;
          var ivz = g.investigatePos.z;
          var idx2 = ivx - g.pos.x;
          var idz  = ivz - g.pos.z;
          var id   = Math.sqrt(idx2 * idx2 + idz * idz);
          if (id < 0.5) {
            g.investigateTimer -= delta;
            if (g.investigateTimer <= 0) {
              g.state = 'patrol';
              if (_alertLevel === ALERT_SUSPICIOUS) {
                _setAlert(ALERT_UNDETECTED);
              }
            }
          } else {
            var ispd = GUARD_MOVE_SPEED * 1.5 * delta;
            g.pos.x += (idx2 / id) * ispd;
            g.pos.z += (idz / id) * ispd;
          }
        }
      } else if (g.state === 'alert') {
        // Chase player
        var adx  = px - g.pos.x;
        var adz  = pz - g.pos.z;
        var adst = Math.sqrt(adx * adx + adz * adz);
        if (adst > 0.5) {
          var aspd = GUARD_MOVE_SPEED * 1.8 * delta;
          g.pos.x += (adx / adst) * aspd;
          g.pos.z += (adz / adst) * aspd;
        }
      }

      // Update mesh position
      g.mesh.position.x = g.pos.x;
      g.mesh.position.z = g.pos.z;

      // Face movement direction (simplified)
      if (g.state !== 'dead') {
        var fdx = px - g.pos.x;
        var fdz = pz - g.pos.z;
        if (fdx !== 0 || fdz !== 0) {
          g.mesh.rotation.y = Math.atan2(fdx, fdz);
        }
      }

      // Update flashlight
      if (g.flashlight) {
        g.flashlight.position.set(g.pos.x, 1.5, g.pos.z);
      }

      // Detection check
      if (!_cloakActive) {
        var toPlayerD = _dist2D(g.pos.x, g.pos.z, px, pz);
        var detectRange = GUARD_DETECT_RANGE;
        if (_genDestroyed) { detectRange *= (1 - GEN_LIGHT_REDUCTION); }

        if (toPlayerD < detectRange) {
          if (!g.aware) {
            g.aware     = true;
            g.awareTimer = 0;
          }
        } else if (toPlayerD < GUARD_DETECT_RANGE * 1.5 && _alertLevel === ALERT_ALARM) {
          if (!g.aware) { g.aware = true; }
        } else if (toPlayerD > GUARD_DETECT_RANGE * 1.8) {
          if (g.aware && _alertLevel !== ALERT_ALARM) {
            g.aware = false;
            if (g.state === 'alert') {
              g.state = 'investigate';
              g.investigatePos = _vec3(px, 0, pz);
              g.investigateTimer = 10;
            }
          }
        }

        if (g.aware && g.state !== 'dead') {
          g.awareTimer += delta;
          g.state = 'alert';

          // Escalate alert
          if (_alertLevel === ALERT_UNDETECTED) {
            _suspiciousTimer += delta;
            if (_suspiciousTimer >= ALERT_SUSPICIOUS_TIME) {
              _setAlert(ALERT_SUSPICIOUS);
              _suspiciousTimer = 0;
            } else {
              _alertLevel = ALERT_SUSPICIOUS;
            }
          } else if (_alertLevel === ALERT_SUSPICIOUS) {
            _suspiciousTimer += delta;
            if (_suspiciousTimer >= ALERT_SUSPICIOUS_TIME * 2) {
              _setAlert(ALERT_ALARM);
            }
          }
        }
      } else {
        // Cloaked — guards can't see player
        if (g.aware && _alertLevel !== ALERT_ALARM) {
          g.aware = false;
          g.state = 'patrol';
        }
      }

      // React to noise events
      var noi;
      for (noi = 0; noi < _noiseEvents.length; noi++) {
        var ne   = _noiseEvents[noi];
        var nDist = _dist2D(g.pos.x, g.pos.z, ne.x, ne.z);
        if (nDist <= ne.radius && g.state === 'patrol') {
          g.state          = 'investigate';
          g.investigatePos = _vec3(ne.x, 0, ne.z);
          g.investigateTimer = 8;
          if (_alertLevel === ALERT_UNDETECTED) {
            _setAlert(ALERT_SUSPICIOUS);
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────── searchlight update

  function _updateSearchlights(delta) {
    var si3;
    for (si3 = 0; si3 < _searchlights.length; si3++) {
      var sl = _searchlights[si3];
      sl.angle += SEARCHLIGHT_ROTATE_SPEED * delta;
      var sweepR    = 15;
      var newX      = sl.base.position.x + Math.cos(sl.angle) * sweepR;
      var newZ      = sl.base.position.z + Math.sin(sl.angle) * sweepR;

      // Update cone rotation
      sl.cone.position.x = newX;
      sl.cone.position.z = newZ;
      sl.light.position.x = newX;
      sl.light.position.z = newZ;

      // Detection if player is within searchlight beam
      if (!_cloakActive) {
        var pd = _dist2D(_playerPos.x, _playerPos.z, newX, newZ);
        if (pd < 3) {
          if (_alertLevel === ALERT_UNDETECTED) {
            _setAlert(ALERT_SUSPICIOUS);
          } else if (_alertLevel === ALERT_SUSPICIOUS) {
            _setAlert(ALERT_ALARM);
          }
        }
      }

      // Dim searchlights if generator destroyed
      if (_genDestroyed) {
        sl.light.intensity = 0.3;
      } else {
        sl.light.intensity = 1.2;
      }
    }
  }

  // ─────────────────────────────────────────────── interaction update

  function _updateInteractions(delta) {
    var px = _playerPos.x;
    var pz = _playerPos.z;

    // Planting charge
    if (_plantingCharge && _keysDown['e']) {
      _plantTimer += delta;
      var siteMesh;
      if (_chargesPlanted === 0) { siteMesh = _chargeSite1Mesh; }
      else { siteMesh = _chargeSite2Mesh; }
      var siteD = _dist2D(px, pz, siteMesh.position.x, siteMesh.position.z);
      if (siteD > CHARGE_PLANT_RANGE) {
        // Player moved away
        _plantingCharge = false;
        _plantTimer = 0;
      } else if (_plantTimer >= CHARGE_PLANT_DURATION) {
        _chargesPlanted++;
        _plantTimer = 0;
        _plantingCharge = false;
        siteMesh.material.color.setHex(0x00ff00);
        if (_chargesPlanted === 1) {
          _missileState = MISSILE_1CHARGE;
        } else if (_chargesPlanted >= CHARGE_COUNT_REQUIRED) {
          _missileState = MISSILE_ARMED;
        }
      }
    } else {
      _plantingCharge = false;
      _plantTimer = 0;
    }

    // Hacking terminal
    if (_hackingTerminal && _keysDown['e']) {
      _hackTimer += delta;
      var hackD = _dist2D(px, pz, TERMINAL_X, TERMINAL_Z);
      if (hackD > HACK_RANGE) {
        _hackingTerminal = false;
        _hackTimer = 0;
      } else if (_hackTimer >= HACK_DURATION) {
        _terminalHacked = true;
        _hackTimer = 0;
        _hackingTerminal = false;
        _terminalMesh.material.color.setHex(0x00ff00);
        if (_missileState === MISSILE_ARMED) {
          _missileState = MISSILE_ABORTED;
        }
      }
    } else {
      _hackingTerminal = false;
      _hackTimer = 0;
    }

    // Destroying generator
    if (_destroyingGen && _keysDown['e']) {
      _destroyTimer += delta;
      var genIntD = _dist2D(px, pz, GEN_X, GEN_Z);
      if (genIntD > 4.0) {
        _destroyingGen = false;
        _destroyTimer = 0;
      } else if (_destroyTimer >= GEN_DESTROY_HOLD) {
        _genDestroyed    = true;
        _genDestroyTimer = GEN_DESTROYED_DURATION;
        _destroyingGen   = false;
        _destroyTimer    = 0;
        _genMesh.material.color.setHex(0x111111);
        // All facility lights dim
        var fli2;
        for (fli2 = 0; fli2 < _facilityLights.length; fli2++) {
          _facilityLights[fli2].intensity *= (1 - GEN_LIGHT_REDUCTION);
        }
        // Guards become more alert (patrol increase simulated by reducing detect range threshold)
        // Alert stays same but guards increase patrol speed — handled via guard speed multiplier in state
        if (_alertLevel === ALERT_UNDETECTED) {
          _setAlert(ALERT_SUSPICIOUS);
        }
      }
    } else {
      _destroyingGen = false;
      _destroyTimer  = 0;
    }

    // Gen timer countdown
    if (_genDestroyed && _genDestroyTimer > 0) {
      _genDestroyTimer -= delta;
      if (_genDestroyTimer <= 0) {
        // Lights come back on
        var fli3;
        for (fli3 = 0; fli3 < _facilityLights.length; fli3++) {
          _facilityLights[fli3].intensity /= (1 - GEN_LIGHT_REDUCTION);
        }
        _genDestroyed = false;
      }
    }

    // Calling helicopter
    if (_callingHeli && _hasRadio && _keysDown['e']) {
      _heliTimer += delta;
      var exfilD = _dist2D(px, pz, EXFIL_X, EXFIL_Z);
      if (exfilD > EXFIL_RADIUS) {
        _callingHeli = false;
        _heliTimer   = 0;
      } else if (_heliTimer >= 3.0) {
        _atExfil   = true;
        _callingHeli = false;
        _checkWin();
      }
    } else {
      _callingHeli = false;
      _heliTimer   = 0;
    }

    // Auto-radio pickup when player walks over barracks area
    if (!_hasRadio) {
      var rd2 = _dist2D(px, pz, RADIO_X, RADIO_Z);
      if (rd2 <= 3.5) {
        _hasRadio = true;
        _radioMesh.visible = false;
      }
    }
  }

  // ─────────────────────────────────────────────── cloak update

  function _updateCloak(delta) {
    if (_cloakActive) {
      _cloakTimeLeft -= delta;
      if (_cloakTimeLeft <= 0) {
        _cloakActive       = false;
        _cloakTimeLeft     = 0;
        _cloakRechargeLeft = CLOAK_RECHARGE;
      }
    } else if (_cloakRechargeLeft > 0) {
      _cloakRechargeLeft -= delta;
      if (_cloakRechargeLeft < 0) { _cloakRechargeLeft = 0; }
    }
  }

  // ─────────────────────────────────────────────── noise event cleanup

  function _updateNoise(delta) {
    var i;
    for (i = _noiseEvents.length - 1; i >= 0; i--) {
      _noiseEvents[i].timer -= delta;
      if (_noiseEvents[i].timer <= 0) {
        _noiseEvents.splice(i, 1);
      }
    }

    // Player movement noise
    var movingFast = _keysDown['w'] || _keysDown['a'] || _keysDown['s'] || _keysDown['d'];
    if (movingFast) {
      var noiseR = _playerSoundRadius();
      // Add periodic noise from player movement
      _addNoise(_playerPos.x, _playerPos.z, noiseR);
    }
  }

  // ─────────────────────────────────────────────── player movement (simple)

  function _updatePlayerMovement(delta) {
    if (!_camera) { return; }

    var speed  = _isCrouching ? PLAYER_CROUCH_SPEED : PLAYER_MOVE_SPEED;
    var fwd    = _vec3(0, 0, -1);
    fwd.applyQuaternion(_camera.quaternion);
    fwd.y = 0;
    fwd.normalize();

    var right = _vec3(1, 0, 0);
    right.applyQuaternion(_camera.quaternion);
    right.y = 0;
    right.normalize();

    var moved = false;
    if (_keysDown['w']) { _playerPos.addScaledVector(fwd,   speed * delta); moved = true; }
    if (_keysDown['s']) { _playerPos.addScaledVector(fwd,  -speed * delta); moved = true; }
    if (_keysDown['a']) { _playerPos.addScaledVector(right, -speed * delta); moved = true; }
    if (_keysDown['d']) { _playerPos.addScaledVector(right,  speed * delta); moved = true; }

    // Keep player inside fence boundary (soft clamp)
    if (_playerPos.x < -(FENCE_HALF - 1)) { _playerPos.x = -(FENCE_HALF - 1); }
    if (_playerPos.x >  (FENCE_HALF - 1)) { _playerPos.x =  (FENCE_HALF - 1); }
    if (_playerPos.z < -(FENCE_HALF - 1)) { _playerPos.z = -(FENCE_HALF - 1); }
    if (_playerPos.z >  (FENCE_HALF + 20)) { _playerPos.z = FENCE_HALF + 20; }

    var eyeH = _isCrouching ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
    _playerPos.y = eyeH;

    if (_camera) {
      _camera.position.copy(_playerPos);
    }

    // Shooting (Q held)
    if (_keysDown['q'] && _isAiming) {
      _shootSilenced();
    }
  }

  // ─────────────────────────────────────────────── alert timers

  function _updateAlertTimers(delta) {
    if (_alertLevel === ALERT_ALARM) {
      _alarmTimer += delta;
      if (_alarmTimer >= ALARM_LOSE_TIME) {
        _triggerLose('Alarm sustained for 3 minutes. Mission compromised.');
      }
    } else if (_alertLevel === ALERT_SUSPICIOUS) {
      // Suspicious decays if no guard sees player
      var anyAware = false;
      var gi7;
      for (gi7 = 0; gi7 < _guards.length; gi7++) {
        if (_guards[gi7].alive && _guards[gi7].aware) { anyAware = true; break; }
      }
      if (!anyAware && !_cloakActive) {
        _suspiciousTimer -= delta * 0.5;
        if (_suspiciousTimer <= 0) {
          _suspiciousTimer = 0;
          _alertLevel = ALERT_UNDETECTED;
        }
      }
    }
  }

  // ─────────────────────────────────────────────── win / lose

  function _checkWin() {
    if (_chargesPlanted >= CHARGE_COUNT_REQUIRED && _terminalHacked && _atExfil && !_missionOver) {
      _missionOver = true;
      _missionWon  = true;
    }
  }

  function _triggerLose(reason) {
    if (_missionOver) { return; }
    _missionOver = true;
    _missionLost = true;
  }

  // ─────────────────────────────────────────────── visual animation

  function _animateFacility(delta) {
    // Pulse terminal if not hacked
    if (!_terminalHacked) {
      var pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.003);
      _terminalMesh.material.opacity = pulse;
      _terminalMesh.material.transparent = true;
    }

    // Pulse charge sites if not planted
    if (_chargesPlanted === 0) {
      var cp = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
      _chargeSite1Mesh.material.opacity = cp;
      _chargeSite1Mesh.material.transparent = true;
    }
    if (_chargesPlanted === 1) {
      var cp2 = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
      _chargeSite2Mesh.material.opacity = cp2;
      _chargeSite2Mesh.material.transparent = true;
    }

    // Pulse exfil marker
    var ep = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.002));
    _exfilMarker.material.opacity = ep;
    _exfilMarker.material.transparent = true;

    // Radio pulse until picked up
    if (!_hasRadio) {
      var rp = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
      _radioMesh.scale.y = rp + 0.5;
    }

    // Silo faint glow rotation
    _siloMesh.rotation.y += delta * 0.05;
  }

  // ─────────────────────────────────────────────── activate / reset

  function _activate() {
    if (_active) { return; }
    if (!_scene || !_camera) { return; }
    _active = true;

    _setupScene(_scene);
    _buildFacility(_scene);
    _buildSearchlights(_scene);
    _spawnAllGuards(_scene);

    // Position player at south end outside fence
    _playerPos = _vec3(0, PLAYER_HEIGHT, 50);
    _camera.position.copy(_playerPos);
    _camera.lookAt(0, PLAYER_HEIGHT, 0);

    _alertLevel        = ALERT_UNDETECTED;
    _suspiciousTimer   = 0;
    _alarmTimer        = 0;
    _chargesPlanted    = 0;
    _terminalHacked    = false;
    _genDestroyed      = false;
    _genDestroyTimer   = 0;
    _commanderDead     = false;
    _commanderSilent   = false;
    _missileState      = MISSILE_UNARMED;
    _missionTime       = 0;
    _missionOver       = false;
    _missionWon        = false;
    _missionLost       = false;
    _playerHP          = PLAYER_HP;
    _hasRadio          = false;
    _atExfil           = false;
    _cloakActive       = false;
    _cloakTimeLeft     = 0;
    _cloakRechargeLeft = 0;
    _reinforcementsSpawned = false;

    _getOrCreateHud();
  }

  function reset() {
    // Remove all scene objects added
    if (_facilityRoot && _scene) {
      // Clean up handled by removing added objects
    }
    _active = false;
    _guards = [];
    _guardFlashlights = [];
    _searchlights = [];
    _facilityLights = [];
    _noiseEvents = [];
    _commander = null;
    _missionOver = false;
    _missionWon  = false;
    _missionLost = false;

    if (_scene) {
      if (_savedFog !== undefined) { _scene.fog = _savedFog; }
      if (_savedBackground !== undefined) { _scene.background = _savedBackground; }
    }

    _removeHud();
    _gPressTime = 0;
    _oPressTime = 0;
    _keysDown   = {};
  }

  // ─────────────────────────────────────────────── public API

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function update(delta) {
    if (!_active) { return; }
    if (_missionOver) {
      _updateHud();
      return;
    }

    _missionTime += delta;

    _updateCloak(delta);
    _updatePlayerMovement(delta);
    _updateNoise(delta);
    _updateGuards(delta);
    _updateSearchlights(delta);
    _updateInteractions(delta);
    _updateAlertTimers(delta);
    _animateFacility(delta);

    // Player HP — guards deal damage when close and in alarm state
    if (_alertLevel === ALERT_ALARM) {
      var gi8;
      for (gi8 = 0; gi8 < _guards.length; gi8++) {
        var g8 = _guards[gi8];
        if (!g8.alive) { continue; }
        var attackD = _dist2D(_playerPos.x, _playerPos.z, g8.pos.x, g8.pos.z);
        if (attackD < 1.5) {
          _playerHP -= 15 * delta;
          if (_playerHP <= 0) {
            _playerHP = 0;
            _triggerLose('Player KIA.');
          }
        }
      }
    }

    // Check win condition continuously
    if (_chargesPlanted >= CHARGE_COUNT_REQUIRED && _terminalHacked && _atExfil) {
      _checkWin();
    }

    _updateHud();
  }

  // ─────────────────────────────────────────────── return public API

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
