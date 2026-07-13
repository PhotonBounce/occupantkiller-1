/* ───────────────────────────────────────────────────────────────────────────
   air-support-radio.js — Call in a gunship strafing run
   Ctrl+R  → enter targeting mode (crosshair turns orange)
   Click   → mark target on ground → 4s delay → gunship flies in and strafes
   API     : window.AirSupportRadio = { init, update, call, reset }
   Globals : window._airSupportCharges, window._airSupportCooldown
   ─────────────────────────────────────────────────────────────────────────── */
window.AirSupportRadio = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var COOLDOWN_TIME     = 90;     // seconds between uses
  var MAX_CHARGES       = 2;      // uses per life
  var DELAY_BEFORE_RUN  = 4;      // seconds from mark to arrival
  var GUNSHIP_SPEED     = 20;     // units/s
  var GUNSHIP_HEIGHT    = 12;     // Y position
  var STRAFE_LENGTH     = 20;     // units along run axis
  var BURST_COUNT       = 6;      // number of burst impacts per run
  var BURST_DAMAGE      = 50;     // normal hit damage
  var DIRECT_HIT_DAMAGE = 80;     // damage for targets very close to burst
  var HIT_RADIUS        = 5;      // units radius for normal damage
  var DIRECT_RADIUS     = 1.5;    // units radius for direct hit
  var SMOKE_INTERVAL    = 0.5;    // seconds between smoke puffs
  var SMOKE_LIFE        = 4;      // seconds for trail smoke to fade
  var MAP_HALF          = 120;    // half-width of map (gunship enters at edge)

  /* ── state ──────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;

  var _charges           = MAX_CHARGES;
  var _cooldownRemaining = 0;

  var _targeting     = false;   // waiting for player click
  var _pending       = false;   // 4s countdown before gunship arrives
  var _pendingTimer  = 0;
  var _pendingTarget = null;    // { x, z }  ground target

  /* gunship run state */
  var _running       = false;
  var _gunship       = null;    // THREE.Mesh
  var _gunshipDir    = null;    // THREE.Vector3  normalised fly direction
  var _gunshipStart  = null;    // THREE.Vector3  spawn point
  var _gunshipEnd    = null;    // THREE.Vector3  exit point
  var _runElapsed    = 0;
  var _runTotal      = 0;       // total flight time for this run (seconds)

  /* strafing bookkeeping */
  var _burstsFired   = 0;
  var _burstSpacing  = 0;       // seconds between each burst
  var _nextBurstAt   = 0;       // seconds into flight at which next burst fires

  /* smoke trail */
  var _smokeTimer    = 0;

  /* scene objects */
  var _tracers    = [];   // { mesh, mat, t, life, vx, vy, vz }
  var _explosions = [];   // { mesh, mat, t, life, grow, vx, vy, vz }
  var _smoke      = [];   // { mesh, mat, t, life }  (both trail & ground)
  var _scorches   = [];   // { mesh, mat, t, life }
  var _flashes    = [];   // { light, t, life }

  /* HUD elements */
  var _badge         = null;
  var _targetOverlay = null;  // "SELECT TARGET" fullscreen overlay
  var _countdownEl   = null;  // arrival countdown

  /* global exports */
  window._airSupportCharges  = _charges;
  window._airSupportCooldown = _cooldownRemaining;

  /* ── audio helpers ─────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    return window._audioCtx ||
      (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
  }

  /* Band-pass noise — engine roar fade-in / fade-out */
  function _playEngineRoar(fadeDuration) {
    try {
      var ctx = _getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      var dur = fadeDuration || 3;
      var bufLen = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      /* Low-pass at 200 Hz simulates distant engine rumble */
      var lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 200;
      /* Band-pass 200-2000 Hz for engine character */
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 600;
      bpf.Q.value = 0.5;
      src.connect(lpf);
      lpf.connect(bpf);
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + dur * 0.3);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + dur * 0.7);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + dur);
    } catch (e) { /* silent */ }
  }

  /* Minigun buzz during strafing */
  function _playMinigunBuzz() {
    try {
      var ctx = _getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      var now = ctx.currentTime;
      /* Sawtooth at ~30 Hz gives mechanical spin sound */
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(30, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      /* White noise layer */
      var bufLen = Math.floor(ctx.sampleRate * 0.6);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      var nSrc = ctx.createBufferSource();
      nSrc.buffer = buf;
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 800;
      bpf.Q.value = 1;
      nSrc.connect(bpf);
      var g1 = ctx.createGain();
      g1.gain.setValueAtTime(0.22, now);
      g1.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.connect(g1);
      bpf.connect(g1);
      g1.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
      nSrc.start(now);
      nSrc.stop(now + 0.6);
    } catch (e) { /* silent */ }
  }

  /* Radio chatter: "Alpha 1 inbound…" tones */
  function _playRadioChatter() {
    try {
      var ctx = _getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      var now = ctx.currentTime;
      /* Static burst */
      var bufLen = Math.floor(ctx.sampleRate * 0.5);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
      var nSrc = ctx.createBufferSource();
      nSrc.buffer = buf;
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 2;
      nSrc.connect(bpf);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.3, now);
      g.gain.linearRampToValueAtTime(0, now + 0.5);
      bpf.connect(g);
      g.connect(ctx.destination);
      nSrc.start(now);
      nSrc.stop(now + 0.5);
      /* Beep tones simulating voice-encoded chatter */
      var freqs = [880, 660, 770, 550, 660];
      for (var fi = 0; fi < freqs.length; fi++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          var og = ctx.createGain();
          og.gain.setValueAtTime(0, now + delay);
          og.gain.linearRampToValueAtTime(0.08, now + delay + 0.02);
          og.gain.linearRampToValueAtTime(0, now + delay + 0.1);
          osc.connect(og);
          og.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.15);
        })(freqs[fi], 0.05 + fi * 0.12);
      }
    } catch (e) { /* silent */ }
  }

  /* Impact boom for each burst */
  function _playBurstBoom() {
    try {
      var ctx = _getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(18, now + 0.5);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.55, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) { /* silent */ }
  }

  /* ── HUD helpers ─────────────────────────────────────────────────────────  */
  function _createBadge() {
    if (_badge) return;
    _badge = document.createElement('div');
    _badge.id = 'air-support-badge';
    _badge.style.cssText = [
      'position:fixed',
      'top:60px',
      'right:12px',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid rgba(255,140,0,0.7)',
      'color:#ff8c00',
      'padding:3px 10px',
      'border-radius:4px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:220',
      'pointer-events:none',
      'letter-spacing:1px',
    ].join(';');
    document.body.appendChild(_badge);
    _updateBadge();
  }

  function _updateBadge() {
    if (!_badge) return;
    /* sync globals */
    window._airSupportCharges  = _charges;
    window._airSupportCooldown = _cooldownRemaining;

    if (_charges <= 0 && _cooldownRemaining <= 0) {
      _badge.textContent = '📻 AIR SUPPORT \xD70';
      _badge.style.color = '#666';
      _badge.style.borderColor = 'rgba(100,100,100,0.4)';
    } else if (_cooldownRemaining > 0) {
      _badge.textContent = '📻 AIR SUPPORT \xD7' + _charges + ' [' + Math.ceil(_cooldownRemaining) + 's]';
      _badge.style.color = '#ffaa44';
      _badge.style.borderColor = 'rgba(255,170,68,0.5)';
    } else {
      _badge.textContent = '📻 AIR SUPPORT \xD7' + _charges;
      _badge.style.color = '#ff8c00';
      _badge.style.borderColor = 'rgba(255,140,0,0.7)';
    }
  }

  function _createTargetOverlay() {
    if (_targetOverlay) return;
    _targetOverlay = document.createElement('div');
    _targetOverlay.id = 'air-support-target-overlay';
    _targetOverlay.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'display:none',
      'pointer-events:none',
      'z-index:225',
      'border:3px solid rgba(255,140,0,0.6)',
    ].join(';');
    /* Center label */
    var label = document.createElement('div');
    label.style.cssText = [
      'position:absolute',
      'top:50%','left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff8c00',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'letter-spacing:3px',
      'text-shadow:0 0 10px rgba(255,140,0,0.8)',
      'pointer-events:none',
    ].join(';');
    label.textContent = 'SELECT TARGET';
    _targetOverlay.appendChild(label);
    /* Orange crosshair lines */
    var lineH = document.createElement('div');
    lineH.style.cssText = 'position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,140,0,0.4);transform:translateY(-50%)';
    var lineV = document.createElement('div');
    lineV.style.cssText = 'position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,140,0,0.4);transform:translateX(-50%)';
    _targetOverlay.appendChild(lineH);
    _targetOverlay.appendChild(lineV);
    document.body.appendChild(_targetOverlay);
  }

  function _createCountdownEl() {
    if (_countdownEl) return;
    _countdownEl = document.createElement('div');
    _countdownEl.id = 'air-support-countdown';
    _countdownEl.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'display:none',
      'color:#ff8c00',
      'font-size:22px',
      'font-family:monospace',
      'font-weight:bold',
      'z-index:230',
      'pointer-events:none',
      'text-shadow:0 0 14px rgba(255,140,0,0.8)',
      'letter-spacing:2px',
    ].join(';');
    document.body.appendChild(_countdownEl);
  }

  function _showCountdown(text) {
    if (!_countdownEl) return;
    if (!text) {
      _countdownEl.style.display = 'none';
      return;
    }
    _countdownEl.style.display = 'block';
    _countdownEl.textContent = text;
  }

  /* ── Targeting mode ──────────────────────────────────────────────────────  */
  function _enterTargetMode() {
    _targeting = true;
    /* Turn crosshair orange via CSS variable or class */
    if (_canvas) {
      _canvas.style.outline = '3px solid #ff8c00';
      _canvas.style.cursor  = 'crosshair';
    }
    /* Show the target-selection overlay */
    if (_targetOverlay) _targetOverlay.style.display = 'block';
    _showToast('AIR SUPPORT — SELECT TARGET (Click)');
  }

  function _exitTargetMode() {
    _targeting = false;
    if (_canvas) {
      _canvas.style.outline = '';
      _canvas.style.cursor  = '';
    }
    if (_targetOverlay) _targetOverlay.style.display = 'none';
  }

  /* ── Toast helper ────────────────────────────────────────────────────────  */
  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else if (window.HUD && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg);
    }
  }

  /* ── Raycast ground click ────────────────────────────────────────────────  */
  function _groundPosFromClick(event) {
    if (typeof THREE === 'undefined') return null;
    var rect = _canvas
      ? _canvas.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var nx = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
    var ny = -((event.clientY - rect.top)  / rect.height) *  2 + 1;
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: nx, y: ny }, _camera);
    var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var target = new THREE.Vector3();
    var hit = raycaster.ray.intersectPlane(groundPlane, target);
    if (hit) return { x: target.x, z: target.z };
    /* Fallback: project forward */
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    return { x: _camera.position.x + dir.x * 40, z: _camera.position.z + dir.z * 40 };
  }

  /* ── Build gunship mesh ──────────────────────────────────────────────────  */
  function _buildGunship() {
    if (typeof THREE === 'undefined') return null;
    /* Fuselage: BoxGeometry(3, 0.8, 1.5), olive-green */
    var geo  = new THREE.BoxGeometry(3, 0.8, 1.5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x4a5c2e });
    var mesh = new THREE.Mesh(geo, mat);
    /* Wing stubs */
    var wGeo  = new THREE.BoxGeometry(1.8, 0.12, 0.4);
    var wMat  = new THREE.MeshLambertMaterial({ color: 0x3d4d25 });
    var wingL = new THREE.Mesh(wGeo, wMat);
    wingL.position.set(-1.5, -0.1, 0);
    var wingR = new THREE.Mesh(wGeo, wMat);
    wingR.position.set(1.5, -0.1, 0);
    mesh.add(wingL);
    mesh.add(wingR);
    /* Tail */
    var tGeo  = new THREE.BoxGeometry(0.5, 0.5, 0.2);
    var tMat  = new THREE.MeshLambertMaterial({ color: 0x3d4d25 });
    var tail  = new THREE.Mesh(tGeo, tMat);
    tail.position.set(0, 0.3, -0.6);
    mesh.add(tail);
    return mesh;
  }

  /* ── Launch gunship run ──────────────────────────────────────────────────  */
  function _startGunshipRun(targetX, targetZ) {
    if (typeof THREE === 'undefined' || !_scene) return;

    /* Choose a random cardinal axis for the strafing run */
    var angle = Math.random() * Math.PI * 2;
    var dx = Math.cos(angle);
    var dz = Math.sin(angle);

    /* Entry point: MAP_HALF units behind target along run axis */
    var startX = targetX - dx * MAP_HALF;
    var startZ = targetZ - dz * MAP_HALF;
    var endX   = targetX + dx * MAP_HALF;
    var endZ   = targetZ + dz * MAP_HALF;

    _gunshipStart = new THREE.Vector3(startX, GUNSHIP_HEIGHT, startZ);
    _gunshipEnd   = new THREE.Vector3(endX,   GUNSHIP_HEIGHT, endZ);
    _gunshipDir   = new THREE.Vector3(dx, 0, dz).normalize();

    /* Build mesh */
    _gunship = _buildGunship();
    if (_gunship) {
      _gunship.position.copy(_gunshipStart);
      /* Orient gunship along flight direction */
      _gunship.rotation.y = Math.atan2(-dz, dx) - Math.PI / 2;
      _scene.add(_gunship);
    }

    /* Calculate total run time and burst spacing */
    var totalDist = _gunshipStart.distanceTo(_gunshipEnd);
    _runTotal    = totalDist / GUNSHIP_SPEED;
    _runElapsed  = 0;
    _burstsFired = 0;
    _smokeTimer  = 0;

    /* Bursts fire symmetrically around the target, from -10 to +10 along run */
    /* First burst at just before the target offset, spaced evenly */
    _burstSpacing = STRAFE_LENGTH / (BURST_COUNT - 1) / GUNSHIP_SPEED;
    /* Time when aircraft is directly over target */
    var distToTarget = _gunshipStart.distanceTo(new THREE.Vector3(targetX, GUNSHIP_HEIGHT, targetZ));
    var timeToTarget = distToTarget / GUNSHIP_SPEED;
    _nextBurstAt = timeToTarget - (BURST_COUNT / 2) * _burstSpacing;
    if (_nextBurstAt < 0) _nextBurstAt = 0;

    _running = true;
    _playEngineRoar(_runTotal);
    _showCountdown('ALPHA 1 INBOUND...');
  }

  /* ── Fire a single burst impact ─────────────────────────────────────────  */
  function _fireBurst(px, pz) {
    if (!_scene) return;

    _playMinigunBuzz();
    _playBurstBoom();

    /* Yellow tracer sphere falling to ground */
    var tGeo = new THREE.SphereGeometry(0.15, 6, 4);
    var tMat = new THREE.MeshBasicMaterial({ color: 0xffee00 });
    var tMesh = new THREE.Mesh(tGeo, tMat);
    tMesh.position.set(px, GUNSHIP_HEIGHT - 0.5, pz);
    _scene.add(tMesh);
    _tracers.push({
      mesh: tMesh, mat: tMat,
      t: 0, life: 0.4,
      vx: 0, vy: -GUNSHIP_HEIGHT / 0.4, vz: 0,
    });

    /* Schedule ground impact effects after tracer travel time */
    var impactDelay = 0.4;
    var captureScene = _scene;
    setTimeout(function () {
      _doGroundImpact(px, pz);
    }, impactDelay * 1000);
  }

  /* ── Ground impact VFX + damage ─────────────────────────────────────────  */
  function _doGroundImpact(px, pz) {
    if (!_scene) return;

    /* Orange flash sphere */
    var fGeo = new THREE.SphereGeometry(1.2, 8, 6);
    var fMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var fMesh = new THREE.Mesh(fGeo, fMat);
    fMesh.position.set(px, 0.6, pz);
    _scene.add(fMesh);
    _explosions.push({
      mesh: fMesh, mat: fMat,
      t: 0, life: 0.5,
      grow: 5,
      vx: 0, vy: 2, vz: 0,
    });

    /* Debris particles */
    for (var di = 0; di < 5; di++) {
      var dGeo = new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 4, 3);
      var dMat = new THREE.MeshLambertMaterial({ color: 0x3a3020 });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(px, 0.3, pz);
      var da = Math.random() * Math.PI * 2;
      _scene.add(dMesh);
      _explosions.push({
        mesh: dMesh, mat: dMat,
        t: 0, life: 1.0 + Math.random() * 0.6,
        grow: 0,
        vx: Math.cos(da) * (3 + Math.random() * 4),
        vy: 3 + Math.random() * 5,
        vz: Math.sin(da) * (3 + Math.random() * 4),
      });
    }

    /* Smoke sphere — dark grey, fades over 2s */
    var sGeo = new THREE.SphereGeometry(0.9 + Math.random() * 0.4, 6, 4);
    var sMat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.55 });
    var sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.set(px + (Math.random() - 0.5) * 0.6, 0.7, pz + (Math.random() - 0.5) * 0.6);
    _scene.add(sMesh);
    _smoke.push({ mesh: sMesh, mat: sMat, t: 0, life: 2.0, isTrail: false });

    /* Scorch mark */
    var cGeo = new THREE.CircleGeometry(1.4, 16);
    var cMat = new THREE.MeshBasicMaterial({ color: 0x1a1200, transparent: true, opacity: 0.8 });
    var cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.rotation.x = -Math.PI / 2;
    cMesh.position.set(px, 0.02, pz);
    _scene.add(cMesh);
    _scorches.push({ mesh: cMesh, mat: cMat, t: 0, life: 25 });

    /* Point-light flash */
    if (typeof THREE !== 'undefined' && THREE.PointLight) {
      var fl = new THREE.PointLight(0xff6600, 12, 15);
      fl.position.set(px, 1, pz);
      _scene.add(fl);
      _flashes.push({ light: fl, t: 0, life: 0.3 });
    }

    /* Damage enemies */
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en || en.dead || en.alive === false) continue;
      var ep = en.position || (en.mesh && en.mesh.position);
      if (!ep) continue;
      var ddx = ep.x - px;
      var ddz = ep.z - pz;
      var dist = Math.sqrt(ddx * ddx + ddz * ddz);
      var dmg = 0;
      if (dist <= DIRECT_RADIUS)     dmg = DIRECT_HIT_DAMAGE;
      else if (dist <= HIT_RADIUS)   dmg = BURST_DAMAGE;
      if (dmg > 0) {
        if (en.takeDamage)           en.takeDamage(dmg);
        else if (en.health !== undefined) {
          en.health -= dmg;
          if (en.health <= 0 && !en.dead) en.dead = true;
        }
      }
    }
  }

  /* ── Smoke trail puff ────────────────────────────────────────────────────  */
  function _spawnTrailSmoke(pos) {
    if (!_scene || typeof THREE === 'undefined') return;
    var sGeo = new THREE.SphereGeometry(0.3, 5, 3);
    var sMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.45 });
    var sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.set(pos.x, GUNSHIP_HEIGHT, pos.z);
    _scene.add(sMesh);
    _smoke.push({
      mesh: sMesh, mat: sMat,
      t: 0, life: SMOKE_LIFE,
      isTrail: true,
      /* Drift gently upward + sideways */
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0.4 + Math.random() * 0.4,
      vz: (Math.random() - 0.5) * 1.5,
    });
  }

  /* ── Click handler ───────────────────────────────────────────────────────  */
  function _onClick(event) {
    if (!_targeting) return;
    _exitTargetMode();
    var gPos = _groundPosFromClick(event);
    if (!gPos) return;

    _pending       = true;
    _pendingTarget = gPos;
    _pendingTimer  = DELAY_BEFORE_RUN;
    _showCountdown('ALPHA 1 INBOUND ' + Math.ceil(_pendingTimer) + 's...');
    _playRadioChatter();
    _showToast('Air support called — Alpha 1 inbound in ' + DELAY_BEFORE_RUN + 's');
  }

  /* ── Key handler ─────────────────────────────────────────────────────────  */
  function _onKeyDown(event) {
    if (event.ctrlKey && event.code === 'KeyR') {
      event.preventDefault();
      call();
    }
  }

  /* ── Public: call() ──────────────────────────────────────────────────────  */
  function call() {
    if (_charges <= 0) {
      _showToast('NO AIR SUPPORT REMAINING');
      return;
    }
    if (_cooldownRemaining > 0) {
      _showToast('AIR SUPPORT COOLDOWN: ' + Math.ceil(_cooldownRemaining) + 's');
      return;
    }
    if (_targeting || _pending || _running) return;
    _enterTargetMode();
  }

  /* ── Public: init(scene, camera) ─────────────────────────────────────────  */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    /* Grab renderer canvas */
    var canvases = document.querySelectorAll('canvas');
    for (var ci = 0; ci < canvases.length; ci++) {
      if (canvases[ci].id !== 'minimap-canvas') { _canvas = canvases[ci]; break; }
    }

    _createBadge();
    _createTargetOverlay();
    _createCountdownEl();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('click',   _onClick,   false);
  }

  /* ── Public: update(delta) ───────────────────────────────────────────────  */
  function update(delta) {
    if (!delta || delta <= 0) return;

    /* Cooldown */
    if (_cooldownRemaining > 0) {
      _cooldownRemaining -= delta;
      if (_cooldownRemaining < 0) _cooldownRemaining = 0;
      _updateBadge();
    }

    /* Pre-arrival countdown */
    if (_pending) {
      _pendingTimer -= delta;
      if (_pendingTimer > 0) {
        _showCountdown('ALPHA 1 INBOUND ' + Math.ceil(_pendingTimer) + 's...');
      } else {
        _pending = false;
        _showCountdown('');
        _charges--;
        _cooldownRemaining = COOLDOWN_TIME;
        _updateBadge();
        _startGunshipRun(_pendingTarget.x, _pendingTarget.z);
        _pendingTarget = null;
      }
    }

    /* Gunship run */
    if (_running && _gunship) {
      _runElapsed += delta;
      var t = _runElapsed / _runTotal;

      if (t >= 1) {
        /* Gunship exits — clean up */
        _scene.remove(_gunship);
        /* Dispose gunship children geometries/materials */
        _gunship.traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        _gunship = null;
        _running = false;
        _showCountdown('');
        _showToast('Gunship RTB');
      } else {
        /* Move gunship */
        var gx = _gunshipStart.x + (_gunshipEnd.x - _gunshipStart.x) * t;
        var gz = _gunshipStart.z + (_gunshipEnd.z - _gunshipStart.z) * t;
        _gunship.position.set(gx, GUNSHIP_HEIGHT, gz);

        /* Show countdown label during strafe */
        if (_burstsFired < BURST_COUNT) {
          _showCountdown('STRAFING RUN');
        } else {
          _showCountdown('GUNSHIP RTB');
        }

        /* Smoke trail puffs */
        _smokeTimer += delta;
        if (_smokeTimer >= SMOKE_INTERVAL) {
          _smokeTimer = 0;
          _spawnTrailSmoke(_gunship.position);
        }

        /* Fire bursts */
        if (_burstsFired < BURST_COUNT && _runElapsed >= _nextBurstAt) {
          var bx = gx;
          var bz = gz;
          _fireBurst(bx, bz);
          _burstsFired++;
          _nextBurstAt += _burstSpacing;
        }
      }
    }

    /* Animate tracers */
    for (var ti = _tracers.length - 1; ti >= 0; ti--) {
      var tr = _tracers[ti];
      tr.t += delta;
      var tk = tr.t / tr.life;
      if (tk >= 1) {
        if (_scene) _scene.remove(tr.mesh);
        if (tr.mesh.geometry) tr.mesh.geometry.dispose();
        if (tr.mat) tr.mat.dispose();
        _tracers.splice(ti, 1);
        continue;
      }
      tr.mesh.position.x += tr.vx * delta;
      tr.mesh.position.y += tr.vy * delta;
      tr.mesh.position.z += tr.vz * delta;
    }

    /* Animate explosions / debris */
    for (var xi = _explosions.length - 1; xi >= 0; xi--) {
      var ex = _explosions[xi];
      ex.t += delta;
      var xk = ex.t / ex.life;
      if (xk >= 1) {
        if (_scene) _scene.remove(ex.mesh);
        if (ex.mesh.geometry) ex.mesh.geometry.dispose();
        if (ex.mat) ex.mat.dispose();
        _explosions.splice(xi, 1);
        continue;
      }
      ex.mesh.position.x += ex.vx * delta;
      ex.mesh.position.y += ex.vy * delta;
      ex.mesh.position.z += ex.vz * delta;
      ex.vy -= 9.8 * delta;
      if (ex.mesh.position.y < 0) { ex.mesh.position.y = 0; ex.vy *= -0.15; }
      if (ex.grow > 0) {
        var es = 1 + xk * ex.grow;
        ex.mesh.scale.set(es, es, es);
      }
      if (ex.mat.opacity !== undefined) {
        ex.mat.opacity = (ex.grow > 0 ? 0.9 : 1.0) * (1 - xk);
      }
    }

    /* Animate smoke (trail + ground) */
    for (var si = _smoke.length - 1; si >= 0; si--) {
      var sm = _smoke[si];
      sm.t += delta;
      var sk = sm.t / sm.life;
      if (sk >= 1) {
        if (_scene) _scene.remove(sm.mesh);
        if (sm.mesh.geometry) sm.mesh.geometry.dispose();
        if (sm.mat) sm.mat.dispose();
        _smoke.splice(si, 1);
        continue;
      }
      if (sm.isTrail) {
        sm.mesh.position.x += (sm.vx || 0) * delta;
        sm.mesh.position.y += (sm.vy || 0) * delta;
        sm.mesh.position.z += (sm.vz || 0) * delta;
      } else {
        /* Ground smoke rises slightly */
        sm.mesh.position.y += 0.5 * delta;
      }
      sm.mat.opacity = (sm.isTrail ? 0.45 : 0.55) * (1 - sk);
      /* Expand slightly */
      var ss = 1 + sk * 1.5;
      sm.mesh.scale.set(ss, ss, ss);
    }

    /* Fade scorch marks */
    for (var chi = _scorches.length - 1; chi >= 0; chi--) {
      var sc = _scorches[chi];
      sc.t += delta;
      var fadeStart = sc.life - 3;
      if (sc.t > fadeStart) {
        var fk = (sc.t - fadeStart) / 3;
        sc.mat.opacity = 0.8 * (1 - fk);
      }
      if (sc.t >= sc.life) {
        if (_scene) _scene.remove(sc.mesh);
        if (sc.mesh.geometry) sc.mesh.geometry.dispose();
        if (sc.mat) sc.mat.dispose();
        _scorches.splice(chi, 1);
      }
    }

    /* Flash lights */
    for (var fli = _flashes.length - 1; fli >= 0; fli--) {
      var fl = _flashes[fli];
      fl.t += delta;
      var flk = fl.t / fl.life;
      if (flk >= 1) {
        if (_scene) _scene.remove(fl.light);
        if (fl.light.dispose) fl.light.dispose();
        _flashes.splice(fli, 1);
        continue;
      }
      fl.light.intensity = 12 * (1 - flk);
    }
  }

  /* ── Cleanup helper ─────────────────────────────────────────────────────  */
  function _cleanArray(arr) {
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      if (_scene) {
        if (obj.mesh)  _scene.remove(obj.mesh);
        if (obj.light) _scene.remove(obj.light);
      }
      if (obj.mesh && obj.mesh.geometry) obj.mesh.geometry.dispose();
      if (obj.mat)  obj.mat.dispose();
      if (obj.light && obj.light.dispose) obj.light.dispose();
    }
    arr.length = 0;
  }

  /* ── Public: reset() ─────────────────────────────────────────────────────  */
  function reset() {
    _exitTargetMode();
    _pending      = false;
    _pendingTimer = 0;
    _pendingTarget = null;
    _showCountdown('');

    /* Remove gunship */
    if (_gunship && _scene) {
      _scene.remove(_gunship);
      _gunship.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      _gunship = null;
    }
    _running     = false;
    _runElapsed  = 0;
    _burstsFired = 0;

    _cleanArray(_tracers);
    _cleanArray(_explosions);
    _cleanArray(_smoke);
    _cleanArray(_scorches);
    _cleanArray(_flashes);

    _charges           = MAX_CHARGES;
    _cooldownRemaining = 0;
    _updateBadge();

    window._airSupportCharges  = _charges;
    window._airSupportCooldown = _cooldownRemaining;
  }

  return { init: init, update: update, call: call, reset: reset };
})();
