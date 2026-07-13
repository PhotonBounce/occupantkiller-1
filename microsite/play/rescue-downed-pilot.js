/* ─────────────────────────────────────────────────────────────────────────────
   RESCUE DOWNED PILOT (CSAR) — Combat Search and Rescue mission module
   Features: downed aircraft, wounded pilot NPC, enemy search parties,
   radio beacon, extraction helicopter, landing zone, smoke signals
   Keys: R+D to start, R=radio beacon, H=call helo, M=medic aid,
         T=pilot follow, S=smoke signal
   Public API: init, update, reset
   ───────────────────────────────────────────────────────────────────────────── */
window.RescueDownedPilot = (function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────────────────────
  var PILOT_MAX_HP         = 100;
  var PILOT_START_HP       = 30;
  var PILOT_BLEED_RATE     = 2;       // HP per second
  var PILOT_FOLLOW_SPEED   = 0.4;     // fraction of player speed
  var PILOT_PISTOL_RANGE   = 8;
  var PILOT_SHOOT_INTERVAL = 1.5;

  var RADIO_RANGE          = 5;       // units to pilot for beacon
  var MEDIC_RANGE          = 2;       // units to pilot for first aid
  var MEDIC_DURATION       = 3;       // seconds for first aid

  var ENEMY_SPEED          = 2.5;
  var ENEMY_HP             = 1;
  var ENEMY_CONVERGE_RANGE = 60;      // spread radius around crash
  var ESCALATION_INTERVAL  = 45;      // seconds between reinforcements

  var HELO_ARRIVAL_TIME    = 120;     // seconds
  var LZ_RADIUS            = 5;       // landing zone radius
  var LZ_CLEAR_RANGE       = 30;      // enemies within this range abort helo
  var HELO_PICKUP_RANGE    = 8;       // pilot must be within this of helo
  var PILOT_BOARD_RANGE    = 3;       // pilot runs to helo trigger

  var SMOKE_DURATION       = 25;      // seconds smoke lasts
  var SMOKE_ENEMY_ATTRACT  = 20;      // radius enemies attracted by smoke

  var SCORE_RESCUE         = 800;

  var COLOR_AIRCRAFT       = 0x556677;
  var COLOR_WING           = 0x445566;
  var COLOR_FIRE           = 0xFF4400;
  var COLOR_SKIN           = 0xCC8844;
  var COLOR_FLIGHTSUIT     = 0xCC6600;
  var COLOR_ENEMY          = 0x445544;
  var COLOR_LZ_CLEAR       = 0x00FF88;
  var COLOR_LZ_HOT         = 0xFF2222;
  var COLOR_SMOKE          = 0xCC2222;
  var COLOR_HELO           = 0x445533;

  // ── State ──────────────────────────────────────────────────────────────────
  var missionActive        = false;
  var missionSuccess       = false;
  var missionFailed        = false;

  var pilotHP              = PILOT_START_HP;
  var pilotBleeding        = true;
  var pilotFollowing       = false;
  var pilotFiring          = false;
  var pilotShootTimer      = 0;
  var medicTimer           = 0;
  var medicApplying        = false;

  var radioBeaconActive    = false;
  var heloCalledIn         = false;
  var heloArrived          = false;
  var heloAborted          = false;
  var heloETA              = HELO_ARRIVAL_TIME;
  var heloLanded           = false;
  var lzClear              = false;

  var smokeActive          = false;
  var smokeTimer           = 0;
  var smokePos             = null;

  var escalationTimer      = 0;
  var escalationCount      = 0;

  var enemies              = [];
  var fireParticles        = [];
  var fireLights           = [];

  var crashSitePos         = null;
  var lzPos                = null;

  // Three.js objects
  var aircraftGroup        = null;
  var pilotGroup           = null;
  var lzMesh               = null;
  var heloGroup            = null;
  var heloRotorMain        = null;
  var heloRotorTail        = null;
  var smokeMesh            = null;

  // HUD
  var hudElement           = null;
  var compassHUD           = null;
  var bannerEl             = null;

  // Keys
  var keyState             = {};
  var prevRKey             = false;
  var prevDKey             = false;
  var prevHKey             = false;
  var prevMKey             = false;
  var prevTKey             = false;
  var prevSKey             = false;
  var _addedKeyListener    = false;

  var _scene               = null;
  var _missionTimer        = 0;

  // ── Scene / Player helpers ─────────────────────────────────────────────────

  function getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.getScene && window.GameManager.getScene()) ||
      (window._scene) || null;
  }

  function getPlayer() {
    return (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer()) ||
      (window._player) || null;
  }

  function getPlayerPos() {
    var p = getPlayer();
    if (p && p.position) return p.position;
    if (window._playerPos) return window._playerPos;
    return { x: 0, y: 0, z: 0 };
  }

  function getPlayerSpeed() {
    return (window.GameManager && window.GameManager.getPlayerSpeed && window.GameManager.getPlayerSpeed()) || 5;
  }

  function addScore(pts) {
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(pts);
    } else if (typeof window._score !== 'undefined') {
      window._score += pts;
    }
    var scoreEl = document.getElementById('score-display');
    if (scoreEl) {
      var cur = parseInt((scoreEl.textContent || '').replace(/[^0-9\-]/g, '')) || 0;
      scoreEl.textContent = 'SCORE: ' + (cur + pts);
    }
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Material / Mesh helpers ────────────────────────────────────────────────

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

  // ── Key listener ───────────────────────────────────────────────────────────

  function setupKeys() {
    if (_addedKeyListener) return;
    _addedKeyListener = true;
    document.addEventListener('keydown', function (e) { keyState[e.code] = true; });
    document.addEventListener('keyup',   function (e) { keyState[e.code] = false; });
  }

  // ── Build: crashed aircraft ────────────────────────────────────────────────

  function buildAircraft(cx, cz) {
    var scene = getScene();
    if (!scene) return;

    aircraftGroup = new THREE.Group();
    aircraftGroup.position.set(cx, 0, cz);

    // Fuselage: 8×1.5×2 at 45° angle
    var fuseGeo = new THREE.BoxGeometry(8, 1.5, 2);
    var fuseMat = makeMat(COLOR_AIRCRAFT);
    var fuselage = makeMesh(fuseGeo, fuseMat);
    fuselage.position.set(0, 0.75, 0);
    fuselage.rotation.z = Math.PI / 4;   // 45° tilt
    aircraftGroup.add(fuselage);

    // Intact wing (port): 5×0.1×2
    var wingGeo = new THREE.BoxGeometry(5, 0.1, 2);
    var wingMat = makeMat(COLOR_WING);
    var intactWing = makeMesh(wingGeo, wingMat);
    intactWing.position.set(-3, 1.8, 0);
    aircraftGroup.add(intactWing);

    // Broken wing (starboard): smaller, separate on ground
    var brokenWingGeo = new THREE.BoxGeometry(3, 0.1, 1.5);
    var brokenWingMat = makeMat(COLOR_WING);
    var brokenWing = makeMesh(brokenWingGeo, brokenWingMat);
    brokenWing.position.set(5, 0.1, 3);
    brokenWing.rotation.z = -0.4;
    brokenWing.rotation.y = 0.3;
    aircraftGroup.add(brokenWing);

    // Tail fin
    var tailGeo = new THREE.BoxGeometry(1.5, 2, 0.2);
    var tailMat = makeMat(COLOR_AIRCRAFT);
    var tail = makeMesh(tailGeo, tailMat);
    tail.position.set(3.5, 2.2, 0);
    aircraftGroup.add(tail);

    // Engine fire: 5 PointLights (orange) + flickering cubes
    var enginePos = new THREE.Vector3(-2, 0.5, 0);
    for (var fi = 0; fi < 5; fi++) {
      var light = new THREE.PointLight(0xFF6600, 2 + Math.random() * 2, 8);
      light.position.set(
        enginePos.x + (Math.random() - 0.5) * 1.5,
        enginePos.y + Math.random() * 1.5,
        enginePos.z + (Math.random() - 0.5) * 1.5
      );
      aircraftGroup.add(light);
      fireLights.push(light);

      var cubeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var cubeMat = makeMat(COLOR_FIRE, { emissive: 0xFF2200, emissiveIntensity: 1.5 });
      var cube = makeMesh(cubeGeo, cubeMat);
      cube.position.copy(light.position);
      cube._baseY = cube.position.y;
      cube._phase = Math.random() * Math.PI * 2;
      aircraftGroup.add(cube);
      fireParticles.push(cube);
    }

    scene.add(aircraftGroup);
  }

  // ── Build: pilot NPC ───────────────────────────────────────────────────────

  function buildPilot(cx, cz) {
    var scene = getScene();
    if (!scene) return;

    pilotGroup = new THREE.Group();
    // Behind the wreckage
    pilotGroup.position.set(cx - 3, 0, cz + 4);

    // Body (flight suit)
    var bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.0, 8);
    var bodyMat = makeMat(COLOR_FLIGHTSUIT);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    pilotGroup.add(body);

    // Head (skin)
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = makeMat(COLOR_SKIN);
    var head = makeMesh(headGeo, headMat);
    head.position.y = 1.22;
    pilotGroup.add(head);

    // Helmet
    var helmetGeo = new THREE.SphereGeometry(0.26, 8, 8);
    var helmetMat = makeMat(0x334433);
    var helmet = makeMesh(helmetGeo, helmetMat);
    helmet.position.y = 1.35;
    pilotGroup.add(helmet);

    // Legs (crouched)
    var legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 6);
    var legMat = makeMat(COLOR_FLIGHTSUIT);
    var legL = makeMesh(legGeo, legMat);
    legL.position.set(-0.15, 0.28, 0.2);
    legL.rotation.x = 0.8;
    pilotGroup.add(legL);

    var legR = makeMesh(legGeo, legMat);
    legR.position.set(0.15, 0.28, 0.2);
    legR.rotation.x = 0.8;
    pilotGroup.add(legR);

    // Arm + pistol
    var armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6);
    var armMat = makeMat(COLOR_FLIGHTSUIT);
    var arm = makeMesh(armGeo, armMat);
    arm.position.set(0.35, 0.75, 0.15);
    arm.rotation.z = -0.9;
    pilotGroup.add(arm);

    // Mini pistol
    var gunGeo = new THREE.BoxGeometry(0.08, 0.08, 0.3);
    var gunMat = makeMat(0x222222);
    var gun = makeMesh(gunGeo, gunMat);
    gun.position.set(0.6, 0.72, 0.15);
    pilotGroup.add(gun);

    // Crouched posture — lower the whole group slightly
    pilotGroup.position.y = -0.3;

    scene.add(pilotGroup);
  }

  // ── Build: enemies ─────────────────────────────────────────────────────────

  function spawnEnemyGroup(cx, cz, count, spreadRadius) {
    var scene = getScene();
    if (!scene) return;

    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var r = spreadRadius * (0.6 + Math.random() * 0.4);
      var ex = cx + Math.cos(angle) * r;
      var ez = cz + Math.sin(angle) * r;

      var group = new THREE.Group();
      group.position.set(ex, 0, ez);

      var bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.2, 8);
      var bodyMat = makeMat(COLOR_ENEMY);
      var body = makeMesh(bodyGeo, bodyMat);
      body.position.y = 0.6;
      group.add(body);

      var headGeo = new THREE.SphereGeometry(0.2, 6, 6);
      var headMat = makeMat(0x334433);
      var head = makeMesh(headGeo, headMat);
      head.position.y = 1.45;
      group.add(head);

      var rifleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.7);
      var rifleMat = makeMat(0x1A1A1A);
      var rifle = makeMesh(rifleGeo, rifleMat);
      rifle.position.set(0.3, 0.9, 0.2);
      group.add(rifle);

      group._hp = ENEMY_HP;
      group._alive = true;
      group._speed = ENEMY_SPEED * (0.7 + Math.random() * 0.6);

      scene.add(group);
      enemies.push(group);
    }
  }

  function spawnInitialEnemies(cx, cz) {
    // 3 groups of 3
    for (var g = 0; g < 3; g++) {
      spawnEnemyGroup(cx, cz, 3, ENEMY_CONVERGE_RANGE);
    }
  }

  function spawnReinforcementWave(cx, cz) {
    var scene = getScene();
    if (!scene) return;

    // Spawn from map edge (80 units out)
    var angle = Math.random() * Math.PI * 2;
    var ex = cx + Math.cos(angle) * 80;
    var ez = cz + Math.sin(angle) * 80;
    spawnEnemyGroup(ex, ez, 3, 5);
  }

  // ── Build: landing zone ────────────────────────────────────────────────────

  function buildLZ(cx, cz) {
    var scene = getScene();
    if (!scene) return;

    // LZ offset from crash site
    lzPos = new THREE.Vector3(cx + 15, 0, cz + 5);

    var lzGeo = new THREE.CylinderGeometry(LZ_RADIUS, LZ_RADIUS, 0.05, 32);
    var lzMat = makeMat(COLOR_LZ_CLEAR, { transparent: true, opacity: 0.5 });
    lzMesh = makeMesh(lzGeo, lzMat);
    lzMesh.position.copy(lzPos);
    lzMesh.position.y = 0.05;
    scene.add(lzMesh);
  }

  // ── Build: helicopter ──────────────────────────────────────────────────────

  function buildHelicopter() {
    var scene = getScene();
    if (!scene) return;

    heloGroup = new THREE.Group();

    // Body: BoxGeometry 4×1.5×2
    var bodyGeo = new THREE.BoxGeometry(4, 1.5, 2);
    var bodyMat = makeMat(COLOR_HELO);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0;
    heloGroup.add(body);

    // Tail boom
    var tailGeo = new THREE.BoxGeometry(3, 0.4, 0.4);
    var tailMat = makeMat(COLOR_HELO);
    var tailBoom = makeMesh(tailGeo, tailMat);
    tailBoom.position.set(3, 0.1, 0);
    heloGroup.add(tailBoom);

    // Main rotor: CylinderGeometry (flat disk)
    var mainRotorGeo = new THREE.CylinderGeometry(3, 3, 0.05, 16);
    var mainRotorMat = makeMat(0x333333, { transparent: true, opacity: 0.7 });
    heloRotorMain = makeMesh(mainRotorGeo, mainRotorMat);
    heloRotorMain.position.y = 1.0;
    heloGroup.add(heloRotorMain);

    // Tail rotor: CylinderGeometry (side disk)
    var tailRotorGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 12);
    var tailRotorMat = makeMat(0x333333, { transparent: true, opacity: 0.7 });
    heloRotorTail = makeMesh(tailRotorGeo, tailRotorMat);
    heloRotorTail.position.set(4.5, 0.4, 0);
    heloRotorTail.rotation.z = Math.PI / 2;
    heloGroup.add(heloRotorTail);

    // Nav lights
    var lightL = new THREE.PointLight(0xFF0000, 1.5, 5);
    lightL.position.set(-2, 0, 1);
    heloGroup.add(lightL);

    var lightR = new THREE.PointLight(0x00FF00, 1.5, 5);
    lightR.position.set(-2, 0, -1);
    heloGroup.add(lightR);

    // Start position: map edge, high up
    heloGroup.position.set(crashSitePos.x - 100, 30, crashSitePos.z - 80);
    scene.add(heloGroup);
  }

  // ── Build: smoke signal ────────────────────────────────────────────────────

  function buildSmoke() {
    var scene = getScene();
    if (!scene) return;

    var pp = pilotGroup ? pilotGroup.position : crashSitePos;
    var smokeGeo = new THREE.SphereGeometry(5, 12, 8);
    var smokeMat = makeMat(COLOR_SMOKE, { transparent: true, opacity: 0.6 });
    smokeMesh = makeMesh(smokeGeo, smokeMat);
    smokeMesh.position.set(pp.x, 5, pp.z);
    smokePos = smokeMesh.position.clone();
    scene.add(smokeMesh);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    if (hudElement) return;
    hudElement = document.createElement('div');
    hudElement.id = 'csar-hud';
    hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'z-index:9000',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudElement);
  }

  function buildCompassHUD() {
    if (compassHUD) return;
    compassHUD = document.createElement('div');
    compassHUD.id = 'csar-compass';
    compassHUD.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'right:20px',
      'width:90px',
      'height:90px',
      'background:rgba(0,0,0,0.6)',
      'border:2px solid #00FF88',
      'border-radius:50%',
      'z-index:9001',
      'pointer-events:none',
      'display:flex',
      'align-items:center',
      'justify-content:center'
    ].join(';');
    compassHUD.innerHTML = '<canvas id="csar-compass-canvas" width="86" height="86"></canvas>';
    document.body.appendChild(compassHUD);
  }

  function updateCompassHUD() {
    if (!compassHUD) return;
    var canvas = document.getElementById('csar-compass-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var cx = 43;
    var cy = 43;
    var r = 38;

    ctx.clearRect(0, 0, 86, 86);

    // Draw ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw N marker
    ctx.fillStyle = '#00FF88';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy - r + 12);

    // Bearing arrow to pilot
    if (pilotGroup) {
      var pp = getPlayerPos();
      var pil = pilotGroup.position;
      var dx = pil.x - pp.x;
      var dz = pil.z - pp.z;
      var bearing = Math.atan2(dx, -dz);
      var dist = dist2D(pp, pil);

      var arrowLen = Math.min(r - 8, 25);
      var ax = cx + Math.sin(bearing) * arrowLen;
      var ay = cy - Math.cos(bearing) * arrowLen;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ax, ay);
      ctx.strokeStyle = '#FF8800';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.arc(ax, ay, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FF8800';
      ctx.fill();

      // Distance text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(dist) + 'm', cx, cy + 4);
    }
  }

  function updateHUD() {
    if (!hudElement) return;

    var bleedStr = pilotBleeding ? '<span style="color:#FF4400">YES</span>' : '<span style="color:#00FF88">NO</span>';
    var hp = Math.max(0, Math.round(pilotHP));
    var hpColor = hp > 50 ? '#00FF88' : (hp > 20 ? '#FFAA00' : '#FF4400');
    var hpStr = '<span style="color:' + hpColor + '">' + hp + 'HP</span>';

    var lzStr = lzClear
      ? '<span style="color:#00FF88">CLEAR</span>'
      : '<span style="color:#FF4400">HOT</span>';

    var heloStr = '';
    if (heloCalledIn && !heloLanded) {
      var etaMin = Math.floor(heloETA / 60);
      var etaSec = Math.floor(heloETA % 60);
      heloStr = ' | HELO ETA: ' + pad2(etaMin) + ':' + pad2(etaSec);
      if (heloAborted) heloStr = ' | HELO: <span style="color:#FF4400">ABORTED</span>';
    } else if (heloLanded) {
      heloStr = ' | HELO: <span style="color:#00FF88">LANDED</span>';
    }

    var radioStr = radioBeaconActive ? ' [BEACON: ON]' : '';

    hudElement.innerHTML = 'CSAR [PILOT: ' + hpStr + '] [BLEED: ' + bleedStr + '] [LZ: ' + lzStr + ']' + radioStr + heloStr;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function showBanner(msg, color) {
    if (bannerEl) { document.body.removeChild(bannerEl); bannerEl = null; }
    bannerEl = document.createElement('div');
    bannerEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'color:' + (color || '#00FF88'),
      'background:rgba(0,0,0,0.8)',
      'padding:16px 32px',
      'border:3px solid ' + (color || '#00FF88'),
      'border-radius:8px',
      'z-index:10000',
      'pointer-events:none'
    ].join(';');
    bannerEl.textContent = msg;
    document.body.appendChild(bannerEl);
    setTimeout(function () {
      if (bannerEl && bannerEl.parentNode) {
        document.body.removeChild(bannerEl);
        bannerEl = null;
      }
    }, 4000);
  }

  function destroyHUD() {
    if (hudElement && hudElement.parentNode) document.body.removeChild(hudElement);
    if (compassHUD && compassHUD.parentNode) document.body.removeChild(compassHUD);
    if (bannerEl && bannerEl.parentNode) document.body.removeChild(bannerEl);
    hudElement = null;
    compassHUD = null;
    bannerEl = null;
  }

  // ── Mission init ───────────────────────────────────────────────────────────

  function startMission() {
    if (missionActive) return;
    missionActive = true;
    missionSuccess = false;
    missionFailed = false;

    pilotHP = PILOT_START_HP;
    pilotBleeding = true;
    pilotFollowing = false;
    pilotFiring = false;
    pilotShootTimer = 0;
    medicTimer = 0;
    medicApplying = false;
    radioBeaconActive = false;
    heloCalledIn = false;
    heloArrived = false;
    heloAborted = false;
    heloETA = HELO_ARRIVAL_TIME;
    heloLanded = false;
    lzClear = false;
    smokeActive = false;
    smokeTimer = 0;
    smokePos = null;
    escalationTimer = 0;
    escalationCount = 0;
    enemies = [];
    fireParticles = [];
    fireLights = [];

    // Position crash site near player
    var pp = getPlayerPos();
    var cx = pp.x + 20;
    var cz = pp.z + 10;
    crashSitePos = new THREE.Vector3(cx, 0, cz);

    buildAircraft(cx, cz);
    buildPilot(cx, cz);
    spawnInitialEnemies(cx, cz);
    buildLZ(cx, cz);
    buildHUD();
    buildCompassHUD();

    showBanner('CSAR MISSION ACTIVE', '#FF8800');
  }

  // ── Update helpers ─────────────────────────────────────────────────────────

  function updateFireParticles(dt) {
    _missionTimer += dt;
    for (var fi = 0; fi < fireParticles.length; fi++) {
      var fp = fireParticles[fi];
      fp.position.y = fp._baseY + Math.sin(_missionTimer * 8 + fp._phase) * 0.15;
      fp.rotation.y += dt * 3;
      var flicker = 0.5 + Math.sin(_missionTimer * 12 + fp._phase) * 0.5;
      if (fp.material && fp.material.emissiveIntensity !== undefined) {
        fp.material.emissiveIntensity = 0.8 + flicker * 1.2;
      }
    }
    for (var li = 0; li < fireLights.length; li++) {
      var fl = fireLights[li];
      fl.intensity = 1.5 + Math.sin(_missionTimer * 10 + li) * 1.2;
    }
  }

  function updateEnemies(dt) {
    var target = (pilotGroup) ? pilotGroup.position : crashSitePos;
    var smokeAttract = (smokeActive && smokePos) ? smokePos : null;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e._alive) continue;

      // Choose move target: smoke draws them if within range
      var moveTarget = target;
      if (smokeAttract) {
        var sd = dist2D(e.position, smokeAttract);
        if (sd < SMOKE_ENEMY_ATTRACT) {
          moveTarget = smokeAttract;
        }
      }

      var dx = moveTarget.x - e.position.x;
      var dz = moveTarget.z - e.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 1.5) {
        e.position.x += (dx / d) * e._speed * dt;
        e.position.z += (dz / d) * e._speed * dt;
        e.rotation.y = Math.atan2(dx, dz);
      }
    }
  }

  function countAliveEnemies() {
    var n = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i]._alive) n++;
    }
    return n;
  }

  function updateLZStatus() {
    if (!lzPos) return;
    var hot = false;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e._alive) continue;
      if (dist2D(e.position, lzPos) < LZ_CLEAR_RANGE) {
        hot = true;
        break;
      }
    }
    lzClear = !hot;

    if (lzMesh) {
      lzMesh.material.color.setHex(lzClear ? COLOR_LZ_CLEAR : COLOR_LZ_HOT);
    }
  }

  function updatePilot(dt) {
    if (!pilotGroup) return;

    // Bleeding
    if (pilotBleeding) {
      pilotHP -= PILOT_BLEED_RATE * dt;
      if (pilotHP <= 0) {
        pilotHP = 0;
        triggerMissionFail('PILOT KIA');
        return;
      }
    }

    // Follow player
    if (pilotFollowing) {
      var pp = getPlayerPos();
      var dx = pp.x - pilotGroup.position.x;
      var dz = pp.z - pilotGroup.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      var followSpeed = getPlayerSpeed() * PILOT_FOLLOW_SPEED;
      if (d > 2.5) {
        pilotGroup.position.x += (dx / d) * followSpeed * dt;
        pilotGroup.position.z += (dz / d) * followSpeed * dt;
        pilotGroup.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Pilot fires at nearby enemies
    pilotShootTimer -= dt;
    if (pilotShootTimer <= 0) {
      var pp2 = getPlayerPos();
      // Only fire if player is somewhat visible (within 20 units)
      if (dist2D(pp2, pilotGroup.position) < 20) {
        for (var i = 0; i < enemies.length; i++) {
          var e = enemies[i];
          if (!e._alive) continue;
          if (dist2D(pilotGroup.position, e.position) < PILOT_PISTOL_RANGE) {
            // Pilot shoots — kill chance based on distance
            var dToE = dist2D(pilotGroup.position, e.position);
            if (Math.random() < (1 - dToE / PILOT_PISTOL_RANGE) * 0.4) {
              killEnemy(e);
            }
            break;
          }
        }
      }
      pilotShootTimer = PILOT_SHOOT_INTERVAL + Math.random() * 0.5;
    }
  }

  function updateMedic(dt) {
    if (!medicApplying) return;
    medicTimer += dt;
    if (medicTimer >= MEDIC_DURATION) {
      pilotBleeding = false;
      medicApplying = false;
      medicTimer = 0;
      showBanner('FIRST AID APPLIED', '#00FF88');
    }
  }

  function updateHelicopter(dt) {
    if (!heloCalledIn || !heloGroup) return;
    if (heloLanded) return;

    heloETA -= dt;

    // Animate rotors
    if (heloRotorMain) heloRotorMain.rotation.y += dt * 15;
    if (heloRotorTail) heloRotorTail.rotation.x += dt * 20;

    if (heloETA <= 0) {
      // Move helo toward LZ
      if (!lzPos) return;

      var targetY = heloLanded ? 0 : 4;
      var dx = lzPos.x - heloGroup.position.x;
      var dy = targetY - heloGroup.position.y;
      var dz = lzPos.z - heloGroup.position.z;
      var horiz = Math.sqrt(dx * dx + dz * dz);

      var moveSpeed = 12;
      if (horiz > 0.5) {
        heloGroup.position.x += (dx / horiz) * moveSpeed * dt;
        heloGroup.position.z += (dz / horiz) * moveSpeed * dt;
        heloGroup.rotation.y = Math.atan2(dx, dz);
      }
      // Descend
      heloGroup.position.y += dy * dt * 0.8;

      // Check if LZ is hot → abort or wait
      if (!lzClear) {
        heloAborted = true;
        // Circle and wait — move in circle
        var circleAngle = _missionTimer * 0.5;
        var circleR = 20;
        heloGroup.position.x = lzPos.x + Math.cos(circleAngle) * circleR;
        heloGroup.position.z = lzPos.z + Math.sin(circleAngle) * circleR;
        heloGroup.position.y = 8;
        // Color body red
        if (heloGroup.children[0] && heloGroup.children[0].material) {
          heloGroup.children[0].material.color.setHex(0xFF3300);
        }
        return;
      } else {
        heloAborted = false;
        if (heloGroup.children[0] && heloGroup.children[0].material) {
          heloGroup.children[0].material.color.setHex(COLOR_HELO);
        }
      }

      // Check touchdown
      if (heloGroup.position.y <= 0.2 && horiz < 2) {
        heloGroup.position.y = 0;
        heloLanded = true;
        checkPilotExtraction();
      }
    } else {
      // Inbound — animate flying in
      var inboundDx = crashSitePos.x - 100 - heloGroup.position.x;
      var inboundDz = crashSitePos.z - 80 - heloGroup.position.z;
      // Just hover at start position until ETA hits
      heloGroup.position.y = 30 + Math.sin(_missionTimer * 0.5) * 2;
    }
  }

  function checkPilotExtraction() {
    if (!pilotGroup || !heloGroup) return;
    var d = dist2D(pilotGroup.position, heloGroup.position);
    if (d <= HELO_PICKUP_RANGE) {
      triggerMissionSuccess();
    } else if (pilotFollowing) {
      // Pilot auto-runs to helo if following
      var dx = heloGroup.position.x - pilotGroup.position.x;
      var dz = heloGroup.position.z - pilotGroup.position.z;
      var dl = Math.sqrt(dx * dx + dz * dz);
      if (dl > 0.5) {
        pilotGroup.position.x += (dx / dl) * 5 * 0.016;
        pilotGroup.position.z += (dz / dl) * 5 * 0.016;
      }
    }
  }

  function updateSmoke(dt) {
    if (!smokeActive) return;
    smokeTimer -= dt;
    if (smokeTimer <= 0) {
      smokeActive = false;
      if (smokeMesh && smokeMesh.parent) {
        getScene().remove(smokeMesh);
        smokeMesh = null;
      }
      return;
    }
    if (smokeMesh) {
      smokeMesh.position.y = 5 + Math.sin(_missionTimer * 0.5) * 2;
      smokeMesh.material.opacity = 0.4 + Math.sin(_missionTimer * 2) * 0.15;
    }
  }

  function updateEscalation(dt) {
    escalationTimer += dt;
    if (escalationTimer >= ESCALATION_INTERVAL) {
      escalationTimer = 0;
      escalationCount++;
      spawnReinforcementWave(crashSitePos.x, crashSitePos.z);
    }
  }

  function killEnemy(e) {
    if (!e._alive) return;
    e._alive = false;
    var scene = getScene();
    if (scene && e.parent) scene.remove(e);
  }

  function triggerMissionSuccess() {
    if (missionSuccess || missionFailed) return;
    missionSuccess = true;
    missionActive = false;
    addScore(SCORE_RESCUE);
    showBanner('PILOT RESCUED', '#00FF88');
  }

  function triggerMissionFail(reason) {
    if (missionSuccess || missionFailed) return;
    missionFailed = true;
    missionActive = false;
    showBanner('MISSION FAILED: ' + (reason || ''), '#FF2200');
  }

  // ── Key action handlers ────────────────────────────────────────────────────

  function handleRadioBeacon() {
    if (!pilotGroup) return;
    var pp = getPlayerPos();
    var d = dist2D(pp, pilotGroup.position);
    if (d <= RADIO_RANGE) {
      radioBeaconActive = true;
      showBanner('BEACON ACTIVE', '#00FF88');
    }
  }

  function handleCallHelo() {
    if (!radioBeaconActive) {
      showBanner('ACTIVATE BEACON FIRST (R)', '#FF8800');
      return;
    }
    if (heloCalledIn) return;
    heloCalledIn = true;
    heloETA = HELO_ARRIVAL_TIME;
    buildHelicopter();
    showBanner('HELO EN ROUTE — ETA 2:00', '#00FF88');
  }

  function handleMedic() {
    if (medicApplying) return;
    if (!pilotGroup) return;
    var pp = getPlayerPos();
    var d = dist2D(pp, pilotGroup.position);
    if (d <= MEDIC_RANGE) {
      medicApplying = true;
      medicTimer = 0;
      showBanner('APPLYING FIRST AID...', '#00AAFF');
    } else {
      showBanner('TOO FAR FOR FIRST AID', '#FF8800');
    }
  }

  function handlePilotFollow() {
    pilotFollowing = !pilotFollowing;
    showBanner(pilotFollowing ? 'PILOT FOLLOWING' : 'PILOT HOLDING', '#00AAFF');
  }

  function handleSmoke() {
    if (smokeActive) return;
    if (!pilotGroup) return;
    smokeActive = true;
    smokeTimer = SMOKE_DURATION;
    buildSmoke();
    showBanner('SMOKE DEPLOYED', '#CC2222');
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene || null;
    setupKeys();
    prevRKey = false;
    prevDKey = false;
    prevHKey = false;
    prevMKey = false;
    prevTKey = false;
    prevSKey = false;
    _missionTimer = 0;
  }

  function update(dt) {
    var rKey = !!keyState['KeyR'];
    var dKey = !!keyState['KeyD'];
    var hKey = !!keyState['KeyH'];
    var mKey = !!keyState['KeyM'];
    var tKey = !!keyState['KeyT'];
    var sKey = !!keyState['KeyS'];

    // R+D to start mission
    if (!missionActive && !missionSuccess && !missionFailed) {
      if (rKey && dKey) {
        startMission();
      }
    }

    if (missionActive) {
      _missionTimer += dt;

      // R key (rising edge) → radio beacon
      if (rKey && !prevRKey) {
        handleRadioBeacon();
      }

      // H key (rising edge) → call helo
      if (hKey && !prevHKey) {
        handleCallHelo();
      }

      // M key (rising edge) → first aid
      if (mKey && !prevMKey) {
        handleMedic();
      }

      // T key (rising edge) → pilot follow toggle
      if (tKey && !prevTKey) {
        handlePilotFollow();
      }

      // S key (rising edge) → smoke signal
      if (sKey && !prevSKey) {
        handleSmoke();
      }

      updateFireParticles(dt);
      updateEnemies(dt);
      updatePilot(dt);
      updateMedic(dt);
      updateHelicopter(dt);
      updateSmoke(dt);
      updateEscalation(dt);
      updateLZStatus();

      // Auto-check extraction when helo landed
      if (heloLanded) {
        checkPilotExtraction();
      }

      updateHUD();
      if (radioBeaconActive) {
        updateCompassHUD();
      }
    }

    prevRKey = rKey;
    prevDKey = dKey;
    prevHKey = hKey;
    prevMKey = mKey;
    prevTKey = tKey;
    prevSKey = sKey;
  }

  function reset() {
    missionActive = false;
    missionSuccess = false;
    missionFailed = false;

    var scene = getScene();

    if (aircraftGroup && scene && aircraftGroup.parent) scene.remove(aircraftGroup);
    if (pilotGroup && scene && pilotGroup.parent) scene.remove(pilotGroup);
    if (lzMesh && scene && lzMesh.parent) scene.remove(lzMesh);
    if (heloGroup && scene && heloGroup.parent) scene.remove(heloGroup);
    if (smokeMesh && scene && smokeMesh.parent) scene.remove(smokeMesh);

    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i] && scene && enemies[i].parent) scene.remove(enemies[i]);
    }

    aircraftGroup = null;
    pilotGroup = null;
    lzMesh = null;
    heloGroup = null;
    heloRotorMain = null;
    heloRotorTail = null;
    smokeMesh = null;
    enemies = [];
    fireParticles = [];
    fireLights = [];
    crashSitePos = null;
    lzPos = null;
    smokePos = null;

    pilotHP = PILOT_START_HP;
    pilotBleeding = true;
    pilotFollowing = false;
    radioBeaconActive = false;
    heloCalledIn = false;
    heloArrived = false;
    heloAborted = false;
    heloETA = HELO_ARRIVAL_TIME;
    heloLanded = false;
    lzClear = false;
    smokeActive = false;
    smokeTimer = 0;
    escalationTimer = 0;
    escalationCount = 0;
    medicApplying = false;
    medicTimer = 0;
    _missionTimer = 0;

    destroyHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset,
    killEnemy: killEnemy,
    isActive: function () { return missionActive; },
    getPilotHP: function () { return pilotHP; },
    isSuccess: function () { return missionSuccess; },
    isFailed: function () { return missionFailed; }
  };

})();
