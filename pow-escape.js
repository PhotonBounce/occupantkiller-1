/* ───────────────────────────────────────────────────────────────────────────
   POW ESCAPE — prisoner-of-war camp breakout scenario
   Keys: P+W together to start. Stealth, items, 3 escape routes, guard patrols.
   ─────────────────────────────────────────────────────────────────────────── */
window.POWEscape = (function () {
  'use strict';

  // ── Module state ────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var playerRef = null;
  var campGroup = null;

  var active = false;
  var keys = {};
  var prevP = false;
  var prevW = false;

  // Items
  var wireCuttersMesh = null;
  var wireCuttersPickedUp = false;
  var disguiseMesh = null;
  var disguisePickedUp = false;
  var pistolMesh = null;
  var pistolPickedUp = false;
  var forgedPapersMesh = null;
  var forgedPapersPickedUp = false;
  var pistolAmmo = 8;
  var wearingDisguise = false;

  // Escape routes
  var fenceCut = false;
  var fenceMesh = null;
  var tunnelFound = false;
  var tunnelHatchIn = null;
  var tunnelHatchOut = null;
  var inTunnel = false;
  var tunnelProgress = 0;
  var escapeRoute = 'UNDECIDED';
  var escaped = false;
  var recaptured = false;

  // Alarm
  var alarmActive = false;
  var alarmTimer = 0;
  var ALARM_DURATION = 20;

  // Score
  var score = 0;
  var companionsEscaped = 0;

  // Commandant safe
  var safeObj = null;
  var combinationClue = null;
  var hasCombClue = false;
  var safeCracked = false;
  var crackHoldTimer = 0;
  var CRACK_HOLD_TIME = 3;

  // Guards
  var guards = [];
  var GUARD_PATROL = 0;
  var GUARD_SUSPICIOUS = 1;
  var GUARD_ALERT = 2;
  var SIGHT_RANGE = 20;

  // Fellow POWs
  var companions = [];

  // Camp origin
  var OX = 0;
  var OZ = 0;

  // Interaction key previous states
  var prevF = false;
  var prevT = false;
  var prevR = false;
  var prevC = false;
  var prevShoot = false;

  // HUD elements
  var hudEl = null;
  var toastEl = null;
  var toastTimer = 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function vecDist(a, b) {
    return dist2D(a.x, a.z, b.x, b.z);
  }

  function makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function showToast(msg, duration) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    toastTimer = duration || 3;
  }

  function getPlayerPos() {
    if (playerRef && playerRef.position) return playerRef.position;
    if (camera) return camera.position;
    return new THREE.Vector3(0, 0, 0);
  }

  // ── Build camp geometry ──────────────────────────────────────────────────────

  function buildCamp() {
    campGroup = new THREE.Group();
    campGroup.position.set(OX, 0, OZ);
    scene.add(campGroup);

    buildGround();
    buildFence();
    buildGuardTowers();
    buildBarracks();
    buildCommandantOffice();
    buildMotorPool();
    buildGate();
    buildItems();
    buildSafe();
    buildTunnelHatches();
    buildCompanions();
  }

  function buildGround() {
    var geo = new THREE.PlaneGeometry(50, 50);
    var mat = new THREE.MeshLambertMaterial({ color: 0x5A4A2A });
    var ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    campGroup.add(ground);
  }

  function buildFence() {
    var pts = [];
    var half = 25;
    var step = 2;
    var i;

    // North side (z = -half)
    for (i = -half; i <= half - step; i += step) {
      pts.push(i, 0, -half,  i, 3, -half);
      pts.push(i, 3, -half,  i + step, 3, -half);
      pts.push(i + step, 3, -half,  i + step, 0, -half);
    }
    // South side (z = +half)
    for (i = -half; i <= half - step; i += step) {
      pts.push(i, 0, half,  i, 3, half);
      pts.push(i, 3, half,  i + step, 3, half);
      pts.push(i + step, 3, half,  i + step, 0, half);
    }
    // West side (x = -half)
    for (i = -half; i <= half - step; i += step) {
      pts.push(-half, 0, i,  -half, 3, i);
      pts.push(-half, 3, i,  -half, 3, i + step);
      pts.push(-half, 3, i + step,  -half, 0, i + step);
    }
    // East side (x = +half)
    for (i = -half; i <= half - step; i += step) {
      pts.push(half, 0, i,  half, 3, i);
      pts.push(half, 3, i,  half, 3, i + step);
      pts.push(half, 3, i + step,  half, 0, i + step);
    }

    var buf = new THREE.BufferGeometry();
    buf.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var fmat = new THREE.LineBasicMaterial({ color: 0x886644 });
    fenceMesh = new THREE.LineSegments(buf, fmat);
    campGroup.add(fenceMesh);
  }

  function buildGuardTowers() {
    var corners = [[-25, -25], [25, -25], [-25, 25], [25, 25]];
    var i;
    for (i = 0; i < corners.length; i++) {
      buildTower(corners[i][0], corners[i][1]);
    }
  }

  function buildTower(cx, cz) {
    var g = new THREE.Group();
    g.position.set(cx, 0, cz);
    campGroup.add(g);

    var cyl = makeMesh(
      new THREE.CylinderGeometry(0.5, 0.5, 10, 8),
      makeMat(0x7A6A50)
    );
    cyl.position.y = 5;
    g.add(cyl);

    var platform = makeMesh(
      new THREE.BoxGeometry(3, 0.4, 3),
      makeMat(0x8A7A60)
    );
    platform.position.y = 10.2;
    g.add(platform);

    var rPos = [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]];
    var j;
    for (j = 0; j < rPos.length; j++) {
      var rail = makeMesh(
        new THREE.BoxGeometry(0.1, 0.8, 0.1),
        makeMat(0x6A5A40)
      );
      rail.position.set(rPos[j][0], 10.8, rPos[j][1]);
      g.add(rail);
    }
  }

  function buildBarracks() {
    var positions = [[-8, -10], [0, -10], [8, -10]];
    var i;
    for (i = 0; i < positions.length; i++) {
      var b = makeMesh(
        new THREE.BoxGeometry(8, 3, 4),
        makeMat(0x7A6A50)
      );
      b.position.set(positions[i][0], 1.5, positions[i][1]);
      campGroup.add(b);
    }
  }

  function buildCommandantOffice() {
    var office = makeMesh(
      new THREE.BoxGeometry(5, 4, 5),
      makeMat(0x556644)
    );
    office.position.set(0, 2, 8);
    campGroup.add(office);
  }

  function buildMotorPool() {
    var v1 = makeMesh(
      new THREE.BoxGeometry(4, 1.5, 2),
      makeMat(0x556644)
    );
    v1.position.set(-10, 0.75, 12);
    campGroup.add(v1);

    var v2 = makeMesh(
      new THREE.BoxGeometry(4, 1.5, 2),
      makeMat(0x556644)
    );
    v2.position.set(-10, 0.75, 16);
    campGroup.add(v2);

    var cab1 = makeMesh(
      new THREE.BoxGeometry(1.5, 1, 2),
      makeMat(0x445533)
    );
    cab1.position.set(-11.25, 1.75, 12);
    campGroup.add(cab1);

    var cab2 = makeMesh(
      new THREE.BoxGeometry(1.5, 1, 2),
      makeMat(0x445533)
    );
    cab2.position.set(-11.25, 1.75, 16);
    campGroup.add(cab2);
  }

  function buildGate() {
    var p1 = makeMesh(
      new THREE.BoxGeometry(0.4, 4, 0.4),
      makeMat(0x886644)
    );
    p1.position.set(-2, 2, 25);
    campGroup.add(p1);

    var p2 = makeMesh(
      new THREE.BoxGeometry(0.4, 4, 0.4),
      makeMat(0x886644)
    );
    p2.position.set(2, 2, 25);
    campGroup.add(p2);

    var bar = makeMesh(
      new THREE.BoxGeometry(4.4, 0.3, 0.3),
      makeMat(0x886644)
    );
    bar.position.set(0, 4, 25);
    campGroup.add(bar);

    // Checkpoint marker
    var chk = makeMesh(
      new THREE.BoxGeometry(4, 0.05, 2),
      new THREE.MeshLambertMaterial({ color: 0xFFAA00, transparent: true, opacity: 0.5 })
    );
    chk.position.set(0, 0.03, 23);
    campGroup.add(chk);
  }

  function buildItems() {
    wireCuttersMesh = makeMesh(
      new THREE.BoxGeometry(0.3, 0.1, 0.5),
      makeMat(0x888888)
    );
    wireCuttersMesh.position.set(-8, 0.05, -10);
    campGroup.add(wireCuttersMesh);

    disguiseMesh = makeMesh(
      new THREE.BoxGeometry(0.4, 1.2, 0.1),
      makeMat(0x4A6A2A)
    );
    disguiseMesh.position.set(0, 0.6, -10);
    campGroup.add(disguiseMesh);

    pistolMesh = makeMesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.4),
      makeMat(0x333333)
    );
    pistolMesh.position.set(8, 0.075, -10);
    campGroup.add(pistolMesh);

    forgedPapersMesh = makeMesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.02),
      makeMat(0xEEDDAA)
    );
    forgedPapersMesh.position.set(7.5, 0.01, -11);
    campGroup.add(forgedPapersMesh);

    combinationClue = makeMesh(
      new THREE.BoxGeometry(0.3, 0.01, 0.2),
      makeMat(0xFFFFCC)
    );
    combinationClue.position.set(1.5, 4.01, 8);
    campGroup.add(combinationClue);
  }

  function buildSafe() {
    safeObj = makeMesh(
      new THREE.BoxGeometry(1, 1, 0.8),
      makeMat(0x333333)
    );
    safeObj.position.set(-1, 2.5, 8);
    campGroup.add(safeObj);
  }

  function buildTunnelHatches() {
    tunnelHatchIn = makeMesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      makeMat(0x5A4A30)
    );
    tunnelHatchIn.position.set(0, 0.05, -10);
    campGroup.add(tunnelHatchIn);

    tunnelHatchOut = makeMesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      makeMat(0x5A4A30)
    );
    tunnelHatchOut.position.set(0, 0.05, -40);
    campGroup.add(tunnelHatchOut);
  }

  function buildCompanions() {
    companions.push(makeCompanion(-5, -8));
    companions.push(makeCompanion(5, -8));
  }

  function makeCompanion(cx, cz) {
    var g = new THREE.Group();
    g.position.set(cx, 0, cz);
    campGroup.add(g);

    var body = makeMesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8),
      makeMat(0xCC8844)
    );
    body.position.y = 0.8;
    g.add(body);

    var head = makeMesh(
      new THREE.SphereGeometry(0.25, 8, 6),
      makeMat(0xCC8844)
    );
    head.position.y = 1.85;
    g.add(head);

    return {
      group: g,
      recruited: false,
      escaped: false,
      homeX: cx + OX,
      homeZ: cz + OZ
    };
  }

  // ── Guards ───────────────────────────────────────────────────────────────────

  function buildGuards() {
    var routes = [
      [[-20,0,-22],[0,0,-22],[20,0,-22],[20,0,-18],[-20,0,-18]],
      [[22,0,-20],[22,0,0],[22,0,20],[18,0,20],[18,0,-20]],
      [[-20,0,22],[0,0,22],[20,0,22],[20,0,18],[-20,0,18]],
      [[-22,0,-20],[-22,0,0],[-22,0,20],[-18,0,20],[-18,0,-20]],
      [[-8,0,-14],[8,0,-14],[8,0,-6],[-8,0,-6]],
      [[-4,0,4],[4,0,4],[4,0,12],[-4,0,12]],
      [[-14,0,10],[-6,0,10],[-6,0,18],[-14,0,18]],
      [[-3,0,20],[3,0,20],[3,0,24],[-3,0,24]]
    ];
    var i;
    for (i = 0; i < routes.length; i++) {
      guards.push(makeGuard(routes[i]));
    }
  }

  function makeGuard(waypoints) {
    var wps = [];
    var j;
    for (j = 0; j < waypoints.length; j++) {
      wps.push(new THREE.Vector3(
        waypoints[j][0] + OX,
        waypoints[j][1],
        waypoints[j][2] + OZ
      ));
    }

    var g = new THREE.Group();
    g.position.copy(wps[0]);
    scene.add(g);

    var body = makeMesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8),
      makeMat(0x4A6A2A)
    );
    body.position.y = 0.8;
    g.add(body);

    var head = makeMesh(
      new THREE.SphereGeometry(0.25, 8, 6),
      makeMat(0xD4A882)
    );
    head.position.y = 1.85;
    g.add(head);

    var dotMat = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    var dot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), dotMat);
    dot.position.y = 2.4;
    g.add(dot);

    return {
      group: g,
      waypoints: wps,
      wpIdx: 0,
      state: GUARD_PATROL,
      dot: dot,
      dotMat: dotMat,
      suspTimer: 0,
      speed: 3,
      dead: false,
      facingAngle: 0
    };
  }

  function guardCanSeePlayer(guard) {
    if (guard.dead) return false;
    var pPos = getPlayerPos();
    var gPos = guard.group.position;
    var dx = pPos.x - gPos.x;
    var dz = pPos.z - gPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > SIGHT_RANGE) return false;

    var angleToPlayer = Math.atan2(dx, dz);
    var angleDiff = angleToPlayer - guard.facingAngle;
    while (angleDiff > Math.PI) { angleDiff -= Math.PI * 2; }
    while (angleDiff < -Math.PI) { angleDiff += Math.PI * 2; }
    if (Math.abs(angleDiff) > Math.PI * 0.33) return false;

    if (wearingDisguise && dist > 3) return false;

    return true;
  }

  function updateGuard(guard, dt) {
    if (guard.dead) return;

    var pPos = getPlayerPos();
    var sees = guardCanSeePlayer(guard);

    if (guard.state === GUARD_PATROL) {
      if (sees) {
        guard.state = GUARD_SUSPICIOUS;
        guard.suspTimer = 2;
        showToast('Guard is suspicious!', 2);
      }
    } else if (guard.state === GUARD_SUSPICIOUS) {
      guard.suspTimer -= dt;
      if (!sees) {
        guard.state = GUARD_PATROL;
      } else if (guard.suspTimer <= 0) {
        guard.state = GUARD_ALERT;
        triggerAlarm();
      }
    } else if (guard.state === GUARD_ALERT) {
      if (!alarmActive) {
        guard.state = GUARD_PATROL;
      }
    }

    if (guard.state === GUARD_PATROL) {
      guard.dotMat.color.setHex(0x00FF00);
    } else if (guard.state === GUARD_SUSPICIOUS) {
      guard.dotMat.color.setHex(0xFFFF00);
    } else {
      guard.dotMat.color.setHex(0xFF0000);
    }

    if (guard.state === GUARD_ALERT) {
      var adx = pPos.x - guard.group.position.x;
      var adz = pPos.z - guard.group.position.z;
      var ad = Math.sqrt(adx * adx + adz * adz);
      if (ad > 0.5) {
        var spd = guard.speed * 1.5;
        guard.group.position.x += (adx / ad) * spd * dt;
        guard.group.position.z += (adz / ad) * spd * dt;
        guard.facingAngle = Math.atan2(adx, adz);
      }
    } else if (guard.state === GUARD_SUSPICIOUS) {
      var sdx = pPos.x - guard.group.position.x;
      var sdz = pPos.z - guard.group.position.z;
      guard.facingAngle = Math.atan2(sdx, sdz);
    } else {
      var target = guard.waypoints[guard.wpIdx];
      var pdx = target.x - guard.group.position.x;
      var pdz = target.z - guard.group.position.z;
      var pd = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pd < 0.5) {
        guard.wpIdx = (guard.wpIdx + 1) % guard.waypoints.length;
      } else {
        guard.group.position.x += (pdx / pd) * guard.speed * dt;
        guard.group.position.z += (pdz / pd) * guard.speed * dt;
        guard.facingAngle = Math.atan2(pdx, pdz);
      }
    }

    guard.group.rotation.y = guard.facingAngle;

    if (!escaped && !recaptured) {
      var capDist = vecDist(guard.group.position, pPos);
      if (guard.state === GUARD_ALERT && capDist < 1.5) {
        doRecapture();
      }
    }
  }

  function triggerAlarm() {
    if (alarmActive) return;
    alarmActive = true;
    alarmTimer = ALARM_DURATION;
    showToast('ALARM TRIGGERED! ESCAPE IN ' + ALARM_DURATION + 's!', 4);
    var i;
    for (i = 0; i < guards.length; i++) {
      guards[i].state = GUARD_ALERT;
    }
  }

  function doRecapture() {
    recaptured = true;
    showToast('RECAPTURED! Mission failed. Restarting...', 4);
    score = Math.max(0, score - 200);
    setTimeout(function () { resetToBarracks(); }, 4000);
  }

  function resetToBarracks() {
    if (!active) return;
    var pPos = getPlayerPos();
    pPos.set(OX + 0, 1, OZ - 8);
    alarmActive = false;
    alarmTimer = 0;
    recaptured = false;
    var i;
    for (i = 0; i < guards.length; i++) {
      guards[i].state = GUARD_PATROL;
    }
    showToast('Back in barracks. Try again.', 3);
  }

  // ── Companions ───────────────────────────────────────────────────────────────

  function updateCompanions(dt) {
    var pPos = getPlayerPos();
    var i;
    for (i = 0; i < companions.length; i++) {
      var c = companions[i];
      if (c.escaped) continue;
      if (!c.recruited) {
        c.group.position.x += Math.sin(Date.now() * 0.0005 + i) * 0.005;
        c.group.position.z += Math.cos(Date.now() * 0.0004 + i) * 0.005;
        continue;
      }
      var tx = pPos.x + (i === 0 ? -1.5 : 1.5);
      var tz = pPos.z + 1.5;
      var cdx = tx - c.group.position.x;
      var cdz = tz - c.group.position.z;
      var cd = Math.sqrt(cdx * cdx + cdz * cdz);
      if (cd > 0.3) {
        c.group.position.x += (cdx / cd) * 4 * dt;
        c.group.position.z += (cdz / cd) * 4 * dt;
      }
      if (escaped && !c.escaped) {
        c.escaped = true;
        companionsEscaped++;
        score += 150;
      }
    }
  }

  // ── Interactions ─────────────────────────────────────────────────────────────

  function handleInteractions(dt) {
    var pPos = getPlayerPos();
    var fKey = keys['f'] || keys['F'];
    var tKey = keys['t'] || keys['T'];
    var rKey = keys['r'] || keys['R'];
    var cKey = keys['c'] || keys['C'];
    var shootKey = keys[' '] || keys['q'] || keys['Q'];

    var fJust = fKey && !prevF;
    var tJust = tKey && !prevT;
    var rJust = rKey && !prevR;
    var shootJust = shootKey && !prevShoot;

    prevF = fKey;
    prevT = tKey;
    prevR = rKey;
    prevC = cKey;
    prevShoot = shootKey;

    var lx = pPos.x - OX;
    var lz = pPos.z - OZ;

    if (fJust) {
      tryPickupItems(lx, lz);
      // Cut fence on east side
      if (wireCuttersPickedUp && !fenceCut && Math.abs(lx - 25) < 3 && Math.abs(lz) < 10) {
        cutFence();
      }
    }

    if (tJust) {
      handleTunnelKey(lx, lz);
    }

    if (rJust) {
      tryRecruit(pPos);
    }

    if (cKey && hasCombClue && safeObj && !safeCracked) {
      if (dist2D(lx, lz, -1, 8) < 2) {
        crackHoldTimer += dt;
        if (crackHoldTimer >= CRACK_HOLD_TIME) {
          safeCracked = true;
          score += 500;
          showToast('+500 INTEL from commandant safe!', 3);
          safeObj.material.color.setHex(0x00FF88);
        }
      } else {
        crackHoldTimer = 0;
      }
    } else {
      crackHoldTimer = 0;
    }

    if (shootJust && pistolPickedUp && pistolAmmo > 0) {
      tryShootGuard(pPos);
    }

    if (!escaped) {
      checkGateEscape(lx, lz);
    }

    if (inTunnel) {
      updateTunnel(dt, pPos);
    }

    if (!escaped && fenceCut && lx > 25 && Math.abs(lz) < 4) {
      doEscape('CUT FENCE', pPos);
    }
  }

  function tryPickupItems(lx, lz) {
    if (!wireCuttersPickedUp && wireCuttersMesh && dist2D(lx, lz, -8, -10) < 2) {
      wireCuttersPickedUp = true;
      campGroup.remove(wireCuttersMesh);
      wireCuttersMesh = null;
      showToast('Picked up WIRE CUTTERS! [Go east fence + F to cut]', 3);
      return;
    }
    if (!disguisePickedUp && disguiseMesh && dist2D(lx, lz, 0, -10) < 2) {
      disguisePickedUp = true;
      wearingDisguise = true;
      campGroup.remove(disguiseMesh);
      disguiseMesh = null;
      showToast('Wearing GUARD DISGUISE! Guards less suspicious.', 3);
      return;
    }
    if (!pistolPickedUp && pistolMesh && dist2D(lx, lz, 8, -10) < 2) {
      pistolPickedUp = true;
      campGroup.remove(pistolMesh);
      pistolMesh = null;
      showToast('Picked up PISTOL (8 rounds)! [Space/Q to shoot]', 3);
      return;
    }
    if (!forgedPapersPickedUp && forgedPapersMesh && dist2D(lx, lz, 7.5, -11) < 2) {
      forgedPapersPickedUp = true;
      campGroup.remove(forgedPapersMesh);
      forgedPapersMesh = null;
      showToast('Picked up FORGED PAPERS! [Use at main gate with disguise]', 3);
      return;
    }
    if (!hasCombClue && combinationClue && dist2D(lx, lz, 1.5, 8) < 2) {
      hasCombClue = true;
      campGroup.remove(combinationClue);
      combinationClue = null;
      showToast('Found COMBINATION CLUE! [Hold C near safe to crack it]', 3);
    }
  }

  function cutFence() {
    fenceCut = true;
    if (fenceMesh) {
      fenceMesh.material.color.setHex(0xFF4400);
    }
    var gapMarker = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.3 })
    );
    gapMarker.position.set(25, 1.5, 0);
    campGroup.add(gapMarker);
    escapeRoute = 'CUT FENCE';
    showToast('FENCE CUT! East side passage open! Run east!', 4);
  }

  function handleTunnelKey(lx, lz) {
    if (!inTunnel) {
      if (dist2D(lx, lz, 0, -10) < 1.5) {
        if (!tunnelFound) {
          tunnelFound = true;
          showToast('Found TUNNEL ENTRANCE! Press T again to enter.', 3);
        } else {
          inTunnel = true;
          tunnelProgress = 0;
          escapeRoute = 'TUNNEL';
          showToast('Entering tunnel... crawling north...', 3);
        }
      }
    } else {
      if (tunnelProgress >= 15) {
        inTunnel = false;
        var pPos = getPlayerPos();
        pPos.set(OX + 0, 1, OZ - 40);
        showToast('Tunnel exit! You are outside the camp!', 3);
        doEscape('TUNNEL', pPos);
      }
    }
  }

  function updateTunnel(dt, pPos) {
    tunnelProgress += 2 * dt;
    pPos.z = OZ - 10 - tunnelProgress;
    pPos.y = 0.2;
    if (tunnelProgress >= 15) {
      inTunnel = false;
      pPos.y = 1;
      showToast('Emerged outside the fence! RUN!', 3);
      doEscape('TUNNEL', pPos);
    }
  }

  function tryRecruit(pPos) {
    var i;
    for (i = 0; i < companions.length; i++) {
      var c = companions[i];
      if (c.recruited || c.escaped) continue;
      if (vecDist(c.group.position, pPos) < 2) {
        c.recruited = true;
        showToast('POW ' + (i + 1) + ' is following you! Escape together for bonus!', 3);
        return;
      }
    }
  }

  function tryShootGuard(pPos) {
    var i;
    var closest = null;
    var closestDist = 999;
    for (i = 0; i < guards.length; i++) {
      if (guards[i].dead) continue;
      var d = vecDist(guards[i].group.position, pPos);
      if (d < closestDist) {
        closestDist = d;
        closest = guards[i];
      }
    }
    if (closest && closestDist < 10) {
      pistolAmmo--;
      closest.dead = true;
      closest.group.visible = false;
      score += 50;
      showToast('Guard eliminated silently. Ammo: ' + pistolAmmo, 2);
    }
  }

  function checkGateEscape(lx, lz) {
    if (dist2D(lx, lz, 0, 23) < 2.5) {
      if (wearingDisguise && forgedPapersPickedUp) {
        doEscape('BLUFF GATE', getPlayerPos());
      } else if (wearingDisguise && !forgedPapersPickedUp) {
        showToast('Gate guard: Papers, please! [Need FORGED PAPERS]', 2);
      } else {
        showToast('No disguise at gate — ALARM!', 2);
        triggerAlarm();
      }
    }
  }

  function doEscape(route, pPos) {
    if (escaped) return;
    escaped = true;
    escapeRoute = route;
    score += 1000;
    if (alarmActive) { score += 200; }
    var recruited = 0;
    var i;
    for (i = 0; i < companions.length; i++) {
      if (companions[i].recruited) { recruited++; }
    }
    if (recruited > 0) { score += recruited * 150; }
    var msg = 'ESCAPED via ' + route + '! SCORE: ' + score;
    if (recruited > 0) { msg += ' +' + recruited + ' companions!'; }
    showToast(msg, 6);
    alarmActive = false;
    for (i = 0; i < guards.length; i++) {
      guards[i].state = GUARD_PATROL;
    }
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────

  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'pow-hud';
    hudEl.style.cssText =
      'position:fixed;top:8px;left:8px;font-family:monospace;font-size:12px;' +
      'color:#FFD700;text-shadow:1px 1px 2px #000;z-index:500;pointer-events:none;' +
      'background:rgba(0,0,0,0.55);padding:4px 8px;border-radius:4px;white-space:nowrap;';
    document.body.appendChild(hudEl);

    toastEl = document.createElement('div');
    toastEl.style.cssText =
      'position:fixed;top:30%;left:50%;transform:translateX(-50%);' +
      'font-size:22px;font-weight:bold;color:#FFD700;text-shadow:0 0 8px #000;' +
      'opacity:0;transition:opacity 0.4s;z-index:600;pointer-events:none;text-align:center;';
    document.body.appendChild(toastEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var itemCount = 0;
    if (wireCuttersPickedUp) { itemCount++; }
    if (disguisePickedUp) { itemCount++; }
    if (pistolPickedUp) { itemCount++; }
    if (forgedPapersPickedUp) { itemCount++; }

    var alarmStr = alarmActive
      ? 'ALARM: ' + Math.ceil(alarmTimer) + 's!'
      : 'ALARM: OFF';
    var tunnelStr = tunnelFound ? 'TUNNEL: FOUND' : 'TUNNEL: ?';
    var extra = '';
    if (wearingDisguise) { extra += ' | DISGUISE: ON'; }
    if (pistolPickedUp) { extra += ' AMMO:' + pistolAmmo; }
    if (safeCracked) { extra += ' INTEL:+500'; }

    hudEl.textContent =
      'POW ESCAPE [' + alarmStr + '] [ITEMS: ' + itemCount + '/4] [' + tunnelStr + ']' +
      ' | ROUTE: ' + escapeRoute + extra +
      ' | SCORE: ' + score;
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }
    if (toastEl && toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
      toastEl = null;
    }
  }

  // ── Key handlers ─────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    keys[e.key] = true;
  }

  function onKeyUp(e) {
    keys[e.key] = false;
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  function clearScene() {
    if (campGroup && scene) {
      scene.remove(campGroup);
      campGroup = null;
    }
    var i;
    for (i = 0; i < guards.length; i++) {
      if (guards[i].group && scene) {
        scene.remove(guards[i].group);
      }
    }
    guards = [];
    companions = [];
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  function init(sceneRef, cameraRef, playerRefArg) {
    scene = sceneRef;
    camera = cameraRef;
    playerRef = playerRefArg || null;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  function update(dt) {
    var pKey = keys['p'] || keys['P'];
    var wKey = keys['w'] || keys['W'];

    if (!active) {
      if (pKey && wKey && (!prevP || !prevW)) {
        startScenario();
      }
      prevP = pKey;
      prevW = wKey;
      return;
    }

    prevP = pKey;
    prevW = wKey;

    if (escaped) {
      updateHUD();
      return;
    }

    if (alarmActive) {
      alarmTimer -= dt;
      if (alarmTimer <= 0) {
        doRecapture();
      }
    }

    var i;
    for (i = 0; i < guards.length; i++) {
      updateGuard(guards[i], dt);
    }

    updateCompanions(dt);
    handleInteractions(dt);

    var t = Date.now() * 0.001;
    if (wireCuttersMesh) { wireCuttersMesh.position.y = 0.05 + Math.sin(t * 2) * 0.03; }
    if (disguiseMesh) { disguiseMesh.rotation.y = t * 0.5; }
    if (pistolMesh) { pistolMesh.position.y = 0.075 + Math.sin(t * 2.5 + 1) * 0.03; }
    if (forgedPapersMesh) { forgedPapersMesh.position.y = 0.01 + Math.sin(t * 1.5 + 2) * 0.02; }

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0 && toastEl) {
        toastEl.style.opacity = '0';
      }
    }

    updateHUD();
  }

  function startScenario() {
    if (active) return;
    active = true;

    var pPos = getPlayerPos();
    OX = pPos.x;
    OZ = pPos.z + 10;

    // Reset all state
    wireCuttersMesh = null;
    wireCuttersPickedUp = false;
    disguiseMesh = null;
    disguisePickedUp = false;
    pistolMesh = null;
    pistolPickedUp = false;
    forgedPapersMesh = null;
    forgedPapersPickedUp = false;
    combinationClue = null;
    hasCombClue = false;
    safeCracked = false;
    pistolAmmo = 8;
    wearingDisguise = false;
    fenceCut = false;
    fenceMesh = null;
    tunnelFound = false;
    tunnelHatchIn = null;
    tunnelHatchOut = null;
    inTunnel = false;
    tunnelProgress = 0;
    escapeRoute = 'UNDECIDED';
    escaped = false;
    recaptured = false;
    alarmActive = false;
    alarmTimer = 0;
    score = 0;
    companionsEscaped = 0;
    crackHoldTimer = 0;
    safeObj = null;
    guards = [];
    companions = [];
    prevF = false;
    prevT = false;
    prevR = false;
    prevC = false;
    prevShoot = false;

    clearScene();
    buildCamp();
    buildGuards();
    buildHUD();

    var startPos = getPlayerPos();
    startPos.set(OX + 0, 1, OZ - 8);

    showToast('POW ESCAPE — Collect items, find a route, ESCAPE! [F=pick up, T=tunnel, R=recruit, Space=shoot]', 5);
  }

  function reset() {
    if (!active) return;
    active = false;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    clearScene();
    removeHUD();
    keys = {};
    prevP = false;
    prevW = false;
  }

  return { init: init, update: update, reset: reset };

}());
