window.DeepJungle = (function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    player: null,

    // Key tracking for D+J activation (within 400ms)
    dKeyDown: false,
    jKeyDown: false,
    dKeyTime: 0,
    jKeyTime: 0,

    // Action keys
    qKeyDown: false,
    fKeyDown: false,
    eKeyDown: false,
    qPressCount: 0,
    qPressTimer: 0,

    // Scene objects
    treeTrunks: [],
    treeCanopies: [],
    vines: [],
    groundMesh: null,
    ambientLight: null,
    fogBackup: null,
    backgroundBackup: null,

    // River
    riverMesh: null,
    logRaft: null,
    playerInWater: false,
    waterTimer: 0,
    crocodile: null,

    // Ruins
    ruinsMesh: null,
    relicMesh: null,
    relicCollected: false,
    exitFlare: null,

    // Player stats
    playerHP: 100,
    poisoned: false,
    poisonTimer: 0,
    poisonDamageTimer: 0,
    movementDisabled: false,
    movementDisabledTimer: 0,
    relicFound: false,
    knockbackActive: false,
    knockbackTimer: 0,
    knockbackDir: null,
    foodPickup: null,

    // Predators
    jaguars: [],
    anacondas: [],
    gorilla: null,
    gorillaAlerted: false,

    // Tribal hunters
    hunters: [],
    hunterDartTimers: [],
    hunterPacified: [],

    // Flare
    flareMesh: null,
    flareActive: false,
    flareTimer: 0,
    flareScaresTimer: 0,

    // Night cycle
    nightCycleTimer: 0,
    isNight: false,
    nightLight: null,
    dayLightIntensity: 0.6,

    // HUD
    hudElement: null,

    // Machete swing
    macheteSwingTimer: 0,

    // Elapsed
    elapsedTime: 0
  };

  // ─── Constants ───────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW   = 0.4;   // 400ms in seconds
  var TREE_COUNT          = 20;
  var MACHETE_RANGE       = 1.5;
  var MACHETE_DAMAGE      = 30;
  var FLARE_DURATION      = 30;    // seconds
  var FLARE_RADIUS        = 15;
  var FLARE_SCARES        = 6;     // seconds
  var JAGUAR_HP           = 80;
  var JAGUAR_COUNT        = 3;
  var ANACONDA_HP         = 60;
  var ANACONDA_COUNT      = 2;
  var GORILLA_HP          = 200;
  var GORILLA_CHARGE_DIST = 8;     // units/s speed when charging
  var HUNTER_COUNT        = 4;
  var HUNTER_DART_INTERVAL= 6;     // seconds
  var POISON_CHANCE       = 0.15;
  var POISON_DAMAGE_RATE  = 2;     // HP per second
  var POISON_DURATION     = 30;    // seconds
  var WATER_CROC_DELAY    = 8;     // seconds in water before croc attacks
  var WRAP_TAPS_NEEDED    = 5;
  var WRAP_TAPS_WINDOW    = 3;     // seconds to tap Q 5x
  var WRAP_DISABLE_TIME   = 4;     // seconds movement disabled
  var NIGHT_CYCLE         = 180;   // 3 minutes in seconds
  var GORILLA_KNOCKBACK   = 3;     // units
  var KNOCKBACK_DURATION  = 0.3;   // seconds

  // ─── Key Handlers ────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    var now = Date.now() / 1000;

    if (key === 'd') {
      if (!state.dKeyDown) {
        state.dKeyDown = true;
        state.dKeyTime = now;
        checkActivation(now);
      }
    }
    if (key === 'j') {
      if (!state.jKeyDown) {
        state.jKeyDown = true;
        state.jKeyTime = now;
        checkActivation(now);
      }
    }
    if (key === 'q') {
      if (!state.qKeyDown) {
        state.qKeyDown = true;
        if (state.active) {
          swingMachete();
          // Count rapid taps for anaconda escape
          if (state.qPressTimer > 0) {
            state.qPressCount++;
          } else {
            state.qPressCount = 1;
            state.qPressTimer = WRAP_TAPS_WINDOW;
          }
        }
      }
    }
    if (key === 'f') {
      if (!state.fKeyDown) {
        state.fKeyDown = true;
        if (state.active) { fireFlareGun(); }
      }
    }
    if (key === 'e') {
      if (!state.eKeyDown) {
        state.eKeyDown = true;
        if (state.active) { tryCollectRelic(); }
      }
    }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'd') { state.dKeyDown = false; }
    if (key === 'j') { state.jKeyDown = false; }
    if (key === 'q') { state.qKeyDown = false; }
    if (key === 'f') { state.fKeyDown = false; }
    if (key === 'e') { state.eKeyDown = false; }
  }

  function checkActivation(now) {
    if (state.dKeyDown && state.jKeyDown) {
      var diff = Math.abs(state.dKeyTime - state.jKeyTime);
      if (diff <= ACTIVATION_WINDOW) {
        if (state.active) { deactivate(); } else { activate(); }
      }
    }
  }

  // ─── Scene Setup ─────────────────────────────────────────────────────────
  function activate() {
    var THREE = window.THREE;
    if (!THREE) { return; }

    var sceneObj = findScene();
    if (!sceneObj) { return; }
    state.scene = sceneObj.scene;
    state.camera = sceneObj.camera;
    state.player = sceneObj.player;
    state.active = true;

    // Save backups
    state.fogBackup = state.scene.fog;
    state.backgroundBackup = state.scene.background;

    // Environment
    state.scene.background = new THREE.Color(0x112211);
    state.scene.fog = new THREE.FogExp2(0x113311, 0.05);

    // Ground
    var groundGeo = new THREE.PlaneGeometry(80, 80);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x335533 });
    state.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    state.groundMesh.rotation.x = -Math.PI / 2;
    state.groundMesh.position.y = 0;
    state.scene.add(state.groundMesh);

    // Ambient green light
    state.ambientLight = new THREE.PointLight(0x33AA22, state.dayLightIntensity, 60);
    state.ambientLight.position.set(0, 10, 0);
    state.scene.add(state.ambientLight);

    // Night dim light (starts off)
    state.nightLight = new THREE.PointLight(0x112211, 0, 60);
    state.nightLight.position.set(0, 10, 0);
    state.scene.add(state.nightLight);

    buildTrees(THREE);
    buildVines(THREE);
    buildRiver(THREE);
    buildRuins(THREE);
    buildFoodPickup(THREE);
    spawnPredators(THREE);
    spawnHunters(THREE);

    // Reset state
    state.playerHP = 100;
    state.poisoned = false;
    state.poisonTimer = 0;
    state.relicFound = false;
    state.relicCollected = false;
    state.flareActive = false;
    state.flareTimer = 0;
    state.flareScaresTimer = 0;
    state.nightCycleTimer = 0;
    state.isNight = false;
    state.playerInWater = false;
    state.waterTimer = 0;
    state.movementDisabled = false;
    state.movementDisabledTimer = 0;
    state.gorillaAlerted = false;
    state.elapsedTime = 0;
    state.qPressCount = 0;
    state.qPressTimer = 0;

    buildHUD();

    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);

    if (typeof window.requestAnimationFrame !== 'undefined') {
      state._lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function deactivate() {
    if (!state.active) { return; }
    state.active = false;

    var scene = state.scene;

    // Restore
    scene.fog = state.fogBackup;
    scene.background = state.backgroundBackup;

    // Remove scene objects
    if (state.groundMesh) { scene.remove(state.groundMesh); state.groundMesh = null; }
    if (state.ambientLight) { scene.remove(state.ambientLight); state.ambientLight = null; }
    if (state.nightLight) { scene.remove(state.nightLight); state.nightLight = null; }
    if (state.riverMesh) { scene.remove(state.riverMesh); state.riverMesh = null; }
    if (state.logRaft) { scene.remove(state.logRaft); state.logRaft = null; }
    if (state.crocodile) { scene.remove(state.crocodile); state.crocodile = null; }
    if (state.ruinsMesh) { scene.remove(state.ruinsMesh); state.ruinsMesh = null; }
    if (state.relicMesh) { scene.remove(state.relicMesh); state.relicMesh = null; }
    if (state.exitFlare) { scene.remove(state.exitFlare); state.exitFlare = null; }
    if (state.flareMesh) { scene.remove(state.flareMesh); state.flareMesh = null; }
    if (state.foodPickup) { scene.remove(state.foodPickup); state.foodPickup = null; }

    var i;
    for (i = 0; i < state.treeTrunks.length; i++) { scene.remove(state.treeTrunks[i]); }
    for (i = 0; i < state.treeCanopies.length; i++) { scene.remove(state.treeCanopies[i]); }
    for (i = 0; i < state.vines.length; i++) { scene.remove(state.vines[i]); }
    for (i = 0; i < state.jaguars.length; i++) { scene.remove(state.jaguars[i].mesh); }
    for (i = 0; i < state.anacondas.length; i++) { scene.remove(state.anacondas[i].mesh); }
    if (state.gorilla) { scene.remove(state.gorilla.mesh); }
    for (i = 0; i < state.hunters.length; i++) {
      scene.remove(state.hunters[i].mesh);
      if (state.hunters[i].blowgun) { scene.remove(state.hunters[i].blowgun); }
    }

    state.treeTrunks = [];
    state.treeCanopies = [];
    state.vines = [];
    state.jaguars = [];
    state.anacondas = [];
    state.gorilla = null;
    state.hunters = [];
    state.hunterDartTimers = [];
    state.hunterPacified = [];

    if (state.hudElement && state.hudElement.parentNode) {
      state.hudElement.parentNode.removeChild(state.hudElement);
      state.hudElement = null;
    }

    window.removeEventListener('keydown', onKeyDown, false);
    window.removeEventListener('keyup', onKeyUp, false);
  }

  function buildTrees(THREE) {
    var i;
    for (i = 0; i < TREE_COUNT; i++) {
      var angle = (i / TREE_COUNT) * Math.PI * 2;
      var radius = 8 + Math.random() * 22;
      var x = Math.cos(angle) * radius + (Math.random() - 0.5) * 6;
      var z = Math.sin(angle) * radius + (Math.random() - 0.5) * 6;

      // Trunk
      var trunkGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 6, z);
      state.scene.add(trunk);
      state.treeTrunks.push(trunk);

      // Canopy
      var canopyGeo = new THREE.SphereGeometry(3.5, 8, 6);
      var canopyMat = new THREE.MeshLambertMaterial({ color: 0x224411 });
      var canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(x, 14, z);
      state.scene.add(canopy);
      state.treeCanopies.push(canopy);
    }
  }

  function buildVines(THREE) {
    var i, j;
    for (i = 0; i < 15; i++) {
      var x = (Math.random() - 0.5) * 50;
      var z = (Math.random() - 0.5) * 50;
      var points = [];
      for (j = 0; j <= 6; j++) {
        points.push(x + (Math.random() - 0.5) * 0.4);
        points.push(12 - j * 1.8);
        points.push(z + (Math.random() - 0.5) * 0.4);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      var mat = new THREE.LineBasicMaterial({ color: 0x335522 });
      var vine = new THREE.LineSegments(geo, mat);
      vine.userData.isVine = true;
      vine.userData.posX = x;
      vine.userData.posZ = z;
      state.scene.add(vine);
      state.vines.push(vine);
    }
  }

  function buildRiver(THREE) {
    var riverGeo = new THREE.PlaneGeometry(80, 8);
    var riverMat = new THREE.MeshLambertMaterial({ color: 0x115544, transparent: true, opacity: 0.8 });
    state.riverMesh = new THREE.Mesh(riverGeo, riverMat);
    state.riverMesh.rotation.x = -Math.PI / 2;
    state.riverMesh.position.set(0, 0.05, 10);
    state.scene.add(state.riverMesh);

    // Log raft
    var raftGeo = new THREE.BoxGeometry(3, 0.3, 1.5);
    var raftMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    state.logRaft = new THREE.Mesh(raftGeo, raftMat);
    state.logRaft.position.set(-15, 0.2, 10);
    state.scene.add(state.logRaft);

    // Crocodile (hidden until triggered)
    var crocGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
    var crocMat = new THREE.MeshLambertMaterial({ color: 0x225533 });
    state.crocodile = new THREE.Mesh(crocGeo, crocMat);
    state.crocodile.rotation.z = Math.PI / 2;
    state.crocodile.position.set(5, -1, 10); // submerged
    state.scene.add(state.crocodile);
  }

  function buildRuins(THREE) {
    var ruinGeo = new THREE.BoxGeometry(8, 4, 8);
    var ruinMat = new THREE.MeshLambertMaterial({ color: 0x667755 });
    state.ruinsMesh = new THREE.Mesh(ruinGeo, ruinMat);
    state.ruinsMesh.position.set(25, 2, -15);
    state.scene.add(state.ruinsMesh);

    // Relic inside ruins
    var relicGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var relicMat = new THREE.MeshLambertMaterial({ color: 0xFFCC44, emissive: 0xFFCC44, emissiveIntensity: 0.5 });
    state.relicMesh = new THREE.Mesh(relicGeo, relicMat);
    state.relicMesh.position.set(25, 2.5, -15);
    state.scene.add(state.relicMesh);

    // Exit signal flare site
    var exitGeo = new THREE.BoxGeometry(1.5, 0.3, 1.5);
    var exitMat = new THREE.MeshLambertMaterial({ color: 0x44FF44 });
    state.exitFlare = new THREE.Mesh(exitGeo, exitMat);
    state.exitFlare.position.set(30, 0.15, -20);
    state.scene.add(state.exitFlare);
  }

  function buildFoodPickup(THREE) {
    var foodGeo = new THREE.SphereGeometry(0.3, 6, 6);
    var foodMat = new THREE.MeshLambertMaterial({ color: 0xCC8833 });
    state.foodPickup = new THREE.Mesh(foodGeo, foodMat);
    state.foodPickup.position.set(-5, 0.3, -5);
    state.scene.add(state.foodPickup);
  }

  function spawnPredators(THREE) {
    var i;

    // Jaguars
    state.jaguars = [];
    for (i = 0; i < JAGUAR_COUNT; i++) {
      var jag = spawnJaguar(THREE, i);
      state.jaguars.push(jag);
    }

    // Anacondas
    state.anacondas = [];
    for (i = 0; i < ANACONDA_COUNT; i++) {
      var ana = spawnAnaconda(THREE, i);
      state.anacondas.push(ana);
    }

    // Gorilla
    state.gorilla = spawnGorilla(THREE);
  }

  function spawnJaguar(THREE, idx) {
    var bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var mesh = new THREE.Mesh(bodyGeo, bodyMat);
    var angle = (idx / JAGUAR_COUNT) * Math.PI * 2 + Math.PI;
    mesh.position.set(
      Math.cos(angle) * 18 + (Math.random() - 0.5) * 4,
      0.6,
      Math.sin(angle) * 18 + (Math.random() - 0.5) * 4
    );
    mesh.rotation.z = Math.PI / 2;
    state.scene.add(mesh);
    return {
      mesh: mesh,
      hp: JAGUAR_HP,
      stalking: true,
      lunging: false,
      stopped: false,
      stoppedTimer: 0,
      scared: false
    };
  }

  function spawnAnaconda(THREE, idx) {
    var geo = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x336633 });
    var mesh = new THREE.Mesh(geo, mat);
    var angle = (idx / ANACONDA_COUNT) * Math.PI * 2 + 0.5;
    mesh.position.set(
      Math.cos(angle) * 14 + (Math.random() - 0.5) * 4,
      0.4,
      Math.sin(angle) * 14 + (Math.random() - 0.5) * 4
    );
    state.scene.add(mesh);
    return {
      mesh: mesh,
      hp: ANACONDA_HP,
      wrapping: false,
      wrapCooldown: 0
    };
  }

  function spawnGorilla(THREE) {
    var geo = new THREE.BoxGeometry(1.5, 2, 1);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-20, 1, -10);
    state.scene.add(mesh);
    return {
      mesh: mesh,
      hp: GORILLA_HP,
      alerted: false,
      charging: false,
      chestPoundTimer: 4
    };
  }

  function spawnHunters(THREE) {
    var i;
    state.hunters = [];
    state.hunterDartTimers = [];
    state.hunterPacified = [];
    for (i = 0; i < HUNTER_COUNT; i++) {
      var angle = (i / HUNTER_COUNT) * Math.PI * 2 + 0.3;
      var r = 12 + Math.random() * 6;
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.6, 0.6);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
      var mesh = new THREE.Mesh(bodyGeo, bodyMat);
      mesh.position.set(
        Math.cos(angle) * r,
        0.8,
        Math.sin(angle) * r
      );
      state.scene.add(mesh);

      var blowGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
      var blowMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
      var blowgun = new THREE.Mesh(blowGeo, blowMat);
      blowgun.rotation.z = Math.PI / 2;
      blowgun.position.set(mesh.position.x + 0.8, 0.8, mesh.position.z);
      state.scene.add(blowgun);

      state.hunters.push({ mesh: mesh, blowgun: blowgun, hp: 50 });
      state.hunterDartTimers.push(Math.random() * HUNTER_DART_INTERVAL);
      state.hunterPacified.push(false);
    }
  }

  // ─── Game Loop ───────────────────────────────────────────────────────────
  function loop(timestamp) {
    if (!state.active) { return; }
    var dt = (timestamp - state._lastTime) / 1000;
    if (dt > 0.1) { dt = 0.1; }
    state._lastTime = timestamp;
    state.elapsedTime += dt;

    update(dt);
    updateHUD();

    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Night cycle
    updateNightCycle(dt);

    // Flare
    if (state.flareActive) {
      state.flareTimer -= dt;
      if (state.flareScaresTimer > 0) { state.flareScaresTimer -= dt; }
      if (state.flareTimer <= 0) {
        state.flareActive = false;
        if (state.flareMesh) {
          state.scene.remove(state.flareMesh);
          state.flareMesh = null;
        }
      }
    }

    // Poison
    if (state.poisoned) {
      state.poisonTimer -= dt;
      state.poisonDamageTimer -= dt;
      if (state.poisonDamageTimer <= 0) {
        state.poisonDamageTimer = 1;
        state.playerHP -= POISON_DAMAGE_RATE;
        if (state.playerHP < 0) { state.playerHP = 0; }
      }
      if (state.poisonTimer <= 0) {
        state.poisoned = false;
        state.poisonTimer = 0;
      }
    }

    // Movement disabled (anaconda wrap)
    if (state.movementDisabled) {
      state.movementDisabledTimer -= dt;
      if (state.movementDisabledTimer <= 0) {
        state.movementDisabled = false;
      }
    }

    // Knockback
    if (state.knockbackActive) {
      state.knockbackTimer -= dt;
      if (state.knockbackTimer <= 0) {
        state.knockbackActive = false;
      } else if (state.player && state.knockbackDir) {
        state.player.position.addScaledVector(state.knockbackDir, GORILLA_KNOCKBACK * dt / KNOCKBACK_DURATION);
      }
    }

    // Rapid Q tap timer
    if (state.qPressTimer > 0) {
      state.qPressTimer -= dt;
      if (state.qPressTimer <= 0) {
        state.qPressCount = 0;
      }
    }

    // Machete swing timer
    if (state.macheteSwingTimer > 0) { state.macheteSwingTimer -= dt; }

    // Relic glow pulse
    if (state.relicMesh && !state.relicCollected) {
      state.relicMesh.rotation.y += dt * 1.5;
    }

    // Predators
    updateJaguars(dt);
    updateAnacondas(dt);
    updateGorilla(dt);

    // Hunters
    updateHunters(dt);

    // River / water
    updateWater(dt);

    // Food pickup — check if near a hunter
    updateFoodPickup(dt);

    // HP clamp
    if (state.playerHP < 0) { state.playerHP = 0; }
  }

  function updateNightCycle(dt) {
    state.nightCycleTimer += dt;
    if (state.nightCycleTimer >= NIGHT_CYCLE) {
      state.nightCycleTimer -= NIGHT_CYCLE;
      state.isNight = !state.isNight;
    }

    var nightFrac = state.nightCycleTimer / NIGHT_CYCLE;
    if (state.isNight) {
      // Dimming
      if (state.ambientLight) { state.ambientLight.intensity = 0.15; }
      if (state.nightLight) { state.nightLight.intensity = 0.3; }
    } else {
      if (state.ambientLight) { state.ambientLight.intensity = state.dayLightIntensity; }
      if (state.nightLight) { state.nightLight.intensity = 0; }
    }
  }

  function nightSpeedMult() {
    return state.isNight ? 1.5 : 1.0;
  }

  function getPlayerPos() {
    if (state.player) { return state.player.position; }
    if (state.camera) { return state.camera.position; }
    return { x: 0, y: 0, z: 0 };
  }

  function dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function updateJaguars(dt) {
    var pp = getPlayerPos();
    var speed = 3.5 * nightSpeedMult();
    var i, jag, d, toPlayer, dot, camDir;

    for (i = 0; i < state.jaguars.length; i++) {
      jag = state.jaguars[i];
      if (jag.hp <= 0) { continue; }

      // Scared by flare
      if (state.flareActive && state.flareScaresTimer > 0) {
        jag.stopped = true;
        jag.stoppedTimer = state.flareScaresTimer;
      }

      if (jag.stoppedTimer > 0) {
        jag.stoppedTimer -= dt;
        if (jag.stoppedTimer <= 0) { jag.stopped = false; }
        continue;
      }

      d = dist2D(jag.mesh.position, pp);

      // Check if player looks back (camera dot to jaguar direction)
      if (state.camera && d < 20) {
        camDir = new window.THREE.Vector3(0, 0, -1);
        camDir.applyQuaternion(state.camera.quaternion);
        camDir.y = 0;
        camDir.normalize();
        toPlayer = new window.THREE.Vector3(
          jag.mesh.position.x - pp.x,
          0,
          jag.mesh.position.z - (pp.z || 0)
        ).normalize();
        dot = camDir.dot(toPlayer);
        if (dot > 0.6) {
          // Player is looking at jaguar — stop
          jag.stopped = true;
          jag.stoppedTimer = 1.5;
          continue;
        }
      }

      // Lunge if within 2u
      if (d < 2) {
        state.playerHP -= 15 * dt;
        jag.lunging = true;
      } else {
        jag.lunging = false;
        // Stalk from behind — move toward player
        var dx = pp.x - jag.mesh.position.x;
        var dz = (pp.z || 0) - jag.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
          jag.mesh.position.x += (dx / len) * speed * dt;
          jag.mesh.position.z += (dz / len) * speed * dt;
        }
      }
    }
  }

  function updateAnacondas(dt) {
    var pp = getPlayerPos();
    var speed = 2.5 * nightSpeedMult();
    var i, ana, d;

    for (i = 0; i < state.anacondas.length; i++) {
      ana = state.anacondas[i];
      if (ana.hp <= 0) { continue; }

      if (ana.wrapCooldown > 0) {
        ana.wrapCooldown -= dt;
        continue;
      }

      d = dist2D(ana.mesh.position, pp);

      if (ana.wrapping) {
        // Check if player tapped Q fast enough
        if (state.qPressCount >= WRAP_TAPS_NEEDED) {
          ana.wrapping = false;
          state.movementDisabled = false;
          state.movementDisabledTimer = 0;
          state.qPressCount = 0;
          ana.wrapCooldown = 8;
          state.playerHP -= 5; // minor damage from escape
        }
        // Continue coiling damage
        state.playerHP -= 2 * dt;
      } else if (d < 1.5) {
        // Start wrapping
        ana.wrapping = true;
        state.movementDisabled = true;
        state.movementDisabledTimer = WRAP_DISABLE_TIME;
        // Snap snake to player
        ana.mesh.position.x = pp.x;
        ana.mesh.position.z = pp.z || 0;
      } else {
        // Move toward player
        var dx = pp.x - ana.mesh.position.x;
        var dz = (pp.z || 0) - ana.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
          ana.mesh.position.x += (dx / len) * speed * dt;
          ana.mesh.position.z += (dz / len) * speed * dt;
        }
      }
    }
  }

  function updateGorilla(dt) {
    if (!state.gorilla || state.gorilla.hp <= 0) { return; }

    var pp = getPlayerPos();
    var gor = state.gorilla;
    var d = dist2D(gor.mesh.position, pp);
    var speed = 8 * nightSpeedMult();

    // Chest pound timer
    gor.chestPoundTimer -= dt;
    if (gor.chestPoundTimer <= 0) {
      gor.chestPoundTimer = 5 + Math.random() * 3;
      if (d < 6) {
        // Chest pound — alert + knockback
        gor.alerted = true;
        state.gorillaAlerted = true;
        // Apply knockback to player
        var kdx = pp.x - gor.mesh.position.x;
        var kdz = (pp.z || 0) - gor.mesh.position.z;
        var klen = Math.sqrt(kdx * kdx + kdz * kdz);
        if (klen > 0) {
          state.knockbackDir = new window.THREE.Vector3(kdx / klen, 0, kdz / klen);
          state.knockbackActive = true;
          state.knockbackTimer = KNOCKBACK_DURATION;
        }
        state.playerHP -= 10;
      }
    }

    if (state.gorillaAlerted || gor.alerted) {
      // Alert on proximity too
      if (d < 15) { gor.alerted = true; state.gorillaAlerted = true; }
    }

    if (gor.alerted && d > 1.5) {
      var dx = pp.x - gor.mesh.position.x;
      var dz = (pp.z || 0) - gor.mesh.position.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0) {
        gor.mesh.position.x += (dx / len) * speed * dt;
        gor.mesh.position.z += (dz / len) * speed * dt;
      }
    }

    if (d < 1.5 && gor.alerted) {
      state.playerHP -= 20 * dt;
    }
  }

  function updateHunters(dt) {
    var pp = getPlayerPos();
    var i, hunter, d, visualRange;

    for (i = 0; i < HUNTER_COUNT; i++) {
      hunter = state.hunters[i];
      if (state.hunterPacified[i]) { continue; }
      if (hunter.hp <= 0) { continue; }

      visualRange = state.isNight ? 8 : 20;
      d = dist2D(hunter.mesh.position, pp);

      state.hunterDartTimers[i] -= dt;
      if (state.hunterDartTimers[i] <= 0 && d < visualRange) {
        state.hunterDartTimers[i] = HUNTER_DART_INTERVAL;
        firePoisonDart(i);
      }

      // Blowgun follows player
      if (hunter.blowgun) {
        hunter.blowgun.position.x = hunter.mesh.position.x + 0.8;
        hunter.blowgun.position.z = hunter.mesh.position.z;
      }
    }
  }

  function firePoisonDart(hunterIdx) {
    // Apply poison chance
    if (Math.random() < POISON_CHANCE) {
      state.poisoned = true;
      state.poisonTimer = POISON_DURATION;
      state.poisonDamageTimer = 1;
    }
    // Base dart damage
    state.playerHP -= 3;
  }

  function updateWater(dt) {
    if (!state.riverMesh) { return; }
    var pp = getPlayerPos();
    // Check if player is in river zone (z between 6 and 14)
    var inRiver = (pp.z >= 6 && pp.z <= 14 && pp.x >= -40 && pp.x <= 40);

    if (inRiver) {
      state.playerInWater = true;
      state.waterTimer += dt;
      // Slow player (visual only — note: actual movement is external)
      if (state.waterTimer > WATER_CROC_DELAY) {
        // Croc surfaces and attacks
        state.crocodile.position.y = 0.3;
        state.crocodile.position.x = pp.x + 1;
        state.crocodile.position.z = pp.z;
        state.playerHP -= 25 * dt;
      }
    } else {
      if (state.playerInWater) {
        state.playerInWater = false;
        state.waterTimer = 0;
        // Submerge croc again
        state.crocodile.position.y = -1;
      }
    }
  }

  function updateFoodPickup(dt) {
    if (!state.foodPickup) { return; }
    var pp = getPlayerPos();
    var fd = state.foodPickup.position;
    var d = dist2D(fd, pp);
    // Auto-pick up food if player walks over it
    if (d < 1.5) {
      // Drop near nearest hunter to pacify
      var i, nearest = -1, nearestDist = 999;
      for (i = 0; i < HUNTER_COUNT; i++) {
        if (state.hunterPacified[i]) { continue; }
        var hd = dist2D(state.hunters[i].mesh.position, pp);
        if (hd < nearestDist) {
          nearestDist = hd;
          nearest = i;
        }
      }
      if (nearest >= 0 && nearestDist < 8) {
        state.hunterPacified[nearest] = true;
        state.scene.remove(state.foodPickup);
        state.foodPickup = null;
      }
    }
  }

  // ─── Actions ─────────────────────────────────────────────────────────────
  function swingMachete() {
    if (state.macheteSwingTimer > 0) { return; }
    state.macheteSwingTimer = 0.8;

    var pp = getPlayerPos();
    var i, d;

    // Damage jaguars in range
    for (i = 0; i < state.jaguars.length; i++) {
      if (state.jaguars[i].hp <= 0) { continue; }
      d = dist2D(state.jaguars[i].mesh.position, pp);
      if (d <= MACHETE_RANGE) {
        state.jaguars[i].hp -= MACHETE_DAMAGE;
        if (state.jaguars[i].hp <= 0) {
          state.scene.remove(state.jaguars[i].mesh);
        }
      }
    }

    // Damage anacondas
    for (i = 0; i < state.anacondas.length; i++) {
      if (state.anacondas[i].hp <= 0) { continue; }
      d = dist2D(state.anacondas[i].mesh.position, pp);
      if (d <= MACHETE_RANGE) {
        state.anacondas[i].hp -= MACHETE_DAMAGE;
        if (state.anacondas[i].hp <= 0) {
          state.anacondas[i].wrapping = false;
          state.movementDisabled = false;
          state.scene.remove(state.anacondas[i].mesh);
        }
      }
    }

    // Damage gorilla
    if (state.gorilla && state.gorilla.hp > 0) {
      d = dist2D(state.gorilla.mesh.position, pp);
      if (d <= MACHETE_RANGE) {
        state.gorilla.hp -= MACHETE_DAMAGE;
        if (state.gorilla.hp <= 0) {
          state.scene.remove(state.gorilla.mesh);
        }
      }
    }

    // Cut vines in range
    for (i = state.vines.length - 1; i >= 0; i--) {
      var vine = state.vines[i];
      var vd = dist2D({ x: vine.userData.posX, z: vine.userData.posZ }, pp);
      if (vd <= MACHETE_RANGE) {
        state.scene.remove(vine);
        state.vines.splice(i, 1);
      }
    }
  }

  function fireFlareGun() {
    var THREE = window.THREE;
    if (state.flareActive) { return; }
    state.flareActive = true;
    state.flareTimer = FLARE_DURATION;
    state.flareScaresTimer = FLARE_SCARES;

    var pp = getPlayerPos();
    var flareGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var flareMat = new THREE.MeshLambertMaterial({
      color: 0xFFAA44,
      emissive: 0xFFAA44,
      emissiveIntensity: 1.0
    });
    state.flareMesh = new THREE.Mesh(flareGeo, flareMat);
    state.flareMesh.position.set(pp.x, pp.y + 10, pp.z || 0);
    state.scene.add(state.flareMesh);

    // Attach a point light to flare
    var flareLight = new THREE.PointLight(0xFFAA44, 2.0, FLARE_RADIUS);
    state.flareMesh.add(flareLight);
  }

  var FLARE_SCARES = FLARE_SCARES || 6;

  function tryCollectRelic() {
    if (state.relicCollected || !state.relicMesh) { return; }
    var pp = getPlayerPos();
    var d = dist2D(state.relicMesh.position, pp);
    if (d < 4) {
      state.relicCollected = true;
      state.relicFound = true;
      state.scene.remove(state.relicMesh);
      state.relicMesh = null;
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function buildHUD() {
    if (state.hudElement && state.hudElement.parentNode) {
      state.hudElement.parentNode.removeChild(state.hudElement);
    }
    var div = document.createElement('div');
    div.id = 'deep-jungle-hud';
    div.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.75)',
      'color:#55FF55',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 12px',
      'border:1px solid #33AA33',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(div);
    state.hudElement = div;
  }

  function updateHUD() {
    if (!state.hudElement) { return; }

    var poisonStr;
    if (state.poisoned) {
      poisonStr = Math.ceil(state.poisonTimer) + 's';
    } else {
      poisonStr = 'NO';
    }

    var relicStr = state.relicFound ? 'FOUND' : 'NOT FOUND';

    var jagCount = 0, anaCount = 0, gorStr;
    var i;
    for (i = 0; i < state.jaguars.length; i++) {
      if (state.jaguars[i].hp > 0) { jagCount++; }
    }
    for (i = 0; i < state.anacondas.length; i++) {
      if (state.anacondas[i].hp > 0) { anaCount++; }
    }
    gorStr = (state.gorilla && state.gorilla.hp > 0) ? 'alive' : 'dead';

    var nightRemain;
    if (state.isNight) {
      nightRemain = Math.ceil(NIGHT_CYCLE - state.nightCycleTimer) + 's';
    } else {
      nightRemain = Math.ceil(NIGHT_CYCLE - state.nightCycleTimer) + 's';
    }
    var nightPhase = state.isNight ? 'NIGHT' : 'DAY';

    state.hudElement.textContent = [
      'JUNGLE',
      '[HP: ' + Math.max(0, Math.ceil(state.playerHP)) + ']',
      '[POISONED: ' + poisonStr + ']',
      '[RELIC: ' + relicStr + ']',
      '[PREDATORS: ' + jagCount + ' jaguars/' + anaCount + ' anacondas/' + gorStr + ']',
      '| ' + nightPhase + ': ' + nightRemain
    ].join(' ');
  }

  // ─── Utility ─────────────────────────────────────────────────────────────
  function findScene() {
    var candidates = [
      window.gameScene,
      window.scene,
      window.Game && window.Game.scene,
      window.renderer && window.renderer.scene
    ];
    var i;
    for (i = 0; i < candidates.length; i++) {
      if (candidates[i] && candidates[i].isScene) { return { scene: candidates[i], camera: findCamera(), player: findPlayer() }; }
    }
    // Fallback: create minimal scene stand-in
    return null;
  }

  function findCamera() {
    return window.camera || (window.Game && window.Game.camera) || null;
  }

  function findPlayer() {
    return window.player || (window.Game && window.Game.player) || null;
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  return {
    activate: activate,
    deactivate: deactivate,
    isActive: function () { return state.active; },
    getState: function () { return state; }
  };
}());
