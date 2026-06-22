window.PlayerCallouts = (function() {
  'use strict';

  var CALLOUT_TEXT = {
    RELOAD:        'Reloading!',
    LOW_AMMO:      'Running low!',
    GRENADE_OUT:   'Frag out!',
    CONTACT:       'Contact!',
    DOWN:          'Man down!',
    KNIFE:         'Going blade!',
    VEHICLE:       'Vehicle engaged!',
    BOMB_SPOTTED:  'Found the bomb!',
    EXTRACTION:    'Extraction inbound!',
    WAVE_CLEAR:    'Area clear!',
    KILLSTREAK_5:  'Five kills!',
    SNIPER:        'Sniper!'
  };

  var GLOBAL_COOLDOWN_MS = 3000;
  var SAME_TYPE_COOLDOWN_MS = 8000;
  var RATE_WINDOW_MS = 5000;
  var RATE_MAX = 2;
  var SUBTITLE_DURATION_MS = 2000;

  var _enabled = true;
  var _speechAvailable = false;
  var _subtitleEl = null;
  var _subtitleTimer = null;

  var _lastCalloutTime = 0;
  var _lastCalloutByType = {};
  var _recentCallouts = [];

  var _lastSniperAlerted = false;

  function _loadEnabled() {
    try {
      var stored = localStorage.getItem('calloutsEnabled');
      if (stored !== null) {
        _enabled = stored !== 'false';
      }
    } catch (e) {
      _enabled = true;
    }
  }

  function _saveEnabled() {
    try {
      localStorage.setItem('calloutsEnabled', String(_enabled));
    } catch (e) {}
  }

  function _initSubtitleEl() {
    if (_subtitleEl) return;
    _subtitleEl = document.createElement('div');
    _subtitleEl.id = 'callout-subtitle';
    _subtitleEl.style.cssText = [
      'position: fixed',
      'bottom: 60px',
      'left: 50%',
      'transform: translateX(-50%)',
      'color: #4cff4c',
      'background: rgba(0,0,0,0.55)',
      'font-family: monospace',
      'font-size: 18px',
      'font-weight: bold',
      'padding: 6px 18px',
      'border-radius: 4px',
      'letter-spacing: 0.08em',
      'pointer-events: none',
      'z-index: 99999',
      'display: none',
      'text-shadow: 0 0 6px #000'
    ].join(';');
    document.body.appendChild(_subtitleEl);
  }

  function _showSubtitle(text) {
    if (!_subtitleEl) _initSubtitleEl();
    if (_subtitleTimer) {
      clearTimeout(_subtitleTimer);
      _subtitleTimer = null;
    }
    _subtitleEl.textContent = '◙ ' + text;
    _subtitleEl.style.display = 'block';
    _subtitleTimer = setTimeout(function() {
      if (_subtitleEl) _subtitleEl.style.display = 'none';
      _subtitleTimer = null;
    }, SUBTITLE_DURATION_MS);
  }

  function _speakOrFallback(text) {
    _showSubtitle(text);
    if (!_speechAvailable) return;
    try {
      var utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'en-US';
      utt.rate = 1.0;
      utt.pitch = 0.85;
      utt.volume = 0.7;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    } catch (e) {
      // fall back to subtitle only
    }
  }

  function _canCallout(type) {
    if (!_enabled) return false;
    var now = Date.now();

    if ((now - _lastCalloutTime) < GLOBAL_COOLDOWN_MS) return false;

    var lastSame = _lastCalloutByType[type] || 0;
    if ((now - lastSame) < SAME_TYPE_COOLDOWN_MS) return false;

    var cutoff = now - RATE_WINDOW_MS;
    var recent = 0;
    for (var i = 0; i < _recentCallouts.length; i++) {
      if (_recentCallouts[i] >= cutoff) recent++;
    }
    if (recent >= RATE_MAX) return false;

    return true;
  }

  function _recordCallout(type) {
    var now = Date.now();
    _lastCalloutTime = now;
    _lastCalloutByType[type] = now;
    _recentCallouts.push(now);
    var cutoff = now - RATE_WINDOW_MS;
    var kept = [];
    for (var i = 0; i < _recentCallouts.length; i++) {
      if (_recentCallouts[i] >= cutoff) kept.push(_recentCallouts[i]);
    }
    _recentCallouts = kept;
  }

  function callout(type, data) {
    if (!CALLOUT_TEXT[type]) return;
    if (!_canCallout(type)) return;
    _recordCallout(type);
    _speakOrFallback(CALLOUT_TEXT[type]);
  }

  function update(dt) {
    if (typeof window._onReloadForCallout !== 'undefined' && window._onReloadForCallout) {
      window._onReloadForCallout = false;
      callout('RELOAD');
    }

    if (typeof window._activeSniperCount !== 'undefined' &&
        window._activeSniperCount > 0 &&
        typeof window._playerAlerted !== 'undefined' &&
        window._playerAlerted) {
      if (!_lastSniperAlerted) {
        _lastSniperAlerted = true;
        callout('SNIPER');
      }
    } else {
      _lastSniperAlerted = false;
    }
  }

  function reset() {
    _lastCalloutTime = 0;
    _lastCalloutByType = {};
    _recentCallouts = [];
    _lastSniperAlerted = false;
    if (_subtitleTimer) {
      clearTimeout(_subtitleTimer);
      _subtitleTimer = null;
    }
    if (_subtitleEl) {
      _subtitleEl.style.display = 'none';
    }
    if (_speechAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  function init() {
    _loadEnabled();

    _speechAvailable = !!(window.speechSynthesis &&
      typeof SpeechSynthesisUtterance !== 'undefined');

    Object.defineProperty(window, '_calloutsEnabled', {
      get: function() { return _enabled; },
      set: function(v) {
        _enabled = !!v;
        _saveEnabled();
      },
      configurable: true
    });

    if (document.body) {
      _initSubtitleEl();
    } else {
      document.addEventListener('DOMContentLoaded', _initSubtitleEl);
    }
  }

  return {
    init: init,
    callout: callout,
    update: update,
    reset: reset
  };
})();
