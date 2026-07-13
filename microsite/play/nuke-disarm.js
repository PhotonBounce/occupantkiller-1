// nuke-disarm.js — NukeDisarm module
// Activation: N+D simultaneous keypress (both within 400ms)
// Underground facility: disarm a nuclear device before 10-minute countdown expires.
// IIFE pattern, var throughout — no let/const.
window.NukeDisarm = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var ACTIVATION_KEYS    = ['KeyN', 'KeyD'];
  var ACTIVATION_WINDOW  = 400;            // ms between the two keys
  var TOTAL_TIME         = 600;            // 10 minutes in seconds
  var BONUS_HACK         = 90;             // seconds added by control panel hack
  var BONUS_MANUAL       = 60;             // seconds added per technical manual
  var PENALTY_WIRE_ORDER = 30;             // seconds lost per wrong wire order
  var INTERACT_RANGE     = 2.5;            // units — proximity needed for E
  var HACK_DURATION      = 20;             // seconds to hack control panel
  var WIRE_DURATION      = 3;             // seconds per wire cut
  var EXTRACT_DURATION   = 15;             // seconds to extract core
  var RADIATION_DAMAGE   = 3;             // HP per second in device room without suit
  var GUARD_COUNT        = 12;
  var COMMANDER_HP       = 250;
  var COMMANDER_SCALE    = 1.3;
  var ALARM_EXTRA_GUARDS = 4;

  // Wire cut correct order indices (0-3)
  var WIRE_CORRECT_ORDER = [0, 2, 1, 3];

  // ── Internal state ─────────────────────────────────────────────────────────
  var _active      = false;
  var _scene       = null;
  var _camera      = null;
  var _renderer    = null;
  var _clock       = null;
  var _animId      = null;
  var _container   = null;
  var _keys        = {};
  var _keyTimes    = {};
  var _nDown       = false;
  var _dDown       = false;
  var _nTime       = 0;
  var _dTime       = 0;

  // Timer
  var _timeLeft    = TOTAL_TIME;
  var _gameOver    = false;
  var _gameWon     = false;

  // Player
  var _playerPos   = { x: 0, y: 1, z: 22 };
  var _playerVel   = { x: 0, y: 0, z: 0 };
  var _playerHP    = 100;
  var _hasHazmat   = false;
  var _coreState   = 'indevice';  // 'indevice' | 'carried' | 'secured'
  var _currentZone = 0;           // which zone (0=entry, 1=sec1, 2=sec2, 3=final)

  // Keycards
  var _keycards    = [false, false, false];  // zone 1,2,3 unlocked

  // Disarm steps
  var _stepDone    = [false, false, false];  // hack, wires, extract
  var _hackProgress    = 0;
  var _hackHolding     = false;
  var _wireProgress    = [0, 0, 0, 0];
  var _wireCut         = [false, false, false, false];
  var _wireCutOrder    = [];
  var _wireHolding     = -1;
  var _extractProgress = 0;
  var _extractHolding  = false;
  var _interactCooldown = 0;

  // Manuals found
  var _manualsFound = 0;
  var _manualUsed   = [false, false, false];

  // Hazmat acquired
  var _hazmatsFound = false;

  // Alarm
  var _alarmTriggered = false;
  var _alarmTimer     = 0;
  var _alarmReinforced = false;

  // HUD / message
  var _hudEl  = null;
  var _msgEl  = null;
  var _msgTimer = 0;

  // ── THREE objects ──────────────────────────────────────────────────────────
  var _facilityGroup  = null;
  var _nukeLight      = null;
  var _nukeMesh       = null;
  var _coreMesh       = null;
  var _containmentMesh = null;
  var _guards         = [];
  var _commander      = null;
  var _controlPanel   = null;
  var _wireSegments   = [];
  var _manuals        = [];
  var _hazmats        = [];
  var _keycardMeshes  = [];
  var _zoneDoors      = [];
  var _zoneDoorStates = [false, false, false];  // open/closed
  var _armory         = null;

  // ── Pulse state ───────────────────────────────────────────────────────────
  var _pulseT      = 0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { window._audioCtx = new Ctx(); return window._audioCtx; }
    } catch (e) {}
    return null;
  }

  function _playTone(freq, dur, vol) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq || 440;
      g.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.1));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (dur || 0.1) + 0.01);
    } catch (e) {}
  }

  function _THREE() { return window.THREE; }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _showMsg(txt, dur) {
    if (!_msgEl) return;
    _msgEl.textContent = txt;
    _msgEl.style.opacity = '1';
    _msgTimer = dur || 3;
  }

  function _padZero(n) { return n < 10 ? '0' + n : '' + n; }

  function _formatTime(secs) {
    var s = Math.max(0, Math.ceil(secs));
    return _padZero(Math.floor(s / 60)) + ':' + _padZero(s % 60);
  }

  function _stepsComplete() {
    return _stepDone[0] && _stepDone[1] && _stepDone[2];
  }

  // ── Scene construction ────────────────────────────────────────────────────
  function _buildScene() {
    var T = _THREE();
    if (!T) return;

    _facilityGroup = new T.Group();
    _scene.add(_facilityGroup);

    // ── Facility floor / walls ──────────────────────────────────────────────
    var floorGeo  = new T.BoxGeometry(35, 0.3, 25);
    var floorMat  = new T.MeshLambertMaterial({ color: 0x334433 });
    var floor     = new T.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.15, 0);
    _facilityGroup.add(floor);

    // Ceiling
    var ceilGeo = new T.BoxGeometry(35, 0.3, 25);
    var ceil    = new T.Mesh(ceilGeo, new T.MeshLambertMaterial({ color: 0x223322 }));
    ceil.position.set(0, 6.15, 0);
    _facilityGroup.add(ceil);

    // Walls (N/S/E/W)
    var wallMat = new T.MeshLambertMaterial({ color: 0x334433 });
    var walls = [
      { w: 35, h: 6, d: 0.3, x: 0,    y: 3, z: -12.5 },
      { w: 35, h: 6, d: 0.3, x: 0,    y: 3, z:  12.5 },
      { w: 0.3, h: 6, d: 25, x: -17.5, y: 3, z: 0    },
      { w: 0.3, h: 6, d: 25, x:  17.5, y: 3, z: 0    }
    ];
    for (var wi = 0; wi < walls.length; wi++) {
      var wl = walls[wi];
      var wg = new T.BoxGeometry(wl.w, wl.h, wl.d);
      var wm = new T.Mesh(wg, wallMat);
      wm.position.set(wl.x, wl.y, wl.z);
      _facilityGroup.add(wm);
    }

    // ── Security zone dividers + doors ─────────────────────────────────────
    // Zone dividers at Z = 4 and Z = -4 (creating 3 bands along Z axis)
    var divPositions = [
      { z: 6, doorX: 0 },
      { z: 0, doorX: 0 },
      { z: -6, doorX: 0 }
    ];
    for (var di = 0; di < divPositions.length; di++) {
      // Left half
      var dg1 = new T.BoxGeometry(14, 6, 0.3);
      var dm1 = new T.Mesh(dg1, new T.MeshLambertMaterial({ color: 0x223322 }));
      dm1.position.set(-10.5, 3, divPositions[di].z);
      _facilityGroup.add(dm1);
      // Right half
      var dg2 = new T.BoxGeometry(14, 6, 0.3);
      var dm2 = new T.Mesh(dg2, new T.MeshLambertMaterial({ color: 0x223322 }));
      dm2.position.set(10.5, 3, divPositions[di].z);
      _facilityGroup.add(dm2);
      // Door (the gap in the middle — represented as a mesh that slides up when unlocked)
      var doorGeo = new T.BoxGeometry(7, 5.5, 0.3);
      var doorMesh = new T.Mesh(doorGeo, new T.MeshLambertMaterial({ color: 0x445544 }));
      doorMesh.position.set(0, 2.75, divPositions[di].z);
      _facilityGroup.add(doorMesh);
      _zoneDoors.push(doorMesh);
    }

    // ── Lighting ──────────────────────────────────────────────────────────
    var ambient = new T.AmbientLight(0x334433, 0.6);
    _scene.add(ambient);

    var topLight = new T.PointLight(0x88AAAA, 0.8, 40);
    topLight.position.set(0, 5, 0);
    _scene.add(topLight);

    // Nuke device pulsing light (in final chamber, Z < -6)
    _nukeLight = new T.PointLight(0xFF4400, 1.2, 10);
    _nukeLight.position.set(0, 2, -10);
    _scene.add(_nukeLight);

    // ── Nuclear device ────────────────────────────────────────────────────
    var nukeGeo = new T.CylinderGeometry(1.5, 1.5, 3, 16);
    var nukeMat = new T.MeshLambertMaterial({ color: 0xCC4400, emissive: 0xCC4400, emissiveIntensity: 0.4 });
    _nukeMesh = new T.Mesh(nukeGeo, nukeMat);
    _nukeMesh.position.set(0, 1.5, -10);
    _facilityGroup.add(_nukeMesh);

    // Plutonium core (inside device, only visible once extracted)
    var coreGeo = new T.CylinderGeometry(0.5, 0.5, 1, 12);
    var coreMat = new T.MeshLambertMaterial({ color: 0x44FF44, emissive: 0x44FF44, emissiveIntensity: 0.5 });
    _coreMesh = new T.Mesh(coreGeo, coreMat);
    _coreMesh.position.set(0, 1.5, -10);
    _coreMesh.visible = false;
    _facilityGroup.add(_coreMesh);

    // Containment box
    var containGeo = new T.BoxGeometry(1.5, 1.5, 1.5);
    var containMat = new T.MeshLambertMaterial({ color: 0x226622 });
    _containmentMesh = new T.Mesh(containGeo, containMat);
    _containmentMesh.position.set(4, 0.75, -10);
    _facilityGroup.add(_containmentMesh);

    // ── Control panel (zone 1, hack step) ────────────────────────────────
    var cpGeo = new T.BoxGeometry(1.5, 1.2, 0.5);
    var cpMat = new T.MeshLambertMaterial({ color: 0x44AAFF });
    _controlPanel = new T.Mesh(cpGeo, cpMat);
    _controlPanel.position.set(-6, 0.6, 4);
    _facilityGroup.add(_controlPanel);

    // ── Detonator wires ───────────────────────────────────────────────────
    var wireColors = [0xFF2200, 0xFF4400, 0xFF6600, 0xFF8800];
    for (var wci = 0; wci < 4; wci++) {
      var pts = [];
      pts.push(new T.Vector3(-0.5, 0, 0));
      pts.push(new T.Vector3( 0.5, 0, 0));
      var wireGeom = new T.BufferGeometry().setFromPoints(pts);
      var wireMat2 = new T.LineBasicMaterial({ color: wireColors[wci], linewidth: 2 });
      var wireLine = new T.LineSegments(wireGeom, wireMat2);
      wireLine.position.set(-2 + wci * 0.4, 0.6 + wci * 0.05, -0.5);
      wireLine.visible = false;  // shown only when panel is hacked
      _facilityGroup.add(wireLine);
      _wireSegments.push(wireLine);
    }

    // Wire panel base (zone 2)
    var wpGeo = new T.BoxGeometry(2, 1, 0.4);
    var wpMat = new T.MeshLambertMaterial({ color: 0x222222 });
    var wpMesh = new T.Mesh(wpGeo, wpMat);
    wpMesh.position.set(-2, 0.5, -3);
    _facilityGroup.add(wpMesh);

    // ── Technical manuals ─────────────────────────────────────────────────
    var manualPositions = [
      { x: 5, y: 0.4, z: 8 },
      { x: -7, y: 0.4, z: 2 },
      { x: 3, y: 0.4, z: -5 }
    ];
    for (var mi = 0; mi < 3; mi++) {
      var mgeo = new T.BoxGeometry(0.4, 0.05, 0.3);
      var mmat = new T.MeshLambertMaterial({ color: 0xFFFFAA });
      var mm   = new T.Mesh(mgeo, mmat);
      mm.position.set(manualPositions[mi].x, manualPositions[mi].y, manualPositions[mi].z);
      _facilityGroup.add(mm);
      _manuals.push(mm);
    }

    // ── Hazmat suit (armory) ──────────────────────────────────────────────
    var armGeo = new T.BoxGeometry(1.5, 0.5, 0.8);
    var armMat = new T.MeshLambertMaterial({ color: 0x334444 });
    _armory = new T.Mesh(armGeo, armMat);
    _armory.position.set(6, 0.25, 5);
    _facilityGroup.add(_armory);

    var hazGeo = new T.BoxGeometry(0.5, 0.8, 0.3);
    var hazMat = new T.MeshLambertMaterial({ color: 0x44AA44 });
    var hazMesh = new T.Mesh(hazGeo, hazMat);
    hazMesh.position.set(6, 0.65, 5);
    _facilityGroup.add(hazMesh);
    _hazmats.push(hazMesh);

    // ── Guards ────────────────────────────────────────────────────────────
    var guardPositions = [
      { x: -4, z: 9 }, { x:  4, z: 9 }, { x: -7, z: 9 }, { x:  7, z: 9 },
      { x: -4, z: 3 }, { x:  4, z: 3 }, { x: -7, z: 3 }, { x:  7, z: 3 },
      { x: -4, z:-3 }, { x:  4, z:-3 }, { x: -2, z:-7 }, { x:  2, z:-7 }
    ];
    // Guards 2 and 7 carry keycards (zone 1 and 2)
    var keycardGuards = [2, 7];
    for (var gi = 0; gi < GUARD_COUNT; gi++) {
      var gPos = guardPositions[gi];
      var gGeo = new T.BoxGeometry(0.7, 1.6, 0.7);
      var gMat = new T.MeshLambertMaterial({ color: 0x334433 });
      var gMesh = new T.Mesh(gGeo, gMat);
      gMesh.position.set(gPos.x, 0.8, gPos.z);
      _facilityGroup.add(gMesh);

      var hasKeycard = false;
      for (var ki = 0; ki < keycardGuards.length; ki++) {
        if (keycardGuards[ki] === gi) { hasKeycard = true; break; }
      }
      var keycardLevel = hasKeycard ? (ki + 1) : 0;

      var kcMesh = null;
      if (hasKeycard) {
        var kcGeo = new T.BoxGeometry(0.15, 0.25, 0.05);
        var kcMat = new T.MeshLambertMaterial({ color: 0x44FF44 });
        kcMesh = new T.Mesh(kcGeo, kcMat);
        kcMesh.position.set(gPos.x + 0.4, 0.8, gPos.z);
        _facilityGroup.add(kcMesh);
        _keycardMeshes.push(kcMesh);
      }

      _guards.push({
        mesh: gMesh,
        hp: 100,
        alive: true,
        pos: { x: gPos.x, y: 0.8, z: gPos.z },
        state: 'patrol',
        patrolT: Math.random() * Math.PI * 2,
        hasKeycard: hasKeycard,
        keycardLevel: keycardLevel,
        keycardDropped: false,
        kcMesh: kcMesh,
        tranqed: false,
        tranqTimer: 0
      });
    }

    // ── Commander ─────────────────────────────────────────────────────────
    var cmdGeo = new T.BoxGeometry(
      0.7 * COMMANDER_SCALE,
      1.6 * COMMANDER_SCALE,
      0.7 * COMMANDER_SCALE
    );
    var cmdMat = new T.MeshLambertMaterial({ color: 0x223322 });
    _commander = {
      mesh: new T.Mesh(cmdGeo, cmdMat),
      hp: COMMANDER_HP,
      alive: true,
      pos: { x: 1, y: 1.04, z: -8 },
      state: 'patrol',
      patrolT: 0,
      hasKeycard: true,
      keycardLevel: 3,
      keycardDropped: false,
      kcMesh: null,
      tranqed: false,
      tranqTimer: 0
    };
    _commander.mesh.position.set(1, 1.04, -8);
    _facilityGroup.add(_commander.mesh);

    // Commander keycard mesh
    var cmdKcGeo = new T.BoxGeometry(0.2, 0.3, 0.05);
    var cmdKcMat = new T.MeshLambertMaterial({ color: 0x44FF44 });
    _commander.kcMesh = new T.Mesh(cmdKcGeo, cmdKcMat);
    _commander.kcMesh.position.set(1.5, 1.04, -8);
    _facilityGroup.add(_commander.kcMesh);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _container = document.createElement('div');
    _container.id = 'nuke-disarm-container';
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:900;font-family:monospace;';
    document.body.appendChild(_container);

    _hudEl = document.createElement('div');
    _hudEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#44FF44',
      'padding:6px 14px',
      'border:1px solid #44FF44',
      'font-size:13px',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    _container.appendChild(_hudEl);

    _msgEl = document.createElement('div');
    _msgEl.style.cssText = [
      'position:absolute',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#FFFFFF',
      'padding:8px 18px',
      'border:1px solid #44FF44',
      'font-size:15px',
      'opacity:0',
      'transition:opacity 0.3s'
    ].join(';');
    _container.appendChild(_msgEl);

    // Health bar
    var hpBar = document.createElement('div');
    hpBar.id = 'nd-hp-bar';
    hpBar.style.cssText = [
      'position:absolute',
      'bottom:60px',
      'left:20px',
      'background:rgba(0,0,0,0.7)',
      'color:#FF4444',
      'padding:4px 10px',
      'border:1px solid #FF4444',
      'font-size:12px'
    ].join(';');
    hpBar.textContent = 'HP: 100';
    _container.appendChild(hpBar);

    // Radiation indicator
    var radDiv = document.createElement('div');
    radDiv.id = 'nd-rad';
    radDiv.style.cssText = [
      'position:absolute',
      'bottom:90px',
      'left:20px',
      'background:rgba(0,0,0,0.7)',
      'color:#AAFF44',
      'padding:4px 10px',
      'border:1px solid #AAFF44',
      'font-size:12px',
      'display:none'
    ].join(';');
    radDiv.textContent = 'RADIATION EXPOSURE';
    _container.appendChild(radDiv);

    // Controls hint
    var ctrl = document.createElement('div');
    ctrl.style.cssText = [
      'position:absolute',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#AAAAAA',
      'padding:4px 12px',
      'font-size:11px'
    ].join(';');
    ctrl.textContent = 'WASD:Move  E:Interact  F:Shoot  T:Tranq Dart  ESC:Exit';
    _container.appendChild(ctrl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var stepsStr = (_stepDone[0] ? '1' : '-') + '/' + (_stepDone[1] ? '2' : '-') + '/' + (_stepDone[2] ? '3' : '-');
    var stepCount = (_stepDone[0] ? 1 : 0) + (_stepDone[1] ? 1 : 0) + (_stepDone[2] ? 1 : 0);
    var aliveGuards = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      if (_guards[gi].alive) aliveGuards++;
    }
    if (_commander && _commander.alive) aliveGuards++;

    var radPct = _inRadiationZone() ? Math.round((1 - (_playerHP / 100)) * 100) : 0;

    var coreStr;
    if (_coreState === 'indevice') coreStr = 'IN DEVICE';
    else if (_coreState === 'carried') coreStr = 'CARRIED';
    else coreStr = 'SECURED';

    var timeColor = _timeLeft < 60 ? '#FF4400' : (_timeLeft < 180 ? '#FFAA00' : '#44FF44');
    _hudEl.style.color = timeColor;
    _hudEl.style.borderColor = timeColor;

    _hudEl.textContent = 'DISARM [TIME: ' + _formatTime(_timeLeft) + '] [ZONE: ' + _currentZone + '/3] [STEPS: ' + stepCount + '/3] [RADIATION: ' + radPct + '%] [GUARDS: ' + aliveGuards + '] | CORE: ' + coreStr;

    var hpBar = document.getElementById('nd-hp-bar');
    if (hpBar) hpBar.textContent = 'HP: ' + Math.max(0, Math.round(_playerHP));

    var radDiv = document.getElementById('nd-rad');
    if (radDiv) {
      if (_inRadiationZone() && !_hasHazmat) {
        radDiv.style.display = 'block';
      } else {
        radDiv.style.display = 'none';
      }
    }
  }

  // ── Interaction helpers ──────────────────────────────────────────────────
  function _inRadiationZone() {
    // Final chamber (z < -6) has radiation
    return _playerPos.z < -6;
  }

  function _getZoneForZ(z) {
    if (z > 6)  return 0;
    if (z > 0)  return 1;
    if (z > -6) return 2;
    return 3;
  }

  function _tryInteract() {
    if (_interactCooldown > 0) return;

    // Check hazmat
    if (!_hasHazmat) {
      for (var hi = 0; hi < _hazmats.length; hi++) {
        var haz = _hazmats[hi];
        if (!haz.visible) continue;
        var hdx = _playerPos.x - haz.position.x;
        var hdz = _playerPos.z - haz.position.z;
        if (Math.sqrt(hdx*hdx + hdz*hdz) < INTERACT_RANGE) {
          _hasHazmat = true;
          haz.visible = false;
          _showMsg('Hazmat suit acquired! Radiation shielded.', 3);
          _interactCooldown = 0.5;
          return;
        }
      }
    }

    // Check manuals
    for (var mi = 0; mi < _manuals.length; mi++) {
      if (_manualUsed[mi]) continue;
      var mn = _manuals[mi];
      if (!mn.visible) continue;
      var mdx = _playerPos.x - mn.position.x;
      var mdz = _playerPos.z - mn.position.z;
      if (Math.sqrt(mdx*mdx + mdz*mdz) < INTERACT_RANGE) {
        _manualUsed[mi] = true;
        mn.visible = false;
        _manualsFound++;
        _timeLeft += BONUS_MANUAL;
        _showMsg('Technical manual! +60 seconds added to timer.', 3);
        _interactCooldown = 0.5;
        return;
      }
    }

    // Check keycard drops from guards
    _tryPickupKeycard();

    // Check zone door interaction (with keycards)
    // Doors are auto-opened when player approaches with keycard — handled in update

    // Step 1: Hack control panel
    if (!_stepDone[0]) {
      var cpPos = _controlPanel.position;
      var cpdx = _playerPos.x - cpPos.x;
      var cpdz = _playerPos.z - cpPos.z;
      if (Math.sqrt(cpdx*cpdx + cpdz*cpdz) < INTERACT_RANGE) {
        _hackHolding = true;
        _showMsg('Hacking control panel... hold E (' + Math.round(HACK_DURATION - _hackProgress) + 's remaining)', 2);
        return;
      }
    }

    // Step 2: Cut wires (after step 1 done)
    if (_stepDone[0] && !_stepDone[1]) {
      for (var wsi = 0; wsi < _wireSegments.length; wsi++) {
        if (_wireCut[wsi]) continue;
        var ws = _wireSegments[wsi];
        if (!ws.visible) continue;
        var wsdx = _playerPos.x - ws.position.x;
        var wsdz = _playerPos.z - ws.position.z;
        if (Math.sqrt(wsdx*wsdx + wsdz*wsdz) < INTERACT_RANGE) {
          _wireHolding = wsi;
          _showMsg('Cutting wire ' + (wsi + 1) + '... hold E', 2);
          return;
        }
      }
    }

    // Step 3: Extract core (after wires done)
    if (_stepDone[1] && !_stepDone[2]) {
      if (_coreState === 'indevice') {
        var ndx = _playerPos.x - _nukeMesh.position.x;
        var ndz = _playerPos.z - _nukeMesh.position.z;
        if (Math.sqrt(ndx*ndx + ndz*ndz) < INTERACT_RANGE) {
          _extractHolding = true;
          _showMsg('Extracting plutonium core... hold E', 2);
          return;
        }
      }
      // Deposit core at containment
      if (_coreState === 'carried') {
        var cdx = _playerPos.x - _containmentMesh.position.x;
        var cdz = _playerPos.z - _containmentMesh.position.z;
        if (Math.sqrt(cdx*cdx + cdz*cdz) < INTERACT_RANGE) {
          _coreState = 'secured';
          _stepDone[2] = true;
          _coreMesh.position.copy(_containmentMesh.position);
          _coreMesh.position.y = 1.5;
          _showMsg('Core secured in containment! DISARM COMPLETE!', 5);
          _playTone(880, 0.5, 0.3);
          _checkWin();
          return;
        }
      }
    }
  }

  function _tryPickupKeycard() {
    // Check dropped keycards on the floor
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.hasKeycard || !g.alive || g.keycardDropped) continue;
      // keycards only collectable from dead/tranqed guards
      if (g.alive && !g.tranqed) continue;
      var gdx = _playerPos.x - g.pos.x;
      var gdz = _playerPos.z - g.pos.z;
      if (Math.sqrt(gdx*gdx + gdz*gdz) < INTERACT_RANGE) {
        _keycards[g.keycardLevel - 1] = true;
        g.keycardDropped = true;
        if (g.kcMesh) g.kcMesh.visible = false;
        _showMsg('Keycard L' + g.keycardLevel + ' acquired!', 3);
        _interactCooldown = 0.3;
        return;
      }
    }
    // Commander
    if (_commander && _commander.hasKeycard && !_commander.keycardDropped) {
      if (_commander.tranqed || !_commander.alive) {
        var cdx2 = _playerPos.x - _commander.pos.x;
        var cdz2 = _playerPos.z - _commander.pos.z;
        if (Math.sqrt(cdx2*cdx2 + cdz2*cdz2) < INTERACT_RANGE) {
          _keycards[2] = true;
          _commander.keycardDropped = true;
          if (_commander.kcMesh) _commander.kcMesh.visible = false;
          _showMsg('Commander keycard L3 acquired!', 3);
          _interactCooldown = 0.3;
        }
      }
    }
  }

  function _tryShoot() {
    // Shooting triggers alarm — spawns 4 extra guards
    if (!_alarmTriggered) {
      _alarmTriggered = true;
      _spawnAlarmGuards();
      _showMsg('ALARM! Reinforcements incoming!', 4);
    }
    // Hit nearest guard in range
    var best = null;
    var bestD = 4;
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive) continue;
      var d = _dist2(_playerPos, g.pos);
      if (d < bestD) { best = g; bestD = d; }
    }
    if (!best && _commander && _commander.alive) {
      var cd = _dist2(_playerPos, _commander.pos);
      if (cd < 4) best = _commander;
    }
    if (best) {
      best.hp -= 34;
      _playTone(220, 0.05, 0.2);
      if (best.hp <= 0) {
        best.alive = false;
        best.mesh.visible = false;
        if (best.kcMesh) {
          // Drop keycard on ground
          best.kcMesh.position.y = 0.2;
        }
      }
    }
  }

  function _tryTranq() {
    // Tranq dart — silent takedown
    var best = null;
    var bestD = 5;
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive || g.tranqed) continue;
      var d = _dist2(_playerPos, g.pos);
      if (d < bestD) { best = g; bestD = d; }
    }
    if (!best && _commander && _commander.alive && !_commander.tranqed) {
      if (_dist2(_playerPos, _commander.pos) < 5) best = _commander;
    }
    if (best) {
      best.tranqed = true;
      best.tranqTimer = 30;
      best.state = 'down';
      _showMsg('Guard tranquilized!', 2);
    }
  }

  function _spawnAlarmGuards() {
    if (_alarmReinforced) return;
    _alarmReinforced = true;
    var T = _THREE();
    if (!T) return;
    var spawnPts = [
      { x: -3, z: 11 }, { x:  3, z: 11 },
      { x: -3, z: 10 }, { x:  3, z: 10 }
    ];
    for (var si = 0; si < ALARM_EXTRA_GUARDS; si++) {
      var sp = spawnPts[si];
      var ggeo = new T.BoxGeometry(0.7, 1.6, 0.7);
      var gmat = new T.MeshLambertMaterial({ color: 0x553333 });
      var gmesh = new T.Mesh(ggeo, gmat);
      gmesh.position.set(sp.x, 0.8, sp.z);
      _facilityGroup.add(gmesh);
      _guards.push({
        mesh: gmesh,
        hp: 100,
        alive: true,
        pos: { x: sp.x, y: 0.8, z: sp.z },
        state: 'hostile',
        patrolT: 0,
        hasKeycard: false,
        keycardLevel: 0,
        keycardDropped: false,
        kcMesh: null,
        tranqed: false,
        tranqTimer: 0
      });
    }
  }

  function _checkWin() {
    if (_stepsComplete()) {
      _gameWon = true;
      _gameOver = true;
      _showEndScreen(true);
    }
  }

  // ── Update loop ───────────────────────────────────────────────────────────
  function _update(dt) {
    if (_gameOver) return;

    // Timer countdown
    _timeLeft -= dt;
    if (_timeLeft <= 0) {
      _timeLeft = 0;
      _gameOver = true;
      _playTone(110, 1.5, 0.5);
      _showMsg('DETONATION! MISSION FAILED.', 10);
      _showEndScreen(false);
      return;
    }

    // Player movement
    var spd = 5;
    if (_keys['KeyW'] || _keys['ArrowUp'])    _playerVel.z = -spd;
    else if (_keys['KeyS'] || _keys['ArrowDown'])  _playerVel.z =  spd;
    else _playerVel.z = 0;
    if (_keys['KeyA'] || _keys['ArrowLeft'])  _playerVel.x = -spd;
    else if (_keys['KeyD'] || _keys['ArrowRight']) _playerVel.x =  spd;
    else _playerVel.x = 0;

    var nx = _playerPos.x + _playerVel.x * dt;
    var nz = _playerPos.z + _playerVel.z * dt;

    // Clamp to facility bounds
    nx = Math.max(-16.8, Math.min(16.8, nx));
    nz = Math.max(-12, Math.min(12, nz));

    // Zone door collision
    var newZone = _getZoneForZ(nz);
    var zoneAllowed = _canEnterZone(newZone);
    if (!zoneAllowed && newZone > _currentZone) {
      nz = _playerPos.z;  // blocked
      if (!_zoneDoorStates[newZone - 1]) {
        _showMsg('Zone ' + newZone + ' locked — need L' + newZone + ' keycard', 2);
      }
    } else {
      if (newZone !== _currentZone) {
        _currentZone = newZone;
      }
    }

    _playerPos.x = nx;
    _playerPos.z = nz;

    // Update camera to follow player
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 5, _playerPos.z + 10);
      _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);
    }

    // Zone door open animations
    for (var di = 0; di < 3; di++) {
      if (_keycards[di] && !_zoneDoorStates[di]) {
        _zoneDoorStates[di] = true;
        // Slide door up
        _zoneDoors[di].position.y = 8;
        _showMsg('Zone ' + (di + 1) + ' door unlocked!', 2);
      }
    }

    // Radiation damage
    if (_inRadiationZone() && !_hasHazmat) {
      _playerHP -= RADIATION_DAMAGE * dt;
      if (_playerHP <= 0) {
        _playerHP = 0;
        _gameOver = true;
        _showMsg('Radiation killed you! MISSION FAILED.', 5);
        _showEndScreen(false);
        return;
      }
    }

    // Message timer
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _msgEl) {
        _msgEl.style.opacity = '0';
      }
    }

    // Interaction cooldown
    if (_interactCooldown > 0) _interactCooldown -= dt;

    // Hack progress
    if (_hackHolding && !_stepDone[0]) {
      _hackProgress += dt;
      if (_hackProgress >= HACK_DURATION) {
        _stepDone[0] = true;
        _hackHolding = false;
        _timeLeft += BONUS_HACK;
        _controlPanel.material.color.setHex(0x22FF22);
        // Reveal wires
        for (var wsi = 0; wsi < _wireSegments.length; wsi++) {
          _wireSegments[wsi].visible = true;
          _wireSegments[wsi].position.set(-2 + wsi * 0.4, 0.6, -2.5);
        }
        _showMsg('Control panel hacked! +90s added. Now cut the wires!', 4);
        _playTone(660, 0.3, 0.2);
      }
    } else {
      _hackHolding = false;
    }

    // Wire cutting progress
    if (_wireHolding >= 0 && _stepDone[0] && !_stepDone[1]) {
      var wIdx = _wireHolding;
      _wireProgress[wIdx] += dt;
      if (_wireProgress[wIdx] >= WIRE_DURATION) {
        // Check order
        var expectedIdx = _wireCutOrder.length;
        var expectedWire = WIRE_CORRECT_ORDER[expectedIdx];
        _wireCut[wIdx] = true;
        _wireSegments[wIdx].visible = false;
        _wireCutOrder.push(wIdx);
        _wireHolding = -1;
        if (wIdx !== expectedWire) {
          // Wrong order penalty
          _timeLeft = Math.max(0, _timeLeft - PENALTY_WIRE_ORDER);
          _showMsg('Wrong wire order! -30s penalty!', 3);
          _playTone(110, 0.3, 0.3);
        } else {
          _showMsg('Wire ' + (wIdx + 1) + ' cut correctly!', 2);
          _playTone(550, 0.1, 0.2);
        }
        // Check all cut
        var allCut = true;
        for (var ci = 0; ci < 4; ci++) {
          if (!_wireCut[ci]) { allCut = false; break; }
        }
        if (allCut) {
          _stepDone[1] = true;
          _showMsg('All wires cut! Now extract the plutonium core!', 4);
          _coreMesh.visible = true;
        }
      }
    } else {
      _wireHolding = -1;
    }

    // Extraction progress
    if (_extractHolding && _stepDone[1] && !_stepDone[2] && _coreState === 'indevice') {
      _extractProgress += dt;
      if (_extractProgress >= EXTRACT_DURATION) {
        _coreState = 'carried';
        _extractHolding = false;
        _coreMesh.position.set(_playerPos.x, _playerPos.y + 0.5, _playerPos.z);
        _showMsg('Core extracted! Carry it to the containment box!', 4);
        _playTone(770, 0.2, 0.2);
      }
    } else {
      _extractHolding = false;
    }

    // Move carried core with player
    if (_coreState === 'carried' && _coreMesh) {
      _coreMesh.position.set(_playerPos.x + 0.5, _playerPos.y + 0.5, _playerPos.z);
    }

    // Update guards
    _updateGuards(dt);

    // Nuke light pulse
    _pulseT += dt;
    var urgency = 1 - (_timeLeft / TOTAL_TIME);
    var pulseSpeed = 1 + urgency * 8;
    var pulseBright = 0.6 + Math.abs(Math.sin(_pulseT * pulseSpeed)) * 1.4;
    if (_nukeLight) {
      _nukeLight.intensity = pulseBright;
    }

    // Nuke mesh emissive flicker
    if (_nukeMesh) {
      _nukeMesh.material.emissiveIntensity = 0.2 + Math.abs(Math.sin(_pulseT * pulseSpeed * 0.7)) * 0.6;
    }

    _updateHUD();
  }

  function _canEnterZone(zone) {
    if (zone === 0) return true;
    if (zone === 1) return _keycards[0] || _currentZone >= 1;
    if (zone === 2) return _keycards[1] || _currentZone >= 2;
    if (zone === 3) return _keycards[2] || _currentZone >= 3;
    return false;
  }

  function _updateGuards(dt) {
    var allGuards = _guards.slice();
    if (_commander && _commander.alive) allGuards.push(_commander);

    for (var gi = 0; gi < allGuards.length; gi++) {
      var g = allGuards[gi];
      if (!g.alive) continue;

      // Tranq timer
      if (g.tranqed) {
        g.tranqTimer -= dt;
        if (g.tranqTimer <= 0) {
          g.tranqed = false;
          g.state = 'hostile';
        }
        // While tranqed, player can take keycard
        continue;
      }

      // Guard AI
      if (g.state === 'patrol') {
        g.patrolT += dt * 0.5;
        var px = g.pos.x + Math.sin(g.patrolT) * 2;
        var pz = g.pos.z + Math.cos(g.patrolT * 0.7) * 1.5;
        g.pos.x = px;
        g.pos.z = pz;
        g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
        if (g.kcMesh) g.kcMesh.position.set(g.pos.x + 0.4, g.pos.y, g.pos.z);

        // Detect player
        if (_dist2(_playerPos, g.pos) < 4) {
          g.state = 'hostile';
        }
      } else if (g.state === 'hostile') {
        // Chase player
        var dx = _playerPos.x - g.pos.x;
        var dz = _playerPos.z - g.pos.z;
        var d  = Math.sqrt(dx*dx + dz*dz);
        if (d > 0.5) {
          g.pos.x += (dx / d) * 3 * dt;
          g.pos.z += (dz / d) * 3 * dt;
          g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
          if (g.kcMesh) g.kcMesh.position.set(g.pos.x + 0.4, g.pos.y, g.pos.z);
        }
        // Attack
        if (d < 1.2) {
          _playerHP -= 15 * dt;
          if (_playerHP <= 0) {
            _playerHP = 0;
            _gameOver = true;
            _showMsg('You were killed! MISSION FAILED.', 5);
            _showEndScreen(false);
            return;
          }
        }
      }
    }
  }

  // ── End screen ────────────────────────────────────────────────────────────
  function _showEndScreen(won) {
    var div = document.createElement('div');
    div.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.88)',
      'color:' + (won ? '#44FF44' : '#FF4400'),
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'font-size:28px',
      'z-index:9999',
      'pointer-events:all'
    ].join(';');
    div.innerHTML = (won
      ? '<div>MISSION COMPLETE</div><div style="font-size:16px;margin-top:16px;color:#AAFFAA">Nuke disarmed. World saved.</div>'
      : '<div>MISSION FAILED</div><div style="font-size:16px;margin-top:16px;color:#FFAAAA">' + (_timeLeft <= 0 ? 'Countdown reached zero. Detonation.' : 'Operative eliminated.') + '</div>'
    ) + '<button style="margin-top:28px;padding:10px 28px;font-size:15px;cursor:pointer;background:#222;color:#CCC;border:1px solid #888;" id="nd-exit-btn">Exit</button>';
    document.body.appendChild(div);
    var btn = document.getElementById('nd-exit-btn');
    if (btn) btn.addEventListener('click', function () { _deactivate(); });
  }

  // ── Input handling ────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;

    // Activation hotkey detection (N+D within 400ms)
    if (!_active) {
      if (e.code === 'KeyN') { _nDown = true; _nTime = Date.now(); }
      if (e.code === 'KeyD') { _dDown = true; _dTime = Date.now(); }
      if (_nDown && _dDown) {
        var diff = Math.abs(_nTime - _dTime);
        if (diff <= ACTIVATION_WINDOW) {
          _activate();
        }
      }
      return;
    }

    if (e.code === 'Escape') { _deactivate(); return; }

    if (e.code === 'KeyE') {
      _tryInteract();
    }
    if (e.code === 'KeyF') {
      _tryShoot();
    }
    if (e.code === 'KeyT') {
      _tryTranq();
    }
  }

  function _onKeyUp(e) {
    delete _keys[e.code];
    if (e.code === 'KeyN') _nDown = false;
    if (e.code === 'KeyD') _dDown = false;

    if (!_active) return;
    // Release interaction holds
    if (e.code === 'KeyE') {
      _hackHolding = false;
      _wireHolding = -1;
      _extractHolding = false;
    }
  }

  // ── Activate / Deactivate ────────────────────────────────────────────────
  function _activate() {
    if (_active) return;
    _active = true;

    var T = _THREE();
    if (!T) {
      console.warn('[NukeDisarm] THREE not found');
      _active = false;
      return;
    }

    // Canvas
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:800;';
    document.body.appendChild(canvas);

    _renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setClearColor(0x111111);

    _scene = new T.Scene();
    _scene.fog = new T.Fog(0x111111, 15, 40);

    _camera = new T.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
    _camera.position.set(0, 6, 12);
    _camera.lookAt(0, 0, 0);

    _clock = new T.Clock();

    // Reset state
    _timeLeft    = TOTAL_TIME;
    _gameOver    = false;
    _gameWon     = false;
    _playerPos   = { x: 0, y: 1, z: 22 };
    _playerVel   = { x: 0, y: 0, z: 0 };
    _playerHP    = 100;
    _hasHazmat   = false;
    _coreState   = 'indevice';
    _currentZone = 0;
    _keycards    = [false, false, false];
    _stepDone    = [false, false, false];
    _hackProgress    = 0;
    _hackHolding     = false;
    _wireProgress    = [0, 0, 0, 0];
    _wireCut         = [false, false, false, false];
    _wireCutOrder    = [];
    _wireHolding     = -1;
    _extractProgress = 0;
    _extractHolding  = false;
    _interactCooldown = 0;
    _manualsFound    = 0;
    _manualUsed      = [false, false, false];
    _hazmatsFound    = false;
    _alarmTriggered  = false;
    _alarmReinforced = false;
    _alarmTimer      = 0;
    _guards          = [];
    _commander       = null;
    _zoneDoors       = [];
    _zoneDoorStates  = [false, false, false];
    _wireSegments    = [];
    _manuals         = [];
    _hazmats         = [];
    _keycardMeshes   = [];
    _pulseT          = 0;
    _msgTimer        = 0;

    _buildScene();
    _buildHUD();

    _showMsg('NUKE DISARM — 10 minutes. Find keycards, hack panel, cut wires, extract core.', 6);

    function _loop() {
      _animId = requestAnimationFrame(_loop);
      var dt = _clock.getDelta();
      dt = Math.min(dt, 0.05);
      _update(dt);
      _renderer.render(_scene, _camera);
    }
    _loop();
  }

  function _deactivate() {
    _active = false;
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (_renderer) {
      _renderer.domElement.parentNode && _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      _renderer.dispose();
      _renderer = null;
    }
    if (_container) {
      _container.parentNode && _container.parentNode.removeChild(_container);
      _container = null;
    }
    // Remove any end screens
    var btn = document.getElementById('nd-exit-btn');
    if (btn && btn.parentNode) btn.parentNode.parentNode && btn.parentNode.parentNode.removeChild(btn.parentNode);
    _scene = null;
    _camera = null;
    _clock = null;
    _hudEl = null;
    _msgEl = null;
    _guards = [];
    _commander = null;
  }

  // ── Window resize ─────────────────────────────────────────────────────────
  function _onResize() {
    if (!_active || !_renderer || !_camera) return;
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  window.addEventListener('keydown', _onKeyDown);
  window.addEventListener('keyup',   _onKeyUp);
  window.addEventListener('resize',  _onResize);

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    activate:   _activate,
    deactivate: _deactivate,
    isActive:   function () { return _active; }
  };

}());
