/* ════════════════════════════════════════════════════════════════════
 *  ENEMY COMMANDER — special buff-aura unit that rallies nearby troops
 *  ─────────────────────────────────────────────────────────────────
 *  Starting wave 3, 40% chance a COMMANDER spawns each wave.
 *  The commander buffs all enemies within 12 units:
 *    +25% move speed, +20% fire rate, -30% incoming damage.
 *  On death: 3-second morale penalty to survivors, "COMMANDER ELIMINATED" banner.
 *
 *  Public API:
 *    EnemyCommander.init(scene)           — call once after scene exists
 *    EnemyCommander.update(delta)         — per-frame (called from game loop)
 *    EnemyCommander.spawnCommander(scene, position) — manually spawn
 *    EnemyCommander.reset()              — clear state between stages/waves
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyCommander = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene = null;
  var _commander = null;       // the active commander enemy object (or null)
  var _auraMesh = null;        // green ring on ground
  var _hudEl = null;           // HUD indicator element
  var _bannerEl = null;        // "COMMANDER ELIMINATED" banner element
  var _bannerTimer = 0;        // countdown to hide banner
  var _moraleTimer = 0;        // countdown for post-death morale penalty
  var _rallyTimer = 0;         // hand-wave / rally animation timer
  var _rallyPhase = 0;         // oscillation phase for rally animation
  var _initialized = false;

  /* ── constants ──────────────────────────────────────────────────── */
  var BUFF_RADIUS         = 12;    // units
  var SPEED_BUFF          = 0.25;  // +25%
  var FIRERATE_BUFF       = 0.20;  // +20%
  var DAMAGE_RESIST       = 0.30;  // -30% incoming damage
  var COMMANDER_SCORE     = 750;   // bonus score
  var BANNER_DURATION     = 3.0;   // seconds
  var MORALE_PENALTY_DUR  = 3.0;   // seconds
  var MORALE_SPEED_DEBUFF = 0.20;  // -20% speed during morale penalty
  var COWARD_DIST_MIN     = 8;     // minimum distance commander keeps from player
  var COWARD_DIST_MAX     = 12;    // preferred distance

  /* ── geometry caches (lazily created) ──────────────────────────── */
  var _hatGeo     = null;
  var _hatMat     = null;
  var _batonGeo   = null;
  var _batonMat   = null;
  var _starGeo    = null;
  var _starMat    = null;
  var _auraGeo    = null;
  var _auraMat    = null;
  var _nameLabelCanvas = null;

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene) {
    _scene = scene;
    _commander = null;
    _auraMesh  = null;
    _moraleTimer = 0;
    _rallyTimer  = 0;
    _initialized = true;
    _ensureHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     HUD / BANNER HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _ensureHUD() {
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'hud-commander-indicator';
      _hudEl.style.cssText = [
        'position:fixed',
        'top:14px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:8500',
        'font-family:monospace',
        'font-size:13px',
        'color:#ff8800',
        'background:rgba(0,0,0,0.6)',
        'padding:4px 14px',
        'border:1px solid #ff8800',
        'border-radius:4px',
        'letter-spacing:1px',
        'display:none',
        'pointer-events:none',
      ].join(';');
      _hudEl.textContent = '⚔ COMMANDER ACTIVE — TROOPS BUFFED';
      document.body.appendChild(_hudEl);
    }
    if (!_bannerEl) {
      _bannerEl = document.createElement('div');
      _bannerEl.id = 'hud-commander-banner';
      _bannerEl.style.cssText = [
        'position:fixed',
        'top:22%',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:8600',
        'font-family:monospace',
        'font-size:22px',
        'font-weight:bold',
        'color:#ffd700',
        'text-shadow:0 0 12px #ffd700,0 2px 4px #000',
        'background:rgba(0,0,0,0.7)',
        'padding:10px 28px',
        'border:2px solid #ffd700',
        'border-radius:6px',
        'letter-spacing:2px',
        'display:none',
        'pointer-events:none',
      ].join(';');
      _bannerEl.textContent = '✔ COMMANDER ELIMINATED';
      document.body.appendChild(_bannerEl);
    }
  }

  function _showCommanderHUD(visible) {
    _ensureHUD();
    if (_hudEl) _hudEl.style.display = visible ? 'block' : 'none';
  }

  function _showEliminatedBanner() {
    _ensureHUD();
    if (_bannerEl) {
      _bannerEl.style.display = 'block';
      _bannerTimer = BANNER_DURATION;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     VISUAL BUILDER — hat, baton, stars, name label
  ════════════════════════════════════════════════════════════════ */
  function _buildCommanderExtras(mesh) {
    /* officer's hat on top of head */
    if (!_hatGeo) _hatGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8);
    if (!_hatMat) _hatMat = new THREE.MeshLambertMaterial({ color: 0x3b4a2f });
    var hat = new THREE.Mesh(_hatGeo, _hatMat);
    hat.position.set(0, 1.85, 0);
    mesh.add(hat);

    /* swagger stick / baton in right hand */
    if (!_batonGeo) _batonGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
    if (!_batonMat) _batonMat = new THREE.MeshLambertMaterial({ color: 0x3b1f0a });
    var baton = new THREE.Mesh(_batonGeo, _batonMat);
    baton.position.set(0.45, 0.7, 0.1);
    baton.rotation.z = Math.PI / 4;
    mesh.add(baton);
    mesh._commanderBaton = baton;

    /* rank insignia — two gold stars on chest */
    if (!_starGeo) _starGeo = new THREE.SphereGeometry(0.04, 5, 4);
    if (!_starMat) _starMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    var star1 = new THREE.Mesh(_starGeo, _starMat);
    var star2 = new THREE.Mesh(_starGeo, _starMat);
    star1.position.set(-0.12, 0.9, 0.32);
    star2.position.set(0.12, 0.9, 0.32);
    mesh.add(star1);
    mesh.add(star2);

    /* floating name label — canvas sprite */
    var canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 40;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 192, 40);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, 192, 40);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    /* alternate label — Ukrainian for "Colonel" */
    ctx.fillText('ПОЛКОВНИК', 96, 20);
    var tex = new THREE.CanvasTexture(canvas);
    var spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.0, 0.45, 1);
    sprite.position.set(0, 2.6, 0);
    mesh.add(sprite);
  }

  /* ════════════════════════════════════════════════════════════════
     AURA MESH — pulsing green ring on ground
  ════════════════════════════════════════════════════════════════ */
  function _buildAura(position) {
    if (!_auraGeo) _auraGeo = new THREE.RingGeometry(10, 12, 32);
    if (!_auraMat) _auraMat = new THREE.MeshBasicMaterial({
      color: 0x00ff44,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    var mesh = new THREE.Mesh(_auraGeo, _auraMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, position.y + 0.05, position.z);
    if (_scene) _scene.add(mesh);
    return mesh;
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN COMMANDER
  ════════════════════════════════════════════════════════════════ */
  function spawnCommander(scene, position) {
    if (_scene && scene) _scene = scene;
    else if (scene) _scene = scene;

    /* Try to pick an existing enemy and promote it */
    var allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var candidate = null;
    /* prefer a non-boss, non-special enemy near the back */
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (e._isCommander) continue;
      if (e.typeName === 'BOSS' || e.typeName === 'BOSS_HOSTOMEL' ||
          e.typeName === 'BOSS_AVDIIVKA' || e.typeName === 'BOSS_BAKHMUT') continue;
      if (!candidate) candidate = e;
      /* prefer later entries (typically newer spawns, further back) */
      if (i > allEnemies.indexOf(candidate)) candidate = e;
    }

    if (candidate && candidate.mesh) {
      /* Promote existing enemy to commander */
      candidate._isCommander     = true;
      candidate._commanderBuffed = false;
      candidate.scoreValue       = (candidate.scoreValue || 100) + COMMANDER_SCORE;
      candidate._commanderBaseSpeed = candidate.speed;

      /* Scale mesh up 1.3x */
      candidate.mesh.scale.multiplyScalar(1.3);

      /* Attach visual extras */
      _buildCommanderExtras(candidate.mesh);

      _commander = candidate;
    } else {
      /* Fallback: spawn via Enemies.spawnSingle if available */
      var spawnPos = position || { x: 0, z: 20 };
      var newIdx = null;
      if (window.Enemies && window.Enemies.spawnSingle) {
        var spawned = window.Enemies.spawnSingle('CONSCRIPT', spawnPos);
        if (spawned) {
          spawned._isCommander     = true;
          spawned._commanderBuffed = false;
          spawned.scoreValue       = (spawned.scoreValue || 100) + COMMANDER_SCORE;
          spawned._commanderBaseSpeed = spawned.speed;
          if (spawned.mesh) {
            spawned.mesh.scale.multiplyScalar(1.3);
            _buildCommanderExtras(spawned.mesh);
          }
          _commander = spawned;
        }
      }
    }

    if (_commander && _commander.mesh) {
      /* Build ground aura */
      if (_auraMesh && _scene) _scene.remove(_auraMesh);
      _auraMesh = _buildAura(_commander.mesh.position);
    }

    /* Announce */
    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('⚔ COMMANDER SPOTTED — TROOPS BEING RALLIED', '#ff8800');
    }

    _showCommanderHUD(true);
    window._commanderActive = true;
  }

  /* ════════════════════════════════════════════════════════════════
     BUFF APPLICATION — called each frame when commander alive
  ════════════════════════════════════════════════════════════════ */
  function _applyBuffs() {
    if (!_commander || !_commander.alive || !_commander.mesh) return;
    var cx = _commander.mesh.position.x;
    var cz = _commander.mesh.position.z;
    var allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (e._isCommander) continue;
      var dx = e.mesh.position.x - cx;
      var dz = e.mesh.position.z - cz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= BUFF_RADIUS) {
        if (!e._commanderBuffed) {
          /* Apply speed buff */
          e._preCommanderSpeed      = e._preCommanderSpeed || e.speed;
          e._preCommanderAttackRate = e._preCommanderAttackRate || e.attackRate;
          e.speed       = e._preCommanderSpeed * (1 + SPEED_BUFF);
          e.attackRate  = e._preCommanderAttackRate * (1 - FIRERATE_BUFF);
          e._commanderBuffed = true;
        }
      } else {
        if (e._commanderBuffed) {
          _removeBuffFromEnemy(e);
        }
      }
    }
  }

  function _removeBuffFromEnemy(e) {
    if (!e) return;
    e._commanderBuffed = false;
    if (e._preCommanderSpeed      !== undefined) { e.speed      = e._preCommanderSpeed;      }
    if (e._preCommanderAttackRate !== undefined) { e.attackRate = e._preCommanderAttackRate; }
    delete e._preCommanderSpeed;
    delete e._preCommanderAttackRate;
  }

  function _removeAllBuffs() {
    var allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || e._isCommander) continue;
      _removeBuffFromEnemy(e);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     MORALE PENALTY — applied when commander dies
  ════════════════════════════════════════════════════════════════ */
  function _applyMoralePenalty() {
    var allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e.alive) continue;
      if (!e._moraleBaseSpeed) e._moraleBaseSpeed = e.speed;
      e.speed = e._moraleBaseSpeed * (1 - MORALE_SPEED_DEBUFF);
      e._moralePenalty = true;
    }
  }

  function _removeMoralePenalty() {
    var allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e._moralePenalty) continue;
      if (e._moraleBaseSpeed !== undefined) e.speed = e._moraleBaseSpeed;
      delete e._moraleBaseSpeed;
      delete e._moralePenalty;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     COWARDLY RETREAT — commander stays 8-12 units behind front line
  ════════════════════════════════════════════════════════════════ */
  function _updateCommanderMovement(delta) {
    if (!_commander || !_commander.alive || !_commander.mesh) return;
    var player = (window.GameManager && window.GameManager.getPlayer)
      ? window.GameManager.getPlayer() : null;
    if (!player || !player.position) return;

    var px = player.position.x;
    var pz = player.position.z;
    var cx = _commander.mesh.position.x;
    var cz = _commander.mesh.position.z;
    var dx = cx - px;
    var dz = cz - pz;
    var dist = Math.sqrt(dx * dx + dz * dz);

    /* If too close to player, back away */
    if (dist < COWARD_DIST_MIN) {
      var awayX = dx / (dist || 1);
      var awayZ = dz / (dist || 1);
      var spd = (_commander._commanderBaseSpeed || 2) * 0.7;
      _commander.mesh.position.x += awayX * spd * delta;
      _commander.mesh.position.z += awayZ * spd * delta;
    }
    /* If much further than max, nudge slightly closer (follow troops) */
    else if (dist > COWARD_DIST_MAX + 6) {
      var toX = -dx / (dist || 1);
      var toZ = -dz / (dist || 1);
      var fwdSpd = (_commander._commanderBaseSpeed || 2) * 0.4;
      _commander.mesh.position.x += toX * fwdSpd * delta;
      _commander.mesh.position.z += toZ * fwdSpd * delta;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     RALLY ANIMATION — occasional hand-wave
  ════════════════════════════════════════════════════════════════ */
  function _updateRallyAnimation(delta) {
    if (!_commander || !_commander.alive || !_commander.mesh) return;
    _rallyTimer -= delta;
    if (_rallyTimer <= 0) {
      _rallyTimer = 3 + Math.random() * 4; /* wave every 3-7 seconds */
      _rallyPhase = 0;
    }
    _rallyPhase += delta * 6;
    /* oscillate baton if present */
    var baton = _commander.mesh._commanderBaton;
    if (baton && _rallyPhase < Math.PI * 2) {
      baton.rotation.z = Math.PI / 4 + Math.sin(_rallyPhase) * 0.6;
    } else if (baton) {
      baton.rotation.z = Math.PI / 4;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE — per-frame
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    /* Banner fade */
    if (_bannerTimer > 0) {
      _bannerTimer -= delta;
      if (_bannerTimer <= 0) {
        _bannerTimer = 0;
        if (_bannerEl) _bannerEl.style.display = 'none';
      }
    }

    /* Morale penalty countdown */
    if (_moraleTimer > 0) {
      _moraleTimer -= delta;
      if (_moraleTimer <= 0) {
        _moraleTimer = 0;
        _removeMoralePenalty();
      }
    }

    if (!_commander) return;

    /* Check if commander just died */
    if (_commander && !_commander.alive) {
      _onCommanderDeath();
      return;
    }

    /* Movement */
    _updateCommanderMovement(delta);

    /* Rally animation */
    _updateRallyAnimation(delta);

    /* Apply buffs to nearby enemies */
    _applyBuffs();

    /* Update aura position and pulse */
    if (_auraMesh && _commander.mesh) {
      _auraMesh.position.x = _commander.mesh.position.x;
      _auraMesh.position.z = _commander.mesh.position.z;
      _auraMesh.rotation.z += delta * 0.5; /* slow rotation */
      var opacity = 0.1 + 0.1 * Math.sin(Date.now() * 0.002);
      if (_auraMesh.material) _auraMesh.material.opacity = opacity;
    }

    /* Keep window flag in sync */
    window._commanderActive = true;
  }

  /* ════════════════════════════════════════════════════════════════
     ON COMMANDER DEATH
  ════════════════════════════════════════════════════════════════ */
  function _onCommanderDeath() {
    /* Remove buffs */
    _removeAllBuffs();

    /* Award bonus score */
    var player = (window.GameManager && window.GameManager.getPlayer)
      ? window.GameManager.getPlayer() : null;
    if (player) {
      player.score = (player.score || 0) + COMMANDER_SCORE;
      if (window.HUD && HUD.setScore) HUD.setScore(player.score);
    }

    /* Morale penalty for remaining enemies */
    _applyMoralePenalty();
    _moraleTimer = MORALE_PENALTY_DUR;

    /* Hide aura */
    if (_auraMesh && _scene) {
      _scene.remove(_auraMesh);
      _auraMesh = null;
    }

    /* HUD updates */
    _showCommanderHUD(false);
    _showEliminatedBanner();

    /* Notify via HUD notify system */
    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('✔ COMMANDER ELIMINATED +' + COMMANDER_SCORE, '#ffd700');
    }

    window._commanderActive = false;
    _commander = null;
  }

  /* ════════════════════════════════════════════════════════════════
     WAVE HOOK — called by wave start logic (wave >= 3, 40% chance)
  ════════════════════════════════════════════════════════════════ */
  function onWaveStart(waveNum, scene) {
    if (scene) _scene = scene;
    /* Reset previous commander state */
    _clearCommander();

    if (waveNum < 3) return;
    if (Math.random() > 0.40) return;

    /* Slight delay so enemies have spawned */
    setTimeout(function () {
      if (window.Enemies && window.Enemies.getAll && window.Enemies.getAll().length > 0) {
        spawnCommander(_scene, null);
      }
    }, 1200);
  }

  /* ════════════════════════════════════════════════════════════════
     DAMAGE RESISTANCE HOOK
     External code (enemies.js damage fn) should call this before
     applying damage: EnemyCommander.modifyIncomingDamage(enemy, amount)
     Returns adjusted damage amount.
  ════════════════════════════════════════════════════════════════ */
  function modifyIncomingDamage(enemy, amount) {
    if (!enemy) return amount;
    if (enemy._commanderBuffed) {
      return amount * (1 - DAMAGE_RESIST);
    }
    return amount;
  }

  /* ════════════════════════════════════════════════════════════════
     RESET / CLEAR
  ════════════════════════════════════════════════════════════════ */
  function _clearCommander() {
    if (_commander) {
      /* clean up any leftover buff state */
      _removeAllBuffs();
      if (_commander.mesh) {
        /* undo scale — crude but prevents double-scale on re-use */
        _commander.mesh.scale.divideScalar(1.3);
      }
    }
    _commander = null;
    if (_auraMesh && _scene) {
      _scene.remove(_auraMesh);
    }
    _auraMesh = null;
    _showCommanderHUD(false);
    window._commanderActive = false;
    _moraleTimer = 0;
    _rallyTimer  = 0;
    _rallyPhase  = 0;
  }

  function reset() {
    _clearCommander();
    _removeMoralePenalty();
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:                init,
    update:              update,
    spawnCommander:      spawnCommander,
    reset:               reset,
    onWaveStart:         onWaveStart,
    modifyIncomingDamage: modifyIncomingDamage,
  };
})();
