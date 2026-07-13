window.MetroStation = (function() {
  'use strict';

  var scene, camera;
  var objects = [];
  var enemies = [];
  var civilians = [];
  var flickerLights = [];
  var bombBox = null;
  var bombDefused = false;
  var bombCountdown = 600; // 10 minutes in seconds
  var stationCleared = 0;
  var active = false;
  var mKeyTime = 0;
  var eKeyHeld = false;
  var eHoldTime = 0;
  var defuseComplete = false;
  var hudElement = null;
  var notifElement = null;
  var trainCar = null;
  var trainMoving = true;
  var trainTargetX = 0;
  var trainStartX = -40;
  var trainSpeed = 3;
  var keyState = {};

  function trackAdd(object) {
    scene.add(object);
    objects.push(object);
    return object;
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'metro-hud';
    hudElement.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);color:#ff4444;font-family:monospace;font-size:16px;font-weight:bold;text-align:center;pointer-events:none;z-index:1000;text-shadow:0 0 8px #ff0000;';
    hudElement.innerHTML = 'BOMB: ARMED - 10:00<br><span style="color:#ffaa00">STATION CLEARED: 0%</span>';
    document.body.appendChild(hudElement);
  }

  function showNotif(msg) {
    if (!notifElement) {
      notifElement = document.createElement('div');
      notifElement.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);color:#00ff88;font-family:monospace;font-size:14px;font-weight:bold;pointer-events:none;z-index:1001;text-shadow:0 0 6px #00ff88;';
      document.body.appendChild(notifElement);
    }
    notifElement.textContent = msg;
    notifElement.style.opacity = '1';
    clearTimeout(notifElement._fadeTimer);
    notifElement._fadeTimer = setTimeout(function() {
      notifElement.style.opacity = '0';
    }, 2000);
  }

  function removeHUD() {
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }
    if (notifElement && notifElement.parentNode) {
      notifElement.parentNode.removeChild(notifElement);
      notifElement = null;
    }
  }

  function updateHUD() {
    if (!hudElement || !active) return;
    var mins = Math.floor(bombCountdown / 60);
    var secs = Math.floor(bombCountdown % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var bombStatus = bombDefused ? '<span style="color:#00ff88">BOMB: DEFUSED</span>' : ('BOMB: ARMED - ' + timeStr);
    hudElement.innerHTML = bombStatus + '<br><span style="color:#ffaa00">STATION CLEARED: ' + Math.floor(stationCleared) + '%</span>';
  }

  function buildTunnelWalls() {
    var wallMat = new THREE.MeshLambertMaterial({ color: 0xddddcc });
    // Tile panels along back wall
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 20; col++) {
        var tileGeo = new THREE.BoxGeometry(2.8, 1.8, 0.1);
        var tile = new THREE.Mesh(tileGeo, wallMat);
        tile.position.set(-28 + col * 3, 0.5 + row * 2, -8);
        trackAdd(tile);
      }
    }
    // Ceiling
    var ceilGeo = new THREE.BoxGeometry(60, 0.5, 18);
    var ceilMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.position.set(0, 7, -1);
    trackAdd(ceil);
    // Floor / platform
    var floorGeo = new THREE.BoxGeometry(60, 0.3, 8);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.15, -4);
    trackAdd(floor);
    // Track bed
    var trackGeo = new THREE.BoxGeometry(60, 0.2, 4);
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, -0.9, 4);
    trackAdd(track);
    // Rails
    for (var r = 0; r < 2; r++) {
      var railGeo = new THREE.BoxGeometry(60, 0.1, 0.1);
      var railMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, -0.75, 3 + r * 2);
      trackAdd(rail);
    }
  }

  function buildPillars() {
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    for (var i = 0; i < 6; i++) {
      var pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 7, 8);
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(-20 + i * 8, 3.2, -7);
      trackAdd(pillar);
    }
  }

  function buildTicketGates() {
    var gateMat = new THREE.MeshLambertMaterial({ color: 0x2244aa });
    for (var g = 0; g < 4; g++) {
      // Gate post left
      var postL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), gateMat);
      postL.position.set(-12 + g * 3, 0.4, -6.5);
      trackAdd(postL);
      // Gate post right
      var postR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), gateMat);
      postR.position.set(-12 + g * 3 + 0.8, 0.4, -6.5);
      trackAdd(postR);
      // Gate top bar
      var bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), gateMat);
      bar.position.set(-12 + g * 3 + 0.4, 1.05, -6.5);
      trackAdd(bar);
      // Gate body (turnstile representation)
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.3), gateMat);
      body.position.set(-12 + g * 3 + 0.4, 0.45, -6.5);
      trackAdd(body);
    }
  }

  function buildEscalator() {
    var stepMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var lineMat = new THREE.LineBasicMaterial({ color: 0xaaccee });
    for (var s = 0; s < 12; s++) {
      var stepGeo = new THREE.BoxGeometry(2, 0.12, 0.5);
      var step = new THREE.Mesh(stepGeo, stepMat);
      step.position.set(18, -0.8 + s * 0.28, -5.5 + s * 0.3);
      trackAdd(step);
      // Step edge lines
      var pts = [
        new THREE.Vector3(-1, 0, 0.26),
        new THREE.Vector3(1, 0, 0.26)
      ];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var line = new THREE.LineSegments(lineGeo, lineMat);
      line.position.copy(step.position);
      trackAdd(line);
    }
    // Escalator side rails
    var sideGeo = new THREE.BoxGeometry(0.1, 0.1, 4.5);
    var sideMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    for (var sr = 0; sr < 2; sr++) {
      var side = new THREE.Mesh(sideGeo, sideMat);
      side.position.set(18 + (sr === 0 ? -1 : 1), -0.2, -3.8);
      side.rotation.x = -0.3;
      trackAdd(side);
    }
  }

  function buildExitSigns() {
    var signMat = new THREE.MeshLambertMaterial({ color: 0x00aa44, emissive: new THREE.Color(0x004422) });
    var positions = [[-20, 6, -7.5], [-5, 6, -7.5], [10, 6, -7.5], [22, 6, -7.5]];
    for (var i = 0; i < positions.length; i++) {
      var signGeo = new THREE.BoxGeometry(1.5, 0.4, 0.1);
      var sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(positions[i][0], positions[i][1], positions[i][2]);
      trackAdd(sign);
      // Small green glow light
      var signLight = new THREE.PointLight(0x00ff44, 0.4, 3);
      signLight.position.set(positions[i][0], positions[i][1] - 0.3, positions[i][2] + 0.5);
      trackAdd(signLight);
    }
  }

  function buildFlickerLights() {
    flickerLights = [];
    var lightPositions = [[-20, 6.5, -1], [-10, 6.5, -1], [0, 6.5, -1], [10, 6.5, -1], [20, 6.5, -1]];
    for (var i = 0; i < lightPositions.length; i++) {
      var light = new THREE.PointLight(0xffeedd, 0.8, 15);
      light.position.set(lightPositions[i][0], lightPositions[i][1], lightPositions[i][2]);
      scene.add(light);
      objects.push(light);
      flickerLights.push(light);
      // Fluorescent fixture box
      var fixGeo = new THREE.BoxGeometry(1.5, 0.1, 0.3);
      var fixMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color(0x888866) });
      var fix = new THREE.Mesh(fixGeo, fixMat);
      fix.position.set(lightPositions[i][0], 6.8, lightPositions[i][2]);
      trackAdd(fix);
    }
    // Ambient base
    var ambient = new THREE.AmbientLight(0x222233, 0.4);
    scene.add(ambient);
    objects.push(ambient);
  }

  function buildTrain() {
    var carMat = new THREE.MeshLambertMaterial({ color: 0x224488 });
    var windowMat = new THREE.MeshLambertMaterial({ color: 0x88aacc, emissive: new THREE.Color(0x223344) });
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    trainCar = new THREE.Group();

    // Main car body
    var bodyGeo = new THREE.BoxGeometry(12, 2.5, 3);
    var body = new THREE.Mesh(bodyGeo, carMat);
    body.position.set(0, 0, 0);
    trainCar.add(body);

    // Windows
    for (var w = 0; w < 5; w++) {
      var winGeo = new THREE.BoxGeometry(0.1, 0.7, 0.8);
      var win = new THREE.Mesh(winGeo, windowMat);
      win.position.set(-4.5 + w * 2, 0.3, -1.51);
      trainCar.add(win);
      var winR = new THREE.Mesh(winGeo, windowMat);
      winR.position.set(-4.5 + w * 2, 0.3, 1.51);
      trainCar.add(winR);
    }

    // Interior glow strip
    var interiorLight = new THREE.PointLight(0xffeecc, 1.2, 6);
    interiorLight.position.set(0, 0.5, 0);
    trainCar.add(interiorLight);
    flickerLights.push(interiorLight);

    // Wheels
    var wheelPositions = [[-4, -4, 2], [-4, -4, -2], [2, -4, 2], [2, -4, -2]];
    for (var wp = 0; wp < wheelPositions.length; wp++) {
      var wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10);
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wheelPositions[wp][0], wheelPositions[wp][1] + 3.25, wheelPositions[wp][2]);
      wheel.rotation.x = Math.PI / 2;
      trainCar.add(wheel);
    }

    // Second car (static, stopped at platform)
    var car2Mat = new THREE.MeshLambertMaterial({ color: 0x1a3366 });
    var car2Geo = new THREE.BoxGeometry(12, 2.5, 3);
    var car2 = new THREE.Mesh(car2Geo, car2Mat);
    car2.position.set(14, -0.5, 4);
    trackAdd(car2);

    // Bomb on car2 - emissive red box
    var bombGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    var bombMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: new THREE.Color(0x550000) });
    bombBox = new THREE.Mesh(bombGeo, bombMat);
    bombBox.position.set(14, 0.7, 4);
    scene.add(bombBox);
    objects.push(bombBox);

    // Bomb technician near car2
    var techMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var techGeo = new THREE.BoxGeometry(0.4, 1.0, 0.4);
    var tech = new THREE.Mesh(techGeo, techMat);
    tech.position.set(13, 0.0, 2.5);
    scene.add(tech);
    objects.push(tech);
    enemies.push({ mesh: tech, patrol: true, patrolRange: 1.5, patrolCenter: new THREE.Vector3(13, 0.0, 2.5), patrolPhase: 0 });

    trainCar.position.set(trainStartX, -0.5, 4);
    scene.add(trainCar);
    objects.push(trainCar);
  }

  function buildEnemies() {
    var enemyMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var enemyPositions = [
      [-15, 0, -4], [5, 0, -3], [20, 0, -5], [8, 0, 1], [-5, 0, 0]
    ];
    for (var i = 0; i < enemyPositions.length; i++) {
      var geo = new THREE.BoxGeometry(0.4, 1.0, 0.4);
      var mesh = new THREE.Mesh(geo, enemyMat);
      mesh.position.set(enemyPositions[i][0], enemyPositions[i][1], enemyPositions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
      enemies.push({
        mesh: mesh,
        patrol: true,
        patrolRange: 2,
        patrolCenter: mesh.position.clone(),
        patrolPhase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildCivilians() {
    var civMat = new THREE.MeshLambertMaterial({ color: 0xcc9966 });
    var civPositions = [
      [-8, 0, -5], [-3, 0, -4], [2, 0, -6], [6, 0, -5], [-14, 0, -4], [12, 0, -6]
    ];
    for (var i = 0; i < civPositions.length; i++) {
      var geo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
      var mesh = new THREE.Mesh(geo, civMat);
      mesh.position.set(civPositions[i][0], civPositions[i][1], civPositions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
      var angle = Math.random() * Math.PI * 2;
      civilians.push({
        mesh: mesh,
        speed: 1.5 + Math.random(),
        dir: new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
        flee: true
      });
    }
  }

  function onKeyDown(e) {
    keyState[e.code] = true;
    if (e.code === 'KeyM') {
      mKeyTime = Date.now();
    }
    if (e.code === 'KeyS' && mKeyTime && (Date.now() - mKeyTime) < 400) {
      mKeyTime = 0;
      if (active) {
        deactivate();
      } else {
        activate();
      }
    }
    if (e.code === 'KeyE') {
      eKeyHeld = true;
    }
  }

  function onKeyUp(e) {
    keyState[e.code] = false;
    if (e.code === 'KeyE') {
      eKeyHeld = false;
      eHoldTime = 0;
    }
  }

  function activate() {
    active = true;
    createHUD();
    showNotif('[METRO STATION] MODULE ACTIVATED');
  }

  function deactivate() {
    active = false;
    showNotif('[METRO STATION] MODULE DEACTIVATED');
    if (hudElement) {
      hudElement.style.display = 'none';
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildTunnelWalls();
    buildPillars();
    buildTicketGates();
    buildEscalator();
    buildExitSigns();
    buildFlickerLights();
    buildTrain();
    buildEnemies();
    buildCivilians();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    createHUD();
    showNotif('[METRO STATION] LOADED - Press M+S to toggle');
    active = true;
  }

  function updateTrain(delta) {
    if (!trainCar) return;
    if (trainMoving) {
      trainCar.position.x += trainSpeed * delta;
      if (trainCar.position.x >= trainTargetX) {
        trainCar.position.x = trainTargetX;
        trainMoving = false;
      }
    }
  }

  function updateFlicker(delta) {
    for (var i = 0; i < flickerLights.length; i++) {
      if (Math.random() < 0.05) {
        flickerLights[i].intensity = 0.1 + Math.random() * 1.4;
      }
    }
  }

  function updateEnemies(delta) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      e.patrolPhase += delta * 0.8;
      e.mesh.position.x = e.patrolCenter.x + Math.sin(e.patrolPhase) * e.patrolRange;
      e.mesh.position.z = e.patrolCenter.z + Math.cos(e.patrolPhase * 0.7) * (e.patrolRange * 0.5);
    }
  }

  function updateCivilians(delta) {
    for (var i = 0; i < civilians.length; i++) {
      var c = civilians[i];
      c.mesh.position.addScaledVector(c.dir, c.speed * delta);
      // Bounce off walls
      if (c.mesh.position.x > 28 || c.mesh.position.x < -28) {
        c.dir.x *= -1;
      }
      if (c.mesh.position.z > -2 || c.mesh.position.z < -7.5) {
        c.dir.z *= -1;
      }
    }
  }

  function updateBomb(delta) {
    if (bombDefused || !bombBox) return;
    bombCountdown -= delta;
    if (bombCountdown <= 0) {
      bombCountdown = 0;
      showNotif('BOMB DETONATED - MISSION FAILED');
      return;
    }
    if (!camera) return;
    var dist = camera.position.distanceTo(bombBox.position);
    if (dist < 2) {
      if (eKeyHeld) {
        eHoldTime += delta;
        if (eHoldTime >= 4) {
          bombDefused = true;
          defuseComplete = true;
          bombBox.material.color.setHex(0x00ff00);
          bombBox.material.emissive.setHex(0x003300);
          showNotif('BOMB DEFUSED! EVACUATE NOW!');
          stationCleared = 100;
        } else {
          showNotif('DEFUSING... ' + Math.floor(eHoldTime / 4 * 100) + '%');
        }
      } else {
        eHoldTime = 0;
        showNotif('HOLD [E] TO DEFUSE BOMB');
      }
    }
  }

  function update(delta) {
    if (!active) return;
    updateTrain(delta);
    updateFlicker(delta);
    updateEnemies(delta);
    updateCivilians(delta);
    updateBomb(delta);
    updateHUD();
    // Pulse bomb box
    if (bombBox && !bombDefused) {
      bombBox.material.emissive.setRGB(
        0.3 + 0.3 * Math.sin(Date.now() * 0.005),
        0,
        0
      );
    }
  }

  function reset() {
    active = false;
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    enemies = [];
    civilians = [];
    flickerLights = [];
    bombBox = null;
    bombDefused = false;
    bombCountdown = 600;
    stationCleared = 0;
    eKeyHeld = false;
    eHoldTime = 0;
    defuseComplete = false;
    trainCar = null;
    trainMoving = true;
    mKeyTime = 0;
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    removeHUD();
  }

  return { init: init, update: update, reset: reset };
}());
