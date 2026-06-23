/* ───────────────────────────────────────────────────────────────────────────
   command-bunker.js — Player Command Bunker (deploy with C+B keys)
   Features:
     - C+B keys: deploy command bunker at player position
     - Bunker mesh: main structure, sandbag walls, antenna mast, camo netting
     - Interior tactical UI overlay when player within 3 units
     - 4 panels: UNITS, OBJECTIVES, INTEL, RESOURCES
     - Unit orders: ATTACK, DEFEND, PATROL, WITHDRAW
     - Order propagation to unit.pendingOrder + window._unitOrders[unitId]
     - 200x200 minimap canvas
     - Artillery fire mission integration with FireSupport
     - Command radius 80 units: +10% effectiveness (window._inCommandRadius)
     - Bunker HP 300: enemies attack if discovered, smoke on damage, collapses at 0
     - Radio intel reports every 30s in INTEL panel
     - HUD: "CMD POST [ACTIVE] [UNITS: N] [RANGE: 80m]" shown when outside bunker

   API: window.CommandBunker = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.CommandBunker = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var BUNKER_HP_MAX        = 300;
  var COMMAND_RADIUS       = 80;
  var INTERIOR_RADIUS      = 3;
  var EFFECTIVENESS_BONUS  = 0.10;
  var RADIO_INTERVAL       = 30;    /* seconds between intel reports */
  var SMOKE_THRESHOLD_1    = 0.66;  /* first smoke at 2/3 HP */
  var SMOKE_THRESHOLD_2    = 0.33;  /* second smoke at 1/3 HP */

  /* bunker structure dimensions */
  var STRUCT_W = 8;
  var STRUCT_H = 3;
  var STRUCT_D = 6;
  var STRUCT_COLOR    = 0x5C5C3D;
  var SANDBAG_COLOR   = 0x8B7355;
  var ANTENNA_COLOR   = 0x888888;
  var RADOME_COLOR    = 0xCCCCCC;
  var NETTING_COLOR   = 0x4A5240;
  var NETTING_OPACITY = 0.5;

  /* orders available */
  var ORDERS = ['ATTACK', 'DEFEND', 'PATROL', 'WITHDRAW'];

  /* intel report pool */
  var INTEL_REPORTS = [
    'SIGINT: Enemy patrol route confirmed — grid 447-221 to 512-198.',
    'HUMINT: Enemy supply convoy moving south on Route DELTA. 3 trucks.',
    'IMINT: Enemy armor concentration 1.2km NW. 4 T-72s, 2 BTRs.',
    'SIGINT: Enemy HQ radio traffic increasing. Possible attack imminent.',
    'HUMINT: Enemy reinforcements staging at grid 380-440. ETA 15 min.',
    'OSINT: Enemy air defense radar active sector 7. Avoid air assets.',
    'HUMINT: Enemy commander relocating to secondary CP. Grid 502-311.',
    'SIGINT: Enemy QRF scrambled — our position may be compromised.',
    'IMINT: Enemy mortar team dug in at treeline, grid 455-390.',
    'HUMINT: Civilians confirm enemy cache at abandoned farmhouse grid 421-267.'
  ];

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _scene          = null;
  var _camera         = null;
  var _player         = null;   /* {position: THREE.Vector3} */
  var _renderer       = null;

  var _deployed       = false;
  var _bunkerGroup    = null;   /* THREE.Group */
  var _bunkerPos      = null;   /* THREE.Vector3 */
  var _bunkerHP       = BUNKER_HP_MAX;
  var _discovered     = false;  /* enemies know about bunker */

  /* key tracking */
  var _cKeyDown = false;
  var _bKeyDown = false;

  /* interior / UI state */
  var _playerInside   = false;
  var _uiOpen         = false;
  var _activePanel    = 'UNITS';
  var _selectedUnit   = null;
  var _orderMenuOpen  = false;

  /* timers */
  var _radioTimer     = 0;
  var _smokeTimer     = 0;
  var _collapseAnim   = false;

  /* HP threshold flags */
  var _smoke1Played   = false;
  var _smoke2Played   = false;

  /* smoke particles */
  var _smokeParticles = [];

  /* intel log */
  var _intelLog = [];

  /* minimap canvas */
  var _minimapCanvas  = null;
  var _minimapCtx     = null;

  /* DOM elements */
  var _uiOverlay       = null;
  var _hudEl           = null;
  var _unitListEl      = null;
  var _objectiveListEl = null;
  var _intelListEl     = null;
  var _resourceListEl  = null;
  var _orderMenuEl     = null;

  /* ── Utility ────────────────────────────────────────────────────────────── */
  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _randItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ── Bunker mesh construction ───────────────────────────────────────────── */
  function _buildBunkerMesh(pos) {
    var group = new THREE.Group();
    group.position.copy(pos);

    /* main structure */
    var mainGeo  = new THREE.BoxGeometry(STRUCT_W, STRUCT_H, STRUCT_D);
    var mainMat  = new THREE.MeshLambertMaterial({ color: STRUCT_COLOR });
    var mainMesh = new THREE.Mesh(mainGeo, mainMat);
    mainMesh.position.set(0, STRUCT_H / 2, 0);
    mainMesh.castShadow    = true;
    mainMesh.receiveShadow = true;
    group.add(mainMesh);

    /* sandbag walls — 6 cylinder stacks around perimeter */
    var sbGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.6, 8);
    var sbMat = new THREE.MeshLambertMaterial({ color: SANDBAG_COLOR });

    var sbPositions = [
      /* front row */
      { x: -2.5, z:  3.5 },
      { x:  0,   z:  3.5 },
      { x:  2.5, z:  3.5 },
      /* back row */
      { x: -2.5, z: -3.5 },
      { x:  0,   z: -3.5 },
      { x:  2.5, z: -3.5 }
    ];

    var si;
    for (si = 0; si < sbPositions.length; si++) {
      var sbp   = sbPositions[si];
      var layer;
      for (layer = 0; layer < 3; layer++) {
        var sbMesh = new THREE.Mesh(sbGeo, sbMat);
        sbMesh.position.set(sbp.x, 0.3 + layer * 0.6, sbp.z);
        group.add(sbMesh);
      }
    }

    /* side sandbag stacks */
    var sideSbPositions = [
      { x: -4.5, z: -1.5 },
      { x: -4.5, z:  1.5 },
      { x:  4.5, z: -1.5 },
      { x:  4.5, z:  1.5 }
    ];

    var si2;
    for (si2 = 0; si2 < sideSbPositions.length; si2++) {
      var spos = sideSbPositions[si2];
      var sl;
      for (sl = 0; sl < 3; sl++) {
        var ssMesh = new THREE.Mesh(sbGeo, sbMat);
        ssMesh.position.set(spos.x, 0.3 + sl * 0.6, spos.z);
        group.add(ssMesh);
      }
    }

    /* antenna mast — CylinderGeometry, 6 units tall */
    var mastGeo  = new THREE.CylinderGeometry(0.05, 0.05, 6, 8);
    var mastMat  = new THREE.MeshLambertMaterial({ color: ANTENNA_COLOR });
    var mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(3, STRUCT_H + 3, -2);
    group.add(mastMesh);

    /* radome sphere atop antenna */
    var radomeGeo  = new THREE.SphereGeometry(0.3, 8, 8);
    var radomeMat  = new THREE.MeshLambertMaterial({ color: RADOME_COLOR });
    var radomeMesh = new THREE.Mesh(radomeGeo, radomeMat);
    radomeMesh.position.set(3, STRUCT_H + 6.3, -2);
    group.add(radomeMesh);

    /* camo netting — flat semi-transparent BoxGeometry overhead */
    var netGeo  = new THREE.BoxGeometry(STRUCT_W + 2, 0.08, STRUCT_D + 2);
    var netMat  = new THREE.MeshLambertMaterial({
      color:       NETTING_COLOR,
      transparent: true,
      opacity:     NETTING_OPACITY
    });
    var netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, STRUCT_H + 0.1, 0);
    group.add(netMesh);

    return group;
  }

  /* ── Smoke particle helpers ─────────────────────────────────────────────── */
  function _spawnSmoke(pos) {
    if (!_scene) return;
    var smokeGeo = new THREE.SphereGeometry(0.5, 6, 6);
    var smokeMat = new THREE.MeshBasicMaterial({
      color:       0x555555,
      transparent: true,
      opacity:     0.6
    });
    var count = 8;
    var pi;
    for (pi = 0; pi < count; pi++) {
      var sm = new THREE.Mesh(smokeGeo, smokeMat.clone());
      sm.position.set(
        pos.x + (Math.random() - 0.5) * 4,
        pos.y + Math.random() * 2,
        pos.z + (Math.random() - 0.5) * 4
      );
      _scene.add(sm);
      _smokeParticles.push({
        mesh:    sm,
        vy:      1.5 + Math.random(),
        life:    0,
        maxLife: 2 + Math.random() * 2
      });
    }
  }

  function _updateSmoke(dt) {
    var alive = [];
    var pi;
    for (pi = 0; pi < _smokeParticles.length; pi++) {
      var sp = _smokeParticles[pi];
      sp.life += dt;
      sp.mesh.position.y += sp.vy * dt;
      sp.mesh.material.opacity = 0.6 * (1 - sp.life / sp.maxLife);
      if (sp.life < sp.maxLife) {
        alive.push(sp);
      } else {
        if (_scene) _scene.remove(sp.mesh);
      }
    }
    _smokeParticles = alive;
  }

  /* ── Collapse animation ─────────────────────────────────────────────────── */
  function _startCollapse() {
    _collapseAnim = true;
    _spawnSmoke(_bunkerPos);
    _addIntel('[SYSTEM] COMMAND POST DESTROYED — STRUCTURE COLLAPSED');
    if (_uiOpen) { _closeUI(); }
    _updateHUD();
  }

  function _updateCollapse(dt) {
    if (!_bunkerGroup) { return; }
    _bunkerGroup.position.y -= 2 * dt;
    _bunkerGroup.rotation.z += 0.5 * dt;
    if (_bunkerGroup.position.y < -10) {
      if (_scene) { _scene.remove(_bunkerGroup); }
      _bunkerGroup  = null;
      _collapseAnim = false;
      _deployed     = false;
    }
  }

  /* ── Deploy bunker ──────────────────────────────────────────────────────── */
  function _deploy() {
    if (_deployed || !_scene) { return; }
    var spawnPos;
    if (_player && _player.position) {
      spawnPos = _player.position.clone();
    } else {
      spawnPos = new THREE.Vector3(0, 0, 0);
    }

    _bunkerGroup  = _buildBunkerMesh(spawnPos);
    _bunkerPos    = spawnPos.clone();
    _scene.add(_bunkerGroup);
    _deployed     = true;
    _bunkerHP     = BUNKER_HP_MAX;
    _discovered   = false;
    _smoke1Played = false;
    _smoke2Played = false;

    window._unitOrders = window._unitOrders || {};

    _addIntel('[SYSTEM] Command Post deployed at grid ' +
      Math.round(spawnPos.x) + '-' + Math.round(spawnPos.z));

    _updateHUD();
  }

  /* ── Command radius check ───────────────────────────────────────────────── */
  function _updateCommandRadius() {
    if (!_deployed || !_bunkerPos) {
      window._inCommandRadius = false;
      return;
    }
    var playerPos = (_player && _player.position) ? _player.position : new THREE.Vector3();
    var d = _dist2D(playerPos, _bunkerPos);
    window._inCommandRadius = (d <= COMMAND_RADIUS);

    /* apply effectiveness bonus to units in radius */
    var units = _getFriendlyUnits();
    var ui;
    for (ui = 0; ui < units.length; ui++) {
      var u = units[ui];
      if (u.position) {
        var du = _dist2D(u.position, _bunkerPos);
        u._inCommandRadius    = (du <= COMMAND_RADIUS);
        u._effectivenessBonus = u._inCommandRadius ? EFFECTIVENESS_BONUS : 0;
      }
    }
  }

  /* ── Get data from other modules ────────────────────────────────────────── */
  function _getFriendlyUnits() {
    if (window.ChainOfCommand && window.ChainOfCommand.getUnits) {
      return window.ChainOfCommand.getUnits() || [];
    }
    if (window._friendlyUnits) { return window._friendlyUnits; }
    return [];
  }

  function _getObjectives() {
    if (window.ObjectiveCapture && window.ObjectiveCapture.getPoints) {
      return window.ObjectiveCapture.getPoints() || [];
    }
    if (window._objectives) { return window._objectives; }
    return [];
  }

  function _getResources() {
    if (window.LogisticsSystem && window.LogisticsSystem.getResources) {
      return window.LogisticsSystem.getResources() || {};
    }
    if (window._resources) { return window._resources; }
    return { ammo: '?', fuel: '?', food: '?', water: '?', medical: '?' };
  }

  /* ── Intel panel ────────────────────────────────────────────────────────── */
  function _addIntel(msg) {
    var ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    _intelLog.unshift('[' + ts + '] ' + msg);
    if (_intelLog.length > 20) { _intelLog.length = 20; }
    if (_intelListEl) { _renderIntelPanel(); }
  }

  function _radioIntel() {
    _addIntel(_randItem(INTEL_REPORTS));
  }

  /* ── Damage handling ────────────────────────────────────────────────────── */
  function _damageBunker(amount) {
    if (!_deployed || _bunkerHP <= 0) { return; }
    _bunkerHP -= amount;
    if (_bunkerHP < 0) { _bunkerHP = 0; }

    var frac = _bunkerHP / BUNKER_HP_MAX;

    if (!_smoke1Played && frac < SMOKE_THRESHOLD_1) {
      _smoke1Played = true;
      _spawnSmoke(_bunkerPos);
      _addIntel('[ALERT] Command Post taking fire — structure damaged!');
    }
    if (!_smoke2Played && frac < SMOKE_THRESHOLD_2) {
      _smoke2Played = true;
      _spawnSmoke(_bunkerPos);
      _addIntel('[ALERT] Command Post critically damaged! Hull integrity failing!');
    }
    if (_bunkerHP <= 0) {
      _startCollapse();
    }
  }

  /* ── Enemy discover / attack ────────────────────────────────────────────── */
  function _checkEnemyAttack(dt) {
    if (!_deployed || _bunkerHP <= 0) { return; }
    if (!_discovered) { return; }

    /* enemies that see the bunker will attack it */
    var enemies = window._enemies || [];
    var ei;
    for (ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      if (!e || !e.position) { continue; }
      var d = _dist3(e.position, _bunkerPos);
      if (d < 30 && e.alive !== false) {
        /* each nearby enemy deals 2 damage/s */
        _damageBunker(2 * dt);
      }
    }
  }

  /* ── Unit orders ────────────────────────────────────────────────────────── */
  function _issueOrder(unit, order) {
    if (!unit) { return; }
    var unitId = unit.id || unit.name || String(Math.random());
    unit.pendingOrder = order;
    window._unitOrders = window._unitOrders || {};
    window._unitOrders[unitId] = order;
    _addIntel('[ORDER] ' + (unit.name || unitId) + ' -> ' + order);
    _orderMenuOpen = false;
    _selectedUnit  = null;
    _renderUnitsPanel();
  }

  /* ── Artillery fire mission ─────────────────────────────────────────────── */
  function _requestFireMission() {
    if (window.FireSupport && window.FireSupport.requestArty) {
      window.FireSupport.requestArty(_bunkerPos);
      _addIntel('[FIRES] Artillery fire mission requested from CP.');
    } else {
      _addIntel('[FIRES] FireSupport module not available.');
    }
  }

  /* ── UI Construction ────────────────────────────────────────────────────── */
  function _createUI() {
    /* overlay container */
    _uiOverlay = document.createElement('div');
    _uiOverlay.id = 'cmd-bunker-ui';
    _uiOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,0.82)',
      'display:none',
      'z-index:9000',
      'font-family:monospace',
      'color:#00FF66',
      'pointer-events:auto',
      'box-sizing:border-box',
      'padding:10px'
    ].join(';');

    /* title bar */
    var titleBar = document.createElement('div');
    titleBar.style.cssText = 'text-align:center;font-size:18px;font-weight:bold;' +
      'border-bottom:1px solid #00FF66;padding-bottom:6px;margin-bottom:8px;' +
      'letter-spacing:3px;';
    titleBar.textContent = '[ COMMAND POST - TACTICAL OPERATIONS CENTER ]';
    _uiOverlay.appendChild(titleBar);

    /* close button */
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '[X] CLOSE';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:transparent;' +
      'border:1px solid #00FF66;color:#00FF66;font-family:monospace;cursor:pointer;' +
      'font-size:13px;padding:4px 8px;';
    closeBtn.onclick = _closeUI;
    _uiOverlay.appendChild(closeBtn);

    /* tab bar */
    var tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:4px;margin-bottom:8px;';
    var tabs = ['UNITS', 'OBJECTIVES', 'INTEL', 'RESOURCES'];
    var ti;
    for (ti = 0; ti < tabs.length; ti++) {
      /* IIFE to capture tab variable */
      (function (tab) {
        var btn = document.createElement('button');
        btn.id = 'cmd-tab-' + tab;
        btn.textContent = tab;
        btn.style.cssText = 'flex:1;background:transparent;border:1px solid #00FF66;' +
          'color:#00FF66;font-family:monospace;cursor:pointer;padding:5px;font-size:13px;';
        btn.onclick = function () { _switchPanel(tab); };
        tabBar.appendChild(btn);
      }(tabs[ti]));
    }
    _uiOverlay.appendChild(tabBar);

    /* main content area: left panels + right minimap/actions */
    var contentArea = document.createElement('div');
    contentArea.style.cssText = 'display:flex;gap:8px;height:calc(100% - 130px);';

    /* panel container */
    var panelWrap = document.createElement('div');
    panelWrap.style.cssText = 'flex:1;overflow-y:auto;border:1px solid #00FF66;padding:8px;';

    /* UNITS panel */
    _unitListEl = document.createElement('div');
    _unitListEl.id = 'cmd-panel-UNITS';
    _unitListEl.style.display = 'block';
    panelWrap.appendChild(_unitListEl);

    /* OBJECTIVES panel */
    _objectiveListEl = document.createElement('div');
    _objectiveListEl.id = 'cmd-panel-OBJECTIVES';
    _objectiveListEl.style.display = 'none';
    panelWrap.appendChild(_objectiveListEl);

    /* INTEL panel */
    _intelListEl = document.createElement('div');
    _intelListEl.id = 'cmd-panel-INTEL';
    _intelListEl.style.display = 'none';
    panelWrap.appendChild(_intelListEl);

    /* RESOURCES panel */
    _resourceListEl = document.createElement('div');
    _resourceListEl.id = 'cmd-panel-RESOURCES';
    _resourceListEl.style.display = 'none';
    panelWrap.appendChild(_resourceListEl);

    contentArea.appendChild(panelWrap);

    /* right column: minimap + action buttons */
    var rightCol = document.createElement('div');
    rightCol.style.cssText = 'width:230px;display:flex;flex-direction:column;gap:8px;';

    /* minimap canvas */
    _minimapCanvas        = document.createElement('canvas');
    _minimapCanvas.width  = 200;
    _minimapCanvas.height = 200;
    _minimapCanvas.style.cssText = 'border:1px solid #00FF66;display:block;';
    _minimapCtx = _minimapCanvas.getContext('2d');
    rightCol.appendChild(_minimapCanvas);

    /* actions area */
    var actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

    var fireMissionBtn = document.createElement('button');
    fireMissionBtn.textContent = '[FIRES] REQUEST ARTY';
    fireMissionBtn.style.cssText = 'background:transparent;border:1px solid #FF6600;' +
      'color:#FF6600;font-family:monospace;cursor:pointer;padding:6px;font-size:12px;';
    fireMissionBtn.onclick = _requestFireMission;
    actionsDiv.appendChild(fireMissionBtn);

    var statusDiv = document.createElement('div');
    statusDiv.id = 'cmd-bunker-status';
    statusDiv.style.cssText = 'font-size:11px;border:1px solid #00FF66;padding:6px;';
    actionsDiv.appendChild(statusDiv);

    rightCol.appendChild(actionsDiv);
    contentArea.appendChild(rightCol);
    _uiOverlay.appendChild(contentArea);

    /* order sub-menu (hidden, positioned absolutely) */
    _orderMenuEl = document.createElement('div');
    _orderMenuEl.id = 'cmd-order-menu';
    _orderMenuEl.style.cssText = 'position:absolute;background:#111;border:1px solid #00FF66;' +
      'padding:8px;display:none;z-index:9100;';
    _uiOverlay.appendChild(_orderMenuEl);

    document.body.appendChild(_uiOverlay);
  }

  function _switchPanel(name) {
    _activePanel = name;
    var panels = ['UNITS', 'OBJECTIVES', 'INTEL', 'RESOURCES'];
    var pi;
    for (pi = 0; pi < panels.length; pi++) {
      var el  = document.getElementById('cmd-panel-' + panels[pi]);
      var tab = document.getElementById('cmd-tab-'   + panels[pi]);
      if (el)  { el.style.display  = (panels[pi] === name) ? 'block'       : 'none'; }
      if (tab) {
        tab.style.background = (panels[pi] === name) ? '#00FF66'    : 'transparent';
        tab.style.color      = (panels[pi] === name) ? '#000'       : '#00FF66';
      }
    }
    _refreshActivePanel();
  }

  function _refreshActivePanel() {
    if (_activePanel === 'UNITS')      { _renderUnitsPanel();      }
    if (_activePanel === 'OBJECTIVES') { _renderObjectivesPanel(); }
    if (_activePanel === 'INTEL')      { _renderIntelPanel();      }
    if (_activePanel === 'RESOURCES')  { _renderResourcesPanel();  }
    _updateStatusBar();
    _drawMinimap();
  }

  /* ── Panel renderers ────────────────────────────────────────────────────── */
  function _renderUnitsPanel() {
    if (!_unitListEl) { return; }
    var units = _getFriendlyUnits();
    var html = '<div style="font-weight:bold;margin-bottom:6px;letter-spacing:2px;">FRIENDLY UNITS</div>';
    if (units.length === 0) {
      html += '<div style="color:#888;">No units reporting.</div>';
    } else {
      var ui;
      for (ui = 0; ui < units.length; ui++) {
        var u     = units[ui];
        var uid   = u.id   || ('U' + ui);
        var uname = u.name || ('Unit-' + uid);
        var uhp   = (u.hp !== undefined) ? u.hp : '?';
        var uord  = u.pendingOrder ? (' -> ' + u.pendingOrder) : '';
        var inRad = u._inCommandRadius ? ' [+CMD]' : '';
        html += '<div style="cursor:pointer;padding:3px 0;border-bottom:1px solid #004400;" ' +
          'id="cmd-unit-' + ui + '">' +
          '<span style="color:#00FF66;">' + uname + '</span>' +
          ' HP:' + uhp +
          '<span style="color:#FFAA00;">' + uord + '</span>' +
          '<span style="color:#44FF44;">' + inRad + '</span>' +
          '</div>';
      }
    }
    _unitListEl.innerHTML = html;

    /* attach click handlers after setting innerHTML */
    var units2 = _getFriendlyUnits();
    var ci;
    for (ci = 0; ci < units2.length; ci++) {
      /* IIFE to capture index */
      (function (idx) {
        var el = document.getElementById('cmd-unit-' + idx);
        if (el) {
          el.onclick = function (e) {
            e.stopPropagation();
            _selectedUnit = units2[idx];
            _showOrderMenu(e.clientX, e.clientY);
          };
        }
      }(ci));
    }
  }

  function _renderObjectivesPanel() {
    if (!_objectiveListEl) { return; }
    var objs = _getObjectives();
    var html = '<div style="font-weight:bold;margin-bottom:6px;letter-spacing:2px;">OBJECTIVES</div>';
    if (objs.length === 0) {
      html += '<div style="color:#888;">No objectives data.</div>';
    } else {
      var oi;
      for (oi = 0; oi < objs.length; oi++) {
        var o       = objs[oi];
        var oname   = o.name  || ('OBJ-' + oi);
        var ostatus = o.state || o.status || 'UNKNOWN';
        var ocolor  = '#888888';
        if (ostatus === 'FRIENDLY') { ocolor = '#00FF66'; }
        if (ostatus === 'ENEMY')    { ocolor = '#FF3300'; }
        if (ostatus === 'NEUTRAL')  { ocolor = '#AAAAAA'; }
        html += '<div style="padding:3px 0;border-bottom:1px solid #004400;">' +
          '<span style="color:#00AAFF;">' + oname + '</span> -- ' +
          '<span style="color:' + ocolor + ';">' + ostatus + '</span>' +
          '</div>';
      }
    }
    _objectiveListEl.innerHTML = html;
  }

  function _renderIntelPanel() {
    if (!_intelListEl) { return; }
    var html = '<div style="font-weight:bold;margin-bottom:6px;letter-spacing:2px;">INTEL REPORTS</div>';
    if (_intelLog.length === 0) {
      html += '<div style="color:#888;">Awaiting intel...</div>';
    } else {
      var ii;
      for (ii = 0; ii < _intelLog.length; ii++) {
        var color = '#00CC44';
        if (_intelLog[ii].indexOf('[ALERT]')  !== -1) { color = '#FF6600'; }
        if (_intelLog[ii].indexOf('[ORDER]')  !== -1) { color = '#FFFF00'; }
        if (_intelLog[ii].indexOf('[FIRES]')  !== -1) { color = '#FF4400'; }
        if (_intelLog[ii].indexOf('[SYSTEM]') !== -1) { color = '#AA88FF'; }
        html += '<div style="font-size:11px;color:' + color + ';padding:2px 0;' +
          'border-bottom:1px solid #002200;">' + _intelLog[ii] + '</div>';
      }
    }
    _intelListEl.innerHTML = html;
  }

  function _renderResourcesPanel() {
    if (!_resourceListEl) { return; }
    var res  = _getResources();
    var html = '<div style="font-weight:bold;margin-bottom:6px;letter-spacing:2px;">RESOURCES / LOGISTICS</div>';

    var rows = [
      { label: 'AMMUNITION', key: 'ammo',    unit: 'rds',  warn: 50 },
      { label: 'FUEL',       key: 'fuel',    unit: '%',    warn: 25 },
      { label: 'FOOD',       key: 'food',    unit: '%',    warn: 20 },
      { label: 'WATER',      key: 'water',   unit: '%',    warn: 20 },
      { label: 'MEDICAL',    key: 'medical', unit: 'kits', warn: 2  }
    ];

    var ri;
    for (ri = 0; ri < rows.length; ri++) {
      var row   = rows[ri];
      var val   = (res[row.key] !== undefined) ? res[row.key] : '--';
      var color = '#00FF66';
      if (typeof val === 'number' && val <= row.warn) { color = '#FF4400'; }
      html += '<div style="padding:5px 0;border-bottom:1px solid #004400;display:flex;' +
        'justify-content:space-between;">' +
        '<span>' + row.label + '</span>' +
        '<span style="color:' + color + ';">' + val + ' ' + row.unit + '</span>' +
        '</div>';
    }
    _resourceListEl.innerHTML = html;
  }

  /* ── Order menu ─────────────────────────────────────────────────────────── */
  function _showOrderMenu(x, y) {
    if (!_orderMenuEl) { return; }
    _orderMenuEl.style.left    = x + 'px';
    _orderMenuEl.style.top     = y + 'px';
    _orderMenuEl.style.display = 'block';
    _orderMenuOpen = true;

    var html = '<div style="font-weight:bold;margin-bottom:6px;color:#FFFF00;">ISSUE ORDER</div>';
    var oi;
    for (oi = 0; oi < ORDERS.length; oi++) {
      html += '<div style="cursor:pointer;padding:3px 6px;margin:2px 0;border:1px solid #444;" ' +
        'id="cmd-order-opt-' + oi + '">' + ORDERS[oi] + '</div>';
    }
    html += '<div style="cursor:pointer;padding:3px 6px;margin-top:6px;color:#888;" ' +
      'id="cmd-order-cancel">CANCEL</div>';
    _orderMenuEl.innerHTML = html;

    /* bind order option clicks */
    var oi2;
    for (oi2 = 0; oi2 < ORDERS.length; oi2++) {
      /* IIFE to capture order string */
      (function (order, idx) {
        var el = document.getElementById('cmd-order-opt-' + idx);
        if (el) {
          el.onmouseover = function () { el.style.background = '#00FF66'; el.style.color = '#000'; };
          el.onmouseout  = function () { el.style.background = '';        el.style.color = '';    };
          el.onclick = function (e) {
            e.stopPropagation();
            _issueOrder(_selectedUnit, order);
            _orderMenuEl.style.display = 'none';
          };
        }
      }(ORDERS[oi2], oi2));
    }

    var cancelEl = document.getElementById('cmd-order-cancel');
    if (cancelEl) {
      cancelEl.onclick = function () {
        _orderMenuEl.style.display = 'none';
        _orderMenuOpen = false;
      };
    }
  }

  /* ── Status bar ─────────────────────────────────────────────────────────── */
  function _updateStatusBar() {
    var el = document.getElementById('cmd-bunker-status');
    if (!el) { return; }
    var hpPct   = Math.round((_bunkerHP / BUNKER_HP_MAX) * 100);
    var hpColor = '#00FF66';
    if (hpPct < 33)       { hpColor = '#FF4400'; }
    else if (hpPct < 66)  { hpColor = '#FFAA00'; }
    el.innerHTML =
      'BUNKER HP: <span style="color:' + hpColor + ';">' +
        _bunkerHP + ' / ' + BUNKER_HP_MAX + ' (' + hpPct + '%)</span><br>' +
      'STATUS: ' +
        (_deployed
          ? '<span style="color:#00FF66;">ACTIVE</span>'
          : '<span style="color:#888;">NOT DEPLOYED</span>') + '<br>' +
      'RANGE: <span style="color:#00AAFF;">' + COMMAND_RADIUS + 'm</span>';
  }

  /* ── Minimap ────────────────────────────────────────────────────────────── */
  function _drawMinimap() {
    if (!_minimapCtx || !_minimapCanvas) { return; }
    var ctx   = _minimapCtx;
    var W     = _minimapCanvas.width;
    var H     = _minimapCanvas.height;
    var scale = W / (COMMAND_RADIUS * 2.5);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0A1A0A';
    ctx.fillRect(0, 0, W, H);

    /* grid lines */
    ctx.strokeStyle = '#1A3A1A';
    ctx.lineWidth = 1;
    var gi;
    for (gi = 0; gi <= 10; gi++) {
      var gx = (gi / 10) * W;
      var gy = (gi / 10) * H;
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    /* center = bunker position */
    var originX = _bunkerPos ? _bunkerPos.x : 0;
    var originZ = _bunkerPos ? _bunkerPos.z : 0;

    function worldToMap(wx, wz) {
      return {
        x: W / 2 + (wx - originX) * scale,
        y: H / 2 + (wz - originZ) * scale
      };
    }

    /* command radius circle */
    ctx.strokeStyle = '#00FF66';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, COMMAND_RADIUS * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    /* bunker marker */
    if (_deployed && _bunkerPos) {
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(W / 2 - 5, H / 2 - 5, 10, 10);
      ctx.fillStyle = '#000';
      ctx.font      = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CP', W / 2, H / 2 + 3);
    }

    /* objective rings */
    var objs = _getObjectives();
    var oi;
    for (oi = 0; oi < objs.length; oi++) {
      var obj = objs[oi];
      if (!obj.position) { continue; }
      var mp     = worldToMap(obj.position.x, obj.position.z);
      var ostate = obj.state || 'NEUTRAL';
      ctx.strokeStyle = (ostate === 'FRIENDLY') ? '#00FF66'
                      : (ostate === 'ENEMY')    ? '#FF3300'
                      : '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* friendly unit dots */
    var units = _getFriendlyUnits();
    var ui;
    for (ui = 0; ui < units.length; ui++) {
      var u = units[ui];
      if (!u.position) { continue; }
      var up = worldToMap(u.position.x, u.position.z);
      ctx.fillStyle = '#00AAFF';
      ctx.beginPath();
      ctx.arc(up.x, up.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    /* player marker (white triangle) */
    var ppos = (_player && _player.position) ? _player.position : null;
    if (ppos) {
      var pp = worldToMap(ppos.x, ppos.z);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(pp.x, pp.y - 6);
      ctx.lineTo(pp.x - 4, pp.y + 4);
      ctx.lineTo(pp.x + 4, pp.y + 4);
      ctx.closePath();
      ctx.fill();
    }

    /* border */
    ctx.strokeStyle = '#00FF66';
    ctx.lineWidth   = 1;
    ctx.strokeRect(0, 0, W, H);
  }

  /* ── Open / close UI ────────────────────────────────────────────────────── */
  function _openUI() {
    if (!_uiOverlay) { return; }
    _uiOpen = true;
    _uiOverlay.style.display = 'block';
    _switchPanel(_activePanel);
    _updateHUD();
  }

  function _closeUI() {
    if (!_uiOverlay) { return; }
    _uiOpen = false;
    _uiOverlay.style.display = 'none';
    _updateHUD();
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'cmd-bunker-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00FF66',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00FF66',
      'letter-spacing:2px',
      'z-index:8000',
      'display:none',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    if (!_deployed || _playerInside || _uiOpen) {
      _hudEl.style.display = 'none';
      return;
    }
    var units   = _getFriendlyUnits();
    var inRange = 0;
    var ui;
    for (ui = 0; ui < units.length; ui++) {
      if (units[ui]._inCommandRadius) { inRange++; }
    }
    _hudEl.textContent = 'CMD POST [ACTIVE] [UNITS: ' + inRange + '] [RANGE: ' + COMMAND_RADIUS + 'm]';
    _hudEl.style.display = 'block';
  }

  /* ── Keyboard handlers ──────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'c') { _cKeyDown = true; }
    if (key === 'b') { _bKeyDown = true; }

    /* C+B to deploy */
    if (_cKeyDown && _bKeyDown && !_deployed) {
      _deploy();
    }

    /* Escape: close order menu or UI */
    if (key === 'escape') {
      if (_orderMenuOpen && _orderMenuEl) {
        _orderMenuEl.style.display = 'none';
        _orderMenuOpen = false;
      } else if (_uiOpen) {
        _closeUI();
      }
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'c') { _cKeyDown = false; }
    if (key === 'b') { _bKeyDown = false; }
  }

  /* ── Init ───────────────────────────────────────────────────────────────── */
  function init(scene, camera, renderer, player) {
    _scene    = scene    || null;
    _camera   = camera   || null;
    _renderer = renderer || null;
    _player   = player   || null;

    window._unitOrders      = window._unitOrders || {};
    window._inCommandRadius = false;

    _createHUD();
    _createUI();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _radioTimer = RADIO_INTERVAL;
    _addIntel('[SYSTEM] Command Bunker module loaded. Press C+B to deploy.');
  }

  /* ── Update ─────────────────────────────────────────────────────────────── */
  function update(dt) {
    if (!dt || dt <= 0) { dt = 0.016; }

    /* collapse animation takes priority */
    if (_collapseAnim) {
      _updateCollapse(dt);
      _updateSmoke(dt);
      return;
    }

    /* update smoke particles (damage smoke) */
    _updateSmoke(dt);

    if (!_deployed) { return; }

    /* check if player is inside bunker */
    var playerPos = (_player && _player.position) ? _player.position : null;
    var wasInside = _playerInside;

    if (playerPos && _bunkerPos) {
      _playerInside = (_dist3(playerPos, _bunkerPos) <= INTERIOR_RADIUS);
    } else {
      _playerInside = false;
    }

    /* transition: entered bunker — open UI */
    if (!wasInside && _playerInside && !_uiOpen) {
      _openUI();
    }
    /* transition: left bunker — close UI */
    if (wasInside && !_playerInside && _uiOpen) {
      _closeUI();
    }

    /* update command radius flags on units */
    _updateCommandRadius();

    /* radio intel countdown */
    _radioTimer -= dt;
    if (_radioTimer <= 0) {
      _radioTimer = RADIO_INTERVAL;
      _radioIntel();
    }

    /* enemy attacks if discovered */
    _checkEnemyAttack(dt);

    /* check discovery by nearby enemies */
    if (!_discovered) {
      var enemies = window._enemies || [];
      var ei;
      for (ei = 0; ei < enemies.length; ei++) {
        var e = enemies[ei];
        if (!e || !e.position) { continue; }
        if (_dist3(e.position, _bunkerPos) < 40 && e.alive !== false) {
          _discovered = true;
          _addIntel('[ALERT] Command Post DISCOVERED by enemy forces!');
          break;
        }
      }
    }

    /* update HUD */
    _updateHUD();

    /* refresh UI panels roughly once per second */
    if (_uiOpen) {
      _smokeTimer += dt;
      if (_smokeTimer >= 1.0) {
        _smokeTimer = 0;
        _refreshActivePanel();
      }
    }
  }

  /* ── Reset ──────────────────────────────────────────────────────────────── */
  function reset() {
    /* remove bunker from scene */
    if (_bunkerGroup && _scene) {
      _scene.remove(_bunkerGroup);
    }
    _bunkerGroup  = null;
    _bunkerPos    = null;
    _deployed     = false;
    _bunkerHP     = BUNKER_HP_MAX;
    _discovered   = false;
    _playerInside = false;
    _collapseAnim = false;
    _smoke1Played = false;
    _smoke2Played = false;
    _cKeyDown     = false;
    _bKeyDown     = false;
    _radioTimer   = RADIO_INTERVAL;
    _intelLog     = [];
    _selectedUnit = null;
    _orderMenuOpen = false;

    /* remove smoke particles */
    var pi;
    for (pi = 0; pi < _smokeParticles.length; pi++) {
      if (_scene) { _scene.remove(_smokeParticles[pi].mesh); }
    }
    _smokeParticles = [];

    /* close UI */
    _closeUI();
    if (_hudEl) { _hudEl.style.display = 'none'; }

    window._inCommandRadius = false;
    window._unitOrders = {};

    _addIntel('[SYSTEM] Command Bunker reset.');
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset,
    /* expose for external damage (e.g. enemy hits) */
    damage: _damageBunker,
    /* expose deploy for external triggers */
    deploy: _deploy
  };

}());
