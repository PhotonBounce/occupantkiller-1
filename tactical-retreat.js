// tactical-retreat.js — Fighting Withdrawals, Retrograde Operations & Defensive Fallback Tactics
// IIFE module exposing window.TacticalRetreat = { init, update, reset }
window.TacticalRetreat = (function () {
  'use strict';

  // ── Phase constants ───────────────────────────────────────────────────────────
  var PHASE_NONE          = 0;
  var PHASE_BREAK_CONTACT = 1;  // lay suppressive fire, deploy smoke
  var PHASE_BOUND         = 2;  // alternate movement, one covers while other moves
  var PHASE_DISENGAGE     = 3;  // 75 units from enemy
  var PHASE_RALLY         = 4;  // converge on rally point

  var PHASE_NAMES = {
    0: 'NONE',
    1: 'BREAK CONTACT',
    2: 'BOUND',
    3: 'DISENGAGE',
    4: 'RALLY'
  };

  // ── Tuning constants ──────────────────────────────────────────────────────────
  var HP_RETREAT_THRESHOLD    = 0.30;   // < 30% max HP triggers warning
  var ENEMY_RATIO_THRESHOLD   = 4;      // enemies : player >= 4:1 within range
  var ENEMY_NEARBY_RANGE      = 20;     // units
  var RETREAT_SPEED_BONUS     = 1.20;   // +20% speed
  var RETREAT_RELOAD_BONUS    = 1.30;   // +30% reload speed
  var RETREAT_ACCURACY_DEBUFF = 0.85;   // enemy accuracy ×0.85 (−15%)
  var RALLY_POINT_DIST        = 30;     // units behind player from enemy centroid
  var DISENGAGE_DIST          = 75;     // units – counts as disengaged
  var SMOKE_EXPAND_TIME       = 3.0;    // seconds
  var SMOKE_MAX_RADIUS        = 4.0;
  var SMOKE_COUNT             = 2;
  var SMOKE_SPREAD            = 4;      // lateral spread of smoke drops
  var CALTROP_SLOW_FACTOR     = 0.50;   // 50% slow
  var CALTROP_DURATION        = 20.0;   // seconds
  var SCORE_SUCCESS            = 300;
  var SCORE_FIGHTING           = 100;
  var SUCCESS_HP_THRESHOLD     = 50;    // HP to distinguish success vs fighting
  var PULSE_INTERVAL           = 0.8;   // seconds between HUD warning pulses
  var BOUND_COVER_SWAP_TIME    = 4.0;   // seconds between bounding swaps
  var REARGUARD_FOLLOW_DIST    = 10;    // units behind rally at which rearguard re-joins
  var BREACH_CLEAR_RANGE       = 15;    // units — suppressive fire radius on B-press

  // ── Module state ─────────────────────────────────────────────────────────────
  var _scene      = null;
  var _camera     = null;
  var _playerRef  = null;   // { position:Vector3, hp, maxHp, speed, reloadMultiplier, score }
  var _enemyList  = null;   // array of { position:Vector3, alive, accuracy, speed, _caltropTimer }
  var _teamList   = null;   // array of ally refs (optional)

  var _active          = false;
  var _phase           = PHASE_NONE;
  var _rallyMarker     = null;   // THREE.Mesh (cone, green)
  var _rallyPos        = null;   // THREE.Vector3
  var _smokeObjects    = [];     // { mesh, age, dead }
  var _caltropClusters = [];     // { meshes[], pos, age, applied }
  var _rearguardBuddy  = null;   // ref to one ChainOfCommand buddy (if any)
  var _rearguardActive = false;

  // Key state
  var _keys           = {};
  var _rKeyWasDown    = false;
  var _tKeyWasDown    = false;
  var _cKeyWasDown    = false;
  var _bKeyWasDown    = false;

  // Timing
  var _pulseTimer      = 0;
  var _pulseVisible    = true;
  var _boundTimer      = 0;
  var _boundCoverPhase = 0;   // 0 = player moves / buddy covers; 1 = buddy moves / player covers

  // HUD elements
  var _hudEl          = null;
  var _warningEl      = null;
  var _phaseEl        = null;
  var _rallyDistEl    = null;
  var _enemyDistEl    = null;
  var _alertEl        = null;
  var _alertTimer     = 0;

  // Applied-modifier flags (so we only apply once and can undo)
  var _speedApplied   = false;
  var _modifiersOn    = false;

  // ── Keyboard listener ─────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  // ── HUD setup ─────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'tr-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'gap:4px',
      'pointer-events:none',
      'z-index:9999',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'color:#00ff88',
      'text-shadow:0 0 6px #00ff88'
    ].join(';');

    _warningEl = document.createElement('div');
    _warningEl.style.cssText = 'color:#ffcc00;font-size:16px;font-weight:bold;letter-spacing:2px;text-shadow:0 0 10px #ffcc00;display:none';
    _warningEl.textContent = 'TACTICAL RETREAT RECOMMENDED';

    _phaseEl = document.createElement('div');
    _phaseEl.style.display = 'none';

    _rallyDistEl = document.createElement('div');
    _rallyDistEl.style.display = 'none';

    _enemyDistEl = document.createElement('div');
    _enemyDistEl.style.display = 'none';

    _alertEl = document.createElement('div');
    _alertEl.style.cssText = 'color:#ff4444;font-size:15px;font-weight:bold;letter-spacing:1px;text-shadow:0 0 8px #ff4444;display:none';

    _hudEl.appendChild(_warningEl);
    _hudEl.appendChild(_phaseEl);
    _hudEl.appendChild(_rallyDistEl);
    _hudEl.appendChild(_enemyDistEl);
    _hudEl.appendChild(_alertEl);
    document.body.appendChild(_hudEl);
  }

  function _showAlert(msg, duration) {
    _alertEl.textContent = msg;
    _alertEl.style.display = 'block';
    _alertTimer = duration || 3.0;
  }

  function _updateHUD(dt) {
    if (!_hudEl) return;

    // Pulse warning
    if (_warningEl.style.display !== 'none') {
      _pulseTimer -= dt;
      if (_pulseTimer <= 0) {
        _pulseTimer = PULSE_INTERVAL;
        _pulseVisible = !_pulseVisible;
        _warningEl.style.opacity = _pulseVisible ? '1' : '0';
      }
    }

    // Alert timer
    if (_alertTimer > 0) {
      _alertTimer -= dt;
      if (_alertTimer <= 0) {
        _alertEl.style.display = 'none';
        _alertTimer = 0;
      }
    }

    // Phase display
    if (_active && _phase !== PHASE_NONE) {
      var phaseNum = _phase;
      var phaseName = PHASE_NAMES[_phase] || 'UNKNOWN';
      _phaseEl.style.display = 'block';
      _phaseEl.textContent = 'RETREAT: ' + phaseName + ' [Phase ' + phaseNum + '/4]';

      // Rally distance
      if (_rallyPos && _playerRef) {
        var rDist = _playerRef.position.distanceTo(_rallyPos);
        _rallyDistEl.style.display = 'block';
        _rallyDistEl.textContent = 'RALLY ' + Math.round(rDist) + 'm';
      }

      // Nearest enemy distance
      var nearestDist = _nearestEnemyDist();
      if (nearestDist < Infinity) {
        _enemyDistEl.style.display = 'block';
        _enemyDistEl.textContent = 'ENEMY ' + Math.round(nearestDist) + 'm';
      }
    } else {
      _phaseEl.style.display = 'none';
      _rallyDistEl.style.display = 'none';
      _enemyDistEl.style.display = 'none';
    }
  }

  // ── Helper: enemy utilities ───────────────────────────────────────────────────
  function _liveEnemies() {
    if (!_enemyList) return [];
    var result = [];
    var i;
    for (i = 0; i < _enemyList.length; i++) {
      if (_enemyList[i].alive !== false) {
        result.push(_enemyList[i]);
      }
    }
    return result;
  }

  function _nearestEnemyDist() {
    if (!_playerRef) return Infinity;
    var enemies = _liveEnemies();
    var minDist = Infinity;
    var i, d;
    for (i = 0; i < enemies.length; i++) {
      if (!enemies[i].position) continue;
      d = _playerRef.position.distanceTo(enemies[i].position);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  function _enemyCentroid() {
    var enemies = _liveEnemies();
    var centroid = new THREE.Vector3();
    var count = 0;
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (!enemies[i].position) continue;
      centroid.add(enemies[i].position);
      count++;
    }
    if (count > 0) centroid.divideScalar(count);
    return { pos: centroid, count: count };
  }

  function _enemiesNearPlayer(range) {
    if (!_playerRef) return 0;
    var enemies = _liveEnemies();
    var count = 0;
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (!enemies[i].position) continue;
      if (_playerRef.position.distanceTo(enemies[i].position) <= range) {
        count++;
      }
    }
    return count;
  }

  // ── Retreat condition check ───────────────────────────────────────────────────
  function _shouldWarnRetreat() {
    if (!_playerRef) return false;
    var hpRatio = _playerRef.hp / (_playerRef.maxHp || 100);
    if (hpRatio < HP_RETREAT_THRESHOLD) return true;
    var nearby = _enemiesNearPlayer(ENEMY_NEARBY_RANGE);
    if (nearby >= ENEMY_RATIO_THRESHOLD) return true;
    return false;
  }

  // ── Rally point placement ─────────────────────────────────────────────────────
  function _placeRallyPoint() {
    if (!_scene || !_playerRef) return;

    // Direction away from enemy centroid
    var cData = _enemyCentroid();
    var awayDir = new THREE.Vector3();
    if (cData.count > 0) {
      awayDir.subVectors(_playerRef.position, cData.pos).normalize();
    } else {
      // Default: behind camera forward
      if (_camera) {
        var camDir = new THREE.Vector3();
        _camera.getWorldDirection(camDir);
        awayDir.copy(camDir).negate();
      } else {
        awayDir.set(0, 0, -1);
      }
    }
    awayDir.y = 0;
    awayDir.normalize();

    _rallyPos = _playerRef.position.clone().addScaledVector(awayDir, RALLY_POINT_DIST);
    _rallyPos.y = 0;

    // Remove old marker
    if (_rallyMarker && _scene) {
      _scene.remove(_rallyMarker);
      _rallyMarker.geometry.dispose();
      _rallyMarker.material.dispose();
      _rallyMarker = null;
    }

    var geo = new THREE.ConeGeometry(0.5, 2.5, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    _rallyMarker = new THREE.Mesh(geo, mat);
    _rallyMarker.position.copy(_rallyPos);
    _rallyMarker.position.y = 1.25;  // cone tip pointing up
    _scene.add(_rallyMarker);
  }

  // ── Smoke deployment ──────────────────────────────────────────────────────────
  function _deploySmokeGrenades() {
    if (!_scene || !_playerRef) return;

    // Try to use SmokeGrenade module if available
    if (window.SmokeGrenade && typeof window.SmokeGrenade.throw === 'function') {
      window.SmokeGrenade.throw('WHITE');
      window.SmokeGrenade.throw('WHITE');
      return;
    }

    // Fallback: spawn expanding sphere smoke visuals
    var cData = _enemyCentroid();
    var awayDir = new THREE.Vector3();
    if (cData.count > 0) {
      awayDir.subVectors(_playerRef.position, cData.pos).normalize();
    } else {
      awayDir.set(0, 0, 1);
    }
    awayDir.y = 0;
    awayDir.normalize();

    var right = new THREE.Vector3(-awayDir.z, 0, awayDir.x);
    var i;
    for (i = 0; i < SMOKE_COUNT; i++) {
      var side = (i % 2 === 0) ? 1 : -1;
      var offset = right.clone().multiplyScalar(side * SMOKE_SPREAD);
      var spawnPos = _playerRef.position.clone().addScaledVector(awayDir, -3).add(offset);
      spawnPos.y = 0.5;

      var geo = new THREE.SphereGeometry(0.1, 8, 8);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xCCCCCC,
        transparent: true,
        opacity: 0.55
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(spawnPos);
      _scene.add(mesh);

      _smokeObjects.push({ mesh: mesh, age: 0, dead: false });
    }
  }

  // ── Caltrop deployment ────────────────────────────────────────────────────────
  function _dropCaltrops() {
    if (!_scene || !_playerRef) return;

    var cluster = [];
    var basePos = _playerRef.position.clone();
    basePos.y = 0.1;

    var i, offX, offZ;
    for (i = 0; i < 6; i++) {
      offX = (Math.random() - 0.5) * 2.5;
      offZ = (Math.random() - 0.5) * 2.5;
      var geo = new THREE.SphereGeometry(0.12, 4, 4);
      var mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(basePos.x + offX, basePos.y, basePos.z + offZ);
      _scene.add(mesh);
      cluster.push(mesh);
    }

    _caltropClusters.push({
      meshes: cluster,
      pos: basePos.clone(),
      age: 0,
      applied: false
    });

    _showAlert('CALTROPS DEPLOYED', 2.0);
  }

  // ── Breach and clear ──────────────────────────────────────────────────────────
  function _callBreachFire() {
    if (!_playerRef) return;

    // Find enemy group blocking retreat path
    var blocked = _findBlockingEnemies();
    if (blocked.length === 0) {
      _showAlert('NO BLOCKING ENEMY DETECTED', 2.0);
      return;
    }

    _showAlert('SUPPRESSIVE FIRE CALLED — BREACH EXECUTING', 2.5);

    // Visual burst — white flash spheres at enemy positions
    var i;
    for (i = 0; i < blocked.length; i++) {
      (function (enemy) {
        if (!enemy.position) return;
        var geo = new THREE.SphereGeometry(1.5, 8, 8);
        var mat = new THREE.MeshBasicMaterial({
          color: 0xFFFF99,
          transparent: true,
          opacity: 0.8
        });
        var flash = new THREE.Mesh(geo, mat);
        flash.position.copy(enemy.position);
        flash.position.y = 1;
        _scene.add(flash);

        // Suppress the enemy briefly (treat as suppression)
        if (typeof enemy.suppressionLevel !== 'undefined') {
          enemy.suppressionLevel = (enemy.suppressionLevel || 0) + 80;
        }

        // Fade out flash after 0.5s (handled via timeout for simplicity)
        var startTime = Date.now();
        var fadeInterval = setInterval(function () {
          var elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= 0.5) {
            _scene.remove(flash);
            flash.geometry.dispose();
            flash.material.dispose();
            clearInterval(fadeInterval);
          } else {
            flash.material.opacity = 0.8 * (1 - elapsed / 0.5);
          }
        }, 16);
      }(_enemyList[i < blocked.length ? blocked[i] : 0]));
    }
  }

  function _findBlockingEnemies() {
    if (!_playerRef || !_rallyPos) return [];
    var blocking = [];
    var retreatDir = new THREE.Vector3().subVectors(_rallyPos, _playerRef.position).normalize();
    var enemies = _liveEnemies();
    var i, toEnemy, dot, dist;
    for (i = 0; i < enemies.length; i++) {
      if (!enemies[i].position) continue;
      dist = _playerRef.position.distanceTo(enemies[i].position);
      if (dist > BREACH_CLEAR_RANGE) continue;
      toEnemy = new THREE.Vector3().subVectors(enemies[i].position, _playerRef.position).normalize();
      dot = retreatDir.dot(toEnemy);
      if (dot > 0.5) {   // enemy is roughly in direction of retreat
        blocking.push(enemies[i]);
      }
    }
    return blocking;
  }

  // ── Rearguard ─────────────────────────────────────────────────────────────────
  function _setupRearguard() {
    if (!window.ChainOfCommand) return;
    var buddies = window.ChainOfCommand.getBuddies ? window.ChainOfCommand.getBuddies() : null;
    if (!buddies || buddies.length === 0) return;

    _rearguardBuddy = buddies[0];
    _rearguardActive = true;

    // Tell buddy to hold current position and fire (via ChainOfCommand API)
    if (window.ChainOfCommand.setOrder) {
      window.ChainOfCommand.setOrder('ATTACK');
    }

    _showAlert('REARGUARD ESTABLISHED — COVERING WITHDRAWAL', 2.5);
  }

  function _updateRearguard() {
    if (!_rearguardActive || !_rearguardBuddy || !_rallyPos || !_playerRef) return;

    // Once player reaches DISENGAGE phase, tell rearguard to fall back
    if (_phase >= PHASE_DISENGAGE) {
      if (window.ChainOfCommand && window.ChainOfCommand.setOrder) {
        window.ChainOfCommand.setOrder('MOVE TO');
      }
    }

    // Rearguard rejoins when close enough to rally
    if (_rearguardBuddy.position) {
      var distToRally = _rearguardBuddy.position.distanceTo(_rallyPos);
      if (distToRally < REARGUARD_FOLLOW_DIST) {
        _rearguardActive = false;
        if (window.ChainOfCommand && window.ChainOfCommand.setOrder) {
          window.ChainOfCommand.setOrder('HOLD FIRE');
        }
      }
    }
  }

  // ── Speed / accuracy modifiers ────────────────────────────────────────────────
  function _applyRetreatModifiers() {
    if (_modifiersOn) return;
    _modifiersOn = true;

    // Player speed
    if (_playerRef && typeof _playerRef.speed === 'number') {
      _playerRef.speed *= RETREAT_SPEED_BONUS;
    }

    // Player reload
    if (_playerRef && typeof _playerRef.reloadMultiplier === 'number') {
      _playerRef.reloadMultiplier *= RETREAT_RELOAD_BONUS;
    }

    // Enemy accuracy debuff
    var enemies = _liveEnemies();
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (typeof enemies[i].accuracy === 'number') {
        enemies[i].accuracy *= RETREAT_ACCURACY_DEBUFF;
        enemies[i]._retreatDebuffed = true;
      }
    }
  }

  function _removeRetreatModifiers() {
    if (!_modifiersOn) return;
    _modifiersOn = false;

    // Undo player speed
    if (_playerRef && typeof _playerRef.speed === 'number') {
      _playerRef.speed /= RETREAT_SPEED_BONUS;
    }

    // Undo player reload
    if (_playerRef && typeof _playerRef.reloadMultiplier === 'number') {
      _playerRef.reloadMultiplier /= RETREAT_RELOAD_BONUS;
    }

    // Undo enemy accuracy debuff
    var enemies = _liveEnemies();
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i]._retreatDebuffed && typeof enemies[i].accuracy === 'number') {
        enemies[i].accuracy /= RETREAT_ACCURACY_DEBUFF;
        enemies[i]._retreatDebuffed = false;
      }
    }
  }

  // ── Enter / exit retreat mode ─────────────────────────────────────────────────
  function _enterRetreat() {
    if (_active) return;
    _active = true;
    _phase  = PHASE_BREAK_CONTACT;
    _boundTimer      = 0;
    _boundCoverPhase = 0;

    _applyRetreatModifiers();
    _placeRallyPoint();
    _deploySmokeGrenades();
    _setupRearguard();

    _showAlert('TACTICAL RETREAT INITIATED — BREAK CONTACT', 3.0);
  }

  function _exitRetreat(reason) {
    if (!_active) return;
    _active = false;
    _phase  = PHASE_NONE;

    _removeRetreatModifiers();
    _rearguardActive = false;

    // Clear warning
    _warningEl.style.display = 'none';

    if (reason === 'success') {
      _showAlert('SUCCESSFUL WITHDRAWAL — +' + SCORE_SUCCESS, 4.0);
      if (_playerRef) _playerRef.score = (_playerRef.score || 0) + SCORE_SUCCESS;
    } else if (reason === 'fighting') {
      _showAlert('FIGHTING WITHDRAWAL — +' + SCORE_FIGHTING, 4.0);
      if (_playerRef) _playerRef.score = (_playerRef.score || 0) + SCORE_FIGHTING;
    } else if (reason === 'failed') {
      _showAlert('WITHDRAWAL FAILED — MAN DOWN', 4.0);
    }
  }

  // ── Phase advancement ─────────────────────────────────────────────────────────
  function _advancePhase(dt) {
    if (!_active) return;

    var nearDist  = _nearestEnemyDist();
    var cData     = _enemyCentroid();
    var distToCentroid = _playerRef ? _playerRef.position.distanceTo(cData.pos) : 0;

    if (_phase === PHASE_BREAK_CONTACT) {
      // Transition to BOUND after 5 seconds or once smoke is deploying
      _boundTimer += dt;
      if (_boundTimer >= 5.0) {
        _phase      = PHASE_BOUND;
        _boundTimer = 0;
      }

    } else if (_phase === PHASE_BOUND) {
      // Alternate bounding movement
      _boundTimer += dt;
      if (_boundTimer >= BOUND_COVER_SWAP_TIME) {
        _boundCoverPhase = 1 - _boundCoverPhase;
        _boundTimer = 0;
        if (_boundCoverPhase === 0) {
          _showAlert('MOVE! BOUNDING FORWARD', 1.5);
        } else {
          _showAlert('COVER! HOLD POSITION', 1.5);
        }
      }

      // Transition to DISENGAGE when far enough
      if (distToCentroid >= DISENGAGE_DIST || nearDist >= DISENGAGE_DIST) {
        _phase      = PHASE_DISENGAGE;
        _boundTimer = 0;
        _showAlert('DISENGAGED — MOVE TO RALLY', 2.0);
      }

    } else if (_phase === PHASE_DISENGAGE) {
      // Check for blocking enemies
      var blocking = _findBlockingEnemies();
      if (blocking.length > 0) {
        _showAlert('BREACH REQUIRED — PRESS B FOR SUPPRESSIVE FIRE', 3.0);
      }

      // Transition to RALLY
      if (_rallyPos && _playerRef) {
        var distToRally = _playerRef.position.distanceTo(_rallyPos);
        if (distToRally < 8) {
          _phase = PHASE_RALLY;
          _showAlert('RALLY POINT REACHED — CONSOLIDATE', 2.5);
        }
      }

    } else if (_phase === PHASE_RALLY) {
      // Check success / fighting withdrawal
      if (_rallyPos && _playerRef) {
        var distToRallyCheck = _playerRef.position.distanceTo(_rallyPos);
        if (distToRallyCheck < 8) {
          var hp = _playerRef.hp || 0;
          if (hp > SUCCESS_HP_THRESHOLD) {
            _exitRetreat('success');
          } else {
            _exitRetreat('fighting');
          }
        }
      }
    }
  }

  // ── Smoke update ──────────────────────────────────────────────────────────────
  function _updateSmoke(dt) {
    var i, s, t, radius;
    for (i = _smokeObjects.length - 1; i >= 0; i--) {
      s = _smokeObjects[i];
      if (s.dead) continue;

      s.age += dt;
      t = Math.min(s.age / SMOKE_EXPAND_TIME, 1.0);
      radius = t * SMOKE_MAX_RADIUS;

      s.mesh.scale.setScalar(radius / 0.1);   // original SphereGeometry radius = 0.1

      // Fade opacity as smoke dissipates
      if (s.age > SMOKE_EXPAND_TIME) {
        var fadeT = (s.age - SMOKE_EXPAND_TIME) / 3.0;
        s.mesh.material.opacity = Math.max(0, 0.55 * (1 - fadeT));
        if (s.mesh.material.opacity <= 0) {
          _scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          s.mesh.material.dispose();
          s.dead = true;
        }
      }
    }
  }

  // ── Caltrop update ────────────────────────────────────────────────────────────
  function _updateCaltrops(dt) {
    var i, j, cl, enemy, dist;
    var enemies = _liveEnemies();

    for (i = _caltropClusters.length - 1; i >= 0; i--) {
      cl = _caltropClusters[i];
      cl.age += dt;

      // Apply slow to enemies in range
      if (!cl.applied) {
        for (j = 0; j < enemies.length; j++) {
          enemy = enemies[j];
          if (!enemy.position) continue;
          dist = cl.pos.distanceTo(enemy.position);
          if (dist < 3.0) {
            if (typeof enemy.speed === 'number') {
              enemy.speed *= CALTROP_SLOW_FACTOR;
              enemy._caltropSlowed = true;
            }
          }
        }
        cl.applied = true;
      }

      // Expire after CALTROP_DURATION
      if (cl.age >= CALTROP_DURATION) {
        // Restore enemy speed
        for (j = 0; j < enemies.length; j++) {
          enemy = enemies[j];
          if (enemy._caltropSlowed && typeof enemy.speed === 'number') {
            enemy.speed /= CALTROP_SLOW_FACTOR;
            enemy._caltropSlowed = false;
          }
        }
        // Remove meshes
        for (j = 0; j < cl.meshes.length; j++) {
          if (_scene) {
            _scene.remove(cl.meshes[j]);
            cl.meshes[j].geometry.dispose();
            cl.meshes[j].material.dispose();
          }
        }
        _caltropClusters.splice(i, 1);
      }
    }
  }

  // ── Rally marker animation ────────────────────────────────────────────────────
  function _updateRallyMarker(dt) {
    if (!_rallyMarker) return;
    _rallyMarker.rotation.y += dt * 1.5;
    _rallyMarker.position.y = 1.25 + Math.sin(Date.now() * 0.003) * 0.3;
  }

  // ── Input handling ────────────────────────────────────────────────────────────
  function _handleInput() {
    // R+T together — enter retreat mode
    var rDown = !!_keys['KeyR'];
    var tDown = !!_keys['KeyT'];
    var cDown = !!_keys['KeyC'];
    var bDown = !!_keys['KeyB'];

    if (rDown && tDown && !_rKeyWasDown && !_tKeyWasDown) {
      if (!_active) {
        _enterRetreat();
      }
    }
    _rKeyWasDown = rDown;
    _tKeyWasDown = tDown;

    // C — drop caltrops (only during retreat)
    if (cDown && !_cKeyWasDown && _active) {
      _dropCaltrops();
    }
    _cKeyWasDown = cDown;

    // B — call breach / suppressive fire
    if (bDown && !_bKeyWasDown && _active) {
      _callBreachFire();
    }
    _bKeyWasDown = bDown;
  }

  // ── Death check ───────────────────────────────────────────────────────────────
  function _checkPlayerDeath() {
    if (!_playerRef) return;
    var hp = _playerRef.hp;
    if (typeof hp !== 'number') return;
    if (hp <= 0 && _active) {
      _exitRetreat('failed');
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────────────
  function init(opts) {
    opts = opts || {};

    _scene     = opts.scene     || (window._scene)     || null;
    _camera    = opts.camera    || (window._camera)    || null;
    _playerRef = opts.player    || (window._player)    || null;
    _enemyList = opts.enemies   || (window._enemies)   || [];
    _teamList  = opts.team      || (window._team)      || [];

    // Defensive: re-read live refs each update instead of freezing them at init
    // so callers can also pass getter functions
    if (typeof opts.getEnemies === 'function') {
      _getEnemiesFn = opts.getEnemies;
    }
    if (typeof opts.getPlayer === 'function') {
      _getPlayerFn = opts.getPlayer;
    }

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _buildHUD();

    _active          = false;
    _phase           = PHASE_NONE;
    _smokeObjects    = [];
    _caltropClusters = [];
    _rearguardActive = false;
    _modifiersOn     = false;
    _pulseTimer      = PULSE_INTERVAL;
    _pulseVisible    = true;
  }

  // Dynamic getter support (set by init if provided)
  var _getEnemiesFn = null;
  var _getPlayerFn  = null;

  function _resolveRefs() {
    if (_getPlayerFn)  _playerRef = _getPlayerFn();
    if (_getEnemiesFn) _enemyList = _getEnemiesFn();
  }

  // ── Public: update ────────────────────────────────────────────────────────────
  function update(dt) {
    dt = dt || 0.016;

    _resolveRefs();
    _handleInput();
    _checkPlayerDeath();

    // Show / hide retreat warning
    if (_shouldWarnRetreat() && !_active) {
      _warningEl.style.display = 'block';
      _pulseTimer -= dt;
      if (_pulseTimer <= 0) {
        _pulseTimer = PULSE_INTERVAL;
        _pulseVisible = !_pulseVisible;
        _warningEl.style.opacity = _pulseVisible ? '1' : '0';
      }
    } else if (!_active) {
      _warningEl.style.display = 'none';
    }

    if (_active) {
      _advancePhase(dt);
      _updateRearguard();
    }

    _updateSmoke(dt);
    _updateCaltrops(dt);
    _updateRallyMarker(dt);
    _updateHUD(dt);
  }

  // ── Public: reset ─────────────────────────────────────────────────────────────
  function reset() {
    _exitRetreat(null);

    // Clear smoke
    var i, j;
    for (i = 0; i < _smokeObjects.length; i++) {
      if (_smokeObjects[i].dead) continue;
      if (_scene) {
        _scene.remove(_smokeObjects[i].mesh);
        _smokeObjects[i].mesh.geometry.dispose();
        _smokeObjects[i].mesh.material.dispose();
      }
    }
    _smokeObjects = [];

    // Clear caltrops
    for (i = 0; i < _caltropClusters.length; i++) {
      for (j = 0; j < _caltropClusters[i].meshes.length; j++) {
        if (_scene) {
          _scene.remove(_caltropClusters[i].meshes[j]);
          _caltropClusters[i].meshes[j].geometry.dispose();
          _caltropClusters[i].meshes[j].material.dispose();
        }
      }
    }
    _caltropClusters = [];

    // Clear rally marker
    if (_rallyMarker && _scene) {
      _scene.remove(_rallyMarker);
      _rallyMarker.geometry.dispose();
      _rallyMarker.material.dispose();
      _rallyMarker = null;
    }
    _rallyPos = null;

    // Restore enemy accuracy modifiers that may still be on
    _removeRetreatModifiers();

    _active          = false;
    _phase           = PHASE_NONE;
    _rearguardActive = false;
    _rearguardBuddy  = null;
    _keys            = {};
    _rKeyWasDown     = false;
    _tKeyWasDown     = false;
    _cKeyWasDown     = false;
    _bKeyWasDown     = false;
    _pulseTimer      = PULSE_INTERVAL;
    _pulseVisible    = true;
    _boundTimer      = 0;
    _alertTimer      = 0;

    if (_hudEl) {
      _warningEl.style.display  = 'none';
      _phaseEl.style.display    = 'none';
      _rallyDistEl.style.display = 'none';
      _enemyDistEl.style.display = 'none';
      _alertEl.style.display    = 'none';
    }

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
