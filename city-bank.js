// ============================================================
//  city-bank.js — City Bank Under Siege Module
//  Activation: C+B simultaneous keypress (both keys within 400ms)
//  Features:
//    1. Marble lobby with teller counter stations
//    2. Vault room with massive rotating door
//    3. Hostage area with seated hostages
//    4. Rooftop escape route with stairway
//    5. Underground tunnel from vault
//    6. Security station with emissive monitors
//    7. CCTV camera network with panning
//    8. ATM machines throughout lobby
//    9. Chandelier swaying above lobby
//    10. Money counting room with stacked bills
//    11. Safe deposit box wall
//    12. Gold bars and security elements
//  Public API: init, update, reset
// ============================================================
window.CityBank = (function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  var ACTIVATION_WINDOW      = 400;   // ms between C and B keypresses
  var MAP_WIDTH              = 120;
  var MAP_DEPTH              = 100;
  var LOBBY_HEIGHT           = 8;
  var VAULT_DOOR_ROTATION_SPEED = 0.15; // radians per second
  var CCTV_PAN_SPEED         = 1.2;   // radians per second
  var CHANDELIER_SWAY_SPEED  = 1.5;   // frequency
  var TUNNEL_BLINK_SPEED     = 2.0;   // Hz
  var SECURITY_FLICKER_SPEED = 3.0;   // Hz
  var HOSTAGE_DIM_SPEED      = 0.8;   // Hz

  // Colors
  var COLOR_MARBLE           = 0xDDCCBB;
  var COLOR_VAULT_STEEL      = 0x888888;
  var COLOR_GOLD             = 0xFFDD00;
  var COLOR_ALARM_RED        = 0xFF0000;
  var COLOR_SECURITY_GREEN   = 0x00FF44;
  var COLOR_COUNTER          = 0x654321;
  var COLOR_GLASS            = 0xEEEEFF;
  var COLOR_WALL             = 0xCCBBAA;
  var COLOR_FLOOR            = 0xEEDDCC;
  var COLOR_ROOF             = 0xAA9988;

  // ── State ─────────────────────────────────────────────────────
  var missionActive          = false;
  var missionSuccess         = false;
  var missionFailed          = false;

  var vaultDoorRotation      = 0;
  var cctvPanRotation        = 0;
  var chandelierSway         = 0;
  var tunnelBlinkTimer       = 0;
  var securityFlickerTimer   = 0;
  var hostageLight           = null;
  var hostageIntensity       = 1.0;

  var hudElement             = null;
  var keyState               = {};
  var keyTimestamps          = {};

  var _scene                 = null;
  var _camera                = null;
  var _addedKeyListener      = false;
  var _objects               = [];

  var vaultDoor              = null;
  var cctvCameras            = [];
  var chandelierMesh         = null;
  var tunnelHatch            = null;
  var securityMonitors       = [];
  var hostageChairs          = [];

  // ── Scene / Player helpers ────────────────────────────────────

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

  function randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
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
    if (code === 'KeyC' || code === 'KeyB') {
      var other = (code === 'KeyC') ? 'KeyB' : 'KeyC';
      var ts = keyTimestamps[other];
      if (ts && (Date.now() - ts) <= ACTIVATION_WINDOW) {
        activateMission();
      }
    }
  }

  // ── Scene Building ────────────────────────────────────────────

  function buildLobbyFloor() {
    var sc = getScene();
    if (!sc) return;

    // Marble floor (white/beige flat plane)
    var floorGeo = new THREE.PlaneGeometry(MAP_WIDTH, MAP_DEPTH);
    var floorMat = makeMat(COLOR_FLOOR);
    var floor = makeMesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    sc.add(floor);
    _objects.push(floor);

    // Walls
    var wallHeight = LOBBY_HEIGHT;
    var wallThick = 0.3;

    // Back wall
    var backWallGeo = new THREE.BoxGeometry(MAP_WIDTH, wallHeight, wallThick);
    var wallMat = makeMat(COLOR_WALL);
    var backWall = makeMesh(backWallGeo, wallMat);
    backWall.position.set(0, wallHeight / 2, -MAP_DEPTH / 2);
    sc.add(backWall);
    _objects.push(backWall);

    // Left wall
    var leftWallGeo = new THREE.BoxGeometry(wallThick, wallHeight, MAP_DEPTH);
    var leftWall = makeMesh(leftWallGeo, wallMat);
    leftWall.position.set(-MAP_WIDTH / 2, wallHeight / 2, 0);
    sc.add(leftWall);
    _objects.push(leftWall);

    // Right wall
    var rightWall = makeMesh(leftWallGeo, wallMat);
    rightWall.position.set(MAP_WIDTH / 2, wallHeight / 2, 0);
    sc.add(rightWall);
    _objects.push(rightWall);

    // Ceiling
    var ceilingGeo = new THREE.PlaneGeometry(MAP_WIDTH, MAP_DEPTH);
    var ceilingMat = makeMat(0xBBB8B5);
    var ceiling = makeMesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    sc.add(ceiling);
    _objects.push(ceiling);
  }

  function buildTellerCounters() {
    // Long counter stations with partition glass
    var counterPositions = [
      { x: -30, z: 10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
      { x: 30, z: 10 }
    ];

    for (var i = 0; i < counterPositions.length; i++) {
      var cp = counterPositions[i];
      // Counter base (wood/brown)
      var counterGeo = new THREE.BoxGeometry(4.5, 1.2, 2.0);
      var counterMat = makeMat(COLOR_COUNTER);
      var counter = makeMesh(counterGeo, counterMat);
      counter.position.set(cp.x, 0.6, cp.z);
      addToScene(counter);

      // Partition glass
      var glassGeo = new THREE.BoxGeometry(4.5, 2.2, 0.15);
      var glassMat = makeMat(COLOR_GLASS, { transparent: true, opacity: 0.4 });
      var glass = makeMesh(glassGeo, glassMat);
      glass.position.set(cp.x, 1.6, cp.z + 1.2);
      addToScene(glass);
    }
  }

  function buildVaultDoor() {
    // Massive vault door: thick cylinder face
    var doorGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.8, 32, 8, false);
    var doorMat = makeMat(COLOR_VAULT_STEEL);
    vaultDoor = makeMesh(doorGeo, doorMat);
    vaultDoor.position.set(0, 3, -45);
    vaultDoor.rotation.y = 0;
    addToScene(vaultDoor);
  }

  function buildVaultInterior() {
    // Gold bars inside vault
    var goldPositions = [
      { x: -1.5, y: 0.5, z: -44 },
      { x: 0, y: 0.5, z: -44 },
      { x: 1.5, y: 0.5, z: -44 },
      { x: -1.5, y: 2, z: -44 },
      { x: 0, y: 2, z: -44 },
      { x: 1.5, y: 2, z: -44 },
      { x: -1.5, y: 3.5, z: -44 },
      { x: 0, y: 3.5, z: -44 },
      { x: 1.5, y: 3.5, z: -44 }
    ];

    for (var i = 0; i < goldPositions.length; i++) {
      var gp = goldPositions[i];
      var barGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
      var barMat = makeMat(COLOR_GOLD);
      var bar = makeMesh(barGeo, barMat);
      bar.position.set(gp.x, gp.y, gp.z);
      addToScene(bar);
    }

    // Safe deposit boxes on wall
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 6; col++) {
        var boxGeo = new THREE.BoxGeometry(0.7, 0.7, 0.5);
        var boxMat = makeMat(0xAA8844);
        var box = makeMesh(boxGeo, boxMat);
        box.position.set(-2.8 + col * 0.95, 0.8 + row * 0.9, -47);
        addToScene(box);
      }
    }
  }

  function buildHostageArea() {
    // Seating area with chairs
    var chairPositions = [
      { x: 15, z: -15 },
      { x: 20, z: -15 },
      { x: 25, z: -15 },
      { x: 15, z: -20 },
      { x: 20, z: -20 },
      { x: 25, z: -20 }
    ];

    for (var i = 0; i < chairPositions.length; i++) {
      var cp = chairPositions[i];
      // Chair seat
      var seatGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
      var seatMat = makeMat(0x555555);
      var seat = makeMesh(seatGeo, seatMat);
      seat.position.set(cp.x, 0.4, cp.z);
      addToScene(seat);
      hostageChairs.push(seat);

      // Chair back
      var backGeo = new THREE.BoxGeometry(0.6, 0.9, 0.15);
      var back = makeMesh(backGeo, seatMat);
      back.position.set(cp.x, 1.1, cp.z - 0.4);
      addToScene(back);
    }

    // Hostage light above seating
    hostageLight = new THREE.PointLight(0xFFFFFF, 1.2, 40);
    hostageLight.position.set(20, 4, -17.5);
    hostageLight.castShadow = true;
    addToScene(hostageLight);
  }

  function buildSecurityStation() {
    // Security desk
    var deskGeo = new THREE.BoxGeometry(5, 1.2, 2);
    var deskMat = makeMat(0x443322);
    var desk = makeMesh(deskGeo, deskMat);
    desk.position.set(45, 0.6, -35);
    addToScene(desk);

    // Monitor screens (emissive)
    var monitorPositions = [
      { x: 42, z: -35 },
      { x: 45, z: -35 },
      { x: 48, z: -35 }
    ];

    for (var i = 0; i < monitorPositions.length; i++) {
      var mp = monitorPositions[i];
      var screenGeo = new THREE.BoxGeometry(1.2, 0.8, 0.1);
      var screenMat = makeMat(COLOR_SECURITY_GREEN, { emissive: COLOR_SECURITY_GREEN });
      var screen = makeMesh(screenGeo, screenMat);
      screen.position.set(mp.x, 1.8, mp.z);
      addToScene(screen);
      securityMonitors.push(screen);
    }
  }

  function buildCCTVCameras() {
    // CCTV camera mounts at corners and high points
    var camPositions = [
      { x: -50, y: 7, z: 40 },
      { x: 50, y: 7, z: 40 },
      { x: -50, y: 7, z: -40 },
      { x: 50, y: 7, z: -40 }
    ];

    for (var i = 0; i < camPositions.length; i++) {
      var cp = camPositions[i];
      // Mount bracket
      var mountGeo = new THREE.BoxGeometry(0.3, 0.3, 1.2);
      var mountMat = makeMat(0x333333);
      var mount = makeMesh(mountGeo, mountMat);
      mount.position.set(cp.x, cp.y, cp.z);
      addToScene(mount);

      // Camera body
      var camGeo = new THREE.SphereGeometry(0.25, 8, 8);
      var camMat = makeMat(0x222222);
      var cam = makeMesh(camGeo, camMat);
      cam.position.set(cp.x, cp.y - 0.3, cp.z + 0.6);
      addToScene(cam);

      cctvCameras.push({
        mesh: cam,
        mount: mount,
        basePos: { x: cp.x, y: cp.y, z: cp.z },
        rotation: 0
      });
    }
  }

  function buildATMMachines() {
    // ATM machines scattered around lobby
    var atmPositions = [
      { x: -35, z: 30 },
      { x: 35, z: 30 },
      { x: -35, z: -30 },
      { x: 35, z: -30 }
    ];

    for (var i = 0; i < atmPositions.length; i++) {
      var ap = atmPositions[i];
      // ATM body
      var atmGeo = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var atmMat = makeMat(0x333333);
      var atm = makeMesh(atmGeo, atmMat);
      atm.position.set(ap.x, 0.9, ap.z);
      addToScene(atm);

      // Screen
      var screenGeo = new THREE.BoxGeometry(0.6, 1.0, 0.1);
      var screenMat = makeMat(0x000000);
      var screen = makeMesh(screenGeo, screenMat);
      screen.position.set(ap.x, 1.2, ap.z + 0.3);
      addToScene(screen);
    }
  }

  function buildChandelier() {
    var group = new THREE.Group();

    // Central frame
    var frameGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
    var frameMat = makeMat(0xFFD700);
    var frame = makeMesh(frameGeo, frameMat);
    frame.position.y = 0;
    group.add(frame);

    // Hanging crystals
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 0.8;
      var z = Math.sin(angle) * 0.8;
      var crysGeo = new THREE.SphereGeometry(0.2, 8, 8);
      var crysMat = makeMat(0xEEEEFF, { transparent: true, opacity: 0.8 });
      var crys = makeMesh(crysGeo, crysMat);
      crys.position.set(x, -1.2, z);
      group.add(crys);
    }

    // Light
    var light = new THREE.PointLight(0xFFFFCC, 1.5, 50);
    light.position.set(0, -0.5, 0);
    light.castShadow = true;
    group.add(light);

    group.position.set(0, 6.5, 5);
    addToScene(group);
    chandelierMesh = group;
  }

  function buildStairway() {
    // Stairway to rooftop
    var stairColor = 0x996633;
    var stepCount = 12;
    var stepWidth = 3;
    var stepDepth = 0.4;
    var stepHeight = 0.5;

    for (var s = 0; s < stepCount; s++) {
      var stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      var stepMat = makeMat(stairColor);
      var step = makeMesh(stepGeo, stepMat);
      step.position.set(
        55,
        (s + 1) * stepHeight,
        30 + s * stepDepth * 1.5
      );
      addToScene(step);
    }

    // Landing
    var landingGeo = new THREE.BoxGeometry(5, 0.3, 5);
    var landingMat = makeMat(stairColor);
    var landing = makeMesh(landingGeo, landingMat);
    landing.position.set(55, stepCount * stepHeight + 0.3, 30 + stepCount * stepDepth * 1.5);
    addToScene(landing);
  }

  function buildUndergroundTunnel() {
    // Tunnel hatch entrance near vault
    var hatchGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
    var hatchMat = makeMat(0x444444);
    tunnelHatch = makeMesh(hatchGeo, hatchMat);
    tunnelHatch.position.set(-8, 0.1, -50);
    addToScene(tunnelHatch);

    // Tunnel going down (visible section)
    var tunnelGeo = new THREE.CylinderGeometry(1.3, 1.3, 4, 16);
    var tunnelMat = makeMat(0x333333);
    var tunnel = makeMesh(tunnelGeo, tunnelMat);
    tunnel.position.set(-8, -2, -50);
    addToScene(tunnel);
  }

  function buildMoneyCountingRoom() {
    // Room area with table
    var tableGeo = new THREE.BoxGeometry(4, 0.8, 2.5);
    var tableMat = makeMat(0x8B7355);
    var table = makeMesh(tableGeo, tableMat);
    table.position.set(-30, 0.4, -30);
    addToScene(table);

    // Stacked bills
    var billStackHeight = 2.0;
    for (var i = 0; i < 5; i++) {
      var billGeo = new THREE.BoxGeometry(0.6, billStackHeight * (1 - i * 0.15), 0.4);
      var billMat = makeMat(0x228B22);
      var bill = makeMesh(billGeo, billMat);
      bill.position.set(-32 + i * 1.2, 0.8 + billStackHeight * (1 - i * 0.15) / 2, -30);
      addToScene(bill);
    }

    // Counting station light
    var countLight = new THREE.PointLight(0xFFFFFF, 1.0, 30);
    countLight.position.set(-30, 3, -30);
    addToScene(countLight);
  }

  function buildEnvironment() {
    var sc = getScene();
    if (!sc) return;

    // Scene background and lighting
    sc.background = new THREE.Color(0x444444);

    // Ambient light
    var ambient = new THREE.AmbientLight(0x888888, 0.7);
    sc.add(ambient);
    _objects.push(ambient);

    // Main directional light
    var sun = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sc.add(sun);
    _objects.push(sun);

    // Build all structures
    buildLobbyFloor();
    buildTellerCounters();
    buildVaultDoor();
    buildVaultInterior();
    buildHostageArea();
    buildSecurityStation();
    buildCCTVCameras();
    buildATMMachines();
    buildChandelier();
    buildStairway();
    buildUndergroundTunnel();
    buildMoneyCountingRoom();
  }

  // ── HUD ───────────────────────────────────────────────────────

  function buildHUD() {
    if (hudElement) return;
    hudElement = document.createElement('div');
    hudElement.id = 'city-bank-hud';
    hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(20,20,20,0.85)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 16px',
      'border-radius:4px',
      'border:2px solid #00FF44',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (!hudElement) return;
    var vaultAngle = Math.round((vaultDoorRotation * 180 / Math.PI) % 360);
    hudElement.textContent =
      'CITYBANK | VAULT: ' + vaultAngle + 'DEG | ' +
      'HOSTAGES: CONTAINED | ' +
      'SECURITY: ACTIVE | ' +
      'TUNNEL: SEALED';
  }

  // ── Mission Activation ────────────────────────────────────────

  function activateMission() {
    if (missionActive) return;
    missionActive = true;
    missionSuccess = false;
    missionFailed = false;

    vaultDoorRotation = 0;
    cctvPanRotation = 0;
    chandelierSway = 0;
    tunnelBlinkTimer = 0;
    securityFlickerTimer = 0;
    hostageIntensity = 1.0;
    _objects = [];

    buildEnvironment();
    buildHUD();
  }

  // ── Update Functions ──────────────────────────────────────────

  function updateVaultDoor(dt) {
    if (!vaultDoor) return;
    // Slowly rotating (trying to open)
    vaultDoorRotation += VAULT_DOOR_ROTATION_SPEED * dt;
    vaultDoor.rotation.y = vaultDoorRotation;
  }

  function updateSecurityMonitors(dt) {
    if (securityMonitors.length === 0) return;
    // Static flicker effect
    securityFlickerTimer += dt;
    var flicker = 0.5 + 0.5 * Math.sin(securityFlickerTimer * SECURITY_FLICKER_SPEED * Math.PI);

    for (var i = 0; i < securityMonitors.length; i++) {
      if (securityMonitors[i].material) {
        securityMonitors[i].material.emissiveIntensity = flicker;
      }
    }
  }

  function updateChandelier(dt) {
    if (!chandelierMesh) return;
    // Gentle swaying motion
    chandelierSway += dt;
    var sway = Math.sin(chandelierSway * CHANDELIER_SWAY_SPEED) * 0.1;
    chandelierMesh.rotation.z = sway;
    chandelierMesh.rotation.x = sway * 0.5;
  }

  function updateTunnelHatch(dt) {
    if (!tunnelHatch) return;
    // Red blinking alarm
    tunnelBlinkTimer += dt;
    var blink = Math.sin(tunnelBlinkTimer * TUNNEL_BLINK_SPEED * Math.PI);
    var blinkIntensity = 0.3 + 0.7 * Math.max(0, blink);

    if (tunnelHatch.material) {
      tunnelHatch.material.color.setHex(COLOR_ALARM_RED);
      tunnelHatch.material.emissive = new THREE.Color(COLOR_ALARM_RED);
      tunnelHatch.material.emissiveIntensity = blinkIntensity;
    }
  }

  function updateHostageArea(dt) {
    if (!hostageLight) return;
    // Dimming lights
    var dimCycle = Math.sin(securityFlickerTimer * HOSTAGE_DIM_SPEED) * 0.5 + 0.5;
    hostageIntensity = 0.5 + dimCycle * 0.7;
    hostageLight.intensity = hostageIntensity;
  }

  function updateCCTVCameras(dt) {
    // Panning cameras
    for (var i = 0; i < cctvCameras.length; i++) {
      var cam = cctvCameras[i];
      cam.rotation += CCTV_PAN_SPEED * dt;

      var panAngle = cam.rotation;
      var panRange = Math.PI * 0.6;
      var actualPan = Math.sin(panAngle) * panRange;

      if (cam.mesh) {
        cam.mesh.rotation.y = actualPan;
      }
    }
  }

  // ── Public API ────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene || null;
    _camera = camera || null;
    setupKeys();
  }

  function update(dt) {
    if (!missionActive || missionSuccess || missionFailed) return;
    if (!dt || isNaN(dt)) dt = 0.016;

    updateVaultDoor(dt);
    updateSecurityMonitors(dt);
    updateChandelier(dt);
    updateTunnelHatch(dt);
    updateHostageArea(dt);
    updateCCTVCameras(dt);
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
    vaultDoor = null;
    cctvCameras = [];
    chandelierMesh = null;
    tunnelHatch = null;
    securityMonitors = [];
    hostageChairs = [];
    hostageLight = null;
    vaultDoorRotation = 0;
    cctvPanRotation = 0;
    chandelierSway = 0;
    tunnelBlinkTimer = 0;
    securityFlickerTimer = 0;
    hostageIntensity = 1.0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
