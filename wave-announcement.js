window.WaveAnnouncement = (function () {
  'use strict';

  // ── Internal state ────────────────────────────────────────────────────────
  var _container = null;
  var _overlay = null;
  var _animationId = null;
  var _hideTimeout = null;
  var _audioCtx = null;
  var _initialized = false;

  // ── Wave theme definitions ────────────────────────────────────────────────
  var THEMES = [
    { min: 1,  max: 3,  label: 'INITIAL CONTACT',           color: '#ffffff', skull: false, gold: false },
    { min: 4,  max: 6,  label: 'REINFORCEMENTS',            color: '#ffbf00', skull: false, gold: false },
    { min: 7,  max: 9,  label: 'HEAVY ASSAULT',             color: '#ff6600', skull: false, gold: false },
    { min: 10, max: 12, label: 'ELITE SQUAD',               color: '#ff2200', skull: false, gold: false },
    { min: 13, max: 15, label: 'VETERAN FORCE',             color: '#cc0022', skull: false, gold: false },
    { min: 16, max: 19, label: '&#128128; DEATH SQUAD',     color: '#880000', skull: true,  gold: false },
    { min: 20, max: 999,'label': 'FINAL PUSH — NO SURRENDER', color: '#ffd700', skull: false, gold: true }
  ];

  function getTheme(waveNum) {
    for (var i = 0; i < THEMES.length; i++) {
      if (waveNum >= THEMES[i].min && waveNum <= THEMES[i].max) {
        return THEMES[i];
      }
    }
    return THEMES[THEMES.length - 1];
  }

  // ── Difficulty stars ──────────────────────────────────────────────────────
  function buildStars(waveNum) {
    var count = Math.min(5, Math.ceil(waveNum / 5));
    var html = '';
    for (var i = 0; i < 5; i++) {
      if (i < count) {
        html += '<span style="color:#ffd700;font-size:28px;text-shadow:0 0 8px #ffd700;">&#9733;</span>';
      } else {
        html += '<span style="color:#444;font-size:28px;">&#9733;</span>';
      }
    }
    return html;
  }

  // ── Enemy preview ─────────────────────────────────────────────────────────
  function buildEnemyPreview(enemies) {
    if (!enemies || enemies.length === 0) return '';
    var list = enemies.slice(0, 3);
    var html = '<div style="margin:12px 0 0 0;text-align:center;">';
    html += '<div style="font-family:\'Courier New\',monospace;font-size:12px;letter-spacing:3px;color:#888;margin-bottom:8px;">INCOMING THREATS</div>';
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var name = (e.name || e.type || 'UNKNOWN').toString().toUpperCase();
      var count = e.count || 1;
      var icon = i === 0 ? '&#128128;' : (i === 1 ? '&#11088;' : '&#9760;');
      html += '<div style="font-family:\'Courier New\',monospace;font-size:14px;color:#ccc;margin:4px 0;letter-spacing:2px;">';
      html += icon + ' ' + name + ' <span style="color:#ff4444;">x' + count + '</span>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // ── Objective hint ────────────────────────────────────────────────────────
  function buildObjectiveHint(waveNum) {
    if (typeof window.ObjectiveSystem === 'undefined') return '';
    var obj = null;
    if (typeof window.ObjectiveSystem.getObjectiveForWave === 'function') {
      obj = window.ObjectiveSystem.getObjectiveForWave(waveNum);
    } else if (typeof window.ObjectiveSystem.getCurrentObjective === 'function') {
      obj = window.ObjectiveSystem.getCurrentObjective();
    }
    if (!obj) return '';
    var txt = obj.description || obj.text || ('Kill ' + (obj.killTarget || obj.target || '?') + ' enemies');
    return '<div style="position:absolute;bottom:40px;left:0;right:0;text-align:center;' +
           'font-family:\'Courier New\',monospace;font-size:13px;letter-spacing:3px;' +
           'color:#88ccff;text-transform:uppercase;">' +
           'OBJECTIVE: ' + txt.toUpperCase() + '</div>';
  }

  // ── Scanlines + glitch ────────────────────────────────────────────────────
  function injectScanlineStyle(id) {
    if (document.getElementById('wave-scanline-style-' + id)) return;
    var style = document.createElement('style');
    style.id = 'wave-scanline-style-' + id;
    style.textContent =
      '@keyframes waveGlitch {' +
      '  0%   { transform: translateX(0); }' +
      '  20%  { transform: translateX(-6px); }' +
      '  40%  { transform: translateX(6px); }' +
      '  60%  { transform: translateX(-4px); }' +
      '  80%  { transform: translateX(4px); }' +
      '  100% { transform: translateX(0); }' +
      '}' +
      '@keyframes waveScanlines {' +
      '  0%   { background-position: 0 0; }' +
      '  100% { background-position: 0 100px; }' +
      '}' +
      '@keyframes waveNumberDrop {' +
      '  0%   { opacity:0; transform: translateY(-80px) scale(1.2); }' +
      '  70%  { opacity:1; transform: translateY(8px) scale(0.97); }' +
      '  85%  { transform: translateY(-4px) scale(1.01); }' +
      '  100% { transform: translateY(0) scale(1); }' +
      '}' +
      '@keyframes waveSlideLeft {' +
      '  0%   { opacity:0; transform: translateX(-120px); }' +
      '  100% { opacity:1; transform: translateX(0); }' +
      '}' +
      '@keyframes waveSlideRight {' +
      '  0%   { opacity:0; transform: translateX(120px); }' +
      '  100% { opacity:1; transform: translateX(0); }' +
      '}' +
      '@keyframes wavePulseGold {' +
      '  0%, 100% { text-shadow: 0 0 12px #ffd700, 0 0 24px #ffaa00; }' +
      '  50%       { text-shadow: 0 0 30px #ffd700, 0 0 60px #ffcc00, 0 0 90px #ff8800; }' +
      '}';
    document.head.appendChild(style);
  }

  // ── Audio sting ───────────────────────────────────────────────────────────
  function playAudioSting() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var freqs = [50, 100, 200];
      for (var i = 0; i < freqs.length; i++) {
        (function (freq, delay) {
          var osc = _audioCtx.createOscillator();
          var gain = _audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, _audioCtx.currentTime + delay);
          gain.gain.setValueAtTime(0, _audioCtx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.6, _audioCtx.currentTime + delay + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + delay + 0.35);
          osc.connect(gain);
          gain.connect(_audioCtx.destination);
          osc.start(_audioCtx.currentTime + delay);
          osc.stop(_audioCtx.currentTime + delay + 0.4);
        })(freqs[i], i * 0.15);
      }
    } catch (e) {
      // Web Audio not available — silent fail
    }
  }

  // ── Card builder ──────────────────────────────────────────────────────────
  function buildCard(waveNum, waveData) {
    var theme = getTheme(waveNum);
    var isSpecial = (waveNum === 10 || waveNum === 20);
    var enemies = (waveData && waveData.enemies) ? waveData.enemies : [];
    var subtitle = (waveData && waveData.subtitle) ? waveData.subtitle : theme.label;

    injectScanlineStyle('base');

    // Outer container
    var container = document.createElement('div');
    container.id = 'wave-announcement-root';
    container.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;' +
      'pointer-events:all;';

    // Black overlay
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,0.88);' +
      'opacity:0;transition:opacity 0.4s ease;';

    // Scanlines overlay (only for special waves)
    if (isSpecial) {
      var scanlines = document.createElement('div');
      scanlines.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;' +
        'background:repeating-linear-gradient(' +
        '  0deg,' +
        '  transparent,' +
        '  transparent 2px,' +
        '  rgba(0,0,0,0.18) 2px,' +
        '  rgba(0,0,0,0.18) 4px' +
        ');' +
        'animation:waveScanlines 3s linear infinite;';
      container.appendChild(scanlines);
    }

    // Card panel
    var card = document.createElement('div');
    card.style.cssText =
      'position:relative;z-index:2;text-align:center;padding:40px 60px;' +
      'border-top:2px solid ' + theme.color + ';' +
      'border-bottom:2px solid ' + theme.color + ';' +
      'min-width:420px;max-width:700px;';

    // "WAVE" label — slides from left
    var waveLabel = document.createElement('div');
    waveLabel.style.cssText =
      'font-family:\'Courier New\',monospace;font-size:16px;' +
      'font-variant:small-caps;letter-spacing:10px;color:#aaa;' +
      'margin-bottom:8px;' +
      'opacity:0;animation:waveSlideLeft 0.5s ease 0.3s forwards;';
    waveLabel.textContent = 'W A V E';

    // Wave number — drops from above with bounce
    var waveNumber = document.createElement('div');
    var glitchStyle = isSpecial ? 'animation:waveNumberDrop 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s forwards, waveGlitch 0.4s ease 1.2s 3;' :
                                  'animation:waveNumberDrop 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s forwards;';
    waveNumber.style.cssText =
      'font-family:\'Courier New\',monospace;font-size:96px;font-weight:900;' +
      'color:' + theme.color + ';line-height:1;' +
      'text-shadow:0 0 30px ' + theme.color + ';' +
      'opacity:0;' + glitchStyle;
    waveNumber.textContent = waveNum;

    // Subtitle — slides from right
    var subtitleEl = document.createElement('div');
    var subtitlePulse = theme.gold ? 'animation:waveSlideRight 0.5s ease 0.6s forwards, wavePulseGold 2s ease-in-out 1.1s infinite;' :
                                     'animation:waveSlideRight 0.5s ease 0.6s forwards;';
    subtitleEl.style.cssText =
      'font-family:\'Courier New\',monospace;font-size:20px;letter-spacing:6px;' +
      'color:' + theme.color + ';margin-top:10px;' +
      'text-shadow:0 0 10px ' + theme.color + ';' +
      'opacity:0;' + subtitlePulse;
    subtitleEl.innerHTML = subtitle;

    // Stars
    var starsEl = document.createElement('div');
    starsEl.style.cssText = 'margin-top:18px;opacity:0;animation:waveSlideLeft 0.4s ease 0.8s forwards;';
    starsEl.innerHTML = buildStars(waveNum);

    // Enemy preview
    var enemyEl = document.createElement('div');
    enemyEl.style.cssText = 'opacity:0;animation:waveSlideRight 0.4s ease 1.0s forwards;';
    enemyEl.innerHTML = buildEnemyPreview(enemies);

    card.appendChild(waveLabel);
    card.appendChild(waveNumber);
    card.appendChild(subtitleEl);
    card.appendChild(starsEl);
    card.appendChild(enemyEl);

    container.appendChild(overlay);
    container.appendChild(card);

    // Objective
    var objHint = buildObjectiveHint(waveNum);
    if (objHint) {
      var objEl = document.createElement('div');
      objEl.style.cssText = 'position:absolute;bottom:40px;left:0;right:0;text-align:center;' +
        'opacity:0;animation:waveSlideLeft 0.4s ease 1.1s forwards;';
      objEl.innerHTML = objHint;
      container.appendChild(objEl);
    }

    return { container: container, overlay: overlay };
  }

  // ── Public: show ──────────────────────────────────────────────────────────
  function show(waveNum, waveData) {
    // Clean up any existing card
    _cleanup();

    window._wavePaused = true;

    var built = buildCard(waveNum, waveData || {});
    _container = built.container;
    _overlay = built.overlay;

    document.body.appendChild(_container);

    // Trigger overlay fade-in on next tick
    requestAnimationFrame(function () {
      _overlay.style.opacity = '1';
    });

    // Play audio sting
    playAudioSting();

    // After 3s: fade out
    _hideTimeout = setTimeout(function () {
      _fadeOut();
    }, 3000);
  }

  function _fadeOut() {
    if (!_container) return;
    _container.style.transition = 'opacity 0.6s ease';
    _container.style.opacity = '0';
    setTimeout(function () {
      _cleanup();
      window._wavePaused = false;
    }, 600);
  }

  function _cleanup() {
    if (_hideTimeout) {
      clearTimeout(_hideTimeout);
      _hideTimeout = null;
    }
    if (_animationId) {
      cancelAnimationFrame(_animationId);
      _animationId = null;
    }
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
    }
    _container = null;
    _overlay = null;
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;
    // Pre-inject shared animation styles
    injectScanlineStyle('init');
  }

  // ── Public: update ────────────────────────────────────────────────────────
  function update() {
    // Called each game loop tick — no per-frame work needed currently
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    _cleanup();
    window._wavePaused = false;
    _initialized = false;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    show: show,
    reset: reset
  };
})();
