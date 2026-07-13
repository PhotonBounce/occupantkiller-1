window.AirportSiege = (function () {
  'use strict';

  // --- State ---
  var scene, camera;
  var objects = [];
  var enemies = [];
  var hostages = [];
  var active = false;
  var hudEl = null;
  var notifEl = null;

  var hostagesFreed = 0;
  var totalHostages = 20;
  var planeStartX = -120;
  var planeEndX = 120;
  var planeX = planeStartX;
  var planeSpeed = 3; // units per second
  var planeGroup = null;
  var planeStopped = false;

  var keyState = {};
  var lastATime = 0;
  var notifTimer = 0;

  // --- Helpers ---
  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    return m;
  }

  function addToScene(obj) {
    scene.add(obj);
    objects.push(obj);
    return obj;
  }

  function mat(color, emissive) {
    return new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive || 0x000000
    });
  }

  // --- Build terminal building ---
  function buildTerminal() {
    var geo = new THREE.BoxGeometry(80, 12, 30);
    var m = makeMesh(geo, mat(0x8899aa));
    m.position.set(0, 6, -60);
    addToScene(m);

    // Windows (flat boxes on front face)
    for (var i = -3; i <= 3; i++) {
      var wgeo = new THREE.BoxGeometry(8, 4, 0.5);
      var wm = makeMesh(wgeo, mat(0x88ccff, 0x224466));
      wm.position.set(i * 11, 7, -45.3);
      addToScene(wm);
    }

    // Roof trim
    var rgeo = new THREE.BoxGeometry(82, 1, 32);
    var rm = makeMesh(rgeo, mat(0x667788));
    rm.position.set(0, 12.5, -60);
    addToScene(rm);
  }

  // --- Build control tower ---
  function buildControlTower() {
    // Shaft
    var shaft = makeMesh(new THREE.BoxGeometry(6, 30, 6), mat(0x99aabb));
    shaft.position.set(50, 15, -65);
    addToScene(shaft);

    // Cab (cylinder)
    var cab = makeMesh(new THREE.CylinderGeometry(5, 4, 6, 8), mat(0x77aacc, 0x112233));
    cab.position.set(50, 33, -65);
    addToScene(cab);

    // Antenna
    var ant = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), mat(0xffffff));
    ant.position.set(50, 40, -65);
    addToScene(ant);
  }

  // --- Build jetways ---
  function buildJetways() {
    var positions = [[-30, -45], [0, -45], [30, -45]];
    for (var i = 0; i < positions.length; i++) {
      var jgeo = new THREE.BoxGeometry(4, 4, 15);
      var jm = makeMesh(jgeo, mat(0x778899));
      jm.position.set(positions[i][0], 2, positions[i][1]);
      addToScene(jm);
    }
  }

  // --- Build security checkpoints ---
  function buildCheckpoints() {
    var xPositions = [-20, 0, 20];
    for (var i = 0; i < xPositions.length; i++) {
      // Booth
      var bgeo = new THREE.BoxGeometry(3, 5, 3);
      var bm = makeMesh(bgeo, mat(0x445566));
      bm.position.set(xPositions[i], 2.5, -30);
      addToScene(bm);

      // Barrier
      var bageo = new THREE.BoxGeometry(8, 1, 0.5);
      var bam = makeMesh(bageo, mat(0xffcc00));
      bam.position.set(xPositions[i], 1, -27);
      addToScene(bam);
    }
  }

  // --- Build luggage carts ---
  function buildLuggageCarts() {
    var positions = [
      [-40, -20], [40, -20], [-55, 0], [55, 0], [-40, 20], [40, 20]
    ];
    for (var i = 0; i < positions.length; i++) {
      var cgeo = new THREE.BoxGeometry(4, 1.5, 2);
      var cm = makeMesh(cgeo, mat(0xeeaa22));
      cm.position.set(positions[i][0], 0.75, positions[i][1]);
      addToScene(cm);

      // Luggage stack
      var lgeo = new THREE.BoxGeometry(3, 2, 1.5);
      var lm = makeMesh(lgeo, mat(0x994422));
      lm.position.set(positions[i][0], 2.5, positions[i][1]);
      addToScene(lm);
    }
  }

  // --- Build static parked airplane ---
  function buildParkedPlane(x, z) {
    var group = new THREE.Group();

    // Fuselage
    var fgeo = new THREE.BoxGeometry(6, 4, 30);
    var fm = makeMesh(fgeo, mat(0xffffff));
    fm.position.set(0, 0, 0);
    group.add(fm);

    // Wings
    var wgeo = new THREE.BoxGeometry(40, 0.8, 8);
    var wm = makeMesh(wgeo, mat(0xddddee));
    wm.position.set(0, -0.5, 2);
    group.add(wm);

    // Tail fin
    var tgeo = new THREE.BoxGeometry(1.5, 5, 4);
    var tm = makeMesh(tgeo, mat(0xddddee));
    tm.position.set(0, 3, -13);
    group.add(tm);

    // Horizontal stabilizer
    var hsgeo = new THREE.BoxGeometry(12, 0.6, 3);
    var hsm = makeMesh(hsgeo, mat(0xddddee));
    hsm.position.set(0, 0.5, -13);
    group.add(hsm);

    // Engines (cylinders)
    var egeo = new THREE.CylinderGeometry(1, 1.2, 5, 8);
    var em1 = makeMesh(egeo, mat(0xaaaaaa));
    em1.rotation.x = Math.PI / 2;
    em1.position.set(-10, -1.5, 2);
    group.add(em1);

    var em2 = makeMesh(egeo.clone(), mat(0xaaaaaa));
    em2.rotation.x = Math.PI / 2;
    em2.position.set(10, -1.5, 2);
    group.add(em2);

    group.position.set(x, 3, z);
    addToScene(group);
    return group;
  }

  // --- Build taxiing airplane ---
  function buildTaxiingPlane() {
    planeGroup = new THREE.Group();

    // Fuselage - red stripe for hijacked
    var fgeo = new THREE.BoxGeometry(6, 4, 32);
    var fm = makeMesh(fgeo, mat(0xffffff));
    fm.position.set(0, 0, 0);
    planeGroup.add(fm);

    var stripegeo = new THREE.BoxGeometry(6.1, 1, 32.1);
    var stripe = makeMesh(stripegeo, mat(0xff2200));
    stripe.position.set(0, 1, 0);
    planeGroup.add(stripe);

    // Wings
    var wgeo = new THREE.BoxGeometry(50, 0.8, 10);
    var wm = makeMesh(wgeo, mat(0xddddee));
    wm.position.set(0, -0.5, 3);
    planeGroup.add(wm);

    // Tail fin
    var tgeo = new THREE.BoxGeometry(1.5, 6, 5);
    var tm = makeMesh(tgeo, mat(0xff2200));
    tm.position.set(0, 4, -14);
    planeGroup.add(tm);

    // Engines
    var egeo = new THREE.CylinderGeometry(1.2, 1.4, 6, 8);
    var em1 = makeMesh(egeo, mat(0x888888));
    em1.rotation.x = Math.PI / 2;
    em1.position.set(-13, -1.5, 3);
    planeGroup.add(em1);

    var em2 = makeMesh(egeo.clone(), mat(0x888888));
    em2.rotation.x = Math.PI / 2;
    em2.position.set(13, -1.5, 3);
    planeGroup.add(em2);

    planeGroup.position.set(planeX, 3, 30);
    planeGroup.rotation.y = Math.PI / 2; // facing along X axis

    addToScene(planeGroup);
  }

  // --- Build enemy (terrorist) ---
  function buildEnemy(x, z, isPilot) {
    var group = new THREE.Group();
    var color = isPilot ? 0x334488 : 0x222222;
    var headColor = isPilot ? 0xffccaa : 0xffccaa;

    // Body
    var bgeo = new THREE.BoxGeometry(1.2, 2, 0.8);
    var bm = makeMesh(bgeo, mat(color));
    bm.position.set(0, 1, 0);
    group.add(bm);

    // Head
    var hgeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var hm = makeMesh(hgeo, mat(headColor));
    hm.position.set(0, 2.4, 0);
    group.add(hm);

    // Helmet/hat
    if (!isPilot) {
      var helmgeo = new THREE.BoxGeometry(0.9, 0.4, 0.9);
      var helmm = makeMesh(helmgeo, mat(0x111111));
      helmm.position.set(0, 2.85, 0);
      group.add(helmm);
    } else {
      var capgeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8);
      var capm = makeMesh(capgeo, mat(0x223366));
      capm.position.set(0, 2.85, 0);
      group.add(capm);
    }

    // Arms
    var argeo = new THREE.BoxGeometry(0.35, 1.5, 0.35);
    var arm1 = makeMesh(argeo, mat(color));
    arm1.position.set(-0.8, 1.2, 0);
    group.add(arm1);
    var arm2 = makeMesh(argeo.clone(), mat(color));
    arm2.position.set(0.8, 1.2, 0);
    group.add(arm2);

    // Rifle (box)
    var rgeo = new THREE.BoxGeometry(0.15, 0.15, 1.5);
    var rm = makeMesh(rgeo, mat(0x333333));
    rm.position.set(0.8, 1.5, 0.8);
    group.add(rm);

    // Legs
    var leggeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    var leg1 = makeMesh(leggeo, mat(color));
    leg1.position.set(-0.35, 0, 0);
    group.add(leg1);
    var leg2 = makeMesh(leggeo.clone(), mat(color));
    leg2.position.set(0.35, 0, 0);
    group.add(leg2);

    group.position.set(x, 0, z);
    group.userData.isPilot = isPilot;
    group.userData.hp = isPilot ? 3 : 1;
    group.userData.patrolDir = Math.random() > 0.5 ? 1 : -1;
    group.userData.patrolTimer = 0;
    group.userData.alive = true;
    addToScene(group);
    enemies.push(group);
    return group;
  }

  // --- Build hostages ---
  function buildHostage(x, z) {
    var group = new THREE.Group();

    // Body
    var bgeo = new THREE.BoxGeometry(0.9, 1.8, 0.6);
    var bm = makeMesh(bgeo, mat(0xcc8844));
    bm.position.set(0, 0.9, 0);
    group.add(bm);

    // Head
    var hgeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    var hm = makeMesh(hgeo, mat(0xffddbb));
    hm.position.set(0, 2.05, 0);
    group.add(hm);

    // Hands up (arms raised)
    var argeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    var arm1 = makeMesh(argeo, mat(0xcc8844));
    arm1.position.set(-0.7, 2, 0);
    arm1.rotation.z = 0.8;
    group.add(arm1);
    var arm2 = makeMesh(argeo.clone(), mat(0xcc8844));
    arm2.position.set(0.7, 2, 0);
    arm2.rotation.z = -0.8;
    group.add(arm2);

    group.position.set(x, 0, z);
    group.userData.freed = false;
    addToScene(group);
    hostages.push(group);
    return group;
  }

  // --- Build tarmac ground ---
  function buildTarmac() {
    var tgeo = new THREE.BoxGeometry(300, 0.2, 200);
    var tm = makeMesh(tgeo, mat(0x334444));
    tm.position.set(0, -0.1, 0);
    addToScene(tm);

    // Runway markings (flat boxes)
    for (var i = -5; i <= 5; i++) {
      var mgeo = new THREE.BoxGeometry(2, 0.05, 10);
      var mm = makeMesh(mgeo, mat(0xffffff));
      mm.position.set(i * 22, 0, 50);
      addToScene(mm);
    }

    // Taxiway line
    var lgeo = new THREE.BoxGeometry(240, 0.05, 1);
    var lm = makeMesh(lgeo, mat(0xffff00));
    lm.position.set(0, 0, 30);
    addToScene(lm);
  }

  // --- Build ambient lights stored in objects ---
  function buildLights() {
    var ambient = new THREE.AmbientLight(0x888888);
    addToScene(ambient);

    var sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 80, 30);
    addToScene(sun);
  }

  // --- HUD ---
  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'airport-siege-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:15px',
      'padding:10px 20px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'display:none'
    ].join(';');
    document.body.appendChild(hudEl);

    notifEl = document.createElement('div');
    notifEl.id = 'airport-siege-notif';
    notifEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(200,50,0,0.85)',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'padding:10px 28px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:10000',
      'display:none'
    ].join(';');
    document.body.appendChild(notifEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var dist = Math.max(0, Math.round(planeEndX - planeX));
    var planeStatus = planeStopped
      ? '<span style="color:#ff4400">STOPPED</span>'
      : '<span style="color:#ffff00">TAXIING</span>';
    hudEl.innerHTML =
      'HOSTAGES: ' + hostagesFreed + '/' + totalHostages + ' FREED' +
      ' &nbsp;|&nbsp; PLANE: ' + planeStatus + ' &mdash; ' + dist + 'm to runway';
  }

  function showNotif(msg, color) {
    if (!notifEl) return;
    notifEl.textContent = msg;
    notifEl.style.background = color || 'rgba(200,50,0,0.85)';
    notifEl.style.display = 'block';
    notifTimer = 2.5;
  }

  // --- Key handlers ---
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    keyState[key] = true;

    if (key === 'a') {
      lastATime = Date.now();
    }
    if (key === 's') {
      var now = Date.now();
      if (now - lastATime < 400) {
        toggleModule();
        lastATime = 0;
      }
    }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    keyState[key] = false;
  }

  function toggleModule() {
    if (active) {
      deactivate();
    } else {
      activate();
    }
  }

  function activate() {
    active = true;
    if (hudEl) hudEl.style.display = 'block';
    showNotif('AIRPORT SIEGE — ACTIVATED', 'rgba(0,140,60,0.9)');
  }

  function deactivate() {
    active = false;
    if (hudEl) hudEl.style.display = 'none';
    showNotif('AIRPORT SIEGE — DEACTIVATED', 'rgba(80,80,80,0.9)');
  }

  // --- Patrol update for enemies ---
  function updateEnemies(delta) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.userData.alive) continue;

      e.userData.patrolTimer += delta;
      if (e.userData.patrolTimer > 2) {
        e.userData.patrolDir *= -1;
        e.userData.patrolTimer = 0;
      }

      e.position.x += e.userData.patrolDir * 2 * delta;
      e.rotation.y = e.userData.patrolDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  }

  // --- Check hostage proximity (auto-free when near) ---
  function updateHostages() {
    if (!camera) return;
    for (var i = 0; i < hostages.length; i++) {
      var h = hostages[i];
      if (h.userData.freed) continue;
      var dx = camera.position.x - h.position.x;
      var dz = camera.position.z - h.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        h.userData.freed = true;
        hostagesFreed++;
        h.visible = false;
        showNotif('HOSTAGE FREED! ' + hostagesFreed + '/' + totalHostages, 'rgba(0,120,200,0.9)');
      }
    }
  }

  // --- Update taxiing plane ---
  function updatePlane(delta) {
    if (planeStopped) return;
    planeX += planeSpeed * delta;
    if (planeX >= planeEndX) {
      planeX = planeEndX;
      planeStopped = true;
      showNotif('PLANE REACHED RUNWAY! MISSION FAILED!', 'rgba(200,0,0,0.95)');
    }
    if (planeGroup) {
      planeGroup.position.x = planeX;
    }

    // Check if camera is near the plane (intercept)
    if (camera && !planeStopped) {
      var dx = camera.position.x - planeX;
      var dz = camera.position.z - 30;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 10) {
        planeStopped = true;
        showNotif('PLANE INTERCEPTED! WELL DONE!', 'rgba(0,160,60,0.95)');
      }
    }
  }

  // --- Public API ---
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildLights();
    buildTarmac();
    buildTerminal();
    buildControlTower();
    buildJetways();
    buildCheckpoints();
    buildLuggageCarts();

    // Static parked planes
    buildParkedPlane(-70, -10);
    buildParkedPlane(-70, 10);
    buildParkedPlane(70, -10);

    // Taxiing hijacked plane
    buildTaxiingPlane();

    // Enemies: terrorists scattered around terminal
    buildEnemy(-35, -40, false);
    buildEnemy(-15, -35, false);
    buildEnemy(10, -50, false);
    buildEnemy(30, -38, false);
    buildEnemy(-50, 5, false);
    buildEnemy(45, 10, false);
    buildEnemy(0, -20, false);
    buildEnemy(-25, 15, false);
    // Hijacker pilot near taxiing plane
    buildEnemy(planeStartX + 10, 25, true);

    // Hostages on tarmac
    var hPositions = [
      [-10, 10], [10, 15], [-20, 5], [20, 8], [-5, 20],
      [5, -10], [-15, 18], [15, -5], [-25, 12], [25, 3],
      [-8, -15], [8, 22], [-18, -8], [18, 25], [-30, 0],
      [30, -12], [0, 30], [-12, 28], [12, -18], [0, -25]
    ];
    for (var i = 0; i < hPositions.length; i++) {
      buildHostage(hPositions[i][0], hPositions[i][1]);
    }

    createHUD();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function update(delta) {
    // Always update notif timer
    if (notifTimer > 0) {
      notifTimer -= delta;
      if (notifTimer <= 0 && notifEl) {
        notifEl.style.display = 'none';
      }
    }

    if (!active) return;

    updateEnemies(delta);
    updateHostages();
    updatePlane(delta);
    updateHUD();
  }

  function reset() {
    active = false;
    hostagesFreed = 0;
    planeX = planeStartX;
    planeStopped = false;
    planeGroup = null;
    enemies = [];
    hostages = [];
    keyState = {};
    lastATime = 0;
    notifTimer = 0;

    // Remove all tracked objects
    for (var i = 0; i < objects.length; i++) {
      if (scene) scene.remove(objects[i]);
    }
    objects = [];

    // Remove HUD elements
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }
    if (notifEl && notifEl.parentNode) {
      notifEl.parentNode.removeChild(notifEl);
      notifEl = null;
    }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  }

  return { init: init, update: update, reset: reset };
}());
