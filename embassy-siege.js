// ============================================================
//  embassy-siege.js — Embassy Siege FPS Game Module
//  SAS-style assault to rescue hostages from besieged embassy
//  Inspired by the 1980 Iranian Embassy Siege (Operation Nimrod)
//
//  ACTIVATION: E + S simultaneous keypress within 400ms
//
//  Features:
//    1. 3-floor embassy + roof, sandstone facade
//    2. 6 hostages across 3 floors (2 per floor)
//    3. 8 terrorists: 2 sentries, 4 guards, 2 commanders
//    4. Strict ROE: 2+ collateral kills = mission fail
//    5. 10-minute standoff timer; terrorist executes every 2 min
//    6. Rappel entry, skylight breach, window entry, door breach
//    7. Flash grenade (F), breaching charge (E+F), silent takedown (Q)
//    8. HUD: hostages freed, terrorists remaining, execute timer, floor, ROE
//
//  Public API: init, update, reset
// ============================================================
window.EmbassySiege = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── Constants ─────────────────────────────────────────────────
  var TOTAL_HOSTAGES        = 6;
  var TOTAL_TERRORISTS      = 8;
  var MISSION_TIME          = 600;   // 10 minutes in seconds
  var EXECUTE_INTERVAL      = 120;   // terrorists execute every 2 minutes
  var FLASH_STUN_DURATION   = 4;
  var FLASH_RANGE           = 6;
  var BREACH_STUN_DURATION  = 3;
  var SILENT_TAKEDOWN_RANGE = 1;
  var FREE_HOSTAGE_TIME     = 2;
  var BREACH_DOOR_TIME      = 3;
  var KICK_DOOR_TIME        = 2;
  var DOUBLE_TAP_HP         = 20;
  var TERRORIST_HP          = 60;
  var DETECT_RANGE          = 10;
  var PATROL_SPEED          = 1.5;
  var CHASE_SPEED           = 3.5;
  var ALARM_EXECUTE_DELAY   = 30;    // execute hostage if alarm raised 30s
  var ACTIVATION_WINDOW     = 400;   // ms for E+S simultaneous
  var CRAWL_SPEED           = 0.5;
  var RAPPEL_SPEED          = 2;
  var MAX_COLLATERAL        = 2;
  var MAX_HOSTAGE_DEATHS    = 3;

  // Floor Y positions
  var FLOOR_Y = [0, 4, 8, 12];      // ground, 2nd, 3rd, roof base

  // ── Module state ──────────────────────────────────────────────
  var active         = false;
  var scene          = null;
  var camera         = null;
  var renderer       = null;

  var clock          = null;
  var missionTime    = MISSION_TIME;
  var nextExecuteIn  = EXECUTE_INTERVAL;
  var score          = 0;
  var currentFloor   = 0;
  var collateralKills = 0;
  var hostageDeaths  = 0;
  var gameOver       = false;
  var missionSuccess = false;

  // Entity arrays
  var hostages       = [];
  var terrorists     = [];
  var rappelRopes    = [];
  var entryPoints    = [];
  var flashObjects   = [];
  var breachCharges  = [];

  // Player state
  var player         = null;
  var playerPos      = null;
  var playerVelocity = null;
  var onRope         = false;
  var currentRope    = null;
  var ropeProgress   = 0;   // 0=top, 1=bottom
  var isGrounded     = true;

  // Input state
  var keys           = {};
  var keyTimestamps  = {};
  var mouseX         = 0;
  var mouseY         = 0;
  var yaw            = 0;
  var pitch          = 0;

  // HUD element
  var hudEl          = null;

  // Embassy mesh groups
  var embassyGroup   = null;
  var roofGroup      = null;
  var floorGroups    = [];

  // Raycaster for shooting
  var raycaster      = null;

  // Shoot cooldown
  var shootCooldown  = 0;

  // Interaction timer
  var interactTimer  = 0;
  var interactTarget = null;
  var interactAction = null;

  // Alarm state
  var alarmActive    = false;
  var alarmTimer     = 0;

  // Flash state
  var flashActive    = false;
  var flashTimer     = 0;
  var flashLight     = null;
  var flashMesh      = null;

  // ── Activation keys ───────────────────────────────────────────
  var ePressed       = false;
  var sPressed       = false;
  var ePressTime     = 0;
  var sPressTime     = 0;

  // ── Helpers ───────────────────────────────────────────────────
  function makeMesh(geo, color, wireframe) {
    var mat = new THREE.MeshLambertMaterial({ color: color, wireframe: wireframe || false });
    return new THREE.Mesh(geo, mat);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx*dx + dz*dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function randomRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  // ── Embassy construction ──────────────────────────────────────
  function buildEmbassy() {
    embassyGroup = new THREE.Group();
    scene.add(embassyGroup);

    // Exterior shell (sandstone facade)
    var extGeo = new THREE.BoxGeometry(20, 12, 15);
    var extMesh = makeMesh(extGeo, 0x887766);
    extMesh.position.set(0, 6, 0);
    embassyGroup.add(extMesh);

    // Flagpole
    var poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 6);
    var poleMesh = makeMesh(poleGeo, 0xCCCCCC);
    poleMesh.position.set(-8, 9, 0);
    embassyGroup.add(poleMesh);

    // Flag (box atop pole)
    var flagGeo = new THREE.BoxGeometry(2, 1, 0.05);
    var flagMesh = makeMesh(flagGeo, 0x336699);
    flagMesh.position.set(-7, 12, 0);
    embassyGroup.add(flagMesh);

    // Build 3 floors
    floorGroups = [];
    var floorColors = [0x778877, 0x777766, 0x666655];
    var floorNames  = ['Ground Floor', '2nd Floor', '3rd Floor'];
    var i;

    for (i = 0; i < 3; i++) {
      var fg = new THREE.Group();
      var floorGeo = new THREE.BoxGeometry(20, 4, 15);
      var floorMesh = makeMesh(floorGeo, floorColors[i]);
      floorMesh.position.set(0, FLOOR_Y[i] + 2, 0);
      // Make translucent so interior is implied
      floorMesh.material.transparent = true;
      floorMesh.material.opacity = 0.4;
      fg.add(floorMesh);

      // Floor slab
      var slabGeo = new THREE.BoxGeometry(20, 0.2, 15);
      var slabMesh = makeMesh(slabGeo, 0x554433);
      slabMesh.position.set(0, FLOOR_Y[i], 0);
      fg.add(slabMesh);

      floorGroups.push(fg);
      embassyGroup.add(fg);
    }

    // Ground floor: reception desk
    var deskGeo = new THREE.BoxGeometry(3, 1, 1);
    var deskMesh = makeMesh(deskGeo, 0x8B6914);
    deskMesh.position.set(3, 0.5, -3);
    embassyGroup.add(deskMesh);

    // 2nd floor: conference table
    var tableGeo = new THREE.BoxGeometry(5, 0.2, 2);
    var tableMesh = makeMesh(tableGeo, 0x6B4226);
    tableMesh.position.set(0, 4.1, 0);
    embassyGroup.add(tableMesh);

    // 3rd floor: radio/comms equipment (LineSegments antenna)
    var antennaPoints = [];
    antennaPoints.push(new THREE.Vector3(-2, 9, -2));
    antennaPoints.push(new THREE.Vector3(-2, 13, -2));
    antennaPoints.push(new THREE.Vector3(-2, 13, -2));
    antennaPoints.push(new THREE.Vector3(-1.5, 12, -2));
    antennaPoints.push(new THREE.Vector3(-2, 13, -2));
    antennaPoints.push(new THREE.Vector3(-2.5, 12, -2));
    var antGeo = new THREE.BufferGeometry().setFromPoints(antennaPoints);
    var antMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var antenna = new THREE.LineSegments(antGeo, antMat);
    embassyGroup.add(antenna);

    // Radio box
    var radioGeo = new THREE.BoxGeometry(0.8, 0.5, 0.4);
    var radioMesh = makeMesh(radioGeo, 0x333333);
    radioMesh.position.set(-2, 9.25, -2);
    embassyGroup.add(radioMesh);

    // Roof
    roofGroup = new THREE.Group();
    var roofGeo = new THREE.BoxGeometry(20, 1, 15);
    var roofMesh = makeMesh(roofGeo, 0x556655);
    roofMesh.position.set(0, 12.5, 0);
    roofGroup.add(roofMesh);

    // Skylights on roof
    var skylightPositions = [[-4, 13.01, -3], [4, 13.01, 3]];
    var j;
    for (j = 0; j < skylightPositions.length; j++) {
      var skGeo = new THREE.BoxGeometry(1.5, 0.05, 1.5);
      var skMat = new THREE.MeshLambertMaterial({ color: 0x88CCFF, transparent: true, opacity: 0.5 });
      var skMesh = new THREE.Mesh(skGeo, skMat);
      skMesh.position.set(skylightPositions[j][0], skylightPositions[j][1], skylightPositions[j][2]);
      skMesh.userData.isSkylight = true;
      skMesh.userData.broken = false;
      roofGroup.add(skMesh);
    }
    embassyGroup.add(roofGroup);

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(60, 0.2, 60);
    var groundMesh = makeMesh(groundGeo, 0x4A5240);
    groundMesh.position.set(0, -0.1, 0);
    scene.add(groundMesh);

    // Windows on 2nd floor exterior for rappel entry
    var winGeo = new THREE.BoxGeometry(1.5, 2, 0.1);
    var winMat = new THREE.MeshLambertMaterial({ color: 0x88CCFF, transparent: true, opacity: 0.6 });
    var win2 = new THREE.Mesh(winGeo, winMat);
    win2.position.set(5, 5, -7.55);
    win2.userData.isWindow = true;
    win2.userData.broken = false;
    win2.userData.floor = 1;
    embassyGroup.add(win2);

    // Front door (ground floor)
    var doorGeo = new THREE.BoxGeometry(2, 3, 0.15);
    var doorMesh = makeMesh(doorGeo, 0x5C3A1E);
    doorMesh.position.set(0, 1.5, -7.575);
    doorMesh.userData.isDoor = true;
    doorMesh.userData.breached = false;
    embassyGroup.add(doorMesh);
  }

  // ── Rappel ropes ──────────────────────────────────────────────
  function buildRappelRopes() {
    rappelRopes = [];

    // Rope on 2nd floor exterior wall (south side)
    var rope1Pts = [];
    rope1Pts.push(new THREE.Vector3(5, 13, -7.6));
    rope1Pts.push(new THREE.Vector3(5, 4,  -7.6));
    var rope1Geo = new THREE.BufferGeometry().setFromPoints(rope1Pts);
    var ropeMat  = new THREE.LineBasicMaterial({ color: 0xCCBB88 });
    var rope1    = new THREE.LineSegments(rope1Geo, ropeMat);
    scene.add(rope1);

    rappelRopes.push({
      mesh:      rope1,
      topPos:    new THREE.Vector3(5, 13, -7.6),
      bottomPos: new THREE.Vector3(5, 4,  -7.6),
      floorEntry: 1
    });

    // Rope from roof for skylight insertion
    var rope2Pts = [];
    rope2Pts.push(new THREE.Vector3(-4, 14, -3));
    rope2Pts.push(new THREE.Vector3(-4, 9,  -3));
    var rope2Geo = new THREE.BufferGeometry().setFromPoints(rope2Pts);
    var rope2    = new THREE.LineSegments(rope2Geo, ropeMat.clone());
    scene.add(rope2);

    rappelRopes.push({
      mesh:      rope2,
      topPos:    new THREE.Vector3(-4, 14, -3),
      bottomPos: new THREE.Vector3(-4, 9,  -3),
      floorEntry: 2
    });
  }

  // ── Hostage spawning ──────────────────────────────────────────
  function buildHostages() {
    hostages = [];
    // 2 per floor; positions per floor
    var hostageData = [
      // Ground floor
      { x: -4, z: 2,  floor: 0 },
      { x:  6, z: -4, floor: 0 },
      // 2nd floor
      { x: -3, z: 3,  floor: 1 },
      { x:  5, z: -2, floor: 1 },
      // 3rd floor
      { x:  2, z: 4,  floor: 2 },
      { x: -5, z: -3, floor: 2 }
    ];

    var i;
    for (i = 0; i < hostageData.length; i++) {
      var hd = hostageData[i];
      var group = new THREE.Group();

      // Body (BoxGeometry, skin tone)
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
      var bodyMesh = makeMesh(bodyGeo, 0xFFDDCC);
      bodyMesh.position.set(0, 0.6, 0);
      group.add(bodyMesh);

      // Head (SphereGeometry)
      var headGeo = new THREE.SphereGeometry(0.25, 8, 8);
      var headMesh = makeMesh(headGeo, 0xFFDDCC);
      headMesh.position.set(0, 1.45, 0);
      group.add(headMesh);

      // Tied hands indicator (small BoxGeometry in front)
      var tieGeo = new THREE.BoxGeometry(0.7, 0.1, 0.1);
      var tieMesh = makeMesh(tieGeo, 0x886644);
      tieMesh.position.set(0, 0.5, 0.25);
      group.add(tieMesh);

      var y = FLOOR_Y[hd.floor] + 0.01;
      group.position.set(hd.x, y, hd.z);
      scene.add(group);

      hostages.push({
        mesh:       group,
        floor:      hd.floor,
        hp:         50,
        tied:       true,
        freed:      false,
        dead:       false,
        crawling:   false,
        freeTimer:  0,
        being_freed: false,
        tieMesh:    tieMesh
      });
    }
  }

  // ── Terrorist spawning ────────────────────────────────────────
  function buildTerrorists() {
    terrorists = [];

    // Types: 'sentry' (patrol), 'guard' (static), 'commander'
    var terrorData = [
      // Ground floor
      { x: -6, z:  3, floor: 0, type: 'sentry',    patrol: [new THREE.Vector3(-6,0,3), new THREE.Vector3(6,0,3), new THREE.Vector3(6,0,-3), new THREE.Vector3(-6,0,-3)] },
      { x:  4, z: -5, floor: 0, type: 'guard',     patrol: null },
      { x: -3, z: -2, floor: 0, type: 'commander', patrol: null },
      // 2nd floor
      { x: -5, z:  4, floor: 1, type: 'sentry',    patrol: [new THREE.Vector3(-5,4,4), new THREE.Vector3(5,4,4), new THREE.Vector3(5,4,-4), new THREE.Vector3(-5,4,-4)] },
      { x:  3, z: -3, floor: 1, type: 'guard',     patrol: null },
      { x:  6, z:  2, floor: 1, type: 'guard',     patrol: null },
      // 3rd floor
      { x: -4, z:  2, floor: 2, type: 'guard',     patrol: null },
      { x:  3, z: -4, floor: 2, type: 'commander', patrol: null }
    ];

    var i;
    for (i = 0; i < terrorData.length; i++) {
      var td = terrorData[i];
      var group = new THREE.Group();

      // Body
      var bodyGeo = new THREE.BoxGeometry(0.7, 1.4, 0.5);
      var bodyMesh = makeMesh(bodyGeo, 0x443322);
      bodyMesh.position.set(0, 0.7, 0);
      group.add(bodyMesh);

      // Head
      var headGeo = new THREE.SphereGeometry(0.28, 8, 8);
      var headMesh = makeMesh(headGeo, 0x443322);
      headMesh.position.set(0, 1.6, 0);
      group.add(headMesh);

      // Commander indicator (cone hat)
      if (td.type === 'commander') {
        var coneGeo = new THREE.ConeGeometry(0.2, 0.4, 6);
        var coneMesh = makeMesh(coneGeo, 0x882222);
        coneMesh.position.set(0, 2.05, 0);
        group.add(coneMesh);
      }

      var y = FLOOR_Y[td.floor] + 0.01;
      group.position.set(td.x, y, td.z);
      scene.add(group);

      terrorists.push({
        mesh:           group,
        floor:          td.floor,
        type:           td.type,
        hp:             TERRORIST_HP,
        dead:           false,
        stunned:        false,
        stunTimer:      0,
        alerted:        false,
        alertTimer:     0,
        state:          (td.type === 'sentry') ? 'patrol' : 'guard',
        patrolPoints:   td.patrol,
        patrolIndex:    0,
        nearestHostage: null
      });
    }
  }

  // ── Player setup ──────────────────────────────────────────────
  function buildPlayer() {
    playerPos      = new THREE.Vector3(0, 14, -15);  // Start on roof
    playerVelocity = new THREE.Vector3(0, 0, 0);
    yaw   = 0;
    pitch = 0;

    // Camera is player's eye
    camera.position.copy(playerPos);
    camera.position.y += 1.7;
  }

  // ── HUD ───────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'embassy-siege-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.65)',
      'padding:8px 12px',
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

    var hostageLive   = 0;
    var hostageFreed  = 0;
    var terrorAlive   = 0;
    var i;

    for (i = 0; i < hostages.length; i++) {
      if (!hostages[i].dead) hostageLive++;
      if (hostages[i].freed) hostageFreed++;
    }
    for (i = 0; i < terrorists.length; i++) {
      if (!terrorists[i].dead) terrorAlive++;
    }

    var execMins = Math.floor(nextExecuteIn / 60);
    var execSecs = Math.floor(nextExecuteIn % 60);
    var execStr  = execMins + ':' + (execSecs < 10 ? '0' : '') + execSecs;

    var totalMins = Math.floor(missionTime / 60);
    var totalSecs = Math.floor(missionTime % 60);
    var totalStr  = totalMins + ':' + (totalSecs < 10 ? '0' : '') + totalSecs;

    var roe = collateralKills + '/' + MAX_COLLATERAL + ' VIOLATIONS';
    var floorName = ['GROUND','2ND','3RD','ROOF'][currentFloor] || 'ROOF';

    var alarm = alarmActive ? ' | *** ALARM ***' : '';

    hudEl.textContent = [
      'EMBASSY SIEGE [HOSTAGES: ' + hostageFreed + '/' + TOTAL_HOSTAGES + ']',
      '[TERRORISTS: ' + terrorAlive + '] [EXECUTE TIMER: ' + execStr + ']',
      '[FLOOR: ' + floorName + '] | ROE: ' + roe,
      'MISSION CLOCK: ' + totalStr + alarm
    ].join('\n');

    if (gameOver) {
      hudEl.textContent += '\n\n' + (missionSuccess ? '== MISSION SUCCESS ==' : '== MISSION FAILED ==');
    }
  }

  // ── Crosshair ─────────────────────────────────────────────────
  var crosshairEl = null;
  function buildCrosshair() {
    crosshairEl = document.createElement('div');
    crosshairEl.id = 'embassy-siege-crosshair';
    crosshairEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px',
      'height:20px',
      'pointer-events:none',
      'z-index:9998'
    ].join(';');
    crosshairEl.innerHTML = '<svg width="20" height="20"><line x1="10" y1="2" x2="10" y2="8" stroke="#00FF88" stroke-width="1.5"/><line x1="10" y1="12" x2="10" y2="18" stroke="#00FF88" stroke-width="1.5"/><line x1="2" y1="10" x2="8" y2="10" stroke="#00FF88" stroke-width="1.5"/><line x1="12" y1="10" x2="18" y2="10" stroke="#00FF88" stroke-width="1.5"/></svg>';
    document.body.appendChild(crosshairEl);
  }

  // ── Interaction prompt ────────────────────────────────────────
  var interactPromptEl = null;
  function buildInteractPrompt() {
    interactPromptEl = document.createElement('div');
    interactPromptEl.id = 'embassy-siege-prompt';
    interactPromptEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFFF00',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,0,0,0.7)',
      'padding:6px 12px',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(interactPromptEl);
  }

  function showPrompt(txt) {
    if (interactPromptEl) {
      interactPromptEl.textContent = txt;
      interactPromptEl.style.display = 'block';
    }
  }
  function hidePrompt() {
    if (interactPromptEl) interactPromptEl.style.display = 'none';
  }

  // ── Flash grenade effect ──────────────────────────────────────
  function triggerFlash(pos) {
    // White sphere that expands then fades
    var sGeo   = new THREE.SphereGeometry(0.3, 8, 8);
    var sMat   = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var sMesh  = new THREE.Mesh(sGeo, sMat);
    sMesh.position.copy(pos);
    scene.add(sMesh);

    // PointLight burst
    var light = new THREE.PointLight(0xFFFFFF, 8, FLASH_RANGE * 2);
    light.position.copy(pos);
    scene.add(light);

    flashMesh   = sMesh;
    flashLight  = light;
    flashActive = true;
    flashTimer  = FLASH_STUN_DURATION;

    flashObjects.push({ mesh: sMesh, light: light, timer: 0.4 });

    // Stun all terrorists in range
    var i;
    for (i = 0; i < terrorists.length; i++) {
      var t = terrorists[i];
      if (!t.dead && dist3(t.mesh.position, pos) <= FLASH_RANGE) {
        t.stunned   = true;
        t.stunTimer = FLASH_STUN_DURATION;
      }
    }
  }

  // ── Breach charge effect ──────────────────────────────────────
  function triggerBreach(pos, radius) {
    radius = radius || 5;
    // Small explosion effect
    var sGeo  = new THREE.SphereGeometry(0.5, 8, 8);
    var sMat  = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.copy(pos);
    scene.add(sMesh);
    flashObjects.push({ mesh: sMesh, light: null, timer: 0.3 });

    // Stun enemies in adjacent area
    var i;
    for (i = 0; i < terrorists.length; i++) {
      var t = terrorists[i];
      if (!t.dead && dist3(t.mesh.position, pos) <= radius) {
        t.stunned   = true;
        t.stunTimer = BREACH_STUN_DURATION;
      }
    }
  }

  // ── Kill terrorist ────────────────────────────────────────────
  function killTerrorist(idx, silent) {
    var t = terrorists[idx];
    if (t.dead) return;
    t.dead = true;
    t.hp   = 0;

    // Visual: lay flat
    t.mesh.rotation.z = Math.PI / 2;
    t.mesh.position.y -= 0.4;

    // If commander killed: check if other commanders remain
    if (t.type === 'commander') {
      var commandersLeft = 0;
      var j;
      for (j = 0; j < terrorists.length; j++) {
        if (!terrorists[j].dead && terrorists[j].type === 'commander') commandersLeft++;
      }
      if (commandersLeft === 0) {
        // All commanders dead: remaining terrorists immediately execute nearest hostage
        for (j = 0; j < terrorists.length; j++) {
          if (!terrorists[j].dead) {
            executeNearestHostage(j);
          }
        }
      }
    }

    if (!silent) {
      triggerAlarm();
    }
  }

  // ── Kill hostage ──────────────────────────────────────────────
  function killHostage(idx) {
    var h = hostages[idx];
    if (h.dead) return;
    h.dead = true;
    h.mesh.rotation.z = Math.PI / 2;
    h.mesh.position.y -= 0.3;
    hostageDeaths++;
    score -= 500;

    if (hostageDeaths >= MAX_HOSTAGE_DEATHS) {
      endMission(false);
    }
  }

  // ── Execute nearest hostage ───────────────────────────────────
  function executeNearestHostage(terrorIdx) {
    var t = terrorists[terrorIdx];
    var bestDist = 99999;
    var bestIdx  = -1;
    var i;
    for (i = 0; i < hostages.length; i++) {
      var h = hostages[i];
      if (h.dead || h.freed) continue;
      var d = dist3(t.mesh.position, h.mesh.position);
      if (d < bestDist) {
        bestDist = d;
        bestIdx  = i;
      }
    }
    if (bestIdx >= 0) killHostage(bestIdx);
  }

  // ── Alarm ─────────────────────────────────────────────────────
  function triggerAlarm() {
    if (alarmActive) return;
    alarmActive = true;
    alarmTimer  = 0;

    // All terrorists become alerted
    var i;
    for (i = 0; i < terrorists.length; i++) {
      terrorists[i].alerted   = true;
      terrorists[i].alertTimer = 0;
      if (!terrorists[i].dead && terrorists[i].state !== 'chase') {
        terrorists[i].state = 'chase';
      }
    }
  }

  // ── Shooting ──────────────────────────────────────────────────
  function shoot() {
    if (gameOver) return;
    if (shootCooldown > 0) return;
    shootCooldown = 0.15;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    var targets = [];
    var i;
    for (i = 0; i < terrorists.length; i++) {
      if (!terrorists[i].dead) targets.push(terrorists[i].mesh);
    }
    for (i = 0; i < hostages.length; i++) {
      if (!hostages[i].dead) targets.push(hostages[i].mesh);
    }

    var intersects = raycaster.intersectObjects(targets, true);
    if (intersects.length > 0) {
      var hitObj = intersects[0].object;
      // Find which entity was hit
      var j;
      for (j = 0; j < terrorists.length; j++) {
        if (!terrorists[j].dead && terrorists[j].mesh === hitObj.parent) {
          var t = terrorists[j];
          var dmg = 30;
          t.hp -= dmg;
          if (t.hp <= DOUBLE_TAP_HP) {
            // Show double-tap prompt if already weak
          }
          if (t.hp <= 0) {
            killTerrorist(j, false);
            score += 200;
          } else {
            triggerAlarm();
          }
          return;
        }
      }
      // Check hostage hit (collateral)
      for (j = 0; j < hostages.length; j++) {
        if (!hostages[j].dead && hostages[j].mesh === hitObj.parent) {
          collateralKills++;
          killHostage(j);
          if (collateralKills >= MAX_COLLATERAL) {
            endMission(false);
          }
          return;
        }
      }
    }
  }

  // ── Silent takedown ───────────────────────────────────────────
  function silentTakedown() {
    if (gameOver) return;
    var i;
    for (i = 0; i < terrorists.length; i++) {
      var t = terrorists[i];
      if (t.dead) continue;
      var d = dist3(playerPos, t.mesh.position);
      if (d <= SILENT_TAKEDOWN_RANGE) {
        // Check if roughly behind (dot product of forward and enemy-to-player)
        killTerrorist(i, true);
        score += 300;
        return;
      }
    }
  }

  // ── Free hostage ──────────────────────────────────────────────
  function startFreeHostage() {
    var i;
    for (i = 0; i < hostages.length; i++) {
      var h = hostages[i];
      if (h.dead || h.freed || !h.tied) continue;
      var d = dist3(playerPos, h.mesh.position);
      if (d <= 2.5) {
        h.being_freed = true;
        interactTimer  = FREE_HOSTAGE_TIME;
        interactTarget = i;
        interactAction = 'free_hostage';
        showPrompt('[E] Freeing hostage... ' + Math.ceil(interactTimer) + 's');
        return true;
      }
    }
    return false;
  }

  function completeInteraction() {
    if (interactAction === 'free_hostage' && interactTarget !== null) {
      var h = hostages[interactTarget];
      h.tied        = false;
      h.freed       = true;
      h.being_freed = false;
      h.crawling    = true;
      if (h.tieMesh) h.tieMesh.visible = false;
      score += 400;
      checkWin();
    } else if (interactAction === 'breach_door') {
      triggerBreach(new THREE.Vector3(0, 2, -7.6), 6);
    }
    interactTarget = null;
    interactAction = null;
    interactTimer  = 0;
    hidePrompt();
  }

  // ── Rope grab ────────────────────────────────────────────────
  function tryGrabRope() {
    var i;
    for (i = 0; i < rappelRopes.length; i++) {
      var rope = rappelRopes[i];
      var d = dist2(playerPos, rope.topPos);
      if (d < 2 && Math.abs(playerPos.y - rope.topPos.y) < 3) {
        onRope      = true;
        currentRope = rope;
        ropeProgress = 0.1;
        return;
      }
    }
  }

  // ── Win / Lose ────────────────────────────────────────────────
  function checkWin() {
    var allFreed    = true;
    var allNeutral  = true;
    var i;

    for (i = 0; i < hostages.length; i++) {
      if (!hostages[i].freed && !hostages[i].dead) { allFreed = false; break; }
    }
    for (i = 0; i < terrorists.length; i++) {
      if (!terrorists[i].dead) { allNeutral = false; break; }
    }

    if (allFreed && allNeutral) endMission(true);
  }

  function endMission(success) {
    if (gameOver) return;
    gameOver        = true;
    missionSuccess  = success;
    updateHUD();

    // Release pointer lock
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // ── Current floor detection ───────────────────────────────────
  function detectFloor() {
    var y = playerPos.y;
    if (y >= 12)     currentFloor = 3;
    else if (y >= 8) currentFloor = 2;
    else if (y >= 4) currentFloor = 1;
    else             currentFloor = 0;
  }

  // ── Terrorist AI update ───────────────────────────────────────
  function updateTerrorists(dt) {
    var i;
    for (i = 0; i < terrorists.length; i++) {
      var t = terrorists[i];
      if (t.dead) continue;

      // Stun
      if (t.stunned) {
        t.stunTimer -= dt;
        if (t.stunTimer <= 0) {
          t.stunned   = false;
          t.stunTimer = 0;
        }
        continue;
      }

      // Alarm execute timer
      if (alarmActive && t.alerted) {
        t.alertTimer += dt;
        if (t.alertTimer >= ALARM_EXECUTE_DELAY) {
          var playerNear = dist3(playerPos, t.mesh.position) < 8;
          if (!playerNear) {
            executeNearestHostage(i);
            t.alertTimer = 0;
          }
        }
      }

      // Detect player
      var dp = dist3(playerPos, t.mesh.position);
      if (dp <= DETECT_RANGE && !t.alerted) {
        t.alerted = true;
        t.state   = 'chase';
        triggerAlarm();
      }

      // State machine
      if (t.state === 'patrol' && t.patrolPoints && t.patrolPoints.length > 0) {
        var target = t.patrolPoints[t.patrolIndex];
        var dx = target.x - t.mesh.position.x;
        var dz = target.z - t.mesh.position.z;
        var dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < 0.5) {
          t.patrolIndex = (t.patrolIndex + 1) % t.patrolPoints.length;
        } else {
          t.mesh.position.x += (dx / dist) * PATROL_SPEED * dt;
          t.mesh.position.z += (dz / dist) * PATROL_SPEED * dt;
          t.mesh.rotation.y = Math.atan2(dx, dz);
        }
      } else if (t.state === 'chase') {
        var tdx = playerPos.x - t.mesh.position.x;
        var tdz = playerPos.z - t.mesh.position.z;
        var td  = Math.sqrt(tdx*tdx + tdz*tdz);
        if (td > 1.5) {
          t.mesh.position.x += (tdx / td) * CHASE_SPEED * dt;
          t.mesh.position.z += (tdz / td) * CHASE_SPEED * dt;
          t.mesh.rotation.y = Math.atan2(tdx, tdz);
        }
      }
      // guard: static, only look at player
    }
  }

  // ── Hostage AI update ─────────────────────────────────────────
  function updateHostages(dt) {
    var i;
    for (i = 0; i < hostages.length; i++) {
      var h = hostages[i];
      if (h.dead || !h.freed || !h.crawling) continue;

      // Crawl toward nearest exterior exit (front door at 0,0,-7.5)
      var exitX = 0;
      var exitZ = -10;
      var hdx   = exitX - h.mesh.position.x;
      var hdz   = exitZ - h.mesh.position.z;
      var hd    = Math.sqrt(hdx*hdx + hdz*hdz);
      if (hd > 1) {
        h.mesh.position.x += (hdx / hd) * CRAWL_SPEED * dt;
        h.mesh.position.z += (hdz / hd) * CRAWL_SPEED * dt;
      } else {
        h.crawling = false;  // Reached exit
      }
    }
  }

  // ── Flash objects decay ───────────────────────────────────────
  function updateFlashObjects(dt) {
    var i;
    for (i = flashObjects.length - 1; i >= 0; i--) {
      var fo = flashObjects[i];
      fo.timer -= dt;
      if (fo.timer <= 0) {
        scene.remove(fo.mesh);
        if (fo.light) scene.remove(fo.light);
        flashObjects.splice(i, 1);
      } else {
        // Scale up
        var s = 1 + (1 - fo.timer / 0.4) * 2;
        fo.mesh.scale.set(s, s, s);
        if (fo.light) fo.light.intensity = fo.timer * 20;
      }
    }
  }

  // ── Player movement ───────────────────────────────────────────
  function updatePlayer(dt) {
    if (gameOver) return;

    var speed  = 5;
    var fwd    = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right  = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    var moveVec = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp'])    moveVec.add(fwd);
    if (keys['KeyS'] || keys['ArrowDown'])  moveVec.sub(fwd);
    if (keys['KeyA'] || keys['ArrowLeft'])  moveVec.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) moveVec.add(right);

    if (onRope && currentRope) {
      // Rope movement
      if (keys['KeyW']) ropeProgress -= (RAPPEL_SPEED / 9) * dt;
      if (keys['KeyS']) ropeProgress += (RAPPEL_SPEED / 9) * dt;
      ropeProgress = clamp(ropeProgress, 0, 1);

      var rTop = currentRope.topPos;
      var rBot = currentRope.bottomPos;
      playerPos.x = rTop.x + (rBot.x - rTop.x) * ropeProgress;
      playerPos.y = rTop.y + (rBot.y - rTop.y) * ropeProgress;
      playerPos.z = rTop.z + (rBot.z - rTop.z) * ropeProgress;

      // Swing with A/D
      if (keys['KeyA']) playerPos.x -= 1.5 * dt;
      if (keys['KeyD']) playerPos.x += 1.5 * dt;

      // Let go if space or reach bottom
      if (keys['Space'] || ropeProgress >= 1) {
        onRope = false;
        currentRope = null;
      }
    } else {
      // Normal movement
      if (moveVec.length() > 0) moveVec.normalize();
      moveVec.multiplyScalar(speed * dt);
      playerPos.add(moveVec);

      // Gravity
      if (!isGrounded) {
        playerVelocity.y -= 9.8 * dt;
      }
      playerPos.y += playerVelocity.y * dt;

      // Floor collision
      var floorY = 0;
      if (playerPos.y < floorY) {
        playerPos.y  = floorY;
        playerVelocity.y = 0;
        isGrounded   = true;
      }

      // Multi-floor collision (simple)
      var fi;
      for (fi = 1; fi < 4; fi++) {
        if (Math.abs(playerPos.x) < 10 && Math.abs(playerPos.z) < 7.5) {
          var fy = FLOOR_Y[fi];
          if (playerPos.y < fy && playerPos.y > fy - 0.5) {
            playerPos.y      = fy;
            playerVelocity.y = 0;
            isGrounded       = true;
          }
        }
      }

      // Jump
      if (keys['Space'] && isGrounded) {
        playerVelocity.y = 5;
        isGrounded       = false;
      }
    }

    // Update camera
    camera.position.copy(playerPos);
    camera.position.y += 1.7;
    camera.rotation.order = 'YXZ';
    camera.rotation.y     = yaw;
    camera.rotation.x     = pitch;

    detectFloor();
  }

  // ── Interaction logic ────────────────────────────────────────
  function updateInteraction(dt) {
    if (interactAction && interactTarget !== null) {
      interactTimer -= dt;
      if (interactTimer <= 0) {
        completeInteraction();
      } else {
        showPrompt('[E] ' + interactAction.replace(/_/g,' ') + '... ' + Math.ceil(interactTimer) + 's');
      }
      return;
    }

    // Check nearby interactables
    var i;
    var promptShown = false;

    // Ropes
    for (i = 0; i < rappelRopes.length; i++) {
      var rope = rappelRopes[i];
      var d = dist2(playerPos, rope.topPos);
      if (d < 2.5 && Math.abs(playerPos.y - rope.topPos.y) < 3) {
        showPrompt('[E] Grab rappel rope');
        promptShown = true;
        break;
      }
    }

    if (!promptShown) {
      // Hostages
      for (i = 0; i < hostages.length; i++) {
        var h = hostages[i];
        if (h.dead || h.freed) continue;
        var hd = dist3(playerPos, h.mesh.position);
        if (hd <= 2.5) {
          showPrompt('[E] Free hostage (2s)');
          promptShown = true;
          break;
        }
      }
    }

    if (!promptShown) {
      // Door
      var doorDist = dist3(playerPos, new THREE.Vector3(0, 1.5, -8));
      if (doorDist < 3) {
        showPrompt('[E] Kick door (2s, noisy) | [E+F] Breach charge (3s, stuns)');
        promptShown = true;
      }
    }

    if (!promptShown) hidePrompt();
  }

  // ── Mission timer update ──────────────────────────────────────
  function updateTimers(dt) {
    if (gameOver) return;

    missionTime -= dt;
    if (missionTime <= 0) {
      endMission(false);
      return;
    }

    nextExecuteIn -= dt;
    if (nextExecuteIn <= 0) {
      nextExecuteIn = EXECUTE_INTERVAL;
      // Execute one hostage from each floor if terrorists still present
      var i;
      for (i = 0; i < terrorists.length; i++) {
        if (!terrorists[i].dead) {
          executeNearestHostage(i);
          break;  // Only one execution per interval
        }
      }
    }
  }

  // ── Lighting ──────────────────────────────────────────────────
  function buildLighting() {
    var ambient = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFEECC, 0.8);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // Interior lights per floor
    var floorLightColors = [0xFFEE88, 0xFFDD66, 0xFFCC44];
    var i;
    for (i = 0; i < 3; i++) {
      var pt = new THREE.PointLight(floorLightColors[i], 0.4, 15);
      pt.position.set(0, FLOOR_Y[i] + 2, 0);
      scene.add(pt);
    }
  }

  // ── Input event binding ───────────────────────────────────────
  function bindInputs() {
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup',   onKeyUp,   false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('click', onMouseClick, false);
  }

  function unbindInputs() {
    document.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener('keyup',   onKeyUp,   false);
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('click', onMouseClick, false);
  }

  function onKeyDown(e) {
    if (!active) {
      // Check activation: E+S within 400ms
      if (e.code === 'KeyE') {
        ePressed   = true;
        ePressTime = Date.now();
      }
      if (e.code === 'KeyS') {
        sPressed   = true;
        sPressTime = Date.now();
      }
      if (ePressed && sPressed && Math.abs(ePressTime - sPressTime) <= ACTIVATION_WINDOW) {
        activate();
      }
      return;
    }

    keys[e.code] = true;

    if (gameOver) return;

    // Flash grenade: F
    if (e.code === 'KeyF') {
      var throwPos = new THREE.Vector3(
        playerPos.x - Math.sin(yaw) * 4,
        playerPos.y + 1,
        playerPos.z - Math.cos(yaw) * 4
      );
      triggerFlash(throwPos);
    }

    // Silent takedown: Q
    if (e.code === 'KeyQ') {
      silentTakedown();
    }

    // Interact: E
    if (e.code === 'KeyE') {
      if (!interactAction) {
        // Check rope first
        var i;
        for (i = 0; i < rappelRopes.length; i++) {
          var rope = rappelRopes[i];
          var d = dist2(playerPos, rope.topPos);
          if (d < 2.5 && Math.abs(playerPos.y - rope.topPos.y) < 3) {
            tryGrabRope();
            return;
          }
        }
        // Then hostage
        startFreeHostage();
      }
    }

    // Breaching charge: E+F
    if (e.code === 'KeyF' && keys['KeyE']) {
      var doorDist = dist3(playerPos, new THREE.Vector3(0, 1.5, -8));
      if (doorDist < 3) {
        interactTimer  = BREACH_DOOR_TIME;
        interactTarget = 0;
        interactAction = 'breach_door';
        showPrompt('[E+F] Placing breaching charge... ' + Math.ceil(interactTimer) + 's');
      }
    }
  }

  function onKeyUp(e) {
    if (e.code === 'KeyE') { ePressed = false; }
    if (e.code === 'KeyS') { sPressed = false; }

    if (!active) return;
    keys[e.code] = false;

    // Cancel ongoing interaction if E released
    if (e.code === 'KeyE' && interactAction) {
      interactTimer  = 0;
      interactTarget = null;
      interactAction = null;
      hidePrompt();
      // Reset being_freed state
      var i;
      for (i = 0; i < hostages.length; i++) {
        hostages[i].being_freed = false;
      }
    }
  }

  function onMouseMove(e) {
    if (!active) return;
    if (document.pointerLockElement || document.mozPointerLockElement) {
      var sens = 0.002;
      yaw   -= e.movementX * sens;
      pitch -= e.movementY * sens;
      pitch  = clamp(pitch, -Math.PI / 2.2, Math.PI / 2.2);
    }
  }

  function onMouseClick(e) {
    if (!active || gameOver) return;
    if (!(document.pointerLockElement || document.mozPointerLockElement)) {
      renderer.domElement.requestPointerLock();
      return;
    }
    if (e.button === 0) shoot();
  }

  // ── Activate ──────────────────────────────────────────────────
  function activate() {
    if (active) return;
    active = true;

    clock = new THREE.Clock();

    // Get or create scene/camera/renderer
    if (window.gameScene)    scene    = window.gameScene;
    if (window.gameCamera)   camera   = window.gameCamera;
    if (window.gameRenderer) renderer = window.gameRenderer;

    if (!scene) {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB);
      scene.fog = new THREE.Fog(0x87CEEB, 30, 80);
      window.gameScene = scene;
    }
    if (!camera) {
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
      window.gameCamera = camera;
    }
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      document.body.appendChild(renderer.domElement);
      window.gameRenderer = renderer;
    }

    raycaster = new THREE.Raycaster();

    buildLighting();
    buildEmbassy();
    buildRappelRopes();
    buildHostages();
    buildTerrorists();
    buildPlayer();
    buildHUD();
    buildCrosshair();
    buildInteractPrompt();

    // Window resize
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ── Init (called externally) ───────────────────────────────────
  function init(sc, cam, ren) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    if (sc)  scene    = sc;
    if (cam) camera   = cam;
    if (ren) renderer = ren;

    // Bind activation keys
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyE') {
        ePressed   = true;
        ePressTime = Date.now();
      }
      if (e.code === 'KeyS') {
        sPressed   = true;
        sPressTime = Date.now();
      }
      if (ePressed && sPressed && Math.abs(ePressTime - sPressTime) <= ACTIVATION_WINDOW) {
        activate();
      }
    }, false);

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyE') ePressed = false;
      if (e.code === 'KeyS') sPressed = false;
    }, false);
  }

  // ── Update (called each frame) ────────────────────────────────
  function update() {
    if (!active || !clock) return;

    var dt = clock.getDelta();
    dt = Math.min(dt, 0.05);  // Cap at 50ms to avoid spiral

    if (!gameOver) {
      updateTimers(dt);
      updatePlayer(dt);
      updateTerrorists(dt);
      updateHostages(dt);
      updateInteraction(dt);
    }
    updateFlashObjects(dt);
    updateHUD();
    shootCooldown = Math.max(0, shootCooldown - dt);

    if (renderer && scene && camera) {
      if (renderer) renderer.render(scene, camera);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────
  function reset() {
    // Clear scene objects
    var i;
    for (i = 0; i < hostages.length;   i++) scene && scene.remove(hostages[i].mesh);
    for (i = 0; i < terrorists.length; i++) scene && scene.remove(terrorists[i].mesh);
    for (i = 0; i < rappelRopes.length; i++) scene && scene.remove(rappelRopes[i].mesh);
    for (i = 0; i < flashObjects.length; i++) {
      scene && scene.remove(flashObjects[i].mesh);
      if (flashObjects[i].light) scene && scene.remove(flashObjects[i].light);
    }
    if (embassyGroup && scene) scene.remove(embassyGroup);

    // Reset state
    hostages        = [];
    terrorists      = [];
    rappelRopes     = [];
    flashObjects    = [];
    breachCharges   = [];
    floorGroups     = [];
    embassyGroup    = null;
    roofGroup       = null;
    missionTime     = MISSION_TIME;
    nextExecuteIn   = EXECUTE_INTERVAL;
    score           = 0;
    currentFloor    = 0;
    collateralKills = 0;
    hostageDeaths   = 0;
    gameOver        = false;
    missionSuccess  = false;
    alarmActive     = false;
    alarmTimer      = 0;
    flashActive     = false;
    flashTimer      = 0;
    onRope          = false;
    currentRope     = null;
    interactTimer   = 0;
    interactTarget  = null;
    interactAction  = null;
    shootCooldown   = 0;
    keys            = {};

    // Remove HUD elements
    if (hudEl) { hudEl.parentNode && hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    if (crosshairEl) { crosshairEl.parentNode && crosshairEl.parentNode.removeChild(crosshairEl); crosshairEl = null; }
    if (interactPromptEl) { interactPromptEl.parentNode && interactPromptEl.parentNode.removeChild(interactPromptEl); interactPromptEl = null; }

    if (active) {
      // Rebuild if we were active
      buildLighting();
      buildEmbassy();
      buildRappelRopes();
      buildHostages();
      buildTerrorists();
      buildPlayer();
      buildHUD();
      buildCrosshair();
      buildInteractPrompt();
    }
  }

  // ── Public API ────────────────────────────────────────────────
  return { init: init, update: update, reset: reset };

}());
