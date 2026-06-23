/**
 * RappellingSystem — tactical rappelling and fast-rope insertion system
 *
 * Public API:
 *   RappellingSystem.init()     — registers key handlers, creates HUD elements
 *   RappellingSystem.update(dt) — advances rappel state each frame
 *   RappellingSystem.reset()    — detaches rope, removes meshes, resets state
 *
 * Features:
 *   - R+P keys enter rappel mode when player Y > 3
 *   - LineSegments rope mesh, 0xC8A96E tan color, updates each frame
 *   - Descent interpolates Y to 0 over height/4 seconds
 *   - Space: brake toggle (pause descent, allow firing)
 *   - A/D: pendulum swing ±8 units horizontal
 *   - W: kick off wall — detach at current height, launch forward 3 units
 *   - Fast-rope: CasualtyEvacuation heli within 5 units + R key
 *   - Building anchor piton (BoxGeometry 0x888888) at rope top
 *   - Multi-rope: up to 3 simultaneous AI buddy ropes (ChainOfCommand)
 *   - Enemy rappel: 20% chance on alert — CylinderGeometry NPCs descend ropes
 *   - Score +150 for rappel-under-fire (enemy within 30 units)
 *   - HUD: "RAPPEL [HEIGHT: Xm] [BRAKE: OFF] — SPACE=brake, A/D=swing, W=kick off"
 */
window.RappellingSystem = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MIN_HEIGHT         = 3;       // player Y must exceed this to allow rappel
  var ROPE_COLOR         = 0xC8A96E; // tan
  var PITON_COLOR        = 0x888888; // grey anchor piton
  var FAST_ROPE_SPEED    = 8;       // units/sec fast-rope descent
  var SWING_MAX          = 8;       // max horizontal arc in units
  var SWING_SPEED        = 3;       // units/sec horizontal swing speed
  var SWING_DAMPEN       = 0.85;    // friction factor per frame
  var KICK_FORWARD       = 3;       // units forward on kick-off
  var HELI_ATTACH_DIST   = 5;       // units from heli to allow fast-rope
  var ENEMY_ALERT_DIST   = 30;      // units to detect enemy for score bonus
  var SCORE_RAPPEL_FIRE  = 150;     // score for rappel under fire
  var MAX_BUDDY_ROPES    = 3;       // simultaneous AI buddy ropes
  var ENEMY_RAPPEL_CHANCE = 0.2;    // 20% chance of enemy rappel on alert
  var ENEMY_RAPPEL_SPEED  = 2.5;    // units/sec for enemy NPCs

  // ── State ──────────────────────────────────────────────────────────────────
  var _initialized     = false;
  var _rappelling      = false;
  var _brakeOn         = false;
  var _fastRope        = false;

  // Player rappel state
  var _anchorY         = 0;        // Y where anchor is placed (player start Y)
  var _anchorX         = 0;
  var _anchorZ         = 0;
  var _targetY         = 0;        // descent target (ground = 0)
  var _descentDuration = 0;        // total seconds for full descent
  var _descentElapsed  = 0;        // elapsed seconds
  var _startY          = 0;        // Y when descent began (may differ after brake)
  var _swingOffset     = 0;        // current horizontal offset
  var _swingVel        = 0;        // horizontal velocity (units/sec)

  // Key state
  var _keyR            = false;
  var _keyP            = false;
  var _keyW            = false;
  var _keyA            = false;
  var _keyD            = false;
  var _keySpace        = false;

  // Three.js objects — player rope
  var _ropeMesh        = null;     // LineSegments
  var _pitonMesh       = null;     // BoxGeometry anchor
  var _fastRopeMesh    = null;     // CylinderGeometry for fast-rope

  // Buddy ropes (up to 3)
  var _buddyRopes      = [];       // array of { mesh, anchorY, anchorX, anchorZ, currentY, active }

  // Enemy rappel groups
  var _enemyRappelGroups = [];     // array of { npcs: [{mesh, currentY, anchorY, anchorX, anchorZ}], active }

  // HUD element
  var _hudEl           = null;

  // Timing for interpolation
  var _rappelComplete  = false;

  // ── Scene / player helpers ────────────────────────────────────────────────
  function _getScene() {
    return window.scene ||
           (window.GameManager && window.GameManager.scene) ||
           window.gameScene ||
           null;
  }

  function _getCamera() {
    return window.camera ||
           (window.GameManager && window.GameManager.camera) ||
           null;
  }

  function _getPlayer() {
    return window.player ||
           (window.GameManager && window.GameManager.player) ||
           window.playerObject ||
           null;
  }

  function _getPlayerPos() {
    var p = _getPlayer();
    if (p && p.position) return p.position;
    var cam = _getCamera();
    if (cam && cam.position) return cam.position;
    return null;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'rappelling-system-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#C8A96E',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.6)',
      'padding:5px 14px',
      'border:1px solid #C8A96E',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none',
      'letter-spacing:0.05em',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _showHud(text) {
    _ensureHud();
    if (!text) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.textContent = text;
    _hudEl.style.display = 'block';
  }

  function _hideHud() {
    if (_hudEl) _hudEl.style.display = 'none';
  }

  function _updateHud() {
    if (!_rappelling) {
      _hideHud();
      return;
    }
    var pos = _getPlayerPos();
    var heightM = pos ? Math.max(0, Math.round(pos.y)) : 0;
    var brakeStr = _brakeOn ? 'ON' : 'OFF';
    var modeStr = _fastRope ? 'FAST-ROPE' : 'RAPPEL';
    _showHud(
      modeStr +
      ' [HEIGHT: ' + heightM + 'm]' +
      ' [BRAKE: ' + brakeStr + ']' +
      ' — SPACE=brake, A/D=swing, W=kick off'
    );
  }

  // ── Rope geometry helpers ─────────────────────────────────────────────────

  function _buildLinePoints(ax, ay, az, bx, by, bz) {
    // Returns Float32Array of 6 floats for a line from a to b
    return new Float32Array([ax, ay, az, bx, by, bz]);
  }

  function _makeRopeMesh(ax, ay, az, bx, by, bz) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    var pts = _buildLinePoints(ax, ay, az, bx, by, bz);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: ROPE_COLOR });
    var mesh = new THREE.LineSegments(geo, mat);
    scene.add(mesh);
    return mesh;
  }

  function _updateRopeMeshPoints(mesh, ax, ay, az, bx, by, bz) {
    if (!mesh || !mesh.geometry) return;
    var attr = mesh.geometry.attributes.position;
    if (!attr) return;
    attr.array[0] = ax; attr.array[1] = ay; attr.array[2] = az;
    attr.array[3] = bx; attr.array[4] = by; attr.array[5] = bz;
    attr.needsUpdate = true;
  }

  function _removeFromScene(mesh) {
    var sc = _getScene();
    if (mesh && sc) {
      sc.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    }
  }

  function _makePiton(ax, ay, az) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    var geo = new THREE.BoxGeometry(0.15, 0.15, 0.3);
    var mat = new THREE.MeshLambertMaterial({ color: PITON_COLOR });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ax, ay, az);
    scene.add(mesh);
    return mesh;
  }

  function _makeFastRopeMesh(ax, ay, az, groundY) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    var ropeLen = Math.max(0.1, ay - groundY);
    var geo = new THREE.CylinderGeometry(0.06, 0.06, ropeLen, 8);
    var mat = new THREE.MeshLambertMaterial({ color: ROPE_COLOR });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ax, ay - ropeLen / 2, az);
    scene.add(mesh);
    return mesh;
  }

  function _makeCylinderNpc(x, y, z) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    var geo = new THREE.CylinderGeometry(0.25, 0.25, 1.8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  // ── Near-ledge / height detection ────────────────────────────────────────
  function _canStartRappel() {
    var pos = _getPlayerPos();
    if (!pos) return false;
    return pos.y > MIN_HEIGHT;
  }

  // ── Helicopter proximity (CasualtyEvacuation) ─────────────────────────────
  function _getHeliPos() {
    if (!window.CasualtyEvacuation) return null;
    // Try common references
    var heli = null;
    if (window.CasualtyEvacuation.heliGroup) heli = window.CasualtyEvacuation.heliGroup;
    else if (window.CasualtyEvacuation.getHelicopterPosition) {
      return window.CasualtyEvacuation.getHelicopterPosition();
    }
    if (heli && heli.position) return heli.position;
    return null;
  }

  function _heliNearby() {
    var heliPos = _getHeliPos();
    if (!heliPos) return false;
    var pos = _getPlayerPos();
    if (!pos) return false;
    var dx = pos.x - heliPos.x;
    var dy = pos.y - heliPos.y;
    var dz = pos.z - heliPos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= HELI_ATTACH_DIST;
  }

  // ── Enemy proximity (for score bonus) ────────────────────────────────────
  function _enemyWithin30() {
    var pos = _getPlayerPos();
    if (!pos) return false;
    var enemies = window._activeEnemies || window.enemies || window._enemies || [];
    if (!enemies || !enemies.length) return false;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var ep = e.position || (e.mesh && e.mesh.position) || null;
      if (!ep) continue;
      var dx = pos.x - ep.x;
      var dy = pos.y - ep.y;
      var dz = pos.z - ep.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) <= ENEMY_ALERT_DIST) return true;
    }
    return false;
  }

  function _awardScore(points) {
    if (window.score !== undefined) {
      window.score += points;
    } else if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(points);
    } else if (window.combatXP && typeof window.combatXP.add === 'function') {
      window.combatXP.add(points);
    }
  }

  // ── Start rappel ──────────────────────────────────────────────────────────
  function _startRappel() {
    if (_rappelling) return;
    if (!_canStartRappel()) return;

    var pos = _getPlayerPos();
    if (!pos) return;

    _rappelling      = true;
    _brakeOn         = false;
    _fastRope        = false;
    _rappelComplete  = false;
    _anchorX         = pos.x;
    _anchorY         = pos.y;
    _anchorZ         = pos.z;
    _targetY         = 0;
    _startY          = pos.y;
    _descentDuration = pos.y / 4; // height/4 seconds
    _descentElapsed  = 0;
    _swingOffset     = 0;
    _swingVel        = 0;

    // Build anchor piton at top of rope
    _removeFromScene(_pitonMesh);
    _pitonMesh = _makePiton(_anchorX, _anchorY + 0.1, _anchorZ);

    // Build rope LineSegments from anchor to player (initially zero length)
    _removeFromScene(_ropeMesh);
    _ropeMesh = _makeRopeMesh(_anchorX, _anchorY, _anchorZ, pos.x, pos.y, pos.z);

    window._rappelActive = true;
    _updateHud();
    _spawnBuddyRopes();
  }

  // ── Start fast-rope ────────────────────────────────────────────────────────
  function _startFastRope() {
    if (_rappelling) return;
    var pos = _getPlayerPos();
    if (!pos) return;

    _rappelling      = true;
    _brakeOn         = false;
    _fastRope        = true;
    _rappelComplete  = false;
    _anchorX         = pos.x;
    _anchorY         = pos.y;
    _anchorZ         = pos.z;
    _targetY         = 0;
    _startY          = pos.y;
    _descentDuration = pos.y / FAST_ROPE_SPEED;
    _descentElapsed  = 0;
    _swingOffset     = 0;
    _swingVel        = 0;

    // Fast rope: thick cylinder from heli/anchor to ground
    _removeFromScene(_fastRopeMesh);
    _fastRopeMesh = _makeFastRopeMesh(_anchorX, _anchorY, _anchorZ, 0);

    // Build anchor piton
    _removeFromScene(_pitonMesh);
    _pitonMesh = _makePiton(_anchorX, _anchorY + 0.1, _anchorZ);

    // Also a thin line for visual clarity
    _removeFromScene(_ropeMesh);
    _ropeMesh = _makeRopeMesh(_anchorX, _anchorY, _anchorZ, pos.x, pos.y, pos.z);

    window._rappelActive = true;
    _updateHud();
  }

  // ── Stop rappel ───────────────────────────────────────────────────────────
  function _stopRappel(scored) {
    if (!_rappelling) return;

    if (scored && _enemyWithin30()) {
      _awardScore(SCORE_RAPPEL_FIRE);
      _showScorePopup();
    }

    _rappelling      = false;
    _brakeOn         = false;
    _fastRope        = false;
    _rappelComplete  = false;
    window._rappelActive = false;
    window._canShoot = true;

    _removeFromScene(_ropeMesh);
    _removeFromScene(_pitonMesh);
    _removeFromScene(_fastRopeMesh);
    _ropeMesh     = null;
    _pitonMesh    = null;
    _fastRopeMesh = null;

    _destroyBuddyRopes();
    _hideHud();
  }

  // ── Score popup ───────────────────────────────────────────────────────────
  function _showScorePopup() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.7)',
      'padding:6px 18px',
      'border-radius:5px',
      'pointer-events:none',
      'z-index:10000'
    ].join(';');
    el.textContent = '+150 RAPPEL UNDER FIRE';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2200);
  }

  // ── Buddy ropes (up to 3 from ChainOfCommand) ─────────────────────────────
  function _spawnBuddyRopes() {
    _destroyBuddyRopes();
    if (!window.ChainOfCommand) return;
    var buddies = window.ChainOfCommand.getBuddies ? window.ChainOfCommand.getBuddies() : null;
    if (!buddies || !buddies.length) return;
    var count = Math.min(buddies.length, MAX_BUDDY_ROPES);
    for (var i = 0; i < count; i++) {
      var b = buddies[i];
      var bPos = (b && b.position) ? b.position : null;
      if (!bPos) continue;
      var offsetX = (i - 1) * 1.5;
      var ax = _anchorX + offsetX;
      var ay = _anchorY;
      var az = _anchorZ;
      var mesh = _makeRopeMesh(ax, ay, az, bPos.x, bPos.y, bPos.z);
      _buddyRopes.push({
        mesh:    mesh,
        anchorX: ax,
        anchorY: ay,
        anchorZ: az,
        buddy:   b,
        active:  true
      });
    }
  }

  function _updateBuddyRopes(dt) {
    for (var i = 0; i < _buddyRopes.length; i++) {
      var br = _buddyRopes[i];
      if (!br.active) continue;
      var b = br.buddy;
      if (!b || !b.position) continue;
      // Buddy descends alongside player
      if (!_brakeOn && b.position.y > 0) {
        b.position.y -= ENEMY_RAPPEL_SPEED * dt;
        if (b.position.y < 0) b.position.y = 0;
      }
      _updateRopeMeshPoints(br.mesh, br.anchorX, br.anchorY, br.anchorZ,
        b.position.x, b.position.y, b.position.z);
    }
  }

  function _destroyBuddyRopes() {
    for (var i = 0; i < _buddyRopes.length; i++) {
      _removeFromScene(_buddyRopes[i].mesh);
    }
    _buddyRopes = [];
  }

  // ── Enemy rappel ──────────────────────────────────────────────────────────
  function _trySpawnEnemyRappel(rooftopY, x, z) {
    if (Math.random() > ENEMY_RAPPEL_CHANCE) return;
    var count = 2 + Math.floor(Math.random() * 3); // 2-4 enemies
    var group = { npcs: [], active: true };
    for (var i = 0; i < count; i++) {
      var ox = x + (i - 1) * 1.2;
      var mesh = _makeCylinderNpc(ox, rooftopY, z);
      // Build a rope for each NPC
      var ropeMesh = _makeRopeMesh(ox, rooftopY, z, ox, rooftopY, z);
      group.npcs.push({
        mesh:    mesh,
        ropeMesh: ropeMesh,
        anchorY: rooftopY,
        anchorX: ox,
        anchorZ: z,
        currentY: rooftopY,
        active:  true
      });
    }
    _enemyRappelGroups.push(group);
  }

  function _updateEnemyRappels(dt) {
    for (var g = 0; g < _enemyRappelGroups.length; g++) {
      var group = _enemyRappelGroups[g];
      if (!group.active) continue;
      var allDone = true;
      for (var n = 0; n < group.npcs.length; n++) {
        var npc = group.npcs[n];
        if (!npc.active) continue;
        npc.currentY -= ENEMY_RAPPEL_SPEED * dt;
        if (npc.currentY <= 0) {
          npc.currentY = 0;
          npc.active = false;
        } else {
          allDone = false;
        }
        if (npc.mesh) npc.mesh.position.y = npc.currentY;
        _updateRopeMeshPoints(npc.ropeMesh,
          npc.anchorX, npc.anchorY, npc.anchorZ,
          npc.anchorX, npc.currentY, npc.anchorZ);
      }
      if (allDone) group.active = false;
    }
  }

  function _destroyEnemyRappels() {
    for (var g = 0; g < _enemyRappelGroups.length; g++) {
      var group = _enemyRappelGroups[g];
      for (var n = 0; n < group.npcs.length; n++) {
        _removeFromScene(group.npcs[n].mesh);
        _removeFromScene(group.npcs[n].ropeMesh);
      }
    }
    _enemyRappelGroups = [];
  }

  // ── Key handlers ──────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var code = e.code || '';
    var key  = (e.key || '').toLowerCase();

    if (code === 'KeyR') _keyR = true;
    if (code === 'KeyP') _keyP = true;
    if (code === 'KeyW') _keyW = true;
    if (code === 'KeyA') _keyA = true;
    if (code === 'KeyD') _keyD = true;

    // R+P combo enters rappel mode
    if ((code === 'KeyR' || code === 'KeyP') && _keyR && _keyP) {
      if (!_rappelling) {
        // Check for fast-rope via CasualtyEvacuation heli
        if (_heliNearby()) {
          _startFastRope();
        } else if (_canStartRappel()) {
          _startRappel();
        }
      }
      return;
    }

    // R key alone: also start if near heli (fast-rope)
    if (code === 'KeyR' && !_rappelling) {
      if (_heliNearby() && _canStartRappel()) {
        _startFastRope();
      }
    }

    // Space: brake toggle (pause descent, allow firing)
    if (key === ' ' || code === 'Space') {
      _keySpace = true;
      if (_rappelling) {
        _brakeOn = !_brakeOn;
        window._canShoot = _brakeOn; // allow firing while braked
      }
    }

    // W: kick off wall
    if (code === 'KeyW' && _rappelling) {
      _kickOff();
    }
  }

  function _onKeyUp(e) {
    var code = e.code || '';
    var key  = (e.key || '').toLowerCase();

    if (code === 'KeyR') _keyR = false;
    if (code === 'KeyP') _keyP = false;
    if (code === 'KeyW') _keyW = false;
    if (code === 'KeyA') _keyA = false;
    if (code === 'KeyD') _keyD = false;
    if (key === ' ' || code === 'Space') _keySpace = false;
  }

  // ── Kick off wall ─────────────────────────────────────────────────────────
  function _kickOff() {
    if (!_rappelling) return;
    var pos = _getPlayerPos();
    var cam = _getCamera();
    if (!pos) return;

    // Launch player forward 3 units
    var fwdX = 0;
    var fwdZ = -1;
    if (cam) {
      fwdX = -Math.sin(cam.rotation.y);
      fwdZ = -Math.cos(cam.rotation.y);
    }

    pos.x += fwdX * KICK_FORWARD;
    pos.z += fwdZ * KICK_FORWARD;

    // Signal velocity if available
    if (window.playerVelocity) {
      window.playerVelocity.x = fwdX * KICK_FORWARD * 2;
      window.playerVelocity.z = fwdZ * KICK_FORWARD * 2;
    } else if (window.gameState && window.gameState.velocity) {
      window.gameState.velocity.x = fwdX * KICK_FORWARD * 2;
      window.gameState.velocity.z = fwdZ * KICK_FORWARD * 2;
    }

    _stopRappel(false);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _ensureHud();
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
    window._rappelActive = false;
    window._canShoot     = true;

    // Listen for enemy alert events to trigger enemy rappel
    document.addEventListener('enemyAlerted', function (ev) {
      var detail = ev.detail || {};
      var rooftopY = detail.rooftopY || 10;
      var x = detail.x || 0;
      var z = detail.z || 0;
      _trySpawnEnemyRappel(rooftopY, x, z);
    }, false);

    // Also allow external trigger
    window._triggerEnemyRappel = function (rooftopY, x, z) {
      _trySpawnEnemyRappel(rooftopY || 10, x || 0, z || 0);
    };
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;
    if (!dt || dt <= 0) dt = 0.016;

    // Update enemy rappels regardless of player state
    _updateEnemyRappels(dt);

    if (!_rappelling) return;

    var pos = _getPlayerPos();
    if (!pos) return;

    // ── Swing (A/D pendulum) ───────────────────────────────────────────────
    if (_keyA) {
      _swingVel -= SWING_SPEED * dt * 2;
    } else if (_keyD) {
      _swingVel += SWING_SPEED * dt * 2;
    } else {
      _swingVel *= Math.pow(SWING_DAMPEN, dt * 60);
    }

    // Clamp swing velocity
    if (_swingVel > SWING_SPEED) _swingVel = SWING_SPEED;
    if (_swingVel < -SWING_SPEED) _swingVel = -SWING_SPEED;

    _swingOffset += _swingVel * dt;

    // Clamp swing arc to ±8 units
    if (_swingOffset > SWING_MAX) {
      _swingOffset = SWING_MAX;
      _swingVel = -_swingVel * 0.4;
    } else if (_swingOffset < -SWING_MAX) {
      _swingOffset = -SWING_MAX;
      _swingVel = -_swingVel * 0.4;
    }

    pos.x = _anchorX + _swingOffset;

    // ── Descent (interpolate Y from startY to 0) ───────────────────────────
    if (!_brakeOn && !_rappelComplete) {
      _descentElapsed += dt;
      var t = (_descentDuration > 0) ? (_descentElapsed / _descentDuration) : 1;
      if (t >= 1) {
        t = 1;
        _rappelComplete = true;
      }
      pos.y = _startY + (_targetY - _startY) * t;

      if (_rappelComplete) {
        // Rappel finished — stop
        _stopRappel(true);
        return;
      }
    }

    // Allow firing while brake is on
    if (_brakeOn) {
      window._canShoot = true;
    } else {
      window._canShoot = false;
    }

    // ── Update rope mesh ───────────────────────────────────────────────────
    if (_ropeMesh) {
      _updateRopeMeshPoints(_ropeMesh,
        _anchorX, _anchorY, _anchorZ,
        pos.x, pos.y, pos.z);
    }

    // ── Update fast rope mesh position ────────────────────────────────────
    if (_fastRopeMesh) {
      var ropeLen = Math.max(0.1, _anchorY - pos.y);
      _fastRopeMesh.position.set(_anchorX, _anchorY - ropeLen / 2, _anchorZ);
      if (_fastRopeMesh.geometry) {
        _fastRopeMesh.geometry.dispose();
        _fastRopeMesh.geometry = new THREE.CylinderGeometry(0.06, 0.06, ropeLen, 8);
      }
    }

    // ── Update buddy ropes ─────────────────────────────────────────────────
    _updateBuddyRopes(dt);

    // ── HUD ───────────────────────────────────────────────────────────────
    _updateHud();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    _stopRappel(false);
    _destroyEnemyRappels();

    _keyR        = false;
    _keyP        = false;
    _keyW        = false;
    _keyA        = false;
    _keyD        = false;
    _keySpace    = false;
    _swingOffset = 0;
    _swingVel    = 0;

    window._rappelActive = false;
    window._canShoot     = true;
    _hideHud();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
