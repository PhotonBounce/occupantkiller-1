// ============================================================
//  riot-control.js — Non-lethal crowd control, civilian
//  interaction, and ROE (rules of engagement) management.
//
//  Press N to cycle non-lethal weapons:
//    RUBBER_BULLET / FLASHBANG / TEAR_GAS / BATON
//  Press H to deploy riot shield (hold in front).
//  Press F (within 2s of stun) to detain enemy.
//
//  Public API: init(scene,camera), update(delta),
//              spawnCivilians(n), getROELevel(), reset()
// ============================================================
window.RiotControl = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────
  var ROE_PERMISSIVE   = 'PERMISSIVE';
  var ROE_RESTRICTIVE  = 'RESTRICTIVE';
  var ROE_EMERGENCY    = 'EMERGENCY';

  var NLWEP_RUBBER     = 'RUBBER_BULLET';
  var NLWEP_FLASHBANG  = 'FLASHBANG';
  var NLWEP_TEARGAS    = 'TEAR_GAS';
  var NLWEP_BATON      = 'BATON';
  var NLWEAPONS        = [NLWEP_RUBBER, NLWEP_FLASHBANG, NLWEP_TEARGAS, NLWEP_BATON];

  var RUBBER_SPEED     = 0.80;   // fraction of normal projectile speed
  var RUBBER_DAMAGE    = 5;
  var RUBBER_STUN      = 2;      // seconds

  var FLASHBANG_RADIUS = 8;      // units
  var FLASHBANG_BLIND  = 3;      // seconds

  var TEARGAS_RADIUS   = 6;      // units
  var TEARGAS_LIFE     = 15;     // seconds

  var BATON_RANGE      = 1.5;    // units
  var BATON_DAMAGE     = 10;
  var BATON_STUN       = 3;      // seconds

  var DETAIN_WINDOW    = 2;      // seconds after stun to detain
  var DETAIN_SCORE     = 50;

  var SHIELD_DAMAGE_BLOCK = 0.80;  // fraction blocked
  var SHIELD_SPEED_MULT   = 0.70;  // move speed multiplier

  var SAVE_WINDOW      = 3;      // seconds: kill attacker to save civilian
  var CIVILIAN_COUNT   = 5;
  var WANDER_SPEED     = 0.8;
  var FLEE_SPEED       = 3.0;
  var FLEE_RADIUS      = 10;     // flee from gunfire / tear gas within this range

  var NONLETHAL_BONUS_INTERVAL = 5;  // every 5 nonlethal takedowns
  var NONLETHAL_BONUS          = 200;

  var GRENADE_GRAVITY  = -9.8;
  var THROW_HSPEED     = 7;
  var THROW_VSPEED     = 6.5;
  var BOUNCE_DAMPEN    = 0.3;

  // ── Private state ──────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _audioCtx = null;

  var _roeLevel          = ROE_PERMISSIVE;
  var _civilianKills     = 0;
  var _emergencyTimer    = 0;   // countdown while in EMERGENCY
  var _detainCount       = 0;
  var _nonlethalCount    = 0;   // nonlethal takedowns
  var _crowdControlScore = 0;

  var _selectedNLW       = 0;   // index into NLWEAPONS
  var _shieldDeployed    = false;
  var _shieldBashing     = false;

  var _civilians         = [];  // { mesh, hp, state, vel, wanderTarget, fleeTimer, stunTimer, detainTimer, detained, savedTimer }
  var _tearGasClouds     = [];  // { mesh, particles[], pos, age, life, radius }
  var _activeProjectiles = [];  // { mesh, vel, type, age, bounced }
  var _flashbangs        = []   // { mesh, vel, age, bounced, exploded }
  var _shieldMesh        = null;

  // Tracking attacker-civilian threats for ROE save mechanic
  // { civRef, attackerRef, timer }
  var _attackerThreats   = [];

  // Key tracking (edge detection)
  var _nKeyWas     = false;
  var _hKeyWas     = false;
  var _fKeyWas     = false;
  var _lmbWas      = false;

  // Stun registry: { enemyRef, timer }
  var _stunnedEnemies    = [];

  // Flashbang blind state
  var _playerBlindTimer  = 0;
  var _overlayEl         = null;

  // HUD elements
  var _hudEl             = null;
  var _toastEl           = null;
  var _toastTimer        = 0;

  // ── Helpers ────────────────────────────────────────────────
  function _getScene()  { return _scene  || window._gameScene  || window._scene || null; }
  function _getCamera() { return _camera || window._camera     || window._gameCamera || null; }

  function _getAudio() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _playerPos() {
    var cam = _getCamera();
    if (cam) return cam.position;
    if (window.player && window.player.position) return window.player.position;
    return null;
  }

  // ── Audio helpers ──────────────────────────────────────────
  function _playTone(freq, dur, gain, type) {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, ctx.currentTime + dur);
      g.gain.setValueAtTime(gain || 0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  function _playNoise(dur, gain) {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      var src = ctx.createBufferSource();
      var g   = ctx.createGain();
      src.buffer = buf;
      src.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(gain || 0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  // ── Toast messages ─────────────────────────────────────────
  function _toast(msg, color) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
    if (_toastEl) {
      _toastEl.textContent = msg;
      _toastEl.style.color = color || '#FFEE44';
      _toastEl.style.opacity = '1';
      _toastTimer = 3;
    }
  }

  // ── HUD ────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;

    // Main ROE HUD (top-right)
    _hudEl = document.createElement('div');
    _hudEl.id = 'riot-control-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:16px',
      'right:16px',
      'font-family:monospace',
      'font-size:12px',
      'font-weight:bold',
      'color:#FFFFFF',
      'text-shadow:1px 1px 2px #000',
      'z-index:4500',
      'pointer-events:none',
      'line-height:1.7',
      'background:rgba(0,0,0,0.45)',
      'padding:6px 10px',
      'border-radius:4px',
      'min-width:160px'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Toast line (center-top)
    _toastEl = document.createElement('div');
    _toastEl.id = 'riot-control-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'color:#FFEE44',
      'text-shadow:1px 1px 3px #000',
      'z-index:4600',
      'pointer-events:none',
      'transition:opacity 0.3s',
      'opacity:0'
    ].join(';');
    document.body.appendChild(_toastEl);

    // Flashbang overlay
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'riot-control-flashbang';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:#FFFFFF',
      'z-index:9999',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.1s'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var roeColor = '#44FF44';
    if (_roeLevel === ROE_RESTRICTIVE) roeColor = '#FFCC00';
    if (_roeLevel === ROE_EMERGENCY)   roeColor = '#FF3333';

    var nlwName = NLWEAPONS[_selectedNLW];
    var nlwShort = nlwName.replace('_', ' ');

    var shieldStr = _shieldDeployed ? ' [SHIELD]' : '';
    var emergStr  = '';
    if (_roeLevel === ROE_EMERGENCY && _emergencyTimer > 0) {
      emergStr = '<br><span style="color:#FF3333;">FIRE DISABLED: ' + _emergencyTimer.toFixed(0) + 's</span>';
    }

    _hudEl.innerHTML =
      '<span style="color:' + roeColor + ';">ROE: ' + _roeLevel + '</span><br>' +
      'CIVS: ' + _civilians.length + ' | KILLS: ' + _civilianKills + '<br>' +
      'DETAIN: ' + _detainCount + ' | CC SCORE: ' + _crowdControlScore + '<br>' +
      '<span style="color:#88DDFF;">[N] ' + nlwShort + shieldStr + '</span>' +
      emergStr;
  }

  // ── Civilian mesh builder ──────────────────────────────────
  function _buildCivilianMesh() {
    var sc = _getScene();
    if (!sc || !window.THREE) return null;

    var group = new THREE.Group();

    // Body (slim gray/brown clothes)
    var bodyGeo = new THREE.BoxGeometry(0.35, 0.9, 0.25);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 }); // brownish
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    group.add(body);

    // Head (slightly smaller than enemy)
    var headGeo = new THREE.SphereGeometry(0.18, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xD2A679 }); // skin tone
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.05;
    group.add(head);

    // Legs
    var legGeo = new THREE.BoxGeometry(0.13, 0.6, 0.13);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x555566 }); // dark pants
    var legL   = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.1, -0.1, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.1, -0.1, 0);
    group.add(legR);

    group.position.set(
      (Math.random() - 0.5) * 20,
      0,
      (Math.random() - 0.5) * 20
    );
    sc.add(group);
    return group;
  }

  // ── Spawn civilians ────────────────────────────────────────
  function spawnCivilians(n) {
    var count = (typeof n === 'number') ? n : CIVILIAN_COUNT;
    for (var i = 0; i < count; i++) {
      var mesh = _buildCivilianMesh();
      if (!mesh) continue;
      _civilians.push({
        mesh:         mesh,
        hp:           50,
        state:        'WANDER',  // WANDER | FLEE | STUNNED | DETAINED | DEAD
        vel:          new THREE.Vector3(),
        wanderTarget: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          0,
          (Math.random() - 0.5) * 30
        ),
        wanderTimer:  2 + Math.random() * 3,
        fleeTimer:    0,
        stunTimer:    0,
        detainTimer:  0,
        detained:     false,
        dead:         false,
        savedTimer:   0
      });
    }
  }

  // ── Civilian wander AI ─────────────────────────────────────
  function _updateCivilians(delta) {
    var sc = _getScene();
    var pp = _playerPos();

    for (var i = _civilians.length - 1; i >= 0; i--) {
      var civ = _civilians[i];
      if (civ.dead || !civ.mesh) continue;

      if (civ.stunTimer > 0) {
        civ.stunTimer -= delta;
        if (civ.stunTimer < 0) civ.stunTimer = 0;
        if (civ.state === 'STUNNED' && civ.stunTimer <= 0 && !civ.detained) {
          civ.state = 'WANDER';
        }
        continue;
      }

      if (civ.detained) continue;

      // Check flee conditions: nearby gunfire / tear gas
      var shouldFlee = false;

      if (pp) {
        // Flee from player if shooting (simple heuristic: check global recent shot)
        if (window._lastShotTime && (Date.now() / 1000 - window._lastShotTime) < 0.5) {
          var pdist = _dist2D(civ.mesh.position, pp);
          if (pdist < FLEE_RADIUS) shouldFlee = true;
        }
      }

      // Flee from tear gas
      for (var t = 0; t < _tearGasClouds.length; t++) {
        var tg = _tearGasClouds[t];
        var tdist = _dist2D(civ.mesh.position, tg.pos);
        if (tdist < tg.radius + 3) { shouldFlee = true; break; }
      }

      if (shouldFlee) {
        civ.state = 'FLEE';
        civ.fleeTimer = 4;
      }

      if (civ.state === 'FLEE') {
        civ.fleeTimer -= delta;
        if (civ.fleeTimer <= 0) {
          civ.state = 'WANDER';
        }

        // Move away from player and tear gas
        var fleeDir = new THREE.Vector3();
        if (pp) {
          var away = new THREE.Vector3(
            civ.mesh.position.x - pp.x,
            0,
            civ.mesh.position.z - pp.z
          );
          if (away.length() > 0.01) {
            away.normalize();
            fleeDir.add(away);
          }
        }
        for (var tg2 = 0; tg2 < _tearGasClouds.length; tg2++) {
          var tgCloud = _tearGasClouds[tg2];
          var awayTG = new THREE.Vector3(
            civ.mesh.position.x - tgCloud.pos.x,
            0,
            civ.mesh.position.z - tgCloud.pos.z
          );
          if (awayTG.length() > 0.01) {
            awayTG.normalize();
            fleeDir.add(awayTG);
          }
        }
        if (fleeDir.length() > 0.01) fleeDir.normalize();

        civ.mesh.position.x += fleeDir.x * FLEE_SPEED * delta;
        civ.mesh.position.z += fleeDir.z * FLEE_SPEED * delta;

        // Face direction of movement
        if (fleeDir.length() > 0.01) {
          civ.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
        }

      } else if (civ.state === 'WANDER') {
        civ.wanderTimer -= delta;
        if (civ.wanderTimer <= 0) {
          civ.wanderTarget.set(
            (Math.random() - 0.5) * 30,
            0,
            (Math.random() - 0.5) * 30
          );
          civ.wanderTimer = 2 + Math.random() * 3;
        }

        var toTarget = new THREE.Vector3(
          civ.wanderTarget.x - civ.mesh.position.x,
          0,
          civ.wanderTarget.z - civ.mesh.position.z
        );
        var tdist2 = toTarget.length();
        if (tdist2 > 0.3) {
          toTarget.normalize();
          civ.mesh.position.x += toTarget.x * WANDER_SPEED * delta;
          civ.mesh.position.z += toTarget.z * WANDER_SPEED * delta;
          civ.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        }
      }

      // Detained visual: crouch (scale Y)
      if (civ.detained) {
        civ.mesh.scale.y = 0.6;
        civ.mesh.position.y = -0.2;
      }
    }
  }

  // ── ROE system ─────────────────────────────────────────────
  function _onCivilianKilled() {
    _civilianKills++;
    _tightenROE();
    _toast('CIVILIAN DOWN! ROE: ' + _roeLevel, '#FF3333');
  }

  function _tightenROE() {
    if (_roeLevel === ROE_PERMISSIVE) {
      _roeLevel = ROE_RESTRICTIVE;
      _toast('ROE TIGHTENED → RESTRICTIVE. Reduce damage applied.', '#FFCC00');
    } else if (_roeLevel === ROE_RESTRICTIVE) {
      _roeLevel = ROE_EMERGENCY;
      _emergencyTimer = 10;
      _toast('ROE EMERGENCY! Weapons disabled for 10s!', '#FF3333');
      _playTone(200, 0.5, 0.4, 'sawtooth');
    }
    // Already at EMERGENCY: stays there
    _updateHUD();
  }

  function _relaxROE() {
    if (_roeLevel === ROE_EMERGENCY) {
      _roeLevel = ROE_RESTRICTIVE;
      _toast('ROE relaxed → RESTRICTIVE (civilian saved!)', '#FFEE44');
    } else if (_roeLevel === ROE_RESTRICTIVE) {
      _roeLevel = ROE_PERMISSIVE;
      _toast('ROE back to PERMISSIVE (civilian saved!)', '#44FF44');
    }
    _updateHUD();
  }

  function getROELevel() {
    return _roeLevel;
  }

  // Apply ROE damage modifier
  function _roeDmgMult() {
    if (_roeLevel === ROE_RESTRICTIVE) return 0.5;
    return 1.0;
  }

  // Check if fire is allowed (EMERGENCY disables it)
  function _fireAllowed() {
    return !(_roeLevel === ROE_EMERGENCY && _emergencyTimer > 0);
  }

  function _updateROE(delta) {
    if (_roeLevel === ROE_EMERGENCY && _emergencyTimer > 0) {
      _emergencyTimer -= delta;
      if (_emergencyTimer <= 0) {
        _emergencyTimer = 0;
        _toast('Weapons re-enabled.', '#FFEE44');
      }
    }

    // Update attacker-civilian threat tracking
    for (var i = _attackerThreats.length - 1; i >= 0; i--) {
      var threat = _attackerThreats[i];
      threat.timer -= delta;
      if (threat.timer <= 0) {
        _attackerThreats.splice(i, 1);
      }
    }
  }

  // Called when an enemy is killed — check if they were a civilian attacker
  function _checkCivilianSave(enemy) {
    for (var i = _attackerThreats.length - 1; i >= 0; i--) {
      var t = _attackerThreats[i];
      if (t.attackerRef === enemy) {
        _attackerThreats.splice(i, 1);
        _relaxROE();
        _toast('+ROE SAVE! Stopped attacker in time.', '#44FF44');
        return;
      }
    }
  }

  // ── Stun helpers ───────────────────────────────────────────
  function _stunEnemy(enemy, duration) {
    if (!enemy) return;
    enemy._stunTimer    = duration;
    enemy._canDetain    = true;
    enemy._detainWindow = DETAIN_WINDOW;
    _stunnedEnemies.push({ enemy: enemy, timer: duration });

    // Mark on the object itself for other systems
    if (enemy.stun) enemy.stun(duration);
    if (enemy.mesh)  enemy.mesh.userData.stunned = true;
  }

  function _updateStunnedEnemies(delta) {
    for (var i = _stunnedEnemies.length - 1; i >= 0; i--) {
      var s = _stunnedEnemies[i];
      s.timer -= delta;
      if (s.enemy._detainWindow !== undefined) {
        s.enemy._detainWindow -= delta;
        if (s.enemy._detainWindow < 0) {
          s.enemy._detainWindow = 0;
          s.enemy._canDetain    = false;
        }
      }
      if (s.timer <= 0) {
        if (s.enemy.mesh) s.enemy.mesh.userData.stunned = false;
        s.enemy._stunTimer = 0;
        _stunnedEnemies.splice(i, 1);
      }
    }
  }

  // ── Detain mechanic ────────────────────────────────────────
  function _tryDetain() {
    var pp = _playerPos();
    if (!pp) return;

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e._canDetain) continue;

      var ePos = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
      if (!ePos) continue;
      var d = _dist2D(pp, ePos);
      if (d > 2.5) continue;

      // Detain!
      e._canDetain    = false;
      e._detained     = true;
      e._stunTimer    = 9999; // stays stunned
      if (e.mesh) {
        e.mesh.userData.detained = true;
        // Hands-behind-back: tilt mesh slightly
        e.mesh.rotation.x = 0.3;
      }
      _detainCount++;
      _crowdControlScore += DETAIN_SCORE;
      _nonlethalCount++;
      _checkNonlethalBonus();
      _toast('DETAINED! +' + DETAIN_SCORE + ' score | Total detains: ' + _detainCount, '#44FFCC');
      _updateHUD();
      return; // one at a time
    }
  }

  function _checkNonlethalBonus() {
    if (_nonlethalCount > 0 && _nonlethalCount % NONLETHAL_BONUS_INTERVAL === 0) {
      _crowdControlScore += NONLETHAL_BONUS;
      _toast('CROWD CONTROL BONUS! +' + NONLETHAL_BONUS + ' (' + _nonlethalCount + ' nonlethal)', '#44FF44');
    }
  }

  // ── Tear gas clouds ────────────────────────────────────────
  function _spawnTearGasCloud(pos) {
    var sc = _getScene();
    if (!sc || !window.THREE) return;

    var particles = [];
    for (var i = 0; i < 18; i++) {
      var geo = new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 6, 6);
      var mat = new THREE.MeshLambertMaterial({
        color:       0x44CC55,
        transparent: true,
        opacity:     0.0,
        depthWrite:  false
      });
      var p = new THREE.Mesh(geo, mat);
      var angle  = Math.random() * Math.PI * 2;
      var radius = Math.random() * TEARGAS_RADIUS * 0.7;
      p.position.set(
        pos.x + Math.cos(angle) * radius,
        pos.y + Math.random() * 1.5,
        pos.z + Math.sin(angle) * radius
      );
      p.userData.targetX = pos.x + Math.cos(angle) * (TEARGAS_RADIUS * (0.6 + Math.random() * 0.4));
      p.userData.targetY = pos.y + 0.3 + Math.random() * 2.5;
      p.userData.targetZ = pos.z + Math.sin(angle) * (TEARGAS_RADIUS * (0.6 + Math.random() * 0.4));
      p.userData.startX  = p.position.x;
      p.userData.startY  = p.position.y;
      p.userData.startZ  = p.position.z;
      sc.add(p);
      particles.push(p);
    }

    // Canister mesh
    var canGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
    var canMat = new THREE.MeshLambertMaterial({ color: 0x888800 });
    var can    = new THREE.Mesh(canGeo, canMat);
    can.position.copy(pos);
    sc.add(can);

    _tearGasClouds.push({
      mesh:      can,
      particles: particles,
      pos:       pos.clone(),
      age:       0,
      life:      TEARGAS_LIFE,
      radius:    TEARGAS_RADIUS
    });
  }

  function _updateTearGas(delta) {
    var sc = _getScene();
    var pp = _playerPos();

    for (var i = _tearGasClouds.length - 1; i >= 0; i--) {
      var tg = _tearGasClouds[i];
      tg.age += delta;

      if (tg.age >= tg.life) {
        // Remove
        if (sc) {
          sc.remove(tg.mesh);
          for (var p = 0; p < tg.particles.length; p++) {
            sc.remove(tg.particles[p]);
            if (tg.particles[p].geometry) tg.particles[p].geometry.dispose();
            if (tg.particles[p].material) tg.particles[p].material.dispose();
          }
          if (tg.mesh.geometry) tg.mesh.geometry.dispose();
          if (tg.mesh.material) tg.mesh.material.dispose();
        }
        _tearGasClouds.splice(i, 1);
        continue;
      }

      var expandT = Math.min(tg.age / 2.0, 1.0);
      var fadeT   = Math.max(0, (tg.age - tg.life * 0.65) / (tg.life * 0.35));
      var opacity = Math.min(expandT, 1.0 - fadeT) * 0.65;

      for (var j = 0; j < tg.particles.length; j++) {
        var part = tg.particles[j];
        part.position.x = part.userData.startX + (part.userData.targetX - part.userData.startX) * expandT;
        part.position.y = part.userData.startY + (part.userData.targetY - part.userData.startY) * expandT;
        part.position.z = part.userData.startZ + (part.userData.targetZ - part.userData.startZ) * expandT;
        part.material.opacity = opacity;
      }

      // Apply choking to enemies in range
      var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      for (var e = 0; e < enemies.length; e++) {
        var enemy = enemies[e];
        var ePos  = enemy.position || (enemy.mesh && enemy.mesh.position) || (enemy.group && enemy.group.position);
        if (!ePos) continue;
        var dist = _dist2D(ePos, tg.pos);
        if (dist < tg.radius * expandT) {
          enemy._tearGassed   = true;
          enemy._tearGasTimer = 0.5; // keep refreshing
          // Slow enemy speed
          if (enemy._speedMult === undefined) enemy._speedMult = 1.0;
          enemy._speedMult = Math.min(enemy._speedMult, 0.5);
          // Reduce accuracy
          if (enemy._accuracyMult === undefined) enemy._accuracyMult = 1.0;
          enemy._accuracyMult = Math.min(enemy._accuracyMult, 0.5);
        }
      }

      // Apply screen effect if player in tear gas
      if (pp) {
        var pdist2 = _dist2D(pp, tg.pos);
        if (pdist2 < tg.radius * expandT) {
          document.body.style.filter = 'saturate(0.4) hue-rotate(40deg)';
        }
      }
    }

    // Clear player filter if no longer in gas
    var inGas = false;
    if (pp) {
      for (var tc = 0; tc < _tearGasClouds.length; tc++) {
        var tg3 = _tearGasClouds[tc];
        var expandT2 = Math.min(tg3.age / 2.0, 1.0);
        if (_dist2D(pp, tg3.pos) < tg3.radius * expandT2) {
          inGas = true;
          break;
        }
      }
    }
    if (!inGas) document.body.style.filter = '';
  }

  // ── Flashbang ──────────────────────────────────────────────
  function _throwFlashbang() {
    var sc  = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || !window.THREE) return;

    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    var startPos = cam.position.clone().add(dir.clone().multiplyScalar(0.5));
    startPos.y -= 0.1;

    var geo  = new THREE.SphereGeometry(0.08, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xDDDD44 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    sc.add(mesh);

    _flashbangs.push({
      mesh:     mesh,
      vel:      new THREE.Vector3(dir.x * THROW_HSPEED, THROW_VSPEED, dir.z * THROW_HSPEED),
      age:      0,
      bounced:  false,
      exploded: false
    });
  }

  function _explodeFlashbang(pos) {
    var sc = _getScene();
    var pp = _playerPos();

    // Flash sphere visual
    if (sc && window.THREE) {
      var geo  = new THREE.SphereGeometry(0.5, 8, 8);
      var mat  = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      sc.add(mesh);
      // Fade and remove
      var fadeTimer = 0;
      var fadeFn = function () {
        fadeTimer += 0.05;
        if (mesh.material) mesh.material.opacity = Math.max(0, 0.9 - fadeTimer * 3);
        if (fadeTimer < 0.4) {
          setTimeout(fadeFn, 50);
        } else {
          if (sc) sc.remove(mesh);
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) mesh.material.dispose();
        }
      };
      setTimeout(fadeFn, 50);
    }

    // Blind enemies in radius
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var ePos = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
      if (!ePos) continue;
      var dist = _dist2D(ePos, pos);
      if (dist < FLASHBANG_RADIUS) {
        e._blinded      = true;
        e._blindTimer   = FLASHBANG_BLIND;
        _stunEnemy(e, FLASHBANG_BLIND);
        _nonlethalCount++;
        _checkNonlethalBonus();
      }
    }

    // Stun civilians in range
    for (var c = 0; c < _civilians.length; c++) {
      var civ = _civilians[c];
      if (!civ.mesh || civ.dead) continue;
      var cdist = _dist2D(civ.mesh.position, pos);
      if (cdist < FLASHBANG_RADIUS) {
        civ.state     = 'STUNNED';
        civ.stunTimer = FLASHBANG_BLIND;
      }
    }

    // Blind player if close
    if (pp) {
      var playerDist = _dist2D(pp, pos);
      if (playerDist < FLASHBANG_RADIUS * 0.6) {
        _playerBlindTimer = FLASHBANG_BLIND;
        if (_overlayEl) {
          _overlayEl.style.opacity = '1';
        }
        _playNoise(0.5, 0.6);
        _toast('FLASHBANG — BLINDED!', '#FFFFFF');
      }
    }

    _playTone(3000, 0.3, 0.7, 'sine');
  }

  function _updateFlashbangs(delta) {
    var sc = _getScene();

    for (var i = _flashbangs.length - 1; i >= 0; i--) {
      var fb = _flashbangs[i];
      if (fb.exploded) {
        _flashbangs.splice(i, 1);
        continue;
      }

      fb.age += delta;
      if (fb.age > 8) {
        if (sc && fb.mesh) sc.remove(fb.mesh);
        _flashbangs.splice(i, 1);
        continue;
      }

      fb.vel.y += GRENADE_GRAVITY * delta;
      fb.mesh.position.x += fb.vel.x * delta;
      fb.mesh.position.y += fb.vel.y * delta;
      fb.mesh.position.z += fb.vel.z * delta;
      fb.mesh.rotation.x += 4 * delta;

      var groundY = 0;
      if (window.TerrainSystem && typeof window.TerrainSystem.getHeightAt === 'function') {
        groundY = window.TerrainSystem.getHeightAt(fb.mesh.position.x, fb.mesh.position.z) || 0;
      }

      if (fb.mesh.position.y <= groundY) {
        fb.mesh.position.y = groundY;
        if (!fb.bounced) {
          fb.vel.y = Math.abs(fb.vel.y) * BOUNCE_DAMPEN;
          fb.vel.x *= 0.6;
          fb.vel.z *= 0.6;
          fb.bounced = true;
        } else {
          var explodePos = fb.mesh.position.clone();
          if (sc) sc.remove(fb.mesh);
          if (fb.mesh.geometry) fb.mesh.geometry.dispose();
          if (fb.mesh.material) fb.mesh.material.dispose();
          fb.exploded = true;
          _explodeFlashbang(explodePos);
        }
      }
    }

    // Blind timer
    if (_playerBlindTimer > 0) {
      _playerBlindTimer -= delta;
      if (_playerBlindTimer <= 0) {
        _playerBlindTimer = 0;
        if (_overlayEl) _overlayEl.style.opacity = '0';
      } else {
        // Fade out overlay as timer runs down
        var pct = _playerBlindTimer / FLASHBANG_BLIND;
        if (_overlayEl) _overlayEl.style.opacity = String(Math.min(1, pct * 2));
      }
    }
  }

  // ── Rubber bullet projectile ───────────────────────────────
  function _fireRubberBullet() {
    var sc  = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || !window.THREE) return;

    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    var startPos = cam.position.clone().add(dir.clone().multiplyScalar(0.5));

    var geo  = new THREE.SphereGeometry(0.04, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    sc.add(mesh);

    var baseSpeed = 30;
    _activeProjectiles.push({
      mesh: mesh,
      vel:  dir.clone().multiplyScalar(baseSpeed * RUBBER_SPEED),
      type: NLWEP_RUBBER,
      age:  0
    });

    _playTone(800, 0.1, 0.2, 'square');
  }

  function _updateProjectiles(delta) {
    var sc  = _getScene();
    var pp  = _playerPos();

    for (var i = _activeProjectiles.length - 1; i >= 0; i--) {
      var proj = _activeProjectiles[i];
      proj.age += delta;

      if (proj.age > 5) {
        if (sc && proj.mesh) {
          sc.remove(proj.mesh);
          if (proj.mesh.geometry) proj.mesh.geometry.dispose();
          if (proj.mesh.material) proj.mesh.material.dispose();
        }
        _activeProjectiles.splice(i, 1);
        continue;
      }

      proj.mesh.position.x += proj.vel.x * delta;
      proj.mesh.position.y += proj.vel.y * delta;
      proj.mesh.position.z += proj.vel.z * delta;

      // Drop slightly
      proj.vel.y -= 4 * delta;

      // Check enemy hits
      var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      var hit     = false;
      for (var e = 0; e < enemies.length; e++) {
        var enemy = enemies[e];
        var ePos  = enemy.position || (enemy.mesh && enemy.mesh.position) || (enemy.group && enemy.group.position);
        if (!ePos) continue;
        var dist3 = proj.mesh.position.distanceTo(ePos);
        if (dist3 < 0.7) {
          // Apply rubber bullet damage (never kills)
          var dmg = RUBBER_DAMAGE * _roeDmgMult();
          if (enemy.hp !== undefined) {
            enemy.hp = Math.max(1, enemy.hp - dmg);
          }
          if (enemy.takeDamage) enemy.takeDamage(dmg, true); // true = nonlethal

          // Stun
          _stunEnemy(enemy, RUBBER_STUN);
          _nonlethalCount++;
          _checkNonlethalBonus();
          _crowdControlScore += 10;
          _updateHUD();
          hit = true;
          break;
        }
      }

      if (hit) {
        if (sc && proj.mesh) {
          sc.remove(proj.mesh);
          if (proj.mesh.geometry) proj.mesh.geometry.dispose();
          if (proj.mesh.material) proj.mesh.material.dispose();
        }
        _activeProjectiles.splice(i, 1);
      }
    }
  }

  // ── Baton attack ───────────────────────────────────────────
  function _doBatonSwing() {
    var pp = _playerPos();
    if (!pp) return;

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var hit = false;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var ePos = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
      if (!ePos) continue;
      var dist = _dist2D(pp, ePos);
      if (dist <= BATON_RANGE) {
        var dmg = BATON_DAMAGE * _roeDmgMult();
        if (e.hp !== undefined) e.hp = Math.max(1, e.hp - dmg);
        if (e.takeDamage) e.takeDamage(dmg, true);
        _stunEnemy(e, BATON_STUN);
        _nonlethalCount++;
        _checkNonlethalBonus();
        _crowdControlScore += 15;
        _toast('BATON HIT! +15', '#FFDD44');
        _playTone(150, 0.15, 0.3, 'sawtooth');
        hit = true;
      }
    }
    if (!hit) {
      _playTone(300, 0.05, 0.1, 'sine');
    }
    _updateHUD();
  }

  // ── Tear gas throw ─────────────────────────────────────────
  function _throwTearGas() {
    var sc  = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || !window.THREE) return;

    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);

    // Throw with arc, land and deploy
    var geo  = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x888800 });
    var mesh = new THREE.Mesh(geo, mat);
    var startPos = cam.position.clone().add(dir.clone().multiplyScalar(0.5));
    startPos.y -= 0.1;
    mesh.position.copy(startPos);
    sc.add(mesh);

    _activeProjectiles.push({
      mesh:    mesh,
      vel:     new THREE.Vector3(dir.x * THROW_HSPEED, THROW_VSPEED, dir.z * THROW_HSPEED),
      type:    NLWEP_TEARGAS,
      age:     0,
      bounced: false
    });
  }

  function _updateTearGasProjectiles(delta) {
    // Handled in _updateProjectiles but tear gas has special arc & landing
    // So we pull them out via type check in the combined update
  }

  // Override projectile update to handle tear gas arc
  function _updateAllProjectiles(delta) {
    var sc = _getScene();

    for (var i = _activeProjectiles.length - 1; i >= 0; i--) {
      var proj = _activeProjectiles[i];
      proj.age += delta;

      if (proj.type === NLWEP_RUBBER) {
        // handled separately above actually, but we include it here for completeness
        // already done in _updateProjectiles; skip double-processing by not having duplicates
        // (We call _updateProjectiles for rubber only)
        continue;
      }

      // Tear gas canister arc
      if (proj.type === NLWEP_TEARGAS) {
        if (proj.age > 8) {
          if (sc && proj.mesh) {
            sc.remove(proj.mesh);
            if (proj.mesh.geometry) proj.mesh.geometry.dispose();
            if (proj.mesh.material) proj.mesh.material.dispose();
          }
          _activeProjectiles.splice(i, 1);
          continue;
        }

        proj.vel.y += GRENADE_GRAVITY * delta;
        proj.mesh.position.x += proj.vel.x * delta;
        proj.mesh.position.y += proj.vel.y * delta;
        proj.mesh.position.z += proj.vel.z * delta;
        proj.mesh.rotation.x += 3 * delta;

        var groundY = 0;
        if (window.TerrainSystem && typeof window.TerrainSystem.getHeightAt === 'function') {
          groundY = window.TerrainSystem.getHeightAt(proj.mesh.position.x, proj.mesh.position.z) || 0;
        }

        if (proj.mesh.position.y <= groundY) {
          proj.mesh.position.y = groundY;
          if (!proj.bounced) {
            proj.vel.y = Math.abs(proj.vel.y) * BOUNCE_DAMPEN;
            proj.vel.x *= 0.5;
            proj.vel.z *= 0.5;
            proj.bounced = true;
          } else {
            // Deploy tear gas
            var landPos = proj.mesh.position.clone();
            if (sc) {
              sc.remove(proj.mesh);
              if (proj.mesh.geometry) proj.mesh.geometry.dispose();
              if (proj.mesh.material) proj.mesh.material.dispose();
            }
            _spawnTearGasCloud(landPos);
            _playNoise(0.8, 0.25);
            _activeProjectiles.splice(i, 1);
          }
        }
      }
    }
  }

  // ── Riot shield ────────────────────────────────────────────
  function _deployShield() {
    var cam = _getCamera();
    if (!cam || !window.THREE) return;

    _shieldDeployed = true;
    window._riotShieldDeployed = true;

    if (!_shieldMesh) {
      var geo = new THREE.PlaneGeometry(0.7, 1.0);
      var mat = new THREE.MeshBasicMaterial({
        color:       0x1A3A6A,
        transparent: true,
        opacity:     0.75,
        side:        THREE.DoubleSide,
        depthTest:   false
      });
      _shieldMesh = new THREE.Mesh(geo, mat);
      _shieldMesh.position.set(-0.25, -0.15, -0.5);
      _shieldMesh.renderOrder = 998;
      cam.add(_shieldMesh);
    }

    // Slow player
    if (typeof window._playerSpeedMult !== 'undefined') {
      window._playerSpeedMult = (window._playerSpeedMult || 1) * SHIELD_SPEED_MULT;
    } else {
      window._playerSpeedMult = SHIELD_SPEED_MULT;
    }

    _toast('[H] Riot shield deployed. LMB to bash.', '#88DDFF');
    _updateHUD();
  }

  function _undeployShield() {
    var cam = _getCamera();
    if (!_shieldDeployed) return;

    _shieldDeployed = false;
    window._riotShieldDeployed = false;

    if (_shieldMesh) {
      if (cam) cam.remove(_shieldMesh);
      if (_shieldMesh.geometry) _shieldMesh.geometry.dispose();
      if (_shieldMesh.material) _shieldMesh.material.dispose();
      _shieldMesh = null;
    }

    // Restore speed
    if (typeof window._playerSpeedMult !== 'undefined') {
      window._playerSpeedMult = window._playerSpeedMult / SHIELD_SPEED_MULT;
    }

    _updateHUD();
  }

  function _shieldBash() {
    var pp = _playerPos();
    if (!pp || !_shieldDeployed) return;

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var e    = enemies[i];
      var ePos = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
      if (!ePos) continue;
      var dist = _dist2D(pp, ePos);
      if (dist < 2.0) {
        // Push enemy back
        var dx = ePos.x - pp.x;
        var dz = ePos.z - pp.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        ePos.x += (dx / len) * 3;
        ePos.z += (dz / len) * 3;
        if (e.mesh && e.mesh.position !== ePos) { e.mesh.position.x += (dx / len) * 3; e.mesh.position.z += (dz / len) * 3; }
        if (e.group && e.group.position !== ePos) { e.group.position.x += (dx / len) * 3; e.group.position.z += (dz / len) * 3; }
        _stunEnemy(e, 0.8);
        _playTone(120, 0.2, 0.3, 'sawtooth');
        _toast('SHIELD BASH!', '#88DDFF');
      }
    }
  }

  // ── Input handling ─────────────────────────────────────────
  function _handleInput(delta) {
    var keys  = window._keysDown || window._keys || {};
    var lmbDown = !!(window._mouseButtons && window._mouseButtons[0]);

    // N: cycle non-lethal weapon
    var nDown = !!(keys['KeyN'] || keys['n'] || keys['N']);
    if (nDown && !_nKeyWas) {
      _selectedNLW = (_selectedNLW + 1) % NLWEAPONS.length;
      _toast('[N] ' + NLWEAPONS[_selectedNLW].replace('_', ' '), '#88DDFF');
      _updateHUD();
    }
    _nKeyWas = nDown;

    // H: toggle riot shield
    var hDown = !!(keys['KeyH'] || keys['h'] || keys['H']);
    if (hDown && !_hKeyWas) {
      if (_shieldDeployed) {
        _undeployShield();
      } else {
        _deployShield();
      }
    }
    _hKeyWas = hDown;

    // F: detain nearby stunned enemy
    var fDown = !!(keys['KeyF'] || keys['f'] || keys['F']);
    if (fDown && !_fKeyWas) {
      _tryDetain();
    }
    _fKeyWas = fDown;

    // LMB: fire / use selected weapon
    if (lmbDown && !_lmbWas) {
      if (_shieldDeployed) {
        _shieldBash();
      } else if (_fireAllowed()) {
        _fireSelectedNLW();
      } else {
        _toast('Weapons disabled! (' + _emergencyTimer.toFixed(0) + 's)', '#FF3333');
      }
    }
    _lmbWas = lmbDown;
  }

  function _fireSelectedNLW() {
    var nlw = NLWEAPONS[_selectedNLW];
    if (nlw === NLWEP_RUBBER)    _fireRubberBullet();
    if (nlw === NLWEP_FLASHBANG) _throwFlashbang();
    if (nlw === NLWEP_TEARGAS)   _throwTearGas();
    if (nlw === NLWEP_BATON)     _doBatonSwing();
  }

  // ── Shield frontal damage interception ────────────────────
  function _interceptDamage(dmg) {
    if (!_shieldDeployed) return dmg;
    var blocked = dmg * SHIELD_DAMAGE_BLOCK;
    _playTone(400, 0.1, 0.2, 'square');
    return dmg - blocked;
  }

  // ── Toast fade ─────────────────────────────────────────────
  function _updateToast(delta) {
    if (_toastTimer > 0) {
      _toastTimer -= delta;
      if (_toastTimer <= 0 && _toastEl) {
        _toastEl.style.opacity = '0';
      }
    }
  }

  // ── Public: init ───────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    _createHUD();
    _updateHUD();

    // Hook into damage pipeline
    var prevDmg = window._playerTookDamage;
    window._playerTookDamage = function (dmg) {
      var remaining = _interceptDamage(dmg);
      if (prevDmg) return prevDmg(remaining);
      return remaining;
    };

    // Hook into enemy death for civilian save check
    var prevEnemyDied = window._onEnemyDied;
    window._onEnemyDied = function (enemy) {
      _checkCivilianSave(enemy);
      if (prevEnemyDied) prevEnemyDied(enemy);
    };

    console.log('[RiotControl] init. N=cycle NLW, H=shield, F=detain, LMB=fire.');
  }

  // ── Public: update ─────────────────────────────────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    _handleInput(delta);
    _updateROE(delta);
    _updateCivilians(delta);
    _updateStunnedEnemies(delta);
    _updateProjectiles(delta);   // rubber bullets
    _updateAllProjectiles(delta); // tear gas arc
    _updateFlashbangs(delta);
    _updateTearGas(delta);
    _updateToast(delta);
    _updateHUD();
  }

  // ── Public: reset ──────────────────────────────────────────
  function reset() {
    var sc = _getScene();

    // Remove civilians
    for (var i = 0; i < _civilians.length; i++) {
      var civ = _civilians[i];
      if (civ.mesh && sc) sc.remove(civ.mesh);
    }
    _civilians = [];

    // Remove tear gas
    for (var t = 0; t < _tearGasClouds.length; t++) {
      var tg = _tearGasClouds[t];
      if (sc) {
        sc.remove(tg.mesh);
        for (var p = 0; p < tg.particles.length; p++) {
          sc.remove(tg.particles[p]);
          if (tg.particles[p].geometry) tg.particles[p].geometry.dispose();
          if (tg.particles[p].material) tg.particles[p].material.dispose();
        }
        if (tg.mesh.geometry) tg.mesh.geometry.dispose();
        if (tg.mesh.material) tg.mesh.material.dispose();
      }
    }
    _tearGasClouds = [];

    // Remove projectiles
    for (var pr = 0; pr < _activeProjectiles.length; pr++) {
      var proj = _activeProjectiles[pr];
      if (proj.mesh && sc) {
        sc.remove(proj.mesh);
        if (proj.mesh.geometry) proj.mesh.geometry.dispose();
        if (proj.mesh.material) proj.mesh.material.dispose();
      }
    }
    _activeProjectiles = [];

    // Remove flashbangs
    for (var fb = 0; fb < _flashbangs.length; fb++) {
      var fbn = _flashbangs[fb];
      if (fbn.mesh && sc) {
        sc.remove(fbn.mesh);
        if (fbn.mesh.geometry) fbn.mesh.geometry.dispose();
        if (fbn.mesh.material) fbn.mesh.material.dispose();
      }
    }
    _flashbangs = [];

    // Undeploy shield
    _undeployShield();

    // Reset state
    _roeLevel          = ROE_PERMISSIVE;
    _civilianKills     = 0;
    _emergencyTimer    = 0;
    _detainCount       = 0;
    _nonlethalCount    = 0;
    _crowdControlScore = 0;
    _selectedNLW       = 0;
    _stunnedEnemies    = [];
    _attackerThreats   = [];
    _playerBlindTimer  = 0;
    _nKeyWas           = false;
    _hKeyWas           = false;
    _fKeyWas           = false;
    _lmbWas            = false;

    if (_overlayEl) _overlayEl.style.opacity = '0';
    document.body.style.filter = '';

    _updateHUD();
    console.log('[RiotControl] reset.');
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    init:           init,
    update:         update,
    spawnCivilians: spawnCivilians,
    getROELevel:    getROELevel,
    reset:          reset
  };

})();
