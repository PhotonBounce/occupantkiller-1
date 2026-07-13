// ied-disposal.js — EOD robot IED disposal game module
// Press I+D to deploy EOD robot; WASD drives it; J activates RF jammer.
// 3 IEDs with countdowns; wire-cutting mini-game to defuse.
// IIFE pattern, var throughout — no let/const, no imports.
window.IEDDisposal = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var ROBOT_BODY_COLOR    = 0x445544;
  var IED_COLOR           = 0x3A3A00;
  var IED_DEFUSED_COLOR   = 0x888888;
  var EXPLOSION_COLOR     = 0xFF6600;
  var DEFUSE_RANGE        = 1.5;
  var EXPLOSION_RADIUS    = 8;
  var TRIPWIRE_TRIGGER    = 0.5;
  var ROBOT_DAMAGE_RADIUS = 5;
  var ROBOT_MAX_HP        = 100;
  var JAMMER_RANGE        = 15;
  var JAMMER_DURATION     = 20;
  var JAMMER_COOLDOWN     = 45;
  var SCORE_PER_IED       = 300;
  var SCORE_BONUS         = 200;
  var PLAYER_DAMAGE       = 80;
  var ROBOT_HP_DAMAGE     = 50;
  var ROBOT_RESPAWN_DELAY = 30;
  var MINIGAME_TIME_LIMIT = 10;
  var IED_COUNT           = 3;
  var WIRE_COLORS = [
    { label: 'RED',    css: '#ff3333', hex: 0xff3333 },
    { label: 'BLUE',   css: '#3355ff', hex: 0x3355ff },
    { label: 'GREEN',  css: '#33cc55', hex: 0x33cc55 },
    { label: 'YELLOW', css: '#ffdd00', hex: 0xffdd00 }
  ];

  // ── State ────────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;

  // Robot state
  var _robotDeployed    = false;
  var _robotGroup       = null;
  var _robotHP          = ROBOT_MAX_HP;
  var _robotDestroyed   = false;
  var _robotRespawnTimer = 0;
  var _originalCamPos   = null;

  // Input state
  var _keys = {};

  // IED list
  var _ieds = [];

  // Jammer state
  var _jammerActive     = false;
  var _jammerTimer      = 0;
  var _jammerCooldown   = 0;

  // Mini-game overlay state
  var _minigameActive   = false;
  var _minigameIED      = null;
  var _minigameSafeIdx  = 0;
  var _minigameTimer    = 0;

  // Score tracking
  var _defusedCount = 0;
  var _missionStartTime = 0;
  var _missionStarted   = false;

  // Camera shake state
  var _shakeIntensity = 0;
  var _shakeDuration  = 0;
  var _shakeTimer     = 0;

  // I+D deploy key combo
  var _iKeyDown = false;
  var _dKeyDown = false;

  // ── Audio helpers ────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { window._audioCtx = new Ctx(); return window._audioCtx; }
    } catch (e) {}
    return null;
  }

  function _playBeep(freq, dur) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.08));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (dur || 0.09));
    } catch (e) {}
  }

  function _playExplosionSFX() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufLen = Math.floor(ctx.sampleRate * 1.4);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.6);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 1.8;
      src.start();
    } catch (e) {}
  }

  function _playDefuseSFX() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var notes = [523, 659, 784, 1047];
      for (var n = 0; n < notes.length; n++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0, ctx.currentTime + delay);
          g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.24);
        }(notes[n], n * 0.13));
      }
    } catch (e) {}
  }

  // ── Robot mesh builder ───────────────────────────────────────────────────────
  function _buildRobotMesh() {
    var group = new THREE.Group();

    // Body: BoxGeometry(1.2, 0.8, 0.8)
    var bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: ROBOT_BODY_COLOR });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.4, 0);
    group.add(bodyMesh);

    // Left track wheel: CylinderGeometry(r=0.4, r=0.4, h=0.3)
    var trackGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var leftTrack = new THREE.Mesh(trackGeo, trackMat);
    leftTrack.rotation.z = Math.PI / 2;
    leftTrack.position.set(0, 0.4, 0.55);
    group.add(leftTrack);

    var rightTrack = new THREE.Mesh(trackGeo, trackMat);
    rightTrack.rotation.z = Math.PI / 2;
    rightTrack.position.set(0, 0.4, -0.55);
    group.add(rightTrack);

    // Arm: CylinderGeometry(r=0.06, r=0.06, h=1.2) extending forward
    var armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    var armMesh = new THREE.Mesh(armGeo, armMat);
    // Rotate to point forward along X axis, then offset forward by 0.6 + 0.6 of body
    armMesh.rotation.z = Math.PI / 2;
    armMesh.position.set(1.2, 0.75, 0);
    group.add(armMesh);

    // Camera head: SphereGeometry(r=0.2) at arm tip
    var headGeo = new THREE.SphereGeometry(0.2, 10, 10);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x99aacc });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(1.8, 0.75, 0);
    group.add(headMesh);

    return group;
  }

  // ── IED mesh builder ─────────────────────────────────────────────────────────
  function _buildIEDMesh(px, pz, hasTripwire) {
    var group = new THREE.Group();

    // IED body: BoxGeometry(0.8, 0.3, 0.5)
    var bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: IED_COLOR });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.15, 0);
    group.add(bodyMesh);

    // Visible zigzag wire (LineSegments) from IED to trigger point 3 units away
    var triggerAngle = Math.random() * Math.PI * 2;
    var tx = Math.cos(triggerAngle) * 3;
    var tz = Math.sin(triggerAngle) * 3;
    var wirePoints = [];
    var segs = 8;
    for (var s = 0; s <= segs; s++) {
      var t = s / segs;
      var wx = tx * t;
      var wz = tz * t;
      var zigzag = (s % 2 === 0 ? 0.12 : -0.12);
      wirePoints.push(new THREE.Vector3(wx, 0.1 + zigzag * 0.5, wz));
    }
    var wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireMat = new THREE.LineBasicMaterial({ color: 0xaaaa00 });
    var wireLines = new THREE.LineSegments(wireGeo, wireMat);
    group.add(wireLines);

    // Tripwire (if applicable): separate green LineSegments ground-level
    var tripwireEnd = null;
    if (hasTripwire) {
      var twAngle = Math.random() * Math.PI * 2;
      var twDirX = Math.cos(twAngle);
      var twDirZ = Math.sin(twAngle);
      var twLen = 4.0;
      var twPoints = [
        new THREE.Vector3(0, 0.05, 0),
        new THREE.Vector3(twDirX * twLen, 0.05, twDirZ * twLen)
      ];
      var twGeo = new THREE.BufferGeometry().setFromPoints(twPoints);
      var twMat = new THREE.LineBasicMaterial({ color: 0x00ff88 });
      var twLine = new THREE.LineSegments(twGeo, twMat);
      group.add(twLine);
      tripwireEnd = { x: px + twDirX * twLen, z: pz + twDirZ * twLen };
    }

    group.position.set(px, 0, pz);

    return {
      group: group,
      bodyMesh: bodyMesh,
      bodyMat: bodyMat,
      wireLines: wireLines,
      triggerOffset: { x: tx, z: tz },
      tripwireEnd: tripwireEnd
    };
  }

  // ── Debris field ─────────────────────────────────────────────────────────────
  function _spawnDebris(pos) {
    if (!_scene) return;
    for (var i = 0; i < 8; i++) {
      (function (idx) {
        var geo = new THREE.BoxGeometry(
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.2
        );
        var mat = new THREE.MeshLambertMaterial({ color: 0x555533 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos.x, pos.y + 0.3, pos.z);
        var angle = (idx / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        var speed = 3 + Math.random() * 6;
        var vx = Math.cos(angle) * speed;
        var vy = 3 + Math.random() * 5;
        var vz = Math.sin(angle) * speed;
        var age = 0;
        var life = 1.0 + Math.random() * 0.5;
        _scene.add(mesh);

        function tick() {
          age += 0.016;
          mesh.position.x += vx * 0.016;
          mesh.position.y += vy * 0.016;
          mesh.position.z += vz * 0.016;
          vy -= 9.8 * 0.016;
          if (age >= life) {
            if (_scene) _scene.remove(mesh);
            geo.dispose();
            mat.dispose();
            return;
          }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }(i));
    }
  }

  // ── Explosion VFX ────────────────────────────────────────────────────────────
  function _doExplosion(pos) {
    if (!_scene) return;

    // Explosion sphere
    var expGeo = new THREE.SphereGeometry(EXPLOSION_RADIUS, 10, 10);
    var expMat = new THREE.MeshBasicMaterial({
      color: EXPLOSION_COLOR,
      transparent: true,
      opacity: 0.8
    });
    var expMesh = new THREE.Mesh(expGeo, expMat);
    expMesh.position.copy(pos);
    _scene.add(expMesh);

    // Point light flash for 1 second
    var flashLight = new THREE.PointLight(EXPLOSION_COLOR, 8, 20);
    flashLight.position.copy(pos);
    _scene.add(flashLight);

    var flashAge = 0;
    var flashInterval = setInterval(function () {
      flashAge += 0.016;
      flashLight.intensity = Math.max(0, 8 * (1 - flashAge));
      expMat.opacity = Math.max(0, 0.8 * (1 - flashAge * 2));
      if (flashAge >= 1.0) {
        clearInterval(flashInterval);
        if (_scene) {
          _scene.remove(flashLight);
          _scene.remove(expMesh);
        }
        expGeo.dispose();
        expMat.dispose();
      }
    }, 16);

    // Camera shake
    _shakeIntensity = 0.3;
    _shakeDuration  = 0.5;
    _shakeTimer     = 0;

    // Debris
    _spawnDebris(pos);

    // Sound
    _playExplosionSFX();
  }

  // ── Damage player ────────────────────────────────────────────────────────────
  function _damagePlayer(amount) {
    if (window._takeDamageFromWaveEvent) {
      window._takeDamageFromWaveEvent(amount);
    } else if (window.player && typeof window.player.health === 'number') {
      window.player.health = Math.max(0, window.player.health - amount);
    }
  }

  // ── Damage robot ─────────────────────────────────────────────────────────────
  function _damageRobot(amount) {
    if (!_robotDeployed || _robotDestroyed) return;
    _robotHP -= amount;
    if (_robotHP <= 0) {
      _robotHP = 0;
      _destroyRobot();
    }
    _updateHUD();
  }

  function _destroyRobot() {
    _robotDestroyed = true;
    _robotDeployed  = false;
    if (_robotGroup && _scene) {
      _scene.remove(_robotGroup);
      _robotGroup = null;
    }
    // Restore camera
    if (_originalCamPos && _camera) {
      _camera.position.copy(_originalCamPos);
    }
    _originalCamPos = null;
    _robotRespawnTimer = ROBOT_RESPAWN_DELAY;
    _toast('ROBOT DESTROYED — respawn in ' + ROBOT_RESPAWN_DELAY + 's', '#ff4400');
    _updateHUD();
  }

  // ── Deploy robot ─────────────────────────────────────────────────────────────
  function _deployRobot() {
    if (_robotDeployed) return;
    if (_robotDestroyed && _robotRespawnTimer > 0) {
      _toast('Robot unavailable — ' + Math.ceil(_robotRespawnTimer) + 's until respawn', '#ff8800');
      return;
    }

    var playerPos = _getPlayerPos();
    if (!playerPos || !_scene) return;

    // Save camera position so we can restore on un-deploy
    if (_camera && !_originalCamPos) {
      _originalCamPos = _camera.position.clone();
    }

    _robotGroup = _buildRobotMesh();
    _robotGroup.position.set(playerPos.x + 1.5, 0, playerPos.z);
    _scene.add(_robotGroup);

    _robotDeployed  = true;
    _robotDestroyed = false;
    _robotHP        = ROBOT_MAX_HP;

    _toast('EOD ROBOT DEPLOYED — WASD to drive', '#88ff88');
    _updateHUD();
  }

  // ── Get player/camera position ───────────────────────────────────────────────
  function _getPlayerPos() {
    if (window.player && window.player.position) return window.player.position;
    if (_camera) return _camera.position;
    return null;
  }

  // ── IED countdown display helpers ────────────────────────────────────────────
  function _fmtTime(secs) {
    var s = Math.max(0, Math.floor(secs));
    var m = Math.floor(s / 60);
    var rem = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (rem < 10 ? '0' : '') + rem;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('ied-eod-hud')) return;
    var el = document.createElement('div');
    el.id = 'ied-eod-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.82)',
      'color:#88ff88',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'padding:6px 18px',
      'border-radius:6px',
      'border:1px solid #336633',
      'pointer-events:none',
      'z-index:9020',
      'user-select:none',
      'letter-spacing:1px',
      'display:none'
    ].join(';');
    document.body.appendChild(el);
  }

  function _updateHUD() {
    var el = document.getElementById('ied-eod-hud');
    if (!el) return;
    if (!_robotDeployed && !_robotDestroyed) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';

    var liveCount = 0;
    for (var i = 0; i < _ieds.length; i++) {
      if (!_ieds[i].defused && !_ieds[i].detonated) liveCount++;
    }

    var robotStatus = _robotDestroyed
      ? 'ROBOT: DESTROYED (' + Math.ceil(_robotRespawnTimer) + 's)'
      : ('ROBOT: OK [HP:' + _robotHP + ']');

    var jammerStatus = _jammerActive
      ? 'JAMMER: ACTIVE ' + Math.ceil(_jammerTimer) + 's'
      : (_jammerCooldown > 0 ? 'JAMMER: CD ' + Math.ceil(_jammerCooldown) + 's' : 'JAMMER: READY');

    // Find shortest IED countdown to show in HUD
    var shortestTime = 9999;
    for (var j = 0; j < _ieds.length; j++) {
      var ied = _ieds[j];
      if (!ied.defused && !ied.detonated && ied.countdown < shortestTime) {
        shortestTime = ied.countdown;
      }
    }
    var timeStr = shortestTime < 9999 ? _fmtTime(shortestTime) : '--:--';

    el.textContent = 'EOD [' + robotStatus + '] [IED: ' + liveCount + '/' + IED_COUNT + ' LIVE] [' + jammerStatus + '] | TIME: ' + timeStr;
  }

  // ── IED countdown divs ───────────────────────────────────────────────────────
  function _createIEDCountdownEl(ied, index) {
    var el = document.createElement('div');
    el.id = 'ied-countdown-' + index;
    el.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:' + (20 + index * 120) + 'px',
      'background:rgba(40,0,0,0.85)',
      'color:#ff4400',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'padding:4px 10px',
      'border-radius:4px',
      'border:1px solid #882200',
      'pointer-events:none',
      'z-index:9015',
      'user-select:none',
      'letter-spacing:2px'
    ].join(';');
    document.body.appendChild(el);
    ied.countdownEl = el;
  }

  function _updateIEDCountdownEl(ied) {
    if (!ied.countdownEl) return;
    if (ied.defused) {
      ied.countdownEl.style.color = '#00ff88';
      ied.countdownEl.textContent = 'IED SAFE';
      return;
    }
    if (ied.detonated) {
      ied.countdownEl.style.color = '#888888';
      ied.countdownEl.textContent = 'IED GONE';
      return;
    }
    ied.countdownEl.textContent = _fmtTime(ied.countdown);
    ied.countdownEl.style.color = ied.countdown < 15 ? '#ff2200' : '#ff6600';
  }

  // ── Mini-game overlay ────────────────────────────────────────────────────────
  function _ensureMinigame() {
    if (document.getElementById('ied-minigame-overlay')) return;
    var el = document.createElement('div');
    el.id = 'ied-minigame-overlay';
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.94)',
      'border:3px solid #ff4400',
      'border-radius:12px',
      'padding:30px 44px',
      'z-index:10000',
      'pointer-events:auto',
      'user-select:none',
      'text-align:center',
      'min-width:360px',
      'display:none'
    ].join(';');
    document.body.appendChild(el);
  }

  function _showMinigame(ied) {
    _ensureMinigame();
    _minigameSafeIdx = Math.floor(Math.random() * WIRE_COLORS.length);
    _minigameTimer = MINIGAME_TIME_LIMIT;
    _minigameActive = true;
    _minigameIED = ied;

    var safeColor = WIRE_COLORS[_minigameSafeIdx];
    var el = document.getElementById('ied-minigame-overlay');
    if (!el) return;

    var html = '<div style="color:#ff4400;font-family:monospace;font-size:22px;font-weight:bold;margin-bottom:10px">DEFUSAL REQUIRED</div>';
    html += '<div style="color:#ffdd00;font-family:monospace;font-size:15px;margin-bottom:6px;animation:ied-pulse 0.8s ease-in-out infinite alternate">';
    html += 'CUT THE <span style="color:' + safeColor.css + ';font-size:18px;font-weight:bold">' + safeColor.label + '</span> WIRE';
    html += '</div>';
    html += '<div style="color:#ff4400;font-family:monospace;font-size:13px;margin-bottom:18px" id="ied-mg-timer">TIME: ' + MINIGAME_TIME_LIMIT + 's</div>';
    html += '<div style="display:flex;justify-content:center;gap:18px;margin-bottom:20px">';

    for (var i = 0; i < WIRE_COLORS.length; i++) {
      var wc = WIRE_COLORS[i];
      html += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px">';
      html += '<div style="width:14px;height:52px;background:' + wc.css + ';border-radius:7px;box-shadow:0 0 8px ' + wc.css + '"></div>';
      html += '<button id="ied-wire-btn-' + i + '" style="';
      html += 'background:#222;color:' + wc.css + ';border:2px solid ' + wc.css + ';border-radius:5px;';
      html += 'font-family:monospace;font-size:13px;font-weight:bold;padding:4px 10px;cursor:pointer;';
      html += '">' + wc.label + '</button>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div style="color:#888;font-family:monospace;font-size:11px">Click a wire to cut it — one chance only</div>';

    // Pulse keyframe style
    if (!document.getElementById('ied-pulse-style')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'ied-pulse-style';
      styleEl.textContent = '@keyframes ied-pulse { from { opacity:1; } to { opacity:0.5; } }';
      document.head.appendChild(styleEl);
    }

    el.innerHTML = html;
    el.style.display = 'block';

    // Attach click handlers
    for (var j = 0; j < WIRE_COLORS.length; j++) {
      (function (idx) {
        var btn = document.getElementById('ied-wire-btn-' + idx);
        if (btn) {
          btn.addEventListener('click', function () {
            _onWireCut(idx);
          });
        }
      }(j));
    }
  }

  function _hideMinigame() {
    var el = document.getElementById('ied-minigame-overlay');
    if (el) el.style.display = 'none';
    _minigameActive = false;
    _minigameIED    = null;
  }

  function _onWireCut(idx) {
    if (!_minigameActive || !_minigameIED) return;
    var ied = _minigameIED;
    _hideMinigame();

    if (idx === _minigameSafeIdx) {
      // Correct wire — defuse
      _defuseIED(ied);
    } else {
      // Wrong wire — instant detonation
      _detonateIED(ied, true);
    }
  }

  function _updateMinigameTimer() {
    var el = document.getElementById('ied-mg-timer');
    if (el) el.textContent = 'TIME: ' + Math.ceil(_minigameTimer) + 's';
  }

  // ── Defuse IED ───────────────────────────────────────────────────────────────
  function _defuseIED(ied) {
    if (ied.defused || ied.detonated) return;
    ied.defused = true;
    // Change color to grey
    if (ied.bodyMat) ied.bodyMat.color.setHex(IED_DEFUSED_COLOR);
    _playDefuseSFX();
    _defusedCount++;

    // Score
    if (window.player && typeof window.player.score === 'number') {
      window.player.score += SCORE_PER_IED;
      if (window.HUD && window.HUD.setScore) window.HUD.setScore(window.player.score);
    }

    _toast('IED DEFUSED! +' + SCORE_PER_IED, '#00ff88');

    // Check if all 3 defused — bonus if >30s remaining on any
    if (_defusedCount >= IED_COUNT) {
      var bonusEligible = false;
      if (_missionStarted) {
        // Check time on longest-remaining IED (already defused so use mission time)
        var elapsed = 0;
        if (typeof performance !== 'undefined') {
          elapsed = (performance.now() - _missionStartTime) / 1000;
        }
        // Bonus if all defused within the IED countdown time allowing >30s spare
        // Use shortest original countdown as baseline
        var shortestOriginal = 9999;
        for (var k = 0; k < _ieds.length; k++) {
          if (_ieds[k].originalCountdown < shortestOriginal) {
            shortestOriginal = _ieds[k].originalCountdown;
          }
        }
        if ((shortestOriginal - elapsed) > 30) bonusEligible = true;
      }

      if (bonusEligible) {
        if (window.player && typeof window.player.score === 'number') {
          window.player.score += SCORE_BONUS;
          if (window.HUD && window.HUD.setScore) window.HUD.setScore(window.player.score);
        }
        _toast('ALL IEDs CLEAR! BONUS +' + SCORE_BONUS, '#ffdd00');
      } else {
        _toast('ALL IEDs CLEAR!', '#00ff88');
      }
    }

    _updateIEDCountdownEl(ied);
    _updateHUD();
  }

  // ── Detonate IED ─────────────────────────────────────────────────────────────
  function _detonateIED(ied, playerCausedWrongWire) {
    if (ied.defused || ied.detonated) return;
    ied.detonated = true;

    var pos = ied.group.position.clone();
    _doExplosion(pos);

    // Player damage (if wrong wire or explosion in range)
    var playerPos = _getPlayerPos();
    if (playerPos) {
      var dx = playerPos.x - pos.x;
      var dz = playerPos.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (playerCausedWrongWire || dist < EXPLOSION_RADIUS) {
        _damagePlayer(PLAYER_DAMAGE);
      }
    }

    // Robot damage if within 5 units
    if (_robotDeployed && _robotGroup) {
      var rdx = _robotGroup.position.x - pos.x;
      var rdz = _robotGroup.position.z - pos.z;
      var rdist = Math.sqrt(rdx * rdx + rdz * rdz);
      if (rdist < ROBOT_DAMAGE_RADIUS) {
        _damageRobot(ROBOT_HP_DAMAGE);
      }
    }

    _updateIEDCountdownEl(ied);
    _updateHUD();
  }

  // ── Tripwire check ───────────────────────────────────────────────────────────
  function _distPointToSegment2D(px, pz, ax, az, bx, bz) {
    var abx = bx - ax;
    var abz = bz - az;
    var apx = px - ax;
    var apz = pz - az;
    var ab2 = abx * abx + abz * abz;
    if (ab2 === 0) return Math.sqrt(apx * apx + apz * apz);
    var t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / ab2));
    var cx = ax + t * abx - px;
    var cz = az + t * abz - pz;
    return Math.sqrt(cx * cx + cz * cz);
  }

  // ── Toast helper ─────────────────────────────────────────────────────────────
  function _toast(msg, color) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg, 3500, color || '#88ff88');
      return;
    }
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:' + (color || '#88ff88'),
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 20px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:10001',
      'transition:opacity 0.4s'
    ].join(';');
    if (document.body) document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 2200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2700);
  }

  // ── Key listeners ────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keys[key] = true;

    // I+D combo to deploy robot
    if (key === 'I') _iKeyDown = true;
    if (key === 'D') {
      _dKeyDown = true;
      if (_iKeyDown) _deployRobot();
    }

    // J = jammer
    if (key === 'J') {
      _activateJammer();
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keys[key] = false;
    if (key === 'I') _iKeyDown = false;
    if (key === 'D') _dKeyDown = false;
  }

  // ── Jammer ───────────────────────────────────────────────────────────────────
  function _activateJammer() {
    if (_jammerActive) return;
    if (_jammerCooldown > 0) {
      _toast('JAMMER COOLING DOWN: ' + Math.ceil(_jammerCooldown) + 's', '#ffaa00');
      return;
    }
    if (!_robotDeployed) {
      _toast('DEPLOY ROBOT FIRST (I+D)', '#ff8800');
      return;
    }
    _jammerActive = true;
    _jammerTimer  = JAMMER_DURATION;
    _toast('RF JAMMER ACTIVE — IED countdowns paused for ' + JAMMER_DURATION + 's', '#00ffff');
    _updateHUD();
  }

  // ── Spawn IEDs ───────────────────────────────────────────────────────────────
  function _spawnIEDs() {
    _ieds = [];
    _defusedCount = 0;

    var positions = [
      { x: -8, z: 5 },
      { x: 12, z: -3 },
      { x: 2,  z: -12 }
    ];

    for (var i = 0; i < IED_COUNT; i++) {
      var px = positions[i].x;
      var pz = positions[i].z;
      var hasTripwire = (i === 0); // first IED has a tripwire
      var builtMesh = _buildIEDMesh(px, pz, hasTripwire);
      var countdown = 60 + Math.floor(Math.random() * 61); // 60-120s

      var ied = {
        group:            builtMesh.group,
        bodyMesh:         builtMesh.bodyMesh,
        bodyMat:          builtMesh.bodyMat,
        wireLines:        builtMesh.wireLines,
        tripwireEnd:      builtMesh.tripwireEnd,
        hasTripwire:      hasTripwire,
        countdown:        countdown,
        originalCountdown: countdown,
        defused:          false,
        detonated:        false,
        countdownEl:      null,
        robotInRange:     false
      };

      _scene.add(ied.group);
      _createIEDCountdownEl(ied, i);
      _updateIEDCountdownEl(ied);
      _ieds.push(ied);
    }

    _missionStarted = true;
    if (typeof performance !== 'undefined') {
      _missionStartTime = performance.now();
    }
  }

  // ── Robot drive ──────────────────────────────────────────────────────────────
  function _driveRobot(delta) {
    if (!_robotDeployed || !_robotGroup) return;

    var speed = 4.0;
    var turnSpeed = 2.5;
    var moved = false;

    if (_keys['W']) {
      _robotGroup.position.x += Math.sin(_robotGroup.rotation.y) * speed * delta;
      _robotGroup.position.z += Math.cos(_robotGroup.rotation.y) * speed * delta;
      moved = true;
    }
    if (_keys['S']) {
      _robotGroup.position.x -= Math.sin(_robotGroup.rotation.y) * speed * delta;
      _robotGroup.position.z -= Math.cos(_robotGroup.rotation.y) * speed * delta;
      moved = true;
    }
    if (_keys['A']) {
      _robotGroup.rotation.y += turnSpeed * delta;
    }
    if (_keys['D'] && !_iKeyDown) {
      // Only turn right if not in I+D deploy combo
      _robotGroup.rotation.y -= turnSpeed * delta;
    }

    // Keep robot slightly above ground
    _robotGroup.position.y = 0;

    // Switch camera to follow robot from above
    if (_camera && _robotDeployed) {
      _camera.position.x = _robotGroup.position.x;
      _camera.position.y = _robotGroup.position.y + 2;
      _camera.position.z = _robotGroup.position.z;
      _camera.lookAt(_robotGroup.position);
    }
  }

  // ── Main init ────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _robotDeployed     = false;
    _robotGroup        = null;
    _robotHP           = ROBOT_MAX_HP;
    _robotDestroyed    = false;
    _robotRespawnTimer = 0;
    _originalCamPos    = null;
    _keys              = {};
    _ieds              = [];
    _jammerActive      = false;
    _jammerTimer       = 0;
    _jammerCooldown    = 0;
    _minigameActive    = false;
    _minigameIED       = null;
    _shakeIntensity    = 0;
    _shakeDuration     = 0;
    _shakeTimer        = 0;
    _iKeyDown          = false;
    _dKeyDown          = false;
    _defusedCount      = 0;
    _missionStarted    = false;

    _ensureHUD();
    _ensureMinigame();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    // Spawn IEDs
    _spawnIEDs();

    _toast('EOD MISSION: Defuse 3 IEDs! Press I+D to deploy robot.', '#ffdd00');
  }

  // ── Main update ──────────────────────────────────────────────────────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // Robot respawn countdown
    if (_robotDestroyed && _robotRespawnTimer > 0) {
      _robotRespawnTimer -= delta;
      if (_robotRespawnTimer <= 0) {
        _robotDestroyed = false;
        _robotRespawnTimer = 0;
        _toast('EOD robot ready — press I+D to deploy', '#88ff88');
      }
      _updateHUD();
    }

    // Drive robot
    if (_robotDeployed) {
      _driveRobot(delta);
    }

    // Jammer update
    if (_jammerActive) {
      _jammerTimer -= delta;
      if (_jammerTimer <= 0) {
        _jammerActive   = false;
        _jammerTimer    = 0;
        _jammerCooldown = JAMMER_COOLDOWN;
        _toast('RF JAMMER offline — ' + JAMMER_COOLDOWN + 's cooldown', '#ffaa00');
      }
    }
    if (_jammerCooldown > 0) {
      _jammerCooldown -= delta;
      if (_jammerCooldown < 0) _jammerCooldown = 0;
    }

    // Check jammer range (robot must be within JAMMER_RANGE of each IED)
    var jammerEffective = _jammerActive && _robotDeployed && _robotGroup;
    if (jammerEffective) {
      // Check at least one IED is within jammer range
      var anyInRange = false;
      for (var ji = 0; ji < _ieds.length; ji++) {
        var jied = _ieds[ji];
        if (jied.defused || jied.detonated) continue;
        var jdx = _robotGroup.position.x - jied.group.position.x;
        var jdz = _robotGroup.position.z - jied.group.position.z;
        if (Math.sqrt(jdx * jdx + jdz * jdz) <= JAMMER_RANGE) {
          anyInRange = true;
          break;
        }
      }
      if (!anyInRange) jammerEffective = false;
    }

    // Mini-game timer
    if (_minigameActive && _minigameIED) {
      _minigameTimer -= delta;
      _updateMinigameTimer();
      if (_minigameTimer <= 0) {
        // Time's up — detonate
        var expiredIED = _minigameIED;
        _hideMinigame();
        _detonateIED(expiredIED, false);
      }
    }

    // IED update
    var playerPos = _getPlayerPos();
    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (ied.defused || ied.detonated) continue;

      // Countdown (pause if jammer effective)
      if (!jammerEffective) {
        ied.countdown -= delta;
        if (ied.countdown <= 0) {
          ied.countdown = 0;
          _detonateIED(ied, false);
          _updateIEDCountdownEl(ied);
          continue;
        }
      }

      _updateIEDCountdownEl(ied);

      // Tripwire check — player (not robot) walks into it
      if (ied.hasTripwire && ied.tripwireEnd && playerPos) {
        var iwx = ied.group.position.x;
        var iwz = ied.group.position.z;
        var tripDist = _distPointToSegment2D(
          playerPos.x, playerPos.z,
          iwx, iwz,
          ied.tripwireEnd.x, ied.tripwireEnd.z
        );
        if (tripDist < TRIPWIRE_TRIGGER) {
          _toast('TRIPWIRE TRIGGERED!', '#ff2200');
          _detonateIED(ied, false);
          _updateIEDCountdownEl(ied);
          continue;
        }
      }

      // Robot proximity — start defusal mini-game
      if (_robotDeployed && _robotGroup && !_minigameActive) {
        var rx = _robotGroup.position.x - ied.group.position.x;
        var rz = _robotGroup.position.z - ied.group.position.z;
        var robotDist = Math.sqrt(rx * rx + rz * rz);
        if (robotDist <= DEFUSE_RANGE) {
          if (!ied.robotInRange) {
            ied.robotInRange = true;
            _showMinigame(ied);
          }
        } else {
          ied.robotInRange = false;
        }
      }
    }

    // Camera shake
    if (_shakeTimer < _shakeDuration) {
      _shakeTimer += delta;
      if (_camera) {
        _camera.position.x += (Math.random() - 0.5) * _shakeIntensity * 2;
        _camera.position.y += (Math.random() - 0.5) * _shakeIntensity;
        _camera.position.z += (Math.random() - 0.5) * _shakeIntensity * 2;
      }
    }

    _updateHUD();
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function reset() {
    // Remove all IEDs
    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (_scene && ied.group) _scene.remove(ied.group);
      if (ied.countdownEl && ied.countdownEl.parentNode) {
        ied.countdownEl.parentNode.removeChild(ied.countdownEl);
      }
    }
    _ieds = [];

    // Remove robot
    if (_robotGroup && _scene) _scene.remove(_robotGroup);
    _robotGroup    = null;
    _robotDeployed = false;
    _robotDestroyed = false;
    _robotHP       = ROBOT_MAX_HP;
    _robotRespawnTimer = 0;

    // Restore camera if needed
    if (_originalCamPos && _camera) {
      _camera.position.copy(_originalCamPos);
    }
    _originalCamPos = null;

    // Reset jammer
    _jammerActive   = false;
    _jammerTimer    = 0;
    _jammerCooldown = 0;

    // Hide overlays
    _hideMinigame();

    var hudEl = document.getElementById('ied-eod-hud');
    if (hudEl) hudEl.style.display = 'none';

    _keys           = {};
    _iKeyDown       = false;
    _dKeyDown       = false;
    _minigameActive = false;
    _minigameIED    = null;
    _defusedCount   = 0;
    _missionStarted = false;
    _shakeIntensity = 0;
    _shakeDuration  = 0;
    _shakeTimer     = 0;

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
  }

  // ── Module export ────────────────────────────────────────────────────────────
  return { init: init, update: update, reset: reset };

}());
