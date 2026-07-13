window.PlayerDeathSequence = (function() {
  'use strict';

  // --- State ---
  var _active = false;
  var _phase = 'idle'; // idle | fall | pan | overlay | stats | respawn | wipe
  var _phaseStartTime = 0;
  var _killerPos = null;

  var _camera = null;
  var _scene = null;

  // Camera snapshot at death
  var _deathCamPos = null;
  var _deathCamRot = null;
  var _deathRoll = 0;

  // Overlay DOM elements
  var _overlay = null;
  var _killText = null;
  var _statsPanel = null;
  var _respawnTimer = null;
  var _wipeEl = null;

  // Respawn countdown
  var _respawnSecs = 5;
  var _lastCountSec = -1;

  // Audio context
  var _audioCtx = null;

  // --- Init ---
  function init(camera, scene) {
    _camera = camera;
    _scene = scene;

    _buildOverlayDOM();

    // Hook into window._onPlayerDamage
    var originalOnDamage = window._onPlayerDamage;
    window._onPlayerDamage = function(hp, killerPosition) {
      if (originalOnDamage) originalOnDamage(hp, killerPosition);
      if (hp <= 0 && !_active) {
        triggerDeath(killerPosition);
      }
    };
  }

  // --- DOM Construction ---
  function _buildOverlayDOM() {
    // Main overlay container
    _overlay = document.createElement('div');
    _overlay.id = 'pds-overlay';
    _overlay.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'width:100%', 'height:100%',
      'pointer-events:none',
      'display:none',
      'z-index:9999',
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
      'filter:saturate(0)',
      'transition:filter 0.5s'
    ].join(';');
    document.body.appendChild(_overlay);

    // Red pulse overlay
    var redPulse = document.createElement('div');
    redPulse.id = 'pds-red-pulse';
    redPulse.style.cssText = [
      'position:absolute',
      'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:radial-gradient(ellipse at center, rgba(180,0,0,0.25) 0%, transparent 70%)',
      'animation:pds-pulse 1.5s ease-in-out infinite'
    ].join(';');
    _overlay.appendChild(redPulse);

    // Kill attribution text
    _killText = document.createElement('div');
    _killText.id = 'pds-kill-text';
    _killText.style.cssText = [
      'position:absolute',
      'bottom:38%',
      'left:0', 'width:100%',
      'text-align:center',
      'color:#fff',
      'font-family:"Arial Black",Arial,sans-serif',
      'font-size:28px',
      'font-weight:900',
      'letter-spacing:3px',
      'text-shadow:0 0 12px rgba(255,0,0,0.8), 2px 2px 4px #000',
      'transform:translateY(60px)',
      'opacity:0',
      'transition:transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s'
    ].join(';');
    _overlay.appendChild(_killText);

    // Stats panel
    _statsPanel = document.createElement('div');
    _statsPanel.id = 'pds-stats';
    _statsPanel.style.cssText = [
      'position:absolute',
      'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid rgba(255,255,255,0.2)',
      'border-radius:6px',
      'padding:20px 36px',
      'color:#eee',
      'font-family:Arial,sans-serif',
      'font-size:15px',
      'line-height:2',
      'text-align:center',
      'display:none',
      'min-width:220px'
    ].join(';');
    _overlay.appendChild(_statsPanel);

    // Respawn countdown
    _respawnTimer = document.createElement('div');
    _respawnTimer.id = 'pds-respawn';
    _respawnTimer.style.cssText = [
      'position:absolute',
      'bottom:22%',
      'left:0', 'width:100%',
      'text-align:center',
      'color:#fff',
      'font-family:"Arial Black",Arial,sans-serif',
      'font-size:22px',
      'font-weight:700',
      'letter-spacing:2px',
      'text-shadow:1px 1px 6px #000',
      'display:none'
    ].join(';');
    _overlay.appendChild(_respawnTimer);

    // Screen wipe
    _wipeEl = document.createElement('div');
    _wipeEl.id = 'pds-wipe';
    _wipeEl.style.cssText = [
      'position:fixed',
      'top:-6px', 'left:0', 'width:100%', 'height:6px',
      'background:#fff',
      'box-shadow:0 0 18px 8px #fff',
      'z-index:10001',
      'display:none',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_wipeEl);

    // Inject keyframe animations
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes pds-pulse {',
      '  0%,100% { opacity:0.15; }',
      '  50% { opacity:0.55; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // --- Audio ---
  function _ensureAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {}
    }
  }

  function _playDeathAudio() {
    _ensureAudioCtx();
    if (!_audioCtx) return;

    // 1) Bass thud — 60Hz, 0.3s
    var thudOsc = _audioCtx.createOscillator();
    var thudGain = _audioCtx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(60, _audioCtx.currentTime);
    thudOsc.frequency.exponentialRampToValueAtTime(20, _audioCtx.currentTime + 0.3);
    thudGain.gain.setValueAtTime(0.7, _audioCtx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3);
    thudOsc.connect(thudGain);
    thudGain.connect(_audioCtx.destination);
    thudOsc.start(_audioCtx.currentTime);
    thudOsc.stop(_audioCtx.currentTime + 0.31);

    // 2) Flatline tone — 1000Hz sine, 1s (starts after 0.3s)
    var flatOsc = _audioCtx.createOscillator();
    var flatGain = _audioCtx.createGain();
    flatOsc.type = 'sine';
    flatOsc.frequency.setValueAtTime(1000, _audioCtx.currentTime + 0.3);
    flatGain.gain.setValueAtTime(0.0, _audioCtx.currentTime + 0.3);
    flatGain.gain.linearRampToValueAtTime(0.25, _audioCtx.currentTime + 0.5);
    flatGain.gain.setValueAtTime(0.25, _audioCtx.currentTime + 1.1);
    flatGain.gain.linearRampToValueAtTime(0.0, _audioCtx.currentTime + 1.3);
    flatOsc.connect(flatGain);
    flatGain.connect(_audioCtx.destination);
    flatOsc.start(_audioCtx.currentTime + 0.3);
    flatOsc.stop(_audioCtx.currentTime + 1.35);
  }

  // --- Trigger ---
  function triggerDeath(killerPosition) {
    if (_active) return;

    // Skip if kill-cam is handling it
    if (window._killCamActive) return;

    _active = true;
    _killerPos = killerPosition || null;
    _respawnSecs = 5;
    _lastCountSec = -1;

    // Snapshot camera state
    if (_camera) {
      _deathCamPos = { x: _camera.position.x, y: _camera.position.y, z: _camera.position.z };
      _deathCamRot = { x: _camera.rotation.x, y: _camera.rotation.y, z: _camera.rotation.z };
    }

    // Random death roll ±0.1
    _deathRoll = (Math.random() * 0.2) - 0.1;

    _playDeathAudio();
    _showOverlay();
    _setPhase('fall');
  }

  // --- Phase management ---
  function _setPhase(name) {
    _phase = name;
    _phaseStartTime = performance.now();
  }

  // --- Overlay show/hide ---
  function _showOverlay() {
    _overlay.style.display = 'block';
    _overlay.style.filter = 'saturate(0)';
    _killText.style.transform = 'translateY(60px)';
    _killText.style.opacity = '0';
    _statsPanel.style.display = 'none';
    _respawnTimer.style.display = 'none';
  }

  function _hideOverlay() {
    _overlay.style.display = 'none';
  }

  // --- Kill text slide in ---
  function _showKillText(killerPos) {
    var txt = (killerPos) ? 'KILLED BY ENEMY SNIPER' : 'ELIMINATED';
    _killText.textContent = txt;
    // Force reflow to restart transition
    void _killText.offsetWidth;
    _killText.style.transform = 'translateY(0)';
    _killText.style.opacity = '1';

    // Hide kill text after 2s
    setTimeout(function() {
      _killText.style.opacity = '0';
    }, 2000);
  }

  // --- Stats panel ---
  function _showStats() {
    var kills = (typeof window._killsThisRun !== 'undefined') ? window._killsThisRun : 0;
    var waves = (typeof window._wavesSurvived !== 'undefined') ? window._wavesSurvived : 0;
    var shotsHit = (typeof window._shotsHit !== 'undefined') ? window._shotsHit : 0;
    var shotsFired = (typeof window._shotsFired !== 'undefined') ? window._shotsFired : 0;
    var accuracy = (shotsFired > 0) ? Math.round((shotsHit / shotsFired) * 100) : 0;
    var streak = (typeof window._longestKillstreak !== 'undefined') ? window._longestKillstreak : 0;

    _statsPanel.innerHTML = [
      '<div style="font-size:18px;font-weight:bold;letter-spacing:2px;margin-bottom:8px;color:#f88">MATCH STATS</div>',
      '<div>Kills This Run: <b>' + kills + '</b></div>',
      '<div>Waves Survived: <b>' + waves + '</b></div>',
      '<div>Accuracy: <b>' + accuracy + '%</b></div>',
      '<div>Longest Killstreak: <b>' + streak + '</b></div>'
    ].join('');

    _statsPanel.style.display = 'block';

    // Auto-hide after 4s
    setTimeout(function() {
      _statsPanel.style.display = 'none';
    }, 4000);
  }

  // --- Respawn countdown ---
  function _startRespawnCountdown() {
    _respawnTimer.style.display = 'block';
    _respawnSecs = 5;
    _lastCountSec = -1;
  }

  function _doRespawn() {
    _respawnTimer.style.display = 'none';
    _startWipe();
  }

  // --- Screen wipe ---
  function _startWipe() {
    _setPhase('wipe');
    _wipeEl.style.display = 'block';
    _wipeEl.style.top = '-6px';
  }

  function _updateWipe(elapsed) {
    var duration = 500; // 0.5s
    var pct = Math.min(elapsed / duration, 1);
    var windowH = window.innerHeight;
    var topPx = pct * (windowH + 12) - 6;
    _wipeEl.style.top = topPx + 'px';

    if (pct >= 1) {
      _wipeEl.style.display = 'none';
      _finishRespawn();
    }
  }

  function _finishRespawn() {
    _hideOverlay();
    _active = false;
    _phase = 'idle';
    _killerPos = null;

    if (window.GameManager && typeof window.GameManager.respawnPlayer === 'function') {
      window.GameManager.respawnPlayer();
    } else if (typeof window._respawnPlayer === 'function') {
      window._respawnPlayer();
    }
  }

  // --- Math helpers ---
  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // Compute a target rotation.y to look from camera toward killerPos
  function _rotationYToward(camPos, target) {
    var dx = target.x - camPos.x;
    var dz = target.z - camPos.z;
    return Math.atan2(dx, dz);
  }

  // Compute a target rotation.x to look slightly down toward killerPos
  function _rotationXToward(camPos, target) {
    var dx = target.x - camPos.x;
    var dy = target.y - camPos.y;
    var dz = target.z - camPos.z;
    var hDist = Math.sqrt(dx * dx + dz * dz);
    return -Math.atan2(dy, hDist);
  }

  // Shortest angle delta
  function _angleDelta(from, to) {
    var d = to - from;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  // --- Update (called every frame) ---
  function update() {
    if (!_active || _phase === 'idle') return;

    var now = performance.now();
    var elapsed = now - _phaseStartTime;

    if (_phase === 'fall') {
      _updateFall(elapsed);
    } else if (_phase === 'pan') {
      _updatePan(elapsed);
    } else if (_phase === 'overlay') {
      _updateOverlayPhase(elapsed);
    } else if (_phase === 'respawn') {
      _updateRespawnPhase(elapsed);
    } else if (_phase === 'wipe') {
      _updateWipe(elapsed);
    }
  }

  // Phase: camera fall (1.5s)
  function _updateFall(elapsed) {
    var duration = 1500;
    var t = _clamp(elapsed / duration, 0, 1);
    // Ease-out
    var ease = 1 - Math.pow(1 - t, 3);

    if (_camera && _deathCamPos && _deathCamRot) {
      // rotation.x: gradually increases to -0.3 (looking down)
      _camera.rotation.x = _lerp(_deathCamRot.x, -0.3, ease);
      // position.y: decreases 0.3 units
      _camera.position.y = _deathCamPos.y - (ease * 0.3);
      // roll: random ±0.1
      _camera.rotation.z = _lerp(_deathCamRot.z, _deathRoll, ease);
    }

    if (t >= 1) {
      // Transition to pan or overlay
      if (_killerPos) {
        _setPhase('pan');
      } else {
        _showKillText(null);
        _setPhase('overlay');
      }
    }
  }

  // Phase: killer pan (1.2s)
  function _updatePan(elapsed) {
    var duration = 1200;
    var t = _clamp(elapsed / duration, 0, 1);
    var ease = 1 - Math.pow(1 - t, 2);

    if (_camera && _killerPos) {
      var camPos = _camera.position;
      var targetY = _rotationYToward(camPos, _killerPos);
      var targetX = _rotationXToward(camPos, _killerPos);
      var currentX = _camera.rotation.x;
      var currentY = _camera.rotation.y;

      var deltaX = _angleDelta(currentX, targetX);
      var deltaY = _angleDelta(currentY, targetY);

      _camera.rotation.x = currentX + deltaX * ease * (elapsed / duration < 0.05 ? 0.1 : 0.07);
      _camera.rotation.y = currentY + deltaY * ease * (elapsed / duration < 0.05 ? 0.1 : 0.07);

      // Clamp to avoid overshoot after convergence
      if (t > 0.8) {
        _camera.rotation.x = _lerp(_camera.rotation.x, targetX, 0.15);
        _camera.rotation.y = _lerp(_camera.rotation.y, targetY, 0.15);
      }
    }

    // Show kill text at start of pan
    if (elapsed < 50) {
      _showKillText(_killerPos);
    }

    if (t >= 1) {
      _setPhase('overlay');
    }
  }

  // Phase: overlay / stats (2s then stats 4s)
  function _updateOverlayPhase(elapsed) {
    var statsDelay = 2000;

    if (elapsed >= statsDelay && _statsPanel.style.display === 'none') {
      _showStats();
      _startRespawnCountdown();
      _setPhase('respawn');
    }
  }

  // Phase: respawn countdown
  function _updateRespawnPhase(elapsed) {
    var remaining = Math.max(0, Math.ceil(5 - elapsed / 1000));
    if (remaining !== _lastCountSec) {
      _lastCountSec = remaining;
      _respawnTimer.textContent = 'RESPAWNING IN ' + remaining + '...';
    }

    if (elapsed >= 5000) {
      _doRespawn();
    }
  }

  // --- Reset ---
  function reset() {
    _active = false;
    _phase = 'idle';
    _killerPos = null;
    _deathCamPos = null;
    _deathCamRot = null;
    _lastCountSec = -1;

    if (_overlay) _overlay.style.display = 'none';
    if (_statsPanel) _statsPanel.style.display = 'none';
    if (_respawnTimer) _respawnTimer.style.display = 'none';
    if (_wipeEl) _wipeEl.style.display = 'none';
    if (_killText) {
      _killText.style.opacity = '0';
      _killText.style.transform = 'translateY(60px)';
    }
  }

  return {
    init: init,
    update: update,
    triggerDeath: triggerDeath,
    reset: reset
  };
})();
