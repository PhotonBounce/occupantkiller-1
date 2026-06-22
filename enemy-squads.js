/* ════════════════════════════════════════════════════════════════════
 *  ENEMY SQUADS — coordinated squad tactics for enemy groups
 *  ─────────────────────────────────────────────────────────────────
 *  Organizes wave enemies into squads of 3-4 with:
 *    - Bounding overwatch (alternating advance/cover halves)
 *    - Flanking maneuvers (perpendicular movement to player)
 *    - Squad communication (leader spots = all squad alerted)
 *    - Leader death transitions (panic → new leader promotion)
 *    - Squad spacing enforcement (prevent clumping)
 *    - Visual indicators (squad color outlines, leader diamond, flanker arrow)
 *    - HUD indicator when squads active
 *
 *  Public API:
 *    EnemySquads.init(scene, camera)   — call once after scene exists
 *    EnemySquads.update(delta)         — per-frame (called from game loop)
 *    EnemySquads.formSquads(wave)      — call after wave enemies are spawned
 *    EnemySquads.dissolveSquad(id)     — remove a squad by id
 *    EnemySquads.getSquads()           — return current squads array
 *    EnemySquads.reset()               — clear all state
 *
 *  Wave scaling:
 *    Wave 1-2: no squads (individual enemies)
 *    Wave 3-5: squads of 3
 *    Wave 6+:  squads of 4, flanking tactics enabled
 *    Boss wave: boss + 2 elite bodyguard squad
 * ════════════════════════════════════════════════════════════════════ */

window.EnemySquads = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _squads = [];          // array of squad objects
  var _hudEl  = null;        // bottom HUD indicator element
  var _initialized = false;
  var _currentWave = 0;

  /* ── constants ──────────────────────────────────────────────────── */
  var OVERWATCH_INTERVAL    = 2.0;   // seconds between overwatch phase switches
  var FLANK_TRIGGER_TIME    = 5.0;   // seconds engaging without kill before flanking
  var PANIC_DURATION        = 2.0;   // seconds of panic after leader dies
  var AGGRO_BONUS_MIN_LIFE  = 20.0;  // seconds leader alive for bonus aggro on death
  var AGGRO_BONUS_MULT      = 0.10;  // +10% aggro multiplier
  var SPACING_MIN           = 1.5;   // units — push apart if closer than this
  var SPACING_TARGET_MIN    = 2.0;   // desired minimum spacing
  var SPACING_TARGET_MAX    = 3.0;   // desired maximum spacing
  var LEADER_LABEL          = '◆';  // ◆ diamond
  var FLANKER_LABEL         = '→';  // → arrow

  /* ── squad color cycle (4 colors) ──────────────────────────────── */
  var SQUAD_COLORS = ['#ff3333', '#3399ff', '#33cc33', '#ff8800'];
  var SQUAD_COLOR_NAMES = ['red', 'blue', 'green', 'orange'];

  /* ── DOM marker pool ────────────────────────────────────────────── */
  var _markers = [];   // { el, enemy, type: 'leader'|'flanker' }

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _squads = [];
    _markers = [];
    _initialized = true;
    _ensureHUD();
    _clearMarkers();
  }

  /* ════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════ */
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'hud-squad-indicator';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:72px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:8400',
      'font-family:monospace',
      'font-size:11px',
      'color:#ffcc00',
      'background:rgba(0,0,0,0.55)',
      'padding:3px 10px',
      'border-radius:4px',
      'border:1px solid rgba(255,204,0,0.35)',
      'letter-spacing:1px',
      'pointer-events:none',
      'display:none',
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) _ensureHUD();
    var active = _squads.filter(function (s) { return s && s.members && s.members.length > 0; });
    if (active.length === 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.textContent = '[SQUAD TACTICS ACTIVE — ' + active.length + ' SQUAD' + (active.length !== 1 ? 'S' : '') + ']';
    _hudEl.style.display = 'block';
  }

  /* ════════════════════════════════════════════════════════════════
     DOM MARKERS (leader diamond ◆ and flanker arrow →)
  ════════════════════════════════════════════════════════════════ */
  function _clearMarkers() {
    for (var i = 0; i < _markers.length; i++) {
      if (_markers[i] && _markers[i].el && _markers[i].el.parentNode) {
        _markers[i].el.parentNode.removeChild(_markers[i].el);
      }
    }
    _markers = [];
  }

  function _getOrCreateMarker(enemy, type) {
    /* find existing */
    for (var i = 0; i < _markers.length; i++) {
      if (_markers[i] && _markers[i].enemy === enemy && _markers[i].type === type) {
        return _markers[i];
      }
    }
    /* create new */
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'z-index:8300',
      'pointer-events:none',
      'font-size:13px',
      'font-weight:bold',
      'text-shadow:0 0 4px rgba(0,0,0,0.9)',
      'transform:translate(-50%,-100%)',
      'display:none',
    ].join(';');
    if (type === 'leader') {
      el.textContent = LEADER_LABEL;
      el.style.color = '#ffcc00';
    } else {
      el.textContent = FLANKER_LABEL;
      el.style.color = '#ffffff';
    }
    document.body.appendChild(el);
    var m = { el: el, enemy: enemy, type: type };
    _markers.push(m);
    return m;
  }

  function _removeMarkersForEnemy(enemy) {
    for (var i = _markers.length - 1; i >= 0; i--) {
      if (_markers[i] && _markers[i].enemy === enemy) {
        if (_markers[i].el && _markers[i].el.parentNode) {
          _markers[i].el.parentNode.removeChild(_markers[i].el);
        }
        _markers.splice(i, 1);
      }
    }
  }

  /* project 3D world position to 2D screen coords — returns null if behind camera */
  function _worldToScreen(pos) {
    if (!_camera) return null;
    var v = pos.clone();
    v.project(_camera);
    if (v.z > 1) return null;   /* behind camera */
    var w = window.innerWidth;
    var h = window.innerHeight;
    return {
      x: ( v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
    };
  }

  function _updateMarkers() {
    for (var i = 0; i < _markers.length; i++) {
      var m = _markers[i];
      if (!m || !m.enemy || !m.enemy.mesh || !m.enemy.alive) {
        if (m && m.el) m.el.style.display = 'none';
        continue;
      }
      /* position above head */
      var pos3 = m.enemy.mesh.position.clone();
      pos3.y += 2.6;
      var sc = _worldToScreen(pos3);
      if (!sc || sc.x < 0 || sc.x > window.innerWidth || sc.y < 0 || sc.y > window.innerHeight) {
        m.el.style.display = 'none';
        continue;
      }
      m.el.style.display = 'block';
      m.el.style.left = sc.x + 'px';
      m.el.style.top  = sc.y + 'px';
    }
  }

  /* ════════════════════════════════════════════════════════════════
     FORM SQUADS — called after a wave's enemies are all spawned
  ════════════════════════════════════════════════════════════════ */
  function formSquads(wave) {
    _currentWave = wave || 0;
    /* clear old state */
    _clearMarkers();
    _squads = [];

    /* waves 1-2: no squads */
    if (_currentWave < 3) {
      _updateHUD();
      return;
    }

    var all = (typeof window.Enemies !== 'undefined' && window.Enemies.getAll)
      ? window.Enemies.getAll() : [];
    if (!all || all.length === 0) {
      _updateHUD();
      return;
    }

    var squadSize = (_currentWave >= 6) ? 4 : 3;

    /* group into squads */
    var squadIndex = 0;
    var i = 0;
    while (i < all.length) {
      var members = [];
      for (var j = 0; j < squadSize && i < all.length; j++, i++) {
        members.push(all[i]);
      }
      if (members.length < 2) {
        /* solo enemy — no squad */
        break;
      }
      squadIndex++;
      var squadId    = 'SQUAD_' + squadIndex;
      var colorIdx   = (squadIndex - 1) % SQUAD_COLORS.length;
      var squadColor = SQUAD_COLORS[colorIdx];

      /* assign roles */
      for (var k = 0; k < members.length; k++) {
        var e = members[k];
        e._squadId   = squadId;
        if (k === 0) {
          e._squadRole = 'LEADER';
        } else if (k === members.length - 1 && _currentWave >= 6) {
          e._squadRole = 'FLANKER';
        } else {
          e._squadRole = 'RIFLEMAN';
        }
        e._hasTarget       = false;
        e._squadColor      = squadColor;
        e._panicTimer      = 0;
        e._flankTimer      = 0;
        e._isFlanking      = false;
        e._flankAngle      = 0;
        e._leaderAliveTime = 0;
        e._aggroBonusActive = false;
      }

      var squad = {
        id:             squadId,
        members:        members,
        colorIdx:       colorIdx,
        color:          squadColor,
        leader:         members[0],
        overwatchTimer: 0,
        overwatchPhase: 0,       /* 0 = first half advances, 1 = second half advances */
        engageTimer:    0,
        killsSinceForm: 0,
        formedAt:       performance.now(),
        isBossSquad:    false,
      };
      _squads.push(squad);

      /* create leader marker */
      _getOrCreateMarker(members[0], 'leader');
    }

    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     DISSOLVE SQUAD
  ════════════════════════════════════════════════════════════════ */
  function dissolveSquad(squadId) {
    for (var i = _squads.length - 1; i >= 0; i--) {
      if (_squads[i] && _squads[i].id === squadId) {
        var members = _squads[i].members;
        for (var j = 0; j < members.length; j++) {
          _removeMarkersForEnemy(members[j]);
          members[j]._squadId   = null;
          members[j]._squadRole = null;
        }
        _squads.splice(i, 1);
        break;
      }
    }
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     GET SQUADS
  ════════════════════════════════════════════════════════════════ */
  function getSquads() {
    return _squads;
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    _clearMarkers();
    _squads = [];
    _currentWave = 0;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE — called each frame
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_initialized) return;
    if (_squads.length === 0) return;

    var playerPos = _getPlayerPos();

    for (var si = _squads.length - 1; si >= 0; si--) {
      var squad = _squads[si];
      if (!squad) { _squads.splice(si, 1); continue; }

      /* prune dead members */
      squad.members = squad.members.filter(function (e) { return e && e.alive; });
      if (squad.members.length === 0) {
        _squads.splice(si, 1);
        continue;
      }

      /* advance engage timer for flanking trigger */
      squad.engageTimer += delta;

      /* ── 1. leader death check ──────────────────────────────── */
      _handleLeaderDeath(squad, delta);

      /* ── 2. squad communication — leader spots player ───────── */
      _handleSquadComms(squad, playerPos);

      /* ── 3. bounding overwatch ──────────────────────────────── */
      _handleBoundingOverwatch(squad, delta, playerPos);

      /* ── 4. flanking ────────────────────────────────────────── */
      _handleFlanking(squad, delta, playerPos);

      /* ── 5. spacing enforcement ─────────────────────────────── */
      _handleSpacing(squad);

      /* ── 6. panic update ────────────────────────────────────── */
      _handlePanic(squad, delta, playerPos);
    }

    /* update 3D→2D markers */
    _updateMarkers();

    /* update HUD */
    _updateHUD();
  }

  /* ── leader death handling ──────────────────────────────────────── */
  function _handleLeaderDeath(squad, delta) {
    if (!squad.leader) return;

    /* track how long leader has been alive */
    if (squad.leader.alive) {
      squad.leader._leaderAliveTime = (squad.leader._leaderAliveTime || 0) + delta;
      return;   /* still alive — nothing to do */
    }

    /* leader just died */
    var leaderAliveTime = squad.leader._leaderAliveTime || 0;
    var aggroBonus      = leaderAliveTime > AGGRO_BONUS_MIN_LIFE;

    /* trigger panic on all survivors */
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (!e.alive) continue;
      e._panicTimer = PANIC_DURATION;
      if (aggroBonus) {
        e._aggroBonusActive = true;
        e._aggroMult = (e._aggroMult || 1.0) * (1.0 + AGGRO_BONUS_MULT);
      }
    }

    /* remove leader marker */
    _removeMarkersForEnemy(squad.leader);

    /* promote nearest alive member to leader */
    var newLeader = _findNearestAlive(squad.members, squad.leader.mesh
      ? squad.leader.mesh.position : null);
    if (newLeader) {
      newLeader._squadRole = 'LEADER';
      newLeader._leaderAliveTime = 0;
      squad.leader = newLeader;
      /* add leader marker to new leader */
      _getOrCreateMarker(newLeader, 'leader');
    } else {
      squad.leader = null;
    }
  }

  /* ── squad comms — when leader has target, share with all ──────── */
  function _handleSquadComms(squad, playerPos) {
    if (!squad.leader || !squad.leader.alive) return;
    var leader = squad.leader;
    /* check if leader has spotted player (has target) */
    if (!leader._hasTarget) return;
    /* share to all members */
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (e && e.alive && !e._hasTarget) {
        e._hasTarget = true;   /* bypass individual detection delay */
      }
    }
  }

  /* ── bounding overwatch ─────────────────────────────────────────── */
  function _handleBoundingOverwatch(squad, delta, playerPos) {
    squad.overwatchTimer += delta;
    if (squad.overwatchTimer < OVERWATCH_INTERVAL) {
      /* apply current phase crouch/stand */
      _applyOverwatchPhase(squad);
      return;
    }
    /* switch phase */
    squad.overwatchTimer = 0;
    squad.overwatchPhase = squad.overwatchPhase === 0 ? 1 : 0;
    _applyOverwatchPhase(squad);
  }

  function _applyOverwatchPhase(squad) {
    var half = Math.ceil(squad.members.length / 2);
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (!e || !e.alive || !e.mesh) continue;
      /* first half advances (phase 0) or covers (phase 1) */
      if (squad.overwatchPhase === 0) {
        /* first half: advancing — normal scale */
        if (i < half) {
          e.mesh.scale.y = 1.0;
          e._overwatchCovering = false;
        } else {
          /* second half: crouching/covering */
          e.mesh.scale.y = 0.7;
          e._overwatchCovering = true;
        }
      } else {
        /* second half: advancing */
        if (i >= half) {
          e.mesh.scale.y = 1.0;
          e._overwatchCovering = false;
        } else {
          /* first half: covering */
          e.mesh.scale.y = 0.7;
          e._overwatchCovering = true;
        }
      }
    }
  }

  /* ── flanking ───────────────────────────────────────────────────── */
  function _handleFlanking(squad, delta, playerPos) {
    /* only on wave 6+ */
    if (_currentWave < 6) return;
    if (!playerPos) return;

    /* check if flanking should be triggered */
    if (!squad._flankActive && squad.engageTimer > FLANK_TRIGGER_TIME && squad.killsSinceForm === 0) {
      squad._flankActive = true;
    }

    if (!squad._flankActive) return;

    /* find the flanker */
    var flanker = null;
    for (var i = 0; i < squad.members.length; i++) {
      if (squad.members[i] && squad.members[i].alive && squad.members[i]._squadRole === 'FLANKER') {
        flanker = squad.members[i];
        break;
      }
    }
    if (!flanker || !flanker.mesh) return;

    /* compute perpendicular direction to player */
    var dx = flanker.mesh.position.x - playerPos.x;
    var dz = flanker.mesh.position.z - playerPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.01) return;

    /* perpendicular direction (90 degrees to player-enemy line) */
    var perpX = -dz / dist;
    var perpZ =  dx / dist;

    /* advance flanker along curved path */
    if (!flanker._isFlanking) {
      flanker._isFlanking = true;
      flanker._flankTimer = 0;
      flanker._flankSide  = (Math.random() < 0.5) ? 1 : -1;
      /* add flanker arrow marker */
      _getOrCreateMarker(flanker, 'flanker');
    }

    flanker._flankTimer = (flanker._flankTimer || 0) + delta;

    /* move flanker perpendicular */
    var flankSpeed = 3.0;
    var side       = flanker._flankSide || 1;
    flanker.mesh.position.x += perpX * side * flankSpeed * delta;
    flanker.mesh.position.z += perpZ * side * flankSpeed * delta;

    /* also inch forward toward player */
    var fwdSpeed = 1.0;
    flanker.mesh.position.x -= (dx / dist) * fwdSpeed * delta;
    flanker.mesh.position.z -= (dz / dist) * fwdSpeed * delta;

    /* if flanker has reached ~90° angle from leader to player, stop */
    if (flanker._flankTimer > 4.0) {
      flanker._isFlanking  = false;
      flanker._flankTimer  = 0;
      /* remove flanker arrow */
      _removeFlankMarker(flanker);
    }
  }

  function _removeFlankMarker(enemy) {
    for (var i = _markers.length - 1; i >= 0; i--) {
      if (_markers[i] && _markers[i].enemy === enemy && _markers[i].type === 'flanker') {
        if (_markers[i].el && _markers[i].el.parentNode) {
          _markers[i].el.parentNode.removeChild(_markers[i].el);
        }
        _markers.splice(i, 1);
        return;
      }
    }
  }

  /* ── squad spacing enforcement ──────────────────────────────────── */
  function _handleSpacing(squad) {
    var members = squad.members;
    for (var a = 0; a < members.length; a++) {
      var ea = members[a];
      if (!ea || !ea.alive || !ea.mesh) continue;
      for (var b = a + 1; b < members.length; b++) {
        var eb = members[b];
        if (!eb || !eb.alive || !eb.mesh) continue;
        var dx = ea.mesh.position.x - eb.mesh.position.x;
        var dz = ea.mesh.position.z - eb.mesh.position.z;
        var dist2 = dx * dx + dz * dz;
        if (dist2 < SPACING_MIN * SPACING_MIN && dist2 > 0.0001) {
          var dist = Math.sqrt(dist2);
          var push = (SPACING_MIN - dist) * 0.5;
          var nx   = dx / dist;
          var nz   = dz / dist;
          ea.mesh.position.x += nx * push;
          ea.mesh.position.z += nz * push;
          eb.mesh.position.x -= nx * push;
          eb.mesh.position.z -= nz * push;
        }
      }
    }
  }

  /* ── panic movement ─────────────────────────────────────────────── */
  function _handlePanic(squad, delta, playerPos) {
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (e._panicTimer <= 0) continue;
      e._panicTimer -= delta;
      /* erratic movement while panicking */
      var erraticX = (Math.random() - 0.5) * 8.0 * delta;
      var erraticZ = (Math.random() - 0.5) * 8.0 * delta;
      e.mesh.position.x += erraticX;
      e.mesh.position.z += erraticZ;
    }
  }

  /* ── helpers ────────────────────────────────────────────────────── */
  function _getPlayerPos() {
    if (typeof window.player !== 'undefined' && window.player && window.player.position) {
      return window.player.position;
    }
    /* fallback: try GameManager-style */
    if (typeof GameManager !== 'undefined' && GameManager.getPlayerPosition) {
      return GameManager.getPlayerPosition();
    }
    return null;
  }

  function _findNearestAlive(members, fromPos) {
    if (!fromPos) {
      for (var i = 0; i < members.length; i++) {
        if (members[i] && members[i].alive) return members[i];
      }
      return null;
    }
    var best     = null;
    var bestDist = Infinity;
    for (var j = 0; j < members.length; j++) {
      var e = members[j];
      if (!e || !e.alive || !e.mesh) continue;
      var dx = e.mesh.position.x - fromPos.x;
      var dz = e.mesh.position.z - fromPos.z;
      var d2 = dx * dx + dz * dz;
      if (d2 < bestDist) {
        bestDist = d2;
        best     = e;
      }
    }
    return best;
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:          init,
    update:        update,
    formSquads:    formSquads,
    dissolveSquad: dissolveSquad,
    getSquads:     getSquads,
    reset:         reset,
  };

})();
