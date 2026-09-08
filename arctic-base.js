window.ArcticBase = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'ArcticBase';
  var ACTIVATION_KEY_A = 65;
  var ACTIVATION_KEY_B = 66;
  var ACTIVATION_WINDOW = 400;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    playerPos: { x: 0, y: 1, z: 0 },
    playerHP: 100,
    hypothermia: 0,
    insideBuilding: false,
    nearHeater: false,
    onSnowmobile: false,
    snowmobilePos: { x: 10, y: 0.5, z: 10 },
    snowmobileSway: 0,
    snowmobileSwayDir: 1,
    blizzardActive: false,
    blizzardTimer: 0,
    blizzardDuration: 45,
    blizzardCooldown: 120,
    blizzardNormalFog: 0.03,
    blizzardFogDensity: 0.03,
    cacheDestroyed: 0,
    cacheTotal: 3,
    score: 0,
    gameOver: false,
    lastTime: 0,
    animFrameId: null,
    objects: [],
    windParticles: [],
    enemies: [],
    caches: [],
    buildings: [],
    walkways: [],
    iceLakeActive: false,
    iceLakeCracking: false,
    iceLakeCrackTimer: 0,
    inWater: false,
    waterDeathTimer: 0,
    extractionReached: false,
    auroraGreen: null,
    auroraViolet: null,
    auroraTimer: 0,
    auroraPhase: 0,
    hudEl: null,
    hudInterval: null,
    keysDown: {},
    keyTimes: {},
    movementSpeed: 5,
    baseMovementSpeed: 5,
    blizzardMovePenalty: 0.8,
    heliExtracted: false
  };

  var BUILDING_COLORS = [0x556677, 0x667788, 0x445566];
  var ENEMY_COLOR = 0x334455;
  var CACHE_COLOR = 0xFF2200;
  var SNOWMOBILE_COLOR = 0x778899;
  var HEATER_COLOR = 0xFF6600;
  var ICE_COLOR = 0x88AACC;
  var HELI_COLOR = 0x445566;
  var WALKWAY_COLOR = 0x4A5A66;
  var SATELLITE_COLOR = 0x667788;
  var FUEL_TANK_COLOR = 0x332244;

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE.js not found');
      return;
    }

    setupScene();
    buildGround();
    buildBuildings();
    buildWalkways();
    buildSatelliteDish();
    buildFuelTank();
    buildIceLake();
    buildWeaponsCache();
    buildHelicopterExtraction();
    buildWindParticles();
    buildEnemies();
    buildAurora();
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
    state.windParticles = [];
    state.enemies = [];
    state.caches = [];
    state.buildings = [];
    state.walkways = [];
    state.scene = null;
    state.camera = null;
  }

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0xCCDDEE);
    state.scene.fog = new THREE.FogExp2(0xAABBCC, 0.03);

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 600);
    state.camera.position.set(0, 8, 30);
    state.camera.lookAt(0, 0, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0xCCDDFF, 0.5);
    state.scene.add(ambient);

    var sunLight = new THREE.DirectionalLight(0xEEEEFF, 0.8);
    sunLight.position.set(20, 50, 20);
    sunLight.castShadow = true;
    state.scene.add(sunLight);
  }

  function makeMesh(geo, mat) {
    var mesh = new THREE.Mesh(geo, mat);
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
  }

  function buildGround() {
    var groundGeo = new THREE.BoxGeometry(300, 1, 300);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0xEEEEFF });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.5, 0);
    ground.receiveShadow = true;
    state.scene.add(ground);
    state.objects.push(ground);
  }

  function buildBuildings() {
    var buildingDefs = [
      { x: 0,   z: 0,   w: 12, h: 6, d: 10, color: BUILDING_COLORS[0] },
      { x: 25,  z: -5,  w: 10, h: 5, d: 8,  color: BUILDING_COLORS[1] },
      { x: -22, z: 8,   w: 11, h: 5, d: 9,  color: BUILDING_COLORS[2] }
    ];

    for (var i = 0; i < buildingDefs.length; i++) {
      var bd = buildingDefs[i];
      var bGeo = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
      var bMat = new THREE.MeshLambertMaterial({ color: bd.color });
      var bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(bd.x, bd.h / 2, bd.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      bMesh.userData.isBuildingInterior = true;
      bMesh.userData.buildingIndex = i;
      bMesh.userData.bounds = {
        minX: bd.x - bd.w / 2,
        maxX: bd.x + bd.w / 2,
        minZ: bd.z - bd.d / 2,
        maxZ: bd.z + bd.d / 2
      };
      state.scene.add(bMesh);
      state.objects.push(bMesh);
      state.buildings.push(bMesh);

      // Heating unit inside each building
      var heaterGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var heaterMat = new THREE.MeshLambertMaterial({ color: HEATER_COLOR });
      var heater = new THREE.Mesh(heaterGeo, heaterMat);
      heater.position.set(bd.x + 2, 0.75, bd.z + 1);
      heater.userData.isHeater = true;
      heater.userData.heaterPos = { x: bd.x + 2, z: bd.z + 1 };
      var heaterLight = new THREE.PointLight(0xFF6600, 1.2, 8);
      heaterLight.position.set(bd.x + 2, 1.5, bd.z + 1);
      state.scene.add(heaterLight);
      state.scene.add(heater);
      state.objects.push(heater);

      // Roof platform for snipers (flat overhang)
      var roofGeo = new THREE.BoxGeometry(bd.w + 0.4, 0.3, bd.d + 0.4);
      var roofMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
      var roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(bd.x, bd.h + 0.15, bd.z);
      state.scene.add(roof);
      state.objects.push(roof);
    }
  }

  function buildWalkways() {
    var walkwayDefs = [
      { x1: 0,  z1: 0,  x2: 25,  z2: -5  },
      { x1: 0,  z1: 0,  x2: -22, z2: 8   }
    ];

    for (var i = 0; i < walkwayDefs.length; i++) {
      var wd = walkwayDefs[i];
      var mx = (wd.x1 + wd.x2) / 2;
      var mz = (wd.z1 + wd.z2) / 2;
      var dx = wd.x2 - wd.x1;
      var dz = wd.z2 - wd.z1;
      var length = Math.sqrt(dx * dx + dz * dz);
      var angle = Math.atan2(dx, dz);

      var wGeo = new THREE.BoxGeometry(2, 3, length);
      var wMat = new THREE.MeshLambertMaterial({ color: WALKWAY_COLOR });
      var wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.set(mx, 1.5, mz);
      wMesh.rotation.y = angle;
      wMesh.userData.isWalkway = true;
      state.scene.add(wMesh);
      state.objects.push(wMesh);
      state.walkways.push(wMesh);
    }
  }

  function buildSatelliteDish() {
    var poleGeo = new THREE.BoxGeometry(0.4, 4, 0.4);
    var poleMat = new THREE.MeshLambertMaterial({ color: SATELLITE_COLOR });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(3, 8, 2);
    state.scene.add(pole);
    state.objects.push(pole);

    var dishGeo = new THREE.ConeGeometry(3, 1.5, 12, 1, true);
    var dishMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC, side: THREE.DoubleSide });
    var dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(3, 11, 2);
    dish.rotation.x = Math.PI / 4;
    state.scene.add(dish);
    state.objects.push(dish);
  }

  function buildFuelTank() {
    var tankGeo = new THREE.BoxGeometry(4, 6, 4);
    var tankMat = new THREE.MeshLambertMaterial({ color: FUEL_TANK_COLOR });
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(-8, 3, -12);
    state.scene.add(tank);
    state.objects.push(tank);

    // Cylindrical-look bands
    for (var i = 0; i < 3; i++) {
      var bandGeo = new THREE.BoxGeometry(4.2, 0.3, 4.2);
      var bandMat = new THREE.MeshLambertMaterial({ color: 0x221133 });
      var band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(-8, 1.2 + i * 2, -12);
      state.scene.add(band);
      state.objects.push(band);
    }
  }

  function buildIceLake() {
    var lakeGeo = new THREE.BoxGeometry(30, 0.15, 25);
    var lakeMat = new THREE.MeshLambertMaterial({
      color: ICE_COLOR,
      transparent: true,
      opacity: 0.7
    });
    var lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.set(-40, 0.08, -30);
    lake.userData.isIceLake = true;
    lake.userData.bounds = {
      minX: -55, maxX: -25,
      minZ: -42.5, maxZ: -17.5
    };
    state.scene.add(lake);
    state.objects.push(lake);
    state.iceLakeMesh = lake;

    state.iceShards = [];
  }

  function buildIceShard(x, z) {
    var shardGeo = new THREE.BoxGeometry(
      1 + Math.random() * 2,
      0.2 + Math.random() * 0.3,
      1 + Math.random() * 2
    );
    var shardMat = new THREE.MeshLambertMaterial({
      color: 0xBBDDEE,
      transparent: true,
      opacity: 0.8
    });
    var shard = new THREE.Mesh(shardGeo, shardMat);
    shard.position.set(
      x + (Math.random() - 0.5) * 5,
      0.1,
      z + (Math.random() - 0.5) * 5
    );
    shard.rotation.y = Math.random() * Math.PI;
    shard.rotation.x = (Math.random() - 0.5) * 0.3;
    shard.userData.isShard = true;
    shard.userData.velY = 0.05 + Math.random() * 0.05;
    state.scene.add(shard);
    state.objects.push(shard);
    state.iceShards.push(shard);
  }

  function buildWeaponsCache() {
    var cacheDefs = [
      { x: 45, z: -20 },
      { x: 50, z: -15 },
      { x: 43, z: -10 }
    ];

    for (var i = 0; i < cacheDefs.length; i++) {
      var cd = cacheDefs[i];
      var cGeo = new THREE.BoxGeometry(2, 1.5, 3);
      var cMat = new THREE.MeshLambertMaterial({ color: CACHE_COLOR });
      var cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(cd.x, 0.75, cd.z);
      cMesh.userData.isCacheBox = true;
      cMesh.userData.cacheIndex = i;
      cMesh.userData.destroyed = false;
      var cLight = new THREE.PointLight(0xFF2200, 0.8, 6);
      cLight.position.set(cd.x, 2, cd.z);
      state.scene.add(cLight);
      state.scene.add(cMesh);
      state.objects.push(cMesh);
      state.caches.push(cMesh);
    }
  }

  function buildHelicopterExtraction() {
    var heliGeo = new THREE.BoxGeometry(8, 2, 14);
    var heliMat = new THREE.MeshLambertMaterial({ color: HELI_COLOR });
    var heli = new THREE.Mesh(heliGeo, heliMat);
    heli.position.set(0, 1, -60);
    heli.userData.isHeli = true;
    heli.userData.bounds = {
      minX: -4, maxX: 4,
      minZ: -67, maxZ: -53
    };

    var bladeGeo = new THREE.BoxGeometry(20, 0.2, 1);
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 2.1, 0);
    heli.add(blade);
    state.blade = blade;

    var heliLight = new THREE.PointLight(0xFFFF00, 1.5, 15);
    heliLight.position.set(0, 3, -60);
    state.scene.add(heliLight);
    state.scene.add(heli);
    state.objects.push(heli);
    state.heliMesh = heli;
  }

  function buildWindParticles() {
    var particleCount = 200;
    for (var i = 0; i < particleCount; i++) {
      var pGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      var pMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 120,
        Math.random() * 20,
        (Math.random() - 0.5) * 120
      );
      p.userData.speed = 3 + Math.random() * 4;
      p.userData.drift = (Math.random() - 0.5) * 0.5;
      state.scene.add(p);
      state.windParticles.push(p);
    }
  }

  function buildEnemies() {
    var enemyPositions = [
      { x: 20, z: 20 },
      { x: -20, z: 15 },
      { x: 35, z: -10 },
      { x: -30, z: -5 },
      { x: 10, z: -20 },
      { x: -10, z: -25 },
      { x: 40, z: 5 },
      // Rooftop snipers
      { x: 0, z: 0, rooftop: true, roofY: 6.3 },
      { x: 25, z: -5, rooftop: true, roofY: 5.3 },
      { x: -22, z: 8, rooftop: true, roofY: 5.3 }
    ];

    for (var i = 0; i < enemyPositions.length; i++) {
      var ep = enemyPositions[i];
      var yPos = ep.rooftop ? ep.roofY : 0;

      var eGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
      var eMat = new THREE.MeshLambertMaterial({ color: ENEMY_COLOR });
      var eMesh = new THREE.Mesh(eGeo, eMat);
      eMesh.position.set(ep.x, yPos + 0.9, ep.z);
      eMesh.userData.isEnemy = true;
      eMesh.userData.isSniper = !!ep.rooftop;
      eMesh.userData.hp = 100;
      eMesh.userData.alive = true;
      eMesh.userData.patrolDir = (Math.random() - 0.5) * 2;
      eMesh.userData.patrolTimer = 0;

      if (ep.rooftop) {
        // Scope glow: LineSegments
        var scopeGeo = new THREE.BufferGeometry();
        var scopeVerts = new Float32Array([
          0, 0.9, 0,
          0, 0.9, -2
        ]);
        scopeGeo.setAttribute('position', new THREE.BufferAttribute(scopeVerts, 3));
        var scopeMat = new THREE.LineBasicMaterial({ color: 0x00FF88 });
        var scopeLine = new THREE.LineSegments(scopeGeo, scopeMat);
        eMesh.add(scopeLine);

        var glowLight = new THREE.PointLight(0x00FF88, 0.5, 3);
        glowLight.position.set(0, 0.9, -1);
        eMesh.add(glowLight);
      }

      state.scene.add(eMesh);
      state.objects.push(eMesh);
      state.enemies.push(eMesh);
    }
  }

  function buildSnowmobile() {
    var bodyGeo = new THREE.BoxGeometry(3, 1, 5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: SNOWMOBILE_COLOR });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(state.snowmobilePos.x, state.snowmobilePos.y, state.snowmobilePos.z);
    body.userData.isSnowmobile = true;
    state.scene.add(body);
    state.objects.push(body);
    state.snowmobileMesh = body;

    // Ski runners
    var skiOffsets = [
      { x: -1.2, z: 0 },
      { x: 1.2,  z: 0 }
    ];
    for (var s = 0; s < skiOffsets.length; s++) {
      var skiGeo = new THREE.SphereGeometry(0.3, 6, 4);
      var skiMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
      var ski = new THREE.Mesh(skiGeo, skiMat);
      ski.position.set(
        state.snowmobilePos.x + skiOffsets[s].x,
        state.snowmobilePos.y - 0.35,
        state.snowmobilePos.z
      );
      ski.scale.set(1, 0.4, 3);
      state.scene.add(ski);
      state.objects.push(ski);
    }
  }

  function buildAurora() {
    state.auroraGreen = new THREE.PointLight(0x00FF88, 0, 200);
    state.auroraGreen.position.set(0, 80, 0);
    state.scene.add(state.auroraGreen);

    state.auroraViolet = new THREE.PointLight(0x8800FF, 0, 200);
    state.auroraViolet.position.set(20, 90, -20);
    state.scene.add(state.auroraViolet);
  }

  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:0',
      'width:100%',
      'text-align:center',
      'color:#EEFFFF',
      'font-family:monospace',
      'font-size:14px',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 6px #003355'
    ].join(';');
    document.body.appendChild(state.hudEl);
    updateHUD();
    state.hudInterval = setInterval(updateHUD, 200);
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var temp = Math.round(state.hypothermia);
    var blizzStr = state.blizzardActive ? 'ON' : 'OFF';
    var smStr = state.onSnowmobile ? 'MOUNTED' : 'AVAILABLE';
    var hostility = state.enemies.filter(function (e) { return e.userData.alive; }).length;
    state.hudEl.textContent = (
      'ARCTIC [TEMP: ' + temp + '%] ' +
      '[HOSTILITY: ' + hostility + '] ' +
      '[CACHE: ' + state.cacheDestroyed + '/' + state.cacheTotal + '] ' +
      '[BLIZZARD: ' + blizzStr + '] | ' +
      'SNOWMOBILE: ' + smStr
    );
  }

  function isInsideBuilding() {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    for (var i = 0; i < state.buildings.length; i++) {
      var b = state.buildings[i].userData.bounds;
      if (px > b.minX && px < b.maxX && pz > b.minZ && pz < b.maxZ) {
        return true;
      }
    }
    return false;
  }

  function isNearHeater() {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var threshold = 3;
    for (var i = 0; i < state.buildings.length; i++) {
      var bMesh = state.buildings[i];
      var hx = bMesh.userData.bounds.minX + 2 + (bMesh.userData.bounds.maxX - bMesh.userData.bounds.minX) / 2 + 0.5;
      var hz = bMesh.position.z + 1;
      var dx = px - (bMesh.position.x + 2);
      var dz = pz - (bMesh.position.z + 1);
      if (Math.sqrt(dx * dx + dz * dz) < threshold) {
        return true;
      }
    }
    return false;
  }

  function isOnIceLake() {
    if (!state.iceLakeMesh) return false;
    var b = state.iceLakeMesh.userData.bounds;
    return (
      state.playerPos.x > b.minX && state.playerPos.x < b.maxX &&
      state.playerPos.z > b.minZ && state.playerPos.z < b.maxZ
    );
  }

  function isNearCache(index) {
    var c = state.caches[index];
    if (!c || c.userData.destroyed) return false;
    var dx = state.playerPos.x - c.position.x;
    var dz = state.playerPos.z - c.position.z;
    return Math.sqrt(dx * dx + dz * dz) < 3;
  }

  function isNearHeli() {
    if (!state.heliMesh) return false;
    var b = state.heliMesh.userData.bounds;
    return (
      state.playerPos.x > b.minX && state.playerPos.x < b.maxX &&
      state.playerPos.z > b.minZ && state.playerPos.z < b.maxZ
    );
  }

  function isNearSnowmobile() {
    if (state.onSnowmobile || !state.snowmobileMesh) return false;
    var dx = state.playerPos.x - state.snowmobileMesh.position.x;
    var dz = state.playerPos.z - state.snowmobileMesh.position.z;
    return Math.sqrt(dx * dx + dz * dz) < 4;
  }

  function destroyCache(index) {
    var c = state.caches[index];
    if (!c || c.userData.destroyed) return;
    c.userData.destroyed = true;
    c.visible = false;
    state.cacheDestroyed++;

    var bonus = state.blizzardActive ? 800 + 400 : 800;
    if (state.cacheDestroyed >= state.cacheTotal) {
      state.score += bonus;
    }
  }

  function updateBlizzard(dt) {
    if (state.blizzardActive) {
      state.blizzardTimer -= dt;
      if (state.blizzardTimer <= 0) {
        // End blizzard
        state.blizzardActive = false;
        state.blizzardTimer = state.blizzardCooldown;
        state.blizzardFogDensity = state.blizzardNormalFog;
        state.movementSpeed = state.baseMovementSpeed;
        if (state.scene && state.scene.fog) {
          state.scene.fog.density = state.blizzardNormalFog;
        }
      }
    } else {
      state.blizzardTimer -= dt;
      if (state.blizzardTimer <= 0) {
        // Start blizzard
        state.blizzardActive = true;
        state.blizzardTimer = state.blizzardDuration;
        state.blizzardFogDensity = state.blizzardNormalFog * 2;
        state.movementSpeed = state.baseMovementSpeed * state.blizzardMovePenalty;
        if (state.scene && state.scene.fog) {
          state.scene.fog.density = state.blizzardFogDensity;
        }
      }
    }
  }

  function updateHypothermia(dt) {
    if (state.gameOver) return;

    if (state.insideBuilding) {
      // Cool down inside
      state.hypothermia -= 10 * dt;
      if (state.hypothermia < 0) state.hypothermia = 0;
    } else {
      // Heat up outside (faster in blizzard)
      var rate = 5;
      if (state.blizzardActive) rate = 8;
      state.hypothermia += rate * dt;
      if (state.hypothermia > 100) state.hypothermia = 100;
    }

    if (state.nearHeater) {
      state.hypothermia -= 20 * dt;
      if (state.hypothermia < 0) state.hypothermia = 0;
    }

    if (state.hypothermia >= 100) {
      state.playerHP -= 5 * dt;
      if (state.playerHP <= 0) {
        state.playerHP = 0;
        triggerGameOver('HYPOTHERMIA - FROZEN SOLID');
      }
    }
  }

  function updateWaterDeath(dt) {
    if (!state.inWater) return;
    state.waterDeathTimer += dt;
    state.hypothermia = Math.min(100, state.hypothermia + 15 * dt);
    if (state.waterDeathTimer >= 10) {
      triggerGameOver('FELL THROUGH ICE - COLD WATER DEATH');
    }
  }

  function updateIceLake(dt) {
    var onIce = isOnIceLake();
    if (onIce && !state.inWater) {
      if (!state.iceLakeCracking) {
        state.iceLakeCracking = true;
        state.iceLakeCrackTimer = 0;
      }
      state.iceLakeCrackTimer += dt;

      // Spawn shards progressively
      if (state.iceLakeCrackTimer > 0.5 && state.iceShards.length < 8) {
        buildIceShard(state.playerPos.x, state.playerPos.z);
      }

      // Fall through after prolonged stay or fast movement
      if (state.iceLakeCrackTimer > 3 || (state.onSnowmobile && state.iceLakeCrackTimer > 1)) {
        state.inWater = true;
        state.waterDeathTimer = 0;
      }
    } else if (!onIce) {
      state.iceLakeCracking = false;
      state.iceLakeCrackTimer = 0;
    }

    // Animate shard pieces
    for (var i = 0; i < state.iceShards.length; i++) {
      var sh = state.iceShards[i];
      sh.position.y -= sh.userData.velY * dt;
      sh.rotation.x += 0.5 * dt;
      sh.rotation.z += 0.3 * dt;
    }
  }

  function updateWindParticles(dt) {
    for (var i = 0; i < state.windParticles.length; i++) {
      var p = state.windParticles[i];
      var spd = p.userData.speed * (state.blizzardActive ? 2.5 : 1);
      p.position.x += spd * dt;
      p.position.z += p.userData.drift * dt;
      p.position.y -= 0.3 * dt;

      if (p.position.x > 60) p.position.x = -60;
      if (p.position.y < 0) {
        p.position.y = 18 + Math.random() * 5;
        p.position.x = -60 + Math.random() * 20;
      }
    }
  }

  function updateEnemies(dt) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.userData.alive) continue;

      if (!e.userData.isSniper) {
        // Ground patrol
        e.userData.patrolTimer += dt;
        if (e.userData.patrolTimer > 3) {
          e.userData.patrolDir = (Math.random() - 0.5) * 2;
          e.userData.patrolTimer = 0;
        }
        var speed = state.blizzardActive ? 1 : 1.5;
        e.position.x += e.userData.patrolDir * speed * dt;
        e.position.z += (Math.random() - 0.5) * 0.5 * dt;
      } else {
        // Rooftop sniper slight sway
        e.userData.patrolTimer += dt;
        e.rotation.y = Math.sin(e.userData.patrolTimer * 0.4) * 0.6;
      }
    }
  }

  function updateAurora(dt) {
    state.auroraTimer += dt * 0.3;
    var greenIntensity = (Math.sin(state.auroraTimer) + 1) / 2;
    var violetIntensity = (Math.cos(state.auroraTimer * 0.7) + 1) / 2;
    if (state.auroraGreen) state.auroraGreen.intensity = greenIntensity * 1.5;
    if (state.auroraViolet) state.auroraViolet.intensity = violetIntensity * 1.5;
  }

  function updateSnowmobile(dt) {
    if (!state.snowmobileMesh) return;
    if (state.onSnowmobile) {
      // Sway physics
      state.snowmobileSway += state.snowmobileSwayDir * 0.8 * dt;
      if (Math.abs(state.snowmobileSway) > 0.15) {
        state.snowmobileSwayDir *= -1;
      }
      state.snowmobileMesh.rotation.z = state.snowmobileSway;
    }
  }

  function updateCamera() {
    if (state.onSnowmobile) {
      state.camera.position.set(
        state.snowmobilePos.x,
        state.snowmobilePos.y + 6,
        state.snowmobilePos.z + 20
      );
      state.camera.lookAt(
        state.snowmobilePos.x,
        state.snowmobilePos.y,
        state.snowmobilePos.z
      );
    } else {
      state.camera.position.set(
        state.playerPos.x,
        state.playerPos.y + 6,
        state.playerPos.z + 20
      );
      state.camera.lookAt(
        state.playerPos.x,
        state.playerPos.y,
        state.playerPos.z
      );
    }
  }

  function updateHeliBlade(dt) {
    if (state.blade) {
      state.blade.rotation.y += 5 * dt;
    }
  }

  function processInput(dt) {
    if (state.gameOver) return;

    var speed = state.movementSpeed;
    if (state.onSnowmobile) speed = 12;

    var moved = false;

    if (state.keysDown['ArrowUp'] || state.keysDown['w'] || state.keysDown['W']) {
      if (state.onSnowmobile) {
        state.snowmobilePos.z -= speed * dt;
        state.snowmobileMesh && (state.snowmobileMesh.position.z = state.snowmobilePos.z);
        state.playerPos.z = state.snowmobilePos.z;
      } else {
        state.playerPos.z -= speed * dt;
      }
      moved = true;
    }
    if (state.keysDown['ArrowDown'] || state.keysDown['s'] || state.keysDown['S']) {
      if (state.onSnowmobile) {
        state.snowmobilePos.z += speed * dt;
        state.snowmobileMesh && (state.snowmobileMesh.position.z = state.snowmobilePos.z);
        state.playerPos.z = state.snowmobilePos.z;
      } else {
        state.playerPos.z += speed * dt;
      }
      moved = true;
    }
    if (state.keysDown['ArrowLeft'] || state.keysDown['a'] || state.keysDown['A']) {
      if (state.onSnowmobile) {
        state.snowmobilePos.x -= speed * dt;
        state.snowmobileMesh && (state.snowmobileMesh.position.x = state.snowmobilePos.x);
        state.playerPos.x = state.snowmobilePos.x;
      } else {
        state.playerPos.x -= speed * dt;
      }
      moved = true;
    }
    if (state.keysDown['ArrowRight'] || state.keysDown['d'] || state.keysDown['D']) {
      if (state.onSnowmobile) {
        state.snowmobilePos.x += speed * dt;
        state.snowmobileMesh && (state.snowmobileMesh.position.x = state.snowmobilePos.x);
        state.playerPos.x = state.snowmobilePos.x;
      } else {
        state.playerPos.x += speed * dt;
      }
      moved = true;
    }

    // Check extraction
    if (state.cacheDestroyed >= state.cacheTotal && isNearHeli() && !state.heliExtracted) {
      state.heliExtracted = true;
      state.score += 1000;
      triggerVictory();
    }

    // Struggle to climb out of water
    if (state.inWater && state.keysDown['e'] || state.keysDown['E']) {
      state.inWater = false;
      state.waterDeathTimer = 0;
      state.playerPos.y = 1;
    }

    state.insideBuilding = isInsideBuilding();
    state.nearHeater = isNearHeater();
  }

  function triggerGameOver(reason) {
    if (state.gameOver) return;
    state.gameOver = true;
    var msg = document.createElement('div');
    msg.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FF4444',
      'font-family:monospace',
      'font-size:28px',
      'z-index:99999',
      'text-align:center',
      'text-shadow:0 0 12px #FF0000'
    ].join(';');
    msg.textContent = 'MISSION FAILED: ' + reason;
    document.body.appendChild(msg);
  }

  function triggerVictory() {
    var msg = document.createElement('div');
    msg.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:28px',
      'z-index:99999',
      'text-align:center',
      'text-shadow:0 0 12px #00FF88'
    ].join(';');
    msg.textContent = 'MISSION COMPLETE! SCORE: ' + state.score;
    document.body.appendChild(msg);
  }

  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
    state.lastTime = timestamp;
    if (dt <= 0) dt = 0.016;

    processInput(dt);
    updateBlizzard(dt);
    updateHypothermia(dt);
    updateWaterDeath(dt);
    updateIceLake(dt);
    updateWindParticles(dt);
    updateEnemies(dt);
    updateAurora(dt);
    updateSnowmobile(dt);
    updateHeliBlade(dt);
    updateCamera();

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  function onKeyDown(e) {
    state.keysDown[e.key] = true;
    var now = Date.now();
    state.keyTimes[e.key] = now;

    // Mount/dismount snowmobile with V
    if (e.key === 'v' || e.key === 'V') {
      if (!state.onSnowmobile && isNearSnowmobile()) {
        state.onSnowmobile = true;
        if (!state.snowmobileMesh) buildSnowmobile();
      } else if (state.onSnowmobile) {
        state.onSnowmobile = false;
        state.playerPos.x = state.snowmobilePos.x + 3;
        state.playerPos.z = state.snowmobilePos.z;
      }
    }

    // Destroy cache with F
    if (e.key === 'f' || e.key === 'F') {
      for (var i = 0; i < state.caches.length; i++) {
        if (isNearCache(i)) {
          destroyCache(i);
          break;
        }
      }
    }

    // Check A+B activation for destroy (this module is always active after init)
    var aTime = state.keyTimes['a'] || state.keyTimes['A'] || 0;
    var bTime = state.keyTimes['b'] || state.keyTimes['B'] || 0;
    if (aTime && bTime && Math.abs(aTime - bTime) < ACTIVATION_WINDOW) {
      // Already active, no double-init needed
    }
  }

  function onKeyUp(e) {
    state.keysDown[e.key] = false;
  }

  function onResize() {
    if (!state.camera || !state.renderer) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(w, h);
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
  }

  function unbindKeys() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
  }

  // A+B simultaneous keypress activation (both within 400ms)
  var _pendingKeyTimes = {};

  function handleActivationKey(e) {
    var key = e.key;
    var now = Date.now();
    if (key === 'a' || key === 'A') {
      _pendingKeyTimes['A'] = now;
    }
    if (key === 'b' || key === 'B') {
      _pendingKeyTimes['B'] = now;
    }
    var tA = _pendingKeyTimes['A'] || 0;
    var tB = _pendingKeyTimes['B'] || 0;
    if (tA && tB && Math.abs(tA - tB) < ACTIVATION_WINDOW) {
      _pendingKeyTimes = {};
      if (!state.active) {
        init();
      } else {
        destroy();
      }
    }
  }

  document.addEventListener('keydown', handleActivationKey);

  return {
    init: init,
    destroy: destroy,
    getState: function () { return state; }
  };
})();
