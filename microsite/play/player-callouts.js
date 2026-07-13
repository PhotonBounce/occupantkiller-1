window.PlayerCallouts = (function() {
  'use strict';

  var _lastCallout = 0;
  var _COOLDOWN = 5;
  var _audioCtx = null;
  var _queue = [];
  var _playing = false;
  var _calloutTimer = 0;
  var _active = true;

  var CALLOUTS = {
    kill:      ['Enemy down!', 'Got one!', 'Target eliminated.', 'One less.', 'Hostile neutralized.'],
    multi:     ['Double kill!', 'Two down!', 'Multiple hostiles eliminated.'],
    headshot:  ['Headshot!', 'Right between the eyes.', 'Clean kill.'],
    reload:    ['Reloading!', 'Cover me, reloading.', 'Changing mag.'],
    lowAmmo:   ['Running low!', 'Almost out of ammo.', 'Need ammo!'],
    lowHealth: ["I'm hit bad!", 'Taking fire, need cover!', 'Critical, critical!'],
    grenade:   ['Grenade out!', 'Frag out!', 'Throwing!'],
    flanked:   ['Flanked!', 'Enemy on my flank!', "They're coming around!"],
    wave:      ['Wave incoming!', 'Contact, multiple hostiles!', 'Here they come!'],
    clear:      ['Area clear.', 'All clear.', 'Zone secured.'],
    boost:     ['Going in!', "Let's move!", 'On the move!']
  };

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _synthVoice(text) {
    // Use Web Speech API if available
    if (typeof window.speechSynthesis !== 'undefined' && _active) {
      try {
        var utt = new window.SpeechSynthesisUtterance(text);
        utt.rate = 1.1;
        utt.pitch = 0.8;
        utt.volume = 0.35;
        // Prefer English military-sounding voice
        var voices = window.speechSynthesis.getVoices();
        for (var i = 0; i < voices.length; i++) {
          if (voices[i].lang && voices[i].lang.indexOf('en') === 0) {
            utt.voice = voices[i];
            break;
          }
        }
        window.speechSynthesis.speak(utt);
        return true;
      } catch(e) {}
    }
    // Fallback: just show as toast
    return false;
  }

  function _pick(type) {
    var arr = CALLOUTS[type];
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function callout(type) {
    if (!_active) return;
    var now = Date.now() / 1000;
    if (now - _lastCallout < _COOLDOWN) return;
    _lastCallout = now;
    var text = _pick(type);
    if (!text) return;
    if (!_synthVoice(text)) {
      // Show as floating HUD text if speech not available
      _showCalloutText(text);
    }
  }

  function _showCalloutText(text) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'bottom:230px', 'left:50%',
      'transform:translateX(-50%)',
      'color:#FFCC44', 'font-family:monospace', 'font-size:14px',
      'font-weight:bold', 'text-shadow:0 0 6px #AA8800',
      'pointer-events:none', 'z-index:1600',
      'opacity:1', 'transition:opacity 0.5s'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(function() {
      el.style.opacity = '0';
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
    }, 2500);
  }

  function init() {
    // Hook enemy killed
    var prevKill = window._onEnemyKilled;
    window._onEnemyKilled = function(enemy, score) {
      if (prevKill) prevKill(enemy, score);
      callout(window._headshotStreak >= 2 ? 'multi' : 'kill');
    };

    // Hook low health
    setInterval(function() {
      var player = window.player || (window.GameManager && window.GameManager.getPlayer ? window.GameManager.getPlayer() : null);
      if (player && player.hp !== undefined && player.hp < 25 && player.hp > 0) {
        callout('lowHealth');
      }
    }, 8000);

    // Hook wave start
    var prevWave = window._onWaveStart;
    window._onWaveStart = function(wave) {
      if (prevWave) prevWave(wave);
      callout('wave');
    };

    // Hook grenade throw
    var prevShot = window._onGrenadeThrown;
    window._onGrenadeThrown = function() {
      if (prevShot) prevShot();
      callout('grenade');
    };

    // Expose global
    window._playerCallout = callout;
  }

  function update(dt) {
    _calloutTimer += dt;
    // Occasional combat callouts during active gameplay
    if (_calloutTimer > 45 + Math.random() * 30) {
      _calloutTimer = 0;
      var player = window.player || (window.GameManager && window.GameManager.getPlayer ? window.GameManager.getPlayer() : null);
      if (player && player.hp > 0 && window.Enemies && window.Enemies.getAll) {
        var enemies = window.Enemies.getAll();
        if (enemies && enemies.length > 0) callout('flanked');
      }
    }
  }

  function toggle() {
    _active = !_active;
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('VOICE CALLOUTS: ' + (_active ? 'ON' : 'OFF'));
    }
    return _active;
  }

  function reset() {
    _lastCallout = 0;
    _calloutTimer = 0;
    if (typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel();
    }
  }

  return { init: init, update: update, callout: callout, toggle: toggle, reset: reset };
})();
