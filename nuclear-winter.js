/* ───────────────────────────────────────────────────────────────────────────
   nuclear-winter.js — Nuclear Winter Survival FPS Module
   API: window.NuclearWinter = { init, update, reset }
   Activation: N + W simultaneous keypress (both keys within 400ms)

   Goal: Survive the post-nuclear wasteland and reach the evac bunker 1km north.

   Survival Meters (0–100%):
     RADIATION — drains slowly, hotspots accelerate, gas mask halves gain
     COLD      — drains faster outdoors; shelter/campfire/blanket slows it
     HUNGER    — drains slowest; food reduces it

   Each meter at 100% causes 10 HP/s drain. HP hits 0 → death.

   Zones: 5 zones across 300u of north travel.
   Zone 5 end: evac bunker (needs 2 resource items as toll).

   Controls:
     N + W   → activate Nuclear Winter
     WASD    → move player
     Mouse   → look (pointer lock)
     Click   → fire (melee punch)
     R       → check Geiger counter (logs radiation level)
     F       → light campfire (with firewood)
     E       → interact / pick up / enter shelter / use bunker toll
   ─────────────────────────────────────────────────────────────────────────── */

window.NuclearWinter = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Key-combo: N+W within 400ms ─────────────────────────────────────── */
  var _comboTimes = { N: 0, W: 0 };
  var COMBO_WINDOW = 400;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active  = false;
  var _victory = false;
  var _defeat  = false;
  var _gameOver = false;
  var _lastTime = 0;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerHP      = 100;
  var _playerMaxHP   = 100;
  var _playerPos     = { x: 0, y: 1.7, z: 0 };
  var _playerSpeed   = 6;
  var _yaw           = 0;
  var _pitch         = 0;

  /* ── Survival meters ───────────────────────────────────────────────────── */
  var _radiation  = 0;   // 0–100
  var _cold       = 0;   // 0–100
  var _hunger     = 0;   // 0–100

  var _radDrainBase    = 0.5;   // % per second baseline
  var _coldDrainBase   = 1.2;
  var _hungerDrainBase = 0.4;

  /* ── Status effects ────────────────────────────────────────────────────── */
  var _gasMaskTimer   = 0;    // seconds remaining (halves rad gain)
  var _blanketTimer   = 0;    // seconds remaining (-30 cold applied already, cold drain -0)
  var _blanketActive  = false;
  var _campfireTimer  = 0;    // campfire active: -20 cold/s for 60s
  var _inShelter      = false;
  var _nearShelter    = false;
  var _nearBunker     = false;

  /* ── Inventory / resources ─────────────────────────────────────────────── */
  var _inventory = [];   // array of resource type strings
  var _firewood  = 0;    // count of firewood in inventory

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys      = {};
  var _mouseX    = 0;
  var _mouseY    = 0;
  var _mouseDown = false;
  var _pointerLocked = false;

  /* ── Scene objects ─────────────────────────────────────────────────────── */
  var _envObjects   = [];
  var _enemies      = [];    // { mesh, type, hp, maxHp, pos, vel, alive, radOnHit, hitTimer, drops }
  var _resources    = [];    // { mesh, type, pos, collected }
  var _shelters     = [];    // { mesh, bounds, pos }
  var _hotspots     = [];    // { mesh, light, pos, radius }
  var _fogPatches   = [];    // { light, pos, radius }
  var _campfireMesh = null;
  var _bunkerMesh   = null;
  var _bunkerLight  = null;
  var _frozenRiver  = null;

  /* ── Weather / events ──────────────────────────────────────────────────── */
  var _eventTimer        = 90;
  var _acidRainActive    = false;
  var _acidRainTimer     = 0;
  var _acidRainOverlay   = null;
  var _blizzardActive    = false;
  var _blizzardTimer     = 0;
  var _convoyActive      = false;
  var _convoyTimer       = 0;
  var _convoyRaiders     = [];

  /* ── Original fog ─────────────────────────────────────────────────────── */
  var _baseFogDensity    = 0.015;
  var _savedFog          = null;
  var _savedBg           = null;

  /* ── Projectiles (melee: short-range ray) / attack cooldown ───────────── */
  var _attackCooldown = 0;
  var _hitFlashTimer  = 0;

  /* ── Zone & distance tracking ─────────────────────────────────────────── */
  var _distanceTravelled = 0;   // units north (z negative = north)
  var _totalDistance     = 300; // units for full journey
  var ZONE_LENGTH        = 60;  // each zone = 60u

  /* ── Bunker toll ─────────────────────────────────────────────────────────*/
  var _bunkerTollPaid = false;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud         = null;
  var _msgEl       = null;
  var _msgTimer    = 0;
  var _endEl       = null;

  /* ── Ambient light ─────────────────────────────────────────────────────── */
  var _ambientLight = null;
  var _dirLight     = null;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, emissive, emissiveInt) {
    var mat;
    if (emissive !== undefined) {
      mat = new THREE.MeshLambertMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: (emissiveInt !== undefined ? emissiveInt : 0.4)
      });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }
    return new THREE.Mesh(geo, mat);
  }

  function makeWireBox(w, h, d, color) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat  = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(edges, mat);
  }

  /* ════════════════════════════════════════════════════════════════════════
     WORLD CONSTRUCTION
  ════════════════════════════════════════════════════════════════════════ */

  function buildWorld() {
    var i, mesh, geo, x, z, w, h, d, angle;

    /* Ground – ash grey plane */
    geo  = new THREE.BoxGeometry(200, 0.5, 400);
    mesh = makeMesh(geo, 0x2A2A2A);
    mesh.position.set(0, -0.25, -150);
    _scene.add(mesh);
    _envObjects.push(mesh);

    /* 20 ash mounds */
    for (i = 0; i < 20; i++) {
      w = 2 + Math.random() * 4;
      h = 0.6 + Math.random() * 1.5;
      d = 2 + Math.random() * 4;
      geo  = new THREE.BoxGeometry(w, h, d);
      mesh = makeMesh(geo, 0x3A3A3A);
      x = (Math.random() - 0.5) * 160;
      z = -Math.random() * 280 - 10;
      mesh.position.set(x, h * 0.5, z);
      _scene.add(mesh);
      _envObjects.push(mesh);
    }

    /* Frozen river — zone 3 (z = -120 to -140) */
    geo  = new THREE.BoxGeometry(60, 0.15, 20);
    _frozenRiver = makeMesh(geo, 0x334444);
    _frozenRiver.position.set(0, 0.05, -130);
    _scene.add(_frozenRiver);
    _envObjects.push(_frozenRiver);

    /* 4 ruined city clusters */
    var cityCenters = [
      { x: -30, z: -50 },
      { x:  30, z: -90 },
      { x: -25, z: -160 },
      { x:  25, z: -220 }
    ];
    for (i = 0; i < cityCenters.length; i++) {
      buildCity(cityCenters[i].x, cityCenters[i].z);
    }

    /* 6 radiation hotspot craters */
    var hotColors = [0x44FF22, 0x33EE11, 0x55FF33];
    for (i = 0; i < 6; i++) {
      x = (Math.random() - 0.5) * 120;
      z = -30 - Math.random() * 240;
      geo = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 6);
      mesh = makeMesh(geo, 0x224422, 0x44FF22, 0.6);
      mesh.position.set(x, 0.2, z);
      _scene.add(mesh);
      _envObjects.push(mesh);

      var pLight = new THREE.PointLight(hotColors[i % hotColors.length], 1.5, 18);
      pLight.position.set(x, 1.5, z);
      _scene.add(pLight);

      _hotspots.push({ mesh: mesh, light: pLight, pos: { x: x, z: z }, radius: 8 });
    }

    /* Radioactive fog patches (green glow PointLights) */
    for (i = 0; i < 6; i++) {
      x = (Math.random() - 0.5) * 140;
      z = -20 - Math.random() * 250;
      var fLight = new THREE.PointLight(0x22FF22, 0.8, 22);
      fLight.position.set(x, 2, z);
      _scene.add(fLight);
      _fogPatches.push({ light: fLight, pos: { x: x, z: z }, radius: 12 });
    }

    /* 3 shelter buildings (enterable) */
    var shelterPos = [
      { x: 10,  z: -55 },
      { x: -15, z: -140 },
      { x: 20,  z: -230 }
    ];
    for (i = 0; i < 3; i++) {
      buildShelter(shelterPos[i].x, shelterPos[i].z);
    }

    /* Evac bunker at end */
    buildBunker(0, -295);

    /* Resources scattered across zones */
    spawnResources();

    /* Enemies */
    spawnEnemies();
  }

  function buildCity(cx, cz) {
    var i, mesh, geo, bx, bz, bw, bh, bd;
    for (i = 0; i < 8; i++) {
      bx = cx + (Math.random() - 0.5) * 40;
      bz = cz + (Math.random() - 0.5) * 40;
      bw = 5 + Math.random() * 6;
      bd = 5 + Math.random() * 6;
      bh = 4 + Math.random() * 10;
      geo  = new THREE.BoxGeometry(bw, bh, bd);
      mesh = makeMesh(geo, 0x444444);
      mesh.position.set(bx, bh * 0.5, bz);
      _scene.add(mesh);
      _envObjects.push(mesh);

      /* Collapsed floor slab */
      geo  = new THREE.BoxGeometry(bw * 0.85, 0.3, bd * 0.85);
      mesh = makeMesh(geo, 0x3A3A3A);
      var floorY = 0.5 + Math.random() * (bh * 0.5);
      mesh.position.set(
        bx + (Math.random() - 0.5) * 1.5,
        floorY,
        bz + (Math.random() - 0.5) * 1.5
      );
      mesh.rotation.z = (Math.random() - 0.5) * 0.3;
      _scene.add(mesh);
      _envObjects.push(mesh);
    }
  }

  function buildShelter(sx, sz) {
    var geo, mesh;
    /* Simple box shelter */
    geo  = new THREE.BoxGeometry(10, 4, 10);
    mesh = makeMesh(geo, 0x555555);
    mesh.position.set(sx, 2, sz);
    _scene.add(mesh);
    _envObjects.push(mesh);

    /* Doorway outline */
    var doorLines = makeWireBox(2.5, 3.5, 0.2, 0x888888);
    doorLines.position.set(sx, 1.75, sz + 5.05);
    _scene.add(doorLines);
    _envObjects.push(doorLines);

    _shelters.push({
      mesh: mesh,
      pos: { x: sx, z: sz },
      bounds: { xMin: sx - 5, xMax: sx + 5, zMin: sz - 5, zMax: sz + 5 }
    });
  }

  function buildBunker(bx, bz) {
    var geo, mesh;
    geo  = new THREE.BoxGeometry(16, 5, 20);
    _bunkerMesh = makeMesh(geo, 0x334455);
    _bunkerMesh.position.set(bx, 2.5, bz);
    _scene.add(_bunkerMesh);
    _envObjects.push(_bunkerMesh);

    /* Bunker sign – wireframe outline */
    var sign = makeWireBox(14, 4, 18, 0x4466AA);
    sign.position.set(bx, 2.5, bz);
    _scene.add(sign);
    _envObjects.push(sign);

    /* Blue light over bunker */
    _bunkerLight = new THREE.PointLight(0x3355FF, 2, 30);
    _bunkerLight.position.set(bx, 8, bz);
    _scene.add(_bunkerLight);

    /* 5 survivor boxes inside bunker */
    for (var i = 0; i < 5; i++) {
      var sg = new THREE.BoxGeometry(0.6, 1.7, 0.6);
      var sm = makeMesh(sg, 0x556677);
      sm.position.set(bx + (i - 2) * 2.5, 0.85 + 2.5, bz);
      _scene.add(sm);
      _envObjects.push(sm);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESOURCES
  ════════════════════════════════════════════════════════════════════════ */

  function spawnResources() {
    var i, x, z, type, mesh, geo;
    var types = ['food', 'food', 'blanket', 'radx', 'radx', 'gasmask', 'firewood', 'firewood',
                 'food', 'blanket', 'radx', 'firewood', 'food', 'radx', 'gasmask'];
    for (i = 0; i < types.length; i++) {
      type = types[i];
      x = (Math.random() - 0.5) * 140;
      z = -10 - Math.random() * 270;

      if (type === 'firewood') {
        geo  = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 6);
        mesh = makeMesh(geo, 0x664422);
      } else if (type === 'radx') {
        geo  = new THREE.BoxGeometry(0.5, 0.8, 0.5);
        mesh = makeMesh(geo, 0x44FF22, 0x22AA00, 0.5);
      } else if (type === 'gasmask') {
        geo  = new THREE.BoxGeometry(0.7, 0.6, 0.5);
        mesh = makeMesh(geo, 0x555555);
      } else {
        /* food and blanket share appearance but different color */
        geo  = new THREE.BoxGeometry(0.6, 0.5, 0.8);
        mesh = makeMesh(geo, 0x886644);
      }

      mesh.position.set(x, 0.5, z);
      _scene.add(mesh);
      _resources.push({ mesh: mesh, type: type, pos: { x: x, z: z }, collected: false });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMIES
  ════════════════════════════════════════════════════════════════════════ */

  function spawnEnemies() {
    var i, x, z, enemy;

    /* 8 wasteland raiders */
    for (i = 0; i < 8; i++) {
      x = (Math.random() - 0.5) * 120;
      z = -15 - Math.random() * 240;
      enemy = makeEnemy('raider', x, z);
      _enemies.push(enemy);
    }

    /* Radiation wolves (5) */
    for (i = 0; i < 5; i++) {
      x = (Math.random() - 0.5) * 130;
      z = -20 - Math.random() * 250;
      enemy = makeEnemy('wolf', x, z);
      _enemies.push(enemy);
    }

    /* Mutant boss per zone (5 total) */
    for (i = 0; i < 5; i++) {
      x = (Math.random() - 0.5) * 80;
      z = -(i + 1) * ZONE_LENGTH + 5;
      enemy = makeEnemy('mutant', x, z);
      _enemies.push(enemy);
    }
  }

  function makeEnemy(type, x, z) {
    var mesh, geo, speed, hp, radOnHit, drops;
    if (type === 'raider') {
      geo       = new THREE.BoxGeometry(1, 1.8, 0.6);
      mesh      = makeMesh(geo, 0x554433);
      hp        = 80;
      speed     = 3.5;
      radOnHit  = 0;
      drops     = 0;
    } else if (type === 'wolf') {
      geo       = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
      mesh      = makeMesh(geo, 0x227722, 0x00AA00, 0.5);
      hp        = 50;
      speed     = 6;
      radOnHit  = 10;
      drops     = 0;
    } else {
      /* mutant */
      geo       = new THREE.BoxGeometry(2, 3.6, 1.2);
      mesh      = makeMesh(geo, 0x557744);
      hp        = 200;
      speed     = 2;
      radOnHit  = 0;
      drops     = 3;
    }
    mesh.position.set(x, (type === 'mutant' ? 1.8 : (type === 'wolf' ? 0.6 : 0.9)), z);
    _scene.add(mesh);
    return {
      mesh: mesh,
      type: type,
      hp: hp,
      maxHp: hp,
      pos: { x: x, z: z },
      vel: { x: 0, z: 0 },
      alive: true,
      radOnHit: radOnHit,
      hitTimer: 0,
      drops: drops,
      alertRange: (type === 'raider' ? 25 : (type === 'wolf' ? 35 : 30)),
      attackRange: (type === 'raider' ? 2 : (type === 'wolf' ? 2.5 : 3)),
      attackCooldown: 0,
      speed: speed
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'nw-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#AAFFAA',
      'font:bold 13px monospace',
      'padding:5px 14px',
      'border:1px solid #334433',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _msgEl = document.createElement('div');
    _msgEl.id = 'nw-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'top:48px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFEE88',
      'font:bold 14px monospace',
      'padding:4px 12px',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(_msgEl);

    _endEl = document.createElement('div');
    _endEl.id = 'nw-end';
    _endEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#AAFFAA',
      'font:bold 22px monospace',
      'padding:24px 40px',
      'border:2px solid #446644',
      'border-radius:8px',
      'pointer-events:none',
      'z-index:10000',
      'text-align:center',
      'display:none'
    ].join(';');
    document.body.appendChild(_endEl);
  }

  function updateHUD() {
    if (!_hud) return;
    var zone = Math.min(5, Math.floor(_distanceTravelled / ZONE_LENGTH) + 1);
    var dist = Math.round((_totalDistance - _distanceTravelled));
    if (dist < 0) dist = 0;
    _hud.textContent =
      'NUCLEAR WINTER' +
      '  [HP: ' + Math.max(0, Math.round(_playerHP)) + ']' +
      '  [RAD: ' + Math.round(_radiation) + '%]' +
      '  [COLD: ' + Math.round(_cold) + '%]' +
      '  [HUNGER: ' + Math.round(_hunger) + '%]' +
      '  [ZONE: ' + zone + '/5]' +
      '  | DISTANCE: ' + dist + 'm';
  }

  function showMsg(text, duration) {
    if (!_msgEl) return;
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = duration || 3;
  }

  function removeHUD() {
    if (_hud   && _hud.parentNode)   _hud.parentNode.removeChild(_hud);
    if (_msgEl && _msgEl.parentNode) _msgEl.parentNode.removeChild(_msgEl);
    if (_endEl && _endEl.parentNode) _endEl.parentNode.removeChild(_endEl);
    _hud   = null;
    _msgEl = null;
    _endEl = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACID RAIN OVERLAY
  ════════════════════════════════════════════════════════════════════════ */

  function createAcidRainOverlay() {
    if (_acidRainOverlay) return;
    var geo  = new THREE.PlaneGeometry(200, 400, 10, 20);
    _acidRainOverlay = makeMesh(geo, 0x224422, 0x22FF22, 0.15);
    _acidRainOverlay.material.transparent = true;
    _acidRainOverlay.material.opacity     = 0.18;
    _acidRainOverlay.rotation.x = -Math.PI / 2;
    _acidRainOverlay.position.set(0, 6, -150);
    _scene.add(_acidRainOverlay);
  }

  function removeAcidRainOverlay() {
    if (_acidRainOverlay) {
      _scene.remove(_acidRainOverlay);
      _acidRainOverlay = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY RAIDERS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnConvoy() {
    var i, enemy, mx, mz;
    _convoyRaiders = [];
    mz = _playerPos.z - 10;
    for (i = 0; i < 5; i++) {
      mx = _playerPos.x + (i - 2) * 4;
      /* Motorcycle base: CylinderGeometry for wheel suggestion */
      var bodyGeo  = new THREE.BoxGeometry(1, 1.2, 2.5);
      var bodyMesh = makeMesh(bodyGeo, 0x554433);
      var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
      var wMesh    = makeMesh(wheelGeo, 0x222222);
      wMesh.rotation.x = Math.PI / 2;
      wMesh.position.z = 1.1;
      bodyMesh.add(wMesh);
      var wMesh2 = makeMesh(wheelGeo, 0x222222);
      wMesh2.rotation.x = Math.PI / 2;
      wMesh2.position.z = -1.1;
      bodyMesh.add(wMesh2);
      bodyMesh.position.set(mx, 0.8, mz);
      _scene.add(bodyMesh);
      enemy = {
        mesh: bodyMesh,
        type: 'convoy',
        hp: 60,
        maxHp: 60,
        pos: { x: mx, z: mz },
        vel: { x: 0, z: 0 },
        alive: true,
        radOnHit: 0,
        hitTimer: 0,
        drops: 0,
        alertRange: 60,
        attackRange: 2,
        attackCooldown: 0,
        speed: 8
      };
      _convoyRaiders.push(enemy);
      _enemies.push(enemy);
    }
  }

  function removeConvoyRaiders() {
    var i, e;
    for (i = 0; i < _convoyRaiders.length; i++) {
      e = _convoyRaiders[i];
      if (e.mesh) _scene.remove(e.mesh);
      e.alive = false;
    }
    _convoyRaiders = [];
  }

  /* ════════════════════════════════════════════════════════════════════════
     CAMPFIRE
  ════════════════════════════════════════════════════════════════════════ */

  function lightCampfire() {
    if (_firewood < 1) {
      showMsg('No firewood!', 2.5);
      return;
    }
    _firewood--;
    if (_campfireMesh) {
      _scene.remove(_campfireMesh);
      _campfireMesh = null;
    }
    var geo  = new THREE.CylinderGeometry(0.3, 0.6, 0.8, 6);
    _campfireMesh = makeMesh(geo, 0x883300, 0xFF4400, 0.8);
    _campfireMesh.position.set(_playerPos.x, 0.4, _playerPos.z);
    _scene.add(_campfireMesh);
    var fLight = new THREE.PointLight(0xFF4400, 2, 10);
    fLight.position.set(_playerPos.x, 1.5, _playerPos.z);
    _scene.add(fLight);
    _campfireMesh.userData.light = fLight;
    _campfireTimer = 60;
    showMsg('Campfire lit! Warming up...', 3);
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESOURCE PICKUP & INTERACTION
  ════════════════════════════════════════════════════════════════════════ */

  function tryPickup() {
    var i, r, dx, dz, dist;
    for (i = 0; i < _resources.length; i++) {
      r = _resources[i];
      if (r.collected) continue;
      dx = _playerPos.x - r.pos.x;
      dz = _playerPos.z - r.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.5) {
        r.collected = true;
        _scene.remove(r.mesh);
        applyResource(r.type);
        return;
      }
    }
    /* Try shelter entry/exit */
    if (_nearShelter) {
      _inShelter = !_inShelter;
      showMsg(_inShelter ? 'Entered shelter. Cold drain paused.' : 'Left shelter.', 3);
      return;
    }
    /* Bunker interaction */
    if (_nearBunker) {
      tryEnterBunker();
    }
  }

  function applyResource(type) {
    if (type === 'food') {
      _hunger = Math.max(0, _hunger - 30);
      showMsg('Ate canned food. Hunger -30.', 3);
      _inventory.push('food');
    } else if (type === 'blanket') {
      _cold = Math.max(0, _cold - 30);
      _blanketTimer = 60;
      _blanketActive = true;
      showMsg('Wrapped in blanket. Cold -30, drain slowed 60s.', 3);
      _inventory.push('blanket');
    } else if (type === 'radx') {
      _radiation = Math.max(0, _radiation - 40);
      showMsg('Took Rad-X. Radiation -40.', 3);
      _inventory.push('radx');
    } else if (type === 'gasmask') {
      _gasMaskTimer = 90;
      showMsg('Gas mask equipped. Radiation gain halved for 90s.', 3);
      _inventory.push('gasmask');
    } else if (type === 'firewood') {
      _firewood++;
      showMsg('Picked up firewood. (F to light campfire)', 3);
    }
  }

  function tryEnterBunker() {
    /* Count usable resources (food, blanket, radx, gasmask) in inventory */
    var count = 0, i;
    var tollTypes = ['food', 'blanket', 'radx', 'gasmask'];
    for (i = 0; i < _inventory.length; i++) {
      if (tollTypes.indexOf(_inventory[i]) !== -1) count++;
    }
    if (count >= 2) {
      /* Remove 2 items as toll */
      var removed = 0;
      var newInv = [];
      for (i = 0; i < _inventory.length; i++) {
        if (removed < 2 && tollTypes.indexOf(_inventory[i]) !== -1) {
          removed++;
        } else {
          newInv.push(_inventory[i]);
        }
      }
      _inventory = newInv;
      _bunkerTollPaid = true;
      triggerVictory();
    } else {
      showMsg('Bunker needs 2 supplies as toll! (' + count + '/2 carried)', 4);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MUTANT RESOURCE DROP
  ════════════════════════════════════════════════════════════════════════ */

  function dropMutantResources(pos) {
    var i, geo, mesh, types, type, ox, oz;
    types = ['food', 'radx', 'blanket'];
    for (i = 0; i < 3; i++) {
      type = types[i];
      ox = pos.x + (Math.random() - 0.5) * 4;
      oz = pos.z + (Math.random() - 0.5) * 4;
      if (type === 'radx') {
        geo  = new THREE.BoxGeometry(0.5, 0.8, 0.5);
        mesh = makeMesh(geo, 0x44FF22, 0x22AA00, 0.5);
      } else {
        geo  = new THREE.BoxGeometry(0.6, 0.5, 0.8);
        mesh = makeMesh(geo, 0x886644);
      }
      mesh.position.set(ox, 0.5, oz);
      _scene.add(mesh);
      _resources.push({ mesh: mesh, type: type, pos: { x: ox, z: oz }, collected: false });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ATTACK / MELEE
  ════════════════════════════════════════════════════════════════════════ */

  function tryAttack() {
    if (_attackCooldown > 0) return;
    _attackCooldown = 0.5;
    var i, e, dx, dz, dist;
    /* Short-range melee hit (3 units) */
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (!e.alive) continue;
      dx = _playerPos.x - e.pos.x;
      dz = _playerPos.z - e.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3) {
        e.hp -= 25;
        e.hitTimer = 0.15;
        if (e.hp <= 0) {
          killEnemy(e);
        }
      }
    }
  }

  function killEnemy(e) {
    e.alive = false;
    _scene.remove(e.mesh);
    if (e.type === 'mutant') {
      dropMutantResources(e.pos);
      showMsg('Mutant slain! Resources dropped.', 4);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════ */

  function triggerVictory() {
    _victory = true;
    _gameOver = true;
    if (_endEl) {
      _endEl.style.color = '#AAFFAA';
      _endEl.innerHTML =
        'YOU SURVIVED<br>Reached the Evac Bunker!<br>' +
        '<span style="font-size:14px;color:#88CCAA">HP: ' + Math.round(_playerHP) +
        '  |  RAD: ' + Math.round(_radiation) + '%</span>';
      _endEl.style.display = 'block';
    }
  }

  function triggerDefeat(reason) {
    _defeat = true;
    _gameOver = true;
    if (_endEl) {
      _endEl.style.color = '#FF4444';
      _endEl.innerHTML =
        'YOU PERISHED<br><span style="font-size:14px">' + reason + '</span>';
      _endEl.style.display = 'block';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    /* Activation combo N+W */
    if (k === 'N' || k === 'W') {
      _comboTimes[k] = performance.now();
      if (Math.abs(_comboTimes['N'] - _comboTimes['W']) < COMBO_WINDOW &&
          _comboTimes['N'] > 0 && _comboTimes['W'] > 0) {
        if (!_active) {
          activate();
        }
      }
    }

    if (!_active || _gameOver) return;

    if (k === 'R') {
      showMsg('Geiger counter: ' + Math.round(_radiation) + '% radiation', 3);
    }
    if (k === 'F') {
      lightCampfire();
    }
    if (k === 'E') {
      tryPickup();
    }
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    if (_pointerLocked) {
      _yaw   -= e.movementX * 0.002;
      _pitch -= e.movementY * 0.002;
      _pitch  = Math.max(-1.1, Math.min(1.1, _pitch));
    }
  }

  function onMouseDown(e) {
    if (!_active || _gameOver) return;
    _mouseDown = true;
    tryAttack();
    if (!_pointerLocked && _canvas) {
      _canvas.requestPointerLock();
    }
  }

  function onMouseUp() {
    _mouseDown = false;
  }

  function onPointerLockChange() {
    _pointerLocked = (document.pointerLockElement === _canvas ||
                      document.mozPointerLockElement === _canvas);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    _active = true;
    setupScene();
    buildWorld();
    buildHUD();
    showMsg('Nuclear Winter — Reach the evac bunker 1km north! (WASD move, E pick up, F campfire, R Geiger)', 6);
  }

  function setupScene() {
    _savedFog = _scene.fog;
    _savedBg  = _scene.background;

    _scene.background = new THREE.Color(0x333333);
    _scene.fog        = new THREE.FogExp2(0x222222, _baseFogDensity);

    /* Ambient + directional light */
    _ambientLight = new THREE.AmbientLight(0x444444, 0.8);
    _scene.add(_ambientLight);
    _dirLight = new THREE.DirectionalLight(0x667766, 0.5);
    _dirLight.position.set(20, 40, 10);
    _scene.add(_dirLight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SURVIVAL METER DRAIN
  ════════════════════════════════════════════════════════════════════════ */

  function updateMeters(dt) {
    var radMult = 1;
    var coldMult = 1;
    var hungerMult = 1;

    /* Gas mask halves radiation */
    if (_gasMaskTimer > 0) {
      radMult = 0.5;
      _gasMaskTimer -= dt;
      if (_gasMaskTimer <= 0) {
        showMsg('Gas mask filter exhausted!', 3);
        _gasMaskTimer = 0;
      }
    }

    /* Blanket slows cold drain */
    if (_blanketActive) {
      coldMult = 0.3;
      _blanketTimer -= dt;
      if (_blanketTimer <= 0) {
        _blanketActive = false;
        showMsg('Blanket warmth faded.', 3);
      }
    }

    /* Campfire: actively reduces cold */
    var campfireColdRed = 0;
    if (_campfireTimer > 0) {
      _campfireTimer -= dt;
      campfireColdRed = 20 * dt; /* -20 cold/s */
      if (_campfireTimer <= 0) {
        if (_campfireMesh) {
          if (_campfireMesh.userData.light) _scene.remove(_campfireMesh.userData.light);
          _scene.remove(_campfireMesh);
          _campfireMesh = null;
        }
        showMsg('Campfire burned out.', 3);
        _campfireTimer = 0;
      }
    }

    /* Shelter: pauses cold drain */
    if (_inShelter) {
      coldMult = 0;
    }

    /* Acid rain: +5 rad/s outdoors */
    if (_acidRainActive && !_inShelter) {
      _radiation += 5 * dt;
    }

    /* Blizzard: 2x cold drain */
    if (_blizzardActive) {
      coldMult *= 2;
    }

    /* Check hotspots */
    var i, hs, dx, dz, dist;
    for (i = 0; i < _hotspots.length; i++) {
      hs = _hotspots[i];
      dx = _playerPos.x - hs.pos.x;
      dz = _playerPos.z - hs.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < hs.radius) {
        _radiation += (1 - dist / hs.radius) * 15 * dt * radMult;
      }
    }

    /* Check fog patches */
    for (i = 0; i < _fogPatches.length; i++) {
      var fp = _fogPatches[i];
      dx = _playerPos.x - fp.pos.x;
      dz = _playerPos.z - fp.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < fp.radius) {
        _radiation += (1 - dist / fp.radius) * 8 * dt * radMult;
      }
    }

    /* Normal drain */
    _radiation += _radDrainBase * radMult * dt;
    _cold      += _coldDrainBase * coldMult * dt;
    _hunger    += _hungerDrainBase * hungerMult * dt;

    /* Apply campfire cold reduction */
    _cold -= campfireColdRed;

    /* Clamp */
    _radiation = Math.max(0, Math.min(100, _radiation));
    _cold      = Math.max(0, Math.min(100, _cold));
    _hunger    = Math.max(0, Math.min(100, _hunger));

    /* HP drain if any meter at 100% */
    if (_radiation >= 100) _playerHP -= 10 * dt;
    if (_cold      >= 100) _playerHP -= 10 * dt;
    if (_hunger    >= 100) _playerHP -= 10 * dt;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    var speed = _playerSpeed;
    var move = { x: 0, z: 0 };

    if (_keys['W'] || _keys['ARROWUP'])    move.z -= 1;
    if (_keys['S'] || _keys['ARROWDOWN'])  move.z += 1;
    if (_keys['A'] || _keys['ARROWLEFT'])  move.x -= 1;
    if (_keys['D'] || _keys['ARROWRIGHT']) move.x += 1;

    var len = Math.sqrt(move.x * move.x + move.z * move.z);
    if (len > 0) {
      move.x /= len;
      move.z /= len;
    }

    /* Apply yaw rotation */
    var cos = Math.cos(_yaw);
    var sin = Math.sin(_yaw);
    var worldX = move.x * cos + move.z * sin;
    var worldZ = -move.x * sin + move.z * cos;

    /* Frozen river stumble: random direction jitter zone 3 */
    var onRiver = (_playerPos.z < -120 && _playerPos.z > -140 &&
                   Math.abs(_playerPos.x) < 30);
    if (onRiver && (worldX !== 0 || worldZ !== 0)) {
      worldX += (Math.random() - 0.5) * 0.6;
      worldZ += (Math.random() - 0.5) * 0.6;
    }

    _playerPos.x += worldX * speed * dt;
    _playerPos.z += worldZ * speed * dt;

    /* Clamp to world */
    _playerPos.x = Math.max(-99, Math.min(99, _playerPos.x));
    _playerPos.z = Math.max(-299, Math.min(1, _playerPos.z));

    /* Track distance north (negative Z = north) */
    if (worldZ < 0) {
      _distanceTravelled = Math.min(_totalDistance, -_playerPos.z);
    }

    /* Update camera */
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _yaw;
    _camera.rotation.x     = _pitch;

    /* Shelter proximity */
    _nearShelter = false;
    for (var i = 0; i < _shelters.length; i++) {
      var s = _shelters[i];
      if (_playerPos.x > s.bounds.xMin - 2 && _playerPos.x < s.bounds.xMax + 2 &&
          _playerPos.z > s.bounds.zMin - 2 && _playerPos.z < s.bounds.zMax + 2) {
        _nearShelter = true;
        /* Auto-check if inside bounds */
        if (_playerPos.x > s.bounds.xMin && _playerPos.x < s.bounds.xMax &&
            _playerPos.z > s.bounds.zMin && _playerPos.z < s.bounds.zMax) {
          if (!_inShelter) {
            _inShelter = true;
            showMsg('Inside shelter. Cold drain paused. (E to exit)', 3);
          }
        } else {
          if (_inShelter) {
            _inShelter = false;
          }
        }
        break;
      }
    }
    if (!_nearShelter && _inShelter) {
      _inShelter = false;
    }

    /* Bunker proximity */
    _nearBunker = false;
    var bdx = _playerPos.x - 0;
    var bdz = _playerPos.z - (-295);
    var bdist = Math.sqrt(bdx * bdx + bdz * bdz);
    if (bdist < 14) {
      _nearBunker = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateEnemies(dt) {
    var i, e, dx, dz, dist, nx, nz;
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (!e.alive) continue;

      /* Cool down hit flash */
      if (e.hitTimer > 0) {
        e.hitTimer -= dt;
      }

      dx = _playerPos.x - e.pos.x;
      dz = _playerPos.z - e.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < e.alertRange) {
        /* Move toward player */
        if (dist > e.attackRange) {
          nx = dx / dist;
          nz = dz / dist;
          e.pos.x += nx * e.speed * dt;
          e.pos.z += nz * e.speed * dt;
          var ey = (e.type === 'wolf' ? 0.6 : (e.type === 'mutant' ? 1.8 : 0.9));
          e.mesh.position.set(e.pos.x, ey, e.pos.z);
          /* Face player */
          e.mesh.rotation.y = Math.atan2(-dx, -dz);
        }

        /* Attack */
        if (e.attackCooldown > 0) {
          e.attackCooldown -= dt;
        } else if (dist < e.attackRange) {
          e.attackCooldown = 1.5;
          var dmg = (e.type === 'mutant' ? 20 : 12);
          _playerHP -= dmg;
          if (e.radOnHit > 0) {
            _radiation = Math.min(100, _radiation + e.radOnHit);
            showMsg('Radiation wolf bit you! +10 radiation', 2);
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RANDOM EVENTS
  ════════════════════════════════════════════════════════════════════════ */

  function updateEvents(dt) {
    _eventTimer -= dt;
    if (_eventTimer <= 0) {
      _eventTimer = 90;
      triggerRandomEvent();
    }

    /* Acid rain timer */
    if (_acidRainActive) {
      _acidRainTimer -= dt;
      if (_acidRainTimer <= 0) {
        _acidRainActive = false;
        removeAcidRainOverlay();
        /* Restore fog */
        if (_scene.fog) _scene.fog.density = _baseFogDensity;
        showMsg('Acid rain stopped.', 2);
      }
    }

    /* Blizzard timer */
    if (_blizzardActive) {
      _blizzardTimer -= dt;
      if (_blizzardTimer <= 0) {
        _blizzardActive = false;
        if (_scene.fog) _scene.fog.density = _baseFogDensity;
        showMsg('Blizzard subsides.', 2);
      }
    }

    /* Convoy timer */
    if (_convoyActive) {
      _convoyTimer -= dt;
      if (_convoyTimer <= 0) {
        _convoyActive = false;
        removeConvoyRaiders();
        showMsg('Convoy broke off pursuit.', 2);
      }
    }
  }

  function triggerRandomEvent() {
    var roll = Math.random();
    if (roll < 0.33) {
      /* Acid rain */
      _acidRainActive = true;
      _acidRainTimer  = 30;
      createAcidRainOverlay();
      if (_scene.fog) _scene.fog.density = _baseFogDensity * 1.5;
      showMsg('ACID RAIN! Take cover indoors. +5 RAD/s outdoors for 30s.', 5);
    } else if (roll < 0.66) {
      /* Blizzard */
      _blizzardActive = true;
      _blizzardTimer  = 45;
      if (_scene.fog) _scene.fog.density = _baseFogDensity * 3;
      showMsg('BLIZZARD! Cold drains 2x for 45s. Fog thickens.', 5);
    } else {
      /* Raider convoy */
      if (!_convoyActive) {
        _convoyActive = true;
        _convoyTimer  = 30;
        spawnConvoy();
        showMsg('RAIDER CONVOY! 5 bikers closing in for 30s!', 5);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ATTACK COOLDOWN
  ════════════════════════════════════════════════════════════════════════ */

  function updateAttack(dt) {
    if (_attackCooldown > 0) _attackCooldown -= dt;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESSAGE TIMER
  ════════════════════════════════════════════════════════════════════════ */

  function updateMsg(dt) {
    if (_msgEl && _msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0) {
        _msgEl.style.display = 'none';
        _msgTimer = 0;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CLEANUP
  ════════════════════════════════════════════════════════════════════════ */

  function clearScene() {
    var i;
    for (i = 0; i < _envObjects.length; i++) _scene.remove(_envObjects[i]);
    for (i = 0; i < _enemies.length;   i++) _scene.remove(_enemies[i].mesh);
    for (i = 0; i < _resources.length; i++) _scene.remove(_resources[i].mesh);
    for (i = 0; i < _hotspots.length;  i++) {
      _scene.remove(_hotspots[i].mesh);
      _scene.remove(_hotspots[i].light);
    }
    for (i = 0; i < _fogPatches.length; i++) _scene.remove(_fogPatches[i].light);
    if (_campfireMesh) {
      if (_campfireMesh.userData.light) _scene.remove(_campfireMesh.userData.light);
      _scene.remove(_campfireMesh);
    }
    if (_bunkerLight) _scene.remove(_bunkerLight);
    if (_ambientLight) _scene.remove(_ambientLight);
    if (_dirLight) _scene.remove(_dirLight);
    removeAcidRainOverlay();

    _envObjects  = [];
    _enemies     = [];
    _resources   = [];
    _hotspots    = [];
    _fogPatches  = [];
    _shelters    = [];
    _campfireMesh = null;
    _bunkerMesh   = null;
    _bunkerLight  = null;
    _convoyRaiders = [];
    _ambientLight  = null;
    _dirLight      = null;
    _frozenRiver   = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
    document.addEventListener('pointerlockchange',    onPointerLockChange);
    document.addEventListener('mozpointerlockchange', onPointerLockChange);
  }

  function update(dt) {
    if (!_active || _gameOver) return;

    /* Clamp dt to avoid spiral */
    if (dt > 0.1) dt = 0.1;

    updatePlayer(dt);
    updateMeters(dt);
    updateEnemies(dt);
    updateEvents(dt);
    updateAttack(dt);
    updateMsg(dt);
    updateHUD();

    /* Death check */
    if (_playerHP <= 0) {
      var reason = 'All vitals failed.';
      if (_radiation >= 100) reason = 'Radiation poisoning.';
      else if (_cold >= 100) reason = 'Hypothermia.';
      else if (_hunger >= 100) reason = 'Starvation.';
      triggerDefeat(reason);
    }

    /* Zone 5 bunker auto-trigger if standing inside */
    if (!_bunkerTollPaid && _nearBunker && _distanceTravelled >= _totalDistance - 10) {
      showMsg('EVAC BUNKER REACHED! Press E to enter (need 2 supplies as toll).', 0.05);
    }
  }

  function reset() {
    _active       = false;
    _victory      = false;
    _defeat       = false;
    _gameOver     = false;
    _playerHP     = 100;
    _playerPos    = { x: 0, y: 1.7, z: 0 };
    _yaw          = 0;
    _pitch        = 0;
    _radiation    = 0;
    _cold         = 0;
    _hunger       = 0;
    _gasMaskTimer = 0;
    _blanketTimer = 0;
    _blanketActive = false;
    _campfireTimer = 0;
    _inShelter    = false;
    _nearShelter  = false;
    _nearBunker   = false;
    _inventory    = [];
    _firewood     = 0;
    _keys         = {};
    _mouseDown    = false;
    _pointerLocked = false;
    _eventTimer   = 90;
    _acidRainActive  = false;
    _acidRainTimer   = 0;
    _blizzardActive  = false;
    _blizzardTimer   = 0;
    _convoyActive    = false;
    _convoyTimer     = 0;
    _distanceTravelled = 0;
    _bunkerTollPaid  = false;
    _attackCooldown  = 0;
    _msgTimer        = 0;
    _comboTimes      = { N: 0, W: 0 };

    clearScene();
    removeHUD();

    if (_savedFog !== undefined && _savedFog !== null) {
      _scene.fog = _savedFog;
    }
    if (_savedBg !== undefined && _savedBg !== null) {
      _scene.background = _savedBg;
    }
    _savedFog = null;
    _savedBg  = null;

    if (_camera) {
      _camera.position.set(0, 1.7, 0);
      _camera.rotation.set(0, 0, 0);
    }

    if (document.pointerLockElement || document.mozPointerLockElement) {
      document.exitPointerLock();
    }
  }

  return { init: init, update: update, reset: reset };

}());
