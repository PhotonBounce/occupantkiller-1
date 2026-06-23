// extraction-zone.js — Mission Extraction Zones, Landing Zones, and Countdown-to-Evac
// FPS game module for Three.js. No build step; Three.js available as global THREE.
// API: ExtractionZone.init(scene, camera), .update(delta), .spawnZone(x, z),
//      .getZones(), .triggerExtraction(), .reset()

window.ExtractionZone = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────────
  var ZONE_RADIUS          = 4;       // 8-unit diameter → 4 radius
  var SMOKE_HEIGHT         = 20;      // marker smoke column height
  var HELI_APPROACH_DIST   = 40;      // spawn distance from LZ
  var HELI_CRUISE_ALT      = 25;      // altitude during approach
  var HELI_HOVER_ALT       = 4;       // altitude when hovering over LZ
  var HELI_HOVER_DURATION  = 10;      // seconds to hover before boarding
  var HELI_SPEED           = 12;      // units/sec approach speed
  var RADIO_TRIGGER_DIST   = 30;      // units: play radio call when player this close
  var ENEMY_CONTESTED_DIST = 25;      // enemies within this → CONTESTED
  var ENEMY_HOT_DIST       = 10;      // enemies within this → HOT
  var COUNTDOWN_SECURE     = 15;      // seconds in SECURE state
  var COUNTDOWN_CONTESTED  = 30;      // seconds in CONTESTED state
  var BOARD_KEY            = 'KeyE';  // key to board helicopter

  // Security state colors (hex)
  var COLOR_SECURE      = 0x00ff44;
  var COLOR_CONTESTED   = 0xffcc00;
  var COLOR_HOT         = 0xff8800;
  var COLOR_COMPROMISED = 0xff2222;

  // ── Module state ──────────────────────────────────────────────────────────────
  var _scene      = null;
  var _camera     = null;
  var _zones      = [];           // array of zone objects
  var _particles  = [];           // smoke/particle objects
  var _chevrons   = [];           // rotating chevron meshes across all zones
  var _keysDown   = {};

  // Helicopter state (one active at a time)
  var _heliGroup      = null;
  var _heliMainRotor  = null;
  var _heliTailRotor  = null;
  var _heliState      = 'none';   // none | approaching | descending | hovering | boarding | departed
  var _heliTarget     = null;     // THREE.Vector3 — LZ world position
  var _heliTimer      = 0;
  var _activeZone     = null;     // zone currently being extracted

  // Countdown HUD
  var _countdownEl    = null;
  var _countdownTimer = 0;
  var _countdownMax   = 0;
  var _countdownActive = false;

  // Mission complete overlay
  var _missionCompleteEl = null;
  var _missionStartTime  = 0;
  var _missionStats      = { kills: 0, objectives: 0 };
  var _extractionTriggered = false;

  // Radio call tracking
  var _radioPlayed    = {};  // zoneId → bool

  // Audio context
  var _audioCtx       = null;
  var _heliSoundNodes = null;
  var _heartbeatInterval = null;

  // Compass HUD
  var _compassEl      = null;
  var _compassBearings = [];

  // ── Key handling ──────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;
    if (e.code === BOARD_KEY && _heliState === 'hovering') {
      _tryBoard();
    }
  }
  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────────
  function _ensureAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return _audioCtx;
  }

  // 60 Hz heartbeat pulse (actually 60 BPM = 1 Hz pulse, but spec says 60Hz → interpret as 60BPM)
  function _startHeartbeat() {
    _stopHeartbeat();
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    function beat() {
      try {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {}
    }
    beat();
    // 60 BPM → 1000ms interval
    _heartbeatInterval = setInterval(beat, 1000);
  }

  function _stopHeartbeat() {
    if (_heartbeatInterval) {
      clearInterval(_heartbeatInterval);
      _heartbeatInterval = null;
    }
  }

  // 120 Hz rotor buzz (continuous 120Hz oscillator)
  function _startRotorSound() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    if (_heliSoundNodes) _stopRotorSound();
    try {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);

      // AM modulation at ~8 Hz for blade-slap character
      var amOsc = ctx.createOscillator();
      amOsc.type = 'sine';
      amOsc.frequency.setValueAtTime(8, ctx.currentTime);

      var amGain = ctx.createGain();
      amGain.gain.setValueAtTime(0.3, ctx.currentTime);
      amOsc.connect(amGain);

      var masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 3);

      amGain.connect(masterGain.gain);
      osc.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start();
      amOsc.start();
      _heliSoundNodes = { osc: osc, amOsc: amOsc, amGain: amGain, masterGain: masterGain };
    } catch (e) {}
  }

  function _stopRotorSound() {
    if (!_heliSoundNodes) return;
    try {
      _heliSoundNodes.osc.stop();
      _heliSoundNodes.amOsc.stop();
    } catch (e) {}
    _heliSoundNodes = null;
  }

  // Radio crackle + "RAPTOR THIS IS EXTRACTION POINT ALPHA" beep pattern
  function _playRadioCall() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    // Beep pattern encoding "RAPTOR … ALPHA" using morse-like short/long beeps
    var pattern = [80, 40, 80, 40, 120, 40, 80, 40, 120, 100,  // RAPTOR
                   80, 40, 80, 40, 120, 100,                    // THIS
                   80, 40, 120, 40, 80, 100,                    // IS
                   80, 40, 120, 40, 80, 40, 120, 40, 80, 100]; // ALPHA
    var t = ctx.currentTime + 0.1;
    // Crackle burst first
    try {
      var noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      var data = noiseBuffer.getChannelData(0);
      for (var n = 0; n < data.length; n++) {
        data[n] = (Math.random() * 2 - 1) * 0.3;
      }
      var noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      t += 0.2;
    } catch (e) {}
    // Beep tones
    for (var i = 0; i < pattern.length; i++) {
      try {
        var dur = pattern[i] / 1000;
        var b = ctx.createOscillator();
        b.type = 'square';
        b.frequency.setValueAtTime(800 + (i % 3) * 100, t);
        var bg = ctx.createGain();
        bg.gain.setValueAtTime(0.08, t);
        bg.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
        b.connect(bg);
        bg.connect(ctx.destination);
        b.start(t);
        b.stop(t + dur);
        t += dur + 0.02;
      } catch (e) {}
    }
  }

  // ── HUD helpers ───────────────────────────────────────────────────────────────
  function _hexCSS(hex) {
    return '#' + ('000000' + hex.toString(16)).slice(-6);
  }

  function _ensureCountdownEl() {
    if (_countdownEl) return;
    _countdownEl = document.createElement('div');
    _countdownEl.id = 'ez-countdown';
    _countdownEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'color:#00ff44',
      'text-shadow:0 0 16px #00ff44,0 2px 6px #000',
      'pointer-events:none',
      'text-align:center',
      'z-index:9900',
      'letter-spacing:3px',
      'line-height:1.3',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_countdownEl);
  }

  function _showCountdown(sec, color) {
    _ensureCountdownEl();
    _countdownEl.style.color = _hexCSS(color);
    _countdownEl.style.textShadow = '0 0 16px ' + _hexCSS(color) + ',0 2px 6px #000';
    _countdownEl.innerHTML = 'HOLD POSITION<br>EVAC IN ' + Math.ceil(sec) + 's';
    _countdownEl.style.display = 'block';
  }

  function _hideCountdown() {
    if (_countdownEl) _countdownEl.style.display = 'none';
    _stopHeartbeat();
  }

  // Mission complete overlay
  function _showMissionComplete(timeSec, kills, objectives, score, grade) {
    if (_missionCompleteEl) {
      if (_missionCompleteEl.parentNode) _missionCompleteEl.parentNode.removeChild(_missionCompleteEl);
    }
    _missionCompleteEl = document.createElement('div');
    _missionCompleteEl.id = 'ez-mission-complete';
    _missionCompleteEl.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'background:rgba(0,0,0,0.88)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'color:#ffffff',
      'z-index:99999',
      'text-align:center'
    ].join(';');

    var gradeColor = grade === 'S' ? '#ffd700' :
                     grade === 'A' ? '#00ff88' :
                     grade === 'B' ? '#44aaff' :
                     grade === 'C' ? '#ffcc00' : '#ff4444';

    var mm = Math.floor(timeSec / 60);
    var ss = Math.floor(timeSec % 60);
    var timeStr = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;

    // Score breakdown: kills worth 500 each, objectives 2000 each, time bonus
    var killScore = kills * 500;
    var objScore  = objectives * 2000;
    var timeBonus = Math.max(0, 10000 - Math.floor(timeSec) * 10);
    var totalCalc = killScore + objScore + timeBonus;

    _missionCompleteEl.innerHTML = [
      '<div style="font-size:52px;font-weight:bold;letter-spacing:6px;color:#ffd700;text-shadow:0 0 30px #ffd700;margin-bottom:20px">MISSION COMPLETE</div>',
      '<div style="font-size:120px;font-weight:bold;color:' + gradeColor + ';text-shadow:0 0 40px ' + gradeColor + ';line-height:1;margin-bottom:16px">' + grade + '</div>',
      '<div style="font-size:18px;letter-spacing:2px;color:#aaaaaa;margin-bottom:28px">PERFORMANCE GRADE</div>',
      '<table style="border-collapse:collapse;font-size:18px;letter-spacing:1px;margin-bottom:28px;min-width:320px">',
        '<tr><td style="text-align:left;padding:6px 20px;color:#aaaaaa">TIME TAKEN</td><td style="text-align:right;padding:6px 20px;color:#ffffff">' + timeStr + '</td></tr>',
        '<tr><td style="text-align:left;padding:6px 20px;color:#aaaaaa">ENEMIES KILLED</td><td style="text-align:right;padding:6px 20px;color:#ff6644">' + kills + '</td></tr>',
        '<tr><td style="text-align:left;padding:6px 20px;color:#aaaaaa">OBJECTIVES DONE</td><td style="text-align:right;padding:6px 20px;color:#44aaff">' + objectives + '</td></tr>',
        '<tr style="border-top:1px solid #444"><td style="text-align:left;padding:6px 20px;color:#aaaaaa">KILL SCORE</td><td style="text-align:right;padding:6px 20px;color:#ffaa44">+' + killScore + '</td></tr>',
        '<tr><td style="text-align:left;padding:6px 20px;color:#aaaaaa">OBJECTIVE SCORE</td><td style="text-align:right;padding:6px 20px;color:#44bbff">+' + objScore + '</td></tr>',
        '<tr><td style="text-align:left;padding:6px 20px;color:#aaaaaa">TIME BONUS</td><td style="text-align:right;padding:6px 20px;color:#aaffaa">+' + timeBonus + '</td></tr>',
        '<tr style="border-top:2px solid #888"><td style="text-align:left;padding:8px 20px;font-size:22px;font-weight:bold;color:#ffd700">TOTAL SCORE</td><td style="text-align:right;padding:8px 20px;font-size:22px;font-weight:bold;color:#ffd700">' + totalCalc + '</td></tr>',
      '</table>',
      '<button id="ez-continue-btn" style="',
        'font-family:monospace;font-size:22px;font-weight:bold;letter-spacing:3px;',
        'padding:14px 48px;border:2px solid #00ff44;background:transparent;color:#00ff44;',
        'cursor:pointer;text-shadow:0 0 10px #00ff44;transition:background 0.2s;',
      '">CONTINUE</button>'
    ].join('');

    document.body.appendChild(_missionCompleteEl);

    var btn = document.getElementById('ez-continue-btn');
    if (btn) {
      btn.addEventListener('mouseover', function () { btn.style.background = 'rgba(0,255,68,0.15)'; });
      btn.addEventListener('mouseout',  function () { btn.style.background = 'transparent'; });
      btn.addEventListener('click', function () {
        if (_missionCompleteEl && _missionCompleteEl.parentNode) {
          _missionCompleteEl.parentNode.removeChild(_missionCompleteEl);
        }
        _missionCompleteEl = null;
        _extractionTriggered = false;
        if (window.ExtractionZone) window.ExtractionZone.reset();
      });
    }
  }

  function _calcGrade(score) {
    if (score >= 20000) return 'S';
    if (score >= 14000) return 'A';
    if (score >= 8000)  return 'B';
    if (score >= 4000)  return 'C';
    return 'F';
  }

  // ── Compass HUD ───────────────────────────────────────────────────────────────
  function _ensureCompassEl() {
    if (_compassEl) return;
    _compassEl = document.createElement('div');
    _compassEl.id = 'ez-compass';
    _compassEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'right:20px',
      'display:flex',
      'flex-direction:column',
      'gap:6px',
      'pointer-events:none',
      'z-index:800'
    ].join(';');
    document.body.appendChild(_compassEl);
  }

  function _updateCompass() {
    if (!_compassEl) return;
    var px = 0, pz = 0;
    if (_camera) { px = _camera.position.x; pz = _camera.position.z; }
    while (_compassEl.firstChild) _compassEl.removeChild(_compassEl.firstChild);
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      var dx = z.x - px;
      var dz = z.z - pz;
      var dist = Math.round(Math.sqrt(dx * dx + dz * dz));
      var angle = Math.atan2(dx, -dz) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      var color = z.securityState === 'SECURE'      ? '#00ff44' :
                  z.securityState === 'CONTESTED'   ? '#ffcc00' :
                  z.securityState === 'HOT'         ? '#ff8800' : '#ff2222';
      var row = document.createElement('div');
      row.style.cssText = 'font-family:monospace;font-size:12px;font-weight:bold;color:' + color +
        ';text-shadow:0 0 6px ' + color + ',0 1px 3px #000;letter-spacing:1px;';
      row.textContent = '▶ LZ' + (i + 1) + ' ' + Math.round(angle) + '°  ' + dist + 'm';
      _compassEl.appendChild(row);
    }
  }

  // ── Three.js mesh builders ────────────────────────────────────────────────────
  function _buildZoneMesh(color) {
    var group = new THREE.Group();

    // Ground disc
    var discGeo = new THREE.CylinderGeometry(ZONE_RADIUS, ZONE_RADIUS, 0.12, 36);
    var discMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    var disc = new THREE.Mesh(discGeo, discMat);
    group.add(disc);

    // Outer ring
    var ringGeo = new THREE.TorusGeometry(ZONE_RADIUS, 0.18, 8, 48);
    var ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85, depthWrite: false });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);

    // Chevron lines (6 rotated arrows arranged in circle)
    var chevronGroup = new THREE.Group();
    chevronGroup.position.y = 0.15;
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var r = ZONE_RADIUS * 0.55;
      // Each chevron: two line segments forming a ">" shape
      var chevPoints = [
        new THREE.Vector3(-0.5, 0, -0.5),
        new THREE.Vector3( 0.5, 0,  0.0),
        new THREE.Vector3(-0.5, 0,  0.5)
      ];
      var chevGeo = new THREE.BufferGeometry().setFromPoints(chevPoints);
      var chevMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
      var chev = new THREE.Line(chevGeo, chevMat);
      chev.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      chev.rotation.y = -angle;
      chevronGroup.add(chev);
    }
    group.add(chevronGroup);

    return { group: group, disc: disc, ring: ring, discMat: discMat, ringMat: ringMat,
             chevronGroup: chevronGroup };
  }

  function _buildSmokeColumn(color) {
    var group = new THREE.Group();
    var particles = [];
    // Create 60 billboard quads that drift upward
    for (var i = 0; i < 60; i++) {
      var geo = new THREE.PlaneGeometry(0.8 + Math.random() * 0.8, 0.8 + Math.random() * 0.8);
      var mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      var mesh = new THREE.Mesh(geo, mat);
      var initY = Math.random() * SMOKE_HEIGHT;
      mesh.position.set(
        (Math.random() - 0.5) * 0.8,
        initY,
        (Math.random() - 0.5) * 0.8
      );
      group.add(mesh);
      particles.push({ mesh: mesh, phase: Math.random() * Math.PI * 2, speed: 1.5 + Math.random() * 1.5 });
    }
    return { group: group, particles: particles };
  }

  function _buildHelicopter() {
    var group = new THREE.Group();
    var oliveMat = new THREE.MeshLambertMaterial({ color: 0x4b5320 });
    var darkMat  = new THREE.MeshLambertMaterial({ color: 0x222222 });

    // Fuselage (UH-60 rough shape)
    var fuseGeo = new THREE.BoxGeometry(5.5, 2.0, 1.8);
    var fuse = new THREE.Mesh(fuseGeo, oliveMat);
    fuse.castShadow = true;
    group.add(fuse);

    // Nose taper
    var noseGeo = new THREE.ConeGeometry(0.8, 1.8, 8);
    var nose = new THREE.Mesh(noseGeo, oliveMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(3.4, -0.1, 0);
    group.add(nose);

    // Tail boom
    var tailGeo = new THREE.CylinderGeometry(0.22, 0.12, 4.5, 8);
    var tail = new THREE.Mesh(tailGeo, oliveMat);
    tail.rotation.z = 0.18;
    tail.position.set(-4.2, 0.4, 0);
    group.add(tail);

    // Tail fin
    var finGeo = new THREE.BoxGeometry(0.1, 1.2, 0.8);
    var fin = new THREE.Mesh(finGeo, oliveMat);
    fin.position.set(-6.2, 1.2, 0);
    group.add(fin);

    // Main rotor hub
    var rotorHub = new THREE.Group();
    rotorHub.position.set(0, 1.3, 0);
    group.add(rotorHub);
    _heliMainRotor = rotorHub;

    // 4 rotor blades
    for (var b = 0; b < 4; b++) {
      var bladeGeo = new THREE.BoxGeometry(0.18, 0.04, 3.8);
      var blade = new THREE.Mesh(bladeGeo, darkMat);
      blade.rotation.y = (b / 4) * Math.PI * 2;
      rotorHub.add(blade);
    }

    // Tail rotor
    var tailRotorHub = new THREE.Group();
    tailRotorHub.position.set(-6.3, 0.8, 0.35);
    group.add(tailRotorHub);
    _heliTailRotor = tailRotorHub;
    for (var t = 0; t < 2; t++) {
      var tBladeGeo = new THREE.BoxGeometry(0.06, 0.04, 1.0);
      var tBlade = new THREE.Mesh(tBladeGeo, darkMat);
      tBlade.rotation.z = t * Math.PI / 2;
      tailRotorHub.add(tBlade);
    }

    // Landing skids
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (var s = 0; s < 2; s++) {
      var skidGeo = new THREE.CylinderGeometry(0.06, 0.06, 5.0, 6);
      var skid = new THREE.Mesh(skidGeo, skidMat);
      skid.rotation.z = Math.PI / 2;
      skid.position.set(0, -1.2, (s === 0 ? 0.8 : -0.8));
      group.add(skid);
    }

    // Nav lights
    var redLight = new THREE.PointLight(0xff0000, 1.0, 8);
    redLight.position.set(-6.5, 0, 0);
    group.add(redLight);
    var greenLight = new THREE.PointLight(0x00ff00, 1.0, 8);
    greenLight.position.set(3.5, 0, 0.9);
    group.add(greenLight);

    return group;
  }

  // ── Zone management ───────────────────────────────────────────────────────────
  function _createZone(x, z) {
    var id = _zones.length;
    var color = COLOR_SECURE;
    var meshData = _buildZoneMesh(color);
    meshData.group.position.set(x, 0, z);

    var smokeData = _buildSmokeColumn(0x44ff88);
    smokeData.group.position.set(x, 0, z);

    if (_scene) {
      _scene.add(meshData.group);
      _scene.add(smokeData.group);
    }

    var zone = {
      id: id,
      x: x,
      z: z,
      securityState: 'SECURE',
      meshData: meshData,
      smokeData: smokeData,
      chevronAngle: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      countdownActive: false,
      countdownTimer: 0,
      countdownMax: COUNTDOWN_SECURE,
      radioPlayed: false,
      extracting: false
    };
    _zones.push(zone);
    return zone;
  }

  // ── Security state detection ───────────────────────────────────────────────────
  function _getEnemyList() {
    if (window._enemies) return window._enemies;
    if (window.Enemies && window.Enemies.getList) return window.Enemies.getList();
    if (window.Enemies && window.Enemies.getAll)  return window.Enemies.getAll();
    return [];
  }

  function _nearestEnemyDist(zoneX, zoneZ) {
    var enemies = _getEnemyList();
    if (!enemies || !enemies.length) return Infinity;
    var minDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var pos = (e && e.mesh && e.mesh.position) ? e.mesh.position : (e && e.position ? e.position : null);
      if (!pos) continue;
      var dx = pos.x - zoneX;
      var dz = pos.z - zoneZ;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  function _updateZoneSecurity(zone) {
    var dist = _nearestEnemyDist(zone.x, zone.z);
    var prev = zone.securityState;
    if (dist <= ENEMY_HOT_DIST) {
      zone.securityState = 'HOT';
    } else if (dist <= ENEMY_CONTESTED_DIST) {
      zone.securityState = 'CONTESTED';
    } else {
      zone.securityState = 'SECURE';
    }
    // COMPROMISED is set externally or if enemies are literally inside zone
    if (dist < ZONE_RADIUS * 0.5) {
      zone.securityState = 'COMPROMISED';
    }
    return prev !== zone.securityState;
  }

  function _securityColor(state) {
    if (state === 'SECURE')      return COLOR_SECURE;
    if (state === 'CONTESTED')   return COLOR_CONTESTED;
    if (state === 'HOT')         return COLOR_HOT;
    return COLOR_COMPROMISED;
  }

  function _applyZoneColor(zone) {
    var color = _securityColor(zone.securityState);
    zone.meshData.discMat.color.setHex(color);
    zone.meshData.ringMat.color.setHex(color);
    zone.meshData.chevronGroup.traverse(function (obj) {
      if (obj.material) obj.material.color.setHex(color);
    });
    // Recolor smoke
    var smokeColor = color;
    zone.smokeData.particles.forEach(function (p) {
      p.mesh.material.color.setHex(smokeColor);
    });
  }

  // ── Helicopter approach/descent/hover ─────────────────────────────────────────
  function _spawnHelicopter(zone) {
    if (_heliGroup && _scene) _scene.remove(_heliGroup);
    _heliGroup = _buildHelicopter();
    _heliMainRotor = null; // will be set in _buildHelicopter via closure — but we re-find them
    // Re-find rotors after build
    _heliGroup.traverse(function (obj) {
      if (obj.userData && obj.userData.isMainRotor) _heliMainRotor = obj;
    });

    // Spawn 40 units away from LZ in a random horizontal direction
    var spawnAngle = Math.random() * Math.PI * 2;
    var spawnX = zone.x + Math.cos(spawnAngle) * HELI_APPROACH_DIST;
    var spawnZ = zone.z + Math.sin(spawnAngle) * HELI_APPROACH_DIST;
    _heliGroup.position.set(spawnX, HELI_CRUISE_ALT, spawnZ);

    _heliTarget = new THREE.Vector3(zone.x, HELI_HOVER_ALT, zone.z);
    _heliState  = 'approaching';
    _heliTimer  = 0;
    _activeZone = zone;

    if (_scene) _scene.add(_heliGroup);
    _startRotorSound();
  }

  function _removeHelicopter() {
    if (_heliGroup && _scene) _scene.remove(_heliGroup);
    _heliGroup = null;
    _heliMainRotor = null;
    _heliTailRotor = null;
    _stopRotorSound();
    _heliState = 'none';
    _heliTimer = 0;
    _activeZone = null;
  }

  function _tryBoard() {
    if (_heliState !== 'hovering' || !_heliGroup || !_camera) return;
    var px = _camera.position.x;
    var pz = _camera.position.z;
    var zx = _heliGroup.position.x;
    var zz = _heliGroup.position.z;
    var dist = Math.sqrt((px - zx) * (px - zx) + (pz - zz) * (pz - zz));
    if (dist <= ZONE_RADIUS + 2) {
      _heliState = 'boarding';
      _heliTimer = 0;
      _hideCountdown();
      _showFlash('BOARDING EXTRACTION VEHICLE', 0x00ff44);
    }
  }

  function _showFlash(msg, color) {
    if (typeof document === 'undefined') return;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:30%','left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:26px',
      'font-weight:bold',
      'color:' + _hexCSS(color),
      'text-shadow:0 0 18px ' + _hexCSS(color) + ',0 2px 6px #000',
      'pointer-events:none',
      'z-index:9800',
      'letter-spacing:3px',
      'white-space:nowrap',
      'opacity:1',
      'transition:opacity 0.5s'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 2000);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2700);
  }

  // ── Smoke column update ────────────────────────────────────────────────────────
  function _updateSmoke(zone, dt) {
    var now = (typeof performance !== 'undefined') ? performance.now() * 0.001 : Date.now() * 0.001;
    var particles = zone.smokeData.particles;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      // Drift upward
      p.mesh.position.y += p.speed * dt;
      // Slight horizontal drift
      p.mesh.position.x += Math.sin(now * 0.5 + p.phase) * 0.3 * dt;
      p.mesh.position.z += Math.cos(now * 0.7 + p.phase) * 0.2 * dt;
      // Fade in then out based on height
      var frac = p.mesh.position.y / SMOKE_HEIGHT;
      p.mesh.material.opacity = frac < 0.1 ? frac * 5 * 0.45 :
                                frac > 0.8  ? (1 - frac) * 5 * 0.45 : 0.45;
      // Billboard toward camera
      if (_camera) p.mesh.lookAt(_camera.position);
      // Reset when reaching top
      if (p.mesh.position.y > SMOKE_HEIGHT) {
        p.mesh.position.set(
          (Math.random() - 0.5) * 0.6,
          0,
          (Math.random() - 0.5) * 0.6
        );
        p.speed = 1.5 + Math.random() * 1.5;
      }
    }
  }

  // ── Pulse ring pool (per-zone) ─────────────────────────────────────────────────
  // We reuse the zone ring mesh scale for pulsing directly
  function _updateZoneVisuals(zone, dt) {
    // Rotate chevrons
    zone.chevronAngle += dt * 0.8;
    zone.meshData.chevronGroup.rotation.y = zone.chevronAngle;

    // Pulse disc opacity
    zone.pulsePhase += dt * 2.0;
    var pulse = 0.25 + 0.15 * Math.sin(zone.pulsePhase);
    zone.meshData.discMat.opacity = pulse;

    // Ring scale pulse
    var ringPulse = 1.0 + 0.08 * Math.sin(zone.pulsePhase * 1.5);
    zone.meshData.ring.scale.set(ringPulse, 1, ringPulse);
  }

  // ── Enemy AI: move toward zones when player near ──────────────────────────────
  function _nudgeEnemiesAtZones(dt) {
    if (!_camera) return;
    var px = _camera.position.x, pz = _camera.position.z;
    var enemies = _getEnemyList();
    if (!enemies || !enemies.length) return;

    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];
      var pdx = px - zone.x, pdz = pz - zone.z;
      var playerDistToZone = Math.sqrt(pdx * pdx + pdz * pdz);
      if (playerDistToZone > 60) continue; // only when player near zone

      // Pick a subset of enemies to route toward the zone
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        var pos = (e && e.mesh && e.mesh.position) ? e.mesh.position : (e && e.position ? e.position : null);
        if (!pos) continue;
        var edx = pos.x - zone.x, edz = pos.z - zone.z;
        var eDist = Math.sqrt(edx * edx + edz * edz);
        if (eDist < 50 && eDist > ZONE_RADIUS) {
          // Gently steer enemy toward zone (non-overriding suggestion)
          var nx = (zone.x - pos.x) / eDist;
          var nz = (zone.z - pos.z) / eDist;
          // Apply only a slight bias so it doesn't break other AI
          pos.x += nx * 1.2 * dt;
          pos.z += nz * 1.2 * dt;
          if (e.mesh && e.mesh.position) {
            e.mesh.position.x += nx * 1.2 * dt;
            e.mesh.position.z += nz * 1.2 * dt;
          }
        }
      }
    }
  }

  // ── Boarding sequence: camera rises with heli → fade → mission complete ────────
  var _boardingFadeEl = null;
  var _boardingPhase  = 0; // 0=rising, 1=fading, 2=done

  function _updateBoarding(dt) {
    if (_heliState !== 'boarding') return;
    _heliTimer += dt;

    if (!_boardingFadeEl) {
      _boardingFadeEl = document.createElement('div');
      _boardingFadeEl.style.cssText = [
        'position:fixed','top:0','left:0','right:0','bottom:0',
        'background:rgba(0,0,0,0)',
        'pointer-events:none',
        'z-index:9950',
        'transition:background 2s'
      ].join(';');
      document.body.appendChild(_boardingFadeEl);
      _boardingPhase = 0;
    }

    // Rise camera with helicopter
    if (_boardingPhase === 0) {
      if (_heliGroup && _camera) {
        _camera.position.y += 4 * dt;
        _heliGroup.position.y += 4 * dt;
      }
      if (_heliTimer > 2.5) {
        _boardingPhase = 1;
        _boardingFadeEl.style.background = 'rgba(0,0,0,1)';
      }
    }

    // Fade to black then show mission complete
    if (_boardingPhase === 1 && _heliTimer > 4.5) {
      _boardingPhase = 2;
      _stopRotorSound();
      _removeHelicopter();

      var timeSec = (Date.now() - _missionStartTime) / 1000;
      var kills = (window._kills !== undefined) ? window._kills :
                  (window.player && window.player.kills !== undefined ? window.player.kills :
                  _missionStats.kills);
      var objectives = (window._objectivesCompleted !== undefined) ? window._objectivesCompleted :
                       _missionStats.objectives;
      var baseScore = kills * 500 + objectives * 2000 + Math.max(0, 10000 - Math.floor(timeSec) * 10);
      var grade = _calcGrade(baseScore);

      if (_boardingFadeEl && _boardingFadeEl.parentNode) {
        _boardingFadeEl.parentNode.removeChild(_boardingFadeEl);
      }
      _boardingFadeEl = null;

      _showMissionComplete(timeSec, kills, objectives, baseScore, grade);
      _heliState = 'done';
    }
  }

  // ── Helicopter movement update ────────────────────────────────────────────────
  function _updateHelicopter(dt) {
    if (_heliState === 'none' || _heliState === 'done') return;

    // Spin rotors
    if (_heliMainRotor) _heliMainRotor.rotation.y += 6.0 * dt;
    if (_heliTailRotor) _heliTailRotor.rotation.x += 14.0 * dt;

    if (_heliState === 'approaching') {
      if (!_heliGroup || !_heliTarget) return;
      // Approach cruise altitude, then descend to hover alt over LZ
      var cruiseTarget = new THREE.Vector3(_heliTarget.x, HELI_CRUISE_ALT, _heliTarget.z);
      var toTarget = cruiseTarget.clone().sub(_heliGroup.position);
      var distXZ = Math.sqrt(
        (_heliGroup.position.x - _heliTarget.x) * (_heliGroup.position.x - _heliTarget.x) +
        (_heliGroup.position.z - _heliTarget.z) * (_heliGroup.position.z - _heliTarget.z)
      );

      if (distXZ > 1.5) {
        var speed = Math.min(HELI_SPEED, distXZ * 1.5);
        var dir = toTarget.normalize();
        _heliGroup.position.addScaledVector(dir, speed * dt);
        // Face direction of travel
        var faceAngle = Math.atan2(dir.x, dir.z);
        _heliGroup.rotation.y += (faceAngle - _heliGroup.rotation.y) * Math.min(1, dt * 4);
      } else {
        // Reached LZ horizontal position; start descent
        _heliState = 'descending';
        _heliTimer = 0;
        _showFlash('EXTRACTION VEHICLE ON APPROACH', 0x00ff44);
      }
    }

    if (_heliState === 'descending') {
      if (!_heliGroup) return;
      var targetY = HELI_HOVER_ALT;
      var curY = _heliGroup.position.y;
      if (curY > targetY + 0.2) {
        _heliGroup.position.y -= 4.0 * dt;
      } else {
        _heliGroup.position.y = targetY;
        _heliState = 'hovering';
        _heliTimer = 0;
        _showFlash('EXTRACTION READY — ENTER ZONE + PRESS [E]', 0x00ff44);
      }
    }

    if (_heliState === 'hovering') {
      _heliTimer += dt;
      // Gentle hover bob
      if (_heliGroup) {
        _heliGroup.position.y = HELI_HOVER_ALT + Math.sin(_heliTimer * 1.2) * 0.15;
      }
      if (_heliTimer > HELI_HOVER_DURATION) {
        // Player didn't board in time; heli departs
        _heliState = 'departing';
        _heliTimer = 0;
        _showFlash('EXTRACTION VEHICLE DEPARTING', 0xff4444);
        _stopRotorSound();
      }
    }

    if (_heliState === 'departing') {
      _heliTimer += dt;
      if (_heliGroup) {
        _heliGroup.position.y += 6 * dt;
        _heliGroup.position.z -= 15 * dt;
      }
      if (_heliTimer > 5) {
        _removeHelicopter();
      }
    }

    if (_heliState === 'boarding') {
      _updateBoarding(dt);
    }
  }

  // ── Player position helper ────────────────────────────────────────────────────
  function _getPlayerPos() {
    if (_camera) return { x: _camera.position.x, z: _camera.position.z };
    if (window.player && window.player.position) return { x: window.player.position.x, z: window.player.position.z };
    return { x: 0, z: 0 };
  }

  // ── Zone update (countdown, radio, security) ─────────────────────────────────
  function _updateZone(zone, dt) {
    _updateZoneSecurity(zone);
    _applyZoneColor(zone);
    _updateZoneVisuals(zone, dt);
    _updateSmoke(zone, dt);

    var player = _getPlayerPos();
    var pdx = player.x - zone.x;
    var pdz = player.z - zone.z;
    var playerDist = Math.sqrt(pdx * pdx + pdz * pdz);

    // Radio call when player approaches
    if (!zone.radioPlayed && playerDist <= RADIO_TRIGGER_DIST) {
      zone.radioPlayed = true;
      _playRadioCall();
      _showFlash('RAPTOR — EXTRACTION POINT ALPHA', 0x44ffff);
    }

    // Countdown logic
    var inZone = playerDist <= ZONE_RADIUS;

    if (inZone && !zone.countdownActive && !zone.extracting) {
      if (zone.securityState === 'SECURE') {
        zone.countdownActive = true;
        zone.countdownMax    = COUNTDOWN_SECURE;
        zone.countdownTimer  = COUNTDOWN_SECURE;
        _startHeartbeat();
      } else if (zone.securityState === 'CONTESTED') {
        zone.countdownActive = true;
        zone.countdownMax    = COUNTDOWN_CONTESTED;
        zone.countdownTimer  = COUNTDOWN_CONTESTED;
        _startHeartbeat();
      } else if (zone.securityState === 'HOT') {
        _showFlash('ZONE TOO HOT — CANNOT EXTRACT', 0xff8800);
      } else if (zone.securityState === 'COMPROMISED') {
        _showFlash('ZONE COMPROMISED — FIND ANOTHER LZ', 0xff2222);
      }
    }

    if (!inZone && zone.countdownActive) {
      // Player left zone — abort countdown
      zone.countdownActive = false;
      zone.countdownTimer  = 0;
      _hideCountdown();
    }

    if (zone.countdownActive) {
      // If zone turned HOT/COMPROMISED during countdown
      if (zone.securityState === 'HOT' || zone.securityState === 'COMPROMISED') {
        zone.countdownActive = false;
        zone.countdownTimer  = 0;
        _hideCountdown();
        _showFlash('EXTRACTION ABORTED — ZONE COMPROMISED', 0xff2222);
        return;
      }

      zone.countdownTimer -= dt;
      var dispColor = _securityColor(zone.securityState);
      _showCountdown(zone.countdownTimer, dispColor);

      if (zone.countdownTimer <= 0) {
        zone.countdownActive = false;
        zone.extracting      = true;
        _hideCountdown();
        _spawnHelicopter(zone);
        _showFlash('CALLING EXTRACTION — HOLD POSITION', 0x00ff44);
      }
    }
  }

  // ── Default zone positions (world corners) ────────────────────────────────────
  function _defaultZonePositions() {
    return [
      { x: -60, z: -60 },
      { x:  60, z: -60 },
      { x:   0, z:  70 }
    ];
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || window._scene  || null;
    _camera = camera || window._camera || null;
    _missionStartTime = Date.now();
    _extractionTriggered = false;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _ensureCompassEl();

    // Spawn default zones if none exist
    if (_zones.length === 0) {
      var positions = _defaultZonePositions();
      for (var i = 0; i < positions.length; i++) {
        _createZone(positions[i].x, positions[i].z);
      }
    }
  }

  function update(delta) {
    if (!delta || delta <= 0 || delta > 1) delta = 0.016;
    if (!_scene) _scene = window._scene || null;
    if (!_camera) _camera = window._camera || null;

    for (var i = 0; i < _zones.length; i++) {
      _updateZone(_zones[i], delta);
    }

    _updateHelicopter(delta);
    _nudgeEnemiesAtZones(delta);
    _updateCompass();
  }

  function spawnZone(x, z) {
    return _createZone(x, z);
  }

  function getZones() {
    return _zones;
  }

  function triggerExtraction() {
    if (_extractionTriggered) return;
    // Find nearest zone to player
    var player = _getPlayerPos();
    var best = null, bestDist = Infinity;
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      var dx = player.x - z.x, dz = player.z - z.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) { bestDist = d; best = z; }
    }
    if (best && best.securityState !== 'COMPROMISED') {
      _extractionTriggered = true;
      best.extracting = true;
      best.countdownActive = false;
      _spawnHelicopter(best);
      _showFlash('EXTRACTION TRIGGERED', 0x00ff44);
    }
  }

  function reset() {
    // Remove zone meshes
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      if (_scene && z.meshData)  _scene.remove(z.meshData.group);
      if (_scene && z.smokeData) _scene.remove(z.smokeData.group);
    }
    _zones = [];

    _removeHelicopter();
    _stopHeartbeat();
    _hideCountdown();

    if (_compassEl && _compassEl.parentNode) {
      _compassEl.parentNode.removeChild(_compassEl);
      _compassEl = null;
    }
    if (_countdownEl && _countdownEl.parentNode) {
      _countdownEl.parentNode.removeChild(_countdownEl);
      _countdownEl = null;
    }
    if (_missionCompleteEl && _missionCompleteEl.parentNode) {
      _missionCompleteEl.parentNode.removeChild(_missionCompleteEl);
      _missionCompleteEl = null;
    }
    if (_boardingFadeEl && _boardingFadeEl.parentNode) {
      _boardingFadeEl.parentNode.removeChild(_boardingFadeEl);
      _boardingFadeEl = null;
    }

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    _keysDown   = {};
    _radioPlayed = {};
    _extractionTriggered = false;
    _missionStartTime    = 0;
    _scene  = null;
    _camera = null;
  }

  return {
    init:             init,
    update:           update,
    spawnZone:        spawnZone,
    getZones:         getZones,
    triggerExtraction: triggerExtraction,
    reset:            reset
  };

})();
