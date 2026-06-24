window.MoonbaseAssault = (function () {
  'use strict';

  // ── activation ───────────────────────────────────────────────────────────
  var ACTIVATION_KEY_M = 77;
  var ACTIVATION_KEY_B = 66;
  var ACTIVATION_WINDOW = 400;

  // ── constants ─────────────────────────────────────────────────────────────
  var GRAVITY = -2.6;           // moon ~1/6 Earth gravity
  var JUMP_FORCE = 9.0;         // 3× normal jump height
  var DRAG_GROUND = 0.80;       // floatier deceleration
  var DRAG_AIR = 0.97;
  var PLAYER_SPEED = 10;
  var PLAYER_HEIGHT = 1.8;
  var PLAYER_MAX_HP = 100;

  var ENEMY_COUNT = 20;
  var ENEMY_HP = 100;
  var COMMANDER_HP = 400;
  var ENEMY_SHOOT_RANGE = 35;
  var ENEMY_SHOOT_CD = 2.0;
  var ENEMY_DMG = 8;
  var COMMANDER_DMG = 15;
  var COMMANDER_SHOOT_CD = 1.2;

  var VACUUM_BREACH_DPS = 5;
  var AIRLOCK_ANIM_TIME = 3.0;
  var SEAL_HOLD_TIME = 4.0;
  var REACTOR_COUNTDOWN = 180;  // 3 minutes
  var DUST_PARTICLE_COUNT = 30;
  var DOME_RADIUS = 15;

  // dome definitions
  var DOME_DEFS = [
    { id: 0, x: -45, z: -30, label: 'Alpha' },
    { id: 1, x:  45, z: -30, label: 'Beta'  },
    { id: 2, x:   0, z:  30, label: 'Gamma' }
  ];

  // ── state ─────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,

    playerPos: { x: 0, y: PLAYER_HEIGHT, z: 80 },
    playerVel: { x: 0, y: 0, z: 0 },
    playerHP: PLAYER_MAX_HP,
    playerYaw: 0,
    playerPitch: 0,
    onGround: false,

    keysDown: {},
    keyTimes: {},
    mouseButtons: {},
    pointerLocked: false,

    // weapons: 0=assault rifle, 1=railgun, 2=plasma cutter
    currentWeapon: 0,
    shootCooldown: 0,
    railgunBeam: null,
    railgunBeamTimer: 0,
    railgunFound: false,

    // enemies
    enemies: [],
    commanderMesh: null,
    commanderHP: COMMANDER_HP,
    commanderAlive: true,
    commanderShootCd: 0,

    // domes
    domeMeshes: [],
    domesCleared: 0,
    domeBreach: [false, false, false],  // vacuum breach per dome
    domeSealing: -1,                    // which dome E is sealing
    domeSealTimer: 0,

    // airlock
    inDome: -1,           // -1 = outside
    airlockTransition: false,
    airlockTimer: 0,
    airlockToDome: -1,
    airlockOverlay: null,

    // satellite
    satelliteAlive: true,
    satelliteMesh: null,
    reinforcementsActive: true,
    reinforcementTimer: 0,
    reinforcementInterval: 25,

    // reactor
    reactorMesh: null,
    reactorLight: null,
    reactorArmed: false,
    reactorCountdown: REACTOR_COUNTDOWN,
    reactorChargingTimer: 0,
    reactorCharging: false,
    reactorPulseT: 0,

    // landing pad
    landingPadPos: { x: 0, z: 80 },

    // environment
    dustParticles: [],
    objects: [],

    // HUD
    hudEl: null,
    overlayEl: null,

    gameOver: false,
    gameWon: false,
    lastTime: 0,
    animFrameId: null
  };

  // ── key / mouse helpers ───────────────────────────────────────────────────

  function onKeyDown(e) {
    var k = e.keyCode;
    var now = Date.now();
    if (!state.keysDown[k]) state.keyTimes[k] = now;
    state.keysDown[k] = true;

    // weapon switch
    if (k === 49) state.currentWeapon = 0; // 1
    if (k === 50 && state.railgunFound) state.currentWeapon = 1; // 2
    if (k === 51) state.currentWeapon = 2; // 3

    // jump
    if (k === 32 && state.onGround && !state.airlockTransition) {
      state.playerVel.y = JUMP_FORCE;
      state.onGround = false;
    }

    // plant reactor charge
    if (k === 70) { // F
      tryPlantReactorCharge();
    }

    // activation combo
    checkActivationCombo(k, now);
    if (k === 27) destroy();
  }

  function onKeyUp(e) {
    state.keysDown[e.keyCode] = false;
  }

  function onMouseDown(e) {
    state.mouseButtons[e.button] = true;
    if (!state.pointerLocked && e.button === 0) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  function onMouseUp(e) {
    state.mouseButtons[e.button] = false;
  }

  function onMouseMove(e) {
    if (!state.pointerLocked) return;
    state.playerYaw -= e.movementX * 0.002;
    state.playerPitch -= e.movementY * 0.002;
    if (state.playerPitch > 1.4) state.playerPitch = 1.4;
    if (state.playerPitch < -1.4) state.playerPitch = -1.4;
  }

  function onPointerLockChange() {
    state.pointerLocked = (document.pointerLockElement === state.renderer.domElement);
  }

  function checkActivationCombo(k, now) {
    if (k === ACTIVATION_KEY_B && state.keysDown[ACTIVATION_KEY_M]) {
      var t = state.keyTimes[ACTIVATION_KEY_M] || 0;
      if (now - t <= ACTIVATION_WINDOW) { init(); return; }
    }
    if (k === ACTIVATION_KEY_M && state.keysDown[ACTIVATION_KEY_B]) {
      var t2 = state.keyTimes[ACTIVATION_KEY_B] || 0;
      if (now - t2 <= ACTIVATION_WINDOW) { init(); return; }
    }
  }

  function bindEvents() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  function unbindEvents() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // ── scene setup ───────────────────────────────────────────────────────────

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x000005);

    state.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1200);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    // lighting
    var ambient = new THREE.AmbientLight(0x111122, 0.4);
    state.scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(80, 120, 60);
    state.scene.add(sun);

    // stars background (random positions on big sphere)
    var starGeo = new THREE.SphereGeometry(0.2, 4, 4);
    var starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (var s = 0; s < 400; s++) {
      var star = new THREE.Mesh(starGeo, starMat);
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = 800 + Math.random() * 200;
      star.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      state.scene.add(star);
    }
  }

  // ── environment ───────────────────────────────────────────────────────────

  function buildEnvironment() {
    // Lunar terrain
    var groundGeo = new THREE.BoxGeometry(500, 2, 500);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -1, 0);
    state.scene.add(ground);
    state.objects.push({ mesh: ground, solid: true, minY: 0, halfW: 250, halfD: 250 });

    // rock boulders scattered
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    for (var i = 0; i < 40; i++) {
      var rx = (Math.random() - 0.5) * 400;
      var rz = (Math.random() - 0.5) * 400;
      // avoid dome positions
      var tooClose = false;
      for (var di = 0; di < DOME_DEFS.length; di++) {
        var dx = rx - DOME_DEFS[di].x;
        var dz = rz - DOME_DEFS[di].z;
        if (Math.sqrt(dx * dx + dz * dz) < 25) { tooClose = true; break; }
      }
      if (tooClose) continue;
      var rs = 1 + Math.random() * 3;
      var rGeo = new THREE.BoxGeometry(rs, rs * 0.6, rs);
      var rock = new THREE.Mesh(rGeo, rockMat);
      rock.position.set(rx, rs * 0.3, rz);
      rock.rotation.y = Math.random() * Math.PI;
      state.scene.add(rock);
    }

    buildCraters();
    buildDustParticles();
    buildLandingPad();
  }

  function buildCraters() {
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (var i = 0; i < 25; i++) {
      var cx = (Math.random() - 0.5) * 380;
      var cz = (Math.random() - 0.5) * 380;
      var cr = 4 + Math.random() * 10;
      // crater depression — flattened sphere
      var cGeo = new THREE.SphereGeometry(cr, 10, 6);
      var crater = new THREE.Mesh(cGeo, craterMat);
      crater.scale.y = 0.18;
      crater.position.set(cx, -0.2, cz);
      state.scene.add(crater);

      // crater rim ring
      var rimGeo = new THREE.CylinderGeometry(cr * 1.08, cr * 1.05, 0.5, 16, 1, true);
      var rimMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
      var rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(cx, 0.2, cz);
      state.scene.add(rim);
    }
  }

  function buildDustParticles() {
    var dustMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.6 });
    for (var i = 0; i < DUST_PARTICLE_COUNT; i++) {
      var dGeo = new THREE.SphereGeometry(0.12, 4, 4);
      var dust = new THREE.Mesh(dGeo, dustMat);
      dust.visible = false;
      state.scene.add(dust);
      state.dustParticles.push({ mesh: dust, vel: { x: 0, y: 0, z: 0 }, life: 0 });
    }
  }

  function buildLandingPad() {
    var padGeo = new THREE.BoxGeometry(20, 0.3, 20);
    var padMat = new THREE.MeshLambertMaterial({ color: 0x335533 });
    var pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(state.landingPadPos.x, 0.15, state.landingPadPos.z);
    state.scene.add(pad);

    // landing pad markings
    var markGeo = new THREE.BoxGeometry(1, 0.35, 12);
    var markMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var mark1 = new THREE.Mesh(markGeo, markMat);
    mark1.position.set(state.landingPadPos.x, 0.15, state.landingPadPos.z);
    state.scene.add(mark1);
    var mark2 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 1), markMat);
    mark2.position.set(state.landingPadPos.x, 0.15, state.landingPadPos.z);
    state.scene.add(mark2);
  }

  // ── moonbase ──────────────────────────────────────────────────────────────

  function buildMoonbase() {
    buildDomes();
    buildTubes();
    buildSatelliteDish();
    buildReactor();
    buildArmory();
  }

  function buildDomes() {
    var domeMat = new THREE.MeshLambertMaterial({ color: 0x556677, transparent: true, opacity: 0.85 });
    for (var i = 0; i < DOME_DEFS.length; i++) {
      var def = DOME_DEFS[i];
      var dGeo = new THREE.SphereGeometry(DOME_RADIUS, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      var dome = new THREE.Mesh(dGeo, domeMat);
      dome.position.set(def.x, 0, def.z);
      state.scene.add(dome);
      state.domeMeshes.push(dome);

      // dome base ring
      var baseGeo = new THREE.CylinderGeometry(DOME_RADIUS, DOME_RADIUS + 0.5, 1.5, 16);
      var baseMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(def.x, 0.75, def.z);
      state.scene.add(base);

      // interior floor
      var floorGeo = new THREE.CylinderGeometry(DOME_RADIUS - 0.5, DOME_RADIUS - 0.5, 0.3, 16);
      var floorMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(def.x, 0.15, def.z);
      state.scene.add(floor);
    }
  }

  function buildTubes() {
    var tubeMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    // connect dome 0 to dome 1
    connectDomes(DOME_DEFS[0], DOME_DEFS[1], tubeMat);
    // connect dome 1 to dome 2
    connectDomes(DOME_DEFS[1], DOME_DEFS[2], tubeMat);
    // connect dome 0 to dome 2
    connectDomes(DOME_DEFS[0], DOME_DEFS[2], tubeMat);
  }

  function connectDomes(a, b, mat) {
    var mx = (a.x + b.x) / 2;
    var mz = (a.z + b.z) / 2;
    var dx = b.x - a.x;
    var dz = b.z - a.z;
    var len = Math.sqrt(dx * dx + dz * dz) - DOME_RADIUS * 2;
    if (len < 0) return;

    var tubeGeo = new THREE.CylinderGeometry(3, 3, len, 10);
    var tube = new THREE.Mesh(tubeGeo, mat);
    tube.position.set(mx, 3, mz);
    tube.rotation.z = Math.PI / 2;
    tube.rotation.y = -Math.atan2(dz, dx);
    // rotate to horizontal
    tube.rotation.order = 'YZX';
    tube.rotation.x = Math.atan2(dz, dx);
    tube.rotation.y = Math.PI / 2;
    tube.rotation.z = Math.PI / 2;

    // recompute: cylinder along Y axis, need to rotate to lie along XZ
    var angle = Math.atan2(dx, dz);
    tube.rotation.set(Math.PI / 2, angle, 0);
    state.scene.add(tube);
  }

  function buildSatelliteDish() {
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
    var dishMat = new THREE.MeshLambertMaterial({ color: 0xaabbcc });

    // position near dome 1
    var sx = DOME_DEFS[1].x + 20;
    var sz = DOME_DEFS[1].z - 20;

    // pole
    var poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(sx, 5, sz);
    state.scene.add(pole);

    // dish
    var dishGeo = new THREE.BoxGeometry(6, 0.3, 6);
    var dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(sx, 10.5, sz);
    dish.rotation.x = -0.4;
    state.scene.add(dish);

    // dish arm
    var armGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
    var arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(sx, 10.5, sz - 1.5);
    arm.rotation.x = 0.4;
    state.scene.add(arm);

    // dish feed
    var feedGeo = new THREE.ConeGeometry(0.4, 1.5, 6);
    var feed = new THREE.Mesh(feedGeo, poleMat);
    feed.position.set(sx, 12, sz - 1);
    feed.rotation.x = Math.PI;
    state.scene.add(feed);

    // store group center for destruction check
    state.satelliteMesh = pole;
    state.satellitePos = { x: sx, y: 8, z: sz };
    state.satelliteParts = [pole, dish, arm, feed];
  }

  function buildReactor() {
    // position inside dome 2 (Gamma)
    var rx = DOME_DEFS[2].x;
    var rz = DOME_DEFS[2].z;

    var reactorMat = new THREE.MeshLambertMaterial({ color: 0x44ff88 });
    var reactorGeo = new THREE.CylinderGeometry(2.5, 3, 6, 12);
    state.reactorMesh = new THREE.Mesh(reactorGeo, reactorMat);
    state.reactorMesh.position.set(rx, 3, rz);
    state.scene.add(state.reactorMesh);

    // reactor top cap
    var capGeo = new THREE.CylinderGeometry(1.5, 2.5, 1, 12);
    var capMat = new THREE.MeshLambertMaterial({ color: 0x22bb66 });
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(rx, 6.5, rz);
    state.scene.add(cap);

    // reactor glow light
    state.reactorLight = new THREE.PointLight(0x44ff88, 2.5, 30);
    state.reactorLight.position.set(rx, 5, rz);
    state.scene.add(state.reactorLight);
  }

  function buildArmory() {
    // small armory box inside dome 0 (Alpha) — holds railgun
    var armMat = new THREE.MeshLambertMaterial({ color: 0x553300 });
    var armGeo = new THREE.BoxGeometry(3, 2, 2);
    var armBox = new THREE.Mesh(armGeo, armMat);
    armBox.position.set(DOME_DEFS[0].x + 8, 1, DOME_DEFS[0].z);
    state.scene.add(armBox);

    // label marker (yellow box on top)
    var lblGeo = new THREE.BoxGeometry(3.1, 0.2, 2.1);
    var lblMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    var lbl = new THREE.Mesh(lblGeo, lblMat);
    lbl.position.set(DOME_DEFS[0].x + 8, 2.1, DOME_DEFS[0].z);
    state.scene.add(lbl);

    state.armoryPos = { x: DOME_DEFS[0].x + 8, z: DOME_DEFS[0].z };
  }

  // ── enemies ───────────────────────────────────────────────────────────────

  function buildEnemies() {
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x556677 });

    for (var i = 0; i < ENEMY_COUNT; i++) {
      var enemy = createEnemy(bodyMat, helmMat, false, i);
      state.enemies.push(enemy);
      state.scene.add(enemy.group);
    }

    // commander — placed in dome 2
    var cmdBodyMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var cmdHelmMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
    var commander = createEnemy(cmdBodyMat, cmdHelmMat, true, 0);
    commander.isCommander = true;
    commander.hp = COMMANDER_HP;
    commander.group.position.set(DOME_DEFS[2].x, 0, DOME_DEFS[2].z + 5);
    state.enemies.push(commander);
    state.commanderMesh = commander.group;
    state.scene.add(commander.group);
  }

  function createEnemy(bodyMat, helmMat, isCommander, idx) {
    var group = new THREE.Object3D();

    // body
    var bodyGeo = new THREE.BoxGeometry(1.0, 1.4, 0.6);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    group.add(body);

    // head/helmet (sphere)
    var helmGeo = new THREE.SphereGeometry(0.45, 8, 8);
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 2.6;
    group.add(helm);

    // legs
    var legGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
    var legL = new THREE.Mesh(legGeo, bodyMat);
    legL.position.set(-0.25, 0.45, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, bodyMat);
    legR.position.set(0.25, 0.45, 0);
    group.add(legR);

    // commander has bigger scale
    if (isCommander) {
      group.scale.setScalar(1.4);
    }

    // spawn position — spread around the base
    var angle = (idx / ENEMY_COUNT) * Math.PI * 2;
    var r = 20 + Math.random() * 40;
    var domeIdx = Math.floor(Math.random() * 3);
    var baseX = DOME_DEFS[domeIdx].x + Math.cos(angle) * r * 0.4;
    var baseZ = DOME_DEFS[domeIdx].z + Math.sin(angle) * r * 0.4;
    group.position.set(baseX, 0, baseZ);

    return {
      group: group,
      hp: ENEMY_HP,
      alive: true,
      isCommander: false,
      shootCd: Math.random() * ENEMY_SHOOT_CD,
      alertRange: 50,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolSpeed: 1.5 + Math.random()
    };
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'padding:8px 14px',
      'background:rgba(0,0,0,0.65)',
      'color:#00ff88',
      'font:bold 13px/1.6 monospace',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(state.hudEl);

    state.crosshairEl = document.createElement('div');
    state.crosshairEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00ff88',
      'font:20px monospace',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    state.crosshairEl.textContent = '+';
    document.body.appendChild(state.crosshairEl);

    state.overlayEl = document.createElement('div');
    state.overlayEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'background:rgba(0,0,0,0)',
      'color:#fff',
      'font:bold 28px monospace',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'text-align:center',
      'z-index:10000',
      'pointer-events:none',
      'transition:background 0.5s'
    ].join(';');
    document.body.appendChild(state.overlayEl);
  }

  function updateHUD() {
    if (!state.hudEl) return;

    var mins = Math.floor(state.reactorCountdown / 60);
    var secs = Math.floor(state.reactorCountdown % 60);
    var timer = state.reactorArmed
      ? (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs)
      : '--:--';

    var breachText = 'NONE';
    for (var i = 0; i < 3; i++) {
      if (state.domeBreach[i]) breachText = 'DOME ' + (i + 1);
    }

    var aliveCount = 0;
    for (var j = 0; j < state.enemies.length; j++) {
      if (state.enemies[j].alive && !state.enemies[j].isCommander) aliveCount++;
    }

    var weaponName = ['ASSAULT RIFLE', 'RAIL GUN', 'PLASMA CUTTER'][state.currentWeapon];

    state.hudEl.innerHTML =
      'MOONBASE ASSAULT &nbsp;|&nbsp; ' +
      '[DOMES CLEARED: ' + state.domesCleared + '/3] &nbsp; ' +
      '[COMMANDER: ' + (state.commanderAlive ? 'ALIVE' : '<span style="color:#ff4444">DEAD</span>') + '] &nbsp; ' +
      '[SATELLITE: ' + (state.satelliteAlive ? 'ACTIVE' : '<span style="color:#ff8800">DESTROYED</span>') + '] &nbsp; ' +
      '[REACTOR: ' + (state.reactorArmed ? '<span style="color:#ff2200">ARMED</span>' : 'N/A') + '] &nbsp; ' +
      '[VACUUM BREACH: ' + (breachText !== 'NONE' ? '<span style="color:#ff0000">' + breachText + '</span>' : 'NONE') + '] &nbsp; ' +
      '[TIMER: ' + timer + '] &nbsp; ' +
      '[COSMONAUTS: ' + aliveCount + '] &nbsp; ' +
      '[HP: ' + Math.max(0, Math.round(state.playerHP)) + '] &nbsp; ' +
      '[WEAPON: ' + weaponName + ']';
  }

  // ── gameplay ──────────────────────────────────────────────────────────────

  function tryPlantReactorCharge() {
    var rp = state.reactorMesh.position;
    var dx = state.playerPos.x - rp.x;
    var dz = state.playerPos.z - rp.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 8 && !state.reactorArmed && state.inDome === 2) {
      state.reactorCharging = true;
    }
  }

  function checkReactorCharge(dt) {
    if (!state.reactorCharging || state.reactorArmed) { state.reactorCharging = false; return; }
    // player must hold F continuously near reactor in dome 2
    var rp = state.reactorMesh.position;
    var dx = state.playerPos.x - rp.x;
    var dz = state.playerPos.z - rp.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (!state.keysDown[70] || dist > 8 || state.inDome !== 2) {
      state.reactorCharging = false;
      state.reactorChargingTimer = 0;
      return;
    }
    state.reactorChargingTimer += dt;
    if (state.reactorChargingTimer >= 3.0) {
      state.reactorArmed = true;
      state.reactorCharging = false;
      state.reactorChargingTimer = 0;
    }
  }

  function checkArmoryPickup() {
    if (state.railgunFound) return;
    var ap = state.armoryPos;
    var dx = state.playerPos.x - ap.x;
    var dz = state.playerPos.z - ap.z;
    if (Math.sqrt(dx * dx + dz * dz) < 4 && state.inDome === 0) {
      state.railgunFound = true;
      showMessage('RAILGUN ACQUIRED! Press 2 to equip.');
    }
  }

  function checkSatelliteDestroy() {
    if (!state.satelliteAlive) return;
    var sp = state.satellitePos;
    var dx = state.playerPos.x - sp.x;
    var dz = state.playerPos.z - sp.z;
    if (Math.sqrt(dx * dx + dz * dz) < 6 && state.currentWeapon === 2) {
      // plasma cutter used on satellite (E key)
      if (state.keysDown[69]) {
        state.satelliteAlive = false;
        state.reinforcementsActive = false;
        for (var i = 0; i < state.satelliteParts.length; i++) {
          state.satelliteParts[i].visible = false;
        }
        showMessage('SATELLITE DESTROYED! No more reinforcements!');
      }
    }
  }

  function checkVacuumBreachSeal(dt) {
    // E held near a breached dome seals it after 4 seconds
    if (!state.keysDown[69]) {
      state.domeSealing = -1;
      state.domeSealTimer = 0;
      return;
    }
    for (var i = 0; i < 3; i++) {
      if (!state.domeBreach[i]) continue;
      var def = DOME_DEFS[i];
      var dx = state.playerPos.x - def.x;
      var dz = state.playerPos.z - def.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < DOME_RADIUS + 2) {
        if (state.domeSealing === i) {
          state.domeSealTimer += dt;
          if (state.domeSealTimer >= SEAL_HOLD_TIME) {
            state.domeBreach[i] = false;
            state.domeSealing = -1;
            state.domeSealTimer = 0;
            showMessage('DOME ' + (i + 1) + ' BREACH SEALED!');
          }
        } else {
          state.domeSealing = i;
          state.domeSealTimer = 0;
        }
        return;
      }
    }
  }

  function checkDomeTransitions() {
    if (state.airlockTransition) return;

    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    var newDome = -1;
    for (var i = 0; i < DOME_DEFS.length; i++) {
      var def = DOME_DEFS[i];
      var dx = px - def.x;
      var dz = pz - def.z;
      if (Math.sqrt(dx * dx + dz * dz) < DOME_RADIUS - 1) {
        newDome = i;
        break;
      }
    }

    if (newDome !== state.inDome) {
      // entering or leaving a dome — start airlock transition
      state.airlockTransition = true;
      state.airlockTimer = 0;
      state.airlockToDome = newDome;
      // show overlay
      if (state.overlayEl) {
        state.overlayEl.style.background = 'rgba(0,80,120,0.7)';
        state.overlayEl.innerHTML = newDome >= 0
          ? 'AIRLOCK EQUALIZING...<br><small>DOME ' + DOME_DEFS[newDome].label + '</small>'
          : 'AIRLOCK EQUALIZING...<br><small>EXITING TO SURFACE</small>';
      }
    }
  }

  function updateAirlockTransition(dt) {
    if (!state.airlockTransition) return;
    state.airlockTimer += dt;
    if (state.airlockTimer >= AIRLOCK_ANIM_TIME) {
      state.airlockTransition = false;
      state.inDome = state.airlockToDome;
      if (state.overlayEl) {
        state.overlayEl.style.background = 'rgba(0,0,0,0)';
        state.overlayEl.innerHTML = '';
      }
    }
  }

  function updateVacuumHazards(dt) {
    for (var i = 0; i < 3; i++) {
      if (state.domeBreach[i] && state.inDome === i) {
        state.playerHP -= VACUUM_BREACH_DPS * dt;
      }
    }
  }

  function spawnBreach(x, z) {
    // find nearest dome and mark it breached
    var best = -1;
    var bestDist = 999;
    for (var i = 0; i < 3; i++) {
      var def = DOME_DEFS[i];
      var dx = x - def.x;
      var dz = z - def.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < DOME_RADIUS + 5 && dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best >= 0 && !state.domeBreach[best]) {
      state.domeBreach[best] = true;
      showMessage('WARNING: HULL BREACH IN DOME ' + (best + 1) + '! Atmosphere bleeding! Hold E near dome to seal!');
    }
  }

  function checkWinLose() {
    // LOSE conditions
    if (state.playerHP <= 0) {
      triggerGameOver('OPERATOR DOWN. MISSION FAILED.');
      return;
    }
    // all 3 domes breached simultaneously = death by vacuum
    if (state.domeBreach[0] && state.domeBreach[1] && state.domeBreach[2]) {
      triggerGameOver('TOTAL VACUUM EXPOSURE. MISSION FAILED.');
      return;
    }
    // reactor timer expired (detonated without escape)
    if (state.reactorArmed && state.reactorCountdown <= 0) {
      // check if on landing pad
      var lpx = state.playerPos.x - state.landingPadPos.x;
      var lpz = state.playerPos.z - state.landingPadPos.z;
      if (Math.sqrt(lpx * lpx + lpz * lpz) < 12) {
        triggerWin();
      } else {
        triggerGameOver('REACTOR DETONATED. YOU DIDN\'T ESCAPE IN TIME.');
      }
      return;
    }
    // WIN: commander dead + reactor armed + on landing pad
    if (!state.commanderAlive && state.reactorArmed) {
      var lpx2 = state.playerPos.x - state.landingPadPos.x;
      var lpz2 = state.playerPos.z - state.landingPadPos.z;
      if (Math.sqrt(lpx2 * lpx2 + lpz2 * lpz2) < 12) {
        triggerWin();
      }
    }
  }

  function triggerGameOver(msg) {
    if (state.gameOver || state.gameWon) return;
    state.gameOver = true;
    if (state.overlayEl) {
      state.overlayEl.style.background = 'rgba(120,0,0,0.85)';
      state.overlayEl.innerHTML = '<div style="color:#ff4444">MISSION FAILED</div><div style="font-size:18px;margin-top:12px">' + msg + '</div><div style="font-size:14px;margin-top:20px">Press ESC to exit</div>';
    }
  }

  function triggerWin() {
    if (state.gameOver || state.gameWon) return;
    state.gameWon = true;
    if (state.overlayEl) {
      state.overlayEl.style.background = 'rgba(0,60,0,0.85)';
      state.overlayEl.innerHTML = '<div style="color:#00ff88">MISSION COMPLETE</div><div style="font-size:18px;margin-top:12px">Commander neutralized. Reactor armed. Escaped from the moonbase.</div><div style="font-size:14px;margin-top:20px">Press ESC to exit</div>';
    }
  }

  function showMessage(msg) {
    if (!state.overlayEl || state.airlockTransition || state.gameOver || state.gameWon) return;
    state.overlayEl.innerHTML = '<div style="font-size:16px;background:rgba(0,0,0,0.7);padding:12px 20px;border:1px solid #00ff88">' + msg + '</div>';
    clearTimeout(state.msgTimeout);
    state.msgTimeout = setTimeout(function () {
      if (state.overlayEl && !state.airlockTransition && !state.gameOver && !state.gameWon) {
        state.overlayEl.innerHTML = '';
      }
    }, 3000);
  }

  // ── shooting ──────────────────────────────────────────────────────────────

  function shoot() {
    if (state.shootCooldown > 0) return;
    if (state.airlockTransition) return;

    if (state.currentWeapon === 0) {
      // assault rifle
      state.shootCooldown = 0.12;
      var hit = raycastEnemies(30, 20);
      if (hit) {
        damageEnemy(hit, 25);
        spawnImpactExplosion(hit.group.position.x, hit.group.position.y + 1.5, hit.group.position.z, 0.4);
      }
    } else if (state.currentWeapon === 1) {
      // railgun — 1 shot kill, beam visible
      state.shootCooldown = 2.0;
      fireRailgun();
    } else if (state.currentWeapon === 2) {
      // plasma cutter (short range melee)
      state.shootCooldown = 0.5;
      var hit2 = raycastEnemies(5, 40);
      if (hit2) {
        damageEnemy(hit2, 999);
        spawnImpactExplosion(hit2.group.position.x, hit2.group.position.y + 1.5, hit2.group.position.z, 1.0);
      }
    }
  }

  function fireRailgun() {
    var dir = getCameraDirection();
    var hit = raycastEnemies(500, 5);

    // create beam
    var beamPts = [];
    var startX = state.playerPos.x;
    var startY = state.playerPos.y + 1.5;
    var startZ = state.playerPos.z;
    beamPts.push(startX, startY, startZ);

    if (hit) {
      beamPts.push(hit.group.position.x, hit.group.position.y + 1.5, hit.group.position.z);
      damageEnemy(hit, 9999);
      spawnImpactExplosion(hit.group.position.x, hit.group.position.y + 1.5, hit.group.position.z, 1.5);
      // check if near dome for breach
      spawnBreach(hit.group.position.x, hit.group.position.z);
    } else {
      beamPts.push(
        startX + dir.x * 300,
        startY + dir.y * 300,
        startZ + dir.z * 300
      );
    }

    if (state.railgunBeam) {
      state.scene.remove(state.railgunBeam);
    }
    var beamGeo = new THREE.BufferGeometry();
    var positions = new Float32Array(beamPts);
    beamGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var beamMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 });
    state.railgunBeam = new THREE.LineSegments(beamGeo, beamMat);
    state.scene.add(state.railgunBeam);
    state.railgunBeamTimer = 0.5;
  }

  function getCameraDirection() {
    var yaw = state.playerYaw;
    var pitch = state.playerPitch;
    return {
      x: -Math.sin(yaw) * Math.cos(pitch),
      y: Math.sin(pitch),
      z: -Math.cos(yaw) * Math.cos(pitch)
    };
  }

  function raycastEnemies(maxDist, maxAngleDeg) {
    var dir = getCameraDirection();
    var px = state.playerPos.x;
    var py = state.playerPos.y + 1.5;
    var pz = state.playerPos.z;
    var best = null;
    var bestDist = maxDist;
    var cosMax = Math.cos((maxAngleDeg || 15) * Math.PI / 180);

    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.alive) continue;
      var ex = e.group.position.x - px;
      var ey = (e.group.position.y + 1.5) - py;
      var ez = e.group.position.z - pz;
      var dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
      if (dist > bestDist) continue;

      var dot = (ex * dir.x + ey * dir.y + ez * dir.z) / dist;
      if (dot < cosMax) continue;

      best = e;
      bestDist = dist;
    }
    return best;
  }

  function damageEnemy(enemy, dmg) {
    enemy.hp -= dmg;
    if (enemy.hp <= 0 && enemy.alive) {
      enemy.alive = false;
      enemy.group.visible = false;
      if (enemy.isCommander) {
        state.commanderAlive = false;
        showMessage('COMMANDER ELIMINATED! Now arm the reactor and escape!');
      }
      checkDomesCleared();
    }
  }

  function spawnImpactExplosion(x, y, z, size) {
    // visual flash using a scaling sphere
    var flashGeo = new THREE.SphereGeometry(size, 6, 6);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.9 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(x, y, z);
    state.scene.add(flash);
    var lifetime = 0.3;
    state.explosions = state.explosions || [];
    state.explosions.push({ mesh: flash, t: 0, lifetime: lifetime, size: size });
  }

  function checkDomesCleared() {
    var cleared = 0;
    for (var d = 0; d < 3; d++) {
      var domeEnemies = 0;
      var def = DOME_DEFS[d];
      for (var i = 0; i < state.enemies.length; i++) {
        var e = state.enemies[i];
        if (!e.alive) continue;
        var ex = e.group.position.x - def.x;
        var ez = e.group.position.z - def.z;
        if (Math.sqrt(ex * ex + ez * ez) < DOME_RADIUS + 20) domeEnemies++;
      }
      if (domeEnemies === 0) cleared++;
    }
    state.domesCleared = cleared;
  }

  // ── enemy AI ──────────────────────────────────────────────────────────────

  function updateEnemies(dt) {
    var px = state.playerPos.x;
    var py = state.playerPos.y;
    var pz = state.playerPos.z;

    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.alive) continue;

      var ex = e.group.position.x;
      var ez = e.group.position.z;
      var dx = px - ex;
      var dz = pz - ez;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // face player
      e.group.rotation.y = Math.atan2(dx, dz);

      if (dist < e.alertRange) {
        // move toward player
        var speed = e.isCommander ? 4 : 2.5;
        if (dist > 8) {
          e.group.position.x += (dx / dist) * speed * dt;
          e.group.position.z += (dz / dist) * speed * dt;
        }
        // shoot
        e.shootCd -= dt;
        if (e.shootCd <= 0 && dist < ENEMY_SHOOT_RANGE) {
          e.shootCd = e.isCommander ? COMMANDER_SHOOT_CD : ENEMY_SHOOT_CD;
          // accuracy check
          if (Math.random() < 0.45) {
            var dmg = e.isCommander ? COMMANDER_DMG : ENEMY_DMG;
            state.playerHP -= dmg;
          }
        }
      } else {
        // patrol
        e.patrolAngle += dt * 0.5;
        e.group.position.x += Math.cos(e.patrolAngle) * e.patrolSpeed * dt;
        e.group.position.z += Math.sin(e.patrolAngle) * e.patrolSpeed * dt;
      }
    }
  }

  function updateReinforcements(dt) {
    if (!state.reinforcementsActive) return;
    state.reinforcementTimer -= dt;
    if (state.reinforcementTimer <= 0) {
      state.reinforcementTimer = state.reinforcementInterval;
      spawnReinforcement();
    }
  }

  function spawnReinforcement() {
    // count alive enemies
    var alive = 0;
    for (var i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].alive && !state.enemies[i].isCommander) alive++;
    }
    if (alive >= 25) return;

    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var e = createEnemy(bodyMat, helmMat, false, alive);
    // spawn at edge of map
    var angle = Math.random() * Math.PI * 2;
    e.group.position.set(Math.cos(angle) * 180, 0, Math.sin(angle) * 180);
    e.alertRange = 80;
    state.enemies.push(e);
    state.scene.add(e.group);
  }

  // ── dust ──────────────────────────────────────────────────────────────────

  function updateDust(dt) {
    var moving = state.keysDown[87] || state.keysDown[83] || state.keysDown[65] || state.keysDown[68];
    if (moving && state.onGround) {
      // kick up a particle
      for (var i = 0; i < state.dustParticles.length; i++) {
        var p = state.dustParticles[i];
        if (!p.mesh.visible) {
          p.mesh.visible = true;
          p.mesh.position.set(
            state.playerPos.x + (Math.random() - 0.5) * 2,
            0.1,
            state.playerPos.z + (Math.random() - 0.5) * 2
          );
          p.vel.x = (Math.random() - 0.5) * 3;
          p.vel.y = Math.random() * 2;
          p.vel.z = (Math.random() - 0.5) * 3;
          p.life = 1.0 + Math.random();
          break;
        }
      }
    }

    for (var j = 0; j < state.dustParticles.length; j++) {
      var dp = state.dustParticles[j];
      if (!dp.mesh.visible) continue;
      dp.life -= dt;
      dp.vel.y -= 0.4 * dt; // low moon gravity
      dp.mesh.position.x += dp.vel.x * dt;
      dp.mesh.position.y += dp.vel.y * dt;
      dp.mesh.position.z += dp.vel.z * dt;
      dp.mesh.material.opacity = Math.max(0, dp.life * 0.6);
      if (dp.life <= 0 || dp.mesh.position.y < 0) {
        dp.mesh.visible = false;
      }
    }
  }

  // ── explosions ────────────────────────────────────────────────────────────

  function updateExplosions(dt) {
    if (!state.explosions) return;
    for (var i = state.explosions.length - 1; i >= 0; i--) {
      var ex = state.explosions[i];
      ex.t += dt;
      var p = ex.t / ex.lifetime;
      ex.mesh.scale.setScalar(1 + p * 3);
      ex.mesh.material.opacity = 1 - p;
      if (ex.t >= ex.lifetime) {
        state.scene.remove(ex.mesh);
        state.explosions.splice(i, 1);
      }
    }
  }

  // ── reactor ───────────────────────────────────────────────────────────────

  function updateReactor(dt) {
    if (!state.reactorMesh) return;
    state.reactorPulseT += dt * (state.reactorArmed ? 4 : 1.5);
    var pulse = 0.5 + 0.5 * Math.sin(state.reactorPulseT);
    if (state.reactorLight) {
      state.reactorLight.intensity = (state.reactorArmed ? 4 : 2.5) * pulse;
      state.reactorLight.color.setHex(state.reactorArmed ? 0xff4400 : 0x44ff88);
    }
    state.reactorMesh.material.color.setHex(state.reactorArmed ? 0xff4400 : 0x44ff88);
    state.reactorMesh.rotation.y += dt * 0.5;

    if (state.reactorArmed) {
      state.reactorCountdown -= dt;
      if (state.reactorCountdown < 0) state.reactorCountdown = 0;
    }
  }

  // ── railgun beam ──────────────────────────────────────────────────────────

  function updateRailgunBeam(dt) {
    if (!state.railgunBeam) return;
    state.railgunBeamTimer -= dt;
    if (state.railgunBeamTimer <= 0) {
      state.scene.remove(state.railgunBeam);
      state.railgunBeam = null;
    } else {
      state.railgunBeam.material.opacity = state.railgunBeamTimer / 0.5;
    }
  }

  // ── player movement ───────────────────────────────────────────────────────

  function updatePlayer(dt) {
    if (state.airlockTransition || state.gameOver || state.gameWon) return;

    var yaw = state.playerYaw;
    var fwdX = -Math.sin(yaw);
    var fwdZ = -Math.cos(yaw);
    var rightX = Math.cos(yaw);
    var rightZ = -Math.sin(yaw);

    var moveX = 0;
    var moveZ = 0;

    if (state.keysDown[87]) { moveX += fwdX; moveZ += fwdZ; }   // W
    if (state.keysDown[83]) { moveX -= fwdX; moveZ -= fwdZ; }   // S
    if (state.keysDown[65]) { moveX -= rightX; moveZ -= rightZ; } // A
    if (state.keysDown[68]) { moveX += rightX; moveZ += rightZ; } // D

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    state.playerVel.x += moveX * PLAYER_SPEED * dt * 3;
    state.playerVel.z += moveZ * PLAYER_SPEED * dt * 3;

    // gravity
    state.playerVel.y += GRAVITY * dt;

    // drag — floatier on moon
    var drag = state.onGround ? DRAG_GROUND : DRAG_AIR;
    state.playerVel.x *= Math.pow(drag, dt * 60);
    state.playerVel.z *= Math.pow(drag, dt * 60);

    // integrate
    state.playerPos.x += state.playerVel.x * dt;
    state.playerPos.y += state.playerVel.y * dt;
    state.playerPos.z += state.playerVel.z * dt;

    // ground collision
    if (state.playerPos.y < PLAYER_HEIGHT) {
      state.playerPos.y = PLAYER_HEIGHT;
      state.playerVel.y = 0;
      state.onGround = true;
    } else {
      state.onGround = false;
    }

    // bounds
    if (state.playerPos.x > 240) state.playerPos.x = 240;
    if (state.playerPos.x < -240) state.playerPos.x = -240;
    if (state.playerPos.z > 240) state.playerPos.z = 240;
    if (state.playerPos.z < -240) state.playerPos.z = -240;

    // camera
    state.camera.position.set(
      state.playerPos.x,
      state.playerPos.y + 0.6,
      state.playerPos.z
    );
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;

    // shooting
    if (state.mouseButtons[0]) shoot();
    if (state.shootCooldown > 0) state.shootCooldown -= dt;

    // checks
    checkDomeTransitions();
    checkArmoryPickup();
    checkSatelliteDestroy();
    checkVacuumBreachSeal(dt);
    checkReactorCharge(dt);
    checkWinLose();
  }

  // ── animation loop ────────────────────────────────────────────────────────

  function animate(ts) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var now = ts / 1000;
    var dt = Math.min(now - state.lastTime, 0.1);
    state.lastTime = now;
    if (dt <= 0) return;

    if (!state.gameOver && !state.gameWon) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateReinforcements(dt);
      updateAirlockTransition(dt);
      updateVacuumHazards(dt);
      updateDust(dt);
      updateReactor(dt);
      updateRailgunBeam(dt);
      updateExplosions(dt);
      updateHUD();
    }

    state.renderer.render(state.scene, state.camera);
  }

  // ── init / destroy / reset ────────────────────────────────────────────────

  function resetState() {
    state.playerPos = { x: 0, y: PLAYER_HEIGHT, z: 80 };
    state.playerVel = { x: 0, y: 0, z: 0 };
    state.playerHP = PLAYER_MAX_HP;
    state.playerYaw = Math.PI;
    state.playerPitch = 0;
    state.onGround = false;
    state.keysDown = {};
    state.keyTimes = {};
    state.mouseButtons = {};
    state.pointerLocked = false;
    state.currentWeapon = 0;
    state.shootCooldown = 0;
    state.railgunBeam = null;
    state.railgunBeamTimer = 0;
    state.railgunFound = false;
    state.enemies = [];
    state.commanderMesh = null;
    state.commanderHP = COMMANDER_HP;
    state.commanderAlive = true;
    state.commanderShootCd = 0;
    state.domeMeshes = [];
    state.domesCleared = 0;
    state.domeBreach = [false, false, false];
    state.domeSealing = -1;
    state.domeSealTimer = 0;
    state.inDome = -1;
    state.airlockTransition = false;
    state.airlockTimer = 0;
    state.airlockToDome = -1;
    state.satelliteAlive = true;
    state.satelliteMesh = null;
    state.satelliteParts = [];
    state.reinforcementsActive = true;
    state.reinforcementTimer = state.reinforcementInterval;
    state.reactorMesh = null;
    state.reactorLight = null;
    state.reactorArmed = false;
    state.reactorCountdown = REACTOR_COUNTDOWN;
    state.reactorChargingTimer = 0;
    state.reactorCharging = false;
    state.reactorPulseT = 0;
    state.dustParticles = [];
    state.objects = [];
    state.explosions = [];
    state.gameOver = false;
    state.gameWon = false;
    state.lastTime = 0;
    state.animFrameId = null;
    state.msgTimeout = null;
    state.armoryPos = { x: 0, z: 0 };
    state.satellitePos = { x: 0, y: 0, z: 0 };
  }

  function init() {
    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[MoonbaseAssault] THREE.js not found');
      state.active = false;
      return;
    }

    resetState();
    setupScene();
    buildEnvironment();
    buildMoonbase();
    buildEnemies();
    buildHUD();
    bindEvents();
    animate(0);
  }

  function destroy() {
    if (!state.active) return;
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer) {
      if (state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    if (state.crosshairEl && state.crosshairEl.parentNode) {
      state.crosshairEl.parentNode.removeChild(state.crosshairEl);
      state.crosshairEl = null;
    }
    if (state.overlayEl && state.overlayEl.parentNode) {
      state.overlayEl.parentNode.removeChild(state.overlayEl);
      state.overlayEl = null;
    }
    if (state.msgTimeout) {
      clearTimeout(state.msgTimeout);
      state.msgTimeout = null;
    }
    unbindEvents();
  }

  function reset() {
    destroy();
    init();
  }

  // ── global key listener for activation ────────────────────────────────────

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    var now = Date.now();
    if (!state.active) {
      // track key timing for activation even before init
      if (!state._gKeyTimes) state._gKeyTimes = {};
      if (!state._gKeysDown) state._gKeysDown = {};
      if (!state._gKeysDown[k]) state._gKeyTimes[k] = now;
      state._gKeysDown[k] = true;

      if (k === ACTIVATION_KEY_B && state._gKeysDown[ACTIVATION_KEY_M]) {
        var t = state._gKeyTimes[ACTIVATION_KEY_M] || 0;
        if (now - t <= ACTIVATION_WINDOW) init();
      } else if (k === ACTIVATION_KEY_M && state._gKeysDown[ACTIVATION_KEY_B]) {
        var t2 = state._gKeyTimes[ACTIVATION_KEY_B] || 0;
        if (now - t2 <= ACTIVATION_WINDOW) init();
      }
    }
  });

  document.addEventListener('keyup', function (e) {
    if (!state.active && state._gKeysDown) {
      state._gKeysDown[e.keyCode] = false;
    }
  });

  return { init: init, update: animate, reset: reset };

})();
