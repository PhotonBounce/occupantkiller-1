window.NightVisionOps = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer;

  // NVG
  var nvgActive = false;
  var nvgLevel = 1;  // 0=LOW  1=MEDIUM  2=HIGH
  var nvgBattery = 1.0;  // 0..1  (1.0 = full 240 s)
  var NVG_DRAIN_RATE = 1 / 240;  // fraction per real-second; drains fully in 240 s
  // Intensity values per level: LOW / MEDIUM / HIGH
  var NVG_LEVELS = [
    { intensity: 0.6,  color: 0x00ff44 },   // LOW
    { intensity: 1.2,  color: 0x00ff44 },   // MEDIUM
    { intensity: 2.4,  color: 0x88ffaa }    // HIGH
  ];

  // simultaneous N+V activation window (ms)
  var keys = {};
  var nKeyTime = 0;
  var vKeyTime = 0;
  var KEY_WINDOW = 400;

  // lights
  var ambientLight;
  var nvgLight;
  var defaultAmbientColor = 0x111111;
  var defaultAmbientIntensity = 0.3;

  // fog
  var defaultFog = null;

  // thermal
  var thermalActive = false;

  // IR laser
  var laserActive = false;
  var laserLine = null;

  // scope / night-scope
  var scopeActive = false;
  var defaultFOV = 75;
  var scopeFOV = 15;
  var scopeCanvas = null;
  var scopeCtx = null;
  var scopeOverlay = null;

  // world objects
  var buildings = [];
  var safeHouse = null;

  // enemies
  var enemies = [];
  var ENEMY_COUNT = 6;

  // projectiles (suppressed shots)
  var projectiles = [];
  var PROJ_SPEED = 40;

  // stealth  0..1
  var stealthMeter = 0;
  var STEALTH_DECAY = 0.04;  // passive decay per second
  var stealthAlarmFired = false;

  // mission exfil timer (4 minutes = 240 s)
  var missionTime = 240;
  var missionOver = false;
  var helicopter = null;
  var heliArrived = false;

  // first-person player
  var playerSpeed = 6;
  var playerPos = new THREE.Vector3(0, 1.7, 0);
  var moveDir = new THREE.Vector3();
  var yaw = 0;
  var pitch = 0;
  var pointerLocked = false;

  // HUD element
  var hudElement = null;

  // clock / init guard
  var clock = null;
  var initialized = false;

  // ── init ───────────────────────────────────────────────────────────────────
  function init(opts) {
    if (initialized) return;
    initialized = true;
    opts = opts || {};
    scene    = opts.scene    || (typeof THREE !== 'undefined' ? new THREE.Scene() : null);
    camera   = opts.camera   || new THREE.PerspectiveCamera(defaultFOV, window.innerWidth / window.innerHeight, 0.1, 500);
    renderer = opts.renderer || null;

    if (!scene || !camera) return;

    clock = new THREE.Clock();
    camera.position.copy(playerPos);

    // default night-sky fog (thin haze so world is dimly visible without NVG)
    defaultFog = new THREE.FogExp2(0x000510, 0.018);
    scene.fog = defaultFog;

    // ambient light
    ambientLight = new THREE.AmbientLight(defaultAmbientColor, defaultAmbientIntensity);
    scene.add(ambientLight);

    // ground plane
    var groundGeo = new THREE.BoxGeometry(300, 0.2, 300);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a0f });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.1, 0);
    scene.add(ground);

    // NVG PointLight — attached to camera when active, detached otherwise
    nvgLight = new THREE.PointLight(0x00ff44, 1.2, 50);

    buildStructures();
    spawnEnemies();
    createLaser();
    createScopeOverlay();
    createHUD();

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup',   onKeyUp,   false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('pointerlockchange', onPointerLockChange, false);
    document.addEventListener('click', function () {
      if (renderer && renderer.domElement) renderer.domElement.requestPointerLock();
    }, false);
    window.addEventListener('resize', onResize, false);
  }

  // ── world structures ───────────────────────────────────────────────────────
  // 3 buildings in triangle formation, ~30 units apart; colour 0x444433
  function buildStructures() {
    // Triangle vertices spaced ~30 units apart
    var bPositions = [
      new THREE.Vector3(-15, 3, -15),
      new THREE.Vector3( 15, 3, -15),
      new THREE.Vector3(  0, 3, -41)
    ];
    for (var i = 0; i < bPositions.length; i++) {
      var geo  = new THREE.BoxGeometry(8, 6, 8);
      var mat  = new THREE.MeshLambertMaterial({ color: 0x444433 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(bPositions[i]);
      scene.add(mesh);
      buildings.push(mesh);
    }

    // Safe house — placed in a far corner; colour 0x334433; 6×4×6
    var shGeo = new THREE.BoxGeometry(6, 4, 6);
    var shMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    safeHouse = new THREE.Mesh(shGeo, shMat);
    safeHouse.position.set(45, 2, 45);
    scene.add(safeHouse);

    // weak light over safe house so player can find it
    var shLight = new THREE.PointLight(0x446644, 0.6, 20);
    shLight.position.set(45, 6, 45);
    scene.add(shLight);
  }

  // ── enemy combatants ───────────────────────────────────────────────────────
  // 6 enemies: CylinderGeometry torso 0x2A3A2A + IR strobe PointLight 0xFF0000
  function spawnEnemies() {
    for (var i = 0; i < ENEMY_COUNT; i++) {
      // torso
      var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2A3A2A });
      var body    = new THREE.Mesh(bodyGeo, bodyMat);

      // head
      var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
      var headMat = new THREE.MeshLambertMaterial({ color: 0x2A3A2A });
      var head    = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 1.12, 0);
      body.add(head);

      // helmet (ConeGeometry)
      var helmGeo = new THREE.ConeGeometry(0.24, 0.18, 8);
      var helmMat = new THREE.MeshLambertMaterial({ color: 0x1e2e1e });
      var helm    = new THREE.Mesh(helmGeo, helmMat);
      helm.position.set(0, 1.33, 0);
      body.add(helm);

      // IR strobe on back — blinks only in NVG mode; starts at 0 intensity
      var strobe = new THREE.PointLight(0xFF0000, 0, 4);
      strobe.position.set(0, 0.6, 0.38);
      body.add(strobe);

      // thermal shimmer — white CylinderGeometry overlay; visible in thermal mode
      var shimGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.85, 8);
      var shimMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      var shimmer = new THREE.Mesh(shimGeo, shimMat);
      body.add(shimmer);

      // spread around buildings
      var bIdx = i % buildings.length;
      var bPos = buildings[bIdx].position;
      body.position.set(
        bPos.x + (Math.random() - 0.5) * 12,
        0.9,
        bPos.z + (Math.random() - 0.5) * 12
      );
      scene.add(body);

      // patrol waypoints = all building positions (shuffled per enemy)
      var patrol = [];
      for (var j = 0; j < buildings.length; j++) {
        patrol.push(buildings[j].position.clone().setY(0.9));
      }

      enemies.push({
        mesh:             body,
        strobe:           strobe,
        shimmer:          shimmer,
        patrol:           patrol,
        patrolIdx:        i % buildings.length,
        speed:            2.0 + Math.random() * 1.5,
        state:            'patrol',  // patrol | alert | attack | investigate
        alertTimer:       0,
        investigateTarget: null,
        strobeTimer:      Math.random() * Math.PI * 2,  // phase offset
        alive:            true
      });
    }
  }

  // ── IR laser ───────────────────────────────────────────────────────────────
  function createLaser() {
    var pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -50)];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0xff0000, visible: false });
    laserLine = new THREE.LineSegments(geo, mat);
    scene.add(laserLine);
  }

  function updateLaser() {
    if (!laserLine) return;
    var show = laserActive && nvgActive;
    laserLine.material.visible = show;
    if (show) {
      var start = camera.position.clone();
      var dir   = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      var end   = start.clone().addScaledVector(dir, 60);
      var attr  = laserLine.geometry.attributes.position;
      attr.setXYZ(0, start.x, start.y, start.z);
      attr.setXYZ(1, end.x,   end.y,   end.z);
      attr.needsUpdate = true;
    }
  }

  // ── night-scope crosshair overlay ─────────────────────────────────────────
  function createScopeOverlay() {
    scopeCanvas = document.createElement('canvas');
    scopeCanvas.width  = 300;
    scopeCanvas.height = 300;
    scopeCtx = scopeCanvas.getContext('2d');

    scopeOverlay = document.createElement('div');
    scopeOverlay.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:300px',
      'height:300px',
      'display:none',
      'pointer-events:none',
      'z-index:110'
    ].join(';');

    var img = document.createElement('img');
    img.id = 'nvo-scope-img';
    scopeOverlay.appendChild(img);
    document.body.appendChild(scopeOverlay);
    drawCrosshair();
  }

  function drawCrosshair() {
    if (!scopeCtx) return;
    var ctx = scopeCtx;
    var w = 300, h = 300, cx = 150, cy = 150, r = 140;
    ctx.clearRect(0, 0, w, h);

    // dark surround
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, w, h);

    // clear circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(0, 0, w, h);
    ctx.restore();

    // reticle ring
    ctx.strokeStyle = 'rgba(0,255,68,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // crosshair lines
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

    // centre dot
    ctx.fillStyle = 'rgba(0,255,68,0.9)';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();

    // mil-dots along horizontal axis
    var milX = [-90, -60, -30, 30, 60, 90];
    for (var i = 0; i < milX.length; i++) {
      ctx.beginPath(); ctx.arc(cx + milX[i], cy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // mil-dots along vertical axis
    var milY = [-90, -60, -30, 30, 60, 90];
    for (var j = 0; j < milY.length; j++) {
      ctx.beginPath(); ctx.arc(cx, cy + milY[j], 2.5, 0, Math.PI * 2); ctx.fill();
    }

    var dataUrl = scopeCanvas.toDataURL();
    var imgEl = document.getElementById('nvo-scope-img');
    if (imgEl) imgEl.src = dataUrl;
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:13px',
      'pointer-events:none',
      'z-index:200',
      'text-shadow:0 0 6px #00ff44',
      'white-space:nowrap',
      'background:rgba(0,0,0,0.5)',
      'padding:4px 10px',
      'border-radius:3px',
      'letter-spacing:0.05em'
    ].join(';');
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (!hudElement) return;
    var battPct  = Math.max(0, Math.round(nvgBattery * 100));
    var lvlLabel = ['LOW', 'MED', 'HI'][nvgLevel];
    var nvgStr   = nvgActive ? ('ON L' + (nvgLevel + 1)) : 'OFF';
    var thStr    = thermalActive ? 'ON' : 'OFF';
    var stStr    = stealthMeter < 0.4 ? 'LOW' : stealthMeter < 0.75 ? 'MED' : 'HIGH';
    var mins     = Math.floor(missionTime / 60);
    var secs     = Math.floor(missionTime % 60);
    var timeStr  = (mins < 10 ? '0' + mins : '' + mins) + ':' + (secs < 10 ? '0' + secs : '' + secs);
    // match spec:  NIGHT OPS [NVG: ON L2] [BATT: 87%] [STEALTH: LOW] [THERMAL: OFF] | EXFIL: 03:12
    hudElement.textContent =
      'NIGHT OPS' +
      ' [NVG: '     + nvgStr   + ']' +
      ' [BATT: '    + battPct  + '%]' +
      ' [STEALTH: ' + stStr    + ']' +
      ' [THERMAL: ' + thStr    + ']' +
      ' | EXFIL: '  + timeStr;
  }

  // ── NVG activation / deactivation ─────────────────────────────────────────
  function activateNVG() {
    nvgActive = true;
    // dense black fog
    scene.fog = new THREE.FogExp2(0x000000, 0.08);
    ambientLight.color.setHex(0x001100);
    ambientLight.intensity = 0.05;
    // green PointLight attached to camera
    camera.add(nvgLight);
    if (scene.children.indexOf(camera) === -1) scene.add(camera);
    applyNVGLevel();
    updateEnemyIRStrobes(true);
  }

  function deactivateNVG() {
    nvgActive = false;
    thermalActive = false;
    scene.fog = defaultFog;
    ambientLight.color.setHex(defaultAmbientColor);
    ambientLight.intensity = defaultAmbientIntensity;
    camera.remove(nvgLight);
    // disable all IR strobes
    updateEnemyIRStrobes(false);
    // disable thermal overlays
    setThermalOverlay(false);
    if (renderer) renderer.setClearColor(0x000510, 1);
  }

  function applyNVGLevel() {
    if (!nvgActive) return;
    var lvl = NVG_LEVELS[nvgLevel];
    nvgLight.intensity = lvl.intensity;
    nvgLight.color.setHex(lvl.color);
    // tint clear colour slightly greener at higher levels
    var clearCol = nvgLevel === 2 ? 0x002211 : (nvgLevel === 1 ? 0x000d00 : 0x000500);
    if (renderer) renderer.setClearColor(clearCol, 1);
  }

  // enable/disable enemy IR strobe lights (called on NVG toggle)
  function updateEnemyIRStrobes(nvgOn) {
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].alive) continue;
      // set to 0 when off; strobe blink logic handles the on-state in updateEnemies
      if (!nvgOn) enemies[i].strobe.intensity = 0;
    }
  }

  // thermal: warm amber ambient + white enemy overlays
  function setThermalOverlay(on) {
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].alive) continue;
      enemies[i].shimmer.material.opacity = on ? 0.88 : 0;
    }
    if (renderer) {
      if (on) {
        // 0xFF4400 warm amber per spec
        renderer.setClearColor(0x1a0800, 1);
        ambientLight.color.setHex(0xFF4400);
        ambientLight.intensity = 0.12;
      } else if (nvgActive) {
        applyNVGLevel();
        ambientLight.color.setHex(0x001100);
        ambientLight.intensity = 0.05;
      }
    }
  }

  // ── keyboard input ─────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var k = e.code;
    if (keys[k]) return;  // ignore auto-repeat
    keys[k] = true;

    // record timestamps for N and V
    if (k === 'KeyN') nKeyTime = Date.now();
    if (k === 'KeyV') {
      vKeyTime = Date.now();
      // cycle NVG brightness level when already active
      if (nvgActive) {
        nvgLevel = (nvgLevel + 1) % 3;
        applyNVGLevel();
      }
    }

    // N+V simultaneous → toggle NVG (400 ms window)
    if ((k === 'KeyN' && keys['KeyV']) || (k === 'KeyV' && keys['KeyN'])) {
      var diff = Math.abs(nKeyTime - vKeyTime);
      if (diff < KEY_WINDOW) {
        if (nvgActive) {
          deactivateNVG();
        } else {
          if (nvgBattery > 0) activateNVG();
        }
      }
    }

    // T → thermal sight (NVG must be active)
    if (k === 'KeyT' && nvgActive) {
      thermalActive = !thermalActive;
      setThermalOverlay(thermalActive);
    }

    // Z → night scope (FOV 15, canvas crosshair)
    if (k === 'KeyZ') {
      scopeActive = !scopeActive;
      camera.fov = scopeActive ? scopeFOV : defaultFOV;
      camera.updateProjectionMatrix();
      if (scopeOverlay) scopeOverlay.style.display = scopeActive ? 'block' : 'none';
    }

    // L → IR laser (only visible in NVG mode)
    if (k === 'KeyL') {
      laserActive = !laserActive;
      // using the laser raises stealth slightly (movement of light)
      if (laserActive) stealthMeter = Math.min(1, stealthMeter + 0.25);
    }

    // Space → fire suppressed round
    if (k === 'Space') {
      e.preventDefault();
      fireProjectile();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!pointerLocked) return;
    yaw   -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch  = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, pitch));
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  function onPointerLockChange() {
    pointerLocked = (document.pointerLockElement === (renderer && renderer.domElement));
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── suppressed projectile ──────────────────────────────────────────────────
  function fireProjectile() {
    // CylinderGeometry r=0.04 per spec
    var geo  = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 6);
    var mat  = new THREE.MeshBasicMaterial({ color: nvgActive ? 0x00ff88 : 0xdddddd });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(camera.position);
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    // orient cylinder mesh along travel direction
    mesh.quaternion.copy(camera.quaternion);
    mesh.rotateX(Math.PI / 2);
    scene.add(mesh);
    projectiles.push({ mesh: mesh, dir: dir.clone(), life: 3.0 });

    // suppressed but not silent — enemies investigate sound origin
    var soundPos = camera.position.clone().addScaledVector(dir, 4 + Math.random() * 10);
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].alive) continue;
      if (enemies[i].state !== 'attack') {
        enemies[i].state = 'investigate';
        enemies[i].investigateTarget = soundPos.clone();
        enemies[i].alertTimer = 6;
      }
    }
    // small stealth hit for firing
    stealthMeter = Math.min(1, stealthMeter + 0.12);
  }

  // ── master update (call from game loop) ───────────────────────────────────
  function update() {
    if (!initialized || !clock) return;
    var dt = clock.getDelta();

    updatePlayer(dt);
    updateNVGBattery(dt);
    updateMissionTimer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateLaser();
    updateStealth(dt);
    checkSafeHouse();
    updateHUD();
  }

  // ── player movement ────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right   = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw));
    moveDir.set(0, 0, 0);
    var moving = false;

    if (keys['KeyW']) { moveDir.addScaledVector(forward,  1); moving = true; }
    if (keys['KeyS']) { moveDir.addScaledVector(forward, -1); moving = true; }
    if (keys['KeyA']) { moveDir.addScaledVector(right,   -1); moving = true; }
    if (keys['KeyD']) { moveDir.addScaledVector(right,    1); moving = true; }

    if (moving) {
      moveDir.normalize();
      camera.position.addScaledVector(moveDir, playerSpeed * dt);
      // running raises stealth meter
      stealthMeter = Math.min(1, stealthMeter + dt * 0.10);
    }

    // keep player at eye level
    camera.position.y = 1.7;
    playerPos.copy(camera.position);
  }

  // ── NVG battery drain ──────────────────────────────────────────────────────
  function updateNVGBattery(dt) {
    if (nvgActive) {
      nvgBattery = Math.max(0, nvgBattery - NVG_DRAIN_RATE * dt);
      if (nvgBattery === 0) deactivateNVG();
    }
  }

  // ── exfil mission timer ────────────────────────────────────────────────────
  function updateMissionTimer(dt) {
    if (missionOver) return;
    missionTime = Math.max(0, missionTime - dt);
    if (missionTime === 0 && !heliArrived) spawnHelicopter();
  }

  function spawnHelicopter() {
    heliArrived = true;
    // helicopter body — BoxGeometry per spec
    var geo  = new THREE.BoxGeometry(6, 2, 10);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    helicopter = new THREE.Mesh(geo, mat);
    helicopter.position.set(80, 10, 0);

    // rotor disc (flat CylinderGeometry)
    var rotGeo = new THREE.CylinderGeometry(4, 4, 0.1, 12);
    var rotMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.5 });
    var rotor  = new THREE.Mesh(rotGeo, rotMat);
    rotor.position.set(0, 1.2, 0);
    helicopter.add(rotor);

    // beacon light
    var beacon = new THREE.PointLight(0xff4400, 1.5, 20);
    beacon.position.set(0, 1.5, 0);
    helicopter.add(beacon);

    scene.add(helicopter);
  }

  function updateHelicopter(dt) {
    if (!helicopter) return;
    // fly in from the side, hover over exfil point (0,10,0)
    if (helicopter.position.x > 0) {
      helicopter.position.x = Math.max(0, helicopter.position.x - 12 * dt);
    }
    // gentle hover bob
    helicopter.position.y = 10 + Math.sin(Date.now() * 0.001) * 0.3;
  }

  // ── enemy AI ───────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) continue;

      // IR strobe blink (only in NVG mode, not thermal)
      e.strobeTimer += dt;
      if (nvgActive && !thermalActive) {
        e.strobe.intensity = (Math.sin(e.strobeTimer * 10) > 0) ? 1.8 : 0;
      } else {
        e.strobe.intensity = 0;
      }

      var distToPlayer = e.mesh.position.distanceTo(camera.position);

      // enemy-line-of-sight stealth raise (rough approximation via distance)
      if (distToPlayer < 20) {
        stealthMeter = Math.min(1, stealthMeter + dt * 0.08);
      }

      // state machine transitions
      if (distToPlayer < 5 && e.state !== 'attack') {
        e.state = 'attack';
        e.alertTimer = 0;
      } else if (stealthMeter >= 0.75 && distToPlayer < 28 && e.state === 'patrol') {
        e.state = 'alert';
        e.alertTimer = 3;
        stealthAlarmFired = true;
      }

      if (e.state === 'alert') {
        e.alertTimer -= dt;
        e.mesh.lookAt(camera.position.x, e.mesh.position.y, camera.position.z);
        if (e.alertTimer <= 0) {
          e.state = stealthMeter >= 1.0 ? 'attack' : 'patrol';
        }
      } else if (e.state === 'attack') {
        var toPlayer = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
        toPlayer.y = 0;
        if (toPlayer.length() > 0.5) {
          toPlayer.normalize();
          e.mesh.position.addScaledVector(toPlayer, e.speed * 1.6 * dt);
        }
        e.mesh.lookAt(camera.position.x, e.mesh.position.y, camera.position.z);
      } else if (e.state === 'investigate') {
        if (e.investigateTarget) {
          var toTarget = new THREE.Vector3().subVectors(e.investigateTarget, e.mesh.position);
          toTarget.y = 0;
          if (toTarget.length() > 0.8) {
            toTarget.normalize();
            e.mesh.position.addScaledVector(toTarget, e.speed * dt);
            e.mesh.lookAt(e.investigateTarget.x, e.mesh.position.y, e.investigateTarget.z);
          } else {
            e.alertTimer -= dt;
            if (e.alertTimer <= 0) {
              e.state = 'patrol';
              e.investigateTarget = null;
            }
          }
        }
      } else {
        // patrol — cycle through building waypoints
        var wp    = e.patrol[e.patrolIdx];
        var toDst = new THREE.Vector3().subVectors(wp, e.mesh.position);
        toDst.y = 0;
        if (toDst.length() > 1.0) {
          toDst.normalize();
          e.mesh.position.addScaledVector(toDst, e.speed * dt);
          e.mesh.lookAt(wp.x, e.mesh.position.y, wp.z);
        } else {
          e.patrolIdx = (e.patrolIdx + 1) % e.patrol.length;
        }
      }
    }
    updateHelicopter(dt);
  }

  // ── projectile flight & hit detection ─────────────────────────────────────
  function updateProjectiles(dt) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.dir, PROJ_SPEED * dt);

      var hit = false;
      for (var j = 0; j < enemies.length; j++) {
        if (!enemies[j].alive) continue;
        if (p.mesh.position.distanceTo(enemies[j].mesh.position) < 0.7) {
          scene.remove(enemies[j].mesh);
          enemies[j].alive = false;
          hit = true;
          break;
        }
      }

      if (p.life <= 0 || hit) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }
  }

  // ── stealth meter decay ────────────────────────────────────────────────────
  function updateStealth(dt) {
    stealthMeter = Math.max(0, stealthMeter - STEALTH_DECAY * dt);
    // clear alarm flag when stealth drops below threshold
    if (stealthMeter < 0.75) stealthAlarmFired = false;
  }

  // ── safe house proximity — recharge battery + reset stealth ───────────────
  function checkSafeHouse() {
    if (!safeHouse) return;
    var d = camera.position.distanceTo(safeHouse.position);
    if (d < 5.5) {
      // recharge battery (full recharge takes ~20 s at this rate)
      nvgBattery  = Math.min(1, nvgBattery + 0.003);
      // rapidly reset stealth to 0
      stealthMeter = Math.max(0, stealthMeter - 0.025);
    }
  }

  // ── reset ──────────────────────────────────────────────────────────────────
  function reset() {
    nvgActive        = false;
    nvgBattery       = 1.0;
    nvgLevel         = 1;
    thermalActive    = false;
    laserActive      = false;
    scopeActive      = false;
    stealthMeter     = 0;
    stealthAlarmFired = false;
    missionTime      = 240;
    missionOver      = false;
    heliArrived      = false;
    keys             = {};

    if (camera) {
      camera.fov = defaultFOV;
      camera.updateProjectionMatrix();
      camera.position.set(0, 1.7, 0);
      camera.rotation.set(0, 0, 0);
    }
    yaw   = 0;
    pitch = 0;

    if (scene)       scene.fog = defaultFog;
    if (ambientLight) {
      ambientLight.color.setHex(defaultAmbientColor);
      ambientLight.intensity = defaultAmbientIntensity;
    }
    if (renderer)    renderer.setClearColor(0x000510, 1);
    if (laserLine)   laserLine.material.visible = false;
    if (scopeOverlay) scopeOverlay.style.display = 'none';

    // restore enemies
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      e.strobe.intensity      = 0;
      e.shimmer.material.opacity = 0;
      e.state                 = 'patrol';
      e.alertTimer            = 0;
      e.investigateTarget     = null;
      e.alive                 = true;
      e.patrolIdx             = i % buildings.length;
      if (!e.mesh.parent) scene.add(e.mesh);
    }

    // remove live projectiles
    for (var j = projectiles.length - 1; j >= 0; j--) {
      scene.remove(projectiles[j].mesh);
    }
    projectiles.length = 0;

    // remove helicopter if present
    if (helicopter) {
      scene.remove(helicopter);
      helicopter = null;
    }
  }

  // ── public API ─────────────────────────────────────────────────────────────
  return { init: init, update: update, reset: reset };

}());
