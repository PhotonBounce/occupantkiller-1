/* ───────────────────────────────────────────────────────────────────────────
   aircraft-carrier.js — Hostile aircraft carrier at sea
   Massive flight deck, jet fighters parked, island superstructure, catapult
   launch systems, arresting wires, below-deck hangar, ammo elevators,
   anti-aircraft guns, radar antenna, landing signal lights.

   Theme: Multi-level carrier warfare with dynamic animated systems

   API: window.AircraftCarrier = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.AircraftCarrier = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var FLIGHT_DECK_WIDTH       = 80;
  var FLIGHT_DECK_LENGTH      = 180;
  var FLIGHT_DECK_HEIGHT      = 0.8;
  var FLIGHT_DECK_Y           = 12;
  var ISLAND_WIDTH            = 15;
  var ISLAND_HEIGHT           = 35;
  var ISLAND_DEPTH            = 12;
  var JET_LENGTH              = 18;
  var JET_HEIGHT              = 5;
  var JET_WING_SPAN           = 12;
  var CATAPULT_COUNT          = 2;
  var CATAPULT_LENGTH         = 90;
  var CATAPULT_WIDTH          = 3.5;
  var ARRESTING_WIRE_COUNT    = 4;
  var HANGAR_HEIGHT           = 10;
  var HANGAR_ACCESS_X         = -20;
  var AA_GUN_COUNT            = 6;
  var RADAR_HEIGHT            = 8;
  var ELEVATOR_CYCLE_TIME     = 4.0;
  var CATAPULT_PULSE_RATE     = 2.5;
  var LANDING_LIGHT_BLINK     = 0.8;
  var DECK_CREW_LIGHT_BLINK   = 1.2;
  var RADAR_ROTATE_SPEED      = 0.8;

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene           = null;
  var _camera          = null;
  var _initialized     = false;

  /* carrier structure */
  var _carrierGroup    = null;
  var _flightDeck      = null;
  var _island          = null;
  var _hangar          = null;
  var _elevator        = null;
  var _radarAntenna    = null;
  var _catapults       = [];
  var _arrestingWires  = [];
  var _aaGuns          = [];
  var _parkedJets      = [];
  var _landingLights   = [];
  var _deckCrewLights  = [];
  var _jetBlastDeflectors = [];

  /* animation timers */
  var _elevatorTimer   = 0;
  var _catapultTimer   = 0;
  var _landingLightTimer = 0;
  var _deckCrewLightTimer = 0;
  var _radarRotation   = 0;

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
      if (opts.emissive !== undefined)    cfg.emissive    = opts.emissive;
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

  function _lineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  /* ── flight deck ────────────────────────────────────────────────────────── */
  function _createFlightDeck() {
    var grp = new THREE.Group();

    /* main flight deck surface — enormous flat box */
    var deckMat = _makeColor(0x888888);
    var deck = _box(FLIGHT_DECK_WIDTH, FLIGHT_DECK_HEIGHT, FLIGHT_DECK_LENGTH, deckMat);
    deck.position.y = FLIGHT_DECK_Y;
    grp.add(deck);

    /* deck markings — yellow strips */
    var markMat = _makeMat(0xFFFF00, { transparent: true, opacity: 0.6 });
    var stripSpacing = 20;
    for (var i = 0; i < FLIGHT_DECK_LENGTH / stripSpacing; i++) {
      var markZ = (i - FLIGHT_DECK_LENGTH / 2 / stripSpacing) * stripSpacing;
      var mark = _box(2, 0.05, 4, markMat);
      mark.position.set(0, FLIGHT_DECK_Y + 0.5, markZ);
      grp.add(mark);
    }

    /* center line dashes */
    for (var j = 0; j < FLIGHT_DECK_LENGTH / stripSpacing; j += 2) {
      var dashZ = (j - FLIGHT_DECK_LENGTH / 2 / stripSpacing) * stripSpacing;
      var dash = _box(1, 0.05, 2, markMat);
      dash.position.set(0, FLIGHT_DECK_Y + 0.6, dashZ);
      grp.add(dash);
    }

    /* safety netting on edges */
    var netMat = _makeMat(0xFF6600, { transparent: true, opacity: 0.4 });
    var netLeft = _box(1, 8, FLIGHT_DECK_LENGTH, netMat);
    netLeft.position.set(-FLIGHT_DECK_WIDTH / 2 - 0.5, FLIGHT_DECK_Y + 4, 0);
    grp.add(netLeft);

    var netRight = _box(1, 8, FLIGHT_DECK_LENGTH, netMat);
    netRight.position.set(FLIGHT_DECK_WIDTH / 2 + 0.5, FLIGHT_DECK_Y + 4, 0);
    grp.add(netRight);

    var netFront = _box(FLIGHT_DECK_WIDTH, 8, 1, netMat);
    netFront.position.set(0, FLIGHT_DECK_Y + 4, FLIGHT_DECK_LENGTH / 2 + 0.5);
    grp.add(netFront);

    var netBack = _box(FLIGHT_DECK_WIDTH, 8, 1, netMat);
    netBack.position.set(0, FLIGHT_DECK_Y + 4, -FLIGHT_DECK_LENGTH / 2 - 0.5);
    grp.add(netBack);

    _flightDeck = grp;
    return grp;
  }

  /* ── island superstructure ──────────────────────────────────────────────── */
  function _createIsland() {
    var grp = new THREE.Group();
    grp.position.set(-FLIGHT_DECK_WIDTH / 2 + 8, FLIGHT_DECK_Y, -FLIGHT_DECK_LENGTH / 2 + 15);

    /* main tower */
    var towerMat = _makeColor(0x334455);
    var tower = _box(ISLAND_WIDTH, ISLAND_HEIGHT, ISLAND_DEPTH, towerMat);
    tower.position.y = ISLAND_HEIGHT / 2;
    grp.add(tower);

    /* radar antenna platform */
    var radarBaseMat = _makeColor(0x556677);
    var radarBase = _cylinder(3, 3, 2, radarBaseMat);
    radarBase.position.set(0, ISLAND_HEIGHT + 2, 0);
    grp.add(radarBase);

    /* rotating radar antenna */
    var radarAntennaMat = _makeColor(0xFF8800);
    var antenna = _box(8, 1.5, 0.3, radarAntennaMat);
    antenna.position.set(0, ISLAND_HEIGHT + 4, 0);
    var radarGroup = new THREE.Group();
    radarGroup.position.set(0, ISLAND_HEIGHT + 4, 0);
    radarGroup.add(antenna);
    grp.add(radarGroup);
    _radarAntenna = radarGroup;

    /* communications tower section */
    var commMat = _makeColor(0x444444);
    var comm1 = _cylinder(0.5, 0.5, 3, commMat);
    comm1.position.set(4, ISLAND_HEIGHT - 5, 2);
    grp.add(comm1);

    var comm2 = _cylinder(0.4, 0.4, 2.5, commMat);
    comm2.position.set(-3, ISLAND_HEIGHT - 3, 1);
    grp.add(comm2);

    _island = grp;
    return grp;
  }

  /* ── catapult systems ───────────────────────────────────────────────────── */
  function _createCatapults() {
    for (var c = 0; c < CATAPULT_COUNT; c++) {
      var grp = new THREE.Group();
      var catZ = (FLIGHT_DECK_LENGTH / 4) * (c === 0 ? -1 : 1);
      grp.position.set(-FLIGHT_DECK_WIDTH / 3 + c * 15, FLIGHT_DECK_Y, catZ);

      /* track — catapult rail */
      var trackPoints = [
        -CATAPULT_LENGTH / 2, 0.3, 0,
        CATAPULT_LENGTH / 2, 0.3, 0
      ];
      var trackLine = _lineSegments(trackPoints, 0xFF6600);
      grp.add(trackLine);

      /* pressure indicator pulsing box */
      var pressMat = _makeMat(0xFF6600);
      var press = _box(CATAPULT_WIDTH, 0.8, 2, pressMat);
      press.position.z = CATAPULT_LENGTH / 3;
      grp.add(press);

      /* catapult shuttle (moves along track) */
      var shuttleMat = _makeColor(0x996633);
      var shuttle = _box(CATAPULT_WIDTH * 0.8, 0.4, 1.5, shuttleMat);
      shuttle.position.set(0, 0.2, 0);
      grp.add(shuttle);

      _catapults.push({
        group:      grp,
        shuttle:    shuttle,
        press:      press,
        pulsing:    false,
        pulseAge:   0
      });
    }
  }

  /* ── arresting wires ────────────────────────────────────────────────────── */
  function _createArrestingWires() {
    for (var w = 0; w < ARRESTING_WIRE_COUNT; w++) {
      var wireZ = (FLIGHT_DECK_LENGTH / 2 - 10) - w * 15;
      var wirePoints = [
        -FLIGHT_DECK_WIDTH / 2 + 2, FLIGHT_DECK_Y + 0.2, wireZ,
        FLIGHT_DECK_WIDTH / 2 - 2, FLIGHT_DECK_Y + 0.2, wireZ
      ];
      var wireLine = _lineSegments(wirePoints, 0xFF0000);
      _flightDeck.add(wireLine);
      _arrestingWires.push({ line: wireLine, z: wireZ });
    }
  }

  /* ── parked jet fighters ────────────────────────────────────────────────── */
  function _createParkedJets() {
    var jetPositions = [
      { x: -20, z: 50 },
      { x: 20, z: 50 },
      { x: -25, z: -30 },
      { x: 15, z: -50 },
      { x: 0, z: -70 }
    ];

    for (var j = 0; j < jetPositions.length; j++) {
      var pos = jetPositions[j];
      var jet = _createJetFighter();
      jet.position.set(pos.x, FLIGHT_DECK_Y + 1, pos.z);
      _flightDeck.add(jet);
      _parkedJets.push(jet);
    }
  }

  function _createJetFighter() {
    var grp = new THREE.Group();

    /* fuselage — elongated box */
    var fusMat = _makeColor(0x333333);
    var fuselage = _box(2, JET_HEIGHT * 0.4, JET_LENGTH, fusMat);
    grp.add(fuselage);

    /* cockpit canopy */
    var canopyMat = _makeColor(0x4488FF);
    var canopy = _sphere(0.8, canopyMat);
    canopy.position.set(0, JET_HEIGHT * 0.3, JET_LENGTH * 0.3);
    grp.add(canopy);

    /* left wing */
    var wingMat = _makeColor(0x222222);
    var wingLeft = _box(JET_WING_SPAN / 2, 0.3, 5, wingMat);
    wingLeft.position.set(-JET_WING_SPAN / 4 - 1, JET_HEIGHT * 0.2, 0);
    wingLeft.rotation.z = 0.1;
    grp.add(wingLeft);

    /* right wing (swept back) */
    var wingRight = _box(JET_WING_SPAN / 2, 0.3, 5, wingMat);
    wingRight.position.set(JET_WING_SPAN / 4 + 1, JET_HEIGHT * 0.2, 0);
    wingRight.rotation.z = -0.1;
    grp.add(wingRight);

    /* vertical stabilizer */
    var stabMat = _makeColor(0x444444);
    var stab = _box(0.8, 3, 2, stabMat);
    stab.position.set(0, JET_HEIGHT * 0.5, -JET_LENGTH * 0.3);
    grp.add(stab);

    /* engine exhaust ports */
    var exhMat = _makeColor(0x111111);
    var exh1 = _cylinder(0.4, 0.4, 0.5, exhMat);
    exh1.position.set(-0.6, 0, -JET_LENGTH / 2);
    grp.add(exh1);

    var exh2 = _cylinder(0.4, 0.4, 0.5, exhMat);
    exh2.position.set(0.6, 0, -JET_LENGTH / 2);
    grp.add(exh2);

    return grp;
  }

  /* ── below-deck hangar ──────────────────────────────────────────────────── */
  function _createHangar() {
    var grp = new THREE.Group();

    /* hangar main chamber */
    var hangarMat = _makeColor(0x445566);
    var hangar = _box(FLIGHT_DECK_WIDTH - 5, HANGAR_HEIGHT, FLIGHT_DECK_LENGTH - 20, hangarMat);
    hangar.position.set(0, FLIGHT_DECK_Y - HANGAR_HEIGHT / 2 - 2, 0);
    grp.add(hangar);

    /* access ramp */
    var rampMat = _makeColor(0x556677);
    var ramp = _box(4, 2, 20, rampMat);
    ramp.position.set(HANGAR_ACCESS_X, FLIGHT_DECK_Y - 5, -30);
    ramp.rotation.z = 0.15;
    grp.add(ramp);

    /* storage racks */
    for (var r = 0; r < 4; r++) {
      var rackMat = _makeColor(0x334455);
      var rack = _box(3, HANGAR_HEIGHT - 2, 15, rackMat);
      rack.position.set(-15 + r * 10, FLIGHT_DECK_Y - HANGAR_HEIGHT / 2 - 1, 0);
      grp.add(rack);
    }

    _hangar = grp;
    return grp;
  }

  /* ── ammo elevator platform ─────────────────────────────────────────────── */
  function _createElevator() {
    var grp = new THREE.Group();
    grp.position.set(HANGAR_ACCESS_X - 10, FLIGHT_DECK_Y - 5, -30);

    /* platform */
    var platMat = _makeColor(0x776655);
    var platform = _box(5, 1, 6, platMat);
    platform.position.y = 0;
    grp.add(platform);

    /* safety rails */
    var railMat = _makeColor(0xFFFF00);
    for (var i = 0; i < 4; i++) {
      var rail = _cylinder(0.15, 0.15, 3, railMat);
      var offX = (i < 2 ? -2.5 : 2.5);
      var offZ = (i % 2 === 0 ? -3 : 3);
      rail.position.set(offX, 1.8, offZ);
      grp.add(rail);
    }

    _elevator = { group: grp, platform: platform, moveDir: 1, age: 0 };
    return grp;
  }

  /* ── anti-aircraft gun mounts ───────────────────────────────────────────── */
  function _createAAGuns() {
    var aaPositions = [
      { x: FLIGHT_DECK_WIDTH / 2 - 5, z: 30 },
      { x: FLIGHT_DECK_WIDTH / 2 - 5, z: 0 },
      { x: FLIGHT_DECK_WIDTH / 2 - 5, z: -30 },
      { x: -FLIGHT_DECK_WIDTH / 2 + 5, z: 40 },
      { x: -FLIGHT_DECK_WIDTH / 2 + 5, z: -20 },
      { x: -FLIGHT_DECK_WIDTH / 2 + 5, z: -50 }
    ];

    for (var g = 0; g < AA_GUN_COUNT && g < aaPositions.length; g++) {
      var pos = aaPositions[g];
      var grp = new THREE.Group();
      grp.position.set(pos.x, FLIGHT_DECK_Y + 0.5, pos.z);

      /* base mount */
      var baseMat = _makeColor(0x5A4A3A);
      var base = _box(2, 1.5, 2, baseMat);
      base.position.y = 0.75;
      grp.add(base);

      /* turret */
      var turretMat = _makeColor(0x444444);
      var turret = _cylinder(1.2, 1.2, 1, turretMat);
      turret.position.y = 2;
      grp.add(turret);

      /* barrel — double mount */
      var barrelMat = _makeColor(0x222222);
      var barrel1 = _cylinder(0.25, 0.25, 3.5, barrelMat);
      barrel1.position.set(-0.5, 2.8, 0);
      barrel1.rotation.z = Math.PI / 2;
      grp.add(barrel1);

      var barrel2 = _cylinder(0.25, 0.25, 3.5, barrelMat);
      barrel2.position.set(0.5, 2.8, 0);
      barrel2.rotation.z = Math.PI / 2;
      grp.add(barrel2);

      _aaGuns.push({ group: grp, turret: turret, age: 0 });
    }
  }

  /* ── landing signal lights ──────────────────────────────────────────────── */
  function _createLandingLights() {
    var lightZ = FLIGHT_DECK_LENGTH / 2 - 5;
    var lightMat = _makeMat(0xFF0000, { emissive: 0xFF0000 });

    for (var l = 0; l < 3; l++) {
      var light = _sphere(0.5, lightMat);
      light.position.set(-10 + l * 10, FLIGHT_DECK_Y + 2, lightZ);
      _flightDeck.add(light);
      _landingLights.push({ mesh: light, on: false });
    }
  }

  /* ── deck crew signal lights (blinking indicator lights) ────────────────── */
  function _createDeckCrewLights() {
    var colors = [0xFFFF00, 0x00FF00, 0xFF00FF];
    for (var c = 0; c < 4; c++) {
      var lightMat = _makeMat(colors[c % colors.length], { emissive: colors[c % colors.length] });
      var light = _sphere(0.4, lightMat);
      light.position.set(-25 + c * 15, FLIGHT_DECK_Y + 1.5, 60);
      _flightDeck.add(light);
      _deckCrewLights.push({ mesh: light, color: colors[c % colors.length], on: false });
    }
  }

  /* ── jet blast deflectors ───────────────────────────────────────────────── */
  function _createJetBlastDeflectors() {
    for (var d = 0; d < 2; d++) {
      var deflMat = _makeColor(0x667788);
      var defl = _box(6, 4, 12, deflMat);
      defl.position.set(
        -FLIGHT_DECK_WIDTH / 3 + d * 20,
        FLIGHT_DECK_Y + 2,
        FLIGHT_DECK_LENGTH / 3
      );
      _flightDeck.add(defl);
      _jetBlastDeflectors.push(defl);
    }
  }

  /* ── update catapult pressure indicator ──────────────────────────────────── */
  function _updateCatapults(dt) {
    _catapultTimer -= dt;
    if (_catapultTimer <= 0) {
      _catapultTimer = CATAPULT_PULSE_RATE;
    }

    for (var c = 0; c < _catapults.length; c++) {
      var cat = _catapults[c];
      var frac = _catapultTimer / CATAPULT_PULSE_RATE;
      /* pulse effect */
      cat.press.scale.y = 0.8 + frac * 0.4;
      cat.press.material.opacity = 0.5 + frac * 0.5;

      /* shuttle oscillates slightly */
      cat.shuttle.position.z = Math.sin(_catapultTimer * Math.PI) * 2;
    }
  }

  /* ── update radar rotation ──────────────────────────────────────────────── */
  function _updateRadar(dt) {
    if (_radarAntenna) {
      _radarAntenna.rotation.y += RADAR_ROTATE_SPEED * dt;
    }
  }

  /* ── update landing lights sequence ────────────────────────────────────── */
  function _updateLandingLights(dt) {
    _landingLightTimer += dt;
    for (var l = 0; l < _landingLights.length; l++) {
      var light = _landingLights[l];
      var phase = (_landingLightTimer * 2 + l) % LANDING_LIGHT_BLINK;
      light.on = phase < LANDING_LIGHT_BLINK / 2;
      light.mesh.material.opacity = light.on ? 1.0 : 0.1;
    }
  }

  /* ── update deck crew signal lights ────────────────────────────────────── */
  function _updateDeckCrewLights(dt) {
    _deckCrewLightTimer += dt;
    for (var c = 0; c < _deckCrewLights.length; c++) {
      var light = _deckCrewLights[c];
      var phase = (_deckCrewLightTimer * 1.5 + c * 0.3) % DECK_CREW_LIGHT_BLINK;
      light.on = phase < DECK_CREW_LIGHT_BLINK / 2;
      light.mesh.material.opacity = light.on ? 1.0 : 0.15;
    }
  }

  /* ── update elevator platform movement ──────────────────────────────────── */
  function _updateElevator(dt) {
    if (!_elevator) return;
    _elevator.age += dt;
    var cycle = _elevator.age % ELEVATOR_CYCLE_TIME;
    var frac = cycle / ELEVATOR_CYCLE_TIME;

    /* move up and down smoothly */
    if (frac < 0.5) {
      /* moving up */
      _elevator.group.position.y += dt * 2;
    } else {
      /* moving down */
      _elevator.group.position.y -= dt * 2;
    }

    /* clamp to range */
    _elevator.group.position.y = Math.max(
      FLIGHT_DECK_Y - 8,
      Math.min(FLIGHT_DECK_Y - 2, _elevator.group.position.y)
    );
  }

  /* ── jet engine exhaust flickering (subtle effect) ────────────────────────── */
  function _updateJetExhaust(dt) {
    for (var j = 0; j < _parkedJets.length; j++) {
      var jet = _parkedJets[j];
      /* subtle scale pulse on engine exhausts (children 4 and 5) */
      if (jet.children.length > 5) {
        var pulseVal = 0.9 + Math.sin(Date.now() * 0.003 + j) * 0.1;
        jet.children[4].scale.z = pulseVal;
        jet.children[5].scale.z = pulseVal;
      }
    }
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;
    _scene = scene;
    _camera = camera;

    /* main carrier group */
    _carrierGroup = new THREE.Group();
    _scene.add(_carrierGroup);

    /* build structure — 20+ objects */
    var flightDeck = _createFlightDeck();
    _carrierGroup.add(flightDeck);

    _createArrestingWires();

    var island = _createIsland();
    _carrierGroup.add(island);

    _createCatapults();
    for (var c = 0; c < _catapults.length; c++) {
      _carrierGroup.add(_catapults[c].group);
    }

    _createParkedJets();

    var hangar = _createHangar();
    _carrierGroup.add(hangar);

    var elevator = _createElevator();
    _carrierGroup.add(elevator);

    _createAAGuns();
    for (var g = 0; g < _aaGuns.length; g++) {
      _carrierGroup.add(_aaGuns[g].group);
    }

    _createLandingLights();
    _createDeckCrewLights();
    _createJetBlastDeflectors();

    /* carrier positioned in scene */
    _carrierGroup.position.set(0, 0, 0);
  }

  function update(dt) {
    if (!_initialized) return;

    _updateCatapults(dt);
    _updateRadar(dt);
    _updateLandingLights(dt);
    _updateDeckCrewLights(dt);
    _updateElevator(dt);
    _updateJetExhaust(dt);
  }

  function reset() {
    if (!_carrierGroup) return;

    /* remove all scene objects */
    _scene.remove(_carrierGroup);

    /* reset state */
    _carrierGroup = null;
    _flightDeck = null;
    _island = null;
    _hangar = null;
    _elevator = null;
    _radarAntenna = null;
    _catapults = [];
    _arrestingWires = [];
    _aaGuns = [];
    _parkedJets = [];
    _landingLights = [];
    _deckCrewLights = [];
    _jetBlastDeflectors = [];

    /* reset timers */
    _elevatorTimer = 0;
    _catapultTimer = 0;
    _landingLightTimer = 0;
    _deckCrewLightTimer = 0;
    _radarRotation = 0;

    _initialized = false;
  }

  return { init: init, update: update, reset: reset };
}());
