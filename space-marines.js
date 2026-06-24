// space-marines.js — SpaceMarines module
// Activation: S+M simultaneous keypress (both within 400ms)
// RULES: var only, IIFE window.SpaceMarines, node --check must pass

(function (window) {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────
  var state = {
    active: false,
    phase: 'INSERTION',   // INSERTION | COMBAT | BOSS
    scene: null,
    camera: null,
    renderer: null,
    animId: null,
    clock: null,

    // Player / pod
    pod: null,
    podVelocityY: 0,
    podLanded: false,
    playerDeployed: false,
    playerMesh: null,
    playerPos: { x: 0, y: 1, z: 0 },
    playerHP: 200,

    // Weapons
    grenades: 4,
    pulseRifleAmmo: 120,
    flamethrowerFuel: 100,
    activeWeapon: 'rifle',  // rifle | flamethrower
    projectiles: [],
    flameParticles: [],

    // Aliens
    drones: [],
    warriors: [],
    broodmother: null,
    broodmotherAlive: true,
    spitters: [],
    broodSpawnTimer: 0,
    spitterFireTimers: [],

    // Hive queen
    queen: null,
    queenHP: 800,
    queenPhase: 'dormant',  // dormant | alert | aggressive | rage
    queenAttackTimer: 0,
    queenSpawnTimer: 0,

    // Acid pools
    acidPools: [],

    // Distress beacon / supply drop
    distressBeacon: null,
    supplyDropTimer: -1,
    supplyPod: null,

    // HUD
    hudEl: null,

    // Key tracking for S+M activation
    keyTimestamps: {},

    // Pointer lock / movement
    keys: {},
    yaw: 0,
    pitch: 0,
    mouseDX: 0,
    mouseDY: 0,

    // Lights
    volcanoLights: [],

    // Mission complete
    missionComplete: false
  };

  // ─── Key activation ────────────────────────────────────────────────────
  function handleActivationKey(e) {
    var key = e.key.toLowerCase();
    if (key !== 's' && key !== 'm') return;
    state.keyTimestamps[key] = Date.now();
    var s = state.keyTimestamps['s'] || 0;
    var m = state.keyTimestamps['m'] || 0;
    if (s > 0 && m > 0 && Math.abs(s - m) <= 400) {
      state.keyTimestamps = {};
      if (!state.active) {
        activate();
      }
    }
  }

  // ─── Activate ──────────────────────────────────────────────────────────
  function activate() {
    if (state.active) return;
    state.active = true;
    if (!window.THREE) { console.warn('SpaceMarines: THREE.js not found'); return; }
    buildScene();
    buildHUD();
    startLoop();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
  }

  // ─── Scene ─────────────────────────────────────────────────────────────
  function buildScene() {
    var THREE = window.THREE;

    // Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    // Scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x110022);
    state.scene.fog = new THREE.FogExp2(0x220033, 0.015);

    // Camera
    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    state.camera.position.set(0, 2, 5);

    // Clock
    state.clock = new THREE.Clock();

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0x221133, 0.5);
    state.scene.add(ambientLight);

    // Directional light (dim alien sun)
    var dirLight = new THREE.DirectionalLight(0x4422aa, 0.4);
    dirLight.position.set(10, 30, 10);
    dirLight.castShadow = true;
    state.scene.add(dirLight);

    buildGround();
    buildHiveStructures();
    buildAcidPools();
    buildVolcanoVents();
    spawnDropPod();
    spawnAliens();
    spawnHiveQueen();
  }

  function buildGround() {
    var THREE = window.THREE;
    var geo = new THREE.PlaneGeometry(200, 200);
    var mat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    state.scene.add(ground);
  }

  function buildHiveStructures() {
    var THREE = window.THREE;
    var mat = new THREE.MeshLambertMaterial({ color: 0x332211 });
    for (var i = 0; i < 10; i++) {
      var w = 2 + Math.random() * 4;
      var h = 3 + Math.random() * 8;
      var d = 2 + Math.random() * 4;
      var geo = new THREE.BoxGeometry(w, h, d);
      var mesh = new THREE.Mesh(geo, mat);
      var angle = (i / 10) * Math.PI * 2;
      var radius = 15 + Math.random() * 10;
      mesh.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.castShadow = true;
      state.scene.add(mesh);
    }
  }

  function buildAcidPools() {
    var THREE = window.THREE;
    var positions = [
      { x: 8, z: 8 },
      { x: -12, z: 5 },
      { x: 5, z: -10 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var geo = new THREE.PlaneGeometry(6, 6);
      var mat = new THREE.MeshLambertMaterial({
        color: 0xFF4400,
        emissive: new THREE.Color(0xFF4400),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8
      });
      var pool = new THREE.Mesh(geo, mat);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(positions[i].x, 0.05, positions[i].z);
      state.scene.add(pool);
      state.acidPools.push({ mesh: pool, x: positions[i].x, z: positions[i].z, radius: 3 });
    }
  }

  function buildVolcanoVents() {
    var THREE = window.THREE;
    var ventPositions = [
      { x: -30, z: -20 },
      { x: 25, z: -30 }
    ];
    for (var i = 0; i < 2; i++) {
      var light = new THREE.PointLight(0xFF2200, 2, 30);
      light.position.set(ventPositions[i].x, 2, ventPositions[i].z);
      state.scene.add(light);
      state.volcanoLights.push(light);

      // Vent cone visual
      var geo = new THREE.CylinderGeometry(0.5, 2, 3, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x331100, emissive: new THREE.Color(0xFF2200), emissiveIntensity: 0.3 });
      var vent = new THREE.Mesh(geo, mat);
      vent.position.set(ventPositions[i].x, 1.5, ventPositions[i].z);
      state.scene.add(vent);
    }
  }

  // ─── Drop Pod ──────────────────────────────────────────────────────────
  function spawnDropPod() {
    var THREE = window.THREE;
    var geo = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
    var mat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    state.pod = new THREE.Mesh(geo, mat);
    state.pod.position.set(0, 100, 0);
    state.pod.castShadow = true;
    state.scene.add(state.pod);
    state.podVelocityY = -20; // 20 u/s downward
    state.podLanded = false;
    state.playerDeployed = false;
  }

  function updatePod(dt) {
    if (state.podLanded) return;
    var THREE = window.THREE;
    state.pod.position.y += state.podVelocityY * dt;
    if (state.pod.position.y <= 1.5) {
      state.pod.position.y = 1.5;
      state.podLanded = true;

      // Impact blast — knock back nearby aliens
      podImpactBlast(state.pod.position, 5);

      // Deploy player after brief delay
      setTimeout(function () {
        deployPlayer();
      }, 800);
    }
  }

  function podImpactBlast(pos, radius) {
    var allAliens = getAllAliens();
    for (var i = 0; i < allAliens.length; i++) {
      var alien = allAliens[i];
      var dx = alien.mesh.position.x - pos.x;
      var dz = alien.mesh.position.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius && dist > 0) {
        alien.mesh.position.x += (dx / dist) * (radius - dist) * 0.8;
        alien.mesh.position.z += (dz / dist) * (radius - dist) * 0.8;
      }
    }
  }

  function deployPlayer() {
    var THREE = window.THREE;
    state.playerDeployed = true;
    state.phase = 'COMBAT';

    // Open pod (visual tilt)
    if (state.pod) {
      state.pod.rotation.z = Math.PI / 4;
    }

    // Player mesh (marine silhouette)
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    state.playerMesh = new THREE.Mesh(geo, mat);
    state.playerMesh.position.set(0, 0.9, 0);
    state.scene.add(state.playerMesh);
    state.playerPos = { x: 0, y: 1, z: 2 };
  }

  // ─── Aliens ────────────────────────────────────────────────────────────
  function spawnAliens() {
    spawnDrones(12);
    spawnWarriors(6);
    spawnBroodmother();
    spawnSpitters(3);
  }

  function spawnDrones(count) {
    var THREE = window.THREE;
    for (var i = 0; i < count; i++) {
      var geo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x442211 });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = Math.random() * Math.PI * 2;
      var r = 20 + Math.random() * 20;
      mesh.position.set(Math.cos(angle) * r, 0.4, Math.sin(angle) * r);
      state.scene.add(mesh);
      state.drones.push({
        mesh: mesh,
        hp: 30,
        speed: 10,
        fireTimer: Math.random() * 3,
        alive: true
      });
    }
  }

  function spawnWarriors(count) {
    var THREE = window.THREE;
    for (var i = 0; i < count; i++) {
      var geo = new THREE.BoxGeometry(1.2, 2, 0.8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x332211 });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = Math.random() * Math.PI * 2;
      var r = 25 + Math.random() * 15;
      mesh.position.set(Math.cos(angle) * r, 1, Math.sin(angle) * r);
      state.scene.add(mesh);
      state.warriors.push({
        mesh: mesh,
        hp: 120,
        speed: 5,
        chargeDist: 8,
        meleeTimer: 0,
        alive: true
      });
    }
  }

  function spawnBroodmother() {
    var THREE = window.THREE;
    var geo = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
    var mat = new THREE.MeshLambertMaterial({ color: 0x221100, emissive: new THREE.Color(0x110000), emissiveIntensity: 0.3 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-35, 1.5, -35);
    state.scene.add(mesh);
    state.broodmother = {
      mesh: mesh,
      hp: 400,
      speed: 3,
      alive: true
    };
    state.broodmotherAlive = true;
    state.broodSpawnTimer = 30;
  }

  function spawnSpitters(count) {
    var THREE = window.THREE;
    for (var i = 0; i < count; i++) {
      var geo = new THREE.SphereGeometry(0.8, 8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x443322 });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = (i / count) * Math.PI * 2 + Math.PI / 6;
      var r = 22 + Math.random() * 8;
      mesh.position.set(Math.cos(angle) * r, 0.8, Math.sin(angle) * r);
      state.scene.add(mesh);
      state.spitters.push({
        mesh: mesh,
        hp: 80,
        fireTimer: 2 + Math.random() * 2,
        alive: true
      });
      state.spitterFireTimers.push(2 + Math.random() * 2);
    }
  }

  function spawnHiveQueen() {
    var THREE = window.THREE;
    var geo = new THREE.SphereGeometry(3, 16, 16);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x221100,
      emissive: new THREE.Color(0x221100),
      emissiveIntensity: 0.5
    });
    state.queen = new THREE.Mesh(geo, mat);
    state.queen.position.set(0, 3, -40);
    state.scene.add(state.queen);
    state.queenHP = 800;
    state.queenPhase = 'dormant';
  }

  // ─── Alien AI update ───────────────────────────────────────────────────
  function updateAliens(dt) {
    if (!state.playerDeployed || state.missionComplete) return;

    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    // Drones
    for (var i = 0; i < state.drones.length; i++) {
      var drone = state.drones[i];
      if (!drone.alive) continue;
      var dx = px - drone.mesh.position.x;
      var dz = pz - drone.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        drone.mesh.position.x += (dx / dist) * drone.speed * dt;
        drone.mesh.position.z += (dz / dist) * drone.speed * dt;
      }
      // Acid spit at range 10
      drone.fireTimer -= dt;
      if (drone.fireTimer <= 0 && dist < 10) {
        drone.fireTimer = 2;
        fireAcidSpit(drone.mesh.position, px, pz);
      }
      // Contact damage to player
      if (dist < 1.2) {
        state.playerHP -= 5 * dt;
      }
    }

    // Warriors
    for (var j = 0; j < state.warriors.length; j++) {
      var warrior = state.warriors[j];
      if (!warrior.alive) continue;
      var wdx = px - warrior.mesh.position.x;
      var wdz = pz - warrior.mesh.position.z;
      var wdist = Math.sqrt(wdx * wdx + wdz * wdz);
      if (wdist < warrior.chargeDist && wdist > 0.5) {
        warrior.mesh.position.x += (wdx / wdist) * warrior.speed * dt;
        warrior.mesh.position.z += (wdz / wdist) * warrior.speed * dt;
      }
      // Melee at close range
      warrior.meleeTimer -= dt;
      if (wdist < 1.5 && warrior.meleeTimer <= 0) {
        warrior.meleeTimer = 1;
        state.playerHP -= 50;
      }
    }

    // Broodmother
    if (state.broodmother && state.broodmother.alive) {
      var bdx = px - state.broodmother.mesh.position.x;
      var bdz = pz - state.broodmother.mesh.position.z;
      var bdist = Math.sqrt(bdx * bdx + bdz * bdz);
      if (bdist > 2) {
        state.broodmother.mesh.position.x += (bdx / bdist) * state.broodmother.speed * dt;
        state.broodmother.mesh.position.z += (bdz / bdist) * state.broodmother.speed * dt;
      }
      // Spawn drones every 30s
      state.broodSpawnTimer -= dt;
      if (state.broodSpawnTimer <= 0) {
        state.broodSpawnTimer = 30;
        spawnDronesFromBroodmother(2);
      }
      if (bdist < 2) {
        state.playerHP -= 30 * dt;
      }
    }

    // Spitters
    for (var k = 0; k < state.spitters.length; k++) {
      var spitter = state.spitters[k];
      if (!spitter.alive) continue;
      spitter.fireTimer -= dt;
      var sdx = px - spitter.mesh.position.x;
      var sdz = pz - spitter.mesh.position.z;
      var sdist = Math.sqrt(sdx * sdx + sdz * sdz);
      if (spitter.fireTimer <= 0) {
        spitter.fireTimer = 4;
        fireAcidArc(spitter.mesh.position, px, pz);
      }
    }
  }

  function spawnDronesFromBroodmother(count) {
    var THREE = window.THREE;
    for (var i = 0; i < count; i++) {
      var geo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x442211 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        state.broodmother.mesh.position.x + (Math.random() - 0.5) * 4,
        0.4,
        state.broodmother.mesh.position.z + (Math.random() - 0.5) * 4
      );
      state.scene.add(mesh);
      state.drones.push({ mesh: mesh, hp: 30, speed: 10, fireTimer: Math.random() * 3, alive: true });
    }
  }

  // ─── Hive Queen ─────────────────────────────────────────────────────────
  function updateQueenPhase() {
    var hp = state.queenHP;
    var oldPhase = state.queenPhase;
    if (hp <= 0) {
      state.queenPhase = 'dead';
    } else if (hp <= 200) {
      state.queenPhase = 'rage';
    } else if (hp <= 400) {
      state.queenPhase = 'aggressive';
    } else if (hp <= 600) {
      state.queenPhase = 'alert';
    } else {
      state.queenPhase = 'dormant';
    }
    if (state.queenPhase !== oldPhase && state.queenPhase !== 'dead') {
      if (state.queenPhase === 'alert' || state.queenPhase === 'aggressive' || state.queenPhase === 'rage') {
        state.phase = 'BOSS';
      }
    }
  }

  function updateQueen(dt) {
    if (!state.queen || state.missionComplete) return;
    updateQueenPhase();
    if (state.queenPhase === 'dead') {
      if (state.queen.parent) {
        state.scene.remove(state.queen);
        state.queen = null;
      }
      state.missionComplete = true;
      showMissionComplete();
      return;
    }

    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var qdx = px - state.queen.position.x;
    var qdz = pz - state.queen.position.z;
    var qdist = Math.sqrt(qdx * qdx + qdz * qdz);

    // Queen attacks based on phase
    var attackSpeed = 1;
    if (state.queenPhase === 'aggressive') attackSpeed = 2;
    if (state.queenPhase === 'rage') attackSpeed = 3;

    state.queenAttackTimer -= dt * attackSpeed;
    if (state.queenAttackTimer <= 0) {
      state.queenAttackTimer = 3;
      if (qdist < 40) {
        fireQueenAttack(state.queen.position, px, pz);
      }
    }

    // Rage phase: continuous spawning
    if (state.queenPhase === 'rage') {
      state.queenSpawnTimer -= dt;
      if (state.queenSpawnTimer <= 0) {
        state.queenSpawnTimer = 5;
        spawnDronesFromQueen(2);
      }
    }

    // Queen pulses emissive
    if (state.queen && state.queen.material) {
      var pulse = 0.3 + 0.2 * Math.sin(Date.now() * 0.003);
      state.queen.material.emissiveIntensity = pulse;
    }

    // Move queen toward player in aggressive/rage
    if ((state.queenPhase === 'aggressive' || state.queenPhase === 'rage') && qdist > 10 && qdist > 0) {
      state.queen.position.x += (qdx / qdist) * 2 * dt;
      state.queen.position.z += (qdz / qdist) * 2 * dt;
    }
  }

  function spawnDronesFromQueen(count) {
    var THREE = window.THREE;
    for (var i = 0; i < count; i++) {
      var geo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x442211 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        state.queen.position.x + (Math.random() - 0.5) * 8,
        0.4,
        state.queen.position.z + (Math.random() - 0.5) * 8
      );
      state.scene.add(mesh);
      state.drones.push({ mesh: mesh, hp: 30, speed: 10, fireTimer: Math.random() * 2, alive: true });
    }
  }

  function fireQueenAttack(fromPos, tx, tz) {
    var THREE = window.THREE;
    var geo = new THREE.SphereGeometry(0.4, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF4400), emissiveIntensity: 0.8 });
    var proj = new THREE.Mesh(geo, mat);
    proj.position.copy(fromPos);
    proj.position.y = 3;
    var dx = tx - fromPos.x;
    var dz = tz - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    state.scene.add(proj);
    state.projectiles.push({
      mesh: proj,
      vx: (dx / len) * 15,
      vy: 0,
      vz: (dz / len) * 15,
      type: 'queen',
      damage: 40,
      life: 5
    });
  }

  // ─── Weapons ───────────────────────────────────────────────────────────
  function firePulseRifle() {
    if (!state.playerDeployed || state.pulseRifleAmmo <= 0) return;
    var THREE = window.THREE;
    state.pulseRifleAmmo--;
    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4488FF, emissive: new THREE.Color(0x4488FF), emissiveIntensity: 1 });
    var proj = new THREE.Mesh(geo, mat);
    proj.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z - 0.5);
    // Shoot forward based on camera yaw
    var fwdX = -Math.sin(state.yaw);
    var fwdZ = -Math.cos(state.yaw);
    state.scene.add(proj);
    state.projectiles.push({
      mesh: proj,
      vx: fwdX * 60,
      vy: 0,
      vz: fwdZ * 60,
      type: 'player',
      damage: 20,
      life: 2
    });
  }

  function fireFlamethrower(dt) {
    if (!state.playerDeployed || state.flamethrowerFuel <= 0) return;
    var THREE = window.THREE;
    state.flamethrowerFuel -= 20 * dt;
    // Spawn cone particles
    var fwdX = -Math.sin(state.yaw);
    var fwdZ = -Math.cos(state.yaw);
    for (var p = 0; p < 3; p++) {
      var geo = new THREE.CylinderGeometry(0.05, 0.3, 0.5 + Math.random(), 6);
      var mat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: new THREE.Color(0xFF6600), emissiveIntensity: 1 });
      var flame = new THREE.Mesh(geo, mat);
      flame.position.set(
        state.playerPos.x + fwdX * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.5,
        state.playerPos.y,
        state.playerPos.z + fwdZ * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.5
      );
      state.scene.add(flame);
      state.flameParticles.push({ mesh: flame, life: 0.3 + Math.random() * 0.2 });

      // Point light for flame
      var flameLight = new THREE.PointLight(0xFF6600, 1, 5);
      flameLight.position.copy(flame.position);
      state.scene.add(flameLight);
      state.flameParticles.push({ mesh: flameLight, life: 0.1, isLight: true });
    }

    // Damage aliens within 6 units in front
    var allAliens = getAllAliens();
    for (var i = 0; i < allAliens.length; i++) {
      var alien = allAliens[i];
      if (!alien.alive) continue;
      var adx = alien.mesh.position.x - state.playerPos.x;
      var adz = alien.mesh.position.z - state.playerPos.z;
      var adist = Math.sqrt(adx * adx + adz * adz);
      if (adist < 6) {
        var dot = (adx / adist) * fwdX + (adz / adist) * fwdZ;
        if (dot > 0.5) {
          alien.hp -= 60 * dt;
          if (alien.hp <= 0) killAlien(alien);
        }
      }
    }
  }

  function throwGrenade() {
    if (!state.playerDeployed || state.grenades <= 0) return;
    var THREE = window.THREE;
    state.grenades--;

    var fwdX = -Math.sin(state.yaw);
    var fwdZ = -Math.cos(state.yaw);

    var geo = new THREE.SphereGeometry(0.2, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    var grenade = new THREE.Mesh(geo, mat);
    grenade.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.scene.add(grenade);
    state.projectiles.push({
      mesh: grenade,
      vx: fwdX * 15,
      vy: 6,
      vz: fwdZ * 15,
      type: 'grenade',
      damage: 80,
      splash: 3,
      life: 3,
      fuseTimer: 2
    });
  }

  function fireDistressBeacon() {
    if (!state.playerDeployed || state.distressBeacon) return;
    var THREE = window.THREE;
    var fwdX = -Math.sin(state.yaw);
    var fwdZ = -Math.cos(state.yaw);
    var geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4488FF, emissive: new THREE.Color(0x4488FF), emissiveIntensity: 0.8 });
    var beacon = new THREE.Mesh(geo, mat);
    beacon.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.scene.add(beacon);
    state.distressBeacon = { mesh: beacon, timer: 30 };
    state.projectiles.push({
      mesh: beacon,
      vx: fwdX * 10,
      vy: 4,
      vz: fwdZ * 10,
      type: 'beacon',
      damage: 0,
      life: 2
    });
  }

  // ─── Acid spits / arcs from aliens ─────────────────────────────────────
  function fireAcidSpit(fromPos, tx, tz) {
    var THREE = window.THREE;
    var geo = new THREE.SphereGeometry(0.15, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    var proj = new THREE.Mesh(geo, mat);
    proj.position.copy(fromPos);
    proj.position.y = 0.5;
    var dx = tx - fromPos.x;
    var dz = tz - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    state.scene.add(proj);
    state.projectiles.push({
      mesh: proj,
      vx: (dx / len) * 12,
      vy: 0,
      vz: (dz / len) * 12,
      type: 'acid',
      damage: 15,
      life: 3
    });
  }

  function fireAcidArc(fromPos, tx, tz) {
    var THREE = window.THREE;
    var geo = new THREE.SphereGeometry(0.2, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF4400), emissiveIntensity: 0.5 });
    var proj = new THREE.Mesh(geo, mat);
    proj.position.copy(fromPos);
    proj.position.y = 0.8;
    var dx = tx - fromPos.x;
    var dz = tz - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    state.scene.add(proj);
    state.projectiles.push({
      mesh: proj,
      vx: (dx / len) * 10,
      vy: 5,
      vz: (dz / len) * 10,
      type: 'acid',
      damage: 20,
      life: 4
    });
  }

  // ─── Projectile update ─────────────────────────────────────────────────
  function updateProjectiles(dt) {
    var gravity = -9.8;
    for (var i = state.projectiles.length - 1; i >= 0; i--) {
      var p = state.projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      if (p.type === 'grenade' || p.type === 'beacon') {
        p.vy += gravity * dt;
      }

      // Ground collision for grenades
      if (p.type === 'grenade' && p.mesh.position.y <= 0.2) {
        p.mesh.position.y = 0.2;
        if (p.fuseTimer !== undefined) {
          p.fuseTimer -= dt;
          if (p.fuseTimer <= 0) {
            explodeGrenade(p);
            removeProjectile(i);
            continue;
          }
        }
        p.vx *= 0.3;
        p.vz *= 0.3;
        p.vy = 0;
      }

      // Beacon lands
      if (p.type === 'beacon' && p.mesh.position.y <= 0.25) {
        p.mesh.position.y = 0.25;
        p.vx = 0; p.vy = 0; p.vz = 0;
        if (state.distressBeacon) {
          state.distressBeacon.timer = 30;
        }
        p.life = 999; // stays until supply drop
      }

      // Collide with aliens (player projectiles)
      if (p.type === 'player') {
        var hitAlien = checkProjectileAlienHit(p);
        if (hitAlien) {
          hitAlien.hp -= p.damage;
          if (hitAlien.hp <= 0) killAlien(hitAlien);
          removeProjectile(i);
          continue;
        }
        // Queen hit
        if (state.queen && !state.missionComplete) {
          var qd = p.mesh.position.distanceTo(state.queen.position);
          if (qd < 3.5) {
            state.queenHP -= p.damage;
            if (state.queenHP < 0) state.queenHP = 0;
            removeProjectile(i);
            continue;
          }
        }
      }

      // Collide player (alien / queen projectiles)
      if (p.type === 'acid' || p.type === 'queen') {
        var pdx = p.mesh.position.x - state.playerPos.x;
        var pdz = p.mesh.position.z - state.playerPos.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist < 1.0 && Math.abs(p.mesh.position.y - state.playerPos.y) < 1.5) {
          state.playerHP -= p.damage;
          removeProjectile(i);
          continue;
        }
      }

      // Beacon shot by player grenade (F key) check - beacon detection as a target
      if (p.type === 'grenade' && state.distressBeacon && state.distressBeacon.mesh) {
        var bcd = p.mesh.position.distanceTo(state.distressBeacon.mesh.position);
        if (bcd < 1.5) {
          // Activates supply drop
          triggerSupplyDrop();
          removeProjectile(i);
          continue;
        }
      }

      if (p.life <= 0) {
        removeProjectile(i);
      }
    }
  }

  function removeProjectile(i) {
    var p = state.projectiles[i];
    if (p.type !== 'beacon') {
      state.scene.remove(p.mesh);
    }
    state.projectiles.splice(i, 1);
  }

  function checkProjectileAlienHit(proj) {
    var allAliens = getAllAliens();
    for (var i = 0; i < allAliens.length; i++) {
      var alien = allAliens[i];
      if (!alien.alive) continue;
      var d = proj.mesh.position.distanceTo(alien.mesh.position);
      if (d < 1.2) return alien;
    }
    return null;
  }

  function explodeGrenade(proj) {
    var splash = proj.splash || 3;
    var allAliens = getAllAliens();
    for (var i = 0; i < allAliens.length; i++) {
      var alien = allAliens[i];
      if (!alien.alive) continue;
      var d = proj.mesh.position.distanceTo(alien.mesh.position);
      if (d < splash) {
        alien.hp -= proj.damage * (1 - d / splash);
        if (alien.hp <= 0) killAlien(alien);
      }
    }
    if (state.queen) {
      var qd = proj.mesh.position.distanceTo(state.queen.position);
      if (qd < splash) {
        state.queenHP -= proj.damage * (1 - qd / splash);
        if (state.queenHP < 0) state.queenHP = 0;
      }
    }
    // Player splash damage
    var pld = proj.mesh.position.distanceTo({ x: state.playerPos.x, y: state.playerPos.y, z: state.playerPos.z });
    // Workaround: compute distance manually
    var plDx = proj.mesh.position.x - state.playerPos.x;
    var plDz = proj.mesh.position.z - state.playerPos.z;
    var plDist = Math.sqrt(plDx * plDx + plDz * plDz);
    if (plDist < splash) {
      state.playerHP -= 20 * (1 - plDist / splash);
    }
    state.scene.remove(proj.mesh);
  }

  // ─── Acid pool damage ─────────────────────────────────────────────────
  function updateAcidPools(dt) {
    for (var i = 0; i < state.acidPools.length; i++) {
      var pool = state.acidPools[i];
      var dx = state.playerPos.x - pool.x;
      var dz = state.playerPos.z - pool.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < pool.radius) {
        state.playerHP -= 30 * dt;
      }
    }
  }

  // ─── Supply drop ──────────────────────────────────────────────────────
  function triggerSupplyDrop() {
    if (state.supplyDropTimer > 0) return;
    state.supplyDropTimer = 30;
  }

  function updateSupplyDrop(dt) {
    if (state.supplyDropTimer <= 0) return;
    state.supplyDropTimer -= dt;
    if (state.supplyDropTimer <= 0) {
      state.supplyDropTimer = 0;
      deliverSupplyPod();
    }
  }

  function deliverSupplyPod() {
    var THREE = window.THREE;
    var geo = new THREE.BoxGeometry(1, 1.5, 1);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4488FF });
    var pod = new THREE.Mesh(geo, mat);
    pod.position.set(state.playerPos.x + 3, 0.75, state.playerPos.z + 3);
    state.scene.add(pod);
    state.supplyPod = pod;

    // Auto-collect after 2s
    setTimeout(function () {
      if (state.supplyPod) {
        state.scene.remove(state.supplyPod);
        state.supplyPod = null;
        state.pulseRifleAmmo += 60;
        state.grenades += 1;
        state.distressBeacon = null;
      }
    }, 2000);
  }

  // ─── Kill alien ───────────────────────────────────────────────────────
  function killAlien(alien) {
    if (!alien.alive) return;
    alien.alive = false;
    state.scene.remove(alien.mesh);
    if (alien === state.broodmother) {
      state.broodmotherAlive = false;
      state.broodmother = null;
    }
  }

  function getAllAliens() {
    var list = [];
    for (var i = 0; i < state.drones.length; i++) {
      if (state.drones[i].alive) list.push(state.drones[i]);
    }
    for (var j = 0; j < state.warriors.length; j++) {
      if (state.warriors[j].alive) list.push(state.warriors[j]);
    }
    if (state.broodmother && state.broodmother.alive) list.push(state.broodmother);
    for (var k = 0; k < state.spitters.length; k++) {
      if (state.spitters[k].alive) list.push(state.spitters[k]);
    }
    return list;
  }

  function countAliveAliens() {
    return getAllAliens().length;
  }

  // ─── Flame particle update ─────────────────────────────────────────────
  function updateFlameParticles(dt) {
    for (var i = state.flameParticles.length - 1; i >= 0; i--) {
      var fp = state.flameParticles[i];
      fp.life -= dt;
      if (fp.life <= 0) {
        state.scene.remove(fp.mesh);
        state.flameParticles.splice(i, 1);
      }
    }
  }

  // ─── Player update ─────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (!state.playerDeployed) return;

    var speed = 8;
    var fwdX = -Math.sin(state.yaw);
    var fwdZ = -Math.cos(state.yaw);
    var rightX = Math.cos(state.yaw);
    var rightZ = -Math.sin(state.yaw);

    if (state.keys['w'] || state.keys['arrowup']) {
      state.playerPos.x += fwdX * speed * dt;
      state.playerPos.z += fwdZ * speed * dt;
    }
    if (state.keys['s'] || state.keys['arrowdown']) {
      state.playerPos.x -= fwdX * speed * dt;
      state.playerPos.z -= fwdZ * speed * dt;
    }
    if (state.keys['a'] || state.keys['arrowleft']) {
      state.playerPos.x -= rightX * speed * dt;
      state.playerPos.z -= rightZ * speed * dt;
    }
    if (state.keys['d'] || state.keys['arrowright']) {
      state.playerPos.x += rightX * speed * dt;
      state.playerPos.z += rightZ * speed * dt;
    }

    // Apply mouse look
    state.yaw -= state.mouseDX * 0.002;
    state.pitch -= state.mouseDY * 0.002;
    state.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.pitch));
    state.mouseDX = 0;
    state.mouseDY = 0;

    // Update player mesh
    if (state.playerMesh) {
      state.playerMesh.position.set(state.playerPos.x, state.playerPos.y - 0.1, state.playerPos.z);
      state.playerMesh.rotation.y = state.yaw;
    }

    // Camera follow
    state.camera.position.set(
      state.playerPos.x - fwdX * 0.1,
      state.playerPos.y + 1.5,
      state.playerPos.z - fwdZ * 0.1
    );
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.yaw;
    state.camera.rotation.x = state.pitch;

    // Flamethrower continuous if holding F (not grenade mode) — handled via key
    if (state.keys['e'] && state.activeWeapon === 'flamethrower') {
      fireFlamethrower(dt);
    }
  }

  // ─── Volcano light flicker ─────────────────────────────────────────────
  function updateVolcanoLights(dt) {
    for (var i = 0; i < state.volcanoLights.length; i++) {
      state.volcanoLights[i].intensity = 1.5 + Math.random() * 1.5;
    }
  }

  // ─── HUD ────────────────────────────────────────────────────────────────
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'sm-hud';
    hud.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;color:#00FF88;font-family:monospace;font-size:13px;background:rgba(0,0,0,0.6);padding:6px 10px;border:1px solid #00FF88;pointer-events:none;';
    document.body.appendChild(hud);
    state.hudEl = hud;

    // Exit instructions
    var exitHint = document.createElement('div');
    exitHint.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;color:#888;font-family:monospace;font-size:11px;pointer-events:none;';
    exitHint.textContent = '[ESC] Exit | [W/A/S/D] Move | [Click] Shoot | [E] Flamethrower | [F] Grenade/Beacon | [Tab] Weapon';
    document.body.appendChild(exitHint);
    state.exitHint = exitHint;
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var alienCount = countAliveAliens();
    var broodStatus = state.broodmotherAlive ? 'ALIVE' : 'DEAD';
    var queenHPDisplay = state.missionComplete ? '0' : Math.max(0, Math.round(state.queenHP));
    state.hudEl.textContent =
      'MARINES' +
      ' [ALIENS: ' + alienCount + ']' +
      ' [BROODMOTHER: ' + broodStatus + ']' +
      ' [QUEEN HP: ' + queenHPDisplay + ']' +
      ' [GRENADES: ' + state.grenades + ']' +
      ' | PHASE: ' + state.phase +
      ' | HP: ' + Math.max(0, Math.round(state.playerHP)) +
      ' | AMMO: ' + state.pulseRifleAmmo +
      ' | FUEL: ' + Math.round(Math.max(0, state.flamethrowerFuel)) +
      (state.supplyDropTimer > 0 ? ' | SUPPLY: ' + Math.ceil(state.supplyDropTimer) + 's' : '') +
      (state.missionComplete ? ' | MISSION COMPLETE!' : '');
  }

  function showMissionComplete() {
    var banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);z-index:10000;color:#FFD700;font-family:monospace;font-size:36px;font-weight:bold;text-shadow:0 0 20px #FF6600;pointer-events:none;';
    banner.textContent = '=== MISSION COMPLETE ===';
    document.body.appendChild(banner);
  }

  // ─── Input ─────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key.toLowerCase();
    state.keys[key] = true;

    if (key === 'escape') {
      deactivate();
      return;
    }
    if (key === 'f') {
      if (state.activeWeapon === 'rifle') {
        throwGrenade();
      } else {
        fireDistressBeacon();
      }
    }
    if (key === 'tab') {
      e.preventDefault();
      state.activeWeapon = state.activeWeapon === 'rifle' ? 'flamethrower' : 'rifle';
    }
  }

  function onKeyUp(e) {
    state.keys[e.key.toLowerCase()] = false;
  }

  function onMouseMove(e) {
    state.mouseDX += e.movementX || 0;
    state.mouseDY += e.movementY || 0;
  }

  function onMouseClick(e) {
    if (!state.playerDeployed) return;
    if (state.activeWeapon === 'rifle') {
      firePulseRifle();
    } else {
      fireFlamethrower(0.05);
    }
    // Request pointer lock for better FPS feel
    if (state.renderer && state.renderer.domElement && !document.pointerLockElement) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  // ─── Main loop ─────────────────────────────────────────────────────────
  function startLoop() {
    function loop() {
      if (!state.active) return;
      state.animId = requestAnimationFrame(loop);
      var dt = state.clock.getDelta();
      dt = Math.min(dt, 0.05); // cap at 50ms

      updatePod(dt);
      updatePlayer(dt);
      updateAliens(dt);
      updateQueen(dt);
      updateProjectiles(dt);
      updateAcidPools(dt);
      updateFlameParticles(dt);
      updateSupplyDrop(dt);
      updateVolcanoLights(dt);
      updateHUD();

      state.renderer.render(state.scene, state.camera);
    }
    loop();
  }

  // ─── Deactivate ────────────────────────────────────────────────────────
  function deactivate() {
    if (!state.active) return;
    state.active = false;
    if (state.animId) cancelAnimationFrame(state.animId);
    if (state.renderer && state.renderer.domElement && state.renderer.domElement.parentNode) {
      state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
    }
    if (state.hudEl && state.hudEl.parentNode) state.hudEl.parentNode.removeChild(state.hudEl);
    if (state.exitHint && state.exitHint.parentNode) state.exitHint.parentNode.removeChild(state.exitHint);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onMouseClick);
    if (document.exitPointerLock) document.exitPointerLock();

    // Reset state
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.clock = null;
    state.pod = null;
    state.podLanded = false;
    state.playerDeployed = false;
    state.playerMesh = null;
    state.playerPos = { x: 0, y: 1, z: 0 };
    state.playerHP = 200;
    state.grenades = 4;
    state.pulseRifleAmmo = 120;
    state.flamethrowerFuel = 100;
    state.activeWeapon = 'rifle';
    state.projectiles = [];
    state.flameParticles = [];
    state.drones = [];
    state.warriors = [];
    state.broodmother = null;
    state.broodmotherAlive = true;
    state.spitters = [];
    state.spitterFireTimers = [];
    state.queen = null;
    state.queenHP = 800;
    state.queenPhase = 'dormant';
    state.queenAttackTimer = 0;
    state.queenSpawnTimer = 0;
    state.acidPools = [];
    state.distressBeacon = null;
    state.supplyDropTimer = -1;
    state.supplyPod = null;
    state.hudEl = null;
    state.keys = {};
    state.yaw = 0;
    state.pitch = 0;
    state.mouseDX = 0;
    state.mouseDY = 0;
    state.volcanoLights = [];
    state.missionComplete = false;
    state.phase = 'INSERTION';
    state.broodSpawnTimer = 0;
  }

  // ─── Public API ────────────────────────────────────────────────────────
  window.SpaceMarines = {
    activate: activate,
    deactivate: deactivate,
    getState: function () { return state; }
  };

  // Listen for S+M activation combo
  document.addEventListener('keydown', handleActivationKey);

}(window));
