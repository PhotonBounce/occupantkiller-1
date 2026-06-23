// objective-tracker.js — Dynamic mission objective board, waypoint system, progress tracking.
// Full-screen Tab panel, HUD edge waypoint arrows, N-key navigation cycling.
// IIFE pattern, var only — no let/const.

window.ObjectiveTracker = (function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────
  var OBJ_TYPE = { PRIMARY: 'PRIMARY', SECONDARY: 'SECONDARY', BONUS: 'BONUS' };

  var STATUS = { PENDING: 'pending', ACTIVE: 'active', COMPLETE: 'complete', FAILED: 'failed' };

  var STATUS_COLOR = {
    pending:  '#888888',
    active:   '#FFFF00',
    complete: '#00FF88',
    failed:   '#FF4444'
  };

  var WAYPOINT_COLOR = {
    PRIMARY:   0xFFFF00,
    SECONDARY: 0x00FF88,
    BONUS:     0xFFAA00
  };

  var SCORE_REWARD = { PRIMARY: 500, SECONDARY: 200, BONUS: 100 };

  // Default level objectives keyed by level name fragment
  var LEVEL_OBJECTIVES = {
    KREMLIN: {
      primary:   ['Breach Kremlin Gate', 'Eliminate Guards', 'Reach Presidential Office'],
      secondary: ['Destroy Comms Array', 'Free Prisoners'],
      bonus:     ['No Civilian Casualties', 'Speed Run <5min', 'Headshot-Only']
    },
    DEFAULT: {
      primary:   ['Reach Primary Target', 'Secure the Area', 'Extract to LZ'],
      secondary: ['Collect Intel Documents', 'Destroy Enemy Equipment'],
      bonus:     ['No Casualties', 'Speed Clear', 'Stealth Only']
    }
  };

  // ─── State ──────────────────────────────────────────────────────────────────
  var _scene              = null;
  var _camera             = null;
  var _objectives         = [];   // array of objective objects
  var _nextId             = 0;
  var _navIndex           = -1;   // index into _objectives of currently navigated objective
  var _boardVisible       = false;
  var _boardEl            = null;
  var _hudProgressEl      = null;
  var _hudWaypointEl      = null;
  var _waypointGroup      = null;
  var _primaryRevealed    = 0;    // count of completed primaries (to unlock bonus)
  var _bonusRevealed      = false;
  var _stylesInjected     = false;
  var _audioCtx           = null;
  var _levelName          = '';
  var _totalScore         = 0;
  var _unlockMessageEl    = null;

  // ─── Audio helpers ───────────────────────────────────────────────────────────
  function _getAudio() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _beep(freq, type, duration, gain) {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function _playComplete() {
    var freqs = [523, 659, 784, 1047];
    for (var i = 0; i < freqs.length; i++) {
      (function (f, d) {
        setTimeout(function () { _beep(f, 'square', 0.2, 0.06); }, d);
      })(freqs[i], i * 120);
    }
  }

  function _playFail() {
    _beep(300, 'sawtooth', 0.5, 0.08);
    setTimeout(function () { _beep(180, 'sawtooth', 0.4, 0.06); }, 150);
  }

  function _playNav() {
    _beep(660, 'sine', 0.12, 0.05);
  }

  function _playBonusReveal() {
    _beep(880, 'sine', 0.15, 0.06);
    setTimeout(function () { _beep(1100, 'sine', 0.15, 0.05); }, 160);
    setTimeout(function () { _beep(1320, 'sine', 0.2, 0.06); }, 320);
  }

  // ─── CSS injection ───────────────────────────────────────────────────────────
  function _injectStyles() {
    if (_stylesInjected || document.getElementById('ot-style')) {
      _stylesInjected = true;
      return;
    }
    _stylesInjected = true;
    var st = document.createElement('style');
    st.id = 'ot-style';
    st.textContent = [
      '@keyframes otPulse {',
      '  0%,100% { opacity:1; transform:translateX(-50%) scaleY(1); }',
      '  50%     { opacity:0.5; transform:translateX(-50%) scaleY(1.2); }',
      '}',
      '@keyframes otWaypointPulse {',
      '  0%,100% { opacity:1; }',
      '  50%     { opacity:0.3; }',
      '}',
      '@keyframes otSlideIn {',
      '  from { opacity:0; transform:scale(0.96); }',
      '  to   { opacity:1; transform:scale(1); }',
      '}',
      '@keyframes otUnlock {',
      '  0%   { opacity:0; transform:translateX(-50%) translateY(-20px); }',
      '  20%  { opacity:1; transform:translateX(-50%) translateY(0); }',
      '  80%  { opacity:1; transform:translateX(-50%) translateY(0); }',
      '  100% { opacity:0; transform:translateX(-50%) translateY(-20px); }',
      '}',
      '#ot-board {',
      '  position:fixed; top:0; left:0; width:100%; height:100%;',
      '  background:rgba(0,0,0,0.82);',
      '  z-index:9000; display:none;',
      '  font-family:"Courier New",Courier,monospace;',
      '  animation:otSlideIn 0.2s ease both;',
      '  overflow-y:auto;',
      '}',
      '#ot-board-inner {',
      '  max-width:700px; margin:60px auto; padding:30px 40px;',
      '  border:1px solid rgba(255,200,0,0.3);',
      '  background:rgba(0,5,15,0.6);',
      '  box-shadow:0 0 40px rgba(255,200,0,0.08);',
      '}',
      '#ot-board h1 {',
      '  color:#FFCC00; font-size:22px; letter-spacing:6px;',
      '  text-align:center; margin:0 0 6px;',
      '  text-shadow:0 0 12px rgba(255,200,0,0.5);',
      '}',
      '#ot-board .ot-divider {',
      '  border:none; border-top:1px solid rgba(255,200,0,0.2);',
      '  margin:14px 0;',
      '}',
      '#ot-board .ot-section-title {',
      '  color:#888; font-size:10px; letter-spacing:4px;',
      '  margin:18px 0 8px; text-transform:uppercase;',
      '}',
      '#ot-board .ot-row {',
      '  display:flex; align-items:flex-start;',
      '  margin:7px 0; gap:10px;',
      '}',
      '#ot-board .ot-dot {',
      '  width:10px; height:10px; border-radius:50%;',
      '  flex-shrink:0; margin-top:3px;',
      '  box-shadow:0 0 6px currentColor;',
      '}',
      '#ot-board .ot-label {',
      '  color:#DDD; font-size:13px; flex:1;',
      '}',
      '#ot-board .ot-label.complete {',
      '  color:#00FF88; text-decoration:line-through; opacity:0.7;',
      '}',
      '#ot-board .ot-label.failed {',
      '  color:#FF4444; text-decoration:line-through; opacity:0.6;',
      '}',
      '#ot-board .ot-timer {',
      '  color:#FF8844; font-size:11px; flex-shrink:0;',
      '}',
      '#ot-board .ot-timer.urgent {',
      '  color:#FF2222; animation:otWaypointPulse 0.5s infinite;',
      '}',
      '#ot-board .ot-hidden-row {',
      '  color:#444; font-size:12px; letter-spacing:2px;',
      '  margin:7px 0 7px 20px; font-style:italic;',
      '}',
      '#ot-board .ot-idx {',
      '  color:#666; font-size:11px; flex-shrink:0; margin-top:2px; width:22px;',
      '}',
      '#ot-board .ot-close-hint {',
      '  text-align:center; color:#444; font-size:11px;',
      '  letter-spacing:2px; margin-top:24px;',
      '}',
      '#ot-hud-progress {',
      '  position:fixed; bottom:22px; right:22px;',
      '  font-family:"Courier New",Courier,monospace;',
      '  font-size:11px; color:#AAAAAA;',
      '  letter-spacing:1px;',
      '  z-index:4000; pointer-events:none;',
      '  text-shadow:0 1px 3px rgba(0,0,0,0.9);',
      '  line-height:1.6;',
      '}',
      '#ot-hud-waypoint {',
      '  position:fixed;',
      '  font-family:"Courier New",Courier,monospace;',
      '  font-size:12px; font-weight:bold; letter-spacing:1px;',
      '  z-index:4001; pointer-events:none;',
      '  background:rgba(0,0,0,0.55);',
      '  padding:3px 8px; border-radius:3px;',
      '  text-shadow:0 0 6px currentColor;',
      '  transform:translateX(-50%);',
      '  transition:color 0.2s;',
      '}',
      '#ot-unlock-msg {',
      '  position:fixed; top:35%; left:50%;',
      '  font-family:"Courier New",Courier,monospace;',
      '  font-size:15px; letter-spacing:3px; color:#FFAA00;',
      '  z-index:9100; pointer-events:none; white-space:nowrap;',
      '  text-shadow:0 0 16px #FFAA00;',
      '  animation:otUnlock 3.2s ease forwards;',
      '}',
    ].join('\n');
    document.head.appendChild(st);
  }

  // ─── Objective data helpers ──────────────────────────────────────────────────
  function _makeId() {
    _nextId++;
    return 'obj_' + _nextId;
  }

  function _getObjectiveLabel(obj) {
    if (obj.type === OBJ_TYPE.PRIMARY) {
      var idx = _getTypeIndex(obj) + 1;
      return idx + '. ' + obj.text;
    }
    if (obj.type === OBJ_TYPE.SECONDARY) {
      var letters = ['A', 'B', 'C'];
      var si = _getTypeIndex(obj);
      return (letters[si] || (si + 1)) + '. ' + obj.text;
    }
    // BONUS
    return '★' + (_getTypeIndex(obj) + 1) + '. ' + obj.text;
  }

  function _getTypeIndex(obj) {
    var count = 0;
    for (var i = 0; i < _objectives.length; i++) {
      if (_objectives[i] === obj) return count;
      if (_objectives[i].type === obj.type) count++;
    }
    return 0;
  }

  function _countByType(type, statusFilter) {
    var n = 0;
    for (var i = 0; i < _objectives.length; i++) {
      var o = _objectives[i];
      if (o.type !== type) continue;
      if (statusFilter && o.status !== statusFilter) continue;
      n++;
    }
    return n;
  }

  // ─── Build the DOM board ─────────────────────────────────────────────────────
  function _buildBoard() {
    _boardEl = document.createElement('div');
    _boardEl.id = 'ot-board';

    var inner = document.createElement('div');
    inner.id = 'ot-board-inner';

    var h1 = document.createElement('h1');
    h1.textContent = 'MISSION OBJECTIVES';
    inner.appendChild(h1);

    var hr = document.createElement('hr');
    hr.className = 'ot-divider';
    inner.appendChild(hr);

    var content = document.createElement('div');
    content.id = 'ot-board-content';
    inner.appendChild(content);

    var hint = document.createElement('div');
    hint.className = 'ot-close-hint';
    hint.textContent = '[TAB / SHIFT+O] CLOSE  |  [N] CYCLE NAVIGATION';
    inner.appendChild(hint);

    _boardEl.appendChild(inner);
    document.body.appendChild(_boardEl);
  }

  function _renderBoard() {
    var content = document.getElementById('ot-board-content');
    if (!content) return;

    var html = '';

    // PRIMARY
    html += '<div class="ot-section-title">PRIMARY OBJECTIVES</div>';
    var primaries = _getByType(OBJ_TYPE.PRIMARY);
    for (var i = 0; i < primaries.length; i++) {
      html += _renderRow(primaries[i], i);
    }

    html += '<hr class="ot-divider">';

    // SECONDARY
    html += '<div class="ot-section-title">SECONDARY OBJECTIVES</div>';
    var secondaries = _getByType(OBJ_TYPE.SECONDARY);
    for (var j = 0; j < secondaries.length; j++) {
      html += _renderRow(secondaries[j], j);
    }

    html += '<hr class="ot-divider">';

    // BONUS
    html += '<div class="ot-section-title">BONUS OBJECTIVES</div>';
    var bonuses = _getByType(OBJ_TYPE.BONUS);
    if (!_bonusRevealed && _primaryRevealed < 2) {
      html += '<div class="ot-hidden-row">&#x25A0;&#x25A0;&#x25A0; CLASSIFIED — Complete 2 primary objectives to unlock &#x25A0;&#x25A0;&#x25A0;</div>';
    } else {
      for (var k = 0; k < bonuses.length; k++) {
        html += _renderRow(bonuses[k], k);
      }
      if (bonuses.length === 0) {
        html += '<div class="ot-hidden-row">No bonus objectives.</div>';
      }
    }

    content.innerHTML = html;
  }

  function _getByType(type) {
    var arr = [];
    for (var i = 0; i < _objectives.length; i++) {
      if (_objectives[i].type === type) arr.push(_objectives[i]);
    }
    return arr;
  }

  function _renderRow(obj, typeIdx) {
    var labelClass = 'ot-label';
    if (obj.status === STATUS.COMPLETE) labelClass += ' complete';
    if (obj.status === STATUS.FAILED)   labelClass += ' failed';

    var dotColor = STATUS_COLOR[obj.status] || '#888';

    var prefixes = { PRIMARY: '', SECONDARY: '', BONUS: '' };
    var labels = { PRIMARY: ['1.','2.','3.'], SECONDARY: ['A.','B.','C.'], BONUS: ['★ 1.','★ 2.','★ 3.'] };
    var idxArr = labels[obj.type] || [];
    var prefix = idxArr[typeIdx] || (typeIdx + 1) + '.';

    var isNav = (_objectives[_navIndex] === obj);

    var timerHtml = '';
    if (obj.timeLimit && obj.status === STATUS.ACTIVE) {
      var tl = Math.max(0, Math.ceil(obj.timeLeft));
      var urgentClass = tl < 30 ? ' urgent' : '';
      timerHtml = '<span class="ot-timer' + urgentClass + '">' + _fmtTime(tl) + '</span>';
    }

    var navMark = isNav ? ' <span style="color:#FFFF00;font-size:10px">▶ NAV</span>' : '';

    return [
      '<div class="ot-row">',
      '  <span class="ot-idx">' + prefix + '</span>',
      '  <span class="ot-dot" style="background:' + dotColor + ';color:' + dotColor + '"></span>',
      '  <span class="' + labelClass + '">' + _esc(obj.text) + navMark + '</span>',
      timerHtml,
      '</div>'
    ].join('');
  }

  function _fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ─── Board toggle ────────────────────────────────────────────────────────────
  function _showBoard() {
    if (!_boardEl) _buildBoard();
    _renderBoard();
    _boardEl.style.display = 'block';
    _boardVisible = true;
  }

  function _hideBoard() {
    if (_boardEl) _boardEl.style.display = 'none';
    _boardVisible = false;
  }

  function _toggleBoard() {
    if (_boardVisible) { _hideBoard(); }
    else              { _showBoard(); }
  }

  // ─── HUD elements ────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudProgressEl = document.createElement('div');
    _hudProgressEl.id = 'ot-hud-progress';
    document.body.appendChild(_hudProgressEl);

    _hudWaypointEl = document.createElement('div');
    _hudWaypointEl.id = 'ot-hud-waypoint';
    _hudWaypointEl.style.display = 'none';
    document.body.appendChild(_hudWaypointEl);

    _unlockMessageEl = document.createElement('div');
    _unlockMessageEl.id = 'ot-unlock-msg';
    _unlockMessageEl.style.display = 'none';
    document.body.appendChild(_unlockMessageEl);
  }

  function _updateProgressHUD() {
    if (!_hudProgressEl) return;

    var primTotal    = _countByType(OBJ_TYPE.PRIMARY);
    var primDone     = _countByType(OBJ_TYPE.PRIMARY, STATUS.COMPLETE);
    var secTotal     = _countByType(OBJ_TYPE.SECONDARY);
    var secDone      = _countByType(OBJ_TYPE.SECONDARY, STATUS.COMPLETE);

    var primColor  = primDone === primTotal && primTotal > 0 ? '#00FF88' : '#FFCC44';
    var secColor   = secDone  === secTotal  && secTotal  > 0 ? '#00FF88' : '#AAAAAA';

    _hudProgressEl.innerHTML =
      '<span style="color:' + primColor + '">PRIMARY: ' + primDone + '/' + primTotal + '</span>  ' +
      '<span style="color:' + secColor  + '">SECONDARY: ' + secDone + '/' + secTotal  + '</span>';
  }

  // ─── Waypoint 3D markers ─────────────────────────────────────────────────────
  function _ensureWaypointGroup() {
    if (!_waypointGroup && _scene) {
      _waypointGroup = new THREE.Group();
      _scene.add(_waypointGroup);
    }
  }

  function _buildWaypointMesh(obj) {
    if (!_scene) return;
    _ensureWaypointGroup();

    var color = WAYPOINT_COLOR[obj.type] || 0xFFFF00;
    var pos   = obj.position || { x: 0, y: 0, z: 0 };

    // Cone pointing down (tip at bottom): ConeGeometry(radius, height, segments)
    var coneGeo = new THREE.ConeGeometry(0.6, 1.0, 8);
    var coneMat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.88
    });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    // Rotate so tip points down
    cone.rotation.x = Math.PI;
    cone.position.set(pos.x, pos.y + 3.5, pos.z);

    // Vertical shaft
    var shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6);
    var shaftMat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.7
    });
    var shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.set(pos.x, pos.y + 5.5, pos.z);

    // Point light for glow
    var light = new THREE.PointLight(color, 2.5, 12);
    light.position.set(pos.x, pos.y + 4.5, pos.z);

    var group = new THREE.Group();
    group.add(cone);
    group.add(shaft);
    group.add(light);

    _waypointGroup.add(group);
    obj._waypointMesh = group;
    obj._waypointLight = light;
    obj._waypointCone  = cone;
    obj._waypointPhase = Math.random() * Math.PI * 2;
  }

  function _removeWaypointMesh(obj) {
    if (obj._waypointMesh && _waypointGroup) {
      _waypointGroup.remove(obj._waypointMesh);
    }
    obj._waypointMesh  = null;
    obj._waypointLight = null;
    obj._waypointCone  = null;
  }

  // ─── HUD edge waypoint label ─────────────────────────────────────────────────
  function _getPlayerPos() {
    var p = window.player ||
      (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    return (p && p.position) ? p.position : null;
  }

  function _updateWaypointHUD(dt) {
    if (!_hudWaypointEl || !_camera) return;

    var navObj = _objectives[_navIndex];
    if (!navObj || !navObj.position ||
        navObj.status === STATUS.COMPLETE || navObj.status === STATUS.FAILED) {
      _hudWaypointEl.style.display = 'none';
      return;
    }

    var playerPos = _getPlayerPos();
    if (!playerPos) { _hudWaypointEl.style.display = 'none'; return; }

    var dx = navObj.position.x - playerPos.x;
    var dz = navObj.position.z - playerPos.z;
    var dist = Math.round(Math.sqrt(dx * dx + dz * dz));

    // Project objective position to screen
    var worldVec = new THREE.Vector3(navObj.position.x, navObj.position.y + 3.5, navObj.position.z);
    worldVec.project(_camera);

    var W = window.innerWidth;
    var H = window.innerHeight;
    var sx = (worldVec.x  *  0.5 + 0.5) * W;
    var sy = (-worldVec.y * 0.5 + 0.5) * H;

    // Clamp to screen edges
    var margin = 28;
    var clamped = false;
    if (sx < margin)     { sx = margin;     clamped = true; }
    if (sx > W - margin) { sx = W - margin; clamped = true; }
    if (sy < margin)     { sy = margin;     clamped = true; }
    if (sy > H - margin) { sy = H - margin; clamped = true; }
    // Also clamp if behind camera
    if (worldVec.z > 1) { clamped = true; }

    var typeAbbr = navObj.type === OBJ_TYPE.PRIMARY ? 'PRIMARY' :
                   navObj.type === OBJ_TYPE.SECONDARY ? 'SECONDARY' : 'BONUS';
    var typeIdx = _getTypeIndex(navObj);
    var idxLabel = navObj.type === OBJ_TYPE.PRIMARY ? String(typeIdx + 1) :
                   navObj.type === OBJ_TYPE.SECONDARY ? ['A','B','C'][typeIdx] || (typeIdx+1) :
                   '★' + (typeIdx + 1);

    var arrowChar = clamped ? '▲' : '▼'; // ▲ edge indicator vs ▼ on-screen
    var col = navObj.type === OBJ_TYPE.PRIMARY   ? '#FFFF00' :
              navObj.type === OBJ_TYPE.SECONDARY ? '#00FF88' : '#FFAA00';

    _hudWaypointEl.style.display  = 'block';
    _hudWaypointEl.style.left     = sx + 'px';
    _hudWaypointEl.style.top      = sy + 'px';
    _hudWaypointEl.style.color    = col;
    _hudWaypointEl.style.borderLeft = '2px solid ' + col;
    _hudWaypointEl.textContent = typeAbbr + ' ' + idxLabel + ' ' + arrowChar + ' ' + dist + 'm';
  }

  // ─── Navigation cycling ──────────────────────────────────────────────────────
  function _cycleNav() {
    var eligible = [];
    for (var i = 0; i < _objectives.length; i++) {
      var o = _objectives[i];
      if (o.status !== STATUS.COMPLETE && o.status !== STATUS.FAILED && o.position) {
        // Bonus only if revealed
        if (o.type === OBJ_TYPE.BONUS && !_bonusRevealed) continue;
        eligible.push(i);
      }
    }
    if (eligible.length === 0) {
      _navIndex = -1;
      if (_hudWaypointEl) _hudWaypointEl.style.display = 'none';
      return;
    }

    // Find next in eligible after current
    var curPos = -1;
    for (var j = 0; j < eligible.length; j++) {
      if (eligible[j] === _navIndex) { curPos = j; break; }
    }
    var nextPos = (curPos + 1) % eligible.length;
    _navIndex = eligible[nextPos];

    // Mark old as active, new as active
    for (var k = 0; k < _objectives.length; k++) {
      if (_objectives[k].status === STATUS.ACTIVE) {
        // leave as active — nav index is separate
      }
    }

    _playNav();
    if (window.HUD && window.HUD.showToast) {
      var navObj = _objectives[_navIndex];
      window.HUD.showToast('NAVIGATING: ' + _getObjectiveLabel(navObj));
    }

    // Pulse the selected waypoint mesh
    _pulseWaypoint(_objectives[_navIndex]);

    if (_boardVisible) _renderBoard();
  }

  function _pulseWaypoint(obj) {
    if (!obj || !obj._waypointCone) return;
    obj._pulseActive = true;
    obj._pulseTime   = 0;
  }

  // ─── Waypoint animation ──────────────────────────────────────────────────────
  function _animateWaypoints(dt, elapsed) {
    for (var i = 0; i < _objectives.length; i++) {
      var obj = _objectives[i];
      if (!obj._waypointMesh) continue;
      if (obj.status === STATUS.COMPLETE || obj.status === STATUS.FAILED) continue;

      // Hover bob
      var phase = obj._waypointPhase + elapsed * 1.6;
      var baseY = (obj.position ? obj.position.y : 0) + 3.5;
      obj._waypointCone.position.y  = baseY + Math.sin(phase) * 0.25;

      // Nav-selected pulse (opacity)
      if (_objectives[_navIndex] === obj) {
        var pulse = 0.5 + 0.5 * Math.sin(elapsed * 5.0);
        obj._waypointCone.material.emissiveIntensity = 0.4 + 0.6 * pulse;
        obj._waypointLight.intensity = 2.0 + 2.0 * pulse;
      } else {
        obj._waypointCone.material.emissiveIntensity = 0.5;
        obj._waypointLight.intensity = 2.0;
      }
    }
  }

  // ─── Countdown timers ────────────────────────────────────────────────────────
  function _tickTimers(dt) {
    for (var i = 0; i < _objectives.length; i++) {
      var obj = _objectives[i];
      if (!obj.timeLimit) continue;
      if (obj.status !== STATUS.ACTIVE && obj.status !== STATUS.PENDING) continue;
      if (obj.timeLeft === undefined) obj.timeLeft = obj.timeLimit;

      obj.timeLeft -= dt;
      if (obj.timeLeft <= 0) {
        obj.timeLeft = 0;
        failObjective(obj.id);
      }
    }
  }

  // ─── Level objective generation ──────────────────────────────────────────────
  function _generateLevelObjectives(levelName) {
    _levelName = (levelName || '').toUpperCase();

    var template = null;
    for (var key in LEVEL_OBJECTIVES) {
      if (LEVEL_OBJECTIVES.hasOwnProperty(key) && _levelName.indexOf(key) !== -1) {
        template = LEVEL_OBJECTIVES[key];
        break;
      }
    }
    if (!template) template = LEVEL_OBJECTIVES.DEFAULT;

    // Primary objectives
    for (var p = 0; p < template.primary.length; p++) {
      addObjective(OBJ_TYPE.PRIMARY, template.primary[p], null);
    }

    // Secondary objectives
    for (var s = 0; s < template.secondary.length; s++) {
      addObjective(OBJ_TYPE.SECONDARY, template.secondary[s], null);
    }

    // Bonus objectives (hidden until 2 primaries done)
    for (var b = 0; b < template.bonus.length; b++) {
      addObjective(OBJ_TYPE.BONUS, template.bonus[b], null);
    }

    // Set first primary as active
    for (var i = 0; i < _objectives.length; i++) {
      if (_objectives[i].type === OBJ_TYPE.PRIMARY) {
        _objectives[i].status = STATUS.ACTIVE;
        break;
      }
    }

    _updateProgressHUD();
  }

  // ─── Keyboard bindings ───────────────────────────────────────────────────────
  function _bindKeys() {
    window.addEventListener('keydown', function (e) {
      // Objective board: Tab (if IntelligenceBriefing absent) or Shift+O
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (!window.IntelligenceBriefing) {
          e.preventDefault();
          _toggleBoard();
        }
      }
      if (e.key === 'O' && e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        _toggleBoard();
      }

      // Navigation cycling
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        _cycleNav();
      }

      // Close board with Escape
      if (e.key === 'Escape' && _boardVisible) {
        _hideBoard();
      }
    });
  }

  // ─── Unlock message ──────────────────────────────────────────────────────────
  function _showUnlockMessage(msg) {
    if (!_unlockMessageEl) return;
    _unlockMessageEl.textContent = msg;
    _unlockMessageEl.style.display = 'block';
    _unlockMessageEl.style.animation = 'none';
    // Force reflow
    void _unlockMessageEl.offsetWidth;
    _unlockMessageEl.style.animation = 'otUnlock 3.2s ease forwards';
    setTimeout(function () {
      if (_unlockMessageEl) _unlockMessageEl.style.display = 'none';
    }, 3300);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────
  /**
   * init({ scene, camera, levelName })
   */
  function init(opts) {
    opts = opts || {};
    _scene  = opts.scene  || null;
    _camera = opts.camera || null;

    _injectStyles();
    _buildHUD();
    _bindKeys();

    var levelName = opts.levelName || (window.GameManager && window.GameManager.getLevelName && window.GameManager.getLevelName()) || '';
    if (levelName) {
      _generateLevelObjectives(levelName);
    }

    _updateProgressHUD();

    // Auto-select first nav target
    _cycleNav();
  }

  /**
   * update(dt, elapsed) — call from game loop
   * dt: delta seconds, elapsed: total seconds
   */
  function update(dt, elapsed) {
    dt      = dt      || 0.016;
    elapsed = elapsed || 0;

    _tickTimers(dt);
    _animateWaypoints(dt, elapsed);
    _updateWaypointHUD(dt);

    // Keep board fresh if visible
    if (_boardVisible) _renderBoard();
  }

  /**
   * addObjective(type, text, timeLimit, position)
   * type: 'PRIMARY'|'SECONDARY'|'BONUS'
   * timeLimit: seconds or null
   * position: {x,y,z} for 3D waypoint or null
   * returns id string
   */
  function addObjective(type, text, timeLimit, position) {
    type = type || OBJ_TYPE.PRIMARY;
    var obj = {
      id:        _makeId(),
      type:      type,
      text:      text || 'Unnamed objective',
      status:    STATUS.PENDING,
      timeLimit: timeLimit || null,
      timeLeft:  timeLimit || null,
      position:  position  || null,
      _waypointMesh:  null,
      _waypointLight: null,
      _waypointCone:  null,
      _waypointPhase: Math.random() * Math.PI * 2,
      _pulseActive:   false,
      _pulseTime:     0
    };

    _objectives.push(obj);

    // Build 3D waypoint if position provided and scene ready
    if (position && _scene) {
      _buildWaypointMesh(obj);
    }

    _updateProgressHUD();
    return obj.id;
  }

  /**
   * completeObjective(id) — mark objective as complete, award score
   */
  function completeObjective(id) {
    var obj = _findById(id);
    if (!obj) return false;
    if (obj.status === STATUS.COMPLETE || obj.status === STATUS.FAILED) return false;

    obj.status   = STATUS.COMPLETE;
    obj.timeLeft = null;

    _removeWaypointMesh(obj);
    _playComplete();

    // Score reward
    var reward = SCORE_REWARD[obj.type] || 0;
    var player = _getPlayerPos() ? (window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer())) : null;
    if (player && player.score !== undefined) {
      player.score += reward;
      if (window.HUD && window.HUD.setScore) window.HUD.setScore(player.score);
    }
    _totalScore += reward;

    // Toast
    var typeLabel = obj.type === OBJ_TYPE.PRIMARY ? 'PRIMARY' :
                    obj.type === OBJ_TYPE.SECONDARY ? 'SECONDARY' : 'BONUS';
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(typeLabel + ' OBJECTIVE COMPLETE! +' + reward);
    }

    // Bonus reveal tracking
    if (obj.type === OBJ_TYPE.PRIMARY) {
      _primaryRevealed++;
      if (_primaryRevealed >= 2 && !_bonusRevealed) {
        _bonusRevealed = true;
        _playBonusReveal();
        _showUnlockMessage('★ BONUS OBJECTIVES UNLOCKED ★');
        if (window.HUD && window.HUD.showToast) {
          window.HUD.showToast('BONUS OBJECTIVES UNLOCKED!');
        }
        // Build waypoints for bonus objectives that have positions
        for (var i = 0; i < _objectives.length; i++) {
          var bo = _objectives[i];
          if (bo.type === OBJ_TYPE.BONUS && bo.position && !bo._waypointMesh && _scene) {
            _buildWaypointMesh(bo);
          }
        }
      }
    }

    // Bonus unlock message per bonus type
    if (obj.type === OBJ_TYPE.BONUS) {
      _showUnlockMessage('BONUS COMPLETE: ' + obj.text.toUpperCase());
    }

    // Auto-advance nav if this was the current nav target
    if (_objectives[_navIndex] === obj) {
      _cycleNav();
    }

    _updateProgressHUD();
    if (_boardVisible) _renderBoard();

    return true;
  }

  /**
   * failObjective(id)
   */
  function failObjective(id) {
    var obj = _findById(id);
    if (!obj) return false;
    if (obj.status === STATUS.COMPLETE || obj.status === STATUS.FAILED) return false;

    obj.status   = STATUS.FAILED;
    obj.timeLeft = null;

    _removeWaypointMesh(obj);
    _playFail();

    var typeLabel = obj.type === OBJ_TYPE.PRIMARY ? 'PRIMARY' :
                    obj.type === OBJ_TYPE.SECONDARY ? 'SECONDARY' : 'BONUS';
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(typeLabel + ' OBJECTIVE FAILED');
    }

    if (_objectives[_navIndex] === obj) {
      _cycleNav();
    }

    _updateProgressHUD();
    if (_boardVisible) _renderBoard();

    return true;
  }

  /**
   * reset() — clear all objectives and state
   */
  function reset() {
    // Remove all waypoint meshes
    for (var i = 0; i < _objectives.length; i++) {
      _removeWaypointMesh(_objectives[i]);
    }
    if (_waypointGroup && _scene) {
      _scene.remove(_waypointGroup);
      _waypointGroup = null;
    }

    _objectives      = [];
    _nextId          = 0;
    _navIndex        = -1;
    _primaryRevealed = 0;
    _bonusRevealed   = false;
    _totalScore      = 0;

    _hideBoard();
    _updateProgressHUD();
  }

  // ─── Private helper ──────────────────────────────────────────────────────────
  function _findById(id) {
    for (var i = 0; i < _objectives.length; i++) {
      if (_objectives[i].id === id) return _objectives[i];
    }
    return null;
  }

  // ─── Expose public interface ─────────────────────────────────────────────────
  return {
    init:              init,
    update:            update,
    addObjective:      addObjective,
    completeObjective: completeObjective,
    failObjective:     failObjective,
    reset:             reset
  };

})();
