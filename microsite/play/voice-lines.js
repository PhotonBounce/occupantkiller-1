/* ============================================================
 *  VOICE-LINES.JS — Tactical speech callouts via Web Speech API (passive)
 *
 *  Uses window.speechSynthesis (built into all modern browsers).
 *  Speaks brief military-style callouts on game events:
 *    - Kill        → "Enemy down" / "Target eliminated"
 *    - Multi-kill  → "Double kill" / "Triple kill" / "Rampage"
 *    - Wave clear  → "Area clear" / "Wave N complete"
 *    - Low health  → "Need cover" / "Taking damage"
 *    - Proximity   → "Enemy close" (throttled)
 *    - Player death → "Man down"
 *
 *  Rate: 1.1× speed. Pitch: 0.8 (deep/military feel).
 *  Cooldown per category prevents spam. Max queue depth = 1.
 *  Auto-detects best male voice (prefers en-US).
 *  Can be globally muted by setting window.VoiceLinesMuted = true.
 * ============================================================ */
var VoiceLines = (function () {
  'use strict';

  if (!window.speechSynthesis) return { init: function () {} };

  var RATE  = 1.1;
  var PITCH = 0.85;
  var VOLUME = 0.65;

  var _init       = false;
  var _lastTs     = 0;
  var _frameN     = 0;
  var _voice      = null;
  var _speaking   = false;
  var _queue      = [];           /* max 1 item */

  /* Per-event cooldowns (seconds) */
  var _cds = {
    kill:      0, multi:    0, wave:    0,
    lowHp:     0, prox:     0, death:   0
  };
  var CD = {
    kill: 3.5, multi: 0, wave: 0, lowHp: 5, prox: 6, death: 0
  };

  /* State tracking */
  var _prevHp      = new WeakMap();
  var _counted     = new WeakSet();
  var _killTimes   = [];
  var _waveWas     = -1;
  var _playerHp    = null;
  var _deadCd      = false;
  var _proxCd      = 0;

  var MULTI_LABELS = ['', '', 'double kill', 'triple kill', 'quad kill', 'rampage', 'unstoppable', 'godlike'];

  /* Kill callouts */
  var KILL_LINES   = ['Enemy down', 'Target eliminated', 'Hostile neutralised', 'Tango down'];
  var _killIdx     = 0;

  function _pickVoice() {
    var voices = window.speechSynthesis.getVoices();
    /* Prefer en-US male */
    var pick = null;
    voices.forEach(function (v) {
      if (!pick && v.lang && v.lang.startsWith('en') && v.name.toLowerCase().indexOf('male') >= 0) pick = v;
    });
    if (!pick) voices.forEach(function (v) { if (!pick && v.lang && v.lang.startsWith('en')) pick = v; });
    _voice = pick || (voices[0] || null);
  }

  function _speak(text) {
    if (window.VoiceLinesMuted) return;
    if (!window.speechSynthesis) return;
    /* Cancel current if we have a new message */
    if (_speaking) {
      _queue = [text];
      return;
    }
    _queue = [];
    var u = new window.SpeechSynthesisUtterance(text);
    if (_voice) u.voice = _voice;
    u.rate   = RATE;
    u.pitch  = PITCH;
    u.volume = VOLUME;
    u.onstart = function () { _speaking = true; };
    u.onend   = function () {
      _speaking = false;
      if (_queue.length) {
        var next = _queue.shift();
        setTimeout(function () { _speak(next); }, 50);
      }
    };
    u.onerror = function () { _speaking = false; };
    try { window.speechSynthesis.speak(u); } catch (e) { _speaking = false; }
  }

  function _say(category, text) {
    var now = performance.now() / 1000;
    if (now < _cds[category]) return;
    _cds[category] = now + (CD[category] || 3);
    _speak(text);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Wave detection */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas !== -1 && w > _waveWas) {
          _say('wave', 'Wave ' + _waveWas + ' complete. Area clear.');
        }
        _waveWas = w;
      }
    } catch (e) {}

    /* Kill + multi-kill scan every 2 frames */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
            if (cur <= 0 && prev > 0 && !_counted.has(e)) {
              _counted.add(e);
              /* Kill callout */
              _killTimes.push(now);
              _killTimes = _killTimes.filter(function (t) { return now - t <= 2.5; });
              var cnt = _killTimes.length;
              if (cnt >= 2 && cnt < MULTI_LABELS.length) {
                _say('multi', MULTI_LABELS[cnt]);
              } else {
                var line = KILL_LINES[_killIdx % KILL_LINES.length];
                _killIdx++;
                _say('kill', line);
              }
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (err) {}
    }

    /* Player HP watch */
    try {
      if (window.player && window.player.hp !== undefined) {
        var hp  = window.player.hp;
        var mhp = window.player.maxHp || 100;
        /* Death */
        if (_playerHp !== null && hp <= 0 && _playerHp > 0 && !_deadCd) {
          _deadCd = true;
          _say('death', 'Man down.');
        }
        if (hp > 0 && _playerHp !== null && _playerHp <= 0) _deadCd = false;

        /* Low health */
        if (hp > 0 && hp / mhp <= 0.25 && (_playerHp === null || _playerHp / mhp > 0.25)) {
          _say('lowHp', 'Taking heavy damage. Need cover.');
        }
        _playerHp = hp;
      }
    } catch (e) {}

    /* Proximity callout */
    if (now > _proxCd) {
      try {
        var px = 0, pz = 0;
        if (window.player && window.player.position) { px = window.player.position.x; pz = window.player.position.z; }
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all2 = Enemies.getAll();
          for (var j = 0; j < all2.length; j++) {
            var e2 = all2[j];
            if (!e2 || !e2.mesh || (e2.hp !== undefined && e2.hp <= 0)) continue;
            var dx = e2.mesh.position.x - px;
            var dz = e2.mesh.position.z - pz;
            if (dx * dx + dz * dz < 16) {   /* < 4 units */
              _say('prox', 'Enemy close.');
              _proxCd = now + CD.prox;
              break;
            }
          }
        }
      } catch (er) {}
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    /* Load voices async */
    _pickVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = _pickVoice;
    }
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.VoiceLines = VoiceLines;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { VoiceLines.init(); });
} else {
  VoiceLines.init();
}