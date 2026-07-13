/**
 * knife-kill.js — Stealth melee finisher system
 * Key X: instant stealth kill from behind, or 3-stab front finisher
 * Always available as secondary (window._knifeEquipped = true)
 */
window.KnifeKill = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  var _cooldown = 0;
  var _cooldownMax = 0.8;
  var _range = 2.0;

  // Stab animation
  var _stabPhase = 0;        // 0 = idle, 1..3 = stab index in progress
  var _stabTimer = 0;        // time within current stab phase
  var _stabDuration = 0.1;   // forward thrust time (s)
  var _stabReturn = 0.05;    // return time (s)
  var _stabGap = 0.15;       // time between stabs (stab + return)
  var _totalStabs = 3;
  var _stabDmg = 45;
  var _stabTarget = null;    // enemy being front-finishered

  // Camera lerp state for stab
  var _camOffset = 0;        // current forward offset applied to knife group
  var _camOffsetTarget = 0;

  // Knife mesh group
  var _knifeGroup = null;
  var _bladeMesh = null;
  var _handleMesh = null;

  // Red vignette flash
  var _vignetteEl = null;
  var _vignetteTimer = 0;
  var _vignetteDuration = 0.2;

  // Stealth kill text
  var _stealthTextEl = null;
  var _stealthTextTimer = 0;
  var _stealthTextDuration = 1.8;

  // Melee range prompt
  var _rangePromptEl = null;
  var _rangePromptVisible = false;

  // Kill streak
  window._meleeKillStreak = window._meleeKillStreak || 0;

  // Always equipped
  window._knifeEquipped = true;

  // Key state
  var _xKeyDown = false;
  var _boundKeyDown = null;
  var _boundKeyUp = null;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;

    _buildKnifeMesh();
    _buildVignette();
    _buildStealthText();
    _buildRangePrompt();
    _bindKeys();

    window._knifeEquipped = true;
  }

  // ── Knife mesh ─────────────────────────────────────────────────────────────
  function _buildKnifeMesh() {
    if (!_camera) return;

    _knifeGroup = new THREE.Group();

    // Blade: silver, vertical orientation (tall thin box)
    var bladeGeo = new THREE.BoxGeometry(0.04, 0.3, 0.015);
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    _bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    _bladeMesh.position.set(0, 0.15, 0); // blade above handle center

    // Handle: brown, shorter and thicker
    var handleGeo = new THREE.BoxGeometry(0.05, 0.12, 0.03);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
    _handleMesh = new THREE.Mesh(handleGeo, handleMat);
    _handleMesh.position.set(0, -0.06, 0); // handle below blade

    _knifeGroup.add(_bladeMesh);
    _knifeGroup.add(_handleMesh);

    // Right side, low — resting at player hand position
    _knifeGroup.position.set(0.22, -0.22, -0.35);
    _knifeGroup.rotation.x = 0.5; // slight forward tilt
    _knifeGroup.rotation.z = -0.15; // slight outward angle

    _camera.add(_knifeGroup);
  }

  // ── DOM overlays ───────────────────────────────────────────────────────────
  function _buildVignette() {
    if (typeof document === 'undefined') return;
    _vignetteEl = document.getElementById('kk-vignette');
    if (!_vignetteEl) {
      _vignetteEl = document.createElement('div');
      _vignetteEl.id = 'kk-vignette';
      _vignetteEl.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:9100',
        'background:radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0) 100%)',
        'transition:none'
      ].join(';');
      document.body.appendChild(_vignetteEl);
    }
  }

  function _buildStealthText() {
    if (typeof document === 'undefined') return;
    _stealthTextEl = document.getElementById('kk-stealth-text');
    if (!_stealthTextEl) {
      _stealthTextEl = document.createElement('div');
      _stealthTextEl.id = 'kk-stealth-text';
      _stealthTextEl.style.cssText = [
        'position:fixed',
        'top:38%',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#00ff44',
        'font-family:monospace',
        'font-size:28px',
        'font-weight:bold',
        'letter-spacing:0.18em',
        'text-shadow:0 0 12px #00ff44,0 0 24px #00cc33',
        'pointer-events:none',
        'z-index:9200',
        'display:none',
        'white-space:nowrap'
      ].join(';');
      _stealthTextEl.textContent = 'STEALTH KILL';
      document.body.appendChild(_stealthTextEl);
    }
  }

  function _buildRangePrompt() {
    if (typeof document === 'undefined') return;
    _rangePromptEl = document.getElementById('kk-range-prompt');
    if (!_rangePromptEl) {
      _rangePromptEl = document.createElement('div');
      _rangePromptEl.id = 'kk-range-prompt';
      _rangePromptEl.style.cssText = [
        'position:fixed',
        'bottom:140px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#ffdd55',
        'font-family:monospace',
        'font-size:13px',
        'background:rgba(0,0,0,0.55)',
        'padding:3px 10px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:8900',
        'display:none',
        'letter-spacing:0.1em'
      ].join(';');
      _rangePromptEl.textContent = '[X] MELEE RANGE';
      document.body.appendChild(_rangePromptEl);
    }
  }

  // ── Key bindings ───────────────────────────────────────────────────────────
  function _bindKeys() {
    if (typeof document === 'undefined') return;

    _boundKeyDown = function (e) {
      if (e.code === 'KeyX' || e.key === 'x' || e.key === 'X') {
        if (!_xKeyDown) {
          _xKeyDown = true;
          attempt();
        }
      }
    };

    _boundKeyUp = function (e) {
      if (e.code === 'KeyX' || e.key === 'x' || e.key === 'X') {
        _xKeyDown = false;
      }
    };

    document.addEventListener('keydown', _boundKeyDown);
    document.addEventListener('keyup', _boundKeyUp);
  }

  // ── Attempt ────────────────────────────────────────────────────────────────
  function attempt() {
    if (_cooldown > 0) return;
    if (!_camera) return;

    var enemies = _getEnemies();
    if (!enemies || !enemies.length) return;

    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    var forward = new THREE.Vector3();
    _camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    var closest = null;
    var closestDist = Infinity;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;

      var ePos = e.mesh ? e.mesh.position : e.position;
      if (!ePos) continue;

      var dx = ePos.x - playerPos.x;
      var dz = ePos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < _range && dist < closestDist) {
        closestDist = dist;
        closest = e;
      }
    }

    if (!closest) return;

    _cooldown = _cooldownMax;

    var ePos2 = closest.mesh ? closest.mesh.position : closest.position;
    var dx2 = ePos2.x - playerPos.x;
    var dz2 = ePos2.z - playerPos.z;
    var toEnemy = new THREE.Vector3(dx2, 0, dz2).normalize();

    // Determine if enemy is alerted / has spotted player
    var isAlerted = (closest.playerSpotted === true) ||
                    (closest._alertedTimer !== undefined && closest._alertedTimer > 0);

    // Behind check: player's forward should point roughly same direction as enemy's
    // facing (enemy faces away = enemy forward dot our forward is positive)
    // We use: dot of player-forward and toEnemy; if player is behind enemy,
    // toEnemy (from player to enemy) should be roughly same as player forward,
    // AND enemy's own forward (mesh.rotation.y-based) opposes toEnemy.
    // Simplified: enemy is behind relative to player means player came from behind.
    // We check: the enemy-to-player vector dotted with the enemy mesh facing direction.
    // Since we don't have enemy facing reliably, we use: toEnemy.dot(forward) > 0.5
    // (player is facing enemy's back = player forward roughly same as to-enemy)
    // AND enemy is looking away (use mesh rotation if available).
    var isBehind = false;
    if (toEnemy.dot(forward) > 0.6) {
      // Player is looking at enemy and enemy is somewhat in front
      // Now check if enemy is facing away using mesh rotation
      if (closest.mesh) {
        var enemyFacingX = Math.sin(closest.mesh.rotation.y);
        var enemyFacingZ = Math.cos(closest.mesh.rotation.y);
        var enemyForward = new THREE.Vector3(enemyFacingX, 0, enemyFacingZ);
        // If enemy facing same direction as toEnemy, enemy is facing away = stealth
        var behindDot = enemyForward.dot(toEnemy);
        isBehind = (behindDot > 0.3);
      } else {
        isBehind = true;
      }
    }

    if (!isAlerted && isBehind) {
      _doStealthKill(closest, ePos2);
    } else {
      _startFrontFinisher(closest);
    }
  }

  // ── Stealth kill ───────────────────────────────────────────────────────────
  function _doStealthKill(enemy, ePos) {
    // Instant kill — no alert propagation
    enemy.silentKill = true;
    _applyDamage(enemy, 9999, true);

    // +500 score bonus
    _addScore(500);

    // Melee kill streak
    window._meleeKillStreak = (window._meleeKillStreak || 0) + 1;

    // Audio: single quiet wet slash
    _playSlashSound(0.3);

    // Stab-forward visual (single quick thrust)
    _camOffsetTarget = 0.2;
    _stabTimer = _stabDuration;
    _stabPhase = -1; // single thrust, not multi-stab loop

    // Stealth text flash
    _showStealthText();

    // Mild red vignette
    _triggerVignette();
  }

  // ── Front finisher (3 stabs) ───────────────────────────────────────────────
  function _startFrontFinisher(enemy) {
    _stabPhase = 1;
    _stabTimer = 0;
    _stabTarget = enemy;
    _camOffsetTarget = 0;
    // Melee range prompt hides during attack
    _hideRangePrompt();
  }

  function _tickFrontFinisher(dt) {
    if (_stabPhase <= 0 || _stabPhase > _totalStabs) return;

    _stabTimer += dt;

    var phaseTime = _stabDuration + _stabReturn;

    if (_stabTimer < _stabDuration) {
      // Thrusting forward
      _camOffsetTarget = 0.2;
    } else if (_stabTimer < phaseTime) {
      // Returning
      _camOffsetTarget = 0;
    } else {
      // Stab complete — deal damage
      if (_stabTarget && _stabTarget.alive) {
        _applyDamage(_stabTarget, _stabDmg, false);
        _playSlashSound(0.5);
        _triggerVignette();
      }

      _stabTimer = 0;
      _stabPhase++;

      if (_stabPhase > _totalStabs) {
        // All stabs done
        _camOffsetTarget = 0;
        _stabTarget = null;

        // Count kill streak (if enemy died from stabs)
        window._meleeKillStreak = (window._meleeKillStreak || 0) + 1;
      }
    }
  }

  // ── Damage application ─────────────────────────────────────────────────────
  function _applyDamage(enemy, dmg, silent) {
    if (!enemy || !enemy.alive) return;

    if (silent) {
      enemy.silentKill = true;
    }

    // Try game-manager's hit callback pattern
    if (window.GameManager && window.GameManager.onEnemyHit) {
      window.GameManager.onEnemyHit(enemy, dmg);
    } else {
      // Direct HP reduction fallback
      enemy.hp = (enemy.hp || 0) - dmg;
      if (enemy.hp <= 0 && enemy.alive) {
        enemy.alive = false;
        if (window.GameManager && window.GameManager.killEnemy) {
          window.GameManager.killEnemy(enemy);
        }
      }
    }
  }

  // ── Score ──────────────────────────────────────────────────────────────────
  function _addScore(amount) {
    // Primary path: player object inside GameManager
    if (window.GameManager && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl) { pl.score = (pl.score || 0) + amount; }
    }
    // Secondary fallback
    if (typeof window._score !== 'undefined') {
      window._score += amount;
    }
  }

  // ── Enemy helpers ──────────────────────────────────────────────────────────
  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll) return window.Enemies.getAll();
    if (window._enemies) return window._enemies;
    if (window.GameManager && window.GameManager.getEnemies) return window.GameManager.getEnemies();
    return null;
  }

  function _getPlayerPos() {
    if (window.GameManager && window.GameManager.getPlayerPosition) {
      return window.GameManager.getPlayerPosition();
    }
    if (window.GameManager && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl && pl.position) return pl.position;
    }
    if (_camera) return _camera.position;
    return null;
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _playSlashSound(volume) {
    var ctx = window._audioCtx;
    if (!ctx) return;

    try {
      // Short white noise burst shaped around 2kHz with rapid decay — wet slash
      var sr = ctx.sampleRate;
      var len = Math.floor(sr * 0.08);
      var buffer = ctx.createBuffer(1, len, sr);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
      }

      var source = ctx.createBufferSource();
      source.buffer = buffer;

      // Band-pass centred at 2kHz for that fleshy slash timbre
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2000;
      bp.Q.value = 1.8;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(volume || 0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      source.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch (e) {
      // audio unavailable
    }
  }

  // ── Visual feedback ────────────────────────────────────────────────────────
  function _showStealthText() {
    if (!_stealthTextEl) return;
    _stealthTextEl.style.display = 'block';
    _stealthTextEl.style.opacity = '1';
    _stealthTextTimer = _stealthTextDuration;
  }

  function _triggerVignette() {
    _vignetteTimer = _vignetteDuration;
  }

  function _showRangePrompt() {
    if (!_rangePromptEl || _rangePromptVisible) return;
    _rangePromptEl.style.display = 'block';
    _rangePromptVisible = true;
  }

  function _hideRangePrompt() {
    if (!_rangePromptEl || !_rangePromptVisible) return;
    _rangePromptEl.style.display = 'none';
    _rangePromptVisible = false;
  }

  // ── Range check for prompt ─────────────────────────────────────────────────
  function _checkRangePrompt() {
    var playerPos = _getPlayerPos();
    if (!playerPos) { _hideRangePrompt(); return; }

    var enemies = _getEnemies();
    if (!enemies || !enemies.length) { _hideRangePrompt(); return; }

    var anyInRange = false;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;
      var ePos = e.mesh ? e.mesh.position : e.position;
      if (!ePos) continue;
      var dx = ePos.x - playerPos.x;
      var dz = ePos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= _range) { anyInRange = true; break; }
    }

    if (anyInRange && _cooldown <= 0) {
      _showRangePrompt();
    } else {
      _hideRangePrompt();
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!dt) dt = 0.016;

    // Cooldown
    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown < 0) _cooldown = 0;
    }

    // Front finisher tick
    if (_stabPhase >= 1 && _stabPhase <= _totalStabs) {
      _tickFrontFinisher(dt);
    }

    // Single-thrust (stealth) return
    if (_stabPhase === -1) {
      _stabTimer -= dt;
      if (_stabTimer <= 0) {
        _stabPhase = 0;
        _camOffsetTarget = 0;
      }
    }

    // Knife group camera-space lerp (thrust animation)
    if (_knifeGroup) {
      var lerpSpeed = 18;
      _camOffset += (_camOffsetTarget - _camOffset) * Math.min(lerpSpeed * dt, 1);
      _knifeGroup.position.set(0.22, -0.22, -0.35 - _camOffset);
    }

    // Vignette
    if (_vignetteTimer > 0) {
      _vignetteTimer -= dt;
      if (_vignetteTimer < 0) _vignetteTimer = 0;
      var vigAlpha = _vignetteTimer / _vignetteDuration;
      if (_vignetteEl) {
        _vignetteEl.style.background = 'radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,' + (vigAlpha * 0.72) + ') 100%)';
      }
    }

    // Stealth text fade
    if (_stealthTextTimer > 0) {
      _stealthTextTimer -= dt;
      if (_stealthTextTimer < 0) _stealthTextTimer = 0;
      var fade = _stealthTextTimer / _stealthTextDuration;
      if (_stealthTextEl) {
        if (_stealthTextTimer <= 0) {
          _stealthTextEl.style.display = 'none';
        } else {
          _stealthTextEl.style.opacity = String(Math.min(1, fade * 3));
        }
      }
    }

    // Range prompt check (not too frequently — every frame is fine)
    _checkRangePrompt();
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    _cooldown = 0;
    _stabPhase = 0;
    _stabTimer = 0;
    _stabTarget = null;
    _camOffset = 0;
    _camOffsetTarget = 0;
    _vignetteTimer = 0;
    _stealthTextTimer = 0;

    window._meleeKillStreak = 0;

    if (_knifeGroup) {
      _knifeGroup.position.set(0.22, -0.22, -0.35);
    }
    if (_vignetteEl) {
      _vignetteEl.style.background = 'radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0) 100%)';
    }
    if (_stealthTextEl) {
      _stealthTextEl.style.display = 'none';
      _stealthTextEl.style.opacity = '1';
    }

    _hideRangePrompt();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    attempt: attempt,
    reset: reset
  };

})();
