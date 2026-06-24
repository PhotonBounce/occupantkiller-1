/* ═══════════════════════════════════════════════════════════════════════════
   refinery-assault.js  —  Oil Refinery Assault: Secure the Evidence
   THEME : An oil refinery has been captured by insurgents who plan to blow it
           up and frame a neighbouring country, sparking a war. The player must
           neutralise the insurgents, disarm the detonators and secure the
           intelligence evidence before the refinery is destroyed.
   Activation : press R then A within 400 ms  (toggles on / off)
   Public API : window.RefineryAssault = { init, update, reset }
   ═══════════════════════════════════════════════════════════════════════════ */
window.RefineryAssault = (function () {
  'use strict';

  /* ── activation ──────────────────────────────────────────────────────── */
  var ACT_KEY_R   = 82;
  var ACT_KEY_A   = 65;
  var ACT_WINDOW  = 400;  // ms

  /* ── game constants ──────────────────────────────────────────────────── */
  var GROUND_Y        = 0;
  var ENEMY_COUNT     = 8;
  var EVIDENCE_TOTAL  = 4;
  var DETONATOR_TOTAL = 5;
  var ENEMY_SIGHT     = 22;
  var ENEMY_SPEED     = 3.2;
  var PARTICLE_COUNT  = 28;
  var PATROL_RANGE    = 5;

  /* ── colours ─────────────────────────────────────────────────────────── */
  var COL_GROUND    = 0x4a4030;
  var COL_TOWER     = 0x8a8888;
  var COL_TANK      = 0xb08840;
  var COL_TANK_TOP  = 0x886030;
  var COL_PIPE      = 0x556655;
  var COL_RAILING   = 0x888888;
  var COL_CTRL_BLDG = 0x556677;
  var COL_CTRL_ROOF = 0x445566;
  var COL_FLARE_STK = 0x999999;
  var COL_FLAME_A   = 0xff6600;
  var COL_FLAME_B   = 0xff3300;
  var COL_SMOKE     = 0xcccccc;
  var COL_TRUCK     = 0x445533;
  var COL_TRUCK_CAB = 0x334422;
  var COL_ENEMY_A   = 0x4a6640;
  var COL_ENEMY_B   = 0x5a5030;
  var COL_ENEMY_DED = 0x222222;
  var COL_EVIDENCE  = 0xffcc44;
  var COL_DETONATOR = 0xff2200;
  var COL_DEFUSED   = 0x00ff88;
  var COL_WALKWAY   = 0x667766;
  var COL_AMBIENT   = 0x404858;
  var COL_SUN       = 0xfff0cc;
  var COL_SKY       = 0x1a2030;

  /* ── module state ────────────────────────────────────────────────────── */
  var _active   = false;
  var _scene    = null;
  var _camera   = null;
  var _time     = 0;

  /* activation key tracking */
  var _rTime    = 0;

  /* all scene objects added — tracked so reset() can remove them all */
  var _objects  = [];

  /* sub-categories */
  var _enemies        = [];   // { mesh, hp, alive, patrol*, angle }
  var _evidencePiles  = [];   // { mesh, secured }
  var _detonators     = [];   // { mesh, disarmed }
  var _particles      = [];   // fire particles { mesh, vel, life, maxLife }
  var _railingLines   = [];   // LineSegments (need separate tracking)
  var _flameGroup     = null; // cone + sphere on flare stack
  var _flameLight     = null;
  var _hudEl          = null;

  var _evidenceCount  = 0;
  var _detonatorCount = 0;

  /* player position proxy (camera = player eye) */
  var _px = 0, _py = 2, _pz = 60;

  /* keyboard state */
  var _keys = {};

  /* bound handlers (for cleanup) */
  var _onKeyDown = null;
  var _onKeyUp   = null;
  var _onActKey  = null;

  /* ═══════════════════════════════════════════════════════════════════════
     SCENE BUILDING
  ═══════════════════════════════════════════════════════════════════════ */

  function _add(obj) {
    _scene.add(obj);
    _objects.push(obj);
    return obj;
  }

  function _mesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function _mat(col, emissive) {
    var m = new THREE.MeshLambertMaterial({ color: col });
    if (emissive !== undefined) m.emissive = new THREE.Color(emissive);
    return m;
  }

  /* ── ground plane ──────────────────────────────────────────────────── */
  function _buildGround() {
    var geo = new THREE.BoxGeometry(200, 0.5, 200);
    var mat = _mat(COL_GROUND);
    var m   = _mesh(geo, mat);
    m.position.set(0, -0.25, 0);
    _add(m);
  }

  /* ── distillation tower (tall cylinder, 3 trays, top flange) ──────── */
  function _buildDistillationTower(x, z) {
    var grp = new THREE.Group();
    // Main column
    var colGeo = new THREE.CylinderGeometry(1.4, 1.6, 20, 14);
    var colMat = _mat(COL_TOWER);
    var col = _mesh(colGeo, colMat);
    col.position.y = 10;
    grp.add(col);
    // Tray rings (3 rings at different heights)
    var trayHeights = [5, 10, 15];
    for (var t = 0; t < trayHeights.length; t++) {
      var ringGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.35, 14);
      var ringMat = _mat(0x778888);
      var ring = _mesh(ringGeo, ringMat);
      ring.position.y = trayHeights[t];
      grp.add(ring);
    }
    // Top flange cap
    var capGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.5, 14);
    var cap    = _mesh(capGeo, _mat(0x666666));
    cap.position.y = 20.25;
    grp.add(cap);
    // Vent pipe
    var ventGeo = new THREE.CylinderGeometry(0.22, 0.22, 3, 8);
    var vent = _mesh(ventGeo, _mat(0x555555));
    vent.position.set(0, 21.5, 0);
    grp.add(vent);
    grp.position.set(x, GROUND_Y, z);
    _add(grp);
    return grp;
  }

  /* ── storage tank (wide squat cylinder) ───────────────────────────── */
  function _buildStorageTank(x, z, scale) {
    scale = scale || 1;
    var grp = new THREE.Group();
    var tankGeo = new THREE.CylinderGeometry(5 * scale, 5 * scale, 6 * scale, 18);
    var tankMat = _mat(COL_TANK);
    var tank = _mesh(tankGeo, tankMat);
    tank.position.y = 3 * scale;
    grp.add(tank);
    // Dome top
    var domeGeo = new THREE.SphereGeometry(5 * scale, 18, 9, 0, Math.PI * 2, 0, Math.PI * 0.4);
    var dome = _mesh(domeGeo, _mat(COL_TANK_TOP));
    dome.position.y = 5.9 * scale;
    grp.add(dome);
    // Side outlet pipe
    var pipeGeo = new THREE.CylinderGeometry(0.28, 0.28, 4, 8);
    var pipe = _mesh(pipeGeo, _mat(COL_PIPE));
    pipe.position.set(5.2 * scale, 1.2 * scale, 0);
    pipe.rotation.z = Math.PI * 0.5;
    grp.add(pipe);
    grp.position.set(x, GROUND_Y, z);
    _add(grp);
    return grp;
  }

  /* ── pipe rack walkway with LineSegments railings ──────────────────── */
  function _buildPipeRack(x, z, length, rotation) {
    rotation = rotation || 0;
    var grp = new THREE.Group();

    // Deck platform
    var deckGeo = new THREE.BoxGeometry(length, 0.3, 2.4);
    var deck = _mesh(deckGeo, _mat(COL_WALKWAY));
    deck.position.y = 4;
    grp.add(deck);

    // Support legs every 5 units
    var steps = Math.floor(length / 5);
    for (var i = 0; i <= steps; i++) {
      var lx = -length / 2 + i * (length / steps);
      var legGeo = new THREE.CylinderGeometry(0.12, 0.15, 4, 6);
      var leg1 = _mesh(legGeo, _mat(0x667766));
      leg1.position.set(lx, 2, -0.9);
      grp.add(leg1);
      var leg2 = _mesh(legGeo.clone(), _mat(0x667766));
      leg2.position.set(lx, 2, 0.9);
      grp.add(leg2);
    }

    // Pipes along the rack (3 pipes)
    var pipeOffsets = [-0.6, 0, 0.6];
    for (var p = 0; p < pipeOffsets.length; p++) {
      var rpGeo = new THREE.CylinderGeometry(0.16, 0.16, length, 8);
      var rp    = _mesh(rpGeo, _mat(COL_PIPE));
      rp.rotation.z = Math.PI * 0.5;
      rp.position.set(0, 4.25, pipeOffsets[p]);
      grp.add(rp);
    }

    // LineSegments railing both sides
    var railPoints = [];
    var railStep   = length / 10;
    for (var r = 0; r <= 10; r++) {
      var rx = -length / 2 + r * railStep;
      // bottom rail
      railPoints.push(rx, 4.15, -1.2,  rx, 4.15, -1.2);
      railPoints.push(rx, 4.15, 1.2,   rx, 4.15, 1.2);
      // post
      railPoints.push(rx, 4.15, -1.2,  rx, 5.2, -1.2);
      railPoints.push(rx, 4.15,  1.2,  rx, 5.2,  1.2);
    }
    // top rails (continuous)
    railPoints.push(-length / 2, 5.2, -1.2,  length / 2, 5.2, -1.2);
    railPoints.push(-length / 2, 5.2,  1.2,  length / 2, 5.2,  1.2);

    var railGeo  = new THREE.BufferGeometry();
    var railVerts = new Float32Array(railPoints);
    railGeo.setAttribute('position', new THREE.BufferAttribute(railVerts, 3));
    var railMat  = new THREE.LineBasicMaterial({ color: COL_RAILING });
    var railLine = new THREE.LineSegments(railGeo, railMat);
    grp.add(railLine);
    _railingLines.push(railLine);

    grp.position.set(x, GROUND_Y, z);
    grp.rotation.y = rotation;
    _add(grp);
    return grp;
  }

  /* ── control room building ─────────────────────────────────────────── */
  function _buildControlRoom(x, z) {
    var grp = new THREE.Group();
    // Main body
    var bodyGeo = new THREE.BoxGeometry(10, 5, 8);
    var body = _mesh(bodyGeo, _mat(COL_CTRL_BLDG));
    body.position.y = 2.5;
    grp.add(body);
    // Flat roof
    var roofGeo = new THREE.BoxGeometry(11, 0.4, 9);
    var roof = _mesh(roofGeo, _mat(COL_CTRL_ROOF));
    roof.position.y = 5.2;
    grp.add(roof);
    // Windows (front face)
    var winPositions = [-3.2, 0, 3.2];
    for (var w = 0; w < winPositions.length; w++) {
      var winGeo = new THREE.BoxGeometry(1.6, 1.4, 0.15);
      var win = _mesh(winGeo, _mat(0x88aacc, 0x223344));
      win.position.set(winPositions[w], 3.0, -4.08);
      grp.add(win);
    }
    // Door
    var doorGeo = new THREE.BoxGeometry(1.4, 2.8, 0.15);
    var door = _mesh(doorGeo, _mat(0x334422));
    door.position.set(0, 1.4, -4.08);
    grp.add(door);
    // Antenna on roof
    var antGeo = new THREE.CylinderGeometry(0.06, 0.06, 3, 5);
    var ant = _mesh(antGeo, _mat(0x888888));
    ant.position.set(3, 6.7, 0);
    grp.add(ant);
    grp.position.set(x, GROUND_Y, z);
    _add(grp);
    return grp;
  }

  /* ── flare stack with animated flame (cone + sphere) ──────────────── */
  function _buildFlareStack(x, z) {
    var grp = new THREE.Group();
    // Stack pole
    var poleGeo = new THREE.CylinderGeometry(0.3, 0.4, 18, 9);
    var pole    = _mesh(poleGeo, _mat(COL_FLARE_STK));
    pole.position.y = 9;
    grp.add(pole);
    // Cross-brace guy wires (thin cylinders)
    var wireAngles = [0, Math.PI * 0.666, Math.PI * 1.333];
    for (var g = 0; g < wireAngles.length; g++) {
      var wGeo = new THREE.CylinderGeometry(0.05, 0.05, 12, 4);
      var wire = _mesh(wGeo, _mat(0x888888));
      wire.rotation.z = 0.55;
      wire.position.set(
        Math.cos(wireAngles[g]) * 5,
        8,
        Math.sin(wireAngles[g]) * 5
      );
      wire.rotation.y = wireAngles[g];
      grp.add(wire);
    }

    // Flame group (cone body + sphere tip — animated in update)
    var flameGrp = new THREE.Group();
    var coneGeo  = new THREE.ConeGeometry(0.55, 2.2, 10);
    var coneMat  = new THREE.MeshLambertMaterial({ color: COL_FLAME_A, emissive: new THREE.Color(0x551100) });
    var cone     = _mesh(coneGeo, coneMat);
    cone.position.y = 1.1;
    flameGrp.add(cone);

    var sphereGeo = new THREE.SphereGeometry(0.45, 10, 8);
    var sphereMat = new THREE.MeshLambertMaterial({ color: COL_FLAME_B, emissive: new THREE.Color(0x440800) });
    var sphere    = _mesh(sphereGeo, sphereMat);
    sphere.position.y = 2.4;
    flameGrp.add(sphere);

    flameGrp.position.set(0, 18.1, 0);
    grp.add(flameGrp);
    _flameGroup = flameGrp;

    // Point light for flare glow
    var flameLight = new THREE.PointLight(COL_FLAME_A, 3.5, 30);
    flameLight.position.set(0, 19, 0);
    grp.add(flameLight);
    _flameLight = flameLight;

    grp.position.set(x, GROUND_Y, z);
    _add(grp);
    return grp;
  }

  /* ── fire particles (orange/red box quads flickering upward) ──────── */
  function _buildFireParticles(x, y, z) {
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var size = 0.12 + Math.random() * 0.22;
      var geo  = new THREE.BoxGeometry(size, size, size);
      var col  = (Math.random() < 0.5) ? 0xff5500 : 0xff2200;
      var mat  = new THREE.MeshLambertMaterial({ color: col });
      var m    = _mesh(geo, mat);
      var ox   = (Math.random() - 0.5) * 0.6;
      var oz   = (Math.random() - 0.5) * 0.6;
      m.position.set(x + ox, y, z + oz);
      _add(m);
      _particles.push({
        mesh    : m,
        baseX   : x + ox,
        baseZ   : z + oz,
        baseY   : y,
        vel     : 0.8 + Math.random() * 1.5,
        offset  : Math.random() * Math.PI * 2,
        life    : Math.random(),
        maxLife : 0.5 + Math.random() * 0.8
      });
    }
  }

  /* ── truck vehicle (flat-bed box + cab box) ──────────────────────── */
  function _buildTruck(x, z, rotation) {
    rotation = rotation || 0;
    var grp = new THREE.Group();
    // Bed
    var bedGeo = new THREE.BoxGeometry(5.5, 1.1, 2.4);
    var bed = _mesh(bedGeo, _mat(COL_TRUCK));
    bed.position.set(-0.6, 1.05, 0);
    grp.add(bed);
    // Cab
    var cabGeo = new THREE.BoxGeometry(2.2, 1.8, 2.4);
    var cab = _mesh(cabGeo, _mat(COL_TRUCK_CAB));
    cab.position.set(2.2, 1.9, 0);
    grp.add(cab);
    // Windshield
    var windGeo = new THREE.BoxGeometry(0.1, 1.0, 1.8);
    var wind = _mesh(windGeo, _mat(0x88aacc, 0x112233));
    wind.position.set(3.3, 2.3, 0);
    grp.add(wind);
    // Wheels (4 boxes)
    var wheelPositions = [
      [1.5, -0.3, 1.4], [1.5, -0.3, -1.4],
      [-1.5, -0.3, 1.4], [-1.5, -0.3, -1.4]
    ];
    for (var w = 0; w < wheelPositions.length; w++) {
      var wp = wheelPositions[w];
      var wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10);
      var wheel = _mesh(wGeo, _mat(0x222222));
      wheel.rotation.x = Math.PI * 0.5;
      wheel.position.set(wp[0], wp[1] + 0.5, wp[2]);
      grp.add(wheel);
    }
    grp.position.set(x, GROUND_Y, z);
    grp.rotation.y = rotation;
    _add(grp);
    return grp;
  }

  /* ── enemy insurgent (green-brown box figure) ──────────────────────── */
  function _buildEnemy(x, z) {
    var grp = new THREE.Group();
    // Body torso
    var torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35);
    var torso = _mesh(torsoGeo, _mat(COL_ENEMY_A));
    torso.position.y = 1.4;
    grp.add(torso);
    // Head
    var headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    var head = _mesh(headGeo, _mat(COL_ENEMY_B));
    head.position.y = 2.05;
    grp.add(head);
    // Legs
    var legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
    var legL = _mesh(legGeo, _mat(COL_ENEMY_B));
    legL.position.set(0.18, 0.65, 0);
    grp.add(legL);
    var legR = _mesh(legGeo.clone(), _mat(COL_ENEMY_B));
    legR.position.set(-0.18, 0.65, 0);
    grp.add(legR);
    // Arms (at sides)
    var armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    var armL = _mesh(armGeo, _mat(COL_ENEMY_A));
    armL.position.set(0.42, 1.4, 0);
    grp.add(armL);
    var armR = _mesh(armGeo.clone(), _mat(COL_ENEMY_A));
    armR.position.set(-0.42, 1.4, 0);
    grp.add(armR);
    // Weapon (small box)
    var weapGeo = new THREE.BoxGeometry(0.1, 0.1, 0.7);
    var weap = _mesh(weapGeo, _mat(0x333333));
    weap.position.set(-0.5, 1.5, 0.4);
    grp.add(weap);

    grp.position.set(x, GROUND_Y, z);
    _add(grp);

    var enemy = {
      group    : grp,
      hp       : 100,
      alive    : true,
      angle    : Math.random() * Math.PI * 2,
      patrolCx : x,
      patrolCz : z,
      alertTimer : 0
    };
    _enemies.push(enemy);
    return enemy;
  }

  /* ── evidence document pile ────────────────────────────────────────── */
  function _buildEvidence(x, z) {
    var grp = new THREE.Group();
    // Briefcase / document box
    var caseGeo = new THREE.BoxGeometry(0.5, 0.32, 0.38);
    var caseM = _mesh(caseGeo, _mat(COL_EVIDENCE, 0x443300));
    caseM.position.y = 0.16;
    grp.add(caseM);
    // Stack of papers
    var paperGeo = new THREE.BoxGeometry(0.44, 0.06, 0.32);
    var paper = _mesh(paperGeo, _mat(0xf5f0e0));
    paper.position.y = 0.35;
    grp.add(paper);
    grp.position.set(x, GROUND_Y, z);
    _add(grp);
    var ev = { group: grp, secured: false };
    _evidencePiles.push(ev);
    return ev;
  }

  /* ── detonator device ──────────────────────────────────────────────── */
  function _buildDetonator(x, z) {
    var grp = new THREE.Group();
    // Box body
    var boxGeo = new THREE.BoxGeometry(0.38, 0.28, 0.28);
    var boxM = _mesh(boxGeo, _mat(COL_DETONATOR, 0x550000));
    boxM.position.y = 0.14;
    grp.add(boxM);
    // Red LED dot
    var ledGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    var led = _mesh(ledGeo, _mat(0xff0000, 0xff0000));
    led.position.set(0.12, 0.28, -0.15);
    grp.add(led);
    grp.position.set(x, GROUND_Y, z);
    _add(grp);
    var det = { group: grp, disarmed: false };
    _detonators.push(det);
    return det;
  }

  /* ── lights ────────────────────────────────────────────────────────── */
  function _buildLights() {
    var ambient = new THREE.AmbientLight(COL_AMBIENT, 0.75);
    _add(ambient);

    var sun = new THREE.DirectionalLight(COL_SUN, 1.1);
    sun.position.set(40, 60, 30);
    _add(sun);

    var fill = new THREE.PointLight(0x334466, 0.6, 120);
    fill.position.set(-30, 15, -20);
    _add(fill);
  }

  /* ── full scene layout ─────────────────────────────────────────────── */
  function _buildScene() {
    _buildGround();
    _buildLights();

    // Distillation towers (6 towers)
    _buildDistillationTower(-18, -20);
    _buildDistillationTower(-8,  -20);
    _buildDistillationTower(2,   -20);
    _buildDistillationTower(12,  -20);
    _buildDistillationTower(-13, -35);
    _buildDistillationTower(7,   -35);

    // Storage tanks (4 tanks)
    _buildStorageTank(28,  -15, 1.0);
    _buildStorageTank(42,  -15, 1.2);
    _buildStorageTank(28,  -30, 0.9);
    _buildStorageTank(42,  -30, 1.1);

    // Pipe rack walkways with railings
    _buildPipeRack(7, -28, 26, 0);               // east-west between towers & tanks
    _buildPipeRack(20, -22, 18, Math.PI * 0.5);  // north-south connector

    // Control room building
    _buildControlRoom(-5, 5);

    // Flare stack with animated flame
    _buildFlareStack(22, 10);

    // Fire particles rising from flare base
    _buildFireParticles(22, 18.5, 10);

    // Trucks (3 trucks — insurgent vehicles)
    _buildTruck(-20, 15, 0.2);
    _buildTruck(10,  20, -0.5);
    _buildTruck(35,  5,  Math.PI * 0.5);

    // Enemies at patrol positions scattered across site
    var enemyPositions = [
      [-10, -5],  [-20, -10], [0, -15],  [15, -10],
      [30, -20],  [40, -25],  [-5, -30], [25, 0]
    ];
    for (var e = 0; e < enemyPositions.length && e < ENEMY_COUNT; e++) {
      _buildEnemy(enemyPositions[e][0], enemyPositions[e][1]);
    }

    // Evidence piles (4 items: inside control room area + around site)
    _buildEvidence(-8, 2);
    _buildEvidence(3, -18);
    _buildEvidence(38, -20);
    _buildEvidence(-15, -32);

    // Detonators (5 items placed at key structures)
    _buildDetonator(-12, -20);
    _buildDetonator(5,   -20);
    _buildDetonator(30,  -15);
    _buildDetonator(42,  -28);
    _buildDetonator(20,  -36);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildHUD() {
    var el = document.createElement('div');
    el.id  = 'ra-hud';
    el.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.82)',
      'color:#e8cc66',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 18px',
      'border:1px solid #887733',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(el);
    _hudEl = el;
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.textContent =
      'EVIDENCE SECURED: ' + _evidenceCount + '/' + EVIDENCE_TOTAL +
      '   |   DETONATORS DISARMED: ' + _detonatorCount + '/' + DETONATOR_TOTAL;
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  function _notify(msg, col) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, col || '#e8cc66');
      return;
    }
    // Fallback: small toast
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.88)',
      'color:' + (col || '#e8cc66'),
      'font-family:monospace',
      'font-size:15px',
      'padding:7px 22px',
      'border:1px solid ' + (col || '#887733'),
      'border-radius:4px',
      'z-index:10001',
      'pointer-events:none'
    ].join(';');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2800);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════ */
  function _bindKeys() {
    _onKeyDown = function (e) {
      _keys[e.keyCode] = true;
    };
    _onKeyUp = function (e) {
      _keys[e.keyCode] = false;
    };
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function _unbindKeys() {
    if (_onKeyDown) window.removeEventListener('keydown', _onKeyDown);
    if (_onKeyUp)   window.removeEventListener('keyup',   _onKeyUp);
    _onKeyDown = null;
    _onKeyUp   = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════ */

  /* init(scene, camera) — called once by the host game */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
  }

  /* reset() — tear down everything this module added */
  function reset() {
    _active = false;
    _unbindKeys();
    _removeHUD();

    // Remove all tracked scene objects
    for (var i = 0; i < _objects.length; i++) {
      var obj = _objects[i];
      if (_scene) _scene.remove(obj);
      // Dispose geometry / material recursively
      if (obj.traverse) {
        obj.traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              for (var m = 0; m < child.material.length; m++) child.material[m].dispose();
            } else {
              child.material.dispose();
            }
          }
        });
      } else {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    }

    _objects       = [];
    _enemies       = [];
    _evidencePiles = [];
    _detonators    = [];
    _particles     = [];
    _railingLines  = [];
    _flameGroup    = null;
    _flameLight    = null;
    _keys          = {};
    _evidenceCount  = 0;
    _detonatorCount = 0;
    _px = 0; _py = 2; _pz = 60;
    _time = 0;
  }

  /* ── internal: activate / deactivate ─────────────────────────────── */
  function _activate() {
    if (!_scene) {
      _notify('RefineryAssault: call init(scene, camera) first', '#ff4444');
      return;
    }
    _active = true;
    _evidenceCount  = 0;
    _detonatorCount = 0;
    _px = 0; _py = 2; _pz = 60;
    _time = 0;

    _buildScene();
    _buildHUD();
    _bindKeys();

    _notify('REFINERY ASSAULT ACTIVE — neutralise insurgents & secure evidence', '#ffcc44');
    setTimeout(function () {
      _notify('R+A to toggle off', '#aabbcc');
    }, 2500);
  }

  function _deactivate() {
    _notify('REFINERY ASSAULT DEACTIVATED', '#aabbcc');
    reset();
  }

  /* ── activation keydown handler (registered immediately) ─────────── */
  _onActKey = function (e) {
    var now = Date.now();
    if (e.keyCode === ACT_KEY_R) {
      _rTime = now;
    }
    if (e.keyCode === ACT_KEY_A) {
      if (_rTime > 0 && (now - _rTime) <= ACT_WINDOW) {
        _rTime = 0;
        if (_active) {
          _deactivate();
        } else {
          _activate();
        }
      }
    }
  };
  window.addEventListener('keydown', _onActKey);

  /* ── distance helper ─────────────────────────────────────────────── */
  function _dist(ax, ay, az, bx, by, bz) {
    var dx = ax - bx;
    var dy = ay - by;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /* ── update(delta) — called each frame by host game loop ────────── */
  function update(delta) {
    if (!_active || !_scene) return;
    _time += delta;

    var t = _time;

    /* fire particle animation */
    for (var p = 0; p < _particles.length; p++) {
      var pt  = _particles[p];
      pt.life += delta;
      if (pt.life >= pt.maxLife) {
        pt.life = 0;
        pt.mesh.position.set(
          pt.baseX + (Math.random() - 0.5) * 0.5,
          pt.baseY,
          pt.baseZ + (Math.random() - 0.5) * 0.5
        );
      }
      var frac = pt.life / pt.maxLife;
      pt.mesh.position.y = pt.baseY + frac * 2.8 * pt.vel;
      pt.mesh.position.x = pt.baseX + Math.sin(t * 3 + pt.offset) * 0.18;
      pt.mesh.position.z = pt.baseZ + Math.cos(t * 2.5 + pt.offset) * 0.18;
      // Fade via scale
      var sc = 1.0 - frac * 0.8;
      pt.mesh.scale.set(sc, sc, sc);
    }

    /* flare stack flame animation */
    if (_flameGroup) {
      _flameGroup.scale.x = 0.85 + Math.sin(t * 7.3) * 0.18;
      _flameGroup.scale.z = 0.85 + Math.cos(t * 6.1) * 0.18;
      _flameGroup.scale.y = 0.9 + Math.sin(t * 5.5 + 1) * 0.12;
      _flameGroup.rotation.y = t * 2.1;
    }
    if (_flameLight) {
      _flameLight.intensity = 3.0 + Math.sin(t * 9) * 1.0;
    }

    /* enemy AI — simple patrol + alert */
    var camPos = _camera ? _camera.position : { x: _px, y: _py, z: _pz };
    for (var ei = 0; ei < _enemies.length; ei++) {
      var en = _enemies[ei];
      if (!en.alive) continue;
      // Circular patrol
      en.angle += delta * 0.55;
      var ex = en.patrolCx + Math.cos(en.angle) * PATROL_RANGE;
      var ez = en.patrolCz + Math.sin(en.angle) * PATROL_RANGE;
      en.group.position.x = ex;
      en.group.position.z = ez;
      en.group.rotation.y = -en.angle + Math.PI * 0.5;

      // Sight check vs camera
      var distToPlayer = _dist(ex, 0, ez, camPos.x, 0, camPos.z);
      if (distToPlayer < ENEMY_SIGHT) {
        en.alertTimer += delta;
        // Tint red when alert
        en.group.traverse(function (c) {
          if (c.isMesh && c.material && c.material.color) {
            c.material.color.setHex(0xff2200);
          }
        });
      } else {
        if (en.alertTimer > 0) {
          // Reset colour when player moves away
          en.alertTimer = 0;
          en.group.traverse(function (c) {
            if (c.isMesh && c.material && c.material.color) {
              c.material.color.setHex(COL_ENEMY_A);
            }
          });
        }
      }

      // Very basic: enemy "shoots" (just health nudge in host game);
      // collision with camera = "damage" — host game should handle
      if (distToPlayer < 1.5 && en.alertTimer > 1.0) {
        // Let host game know (optional hook)
        if (typeof window.onRefineryEnemyContact === 'function') {
          window.onRefineryEnemyContact(en);
        }
      }
    }

    /* check player proximity to evidence */
    for (var evi = 0; evi < _evidencePiles.length; evi++) {
      var ev = _evidencePiles[evi];
      if (ev.secured) continue;
      var evp = ev.group.position;
      if (_dist(camPos.x, camPos.y, camPos.z, evp.x, evp.y, evp.z) < 2.5) {
        ev.secured = true;
        _evidenceCount++;
        // Tint gold
        ev.group.traverse(function (c) {
          if (c.isMesh && c.material) c.material.color.setHex(0x00ff88);
        });
        _updateHUD();
        _notify('EVIDENCE SECURED (' + _evidenceCount + '/' + EVIDENCE_TOTAL + ')', '#00ff88');
        if (_evidenceCount >= EVIDENCE_TOTAL) {
          setTimeout(function () {
            _notify('ALL EVIDENCE SECURED — check detonators!', '#ffcc44');
          }, 1200);
        }
      }
    }

    /* check player proximity to detonators (press E / keycode 69 to disarm) */
    for (var di = 0; di < _detonators.length; di++) {
      var det = _detonators[di];
      if (det.disarmed) continue;
      var dp = det.group.position;
      var dDist = _dist(camPos.x, camPos.y, camPos.z, dp.x, dp.y, dp.z);
      if (dDist < 2.2 && _keys[69]) {  // E key
        det.disarmed = true;
        _detonatorCount++;
        det.group.traverse(function (c) {
          if (c.isMesh && c.material) c.material.color.setHex(COL_DEFUSED);
        });
        _updateHUD();
        _notify('DETONATOR DISARMED (' + _detonatorCount + '/' + DETONATOR_TOTAL + ')', '#00ff88');
        if (_detonatorCount >= DETONATOR_TOTAL && _evidenceCount >= EVIDENCE_TOTAL) {
          setTimeout(function () {
            _notify('MISSION COMPLETE — REFINERY SECURED. WAR AVERTED.', '#00ff88');
          }, 800);
        }
      }
      // Pulse detonator red when nearby
      if (dDist < 4) {
        var pulse = (Math.sin(t * 8) > 0) ? 0xff0000 : 0xff6600;
        det.group.traverse(function (c) {
          if (c.isMesh && c.material && !det.disarmed) {
            c.material.color.setHex(pulse);
          }
        });
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC EXPORT
  ═══════════════════════════════════════════════════════════════════════ */
  return {
    init   : init,
    update : update,
    reset  : reset
  };

}());
