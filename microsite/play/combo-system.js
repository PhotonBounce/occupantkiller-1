// combo-system.js — Combo Kill Multiplier for rapid-kill score bonuses
// Ukraine conflict FPS — Three.js browser game
// IIFE pattern, all var (no let/const)

window.ComboSystem = (function () {

  // ─── Private state ────────────────────────────────────────────────────────
  var _comboCount     = 0;     // kills in current combo (supports +1.5 for headshots)
  var _multiplier     = 1.0;
  var _timer          = 0;     // seconds since last kill
  var _timerMax       = 4.0;   // combo window in seconds
  var _lastTier       = 0;     // tier index active last frame
  var _active         = false; // is combo currently live?
  var _labelFlashEl   = null;  // DOM element for tier label
  var _labelFlashTime = 0;
  var _hudEl          = null;  // outer HUD container
  var _multEl         = null;  // multiplier text
  var _barFillEl      = null;  // progress bar fill
  var _timerTextEl    = null;  // timer seconds text
  var _timerBarEl     = null;  // bar container
  var _lostEl         = null;  // "COMBO LOST" overlay text
  var _lostTimer      = 0;

  // Rapid-event tracking
  var _killTimestamps = [];    // absolute timestamps of kills (ms)

  // Session best
  var _bestCombo      = 0;
  var _bestComboEver  = 0;
  var _LS_KEY         = 'okk_best_combo_v1';

  // Special event flags
  var _blitzShown     = false;  // "BLITZ!" shown for this combo burst
  var _slaughterShown = false;  // "SLAUGHTER!" shown for this combo burst
  var _backInAction   = false;  // show "BACK IN ACTION" on next kill after break

  // AudioContext for ascending tones
  var _audioCtx       = null;

  // ─── Combo tiers ─────────────────────────────────────────────────────────
  // Each tier: { minCount, multiplier, label }
  var TIERS = [
    { minCount: 20, multiplier: 10,  label: 'GODLIKE'     },
    { minCount: 15, multiplier: 7,   label: 'UNSTOPPABLE' },
    { minCount: 10, multiplier: 5,   label: 'MASSACRE'    },
    { minCount: 7,  multiplier: 4,   label: 'RAMPAGE'     },
    { minCount: 5,  multiplier: 3,   label: 'PENTA'       },
    { minCount: 4,  multiplier: 2.5, label: 'QUAD'        },
    { minCount: 3,  multiplier: 2,   label: 'TRIPLE'      },
    { minCount: 2,  multiplier: 1.5, label: 'DOUBLE'      },
    { minCount: 1,  multiplier: 1,   label: ''            }
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _getTier(count) {
    for (var i = 0; i < TIERS.length; i++) {
      if (count >= TIERS[i].minCount) return i;
    }
    return TIERS.length - 1;
  }

  function _loadBestEver() {
    try {
      var stored = localStorage.getItem(_LS_KEY);
      if (stored !== null) {
        var val = parseFloat(stored);
        if (!isNaN(val)) _bestComboEver = val;
      }
    } catch (e) { /* localStorage unavailable */ }
  }

  function _saveBestEver(val) {
    try {
      localStorage.setItem(_LS_KEY, String(val));
    } catch (e) { /* ignore */ }
  }

  // ─── HUD creation ─────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudEl) return; // already built

    _hudEl = document.createElement('div');
    _hudEl.id = 'comboHUD';
    _hudEl.style.cssText = [
      'position:fixed',
      'right:32px',
      'top:50%',
      'transform:translateY(-50%)',
      'width:160px',
      'text-align:center',
      'pointer-events:none',
      'font-family:monospace',
      'display:none',
      'z-index:9100'
    ].join(';');

    // Multiplier text
    _multEl = document.createElement('div');
    _multEl.id = 'comboMult';
    _multEl.style.cssText = [
      'font-size:36px',
      'font-weight:bold',
      'color:#ffaa00',
      'text-shadow:0 0 12px #ff6600, 0 2px 4px #000',
      'letter-spacing:2px',
      'line-height:1.1'
    ].join(';');

    // Timer bar container
    _timerBarEl = document.createElement('div');
    _timerBarEl.style.cssText = [
      'width:100%',
      'height:8px',
      'background:#333',
      'border-radius:4px',
      'margin:6px 0 4px',
      'overflow:hidden'
    ].join(';');

    _barFillEl = document.createElement('div');
    _barFillEl.style.cssText = [
      'height:100%',
      'width:100%',
      'background:#44cc44',
      'border-radius:4px',
      'transition:background 0.1s'
    ].join(';');
    _timerBarEl.appendChild(_barFillEl);

    // Timer seconds text
    _timerTextEl = document.createElement('div');
    _timerTextEl.style.cssText = [
      'font-size:11px',
      'color:#aaa',
      'margin-bottom:4px'
    ].join(';');

    // Kill label flash
    _labelFlashEl = document.createElement('div');
    _labelFlashEl.id = 'comboLabel';
    _labelFlashEl.style.cssText = [
      'font-size:15px',
      'font-weight:bold',
      'color:#fff',
      'letter-spacing:3px',
      'min-height:20px',
      'text-shadow:0 0 8px #ffaa00',
      'transition:opacity 0.3s'
    ].join(';');

    // "COMBO" header label
    var headerEl = document.createElement('div');
    headerEl.style.cssText = [
      'font-size:11px',
      'color:#888',
      'letter-spacing:4px',
      'margin-bottom:2px'
    ].join(';');
    headerEl.textContent = 'COMBO';

    _hudEl.appendChild(headerEl);
    _hudEl.appendChild(_multEl);
    _hudEl.appendChild(_timerBarEl);
    _hudEl.appendChild(_timerTextEl);
    _hudEl.appendChild(_labelFlashEl);

    // "COMBO LOST" element (lives outside HUD, shown at same position)
    _lostEl = document.createElement('div');
    _lostEl.style.cssText = [
      'position:fixed',
      'right:32px',
      'top:50%',
      'transform:translateY(-50%)',
      'width:160px',
      'text-align:center',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:#888',
      'letter-spacing:2px',
      'display:none',
      'z-index:9099'
    ].join(';');
    _lostEl.textContent = 'COMBO LOST';

    document.body.appendChild(_hudEl);
    document.body.appendChild(_lostEl);
  }

  // ─── HUD update ───────────────────────────────────────────────────────────
  function _updateHUD() {
    if (!_hudEl) return;

    if (!_active) {
      _hudEl.style.display = 'none';
      return;
    }

    _hudEl.style.display = 'block';

    // Multiplier display
    _multEl.textContent = '\xd7' + _multiplier.toFixed(1);

    // Bar fill (fraction of time remaining)
    var frac = Math.max(0, Math.min(1, 1 - (_timer / _timerMax)));
    _barFillEl.style.width = Math.round(frac * 100) + '%';

    // Bar color: green -> red when < 1s
    var remaining = _timerMax - _timer;
    _barFillEl.style.background = remaining < 1 ? '#cc3333' : '#44cc44';

    // Timer text
    _timerTextEl.textContent = remaining.toFixed(1) + 's';

    // Label flash fade
    if (_labelFlashTime > 0) {
      _labelFlashEl.style.opacity = String(Math.min(1, _labelFlashTime / 0.3));
    } else {
      _labelFlashEl.style.opacity = '0';
    }
  }

  function _flashLabel(text, color) {
    if (!_labelFlashEl) return;
    _labelFlashEl.textContent = text;
    _labelFlashEl.style.color = color || '#ffffff';
    _labelFlashEl.style.textShadow = '0 0 10px ' + (color || '#ffaa00');
    _labelFlashEl.style.opacity = '1';
    _labelFlashTime = 1.2; // seconds to show
  }

  // ─── Special event banner ─────────────────────────────────────────────────
  function _showBanner(text, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:30%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'color:' + (color || '#ffffff'),
      'text-shadow:0 0 16px ' + (color || '#ffffff') + ', 0 2px 6px #000',
      'letter-spacing:4px',
      'pointer-events:none',
      'z-index:9200',
      'opacity:1',
      'transition:opacity 1s'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    // Fade out
    setTimeout(function () { el.style.opacity = '0'; }, 1200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2300);
  }

  // ─── Bonus score floating text ────────────────────────────────────────────
  function _showBonusText(bonus) {
    var el = document.createElement('div');
    var cx = Math.round(window.innerWidth  * 0.5);
    var cy = Math.round(window.innerHeight * 0.45);
    el.style.cssText = [
      'position:fixed',
      'left:' + cx + 'px',
      'top:'  + cy + 'px',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'color:#ffd700',
      'text-shadow:0 0 8px #ff8800, 0 1px 3px #000',
      'pointer-events:none',
      'z-index:9150',
      'opacity:1',
      'transition:opacity 0.8s, top 0.8s'
    ].join(';');
    el.textContent = '+' + bonus;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.top = (cy - 40) + 'px';
    }, 50);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  }

  // ─── Screen effects ───────────────────────────────────────────────────────
  function _edgeFlicker(color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9050',
      'box-shadow:inset 0 0 80px 30px ' + color,
      'opacity:0.7',
      'transition:opacity 0.2s'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 80);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }

  function _screenShake() {
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    var mag = 6;
    var count = 0;
    var interval = setInterval(function () {
      if (count >= 6) {
        clearInterval(interval);
        canvas.style.transform = '';
        return;
      }
      var dx = (Math.random() - 0.5) * mag;
      var dy = (Math.random() - 0.5) * mag;
      canvas.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      count++;
      mag *= 0.75;
    }, 25);
  }

  function _goldFlash() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9060',
      'background:radial-gradient(ellipse at center, rgba(255,215,0,0.35) 0%, rgba(255,140,0,0.1) 60%, transparent 100%)',
      'opacity:1',
      'transition:opacity 0.5s'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 120);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 650);
  }

  // ─── Audio ────────────────────────────────────────────────────────────────
  function _playComboTone(multiplier) {
    try {
      if (!_audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        _audioCtx = new AC();
      }
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      // Base freq 440 Hz; each tier raises by ~60 Hz, capped
      var freq = Math.min(1760, 440 + (_comboCount * 40));
      osc.frequency.setValueAtTime(freq, _audioCtx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.12, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.18);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.18);
    } catch (e) { /* audio not available */ }
  }

  // ─── "COMBO LOST" display ─────────────────────────────────────────────────
  function _showComboLost() {
    if (!_lostEl) return;
    _lostEl.style.display  = 'block';
    _lostEl.style.opacity  = '1';
    _lostTimer = 1.5;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init() {
    _loadBestEver();
    _buildHUD();

    // Expose globals
    window._comboMultiplier = 1.0;
    window._comboCount      = 0;
    window._onKillForCombo  = function (opts) {
      onKill(opts);
    };

    _comboCount     = 0;
    _multiplier     = 1.0;
    _timer          = 0;
    _active         = false;
    _lastTier       = TIERS.length - 1;
    _killTimestamps = [];
    _blitzShown     = false;
    _slaughterShown = false;
    _backInAction   = false;
    _lostTimer      = 0;

    _updateHUD();
  }

  // opts: { baseKillScore, isHeadshot }
  function onKill(opts) {
    opts = opts || {};
    var baseKillScore = opts.baseKillScore || 0;
    var isHeadshot    = !!opts.isHeadshot;
    var now           = Date.now();

    // "Back in action" on first kill after break
    if (_backInAction) {
      _showBanner('BACK IN ACTION', '#4488ff');
      _backInAction = false;
    }

    // Increment combo count (headshots count as 1.5)
    _comboCount += isHeadshot ? 1.5 : 1;
    _timer       = 0;
    _active      = true;

    // Record timestamp for rapid-event detection
    _killTimestamps.push(now);
    // Prune old timestamps beyond 10s window
    var pruneTime = now - 10000;
    var newTs = [];
    for (var ti = 0; ti < _killTimestamps.length; ti++) {
      if (_killTimestamps[ti] > pruneTime) newTs.push(_killTimestamps[ti]);
    }
    _killTimestamps = newTs;

    // Determine tier
    var tierIdx    = _getTier(_comboCount);
    var tier       = TIERS[tierIdx];
    _multiplier    = tier.multiplier;

    // Update globals
    window._comboMultiplier = _multiplier;
    window._comboCount      = _comboCount;

    // Flash tier label on new tier
    if (tierIdx !== _lastTier && tier.label) {
      _flashLabel(tier.label + ' KILL', '#ffcc00');
    }
    _lastTier = tierIdx;

    // Bonus score
    if (_multiplier > 1 && baseKillScore > 0) {
      var bonus = Math.round(baseKillScore * (_multiplier - 1.0));
      if (bonus > 0) _showBonusText(bonus);
    }

    // Ascending tone
    if (_multiplier >= 1.5) _playComboTone(_multiplier);

    // Combo effects
    if (_multiplier >= 10) {
      _goldFlash();
    } else if (_multiplier >= 7) {
      _screenShake();
      _edgeFlicker('rgba(255,150,0,0.5)');
    } else if (_multiplier >= 5) {
      _edgeFlicker('rgba(255,100,0,0.4)');
    } else if (_multiplier >= 3) {
      _edgeFlicker('rgba(255,80,0,0.25)');
    }

    // Special rapid-kill events
    // 5 kills in 3s → BLITZ!
    if (!_blitzShown) {
      var blitzCutoff = now - 3000;
      var blitzCount  = 0;
      for (var bi = 0; bi < _killTimestamps.length; bi++) {
        if (_killTimestamps[bi] > blitzCutoff) blitzCount++;
      }
      if (blitzCount >= 5) {
        _showBanner('BLITZ!', '#00ffff');
        _blitzShown = true;
      }
    }

    // 10 kills in 10s → SLAUGHTER!
    if (!_slaughterShown) {
      var slayCutoff = now - 10000;
      var slayCount  = 0;
      for (var si = 0; si < _killTimestamps.length; si++) {
        if (_killTimestamps[si] > slayCutoff) slayCount++;
      }
      if (slayCount >= 10) {
        _showBanner('SLAUGHTER!', '#ff2222');
        _slaughterShown = true;
      }
    }

    // Session best
    if (_comboCount > _bestCombo) {
      _bestCombo = _comboCount;
    }
    if (_comboCount > _bestComboEver) {
      _bestComboEver = _comboCount;
      _saveBestEver(_bestComboEver);
    }

    _updateHUD();
  }

  // dt: seconds since last frame
  function update(dt) {
    // "COMBO LOST" fade
    if (_lostTimer > 0) {
      _lostTimer -= dt;
      if (_lostEl) {
        _lostEl.style.opacity = String(Math.max(0, _lostTimer / 1.5));
        if (_lostTimer <= 0) {
          _lostEl.style.display = 'none';
          _lostEl.style.opacity = '1';
        }
      }
    }

    // Label flash timer
    if (_labelFlashTime > 0) {
      _labelFlashTime -= dt;
    }

    if (!_active) return;

    _timer += dt;
    if (_timer >= _timerMax) {
      // Combo broke
      _active         = false;
      _multiplier     = 1.0;
      _comboCount     = 0;
      _lastTier       = TIERS.length - 1;
      _blitzShown     = false;
      _slaughterShown = false;
      _backInAction   = true;
      window._comboMultiplier = 1.0;
      window._comboCount      = 0;
      _showComboLost();
      _hudEl && (_hudEl.style.display = 'none');
    } else {
      _updateHUD();
    }
  }

  function getMultiplier() {
    return _multiplier;
  }

  function reset() {
    _active         = false;
    _multiplier     = 1.0;
    _comboCount     = 0;
    _timer          = 0;
    _lastTier       = TIERS.length - 1;
    _killTimestamps = [];
    _blitzShown     = false;
    _slaughterShown = false;
    _backInAction   = false;
    _lostTimer      = 0;
    window._comboMultiplier = 1.0;
    window._comboCount      = 0;
    if (_hudEl) _hudEl.style.display = 'none';
    if (_lostEl) { _lostEl.style.display = 'none'; _lostEl.style.opacity = '1'; }
  }

  // Public stats for end-screen
  function getBestCombo()      { return _bestCombo; }
  function getBestComboEver()  { return _bestComboEver; }

  return {
    init:            init,
    onKill:          onKill,
    update:          update,
    getMultiplier:   getMultiplier,
    reset:           reset,
    getBestCombo:    getBestCombo,
    getBestComboEver: getBestComboEver
  };

})();
