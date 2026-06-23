window.ScoreMultiplier = (function () {
  'use strict';

  var _base = 1.0;
  var _chain = 0;
  var _chainTimer = 0;
  var _chainDecay = 4.0;
  var _streakEl = null;
  var _multiplierEl = null;
  var _flashTimer = 0;

  var _CHAIN_MULT = [1, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

  function _buildHUD() {
    _streakEl = document.createElement('div');
    _streakEl.id = 'score-streak';
    _streakEl.style.cssText = [
      'position:fixed', 'top:55%', 'left:50%', 'transform:translate(-50%,-50%)',
      'color:#FFD700', 'font-family:monospace', 'font-size:32px', 'font-weight:bold',
      'letter-spacing:4px', 'text-shadow:0 0 16px #FFA500, 0 2px 4px #000',
      'pointer-events:none', 'z-index:2500', 'display:none', 'text-align:center'
    ].join(';');
    document.body.appendChild(_streakEl);

    _multiplierEl = document.createElement('div');
    _multiplierEl.id = 'score-multiplier';
    _multiplierEl.style.cssText = [
      'position:fixed', 'top:20px', 'right:70px',
      'color:#FFD700', 'font-family:monospace', 'font-size:14px',
      'letter-spacing:2px', 'pointer-events:none', 'z-index:1500'
    ].join(';');
    document.body.appendChild(_multiplierEl);
  }

  function _getStreakLabel(chain) {
    if (chain < 2) return '';
    if (chain === 2) return 'DOUBLE KILL';
    if (chain === 3) return 'TRIPLE KILL';
    if (chain === 4) return 'QUAD KILL';
    if (chain === 5) return 'PENTA KILL';
    return 'MASSACRE ×' + chain;
  }

  function onKill(baseScore) {
    _chain = Math.min(_chain + 1, _CHAIN_MULT.length - 1);
    _chainTimer = _chainDecay;
    var mult = _CHAIN_MULT[_chain];
    var earned = Math.round(baseScore * mult * _base);

    if (_chain >= 2 && _streakEl) {
      var label = _getStreakLabel(_chain);
      _streakEl.textContent = label + ' ×' + mult.toFixed(1);
      _streakEl.style.display = 'block';
      _streakEl.style.fontSize = (28 + _chain * 3) + 'px';
      _flashTimer = 1.8;
    }

    if (window._addScore) window._addScore(earned);
    else if (window.player) window.player.score = (window.player.score || 0) + earned;

    return earned;
  }

  function init() {
    _chain = 0;
    _chainTimer = 0;
    _flashTimer = 0;
    _base = (window._scoreMultiplier) || 1.0;
    _buildHUD();
    window._onEnemyKilledForScore = onKill;
  }

  function update(dt) {
    _base = (window._scoreMultiplier) || 1.0;

    if (_chainTimer > 0) {
      _chainTimer -= dt;
      if (_chainTimer <= 0) {
        _chain = 0;
        _chainTimer = 0;
      }
    } else if (_chain > 0) {
      _chain = Math.max(0, _chain - 1);
    }

    if (_flashTimer > 0) {
      _flashTimer -= dt;
      if (_flashTimer <= 0 && _streakEl) {
        _streakEl.style.display = 'none';
      }
    }

    var mult = _CHAIN_MULT[Math.min(_chain, _CHAIN_MULT.length - 1)];
    if (_multiplierEl) {
      if (_chain >= 1) {
        _multiplierEl.textContent = 'MULT ×' + (mult * _base).toFixed(1);
        _multiplierEl.style.color = _chain >= 4 ? '#FF4444' : _chain >= 3 ? '#FF8800' : '#FFD700';
      } else {
        _multiplierEl.textContent = _base > 1 ? 'MULT ×' + _base.toFixed(2) : '';
      }
    }
  }

  function reset() {
    _chain = 0;
    _chainTimer = 0;
    _flashTimer = 0;
    if (_streakEl) _streakEl.style.display = 'none';
    if (_multiplierEl) _multiplierEl.textContent = '';
  }

  return { init: init, update: update, onKill: onKill, reset: reset };
})();
