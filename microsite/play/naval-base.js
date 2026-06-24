/* ───────────────────────────────────────────────────────────────────────────
   naval-base.js — Enemy naval base environment
   Destroyer docked at pier, torpedo storage shed, dry dock with submarine,
   command tower with radar dish, fuel depot, coastal artillery, crane,
   patrol boat, anchor chains, mines, breakwater, signal tower.

   API: window.NavalBase = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.NavalBase = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var PIER_X              = 0;
  var PIER_Z              = 50;
  var PIER_LENGTH         = 40;
  var PIER_HEIGHT         = 0.5;
  var PIER_WIDTH          = 8;
  var DESTROYER_X         = 0;
  var DESTROYER_Z         = 35;
  var DESTROYER_LENGTH    = 18;
  var DESTROYER_BEAM      = 3.5;
  var DESTROYER_DRAFT     = 1.2;
  var TORPEDO_SHED_X      = -25;
  var TORPEDO_SHED_Z      = 60;
  var DRY_DOCK_X          = 25;
  var DRY_DOCK_Z          = 45;
  var COMMAND_TOWER_X     = -10;
  var COMMAND_TOWER_Z     = 70;
  var FUEL_DEPOT_X        = 35;
  var FUEL_DEPOT_Z        = 65;
  var ARTILLERY_RADIUS    = 80;
  var WATER_Y             = 0.0;

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene            = null;
  var _camera           = null;
  var _initialized      = false;

  var _objects          = [];   /* all scene objects for cleanup */
  var _radarDish        = null; /* for rotation animation */
  var _destroyerGroup   = null; /* for rocking animation */
  var _crane            = null; /* for swinging animation */
  var _signalLights     = [];   /* for blinking animation */
  var _fueltankGauges   = [];   /* for pulsing animation */

  var _radarRotSpeed    = 1.5;  /* rad/s */
  var _destroyerRockSpd = 0.8;  /* rad/s */
  var _craneSwingSpd    = 1.0;  /* rad/s */
  var _signalBlinkRate  = 0.5;  /* s */
  var _gaugeTime        = 0;
  var _craneTime        = 0;
  var _radarTime        = 0;
  var _rockTime         = 0;
  var _signalTime       = 0;

  /* ── helpers ───────────────────────────────────────────────────────────── */
  function _makeColor(hex) {
    return new THREE.MeshLambertMaterial({ color: hex });
  }

  function _makeMat(hex, opts) {
    var cfg = { color: hex };
    if (opts) {
      if (opts.transparent !== undefined) cfg.transparent = opts.transparent;
      if (opts.opacity !== undefined)     cfg.opacity     = opts.opacity;
      if (opts.side !== undefined)        cfg.side        = opts.side;
      if (opts.depthWrite !== undefined)  cfg.depthWrite  = opts.depthWrite;
    }
    return new THREE.MeshLambertMaterial(cfg);
  }

  function _box(w, h, d, mat) {
    var geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, mat) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    return new THREE.Mesh(geo, mat);
  }

  function _cylinder(rt, rb, h, mat) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    return new THREE.Mesh(geo, mat);
  }

  function _cone(r, h, mat) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    return new THREE.Mesh(geo, mat);
  }

  function _v3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function _addObject(obj) {
    _scene.add(obj);
    _objects.push(obj);
    return obj;
  }

  /* ── pier ──────────────────────────────────────────────────────────────── */
  function _buildPier() {
    var mat = _makeColor(0x555555);
    var pier = _box(PIER_WIDTH, PIER_HEIGHT, PIER_LENGTH, mat);
    pier.position.set(PIER_X, PIER_HEIGHT / 2, PIER_Z);
    _addObject(pier);

    /* pier support pilings */
    var pilingMat = _makeColor(0x3A3A3A);
    for (var i = 0; i < 8; i++) {
      var pz = PIER_Z - (PIER_LENGTH / 2) + (i * PIER_LENGTH / 7);
      var piling = _cylinder(0.3, 0.3, 1.0, pilingMat);
      piling.position.set(PIER_X - 4, -0.5, pz);
      _addObject(piling);
      var piling2 = _cylinder(0.3, 0.3, 1.0, pilingMat);
      piling2.position.set(PIER_X + 4, -0.5, pz);
      _addObject(piling2);
    }

    /* mooring cleats */
    var cleatMat = _makeColor(0x888888);
    for (var j = 0; j < 4; j++) {
      var cz = PIER_Z - 12 + j * 8;
      var cleat = _cylinder(0.15, 0.15, 0.3, cleatMat);
      cleat.position.set(PIER_X + 4.2, 1.0, cz);
      _addObject(cleat);
      var cleat2 = _cylinder(0.15, 0.15, 0.3, cleatMat);
      cleat2.position.set(PIER_X - 4.2, 1.0, cz);
      _addObject(cleat2);
    }
  }

  /* ── destroyer ─────────────────────────────────────────────────────────── */
  function _buildDestroyer() {
    var grp = new THREE.Group();

    /* hull */
    var hullMat = _makeColor(0x336699);
    var hull = _box(DESTROYER_LENGTH, DESTROYER_DRAFT, DESTROYER_BEAM, hullMat);
    hull.position.set(0, DESTROYER_DRAFT / 2, 0);
    grp.add(hull);

    /* superstructure forward */
    var superMat = _makeColor(0xCCCCCC);
    var super1 = _box(3, 3, 2.5, superMat);
    super1.position.set(5, 3, 0);
    grp.add(super1);

    /* superstructure aft */
    var super2 = _box(2.5, 2.5, 2, superMat);
    super2.position.set(-4, 2.5, 0);
    grp.add(super2);

    /* gun mounts */
    var gunMat = _makeColor(0x888888);
    var gun1 = _cylinder(0.25, 0.25, 0.8, gunMat);
    gun1.position.set(7, 4, 1.2);
    grp.add(gun1);
    var gun2 = _cylinder(0.25, 0.25, 0.8, gunMat);
    gun2.position.set(7, 4, -1.2);
    grp.add(gun2);

    /* radar antenna on superstructure */
    var radarBase = _cylinder(0.2, 0.2, 0.5, gunMat);
    radarBase.position.set(5, 6.5, 0);
    grp.add(radarBase);

    /* radar dish (will be rotated) */
    var radarDish = _cone(1.2, 0.3, gunMat);
    radarDish.position.set(5, 7.5, 0);
    grp.add(radarDish);
    _radarDish = radarDish;

    /* mast */
    var mast = _cylinder(0.1, 0.1, 5, gunMat);
    mast.position.set(6, 7, 0);
    grp.add(mast);

    grp.position.set(DESTROYER_X, WATER_Y, DESTROYER_Z);
    _destroyerGroup = grp;
    _addObject(grp);
  }

  /* ── torpedo storage shed ──────────────────────────────────────────────── */
  function _buildTorpedoShed() {
    var grp = new THREE.Group();

    /* main shed structure */
    var shedMat = _makeColor(0x654321);
    var shed = _box(12, 5, 8, shedMat);
    shed.position.set(0, 2.5, 0);
    grp.add(shed);

    /* roof */
    var roofMat = _makeColor(0x444444);
    var roof = _box(12.5, 0.5, 8.5, roofMat);
    roof.position.set(0, 5.5, 0);
    grp.add(roof);

    /* torpedo racks inside - 3 rows */
    var torpMat = _makeColor(0xFF6600);
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var torp = _cylinder(0.2, 0.2, 3, torpMat);
        torp.rotation.z = Math.PI / 2;
        torp.position.set(-3 + col * 2.5, 1.5 + row * 1.2, 0);
        grp.add(torp);
      }
    }

    /* wooden support posts */
    var postMat = _makeColor(0x8B4513);
    for (var p = 0; p < 4; p++) {
      var post = _box(0.4, 5, 0.4, postMat);
      post.position.set(-5 + p * 3.3, 2.5, -3);
      grp.add(post);
    }

    grp.position.set(TORPEDO_SHED_X, WATER_Y, TORPEDO_SHED_Z);
    _addObject(grp);
  }

  /* ── dry dock with submarine ───────────────────────────────────────────── */
  function _buildDryDock() {
    var grp = new THREE.Group();

    /* dry dock walls - left and right */
    var wallMat = _makeColor(0x555555);
    var wallLeft = _box(1, 8, 20, wallMat);
    wallLeft.position.set(-7, 4, 0);
    grp.add(wallLeft);
    var wallRight = _box(1, 8, 20, wallMat);
    wallRight.position.set(7, 4, 0);
    grp.add(wallRight);

    /* dry dock floor */
    var floorMat = _makeColor(0x333333);
    var floor = _box(14, 0.5, 20, floorMat);
    floor.position.set(0, 0.25, 0);
    grp.add(floor);

    /* submarine hull */
    var subMat = _makeColor(0x2F4F4F);
    var subHull = _cylinder(0.8, 0.8, 12, subMat);
    subHull.rotation.z = Math.PI / 2;
    subHull.position.set(0, 2.5, 0);
    grp.add(subHull);

    /* submarine sail (conning tower) */
    var sailMat = _makeColor(0x444444);
    var sail = _box(1.5, 2, 1.2, sailMat);
    sail.position.set(0, 4, 0);
    grp.add(sail);

    /* periscope */
    var peri = _cylinder(0.08, 0.08, 1.5, sailMat);
    peri.position.set(-0.3, 5.2, 0);
    grp.add(peri);

    grp.position.set(DRY_DOCK_X, WATER_Y, DRY_DOCK_Z);
    _addObject(grp);
  }

  /* ── command tower ─────────────────────────────────────────────────────── */
  function _buildCommandTower() {
    var grp = new THREE.Group();

    /* base */
    var baseMat = _makeColor(0x336699);
    var base = _box(4, 2, 4, baseMat);
    base.position.set(0, 1, 0);
    grp.add(base);

    /* level 1 */
    var level1Mat = _makeColor(0xCCCCCC);
    var level1 = _box(3.5, 2, 3.5, level1Mat);
    level1.position.set(0, 4, 0);
    grp.add(level1);

    /* level 2 */
    var level2 = _box(3, 2, 3, level1Mat);
    level2.position.set(0, 7, 0);
    grp.add(level2);

    /* level 3 - upper platform */
    var level3 = _box(2.5, 1.5, 2.5, level1Mat);
    level3.position.set(0, 9.5, 0);
    grp.add(level3);

    /* antenna mast */
    var mastMat = _makeColor(0x888888);
    var mast = _cylinder(0.1, 0.1, 4, mastMat);
    mast.position.set(0, 12, 0);
    grp.add(mast);

    /* radar dish */
    var radarMat = _makeColor(0x888888);
    var radar = _cone(1.5, 0.4, radarMat);
    radar.position.set(0, 14.5, 0);
    grp.add(radar);

    /* signal lamp on top */
    var lampMat = _makeColor(0xFFFF00);
    var lamp = _sphere(0.3, lampMat);
    lamp.position.set(1, 10.5, 0);
    grp.add(lamp);
    _signalLights.push(lamp);

    grp.position.set(COMMAND_TOWER_X, WATER_Y, COMMAND_TOWER_Z);
    _addObject(grp);
  }

  /* ── fuel storage depot ────────────────────────────────────────────────── */
  function _buildFuelDepot() {
    var grp = new THREE.Group();

    /* fuel storage tanks - 3 large spheres */
    var tankMat = _makeColor(0xFF6600);
    for (var i = 0; i < 3; i++) {
      var tank = _sphere(1.8, tankMat);
      tank.position.set(-3 + i * 3.5, 2, 0);
      grp.add(tank);
      _fueltankGauges.push(tank);

      /* pressure gauge visual on tank */
      var gaugeMat = _makeColor(0xFFFF00);
      var gauge = _sphere(0.2, gaugeMat);
      gauge.position.set(-3 + i * 3.5, 4, 0.5);
      grp.add(gauge);
    }

    /* fuel pipes connecting tanks */
    var pipeMat = _makeColor(0x888888);
    var pipe1 = _cylinder(0.15, 0.15, 3, pipeMat);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, 2, -2);
    grp.add(pipe1);

    /* support structure */
    var supportMat = _makeColor(0x555555);
    for (var s = 0; s < 6; s++) {
      var support = _box(0.3, 4, 0.3, supportMat);
      support.position.set(-4.5 + s * 2, 2, -3);
      grp.add(support);
    }

    grp.position.set(FUEL_DEPOT_X, WATER_Y, FUEL_DEPOT_Z);
    _addObject(grp);
  }

  /* ── coastal defense guns ──────────────────────────────────────────────── */
  function _buildCoastalGuns() {
    var gunMat = _makeColor(0x333333);
    var positions = [
      { x: 60, z: 80 },
      { x: -70, z: 75 },
      { x: 45, z: -60 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var grp = new THREE.Group();

      /* gun emplacement */
      var base = _box(3, 1, 3, gunMat);
      base.position.set(0, 0.5, 0);
      grp.add(base);

      /* turret */
      var turret = _cylinder(1.2, 1.2, 1, gunMat);
      turret.position.set(0, 1.8, 0);
      grp.add(turret);

      /* barrel */
      var barrelMat = _makeColor(0x222222);
      var barrel = _cylinder(0.15, 0.15, 3, barrelMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(1.5, 2.3, 0);
      grp.add(barrel);

      /* ammo boxes around gun */
      var ammoMat = _makeColor(0x444444);
      for (var a = 0; a < 3; a++) {
        var ammobox = _box(0.8, 0.5, 0.8, ammoMat);
        ammobox.position.set(-2 + a * 2, 0.5, 2);
        grp.add(ammobox);
      }

      grp.position.set(pos.x, WATER_Y, pos.z);
      _addObject(grp);
    }
  }

  /* ── crane over dry dock ───────────────────────────────────────────────── */
  function _buildCrane() {
    var grp = new THREE.Group();

    /* crane tower base */
    var baseMat = _makeColor(0x555555);
    var base = _box(2, 12, 2, baseMat);
    base.position.set(0, 6, 0);
    grp.add(base);

    /* crane arm - jib */
    var jibMat = _makeColor(0x888888);
    var jib = _box(18, 0.6, 0.6, jibMat);
    jib.position.set(8, 12, 0);
    grp.add(jib);

    /* cable winch and hook holder on jib */
    var hookMat = _makeColor(0xFFFF00);
    var hook = _sphere(0.3, hookMat);
    hook.position.set(6, 11.2, 0);
    grp.add(hook);

    /* counter-weight on other end */
    var cwMat = _makeColor(0x666666);
    var cw = _box(1.5, 1.5, 1.5, cwMat);
    cw.position.set(-3, 12, 0);
    grp.add(cw);

    grp.position.set(DRY_DOCK_X + 15, WATER_Y, DRY_DOCK_Z + 5);
    _crane = grp;
    _addObject(grp);
  }

  /* ── patrol boat ───────────────────────────────────────────────────────── */
  function _buildPatrolBoat() {
    var grp = new THREE.Group();

    /* hull */
    var hullMat = _makeColor(0x1A1A1A);
    var hull = _box(6, 1, 2, hullMat);
    hull.position.set(0, 0.5, 0);
    grp.add(hull);

    /* wheelhouse */
    var whMat = _makeColor(0x2D3A1E);
    var wh = _box(1.5, 1.2, 1.5, whMat);
    wh.position.set(1, 1.3, 0);
    grp.add(wh);

    /* MG mount */
    var mgMat = _makeColor(0x222222);
    var mg = _cylinder(0.05, 0.05, 1.0, mgMat);
    mg.rotation.z = Math.PI / 2;
    mg.position.set(2, 1.5, 0);
    grp.add(mg);

    grp.position.set(-40, 0.5, 45);
    _addObject(grp);
  }

  /* ── anchor chains and piles ───────────────────────────────────────────── */
  function _buildAnchorChains() {
    var chainMat = _makeColor(0x555555);
    var positions = [
      { x: 10, z: 25 },
      { x: -15, z: 28 },
      { x: 20, z: 32 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      /* pile */
      var pile = _cylinder(0.4, 0.4, 3, chainMat);
      pile.position.set(pos.x, 1.5, pos.z);
      _addObject(pile);

      /* chain coil */
      var chain = _cylinder(0.25, 0.25, 0.5, chainMat);
      chain.position.set(pos.x, 2.2, pos.z);
      _addObject(chain);
    }
  }

  /* ── naval mines stacked ───────────────────────────────────────────────── */
  function _buildMinePile() {
    var mineMat = _makeColor(0xFF0000);
    var x = -45;
    var z = 70;

    /* stack of 4 mines */
    for (var row = 0; row < 2; row++) {
      for (var col = 0; col < 2; col++) {
        var mine = _sphere(0.6, mineMat);
        mine.position.set(x + col * 1.5, 1 + row * 1.3, z);
        _addObject(mine);

        /* mine spikes */
        var spikeMat = _makeColor(0xAA0000);
        for (var s = 0; s < 3; s++) {
          var spike = _cone(0.15, 0.5, spikeMat);
          var angle = (s / 3) * Math.PI * 2;
          spike.position.set(
            x + col * 1.5 + Math.cos(angle) * 0.8,
            1.8 + row * 1.3,
            z + Math.sin(angle) * 0.8
          );
          _addObject(spike);
        }
      }
    }
  }

  /* ── breakwater rocks ──────────────────────────────────────────────────── */
  function _buildBreakwater() {
    var rockMat = _makeColor(0x505050);
    var rockPositions = [
      { x: -80, z: 40 },
      { x: -75, z: 50 },
      { x: -70, z: 35 },
      { x: -85, z: 55 },
      { x: -65, z: 45 },
      { x: -90, z: 48 }
    ];

    for (var i = 0; i < rockPositions.length; i++) {
      var pos = rockPositions[i];
      var rock = _box(2 + Math.random() * 1, 1.5 + Math.random() * 0.8, 1.8 + Math.random() * 0.7, rockMat);
      rock.position.set(pos.x, 0.8, pos.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      _addObject(rock);
    }
  }

  /* ── signal tower with lights ──────────────────────────────────────────── */
  function _buildSignalTower() {
    var grp = new THREE.Group();

    /* tower post */
    var postMat = _makeColor(0x336699);
    var post = _box(0.5, 6, 0.5, postMat);
    post.position.set(0, 3, 0);
    grp.add(post);

    /* signal lights - colored bulbs */
    var colors = [0xFF0000, 0xFFFF00, 0x00FF00];
    for (var i = 0; i < 3; i++) {
      var light = _sphere(0.25, _makeColor(colors[i]));
      light.position.set(0, 4.5 + i * 0.7, 0.5);
      grp.add(light);
      _signalLights.push(light);
    }

    /* cross-arm */
    var armMat = _makeColor(0x888888);
    var arm = _box(3, 0.3, 0.3, armMat);
    arm.position.set(0, 5.5, 0);
    grp.add(arm);

    grp.position.set(50, WATER_Y, 85);
    _addObject(grp);
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;
    _scene = scene;
    _camera = camera;

    /* build all structures */
    _buildPier();
    _buildDestroyer();
    _buildTorpedoShed();
    _buildDryDock();
    _buildCommandTower();
    _buildFuelDepot();
    _buildCoastalGuns();
    _buildCrane();
    _buildPatrolBoat();
    _buildAnchorChains();
    _buildMinePile();
    _buildBreakwater();
    _buildSignalTower();
  }

  function update(delta) {
    if (!_initialized) return;

    /* radar dish rotation */
    if (_radarDish) {
      _radarTime += delta;
      _radarDish.rotation.y = _radarTime * _radarRotSpeed;
    }

    /* destroyer gently rocking on waves */
    if (_destroyerGroup) {
      _rockTime += delta;
      var rockAmount = Math.sin(_rockTime * _destroyerRockSpd) * 0.015;
      _destroyerGroup.rotation.z = rockAmount;
      _destroyerGroup.position.y = WATER_Y + Math.cos(_rockTime * _destroyerRockSpd * 0.5) * 0.08;
    }

    /* crane arm swinging */
    if (_crane) {
      _craneTime += delta;
      var swingAmount = Math.sin(_craneTime * _craneSwingSpd) * 0.08;
      _crane.rotation.y = swingAmount;
    }

    /* signal lights blinking pattern */
    if (_signalLights.length > 0) {
      _signalTime += delta;
      var blinks = Math.floor(_signalTime / _signalBlinkRate);
      var onOff = (blinks % 2) === 0;
      for (var i = 0; i < _signalLights.length; i++) {
        _signalLights[i].material.opacity = onOff ? 1.0 : 0.2;
        _signalLights[i].material.transparent = true;
      }
    }

    /* fuel tank pressure gauge pulsing */
    if (_fueltankGauges.length > 0) {
      _gaugeTime += delta;
      var pulseAmount = 0.95 + Math.sin(_gaugeTime * 1.5) * 0.05;
      for (var j = 0; j < _fueltankGauges.length; j++) {
        _fueltankGauges[j].scale.setScalar(pulseAmount);
      }
    }
  }

  function reset() {
    /* remove all objects */
    for (var i = 0; i < _objects.length; i++) {
      _scene.remove(_objects[i]);
    }
    _objects = [];
    _radarDish = null;
    _destroyerGroup = null;
    _crane = null;
    _signalLights = [];
    _fueltankGauges = [];

    /* reset timers */
    _radarTime = 0;
    _rockTime = 0;
    _craneTime = 0;
    _signalTime = 0;
    _gaugeTime = 0;
    _initialized = false;
  }

  return { init: init, update: update, reset: reset };
}());
