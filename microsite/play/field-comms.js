/* ============================================================
 *  FIELD-COMMS.JS — Military radio communications system
 *
 *  Press R to open 5-channel radio wheel.
 *  Channels:
 *    COMMAND    — Call SITREP (mission status overlay)
 *    ARTILLERY  — Call Fire Mission (mortar barrage)
 *    AIR        — Request Air Support (strafe flyby)
 *    MEDICAL    — CASEVAC Request (heal helicopter)
 *    LOGISTICS  — Ammo Resupply (ammo crate drop)
 *
 *  Features:
 *    - Radio mesh (bottom-left 3D model): black box + antenna + speaker grille
 *    - Web Audio static noise + transmission beep sounds
 *    - 60-90s per-channel cooldowns shown as pie-chart icons
 *    - 15% enemy intercept chance → reinforcement patrol + toast
 *    - Enemy EW vehicle jamming support (R key disabled)
 *    - SITREP full-screen translucent overlay
 *    - Antenna wobble + LED blink animation when transmitting
 *
 *  Reads:
 *    window.MortarStrikeSystem  — .fireAtTarget(pos, count, scatter)
 *    window.AirSupport          — .callStrafeRun(pos)
 *    window._playerHP           — current player health (number)
 *    window._squadMembers       — array of { hp, maxHp, name, alive }
 *    window._missionTime        — seconds elapsed (number)
 *    window._enemiesKilled      — number
 *    window._enemiesRemaining   — number
 *    window._currentLevel       — level ID string
 *    window._weapons            — array of { name, ammo, maxAmmo }
 *    window._ewJammerActive     — bool: enemy EW vehicle is jamming
 *    window._isDead             — bool guard
 *    window._isPaused           — bool guard
 *
 *  Writes:
 *    window._playerHP           — healed to 100 on CASEVAC
 *
 *  Public API: { init(scene, camera), update(delta), transmit(channel), isJammed(), reset() }
 * ============================================================ */
window.FieldComms = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  var CHANNELS = ['COMMAND', 'ARTILLERY', 'AIR', 'MEDICAL', 'LOGISTICS'];
  var CHANNEL_LABELS = {
    COMMAND:    'Call SITREP',
    ARTILLERY:  'Call Fire Mission',
    AIR:        'Request Air Support',
    MEDICAL:    'CASEVAC Request',
    LOGISTICS:  'Ammo Resupply'
  };
  var CHANNEL_COLORS = {
    COMMAND:    '#00aaff',
    ARTILLERY:  '#ff6600',
    AIR:        '#ffcc00',
    MEDICAL:    '#00ff88',
    LOGISTICS:  '#bb88ff'
  };
  var COOLDOWNS = {
    COMMAND:    60,
    ARTILLERY:  90,
    AIR:        80,
    MEDICAL:    90,
    LOGISTICS:  75
  };

  var INTERCEPT_CHANCE       = 0.15;
  var CASEVAC_ARRIVE_TIME    = 15;   // seconds
  var LOGISTICS_ARRIVE_TIME  = 8;    // seconds
  var MORTAR_SHELLS          = 5;
  var MORTAR_SCATTER         = 8;
  var JET_COUNT              = 3;
  var AMMO_REFILL_PERCENT    = 0.5;

  var WHEEL_RADIUS_PX        = 140;  // px, slots orbit from center
  var WHEEL_FADE             = 0.12; // seconds
  var DEAD_ZONE_PX           = 36;

  /* ── State ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;

  var _initialized  = false;
  var _wheelOpen    = false;
  var _hoveredCh    = -1;    // index into CHANNELS
  var _mouseX       = 0;
  var _mouseY       = 0;
  var _transmitting = false;
  var _txTimer      = 0;     // seconds remaining in current transmit animation

  // per-channel cooldown remaining (seconds)
  var _cooldowns = {};

  // pending timed callbacks
  var _pending = [];    // { elapsed, delay, fn }

  // 3D radio mesh refs
  var _radioGroup  = null;
  var _radioLED    = null;
  var _radioAntenna = null;
  var _antennaBaseRot = 0;
  var _ledTimer    = 0;

  // DOM refs
  var _wheelEl     = null;
  var _slotEls     = [];      // { el, pieFill, label, sub, ch }
  var _sitrепEl    = null;
  var _toastEl     = null;
  var _hudJamEl    = null;

  // CASEVAC / logistics scene objects
  var _casevacHeli   = null;
  var _casevacRotors = [];
  var _casevacTimer  = 0;
  var _casevacPhase  = 'idle'; // 'idle'|'arriving'|'hovering'|'done'
  var _logisticsCrate = null;
  var _logisticsCrateVY = 0;
  var _logisticsCrateY  = 0;

  // jet flyby objects: [{group, dir, t, totalT}]
  var _jets = [];

  // Web Audio
  var _audioCtx = null;

  /* ── Audio ──────────────────────────────────────────────────── */
  function _getAudio() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    return _audioCtx;
  }

  function _playStatic(duration) {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var sr = ctx.sampleRate;
      var len = Math.floor(sr * (duration || 0.4));
      var buf = ctx.createBuffer(1, len, sr);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.3) * 0.35;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      bp.Q.value = 0.8;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + (duration || 0.4));
      src.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  function _playTransmitBeep() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) { /* silent */ }
  }

  function _playHeliApproach() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var am  = ctx.createOscillator();
      var amG = ctx.createGain();
      var master = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 180;
      am.type = 'sine';
      am.frequency.value = 7;
      amG.gain.value = 0.3;
      master.gain.setValueAtTime(0.0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 3);
      master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 10);
      am.connect(amG);
      amG.connect(osc.frequency);
      osc.connect(master);
      master.connect(ctx.destination);
      osc.start();
      am.start();
      osc.stop(ctx.currentTime + 10);
      am.stop(ctx.currentTime + 10);
    } catch (e) { /* silent */ }
  }

  function _playJetBoom() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var sr = ctx.sampleRate;
      var len = Math.floor(sr * 0.6);
      var buf = ctx.createBuffer(1, len, sr);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var t = i / sr;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4) * 0.8;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 320;
      var gain = ctx.createGain();
      gain.gain.value = 0.7;
      src.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  /* ── THREE helpers ──────────────────────────────────────────── */
  function _T() { return window.THREE; }

  /* ── Build 3D radio mesh ────────────────────────────────────── */
  function _buildRadioMesh() {
    var T = _T();
    if (!T || !_camera) return;

    _radioGroup = new T.Group();

    // Main body — black box
    var bodyGeo = new T.BoxGeometry(0.22, 0.12, 0.07);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x111111 });
    var body = new T.Mesh(bodyGeo, bodyMat);
    _radioGroup.add(body);

    // Speaker grille — dark inset box
    var grillGeo = new T.BoxGeometry(0.10, 0.06, 0.005);
    var grillMat = new T.MeshLambertMaterial({ color: 0x222222 });
    var grill = new T.Mesh(grillGeo, grillMat);
    grill.position.set(-0.04, 0, 0.036);
    _radioGroup.add(grill);

    // Grille bars (3 horizontal strips)
    var barMat = new T.MeshLambertMaterial({ color: 0x333333 });
    for (var gi = 0; gi < 3; gi++) {
      var barGeo = new T.BoxGeometry(0.09, 0.006, 0.007);
      var bar = new T.Mesh(barGeo, barMat);
      bar.position.set(-0.04, -0.02 + gi * 0.02, 0.037);
      _radioGroup.add(bar);
    }

    // LED indicator
    var ledGeo = new T.SphereGeometry(0.008, 6, 6);
    var ledMat = new T.MeshBasicMaterial({ color: 0x00ff44 });
    _radioLED = new T.Mesh(ledGeo, ledMat);
    _radioLED.position.set(0.08, 0.04, 0.037);
    _radioGroup.add(_radioLED);

    // Button cluster — small boxes
    var btnMat = new T.MeshLambertMaterial({ color: 0x444444 });
    for (var bi = 0; bi < 3; bi++) {
      var btnGeo = new T.BoxGeometry(0.018, 0.018, 0.007);
      var btn = new T.Mesh(btnGeo, btnMat);
      btn.position.set(0.055 + bi * 0.024, -0.03, 0.037);
      _radioGroup.add(btn);
    }

    // Antenna — thin cylinder
    var antGeo = new T.CylinderGeometry(0.003, 0.003, 0.18, 6);
    var antMat = new T.MeshLambertMaterial({ color: 0x888888 });
    _radioAntenna = new T.Mesh(antGeo, antMat);
    _radioAntenna.position.set(0.09, 0.15, 0);
    _antennaBaseRot = 0;
    _radioGroup.add(_radioAntenna);

    // Clip / side rail
    var clipGeo = new T.BoxGeometry(0.01, 0.10, 0.015);
    var clipMat = new T.MeshLambertMaterial({ color: 0x333333 });
    var clip = new T.Mesh(clipGeo, clipMat);
    clip.position.set(-0.115, 0, 0);
    _radioGroup.add(clip);

    // Position radio in camera-local space: bottom-left
    _radioGroup.position.set(-0.22, -0.18, -0.45);
    _radioGroup.rotation.set(0.15, 0.4, -0.08);
    _camera.add(_radioGroup);

    // Ensure camera is in scene
    if (_scene && !_scene.getObjectById(_camera.id)) {
      _scene.add(_camera);
    }
  }

  /* ── Build CASEVAC helicopter ───────────────────────────────── */
  function _buildCasevacHeli(spawnPos) {
    var T = _T();
    if (!T) return null;

    var group = new T.Group();
    var oliveMat = new T.MeshLambertMaterial({ color: 0x4b5320 });
    var darkMat  = new T.MeshLambertMaterial({ color: 0x222222 });
    var redCross = new T.MeshLambertMaterial({ color: 0xff2222 });

    // Body
    var body = new T.Mesh(new T.BoxGeometry(3.2, 1.3, 1.3), oliveMat);
    group.add(body);

    // Red cross on side
    var crossH = new T.Mesh(new T.BoxGeometry(0.6, 0.15, 0.05), redCross);
    crossH.position.set(0, 0.1, 0.68);
    group.add(crossH);
    var crossV = new T.Mesh(new T.BoxGeometry(0.15, 0.6, 0.05), redCross);
    crossV.position.set(0, 0.1, 0.68);
    group.add(crossV);

    // Tail boom
    var tail = new T.Mesh(new T.BoxGeometry(3.0, 0.38, 0.38), oliveMat);
    tail.position.set(-3.0, 0.35, 0);
    group.add(tail);

    // Main rotor hub
    var rotHub = new T.Group();
    rotHub.position.set(0, 0.95, 0);
    group.add(rotHub);
    _casevacRotors.push({ mesh: rotHub, speed: 7 });
    var bladeM = new T.MeshLambertMaterial({ color: 0x111111 });
    var bl1 = new T.Mesh(new T.BoxGeometry(0.1, 0.04, 3.8), bladeM);
    rotHub.add(bl1);
    var bl2 = new T.Mesh(new T.BoxGeometry(3.8, 0.04, 0.1), bladeM);
    rotHub.add(bl2);

    // Tail rotor
    var tRotHub = new T.Group();
    tRotHub.position.set(-4.55, 0.6, 0.38);
    group.add(tRotHub);
    _casevacRotors.push({ mesh: tRotHub, speed: 16 });
    var tb1 = new T.Mesh(new T.BoxGeometry(0.05, 0.04, 0.85), bladeM);
    tRotHub.add(tb1);
    var tb2 = new T.Mesh(new T.BoxGeometry(0.85, 0.04, 0.05), bladeM);
    tRotHub.add(tb2);

    // Skids
    var skidMat = new T.MeshLambertMaterial({ color: 0x333333 });
    for (var si = -1; si <= 1; si += 2) {
      var skid = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 3.2, 6), skidMat);
      skid.rotation.z = Math.PI / 2;
      skid.position.set(0, -0.85, si * 0.55);
      group.add(skid);
    }

    group.position.copy(spawnPos);
    _scene.add(group);
    return group;
  }

  /* ── Build ammo crate ───────────────────────────────────────── */
  function _buildAmmoCrate(pos) {
    var T = _T();
    if (!T) return null;

    var group = new T.Group();
    var woodMat = new T.MeshLambertMaterial({ color: 0x5a4020 });
    var metalMat = new T.MeshLambertMaterial({ color: 0x556644 });

    var box = new T.Mesh(new T.BoxGeometry(0.9, 0.55, 0.55), woodMat);
    group.add(box);

    // Metal corner brackets
    var bracketMat = new T.MeshLambertMaterial({ color: 0x888866 });
    var brk = new T.Mesh(new T.BoxGeometry(0.92, 0.06, 0.57), bracketMat);
    brk.position.y = 0.25;
    group.add(brk);
    var brk2 = new T.Mesh(new T.BoxGeometry(0.92, 0.06, 0.57), bracketMat);
    brk2.position.y = -0.25;
    group.add(brk2);

    // Stencil label (yellow stripe)
    var strMat = new T.MeshLambertMaterial({ color: 0xffee00 });
    var stripe = new T.Mesh(new T.BoxGeometry(0.5, 0.08, 0.01), strMat);
    stripe.position.set(0, 0, 0.28);
    group.add(stripe);

    // Parachute canopy (simplified — cone above crate)
    var chuteGeo = new T.ConeGeometry(1.8, 2.0, 8, 1, true);
    var chuteMat = new T.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.65, side: T.DoubleSide });
    var chute = new T.Mesh(chuteGeo, chuteMat);
    chute.position.y = 2.0;
    group.add(chute);

    // Chute lines (4 thin cylinders)
    var lineMat = new T.MeshBasicMaterial({ color: 0xaaaaaa });
    for (var li = 0; li < 4; li++) {
      var ang = (li / 4) * Math.PI * 2;
      var lineGeo = new T.CylinderGeometry(0.012, 0.012, 2.0, 4);
      var line = new T.Mesh(lineGeo, lineMat);
      line.position.set(Math.cos(ang) * 0.8, 1.0, Math.sin(ang) * 0.8);
      line.rotation.z = -ang * 0.25;
      group.add(line);
    }

    group.position.copy(pos);
    _scene.add(group);
    return group;
  }

  /* ── Build jet shadow (flyby mesh) ─────────────────────────── */
  function _buildJetMesh() {
    var T = _T();
    if (!T) return null;

    var group = new T.Group();
    var mat = new T.MeshLambertMaterial({ color: 0x999999 });
    var darkMat = new T.MeshLambertMaterial({ color: 0x444444 });

    // Fuselage
    var fuse = new T.Mesh(new T.BoxGeometry(0.8, 0.7, 8.5), mat);
    group.add(fuse);

    // Wings
    var wing = new T.Mesh(new T.BoxGeometry(8.0, 0.18, 3.0), mat);
    wing.position.set(0, -0.1, 0.5);
    group.add(wing);

    // Engine
    var eng = new T.Mesh(new T.CylinderGeometry(0.4, 0.45, 2.2, 8), darkMat);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(0, 0, -4.0);
    group.add(eng);

    // Tail
    var vFin = new T.Mesh(new T.BoxGeometry(0.14, 1.8, 1.8), mat);
    vFin.position.set(0, 1.0, -3.5);
    group.add(vFin);

    return group;
  }

  /* ── DOM: wheel ─────────────────────────────────────────────── */
  function _buildWheelDOM() {
    _wheelEl = document.createElement('div');
    _wheelEl.id = 'field-comms-wheel';
    _wheelEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9200',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity ' + WHEEL_FADE + 's ease'
    ].join(';');

    // Backdrop circle
    var disc = document.createElement('div');
    disc.style.cssText = [
      'position:relative',
      'width:340px',
      'height:340px',
      'border-radius:50%',
      'background:rgba(0,0,0,0.78)',
      'border:2px solid rgba(100,180,255,0.3)',
      'pointer-events:auto',
      'box-shadow:0 0 50px rgba(0,0,0,0.7)'
    ].join(';');

    // Center label
    var center = document.createElement('div');
    center.id = 'fc-wheel-center';
    center.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#aaddff',
      'font-family:monospace',
      'font-size:12px',
      'text-align:center',
      'pointer-events:none',
      'text-shadow:0 0 8px rgba(100,200,255,0.6)',
      'letter-spacing:1px',
      'line-height:1.4'
    ].join(';');
    center.innerHTML = 'RADIO<br>COMMS';
    disc.appendChild(center);

    // Jammed overlay
    var jamLabel = document.createElement('div');
    jamLabel.id = 'fc-jam-label';
    jamLabel.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff4444',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'text-align:center',
      'pointer-events:none',
      'letter-spacing:2px',
      'display:none'
    ].join(';');
    jamLabel.textContent = 'SIGNAL JAMMED';
    disc.appendChild(jamLabel);

    _slotEls = [];

    for (var i = 0; i < CHANNELS.length; i++) {
      (function (idx) {
        var ch = CHANNELS[idx];
        var angleDeg = (idx / CHANNELS.length) * 360 - 90;
        var rad = angleDeg * Math.PI / 180;
        var cx = Math.cos(rad) * WHEEL_RADIUS_PX;
        var cy = Math.sin(rad) * WHEEL_RADIUS_PX;
        var half = 170; // disc half-width
        var SLOT_W = 78;
        var SLOT_H = 56;

        var slot = document.createElement('div');
        slot.setAttribute('data-ch', ch);
        slot.style.cssText = [
          'position:absolute',
          'width:' + SLOT_W + 'px',
          'height:' + SLOT_H + 'px',
          'left:' + (half + cx - SLOT_W / 2) + 'px',
          'top:'  + (half + cy - SLOT_H / 2) + 'px',
          'border-radius:6px',
          'background:rgba(20,20,30,0.82)',
          'border:2px solid ' + CHANNEL_COLORS[ch],
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'justify-content:center',
          'cursor:pointer',
          'transition:background 0.08s,box-shadow 0.08s',
          'user-select:none',
          'overflow:hidden',
          'pointer-events:auto'
        ].join(';');

        // Pie cooldown canvas
        var pie = document.createElement('canvas');
        pie.width  = 22;
        pie.height = 22;
        pie.style.cssText = 'position:absolute;top:2px;right:3px;pointer-events:none';
        slot.appendChild(pie);

        var label = document.createElement('div');
        label.style.cssText = [
          'color:' + CHANNEL_COLORS[ch],
          'font-family:monospace',
          'font-size:9px',
          'font-weight:bold',
          'letter-spacing:0.5px',
          'text-align:center',
          'pointer-events:none',
          'text-shadow:0 0 6px ' + CHANNEL_COLORS[ch]
        ].join(';');
        label.textContent = ch;
        slot.appendChild(label);

        var sub = document.createElement('div');
        sub.style.cssText = [
          'color:#aaaaaa',
          'font-family:monospace',
          'font-size:7.5px',
          'text-align:center',
          'margin-top:2px',
          'pointer-events:none',
          'max-width:72px',
          'overflow:hidden',
          'white-space:nowrap'
        ].join(';');
        sub.textContent = CHANNEL_LABELS[ch];
        slot.appendChild(sub);

        disc.appendChild(slot);
        _slotEls.push({ el: slot, pie: pie, label: label, sub: sub, ch: ch });
      })(i);
    }

    _wheelEl.appendChild(disc);
    _wheelEl.appendChild(jamLabel);
    document.body.appendChild(_wheelEl);
  }

  /* ── DOM: SITREP overlay ────────────────────────────────────── */
  function _buildSitrepDOM() {
    _sitrепEl = document.createElement('div');
    _sitrепEl.id = 'field-comms-sitrep';
    _sitrепEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9100',
      'background:rgba(0,0,10,0.88)',
      'color:#00aaff',
      'font-family:monospace',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'pointer-events:auto'
    ].join(';');

    var panel = document.createElement('div');
    panel.style.cssText = [
      'width:min(680px,90vw)',
      'border:1px solid rgba(0,170,255,0.5)',
      'padding:32px 40px',
      'border-radius:4px',
      'background:rgba(0,5,20,0.95)',
      'box-shadow:0 0 40px rgba(0,100,255,0.25)',
      'user-select:none'
    ].join(';');
    panel.id = 'fc-sitrep-panel';

    _sitrепEl.appendChild(panel);
    _sitrепEl.addEventListener('click', function () {
      _hideSitrep();
    });
    document.body.appendChild(_sitrепEl);
  }

  /* ── DOM: toast ─────────────────────────────────────────────── */
  function _buildToastDOM() {
    _toastEl = document.createElement('div');
    _toastEl.id = 'field-comms-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:28%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffcc00',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'text-shadow:0 0 12px #ff8800',
      'z-index:9400',
      'pointer-events:none',
      'text-align:center',
      'letter-spacing:2px',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_toastEl);

    _hudJamEl = document.createElement('div');
    _hudJamEl.id = 'field-comms-jam-hud';
    _hudJamEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:20px',
      'color:#ff4444',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'letter-spacing:1px',
      'z-index:700',
      'pointer-events:none',
      'display:none',
      'text-shadow:0 0 8px #ff0000'
    ].join(';');
    _hudJamEl.textContent = '[ RADIO JAMMED ]';
    document.body.appendChild(_hudJamEl);
  }

  /* ── Show / hide toast ──────────────────────────────────────── */
  var _toastTimeout = null;

  function _showToast(msg, dur, color) {
    if (!_toastEl) return;
    if (_toastTimeout) clearTimeout(_toastTimeout);
    _toastEl.textContent = msg;
    _toastEl.style.color = color || '#ffcc00';
    _toastEl.style.textShadow = '0 0 12px ' + (color || '#ff8800');
    _toastEl.style.display = 'block';
    _toastTimeout = setTimeout(function () {
      if (_toastEl) _toastEl.style.display = 'none';
    }, dur || 2500);
  }

  /* ── Pie cooldown drawing ────────────────────────────────────── */
  function _drawPie(canvas, fraction, color) {
    var ctx = canvas.getContext('2d');
    var r = 9;
    var cx = 11;
    var cy = 11;
    ctx.clearRect(0, 0, 22, 22);
    if (fraction <= 0) return;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2, false);
    ctx.closePath();
    ctx.fillStyle = color || 'rgba(255,100,0,0.7)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /* ── Refresh wheel slots ─────────────────────────────────────── */
  function _refreshWheel() {
    for (var i = 0; i < _slotEls.length; i++) {
      var entry = _slotEls[i];
      var ch    = entry.ch;
      var isHov = (i === _hoveredCh);
      var cd    = _cooldowns[ch] || 0;
      var maxCd = COOLDOWNS[ch];
      var frac  = cd > 0 ? cd / maxCd : 0;

      if (isHov) {
        entry.el.style.background  = 'rgba(100,160,255,0.18)';
        entry.el.style.boxShadow   = '0 0 18px rgba(100,160,255,0.5)';
        entry.el.style.borderColor = '#ffffff';
      } else {
        entry.el.style.background  = 'rgba(20,20,30,0.82)';
        entry.el.style.boxShadow   = 'none';
        entry.el.style.borderColor = CHANNEL_COLORS[ch];
      }

      _drawPie(entry.pie, frac, 'rgba(255,120,0,0.75)');

      // Grey out if on cooldown
      entry.label.style.opacity = frac > 0 ? '0.45' : '1';
      entry.sub.style.opacity   = frac > 0 ? '0.45' : '1';
    }
  }

  /* ── SITREP overlay populate and show ───────────────────────── */
  var LEVEL_OBJECTIVES = {
    KYIV:      ['Destroy T-72 column at Delta-7', 'Secure the northern corridor', 'Protect civilian evac route'],
    BAKHMUT:   ['Hold the eastern salient', 'Neutralize Wagner PMC HQ', 'Keep supply route open'],
    MARIUPOL:  ['Hold Azovstal perimeter', 'Destroy blocking force on corridor', 'Await evacuation signal'],
    KHERSON:   ['Cut Russian escape route at Dnipro bridge', 'Secure Freedom Square', 'Liberate city center'],
    KREMLIN:   ['Breach outer perimeter', 'Eliminate BOSS unit inside Kremlin', 'Survive extraction'],
    SNAKE:     ['Defend Snake Island', 'Sink the cruiser', 'Hold until relief'],
    BUCHA:     ['Document war crimes sites', 'Eliminate war criminals', 'Secure the town'],
    KHARKIV:   ['Push enemy to the border', 'Neutralize glide bomb launchers', 'Hold Kharkiv city center'],
    CHORNOBYL: ['Navigate radiation zones', 'Expel occupying forces', 'Secure reactor building'],
    CRIMEA:    ['Destroy the bridge', 'Neutralize naval assets', 'Signal liberation']
  };

  function _showSitrep() {
    if (!_sitrепEl) return;
    var panel = document.getElementById('fc-sitrep-panel');
    if (!panel) return;

    var missionTime = window._missionTime || 0;
    var mins = Math.floor(missionTime / 60);
    var secs = Math.floor(missionTime % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var killed    = window._enemiesKilled    || 0;
    var remaining = window._enemiesRemaining || '?';
    var level     = window._currentLevel     || 'UNKNOWN';
    var objs      = LEVEL_OBJECTIVES[level] || ['Eliminate all enemy forces', 'Secure the area', 'Await further orders'];

    var squad = window._squadMembers || [];
    var squadHtml = '';
    if (squad.length === 0) {
      squadHtml = '<span style="color:#888">No squad data</span>';
    } else {
      for (var si = 0; si < squad.length; si++) {
        var m = squad[si];
        var hpColor = m.alive === false ? '#ff4444' : (m.hp < 30 ? '#ff8800' : '#00ff88');
        var hpStr   = m.alive === false ? 'KIA' : (m.hp + '/' + (m.maxHp || 100) + ' HP');
        squadHtml += '<div style="margin:3px 0">' +
          '<span style="color:#aaddff">' + (m.name || 'Soldier') + '</span> — ' +
          '<span style="color:' + hpColor + '">' + hpStr + '</span></div>';
      }
    }

    var playerHP = window._playerHP !== undefined ? window._playerHP : 100;
    var objHtml = '';
    for (var oi = 0; oi < objs.length; oi++) {
      objHtml += '<div style="margin:4px 0">&#9658; ' + objs[oi] + '</div>';
    }

    panel.innerHTML = [
      '<div style="font-size:20px;font-weight:bold;letter-spacing:3px;color:#00ccff;border-bottom:1px solid rgba(0,170,255,0.4);padding-bottom:12px;margin-bottom:16px">',
      '  SITUATION REPORT',
      '</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">',
      '  <div>',
      '    <div style="color:#88bbff;font-size:11px;letter-spacing:1px;margin-bottom:8px">MISSION STATUS</div>',
      '    <div>Time Elapsed: <span style="color:#fff">' + timeStr + '</span></div>',
      '    <div>Area: <span style="color:#fff">' + level + '</span></div>',
      '    <div>Enemies Eliminated: <span style="color:#ff8844">' + killed + '</span></div>',
      '    <div>Enemies Remaining: <span style="color:#ff4444">' + remaining + '</span></div>',
      '    <div>Player HP: <span style="color:' + (playerHP < 30 ? '#ff4444' : '#00ff88') + '">' + playerHP + '</span></div>',
      '  </div>',
      '  <div>',
      '    <div style="color:#88bbff;font-size:11px;letter-spacing:1px;margin-bottom:8px">SQUAD STATUS</div>',
      '    ' + squadHtml,
      '  </div>',
      '</div>',
      '<div style="margin-top:18px">',
      '  <div style="color:#88bbff;font-size:11px;letter-spacing:1px;margin-bottom:8px">CURRENT OBJECTIVES</div>',
      '  <div style="color:#aaffcc">' + objHtml + '</div>',
      '</div>',
      '<div style="margin-top:20px;color:#555;font-size:10px;text-align:center;letter-spacing:2px">[ CLICK ANYWHERE TO CLOSE ]</div>'
    ].join('');

    _sitrепEl.style.display = 'flex';
  }

  function _hideSitrep() {
    if (_sitrепEl) _sitrепEl.style.display = 'none';
  }

  /* ── Open / close wheel ─────────────────────────────────────── */
  function _openWheel() {
    if (_wheelOpen) return;
    if (window._isDead || window._isPaused) return;
    _wheelOpen = true;
    _playStatic(0.3);
    if (_wheelEl) {
      _wheelEl.style.pointerEvents = 'auto';
      _wheelEl.style.opacity = '1';
    }
    // Show jammed indicator inside wheel if applicable
    var jamLabel = document.getElementById('fc-jam-label');
    if (jamLabel) {
      jamLabel.style.display = isJammed() ? 'block' : 'none';
    }
    _refreshWheel();
  }

  function _closeWheel() {
    if (!_wheelOpen) return;
    _wheelOpen = false;
    _hoveredCh = -1;
    if (_wheelEl) {
      _wheelEl.style.pointerEvents = 'none';
      _wheelEl.style.opacity = '0';
    }
  }

  /* ── Mouse → slot index ─────────────────────────────────────── */
  function _getSlotFromMouse(mx, my) {
    var cx = window.innerWidth  / 2;
    var cy = window.innerHeight / 2;
    var dx = mx - cx;
    var dy = my - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DEAD_ZONE_PX) return -1;
    var angle = Math.atan2(dy, dx); // -PI..PI, 0=right
    angle = angle + Math.PI / 2;   // rotate so 0=top
    if (angle < 0) angle += Math.PI * 2;
    var norm = angle / (Math.PI * 2);
    return Math.floor(norm * CHANNELS.length) % CHANNELS.length;
  }

  /* ── Public: isJammed ───────────────────────────────────────── */
  function isJammed() {
    return !!window._ewJammerActive;
  }

  /* ── Enemy intercept check ──────────────────────────────────── */
  function _checkIntercept() {
    if (Math.random() < INTERCEPT_CHANCE) {
      _showToast('TRANSMISSION INTERCEPTED', 3000, '#ff4444');
      // Spawn reinforcement patrol
      if (window.EnemyReinforcements && window.EnemyReinforcements.spawnPatrol) {
        window.EnemyReinforcements.spawnPatrol(_camera ? _camera.position : null);
      } else if (window.Enemies && window.Enemies.spawnNear) {
        window.Enemies.spawnNear(_camera ? _camera.position : null, 3);
      }
    }
  }

  /* ── Channel callbacks ──────────────────────────────────────── */
  function _execCommand() {
    _showToast('SITREP REQUESTED', 1500, '#00aaff');
    setTimeout(function () { _showSitrep(); }, 600);
  }

  function _execArtillery() {
    _showToast('FIRE MISSION — ROUNDS OUTBOUND', 2000, '#ff6600');
    var T = _T();
    if (!T) return;

    var targetPos;
    if (_camera) {
      var dir = new T.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
      var camPos = _camera.position;
      var plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
      var ray = new T.Ray(camPos, dir);
      var hit = new T.Vector3();
      var ok = ray.intersectPlane(plane, hit);
      targetPos = ok ? hit.clone() : new T.Vector3(camPos.x + dir.x * 60, 0, camPos.z + dir.z * 60);
    } else {
      targetPos = new T.Vector3(0, 0, 0);
    }

    if (window.MortarStrikeSystem && window.MortarStrikeSystem.fireAtTarget) {
      window.MortarStrikeSystem.fireAtTarget(targetPos, MORTAR_SHELLS, MORTAR_SCATTER);
    } else {
      // Standalone mortar barrage
      for (var i = 0; i < MORTAR_SHELLS; i++) {
        (function (idx) {
          _pending.push({
            elapsed: 0,
            delay: idx * 0.55,
            fn: function () {
              var T2 = _T();
              if (!T2 || !_scene) return;
              var sx = (Math.random() - 0.5) * MORTAR_SCATTER;
              var sz = (Math.random() - 0.5) * MORTAR_SCATTER;
              var impactPos = new T2.Vector3(targetPos.x + sx, 0, targetPos.z + sz);
              _spawnMortarImpact(impactPos);
            }
          });
        })(i);
      }
    }
  }

  function _spawnMortarImpact(pos) {
    var T = _T();
    if (!T || !_scene) return;
    // Flash sphere
    var mat = new T.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 1.0 });
    var mesh = new T.Mesh(new T.SphereGeometry(2.5, 7, 7), mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _pending.push({
      elapsed: 0,
      delay: 0.4,
      fn: function () {
        if (_scene) _scene.remove(mesh);
        try { mesh.geometry.dispose(); mat.dispose(); } catch (e) {}
      }
    });
    // Damage
    if (window.Enemies && window.Enemies.damageInRadius) {
      window.Enemies.damageInRadius(pos, 6, 120);
    }
    if (window.GameManager && window.GameManager.screenShake) {
      window.GameManager.screenShake(0.25, 0.4);
    }
  }

  function _execAir() {
    _showToast('AIR SUPPORT INBOUND', 2000, '#ffcc00');

    if (window.AirSupport && window.AirSupport.callStrafeRun) {
      var T = _T();
      if (T && _camera) {
        var dir = new T.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
        var plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
        var ray = new T.Ray(_camera.position, dir);
        var hit = new T.Vector3();
        var ok = ray.intersectPlane(plane, hit);
        window.AirSupport.callStrafeRun(ok ? hit : null);
      } else {
        window.AirSupport.callStrafeRun(null);
      }
    } else {
      // Spawn 3 jet flyby shadow meshes
      for (var ji = 0; ji < JET_COUNT; ji++) {
        (function (jidx) {
          _pending.push({
            elapsed: 0,
            delay: jidx * 1.2,
            fn: function () { _spawnJetFlyby(); }
          });
        })(ji);
      }
    }
  }

  function _spawnJetFlyby() {
    var T = _T();
    if (!T || !_scene) return;
    var group = _buildJetMesh();
    if (!group) return;

    var camPos = _camera ? _camera.position.clone() : new T.Vector3(0, 0, 0);
    var angle  = Math.random() * Math.PI * 2;
    var dir    = new T.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
    var travel = 280;
    var startX = camPos.x - dir.x * travel * 0.5;
    var startZ = camPos.z - dir.z * travel * 0.5;

    group.position.set(startX, 55, startZ);
    group.rotation.y = Math.atan2(dir.x, dir.z);
    _scene.add(group);

    _jets.push({
      group:  group,
      dir:    dir,
      t:      0,
      totalT: travel,
      startX: startX,
      startZ: startZ,
      boomFired: false
    });
    _playJetBoom();
  }

  function _execMedical() {
    _showToast('CASEVAC REQUESTED — HELICOPTER ETA 15s', 3000, '#00ff88');
    _playHeliApproach();
    _casevacPhase = 'arriving';
    _casevacTimer = 0;

    if (_casevacHeli && _scene) {
      _scene.remove(_casevacHeli);
      _casevacHeli = null;
    }
    _casevacRotors = [];

    var T = _T();
    if (!T || !_scene) return;

    var camPos = _camera ? _camera.position : new T.Vector3(0, 0, 0);
    var spawnAngle = Math.random() * Math.PI * 2;
    var spawnPos = new T.Vector3(
      camPos.x + Math.cos(spawnAngle) * 100,
      18,
      camPos.z + Math.sin(spawnAngle) * 100
    );
    _casevacHeli = _buildCasevacHeli(spawnPos);
  }

  function _execLogistics() {
    _showToast('AMMO RESUPPLY — CRATE INBOUND IN 8s', 2500, '#bb88ff');

    _pending.push({
      elapsed: 0,
      delay: LOGISTICS_ARRIVE_TIME,
      fn: function () {
        _dropAmmoCrate();
      }
    });
  }

  function _dropAmmoCrate() {
    var T = _T();
    if (!T || !_scene) return;

    var camPos = _camera ? _camera.position : new T.Vector3(0, 0, 0);
    var dropX  = camPos.x + (Math.random() - 0.5) * 6;
    var dropZ  = camPos.z + (Math.random() - 0.5) * 6;

    _logisticsCrateY  = 35;
    _logisticsCrateVY = 0;
    var spawnPos = new T.Vector3(dropX, _logisticsCrateY, dropZ);
    _logisticsCrate = _buildAmmoCrate(spawnPos);

    _showToast('CRATE INCOMING!', 2000, '#bb88ff');
  }

  /* ── Public: transmit ───────────────────────────────────────── */
  function transmit(channel) {
    if (isJammed()) {
      _showToast('RADIO JAMMED — DESTROY EW VEHICLE', 2500, '#ff4444');
      return;
    }
    if (window._isDead || window._isPaused) return;

    var idx = CHANNELS.indexOf(channel);
    if (idx < 0) return;

    var cd = _cooldowns[channel] || 0;
    if (cd > 0) {
      _showToast(channel + ' ON COOLDOWN — ' + Math.ceil(cd) + 's', 2000, '#ff8800');
      return;
    }

    _cooldowns[channel] = COOLDOWNS[channel];
    _transmitting = true;
    _txTimer = 1.2;
    _playTransmitBeep();
    _checkIntercept();

    if (channel === 'COMMAND')   { _execCommand(); }
    else if (channel === 'ARTILLERY') { _execArtillery(); }
    else if (channel === 'AIR')       { _execAir(); }
    else if (channel === 'MEDICAL')   { _execMedical(); }
    else if (channel === 'LOGISTICS') { _execLogistics(); }
  }

  /* ── Input handlers ─────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.code === 'KeyR' && !e.repeat) {
      if (isJammed()) {
        _showToast('[ RADIO JAMMED ]', 1800, '#ff4444');
        return;
      }
      if (window._isDead || window._isPaused) return;
      _openWheel();
    }
    if (e.code === 'Escape') {
      _closeWheel();
      _hideSitrep();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyR' && _wheelOpen) {
      var sel = _hoveredCh;
      _closeWheel();
      if (sel >= 0) {
        transmit(CHANNELS[sel]);
      }
    }
  }

  function _onMouseMove(e) {
    _mouseX = e.clientX;
    _mouseY = e.clientY;
    if (_wheelOpen) {
      _hoveredCh = _getSlotFromMouse(_mouseX, _mouseY);
      _refreshWheel();
    }
  }

  /* ── CASEVAC update ─────────────────────────────────────────── */
  function _updateCasevac(delta) {
    if (_casevacPhase === 'idle') return;

    // Spin rotors
    for (var ri = 0; ri < _casevacRotors.length; ri++) {
      _casevacRotors[ri].mesh.rotation.y += _casevacRotors[ri].speed * delta;
    }

    if (_casevacPhase === 'arriving') {
      _casevacTimer += delta;
      if (!_casevacHeli) return;

      var T = _T();
      if (!T) return;
      var camPos = _camera ? _camera.position : new T.Vector3(0, 0, 0);
      var hoverTarget = new T.Vector3(camPos.x, 8, camPos.z);
      var toTarget = hoverTarget.clone().sub(_casevacHeli.position);
      var dist = toTarget.length();
      var speed = 20;

      if (dist > 0.8 && _casevacTimer < CASEVAC_ARRIVE_TIME + 5) {
        var dir = toTarget.normalize();
        _casevacHeli.position.addScaledVector(dir, Math.min(speed * delta, dist));
        _casevacHeli.rotation.y = Math.atan2(dir.x, dir.z);
      } else {
        _casevacPhase = 'hovering';
        _casevacTimer = 0;
        _showToast('CASEVAC ON STATION — HEALING', 2500, '#00ff88');
        _execHeal();
      }
    } else if (_casevacPhase === 'hovering') {
      _casevacTimer += delta;
      if (_casevacHeli) {
        _casevacHeli.position.y = 8 + Math.sin(_casevacTimer * 1.4) * 0.25;
      }
      if (_casevacTimer >= 6) {
        _casevacPhase = 'done';
        _showToast('CASEVAC DEPARTING', 1800, '#00ff88');
        _pending.push({
          elapsed: 0,
          delay: 3,
          fn: function () {
            if (_casevacHeli && _scene) {
              _scene.remove(_casevacHeli);
              _casevacHeli = null;
            }
            _casevacPhase = 'idle';
            _casevacRotors = [];
          }
        });
      }
    }
  }

  function _execHeal() {
    // Heal player to 100
    window._playerHP = 100;
    if (window.GameManager && window.GameManager.setPlayerHP) {
      window.GameManager.setPlayerHP(100);
    }
    // Heal nearby squad members
    var squad = window._squadMembers || [];
    for (var i = 0; i < squad.length; i++) {
      if (squad[i].alive !== false) {
        squad[i].hp = squad[i].maxHp || 100;
      }
    }
    if (window.HUD && window.HUD.setHealth) {
      window.HUD.setHealth(100);
    }
  }

  /* ── Logistics crate update ─────────────────────────────────── */
  function _updateLogisticsCrate(delta) {
    if (!_logisticsCrate) return;

    _logisticsCrateVY -= 14 * delta;   // gravity
    _logisticsCrateY  += _logisticsCrateVY * delta;

    if (_logisticsCrateY <= 0.3) {
      _logisticsCrateY  = 0.3;
      _logisticsCrateVY = 0;
      _logisticsCrate.position.y = _logisticsCrateY;

      // Refill weapons
      _refillAmmo();
      _showToast('AMMO RESUPPLY COMPLETE +50%', 2500, '#bb88ff');

      // Remove crate after 8s
      var crateRef = _logisticsCrate;
      _logisticsCrate = null;
      _pending.push({
        elapsed: 0,
        delay: 8,
        fn: function () {
          if (_scene && crateRef) _scene.remove(crateRef);
        }
      });
      return;
    }

    _logisticsCrate.position.y = _logisticsCrateY;
  }

  function _refillAmmo() {
    var weapons = window._weapons || [];
    for (var i = 0; i < weapons.length; i++) {
      var w = weapons[i];
      if (w && typeof w.ammo === 'number' && typeof w.maxAmmo === 'number') {
        w.ammo = Math.min(w.maxAmmo, Math.floor(w.ammo + w.maxAmmo * AMMO_REFILL_PERCENT));
      }
    }
    if (window.Weapons && window.Weapons.refillAll) {
      window.Weapons.refillAll(AMMO_REFILL_PERCENT);
    }
  }

  /* ── Jet flyby update ───────────────────────────────────────── */
  function _updateJets(delta) {
    var SPEED = 90; // units/sec
    for (var i = _jets.length - 1; i >= 0; i--) {
      var j = _jets[i];
      j.t += SPEED * delta;
      var frac = j.t / j.totalT;
      j.group.position.x = j.startX + j.dir.x * j.t;
      j.group.position.z = j.startZ + j.dir.z * j.t;

      if (!j.boomFired && frac >= 0.5) {
        j.boomFired = true;
        _playJetBoom();
        // Strafe damage along path
        if (window.Enemies && window.Enemies.damageInRadius) {
          var T = _T();
          if (T) {
            var midX = j.startX + j.dir.x * j.totalT * 0.5;
            var midZ = j.startZ + j.dir.z * j.totalT * 0.5;
            var midPos = new T.Vector3(midX, 0, midZ);
            window.Enemies.damageInRadius(midPos, 18, 90);
          }
        }
      }

      if (frac >= 1.0) {
        if (_scene) _scene.remove(j.group);
        _jets.splice(i, 1);
      }
    }
  }

  /* ── Radio mesh animation ───────────────────────────────────── */
  function _updateRadioAnim(delta) {
    if (!_radioLED || !_radioAntenna) return;

    // LED blink when transmitting
    if (_transmitting) {
      _ledTimer += delta;
      var on = Math.floor(_ledTimer * 8) % 2 === 0;
      _radioLED.material.color.setHex(on ? 0xff4400 : 0x440000);
      _radioLED.material.emissive && _radioLED.material.emissive.setHex(on ? 0xff2200 : 0x000000);
    } else {
      // Slow green pulse
      _ledTimer += delta;
      var brightness = 0.5 + 0.5 * Math.sin(_ledTimer * 2);
      var g = Math.floor(brightness * 255);
      _radioLED.material.color.setRGB(0, g / 255, 0.15);
    }

    // Antenna wobble when transmitting
    if (_transmitting) {
      _radioAntenna.rotation.z = Math.sin(_ledTimer * 18) * 0.12;
    } else {
      _radioAntenna.rotation.z = _radioAntenna.rotation.z * 0.85; // dampen back to 0
    }
  }

  /* ── Jammer HUD ─────────────────────────────────────────────── */
  function _updateJamHud() {
    if (!_hudJamEl) return;
    _hudJamEl.style.display = isJammed() ? 'block' : 'none';
  }

  /* ── Public: init ───────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    // Init cooldowns to 0
    for (var ci = 0; ci < CHANNELS.length; ci++) {
      _cooldowns[CHANNELS[ci]] = 0;
    }

    _buildWheelDOM();
    _buildSitrepDOM();
    _buildToastDOM();
    _buildRadioMesh();

    document.addEventListener('keydown',   _onKeyDown,   false);
    document.addEventListener('keyup',     _onKeyUp,     false);
    document.addEventListener('mousemove', _onMouseMove, false);

    _initialized = true;
  }

  /* ── Public: update (called every frame, delta in seconds) ──── */
  function update(delta) {
    if (!_initialized) return;
    var dt = delta || 0;
    if (dt <= 0) return;

    // Tick cooldowns
    for (var ci = 0; ci < CHANNELS.length; ci++) {
      var ch = CHANNELS[ci];
      if (_cooldowns[ch] > 0) {
        _cooldowns[ch] -= dt;
        if (_cooldowns[ch] < 0) _cooldowns[ch] = 0;
      }
    }

    // Transmit animation timer
    if (_transmitting) {
      _txTimer -= dt;
      if (_txTimer <= 0) {
        _transmitting = false;
        _txTimer = 0;
      }
    }

    // Pending callbacks
    for (var pi = _pending.length - 1; pi >= 0; pi--) {
      var p = _pending[pi];
      p.elapsed += dt;
      if (p.elapsed >= p.delay) {
        try { p.fn(); } catch (e) {}
        _pending.splice(pi, 1);
      }
    }

    // CASEVAC helicopter
    _updateCasevac(dt);

    // Logistics crate
    _updateLogisticsCrate(dt);

    // Jet flybys
    _updateJets(dt);

    // Radio mesh animation
    _updateRadioAnim(dt);

    // Jammer HUD
    _updateJamHud();

    // Live wheel refresh (cooldown pies)
    if (_wheelOpen) {
      _refreshWheel();
    }
  }

  /* ── Public: reset ──────────────────────────────────────────── */
  function reset() {
    _closeWheel();
    _hideSitrep();

    // Clear cooldowns
    for (var ci = 0; ci < CHANNELS.length; ci++) {
      _cooldowns[CHANNELS[ci]] = 0;
    }

    // Clear pending
    _pending = [];

    // Remove CASEVAC heli
    if (_casevacHeli && _scene) {
      _scene.remove(_casevacHeli);
      _casevacHeli = null;
    }
    _casevacRotors = [];
    _casevacPhase  = 'idle';
    _casevacTimer  = 0;

    // Remove logistics crate
    if (_logisticsCrate && _scene) {
      _scene.remove(_logisticsCrate);
      _logisticsCrate = null;
    }
    _logisticsCrateVY = 0;
    _logisticsCrateY  = 0;

    // Remove jets
    for (var ji = 0; ji < _jets.length; ji++) {
      if (_scene) _scene.remove(_jets[ji].group);
    }
    _jets = [];

    _transmitting = false;
    _txTimer      = 0;
    _hoveredCh    = -1;

    if (_toastTimeout) clearTimeout(_toastTimeout);
    if (_toastEl) _toastEl.style.display = 'none';
    if (_hudJamEl) _hudJamEl.style.display = 'none';
  }

  /* ── Public API ─────────────────────────────────────────────── */
  return {
    init:      init,
    update:    update,
    transmit:  transmit,
    isJammed:  isJammed,
    reset:     reset
  };

})();
