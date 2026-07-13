window.EmbassyRaid = (function () {
  'use strict';

  // --- state ---
  var scene, camera;
  var objects = [];
  var enemies = [];
  var commsEquipment = [];
  var active = false;
  var ambassadorSecured = false;
  var intelPct = 0;
  var missionFailed = false;
  var missionWon = false;
  var lastEKeyTime = 0;
  var eKeyPending = false;
  var hudEl = null;
  var keys = {};
  var clock = null;
  var raycaster = null;
  var playerVel = { x: 0, z: 0 };
  var SPEED = 8;
  var TURN = 1.5;
  var INTEL_RATE = 4; // percent per second
  var COMMS_DESTROYED = false;

  // --- helpers ---
  function makeMesh(geo, color, receiveShadow) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    if (receiveShadow) {
      mesh.receiveShadow = true;
      mesh.castShadow = true;
    }
    return mesh;
  }

  function track(obj) {
    scene.add(obj);
    objects.push(obj);
    return obj;
  }

  // --- HUD ---
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'embassy-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#e0e0e0',
      'font-family:monospace',
      'font-size:14px',
      'padding:10px 20px',
      'border:1px solid #555',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:pre',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var ambLine = ambassadorSecured
      ? '[ AMBASSADOR : SECURED       ]'
      : '[ AMBASSADOR : NOT SECURED   ]';
    var intelLine = '[ INTEL TRANSMITTED : ' + Math.floor(intelPct) + '%' + (intelPct >= 100 ? ' FAIL' : '     ') + ' ]';
    var commsLine = COMMS_DESTROYED
      ? '[ COMMS      : DESTROYED     ]'
      : '[ COMMS      : ACTIVE  (E=destroy) ]';
    var statusLine = missionFailed
      ? '[ !! MISSION FAILED !!        ]'
      : missionWon
      ? '[ ** MISSION COMPLETE **      ]'
      : '[ OBJECTIVE : EXTRACT AMBASSADOR ]';
    hudEl.textContent = [ambLine, intelLine, commsLine, statusLine].join('\n');
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
    }
    hudEl = null;
  }

  // --- lighting ---
  function buildLights() {
    var amb = new THREE.AmbientLight(0x404060, 0.6);
    track(amb);
    var dir = new THREE.DirectionalLight(0xffeedd, 1.0);
    dir.position.set(20, 40, 20);
    dir.castShadow = true;
    track(dir);
    var pt1 = new THREE.PointLight(0x4488ff, 0.8, 40);
    pt1.position.set(0, 8, -10);
    track(pt1);
    var pt2 = new THREE.PointLight(0xff4422, 0.5, 30);
    pt2.position.set(15, 5, 10);
    track(pt2);
  }

  // --- ground ---
  function buildGround() {
    var geo = new THREE.BoxGeometry(120, 0.5, 120);
    var m = makeMesh(geo, 0x3a3a3a, true);
    m.position.set(0, -0.25, 0);
    track(m);
  }

  // --- embassy exterior ---
  function buildExterior() {
    // main building body
    var body = makeMesh(new THREE.BoxGeometry(40, 16, 30), 0xc8b89a, true);
    body.position.set(0, 8, -20);
    track(body);

    // roof slab
    var roof = makeMesh(new THREE.BoxGeometry(42, 1.5, 32), 0x9a8a72, true);
    roof.position.set(0, 16.75, -20);
    track(roof);

    // entrance portico overhang
    var port = makeMesh(new THREE.BoxGeometry(14, 1, 8), 0x9a8a72, true);
    port.position.set(0, 12, 1);
    track(port);

    // columns (6 CylinderGeometry pillars)
    var colPositionsX = [-5, 0, 5];
    for (var ci = 0; ci < colPositionsX.length; ci++) {
      for (var side = -1; side <= 1; side += 2) {
        var col = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 10), 0xf0e8d8, true);
        col.position.set(colPositionsX[ci], 6, side === -1 ? -3 : 5);
        track(col);
      }
    }

    // flag poles
    for (var fp = -1; fp <= 1; fp += 2) {
      var pole = makeMesh(new THREE.CylinderGeometry(0.08, 0.08, 10, 8), 0x888888, true);
      pole.position.set(fp * 9, 5, 5);
      track(pole);
      var flag = makeMesh(new THREE.BoxGeometry(2.5, 1.5, 0.05), fp === -1 ? 0xcc2222 : 0x2255cc, true);
      flag.position.set(fp * 9 + fp * 1.25, 9.5, 5);
      track(flag);
    }

    // perimeter walls (low)
    var wallN = makeMesh(new THREE.BoxGeometry(60, 3, 1), 0xaaaaaa, true);
    wallN.position.set(0, 1.5, 10);
    track(wallN);
    var wallE = makeMesh(new THREE.BoxGeometry(1, 3, 50), 0xaaaaaa, true);
    wallE.position.set(30, 1.5, -15);
    track(wallE);
    var wallW = makeMesh(new THREE.BoxGeometry(1, 3, 50), 0xaaaaaa, true);
    wallW.position.set(-30, 1.5, -15);
    track(wallW);
    var wallS = makeMesh(new THREE.BoxGeometry(60, 3, 1), 0xaaaaaa, true);
    wallS.position.set(0, 1.5, -40);
    track(wallS);
  }

  // --- security checkpoint ---
  function buildCheckpoint() {
    // barrier arm
    var base = makeMesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), 0x444444, true);
    base.position.set(-6, 0.75, 8);
    track(base);
    var arm = makeMesh(new THREE.BoxGeometry(6, 0.2, 0.2), 0xffcc00, true);
    arm.position.set(-3, 1.8, 8);
    track(arm);
    var base2 = makeMesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), 0x444444, true);
    base2.position.set(6, 0.75, 8);
    track(base2);
    var arm2 = makeMesh(new THREE.BoxGeometry(6, 0.2, 0.2), 0xffcc00, true);
    arm2.position.set(3, 1.8, 8);
    track(arm2);
    // bollards
    for (var b = -2; b <= 2; b++) {
      var bol = makeMesh(new THREE.CylinderGeometry(0.25, 0.3, 1, 8), 0x333333, true);
      bol.position.set(b * 2, 0.5, 6);
      track(bol);
    }
  }

  // --- reception hall ---
  function buildReception() {
    // front desk
    var desk = makeMesh(new THREE.BoxGeometry(8, 1.5, 2), 0x7a5c3a, true);
    desk.position.set(0, 0.75, -8);
    track(desk);
    // waiting chairs (box primitives)
    var chairPositions = [[-10, -8], [-10, -10], [10, -8], [10, -10]];
    for (var ci2 = 0; ci2 < chairPositions.length; ci2++) {
      var ch = makeMesh(new THREE.BoxGeometry(1.2, 1, 1.2), 0x2a4a7a, true);
      ch.position.set(chairPositions[ci2][0], 0.5, chairPositions[ci2][1]);
      track(ch);
    }
    // side table
    var sideT = makeMesh(new THREE.BoxGeometry(2, 0.8, 1), 0x7a5c3a, true);
    sideT.position.set(-10, 0.4, -9);
    track(sideT);
    // security scanner arch
    var archL = makeMesh(new THREE.BoxGeometry(0.3, 3.5, 0.3), 0x666666, true);
    archL.position.set(-1.5, 1.75, -4);
    track(archL);
    var archR = makeMesh(new THREE.BoxGeometry(0.3, 3.5, 0.3), 0x666666, true);
    archR.position.set(1.5, 1.75, -4);
    track(archR);
    var archTop = makeMesh(new THREE.BoxGeometry(3.3, 0.3, 0.3), 0x666666, true);
    archTop.position.set(0, 3.5, -4);
    track(archTop);
  }

  // --- conference room ---
  function buildConferenceRoom() {
    // oval table approximated with a wide flat cylinder
    var table = makeMesh(new THREE.CylinderGeometry(5, 5, 0.4, 24), 0x5a3a1a, true);
    table.scale.set(1.6, 1, 1);
    table.position.set(0, 1.2, -28);
    track(table);
    // chairs around it
    var numChairs = 10;
    for (var i = 0; i < numChairs; i++) {
      var angle = (i / numChairs) * Math.PI * 2;
      var cx = Math.cos(angle) * 7;
      var cz = Math.sin(angle) * 5;
      var confCh = makeMesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), 0x1a1a2a, true);
      confCh.position.set(cx, 0.6, -28 + cz);
      track(confCh);
    }
    // projector screen (flat box on wall)
    var screen = makeMesh(new THREE.BoxGeometry(8, 5, 0.15), 0xdddddd, true);
    screen.position.set(0, 6, -34.5);
    track(screen);
    // projector
    var proj = makeMesh(new THREE.BoxGeometry(1, 0.5, 0.8), 0x222222, true);
    proj.position.set(0, 5, -22);
    track(proj);
  }

  // --- comms room with antenna arrays ---
  function buildCommsRoom() {
    // comms room walls (interior)
    var commsFloor = makeMesh(new THREE.BoxGeometry(16, 0.2, 14), 0x222222, true);
    commsFloor.position.set(15, 0.1, -28);
    track(commsFloor);

    // main server/comms rack
    var rack1 = makeMesh(new THREE.BoxGeometry(2, 5, 1), 0x111111, true);
    rack1.position.set(12, 2.5, -28);
    track(rack1);
    commsEquipment.push(rack1);

    var rack2 = makeMesh(new THREE.BoxGeometry(2, 5, 1), 0x111111, true);
    rack2.position.set(14.5, 2.5, -28);
    track(rack2);
    commsEquipment.push(rack2);

    var rack3 = makeMesh(new THREE.BoxGeometry(2, 5, 1), 0x111111, true);
    rack3.position.set(17, 2.5, -28);
    track(rack3);
    commsEquipment.push(rack3);

    // control console
    var console1 = makeMesh(new THREE.BoxGeometry(6, 1.5, 2), 0x1a1a1a, true);
    console1.position.set(15, 0.75, -24);
    track(console1);
    commsEquipment.push(console1);

    // antenna mast on roof
    var mast = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 8, 8), 0x888888, true);
    mast.position.set(15, 20, -28);
    track(mast);
    commsEquipment.push(mast);

    // antenna dishes (cone approximation)
    var dish1 = makeMesh(new THREE.ConeGeometry(1.5, 0.5, 12), 0x777777, true);
    dish1.rotation.z = Math.PI / 2;
    dish1.position.set(16.5, 22, -28);
    track(dish1);
    commsEquipment.push(dish1);

    var dish2 = makeMesh(new THREE.ConeGeometry(1, 0.4, 12), 0x777777, true);
    dish2.rotation.z = -Math.PI / 3;
    dish2.position.set(15, 23.5, -27);
    track(dish2);
    commsEquipment.push(dish2);

    // blinking indicator light
    var light = new THREE.PointLight(0xff0000, 1.5, 8);
    light.position.set(15, 20, -28);
    track(light);
  }

  // --- enemies (rogue intel agents) ---
  function buildEnemies() {
    var spawnPoints = [
      { x: -8, z: -12 },
      { x: 8, z: -15 },
      { x: -12, z: -28 },
      { x: 12, z: -22 },
      { x: 18, z: -28 },
      { x: 3, z: -30 }
    ];

    for (var ei = 0; ei < spawnPoints.length; ei++) {
      var sp = spawnPoints[ei];
      var agent = buildAgent(sp.x, sp.z);
      enemies.push(agent);
    }
  }

  function buildAgent(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    // torso (suit body)
    var torso = makeMesh(new THREE.BoxGeometry(0.8, 1.1, 0.4), 0x1a1a2e, false);
    torso.position.set(0, 1.55, 0);
    group.add(torso);

    // head
    var head = makeMesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), 0xd4a57a, false);
    head.position.set(0, 2.4, 0);
    group.add(head);

    // legs
    var legL = makeMesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), 0x111122, false);
    legL.position.set(-0.22, 0.5, 0);
    group.add(legL);

    var legR = makeMesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), 0x111122, false);
    legR.position.set(0.22, 0.5, 0);
    group.add(legR);

    // arms
    var armL = makeMesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), 0x1a1a2e, false);
    armL.position.set(-0.55, 1.5, 0);
    group.add(armL);

    var armR = makeMesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), 0x1a1a2e, false);
    armR.position.set(0.55, 1.5, 0);
    group.add(armR);

    // briefcase
    var briefcase = makeMesh(new THREE.BoxGeometry(0.5, 0.35, 0.12), 0x3a2a10, false);
    briefcase.position.set(0.8, 1.2, 0.05);
    group.add(briefcase);

    // briefcase handle
    var handle = makeMesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), 0x2a1a08, false);
    handle.position.set(0.8, 1.42, 0.05);
    group.add(handle);

    // tie
    var tie = makeMesh(new THREE.BoxGeometry(0.1, 0.6, 0.05), 0xcc2222, false);
    tie.position.set(0, 1.6, 0.23);
    group.add(tie);

    group.userData.alive = true;
    group.userData.health = 2;
    group.userData.patrolAngle = Math.random() * Math.PI * 2;
    group.userData.patrolRadius = 3 + Math.random() * 2;
    group.userData.originX = x;
    group.userData.originZ = z;
    group.userData.speed = 1.2 + Math.random() * 0.8;

    scene.add(group);
    objects.push(group);
    return group;
  }

  // --- input ---
  function onKeyDown(e) {
    if (!active) {
      // ER toggle check even when inactive
      if (e.key === 'E' || e.key === 'e') {
        eKeyPending = true;
        lastEKeyTime = Date.now();
      } else if ((e.key === 'R' || e.key === 'r') && eKeyPending && Date.now() - lastEKeyTime <= 400) {
        eKeyPending = false;
        toggleModule(true);
      }
      return;
    }
    keys[e.key.toLowerCase()] = true;

    // ER toggle
    if (e.key === 'E' || e.key === 'e') {
      eKeyPending = true;
      lastEKeyTime = Date.now();
    } else if ((e.key === 'R' || e.key === 'r') && eKeyPending && Date.now() - lastEKeyTime <= 400) {
      eKeyPending = false;
      toggleModule(false);
      return;
    }

    // E alone: interact (destroy comms or secure ambassador)
    if ((e.key === 'E' || e.key === 'e') && !eKeyPending) {
      tryInteract();
    }
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  function tryInteract() {
    if (COMMS_DESTROYED) return;
    // check proximity to comms room
    var px = camera.position.x;
    var pz = camera.position.z;
    var dist = Math.sqrt((px - 15) * (px - 15) + (pz - (-28)) * (pz - (-28)));
    if (dist < 6) {
      destroyComms();
    }
    // check ambassador (near conference room)
    var distAmb = Math.sqrt(px * px + (pz - (-28)) * (pz - (-28)));
    if (distAmb < 7 && !ambassadorSecured) {
      ambassadorSecured = true;
      showNotification('AMBASSADOR SECURED — EXTRACT NOW');
    }
  }

  function destroyComms() {
    COMMS_DESTROYED = true;
    for (var ci = 0; ci < commsEquipment.length; ci++) {
      var eq = commsEquipment[ci];
      if (eq.material) {
        eq.material.color.setHex(0x441111);
        eq.material.opacity = 0.4;
        eq.material.transparent = true;
      }
    }
    showNotification('COMMS DESTROYED — INTEL TRANSMISSION HALTED');
  }

  // --- notification ---
  function showNotification(msg) {
    var note = document.createElement('div');
    note.style.cssText = [
      'position:fixed',
      'top:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(200,50,50,0.88)',
      'color:#fff',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'padding:10px 24px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:10000',
      'letter-spacing:1px'
    ].join(';');
    note.textContent = msg;
    document.body.appendChild(note);
    setTimeout(function () {
      if (note.parentNode) note.parentNode.removeChild(note);
    }, 3000);
  }

  // --- toggle module ---
  function toggleModule(turningOn) {
    if (turningOn && !active) {
      active = true;
      showNotification('EMBASSY RAID — MISSION ACTIVE');
    } else if (!turningOn && active) {
      active = false;
      showNotification('EMBASSY RAID — STANDBY');
    }
  }

  // --- update enemies ---
  function updateEnemies(delta) {
    for (var ei = 0; ei < enemies.length; ei++) {
      var agent = enemies[ei];
      if (!agent.userData.alive) continue;
      // patrol circle
      agent.userData.patrolAngle += agent.userData.speed * delta * 0.5;
      var nx = agent.userData.originX + Math.cos(agent.userData.patrolAngle) * agent.userData.patrolRadius;
      var nz = agent.userData.originZ + Math.sin(agent.userData.patrolAngle) * agent.userData.patrolRadius;
      agent.position.x = nx;
      agent.position.z = nz;
      agent.rotation.y = -agent.userData.patrolAngle - Math.PI / 2;
    }
  }

  // --- update player movement ---
  function updatePlayer(delta) {
    var moved = false;
    var dx = 0, dz = 0;
    if (keys['w'] || keys['arrowup']) { dz -= 1; moved = true; }
    if (keys['s'] || keys['arrowdown']) { dz += 1; moved = true; }
    if (keys['a'] || keys['arrowleft']) {
      camera.rotation.y += TURN * delta;
      moved = true;
    }
    if (keys['d'] || keys['arrowright']) {
      camera.rotation.y -= TURN * delta;
      moved = true;
    }
    if (moved && (dz !== 0 || dx !== 0)) {
      var dir = new THREE.Vector3(dx, 0, dz);
      dir.applyEuler(camera.rotation);
      dir.y = 0;
      dir.normalize();
      camera.position.x += dir.x * SPEED * delta;
      camera.position.z += dir.z * SPEED * delta;
    }
    // clamp inside perimeter
    camera.position.x = Math.max(-29, Math.min(29, camera.position.x));
    camera.position.z = Math.max(-39, Math.min(9, camera.position.z));
    camera.position.y = 1.7;
  }

  // --- shooting ---
  function tryShoot() {
    if (!raycaster) return;
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    for (var ei = 0; ei < enemies.length; ei++) {
      var agent = enemies[ei];
      if (!agent.userData.alive) continue;
      var box = new THREE.Box3().setFromObject(agent);
      var hit = raycaster.ray.intersectsBox(box);
      if (hit) {
        agent.userData.health -= 1;
        if (agent.userData.health <= 0) {
          agent.userData.alive = false;
          agent.visible = false;
          showNotification('ROGUE AGENT ELIMINATED');
        }
        break;
      }
    }
  }

  // --- check win/lose ---
  function checkConditions() {
    if (missionFailed || missionWon) return;
    if (intelPct >= 100) {
      missionFailed = true;
      showNotification('MISSION FAILED — INTEL TRANSMITTED');
      active = false;
    }
    // win: ambassador secured + all enemies down
    var allDown = true;
    for (var ei = 0; ei < enemies.length; ei++) {
      if (enemies[ei].userData.alive) { allDown = false; break; }
    }
    if (ambassadorSecured && allDown && !missionFailed) {
      missionWon = true;
      showNotification('MISSION COMPLETE — AMBASSADOR EXTRACTED');
      active = false;
    }
  }

  // --- public API ---
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    raycaster = new THREE.Raycaster();
    clock = new THREE.Clock();

    // reset state
    active = false;
    ambassadorSecured = false;
    intelPct = 0;
    missionFailed = false;
    missionWon = false;
    COMMS_DESTROYED = false;
    eKeyPending = false;
    lastEKeyTime = 0;
    keys = {};
    playerVel = { x: 0, z: 0 };

    camera.position.set(0, 1.7, 9);
    camera.rotation.set(0, Math.PI, 0);

    buildLights();
    buildGround();
    buildExterior();
    buildCheckpoint();
    buildReception();
    buildConferenceRoom();
    buildCommsRoom();
    buildEnemies();
    buildHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // shoot on click
    document.addEventListener('click', function () {
      if (active) tryShoot();
    });

    showNotification('EMBASSY RAID — PRESS E then R TO ACTIVATE');
  }

  function update(delta) {
    if (!active) return;
    updatePlayer(delta);
    updateEnemies(delta);
    if (!COMMS_DESTROYED && !missionFailed && !missionWon) {
      intelPct = Math.min(100, intelPct + INTEL_RATE * delta);
    }
    checkConditions();
    updateHUD();
  }

  function reset() {
    active = false;
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    removeHUD();
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    enemies = [];
    commsEquipment = [];
    ambassadorSecured = false;
    intelPct = 0;
    missionFailed = false;
    missionWon = false;
    COMMS_DESTROYED = false;
    eKeyPending = false;
    keys = {};
  }

  return { init: init, update: update, reset: reset };
}());
