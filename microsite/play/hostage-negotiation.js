// ============================================================
//  hostage-negotiation.js — Hostage negotiation FPS module
//  Features:
//    1. Hostage scenario: 1 hostage (orange jumpsuit), 3 hostage-taker enemies
//    2. Hostage-takers stay within 3 units of hostage, won't charge player
//    3. Negotiation phase: press L within 10 units to open dialogue wheel
//    4. Dialogue wheel: 4 options with varying success rates/outcomes
//    5. Sniper window: 8s BUY TIME highlight for precision 1-shot kills
//    6. Hostage execution: proximity blast or psych failure triggers kill
//    7. Escort mechanic: freed hostage follows player to safe zone
//    8. HV target: binoculars (B hold) to mark commander, F to capture alive
//    9. HVT HUD: binocular overlay with vignette + target info panel
//   10. Negotiation outcome log: right-side scrolling log
//  Public API: { init(scene, camera), update(delta), spawnScenario(x, z),
//               getNegotiationState(), reset() }
// ============================================================
window.HostageNegotiation = (function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  var HOSTAGE_TAKER_COUNT      = 3;
  var SHIELD_RADIUS            = 3;       // max distance taker stays from hostage
  var NEGOT_RANGE              = 10;      // player must be within 10 units to negotiate
  var HOSTAGE_KILL_RANGE       = 1.5;    // explosion/shot within 1.5 units kills hostage
  var SNIPER_WINDOW_DURATION   = 8.0;    // seconds BUY TIME sniper highlight lasts
  var DELAY_DURATION           = 15.0;   // seconds BUY TIME delays enemy action
  var CAPTURE_STUN_WINDOW      = 2.0;    // seconds window to press F after stun
  var BINO_HOLD_TIME           = 3.0;    // seconds to hold B for mark
  var SAFE_ZONE_RADIUS         = 3.0;    // green circle radius
  var ESCORT_SPEED             = 2.0;
  var SCORE_RESCUE             = 300;
  var SCORE_PENALTY            = -500;
  var SCORE_HVT_CAPTURE        = 500;
  var SCORE_NEGOTIATION_BONUS  = 200;

  // Colors
  var COLOR_SKIN               = 0xf5c5a3;
  var COLOR_JUMPSUIT           = 0xe8841a;
  var COLOR_TAKER              = 0x2a2a2a;
  var COLOR_TAKER_HEAD         = 0x3a3a2a;
  var COLOR_SAFE_ZONE          = 0x22ff55;
  var COLOR_RIFLE              = 0x111111;
  var COLOR_HVT_MARKER         = 0xff4400;

  // Dialogue options
  var DIALOGUE_OPTIONS = [
    { id: 'DEMAND_SURRENDER',     label: 'DEMAND SURRENDER',     successRate: 0.40, key: '1' },
    { id: 'OFFER_DEAL',           label: 'OFFER DEAL',           successRate: 0.70, key: '2' },
    { id: 'PSYCHOLOGICAL_PRESSURE',label:'PSYCHOLOGICAL PRESSURE',successRate: 0.20, execChance: 0.60, key: '3' },
    { id: 'BUY_TIME',             label: 'BUY TIME',             successRate: 1.00, key: '4' }
  ];

  // HVT names pool
  var HVT_NAMES  = ['Yusuf Al-Rashid', 'Viktor Komarov', 'Chen Wei-Long', 'Marcus Oduya'];
  var HVT_RANKS  = ['Commander', 'Colonel', 'Field Marshal', 'War Chief'];
  var HVT_BOUNTY = [50000, 75000, 100000, 125000];

  // ── State ───────────────────────────────────────────────────
  var _scene            = null;
  var _camera           = null;
  var _inited           = false;

  // Scenario objects
  var _hostage          = null;   // { mesh, state, followPlayer, escortAnim }
  var _takers           = [];     // array of taker objects
  var _safeZone         = null;   // { mesh, position }
  var _hvtIndex         = -1;     // which taker is the HVT commander

  // Negotiation state
  var _negotiating      = false;
  var _negotPhaseActive = false;
  var _dialogueOpen     = false;
  var _negotOutcome     = null;   // last outcome string
  var _delayTimer       = 0;      // BUY TIME countdown
  var _sniperWindow     = 0;      // sniper highlight countdown

  // Binoculars state
  var _binoHeld         = false;
  var _binoHoldTimer    = 0;
  var _hvtMarked        = false;
  var _hvtStunned       = false;
  var _hvtStunTimer     = 0;
  var _hvtCaptured      = false;

  // Audio
  var _audioCtx         = null;

  // Key states
  var _lKeyHeld         = false;
  var _lKeyDown         = false;
  var _bKeyHeld         = false;
  var _fKeyDown         = false;

  // Outcome log entries
  var _logEntries       = [];

  // HUD elements
  var _hudNegot         = null;   // negotiation prompt
  var _hudDialogue      = null;   // dialogue wheel overlay
  var _hudSniperAlert   = null;   // sniper window banner
  var _hudBinoOverlay   = null;   // binoculars overlay
  var _hudHvtPanel      = null;   // HVT info panel
  var _hudLogEl         = null;   // right-side outcome log
  var _hudWarnEl        = null;   // warning overlay
  var _warnTimer        = 0;

  // HVT data (randomised per scenario)
  var _hvtData          = null;

  // ── Helpers ─────────────────────────────────────────────────
  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }

  function _getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }

  function _getPlayerPos() {
    var cam = _getCamera();
    return cam ? cam.position : null;
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _addScore(pts) {
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(pts);
    } else if (typeof window._score !== 'undefined') {
      window._score += pts;
    }
    var scoreEl = document.getElementById('score-display');
    if (scoreEl) {
      var cur = parseInt((scoreEl.textContent || '').replace(/[^0-9\-]/g, '')) || 0;
      scoreEl.textContent = 'SCORE: ' + (cur + pts);
    }
  }

  function _addLog(text) {
    _logEntries.push({ text: text, age: 0 });
    if (_logEntries.length > 8) _logEntries.shift();
    _refreshLog();
  }

  function _playTone(freq, duration, type) {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch (e) { /* audio unavailable */ }
  }

  function _playNegotSound(success) {
    if (success) {
      _playTone(660, 0.15, 'square');
      setTimeout(function () { _playTone(880, 0.2, 'square'); }, 180);
    } else {
      _playTone(220, 0.3, 'sawtooth');
      setTimeout(function () { _playTone(180, 0.4, 'sawtooth'); }, 220);
    }
  }

  // ── Mesh factories ───────────────────────────────────────────
  function _makeHostageMesh() {
    var T = window.THREE;
    var group = new T.Group();

    var bodyGeo = new T.CylinderGeometry(0.22, 0.22, 1.5, 8);
    var bodyMat = new T.MeshLambertMaterial({ color: COLOR_JUMPSUIT });
    var body = new T.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    group.add(body);

    var headGeo = new T.SphereGeometry(0.18, 8, 8);
    var headMat = new T.MeshLambertMaterial({ color: COLOR_SKIN });
    var head = new T.Mesh(headGeo, headMat);
    head.position.y = 1.65;
    group.add(head);

    // Bound hands behind back
    var handGeo = new T.CylinderGeometry(0.045, 0.045, 0.35, 6);
    var handMat = new T.MeshLambertMaterial({ color: COLOR_SKIN });
    var handL = new T.Mesh(handGeo, handMat);
    handL.rotation.z = Math.PI / 2;
    handL.position.set(-0.26, 0.55, -0.16);
    group.add(handL);

    var handR = new T.Mesh(handGeo, handMat);
    handR.rotation.z = Math.PI / 2;
    handR.position.set(0.26, 0.55, -0.16);
    group.add(handR);

    // Kneel tilt
    group.rotation.x = 0.28;

    return group;
  }

  function _makeTakerMesh(isHVT) {
    var T = window.THREE;
    var group = new T.Group();

    var baseColor = isHVT ? 0x5a1a1a : COLOR_TAKER;
    var headColor = isHVT ? 0x8b2222 : COLOR_TAKER_HEAD;

    var bodyGeo = new T.CylinderGeometry(0.26, 0.26, 1.7, 8);
    var bodyMat = new T.MeshLambertMaterial({ color: baseColor });
    var body = new T.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    group.add(body);

    var headGeo = new T.SphereGeometry(0.21, 8, 8);
    var headMat = new T.MeshLambertMaterial({ color: headColor });
    var head = new T.Mesh(headGeo, headMat);
    head.position.y = 1.88;
    head.userData.isHead = true;
    group.add(head);

    var rifleGeo = new T.BoxGeometry(0.07, 0.07, 0.85);
    var rifleMat = new T.MeshLambertMaterial({ color: COLOR_RIFLE });
    var rifle = new T.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.33, 1.05, -0.15);
    rifle.rotation.x = 0.35;
    group.add(rifle);

    if (isHVT) {
      // Shoulder rank insignia (small flat box)
      var insigniaGeo = new T.BoxGeometry(0.14, 0.04, 0.14);
      var insigniaMat = new T.MeshLambertMaterial({ color: 0xffd700 });
      var insL = new T.Mesh(insigniaGeo, insigniaMat);
      insL.position.set(-0.3, 1.4, 0);
      group.add(insL);
      var insR = new T.Mesh(insigniaGeo, insigniaMat);
      insR.position.set(0.3, 1.4, 0);
      group.add(insR);
    }

    return group;
  }

  function _makeSafeZoneMesh(x, z) {
    var T = window.THREE;
    var geo = new T.RingGeometry(SAFE_ZONE_RADIUS - 0.15, SAFE_ZONE_RADIUS, 32);
    var mat = new T.MeshBasicMaterial({
      color: COLOR_SAFE_ZONE,
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);
    return mesh;
  }

  function _makeHvtMarkerMesh() {
    var T = window.THREE;
    var group = new T.Group();
    var geo = new T.SphereGeometry(0.28, 8, 8);
    var mat = new T.MeshBasicMaterial({
      color: COLOR_HVT_MARKER,
      wireframe: true
    });
    var sphere = new T.Mesh(geo, mat);
    sphere.position.y = 2.2;
    group.add(sphere);
    return group;
  }

  // ── HUD creation ─────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudNegot) return;

    // Negotiation prompt (bottom-center)
    _hudNegot = document.createElement('div');
    _hudNegot.id = 'hn-negot-prompt';
    _hudNegot.style.cssText = [
      'position:fixed', 'bottom:180px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid rgba(255,200,80,0.7)',
      'color:#ffc850', 'padding:6px 20px',
      'border-radius:5px', 'font-size:13px',
      'font-family:monospace', 'z-index:300',
      'pointer-events:none', 'text-align:center',
      'letter-spacing:1px', 'display:none'
    ].join(';');
    document.body.appendChild(_hudNegot);

    // Dialogue wheel overlay (center screen)
    _hudDialogue = document.createElement('div');
    _hudDialogue.id = 'hn-dialogue-wheel';
    _hudDialogue.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'border:2px solid rgba(255,200,80,0.8)',
      'color:#ffc850', 'padding:20px 28px',
      'border-radius:10px', 'font-family:monospace',
      'font-size:13px', 'z-index:500',
      'pointer-events:none', 'text-align:left',
      'min-width:280px', 'display:none'
    ].join(';');
    _hudDialogue.innerHTML = [
      '<div style="text-align:center;font-size:15px;font-weight:bold;margin-bottom:12px;letter-spacing:2px;color:#fff">',
      'NEGOTIATION DIALOGUE',
      '</div>',
      '<div id="hn-opt-1" style="margin:6px 0;padding:4px 8px;border-radius:4px">',
      '[1] DEMAND SURRENDER',
      '</div>',
      '<div id="hn-opt-2" style="margin:6px 0;padding:4px 8px;border-radius:4px">',
      '[2] OFFER DEAL',
      '</div>',
      '<div id="hn-opt-3" style="margin:6px 0;padding:4px 8px;border-radius:4px">',
      '[3] PSYCHOLOGICAL PRESSURE',
      '</div>',
      '<div id="hn-opt-4" style="margin:6px 0;padding:4px 8px;border-radius:4px">',
      '[4] BUY TIME',
      '</div>',
      '<div style="margin-top:12px;font-size:10px;color:#888;text-align:center">Press 1-4 to choose</div>'
    ].join('');
    document.body.appendChild(_hudDialogue);

    // Sniper window alert (top-center banner)
    _hudSniperAlert = document.createElement('div');
    _hudSniperAlert.id = 'hn-sniper-alert';
    _hudSniperAlert.style.cssText = [
      'position:fixed', 'top:60px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,80,0,0.85)',
      'border:2px solid #22ff55',
      'color:#22ff55', 'padding:6px 22px',
      'border-radius:5px', 'font-size:13px',
      'font-weight:bold', 'font-family:monospace',
      'z-index:400', 'pointer-events:none',
      'text-align:center', 'letter-spacing:2px',
      'display:none'
    ].join(';');
    _hudSniperAlert.textContent = 'SNIPER WINDOW ACTIVE';
    document.body.appendChild(_hudSniperAlert);

    // Binoculars overlay (full-screen vignette + circular reticle)
    _hudBinoOverlay = document.createElement('div');
    _hudBinoOverlay.id = 'hn-bino-overlay';
    _hudBinoOverlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0',
      'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:800',
      'display:none'
    ].join(';');
    _hudBinoOverlay.innerHTML = [
      // Dark vignette
      '<div style="position:absolute;top:0;left:0;width:100%;height:100%;',
      'background:radial-gradient(circle at 50% 50%, transparent 28%, rgba(0,0,0,0.92) 55%);"></div>',
      // Circular reticle
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);',
      'width:200px;height:200px;border:2px solid rgba(100,255,100,0.7);',
      'border-radius:50%;box-shadow:0 0 0 1px rgba(100,255,100,0.3);"></div>',
      // Crosshair lines
      '<div style="position:absolute;top:50%;left:50%;',
      'width:20px;height:1px;background:rgba(100,255,100,0.8);',
      'transform:translate(-50%,-50%)"></div>',
      '<div style="position:absolute;top:50%;left:50%;',
      'width:1px;height:20px;background:rgba(100,255,100,0.8);',
      'transform:translate(-50%,-50%)"></div>',
      // Digital zoom indicator
      '<div style="position:absolute;bottom:calc(50% - 120px);left:50%;',
      'transform:translateX(-50%);font-family:monospace;font-size:11px;',
      'color:rgba(100,255,100,0.8)">2x ZOOM</div>',
      // HVT panel placeholder (built dynamically)
      '<div id="hn-hvt-panel" style="position:absolute;top:calc(50% - 130px);',
      'right:calc(50% - 340px);background:rgba(0,0,0,0.8);',
      'border:1px solid rgba(255,100,50,0.7);color:#ff6432;',
      'padding:8px 14px;border-radius:6px;font-family:monospace;',
      'font-size:11px;min-width:160px;display:none"></div>'
    ].join('');
    document.body.appendChild(_hudBinoOverlay);

    _hudHvtPanel = document.getElementById('hn-hvt-panel');

    // Right-side negotiation outcome log
    _hudLogEl = document.createElement('div');
    _hudLogEl.id = 'hn-outcome-log';
    _hudLogEl.style.cssText = [
      'position:fixed', 'right:16px', 'top:120px',
      'width:240px', 'max-height:200px',
      'overflow-y:auto', 'overflow-x:hidden',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(255,200,80,0.35)',
      'border-radius:5px', 'padding:6px 10px',
      'font-family:monospace', 'font-size:10px',
      'color:#ffc850', 'z-index:250',
      'pointer-events:none', 'display:none',
      'letter-spacing:0.5px'
    ].join(';');
    document.body.appendChild(_hudLogEl);

    // Warning overlay
    _hudWarnEl = document.createElement('div');
    _hudWarnEl.id = 'hn-warn';
    _hudWarnEl.style.cssText = [
      'position:fixed', 'top:28%', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(160,0,0,0.9)',
      'border:2px solid #ff2222', 'color:#fff',
      'padding:12px 30px', 'border-radius:7px',
      'font-size:16px', 'font-weight:bold',
      'font-family:monospace', 'z-index:600',
      'pointer-events:none', 'text-align:center',
      'letter-spacing:2px', 'display:none'
    ].join(';');
    document.body.appendChild(_hudWarnEl);
  }

  function _showWarn(text, dur) {
    if (!_hudWarnEl) return;
    _hudWarnEl.textContent = text;
    _hudWarnEl.style.display = 'block';
    _warnTimer = dur || 3.0;
  }

  function _refreshLog() {
    if (!_hudLogEl) return;
    if (_logEntries.length === 0) {
      _hudLogEl.style.display = 'none';
      return;
    }
    _hudLogEl.style.display = 'block';
    var html = '<div style="color:#aaa;font-size:9px;letter-spacing:1px;margin-bottom:4px">NEGOTIATION LOG</div>';
    for (var i = 0; i < _logEntries.length; i++) {
      html += '<div style="margin:2px 0;border-bottom:1px solid rgba(255,200,80,0.1);padding-bottom:2px">' +
        _logEntries[i].text + '</div>';
    }
    _hudLogEl.innerHTML = html;
    _hudLogEl.scrollTop = _hudLogEl.scrollHeight;
  }

  function _showHvtPanel(show) {
    if (!_hudHvtPanel || !_hvtData) return;
    if (!show) {
      _hudHvtPanel.style.display = 'none';
      return;
    }
    _hudHvtPanel.style.display = 'block';
    _hudHvtPanel.innerHTML = [
      '<div style="color:#ff4400;font-weight:bold;font-size:12px;margin-bottom:6px">HIGH VALUE TARGET</div>',
      '<div>NAME: ' + _hvtData.name + '</div>',
      '<div>RANK: ' + _hvtData.rank + '</div>',
      '<div>BOUNTY: $' + _hvtData.bounty.toLocaleString() + '</div>',
      _hvtMarked ? '<div style="color:#22ff55;margin-top:4px">STATUS: MARKED</div>' : '',
      _hvtCaptured ? '<div style="color:#ffff00;margin-top:4px">STATUS: CAPTURED</div>' : ''
    ].join('');
  }

  // ── Taker helper functions ───────────────────────────────────
  function _countAliveTakers() {
    var n = 0;
    for (var i = 0; i < _takers.length; i++) {
      if (_takers[i].alive) n++;
    }
    return n;
  }

  function _surrenderTaker(taker) {
    if (!taker.alive || taker.state === 'surrendered') return;
    taker.state = 'surrendered';
    taker.alive = false;
    if (taker.mesh) {
      // Kneel — tilt forward
      taker.mesh.rotation.x = 0.7;
      // Turn grey
      taker.mesh.traverse(function (child) {
        if (child.isMesh) {
          child.material = new (window.THREE).MeshLambertMaterial({ color: 0x555555 });
        }
      });
    }
    // Remove from scene after 4s
    var sc = _getScene();
    var m = taker.mesh;
    setTimeout(function () {
      if (sc && m) sc.remove(m);
    }, 4000);
  }

  function _killHostage() {
    if (!_hostage || _hostage.state !== 'captive') return;
    _hostage.state = 'killed';
    if (_hostage.mesh) {
      _hostage.mesh.traverse(function (child) {
        if (child.isMesh) {
          child.material = new (window.THREE).MeshLambertMaterial({ color: 0x880000 });
        }
      });
    }
    _addScore(SCORE_PENALTY);
    _showWarn('HOSTAGE EXECUTED! -500', 4.0);
    _addLog('HOSTAGE: KILLED — ROE TIGHTENED');
    if (window.KillFeedEvents && typeof window.KillFeedEvents.addEvent === 'function') {
      window.KillFeedEvents.addEvent('HOSTAGE KILLED -500', '', 'penalty');
    }
  }

  function _freeHostage() {
    if (!_hostage || _hostage.state !== 'captive') return;
    _hostage.state = 'freed';
    _hostage.followPlayer = true;
    // Stand up
    if (_hostage.mesh) _hostage.mesh.rotation.x = 0;
    _addScore(SCORE_RESCUE);
    _addLog('HOSTAGE: RESCUED — ESCORTING TO SAFE ZONE');
    if (window.KillFeedEvents && typeof window.KillFeedEvents.addEvent === 'function') {
      window.KillFeedEvents.addEvent('HOSTAGE FREED +300', '', 'rescue');
    }
  }

  // ── Negotiation logic ─────────────────────────────────────────
  function _applyDialogueChoice(optionId) {
    if (!_negotPhaseActive) return;
    _dialogueOpen = false;
    if (_hudDialogue) _hudDialogue.style.display = 'none';
    _negotPhaseActive = false;

    var roll = Math.random();

    if (optionId === 'DEMAND_SURRENDER') {
      if (roll < 0.40) {
        // All surrender
        var alive = [];
        for (var i = 0; i < _takers.length; i++) {
          if (_takers[i].alive) alive.push(_takers[i]);
        }
        for (var j = 0; j < alive.length; j++) {
          _surrenderTaker(alive[j]);
        }
        _freeHostage();
        _addScore(SCORE_NEGOTIATION_BONUS);
        _addLog('NEGOTIATION: ALL SURRENDERED (' + alive.length + '/' + alive.length + ')');
        _showWarn('ENEMIES SURRENDERED!', 3.0);
        _playNegotSound(true);
      } else {
        _addLog('NEGOTIATION: DEMAND REJECTED — TENSIONS RISE');
        _showWarn('DEMAND REJECTED', 2.5);
        _playNegotSound(false);
        // Takers become more aggressive (speed boost)
        for (var k = 0; k < _takers.length; k++) {
          if (_takers[k].alive) _takers[k].aggressive = true;
        }
      }

    } else if (optionId === 'OFFER_DEAL') {
      if (roll < 0.70) {
        // One taker releases hostage, rest still fight
        _freeHostage();
        var released = false;
        for (var oi = 0; oi < _takers.length; oi++) {
          if (_takers[oi].alive && !released) {
            _surrenderTaker(_takers[oi]);
            released = true;
            break;
          }
        }
        var remaining = _countAliveTakers();
        _addLog('NEGOTIATION: DEAL ACCEPTED — 1 RELEASED, ' + remaining + ' STILL HOSTILE');
        _showWarn('DEAL ACCEPTED — HOSTAGE FREED', 3.0);
        _playNegotSound(true);
      } else {
        _addLog('NEGOTIATION: DEAL REJECTED');
        _showWarn('DEAL REJECTED', 2.5);
        _playNegotSound(false);
      }

    } else if (optionId === 'PSYCHOLOGICAL_PRESSURE') {
      if (roll < 0.20) {
        // Success — enemies crack
        var alivePsych = [];
        for (var pi = 0; pi < _takers.length; pi++) {
          if (_takers[pi].alive) alivePsych.push(_takers[pi]);
        }
        for (var pj = 0; pj < alivePsych.length; pj++) {
          _surrenderTaker(alivePsych[pj]);
        }
        _freeHostage();
        _addLog('NEGOTIATION: PSYCH PRESSURE SUCCESS — ALL SURRENDERED');
        _showWarn('PSYCHOLOGICAL VICTORY!', 3.0);
        _playNegotSound(true);
        _addScore(SCORE_NEGOTIATION_BONUS);
      } else {
        // Fail — may execute hostage
        var execRoll = Math.random();
        if (execRoll < 0.60) {
          _killHostage();
          _addLog('NEGOTIATION: PSYCH FAILED — HOSTAGE EXECUTED');
        } else {
          _addLog('NEGOTIATION: PSYCH FAILED — TAKERS FURIOUS');
          _showWarn('PRESSURE FAILED — ENEMIES ENRAGED', 3.0);
          for (var ei = 0; ei < _takers.length; ei++) {
            if (_takers[ei].alive) _takers[ei].aggressive = true;
          }
        }
        _playNegotSound(false);
      }

    } else if (optionId === 'BUY_TIME') {
      // Always succeeds
      _delayTimer = DELAY_DURATION;
      _sniperWindow = SNIPER_WINDOW_DURATION;
      if (_hudSniperAlert) _hudSniperAlert.style.display = 'block';
      _addLog('NEGOTIATION: BOUGHT TIME — SNIPER WINDOW 8s OPEN');
      _showWarn('SNIPER WINDOW: 8 SECONDS', 3.0);
      _playNegotSound(true);
    }
  }

  // ── Key listeners ─────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key || '';
    var code = e.code || '';

    if (code === 'KeyL' || key === 'l' || key === 'L') {
      if (!_lKeyDown) {
        _lKeyDown = true;
        _lKeyHeld = true;
        _tryOpenNegotiation();
      }
    }
    if (code === 'KeyB' || key === 'b' || key === 'B') {
      _bKeyHeld = true;
    }
    if (code === 'KeyF' || key === 'f' || key === 'F') {
      if (!_fKeyDown) {
        _fKeyDown = true;
        _tryCapture();
      }
    }

    // Dialogue number keys
    if (_dialogueOpen) {
      if (key === '1') _applyDialogueChoice('DEMAND_SURRENDER');
      else if (key === '2') _applyDialogueChoice('OFFER_DEAL');
      else if (key === '3') _applyDialogueChoice('PSYCHOLOGICAL_PRESSURE');
      else if (key === '4') _applyDialogueChoice('BUY_TIME');
    }
  }

  function _onKeyUp(e) {
    var key = e.key || '';
    var code = e.code || '';

    if (code === 'KeyL' || key === 'l' || key === 'L') {
      _lKeyHeld = false;
      _lKeyDown = false;
    }
    if (code === 'KeyB' || key === 'b' || key === 'B') {
      _bKeyHeld = false;
      _binoHoldTimer = 0;
      if (_hudBinoOverlay) _hudBinoOverlay.style.display = 'none';
    }
    if (code === 'KeyF' || key === 'f' || key === 'F') {
      _fKeyDown = false;
    }
  }

  function _setupKeys() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function _tryOpenNegotiation() {
    if (!_hostage || _hostage.state !== 'captive') return;
    if (_dialogueOpen) {
      // Toggle close
      _dialogueOpen = false;
      _negotPhaseActive = false;
      if (_hudDialogue) _hudDialogue.style.display = 'none';
      return;
    }
    var pPos = _getPlayerPos();
    if (!pPos) return;
    if (_dist2D(pPos, _hostage.mesh.position) > NEGOT_RANGE) {
      if (_hudNegot) {
        _hudNegot.textContent = 'TOO FAR — MOVE CLOSER TO NEGOTIATE';
        _hudNegot.style.display = 'block';
        setTimeout(function () { if (_hudNegot) _hudNegot.style.display = 'none'; }, 2000);
      }
      return;
    }
    _negotPhaseActive = true;
    _dialogueOpen = true;
    if (_hudDialogue) _hudDialogue.style.display = 'block';
    _addLog('NEGOTIATION INITIATED');
  }

  function _tryCapture() {
    if (!_hvtMarked || _hvtCaptured) return;
    if (!_hvtStunned) return;
    // Find the HVT taker
    var hvt = _hvtIndex >= 0 ? _takers[_hvtIndex] : null;
    if (!hvt || !hvt.alive) return;
    var pPos = _getPlayerPos();
    if (!pPos) return;
    if (_dist2D(pPos, hvt.mesh.position) > 3.5) return;

    // Capture
    _hvtCaptured = true;
    hvt.alive = false;
    hvt.state = 'captured';
    if (hvt.mesh) {
      hvt.mesh.traverse(function (child) {
        if (child.isMesh) {
          child.material = new (window.THREE).MeshLambertMaterial({ color: 0x888800 });
        }
      });
      hvt.mesh.rotation.x = 0.8; // kneel
    }
    _addScore(SCORE_HVT_CAPTURE);
    _addLog('HVT CAPTURED ALIVE: ' + (_hvtData ? _hvtData.name : 'COMMANDER') + ' +500 — INTEL BONUS UNLOCKED');
    _showWarn('HVT CAPTURED ALIVE! +500', 4.0);
    _playNegotSound(true);
    if (window.KillFeedEvents && typeof window.KillFeedEvents.addEvent === 'function') {
      window.KillFeedEvents.addEvent('HVT CAPTURED +500', '', 'capture');
    }
    _showHvtPanel(true);
  }

  // ── Binoculars update ─────────────────────────────────────────
  function _updateBinoculars(dt) {
    if (!_bKeyHeld) {
      _binoHoldTimer = 0;
      return;
    }
    if (_hudBinoOverlay) _hudBinoOverlay.style.display = 'block';

    _binoHoldTimer += dt;

    if (_binoHoldTimer >= BINO_HOLD_TIME && !_hvtMarked) {
      _hvtMarked = true;
      _addLog('HVT MARKED: ' + (_hvtData ? _hvtData.name + ', ' + _hvtData.rank : 'COMMANDER'));
      // Attach visual marker to HVT
      var sc = _getScene();
      if (sc && _hvtIndex >= 0 && _takers[_hvtIndex] && _takers[_hvtIndex].mesh) {
        var markerGroup = _makeHvtMarkerMesh();
        _takers[_hvtIndex].mesh.add(markerGroup);
        _takers[_hvtIndex].hvtMarkerAttached = true;
      }
    }

    if (_hvtMarked) {
      _showHvtPanel(true);
    } else {
      // Show progress in panel
      if (_hudHvtPanel) {
        _hudHvtPanel.style.display = 'block';
        var pct = Math.min(100, Math.round((_binoHoldTimer / BINO_HOLD_TIME) * 100));
        _hudHvtPanel.innerHTML = '<div style="color:#ff6432;font-size:11px">SCANNING TARGET... ' + pct + '%</div>';
      }
    }
  }

  // ── Taker AI update ───────────────────────────────────────────
  function _updateTaker(taker, dt) {
    if (!taker.alive || taker.state === 'surrendered' || taker.state === 'captured') return;
    if (!_hostage || !_hostage.mesh) return;

    var T = window.THREE;
    var pPos = _getPlayerPos();
    var hPos = _hostage.mesh.position;

    // Always drift back toward hostage if too far
    var distToHostage = _dist2D(taker.mesh.position, hPos);
    if (distToHostage > SHIELD_RADIUS) {
      var dx = hPos.x - taker.mesh.position.x;
      var dz = hPos.z - taker.mesh.position.z;
      var mag = Math.sqrt(dx * dx + dz * dz) || 1;
      taker.mesh.position.x += (dx / mag) * 2.0 * dt;
      taker.mesh.position.z += (dz / mag) * 2.0 * dt;
    }

    // Delay timer — takers do nothing during BUY TIME
    if (_delayTimer > 0) {
      // Pace nervously: small random oscillation
      taker.mesh.position.x += (Math.random() - 0.5) * 0.005;
      taker.mesh.position.z += (Math.random() - 0.5) * 0.005;
      return;
    }

    // Orbit around hostage (maintain shield formation)
    taker.orbitAngle = (taker.orbitAngle || 0) + taker.orbitSpeed * dt;
    var targetX = hPos.x + Math.cos(taker.orbitAngle) * taker.orbitRadius;
    var targetZ = hPos.z + Math.sin(taker.orbitAngle) * taker.orbitRadius;

    taker.mesh.position.x += (targetX - taker.mesh.position.x) * 3.0 * dt;
    taker.mesh.position.z += (targetZ - taker.mesh.position.z) * 3.0 * dt;

    // Face toward player
    if (pPos) {
      var fdx = pPos.x - taker.mesh.position.x;
      var fdz = pPos.z - taker.mesh.position.z;
      taker.mesh.rotation.y = Math.atan2(fdx, fdz);
    }

    // Won't charge the player while hostage is alive (hostage-shield tactic)
    // If hostage is freed/killed, takers become fully aggressive
    if (_hostage.state !== 'captive' && pPos && taker.aggressive !== false) {
      var adx = pPos.x - taker.mesh.position.x;
      var adz = pPos.z - taker.mesh.position.z;
      var aDist = Math.sqrt(adx * adx + adz * adz);
      var spd = taker.aggressive ? 3.5 : 2.0;
      if (aDist > 2) {
        taker.mesh.position.x += (adx / aDist) * spd * dt;
        taker.mesh.position.z += (adz / aDist) * spd * dt;
      }
    }

    // HVT stun check — if HVT is near player and stunnable
    if (_hvtIndex >= 0 && _takers[_hvtIndex] === taker && _hvtMarked && !_hvtStunned && !_hvtCaptured) {
      // stun happens when player applies a stun (simulated: auto-stun after 2s proximity if marked)
      if (pPos && _dist2D(pPos, taker.mesh.position) < 2.5) {
        taker.stunProgress = (taker.stunProgress || 0) + dt;
        if (taker.stunProgress >= 1.5) {
          _hvtStunned = true;
          _hvtStunTimer = CAPTURE_STUN_WINDOW;
          taker.stunProgress = 0;
          _showWarn('HVT STUNNED — PRESS F TO CAPTURE (2s)', 2.5);
          _addLog('HVT STUNNED — CAPTURE WINDOW OPEN');
        }
      } else {
        taker.stunProgress = 0;
      }
    }
  }

  // ── Hostage escort update ─────────────────────────────────────
  function _updateHostageFollow(dt) {
    if (!_hostage || _hostage.state !== 'freed') return;
    var pPos = _getPlayerPos();
    if (!pPos) return;

    var hPos = _hostage.mesh.position;
    var dx = pPos.x - hPos.x;
    var dz = pPos.z - hPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    // Follow at 2 unit lag behind player
    if (dist > 2.5) {
      var spd = ESCORT_SPEED * dt;
      _hostage.mesh.position.x += (dx / dist) * spd;
      _hostage.mesh.position.z += (dz / dist) * spd;
      _hostage.mesh.rotation.y = Math.atan2(dx, dz);
    }

    // Check if reached safe zone
    if (_safeZone && _dist2D(hPos, _safeZone.position) < SAFE_ZONE_RADIUS) {
      _hostage.state = 'safe';
      _addScore(200);
      _addLog('HOSTAGE DELIVERED TO SAFE ZONE +200');
      _showWarn('HOSTAGE SAFE! +200', 3.0);
      if (window.KillFeedEvents && typeof window.KillFeedEvents.addEvent === 'function') {
        window.KillFeedEvents.addEvent('HOSTAGE SAFE +200', '', 'rescue');
      }
    }
  }

  // ── Negotiation prompt update ─────────────────────────────────
  function _updateNegotPrompt() {
    if (!_hudNegot) return;
    if (_dialogueOpen) { _hudNegot.style.display = 'none'; return; }
    if (!_hostage || _hostage.state !== 'captive') { _hudNegot.style.display = 'none'; return; }
    var pPos = _getPlayerPos();
    if (!pPos) { _hudNegot.style.display = 'none'; return; }
    var dist = _dist2D(pPos, _hostage.mesh.position);
    if (dist <= NEGOT_RANGE) {
      _hudNegot.textContent = '[L] INITIATE NEGOTIATION';
      _hudNegot.style.display = 'block';
    } else {
      _hudNegot.style.display = 'none';
    }
  }

  // ── Sniper crosshair highlight ────────────────────────────────
  function _updateSniperHighlight(dt) {
    if (_sniperWindow <= 0) {
      if (_hudSniperAlert) _hudSniperAlert.style.display = 'none';
      return;
    }
    _sniperWindow -= dt;
    if (_sniperWindow <= 0) {
      _sniperWindow = 0;
      if (_hudSniperAlert) _hudSniperAlert.style.display = 'none';
      _addLog('SNIPER WINDOW CLOSED');
    } else {
      if (_hudSniperAlert) {
        var secs = Math.ceil(_sniperWindow);
        _hudSniperAlert.textContent = 'SNIPER WINDOW: ' + secs + 's — AIM HEADS';
        _hudSniperAlert.style.display = 'block';
      }
      // Apply green highlight tint to taker heads
      for (var i = 0; i < _takers.length; i++) {
        if (_takers[i].alive && _takers[i].mesh) {
          _takers[i].mesh.traverse(function (child) {
            if (child.isMesh && child.userData.isHead) {
              child.material.color.setHex(0x22ff55);
            }
          });
        }
      }
    }
  }

  // ── Stun timer ────────────────────────────────────────────────
  function _updateStunTimer(dt) {
    if (!_hvtStunned || _hvtCaptured) return;
    _hvtStunTimer -= dt;
    if (_hvtStunTimer <= 0) {
      _hvtStunned = false;
      _hvtStunTimer = 0;
      _addLog('HVT STUN WINDOW EXPIRED');
      _showWarn('CAPTURE WINDOW EXPIRED', 2.0);
    }
  }

  // ── Public: spawnScenario ─────────────────────────────────────
  function spawnScenario(x, z) {
    var sc = _getScene();
    var T = window.THREE;
    if (!sc || !T) {
      console.warn('[HostageNegotiation] Scene or THREE not available');
      return;
    }

    // Pick HVT data
    var hvtPick = Math.floor(Math.random() * HVT_NAMES.length);
    _hvtData = {
      name:   HVT_NAMES[hvtPick],
      rank:   HVT_RANKS[hvtPick],
      bounty: HVT_BOUNTY[hvtPick]
    };

    // Spawn hostage
    var hostageMesh = _makeHostageMesh();
    hostageMesh.position.set(x, 0, z);
    sc.add(hostageMesh);
    _hostage = {
      mesh: hostageMesh,
      state: 'captive',
      followPlayer: false,
      escortAnim: 0
    };

    // Spawn takers orbiting the hostage
    _hvtIndex = Math.floor(Math.random() * HOSTAGE_TAKER_COUNT);
    _takers = [];
    for (var i = 0; i < HOSTAGE_TAKER_COUNT; i++) {
      var isHVT = (i === _hvtIndex);
      var takerMesh = _makeTakerMesh(isHVT);
      var angle = (i / HOSTAGE_TAKER_COUNT) * Math.PI * 2;
      var tr = 2.0 + Math.random() * 0.8;
      takerMesh.position.set(
        x + Math.cos(angle) * tr,
        0,
        z + Math.sin(angle) * tr
      );
      sc.add(takerMesh);
      _takers.push({
        mesh: takerMesh,
        alive: true,
        state: 'shield',    // 'shield' | 'surrendered' | 'captured' | 'dead'
        orbitAngle: angle,
        orbitRadius: tr,
        orbitSpeed: 0.25 + Math.random() * 0.15,
        aggressive: false,
        isHVT: isHVT,
        stunProgress: 0
      });
    }

    // Safe zone (offset from hostage position)
    var safeX = x + 18;
    var safeZ = z + 8;
    var safeZoneMesh = _makeSafeZoneMesh(safeX, safeZ);
    sc.add(safeZoneMesh);
    _safeZone = { mesh: safeZoneMesh, position: { x: safeX, y: 0, z: safeZ } };

    _addLog('SCENARIO ACTIVE — HVT: ' + _hvtData.name);
    _ensureHUD();
  }

  // ── Public: init ─────────────────────────────────────────────
  function init(scene, camera) {
    if (_inited) return;
    _inited = true;
    _scene = scene || null;
    _camera = camera || null;
    _ensureHUD();
    _setupKeys();
  }

  // ── Public: update ───────────────────────────────────────────
  function update(delta) {
    var dt = delta || 0.016;
    if (dt <= 0) return;

    // Warning overlay fade
    if (_warnTimer > 0) {
      _warnTimer -= dt;
      if (_warnTimer <= 0) {
        _warnTimer = 0;
        if (_hudWarnEl) _hudWarnEl.style.display = 'none';
      }
    }

    // Delay timer countdown
    if (_delayTimer > 0) {
      _delayTimer -= dt;
      if (_delayTimer < 0) _delayTimer = 0;
    }

    // Binoculars
    _updateBinoculars(dt);
    if (!_bKeyHeld && _hudBinoOverlay) {
      _hudBinoOverlay.style.display = 'none';
      if (_hudHvtPanel && !_hvtMarked) _hudHvtPanel.style.display = 'none';
    }

    // Sniper highlight
    _updateSniperHighlight(dt);

    // Stun timer
    _updateStunTimer(dt);

    // Taker AI
    for (var i = 0; i < _takers.length; i++) {
      _updateTaker(_takers[i], dt);
    }

    // Hostage follow
    _updateHostageFollow(dt);

    // Negotiation prompt
    _updateNegotPrompt();

    // Safe zone pulse
    if (_safeZone && _safeZone.mesh) {
      _safeZone.mesh.material.opacity = 0.4 + 0.25 * Math.sin(Date.now() * 0.003);
    }
  }

  // ── Public: getNegotiationState ───────────────────────────────
  function getNegotiationState() {
    return {
      active: _negotPhaseActive,
      dialogueOpen: _dialogueOpen,
      hostageState: _hostage ? _hostage.state : 'none',
      aliveTakers: _countAliveTakers(),
      hvtMarked: _hvtMarked,
      hvtCaptured: _hvtCaptured,
      sniperWindowActive: _sniperWindow > 0,
      delayActive: _delayTimer > 0,
      lastOutcome: _negotOutcome,
      log: _logEntries.slice()
    };
  }

  // ── Public: notifyExplosion (weapon system hook) ──────────────
  function notifyExplosion(pos) {
    if (!_hostage || _hostage.state !== 'captive') return;
    if (!pos) return;
    var dist = _dist3D(pos, _hostage.mesh.position);
    if (dist <= HOSTAGE_KILL_RANGE) {
      _killHostage();
    }
  }

  // ── Public: reset ─────────────────────────────────────────────
  function reset() {
    var sc = _getScene();

    if (_hostage && _hostage.mesh && sc) sc.remove(_hostage.mesh);
    for (var i = 0; i < _takers.length; i++) {
      if (_takers[i].mesh && sc) sc.remove(_takers[i].mesh);
    }
    if (_safeZone && _safeZone.mesh && sc) sc.remove(_safeZone.mesh);

    _hostage         = null;
    _takers          = [];
    _safeZone        = null;
    _hvtIndex        = -1;
    _hvtData         = null;
    _hvtMarked       = false;
    _hvtStunned      = false;
    _hvtStunTimer    = 0;
    _hvtCaptured     = false;

    _negotiating     = false;
    _negotPhaseActive= false;
    _dialogueOpen    = false;
    _negotOutcome    = null;
    _delayTimer      = 0;
    _sniperWindow    = 0;

    _binoHeld        = false;
    _binoHoldTimer   = 0;
    _lKeyHeld        = false;
    _lKeyDown        = false;
    _bKeyHeld        = false;
    _fKeyDown        = false;

    _logEntries      = [];
    _warnTimer       = 0;

    if (_hudNegot)       _hudNegot.style.display      = 'none';
    if (_hudDialogue)    _hudDialogue.style.display    = 'none';
    if (_hudSniperAlert) _hudSniperAlert.style.display = 'none';
    if (_hudBinoOverlay) _hudBinoOverlay.style.display = 'none';
    if (_hudHvtPanel)    _hudHvtPanel.style.display    = 'none';
    if (_hudLogEl)       _hudLogEl.style.display       = 'none';
    if (_hudWarnEl)      _hudWarnEl.style.display      = 'none';
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init: init,
    update: update,
    spawnScenario: spawnScenario,
    getNegotiationState: getNegotiationState,
    notifyExplosion: notifyExplosion,
    reset: reset
  };
})();
