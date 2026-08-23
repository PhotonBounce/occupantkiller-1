window.MoonBase = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'MoonBase';
  var ACTIVATION_KEY_M = 77;
  var ACTIVATION_KEY_B = 66;
  var ACTIVATION_WINDOW = 400;

  var GRAVITY = -1.6;
  var DRAG = 0.94;
  var JUMP_FORCE = 6.0;
  var PLAYER_MAX_HP = 100;
  var SUIT_MAX_INTEGRITY = 100;
  var O2_SUPPLY_SECONDS = 300;
  var O2_DRAIN_OUTSIDE = 1.5;
  var VACUUM_DAMAGE_PER_SEC = 3;
  var SUIT_DAMAGE_PER_HIT = 5;
  var REACTOR_DEFEND_TIME = 240;
  var EVAC_TIME = 180;
  var ENEMY_COUNT = 8;
  var CRATER_COUNT = 20;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    playerPos: { x: 0, y: 2, z: 20 },
    playerVel: { x: 0, y: 0, z: 0 },
    playerHP: PLAYER_MAX_HP,
    suitIntegrity: SUIT_MAX_INTEGRITY,
    o2Seconds: O2_SUPPLY_SECONDS,
    insideBase: false,
    spaceHeld: false,
    hangTimer: 0,
    onGround: false,
    reactorSabotaged: false,
    reactorDefendTimer: REACTOR_DEFEND_TIME,
    evacTimer: EVAC_TIME,
    missionComplete: false,
    gameOver: false,
    lastTime: 0,
    animFrameId: null,
    objects: [],
    craters: [],
    enemies: [],
    dustParticles: [],
    grenades: [],
    grappleLine: null,
    grappleActive: false,
    grappleTarget: { x: 0, y: 0, z: 0 },
    grappleAttached: false,
    reactorMesh: null,
    reactorPulseT: 0,
    maintenanceMesh: null,
    o2RefillMeshes: [],
    hudEl: null,
    hudInterval: null,
    keysDown: {},
    keyTimes: {}
  };

  // ── key helpers ───────────────────────────────────────────────────────────

  function onKeyDown(e) {
    var k = e.keyCode;
    var now = Date.now();
    if (!state.keysDown[k]) {
      state.keyTimes[k] = now;
    }
    state.keysDown[k] = true;

    // This listener is bound for the whole page lifetime so the M+B activation
    // combo works from anywhere. Everything below it touches state.scene, which
    // only exists while the module is running, so bail out until then.
    if (!state.active || !state.scene) { checkActivationCombo(k, now); return; }

    if (k === 32) { // SPACE
      state.spaceHeld = true;
      if (state.onGround) {
        state.playerVel.y = JUMP_FORCE;
        state.onGround = false;
      }
    }

    // G = grapple
    if (k === 71 && !state.grappleActive) {
      fireGrapple();
    }

    // E = repair at maintenance station
    if (k === 69) {
      tryRepair();
    }

    // Grenade = R (simple throw forward)
    if (k === 82) {
      throwGrenade();
    }

    // Check M+B activation
    checkActivationCombo(k, now);
  }

  function onKeyUp(e) {
    var k = e.keyCode;
    state.keysDown[k] = false;
    if (!state.active || !state.scene) return;
    if (k === 32) {
      state.spaceHeld = false;
      state.hangTimer = 0;
    }
    if (k === 71) {
      releaseGrapple();
    }
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
    // Also allow escape to destroy
    if (k === 27) { destroy(); }
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function unbindKeys() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  }

  // ── init / destroy ────────────────────────────────────────────────────────

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[MoonBase] THREE.js not found');
      return;
    }

    resetState();
    setupScene();
    buildEnvironment();
    buildLunarBase();
    buildCraters();
    buildSolarArrays();
    buildCommDish();
    buildMaintenanceStation();
    buildO2RefillStations();
    buildReactor();
    buildEnemies();
    buildHUD();
    bindKeys();
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
    if (state.hudInterval) {
      clearInterval(state.hudInterval);
      state.hudInterval = null;
    }
    unbindKeys();

    state.objects = [];
    state.craters = [];
    state.enemies = [];
    state.dustParticles = [];
    state.grenades = [];
    state.grappleLine = null;
    state.scene = null;
    state.camera = null;
  }

  function resetState() {
    state.playerPos = { x: 0, y: 2, z: 20 };
    state.playerVel = { x: 0, y: 0, z: 0 };
    state.playerHP = PLAYER_MAX_HP;
    state.suitIntegrity = SUIT_MAX_INTEGRITY;
    state.o2Seconds = O2_SUPPLY_SECONDS;
    state.insideBase = false;
    state.spaceHeld = false;
    state.hangTimer = 0;
    state.onGround = false;
    state.reactorSabotaged = false;
    state.reactorDefendTimer = REACTOR_DEFEND_TIME;
    state.evacTimer = EVAC_TIME;
    state.missionComplete = false;
    state.gameOver = false;
    state.lastTime = 0;
    state.animFrameId = null;
    state.objects = [];
    state.craters = [];
    state.enemies = [];
    state.dustParticles = [];
    state.grenades = [];
    state.grappleLine = null;
    state.grappleActive = false;
    state.grappleAttached = false;
    state.keysDown = {};
    state.keyTimes = {};
  }

  // ── scene setup ───────────────────────────────────────────────────────────

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x000011);
    // No fog on the moon

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 1000);
    state.camera.position.set(0, 4, 22);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = false;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    // Ambient dim starlight
    var ambient = new THREE.AmbientLight(0x111122, 0.3);
    state.scene.add(ambient);

    // Earth-direction blue-white light from "north"
    var earthLight = new THREE.PointLight(0x4466AA, 1.8, 300);
    earthLight.position.set(0, 80, -120);
    state.scene.add(earthLight);

    // Subtle fill from above
    var sunLight = new THREE.DirectionalLight(0xFFFFEE, 0.6);
    sunLight.position.set(60, 80, 40);
    state.scene.add(sunLight);
  }

  function makeMesh(geo, mat, x, y, z) {
    var mesh = new THREE.Mesh(geo, mat);
    if (x !== undefined) mesh.position.set(x, y, z);
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
  }

  // ── environment ───────────────────────────────────────────────────────────

  function buildEnvironment() {
    // Regolith ground
    var groundGeo = new THREE.BoxGeometry(400, 1, 400);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.5, 0);
    state.scene.add(ground);
    state.objects.push(ground);
    state.ground = ground;
  }

  function buildCraters() {
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var i, r, cx, cz, sphere, box;

    for (i = 0; i < CRATER_COUNT; i++) {
      r = 3 + Math.random() * 5; // radius 3-8
      cx = (Math.random() - 0.5) * 160;
      cz = (Math.random() - 0.5) * 160;

      // Keep clear of base center
      if (Math.abs(cx) < 20 && Math.abs(cz) < 20) {
        cx += cx >= 0 ? 25 : -25;
      }

      // Sphere crater
      sphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 8, 6),
        craterMat
      );
      sphere.position.set(cx, -r * 0.6, cz);
      state.scene.add(sphere);
      state.objects.push(sphere);
      state.craters.push(sphere);

      // Rim box
      box = new THREE.Mesh(
        new THREE.BoxGeometry(r * 2.2, 0.5, r * 2.2),
        craterMat
      );
      box.position.set(cx, 0.1, cz);
      state.scene.add(box);
      state.objects.push(box);
    }
  }

  // ── lunar base ────────────────────────────────────────────────────────────

  function buildLunarBase() {
    var habitatMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var airlockMat = new THREE.MeshLambertMaterial({ color: 0x556677 });

    // 4 habitat modules
    var habDefs = [
      { x: 0,   y: 2, z: 0   },
      { x: 14,  y: 2, z: 0   },
      { x: -14, y: 2, z: 0   },
      { x: 0,   y: 2, z: -14 }
    ];

    var i, hd, hab;
    for (i = 0; i < habDefs.length; i++) {
      hd = habDefs[i];
      hab = makeMesh(
        new THREE.BoxGeometry(8, 4, 8),
        habitatMat,
        hd.x, hd.y, hd.z
      );
      hab.userData.isHabitat = true;
      hab.userData.index = i;
    }

    // Airlocks connecting habitats (horizontal corridors between them)
    var alDefs = [
      // between center (0,0) and right (14,0)
      { x: 7,   y: 2, z: 0,    w: 6,  h: 2, d: 3 },
      // between center (0,0) and left (-14,0)
      { x: -7,  y: 2, z: 0,    w: 6,  h: 2, d: 3 },
      // between center (0,0) and rear (0,-14)
      { x: 0,   y: 2, z: -7,   w: 3,  h: 2, d: 6 }
    ];

    var al;
    for (i = 0; i < alDefs.length; i++) {
      al = alDefs[i];
      makeMesh(
        new THREE.BoxGeometry(al.w, al.h, al.d),
        airlockMat,
        al.x, al.y, al.z
      );
    }
  }

  // ── solar arrays ──────────────────────────────────────────────────────────

  function buildSolarArrays() {
    var panelMat = new THREE.MeshLambertMaterial({ color: 0x334488 });
    var poleMat  = new THREE.MeshLambertMaterial({ color: 0x888899 });

    var arrayDefs = [
      { x: 22,  z: 12 },
      { x: -22, z: 12 },
      { x: 22,  z: -12 },
      { x: -22, z: -12 }
    ];

    var i, ad;
    for (i = 0; i < arrayDefs.length; i++) {
      ad = arrayDefs[i];

      // Pole
      makeMesh(
        new THREE.CylinderGeometry(0.15, 0.15, 5, 6),
        poleMat,
        ad.x, 2.5, ad.z
      );

      // Panel (thin box)
      makeMesh(
        new THREE.BoxGeometry(6, 0.15, 3),
        panelMat,
        ad.x, 5.5, ad.z
      );
    }
  }

  // ── communication dish ────────────────────────────────────────────────────

  function buildCommDish() {
    var dishMat  = new THREE.MeshLambertMaterial({ color: 0x889988 });
    var poleMat  = new THREE.MeshLambertMaterial({ color: 0x888899 });

    // Pole
    makeMesh(
      new THREE.CylinderGeometry(0.2, 0.2, 6, 8),
      poleMat,
      20, 3, -20
    );

    // Cone dish (open end up)
    makeMesh(
      new THREE.ConeGeometry(3, 2, 12),
      dishMat,
      20, 7.5, -20
    );
  }

  // ── maintenance station ───────────────────────────────────────────────────

  function buildMaintenanceStation() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x446644 });
    var mesh = makeMesh(
      new THREE.BoxGeometry(2, 2, 2),
      mat,
      -16, 1, 6
    );
    mesh.userData.isMaintenanceStation = true;
    state.maintenanceMesh = mesh;
  }

  // ── O2 refill stations ────────────────────────────────────────────────────

  function buildO2RefillStations() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x00BBFF });

    var positions = [
      { x: -2,  y: 1, z: 2  },
      { x: 12,  y: 1, z: 2  },
      { x: -12, y: 1, z: 2  },
      { x: 2,   y: 1, z: -12 },
      { x: 0,   y: 1, z: -2 }
    ];

    var i, pos, mesh;
    for (i = 0; i < positions.length; i++) {
      pos = positions[i];
      mesh = makeMesh(
        new THREE.BoxGeometry(1, 2, 1),
        mat,
        pos.x, pos.y, pos.z
      );
      mesh.userData.isO2Refill = true;
      state.o2RefillMeshes.push(mesh);
    }
  }

  // ── reactor ───────────────────────────────────────────────────────────────

  function buildReactor() {
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
    var mesh = makeMesh(
      new THREE.BoxGeometry(3, 3, 3),
      mat,
      0, 2, -14
    );
    mesh.userData.isReactor = true;
    state.reactorMesh = mesh;
    state.reactorLight = new THREE.PointLight(0xFF2200, 1.2, 20);
    state.reactorLight.position.set(0, 4, -14);
    state.scene.add(state.reactorLight);
  }

  // ── enemy soldiers ────────────────────────────────────────────────────────

  function buildEnemies() {
    var bodyMat    = new THREE.MeshLambertMaterial({ color: 0x441A00 });
    var thrustMat  = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var i, ex, ez, body, thrusterL, thrusterR, grp;
    for (i = 0; i < ENEMY_COUNT; i++) {
      ex = (Math.random() - 0.5) * 80;
      ez = (Math.random() - 0.5) * 80;

      // Group-like object via pivot mesh
      body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        bodyMat
      );
      body.position.set(ex, 4, ez);

      thrusterL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.15, 1, 6),
        thrustMat
      );
      thrusterL.position.set(-0.7, -0.5, 0);
      body.add(thrusterL);

      thrusterR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.15, 1, 6),
        thrustMat
      );
      thrusterR.position.set(0.7, -0.5, 0);
      body.add(thrusterR);

      state.scene.add(body);
      state.objects.push(body);

      state.enemies.push({
        mesh: body,
        hp: 30,
        alive: true,
        pos: { x: ex, y: 4, z: ez },
        vel: { x: 0, y: 0, z: 0 },
        hoverY: 4,
        shootTimer: 1 + Math.random() * 2,
        ballistic: false
      });
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    var el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '16px';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.textAlign = 'center';
    el.style.color = '#00FF88';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '14px';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.textShadow = '0 0 6px #00FF88';
    document.body.appendChild(el);
    state.hudEl = el;

    state.hudInterval = setInterval(updateHUD, 250);
    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;

    var suitPct = Math.max(0, Math.round(state.suitIntegrity));
    var o2Min   = Math.floor(state.o2Seconds / 60);
    var o2Sec   = Math.floor(state.o2Seconds % 60);
    var o2Str   = (o2Min < 10 ? '0' : '') + o2Min + ':' + (o2Sec < 10 ? '0' : '') + o2Sec;

    var reactorStr = state.reactorSabotaged ? 'SABOTAGED' : 'SECURE';
    var aliveCount = 0;
    var i;
    for (i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].alive) aliveCount++;
    }

    var missionStr = '';
    if (state.missionComplete) {
      missionStr = ' | MISSION COMPLETE';
    } else if (state.reactorSabotaged) {
      var em = Math.floor(state.evacTimer / 60);
      var es = Math.floor(state.evacTimer % 60);
      missionStr = ' | EVACUATE: ' + (em < 10 ? '0' : '') + em + ':' + (es < 10 ? '0' : '') + es;
    } else {
      var dm = Math.floor(state.reactorDefendTimer / 60);
      var ds = Math.floor(state.reactorDefendTimer % 60);
      missionStr = ' | DEFEND: ' + (dm < 10 ? '0' : '') + dm + ':' + (ds < 10 ? '0' : '') + ds;
    }

    state.hudEl.textContent =
      'MOON BASE' +
      ' [SUIT: ' + suitPct + '%]' +
      ' [O2: ' + o2Str + ']' +
      ' [REACTOR: ' + reactorStr + ']' +
      ' [ENEMIES: ' + aliveCount + ']' +
      ' | GRAVITY: 1.6m/s²' +
      missionStr;

    if (state.gameOver) {
      state.hudEl.textContent = 'GAME OVER — PRESS ESC TO EXIT';
      state.hudEl.style.color = '#FF2200';
    }
    if (state.missionComplete) {
      state.hudEl.style.color = '#FFFF00';
    }
  }

  // ── grapple gun ───────────────────────────────────────────────────────────

  function fireGrapple() {
    if (state.grappleActive) return;
    state.grappleActive = true;
    state.grappleAttached = false;

    // Aim at a surface 20 units in front of camera direction
    var target = {
      x: state.playerPos.x,
      y: state.playerPos.y + 8,
      z: state.playerPos.z - 20
    };
    state.grappleTarget = target;

    // Build LineSegments
    var points = [
      new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z),
      new THREE.Vector3(target.x, target.y, target.z)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
    var line = new THREE.LineSegments(geo, mat);
    state.scene.add(line);
    state.grappleLine = line;

    // Simulate attaching after a short delay (immediate for gameplay)
    state.grappleAttached = true;
  }

  function releaseGrapple() {
    state.grappleActive = false;
    state.grappleAttached = false;
    if (state.grappleLine) {
      state.scene.remove(state.grappleLine);
      if (state.grappleLine.geometry) state.grappleLine.geometry.dispose();
      state.grappleLine = null;
    }
  }

  function updateGrapple(dt) {
    if (!state.grappleActive || !state.grappleAttached) return;

    // Pull player toward grapple target
    var dx = state.grappleTarget.x - state.playerPos.x;
    var dy = state.grappleTarget.y - state.playerPos.y;
    var dz = state.grappleTarget.z - state.playerPos.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 1.5) {
      var pullSpeed = 12;
      state.playerVel.x += (dx / dist) * pullSpeed * dt;
      state.playerVel.y += (dy / dist) * pullSpeed * dt;
      state.playerVel.z += (dz / dist) * pullSpeed * dt;
    }

    // Update line geometry
    if (state.grappleLine) {
      var points = [
        new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z),
        new THREE.Vector3(state.grappleTarget.x, state.grappleTarget.y, state.grappleTarget.z)
      ];
      state.grappleLine.geometry.setFromPoints(points);
    }
  }

  // ── grenade ───────────────────────────────────────────────────────────────

  function throwGrenade() {
    var geo = new THREE.SphereGeometry(0.3, 6, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x665500 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.scene.add(mesh);

    state.grenades.push({
      mesh: mesh,
      vel: { x: (Math.random() - 0.5) * 4, y: 8, z: -12 },
      timer: 2.5,
      exploded: false
    });
  }

  function spawnDust(x, y, z) {
    var mat = new THREE.MeshLambertMaterial({ color: 0xAAAA99 });
    var count = 6 + Math.floor(Math.random() * 6);
    var i, mesh;
    for (i = 0; i < count; i++) {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        mat
      );
      mesh.position.set(x, y, z);
      state.scene.add(mesh);
      state.dustParticles.push({
        mesh: mesh,
        vel: {
          x: (Math.random() - 0.5) * 3,
          y: 1 + Math.random() * 4,
          z: (Math.random() - 0.5) * 3
        },
        life: 3 + Math.random() * 2
      });
    }
  }

  function explodeGrenade(g) {
    g.exploded = true;
    var gx = g.mesh.position.x;
    var gy = g.mesh.position.y;
    var gz = g.mesh.position.z;

    // Knock nearby enemies into ballistic arcs
    var i, en, dx, dy, dz, dist;
    for (i = 0; i < state.enemies.length; i++) {
      en = state.enemies[i];
      if (!en.alive) continue;
      dx = en.pos.x - gx;
      dy = en.pos.y - gy;
      dz = en.pos.z - gz;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 12) {
        var force = (12 - dist) / 12 * 15;
        en.vel.x += (dx / dist) * force;
        en.vel.y += Math.abs(dy / dist) * force + 4;
        en.vel.z += (dz / dist) * force;
        en.ballistic = true;
        en.hp -= 15;
        if (en.hp <= 0) killEnemy(en);
      }
    }

    // Dust near regolith
    if (gy < 3) {
      spawnDust(gx, 0.5, gz);
    }

    state.scene.remove(g.mesh);
  }

  function updateGrenades(dt) {
    var i, g;
    for (i = state.grenades.length - 1; i >= 0; i--) {
      g = state.grenades[i];
      if (g.exploded) {
        state.grenades.splice(i, 1);
        continue;
      }
      g.vel.y += GRAVITY * dt;
      g.mesh.position.x += g.vel.x * dt;
      g.mesh.position.y += g.vel.y * dt;
      g.mesh.position.z += g.vel.z * dt;

      if (g.mesh.position.y <= 0.3) {
        g.mesh.position.y = 0.3;
        g.vel.y = -g.vel.y * 0.3;
        spawnDust(g.mesh.position.x, 0.5, g.mesh.position.z);
      }

      g.timer -= dt;
      if (g.timer <= 0) {
        explodeGrenade(g);
        state.grenades.splice(i, 1);
      }
    }
  }

  // ── enemy AI ──────────────────────────────────────────────────────────────

  function killEnemy(en) {
    en.alive = false;
    if (en.mesh) {
      state.scene.remove(en.mesh);
    }
  }

  function updateEnemies(dt) {
    var i, en, dx, dz, dist;
    for (i = 0; i < state.enemies.length; i++) {
      en = state.enemies[i];
      if (!en.alive) continue;

      if (en.ballistic) {
        // Physics arc
        en.vel.y += GRAVITY * dt;
        en.pos.x += en.vel.x * dt;
        en.pos.y += en.vel.y * dt;
        en.pos.z += en.vel.z * dt;

        if (en.pos.y <= 1) {
          en.pos.y = 1;
          en.vel.y = -en.vel.y * 0.2;
          en.vel.x *= 0.7;
          en.vel.z *= 0.7;
          if (Math.abs(en.vel.y) < 0.5) en.ballistic = false;
        }

        en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
        continue;
      }

      // Hover at y=4
      var targetY = en.hoverY;
      en.pos.y += (targetY - en.pos.y) * 2 * dt;

      // Move toward player slowly
      dx = state.playerPos.x - en.pos.x;
      dz = state.playerPos.z - en.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 8 && dist < 60) {
        en.pos.x += (dx / dist) * 3 * dt;
        en.pos.z += (dz / dist) * 3 * dt;
      }

      // Shoot timer
      en.shootTimer -= dt;
      if (en.shootTimer <= 0) {
        en.shootTimer = 1.5 + Math.random() * 2;
        if (dist < 30) {
          enemyShoot(en);
        }
      }

      // Try to sabotage reactor if near
      var rx = 0, ry = 2, rz = -14;
      var rdx = rx - en.pos.x, rdy = 0, rdz = rz - en.pos.z;
      var rdist = Math.sqrt(rdx * rdx + rdz * rdz);
      if (rdist < 5 && !state.reactorSabotaged) {
        state.reactorSabotaged = true;
        if (state.reactorLight) {
          state.reactorLight.color.setHex(0x884400);
        }
        if (state.reactorMesh) {
          state.reactorMesh.material.color.setHex(0x884400);
        }
      }

      en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
    }
  }

  function enemyShoot(en) {
    // Damage player suit if in range
    var dx = state.playerPos.x - en.pos.x;
    var dy = state.playerPos.y - en.pos.y;
    var dz = state.playerPos.z - en.pos.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < 20) {
      state.suitIntegrity -= SUIT_DAMAGE_PER_HIT;
      if (state.suitIntegrity < 0) state.suitIntegrity = 0;
    }
  }

  // ── player movement ───────────────────────────────────────────────────────

  function updatePlayer(dt) {
    var speed = 8;
    var accel = { x: 0, z: 0 };

    if (state.keysDown[87] || state.keysDown[38]) accel.z -= speed; // W / Up
    if (state.keysDown[83] || state.keysDown[40]) accel.z += speed; // S / Down
    if (state.keysDown[65] || state.keysDown[37]) accel.x -= speed; // A / Left
    if (state.keysDown[68] || state.keysDown[39]) accel.x += speed; // D / Right

    state.playerVel.x += accel.x * dt;
    state.playerVel.z += accel.z * dt;

    // Gravity
    if (!state.onGround) {
      // Hang time — holding SPACE in the air extends hang
      if (state.spaceHeld && state.playerVel.y > 0) {
        state.playerVel.y += GRAVITY * 0.3 * dt;
      } else {
        state.playerVel.y += GRAVITY * dt;
      }
    }

    // Floaty drag (moon low-gravity feel)
    state.playerVel.x *= Math.pow(DRAG, dt * 60);
    state.playerVel.z *= Math.pow(DRAG, dt * 60);

    state.playerPos.x += state.playerVel.x * dt;
    state.playerPos.y += state.playerVel.y * dt;
    state.playerPos.z += state.playerVel.z * dt;

    // Ground clamp
    if (state.playerPos.y <= 1) {
      state.playerPos.y = 1;
      state.playerVel.y = 0;
      state.onGround = true;
    } else {
      state.onGround = false;
    }

    // Clamp world bounds
    if (state.playerPos.x < -190) state.playerPos.x = -190;
    if (state.playerPos.x >  190) state.playerPos.x =  190;
    if (state.playerPos.z < -190) state.playerPos.z = -190;
    if (state.playerPos.z >  190) state.playerPos.z =  190;
  }

  // ── proximity checks ──────────────────────────────────────────────────────

  function checkInsideBase() {
    var px = state.playerPos.x;
    var py = state.playerPos.y;
    var pz = state.playerPos.z;

    // Rough bounding check for habitat modules
    var habDefs = [
      { x: 0,   z: 0   },
      { x: 14,  z: 0   },
      { x: -14, z: 0   },
      { x: 0,   z: -14 }
    ];

    var i, hd, dx, dz;
    for (i = 0; i < habDefs.length; i++) {
      hd = habDefs[i];
      dx = px - hd.x;
      dz = pz - hd.z;
      if (Math.abs(dx) < 5 && Math.abs(dz) < 5 && py < 5) {
        state.insideBase = true;
        return;
      }
    }
    state.insideBase = false;
  }

  function tryRepair() {
    if (!state.maintenanceMesh) return;
    var dx = state.playerPos.x - state.maintenanceMesh.position.x;
    var dz = state.playerPos.z - state.maintenanceMesh.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 4) {
      state.suitIntegrity = Math.min(SUIT_MAX_INTEGRITY, state.suitIntegrity + 25);
    }
  }

  function checkO2Refill() {
    var i, m, dx, dz, dist;
    for (i = 0; i < state.o2RefillMeshes.length; i++) {
      m = state.o2RefillMeshes[i];
      dx = state.playerPos.x - m.position.x;
      dz = state.playerPos.z - m.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3) {
        state.o2Seconds = O2_SUPPLY_SECONDS;
        return;
      }
    }
  }

  // ── dust particles ────────────────────────────────────────────────────────

  function updateDust(dt) {
    var i, d;
    for (i = state.dustParticles.length - 1; i >= 0; i--) {
      d = state.dustParticles[i];
      d.vel.y += GRAVITY * 0.3 * dt; // light dust, slow fall
      d.mesh.position.x += d.vel.x * dt;
      d.mesh.position.y += d.vel.y * dt;
      d.mesh.position.z += d.vel.z * dt;
      d.life -= dt;

      if (d.mesh.position.y <= 0.15) {
        d.mesh.position.y = 0.15;
        d.vel.y *= -0.1;
      }

      if (d.life <= 0) {
        state.scene.remove(d.mesh);
        state.dustParticles.splice(i, 1);
      }
    }
  }

  // ── reactor pulse ─────────────────────────────────────────────────────────

  function updateReactor(dt) {
    if (!state.reactorMesh) return;
    state.reactorPulseT += dt * 2;
    var pulse = 0.7 + 0.3 * Math.abs(Math.sin(state.reactorPulseT));
    if (state.reactorLight) {
      state.reactorLight.intensity = pulse * 1.5;
    }
  }

  // ── mission timers ────────────────────────────────────────────────────────

  function updateMission(dt) {
    if (state.missionComplete || state.gameOver) return;

    if (!state.reactorSabotaged) {
      state.reactorDefendTimer -= dt;
      if (state.reactorDefendTimer <= 0) {
        state.reactorDefendTimer = 0;
        state.missionComplete = true;
      }
    } else {
      state.evacTimer -= dt;
      if (state.evacTimer <= 0) {
        state.evacTimer = 0;
        state.gameOver = true;
      }
    }
  }

  // ── O2 & suit integrity ───────────────────────────────────────────────────

  function updateSurvival(dt) {
    if (state.gameOver || state.missionComplete) return;

    // O2 drain
    var drainRate = state.insideBase ? 1.0 : O2_DRAIN_OUTSIDE;
    state.o2Seconds -= drainRate * dt;
    if (state.o2Seconds < 0) state.o2Seconds = 0;

    // Check O2 refills on each frame (auto on proximity)
    checkO2Refill();

    // Vacuum damage if suit breached
    if (state.suitIntegrity <= 0 && !state.insideBase) {
      state.playerHP -= VACUUM_DAMAGE_PER_SEC * dt;
    }

    // O2 out = asphyxiation
    if (state.o2Seconds <= 0) {
      state.playerHP -= 5 * dt;
    }

    if (state.playerHP <= 0) {
      state.playerHP = 0;
      state.gameOver = true;
    }
  }

  // ── camera follow ─────────────────────────────────────────────────────────

  function updateCamera() {
    if (!state.camera) return;
    state.camera.position.x += (state.playerPos.x - state.camera.position.x) * 0.1;
    state.camera.position.y += (state.playerPos.y + 4 - state.camera.position.y) * 0.1;
    state.camera.position.z += (state.playerPos.z + 18 - state.camera.position.z) * 0.1;
    state.camera.lookAt(state.playerPos.x, state.playerPos.y, state.playerPos.z);
  }

  // ── main loop ─────────────────────────────────────────────────────────────

  function animate(ts) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((ts - state.lastTime) / 1000, 0.05);
    if (state.lastTime === 0) dt = 0.016;
    state.lastTime = ts;

    if (!state.gameOver && !state.missionComplete) {
      updatePlayer(dt);
      updateGrapple(dt);
      updateEnemies(dt);
      updateGrenades(dt);
      updateDust(dt);
      updateReactor(dt);
      updateSurvival(dt);
      updateMission(dt);
      checkInsideBase();
    }

    updateCamera();

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // ── public API ────────────────────────────────────────────────────────────

  function setup() {
    bindKeys();
  }

  setup();

  return {
    name: MODULE_NAME,
    activate: init,
    deactivate: destroy,
    getState: function () { return state; }
  };

}());
