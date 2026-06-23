// cyber-warfare.js — Cyber Warfare / System Hacking module for Three.js FPS
// Features: hackable objects (guard towers, turrets, cameras, vehicles),
//           scan mode (Alt), hack minigame (5x5 bit grid), hack effects per type,
//           firewall (2-round), counter-hack, data exfil terminal, virus payload.
// IIFE module — var only, no import/export.

window.CyberWarfare = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var SCAN_RANGE          = 15;      // units — cyan outline + label visibility
  var HACK_RANGE          = 3;       // units — must be within to start hack
  var GRID_SIZE           = 5;       // 5×5 bit grid
  var HACK_TIME_LIMIT     = 10;      // seconds per minigame round
  var GUARD_CONFUSED_TIME = 20;      // seconds guards wander after tower hack
  var TURRET_FRIENDLY_TIME = 30;     // seconds turret targets enemies
  var CAMERA_BLIND_TIME   = 999;     // persistent (camera zone awareness -50%)
  var VEHICLE_CIRCLE_TIME = 15;      // seconds vehicle drives in circles
  var EXFIL_DURATION      = 8;       // seconds to hold hack on command terminal
  var EXFIL_SCORE         = 300;     // points awarded for successful data exfil
  var COUNTER_HACK_DELAY  = 30;      // seconds for enemy counter-hack
  var VIRUS_PAYLOAD_SLOTS = 3;       // max simultaneous virus infections

  // Object type identifiers
  var TYPE_GUARD_TOWER = 'GUARD_TOWER';
  var TYPE_TURRET      = 'TURRET';
  var TYPE_CAMERA      = 'CAMERA';
  var TYPE_VEHICLE     = 'VEHICLE';
  var TYPE_TERMINAL    = 'COMMAND_TERMINAL';

  // ── State ────────────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _raycaster    = null;
  var _hackables    = [];      // { mesh, type, hacked, firewalled, hackRound, outlineMesh, iconMesh, label, counterHackTimer }
  var _scanActive   = false;
  var _hudRoot      = null;
  var _scanOverlay  = null;
  var _scanHUD      = null;
  var _minigameRoot = null;
  var _minigameActive = false;
  var _minigameTarget = null;  // hackable entry
  var _minigameGrid   = [];    // flat array of 25 values (0/1)
  var _minigameGoal   = [];    // target pattern
  var _minigameCursorX = 0;
  var _minigameCursorY = 0;
  var _minigameTimer  = 0;
  var _minigameRound  = 0;     // 0 or 1 (for firewalled objects, 2 rounds needed)
  var _exfilTarget    = null;  // terminal being exfiltrated
  var _exfilTimer     = 0;
  var _virusPayloadActive = false;
  var _virusTargets   = [];    // up to VIRUS_PAYLOAD_SLOTS meshes infected simultaneously
  var _playerExposed  = false; // set externally to trigger counter-hacks
  var _keysDown       = {};
  var _prevKeys       = {};

  // ── Helper: random bit grid ───────────────────────────────────────────────────
  function _randomGrid() {
    var g = [];
    var i;
    for (i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      g.push(Math.random() < 0.5 ? 0 : 1);
    }
    return g;
  }

  // Generate a goal that differs from current grid by ~5 bits
  function _generateGoal(current) {
    var goal = current.slice();
    var flips = 4 + Math.floor(Math.random() * 4); // 4-7 bits different
    var i, idx;
    for (i = 0; i < flips; i++) {
      idx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
      goal[idx] = goal[idx] === 0 ? 1 : 0;
    }
    return goal;
  }

  function _gridsMatch(a, b) {
    var i;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // ── HUD Construction ─────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudRoot = document.createElement('div');
    _hudRoot.id = 'cw-hud-root';
    _hudRoot.style.cssText = [
      'position:fixed',
      'top:0','left:0','width:100%','height:100%',
      'pointer-events:none',
      'z-index:900',
      'font-family:monospace'
    ].join(';');
    document.body.appendChild(_hudRoot);

    // Scan overlay — subtle desaturate + cyan tint
    _scanOverlay = document.createElement('div');
    _scanOverlay.style.cssText = [
      'position:absolute','top:0','left:0','width:100%','height:100%',
      'background:rgba(0,255,220,0.06)',
      'filter:saturate(0.45)',
      'display:none',
      'pointer-events:none'
    ].join(';');
    _hudRoot.appendChild(_scanOverlay);

    // Scan HUD bar (top-right)
    _scanHUD = document.createElement('div');
    _scanHUD.style.cssText = [
      'position:absolute','top:12px','right:16px',
      'color:#00ffcc',
      'font-size:13px',
      'letter-spacing:2px',
      'text-shadow:0 0 8px #00ffcc',
      'display:none',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 14px',
      'border:1px solid #00ffcc55',
      'border-radius:4px'
    ].join(';');
    _hudRoot.appendChild(_scanHUD);
  }

  // ── Minigame UI ──────────────────────────────────────────────────────────────
  function _buildMinigameUI() {
    _minigameRoot = document.createElement('div');
    _minigameRoot.id = 'cw-minigame';
    _minigameRoot.style.cssText = [
      'position:fixed','top:50%','left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,8,20,0.95)',
      'border:2px solid #00ffcc',
      'border-radius:8px',
      'padding:20px 28px',
      'z-index:1100',
      'color:#00ffcc',
      'font-family:monospace',
      'min-width:420px',
      'box-shadow:0 0 30px #00ffcc55',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_minigameRoot);
  }

  function _renderMinigame() {
    if (!_minigameRoot || !_minigameTarget) return;
    var t = _minigameTarget;
    var label = t.type;
    var firewallNote = t.firewalled ? ' [FIREWALL — ROUND ' + (_minigameRound + 1) + '/2]' : '';
    var timerColor = _minigameTimer < 3 ? '#ff4444' : '#00ffcc';

    var html = '<div style="text-align:center;margin-bottom:12px;">';
    html += '<span style="font-size:16px;letter-spacing:3px;">HACK: ' + label + firewallNote + '</span>';
    html += '</div>';
    html += '<div style="text-align:center;margin-bottom:8px;color:' + timerColor + ';">';
    html += 'TIME: ' + Math.ceil(_minigameTimer) + 's';
    html += '</div>';
    html += '<div style="display:flex;gap:24px;justify-content:center;">';

    // Current grid (player edits this)
    html += '<div>';
    html += '<div style="font-size:11px;margin-bottom:6px;text-align:center;color:#aaffcc;">YOUR MATRIX</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(' + GRID_SIZE + ',28px);gap:4px;">';
    var r, c, idx, isGoal, isCursor, cellBg, cellBorder, cellColor;
    for (r = 0; r < GRID_SIZE; r++) {
      for (c = 0; c < GRID_SIZE; c++) {
        idx = r * GRID_SIZE + c;
        isCursor = (r === _minigameCursorY && c === _minigameCursorX);
        isGoal   = (_minigameGrid[idx] === _minigameGoal[idx]);
        cellBg     = isCursor ? '#00ffcc' : (isGoal ? 'rgba(0,200,80,0.3)' : 'rgba(0,20,40,0.8)');
        cellBorder = isCursor ? '#ffffff' : (isGoal ? '#00cc44' : '#00ffcc55');
        cellColor  = isCursor ? '#000' : (isGoal ? '#00ff88' : '#00ffcc');
        html += '<div style="';
        html += 'width:28px;height:28px;display:flex;align-items:center;justify-content:center;';
        html += 'background:' + cellBg + ';';
        html += 'border:1px solid ' + cellBorder + ';';
        html += 'color:' + cellColor + ';';
        html += 'font-size:14px;font-weight:bold;cursor:default;';
        html += '">' + _minigameGrid[idx] + '</div>';
      }
    }
    html += '</div></div>';

    // Target pattern
    html += '<div>';
    html += '<div style="font-size:11px;margin-bottom:6px;text-align:center;color:#aaffcc;">TARGET PATTERN</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(' + GRID_SIZE + ',28px);gap:4px;">';
    for (r = 0; r < GRID_SIZE; r++) {
      for (c = 0; c < GRID_SIZE; c++) {
        idx = r * GRID_SIZE + c;
        html += '<div style="';
        html += 'width:28px;height:28px;display:flex;align-items:center;justify-content:center;';
        html += 'background:rgba(0,20,40,0.6);border:1px solid #005544;';
        html += 'color:#66ffaa;font-size:14px;';
        html += '">' + _minigameGoal[idx] + '</div>';
      }
    }
    html += '</div></div>';

    html += '</div>'; // flex row end

    html += '<div style="text-align:center;margin-top:14px;font-size:11px;color:#55aacc;">';
    html += 'ARROWS: move cursor  |  ENTER: flip bit  |  ESC: abort';
    html += '</div>';

    _minigameRoot.innerHTML = html;
  }

  function _removeMinigameUI() {
    if (_minigameRoot && _minigameRoot.parentNode) {
      _minigameRoot.parentNode.removeChild(_minigameRoot);
      _minigameRoot = null;
    }
  }

  // ── Outline helper (cyan EdgesGeometry) ──────────────────────────────────────
  function _createOutline(mesh) {
    var edges = new THREE.EdgesGeometry(mesh.geometry);
    var mat   = new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 });
    var outline = new THREE.LineSegments(edges, mat);
    outline.visible = false;
    mesh.add(outline);
    return outline;
  }

  // ── Icon sprite above hacked object ──────────────────────────────────────────
  function _createHackIcon(mesh) {
    var canvas = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✔', 32, 32);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.8, 0.8, 0.8);
    var box = new THREE.Box3().setFromObject(mesh);
    sprite.position.set(0, (box.max.y - box.min.y) * 0.5 + 0.9, 0);
    sprite.visible = false;
    mesh.add(sprite);
    return sprite;
  }

  // ── Label sprite (object info, shown in scan mode) ───────────────────────────
  function _createLabel(mesh, type) {
    var canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,255,204,0.15)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 254, 62);
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[' + type + ']', 128, 32);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.5, 0.65, 1);
    var box = new THREE.Box3().setFromObject(mesh);
    sprite.position.set(0, (box.max.y - box.min.y) * 0.5 + 1.8, 0);
    sprite.visible = false;
    mesh.add(sprite);
    return sprite;
  }

  // ── Register a hackable object ────────────────────────────────────────────────
  function _registerHackable(mesh, type, firewalled) {
    var entry = {
      mesh:             mesh,
      type:             type,
      hacked:           false,
      firewalled:       firewalled || false,
      hackRound:        0,
      outlineMesh:      _createOutline(mesh),
      iconMesh:         _createHackIcon(mesh),
      label:            _createLabel(mesh, type),
      counterHackTimer: 0,
      effectTimer:      0
    };
    _hackables.push(entry);
    return entry;
  }

  // ── Apply hack effect for object type ────────────────────────────────────────
  function _applyHackEffect(entry) {
    entry.hacked = true;
    entry.hackRound = 0;
    entry.iconMesh.visible = true;

    // Change outline to green
    entry.outlineMesh.material.color.setHex(0x00ff44);

    switch (entry.type) {
      case TYPE_GUARD_TOWER:
        entry.effectTimer = GUARD_CONFUSED_TIME;
        if (window._guardsConfused !== undefined) {
          window._guardsConfused = true;
        }
        _showHackFeedback('GUARD TOWER HACKED — GUARDS CONFUSED FOR 20s');
        break;

      case TYPE_TURRET:
        entry.effectTimer = TURRET_FRIENDLY_TIME;
        if (entry.mesh._turretFriendlyMode !== undefined) {
          entry.mesh._turretFriendlyMode = true;
        }
        // Expose for external turret systems
        entry.mesh._cyberFriendly = true;
        _showHackFeedback('TURRET HACKED — FRIENDLY FIRE MODE ACTIVE');
        break;

      case TYPE_CAMERA:
        entry.effectTimer = CAMERA_BLIND_TIME;
        entry.mesh._cyberBlind = true;
        if (window._cameraAwarenessMultiplier !== undefined) {
          window._cameraAwarenessMultiplier = 0.5;
        }
        _showHackFeedback('CAMERA DISABLED — ZONE AWARENESS -50%');
        break;

      case TYPE_VEHICLE:
        entry.effectTimer = VEHICLE_CIRCLE_TIME;
        entry.mesh._cyberCircling = true;
        _showHackFeedback('VEHICLE HACKED — DRIVES IN CIRCLES');
        break;

      case TYPE_TERMINAL:
        // Handled via exfil flow; mark hacked for scoring
        entry.effectTimer = 0;
        _showHackFeedback('TERMINAL ACCESSED — DATA EXFILTRATION COMPLETE  +' + EXFIL_SCORE);
        if (window._score !== undefined) {
          window._score += EXFIL_SCORE;
        }
        break;
    }
  }

  // ── Feedback flash ────────────────────────────────────────────────────────────
  function _showHackFeedback(msg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed','bottom:22%','left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,8,20,0.88)',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:14px',
      'letter-spacing:2px',
      'padding:8px 20px',
      'border:1px solid #00ffcc',
      'border-radius:4px',
      'z-index:1200',
      'pointer-events:none',
      'transition:opacity 1s'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 2200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3300);
  }

  function _showAlarm() {
    _showHackFeedback('!! HACK FAILED — ALARM TRIGGERED !!');
    if (window._triggerAlarm) window._triggerAlarm();
    if (window._alertLevel !== undefined) window._alertLevel = Math.min((window._alertLevel || 0) + 1, 5);
  }

  // ── Start minigame ────────────────────────────────────────────────────────────
  function _startMinigame(entry) {
    _minigameActive  = true;
    _minigameTarget  = entry;
    _minigameGrid    = _randomGrid();
    _minigameGoal    = _generateGoal(_minigameGrid);
    _minigameCursorX = 0;
    _minigameCursorY = 0;
    _minigameTimer   = HACK_TIME_LIMIT;
    _buildMinigameUI();
    _renderMinigame();

    // Lock pointer for keypress capture (blur game controls)
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function _endMinigame(success) {
    _minigameActive = false;
    _removeMinigameUI();

    if (!_minigameTarget) return;
    var entry = _minigameTarget;
    _minigameTarget = null;

    if (!success) {
      _showAlarm();
      entry.hackRound = 0;
      return;
    }

    // Firewall needs two successful rounds
    if (entry.firewalled && _minigameRound === 0) {
      _minigameRound = 1;
      // Brief pause then second round
      setTimeout(function () {
        _showHackFeedback('FIREWALL LAYER 1 BREACHED — ATTEMPTING LAYER 2...');
        _startMinigame(entry);
        _minigameRound = 1; // restore after startMinigame resets
      }, 800);
      return;
    }

    // Virus payload: infect multiple objects simultaneously
    if (_virusPayloadActive && _virusTargets.length > 0) {
      _applyHackEffect(entry);
      var vi, vEntry;
      for (vi = 0; vi < _virusTargets.length && vi < VIRUS_PAYLOAD_SLOTS - 1; vi++) {
        vEntry = _getEntryByMesh(_virusTargets[vi]);
        if (vEntry && !vEntry.hacked) _applyHackEffect(vEntry);
      }
      _virusPayloadActive = false;
      _virusTargets = [];
      _showHackFeedback('VIRUS PAYLOAD DEPLOYED — ' + (vi + 1) + ' SYSTEMS INFECTED');
      return;
    }

    _applyHackEffect(entry);
  }

  // ── Exfil (command terminal hold-hack) ────────────────────────────────────────
  function _startExfil(entry) {
    _exfilTarget = entry;
    _exfilTimer  = 0;
    _showHackFeedback('DATA EXFILTRATION INITIATED — HOLD H FOR 8s...');
  }

  function _cancelExfil() {
    if (_exfilTarget) {
      _exfilTarget = null;
      _exfilTimer  = 0;
      _showHackFeedback('EXFILTRATION ABORTED');
    }
  }

  // ── Counter-hack tick ─────────────────────────────────────────────────────────
  function _tickCounterHack(delta) {
    var i, entry;
    if (!_playerExposed) return;
    for (i = 0; i < _hackables.length; i++) {
      entry = _hackables[i];
      if (!entry.hacked) continue;
      entry.counterHackTimer += delta;
      if (entry.counterHackTimer >= COUNTER_HACK_DELAY) {
        entry.hacked = false;
        entry.counterHackTimer = 0;
        entry.iconMesh.visible = false;
        entry.outlineMesh.material.color.setHex(0x00ffcc);
        // Restore
        if (entry.type === TYPE_TURRET) entry.mesh._cyberFriendly = false;
        if (entry.type === TYPE_CAMERA) entry.mesh._cyberBlind = false;
        if (entry.type === TYPE_VEHICLE) entry.mesh._cyberCircling = false;
        _showHackFeedback('COUNTER-HACK: ' + entry.type + ' RESTORED BY ENEMY');
      }
    }
  }

  // ── Scan HUD update ───────────────────────────────────────────────────────────
  function _updateScanHUD() {
    var total  = _hackables.length;
    var hacked = 0;
    var i;
    for (i = 0; i < _hackables.length; i++) {
      if (_hackables[i].hacked) hacked++;
    }
    if (_scanHUD) {
      _scanHUD.textContent = 'NETWORKED DEVICES: ' + total + '  |  HACKED: ' + hacked + '/' + total;
    }
  }

  // ── Raycaster scan ───────────────────────────────────────────────────────────
  function _updateScan() {
    if (!_camera || !_raycaster) return;
    var i, entry, dist, meshes, hits;
    meshes = [];
    for (i = 0; i < _hackables.length; i++) {
      meshes.push(_hackables[i].mesh);
    }
    // Distance-based proximity reveal (not pure raycaster so objects behind walls still
    // show in scan — intentional "network scan" feel; outline only within 15 units)
    for (i = 0; i < _hackables.length; i++) {
      entry = _hackables[i];
      if (!entry.mesh.parent) continue;
      var worldPos = new THREE.Vector3();
      entry.mesh.getWorldPosition(worldPos);
      dist = _camera.position.distanceTo(worldPos);
      var inRange = dist <= SCAN_RANGE;
      entry.outlineMesh.visible = inRange || entry.hacked;
      entry.label.visible       = inRange && _scanActive;
    }
  }

  // ── Key helpers ───────────────────────────────────────────────────────────────
  function _keyDown(e) { _keysDown[e.code] = true; }
  function _keyUp(e)   { _keysDown[e.code] = false; }

  function _justPressed(code) {
    return _keysDown[code] && !_prevKeys[code];
  }

  // ── Nearest hackable in range ─────────────────────────────────────────────────
  function _nearestHackable(range) {
    var best = null;
    var bestDist = Infinity;
    var i, entry, pos, dist;
    for (i = 0; i < _hackables.length; i++) {
      entry = _hackables[i];
      if (!entry.mesh.parent) continue;
      pos = new THREE.Vector3();
      entry.mesh.getWorldPosition(pos);
      dist = _camera.position.distanceTo(pos);
      if (dist <= range && dist < bestDist) {
        bestDist = dist;
        best = entry;
      }
    }
    return best;
  }

  function _getEntryByMesh(mesh) {
    var i;
    for (i = 0; i < _hackables.length; i++) {
      if (_hackables[i].mesh === mesh) return _hackables[i];
    }
    return null;
  }

  // ── Bind keyboard events ──────────────────────────────────────────────────────
  function _bindKeys() {
    document.addEventListener('keydown', _keyDown);
    document.addEventListener('keyup',   _keyUp);
    document.addEventListener('keydown', _onKeyDownAction);
  }

  function _onKeyDownAction(e) {
    // Minigame controls
    if (_minigameActive) {
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          _minigameCursorX = (_minigameCursorX - 1 + GRID_SIZE) % GRID_SIZE;
          _renderMinigame();
          break;
        case 'ArrowRight':
          e.preventDefault();
          _minigameCursorX = (_minigameCursorX + 1) % GRID_SIZE;
          _renderMinigame();
          break;
        case 'ArrowUp':
          e.preventDefault();
          _minigameCursorY = (_minigameCursorY - 1 + GRID_SIZE) % GRID_SIZE;
          _renderMinigame();
          break;
        case 'ArrowDown':
          e.preventDefault();
          _minigameCursorY = (_minigameCursorY + 1) % GRID_SIZE;
          _renderMinigame();
          break;
        case 'Enter':
          e.preventDefault();
          var idx2 = _minigameCursorY * GRID_SIZE + _minigameCursorX;
          _minigameGrid[idx2] = _minigameGrid[idx2] === 0 ? 1 : 0;
          if (_gridsMatch(_minigameGrid, _minigameGoal)) {
            _endMinigame(true);
          } else {
            _renderMinigame();
          }
          break;
        case 'Escape':
          _endMinigame(false);
          break;
      }
      return;
    }

    // Scan mode toggle (AltLeft / AltRight)
    if (e.code === 'AltLeft' || e.code === 'AltRight') {
      e.preventDefault();
    }

    // H key — initiate hack
    if (e.code === 'KeyH' && !_minigameActive) {
      var nearest = _nearestHackable(HACK_RANGE);
      if (nearest && !nearest.hacked) {
        if (nearest.type === TYPE_TERMINAL) {
          if (!_exfilTarget) _startExfil(nearest);
        } else {
          _minigameRound = 0;
          _startMinigame(nearest);
        }
      }
    }
  }

  // ── Public: hackObject (external call) ───────────────────────────────────────
  function hackObject(mesh) {
    var entry = _getEntryByMesh(mesh);
    if (!entry) return false;
    if (entry.hacked) return false;
    _minigameRound = 0;
    _startMinigame(entry);
    return true;
  }

  // ── Public: getScanResults ────────────────────────────────────────────────────
  function getScanResults() {
    var results = [];
    var i, entry, pos;
    for (i = 0; i < _hackables.length; i++) {
      entry = _hackables[i];
      pos = new THREE.Vector3();
      if (entry.mesh.parent) entry.mesh.getWorldPosition(pos);
      results.push({
        mesh:       entry.mesh,
        type:       entry.type,
        hacked:     entry.hacked,
        firewalled: entry.firewalled,
        position:   pos.clone()
      });
    }
    return results;
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene     = scene;
    _camera    = camera;
    _raycaster = new THREE.Raycaster();
    _hackables = [];
    _keysDown  = {};
    _prevKeys  = {};
    _scanActive        = false;
    _minigameActive    = false;
    _minigameTarget    = null;
    _exfilTarget       = null;
    _exfilTimer        = 0;
    _virusPayloadActive = false;
    _virusTargets      = [];
    _playerExposed     = false;

    _buildHUD();
    _bindKeys();

    // Spawn default hackable objects in the scene (demo objects — integrate
    // with your world-builder by calling _registerHackable directly)
    _spawnDefaultHackables();
  }

  // ── Default demo hackables ────────────────────────────────────────────────────
  function _spawnDefaultHackables() {
    var positions = [
      { type: TYPE_GUARD_TOWER, x:  12, y: 0, z: -20, fw: false },
      { type: TYPE_GUARD_TOWER, x: -15, y: 0, z: -18, fw: false },
      { type: TYPE_TURRET,      x:   8, y: 0, z:  -8, fw: false },
      { type: TYPE_TURRET,      x: -10, y: 0, z: -12, fw: true  },
      { type: TYPE_CAMERA,      x:   0, y: 3, z: -15, fw: false },
      { type: TYPE_VEHICLE,     x:  20, y: 0, z:   5, fw: false },
      { type: TYPE_TERMINAL,    x:  -5, y: 0, z: -25, fw: true  }
    ];

    var i, cfg, geo, mat, mesh, color;
    for (i = 0; i < positions.length; i++) {
      cfg = positions[i];
      switch (cfg.type) {
        case TYPE_GUARD_TOWER:
          geo   = new THREE.BoxGeometry(2, 5, 2);
          color = 0x446688;
          break;
        case TYPE_TURRET:
          geo   = new THREE.CylinderGeometry(0.5, 0.8, 1.5, 8);
          color = 0x884422;
          break;
        case TYPE_CAMERA:
          geo   = new THREE.BoxGeometry(0.4, 0.4, 0.8);
          color = 0x222222;
          break;
        case TYPE_VEHICLE:
          geo   = new THREE.BoxGeometry(3, 1.5, 5);
          color = 0x556644;
          break;
        case TYPE_TERMINAL:
          geo   = new THREE.BoxGeometry(1.2, 2, 0.4);
          color = 0x0a1a2a;
          break;
        default:
          geo   = new THREE.BoxGeometry(1, 1, 1);
          color = 0x888888;
      }
      mat  = new THREE.MeshLambertMaterial({ color: color });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.x, cfg.y + (cfg.type === TYPE_CAMERA ? 0 : (cfg.type === TYPE_TURRET ? 0.75 : 0)), cfg.z);
      _scene.add(mesh);
      _registerHackable(mesh, cfg.type, cfg.fw);
    }
  }

  // ── Update (call every frame) ─────────────────────────────────────────────────
  function update(delta) {
    if (!_scene || !_camera) return;

    // Scan mode — Alt held
    var altHeld = _keysDown['AltLeft'] || _keysDown['AltRight'];
    if (altHeld !== _scanActive) {
      _scanActive = altHeld;
      if (_scanOverlay) _scanOverlay.style.display = _scanActive ? 'block' : 'none';
      if (_scanHUD)     _scanHUD.style.display     = _scanActive ? 'block' : 'none';
    }

    // Update scan outlines / labels
    _updateScan();

    // Update scan HUD counts
    if (_scanActive) _updateScanHUD();

    // Minigame timer
    if (_minigameActive) {
      _minigameTimer -= delta;
      _renderMinigame();
      if (_minigameTimer <= 0) {
        _endMinigame(false);
      }
    }

    // Exfil (command terminal hold)
    if (_exfilTarget) {
      var hKey = _keysDown['KeyH'];
      var nearTerm = _nearestHackable(HACK_RANGE);
      if (hKey && nearTerm && nearTerm === _exfilTarget) {
        _exfilTimer += delta;
        // Show progress bar
        _showExfilProgress(_exfilTimer / EXFIL_DURATION);
        if (_exfilTimer >= EXFIL_DURATION) {
          _applyHackEffect(_exfilTarget);
          _exfilTarget = null;
          _exfilTimer  = 0;
        }
      } else {
        _cancelExfil();
      }
    }

    // Hack effect timers
    var i, entry;
    for (i = 0; i < _hackables.length; i++) {
      entry = _hackables[i];
      if (entry.hacked && entry.effectTimer > 0) {
        entry.effectTimer -= delta;
        if (entry.effectTimer <= 0) {
          // Effect expired — restore object
          entry.effectTimer = 0;
          if (entry.type === TYPE_TURRET)  entry.mesh._cyberFriendly  = false;
          if (entry.type === TYPE_VEHICLE) entry.mesh._cyberCircling   = false;
          if (entry.type === TYPE_VEHICLE) {
            _showHackFeedback('VEHICLE HACK EXPIRED — DRIVING NORMALLY');
          }
          // Guards un-confuse
          if (entry.type === TYPE_GUARD_TOWER && window._guardsConfused !== undefined) {
            window._guardsConfused = false;
          }
        }
      }

      // Animate vehicle circling via rotation hint
      if (entry.hacked && entry.type === TYPE_VEHICLE && entry.effectTimer > 0) {
        entry.mesh.rotation.y += delta * 0.8;
        entry.mesh.position.x += Math.cos(entry.mesh.rotation.y) * delta * 1.5;
        entry.mesh.position.z += Math.sin(entry.mesh.rotation.y) * delta * 1.5;
      }
    }

    // Counter-hack tick
    _tickCounterHack(delta);

    // Copy keysDown to prevKeys
    var k;
    for (k in _keysDown) {
      if (Object.prototype.hasOwnProperty.call(_keysDown, k)) {
        _prevKeys[k] = _keysDown[k];
      }
    }

    // Sync player-exposed flag from global state
    if (window._playerExposed !== undefined) {
      _playerExposed = window._playerExposed;
    }
  }

  // ── Exfil progress bar ────────────────────────────────────────────────────────
  var _exfilBarEl = null;

  function _showExfilProgress(pct) {
    if (!_exfilBarEl) {
      _exfilBarEl = document.createElement('div');
      _exfilBarEl.style.cssText = [
        'position:fixed','bottom:18%','left:50%',
        'transform:translateX(-50%)',
        'width:260px',
        'background:rgba(0,8,20,0.9)',
        'border:1px solid #00ffcc',
        'border-radius:4px',
        'padding:8px 14px',
        'z-index:1150',
        'pointer-events:none',
        'font-family:monospace',
        'color:#00ffcc',
        'font-size:12px'
      ].join(';');
      document.body.appendChild(_exfilBarEl);
    }
    var filled = Math.round(pct * 24);
    var bar = '[' + '█'.repeat(filled) + '░'.repeat(24 - filled) + ']';
    _exfilBarEl.innerHTML = 'DATA EXFIL: ' + bar + ' ' + Math.round(pct * 100) + '%';
    if (pct >= 1 && _exfilBarEl.parentNode) {
      _exfilBarEl.parentNode.removeChild(_exfilBarEl);
      _exfilBarEl = null;
    }
  }

  // ── Virus Payload (crafted at WeaponWorkshop) ─────────────────────────────────
  function activateVirusPayload(additionalTargetMeshes) {
    _virusPayloadActive = true;
    _virusTargets = additionalTargetMeshes || [];
    _showHackFeedback('VIRUS PAYLOAD LOADED — NEXT HACK INFECTS ' +
      Math.min(_virusTargets.length + 1, VIRUS_PAYLOAD_SLOTS) + ' SYSTEMS');
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    // Remove all hackable meshes and their children from scene
    var i, entry;
    for (i = 0; i < _hackables.length; i++) {
      entry = _hackables[i];
      if (entry.mesh && entry.mesh.parent) {
        entry.mesh.parent.remove(entry.mesh);
      }
    }
    _hackables = [];

    // End minigame if open
    if (_minigameActive) _endMinigame(false);

    // Remove HUD
    if (_hudRoot && _hudRoot.parentNode) {
      _hudRoot.parentNode.removeChild(_hudRoot);
      _hudRoot = null;
    }
    if (_exfilBarEl && _exfilBarEl.parentNode) {
      _exfilBarEl.parentNode.removeChild(_exfilBarEl);
      _exfilBarEl = null;
    }

    _scanActive         = false;
    _exfilTarget        = null;
    _exfilTimer         = 0;
    _virusPayloadActive = false;
    _virusTargets       = [];
    _playerExposed      = false;

    // Remove key listeners
    document.removeEventListener('keydown', _keyDown);
    document.removeEventListener('keyup',   _keyUp);
    document.removeEventListener('keydown', _onKeyDownAction);
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    init:                 init,
    update:               update,
    hackObject:           hackObject,
    getScanResults:       getScanResults,
    reset:                reset,
    registerHackable:     _registerHackable,
    activateVirusPayload: activateVirusPayload,
    setPlayerExposed:     function (v) { _playerExposed = v; }
  };

}());
