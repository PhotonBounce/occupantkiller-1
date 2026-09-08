window.AntarcticStation = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'AntarcticStation';
  var ACTIVATION_WINDOW = 400;

  var _lastATime = 0;
  var _lastNTime = 0;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,

    // Player
    playerPos: { x: 0, y: 1.7, z: 20 },
    playerHP: 100,
    playerYaw: 0,
    playerPitch: 0,
    keysDown: {},
    mouseLocked: false,
    hasColdSuit: false,
    hypothermia: 100,
    isOutside: true,
    flareUses: 2,
    flareDistractTimer: 0,
    flareTarget: null,
    repairing: false,
    repairTarget: null,
    repairProgress: 0,

    // World
    hudEl: null,
    fogNormal: 0.025,
    fog: null,

    // Blizzard
    blizzardTimer: 0,
    blizzardActive: false,
    blizzardCooldown: 180,
    blizzardDuration: 90,

    // Objectives
    artifactSafe: true,
    artifactPos: { x: 0, y: 1, z: -40 },
    artifactMesh: null,
    artifactCarrier: null,
    powerOn: true,
    generatorHP: 100,
    generatorMesh: null,
    entriesSealed: 0,
    entriesTotal: 3,
    entryPoints: [],
    researchersRescued: 0,
    researchersTotal: 4,
    researchers: [],
    kaneHP: 480,
    kaneMesh: null,
    kaneAlive: true,
    gameOver: false,
    gameWon: false,
    gameOverMsg: '',

    // Frozen lake
    lakeEnemyCount: 0,
    lakeCracked: false,
    lakeMesh: null,

    // Scene objects
    enemies: [],
    blizzardParticles: [],
    buildings: [],
    iceCols: [],
    objects: []
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  function makeMesh(geo, color, roughness) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (roughness !== undefined) mat.roughness = roughness;
    return new THREE.Mesh(geo, mat);
  }

  function addTo(mesh, px, py, pz) {
    mesh.position.set(px, py, pz);
    state.scene.add(mesh);
    return mesh;
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ── Scene Setup ────────────────────────────────────────────────────────────

  function setupScene() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0xaaccff);
    state.fog = new THREE.FogExp2(0xaaccff, state.fogNormal);
    state.scene.fog = state.fog;

    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap = state.renderer.shadowMap || {};
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    // Lighting
    var ambient = new THREE.AmbientLight(0x9999cc, 0.7);
    state.scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xeeeeff, 0.8);
    sun.position.set(50, 100, 30);
    state.scene.add(sun);

    window.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!state.renderer) return;
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── Environment ────────────────────────────────────────────────────────────

  function buildGround() {
    var ground = makeMesh(new THREE.BoxGeometry(300, 0.5, 300), 0xeeeeff);
    addTo(ground, 0, -0.25, 0);
    state.objects.push(ground);
  }

  function buildBuildings() {
    // Main lab block
    var lab = makeMesh(new THREE.BoxGeometry(20, 6, 14), 0x778899);
    addTo(lab, 0, 3, -15);
    state.buildings.push({ mesh: lab, minX: -10, maxX: 10, minZ: -22, maxZ: -8 });

    // Corridor east
    var corrE = makeMesh(new THREE.BoxGeometry(12, 4, 5), 0x667788);
    addTo(corrE, 16, 2, -15);
    state.buildings.push({ mesh: corrE, minX: 10, maxX: 22, minZ: -17.5, maxZ: -12.5 });

    // Storage room (cold suit inside)
    var store = makeMesh(new THREE.BoxGeometry(10, 5, 10), 0x556677);
    addTo(store, 28, 2.5, -15);
    state.buildings.push({ mesh: store, minX: 23, maxX: 33, minZ: -20, maxZ: -10 });

    // Corridor north
    var corrN = makeMesh(new THREE.BoxGeometry(5, 4, 16), 0x667788);
    addTo(corrN, 0, 2, -30);
    state.buildings.push({ mesh: corrN, minX: -2.5, maxX: 2.5, minZ: -38, maxZ: -22 });

    // Artifact chamber
    var chamber = makeMesh(new THREE.BoxGeometry(16, 7, 16), 0x445566);
    addTo(chamber, 0, 3.5, -46);
    state.buildings.push({ mesh: chamber, minX: -8, maxX: 8, minZ: -54, maxZ: -38 });

    // Ice cave section (west)
    var cave = makeMesh(new THREE.BoxGeometry(18, 5, 18), 0x334455);
    addTo(cave, -22, 2.5, -15);
    state.buildings.push({ mesh: cave, minX: -31, maxX: -13, minZ: -24, maxZ: -6 });

    // Ice columns in cave
    for (var i = 0; i < 6; i++) {
      var col = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 5, 8), 0x88ccee);
      var cx = -22 + (i % 3) * 5 - 5;
      var cz = -15 + Math.floor(i / 3) * 6 - 3;
      addTo(col, cx, 2.5, cz);
      state.iceCols.push(col);
    }
    var iceLight = new THREE.PointLight(0x88ccff, 1.5, 20);
    iceLight.position.set(-22, 4, -15);
    state.scene.add(iceLight);

    // Roof helipad
    var pad = makeMesh(new THREE.CylinderGeometry(5, 5, 0.3, 16), 0x445566);
    addTo(pad, 0, 6.15, -15);
    var padMark = makeMesh(new THREE.CylinderGeometry(2, 2, 0.05, 8), 0xffff00);
    addTo(padMark, 0, 6.32, -15);

    // Generator
    state.generatorMesh = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 2.5, 10), 0x556644);
    addTo(state.generatorMesh, 12, 1.25, -5);

    // Frozen lake
    state.lakeMesh = makeMesh(new THREE.BoxGeometry(30, 0.3, 20), 0x99bbdd);
    addTo(state.lakeMesh, -50, 0.15, 10);

    // Artifact chamber light
    var artLight = new THREE.PointLight(0x88aaff, 2, 15);
    artLight.position.set(0, 5, -46);
    state.scene.add(artLight);

    // Cold suit marker
    var suitBox = makeMesh(new THREE.BoxGeometry(0.8, 1.5, 0.4), 0x0055ff);
    addTo(suitBox, 28, 1.5, -15);
    state.objects.push(suitBox);
    state.coldSuitMesh = suitBox;
  }

  function buildArtifact() {
    state.artifactMesh = makeMesh(new THREE.SphereGeometry(0.8, 12, 12), 0x88aaff);
    state.artifactMesh.position.set(0, 1.3, -46);
    state.scene.add(state.artifactMesh);
  }

  function buildEntryPoints() {
    var positions = [
      { x: 10, y: 0.5, z: -8, label: 'ENTRY A' },
      { x: -31, y: 0.5, z: -15, label: 'ENTRY B' },
      { x: 0, y: 0.5, z: -54, label: 'ENTRY C' }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var ep = makeMesh(new THREE.BoxGeometry(2.5, 3, 0.4), 0xff4400);
      addTo(ep, p.x, p.y, p.z);
      state.entryPoints.push({ mesh: ep, pos: p, sealed: false });
    }
  }

  function buildResearchers() {
    var positions = [
      { x: 5, y: 1.7, z: -18 },
      { x: -25, y: 1.7, z: -12 },
      { x: -3, y: 1.7, z: -32 },
      { x: 6, y: 1.7, z: -44 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var r = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8), 0xffdd88);
      addTo(r, p.x, p.y, p.z);
      var head = makeMesh(new THREE.SphereGeometry(0.28, 8, 8), 0xffcc99);
      head.position.set(0, 1.08, 0);
      r.add(head);
      state.researchers.push({ mesh: r, pos: { x: p.x, y: p.y, z: p.z }, rescued: false });
    }
  }

  function buildEnemies() {
    var spawnPoints = [
      { x: 18, z: 5 }, { x: -18, z: 5 }, { x: 25, z: -10 },
      { x: -25, z: 5 }, { x: 0, z: 30 }, { x: 15, z: 25 },
      { x: -15, z: 25 }, { x: 35, z: -20 }, { x: -35, z: -10 },
      { x: 20, z: -30 }, { x: -40, z: 20 }, { x: 40, z: 10 },
      { x: 5, z: 15 }, { x: -5, z: 20 }
    ];
    for (var i = 0; i < 14; i++) {
      var sp = spawnPoints[i];
      var body = makeMesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), 0x445566);
      var head = makeMesh(new THREE.SphereGeometry(0.25, 8, 8), 0x445566);
      head.position.set(0, 1.0, 0);
      body.add(head);
      addTo(body, sp.x, 0.75, sp.z);
      state.enemies.push({
        mesh: body, hp: 80, maxHp: 80, type: 'merc',
        pos: { x: sp.x, y: 0.75, z: sp.z },
        state: 'patrol', patrolAngle: Math.random() * Math.PI * 2,
        attackCooldown: 0, alertTimer: 0,
        carryingArtifact: false, isLake: false
      });
    }
    // 4 elite breachers
    var bSpawns = [
      { x: 12, z: 2 }, { x: -12, z: 2 }, { x: 30, z: -5 }, { x: -30, z: -5 }
    ];
    for (var j = 0; j < 4; j++) {
      var bs = bSpawns[j];
      var bb = makeMesh(new THREE.BoxGeometry(0.7, 1.7, 0.7), 0x334455);
      var bh = makeMesh(new THREE.SphereGeometry(0.28, 8, 8), 0x334455);
      bh.position.set(0, 1.1, 0);
      bb.add(bh);
      addTo(bb, bs.x, 0.85, bs.z);
      state.enemies.push({
        mesh: bb, hp: 130, maxHp: 130, type: 'breacher',
        pos: { x: bs.x, y: 0.85, z: bs.z },
        state: 'patrol', patrolAngle: Math.random() * Math.PI * 2,
        attackCooldown: 0, alertTimer: 0,
        carryingArtifact: false, isLake: false
      });
    }
    // Boss Kane in artifact chamber
    var kaneMesh = makeMesh(new THREE.BoxGeometry(0.8, 1.9, 0.8), 0x222233);
    var kaneHead = makeMesh(new THREE.SphereGeometry(0.32, 8, 8), 0x222233);
    kaneHead.position.set(0, 1.25, 0);
    kaneMesh.add(kaneHead);
    addTo(kaneMesh, 3, 0.95, -46);
    state.kaneMesh = kaneMesh;
    state.enemies.push({
      mesh: kaneMesh, hp: 480, maxHp: 480, type: 'kane',
      pos: { x: 3, y: 0.95, z: -46 },
      state: 'patrol', patrolAngle: 0,
      attackCooldown: 0, alertTimer: 0,
      carryingArtifact: false, isLake: false
    });
  }

  function buildBlizzard() {
    for (var i = 0; i < 300; i++) {
      var sp = makeMesh(new THREE.SphereGeometry(0.08, 4, 4), 0xffffff);
      var px = (Math.random() - 0.5) * 120;
      var py = Math.random() * 20;
      var pz = (Math.random() - 0.5) * 120;
      sp.position.set(px, py, pz);
      sp.userData.vel = {
        x: (Math.random() - 0.5) * 2,
        y: -Math.random() * 1.5 - 0.5,
        z: (Math.random() - 0.5) * 2
      };
      state.scene.add(sp);
      state.blizzardParticles.push(sp);
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.id = 'as-hud';
    state.hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'padding:10px 16px',
      'box-sizing:border-box', 'z-index:9999', 'pointer-events:none',
      'font:bold 13px/1.4 monospace', 'color:#eef', 'text-shadow:0 0 4px #000'
    ].join(';');
    document.body.appendChild(state.hudEl);
    updateHUD();

    // Crosshair
    var ch = document.createElement('div');
    ch.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'width:14px', 'height:14px', 'margin:-7px 0 0 -7px',
      'border:2px solid rgba(255,255,255,0.8)',
      'border-radius:50%', 'pointer-events:none', 'z-index:9999'
    ].join(';');
    document.body.appendChild(ch);
    state.crosshairEl = ch;
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function updateHUD() {
    if (!state.hudEl) return;
    var elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    var mm = pad2(Math.floor(elapsed / 60));
    var ss = pad2(elapsed % 60);
    var artifactStatus = state.artifactSafe ? '<span style="color:#0f0">SAFE</span>' : '<span style="color:#f44">DANGER</span>';
    var powerStatus = state.powerOn ? '<span style="color:#0f0">ON</span>' : '<span style="color:#f44">OFF</span>';
    var kaneStatus = state.kaneAlive
      ? ('<span style="color:#f44">ALIVE (' + Math.max(0, state.kaneHP) + 'HP)</span>')
      : '<span style="color:#0f0">KIA</span>';
    var temp = state.isOutside ? (state.hasColdSuit ? -18 : -38) : 4;
    state.hudEl.innerHTML = [
      'ANTARCTIC STATION',
      'ARTIFACT: ' + artifactStatus + ' &nbsp; POWER: ' + powerStatus,
      'ENTRIES SEALED: ' + state.entriesSealed + '/3 &nbsp; RESEARCHERS: ' + state.researchersRescued + '/4 RESCUED',
      'KANE: ' + kaneStatus,
      'TEMP: ' + temp + '&deg;C &nbsp; TIMER: ' + mm + ':' + ss,
      'HP: ' + Math.max(0, state.playerHP) + ' &nbsp; HYPOTHERMIA: ' + Math.floor(state.hypothermia) + '%',
      'FLARES: ' + state.flareUses + ' (F) &nbsp; COLD SUIT: ' + (state.hasColdSuit ? 'YES' : 'NO'),
      state.blizzardActive ? '<span style="color:#88f">*** BLIZZARD ***</span>' : ''
    ].join('<br>');
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    var k = e.key || '';
    state.keysDown[k.toLowerCase()] = true;

    if (k === 'a' || k === 'A') { _lastATime = Date.now(); }
    if (k === 'n' || k === 'N') {
      _lastNTime = Date.now();
      if (_lastNTime - _lastATime < ACTIVATION_WINDOW && _lastNTime - _lastATime > 0) {
        if (!state.active) { init(); return; }
      }
    }

    if (!state.active || state.gameOver) return;

    if (k === 'f' || k === 'F') { useFlare(); }
    if (k === 'e' || k === 'E') { tryInteract(); }
  }

  function onKeyUp(e) {
    var k = e.key || '';
    state.keysDown[k.toLowerCase()] = false;
    if ((k === 'e' || k === 'E') && state.repairing) {
      state.repairing = false;
      state.repairProgress = 0;
    }
  }

  function onMouseMove(e) {
    if (!state.mouseLocked || state.gameOver) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    state.playerYaw -= dx * 0.002;
    state.playerPitch = clamp(state.playerPitch - dy * 0.002, -1.2, 1.2);
  }

  function onClick() {
    if (!state.active || state.gameOver) return;
    if (!state.mouseLocked) {
      state.renderer.domElement.requestPointerLock();
    } else {
      shoot();
    }
  }

  function onPointerLock() {
    state.mouseLocked = (document.pointerLockElement === state.renderer.domElement);
  }

  function bindInput() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    state.renderer.domElement.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onPointerLock);
  }

  function unbindInput() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPointerLock);
  }

  // ── Shooting ───────────────────────────────────────────────────────────────

  function shoot() {
    var dir = new THREE.Vector3(
      Math.sin(state.playerYaw) * Math.cos(state.playerPitch),
      Math.sin(state.playerPitch),
      Math.cos(state.playerYaw) * Math.cos(state.playerPitch)
    ).negate();
    var origin = new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    var bestDist = 80;
    var hitEnemy = null;
    for (var i = 0; i < state.enemies.length; i++) {
      var en = state.enemies[i];
      if (en.hp <= 0) continue;
      var ep = new THREE.Vector3(en.pos.x, en.pos.y + 0.5, en.pos.z);
      var toEn = ep.clone().sub(origin);
      var proj = toEn.dot(dir);
      if (proj < 0 || proj > bestDist) continue;
      var closest = origin.clone().add(dir.clone().multiplyScalar(proj));
      if (closest.distanceTo(ep) < 1.2) {
        bestDist = proj;
        hitEnemy = en;
      }
    }
    if (hitEnemy) {
      var dmg = hitEnemy.type === 'kane' ? 25 : hitEnemy.type === 'breacher' ? 18 : 22;
      hitEnemy.hp -= dmg;
      if (hitEnemy.type === 'kane') {
        state.kaneHP = hitEnemy.hp;
        if (hitEnemy.hp <= 0) {
          state.kaneAlive = false;
          hitEnemy.mesh.visible = false;
          checkWin();
        }
      } else if (hitEnemy.hp <= 0) {
        if (hitEnemy.carryingArtifact) {
          hitEnemy.carryingArtifact = false;
          state.artifactCarrier = null;
          state.artifactSafe = true;
          state.artifactMesh.position.set(hitEnemy.pos.x, 1.3, hitEnemy.pos.z);
          state.artifactPos.x = hitEnemy.pos.x;
          state.artifactPos.z = hitEnemy.pos.z;
        }
        hitEnemy.mesh.visible = false;
      }
      updateHUD();
    }
    // Damage generator
    var gpos = { x: 12, y: 1.25, z: -5 };
    var dg = dist3(origin, new THREE.Vector3(gpos.x, gpos.y, gpos.z));
    if (dg < 3) {
      state.generatorHP -= 20;
      if (state.generatorHP <= 0 && state.powerOn) {
        state.powerOn = false;
        state.scene.fog = new THREE.FogExp2(0x222244, 0.06);
        updateHUD();
      }
    }
  }

  // ── Flare ─────────────────────────────────────────────────────────────────

  function useFlare() {
    if (state.flareUses <= 0 || state.flareDistractTimer > 0) return;
    state.flareUses--;
    state.flareDistractTimer = 10;
    var flarePos = {
      x: state.playerPos.x + Math.sin(state.playerYaw) * -10,
      y: 1,
      z: state.playerPos.z + Math.cos(state.playerYaw) * -10
    };
    for (var i = 0; i < state.enemies.length; i++) {
      var en = state.enemies[i];
      if (en.hp > 0) {
        en.state = 'distracted';
        en.alertTimer = 10;
        en._distractTarget = flarePos;
      }
    }
    var flMesh = makeMesh(new THREE.SphereGeometry(0.3, 8, 8), 0xff6600);
    addTo(flMesh, flarePos.x, flarePos.y, flarePos.z);
    var flLight = new THREE.PointLight(0xff4400, 3, 12);
    flLight.position.set(flarePos.x, flarePos.y, flarePos.z);
    state.scene.add(flLight);
    state._flareMesh = flMesh;
    state._flareLight = flLight;
    updateHUD();
  }

  // ── Interact (E) ──────────────────────────────────────────────────────────

  function tryInteract() {
    // Rescue researchers
    for (var i = 0; i < state.researchers.length; i++) {
      var r = state.researchers[i];
      if (!r.rescued && dist2(state.playerPos, r.pos) < 3) {
        r.rescued = true;
        r.mesh.visible = false;
        state.researchersRescued++;
        updateHUD();
        checkWin();
        return;
      }
    }
    // Repair entry points
    for (var j = 0; j < state.entryPoints.length; j++) {
      var ep = state.entryPoints[j];
      if (!ep.sealed && dist2(state.playerPos, ep.pos) < 4) {
        state.repairing = true;
        state.repairTarget = ep;
        state.repairProgress = 0;
        return;
      }
    }
    // Repair generator
    if (!state.powerOn && dist2(state.playerPos, { x: 12, z: -5 }) < 4) {
      state.repairing = true;
      state.repairTarget = { type: 'generator' };
      state.repairProgress = 0;
    }
    // Pick up cold suit
    if (!state.hasColdSuit && state.coldSuitMesh && dist2(state.playerPos, { x: 28, z: -15 }) < 3) {
      state.hasColdSuit = true;
      state.coldSuitMesh.visible = false;
      updateHUD();
    }
  }

  // ── Player Update ──────────────────────────────────────────────────────────

  function updatePlayer(dt) {
    if (state.gameOver) return;
    var speed = 5 * dt;
    if (state.blizzardActive) speed *= 0.6;

    var dx = 0, dz = 0;
    if (state.keysDown['w']) { dx += Math.sin(state.playerYaw) * -speed; dz += Math.cos(state.playerYaw) * -speed; }
    if (state.keysDown['s']) { dx += Math.sin(state.playerYaw) * speed; dz += Math.cos(state.playerYaw) * speed; }
    if (state.keysDown['a']) { dx += Math.cos(state.playerYaw) * -speed; dz += Math.sin(state.playerYaw) * speed; }
    if (state.keysDown['d']) { dx += Math.cos(state.playerYaw) * speed; dz += Math.sin(state.playerYaw) * -speed; }

    state.playerPos.x += dx;
    state.playerPos.z += dz;

    // Clamp to world
    state.playerPos.x = clamp(state.playerPos.x, -90, 90);
    state.playerPos.z = clamp(state.playerPos.z, -80, 80);

    // Check inside building
    state.isOutside = true;
    for (var i = 0; i < state.buildings.length; i++) {
      var b = state.buildings[i];
      if (state.playerPos.x >= b.minX && state.playerPos.x <= b.maxX &&
          state.playerPos.z >= b.minZ && state.playerPos.z <= b.maxZ) {
        state.isOutside = false;
        break;
      }
    }

    // Hypothermia
    if (state.isOutside) {
      var rate = state.hasColdSuit ? 1.5 : 6;
      if (state.blizzardActive) rate *= 2;
      state.hypothermia -= rate * dt;
      state.hypothermia = clamp(state.hypothermia, 0, 100);
      if (state.hypothermia <= 0) {
        state.playerHP -= 15 * dt;
        if (state.playerHP <= 0) { triggerGameOver('Hypothermia killed you in the blizzard.'); }
      }
    } else {
      state.hypothermia = clamp(state.hypothermia + 8 * dt, 0, 100);
    }

    // Fallen in cracked lake
    if (state.lakeCracked) {
      var lp = state.lakeMesh.position;
      if (Math.abs(state.playerPos.x - lp.x) < 15 && Math.abs(state.playerPos.z - lp.z) < 10) {
        triggerGameOver('You fell through the frozen lake!');
      }
    }

    // Repair progress
    if (state.repairing && state.keysDown['e']) {
      state.repairProgress += dt;
      if (state.repairTarget && state.repairTarget.type === 'generator') {
        if (state.repairProgress >= 5) {
          state.repairing = false;
          state.powerOn = true;
          state.generatorHP = 100;
          state.scene.fog = new THREE.FogExp2(0xaaccff, state.fogNormal);
          updateHUD();
        }
      } else if (state.repairTarget && !state.repairTarget.type) {
        if (state.repairProgress >= 4) {
          state.repairTarget.sealed = true;
          state.repairTarget.mesh.material.color.setHex(0x00aa44);
          state.entriesSealed++;
          state.repairing = false;
          updateHUD();
        }
      }
    } else if (!state.keysDown['e']) {
      state.repairing = false;
    }

    // Camera
    state.camera.position.set(state.playerPos.x, state.playerPos.y + 0.1, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;
  }

  // ── Enemy Update ──────────────────────────────────────────────────────────

  function updateEnemies(dt) {
    var pp = state.playerPos;
    state.lakeEnemyCount = 0;

    for (var i = 0; i < state.enemies.length; i++) {
      var en = state.enemies[i];
      if (en.hp <= 0) continue;

      var d = dist2(pp, en.pos);
      if (en.alertTimer > 0) en.alertTimer -= dt;

      // Distracted by flare
      if (en.state === 'distracted' && en.alertTimer > 0 && en._distractTarget) {
        var dt2 = en._distractTarget;
        var ddx = dt2.x - en.pos.x, ddz = dt2.z - en.pos.z;
        var dm = Math.sqrt(ddx * ddx + ddz * ddz);
        if (dm > 0.5) {
          en.pos.x += (ddx / dm) * 3 * dt;
          en.pos.z += (ddz / dm) * 3 * dt;
        }
      } else if (d < 25 || en.type === 'kane') {
        en.state = 'chase';
        // Move toward player
        var ex = pp.x - en.pos.x, ez = pp.z - en.pos.z;
        var em = Math.sqrt(ex * ex + ez * ez);
        if (em > 1.5) {
          var spd = en.type === 'kane' ? 1.8 : en.type === 'breacher' ? 2.5 : 2;
          en.pos.x += (ex / em) * spd * dt;
          en.pos.z += (ez / em) * spd * dt;
        }

        // Attack
        en.attackCooldown -= dt;
        if (d < 2.5 && en.attackCooldown <= 0) {
          var dmg = en.type === 'kane' ? 22 : en.type === 'breacher' ? 14 : 8;
          state.playerHP -= dmg;
          en.attackCooldown = en.type === 'kane' ? 1.5 : 2;
          if (state.playerHP <= 0) { triggerGameOver('You were killed by mercenaries.'); }
        }

        // Kane or enemy tries to grab artifact
        if (!state.artifactCarrier && en.type === 'kane' && dist2(en.pos, state.artifactPos) < 2) {
          state.artifactCarrier = en;
          en.carryingArtifact = true;
          state.artifactSafe = false;
        }
        if (!state.artifactCarrier && en.type !== 'kane' && dist2(en.pos, state.artifactPos) < 2) {
          state.artifactCarrier = en;
          en.carryingArtifact = true;
          state.artifactSafe = false;
        }
      } else {
        // Patrol
        en.state = 'patrol';
        en.patrolAngle += 0.5 * dt;
        en.pos.x += Math.cos(en.patrolAngle) * 1.5 * dt;
        en.pos.z += Math.sin(en.patrolAngle) * 1.5 * dt;
      }

      // Carry artifact toward helipad (0, 6, -15)
      if (en.carryingArtifact) {
        var hx = 0 - en.pos.x, hz = -15 - en.pos.z;
        var hm = Math.sqrt(hx * hx + hz * hz);
        if (hm > 1) {
          en.pos.x += (hx / hm) * 2 * dt;
          en.pos.z += (hz / hm) * 2 * dt;
        } else {
          triggerGameOver('Artifact extracted to helipad! Mission failed.');
        }
        state.artifactPos.x = en.pos.x;
        state.artifactPos.z = en.pos.z;
        if (state.artifactMesh) {
          state.artifactMesh.position.set(en.pos.x, 1.8, en.pos.z);
        }
      }

      // Update mesh
      en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);

      // Check lake crossing
      var lpos = state.lakeMesh ? state.lakeMesh.position : { x: -50, z: 10 };
      if (Math.abs(en.pos.x - lpos.x) < 15 && Math.abs(en.pos.z - lpos.z) < 10) {
        state.lakeEnemyCount++;
      }
    }

    // Lake crack
    if (!state.lakeCracked && state.lakeEnemyCount >= 2) {
      state.lakeCracked = true;
      if (state.lakeMesh) state.lakeMesh.material.color.setHex(0x5588aa);
    }
  }

  // ── Blizzard ───────────────────────────────────────────────────────────────

  function updateBlizzard(dt) {
    state.blizzardTimer += dt;
    if (!state.blizzardActive) {
      if (state.blizzardTimer >= state.blizzardCooldown) {
        state.blizzardActive = true;
        state.blizzardTimer = 0;
        if (state.scene) state.scene.fog = new THREE.FogExp2(0x9999cc, 0.1);
      }
    } else {
      if (state.blizzardTimer >= state.blizzardDuration) {
        state.blizzardActive = false;
        state.blizzardTimer = 0;
        if (state.scene && state.powerOn) state.scene.fog = new THREE.FogExp2(0xaaccff, state.fogNormal);
      }
    }

    // Animate particles
    for (var i = 0; i < state.blizzardParticles.length; i++) {
      var p = state.blizzardParticles[i];
      var v = p.userData.vel;
      p.position.x += v.x * dt * (state.blizzardActive ? 4 : 1);
      p.position.y += v.y * dt * (state.blizzardActive ? 3 : 1);
      p.position.z += v.z * dt * (state.blizzardActive ? 4 : 1);
      if (p.position.y < 0) {
        p.position.y = 20;
        p.position.x = state.playerPos.x + (Math.random() - 0.5) * 80;
        p.position.z = state.playerPos.z + (Math.random() - 0.5) * 80;
      }
      if (Math.abs(p.position.x - state.playerPos.x) > 60) {
        p.position.x = state.playerPos.x + (Math.random() - 0.5) * 80;
      }
      if (Math.abs(p.position.z - state.playerPos.z) > 60) {
        p.position.z = state.playerPos.z + (Math.random() - 0.5) * 80;
      }
    }
  }

  // ── Artifact Glow ─────────────────────────────────────────────────────────

  function updateArtifact(dt) {
    if (!state.artifactMesh || state.artifactCarrier) return;
    var t = Date.now() * 0.001;
    state.artifactMesh.rotation.y += dt;
    state.artifactMesh.material.color.setHSL(0.6 + Math.sin(t) * 0.05, 0.8, 0.6);
  }

  // ── Flare Timer ───────────────────────────────────────────────────────────

  function updateFlare(dt) {
    if (state.flareDistractTimer > 0) {
      state.flareDistractTimer -= dt;
      if (state.flareDistractTimer <= 0) {
        state.flareDistractTimer = 0;
        if (state._flareMesh) { state.scene.remove(state._flareMesh); state._flareMesh = null; }
        if (state._flareLight) { state.scene.remove(state._flareLight); state._flareLight = null; }
        for (var i = 0; i < state.enemies.length; i++) {
          if (state.enemies[i].state === 'distracted') {
            state.enemies[i].state = 'patrol';
          }
        }
      }
    }
  }

  // ── Win / Lose ─────────────────────────────────────────────────────────────

  function checkWin() {
    if (state.artifactSafe && !state.kaneAlive && state.researchersRescued >= 4) {
      state.gameWon = true;
      state.gameOver = true;
      showEndScreen('MISSION COMPLETE', 'Artifact protected. Kane eliminated. All researchers rescued.', '#0f0');
    }
  }

  function triggerGameOver(msg) {
    if (state.gameOver) return;
    state.gameOver = true;
    showEndScreen('MISSION FAILED', msg, '#f44');
  }

  function showEndScreen(title, msg, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.75)', 'z-index:10000',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'font:bold 28px monospace', 'color:' + color,
      'text-align:center'
    ].join(';');
    el.innerHTML = '<div>' + title + '</div>' +
      '<div style="font-size:16px;color:#eef;margin-top:16px;max-width:500px">' + msg + '</div>' +
      '<div style="font-size:14px;color:#aaa;margin-top:24px">Press R to restart</div>';
    document.body.appendChild(el);
    state.endScreenEl = el;
    document.addEventListener('keydown', function restartListener(e) {
      if (e.key === 'r' || e.key === 'R') {
        document.removeEventListener('keydown', restartListener);
        reset();
      }
    });
  }

  // ── Animate ────────────────────────────────────────────────────────────────

  function animate(ts) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);
    var dt = Math.min((ts - state.lastTime) / 1000, 0.05);
    state.lastTime = ts;
    if (dt <= 0) { state.renderer.render(state.scene, state.camera); return; }

    if (!state.gameOver) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateBlizzard(dt);
      updateArtifact(dt);
      updateFlare(dt);
      updateHUD();
    }
    state.renderer.render(state.scene, state.camera);
  }

  // ── Init / Reset ──────────────────────────────────────────────────────────

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE not loaded');
      return;
    }
    state.active = true;
    state.startTime = Date.now();
    state.lastTime = 0;
    state.gameOver = false;
    state.gameWon = false;
    state.playerHP = 100;
    state.hypothermia = 100;
    state.playerPos = { x: 0, y: 1.7, z: 20 };
    state.playerYaw = Math.PI;
    state.playerPitch = 0;
    state.hasColdSuit = false;
    state.flareUses = 2;
    state.flareDistractTimer = 0;
    state.artifactSafe = true;
    state.artifactCarrier = null;
    state.artifactPos = { x: 0, y: 1, z: -46 };
    state.powerOn = true;
    state.generatorHP = 100;
    state.entriesSealed = 0;
    state.researchersRescued = 0;
    state.kaneHP = 480;
    state.kaneAlive = true;
    state.lakeCracked = false;
    state.blizzardActive = false;
    state.blizzardTimer = 0;
    state.enemies = [];
    state.blizzardParticles = [];
    state.buildings = [];
    state.researchers = [];
    state.entryPoints = [];
    state.objects = [];
    state.keysDown = {};

    setupScene();
    buildGround();
    buildBuildings();
    buildArtifact();
    buildEntryPoints();
    buildResearchers();
    buildEnemies();
    buildBlizzard();
    buildHUD();
    bindInput();

    state.animFrameId = requestAnimationFrame(animate);
  }

  function reset() {
    if (state.animFrameId) { cancelAnimationFrame(state.animFrameId); state.animFrameId = null; }
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
    if (state.endScreenEl && state.endScreenEl.parentNode) {
      state.endScreenEl.parentNode.removeChild(state.endScreenEl);
      state.endScreenEl = null;
    }
    unbindInput();
    window.removeEventListener('resize', onResize);
    if (document.pointerLockElement) { document.exitPointerLock(); }
    state.active = false;
    state.scene = null;
    state.camera = null;
    state.mouseLocked = false;
    init();
  }

  function update() {}

  // ── Key listener for A→N activation (global, before init) ─────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'a' || e.key === 'A') { _lastATime = Date.now(); }
    if (e.key === 'n' || e.key === 'N') {
      _lastNTime = Date.now();
      if (_lastNTime - _lastATime < ACTIVATION_WINDOW && _lastNTime - _lastATime > 0 && !state.active) {
        init();
      }
    }
  });

  return { init: init, update: update, reset: reset };
})();
