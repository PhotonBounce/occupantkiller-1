/* ════════════════════════════════════════════════════════════════════
 *  ENEMY REINFORCEMENTS — enemies call for backup mid-wave
 *  ─────────────────────────────────────────────────────────────────
 *  Trigger conditions:
 *    1. >50% of wave enemies killed → 40% chance
 *    2. Player killstreak reaches 8  → always
 *    3. Every 90s during long waves  → chance
 *  Only one reinforcement group per wave.
 *
 *  Public API:
 *    EnemyReinforcements.init(scene)
 *    EnemyReinforcements.update(delta, waveNum, enemiesKilled, waveTotal)
 *    EnemyReinforcements.checkReinforcementTrigger(reason, waveNum)
 *    EnemyReinforcements.trySpawn(scene, waveNum)
 *    EnemyReinforcements.reset()
 *
 *  Window hooks:
 *    window._checkReinforcements(reason, waveNum) — called after each kill
 *    window._onReinforcementsSpawned              — callback after spawn
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyReinforcements = (function () {
  'use strict';

  /* ── internal state ──────────────────────────────────────────────── */
  var _scene              = null;
  var _triggeredThisWave  = false;   // only one group per wave
  var _countdownActive    = false;
  var _countdownTimer     = 0;
  var _countdownStep      = 5;       // seconds until arrival
  var _pendingWaveNum     = 1;
  var _longWaveTimer      = 0;       // accumulates seconds for trigger 3
  var _hudEl              = null;    // warning banner element
  var _countdownEl        = null;    // countdown element
  var _directionEl        = null;    // direction arrow element
  var _beamLights         = [];      // VFX beam PointLights with lifetime
  var _newArrivalLabels   = [];      // { sprite, timer } for "NEW ARRIVAL" labels

  /* ── constants ───────────────────────────────────────────────────── */
  var SPAWN_RADIUS        = 50;
  var COUNTDOWN_DURATION  = 5.0;
  var LONG_WAVE_INTERVAL  = 90;      // seconds between periodic checks
  var KILLSTREAK_TRIGGER  = 8;
  var MAJORITY_CHANCE     = 0.40;
  var LONG_WAVE_CHANCE    = 0.30;
  var BEAM_LIFETIME       = 2.0;     // seconds beam stays visible
  var LABEL_LIFETIME      = 2.0;     // seconds "NEW ARRIVAL" label shows

  /* ════════════════════════════════════════════════════════════════
     COMPASS DIRECTION HELPER
  ════════════════════════════════════════════════════════════════ */
  function _angleToCompass(angle) {
    // angle in radians (Math.atan2 style, Z is "north" at 0)
    var deg = (angle * 180 / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5)   return 'NORTH';
    if (deg < 67.5)                    return 'NORTH-EAST';
    if (deg < 112.5)                   return 'EAST';
    if (deg < 157.5)                   return 'SOUTH-EAST';
    if (deg < 202.5)                   return 'SOUTH';
    if (deg < 247.5)                   return 'SOUTH-WEST';
    if (deg < 292.5)                   return 'WEST';
    return 'NORTH-WEST';
  }

  function _angleToArrow(angle) {
    var deg = (angle * 180 / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5)   return '↑';
    if (deg < 67.5)                    return '↗';
    if (deg < 112.5)                   return '→';
    if (deg < 157.5)                   return '↘';
    if (deg < 202.5)                   return '↓';
    if (deg < 247.5)                   return '↙';
    if (deg < 292.5)                   return '←';
    return '↖';
  }

  /* ════════════════════════════════════════════════════════════════
     HUD ELEMENTS
  ════════════════════════════════════════════════════════════════ */
  function _ensureStyles() {
    if (document.getElementById('reinf-styles')) return;
    var style = document.createElement('style');
    style.id = 'reinf-styles';
    style.textContent = [
      '@keyframes reinfPulse {',
      '  0%,100% { opacity:1; text-shadow:0 0 12px rgba(255,40,40,0.9); }',
      '  50%     { opacity:0.5; text-shadow:0 0 4px rgba(255,40,40,0.3); }',
      '}',
      '#reinf-warning {',
      '  position:fixed;top:18%;left:50%;transform:translateX(-50%);',
      '  font-family:monospace;font-size:20px;font-weight:bold;',
      '  color:#ff2222;pointer-events:none;z-index:8500;',
      '  animation:reinfPulse 0.6s ease-in-out infinite;',
      '  text-align:center;',
      '}',
      '#reinf-countdown {',
      '  position:fixed;top:24%;left:50%;transform:translateX(-50%);',
      '  font-family:monospace;font-size:16px;font-weight:bold;',
      '  color:#ffaa00;pointer-events:none;z-index:8500;',
      '  text-align:center;',
      '}',
      '#reinf-direction {',
      '  position:fixed;top:29%;left:50%;transform:translateX(-50%);',
      '  font-family:monospace;font-size:13px;',
      '  color:#ff8888;pointer-events:none;z-index:8500;',
      '  text-align:center;',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function _showWarningHUD(compassDir, arrowChar) {
    _ensureStyles();

    // Warning banner
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'reinf-warning';
      document.body.appendChild(_hudEl);
    }
    _hudEl.textContent = '⚠ ENEMY REINFORCEMENTS INBOUND';
    _hudEl.style.display = 'block';

    // Countdown
    if (!_countdownEl) {
      _countdownEl = document.createElement('div');
      _countdownEl.id = 'reinf-countdown';
      document.body.appendChild(_countdownEl);
    }
    _countdownEl.textContent = 'REINFORCEMENTS IN 5...';
    _countdownEl.style.display = 'block';

    // Direction
    if (!_directionEl) {
      _directionEl = document.createElement('div');
      _directionEl.id = 'reinf-direction';
      document.body.appendChild(_directionEl);
    }
    _directionEl.textContent = 'REINFORCEMENTS FROM: ' + compassDir + '  ' + arrowChar;
    _directionEl.style.display = 'block';
  }

  function _updateCountdownHUD(secondsLeft) {
    if (!_countdownEl) return;
    var s = Math.ceil(secondsLeft);
    if (s <= 0) {
      _countdownEl.textContent = 'REINFORCEMENTS ARRIVING!';
    } else {
      var dots = '';
      for (var i = secondsLeft; i <= 5; i++) dots += '...';
      _countdownEl.textContent = 'REINFORCEMENTS IN ' + s + dots;
    }
  }

  function _hideWarningHUD() {
    if (_hudEl)       { _hudEl.style.display = 'none'; }
    if (_countdownEl) { _countdownEl.style.display = 'none'; }
    // Keep direction visible for a moment then fade
    if (_directionEl) {
      setTimeout(function () {
        if (_directionEl) _directionEl.style.display = 'none';
      }, 3000);
    }
  }

  function _showStrategyTip() {
    var msg = (window.RadioSupport || window.FO_system)
      ? 'TIP: Eliminate the radio operator to stop reinforcements'
      : 'Hold position — they\'re coming in force';

    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed;bottom:160px;left:50%;transform:translateX(-50%);',
      'font-family:monospace;font-size:12px;color:#ffcc55;',
      'background:rgba(0,0,0,0.65);padding:4px 12px;border-radius:4px;',
      'pointer-events:none;z-index:8400;',
      'opacity:1;transition:opacity 0.6s;',
    ].join('');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }, 4000);
  }

  /* ════════════════════════════════════════════════════════════════
     VFX — INSERTION BEAM
  ════════════════════════════════════════════════════════════════ */
  function _spawnInsertionBeam(x, z) {
    if (!_scene || typeof THREE === 'undefined') return;

    var light = new THREE.PointLight(0xaaddff, 3.0, 18);
    light.position.set(x, 5, z);
    _scene.add(light);

    // Visual column geometry (thin cylinder)
    var beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 14, 8);
    var beamMat = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.55,
    });
    var beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(x, 7, z);
    _scene.add(beamMesh);

    _beamLights.push({
      light:    light,
      mesh:     beamMesh,
      mat:      beamMat,
      timer:    BEAM_LIFETIME,
    });
  }

  /* ════════════════════════════════════════════════════════════════
     VFX — NEW ARRIVAL LABEL
  ════════════════════════════════════════════════════════════════ */
  function _spawnNewArrivalLabel(enemy) {
    if (!_scene || typeof THREE === 'undefined') return;
    if (!enemy || !enemy.mesh) return;

    var canvas = document.createElement('canvas');
    canvas.width  = 128;
    canvas.height = 32;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 32);
    ctx.fillStyle  = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle  = '#00ffff';
    ctx.font       = 'bold 12px monospace';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW ARRIVAL', 64, 16);

    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.0, 0.5, 1);

    // Position above enemy head
    var offset = new THREE.Object3D();
    offset.position.set(0, 2.8, 0);
    enemy.mesh.add(offset);
    offset.add(sprite);

    _newArrivalLabels.push({
      sprite:   sprite,
      mat:      mat,
      tex:      tex,
      parent:   offset,
      enemyMesh: enemy.mesh,
      timer:    LABEL_LIFETIME,
    });
  }

  /* ════════════════════════════════════════════════════════════════
     REINFORCEMENT COMPOSITION
  ════════════════════════════════════════════════════════════════ */
  function _getComposition(waveNum) {
    // Boss waves: multiples of 5 (wave 5, 10, 15…)
    if (waveNum > 0 && waveNum % 5 === 0) {
      return [
        { type: 'ELITE', count: 3 },
      ];
    }
    if (waveNum >= 7) {
      return [
        { type: 'CONSCRIPT', count: 2 },
        { type: 'ARMORED',   count: 1 },
        { type: 'SNIPER',    count: 1 },
      ];
    }
    if (waveNum >= 4) {
      return [
        { type: 'CONSCRIPT', count: 3 },
        { type: 'ARMORED',   count: 1 },
      ];
    }
    // Waves 1-3
    return [
      { type: 'CONSCRIPT', count: 2 },
    ];
  }

  /* ════════════════════════════════════════════════════════════════
     FALLBACK MESH — basic soldier group if Enemies.spawnSingle unavailable
  ════════════════════════════════════════════════════════════════ */
  function _buildFallbackSoldier(pos) {
    if (typeof THREE === 'undefined') return null;
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.35);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a5640 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x6b5b45 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.07;
    group.add(head);

    group.position.set(pos.x, 0, pos.z);
    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function trySpawn(scene, waveNum) {
    if (!scene) scene = _scene;
    if (!scene) return;
    waveNum = waveNum || 1;

    var angle  = Math.random() * Math.PI * 2;
    var spawnX = Math.cos(angle) * SPAWN_RADIUS;
    var spawnZ = Math.sin(angle) * SPAWN_RADIUS;

    var compass = _angleToCompass(angle);
    var arrow   = _angleToArrow(angle);

    // VFX beam at spawn point
    _spawnInsertionBeam(spawnX, spawnZ);

    var composition = _getComposition(waveNum);
    var spawnedEnemies = [];

    for (var c = 0; c < composition.length; c++) {
      var group = composition[c];
      for (var n = 0; n < group.count; n++) {
        var jitterX = (Math.random() - 0.5) * 6;
        var jitterZ = (Math.random() - 0.5) * 6;
        var pos = { x: spawnX + jitterX, z: spawnZ + jitterZ };

        var enemy = null;

        // Use Enemies.spawnSingle if available
        if (window.Enemies && typeof window.Enemies.spawnSingle === 'function') {
          try {
            enemy = window.Enemies.spawnSingle(group.type, pos);
          } catch (e) {
            enemy = null;
          }
        }

        // Fallback: build a minimal mesh and add to scene
        if (!enemy) {
          var mesh = _buildFallbackSoldier(pos);
          if (mesh) {
            scene.add(mesh);
            enemy = { mesh: mesh, _isFallback: true };
          }
        }

        if (enemy) {
          enemy._isReinforcement = true;   // score bonus flag for game-manager
          spawnedEnemies.push(enemy);
          // Attach "NEW ARRIVAL" label
          _spawnNewArrivalLabel(enemy);
        }
      }
    }

    // Strategy tip
    _showStrategyTip();

    // Callback hook
    if (typeof window._onReinforcementsSpawned === 'function') {
      window._onReinforcementsSpawned(spawnedEnemies);
    }

    return spawnedEnemies;
  }

  /* ════════════════════════════════════════════════════════════════
     TRIGGER CHECK
  ════════════════════════════════════════════════════════════════ */
  function checkReinforcementTrigger(reason, waveNum) {
    if (_triggeredThisWave)  return false;
    if (_countdownActive)    return false;

    var shouldTrigger = false;

    if (reason === 'majority' && Math.random() < MAJORITY_CHANCE) {
      shouldTrigger = true;
    } else if (reason === 'killstreak') {
      shouldTrigger = true;   // always
    } else if (reason === 'periodic' && Math.random() < LONG_WAVE_CHANCE) {
      shouldTrigger = true;
    }

    if (!shouldTrigger) return false;

    _triggeredThisWave = true;
    _pendingWaveNum    = waveNum || 1;
    _countdownActive   = true;
    _countdownTimer    = COUNTDOWN_DURATION;

    // Audio cue
    if (window.AudioSystem && typeof window.AudioSystem.playRadioChatter === 'function') {
      window.AudioSystem.playRadioChatter();
    }

    // Compute direction for HUD (random since we choose angle inside trySpawn,
    // but we pre-compute here for the warning display)
    var previewAngle   = Math.random() * Math.PI * 2;
    var previewCompass = _angleToCompass(previewAngle);
    var previewArrow   = _angleToArrow(previewAngle);
    // Store so spawn uses same direction — override trySpawn's internal angle:
    _pendingAngle      = previewAngle;

    _showWarningHUD(previewCompass, previewArrow);

    return true;
  }

  // Stored angle so countdown and spawn use the same direction
  var _pendingAngle = 0;

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene) {
    _scene = scene;
    reset();

    // Expose global hook for game-manager to call after each kill
    window._checkReinforcements = function (reason, waveNum) {
      return checkReinforcementTrigger(reason, waveNum);
    };

    // Default spawned callback — can be overridden externally
    if (!window._onReinforcementsSpawned) {
      window._onReinforcementsSpawned = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE (call every frame with delta seconds)
  ════════════════════════════════════════════════════════════════ */
  function update(delta, waveNum, enemiesKilled, waveTotal) {
    delta = delta || 0;

    // ── Long-wave periodic trigger ──────────────────────────────
    if (!_triggeredThisWave && !_countdownActive) {
      _longWaveTimer += delta;
      if (_longWaveTimer >= LONG_WAVE_INTERVAL) {
        _longWaveTimer = 0;
        checkReinforcementTrigger('periodic', waveNum);
      }
    }

    // ── Killstreak check ─────────────────────────────────────────
    if (!_triggeredThisWave && !_countdownActive) {
      var streak = (window.KillStreak && typeof window.KillStreak.getStreak === 'function')
        ? window.KillStreak.getStreak()
        : (window._currentKillStreak || 0);
      if (streak >= KILLSTREAK_TRIGGER) {
        checkReinforcementTrigger('killstreak', waveNum);
      }
    }

    // ── Majority-killed check ────────────────────────────────────
    if (!_triggeredThisWave && !_countdownActive) {
      if (waveTotal > 0 && enemiesKilled > 0 && enemiesKilled > waveTotal * 0.5) {
        checkReinforcementTrigger('majority', waveNum);
      }
    }

    // ── Countdown tick ───────────────────────────────────────────
    if (_countdownActive) {
      _countdownTimer -= delta;
      _updateCountdownHUD(_countdownTimer);

      if (_countdownTimer <= 0) {
        _countdownActive = false;
        _hideWarningHUD();
        // Spawn using pre-computed angle
        _spawnWithAngle(_scene, _pendingWaveNum, _pendingAngle);
      }
    }

    // ── Beam VFX lifetime ────────────────────────────────────────
    for (var b = _beamLights.length - 1; b >= 0; b--) {
      var beam = _beamLights[b];
      beam.timer -= delta;
      if (beam.timer <= 0) {
        if (_scene) {
          _scene.remove(beam.light);
          _scene.remove(beam.mesh);
        }
        beam.mat.dispose();
        _beamLights.splice(b, 1);
      } else {
        // Pulse opacity
        var fade = beam.timer / BEAM_LIFETIME;
        beam.mat.opacity = 0.55 * fade;
        beam.light.intensity = 3.0 * fade;
      }
    }

    // ── New-arrival label lifetime ───────────────────────────────
    for (var l = _newArrivalLabels.length - 1; l >= 0; l--) {
      var lbl = _newArrivalLabels[l];
      lbl.timer -= delta;
      if (lbl.timer <= 0) {
        if (lbl.enemyMesh && lbl.parent && lbl.parent.parent) {
          lbl.enemyMesh.remove(lbl.parent);
        }
        lbl.mat.dispose();
        lbl.tex.dispose();
        _newArrivalLabels.splice(l, 1);
      } else {
        // Fade out in last 0.5s
        var alpha = Math.min(1, lbl.timer / 0.5);
        lbl.mat.opacity = alpha;
      }
    }
  }

  /* Internal version of trySpawn that uses a pre-computed angle */
  function _spawnWithAngle(scene, waveNum, angle) {
    if (!scene) scene = _scene;
    if (!scene) return;
    waveNum = waveNum || 1;

    var spawnX = Math.cos(angle) * SPAWN_RADIUS;
    var spawnZ = Math.sin(angle) * SPAWN_RADIUS;

    var compass = _angleToCompass(angle);
    var arrow   = _angleToArrow(angle);

    _spawnInsertionBeam(spawnX, spawnZ);

    var composition = _getComposition(waveNum);
    var spawnedEnemies = [];

    for (var c = 0; c < composition.length; c++) {
      var group = composition[c];
      for (var n = 0; n < group.count; n++) {
        var jitterX = (Math.random() - 0.5) * 6;
        var jitterZ = (Math.random() - 0.5) * 6;
        var pos = { x: spawnX + jitterX, z: spawnZ + jitterZ };

        var enemy = null;

        if (window.Enemies && typeof window.Enemies.spawnSingle === 'function') {
          try {
            enemy = window.Enemies.spawnSingle(group.type, pos);
          } catch (e) {
            enemy = null;
          }
        }

        if (!enemy) {
          var mesh = _buildFallbackSoldier(pos);
          if (mesh) {
            scene.add(mesh);
            enemy = { mesh: mesh, _isFallback: true };
          }
        }

        if (enemy) {
          enemy._isReinforcement = true;
          spawnedEnemies.push(enemy);
          _spawnNewArrivalLabel(enemy);
        }
      }
    }

    _showStrategyTip();

    if (typeof window._onReinforcementsSpawned === 'function') {
      window._onReinforcementsSpawned(spawnedEnemies);
    }

    return spawnedEnemies;
  }

  /* ════════════════════════════════════════════════════════════════
     RESET  (call between waves)
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    _triggeredThisWave = false;
    _countdownActive   = false;
    _countdownTimer    = 0;
    _longWaveTimer     = 0;
    _pendingWaveNum    = 1;
    _pendingAngle      = 0;

    // Clean up beam lights
    for (var b = 0; b < _beamLights.length; b++) {
      var beam = _beamLights[b];
      if (_scene) {
        _scene.remove(beam.light);
        _scene.remove(beam.mesh);
      }
      beam.mat.dispose();
    }
    _beamLights.length = 0;

    // Clean up labels
    for (var l = 0; l < _newArrivalLabels.length; l++) {
      var lbl = _newArrivalLabels[l];
      if (lbl.enemyMesh && lbl.parent && lbl.parent.parent) {
        lbl.enemyMesh.remove(lbl.parent);
      }
      lbl.mat.dispose();
      lbl.tex.dispose();
    }
    _newArrivalLabels.length = 0;

    _hideWarningHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:                       init,
    update:                     update,
    checkReinforcementTrigger:  checkReinforcementTrigger,
    trySpawn:                   trySpawn,
    reset:                      reset,
  };

})();

if (typeof window !== 'undefined') window.EnemyReinforcements = window.EnemyReinforcements;
