// ambush-system.js — Three.js FPS Ambush Setup, Triggering & Counter-Ambush Module
// Pure browser JS, no build step. THREE must be available as a global.

window.AmbushSystem = (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var MAX_MARKERS = 6;
  var KILL_ZONE_ENTER_THRESHOLD = 3;    // enemies needed to trigger
  var AUTO_AIM_DURATION = 3000;         // ms
  var TRIGGER_FLASH_DURATION = 300;     // ms
  var COUNTER_AMBUSH_RADIUS = 5;        // units — enemy detection radius for counter-ambush
  var COUNTER_AMBUSH_DIR_THRESHOLD = 3; // directions needed
  var REINFORCE_DELAY = 15000;          // ms before reinforcements spawn
  var MAX_LOG_ENTRIES = 5;
  var SCORE_PERFECT = 500;
  var SCORE_PARTIAL = 100;
  var SCORE_BROKEN = -200;
  var PULSE_SPEED = 3.0;                // radians/s for marker pulse

  // Ambush types
  var AMBUSH_TYPE = {
    LINEAR:    'LINEAR',
    L_SHAPE:   'L-SHAPE',
    HORSESHOE: 'HORSESHOE',
    POINT:     'POINT'
  };

  // ─── State ────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var playerRef = null;

  var inSetupMode = false;
  var markers = [];             // THREE.Mesh cones placed in world
  var markerPositions = [];     // THREE.Vector3 positions of markers
  var killZoneOutline = null;   // THREE.LineSegments
  var killZoneSet = false;

  var ambushTriggered = false;
  var triggerFlashTimer = 0;
  var autoAimActive = false;
  var autoAimTimer = 0;
  var reinforceTimer = 0;
  var reinforceScheduled = false;

  var ambushLog = [];
  var totalScore = 0;
  var currentAmbushType = AMBUSH_TYPE.LINEAR;
  var currentAmbushStartTime = 0;

  // Counter-ambush state
  var counterAmbushAlerts = [];  // { direction: string, mesh: THREE.Mesh }
  var navArrows = [];            // THREE.Mesh cover nav arrows
  var counterAmbushActive = false;

  // Key tracking
  var keysDown = {};

  // HUD elements
  var hudEl = null;
  var logPanelEl = null;
  var logPanelVisible = false;
  var contactAlertEl = null;

  // Materials reused
  var markerMat = null;
  var markerFlashMat = null;
  var lineMat = null;
  var arrowMat = null;

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init(threeScene, threeCamera, playerObject) {
    scene     = threeScene  || null;
    camera    = threeCamera || null;
    playerRef = playerObject || null;

    _buildMaterials();
    _buildHUD();
    _attachKeyListeners();

    console.log('[AmbushSystem] Initialised. A+M = setup mode, Shift+A = view log.');
  }

  // ─── Materials ────────────────────────────────────────────────────────────
  function _buildMaterials() {
    markerMat = new THREE.MeshBasicMaterial({ color: 0xff1111, transparent: true, opacity: 0.9 });
    markerFlashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
    lineMat = new THREE.LineDashedMaterial({
      color: 0xff0000,
      dashSize: 0.4,
      gapSize: 0.2,
      linewidth: 1
    });
    arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 });
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function _buildHUD() {
    // Main ambush status indicator (top-left)
    hudEl = document.createElement('div');
    hudEl.id = 'ambush-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'padding:6px 12px',
      'background:rgba(0,0,0,0.65)',
      'color:#ff3333',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'border:1px solid #ff3333',
      'border-radius:3px',
      'display:none',
      'z-index:9000',
      'text-transform:uppercase',
      'letter-spacing:0.08em'
    ].join(';');
    document.body.appendChild(hudEl);

    // Log panel
    logPanelEl = document.createElement('div');
    logPanelEl.id = 'ambush-log-panel';
    logPanelEl.style.cssText = [
      'position:fixed',
      'top:50px',
      'left:12px',
      'padding:10px 16px',
      'background:rgba(0,0,0,0.80)',
      'color:#ffcc00',
      'font-family:monospace',
      'font-size:12px',
      'border:1px solid #ffcc00',
      'border-radius:3px',
      'display:none',
      'z-index:9001',
      'min-width:260px',
      'max-width:360px'
    ].join(';');
    logPanelEl.innerHTML = '<b>-- AMBUSH LOG --</b><br/>(no entries)';
    document.body.appendChild(logPanelEl);

    // Contact alert (centre-screen)
    contactAlertEl = document.createElement('div');
    contactAlertEl.id = 'ambush-contact-alert';
    contactAlertEl.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'padding:10px 22px',
      'background:rgba(180,0,0,0.80)',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'border:2px solid #ff4444',
      'border-radius:4px',
      'display:none',
      'z-index:9100',
      'text-align:center',
      'text-transform:uppercase',
      'letter-spacing:0.12em'
    ].join(';');
    document.body.appendChild(contactAlertEl);
  }

  function _updateHUD() {
    if (!hudEl) return;

    if (inSetupMode) {
      hudEl.style.display = 'block';
      if (killZoneSet) {
        hudEl.textContent = 'AMBUSH SET';
        hudEl.style.color = '#33ff33';
        hudEl.style.borderColor = '#33ff33';
      } else {
        hudEl.textContent = 'AMBUSH READY [' + markers.length + ' marker' + (markers.length !== 1 ? 's' : '') + ']';
        hudEl.style.color = '#ff3333';
        hudEl.style.borderColor = '#ff3333';
      }
    } else if (autoAimActive) {
      hudEl.style.display = 'block';
      hudEl.style.color = '#ffff00';
      hudEl.style.borderColor = '#ffff00';
      hudEl.textContent = 'AUTO-AIM ACTIVE ' + Math.ceil(autoAimTimer / 1000) + 's';
    } else {
      hudEl.style.display = 'none';
    }
  }

  function _showContactAlert(lines) {
    if (!contactAlertEl) return;
    contactAlertEl.innerHTML = lines.join('<br/>');
    contactAlertEl.style.display = 'block';
    clearTimeout(contactAlertEl._hideTimer);
    contactAlertEl._hideTimer = setTimeout(function () {
      if (contactAlertEl) contactAlertEl.style.display = 'none';
    }, 4000);
  }

  function _refreshLogPanel() {
    if (!logPanelEl) return;
    if (ambushLog.length === 0) {
      logPanelEl.innerHTML = '<b>-- AMBUSH LOG --</b><br/>(no entries)';
      return;
    }
    var html = '<b>-- AMBUSH LOG (last ' + ambushLog.length + ') --</b><br/>';
    for (var i = ambushLog.length - 1; i >= 0; i--) {
      var entry = ambushLog[i];
      var scoreColor = entry.score >= 0 ? '#33ff33' : '#ff4444';
      html += '<div style="margin-top:5px;border-top:1px solid #555;padding-top:4px">';
      html += '<span style="color:#aaa">' + new Date(entry.time).toLocaleTimeString() + '</span> ';
      html += '<b style="color:#ffcc00">' + entry.type + '</b> | ';
      html += 'Kills: <b>' + entry.kills + '</b> | ';
      html += 'Score: <b style="color:' + scoreColor + '">' + (entry.score >= 0 ? '+' : '') + entry.score + '</b>';
      html += '</div>';
    }
    logPanelEl.innerHTML = html;
  }

  // ─── Key listeners ────────────────────────────────────────────────────────
  function _attachKeyListeners() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('click',   _onWorldClick);
  }

  function _onKeyDown(e) {
    keysDown[e.code] = true;
    keysDown[e.key]  = true;

    // A+M = toggle setup mode
    if ((keysDown['KeyA'] || keysDown['a'] || keysDown['A']) &&
        (keysDown['KeyM'] || keysDown['m'] || keysDown['M'])) {
      _toggleSetupMode();
    }

    // Shift+A = toggle log panel
    if (e.shiftKey && (e.code === 'KeyA' || e.key === 'A' || e.key === 'a')) {
      _toggleLogPanel();
    }
  }

  function _onKeyUp(e) {
    keysDown[e.code] = false;
    keysDown[e.key]  = false;
  }

  // Click in setup mode places a marker at a simulated world position
  function _onWorldClick(e) {
    if (!inSetupMode || killZoneSet) return;
    if (markers.length >= MAX_MARKERS) {
      console.log('[AmbushSystem] Max markers placed.');
      return;
    }
    // Derive a world position: shoot ray from camera if available, else use
    // random position in front of camera/player for testing.
    var pos = _getPlacementPosition(e);
    if (pos) _placeMarker(pos);
  }

  function _getPlacementPosition(mouseEvent) {
    if (!scene || !camera) {
      // Fallback: random position near origin for headless testing
      return new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20
      );
    }

    var mouse = new THREE.Vector2(
      (mouseEvent.clientX / window.innerWidth)  * 2 - 1,
      -(mouseEvent.clientY / window.innerHeight) * 2 + 1
    );

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Try to intersect a virtual ground plane at y=0
    var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var target = new THREE.Vector3();
    var hit = raycaster.ray.intersectPlane(groundPlane, target);
    return hit ? target.clone() : null;
  }

  // ─── Setup mode ───────────────────────────────────────────────────────────
  function _toggleSetupMode() {
    if (ambushTriggered) return; // can't enter setup while ambush active

    inSetupMode = !inSetupMode;
    if (inSetupMode) {
      console.log('[AmbushSystem] Setup mode ON — click to place markers (max 6). A+M again to finalise.');
    } else {
      // Finalise: if we have at least 1 marker, lock the kill zone
      if (markers.length > 0 && !killZoneSet) {
        _finaliseKillZone();
      } else if (markers.length === 0) {
        console.log('[AmbushSystem] Setup mode OFF — no markers placed, cancelling.');
      }
    }
    _updateHUD();
  }

  function _placeMarker(pos) {
    if (!scene) return;

    var geo  = new THREE.ConeGeometry(0.25, 0.8, 6);
    var mesh = new THREE.Mesh(geo, markerMat.clone());
    mesh.position.copy(pos);
    mesh.position.y = 0.4; // sit on ground
    mesh.userData.isAmbushMarker = true;
    mesh.userData.pulsePhase = Math.random() * Math.PI * 2;
    scene.add(mesh);

    markers.push(mesh);
    markerPositions.push(pos.clone());

    console.log('[AmbushSystem] Marker ' + markers.length + '/' + MAX_MARKERS + ' placed at', pos.x.toFixed(1), pos.z.toFixed(1));
    _updateHUD();
  }

  function _finaliseKillZone() {
    killZoneSet = true;
    currentAmbushType = _detectAmbushType(markerPositions);
    _buildKillZoneOutline();
    console.log('[AmbushSystem] Kill zone finalised. Type:', currentAmbushType, '— markers:', markers.length);
    _updateHUD();
  }

  // ─── Ambush type detection ────────────────────────────────────────────────
  function _detectAmbushType(positions) {
    if (positions.length <= 1) return AMBUSH_TYPE.POINT;
    if (positions.length === 2) return AMBUSH_TYPE.LINEAR;

    // Compute centroid
    var cx = 0, cz = 0;
    for (var i = 0; i < positions.length; i++) {
      cx += positions[i].x;
      cz += positions[i].z;
    }
    cx /= positions.length;
    cz /= positions.length;

    // Check angular spread around centroid
    var angles = [];
    for (var j = 0; j < positions.length; j++) {
      angles.push(Math.atan2(positions[j].z - cz, positions[j].x - cx));
    }
    angles.sort(function (a, b) { return a - b; });

    // Largest gap between consecutive angles
    var maxGap = 0;
    for (var k = 0; k < angles.length; k++) {
      var next = (k + 1) % angles.length;
      var gap = (next === 0)
        ? (angles[0] + Math.PI * 2) - angles[k]
        : angles[next] - angles[k];
      if (gap > maxGap) maxGap = gap;
    }

    // Horseshoe: markers arc > 270 degrees around centroid (gap < 90 deg)
    if (maxGap < Math.PI / 2) return AMBUSH_TYPE.HORSESHOE;
    // L-shape: markers span roughly 90-180 degrees
    if (maxGap < Math.PI) return AMBUSH_TYPE.L_SHAPE;
    // Linear: markers in a mostly straight line (gap > 180)
    return AMBUSH_TYPE.LINEAR;
  }

  // ─── Kill zone outline ────────────────────────────────────────────────────
  function _buildKillZoneOutline() {
    if (!scene) return;
    _removeKillZoneOutline();

    var pts = markerPositions;
    if (pts.length < 2) return;

    var verts = [];
    // Connect consecutive markers and close the loop
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i];
      var b = pts[(i + 1) % pts.length];
      verts.push(a.x, 0.05, a.z);
      verts.push(b.x, 0.05, b.z);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    killZoneOutline = new THREE.LineSegments(geo, lineMat.clone());
    killZoneOutline.computeLineDistances();
    scene.add(killZoneOutline);
  }

  function _removeKillZoneOutline() {
    if (killZoneOutline && scene) {
      scene.remove(killZoneOutline);
      if (killZoneOutline.geometry) killZoneOutline.geometry.dispose();
      killZoneOutline = null;
    }
  }

  // ─── Kill zone geometry helpers ───────────────────────────────────────────
  function _killZoneCentroid() {
    var c = new THREE.Vector3();
    for (var i = 0; i < markerPositions.length; i++) c.add(markerPositions[i]);
    c.divideScalar(markerPositions.length);
    return c;
  }

  function _killZoneRadius() {
    if (markerPositions.length === 0) return 0;
    var c = _killZoneCentroid();
    var maxR = 0;
    for (var i = 0; i < markerPositions.length; i++) {
      var d = c.distanceTo(markerPositions[i]);
      if (d > maxR) maxR = d;
    }
    return Math.max(maxR, 3); // minimum 3-unit radius
  }

  function _positionInKillZone(pos) {
    if (markerPositions.length === 0) return false;
    var c = _killZoneCentroid();
    var r = _killZoneRadius();
    var dx = pos.x - c.x;
    var dz = (pos.z !== undefined ? pos.z : pos.y) - c.z; // support Vector2/3
    return (dx * dx + dz * dz) <= r * r;
  }

  // ─── Ambush trigger ───────────────────────────────────────────────────────
  function _checkAmbushTrigger(enemies) {
    if (!killZoneSet || ambushTriggered) return;

    var inZone = 0;
    for (var i = 0; i < enemies.length; i++) {
      var ep = enemies[i].position || enemies[i];
      if (_positionInKillZone(ep)) inZone++;
    }

    if (inZone >= KILL_ZONE_ENTER_THRESHOLD) {
      _triggerAmbush(enemies, inZone);
    }
  }

  function _triggerAmbush(enemies, inZoneCount) {
    ambushTriggered = true;
    currentAmbushStartTime = Date.now();
    triggerFlashTimer = TRIGGER_FLASH_DURATION;
    autoAimActive = true;
    autoAimTimer = AUTO_AIM_DURATION;

    console.log('[AmbushSystem] AMBUSH TRIGGERED! Type:', currentAmbushType, '| Enemies in zone:', inZoneCount);

    // Flash all markers white
    for (var i = 0; i < markers.length; i++) {
      markers[i].material = markerFlashMat.clone();
    }

    // Flash kill zone outline white
    if (killZoneOutline) {
      killZoneOutline.material.color.setHex(0xffffff);
    }

    // Detonate traps/explosives via game world hook
    _detonateTraps();

    // Schedule reinforcements
    reinforceTimer = REINFORCE_DELAY;
    reinforceScheduled = true;

    _updateHUD();
  }

  function _detonateTraps() {
    // Hook into other modules if available
    if (window.ExplosiveBarrels && typeof ExplosiveBarrels.detonateAll === 'function') {
      ExplosiveBarrels.detonateAll();
    }
    if (window.C4 && typeof C4.detonateAll === 'function') {
      C4.detonateAll();
    }
    if (window.Mines && typeof Mines.triggerKillZone === 'function') {
      Mines.triggerKillZone(_killZoneCentroid(), _killZoneRadius());
    }
    console.log('[AmbushSystem] Traps detonated.');
  }

  // ─── Ambush resolution ────────────────────────────────────────────────────
  function _resolveAmbush(enemies) {
    if (!ambushTriggered) return;

    // Count how many enemies in kill zone are still alive
    var surviving = 0;
    var escaped = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var ep = e.position || e;
      if (_positionInKillZone(ep)) {
        if (!e.isDead) surviving++;
      } else {
        if (!e.isDead) escaped++;
      }
    }

    var kills = Math.max(0, (enemies.length - surviving) - escaped);
    var score = 0;
    var result = 'partial';

    if (escaped > 0) {
      score  = SCORE_BROKEN;
      result = 'broken';
    } else if (surviving === 0) {
      score  = SCORE_PERFECT;
      result = 'perfect';
    } else {
      score  = SCORE_PARTIAL;
      result = 'partial';
    }

    totalScore += score;

    var logEntry = {
      time:  Date.now(),
      type:  currentAmbushType,
      kills: kills,
      score: score,
      result: result
    };
    ambushLog.push(logEntry);
    if (ambushLog.length > MAX_LOG_ENTRIES) ambushLog.shift();

    console.log('[AmbushSystem] Ambush resolved. Result:', result, '| Score:', score, '| Total:', totalScore);
    _refreshLogPanel();

    // Scatter surviving enemies
    _scatterSurvivors(enemies);
  }

  function _scatterSurvivors(enemies) {
    var centroid = _killZoneCentroid();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e.isDead) continue;
      // Provide scatter vector for enemy AI
      if (typeof e.flee === 'function') {
        e.flee(centroid);
      } else if (e.userData) {
        // Fallback: store scatter target in userData
        var angle = Math.random() * Math.PI * 2;
        var dist  = 12 + Math.random() * 8;
        e.userData.scatterTarget = new THREE.Vector3(
          centroid.x + Math.cos(angle) * dist,
          0,
          centroid.z + Math.sin(angle) * dist
        );
        e.userData.scatter = true;
      }
    }
    console.log('[AmbushSystem] Survivors scattered.');
  }

  function _spawnReinforcements() {
    reinforceScheduled = false;
    console.log('[AmbushSystem] Reinforcements called! Spawning 2 enemies.');
    if (window.Enemies && typeof Enemies.spawnAt === 'function') {
      var c = _killZoneCentroid();
      var r = _killZoneRadius() + 10;
      for (var i = 0; i < 2; i++) {
        var angle = Math.random() * Math.PI * 2;
        Enemies.spawnAt(
          new THREE.Vector3(c.x + Math.cos(angle) * r, 0, c.z + Math.sin(angle) * r)
        );
      }
    } else {
      console.log('[AmbushSystem] window.Enemies.spawnAt not available — reinforcements simulated.');
    }
  }

  // ─── Counter-ambush detection ─────────────────────────────────────────────
  function _checkCounterAmbush(enemies) {
    if (counterAmbushActive) return;

    var playerPos = _getPlayerPosition();
    if (!playerPos) return;

    var nearbyDirs = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var ep = e.position || e;
      var dx = ep.x - playerPos.x;
      var dz = ep.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > COUNTER_AMBUSH_RADIUS) continue;

      // Bucket direction into 4 quadrants
      var angle = Math.atan2(dz, dx); // -π to π
      var sector = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 4) % 4;
      if (nearbyDirs.indexOf(sector) === -1) nearbyDirs.push(sector);
    }

    if (nearbyDirs.length >= COUNTER_AMBUSH_DIR_THRESHOLD) {
      _activateCounterAmbush(nearbyDirs, playerPos);
    }
  }

  function _activateCounterAmbush(sectors, playerPos) {
    counterAmbushActive = true;
    var dirNames = [];
    var sectorMap = ['EAST', 'REAR', 'WEST', 'FRONT'];
    // Map player-relative cardinal directions
    var labelMap  = {
      0: 'CONTACT FLANK (RIGHT)',
      1: 'CONTACT REAR',
      2: 'CONTACT FLANK (LEFT)',
      3: 'CONTACT FRONT'
    };
    for (var i = 0; i < sectors.length; i++) {
      dirNames.push(labelMap[sectors[i]] || ('CONTACT DIR-' + sectors[i]));
    }

    console.log('[AmbushSystem] COUNTER-AMBUSH:', dirNames.join(' | '));
    _showContactAlert(dirNames);
    _spawnNavArrows(playerPos);

    // Auto-clear after 8 seconds
    setTimeout(function () {
      _clearCounterAmbush();
    }, 8000);
  }

  function _spawnNavArrows(playerPos) {
    _clearNavArrows();
    if (!scene) return;

    // Point towards nearest cover candidates (simulated as random nearby points)
    var coverCandidates = _findCoverPositions(playerPos, 3);
    for (var i = 0; i < coverCandidates.length; i++) {
      var target = coverCandidates[i];
      var arrow = _buildArrowMesh();
      var dir = new THREE.Vector3(target.x - playerPos.x, 0, target.z - playerPos.z).normalize();
      arrow.position.set(playerPos.x, playerPos.y + 1.5, playerPos.z);
      arrow.lookAt(arrow.position.clone().add(dir));
      scene.add(arrow);
      navArrows.push(arrow);
    }
  }

  function _findCoverPositions(playerPos, count) {
    // If a cover/environment module is available use it; otherwise simulate
    var covers = [];
    if (window.Environment && typeof Environment.getCoverPositions === 'function') {
      covers = Environment.getCoverPositions(playerPos, count);
    } else {
      // Simulate: random directions at 6-10 units from player
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2 + Math.PI / 6;
        var dist  = 6 + Math.random() * 4;
        covers.push(new THREE.Vector3(
          playerPos.x + Math.cos(angle) * dist,
          playerPos.y,
          playerPos.z + Math.sin(angle) * dist
        ));
      }
    }
    return covers;
  }

  function _buildArrowMesh() {
    // Simple cone pointing in local +Z direction
    var geo  = new THREE.ConeGeometry(0.18, 0.6, 4);
    geo.rotateX(Math.PI / 2); // point along Z
    var mesh = new THREE.Mesh(geo, arrowMat.clone());
    return mesh;
  }

  function _clearNavArrows() {
    for (var i = 0; i < navArrows.length; i++) {
      if (scene) scene.remove(navArrows[i]);
      if (navArrows[i].geometry) navArrows[i].geometry.dispose();
    }
    navArrows = [];
  }

  function _clearCounterAmbush() {
    counterAmbushActive = false;
    _clearNavArrows();
    console.log('[AmbushSystem] Counter-ambush cleared.');
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _getPlayerPosition() {
    if (playerRef && playerRef.position) return playerRef.position;
    if (camera) return camera.position;
    return null;
  }

  function _getEnemies() {
    if (window.Enemies && typeof Enemies.getAll === 'function') {
      return Enemies.getAll();
    }
    // Simulate: 4 enemies with random positions for testing
    var sim = [];
    for (var i = 0; i < 4; i++) {
      sim.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          0,
          (Math.random() - 0.5) * 30
        ),
        isDead: false
      });
    }
    return sim;
  }

  // ─── Visual updates ───────────────────────────────────────────────────────
  function _updateMarkers(dt) {
    var t = performance.now() / 1000;
    for (var i = 0; i < markers.length; i++) {
      var m = markers[i];
      // Pulse scale: 0.85 → 1.15 in a sine wave
      var pulse = 1.0 + 0.15 * Math.sin(t * PULSE_SPEED + m.userData.pulsePhase);
      m.scale.setScalar(pulse);
      // Pulse opacity
      if (m.material && !ambushTriggered) {
        m.material.opacity = 0.7 + 0.3 * Math.sin(t * PULSE_SPEED + m.userData.pulsePhase);
      }
    }
  }

  function _updateTriggerFlash(dt) {
    if (triggerFlashTimer <= 0) {
      // Restore marker colours after flash
      if (ambushTriggered) {
        for (var i = 0; i < markers.length; i++) {
          markers[i].material = markerMat.clone();
          markers[i].material.color.setHex(0xff1111);
        }
        if (killZoneOutline) {
          killZoneOutline.material.color.setHex(0xff0000);
        }
      }
      return;
    }
    triggerFlashTimer -= dt * 1000;
  }

  function _updateAutoAim(dt) {
    if (!autoAimActive) return;
    autoAimTimer -= dt * 1000;
    if (autoAimTimer <= 0) {
      autoAimActive = false;
      autoAimTimer  = 0;
      console.log('[AmbushSystem] Auto-aim expired.');
    }
  }

  function _updateReinforcements(dt) {
    if (!reinforceScheduled) return;
    reinforceTimer -= dt * 1000;
    if (reinforceTimer <= 0) {
      _spawnReinforcements();
    }
  }

  // ─── Log panel toggle ─────────────────────────────────────────────────────
  function _toggleLogPanel() {
    logPanelVisible = !logPanelVisible;
    _refreshLogPanel();
    if (logPanelEl) {
      logPanelEl.style.display = logPanelVisible ? 'block' : 'none';
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  function update(dt) {
    // dt: seconds elapsed since last frame
    if (!dt || isNaN(dt)) dt = 0.016;

    var enemies = _getEnemies();

    _updateMarkers(dt);
    _updateTriggerFlash(dt);
    _updateAutoAim(dt);
    _updateReinforcements(dt);

    if (killZoneSet && !ambushTriggered) {
      _checkAmbushTrigger(enemies);
    }

    // Check if ambush resolves (auto-aim done + triggered)
    if (ambushTriggered && !autoAimActive && triggerFlashTimer <= 0) {
      _resolveAmbush(enemies);
      // Reset ambush state for next use
      ambushTriggered = false;
      killZoneSet     = false;
      inSetupMode     = false;
    }

    // Counter-ambush detection (always on when not in setup mode)
    if (!inSetupMode && !ambushTriggered) {
      _checkCounterAmbush(enemies);
    }

    _updateHUD();
  }

  function reset() {
    // Clear markers
    for (var i = 0; i < markers.length; i++) {
      if (scene) scene.remove(markers[i]);
      if (markers[i].geometry) markers[i].geometry.dispose();
    }
    markers         = [];
    markerPositions = [];

    _removeKillZoneOutline();
    _clearNavArrows();

    inSetupMode           = false;
    killZoneSet           = false;
    ambushTriggered       = false;
    triggerFlashTimer     = 0;
    autoAimActive         = false;
    autoAimTimer          = 0;
    reinforceTimer        = 0;
    reinforceScheduled    = false;
    counterAmbushActive   = false;
    counterAmbushAlerts   = [];
    currentAmbushType     = AMBUSH_TYPE.LINEAR;

    if (hudEl) { hudEl.style.display = 'none'; }
    if (contactAlertEl) { contactAlertEl.style.display = 'none'; }

    console.log('[AmbushSystem] Reset.');
    _updateHUD();
  }

  // Expose read-only state helpers used by other modules
  function isAutoAimActive()      { return autoAimActive; }
  function isAmbushTriggered()    { return ambushTriggered; }
  function isSetupMode()          { return inSetupMode; }
  function getScore()             { return totalScore; }
  function getLog()               { return ambushLog.slice(); }
  function getAmbushType()        { return currentAmbushType; }

  return {
    init:               init,
    update:             update,
    reset:              reset,
    isAutoAimActive:    isAutoAimActive,
    isAmbushTriggered:  isAmbushTriggered,
    isSetupMode:        isSetupMode,
    getScore:           getScore,
    getLog:             getLog,
    getAmbushType:      getAmbushType
  };

})();
