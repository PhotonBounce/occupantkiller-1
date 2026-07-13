// ============================================================
//  hostage-crisis.js — Hostage Crisis Module
//  Features:
//    1. H+C simultaneous keypress (both within 400ms) to activate
//    2. Bank lobby BoxGeometry 25x5x18 (0x887766)
//       Teller counter BoxGeometry 15x2x1.5 (0x998877)
//       Vault door BoxGeometry 3x4x0.5 (0x888888)
//    3. 5 hostage BoxGeometry civilians (0xFFDDCC) on ground
//    4. 4 taker BoxGeometry criminals (0x333355) with pistols
//    5. Tension meter 0-100: starts 20; +2/min, +15 spotted,
//       +25 shot fired, -10 megaphone talk; 100 = hostage executed
//    6. Negotiation: press N opens megaphone HUD; 3 options
//       (distract/demand/empathize); correct random sequence -20;
//       wrong +10
//    7. Sniper support: X toggles scope overlay; identify closest
//       taker to hostage; SPACE calls shot; clean if >1.5u from
//       hostage; 4 uses
//    8. Tactical breach: hold B 3s = order; 2 SWAT (0x334433);
//       30% panic-execute per alerted taker
//    9. Hostage rescue: health 1-100; critical <30 flashes HUD;
//       E near critical = first aid; E+move to extraction zone
//       BoxGeometry (0x00FF44)
//   10. Resolution scoring: all saved + no deaths = +3000;
//       -500 per lost; +200 per taker neutralized without shots;
//       breach -300; under 8min +500
//   11. HUD: CRISIS [TENSION: N%] [HOSTAGES: N/5 SAFE]
//           [TAKERS: N] [NEGOTIATIONS: N] | STATUS: TENSE/CRITICAL/RESOLVED
//  Public API: { init(scene, camera, renderer), update(delta), reset() }
// ============================================================
window.HostageCrisis = (function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  var ACTIVATION_WINDOW   = 0.4;    // seconds between H and C keypresses
  var TENSION_START       = 20;
  var TENSION_RATE_MIN    = 2;      // per minute
  var TENSION_SPOTTED     = 15;
  var TENSION_SHOT        = 25;
  var TENSION_TALK        = -10;
  var TENSION_SEQ_CORRECT = -20;
  var TENSION_SEQ_WRONG   = 10;
  var NUM_HOSTAGES        = 5;
  var NUM_TAKERS          = 4;
  var NUM_SWAT            = 2;
  var SNIPER_USES         = 4;
  var SNIPER_SAFE_DIST    = 1.5;    // units from hostage for clean kill
  var BREACH_HOLD_TIME    = 3.0;    // seconds to hold B
  var PANIC_CHANCE        = 0.30;   // per alerted taker
  var CRITICAL_HP         = 30;
  var TIME_BONUS_LIMIT    = 8 * 60; // 8 minutes in seconds
  var SCORE_PERFECT       = 3000;
  var SCORE_HOSTAGE_LOST  = -500;
  var SCORE_TAKER_SILENT  = 200;    // neutralized without shots
  var SCORE_BREACH_USED   = -300;
  var SCORE_TIME_BONUS    = 500;

  // Negotiation sequence options
  var NEG_OPTIONS = ['DISTRACT', 'DEMAND', 'EMPATHIZE'];
  var NEG_SEQUENCE_LEN = 3;

  // Colors
  var COLOR_LOBBY         = 0x887766;
  var COLOR_COUNTER       = 0x998877;
  var COLOR_VAULT         = 0x888888;
  var COLOR_HOSTAGE       = 0xFFDDCC;
  var COLOR_TAKER         = 0x333355;
  var COLOR_SWAT          = 0x334433;
  var COLOR_EXTRACTION    = 0x00FF44;

  // ── State ───────────────────────────────────────────────────
  var _scene              = null;
  var _camera             = null;
  var _renderer           = null;
  var _active             = false;
  var _inited             = false;
  var _addedKeys          = false;

  // Activation timing
  var _hPressTime         = -999;
  var _cPressTime         = -999;

  // Tension
  var _tension            = TENSION_START;
  var _elapsedTime        = 0;
  var _shotFired          = false;
  var _shotsFiredTotal    = 0;
  var _playerSpotted      = false;

  // Sniper
  var _sniperActive       = false;
  var _sniperUses         = SNIPER_USES;
  var _origFOV            = 75;
  var _sniperLineSegs     = null;

  // Breach
  var _bHoldTimer         = 0;
  var _bHeld              = false;
  var _breachOrdered      = false;
  var _breachUsed         = false;
  var _swatUnits          = [];

  // Negotiation
  var _negOpen            = false;
  var _negCount           = 0;
  var _negSequence        = [];   // correct sequence (random each game)
  var _negProgress        = [];   // player's entered choices this round
  var _negRoundActive     = false;

  // Hostages & takers
  var _hostages           = [];
  var _takers             = [];
  var _takersSilent       = 0;    // neutralized without shots

  // Extraction
  var _extractionMesh     = null;
  var _carriedHostage     = null;
  var _extractionPos      = { x: 20, y: 0, z: 0 };

  // Scene objects
  var _lobbyGroup         = null;

  // Resolution
  var _resolved           = false;
  var _score              = 0;

  // Key state
  var _keys               = {};
  var _prev               = {};

  // HUD
  var _hudEl              = null;
  var _bannerEl           = null;
  var _negPanelEl         = null;
  var _crosshairEl        = null;
  var _sniperOverlayEl    = null;

  // Flash state for critical hostages
  var _flashTimer         = 0;
  var _flashOn            = false;

  // ── Helpers ──────────────────────────────────────────────────
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
  function _dist3D(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function _dist2D(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }
  function _makeMat(color, opts) {
    var params = { color: color };
    if (opts) { for (var k in opts) { params[k] = opts[k]; } }
    return new THREE.MeshLambertMaterial(params);
  }
  function _makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function _now() {
    return (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;
  }
  function _addScore(pts) {
    _score += pts;
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

  // ── Key Listener ─────────────────────────────────────────────
  function _setupKeys() {
    if (_addedKeys) return;
    _addedKeys = true;
    document.addEventListener('keydown', function (e) {
      _keys[e.code] = true;
      // Track press time for H and C activation
      if (e.code === 'KeyH') { _hPressTime = _now(); }
      if (e.code === 'KeyC') { _cPressTime = _now(); }
    });
    document.addEventListener('keyup', function (e) {
      _keys[e.code] = false;
    });
  }

  // ── Random negotiation sequence ───────────────────────────────
  function _generateNegSequence() {
    _negSequence = [];
    for (var i = 0; i < NEG_SEQUENCE_LEN; i++) {
      _negSequence.push(Math.floor(Math.random() * NEG_OPTIONS.length));
    }
  }

  // ── Build bank lobby ──────────────────────────────────────────
  function _buildLobby(scene) {
    var group = new THREE.Group();
    group.position.set(0, 0, -20);

    // Floor slab
    var floorGeo = new THREE.BoxGeometry(25, 0.2, 18);
    var floorMat = _makeMat(0x665544);
    var floor = _makeMesh(floorGeo, floorMat);
    floor.position.y = -0.1;
    group.add(floor);

    // Main lobby box (walls via thin panels, semi-transparent)
    var lobbyMat = _makeMat(COLOR_LOBBY, { opacity: 0.35, transparent: true });

    // Front wall
    var frontWall = _makeMesh(new THREE.BoxGeometry(25, 5, 0.25), lobbyMat);
    frontWall.position.set(0, 2.5, -9);
    group.add(frontWall);

    // Back wall
    var backWall = _makeMesh(new THREE.BoxGeometry(25, 5, 0.25), lobbyMat);
    backWall.position.set(0, 2.5, 9);
    group.add(backWall);

    // Left wall
    var leftWall = _makeMesh(new THREE.BoxGeometry(0.25, 5, 18), lobbyMat);
    leftWall.position.set(-12.5, 2.5, 0);
    group.add(leftWall);

    // Right wall
    var rightWall = _makeMesh(new THREE.BoxGeometry(0.25, 5, 18), lobbyMat);
    rightWall.position.set(12.5, 2.5, 0);
    group.add(rightWall);

    // Ceiling
    var ceilGeo = new THREE.BoxGeometry(25, 0.2, 18);
    var ceilMat = _makeMat(0x776655, { opacity: 0.4, transparent: true });
    var ceil = _makeMesh(ceilGeo, ceilMat);
    ceil.position.y = 5;
    group.add(ceil);

    // Teller counter 15x2x1.5 (0x998877)
    var counterGeo = new THREE.BoxGeometry(15, 2, 1.5);
    var counterMat = _makeMat(COLOR_COUNTER);
    var counter = _makeMesh(counterGeo, counterMat);
    counter.position.set(0, 1, 4);
    group.add(counter);

    // Vault door 3x4x0.5 (0x888888)
    var vaultGeo = new THREE.BoxGeometry(3, 4, 0.5);
    var vaultMat = _makeMat(COLOR_VAULT);
    var vault = _makeMesh(vaultGeo, vaultMat);
    vault.position.set(8, 2, 8.75);
    group.add(vault);

    scene.add(group);
    _lobbyGroup = group;

    // Extraction zone
    var exGeo = new THREE.BoxGeometry(3, 0.15, 3);
    var exMat = _makeMat(COLOR_EXTRACTION, { opacity: 0.7, transparent: true, emissive: COLOR_EXTRACTION, emissiveIntensity: 0.3 });
    var exMesh = _makeMesh(exGeo, exMat);
    exMesh.position.set(_extractionPos.x, 0.08, _extractionPos.z);
    scene.add(exMesh);
    _extractionMesh = exMesh;

    // Ambient light
    var amb = new THREE.AmbientLight(0x887766, 0.9);
    scene.add(amb);

    // Interior point light
    var ptLight = new THREE.PointLight(0xFFEECC, 1.2, 30);
    ptLight.position.set(0, 4, -20);
    scene.add(ptLight);
  }

  // ── Build hostages ────────────────────────────────────────────
  function _buildHostages(scene) {
    _hostages = [];
    var bx = 0, bz = -20;
    var positions = [
      { x: bx - 5,  z: bz - 1 },
      { x: bx - 2,  z: bz + 1 },
      { x: bx,      z: bz - 2 },
      { x: bx + 3,  z: bz + 0 },
      { x: bx + 6,  z: bz - 1 }
    ];
    for (var i = 0; i < NUM_HOSTAGES; i++) {
      var pos = positions[i];
      var geo = new THREE.BoxGeometry(0.6, 0.4, 1.2);
      var mat = _makeMat(COLOR_HOSTAGE);
      var mesh = _makeMesh(geo, mat);
      mesh.position.set(pos.x, 0.2, pos.z);
      mesh.rotation.y = _rand(0, Math.PI * 2);
      scene.add(mesh);

      var hp = Math.floor(_rand(40, 100));
      _hostages.push({
        mesh: mesh,
        hp: hp,
        alive: true,
        safe: false,
        critical: hp < CRITICAL_HP,
        carried: false,
        pos: { x: pos.x, y: 0.2, z: pos.z },
        idx: i
      });
    }
  }

  // ── Build takers ──────────────────────────────────────────────
  function _buildTakers(scene) {
    _takers = [];
    var bx = 0, bz = -20;
    var positions = [
      { x: bx - 6, z: bz + 3 },
      { x: bx - 2, z: bz + 5 },
      { x: bx + 3, z: bz + 5 },
      { x: bx + 7, z: bz + 3 }
    ];
    for (var i = 0; i < NUM_TAKERS; i++) {
      var pos = positions[i];
      // Taker body
      var geo = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var mat = _makeMat(COLOR_TAKER);
      var mesh = _makeMesh(geo, mat);
      mesh.position.set(pos.x, 0.9, pos.z);
      scene.add(mesh);

      // Pistol (small box)
      var pistolGeo = new THREE.BoxGeometry(0.15, 0.25, 0.5);
      var pistolMat = _makeMat(0x111111);
      var pistol = _makeMesh(pistolGeo, pistolMat);
      pistol.position.set(0.45, 0, 0.3);
      mesh.add(pistol);

      _takers.push({
        mesh: mesh,
        alive: true,
        alerted: false,
        neutralizedSilent: false,
        pos: { x: pos.x, y: 0.9, z: pos.z },
        patrolDir: (i % 2 === 0) ? 1 : -1,
        patrolT: 0,
        idx: i
      });
    }
  }

  // ── HUD ───────────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'hc-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#eee',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border-radius:4px',
      'z-index:9000',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _statusLabel() {
    if (_tension >= 100) return 'CRITICAL';
    if (_tension >= 60)  return 'TENSE';
    if (_resolved)       return 'RESOLVED';
    return 'TENSE';
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var safe = 0;
    for (var i = 0; i < _hostages.length; i++) {
      if (_hostages[i].safe) safe++;
    }
    var alive = 0;
    for (var j = 0; j < _takers.length; j++) {
      if (_takers[j].alive) alive++;
    }
    var status = _statusLabel();
    var tensionPct = Math.round(_clamp(_tension, 0, 100));
    var tensionColor = tensionPct >= 80 ? '#FF4444' : tensionPct >= 50 ? '#FFAA44' : '#44FF88';
    _hudEl.innerHTML =
      'CRISIS [TENSION: <span style="color:' + tensionColor + '">' + tensionPct + '%</span>]' +
      ' [HOSTAGES: ' + safe + '/5 SAFE]' +
      ' [TAKERS: ' + alive + ']' +
      ' [NEGOTIATIONS: ' + _negCount + ']' +
      ' | STATUS: <span style="color:' + (status === 'CRITICAL' ? '#FF2222' : status === 'TENSE' ? '#FFAA44' : '#44FF88') + '">' + status + '</span>';

    // Flash critical hostage count
    if (_flashOn) {
      var critCount = 0;
      for (var k = 0; k < _hostages.length; k++) {
        if (_hostages[k].alive && !_hostages[k].safe && _hostages[k].hp < CRITICAL_HP) critCount++;
      }
      if (critCount > 0) {
        _hudEl.innerHTML += ' <span style="color:#FF2222;font-weight:bold">[CRITICAL: ' + critCount + ' HOSTAGE' + (critCount > 1 ? 'S' : '') + ']</span>';
      }
    }

    if (_sniperUses < SNIPER_USES) {
      _hudEl.innerHTML += ' [SNIPER: ' + _sniperUses + ' left]';
    }
    if (_breachUsed) {
      _hudEl.innerHTML += ' [BREACH USED]';
    }
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) { _hudEl.parentNode.removeChild(_hudEl); }
    _hudEl = null;
  }

  // ── Banner ────────────────────────────────────────────────────
  function _showBanner(text, color, duration) {
    if (_bannerEl && _bannerEl.parentNode) {
      _bannerEl.parentNode.removeChild(_bannerEl);
    }
    _bannerEl = document.createElement('div');
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:28%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:' + (color || '#fff'),
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'padding:14px 30px',
      'border-radius:8px',
      'z-index:9200',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    _bannerEl.textContent = text;
    document.body.appendChild(_bannerEl);
    var el = _bannerEl;
    setTimeout(function () {
      if (el && el.parentNode) { el.parentNode.removeChild(el); }
      if (_bannerEl === el) { _bannerEl = null; }
    }, duration || 3000);
  }

  // ── Sniper crosshair ──────────────────────────────────────────
  function _showSniperOverlay() {
    if (_sniperOverlayEl) return;

    // Dark vignette overlay
    _sniperOverlayEl = document.createElement('div');
    _sniperOverlayEl.id = 'hc-sniper-overlay';
    _sniperOverlayEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9050',
      'background:radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.82) 60%)'
    ].join(';');
    document.body.appendChild(_sniperOverlayEl);

    // SVG crosshair
    _crosshairEl = document.createElement('div');
    _crosshairEl.id = 'hc-crosshair';
    _crosshairEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'z-index:9100'
    ].join(';');
    _crosshairEl.innerHTML = [
      '<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">',
      '<circle cx="40" cy="40" r="36" stroke="#FF2222" stroke-width="1.5" fill="none" opacity="0.9"/>',
      '<circle cx="40" cy="40" r="18" stroke="#FF4444" stroke-width="1" fill="none" opacity="0.6"/>',
      '<line x1="40" y1="2"  x2="40" y2="32" stroke="#FF2222" stroke-width="1.5" opacity="0.9"/>',
      '<line x1="40" y1="48" x2="40" y2="78" stroke="#FF2222" stroke-width="1.5" opacity="0.9"/>',
      '<line x1="2"  y1="40" x2="32" y2="40" stroke="#FF2222" stroke-width="1.5" opacity="0.9"/>',
      '<line x1="48" y1="40" x2="78" y2="40" stroke="#FF2222" stroke-width="1.5" opacity="0.9"/>',
      '<circle cx="40" cy="40" r="2.5" fill="#FF2222" opacity="0.95"/>',
      '</svg>'
    ].join('');
    document.body.appendChild(_crosshairEl);

    // Add LineSegments crosshair to scene (3D)
    var scene = _getScene();
    if (scene) {
      var pts = [
        -0.5, 0, 0,  -0.1, 0, 0,
         0.1, 0, 0,   0.5, 0, 0,
         0, -0.5, 0,  0, -0.1, 0,
         0,  0.1, 0,  0,  0.5, 0
      ];
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      var mat = new THREE.LineBasicMaterial({ color: 0xFF2222 });
      _sniperLineSegs = new THREE.LineSegments(geo, mat);
      var cam = _getCamera();
      if (cam) {
        _sniperLineSegs.position.copy(cam.position);
        _sniperLineSegs.position.z -= 2;
      }
      scene.add(_sniperLineSegs);
    }
  }

  function _hideSniperOverlay() {
    if (_sniperOverlayEl && _sniperOverlayEl.parentNode) {
      _sniperOverlayEl.parentNode.removeChild(_sniperOverlayEl);
    }
    _sniperOverlayEl = null;
    if (_crosshairEl && _crosshairEl.parentNode) {
      _crosshairEl.parentNode.removeChild(_crosshairEl);
    }
    _crosshairEl = null;
    var scene = _getScene();
    if (_sniperLineSegs && scene) {
      scene.remove(_sniperLineSegs);
      _sniperLineSegs = null;
    }
    // Restore FOV
    var cam = _getCamera();
    if (cam) {
      cam.fov = _origFOV;
      cam.updateProjectionMatrix();
    }
  }

  function _activateSniper() {
    if (_sniperActive) {
      // Toggle off
      _sniperActive = false;
      _hideSniperOverlay();
      _showBanner('SNIPER SCOPE OFF', '#AAAAAA', 1500);
      return;
    }
    if (_sniperUses <= 0) {
      _showBanner('NO SNIPER USES REMAINING', '#FF4444', 2000);
      return;
    }
    _sniperActive = true;
    var cam = _getCamera();
    if (cam) {
      _origFOV = cam.fov || 75;
      cam.fov = 18;
      cam.updateProjectionMatrix();
    }
    _showSniperOverlay();

    // Identify closest taker to any hostage
    var closestTaker = null, closestDist = Infinity;
    for (var ti = 0; ti < _takers.length; ti++) {
      var tk = _takers[ti];
      if (!tk.alive) continue;
      for (var hi = 0; hi < _hostages.length; hi++) {
        var h = _hostages[hi];
        if (!h.alive) continue;
        var d = _dist3D(tk.mesh.position, h.mesh.position);
        if (d < closestDist) { closestDist = d; closestTaker = tk; }
      }
    }

    var infoStr = closestTaker
      ? ('SNIPER SCOPE — Target taker at dist ' + closestDist.toFixed(1) + 'u from hostage | SPACE=fire | X=close | ' + _sniperUses + ' uses left')
      : ('SNIPER SCOPE — No clear target | SPACE=fire | X=close');
    _showBanner(infoStr, '#FFFF44', 4000);
  }

  function _sniperFire() {
    if (!_sniperActive || _sniperUses <= 0) return;

    _sniperUses--;

    // Find closest taker to any hostage
    var closestTaker = null, closestDist = Infinity;
    for (var ti = 0; ti < _takers.length; ti++) {
      var tk = _takers[ti];
      if (!tk.alive) continue;
      for (var hi = 0; hi < _hostages.length; hi++) {
        var h = _hostages[hi];
        if (!h.alive) continue;
        var d = _dist3D(tk.mesh.position, h.mesh.position);
        if (d < closestDist) { closestDist = d; closestTaker = tk; }
      }
    }

    if (!closestTaker) {
      _showBanner('NO TARGET VISIBLE', '#FFAAAA', 2000);
      _sniperActive = false;
      _hideSniperOverlay();
      return;
    }

    if (closestDist <= SNIPER_SAFE_DIST) {
      // Risky shot — may hit hostage
      _showBanner('TOO CLOSE TO HOSTAGE — RISKY SHOT ABORTED', '#FF4444', 3000);
      _sniperActive = false;
      _hideSniperOverlay();
      return;
    }

    // Clean kill
    _neutralizeTaker(closestTaker, true);
    _addTension(TENSION_SHOT);
    _shotFired = true;
    _shotsFiredTotal++;
    _showBanner('CLEAN KILL — TAKER DOWN! TENSION +' + TENSION_SHOT, '#44FF88', 2500);

    _sniperActive = false;
    _hideSniperOverlay();
  }

  // ── Neutralize taker ──────────────────────────────────────────
  function _neutralizeTaker(taker, silent) {
    if (!taker.alive) return;
    taker.alive = false;
    taker.neutralizedSilent = !!silent;
    if (silent) { _takersSilent++; }
    // Fall over
    taker.mesh.rotation.z = Math.PI / 2;
    taker.mesh.position.y = 0.25;
  }

  // ── Tension ───────────────────────────────────────────────────
  function _addTension(amount) {
    _tension = _clamp(_tension + amount, 0, 100);
  }

  // ── Negotiation panel ─────────────────────────────────────────
  function _openNegPanel() {
    if (_negPanelEl) return;
    _negRoundActive = true;
    _negProgress = [];

    _negPanelEl = document.createElement('div');
    _negPanelEl.id = 'hc-neg-panel';
    _negPanelEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(8,8,24,0.94)',
      'color:#eee',
      'font-family:monospace',
      'font-size:14px',
      'padding:22px 30px',
      'border:2px solid #4488FF',
      'border-radius:6px',
      'z-index:9100',
      'min-width:300px',
      'max-width:420px'
    ].join(';');

    var title = document.createElement('div');
    title.style.cssText = 'font-size:16px;font-weight:bold;color:#88AAFF;margin-bottom:8px;text-align:center;';
    title.textContent = '[ MEGAPHONE NEGOTIATION ]';
    _negPanelEl.appendChild(title);

    var seqHint = document.createElement('div');
    seqHint.style.cssText = 'color:#AAAAAA;font-size:12px;margin-bottom:14px;text-align:center;';
    seqHint.textContent = 'Choose ' + NEG_SEQUENCE_LEN + ' options in correct order. Wrong sequence = TENSION +' + TENSION_SEQ_WRONG;
    _negPanelEl.appendChild(seqHint);

    var progressDiv = document.createElement('div');
    progressDiv.id = 'hc-neg-progress';
    progressDiv.style.cssText = 'color:#FFFF88;font-size:12px;margin-bottom:10px;min-height:18px;text-align:center;';
    progressDiv.textContent = 'Sequence: (none yet)';
    _negPanelEl.appendChild(progressDiv);

    for (var oi = 0; oi < NEG_OPTIONS.length; oi++) {
      (function (optIdx) {
        var btn = document.createElement('button');
        btn.style.cssText = [
          'display:block',
          'width:100%',
          'margin:6px 0',
          'padding:9px 14px',
          'background:#1a2a4a',
          'color:#eee',
          'border:1px solid #4466AA',
          'border-radius:4px',
          'font-family:monospace',
          'font-size:13px',
          'cursor:pointer',
          'text-align:left'
        ].join(';');
        btn.textContent = '[' + (optIdx + 1) + '] ' + NEG_OPTIONS[optIdx];
        btn.addEventListener('click', function () {
          _negProgress.push(optIdx);
          var pd = document.getElementById('hc-neg-progress');
          if (pd) {
            var labels = [];
            for (var pi = 0; pi < _negProgress.length; pi++) {
              labels.push(NEG_OPTIONS[_negProgress[pi]]);
            }
            pd.textContent = 'Sequence: ' + labels.join(' → ');
          }
          if (_negProgress.length >= NEG_SEQUENCE_LEN) {
            _resolveNegotiation();
          }
        });
        _negPanelEl.appendChild(btn);
      })(oi);
    }

    var cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = [
      'display:block',
      'width:100%',
      'margin-top:12px',
      'padding:7px',
      'background:#3a1010',
      'color:#ffaaaa',
      'border:1px solid #881111',
      'border-radius:4px',
      'font-family:monospace',
      'cursor:pointer'
    ].join(';');
    cancelBtn.textContent = '[ESC] CANCEL';
    cancelBtn.addEventListener('click', _closeNegPanel);
    _negPanelEl.appendChild(cancelBtn);

    document.body.appendChild(_negPanelEl);
  }

  function _closeNegPanel() {
    if (_negPanelEl && _negPanelEl.parentNode) {
      _negPanelEl.parentNode.removeChild(_negPanelEl);
    }
    _negPanelEl = null;
    _negRoundActive = false;
    _negProgress = [];
  }

  function _resolveNegotiation() {
    // Check if sequence matches
    var correct = true;
    for (var i = 0; i < NEG_SEQUENCE_LEN; i++) {
      if (_negProgress[i] !== _negSequence[i]) { correct = false; break; }
    }
    _negCount++;
    if (correct) {
      _addTension(TENSION_SEQ_CORRECT);
      _addTension(TENSION_TALK);
      _showBanner('CORRECT SEQUENCE! TENSION ' + TENSION_SEQ_CORRECT + ' | MEGAPHONE -' + Math.abs(TENSION_TALK), '#44FF88', 3000);
      // Regenerate sequence for next round
      _generateNegSequence();
    } else {
      _addTension(TENSION_SEQ_WRONG);
      _showBanner('WRONG SEQUENCE — TAKERS AGITATED! TENSION +' + TENSION_SEQ_WRONG, '#FF4444', 3000);
    }
    _closeNegPanel();
  }

  // ── Tactical breach ───────────────────────────────────────────
  function _executeBreach() {
    if (_breachUsed) return;
    _breachUsed = true;
    _breachOrdered = true;
    var scene = _getScene();
    if (!scene) return;

    // Spawn 2 SWAT units entering from rear
    var bx = 0, bz = -20;
    var swatPositions = [
      { x: bx - 4, z: bz + 12 },
      { x: bx + 4, z: bz + 12 }
    ];
    _swatUnits = [];
    for (var si = 0; si < NUM_SWAT; si++) {
      var sp = swatPositions[si];
      var sGeo = new THREE.BoxGeometry(0.65, 1.8, 0.5);
      var sMat = _makeMat(COLOR_SWAT);
      var sMesh = _makeMesh(sGeo, sMat);
      sMesh.position.set(sp.x, 0.9, sp.z);
      scene.add(sMesh);
      _swatUnits.push({
        mesh: sMesh,
        pos: { x: sp.x, y: 0.9, z: sp.z },
        alive: true,
        targetIdx: si % _takers.length,
        arrived: false
      });
    }

    // Alert all alive takers — 30% chance each executes nearest hostage in panic
    for (var ti = 0; ti < _takers.length; ti++) {
      var tk = _takers[ti];
      if (!tk.alive) continue;
      tk.alerted = true;
      if (Math.random() < PANIC_CHANCE) {
        // Execute nearest alive hostage
        var nearest = null, nearDist = Infinity;
        for (var hi = 0; hi < _hostages.length; hi++) {
          var h = _hostages[hi];
          if (!h.alive || h.safe) continue;
          var d = _dist3D(tk.mesh.position, h.mesh.position);
          if (d < nearDist) { nearDist = d; nearest = h; }
        }
        if (nearest) {
          nearest.alive = false;
          nearest.mesh.rotation.z = Math.PI / 2;
          nearest.mesh.position.y = 0.1;
          _showBanner('TAKER PANICS — HOSTAGE EXECUTED!', '#FF2222', 3500);
        }
      }
    }

    _addScore(SCORE_BREACH_USED);
    _showBanner('BREACH ORDER GIVEN — SWAT ENTERING REAR', '#FFAA44', 3000);
  }

  // ── First aid / carry logic ───────────────────────────────────
  function _tryFirstAid() {
    var pp = _getPlayerPos();
    if (!pp) return;

    // If carrying a hostage and near extraction — rescue
    if (_carriedHostage) {
      var exDist = _dist3D(pp, _extractionMesh.position);
      if (exDist < 3.5) {
        _carriedHostage.safe = true;
        _carriedHostage.carried = false;
        _carriedHostage.mesh.position.set(_extractionPos.x, 0.2, _extractionPos.z);
        var idx = _carriedHostage.idx;
        _carriedHostage = null;
        _showBanner('HOSTAGE ' + (idx + 1) + ' EXTRACTED! SAFE!', '#44FF88', 2500);
        return;
      }
    }

    // Find nearest critical alive hostage within 2.5u
    var nearest = null, nearDist = Infinity;
    for (var i = 0; i < _hostages.length; i++) {
      var h = _hostages[i];
      if (!h.alive || h.safe || h.carried) continue;
      if (h.hp >= CRITICAL_HP) continue;
      var d = _dist3D(pp, h.mesh.position);
      if (d < 2.5 && d < nearDist) { nearDist = d; nearest = h; }
    }

    if (nearest) {
      nearest.hp = _clamp(nearest.hp + 40, 0, 100);
      nearest.critical = nearest.hp < CRITICAL_HP;
      _showBanner('FIRST AID APPLIED — HP STABILIZED (' + nearest.hp + ')', '#44FFAA', 2500);
      // Allow carrying: if moving, check extraction later
      nearest.carried = true;
      _carriedHostage = nearest;
      _showBanner('HOSTAGE PICKED UP — MOVE TO EXTRACTION ZONE (GREEN)', '#44FF88', 3000);
      return;
    }

    // Try non-critical hostages within 2.5u
    var nearest2 = null, nearDist2 = Infinity;
    for (var j = 0; j < _hostages.length; j++) {
      var h2 = _hostages[j];
      if (!h2.alive || h2.safe || h2.carried) continue;
      var d2 = _dist3D(pp, h2.mesh.position);
      if (d2 < 2.5 && d2 < nearDist2) { nearDist2 = d2; nearest2 = h2; }
    }
    if (nearest2) {
      nearest2.carried = true;
      _carriedHostage = nearest2;
      _showBanner('HOSTAGE PICKED UP — MOVE TO EXTRACTION ZONE (GREEN)', '#44FFAA', 3000);
    }
  }

  // ── Spawn scenario ────────────────────────────────────────────
  function _spawnScenario() {
    var scene = _getScene();
    if (!scene) return;

    _tension          = TENSION_START;
    _elapsedTime      = 0;
    _shotFired        = false;
    _shotsFiredTotal  = 0;
    _playerSpotted    = false;
    _sniperActive     = false;
    _sniperUses       = SNIPER_USES;
    _breachOrdered    = false;
    _breachUsed       = false;
    _swatUnits        = [];
    _negCount         = 0;
    _negOpen          = false;
    _negRoundActive   = false;
    _negProgress      = [];
    _carriedHostage   = null;
    _resolved         = false;
    _score            = 0;
    _takersSilent     = 0;
    _flashTimer       = 0;
    _flashOn          = false;

    _generateNegSequence();

    _buildLobby(scene);
    _buildHostages(scene);
    _buildTakers(scene);
    _buildHUD();

    _active = true;

    _showBanner(
      'HOSTAGE CRISIS — H+C | N=Megaphone | X=Sniper | Hold B 3s=Breach | E=Aid/Carry',
      '#FFAA44', 6000
    );
  }

  // ── Update SWAT units ─────────────────────────────────────────
  function _updateSwat(delta) {
    for (var si = 0; si < _swatUnits.length; si++) {
      var sw = _swatUnits[si];
      if (!sw.alive || sw.arrived) continue;

      var target = _takers[sw.targetIdx];
      if (!target) continue;

      if (!target.alive) {
        // Find another alive taker
        for (var ti = 0; ti < _takers.length; ti++) {
          if (_takers[ti].alive) { sw.targetIdx = ti; target = _takers[ti]; break; }
        }
        if (!target || !target.alive) { sw.arrived = true; continue; }
      }

      var tp = target.mesh.position;
      var sp = sw.mesh.position;
      var dx = tp.x - sp.x;
      var dz = tp.z - sp.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.6) {
        // Neutralize taker
        _neutralizeTaker(target, false);
        _showBanner('SWAT NEUTRALIZES TAKER!', '#44AAFF', 2000);
        sw.arrived = true;
      } else {
        var spd = 4.0;
        sw.mesh.position.x += (dx / dist) * spd * delta;
        sw.mesh.position.z += (dz / dist) * spd * delta;
        sw.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
  }

  // ── Update taker AI ───────────────────────────────────────────
  function _updateTakers(delta) {
    var pp = _getPlayerPos();
    var bx = 0, bz = -20;
    for (var ti = 0; ti < _takers.length; ti++) {
      var tk = _takers[ti];
      if (!tk.alive) continue;

      // Simple patrol: oscillate along X axis
      tk.patrolT += delta * 0.6 * tk.patrolDir;
      tk.mesh.position.x = bx + (tk.idx - 1.5) * 4 + Math.sin(tk.patrolT) * 2.5;

      // Check player proximity for spotting
      if (pp) {
        var pdist = _dist3D(tk.mesh.position, pp);
        if (pdist < 5 && !_playerSpotted) {
          _playerSpotted = true;
          _addTension(TENSION_SPOTTED);
          _showBanner('YOU HAVE BEEN SPOTTED! TENSION +' + TENSION_SPOTTED, '#FF8844', 2500);
        }
      }
    }
  }

  // ── Update carried hostage follows camera ─────────────────────
  function _updateCarried(delta) {
    if (!_carriedHostage) return;
    var pp = _getPlayerPos();
    if (!pp) return;
    _carriedHostage.mesh.position.set(pp.x + 0.5, pp.y - 0.8, pp.z - 0.5);
  }

  // ── Tension over time ─────────────────────────────────────────
  function _updateTension(delta) {
    // +2 per minute = +2/60 per second
    _addTension((TENSION_RATE_MIN / 60) * delta);

    if (_tension >= 100) {
      _tension = 100;
      // Execute random alive non-safe hostage
      for (var i = 0; i < _hostages.length; i++) {
        var h = _hostages[i];
        if (h.alive && !h.safe) {
          h.alive = false;
          h.mesh.rotation.z = Math.PI / 2;
          h.mesh.position.y = 0.1;
          _showBanner('TENSION 100%! CRISIS ESCALATES — HOSTAGE EXECUTED!', '#FF2222', 4000);
          _tension = 60; // reset tension after escalation
          break;
        }
      }
    }
  }

  // ── Flash critical hostages ───────────────────────────────────
  function _updateCriticalFlash(delta) {
    _flashTimer += delta;
    if (_flashTimer >= 0.4) {
      _flashTimer = 0;
      _flashOn = !_flashOn;
      for (var i = 0; i < _hostages.length; i++) {
        var h = _hostages[i];
        if (!h.alive || h.safe) continue;
        if (h.hp < CRITICAL_HP) {
          h.mesh.material.color.setHex(_flashOn ? 0xFF2222 : COLOR_HOSTAGE);
        }
      }
    }
  }

  // ── Extraction zone pulse ─────────────────────────────────────
  function _updateExtraction(delta) {
    if (!_extractionMesh) return;
    _extractionMesh.rotation.y += delta * 0.8;
    var t = Date.now() * 0.002;
    _extractionMesh.material.opacity = 0.5 + 0.3 * Math.sin(t);
  }

  // ── Check resolution ──────────────────────────────────────────
  function _checkResolution() {
    if (_resolved) return;

    var aliveHostages = 0, safeHostages = 0, aliveTakers = 0;
    for (var i = 0; i < _hostages.length; i++) {
      if (_hostages[i].alive) aliveHostages++;
      if (_hostages[i].safe) safeHostages++;
    }
    for (var j = 0; j < _takers.length; j++) {
      if (_takers[j].alive) aliveTakers++;
    }

    // Mission ends when all takers neutralized
    if (aliveTakers === 0) {
      _resolved = true;
      _active = false;

      // Score: lost hostages
      var lostHostages = NUM_HOSTAGES - aliveHostages;
      _addScore(lostHostages * SCORE_HOSTAGE_LOST);

      // Silent neutralizations
      _addScore(_takersSilent * SCORE_TAKER_SILENT);

      // Breach penalty (already applied on use)

      // Time bonus
      if (_elapsedTime < TIME_BONUS_LIMIT) {
        _addScore(SCORE_TIME_BONUS);
      }

      // Perfect?
      var perfect = (lostHostages === 0 && _shotsFiredTotal === 0);
      if (perfect) {
        _addScore(SCORE_PERFECT);
        _showBanner('PERFECT RESOLUTION! ALL HOSTAGES SAFE! NO SHOTS! +' + (SCORE_PERFECT + _takersSilent * SCORE_TAKER_SILENT + (_elapsedTime < TIME_BONUS_LIMIT ? SCORE_TIME_BONUS : 0)), '#44FF44', 8000);
      } else {
        var msg = 'CRISIS RESOLVED — ' + safeHostages + '/5 SAFE';
        msg += ' | SILENT: ' + _takersSilent + ' | SCORE: ' + _score;
        _showBanner(msg, '#44AAFF', 8000);
      }
    } else if (aliveHostages === 0) {
      // All hostages lost
      _resolved = true;
      _active = false;
      _showBanner('ALL HOSTAGES LOST — MISSION FAILED', '#FF2222', 8000);
    }
  }

  // ── Process keys ─────────────────────────────────────────────
  function _processKeys() {
    var hKey     = !!_keys['KeyH'];
    var cKey     = !!_keys['KeyC'];
    var nKey     = !!_keys['KeyN'];
    var xKey     = !!_keys['KeyX'];
    var bKey     = !!_keys['KeyB'];
    var eKey     = !!_keys['KeyE'];
    var spaceKey = !!_keys['Space'];
    var escKey   = !!_keys['Escape'];

    // H+C activation (within 400ms)
    if (!_active) {
      var t = _now();
      if (hKey && !_prev['KeyH'] && Math.abs(t - _cPressTime) < ACTIVATION_WINDOW) {
        _spawnScenario();
      }
      if (cKey && !_prev['KeyC'] && Math.abs(t - _hPressTime) < ACTIVATION_WINDOW) {
        _spawnScenario();
      }
    }

    if (_active) {
      // N = open megaphone
      if (nKey && !_prev['KeyN']) {
        if (!_negPanelEl) { _openNegPanel(); }
      }

      // X = toggle sniper scope
      if (xKey && !_prev['KeyX']) {
        _activateSniper();
      }

      // SPACE = sniper shot
      if (spaceKey && !_prev['Space'] && _sniperActive) {
        _sniperFire();
      }

      // B = hold for breach
      if (bKey && !_breachUsed) {
        _bHoldTimer += 0.016; // approximate; actual delta applied in update
        if (_bHoldTimer >= BREACH_HOLD_TIME) {
          _executeBreach();
          _bHoldTimer = 0;
        }
      } else if (!bKey) {
        _bHoldTimer = 0;
      }

      // E = first aid / carry / extract
      if (eKey && !_prev['KeyE']) {
        _tryFirstAid();
      }

      // ESC = close panels
      if (escKey) {
        _closeNegPanel();
        if (_sniperActive) {
          _sniperActive = false;
          _hideSniperOverlay();
        }
      }
    }

    // Store prev
    _prev['KeyH'] = hKey;
    _prev['KeyC'] = cKey;
    _prev['KeyN'] = nKey;
    _prev['KeyX'] = xKey;
    _prev['KeyB'] = bKey;
    _prev['KeyE'] = eKey;
    _prev['Space'] = spaceKey;
    _prev['Escape'] = escKey;
  }

  // ── Public API ────────────────────────────────────────────────
  function init(scene, camera, renderer) {
    _scene    = scene    || null;
    _camera   = camera   || null;
    _renderer = renderer || null;
    _inited   = true;
    _setupKeys();
  }

  function update(delta) {
    if (!_inited) return;

    var dt = Math.min(delta || 0.016, 0.1);

    _processKeys();

    if (!_active) return;

    _elapsedTime += dt;

    _updateTension(dt);
    _updateTakers(dt);
    if (_breachUsed) { _updateSwat(dt); }
    _updateCarried(dt);
    _updateCriticalFlash(dt);
    _updateExtraction(dt);
    _updateHUD();
    _checkResolution();

    // Update sniper line segs to follow camera
    if (_sniperActive && _sniperLineSegs) {
      var cam = _getCamera();
      if (cam) {
        _sniperLineSegs.position.copy(cam.position);
        var dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(cam.quaternion);
        dir.multiplyScalar(3);
        _sniperLineSegs.position.add(dir);
        _sniperLineSegs.quaternion.copy(cam.quaternion);
      }
    }
  }

  function reset() {
    _active = false;
    _resolved = false;

    var scene = _getScene();

    if (_lobbyGroup && scene) { scene.remove(_lobbyGroup); }
    _lobbyGroup = null;

    if (_extractionMesh && scene) { scene.remove(_extractionMesh); }
    _extractionMesh = null;

    for (var hi = 0; hi < _hostages.length; hi++) {
      if (_hostages[hi].mesh && scene) { scene.remove(_hostages[hi].mesh); }
    }
    _hostages = [];

    for (var ti = 0; ti < _takers.length; ti++) {
      if (_takers[ti].mesh && scene) { scene.remove(_takers[ti].mesh); }
    }
    _takers = [];

    for (var si = 0; si < _swatUnits.length; si++) {
      if (_swatUnits[si].mesh && scene) { scene.remove(_swatUnits[si].mesh); }
    }
    _swatUnits = [];

    if (_sniperActive) { _hideSniperOverlay(); }
    _sniperActive = false;

    _removeHUD();
    _closeNegPanel();

    if (_bannerEl && _bannerEl.parentNode) { _bannerEl.parentNode.removeChild(_bannerEl); _bannerEl = null; }

    var cam = _getCamera();
    if (cam) {
      cam.fov = _origFOV;
      cam.updateProjectionMatrix();
    }

    _tension        = TENSION_START;
    _elapsedTime    = 0;
    _negCount       = 0;
    _breachUsed     = false;
    _breachOrdered  = false;
    _sniperUses     = SNIPER_USES;
    _carriedHostage = null;
    _score          = 0;
    _takersSilent   = 0;
    _bHoldTimer     = 0;
    _shotsFiredTotal = 0;
    _playerSpotted  = false;
    _flashTimer     = 0;
    _flashOn        = false;
  }

  return { init: init, update: update, reset: reset };

}());
