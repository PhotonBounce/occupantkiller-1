// ============================================================
//  air-support.js — Close air support: strafing, bombing, napalm, evac
//  Player earns tokens by killing enemies (1 per 10 kills, max 5).
//  Q key opens radial menu (4 options).
//  Public API: { init(scene, camera), update(delta), addToken(), callStrafeRun(pos), callBombRun(pos), reset() }
// ============================================================
window.AirSupport = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;

  var _tokens       = 0;
  var _maxTokens    = 5;
  var _killCounter  = 0;   // track kills toward next token
  var _killsPerToken = 10;

  var _cooldown     = 0;
  var COOLDOWN_TIME = 30;  // seconds between any call

  // radial menu
  var _menuOpen     = false;
  var _menuEl       = null;
  var _selectedOption = -1; // 0=strafe 1=bomb 2=napalm 3=evac

  // HUD
  var _hudEl        = null;

  // strike phases: idle | strafe_designate | strafe_delay | strafe_fly
  //                     | bomb_designate | bomb_delay | bomb_fly
  //                     | napalm_pt1 | napalm_pt2 | napalm_active
  //                     | evac_fly | evac_hover
  var _phase        = 'idle';
  var _phaseTimer   = 0;

  // shared targeting
  var _raycaster    = null;
  var _targetPos    = null;   // THREE.Vector3

  // strafe run
  var _strafeDesig      = null;  // laser cylinder mesh
  var _strafeAircraft   = null;  // A-10 group
  var _strafeExplosions = [];    // explosion fx objects {mesh,mat,life,maxLife}
  var _strafeContrail   = [];    // contrail sphere objects
  var _strafeDir        = null;  // THREE.Vector3 unit direction

  // bomb run
  var _bombMarker    = null;  // circle on ground
  var _bombAircraft  = null;  // F-16 group
  var _bombs         = [];    // {mesh,vy,x,y,z}
  var _bombContrail  = [];
  var _bombDir       = null;
  var _bombAircraftStart = null;
  var _bombAircraftEnd   = null;
  var _bombAircraftT     = 0;
  var _bombExplosions    = [];
  var _bombDustClouds    = [];

  // napalm
  var _napalmStart   = null;  // THREE.Vector3 — first click
  var _napalmEnd     = null;  // THREE.Vector3 — second click
  var _napalmSmoke   = null;  // red smoke mesh
  var _napalmStrip   = null;  // fire box mesh
  var _napalmTimer   = 0;
  var _napalmDuration = 8;    // seconds
  var _napalmClickCount = 0;
  var _napalmBomber  = null;  // bomber group
  var _napalmContrail = [];
  var _napalmBomberStart = null;
  var _napalmBomberEnd   = null;
  var _napalmBomberT     = 0;

  // evac
  var _evacHeli      = null;   // UH-60 group
  var _evacRope      = null;   // ladder mesh
  var _evacRopeLen   = 0;
  var _evacHoverPos  = null;   // THREE.Vector3
  var _evacRotors    = [];
  var _evacHoverTimer = 0;
  var _evacuated     = false;

  // audio
  var _audioCtx      = null;

  // misc particles/smoke
  var _particles     = [];  // generic {mesh,mat,vx,vy,vz,life,maxLife}
  var _smokeParticles = []; // {mesh,mat,vy,life,maxLife}

  // ── Audio helpers ─────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playBRRRT() {
    try {
      var ctx = _getAudioCtx();
      var bufLen = Math.floor(ctx.sampleRate * 0.8);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      // 80 Hz pulse burst simulating GAU-8 cannon
      for (var i = 0; i < bufLen; i++) {
        var t = i / ctx.sampleRate;
        var envelope = Math.exp(-t * 1.5);
        var pulse = Math.sin(2 * Math.PI * 80 * t) > 0 ? 1 : -1;
        data[i] = pulse * envelope * 0.6;
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      gain.gain.value = 0.8;
      src.buffer = buf;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  function _playExplosion(vol) {
    try {
      var ctx = _getAudioCtx();
      var bufLen = Math.floor(ctx.sampleRate * 1.2);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3.5);
      }
      var src  = ctx.createBufferSource();
      var lp   = ctx.createBiquadFilter();
      var gain = ctx.createGain();
      lp.type = 'lowpass';
      lp.frequency.value = 200;
      gain.gain.value = vol || 0.6;
      src.buffer = buf;
      src.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  function _playHeliSound() {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var am  = ctx.createOscillator();
      var amGain  = ctx.createGain();
      var master  = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 200;
      am.type = 'sine';
      am.frequency.value = 8;
      amGain.gain.value = 0.4;
      master.gain.setValueAtTime(0.1, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 4);
      master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 12);
      am.connect(amGain);
      amGain.connect(osc.frequency);
      osc.connect(master);
      master.connect(ctx.destination);
      osc.start();
      am.start();
      osc.stop(ctx.currentTime + 12);
      am.stop(ctx.currentTime + 12);
    } catch (e) { /* silent */ }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'air-support-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:14px',
      'right:14px',
      'color:#ffe066',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'text-shadow:0 0 6px #ffd000',
      'z-index:600',
      'pointer-events:none',
      'text-align:right',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var stars = '';
    for (var i = 0; i < _maxTokens; i++) {
      stars += (i < _tokens) ? '★' : '☆';
    }
    var cdStr = (_cooldown > 0) ? ' | CD:' + Math.ceil(_cooldown) + 's' : '';
    _hudEl.innerHTML = 'AIR SUPPORT ' + stars + cdStr;
  }

  function _showToast(msg, dur, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, dur || 2000, color || '#ffe066');
        return;
      }
    } catch (e) {}
    // fallback inline toast
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:42%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + (color || '#ffe066'),
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'text-shadow:0 0 12px ' + (color || '#ffd000'),
      'z-index:3200',
      'pointer-events:none',
      'text-align:center',
      'letter-spacing:3px'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, dur || 2000);
  }

  // ── Radial Menu ───────────────────────────────────────────────────────────────
  function _createMenu() {
    if (_menuEl) return;
    _menuEl = document.createElement('div');
    _menuEl.id = 'air-support-menu';
    _menuEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:320px',
      'height:320px',
      'z-index:3000',
      'pointer-events:none',
      'display:none'
    ].join(';');

    var options = [
      { label: 'STRAFE RUN', sub: '1 token', angle: -90,  cost: 1, id: 0 },
      { label: 'BOMB RUN',   sub: '2 tokens', angle: 0,   cost: 2, id: 1 },
      { label: 'NAPALM',     sub: '3 tokens', angle: 90,  cost: 3, id: 2 },
      { label: 'EVAC',       sub: '1 token',  angle: 180, cost: 1, id: 3 }
    ];

    var center = document.createElement('div');
    center.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ffe066',
      'font-family:monospace',
      'font-size:11px',
      'text-align:center',
      'text-shadow:0 0 8px #ffd000'
    ].join(';');
    center.innerHTML = 'AIR<br>SUPPORT';
    _menuEl.appendChild(center);

    for (var i = 0; i < options.length; i++) {
      (function (opt) {
        var rad = (opt.angle * Math.PI) / 180;
        var r = 120;
        var ox = Math.round(Math.cos(rad) * r);
        var oy = Math.round(Math.sin(rad) * r);
        var item = document.createElement('div');
        item.setAttribute('data-id', String(opt.id));
        item.style.cssText = [
          'position:absolute',
          'top:50%',
          'left:50%',
          'transform:translate(calc(-50% + ' + ox + 'px), calc(-50% + ' + oy + 'px))',
          'background:rgba(0,0,0,0.75)',
          'border:2px solid #ffe066',
          'border-radius:6px',
          'padding:7px 12px',
          'color:#ffe066',
          'font-family:monospace',
          'font-size:12px',
          'font-weight:bold',
          'text-align:center',
          'text-shadow:0 0 6px #ffd000',
          'min-width:80px',
          'white-space:nowrap'
        ].join(';');
        item.innerHTML = opt.label + '<br><span style="font-size:10px;opacity:0.7">' + opt.sub + '</span>';
        _menuEl.appendChild(item);
      })(options[i]);
    }

    document.body.appendChild(_menuEl);
  }

  function _openMenu() {
    if (_menuOpen) return;
    _menuOpen = true;
    if (!_menuEl) _createMenu();
    _menuEl.style.display = 'block';
    _highlightMenuOption(-1);
  }

  function _closeMenu() {
    _menuOpen = false;
    if (_menuEl) _menuEl.style.display = 'none';
    _selectedOption = -1;
  }

  function _highlightMenuOption(id) {
    if (!_menuEl) return;
    var items = _menuEl.querySelectorAll('[data-id]');
    for (var i = 0; i < items.length; i++) {
      var itemId = parseInt(items[i].getAttribute('data-id'), 10);
      if (itemId === id) {
        items[i].style.background = 'rgba(255,220,50,0.25)';
        items[i].style.borderColor = '#fff';
        items[i].style.color = '#fff';
      } else {
        items[i].style.background = 'rgba(0,0,0,0.75)';
        items[i].style.borderColor = '#ffe066';
        items[i].style.color = '#ffe066';
      }
    }
    _selectedOption = id;
  }

  // Map mouse position relative to screen center to menu option index
  function _getMenuOptionFromMouse(mx, my) {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var dx = mx - cx;
    var dy = my - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 40) return -1; // center dead zone
    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    // -90=up => 0, 0=right => 1, 90=down => 2, 180/-180=left => 3
    if (angle >= -135 && angle < -45)  return 0; // up
    if (angle >= -45  && angle < 45)   return 1; // right
    if (angle >= 45   && angle < 135)  return 2; // down
    return 3;                                     // left
  }

  // ── Three.js mesh builders ───────────────────────────────────────────────────
  var T = function () { return window.THREE; };

  function _groundHitFromCamera() {
    if (!_camera) return null;
    var TT = T();
    if (!_raycaster) _raycaster = new TT.Raycaster();
    var dir = new TT.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    _raycaster.set(_camera.position, dir);
    var plane = new TT.Plane(new TT.Vector3(0, 1, 0), 0);
    var hit = new TT.Vector3();
    var result = _raycaster.ray.intersectPlane(plane, hit);
    if (result) return hit.clone();
    // fallback: 80 units ahead flat
    return new TT.Vector3(
      _camera.position.x + dir.x * 80,
      0,
      _camera.position.z + dir.z * 80
    );
  }

  // A-10 Warthog: fuselage + delta wings + two tail fins
  function _buildA10() {
    var TT = T();
    var group = new TT.Group();
    var grayMat = new TT.MeshLambertMaterial({ color: 0x888888 });
    var darkMat = new TT.MeshLambertMaterial({ color: 0x555555 });

    // fuselage — long narrow box
    var fuse = new TT.Mesh(new TT.BoxGeometry(1.2, 1.0, 9.0), grayMat);
    group.add(fuse);

    // delta wings — wide flat box
    var wing = new TT.Mesh(new TT.BoxGeometry(12.0, 0.25, 4.0), grayMat);
    wing.position.set(0, -0.1, 0.5);
    group.add(wing);

    // two engines (cylinders) below wing
    var engL = new TT.Mesh(new TT.CylinderGeometry(0.35, 0.35, 3.0, 8), darkMat);
    engL.rotation.x = Math.PI / 2;
    engL.position.set(-2.5, 0.2, -1.0);
    group.add(engL);

    var engR = new TT.Mesh(new TT.CylinderGeometry(0.35, 0.35, 3.0, 8), darkMat);
    engR.rotation.x = Math.PI / 2;
    engR.position.set(2.5, 0.2, -1.0);
    group.add(engR);

    // vertical tail fins
    var tailFinL = new TT.Mesh(new TT.BoxGeometry(0.15, 1.6, 1.8), grayMat);
    tailFinL.position.set(-1.2, 0.8, -4.0);
    group.add(tailFinL);

    var tailFinR = new TT.Mesh(new TT.BoxGeometry(0.15, 1.6, 1.8), grayMat);
    tailFinR.position.set(1.2, 0.8, -4.0);
    group.add(tailFinR);

    // horizontal tail
    var hTail = new TT.Mesh(new TT.BoxGeometry(5.0, 0.2, 1.6), grayMat);
    hTail.position.set(0, 0, -4.2);
    group.add(hTail);

    return group;
  }

  // F-16 Falcon: sleek fuselage + swept wings + single fin
  function _buildF16() {
    var TT = T();
    var group = new TT.Group();
    var grayMat = new TT.MeshLambertMaterial({ color: 0x999999 });
    var darkMat = new TT.MeshLambertMaterial({ color: 0x444444 });

    var fuse = new TT.Mesh(new TT.BoxGeometry(0.9, 0.8, 10.0), grayMat);
    group.add(fuse);

    var wing = new TT.Mesh(new TT.BoxGeometry(9.0, 0.2, 3.5), grayMat);
    wing.position.set(0, -0.1, 1.0);
    group.add(wing);

    var eng = new TT.Mesh(new TT.CylinderGeometry(0.45, 0.5, 2.5, 8), darkMat);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(0, 0, -4.5);
    group.add(eng);

    var vFin = new TT.Mesh(new TT.BoxGeometry(0.15, 2.0, 2.2), grayMat);
    vFin.position.set(0, 1.1, -3.8);
    group.add(vFin);

    var hStab = new TT.Mesh(new TT.BoxGeometry(3.5, 0.15, 1.2), grayMat);
    hStab.position.set(0, 0, -4.5);
    group.add(hStab);

    return group;
  }

  // Napalm bomber — heavy box-fuselage variant
  function _buildNapalmBomber() {
    var TT = T();
    var group = new TT.Group();
    var grayMat = new TT.MeshLambertMaterial({ color: 0x777777 });
    var darkMat = new TT.MeshLambertMaterial({ color: 0x333333 });

    var fuse = new TT.Mesh(new TT.BoxGeometry(1.8, 1.4, 11.0), grayMat);
    group.add(fuse);

    var wing = new TT.Mesh(new TT.BoxGeometry(14.0, 0.3, 4.5), grayMat);
    wing.position.set(0, -0.2, 0.5);
    group.add(wing);

    for (var ei = -1; ei <= 1; ei += 2) {
      var eng = new TT.Mesh(new TT.CylinderGeometry(0.4, 0.4, 2.8, 8), darkMat);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(ei * 3.5, 0.0, -1.0);
      group.add(eng);
    }

    var vFin = new TT.Mesh(new TT.BoxGeometry(0.2, 2.4, 2.4), grayMat);
    vFin.position.set(0, 1.2, -4.8);
    group.add(vFin);

    return group;
  }

  // UH-60 Black Hawk silhouette
  function _buildUH60() {
    var TT = T();
    var group = new TT.Group();
    var oliveMat = new TT.MeshLambertMaterial({ color: 0x4b5320 });
    var darkMat  = new TT.MeshLambertMaterial({ color: 0x222222 });

    // body
    var body = new TT.Mesh(new TT.BoxGeometry(3.5, 1.4, 1.4), oliveMat);
    group.add(body);

    // tail boom
    var tail = new TT.Mesh(new TT.BoxGeometry(3.5, 0.4, 0.4), oliveMat);
    tail.position.set(-3.2, 0.4, 0);
    group.add(tail);

    // main rotor hub
    var rotorHub = new TT.Group();
    rotorHub.position.set(0, 1.0, 0);
    group.add(rotorHub);
    _evacRotors.push({ mesh: rotorHub, speed: 6 });

    var bladeM = new TT.MeshLambertMaterial({ color: 0x111111 });
    var b1 = new TT.Mesh(new TT.BoxGeometry(0.12, 0.05, 4.0), bladeM);
    rotorHub.add(b1);
    var b2 = new TT.Mesh(new TT.BoxGeometry(4.0, 0.05, 0.12), bladeM);
    rotorHub.add(b2);

    // tail rotor
    var tailRotorHub = new TT.Group();
    tailRotorHub.position.set(-5.1, 0.7, 0.4);
    group.add(tailRotorHub);
    _evacRotors.push({ mesh: tailRotorHub, speed: 14 });

    var tb1 = new TT.Mesh(new TT.BoxGeometry(0.06, 0.05, 0.9), bladeM);
    tailRotorHub.add(tb1);
    var tb2 = new TT.Mesh(new TT.BoxGeometry(0.9, 0.05, 0.06), bladeM);
    tailRotorHub.add(tb2);

    // skids
    var skidMat = new TT.MeshLambertMaterial({ color: 0x333333 });
    for (var si = -1; si <= 1; si += 2) {
      var skid = new TT.Mesh(new TT.CylinderGeometry(0.06, 0.06, 3.6, 6), skidMat);
      skid.rotation.z = Math.PI / 2;
      skid.position.set(0, -0.9, si * 0.6);
      group.add(skid);
    }

    return group;
  }

  // Rope ladder for evac heli
  function _buildRopeLadder() {
    var TT = T();
    var g = new TT.Group();
    var mat = new TT.MeshLambertMaterial({ color: 0xc8a050 });
    // Two vertical ropes
    var ropeL = new TT.Mesh(new TT.CylinderGeometry(0.04, 0.04, 1.0, 5), mat);
    ropeL.position.set(-0.25, -0.5, 0);
    g.add(ropeL);
    var ropeR = new TT.Mesh(new TT.CylinderGeometry(0.04, 0.04, 1.0, 5), mat);
    ropeR.position.set(0.25, -0.5, 0);
    g.add(ropeR);
    // rungs
    for (var ri = 0; ri < 4; ri++) {
      var rung = new TT.Mesh(new TT.CylinderGeometry(0.03, 0.03, 0.5, 5), mat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, -0.15 - ri * 0.22, 0);
      g.add(rung);
    }
    g.visible = false;
    return g;
  }

  // Laser designator beam (thin red cylinder pointing up)
  function _buildDesignatorBeam(pos) {
    var TT = T();
    var mat = new TT.MeshBasicMaterial({ color: 0xff1111, transparent: true, opacity: 0.85 });
    var mesh = new TT.Mesh(new TT.CylinderGeometry(0.04, 0.04, 8.0, 6), mat);
    mesh.position.set(pos.x, 4.05, pos.z);
    return mesh;
  }

  // 6-unit circle ground marker
  function _buildCircleMarker(pos, color) {
    var TT = T();
    var mat = new TT.MeshBasicMaterial({ color: color || 0xff4400, transparent: true, opacity: 0.75, side: TT.DoubleSide });
    var mesh = new TT.Mesh(new TT.RingGeometry(5.6, 6.0, 32), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, 0.06, pos.z);
    return mesh;
  }

  // Small explosion FX — bright flash sphere + fade
  function _spawnExplosionFX(pos, radius) {
    var TT = T();
    var mat = new TT.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 1.0 });
    var mesh = new TT.Mesh(new TT.SphereGeometry(radius || 1.2, 7, 7), mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _strafeExplosions.push({ mesh: mesh, mat: mat, life: 0, maxLife: 0.45, scaleMax: radius || 1.2 });

    // dust
    var dustMat = new TT.MeshBasicMaterial({ color: 0xbbaa88, transparent: true, opacity: 0.7 });
    var dust = new TT.Mesh(new TT.SphereGeometry(radius * 0.8 || 1.0, 5, 5), dustMat);
    dust.position.copy(pos);
    _scene.add(dust);
    _smokeParticles.push({ mesh: dust, mat: dustMat, vy: 1.5, life: 0, maxLife: 2.0 });
  }

  // Large bomb explosion
  function _spawnBombExplosionFX(pos) {
    var TT = T();
    var colors = [0xff2200, 0xff8800, 0xffee00, 0xffffff];
    for (var ci = 0; ci < colors.length; ci++) {
      var mat = new TT.MeshBasicMaterial({ color: colors[ci], transparent: true, opacity: 1.0 });
      var r = 4.0 + ci * 1.5;
      var mesh = new TT.Mesh(new TT.SphereGeometry(r, 8, 8), mat);
      mesh.position.copy(pos);
      mesh.position.y = 0.3;
      _scene.add(mesh);
      _bombExplosions.push({ mesh: mesh, mat: mat, life: 0, maxLife: 0.6 + ci * 0.1, scaleMax: r });
    }
    // large dust cloud
    for (var di = 0; di < 6; di++) {
      var dmat = new TT.MeshBasicMaterial({ color: 0x997755, transparent: true, opacity: 0.65 });
      var dm = new TT.Mesh(new TT.SphereGeometry(3.0 + Math.random() * 2, 6, 6), dmat);
      dm.position.set(
        pos.x + (Math.random() - 0.5) * 8,
        0.5 + Math.random() * 2,
        pos.z + (Math.random() - 0.5) * 8
      );
      _scene.add(dm);
      _bombDustClouds.push({ mesh: dm, mat: dmat, vy: 1.2 + Math.random(), life: 0, maxLife: 3.5 });
    }
  }

  // Contrail sphere (white, small, fades over 2s)
  function _spawnContrail(pos, bucket) {
    var TT = T();
    var mat = new TT.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    var mesh = new TT.Mesh(new TT.SphereGeometry(0.28, 5, 5), mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    bucket.push({ mesh: mesh, mat: mat, life: 0, maxLife: 2.0 });
  }

  // Red smoke grenade marker
  function _buildRedSmoke(pos) {
    var TT = T();
    var g = new TT.Group();
    var mat = new TT.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.7 });
    var base = new TT.Mesh(new TT.CylinderGeometry(0.15, 0.15, 0.5, 8), new TT.MeshLambertMaterial({ color: 0x333333 }));
    base.position.y = 0.25;
    g.add(base);
    // smoke cloud spheres stacked above
    for (var si = 0; si < 5; si++) {
      var sm = new TT.Mesh(new TT.SphereGeometry(0.5 + si * 0.25, 6, 6), mat.clone());
      sm.position.set(
        (Math.random() - 0.5) * 0.4,
        0.6 + si * 0.7,
        (Math.random() - 0.5) * 0.4
      );
      g.add(sm);
    }
    g.position.copy(pos);
    g.position.y = 0;
    return g;
  }

  // Napalm fire strip — elongated orange box
  function _buildNapalmStrip(start, end) {
    var TT = T();
    var dx = end.x - start.x;
    var dz = end.z - start.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    var mat = new TT.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.88 });
    var mesh = new TT.Mesh(new TT.BoxGeometry(3.0, 0.5, Math.max(len, 5)), mat);
    mesh.position.set(
      (start.x + end.x) / 2,
      0.3,
      (start.z + end.z) / 2
    );
    // rotate to align with start→end direction
    mesh.rotation.y = Math.atan2(dx, dz);
    return mesh;
  }

  // ── Aircraft helpers ──────────────────────────────────────────────────────────
  function _setupAircraftFlyby(group, targetPos, altitude, bucketTag) {
    var TT = T();
    var angle = Math.random() * Math.PI * 2;
    var dir = new TT.Vector3(Math.cos(angle), 0, Math.sin(angle));
    var travel = 250;
    var startPos = new TT.Vector3(
      targetPos.x - dir.x * travel * 0.5,
      altitude,
      targetPos.z - dir.z * travel * 0.5
    );
    var endPos = new TT.Vector3(
      targetPos.x + dir.x * travel * 0.5,
      altitude,
      targetPos.z + dir.z * travel * 0.5
    );
    group.position.copy(startPos);
    group.rotation.y = Math.atan2(dir.x, dir.z);
    _scene.add(group);
    return { dir: dir, start: startPos, end: endPos, T: 0, travel: travel };
  }

  function _stepAircraft(info, group, dt) {
    var speed = 80; // units/sec
    info.T += (speed * dt) / info.travel;
    if (info.T > 1) info.T = 1;
    group.position.lerpVectors(info.start, info.end, info.T);
    return info.T >= 1;
  }

  function _removeGroup(group) {
    if (!group || !_scene) return;
    group.traverse(function (c) {
      if (c.geometry) c.geometry.dispose();
      if (c.material) { if (c.material.dispose) c.material.dispose(); }
    });
    _scene.remove(group);
  }

  // ── Token & kill accounting ───────────────────────────────────────────────────
  function addToken() {
    _tokens = Math.min(_maxTokens, _tokens + 1);
    _showToast('+1 Air Support Token (' + _tokens + '/' + _maxTokens + ')', 1500, '#ffe066');
    _updateHUD();
  }

  function _onKill() {
    _killCounter++;
    if (_killCounter >= _killsPerToken) {
      _killCounter -= _killsPerToken;
      addToken();
    }
  }

  // ── Cost checks ───────────────────────────────────────────────────────────────
  function _canAfford(cost) {
    if (_tokens < cost) {
      _showToast('Not enough tokens (' + _tokens + '/' + cost + ')', 1800, '#ff4444');
      return false;
    }
    if (_cooldown > 0) {
      _showToast('Air Support cooling down: ' + Math.ceil(_cooldown) + 's', 1800, '#ff8800');
      return false;
    }
    if (_phase !== 'idle') {
      _showToast('Strike already in progress', 1800, '#ff8800');
      return false;
    }
    return true;
  }

  function _spendToken(cost) {
    _tokens = Math.max(0, _tokens - cost);
    _cooldown = COOLDOWN_TIME;
    _updateHUD();
  }

  // ── Enemy damage helper ───────────────────────────────────────────────────────
  function _damageEnemiesInRadius(pos, radius, dmg) {
    try {
      if (window.Enemies && window.Enemies.damageInRadius) {
        window.Enemies.damageInRadius(pos, radius, dmg, 'EXPLOSIVE');
        return;
      }
      if (window.Enemies && window.Enemies.getEnemies) {
        var list = window.Enemies.getEnemies();
        for (var i = 0; i < list.length; i++) {
          var e = list[i];
          if (!e || !e.mesh) continue;
          var dx = e.mesh.position.x - pos.x;
          var dz = e.mesh.position.z - pos.z;
          if (dx * dx + dz * dz < radius * radius) {
            if (window.Enemies.damage) window.Enemies.damage(e, dmg, false, 'EXPLOSIVE');
          }
        }
      }
    } catch (e) { /* silent */ }
  }

  function _getEnemiesInBox(cx, cz, halfLen, halfWidth, angle) {
    var result = [];
    try {
      var list = [];
      if (window.Enemies && window.Enemies.getEnemies) list = window.Enemies.getEnemies();
      var cos = Math.cos(-angle);
      var sin = Math.sin(-angle);
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (!e || !e.mesh) continue;
        var dx = e.mesh.position.x - cx;
        var dz = e.mesh.position.z - cz;
        var lx = cos * dx - sin * dz;
        var lz = sin * dx + cos * dz;
        if (Math.abs(lx) < halfWidth && Math.abs(lz) < halfLen) result.push(e);
      }
    } catch (e) { /* silent */ }
    return result;
  }

  // ── Strafe Run ────────────────────────────────────────────────────────────────
  function callStrafeRun(pos) {
    if (!_canAfford(1)) return;
    _spendToken(1);
    _targetPos = pos ? pos.clone() : _groundHitFromCamera();
    if (!_targetPos) { _cooldown = 0; _tokens++; _updateHUD(); return; }

    _showToast('STRAFE RUN — laser designating...', 2000, '#ff4444');
    // laser beam
    _strafeDesig = _buildDesignatorBeam(_targetPos);
    _scene.add(_strafeDesig);
    _phase = 'strafe_delay';
    _phaseTimer = 0;
  }

  function _beginStrafeRun() {
    _showToast('BRRRT — A-10 INBOUND!', 1500, '#ff2222');
    _playBRRRT();
    if (_strafeDesig) { _scene.remove(_strafeDesig); _strafeDesig = null; }

    var TT = T();
    _strafeAircraft = _buildA10();
    var info = _setupAircraftFlyby(_strafeAircraft, _targetPos, 60, _strafeContrail);
    _strafeDir = info.dir.clone();
    _strafeAircraft._flyInfo = info;
    _strafeAircraft._strafed = false;
    _phase = 'strafe_fly';
    _phaseTimer = 0;
  }

  function _updateStrafeFly(dt) {
    _phaseTimer += dt;
    if (!_strafeAircraft) { _phase = 'idle'; return; }
    var info = _strafeAircraft._flyInfo;
    var done = _stepAircraft(info, _strafeAircraft, dt);

    // spawn contrail
    if (Math.floor(_phaseTimer * 20) % 2 === 0) {
      _spawnContrail(_strafeAircraft.position.clone(), _strafeContrail);
    }

    // when aircraft is roughly over target (T ~0.5) fire rounds
    if (!_strafeAircraft._strafed && info.T >= 0.45) {
      _strafeAircraft._strafed = true;
      _doStrafeExplosions();
    }

    if (done) {
      _removeGroup(_strafeAircraft);
      _strafeAircraft = null;
      _phase = 'idle';
    }
  }

  function _doStrafeExplosions() {
    var TT = T();
    // 20 rounds along 200-unit line, 3-unit intervals, centered on target
    var startPt = new TT.Vector3(
      _targetPos.x - _strafeDir.x * 30,
      0.1,
      _targetPos.z - _strafeDir.z * 30
    );
    for (var i = 0; i < 20; i++) {
      (function (idx) {
        var delay = idx * 40; // ms stagger
        setTimeout(function () {
          if (!_scene) return;
          var ex = startPt.x + _strafeDir.x * idx * 3;
          var ez = startPt.z + _strafeDir.z * idx * 3;
          var epos = new (T().Vector3)(ex, 0.1, ez);
          _spawnExplosionFX(epos, 0.9);
          _playExplosion(0.2);
          _damageEnemiesInRadius(epos, 3, 80);
        }, delay);
      })(i);
    }
  }

  // ── Bomb Run ──────────────────────────────────────────────────────────────────
  function callBombRun(pos) {
    if (!_canAfford(2)) return;
    _spendToken(2);
    _targetPos = pos ? pos.clone() : _groundHitFromCamera();
    if (!_targetPos) { _cooldown = 0; _tokens += 2; _updateHUD(); return; }

    _bombMarker = _buildCircleMarker(_targetPos, 0xff4400);
    _scene.add(_bombMarker);
    _showToast('BOMB RUN — F-16 inbound in 5s', 2500, '#ff8800');
    _phase = 'bomb_designate';
    _phaseTimer = 0;
  }

  function _beginBombRun() {
    if (_bombMarker) { _scene.remove(_bombMarker); _bombMarker = null; }
    _showToast('F-16 BOMBS AWAY!', 1500, '#ff4400');

    _bombAircraft = _buildF16();
    var info = _setupAircraftFlyby(_bombAircraft, _targetPos, 80, _bombContrail);
    _bombDir = info.dir.clone();
    _bombAircraft._flyInfo = info;
    _bombAircraft._bombsDropped = 0;
    _bombAircraft._bombTimer = 0;
    _phase = 'bomb_fly';
    _phaseTimer = 0;
  }

  function _updateBombFly(dt) {
    _phaseTimer += dt;
    if (!_bombAircraft) { _phase = 'idle'; return; }
    var info = _bombAircraft._flyInfo;
    var done = _stepAircraft(info, _bombAircraft, dt);

    if (Math.floor(_phaseTimer * 20) % 2 === 0) {
      _spawnContrail(_bombAircraft.position.clone(), _bombContrail);
    }

    // drop 3 bombs at T=0.4, 0.48, 0.56
    var dropTs = [0.4, 0.48, 0.56];
    _bombAircraft._bombTimer = _bombAircraft._bombTimer || 0;
    var bd = _bombAircraft._bombsDropped;
    if (bd < 3 && info.T >= dropTs[bd]) {
      _dropBomb(_bombAircraft.position.clone());
      _bombAircraft._bombsDropped++;
    }

    if (done) {
      _removeGroup(_bombAircraft);
      _bombAircraft = null;
    }

    // stay in bomb_fly until all bomb meshes settle
    if (!_bombAircraft && _bombs.length === 0) {
      _phase = 'idle';
    }
  }

  function _dropBomb(fromPos) {
    var TT = T();
    var spread = 4;
    var mat = new TT.MeshLambertMaterial({ color: 0x222222 });
    var mesh = new TT.Mesh(new TT.CylinderGeometry(0.2, 0.25, 1.0, 7), mat);
    mesh.position.copy(fromPos);
    _scene.add(mesh);
    _bombs.push({ mesh: mesh, vy: 0, x: fromPos.x + (Math.random() - 0.5) * spread, y: fromPos.y, z: fromPos.z + (Math.random() - 0.5) * spread });
  }

  function _updateBombs(dt) {
    for (var i = _bombs.length - 1; i >= 0; i--) {
      var b = _bombs[i];
      b.vy -= 60 * dt;
      b.y  += b.vy * dt;
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.rotation.x += dt * 4;
      if (b.y <= 0.3) {
        var TT = T();
        var epos = new TT.Vector3(b.x, 0.3, b.z);
        _spawnBombExplosionFX(epos);
        _playExplosion(0.9);
        _damageEnemiesInRadius(epos, 12, 500);
        _scene.remove(b.mesh);
        if (b.mesh.geometry) b.mesh.geometry.dispose();
        if (b.mesh.material) b.mesh.material.dispose();
        _bombs.splice(i, 1);
      }
    }
  }

  // ── Napalm Strike ─────────────────────────────────────────────────────────────
  function _startNapalmDesignate() {
    if (!_canAfford(3)) return;
    _napalmClickCount = 0;
    _napalmStart = null;
    _napalmEnd   = null;
    _phase = 'napalm_pt1';
    _phaseTimer = 0;
    _showToast('NAPALM — aim and click start point', 2200, '#ff6600');
  }

  function _napalmOnClick() {
    var pos = _groundHitFromCamera();
    if (!pos) return;

    if (_phase === 'napalm_pt1') {
      _napalmStart = pos.clone();
      // drop red smoke at start
      if (_napalmSmoke) _scene.remove(_napalmSmoke);
      _napalmSmoke = _buildRedSmoke(_napalmStart);
      _scene.add(_napalmSmoke);
      _phase = 'napalm_pt2';
      _showToast('NAPALM — now click end point', 2200, '#ff6600');
    } else if (_phase === 'napalm_pt2') {
      _napalmEnd = pos.clone();
      // second smoke at end
      var smk2 = _buildRedSmoke(_napalmEnd);
      _scene.add(smk2);
      setTimeout(function () { if (_scene) _scene.remove(smk2); }, 6000);
      _spendToken(3);
      _showToast('NAPALM STRIKE INBOUND!', 2000, '#ff4400');
      _launchNapalmBomber();
    }
  }

  function _launchNapalmBomber() {
    _napalmBomber = _buildNapalmBomber();
    var midPoint = new (T().Vector3)(
      (_napalmStart.x + _napalmEnd.x) / 2,
      0,
      (_napalmStart.z + _napalmEnd.z) / 2
    );
    var info = _setupAircraftFlyby(_napalmBomber, midPoint, 70, _napalmContrail);
    _napalmBomber._flyInfo = info;
    _napalmBomber._dropped = false;
    _phase = 'napalm_fly';
    _phaseTimer = 0;
  }

  function _updateNapalmFly(dt) {
    _phaseTimer += dt;
    if (!_napalmBomber) { _phase = 'idle'; return; }
    var info = _napalmBomber._flyInfo;
    var done = _stepAircraft(info, _napalmBomber, dt);

    if (Math.floor(_phaseTimer * 20) % 2 === 0) {
      _spawnContrail(_napalmBomber.position.clone(), _napalmContrail);
    }

    if (!_napalmBomber._dropped && info.T >= 0.5) {
      _napalmBomber._dropped = true;
      _deployNapalm();
    }

    if (done) {
      _removeGroup(_napalmBomber);
      _napalmBomber = null;
    }

    if (!_napalmBomber && _napalmStrip) {
      _phase = 'napalm_active';
      _napalmTimer = 0;
    }
    if (!_napalmBomber && !_napalmStrip) {
      _phase = 'idle';
    }
  }

  function _deployNapalm() {
    if (_napalmSmoke) { _scene.remove(_napalmSmoke); _napalmSmoke = null; }
    _napalmStrip = _buildNapalmStrip(_napalmStart, _napalmEnd);
    _scene.add(_napalmStrip);
  }

  function _updateNapalmActive(dt) {
    _napalmTimer += dt;
    // pulsing opacity
    if (_napalmStrip) {
      _napalmStrip.material.opacity = 0.7 + 0.2 * Math.sin(_napalmTimer * 8);
    }
    // damage enemies in corridor every 0.5s tick
    var prevTick = Math.floor((_napalmTimer - dt) / 0.5);
    var curTick  = Math.floor(_napalmTimer / 0.5);
    if (curTick > prevTick && _napalmStart && _napalmEnd) {
      var TT = T();
      var dx = _napalmEnd.x - _napalmStart.x;
      var dz = _napalmEnd.z - _napalmStart.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      var angle = Math.atan2(dx, dz);
      var cx = (_napalmStart.x + _napalmEnd.x) / 2;
      var cz = (_napalmStart.z + _napalmEnd.z) / 2;
      var enemies = _getEnemiesInBox(cx, cz, len / 2 + 2, 3.5, angle);
      for (var i = 0; i < enemies.length; i++) {
        try {
          if (window.Enemies && window.Enemies.damage) {
            window.Enemies.damage(enemies[i], 30 * 0.5, false, 'FIRE');
          }
        } catch (e) {}
      }
    }
    if (_napalmTimer >= _napalmDuration) {
      if (_napalmStrip) {
        _scene.remove(_napalmStrip);
        if (_napalmStrip.geometry) _napalmStrip.geometry.dispose();
        if (_napalmStrip.material) _napalmStrip.material.dispose();
        _napalmStrip = null;
      }
      _phase = 'idle';
    }
  }

  // ── Emergency Evac ────────────────────────────────────────────────────────────
  function _startEvac() {
    if (!_canAfford(1)) return;
    _spendToken(1);
    _showToast('EMERGENCY EVAC — helicopter inbound!', 2500, '#00ff88');
    _playHeliSound();
    _evacRotors = [];
    _evacHeli = _buildUH60();

    // spawn far from player, fly to hover above player
    var TT = T();
    var px = _camera ? _camera.position.x : 0;
    var pz = _camera ? _camera.position.z : 0;
    var angle = Math.random() * Math.PI * 2;
    _evacHeli.position.set(
      px + Math.cos(angle) * 120,
      18,
      pz + Math.sin(angle) * 120
    );
    _scene.add(_evacHeli);
    _evacHoverPos = new TT.Vector3(px, 6, pz);
    _evacHoverTimer = 0;
    _evacuated = false;
    _phase = 'evac_fly';
    _phaseTimer = 0;
  }

  function _updateEvacFly(dt) {
    _phaseTimer += dt;
    if (!_evacHeli) { _phase = 'idle'; return; }

    // spin rotors
    for (var ri = 0; ri < _evacRotors.length; ri++) {
      _evacRotors[ri].mesh.rotation.y += _evacRotors[ri].speed * dt;
    }

    // fly toward hover position
    var TT = T();
    var toTarget = _evacHoverPos.clone().sub(_evacHeli.position);
    var dist = toTarget.length();
    var speed = 25;
    if (dist > 0.5) {
      var dir = toTarget.normalize();
      _evacHeli.position.addScaledVector(dir, Math.min(speed * dt, dist));
      _evacHeli.rotation.y = Math.atan2(dir.x, dir.z);
    } else {
      _evacHeli.position.copy(_evacHoverPos);
      // deploy rope ladder
      if (!_evacRope) {
        _evacRope = _buildRopeLadder();
        _evacHeli.add(_evacRope);
        _evacRopeLen = 0;
        _evacRope.visible = true;
        _evacRope.position.set(0, -0.9, 0);
        _showToast('HELICOPTER HOVERING — press E to grab rope', 4000, '#00ff88');
      }
      _phase = 'evac_hover';
      _evacHoverTimer = 0;
    }
  }

  function _updateEvacHover(dt) {
    _evacHoverTimer += dt;

    // spin rotors
    for (var ri = 0; ri < _evacRotors.length; ri++) {
      _evacRotors[ri].mesh.rotation.y += _evacRotors[ri].speed * dt;
    }

    // extend rope over 2s
    _evacRopeLen = Math.min(1.0, _evacRopeLen + dt * 0.5);
    if (_evacRope) {
      _evacRope.scale.y = _evacRopeLen;
    }

    // bob the heli gently
    if (_evacHeli) {
      _evacHeli.position.y = _evacHoverPos.y + Math.sin(_evacHoverTimer * 1.5) * 0.2;
    }

    // leave after 15s if player didn't grab
    if (_evacHoverTimer > 15) {
      _showToast('Helicopter leaving!', 1500, '#ff8800');
      _cleanupEvac();
      _phase = 'idle';
    }
  }

  function _tryEvacGrab() {
    if (_phase !== 'evac_hover' || !_evacHeli || _evacuated) return;
    if (!_camera) return;
    // check player distance to heli
    var TT = T();
    var dx = _camera.position.x - _evacHeli.position.x;
    var dz = _camera.position.z - _evacHeli.position.z;
    var dist2 = dx * dx + dz * dz;
    if (dist2 > 10 * 10) {
      _showToast('Move closer to the helicopter rope!', 1500, '#ff8800');
      return;
    }
    _evacuated = true;
    _showToast('EVAC SUCCESSFUL! Teleporting to safe zone...', 3000, '#00ff88');
    // teleport player 150 units north
    setTimeout(function () {
      if (_camera) {
        _camera.position.x = _camera.position.x;
        _camera.position.z = _camera.position.z - 150; // north = -Z
        _camera.position.y = 2;
      }
      _cleanupEvac();
      _phase = 'idle';
    }, 1200);
  }

  function _cleanupEvac() {
    if (_evacHeli) { _removeGroup(_evacHeli); _evacHeli = null; }
    _evacRope = null;
    _evacRopeLen = 0;
    _evacHoverPos = null;
    _evacRotors = [];
  }

  // ── Generic particle update helpers ──────────────────────────────────────────
  function _updateExplosionList(list, dt) {
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];
      p.life += dt;
      var t = p.life / p.maxLife;
      p.mat.opacity = Math.max(0, 1.0 - t);
      var s = 1.0 + t * 1.5;
      p.mesh.scale.setScalar(s);
      if (p.life >= p.maxLife) {
        if (_scene) _scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mat) p.mat.dispose();
        list.splice(i, 1);
      }
    }
  }

  function _updateContrailList(list, dt) {
    for (var i = list.length - 1; i >= 0; i--) {
      var c = list[i];
      c.life += dt;
      var t = c.life / c.maxLife;
      c.mat.opacity = Math.max(0, 0.6 * (1.0 - t));
      c.mesh.scale.setScalar(1 + t * 0.5);
      if (c.life >= c.maxLife) {
        if (_scene) _scene.remove(c.mesh);
        if (c.mesh.geometry) c.mesh.geometry.dispose();
        if (c.mat) c.mat.dispose();
        list.splice(i, 1);
      }
    }
  }

  function _updateSmokeList(list, dt) {
    for (var i = list.length - 1; i >= 0; i--) {
      var s = list[i];
      s.life += dt;
      var t = s.life / s.maxLife;
      s.mesh.position.y += s.vy * dt;
      s.mesh.scale.setScalar(1 + t * 2.5);
      s.mat.opacity = Math.max(0, 0.7 * (1.0 - t));
      if (s.life >= s.maxLife) {
        if (_scene) _scene.remove(s.mesh);
        if (s.mesh.geometry) s.mesh.geometry.dispose();
        if (s.mat) s.mat.dispose();
        list.splice(i, 1);
      }
    }
  }

  // ── Input Handlers ────────────────────────────────────────────────────────────
  var _bound = false;
  var _mouseMoveX = 0;
  var _mouseMoveY = 0;

  function _onKeyDown(e) {
    if (e.code === 'KeyQ' && !e.repeat) {
      _openMenu();
    }
    if (e.code === 'KeyE' && !e.repeat) {
      _tryEvacGrab();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyQ') {
      // confirm selection
      var sel = _selectedOption;
      _closeMenu();
      if (sel === 0) { callStrafeRun(null); }
      else if (sel === 1) { callBombRun(null); }
      else if (sel === 2) { _startNapalmDesignate(); }
      else if (sel === 3) { _startEvac(); }
    }
  }

  function _onMouseMove(e) {
    _mouseMoveX = e.clientX;
    _mouseMoveY = e.clientY;
    if (_menuOpen) {
      var id = _getMenuOptionFromMouse(e.clientX, e.clientY);
      _highlightMenuOption(id);
    }
  }

  function _onMouseDown(e) {
    if (e.button !== 0) return;
    if (_menuOpen) return;
    if (_phase === 'napalm_pt1' || _phase === 'napalm_pt2') {
      _napalmOnClick();
    }
  }

  function _bindInput() {
    if (_bound) return;
    _bound = true;
    window.addEventListener('keydown',    _onKeyDown,   false);
    window.addEventListener('keyup',      _onKeyUp,     false);
    window.addEventListener('mousemove',  _onMouseMove, false);
    window.addEventListener('mousedown',  _onMouseDown, false);
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _createHUD();
    _createMenu();
    _bindInput();
  }

  function update(delta) {
    if (!_scene) return;
    var dt = delta || 0;
    if (dt <= 0) return;

    // cooldown tick
    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown < 0) _cooldown = 0;
      _updateHUD();
    }

    // pulsing designator
    if (_strafeDesig) {
      _strafeDesig.material.opacity = 0.6 + 0.3 * Math.sin(Date.now() * 0.01);
    }
    if (_bombMarker) {
      _bombMarker.material.opacity = 0.5 + 0.3 * Math.sin(Date.now() * 0.008);
    }

    // phase update
    if (_phase === 'strafe_delay') {
      _phaseTimer += dt;
      if (_phaseTimer >= 3.0) _beginStrafeRun();
    } else if (_phase === 'strafe_fly') {
      _updateStrafeFly(dt);
    } else if (_phase === 'bomb_designate') {
      _phaseTimer += dt;
      if (_phaseTimer >= 5.0) _beginBombRun();
    } else if (_phase === 'bomb_fly') {
      _updateBombFly(dt);
    } else if (_phase === 'napalm_fly') {
      _updateNapalmFly(dt);
    } else if (_phase === 'napalm_active') {
      _updateNapalmActive(dt);
    } else if (_phase === 'evac_fly') {
      _updateEvacFly(dt);
    } else if (_phase === 'evac_hover') {
      _updateEvacHover(dt);
    }

    // physics / particle updates (always)
    _updateBombs(dt);
    _updateExplosionList(_strafeExplosions, dt);
    _updateExplosionList(_bombExplosions, dt);
    _updateSmokeList(_smokeParticles, dt);
    _updateSmokeList(_bombDustClouds, dt);
    _updateContrailList(_strafeContrail, dt);
    _updateContrailList(_bombContrail, dt);
    _updateContrailList(_napalmContrail, dt);
  }

  function reset() {
    // remove in-flight meshes
    if (_strafeDesig)  { _scene.remove(_strafeDesig);  _strafeDesig  = null; }
    if (_strafeAircraft) { _removeGroup(_strafeAircraft); _strafeAircraft = null; }
    if (_bombMarker)   { _scene.remove(_bombMarker);   _bombMarker   = null; }
    if (_bombAircraft) { _removeGroup(_bombAircraft);  _bombAircraft = null; }
    if (_napalmSmoke)  { _scene.remove(_napalmSmoke);  _napalmSmoke  = null; }
    if (_napalmStrip)  {
      _scene.remove(_napalmStrip);
      if (_napalmStrip.geometry) _napalmStrip.geometry.dispose();
      if (_napalmStrip.material) _napalmStrip.material.dispose();
      _napalmStrip = null;
    }
    if (_napalmBomber) { _removeGroup(_napalmBomber);  _napalmBomber = null; }
    _cleanupEvac();

    // bombs in air
    for (var i = 0; i < _bombs.length; i++) {
      _scene.remove(_bombs[i].mesh);
      if (_bombs[i].mesh.geometry) _bombs[i].mesh.geometry.dispose();
      if (_bombs[i].mesh.material) _bombs[i].mesh.material.dispose();
    }
    _bombs = [];

    // clear all particle lists
    function _clearList(list) {
      for (var li = 0; li < list.length; li++) {
        try { _scene.remove(list[li].mesh); } catch (e) {}
        try { if (list[li].mesh && list[li].mesh.geometry) list[li].mesh.geometry.dispose(); } catch (e) {}
        try { if (list[li].mat) list[li].mat.dispose(); } catch (e) {}
      }
      list.length = 0;
    }
    _clearList(_strafeExplosions);
    _clearList(_bombExplosions);
    _clearList(_smokeParticles);
    _clearList(_bombDustClouds);
    _clearList(_strafeContrail);
    _clearList(_bombContrail);
    _clearList(_napalmContrail);

    // reset state
    _phase      = 'idle';
    _phaseTimer = 0;
    _cooldown   = 0;
    _tokens     = 0;
    _killCounter = 0;
    _napalmClickCount = 0;
    _napalmStart = null;
    _napalmEnd   = null;
    _evacuated   = false;
    _targetPos   = null;
    _selectedOption = -1;
    if (_menuOpen) _closeMenu();
    _updateHUD();
  }

  return {
    init:            init,
    update:          update,
    addToken:        addToken,
    callStrafeRun:   callStrafeRun,
    callBombRun:     callBombRun,
    reset:           reset,
    // internal hook for kill tracking (wire up from enemies system)
    _onKill:         _onKill
  };

})();
