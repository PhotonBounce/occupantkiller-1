window.BloodMoon = (function() {
  'use strict';

  var DURATION = 90;
  var FADE_OUT_DURATION = 10;
  var TRIGGER_CHANCE = 0.10;
  var TRIGGER_WAVE = 8;
  var TRIGGER_STREAK = 25;
  var DRONE_FREQ = 55;
  var DRONE_RAMP_TIME = 5;

  var _active = false;
  var _timeRemaining = 0;
  var _fadingOut = false;
  var _fadeOutTimer = 0;
  var _droneOscillator = null;
  var _droneGain = null;
  var _audioCtx = null;
  var _vignetteEl = null;
  var _timerEl = null;
  var _bannerEl = null;
  var _originalFogColor = null;
  var _originalAmbientColor = null;
  var _originalCanvasFilter = null;
  var _playerDamageMult = 1;
  var _elapsedSinceStart = 0;

  function _getCanvas() {
    return document.querySelector('canvas');
  }

  function _createVignette() {
    if (_vignetteEl) return;
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'blood-moon-vignette';
    _vignetteEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9000',
      'background:radial-gradient(ellipse at center, transparent 55%, rgba(120,0,0,0.55) 100%)',
      'opacity:0',
      'transition:opacity 2s ease'
    ].join(';');
    document.body.appendChild(_vignetteEl);
  }

  function _createTimer() {
    if (_timerEl) return;
    _timerEl = document.createElement('div');
    _timerEl.id = 'blood-moon-timer';
    _timerEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:16px',
      'color:#FF2222',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'text-shadow:0 0 8px #FF0000',
      'pointer-events:none',
      'z-index:9100',
      'display:none'
    ].join(';');
    document.body.appendChild(_timerEl);
  }

  function _createBanner() {
    if (_bannerEl) return;
    _bannerEl = document.createElement('div');
    _bannerEl.id = 'blood-moon-banner';
    _bannerEl.textContent = 'BLOOD MOON RISING';
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#CC0000',
      'font-family:serif',
      'font-size:72px',
      'font-weight:bold',
      'text-shadow:0 0 30px #FF0000, 0 0 60px #880000',
      'pointer-events:none',
      'z-index:9200',
      'opacity:0',
      'transition:opacity 1s ease',
      'white-space:nowrap',
      'letter-spacing:6px',
      'text-transform:uppercase'
    ].join(';');
    document.body.appendChild(_bannerEl);
  }

  function _showBanner() {
    if (!_bannerEl) return;
    _bannerEl.style.opacity = '1';
    setTimeout(function() {
      if (_bannerEl) _bannerEl.style.opacity = '0';
    }, 3000);
  }

  function _startDrone() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _droneOscillator = _audioCtx.createOscillator();
      _droneGain = _audioCtx.createGain();
      _droneOscillator.type = 'sine';
      _droneOscillator.frequency.setValueAtTime(DRONE_FREQ, _audioCtx.currentTime);
      _droneGain.gain.setValueAtTime(0, _audioCtx.currentTime);
      _droneGain.gain.linearRampToValueAtTime(0.18, _audioCtx.currentTime + DRONE_RAMP_TIME);
      _droneOscillator.connect(_droneGain);
      _droneGain.connect(_audioCtx.destination);
      _droneOscillator.start();
    } catch (e) {
      // Audio not available -- silently ignore
    }
  }

  function _stopDrone() {
    try {
      if (_droneGain && _audioCtx) {
        _droneGain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 2);
      }
      if (_droneOscillator) {
        _droneOscillator.stop(_audioCtx ? _audioCtx.currentTime + 2.1 : 0);
        _droneOscillator = null;
      }
      _droneGain = null;
    } catch (e) {
      // Ignore
    }
  }

  function _tintHUD(on) {
    var selectors = [
      '#hud', '.hud', '#score', '.score',
      '#health', '.health', '#ammo', '.ammo',
      '#wave', '.wave', '#crosshair', '.crosshair'
    ];
    var i, els, j;
    for (i = 0; i < selectors.length; i++) {
      els = document.querySelectorAll(selectors[i]);
      for (j = 0; j < els.length; j++) {
        if (on) {
          els[j].style.filter = 'sepia(0.6) hue-rotate(-20deg) saturate(3)';
        } else {
          els[j].style.filter = '';
        }
      }
    }
  }

  function _formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return 'BLOOD MOON: ' + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _updateVignettePulse(elapsed) {
    if (!_vignetteEl || !_active) return;
    var pulse = 0.75 + 0.25 * Math.sin(elapsed * 1.2);
    _vignetteEl.style.opacity = String(pulse);
  }

  function _awardBadge() {
    var badge = document.createElement('div');
    badge.textContent = '🌑 BLOOD MOON';
    badge.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FFD700',
      'font-family:serif',
      'font-size:48px',
      'font-weight:bold',
      'text-shadow:0 0 20px #FFA500',
      'pointer-events:none',
      'z-index:9300',
      'opacity:0',
      'transition:opacity 0.8s ease'
    ].join(';');
    document.body.appendChild(badge);
    setTimeout(function() { badge.style.opacity = '1'; }, 50);
    setTimeout(function() {
      badge.style.transition = 'opacity 1.5s ease';
      badge.style.opacity = '0';
      setTimeout(function() {
        if (badge.parentNode) badge.parentNode.removeChild(badge);
      }, 1600);
    }, 3000);
  }

  function _beginFadeOut() {
    _fadingOut = true;
    _fadeOutTimer = 0;

    window._fogColor = _originalFogColor || window._fogColor;
    window._ambientLightColor = _originalAmbientColor || window._ambientLightColor;

    var canvas = _getCanvas();
    if (canvas) {
      canvas.style.transition = 'filter ' + FADE_OUT_DURATION + 's ease';
      canvas.style.filter = _originalCanvasFilter !== null ? _originalCanvasFilter : '';
    }

    if (_vignetteEl) {
      _vignetteEl.style.transition = 'opacity ' + FADE_OUT_DURATION + 's ease';
      _vignetteEl.style.opacity = '0';
    }

    _stopDrone();
    _tintHUD(false);
  }

  function _activate() {
    if (_active) return;
    _active = true;
    _timeRemaining = DURATION;
    _fadingOut = false;
    _fadeOutTimer = 0;
    _elapsedSinceStart = 0;

    window._bloodMoonActive = true;
    window._bloodMoonSpeedMult = 1.25;
    window._bloodMoonHPMult = 1.3;
    window._bloodMoonScoreMult = 3;
    _playerDamageMult = 1.2;

    _originalFogColor = window._fogColor !== undefined ? window._fogColor : null;
    _originalAmbientColor = window._ambientLightColor !== undefined ? window._ambientLightColor : null;

    window._fogColor = '#4A0000';
    window._ambientLightColor = '#CC0000';

    var canvas = _getCanvas();
    if (canvas) {
      _originalCanvasFilter = canvas.style.filter || '';
      canvas.style.transition = '';
      canvas.style.filter = 'sepia(0.4) hue-rotate(-20deg)';
    }

    if (_vignetteEl) {
      _vignetteEl.style.transition = 'opacity 2s ease';
      _vignetteEl.style.opacity = '0.75';
    }

    if (_timerEl) {
      _timerEl.style.display = 'block';
      _timerEl.textContent = _formatTime(DURATION);
    }

    _showBanner();
    _startDrone();
    _tintHUD(true);

    if (typeof window._onBloodMoonStart === 'function') {
      window._onBloodMoonStart();
    }
  }

  function _deactivate() {
    if (!_active && !_fadingOut) return;
    _active = false;
    _fadingOut = false;

    window._bloodMoonActive = false;
    window._bloodMoonSpeedMult = 1;
    window._bloodMoonHPMult = 1;
    window._bloodMoonScoreMult = 1;
    _playerDamageMult = 1;

    if (_originalFogColor !== null) {
      window._fogColor = _originalFogColor;
    }
    if (_originalAmbientColor !== null) {
      window._ambientLightColor = _originalAmbientColor;
    }

    var canvas = _getCanvas();
    if (canvas) {
      canvas.style.transition = 'filter ' + FADE_OUT_DURATION + 's ease';
      canvas.style.filter = _originalCanvasFilter !== null ? _originalCanvasFilter : '';
    }

    if (_vignetteEl) {
      _vignetteEl.style.transition = 'opacity ' + FADE_OUT_DURATION + 's ease';
      _vignetteEl.style.opacity = '0';
    }

    if (_timerEl) {
      _timerEl.style.display = 'none';
    }

    _stopDrone();
    _tintHUD(false);
    _awardBadge();

    if (typeof window._onBloodMoonEnd === 'function') {
      window._onBloodMoonEnd();
    }
  }

  function init() {
    _createVignette();
    _createTimer();
    _createBanner();

    window._bloodMoonActive = false;
    window._bloodMoonSpeedMult = 1;
    window._bloodMoonHPMult = 1;
    window._bloodMoonScoreMult = 1;
  }

  function update(dt) {
    if (!_active && !_fadingOut) return;

    if (_fadingOut) {
      _fadeOutTimer += dt;
      if (_fadeOutTimer >= FADE_OUT_DURATION) {
        _deactivate();
      }
      return;
    }

    _elapsedSinceStart += dt;
    _timeRemaining -= dt;
    _updateVignettePulse(_elapsedSinceStart);

    if (_timerEl) {
      _timerEl.textContent = _formatTime(Math.max(0, _timeRemaining));
    }

    if (_timeRemaining <= 0) {
      _beginFadeOut();
    }
  }

  function trigger() {
    if (_active || _fadingOut) return;
    _activate();
  }

  function reset() {
    _deactivate();
    _timeRemaining = 0;
    _fadingOut = false;
    _fadeOutTimer = 0;
    _elapsedSinceStart = 0;
  }

  function checkTriggerConditions(wave, killStreak) {
    if (_active || _fadingOut) return false;
    if (killStreak >= TRIGGER_STREAK) {
      trigger();
      return true;
    }
    if (wave >= TRIGGER_WAVE && Math.random() < TRIGGER_CHANCE) {
      trigger();
      return true;
    }
    return false;
  }

  function getPlayerDamageMult() {
    return _playerDamageMult;
  }

  return {
    init: init,
    update: update,
    trigger: trigger,
    reset: reset,
    checkTriggerConditions: checkTriggerConditions,
    getPlayerDamageMult: getPlayerDamageMult
  };
})();
