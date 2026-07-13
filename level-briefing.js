// level-briefing.js — Pre-mission briefing screen with tactical map and objectives
// Military/tactical green-on-black terminal aesthetic. Auto-dismissed after 8s or click.
window.LevelBriefing = (function() {
  'use strict';

  // ── Level-specific briefing data ──────────────────────────────────────────────
  var BRIEFING_DATA = {
    'HOSTOMEL AIRPORT': {
      landmark: 'Hostomel Airport Control Tower',
      bossName: 'Col. Zavadsky (VDV Airborne)',
      notes: 'Mass airborne drop in progress. Paratroopers landing on runway. IFVs inbound from north road.',
      threatLevel: 5,
      mapSymbol: 'A',
      mapTheme: 'rural'
    },
    'AVDIIVKA SECTOR': {
      landmark: 'Avdiivka Coking Plant',
      bossName: 'Maj. Petrov (Tank Commander)',
      notes: 'Industrial ruins provide heavy cover. Sniper teams on upper floors. Armor pushing from east.',
      threatLevel: 6,
      mapSymbol: 'I',
      mapTheme: 'urban'
    },
    'BAKHMUT RUINS': {
      landmark: 'Bakhmut City Hall',
      bossName: 'Gen. Utkin (Wagner PMC)',
      notes: 'Total urban devastation. No civilians remain. Wagner advance from three directions simultaneously.',
      threatLevel: 7,
      mapSymbol: 'B',
      mapTheme: 'urban'
    },
    'KHERSON CROSSING': {
      landmark: 'Antonivka Road Bridge',
      bossName: 'Col. Morozov (River Group)',
      notes: 'River crossing under fire. Pontoon bridges guarded. Artillery emplaced on eastern bank.',
      threatLevel: 7,
      mapSymbol: 'R',
      mapTheme: 'rural'
    },
    'MARIUPOL STEELWORKS': {
      landmark: 'Azovstal Steel Plant',
      bossName: 'Gen. Shukailo (Southern Command)',
      notes: 'Azovstal interior is a maze of tunnels and catwalks. Constant thermobaric threat. Fire zones active.',
      threatLevel: 8,
      mapSymbol: 'S',
      mapTheme: 'industrial'
    },
    'CRIMEA BRIDGE': {
      landmark: 'Kerch Strait Bridge',
      bossName: 'Adm. Sokolov (Black Sea Fleet)',
      notes: 'Naval marines defending bridge sections. Air support available to enemy. Drone jamming active in sector.',
      threatLevel: 8,
      mapSymbol: 'X',
      mapTheme: 'naval'
    },
    'CHORNOBYL ZONE': {
      landmark: 'Reactor No. 4 Sarcophagus',
      bossName: 'Maj. Kalinichenko (Spetsnaz Alpha)',
      notes: 'Radiation drains HP continuously. Geiger counter will spike in hot zones. Enemy uses radiation for cover.',
      threatLevel: 8,
      mapSymbol: 'Z',
      mapTheme: 'wasteland'
    },
    'OUTER MOSCOW': {
      landmark: 'Moscow Ring Road (MKAD)',
      bossName: 'Gen. Dvornikov (Army Group Center)',
      notes: 'FSB elite and Rosgvardiya defend suburbs in depth. Multiple defensive rings. Air defense active.',
      threatLevel: 9,
      mapSymbol: 'M',
      mapTheme: 'urban'
    },
    'SEVASTOPOL NAVAL BASE': {
      landmark: 'Black Sea Fleet HQ',
      bossName: 'Adm. Makarov (Fleet Commander)',
      notes: 'Ship artillery will rain down every 45 seconds. Naval infantry dug in along docks. Submarine threat offshore.',
      threatLevel: 9,
      mapSymbol: 'N',
      mapTheme: 'naval'
    },
    'DONBAS FINAL PUSH': {
      landmark: 'Donetsk Regional Admin Building',
      bossName: 'Gen. Surovikin (Combined Forces)',
      notes: 'Kadyrovites, Wagner, and regular army in combined arms assault. Mortar teams pre-positioned on every roof.',
      threatLevel: 9,
      mapSymbol: 'D',
      mapTheme: 'urban'
    },
    'BELGOROD OFFENSIVE': {
      landmark: 'Belgorod Central Station',
      bossName: 'Col. Romanov (1st Guards Tank Army)',
      notes: 'First strike into enemy territory. Mechanized counter-attack expected within 8 minutes of contact.',
      threatLevel: 9,
      mapSymbol: 'V',
      mapTheme: 'rural'
    },
    'KREMLIN SHOWDOWN': {
      landmark: 'Grand Kremlin Palace',
      bossName: 'Supreme Commander',
      notes: 'Maximum security. Guard rotations every 30 min. Boss is fortified in the inner sanctum. No mercy.',
      threatLevel: 10,
      mapSymbol: 'K',
      mapTheme: 'city'
    },
    'BATTLE OF KYIV': {
      landmark: 'Presidential Palace',
      bossName: 'Gen. Kadyrov (Proxy)',
      notes: 'Urban combat. Multiple armored column ambush points. Bayraktar drone support available to us.',
      threatLevel: 8,
      mapSymbol: 'C',
      mapTheme: 'city'
    },
    'SNAKE ISLAND DEFENSE': {
      landmark: 'Snake Island Lighthouse',
      bossName: 'Capt. Osipov (Moskva Cruiser)',
      notes: 'Naval bombardment from Russian warship Moskva. Limited cover. MANPADS critical. Famous last words incoming.',
      threatLevel: 6,
      mapSymbol: 'L',
      mapTheme: 'naval'
    },
    'SAKY AIRBASE STRIKE': {
      landmark: 'Saky Military Airbase',
      bossName: 'Col. Kuznetsov (Air Wing CO)',
      notes: 'Airbase raid. Parked Su-24 bombers are priority targets. Heavy drone presence overhead. Jammer rifle critical.',
      threatLevel: 7,
      mapSymbol: 'F',
      mapTheme: 'industrial'
    },
    'VUHLEDAR TANK GRAVEYARD': {
      landmark: 'Vuhledar Town Centre',
      bossName: 'Maj. Gen. Neverov (155th Naval Infantry)',
      notes: 'Minefield corridors funneled two Russian brigades to destruction here. Repeat the lesson.',
      threatLevel: 8,
      mapSymbol: 'T',
      mapTheme: 'rural'
    },
    // Default for unknown/unspecified levels
    '_DEFAULT': {
      landmark: 'Enemy Command Post',
      bossName: 'Enemy Commander',
      notes: 'Standard assault protocol applies. Expect fortified positions. Stay low and advance by fire.',
      threatLevel: 6,
      mapSymbol: '?',
      mapTheme: 'rural'
    }
  };

  // ── Module state ──────────────────────────────────────────────────────────────
  var _overlay = null;
  var _countdownTimer = null;
  var _typewriterTimer = null;
  var _dismissCallback = null;
  var _secondsLeft = 8;
  var _initialized = false;

  // ── ASCII map generator ───────────────────────────────────────────────────────
  function _generateAsciiMap(theme) {
    var rows = 8;
    var cols = 22;
    var lines = [];

    if (theme === 'urban' || theme === 'city') {
      // Dense city blocks — packed rectangles
      var patterns = [
        '████░░░██████░░██████',
        '████░░░██░░░░░░░░████',
        '░░░░░░░██░█████░░░░░░',
        '█████░░░░░█████░█████',
        '█░░░█░░░░░░░░░░░█░░░█',
        '█░░░████░░░████░█░░░█',
        '░░░░░░░░░░░░░░░░░░░░░',
        '████████░░████████░░░'
      ];
      lines = patterns;
    } else if (theme === 'industrial') {
      // Factory/steel plant — geometric structures
      var patterns = [
        '░░████████░░████████░',
        '░░█┼┼┼┼┼█░░█┼┼┼┼┼█░',
        '░░█┼┼┼┼┼█░░█┼┼┼┼┼█░',
        '░░████████░░████████░',
        '░░░░░░│░░░░░░░│░░░░░░',
        '███████│███████│█████',
        '░░░░░░░░░░░░░░░░░░░░░',
        '═════════════════════'
      ];
      lines = patterns;
    } else if (theme === 'naval') {
      // Bridge/water — horizontal linear pattern
      var patterns = [
        '~~~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~',
        '═════════════════════',
        '─────────────────────',
        '═════════════════════',
        '~~~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~'
      ];
      lines = patterns;
    } else if (theme === 'wasteland') {
      // Chernobyl zone — open with hazard zones
      var patterns = [
        '░░░░░▓▓▓░░░░░░░░░░░░░',
        '░░▓▓▓▓▓▓▓░░░█████░░░░',
        '░░▓░░░░░░░░░░░░░░░░░░',
        '░░░░░░░░░░░░░░░░█████',
        '░░░░░█░░░░▓▓▓░░░░░░░░',
        '░░░░░░░░░░▓▓▓░░░░░░░░',
        '█████░░░░░░░░░░░░░░░░',
        '░░░░░░░░░░░░░░░░░░░░░'
      ];
      lines = patterns;
    } else {
      // Rural/grassland — open terrain with scattered clusters
      var patterns = [
        '░░░░░░░░░░░░░░░░░░░░░',
        '░░████░░░░░░░░████░░░',
        '░░░░░░░░░░░░░░░░░░░░░',
        '░░░░░░░░░░░░░░░░░░░░░',
        '░░░░░████░░░████░░░░░',
        '░░░░░░░░░░░░░░░░░░░░░',
        '░░████░░░░░░░░░░████░',
        '░░░░░░░░░░░░░░░░░░░░░'
      ];
      lines = patterns;
    }

    return lines;
  }

  // ── Threat level bar renderer ─────────────────────────────────────────────────
  function _threatBar(level) {
    var bar = '';
    for (var i = 0; i < 10; i++) {
      bar += i < level ? '█' : '░';
    }
    var label = level >= 10 ? 'CRITICAL' : level >= 8 ? 'SEVERE' : level >= 6 ? 'HIGH' : level >= 4 ? 'MODERATE' : 'LOW';
    return bar + ' ' + label;
  }

  // ── Sound effects ─────────────────────────────────────────────────────────────
  function _playBriefingSound() {
    try {
      var ctx = window._audioCtx;
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        window._audioCtx = ctx;
      }
      if (ctx.state === 'suspended') ctx.resume();

      // White noise burst (radio static) — 0.15s
      var bufLen = Math.floor(ctx.sampleRate * 0.15);
      var noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = noiseBuf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      var noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(ctx.currentTime);
      noiseSource.stop(ctx.currentTime + 0.15);

      // Click tone — 800Hz, 0.1s
      var osc = ctx.createOscillator();
      var oscGain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
      oscGain.gain.setValueAtTime(0.0, ctx.currentTime + 0.05);
      oscGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.06);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio unavailable — silent fallback
    }
  }

  // ── Typewriter animation ──────────────────────────────────────────────────────
  function _typewriter(el, text, msPerChar) {
    if (_typewriterTimer) clearInterval(_typewriterTimer);
    var idx = 0;
    el.textContent = '';
    _typewriterTimer = setInterval(function() {
      if (idx < text.length) {
        el.textContent += text[idx];
        idx++;
      } else {
        clearInterval(_typewriterTimer);
        _typewriterTimer = null;
      }
    }, msPerChar);
  }

  // ── Dismiss handler ───────────────────────────────────────────────────────────
  function _dismiss() {
    if (!_overlay) return;
    if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }
    if (_typewriterTimer) { clearInterval(_typewriterTimer); _typewriterTimer = null; }
    _overlay.style.opacity = '0';
    _overlay.style.transition = 'opacity 0.4s ease';
    var cb = _dismissCallback;
    _dismissCallback = null;
    setTimeout(function() {
      if (_overlay && _overlay.parentNode) {
        _overlay.parentNode.removeChild(_overlay);
      }
      _overlay = null;
      if (cb) cb();
    }, 420);
  }

  // ── Public API: init ──────────────────────────────────────────────────────────
  function init() {
    _initialized = true;
  }

  // ── Public API: showBriefing ──────────────────────────────────────────────────
  function showBriefing(levelName, onDismiss) {
    // Resolve briefing data
    var data = BRIEFING_DATA[levelName] || BRIEFING_DATA['_DEFAULT'];
    var opName = (levelName || 'UNKNOWN').toUpperCase();
    _dismissCallback = onDismiss || null;
    _secondsLeft = 8;

    // Build ASCII map
    var mapLines = _generateAsciiMap(data.mapTheme);

    // Create overlay
    _overlay = document.createElement('div');
    _overlay.id = 'level-briefing-overlay';
    _overlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'background:rgba(8,12,6,0.97)',
      'z-index:10000',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-family:"Courier New",Courier,monospace',
      'color:#a8c040',
      'cursor:pointer',
      'opacity:1',
      'transition:opacity 0.4s ease'
    ].join(';');

    // Inner panel
    var panel = document.createElement('div');
    panel.style.cssText = [
      'max-width:780px',
      'width:96vw',
      'background:#0a0c08',
      'border:2px solid #3a5a1a',
      'padding:24px 28px',
      'box-shadow:0 0 40px rgba(100,180,40,0.15),inset 0 0 60px rgba(0,0,0,0.5)',
      'position:relative',
      'box-sizing:border-box'
    ].join(';');

    // ── Header ──
    var header = document.createElement('div');
    header.style.cssText = 'font-size:20px;letter-spacing:3px;color:#c8e860;text-shadow:0 0 12px rgba(168,192,64,0.6);margin-bottom:6px;font-weight:bold';
    header.textContent = '[CLASSIFIED] OPERATION ' + opName;

    var divider1 = document.createElement('div');
    divider1.style.cssText = 'border-top:1px solid #3a5a1a;margin:10px 0 12px 0';

    // Threat level
    var threatRow = document.createElement('div');
    threatRow.style.cssText = 'font-size:13px;letter-spacing:2px;margin-bottom:14px;color:#a8c040';
    threatRow.textContent = 'THREAT ASSESSMENT: ' + _threatBar(data.threatLevel);

    // ── Body layout (map + objectives) ──
    var bodyRow = document.createElement('div');
    bodyRow.style.cssText = 'display:flex;gap:24px;align-items:flex-start;margin-bottom:14px';

    // Left: ASCII map
    var mapBox = document.createElement('div');
    mapBox.style.cssText = [
      'background:#060904',
      'border:1px solid #2a4010',
      'padding:8px 10px',
      'font-size:11px',
      'line-height:1.4',
      'color:#6a9020',
      'white-space:pre',
      'font-family:"Courier New",Courier,monospace',
      'min-width:186px',
      'flex-shrink:0'
    ].join(';');

    var mapLabel = document.createElement('div');
    mapLabel.style.cssText = 'font-size:9px;letter-spacing:2px;color:#4a7010;margin-bottom:4px;text-align:center';
    mapLabel.textContent = '[ TACTICAL MAP ]';
    mapBox.appendChild(mapLabel);

    for (var mi = 0; mi < mapLines.length; mi++) {
      var row = document.createElement('div');
      row.textContent = mapLines[mi].substring(0, 21);
      mapBox.appendChild(row);
    }

    // Map symbol callout
    var mapSym = document.createElement('div');
    mapSym.style.cssText = 'text-align:center;color:#a8c040;font-size:10px;margin-top:4px;letter-spacing:1px';
    mapSym.textContent = '[ ' + data.mapSymbol + ' ] OBJECTIVE ZONE';
    mapBox.appendChild(mapSym);

    // Right column: objectives + intel
    var rightCol = document.createElement('div');
    rightCol.style.cssText = 'flex:1;min-width:0';

    var objTitle = document.createElement('div');
    objTitle.style.cssText = 'font-size:13px;letter-spacing:2px;color:#c8e860;margin-bottom:8px;font-weight:bold';
    objTitle.textContent = 'MISSION OBJECTIVES:';

    var objectives = [
      'Neutralize all enemy forces in sector',
      'Secure the ' + data.landmark,
      'Eliminate ' + data.bossName
    ];

    var objList = document.createElement('div');
    objList.style.cssText = 'margin-bottom:16px';
    for (var oi = 0; oi < objectives.length; oi++) {
      var objItem = document.createElement('div');
      objItem.style.cssText = 'font-size:12px;letter-spacing:1px;color:#a8c040;margin-bottom:5px;padding-left:4px';
      objItem.textContent = '▶ ' + objectives[oi];
      objList.appendChild(objItem);
    }

    var intelTitle = document.createElement('div');
    intelTitle.style.cssText = 'font-size:13px;letter-spacing:2px;color:#c8e860;margin-bottom:8px;font-weight:bold';
    intelTitle.textContent = 'INTEL NOTES:';

    var intelText = document.createElement('div');
    intelText.id = 'briefing-intel-text';
    intelText.style.cssText = 'font-size:11px;letter-spacing:1px;color:#88a030;line-height:1.6;margin-bottom:10px;min-height:36px';

    var intelExtras = document.createElement('div');
    intelExtras.style.cssText = 'font-size:11px;color:#6a8820;line-height:1.8';
    intelExtras.innerHTML = 'Enemy count: <span style="color:#e8a040">HIGH</span><br>' +
      'Civilians: <span style="color:#a8c040">EVACUATED</span><br>' +
      'Weather: <span style="color:#a8c040">VARIABLE</span>';

    rightCol.appendChild(objTitle);
    rightCol.appendChild(objList);
    rightCol.appendChild(intelTitle);
    rightCol.appendChild(intelText);
    rightCol.appendChild(intelExtras);

    bodyRow.appendChild(mapBox);
    bodyRow.appendChild(rightCol);

    // ── Commander block ──
    var cmdBlock = document.createElement('div');
    cmdBlock.style.cssText = 'display:flex;gap:20px;align-items:flex-start;margin-bottom:14px';

    var cmdLeft = document.createElement('div');
    cmdLeft.style.cssText = 'flex-shrink:0';

    var cmdLabel = document.createElement('div');
    cmdLabel.style.cssText = 'font-size:10px;letter-spacing:2px;color:#6a8820;margin-bottom:4px';
    cmdLabel.textContent = 'ENEMY COMMANDER:';

    // ASCII portrait (simplified block art)
    var portrait = document.createElement('div');
    portrait.style.cssText = [
      'font-size:10px',
      'line-height:1.2',
      'color:#507010',
      'white-space:pre',
      'font-family:"Courier New",Courier,monospace',
      'background:#060904',
      'border:1px solid #2a4010',
      'padding:4px 6px'
    ].join(';');
    portrait.textContent = [
      ' ╔══════════╗',
      ' ║ ▓▓▓▓▓▓▓▓ ║',
      ' ║ ▓ ◉  ◉ ▓ ║',
      ' ║ ▓  ──  ▓ ║',
      ' ║ ▓▓▓▓▓▓▓▓ ║',
      ' ╚══════════╝'
    ].join('\n');

    var cmdName = document.createElement('div');
    cmdName.style.cssText = 'font-size:11px;letter-spacing:1px;color:#a8c040;margin-top:4px;text-align:center';
    cmdName.textContent = data.bossName;

    cmdLeft.appendChild(cmdLabel);
    cmdLeft.appendChild(portrait);
    cmdLeft.appendChild(cmdName);

    var cmdRight = document.createElement('div');
    cmdRight.style.cssText = 'flex:1;font-size:11px;color:#6a8820;line-height:1.8;padding-top:16px';
    cmdRight.innerHTML =
      'Status: <span style="color:#e84040">HOSTILE / ARMED</span><br>' +
      'Rank: <span style="color:#a8c040">SENIOR COMMAND</span><br>' +
      'Priority: <span style="color:#e8a040">HIGH VALUE TARGET</span>';

    cmdBlock.appendChild(cmdLeft);
    cmdBlock.appendChild(cmdRight);

    var divider2 = document.createElement('div');
    divider2.style.cssText = 'border-top:1px solid #3a5a1a;margin:10px 0 12px 0';

    // ── Footer ──
    var footer = document.createElement('div');
    footer.style.cssText = 'display:flex;justify-content:space-between;align-items:center';

    var startPrompt = document.createElement('div');
    startPrompt.style.cssText = 'font-size:13px;letter-spacing:2px;color:#c8e860;animation:briefingBlink 1s ease-in-out infinite';
    startPrompt.textContent = '[PRESS SPACE OR CLICK TO BEGIN MISSION]';

    var countdown = document.createElement('div');
    countdown.id = 'briefing-countdown';
    countdown.style.cssText = 'font-size:13px;letter-spacing:2px;color:#6a8820';
    countdown.textContent = 'AUTO IN: 08s';

    footer.appendChild(startPrompt);
    footer.appendChild(countdown);

    // ── Assemble panel ──
    panel.appendChild(header);
    panel.appendChild(divider1);
    panel.appendChild(threatRow);
    panel.appendChild(bodyRow);
    panel.appendChild(cmdBlock);
    panel.appendChild(divider2);
    panel.appendChild(footer);

    _overlay.appendChild(panel);

    // Inject keyframe animation
    if (!document.getElementById('briefing-keyframes')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'briefing-keyframes';
      styleEl.textContent = '@keyframes briefingBlink{0%,100%{opacity:1}50%{opacity:0.4}}';
      document.head.appendChild(styleEl);
    }

    document.body.appendChild(_overlay);

    // ── Play sound ──
    _playBriefingSound();

    // ── Start typewriter for intel notes (0.5s delay) ──
    setTimeout(function() {
      var el = document.getElementById('briefing-intel-text');
      if (el) _typewriter(el, data.notes, 30);
    }, 500);

    // ── Countdown ticker ──
    _secondsLeft = 8;
    var cntEl = document.getElementById('briefing-countdown');
    _countdownTimer = setInterval(function() {
      _secondsLeft--;
      if (cntEl) {
        cntEl.textContent = 'AUTO IN: ' + (_secondsLeft < 10 ? '0' : '') + _secondsLeft + 's';
      }
      if (_secondsLeft <= 0) {
        clearInterval(_countdownTimer);
        _countdownTimer = null;
        _dismiss();
      }
    }, 1000);

    // ── Click / Space to dismiss ──
    _overlay.addEventListener('click', function(e) {
      e.stopPropagation();
      _dismiss();
    });

    var _spaceHandler = function(e) {
      if (e.code === 'Space' && _overlay) {
        e.preventDefault();
        document.removeEventListener('keydown', _spaceHandler);
        _dismiss();
      }
    };
    document.addEventListener('keydown', _spaceHandler);
  }

  // ── Public API: hide ──────────────────────────────────────────────────────────
  function hide() {
    _dismiss();
  }

  return { init: init, showBriefing: showBriefing, hide: hide };
})();
