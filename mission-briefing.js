// mission-briefing.js — Mission briefing screen shown before each level starts
// Military style, dark green/black theme, typewriter intel, CRT scanline overlay.
// Uses IIFE pattern and var throughout (no let/const).
window.MissionBriefing = (function() {
  'use strict';

  // ── Briefing data per level ───────────────────────────────────────────────────
  var BRIEFINGS = {
    'KYIV': {
      name: 'OPERATION IRON DAWN',
      objective: 'Eliminate enemy command in Kyiv city center',
      intel: [
        'Heavy armor reported along main boulevard',
        'Sniper positions on rooftops near Independence Square',
        'Reinforcements arriving from the east'
      ],
      threats: ['SOLDIER', 'HEAVY', 'SNIPER']
    },
    'KHARKIV': {
      name: 'OPERATION STEEL FIST',
      objective: 'Clear enemy occupation of Kharkiv University District',
      intel: [
        'Enemy has fortified university buildings',
        'IED presence reported on main access roads'
      ],
      threats: ['SOLDIER', 'MEDIC', 'HEAVY']
    },
    'KREMLIN': {
      name: 'OPERATION DECAPITATION',
      objective: 'Eliminate senior command in the Kremlin — highest priority target',
      intel: [
        'Presidential bunker detected under Grand Palace',
        'Kremlin Guard Regiment — elite troops',
        'Spasskaya Tower gate is mined'
      ],
      threats: ['KREMLIN_GUARD', 'ELITE', 'BOSS_KREMLIN']
    },
    'FINAL_SIEGE': {
      name: 'OPERATION FINAL RECKONING',
      objective: 'Destroy enemy command center — end the occupation',
      intel: [
        'Marshal Gerasimov confirmed on-site',
        'Full brigade-strength defense',
        'No extraction — fight through'
      ],
      threats: ['ELITE', 'HEAVY', 'BOSS_FINAL_SIEGE']
    }
  };

  var DEFAULT_BRIEFING = {
    name: 'CLASSIFIED OPERATION',
    objective: 'Eliminate all enemy combatants',
    intel: [
      'Limited intel available',
      'Expect heavy resistance',
      'Adapt and overcome'
    ],
    threats: ['SOLDIER', 'HEAVY']
  };

  // ── Module state ──────────────────────────────────────────────────────────────
  var _overlay = null;
  var _typewriterTimers = [];
  var _enterHandler = null;
  var _clickHandler = null;
  var _onComplete = null;
  var _deployPrompt = null;
  var _intelDone = false;
  var _deployShown = false;

  // ── Inject styles once ────────────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('mission-briefing-styles')) return;
    var style = document.createElement('style');
    style.id = 'mission-briefing-styles';
    style.textContent = [
      '@keyframes mbBlink{0%,100%{opacity:1}50%{opacity:0}}',
      '@keyframes mbScanline{0%{background-position:0 0}100%{background-position:0 4px}}',
      '#mission-briefing-overlay{',
        'position:fixed;top:0;left:0;width:100vw;height:100vh;',
        'background:rgba(4,8,4,0.98);',
        'z-index:19999;',
        'display:flex;align-items:center;justify-content:center;',
        'font-family:"Courier New",Courier,monospace;',
        'color:#39ff14;',
        'opacity:0;transition:opacity 0.35s ease;',
      '}',
      '#mission-briefing-overlay.mb-visible{opacity:1}',
      // CRT scanline pseudo-overlay via pointer-events:none child
      '#mission-briefing-scanlines{',
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'pointer-events:none;z-index:20000;',
        'background:repeating-linear-gradient(',
          'to bottom,',
          'transparent 0px,transparent 2px,',
          'rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px',
        ');',
        'animation:mbScanline 0.12s linear infinite;',
      '}',
      '.mb-panel{',
        'max-width:740px;width:96vw;',
        'background:#050c05;',
        'border:2px solid #1a4a0a;',
        'box-shadow:0 0 48px rgba(57,255,20,0.12),inset 0 0 80px rgba(0,0,0,0.6);',
        'padding:28px 32px;box-sizing:border-box;position:relative;',
      '}',
      '.mb-header-line{',
        'font-size:18px;letter-spacing:4px;',
        'color:#39ff14;',
        'text-shadow:0 0 14px rgba(57,255,20,0.7);',
        'margin-bottom:3px;font-weight:bold;',
      '}',
      '.mb-classification{',
        'font-size:11px;letter-spacing:3px;color:#a0ff80;margin-bottom:12px;',
      '}',
      '.mb-divider{border-top:1px solid #1a4a0a;margin:10px 0 14px 0}',
      '.mb-section-label{',
        'font-size:11px;letter-spacing:3px;color:#a0ff80;',
        'margin-bottom:6px;font-weight:bold;',
      '}',
      '.mb-objective{',
        'font-size:13px;letter-spacing:1px;color:#39ff14;',
        'margin-bottom:14px;line-height:1.5;',
      '}',
      '.mb-intel-line{',
        'font-size:12px;letter-spacing:1px;color:#5ec45e;',
        'line-height:1.7;min-height:1.7em;',
      '}',
      '.mb-threats{',
        'font-size:12px;letter-spacing:1px;color:#5ec45e;',
        'margin-bottom:16px;line-height:1.7;',
      '}',
      '.mb-deploy{',
        'font-size:14px;letter-spacing:3px;color:#39ff14;',
        'text-align:center;margin-top:18px;',
        'text-shadow:0 0 10px rgba(57,255,20,0.6);',
        'animation:mbBlink 1s step-start infinite;',
        'display:none;',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  // ── Clear all pending typewriter timers ───────────────────────────────────────
  function _clearTimers() {
    for (var ti = 0; ti < _typewriterTimers.length; ti++) {
      clearTimeout(_typewriterTimers[ti]);
    }
    _typewriterTimers = [];
  }

  // ── Typewrite a single line into an element, call done() when finished ────────
  function _typewriteLine(el, text, msPerChar, done) {
    var idx = 0;
    el.textContent = '';
    function step() {
      if (idx < text.length) {
        el.textContent += text.charAt(idx);
        idx++;
        _typewriterTimers.push(setTimeout(step, msPerChar));
      } else {
        if (done) done();
      }
    }
    step();
  }

  // ── Typewrite an array of lines sequentially ──────────────────────────────────
  function _typewriteLines(container, lines, msPerChar, allDone) {
    var lineIndex = 0;

    function nextLine() {
      if (lineIndex >= lines.length) {
        if (allDone) allDone();
        return;
      }
      var el = document.createElement('div');
      el.className = 'mb-intel-line';
      el.textContent = '';
      container.appendChild(el);
      var text = '▸ ' + lines[lineIndex];
      lineIndex++;
      _typewriteLine(el, text, msPerChar, function() {
        _typewriterTimers.push(setTimeout(nextLine, 120));
      });
    }

    nextLine();
  }

  // ── Show deploy prompt (after intel done or 3s timeout) ──────────────────────
  function _showDeployPrompt() {
    if (_deployShown) return;
    _deployShown = true;
    if (_deployPrompt) {
      _deployPrompt.style.display = 'block';
    }
  }

  // ── Complete and remove overlay ───────────────────────────────────────────────
  function _complete() {
    if (!_overlay) return;

    // Remove listeners
    if (_enterHandler) {
      document.removeEventListener('keydown', _enterHandler);
      _enterHandler = null;
    }
    if (_clickHandler && _overlay) {
      _overlay.removeEventListener('click', _clickHandler);
      _clickHandler = null;
    }

    _clearTimers();

    // Remove scanlines element
    var scanlines = document.getElementById('mission-briefing-scanlines');
    if (scanlines && scanlines.parentNode) {
      scanlines.parentNode.removeChild(scanlines);
    }

    // Fade out overlay
    _overlay.classList.remove('mb-visible');
    var overlayRef = _overlay;
    var cb = _onComplete;
    _overlay = null;
    _onComplete = null;
    _deployPrompt = null;
    _deployShown = false;
    _intelDone = false;

    setTimeout(function() {
      if (overlayRef && overlayRef.parentNode) {
        overlayRef.parentNode.removeChild(overlayRef);
      }
      if (cb) cb();
    }, 380);
  }

  // ── Public: init ──────────────────────────────────────────────────────────────
  function init() {
    _injectStyles();
    // Expose integration hook
    window._onMissionBriefing = function(levelId, cb) {
      show(levelId, cb);
    };
  }

  // ── Public: show ─────────────────────────────────────────────────────────────
  function show(levelId, onComplete) {
    _injectStyles();

    // If already showing, remove immediately
    if (_overlay) {
      _clearTimers();
      if (_overlay.parentNode) _overlay.parentNode.removeChild(_overlay);
      _overlay = null;
    }

    var key = (levelId || '').toString().toUpperCase();
    var data = BRIEFINGS[key] || DEFAULT_BRIEFING;
    _onComplete = onComplete || null;
    _deployShown = false;
    _intelDone = false;

    // ── Build DOM ─────────────────────────────────────────────────────────────

    // CRT scanlines layer (separate element, fixed, pointer-events:none)
    var scanlines = document.createElement('div');
    scanlines.id = 'mission-briefing-scanlines';
    document.body.appendChild(scanlines);

    // Main overlay
    _overlay = document.createElement('div');
    _overlay.id = 'mission-briefing-overlay';

    // Panel
    var panel = document.createElement('div');
    panel.className = 'mb-panel';

    // Header
    var headerLine = document.createElement('div');
    headerLine.className = 'mb-header-line';
    headerLine.textContent = 'OPERATION: ' + data.name;

    var classification = document.createElement('div');
    classification.className = 'mb-classification';
    classification.textContent = 'CLASSIFICATION: TOP SECRET';

    var divider1 = document.createElement('div');
    divider1.className = 'mb-divider';

    // Objective section
    var objLabel = document.createElement('div');
    objLabel.className = 'mb-section-label';
    objLabel.textContent = 'OBJECTIVE:';

    var objText = document.createElement('div');
    objText.className = 'mb-objective';
    objText.textContent = data.objective;

    // Intel section
    var intelLabel = document.createElement('div');
    intelLabel.className = 'mb-section-label';
    intelLabel.textContent = 'INTEL:';

    var intelContainer = document.createElement('div');
    intelContainer.id = 'mb-intel-container';
    intelContainer.style.cssText = 'margin-bottom:14px;min-height:' + (data.intel.length * 1.7) + 'em';

    // Threats section
    var threatsLabel = document.createElement('div');
    threatsLabel.className = 'mb-section-label';
    threatsLabel.textContent = 'THREATS:';

    var threatsContainer = document.createElement('div');
    threatsContainer.className = 'mb-threats';
    for (var ti = 0; ti < data.threats.length; ti++) {
      var threatEl = document.createElement('div');
      threatEl.textContent = '• ' + data.threats[ti];
      threatsContainer.appendChild(threatEl);
    }

    // Deploy prompt
    _deployPrompt = document.createElement('div');
    _deployPrompt.className = 'mb-deploy';
    _deployPrompt.textContent = '[ PRESS ENTER TO DEPLOY ]';

    // Assemble panel
    panel.appendChild(headerLine);
    panel.appendChild(classification);
    panel.appendChild(divider1);
    panel.appendChild(objLabel);
    panel.appendChild(objText);
    panel.appendChild(intelLabel);
    panel.appendChild(intelContainer);
    panel.appendChild(threatsLabel);
    panel.appendChild(threatsContainer);
    panel.appendChild(_deployPrompt);

    _overlay.appendChild(panel);
    document.body.appendChild(_overlay);

    // Fade in
    _typewriterTimers.push(setTimeout(function() {
      if (_overlay) _overlay.classList.add('mb-visible');
    }, 20));

    // ── Start typewriter for intel lines ──────────────────────────────────────
    var intelStartDelay = setTimeout(function() {
      _typewriteLines(intelContainer, data.intel, 30, function() {
        _intelDone = true;
        _showDeployPrompt();
      });
    }, 400);
    _typewriterTimers.push(intelStartDelay);

    // ── 3s safety timeout to show deploy prompt regardless ────────────────────
    var safetyTimeout = setTimeout(function() {
      _showDeployPrompt();
    }, 3000);
    _typewriterTimers.push(safetyTimeout);

    // ── Input handlers ────────────────────────────────────────────────────────
    _enterHandler = function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        if (_deployShown) {
          _complete();
        }
      }
    };
    document.addEventListener('keydown', _enterHandler);

    _clickHandler = function(e) {
      if (_deployShown) {
        e.stopPropagation();
        _complete();
      }
    };
    _overlay.addEventListener('click', _clickHandler);
  }

  // ── Public: hide ─────────────────────────────────────────────────────────────
  function hide() {
    _complete();
  }

  // ── Expose integration hook immediately ───────────────────────────────────────
  window._onMissionBriefing = function(levelId, cb) {
    show(levelId, cb);
  };

  return { init: init, show: show, hide: hide };
})();
