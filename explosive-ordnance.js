// explosive-ordnance.js — EOD / IED detection and defusal module
// FPS game module: IED placement, EOD scanner, defusal minigame, robot deployment,
// bomb suit, casualty system, and scoring.
// IIFE pattern, var throughout — no let/const.

window.ExplosiveOrdnance = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var IED_DETECT_RANGE      = 8;     // units — IED visible without scanner
  var SCANNER_RANGE         = 15;    // units — scanner detection radius
  var DEFUSE_RANGE          = 2.0;   // units — must be within this to defuse
  var ROBOT_SPEED           = 1.0;   // units/sec
  var ROBOT_DEFUSE_TIME     = 8.0;   // seconds robot takes to defuse
  var ROBOT_COST_TIME       = 30.0;  // seconds penalty for robot defusal
  var WIRE_SEQUENCE_SHOW    = 3.0;   // seconds sequence is shown
  var IED_EXPLOSION_RANGE   = 6.0;   // blast radius
  var IED_EXPLOSION_DAMAGE  = 80;    // HP
  var STUN_DURATION         = 3.0;   // seconds
  var SCORE_DEFUSE_MANUAL   = 400;
  var SCORE_DEFUSE_ROBOT    = 200;
  var SCORE_DETONATION      = -100;
  var SUIT_SPEED_MULT       = 0.6;   // 40% slower in bomb suit
  var SUIT_DAMAGE_MULT      = 0.3;   // 70% less explosion damage

  var WIRE_COLORS = [
    { label: 'RED',    hex: 0xff2200, css: '#ff2200' },
    { label: 'BLUE',   hex: 0x2255ff, css: '#2255ff' },
    { label: 'GREEN',  hex: 0x22dd22, css: '#22dd22' },
    { label: 'YELLOW', hex: 0xffdd00, css: '#ffdd00' },
    { label: 'WHITE',  hex: 0xeeeeee, css: '#eeeeee' },
  ];

  // ── Module state ───────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;

  // IED list: { mesh, wireMesh, pos:{x,y,z}, hidden, highlighted, defusing,
  //             defusePhase, wireCount, wireSequence, correctSeq, stepIdx,
  //             robot, robotMesh, robotTimer, detonated }
  var _ieds = [];

  // Active defusal state
  var _defusalIED         = null;  // IED object being defused
  var _defusalPhase       = 'idle'; // 'idle'|'hold'|'puzzle'|'dimmed'
  var _defusalHoldTimer   = 0;
  var _puzzleShowTimer    = 0;
  var _puzzleStep         = 0;
  var _puzzleCorrect      = [];  // correct order of wire indices
  var _puzzleClicked      = [];  // player clicks so far

  // Scanner state
  var _scannerActive      = false;
  var _scannerPulseTimer  = 0;
  var _scannerBeepTimer   = 0;
  var _scannerPulseMesh   = null;

  // Bomb suit state
  var _suitActive         = false;
  var _suitMesh           = null;

  // Stun state
  var _stunTimer          = 0;
  var _stunActive         = false;

  // Key state
  var _keys = {};

  // Robot list: {mesh, targetIED, timer, destroyed}
  var _robots = [];

  // HUD elements (built lazily)
  var _hudBuilt = false;

  // Level IED count (set on init/reset)
  var _iedCount = 0;

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { window._audioCtx = new Ctx(); return window._audioCtx; }
    } catch (e) {}
    return null;
  }

  function _playBeep(freq, dur, vol) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.08));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (dur || 0.09));
    } catch (e) {}
  }

  function _playExplosionSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufLen = ctx.sampleRate * 1.4;
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2.5);
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 1.8;
      src.start();
    } catch (e) {}
  }

  function _playDefuseSuccess() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var notes = [523, 659, 784, 1047];
      for (var n = 0; n < notes.length; n++) {
        (function (freq, delay) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.26);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.27);
        }(notes[n], n * 0.14));
      }
    } catch (e) {}
  }

  function _playScannerBeep(dist) {
    // Frequency increases as distance decreases
    var normDist = Math.max(0, Math.min(1, dist / SCANNER_RANGE));
    var freq     = 400 + (1 - normDist) * 1200;
    _playBeep(freq, 0.06, 0.1);
  }

  // ── IED mesh builders ──────────────────────────────────────────────────────
  function _buildIEDMesh() {
    var group = new THREE.Group();

    // Main body — dark gray cylinder (radius 0.3, height 0.2)
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Small trigger box on top
    var trigGeo = new THREE.BoxGeometry(0.08, 0.1, 0.06);
    var trigMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var trig    = new THREE.Mesh(trigGeo, trigMat);
    trig.position.set(0.1, 0.15, 0);
    group.add(trig);

    // Two wires hanging off the side (decorative)
    var wire1Geo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4);
    var wire1Mat = new THREE.MeshLambertMaterial({ color: 0xff2200 });
    var wire1    = new THREE.Mesh(wire1Geo, wire1Mat);
    wire1.rotation.z = 0.4;
    wire1.position.set(0.22, 0.02, 0.05);
    group.add(wire1);

    var wire2Geo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4);
    var wire2Mat = new THREE.MeshLambertMaterial({ color: 0x2255ff });
    var wire2    = new THREE.Mesh(wire2Geo, wire2Mat);
    wire2.rotation.z = -0.35;
    wire2.position.set(0.22, 0.02, -0.05);
    group.add(wire2);

    return group;
  }

  function _buildWireHighlight(iedMesh) {
    // Yellow wireframe sphere surrounding the IED
    var geo = new THREE.SphereGeometry(0.5, 8, 6);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(iedMesh.position);
    mesh.visible = false;
    return mesh;
  }

  // ── Robot mesh builder ─────────────────────────────────────────────────────
  function _buildRobotMesh() {
    var group = new THREE.Group();

    // Body — flat box (1 × 0.5 × 1.5)
    var bodyGeo = new THREE.BoxGeometry(1.0, 0.5, 1.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 4 wheels — cylinders on each corner
    var wheelPositions = [
      { x:  0.6, y: -0.2, z:  0.55 },
      { x: -0.6, y: -0.2, z:  0.55 },
      { x:  0.6, y: -0.2, z: -0.55 },
      { x: -0.6, y: -0.2, z: -0.55 },
    ];
    for (var w = 0; w < wheelPositions.length; w++) {
      var wp     = wheelPositions[w];
      var wGeo   = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10);
      var wMat   = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var wheel  = new THREE.Mesh(wGeo, wMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, wp.y, wp.z);
      group.add(wheel);
    }

    // Small camera arm on front
    var armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.3);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var arm    = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, 0.28, 0.75);
    group.add(arm);

    var camGeo = new THREE.BoxGeometry(0.14, 0.1, 0.1);
    var camMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var cam    = new THREE.Mesh(camGeo, camMat);
    cam.position.set(0, 0.28, 0.92);
    group.add(cam);

    return group;
  }

  // ── Bomb suit overlay mesh ─────────────────────────────────────────────────
  function _buildSuitMesh() {
    // Semi-transparent white enlarged capsule around player
    var geo = new THREE.SphereGeometry(1.1, 10, 8);
    var mat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1.0, 1.5, 1.0);
    return mesh;
  }

  // ── Scanner pulse VFX ──────────────────────────────────────────────────────
  function _spawnScannerPulse(origin) {
    if (!_scene) return;
    if (_scannerPulseMesh && _scene) {
      _scene.remove(_scannerPulseMesh);
      _scannerPulseMesh = null;
    }
    var geo  = new THREE.SphereGeometry(1, 12, 8);
    var mat  = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    _scene.add(mesh);
    _scannerPulseMesh = mesh;
    _scannerPulseTimer = 0;
  }

  function _updateScannerPulse(delta) {
    if (!_scannerPulseMesh) return;
    _scannerPulseTimer += delta;
    var t    = _scannerPulseTimer;
    var s    = 1 + t * 8;      // grow outward
    var op   = Math.max(0, 0.5 - t * 0.8);
    _scannerPulseMesh.scale.set(s, s, s);
    _scannerPulseMesh.material.opacity = op;
    if (op <= 0 && _scene) {
      _scene.remove(_scannerPulseMesh);
      _scannerPulseMesh = null;
    }
  }

  // ── Explosion VFX ─────────────────────────────────────────────────────────
  function _spawnExplosion(pos) {
    if (!_scene) return;
    // Flash point light
    var light = new THREE.PointLight(0xff6600, 10, 10);
    light.position.copy(pos);
    light.position.y += 0.5;
    _scene.add(light);
    setTimeout(function () { if (_scene) _scene.remove(light); }, 400);

    // Fire particles
    for (var i = 0; i < 22; i++) {
      (function () {
        var pGeo  = new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 5, 5);
        var pMat  = new THREE.MeshLambertMaterial({
          color: Math.random() > 0.5 ? 0xff6600 : 0xff2200,
          transparent: true,
          opacity: 0.8,
        });
        var pmesh = new THREE.Mesh(pGeo, pMat);
        var angle = Math.random() * Math.PI * 2;
        var dist  = Math.random() * 2.5;
        pmesh.position.set(
          pos.x + Math.cos(angle) * dist,
          pos.y + 0.3 + Math.random() * 1.2,
          pos.z + Math.sin(angle) * dist
        );
        _scene.add(pmesh);
        var life    = 0.8 + Math.random() * 0.6;
        var elapsed = 0;
        var vy      = 1.5 + Math.random() * 2;
        function tick(dt) {
          elapsed += dt;
          pmesh.position.y += vy * dt;
          vy *= (1 - dt * 2);
          pMat.opacity = Math.max(0, 0.8 * (1 - elapsed / life));
          if (elapsed >= life) {
            if (_scene) _scene.remove(pmesh);
            pGeo.dispose();
            pMat.dispose();
            return;
          }
          requestAnimationFrame(function () { tick(0.016); });
        }
        requestAnimationFrame(function () { tick(0.016); });
      }());
    }
  }

  // ── IED detonation ─────────────────────────────────────────────────────────
  function _detonateIED(ied) {
    if (ied.detonated) return;
    ied.detonated = true;

    var pos = new THREE.Vector3(ied.pos.x, ied.pos.y, ied.pos.z);

    // Remove IED meshes from scene
    if (ied.mesh && _scene)         { _scene.remove(ied.mesh); }
    if (ied.wireMesh && _scene)     { _scene.remove(ied.wireMesh); }

    // Cancel any robot assigned to this IED
    for (var r = 0; r < _robots.length; r++) {
      if (_robots[r].targetIED === ied) {
        _robots[r].destroyed = true;
        if (_robots[r].mesh && _scene) { _scene.remove(_robots[r].mesh); }
      }
    }

    _playExplosionSound();
    _spawnExplosion(pos);

    // Camera shake
    window._cameraShake = { intensity: 2.5, duration: 2.0 };

    // Damage + stun player
    var playerPos = _getPlayerPos();
    if (playerPos) {
      var dx   = playerPos.x - pos.x;
      var dz   = playerPos.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < IED_EXPLOSION_RANGE) {
        var falloff = 1 - dist / IED_EXPLOSION_RANGE;
        var dmg     = Math.round(IED_EXPLOSION_DAMAGE * falloff);
        if (_suitActive) { dmg = Math.round(dmg * SUIT_DAMAGE_MULT); }
        if (dmg > 0 && window._takeDamageFromWaveEvent) {
          window._takeDamageFromWaveEvent(dmg);
        }
        // Stun
        _stunActive = true;
        _stunTimer  = STUN_DURATION;
      }
    }

    // Score penalty
    _addScore(SCORE_DETONATION);

    // Cancel active defusal if it was this IED
    if (_defusalIED === ied) {
      _defusalIED   = null;
      _defusalPhase = 'idle';
      _hidePuzzleOverlay();
      _hideDefuseProgress();
    }

    _updateHUD();

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('IED DETONATED! ' + SCORE_DETONATION, 4000, '#ff2200');
    }
  }

  // ── Wire puzzle generation ─────────────────────────────────────────────────
  function _generatePuzzle(wireCount) {
    // wireCount = 3..5
    var count = Math.min(5, Math.max(3, wireCount));
    // Pick `count` wires from WIRE_COLORS (shuffled subset)
    var indices = [];
    for (var i = 0; i < WIRE_COLORS.length; i++) { indices.push(i); }
    // Fisher-Yates shuffle
    for (var j = indices.length - 1; j > 0; j--) {
      var k  = Math.floor(Math.random() * (j + 1));
      var tmp = indices[j];
      indices[j] = indices[k];
      indices[k] = tmp;
    }
    var chosen = indices.slice(0, count);

    // Random cut sequence (all chosen wires, in random order)
    var seq = chosen.slice();
    for (var s = seq.length - 1; s > 0; s--) {
      var m   = Math.floor(Math.random() * (s + 1));
      var tmp2 = seq[s];
      seq[s] = seq[m];
      seq[m] = tmp2;
    }
    return { wireIndices: chosen, sequence: seq };
  }

  // ── Player position helper ─────────────────────────────────────────────────
  function _getPlayerPos() {
    if (window.player && window.player.position) { return window.player.position; }
    if (_camera) { return _camera.position; }
    return null;
  }

  // ── Score helper ───────────────────────────────────────────────────────────
  function _addScore(amount) {
    if (window.player && typeof window.player.score === 'number') {
      window.player.score += amount;
      if (window.HUD && window.HUD.setScore) {
        window.HUD.setScore(window.player.score);
      }
    }
  }

  // ── HUD building ───────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudBuilt) return;
    _hudBuilt = true;

    // Scanner / IED status bar
    var scanEl = document.createElement('div');
    scanEl.id = 'eo-scanner-hud';
    scanEl.style.cssText = [
      'position:fixed',
      'top:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'color:#ffdd00',
      'text-shadow:0 0 8px #ffaa00,0 0 3px #000',
      'z-index:3100',
      'pointer-events:none',
      'user-select:none',
      'display:none',
      'background:rgba(0,0,0,0.6)',
      'padding:5px 14px',
      'border-radius:5px',
      'border:1px solid #ffaa00',
    ].join(';');
    document.body.appendChild(scanEl);

    // Defuse progress bar
    var barWrap = document.createElement('div');
    barWrap.id = 'eo-defuse-wrap';
    barWrap.style.cssText = [
      'position:fixed',
      'bottom:100px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:240px',
      'background:rgba(0,0,0,0.7)',
      'border:2px solid #00ffcc',
      'border-radius:6px',
      'padding:6px 10px',
      'z-index:3100',
      'pointer-events:none',
      'user-select:none',
      'display:none',
      'text-align:center',
    ].join(';');
    barWrap.innerHTML = [
      '<div style="color:#00ffcc;font-family:monospace;font-size:12px;margin-bottom:4px">HOLD [E] TO DEFUSE</div>',
      '<div style="background:#222;border-radius:4px;height:14px;overflow:hidden">',
      '<div id="eo-defuse-fill" style="background:#00ffcc;height:100%;width:0%;transition:width 0.1s linear;border-radius:4px"></div>',
      '</div>',
    ].join('');
    document.body.appendChild(barWrap);

    // Robot status label
    var robotEl = document.createElement('div');
    robotEl.id = 'eo-robot-hud';
    robotEl.style.cssText = [
      'position:fixed',
      'bottom:140px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'color:#aaffaa',
      'text-shadow:0 0 6px #00ff44',
      'z-index:3100',
      'pointer-events:none',
      'user-select:none',
      'display:none',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 12px',
      'border-radius:4px',
    ].join(';');
    document.body.appendChild(robotEl);

    // Wire puzzle overlay
    var puzzleEl = document.createElement('div');
    puzzleEl.id = 'eo-puzzle-overlay';
    puzzleEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.93)',
      'border:3px solid #ff2200',
      'border-radius:12px',
      'padding:28px 44px',
      'z-index:4000',
      'text-align:center',
      'min-width:380px',
      'display:none',
    ].join(';');
    document.body.appendChild(puzzleEl);

    // Stun overlay
    var stunEl = document.createElement('div');
    stunEl.id = 'eo-stun-overlay';
    stunEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(255,60,0,0.28)',
      'z-index:5000',
      'pointer-events:none',
      'display:none',
    ].join(';');
    document.body.appendChild(stunEl);
  }

  function _updateHUD() {
    var scanEl = document.getElementById('eo-scanner-hud');
    if (!scanEl) return;

    var activeCount = 0;
    for (var i = 0; i < _ieds.length; i++) {
      if (!_ieds[i].detonated) { activeCount++; }
    }

    if (_scannerActive && activeCount > 0) {
      scanEl.textContent = '💣 IED DETECTED [' + activeCount + '] — SCANNER ACTIVE';
      scanEl.style.display = 'block';
    } else if (activeCount > 0) {
      scanEl.textContent = '💣 IED THREAT AREA [' + activeCount + '] — PRESS X TO SCAN';
      scanEl.style.display = 'block';
    } else {
      scanEl.style.display = 'none';
    }

    // Robot status
    var robotEl = document.getElementById('eo-robot-hud');
    if (robotEl) {
      var activeRobots = 0;
      for (var r = 0; r < _robots.length; r++) {
        if (!_robots[r].destroyed && !_robots[r].done) { activeRobots++; }
      }
      if (activeRobots > 0) {
        robotEl.textContent = '🤖 EOD ROBOT x' + activeRobots + ' DEPLOYED';
        robotEl.style.display = 'block';
      } else {
        robotEl.style.display = 'none';
      }
    }
  }

  function _showDefuseProgress(pct) {
    var wrap = document.getElementById('eo-defuse-wrap');
    var fill = document.getElementById('eo-defuse-fill');
    if (wrap) { wrap.style.display = 'block'; }
    if (fill) { fill.style.width = Math.min(100, Math.max(0, pct * 100)) + '%'; }
  }

  function _hideDefuseProgress() {
    var wrap = document.getElementById('eo-defuse-wrap');
    var fill = document.getElementById('eo-defuse-fill');
    if (wrap) { wrap.style.display = 'none'; }
    if (fill) { fill.style.width = '0%'; }
  }

  function _showPuzzleOverlay(ied, dimmed) {
    var el = document.getElementById('eo-puzzle-overlay');
    if (!el) return;

    var puzzle = ied.puzzle;
    var seqLabels = [];
    for (var s = 0; s < puzzle.sequence.length; s++) {
      seqLabels.push('[' + WIRE_COLORS[puzzle.sequence[s]].label + ']');
    }
    var seqStr = seqLabels.join(' → ');

    var html = '<div style="color:#ff2200;font-family:monospace;font-size:18px;font-weight:bold;margin-bottom:12px">💣 WIRE PANEL</div>';

    if (dimmed) {
      html += '<div style="color:#555;font-family:monospace;font-size:13px;margin-bottom:18px">PANEL DIMMED — RECALL THE SEQUENCE</div>';
      html += '<div style="display:flex;justify-content:center;gap:18px;margin-bottom:18px">';
      for (var i = 0; i < puzzle.wireIndices.length; i++) {
        var wireIdx = puzzle.wireIndices[i];
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:5px">';
        html += '<div style="width:12px;height:46px;background:#333;border-radius:6px"></div>';
        html += '<div style="color:#555;font-family:monospace;font-size:12px">' + (i + 1) + '</div>';
        html += '</div>';
      }
      html += '</div>';
    } else {
      html += '<div style="color:#ffdd00;font-family:monospace;font-size:12px;margin-bottom:6px">CUT IN ORDER:</div>';
      html += '<div style="color:#fff;font-family:monospace;font-size:14px;font-weight:bold;margin-bottom:16px">' + seqStr + '</div>';
      html += '<div style="display:flex;justify-content:center;gap:18px;margin-bottom:18px">';
      for (var j = 0; j < puzzle.wireIndices.length; j++) {
        var wIdx = puzzle.wireIndices[j];
        var wCol = WIRE_COLORS[wIdx];
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:5px">';
        html += '<div style="width:12px;height:46px;background:' + wCol.css + ';border-radius:6px;box-shadow:0 0 7px ' + wCol.css + '"></div>';
        html += '<div style="color:' + wCol.css + ';font-family:monospace;font-size:12px;font-weight:bold">' + wCol.label + '</div>';
        html += '<div style="color:#aaa;font-family:monospace;font-size:11px">[' + (j + 1) + ']</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Show click progress
    html += '<div style="color:#888;font-family:monospace;font-size:11px;margin-bottom:8px">Step ' + (_puzzleStep + 1) + ' / ' + puzzle.sequence.length + '</div>';
    html += '<div style="color:#888;font-family:monospace;font-size:11px">Click a wire or press 1-' + puzzle.wireIndices.length + ' to cut</div>';

    el.style.display = 'block';
    el.innerHTML = html;

    // Attach click handlers to wire divs (they become buttons)
    // We use event delegation from the overlay itself
    el.onclick = function (evt) {
      // handled by keydown listener instead; overlay click is fallback
    };
  }

  function _hidePuzzleOverlay() {
    var el = document.getElementById('eo-puzzle-overlay');
    if (el) { el.style.display = 'none'; el.onclick = null; }
  }

  function _showStunOverlay(visible) {
    var el = document.getElementById('eo-stun-overlay');
    if (el) { el.style.display = visible ? 'block' : 'none'; }
  }

  // ── IED spawning ───────────────────────────────────────────────────────────
  function _spawnIEDs(levelWidth, levelDepth, count) {
    for (var i = 0; i < count; i++) {
      var x = (Math.random() - 0.5) * (levelWidth  || 40);
      var z = (Math.random() - 0.5) * (levelDepth  || 40);
      var y = 0.1;

      var mesh    = _buildIEDMesh();
      mesh.position.set(x, y, z);
      mesh.visible = false;  // hidden until player is close or scanner active

      var wireMesh = _buildWireHighlight(mesh);

      if (_scene) {
        _scene.add(mesh);
        _scene.add(wireMesh);
      }

      var wireCount  = 3 + Math.floor(Math.random() * 3); // 3-5
      var puzzle     = _generatePuzzle(wireCount);

      _ieds.push({
        mesh:       mesh,
        wireMesh:   wireMesh,
        pos:        { x: x, y: y, z: z },
        hidden:     true,
        highlighted: false,
        defusing:   false,
        detonated:  false,
        defused:    false,
        puzzle:     puzzle,
        robot:      null,
      });
    }
  }

  // ── Defusal logic ──────────────────────────────────────────────────────────
  function _startDefusal(ied) {
    _defusalIED   = ied;
    _defusalPhase = 'hold';
    _defusalHoldTimer = 0;
    _showDefuseProgress(0);
  }

  function _enterPuzzlePhase() {
    _defusalPhase    = 'puzzle';
    _puzzleShowTimer = WIRE_SEQUENCE_SHOW;
    _puzzleStep      = 0;
    _puzzleClicked   = [];
    _showPuzzleOverlay(_defusalIED, false);
  }

  function _handleWireCut(wireNumberPressed) {
    // wireNumberPressed is 1-based index into puzzle.wireIndices array
    if (_defusalPhase !== 'puzzle' && _defusalPhase !== 'dimmed') return;
    if (!_defusalIED) return;

    var idx     = wireNumberPressed - 1;
    var puzzle  = _defusalIED.puzzle;
    if (idx < 0 || idx >= puzzle.wireIndices.length) return;

    var colorIdx = puzzle.wireIndices[idx];
    var expected = puzzle.sequence[_puzzleStep];

    if (colorIdx === expected) {
      _puzzleStep++;
      if (_puzzleStep >= puzzle.sequence.length) {
        // SUCCESS — all wires cut correctly
        _defuseSuccess(_defusalIED, false);
      } else {
        // Correct step — update overlay
        _showPuzzleOverlay(_defusalIED, _defusalPhase === 'dimmed');
      }
    } else {
      // WRONG WIRE — detonate immediately
      var wrongIED = _defusalIED;
      _defusalIED   = null;
      _defusalPhase = 'idle';
      _hidePuzzleOverlay();
      _hideDefuseProgress();
      // 100 HP damage
      if (window._takeDamageFromWaveEvent) {
        window._takeDamageFromWaveEvent(100);
      }
      _detonateIED(wrongIED);
    }
  }

  function _defuseSuccess(ied, byRobot) {
    if (!ied || ied.defused || ied.detonated) return;
    ied.defused = true;

    if (ied.mesh && _scene)    { _scene.remove(ied.mesh); }
    if (ied.wireMesh && _scene){ _scene.remove(ied.wireMesh); }

    _defusalIED   = null;
    _defusalPhase = 'idle';
    _hidePuzzleOverlay();
    _hideDefuseProgress();

    _playDefuseSuccess();

    var score = byRobot ? SCORE_DEFUSE_ROBOT : SCORE_DEFUSE_MANUAL;
    _addScore(score);

    var msg = byRobot
      ? 'IED DEFUSED (ROBOT)  +' + score
      : 'IED DEFUSED!  +' + score;

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg, 5000, '#00ff44');
    }

    _updateHUD();
  }

  // ── Robot deployment ───────────────────────────────────────────────────────
  function _deployRobot(ied) {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    var mesh = _buildRobotMesh();
    mesh.position.set(playerPos.x, 0.25, playerPos.z);
    if (_scene) { _scene.add(mesh); }

    var robot = {
      mesh:      mesh,
      targetIED: ied,
      timer:     0,
      defusing:  false,
      defuseTimer: 0,
      destroyed: false,
      done:      false,
    };
    _robots.push(robot);
    ied.robot = robot;

    _updateHUD();

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('EOD ROBOT DEPLOYED — DEFUSING IN ' + ROBOT_DEFUSE_TIME + 's', 3000, '#aaffaa');
    }
  }

  // ── Keyboard handling ──────────────────────────────────────────────────────
  function _onKeyDown(evt) {
    _keys[evt.key] = true;
    _keys[evt.code] = true;

    var key = evt.key;

    // X — toggle scanner (held = active)
    // Shift+X — toggle bomb suit
    if ((key === 'X' || key === 'x') && evt.shiftKey) {
      _toggleSuit();
      return;
    }

    if (key === 'X' || key === 'x') {
      _scannerActive = true;
      _updateHUD();
      var playerPos = _getPlayerPos();
      if (playerPos) { _spawnScannerPulse(playerPos); }
      return;
    }

    // E — start/hold defuse (handled in update loop, but begin flag here)
    // R — deploy robot
    if ((key === 'R' || key === 'r') && !evt.shiftKey) {
      _tryDeployRobot();
      return;
    }

    // Wire number keys during puzzle
    if (_defusalPhase === 'puzzle' || _defusalPhase === 'dimmed') {
      var num = parseInt(key, 10);
      if (num >= 1 && num <= 5) {
        _handleWireCut(num);
      }
    }
  }

  function _onKeyUp(evt) {
    _keys[evt.key] = false;
    _keys[evt.code] = false;

    var key = evt.key;

    if (key === 'X' || key === 'x') {
      _scannerActive = false;
      _updateHUD();
    }

    if (key === 'E' || key === 'e') {
      // Cancel defusal hold if released
      if (_defusalPhase === 'hold') {
        _defusalPhase = 'idle';
        _defusalIED   = null;
        _defusalHoldTimer = 0;
        _hideDefuseProgress();
      }
    }
  }

  function _isKeyDown(k) {
    return !!(_keys[k] || _keys[k.toLowerCase()]);
  }

  // ── Try deploy robot near closest IED ─────────────────────────────────────
  function _tryDeployRobot() {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;
    var closest = null;
    var closestDist = Infinity;
    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (ied.defused || ied.detonated || ied.robot) { continue; }
      var dx   = playerPos.x - ied.pos.x;
      var dz   = playerPos.z - ied.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 12 && dist < closestDist) {
        closestDist = dist;
        closest = ied;
      }
    }
    if (closest) {
      _deployRobot(closest);
    } else {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('NO IED IN RANGE FOR ROBOT DEPLOYMENT', 2000, '#ffaa00');
      }
    }
  }

  // ── Bomb suit toggle ───────────────────────────────────────────────────────
  function _toggleSuit() {
    _suitActive = !_suitActive;

    if (_suitActive) {
      // Attach suit mesh to camera/player
      _suitMesh = _buildSuitMesh();
      var playerPos = _getPlayerPos();
      if (playerPos && _scene) {
        _suitMesh.position.copy(playerPos);
        _scene.add(_suitMesh);
      }
      // Apply speed reduction
      if (window.player && typeof window.player.speed === 'number') {
        window.player._preSuitSpeed = window.player.speed;
        window.player.speed = window.player.speed * SUIT_SPEED_MULT;
      }
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('EOD SUIT ON — Speed -40%, Blast -70%', 3000, '#ffffff');
      }
    } else {
      if (_suitMesh && _scene) {
        _scene.remove(_suitMesh);
        _suitMesh = null;
      }
      // Restore speed
      if (window.player && typeof window.player._preSuitSpeed === 'number') {
        window.player.speed = window.player._preSuitSpeed;
        window.player._preSuitSpeed = undefined;
      }
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('EOD SUIT OFF', 2000, '#aaaaaa');
      }
    }
    _updateHUD();
  }

  // ── Main update ────────────────────────────────────────────────────────────
  function update(delta) {
    var playerPos = _getPlayerPos();

    // ── Stun ──────────────────────────────────────────────────────────────────
    if (_stunActive) {
      _stunTimer -= delta;
      if (_stunTimer <= 0) {
        _stunActive = false;
        _showStunOverlay(false);
        // Restore movement
        if (window.player) { window.player._stunned = false; }
      } else {
        _showStunOverlay(true);
        // Lock movement
        if (window.player) { window.player._stunned = true; }
        // Camera shake pulse
        window._cameraShake = { intensity: 0.4 * (_stunTimer / STUN_DURATION), duration: 0.1 };
      }
    }

    // ── Scanner pulse animation ────────────────────────────────────────────────
    _updateScannerPulse(delta);

    // ── Scanner beep (proximity beep to nearest IED) ───────────────────────────
    if (_scannerActive && playerPos) {
      _scannerBeepTimer -= delta;
      var nearestDist = Infinity;
      for (var i = 0; i < _ieds.length; i++) {
        var ied = _ieds[i];
        if (ied.defused || ied.detonated) { continue; }
        var dx   = playerPos.x - ied.pos.x;
        var dz   = playerPos.z - ied.pos.z;
        var d    = Math.sqrt(dx * dx + dz * dz);
        if (d < nearestDist) { nearestDist = d; }
      }
      if (nearestDist < SCANNER_RANGE) {
        var beepInterval = 0.1 + 0.6 * (nearestDist / SCANNER_RANGE);
        if (_scannerBeepTimer <= 0) {
          _playScannerBeep(nearestDist);
          _scannerBeepTimer = beepInterval;
        }
      }

      // Spawn new pulse every 0.8s while scanner held
      if (!_scannerPulseMesh && playerPos) {
        _spawnScannerPulse(playerPos);
      }
    }

    // ── IED visibility + highlighting ─────────────────────────────────────────
    for (var vi = 0; vi < _ieds.length; vi++) {
      var vied = _ieds[vi];
      if (vied.defused || vied.detonated) { continue; }

      var dist2player = Infinity;
      if (playerPos) {
        var dvx = playerPos.x - vied.pos.x;
        var dvz = playerPos.z - vied.pos.z;
        dist2player = Math.sqrt(dvx * dvx + dvz * dvz);
      }

      // Visibility
      var shouldShow = dist2player <= IED_DETECT_RANGE || _scannerActive;
      vied.mesh.visible    = shouldShow;

      // Highlight
      var shouldHighlight = _scannerActive && dist2player <= SCANNER_RANGE;
      vied.wireMesh.visible = shouldHighlight;

      // Keep wireMesh position in sync with IED
      vied.wireMesh.position.copy(vied.mesh.position);
      if (shouldHighlight) {
        // Rotate highlight mesh slowly
        vied.wireMesh.rotation.y += delta * 1.2;
      }
    }

    // ── Bomb suit overlay position ─────────────────────────────────────────────
    if (_suitActive && _suitMesh && playerPos) {
      _suitMesh.position.copy(playerPos);
    }

    // ── Defusal hold phase ────────────────────────────────────────────────────
    if (_defusalPhase === 'idle' && _isKeyDown('E') && playerPos) {
      // Find nearest IED in defuse range
      var nearestIED  = null;
      var nearestDist2 = Infinity;
      for (var ni = 0; ni < _ieds.length; ni++) {
        var nied = _ieds[ni];
        if (nied.defused || nied.detonated || nied.robot) { continue; }
        var ndx  = playerPos.x - nied.pos.x;
        var ndz  = playerPos.z - nied.pos.z;
        var nd   = Math.sqrt(ndx * ndx + ndz * ndz);
        if (nd <= DEFUSE_RANGE && nd < nearestDist2) {
          nearestDist2 = nd;
          nearestIED   = nied;
        }
      }
      if (nearestIED) {
        _startDefusal(nearestIED);
      }
    }

    if (_defusalPhase === 'hold') {
      if (!_isKeyDown('E') || !playerPos) {
        // Cancelled
        _defusalPhase     = 'idle';
        _defusalIED       = null;
        _defusalHoldTimer = 0;
        _hideDefuseProgress();
      } else if (_defusalIED && !_defusalIED.defused && !_defusalIED.detonated) {
        // Verify still in range
        var hx  = playerPos.x - _defusalIED.pos.x;
        var hz  = playerPos.z - _defusalIED.pos.z;
        var hd  = Math.sqrt(hx * hx + hz * hz);
        if (hd > DEFUSE_RANGE) {
          _defusalPhase     = 'idle';
          _defusalIED       = null;
          _defusalHoldTimer = 0;
          _hideDefuseProgress();
        } else {
          _defusalHoldTimer += delta;
          _showDefuseProgress(_defusalHoldTimer / 2.0); // 2s hold to open panel
          if (_defusalHoldTimer >= 2.0) {
            _enterPuzzlePhase();
          }
        }
      }
    }

    // ── Puzzle timer (sequence shown for 3s, then dims) ───────────────────────
    if (_defusalPhase === 'puzzle') {
      _puzzleShowTimer -= delta;
      if (_puzzleShowTimer <= 0) {
        _defusalPhase = 'dimmed';
        if (_defusalIED) { _showPuzzleOverlay(_defusalIED, true); }
      }
    }

    // ── Robot update ──────────────────────────────────────────────────────────
    for (var ri = 0; ri < _robots.length; ri++) {
      var robot = _robots[ri];
      if (robot.destroyed || robot.done) { continue; }

      var targetIED = robot.targetIED;
      if (!targetIED || targetIED.defused || targetIED.detonated) {
        // Target gone — idle robot
        robot.done = true;
        if (robot.mesh && _scene) { _scene.remove(robot.mesh); }
        continue;
      }

      // Drive toward IED
      var rx  = robot.mesh.position.x;
      var rz  = robot.mesh.position.z;
      var tx  = targetIED.pos.x;
      var tz  = targetIED.pos.z;
      var rdx = tx - rx;
      var rdz = tz - rz;
      var rd  = Math.sqrt(rdx * rdx + rdz * rdz);

      if (rd > 0.6) {
        var step = Math.min(rd, ROBOT_SPEED * delta);
        robot.mesh.position.x += (rdx / rd) * step;
        robot.mesh.position.z += (rdz / rd) * step;
        // Wheel rotation animation (rotate body slightly)
        robot.mesh.rotation.y = Math.atan2(rdx, rdz);
      } else {
        // Close enough — defuse timer
        robot.defusing   = true;
        robot.defuseTimer += delta;
        if (robot.defuseTimer >= ROBOT_DEFUSE_TIME) {
          robot.done = true;
          if (robot.mesh && _scene) { _scene.remove(robot.mesh); }
          _defuseSuccess(targetIED, true);
        }
      }
    }

    // ── Periodic HUD refresh ───────────────────────────────────────────────────
    _updateHUD();
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera, options) {
    _scene  = scene;
    _camera = camera;

    _ensureHUD();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);

    // Spawn IEDs for the level
    var opts      = options || {};
    var count     = opts.iedCount || (1 + Math.floor(Math.random() * 3)); // 1-3
    var width     = opts.levelWidth  || 50;
    var depth     = opts.levelDepth  || 50;
    _iedCount     = count;

    _spawnIEDs(width, depth, count);
    _updateHUD();
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    // Remove all IED meshes
    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (ied.mesh && _scene)     { _scene.remove(ied.mesh); }
      if (ied.wireMesh && _scene) { _scene.remove(ied.wireMesh); }
    }
    _ieds = [];

    // Remove robots
    for (var r = 0; r < _robots.length; r++) {
      if (_robots[r].mesh && _scene) { _scene.remove(_robots[r].mesh); }
    }
    _robots = [];

    // Scanner pulse
    if (_scannerPulseMesh && _scene) {
      _scene.remove(_scannerPulseMesh);
      _scannerPulseMesh = null;
    }

    // Suit
    if (_suitMesh && _scene) {
      _scene.remove(_suitMesh);
      _suitMesh = null;
    }
    if (_suitActive && window.player && typeof window.player._preSuitSpeed === 'number') {
      window.player.speed = window.player._preSuitSpeed;
      window.player._preSuitSpeed = undefined;
    }
    _suitActive = false;

    // State reset
    _defusalIED       = null;
    _defusalPhase     = 'idle';
    _defusalHoldTimer = 0;
    _puzzleShowTimer  = 0;
    _puzzleStep       = 0;
    _puzzleClicked    = [];
    _scannerActive    = false;
    _scannerBeepTimer = 0;
    _stunActive       = false;
    _stunTimer        = 0;
    _keys             = {};

    // HUD
    _hidePuzzleOverlay();
    _hideDefuseProgress();
    _showStunOverlay(false);
    _updateHUD();

    // Unregister player stun
    if (window.player) { window.player._stunned = false; }
  }

  // ── Module export ──────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset,
  };

}());
