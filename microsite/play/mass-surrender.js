/* ───────────────────────────────────────────────────────────────────────
   MASS SURRENDER — enemy garrison surrender mechanics, POW handling,
   morale-driven surrender system.
   Keys: M+Z = trigger mass surrender scenario
         G   = guard surrendered enemy
         R   = release surrendered enemy
         D   = detain surrendered enemy (POW)
         P   = propaganda loudspeaker broadcast
   ─────────────────────────────────────────────────────────────────────── */
window.MassSurrender = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────── */
  var GARRISON_SIZE       = 12;
  var ENEMY_COLOR         = 0x4A6A2A;
  var ENEMY_SURRENDERED   = 0x8BAA8B;
  var GUARD_COLOR         = 0x334433;
  var MORALE_KILL_HIT     = -8;
  var MORALE_FRIENDLY_HIT = 5;
  var MORALE_CHAIN_HIT    = -15;
  var MORALE_PROP_HIT     = -20;
  var MORALE_SURRENDER    = 30;
  var SURRENDER_CHANCE    = 0.40;
  var REARM_CHANCE        = 0.10;
  var CHAIN_RADIUS        = 10;
  var GUARD_DIST          = 5;
  var COMPOUND_SIZE       = 10;
  var POW_SCORE           = 100;
  var RELEASE_SCORE       = 50;
  var REARM_PENALTY       = -100;
  var COMPOUND_BONUS      = 200;
  var PROP_COOLDOWN       = 60;
  var WHITE_FLAG_PCT      = 0.60;

  /* ── State ──────────────────────────────────────────────────────────── */
  var _scene            = null;
  var _active           = false;
  var _enemies          = [];
  var _compound         = null;
  var _compoundIntact   = true;
  var _guardNPCs        = [];
  var _whiteFlagMesh    = null;
  var _whiteFlagHoisted = false;
  var _score            = 0;
  var _missionDone      = false;
  var _keysDown         = {};
  var _keyMheld         = false;
  var _propagandaCD     = 0;
  var _loudspeaker      = null;
  var _hudEl            = null;
  var _outcomeEl        = null;
  var _lastTime         = 0;
  var _audioCtx         = null;

  /* ── NPC state constants ─────────────────────────────────────────────
     state: 'active' | 'surrendering' | 'guarded' | 'released' | 'detained' | 'rearmed' | 'dead'
  ─────────────────────────────────────────────────────────────────────── */

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function _getOrCreate(id, tag, styles) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag || 'div');
      el.id = id;
      Object.assign(el.style, styles || {});
      document.body.appendChild(el);
    }
    return el;
  }

  function _dist(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _averageMorale() {
    if (_enemies.length === 0) return 0;
    var sum = 0;
    for (var i = 0; i < _enemies.length; i++) {
      sum += _enemies[i].morale;
    }
    return sum / _enemies.length;
  }

  function _countByState(state) {
    var n = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].state === state) n++;
    }
    return n;
  }

  function _allResolved() {
    for (var i = 0; i < _enemies.length; i++) {
      var s = _enemies[i].state;
      if (s === 'active' || s === 'rearmed') return false;
    }
    return true;
  }

  /* ── Build enemy NPC mesh ────────────────────────────────────────────
     Group: body (CylinderGeometry) + head (SphereGeometry) + 2 arms (BoxGeometry)
  ─────────────────────────────────────────────────────────────────────── */
  function _buildEnemyMesh(color) {
    var group = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({ color: color });

    // Body
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var body    = new THREE.Mesh(bodyGeo, mat.clone());
    body.name   = 'body';
    body.position.y = 0.6;
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    var head    = new THREE.Mesh(headGeo, mat.clone());
    head.name   = 'head';
    head.position.y = 1.45;
    group.add(head);

    // Left arm
    var armGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    var armL   = new THREE.Mesh(armGeo, mat.clone());
    armL.name  = 'armL';
    armL.position.set(-0.45, 0.9, 0);
    group.add(armL);

    // Right arm
    var armR  = new THREE.Mesh(armGeo.clone(), mat.clone());
    armR.name = 'armR';
    armR.position.set(0.45, 0.9, 0);
    group.add(armR);

    return group;
  }

  /* ── Raise arms pose ─────────────────────────────────────────────────
     Arms rotate so they point upward (group.rotation.x shift per arm)
  ─────────────────────────────────────────────────────────────────────── */
  function _raiseArms(group) {
    var armL = group.getObjectByName('armL');
    var armR = group.getObjectByName('armR');
    if (armL) {
      armL.position.set(-0.45, 1.35, 0);
      armL.rotation.z = -Math.PI * 0.75;
    }
    if (armR) {
      armR.position.set(0.45, 1.35, 0);
      armR.rotation.z = Math.PI * 0.75;
    }
  }

  function _lowerArms(group) {
    var armL = group.getObjectByName('armL');
    var armR = group.getObjectByName('armR');
    if (armL) {
      armL.position.set(-0.45, 0.9, 0);
      armL.rotation.z = 0;
    }
    if (armR) {
      armR.position.set(0.45, 0.9, 0);
      armR.rotation.z = 0;
    }
  }

  /* ── Detain pose (enemy sits / flattens) ─────────────────────────── */
  function _detainPose(group) {
    group.rotation.x = Math.PI * 0.5;
    group.position.y = 0.3;
    _raiseArms(group);
  }

  /* ── Color all child meshes ───────────────────────────────────────── */
  function _setColor(group, hex) {
    group.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        obj.material.color.setHex(hex);
      }
    });
  }

  /* ── POW Compound ────────────────────────────────────────────────────
     BoxGeometry fence (LineSegments) 10×1.5×10
  ─────────────────────────────────────────────────────────────────────── */
  function _buildCompound() {
    var compoundGroup = new THREE.Group();
    compoundGroup.position.set(15, 0, 0);

    // Fence as LineSegments box outline
    var fenceGeo = new THREE.BoxGeometry(COMPOUND_SIZE, 1.5, COMPOUND_SIZE);
    var edges    = new THREE.EdgesGeometry(fenceGeo);
    var lineMat  = new THREE.LineBasicMaterial({ color: 0x556B2F, linewidth: 2 });
    var fence    = new THREE.LineSegments(edges, lineMat);
    fence.position.y = 0.75;
    compoundGroup.add(fence);

    // Floor marker
    var floorGeo = new THREE.PlaneGeometry(COMPOUND_SIZE - 0.5, COMPOUND_SIZE - 0.5);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x3B2E1A, side: THREE.DoubleSide });
    var floor    = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    compoundGroup.add(floor);

    _scene.add(compoundGroup);
    return compoundGroup;
  }

  /* ── Guard NPCs for compound ─────────────────────────────────────── */
  function _buildGuardNPC(offset) {
    var group = _buildEnemyMesh(GUARD_COLOR);
    group.position.set(
      _compound.position.x + offset,
      0,
      _compound.position.z + COMPOUND_SIZE / 2 + 1
    );
    _scene.add(group);
    return group;
  }

  /* ── White flag ──────────────────────────────────────────────────── */
  function _hoistWhiteFlag() {
    if (_whiteFlagHoisted) return;
    _whiteFlagHoisted = true;

    var flagGroup = new THREE.Group();

    // Pole (LineSegments vertical)
    var polePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 3, 0)
    ];
    var poleGeo = new THREE.BufferGeometry().setFromPoints(polePoints);
    var poleMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
    var pole    = new THREE.Line(poleGeo, poleMat);
    flagGroup.add(pole);

    // White flag plane (BoxGeometry)
    var flagGeo = new THREE.BoxGeometry(1.2, 0.8, 0.05);
    var flagMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    var flag    = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.6, 2.7, 0);
    flagGroup.add(flag);

    // Position at leader (first active or first enemy)
    var leader = null;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].state !== 'dead' && _enemies[i].state !== 'released') {
        leader = _enemies[i];
        break;
      }
    }
    if (leader) {
      flagGroup.position.copy(leader.group.position);
      flagGroup.position.y = 0;
    } else {
      flagGroup.position.set(0, 0, 0);
    }

    _scene.add(flagGroup);
    _whiteFlagMesh = flagGroup;
  }

  /* ── Loudspeaker prop ────────────────────────────────────────────── */
  function _buildLoudspeaker() {
    var lsGroup = new THREE.Group();

    // Box body
    var boxGeo = new THREE.BoxGeometry(1, 1, 0.5);
    var boxMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var box    = new THREE.Mesh(boxGeo, boxMat);
    lsGroup.add(box);

    // Horn (CylinderGeometry)
    var hornGeo = new THREE.CylinderGeometry(0.05, 0.3, 0.6, 8);
    var hornMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var horn    = new THREE.Mesh(hornGeo, hornMat);
    horn.rotation.x = Math.PI / 2;
    horn.position.set(0, 0, 0.55);
    lsGroup.add(horn);

    lsGroup.position.set(-10, 1.5, -5);
    _scene.add(lsGroup);
    return lsGroup;
  }

  /* ── Audio: propaganda oscillator voice ─────────────────────────── */
  function _playPropaganda() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    var ctx = _audioCtx;
    var freqs = [200, 250, 180, 300, 220, 260, 190, 240];
    var t = ctx.currentTime;
    for (var i = 0; i < freqs.length; i++) {
      (function (freq, offset) {
        var osc   = ctx.createOscillator();
        var gain  = ctx.createGain();
        osc.type  = 'sine';
        osc.frequency.setValueAtTime(freq, t + offset);
        osc.frequency.linearRampToValueAtTime(freq * 1.1, t + offset + 0.3);
        gain.gain.setValueAtTime(0.18, t + offset);
        gain.gain.linearRampToValueAtTime(0, t + offset + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.6);
      }(freqs[i], i * 0.6));
    }
  }

  /* ── HUD ─────────────────────────────────────────────────────────── */
  function _initHUD() {
    _hudEl = _getOrCreate('massSurrenderHUD', 'div', {
      position:   'fixed',
      top:        '12px',
      right:      '12px',
      background: 'rgba(0,0,0,0.75)',
      color:      '#c8ffb0',
      fontFamily: 'monospace',
      fontSize:   '13px',
      padding:    '8px 14px',
      borderRadius: '6px',
      border:     '1px solid #4A6A2A',
      zIndex:     '6000',
      display:    'none',
      letterSpacing: '1px',
      lineHeight: '1.6'
    });
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;
    var morale     = Math.round(_averageMorale());
    var surr       = _countByState('surrendering') + _countByState('guarded') + _countByState('detained') + _countByState('released');
    var pows       = _countByState('detained');
    var compound   = _compoundIntact ? 'INTACT' : 'DESTROYED';
    var propStatus = _propagandaCD > 0 ? ('CD:' + Math.ceil(_propagandaCD) + 's') : 'READY';
    _hudEl.innerHTML =
      'SURRENDER [MORALE: ' + morale + '%] [SURRENDERED: ' + surr + '/' + GARRISON_SIZE + ']' +
      ' [POWs: ' + pows + '] | COMPOUND: ' + compound +
      '<br>SCORE: ' + _score + ' | PROPAGANDA: ' + propStatus +
      '<br><span style="color:#aaa;font-size:11px">G=Guard R=Release D=Detain P=Propaganda M+Z=Trigger</span>';
  }

  function _showOutcome(text) {
    if (_outcomeEl) return;
    _outcomeEl = _getOrCreate('massSurrenderOutcome', 'div', {
      position:   'fixed',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%,-50%)',
      background: 'rgba(0,0,0,0.92)',
      color:      '#FFD700',
      fontFamily: 'monospace',
      fontSize:   '28px',
      fontWeight: 'bold',
      padding:    '28px 48px',
      borderRadius: '10px',
      border:     '2.5px solid #FFD700',
      zIndex:     '9000',
      textAlign:  'center',
      letterSpacing: '2px'
    });
    _outcomeEl.textContent = text;
  }

  /* ── Spawn garrison ──────────────────────────────────────────────── */
  function _spawnGarrison() {
    for (var i = 0; i < GARRISON_SIZE; i++) {
      var group = _buildEnemyMesh(ENEMY_COLOR);
      var angle = (i / GARRISON_SIZE) * Math.PI * 2;
      var radius = 6 + Math.random() * 4;
      group.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      group.rotation.y = Math.random() * Math.PI * 2;
      _scene.add(group);

      _enemies.push({
        group:            group,
        morale:           70 + Math.random() * 30,
        state:            'active',
        surrenderTimer:   0,
        rearmTimer:       0,
        velocity:         new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0,
          (Math.random() - 0.5) * 0.02
        ),
        patrolAngle:      angle,
        patrolRadius:     radius,
        followTarget:     null
      });
    }
  }

  /* ── Kill an enemy (called externally or internally) ─────────────── */
  function _killEnemy(idx) {
    var e = _enemies[idx];
    if (!e || e.state === 'dead') return;
    e.state = 'dead';
    _setColor(e.group, 0x222222);
    e.group.rotation.x = Math.PI / 2;
    e.group.position.y = 0.15;

    // Morale penalty to all remaining alive enemies
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].state === 'active' || _enemies[i].state === 'surrendering') {
        _enemies[i].morale = Math.max(0, _enemies[i].morale + MORALE_KILL_HIT);
      }
    }
  }

  /* ── Trigger surrender on one enemy ─────────────────────────────── */
  function _triggerSurrender(idx) {
    var e = _enemies[idx];
    if (!e || e.state !== 'active') return;
    e.state = 'surrendering';
    e.surrenderTimer = 0;
    e.velocity.set(0, 0, 0);
    _setColor(e.group, ENEMY_SURRENDERED);
    _raiseArms(e.group);

    // Chain reaction: nearby enemies lose morale
    var pos = e.group.position;
    for (var i = 0; i < _enemies.length; i++) {
      if (i === idx) continue;
      if (_enemies[i].state !== 'active') continue;
      if (_dist(_enemies[i].group.position, pos) <= CHAIN_RADIUS) {
        _enemies[i].morale = Math.max(0, _enemies[i].morale + MORALE_CHAIN_HIT);
      }
    }

    // Check white flag threshold
    var surrendered = 0;
    for (var j = 0; j < _enemies.length; j++) {
      var s = _enemies[j].state;
      if (s === 'surrendering' || s === 'guarded' || s === 'detained' || s === 'released') {
        surrendered++;
      }
    }
    if (!_whiteFlagHoisted && surrendered / GARRISON_SIZE >= WHITE_FLAG_PCT) {
      _hoistWhiteFlag();
      // All remaining active enemies lose extra morale
      for (var k = 0; k < _enemies.length; k++) {
        if (_enemies[k].state === 'active') {
          _enemies[k].morale = Math.max(0, _enemies[k].morale - 25);
        }
      }
    }
  }

  /* ── Player actions on nearest surrendering enemy ─────────────────
     G = guard, R = release, D = detain
  ─────────────────────────────────────────────────────────────────── */
  function _findNearestSurrendering() {
    var best    = null;
    var bestD   = Infinity;
    var origin  = new THREE.Vector3(0, 0, 0); // player approx origin
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].state !== 'surrendering') continue;
      var d = _dist(_enemies[i].group.position, origin);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function _doGuard(idx) {
    var e = _enemies[idx];
    if (!e) return;
    e.state = 'guarded';
    e.followTarget = new THREE.Vector3(0, 0, GUARD_DIST);
  }

  function _doRelease(idx) {
    var e = _enemies[idx];
    if (!e) return;
    e.state = 'released';
    _score += RELEASE_SCORE;
    _lowerArms(e.group);
    // Run away (set velocity outward)
    var pos = e.group.position;
    var dx  = pos.x || 0.1;
    var dz  = pos.z || 0.1;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    e.velocity.set(dx / len * 0.08, 0, dz / len * 0.08);
  }

  function _doDetain(idx) {
    var e = _enemies[idx];
    if (!e) return;
    e.state = 'detained';
    _score += POW_SCORE;
    _detainPose(e.group);
    // Walk toward compound
    e.followTarget = _compound ? _compound.position.clone() : new THREE.Vector3(15, 0, 0);
  }

  /* ── Propaganda ──────────────────────────────────────────────────── */
  function _activatePropaganda() {
    if (_propagandaCD > 0) return;
    _propagandaCD = PROP_COOLDOWN;
    _playPropaganda();
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].state === 'active' || _enemies[i].state === 'surrendering') {
        _enemies[i].morale = Math.max(0, _enemies[i].morale + MORALE_PROP_HIT);
      }
    }
  }

  /* ── Key handling ────────────────────────────────────────────────── */
  function _onKeyDown(evt) {
    var k = evt.key.toUpperCase();
    _keysDown[k] = true;

    // M+Z = trigger mass surrender scenario
    if (k === 'Z' && _keysDown['M']) {
      if (!_active) {
        _activate();
      }
      return;
    }
    if (k === 'M' && _keysDown['Z']) {
      if (!_active) {
        _activate();
      }
      return;
    }

    if (!_active || _missionDone) return;

    if (k === 'G') {
      var gi = _findNearestSurrendering();
      if (gi !== null) _doGuard(gi);
    } else if (k === 'R') {
      var ri = _findNearestSurrendering();
      // Also allow releasing guarded enemies
      if (ri === null) {
        for (var ri2 = 0; ri2 < _enemies.length; ri2++) {
          if (_enemies[ri2].state === 'guarded') { ri = ri2; break; }
        }
      }
      if (ri !== null) _doRelease(ri);
    } else if (k === 'D') {
      var di = _findNearestSurrendering();
      if (di === null) {
        for (var di2 = 0; di2 < _enemies.length; di2++) {
          if (_enemies[di2].state === 'guarded') { di = di2; break; }
        }
      }
      if (di !== null) _doDetain(di);
    } else if (k === 'P') {
      _activatePropaganda();
    }
  }

  function _onKeyUp(evt) {
    _keysDown[evt.key.toUpperCase()] = false;
  }

  /* ── Activate scenario ───────────────────────────────────────────── */
  function _activate() {
    if (_active) return;
    _active       = true;
    _missionDone  = false;
    _score        = 0;
    _compoundIntact = true;
    _whiteFlagHoisted = false;
    _propagandaCD = 0;
    _enemies      = [];
    _guardNPCs    = [];

    // Clean up old objects if reinitialised
    if (_whiteFlagMesh) { _scene.remove(_whiteFlagMesh); _whiteFlagMesh = null; }
    if (_loudspeaker)   { _scene.remove(_loudspeaker); _loudspeaker = null; }
    if (_compound)      { _scene.remove(_compound); _compound = null; }

    _compound    = _buildCompound();
    _loudspeaker = _buildLoudspeaker();
    _guardNPCs.push(_buildGuardNPC(-2));
    _guardNPCs.push(_buildGuardNPC(2));
    _spawnGarrison();

    if (_hudEl) _hudEl.style.display = 'block';
  }

  /* ── Mission end ─────────────────────────────────────────────────── */
  function _endMission() {
    if (_missionDone) return;
    _missionDone = true;

    var detained  = _countByState('detained');
    var dead      = _countByState('dead');
    var released  = _countByState('released');
    var rearmed   = _countByState('rearmed');

    if (_compoundIntact && detained > 0) {
      _score += COMPOUND_BONUS;
    }

    var text;
    if (rearmed > 0 || dead === GARRISON_SIZE) {
      text = 'GARRISON ELIMINATED';
    } else if (detained + released > dead) {
      text = 'MASS SURRENDER ACCEPTED';
    } else {
      text = 'GARRISON ELIMINATED';
    }

    text += '\nSCORE: ' + _score;
    _showOutcome(text);
  }

  /* ── Per-frame update ────────────────────────────────────────────── */
  function _update(dt) {
    if (!_active || _missionDone) return;

    // Clamp dt
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0)  dt = 0.016;

    // Propaganda cooldown
    if (_propagandaCD > 0) _propagandaCD -= dt;

    // Update each enemy
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];

      if (e.state === 'dead') continue;

      // Active enemies patrol and check morale
      if (e.state === 'active') {
        // Simple patrol orbit
        e.patrolAngle += 0.005;
        e.group.position.x = Math.cos(e.patrolAngle) * e.patrolRadius;
        e.group.position.z = Math.sin(e.patrolAngle) * e.patrolRadius;
        e.group.rotation.y = -e.patrolAngle + Math.PI / 2;

        // Check if morale < threshold
        if (e.morale < MORALE_SURRENDER) {
          // 40% chance/sec to surrender
          if (Math.random() < SURRENDER_CHANCE * dt) {
            _triggerSurrender(i);
          }
        }

        // White flag causes rapid surrenders
        if (_whiteFlagHoisted && Math.random() < 0.8 * dt) {
          _triggerSurrender(i);
        }
      }

      // Surrendering: wait for player response, countdown rearm timer
      else if (e.state === 'surrendering') {
        e.surrenderTimer += dt;
        if (e.surrenderTimer > 10) {
          // 10% chance/sec to rearm
          if (Math.random() < REARM_CHANCE * dt) {
            e.state  = 'rearmed';
            _score  += REARM_PENALTY;
            _lowerArms(e.group);
            _setColor(e.group, ENEMY_COLOR);
            // Rearms boost nearby enemy morale
            for (var j = 0; j < _enemies.length; j++) {
              if (j === i) continue;
              if (_enemies[j].state === 'active' || _enemies[j].state === 'surrendering') {
                if (_dist(_enemies[j].group.position, e.group.position) < CHAIN_RADIUS) {
                  _enemies[j].morale = Math.min(100, _enemies[j].morale + 10);
                }
              }
            }
          }
        }
      }

      // Re-armed: treat same as active
      else if (e.state === 'rearmed') {
        e.patrolAngle += 0.007;
        e.group.position.x = Math.cos(e.patrolAngle) * e.patrolRadius;
        e.group.position.z = Math.sin(e.patrolAngle) * e.patrolRadius;
        e.group.rotation.y = -e.patrolAngle + Math.PI / 2;
      }

      // Guarded: follow player at GUARD_DIST
      else if (e.state === 'guarded') {
        var target = e.followTarget || new THREE.Vector3(0, 0, GUARD_DIST);
        var pos    = e.group.position;
        var dx     = target.x - pos.x;
        var dz     = target.z - pos.z;
        var dist   = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.3) {
          pos.x += (dx / dist) * 0.04;
          pos.z += (dz / dist) * 0.04;
        }
      }

      // Detained: walk toward compound
      else if (e.state === 'detained') {
        var cpos  = e.group.position;
        var ctgt  = e.followTarget || (_compound ? _compound.position : new THREE.Vector3(15, 0, 0));
        var cdx   = ctgt.x - cpos.x;
        var cdz   = ctgt.z - cpos.z;
        var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
        if (cdist > 1.5) {
          // Undo detain pose while walking
          e.group.rotation.x = 0;
          e.group.position.y = 0;
          _raiseArms(e.group);
          cpos.x += (cdx / cdist) * 0.03;
          cpos.z += (cdz / cdist) * 0.03;
        } else {
          // At compound, sit
          _detainPose(e.group);
        }

        // If compound destroyed, scatter
        if (!_compoundIntact) {
          e.state = 'released';
          _lowerArms(e.group);
          _score -= POW_SCORE; // lost the POW
          var scatterAngle = Math.random() * Math.PI * 2;
          e.velocity.set(Math.cos(scatterAngle) * 0.07, 0, Math.sin(scatterAngle) * 0.07);
        }
      }

      // Released: run away
      else if (e.state === 'released') {
        e.group.position.x += e.velocity.x;
        e.group.position.z += e.velocity.z;
        // Fade out if far away
        if (Math.abs(e.group.position.x) > 80 || Math.abs(e.group.position.z) > 80) {
          e.group.visible = false;
        }
      }
    }

    _updateHUD();

    // Mission end check
    if (_allResolved()) {
      _endMission();
    }
  }

  /* ── Public API ──────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene;
    _initHUD();
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function update(delta) {
    var dt;
    if (delta !== undefined) {
      dt = delta;
    } else {
      var now = performance.now();
      dt      = _lastTime ? (now - _lastTime) / 1000 : 0.016;
      _lastTime = now;
    }
    _update(dt);
  }

  function reset() {
    _active           = false;
    _missionDone      = false;
    _whiteFlagHoisted = false;
    _propagandaCD     = 0;
    _compoundIntact   = true;
    _score            = 0;

    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].group && _scene) _scene.remove(_enemies[i].group);
    }
    _enemies = [];

    for (var j = 0; j < _guardNPCs.length; j++) {
      if (_scene) _scene.remove(_guardNPCs[j]);
    }
    _guardNPCs = [];

    if (_compound)     { _scene.remove(_compound);     _compound     = null; }
    if (_whiteFlagMesh){ _scene.remove(_whiteFlagMesh); _whiteFlagMesh = null; }
    if (_loudspeaker)  { _scene.remove(_loudspeaker);  _loudspeaker  = null; }

    if (_hudEl)     _hudEl.style.display   = 'none';
    if (_outcomeEl) { _outcomeEl.remove(); _outcomeEl = null; }

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup',   _onKeyUp);
  }

  /* ── External hooks (called by game engine) ─────────────────────── */

  // Call this when a friendly soldier is killed (raises enemy morale)
  function onFriendlyKilled() {
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].state === 'active' || _enemies[i].state === 'surrendering') {
        _enemies[i].morale = Math.min(100, _enemies[i].morale + MORALE_FRIENDLY_HIT);
      }
    }
  }

  // Call this when an enemy is killed externally
  function onEnemyKilled(enemyObj) {
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].group === enemyObj) {
        _killEnemy(i);
        return;
      }
    }
  }

  // Call this when compound is destroyed
  function onCompoundDestroyed() {
    _compoundIntact = false;
    if (_compound && _scene) {
      _scene.remove(_compound);
      _compound = null;
    }
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].state === 'detained') {
        _enemies[i].state = 'released';
        _lowerArms(_enemies[i].group);
        _enemies[i].group.rotation.x = 0;
        _enemies[i].group.position.y = 0;
        var a = Math.random() * Math.PI * 2;
        _enemies[i].velocity.set(Math.cos(a) * 0.07, 0, Math.sin(a) * 0.07);
      }
    }
  }

  return {
    init:               init,
    update:             update,
    reset:              reset,
    onFriendlyKilled:   onFriendlyKilled,
    onEnemyKilled:      onEnemyKilled,
    onCompoundDestroyed: onCompoundDestroyed
  };

}());
