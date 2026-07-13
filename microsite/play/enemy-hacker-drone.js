/* ════════════════════════════════════════════════════════════════════
 *  ENEMY HACKER DRONE
 *  ─────────────────────────────────────────────────────────────────
 *  An enemy surveillance/hacking drone that flies overhead, orbits the
 *  player, and periodically disrupts player systems via hack effects.
 *
 *  Public API  (window.EnemyHackerDrone):
 *    init(scene, camera)  — call once after scene exists
 *    update(delta)        — call every frame
 *    spawn()              — force-spawn a drone (also called auto on wave 4+)
 *    reset()              — remove drone and cancel all effects
 *    takeDamage(dmg)      — deal damage to the active drone
 *
 *  Global flags set by this module:
 *    window._hackerDroneActive   — bool, true while drone is alive
 *    window._weaponJammed        — set true during ammo-jam hack
 *    window._abilitiesDisabled   — set true during ability-disable hack
 *    window._minimapDisabled     — set true during map-scramble hack
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyHackerDrone = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────── */
  var _scene         = null;
  var _camera        = null;
  var _drone         = null;       // THREE.Group
  var _rotors        = [];         // rotor meshes for spin animation
  var _hackBeam      = null;       // THREE.Line, red/purple beam
  var _beamGeo       = null;
  var _hp            = 0;
  var _alive         = false;
  var _orbitAngle    = 0;
  var _orbitRadius   = 15;
  var _flyHeight     = 6;
  var _hackTimer     = 0;
  var _hackInterval  = 8;          // seconds between hacks
  var _hackingNow    = false;
  var _currentHack   = null;       // name of active hack
  var _hackEndTime   = 0;          // when the active hack effect ends
  var _warnTimer     = 0;          // countdown for warning display
  var _warnShown     = false;
  var _wavesSeen     = 0;          // track last wave we spawned on
  var _audioCtx      = null;
  var _droneOsc      = null;       // oscillator for drone whine
  var _droneGain     = null;
  var _staticOsc     = null;       // oscillator for static during hack
  var _staticGain    = null;
  var _warnEl        = null;       // DOM element for "DRONE HACKING..." warning
  var _beamFlicker   = 0;
  var _MAX_HP        = 60;
  var _SCORE_REWARD  = 450;

  /* ── hack effect names ───────────────────────────────────── */
  var HACKS = ['hud_glitch', 'ammo_jam', 'ability_disable', 'screen_invert', 'map_scramble'];

  /* ── helpers ─────────────────────────────────────────────── */
  function _getThree() {
    return (typeof THREE !== 'undefined') ? THREE : null;
  }

  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { _audioCtx = new AC(); }
    } catch (e) {}
    return _audioCtx;
  }

  function _addScore(pts) {
    if (window.player && window.player.score !== undefined) {
      window.player.score += pts;
    }
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  function _getCanvas() {
    return document.querySelector('canvas') || document.getElementById('game-canvas');
  }

  /* ── audio: drone whine ──────────────────────────────────── */
  function _startDroneAudio() {
    var ac = _getAudioCtx();
    if (!ac) return;
    try {
      _droneOsc  = ac.createOscillator();
      _droneGain = ac.createGain();
      _droneOsc.type = 'sawtooth';
      _droneOsc.frequency.setValueAtTime(1300, ac.currentTime);
      _droneGain.gain.setValueAtTime(0.06, ac.currentTime);
      _droneOsc.connect(_droneGain);
      _droneGain.connect(ac.destination);
      _droneOsc.start();
    } catch (e) {}
  }

  function _wobbleDroneAudio(t) {
    if (!_droneOsc || !_audioCtx) return;
    try {
      /* slight pitch wobble 1200-1400 Hz */
      var freq = 1300 + Math.sin(t * 3.1) * 100;
      _droneOsc.frequency.setValueAtTime(freq, _audioCtx.currentTime);
    } catch (e) {}
  }

  function _stopDroneAudio() {
    try { if (_droneOsc)  { _droneOsc.stop();  _droneOsc  = null; } } catch (e) {}
    try { if (_droneGain) { _droneGain.disconnect(); _droneGain = null; } } catch (e) {}
  }

  function _startStaticAudio() {
    var ac = _getAudioCtx();
    if (!ac) return;
    try {
      var buf    = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) { data[i] = (Math.random() * 2 - 1); }
      var src    = ac.createBufferSource();
      src.buffer = buf;
      src.loop   = true;
      _staticGain = ac.createGain();
      _staticGain.gain.setValueAtTime(0.12, ac.currentTime);
      src.connect(_staticGain);
      _staticGain.connect(ac.destination);
      src.start();
      _staticOsc = src;           /* reuse slot to hold buffer source */
    } catch (e) {}
  }

  function _stopStaticAudio() {
    try { if (_staticOsc)  { _staticOsc.stop();  _staticOsc  = null; } } catch (e) {}
    try { if (_staticGain) { _staticGain.disconnect(); _staticGain = null; } } catch (e) {}
  }

  /* ── build drone mesh ────────────────────────────────────── */
  function _buildDroneMesh() {
    var T = _getThree();
    if (!T) return null;

    var group = new T.Group();

    /* body */
    var bodyGeo  = new T.BoxGeometry(0.6, 0.1, 0.6);
    var bodyMat  = new T.MeshLambertMaterial({ color: 0x222222 });
    var body     = new T.Mesh(bodyGeo, bodyMat);
    group.add(body);

    /* 4 arm + rotor assemblies */
    var armOffsets = [
      { x:  0.35, z:  0.35 },
      { x: -0.35, z:  0.35 },
      { x:  0.35, z: -0.35 },
      { x: -0.35, z: -0.35 }
    ];
    _rotors = [];
    for (var i = 0; i < armOffsets.length; i++) {
      var off       = armOffsets[i];
      var rotorGeo  = new T.CylinderGeometry(0.05, 0.05, 0.05, 6);
      var rotorMat  = new T.MeshLambertMaterial({ color: 0x444444 });
      var rotor     = new T.Mesh(rotorGeo, rotorMat);
      rotor.position.set(off.x, 0.06, off.z);
      group.add(rotor);
      _rotors.push(rotor);
    }

    /* small red indicator light */
    var lightGeo = new T.SphereGeometry(0.03, 4, 4);
    var lightMat = new T.MeshBasicMaterial({ color: 0xff0000 });
    var light    = new T.Mesh(lightGeo, lightMat);
    light.position.set(0, -0.07, 0);
    group.add(light);

    return group;
  }

  /* ── hack beam ───────────────────────────────────────────── */
  function _buildHackBeam() {
    var T = _getThree();
    if (!T || !_scene) return;
    var points  = [ new T.Vector3(0,0,0), new T.Vector3(0,-1,0) ];
    _beamGeo    = new T.BufferGeometry().setFromPoints(points);
    var beamMat = new T.LineBasicMaterial({ color: 0xcc00ff, linewidth: 2 });
    _hackBeam   = new T.Line(_beamGeo, beamMat);
    _hackBeam.visible = false;
    _scene.add(_hackBeam);
  }

  function _updateHackBeam() {
    if (!_hackBeam || !_drone || !_camera) return;
    var T = _getThree();
    if (!T) return;

    /* flicker: toggle visibility rapidly */
    _beamFlicker += 1;
    _hackBeam.visible = (_beamFlicker % 3 !== 0);

    var from = _drone.position.clone();
    var to   = _camera.position.clone();
    var pts  = [ from, to ];
    _beamGeo.setFromPoints(pts);
    _beamGeo.attributes.position.needsUpdate = true;

    /* alternate red/purple color */
    var col = (_beamFlicker % 6 < 3) ? 0xff0066 : 0xcc00ff;
    _hackBeam.material.color.setHex(col);
  }

  function _hideHackBeam() {
    if (_hackBeam) { _hackBeam.visible = false; }
  }

  /* ── warning HUD ─────────────────────────────────────────── */
  function _showWarnHUD() {
    if (!_warnEl) {
      _warnEl = document.createElement('div');
      _warnEl.id = 'drone-hack-warning';
      _warnEl.style.cssText = [
        'position:fixed',
        'top:130px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(180,0,0,0.25)',
        'border:1px solid #ff2222',
        'color:#ff3333',
        'padding:4px 18px',
        'border-radius:4px',
        'font-size:13px',
        'font-family:monospace',
        'z-index:2200',
        'pointer-events:none',
        'animation:droneBlink 0.4s infinite'
      ].join(';');
      _warnEl.textContent = '⚠ DRONE HACKING…';
      /* inject blink keyframes once */
      if (!document.getElementById('drone-hack-style')) {
        var sty  = document.createElement('style');
        sty.id   = 'drone-hack-style';
        sty.textContent = '@keyframes droneBlink{0%,100%{opacity:1}50%{opacity:0.2}}';
        document.head.appendChild(sty);
      }
      document.body.appendChild(_warnEl);
    }
    _warnEl.style.display = 'block';
  }

  function _hideWarnHUD() {
    if (_warnEl) { _warnEl.style.display = 'none'; }
  }

  /* ── apply / cancel hack effects ─────────────────────────── */
  function _applyHack(hackName) {
    _hackingNow  = true;
    _currentHack = hackName;
    _showWarnHUD();
    _startStaticAudio();

    var canvas = _getCanvas();
    var dur    = 3;   /* default duration seconds */

    if (hackName === 'hud_glitch') {
      dur = 3;
      if (canvas) {
        canvas.style.filter = 'hue-rotate(180deg) contrast(2)';
      }
      /* static noise overlay */
      var ov = document.getElementById('drone-static-overlay');
      if (!ov) {
        ov = document.createElement('canvas');
        ov.id = 'drone-static-overlay';
        ov.style.cssText = [
          'position:fixed',
          'top:0','left:0',
          'width:100%','height:100%',
          'z-index:2100',
          'pointer-events:none',
          'opacity:0.18'
        ].join(';');
        document.body.appendChild(ov);
      }
      ov.width  = window.innerWidth;
      ov.height = window.innerHeight;
      ov.style.display = 'block';
      var ctx2d = ov.getContext('2d');
      var id    = setInterval(function() {
        if (!_hackingNow || _currentHack !== 'hud_glitch') { clearInterval(id); return; }
        var imgData = ctx2d.createImageData(ov.width, ov.height);
        for (var k = 0; k < imgData.data.length; k += 4) {
          var v = (Math.random() > 0.5) ? 255 : 0;
          imgData.data[k]   = v;
          imgData.data[k+1] = v;
          imgData.data[k+2] = v;
          imgData.data[k+3] = 60;
        }
        ctx2d.putImageData(imgData, 0, 0);
      }, 50);

    } else if (hackName === 'ammo_jam') {
      dur = 4;
      window._weaponJammed = true;

    } else if (hackName === 'ability_disable') {
      dur = 5;
      window._abilitiesDisabled = true;

    } else if (hackName === 'screen_invert') {
      dur = 2;
      if (canvas) { canvas.style.filter = 'invert(0.8)'; }

    } else if (hackName === 'map_scramble') {
      dur = 10;
      window._minimapDisabled = true;
    }

    _hackEndTime = (Date.now() / 1000) + dur;
  }

  function _cancelHackEffects() {
    var canvas = _getCanvas();
    if (canvas) { canvas.style.filter = ''; }
    var ov = document.getElementById('drone-static-overlay');
    if (ov) { ov.style.display = 'none'; }
    window._weaponJammed       = false;
    window._abilitiesDisabled  = false;
    window._minimapDisabled    = false;
    _hackingNow  = false;
    _currentHack = null;
    _hackEndTime = 0;
    _hideWarnHUD();
    _hideHackBeam();
    _stopStaticAudio();
  }

  /* ── destroy drone (shot down) ───────────────────────────── */
  function _destroyDrone() {
    if (!_alive) return;
    _alive = false;
    window._hackerDroneActive = false;
    _cancelHackEffects();
    _stopDroneAudio();

    if (_drone && _scene) {
      _scene.remove(_drone);
      _drone = null;
    }
    if (_hackBeam && _scene) {
      _scene.remove(_hackBeam);
      _hackBeam = null;
      _beamGeo  = null;
    }

    _addScore(_SCORE_REWARD);
    _toast('DRONE NEUTRALIZED');
    console.log('[EnemyHackerDrone] drone destroyed — +' + _SCORE_REWARD + ' score');
  }

  /* ── shot detection hook ─────────────────────────────────── */
  function _hookShotFired() {
    var _prev = window._onShotFired;
    window._onShotFired = function(origin, direction, range) {
      if (_prev) { _prev(origin, direction, range); }
      if (!_alive || !_drone) return;
      /* simple proximity check: if bullet origin is within range of drone */
      var T = _getThree();
      if (!T || !origin) return;
      var d = _drone.position.distanceTo(origin);
      if (d < (range || 50)) {
        /* ray vs drone bounding sphere (radius ~0.5) */
        var diff = _drone.position.clone().sub(origin);
        var dot  = diff.dot(direction);
        if (dot > 0) {
          var closest = origin.clone().addScaledVector(direction, dot);
          var dist2   = closest.distanceTo(_drone.position);
          if (dist2 < 0.8) {
            takeDamage(20);
          }
        }
      }
    };
  }

  /* ── EMP / CounterUAV check ──────────────────────────────── */
  function _checkEMP() {
    if (!_alive) return;
    var empKill = (window._empActive === true) ||
                  (window.CounterUAV && window.CounterUAV.isActive && window.CounterUAV.isActive());
    if (empKill) {
      _toast('EMP — DRONE DESTROYED');
      _destroyDrone();
    }
  }

  /* ── public: takeDamage ──────────────────────────────────── */
  function takeDamage(dmg) {
    if (!_alive) return;
    _hp -= dmg;
    if (_hp <= 0) {
      _destroyDrone();
    }
  }

  /* ── public: spawn ───────────────────────────────────────── */
  function spawn() {
    if (_alive) return;   /* max 1 active */
    var T = _getThree();
    if (!T) return;
    if (!_scene) {
      _scene  = window._gameScene || null;
      _camera = window._camera    || null;
    }
    if (!_scene) { console.warn('[EnemyHackerDrone] no scene available'); return; }

    _hp           = _MAX_HP;
    _alive        = true;
    _orbitAngle   = Math.random() * Math.PI * 2;
    _orbitRadius  = 12 + Math.random() * 6;
    _flyHeight    = 5  + Math.random() * 2;
    _hackTimer    = _hackInterval;   /* first hack after 8s */
    _hackingNow   = false;
    _currentHack  = null;
    _warnShown    = false;
    _beamFlicker  = 0;

    window._hackerDroneActive = true;

    _drone = _buildDroneMesh();
    if (_drone) { _scene.add(_drone); }

    _buildHackBeam();
    _startDroneAudio();
    _hookShotFired();

    console.log('[EnemyHackerDrone] spawned');
  }

  /* ── public: reset ───────────────────────────────────────── */
  function reset() {
    _cancelHackEffects();
    _stopDroneAudio();
    _alive = false;
    window._hackerDroneActive = false;
    if (_drone && _scene) { _scene.remove(_drone); }
    if (_hackBeam && _scene) { _scene.remove(_hackBeam); }
    _drone    = null;
    _hackBeam = null;
    _beamGeo  = null;
    _rotors   = [];
    _hackTimer = _hackInterval;
    _warnShown = false;
    console.log('[EnemyHackerDrone] reset');
  }

  /* ── public: init ────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;
    _hackTimer = _hackInterval;
    console.log('[EnemyHackerDrone] initialized');
  }

  /* ── public: update (call each frame) ───────────────────────*/
  function update(delta) {
    if (!delta || delta <= 0) { delta = 0.016; }

    /* auto-spawn logic: wave 4, then every 3rd wave */
    var wave = (window.GameManager && window.GameManager.wave) ||
               (window._currentWave) || 0;
    if (!_alive && wave >= 4 && !window._hackerDroneActive) {
      var waveSlot = Math.floor((wave - 4) / 3);
      if (waveSlot !== _wavesSeen) {
        _wavesSeen = waveSlot;
        spawn();
      }
    }

    if (!_alive || !_drone) return;

    /* EMP / CounterUAV check */
    _checkEMP();
    if (!_alive) return;

    /* orbit player camera */
    _orbitAngle += delta * 0.4;    /* ~0.4 rad/s */
    var cx = 0, cz = 0;
    if (_camera) {
      cx = _camera.position.x;
      cz = _camera.position.z;
    }
    _drone.position.x = cx + Math.cos(_orbitAngle) * _orbitRadius;
    _drone.position.z = cz + Math.sin(_orbitAngle) * _orbitRadius;
    _drone.position.y = _flyHeight + Math.sin(_orbitAngle * 2.3) * 0.3;

    /* spin rotors */
    for (var i = 0; i < _rotors.length; i++) {
      _rotors[i].rotation.y += delta * 25 * (i % 2 === 0 ? 1 : -1);
    }

    /* wobble drone audio */
    _wobbleDroneAudio(_orbitAngle);

    /* hack effect timer */
    _hackTimer -= delta;

    /* check if current hack has expired */
    if (_hackingNow && Date.now() / 1000 >= _hackEndTime) {
      _cancelHackEffects();
      _hackTimer = _hackInterval;
    }

    /* 2s warning before hack triggers */
    if (!_hackingNow && !_warnShown && _hackTimer <= 2) {
      _warnShown = true;
      _showWarnHUD();
    }

    /* trigger hack */
    if (!_hackingNow && _hackTimer <= 0) {
      _warnShown = false;
      var hack = HACKS[Math.floor(Math.random() * HACKS.length)];
      _applyHack(hack);
    }

    /* update beam while hacking */
    if (_hackingNow) {
      _updateHackBeam();
    } else {
      _hideHackBeam();
      /* hide warning HUD if not hacking and no imminent hack */
      if (_hackTimer > 2) { _hideWarnHUD(); }
    }
  }

  /* ── expose public API ───────────────────────────────────── */
  return {
    init:       init,
    update:     update,
    spawn:      spawn,
    reset:      reset,
    takeDamage: takeDamage
  };
})();
