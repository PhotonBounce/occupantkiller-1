/* ─────────────────────────────────────────────────────────────────────────
   INTEL NETWORK — Spy Asset Management System
   Toggle panel with I+N keys (both held or pressed in sequence).
   Four asset types: INFORMANT, SLEEPER, TECHNICIAN, COURIER.
   Depends on: THREE (global), window._gameScene, window._player
   ───────────────────────────────────────────────────────────────────────── */
window.IntelNetwork = (function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────────────
     CONSTANTS
  ────────────────────────────────────────────────────────────────────── */
  var ASSET_COUNT          = 3;
  var SPAWN_MIN_DIST       = 20;
  var SPAWN_MAX_DIST       = 40;
  var CONTACT_RADIUS       = 4;      // walk within this to activate asset
  var BURN_RADIUS          = 3;      // enemy within this burns asset
  var DEAD_DROP_PICKUP     = 10;     // seconds for asset to pick up dead drop
  var INTEL_REVEAL_DUR     = 30;     // seconds enemy markers visible after dead drop
  var EXTRACT_RANGE        = 4;      // press E within this to extract
  var DEAD_DROP_RANGE      = 4;      // press D within this to place dead drop
  var CI_SWEEP_INTERVAL    = 60;     // seconds between CI sweeps
  var CI_SWEEP_DURATION    = 15;     // seconds CI sweep lasts
  var INTEL_PTS            = 25;     // points per intel report
  var EXTRACT_PTS          = 200;    // points for extracting an asset
  var NETWORK_BONUS        = 500;    // bonus for all 3 active simultaneously
  var CONTACT_GLOW_DUR     = 2000;   // ms glow after first contact
  var THREAT_PER_SWEEP     = 12;     // threat % per CI sweep
  var MAP_SIZE             = 200;    // canvas pixels
  var WORLD_RANGE          = 60;     // world units shown on map

  var ASSET_TYPES = ['INFORMANT', 'SLEEPER', 'TECHNICIAN', 'COURIER'];

  var INTEL_REPORTS = [
    'Enemy patrol route: Grid B4 to C7 to B4, interval 90s.',
    'Enemy position: 4 soldiers at northern checkpoint.',
    'Weapons cache: Grid F2, buried under old farm shed.',
    'Reinforcement schedule: 0300hrs, 12 men via western road.',
    'Patrol commander identified: Lt. Morozov, tall, grey coat.',
    'Supply convoy departs 0600 from FOB East. 3 vehicles.',
    'Sniper nest on water tower, south sector. Rotates noon.',
    'Enemy radio frequency: 148.5 MHz. Command uses AES.',
    'Ammunition depot at Grid D9. Guard shift changes every 4h.',
    'Enemy has 2 RPG teams covering the main bridge approach.',
    'Medical convoy route confirmed: unescorted, arrives 1400.',
    'Enemy HQ location: basement of old school, Grid C5.',
    'Patrol gap: northwest sector unguarded 0200-0230.',
    'New checkpoint erected at river crossing, 3 guards.',
    'Enemy strength reduced — 6 casualties from friendly fire.'
  ];

  /* ──────────────────────────────────────────────────────────────────────
     STATE
  ────────────────────────────────────────────────────────────────────── */
  var _scene        = null;
  var _camera       = null;
  var _inited       = false;
  var _panelVisible = false;
  var _activeTab    = 'ASSETS'; // ASSETS | INTEL LOG | NETWORK MAP | THREAT LEVEL

  /* Assets array — each element:
       type, mesh, group, statusMesh, light,
       status        — 'ACTIVE'|'BURNED'|'EXTRACTED'
       contacted     — bool: player ever walked within range
       contactGlowTimer
       intelTimer    — seconds until next intel report
       intelInterval — randomised 20-45s
       deadDrop      — null or { mesh, coverMesh, timer }
       intelRevealing— bool
       revealTimer   — countdown seconds for reveal
       waypointA, waypointB, waypointDir   — COURIER only
       pos           — { x, z } cached
  */
  var _assets       = [];
  var _intelLog     = [];   // { text, time, assetType }
  var _score        = 0;
  var _threatLevel  = 0;    // 0-100
  var _networkBonus = false;
  var _networkBlown = false;

  /* CI sweep */
  var _ciTimer      = CI_SWEEP_INTERVAL;
  var _ciActive     = false;
  var _ciRemain     = 0;
  var _ciTargetIdx  = -1;  // which asset is targeted

  /* Key tracking */
  var _keyI         = false;
  var _keyN         = false;
  var _keyD         = false;
  var _keyE         = false;
  var _keyDPrev     = false;
  var _keyEPrev     = false;

  /* Timing */
  var _intelAgeClock = 0;

  /* Enemy-position reveal markers */
  var _revealMarkers = [];  // { mesh, timer, enemy }

  /* Panel DOM */
  var _panel        = null;
  var _hudEl        = null;
  var _canvas       = null;
  var _ctx          = null;

  /* ──────────────────────────────────────────────────────────────────────
     HELPERS
  ────────────────────────────────────────────────────────────────────── */
  function _rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function _rndInt(min, max) {
    return Math.floor(_rnd(min, max + 1));
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _getPlayer() {
    if (window._player) return window._player;
    if (window.GameManager && window.GameManager.getPlayer) return window.GameManager.getPlayer();
    return null;
  }

  function _getPlayerPos() {
    var p = _getPlayer();
    if (!p) return { x: 0, y: 0, z: 0 };
    if (p.position) return p.position;
    if (p.mesh && p.mesh.position) return p.mesh.position;
    return { x: 0, y: 0, z: 0 };
  }

  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll) return window.Enemies.getAll();
    if (window._enemyList) return window._enemyList;
    return [];
  }

  function _toast(msg, color, dur) {
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast(msg, dur || 3000, color || '#44ffcc');
        return;
      }
    } catch (eT) {}
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:22%;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.82);color:' + (color || '#44ffcc') + ';font:bold 15px monospace;' +
      'padding:8px 22px;border-radius:4px;z-index:9999;pointer-events:none;border:1px solid ' +
      (color || '#44ffcc');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, dur || 3000);
  }

  function _addScore(pts) {
    _score += pts;
    if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(pts);
    } else if (window._score !== undefined) {
      window._score += pts;
    }
  }

  /* ──────────────────────────────────────────────────────────────────────
     ASSET MESH BUILDERS
  ────────────────────────────────────────────────────────────────────── */

  /* INFORMANT: civilian — cylinder body + sphere head, skin tone */
  function _buildInformant() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);
    var headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.25;
    group.add(head);
    return group;
  }

  /* SLEEPER: enemy soldier, dark uniform + blue dot overhead */
  function _buildSleeper() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.1, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    group.add(body);
    var headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.3;
    group.add(head);
    var dotGeo = new THREE.SphereGeometry(0.12, 6, 6);
    var dotMat = new THREE.MeshBasicMaterial({ color: 0x0044FF });
    var dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.y = 2.0;
    group.add(dot);
    return group;
  }

  /* TECHNICIAN: dark uniform 0x444466, carries BoxGeometry laptop */
  function _buildTechnician() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x444466 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);
    var headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xBBAA99 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.25;
    group.add(head);
    var lapGeo = new THREE.BoxGeometry(0.4, 0.04, 0.3);
    var lapMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    var laptop = new THREE.Mesh(lapGeo, lapMat);
    laptop.position.set(0.35, 0.72, 0.05);
    laptop.rotation.z = 0.3;
    group.add(laptop);
    return group;
  }

  /* COURIER: moves between two waypoints */
  function _buildCourier() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);
    var headGeo = new THREE.SphereGeometry(0.18, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.2;
    group.add(head);
    var bagGeo = new THREE.BoxGeometry(0.25, 0.25, 0.15);
    var bagMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    var bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(-0.3, 0.6, 0.0);
    group.add(bag);
    return group;
  }

  /* Status indicator sphere above asset */
  function _buildStatusMesh() {
    var geo = new THREE.SphereGeometry(0.1, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 2.3;
    return mesh;
  }

  /* ──────────────────────────────────────────────────────────────────────
     ASSET SPAWNING
  ────────────────────────────────────────────────────────────────────── */
  function _spawnAssets() {
    var playerPos = _getPlayerPos();
    var usedPositions = [];

    for (var i = 0; i < ASSET_COUNT; i++) {
      var type = ASSET_TYPES[i % ASSET_TYPES.length];
      var group;
      if (type === 'INFORMANT')       group = _buildInformant();
      else if (type === 'SLEEPER')    group = _buildSleeper();
      else if (type === 'TECHNICIAN') group = _buildTechnician();
      else                            group = _buildCourier();

      var px, pz, tries = 0;
      do {
        var angle = Math.random() * Math.PI * 2;
        var dist  = _rnd(SPAWN_MIN_DIST, SPAWN_MAX_DIST);
        px = playerPos.x + Math.cos(angle) * dist;
        pz = playerPos.z + Math.sin(angle) * dist;
        tries++;
      } while (tries < 30 && _tooClose(px, pz, usedPositions));
      usedPositions.push({ x: px, z: pz });

      group.position.set(px, 0, pz);

      var light = new THREE.PointLight(0x00FFFF, 0, 6);
      light.position.set(px, 1.5, pz);
      _scene.add(light);

      var statusMesh = _buildStatusMesh();
      group.add(statusMesh);

      _scene.add(group);

      var wpA = null, wpB = null;
      if (type === 'COURIER') {
        wpA = { x: px + _rnd(-8, 8), z: pz + _rnd(-8, 8) };
        wpB = { x: px + _rnd(-8, 8), z: pz + _rnd(-8, 8) };
      }

      _assets.push({
        type: type,
        group: group,
        mesh: group,
        statusMesh: statusMesh,
        light: light,
        status: 'ACTIVE',
        contacted: false,
        contactGlowTimer: 0,
        intelTimer: _rnd(20, 45),
        intelInterval: _rnd(20, 45),
        deadDrop: null,
        intelRevealing: false,
        revealTimer: 0,
        waypointA: wpA,
        waypointB: wpB,
        waypointDir: 1,
        pos: { x: px, z: pz }
      });
    }
  }

  function _tooClose(px, pz, list) {
    for (var i = 0; i < list.length; i++) {
      if (_dist2D(px, pz, list[i].x, list[i].z) < 8) return true;
    }
    return false;
  }

  /* ──────────────────────────────────────────────────────────────────────
     DEAD DROP MECHANICS
  ────────────────────────────────────────────────────────────────────── */
  function _placeDeadDrop(assetIdx) {
    var asset = _assets[assetIdx];
    if (!asset || asset.status !== 'ACTIVE') return;
    if (asset.deadDrop) { _toast('Dead drop already placed for ' + asset.type, '#ffaa00'); return; }

    var pp = _getPlayerPos();

    var boxGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var boxMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(pp.x + _rnd(-0.5, 0.5), 0.05, pp.z + _rnd(-0.5, 0.5));

    var coverGeo = new THREE.PlaneGeometry(0.5, 0.5);
    var coverMat = new THREE.MeshLambertMaterial({ color: 0x2A2A1A, side: THREE.DoubleSide });
    var cover = new THREE.Mesh(coverGeo, coverMat);
    cover.rotation.x = -Math.PI / 2;
    cover.position.set(box.position.x, 0.01, box.position.z);

    _scene.add(box);
    _scene.add(cover);

    asset.deadDrop = { mesh: box, coverMesh: cover, timer: DEAD_DROP_PICKUP };
    _toast('Dead drop placed. Asset will retrieve in ~' + DEAD_DROP_PICKUP + 's.', '#00ffcc');
  }

  function _deliverIntelPackage(assetIdx) {
    var asset = _assets[assetIdx];
    asset.intelRevealing = true;
    asset.revealTimer = INTEL_REVEAL_DUR;
    _toast('INTEL PACKAGE received! Enemy positions revealed for ' + INTEL_REVEAL_DUR + 's!', '#ffff00', 4000);
    _addScore(INTEL_PTS * 3);
    _addIntelLog(asset.type, 'Intel package delivered — enemy positions exposed.');
    _spawnRevealMarkers();
  }

  function _spawnRevealMarkers() {
    for (var i = 0; i < _revealMarkers.length; i++) {
      if (_revealMarkers[i].mesh.parent) _scene.remove(_revealMarkers[i].mesh);
    }
    _revealMarkers = [];

    var enemies = _getEnemies();
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      var ePos = (e.mesh && e.mesh.position) ? e.mesh.position : (e.position || null);
      if (!ePos) continue;

      var geo = new THREE.ConeGeometry(0.3, 0.8, 3);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFF2200 });
      var marker = new THREE.Mesh(geo, mat);
      marker.position.set(ePos.x, ePos.y + 2.5, ePos.z);
      _scene.add(marker);
      _revealMarkers.push({ mesh: marker, timer: INTEL_REVEAL_DUR, enemy: e });
    }
  }

  /* ──────────────────────────────────────────────────────────────────────
     CI SWEEP
  ────────────────────────────────────────────────────────────────────── */
  function _startCISweep() {
    _ciActive = true;
    _ciRemain = CI_SWEEP_DURATION;
    var targets = [];
    for (var i = 0; i < _assets.length; i++) {
      if (_assets[i].status === 'ACTIVE') targets.push(i);
    }
    _ciTargetIdx = targets.length > 0 ? targets[_rndInt(0, targets.length - 1)] : -1;
    _threatLevel = Math.min(100, _threatLevel + THREAT_PER_SWEEP);
    _toast('!!! CI SWEEP ACTIVE !!! Counterintelligence targeting your assets!', '#FF4400', 5000);
    _addIntelLog('SYSTEM', 'CI sweep initiated. Asset network under surveillance.');
    if (_threatLevel >= 100) _blowNetwork();
  }

  function _blowNetwork() {
    if (_networkBlown) return;
    _networkBlown = true;
    _toast('NETWORK BLOWN — All assets compromised!', '#ff0000', 8000);
    for (var i = 0; i < _assets.length; i++) {
      if (_assets[i].status === 'ACTIVE') {
        _burnAsset(i);
      }
    }
  }

  /* ──────────────────────────────────────────────────────────────────────
     ASSET STATUS CHANGES
  ────────────────────────────────────────────────────────────────────── */
  function _burnAsset(idx) {
    var asset = _assets[idx];
    if (asset.status === 'EXTRACTED') return;
    asset.status = 'BURNED';
    asset.intelTimer = 9999;
    asset.group.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        obj.material = obj.material.clone();
        obj.material.color.setHex(0xCC2200);
      }
    });
    asset.statusMesh.material = asset.statusMesh.material.clone();
    asset.statusMesh.material.color.setHex(0xFF0000);
    _toast(asset.type + ' BURNED — asset compromised!', '#ff4400', 4000);
    _addIntelLog(asset.type, 'BURNED — enemy contact. No longer producing intel.');
  }

  function _extractAsset(idx) {
    var asset = _assets[idx];
    if (asset.status === 'EXTRACTED' || asset.status === 'BURNED') return;
    asset.status = 'EXTRACTED';
    _scene.remove(asset.group);
    _scene.remove(asset.light);
    if (asset.deadDrop) {
      _scene.remove(asset.deadDrop.mesh);
      _scene.remove(asset.deadDrop.coverMesh);
      asset.deadDrop = null;
    }
    _addScore(EXTRACT_PTS);
    _toast(asset.type + ' EXTRACTED! +' + EXTRACT_PTS + ' pts', '#00ffaa', 3000);
    _addIntelLog(asset.type, 'Extracted safely. Intel preserved.');
  }

  /* ──────────────────────────────────────────────────────────────────────
     INTEL REPORTING
  ────────────────────────────────────────────────────────────────────── */
  function _addIntelLog(assetType, text) {
    var now = new Date();
    var timeStr = now.getHours() + ':' + _pad(now.getMinutes()) + ':' + _pad(now.getSeconds());
    _intelLog.unshift({ text: text, time: timeStr, assetType: assetType });
    if (_intelLog.length > 40) _intelLog.pop();
    _intelAgeClock = 0;
    _updatePanel();
  }

  function _pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _generateIntel(asset) {
    var report = INTEL_REPORTS[_rndInt(0, INTEL_REPORTS.length - 1)];
    _addIntelLog(asset.type, report);
    _addScore(INTEL_PTS);
    asset.intelInterval = _rnd(20, 45);
    asset.intelTimer = asset.intelInterval;
  }

  /* ──────────────────────────────────────────────────────────────────────
     NETWORK STATUS
  ────────────────────────────────────────────────────────────────────── */
  function _countActive() {
    var n = 0;
    for (var i = 0; i < _assets.length; i++) {
      if (_assets[i].status === 'ACTIVE') n++;
    }
    return n;
  }

  function _checkNetworkBonus() {
    if (_networkBonus) return;
    if (_countActive() >= ASSET_COUNT) {
      _networkBonus = true;
      _addScore(NETWORK_BONUS);
      _toast('NETWORK ACTIVE — All assets operational! +' + NETWORK_BONUS + ' pts!', '#ffff00', 5000);
    }
  }

  /* ──────────────────────────────────────────────────────────────────────
     PANEL / HUD DOM
  ────────────────────────────────────────────────────────────────────── */
  function _buildPanel() {
    if (_panel) return;

    _panel = document.createElement('div');
    _panel.id = 'intel-network-panel';
    _panel.style.cssText = [
      'position:fixed',
      'top:80px',
      'right:20px',
      'width:380px',
      'background:rgba(5,10,5,0.95)',
      'border:1px solid #00cc66',
      'border-radius:4px',
      'font-family:monospace',
      'font-size:12px',
      'color:#aaffcc',
      'z-index:8000',
      'display:none',
      'flex-direction:column',
      'overflow:hidden',
      'box-shadow:0 0 12px #00cc6644'
    ].join(';');

    var header = document.createElement('div');
    header.style.cssText = 'padding:8px 12px;background:#001a0a;color:#00ff88;' +
      'font-size:13px;font-weight:bold;letter-spacing:2px;border-bottom:1px solid #00cc66;';
    header.textContent = '[ INTEL NETWORK ]';
    _panel.appendChild(header);

    var tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;border-bottom:1px solid #00cc6633;background:#000d05;';
    var tabNames = ['ASSETS', 'INTEL LOG', 'NETWORK MAP', 'THREAT LEVEL'];
    for (var ti = 0; ti < tabNames.length; ti++) {
      (function (name) {
        var tab = document.createElement('div');
        tab.style.cssText = 'flex:1;text-align:center;padding:5px 2px;cursor:pointer;' +
          'font-size:10px;letter-spacing:1px;color:#557766;';
        tab.textContent = name;
        tab.dataset.tab = name;
        tab.addEventListener('click', function () { _setTab(name); });
        tabs.appendChild(tab);
      })(tabNames[ti]);
    }
    _panel.appendChild(tabs);
    _panel._tabs = tabs;

    var content = document.createElement('div');
    content.style.cssText = 'padding:10px 12px;min-height:220px;max-height:320px;overflow-y:auto;';
    content.id = 'intel-network-content';
    _panel.appendChild(content);
    _panel._content = content;

    var mapWrap = document.createElement('div');
    mapWrap.id = 'intel-network-map-wrap';
    mapWrap.style.cssText = 'display:none;padding:8px;justify-content:center;';
    _canvas = document.createElement('canvas');
    _canvas.width  = MAP_SIZE;
    _canvas.height = MAP_SIZE;
    _canvas.style.cssText = 'display:block;border:1px solid #00cc66;';
    _ctx = _canvas.getContext('2d');
    mapWrap.appendChild(_canvas);
    _panel.appendChild(mapWrap);
    _panel._mapWrap = mapWrap;

    document.body.appendChild(_panel);
    _setTab('ASSETS');
  }

  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'intel-network-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:8px',
      'right:8px',
      'font-family:monospace',
      'font-size:11px',
      'color:#00ffaa',
      'background:rgba(0,10,5,0.75)',
      'padding:4px 10px',
      'border:1px solid #00cc6660',
      'border-radius:3px',
      'z-index:7900',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var n = _countActive();
    if (n === 0 && _intelLog.length === 0) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';
    var ageStr = Math.floor(_intelAgeClock) + 's';
    var ciStr  = _ciActive ? ' [!!CI SWEEP!!]' : '';
    _hudEl.textContent = 'INTEL NET [' + n + ' ASSETS] [THREAT:' +
      Math.round(_threatLevel) + '%] [LAST INTEL:' + ageStr + ']' + ciStr;
    _hudEl.style.color = _ciActive ? '#ff4400' : '#00ffaa';
  }

  function _setTab(name) {
    _activeTab = name;
    if (_panel && _panel._tabs) {
      var tabs = _panel._tabs.children;
      for (var i = 0; i < tabs.length; i++) {
        var isActive = tabs[i].dataset.tab === name;
        tabs[i].style.color        = isActive ? '#00ff88' : '#557766';
        tabs[i].style.borderBottom = isActive ? '2px solid #00ff88' : 'none';
      }
    }
    if (_panel && _panel._mapWrap) {
      _panel._mapWrap.style.display = (name === 'NETWORK MAP') ? 'flex' : 'none';
    }
    _updatePanel();
  }

  function _updatePanel() {
    if (!_panel || !_panelVisible) return;
    var content = _panel._content;
    if (!content) return;

    if (_activeTab === 'ASSETS') {
      _renderAssetsTab(content);
    } else if (_activeTab === 'INTEL LOG') {
      _renderIntelLogTab(content);
    } else if (_activeTab === 'NETWORK MAP') {
      content.innerHTML = '';
      _renderNetworkMap();
    } else if (_activeTab === 'THREAT LEVEL') {
      _renderThreatTab(content);
    }
  }

  function _renderAssetsTab(content) {
    var html = '';
    for (var i = 0; i < _assets.length; i++) {
      var a = _assets[i];
      var statusColor = a.status === 'ACTIVE' ? '#00ff88' :
                        a.status === 'BURNED'  ? '#ff4400' : '#aaaaaa';
      html += '<div style="margin-bottom:10px;border:1px solid #00cc6633;padding:6px;">';
      html += '<b style="color:' + statusColor + '">' + a.type + '</b>';
      html += ' <span style="color:' + statusColor + '">[ ' + a.status + ' ]</span>';
      html += '<br/>Contacted: <span style="color:' +
              (a.contacted ? '#00ffaa' : '#ff8800') + '">' +
              (a.contacted ? 'YES' : 'NO') + '</span>';
      if (a.status === 'ACTIVE') {
        html += '<br/>Next intel: <span style="color:#88aaff">' +
                Math.ceil(a.intelTimer) + 's</span>';
        if (a.deadDrop) {
          html += '<br/>Dead drop: <span style="color:#ffff00">pickup in ' +
                  Math.ceil(a.deadDrop.timer) + 's</span>';
        }
      }
      if (a.intelRevealing) {
        html += '<br/>Enemy reveal: <span style="color:#ffff00">' +
                Math.ceil(a.revealTimer) + 's remaining</span>';
      }
      html += '</div>';
    }
    if (_networkBonus) {
      html += '<div style="color:#ffff00;text-align:center;font-weight:bold;margin-top:6px;">' +
              '* NETWORK ACTIVE *</div>';
    }
    if (_networkBlown) {
      html += '<div style="color:#ff0000;text-align:center;font-weight:bold;">' +
              '!!! NETWORK BLOWN !!!</div>';
    }
    content.innerHTML = html;
  }

  function _renderIntelLogTab(content) {
    var html = '<div style="font-size:11px;">';
    if (_intelLog.length === 0) {
      html += '<div style="color:#556655;font-style:italic;">No intel reports yet.</div>';
    }
    for (var i = 0; i < _intelLog.length; i++) {
      var entry = _intelLog[i];
      html += '<div style="margin-bottom:4px;padding:3px;border-left:2px solid #00cc6644;">';
      html += '<span style="color:#556655;">' + entry.time + '</span> ';
      html += '<span style="color:#00aa66">[' + entry.assetType + ']</span> ';
      html += '<span style="color:#aaffcc">' + entry.text + '</span>';
      html += '</div>';
    }
    html += '</div>';
    content.innerHTML = html;
  }

  function _renderThreatTab(content) {
    var pct = Math.round(_threatLevel);
    var barColor = pct < 50 ? '#00ff88' : pct < 80 ? '#ffaa00' : '#ff2200';
    var barW = Math.round(pct * 2.6);
    var html = '<div style="margin-bottom:12px;">';
    html += '<div style="color:#aaffcc;margin-bottom:6px;">COUNTERINTELLIGENCE THREAT LEVEL</div>';
    html += '<div style="background:#111;border:1px solid #00cc6633;height:20px;border-radius:2px;">';
    html += '<div style="width:' + barW + 'px;height:100%;background:' + barColor +
            ';border-radius:2px;transition:width 0.3s;"></div></div>';
    html += '<div style="color:' + barColor +
            ';text-align:center;margin-top:4px;font-size:14px;font-weight:bold;">' +
            pct + '%</div>';
    html += '</div>';
    html += '<div style="color:#556655;font-size:11px;">CI sweeps occur every ' +
            CI_SWEEP_INTERVAL + 's.<br/>';
    html += 'Next sweep in: <span style="color:#00ffaa">' + Math.ceil(_ciTimer) + 's</span><br/>';
    if (_ciActive) {
      html += '<span style="color:#ff4400;font-weight:bold;">!!! CI SWEEP ACTIVE — ' +
              Math.ceil(_ciRemain) + 's remaining !!!</span><br/>';
    }
    html += 'Each sweep +' + THREAT_PER_SWEEP + '%. At 100% the network is blown.</div>';
    if (_networkBlown) {
      html += '<div style="color:#ff0000;font-size:14px;font-weight:bold;' +
              'text-align:center;margin-top:10px;">!!! NETWORK BLOWN !!!</div>';
    }
    content.innerHTML = html;
  }

  function _renderNetworkMap() {
    if (!_ctx) return;
    var pp = _getPlayerPos();
    var cx = MAP_SIZE / 2;
    var cy = MAP_SIZE / 2;
    var scale = MAP_SIZE / (WORLD_RANGE * 2);

    _ctx.fillStyle = '#050f05';
    _ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    _ctx.strokeStyle = '#00330011';
    _ctx.lineWidth = 1;
    for (var g = 0; g <= MAP_SIZE; g += 20) {
      _ctx.beginPath(); _ctx.moveTo(g, 0); _ctx.lineTo(g, MAP_SIZE); _ctx.stroke();
      _ctx.beginPath(); _ctx.moveTo(0, g); _ctx.lineTo(MAP_SIZE, g); _ctx.stroke();
    }

    var enemies = _getEnemies();
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      var ep = (en.mesh && en.mesh.position) ? en.mesh.position : (en.position || null);
      if (!ep) continue;
      var emx = cx + (ep.x - pp.x) * scale;
      var emy = cy + (ep.z - pp.z) * scale;
      _ctx.beginPath();
      _ctx.arc(emx, emy, 12, 0, Math.PI * 2);
      _ctx.fillStyle = 'rgba(255,30,0,0.12)';
      _ctx.fill();
      _ctx.strokeStyle = 'rgba(255,30,0,0.4)';
      _ctx.lineWidth = 1;
      _ctx.stroke();
      _ctx.beginPath();
      _ctx.arc(emx, emy, 3, 0, Math.PI * 2);
      _ctx.fillStyle = '#ff2200';
      _ctx.fill();
    }

    for (var ai = 0; ai < _assets.length; ai++) {
      var a = _assets[ai];
      var amx = cx + (a.pos.x - pp.x) * scale;
      var amy = cy + (a.pos.z - pp.z) * scale;
      var aColor = a.status === 'ACTIVE' ? '#00ff88' :
                   a.status === 'BURNED' ? '#ff4400' : '#555555';
      _ctx.beginPath();
      _ctx.arc(amx, amy, 5, 0, Math.PI * 2);
      _ctx.fillStyle = aColor;
      _ctx.fill();
      _ctx.fillStyle = '#aaffcc';
      _ctx.font = '9px monospace';
      _ctx.fillText(a.type[0], amx + 7, amy + 4);
    }

    _ctx.beginPath();
    _ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    _ctx.fillStyle = '#ffffff';
    _ctx.fill();
    _ctx.beginPath();
    _ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    _ctx.strokeStyle = '#aaffcc';
    _ctx.lineWidth = 1.5;
    _ctx.stroke();

    _ctx.fillStyle = '#00cc66';
    _ctx.font = '8px monospace';
    _ctx.fillText('P=PLAYER  I=INFORMANT  S=SLEEPER  T=TECH  C=COURIER', 2, MAP_SIZE - 4);
  }

  /* ──────────────────────────────────────────────────────────────────────
     KEY HANDLING
  ────────────────────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    var k = e.key ? e.key.toUpperCase() : '';
    if (k === 'I') _keyI = true;
    if (k === 'N') _keyN = true;
    if (k === 'D') _keyD = true;
    if (k === 'E') _keyE = true;

    if (_keyI && _keyN) {
      _togglePanel();
      _keyI = false;
      _keyN = false;
    }
  }

  function _onKeyUp(e) {
    var k = e.key ? e.key.toUpperCase() : '';
    if (k === 'I') _keyI = false;
    if (k === 'N') _keyN = false;
    if (k === 'D') _keyD = false;
    if (k === 'E') _keyE = false;
  }

  function _togglePanel() {
    if (!_panel) _buildPanel();
    _panelVisible = !_panelVisible;
    _panel.style.display = _panelVisible ? 'flex' : 'none';
    if (_panelVisible) _updatePanel();
  }

  /* ──────────────────────────────────────────────────────────────────────
     UPDATE — called each frame with delta time in seconds
  ────────────────────────────────────────────────────────────────────── */
  function update(dt) {
    if (!_inited) return;
    dt = dt || 0.016;

    _intelAgeClock += dt;

    var pp = _getPlayerPos();
    var enemies = _getEnemies();
    var i, a, ei, en, enPos, distToPlayer;

    /* ── CI sweep timer ── */
    if (!_networkBlown) {
      if (_ciActive) {
        _ciRemain -= dt;
        if (_ciRemain <= 0) {
          _ciActive = false;
          _ciTargetIdx = -1;
          _toast('CI sweep ended.', '#00ffaa', 2000);
        }
      } else {
        _ciTimer -= dt;
        if (_ciTimer <= 0) {
          _ciTimer = CI_SWEEP_INTERVAL;
          _startCISweep();
        }
      }
    }

    /* ── Per-asset updates ── */
    for (i = 0; i < _assets.length; i++) {
      a = _assets[i];
      if (a.status === 'EXTRACTED') continue;

      distToPlayer = _dist2D(pp.x, pp.z, a.pos.x, a.pos.z);

      /* Contact check */
      if (!a.contacted && a.status === 'ACTIVE' && distToPlayer < CONTACT_RADIUS) {
        a.contacted = true;
        a.contactGlowTimer = CONTACT_GLOW_DUR / 1000;
        a.light.intensity = 1.5;
        _toast('CONTACT MADE — ' + a.type, '#00ffcc', 3000);
        _addIntelLog(a.type, 'Initial contact established with handler.');
      }

      /* Contact glow fade */
      if (a.contactGlowTimer > 0) {
        a.contactGlowTimer -= dt;
        a.light.intensity = Math.max(0, (a.contactGlowTimer / (CONTACT_GLOW_DUR / 1000)) * 1.5);
      }

      /* Intel timer */
      if (a.status === 'ACTIVE' && a.contacted) {
        a.intelTimer -= dt;
        if (a.intelTimer <= 0) {
          _generateIntel(a);
        }
      }

      /* Dead drop timer */
      if (a.deadDrop) {
        a.deadDrop.timer -= dt;
        if (a.deadDrop.timer <= 0) {
          _scene.remove(a.deadDrop.mesh);
          _scene.remove(a.deadDrop.coverMesh);
          a.deadDrop = null;
          _deliverIntelPackage(i);
        }
      }

      /* Intel reveal timer */
      if (a.intelRevealing) {
        a.revealTimer -= dt;
        if (a.revealTimer <= 0) {
          a.intelRevealing = false;
        }
      }

      /* BURNED check: enemy within BURN_RADIUS */
      if (a.status === 'ACTIVE') {
        for (ei = 0; ei < enemies.length; ei++) {
          en = enemies[ei];
          enPos = (en.mesh && en.mesh.position) ? en.mesh.position : (en.position || null);
          if (!enPos) continue;
          if (_dist2D(enPos.x, enPos.z, a.pos.x, a.pos.z) < BURN_RADIUS) {
            _burnAsset(i);
            break;
          }
        }
      }

      /* D key — place dead drop (rising edge) */
      if (_keyD && !_keyDPrev && a.status === 'ACTIVE' &&
          a.contacted && distToPlayer < DEAD_DROP_RANGE) {
        _placeDeadDrop(i);
      }

      /* E key — extract (rising edge) */
      if (_keyE && !_keyEPrev && a.status === 'ACTIVE' &&
          a.contacted && distToPlayer < EXTRACT_RANGE) {
        _extractAsset(i);
      }

      /* CI sweep — move patrol toward asset */
      if (_ciActive && _ciTargetIdx === i && a.status === 'ACTIVE') {
        if (enemies.length > 0) {
          var ciEnemy = enemies[0];
          var cePos = (ciEnemy.mesh && ciEnemy.mesh.position) ?
                      ciEnemy.mesh.position : ciEnemy.position;
          if (cePos) {
            var toDx = a.pos.x - cePos.x;
            var toDz = a.pos.z - cePos.z;
            var toDLen = Math.sqrt(toDx * toDx + toDz * toDz);
            if (toDLen > 1) {
              cePos.x += (toDx / toDLen) * dt * 3;
              cePos.z += (toDz / toDLen) * dt * 3;
            }
          }
        }
      }

      /* COURIER movement between waypoints */
      if (a.type === 'COURIER' && a.status === 'ACTIVE' && a.waypointA && a.waypointB) {
        var target = (a.waypointDir === 1) ? a.waypointB : a.waypointA;
        var dx2 = target.x - a.pos.x;
        var dz2 = target.z - a.pos.z;
        var d2  = Math.sqrt(dx2 * dx2 + dz2 * dz2);
        if (d2 < 0.5) {
          a.waypointDir *= -1;
        } else {
          var speed = 2.0;
          a.pos.x += (dx2 / d2) * speed * dt;
          a.pos.z += (dz2 / d2) * speed * dt;
          a.group.position.set(a.pos.x, 0, a.pos.z);
          a.light.position.set(a.pos.x, 1.5, a.pos.z);
        }
      }
    }

    /* ── D/E key rising-edge tracking ── */
    _keyDPrev = _keyD;
    _keyEPrev = _keyE;

    /* ── Reveal marker timers ── */
    var ri, rm, rmEnemy, rmPos;
    for (ri = _revealMarkers.length - 1; ri >= 0; ri--) {
      rm = _revealMarkers[ri];
      rm.timer -= dt;
      rmEnemy = rm.enemy;
      rmPos = (rmEnemy && rmEnemy.mesh && rmEnemy.mesh.position) ?
              rmEnemy.mesh.position :
              (rmEnemy && rmEnemy.position ? rmEnemy.position : null);
      if (rmPos) {
        rm.mesh.position.set(rmPos.x, rmPos.y + 2.5, rmPos.z);
      }
      if (rm.timer <= 0) {
        if (rm.mesh.parent) _scene.remove(rm.mesh);
        _revealMarkers.splice(ri, 1);
      }
    }

    /* ── Network bonus check ── */
    _checkNetworkBonus();

    /* ── HUD update ── */
    _updateHUD();

    /* ── Panel update if open ── */
    if (_panelVisible) {
      _updatePanel();
    }
  }

  /* ──────────────────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────────────────── */
  function init(scene, camera, options) {
    if (_inited) return;
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;
    if (!_scene) { console.warn('IntelNetwork: no scene available'); return; }

    options = options || {};

    _buildPanel();
    _buildHUD();
    _spawnAssets();

    window.addEventListener('keydown', _onKeyDown, false);
    window.addEventListener('keyup',   _onKeyUp,   false);

    _inited = true;
    console.log('[IntelNetwork] Initialised with ' + _assets.length + ' assets.');
  }

  /* ──────────────────────────────────────────────────────────────────────
     RESET
  ────────────────────────────────────────────────────────────────────── */
  function reset() {
    var i;
    for (i = 0; i < _assets.length; i++) {
      var a = _assets[i];
      if (a.group && a.group.parent) _scene.remove(a.group);
      if (a.light && a.light.parent) _scene.remove(a.light);
      if (a.deadDrop) {
        if (a.deadDrop.mesh.parent) _scene.remove(a.deadDrop.mesh);
        if (a.deadDrop.coverMesh.parent) _scene.remove(a.deadDrop.coverMesh);
      }
    }
    for (i = 0; i < _revealMarkers.length; i++) {
      if (_revealMarkers[i].mesh.parent) _scene.remove(_revealMarkers[i].mesh);
    }

    if (_panel && _panel.parentNode) { _panel.parentNode.removeChild(_panel); _panel = null; }
    if (_hudEl && _hudEl.parentNode) { _hudEl.parentNode.removeChild(_hudEl); _hudEl = null; }

    window.removeEventListener('keydown', _onKeyDown, false);
    window.removeEventListener('keyup',   _onKeyUp,   false);

    _assets        = [];
    _intelLog      = [];
    _score         = 0;
    _threatLevel   = 0;
    _networkBonus  = false;
    _networkBlown  = false;
    _ciActive      = false;
    _ciTimer       = CI_SWEEP_INTERVAL;
    _ciRemain      = 0;
    _ciTargetIdx   = -1;
    _revealMarkers = [];
    _panelVisible  = false;
    _activeTab     = 'ASSETS';
    _keyI          = false;
    _keyN          = false;
    _keyD          = false;
    _keyE          = false;
    _keyDPrev      = false;
    _keyEPrev      = false;
    _intelAgeClock = 0;
    _canvas        = null;
    _ctx           = null;
    _inited        = false;
    console.log('[IntelNetwork] Reset.');
  }

  /* ──────────────────────────────────────────────────────────────────────
     PUBLIC API
  ────────────────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
