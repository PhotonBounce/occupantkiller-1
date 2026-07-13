/* ───────────────────────────────────────────────────────────────────────────
   POWER PLANT SIEGE — Retake a nuclear power plant from eco-terrorists
   Activation: P then P within 400ms (two P presses)
   Theme: Director Nacht and eco-terrorists plan a meltdown — stop them.
   Depends on: THREE, HUD, Player, VoxelWorld, Marketplace
   ─────────────────────────────────────────────────────────────────────────── */
window.PowerPlantSiege = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────── */
  var MELTDOWN_START        = 180;    // seconds on the clock
  var PANEL_TIME_BONUS      = 30;     // seconds gained per control panel shot
  var COOLANT_VALVE_BONUS   = 45;     // seconds from coolant valve (one use)
  var RAD_DAMAGE_PER_S      = 8;      // HP/s in radiation zones
  var SABOTEUR_TIMER_DRAIN  = 5;      // extra seconds/s drained per live saboteur
  var NACHT_MAX_HP          = 510;
  var NACHT_PHASE2_THRESH   = 0.60;   // 60% HP triggers partial meltdown
  var BODYGUARD_HP          = 220;
  var TERRORIST_HP          = 80;
  var SABOTEUR_HP           = 75;
  var ENEMY_SHOOT_RANGE     = 28;     // units — enemy can shoot player
  var ENEMY_SHOOT_INTERVAL  = 2.2;    // seconds between enemy shots
  var ENEMY_SHOOT_DAMAGE    = 12;
  var ENEMY_MOVE_SPEED      = 4.5;
  var INTERACT_RANGE_SQ     = 16;     // squared distance for E-key interaction
  var KEY_WINDOW            = 0.4;    // 400ms for double-press activation
  var WIN_SCORE             = 3500;

  /* ── Module state ───────────────────────────────────────────────────── */
  var _scene         = null;
  var _active        = false;
  var _onComplete    = null;
  var _meshes        = [];
  var _lights        = [];
  var _effects       = [];

  /* Activation tracking — two P presses within 400ms */
  var _pPressCount   = 0;
  var _pLastTime     = 0;

  /* Meltdown clock */
  var _meltdownTimer      = MELTDOWN_START;
  var _meltdownFailed     = false;
  var _missionWon         = false;

  /* Control panels (3 of them, shooting each adds 30s) */
  var _controlPanels      = [];  /* { mesh, x, y, z, shot, lineSegs } */
  var _panelsShot         = 0;

  /* Coolant valve */
  var _coolantValve       = null;  /* { mesh, x, y, z, used } */

  /* Radiation zones (2) */
  var _radZones           = [];  /* { x, z, radius, light } */
  var _inRadZone          = false;

  /* Cooling towers steam particles */
  var _steamParticles     = [];  /* { mesh, mat, baseY, speed, t } */

  /* Turbines (4) */
  var _turbines           = [];  /* { mesh } */

  /* Enemies */
  var _terrorists         = [];  /* { mesh, x, y, z, hp, alive, patrol, patrolDir, shootTimer, type } */
  var _saboteurs          = [];  /* { mesh, x, y, z, hp, alive, shootTimer } */
  var _bodyguards         = [];  /* { mesh, x, y, z, hp, alive, shootTimer } */
  var _nacht              = null; /* { mesh, x, y, z, hp, alive, phase2, shootTimer, light } */

  /* Phase 2 meltdown visual */
  var _phase2Triggered    = false;
  var _phase2Light        = null;

  /* Emergency exit */
  var _exitZone           = null;  /* { mesh, x, z } */
  var _playerReachedExit  = false;

  /* Guard tower searchlights */
  var _searchlights       = [];  /* { light, angle, speed } */

  /* HUD flash timers */
  var _radWarningFlash    = 0;
  var _lastHudUpdate      = 0;

  /* Key state */
  var _keys               = {};
  var _keyHandlerAttached = false;
  var _eWasDown           = false;

  /* ── Terrain helper ─────────────────────────────────────────────────── */
  function _groundY(x, z) {
    if (typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
      return window.VoxelWorld.getTerrainHeight(x, z);
    }
    return 0;
  }

  /* ── Mesh tracking ──────────────────────────────────────────────────── */
  function _track(mesh) {
    _meshes.push(mesh);
    return mesh;
  }
  function _trackLight(light) {
    _lights.push(light);
    return light;
  }

  /* ── Distance squared helper ────────────────────────────────────────── */
  function _distSq(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return dx * dx + dz * dz;
  }

  /* ── Player helpers ─────────────────────────────────────────────────── */
  function _getPlayerPos() {
    if (typeof window !== 'undefined' && window.Player && window.Player.getPosition) {
      return window.Player.getPosition();
    }
    return { x: 0, y: 0, z: 0 };
  }

  function _applyPlayerDamage(amount) {
    if (typeof window !== 'undefined' && window.Player && window.Player.takeDamage) {
      window.Player.takeDamage(amount);
    }
  }

  /* ── HUD helpers ────────────────────────────────────────────────────── */
  function _hudNotify(msg, color) {
    if (typeof window !== 'undefined' && window.HUD && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg, color || '#FFFFFF');
    }
  }

  function _hudSetMission(text, color) {
    if (typeof window !== 'undefined' && window.HUD && window.HUD.setMissionText) {
      window.HUD.setMissionText(text, color || '#FFFFFF');
    }
  }

  /* ── Build environment ──────────────────────────────────────────────── */
  function _buildEnvironment() {
    var gy = _groundY(0, 0);

    /* ── Reactor building — large central structure ── */
    var rbGeo = new THREE.BoxGeometry(24, 18, 24);
    var rbMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
    var rb = new THREE.Mesh(rbGeo, rbMat);
    rb.position.set(0, gy + 9, 0);
    _scene.add(rb);
    _track(rb);

    /* Thick reactor walls (front/back slabs) */
    var wallGeo = new THREE.BoxGeometry(26, 18, 3);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var wallFront = new THREE.Mesh(wallGeo, wallMat);
    wallFront.position.set(0, gy + 9, 13.5);
    _scene.add(wallFront);
    _track(wallFront);
    var wallBack = new THREE.Mesh(wallGeo, wallMat);
    wallBack.position.set(0, gy + 9, -13.5);
    _scene.add(wallBack);
    _track(wallBack);

    /* ── Cooling tower 1 — wide base (r=7), narrow mid, wider top ── */
    /* Base segment */
    var ct1Base = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 8, 8, 20),
      new THREE.MeshLambertMaterial({ color: 0x999999 })
    );
    ct1Base.position.set(-35, gy + 4, -10);
    _scene.add(ct1Base);
    _track(ct1Base);

    /* Mid segment (narrow) */
    var ct1Mid = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 7, 10, 20),
      new THREE.MeshLambertMaterial({ color: 0xAAAAAA })
    );
    ct1Mid.position.set(-35, gy + 13, -10);
    _scene.add(ct1Mid);
    _track(ct1Mid);

    /* Top segment (wider) */
    var ct1Top = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 5, 6, 20),
      new THREE.MeshLambertMaterial({ color: 0xBBBBBB })
    );
    ct1Top.position.set(-35, gy + 21, -10);
    _scene.add(ct1Top);
    _track(ct1Top);

    /* ── Cooling tower 2 ── */
    var ct2Base = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 8, 8, 20),
      new THREE.MeshLambertMaterial({ color: 0x999999 })
    );
    ct2Base.position.set(-35, gy + 4, 10);
    _scene.add(ct2Base);
    _track(ct2Base);

    var ct2Mid = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 7, 10, 20),
      new THREE.MeshLambertMaterial({ color: 0xAAAAAA })
    );
    ct2Mid.position.set(-35, gy + 13, 10);
    _scene.add(ct2Mid);
    _track(ct2Mid);

    var ct2Top = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 5, 6, 20),
      new THREE.MeshLambertMaterial({ color: 0xBBBBBB })
    );
    ct2Top.position.set(-35, gy + 21, 10);
    _scene.add(ct2Top);
    _track(ct2Top);

    /* ── Turbine hall ── */
    var thGeo = new THREE.BoxGeometry(30, 12, 14);
    var thMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var th = new THREE.Mesh(thGeo, thMat);
    th.position.set(28, gy + 6, 0);
    _scene.add(th);
    _track(th);

    /* ── 4 turbines inside turbine hall ── */
    var turbPositions = [
      { x: 18, z: -4 },
      { x: 24, z: -4 },
      { x: 32, z:  4 },
      { x: 38, z:  4 }
    ];
    for (var ti = 0; ti < turbPositions.length; ti++) {
      var tp = turbPositions[ti];
      var turbGeo = new THREE.CylinderGeometry(2.5, 2.5, 8, 16);
      var turbMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
      var turb = new THREE.Mesh(turbGeo, turbMat);
      turb.position.set(tp.x, gy + 6, tp.z);
      _scene.add(turb);
      _track(turb);
      _turbines.push({ mesh: turb });
    }

    /* ── Control room — rows of panels with LineSegments displays ── */
    var crGeo = new THREE.BoxGeometry(20, 6, 10);
    var crMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var cr = new THREE.Mesh(crGeo, crMat);
    cr.position.set(0, gy + 3, 24);
    _scene.add(cr);
    _track(cr);

    /* Control panel row (decorative back wall) */
    var panelRowGeo = new THREE.BoxGeometry(18, 4, 1);
    var panelRowMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var panelRow = new THREE.Mesh(panelRowGeo, panelRowMat);
    panelRow.position.set(0, gy + 4, 28);
    _scene.add(panelRow);
    _track(panelRow);

    /* Main reactor control terminal */
    var termGeo = new THREE.BoxGeometry(3, 3, 1);
    var termMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var term = new THREE.Mesh(termGeo, termMat);
    term.position.set(0, gy + 4.5, 26);
    _scene.add(term);
    _track(term);

    /* ── 3 shootable control panels ── */
    var cpDefs = [
      { x: -5, z: 27.5, label: 'PANEL-A' },
      { x:  0, z: 27.5, label: 'PANEL-B' },
      { x:  5, z: 27.5, label: 'PANEL-C' }
    ];
    for (var ci = 0; ci < cpDefs.length; ci++) {
      var cpd = cpDefs[ci];
      var cpGeo = new THREE.BoxGeometry(1.8, 2.4, 0.4);
      var cpMat = new THREE.MeshLambertMaterial({ color: 0x22AA44 });
      var cpMesh = new THREE.Mesh(cpGeo, cpMat);
      cpMesh.position.set(cpd.x, gy + 3.2, cpd.z);
      _scene.add(cpMesh);
      _track(cpMesh);

      /* LineSegments display on panel face */
      var lsPoints = [];
      lsPoints.push(new THREE.Vector3(-0.6, -0.8, 0.25));
      lsPoints.push(new THREE.Vector3( 0.6, -0.8, 0.25));
      lsPoints.push(new THREE.Vector3( 0.6, -0.8, 0.25));
      lsPoints.push(new THREE.Vector3( 0.6,  0.8, 0.25));
      lsPoints.push(new THREE.Vector3( 0.6,  0.8, 0.25));
      lsPoints.push(new THREE.Vector3(-0.6,  0.8, 0.25));
      lsPoints.push(new THREE.Vector3(-0.6,  0.8, 0.25));
      lsPoints.push(new THREE.Vector3(-0.6, -0.8, 0.25));
      lsPoints.push(new THREE.Vector3(-0.6,  0.0, 0.25));
      lsPoints.push(new THREE.Vector3( 0.6,  0.0, 0.25));
      lsPoints.push(new THREE.Vector3( 0.0, -0.8, 0.25));
      lsPoints.push(new THREE.Vector3( 0.0,  0.8, 0.25));
      var lsGeo = new THREE.BufferGeometry().setFromPoints(lsPoints);
      var lsMat = new THREE.LineBasicMaterial({ color: 0x00FF88 });
      var lineSegs = new THREE.LineSegments(lsGeo, lsMat);
      lineSegs.position.set(cpd.x, gy + 3.2, cpd.z);
      _scene.add(lineSegs);
      _track(lineSegs);

      _controlPanels.push({
        mesh:     cpMesh,
        lineSegs: lineSegs,
        x:        cpd.x,
        y:        gy + 3.2,
        z:        cpd.z,
        shot:     false
      });
    }

    /* ── Spent fuel pool — flat blue box surrounded by hazard tape LineSegments ── */
    var sfpGeo = new THREE.BoxGeometry(16, 1.5, 10);
    var sfpMat = new THREE.MeshLambertMaterial({ color: 0x1133AA, transparent: true, opacity: 0.85 });
    var sfp = new THREE.Mesh(sfpGeo, sfpMat);
    sfp.position.set(0, gy + 0.75, -26);
    _scene.add(sfp);
    _track(sfp);

    var poolLight = new THREE.PointLight(0x2255FF, 1.4, 20);
    poolLight.position.set(0, gy + 3, -26);
    _scene.add(poolLight);
    _trackLight(poolLight);

    /* Hazard tape LineSegments around the pool */
    var hazardPts = [];
    var hx1 = -9, hx2 = 9, hz1 = -31, hz2 = -21;
    hazardPts.push(new THREE.Vector3(hx1, gy + 2, hz1));
    hazardPts.push(new THREE.Vector3(hx2, gy + 2, hz1));
    hazardPts.push(new THREE.Vector3(hx2, gy + 2, hz1));
    hazardPts.push(new THREE.Vector3(hx2, gy + 2, hz2));
    hazardPts.push(new THREE.Vector3(hx2, gy + 2, hz2));
    hazardPts.push(new THREE.Vector3(hx1, gy + 2, hz2));
    hazardPts.push(new THREE.Vector3(hx1, gy + 2, hz2));
    hazardPts.push(new THREE.Vector3(hx1, gy + 2, hz1));
    /* Diagonal hazard stripes along fence */
    for (var hi = 0; hi < 4; hi++) {
      var hfrac = hi / 3;
      var hix = hx1 + hfrac * (hx2 - hx1);
      hazardPts.push(new THREE.Vector3(hix, gy + 1.5, hz1));
      hazardPts.push(new THREE.Vector3(hix, gy + 2.5, hz1));
      hazardPts.push(new THREE.Vector3(hix, gy + 1.5, hz2));
      hazardPts.push(new THREE.Vector3(hix, gy + 2.5, hz2));
    }
    var hazardGeo = new THREE.BufferGeometry().setFromPoints(hazardPts);
    var hazardMat = new THREE.LineBasicMaterial({ color: 0xFFDD00 });
    var hazardLines = new THREE.LineSegments(hazardGeo, hazardMat);
    _scene.add(hazardLines);
    _track(hazardLines);

    /* ── Guard towers (4 corners) ── */
    var gtPositions = [
      { x: -45, z: -40 },
      { x:  45, z: -40 },
      { x: -45, z:  40 },
      { x:  45, z:  40 }
    ];
    for (var gti = 0; gti < gtPositions.length; gti++) {
      var gtp = gtPositions[gti];
      var gtGeo = new THREE.BoxGeometry(4, 20, 4);
      var gtMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
      var gt = new THREE.Mesh(gtGeo, gtMat);
      gt.position.set(gtp.x, gy + 10, gtp.z);
      _scene.add(gt);
      _track(gt);

      /* Tower top platform */
      var gtTopGeo = new THREE.BoxGeometry(6, 1.5, 6);
      var gtTopMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
      var gtTop = new THREE.Mesh(gtTopGeo, gtTopMat);
      gtTop.position.set(gtp.x, gy + 20.75, gtp.z);
      _scene.add(gtTop);
      _track(gtTop);

      /* Searchlight cone approximation using ConeGeometry */
      var slGeo = new THREE.ConeGeometry(3, 8, 12, 1, true);
      var slMat = new THREE.MeshBasicMaterial({ color: 0xFFFF88, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
      var sl = new THREE.Mesh(slGeo, slMat);
      sl.position.set(gtp.x, gy + 17, gtp.z);
      sl.rotation.x = Math.PI * 0.5;
      _scene.add(sl);
      _track(sl);

      var slLight = new THREE.SpotLight(0xFFFF88, 1.5, 40, Math.PI * 0.18, 0.3);
      slLight.position.set(gtp.x, gy + 21, gtp.z);
      _scene.add(slLight);
      _trackLight(slLight);

      _searchlights.push({
        light: slLight,
        cone:  sl,
        angle: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.3,
        cx:    gtp.x,
        cz:    gtp.z
      });
    }

    /* ── Emergency generator room ── */
    var egrGeo = new THREE.BoxGeometry(14, 5, 8);
    var egrMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var egr = new THREE.Mesh(egrGeo, egrMat);
    egr.position.set(-18, gy + 2.5, 28);
    _scene.add(egr);
    _track(egr);

    /* 2 generators inside */
    var genPositions = [{ x: -22, z: 28 }, { x: -14, z: 28 }];
    for (var gi = 0; gi < genPositions.length; gi++) {
      var gpos = genPositions[gi];
      var genGeo = new THREE.CylinderGeometry(1.5, 1.5, 3.5, 12);
      var genMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
      var gen = new THREE.Mesh(genGeo, genMat);
      gen.position.set(gpos.x, gy + 2.5, gpos.z);
      _scene.add(gen);
      _track(gen);
    }

    /* ── Coolant valve (E key pickup) ── */
    var cvGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
    var cvMat = new THREE.MeshLambertMaterial({ color: 0x44AACC });
    var cvMesh = new THREE.Mesh(cvGeo, cvMat);
    cvMesh.position.set(10, gy + 2.75, 15);
    _scene.add(cvMesh);
    _track(cvMesh);
    _coolantValve = { mesh: cvMesh, x: 10, y: gy + 2.75, z: 15, used: false };

    /* ── Radiation zones near reactor ── */
    var radDefs = [
      { x:  14, z: -5 },
      { x: -14, z:  5 }
    ];
    for (var ri = 0; ri < radDefs.length; ri++) {
      var rd = radDefs[ri];
      var radLight = new THREE.PointLight(0x44FF44, 0.9, 14);
      radLight.position.set(rd.x, gy + 3, rd.z);
      _scene.add(radLight);
      _trackLight(radLight);

      /* Radiation zone marker box */
      var rzGeo = new THREE.BoxGeometry(10, 0.2, 10);
      var rzMat = new THREE.MeshBasicMaterial({ color: 0x22AA22, transparent: true, opacity: 0.35 });
      var rzMesh = new THREE.Mesh(rzGeo, rzMat);
      rzMesh.position.set(rd.x, gy + 0.1, rd.z);
      _scene.add(rzMesh);
      _track(rzMesh);

      /* Radiation zone warning LineSegments border */
      var rzPts = [];
      rzPts.push(new THREE.Vector3(-5, 0.5, -5));
      rzPts.push(new THREE.Vector3( 5, 0.5, -5));
      rzPts.push(new THREE.Vector3( 5, 0.5, -5));
      rzPts.push(new THREE.Vector3( 5, 0.5,  5));
      rzPts.push(new THREE.Vector3( 5, 0.5,  5));
      rzPts.push(new THREE.Vector3(-5, 0.5,  5));
      rzPts.push(new THREE.Vector3(-5, 0.5,  5));
      rzPts.push(new THREE.Vector3(-5, 0.5, -5));
      var rzLGeo = new THREE.BufferGeometry().setFromPoints(rzPts);
      var rzLMat = new THREE.LineBasicMaterial({ color: 0x88FF00 });
      var rzLines = new THREE.LineSegments(rzLGeo, rzLMat);
      rzLines.position.set(rd.x, gy + 0.1, rd.z);
      _scene.add(rzLines);
      _track(rzLines);

      _radZones.push({ x: rd.x, z: rd.z, radius: 6, light: radLight });
    }

    /* ── Emergency exit zone ── */
    var exitGeo = new THREE.BoxGeometry(6, 3, 6);
    var exitMat = new THREE.MeshLambertMaterial({ color: 0x44CC44, transparent: true, opacity: 0.6 });
    var exitMesh = new THREE.Mesh(exitGeo, exitMat);
    exitMesh.position.set(50, gy + 1.5, 0);
    _scene.add(exitMesh);
    _track(exitMesh);

    /* Exit sign LineSegments */
    var exPts = [];
    exPts.push(new THREE.Vector3(-3, 0, -3));
    exPts.push(new THREE.Vector3( 3, 0, -3));
    exPts.push(new THREE.Vector3( 3, 0, -3));
    exPts.push(new THREE.Vector3( 3, 0,  3));
    exPts.push(new THREE.Vector3( 3, 0,  3));
    exPts.push(new THREE.Vector3(-3, 0,  3));
    exPts.push(new THREE.Vector3(-3, 0,  3));
    exPts.push(new THREE.Vector3(-3, 0, -3));
    var exGeo = new THREE.BufferGeometry().setFromPoints(exPts);
    var exMat = new THREE.LineBasicMaterial({ color: 0x00FF44 });
    var exLines = new THREE.LineSegments(exGeo, exMat);
    exLines.position.set(50, gy + 3.1, 0);
    _scene.add(exLines);
    _track(exLines);

    var exitLight = new THREE.PointLight(0x00FF44, 1.2, 12);
    exitLight.position.set(50, gy + 4, 0);
    _scene.add(exitLight);
    _trackLight(exitLight);

    _exitZone = { mesh: exitMesh, x: 50, z: 0 };

    /* ── Ambient lighting for plant ── */
    var ambLight = new THREE.AmbientLight(0x334455, 0.7);
    _scene.add(ambLight);
    _trackLight(ambLight);

    var mainLight = new THREE.DirectionalLight(0xDDEEFF, 0.8);
    mainLight.position.set(10, 40, 20);
    _scene.add(mainLight);
    _trackLight(mainLight);
  }

  /* ── Spawn steam particles above cooling towers ─────────────────────── */
  function _spawnSteamParticles() {
    var gy = _groundY(0, 0);
    var towerTops = [
      { x: -35, z: -10, baseY: gy + 24 },
      { x: -35, z:  10, baseY: gy + 24 }
    ];
    for (var i = 0; i < towerTops.length; i++) {
      var tt = towerTops[i];
      for (var j = 0; j < 5; j++) {
        var sGeo = new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 6, 5);
        var sMat = new THREE.MeshBasicMaterial({ color: 0xEEEEEE, transparent: true, opacity: 0.55 });
        var sMesh = new THREE.Mesh(sGeo, sMat);
        var offX = (Math.random() - 0.5) * 4;
        var offZ = (Math.random() - 0.5) * 4;
        sMesh.position.set(tt.x + offX, tt.baseY + Math.random() * 6, tt.z + offZ);
        _scene.add(sMesh);
        _track(sMesh);
        _steamParticles.push({
          mesh:   sMesh,
          mat:    sMat,
          baseX:  tt.x + offX,
          baseZ:  tt.z + offZ,
          baseY:  tt.baseY,
          speed:  2.0 + Math.random() * 1.5,
          t:      Math.random() * 3
        });
      }
    }
  }

  /* ── Spawn enemies ──────────────────────────────────────────────────── */
  function _spawnEnemies() {
    var gy = _groundY(0, 0);

    /* 12 eco-terrorists patrolling grounds */
    var terrPositions = [
      { x: -30, z: 30 },  { x: -20, z: 35 },  { x:  20, z: 30 },
      { x:  30, z: 25 },  { x:  35, z: -15 },  { x: -35, z: -20 },
      { x: -20, z: -35 }, { x:  10, z: -38 },  { x:  40, z:  10 },
      { x: -40, z:  15 }, { x:   0, z:  42 },  { x:  25, z: -30 }
    ];
    for (var ti = 0; ti < terrPositions.length; ti++) {
      var tp = terrPositions[ti];
      var tGeo = new THREE.BoxGeometry(1, 2, 1);
      var tMat = new THREE.MeshLambertMaterial({ color: 0x335533 });
      var tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(tp.x, gy + 1, tp.z);
      _scene.add(tMesh);
      _track(tMesh);

      /* Head */
      var thGeo = new THREE.SphereGeometry(0.38, 6, 5);
      var thMat = new THREE.MeshLambertMaterial({ color: 0x886655 });
      var thMesh = new THREE.Mesh(thGeo, thMat);
      thMesh.position.set(tp.x, gy + 2.38, tp.z);
      _scene.add(thMesh);
      _track(thMesh);

      var patrolDir = Math.random() * Math.PI * 2;
      _terrorists.push({
        body:        tMesh,
        head:        thMesh,
        x:           tp.x,
        y:           gy + 1,
        z:           tp.z,
        hp:          TERRORIST_HP,
        alive:       true,
        patrolDir:   patrolDir,
        patrolTimer: 0,
        shootTimer:  Math.random() * ENEMY_SHOOT_INTERVAL,
        type:        'terrorist'
      });
    }

    /* 7 tech saboteurs inside buildings */
    var sabPositions = [
      { x: -4, z: 24 }, { x:  4, z: 24 }, { x:  0, z: 22 },
      { x:  8, z: 25 }, { x: -8, z: 25 }, { x: 26, z:  3 },
      { x: 32, z: -3 }
    ];
    for (var si = 0; si < sabPositions.length; si++) {
      var sp = sabPositions[si];
      var sGeo = new THREE.BoxGeometry(1, 2, 1);
      var sMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
      var sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(sp.x, gy + 1, sp.z);
      _scene.add(sMesh);
      _track(sMesh);

      var shGeo = new THREE.SphereGeometry(0.38, 6, 5);
      var shMat = new THREE.MeshLambertMaterial({ color: 0x775544 });
      var shMesh = new THREE.Mesh(shGeo, shMat);
      shMesh.position.set(sp.x, gy + 2.38, sp.z);
      _scene.add(shMesh);
      _track(shMesh);

      _saboteurs.push({
        body:       sMesh,
        head:       shMesh,
        x:          sp.x,
        y:          gy + 1,
        z:          sp.z,
        hp:         SABOTEUR_HP,
        alive:      true,
        shootTimer: Math.random() * ENEMY_SHOOT_INTERVAL * 1.4,
        type:       'saboteur'
      });
    }

    /* ── Director Nacht — boss in control room ── */
    var nachtGeo = new THREE.BoxGeometry(1.2, 2.2, 1.2);
    var nachtMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var nachtMesh = new THREE.Mesh(nachtGeo, nachtMat);
    nachtMesh.position.set(0, gy + 1.1, 26);
    _scene.add(nachtMesh);
    _track(nachtMesh);

    var nachtHGeo = new THREE.SphereGeometry(0.45, 8, 6);
    var nachtHMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var nachtHMesh = new THREE.Mesh(nachtHGeo, nachtHMat);
    nachtHMesh.position.set(0, gy + 3.35, 26);
    _scene.add(nachtHMesh);
    _track(nachtHMesh);

    var nachtLight = new THREE.PointLight(0x220044, 1.0, 8);
    nachtLight.position.set(0, gy + 4, 26);
    _scene.add(nachtLight);
    _trackLight(nachtLight);

    _nacht = {
      body:       nachtMesh,
      head:       nachtHMesh,
      x:          0,
      y:          gy + 1.1,
      z:          26,
      hp:         NACHT_MAX_HP,
      alive:      true,
      phase2:     false,
      shootTimer: 1.5,
      light:      nachtLight,
      type:       'boss'
    };

    /* ── 2 bodyguards flanking Nacht ── */
    var bgPositions = [{ x: -4, z: 26 }, { x: 4, z: 26 }];
    for (var bi = 0; bi < bgPositions.length; bi++) {
      var bgp = bgPositions[bi];
      var bgGeo = new THREE.BoxGeometry(1.1, 2.1, 1.1);
      var bgMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
      var bgMesh = new THREE.Mesh(bgGeo, bgMat);
      bgMesh.position.set(bgp.x, gy + 1.05, bgp.z);
      _scene.add(bgMesh);
      _track(bgMesh);

      var bghGeo = new THREE.SphereGeometry(0.4, 6, 5);
      var bghMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
      var bghMesh = new THREE.Mesh(bghGeo, bghMat);
      bghMesh.position.set(bgp.x, gy + 2.45, bgp.z);
      _scene.add(bghMesh);
      _track(bghMesh);

      _bodyguards.push({
        body:       bgMesh,
        head:       bghMesh,
        x:          bgp.x,
        y:          gy + 1.05,
        z:          bgp.z,
        hp:         BODYGUARD_HP,
        alive:      true,
        shootTimer: Math.random() * ENEMY_SHOOT_INTERVAL,
        type:       'bodyguard'
      });
    }
  }

  /* ── Enemy shooting logic ───────────────────────────────────────────── */
  function _updateEnemyShoot(enemy, delta, px, pz) {
    if (!enemy.alive) return;
    var dsq = _distSq(enemy.x, enemy.z, px, pz);
    if (dsq > ENEMY_SHOOT_RANGE * ENEMY_SHOOT_RANGE) return;
    enemy.shootTimer -= delta;
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = ENEMY_SHOOT_INTERVAL + Math.random() * 0.8;
      _applyPlayerDamage(ENEMY_SHOOT_DAMAGE);
      _spawnBulletTracer(enemy.x, enemy.y + 1.2, enemy.z, px, _getPlayerPos().y + 1, pz, 0xFF4400);
    }
  }

  /* ── Terrorist patrol update ────────────────────────────────────────── */
  function _updateTerroristPatrol(terr, delta) {
    if (!terr.alive) return;
    terr.patrolTimer -= delta;
    if (terr.patrolTimer <= 0) {
      terr.patrolDir   = Math.random() * Math.PI * 2;
      terr.patrolTimer = 2 + Math.random() * 3;
    }
    var speed = ENEMY_MOVE_SPEED * 0.4 * delta;
    terr.x += Math.sin(terr.patrolDir) * speed;
    terr.z += Math.cos(terr.patrolDir) * speed;
    terr.body.position.set(terr.x, terr.y, terr.z);
    terr.head.position.set(terr.x, terr.y + 1.38, terr.z);
  }

  /* ── Shoot detection — called when player fires (via shooting system) ── */
  function _checkPlayerShot(px, py, pz, dirX, dirY, dirZ) {
    if (!_active) return false;
    var HIT_RANGE = 40;
    var HIT_RADIUS = 1.2;
    var hit = false;

    /* Check terrorists */
    for (var i = 0; i < _terrorists.length; i++) {
      var t = _terrorists[i];
      if (!t.alive) continue;
      if (_rayHitsBox(px, py, pz, dirX, dirY, dirZ, t.x, t.y + 1, t.z, 0.8, 2, 0.8, HIT_RANGE)) {
        t.hp -= 25 + Math.random() * 15;
        hit = true;
        if (t.hp <= 0) {
          _killEnemy(t);
        }
      }
    }

    /* Check saboteurs */
    for (var si = 0; si < _saboteurs.length; si++) {
      var s = _saboteurs[si];
      if (!s.alive) continue;
      if (_rayHitsBox(px, py, pz, dirX, dirY, dirZ, s.x, s.y + 1, s.z, 0.8, 2, 0.8, HIT_RANGE)) {
        s.hp -= 22 + Math.random() * 12;
        hit = true;
        if (s.hp <= 0) {
          _killEnemy(s);
          _hudNotify('SABOTEUR NEUTRALIZED — TIMER DRAIN REDUCED', '#AAFF44');
        }
      }
    }

    /* Check bodyguards */
    for (var bi = 0; bi < _bodyguards.length; bi++) {
      var bg = _bodyguards[bi];
      if (!bg.alive) continue;
      if (_rayHitsBox(px, py, pz, dirX, dirY, dirZ, bg.x, bg.y + 1, bg.z, 0.9, 2.1, 0.9, HIT_RANGE)) {
        bg.hp -= 28 + Math.random() * 14;
        hit = true;
        if (bg.hp <= 0) {
          _killEnemy(bg);
          _hudNotify('BODYGUARD DOWN', '#FF8800');
        }
      }
    }

    /* Check Nacht — only takes damage when both bodyguards dead */
    if (_nacht && _nacht.alive) {
      var bothDead = true;
      for (var bdi = 0; bdi < _bodyguards.length; bdi++) {
        if (_bodyguards[bdi].alive) { bothDead = false; break; }
      }
      if (!bothDead) {
        /* Check if player tried to shoot Nacht */
        if (_rayHitsBox(px, py, pz, dirX, dirY, dirZ, _nacht.x, _nacht.y + 1.1, _nacht.z, 1.0, 2.2, 1.0, HIT_RANGE)) {
          _hudNotify('BODYGUARDS PROTECT NACHT — ELIMINATE GUARDS FIRST!', '#FF4400');
          hit = true;
        }
      } else {
        if (_rayHitsBox(px, py, pz, dirX, dirY, dirZ, _nacht.x, _nacht.y + 1.1, _nacht.z, 1.0, 2.2, 1.0, HIT_RANGE)) {
          var dmg = 35 + Math.random() * 20;
          _nacht.hp -= dmg;
          hit = true;
          _hudNotify('NACHT HIT — ' + Math.floor(_nacht.hp) + '/' + NACHT_MAX_HP + ' HP', '#FF8800');

          /* Phase 2 trigger at 60% HP */
          if (!_nacht.phase2 && _nacht.hp <= NACHT_MAX_HP * NACHT_PHASE2_THRESH) {
            _nacht.phase2 = true;
            _triggerPhase2();
          }

          if (_nacht.hp <= 0) {
            _killEnemy(_nacht);
            _hudNotify('DIRECTOR NACHT ELIMINATED — REACH THE EMERGENCY EXIT!', '#00FF88');
          }
        }
      }
    }

    /* Check control panels — shooting them adds 30s */
    for (var ci = 0; ci < _controlPanels.length; ci++) {
      var cp = _controlPanels[ci];
      if (cp.shot) continue;
      if (_rayHitsBox(px, py, pz, dirX, dirY, dirZ, cp.x, cp.y, cp.z, 1.8, 2.4, 0.8, HIT_RANGE)) {
        cp.shot = true;
        _panelsShot++;
        _meltdownTimer += PANEL_TIME_BONUS;
        if (_meltdownTimer > 300) _meltdownTimer = 300; /* cap at 5 min */
        cp.mesh.material.color.setHex(0x884422);
        cp.lineSegs.material.color.setHex(0xFF2200);
        _hudNotify('CONTROL PANEL DESTROYED — MELTDOWN +30s (' + _panelsShot + '/3)', '#FFFF00');
        hit = true;
      }
    }

    return hit;
  }

  /* ── Simple ray-box intersection ────────────────────────────────────── */
  function _rayHitsBox(ox, oy, oz, dx, dy, dz, cx, cy, cz, hw, hh, hd, maxDist) {
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.0001) return false;
    dx /= len; dy /= len; dz /= len;

    var invDx = (Math.abs(dx) > 0.0001) ? 1 / dx : 1e10;
    var invDy = (Math.abs(dy) > 0.0001) ? 1 / dy : 1e10;
    var invDz = (Math.abs(dz) > 0.0001) ? 1 / dz : 1e10;

    var tx1 = (cx - hw - ox) * invDx;
    var tx2 = (cx + hw - ox) * invDx;
    var ty1 = (cy - hh - oy) * invDy;
    var ty2 = (cy + hh - oy) * invDy;
    var tz1 = (cz - hd - oz) * invDz;
    var tz2 = (cz + hd - oz) * invDz;

    var tmin = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2), Math.min(tz1, tz2));
    var tmax = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2), Math.max(tz1, tz2));

    if (tmax < 0 || tmin > tmax) return false;
    var t = (tmin < 0) ? tmax : tmin;
    return t >= 0 && t <= maxDist;
  }

  /* ── Kill enemy helper ───────────────────────────────────────────────── */
  function _killEnemy(enemy) {
    enemy.alive = false;
    enemy.hp    = 0;
    if (enemy.body) {
      enemy.body.position.y -= 0.9;
      enemy.body.rotation.x = Math.PI * 0.5;
    }
    if (enemy.head) {
      _scene.remove(enemy.head);
    }
    var gy = _groundY(enemy.x, enemy.z);
    _spawnBloodEffect(enemy.x, gy + 0.5, enemy.z);
  }

  /* ── Phase 2 meltdown trigger ────────────────────────────────────────── */
  function _triggerPhase2() {
    _phase2Triggered = true;
    var gy = _groundY(0, 0);
    _phase2Light = new THREE.PointLight(0xFF4400, 3, 50);
    _phase2Light.position.set(0, gy + 20, 0);
    _scene.add(_phase2Light);
    _trackLight(_phase2Light);

    /* Accelerate meltdown — reduce timer significantly */
    _meltdownTimer = Math.max(30, _meltdownTimer - 40);
    _hudNotify('NACHT PHASE 2 — PARTIAL MELTDOWN INITIATED! TIMER -40s!', '#FF0000');
    _hudNotify('RADIATION ZONES NOW CRITICAL!', '#FF3300');
  }

  /* ── Blood / hit effects ─────────────────────────────────────────────── */
  function _spawnBloodEffect(x, y, z) {
    var geo = new THREE.SphereGeometry(0.3, 5, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xAA1100, transparent: true, opacity: 0.85 });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    _scene.add(m);
    _effects.push({ mesh: m, mat: mat, t: 0, life: 1.2, scaleRate: 2, type: 'blood' });
  }

  /* ── Bullet tracer effect ────────────────────────────────────────────── */
  function _spawnBulletTracer(x1, y1, z1, x2, y2, z2, color) {
    var pts = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: color || 0xFF8800, transparent: true, opacity: 0.8 });
    var line = new THREE.LineSegments(geo, mat);
    _scene.add(line);
    _effects.push({ mesh: line, mat: mat, t: 0, life: 0.18, scaleRate: 0, type: 'tracer' });
  }

  /* ── Steam explosion effect ──────────────────────────────────────────── */
  function _spawnSteamCloud(x, y, z) {
    var geo = new THREE.SphereGeometry(2, 7, 5);
    var mat = new THREE.MeshBasicMaterial({ color: 0xCCDDEE, transparent: true, opacity: 0.75 });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    _scene.add(m);
    _effects.push({ mesh: m, mat: mat, t: 0, life: 2.0, scaleRate: 4, type: 'steam' });
  }

  /* ── Update visual effects ───────────────────────────────────────────── */
  function _updateEffects(delta) {
    for (var i = _effects.length - 1; i >= 0; i--) {
      var e = _effects[i];
      e.t += delta;
      var k = e.t / e.life;
      if (k >= 1) {
        if (_scene) _scene.remove(e.mesh);
        if (e.mesh && e.mesh.geometry) e.mesh.geometry.dispose();
        if (e.mat) e.mat.dispose();
        _effects.splice(i, 1);
        continue;
      }
      e.mat.opacity = (1 - k) * (e.type === 'blood' ? 0.85 : e.type === 'tracer' ? 0.8 : 0.75);
      if (e.scaleRate > 0) {
        var s = 1 + k * e.scaleRate;
        e.mesh.scale.set(s, s, s);
      }
    }
  }

  /* ── Update steam particles ──────────────────────────────────────────── */
  function _updateSteam(delta) {
    for (var i = 0; i < _steamParticles.length; i++) {
      var sp = _steamParticles[i];
      sp.t += delta;
      var rise = (sp.t * sp.speed) % 10;
      sp.mesh.position.y = sp.baseY + rise;
      var k = rise / 10;
      sp.mat.opacity = 0.55 * (1 - k);
      var s = 1 + k * 1.5;
      sp.mesh.scale.set(s, s, s);
    }
  }

  /* ── Update searchlights ─────────────────────────────────────────────── */
  function _updateSearchlights(delta) {
    for (var i = 0; i < _searchlights.length; i++) {
      var sl = _searchlights[i];
      sl.angle += sl.speed * delta;
      var targetX = sl.cx + Math.sin(sl.angle) * 20;
      var targetZ = sl.cz + Math.cos(sl.angle) * 20;
      var gy = _groundY(targetX, targetZ);
      sl.light.target.position.set(targetX, gy, targetZ);
      if (sl.light.target.updateMatrixWorld) sl.light.target.updateMatrixWorld();
      sl.cone.rotation.y = sl.angle;
    }
  }

  /* ── Update phase 2 light pulse ─────────────────────────────────────── */
  var _phase2PulseT = 0;
  function _updatePhase2(delta) {
    if (!_phase2Triggered || !_phase2Light) return;
    _phase2PulseT += delta * 3;
    _phase2Light.intensity = 2.0 + 1.5 * Math.sin(_phase2PulseT);
  }

  /* ── Update Nacht boss behaviour ─────────────────────────────────────── */
  function _updateNacht(delta, px, pz) {
    if (!_nacht || !_nacht.alive) return;
    /* Nacht stays in control room, just rotates to face player */
    var dx = px - _nacht.x;
    var dz = pz - _nacht.z;
    _nacht.body.rotation.y = -Math.atan2(dx, dz);
    _updateEnemyShoot(_nacht, delta * (_nacht.phase2 ? 1.6 : 1.0), px, pz);
  }

  /* ── Update saboteur drain ───────────────────────────────────────────── */
  function _saboteurDrainPerSecond() {
    var count = 0;
    for (var i = 0; i < _saboteurs.length; i++) {
      if (_saboteurs[i].alive) count++;
    }
    return count * SABOTEUR_TIMER_DRAIN;
  }

  /* ── Radiation zone check ────────────────────────────────────────────── */
  function _updateRadiation(delta, px, pz) {
    _inRadZone = false;
    var radMult = _phase2Triggered ? 1.5 : 1.0;
    for (var i = 0; i < _radZones.length; i++) {
      var rz = _radZones[i];
      var dsq = _distSq(px, pz, rz.x, rz.z);
      if (dsq < rz.radius * rz.radius) {
        _inRadZone = true;
        _applyPlayerDamage(RAD_DAMAGE_PER_S * radMult * delta);
        /* Flash the rad zone light */
        _radWarningFlash += delta * 8;
        rz.light.intensity = 0.7 + 0.5 * Math.abs(Math.sin(_radWarningFlash));
        break;
      }
    }
  }

  /* ── E key — coolant valve interaction ──────────────────────────────── */
  function _handleInteract() {
    if (!_active) return;
    var pos = _getPlayerPos();
    if (!_coolantValve || _coolantValve.used) {
      _hudNotify('COOLANT VALVE ALREADY USED', '#FF8800');
      return;
    }
    var dsq = _distSq(pos.x, pos.z, _coolantValve.x, _coolantValve.z);
    if (dsq > INTERACT_RANGE_SQ) {
      _hudNotify('MOVE TO THE COOLANT VALVE — PRESS E', '#0088FF');
      return;
    }
    _coolantValve.used = true;
    _coolantValve.mesh.material.color.setHex(0x667777);
    _meltdownTimer += COOLANT_VALVE_BONUS;
    if (_meltdownTimer > 300) _meltdownTimer = 300;
    _hudNotify('COOLANT RESTORED — MELTDOWN +45s (VALVE ONE-USE ONLY)', '#00CCFF');
    _spawnSteamCloud(_coolantValve.x, _coolantValve.y + 2, _coolantValve.z);
  }

  /* ── Check win condition ─────────────────────────────────────────────── */
  function _checkWin() {
    if (!_nacht || _nacht.alive) return false;

    /* All saboteurs must be neutralized */
    for (var i = 0; i < _saboteurs.length; i++) {
      if (_saboteurs[i].alive) return false;
    }

    /* Player must reach emergency exit */
    if (!_playerReachedExit) return false;

    return true;
  }

  /* ── Update HUD ──────────────────────────────────────────────────────── */
  function _updateHUD() {
    var mins = Math.floor(_meltdownTimer / 60);
    var secs = Math.floor(_meltdownTimer % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var timeColor = (_meltdownTimer < 60) ? '#FF0000' : (_meltdownTimer < 90 ? '#FF8800' : '#FFFFFF');

    var aliveSabs = 0;
    for (var i = 0; i < _saboteurs.length; i++) {
      if (_saboteurs[i].alive) aliveSabs++;
    }

    var nachPhase = '';
    if (_nacht) {
      if (!_nacht.alive) {
        nachPhase = 'NACHT:DEAD';
      } else if (_nacht.phase2) {
        nachPhase = 'NACHT:PHASE2';
      } else {
        nachPhase = 'NACHT:' + Math.floor((_nacht.hp / NACHT_MAX_HP) * 100) + '%';
      }
    }

    var bgAlive = 0;
    for (var bi = 0; bi < _bodyguards.length; bi++) {
      if (_bodyguards[bi].alive) bgAlive++;
    }

    var radWarn = _inRadZone ? ' [!! RADIATION !!]' : '';

    var hudText = 'SIEGE [' + timeStr + '] PANELS:' + _panelsShot + '/3 SABS:' + aliveSabs + '/' + _saboteurs.length +
                  ' GUARDS:' + bgAlive + ' ' + nachPhase + radWarn;

    _hudSetMission(hudText, timeColor);

    if (_meltdownTimer < 30 && typeof window !== 'undefined' && window.HUD && window.HUD.shake) {
      window.HUD.shake(0.3);
    }
  }

  /* ── Trigger mission fail ─────────────────────────────────────────────── */
  function _triggerFail(reason) {
    if (_meltdownFailed || _missionWon) return;
    _meltdownFailed = true;
    _active = false;

    var flashLight = new THREE.PointLight(0xFF3300, 8, 120);
    var gy = _groundY(0, 0);
    flashLight.position.set(0, gy + 30, 0);
    _scene.add(flashLight);
    _trackLight(flashLight);

    _hudNotify('MELTDOWN — MISSION FAILED: ' + (reason || 'CORE BREACH'), '#FF0000');

    if (typeof window !== 'undefined' && window.HUD && window.HUD.showGameOver) {
      window.HUD.showGameOver('NUCLEAR MELTDOWN');
    }

    if (typeof _onComplete === 'function') {
      try { _onComplete({ success: false, reason: reason || 'meltdown' }); } catch (e) {}
    }
  }

  /* ── Trigger mission win ─────────────────────────────────────────────── */
  function _triggerWin() {
    if (_missionWon || _meltdownFailed) return;
    _missionWon = true;
    _active = false;

    _hudNotify('POWER PLANT SECURED — MISSION COMPLETE', '#00FF88');
    _hudNotify('ALL THREATS NEUTRALIZED — MELTDOWN AVERTED', '#44FF88');

    if (typeof window !== 'undefined' && window.Marketplace && window.Marketplace.addOKC) {
      window.Marketplace.addOKC(WIN_SCORE);
    }

    if (typeof _onComplete === 'function') {
      try { _onComplete({ success: true, score: WIN_SCORE }); } catch (e) {}
    }
  }

  /* ── Key down handler ────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;
    var now = Date.now() / 1000;

    /* Double-P activation */
    if (e.code === 'KeyP') {
      _pPressCount++;
      if (_pPressCount === 1) {
        _pLastTime = now;
      } else if (_pPressCount >= 2) {
        if ((now - _pLastTime) <= KEY_WINDOW) {
          if (!_active && !_meltdownFailed && !_missionWon) {
            _pPressCount = 0;
            _activate();
          }
        } else {
          /* Too slow — reset */
          _pPressCount = 1;
          _pLastTime   = now;
        }
      }
    }

    if (!_active) return;

    /* E key — interact with coolant valve */
    if (e.code === 'KeyE' && !_eWasDown) {
      _eWasDown = true;
      _handleInteract();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyE') _eWasDown = false;
  }

  /* ── Activate module ─────────────────────────────────────────────────── */
  function _activate() {
    if (_active) return;
    reset();

    _buildEnvironment();
    _spawnSteamParticles();
    _spawnEnemies();

    _meltdownTimer   = MELTDOWN_START;
    _meltdownFailed  = false;
    _missionWon      = false;
    _phase2Triggered = false;
    _panelsShot      = 0;
    _active          = true;

    _hudNotify('POWER PLANT SIEGE ACTIVATED — RETAKE THE FACILITY!', '#00FFFF');
    _hudNotify('PRESS PP TO START | E: COOLANT VALVE | SHOOT PANELS FOR TIME', '#AAFFFF');
    _hudNotify('ELIMINATE SABOTEURS + NACHT + REACH EXIT TO WIN', '#AAFF88');

    /* Register shot hook if global shooting system supports it */
    if (typeof window !== 'undefined' && window.Weapons && window.Weapons.onShotFired) {
      window.Weapons.onShotFired(function (ox, oy, oz, dx, dy, dz) {
        _checkPlayerShot(ox, oy, oz, dx, dy, dz);
      });
    }
  }

  /* ── Public init ─────────────────────────────────────────────────────── */
  function init(scene, opts) {
    _scene      = scene;
    opts        = opts || {};
    _onComplete = opts.onComplete || null;

    if (!_keyHandlerAttached && typeof window !== 'undefined') {
      window.addEventListener('keydown', _onKeyDown);
      window.addEventListener('keyup',   _onKeyUp);
      _keyHandlerAttached = true;
    }
  }

  /* ── Public update ───────────────────────────────────────────────────── */
  function update(delta) {
    _updateEffects(delta);
    _updateSteam(delta);

    if (!_active) return;

    var pos = _getPlayerPos();
    var px  = pos.x;
    var pz  = pos.z;

    /* Meltdown clock — saboteurs actively reduce timer */
    var drainRate = 1.0 + _saboteurDrainPerSecond();
    _meltdownTimer -= delta * drainRate;

    if (_meltdownTimer <= 0) {
      _meltdownTimer = 0;
      _triggerFail('MELTDOWN — TIMER REACHED ZERO');
      return;
    }

    /* Enemy patrol and shooting */
    for (var ti = 0; ti < _terrorists.length; ti++) {
      _updateTerroristPatrol(_terrorists[ti], delta);
      _updateEnemyShoot(_terrorists[ti], delta, px, pz);
    }
    for (var si = 0; si < _saboteurs.length; si++) {
      _updateEnemyShoot(_saboteurs[si], delta, px, pz);
    }
    for (var bi = 0; bi < _bodyguards.length; bi++) {
      _updateEnemyShoot(_bodyguards[bi], delta, px, pz);
    }
    _updateNacht(delta, px, pz);

    /* Turbines spin */
    for (var trbi = 0; trbi < _turbines.length; trbi++) {
      _turbines[trbi].mesh.rotation.y += delta * (2.5 + trbi * 0.3);
    }

    /* Radiation zones */
    _updateRadiation(delta, px, pz);

    /* Searchlights */
    _updateSearchlights(delta);

    /* Phase 2 pulse */
    _updatePhase2(delta);

    /* Check if player is at exit zone */
    if (_exitZone && _distSq(px, pz, _exitZone.x, _exitZone.z) < 16) {
      if (!_playerReachedExit) {
        _playerReachedExit = true;
        _hudNotify('EMERGENCY EXIT REACHED', '#44FF44');
      }
    }

    /* Check win */
    if (_checkWin()) {
      _triggerWin();
      return;
    }

    /* HUD */
    _lastHudUpdate += delta;
    if (_lastHudUpdate >= 0.25) {
      _lastHudUpdate = 0;
      _updateHUD();
    }
  }

  /* ── Public reset / teardown ─────────────────────────────────────────── */
  function reset() {
    _active          = false;
    _meltdownFailed  = false;
    _missionWon      = false;
    _phase2Triggered = false;
    _phase2PulseT    = 0;
    _panelsShot      = 0;
    _meltdownTimer   = MELTDOWN_START;
    _inRadZone       = false;
    _radWarningFlash = 0;
    _playerReachedExit = false;
    _eWasDown        = false;

    if (_scene) {
      for (var i = 0; i < _meshes.length; i++) {
        var m = _meshes[i];
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) {
            for (var mi = 0; mi < m.material.length; mi++) m.material[mi].dispose();
          } else {
            m.material.dispose();
          }
        }
        _scene.remove(m);
      }
      for (var li = 0; li < _lights.length; li++) {
        _scene.remove(_lights[li]);
      }
      for (var ei = 0; ei < _effects.length; ei++) {
        var ef = _effects[ei];
        if (ef.mesh) {
          if (ef.mesh.geometry) ef.mesh.geometry.dispose();
          if (ef.mat) ef.mat.dispose();
          _scene.remove(ef.mesh);
        }
      }
    }

    _meshes          = [];
    _lights          = [];
    _effects         = [];
    _terrorists      = [];
    _saboteurs       = [];
    _bodyguards      = [];
    _controlPanels   = [];
    _radZones        = [];
    _turbines        = [];
    _steamParticles  = [];
    _searchlights    = [];
    _nacht           = null;
    _coolantValve    = null;
    _exitZone        = null;
    _phase2Light     = null;
  }

  /* ── Public query helpers ────────────────────────────────────────────── */
  function isActive()          { return _active; }
  function getMeltdownTimer()  { return _meltdownTimer; }
  function getPanelsShot()     { return _panelsShot; }
  function isInRadZone()       { return _inRadZone; }
  function getNachtPhase()     { return _nacht ? (_nacht.phase2 ? 2 : 1) : 0; }
  function getNachtHp()        { return _nacht ? _nacht.hp : 0; }

  /* Expose shot handler so host game loop can call it */
  function onPlayerShot(ox, oy, oz, dx, dy, dz) {
    return _checkPlayerShot(ox, oy, oz, dx, dy, dz);
  }

  /* ── Public API ──────────────────────────────────────────────────────── */
  return {
    init:             init,
    update:           update,
    reset:            reset,
    isActive:         isActive,
    getMeltdownTimer: getMeltdownTimer,
    getPanelsShot:    getPanelsShot,
    isInRadZone:      isInRadZone,
    getNachtPhase:    getNachtPhase,
    getNachtHp:       getNachtHp,
    onPlayerShot:     onPlayerShot
  };
}());
