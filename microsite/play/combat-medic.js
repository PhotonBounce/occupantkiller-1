// combat-medic.js — Personal medic kit with wound zones, bleeding, and field medicine
// Browser-based — IIFE, all var (no let/const), Three.js as global THREE
//
// Public API:
//   CombatMedic.init(scene, camera, renderer)
//   CombatMedic.update(delta, allies)
//   CombatMedic.reset()

window.CombatMedic = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants
  var ZONE_HEAD       = 0;
  var ZONE_TORSO      = 1;
  var ZONE_LEFT_ARM   = 2;
  var ZONE_RIGHT_ARM  = 3;

  var HP_MAX           = 25;
  var BLEED_INTERVAL   = 5;      // seconds between bleed ticks
  var BLEED_DMG        = 1;      // HP lost per bleed tick
  var BANDAGE_TIME     = 3;      // seconds to apply bandage
  var BANDAGE_HEAL     = 15;     // HP healed by bandage
  var MORPHINE_DUR     = 60;     // seconds morphine lasts
  var MORPHINE_MOVE_PENALTY = 5; // HP penalty suppressed by morphine
  var IV_DUR           = 30;     // seconds IV drip takes
  var IV_TARGET_PCT    = 0.5;    // IV restores zones to 50% HP
  var DEFIB_CHARGE     = 0.8;    // seconds charge time
  var CPR_TIME         = 5;      // seconds CPR animation
  var CPR_RANGE        = 2;      // units range for CPR
  var CPR_CHANCE       = 0.7;    // 70% revive chance
  var DOUBLE_TAP_WIN   = 0.4;    // seconds window for double-tap M
  var VIGNETTE_MAX     = 80;     // max vignette shadow px

  var COLOR_HEALTHY   = '#22CC44';
  var COLOR_WOUNDED   = '#FFDD00';
  var COLOR_CRITICAL  = '#FF2222';
  var COLOR_DEAD      = '#444444';

  // ─────────────────────────────────────────────── state
  var _scene      = null;
  var _camera     = null;
  var _renderer   = null;

  // inventory
  var _inv = {
    bandages:      5,
    morphine:      2,
    tourniquet:    3,
    ivBag:         1,
    defibrillator: 1
  };

  // wound zones
  var _zones = [
    { name: 'Head',      hp: 25, maxHp: 25, bleeding: false, tourniquetApplied: false },
    { name: 'Torso',     hp: 25, maxHp: 25, bleeding: false, tourniquetApplied: false },
    { name: 'Left Arm',  hp: 25, maxHp: 25, bleeding: false, tourniquetApplied: false },
    { name: 'Right Arm', hp: 25, maxHp: 25, bleeding: false, tourniquetApplied: false }
  ];

  var _menuOpen        = false;
  var _selectedZone    = 0;

  var _morphineActive  = false;
  var _morphineTimer   = 0;

  var _isBandaging     = false;
  var _bandageTimer    = 0;
  var _bandageZone     = -1;

  var _ivActive        = false;
  var _ivTimer         = 0;

  var _isDead          = false;
  var _defibCharging   = false;
  var _defibTimer      = 0;

  var _bleedTimer      = 0;

  var _mPressTime      = 0;
  var _mPressCount     = 0;

  var _fKeyDown        = false;
  var _cprTarget       = null;
  var _cprTimer        = 0;
  var _isCpr           = false;

  var _keysDown        = {};

  // DOM
  var _hudEl           = null;
  var _vignetteEl      = null;
  var _kitMenuEl       = null;
  var _toastEl         = null;
  var _bodyDiagramEl   = null;
  var _inventoryEl     = null;

  // Three.js meshes
  var _tourniquetLeft  = null;
  var _tourniquetRight = null;
  var _ivBagMesh       = null;
  var _ivTubeLine      = null;

  // AudioContext
  var _audioCtx        = null;

  // ─────────────────────────────────────────────── DOM helpers
  function _el(id, tag, styles, parent) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag || 'div');
      el.id = id;
      (parent || document.body).appendChild(el);
    }
    Object.assign(el.style, styles || {});
    return el;
  }

  // ─────────────────────────────────────────────── audio
  function _playDefibSound() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    var osc  = _audioCtx.createOscillator();
    var gain = _audioCtx.createGain();
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.frequency.setValueAtTime(60, _audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, _audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.5, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.8);
    osc.start(_audioCtx.currentTime);
    osc.stop(_audioCtx.currentTime + 0.8);
  }

  // ─────────────────────────────────────────────── HUD creation
  function _createVignette() {
    _vignetteEl = _el('cm-vignette', 'div', {
      position:      'fixed',
      top:           '0',
      left:          '0',
      width:         '100%',
      height:        '100%',
      pointerEvents: 'none',
      zIndex:        '990',
      boxShadow:     'inset 0 0 0px rgba(200,0,0,0)',
      transition:    'box-shadow 0.3s'
    });
  }

  function _createHUD() {
    _hudEl = _el('cm-hud', 'div', {
      position:   'fixed',
      bottom:     '14px',
      right:      '14px',
      fontFamily: 'monospace',
      fontSize:   '13px',
      color:      '#fff',
      background: 'rgba(0,0,0,0.75)',
      padding:    '8px 14px',
      borderRadius: '7px',
      border:     '1px solid #CC3333',
      zIndex:     '3100',
      pointerEvents: 'none',
      minWidth:   '160px'
    });

    _toastEl = _el('cm-toast', 'div', {
      position:   'fixed',
      top:        '22%',
      left:       '50%',
      transform:  'translateX(-50%)',
      fontFamily: 'monospace',
      fontSize:   '15px',
      color:      '#ff4444',
      background: 'rgba(0,0,0,0.82)',
      padding:    '7px 18px',
      borderRadius: '6px',
      zIndex:     '3300',
      pointerEvents: 'none',
      display:    'none',
      whiteSpace: 'nowrap'
    });
  }

  function _createKitMenu() {
    _kitMenuEl = _el('cm-kit-menu', 'div', {
      position:   'fixed',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%, -50%)',
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#fff',
      background: 'rgba(10,10,10,0.93)',
      padding:    '16px 24px',
      borderRadius: '10px',
      border:     '2px solid #CC3333',
      zIndex:     '4000',
      display:    'none',
      minWidth:   '320px'
    });

    // body diagram container
    _bodyDiagramEl = _el('cm-body-diagram', 'div', {
      margin:     '0 auto 12px auto',
      textAlign:  'center',
      lineHeight: '1.6'
    }, _kitMenuEl);

    // inventory grid
    _inventoryEl = _el('cm-inventory', 'div', {
      borderTop:  '1px solid #555',
      marginTop:  '10px',
      paddingTop: '8px'
    }, _kitMenuEl);

    // controls hint
    var hintEl = _el('cm-kit-hint', 'div', {
      borderTop:  '1px solid #555',
      marginTop:  '10px',
      paddingTop: '8px',
      color:      '#aaa',
      fontSize:   '12px'
    }, _kitMenuEl);
    hintEl.innerHTML =
      '[B] Bandage zone &nbsp;[T] Tourniquet (arm)<br>' +
      '[M+M] Morphine &nbsp;&nbsp;[I] IV Bag<br>' +
      '[D] Defibrillator &nbsp;[F+M] CPR ally<br>' +
      '[1-4] Select zone &nbsp;[M] Close';
  }

  // ─────────────────────────────────────────────── Three.js meshes
  function _createTourniquetMesh(isLeft) {
    var geo  = new THREE.BoxGeometry(0.08, 0.06, 0.22);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    if (_scene) _scene.add(mesh);
    return mesh;
  }

  function _createIVMeshes() {
    // IV bag — small box above player
    var bagGeo  = new THREE.BoxGeometry(0.15, 0.22, 0.08);
    var bagMat  = new THREE.MeshLambertMaterial({ color: 0xCCEEFF, transparent: true, opacity: 0.75 });
    _ivBagMesh  = new THREE.Mesh(bagGeo, bagMat);
    _ivBagMesh.visible = false;
    if (_scene) _scene.add(_ivBagMesh);

    // Tube — LineSegments from bag to arm position
    var tubePts = new Float32Array(6); // 2 points × 3 coords
    var tubeGeo = new THREE.BufferGeometry();
    tubeGeo.setAttribute('position', new THREE.BufferAttribute(tubePts, 3));
    var tubeMat  = new THREE.LineBasicMaterial({ color: 0x88CCFF });
    _ivTubeLine  = new THREE.LineSegments(tubeGeo, tubeMat);
    _ivTubeLine.visible = false;
    if (_scene) _scene.add(_ivTubeLine);
  }

  // ─────────────────────────────────────────────── helpers
  function _totalHP() {
    var total = 0;
    for (var i = 0; i < _zones.length; i++) {
      total += _zones[i].hp;
    }
    return total;
  }

  function _maxHP() {
    return _zones.length * HP_MAX;
  }

  function _isArmZone(zoneIdx) {
    return zoneIdx === ZONE_LEFT_ARM || zoneIdx === ZONE_RIGHT_ARM;
  }

  function _isAnyBleeding() {
    for (var i = 0; i < _zones.length; i++) {
      if (_zones[i].bleeding) return true;
    }
    return false;
  }

  function _zoneColor(zone) {
    var pct = zone.hp / zone.maxHp;
    if (zone.hp <= 0) return COLOR_DEAD;
    if (pct > 0.6)    return COLOR_HEALTHY;
    if (pct > 0.25)   return COLOR_WOUNDED;
    return COLOR_CRITICAL;
  }

  function _showToast(msg, durationMs) {
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    var dur = durationMs || 2000;
    setTimeout(function () {
      if (_toastEl) _toastEl.style.display = 'none';
    }, dur);
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // ─────────────────────────────────────────────── update HUD
  function _updateHUD() {
    if (!_hudEl) return;

    var lines = [];
    lines.push('<b style="color:#FF6666">MEDIC KIT</b>');
    for (var i = 0; i < _zones.length; i++) {
      var z    = _zones[i];
      var col  = _zoneColor(z);
      var bars = Math.round((z.hp / z.maxHp) * 8);
      var bar  = '';
      for (var b = 0; b < 8; b++) bar += (b < bars ? '█' : '░');
      var bleedMark = z.bleeding ? ' <span style="color:#FF2222">●BLD</span>' : '';
      var tqMark    = z.tourniquetApplied ? ' <span style="color:#FF9900">[TQ]</span>' : '';
      var sel       = (i === _selectedZone && _menuOpen) ? '▶ ' : '  ';
      lines.push(sel + '<span style="color:' + col + '">' + z.name + '</span>: ' + bar + bleedMark + tqMark);
    }
    if (_morphineActive) {
      lines.push('<span style="color:#AAFFAA">MORPHINE ' + Math.ceil(_morphineTimer) + 's</span>');
    }
    if (_isBandaging) {
      lines.push('<span style="color:#FFDD00">Bandaging... ' + _bandageTimer.toFixed(1) + 's</span>');
    }
    if (_ivActive) {
      lines.push('<span style="color:#88CCFF">IV drip... ' + Math.ceil(_ivTimer) + 's</span>');
    }
    if (_isDead) {
      lines.push('<span style="color:#FF2222">☠ DEAD</span>');
    }
    lines.push('[M] Kit');
    _hudEl.innerHTML = lines.join('<br>');
  }

  function _updateKitMenu() {
    if (!_kitMenuEl || !_menuOpen) return;

    // Body diagram
    var diag = '<b>WOUND ZONES</b><br><br>';
    for (var i = 0; i < _zones.length; i++) {
      var z   = _zones[i];
      var col = _zoneColor(z);
      var hp  = z.hp <= 0 ? 'DEAD' : z.hp + '/' + z.maxHp;
      var sel = (i === _selectedZone) ? '▶ ' : '  ';
      var extras = '';
      if (z.bleeding)            extras += ' <span style="color:#FF2222">[BLEEDING]</span>';
      if (z.tourniquetApplied)   extras += ' <span style="color:#FF9900">[TQ]</span>';
      diag += sel + '<span style="color:' + col + '">' + z.name + '</span>: ' +
              '<span style="color:' + col + '">' + hp + '</span>' + extras + '<br>';
    }
    _bodyDiagramEl.innerHTML = diag;

    // Inventory
    var inv = '<b>INVENTORY</b><br>';
    inv += 'Bandages:      ' + _inv.bandages      + '<br>';
    inv += 'Morphine:      ' + _inv.morphine       + '<br>';
    inv += 'Tourniquet:    ' + _inv.tourniquet     + '<br>';
    inv += 'IV Bag:        ' + _inv.ivBag          + '<br>';
    inv += 'Defibrillator: ' + _inv.defibrillator  + '<br>';
    _inventoryEl.innerHTML = inv;
  }

  function _updateVignette() {
    if (!_vignetteEl) return;
    if (_isAnyBleeding() && !_morphineActive) {
      var pulse = Math.abs(Math.sin(Date.now() / 400));
      var px    = Math.round(VIGNETTE_MAX * (0.4 + 0.6 * pulse));
      _vignetteEl.style.boxShadow = 'inset 0 0 ' + px + 'px rgba(200,0,0,0.6)';
    } else {
      _vignetteEl.style.boxShadow = 'inset 0 0 0px rgba(200,0,0,0)';
    }
  }

  function _updateIVMeshes() {
    if (!_ivBagMesh || !_ivTubeLine) return;
    if (_ivActive && _camera) {
      _ivBagMesh.visible = true;
      _ivTubeLine.visible = true;

      var camPos = _camera.position;
      // Place bag above and slightly in front of camera
      _ivBagMesh.position.set(camPos.x + 0.3, camPos.y + 0.9, camPos.z - 0.2);

      // Tube from bag bottom to right arm position (approximate)
      var armPos = new THREE.Vector3(camPos.x + 0.4, camPos.y + 0.1, camPos.z + 0.1);
      var posArr = _ivTubeLine.geometry.attributes.position.array;
      posArr[0] = _ivBagMesh.position.x;
      posArr[1] = _ivBagMesh.position.y - 0.11;
      posArr[2] = _ivBagMesh.position.z;
      posArr[3] = armPos.x;
      posArr[4] = armPos.y;
      posArr[5] = armPos.z;
      _ivTubeLine.geometry.attributes.position.needsUpdate = true;
    } else {
      _ivBagMesh.visible  = false;
      _ivTubeLine.visible = false;
    }
  }

  function _updateTourniquetMeshes() {
    if (!_tourniquetLeft || !_tourniquetRight || !_camera) return;
    var camPos = _camera.position;

    if (_zones[ZONE_LEFT_ARM].tourniquetApplied) {
      _tourniquetLeft.visible = true;
      _tourniquetLeft.position.set(camPos.x - 0.35, camPos.y + 0.05, camPos.z + 0.05);
      _tourniquetLeft.rotation.copy(_camera.rotation);
    } else {
      _tourniquetLeft.visible = false;
    }

    if (_zones[ZONE_RIGHT_ARM].tourniquetApplied) {
      _tourniquetRight.visible = true;
      _tourniquetRight.position.set(camPos.x + 0.35, camPos.y + 0.05, camPos.z + 0.05);
      _tourniquetRight.rotation.copy(_camera.rotation);
    } else {
      _tourniquetRight.visible = false;
    }
  }

  // ─────────────────────────────────────────────── actions
  function _applyTourniquet() {
    if (_inv.tourniquet <= 0) { _showToast('No tourniquets!'); return; }
    var zone = _zones[_selectedZone];
    if (!_isArmZone(_selectedZone)) { _showToast('Tourniquet: arms only!'); return; }
    if (zone.tourniquetApplied)     { _showToast('Tourniquet already applied!'); return; }
    if (!zone.bleeding)             { _showToast('Zone is not bleeding.'); return; }

    zone.bleeding           = false;
    zone.tourniquetApplied  = true;
    _inv.tourniquet--;
    _showToast('Tourniquet applied to ' + zone.name + '!');
    _updateHUD();
  }

  function _startBandage() {
    if (_inv.bandages <= 0)  { _showToast('No bandages!'); return; }
    if (_isBandaging)        { _showToast('Already bandaging!'); return; }
    if (_isDead)             { return; }
    var zone = _zones[_selectedZone];
    if (zone.hp <= 0)        { _showToast('Zone is dead — cannot bandage.'); return; }
    if (zone.hp >= zone.maxHp) { _showToast('Zone is already at max HP.'); return; }

    _isBandaging  = true;
    _bandageTimer = BANDAGE_TIME;
    _bandageZone  = _selectedZone;
    _inv.bandages--;
    _showToast('Bandaging ' + zone.name + '...', 3500);
  }

  function _finishBandage() {
    _isBandaging = false;
    if (_bandageZone < 0) return;
    var zone = _zones[_bandageZone];
    zone.hp      = _clamp(zone.hp + BANDAGE_HEAL, 0, zone.maxHp);
    zone.bleeding = false;
    _showToast(zone.name + ' bandaged! +' + BANDAGE_HEAL + ' HP');
    _bandageZone = -1;
    _updateHUD();
  }

  function _useMorphine() {
    if (_inv.morphine <= 0) { _showToast('No morphine!'); return; }
    _morphineActive = true;
    _morphineTimer  = MORPHINE_DUR;
    _inv.morphine--;
    _showToast('Morphine administered — pain suppressed for ' + MORPHINE_DUR + 's');
    _updateHUD();
  }

  function _useIVBag() {
    if (_inv.ivBag <= 0) { _showToast('No IV bags!'); return; }
    if (_ivActive)       { _showToast('IV already running!'); return; }
    if (_isDead)         { return; }
    _ivActive   = true;
    _ivTimer    = IV_DUR;
    _inv.ivBag--;
    _showToast('IV drip started — restoring to 50% over ' + IV_DUR + 's');
    if (_ivBagMesh) _ivBagMesh.visible   = true;
    if (_ivTubeLine) _ivTubeLine.visible = true;
    _updateHUD();
  }

  function _useDefibrillator() {
    if (_inv.defibrillator <= 0) { _showToast('No defibrillator!'); return; }
    if (!_isDead)                { _showToast('You are not dead!'); return; }
    if (_defibCharging)          { return; }
    _defibCharging = true;
    _defibTimer    = DEFIB_CHARGE;
    _inv.defibrillator--;
    _playDefibSound();
    _showToast('Charging defibrillator...', 1200);
  }

  function _finishDefibrillator() {
    _defibCharging = false;
    _isDead        = false;
    // restore each zone to 25% HP minimum
    for (var i = 0; i < _zones.length; i++) {
      if (_zones[i].hp <= 0) {
        _zones[i].hp       = Math.round(_zones[i].maxHp * 0.25);
        _zones[i].bleeding = false;
      }
    }
    _showToast('Defibrillator — REVIVED!', 3000);
    _updateHUD();
  }

  function _startCPR(ally) {
    if (_isCpr)   { return; }
    if (!ally)    { return; }
    _isCpr     = true;
    _cprTarget = ally;
    _cprTimer  = CPR_TIME;
    _showToast('Performing CPR...', CPR_TIME * 1000);
  }

  function _finishCPR() {
    _isCpr = false;
    var roll = Math.random();
    if (roll < CPR_CHANCE) {
      _showToast('CPR success — ally revived!', 3000);
      if (_cprTarget && typeof _cprTarget.revive === 'function') {
        _cprTarget.revive();
      }
    } else {
      _showToast('CPR failed.', 2000);
    }
    _cprTarget = null;
  }

  // ─────────────────────────────────────────────── keyboard
  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = true;

    // M key — open/close menu or double-tap for morphine
    if (key === 'm') {
      var now = Date.now() / 1000;
      if (now - _mPressTime < DOUBLE_TAP_WIN) {
        _mPressCount++;
        if (_mPressCount >= 2) {
          _mPressCount = 0;
          _useMorphine();
          return;
        }
      } else {
        _mPressCount = 1;
        _mPressTime  = now;
      }
      // single tap — toggle menu (only if not double-tap window)
      setTimeout(function () {
        if (_mPressCount === 1) {
          _menuOpen = !_menuOpen;
          if (_kitMenuEl) _kitMenuEl.style.display = _menuOpen ? 'block' : 'none';
          _updateKitMenu();
          _mPressCount = 0;
        }
      }, Math.round(DOUBLE_TAP_WIN * 1000) + 10);
    }

    // T key — tourniquet
    if (key === 't') {
      _applyTourniquet();
    }

    // B key — bandage
    if (key === 'b') {
      _startBandage();
    }

    // I key — IV bag
    if (key === 'i') {
      _useIVBag();
    }

    // D key — defibrillator
    if (key === 'd') {
      _useDefibrillator();
    }

    // F key — held for CPR combo
    if (key === 'f') {
      _fKeyDown = true;
    }

    // F+M — CPR on nearby downed ally
    if (key === 'm' && _fKeyDown) {
      // CPR handled separately from morphine double-tap
      // allies passed via update; check nearest downed ally
      _pendingCPR = true;
    }

    // 1-4 — select zone
    if (key === '1') _selectedZone = 0;
    if (key === '2') _selectedZone = 1;
    if (key === '3') _selectedZone = 2;
    if (key === '4') _selectedZone = 3;

    _updateHUD();
    _updateKitMenu();
  }

  var _pendingCPR = false;

  function _onKeyUp(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = false;
    if (key === 'f') _fKeyDown = false;
  }

  // ─────────────────────────────────────────────── public: init
  function init(sceneRef, cameraRef, rendererRef) {
    _scene    = sceneRef    || null;
    _camera   = cameraRef   || null;
    _renderer = rendererRef || null;

    _createVignette();
    _createHUD();
    _createKitMenu();

    if (_scene) {
      _tourniquetLeft  = _createTourniquetMesh(true);
      _tourniquetRight = _createTourniquetMesh(false);
      _createIVMeshes();
    }

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _updateHUD();
  }

  // ─────────────────────────────────────────────── public: update
  function update(delta, allies) {
    if (!delta || delta <= 0) return;

    // ── bleed tick
    _bleedTimer += delta;
    if (_bleedTimer >= BLEED_INTERVAL) {
      _bleedTimer = 0;
      for (var i = 0; i < _zones.length; i++) {
        var z = _zones[i];
        if (z.bleeding && !z.tourniquetApplied) {
          z.hp = Math.max(0, z.hp - BLEED_DMG);
          if (z.hp <= 0) z.bleeding = false;
        }
      }
    }

    // ── check if all zones dead → player is dead
    var allDead = true;
    for (var j = 0; j < _zones.length; j++) {
      if (_zones[j].hp > 0) { allDead = false; break; }
    }
    if (allDead && !_isDead) {
      _isDead = true;
      _showToast('YOU ARE DEAD — use Defibrillator [D]', 5000);
    }

    // ── morphine countdown
    if (_morphineActive) {
      _morphineTimer -= delta;
      if (_morphineTimer <= 0) {
        _morphineActive = false;
        _morphineTimer  = 0;
        _showToast('Morphine wore off.');
      }
    }

    // ── bandage countdown (player can't shoot while bandaging — callers check isBandaging())
    if (_isBandaging) {
      _bandageTimer -= delta;
      if (_bandageTimer <= 0) {
        _finishBandage();
      }
    }

    // ── IV drip tick
    if (_ivActive) {
      _ivTimer -= delta;
      var targetHP = HP_MAX * IV_TARGET_PCT;
      for (var k = 0; k < _zones.length; k++) {
        var zk = _zones[k];
        if (zk.hp < targetHP) {
          zk.hp = Math.min(targetHP, zk.hp + (targetHP / IV_DUR) * delta);
        }
      }
      if (_ivTimer <= 0) {
        _ivActive = false;
        _ivTimer  = 0;
        _showToast('IV drip complete.');
      }
    }

    // ── defibrillator charge
    if (_defibCharging) {
      _defibTimer -= delta;
      if (_defibTimer <= 0) {
        _finishDefibrillator();
      }
    }

    // ── CPR
    if (_pendingCPR && allies) {
      _pendingCPR = false;
      var nearest = null;
      var nearDist = Infinity;
      for (var a = 0; a < allies.length; a++) {
        var ally = allies[a];
        if (!ally || !ally.isDowned) continue;
        var dist = (ally.position && _camera)
          ? _camera.position.distanceTo(ally.position)
          : Infinity;
        if (dist < CPR_RANGE && dist < nearDist) {
          nearDist = dist;
          nearest  = ally;
        }
      }
      if (nearest) {
        _startCPR(nearest);
      } else {
        _showToast('No downed ally in range for CPR.');
      }
    }

    if (_isCpr) {
      _cprTimer -= delta;
      if (_cprTimer <= 0) {
        _finishCPR();
      }
    }

    // ── update visuals
    _updateVignette();
    _updateTourniquetMeshes();
    _updateIVMeshes();
    _updateHUD();
    if (_menuOpen) _updateKitMenu();
  }

  // ─────────────────────────────────────────────── public: reset
  function reset() {
    // reset inventory
    _inv.bandages      = 5;
    _inv.morphine      = 2;
    _inv.tourniquet    = 3;
    _inv.ivBag         = 1;
    _inv.defibrillator = 1;

    // reset zones
    for (var i = 0; i < _zones.length; i++) {
      _zones[i].hp                 = HP_MAX;
      _zones[i].bleeding           = false;
      _zones[i].tourniquetApplied  = false;
    }

    _menuOpen        = false;
    _selectedZone    = 0;
    _morphineActive  = false;
    _morphineTimer   = 0;
    _isBandaging     = false;
    _bandageTimer    = 0;
    _bandageZone     = -1;
    _ivActive        = false;
    _ivTimer         = 0;
    _isDead          = false;
    _defibCharging   = false;
    _defibTimer      = 0;
    _bleedTimer      = 0;
    _mPressTime      = 0;
    _mPressCount     = 0;
    _fKeyDown        = false;
    _cprTarget       = null;
    _cprTimer        = 0;
    _isCpr           = false;
    _pendingCPR      = false;

    if (_kitMenuEl)  _kitMenuEl.style.display  = 'none';
    if (_vignetteEl) _vignetteEl.style.boxShadow = 'inset 0 0 0px rgba(200,0,0,0)';
    if (_tourniquetLeft)  _tourniquetLeft.visible  = false;
    if (_tourniquetRight) _tourniquetRight.visible = false;
    if (_ivBagMesh)   _ivBagMesh.visible  = false;
    if (_ivTubeLine)  _ivTubeLine.visible = false;

    _updateHUD();
  }

  // ─────────────────────────────────────────────── extra exposed helpers
  // Allow other modules to apply damage to a zone
  function applyDamage(zoneIdx, amount) {
    var z = _zones[zoneIdx];
    if (!z) return;
    z.hp = Math.max(0, z.hp - amount);
    if (z.hp < z.maxHp && !z.tourniquetApplied) {
      z.bleeding = true;
    }
    _updateHUD();
  }

  // Allow other modules to check if player can shoot (not bandaging)
  function canShoot() {
    return !_isBandaging && !_isDead;
  }

  function getIsDead() {
    return _isDead;
  }

  // ─────────────────────────────────────────────── public API
  return {
    init:        init,
    update:      update,
    reset:       reset,
    applyDamage: applyDamage,
    canShoot:    canShoot,
    getIsDead:   getIsDead
  };

}());
