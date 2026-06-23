// commando-raid.js — Three.js FPS game module for special forces commando raid missions
// No build step; Three.js available as global THREE.
// API: CommandoRaid.init(scene, camera), .update(delta), .startRaid(x, z), .getRaidStatus(), .reset()

window.CommandoRaid = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────────
  var MISSION_DURATION       = 480;   // 8 minutes total
  var GHOST_THRESHOLD        = 300;   // 5 minutes for GHOST RAID bonus
  var GHOST_BONUS            = 1000;
  var ALARM_TIME_PENALTY     = 120;   // 2 minutes deducted on alarm
  var REINFORCE_INTERVAL     = 30;    // enemies spawn every 30s after alarm
  var NUM_GUARDS             = 6;
  var INFILTRATE_ZONE        = 5;     // proximity radius for obj 1
  var EXFIL_DIST             = 60;    // units from compound
  var HACK_DURATION          = 5;     // 5 seconds to hack server
  var BREACH_KEY             = 'KeyC';
  var INTERACT_KEY           = 'KeyE';
  var COMMANDO_FOLLOW_DIST   = 4;     // follow spacing
  var DOOR_BREACH_TIME       = 1.2;   // seconds for door to swing open
  var SERVER_LIGHT_BLINK     = 0.5;   // blink interval

  // Objective indices
  var OBJ_INFILTRATE  = 0;
  var OBJ_NEUTRALIZE  = 1;
  var OBJ_SECURE      = 2;
  var OBJ_EXFIL       = 3;

  var OBJ_LABELS = [
    'INFILTRATE — Reach the compound perimeter',
    'NEUTRALIZE — Eliminate 6 marked guards',
    'SECURE     — Hack the server rack (hold E)',
    'EXFIL      — Reach the extraction point'
  ];

  // Colors
  var COLOR_GUARD        = 0xcc2222;
  var COLOR_COMMANDO     = 0x111111;
  var COLOR_SERVER_GREEN = 0x00ff44;
  var COLOR_SERVER_RED   = 0xff2200;
  var COLOR_EXFIL_RING   = 0x00ff88;

  // ── Module state ──────────────────────────────────────────────────────────────
  var _scene         = null;
  var _camera        = null;
  var _active        = false;
  var _keysDown      = {};
  var _keysJustDown  = {};

  // Mission
  var _missionTimer       = 0;
  var _timeRemaining      = MISSION_DURATION;
  var _objectiveIndex     = 0;     // 0-3 current objective
  var _objectiveDone      = [false, false, false, false];
  var _alarmTriggered     = false;
  var _alarmPenaltyApplied = false;
  var _noAlarm            = true;
  var _ghostRaid          = false;
  var _missionComplete    = false;
  var _missionFailed      = false;
  var _score              = 0;
  var _compoundX          = 0;
  var _compoundZ          = 0;

  // Guards
  var _guards = [];           // array of guard objects

  // Commandos
  var _commandos = [];        // array of commando objects

  // Scene objects
  var _serverRack      = null;
  var _serverLights    = [];
  var _serverLightTimer = 0;
  var _serverLightState = false;
  var _serverParticles  = [];

  var _exfilRing       = null;
  var _exfilPos        = null;
  var _helicopter      = null;
  var _heliRotorTop    = null;
  var _heliRotorTail   = null;

  var _compoundPerimeterMesh = null;

  // Doors
  var _doors = [];

  // Hack progress
  var _hacking         = false;
  var _hackProgress    = 0;
  var _hackParticles   = [];

  // Reinforcement
  var _reinforceTimer  = 0;
  var _reinforcements  = [];

  // HUD elements
  var _hudTimer        = null;
  var _hudObjPanel     = null;
  var _hudObjItems     = [];
  var _hudAlarm        = null;
  var _hudBreachPrompt = null;
  var _hudInteractPrompt = null;
  var _hudHackBar      = null;
  var _hudHackFill     = null;
  var _hudDebriefing   = null;
  var _hudHackLabel    = null;

  // Stack-on-door
  var _nearDoor        = null;
  var _breachInProgress = false;
  var _breachTimer     = 0;
  var _stackedDoor     = null;

  // Time
  var _elapsed         = 0;

  // ── Utility ──────────────────────────────────────────────────────────────────
  function _v3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _getPlayerPos() {
    if (_camera) return _camera.position;
    return _v3(0, 0, 0);
  }

  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // ── Key handling ─────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (!_keysDown[e.code]) _keysJustDown[e.code] = true;
    _keysDown[e.code] = true;
  }
  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  // ── HUD construction ─────────────────────────────────────────────────────────
  function _buildHUD() {
    // Timer (top center)
    _hudTimer = document.createElement('div');
    _hudTimer.id = 'cr-timer';
    _hudTimer.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'color:#ffffff',
      'text-shadow:0 0 8px #000,0 0 2px #000',
      'z-index:3000',
      'letter-spacing:4px',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudTimer);

    // Left side objective panel
    _hudObjPanel = document.createElement('div');
    _hudObjPanel.id = 'cr-obj-panel';
    _hudObjPanel.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:18px',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #444',
      'border-radius:6px',
      'padding:12px 16px',
      'z-index:3000',
      'pointer-events:none',
      'min-width:320px'
    ].join(';');
    document.body.appendChild(_hudObjPanel);

    var title = document.createElement('div');
    title.style.cssText = 'color:#ff9900;font-family:monospace;font-size:13px;font-weight:bold;letter-spacing:2px;margin-bottom:8px;';
    title.textContent = '[ COMMANDO RAID OBJECTIVES ]';
    _hudObjPanel.appendChild(title);

    _hudObjItems = [];
    for (var i = 0; i < OBJ_LABELS.length; i++) {
      var row = document.createElement('div');
      row.style.cssText = 'font-family:monospace;font-size:12px;color:#888;margin:4px 0;display:flex;align-items:center;gap:8px;';
      var check = document.createElement('span');
      check.style.cssText = 'font-size:14px;width:18px;display:inline-block;text-align:center;';
      check.textContent = '○';
      var label = document.createElement('span');
      label.textContent = OBJ_LABELS[i];
      row.appendChild(check);
      row.appendChild(label);
      _hudObjPanel.appendChild(row);
      _hudObjItems.push({ row: row, check: check, label: label });
    }

    // Alarm banner (hidden by default)
    _hudAlarm = document.createElement('div');
    _hudAlarm.id = 'cr-alarm';
    _hudAlarm.style.cssText = [
      'position:fixed',
      'top:70px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'color:#ff2222',
      'text-shadow:0 0 8px #ff0000',
      'z-index:3001',
      'pointer-events:none',
      'display:none',
      'letter-spacing:3px'
    ].join(';');
    _hudAlarm.textContent = '!! ALARM TRIGGERED !!';
    document.body.appendChild(_hudAlarm);

    // Breach prompt
    _hudBreachPrompt = document.createElement('div');
    _hudBreachPrompt.id = 'cr-breach-prompt';
    _hudBreachPrompt.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:16px',
      'color:#ffdd00',
      'text-shadow:0 0 6px #000',
      'z-index:3000',
      'pointer-events:none',
      'display:none',
      'background:rgba(0,0,0,0.5)',
      'padding:6px 14px',
      'border-radius:4px'
    ].join(';');
    _hudBreachPrompt.textContent = '[C] BREACH ENTRY';
    document.body.appendChild(_hudBreachPrompt);

    // Interact prompt
    _hudInteractPrompt = document.createElement('div');
    _hudInteractPrompt.id = 'cr-interact-prompt';
    _hudInteractPrompt.style.cssText = [
      'position:fixed',
      'bottom:148px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:16px',
      'color:#00ffaa',
      'text-shadow:0 0 6px #000',
      'z-index:3000',
      'pointer-events:none',
      'display:none',
      'background:rgba(0,0,0,0.5)',
      'padding:6px 14px',
      'border-radius:4px'
    ].join(';');
    _hudInteractPrompt.textContent = '[E] HACK SERVER — hold 5s';
    document.body.appendChild(_hudInteractPrompt);

    // Hack progress bar container
    _hudHackBar = document.createElement('div');
    _hudHackBar.style.cssText = [
      'position:fixed',
      'bottom:88px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:260px',
      'height:18px',
      'background:rgba(0,0,0,0.7)',
      'border:2px solid #00ffaa',
      'border-radius:4px',
      'z-index:3000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudHackBar);

    _hudHackFill = document.createElement('div');
    _hudHackFill.style.cssText = [
      'height:100%',
      'background:linear-gradient(90deg,#00ffaa,#00aaff)',
      'width:0%',
      'border-radius:2px',
      'transition:width 0.05s linear'
    ].join(';');
    _hudHackBar.appendChild(_hudHackFill);

    _hudHackLabel = document.createElement('div');
    _hudHackLabel.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'color:#00ffaa',
      'z-index:3000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    _hudHackLabel.textContent = 'UPLOADING DATA...';
    document.body.appendChild(_hudHackLabel);
  }

  function _destroyHUD() {
    var ids = ['cr-timer', 'cr-obj-panel', 'cr-alarm', 'cr-breach-prompt',
               'cr-interact-prompt'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    if (_hudHackBar && _hudHackBar.parentNode) _hudHackBar.parentNode.removeChild(_hudHackBar);
    if (_hudHackFill && _hudHackFill.parentNode) _hudHackFill.parentNode.removeChild(_hudHackFill);
    if (_hudHackLabel && _hudHackLabel.parentNode) _hudHackLabel.parentNode.removeChild(_hudHackLabel);
    if (_hudDebriefing && _hudDebriefing.parentNode) _hudDebriefing.parentNode.removeChild(_hudDebriefing);
    _hudTimer = null;
    _hudObjPanel = null;
    _hudObjItems = [];
    _hudAlarm = null;
    _hudBreachPrompt = null;
    _hudInteractPrompt = null;
    _hudHackBar = null;
    _hudHackFill = null;
    _hudHackLabel = null;
    _hudDebriefing = null;
  }

  function _updateHUD() {
    if (!_hudTimer) return;

    // Timer display
    var t = Math.max(0, Math.ceil(_timeRemaining));
    var mins = Math.floor(t / 60);
    var secs = t % 60;
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    _hudTimer.textContent = timeStr;
    _hudTimer.style.color = (_timeRemaining <= 120) ? '#ff3333' : '#ffffff';

    // Objectives panel
    for (var i = 0; i < _hudObjItems.length; i++) {
      var item = _hudObjItems[i];
      if (_objectiveDone[i]) {
        item.check.textContent = '✓';
        item.check.style.color = '#00ff88';
        item.label.style.color = '#55aa77';
        item.row.style.textDecoration = 'line-through';
      } else if (i === _objectiveIndex) {
        item.check.textContent = '▶';
        item.check.style.color = '#ffdd00';
        item.label.style.color = '#ffffff';
        item.row.style.textDecoration = 'none';
        item.row.style.fontWeight = 'bold';
      } else {
        item.check.textContent = '○';
        item.check.style.color = '#666';
        item.label.style.color = '#666';
        item.row.style.textDecoration = 'none';
        item.row.style.fontWeight = 'normal';
      }
    }
  }

  // ── Scene construction ────────────────────────────────────────────────────────
  function _buildCompound(cx, cz) {
    // Perimeter indicator ring (thin torus on ground)
    var torusGeo = new THREE.TorusGeometry(INFILTRATE_ZONE, 0.15, 8, 48);
    var torusMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6 });
    _compoundPerimeterMesh = new THREE.Mesh(torusGeo, torusMat);
    _compoundPerimeterMesh.position.set(cx, 0.1, cz);
    _compoundPerimeterMesh.rotation.x = -Math.PI / 2;
    _scene.add(_compoundPerimeterMesh);

    // Simple compound building (box)
    var buildGeo = new THREE.BoxGeometry(8, 4, 8);
    var buildMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var building = new THREE.Mesh(buildGeo, buildMat);
    building.position.set(cx, 2, cz);
    _scene.add(building);

    // Door (rotates on breach)
    var doorGeo = new THREE.BoxGeometry(1.5, 3, 0.15);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var doorPivot = new THREE.Group();
    doorPivot.position.set(cx - 0.75, 0, cz + 4);
    var doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0.75, 1.5, 0);
    doorPivot.add(doorMesh);
    _scene.add(doorPivot);
    _doors.push({ pivot: doorPivot, open: false, breaching: false, timer: 0 });
  }

  function _buildServerRack(cx, cz) {
    // Rack frame: 2×3×1 box
    var rackGeo = new THREE.BoxGeometry(2, 3, 1);
    var rackMat = new THREE.MeshLambertMaterial({ color: 0x333344 });
    _serverRack = new THREE.Mesh(rackGeo, rackMat);
    _serverRack.position.set(cx + 1, 1.5, cz - 1);
    _scene.add(_serverRack);

    // Rack panel lines
    var panelGeo = new THREE.BoxGeometry(1.8, 0.1, 0.05);
    var panelMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    for (var i = 0; i < 8; i++) {
      var panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(cx + 1, 0.3 + i * 0.35, cz - 0.46);
      _scene.add(panel);
    }

    // Blinking PointLights
    var lightColors = [COLOR_SERVER_GREEN, COLOR_SERVER_RED, COLOR_SERVER_GREEN];
    for (var j = 0; j < 3; j++) {
      var pl = new THREE.PointLight(lightColors[j], 0.8, 3);
      pl.position.set(cx + 1 + (j - 1) * 0.5, 1.5 + j * 0.6, cz - 0.4);
      _scene.add(pl);
      _serverLights.push({ light: pl, baseColor: lightColors[j], offset: j * 0.33 });
    }
  }

  function _buildExfilZone(ex, ez) {
    _exfilPos = _v3(ex, 0, ez);

    // Green circle on ground
    var ringGeo = new THREE.RingGeometry(5, 5.4, 48);
    var ringMat = new THREE.MeshBasicMaterial({ color: COLOR_EXFIL_RING, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    _exfilRing = new THREE.Mesh(ringGeo, ringMat);
    _exfilRing.position.set(ex, 0.1, ez);
    _exfilRing.rotation.x = -Math.PI / 2;
    _scene.add(_exfilRing);

    // Filled disc
    var discGeo = new THREE.CircleGeometry(5, 48);
    var discMat = new THREE.MeshBasicMaterial({ color: COLOR_EXFIL_RING, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    var disc = new THREE.Mesh(discGeo, discMat);
    disc.position.set(ex, 0.05, ez);
    disc.rotation.x = -Math.PI / 2;
    _scene.add(disc);
  }

  function _buildGuards(cx, cz) {
    _guards = [];
    for (var i = 0; i < NUM_GUARDS; i++) {
      var angle = (i / NUM_GUARDS) * Math.PI * 2;
      var r = 7 + Math.random() * 4;
      var gx = cx + Math.cos(angle) * r;
      var gz = cz + Math.sin(angle) * r;

      var guardGroup = new THREE.Group();

      // Body
      var bodyGeo = new THREE.BoxGeometry(0.7, 1.2, 0.4);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x556633 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.8;
      guardGroup.add(body);

      // Head
      var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var headMat = new THREE.MeshLambertMaterial({ color: 0xcc9966 });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.65;
      guardGroup.add(head);

      // Red X marker above guard
      var markerGroup = new THREE.Group();
      var markerMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });

      var bar1Geo = new THREE.BoxGeometry(0.6, 0.08, 0.08);
      var bar1 = new THREE.Mesh(bar1Geo, markerMat);
      bar1.rotation.z = Math.PI / 4;
      markerGroup.add(bar1);

      var bar2Geo = new THREE.BoxGeometry(0.6, 0.08, 0.08);
      var bar2 = new THREE.Mesh(bar2Geo, markerMat);
      bar2.rotation.z = -Math.PI / 4;
      markerGroup.add(bar2);

      markerGroup.position.set(0, 2.4, 0);
      guardGroup.add(markerGroup);

      guardGroup.position.set(gx, 0, gz);
      _scene.add(guardGroup);

      _guards.push({
        group: guardGroup,
        marker: markerGroup,
        alive: true,
        patrolAngle: angle,
        patrolRadius: r,
        patrolSpeed: 0.3 + Math.random() * 0.2,
        cx: cx,
        cz: cz,
        alertTimer: 0,
        alerted: false,
        firing: false,
        fireTimer: 0
      });
    }
  }

  function _buildCommandos(cx, cz) {
    _commandos = [];
    var offsets = [{ x: -2, z: -2 }, { x: 2, z: -2 }];
    for (var i = 0; i < 2; i++) {
      var group = new THREE.Group();

      // Body (black gear)
      var bodyGeo = new THREE.BoxGeometry(0.65, 1.2, 0.38);
      var bodyMat = new THREE.MeshLambertMaterial({ color: COLOR_COMMANDO });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.8;
      group.add(body);

      // Head with balaclava
      var headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
      var headMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.62;
      group.add(head);

      // Weapon
      var weapGeo = new THREE.BoxGeometry(0.08, 0.08, 0.7);
      var weapMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var weap = new THREE.Mesh(weapGeo, weapMat);
      weap.position.set(0.35, 1.0, 0.35);
      group.add(weap);

      var px = cx + offsets[i].x;
      var pz = cz + offsets[i].z;
      group.position.set(px, 0, pz);
      _scene.add(group);

      _commandos.push({
        group: group,
        index: i,
        offset: offsets[i],
        stacked: false,
        stackSide: i === 0 ? -1 : 1,
        suppressTarget: null
      });
    }
  }

  function _buildHelicopter(ex, ez) {
    _helicopter = new THREE.Group();

    // Fuselage
    var fuseGeo = new THREE.BoxGeometry(2, 1, 5);
    var fuseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var fuse = new THREE.Mesh(fuseGeo, fuseMat);
    fuse.position.y = 0;
    _helicopter.add(fuse);

    // Tail boom
    var tailGeo = new THREE.BoxGeometry(0.4, 0.4, 3);
    var tail = new THREE.Mesh(tailGeo, fuseMat);
    tail.position.set(0, 0.2, -3.5);
    _helicopter.add(tail);

    // Main rotor
    var rotorGeo = new THREE.BoxGeometry(8, 0.1, 0.3);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    _heliRotorTop = new THREE.Mesh(rotorGeo, rotorMat);
    _heliRotorTop.position.y = 0.65;
    _helicopter.add(_heliRotorTop);

    // Tail rotor
    var tailRotGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
    _heliRotorTail = new THREE.Mesh(tailRotGeo, rotorMat);
    _heliRotorTail.position.set(0.28, 0.4, -5);
    _helicopter.add(_heliRotorTail);

    // Landing skids
    var skidGeo = new THREE.BoxGeometry(2.4, 0.1, 3);
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var skidL = new THREE.Mesh(skidGeo, skidMat);
    skidL.position.set(-0.8, -0.6, 0);
    _helicopter.add(skidL);
    var skidR = new THREE.Mesh(skidGeo, skidMat);
    skidR.position.set(0.8, -0.6, 0);
    _helicopter.add(skidR);

    _helicopter.position.set(ex, 12, ez - 30);
    _scene.add(_helicopter);
  }

  // ── Guard AI ──────────────────────────────────────────────────────────────────
  function _updateGuards(delta) {
    var player = _getPlayerPos();
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;

      // Patrol around compound
      g.patrolAngle += delta * g.patrolSpeed;
      var tx = g.cx + Math.cos(g.patrolAngle) * g.patrolRadius;
      var tz = g.cz + Math.sin(g.patrolAngle) * g.patrolRadius;
      g.group.position.x = tx;
      g.group.position.z = tz;

      // Face patrol direction
      var dx = Math.cos(g.patrolAngle + 0.01) * g.patrolRadius - (tx - g.cx);
      var dz = Math.sin(g.patrolAngle + 0.01) * g.patrolRadius - (tz - g.cz);
      if (Math.abs(dx) + Math.abs(dz) > 0.01) {
        g.group.rotation.y = Math.atan2(dx, dz);
      }

      // Marker bob
      if (g.marker) {
        g.marker.position.y = 2.4 + Math.sin(_elapsed * 2 + i) * 0.1;
        g.marker.rotation.y = _elapsed * 0.5;
      }

      // Detection: check if guard sees player during INFILTRATE objective
      if (_objectiveIndex === OBJ_INFILTRATE && !_objectiveDone[OBJ_INFILTRATE]) {
        var pd = _dist2D(tx, tz, player.x, player.z);
        if (pd < 10) {
          g.alerted = true;
          if (!_alarmTriggered) _triggerAlarm();
        }
      }

      // Cover fire: fire at guard if commanded by commando
      g.fireTimer -= delta;
      if (g.alerted && g.fireTimer <= 0) {
        g.firing = true;
        g.fireTimer = 2 + Math.random() * 2;
      }

      // Player can "shoot" guard by proximity when aiming (simplified: guard dies after alarm suppression)
      var guardDist = _dist2D(tx, tz, player.x, player.z);
      if (guardDist < 2 && _keysJustDown['Mouse0']) {
        _killGuard(i);
      }
    }
  }

  function _killGuard(idx) {
    var g = _guards[idx];
    if (!g || !g.alive) return;
    g.alive = false;
    if (g.marker) {
      g.group.remove(g.marker);
    }
    g.group.visible = false;
    _checkNeutralizeObjective();
  }

  function _checkNeutralizeObjective() {
    if (_objectiveDone[OBJ_NEUTRALIZE]) return;
    var deadCount = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (!_guards[i].alive) deadCount++;
    }
    if (deadCount >= NUM_GUARDS) {
      _completeObjective(OBJ_NEUTRALIZE);
    }
  }

  // ── Commando AI ───────────────────────────────────────────────────────────────
  function _updateCommandos(delta) {
    var player = _getPlayerPos();

    for (var i = 0; i < _commandos.length; i++) {
      var c = _commandos[i];

      if (c.stacked) {
        // Stack on door: hold position beside door
        if (_stackedDoor) {
          var dp = _stackedDoor.pivot.position;
          c.group.position.x += (dp.x + c.stackSide * 1.2 - c.group.position.x) * delta * 4;
          c.group.position.z += (dp.z - 0.5 - c.group.position.z) * delta * 4;
        }
        continue;
      }

      // Wedge formation follow
      var angle = (i === 0) ? Math.PI * 0.85 : Math.PI * 1.15;
      var followDist = COMMANDO_FOLLOW_DIST + i * 1.5;
      var tx = player.x + Math.sin(angle) * followDist;
      var tz = player.z + Math.cos(angle) * followDist;

      c.group.position.x += (tx - c.group.position.x) * delta * 3;
      c.group.position.z += (tz - c.group.position.z) * delta * 3;

      // Face player direction
      var fx = player.x - c.group.position.x;
      var fz = player.z - c.group.position.z;
      if (Math.abs(fx) + Math.abs(fz) > 0.01) {
        c.group.rotation.y = Math.atan2(fx, fz);
      }

      // Cover fire: aim at nearest alive guard
      if (_alarmTriggered) {
        var nearestGuard = null;
        var nearestDist = Infinity;
        for (var j = 0; j < _guards.length; j++) {
          if (!_guards[j].alive) continue;
          var gd = _dist2D(
            _guards[j].group.position.x, _guards[j].group.position.z,
            c.group.position.x, c.group.position.z
          );
          if (gd < nearestDist) { nearestDist = gd; nearestGuard = j; }
        }
        if (nearestGuard !== null && nearestDist < 20) {
          c.suppressTarget = nearestGuard;
          // Auto-kill suppressed guard after a delay (simulated cover fire)
          var sg = _guards[nearestGuard];
          sg.fireTimer -= delta * 3; // commandos suppress faster
          if (sg.fireTimer <= -3) {
            _killGuard(nearestGuard);
            c.suppressTarget = null;
          }
        }
      }
    }
  }

  function _stackCommandosOnDoor(door) {
    _stackedDoor = door;
    for (var i = 0; i < _commandos.length; i++) {
      _commandos[i].stacked = true;
    }
  }

  function _unstackCommandos() {
    _stackedDoor = null;
    for (var i = 0; i < _commandos.length; i++) {
      _commandos[i].stacked = false;
    }
  }

  // ── Objectives ────────────────────────────────────────────────────────────────
  function _completeObjective(idx) {
    if (_objectiveDone[idx]) return;
    _objectiveDone[idx] = true;
    if (idx === _objectiveIndex && _objectiveIndex < 3) {
      _objectiveIndex = idx + 1;
    }
    _flashObjective(idx);

    if (idx === OBJ_EXFIL) {
      _completeMission();
    }
  }

  function _flashObjective(idx) {
    if (!_hudObjItems[idx]) return;
    var item = _hudObjItems[idx];
    var count = 0;
    var iv = setInterval(function () {
      item.row.style.background = (count % 2 === 0) ? 'rgba(0,255,136,0.2)' : 'transparent';
      count++;
      if (count > 5) { clearInterval(iv); item.row.style.background = 'transparent'; }
    }, 150);
  }

  // ── Alarm ─────────────────────────────────────────────────────────────────────
  function _triggerAlarm() {
    if (_alarmTriggered) return;
    _alarmTriggered = true;
    _noAlarm = false;

    if (_hudAlarm) {
      _hudAlarm.style.display = 'block';
      var blinkCount = 0;
      var blinkIv = setInterval(function () {
        if (!_hudAlarm) { clearInterval(blinkIv); return; }
        _hudAlarm.style.opacity = (blinkCount % 2 === 0) ? '1' : '0.3';
        blinkCount++;
        if (blinkCount > 8) { clearInterval(blinkIv); if (_hudAlarm) _hudAlarm.style.opacity = '1'; }
      }, 200);
    }

    // Apply time penalty (deferred so it doesn't immediately double-apply)
    _alarmPenaltyApplied = false;
  }

  function _applyAlarmPenalty() {
    if (_alarmPenaltyApplied) return;
    _alarmPenaltyApplied = true;
    _timeRemaining = Math.max(10, _timeRemaining - ALARM_TIME_PENALTY);
  }

  // ── Reinforcements ────────────────────────────────────────────────────────────
  function _spawnReinforcement() {
    var angle = Math.random() * Math.PI * 2;
    var dist = 20 + Math.random() * 15;
    var rx = _compoundX + Math.cos(angle) * dist;
    var rz = _compoundZ + Math.sin(angle) * dist;

    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.7, 1.2, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xcc9966 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.65;
    group.add(head);

    group.position.set(rx, 0, rz);
    _scene.add(group);

    _reinforcements.push({
      group: group,
      alive: true,
      patrolAngle: angle,
      patrolRadius: dist,
      cx: _compoundX,
      cz: _compoundZ
    });
  }

  function _updateReinforcements(delta) {
    var player = _getPlayerPos();
    for (var i = 0; i < _reinforcements.length; i++) {
      var r = _reinforcements[i];
      if (!r.alive) continue;
      // Move toward player
      var dx = player.x - r.group.position.x;
      var dz = player.z - r.group.position.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0.5) {
        r.group.position.x += (dx / len) * delta * 2.5;
        r.group.position.z += (dz / len) * delta * 2.5;
        r.group.rotation.y = Math.atan2(dx, dz);
      }
      // Kill on proximity (player shoots back - simplified)
      if (len < 2 && _keysJustDown['Mouse0']) {
        r.alive = false;
        r.group.visible = false;
      }
    }
  }

  // ── Server rack interaction ───────────────────────────────────────────────────
  function _updateServerInteraction(delta) {
    if (_objectiveDone[OBJ_SECURE] || _objectiveIndex !== OBJ_SECURE) {
      if (_hudInteractPrompt) _hudInteractPrompt.style.display = 'none';
      if (_hudHackBar) _hudHackBar.style.display = 'none';
      if (_hudHackLabel) _hudHackLabel.style.display = 'none';
      return;
    }

    if (!_serverRack) return;
    var player = _getPlayerPos();
    var sd = player.distanceTo(_serverRack.position);
    var inRange = sd < 4;

    if (_hudInteractPrompt) _hudInteractPrompt.style.display = inRange && !_hacking ? 'block' : 'none';

    if (inRange && _keysDown[INTERACT_KEY]) {
      _hacking = true;
      if (_hudInteractPrompt) _hudInteractPrompt.style.display = 'none';
      if (_hudHackBar) _hudHackBar.style.display = 'block';
      if (_hudHackLabel) _hudHackLabel.style.display = 'block';

      _hackProgress += delta / HACK_DURATION;
      _hackProgress = _clamp(_hackProgress, 0, 1);

      if (_hudHackFill) _hudHackFill.style.width = (_hackProgress * 100) + '%';

      // Upload particles
      _spawnHackParticle();

      if (_hackProgress >= 1) {
        _hacking = false;
        if (_hudHackBar) _hudHackBar.style.display = 'none';
        if (_hudHackLabel) _hudHackLabel.style.display = 'none';
        _completeObjective(OBJ_SECURE);
      }
    } else {
      if (!inRange) {
        _hacking = false;
        _hackProgress = 0;
        if (_hudHackFill) _hudHackFill.style.width = '0%';
        if (_hudHackBar) _hudHackBar.style.display = 'none';
        if (_hudHackLabel) _hudHackLabel.style.display = 'none';
      }
    }
  }

  function _spawnHackParticle() {
    if (!_serverRack) return;
    var geo = new THREE.SphereGeometry(0.05, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    var p = new THREE.Mesh(geo, mat);
    p.position.copy(_serverRack.position);
    p.position.x += (Math.random() - 0.5) * 1.5;
    p.position.z += (Math.random() - 0.5) * 0.5;
    p.userData.vel = _v3((Math.random() - 0.5) * 0.5, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 0.5);
    p.userData.life = 1 + Math.random();
    p.userData.age = 0;
    _scene.add(p);
    _hackParticles.push(p);
  }

  function _updateHackParticles(delta) {
    for (var i = _hackParticles.length - 1; i >= 0; i--) {
      var p = _hackParticles[i];
      p.userData.age += delta;
      p.position.x += p.userData.vel.x * delta;
      p.position.y += p.userData.vel.y * delta;
      p.position.z += p.userData.vel.z * delta;
      p.material.opacity = 1 - p.userData.age / p.userData.life;
      p.material.transparent = true;
      if (p.userData.age >= p.userData.life) {
        _scene.remove(p);
        _hackParticles.splice(i, 1);
      }
    }
  }

  // ── Server rack lights ────────────────────────────────────────────────────────
  function _updateServerLights(delta) {
    _serverLightTimer += delta;
    if (_serverLightTimer >= SERVER_LIGHT_BLINK) {
      _serverLightTimer = 0;
      _serverLightState = !_serverLightState;
      for (var i = 0; i < _serverLights.length; i++) {
        var sl = _serverLights[i];
        sl.light.color.setHex(_serverLightState ? sl.baseColor : 0x000000);
        sl.light.intensity = _serverLightState ? 0.8 : 0;
      }
    }
  }

  // ── Helicopter update ─────────────────────────────────────────────────────────
  function _updateHelicopter(delta) {
    if (!_helicopter) return;
    if (_heliRotorTop) _heliRotorTop.rotation.y += delta * 15;
    if (_heliRotorTail) _heliRotorTail.rotation.x += delta * 20;

    // Fly in toward exfil point after EXFIL triggered
    if (_exfilPos && _objectiveDone[OBJ_EXFIL]) {
      var targetX = _exfilPos.x;
      var targetY = 3;
      var targetZ = _exfilPos.z;
      _helicopter.position.x += (targetX - _helicopter.position.x) * delta * 0.5;
      _helicopter.position.y += (targetY - _helicopter.position.y) * delta * 0.5;
      _helicopter.position.z += (targetZ - _helicopter.position.z) * delta * 0.5;
    }
  }

  // ── Door breach ───────────────────────────────────────────────────────────────
  function _checkDoorProximity() {
    if (_doors.length === 0) return;
    var player = _getPlayerPos();
    _nearDoor = null;
    for (var i = 0; i < _doors.length; i++) {
      var door = _doors[i];
      if (door.open) continue;
      var dp = door.pivot.position;
      var dd = _dist2D(dp.x, dp.z, player.x, player.z);
      if (dd < 4) {
        _nearDoor = door;
        break;
      }
    }
    if (_hudBreachPrompt) {
      _hudBreachPrompt.style.display = (_nearDoor && !_breachInProgress) ? 'block' : 'none';
    }
  }

  function _startBreach() {
    if (!_nearDoor || _nearDoor.open || _breachInProgress) return;
    _breachInProgress = true;
    _breachTimer = 0;
    _stackCommandosOnDoor(_nearDoor);
    _hudBreachPrompt.style.display = 'none';
  }

  function _updateBreach(delta) {
    if (!_breachInProgress) return;
    _breachTimer += delta;

    // Swing door open
    if (_nearDoor && !_nearDoor.open) {
      var progress = _clamp(_breachTimer / DOOR_BREACH_TIME, 0, 1);
      _nearDoor.pivot.rotation.y = progress * (-Math.PI / 2);
      if (progress >= 1) {
        _nearDoor.open = true;
        _breachInProgress = false;
        _unstackCommandos();
        _throwFlashGrenade(_nearDoor.pivot.position);
      }
    }
  }

  function _throwFlashGrenade(pos) {
    // Visual flash (simple sphere that fades)
    var geo = new THREE.SphereGeometry(0.15, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var flash = new THREE.Mesh(geo, mat);
    flash.position.set(pos.x, 1.2, pos.z + 2);
    _scene.add(flash);

    // Flash expand and fade
    var age = 0;
    var expand = setInterval(function () {
      age += 0.05;
      var s = 1 + age * 10;
      flash.scale.set(s, s, s);
      flash.material.opacity = Math.max(0, 1 - age * 2);
      flash.material.transparent = true;
      if (age >= 0.5) {
        clearInterval(expand);
        _scene.remove(flash);
      }
    }, 50);
  }

  // ── Mission objectives checks ─────────────────────────────────────────────────
  function _checkInfiltrate() {
    if (_objectiveDone[OBJ_INFILTRATE] || _objectiveIndex !== OBJ_INFILTRATE) return;
    var player = _getPlayerPos();
    var d = _dist2D(player.x, player.z, _compoundX, _compoundZ);
    if (d <= INFILTRATE_ZONE) {
      _completeObjective(OBJ_INFILTRATE);
    }
  }

  function _checkExfil() {
    if (_objectiveDone[OBJ_EXFIL] || _objectiveIndex !== OBJ_EXFIL) return;
    if (!_exfilPos) return;
    var player = _getPlayerPos();
    var d = _dist2D(player.x, player.z, _exfilPos.x, _exfilPos.z);
    if (d <= 5) {
      _completeObjective(OBJ_EXFIL);
    }
  }

  // ── Mission complete / fail ───────────────────────────────────────────────────
  function _completeMission() {
    if (_missionComplete) return;
    _missionComplete = true;

    var timeUsed = MISSION_DURATION - _timeRemaining;
    _ghostRaid = (_noAlarm && timeUsed <= GHOST_THRESHOLD);
    var bonus = _ghostRaid ? GHOST_BONUS : 0;
    _score += bonus;

    _showDebriefing(timeUsed, bonus);
  }

  function _failMission() {
    if (_missionFailed || _missionComplete) return;
    _missionFailed = true;
    _showDebriefing(MISSION_DURATION, 0, true);
  }

  function _showDebriefing(timeUsed, bonus, failed) {
    if (_hudDebriefing) return;

    var mins = Math.floor(timeUsed / 60);
    var secs = Math.floor(timeUsed % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var objCount = 0;
    for (var i = 0; i < _objectiveDone.length; i++) {
      if (_objectiveDone[i]) objCount++;
    }

    _hudDebriefing = document.createElement('div');
    _hudDebriefing.id = 'cr-debrief';
    _hudDebriefing.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.92)',
      'border:2px solid ' + (failed ? '#ff3333' : '#00ff88'),
      'border-radius:8px',
      'padding:32px 48px',
      'z-index:4000',
      'text-align:center',
      'min-width:380px',
      'pointer-events:auto'
    ].join(';');

    var html = '';
    html += '<div style="font-family:monospace;font-size:22px;font-weight:bold;color:' + (failed ? '#ff3333' : '#00ff88') + ';letter-spacing:3px;margin-bottom:18px;">';
    html += failed ? 'MISSION FAILED' : 'MISSION COMPLETE';
    html += '</div>';

    if (_ghostRaid) {
      html += '<div style="font-family:monospace;font-size:16px;color:#ffdd00;margin-bottom:14px;letter-spacing:2px;">★ GHOST RAID ★</div>';
    }

    html += '<div style="font-family:monospace;font-size:14px;color:#cccccc;line-height:2;">';
    html += 'TIME USED: ' + timeStr + '<br>';
    html += 'OBJECTIVES: ' + objCount + '/4<br>';
    html += 'ALARM TRIGGERED: ' + (_alarmTriggered ? 'YES' : 'NO') + '<br>';
    if (bonus > 0) {
      html += 'GHOST BONUS: +' + bonus + '<br>';
    }
    html += 'TOTAL SCORE: ' + _score + '<br>';
    html += '</div>';

    html += '<div style="margin-top:22px;">';
    html += '<button id="cr-debrief-close" style="font-family:monospace;font-size:14px;background:#333;color:#fff;border:1px solid #666;padding:8px 24px;border-radius:4px;cursor:pointer;letter-spacing:2px;">CLOSE</button>';
    html += '</div>';

    _hudDebriefing.innerHTML = html;
    document.body.appendChild(_hudDebriefing);

    var closeBtn = document.getElementById('cr-debrief-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (_hudDebriefing && _hudDebriefing.parentNode) {
          _hudDebriefing.parentNode.removeChild(_hudDebriefing);
          _hudDebriefing = null;
        }
      });
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera || (window.GameManager && window.GameManager.getCamera && window.GameManager.getCamera()) || null;
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function startRaid(cx, cz) {
    reset();

    _compoundX = cx || 0;
    _compoundZ = cz || 0;
    _active = true;
    _timeRemaining = MISSION_DURATION;
    _objectiveIndex = OBJ_INFILTRATE;
    _objectiveDone = [false, false, false, false];
    _alarmTriggered = false;
    _noAlarm = true;
    _missionComplete = false;
    _missionFailed = false;
    _score = 0;
    _hackProgress = 0;
    _hacking = false;

    var ex = _compoundX + (Math.random() > 0.5 ? 1 : -1) * EXFIL_DIST;
    var ez = _compoundZ + (Math.random() > 0.5 ? 1 : -1) * EXFIL_DIST * 0.6;

    _buildCompound(_compoundX, _compoundZ);
    _buildServerRack(_compoundX, _compoundZ);
    _buildExfilZone(ex, ez);
    _buildGuards(_compoundX, _compoundZ);
    _buildCommandos(_compoundX + 10, _compoundZ + 10);
    _buildHelicopter(ex, ez);
    _buildHUD();
  }

  function update(delta) {
    if (!_active || _missionComplete || _missionFailed) {
      // Still spin heli rotors if present
      if (_heliRotorTop) _heliRotorTop.rotation.y += delta * 15;
      if (_heliRotorTail) _heliRotorTail.rotation.x += delta * 20;
      return;
    }

    _elapsed += delta;

    // Countdown
    _timeRemaining -= delta;
    if (_timeRemaining <= 0 && !_missionFailed) {
      _failMission();
      return;
    }

    // Apply alarm time penalty once (frame after alarm triggers)
    if (_alarmTriggered && !_alarmPenaltyApplied) {
      _applyAlarmPenalty();
    }

    // Reinforcement waves
    if (_alarmTriggered && !_objectiveDone[OBJ_EXFIL]) {
      _reinforceTimer += delta;
      if (_reinforceTimer >= REINFORCE_INTERVAL) {
        _reinforceTimer = 0;
        _spawnReinforcement();
        _spawnReinforcement();
      }
    }

    // Exfil ring pulse
    if (_exfilRing) {
      _exfilRing.material.opacity = 0.5 + Math.sin(_elapsed * 3) * 0.3;
    }

    // Perimeter ring pulse
    if (_compoundPerimeterMesh) {
      _compoundPerimeterMesh.material.opacity = 0.3 + Math.sin(_elapsed * 2) * 0.2;
    }

    _updateGuards(delta);
    _updateCommandos(delta);
    _updateReinforcements(delta);
    _updateServerLights(delta);
    _updateServerInteraction(delta);
    _updateHackParticles(delta);
    _updateHelicopter(delta);
    _updateBreach(delta);
    _checkDoorProximity();
    _checkInfiltrate();
    _checkExfil();
    _updateHUD();

    // Breach key
    if (_keysJustDown[BREACH_KEY] && _nearDoor) {
      _startBreach();
    }

    // Clear just-down keys
    _keysJustDown = {};
  }

  function getRaidStatus() {
    return {
      active: _active,
      timeRemaining: _timeRemaining,
      objectiveIndex: _objectiveIndex,
      objectiveDone: _objectiveDone.slice(),
      alarmTriggered: _alarmTriggered,
      guardsAlive: _guards.filter(function (g) { return g.alive; }).length,
      guardsTotal: NUM_GUARDS,
      hackProgress: _hackProgress,
      missionComplete: _missionComplete,
      missionFailed: _missionFailed,
      ghostRaid: _ghostRaid,
      score: _score
    };
  }

  function reset() {
    _active = false;
    _elapsed = 0;
    _missionTimer = 0;
    _timeRemaining = MISSION_DURATION;
    _objectiveIndex = 0;
    _objectiveDone = [false, false, false, false];
    _alarmTriggered = false;
    _alarmPenaltyApplied = false;
    _noAlarm = true;
    _ghostRaid = false;
    _missionComplete = false;
    _missionFailed = false;
    _score = 0;
    _hackProgress = 0;
    _hacking = false;
    _reinforceTimer = 0;
    _breachInProgress = false;
    _breachTimer = 0;
    _nearDoor = null;
    _stackedDoor = null;

    // Remove scene objects
    if (_scene) {
      var toRemove = [];

      if (_compoundPerimeterMesh) toRemove.push(_compoundPerimeterMesh);
      if (_serverRack) toRemove.push(_serverRack);
      if (_exfilRing) toRemove.push(_exfilRing);
      if (_helicopter) toRemove.push(_helicopter);

      for (var i = 0; i < _guards.length; i++) {
        if (_guards[i].group) toRemove.push(_guards[i].group);
      }
      for (var j = 0; j < _commandos.length; j++) {
        if (_commandos[j].group) toRemove.push(_commandos[j].group);
      }
      for (var k = 0; k < _reinforcements.length; k++) {
        if (_reinforcements[k].group) toRemove.push(_reinforcements[k].group);
      }
      for (var l = 0; l < _doors.length; l++) {
        if (_doors[l].pivot) toRemove.push(_doors[l].pivot);
      }
      for (var m = 0; m < _serverLights.length; m++) {
        if (_serverLights[m].light) toRemove.push(_serverLights[m].light);
      }
      for (var n = 0; n < _hackParticles.length; n++) {
        toRemove.push(_hackParticles[n]);
      }

      for (var r = 0; r < toRemove.length; r++) {
        _scene.remove(toRemove[r]);
      }
    }

    _guards = [];
    _commandos = [];
    _reinforcements = [];
    _doors = [];
    _serverLights = [];
    _hackParticles = [];
    _serverRack = null;
    _exfilRing = null;
    _exfilPos = null;
    _helicopter = null;
    _heliRotorTop = null;
    _heliRotorTail = null;
    _compoundPerimeterMesh = null;

    _destroyHUD();
    _keysJustDown = {};
  }

  return {
    init: init,
    update: update,
    startRaid: startRaid,
    getRaidStatus: getRaidStatus,
    reset: reset
  };

})();
