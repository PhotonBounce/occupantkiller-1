// mine-sweeper.js — EOD metal detector and mine defusal minigame
// M            → equip / unequip detector
// Hold M 2s    → toggle EOD suit (blast damage reduction + vignette)
// E (near mine)→ begin wire-cut defuse minigame
// Ctrl+M       → clear all known mines within 5m via disposal robot
// All var — no let/const. IIFE pattern.
window.MineSweeper = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var DETECT_MAX_DIST    = 8.0;    // metres — beyond this: silent
  var DETECT_CLOSE_DIST  = 0.5;    // metres — max volume
  var SCAN_REVEAL_DIST   = 1.5;    // metres — mines become visible within
  var DEFUSE_DIST        = 0.8;    // metres — must be this close to defuse
  var BEEP_FAR_INTERVAL  = 2.0;    // seconds between beeps when far
  var BEEP_CLOSE_INTERVAL= 0.1;    // seconds between beeps when very close
  var BATTERY_MAX        = 120;    // seconds of battery life
  var BATTERY_DRAIN_BASE = 1.0;    // drain rate (seconds/s) baseline
  var BATTERY_DRAIN_PING = 1.8;    // drain rate while actively pinging
  var EOD_HOLD_TIME      = 2.0;    // seconds holding M to activate EOD suit
  var EOD_BLAST_REDUCTION= 0.5;    // 50% blast damage reduction
  var DEFUSE_TIME        = 4.0;    // seconds for defuse minigame
  var DEFUSE_WIRE_SHOW   = 0.8;    // seconds correct wire key is shown
  var FALSE_ALARM_CHANCE = 0.15;   // 15% false alarm rate
  var ROBOT_CLEAR_DIST   = 5.0;    // metres radius for Ctrl+M clear
  var SCORE_DEFUSE       = 75;

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;
  var _inited         = false;
  var _detectorEquipped = false;
  var _eodSuitActive  = false;
  var _battery        = BATTERY_MAX;
  var _mHeld          = false;
  var _mHoldTimer     = 0;
  var _ctrlHeld       = false;

  // Internal mine registry
  var _detectedMines  = [];   // { mesh, type, damage, radius, active, falseAlarm }

  // Beep state
  var _audioCtx       = null;
  var _beepTimer      = 0;
  var _beepInterval   = BEEP_FAR_INTERVAL;
  var _nearestDist    = 999;
  var _nearestMine    = null;

  // Defuse minigame state
  var _defusing       = false;
  var _defuseTarget   = null;
  var _defuseTimer    = 0;
  var _correctWire    = '';
  var _wireShowTimer  = 0;
  var _wireShown      = false;

  // Robot clear state
  var _robotActive    = false;
  var _robotTimer     = 0;
  var _robotMesh      = null;
  var _robotTargets   = [];

  // Three.js objects
  var _detectorGroup  = null;  // wand + head meshes
  var _scanDisc       = null;  // cyan ground disc
  var _scanDiscGroup  = null;

  // HUD elements
  var _hudRoot        = null;
  var _hudBattery     = null;
  var _hudDistText    = null;
  var _hudEOD         = null;
  var _defuseUI       = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _getScene() { return _scene || window._gameScene || null; }
  function _getCamera() { return _camera || window._camera || null; }

  function _getPlayerPos() {
    if (window._player && window._player.position) return window._player.position;
    if (window.player  && window.player.position)  return window.player.position;
    var cam = _getCamera();
    if (cam) return cam.position;
    return new THREE.Vector3();
  }

  function _xzDist(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _addScore(n) {
    if (window.player  && typeof window.player.score  === 'number') window.player.score  += n;
    if (window._player && typeof window._player.score === 'number') window._player.score += n;
  }

  function _toast(msg, color) {
    if (window.KillFeed && window.KillFeed.addEvent) {
      window.KillFeed.addEvent(msg, color || '#00ff88');
    } else if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else {
      console.log('[MineSweeper] ' + msg);
    }
  }

  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        _audioCtx = new Ctx();
        return _audioCtx;
      }
    } catch (e) {}
    return null;
  }

  // ── Audio ─────────────────────────────────────────────────────────────────

  function _playBeep(volume) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      var vol = Math.max(0, Math.min(1, volume));
      gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  function _playDefuseSuccess() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.18);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.2);
        })(notes[i], i * 0.12);
      }
    } catch (e) {}
  }

  function _playExplosion() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8);
      }
      var src = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.6;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  function _playRobotBeep() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // ── Mine collection from external modules ─────────────────────────────────

  function _gatherExternalMines() {
    // Pull from LandmineField
    if (window.LandmineField && Array.isArray(window.LandmineField.mines)) {
      var lm = window.LandmineField.mines;
      for (var i = 0; i < lm.length; i++) {
        var m = lm[i];
        if (m && m.mesh && !_isRegistered(m.mesh)) {
          _detectedMines.push({ mesh: m.mesh, type: 'AP', damage: 80, radius: 1.5, active: true, falseAlarm: false, _mineData: m });
        }
      }
    }
    // Pull from ProximityMine
    if (window._activeMines && Array.isArray(window._activeMines)) {
      for (var j = 0; j < window._activeMines.length; j++) {
        var pm = window._activeMines[j];
        if (pm && pm.mesh && !_isRegistered(pm.mesh)) {
          _detectedMines.push({ mesh: pm.mesh, type: 'PROX', damage: 120, radius: 2.5, active: true, falseAlarm: false, _mineData: pm });
        }
      }
    }
    // ClaymoreDirectional stores mines in _claymores on its return object
    if (window.ClaymoreDirectional && Array.isArray(window.ClaymoreDirectional._claymores)) {
      var cd = window.ClaymoreDirectional._claymores;
      for (var k = 0; k < cd.length; k++) {
        var cl = cd[k];
        if (cl && cl.group && !_isRegistered(cl.group)) {
          _detectedMines.push({ mesh: cl.group, type: 'CLAYMORE', damage: 180, radius: 4.0, active: true, falseAlarm: false, _mineData: cl });
        }
      }
    }
  }

  function _isRegistered(mesh) {
    for (var i = 0; i < _detectedMines.length; i++) {
      if (_detectedMines[i].mesh === mesh) return true;
    }
    return false;
  }

  // ── Public mine registration ──────────────────────────────────────────────

  function registerMine(mesh, type, damage, radius) {
    if (!mesh) return;
    if (_isRegistered(mesh)) return;
    _detectedMines.push({
      mesh: mesh,
      type: type || 'UNKNOWN',
      damage: damage || 80,
      radius: radius || 1.5,
      active: true,
      falseAlarm: Math.random() < FALSE_ALARM_CHANCE
    });
  }

  // ── Three.js meshes ───────────────────────────────────────────────────────

  function _buildDetectorWand() {
    var sc = _getScene();
    if (!sc) return;
    _detectorGroup = new THREE.Group();

    // Rod — thin long box
    var rodGeo = new THREE.BoxGeometry(0.025, 0.025, 0.7);
    var rodMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(0, 0, -0.3);
    _detectorGroup.add(rod);

    // Circular head — flat disc
    var headGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.015, 16);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, -0.04, -0.72);
    _detectorGroup.add(head);

    // LED indicator on head
    var ledGeo = new THREE.SphereGeometry(0.018, 8, 8);
    var ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    var led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.025, -0.72);
    led.name = 'detectorLED';
    _detectorGroup.add(led);

    // Position relative to camera (right hand view)
    _detectorGroup.position.set(0.3, -0.25, -0.4);
    _detectorGroup.visible = false;

    var cam = _getCamera();
    if (cam) cam.add(_detectorGroup);
  }

  function _buildScanDisc() {
    var sc = _getScene();
    if (!sc) return;
    _scanDiscGroup = new THREE.Group();

    var discGeo = new THREE.CircleGeometry(0.8, 32);
    var discMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    _scanDisc = new THREE.Mesh(discGeo, discMat);
    _scanDisc.rotation.x = -Math.PI / 2;
    _scanDiscGroup.add(_scanDisc);
    _scanDiscGroup.visible = false;
    sc.add(_scanDiscGroup);
  }

  function _buildRobotMesh() {
    var sc = _getScene();
    if (!sc) return null;
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.22, 0.14, 0.32);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Wheels (4 small cylinders on sides)
    var wGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wPositions = [
      [-0.14, -0.06, -0.1], [0.14, -0.06, -0.1],
      [-0.14, -0.06,  0.1], [0.14, -0.06,  0.1]
    ];
    for (var i = 0; i < wPositions.length; i++) {
      var w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wPositions[i][0], wPositions[i][1], wPositions[i][2]);
      group.add(w);
    }

    // Arm
    var armGeo = new THREE.BoxGeometry(0.04, 0.04, 0.18);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, 0.08, -0.2);
    group.add(arm);

    group.visible = false;
    sc.add(group);
    return group;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function _buildHUD() {
    if (_hudRoot) return;
    _hudRoot = document.createElement('div');
    _hudRoot.id = 'mineSweeperHUD';
    _hudRoot.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:16px',
      'z-index:9000',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:13px',
      'display:none'
    ].join(';');

    // Battery bar
    var battLabel = document.createElement('div');
    battLabel.style.cssText = 'color:#aaffaa;margin-bottom:3px;';
    battLabel.textContent = 'DETECTOR BATTERY';
    _hudRoot.appendChild(battLabel);

    var battOuter = document.createElement('div');
    battOuter.style.cssText = 'width:130px;height:10px;background:#333;border:1px solid #555;margin-bottom:5px;';
    _hudBattery = document.createElement('div');
    _hudBattery.style.cssText = 'height:100%;width:100%;background:#00ff88;transition:width 0.3s;';
    battOuter.appendChild(_hudBattery);
    _hudRoot.appendChild(battOuter);

    // Distance readout
    _hudDistText = document.createElement('div');
    _hudDistText.style.cssText = 'color:#ff4444;font-weight:bold;min-height:18px;';
    _hudRoot.appendChild(_hudDistText);

    document.body.appendChild(_hudRoot);

    // EOD suit overlay
    _hudEOD = document.createElement('div');
    _hudEOD.id = 'eodSuitOverlay';
    _hudEOD.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:8999',
      'display:none',
      'box-shadow:inset 0 0 80px 40px rgba(0,20,0,0.75)',
      'border:4px solid rgba(0,180,0,0.4)'
    ].join(';');
    var eodText = document.createElement('div');
    eodText.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);color:#00ff44;font-family:monospace;font-size:14px;font-weight:bold;letter-spacing:3px;';
    eodText.textContent = 'EOD ACTIVE';
    _hudEOD.appendChild(eodText);
    document.body.appendChild(_hudEOD);
  }

  function _buildDefuseUI() {
    if (_defuseUI) return;
    _defuseUI = document.createElement('div');
    _defuseUI.id = 'defuseMinigame';
    _defuseUI.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'border:2px solid #ff4444',
      'border-radius:8px',
      'padding:20px 30px',
      'z-index:10000',
      'pointer-events:none',
      'display:none',
      'text-align:center',
      'font-family:monospace',
      'min-width:260px'
    ].join(';');
    document.body.appendChild(_defuseUI);
  }

  function _showDefuseUI(correctWire, wireVisible) {
    if (!_defuseUI) _buildDefuseUI();
    var wires = [
      { key: 'R', label: 'RED',   color: '#ff3333' },
      { key: 'B', label: 'BLUE',  color: '#3399ff' },
      { key: 'G', label: 'GREEN', color: '#33ff33' }
    ];
    var timerPct = Math.max(0, (_defuseTimer / DEFUSE_TIME) * 100);
    var timerColor = timerPct > 50 ? '#00ff88' : timerPct > 25 ? '#ffcc00' : '#ff3333';

    var html = '<div style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:10px;">CUT THE CORRECT WIRE</div>';
    // Timer bar
    html += '<div style="width:100%;height:8px;background:#333;border-radius:4px;margin-bottom:14px;">';
    html += '<div style="height:100%;width:' + timerPct + '%;background:' + timerColor + ';border-radius:4px;transition:width 0.1s;"></div></div>';
    // Wires
    for (var i = 0; i < wires.length; i++) {
      var w = wires[i];
      var isCorrect = (w.key === correctWire);
      var showKey = wireVisible && isCorrect;
      html += '<div style="margin:8px 0;padding:6px 10px;background:rgba(255,255,255,0.07);border-radius:4px;display:flex;align-items:center;justify-content:space-between;">';
      html += '<div style="width:80px;height:6px;background:' + w.color + ';border-radius:3px;"></div>';
      html += '<span style="color:' + w.color + ';font-size:15px;font-weight:bold;">' + w.label + '</span>';
      html += '<span style="color:#fff;font-size:18px;font-weight:bold;min-width:24px;text-align:center;">' + (showKey ? '[' + w.key + ']' : '') + '</span>';
      html += '</div>';
    }
    html += '<div style="color:#aaa;font-size:12px;margin-top:10px;">Press R / B / G to cut</div>';
    _defuseUI.innerHTML = html;
    _defuseUI.style.display = 'block';
  }

  function _hideDefuseUI() {
    if (_defuseUI) _defuseUI.style.display = 'none';
  }

  function _updateHUD() {
    if (!_hudRoot) return;
    if (!_detectorEquipped) {
      _hudRoot.style.display = 'none';
      return;
    }
    _hudRoot.style.display = 'block';

    // Battery
    var battPct = Math.max(0, (_battery / BATTERY_MAX) * 100);
    var battColor = battPct > 40 ? '#00ff88' : battPct > 20 ? '#ffcc00' : '#ff3333';
    if (_hudBattery) {
      _hudBattery.style.width = battPct + '%';
      _hudBattery.style.background = battColor;
    }

    // Distance readout
    if (_hudDistText) {
      if (_nearestMine && _nearestDist < DETECT_MAX_DIST) {
        _hudDistText.textContent = 'MINE: ' + _nearestDist.toFixed(1) + 'm';
        _hudDistText.style.color = _nearestDist < 2 ? '#ff1111' : '#ff8800';
      } else {
        _hudDistText.textContent = '';
      }
    }
  }

  // ── Defuse logic ──────────────────────────────────────────────────────────

  var _defuseWireKeys = { r: 'R', b: 'B', g: 'G' };

  function _startDefuse(mine) {
    if (_defusing) return;
    _defusing      = true;
    _defuseTarget  = mine;
    _defuseTimer   = DEFUSE_TIME;
    var keys = ['R', 'B', 'G'];
    _correctWire   = keys[Math.floor(Math.random() * 3)];
    _wireShowTimer = DEFUSE_WIRE_SHOW;
    _wireShown     = true;
    _buildDefuseUI();
    _showDefuseUI(_correctWire, true);
    _toast('DEFUSE STARTED — CUT THE CORRECT WIRE!', '#ffcc00');
  }

  function _cancelDefuse(failed) {
    _defusing = false;
    _hideDefuseUI();
    if (failed && _defuseTarget) {
      _triggerExplosion(_defuseTarget);
    }
    _defuseTarget = null;
  }

  function _defuseCutWire(key) {
    if (!_defusing || !_defuseTarget) return;
    key = key.toUpperCase();
    if (key !== 'R' && key !== 'B' && key !== 'G') return;

    if (_defuseTarget.falseAlarm) {
      // False alarm — just scrap metal, nothing happens
      _defusing = false;
      _hideDefuseUI();
      _toast('FALSE ALARM — just scrap metal!', '#ffcc00');
      _defuseTarget = null;
      return;
    }

    if (key === _correctWire) {
      // Success
      _defusing = false;
      _hideDefuseUI();
      _mineDeactivate(_defuseTarget);
      _addScore(SCORE_DEFUSE);
      _toast('MINE CLEARED  +' + SCORE_DEFUSE, '#00ff88');
      _playDefuseSuccess();
      if (window.KillFeed && window.KillFeed.addEvent) {
        window.KillFeed.addEvent('MINE CLEARED', '#00ff88');
      }
      _defuseTarget = null;
    } else {
      // Wrong wire
      _cancelDefuse(true);
    }
  }

  function _mineDeactivate(mine) {
    mine.active = false;
    if (mine.mesh) {
      // Turn grey
      mine.mesh.traverse(function (obj) {
        if (obj.isMesh && obj.material) {
          obj.material = new THREE.MeshLambertMaterial({ color: 0x777777 });
        }
      });
    }
    if (mine._mineData) {
      mine._mineData.active = false;
    }
  }

  function _triggerExplosion(mine) {
    _playExplosion();
    _toast('MINE EXPLODED!', '#ff2200');
    // Apply damage to player
    var dmg = mine.damage || 80;
    if (_eodSuitActive) dmg = Math.floor(dmg * (1 - EOD_BLAST_REDUCTION));
    if (window.player  && typeof window.player.health  === 'number') window.player.health  -= dmg;
    if (window._player && typeof window._player.health === 'number') window._player.health -= dmg;
    // Flash red overlay
    _flashDamage();
    mine.active = false;
  }

  function _flashDamage() {
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.45);pointer-events:none;z-index:99999;';
    document.body.appendChild(flash);
    setTimeout(function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 350);
  }

  // ── Robot disposal ────────────────────────────────────────────────────────

  function _startRobotClear() {
    if (_robotActive) return;
    var playerPos = _getPlayerPos();
    var targets = [];
    for (var i = 0; i < _detectedMines.length; i++) {
      var m = _detectedMines[i];
      if (!m.active) continue;
      if (!m.mesh || !m.mesh.position) continue;
      var d = _xzDist(playerPos, m.mesh.position);
      if (d <= ROBOT_CLEAR_DIST) targets.push(m);
    }
    if (targets.length === 0) {
      _toast('No active mines within 5m', '#ffcc00');
      return;
    }
    _robotActive  = true;
    _robotTimer   = 0;
    _robotTargets = targets;
    var sc = _getScene();
    if (sc) {
      _robotMesh = _buildRobotMesh();
      if (_robotMesh) {
        _robotMesh.position.copy(playerPos);
        _robotMesh.position.y = playerPos.y - 0.6;
        _robotMesh.visible = true;
      }
    }
    _toast('DISPOSAL ROBOT DEPLOYED', '#00aaff');
    _playRobotBeep();
  }

  function _updateRobot(dt) {
    if (!_robotActive) return;
    _robotTimer += dt;

    // Robot rolls toward first target
    if (_robotMesh && _robotTargets.length > 0) {
      var target = _robotTargets[0];
      if (target.mesh && target.mesh.position) {
        var dir = new THREE.Vector3();
        dir.subVectors(target.mesh.position, _robotMesh.position);
        dir.y = 0;
        var dist = dir.length();
        if (dist > 0.1) {
          dir.normalize().multiplyScalar(Math.min(dist, dt * 2.5));
          _robotMesh.position.add(dir);
        } else {
          // Reached mine
          _playRobotBeep();
          var m = _robotTargets.shift();
          _mineDeactivate(m);
          _toast('MINE NEUTRALISED BY ROBOT', '#00aaff');
          _addScore(Math.floor(SCORE_DEFUSE / 2));
        }
      }
    }

    // Done when no more targets or timeout
    if (_robotTargets.length === 0 || _robotTimer > 12) {
      _robotActive = false;
      if (_robotMesh) {
        var sc = _getScene();
        if (sc) sc.remove(_robotMesh);
        _robotMesh = null;
      }
    }
  }

  // ── Scan disc & mine reveal ───────────────────────────────────────────────

  function _updateScanDisc() {
    if (!_scanDiscGroup) return;
    if (!_detectorEquipped || _battery <= 0) {
      _scanDiscGroup.visible = false;
      return;
    }
    var playerPos = _getPlayerPos();
    _scanDiscGroup.position.set(playerPos.x, playerPos.y - 0.85, playerPos.z);
    _scanDiscGroup.visible = true;

    // Pulse opacity
    _scanDisc.material.opacity = 0.2 + 0.15 * Math.sin(Date.now() * 0.006);

    // Reveal mines within SCAN_REVEAL_DIST
    for (var i = 0; i < _detectedMines.length; i++) {
      var m = _detectedMines[i];
      if (!m.mesh || !m.active) continue;
      var d = _xzDist(playerPos, m.mesh.position);
      if (d < SCAN_REVEAL_DIST) {
        m.mesh.visible = true;
        // Apply red emissive highlight
        m.mesh.traverse(function (obj) {
          if (obj.isMesh && obj.material && obj.material.emissive !== undefined) {
            obj.material.emissive.setHex(0xaa0000);
          }
        });
        // Squad alert
        window._mineAlert = { x: m.mesh.position.x, z: m.mesh.position.z, detected: true };
      }
    }
  }

  // ── Main proximity detection ──────────────────────────────────────────────

  function _findNearestMine() {
    _gatherExternalMines();
    var playerPos = _getPlayerPos();
    var bestDist  = 999;
    var bestMine  = null;

    for (var i = 0; i < _detectedMines.length; i++) {
      var m = _detectedMines[i];
      if (!m.active) continue;
      if (!m.mesh || !m.mesh.position) continue;
      var d = _xzDist(playerPos, m.mesh.position);
      if (d < bestDist) {
        bestDist = d;
        bestMine = m;
      }
    }
    _nearestDist = bestDist;
    _nearestMine = bestMine;
  }

  function _computeBeepInterval(dist) {
    if (dist >= DETECT_MAX_DIST) return BEEP_FAR_INTERVAL;
    var t = 1 - Math.min(1, (dist - DETECT_CLOSE_DIST) / (DETECT_MAX_DIST - DETECT_CLOSE_DIST));
    return BEEP_FAR_INTERVAL + (BEEP_CLOSE_INTERVAL - BEEP_FAR_INTERVAL) * t;
  }

  function _computeBeepVolume(dist) {
    if (dist >= DETECT_MAX_DIST) return 0;
    return Math.min(1, Math.max(0, 1 - (dist - DETECT_CLOSE_DIST) / (DETECT_MAX_DIST - DETECT_CLOSE_DIST)));
  }

  // ── EOD suit ──────────────────────────────────────────────────────────────

  function _setEODSuit(active) {
    _eodSuitActive = active;
    if (_hudEOD) _hudEOD.style.display = active ? 'block' : 'none';
    if (active) {
      _toast('EOD SUIT ACTIVE — Blast resistance +50%', '#00ff88');
    } else {
      _toast('EOD Suit deactivated', '#aaaaaa');
    }
  }

  // ── Detector wand visibility ──────────────────────────────────────────────

  function _setDetectorEquipped(equipped) {
    _detectorEquipped = equipped;
    if (_detectorGroup) _detectorGroup.visible = equipped;
    if (!equipped) {
      _nearestDist = 999;
      _nearestMine = null;
      _beepTimer   = 0;
      if (_scanDiscGroup) _scanDiscGroup.visible = false;
      if (_defusing) _cancelDefuse(false);
    }
  }

  // ── Key handlers ──────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    // Skip if typing in an input/textarea
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    var key = e.key;
    var keyLower = key.toLowerCase();

    // M key — equip/unequip + hold for EOD suit
    if (keyLower === 'm' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (!_mHeld) {
        _mHeld = true;
        _mHoldTimer = 0;
      }
    }

    // Ctrl+M — robot clear
    if (keyLower === 'm' && e.ctrlKey) {
      e.preventDefault();
      _startRobotClear();
    }

    // E — start defuse when near mine
    if (keyLower === 'e' && !_defusing) {
      var playerPos = _getPlayerPos();
      if (_detectorEquipped && _nearestMine && _nearestDist <= DEFUSE_DIST) {
        _startDefuse(_nearestMine);
      }
    }

    // Wire cut keys during defuse
    if (_defusing) {
      if (keyLower === 'r') { _defuseCutWire('R'); return; }
      if (keyLower === 'b') { _defuseCutWire('B'); return; }
      if (keyLower === 'g') { _defuseCutWire('G'); return; }
    }

    // Track ctrl
    if (keyLower === 'control') _ctrlHeld = true;
  }

  function _onKeyUp(e) {
    var keyLower = e.key.toLowerCase();

    if (keyLower === 'm' && !e.ctrlKey) {
      if (_mHeld) {
        _mHeld = false;
        // Short tap → toggle detector
        if (_mHoldTimer < EOD_HOLD_TIME) {
          if (_battery > 0) {
            _setDetectorEquipped(!_detectorEquipped);
            if (_detectorEquipped) {
              _toast('Detector EQUIPPED', '#00ffcc');
            } else {
              _toast('Detector STOWED', '#aaaaaa');
            }
          } else {
            _toast('DETECTOR BATTERY DEAD — Find resupply', '#ff4444');
          }
        }
        _mHoldTimer = 0;
      }
    }

    if (keyLower === 'control') _ctrlHeld = false;
  }

  // ── AirdropSupply recharge hook ───────────────────────────────────────────

  function _hookAirdropRecharge() {
    // Monkey-patch or listen for airdrop collection
    var orig = window._onAirdropCollect;
    window._onAirdropCollect = function (type) {
      if (orig) orig(type);
      // Any airdrop recharges battery partially
      _battery = Math.min(BATTERY_MAX, _battery + 40);
      _toast('EOD Battery recharged!', '#00ff88');
    };
    // Also check if AirdropSupply exposes a pickup event
    if (window.AirdropSupply && typeof window.AirdropSupply.onPickup === 'function') {
      window.AirdropSupply.onPickup(function () {
        _battery = Math.min(BATTERY_MAX, _battery + 40);
        _toast('EOD Battery recharged!', '#00ff88');
      });
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  function update(dt) {
    if (!_inited) return;
    dt = dt || 0.016;

    // M hold timer for EOD suit
    if (_mHeld) {
      _mHoldTimer += dt;
      if (_mHoldTimer >= EOD_HOLD_TIME) {
        _mHeld = false;
        _mHoldTimer = 0;
        _setEODSuit(!_eodSuitActive);
      }
    }

    // Update robot
    _updateRobot(dt);

    if (!_detectorEquipped || _battery <= 0) {
      _updateHUD();
      return;
    }

    // Battery drain
    var drainRate = (_nearestMine && _nearestDist < DETECT_MAX_DIST)
      ? BATTERY_DRAIN_PING
      : BATTERY_DRAIN_BASE;
    _battery = Math.max(0, _battery - dt * drainRate);
    if (_battery <= 0) {
      _toast('DETECTOR BATTERY DEAD — Find resupply', '#ff4444');
      _setDetectorEquipped(false);
      _updateHUD();
      return;
    }

    // Find nearest mine
    _findNearestMine();

    // Beeping
    _beepTimer -= dt;
    if (_nearestMine && _nearestDist < DETECT_MAX_DIST) {
      _beepInterval = _computeBeepInterval(_nearestDist);
      if (_beepTimer <= 0) {
        _beepTimer = _beepInterval;
        _playBeep(_computeBeepVolume(_nearestDist));
      }
    } else {
      _beepTimer = Math.max(0, _beepTimer);
    }

    // Scan disc + mine reveal
    _updateScanDisc();

    // Detector wand LED blink
    if (_detectorGroup) {
      var led = _detectorGroup.getObjectByName('detectorLED');
      if (led) {
        var blink = _nearestMine && _nearestDist < DETECT_MAX_DIST;
        led.material.color.setHex(blink ? 0xff0000 : 0x00ff00);
      }
      // Slight sway animation
      _detectorGroup.rotation.z = Math.sin(Date.now() * 0.0015) * 0.04;
    }

    // Defuse minigame timer
    if (_defusing) {
      _defuseTimer -= dt;
      _wireShowTimer -= dt;
      if (_wireShowTimer <= 0) _wireShown = false;
      _showDefuseUI(_correctWire, _wireShown);
      if (_defuseTimer <= 0) {
        _cancelDefuse(true);  // time's up → explode
      }
    }

    _updateHUD();
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init(scene, camera) {
    if (_inited) return;
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._camera     || null;
    _inited = true;

    _battery = BATTERY_MAX;
    _detectorEquipped = false;
    _eodSuitActive    = false;

    _buildHUD();
    _buildDetectorWand();
    _buildScanDisc();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    _hookAirdropRecharge();

    // Expose blast-reduction for other systems
    window._eodBlastReduction = function () {
      return _eodSuitActive ? EOD_BLAST_REDUCTION : 0;
    };

    console.log('[MineSweeper] init — EOD detector ready. M=equip, hold M=suit, E=defuse, Ctrl+M=robot');
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset() {
    _detectedMines  = [];
    _battery        = BATTERY_MAX;
    _setDetectorEquipped(false);
    if (_eodSuitActive) _setEODSuit(false);
    _defusing       = false;
    _defuseTarget   = null;
    _hideDefuseUI();
    _nearestDist    = 999;
    _nearestMine    = null;
    _beepTimer      = 0;
    _mHeld          = false;
    _mHoldTimer     = 0;
    _robotActive    = false;
    _robotTargets   = [];
    if (_robotMesh) {
      var sc = _getScene();
      if (sc) sc.remove(_robotMesh);
      _robotMesh = null;
    }
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    init:         init,
    update:       update,
    registerMine: registerMine,
    reset:        reset
  };

})();
