// ============================================================
//  kill-house.js — Procedural CQB Kill-House Training Module
//  Features:
//    1. 5-room procedural kill-house placed at (60, 0, 0)
//    2. Room types: ENTRY, HALLWAY, CORNER_ROOM, T_JUNCTION, FINAL
//    3. Paper target enemies with spring-up animation (tan + red X)
//    4. Friendly targets (green X) — shooting costs -50 score
//    5. Hostage target (yellow) with threat offset
//    6. 30s per room countdown timer, total run timer
//    7. Room clear: neutralize threats, cross threshold
//    8. Scoring: time bonus + accuracy bonus + no-friendly bonus
//    9. CADRE voice text messages
//   10. Debrief panel with full stats
//   11. Leaderboard in localStorage (key: "killhouse_scores")
//  Public API: init, update, reset
//  Activation: K key
// ============================================================
window.KillHouse = (function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────
  var ORIGIN_X = 60;
  var ORIGIN_Y = 0;
  var ORIGIN_Z = 0;

  var ROOM_W = 8;
  var ROOM_H = 4;
  var ROOM_D = 8;
  var WALL_T = 0.2;

  var DOOR_W = 2;
  var DOOR_H = 3;

  var TIME_PER_ROOM = 30;
  var TARGET_POP_INTERVAL_MIN = 1.5;
  var TARGET_POP_INTERVAL_MAX = 4.0;
  var TARGET_POP_DURATION = 0.2;
  var TARGET_STAY_TIME = 3.5;
  var FRIENDLY_CHANCE = 0.10;
  var MAX_TARGETS_PER_ROOM = 4;

  var SCORE_THREAT_HIT    = 100;
  var SCORE_FRIENDLY_HIT  = -50;
  var SCORE_TIME_BONUS    = 500;
  var SCORE_ACCURACY_BONUS= 250;
  var SCORE_NO_FRIENDLY   = 200;
  var SCORE_HOSTAGE_CLEAR = 300;

  var LS_KEY = 'killhouse_scores';

  var ROOM_TYPES = ['ENTRY', 'HALLWAY', 'CORNER_ROOM', 'T_JUNCTION', 'FINAL'];

  var CADRE_LINES = {
    ENTRY:       ['BREACH!', 'STACK UP!', 'CLEAR THE ENTRY!'],
    HALLWAY:     ['WATCH YOUR SECTORS!', 'MOVE FAST — STAY LOW!', 'HALLWAY CLEAR — KEEP MOVING!'],
    CORNER_ROOM: ['PIE THE CORNERS!', 'SLICE THE PIE!', 'CORNER CLEAR — MOVE UP!'],
    T_JUNCTION:  ['T-JUNCTION — DANGER ZONE!', 'SPLIT SECTORS!', 'HOLD UNTIL CLEAR!'],
    FINAL:       ['FINAL ROOM — EXPECT CONTACT!', 'LAST ROOM — STAY SHARP!', 'BREACH THE BOSS ROOM!'],
    CLEAR:       ['ROOM CLEAR!', 'MOVE TO NEXT ROOM', 'GOOD SHOOTING — PUSH!'],
    FRIENDLY:    ['WATCH YOUR FIRE! FRIENDLY DOWN!', 'YOU SHOT A FRIENDLY!', 'CEASE FIRE — FRIENDLY CASUALTY!'],
    COMPLETE:    ['HOUSE CLEAR!', 'WELL DONE — TIME STOPS NOW.', 'DEBRIEF IN 5...']
  };

  // ── Colors ──────────────────────────────────────────────────
  var COL_WALL        = 0xCCBB99;
  var COL_FLOOR       = 0x888877;
  var COL_CEIL        = 0xBBAA88;
  var COL_TARGET_TAN  = 0xF5DEB3;
  var COL_TARGET_RED  = 0xCC0000;
  var COL_TARGET_GRN  = 0x00AA44;
  var COL_TARGET_YEL  = 0xFFDD00;
  var COL_STEEL       = 0x444444;

  // ── State ───────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _raycaster    = null;
  var _active       = false;
  var _inited       = false;
  var _group        = null;

  var _rooms        = [];
  var _currentRoom  = 0;
  var _roomTimer    = 0;
  var _totalTimer   = 0;
  var _runActive    = false;

  var _targets      = [];
  var _nextPopTimer = 0;
  var _shotsFired   = 0;
  var _shotsHit     = 0;
  var _friendliesShot = 0;
  var _totalScore   = 0;
  var _roomStats    = [];

  var _hudEl        = null;
  var _cadreEl      = null;
  var _debriefEl    = null;
  var _cadreTimer   = 0;

  var _keyListener  = null;
  var _clickListener= null;

  // ── HUD helpers ─────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'kh-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#FFE',
      'font:bold 18px monospace',
      'padding:6px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:9000',
      'letter-spacing:2px'
    ].join(';');
    document.body.appendChild(_hudEl);

    _cadreEl = document.createElement('div');
    _cadreEl.id = 'kh-cadre';
    _cadreEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(20,20,40,0.85)',
      'color:#AAFFCC',
      'font:bold 15px monospace',
      'padding:5px 16px',
      'border-radius:3px',
      'pointer-events:none',
      'display:none',
      'z-index:9001',
      'text-transform:uppercase',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_cadreEl);
  }

  function _showHUD(text) {
    if (!_hudEl) _ensureHUD();
    _hudEl.textContent = text;
    _hudEl.style.display = 'block';
  }

  function _hideHUD() {
    if (_hudEl) _hudEl.style.display = 'none';
  }

  function _cadreSpeak(category) {
    if (!_cadreEl) _ensureHUD();
    var lines = CADRE_LINES[category] || ['...'];
    var line = lines[Math.floor(Math.random() * lines.length)];
    _cadreEl.textContent = '[ CADRE ] ' + line;
    _cadreEl.style.display = 'block';
    _cadreTimer = 3.0;
  }

  function _updateCadre(dt) {
    if (_cadreTimer > 0) {
      _cadreTimer -= dt;
      if (_cadreTimer <= 0 && _cadreEl) {
        _cadreEl.style.display = 'none';
      }
    }
  }

  // ── Target geometry builder ──────────────────────────────────
  function _makeTargetMesh(type) {
    // type: 'threat' | 'friendly' | 'hostage' | 'threat_offset'
    var group = new THREE.Group();

    var bodyColor = (type === 'friendly') ? COL_TARGET_GRN :
                    (type === 'hostage')  ? COL_TARGET_YEL :
                    COL_TARGET_TAN;

    // Body: thin flat box 0.1 wide, 2 tall, 1 deep
    var bodyGeo  = new THREE.BoxGeometry(1, 2, 0.1);
    var bodyMat  = new THREE.MeshLambertMaterial({ color: bodyColor });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 1, 0); // pivot at bottom
    group.add(bodyMesh);

    // X marking — two thin crossed boxes
    var xColor = (type === 'friendly') ? COL_TARGET_RED :
                 (type === 'hostage')  ? COL_TARGET_RED :
                 COL_TARGET_RED;
    if (type === 'friendly') xColor = COL_TARGET_GRN;
    // Override: friendly gets green X on green body — use darker green
    if (type === 'friendly') xColor = 0x005500;

    var xMat   = new THREE.MeshLambertMaterial({ color: xColor });
    var x1Geo  = new THREE.BoxGeometry(0.7, 0.12, 0.12);
    var x1Mesh = new THREE.Mesh(x1Geo, xMat);
    x1Mesh.position.set(0, 1.2, 0.06);
    x1Mesh.rotation.z = Math.PI / 4;
    group.add(x1Mesh);

    var x2Geo  = new THREE.BoxGeometry(0.7, 0.12, 0.12);
    var x2Mesh = new THREE.Mesh(x2Geo, xMat);
    x2Mesh.position.set(0, 1.2, 0.06);
    x2Mesh.rotation.z = -Math.PI / 4;
    group.add(x2Mesh);

    return group;
  }

  // ── Room geometry builder ────────────────────────────────────
  function _buildRoom(roomDef, idx) {
    var g = new THREE.Group();
    var roomX = roomDef.x;
    var roomZ = roomDef.z;

    var wallMat  = new THREE.MeshLambertMaterial({ color: COL_WALL });
    var floorMat = new THREE.MeshLambertMaterial({ color: COL_FLOOR });
    var ceilMat  = new THREE.MeshLambertMaterial({ color: COL_CEIL });

    // Floor
    var floorGeo  = new THREE.BoxGeometry(ROOM_W, WALL_T, ROOM_D);
    var floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(roomX + ROOM_W / 2, -WALL_T / 2, roomZ + ROOM_D / 2);
    g.add(floorMesh);

    // Ceiling
    var ceilGeo  = new THREE.BoxGeometry(ROOM_W, WALL_T, ROOM_D);
    var ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    ceilMesh.position.set(roomX + ROOM_W / 2, ROOM_H + WALL_T / 2, roomZ + ROOM_D / 2);
    g.add(ceilMesh);

    // Door gaps: entry door on -Z face (except first room), exit door on +Z face (except last room)
    var hasEntry = (idx > 0);
    var hasExit  = (idx < ROOM_TYPES.length - 1);

    // North wall (+Z face, door to next room)
    _buildWallWithDoor(g, wallMat,
      roomX, 0, roomZ + ROOM_D,
      ROOM_W, ROOM_H, WALL_T,
      'Z', hasExit);

    // South wall (-Z face, door from prev room)
    _buildWallWithDoor(g, wallMat,
      roomX, 0, roomZ,
      ROOM_W, ROOM_H, WALL_T,
      'Z', hasEntry);

    // East wall (+X)
    var eastGeo  = new THREE.BoxGeometry(WALL_T, ROOM_H, ROOM_D);
    var eastMesh = new THREE.Mesh(eastGeo, wallMat);
    eastMesh.position.set(roomX + ROOM_W + WALL_T / 2, ROOM_H / 2, roomZ + ROOM_D / 2);
    g.add(eastMesh);

    // West wall (-X)
    var westGeo  = new THREE.BoxGeometry(WALL_T, ROOM_H, ROOM_D);
    var westMesh = new THREE.Mesh(westGeo, wallMat);
    westMesh.position.set(roomX - WALL_T / 2, ROOM_H / 2, roomZ + ROOM_D / 2);
    g.add(westMesh);

    // FINAL room: reinforced steel door decoration (3×3 steel box)
    if (roomDef.type === 'FINAL') {
      var steelMat = new THREE.MeshLambertMaterial({ color: COL_STEEL });
      var steelGeo = new THREE.BoxGeometry(3, 3, 0.3);
      var steelMesh = new THREE.Mesh(steelGeo, steelMat);
      steelMesh.position.set(roomX + ROOM_W / 2, 1.5, roomZ + ROOM_D - 0.15);
      g.add(steelMesh);
    }

    // Ambient light for room
    var ambLight = new THREE.PointLight(0xfff8e0, 0.6, 15);
    ambLight.position.set(roomX + ROOM_W / 2, ROOM_H - 0.5, roomZ + ROOM_D / 2);
    g.add(ambLight);

    return g;
  }

  function _buildWallWithDoor(group, mat, x, y, z, width, height, thickness, axis, hasDoor) {
    // axis 'Z' means wall runs along X axis
    if (!hasDoor) {
      var geo  = new THREE.BoxGeometry(width, height, thickness);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + width / 2, y + height / 2, z);
      group.add(mesh);
      return;
    }

    // Door gap: centered, DOOR_W wide, DOOR_H tall
    var doorX  = width / 2 - DOOR_W / 2;
    var sideW  = doorX; // each side width
    var aboveH = height - DOOR_H;

    // Left side
    if (sideW > 0.01) {
      var lGeo  = new THREE.BoxGeometry(sideW, height, thickness);
      var lMesh = new THREE.Mesh(lGeo, mat);
      lMesh.position.set(x + sideW / 2, y + height / 2, z);
      group.add(lMesh);
    }

    // Right side
    if (sideW > 0.01) {
      var rGeo  = new THREE.BoxGeometry(sideW, height, thickness);
      var rMesh = new THREE.Mesh(rGeo, mat);
      rMesh.position.set(x + sideW + DOOR_W + sideW / 2, y + height / 2, z);
      group.add(rMesh);
    }

    // Above door
    if (aboveH > 0.01) {
      var aGeo  = new THREE.BoxGeometry(DOOR_W, aboveH, thickness);
      var aMesh = new THREE.Mesh(aGeo, mat);
      aMesh.position.set(x + sideW + DOOR_W / 2, y + DOOR_H + aboveH / 2, z);
      group.add(aMesh);
    }
  }

  // ── Target spawning ──────────────────────────────────────────
  function _spawnTarget(roomDef) {
    if (!_runActive) return;

    var activeInRoom = 0;
    for (var i = 0; i < _targets.length; i++) {
      if (_targets[i].roomIdx === _currentRoom && _targets[i].alive) activeInRoom++;
    }
    if (activeInRoom >= MAX_TARGETS_PER_ROOM) return;

    var rng         = Math.random();
    var isFriendly  = (rng < FRIENDLY_CHANCE);
    var isHostage   = (!isFriendly && roomDef.hasHostage && rng < FRIENDLY_CHANCE + 0.12);
    var isThreat    = !isFriendly && !isHostage;

    // Random position inside room
    var rx = roomDef.x + 1 + Math.random() * (ROOM_W - 2);
    var rz = roomDef.z + 1 + Math.random() * (ROOM_D - 3);

    var type = isFriendly ? 'friendly' : (isHostage ? 'hostage' : 'threat');
    var mesh = _makeTargetMesh(type);
    mesh.position.set(ORIGIN_X + rx, ORIGIN_Y, ORIGIN_Z + rz);

    // Start flat on floor (rotation.x = -1.5)
    mesh.rotation.x = -1.5;

    _group.add(mesh);

    var targetObj = {
      mesh:      mesh,
      type:      type,
      roomIdx:   _currentRoom,
      alive:     true,
      popping:   true,
      popTimer:  0,
      stayTimer: 0,
      dropping:  false,
      dropTimer: 0,
      rx:        ORIGIN_X + rx,
      rz:        ORIGIN_Z + rz
    };

    // Hostage: add offset threat in front
    if (isHostage) {
      var threatMesh = _makeTargetMesh('threat');
      threatMesh.position.set(ORIGIN_X + rx + 0.6, ORIGIN_Y, ORIGIN_Z + rz - 0.4);
      threatMesh.rotation.x = -1.5;
      _group.add(threatMesh);

      var threatObj = {
        mesh:      threatMesh,
        type:      'threat',
        roomIdx:   _currentRoom,
        alive:     true,
        popping:   true,
        popTimer:  0,
        stayTimer: 0,
        dropping:  false,
        dropTimer: 0,
        linkedHostage: true
      };
      _targets.push(threatObj);
    }

    _targets.push(targetObj);
  }

  function _scheduleNextPop() {
    _nextPopTimer = TARGET_POP_INTERVAL_MIN +
      Math.random() * (TARGET_POP_INTERVAL_MAX - TARGET_POP_INTERVAL_MIN);
  }

  function _updateTargets(dt) {
    for (var i = 0; i < _targets.length; i++) {
      var t = _targets[i];
      if (!t.alive) continue;
      if (t.roomIdx !== _currentRoom) continue;

      // Popping up
      if (t.popping) {
        t.popTimer += dt;
        var frac = Math.min(t.popTimer / TARGET_POP_DURATION, 1.0);
        t.mesh.rotation.x = -1.5 + 1.5 * frac;
        if (frac >= 1.0) {
          t.popping   = false;
          t.stayTimer = TARGET_STAY_TIME;
        }
        continue;
      }

      // Staying up
      if (!t.dropping && t.stayTimer > 0) {
        t.stayTimer -= dt;
        if (t.stayTimer <= 0) {
          t.dropping  = true;
          t.dropTimer = 0;
        }
        continue;
      }

      // Dropping back
      if (t.dropping) {
        t.dropTimer += dt;
        var dFrac = Math.min(t.dropTimer / TARGET_POP_DURATION, 1.0);
        t.mesh.rotation.x = -1.5 * dFrac;
        if (dFrac >= 1.0) {
          t.alive = false;
          _group.remove(t.mesh);
        }
      }
    }
  }

  // ── Room clear logic ─────────────────────────────────────────
  function _allThreatsDown() {
    for (var i = 0; i < _targets.length; i++) {
      var t = _targets[i];
      if (t.roomIdx !== _currentRoom) continue;
      if (!t.alive) continue;
      if (t.type === 'threat') return false;
    }
    return true;
  }

  function _playerInNextRoomThreshold(playerPos) {
    if (_currentRoom >= _rooms.length - 1) return false;
    var nextRoom = _rooms[_currentRoom + 1];
    var worldX   = ORIGIN_X + nextRoom.x;
    var worldZ   = ORIGIN_Z + nextRoom.z;
    return (
      playerPos.x >= worldX &&
      playerPos.x <= worldX + ROOM_W &&
      playerPos.z >= worldZ &&
      playerPos.z <= worldZ + ROOM_D
    );
  }

  function _playerInFinalRoom(playerPos) {
    if (_currentRoom < _rooms.length - 1) return false;
    var room   = _rooms[_currentRoom];
    var worldX = ORIGIN_X + room.x;
    var worldZ = ORIGIN_Z + room.z;
    return (
      playerPos.x >= worldX &&
      playerPos.x <= worldX + ROOM_W &&
      playerPos.z >= worldZ &&
      playerPos.z <= worldZ + ROOM_D
    );
  }

  function _computeRoomScore(elapsed, shotsThisRoom, hitsThisRoom, friendliesThisRoom) {
    var score = 0;
    var timeLeft = Math.max(0, TIME_PER_ROOM - elapsed);
    score += Math.floor(timeLeft / TIME_PER_ROOM * SCORE_TIME_BONUS);
    if (shotsThisRoom > 0 && hitsThisRoom === shotsThisRoom) score += SCORE_ACCURACY_BONUS;
    if (friendliesThisRoom === 0) score += SCORE_NO_FRIENDLY;
    return score;
  }

  function _advanceRoom() {
    var elapsed = TIME_PER_ROOM - _roomTimer;
    var roomScore = _computeRoomScore(
      elapsed,
      _roomShots, _roomHits, _roomFriendlies
    );
    _totalScore += roomScore;

    _roomStats.push({
      type:       _rooms[_currentRoom].type,
      time:       elapsed.toFixed(1),
      shots:      _roomShots,
      hits:       _roomHits,
      friendlies: _roomFriendlies,
      score:      roomScore
    });

    _currentRoom++;
    _roomShots     = 0;
    _roomHits      = 0;
    _roomFriendlies= 0;
    _roomTimer     = TIME_PER_ROOM;

    if (_currentRoom >= _rooms.length) {
      _completeRun();
      return;
    }

    _cadreSpeak(_rooms[_currentRoom].type);
    _scheduleNextPop();
  }

  // ── Per-room shot tracking ───────────────────────────────────
  var _roomShots     = 0;
  var _roomHits      = 0;
  var _roomFriendlies= 0;

  // ── Shooting ────────────────────────────────────────────────
  function _onShoot() {
    if (!_active || !_runActive) return;
    if (!_raycaster || !_camera) return;

    _shotsFired++;
    _roomShots++;

    _raycaster.setFromCamera({ x: 0, y: 0 }, _camera);

    // Collect meshes to test
    var meshes = [];
    for (var i = 0; i < _targets.length; i++) {
      var t = _targets[i];
      if (!t.alive || t.roomIdx !== _currentRoom) continue;
      if (t.popping || t.dropping) continue; // only shoot when up
      t.mesh.traverse(function (child) {
        if (child.isMesh) {
          child.userData._targetRef = t;
          meshes.push(child);
        }
      });
    }

    var hits = _raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return;

    var hitChild = hits[0].object;
    var hitTarget = hitChild.userData._targetRef;
    if (!hitTarget || !hitTarget.alive) return;

    _shotsHit++;
    _roomHits++;
    hitTarget.alive   = false;
    hitTarget.popping = false;
    hitTarget.dropping= false;
    _group.remove(hitTarget.mesh);

    if (hitTarget.type === 'friendly' || hitTarget.type === 'hostage') {
      _totalScore += SCORE_FRIENDLY_HIT;
      _friendliesShot++;
      _roomFriendlies++;
      _cadreSpeak('FRIENDLY');
    } else {
      _totalScore += SCORE_THREAT_HIT;
    }
  }

  // ── Run complete & debrief ───────────────────────────────────
  function _completeRun() {
    _runActive = false;
    _cadreSpeak('COMPLETE');
    _hideHUD();

    // Save to leaderboard
    _saveScore(_totalTimer, _totalScore);

    // Show debrief after short delay
    setTimeout(_showDebrief, 1500);
  }

  function _saveScore(time, score) {
    var scores = [];
    try {
      scores = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch (e) {
      scores = [];
    }
    scores.push({ time: time.toFixed(1), score: score, date: new Date().toLocaleDateString() });
    scores.sort(function (a, b) { return b.score - a.score; });
    scores = scores.slice(0, 5);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(scores));
    } catch (e) { /* quota */ }
    return scores;
  }

  function _getScores() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function _showDebrief() {
    if (_debriefEl) {
      document.body.removeChild(_debriefEl);
      _debriefEl = null;
    }

    _debriefEl = document.createElement('div');
    _debriefEl.id = 'kh-debrief';
    _debriefEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,14,20,0.97)',
      'color:#E8E4D0',
      'font:14px monospace',
      'padding:28px 36px',
      'border:2px solid #556',
      'border-radius:6px',
      'z-index:9999',
      'min-width:400px',
      'max-width:560px',
      'text-align:left'
    ].join(';');

    var html = '<div style="font-size:20px;font-weight:bold;color:#FFD700;margin-bottom:14px;letter-spacing:3px">KILL-HOUSE DEBRIEF</div>';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:12px">';
    html += '<tr style="color:#AAFFCC;border-bottom:1px solid #334">';
    html += '<th style="text-align:left;padding:3px 6px">ROOM</th>';
    html += '<th style="padding:3px 6px">TIME</th>';
    html += '<th style="padding:3px 6px">SHOTS</th>';
    html += '<th style="padding:3px 6px">HITS</th>';
    html += '<th style="padding:3px 6px">FRDLY</th>';
    html += '<th style="padding:3px 6px">SCORE</th></tr>';

    for (var i = 0; i < _roomStats.length; i++) {
      var rs = _roomStats[i];
      var rowColor = rs.friendlies > 0 ? '#FF6666' : '#E8E4D0';
      html += '<tr style="color:' + rowColor + ';border-bottom:1px solid #222">';
      html += '<td style="padding:3px 6px">' + rs.type + '</td>';
      html += '<td style="text-align:center;padding:3px 6px">' + rs.time + 's</td>';
      html += '<td style="text-align:center;padding:3px 6px">' + rs.shots + '</td>';
      html += '<td style="text-align:center;padding:3px 6px">' + rs.hits + '</td>';
      html += '<td style="text-align:center;padding:3px 6px;color:' + (rs.friendlies > 0 ? '#FF4444' : '#44FF88') + '">' + rs.friendlies + '</td>';
      html += '<td style="text-align:center;padding:3px 6px;color:#FFD700">' + rs.score + '</td>';
      html += '</tr>';
    }
    html += '</table>';

    var acc = _shotsFired > 0 ? Math.floor(_shotsHit / _shotsFired * 100) : 0;
    html += '<div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.05);border-radius:3px">';
    html += '<div>TOTAL TIME: <span style="color:#FFD700">' + _totalTimer.toFixed(1) + 's</span></div>';
    html += '<div>SHOTS FIRED: ' + _shotsFired + '  |  HITS: ' + _shotsHit + '  |  ACCURACY: <span style="color:#AAFFCC">' + acc + '%</span></div>';
    html += '<div>FRIENDLIES HIT: <span style="color:' + (_friendliesShot > 0 ? '#FF4444' : '#44FF88') + '">' + _friendliesShot + '</span></div>';
    html += '<div style="font-size:20px;margin-top:8px">TOTAL SCORE: <span style="color:#FFD700;font-weight:bold">' + _totalScore + '</span></div>';
    html += '</div>';

    // Leaderboard
    var scores = _getScores();
    if (scores.length > 0) {
      html += '<div style="margin-top:14px;color:#AAFFCC;font-weight:bold;letter-spacing:2px">TOP 5 LEADERBOARD</div>';
      html += '<table style="width:100%;margin-top:4px">';
      for (var j = 0; j < scores.length; j++) {
        var s   = scores[j];
        var isMe = (Math.abs(parseFloat(s.time) - _totalTimer) < 0.2 && s.score === _totalScore);
        var rowStyle = isMe ? 'color:#FFD700;font-weight:bold' : 'color:#CCC';
        html += '<tr style="' + rowStyle + '">';
        html += '<td style="padding:2px 6px">#' + (j + 1) + '</td>';
        html += '<td style="padding:2px 6px">' + s.score + ' pts</td>';
        html += '<td style="padding:2px 6px">' + s.time + 's</td>';
        html += '<td style="padding:2px 6px;color:#888">' + s.date + '</td>';
        html += '</tr>';
      }
      html += '</table>';
    }

    html += '<div style="margin-top:18px;text-align:center">';
    html += '<button id="kh-debrief-close" style="background:#334;color:#EEE;border:1px solid #556;padding:8px 24px;font:14px monospace;cursor:pointer;border-radius:3px">CLOSE [K]</button>';
    html += '</div>';

    _debriefEl.innerHTML = html;
    document.body.appendChild(_debriefEl);

    document.getElementById('kh-debrief-close').onclick = function () {
      _hideDebrief();
    };
  }

  function _hideDebrief() {
    if (_debriefEl && _debriefEl.parentNode) {
      document.body.removeChild(_debriefEl);
      _debriefEl = null;
    }
  }

  // ── Kill-house geometry generation ──────────────────────────
  function _generateKillHouse() {
    if (_group) {
      _scene.remove(_group);
      _group = null;
    }

    _group = new THREE.Group();
    _rooms = [];
    _targets = [];

    // Randomly pick which room gets the hostage scenario
    var hostageRoom = 2 + Math.floor(Math.random() * 2); // room 2 or 3

    var roomOffsetZ = 0;
    for (var i = 0; i < ROOM_TYPES.length; i++) {
      var roomDef = {
        type:       ROOM_TYPES[i],
        x:          0,
        z:          roomOffsetZ,
        hasHostage: (i === hostageRoom)
      };
      _rooms.push(roomDef);

      var roomGroup = _buildRoom(roomDef, i);
      _group.add(roomGroup);

      roomOffsetZ += ROOM_D;
    }

    _group.position.set(ORIGIN_X, ORIGIN_Y, ORIGIN_Z);
    _scene.add(_group);
  }

  // ── Key handler ─────────────────────────────────────────────
  function _onKey(e) {
    if (e.key === 'k' || e.key === 'K') {
      if (_debriefEl) {
        _hideDebrief();
        return;
      }
      if (_active) {
        _deactivate();
      } else {
        _activate();
      }
    }
  }

  function _activate() {
    _active = true;
    _generateKillHouse();
    _startRun();
  }

  function _deactivate() {
    _active    = false;
    _runActive = false;
    _hideHUD();
    _hideDebrief();
    if (_group) {
      _scene.remove(_group);
      _group = null;
    }
  }

  function _startRun() {
    _currentRoom   = 0;
    _roomTimer     = TIME_PER_ROOM;
    _totalTimer    = 0;
    _shotsFired    = 0;
    _shotsHit      = 0;
    _friendliesShot= 0;
    _totalScore    = 0;
    _roomStats     = [];
    _roomShots     = 0;
    _roomHits      = 0;
    _roomFriendlies= 0;
    _targets       = [];
    _runActive     = true;

    _cadreSpeak(_rooms[0].type);
    _scheduleNextPop();
  }

  // ── Public API ───────────────────────────────────────────────
  function init(scene, camera) {
    if (_inited) return;
    _inited    = true;
    _scene     = scene;
    _camera    = camera;
    _raycaster = new THREE.Raycaster();

    _ensureHUD();

    _keyListener = function (e) { _onKey(e); };
    document.addEventListener('keydown', _keyListener);

    _clickListener = function (e) {
      if (e.button === 0) _onShoot();
    };
    document.addEventListener('mousedown', _clickListener);
  }

  function update(dt, playerPos) {
    if (!_active || !_runActive) return;

    _totalTimer += dt;
    _roomTimer  -= dt;

    // Pop targets
    _nextPopTimer -= dt;
    if (_nextPopTimer <= 0) {
      _spawnTarget(_rooms[_currentRoom]);
      _scheduleNextPop();
    }

    _updateTargets(dt);
    _updateCadre(dt);

    // HUD update
    var roomTime = Math.max(0, Math.ceil(_roomTimer));
    _showHUD('ROOM ' + (_currentRoom + 1) + '/5  [' + roomTime + 's]  SCORE:' + _totalScore);

    // Room time expired — force advance
    if (_roomTimer <= 0) {
      if (_currentRoom < _rooms.length - 1) {
        _advanceRoom();
        return;
      } else {
        _completeRun();
        return;
      }
    }

    // Check if threats cleared AND player crossing threshold
    if (playerPos && _allThreatsDown()) {
      if (_currentRoom < _rooms.length - 1 && _playerInNextRoomThreshold(playerPos)) {
        _cadreSpeak('CLEAR');
        _advanceRoom();
      } else if (_currentRoom === _rooms.length - 1 && _playerInFinalRoom(playerPos)) {
        _cadreSpeak('CLEAR');
        _completeRun();
      }
    }
  }

  function reset() {
    _deactivate();
    _inited = false;
    if (_keyListener) {
      document.removeEventListener('keydown', _keyListener);
      _keyListener = null;
    }
    if (_clickListener) {
      document.removeEventListener('mousedown', _clickListener);
      _clickListener = null;
    }
    if (_hudEl && _hudEl.parentNode) {
      document.body.removeChild(_hudEl);
      _hudEl = null;
    }
    if (_cadreEl && _cadreEl.parentNode) {
      document.body.removeChild(_cadreEl);
      _cadreEl = null;
    }
    _hideDebrief();
  }

  return { init: init, update: update, reset: reset };

}());
