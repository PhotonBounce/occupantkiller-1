// intelligence-briefing.js — Intelligence briefing panel for FPS game.
// Full-screen military aesthetic, enemy dossiers, terrain map, mission planning.
// Uses IIFE pattern and var throughout (no let/const).

window.IntelligenceBriefing = (function() {
  'use strict';

  // ─── Commander data ───────────────────────────────────────────────────────
  var COMMANDERS = [
    {
      id: 'cmd_001',
      codename: 'IRON WOLF',
      name: 'Col. Dmitri Volkov',
      rank: 'COLONEL',
      trait: 'AGGRESSIVE',
      traitDesc: 'Higher attack speed. Charges position without hesitation.',
      weakness: 'Overextends — flanking from the rear is effective.',
      unit: '3rd Shock Division',
      threat: 'EXTREME',
      unlocked: false
    },
    {
      id: 'cmd_002',
      codename: 'STONE WALL',
      name: 'Maj. Aleksei Panov',
      rank: 'MAJOR',
      trait: 'DEFENSIVE',
      traitDesc: 'Always seeks cover. Rarely advances from fortified position.',
      weakness: 'Smoke grenades displace him. Smokes force repositioning.',
      unit: '12th Guard Regiment',
      threat: 'HIGH',
      unlocked: false
    },
    {
      id: 'cmd_003',
      codename: 'OWL',
      name: 'Lt.Col. Natalya Sorokina',
      rank: 'LT. COLONEL',
      trait: 'METHODICAL',
      traitDesc: 'Takes longer to detect player. Thorough but slow to act.',
      weakness: 'Noise draws attention. Silent approach negates advantage.',
      unit: 'Special Reconnaissance Grp.',
      threat: 'MEDIUM',
      unlocked: false
    },
    {
      id: 'cmd_004',
      codename: 'FIREBIRD',
      name: 'Brig.Gen. Pavel Morozov',
      rank: 'BRIGADIER GEN.',
      trait: 'CHARISMATIC',
      traitDesc: 'Boosts nearby enemy morale — +25% attack to all in radius.',
      weakness: 'Eliminating him triggers morale collapse in nearby units.',
      unit: '7th Combined Arms Army',
      threat: 'EXTREME',
      unlocked: false
    },
    {
      id: 'cmd_005',
      codename: 'MOUSE',
      name: 'Capt. Grigori Belov',
      rank: 'CAPTAIN',
      trait: 'COWARD',
      traitDesc: 'Surrenders at 20% HP. Will attempt to flee the engagement.',
      weakness: 'Cut off escape routes. Corners him to force surrender.',
      unit: '44th Motor Rifle Bn.',
      threat: 'LOW',
      unlocked: false
    }
  ];

  var MISSION_TYPES = {
    ASSAULT:      { label: 'DIRECT ASSAULT',    icon: '⚔' },
    RECON:        { label: 'RECONNAISSANCE',     icon: '👁' },
    EXTRACTION:   { label: 'EXTRACTION',         icon: '🚁' },
    SABOTAGE:     { label: 'SABOTAGE',           icon: '💥' },
    HOSTAGE:      { label: 'HOSTAGE RESCUE',     icon: '🎖' },
    ELIMINATION:  { label: 'HIGH-VALUE TARGET',  icon: '🎯' }
  };

  var THREAT_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'];

  var INTEL_QUALITY_LEVELS = ['POOR', 'GOOD', 'EXCELLENT'];

  var ASSET_LIST = [
    { id: 'air', label: 'AIR SUPPORT',    detail: 'A-10 Warthog — 2 strikes available. Coords via radio.' },
    { id: 'med', label: 'FIELD MEDIC',    detail: 'Combat medic on standby 400m south. EVAC if needed.' },
    { id: 'art', label: 'ARTILLERY',      detail: '155mm battery — indirect fire on marked grid.' },
    { id: 'dro', label: 'RECON DRONE',    detail: 'UAV loiter time: 20 min. EO/IR imaging active.' },
    { id: 'inf', label: 'RANGER ELEMENT', detail: '4-man ranger squad — breaching/backup on request.' }
  ];

  var ORDER_OF_BATTLE = [
    { type: 'RIFLEMEN',         est: '12-18',  cap: 'Standard infantry. AK-74. Coordinated fire.' },
    { type: 'HEAVY GUNNER',     est: '2-4',    cap: 'PKM machine gun. Suppression role. Avoid direct.' },
    { type: 'SNIPER ELEMENT',   est: '1-3',    cap: 'SVD/VSS. Long-range overwatch. Check rooftops.' },
    { type: 'ARMORED VEHICLE',  est: '0-2',    cap: 'BTR-80 APC. Cannon + coax MG. Anti-armor req.' },
    { type: 'FIELD COMMANDER',  est: '1',      cap: 'Leads unit. Eliminating causes disorder.' }
  ];

  // ─── Module state ─────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;

  var _open   = false;
  var _panel  = null;
  var _activeTab = 0;           // 0-4 matching tabs
  var _tabContents = [];        // DOM nodes per tab content
  var _tabButtons  = [];        // DOM nodes for tab buttons

  var _intelQuality    = 0;     // 0=POOR,1=GOOD,2=EXCELLENT
  var _interceptCount  = 0;
  var _missionType     = 'ASSAULT';
  var _threatLevel     = 1;     // index into THREAT_LEVELS

  var _typewriterTimers = [];

  // Terrain map canvas
  var _terrainCanvas = null;

  // Toast queue
  var _toastQueue = [];
  var _toastActive = false;

  // Key state
  var _keysDown = {};

  // ─── Styles ───────────────────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('ib-styles')) { return; }
    var s = document.createElement('style');
    s.id = 'ib-styles';
    s.textContent = [
      '@keyframes ib-blink{0%,100%{opacity:1}50%{opacity:0}}',
      '@keyframes ib-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes ib-toast-in{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:translateX(0)}}',
      '@keyframes ib-toast-out{from{opacity:1}to{opacity:0}}',
      '@keyframes ib-stamp{from{opacity:0;transform:rotate(-18deg) scale(1.4)}to{opacity:0.13;transform:rotate(-18deg) scale(1)}}',
      '#ib-overlay{',
        'position:fixed;top:0;left:0;width:100vw;height:100vh;',
        'background:rgba(6,8,10,0.97);',
        'z-index:18000;display:none;',
        'font-family:"Courier New",Courier,monospace;',
        'color:#d4a017;',
        'user-select:none;',
        'box-sizing:border-box;',
      '}',
      '#ib-inner{',
        'position:absolute;top:50%;left:50%;',
        'transform:translate(-50%,-50%);',
        'width:min(900px,97vw);',
        'max-height:92vh;',
        'display:flex;flex-direction:column;',
        'border:2px solid #4a3800;',
        'box-shadow:0 0 60px rgba(212,160,23,0.15),inset 0 0 120px rgba(0,0,0,0.5);',
        'background:#0a0c0e;',
      '}',
      '#ib-header{',
        'padding:10px 18px 8px;',
        'border-bottom:1px solid #3a2800;',
        'display:flex;align-items:center;justify-content:space-between;',
        'flex-shrink:0;',
      '}',
      '#ib-title{',
        'font-size:16px;letter-spacing:5px;color:#d4a017;',
        'text-shadow:0 0 10px rgba(212,160,23,0.5);',
      '}',
      '#ib-meta{font-size:10px;letter-spacing:2px;color:#7a6010;text-align:right;}',
      '#ib-tabs{',
        'display:flex;border-bottom:1px solid #3a2800;flex-shrink:0;',
      '}',
      '.ib-tab{',
        'padding:7px 14px;font-size:10px;letter-spacing:2px;',
        'color:#7a6010;cursor:pointer;',
        'border-right:1px solid #2a1800;',
        'transition:background 0.15s,color 0.15s;',
        'user-select:none;',
      '}',
      '.ib-tab:hover{background:rgba(212,160,23,0.08);color:#c49010;}',
      '.ib-tab.active{',
        'background:rgba(212,160,23,0.14);',
        'color:#d4a017;',
        'border-bottom:2px solid #d4a017;',
      '}',
      '#ib-body{',
        'flex:1;overflow-y:auto;padding:18px 20px;',
        'min-height:0;',
        'scrollbar-width:thin;',
        'scrollbar-color:#3a2800 #0a0c0e;',
        'position:relative;',
      '}',
      '.ib-tab-content{display:none;animation:ib-fadein 0.25s ease;}',
      '.ib-tab-content.active{display:block;}',
      '.ib-section-label{',
        'font-size:9px;letter-spacing:4px;color:#7a6010;',
        'margin-bottom:6px;margin-top:14px;',
      '}',
      '.ib-section-label:first-child{margin-top:0;}',
      '.ib-value{',
        'font-size:13px;letter-spacing:1px;color:#d4a017;',
        'line-height:1.6;',
      '}',
      '.ib-line{',
        'font-size:12px;color:#b48010;letter-spacing:1px;',
        'line-height:1.7;min-height:1.7em;',
      '}',
      '.ib-divider{border-top:1px solid #2a1800;margin:10px 0;}',
      '.ib-threat-badge{',
        'display:inline-block;',
        'padding:2px 8px;',
        'font-size:11px;letter-spacing:3px;',
        'border:1px solid;',
        'margin-left:10px;',
      '}',
      '.ib-threat-LOW{color:#40c040;border-color:#40c040;}',
      '.ib-threat-MEDIUM{color:#c0c040;border-color:#c0c040;}',
      '.ib-threat-HIGH{color:#c08040;border-color:#c08040;}',
      '.ib-threat-EXTREME{color:#c04040;border-color:#c04040;',
        'animation:ib-blink 1.2s step-start infinite;}',
      '.ib-oob-row{',
        'display:grid;grid-template-columns:160px 80px 1fr;',
        'gap:8px;',
        'font-size:11px;letter-spacing:1px;',
        'color:#b48010;',
        'padding:5px 0;',
        'border-bottom:1px solid #1a1200;',
      '}',
      '.ib-oob-row span:first-child{color:#d4a017;}',
      '.ib-oob-row span:nth-child(2){color:#f0c030;text-align:center;}',
      '.ib-asset-row{',
        'display:grid;grid-template-columns:160px 1fr;',
        'gap:8px;font-size:11px;letter-spacing:1px;',
        'color:#b48010;padding:5px 0;',
        'border-bottom:1px solid #1a1200;',
      '}',
      '.ib-asset-row span:first-child{color:#d4a017;}',
      '.ib-dossier-card{',
        'display:grid;grid-template-columns:90px 1fr;',
        'gap:14px;',
        'padding:12px;margin-bottom:12px;',
        'border:1px solid #3a2800;',
        'background:rgba(20,14,0,0.6);',
        'animation:ib-fadein 0.3s ease;',
      '}',
      '.ib-dossier-locked{',
        'padding:10px 14px;margin-bottom:8px;',
        'border:1px solid #2a1800;',
        'color:#3a2800;',
        'font-size:11px;letter-spacing:2px;',
      '}',
      '.ib-photo{',
        'width:80px;height:80px;',
        'border:1px solid #4a3800;',
        'background:#0e0a02;',
        'display:flex;align-items:center;justify-content:center;',
        'flex-shrink:0;',
      '}',
      '.ib-photo-inner{',
        'font-size:28px;',
        'filter:blur(0);',
        'transition:filter 0.3s;',
      '}',
      '.ib-photo-inner.blurred{filter:blur(6px);}',
      '.ib-dossier-name{font-size:13px;color:#d4a017;letter-spacing:2px;margin-bottom:2px;}',
      '.ib-dossier-rank{font-size:10px;color:#7a6010;letter-spacing:2px;margin-bottom:6px;}',
      '.ib-trait-badge{',
        'display:inline-block;',
        'padding:1px 6px;',
        'font-size:9px;letter-spacing:2px;',
        'border:1px solid #c08040;color:#c08040;',
        'margin-bottom:6px;',
      '}',
      '.ib-dossier-text{font-size:10px;color:#b48010;letter-spacing:1px;line-height:1.6;}',
      '#ib-footer{',
        'padding:6px 18px;',
        'border-top:1px solid #2a1800;',
        'font-size:9px;letter-spacing:2px;color:#4a3800;',
        'display:flex;justify-content:space-between;',
        'flex-shrink:0;',
      '}',
      '#ib-classified-stamp{',
        'position:absolute;',
        'top:50%;left:50%;',
        'transform:rotate(-18deg) translate(-50%,-50%);',
        'transform-origin:center;',
        'font-size:48px;font-weight:bold;letter-spacing:6px;',
        'color:#c04040;',
        'opacity:0.13;',
        'pointer-events:none;',
        'white-space:nowrap;',
        'animation:ib-stamp 0.6s ease forwards;',
        'z-index:0;',
      '}',
      '#ib-intel-quality-bar{',
        'display:flex;align-items:center;gap:10px;',
        'font-size:10px;color:#7a6010;letter-spacing:2px;',
        'margin-bottom:12px;',
      '}',
      '.ib-quality-dot{',
        'width:8px;height:8px;border-radius:50%;',
        'border:1px solid #4a3800;',
        'display:inline-block;',
      '}',
      '.ib-quality-dot.lit{background:#d4a017;border-color:#d4a017;}',
      '#ib-toast-container{',
        'position:fixed;top:80px;right:20px;z-index:19000;',
        'pointer-events:none;',
      '}',
      '.ib-toast{',
        'font-family:"Courier New",Courier,monospace;',
        'font-size:12px;letter-spacing:2px;',
        'color:#d4a017;',
        'background:rgba(10,8,0,0.95);',
        'border:1px solid #4a3800;',
        'padding:8px 14px;margin-bottom:6px;',
        'animation:ib-toast-in 0.3s ease forwards;',
        'max-width:320px;',
      '}',
      '.ib-toast.out{animation:ib-toast-out 0.4s ease forwards;}'
    ].join('');
    document.head.appendChild(s);
  }

  // ─── Typewriter ───────────────────────────────────────────────────────────
  function _clearTimers() {
    for (var ti = 0; ti < _typewriterTimers.length; ti++) {
      clearTimeout(_typewriterTimers[ti]);
    }
    _typewriterTimers = [];
  }

  function _typewriteEl(el, text, msPerChar, done) {
    var idx = 0;
    el.textContent = '';
    function step() {
      if (idx < text.length) {
        el.textContent += text.charAt(idx);
        idx++;
        _typewriterTimers.push(setTimeout(step, msPerChar));
      } else {
        if (done) { done(); }
      }
    }
    step();
  }

  function _typewriteLines(container, lines, msPerChar, allDone) {
    var lineIdx = 0;
    function nextLine() {
      if (lineIdx >= lines.length) {
        if (allDone) { allDone(); }
        return;
      }
      var el = document.createElement('div');
      el.className = 'ib-line';
      container.appendChild(el);
      var text = lines[lineIdx];
      lineIdx++;
      _typewriteEl(el, text, msPerChar, function() {
        _typewriterTimers.push(setTimeout(nextLine, 80));
      });
    }
    nextLine();
  }

  // ─── Toast notifications ─────────────────────────────────────────────────
  function _ensureToastContainer() {
    if (!document.getElementById('ib-toast-container')) {
      var tc = document.createElement('div');
      tc.id = 'ib-toast-container';
      document.body.appendChild(tc);
    }
  }

  function _showToast(msg) {
    _toastQueue.push(msg);
    if (!_toastActive) { _nextToast(); }
  }

  function _nextToast() {
    if (!_toastQueue.length) { _toastActive = false; return; }
    _toastActive = true;
    _ensureToastContainer();
    var tc = document.getElementById('ib-toast-container');
    var msg = _toastQueue.shift();
    var toast = document.createElement('div');
    toast.className = 'ib-toast';
    toast.textContent = msg;
    tc.appendChild(toast);
    setTimeout(function() {
      toast.classList.add('out');
      setTimeout(function() {
        if (toast.parentNode) { toast.parentNode.removeChild(toast); }
        _nextToast();
      }, 420);
    }, 2800);
  }

  // ─── Terrain map canvas ───────────────────────────────────────────────────
  function _buildTerrainMap() {
    var canvas = document.createElement('canvas');
    canvas.width  = 200;
    canvas.height = 200;
    canvas.style.cssText = [
      'display:block;margin:0 auto 12px;',
      'border:1px solid #3a2800;',
      'image-rendering:pixelated;'
    ].join('');
    _terrainCanvas = canvas;
    _drawTerrainMap();
    return canvas;
  }

  function _drawTerrainMap() {
    if (!_terrainCanvas) { return; }
    var ctx = _terrainCanvas.getContext('2d');
    var w = _terrainCanvas.width;
    var h = _terrainCanvas.height;

    ctx.fillStyle = '#0a0c0e';
    ctx.fillRect(0, 0, w, h);

    // Sample VoxelWorld if available
    var hasVoxel = window.VoxelWorld && typeof window.VoxelWorld.getBlock === 'function';

    // Draw terrain grid (simulated top-down)
    var cellSize = 10;
    var cols = Math.floor(w / cellSize);
    var rows = Math.floor(h / cellSize);

    for (var gy = 0; gy < rows; gy++) {
      for (var gx = 0; gx < cols; gx++) {
        var worldX = (gx - cols / 2) * 2;
        var worldZ = (gy - rows / 2) * 2;
        var blockVal = 0;

        if (hasVoxel) {
          blockVal = window.VoxelWorld.getBlock(
            Math.round(worldX), 1, Math.round(worldZ)
          ) || 0;
        } else {
          // Procedural fallback — simple noise via sin/cos
          var nv = Math.sin(gx * 0.4) * Math.cos(gy * 0.35) +
                   Math.sin(gx * 0.9 + gy * 0.5) * 0.5;
          blockVal = (nv > 0.3) ? 1 : 0;
        }

        if (blockVal) {
          ctx.fillStyle = '#2a2018';
          ctx.fillRect(gx * cellSize, gy * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Grid lines (faint)
    ctx.strokeStyle = 'rgba(80,60,0,0.2)';
    ctx.lineWidth = 0.5;
    for (var gx2 = 0; gx2 <= cols; gx2++) {
      ctx.beginPath();
      ctx.moveTo(gx2 * cellSize, 0);
      ctx.lineTo(gx2 * cellSize, h);
      ctx.stroke();
    }
    for (var gy2 = 0; gy2 <= rows; gy2++) {
      ctx.beginPath();
      ctx.moveTo(0, gy2 * cellSize);
      ctx.lineTo(w, gy2 * cellSize);
      ctx.stroke();
    }

    // Apply intel quality blur (POOR = blurry)
    // We draw label before optional blur
    _drawTerrainMarkers(ctx, w, h);

    // Intel quality label overlay
    var qualBlur = (_intelQuality === 0) ? '3px' : '0';
    _terrainCanvas.style.filter = 'blur(' + qualBlur + ')';
  }

  function _drawTerrainMarkers(ctx, w, h) {
    var cx = w / 2;
    var cy = h / 2;

    // Player start (green square)
    ctx.fillStyle = '#40c040';
    ctx.fillRect(cx - 5, cy - 5, 10, 10);
    ctx.fillStyle = '#0a0c0e';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P', cx, cy + 3);

    // Primary objective (amber diamond)
    var objX = cx + 40;
    var objY = cy - 30;
    ctx.save();
    ctx.translate(objX, objY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.fillStyle = '#d4a017';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OBJ', objX, objY + 14);

    // Danger zone (red circle)
    var dX = cx - 35;
    var dY = cy + 25;
    ctx.beginPath();
    ctx.arc(dX, dY, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#c04040';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(192,64,64,0.15)';
    ctx.fill();
    ctx.fillStyle = '#c04040';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', dX, dY + 3);

    // Cover position (cyan C)
    var covX = cx + 20;
    var covY = cy + 40;
    ctx.beginPath();
    ctx.arc(covX, covY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#40c0c0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#40c0c0';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('C', covX, covY + 3);

    // Extraction point (blue X) — only shown at GOOD or EXCELLENT intel
    if (_intelQuality >= 1) {
      var exX = cx - 20;
      var exY = cy - 50;
      ctx.strokeStyle = '#4080ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(exX - 6, exY - 6);
      ctx.lineTo(exX + 6, exY + 6);
      ctx.moveTo(exX + 6, exY - 6);
      ctx.lineTo(exX - 6, exY + 6);
      ctx.stroke();
      ctx.fillStyle = '#4080ff';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EX', exX, exY + 14);
    }

    // Enemy commander positions — only at EXCELLENT intel
    if (_intelQuality >= 2) {
      var cmdPositions = [
        { x: cx + 55, y: cy - 60 },
        { x: cx - 55, y: cy + 10 }
      ];
      for (var ci = 0; ci < cmdPositions.length; ci++) {
        var cp = cmdPositions[ci];
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(192,64,64,0.7)';
        ctx.fill();
        ctx.strokeStyle = '#ff4040';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#ff4040';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CMD', cp.x, cp.y + 13);
      }
    }

    // Legend
    ctx.fillStyle = '#7a6010';
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    var legend = [
      { c: '#40c040', t: '■ START' },
      { c: '#d4a017', t: '◆ OBJ' },
      { c: '#c04040', t: '● DANGER' },
      { c: '#40c0c0', t: '○ COVER' }
    ];
    if (_intelQuality >= 1) { legend.push({ c: '#4080ff', t: '× EXFIL' }); }
    if (_intelQuality >= 2) { legend.push({ c: '#ff4040', t: '● CMD' }); }
    for (var li = 0; li < legend.length; li++) {
      ctx.fillStyle = legend[li].c;
      ctx.fillText(legend[li].t, 4, 10 + li * 12);
    }
  }

  // ─── Intel quality display ────────────────────────────────────────────────
  function _buildQualityBar() {
    var bar = document.createElement('div');
    bar.id = 'ib-intel-quality-bar';

    var label = document.createElement('span');
    label.textContent = 'INTEL QUALITY:';

    var dots = document.createElement('span');
    for (var i = 0; i < 3; i++) {
      var d = document.createElement('span');
      d.className = 'ib-quality-dot' + (i <= _intelQuality ? ' lit' : '');
      dots.appendChild(d);
    }

    var qtext = document.createElement('span');
    qtext.id = 'ib-quality-text';
    qtext.style.color = '#d4a017';
    qtext.textContent = INTEL_QUALITY_LEVELS[_intelQuality];

    bar.appendChild(label);
    bar.appendChild(dots);
    bar.appendChild(qtext);
    return bar;
  }

  function _refreshQualityBar() {
    var bar = document.getElementById('ib-intel-quality-bar');
    if (!bar) { return; }
    bar.parentNode.replaceChild(_buildQualityBar(), bar);
  }

  // ─── Tab content builders ─────────────────────────────────────────────────

  // Tab 0: MISSION
  function _buildMissionTab() {
    var div = document.createElement('div');
    div.className = 'ib-tab-content';

    // Classified stamp (background layer)
    var stamp = document.createElement('div');
    stamp.id = 'ib-classified-stamp';
    stamp.textContent = 'TOP SECRET — EYES ONLY';
    div.appendChild(stamp);

    div.appendChild(_buildQualityBar());

    // Mission type row
    var mtype = MISSION_TYPES[_missionType] || MISSION_TYPES.ASSAULT;
    var typeLabel = document.createElement('div');
    typeLabel.className = 'ib-section-label';
    typeLabel.textContent = 'MISSION TYPE';
    div.appendChild(typeLabel);

    var typeVal = document.createElement('div');
    typeVal.className = 'ib-value';
    typeVal.innerHTML = mtype.icon + ' &nbsp;' + mtype.label;
    div.appendChild(typeVal);

    // Threat level
    var threatLabel = document.createElement('div');
    threatLabel.className = 'ib-section-label';
    threatLabel.textContent = 'THREAT LEVEL';
    div.appendChild(threatLabel);

    var tl = THREAT_LEVELS[_threatLevel];
    var threatVal = document.createElement('div');
    threatVal.className = 'ib-value';
    threatVal.innerHTML = 'THREAT:&nbsp;<span class="ib-threat-badge ib-threat-' + tl + '">' + tl + '</span>';
    div.appendChild(threatVal);

    div.appendChild(document.createElement('div')).className = 'ib-divider';

    // Objective
    var objLabel = document.createElement('div');
    objLabel.className = 'ib-section-label';
    objLabel.textContent = 'PRIMARY OBJECTIVE';
    div.appendChild(objLabel);

    var objContainer = document.createElement('div');
    objContainer.style.cssText = 'min-height:2em;';
    div.appendChild(objContainer);

    _typewriterTimers.push(setTimeout(function() {
      _typewriteLines(objContainer, [
        '▸ Neutralise enemy command element in the AO.',
        '▸ Secure all designated objective points.',
        '▸ Minimize collateral damage to civilian infrastructure.'
      ], 22, null);
    }, 120));

    // Rules of engagement
    var roeLabel = document.createElement('div');
    roeLabel.className = 'ib-section-label';
    roeLabel.style.marginTop = '16px';
    roeLabel.textContent = 'RULES OF ENGAGEMENT';
    div.appendChild(roeLabel);

    var roeContainer = document.createElement('div');
    div.appendChild(roeContainer);

    _typewriterTimers.push(setTimeout(function() {
      _typewriteLines(roeContainer, [
        '▸ Hostile combatants: weapons free.',
        '▸ Positive ID required before engagement.',
        '▸ No quarter for HVTs unless captured for intel.'
      ], 22, null);
    }, 900));

    return div;
  }

  // Tab 1: ENEMY ORDER OF BATTLE
  function _buildOOBTab() {
    var div = document.createElement('div');
    div.className = 'ib-tab-content';

    var hdr = document.createElement('div');
    hdr.className = 'ib-section-label';
    hdr.textContent = 'ESTIMATED ENEMY STRENGTH IN AO';
    div.appendChild(hdr);

    // Header row
    var hdrow = document.createElement('div');
    hdrow.className = 'ib-oob-row';
    hdrow.style.color = '#4a3800';
    hdrow.innerHTML = '<span>UNIT TYPE</span><span>EST. COUNT</span><span>CAPABILITIES</span>';
    div.appendChild(hdrow);

    var container = document.createElement('div');
    div.appendChild(container);

    // Stagger in rows with typewriter delay
    for (var oi = 0; oi < ORDER_OF_BATTLE.length; oi++) {
      (function(idx, entry) {
        _typewriterTimers.push(setTimeout(function() {
          var row = document.createElement('div');
          row.className = 'ib-oob-row';
          row.style.opacity = '0';
          row.style.transition = 'opacity 0.3s';

          var t = document.createElement('span');
          var c = document.createElement('span');
          var d = document.createElement('span');
          d.style.color = '#7a6010';

          // Blur unit capability text if intel POOR
          if (_intelQuality === 0) {
            d.style.filter = 'blur(3px)';
            d.style.color = '#3a2800';
          }

          container.appendChild(row);
          row.appendChild(t);
          row.appendChild(c);
          row.appendChild(d);

          _typewriteEl(t, entry.type, 18, function() {
            _typewriteEl(c, entry.est, 18, function() {
              _typewriteEl(d, entry.cap, 12, null);
            });
          });

          setTimeout(function() { row.style.opacity = '1'; }, 30);
        }, 200 + idx * 320));
      })(oi, ORDER_OF_BATTLE[oi]);
    }

    var div2 = document.createElement('div');
    div2.className = 'ib-divider';
    div2.style.marginTop = '16px';
    div.appendChild(div2);

    var noteLabel = document.createElement('div');
    noteLabel.className = 'ib-section-label';
    noteLabel.textContent = 'ANALYST NOTE';
    div.appendChild(noteLabel);

    var noteContainer = document.createElement('div');
    div.appendChild(noteContainer);
    _typewriterTimers.push(setTimeout(function() {
      var noteEl = document.createElement('div');
      noteEl.className = 'ib-line';
      noteContainer.appendChild(noteEl);
      _typewriteEl(noteEl,
        (_intelQuality === 0)
          ? '▸ Insufficient intel — confirm with SIGINT intercepts.'
          : (_intelQuality === 1)
            ? '▸ Moderate confidence. Patrol patterns partially confirmed.'
            : '▸ HIGH CONFIDENCE — 3+ SIGINT intercepts corroborate estimates.',
        14, null);
    }, 200 + ORDER_OF_BATTLE.length * 320));

    return div;
  }

  // Tab 2: TERRAIN
  function _buildTerrainTab() {
    var div = document.createElement('div');
    div.className = 'ib-tab-content';

    var hdr = document.createElement('div');
    hdr.className = 'ib-section-label';
    hdr.textContent = 'AREA OF OPERATIONS — TOP-DOWN SKETCH';
    div.appendChild(hdr);

    var qualNote = document.createElement('div');
    qualNote.style.cssText = 'font-size:10px;color:#7a6010;letter-spacing:1px;margin-bottom:10px;';
    qualNote.textContent = 'RESOLUTION: ' + INTEL_QUALITY_LEVELS[_intelQuality] +
      (_intelQuality === 0 ? ' — CONDUCT SIGINT INTERCEPTS TO IMPROVE' : '');
    div.appendChild(qualNote);

    var mapWrap = document.createElement('div');
    mapWrap.style.cssText = 'text-align:center;';
    mapWrap.appendChild(_buildTerrainMap());
    div.appendChild(mapWrap);

    var legendLabel = document.createElement('div');
    legendLabel.className = 'ib-section-label';
    legendLabel.style.marginTop = '10px';
    legendLabel.textContent = 'KEY TERRAIN FEATURES';
    div.appendChild(legendLabel);

    var featureContainer = document.createElement('div');
    div.appendChild(featureContainer);

    var features = [
      '▸ START  [green square] — Ingress point. Approx. AO center.',
      '▸ OBJ    [amber diamond] — Primary objective. Eliminate/secure.',
      '▸ DANGER [red circle] — Likely enemy heavy weapons emplacement.',
      '▸ COVER  [cyan circle] — Defilade position. Use for bounding overwatch.'
    ];
    if (_intelQuality >= 1) {
      features.push('▸ EXFIL  [blue X] — Extraction point. Secure before requesting pickup.');
    }
    if (_intelQuality >= 2) {
      features.push('▸ CMD    [red dot] — Confirmed commander positions via SIGINT.');
    }

    _typewriterTimers.push(setTimeout(function() {
      _typewriteLines(featureContainer, features, 14, null);
    }, 120));

    return div;
  }

  // Tab 3: ASSETS
  function _buildAssetsTab() {
    var div = document.createElement('div');
    div.className = 'ib-tab-content';

    var hdr = document.createElement('div');
    hdr.className = 'ib-section-label';
    hdr.textContent = 'FRIENDLY SUPPORT AVAILABLE';
    div.appendChild(hdr);

    // Header row
    var hdrow = document.createElement('div');
    hdrow.className = 'ib-asset-row';
    hdrow.style.color = '#4a3800';
    hdrow.innerHTML = '<span>ASSET</span><span>DETAIL</span>';
    div.appendChild(hdrow);

    var container = document.createElement('div');
    div.appendChild(container);

    for (var ai = 0; ai < ASSET_LIST.length; ai++) {
      (function(idx, asset) {
        _typewriterTimers.push(setTimeout(function() {
          var row = document.createElement('div');
          row.className = 'ib-asset-row';
          row.style.opacity = '0';
          row.style.transition = 'opacity 0.3s';

          var lbl = document.createElement('span');
          var det = document.createElement('span');
          det.style.color = '#7a6010';

          container.appendChild(row);
          row.appendChild(lbl);
          row.appendChild(det);

          _typewriteEl(lbl, asset.label, 18, function() {
            _typewriteEl(det, asset.detail, 10, null);
          });

          setTimeout(function() { row.style.opacity = '1'; }, 30);
        }, 150 + idx * 280));
      })(ai, ASSET_LIST[ai]);
    }

    var div2 = document.createElement('div');
    div2.className = 'ib-divider';
    div2.style.marginTop = '16px';
    div.appendChild(div2);

    var callLabel = document.createElement('div');
    callLabel.className = 'ib-section-label';
    callLabel.textContent = 'FIRE SUPPORT PROCEDURES';
    div.appendChild(callLabel);

    var callContainer = document.createElement('div');
    div.appendChild(callContainer);

    _typewriterTimers.push(setTimeout(function() {
      _typewriteLines(callContainer, [
        '▸ AIR: Authenticate "KILO-FOXTROT", relay 9-line to JTAC.',
        '▸ ARTY: Grid + target description. Danger-close: call in cold.',
        '▸ MEDEVAC: 9-line CASEVAC. LZ smoked — blue for friendly.'
      ], 14, null);
    }, 150 + ASSET_LIST.length * 280));

    return div;
  }

  // Tab 4: DOSSIER
  function _buildDossierTab() {
    var div = document.createElement('div');
    div.className = 'ib-tab-content';

    var hdr = document.createElement('div');
    hdr.className = 'ib-section-label';
    hdr.textContent = 'ENEMY COMMANDER PROFILES — UNLOCK BY ELIMINATING';
    div.appendChild(hdr);

    for (var di = 0; di < COMMANDERS.length; di++) {
      (function(cmd) {
        var card = _buildDossierCard(cmd);
        div.appendChild(card);
      })(COMMANDERS[di]);
    }

    return div;
  }

  function _buildDossierCard(cmd) {
    if (!cmd.unlocked) {
      var locked = document.createElement('div');
      locked.className = 'ib-dossier-locked';
      locked.id = 'ib-dossier-locked-' + cmd.id;
      locked.textContent = '[ DOSSIER ' + cmd.id.toUpperCase() + ' — CLASSIFIED — ELIMINATE COMMANDER TO UNLOCK ]';
      return locked;
    }

    var card = document.createElement('div');
    card.className = 'ib-dossier-card';
    card.id = 'ib-dossier-card-' + cmd.id;

    // Photo placeholder
    var photo = document.createElement('div');
    photo.className = 'ib-photo';
    var icon = document.createElement('div');
    icon.className = 'ib-photo-inner' + (_intelQuality === 0 ? ' blurred' : '');
    // Representative icon per trait
    var traitIcons = {
      AGGRESSIVE: '👺', DEFENSIVE: '🛡', METHODICAL: '🦉',
      CHARISMATIC: '🦅', COWARD: '🐭'
    };
    icon.textContent = traitIcons[cmd.trait] || '?';
    photo.appendChild(icon);
    card.appendChild(photo);

    // Info
    var info = document.createElement('div');

    var name = document.createElement('div');
    name.className = 'ib-dossier-name';
    name.textContent = cmd.name;

    var rank = document.createElement('div');
    rank.className = 'ib-dossier-rank';
    rank.textContent = cmd.rank + ' — ' + cmd.unit;

    var trait = document.createElement('div');
    trait.className = 'ib-trait-badge';
    trait.textContent = 'TRAIT: ' + cmd.trait;

    var codename = document.createElement('div');
    codename.className = 'ib-dossier-text';
    codename.textContent = 'CODENAME: ' + cmd.codename;

    var traitDesc = document.createElement('div');
    traitDesc.className = 'ib-dossier-text';
    traitDesc.style.marginTop = '4px';
    traitDesc.textContent = cmd.traitDesc;

    var weakness = document.createElement('div');
    weakness.className = 'ib-dossier-text';
    weakness.style.marginTop = '4px';
    weakness.style.color = '#c08040';
    weakness.textContent = 'WEAKNESS: ' + cmd.weakness;

    var threat = document.createElement('div');
    threat.className = 'ib-dossier-text';
    threat.style.marginTop = '4px';
    threat.innerHTML = 'THREAT: <span class="ib-threat-badge ib-threat-' +
      cmd.threat + '">' + cmd.threat + '</span>';

    info.appendChild(name);
    info.appendChild(rank);
    info.appendChild(trait);
    info.appendChild(codename);
    info.appendChild(traitDesc);
    info.appendChild(weakness);
    info.appendChild(threat);
    card.appendChild(info);

    return card;
  }

  // ─── Panel building ───────────────────────────────────────────────────────
  function _buildPanel() {
    if (_panel) { return; }

    _panel = document.createElement('div');
    _panel.id = 'ib-overlay';

    var inner = document.createElement('div');
    inner.id = 'ib-inner';

    // Header
    var header = document.createElement('div');
    header.id = 'ib-header';

    var title = document.createElement('div');
    title.id = 'ib-title';
    title.textContent = '[ INTELLIGENCE BRIEFING ]';

    var meta = document.createElement('div');
    meta.id = 'ib-meta';
    meta.innerHTML = 'OP: CLASSIFIED<br>DTG: ' + _dtgString();

    header.appendChild(title);
    header.appendChild(meta);
    inner.appendChild(header);

    // Tabs bar
    var tabsBar = document.createElement('div');
    tabsBar.id = 'ib-tabs';

    var tabNames = ['MISSION', 'ORDER OF BATTLE', 'TERRAIN', 'ASSETS', 'DOSSIER'];
    _tabButtons = [];
    for (var ti = 0; ti < tabNames.length; ti++) {
      (function(idx, name) {
        var btn = document.createElement('div');
        btn.className = 'ib-tab' + (idx === 0 ? ' active' : '');
        btn.textContent = '[' + (idx + 1) + '] ' + name;
        btn.addEventListener('click', function() { _switchTab(idx); });
        tabsBar.appendChild(btn);
        _tabButtons.push(btn);
      })(ti, tabNames[ti]);
    }
    inner.appendChild(tabsBar);

    // Body with tab contents
    var body = document.createElement('div');
    body.id = 'ib-body';

    var builders = [
      _buildMissionTab,
      _buildOOBTab,
      _buildTerrainTab,
      _buildAssetsTab,
      _buildDossierTab
    ];

    _tabContents = [];
    for (var bi = 0; bi < builders.length; bi++) {
      var content = builders[bi]();
      content.className += (bi === 0 ? ' active' : '');
      body.appendChild(content);
      _tabContents.push(content);
    }

    inner.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.id = 'ib-footer';
    footer.innerHTML = [
      '<span>[ TAB / F1 ] OPEN &nbsp;|&nbsp; [ 1-5 ] SWITCH TAB &nbsp;|&nbsp;',
      '[ ESC ] CLOSE &nbsp;|&nbsp; [ SHIFT+TAB ] COPY BRIEF</span>',
      '<span>TOP SECRET — EYES ONLY</span>'
    ].join('');
    inner.appendChild(footer);

    _panel.appendChild(inner);
    document.body.appendChild(_panel);
  }

  // ─── Tab switching ────────────────────────────────────────────────────────
  function _switchTab(idx) {
    if (idx < 0 || idx >= _tabContents.length) { return; }
    _activeTab = idx;
    for (var i = 0; i < _tabContents.length; i++) {
      _tabContents[i].className = _tabContents[i].className.replace(' active', '');
      _tabButtons[i].className = _tabButtons[i].className.replace(' active', '');
    }
    _tabContents[idx].className += ' active';
    _tabButtons[idx].className += ' active';
  }

  // ─── Rebuild panel sections ───────────────────────────────────────────────
  function _rebuildTabContent(idx) {
    if (!_panel) { return; }
    var body = document.getElementById('ib-body');
    if (!body) { return; }

    var builders = [
      _buildMissionTab,
      _buildOOBTab,
      _buildTerrainTab,
      _buildAssetsTab,
      _buildDossierTab
    ];

    var old = _tabContents[idx];
    var wasActive = old.className.indexOf('active') !== -1;
    var newContent = builders[idx]();
    if (wasActive) { newContent.className += ' active'; }
    body.replaceChild(newContent, old);
    _tabContents[idx] = newContent;
  }

  // ─── Print / clipboard ────────────────────────────────────────────────────
  function _copyBriefToClipboard() {
    var mtype = MISSION_TYPES[_missionType] || MISSION_TYPES.ASSAULT;
    var tl = THREAT_LEVELS[_threatLevel];
    var lines = [
      '====================================',
      '  INTELLIGENCE BRIEFING — ' + _dtgString(),
      '  CLASSIFICATION: TOP SECRET',
      '====================================',
      '',
      'MISSION TYPE : ' + mtype.label,
      'THREAT LEVEL : ' + tl,
      'INTEL QUALITY: ' + INTEL_QUALITY_LEVELS[_intelQuality],
      '',
      'PRIMARY OBJECTIVE:',
      '  - Neutralise enemy command element in the AO.',
      '  - Secure all designated objective points.',
      '',
      'ORDER OF BATTLE:',
    ];

    for (var oi = 0; oi < ORDER_OF_BATTLE.length; oi++) {
      var entry = ORDER_OF_BATTLE[oi];
      lines.push('  ' + entry.type + ' (est. ' + entry.est + ') — ' + entry.cap);
    }

    lines.push('');
    lines.push('ASSETS:');
    for (var ai = 0; ai < ASSET_LIST.length; ai++) {
      lines.push('  ' + ASSET_LIST[ai].label + ': ' + ASSET_LIST[ai].detail);
    }

    lines.push('');
    lines.push('DOSSIERS:');
    for (var di = 0; di < COMMANDERS.length; di++) {
      var cmd = COMMANDERS[di];
      if (cmd.unlocked) {
        lines.push('  [UNLOCKED] ' + cmd.name + ' (' + cmd.rank + ')');
        lines.push('    TRAIT: ' + cmd.trait + ' — ' + cmd.traitDesc);
        lines.push('    WEAKNESS: ' + cmd.weakness);
      } else {
        lines.push('  [CLASSIFIED] ' + cmd.id.toUpperCase());
      }
    }

    lines.push('');
    lines.push('====================================');
    lines.push('  TOP SECRET — EYES ONLY');
    lines.push('====================================');

    var text = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        _showToast('BRIEF COPIED TO CLIPBOARD');
      }, function() {
        _showToast('CLIPBOARD ACCESS DENIED');
      });
    } else {
      // Fallback: textarea copy
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        _showToast('BRIEF COPIED TO CLIPBOARD');
      } catch (err) {
        _showToast('CLIPBOARD ACCESS DENIED');
      }
      document.body.removeChild(ta);
    }
  }

  // ─── DTG string ───────────────────────────────────────────────────────────
  function _dtgString() {
    var d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var hhmm = String(d.getHours()).padStart(2, '0') +
               String(d.getMinutes()).padStart(2, '0');
    var months = ['JAN','FEB','MAR','APR','MAY','JUN',
                  'JUL','AUG','SEP','OCT','NOV','DEC'];
    return dd + hhmm + 'Z' + months[d.getMonth()] + d.getFullYear();
  }

  // ─── Open / close panel ───────────────────────────────────────────────────
  function _openPanel() {
    if (_open) { return; }
    _open = true;
    _clearTimers();

    if (_panel) {
      // Rebuild all tabs to reflect current state
      for (var ri = 0; ri < _tabContents.length; ri++) {
        _rebuildTabContent(ri);
      }
      // Restore active tab
      _switchTab(_activeTab);
    } else {
      _buildPanel();
    }

    _panel.style.display = 'block';

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  function _closePanel() {
    if (!_open) { return; }
    _open = false;
    _clearTimers();
    if (_panel) {
      _panel.style.display = 'none';
    }
  }

  // ─── Keyboard handling ────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    // Tab (no shift) or F1 — toggle panel
    if ((e.code === 'Tab' && !e.shiftKey) || e.code === 'F1') {
      e.preventDefault();
      if (_open) { _closePanel(); } else { _openPanel(); }
      return;
    }

    // Shift+Tab — copy brief to clipboard
    if (e.code === 'Tab' && e.shiftKey) {
      e.preventDefault();
      _copyBriefToClipboard();
      return;
    }

    if (_open) {
      // Number keys 1-5 for tabs
      if (e.code === 'Digit1') { _switchTab(0); e.preventDefault(); return; }
      if (e.code === 'Digit2') { _switchTab(1); e.preventDefault(); return; }
      if (e.code === 'Digit3') { _switchTab(2); e.preventDefault(); return; }
      if (e.code === 'Digit4') { _switchTab(3); e.preventDefault(); return; }
      if (e.code === 'Digit5') { _switchTab(4); e.preventDefault(); return; }

      // Escape closes
      if (e.code === 'Escape') {
        _closePanel();
        e.preventDefault();
        return;
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

    _injectStyles();
    _ensureToastContainer();
    _buildPanel();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
  }

  // ─── Public: update ───────────────────────────────────────────────────────
  function update(delta) {
    // No per-frame Three.js work needed for briefing panel;
    // kept for API parity and future extension.
    void delta;
  }

  // ─── Public: unlockDossier ────────────────────────────────────────────────
  function unlockDossier(enemyId) {
    for (var di = 0; di < COMMANDERS.length; di++) {
      var cmd = COMMANDERS[di];
      if (cmd.id === enemyId && !cmd.unlocked) {
        cmd.unlocked = true;
        _showToast('DOSSIER UNLOCKED: ' + cmd.name);

        // If dossier tab currently rendered, patch it in-place
        if (_panel) {
          var locked = document.getElementById('ib-dossier-locked-' + cmd.id);
          if (locked && locked.parentNode) {
            locked.parentNode.replaceChild(_buildDossierCard(cmd), locked);
          }
        }
        return;
      }
    }
  }

  // ─── Public: setMissionType ───────────────────────────────────────────────
  function setMissionType(type, threatLevelIdx) {
    if (MISSION_TYPES[type]) { _missionType = type; }
    if (typeof threatLevelIdx === 'number' &&
        threatLevelIdx >= 0 && threatLevelIdx < THREAT_LEVELS.length) {
      _threatLevel = threatLevelIdx;
    }
    // Rebuild mission tab if panel exists
    if (_panel) { _rebuildTabContent(0); }
  }

  // ─── Public: getIntelQuality ──────────────────────────────────────────────
  function getIntelQuality() {
    return INTEL_QUALITY_LEVELS[_intelQuality];
  }

  // ─── Public: recordIntercept ─────────────────────────────────────────────
  // Called by SignalIntelligence when an intercept succeeds.
  function recordIntercept() {
    _interceptCount++;
    if (_interceptCount >= 3 && _intelQuality < 2) {
      _intelQuality = 2;
      _showToast('INTEL QUALITY: EXCELLENT');
      _refreshQualityBar();
      _drawTerrainMap();
    } else if (_interceptCount >= 1 && _intelQuality < 1) {
      _intelQuality = 1;
      _showToast('INTEL QUALITY: GOOD');
      _refreshQualityBar();
      _drawTerrainMap();
    }
  }

  // ─── Public: reset ────────────────────────────────────────────────────────
  function reset() {
    _closePanel();
    _clearTimers();
    _intelQuality   = 0;
    _interceptCount = 0;
    _missionType    = 'ASSAULT';
    _threatLevel    = 1;
    _activeTab      = 0;
    _toastQueue     = [];
    _toastActive    = false;

    for (var di = 0; di < COMMANDERS.length; di++) {
      COMMANDERS[di].unlocked = false;
    }

    // Destroy panel so it rebuilds fresh on next open
    if (_panel && _panel.parentNode) {
      _panel.parentNode.removeChild(_panel);
    }
    _panel       = null;
    _tabContents = [];
    _tabButtons  = [];
    _terrainCanvas = null;
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init:             init,
    update:           update,
    unlockDossier:    unlockDossier,
    setMissionType:   setMissionType,
    getIntelQuality:  getIntelQuality,
    recordIntercept:  recordIntercept,
    reset:            reset
  };

})();
