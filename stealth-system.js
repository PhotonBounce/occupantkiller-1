// stealth-system.js — Noise/Visibility Stealth Mechanics for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, no imports/exports
//
// Public API:
//   StealthSystem.init(scene, camera)
//   StealthSystem.update(dt)
//   StealthSystem.onPlayerFired()
//   StealthSystem.onPlayerMoved(speed)
//   StealthSystem.getStealthLevel()
//   StealthSystem.reset()
//
// Globals exposed:
//   window._stealthLevel  — 0.0 (invisible) to 1.0 (fully visible)

window.StealthSystem = (function () {
  'use strict';

  // ─────────────────────────────────── config
  var NOISE_DECAY_RATE        = 1 / 3;      // full bar decays to 0 in 3s
  var NOISE_FIRE_LEVEL        = 1.0;
  var NOISE_SPRINT_LEVEL      = 0.5;
  var NOISE_WALK_LEVEL        = 0.25;
  var NOISE_CROUCH_LEVEL      = 0.0;

  var VISIBILITY_RUNNING      = 0.8;
  var VISIBILITY_WALKING      = 0.4;
  var VISIBILITY_CROUCHING    = 0.1;
  var VISIBILITY_FIRED_LEVEL  = 1.0;
  var VISIBILITY_FIRED_DECAY  = 2.0;       // seconds at 1.0 after firing

  var DETECT_HIGH_RANGE       = 25;        // units — stealthLevel > 0.6
  var DETECT_MED_RANGE        = 12;        // units — stealthLevel 0.3-0.6
  var DETECT_LOW_THRESH       = 0.3;       // below = no detection (unless noise)
  var DETECT_HIGH_THRESH      = 0.6;

  var STEALTH_KILL_RANGE      = 2;         // units
  var STEALTH_KILL_THRESH     = 0.2;       // _stealthLevel must be below this
  var STEALTH_KILL_SCORE      = 200;
  var STEALTH_KILL_LERP_DUR   = 0.5;       // seconds camera lerp to enemy
  var STEALTH_KILL_FLASH_DUR  = 0.2;       // seconds black flash
  var STEALTH_KILL_ANIM_DUR   = 1.2;       // total animation duration

  var FOOTSTEP_WALK_INTERVAL  = 0.4;       // seconds
  var FOOTSTEP_RUN_INTERVAL   = 0.2;       // seconds
  var FOOTSTEP_FREQ           = 80;        // Hz — very low frequency
  var FOOTSTEP_GAIN           = 0.05;
  var FOOTSTEP_NOISE_RADIUS   = 8;         // units for walking, 14 for running

  var DECOY_RANGE             = 10;        // metres
  var DECOY_NOISE_RADIUS      = 12;        // units — enemies react to pebble
  var DECOY_ATTRACT_DURATION  = 4.0;       // seconds enemies look at noise point
  var DECOY_SPHERE_RADIUS     = 0.08;

  var DETECTION_WARN_DUR      = 1.0;       // seconds for eye icon flash
  var DETECTED_WARN_DUR       = 2.0;       // seconds for DETECTED flash

  var HUD_ID                  = 'stealth-system-hud';
  var NOISE_METER_ID          = 'stealth-noise-meter';
  var EYE_ICON_ID             = 'stealth-eye-icon';
  var ALERT_BANNER_ID         = 'stealth-alert-banner';
  var STYLE_ID                = 'stealth-system-style';

  // ─────────────────────────────────── state
  var _scene          = null;
  var _camera         = null;
  var _inited         = false;

  var _noiseLevel     = 0;           // 0-1, current noise meter fill
  var _stealthLevel   = 0;           // 0-1, current visibility

  var _firedTimer     = 0;           // countdown — stays at 1.0 for 2s after firing
  var _moveSpeed      = 0;           // last reported move speed (0=still,1=walk,2=run)
  var _isCrouching    = false;

  var _footstepTimer  = 0;           // countdown to next footstep
  var _audioCtx       = null;

  // stealth kill state
  var _stealthKillActive  = false;
  var _stealthKillTimer   = 0;
  var _stealthKillTarget  = null;
  var _stealthKillCamStart = null;
  var _stealthKillCamTarget = null;
  var _flashEl            = null;

  // whistle decoy
  var _decoyMesh      = null;
  var _decoyActive    = false;
  var _decoyTimer     = 0;
  var _decoyPos       = null;
  var _decoyVel       = null;
  var _decoyLanded    = false;
  var _decoyNoiseTimer = 0;

  // detection warning
  var _detectWarnTimer = 0;
  var _detectedTimer   = 0;

  // DOM handles
  var _hudEl          = null;
  var _noiseMeterFillEl = null;
  var _eyeIconEl      = null;
  var _alertBannerEl  = null;
  var _styleEl        = null;

  // global flag
  window._stealthLevel = 0;

  // ─────────────────────────────────── CSS
  function _injectStyles() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.id = STYLE_ID;
    _styleEl.textContent = [
      '@keyframes stealthEyePulse {',
      '  0%,100% { transform: scale(1); opacity: 1; }',
      '  50%      { transform: scale(1.25); opacity: 0.6; }',
      '}',
      '@keyframes stealthDetectedFlash {',
      '  0%,100% { opacity: 1; }',
      '  50%      { opacity: 0.3; }',
      '}',
      '@keyframes stealthKillFlash {',
      '  0%   { opacity: 1; }',
      '  100% { opacity: 0; }',
      '}',
      // Noise meter container — bottom-left, 60px circle
      '#' + NOISE_METER_ID + ' {',
      '  position: fixed;',
      '  bottom: 90px;',
      '  left: 20px;',
      '  width: 60px;',
      '  height: 60px;',
      '  z-index: 300;',
      '  pointer-events: none;',
      '}',
      '#' + NOISE_METER_ID + ' canvas {',
      '  width: 60px;',
      '  height: 60px;',
      '}',
      // Eye icon — centre screen
      '#' + EYE_ICON_ID + ' {',
      '  position: fixed;',
      '  top: 44%;',
      '  left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  font-size: 48px;',
      '  pointer-events: none;',
      '  z-index: 500;',
      '  display: none;',
      '  text-shadow: 0 0 12px currentColor;',
      '  transition: color 0.2s;',
      '}',
      // Alert banner
      '#' + ALERT_BANNER_ID + ' {',
      '  position: fixed;',
      '  top: 38%;',
      '  left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  font-family: monospace;',
      '  font-size: 36px;',
      '  font-weight: bold;',
      '  letter-spacing: 8px;',
      '  pointer-events: none;',
      '  z-index: 501;',
      '  display: none;',
      '  text-shadow: 0 0 16px currentColor;',
      '  animation: stealthDetectedFlash 0.4s ease-in-out infinite;',
      '}',
      // Stealth HUD eye meter (bottom-left above noise meter)
      '#stealth-eye-meter {',
      '  position: fixed;',
      '  bottom: 160px;',
      '  left: 20px;',
      '  width: 60px;',
      '  font-size: 10px;',
      '  color: #fff;',
      '  font-family: monospace;',
      '  pointer-events: none;',
      '  z-index: 300;',
      '  text-align: center;',
      '}',
      '#stealth-eye-meter-eye {',
      '  font-size: 28px;',
      '  display: block;',
      '  line-height: 1;',
      '  text-shadow: 0 0 8px currentColor;',
      '  transition: color 0.3s;',
      '}',
      '#stealth-eye-meter-label {',
      '  display: block;',
      '  font-size: 9px;',
      '  opacity: 0.7;',
      '  letter-spacing: 1px;',
      '}',
      // Kill flash overlay
      '#stealth-kill-flash {',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  background: #000;',
      '  pointer-events: none;',
      '  z-index: 9999;',
      '  display: none;',
      '  opacity: 0;',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  // ─────────────────────────────────── HUD build
  function _buildHUD() {
    if (_hudEl) return;

    _injectStyles();

    // Noise meter (canvas-based arc)
    var nmEl = document.createElement('div');
    nmEl.id = NOISE_METER_ID;
    var nmCanvas = document.createElement('canvas');
    nmCanvas.width  = 60;
    nmCanvas.height = 60;
    nmEl.appendChild(nmCanvas);
    document.body.appendChild(nmEl);

    // Stealth eye meter
    var eyeMeter = document.createElement('div');
    eyeMeter.id = 'stealth-eye-meter';
    var eyeSpan = document.createElement('span');
    eyeSpan.id = 'stealth-eye-meter-eye';
    eyeSpan.textContent = '👁';
    var labelSpan = document.createElement('span');
    labelSpan.id = 'stealth-eye-meter-label';
    labelSpan.textContent = 'STEALTH';
    eyeMeter.appendChild(eyeSpan);
    eyeMeter.appendChild(labelSpan);
    document.body.appendChild(eyeMeter);

    // Eye icon (centre screen alert)
    _eyeIconEl = document.createElement('div');
    _eyeIconEl.id = EYE_ICON_ID;
    _eyeIconEl.textContent = '👁';
    document.body.appendChild(_eyeIconEl);

    // Alert banner
    _alertBannerEl = document.createElement('div');
    _alertBannerEl.id = ALERT_BANNER_ID;
    _alertBannerEl.textContent = 'DETECTED';
    document.body.appendChild(_alertBannerEl);

    // Kill flash overlay
    _flashEl = document.createElement('div');
    _flashEl.id = 'stealth-kill-flash';
    document.body.appendChild(_flashEl);

    _hudEl = nmEl;
    _noiseMeterFillEl = nmCanvas;
  }

  // ─────────────────────────────────── noise arc renderer
  function _drawNoiseMeter(level) {
    var canvas = _noiseMeterFillEl;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var r = (w / 2) - 4;

    ctx.clearRect(0, 0, w, h);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 6;
    ctx.stroke();

    if (level > 0) {
      var startAngle = -Math.PI / 2;
      var endAngle   = startAngle + (Math.PI * 2 * level);
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      var alpha = 0.7 + level * 0.3;
      ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NOISE', cx, cy);
  }

  // ─────────────────────────────────── eye meter renderer
  function _drawEyeMeter(level) {
    var eyeEl = document.getElementById('stealth-eye-meter-eye');
    if (!eyeEl) return;
    var color;
    if (level < 0.3) {
      color = '#00ff88';        // green — hidden
    } else if (level < 0.6) {
      color = '#ffcc00';        // yellow — suspicious
    } else {
      color = '#ff3333';        // red — detected
    }
    eyeEl.style.color = color;
    eyeEl.style.opacity = String(0.3 + level * 0.7);
  }

  // ─────────────────────────────────── audio
  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _playFootstepNoise() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = ctx.sampleRate * 0.05;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;

      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = FOOTSTEP_FREQ;

      var gain = ctx.createGain();
      gain.gain.value = FOOTSTEP_GAIN;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent fail */ }
  }

  function _playDecoyThud() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) { /* silent fail */ }
  }

  // ─────────────────────────────────── keyboard
  function _onKeyDown(e) {
    // F key — stealth kill
    if (e.code === 'KeyF' && !e.repeat) {
      _tryStealthKill();
    }
    // Alt+W — whistle decoy
    if (e.code === 'KeyW' && e.altKey && !e.repeat) {
      e.preventDefault();
      _throwDecoy();
    }
  }

  // ─────────────────────────────────── stealth kill
  function _tryStealthKill() {
    if (_stealthKillActive) return;
    if (window._stealthLevel >= STEALTH_KILL_THRESH) return;
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    if (!_camera) return;

    var enemies = window.Enemies.getAll();
    var camPos = _camera.position;
    var nearest = null;
    var nearestDist = Infinity;

    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;
      var dx = en.position.x - camPos.x;
      var dz = en.position.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = en;
      }
    }

    if (!nearest || nearestDist > STEALTH_KILL_RANGE) return;

    // Start kill animation
    _stealthKillActive  = true;
    _stealthKillTimer   = 0;
    _stealthKillTarget  = nearest;

    // Save camera start
    _stealthKillCamStart = {
      x: _camera.position.x,
      y: _camera.position.y,
      z: _camera.position.z,
      rx: _camera.rotation.x,
      ry: _camera.rotation.y
    };

    // Target: behind enemy
    var targetPos = {
      x: nearest.position.x - Math.sin(_camera.rotation.y) * 1.5,
      y: nearest.position.y + 1.6,
      z: nearest.position.z - Math.cos(_camera.rotation.y) * 1.5
    };
    _stealthKillCamTarget = targetPos;
  }

  function _updateStealthKill(dt) {
    if (!_stealthKillActive) return;

    _stealthKillTimer += dt;
    var t = _stealthKillTimer / STEALTH_KILL_ANIM_DUR;
    if (t > 1) t = 1;

    // Phase 1: camera lerp (0 → LERP_DUR)
    var lerpFrac = _stealthKillTimer / STEALTH_KILL_LERP_DUR;
    if (lerpFrac > 1) lerpFrac = 1;

    if (_camera && _stealthKillCamStart && _stealthKillCamTarget) {
      _camera.position.x = _stealthKillCamStart.x + (_stealthKillCamTarget.x - _stealthKillCamStart.x) * lerpFrac;
      _camera.position.y = _stealthKillCamStart.y + (_stealthKillCamTarget.y - _stealthKillCamStart.y) * lerpFrac;
      _camera.position.z = _stealthKillCamStart.z + (_stealthKillCamTarget.z - _stealthKillCamStart.z) * lerpFrac;
    }

    // Phase 2: black flash at lerp completion
    if (_stealthKillTimer >= STEALTH_KILL_LERP_DUR && _stealthKillTimer < STEALTH_KILL_LERP_DUR + STEALTH_KILL_FLASH_DUR) {
      if (_flashEl) {
        _flashEl.style.display = 'block';
        _flashEl.style.opacity = '1';
        _flashEl.style.animation = 'none';
      }
    }
    // Kill enemy at flash peak
    if (_stealthKillTimer >= STEALTH_KILL_LERP_DUR + STEALTH_KILL_FLASH_DUR * 0.5 && _stealthKillTarget) {
      if (typeof _stealthKillTarget.kill === 'function') {
        _stealthKillTarget.kill();
      } else if (typeof _stealthKillTarget.die === 'function') {
        _stealthKillTarget.die();
      }
      // Score
      if (window._score !== undefined) window._score += STEALTH_KILL_SCORE;
      // Kill feed
      _addKillFeed('STEALTH KILL');
      _stealthKillTarget = null;
    }

    // Phase 3: fade flash out and end
    if (_stealthKillTimer >= STEALTH_KILL_LERP_DUR + STEALTH_KILL_FLASH_DUR) {
      if (_flashEl) {
        var fadeProgress = (_stealthKillTimer - STEALTH_KILL_LERP_DUR - STEALTH_KILL_FLASH_DUR) /
          (STEALTH_KILL_ANIM_DUR - STEALTH_KILL_LERP_DUR - STEALTH_KILL_FLASH_DUR);
        if (fadeProgress > 1) fadeProgress = 1;
        _flashEl.style.opacity = String(1 - fadeProgress);
      }
    }

    if (_stealthKillTimer >= STEALTH_KILL_ANIM_DUR) {
      _stealthKillActive = false;
      _stealthKillTarget = null;
      if (_flashEl) {
        _flashEl.style.display = 'none';
        _flashEl.style.opacity = '0';
      }
    }
  }

  // ─────────────────────────────────── kill feed helper
  function _addKillFeed(msg) {
    if (window.KillFeed && typeof window.KillFeed.add === 'function') {
      window.KillFeed.add(msg);
      return;
    }
    // Fallback: brief on-screen message
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'letter-spacing:4px',
      'pointer-events:none',
      'z-index:600',
      'text-shadow:0 0 10px #00ff88'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
  }

  // ─────────────────────────────────── whistle decoy
  function _throwDecoy() {
    if (_decoyActive) return;
    if (!_camera) return;
    if (!_scene) return;

    _decoyActive  = true;
    _decoyLanded  = false;
    _decoyTimer   = 0;
    _decoyNoiseTimer = 0;

    // Create small sphere
    try {
      var geo = new THREE.SphereGeometry(DECOY_SPHERE_RADIUS, 6, 6);
      var mat = new THREE.MeshBasicMaterial({ color: 0x886644 });
      _decoyMesh = new THREE.Mesh(geo, mat);
      _decoyMesh.position.copy(_camera.position);
      _scene.add(_decoyMesh);
    } catch (e) {
      _decoyMesh = null;
    }

    // Launch direction — camera forward
    var fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyEuler(_camera.rotation);
    fwd.normalize();

    _decoyPos = {
      x: _camera.position.x,
      y: _camera.position.y,
      z: _camera.position.z
    };
    _decoyVel = {
      x: fwd.x * (DECOY_RANGE / 1.2),
      y: 4,
      z: fwd.z * (DECOY_RANGE / 1.2)
    };
  }

  function _updateDecoy(dt) {
    if (!_decoyActive) return;

    if (!_decoyLanded) {
      // Simple projectile arc
      _decoyVel.y -= 18 * dt;   // gravity
      _decoyPos.x += _decoyVel.x * dt;
      _decoyPos.y += _decoyVel.y * dt;
      _decoyPos.z += _decoyVel.z * dt;

      if (_decoyMesh) {
        _decoyMesh.position.set(_decoyPos.x, _decoyPos.y, _decoyPos.z);
      }

      // Landed when below ground or after 1.2s
      _decoyTimer += dt;
      if (_decoyPos.y <= 0 || _decoyTimer > 1.5) {
        _decoyPos.y = 0;
        _decoyLanded = true;
        _decoyTimer = 0;
        if (_decoyMesh) {
          _decoyMesh.position.y = 0;
        }
        _playDecoyThud();
        _attractEnemiesTo(_decoyPos.x, _decoyPos.z, DECOY_NOISE_RADIUS, DECOY_ATTRACT_DURATION);
      }
    } else {
      // Despawn after attract duration
      _decoyTimer += dt;
      if (_decoyTimer > DECOY_ATTRACT_DURATION + 0.5) {
        if (_decoyMesh && _scene) {
          _scene.remove(_decoyMesh);
          _decoyMesh = null;
        }
        _decoyActive = false;
        _decoyLanded = false;
      }
    }
  }

  function _attractEnemiesTo(wx, wz, radius, dur) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    var enemies = window.Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;
      var dx = en.position.x - wx;
      var dz = en.position.z - wz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= radius) {
        if (typeof en.investigatePoint === 'function') {
          en.investigatePoint(wx, 0, wz, dur);
        } else if (typeof en.setTarget === 'function') {
          en.setTarget({ x: wx, y: 0, z: wz });
        }
      }
    }
  }

  // ─────────────────────────────────── enemy detection checks
  function _checkEnemyDetection() {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    if (!_camera) return;

    var sl = window._stealthLevel;
    var camPos = _camera.position;
    var detected = false;

    var enemies = window.Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;

      var dx = en.position.x - camPos.x;
      var dz = en.position.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      var detRange = 0;
      if (sl > DETECT_HIGH_THRESH) {
        detRange = DETECT_HIGH_RANGE;
      } else if (sl >= DETECT_LOW_THRESH) {
        detRange = DETECT_MED_RANGE;
      } else {
        // Below 0.3 — only detect via noise
        if (_noiseLevel > 0.4 && dist < 8) {
          detRange = 8;
        }
      }

      if (detRange > 0 && dist <= detRange) {
        // Alert enemy
        if (typeof en.alertToPlayer === 'function') {
          en.alertToPlayer();
        } else if (typeof en.alert === 'function') {
          en.alert();
        }
        detected = true;
      }
    }

    if (detected) {
      if (sl > DETECT_HIGH_THRESH) {
        _triggerDetected();
      } else {
        _triggerSuspicious();
      }
    }
  }

  function _triggerSuspicious() {
    if (_detectWarnTimer > 0) return;
    _detectWarnTimer = DETECTION_WARN_DUR;
    if (_eyeIconEl) {
      _eyeIconEl.style.display = 'block';
      _eyeIconEl.style.color = '#ffcc00';
      _eyeIconEl.style.animation = 'stealthEyePulse 0.5s ease-in-out infinite';
    }
  }

  function _triggerDetected() {
    if (_detectedTimer > 0) return;
    _detectedTimer = DETECTED_WARN_DUR;
    if (_alertBannerEl) {
      _alertBannerEl.style.display = 'block';
      _alertBannerEl.style.color = '#ff3333';
    }
    if (_eyeIconEl) {
      _eyeIconEl.style.display = 'block';
      _eyeIconEl.style.color = '#ff3333';
      _eyeIconEl.style.animation = 'stealthEyePulse 0.3s ease-in-out infinite';
    }
  }

  function _updateDetectionWarnings(dt) {
    if (_detectWarnTimer > 0) {
      _detectWarnTimer -= dt;
      if (_detectWarnTimer <= 0) {
        _detectWarnTimer = 0;
        if (_eyeIconEl && _detectedTimer <= 0) {
          _eyeIconEl.style.display = 'none';
          _eyeIconEl.style.animation = 'none';
        }
      }
    }

    if (_detectedTimer > 0) {
      _detectedTimer -= dt;
      if (_detectedTimer <= 0) {
        _detectedTimer = 0;
        if (_alertBannerEl) {
          _alertBannerEl.style.display = 'none';
        }
        if (_eyeIconEl) {
          _eyeIconEl.style.display = 'none';
          _eyeIconEl.style.animation = 'none';
        }
      }
    }
  }

  // ─────────────────────────────────── NightAssault light check
  function _getLightVisibilityModifier() {
    if (window.NightAssault && typeof window.NightAssault.getAmbientLight === 'function') {
      var light = window.NightAssault.getAmbientLight();   // 0-1
      return light * 0.3;   // bright light adds up to 0.3 to visibility
    }
    return 0;
  }

  // ─────────────────────────────────── public API
  function init(scene, camera) {
    if (_inited) return;
    _inited = true;
    _scene  = scene;
    _camera = camera;

    _buildHUD();
    document.addEventListener('keydown', _onKeyDown);
  }

  function onPlayerFired() {
    // Suppressor reduces noise/visibility
    var suppressMult = (window._suppressed === true) ? 0.25 : 1.0;
    _noiseLevel = Math.min(1, NOISE_FIRE_LEVEL * suppressMult);
    _firedTimer = VISIBILITY_FIRED_DECAY;
  }

  function onPlayerMoved(speed) {
    // speed: 0 = still/crouch, 1 = walk, 2 = sprint
    _moveSpeed   = speed;
    _isCrouching = (speed === 0);
  }

  function getStealthLevel() {
    return window._stealthLevel;
  }

  function update(dt) {
    if (!_inited) return;

    // ── Ghost mode override
    if ((window.PowerupSystem && window._ghostMode) || window._ghostMode) {
      window._stealthLevel = 0;
      _stealthLevel = 0;
      _drawNoiseMeter(0);
      _drawEyeMeter(0);
      _updateDecoy(dt);
      _updateDetectionWarnings(dt);
      return;
    }

    // ── Noise meter update
    var targetNoise = NOISE_CROUCH_LEVEL;
    if (_moveSpeed >= 2) {
      targetNoise = NOISE_SPRINT_LEVEL;
    } else if (_moveSpeed === 1) {
      targetNoise = NOISE_WALK_LEVEL;
    }
    if (_firedTimer > 0) {
      var suppressMult = (window._suppressed === true) ? 0.25 : 1.0;
      targetNoise = Math.max(targetNoise, NOISE_FIRE_LEVEL * suppressMult);
    }

    if (targetNoise > _noiseLevel) {
      _noiseLevel = targetNoise;
    } else {
      _noiseLevel -= NOISE_DECAY_RATE * dt;
      if (_noiseLevel < 0) _noiseLevel = 0;
    }

    // ── Visibility update
    var baseVis = VISIBILITY_CROUCHING;
    if (_moveSpeed >= 2) {
      baseVis = VISIBILITY_RUNNING;
    } else if (_moveSpeed === 1) {
      baseVis = VISIBILITY_WALKING;
    }

    if (_firedTimer > 0) {
      _firedTimer -= dt;
      var suppressMult2 = (window._suppressed === true) ? 0.25 : 1.0;
      baseVis = Math.max(baseVis, VISIBILITY_FIRED_LEVEL * suppressMult2);
      if (_firedTimer < 0) _firedTimer = 0;
    }

    baseVis += _getLightVisibilityModifier();
    if (baseVis > 1) baseVis = 1;
    if (baseVis < 0) baseVis = 0;

    _stealthLevel = baseVis;
    window._stealthLevel = _stealthLevel;

    // ── Footstep audio + noise radius
    if (_moveSpeed > 0) {
      var footInterval = (_moveSpeed >= 2) ? FOOTSTEP_RUN_INTERVAL : FOOTSTEP_WALK_INTERVAL;
      _footstepTimer -= dt;
      if (_footstepTimer <= 0) {
        _footstepTimer = footInterval;
        _playFootstepNoise();
        var noiseRad = (_moveSpeed >= 2) ? 14 : FOOTSTEP_NOISE_RADIUS;
        _alertEnemiesInRange(noiseRad);
      }
    } else {
      _footstepTimer = 0;
    }

    // ── Enemy detection
    _checkEnemyDetection();

    // ── Sub-updates
    _updateStealthKill(dt);
    _updateDecoy(dt);
    _updateDetectionWarnings(dt);

    // ── HUD
    _drawNoiseMeter(_noiseLevel);
    _drawEyeMeter(_stealthLevel);
  }

  function _alertEnemiesInRange(radius) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    if (!_camera) return;
    var camPos = _camera.position;
    var enemies = window.Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;
      var dx = en.position.x - camPos.x;
      var dz = en.position.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= radius) {
        if (typeof en.heardNoise === 'function') {
          en.heardNoise(camPos.x, camPos.z);
        } else if (typeof en.investigatePoint === 'function') {
          en.investigatePoint(camPos.x, camPos.y, camPos.z, 2);
        }
      }
    }
  }

  function reset() {
    _noiseLevel         = 0;
    _stealthLevel       = 0;
    window._stealthLevel = 0;
    _firedTimer         = 0;
    _moveSpeed          = 0;
    _isCrouching        = false;
    _footstepTimer      = 0;
    _stealthKillActive  = false;
    _stealthKillTimer   = 0;
    _stealthKillTarget  = null;
    _decoyActive        = false;
    _decoyLanded        = false;
    _decoyTimer         = 0;
    _detectWarnTimer    = 0;
    _detectedTimer      = 0;

    if (_decoyMesh && _scene) {
      _scene.remove(_decoyMesh);
      _decoyMesh = null;
    }
    if (_flashEl) {
      _flashEl.style.display = 'none';
      _flashEl.style.opacity = '0';
    }
    if (_eyeIconEl) {
      _eyeIconEl.style.display = 'none';
    }
    if (_alertBannerEl) {
      _alertBannerEl.style.display = 'none';
    }

    _drawNoiseMeter(0);
    _drawEyeMeter(0);
  }

  return {
    init: init,
    update: update,
    onPlayerFired: onPlayerFired,
    onPlayerMoved: onPlayerMoved,
    getStealthLevel: getStealthLevel,
    reset: reset
  };

})();
