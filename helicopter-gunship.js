// ============================================================
//  helicopter-gunship.js — Pilotable Attack Helicopter
//
//  Controls (while piloting):
//    H     = enter (when within 3 units)
//    E     = exit
//    WASD  = forward/back/strafe
//    Q     = ascend
//    E     = descend (when flying; E exits when grounded/low speed)
//    Mouse = yaw rotation
//    LMB   = minigun burst (800 RPM, 20 dmg, 500 rounds)
//    RMB   = rocket pod (50 dmg, 6m blast, 8 rockets, 10s reload)
//    Tab   = cycle weapon mode
//    L     = toggle searchlight
//
//  Public API: { init(scene, camera), update(dt), spawnAt(x, y, z), reset }
// ============================================================
window.HelicopterGunship = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────
  var _scene = null, _gameCam = null;
  var _bound = false;
  var _heli = null;       // { group, fuselage, rotor, tailRotor, spotLight, hp, ... }
  var _active = false;    // player is piloting
  var _chaseCam = null;

  // Physics
  var _vx = 0, _vy = 0, _vz = 0;
  var _yaw = 0;
  var _mouseDX = 0;
  var _engineOn = false;
  var _startupTimer = 0;
  var _rotorSpeed = 0;    // current rotor spin speed (rad/s), max ~20
  var ROTOR_MAX = 20;

  // Weapons
  var _minigunAmmo = 500;
  var _rocketAmmo = 8;
  var _rocketCooldown = 0;
  var _minigunCool = 0;
  var MINIGUN_INTERVAL = 60 / 800; // 800 RPM in seconds
  var _firingMinigun = false;
  var _firingRocket = false;
  var _weaponMode = 0;    // 0=minigun, 1=rockets
  var _tracers = [];
  var _rockets = [];
  var _smokeParticles = [];
  var _fireParticles = [];

  // HUD
  var _hudEl = null;
  var _horizonCanvas = null, _horizonCtx = null;

  // Audio
  var _audioCtx = null;
  var _engineOsc = null;
  var _engineMod = null;
  var _engineGain = null;
  var _engineModGain = null;

  // Searchlight
  var _searchlightOn = false;

  // HP
  var HP_MAX = 300;
  var _hp = HP_MAX;

  // Input
  var _key = { w: false, s: false, a: false, d: false, q: false, e_alt: false };

  // Gravity / physics constants
  var GRAVITY = 4;
  var MAX_SPEED = 18;
  var ACCEL = 12;
  var FRICTION = 3.5;
  var YAW_RATE = 1.4; // rad/s per mouse delta unit

  // Spawn position
  var _spawnPos = { x: 0, y: 0, z: 0 };

  // ── Materials (shared) ───────────────────────────────────
  var _matOlive = null;
  var _matDarkOlive = null;
  var _matGlass = null;
  var _matBlack = null;
  var _matRed = null;
  var _matOrange = null;

  function _initMats() {
    if (_matOlive) return;
    _matOlive = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    _matDarkOlive = new THREE.MeshLambertMaterial({ color: 0x3b4a1f });
    _matGlass = new THREE.MeshLambertMaterial({ color: 0x88ccee, transparent: true, opacity: 0.45 });
    _matBlack = new THREE.MeshLambertMaterial({ color: 0x111111 });
    _matRed = new THREE.MeshLambertMaterial({ color: 0xff2200 });
    _matOrange = new THREE.MeshLambertMaterial({ color: 0xff6600 });
  }

  // ── Build Helicopter Mesh ────────────────────────────────
  function _build() {
    _initMats();
    var g = new THREE.Group();

    // Fuselage 3×1×1.2
    var fuselage = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.2), _matOlive);
    fuselage.position.set(0, 0, 0);
    g.add(fuselage);

    // Cockpit bubble — SphereGeometry 0.7, tinted glass
    var cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), _matGlass);
    cockpit.position.set(-1.1, 0.05, 0);
    cockpit.scale.set(1, 0.85, 1);
    g.add(cockpit);

    // Cockpit frame (thin olive strip)
    var cockpitRim = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 1.15), _matOlive);
    cockpitRim.position.set(-0.7, 0.05, 0);
    g.add(cockpitRim);

    // Tail boom 0.2×0.2×2, extending back
    var tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), _matOlive);
    tailBoom.position.set(0, 0.05, 1.6);
    g.add(tailBoom);

    // Tail fin (vertical stabilizer)
    var tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.5), _matDarkOlive);
    tailFin.position.set(0, 0.35, 2.4);
    g.add(tailFin);

    // Horizontal stabilizer
    var hStab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.25), _matDarkOlive);
    hStab.position.set(0, 0.15, 2.55);
    g.add(hStab);

    // Landing skids
    var skidMat = _matBlack;
    // Left skid
    var skidLBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.07), skidMat);
    skidLBar.position.set(0, -0.6, -0.4);
    g.add(skidLBar);
    var skidLFront = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.07), skidMat);
    skidLFront.position.set(-0.9, -0.38, -0.4);
    g.add(skidLFront);
    var skidLRear = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.07), skidMat);
    skidLRear.position.set(0.6, -0.38, -0.4);
    g.add(skidLRear);
    // Right skid
    var skidRBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.07), skidMat);
    skidRBar.position.set(0, -0.6, 0.4);
    g.add(skidRBar);
    var skidRFront = skidLFront.clone();
    skidRFront.position.z = 0.4;
    g.add(skidRFront);
    var skidRRear = skidLRear.clone();
    skidRRear.position.z = 0.4;
    g.add(skidRRear);

    // Main rotor hub
    var rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8), _matBlack);
    rotorHub.position.set(0, 0.65, 0);
    g.add(rotorHub);

    // Main rotor group (4 blades, 3 units long each)
    var rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 0.68, 0);
    g.add(rotorGroup);

    var bladeMat = _matDarkOlive;
    for (var i = 0; i < 4; i++) {
      var blade = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.2), bladeMat);
      blade.rotation.y = (i / 4) * Math.PI * 2;
      rotorGroup.add(blade);
    }

    // Tail rotor group (2 blades, 0.5 units)
    var tailRotorGroup = new THREE.Group();
    tailRotorGroup.position.set(0.12, 0.12, 2.55);
    g.add(tailRotorGroup);

    for (var j = 0; j < 2; j++) {
      var tBlade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.06), bladeMat);
      tBlade.rotation.z = (j / 2) * Math.PI;
      tailRotorGroup.add(tBlade);
    }

    // Minigun stub (left side forward)
    var minigunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), _matBlack);
    minigunBarrel.rotation.z = Math.PI / 2;
    minigunBarrel.position.set(-1.4, -0.18, -0.3);
    g.add(minigunBarrel);

    // Rocket pod (right side)
    var rocketPodBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.75), _matDarkOlive);
    rocketPodBody.position.set(0.6, -0.22, -0.5);
    g.add(rocketPodBody);
    for (var r = 0; r < 4; r++) {
      var rTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), _matBlack);
      rTube.rotation.z = Math.PI / 2;
      rTube.position.set(-0.35 - r * 0.01, -0.22 + (r % 2 === 0 ? 0.07 : -0.07), -0.5 + (r < 2 ? 0.12 : -0.12));
      g.add(rTube);
    }

    // Searchlight (SpotLight, pointing down)
    var spotLight = new THREE.SpotLight(0xffffcc, 0, 20, Math.PI / 6, 0.3, 1.5);
    spotLight.position.set(0, -0.6, -0.5);
    spotLight.target.position.set(0, -20, -0.5);
    g.add(spotLight);
    g.add(spotLight.target);

    // Ambient point light on helicopter (dim, so it's visible)
    var selfLight = new THREE.PointLight(0x556b2f, 0.3, 8);
    selfLight.position.set(0, 0, 0);
    g.add(selfLight);

    g.castShadow = false;
    g.receiveShadow = false;

    return {
      group: g,
      fuselage: fuselage,
      rotorGroup: rotorGroup,
      tailRotorGroup: tailRotorGroup,
      spotLight: spotLight,
      selfLight: selfLight
    };
  }

  // ── Audio ────────────────────────────────────────────────
  function _startAudio() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
      }
      if (_engineOsc) return; // already running

      _engineGain = _audioCtx.createGain();
      _engineGain.gain.value = 0.0;
      _engineGain.connect(_audioCtx.destination);

      _engineOsc = _audioCtx.createOscillator();
      _engineOsc.type = 'sawtooth';
      _engineOsc.frequency.value = 80;
      _engineOsc.connect(_engineGain);
      _engineOsc.start();

      // 25Hz modulation
      _engineModGain = _audioCtx.createGain();
      _engineModGain.gain.value = 0;
      _engineMod = _audioCtx.createOscillator();
      _engineMod.type = 'sine';
      _engineMod.frequency.value = 25;
      _engineMod.connect(_engineModGain);
      _engineModGain.connect(_engineOsc.frequency);
      _engineMod.start();
    } catch (e) {}
  }

  function _stopAudio() {
    try {
      if (_engineGain) {
        _engineGain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.3);
      }
      setTimeout(function () {
        try {
          if (_engineOsc) { _engineOsc.stop(); _engineOsc = null; }
          if (_engineMod) { _engineMod.stop(); _engineMod = null; }
        } catch (e2) {}
      }, 500);
    } catch (e) {}
  }

  function _updateAudio(throttle) {
    try {
      if (!_audioCtx || !_engineOsc || !_engineGain) return;
      var t = _audioCtx.currentTime;
      var freq = 180 + throttle * 120; // 180–300 Hz
      _engineOsc.frequency.setTargetAtTime(freq, t, 0.1);
      var vol = 0.08 + throttle * 0.12;
      _engineGain.gain.setTargetAtTime(vol, t, 0.15);
      if (_engineModGain) {
        _engineModGain.gain.setTargetAtTime(throttle * 18, t, 0.1);
      }
    } catch (e) {}
  }

  function _playStartupSound() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      var g2 = _audioCtx.createGain();
      g2.gain.value = 0.06;
      g2.connect(_audioCtx.destination);
      var osc = _audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, _audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, _audioCtx.currentTime + 2);
      osc.connect(g2);
      osc.start();
      osc.stop(_audioCtx.currentTime + 2);
    } catch (e) {}
  }

  // ── HUD ─────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    var div = document.createElement('div');
    div.id = 'heli-hud';
    div.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'width:100%', 'height:100%',
      'pointer-events:none',
      'display:none',
      'z-index:200',
      'font-family:monospace'
    ].join(';');

    // Crosshair
    div.innerHTML =
      '<div id="heli-crosshair" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#00ff88;font-size:24px;font-weight:bold;text-shadow:0 0 6px #00ff88;line-height:1">+</div>' +

      // Speed / Altitude / HP readout (top left)
      '<div id="heli-readout" style="position:absolute;top:16px;left:16px;color:#aaffaa;font-size:13px;line-height:1.7;text-shadow:0 0 4px #00ff44;background:rgba(0,0,0,0.45);padding:6px 10px;border:1px solid #00aa44;border-radius:4px;">' +
        '<div>SPD: <span id="heli-spd">0</span> m/s</div>' +
        '<div>ALT: <span id="heli-alt">0</span> m</div>' +
        '<div>HP&nbsp;: <span id="heli-hp">300</span>/300</div>' +
        '<div>ENG: <span id="heli-eng">OFF</span></div>' +
      '</div>' +

      // Ammo (top right)
      '<div id="heli-ammo" style="position:absolute;top:16px;right:16px;color:#ffee88;font-size:13px;line-height:1.7;text-align:right;text-shadow:0 0 4px #ffaa00;background:rgba(0,0,0,0.45);padding:6px 10px;border:1px solid #aa7700;border-radius:4px;">' +
        '<div>MINIGUN: <span id="heli-mg-ammo">500</span> rds</div>' +
        '<div>ROCKETS: <span id="heli-rkts">8</span> / reload <span id="heli-rkt-cd">0.0</span>s</div>' +
        '<div>MODE: <span id="heli-mode">MINIGUN</span></div>' +
        '<div>SRCHLT: <span id="heli-sl">OFF</span></div>' +
      '</div>' +

      // Artificial horizon (canvas, bottom center)
      '<canvas id="heli-horizon" width="120" height="120" style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);border:1px solid #00aa44;border-radius:50%;background:rgba(0,0,0,0.5);"></canvas>';

    document.body.appendChild(div);
    _hudEl = div;

    _horizonCanvas = document.getElementById('heli-horizon');
    if (_horizonCanvas) _horizonCtx = _horizonCanvas.getContext('2d');
  }

  function _showHUD(show) {
    if (!_hudEl) _createHUD();
    if (_hudEl) _hudEl.style.display = show ? 'block' : 'none';
  }

  function _updateHUD(dt) {
    if (!_hudEl || !_active) return;

    var spd = Math.sqrt(_vx * _vx + _vz * _vz);
    var alt = _heli ? _heli.group.position.y : 0;

    var spdEl = document.getElementById('heli-spd');
    if (spdEl) spdEl.textContent = spd.toFixed(1);
    var altEl = document.getElementById('heli-alt');
    if (altEl) altEl.textContent = alt.toFixed(1);
    var hpEl = document.getElementById('heli-hp');
    if (hpEl) {
      hpEl.textContent = Math.max(0, Math.ceil(_hp));
      hpEl.style.color = _hp < HP_MAX * 0.25 ? '#ff4444' : _hp < HP_MAX * 0.5 ? '#ffaa44' : '#aaffaa';
    }
    var engEl = document.getElementById('heli-eng');
    if (engEl) engEl.textContent = _engineOn ? 'ON' : (_startupTimer > 0 ? 'STARTING' : 'OFF');

    var mgEl = document.getElementById('heli-mg-ammo');
    if (mgEl) mgEl.textContent = _minigunAmmo;
    var rkEl = document.getElementById('heli-rkts');
    if (rkEl) rkEl.textContent = _rocketAmmo;
    var rcdEl = document.getElementById('heli-rkt-cd');
    if (rcdEl) rcdEl.textContent = Math.max(0, _rocketCooldown).toFixed(1);
    var modeEl = document.getElementById('heli-mode');
    if (modeEl) modeEl.textContent = _weaponMode === 0 ? 'MINIGUN' : 'ROCKETS';
    var slEl = document.getElementById('heli-sl');
    if (slEl) { slEl.textContent = _searchlightOn ? 'ON' : 'OFF'; slEl.style.color = _searchlightOn ? '#ffff44' : '#aaffaa'; }

    // Draw artificial horizon
    if (_horizonCtx && _heli) {
      var ctx = _horizonCtx;
      var w = 120, h = 120, cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Sky half
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.fillStyle = '#1a3a6e';
      ctx.fill();

      // Ground half (offset by pitch)
      var pitchOff = (_vy / MAX_SPEED) * 30;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(0, cy - pitchOff, w, h);
      ctx.restore();

      // Horizon line
      ctx.beginPath();
      ctx.moveTo(cx - 58, cy - pitchOff);
      ctx.lineTo(cx + 58, cy - pitchOff);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pitch reference lines
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      for (var pLine = -2; pLine <= 2; pLine++) {
        if (pLine === 0) continue;
        var py = cy - pitchOff + pLine * 12;
        ctx.beginPath();
        ctx.moveTo(cx - 18, py);
        ctx.lineTo(cx + 18, py);
        ctx.stroke();
      }

      // Aircraft symbol (center)
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx - 8, cy);
      ctx.lineTo(cx, cy - 5);
      ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.stroke();
      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff88';
      ctx.fill();

      // Border circle clip mask
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.strokeStyle = '#00aa44';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // ── Smoke / Fire Particles ───────────────────────────────
  function _spawnSmoke(pos, fire) {
    var mat = fire
      ? new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 })
      : new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 });
    var p = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 3), mat);
    p.position.copy(pos);
    p.position.x += (Math.random() - 0.5) * 0.4;
    p.position.z += (Math.random() - 0.5) * 0.4;
    _scene.add(p);
    var particle = { mesh: p, life: 1.5 + Math.random(), vy: 1.5 + Math.random(), vx: (Math.random() - 0.5) * 0.6, vz: (Math.random() - 0.5) * 0.6, fire: fire };
    if (fire) _fireParticles.push(particle);
    else _smokeParticles.push(particle);
  }

  function _updateParticles(arr, dt) {
    for (var i = arr.length - 1; i >= 0; i--) {
      var p = arr[i];
      p.life -= dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.material.opacity = Math.max(0, p.life / 1.5) * (p.fire ? 0.8 : 0.6);
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        arr.splice(i, 1);
      }
    }
  }

  var _smokeTimer = 0;
  var _fireTimer = 0;

  // ── Tracer particles ─────────────────────────────────────
  function _fireTracer(from, dir) {
    var mat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), mat);
    mesh.position.copy(from);
    _scene.add(mesh);
    _tracers.push({ mesh: mesh, dir: dir.clone().normalize(), speed: 80, life: 0.5 });
  }

  function _updateTracers(dt) {
    for (var i = _tracers.length - 1; i >= 0; i--) {
      var t = _tracers[i];
      t.life -= dt;
      t.mesh.position.addScaledVector(t.dir, t.speed * dt);
      // Orient along direction
      t.mesh.lookAt(t.mesh.position.clone().add(t.dir));
      if (t.life <= 0) {
        _scene.remove(t.mesh);
        _tracers.splice(i, 1);
      }
    }
  }

  // ── Rockets ──────────────────────────────────────────────
  function _fireRocketProjectile(from, dir) {
    var mat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), mat);
    mesh.position.copy(from);
    _scene.add(mesh);
    _rockets.push({ mesh: mesh, dir: dir.clone().normalize(), speed: 45, life: 4.0, dmg: 50, blast: 6 });
  }

  function _updateRockets(dt) {
    for (var i = _rockets.length - 1; i >= 0; i--) {
      var r = _rockets[i];
      r.life -= dt;
      var stepDist = r.speed * dt;
      r.mesh.position.addScaledVector(r.dir, stepDist);
      r.mesh.lookAt(r.mesh.position.clone().add(r.dir));
      // Check ground hit
      var hit = false;
      if (r.mesh.position.y <= 0.5) hit = true;
      // Check enemy hits
      if (!hit && r.life > 0) {
        try {
          if (window.Enemies && window.Enemies.getList) {
            var elist = window.Enemies.getList();
            for (var ei = 0; ei < elist.length; ei++) {
              var en = elist[ei];
              if (en && en.mesh) {
                var ep = en.mesh.position;
                var dx = ep.x - r.mesh.position.x;
                var dy = ep.y - r.mesh.position.y;
                var dz = ep.z - r.mesh.position.z;
                if (Math.sqrt(dx * dx + dy * dy + dz * dz) < r.blast) {
                  try { if (en.takeDamage) en.takeDamage(r.dmg); } catch (ex) {}
                  hit = true;
                  break;
                }
              }
            }
          }
        } catch (e2) {}
      }
      if (hit || r.life <= 0) {
        _explodeRocket(r.mesh.position);
        _scene.remove(r.mesh);
        _rockets.splice(i, 1);
      }
    }
  }

  function _explodeRocket(pos) {
    // Flash sphere
    var flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.9 })
    );
    flash.position.copy(pos);
    _scene.add(flash);
    setTimeout(function () { _scene.remove(flash); }, 180);
    // Spawn smoke puffs
    for (var i = 0; i < 8; i++) _spawnSmoke(pos.clone(), i < 3);
    // Damage enemies in blast radius
    try {
      if (window.Enemies && window.Enemies.getList) {
        var elist = window.Enemies.getList();
        for (var ei = 0; ei < elist.length; ei++) {
          var en = elist[ei];
          if (en && en.mesh) {
            var ep = en.mesh.position;
            var dx = ep.x - pos.x;
            var dy = ep.y - pos.y;
            var dz = ep.z - pos.z;
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 6) {
              try { if (en.takeDamage) en.takeDamage(50); } catch (ex) {}
            }
          }
        }
      }
    } catch (e) {}
  }

  // ── Minigun fire ─────────────────────────────────────────
  function _fireMinigun() {
    if (_minigunAmmo <= 0) return;
    _minigunAmmo--;

    if (!_heli) return;
    var pos = new THREE.Vector3();
    _heli.group.getWorldPosition(pos);
    // Direction: forward (local -X in our setup)
    var dir = new THREE.Vector3(-1, -0.05, 0);
    dir.applyEuler(new THREE.Euler(0, _yaw, 0));
    pos.addScaledVector(dir, 1.6);
    pos.y -= 0.18;
    _fireTracer(pos, dir);

    // Damage enemies in front
    try {
      if (window.Enemies && window.Enemies.getList) {
        var elist = window.Enemies.getList();
        var heliPos = _heli.group.position;
        for (var ei = 0; ei < elist.length; ei++) {
          var en = elist[ei];
          if (!en || !en.mesh) continue;
          var ep = en.mesh.position;
          var dx = ep.x - heliPos.x;
          var dy = ep.y - heliPos.y;
          var dz = ep.z - heliPos.z;
          var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 60) {
            var enDir = new THREE.Vector3(dx, dy, dz).normalize();
            var dot = enDir.dot(dir);
            if (dot > 0.97) { // ~14 degree cone
              try { if (en.takeDamage) en.takeDamage(20); } catch (ex) {}
            }
          }
        }
      }
    } catch (e) {}
  }

  // ── Enter / Exit ─────────────────────────────────────────
  function _enter() {
    if (_active || !_heli) return;
    _active = true;
    _startupTimer = 2.0;
    _engineOn = false;
    _rotorSpeed = 0;
    _playStartupSound();
    _showHUD(true);
    // Lock mouse
    try {
      if (document.body.requestPointerLock) document.body.requestPointerLock();
    } catch (e) {}
    try {
      if (window.HUD && window.HUD.notifyPickup) window.HUD.notifyPickup('HELICOPTER — startup sequence', '#00ccff');
    } catch (e) {}
  }

  function _exit() {
    if (!_active) return;
    _active = false;
    _engineOn = false;
    _stopAudio();
    _showHUD(false);
    // Turn off searchlight
    if (_heli && _heli.spotLight) _heli.spotLight.intensity = 0;
    _searchlightOn = false;
    // Restore camera to player
    try {
      if (window.exitVehicle) window.exitVehicle();
    } catch (e) {}
    // Place player near helicopter
    if (_gameCam && _heli) {
      var exitPos = _heli.group.position.clone();
      exitPos.x += 3;
      exitPos.y += 0;
      _gameCam.position.copy(exitPos);
    }
    try {
      if (window.HUD && window.HUD.notifyPickup) window.HUD.notifyPickup('Exited helicopter', '#aaffaa');
    } catch (e) {}
  }

  // ── Camera ───────────────────────────────────────────────
  function _updateCamera() {
    if (!_active || !_heli || !_gameCam) return;
    // Third-person chase cam: 8 units behind, 3 up
    var behindDir = new THREE.Vector3(1, 0, 0); // local +X is "behind" fuselage nose points -X
    behindDir.applyEuler(new THREE.Euler(0, _yaw, 0));
    var targetPos = _heli.group.position.clone().addScaledVector(behindDir, 8);
    targetPos.y = _heli.group.position.y + 3;
    _gameCam.position.lerp(targetPos, 0.12);
    _gameCam.lookAt(_heli.group.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
  }

  // ── Physics update ───────────────────────────────────────
  function _updatePhysics(dt) {
    if (!_heli) return;
    var pos = _heli.group.position;

    if (_active) {
      // Startup sequence
      if (_startupTimer > 0) {
        _startupTimer -= dt;
        _rotorSpeed = Math.min(ROTOR_MAX, _rotorSpeed + dt * (ROTOR_MAX / 2));
        if (_startupTimer <= 0) {
          _engineOn = true;
          _startAudio();
        }
        return; // no flight until engine on
      }

      // Engine on — flight physics
      var thrustFwd = 0, thrustRight = 0, thrustUp = 0;
      if (_key.w) thrustFwd = -1;
      if (_key.s) thrustFwd = 1;
      if (_key.a) thrustRight = -1;
      if (_key.d) thrustRight = 1;
      if (_key.q) thrustUp = 1;
      if (_key.e_alt) thrustUp = -1;

      // Apply yaw from mouse
      _yaw += -_mouseDX * 0.004;
      _mouseDX = 0;

      // Convert local thrust to world
      var cosY = Math.cos(_yaw);
      var sinY = Math.sin(_yaw);
      var worldFwdX = cosY * thrustFwd + sinY * thrustRight;
      var worldFwdZ = -sinY * thrustFwd + cosY * thrustRight;

      _vx += worldFwdX * ACCEL * dt;
      _vz += worldFwdZ * ACCEL * dt;
      _vy += thrustUp * ACCEL * dt;

      // Rotor spin up/down
      _rotorSpeed = Math.min(ROTOR_MAX, _rotorSpeed + dt * 5);

      // Throttle for audio
      var throttle = Math.abs(thrustFwd) + Math.abs(thrustRight) + Math.abs(thrustUp);
      throttle = Math.min(1, throttle / 1.5);
      _updateAudio(throttle);
    } else {
      // Engine off, gravity pulls helicopter down
      _rotorSpeed = Math.max(0, _rotorSpeed - dt * 4);
      if (pos.y > 0.6) {
        _vy -= GRAVITY * dt;
      }
    }

    // Friction
    _vx *= Math.max(0, 1 - FRICTION * dt);
    _vz *= Math.max(0, 1 - FRICTION * dt);
    if (_active && _engineOn) {
      // Hover: gentle drag on vertical
      _vy *= Math.max(0, 1 - FRICTION * 0.5 * dt);
    }

    // Clamp speed
    var hspd = Math.sqrt(_vx * _vx + _vz * _vz);
    if (hspd > MAX_SPEED) {
      var sc = MAX_SPEED / hspd;
      _vx *= sc; _vz *= sc;
    }
    _vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, _vy));

    // Integrate
    pos.x += _vx * dt;
    pos.y += _vy * dt;
    pos.z += _vz * dt;

    // Ground clamp
    if (pos.y < 0.6) {
      pos.y = 0.6;
      if (_vy < 0) _vy = 0;
      _vx *= 0.85;
      _vz *= 0.85;
    }

    // Apply yaw to helicopter group
    _heli.group.rotation.y = _yaw;

    // Tilt based on velocity
    var tiltX = (_vz / MAX_SPEED) * 0.18;
    var tiltZ = -(_vx / MAX_SPEED) * 0.18;
    _heli.group.rotation.x = tiltX;
    _heli.group.rotation.z = tiltZ;
  }

  // ── Smoke / Fire emission ────────────────────────────────
  function _updateDamageEffects(dt) {
    if (!_heli) return;
    var hpRatio = _hp / HP_MAX;

    if (hpRatio < 0.5) {
      _smokeTimer -= dt;
      if (_smokeTimer <= 0) {
        _smokeTimer = 0.08 + Math.random() * 0.05;
        var p = _heli.group.position.clone();
        p.y += 0.5;
        _spawnSmoke(p, false);
      }
    }
    if (hpRatio < 0.25) {
      _fireTimer -= dt;
      if (_fireTimer <= 0) {
        _fireTimer = 0.05 + Math.random() * 0.04;
        var p2 = _heli.group.position.clone();
        p2.y += 0.4;
        _spawnSmoke(p2, true);
      }
    }
    _updateParticles(_smokeParticles, dt);
    _updateParticles(_fireParticles, dt);
  }

  // ── Searchlight enemy detection ──────────────────────────
  function _checkSearchlightDetection() {
    if (!_searchlightOn || !_heli) return;
    var heliPos = _heli.group.position;
    try {
      if (window.Enemies && window.Enemies.getList) {
        var elist = window.Enemies.getList();
        for (var i = 0; i < elist.length; i++) {
          var en = elist[i];
          if (!en || !en.mesh) continue;
          var ep = en.mesh.position;
          var dx = ep.x - heliPos.x;
          var dz = ep.z - heliPos.z;
          var horiz = Math.sqrt(dx * dx + dz * dz);
          var vertDiff = heliPos.y - ep.y;
          // Cone check: 30 degree half-angle downward
          if (vertDiff > 0 && horiz / vertDiff < Math.tan(Math.PI / 6)) {
            try { if (en.reveal) en.reveal(10); } catch (ex) {}
          }
        }
      }
    } catch (e) {}
  }

  // ── Crash ────────────────────────────────────────────────
  function _crash() {
    if (!_heli) return;
    var pos = _heli.group.position.clone();
    // Big explosion
    var flash = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 })
    );
    flash.position.copy(pos);
    _scene.add(flash);
    setTimeout(function () { _scene.remove(flash); }, 400);
    // Spawn fire/smoke
    for (var i = 0; i < 20; i++) {
      var sp = pos.clone();
      sp.x += (Math.random() - 0.5) * 3;
      sp.z += (Math.random() - 0.5) * 3;
      _spawnSmoke(sp, i < 8);
    }
    // Eject player: launch camera forward
    if (_gameCam && _active) {
      var ejectDir = new THREE.Vector3(-1, 0.5, 0);
      ejectDir.applyEuler(new THREE.Euler(0, _yaw, 0));
      var ejectPos = pos.clone().addScaledVector(ejectDir, 6);
      ejectPos.y = pos.y + 4;
      _gameCam.position.copy(ejectPos);
    }
    _exit();
    // Remove helicopter
    _scene.remove(_heli.group);
    _heli = null;
  }

  // ── Input ────────────────────────────────────────────────
  function _onKeyDown(e) {
    var k = e.key ? e.key.toLowerCase() : '';
    if (k === 'h') {
      // Enter when near helicopter
      if (!_active && _heli) {
        if (_gameCam) {
          var dist = _gameCam.position.distanceTo(_heli.group.position);
          if (dist < 3) _enter();
        }
      }
    }
    if (!_active) return;
    if (k === 'e') { _exit(); return; }
    if (k === 'w') _key.w = true;
    if (k === 's') _key.s = true;
    if (k === 'a') _key.a = true;
    if (k === 'd') _key.d = true;
    if (k === 'q') _key.q = true;
    if (k === 'r') _key.e_alt = true; // R for descend (avoid E conflict)
    if (k === 'l') {
      _searchlightOn = !_searchlightOn;
      if (_heli && _heli.spotLight) {
        _heli.spotLight.intensity = _searchlightOn ? 2.5 : 0;
      }
    }
    if (k === 'tab') {
      e.preventDefault();
      _weaponMode = (_weaponMode + 1) % 2;
    }
  }

  function _onKeyUp(e) {
    var k = e.key ? e.key.toLowerCase() : '';
    if (k === 'w') _key.w = false;
    if (k === 's') _key.s = false;
    if (k === 'a') _key.a = false;
    if (k === 'd') _key.d = false;
    if (k === 'q') _key.q = false;
    if (k === 'r') _key.e_alt = false;
  }

  function _onMouseMove(e) {
    if (!_active || !_engineOn) return;
    _mouseDX += e.movementX || 0;
  }

  function _onMouseDown(e) {
    if (!_active || !_engineOn) return;
    if (e.button === 0) _firingMinigun = true;
    if (e.button === 2) _firingRocket = true;
  }

  function _onMouseUp(e) {
    if (e.button === 0) _firingMinigun = false;
    if (e.button === 2) _firingRocket = false;
  }

  function _bind() {
    if (_bound) return;
    _bound = true;
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup', _onMouseUp);
    window.addEventListener('contextmenu', function (ev) { if (_active) ev.preventDefault(); });
  }

  // ── Public API ───────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _gameCam = camera;
    _heli = null;
    _active = false;
    _engineOn = false;
    _startupTimer = 0;
    _rotorSpeed = 0;
    _vx = 0; _vy = 0; _vz = 0;
    _yaw = 0;
    _mouseDX = 0;
    _minigunAmmo = 500;
    _rocketAmmo = 8;
    _rocketCooldown = 0;
    _minigunCool = 0;
    _firingMinigun = false;
    _firingRocket = false;
    _weaponMode = 0;
    _searchlightOn = false;
    _hp = HP_MAX;
    _smokeTimer = 0;
    _fireTimer = 0;
    _tracers.length = 0;
    _rockets.length = 0;
    _smokeParticles.length = 0;
    _fireParticles.length = 0;
    _key.w = _key.s = _key.a = _key.d = _key.q = _key.e_alt = false;
    _createHUD();
    _bind();
  }

  function spawnAt(x, y, z) {
    if (_heli) {
      _scene.remove(_heli.group);
      _heli = null;
    }
    _hp = HP_MAX;
    _heli = _build();
    _heli.group.position.set(x, y !== undefined ? y : 0.6, z);
    _spawnPos.x = x; _spawnPos.y = y !== undefined ? y : 0.6; _spawnPos.z = z;
    _scene.add(_heli.group);
    _vx = 0; _vy = 0; _vz = 0;
    _yaw = 0;
    _minigunAmmo = 500;
    _rocketAmmo = 8;
    _rocketCooldown = 0;
    _engineOn = false;
    _startupTimer = 0;
    _rotorSpeed = 0;
    _active = false;
    _showHUD(false);
    _searchlightOn = false;
  }

  function update(dt) {
    if (!_heli) return;

    // Rotor spin
    if (_heli.rotorGroup) _heli.rotorGroup.rotation.y += _rotorSpeed * dt;
    if (_heli.tailRotorGroup) _heli.tailRotorGroup.rotation.z += _rotorSpeed * 3.5 * dt;

    _updatePhysics(dt);
    _updateCamera();
    _updateDamageEffects(dt);
    _updateTracers(dt);
    _updateRockets(dt);

    // Rocket cooldown
    if (_rocketCooldown > 0) _rocketCooldown -= dt;

    // Minigun firing
    if (_firingMinigun && _active && _engineOn) {
      if (_weaponMode === 0 || true) { // minigun always available on LMB regardless of mode
        _minigunCool -= dt;
        if (_minigunCool <= 0 && _minigunAmmo > 0) {
          _minigunCool = MINIGUN_INTERVAL;
          _fireMinigun();
        }
      }
    }

    // Rocket firing
    if (_firingRocket && _active && _engineOn && _weaponMode === 1) {
      if (_rocketCooldown <= 0 && _rocketAmmo > 0) {
        _rocketAmmo--;
        _rocketCooldown = _rocketAmmo > 0 ? 0.35 : 10; // rapid multi-fire, 10s when empty
        if (_heli) {
          var rPos = _heli.group.position.clone();
          rPos.y -= 0.2;
          var rDir = new THREE.Vector3(-1, -0.1, 0);
          rDir.applyEuler(new THREE.Euler(0, _yaw, 0));
          _fireRocketProjectile(rPos, rDir);
        }
      }
      // Reload when empty
      if (_rocketAmmo <= 0 && _rocketCooldown <= 0) {
        _rocketAmmo = 8;
      }
    }

    // Searchlight detection check every ~0.5s
    _checkSearchlightDetection();

    _updateHUD(dt);
  }

  function reset() {
    _exit();
    if (_heli) {
      _scene.remove(_heli.group);
      _heli = null;
    }
    // Clear particles
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      _scene.remove(_smokeParticles[i].mesh);
    }
    _smokeParticles.length = 0;
    for (var j = _fireParticles.length - 1; j >= 0; j--) {
      _scene.remove(_fireParticles[j].mesh);
    }
    _fireParticles.length = 0;
    for (var k = _tracers.length - 1; k >= 0; k--) {
      _scene.remove(_tracers[k].mesh);
    }
    _tracers.length = 0;
    for (var l = _rockets.length - 1; l >= 0; l--) {
      _scene.remove(_rockets[l].mesh);
    }
    _rockets.length = 0;
    _active = false;
    _engineOn = false;
    _hp = HP_MAX;
    _minigunAmmo = 500;
    _rocketAmmo = 8;
    _rocketCooldown = 0;
    _vx = 0; _vy = 0; _vz = 0;
    _stopAudio();
    _showHUD(false);
  }

  // External damage intake
  function takeDamage(dmg) {
    _hp -= dmg;
    if (_hp <= 0 && _heli) {
      _crash();
    }
  }

  function isActive() { return _active; }
  function getHealth() { return _hp; }

  return {
    init: init,
    update: update,
    spawnAt: spawnAt,
    reset: reset,
    takeDamage: takeDamage,
    isActive: isActive,
    getHealth: getHealth
  };
})();
