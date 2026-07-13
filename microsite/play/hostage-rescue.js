// ============================================================
//  hostage-rescue.js — Hostage Rescue Mission Module
//  Features:
//    1. H+R keys to activate mission; spawns 3 hostages + 4 guards
//    2. Hostage mesh: cylinder body (orange), sphere head, tied arms
//    3. VIP hostage: larger head + briefcase, +300 intel score
//    4. Guard AI: patrol 4 waypoints, ALARM→rush player, 12-unit detect
//    5. Rescue mechanic: E key within 2 units; hostage follows player
//    6. Elimination approach: all guards dead → hostages auto-freed
//    7. Stealth approach: no alarm triggered → +500 stealth bonus
//    8. Extraction zone: green ring 25 units away, radius 6
//    9. Alert system: alarm → rush + radio call-in 3 reinforcements after 15s
//   10. Hostage HP 50; guards execute hostage if alarmed >45s
//   11. 4-minute mission timer; fail if hostage dies or timer expires
//   12. HUD: RESCUE [x/3 FREED] [GUARDS: x/4] [EXTRACT: xm] + timer
//  Public API: init, update, reset
// ============================================================
window.HostageRescue = (function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  var NUM_HOSTAGES         = 3;
  var NUM_GUARDS           = 4;
  var HOSTAGE_HP           = 50;
  var RESCUE_RANGE         = 2;
  var DETECT_RANGE         = 12;
  var PATROL_SPEED         = 2;
  var CHASE_SPEED          = 5;
  var FOLLOW_SPEED         = 3;
  var CLUSTER_MIN_DIST     = 30;
  var EXTRACT_ZONE_RADIUS  = 6;
  var EXTRACT_ZONE_DIST    = 25;
  var REINFORCE_DELAY      = 15;  // seconds after alarm before reinforcements
  var EXECUTE_DELAY        = 45;  // seconds alarmed before guards execute hostage
  var MISSION_TIME         = 240; // seconds (4 minutes)
  var SCORE_VIP_INTEL      = 300;
  var SCORE_STEALTH_BONUS  = 500;

  var COLOR_HOSTAGE_BODY   = 0xFF8800;
  var COLOR_SKIN           = 0xF5C5A3;
  var COLOR_GUARD_BODY     = 0x333333;
  var COLOR_GUARD_ACCENT   = 0x222222;
  var COLOR_RIFLE          = 0x1A1A1A;
  var COLOR_EXTRACT        = 0x00FF44;
  var COLOR_VIP_BRIEFCASE  = 0x8B6914;
  var COLOR_ARMED_BACK     = 0x664400;

  // ── State ─────────────────────────────────────────────────────
  var missionActive       = false;
  var missionSuccess      = false;
  var missionFailed       = false;
  var missionTimer        = MISSION_TIME;

  var hostages            = [];
  var guards              = [];
  var reinforcements      = [];

  var alarmActive         = false;
  var alarmTimer          = 0;
  var reinforceSpawned    = false;
  var stealthKills        = 0;
  var anyAlarmEverTriggered = false;

  var extractionZone      = null;
  var extractionZonePos   = null;
  var clusterCenter       = null;

  var hudElement          = null;
  var keyState            = {};
  var prevHKey            = false;
  var prevRKey            = false;
  var prevEKey            = false;

  var _scene              = null;
  var _addedKeyListener   = false;

  // ── Scene / Player helpers ────────────────────────────────────

  function getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene ||
      null;
  }

  function getCamera() {
    return (window.GameManager && window.GameManager.camera) ||
      window.camera ||
      null;
  }

  function getPlayerPos() {
    var cam = getCamera();
    if (cam) return cam.position;
    if (window.player && window.player.position) return window.player.position;
    return null;
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function addScore(pts) {
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(pts);
    } else if (typeof window._score !== 'undefined') {
      window._score += pts;
    }
    var scoreEl = document.getElementById('score-display');
    if (scoreEl) {
      var cur = parseInt((scoreEl.textContent || '').replace(/[^0-9\-]/g, '')) || 0;
      scoreEl.textContent = 'SCORE: ' + (cur + pts);
    }
  }

  // ── Key listener ──────────────────────────────────────────────

  function setupKeys() {
    if (_addedKeyListener) return;
    _addedKeyListener = true;
    document.addEventListener('keydown', function (e) {
      keyState[e.code] = true;
    });
    document.addEventListener('keyup', function (e) {
      keyState[e.code] = false;
    });
  }

  // ── Material / Mesh helpers ───────────────────────────────────

  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      for (var k in opts) { params[k] = opts[k]; }
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ── Hostage mesh ──────────────────────────────────────────────

  function buildHostageMesh(isVIP) {
    var group = new THREE.Group();

    // Body: CylinderGeometry orange
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var bodyMat = makeMat(COLOR_HOSTAGE_BODY);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    // Head: SphereGeometry
    var headRadius = isVIP ? 0.35 : 0.25;
    var headGeo = new THREE.SphereGeometry(headRadius, 8, 8);
    var headMat = makeMat(COLOR_SKIN);
    var head = makeMesh(headGeo, headMat);
    head.position.y = 1.45 + (isVIP ? 0.05 : 0);
    group.add(head);
    group._headMesh = head;

    // Arms tied behind back (2 small boxes)
    var armGeo = new THREE.BoxGeometry(0.15, 0.4, 0.1);
    var armMat = makeMat(COLOR_ARMED_BACK);
    var armL = makeMesh(armGeo, armMat);
    armL.position.set(-0.2, 0.7, -0.25);
    armL.rotation.z = 0.3;
    group.add(armL);
    group._armL = armL;

    var armR = makeMesh(armGeo, armMat);
    armR.position.set(0.2, 0.7, -0.25);
    armR.rotation.z = -0.3;
    group.add(armR);
    group._armR = armR;

    // VIP: briefcase
    if (isVIP) {
      var caseGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
      var caseMat = makeMat(COLOR_VIP_BRIEFCASE);
      var briefcase = makeMesh(caseGeo, caseMat);
      briefcase.position.set(0.5, 0.55, 0);
      group.add(briefcase);
      group._briefcase = briefcase;
    }

    return group;
  }

  // ── Guard mesh ───────────────────────────────────────────────

  function buildGuardMesh() {
    var group = new THREE.Group();

    // Body: BoxGeometry dark gray
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMat = makeMat(COLOR_GUARD_BODY);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = makeMat(COLOR_GUARD_ACCENT);
    var head = makeMesh(headGeo, headMat);
    head.position.y = 1.375;
    group.add(head);

    // Rifle: BoxGeometry(0.08, 0.08, 0.6)
    var rifleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.6);
    var rifleMat = makeMat(COLOR_RIFLE);
    var rifle = makeMesh(rifleGeo, rifleMat);
    rifle.position.set(0.35, 0.8, 0.15);
    group.add(rifle);

    return group;
  }

  // ── Extraction zone mesh ──────────────────────────────────────

  function buildExtractionZone(px, pz) {
    var geo = new THREE.CylinderGeometry(
      EXTRACT_ZONE_RADIUS,
      EXTRACT_ZONE_RADIUS,
      0.1,
      32,
      1,
      true
    );
    var mat = new THREE.MeshBasicMaterial({
      color: COLOR_EXTRACT,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      wireframe: false
    });
    var ring = new THREE.Mesh(geo, mat);

    // Place 25 units away from player in random direction
    var angle = Math.random() * Math.PI * 2;
    var ex = px + Math.cos(angle) * EXTRACT_ZONE_DIST;
    var ez = pz + Math.sin(angle) * EXTRACT_ZONE_DIST;
    ring.position.set(ex, 0.05, ez);
    extractionZonePos = { x: ex, y: 0.05, z: ez };

    var scene = getScene();
    if (scene) scene.add(ring);
    return ring;
  }

  // ── Spawn hostage cluster ─────────────────────────────────────

  function spawnHostages(px, pz) {
    var scene = getScene();
    if (!scene) return;

    // Random cluster position >30 units from player
    var angle = Math.random() * Math.PI * 2;
    var dist = CLUSTER_MIN_DIST + Math.random() * 20;
    var cx = px + Math.cos(angle) * dist;
    var cz = pz + Math.sin(angle) * dist;
    clusterCenter = { x: cx, z: cz };

    // Pick one VIP (random)
    var vipIndex = Math.floor(Math.random() * NUM_HOSTAGES);

    for (var i = 0; i < NUM_HOSTAGES; i++) {
      var isVIP = (i === vipIndex);
      var mesh = buildHostageMesh(isVIP);

      // Spread within 4-unit radius of cluster
      var hAngle = (i / NUM_HOSTAGES) * Math.PI * 2;
      var hx = cx + Math.cos(hAngle) * 2.5;
      var hz = cz + Math.sin(hAngle) * 2.5;
      mesh.position.set(hx, 0, hz);
      scene.add(mesh);

      hostages.push({
        mesh: mesh,
        hp: HOSTAGE_HP,
        freed: false,
        following: false,
        isVIP: isVIP,
        extracted: false,
        celebrateTimer: 0,
        celebrateActive: false,
        followIndex: i
      });
    }
  }

  // ── Spawn guard patrol ────────────────────────────────────────

  function buildWaypoints(cx, cz) {
    var r = 8;
    return [
      { x: cx + r, z: cz + r },
      { x: cx - r, z: cz + r },
      { x: cx - r, z: cz - r },
      { x: cx + r, z: cz - r }
    ];
  }

  function spawnGuards(cx, cz) {
    var scene = getScene();
    if (!scene) return;

    for (var i = 0; i < NUM_GUARDS; i++) {
      var mesh = buildGuardMesh();
      var startAngle = (i / NUM_GUARDS) * Math.PI * 2;
      var gx = cx + Math.cos(startAngle) * 6;
      var gz = cz + Math.sin(startAngle) * 6;
      mesh.position.set(gx, 0, gz);
      scene.add(mesh);

      var waypoints = buildWaypoints(cx, cz);
      guards.push({
        mesh: mesh,
        waypoints: waypoints,
        waypointIndex: i % 4,
        alertState: false,
        dead: false,
        stealth: false
      });
    }
  }

  function spawnReinforcements(px, pz) {
    var scene = getScene();
    if (!scene) return;

    for (var i = 0; i < 3; i++) {
      var mesh = buildGuardMesh();
      var angle = Math.random() * Math.PI * 2;
      var dist2 = 18 + Math.random() * 8;
      var rx = px + Math.cos(angle) * dist2;
      var rz = pz + Math.sin(angle) * dist2;
      mesh.position.set(rx, 0, rz);
      scene.add(mesh);

      var waypoints = buildWaypoints(clusterCenter.x, clusterCenter.z);
      var g = {
        mesh: mesh,
        waypoints: waypoints,
        waypointIndex: 0,
        alertState: true,
        dead: false,
        stealth: false
      };
      guards.push(g);
      reinforcements.push(g);
    }
  }

  // ── HUD ───────────────────────────────────────────────────────

  function buildHUD() {
    if (hudElement) return;
    hudElement = document.createElement('div');
    hudElement.id = 'hostage-rescue-hud';
    hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'background:rgba(0,0,0,0.72)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 14px',
      'border:1px solid #00FF44',
      'border-radius:4px',
      'z-index:500',
      'pointer-events:none',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(hudElement);
  }

  function destroyHUD() {
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
    }
    hudElement = null;
  }

  function updateHUD() {
    if (!hudElement) return;

    var freed = 0;
    for (var i = 0; i < hostages.length; i++) {
      if (hostages[i].freed || hostages[i].extracted) freed++;
    }

    var liveGuards = 0;
    for (var j = 0; j < guards.length; j++) {
      if (!guards[j].dead) liveGuards++;
    }

    // Distance to extraction zone
    var playerPos = getPlayerPos();
    var extractDist = '?';
    if (playerPos && extractionZonePos) {
      var d = dist2D(playerPos, extractionZonePos);
      extractDist = Math.round(d) + 'm';
    }

    // Timer MM:SS
    var secs = Math.max(0, Math.ceil(missionTimer));
    var mm = Math.floor(secs / 60);
    var ss = secs % 60;
    var timerStr = mm + ':' + (ss < 10 ? '0' : '') + ss;

    var alarmStr = alarmActive ? ' ⚠ ALARM' : '';
    var totalGuards = guards.length;

    hudElement.innerHTML =
      '<b>RESCUE MISSION' + alarmStr + '</b><br>' +
      'FREED: ' + freed + '/' + NUM_HOSTAGES + ' &nbsp; ' +
      'GUARDS: ' + liveGuards + '/' + totalGuards + '<br>' +
      'EXTRACT: ' + extractDist + ' &nbsp; TIME: ' + timerStr;
  }

  // ── Mission start ─────────────────────────────────────────────

  function startMission() {
    if (missionActive) return;

    var playerPos = getPlayerPos();
    if (!playerPos) return;

    missionActive = true;
    missionSuccess = false;
    missionFailed = false;
    missionTimer = MISSION_TIME;
    alarmActive = false;
    alarmTimer = 0;
    reinforceSpawned = false;
    stealthKills = 0;
    anyAlarmEverTriggered = false;
    hostages = [];
    guards = [];
    reinforcements = [];

    var px = playerPos.x;
    var pz = playerPos.z;

    spawnHostages(px, pz);
    spawnGuards(clusterCenter.x, clusterCenter.z);
    extractionZone = buildExtractionZone(px, pz);

    buildHUD();

    if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
      window.KillFeedEvents.push('RESCUE MISSION ACTIVATED — Hostages located');
    }
  }

  // ── Trigger alarm ─────────────────────────────────────────────

  function triggerAlarm() {
    if (alarmActive) return;
    alarmActive = true;
    alarmTimer = 0;
    anyAlarmEverTriggered = true;

    for (var i = 0; i < guards.length; i++) {
      guards[i].alertState = true;
    }

    if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
      window.KillFeedEvents.push('!! ALARM — Guards alerted! Radio call-in incoming');
    }
  }

  // ── Mission success / fail ────────────────────────────────────

  function endMission(success) {
    missionActive = false;

    if (success) {
      missionSuccess = true;
      var bonus = 0;
      if (!anyAlarmEverTriggered) {
        bonus = SCORE_STEALTH_BONUS;
        addScore(bonus);
        if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
          window.KillFeedEvents.push('STEALTH BONUS +' + bonus + ' — No alarm triggered!');
        }
      }
      if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
        window.KillFeedEvents.push('MISSION SUCCESS — All hostages extracted!');
      }
    } else {
      missionFailed = true;
      if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
        window.KillFeedEvents.push('MISSION FAILED');
      }
    }

    // Show brief HUD result then remove after 5 seconds
    if (hudElement) {
      hudElement.innerHTML = success
        ? '<b style="color:#00FF44">MISSION SUCCESS!</b>'
        : '<b style="color:#FF2222">MISSION FAILED</b>';
      var hudRef = hudElement;
      setTimeout(function () {
        if (hudRef && hudRef.parentNode) {
          hudRef.parentNode.removeChild(hudRef);
        }
        if (hudElement === hudRef) hudElement = null;
      }, 5000);
    }
  }

  // ── Guard AI update ───────────────────────────────────────────

  function updateGuard(guard, playerPos, dt) {
    if (guard.dead) return;

    var gp = guard.mesh.position;

    // Detection check
    if (!alarmActive && playerPos) {
      var dToPlayer = dist2D(gp, playerPos);
      if (dToPlayer < DETECT_RANGE) {
        triggerAlarm();
      }
    }

    if (guard.alertState && playerPos) {
      // Chase player
      var dx = playerPos.x - gp.x;
      var dz = playerPos.z - gp.z;
      var dl = Math.sqrt(dx * dx + dz * dz);
      if (dl > 0.5) {
        var speed = CHASE_SPEED * dt;
        gp.x += (dx / dl) * speed;
        gp.z += (dz / dl) * speed;
        guard.mesh.rotation.y = Math.atan2(dx, dz);
      }
    } else {
      // Patrol waypoints
      var wp = guard.waypoints[guard.waypointIndex];
      var pdx = wp.x - gp.x;
      var pdz = wp.z - gp.z;
      var pdl = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pdl < 1.0) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      } else {
        var pspeed = PATROL_SPEED * dt;
        gp.x += (pdx / pdl) * pspeed;
        gp.z += (pdz / pdl) * pspeed;
        guard.mesh.rotation.y = Math.atan2(pdx, pdz);
      }
    }
  }

  // ── Execute hostage (if alarmed too long) ─────────────────────

  function executeRandomHostage() {
    for (var i = 0; i < hostages.length; i++) {
      var h = hostages[i];
      if (!h.freed && !h.extracted) {
        h.hp = 0;
        if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
          window.KillFeedEvents.push('HOSTAGE EXECUTED by guards!');
        }
        return true;
      }
    }
    return false;
  }

  // ── All guards dead? ──────────────────────────────────────────

  function allGuardsDead() {
    for (var i = 0; i < guards.length; i++) {
      if (!guards[i].dead) return false;
    }
    return guards.length > 0;
  }

  // ── Celebrate animation (arms go up) ─────────────────────────

  function startCelebrate(hostage) {
    if (hostage.celebrateActive) return;
    hostage.celebrateActive = true;
    hostage.celebrateTimer = 0;
    // Immediately raise arms
    if (hostage.mesh._armL) {
      hostage.mesh._armL.rotation.z = -1.2;
      hostage.mesh._armL.position.set(-0.35, 1.1, 0);
    }
    if (hostage.mesh._armR) {
      hostage.mesh._armR.rotation.z = 1.2;
      hostage.mesh._armR.position.set(0.35, 1.1, 0);
    }
  }

  // ── Hostage follow update ─────────────────────────────────────

  function updateHostageFollow(hostage, followOrder, dt) {
    if (!hostage.following || hostage.extracted) return;
    var playerPos = getPlayerPos();
    if (!playerPos) return;

    // Offset behind player
    var offsetDist = 3 + followOrder * 1.5;
    // Get a point behind the player (approximate: trail slightly behind)
    var hp = hostage.mesh.position;
    var dx = playerPos.x - hp.x;
    var dz = playerPos.z - hp.z;
    var dl = Math.sqrt(dx * dx + dz * dz);

    // Target: player position offset back
    var tx, tz;
    if (dl > 0.1) {
      tx = playerPos.x - (dx / dl) * offsetDist;
      tz = playerPos.z - (dz / dl) * offsetDist;
    } else {
      tx = hp.x;
      tz = hp.z;
    }

    var tdx = tx - hp.x;
    var tdz = tz - hp.z;
    var tdl = Math.sqrt(tdx * tdx + tdz * tdz);
    if (tdl > 0.2) {
      var speed = FOLLOW_SPEED * dt;
      hp.x += (tdx / tdl) * Math.min(speed, tdl);
      hp.z += (tdz / tdl) * Math.min(speed, tdl);
    }
  }

  // ── Kill guard (called by external weapon system) ─────────────

  function killGuard(guardIndex, stealth) {
    if (guardIndex < 0 || guardIndex >= guards.length) return;
    var g = guards[guardIndex];
    if (g.dead) return;
    g.dead = true;
    g.mesh.visible = false;
    if (stealth && !alarmActive) {
      stealthKills++;
    }
    var scene = getScene();
    if (scene) scene.remove(g.mesh);
  }

  // ── Main init ─────────────────────────────────────────────────

  function init(sceneRef) {
    _scene = sceneRef || null;
    setupKeys();
  }

  // ── Main update ───────────────────────────────────────────────

  function update(dt) {
    if (!dt || dt <= 0) dt = 0.016;

    setupKeys();

    var hDown = !!(keyState['KeyH']);
    var rDown = !!(keyState['KeyR']);
    var eDown = !!(keyState['KeyE']);

    // H+R together to start mission (edge-detect on release)
    if (hDown && rDown && !prevHKey && !prevRKey) {
      if (!missionActive && !missionSuccess) {
        startMission();
      }
    }
    prevHKey = hDown;
    prevRKey = rDown;

    var eJustPressed = eDown && !prevEKey;
    prevEKey = eDown;

    if (!missionActive) return;

    var playerPos = getPlayerPos();

    // ── Mission timer countdown ────────────────────────────────
    missionTimer -= dt;
    if (missionTimer <= 0) {
      endMission(false);
      return;
    }

    // ── Alarm timer / reinforcements ───────────────────────────
    if (alarmActive) {
      alarmTimer += dt;

      // Spawn reinforcements after 15 seconds
      if (!reinforceSpawned && alarmTimer >= REINFORCE_DELAY) {
        reinforceSpawned = true;
        if (playerPos) {
          spawnReinforcements(playerPos.x, playerPos.z);
        }
        if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
          window.KillFeedEvents.push('REINFORCEMENTS INBOUND — 3 guards called in!');
        }
      }

      // Execute hostage if alarmed > 45 seconds
      if (alarmTimer >= EXECUTE_DELAY) {
        var killed = executeRandomHostage();
        if (killed) {
          alarmTimer = 0; // reset so next execute takes another 45s
        }
      }
    }

    // ── Guard updates ──────────────────────────────────────────
    for (var gi = 0; gi < guards.length; gi++) {
      updateGuard(guards[gi], playerPos, dt);
    }

    // ── Check if all guards dead → auto-free hostages ──────────
    var guardsAllDead = allGuardsDead();
    if (guardsAllDead) {
      for (var hi = 0; hi < hostages.length; hi++) {
        var h = hostages[hi];
        if (!h.freed && !h.extracted) {
          h.freed = true;
          h.following = true;
          startCelebrate(h);
        }
      }
    }

    // ── Rescue mechanic: E key near unfree'd hostage ───────────
    if (eJustPressed && playerPos) {
      for (var ri = 0; ri < hostages.length; ri++) {
        var rh = hostages[ri];
        if (rh.freed || rh.extracted || rh.hp <= 0) continue;
        var rdist = dist3D(playerPos, rh.mesh.position);
        if (rdist <= RESCUE_RANGE) {
          rh.freed = true;
          rh.following = true;
          if (rh.isVIP) {
            addScore(SCORE_VIP_INTEL);
            if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
              window.KillFeedEvents.push('VIP RESCUED — Intel secured! +' + SCORE_VIP_INTEL);
            }
          } else {
            if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
              window.KillFeedEvents.push('Hostage freed!');
            }
          }
          startCelebrate(rh);
          break;
        }
      }
    }

    // ── Hostage follow / extraction check ─────────────────────
    var followOrder = 0;
    var allExtracted = true;
    var anyDead = false;

    for (var fhi = 0; fhi < hostages.length; fhi++) {
      var fh = hostages[fhi];

      // Dead check
      if (fh.hp <= 0 && !fh.extracted) {
        anyDead = true;
        // Remove mesh
        var fscene = getScene();
        if (fscene && fh.mesh.parent) fscene.remove(fh.mesh);
        fh.extracted = true; // mark so we don't reprocess
        fh.freed = false;
      }

      if (!fh.extracted && !fh.freed) {
        allExtracted = false;
      }

      if (!fh.extracted && fh.freed) {
        // Following
        updateHostageFollow(fh, followOrder, dt);
        followOrder++;

        // Extraction zone check
        if (extractionZonePos) {
          var edist = dist2D(fh.mesh.position, extractionZonePos);
          if (edist <= EXTRACT_ZONE_RADIUS) {
            fh.extracted = true;
            var escene = getScene();
            if (escene && fh.mesh.parent) escene.remove(fh.mesh);
            addScore(200);
            if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
              window.KillFeedEvents.push('Hostage extracted!');
            }
          }
        }
      }
    }

    // ── Mission fail if any hostage died ───────────────────────
    if (anyDead) {
      endMission(false);
      return;
    }

    // ── Mission success: all hostages extracted ────────────────
    var numExtracted = 0;
    var numAlive = 0;
    for (var si = 0; si < hostages.length; si++) {
      if (hostages[si].extracted && hostages[si].hp > 0) numExtracted++;
      if (hostages[si].hp > 0) numAlive++;
    }

    if (numAlive > 0 && numExtracted >= numAlive) {
      endMission(true);
      return;
    }

    // ── HUD update ────────────────────────────────────────────
    updateHUD();
  }

  // ── Reset ─────────────────────────────────────────────────────

  function reset() {
    missionActive = false;
    missionSuccess = false;
    missionFailed = false;
    alarmActive = false;
    alarmTimer = 0;
    reinforceSpawned = false;
    stealthKills = 0;
    anyAlarmEverTriggered = false;
    missionTimer = MISSION_TIME;

    var scene = getScene();

    for (var hi = 0; hi < hostages.length; hi++) {
      if (scene && hostages[hi].mesh && hostages[hi].mesh.parent) {
        scene.remove(hostages[hi].mesh);
      }
    }
    for (var gi = 0; gi < guards.length; gi++) {
      if (scene && guards[gi].mesh && guards[gi].mesh.parent) {
        scene.remove(guards[gi].mesh);
      }
    }
    if (extractionZone && scene && extractionZone.parent) {
      scene.remove(extractionZone);
    }

    hostages = [];
    guards = [];
    reinforcements = [];
    extractionZone = null;
    extractionZonePos = null;
    clusterCenter = null;

    destroyHUD();
  }

  // ── Public API ────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    reset: reset,
    killGuard: killGuard,
    isActive: function () { return missionActive; },
    getHostages: function () { return hostages; },
    getGuards: function () { return guards; }
  };

})();
