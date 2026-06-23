window.PrisonBreak = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var container;

  // Key tracking
  var keysDown = {};
  var keyTimestamps = {};

  // Player
  var player;
  var playerVelocity = { x: 0, z: 0 };
  var playerSpeed = 8;
  var playerCrouching = false;

  // Camera
  var cameraAngle = 0;
  var cameraDistance = 18;
  var cameraHeight = 12;

  // Game state
  var freedPrisoners = 0;
  var totalPrisoners = 5;
  var alarmActive = false;
  var alarmTimer = 0;
  var selectedRoute = 'NORTH';
  var extractionTimer = 105; // seconds
  var gameOver = false;
  var gameWon = false;
  var disguiseActive = false;
  var disguiseTimer = 0;
  var hasKeycard = false;
  var cellDoorOpen = false;

  // Collections
  var guards = [];
  var guardDogs = [];
  var prisoners = [];
  var alarmBoxes = [];
  var extractionZone;
  var jeep;
  var jeepOccupants = 0;
  var commander;
  var exchangeOffered = false;
  var exchangeResolved = false;
  var keycard;
  var cellDoor;
  var guardBodies = [];
  var followingPrisoners = [];
  var spawnedExtraGuards = false;

  // Jeep driving
  var drivingJeep = false;
  var jeepSpeed = 12;
  var jeepVelocity = { x: 0, z: 0 };
  var jeepAngle = 0;

  // HUD
  var hudElement;

  // Interaction prompts
  var promptElement;
  var promptTimer = 0;

  // North gate position
  var northGatePos = { x: 0, z: -26 };

  // Extraction point
  var extractionPoint = { x: 0, z: -80 };

  // ── Geometry helpers ─────────────────────────────────────────────────────────
  function makeMesh(geo, color, wireframe) {
    var mat = new THREE.MeshLambertMaterial({ color: color, wireframe: !!wireframe });
    return new THREE.Mesh(geo, mat);
  }

  function makeBox(w, h, d, color) {
    return makeMesh(new THREE.BoxGeometry(w, h, d), color);
  }

  function makeCyl(rt, rb, h, segs, color) {
    return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs || 8), color);
  }

  function makeSphere(r, color) {
    return makeMesh(new THREE.SphereGeometry(r, 8, 8), color);
  }

  function makeLines(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Build prison complex ─────────────────────────────────────────────────────
  function buildPrison() {
    // Ground
    var ground = makeBox(200, 0.2, 200, 0x556644);
    ground.position.set(0, -0.1, 0);
    scene.add(ground);

    // Outer walls (perimeter rectangle 50x50 using BoxGeometry segments)
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var wallConfigs = [
      // north wall
      { w: 54, h: 6, d: 2, x: 0, z: -27 },
      // south wall
      { w: 54, h: 6, d: 2, x: 0, z: 27 },
      // east wall
      { w: 2, h: 6, d: 54, x: 27, z: 0 },
      // west wall
      { w: 2, h: 6, d: 54, x: -27, z: 0 }
    ];
    for (var i = 0; i < wallConfigs.length; i++) {
      var wc = wallConfigs[i];
      var wall = new THREE.Mesh(
        new THREE.BoxGeometry(wc.w, wc.h, wc.d, 6, 2, 1),
        wallMat
      );
      wall.position.set(wc.x, 3, wc.z);
      scene.add(wall);
    }

    // 4 corner watchtowers (BoxGeometry 3x10x3)
    var towerPositions = [
      { x: -27, z: -27 }, { x: 27, z: -27 },
      { x: -27, z: 27 }, { x: 27, z: 27 }
    ];
    for (var ti = 0; ti < towerPositions.length; ti++) {
      var tp = towerPositions[ti];
      var tower = makeBox(3, 10, 3, 0x777766);
      tower.position.set(tp.x, 5, tp.z);
      scene.add(tower);
      // Guard on top
      var towerGuard = makeCyl(0.4, 0.4, 1.8, 8, 0x334433);
      towerGuard.position.set(tp.x, 11.9, tp.z);
      scene.add(towerGuard);
    }

    // Central cell block (BoxGeometry 20x8x12)
    var cellBlock = makeBox(20, 8, 12, 0x998877);
    cellBlock.position.set(0, 4, 5);
    scene.add(cellBlock);

    // Guard office (BoxGeometry room 4x3x4)
    var guardOffice = makeBox(4, 3, 4, 0xAA9988);
    guardOffice.position.set(-14, 1.5, 5);
    scene.add(guardOffice);

    // Keycard in guard office
    keycard = makeBox(0.3, 0.1, 0.5, 0xFFFF00);
    keycard.position.set(-14, 3.2, 5);
    scene.add(keycard);

    // Cell block door
    cellDoor = makeBox(1.5, 3, 0.3, 0x555544);
    cellDoor.position.set(0, 1.5, -0.8);
    scene.add(cellDoor);

    // 5 VIP prisoner cells
    var cellPositions = [
      { x: -8, z: 5 }, { x: -4, z: 5 }, { x: 0, z: 5 },
      { x: 4, z: 5 }, { x: 8, z: 5 }
    ];
    for (var ci = 0; ci < cellPositions.length; ci++) {
      var cp = cellPositions[ci];
      // Cell walls (BoxGeometry 4x4x4)
      var cell = makeBox(4, 4, 4, 0x887766);
      cell.position.set(cp.x, 2, cp.z);
      scene.add(cell);

      // Bar LineSegments
      var barPoints = [];
      for (var b = 0; b < 5; b++) {
        var bx = cp.x - 1.5 + b * 0.75;
        barPoints.push({ x: bx, y: 0.2, z: cp.z - 2.1 });
        barPoints.push({ x: bx, y: 3.8, z: cp.z - 2.1 });
      }
      var bars = makeLines(barPoints, 0x888888);
      scene.add(bars);

      // Prisoner (CylinderGeometry crouching, color 0x8B7355)
      var prisoner = makeCyl(0.35, 0.35, 1.0, 8, 0x8B7355);
      prisoner.position.set(cp.x, 0.5, cp.z);
      prisoner.userData = {
        type: 'prisoner',
        index: ci,
        freed: false,
        following: false,
        highValue: ci === 2
      };
      scene.add(prisoner);
      prisoners.push(prisoner);
    }

    // Alarm boxes on each wall (BoxGeometry, color 0xFF2200)
    var alarmPositions = [
      { x: 0, y: 4, z: -26.5 },  // north
      { x: 0, y: 4, z: 26.5 },   // south
      { x: 26.5, y: 4, z: 0 },   // east
      { x: -26.5, y: 4, z: 0 }   // west
    ];
    for (var ai = 0; ai < alarmPositions.length; ai++) {
      var ap = alarmPositions[ai];
      var alarmBox = makeBox(0.8, 0.8, 0.4, 0xFF2200);
      alarmBox.position.set(ap.x, ap.y, ap.z);
      alarmBox.userData = { type: 'alarm', disabled: false };
      scene.add(alarmBox);
      alarmBoxes.push(alarmBox);
    }

    // Jeep at north gate (BoxGeometry 4x2x2.5, color 0x333333)
    jeep = makeBox(4, 2, 2.5, 0x333333);
    jeep.position.set(4, 1, -24);
    jeep.userData = { type: 'jeep' };
    scene.add(jeep);

    // Extraction zone ring (BoxGeometry, color 0x00FF44)
    extractionZone = makeBox(10, 0.3, 10, 0x00FF44);
    extractionZone.position.set(extractionPoint.x, 0.15, extractionPoint.z);
    scene.add(extractionZone);

    // Van at north extraction
    var van = makeBox(5, 3, 8, 0x334422);
    van.position.set(extractionPoint.x, 1.5, extractionPoint.z - 6);
    scene.add(van);

    // EAST route - sewer tunnel (underground visual)
    var tunnel = makeBox(3, 2, 30, 0x554433);
    tunnel.position.set(30, -1, 0);
    scene.add(tunnel);

    // WEST route - helicopter LZ on roof marker
    var lzMarker = makeBox(6, 0.2, 6, 0xFFAA00);
    lzMarker.position.set(-8, 8.1, 5);
    scene.add(lzMarker);

    // Enemy commander at gate
    commander = makeCyl(0.7, 0.7, 2.2, 8, 0x222222);
    commander.position.set(6, 1.1, -22);
    commander.userData = { type: 'commander' };
    scene.add(commander);

    // Lighting
    var ambient = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffcc, 0.9);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Searchlight (red when alarm)
    var pointLight = new THREE.PointLight(0x8888ff, 0.4, 60);
    pointLight.position.set(0, 15, 0);
    pointLight.userData = { type: 'searchlight' };
    scene.add(pointLight);
  }

  // ── Build guards ─────────────────────────────────────────────────────────────
  function buildGuards() {
    // 6 patrol guards with 4-point routes
    var patrolRoutes = [
      [{ x: -10, z: -20 }, { x: 10, z: -20 }, { x: 10, z: -10 }, { x: -10, z: -10 }],
      [{ x: -20, z: 0 }, { x: -10, z: 0 }, { x: -10, z: 10 }, { x: -20, z: 10 }],
      [{ x: 10, z: 0 }, { x: 20, z: 0 }, { x: 20, z: 10 }, { x: 10, z: 10 }],
      [{ x: -5, z: 15 }, { x: 5, z: 15 }, { x: 5, z: 22 }, { x: -5, z: 22 }],
      [{ x: -22, z: -15 }, { x: -15, z: -15 }, { x: -15, z: -5 }, { x: -22, z: -5 }],
      [{ x: 15, z: -15 }, { x: 22, z: -15 }, { x: 22, z: -5 }, { x: 15, z: -5 }]
    ];

    for (var i = 0; i < 6; i++) {
      var g = makeCyl(0.4, 0.4, 1.8, 8, 0x334433);
      var startPt = patrolRoutes[i][0];
      g.position.set(startPt.x, 0.9, startPt.z);
      g.userData = {
        type: 'guard',
        patrol: true,
        route: patrolRoutes[i],
        routeIndex: 0,
        speed: 3,
        spottingPlayer: false,
        spotTimer: 0,
        downed: false,
        alerted: false,
        alertTarget: null
      };
      scene.add(g);
      guards.push(g);
    }

    // 4 static post guards
    var staticPosts = [
      { x: 0, z: -25 },   // north gate
      { x: 0, z: 25 },    // south gate
      { x: 25, z: 0 },    // east
      { x: -25, z: 0 }    // west
    ];
    for (var j = 0; j < 4; j++) {
      var sg = makeCyl(0.4, 0.4, 1.8, 8, 0x334433);
      sg.position.set(staticPosts[j].x, 0.9, staticPosts[j].z);
      sg.userData = {
        type: 'guard',
        patrol: false,
        post: { x: staticPosts[j].x, z: staticPosts[j].z },
        speed: 3,
        spottingPlayer: false,
        spotTimer: 0,
        downed: false,
        alerted: false,
        alertTarget: null
      };
      scene.add(sg);
      guards.push(sg);
    }

    // Guard dog (CylinderGeometry 0x8B4513 on chain LineSegments)
    var dog = makeCyl(0.25, 0.25, 0.8, 6, 0x8B4513);
    dog.position.set(10, 0.4, 10);
    dog.userData = {
      type: 'dog',
      center: { x: 10, z: 10 },
      angle: 0,
      radius: 15,
      speed: 6,
      detected: false
    };
    scene.add(dog);
    guardDogs.push(dog);

    // Dog chain LineSegments
    var chainLines = makeLines([
      { x: 10, y: 0.4, z: 10 },
      { x: 10, y: 0.4, z: 10 }
    ], 0x888888);
    chainLines.userData = { type: 'dogChain', dog: dog };
    scene.add(chainLines);
  }

  // ── Build player ─────────────────────────────────────────────────────────────
  function buildPlayer() {
    player = makeCyl(0.4, 0.4, 1.8, 8, 0x2244AA);
    player.position.set(0, 0.9, 20);
    player.userData = { type: 'player' };
    scene.add(player);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudElement = document.createElement('div');
    hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 14px',
      'border:1px solid #00FF44',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudElement);

    promptElement = document.createElement('div');
    promptElement.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#FFFF00',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 12px',
      'border:1px solid #FFFF00',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(promptElement);
  }

  function formatTime(sec) {
    var s = Math.max(0, Math.floor(sec));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  function updateHUD() {
    if (!hudElement) return;
    var alarmText = alarmActive ? '<span style="color:#FF2200">ON</span>' : 'OFF';
    var disguiseText = disguiseActive ? ' [DISGUISE: ' + Math.ceil(disguiseTimer) + 's]' : '';
    var routeText = selectedRoute;
    hudElement.innerHTML =
      'PRISON BREAK [FREED: ' + freedPrisoners + '/' + totalPrisoners + '] ' +
      '[GUARDS: ' + getActiveGuardCount() + '] ' +
      '[ALARM: ' + alarmText + '] ' +
      '[ROUTE: ' + routeText + ']' + disguiseText +
      ' | EXTRACTION: ' + formatTime(extractionTimer);
  }

  function getActiveGuardCount() {
    var count = 0;
    for (var i = 0; i < guards.length; i++) {
      if (!guards[i].userData.downed) count++;
    }
    return count;
  }

  function showPrompt(text, duration) {
    if (!promptElement) return;
    promptElement.textContent = text;
    promptElement.style.display = 'block';
    promptTimer = duration || 2;
  }

  // ── Guard AI ─────────────────────────────────────────────────────────────────
  function updateGuards(dt) {
    var detectionRange = disguiseActive ? 5 : 12;

    for (var i = 0; i < guards.length; i++) {
      var g = guards[i];
      if (g.userData.downed) continue;

      var gx = g.position.x;
      var gz = g.position.z;
      var px = player.position.x;
      var pz = player.position.z;

      var dToPlayer = Math.sqrt((gx - px) * (gx - px) + (gz - pz) * (gz - pz));

      if (alarmActive || g.userData.alerted) {
        // Converge on player
        var dx = px - gx;
        var dz = pz - gz;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 1.5) {
          var spd = g.userData.speed * 1.5;
          g.position.x += (dx / len) * spd * dt;
          g.position.z += (dz / len) * spd * dt;
          g.rotation.y = Math.atan2(dx, dz);
        }
      } else if (g.userData.patrol) {
        // Patrol route
        var route = g.userData.route;
        var target = route[g.userData.routeIndex];
        var dx2 = target.x - gx;
        var dz2 = target.z - gz;
        var d2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);
        if (d2 < 0.5) {
          g.userData.routeIndex = (g.userData.routeIndex + 1) % route.length;
        } else {
          g.position.x += (dx2 / d2) * g.userData.speed * dt;
          g.position.z += (dz2 / d2) * g.userData.speed * dt;
          g.rotation.y = Math.atan2(dx2, dz2);
        }

        // Spot check
        if (dToPlayer < detectionRange) {
          g.userData.spottingPlayer = true;
          g.userData.spotTimer += dt;
          if (g.userData.spotTimer > 3) {
            triggerAlarm();
          }
        } else {
          g.userData.spottingPlayer = false;
          g.userData.spotTimer = Math.max(0, g.userData.spotTimer - dt * 2);
        }
      } else {
        // Static post
        if (dToPlayer < detectionRange) {
          g.userData.spottingPlayer = true;
          g.userData.spotTimer += dt;
          if (g.userData.spotTimer > 3) {
            triggerAlarm();
          }
        } else {
          g.userData.spottingPlayer = false;
          g.userData.spotTimer = Math.max(0, g.userData.spotTimer - dt * 2);
        }
      }
    }

    // Spawn extra guards when alarm first triggers
    if (alarmActive && !spawnedExtraGuards) {
      spawnedExtraGuards = true;
      for (var s = 0; s < 4; s++) {
        var angle = (s / 4) * Math.PI * 2;
        var eg = makeCyl(0.4, 0.4, 1.8, 8, 0x552222);
        eg.position.set(Math.cos(angle) * 30, 0.9, Math.sin(angle) * 30);
        eg.userData = {
          type: 'guard',
          patrol: false,
          speed: 4,
          spottingPlayer: false,
          spotTimer: 0,
          downed: false,
          alerted: true,
          alertTarget: null
        };
        scene.add(eg);
        guards.push(eg);
      }
    }
  }

  function updateDogs(dt) {
    for (var i = 0; i < guardDogs.length; i++) {
      var dog = guardDogs[i];
      dog.userData.angle += dog.userData.speed * dt * 0.1;
      var nx = dog.userData.center.x + Math.cos(dog.userData.angle) * dog.userData.radius;
      var nz = dog.userData.center.z + Math.sin(dog.userData.angle) * dog.userData.radius;
      dog.position.x = nx;
      dog.position.z = nz;

      // Update chain
      var chain = scene.children.filter(function (c) {
        return c.userData && c.userData.type === 'dogChain' && c.userData.dog === dog;
      })[0];
      if (chain) {
        var positions = chain.geometry.attributes.position;
        positions.setXYZ(0, dog.userData.center.x, 0.4, dog.userData.center.z);
        positions.setXYZ(1, dog.position.x, 0.4, dog.position.z);
        positions.needsUpdate = true;
      }

      // Dog detection (10 units)
      var ddx = dog.position.x - player.position.x;
      var ddz = dog.position.z - player.position.z;
      var dd = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dd < 10) {
        dog.userData.detected = true;
        triggerAlarm();
      }
    }
  }

  function triggerAlarm() {
    if (!alarmActive) {
      alarmActive = true;
      alarmTimer = 0;
      showPrompt('ALARM TRIGGERED! GUARDS CONVERGING!', 3);
      // Red tint on searchlight
      var lights = scene.children.filter(function (c) {
        return c.userData && c.userData.type === 'searchlight';
      });
      for (var i = 0; i < lights.length; i++) {
        lights[i].color.setHex(0xFF2200);
      }
    }
  }

  // ── Prisoner following ───────────────────────────────────────────────────────
  function updatePrisoners(dt) {
    for (var i = 0; i < prisoners.length; i++) {
      var p = prisoners[i];
      if (!p.userData.following) continue;

      var idx = followingPrisoners.indexOf(p);
      var targetX, targetZ;
      if (idx === 0) {
        targetX = player.position.x;
        targetZ = player.position.z + 4;
      } else {
        var prevP = followingPrisoners[idx - 1];
        targetX = prevP.position.x;
        targetZ = prevP.position.z + 4;
      }

      var dx = targetX - p.position.x;
      var dz = targetZ - p.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 1) {
        var pSpeed = 4; // slower than player
        p.position.x += (dx / d) * pSpeed * dt;
        p.position.z += (dz / d) * pSpeed * dt;
      }

      // If prisoner falls too far behind (sprinting), get captured
      var distToPlayer = Math.sqrt(
        Math.pow(p.position.x - player.position.x, 2) +
        Math.pow(p.position.z - player.position.z, 2)
      );
      if (distToPlayer > 20) {
        // Captured
        p.userData.following = false;
        var fi = followingPrisoners.indexOf(p);
        if (fi >= 0) followingPrisoners.splice(fi, 1);
        p.material.color.setHex(0xFF4400);
        showPrompt('A prisoner was captured!', 3);
      }
    }
  }

  // ── Player movement ───────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (drivingJeep) {
      updateJeepDriving(dt);
      return;
    }

    var moveX = 0;
    var moveZ = 0;

    if (keysDown['KeyW'] || keysDown['ArrowUp']) moveZ -= 1;
    if (keysDown['KeyS'] || keysDown['ArrowDown']) moveZ += 1;
    if (keysDown['KeyA'] || keysDown['ArrowLeft']) moveX -= 1;
    if (keysDown['KeyD'] || keysDown['ArrowRight']) moveX += 1;

    if (keysDown['KeyQ']) cameraAngle -= 1.5 * dt;
    if (keysDown['KeyE'] && !keysDown['KeyE' + '_action']) cameraAngle += 1.5 * dt;

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
      // Rotate movement by camera angle
      var ca = cameraAngle;
      var rx = moveX * Math.cos(ca) + moveZ * Math.sin(ca);
      var rz = -moveX * Math.sin(ca) + moveZ * Math.cos(ca);
      player.position.x += rx * playerSpeed * dt;
      player.position.z += rz * playerSpeed * dt;
      player.rotation.y = Math.atan2(rx, rz);
    }

    // Clamp to world bounds
    player.position.x = Math.max(-45, Math.min(45, player.position.x));
    player.position.z = Math.max(-45, Math.min(45, player.position.z));

    // Camera follow
    camera.position.x = player.position.x + Math.sin(cameraAngle) * cameraDistance;
    camera.position.z = player.position.z + Math.cos(cameraAngle) * cameraDistance;
    camera.position.y = cameraHeight;
    camera.lookAt(player.position);
  }

  function updateJeepDriving(dt) {
    if (keysDown['KeyW'] || keysDown['ArrowUp']) {
      jeepVelocity.x += Math.sin(jeepAngle) * jeepSpeed * dt;
      jeepVelocity.z += Math.cos(jeepAngle) * jeepSpeed * dt;
    }
    if (keysDown['KeyS'] || keysDown['ArrowDown']) {
      jeepVelocity.x -= Math.sin(jeepAngle) * jeepSpeed * 0.6 * dt;
      jeepVelocity.z -= Math.cos(jeepAngle) * jeepSpeed * 0.6 * dt;
    }
    if (keysDown['KeyA'] || keysDown['ArrowLeft']) jeepAngle += 1.5 * dt;
    if (keysDown['KeyD'] || keysDown['ArrowRight']) jeepAngle -= 1.5 * dt;

    jeepVelocity.x *= 0.92;
    jeepVelocity.z *= 0.92;

    jeep.position.x += jeepVelocity.x;
    jeep.position.z += jeepVelocity.z;
    jeep.rotation.y = jeepAngle;

    player.position.x = jeep.position.x;
    player.position.z = jeep.position.z;

    camera.position.x = jeep.position.x + Math.sin(cameraAngle) * cameraDistance;
    camera.position.z = jeep.position.z + Math.cos(cameraAngle) * cameraDistance;
    camera.position.y = cameraHeight;
    camera.lookAt(jeep.position);

    // Check extraction zone
    var dx = jeep.position.x - extractionPoint.x;
    var dz = jeep.position.z - extractionPoint.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < 8) {
      triggerVictory();
    }
  }

  // ── Interactions ─────────────────────────────────────────────────────────────
  function checkInteractions() {
    var px = player.position.x;
    var pz = player.position.z;

    // Keycard pickup
    if (keycard && !hasKeycard) {
      var kd = Math.sqrt(
        Math.pow(px - keycard.position.x, 2) +
        Math.pow(pz - keycard.position.z, 2)
      );
      if (kd < 2) {
        showPrompt('[F] Pick up keycard', 0.5);
        if (keysDown['KeyF']) {
          hasKeycard = true;
          scene.remove(keycard);
          keycard = null;
          showPrompt('Keycard obtained!', 2);
        }
      }
    }

    // Cell door
    if (cellDoor && !cellDoorOpen) {
      var cd = Math.sqrt(
        Math.pow(px - cellDoor.position.x, 2) +
        Math.pow(pz - cellDoor.position.z, 2)
      );
      if (cd < 3) {
        if (hasKeycard) {
          showPrompt('[E] Open cell block door', 0.5);
          if (keysDown['KeyE_door']) {
            cellDoorOpen = true;
            scene.remove(cellDoor);
            cellDoor = null;
            showPrompt('Cell block open! Free the prisoners!', 3);
          }
        } else {
          showPrompt('Need keycard to open door', 0.5);
        }
      }
    }

    // Free prisoners (when cell block is open)
    if (cellDoorOpen) {
      for (var i = 0; i < prisoners.length; i++) {
        var p = prisoners[i];
        if (p.userData.freed) continue;
        var pd = Math.sqrt(
          Math.pow(px - p.position.x, 2) +
          Math.pow(pz - p.position.z, 2)
        );
        if (pd < 3) {
          showPrompt('[F] Free prisoner', 0.5);
          if (keysDown['KeyF']) {
            p.userData.freed = true;
            p.userData.following = true;
            p.material.color.setHex(0xAABB88);
            followingPrisoners.push(p);
            freedPrisoners++;
            showPrompt('Prisoner freed! (' + freedPrisoners + '/' + totalPrisoners + ')', 2);
          }
        }
      }
    }

    // Jeep
    if (jeep) {
      var jd = Math.sqrt(
        Math.pow(px - jeep.position.x, 2) +
        Math.pow(pz - jeep.position.z, 2)
      );
      if (jd < 4 && !drivingJeep) {
        showPrompt('[V] Enter jeep', 0.5);
        if (keysDown['KeyV']) {
          drivingJeep = true;
          jeepOccupants = 1 + followingPrisoners.length;
          showPrompt('Driving jeep! Head to extraction!', 3);
        }
      }
    }

    // Exit jeep
    if (drivingJeep && keysDown['KeyX']) {
      drivingJeep = false;
      showPrompt('Exited jeep', 2);
    }

    // Pick up guard uniform from downed guards
    for (var g = 0; g < guardBodies.length; g++) {
      var body = guardBodies[g];
      var bd = Math.sqrt(
        Math.pow(px - body.position.x, 2) +
        Math.pow(pz - body.position.z, 2)
      );
      if (bd < 2 && !body.userData.uniformTaken) {
        showPrompt('[G] Grab guard uniform', 0.5);
        if (keysDown['KeyG']) {
          body.userData.uniformTaken = true;
          disguiseActive = true;
          disguiseTimer = 120;
          player.material.color.setHex(0x334433);
          showPrompt('Disguise active! 120s', 3);
        }
      }
    }

    // Attack guard (spacebar when close)
    for (var gi = 0; gi < guards.length; gi++) {
      var guard = guards[gi];
      if (guard.userData.downed) continue;
      var gdd = Math.sqrt(
        Math.pow(px - guard.position.x, 2) +
        Math.pow(pz - guard.position.z, 2)
      );
      if (gdd < 2) {
        showPrompt('[SPACE] Take down guard', 0.5);
        if (keysDown['Space']) {
          guard.userData.downed = true;
          guard.position.y = -0.5;
          guard.rotation.z = Math.PI / 2;
          guard.material.color.setHex(0x222211);
          guardBodies.push(guard);
          showPrompt('Guard taken down! Grab uniform with [G]', 3);
        }
      }
    }

    // Shoot alarm boxes (X key)
    for (var ab = 0; ab < alarmBoxes.length; ab++) {
      var abox = alarmBoxes[ab];
      if (abox.userData.disabled) continue;
      var abd = Math.sqrt(
        Math.pow(px - abox.position.x, 2) +
        Math.pow(pz - abox.position.z, 2)
      );
      if (abd < 8) {
        showPrompt('[X] Shoot alarm box', 0.5);
        if (keysDown['KeyX']) {
          abox.userData.disabled = true;
          abox.material.color.setHex(0x444444);
          var allDisabled = alarmBoxes.every(function (b) { return b.userData.disabled; });
          if (allDisabled) {
            alarmActive = false;
            showPrompt('All alarms disabled!', 3);
          }
        }
      }
    }

    // Commander exchange
    if (commander && !exchangeResolved) {
      var comd = Math.sqrt(
        Math.pow(px - commander.position.x, 2) +
        Math.pow(pz - commander.position.z, 2)
      );
      if (comd < 5) {
        var hvPrisoner = prisoners.filter(function (p2) { return p2.userData.highValue && p2.userData.freed; })[0];
        if (hvPrisoner && !exchangeOffered) {
          exchangeOffered = true;
          showPrompt('[Y] Accept exchange (1 safe) | [N] Reject (firefight)', 4);
        }
        if (exchangeOffered) {
          if (keysDown['KeyY']) {
            exchangeResolved = true;
            // 1 prisoner is safe, remove from following
            var safe = followingPrisoners[0];
            if (safe) {
              safe.userData.following = false;
              var si = followingPrisoners.indexOf(safe);
              if (si >= 0) followingPrisoners.splice(si, 1);
              safe.material.color.setHex(0x00FF44);
            }
            showPrompt('Exchange accepted. 1 prisoner secured.', 4);
            commander.userData.type = 'neutral';
          } else if (keysDown['KeyN']) {
            exchangeResolved = true;
            triggerAlarm();
            showPrompt('Rejected! Firefight started!', 3);
          }
        }
      }
    }

    // Route selection (R key)
    if (keysDown['KeyR']) {
      var routes = ['NORTH', 'EAST', 'WEST'];
      var ri = routes.indexOf(selectedRoute);
      selectedRoute = routes[(ri + 1) % routes.length];
      showPrompt('Route: ' + selectedRoute, 2);
    }

    // Cell door E key separate tracking
    if (keysDown['KeyE'] && cellDoor && !cellDoorOpen && hasKeycard) {
      var ced = Math.sqrt(
        Math.pow(px - cellDoor.position.x, 2) +
        Math.pow(pz - cellDoor.position.z, 2)
      );
      if (ced < 3) {
        cellDoorOpen = true;
        scene.remove(cellDoor);
        cellDoor = null;
        showPrompt('Cell block open! Free the prisoners!', 3);
      }
    }

    // Walking to extraction on foot
    var exd = Math.sqrt(
      Math.pow(px - extractionPoint.x, 2) +
      Math.pow(pz - extractionPoint.z, 2)
    );
    if (exd < 8 && !drivingJeep && freedPrisoners > 0) {
      triggerVictory();
    }
  }

  function triggerVictory() {
    if (!gameWon) {
      gameWon = true;
      showPrompt('EXTRACTION COMPLETE! MISSION SUCCESS! Freed: ' + freedPrisoners + '/' + totalPrisoners, 10);
    }
  }

  // ── Disguise timer ────────────────────────────────────────────────────────────
  function updateDisguise(dt) {
    if (!disguiseActive) return;
    disguiseTimer -= dt;
    if (disguiseTimer <= 0) {
      disguiseActive = false;
      player.material.color.setHex(0x2244AA);
      showPrompt('Disguise worn off!', 3);
    }
  }

  // ── Extraction countdown ──────────────────────────────────────────────────────
  function updateExtraction(dt) {
    if (gameWon || gameOver) return;
    extractionTimer -= dt;
    if (extractionTimer <= 0) {
      extractionTimer = 0;
      gameOver = true;
      showPrompt('TIME UP! MISSION FAILED!', 10);
    }
  }

  // ── Extraction zone pulse animation ─────────────────────────────────────────
  function updateExtractionZone(dt) {
    if (!extractionZone) return;
    extractionZone.rotation.y += dt * 0.5;
    var s = 1 + 0.1 * Math.sin(Date.now() * 0.003);
    extractionZone.scale.set(s, 1, s);
  }

  // ── Keycard spin ─────────────────────────────────────────────────────────────
  function updateKeycard(dt) {
    if (!keycard) return;
    keycard.rotation.y += dt * 2;
    keycard.position.y = 3.2 + 0.2 * Math.sin(Date.now() * 0.002);
  }

  // ── Prompt fade ───────────────────────────────────────────────────────────────
  function updatePrompt(dt) {
    if (promptTimer > 0) {
      promptTimer -= dt;
      if (promptTimer <= 0) {
        promptElement.style.display = 'none';
      }
    }
  }

  // ── Render loop ───────────────────────────────────────────────────────────────
  function gameLoop() {
    if (!active) return;
    requestAnimationFrame(gameLoop);

    var dt = Math.min(clock.getDelta(), 0.05);

    updatePlayer(dt);
    updateGuards(dt);
    updateDogs(dt);
    updatePrisoners(dt);
    updateDisguise(dt);
    updateExtraction(dt);
    updateExtractionZone(dt);
    updateKeycard(dt);
    checkInteractions();
    updatePrompt(dt);
    updateHUD();

    renderer.render(scene, camera);
  }

  // ── Key events ───────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!active) {
      // Check P+B activation
      keysDown[e.code] = true;
      keyTimestamps[e.code] = Date.now();
      checkActivation();
      return;
    }
    keysDown[e.code] = true;
    keyTimestamps[e.code] = Date.now();

    // One-shot actions that need edge detection
    if (e.code === 'KeyE') {
      // handled in checkInteractions per-frame
    }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
  }

  function checkActivation() {
    var pDown = keysDown['KeyP'] && keyTimestamps['KeyP'];
    var bDown = keysDown['KeyB'] && keyTimestamps['KeyB'];
    if (pDown && bDown) {
      var diff = Math.abs(keyTimestamps['KeyP'] - keyTimestamps['KeyB']);
      if (diff < 400) {
        init();
      }
    }
  }

  // ── Window resize ─────────────────────────────────────────────────────────────
  function onResize() {
    if (!active) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    if (active) return;
    active = true;

    // Reset state
    freedPrisoners = 0;
    alarmActive = false;
    alarmTimer = 0;
    selectedRoute = 'NORTH';
    extractionTimer = 105;
    gameOver = false;
    gameWon = false;
    disguiseActive = false;
    disguiseTimer = 0;
    hasKeycard = false;
    cellDoorOpen = false;
    guards = [];
    guardDogs = [];
    prisoners = [];
    alarmBoxes = [];
    guardBodies = [];
    followingPrisoners = [];
    spawnedExtraGuards = false;
    drivingJeep = false;
    jeepOccupants = 0;
    jeepAngle = 0;
    jeepVelocity = { x: 0, z: 0 };
    exchangeOffered = false;
    exchangeResolved = false;
    cameraAngle = 0;
    keysDown = {};
    keyTimestamps = {};

    // Container
    container = document.createElement('div');
    container.id = 'prison-break-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:#000;';
    document.body.appendChild(container);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x112211);
    scene.fog = new THREE.Fog(0x112211, 60, 120);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, cameraHeight, 20 + cameraDistance);

    // Clock
    clock = new THREE.Clock();

    // Build world
    buildPrison();
    buildGuards();
    buildPlayer();
    buildHUD();

    // Events
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);

    // ESC to exit
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Escape' && active) reset();
    });

    showPrompt('PRISON BREAK — WASD move, E door, F free/grab, G uniform, V jeep, X shoot/exit, R route, P+B exit', 8);

    gameLoop();
  }

  // ── Update (external) ────────────────────────────────────────────────────────
  function update(dt) {
    // External update hook — game loop is self-contained
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    active = false;

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);

    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }
    if (promptElement && promptElement.parentNode) {
      promptElement.parentNode.removeChild(promptElement);
      promptElement = null;
    }

    scene = null;
    camera = null;
    clock = null;
    guards = [];
    guardDogs = [];
    prisoners = [];
    alarmBoxes = [];
    guardBodies = [];
    followingPrisoners = [];
    keycard = null;
    cellDoor = null;
    jeep = null;
    extractionZone = null;
    commander = null;
    keysDown = {};
    keyTimestamps = {};
  }

  return { init: init, update: update, reset: reset };

})();
