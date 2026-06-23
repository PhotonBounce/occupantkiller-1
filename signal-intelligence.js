// No let/const — only var throughout, IIFE pattern
window.SignalIntelligence = (function() {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var CHANNELS = [
    { freq: '88.5 MHz',  label: 'CH-1' },
    { freq: '102.3 MHz', label: 'CH-2' },
    { freq: '156.8 MHz', label: 'CH-3' }
  ];

  var INTEL_TYPES = ['patrol', 'cache', 'reinforcement', 'boss'];

  var INTEL_LABELS = {
    patrol:         'Enemy patrol route revealed',
    cache:          'Supply cache location acquired',
    reinforcement:  'Reinforcement timer intercepted',
    boss:           'Boss position ping received'
  };

  var DECRYPT_ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  var DECRYPT_LENGTH  = 5;
  var DECRYPT_TIMEOUT = 5000; // ms
  var ANTENNA_BOOST   = 0.30;
  var JAM_DURATION    = 30;   // seconds
  var PATROL_DURATION = 45;   // seconds
  var BOSS_PING_DURATION = 60; // seconds
  var SCORE_PER_INTERCEPT = 200;
  var CONSECUTIVE_BONUS_THRESHOLD = 3;

  // ─── State ────────────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;
  var _audioCtx = null;

  var _open        = false;
  var _selectedCh  = 0;       // 0,1,2
  var _signalStrengths = [0, 0, 0]; // 0-1
  var _signalTimer    = 0;
  var _signalInterval = 2.5;   // seconds between random strength updates

  // Decrypt mini-game
  var _decryptActive  = false;
  var _decryptSequence = [];
  var _decryptProgress = [];
  var _decryptTimer   = 0;

  // Intel
  var _score          = 0;
  var _consecutiveHits = 0;
  var _intelLog        = [];   // {time, text}

  // Active overlays
  var _patrolTimer    = 0;
  var _bossTimer      = 0;
  var _reinforcementTimer = 0; // seconds remaining; 0 = inactive
  var _jammingTimer   = 0;     // seconds remaining; 0 = inactive

  // Field antenna
  var _antennaPlaced  = false;
  var _antennaMesh    = null;
  var _antennaPos     = null;

  // Jamming wave mesh
  var _jamWave        = null;
  var _jamWaveAge     = 0;

  // Minimap markers (canvas overlays managed externally or mocked here)
  var _minimapPatrolPath    = null; // array of {x,z}
  var _minimapCacheMark     = null; // {x,z}
  var _minimapBossMark      = null; // {x,z}

  // Compass bearing state
  var _bearing     = 0;     // current compass rose angle (degrees, 0=North)
  var _targetBearing = 0;   // where signal source is

  // Encryption keys collected
  var _encryptionKeys = 0;

  // DOM references
  var _panel          = null;
  var _chEls          = [];
  var _strengthBars   = [];
  var _decryptEl      = null;
  var _sequenceEl     = null;
  var _intelLogEl     = null;
  var _compassEl      = null;
  var _reinHudEl      = null;
  var _jamHudEl       = null;
  var _scoreHudEl     = null;

  // Key state
  var _keysDown = {};

  // ─── Audio ────────────────────────────────────────────────────────────────
  function _getAudio() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playCrackle() {
    try {
      var ctx = _getAudio();
      var bufSize = ctx.sampleRate * 0.4;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.8;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch(e) {}
  }

  function _playMorseBeep(count) {
    try {
      var ctx = _getAudio();
      var dotDur = 0.08;
      var gap    = 0.06;
      for (var i = 0; i < count; i++) {
        (function(idx) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.value = 620;
          var t = ctx.currentTime + idx * (dotDur + gap);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
          gain.gain.setValueAtTime(0.12, t + dotDur - 0.005);
          gain.gain.linearRampToValueAtTime(0, t + dotDur);
          osc.start(t);
          osc.stop(t + dotDur + 0.01);
        })(i);
      }
    } catch(e) {}
  }

  function _playJamPulse() {
    try {
      var ctx = _getAudio();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.65);
    } catch(e) {}
  }

  function _playSuccess() {
    try {
      var ctx = _getAudio();
      var freqs = [523, 659, 784, 1047];
      for (var i = 0; i < freqs.length; i++) {
        (function(idx) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freqs[idx];
          var t = ctx.currentTime + idx * 0.08;
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.start(t);
          osc.stop(t + 0.3);
        })(i);
      }
    } catch(e) {}
  }

  function _playFail() {
    try {
      var ctx = _getAudio();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch(e) {}
  }

  // ─── HUD / DOM ────────────────────────────────────────────────────────────
  function _buildPanel() {
    if (_panel) return;

    _panel = document.createElement('div');
    _panel.id = 'sigint-panel';
    _panel.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'background:rgba(0,8,0,0.88);',
      'z-index:9000;display:none;',
      'font-family:monospace;color:#00ff66;',
      'user-select:none;'
    ].join('');

    // Header
    var header = document.createElement('div');
    header.style.cssText = [
      'position:absolute;top:30px;left:50%;transform:translateX(-50%);',
      'font-size:22px;letter-spacing:6px;text-shadow:0 0 12px #00ff66;',
      'border-bottom:1px solid #00ff33;padding-bottom:8px;width:560px;text-align:center;'
    ].join('');
    header.textContent = '[ SIGINT INTERCEPT TERMINAL ]';
    _panel.appendChild(header);

    // Channels
    var chContainer = document.createElement('div');
    chContainer.style.cssText = [
      'position:absolute;top:90px;left:50%;transform:translateX(-50%);',
      'width:560px;'
    ].join('');

    for (var c = 0; c < 3; c++) {
      (function(ci) {
        var row = document.createElement('div');
        row.style.cssText = [
          'display:flex;align-items:center;gap:12px;',
          'margin-bottom:16px;padding:8px 12px;',
          'border:1px solid #004422;cursor:pointer;',
          'transition:background 0.15s;'
        ].join('');
        row.dataset.ch = ci;

        var label = document.createElement('span');
        label.style.cssText = 'width:70px;font-size:13px;color:#00cc55;';
        label.textContent = '[' + (ci+1) + '] ' + CHANNELS[ci].label;

        var freq = document.createElement('span');
        freq.style.cssText = 'width:110px;font-size:14px;';
        freq.textContent = CHANNELS[ci].freq;

        var barWrap = document.createElement('div');
        barWrap.style.cssText = [
          'flex:1;height:14px;background:#001a00;',
          'border:1px solid #003311;position:relative;'
        ].join('');
        var bar = document.createElement('div');
        bar.style.cssText = [
          'height:100%;width:0%;',
          'background:linear-gradient(90deg,#00ff33,#88ff00);',
          'transition:width 0.4s;'
        ].join('');
        barWrap.appendChild(bar);
        _strengthBars.push(bar);

        var pct = document.createElement('span');
        pct.style.cssText = 'width:48px;text-align:right;font-size:12px;color:#00aa44;';
        pct.textContent = '0%';

        row.appendChild(label);
        row.appendChild(freq);
        row.appendChild(barWrap);
        row.appendChild(pct);
        chContainer.appendChild(row);
        _chEls.push({ row: row, pct: pct });

        row.addEventListener('click', function() {
          _selectChannel(ci);
        });
      })(c);
    }
    _panel.appendChild(chContainer);

    // Compass rose
    _compassEl = document.createElement('canvas');
    _compassEl.width  = 120;
    _compassEl.height = 120;
    _compassEl.style.cssText = [
      'position:absolute;top:90px;right:60px;',
      'border:1px solid #004422;background:rgba(0,10,0,0.7);'
    ].join('');
    _panel.appendChild(_compassEl);

    var compassLabel = document.createElement('div');
    compassLabel.style.cssText = [
      'position:absolute;top:218px;right:60px;',
      'font-size:10px;color:#00aa44;text-align:center;width:120px;'
    ].join('');
    compassLabel.textContent = 'SIGNAL BEARING';
    _panel.appendChild(compassLabel);

    // Decrypt UI
    _decryptEl = document.createElement('div');
    _decryptEl.id = 'sigint-decrypt';
    _decryptEl.style.cssText = [
      'position:absolute;top:260px;left:50%;transform:translateX(-50%);',
      'width:560px;border:1px solid #006633;padding:16px;',
      'display:none;'
    ].join('');

    var decryptTitle = document.createElement('div');
    decryptTitle.style.cssText = 'font-size:13px;letter-spacing:3px;color:#00ff66;margin-bottom:10px;';
    decryptTitle.textContent = 'DECRYPTION SEQUENCE';
    _decryptEl.appendChild(decryptTitle);

    _sequenceEl = document.createElement('div');
    _sequenceEl.style.cssText = 'font-size:28px;letter-spacing:8px;margin-bottom:8px;text-align:center;';
    _decryptEl.appendChild(_sequenceEl);

    var timerLabel = document.createElement('div');
    timerLabel.id = 'sigint-decrypt-timer';
    timerLabel.style.cssText = 'font-size:11px;color:#cc8800;text-align:center;';
    timerLabel.textContent = 'TIME: 5.0s';
    _decryptEl.appendChild(timerLabel);

    _panel.appendChild(_decryptEl);

    // Intel log
    var logTitle = document.createElement('div');
    logTitle.style.cssText = [
      'position:absolute;top:90px;left:30px;',
      'font-size:11px;letter-spacing:3px;color:#00aa44;'
    ].join('');
    logTitle.textContent = 'INTEL LOG';
    _panel.appendChild(logTitle);

    _intelLogEl = document.createElement('div');
    _intelLogEl.style.cssText = [
      'position:absolute;top:112px;left:30px;width:220px;',
      'height:300px;overflow-y:auto;',
      'font-size:10px;line-height:1.6;color:#00cc55;',
      'border:1px solid #002a11;padding:6px;background:rgba(0,5,0,0.5);'
    ].join('');
    _panel.appendChild(_intelLogEl);

    // Controls hint
    var hint = document.createElement('div');
    hint.style.cssText = [
      'position:absolute;bottom:30px;left:50%;transform:translateX(-50%);',
      'font-size:11px;color:#005522;letter-spacing:2px;text-align:center;'
    ].join('');
    hint.innerHTML = [
      '[ I ] CLOSE &nbsp;|&nbsp; [ 1/2/3 ] SELECT CHANNEL &nbsp;|&nbsp; ',
      '[ SHIFT+I ] PLACE ANTENNA &nbsp;|&nbsp; [ ALT+I ] JAM COMMS'
    ].join('');
    _panel.appendChild(hint);

    document.body.appendChild(_panel);
  }

  function _buildPersistentHUD() {
    // Reinforcement countdown
    _reinHudEl = document.createElement('div');
    _reinHudEl.id = 'sigint-rein-hud';
    _reinHudEl.style.cssText = [
      'position:fixed;top:60px;right:20px;',
      'font-family:monospace;font-size:13px;color:#ff4400;',
      'background:rgba(0,0,0,0.6);padding:4px 8px;border:1px solid #ff2200;',
      'z-index:8000;display:none;letter-spacing:2px;'
    ].join('');
    document.body.appendChild(_reinHudEl);

    // Jamming timer
    _jamHudEl = document.createElement('div');
    _jamHudEl.id = 'sigint-jam-hud';
    _jamHudEl.style.cssText = [
      'position:fixed;top:90px;right:20px;',
      'font-family:monospace;font-size:13px;color:#00aaff;',
      'background:rgba(0,0,0,0.6);padding:4px 8px;border:1px solid #0055ff;',
      'z-index:8000;display:none;letter-spacing:2px;'
    ].join('');
    document.body.appendChild(_jamHudEl);

    // Score display
    _scoreHudEl = document.createElement('div');
    _scoreHudEl.id = 'sigint-score';
    _scoreHudEl.style.cssText = [
      'position:fixed;top:30px;right:20px;',
      'font-family:monospace;font-size:12px;color:#00ff66;',
      'background:rgba(0,0,0,0.5);padding:3px 7px;',
      'z-index:8000;display:none;'
    ].join('');
    document.body.appendChild(_scoreHudEl);
  }

  // ─── Channel Logic ────────────────────────────────────────────────────────
  function _selectChannel(idx) {
    _selectedCh = idx;
    for (var i = 0; i < _chEls.length; i++) {
      _chEls[i].row.style.background = (i === idx)
        ? 'rgba(0,60,20,0.5)' : '';
      _chEls[i].row.style.borderColor = (i === idx)
        ? '#00ff66' : '#004422';
    }
    _playCrackle();
    // Beep count based on channel
    _playMorseBeep(idx + 2);
    // Start decrypt after short delay
    setTimeout(function() {
      if (_open) { _startDecrypt(); }
    }, 600);
  }

  function _updateSignalBars() {
    for (var i = 0; i < 3; i++) {
      var s = _signalStrengths[i];
      if (_antennaPlaced) { s = Math.min(1, s + ANTENNA_BOOST); }
      var pct = Math.round(s * 100);
      _strengthBars[i].style.width = pct + '%';
      _chEls[i].pct.textContent = pct + '%';
      // Colour by strength
      _strengthBars[i].style.background = (pct >= 70)
        ? 'linear-gradient(90deg,#00ff33,#88ff00)'
        : (pct >= 40)
          ? 'linear-gradient(90deg,#aaff00,#ffcc00)'
          : 'linear-gradient(90deg,#ff6600,#ff2200)';
    }
  }

  function _randomiseSignals() {
    for (var i = 0; i < 3; i++) {
      _signalStrengths[i] = 0.10 + Math.random() * 0.80;
    }
    _updateSignalBars();
  }

  // ─── Decrypt mini-game ────────────────────────────────────────────────────
  function _startDecrypt() {
    if (_decryptActive) { return; }
    _decryptActive   = true;
    _decryptSequence = [];
    _decryptProgress = [];
    _decryptTimer    = DECRYPT_TIMEOUT / 1000;

    for (var i = 0; i < DECRYPT_LENGTH; i++) {
      _decryptSequence.push(
        DECRYPT_ARROWS[Math.floor(Math.random() * DECRYPT_ARROWS.length)]
      );
    }

    _renderDecryptSequence();
    _decryptEl.style.display = 'block';
  }

  function _renderDecryptSequence() {
    var arrows = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
    var html = '';
    for (var i = 0; i < _decryptSequence.length; i++) {
      var matched = i < _decryptProgress.length;
      var current = i === _decryptProgress.length;
      html += '<span style="color:' +
        (matched ? '#00ff00' : (current ? '#ffff00' : '#006633')) +
        ';font-size:' + (current ? '36px' : '28px') + ';">' +
        arrows[_decryptSequence[i]] + '</span>';
    }
    _sequenceEl.innerHTML = html;
  }

  function _handleDecryptKey(key) {
    if (!_decryptActive) { return; }
    var expected = _decryptSequence[_decryptProgress.length];
    if (key === expected) {
      _decryptProgress.push(key);
      _renderDecryptSequence();
      if (_decryptProgress.length === _decryptSequence.length) {
        _decryptSuccess();
      }
    } else {
      _decryptFail('WRONG INPUT');
    }
  }

  function _decryptSuccess() {
    _decryptActive = false;
    _decryptEl.style.display = 'none';
    _playSuccess();
    _consecutiveHits++;
    var bonus = (_consecutiveHits >= CONSECUTIVE_BONUS_THRESHOLD) ? 2 : 1;
    _score += SCORE_PER_INTERCEPT * bonus;
    _updateScoreHud();

    var intelType = INTEL_TYPES[Math.floor(Math.random() * INTEL_TYPES.length)];
    _applyIntel(intelType);
  }

  function _decryptFail(reason) {
    _decryptActive = false;
    _decryptProgress = [];
    _consecutiveHits = 0;
    _playFail();
    _flashDecryptResult('DECRYPTION FAILED: ' + (reason || ''), '#ff2200');
    setTimeout(function() {
      if (_open) { _decryptEl.style.display = 'none'; }
    }, 1200);
  }

  function _flashDecryptResult(msg, color) {
    _sequenceEl.textContent = msg;
    _sequenceEl.style.color = color || '#00ff66';
    _sequenceEl.style.fontSize = '16px';
    setTimeout(function() { _sequenceEl.style.fontSize = '28px'; }, 1100);
  }

  // ─── Intel application ────────────────────────────────────────────────────
  function _applyIntel(type) {
    var ts = _timestamp();
    var msg = '';

    if (type === 'patrol') {
      _minimapPatrolPath = _generatePatrolPath();
      _patrolTimer = PATROL_DURATION;
      msg = 'Enemy patrol at Grid ' + _randGrid();
      _logIntel('INTERCEPTED [' + ts + '] ' + msg);
      _showIntelFlash('PATROL ROUTE REVEALED — 45s', '#00ff66');
      _drawMinimapPatrol();

    } else if (type === 'cache') {
      _minimapCacheMark = _randomWorldXZ();
      msg = 'Supply cache at Grid ' + _randGrid();
      _logIntel('INTERCEPTED [' + ts + '] ' + msg);
      _showIntelFlash('SUPPLY CACHE LOCATED', '#ffcc00');
      _spawnCacheWaypoint();

    } else if (type === 'reinforcement') {
      _reinforcementTimer = 90 + Math.floor(Math.random() * 90); // 90-180s
      msg = 'Reinforcements inbound in ' + _fmtTime(_reinforcementTimer);
      _logIntel('INTERCEPTED [' + ts + '] ' + msg);
      _showIntelFlash('REINFORCEMENT TIMER ACTIVE', '#ff8800');
      _reinHudEl.style.display = 'block';

    } else if (type === 'boss') {
      _minimapBossMark = _randomWorldXZ();
      _bossTimer = BOSS_PING_DURATION;
      msg = 'Boss at Grid ' + _randGrid();
      _logIntel('INTERCEPTED [' + ts + '] ' + msg);
      _showIntelFlash('BOSS POSITION PINGED — 60s', '#ff00ff');
    }
  }

  function _generatePatrolPath() {
    var path = [];
    var x = (Math.random() - 0.5) * 80;
    var z = (Math.random() - 0.5) * 80;
    for (var i = 0; i < 6; i++) {
      x += (Math.random() - 0.5) * 20;
      z += (Math.random() - 0.5) * 20;
      path.push({ x: x, z: z });
    }
    return path;
  }

  function _randomWorldXZ() {
    return {
      x: (Math.random() - 0.5) * 80,
      z: (Math.random() - 0.5) * 80
    };
  }

  function _randGrid() {
    var letters = 'ABCDEFGH';
    return letters[Math.floor(Math.random() * letters.length)] +
      '-' + (Math.floor(Math.random() * 8) + 1);
  }

  function _timestamp() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var ss = String(d.getSeconds()).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
  }

  function _fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  // ─── Minimap integration helpers ──────────────────────────────────────────
  function _drawMinimapPatrol() {
    // Publishes to window.Minimap if available; otherwise no-op
    if (window.Minimap && typeof window.Minimap.addPatrolPath === 'function') {
      window.Minimap.addPatrolPath(_minimapPatrolPath, _patrolTimer);
    }
  }

  function _spawnCacheWaypoint() {
    if (window.Minimap && typeof window.Minimap.addWaypoint === 'function') {
      window.Minimap.addWaypoint(_minimapCacheMark, 'cache');
    }
  }

  // ─── Intel flash overlay ──────────────────────────────────────────────────
  function _showIntelFlash(msg, color) {
    var flash = document.createElement('div');
    flash.style.cssText = [
      'position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);',
      'font-family:monospace;font-size:18px;letter-spacing:4px;',
      'color:' + (color || '#00ff66') + ';',
      'text-shadow:0 0 20px ' + (color || '#00ff66') + ';',
      'background:rgba(0,0,0,0.7);padding:14px 28px;',
      'border:1px solid ' + (color || '#00ff66') + ';',
      'z-index:9500;pointer-events:none;',
      'animation:sigint-fade 2s forwards;'
    ].join('');
    flash.textContent = msg;
    document.body.appendChild(flash);
    setTimeout(function() {
      if (flash.parentNode) { flash.parentNode.removeChild(flash); }
    }, 2000);
  }

  function _ensureKeyframes() {
    if (document.getElementById('sigint-keyframes')) { return; }
    var style = document.createElement('style');
    style.id = 'sigint-keyframes';
    style.textContent = [
      '@keyframes sigint-fade {',
      '  0%   { opacity:1; transform:translate(-50%,-50%) scale(1); }',
      '  70%  { opacity:1; }',
      '  100% { opacity:0; transform:translate(-50%,-60%) scale(1.05); }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ─── Intel log ────────────────────────────────────────────────────────────
  function _logIntel(text) {
    _intelLog.push({ time: Date.now(), text: text });
    if (_intelLogEl) {
      var line = document.createElement('div');
      line.style.cssText = 'border-bottom:1px solid #002200;padding-bottom:2px;margin-bottom:2px;';
      line.textContent = text;
      _intelLogEl.appendChild(line);
      _intelLogEl.scrollTop = _intelLogEl.scrollHeight;
    }
  }

  // ─── Score HUD ────────────────────────────────────────────────────────────
  function _updateScoreHud() {
    if (!_scoreHudEl) { return; }
    _scoreHudEl.style.display = 'block';
    var bonusStr = (_consecutiveHits >= CONSECUTIVE_BONUS_THRESHOLD)
      ? ' [x2 STREAK]' : '';
    _scoreHudEl.textContent = 'SIGINT: ' + _score + bonusStr;
  }

  // ─── Compass Rose ─────────────────────────────────────────────────────────
  function _drawCompass(bearing) {
    if (!_compassEl) { return; }
    var ctx = _compassEl.getContext('2d');
    var w = _compassEl.width;
    var h = _compassEl.height;
    var cx = w / 2;
    var cy = h / 2;
    var r  = cx - 8;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#004422';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal labels
    ctx.fillStyle = '#00aa44';
    ctx.font       = '9px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText('N', cx, cy - r + 9);
    ctx.fillText('S', cx, cy + r - 2);
    ctx.fillText('E', cx + r - 2, cy + 4);
    ctx.fillText('W', cx - r + 4, cy + 4);

    // Signal needle
    var rad = (bearing - 90) * Math.PI / 180;
    var strength = _signalStrengths[_selectedCh];
    if (_antennaPlaced) { strength = Math.min(1, strength + ANTENNA_BOOST); }
    ctx.strokeStyle = 'rgba(0,255,80,' + (0.4 + strength * 0.6) + ')';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(rad) * r * 0.8,
      cy + Math.sin(rad) * r * 0.8
    );
    ctx.stroke();

    // Current bearing text
    ctx.fillStyle = '#00ff66';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(bearing) + '°', cx, cy + 4);
  }

  // ─── Field Antenna (Three.js) ─────────────────────────────────────────────
  function _buildAntennaMesh() {
    var group = new THREE.Group();

    // Pole
    var poleGeo = new THREE.CylinderGeometry(0.04, 0.06, 2.5, 6);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var pole    = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.25;
    group.add(pole);

    // Dish (torus + spokes)
    var dishGeo = new THREE.TorusGeometry(0.35, 0.03, 6, 16);
    var dishMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var dish    = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 2.6;
    dish.rotation.x = Math.PI / 3;
    group.add(dish);

    // Centre nub
    var nubGeo = new THREE.SphereGeometry(0.06, 6, 6);
    var nubMat = new THREE.MeshLambertMaterial({ color: 0x00ff66 });
    var nub    = new THREE.Mesh(nubGeo, nubMat);
    nub.position.y = 2.6;
    group.add(nub);

    return group;
  }

  function _placeAntenna() {
    if (_antennaPlaced) {
      _showIntelFlash('ANTENNA ALREADY DEPLOYED', '#cc8800');
      return;
    }
    if (!_scene || !_camera) { return; }

    // Place 3 units in front of camera
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    var pos = _camera.position.clone().add(dir.multiplyScalar(3));
    pos.y = 0;

    _antennaMesh = _buildAntennaMesh();
    _antennaMesh.position.copy(pos);
    _scene.add(_antennaMesh);
    _antennaPos    = pos;
    _antennaPlaced = true;
    _showIntelFlash('FIELD ANTENNA DEPLOYED — SIGNAL +30%', '#00ff66');
    _logIntel('DEPLOYED field antenna at ' + _randGrid());
  }

  // ─── Jamming wave (Three.js) ──────────────────────────────────────────────
  function _buildJamWave() {
    var geo = new THREE.RingGeometry(0.1, 0.5, 32);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x0055ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  // ─── Public: jamEnemyComms ────────────────────────────────────────────────
  function jamEnemyComms() {
    if (_jammingTimer > 0) {
      _showIntelFlash('JAMMING ALREADY ACTIVE', '#0055ff');
      return;
    }
    _jammingTimer = JAM_DURATION;
    _playJamPulse();
    _showIntelFlash('COMMS JAMMING ACTIVE — 30s', '#00aaff');
    _logIntel('DEPLOYED jamming pulse — enemy comms suppressed');
    _jamHudEl.style.display = 'block';

    // Signal external systems
    if (window.EnemyReinforcements &&
        typeof window.EnemyReinforcements.setJammed === 'function') {
      window.EnemyReinforcements.setJammed(true);
    }

    if (_scene && _camera) {
      if (_jamWave && _jamWave.parent) { _scene.remove(_jamWave); }
      _jamWave = _buildJamWave();
      _jamWave.position.copy(_camera.position);
      _jamWave.position.y = 0.2;
      _scene.add(_jamWave);
      _jamWaveAge = 0;
    }
  }

  // ─── Public: collectIntel ─────────────────────────────────────────────────
  function collectIntel(type) {
    _applyIntel(type || INTEL_TYPES[Math.floor(Math.random() * INTEL_TYPES.length)]);
  }

  // ─── Public: openInterface ────────────────────────────────────────────────
  function openInterface() {
    if (!_panel) { _buildPanel(); }
    _open = true;
    _panel.style.display = 'block';
    _randomiseSignals();
    _targetBearing = Math.random() * 360;
    _drawCompass(_bearing);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  function _closeInterface() {
    _open = false;
    if (_panel) { _panel.style.display = 'none'; }
    if (_decryptActive) {
      _decryptActive = false;
      if (_decryptEl) { _decryptEl.style.display = 'none'; }
    }
  }

  // ─── Encryption key pickup ────────────────────────────────────────────────
  function addEncryptionKey() {
    _encryptionKeys++;
    _showIntelFlash('ENCRYPTION KEY ACQUIRED (' + _encryptionKeys + ')', '#ffcc00');
    _logIntel('Encryption key found — advanced channels unlocked');
  }

  // ─── Keyboard handling ────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    // Toggle interface: I (no modifier)
    if (e.code === 'KeyI' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      if (_open) { _closeInterface(); } else { openInterface(); }
      e.preventDefault();
      return;
    }

    // Place antenna: Shift+I
    if (e.code === 'KeyI' && e.shiftKey && !e.altKey) {
      _placeAntenna();
      e.preventDefault();
      return;
    }

    // Jam comms: Alt+I
    if (e.code === 'KeyI' && e.altKey && !e.shiftKey) {
      jamEnemyComms();
      e.preventDefault();
      return;
    }

    if (_open) {
      // Channel select with 1/2/3
      if (e.code === 'Digit1') { _selectChannel(0); e.preventDefault(); return; }
      if (e.code === 'Digit2') { _selectChannel(1); e.preventDefault(); return; }
      if (e.code === 'Digit3') { _selectChannel(2); e.preventDefault(); return; }

      // Decrypt arrow keys
      if (_decryptActive &&
          (e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
           e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        _handleDecryptKey(e.code);
        e.preventDefault();
        return;
      }

      // Escape closes
      if (e.code === 'Escape') {
        _closeInterface();
        e.preventDefault();
      }
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  // ─── Public: init ─────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    _ensureKeyframes();
    _buildPanel();
    _buildPersistentHUD();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    // Randomise initial signals
    _randomiseSignals();
    _targetBearing = Math.random() * 360;
  }

  // ─── Public: update ───────────────────────────────────────────────────────
  function update(delta) {
    // Signal strength drift
    _signalTimer += delta;
    if (_signalTimer >= _signalInterval) {
      _signalTimer = 0;
      _signalInterval = 1.5 + Math.random() * 2;
      // Drift each channel slightly
      for (var i = 0; i < 3; i++) {
        _signalStrengths[i] = Math.max(0.10, Math.min(0.90,
          _signalStrengths[i] + (Math.random() - 0.5) * 0.18
        ));
      }
      if (_open) { _updateSignalBars(); }
    }

    // Compass bearing drifts toward target
    var diff = _targetBearing - _bearing;
    if (diff > 180)  { diff -= 360; }
    if (diff < -180) { diff += 360; }
    _bearing += diff * Math.min(1, delta * 1.5);
    if (_bearing < 0)   { _bearing += 360; }
    if (_bearing > 360) { _bearing -= 360; }
    if (_open) { _drawCompass(_bearing); }

    // Decrypt timer
    if (_decryptActive) {
      _decryptTimer -= delta;
      var timerEl = document.getElementById('sigint-decrypt-timer');
      if (timerEl) {
        timerEl.textContent = 'TIME: ' + Math.max(0, _decryptTimer).toFixed(1) + 's';
        timerEl.style.color = _decryptTimer < 2 ? '#ff2200' : '#cc8800';
      }
      if (_decryptTimer <= 0) {
        _decryptFail('TIMEOUT');
      }
    }

    // Patrol timer
    if (_patrolTimer > 0) {
      _patrolTimer -= delta;
      if (_patrolTimer <= 0) {
        _patrolTimer = 0;
        _minimapPatrolPath = null;
      }
    }

    // Boss ping timer
    if (_bossTimer > 0) {
      _bossTimer -= delta;
      if (_bossTimer <= 0) {
        _bossTimer = 0;
        _minimapBossMark = null;
      }
    }

    // Reinforcement timer
    if (_reinforcementTimer > 0) {
      _reinforcementTimer -= delta;
      if (_reinHudEl) {
        _reinHudEl.style.display = 'block';
        _reinHudEl.textContent = 'REINFORCEMENTS IN: ' +
          _fmtTime(Math.max(0, _reinforcementTimer));
      }
      if (_reinforcementTimer <= 0) {
        _reinforcementTimer = 0;
        if (_reinHudEl) { _reinHudEl.style.display = 'none'; }
        _showIntelFlash('REINFORCEMENTS ARRIVING!', '#ff4400');
      }
    }

    // Jamming timer
    if (_jammingTimer > 0) {
      _jammingTimer -= delta;
      if (_jamHudEl) {
        _jamHudEl.textContent = 'JAMMING: ' + _fmtTime(Math.max(0, _jammingTimer));
      }
      if (_jammingTimer <= 0) {
        _jammingTimer = 0;
        if (_jamHudEl) { _jamHudEl.style.display = 'none'; }
        if (window.EnemyReinforcements &&
            typeof window.EnemyReinforcements.setJammed === 'function') {
          window.EnemyReinforcements.setJammed(false);
        }
        _showIntelFlash('JAMMING EXPIRED', '#0055ff');
      }
    }

    // Jam wave animation
    if (_jamWave && _scene) {
      _jamWaveAge += delta;
      var radius = _jamWaveAge * 18;
      _jamWave.scale.set(radius, radius, 1);
      _jamWave.material.opacity = Math.max(0, 0.7 - _jamWaveAge * 0.6);
      if (_jamWaveAge > 1.2) {
        _scene.remove(_jamWave);
        _jamWave = null;
        _jamWaveAge = 0;
      }
    }

    // Antenna slow rotation
    if (_antennaMesh) {
      _antennaMesh.rotation.y += delta * 0.4;
    }
  }

  // ─── Public: reset ────────────────────────────────────────────────────────
  function reset() {
    _closeInterface();
    _score             = 0;
    _consecutiveHits   = 0;
    _patrolTimer       = 0;
    _bossTimer         = 0;
    _reinforcementTimer = 0;
    _jammingTimer      = 0;
    _minimapPatrolPath = null;
    _minimapCacheMark  = null;
    _minimapBossMark   = null;
    _intelLog          = [];
    _decryptActive     = false;
    _encryptionKeys    = 0;

    if (_antennaPlaced && _antennaMesh && _scene) {
      _scene.remove(_antennaMesh);
    }
    _antennaMesh  = null;
    _antennaPlaced = false;
    _antennaPos    = null;

    if (_jamWave && _scene) { _scene.remove(_jamWave); }
    _jamWave    = null;
    _jamWaveAge = 0;

    if (_reinHudEl)  { _reinHudEl.style.display = 'none'; }
    if (_jamHudEl)   { _jamHudEl.style.display = 'none'; }
    if (_scoreHudEl) { _scoreHudEl.style.display = 'none'; }
    if (_intelLogEl) { _intelLogEl.innerHTML = ''; }

    _randomiseSignals();
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init:            init,
    update:          update,
    openInterface:   openInterface,
    jamEnemyComms:   jamEnemyComms,
    collectIntel:    collectIntel,
    reset:           reset,
    addEncryptionKey: addEncryptionKey
  };

})();
