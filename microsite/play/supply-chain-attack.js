// supply-chain-attack.js — Enemy logistics disruption module
// Browser-based Three.js game — IIFE, all var (no let/const)
//
// Public API:
//   SupplyChainAttack.init(scene, camera, controls)
//   SupplyChainAttack.update(dt)
//   SupplyChainAttack.reset()

window.SupplyChainAttack = (function () {
  'use strict';

  // ------------------------------------------------------------------ config
  var TRUCK_SPEED          = 6;       // units/s
  var TRUCK_STOP_DIST      = 5;       // ambush range (units)
  var DEPOT_SABOTAGE_DIST  = 4;       // plant-charge range
  var FUEL_DRAIN_DIST      = 4;       // fuel-drain range
  var HUB_HACK_DIST        = 6;       // hub-hack range
  var SPIKE_STRIP_WIDTH    = 4;       // road-block width
  var FUEL_DRAIN_RADIUS    = 40;      // slow vehicles within this radius
  var FUEL_DRAIN_SPEED     = 0.5;     // 50 % speed
  var CHARGE_FUSE          = 5;       // seconds
  var FUEL_HOLD            = 3;       // seconds to drain
  var HUB_HOLD             = 5;       // seconds to hack hub
  var HUB_RESUPPLY_HALT    = 90;      // seconds supply halted after hack
  var COUNTERATTACK_DIST   = 10;      // player too close to hub for this many sec
  var COUNTERATTACK_TIME   = 10;      // trigger after 10 s
  var COUNTERATTACK_SPAWN  = 30;      // spawn distance for jeep
  var RESTORE_INTERVAL     = 60;      // seconds between partial resupply
  var VICTORY_THRESHOLD    = 20;      // % at which victory fires
  var MISSION_BONUS        = 600;
  var GUARD_SPAWN_COUNT    = 2;       // extra guards per attacked node

  // Disruption score values
  var SCORE_TRUCK          = 10;
  var SCORE_DEPOT          = 25;
  var SCORE_FUEL           = 15;
  var SCORE_SPIKE          = 8;
  var SCORE_HUB            = 35;

  // Colours
  var COL_DEPOT            = 0x5A4A3A;
  var COL_FUEL_STATION     = 0x884422;
  var COL_HUB              = 0x445544;
  var COL_TRUCK            = 0x6B6B4A;
  var COL_TRUCK_DISABLED   = 0x333333;
  var COL_FUEL_DRAINED     = 0x331A0D;
  var COL_GUARD            = 0x556655;
  var COL_JEEP             = 0x334422;
  var COL_FIRE             = 0xFF4400;
  var COL_SMOKE            = 0x444444;

  // ------------------------------------------------------------------ state
  var _scene       = null;
  var _camera      = null;
  var _time        = 0;
  var _inited      = false;

  // Game entities
  var _depots      = [];  // { mesh, active, chargeTimer, chargeActive, fireParticles, smokeParticles, pos }
  var _fuelStations = []; // { mesh, active, draining, drainTimer }
  var _hub         = null; // { mesh, active, hackTimer, hackHolding, haltTimer }
  var _trucks      = [];  // { mesh, active, routeIdx, waypointIdx, t, disabled, tireHP, pos }
  var _spikeStrips = [];  // { mesh, active, pos }
  var _guards      = [];  // { mesh, pos, targetDepotIdx }
  var _jeep        = null; // { mesh, pos, active, speed }
  var _jeepEnemies = [];  // meshes bailed from jeep

  // Scoring
  var _logisticsScore = 100;  // starts at 100 %
  var _trucksTotal    = 4;
  var _trucksActive   = 4;
  var _depotsTotal    = 3;
  var _depotsActive   = 3;
  var _hubActive      = true;
  var _victoryFired   = false;

  // Holding timers
  var _fuelHoldTimer  = 0;
  var _fuelHoldNode   = -1;  // index of fuel station being drained
  var _hackHoldTimer  = 0;
  var _hackHolding    = false;

  // Counterattack
  var _hubProximityTimer = 0;
  var _counterattackSpawned = false;

  // Restore timer
  var _restoreTimer  = 0;

  // Supply halt
  var _supplyHalted  = false;
  var _supplyHaltTimer = 0;

  // Mode activation
  var _modeActive    = false;
  var _sKeyDown      = false;
  var _cKeyDown      = false;

  // DOM
  var _hudEl         = null;
  var _intelOverlay  = null;
  var _intelCanvas   = null;
  var _bannerEl      = null;
  var _toastEl       = null;

  // Fire/smoke particle pools
  var _fireParticles  = [];
  var _smokeParticles = [];

  // Truck routes: each truck cycles through a list of waypoints
  var TRUCK_ROUTES = [
    [ {x:  20, z:  20}, {x: -20, z:  15}, {x:  -5, z:  -5} ],
    [ {x: -20, z: -20}, {x:  15, z: -15}, {x:  10, z:  10} ],
    [ {x:   0, z:  30}, {x:  25, z:   0}, {x:   0, z: -30} ],
    [ {x: -25, z:  10}, {x:  10, z:  25}, {x:  20, z: -10} ]
  ];

  // ================================================================== helpers

  function _getPlayerPos() {
    try {
      if (window.GameManager && window.GameManager.playerPosition) return window.GameManager.playerPosition;
      if (window._playerPos) return window._playerPos;
      if (window.player && window.player.position) return window.player.position;
      if (window.Player && window.Player.position) return window.Player.position;
      if (_camera) return _camera.position;
    } catch (e) {}
    return null;
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function _showToast(text, duration) {
    if (!_toastEl) return;
    _toastEl.textContent = text;
    _toastEl.style.opacity = '1';
    clearTimeout(_toastEl._hideTimer);
    _toastEl._hideTimer = setTimeout(function () {
      _toastEl.style.opacity = '0';
    }, (duration || 2) * 1000);
  }

  // ================================================================== mesh builders

  function _makeMesh(geo, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _makeDepotMesh() {
    var geo = new THREE.BoxGeometry(6, 4, 8);
    return _makeMesh(geo, COL_DEPOT);
  }

  function _makeFuelStationMesh() {
    var geo = new THREE.CylinderGeometry(2, 2, 5, 12);
    return _makeMesh(geo, COL_FUEL_STATION);
  }

  function _makeHubMesh() {
    var geo = new THREE.BoxGeometry(10, 5, 12);
    return _makeMesh(geo, COL_HUB);
  }

  function _makeTruckMesh() {
    var group = new THREE.Group();
    var body = _makeMesh(new THREE.BoxGeometry(2.5, 1.2, 4), COL_TRUCK);
    body.position.y = 0.6;
    group.add(body);
    var cab = _makeMesh(new THREE.BoxGeometry(2.2, 1.0, 1.6), COL_TRUCK);
    cab.position.set(0, 1.5, -1.2);
    group.add(cab);
    return group;
  }

  function _makeGuardMesh() {
    var group = new THREE.Group();
    var torso = _makeMesh(new THREE.BoxGeometry(0.4, 0.8, 0.3), COL_GUARD);
    torso.position.y = 0.8;
    group.add(torso);
    var head = _makeMesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), 0x8B7355);
    head.position.y = 1.5;
    group.add(head);
    return group;
  }

  function _makeJeepMesh() {
    var group = new THREE.Group();
    var body = _makeMesh(new THREE.BoxGeometry(3, 1.5, 5), COL_JEEP);
    body.position.y = 0.75;
    group.add(body);
    return group;
  }

  function _makeSpikeStripMesh(x, y, z) {
    var points = [];
    var halfW = SPIKE_STRIP_WIDTH / 2;
    points.push(new THREE.Vector3(-halfW, 0, 0));
    points.push(new THREE.Vector3(halfW, 0, 0));
    // Spikes
    var i;
    for (i = -halfW; i <= halfW; i += 0.4) {
      points.push(new THREE.Vector3(i, 0, 0));
      points.push(new THREE.Vector3(i, 0.25, 0));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xCCCCCC });
    var mesh = new THREE.LineSegments(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeFireParticle() {
    var geo = new THREE.SphereGeometry(0.15, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: COL_FIRE });
    return new THREE.Mesh(geo, mat);
  }

  function _makeSmokeParticle() {
    var geo = new THREE.SphereGeometry(0.25, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: COL_SMOKE, transparent: true, opacity: 0.6 });
    return new THREE.Mesh(geo, mat);
  }

  // ================================================================== world setup

  function _buildSupplyNetwork() {
    // 3 supply depots
    var depotPositions = [
      {x: 20,  y: 2, z:  20},
      {x: -20, y: 2, z:  15},
      {x:  -5, y: 2, z:  -5}
    ];
    var i;
    for (i = 0; i < depotPositions.length; i++) {
      var dp = depotPositions[i];
      var dmesh = _makeDepotMesh();
      dmesh.position.set(dp.x, dp.y, dp.z);
      _scene.add(dmesh);
      _depots.push({
        mesh: dmesh,
        active: true,
        chargeActive: false,
        chargeTimer: 0,
        fireParticles: [],
        smokeParticles: [],
        pos: {x: dp.x, y: dp.y, z: dp.z}
      });
    }

    // 2 fuel stations
    var fuelPositions = [
      {x:  12, y: 2.5, z: -18},
      {x: -15, y: 2.5, z:  30}
    ];
    for (i = 0; i < fuelPositions.length; i++) {
      var fp = fuelPositions[i];
      var fmesh = _makeFuelStationMesh();
      fmesh.position.set(fp.x, fp.y, fp.z);
      _scene.add(fmesh);
      _fuelStations.push({
        mesh: fmesh,
        active: true,
        draining: false,
        drainTimer: 0,
        pos: {x: fp.x, y: fp.y, z: fp.z}
      });
    }

    // 1 main distribution hub
    var hmesh = _makeHubMesh();
    hmesh.position.set(0, 2.5, 0);
    _scene.add(hmesh);
    _hub = {
      mesh: hmesh,
      active: true,
      hackTimer: 0,
      hackHolding: false,
      haltTimer: 0,
      pos: {x: 0, y: 2.5, z: 0}
    };
  }

  function _buildTrucks() {
    var i;
    for (i = 0; i < 4; i++) {
      var tmesh = _makeTruckMesh();
      var startWP = TRUCK_ROUTES[i][0];
      tmesh.position.set(startWP.x, 0, startWP.z);
      _scene.add(tmesh);
      _trucks.push({
        mesh: tmesh,
        active: true,
        routeIdx: i,
        waypointIdx: 0,
        t: 0,
        disabled: false,
        tireHP: 2,
        speedMult: 1,
        bailedEnemies: [],
        pos: {x: startWP.x, y: 0, z: startWP.z}
      });
    }
  }

  // ================================================================== disruption actions

  function _disableTruck(truckIdx) {
    var truck = _trucks[truckIdx];
    if (!truck || truck.disabled) return;
    truck.disabled = true;
    truck.active   = false;
    _trucksActive  = Math.max(0, _trucksActive - 1);

    // Turn truck dark gray
    truck.mesh.traverse(function (child) {
      if (child.isMesh) {
        child.material = new THREE.MeshLambertMaterial({ color: COL_TRUCK_DISABLED });
      }
    });

    // Bail out 3 enemies
    var i;
    for (i = 0; i < 3; i++) {
      var g = _makeGuardMesh();
      var angle = (i / 3) * Math.PI * 2;
      g.position.set(
        truck.pos.x + Math.cos(angle) * 2,
        0,
        truck.pos.z + Math.sin(angle) * 2
      );
      _scene.add(g);
      truck.bailedEnemies.push(g);
      _guards.push({ mesh: g, pos: g.position, targetDepotIdx: 0 });
    }

    _logisticsScore = Math.max(0, _logisticsScore - SCORE_TRUCK);
    _showToast('TRUCK AMBUSHED! -' + SCORE_TRUCK + '% SUPPLY', 2);
    _spawnGuardsAtNearestNode(truck.pos, GUARD_SPAWN_COUNT);
    _updateHUD();
    _checkVictory();
  }

  function _beginDepotSabotage(depotIdx) {
    var depot = _depots[depotIdx];
    if (!depot || !depot.active || depot.chargeActive) return;
    depot.chargeActive = true;
    depot.chargeTimer  = CHARGE_FUSE;
    _showToast('CHARGE PLANTED — 5s FUSE!', 2);
  }

  function _destroyDepot(depotIdx) {
    var depot = _depots[depotIdx];
    if (!depot || !depot.active) return;
    depot.active = false;
    _depotsActive = Math.max(0, _depotsActive - 1);

    // Collapse mesh
    depot.mesh.scale.y = 0.05;
    depot.mesh.position.y = 0.1;

    // Spawn fire + smoke
    var j;
    for (j = 0; j < 6; j++) {
      var fp = _makeFireParticle();
      fp.position.set(
        depot.pos.x + (Math.random() - 0.5) * 6,
        Math.random() * 3 + 0.5,
        depot.pos.z + (Math.random() - 0.5) * 8
      );
      fp._vel = {x: (Math.random() - 0.5) * 2, y: 2 + Math.random() * 3, z: (Math.random() - 0.5) * 2};
      fp._life = 2 + Math.random();
      _scene.add(fp);
      _fireParticles.push(fp);
      depot.fireParticles.push(fp);
    }
    for (j = 0; j < 4; j++) {
      var sp = _makeSmokeParticle();
      sp.position.set(
        depot.pos.x + (Math.random() - 0.5) * 4,
        3 + Math.random() * 2,
        depot.pos.z + (Math.random() - 0.5) * 6
      );
      sp._vel = {x: (Math.random() - 0.5), y: 1.5 + Math.random() * 2, z: (Math.random() - 0.5)};
      sp._life = 3 + Math.random() * 2;
      _scene.add(sp);
      _smokeParticles.push(sp);
      depot.smokeParticles.push(sp);
    }

    _logisticsScore = Math.max(0, _logisticsScore - SCORE_DEPOT);
    _showToast('DEPOT DESTROYED! -' + SCORE_DEPOT + '% SUPPLY', 2.5);
    _spawnGuardsAtNode(depot.pos, GUARD_SPAWN_COUNT);
    _updateHUD();
    _checkVictory();
  }

  function _drainFuelStation(stationIdx) {
    var station = _fuelStations[stationIdx];
    if (!station || !station.active) return;
    station.active = false;

    // Darken fuel tank color
    station.mesh.material = new THREE.MeshLambertMaterial({ color: COL_FUEL_DRAINED });

    // Slow trucks within radius
    var i;
    for (i = 0; i < _trucks.length; i++) {
      var truck = _trucks[i];
      if (!truck.disabled) {
        var d = _dist2D(truck.pos, station.pos);
        if (d <= FUEL_DRAIN_RADIUS) {
          truck.speedMult = FUEL_DRAIN_SPEED;
        }
      }
    }

    _logisticsScore = Math.max(0, _logisticsScore - SCORE_FUEL);
    _showToast('FUEL DRAINED! Enemy vehicles slowed -' + SCORE_FUEL + '% SUPPLY', 2.5);
    _spawnGuardsAtNode(station.pos, GUARD_SPAWN_COUNT);
    _updateHUD();
    _checkVictory();
  }

  function _dropSpikeStrip(playerPos) {
    var mesh = _makeSpikeStripMesh(playerPos.x, 0.05, playerPos.z);
    _scene.add(mesh);
    _spikeStrips.push({
      mesh: mesh,
      active: true,
      pos: {x: playerPos.x, y: 0.05, z: playerPos.z}
    });
    _showToast('SPIKE STRIP DEPLOYED', 1.5);
  }

  function _checkSpikeStrips(truck) {
    var i;
    for (i = 0; i < _spikeStrips.length; i++) {
      var strip = _spikeStrips[i];
      if (!strip.active) continue;
      var d = _dist2D(truck.pos, strip.pos);
      if (d < 3) {
        // Truck hits spike strip
        truck.tireHP--;
        strip.active = false;
        _scene.remove(strip.mesh);
        _logisticsScore = Math.max(0, _logisticsScore - SCORE_SPIKE);
        if (truck.tireHP <= 0) {
          _disableTruck(_trucks.indexOf(truck));
        } else {
          truck.speedMult = 0.4;
        }
        _showToast('TRUCK HIT SPIKE STRIP! -' + SCORE_SPIKE + '% SUPPLY', 2);
        _updateHUD();
        _checkVictory();
      }
    }
  }

  function _hackHub() {
    if (!_hub || !_hub.active) return;
    _hub.active     = false;
    _hubActive      = false;
    _supplyHalted   = true;
    _supplyHaltTimer = HUB_RESUPPLY_HALT;

    // Visual: darken hub
    _hub.mesh.material = new THREE.MeshLambertMaterial({ color: 0x223322 });

    _logisticsScore = Math.max(0, _logisticsScore - SCORE_HUB);
    _showToast('HUB HACKED! ENEMY SUPPLY HALTED 90s -' + SCORE_HUB + '% SUPPLY', 3);
    _spawnGuardsAtNode(_hub.pos, GUARD_SPAWN_COUNT);
    _updateHUD();
    _checkVictory();
  }

  // ================================================================== guard spawning

  function _spawnGuardsAtNode(pos, count) {
    var i;
    for (i = 0; i < count; i++) {
      var g = _makeGuardMesh();
      var angle = (i / count) * Math.PI * 2;
      g.position.set(
        pos.x + Math.cos(angle) * 4,
        0,
        pos.z + Math.sin(angle) * 4
      );
      _scene.add(g);
      _guards.push({ mesh: g, pos: g.position, targetDepotIdx: 0 });
    }
  }

  function _spawnGuardsAtNearestNode(pos, count) {
    // Find nearest active depot
    var best = null;
    var bestDist = Infinity;
    var i;
    for (i = 0; i < _depots.length; i++) {
      if (!_depots[i].active) continue;
      var d = _dist2D(pos, _depots[i].pos);
      if (d < bestDist) {
        bestDist = d;
        best = _depots[i].pos;
      }
    }
    if (!best && _hub && _hub.active) best = _hub.pos;
    if (best) _spawnGuardsAtNode(best, count);
  }

  // ================================================================== counterattack

  function _spawnCounterattackJeep() {
    if (_counterattackSpawned) return;
    _counterattackSpawned = true;

    var hubPos = _hub ? _hub.pos : {x: 0, y: 0, z: 0};
    var angle = Math.random() * Math.PI * 2;
    var spawnX = hubPos.x + Math.cos(angle) * COUNTERATTACK_SPAWN;
    var spawnZ = hubPos.z + Math.sin(angle) * COUNTERATTACK_SPAWN;

    var jmesh = _makeJeepMesh();
    jmesh.position.set(spawnX, 0.75, spawnZ);
    _scene.add(jmesh);
    _jeep = {
      mesh: jmesh,
      pos: {x: spawnX, y: 0.75, z: spawnZ},
      active: true,
      speed: 8,
      targetPos: hubPos
    };

    // 4 enemies in jeep (represented as guards around it)
    var i;
    for (i = 0; i < 4; i++) {
      var g = _makeGuardMesh();
      g.position.set(spawnX + (i - 1.5) * 0.6, 1.5, spawnZ);
      _scene.add(g);
      _jeepEnemies.push(g);
    }

    _showToast('ENEMY RAPID RESPONSE INBOUND!', 3);
  }

  // ================================================================== node restoration

  function _restoreOneNode() {
    if (_supplyHalted) return; // no restoration while supply halted

    // Find a disrupted depot, fuel station, or truck to partially restore
    var candidates = [];
    var i;
    for (i = 0; i < _depots.length; i++) {
      if (!_depots[i].active) candidates.push({type: 'depot', idx: i});
    }
    for (i = 0; i < _fuelStations.length; i++) {
      if (!_fuelStations[i].active) candidates.push({type: 'fuel', idx: i});
    }
    if (!_hubActive) candidates.push({type: 'hub', idx: 0});

    if (candidates.length === 0) return;

    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (pick.type === 'depot') {
      _depots[pick.idx].active = true;
      _depots[pick.idx].mesh.scale.y = 1;
      _depots[pick.idx].mesh.position.y = _depots[pick.idx].pos.y;
      _depots[pick.idx].mesh.material = new THREE.MeshLambertMaterial({ color: COL_DEPOT });
      _depotsActive = Math.min(_depotsTotal, _depotsActive + 1);
      _logisticsScore = Math.min(100, _logisticsScore + 10);
      _showToast('ENEMY RESTORED DEPOT +10% SUPPLY', 2.5);
    } else if (pick.type === 'fuel') {
      _fuelStations[pick.idx].active = true;
      _fuelStations[pick.idx].mesh.material = new THREE.MeshLambertMaterial({ color: COL_FUEL_STATION });
      // Restore truck speeds
      for (i = 0; i < _trucks.length; i++) {
        if (_trucks[i].speedMult === FUEL_DRAIN_SPEED) {
          _trucks[i].speedMult = 1;
        }
      }
      _logisticsScore = Math.min(100, _logisticsScore + 10);
      _showToast('ENEMY RESTORED FUEL STATION +10% SUPPLY', 2.5);
    } else if (pick.type === 'hub') {
      _hub.active = true;
      _hubActive  = true;
      _hub.mesh.material = new THREE.MeshLambertMaterial({ color: COL_HUB });
      _logisticsScore = Math.min(100, _logisticsScore + 10);
      _showToast('ENEMY RESTORED HUB +10% SUPPLY', 2.5);
    }

    _updateHUD();
  }

  // ================================================================== intel overlay

  function _buildIntelOverlay() {
    if (_intelOverlay) return;

    _intelOverlay = document.createElement('div');
    _intelOverlay.id = 'scaIntelOverlay';
    _intelOverlay.style.position = 'fixed';
    _intelOverlay.style.top = '10px';
    _intelOverlay.style.left = '10px';
    _intelOverlay.style.width = '220px';
    _intelOverlay.style.background = 'rgba(0,0,0,0.82)';
    _intelOverlay.style.border = '1px solid #4CAF50';
    _intelOverlay.style.padding = '6px';
    _intelOverlay.style.zIndex = '800';
    _intelOverlay.style.display = 'none';
    _intelOverlay.style.fontFamily = 'monospace';

    var title = document.createElement('div');
    title.textContent = 'INTEL: SUPPLY NETWORK';
    title.style.color = '#4CAF50';
    title.style.fontSize = '11px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '4px';
    title.style.letterSpacing = '1px';
    _intelOverlay.appendChild(title);

    _intelCanvas = document.createElement('canvas');
    _intelCanvas.width  = 200;
    _intelCanvas.height = 200;
    _intelCanvas.style.display = 'block';
    _intelCanvas.style.border = '1px solid #333';
    _intelOverlay.appendChild(_intelCanvas);

    document.body.appendChild(_intelOverlay);
  }

  function _drawIntelMap() {
    if (!_intelCanvas) return;
    var ctx = _intelCanvas.getContext('2d');
    ctx.clearRect(0, 0, 200, 200);
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, 200, 200);

    // World range: -50 to +50 mapped to 0-200
    function worldToMap(x, z) {
      return {
        mx: (x + 50) / 100 * 200,
        my: (z + 50) / 100 * 200
      };
    }

    // Draw truck routes
    ctx.strokeStyle = '#2A3A2A';
    ctx.lineWidth = 1;
    var i, j, r;
    for (i = 0; i < TRUCK_ROUTES.length; i++) {
      r = TRUCK_ROUTES[i];
      ctx.beginPath();
      var first = worldToMap(r[0].x, r[0].z);
      ctx.moveTo(first.mx, first.my);
      for (j = 1; j < r.length; j++) {
        var pt = worldToMap(r[j].x, r[j].z);
        ctx.lineTo(pt.mx, pt.my);
      }
      // Close route
      ctx.lineTo(first.mx, first.my);
      ctx.stroke();
    }

    // Draw supply route arrows between nodes
    ctx.strokeStyle = '#336633';
    ctx.lineWidth = 1.5;
    var nodes = [];
    for (i = 0; i < _depots.length; i++) {
      nodes.push({pos: _depots[i].pos, active: _depots[i].active});
    }
    for (i = 0; i < _fuelStations.length; i++) {
      nodes.push({pos: _fuelStations[i].pos, active: _fuelStations[i].active});
    }
    if (_hub) nodes.push({pos: _hub.pos, active: _hub.active});

    if (_hub) {
      var hubPt = worldToMap(_hub.pos.x, _hub.pos.z);
      for (i = 0; i < nodes.length - 1; i++) {
        var nPt = worldToMap(nodes[i].pos.x, nodes[i].pos.z);
        ctx.beginPath();
        ctx.moveTo(hubPt.mx, hubPt.my);
        // Arrow
        var dx = nPt.mx - hubPt.mx;
        var dy = nPt.my - hubPt.my;
        var len = Math.sqrt(dx * dx + dy * dy);
        var ex = hubPt.mx + dx * 0.7;
        var ey = hubPt.my + dy * 0.7;
        ctx.lineTo(ex, ey);
        // Arrowhead
        var nx = -dy / len;
        var ny = dx / len;
        ctx.lineTo(ex - dx / len * 5 + nx * 4, ey - dy / len * 5 + ny * 4);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - dx / len * 5 - nx * 4, ey - dy / len * 5 - ny * 4);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (i = 0; i < _depots.length; i++) {
      var dp = worldToMap(_depots[i].pos.x, _depots[i].pos.z);
      ctx.fillStyle = _depots[i].active ? '#4CAF50' : '#FF3300';
      ctx.beginPath();
      ctx.arc(dp.mx, dp.my, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#AAA';
      ctx.font = '8px monospace';
      ctx.fillText('D' + (i + 1), dp.mx + 6, dp.my + 3);
      if (!_depots[i].active) {
        ctx.strokeStyle = '#FF3300';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dp.mx - 5, dp.my - 5);
        ctx.lineTo(dp.mx + 5, dp.my + 5);
        ctx.moveTo(dp.mx + 5, dp.my - 5);
        ctx.lineTo(dp.mx - 5, dp.my + 5);
        ctx.stroke();
      }
    }
    for (i = 0; i < _fuelStations.length; i++) {
      var fsp = worldToMap(_fuelStations[i].pos.x, _fuelStations[i].pos.z);
      ctx.fillStyle = _fuelStations[i].active ? '#FFD700' : '#FF3300';
      ctx.beginPath();
      ctx.arc(fsp.mx, fsp.my, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#AAA';
      ctx.font = '8px monospace';
      ctx.fillText('F' + (i + 1), fsp.mx + 5, fsp.my + 3);
    }
    if (_hub) {
      var hp = worldToMap(_hub.pos.x, _hub.pos.z);
      ctx.fillStyle = _hub.active ? '#00BFFF' : '#FF3300';
      ctx.beginPath();
      ctx.rect(hp.mx - 6, hp.my - 6, 12, 12);
      ctx.fill();
      ctx.fillStyle = '#AAA';
      ctx.font = '8px monospace';
      ctx.fillText('HUB', hp.mx + 7, hp.my + 3);
    }

    // Draw trucks
    for (i = 0; i < _trucks.length; i++) {
      var tp = worldToMap(_trucks[i].pos.x, _trucks[i].pos.z);
      ctx.fillStyle = _trucks[i].disabled ? '#555' : '#88FF44';
      ctx.beginPath();
      ctx.arc(tp.mx, tp.my, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player marker
    var playerPos = _getPlayerPos();
    if (playerPos) {
      var pp = worldToMap(playerPos.x, playerPos.z);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pp.mx, pp.my, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ================================================================== HUD

  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'scaHUD';
    _hudEl.style.position = 'fixed';
    _hudEl.style.top = '10px';
    _hudEl.style.right = '10px';
    _hudEl.style.background = 'rgba(0,0,0,0.7)';
    _hudEl.style.color = '#88FF44';
    _hudEl.style.fontFamily = 'monospace';
    _hudEl.style.fontSize = '12px';
    _hudEl.style.padding = '6px 10px';
    _hudEl.style.border = '1px solid #446644';
    _hudEl.style.zIndex = '700';
    _hudEl.style.display = 'none';
    _hudEl.style.whiteSpace = 'nowrap';
    document.body.appendChild(_hudEl);
  }

  function _buildBanner() {
    if (_bannerEl) return;
    _bannerEl = document.createElement('div');
    _bannerEl.id = 'scaBanner';
    _bannerEl.style.position = 'fixed';
    _bannerEl.style.top = '35%';
    _bannerEl.style.left = '50%';
    _bannerEl.style.transform = 'translateX(-50%)';
    _bannerEl.style.color = '#88FF44';
    _bannerEl.style.fontFamily = 'monospace';
    _bannerEl.style.fontSize = '28px';
    _bannerEl.style.fontWeight = 'bold';
    _bannerEl.style.letterSpacing = '4px';
    _bannerEl.style.textShadow = '0 0 20px #44FF44, 0 0 40px #00AA00';
    _bannerEl.style.pointerEvents = 'none';
    _bannerEl.style.zIndex = '900';
    _bannerEl.style.opacity = '0';
    _bannerEl.style.whiteSpace = 'nowrap';
    document.body.appendChild(_bannerEl);
  }

  function _buildToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'scaToast';
    _toastEl.style.position = 'fixed';
    _toastEl.style.bottom = '120px';
    _toastEl.style.left = '50%';
    _toastEl.style.transform = 'translateX(-50%)';
    _toastEl.style.color = '#FFCC00';
    _toastEl.style.fontFamily = 'monospace';
    _toastEl.style.fontSize = '14px';
    _toastEl.style.fontWeight = 'bold';
    _toastEl.style.textShadow = '0 0 8px #FF8800';
    _toastEl.style.pointerEvents = 'none';
    _toastEl.style.zIndex = '750';
    _toastEl.style.opacity = '0';
    _toastEl.style.whiteSpace = 'nowrap';
    _toastEl.style.transition = 'opacity 0.3s';
    document.body.appendChild(_toastEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var hubStatus = _hub && _hub.active ? 'ACTIVE' : 'DISRUPTED';
    var supplyStatus = _supplyHalted
      ? ' | ENEMY SUPPLY: DISRUPTED (' + Math.ceil(_supplyHaltTimer) + 's)'
      : '';
    _hudEl.textContent =
      'SUPPLY OPS [LOG SCORE: ' + Math.round(_logisticsScore) + '%]' +
      ' [TRUCKS: ' + _trucksActive + '/' + _trucksTotal + ']' +
      ' [DEPOTS: ' + _depotsActive + '/' + _depotsTotal + ']' +
      ' | HUB: ' + hubStatus +
      supplyStatus;
  }

  function _checkVictory() {
    if (_victoryFired) return;
    if (_logisticsScore <= VICTORY_THRESHOLD) {
      _victoryFired = true;
      if (_bannerEl) {
        _bannerEl.textContent = 'SUPPLY LINE SEVERED! +' + MISSION_BONUS;
        _bannerEl.style.opacity = '1';
      }
      // Award bonus
      if (window.GameManager && window.GameManager.addScore) {
        window.GameManager.addScore(MISSION_BONUS);
      } else if (window._score !== undefined) {
        window._score += MISSION_BONUS;
      }
      _showToast('MISSION COMPLETE: SUPPLY LINE SEVERED', 5);
    }
  }

  // ================================================================== input

  function _onKeyDown(e) {
    if (!_modeActive) {
      // S+C to activate mode
      if (e.key === 's' || e.key === 'S') _sKeyDown = true;
      if (e.key === 'c' || e.key === 'C') _cKeyDown = true;
      if (_sKeyDown && _cKeyDown) {
        _activateMode();
      }
      return;
    }

    var playerPos = _getPlayerPos();
    var i;

    if (e.key === 'x' || e.key === 'X') {
      // Ambush truck
      if (!playerPos) return;
      for (i = 0; i < _trucks.length; i++) {
        if (_trucks[i].disabled) continue;
        var td = _dist2D(playerPos, _trucks[i].pos);
        if (td <= TRUCK_STOP_DIST) {
          _disableTruck(i);
          break;
        }
      }
    }

    if (e.key === 'b' || e.key === 'B') {
      // Depot sabotage — plant charge
      if (!playerPos) return;
      for (i = 0; i < _depots.length; i++) {
        if (!_depots[i].active || _depots[i].chargeActive) continue;
        var dd = _dist2D(playerPos, _depots[i].pos);
        if (dd <= DEPOT_SABOTAGE_DIST) {
          _beginDepotSabotage(i);
          break;
        }
      }
    }

    if (e.key === 'r' || e.key === 'R') {
      // Drop spike strip
      if (!playerPos) return;
      _dropSpikeStrip(playerPos);
    }

    if (e.key === 'i' || e.key === 'I') {
      // Toggle intel overlay
      if (_intelOverlay) {
        _intelOverlay.style.display =
          _intelOverlay.style.display === 'none' ? 'block' : 'none';
        if (_intelOverlay.style.display === 'block') {
          _drawIntelMap();
        }
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 's' || e.key === 'S') _sKeyDown = false;
    if (e.key === 'c' || e.key === 'C') _cKeyDown = false;
  }

  function _activateMode() {
    _modeActive = true;
    if (_hudEl) _hudEl.style.display = 'block';
    _showToast('SUPPLY CHAIN ATTACK MODE ACTIVE', 3);
    _updateHUD();
  }

  // ================================================================== update helpers

  function _updateTrucks(dt) {
    var i;
    for (i = 0; i < _trucks.length; i++) {
      var truck = _trucks[i];
      if (truck.disabled) continue;
      if (_supplyHalted) continue;

      var route = TRUCK_ROUTES[truck.routeIdx];
      var nextIdx = (truck.waypointIdx + 1) % route.length;
      var from = route[truck.waypointIdx];
      var to   = route[nextIdx];

      var segDist = Math.sqrt(
        Math.pow(to.x - from.x, 2) + Math.pow(to.z - from.z, 2)
      );
      var step = (TRUCK_SPEED * truck.speedMult * dt) / Math.max(segDist, 0.001);
      truck.t += step;

      if (truck.t >= 1) {
        truck.t -= 1;
        truck.waypointIdx = nextIdx;
        var nextNext = (truck.waypointIdx + 1) % route.length;
        from = route[truck.waypointIdx];
        to   = route[nextNext];
      }

      var nx = _lerp(from.x, to.x, _clamp(truck.t, 0, 1));
      var nz = _lerp(from.z, to.z, _clamp(truck.t, 0, 1));
      truck.mesh.position.set(nx, 0, nz);
      truck.pos.x = nx;
      truck.pos.z = nz;

      // Face direction of travel
      var dx = to.x - from.x;
      var dz = to.z - from.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.001) {
        truck.mesh.rotation.y = Math.atan2(dx, dz);
      }

      // Check spike strips
      _checkSpikeStrips(truck);
    }
  }

  function _updateDepotCharges(dt) {
    var i;
    for (i = 0; i < _depots.length; i++) {
      var depot = _depots[i];
      if (!depot.chargeActive || !depot.active) continue;
      depot.chargeTimer -= dt;
      if (depot.chargeTimer <= 0) {
        depot.chargeActive = false;
        _destroyDepot(i);
      }
    }
  }

  function _updateFuelHold(dt, playerPos) {
    if (!playerPos) return;
    // Check if player is holding F near a fuel station
    if (window._fKeyHeld) {
      var i;
      for (i = 0; i < _fuelStations.length; i++) {
        if (!_fuelStations[i].active) continue;
        var fd = _dist2D(playerPos, _fuelStations[i].pos);
        if (fd <= FUEL_DRAIN_DIST) {
          if (_fuelHoldNode !== i) {
            _fuelHoldNode  = i;
            _fuelHoldTimer = 0;
          }
          _fuelHoldTimer += dt;
          if (_fuelHoldTimer >= FUEL_HOLD) {
            _drainFuelStation(i);
            _fuelHoldTimer = 0;
            _fuelHoldNode  = -1;
          }
          return;
        }
      }
    } else {
      _fuelHoldNode  = -1;
      _fuelHoldTimer = 0;
    }
  }

  function _updateHubHold(dt, playerPos) {
    if (!playerPos || !_hub || !_hub.active) return;
    var hd = _dist2D(playerPos, _hub.pos);

    if (window._hKeyHeld && hd <= HUB_HACK_DIST) {
      _hackHoldTimer += dt;
      if (_hackHoldTimer >= HUB_HOLD) {
        _hackHub();
        _hackHoldTimer = 0;
        _hackHolding   = false;
      }
    } else {
      _hackHoldTimer = 0;
    }

    // Counterattack proximity
    if (_hub.active && hd <= COUNTERATTACK_DIST) {
      _hubProximityTimer += dt;
      if (_hubProximityTimer >= COUNTERATTACK_TIME) {
        _spawnCounterattackJeep();
        _hubProximityTimer = 0;
      }
    } else {
      _hubProximityTimer = 0;
    }
  }

  function _updateJeep(dt, playerPos) {
    if (!_jeep || !_jeep.active) return;

    var target = playerPos || _jeep.targetPos;
    var dx = target.x - _jeep.pos.x;
    var dz = (target.z !== undefined ? target.z : 0) - _jeep.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 1) {
      _jeep.pos.x += (dx / dist) * _jeep.speed * dt;
      _jeep.pos.z += (dz / dist) * _jeep.speed * dt;
      _jeep.mesh.position.set(_jeep.pos.x, 0.75, _jeep.pos.z);
      _jeep.mesh.rotation.y = Math.atan2(dx, dz);

      // Move jeep enemies with it
      var i;
      for (i = 0; i < _jeepEnemies.length; i++) {
        _jeepEnemies[i].position.set(
          _jeep.pos.x + (i - 1.5) * 0.6,
          1.5,
          _jeep.pos.z
        );
      }
    }
  }

  function _updateParticles(dt) {
    var i;
    for (i = _fireParticles.length - 1; i >= 0; i--) {
      var fp = _fireParticles[i];
      fp._life -= dt;
      if (fp._life <= 0) {
        _scene.remove(fp);
        _fireParticles.splice(i, 1);
        continue;
      }
      fp.position.x += fp._vel.x * dt;
      fp.position.y += fp._vel.y * dt;
      fp.position.z += fp._vel.z * dt;
      fp._vel.y -= 1.5 * dt; // gravity
      fp.material.opacity = _clamp(fp._life, 0, 1);
    }
    for (i = _smokeParticles.length - 1; i >= 0; i--) {
      var sp = _smokeParticles[i];
      sp._life -= dt;
      if (sp._life <= 0) {
        _scene.remove(sp);
        _smokeParticles.splice(i, 1);
        continue;
      }
      sp.position.x += sp._vel.x * dt;
      sp.position.y += sp._vel.y * dt;
      sp.position.z += sp._vel.z * dt;
      sp.material.opacity = _clamp(sp._life / 5, 0, 0.6);
    }
  }

  function _updateSupplyHalt(dt) {
    if (!_supplyHalted) return;
    _supplyHaltTimer -= dt;
    if (_supplyHaltTimer <= 0) {
      _supplyHalted    = false;
      _supplyHaltTimer = 0;
      _hub.active      = true;
      _hubActive       = true;
      _hub.mesh.material = new THREE.MeshLambertMaterial({ color: COL_HUB });
      _showToast('ENEMY SUPPLY RESTORED — HUB BACK ONLINE', 3);
    }
    _updateHUD();
  }

  function _updateRestoreTimer(dt) {
    _restoreTimer += dt;
    if (_restoreTimer >= RESTORE_INTERVAL) {
      _restoreTimer = 0;
      _restoreOneNode();
    }
  }

  // ================================================================== public API

  function init(scene, camera, controls) {
    _scene  = scene;
    _camera = camera;

    _buildHUD();
    _buildBanner();
    _buildToast();
    _buildIntelOverlay();
    _buildSupplyNetwork();
    _buildTrucks();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    // F key hold tracking
    document.addEventListener('keydown', function (e) {
      if (e.key === 'f' || e.key === 'F') window._fKeyHeld = true;
      if (e.key === 'h' || e.key === 'H') window._hKeyHeld = true;
    });
    document.addEventListener('keyup', function (e) {
      if (e.key === 'f' || e.key === 'F') window._fKeyHeld = false;
      if (e.key === 'h' || e.key === 'H') window._hKeyHeld = false;
    });

    _inited = true;
  }

  function update(dt) {
    if (!_inited) return;
    _time += dt;

    var playerPos = _getPlayerPos();

    _updateTrucks(dt);
    _updateDepotCharges(dt);
    _updateFuelHold(dt, playerPos);
    _updateHubHold(dt, playerPos);
    _updateJeep(dt, playerPos);
    _updateParticles(dt);
    _updateSupplyHalt(dt);

    if (_modeActive) {
      _updateRestoreTimer(dt);
    }

    // Refresh intel map if visible
    if (_intelOverlay && _intelOverlay.style.display === 'block') {
      _drawIntelMap();
    }
  }

  function reset() {
    var i;

    // Remove trucks
    for (i = 0; i < _trucks.length; i++) {
      if (_scene) _scene.remove(_trucks[i].mesh);
    }
    _trucks = [];

    // Remove depots
    for (i = 0; i < _depots.length; i++) {
      if (_scene) _scene.remove(_depots[i].mesh);
    }
    _depots = [];

    // Remove fuel stations
    for (i = 0; i < _fuelStations.length; i++) {
      if (_scene) _scene.remove(_fuelStations[i].mesh);
    }
    _fuelStations = [];

    // Remove hub
    if (_hub && _scene) _scene.remove(_hub.mesh);
    _hub = null;

    // Remove guards
    for (i = 0; i < _guards.length; i++) {
      if (_scene) _scene.remove(_guards[i].mesh);
    }
    _guards = [];

    // Remove spike strips
    for (i = 0; i < _spikeStrips.length; i++) {
      if (_scene) _scene.remove(_spikeStrips[i].mesh);
    }
    _spikeStrips = [];

    // Remove jeep
    if (_jeep && _scene) _scene.remove(_jeep.mesh);
    _jeep = null;
    for (i = 0; i < _jeepEnemies.length; i++) {
      if (_scene) _scene.remove(_jeepEnemies[i]);
    }
    _jeepEnemies = [];

    // Remove particles
    for (i = 0; i < _fireParticles.length; i++) {
      if (_scene) _scene.remove(_fireParticles[i]);
    }
    _fireParticles = [];
    for (i = 0; i < _smokeParticles.length; i++) {
      if (_scene) _scene.remove(_smokeParticles[i]);
    }
    _smokeParticles = [];

    // Reset DOM
    if (_hudEl)    _hudEl.style.display = 'none';
    if (_bannerEl) _bannerEl.style.opacity = '0';
    if (_intelOverlay) _intelOverlay.style.display = 'none';

    // Reset state
    _logisticsScore       = 100;
    _trucksTotal          = 4;
    _trucksActive         = 4;
    _depotsTotal          = 3;
    _depotsActive         = 3;
    _hubActive            = true;
    _victoryFired         = false;
    _fuelHoldTimer        = 0;
    _fuelHoldNode         = -1;
    _hackHoldTimer        = 0;
    _hackHolding          = false;
    _hubProximityTimer    = 0;
    _counterattackSpawned = false;
    _restoreTimer         = 0;
    _supplyHalted         = false;
    _supplyHaltTimer      = 0;
    _modeActive           = false;
    _sKeyDown             = false;
    _cKeyDown             = false;
    _time                 = 0;
    _inited               = false;

    window._fKeyHeld = false;
    window._hKeyHeld = false;

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
  }

  // ================================================================== return

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
