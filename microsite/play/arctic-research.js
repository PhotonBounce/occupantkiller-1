window.ArcticResearch = (function () {
  'use strict';

  var scene, camera;
  var active = false;
  var objects = [];
  var enemies = [];
  var dataDrives = [];
  var snowParticles = [];
  var buildings = [];
  var beaconLight;
  var beaconTime = 0;
  var drivesCollected = 0;
  var selfDestructActive = false;
  var selfDestructTimer = 0;
  var selfDestructDuration = 10;
  var labDestroyed = false;
  var keys = { a: false, r: false };
  var hudDrives, hudStatus, hudNotif;
  var notifTimeout;

  // ---- HUD ----
  function createHUD() {
    hudDrives = document.createElement('div');
    hudDrives.id = 'arctic-hud-drives';
    hudDrives.style.cssText = 'position:fixed;top:16px;left:16px;color:#00ffcc;font-family:monospace;font-size:18px;font-weight:bold;text-shadow:0 0 8px #00ffcc;z-index:9999;pointer-events:none;';
    hudDrives.textContent = 'DATA DRIVES: 0/3';
    document.body.appendChild(hudDrives);

    hudStatus = document.createElement('div');
    hudStatus.id = 'arctic-hud-status';
    hudStatus.style.cssText = 'position:fixed;top:16px;right:16px;color:#ff4444;font-family:monospace;font-size:18px;font-weight:bold;text-shadow:0 0 8px #ff4444;z-index:9999;pointer-events:none;';
    hudStatus.textContent = 'LAB STATUS: ACTIVE';
    document.body.appendChild(hudStatus);

    hudNotif = document.createElement('div');
    hudNotif.id = 'arctic-hud-notif';
    hudNotif.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#ffffff;font-family:monospace;font-size:24px;font-weight:bold;text-shadow:0 0 12px #ffffff;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(hudNotif);
  }

  function removeHUD() {
    if (hudDrives && hudDrives.parentNode) hudDrives.parentNode.removeChild(hudDrives);
    if (hudStatus && hudStatus.parentNode) hudStatus.parentNode.removeChild(hudStatus);
    if (hudNotif && hudNotif.parentNode) hudNotif.parentNode.removeChild(hudNotif);
    hudDrives = null; hudStatus = null; hudNotif = null;
  }

  function showNotif(msg) {
    if (!hudNotif) return;
    hudNotif.textContent = msg;
    hudNotif.style.opacity = '1';
    if (notifTimeout) clearTimeout(notifTimeout);
    notifTimeout = setTimeout(function () {
      if (hudNotif) hudNotif.style.opacity = '0';
    }, 2000);
  }

  // ---- Key handling ----
  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    if (k === 'a') keys.a = true;
    if (k === 'r') keys.r = true;
    if (keys.a && keys.r) toggleActive();
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    if (k === 'a') keys.a = false;
    if (k === 'r') keys.r = false;
  }

  function toggleActive() {
    active = !active;
    if (active) {
      showNotif('ARCTIC RESEARCH [ON]');
    } else {
      showNotif('ARCTIC RESEARCH [OFF]');
    }
  }

  // ---- Geometry helpers ----
  function makeMesh(geo, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
  }

  // ---- Build scene objects ----
  function buildResearchModules() {
    // 3 white box buildings
    var positions = [
      [-20, 3, -30],
      [0, 3, -35],
      [20, 3, -28]
    ];
    for (var i = 0; i < positions.length; i++) {
      var geo = new THREE.BoxGeometry(12, 6, 10);
      var mesh = makeMesh(geo, 0xeeeeee);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      buildings.push(mesh);
      addToScene(mesh);
      // windows: small dark boxes on the front face
      var winGeo = new THREE.BoxGeometry(2, 1.5, 0.2);
      var win = makeMesh(winGeo, 0x334455);
      win.position.set(positions[i][0] - 2, positions[i][1] + 0.5, positions[i][2] + 5.1);
      addToScene(win);
      var win2 = makeMesh(new THREE.BoxGeometry(2, 1.5, 0.2), 0x334455);
      win2.position.set(positions[i][0] + 2, positions[i][1] + 0.5, positions[i][2] + 5.1);
      addToScene(win2);
    }
  }

  function buildAntennaArrays() {
    var positions = [[-30, 0, -20], [30, 0, -20]];
    for (var i = 0; i < positions.length; i++) {
      // pole
      var poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);
      var pole = makeMesh(poleGeo, 0x888888);
      pole.position.set(positions[i][0], 5, positions[i][2]);
      addToScene(pole);
      // dish (flat box)
      var dishGeo = new THREE.BoxGeometry(4, 0.3, 3);
      var dish = makeMesh(dishGeo, 0xaaaaaa);
      dish.position.set(positions[i][0], 10.2, positions[i][2]);
      dish.rotation.x = Math.PI / 6;
      addToScene(dish);
      // cross arm
      var armGeo = new THREE.BoxGeometry(0.2, 0.2, 4);
      var arm = makeMesh(armGeo, 0x888888);
      arm.position.set(positions[i][0], 9, positions[i][2]);
      addToScene(arm);
    }
  }

  function buildSnowcats() {
    var positions = [[-15, 1.5, -10], [15, 1.5, -10]];
    for (var i = 0; i < positions.length; i++) {
      // chassis
      var chassisGeo = new THREE.BoxGeometry(8, 3, 4);
      var chassis = makeMesh(chassisGeo, 0x556644);
      chassis.position.set(positions[i][0], positions[i][1], positions[i][2]);
      addToScene(chassis);
      // cabin on top
      var cabinGeo = new THREE.BoxGeometry(4, 2, 3.5);
      var cabin = makeMesh(cabinGeo, 0x445533);
      cabin.position.set(positions[i][0], positions[i][1] + 2.5, positions[i][2]);
      addToScene(cabin);
      // tracks (flat cylinders on sides)
      for (var s = -1; s <= 1; s += 2) {
        var trackGeo = new THREE.CylinderGeometry(1, 1, 0.6, 8);
        var track = makeMesh(trackGeo, 0x222222);
        track.rotation.z = Math.PI / 2;
        track.position.set(positions[i][0], positions[i][1] - 1, positions[i][2] + s * 2.4);
        addToScene(track);
      }
    }
  }

  function buildCryoTanks() {
    var positions = [[-5, 3, -50], [5, 3, -50], [-5, 3, -45], [5, 3, -45]];
    for (var i = 0; i < positions.length; i++) {
      var tankGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 12);
      var tank = makeMesh(tankGeo, 0x99ccff);
      tank.position.set(positions[i][0], positions[i][1], positions[i][2]);
      addToScene(tank);
      // cap top
      var capGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12);
      var cap = makeMesh(capGeo, 0x6699cc);
      cap.position.set(positions[i][0], positions[i][1] + 3.15, positions[i][2]);
      addToScene(cap);
    }
  }

  function buildFrozenTestSubjects() {
    var positions = [
      [-8, 0.3, -42, 0],
      [8, 0.3, -42, 0.3],
      [0, 0.3, -55, 0]
    ];
    for (var i = 0; i < positions.length; i++) {
      // body (elongated box lying flat)
      var bodyGeo = new THREE.BoxGeometry(0.6, 0.4, 1.8);
      var body = makeMesh(bodyGeo, 0x88aacc);
      body.position.set(positions[i][0], positions[i][1], positions[i][2]);
      body.rotation.y = positions[i][3];
      addToScene(body);
      // head
      var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var head = makeMesh(headGeo, 0x99bbdd);
      head.position.set(positions[i][0], positions[i][1] + 0.45, positions[i][2] - 1.0);
      head.rotation.y = positions[i][3];
      addToScene(head);
    }
  }

  function buildEmergencyBeacon() {
    // pole
    var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
    var pole = makeMesh(poleGeo, 0xcc3300);
    pole.position.set(0, 2.5, -15);
    addToScene(pole);
    // beacon sphere on top
    var sphereGeo = new THREE.SphereGeometry(0.4, 8, 8);
    beaconLight = makeMesh(sphereGeo, 0xff6600);
    beaconLight.position.set(0, 5.4, -15);
    addToScene(beaconLight);
    // base
    var baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8);
    var base = makeMesh(baseGeo, 0xcc3300);
    base.position.set(0, 0.15, -15);
    addToScene(base);
  }

  function buildGround() {
    var geoGround = new THREE.BoxGeometry(200, 0.5, 200);
    var ground = makeMesh(geoGround, 0xddeeff);
    ground.position.set(0, -0.25, -20);
    addToScene(ground);
  }

  // ---- Data drives ----
  function buildDataDrives() {
    var positions = [
      [-20, 1, -30],
      [0, 1, -35],
      [20, 1, -28]
    ];
    for (var i = 0; i < positions.length; i++) {
      var geo = new THREE.BoxGeometry(0.5, 0.5, 0.3);
      var mat = new THREE.MeshLambertMaterial({ color: 0x00ff66 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      mesh.userData.collected = false;
      scene.add(mesh);
      objects.push(mesh);
      dataDrives.push(mesh);
    }
  }

  // ---- Blizzard particles ----
  function buildBlizzard() {
    for (var i = 0; i < 300; i++) {
      var geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      var mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 30,
        (Math.random() - 0.5) * 100 - 20
      );
      mesh.userData.speed = 0.05 + Math.random() * 0.1;
      mesh.userData.drift = (Math.random() - 0.5) * 0.02;
      scene.add(mesh);
      objects.push(mesh);
      snowParticles.push(mesh);
    }
  }

  // ---- Enemies ----
  function buildEnemies() {
    // Arctic soldiers (white)
    var soldierWaypoints = [
      [[-25, 1.8, -5], [-25, 1.8, -40]],
      [[25, 1.8, -5], [25, 1.8, -40]],
      [[0, 1.8, -20], [0, 1.8, -45]]
    ];
    for (var i = 0; i < soldierWaypoints.length; i++) {
      var bodyGeo = new THREE.BoxGeometry(0.8, 1.4, 0.5);
      var body = makeMesh(bodyGeo, 0xf0f0f0);
      var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var head = makeMesh(headGeo, 0xdddddd);
      head.position.y = 1.1;
      body.add(head);
      body.position.set(soldierWaypoints[i][0][0], soldierWaypoints[i][0][1], soldierWaypoints[i][0][2]);
      scene.add(body);
      objects.push(body);
      enemies.push({
        mesh: body,
        waypoints: soldierWaypoints[i],
        wpIndex: 0,
        speed: 3.5,
        type: 'soldier'
      });
    }
    // Scientists (gray, slower)
    var sciWaypoints = [
      [[-18, 1.8, -28], [-18, 1.8, -36]],
      [[18, 1.8, -26], [18, 1.8, -34]]
    ];
    for (var j = 0; j < sciWaypoints.length; j++) {
      var sciBodyGeo = new THREE.BoxGeometry(0.7, 1.4, 0.45);
      var sciBody = makeMesh(sciBodyGeo, 0x999999);
      var sciHeadGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      var sciHead = makeMesh(sciHeadGeo, 0xbbbbbb);
      sciHead.position.y = 1.1;
      sciBody.add(sciHead);
      sciBody.position.set(sciWaypoints[j][0][0], sciWaypoints[j][0][1], sciWaypoints[j][0][2]);
      scene.add(sciBody);
      objects.push(sciBody);
      enemies.push({
        mesh: sciBody,
        waypoints: sciWaypoints[j],
        wpIndex: 0,
        speed: 1.5,
        type: 'scientist'
      });
    }
  }

  // ---- Update helpers ----
  function updateBlizzard(delta) {
    for (var i = 0; i < snowParticles.length; i++) {
      var p = snowParticles[i];
      p.position.x += (p.userData.drift + 0.05) * delta * 60;
      p.position.y -= p.userData.speed * delta * 60 * 0.05;
      p.position.z += p.userData.drift * delta * 60;
      p.rotation.x += 0.02;
      p.rotation.y += 0.01;
      if (p.position.y < -2) p.position.y = 30;
      if (p.position.x > 60) p.position.x = -60;
      if (p.position.x < -60) p.position.x = 60;
    }
  }

  function updateEnemies(delta) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var target = e.waypoints[e.wpIndex];
      var dx = target[0] - e.mesh.position.x;
      var dz = target[2] - e.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.5) {
        e.wpIndex = (e.wpIndex + 1) % e.waypoints.length;
      } else {
        e.mesh.position.x += (dx / dist) * e.speed * delta;
        e.mesh.position.z += (dz / dist) * e.speed * delta;
        e.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
  }

  function updateDataDrives() {
    if (!camera) return;
    for (var i = 0; i < dataDrives.length; i++) {
      var d = dataDrives[i];
      if (d.userData.collected) continue;
      var dx = d.position.x - camera.position.x;
      var dy = d.position.y - camera.position.y;
      var dz = d.position.z - camera.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 3) {
        d.userData.collected = true;
        d.visible = false;
        drivesCollected++;
        if (hudDrives) hudDrives.textContent = 'DATA DRIVES: ' + drivesCollected + '/3';
        if (drivesCollected >= 3) {
          selfDestructActive = true;
          selfDestructTimer = selfDestructDuration;
          showNotif('SELF-DESTRUCT INITIATED! 10 SECONDS!');
          if (hudStatus) {
            hudStatus.textContent = 'LAB STATUS: SELF-DESTRUCT';
            hudStatus.style.color = '#ff8800';
          }
        } else {
          showNotif('DATA DRIVE SECURED (' + drivesCollected + '/3)');
        }
      }
    }
  }

  function updateSelfDestruct(delta) {
    if (!selfDestructActive || labDestroyed) return;
    selfDestructTimer -= delta;
    var flash = Math.floor(Date.now() / 300) % 2 === 0;
    var flashColor = flash ? 0xff2200 : 0xeeeeee;
    for (var i = 0; i < buildings.length; i++) {
      buildings[i].material.color.setHex(flashColor);
    }
    if (selfDestructTimer <= 0) {
      labDestroyed = true;
      selfDestructActive = false;
      for (var j = 0; j < buildings.length; j++) {
        buildings[j].material.color.setHex(0x333333);
        buildings[j].scale.y = 0.2;
        buildings[j].position.y = 0.6;
      }
      if (hudStatus) {
        hudStatus.textContent = 'LAB STATUS: DESTROYED';
        hudStatus.style.color = '#888888';
      }
      showNotif('LAB DESTROYED - MISSION COMPLETE');
    }
  }

  function updateBeacon(delta) {
    if (!beaconLight) return;
    beaconTime += delta;
    var on = Math.sin(beaconTime * 4) > 0;
    beaconLight.material.color.setHex(on ? 0xff6600 : 0x441100);
  }

  // ---- Public API ----
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    enemies = [];
    dataDrives = [];
    snowParticles = [];
    buildings = [];
    beaconLight = null;
    beaconTime = 0;
    drivesCollected = 0;
    selfDestructActive = false;
    selfDestructTimer = 0;
    labDestroyed = false;

    // ambient light
    var ambient = new THREE.AmbientLight(0x99bbcc, 0.6);
    scene.add(ambient);
    objects.push(ambient);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
    objects.push(dirLight);

    buildGround();
    buildResearchModules();
    buildAntennaArrays();
    buildSnowcats();
    buildCryoTanks();
    buildFrozenTestSubjects();
    buildEmergencyBeacon();
    buildDataDrives();
    buildBlizzard();
    buildEnemies();

    createHUD();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    active = true;
    showNotif('ARCTIC RESEARCH - MISSION START');
  }

  function update(delta) {
    if (!active) return;
    updateBlizzard(delta);
    updateEnemies(delta);
    updateDataDrives();
    updateSelfDestruct(delta);
    updateBeacon(delta);
  }

  function reset() {
    active = false;
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) objects[i].material.dispose();
    }
    objects = [];
    enemies = [];
    dataDrives = [];
    snowParticles = [];
    buildings = [];
    beaconLight = null;

    removeHUD();

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);

    scene = null;
    camera = null;
  }

  return { init: init, update: update, reset: reset };
}());
