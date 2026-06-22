window.ComboMultiplier = (function() {
  'use strict';

  var _combo = 0;
  var _multiplier = 1;
  var _timer = 0;
  var _WINDOW = 6;
  var _hudEl = null;
  var _barEl = null;
  var _audioCtx = null;
  var _maxCombo = 0;
  var _totalComboScore = 0;
  var _active = false;

  var _THRESHOLDS = [
    { kills: 1,  mult: 1,   label: '',           color: '#FFFFFF' },
    { kills: 2,  mult: 1.5, label: '×1.5',       color: '#FFFF00' },
    { kills: 4,  mult: 2,   label: '×2 DOUBLE',  color: '#FFA500' },
    { kills: 6,  mult: 3,   label: '×3 TRIPLE',  color: '#FF4400' },
    { kills: 10, mult: 4,   label: '×4 ULTRA',   color: '#FF00FF' },
    { kills: 15, mult: 5,   label: '×5 GODLIKE', color: '#00FFFF' }
  ];

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playComboSound(mult) {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = 300 + mult * 120;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  }

  function _playBreakSound() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  function _getThreshold() {
    var t = _THRESHOLDS[0];
    for (var i = 0; i < _THRESHOLDS.length; i++) {
      if (_combo >= _THRESHOLDS[i].kills) t = _THRESHOLDS[i];
    }
    return t;
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'combo-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'top:120px', 'right:16px',
      'font-family:monospace', 'font-size:16px', 'font-weight:bold',
      'text-shadow:0 0 8px currentColor',
      'z-index:1350', 'pointer-events:none',
      'text-align:right', 'opacity:0', 'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(_hudEl);

    _barEl = document.createElement('div');
    _barEl.id = 'combo-timer-bar';
    _barEl.style.cssText = [
      'position:fixed', 'top:140px', 'right:16px',
      'width:120px', 'height:4px', 'background:#333',
      'z-index:1351', 'pointer-events:none', 'border-radius:2px'
    ].join(';');
    var fill = document.createElement('div');
    fill.id = 'combo-bar-fill';
    fill.style.cssText = 'height:100%;width:100%;background:#FFFF00;border-radius:2px;transition:background 0.2s';
    _barEl.appendChild(fill);
    document.body.appendChild(_barEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_combo < 2) {
      _hudEl.style.opacity = '0';
      _barEl.style.opacity = '0';
      return;
    }
    var t = _getThreshold();
    _hudEl.style.color = t.color;
    _hudEl.style.opacity = '1';
    _barEl.style.opacity = '1';
    var label = t.label || ('×' + t.mult);
    _hudEl.textContent = _combo + ' KILLS ' + label;
    var fill = document.getElementById('combo-bar-fill');
    if (fill) {
      fill.style.width = Math.round((_timer / _WINDOW) * 100) + '%';
      fill.style.background = t.color;
    }
    // Pulse on new kill
    _hudEl.style.transform = 'scale(1.2)';
    setTimeout(function() { if (_hudEl) _hudEl.style.transform = 'scale(1)'; }, 120);
  }

  function _showComboLabel(t) {
    if (t.kills < 2) return;
    var el = document.createElement('div');
    el.textContent = t.label;
    el.style.cssText = [
      'position:fixed', 'top:32%', 'right:20px',
      'color:' + t.color,
      'font-family:monospace', 'font-size:20px', 'font-weight:bold',
      'text-shadow:0 0 12px ' + t.color,
      'pointer-events:none', 'z-index:2700',
      'opacity:1', 'transition:transform 0.5s,opacity 0.5s'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function() {
      el.style.transform = 'translateY(-30px)';
      el.style.opacity = '0';
    }, 100);
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 650);
  }

  function addKill(baseScore) {
    var prevThreshIdx = _getThreshold().kills;

    _combo++;
    _timer = _WINDOW;
    _active = true;

    if (_combo > _maxCombo) _maxCombo = _combo;

    var t = _getThreshold();
    var bonus = Math.round(baseScore * (t.mult - 1));
    _totalComboScore += bonus;

    _playComboSound(t.mult);

    // Show label on threshold change
    if (t.kills > prevThreshIdx || _combo === t.kills) {
      _showComboLabel(t);
      if (t.mult >= 3 && window.HUD && window.HUD.showToast) {
        window.HUD.showToast(t.label || ('COMBO ×' + t.mult));
      }
    }

    window._comboMultiplier = t.mult;
    window._comboCount = _combo;

    _updateHUD();
    return bonus;
  }

  function breakCombo() {
    if (_combo >= 2) {
      _playBreakSound();
    }
    _combo = 0;
    _multiplier = 1;
    _timer = 0;
    _active = false;
    window._comboMultiplier = 1;
    window._comboCount = 0;
    _updateHUD();
  }

  function getMultiplier() {
    return _active ? _getThreshold().mult : 1;
  }

  function init() {
    _createHUD();
    window._comboMultiplier = 1;
    window._comboCount = 0;

    // Hook kill events
    var prev = window._onEnemyKilled;
    window._onEnemyKilled = function(enemy, score) {
      if (prev) prev(enemy, score);
      var base = score || 100;
      var bonus = addKill(base);
      if (bonus > 0 && window.player && window.player.score !== undefined) {
        window.player.score += bonus;
        if (window.HUD && window.HUD.setScore) window.HUD.setScore(window.player.score);
      }
    };
  }

  function update(dt) {
    if (!_active) return;
    _timer -= dt;
    _updateHUD();
    if (_timer <= 0) {
      breakCombo();
    }
  }

  function reset() {
    breakCombo();
    _maxCombo = 0;
    _totalComboScore = 0;
  }

  function getStats() {
    return { maxCombo: _maxCombo, totalComboScore: _totalComboScore, currentCombo: _combo };
  }

  return { init: init, update: update, addKill: addKill, breakCombo: breakCombo, getMultiplier: getMultiplier, reset: reset, getStats: getStats };
})();
