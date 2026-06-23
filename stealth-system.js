// stealth-system.js — Full Stealth Mechanics Module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, THREE global
//
// Public API:
//   StealthSystem.init(scene, camera, options)
//   StealthSystem.update(dt)
//   StealthSystem.reset()
//   StealthSystem.addNoise(amount)          — external noise event
//   StealthSystem.onPlayerFired(weaponName) — call on every shot
//   StealthSystem.onPlayerMoved(mode)       — 'still'|'crouch'|'walk'|'run'
//   StealthSystem.onExplosionNearby()       — call when explosion heard near player
//   StealthSystem.registerEnemy(enemyObj)   — register an enemy for detection cones
//   StealthSystem.unregisterEnemy(enemyObj) — remove enemy
//   StealthSystem.getGhostScore()           — current ghost meter 0-1
//   StealthSystem.isGhosting()              — true if level is ghost-run so far

window.StealthSystem = (function () {
  'use strict';

  // ─────────────────────────────────────────────── CONSTANTS

  // Noise levels (0-100 scale mapped to 0-1 internally)
  var NOISE_WALK          = 10;   // % per event
  var NOISE_RUN           = 35;
  var NOISE_SHOOT         = 80;
  var NOISE_EXPLOSION     = 100;
  var NOISE_CROUCH_WALK   = 5;
  var NOISE_SUPPRESSED    = 15;   // shoot with silenced/suppressed weapon

  var NOISE_DECAY_PER_SEC = 30;   // %/s passive decay

  // Shadow detection
  var SHADOW_LIGHT_DIST   = 15;   // units — if further than this from any light → in shadow
  var SHADOW_DETECT_MULT  = 0.60; // detection range multiplier while in shadow (−40%)

  // Detection cone parameters
  var CONE_RANGE          = 20;   // units
  var CONE_ANGLE_DEG      = 45;   // half-angle of FOV cone
  var CONE_ANGLE_RAD      = CONE_ANGLE_DEG * Math.PI / 180;

  // Detection timing (seconds to transition between stages)
  var SUSPICIOUS_FILL_TIME = 2.5; // seconds at suspicious before going DETECTED
  var SEARCH_DURATION      = 8.0; // seconds in SEARCH state
  var SEARCH_SWEEP_SPEED   = 1.2; // rad/s sweep

  // Silent takedown
  var TAKEDOWN_RANGE       = 1.5;
  var TAKEDOWN_ANIM_DUR    = 0.5; // scale collapse duration
  var TAKEDOWN_SCORE       = 200;

  // Ghost meter
  var GHOST_FILL_RATE      = 0.04; // per second while undetected
  var GHOST_DRAIN_AMOUNT   = 0.3;  // drained when alarm triggered

  // Alarm
  var ALARM_RADIUS         = 30;   // units — enemies alerted
  var ALARM_FLASH_DUR      = 1.0;  // seconds of red screen flash
  var ALARM_TONE_FREQ      = 880;  // Hz
  var ALARM_TONE_DUR       = 1.0;  // seconds

  // Detection stage identifiers
  var STAGE_UNDETECTED  = 0;
  var STAGE_SUSPICIOUS  = 1;
  var STAGE_DETECTED    = 2;
  var STAGE_SEARCHING   = 3;

  // Cone colours
  var COLOR_GREEN  = 0x00ff44;
  var COLOR_YELLOW = 0xffcc00;
  var COLOR_RED    = 0xff2200;

  // ─────────────────────────────────────────────── STATE

  var _scene      = null;
  var _camera     = null;
  var _inited     = false;

  // Noise meter 0-100
  var _noisePct   = 0;

  // Player movement mode
  var _moveMode   = 'still'; // 'still'|'crouch'|'walk'|'run'

  // Shadow state
  var _inShadow   = false;

  // Ghost tracking
  var _ghostMeter        = 0;    // 0-1
  var _ghostKills        = 0;    // kills while ghost-running
  var _alarmEverTriggered = false;
  var _ghostBonus        = 1.0;  // score multiplier
  var _levelComplete     = false;

  // Alarm state
  var _alarmFlashTimer   = 0;
  var _alarmActive       = false;

  // Exposed warning state
  var _exposedPulseTimer = 0;
  var _isExposed         = false;

  // Audio context
  var _audioCtx          = null;

  // Registered enemies: array of { obj, cone, stage, suspTimer, searchTimer, searchAngle, originalSpeed }
  var _enemies = [];

  // Takedown state
  var _takedownActive    = false;
  var _takedownTarget    = null;
  var _takedownTimer     = 0;
  var _takedownOrigScaleY = 1;

  // DOM elements
  var _canvasNoise       = null;  // canvas for noise meter
  var _ghostIndicatorEl  = null;  // ghost meter top-right
  var _exposedEl         = null;  // EXPOSED warning
  var _alarmEl           = null;  // red alarm overlay
  var _ghostTitleEl      = null;  // "GHOST OPERATIVE" title
  var _hudStyleEl        = null;

  // ─────────────────────────────────────────────── AUDIO

  function _getAudio() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _playAlarmTone() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = ALARM_TONE_FREQ;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ALARM_TONE_DUR);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + ALARM_TONE_DUR);
    } catch (e) { /* silent */ }
  }

  // ─────────────────────────────────────────────── HUD BUILD

  function _injectStyles() {
    if (_hudStyleEl) return;
    _hudStyleEl = document.createElement('style');
    _hudStyleEl.id = 'stealth-system-styles';
    _hudStyleEl.textContent = [
      '@keyframes stealthExposedPulse {',
      '  0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1);}',
      '  50%{opacity:0.4;transform:translate(-50%,-50%) scale(1.08);}',
      '}',
      '@keyframes stealthAlarmFlash {',
      '  0%,100%{opacity:0.55;} 50%{opacity:0.1;}',
      '}',
      '@keyframes stealthGhostTitle {',
      '  0%{opacity:0;letter-spacing:2px;}',
      '  20%{opacity:1;letter-spacing:12px;}',
      '  80%{opacity:1;letter-spacing:12px;}',
      '  100%{opacity:0;letter-spacing:20px;}',
      '}',
      '#ss-noise-wrap {',
      '  position:fixed;bottom:24px;left:24px;',
      '  width:72px;height:72px;',
      '  pointer-events:none;z-index:400;',
      '}',
      '#ss-noise-canvas {display:block;}',
      '#ss-ghost-wrap {',
      '  position:fixed;top:18px;right:22px;',
      '  width:52px;',
      '  pointer-events:none;z-index:400;',
      '  display:flex;flex-direction:column;align-items:center;gap:4px;',
      '}',
      '#ss-ghost-icon {',
      '  font-size:26px;line-height:1;',
      '  text-shadow:0 0 8px rgba(255,255,255,0.6);',
      '  transition:color 0.4s;',
      '}',
      '#ss-ghost-bar-outer {',
      '  width:40px;height:5px;',
      '  background:rgba(255,255,255,0.15);',
      '  border-radius:3px;overflow:hidden;',
      '}',
      '#ss-ghost-bar-inner {',
      '  height:100%;width:0%;',
      '  background:#00ffcc;',
      '  border-radius:3px;',
      '  transition:width 0.3s;',
      '}',
      '#ss-ghost-label {',
      '  font-family:monospace;font-size:8px;',
      '  color:rgba(255,255,255,0.6);letter-spacing:1px;',
      '}',
      '#ss-exposed {',
      '  position:fixed;top:42%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  font-family:monospace;font-size:20px;font-weight:bold;',
      '  letter-spacing:6px;color:#ff8800;',
      '  text-shadow:0 0 14px #ff8800;',
      '  pointer-events:none;z-index:500;display:none;',
      '  animation:stealthExposedPulse 0.8s ease-in-out infinite;',
      '}',
      '#ss-alarm-overlay {',
      '  position:fixed;inset:0;',
      '  background:rgba(255,0,0,0.55);',
      '  pointer-events:none;z-index:490;display:none;',
      '  animation:stealthAlarmFlash 0.35s ease-in-out infinite;',
      '}',
      '#ss-ghost-title {',
      '  position:fixed;top:38%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  font-family:monospace;font-size:32px;font-weight:bold;',
      '  color:#00ffcc;letter-spacing:12px;',
      '  text-shadow:0 0 20px #00ffcc;',
      '  pointer-events:none;z-index:600;display:none;',
      '  animation:stealthGhostTitle 3.5s ease-in-out forwards;',
      '}'
    ].join('\n');
    document.head.appendChild(_hudStyleEl);
  }

  function _buildHUD() {
    _injectStyles();

    // Noise meter canvas — bottom-left
    var noiseWrap = document.createElement('div');
    noiseWrap.id = 'ss-noise-wrap';
    _canvasNoise = document.createElement('canvas');
    _canvasNoise.id = 'ss-noise-canvas';
    _canvasNoise.width  = 72;
    _canvasNoise.height = 72;
    noiseWrap.appendChild(_canvasNoise);
    document.body.appendChild(noiseWrap);

    // Ghost indicator — top-right
    var ghostWrap = document.createElement('div');
    ghostWrap.id = 'ss-ghost-wrap';
    var ghostIcon = document.createElement('div');
    ghostIcon.id = 'ss-ghost-icon';
    ghostIcon.textContent = '👻'; // ghost emoji
    var ghostBarOuter = document.createElement('div');
    ghostBarOuter.id = 'ss-ghost-bar-outer';
    var ghostBarInner = document.createElement('div');
    ghostBarInner.id = 'ss-ghost-bar-inner';
    ghostBarOuter.appendChild(ghostBarInner);
    var ghostLabel = document.createElement('div');
    ghostLabel.id = 'ss-ghost-label';
    ghostLabel.textContent = 'GHOST';
    ghostWrap.appendChild(ghostIcon);
    ghostWrap.appendChild(ghostBarOuter);
    ghostWrap.appendChild(ghostLabel);
    document.body.appendChild(ghostWrap);
    _ghostIndicatorEl = ghostWrap;

    // EXPOSED warning
    _exposedEl = document.createElement('div');
    _exposedEl.id = 'ss-exposed';
    _exposedEl.textContent = 'EXPOSED';
    document.body.appendChild(_exposedEl);

    // Alarm red overlay
    _alarmEl = document.createElement('div');
    _alarmEl.id = 'ss-alarm-overlay';
    document.body.appendChild(_alarmEl);

    // Ghost title
    _ghostTitleEl = document.createElement('div');
    _ghostTitleEl.id = 'ss-ghost-title';
    _ghostTitleEl.textContent = 'GHOST OPERATIVE';
    document.body.appendChild(_ghostTitleEl);
  }

  // ─────────────────────────────────────────────── NOISE METER DRAW

  function _drawNoiseMeter() {
    if (!_canvasNoise) return;
    var ctx = _canvasNoise.getContext('2d');
    var w   = _canvasNoise.width;
    var h   = _canvasNoise.height;
    var cx  = w / 2;
    var cy  = h / 2;
    var r   = (w / 2) - 5;

    ctx.clearRect(0, 0, w, h);

    // Background track ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Filled arc — clockwise from top, proportional to noise
    var fraction = _noisePct / 100;
    if (fraction > 0) {
      var startA = -Math.PI / 2;
      var endA   = startA + Math.PI * 2 * fraction;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startA, endA);
      // colour shifts white → orange → red with noise level
      var rr = 255;
      var gg = Math.round(255 * (1 - fraction));
      var bb = Math.round(255 * (1 - fraction));
      ctx.strokeStyle = 'rgba(' + rr + ',' + gg + ',' + bb + ',0.92)';
      ctx.lineWidth = 7;
      ctx.stroke();
    }

    // Centre label
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NOISE', cx, cy - 5);
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(Math.round(_noisePct) + '%', cx, cy + 7);
  }

  // ─────────────────────────────────────────────── GHOST METER DRAW

  function _drawGhostMeter() {
    var bar = document.getElementById('ss-ghost-bar-inner');
    if (bar) {
      bar.style.width = Math.round(_ghostMeter * 100) + '%';
    }
    var icon = document.getElementById('ss-ghost-icon');
    if (icon) {
      if (_alarmEverTriggered) {
        icon.style.color = '#ff4444';
        icon.style.opacity = '0.5';
      } else {
        var g = Math.round(80 + _ghostMeter * 175);
        icon.style.color = 'rgb(0,' + g + ',200)';
        icon.style.opacity = String(0.5 + _ghostMeter * 0.5);
      }
    }
  }

  // ─────────────────────────────────────────────── SHADOW CHECK

  function _checkShadow() {
    if (!_scene || !_camera) { _inShadow = false; return; }

    // If fog present — shadow detection is active; check light distances
    var hasFog = !!_scene.fog;
    if (!hasFog) { _inShadow = false; return; }

    var playerPos = _camera.position;
    var nearestLightDist = Infinity;

    _scene.traverse(function (obj) {
      if (obj.isLight && (obj.isPointLight || obj.isSpotLight || obj.isDirectionalLight)) {
        var dx = obj.position.x - playerPos.x;
        var dy = obj.position.y - playerPos.y;
        var dz = obj.position.z - playerPos.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < nearestLightDist) nearestLightDist = dist;
      }
    });

    _inShadow = (nearestLightDist > SHADOW_LIGHT_DIST);
  }

  // ─────────────────────────────────────────────── EXPOSED CHECK

  function _checkExposed() {
    // Exposed: not in shadow, not crouching, noise > 0
    _isExposed = (!_inShadow && _moveMode !== 'crouch' && _moveMode !== 'still' && _noisePct > 5);
    if (_exposedEl) {
      _exposedEl.style.display = _isExposed ? 'block' : 'none';
    }
  }

  // ─────────────────────────────────────────────── DETECTION CONE MESH

  function _buildConeMesh() {
    if (typeof THREE === 'undefined') return null;

    // ConeGeometry(radius, height, radialSegments)
    // We compute radius from range and angle:  r = range * tan(halfAngle)
    var coneHeight = CONE_RANGE;
    var coneRadius = CONE_RANGE * Math.tan(CONE_ANGLE_RAD);

    var geo  = new THREE.ConeGeometry(coneRadius, coneHeight, 16, 1, true);
    var mat  = new THREE.MeshBasicMaterial({
      color:       COLOR_GREEN,
      wireframe:   true,
      transparent: true,
      opacity:     0.55
    });
    var mesh = new THREE.Mesh(geo, mat);

    // THREE cone opens along Y+; rotate so it points along Z- (forward)
    mesh.rotation.x = -Math.PI / 2;
    // Translate so apex is at origin
    mesh.position.z = -coneHeight / 2;

    // Wrap in a pivot group so the pivot is at the apex
    var pivot = new THREE.Group();
    pivot.add(mesh);
    return pivot;
  }

  function _setConeColor(enemyData, color) {
    if (!enemyData.cone) return;
    enemyData.cone.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material.color.setHex(color);
      }
    });
  }

  // ─────────────────────────────────────────────── ENEMY REGISTRATION

  function registerEnemy(enemyObj) {
    if (!enemyObj) return;

    // Check not already registered
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].obj === enemyObj) return;
    }

    var cone = null;
    if (_scene && typeof THREE !== 'undefined') {
      cone = _buildConeMesh();
      if (cone) {
        _scene.add(cone);
      }
    }

    _enemies.push({
      obj:           enemyObj,
      cone:          cone,
      stage:         STAGE_UNDETECTED,
      suspTimer:     0,
      searchTimer:   0,
      searchAngle:   0,
      originalSpeed: enemyObj.speed || enemyObj.moveSpeed || 1
    });
  }

  function unregisterEnemy(enemyObj) {
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].obj === enemyObj) {
        if (_enemies[i].cone && _scene) {
          _scene.remove(_enemies[i].cone);
        }
        _enemies.splice(i, 1);
        return;
      }
    }
  }

  // ─────────────────────────────────────────────── SILENT TAKEDOWN

  function _tryTakedown() {
    if (_takedownActive) return;
    if (_moveMode !== 'crouch') return;
    if (!_camera) return;

    var camPos = _camera.position;
    var nearest = null;
    var nearestDist = Infinity;
    var nearestData = null;

    for (var i = 0; i < _enemies.length; i++) {
      var data = _enemies[i];
      var en   = data.obj;
      if (!en || !en.position) continue;
      var dx = en.position.x - camPos.x;
      var dz = en.position.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist  = dist;
        nearest      = en;
        nearestData  = data;
      }
    }

    if (!nearest || nearestDist > TAKEDOWN_RANGE) return;

    // Check player is behind enemy (dot product of enemy facing and player→enemy vector)
    // Approximate: enemy's forward is its mesh rotation on Y axis
    var behindOk = true;
    if (nearest.rotation !== undefined) {
      var enFwdX   = -Math.sin(nearest.rotation.y || 0);
      var enFwdZ   = -Math.cos(nearest.rotation.y || 0);
      var toPlayerX = camPos.x - nearest.position.x;
      var toPlayerZ = camPos.z - nearest.position.z;
      var len = Math.sqrt(toPlayerX * toPlayerX + toPlayerZ * toPlayerZ);
      if (len > 0.001) {
        toPlayerX /= len;
        toPlayerZ /= len;
      }
      // Dot < 0 means player is roughly in front of enemy's facing — they're behind
      var dot = enFwdX * toPlayerX + enFwdZ * toPlayerZ;
      behindOk = (dot < 0.2); // allow some tolerance
    }

    if (!behindOk) return;

    // Begin takedown animation
    _takedownActive  = true;
    _takedownTarget  = nearestData;
    _takedownTimer   = 0;
    _takedownOrigScaleY = (nearest.scale && nearest.scale.y !== undefined) ? nearest.scale.y : 1;

    // No noise
    // Score
    if (typeof window._score !== 'undefined') {
      window._score += TAKEDOWN_SCORE;
    }
    _ghostKills++;
    _showFloatingText('+' + TAKEDOWN_SCORE + ' STEALTH KILL', '#00ffcc');

    // Remove from detection (mark as done)
    nearestData.stage = STAGE_UNDETECTED;
  }

  function _updateTakedown(dt) {
    if (!_takedownActive || !_takedownTarget) return;
    _takedownTimer += dt;
    var progress = _takedownTimer / TAKEDOWN_ANIM_DUR;
    if (progress > 1) progress = 1;

    var en = _takedownTarget.obj;
    if (en && en.scale) {
      en.scale.y = _takedownOrigScaleY * (1 - progress);
    }

    if (progress >= 1) {
      // Kill the enemy
      if (en) {
        if (typeof en.kill === 'function')      en.kill();
        else if (typeof en.die === 'function')  en.die();
        else if (typeof en.remove === 'function') en.remove();
      }
      unregisterEnemy(en);
      _takedownActive = false;
      _takedownTarget = null;
    }
  }

  // ─────────────────────────────────────────────── ALARM

  function _triggerAlarm(sourceEnemy) {
    if (_alarmActive) return;
    _alarmActive       = true;
    _alarmFlashTimer   = ALARM_FLASH_DUR;
    _alarmEverTriggered = true;
    _ghostMeter = Math.max(0, _ghostMeter - GHOST_DRAIN_AMOUNT);

    // Show red overlay
    if (_alarmEl) {
      _alarmEl.style.display = 'block';
    }

    // Sound
    _playAlarmTone();

    // Alert all enemies in radius
    if (_camera && _scene) {
      var srcPos = (sourceEnemy && sourceEnemy.position) ? sourceEnemy.position : _camera.position;
      for (var i = 0; i < _enemies.length; i++) {
        var data = _enemies[i];
        var en   = data.obj;
        if (!en || !en.position) continue;
        var dx = en.position.x - srcPos.x;
        var dz = en.position.z - srcPos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= ALARM_RADIUS) {
          data.stage = STAGE_DETECTED;
          _setConeColor(data, COLOR_RED);
          if (typeof en.alert === 'function')        en.alert();
          else if (typeof en.alertToPlayer === 'function') en.alertToPlayer();
        }
      }
    }
  }

  // ─────────────────────────────────────────────── DETECTION CONE UPDATE

  function _updateEnemyDetection(dt) {
    if (!_camera) return;
    var camPos = _camera.position;

    for (var i = 0; i < _enemies.length; i++) {
      var data = _enemies[i];
      var en   = data.obj;
      if (!en || !en.position) continue;

      // ── Position the cone at enemy location / rotation
      if (data.cone && _scene) {
        data.cone.position.copy(en.position);
        if (en.rotation) {
          if (data.stage === STAGE_SEARCHING) {
            // Sweep back and forth
            data.searchAngle += SEARCH_SWEEP_SPEED * dt;
            data.cone.rotation.y = en.rotation.y + Math.sin(data.searchAngle) * 1.1;
          } else {
            data.cone.rotation.y = en.rotation.y || 0;
          }
        }
      }

      // ── Can the enemy see the player?
      var dx       = camPos.x - en.position.x;
      var dz       = camPos.z - en.position.z;
      var distToPlayer = Math.sqrt(dx * dx + dz * dz);

      // Effective detection range (shadow modifier)
      var effectiveRange = CONE_RANGE;
      if (_inShadow) effectiveRange *= SHADOW_DETECT_MULT;

      var canSee = false;
      if (distToPlayer <= effectiveRange) {
        // Check angle: angle from enemy forward to player direction
        var enFacing  = (en.rotation && en.rotation.y !== undefined) ? en.rotation.y : 0;
        var angleToPlayer = Math.atan2(dx, dz);
        var angleDiff = angleToPlayer - enFacing;
        // Normalise to -PI..PI
        while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) <= CONE_ANGLE_RAD) {
          canSee = true;
        }
      }

      // Noise-based detection: if high noise, enemy can hear regardless of cone
      var noiseTrigger = (_noisePct >= 60 && distToPlayer <= effectiveRange * 0.6);
      var playerVisible = canSee || noiseTrigger;

      // ── State machine
      switch (data.stage) {

        case STAGE_UNDETECTED:
          if (playerVisible) {
            data.stage     = STAGE_SUSPICIOUS;
            data.suspTimer = 0;
            _setConeColor(data, COLOR_YELLOW);
            // Speed up enemy
            if (en.speed !== undefined)     en.speed     = data.originalSpeed * 1.5;
            if (en.moveSpeed !== undefined) en.moveSpeed = data.originalSpeed * 1.5;
          }
          break;

        case STAGE_SUSPICIOUS:
          _setConeColor(data, COLOR_YELLOW);
          if (playerVisible) {
            data.suspTimer += dt;
            if (data.suspTimer >= SUSPICIOUS_FILL_TIME) {
              data.stage = STAGE_DETECTED;
              _setConeColor(data, COLOR_RED);
              _triggerAlarm(en);
              // Notify enemy AI
              if (typeof en.engage === 'function')        en.engage();
              else if (typeof en.combatStart === 'function') en.combatStart();
            }
          } else {
            // Lost sight — go to searching
            data.stage       = STAGE_SEARCHING;
            data.searchTimer = 0;
            data.searchAngle = 0;
            _setConeColor(data, COLOR_YELLOW);
            // Reset speed
            if (en.speed !== undefined)     en.speed     = data.originalSpeed;
            if (en.moveSpeed !== undefined) en.moveSpeed = data.originalSpeed;
          }
          break;

        case STAGE_DETECTED:
          _setConeColor(data, COLOR_RED);
          if (!playerVisible) {
            // Lost the player
            data.stage       = STAGE_SEARCHING;
            data.searchTimer = 0;
            data.searchAngle = 0;
            _setConeColor(data, COLOR_YELLOW);
          }
          break;

        case STAGE_SEARCHING:
          _setConeColor(data, COLOR_YELLOW);
          data.searchTimer += dt;
          if (playerVisible) {
            // Spotted again
            data.stage = STAGE_DETECTED;
            _setConeColor(data, COLOR_RED);
            _triggerAlarm(en);
          } else if (data.searchTimer >= SEARCH_DURATION) {
            // Give up
            data.stage = STAGE_UNDETECTED;
            _setConeColor(data, COLOR_GREEN);
          }
          break;

        default:
          data.stage = STAGE_UNDETECTED;
          _setConeColor(data, COLOR_GREEN);
          break;
      }
    }
  }

  // ─────────────────────────────────────────────── GHOST METER UPDATE

  function _updateGhostMeter(dt) {
    var anyDetected = false;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].stage === STAGE_DETECTED) {
        anyDetected = true;
        break;
      }
    }

    if (!anyDetected && !_alarmEverTriggered) {
      _ghostMeter += GHOST_FILL_RATE * dt;
      if (_ghostMeter > 1) _ghostMeter = 1;
    }
    // Ghost score multiplier scales with meter
    _ghostBonus = 1.0 + _ghostMeter * 2.0; // up to 3x at full ghost meter
  }

  // ─────────────────────────────────────────────── GHOST OPERATIVE REWARD

  function _awardGhostBonus() {
    if (_levelComplete) return;
    _levelComplete = true;

    if (!_alarmEverTriggered && _ghostMeter > 0.5) {
      if (typeof window._score !== 'undefined') {
        window._score += 1000;
      }
      _showGhostTitle();
    }
  }

  function _showGhostTitle() {
    if (!_ghostTitleEl) return;
    _ghostTitleEl.style.display = 'block';
    // Re-trigger animation by cloning
    var clone = _ghostTitleEl.cloneNode(true);
    _ghostTitleEl.parentNode.replaceChild(clone, _ghostTitleEl);
    _ghostTitleEl = clone;
    _ghostTitleEl.style.display = 'block';
    setTimeout(function () {
      if (_ghostTitleEl) _ghostTitleEl.style.display = 'none';
    }, 3500);
  }

  // ─────────────────────────────────────────────── FLOATING TEXT

  function _showFloatingText(text, color) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = [
      'position:fixed',
      'top:35%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'letter-spacing:4px',
      'color:' + (color || '#fff'),
      'text-shadow:0 0 10px ' + (color || '#fff'),
      'pointer-events:none',
      'z-index:800',
      'transition:opacity 0.6s'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 800);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1500);
  }

  // ─────────────────────────────────────────────── KEYBOARD

  function _onKeyDown(e) {
    if (e.repeat) return;
    if (e.code === 'KeyF') {
      _tryTakedown();
    }
  }

  // ─────────────────────────────────────────────── PUBLIC — NOISE EVENTS

  function addNoise(amount) {
    _noisePct += amount;
    if (_noisePct > 100) _noisePct = 100;
    if (_noisePct < 0)   _noisePct = 0;
  }

  function onPlayerFired(weaponName) {
    var name = weaponName ? String(weaponName).toLowerCase() : '';
    var isSilenced = (name.indexOf('suppressed') !== -1 || name.indexOf('silenced') !== -1);
    addNoise(isSilenced ? NOISE_SUPPRESSED : NOISE_SHOOT);
  }

  function onPlayerMoved(mode) {
    // mode: 'still'|'crouch'|'walk'|'run'
    _moveMode = mode || 'still';
    switch (_moveMode) {
      case 'run':         addNoise(NOISE_RUN * 0.05);         break; // per-frame contribution
      case 'walk':        addNoise(NOISE_WALK * 0.05);        break;
      case 'crouch':      addNoise(NOISE_CROUCH_WALK * 0.05); break;
      default:            break;
    }
  }

  function onExplosionNearby() {
    addNoise(NOISE_EXPLOSION);
  }

  // ─────────────────────────────────────────────── PUBLIC API

  function init(scene, camera, options) {
    if (_inited) return;
    _inited  = true;
    _scene   = scene  || null;
    _camera  = camera || null;

    _buildHUD();
    document.addEventListener('keydown', _onKeyDown);

    // Draw initial state
    _drawNoiseMeter();
    _drawGhostMeter();
  }

  function update(dt) {
    if (!_inited) return;
    if (!dt || dt < 0) dt = 0.016;

    // ── Noise decay
    _noisePct -= NOISE_DECAY_PER_SEC * dt;
    if (_noisePct < 0)   _noisePct = 0;
    if (_noisePct > 100) _noisePct = 100;

    // ── Shadow check
    _checkShadow();

    // ── Exposed check
    _checkExposed();

    // ── Detection cones & enemy state machine
    _updateEnemyDetection(dt);

    // ── Ghost meter
    _updateGhostMeter(dt);

    // ── Alarm flash timer
    if (_alarmActive && _alarmFlashTimer > 0) {
      _alarmFlashTimer -= dt;
      if (_alarmFlashTimer <= 0) {
        _alarmFlashTimer = 0;
        _alarmActive     = false;
        if (_alarmEl) _alarmEl.style.display = 'none';
      }
    }

    // ── Takedown animation
    _updateTakedown(dt);

    // ── HUD refresh
    _drawNoiseMeter();
    _drawGhostMeter();
  }

  function reset() {
    _noisePct           = 0;
    _moveMode           = 'still';
    _inShadow           = false;
    _ghostMeter         = 0;
    _ghostKills         = 0;
    _alarmEverTriggered = false;
    _ghostBonus         = 1.0;
    _levelComplete      = false;
    _alarmActive        = false;
    _alarmFlashTimer    = 0;
    _isExposed          = false;
    _takedownActive     = false;
    _takedownTarget     = null;
    _takedownTimer      = 0;

    // Remove all cones
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].cone && _scene) {
        _scene.remove(_enemies[i].cone);
      }
    }
    _enemies = [];

    // Reset HUD
    if (_exposedEl)  _exposedEl.style.display  = 'none';
    if (_alarmEl)    _alarmEl.style.display    = 'none';
    if (_ghostTitleEl) _ghostTitleEl.style.display = 'none';

    _drawNoiseMeter();
    _drawGhostMeter();
  }

  function getGhostScore() {
    return _ghostMeter;
  }

  function isGhosting() {
    return (!_alarmEverTriggered && _ghostMeter > 0);
  }

  // Expose awardGhostBonus so game manager can call at level end
  function onLevelComplete() {
    _awardGhostBonus();
  }

  return {
    init:               init,
    update:             update,
    reset:              reset,
    addNoise:           addNoise,
    onPlayerFired:      onPlayerFired,
    onPlayerMoved:      onPlayerMoved,
    onExplosionNearby:  onExplosionNearby,
    registerEnemy:      registerEnemy,
    unregisterEnemy:    unregisterEnemy,
    getGhostScore:      getGhostScore,
    isGhosting:         isGhosting,
    onLevelComplete:    onLevelComplete
  };

})();
