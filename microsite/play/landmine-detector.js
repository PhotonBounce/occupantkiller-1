window.LandmineDetector = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _active = false;
  var _audioCtx = null;
  var _beepOsc = null;
  var _beepGain = null;
  var _lastBeep = 0;
  var _hud = null;
  var _equipped = false;

  var DETECT_RANGE = 4;
  var BEEP_MIN_INTERVAL = 0.08;
  var BEEP_MAX_INTERVAL = 1.5;

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playBeep(frequency, duration) {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'landmine-detector-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:90px',
      'right:20px',
      'background:rgba(0,0,0,0.7)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 10px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'display:none',
      'z-index:900'
    ].join(';');
    _hud.textContent = '🔊 DETECTOR: ON';
    document.body.appendChild(_hud);
  }

  function _getMinePositions() {
    var positions = [];
    if (window.MinefieldSystem && window.MinefieldSystem.getMines) {
      var mines = window.MinefieldSystem.getMines();
      if (mines) {
        for (var i = 0; i < mines.length; i++) {
          if (mines[i] && mines[i].position) {
            positions.push(mines[i].position);
          }
        }
      }
    }
    if (window._activeMines) {
      for (var j = 0; j < window._activeMines.length; j++) {
        if (window._activeMines[j] && window._activeMines[j].position) {
          positions.push(window._activeMines[j].position);
        }
      }
    }
    if (window._claymores) {
      for (var k = 0; k < window._claymores.length; k++) {
        if (window._claymores[k] && window._claymores[k].position) {
          positions.push(window._claymores[k].position);
        }
      }
    }
    return positions;
  }

  function _getClosestMineDistance() {
    var player = window.player || (window._camera && {position: window._camera.position});
    if (!player) return 999;
    var mines = _getMinePositions();
    var minDist = 999;
    for (var i = 0; i < mines.length; i++) {
      var dx = mines[i].x - player.position.x;
      var dz = mines[i].z - player.position.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _createHUD();

    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyJ' && !e.repeat) {
        _equipped = !_equipped;
        if (_hud) _hud.style.display = _equipped ? 'block' : 'none';
        if (window.HUD && window.HUD.showToast) {
          window.HUD.showToast(_equipped ? 'MINE DETECTOR: ON' : 'MINE DETECTOR: OFF');
        }
      }
    });

    window._landmineDetectorEquipped = false;
  }

  function update(dt) {
    if (!_equipped) return;

    window._landmineDetectorEquipped = true;
    var dist = _getClosestMineDistance();

    if (dist < DETECT_RANGE) {
      var ratio = 1 - (dist / DETECT_RANGE);
      var interval = BEEP_MAX_INTERVAL - ratio * (BEEP_MAX_INTERVAL - BEEP_MIN_INTERVAL);
      _lastBeep += dt;

      if (_lastBeep >= interval) {
        _lastBeep = 0;
        var freq = 400 + ratio * 800;
        _playBeep(freq, 0.06);

        if (_hud) {
          _hud.style.color = ratio > 0.7 ? '#FF4444' : ratio > 0.4 ? '#FFAA00' : '#00FF88';
          _hud.textContent = '🔊 MINE ' + Math.round(dist * 10) / 10 + 'm';
        }

        if (dist < 1.2 && window.HUD && window.HUD.showToast && !window._mineTooCloseWarned) {
          window._mineTooCloseWarned = true;
          window.HUD.showToast('⚠️ MINE DIRECTLY BELOW!');
          setTimeout(function() { window._mineTooCloseWarned = false; }, 3000);
        }
      }
    } else {
      if (_hud) {
        _hud.style.color = '#00FF88';
        _hud.textContent = '🔊 DETECTOR: CLEAR';
      }
    }
  }

  function reset() {
    _equipped = false;
    _lastBeep = 0;
    window._landmineDetectorEquipped = false;
    if (_hud) _hud.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };
})();
