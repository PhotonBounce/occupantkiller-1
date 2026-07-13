window.CargoPlanejack = (function() {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer;
  var clock;
  var activated = false;
  var cKeyTime = 0, pKeyTime = 0;

  // player
  var playerHP = 100;
  var playerPos = { x: 0, y: 0, z: 30 };
  var playerVel = { x: 0, y: 0, z: 0 };
  var yaw = 0, pitch = 0;
  var hasParachute = false;
  var isDead = false;
  var isOnRamp = false;

  // plane
  var planeGroup;
  var planeTiltZ = 0;
  var tiltTimer = 0;
  var crashTimer = 480; // 8 minutes
  var flightStatus = 'CRITICAL'; // 'STABLE' | 'CRITICAL'
  var stabilizeProgress = 0;
  var isStabilizing = false;
  var stabilizeTimer = 0;
  var cockpitHackProgress = 0;
  var isHacking = false;
  var hackTimer = 0;

  // hijackers
  var hijackers = [];
  var pilot = null;
  var pilotCaptured = false;

  // bioweapons
  var canisters = [];
  var canistersSecured = 0;
  var canistersLost = 0;

  // turbulence
  var turbulenceTimer = 0;
  var turbulenceActive = false;
  var turbulenceDuration = 0;
  var turbulenceNext = 30;

  // combat
  var shootCooldown = 0;
  var meleeCooldown = 0;
  var lastMouseDown = false;
  var meleePressLast = false;

  // E-hold cockpit
  var eHoldTimer = 0;
  var nearCockpit = false;

  // cargo slide objects
  var cargoBoxMeshes = [];

  // HUD
  var hudEl = null;

  // geometry refs
  var fuselageMesh = null;
  var rampMesh = null;
  var cockpitMesh = null;
  var parachuteMesh = null;
  var parachutePickedUp = false;

  // win / lose flags
  var gameOver = false;
  var gameWon = false;

  // mouse pointer lock
  var pointerLocked = false;
  var mouseDX = 0, mouseDY = 0;

  // ── helpers ────────────────────────────────────────────────────────────────
  function makeMat(color, opts) {
    var o = opts || {};
    return new THREE.MeshLambertMaterial({
      color: color,
      transparent: o.transparent || false,
      opacity: o.opacity !== undefined ? o.opacity : 1.0,
      side: o.side || THREE.FrontSide
    });
  }

  function makeWireMat(color) {
    return new THREE.LineBasicMaterial({ color: color });
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // ── build plane interior ───────────────────────────────────────────────────
  function buildPlane() {
    planeGroup = new THREE.Group();
    scene.add(planeGroup);

    // fuselage – long cylinder on Z axis
    var fusGeo = new THREE.CylinderGeometry(5, 5, 80, 16, 1, true);
    var fusMat = makeMat(0x445566, { side: THREE.BackSide });
    fuselageMesh = new THREE.Mesh(fusGeo, fusMat);
    fuselageMesh.rotation.x = Math.PI / 2;
    planeGroup.add(fuselageMesh);

    // floor
    var floorGeo = new THREE.BoxGeometry(9, 0.2, 80);
    var floorMesh = new THREE.Mesh(floorGeo, makeMat(0x334455));
    floorMesh.position.y = -4.8;
    planeGroup.add(floorMesh);

    // ceiling strips
    var ceilGeo = new THREE.BoxGeometry(9, 0.2, 80);
    var ceilMesh = new THREE.Mesh(ceilGeo, makeMat(0x223344));
    ceilMesh.position.y = 4.8;
    planeGroup.add(ceilMesh);

    // windows (left & right walls — thin boxes)
    for (var wi = 0; wi < 10; wi++) {
      var wz = -35 + wi * 7;
      // left window
      var wgL = new THREE.BoxGeometry(0.15, 1.2, 0.8);
      var wmL = new THREE.Mesh(wgL, makeMat(0x334488, { transparent: true, opacity: 0.5 }));
      wmL.position.set(-4.9, 1.5, wz);
      planeGroup.add(wmL);
      // right window
      var wgR = new THREE.BoxGeometry(0.15, 1.2, 0.8);
      var wmR = new THREE.Mesh(wgR, makeMat(0x334488, { transparent: true, opacity: 0.5 }));
      wmR.position.set(4.9, 1.5, wz);
      planeGroup.add(wmR);
      // blue point lights near windows
      var wLight = new THREE.PointLight(0x224488, 0.4, 8);
      wLight.position.set(4.5, 1.5, wz);
      planeGroup.add(wLight);
    }

    // cargo bay boxes (mid-fuselage)
    var cargoColors = [0x667744, 0x556633, 0x778855, 0x445522];
    for (var ci = 0; ci < 12; ci++) {
      var cw = rnd(1.5, 2.5), ch = rnd(1, 2), cd = rnd(1.5, 2.5);
      var cgeo = new THREE.BoxGeometry(cw, ch, cd);
      var cmesh = new THREE.Mesh(cgeo, makeMat(cargoColors[ci % cargoColors.length]));
      cmesh.position.set(rnd(-3.5, 3.5), -4.8 + ch/2, rnd(-20, 10));
      cmesh.userData.baseZ = cmesh.position.z;
      cmesh.userData.baseX = cmesh.position.x;
      planeGroup.add(cmesh);
      cargoBoxMeshes.push(cmesh);
    }

    // tail ramp (rear, z = +40)
    var rampGeo = new THREE.BoxGeometry(8, 0.3, 10);
    rampMesh = new THREE.Mesh(rampGeo, makeMat(0x556677));
    rampMesh.position.set(0, -4.9, 38);
    rampMesh.rotation.x = 0.3; // angled slightly down
    planeGroup.add(rampMesh);

    // rear door frame
    var doorGeo = new THREE.BoxGeometry(8, 8, 0.3);
    var doorMesh = new THREE.Mesh(doorGeo, makeMat(0x445566));
    doorMesh.position.set(0, 0, 43);
    planeGroup.add(doorMesh);

    // cockpit (front, z = -38)
    var cpGeo = new THREE.BoxGeometry(7, 5, 8);
    cockpitMesh = new THREE.Mesh(cpGeo, makeMat(0x334455));
    cockpitMesh.position.set(0, 0, -39);
    planeGroup.add(cockpitMesh);

    // cockpit instrument panel (LineSegments)
    var panelGeo = new THREE.BoxGeometry(5, 2, 0.1);
    var panelEdges = new THREE.EdgesGeometry(panelGeo);
    var panelLines = new THREE.LineSegments(panelEdges, makeWireMat(0x00ff88));
    panelLines.position.set(0, -0.5, -35.5);
    planeGroup.add(panelLines);

    // more instrument panel lines
    for (var pi = 0; pi < 6; pi++) {
      var instrGeo = new THREE.BoxGeometry(0.8, 0.6, 0.05);
      var instrEdges = new THREE.EdgesGeometry(instrGeo);
      var instrLines = new THREE.LineSegments(instrEdges, makeWireMat(0x00cc66));
      instrLines.position.set(-2 + pi * 0.9, -0.5 + (pi % 2) * 0.7, -35.4);
      planeGroup.add(instrLines);
    }

    // cockpit separator wall
    var sepGeo = new THREE.BoxGeometry(9.8, 8, 0.3);
    var sepMesh = new THREE.Mesh(sepGeo, makeMat(0x334455));
    sepMesh.position.set(0, 0, -34.5);
    planeGroup.add(sepMesh);

    // door hole in separator
    var doorHoleGeo = new THREE.BoxGeometry(1.5, 3, 0.4);
    var doorHoleMesh = new THREE.Mesh(doorHoleGeo, makeMat(0x112233));
    doorHoleMesh.position.set(0, -1.5, -34.5);
    planeGroup.add(doorHoleMesh);

    // parachute pickup locker (near rear)
    var lockerGeo = new THREE.BoxGeometry(1, 2, 0.8);
    parachuteMesh = new THREE.Mesh(lockerGeo, makeMat(0xcc8822));
    parachuteMesh.position.set(-3.5, -3.8, 32);
    planeGroup.add(parachuteMesh);

    // parachute label (LineSegments box on top)
    var pLabelGeo = new THREE.BoxGeometry(0.8, 0.4, 0.3);
    var pEdges = new THREE.EdgesGeometry(pLabelGeo);
    var pLines = new THREE.LineSegments(pEdges, makeWireMat(0xffff00));
    pLines.position.set(-3.5, -2.8, 32);
    planeGroup.add(pLines);

    // ambient light inside fuselage
    var ambInside = new THREE.PointLight(0x8899aa, 0.6, 60);
    ambInside.position.set(0, 3, 0);
    planeGroup.add(ambInside);

    var ambMid = new THREE.PointLight(0x7788aa, 0.4, 40);
    ambMid.position.set(0, 3, 20);
    planeGroup.add(ambMid);

    // exterior – sky visible beyond windows
    var skyGeo = new THREE.BoxGeometry(200, 200, 200);
    var skyMat = new THREE.MeshLambertMaterial({ color: 0x112244, side: THREE.BackSide });
    var skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);

    // sun / distant light
    var sunLight = new THREE.DirectionalLight(0xaabbcc, 0.8);
    sunLight.position.set(50, 100, -50);
    scene.add(sunLight);

    var ambLight = new THREE.AmbientLight(0x334455, 0.5);
    scene.add(ambLight);
  }

  // ── spawn hijackers ────────────────────────────────────────────────────────
  function spawnHijackers() {
    hijackers = [];
    for (var i = 0; i < 20; i++) {
      var geo = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var mesh = new THREE.Mesh(geo, makeMat(0x332211));
      var zpos = rnd(-30, 38);
      mesh.position.set(rnd(-3, 3), -3.9, zpos);
      planeGroup.add(mesh);

      // head
      var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var headMesh = new THREE.Mesh(headGeo, makeMat(0x553322));
      headMesh.position.set(0, 1.15, 0);
      mesh.add(headMesh);

      var h = {
        mesh: mesh,
        hp: 80,
        alive: true,
        patrol: true,
        patrolDir: (Math.random() > 0.5 ? 1 : -1),
        patrolTimer: rnd(2, 5),
        alertTimer: 0,
        canisterTarget: null,
        isPilot: false,
        pos: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }
      };
      hijackers.push(h);
    }

    // pilot
    var pGeo = new THREE.BoxGeometry(0.7, 1.8, 0.5);
    var pMesh = new THREE.Mesh(pGeo, makeMat(0x334433));
    pMesh.position.set(0, -3.9, -37);
    planeGroup.add(pMesh);

    var pHeadGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var pHeadMesh = new THREE.Mesh(pHeadGeo, makeMat(0x446644));
    pHeadMesh.position.set(0, 1.15, 0);
    pMesh.add(pHeadMesh);

    pilot = {
      mesh: pMesh,
      hp: 150,
      alive: true,
      patrol: false,
      isPilot: true,
      pos: { x: 0, y: -3.9, z: -37 }
    };
  }

  // ── spawn canisters ────────────────────────────────────────────────────────
  function spawnCanisters() {
    canisters = [];
    var zPositions = [-10, -2, 6, 14];
    for (var i = 0; i < 4; i++) {
      var geo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
      var mesh = new THREE.Mesh(geo, makeMat(0xFF4400));
      mesh.position.set(rnd(-2, 2), -4.2, zPositions[i]);
      planeGroup.add(mesh);

      var light = new THREE.PointLight(0xFF4400, 0.8, 4);
      light.position.copy(mesh.position);
      planeGroup.add(light);

      var c = {
        mesh: mesh,
        light: light,
        secured: false,
        lost: false,
        beingCarried: false,
        carrier: null,
        pos: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }
      };
      canisters.push(c);
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'cpj-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#00ff88',
      'font:bold 13px monospace',
      'background:rgba(0,0,0,0.6)',
      'padding:8px 12px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:pre',
      'display:none'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    if (!activated) { hudEl.style.display = 'none'; return; }
    hudEl.style.display = 'block';

    var liveHijackers = hijackers.filter(function(h) { return h.alive; }).length;
    var pilotStr = pilotCaptured ? 'CAPTURED' : (pilot && pilot.alive ? 'ACTIVE' : 'DEAD');
    var flightStr = flightStatus === 'STABLE' ? 'STABLE' : ('CRITICAL ' + fmtTime(crashTimer));
    var timerStr = fmtTime(crashTimer);
    var tiltDeg = Math.round(planeTiltZ * 57.3);

    var lines = [
      'CARGO PLANE HIJACK',
      '[CANISTERS: ' + canistersSecured + '/4 SECURED | LOST: ' + canistersLost + ']',
      '[PILOT: ' + pilotStr + ']',
      '[FLIGHT: ' + flightStr + ']',
      '[HIJACKERS: ' + liveHijackers + ']',
      '[TIMER: ' + timerStr + ']',
      '[HP: ' + playerHP + ']',
      '[TILT: ' + tiltDeg + 'deg]',
      hasParachute ? '[PARACHUTE: EQUIPPED]' : '[PARACHUTE: NO]',
      turbulenceActive ? '[!! TURBULENCE !!]' : '',
      isStabilizing ? '[STABILIZING: ' + Math.floor(stabilizeProgress) + '%]' : '',
      isHacking ? '[HACKING PANEL: ' + Math.floor(cockpitHackProgress) + '%]' : '',
      gameOver ? (gameWon ? '>> MISSION COMPLETE <<' : '>> MISSION FAILED <<') : ''
    ];

    hudEl.textContent = lines.filter(function(l) { return l !== ''; }).join('\n');
  }

  // ── overlay message ────────────────────────────────────────────────────────
  function showMsg(txt, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + (color || '#ff4400'),
      'font:bold 32px monospace',
      'background:rgba(0,0,0,0.8)',
      'padding:20px 40px',
      'border-radius:8px',
      'z-index:99999'
    ].join(';');
    el.textContent = txt;
    document.body.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 4000);
  }

  // ── activation ────────────────────────────────────────────────────────────
  function tryActivate(keys) {
    var now = performance.now();
    if (keys['c'] || keys['C']) {
      cKeyTime = now;
    }
    if (keys['p'] || keys['P']) {
      pKeyTime = now;
    }
    if (cKeyTime > 0 && pKeyTime > 0) {
      if (Math.abs(cKeyTime - pKeyTime) < 400) {
        activated = true;
        cKeyTime = 0;
        pKeyTime = 0;
        setupPointerLock();
        showMsg('CARGO PLANE HIJACK ACTIVATED', '#00ff88');
      }
    }
  }

  // ── pointer lock ──────────────────────────────────────────────────────────
  function setupPointerLock() {
    var canvas = renderer.domElement;
    canvas.addEventListener('click', function() {
      if (activated && !gameOver) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', function() {
      pointerLocked = document.pointerLockElement === canvas;
    });
    document.addEventListener('mousemove', function(e) {
      if (!pointerLocked) return;
      mouseDX += e.movementX;
      mouseDY += e.movementY;
    });
    document.addEventListener('mousedown', function(e) {
      if (!pointerLocked || !activated || gameOver) return;
      if (e.button === 0) lastMouseDown = true;
    });
  }

  // ── player movement ───────────────────────────────────────────────────────
  function movePlayer(delta, keys) {
    if (isDead || gameOver) return;

    // mouse look
    var sens = 0.002;
    yaw -= mouseDX * sens;
    pitch -= mouseDY * sens;
    pitch = clamp(pitch, -1.2, 1.2);
    mouseDX = 0;
    mouseDY = 0;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    var speed = turbulenceActive ? 2.0 : 5.0;
    var fw = keys['w'] || keys['W'] || keys['ArrowUp'];
    var bk = keys['s'] || keys['S'] || keys['ArrowDown'];
    var lt = keys['a'] || keys['A'] || keys['ArrowLeft'];
    var rt = keys['d'] || keys['D'] || keys['ArrowRight'];

    var dx = 0, dz = 0;
    if (fw) dz -= 1;
    if (bk) dz += 1;
    if (lt) dx -= 1;
    if (rt) dx += 1;

    var sinY = Math.sin(yaw), cosY = Math.cos(yaw);
    var mx = (dx * cosY - dz * sinY) * speed * delta;
    var mz = (dx * sinY + dz * cosY) * speed * delta;

    // turbulence sway
    if (turbulenceActive) {
      mx += Math.sin(Date.now() * 0.01) * 0.05;
      mz += Math.cos(Date.now() * 0.009) * 0.05;
    }

    playerPos.x = clamp(playerPos.x + mx, -4, 4);
    playerPos.z = clamp(playerPos.z + mz, -42, 42);
    playerPos.y = -3.0; // walking on floor

    camera.position.set(playerPos.x, playerPos.y + 1.7, playerPos.z);

    // check near cockpit
    nearCockpit = (playerPos.z < -32);

    // check near parachute locker
    if (!parachutePickedUp && !hasParachute) {
      var pdist = dist3(playerPos, { x: -3.5, y: -3.8, z: 32 });
      if (pdist < 2.0) {
        hasParachute = true;
        parachutePickedUp = true;
        if (parachuteMesh) parachuteMesh.visible = false;
        showMsg('PARACHUTE EQUIPPED', '#ffff00');
      }
    }

    // check on ramp / rear
    isOnRamp = (playerPos.z > 36);
  }

  // ── shooting ───────────────────────────────────────────────────────────────
  function handleCombat(delta, keys) {
    if (isDead || gameOver) return;

    shootCooldown = Math.max(0, shootCooldown - delta);
    meleeCooldown = Math.max(0, meleeCooldown - delta);

    // shoot
    if (lastMouseDown && shootCooldown <= 0) {
      shootCooldown = 0.3;
      lastMouseDown = false;
      doShoot();
    }
    lastMouseDown = false;

    // melee
    var fKey = keys['f'] || keys['F'];
    if (fKey && !meleePressLast && meleeCooldown <= 0) {
      meleeCooldown = 0.6;
      doMelee();
    }
    meleePressLast = !!(keys['f'] || keys['F']);
  }

  function doShoot() {
    var range = 25;
    var hit = null;
    var hitDist = Infinity;

    // raycast direction from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(camera.rotation);

    for (var i = 0; i < hijackers.length; i++) {
      var h = hijackers[i];
      if (!h.alive) continue;
      if (h.isPilot) continue; // can't shoot pilot

      var wpos = new THREE.Vector3();
      h.mesh.getWorldPosition(wpos);
      var d = dist3(playerPos, { x: wpos.x, y: wpos.y, z: wpos.z });
      if (d > range) continue;

      // rough angle check
      var toEnemy = new THREE.Vector3(wpos.x - playerPos.x, 0, wpos.z - playerPos.z).normalize();
      var camDir2 = new THREE.Vector3(dir.x, 0, dir.z).normalize();
      var dot = camDir2.dot(toEnemy);
      if (dot > 0.8 && d < hitDist) {
        hitDist = d;
        hit = h;
      }
    }

    if (hit) {
      hit.hp -= 25;
      if (hit.hp <= 0) killHijacker(hit);
    }
  }

  function doMelee() {
    var range = 2.5;

    // melee pilot (knock out only)
    if (pilot && pilot.alive && !pilotCaptured) {
      var ppos = new THREE.Vector3();
      pilot.mesh.getWorldPosition(ppos);
      var pd = dist3(playerPos, { x: ppos.x, y: ppos.y, z: ppos.z });
      if (pd < range) {
        pilot.hp -= 40;
        if (pilot.hp <= 0) {
          pilotCaptured = true;
          pilot.alive = false;
          pilot.mesh.material.color.setHex(0x228822);
          pilot.mesh.position.y -= 0.8;
          showMsg('PILOT KNOCKED OUT - CAPTURED!', '#00ff88');
        }
        return;
      }
    }

    // melee hijackers
    for (var i = 0; i < hijackers.length; i++) {
      var h = hijackers[i];
      if (!h.alive) continue;
      var wpos = new THREE.Vector3();
      h.mesh.getWorldPosition(wpos);
      var d = dist3(playerPos, { x: wpos.x, y: wpos.y, z: wpos.z });
      if (d < range) {
        h.hp -= 45;
        // check if near ramp — push off
        if (wpos.z > 34) {
          killHijacker(h);
          showMsg('HIJACKER THROWN OFF RAMP!', '#ff8800');
        } else if (h.hp <= 0) {
          killHijacker(h);
        }
      }
    }
  }

  function killHijacker(h) {
    h.alive = false;
    h.mesh.visible = false;
    // drop carried canister
    if (h.canisterTarget !== null) {
      var can = canisters[h.canisterTarget];
      if (can && can.beingCarried) {
        can.beingCarried = false;
        can.carrier = null;
        h.canisterTarget = null;
      }
    }
  }

  // ── hijacker AI ───────────────────────────────────────────────────────────
  function updateHijackers(delta) {
    var aliveCount = hijackers.filter(function(h){ return h.alive; }).length;

    for (var i = 0; i < hijackers.length; i++) {
      var h = hijackers[i];
      if (!h.alive) continue;

      var hp = h.mesh.position;

      // canister-carrying behaviour: move canister toward rear ramp
      if (h.canisterTarget !== null) {
        var can = canisters[h.canisterTarget];
        if (!can || can.secured || can.lost) {
          h.canisterTarget = null;
          continue;
        }
        can.beingCarried = true;
        can.carrier = i;
        // move toward ramp
        var targetZ = 42;
        var spd = turbulenceActive ? 0.8 : 1.5;
        if (hp.z < targetZ) hp.z += spd * delta;
        can.mesh.position.set(hp.x, hp.y + 1.5, hp.z);
        can.light.position.set(hp.x, hp.y + 1.5, hp.z);

        // reached ramp — canister lost
        if (hp.z >= 42) {
          can.lost = true;
          can.beingCarried = false;
          can.mesh.visible = false;
          can.light.visible = false;
          canistersLost++;
          h.canisterTarget = null;
          showMsg('CANISTER LOST OFF RAMP!', '#ff0000');
          checkLoseConditions();
        }
        continue;
      }

      // assign hijacker to carry unsecured canister (not already being carried)
      if (Math.random() < 0.002) {
        for (var ci = 0; ci < canisters.length; ci++) {
          var c = canisters[ci];
          if (!c.secured && !c.lost && !c.beingCarried) {
            h.canisterTarget = ci;
            break;
          }
        }
      }

      // patrol
      h.patrolTimer -= delta;
      if (h.patrolTimer <= 0) {
        h.patrolDir = (Math.random() > 0.5 ? 1 : -1);
        h.patrolTimer = rnd(2, 5);
      }

      var newZ = hp.z + h.patrolDir * 2.0 * delta;
      newZ = clamp(newZ, -32, 40);
      hp.z = newZ;

      // attack player if close
      var wpos = new THREE.Vector3();
      h.mesh.getWorldPosition(wpos);
      var d = dist3(playerPos, { x: wpos.x, y: wpos.y, z: wpos.z });
      if (d < 2.5) {
        h.alertTimer += delta;
        if (h.alertTimer > 1.0) {
          playerHP -= 5;
          h.alertTimer = 0;
          if (playerHP <= 0) killPlayer();
        }
      } else {
        h.alertTimer = 0;
      }

      // push player off ramp if player is near rear
      if (isOnRamp && d < 3.0) {
        if (!hasParachute) {
          // chance to push player off
          if (Math.random() < 0.01) {
            killPlayer(true);
          }
        }
      }
    }
  }

  // ── canister interception (player picks up) ───────────────────────────────
  function checkCanisterPickup(keys) {
    if (isDead || gameOver) return;
    var eKey = keys['e'] || keys['E'];
    if (!eKey) return;

    for (var ci = 0; ci < canisters.length; ci++) {
      var c = canisters[ci];
      if (c.secured || c.lost) continue;
      var cpos = c.mesh.position;
      var d = dist3(playerPos, { x: cpos.x, y: cpos.y, z: cpos.z });
      if (d < 2.5) {
        // intercept
        c.secured = true;
        c.beingCarried = false;
        if (c.carrier !== null) {
          var hc = hijackers[c.carrier];
          if (hc) hc.canisterTarget = null;
          c.carrier = null;
        }
        c.mesh.material.color.setHex(0x00ff00);
        c.light.color.setHex(0x00ff00);
        canistersSecured++;
        showMsg('CANISTER SECURED! (' + canistersSecured + '/4)', '#00ff88');
        checkWinCondition();
        return; // only one at a time
      }
    }
  }

  // ── cockpit controls (E hold) ─────────────────────────────────────────────
  function handleCockpit(delta, keys) {
    if (isDead || gameOver) return;
    if (!nearCockpit) {
      isStabilizing = false;
      isHacking = false;
      eHoldTimer = 0;
      stabilizeProgress = 0;
      hackTimer = 0;
      cockpitHackProgress = 0;
      return;
    }

    var eKey = keys['e'] || keys['E'];

    if (eKey) {
      if (pilotCaptured) {
        // stabilize flight
        isStabilizing = true;
        stabilizeTimer += delta;
        stabilizeProgress = (stabilizeTimer / 10) * 100;
        if (stabilizeTimer >= 10) {
          stabilizeTimer = 0;
          stabilizeProgress = 0;
          isStabilizing = false;
          flightStatus = 'STABLE';
          planeTiltZ = 0;
          planeGroup.rotation.z = 0;
          showMsg('FLIGHT STABILIZED!', '#00ff88');
          checkWinCondition();
        }
      } else {
        // hack instrument panel (15s)
        isHacking = true;
        hackTimer += delta;
        cockpitHackProgress = (hackTimer / 15) * 100;
        if (hackTimer >= 15) {
          hackTimer = 0;
          cockpitHackProgress = 0;
          isHacking = false;
          flightStatus = 'STABLE';
          planeTiltZ = 0;
          planeGroup.rotation.z = 0;
          showMsg('PANEL HACKED - FLIGHT STABILIZED!', '#00ff88');
          checkWinCondition();
        }
      }
    } else {
      isStabilizing = false;
      isHacking = false;
      if (!pilotCaptured) {
        hackTimer = Math.max(0, hackTimer - delta * 0.5);
        cockpitHackProgress = (hackTimer / 15) * 100;
      } else {
        stabilizeTimer = Math.max(0, stabilizeTimer - delta * 0.5);
        stabilizeProgress = (stabilizeTimer / 10) * 100;
      }
    }
  }

  // ── plane tilt progression ────────────────────────────────────────────────
  function updatePlaneTilt(delta) {
    if (flightStatus === 'STABLE') return;

    tiltTimer += delta;
    if (tiltTimer >= 30) {
      tiltTimer = 0;
      planeTiltZ += 0.05;
      planeTiltZ = Math.min(planeTiltZ, 0.6);
      showMsg('AUTOPILOT DEGRADING - TILT INCREASING!', '#ff4400');
    }

    planeGroup.rotation.z = planeTiltZ;
    // also pitch nose down slightly as time runs out
    var pitchAngle = (480 - crashTimer) / 480 * 0.15;
    planeGroup.rotation.x = -pitchAngle;
  }

  // ── turbulence ─────────────────────────────────────────────────────────────
  function updateTurbulence(delta) {
    if (turbulenceActive) {
      turbulenceDuration -= delta;
      if (turbulenceDuration <= 0) {
        turbulenceActive = false;
        turbulenceNext = rnd(20, 45);
      }
      // slide cargo
      for (var i = 0; i < cargoBoxMeshes.length; i++) {
        var box = cargoBoxMeshes[i];
        box.position.x += Math.sin(Date.now() * 0.003 + i) * 0.02;
        box.position.x = clamp(box.position.x, -4, 4);
      }
    } else {
      turbulenceNext -= delta;
      if (turbulenceNext <= 0) {
        turbulenceActive = true;
        turbulenceDuration = 5;
        showMsg('TURBULENCE!', '#ffaa00');
      }
    }
  }

  // ── crash timer ───────────────────────────────────────────────────────────
  function updateCrashTimer(delta) {
    if (flightStatus === 'STABLE' || gameOver) return;
    crashTimer -= delta;
    if (crashTimer <= 0) {
      crashTimer = 0;
      triggerLose('PLANE CRASHED INTO CITY - MISSION FAILED');
    }
  }

  // ── win / lose ─────────────────────────────────────────────────────────────
  function checkWinCondition() {
    if (canistersSecured === 4 && flightStatus === 'STABLE') {
      gameOver = true;
      gameWon = true;
      showMsg('MISSION COMPLETE! ALL CANISTERS SECURED + FLIGHT STABILIZED', '#00ff88');
    }
  }

  function checkLoseConditions() {
    if (canistersLost >= 3) {
      triggerLose('3 CANISTERS LOST - BIOWEAPONS DEPLOYED - MISSION FAILED');
    }
  }

  function triggerLose(msg) {
    if (gameOver) return;
    gameOver = true;
    gameWon = false;
    showMsg(msg, '#ff0000');
  }

  function killPlayer(pushedOff) {
    if (isDead) return;
    if (pushedOff && hasParachute) {
      // bail out ending — survive but mission fails
      isDead = true;
      triggerLose('PUSHED OFF PLANE - PARACHUTE DEPLOYED - MISSION ABANDONED');
      return;
    }
    playerHP = 0;
    isDead = true;
    triggerLose('YOU DIED - MISSION FAILED');
  }

  // ── init ───────────────────────────────────────────────────────────────────
  function init(sc, cam, rend) {
    scene = sc;
    camera = cam;
    renderer = rend;

    clock = new THREE.Clock();

    buildPlane();
    spawnHijackers();
    spawnCanisters();
    buildHUD();

    // position camera inside fuselage at rear
    camera.position.set(0, -1.3, 30);
    camera.rotation.order = 'YXZ';
  }

  // ── update ─────────────────────────────────────────────────────────────────
  function update(delta, keys) {
    if (!scene) return;

    keys = keys || {};

    // activation check (always runs)
    if (!activated) {
      tryActivate(keys);
      return;
    }

    if (gameOver) {
      updateHUD();
      return;
    }

    // game logic
    movePlayer(delta, keys);
    handleCombat(delta, keys);
    checkCanisterPickup(keys);
    handleCockpit(delta, keys);
    updateHijackers(delta);
    updatePlaneTilt(delta);
    updateTurbulence(delta);
    updateCrashTimer(delta);
    updateHUD();
  }

  // ── reset ──────────────────────────────────────────────────────────────────
  function reset() {
    activated = false;
    cKeyTime = 0;
    pKeyTime = 0;

    playerHP = 100;
    playerPos = { x: 0, y: 0, z: 30 };
    playerVel = { x: 0, y: 0, z: 0 };
    yaw = 0;
    pitch = 0;
    hasParachute = false;
    isDead = false;
    isOnRamp = false;

    planeTiltZ = 0;
    tiltTimer = 0;
    crashTimer = 480;
    flightStatus = 'CRITICAL';
    stabilizeProgress = 0;
    isStabilizing = false;
    stabilizeTimer = 0;
    cockpitHackProgress = 0;
    isHacking = false;
    hackTimer = 0;

    pilotCaptured = false;

    canistersSecured = 0;
    canistersLost = 0;

    turbulenceTimer = 0;
    turbulenceActive = false;
    turbulenceDuration = 0;
    turbulenceNext = 30;

    shootCooldown = 0;
    meleeCooldown = 0;
    lastMouseDown = false;
    meleePressLast = false;

    eHoldTimer = 0;
    nearCockpit = false;

    gameOver = false;
    gameWon = false;

    pointerLocked = false;
    mouseDX = 0;
    mouseDY = 0;

    parachutePickedUp = false;

    // remove plane group
    if (planeGroup && scene) {
      scene.remove(planeGroup);
      planeGroup = null;
    }
    fuselageMesh = null;
    rampMesh = null;
    cockpitMesh = null;
    parachuteMesh = null;
    cargoBoxMeshes = [];
    hijackers = [];
    pilot = null;
    canisters = [];

    // remove HUD
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }
  }

  return { init: init, update: update, reset: reset };
})();
