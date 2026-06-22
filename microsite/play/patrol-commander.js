/* ═══════════════════════════════════════════════════════════════════════════════
   PATROL-COMMANDER.JS — Elite Patrol Commander Mini-Boss
   ───────────────────────────────────────────────────────────────────────────────
   Spawns as a mini-boss at wave 5 and every 5 waves thereafter.

   Public API (exposed as window.PatrolCommander):
     PatrolCommander.init(scene)   — call once after scene is ready
     PatrolCommander.update(delta) — call every frame
     PatrolCommander.spawn(wave)   — manually force a spawn (also called internally)
     PatrolCommander.reset()       — full teardown (stage/restart)
 ═══════════════════════════════════════════════════════════════════════════════ */
window.PatrolCommander = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var COMMANDER_HP         = 280;
  var COMMANDER_SCALE      = 1.4;
  var COMMANDER_COLOR      = 0xB8860B;   // gold/brass uniform
  var COMMANDER_DAMAGE     = 25;
  var PHASE2_HP_THRESHOLD  = 150;
  var RALLY_RADIUS         = 12;
  var RALLY_SPEED_BONUS    = 1.30;       // +30%
  var RALLY_DURATION       = 6;          // seconds
  var MORALE_DEBUFF        = 0.8;        // allies -20% speed when commander dead
  var DEATH_MSG_DURATION   = 5;          // seconds
  var LOOT_MULTIPLIER      = 1.5;
  var LOOT_DURATION        = 30;         // seconds
  var SCORE_ON_KILL        = 1000;
  var REINFORCEMENT_COUNT  = 4;
  var SHOOT_INTERVAL       = 1.2;        // seconds between shots (phase 1)
  var SHOOT_INTERVAL_P2    = 0.7;        // faster in phase 2
  var MOVE_SPEED           = 4.5;
  var MOVE_SPEED_P2        = 7.0;
  var CALLOUT_INTERVAL     = 8;          // seconds between voice callouts
  var SPAWN_EVERY_N_WAVES  = 5;

  var CALLOUTS = [
    'ADVANCE!',
    'TAKE HIM DOWN!',
    'FOR THE MOTHERLAND!',
    'VPERED! ATTACK!',
    'OGON! FIRE AT WILL!',
    'HOLD THE LINE, COMRADES!'
  ];

  /* ── Module State ───────────────────────────────────────────────────────── */
  var _scene            = null;
  var _commander        = null;   // Three.js group for commander mesh
  var _hp               = 0;
  var _maxHp            = COMMANDER_HP;
  var _phase            = 1;
  var _alive            = false;
  var _shootTimer       = 0;
  var _calloutTimer     = 0;
  var _rallyTimer       = 0;      // countdown to next rally pulse
  var _deathMsgTimer    = 0;
  var _lootTimer        = 0;
  var _lootActive       = false;
  var _demoralized      = false;
  var _demoralizeTimer  = 0;
  var _reinfsSpawned    = false;  // guard: call reinforcements only once
  var _healthBarEl      = null;   // DOM element for health bar
  var _healthBarFill    = null;
  var _deathMsgEl       = null;
  var _speechSynth      = null;
  var _speechAvail      = false;
  var _spawnedWave      = 0;      // which wave triggered this commander

  /* ── Geometry / material caches ─────────────────────────────────────────── */
  var _bodyGeo    = null;
  var _headGeo    = null;
  var _medalGeo   = null;
  var _bodyMat    = null;
  var _headMat    = null;
  var _medalMat   = null;
  var _barrelGeo  = null;
  var _barrelMat  = null;

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  function _getPlayer() {
    return window.GameManager && window.GameManager.getPlayer
      ? window.GameManager.getPlayer()
      : null;
  }

  function _getEnemyList() {
    return window._enemyList || [];
  }

  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.getScene
        ? window.GameManager.getScene()
        : null);
  }

  function _getCurrentWave() {
    if (window.GameManager && window.GameManager.getCurrentWave) {
      return window.GameManager.getCurrentWave();
    }
    return 0;
  }

  /* ── Speech (Web Speech API) ──────────────────────────────────────────── */
  function _initSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      _speechSynth = window.speechSynthesis;
      _speechAvail = true;
    }
  }

  function _speak(text) {
    if (!_speechAvail || !_speechSynth) return;
    try {
      _speechSynth.cancel();
      var utt = new window.SpeechSynthesisUtterance(text);
      utt.rate  = 1.1;
      utt.pitch = 0.85;
      utt.volume = 0.9;
      _speechSynth.speak(utt);
    } catch (e) {
      /* speech not available — silent fallback */
    }
  }

  /* ── DOM health bar ─────────────────────────────────────────────────────── */
  function _createHealthBar() {
    if (_healthBarEl) return;
    _healthBarEl = document.createElement('div');
    _healthBarEl.id = 'commander-health-bar';
    _healthBarEl.style.cssText = [
      'position:fixed',
      'top:48px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:220px',
      'background:rgba(0,0,0,0.7)',
      'border:2px solid #B8860B',
      'border-radius:6px',
      'padding:4px 8px',
      'font-family:monospace',
      'font-size:12px',
      'color:#B8860B',
      'z-index:299',
      'pointer-events:none',
      'text-align:center',
      'display:none'
    ].join(';');

    var label = document.createElement('div');
    label.textContent = '★ PATROL COMMANDER ★';
    label.style.marginBottom = '3px';
    _healthBarEl.appendChild(label);

    var track = document.createElement('div');
    track.style.cssText = 'width:100%;height:10px;background:#333;border-radius:4px;overflow:hidden';

    _healthBarFill = document.createElement('div');
    _healthBarFill.style.cssText = 'height:100%;width:100%;background:linear-gradient(90deg,#B8860B,#FFD700);border-radius:4px;transition:width 0.15s';
    track.appendChild(_healthBarFill);
    _healthBarEl.appendChild(track);

    document.body.appendChild(_healthBarEl);
  }

  function _updateHealthBar() {
    if (!_healthBarEl) return;
    if (_alive) {
      _healthBarEl.style.display = 'block';
      var pct = Math.max(0, (_hp / _maxHp) * 100);
      if (_healthBarFill) _healthBarFill.style.width = pct + '%';
    } else {
      _healthBarEl.style.display = 'none';
    }
  }

  /* ── Death message overlay ─────────────────────────────────────────────── */
  function _showDeathMessage() {
    if (_deathMsgEl) {
      _deathMsgEl.style.display = 'block';
      return;
    }
    _deathMsgEl = document.createElement('div');
    _deathMsgEl.id = 'commander-death-msg';
    _deathMsgEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'color:#FFD700',
      'text-shadow:0 0 20px #B8860B',
      'z-index:301',
      'pointer-events:none',
      'text-align:center',
      'background:rgba(0,0,0,0.7)',
      'border:2px solid #B8860B',
      'border-radius:8px',
      'padding:12px 24px'
    ].join(';');
    _deathMsgEl.textContent = '☠ COMMANDER DOWN! ☠';
    document.body.appendChild(_deathMsgEl);
  }

  function _hideDeathMessage() {
    if (_deathMsgEl) _deathMsgEl.style.display = 'none';
  }

  /* ── Kill feed helper ───────────────────────────────────────────────────── */
  function _addKillFeed(msg, color) {
    var el = document.getElementById('kill-feed');
    if (!el) return;
    var entry = document.createElement('div');
    entry.style.cssText = [
      'font-size:13px',
      'font-family:monospace',
      'padding:2px 8px',
      'margin-bottom:2px',
      'color:' + (color || '#FFD700'),
      'text-shadow:0 0 8px ' + (color || '#B8860B'),
      'background:rgba(0,0,0,0.6)',
      'border-left:3px solid ' + (color || '#B8860B'),
      'border-radius:3px',
      'font-weight:bold',
      'animation:none'
    ].join(';');
    entry.textContent = msg;
    el.insertBefore(entry, el.firstChild);
    setTimeout(function () {
      if (entry.parentNode) entry.parentNode.removeChild(entry);
    }, 8000);
  }

  /* ── Toast / wave-announce helper ──────────────────────────────────────── */
  function _toast(msg, color, dur) {
    var el = document.getElementById('wave-announce');
    if (!el) return;
    el.textContent = msg;
    el.style.color = color || '#FFD700';
    el.style.display = 'block';
    clearTimeout(el._toastTimer);
    el._toastTimer = setTimeout(function () {
      el.textContent = '';
      el.style.display = '';
    }, (dur || 3) * 1000);
  }

  /* ── Geometry builders ─────────────────────────────────────────────────── */
  function _ensureGeo() {
    if (!window.THREE) return;
    if (!_bodyGeo)   _bodyGeo   = new THREE.BoxGeometry(0.7, 1.2, 0.5);
    if (!_headGeo)   _headGeo   = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    if (!_medalGeo)  _medalGeo  = new THREE.BoxGeometry(0.08, 0.08, 0.04);
    if (!_barrelGeo) _barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
    if (!_bodyMat)   _bodyMat   = new THREE.MeshLambertMaterial({ color: COMMANDER_COLOR });
    if (!_headMat)   _headMat   = new THREE.MeshLambertMaterial({ color: 0x8B7536 });
    if (!_medalMat)  _medalMat  = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    if (!_barrelMat) _barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  }

  function _buildCommanderMesh() {
    if (!window.THREE) return null;
    _ensureGeo();

    var group = new THREE.Group();

    /* Body */
    var body = new THREE.Mesh(_bodyGeo, _bodyMat);
    body.position.set(0, 0.6, 0);
    group.add(body);

    /* Head */
    var head = new THREE.Mesh(_headGeo, _headMat);
    head.position.set(0, 1.425, 0);
    group.add(head);

    /* Peak cap visor */
    var visorGeo = new THREE.BoxGeometry(0.55, 0.06, 0.18);
    var visor = new THREE.Mesh(visorGeo, _bodyMat);
    visor.position.set(0, 1.62, 0.22);
    group.add(visor);

    /* Medals on chest (3 small gold squares) */
    var medalOffsets = [[-0.14, 0.80, 0.26], [0, 0.80, 0.26], [0.14, 0.80, 0.26]];
    for (var mi = 0; mi < medalOffsets.length; mi++) {
      var medal = new THREE.Mesh(_medalGeo, _medalMat);
      medal.position.set(medalOffsets[mi][0], medalOffsets[mi][1], medalOffsets[mi][2]);
      group.add(medal);
    }

    /* Rifle barrel */
    var barrel = new THREE.Mesh(_barrelGeo, _barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.6, 0.8, 0);
    group.add(barrel);

    /* Gold outline point-light for dramatic effect */
    var light = new THREE.PointLight(0xFFD700, 1.5, 5);
    light.position.set(0, 1.0, 0);
    group.add(light);

    group.scale.set(COMMANDER_SCALE, COMMANDER_SCALE, COMMANDER_SCALE);
    return group;
  }

  /* ── Spawn ──────────────────────────────────────────────────────────────── */
  function spawn(wave) {
    if (_alive) return;  // one commander at a time

    var sc = _getScene();
    if (!sc) return;

    _spawnedWave    = wave || _getCurrentWave();
    _hp             = COMMANDER_HP;
    _maxHp          = COMMANDER_HP;
    _phase          = 1;
    _alive          = true;
    _shootTimer     = 0;
    _calloutTimer   = 2;  // first callout after 2s
    _rallyTimer     = 3;
    _reinfsSpawned  = false;

    /* Set morale debuff globals */
    window._commanderAlive    = true;
    window._enemyMoraleDebuff = MORALE_DEBUFF;

    /* Build and place mesh */
    var player = _getPlayer();
    var startX = player ? (player.position.x + (Math.random() < 0.5 ? -15 : 15)) : (Math.random() * 20 - 10);
    var startZ = player ? (player.position.z + (Math.random() < 0.5 ? -15 : 15)) : (Math.random() * 20 - 10);

    _commander = _buildCommanderMesh();
    if (_commander) {
      _commander.position.set(startX, 0, startZ);
      sc.add(_commander);
    }

    /* Register in global enemy list so other systems can interact */
    if (!window._enemyList) window._enemyList = [];
    window._enemyList.push({
      _isCommander: true,
      hp:           _hp,
      maxHp:        _maxHp,
      damage:       COMMANDER_DAMAGE,
      type:         'PatrolCommander',
      mesh:         _commander,
      position:     _commander ? _commander.position : new THREE.Vector3(startX, 0, startZ)
    });

    _createHealthBar();
    _updateHealthBar();

    _toast('★ PATROL COMMANDER HAS ARRIVED! ★', '#FFD700', 4);
    _addKillFeed('★ PATROL COMMANDER SPAWNED — WAVE ' + _spawnedWave, '#FFD700');
    _speak('ADVANCE! FOR THE MOTHERLAND!');

    console.log('[PatrolCommander] Spawned at wave', _spawnedWave);
  }

  /* ── Rally nearby enemies ─────────────────────────────────────────────── */
  function _rallyAllies() {
    if (!_alive || !_commander) return;
    var enemies = _getEnemyList();
    var cmdPos = _commander.position;
    var count = 0;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e._isCommander) continue;
      var ePos = e.position || (e.mesh && e.mesh.position);
      if (!ePos) continue;
      var dx = ePos.x - cmdPos.x;
      var dz = ePos.z - cmdPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= RALLY_RADIUS) {
        /* Apply speed buff on enemy object */
        if (!e._rallyBuffActive) {
          e._rallyBuffActive   = true;
          e._rallyBuffTimer    = RALLY_DURATION;
          e._baseSpeed         = e._baseSpeed || e.speed || 3;
          e.speed              = (e._baseSpeed || 3) * RALLY_SPEED_BONUS;
        } else {
          /* Refresh timer */
          e._rallyBuffTimer = RALLY_DURATION;
        }
        count++;
      }
    }

    if (count > 0) {
      _speak(CALLOUTS[Math.floor(Math.random() * CALLOUTS.length)]);
    }
  }

  /* ── Tick rally buff timers on all enemies ─────────────────────────────── */
  function _tickRallyBuffs(dt) {
    var enemies = _getEnemyList();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e._rallyBuffActive) continue;
      e._rallyBuffTimer -= dt;
      if (e._rallyBuffTimer <= 0) {
        e._rallyBuffActive = false;
        e.speed = e._baseSpeed || 3;
      }
    }
  }

  /* ── Demoralize all living enemies (after commander death) ────────────── */
  function _demoralizeEnemies() {
    var enemies = _getEnemyList();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e._isCommander) continue;
      e._demoralizeTimer = 8;
      e._baseSpeed = e._baseSpeed || e.speed || 3;
      e.speed = (e._baseSpeed) * 0.8;  // -20%
    }
    _demoralized     = true;
    _demoralizeTimer = 8;
  }

  /* ── Tick demoralize timers ─────────────────────────────────────────────── */
  function _tickDemoralizeBuffs(dt) {
    if (!_demoralized) return;
    var enemies = _getEnemyList();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e._demoralizeTimer) continue;
      e._demoralizeTimer -= dt;
      if (e._demoralizeTimer <= 0) {
        e._demoralizeTimer = 0;
        e.speed = e._baseSpeed || 3;
      }
    }
    _demoralizeTimer -= dt;
    if (_demoralizeTimer <= 0) {
      _demoralized = false;
    }
  }

  /* ── Shoot at player ────────────────────────────────────────────────────── */
  function _shootAtPlayer() {
    if (!_alive || !_commander) return;
    var player = _getPlayer();
    if (!player) return;

    /* Delegate damage via GameManager if available */
    if (window.GameManager && window.GameManager.damagePlayer) {
      window.GameManager.damagePlayer(COMMANDER_DAMAGE, 'PatrolCommander');
    } else if (player && typeof player.hp !== 'undefined') {
      player.hp -= COMMANDER_DAMAGE;
    }
  }

  /* ── Spawn reinforcements (phase 2 only, once) ─────────────────────────── */
  function _spawnReinforcements() {
    if (_reinfsSpawned) return;
    _reinfsSpawned = true;

    var player = _getPlayer();
    var cx = (_commander && _commander.position.x) || 0;
    var cz = (_commander && _commander.position.z) || 0;

    /* Try to use existing enemy-spawn systems */
    for (var i = 0; i < REINFORCEMENT_COUNT; i++) {
      var angle = (i / REINFORCEMENT_COUNT) * Math.PI * 2;
      var rx = cx + Math.cos(angle) * 5;
      var rz = cz + Math.sin(angle) * 5;

      if (window.Enemies && window.Enemies.spawnAt) {
        window.Enemies.spawnAt(rx, 0, rz, 'SOLDIER');
      } else if (window._spawnEnemy) {
        window._spawnEnemy(rx, 0, rz);
      }
      /* If neither hook is available the reinforcements are logged only */
    }

    _toast('COMMANDER CALLED REINFORCEMENTS!', '#FF6600', 3);
    _addKillFeed('⚠ +' + REINFORCEMENT_COUNT + ' REINFORCEMENTS INCOMING', '#FF6600');
    _speak('VPERED! ATTACK!');
  }

  /* ── Drop military radio loot ────────────────────────────────────────────── */
  function _dropRadioLoot() {
    var pos = _commander ? _commander.position : null;
    if (!pos) return;

    /* Spawn visual pickup via Pickups system if available */
    if (window.Pickups && window.Pickups.spawn) {
      window.Pickups.spawn(pos.clone ? pos.clone() : { x: pos.x, y: pos.y, z: pos.z }, 'INTEL', { label: 'Military Radio' });
    }

    /* Apply loot multiplier */
    _lootActive = true;
    _lootTimer  = LOOT_DURATION;
    window._scoreMultiplier = (window._scoreMultiplier || 1) * LOOT_MULTIPLIER;

    _toast('📻 MILITARY RADIO PICKED UP! 1.5x SCORE x' + LOOT_DURATION + 's', '#00FFAA', 4);
    _addKillFeed('📻 MILITARY RADIO — SCORE x1.5 FOR ' + LOOT_DURATION + 's', '#00FFAA');
  }

  /* ── On death ────────────────────────────────────────────────────────────── */
  function _onCommanderDeath() {
    _alive = false;
    window._commanderAlive    = false;
    window._enemyMoraleDebuff = 1.0;  // lifted

    /* Remove from enemy list */
    if (window._enemyList) {
      for (var i = window._enemyList.length - 1; i >= 0; i--) {
        if (window._enemyList[i]._isCommander) {
          window._enemyList.splice(i, 1);
          break;
        }
      }
    }

    /* Remove mesh from scene */
    var sc = _getScene();
    if (sc && _commander) sc.remove(_commander);
    _commander = null;

    /* Update HUD */
    _updateHealthBar();

    /* Score */
    var player = _getPlayer();
    if (player && typeof player.score !== 'undefined') {
      player.score += SCORE_ON_KILL;
      if (window.HUD && window.HUD.setScore) window.HUD.setScore(player.score);
    } else if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(SCORE_ON_KILL);
    }

    /* Kill feed — legendary entry */
    _addKillFeed('☠ COMMANDER ELIMINATED — +1000 SCORE', '#FFD700');

    /* Death message overlay (5 s) */
    _showDeathMessage();
    _deathMsgTimer = DEATH_MSG_DURATION;

    /* Demoralize surviving enemies */
    _demoralizeEnemies();

    /* Drop loot radio */
    _dropRadioLoot();

    /* Feedback */
    _speak('COMMANDER DOWN!');
    _toast('☠ COMMANDER ELIMINATED!', '#FFD700', 5);

    console.log('[PatrolCommander] Killed — +' + SCORE_ON_KILL + ' score');
  }

  /* ── Receive damage (called by game-manager bullet hit) ──────────────────── */
  function _takeDamage(dmg) {
    if (!_alive) return;
    _hp -= (dmg || 0);
    _updateHealthBar();

    if (_hp <= 0) {
      _onCommanderDeath();
    } else if (_hp < PHASE2_HP_THRESHOLD && _phase === 1) {
      _phase = 2;
      _speak('FOR THE MOTHERLAND! VPERED!');
      _toast('COMMANDER PHASE 2 — REINFORCEMENTS!', '#FF4400', 3);
      _spawnReinforcements();
    }
  }

  /* ── Move commander (simple seek-player AI) ──────────────────────────────── */
  function _moveCommander(dt) {
    if (!_alive || !_commander) return;
    var player = _getPlayer();
    if (!player) return;

    var speed = (_phase === 2) ? MOVE_SPEED_P2 : MOVE_SPEED;
    var cx = _commander.position.x;
    var cz = _commander.position.z;
    var px = player.position.x;
    var pz = player.position.z;
    var dx = px - cx;
    var dz = pz - cz;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 2.5) return;  // already close enough — hold position

    if (_phase === 2 && dist < 8) {
      /* Phase 2: retreat from player */
      dx = -dx;
      dz = -dz;
      dist = Math.sqrt(dx * dx + dz * dz);
    }

    if (dist > 0.01) {
      _commander.position.x += (dx / dist) * speed * dt;
      _commander.position.z += (dz / dist) * speed * dt;
      /* Face movement direction */
      _commander.rotation.y = Math.atan2(dx, dz);
    }

    /* Sync position to enemy-list entry */
    if (window._enemyList) {
      for (var i = 0; i < window._enemyList.length; i++) {
        if (window._enemyList[i]._isCommander) {
          window._enemyList[i].position = _commander.position;
          window._enemyList[i].hp       = _hp;
          break;
        }
      }
    }
  }

  /* ── Check if commander got hit by player bullet ─────────────────────────── */
  function _checkBulletHits() {
    /* The game-manager processes hits via window._enemyList; commander is
       registered there. We listen for the hp value being reduced externally
       and mirror it back into _hp if changed. */
    if (!_alive || !window._enemyList) return;
    for (var i = 0; i < window._enemyList.length; i++) {
      var e = window._enemyList[i];
      if (e && e._isCommander && e.hp < _hp) {
        var dmgTaken = _hp - e.hp;
        _takeDamage(dmgTaken);
        if (e.hp !== _hp) e.hp = _hp; // keep in sync
        break;
      }
    }
  }

  /* ── Wave gate: should we spawn at this wave? ──────────────────────────── */
  function _shouldSpawnAtWave(wave) {
    return wave >= SPAWN_EVERY_N_WAVES && (wave % SPAWN_EVERY_N_WAVES === 0);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

  /* init(scene) — call once after the Three.js scene is ready */
  function init(scene) {
    _scene = scene || null;
    _initSpeech();
    _createHealthBar();

    /* Expose globals */
    window._commanderAlive    = false;
    window._enemyMoraleDebuff = 1.0;
    window._scoreMultiplier   = window._scoreMultiplier || 1;

    console.log('[PatrolCommander] Initialized');
  }

  /* update(delta) — call every frame */
  function update(delta) {
    var dt = delta || 0.016;

    /* ── Auto-spawn gate ─────────────────────────────────────────────────── */
    if (!_alive) {
      var wave = _getCurrentWave();
      if (wave > 0 && _shouldSpawnAtWave(wave) && wave !== _spawnedWave) {
        spawn(wave);
      }
    }

    /* ── Commander alive logic ──────────────────────────────────────────── */
    if (_alive) {
      /* Check external damage via enemy list */
      _checkBulletHits();

      /* Move */
      _moveCommander(dt);

      /* Shoot timer */
      var shootInterval = (_phase === 2) ? SHOOT_INTERVAL_P2 : SHOOT_INTERVAL;
      _shootTimer += dt;
      if (_shootTimer >= shootInterval) {
        _shootTimer = 0;
        _shootAtPlayer();
      }

      /* Rally timer */
      _rallyTimer -= dt;
      if (_rallyTimer <= 0) {
        _rallyTimer = RALLY_DURATION;
        _rallyAllies();
      }

      /* Callout timer */
      _calloutTimer -= dt;
      if (_calloutTimer <= 0) {
        _calloutTimer = CALLOUT_INTERVAL + Math.random() * 4;
        _speak(CALLOUTS[Math.floor(Math.random() * CALLOUTS.length)]);
      }
    }

    /* ── Tick rally buff on all enemies ─────────────────────────────────── */
    _tickRallyBuffs(dt);

    /* ── Demoralize tick ──────────────────────────────────────────────────── */
    _tickDemoralizeBuffs(dt);

    /* ── Death message timer ──────────────────────────────────────────────── */
    if (_deathMsgTimer > 0) {
      _deathMsgTimer -= dt;
      if (_deathMsgTimer <= 0) {
        _hideDeathMessage();
      }
    }

    /* ── Loot multiplier timer ───────────────────────────────────────────── */
    if (_lootActive && _lootTimer > 0) {
      _lootTimer -= dt;
      if (_lootTimer <= 0) {
        _lootActive = false;
        /* Remove the x1.5 bonus only if we added it */
        if (window._scoreMultiplier && window._scoreMultiplier >= LOOT_MULTIPLIER) {
          window._scoreMultiplier = window._scoreMultiplier / LOOT_MULTIPLIER;
        }
        _toast('Radio bonus expired.', '#888', 2);
      }
    }
  }

  /* reset() — full teardown between stages / restarts */
  function reset() {
    var sc = _getScene();
    if (sc && _commander) sc.remove(_commander);
    _commander = null;
    _alive     = false;
    _hp        = 0;
    _phase     = 1;
    _spawnedWave       = 0;
    _shootTimer        = 0;
    _calloutTimer      = 0;
    _rallyTimer        = 0;
    _deathMsgTimer     = 0;
    _lootTimer         = 0;
    _lootActive        = false;
    _demoralized       = false;
    _demoralizeTimer   = 0;
    _reinfsSpawned     = false;

    window._commanderAlive    = false;
    window._enemyMoraleDebuff = 1.0;

    if (_lootActive && window._scoreMultiplier) {
      window._scoreMultiplier = window._scoreMultiplier / LOOT_MULTIPLIER;
    }

    _updateHealthBar();
    _hideDeathMessage();

    /* Remove commander entry from global enemy list */
    if (window._enemyList) {
      for (var i = window._enemyList.length - 1; i >= 0; i--) {
        if (window._enemyList[i] && window._enemyList[i]._isCommander) {
          window._enemyList.splice(i, 1);
        }
      }
    }

    console.log('[PatrolCommander] Reset');
  }

  /* ── Return public interface ─────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    spawn:  spawn,
    reset:  reset
  };

}());
