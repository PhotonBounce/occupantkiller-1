window.MountainVillage = (function () {
  'use strict';

  var scene, camera;
  var objects = [];
  var enemies = [];
  var active = false;
  var hudEl = null;
  var notifEl = null;
  var powsRescued = 0;
  var warlordDead = false;
  var windTime = 0;
  var baseRotX = 0;
  var lastMTime = 0;
  var keydownHandler = null;

  // ── helpers ──────────────────────────────────────────────────────────────

  function addObj(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function box(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return addObj(mesh);
  }

  function cylinder(rt, rb, h, seg, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return addObj(mesh);
  }

  function cone(r, h, seg, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, seg);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return addObj(mesh);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'mv-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#ffdd88',
      'font-family:monospace',
      'font-size:14px',
      'pointer-events:none',
      'z-index:9999',
      'text-shadow:1px 1px 2px #000'
    ].join(';');
    document.body.appendChild(hudEl);
    updateHUD();
  }

  function updateHUD() {
    if (!hudEl) return;
    hudEl.innerHTML =
      'POWs RESCUED: ' + powsRescued + '/3<br>' +
      'WARLORD: ' + (warlordDead ? '<span style="color:#88ff88">ELIMINATED</span>' : '<span style="color:#ff4444">AT LARGE</span>');
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
    }
    hudEl = null;
  }

  function showNotif(msg) {
    if (notifEl && notifEl.parentNode) {
      notifEl.parentNode.removeChild(notifEl);
    }
    notifEl = document.createElement('div');
    notifEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ffdd88',
      'font-family:monospace',
      'font-size:22px',
      'pointer-events:none',
      'z-index:10000',
      'text-shadow:2px 2px 4px #000',
      'background:rgba(0,0,0,0.5)',
      'padding:12px 24px',
      'border-radius:6px'
    ].join(';');
    notifEl.textContent = msg;
    document.body.appendChild(notifEl);
    setTimeout(function () {
      if (notifEl && notifEl.parentNode) {
        notifEl.parentNode.removeChild(notifEl);
      }
      notifEl = null;
    }, 2000);
  }

  // ── world builder ─────────────────────────────────────────────────────────

  function buildTerrain() {
    // Ground plane
    box(120, 1, 120, 0x8b7355, 0, -0.5, 0);
    // Mountain ramps (sloped-ish using rotated boxes)
    var ramp1 = box(30, 6, 20, 0x7a6545, -40, 2, -30);
    ramp1.rotation.x = 0.3;
    var ramp2 = box(25, 8, 18, 0x6e5a3a, 35, 3, -45);
    ramp2.rotation.z = -0.2;
    var ramp3 = box(20, 10, 15, 0x7a6545, -50, 4, 20);
    ramp3.rotation.x = -0.25;
    // Hilltop LZ platform
    box(14, 3, 14, 0x9b8a6a, 40, 1.5, 30);
    // Dirt paths
    box(60, 0.2, 3, 0x9e8060, 0, 0.1, 5);
    box(3, 0.2, 50, 0x9e8060, -10, 0.1, -10);
  }

  function buildHouses() {
    // House 1
    box(8, 4, 7, 0xc8a96e, -10, 2, -10);
    box(9, 0.5, 8, 0xb89a60, -10, 4.25, -10);
    // House 2
    box(7, 5, 6, 0xd4b57a, 5, 2.5, -15);
    box(8, 0.5, 7, 0xc4a568, 5, 5.25, -15);
    // House 3
    box(9, 4, 8, 0xbe9f65, -20, 2, 5);
    box(10, 0.5, 9, 0xae8f55, -20, 4.25, 5);
    // House 4 (ruined, shorter)
    box(6, 2.5, 6, 0xc0a060, 10, 1.25, 5);
    box(7, 0.5, 7, 0xb09050, 10, 2.75, 5);
    // House 5
    box(8, 4.5, 7, 0xca9f6a, -5, 2.25, -25);
    box(9, 0.5, 8, 0xba8f5a, -5, 4.75, -25);
  }

  function buildMinaret() {
    // Tower body
    cylinder(0.8, 1.0, 14, 8, 0xe0c890, 15, 7, -20);
    // Balcony ring
    cylinder(1.3, 1.3, 0.5, 8, 0xd4bc80, 15, 14.25, -20);
    // Upper shaft
    cylinder(0.5, 0.8, 4, 8, 0xe0c890, 15, 16.5, -20);
    // Cone top (crescent implied)
    cone(0.7, 2.5, 8, 0xc8a855, 15, 19.75, -20);
  }

  function buildCompoundWall() {
    // Four walls forming a compound rectangle
    // North wall
    box(24, 3, 1, 0xb89060, 0, 1.5, -36);
    // South wall
    box(24, 3, 1, 0xb89060, 0, 1.5, -22);
    // West wall
    box(1, 3, 14, 0xb89060, -12, 1.5, -29);
    // East wall (with gate gap)
    box(8, 3, 1, 0xb89060, 8, 1.5, -29);
    box(8, 3, 1, 0xb89060, -8, 1.5, -29);
    // Gate posts
    box(1.2, 4, 1.2, 0xa07840, -4, 2, -29);
    box(1.2, 4, 1.2, 0xa07840, 4, 2, -29);
    // Compound interior building (warlord HQ)
    box(10, 5, 8, 0xc0904a, 0, 2.5, -31);
    box(11, 0.6, 9, 0xb08040, 0, 5.3, -31);
    // Watchtower corners
    box(2, 5, 2, 0xa07840, -11, 2.5, -35);
    box(2, 5, 2, 0xa07840, 11, 2.5, -35);
    box(2, 5, 2, 0xa07840, -11, 2.5, -23);
    box(2, 5, 2, 0xa07840, 11, 2.5, -23);
  }

  function buildWell() {
    // Well shaft
    cylinder(1.0, 1.0, 1.5, 8, 0x9a8468, -15, 0.75, 10);
    // Well rim
    cylinder(1.2, 1.2, 0.3, 8, 0x8a7458, -15, 1.65, 10);
    // Crossbar support
    box(0.2, 2, 0.2, 0x6a5030, -15.8, 2.5, 10);
    box(0.2, 2, 0.2, 0x6a5030, -14.2, 2.5, 10);
    box(3, 0.2, 0.2, 0x6a5030, -15, 3.5, 10);
    // Bucket (small box)
    box(0.4, 0.4, 0.4, 0x5a4020, -15, 2.5, 10);
  }

  function buildMarketStalls() {
    // Stall 1 — canopy + posts
    box(6, 0.2, 4, 0xc84020, -2, 2.5, 8);   // red canopy
    box(0.2, 2.5, 0.2, 0x8b6914, -5, 1.25, 6);
    box(0.2, 2.5, 0.2, 0x8b6914, 1, 1.25, 6);
    box(0.2, 2.5, 0.2, 0x8b6914, -5, 1.25, 10);
    box(0.2, 2.5, 0.2, 0x8b6914, 1, 1.25, 10);
    // Stall 2
    box(6, 0.2, 4, 0x205080, 8, 2.5, 8);    // blue canopy
    box(0.2, 2.5, 0.2, 0x8b6914, 5, 1.25, 6);
    box(0.2, 2.5, 0.2, 0x8b6914, 11, 1.25, 6);
    box(0.2, 2.5, 0.2, 0x8b6914, 5, 1.25, 10);
    box(0.2, 2.5, 0.2, 0x8b6914, 11, 1.25, 10);
    // Stall 3 — goods on table
    box(6, 0.2, 4, 0x206020, -12, 2.5, 8);  // green canopy
    box(4, 0.3, 2, 0xa07840, -12, 1.15, 8); // table
  }

  function buildPOWCells() {
    // Three POW markers in compound (visual only — cages)
    var cageColor = 0x666666;
    // Cage 1
    box(1.5, 1.5, 1.5, cageColor, -4, 0.75, -34);
    box(1.5, 0.1, 1.5, cageColor, -4, 1.52, -34);
    // Cage 2
    box(1.5, 1.5, 1.5, cageColor, 0, 0.75, -34);
    box(1.5, 0.1, 1.5, cageColor, 0, 1.52, -34);
    // Cage 3
    box(1.5, 1.5, 1.5, cageColor, 4, 0.75, -34);
    box(1.5, 0.1, 1.5, cageColor, 4, 1.52, -34);
  }

  function buildEnemies() {
    var positions = [
      [-8, 0, -5],
      [12, 0, -12],
      [-3, 0, -20],
      [6, 0, -28],
      [-6, 0, -30],
      [2, 0, 15],
      [-18, 0, -2]
    ];
    for (var i = 0; i < positions.length; i++) {
      var px = positions[i][0];
      var py = positions[i][1];
      var pz = positions[i][2];
      var isWarlord = (i === 4);
      buildFighter(px, py, pz, isWarlord);
    }
  }

  function buildFighter(px, py, pz, isWarlord) {
    var bodyColor = isWarlord ? 0x5a3a1a : 0x9e8060;
    var turbColor = isWarlord ? 0x1a1a6a : 0xd4c090;
    // Torso
    var torso = box(0.7, 1.0, 0.4, bodyColor, px, py + 1.3, pz);
    // Head
    var head = box(0.5, 0.5, 0.5, 0xc8a07a, px, py + 2.1, pz);
    // Turban (cone)
    var turb = cone(0.35, 0.5, 6, turbColor, px, py + 2.55, pz);
    // Legs
    var legL = box(0.28, 0.8, 0.28, bodyColor, px - 0.2, py + 0.4, pz);
    var legR = box(0.28, 0.8, 0.28, bodyColor, px + 0.2, py + 0.4, pz);
    // Arms
    var armL = box(0.2, 0.7, 0.2, bodyColor, px - 0.5, py + 1.2, pz);
    var armR = box(0.2, 0.7, 0.2, bodyColor, px + 0.5, py + 1.2, pz);

    var fighter = {
      parts: [torso, head, turb, legL, legR, armL, armR],
      isWarlord: isWarlord,
      alive: true,
      bobOffset: Math.random() * Math.PI * 2,
      baseY: py,
      x: px,
      z: pz
    };
    enemies.push(fighter);
  }

  function buildLighting() {
    var ambient = new THREE.AmbientLight(0xffeedd, 0.7);
    scene.add(ambient);
    objects.push(ambient);

    var sun = new THREE.DirectionalLight(0xffddaa, 1.0);
    sun.position.set(30, 60, 20);
    scene.add(sun);
    objects.push(sun);
  }

  function buildScene() {
    buildTerrain();
    buildHouses();
    buildMinaret();
    buildCompoundWall();
    buildWell();
    buildMarketStalls();
    buildPOWCells();
    buildEnemies();
    buildLighting();
  }

  // ── keybinding ────────────────────────────────────────────────────────────

  function setupKeys() {
    keydownHandler = function (e) {
      var key = (e.key || '').toUpperCase();
      if (key === 'M') {
        lastMTime = Date.now();
      } else if (key === 'V') {
        if (Date.now() - lastMTime < 400) {
          toggleModule();
        }
      }
    };
    window.addEventListener('keydown', keydownHandler);
  }

  function teardownKeys() {
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  }

  function toggleModule() {
    if (active) {
      deactivate();
      showNotif('MOUNTAIN VILLAGE — OFF');
    } else {
      activate();
      showNotif('MOUNTAIN VILLAGE — ON');
    }
  }

  // ── activate / deactivate ─────────────────────────────────────────────────

  function activate() {
    if (active) return;
    active = true;
    buildScene();
    createHUD();
  }

  function deactivate() {
    if (!active) return;
    active = false;
    clearObjects();
    enemies = [];
    removeHUD();
    // Restore camera rotation
    if (camera) camera.rotation.x = baseRotX;
  }

  function clearObjects() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) objects[i].material.dispose();
    }
    objects = [];
  }

  // ── public API ────────────────────────────────────────────────────────────

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    baseRotX = camera ? camera.rotation.x : 0;
    windTime = 0;
    powsRescued = 0;
    warlordDead = false;
    setupKeys();
    // Auto-activate on init
    activate();
  }

  function update(delta) {
    if (!active) return;

    // Wind oscillation on camera
    if (camera) {
      windTime += delta;
      camera.rotation.x = baseRotX + Math.sin(windTime * 0.4) * 0.004 + Math.sin(windTime * 1.1) * 0.002;
    }

    // Bob enemies
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) continue;
      var bob = Math.sin(windTime * 2 + e.bobOffset) * 0.03;
      for (var p = 0; p < e.parts.length; p++) {
        e.parts[p].position.y += bob * 0.1; // gentle sway
      }
    }
  }

  function reset() {
    deactivate();
    teardownKeys();
    if (notifEl && notifEl.parentNode) {
      notifEl.parentNode.removeChild(notifEl);
      notifEl = null;
    }
    powsRescued = 0;
    warlordDead = false;
    windTime = 0;
    lastMTime = 0;
    enemies = [];
    objects = [];
  }

  return { init: init, update: update, reset: reset };

}());
