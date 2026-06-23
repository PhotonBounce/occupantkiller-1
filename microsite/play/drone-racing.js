/* ───────────────────────────────────────────────────────────────────────────
   drone-racing.js — Drone Racing Mini-Game
   API: window.DroneRacing = { init, update, reset }
   Controls:
     D + R (together, 400ms)  → activate drone racing
     W / S                    → pitch forward / backward
     A / D                    → yaw left / right
     Q / E                    → roll left / right
     Arrow Up / Down          → throttle up / down
     Shift                    → nitro boost (3x thrust, 2s, 5s recharge)
   ─────────────────────────────────────────────────────────────────────────── */
window.DroneRacing = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active       = false;
  var _lap          = 1;
  var _totalLaps    = 3;
  var _currentGate  = 0;   // next gate index to pass
  var _gatesTotal   = 8;
  var _lapStartTime = 0;
  var _raceStartTime= 0;
  var _bestLap      = Infinity;
  var _crashes      = 0;
  var _maxCrashes   = 3;
  var _dnf          = false;
  var _raceFinished = false;
  var _playerPos    = 1; // position in race (1st, 2nd, etc.)

  /* ── Drone (player) ────────────────────────────────────────────────────── */
  var _droneMesh    = null;
  var _rotors       = [];          // array of { mesh, speed }
  var _droneGroup   = null;
  var _velocity     = null;        // THREE.Vector3
  var _angularVel   = null;        // THREE.Vector3 (pitch, yaw, roll)
  var _crashTimer   = 0;
  var _crashSpinning= false;

  /* ── Nitro ─────────────────────────────────────────────────────────────── */
  var _nitroActive     = false;
  var _nitroDuration   = 2.0;      // seconds
  var _nitroRecharge   = 5.0;      // seconds
  var _nitroTimer      = 0;        // time remaining in boost or recharge
  var _nitroReady      = true;
  var _nitroLight      = null;

  /* ── Gates ─────────────────────────────────────────────────────────────── */
  var _gates = [];  // { group, ring, center:Vector3, passed, isNext }

  /* Gate layout: varied 3D positions */
  var GATE_POSITIONS = [
    { x:  0,  y:  5, z:  0   },   // 0 — start/finish
    { x: 25,  y: 15, z: -20  },   // 1
    { x: 40,  y:  2, z: -45  },   // 2
    { x: 15,  y: 12, z: -70  },   // 3
    { x: -20, y:  8, z: -60  },   // 4
    { x: -35, y: 20, z: -30  },   // 5
    { x: -30, y:  3, z:  10  },   // 6
    { x: -10, y: 10, z:  30  },   // 7 (leads back to start)
  ];

  /* ── AI competitors ────────────────────────────────────────────────────── */
  var _aiDrones = [];   // { group, mesh, color, lap, gate, t, speed, lapCount }
  var AI_COLORS  = [0x2244CC, 0xCCCC00, 0xAA22AA];
  var AI_SPEEDS  = [0.10, 0.12, 0.14];

  /* ── Obstacles ─────────────────────────────────────────────────────────── */
  var _obstacles = [];  // { mesh, min:Vector3, max:Vector3 }

  /* ── Wind zones ────────────────────────────────────────────────────────── */
  var _windZones = [];  // { center:Vector3, radius, wind:Vector3 }

  /* ── Particles (wind trail) ────────────────────────────────────────────── */
  var _particles = [];  // { mesh, life, maxLife, vel }

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Speed tracking ────────────────────────────────────────────────────── */
  var _prevPos    = null;
  var _speed      = 0;
  var _maxSpeed   = 0;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── D+R simultaneous activation ──────────────────────────────────────── */
  var _drPressTime = { D: 0, R: 0 };
  var DR_WINDOW    = 0.4; // 400 ms

  /* ── Timing ────────────────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildDroneGroup(color) {
    var group = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    /* 4 rotors at corners */
    var rotorPositions = [
      new THREE.Vector3( 0.5, 0.15,  0.5),
      new THREE.Vector3(-0.5, 0.15,  0.5),
      new THREE.Vector3( 0.5, 0.15, -0.5),
      new THREE.Vector3(-0.5, 0.15, -0.5),
    ];
    var rotorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12);
    var rotorMat = new THREE.MeshLambertMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.7
    });

    var rotorMeshes = [];
    for (var i = 0; i < 4; i++) {
      var r = new THREE.Mesh(rotorGeo, rotorMat);
      r.position.copy(rotorPositions[i]);
      group.add(r);
      rotorMeshes.push(r);
    }

    return { group: group, rotors: rotorMeshes };
  }

  function buildGate(index) {
    var group = new THREE.Group();
    var pos   = GATE_POSITIONS[index];

    /* Ring geometry using LineSegments for neon outline */
    var ringGeo  = new THREE.CylinderGeometry(3, 3, 0.5, 32, 1, true);
    var edges    = new THREE.EdgesGeometry(ringGeo);
    var lineMat  = new THREE.LineBasicMaterial({ color: 0x00FF44, linewidth: 2 });
    var ring     = new THREE.LineSegments(edges, lineMat);
    ring.rotation.x = Math.PI / 2; /* lay flat so drone flies through */
    group.add(ring);

    /* Solid torus-like invisible collider cylinder */
    var colGeo = new THREE.CylinderGeometry(3, 3, 0.5, 32);
    var colMat = new THREE.MeshLambertMaterial({
      color: 0x00FF44,
      transparent: true,
      opacity: 0.1
    });
    var col = new THREE.Mesh(colGeo, colMat);
    col.rotation.x = Math.PI / 2;
    group.add(col);

    /* Gate number label — small sphere at center */
    var dotGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var dotMat = new THREE.MeshLambertMaterial({ color: 0x00FF44, emissive: 0x00FF44, emissiveIntensity: 1 });
    var dot    = new THREE.Mesh(dotGeo, dotMat);
    group.add(dot);

    group.position.set(pos.x, pos.y, pos.z);

    return {
      group:  group,
      ring:   ring,
      colMat: colMat,
      lineMat: lineMat,
      center: new THREE.Vector3(pos.x, pos.y, pos.z),
      passed: false,
      isNext: false
    };
  }

  function buildObstacle(x, y, z, w, h, d) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    var half = new THREE.Vector3(w / 2, h / 2, d / 2);
    return {
      mesh: mesh,
      min:  new THREE.Vector3(x - half.x, y - half.y, z - half.z),
      max:  new THREE.Vector3(x + half.x, y + half.y, z + half.z)
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     RACE LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchRace() {
    if (_active) return;
    _active        = true;
    _lap           = 1;
    _currentGate   = 0;
    _crashes       = 0;
    _dnf           = false;
    _raceFinished  = false;
    _nitroActive   = false;
    _nitroReady    = true;
    _nitroTimer    = 0;
    _speed         = 0;
    _maxSpeed      = 0;
    _bestLap       = Infinity;
    _raceStartTime = performance.now();
    _lapStartTime  = _raceStartTime;

    /* Player drone */
    var built     = buildDroneGroup(0xCC2200);
    _droneGroup   = built.group;
    _rotors       = built.rotors;
    _droneGroup.position.set(0, 5, 8);
    _velocity     = new THREE.Vector3(0, 0, 0);
    _angularVel   = new THREE.Vector3(0, 0, 0);
    _prevPos      = _droneGroup.position.clone();
    _scene.add(_droneGroup);

    /* Nitro exhaust light */
    _nitroLight = new THREE.PointLight(0xFF8800, 0, 8);
    _scene.add(_nitroLight);

    /* Gates */
    _gates = [];
    for (var g = 0; g < _gatesTotal; g++) {
      var gate = buildGate(g);
      _scene.add(gate.group);
      _gates.push(gate);
    }
    /* Mark first gate as next */
    _gates[0].isNext = true;
    _gates[0].lineMat.color.setHex(0xFF8800);

    /* AI drones */
    _aiDrones = [];
    var aiColors = [0x2244CC, 0xCCCC00, 0xAA22AA];
    for (var a = 0; a < 3; a++) {
      var aiBuilt = buildDroneGroup(aiColors[a]);
      var aiGroup = aiBuilt.group;
      aiGroup.position.set((a + 1) * 2, 5, 8 + (a + 1) * 3);
      _scene.add(aiGroup);
      _aiDrones.push({
        group:    aiGroup,
        lap:      1,
        gate:     0,
        t:        (a + 1) * 0.03, /* offset start along path */
        speed:    AI_SPEEDS[a],
        lapCount: 0,
        finished: false
      });
    }

    /* Obstacles — 6 BoxGeometry walls with gaps */
    _obstacles = [];
    var obsData = [
      { x:  12, y:  8, z: -10, w: 1, h: 8,  d: 12 },
      { x: -12, y:  8, z: -10, w: 1, h: 8,  d: 12 },
      { x:  32, y: 10, z: -32, w: 14, h: 1, d: 1  },
      { x:  28, y:  5, z: -57, w: 1,  h: 10, d: 8  },
      { x: -27, y: 12, z: -45, w: 12, h: 1, d: 1  },
      { x: -32, y:  8, z:  -8, w: 1,  h: 14, d: 10 },
    ];
    for (var o = 0; o < obsData.length; o++) {
      var od  = obsData[o];
      var obs = buildObstacle(od.x, od.y, od.z, od.w, od.h, od.d);
      _scene.add(obs.mesh);
      _obstacles.push(obs);
    }

    /* Wind zones — 3 invisible directional push regions */
    _windZones = [
      {
        center: new THREE.Vector3(20, 10, -30),
        radius: 12,
        wind:   new THREE.Vector3(3, 1, 0)
      },
      {
        center: new THREE.Vector3(-25, 14, -50),
        radius: 10,
        wind:   new THREE.Vector3(-2, 0, -2)
      },
      {
        center: new THREE.Vector3(-15, 5, 5),
        radius: 8,
        wind:   new THREE.Vector3(0, 2, 3)
      }
    ];

    /* HUD */
    if (!_hud) {
      _hud = document.createElement('div');
      _hud.id = 'drone-hud';
      _hud.style.cssText = [
        'position:fixed',
        'bottom:16px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:#00FF44',
        'font-family:monospace',
        'font-size:13px',
        'padding:6px 14px',
        'border-radius:4px',
        'border:1px solid #00FF44',
        'pointer-events:none',
        'z-index:9999',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(_hud);
    }
    _hud.style.display = 'block';
  }

  /* ════════════════════════════════════════════════════════════════════════
     GATE DETECTION
  ════════════════════════════════════════════════════════════════════════ */

  function checkGatePassage(dt) {
    if (_currentGate >= _gatesTotal) return;

    var gate   = _gates[_currentGate];
    var dpos   = _droneGroup.position;
    var dist   = dpos.distanceTo(gate.center);

    if (dist < 2.5) {
      /* Passing through — check we have forward velocity component toward gate */
      var toGate = gate.center.clone().sub(dpos).normalize();
      var dot    = _velocity.dot(toGate);
      if (dot < -0.5 || dist < 1.5) {
        /* Gate cleared */
        gate.passed = true;
        gate.isNext = false;
        gate.lineMat.color.setHex(0x00FF44);
        gate.colMat.opacity = 0.05;

        _currentGate++;

        /* Check lap completion */
        if (_currentGate >= _gatesTotal) {
          var lapTime  = performance.now() - _lapStartTime;
          if (lapTime < _bestLap) { _bestLap = lapTime; }

          if (_lap >= _totalLaps) {
            _raceFinished = true;
          } else {
            _lap++;
            _currentGate = 0;
            _lapStartTime = performance.now();
            /* Reset gate visuals */
            for (var i = 0; i < _gates.length; i++) {
              _gates[i].passed = false;
            }
          }
        }

        /* Highlight next gate */
        if (!_raceFinished && _currentGate < _gatesTotal) {
          _gates[_currentGate].isNext = true;
          _gates[_currentGate].lineMat.color.setHex(0xFF8800);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CRASH DETECTION
  ════════════════════════════════════════════════════════════════════════ */

  function checkCrash() {
    if (_crashSpinning) return;
    var dp = _droneGroup.position;

    /* Ground */
    if (dp.y < 0.5) {
      triggerCrash();
      return;
    }

    /* Obstacles */
    for (var o = 0; o < _obstacles.length; o++) {
      var ob = _obstacles[o];
      if (dp.x > ob.min.x && dp.x < ob.max.x &&
          dp.y > ob.min.y && dp.y < ob.max.y &&
          dp.z > ob.min.z && dp.z < ob.max.z) {
        triggerCrash();
        return;
      }
    }
  }

  function triggerCrash() {
    _crashes++;
    _crashSpinning = true;
    _crashTimer    = 2.0; /* 2 seconds to recover */

    /* Apply random spin and kill velocity */
    _angularVel.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
    _velocity.multiplyScalar(0.1);

    if (_crashes >= _maxCrashes) {
      _dnf = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     AI UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateAI(dt) {
    for (var a = 0; a < _aiDrones.length; a++) {
      var ai = _aiDrones[a];
      if (ai.finished) continue;

      /* Speed increases per lap */
      var lapSpeed = ai.speed * (1 + (ai.lap - 1) * 0.15);
      ai.t += lapSpeed * dt;

      /* Interpolate along gate path */
      var gateIdx  = ai.gate % _gatesTotal;
      var nextIdx  = (ai.gate + 1) % _gatesTotal;
      var gatePos  = _gates[gateIdx].center;
      var nextPos  = _gates[nextIdx].center;
      var localT   = ai.t;

      /* How far along segment from current gate to next */
      var segLen   = gatePos.distanceTo(nextPos);
      var traveled = localT * segLen;

      if (traveled >= segLen) {
        ai.t    = 0;
        ai.gate = (ai.gate + 1) % _gatesTotal;
        if (ai.gate === 0) {
          ai.lap++;
          ai.lapCount++;
          if (ai.lapCount >= _totalLaps) {
            ai.finished = true;
          }
        }
        continue;
      }

      var frac = segLen > 0 ? (traveled / segLen) : 0;
      var newPos = gatePos.clone().lerp(nextPos, frac);
      /* Small bobble */
      newPos.y += Math.sin(performance.now() * 0.003 + a) * 0.3;
      ai.group.position.copy(newPos);

      /* Face direction of travel */
      var dir = nextPos.clone().sub(gatePos).normalize();
      if (dir.lengthSq() > 0.001) {
        var angle = Math.atan2(dir.x, dir.z);
        ai.group.rotation.y = angle;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RACE POSITION CALCULATION
  ════════════════════════════════════════════════════════════════════════ */

  function calcPlayerPosition() {
    var playerProgress = (_lap - 1) * _gatesTotal + _currentGate;
    var ahead = 0;
    for (var a = 0; a < _aiDrones.length; a++) {
      var ai = _aiDrones[a];
      var aiProgress = (ai.lap - 1) * _gatesTotal + ai.gate;
      if (aiProgress > playerProgress) { ahead++; }
    }
    _playerPos = ahead + 1;
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIND ZONES
  ════════════════════════════════════════════════════════════════════════ */

  function applyWindZones(dt) {
    var dp = _droneGroup.position;
    for (var w = 0; w < _windZones.length; w++) {
      var wz   = _windZones[w];
      var dist = dp.distanceTo(wz.center);
      if (dist < wz.radius) {
        var factor = 1 - (dist / wz.radius);
        _velocity.addScaledVector(wz.wind, factor * dt);

        /* Spawn particle to visualize wind */
        if (Math.random() < 0.3) {
          spawnWindParticle(dp, wz.wind);
        }
      }
    }
  }

  function spawnWindParticle(pos, wind) {
    var geo  = new THREE.SphereGeometry(0.08, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({ color: 0x88BBFF, transparent: true, opacity: 0.6 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5) * 2;
    mesh.position.y += (Math.random() - 0.5) * 2;
    mesh.position.z += (Math.random() - 0.5) * 2;
    _scene.add(mesh);
    _particles.push({
      mesh:    mesh,
      life:    0,
      maxLife: 0.8 + Math.random() * 0.4,
      vel:     wind.clone().multiplyScalar(0.3)
    });
  }

  function updateParticles(dt) {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      var alpha = 1 - (p.life / p.maxLife);
      p.mesh.material.opacity = Math.max(0, alpha * 0.6);
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        _particles.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function formatTime(ms) {
    if (!isFinite(ms)) { return '--:--.---'; }
    var totalSec = Math.floor(ms / 1000);
    var minutes  = Math.floor(totalSec / 60);
    var seconds  = totalSec % 60;
    var millis   = Math.floor(ms % 1000);
    return (
      (minutes < 10 ? '0' : '') + minutes + ':' +
      (seconds < 10 ? '0' : '') + seconds + '.' +
      (millis  < 100 ? (millis < 10 ? '00' : '0') : '') + millis
    );
  }

  function ordinal(n) {
    if (n === 1) { return '1st'; }
    if (n === 2) { return '2nd'; }
    if (n === 3) { return '3rd'; }
    return n + 'th';
  }

  function updateHUD() {
    if (!_hud) { return; }

    var nowMs     = performance.now();
    var lapTimeMs = nowMs - _lapStartTime;
    var nitroStr  = _nitroActive ? 'ACTIVE' : (_nitroReady ? 'READY' : 'CHARGING');
    var bestStr   = formatTime(_bestLap);
    var gateStr   = _currentGate + '/' + _gatesTotal;
    var lapStr    = _lap + '/' + _totalLaps;

    var speedStr  = _speed.toFixed(1) + 'm/s';

    var status = '';
    if (_dnf)          { status = ' | DNF — 3 CRASHES'; }
    else if (_raceFinished) { status = ' | RACE COMPLETE!'; }

    _hud.textContent = (
      'DRONE RACE' +
      ' [LAP: ' + lapStr + ']' +
      ' [GATE: ' + gateStr + ']' +
      ' [TIME: ' + formatTime(lapTimeMs) + ']' +
      ' [NITRO: ' + nitroStr + ']' +
      ' [POS: ' + ordinal(_playerPos) + ']' +
      ' | BEST: ' + bestStr +
      ' | SPD: ' + speedStr +
      status
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     DRONE PHYSICS UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateDrone(dt) {
    if (_dnf || _raceFinished) { return; }

    /* Crash recovery */
    if (_crashSpinning) {
      _crashTimer -= dt;
      _droneGroup.rotation.x += _angularVel.x * dt;
      _droneGroup.rotation.y += _angularVel.y * dt;
      _droneGroup.rotation.z += _angularVel.z * dt;
      _angularVel.multiplyScalar(0.95);
      _velocity.multiplyScalar(0.9);
      _droneGroup.position.addScaledVector(_velocity, dt);
      if (_droneGroup.position.y < 0.5) {
        _droneGroup.position.y = 0.5;
        _velocity.y = Math.abs(_velocity.y) * 0.3;
      }
      if (_crashTimer <= 0) {
        _crashSpinning = false;
        _angularVel.set(0, 0, 0);
      }
      return;
    }

    /* Nitro timer management */
    if (_nitroActive) {
      _nitroTimer -= dt;
      if (_nitroTimer <= 0) {
        _nitroActive        = false;
        _nitroReady         = false;
        _nitroTimer         = _nitroRecharge;
        _nitroLight.intensity = 0;
      }
    } else if (!_nitroReady) {
      _nitroTimer -= dt;
      if (_nitroTimer <= 0) {
        _nitroReady = true;
      }
    }

    /* Activate nitro */
    if (_keys['ShiftLeft'] || _keys['ShiftRight']) {
      if (_nitroReady && !_nitroActive) {
        _nitroActive          = true;
        _nitroReady           = false;
        _nitroTimer           = _nitroDuration;
        _nitroLight.intensity = 3;
      }
    }

    /* Thrust factor */
    var thrustMult = _nitroActive ? 3.0 : 1.0;

    /* Control inputs → angular velocity */
    var pitchInput = 0;
    var yawInput   = 0;
    var rollInput  = 0;
    var throttle   = 0;

    if (_keys['KeyW'])          { pitchInput = -1; } /* nose down = forward */
    if (_keys['KeyS'])          { pitchInput =  1; }
    if (_keys['KeyA'])          { yawInput   =  1; }
    if (_keys['KeyD'])          { yawInput   = -1; }
    if (_keys['KeyQ'])          { rollInput  =  1; }
    if (_keys['KeyE'])          { rollInput  = -1; }
    if (_keys['ArrowUp'])       { throttle   =  1; }
    if (_keys['ArrowDown'])     { throttle   = -1; }

    var turnRate   = 2.5;
    var pitchRate  = 2.0;
    var rollRate   = 2.5;
    var damping    = 0.88;

    _angularVel.x += pitchInput * pitchRate * dt;
    _angularVel.y += yawInput   * turnRate  * dt;
    _angularVel.z += rollInput  * rollRate  * dt;

    /* Dampen angular velocity */
    _angularVel.multiplyScalar(damping);

    /* Apply rotation */
    _droneGroup.rotation.x += _angularVel.x * dt;
    _droneGroup.rotation.y += _angularVel.y * dt;
    _droneGroup.rotation.z += _angularVel.z * dt;

    /* Build drone's local up and forward from current rotation */
    var quaternion = _droneGroup.quaternion;
    var localUp      = new THREE.Vector3(0,  1, 0).applyQuaternion(quaternion);
    var localForward = new THREE.Vector3(0,  0, -1).applyQuaternion(quaternion);

    /* Thrust: up (lift) + forward (pitch-based) */
    var liftForce    = 9.0 * thrustMult;
    var forwardForce = 14.0 * thrustMult;
    var gravity      = -14.0;

    _velocity.addScaledVector(localUp,      liftForce    * throttle * dt);
    _velocity.addScaledVector(localForward, forwardForce * pitchInput * -dt);

    /* Gravity */
    _velocity.y += gravity * dt;

    /* Drag */
    _velocity.multiplyScalar(0.97);

    /* Wind zones */
    applyWindZones(dt);

    /* Move */
    _droneGroup.position.addScaledVector(_velocity, dt);

    /* Floor clamp */
    if (_droneGroup.position.y < 0.5) {
      _droneGroup.position.y = 0.5;
      if (_velocity.y < 0) { _velocity.y = 0; }
    }

    /* Update nitro light position */
    if (_nitroLight) {
      var behind = localForward.clone().multiplyScalar(-0.6);
      _nitroLight.position.copy(_droneGroup.position).add(behind);
    }

    /* Speed calculation */
    var dp   = _droneGroup.position;
    var prev = _prevPos;
    var dist = dp.distanceTo(prev);
    _speed = dist / dt;
    if (_speed > _maxSpeed) { _maxSpeed = _speed; }
    _prevPos = dp.clone();

    /* Spin rotors */
    var rotorSpeed = 15 + _speed * 0.5;
    for (var r = 0; r < _rotors.length; r++) {
      _rotors[r].rotation.y += rotorSpeed * dt;
    }

    /* Gate detection */
    checkGatePassage(dt);

    /* Crash detection */
    checkCrash();

    /* AI position calculation */
    calcPlayerPosition();
  }

  /* ════════════════════════════════════════════════════════════════════════
     CAMERA FOLLOW
  ════════════════════════════════════════════════════════════════════════ */

  function updateCamera() {
    if (!_camera || !_droneGroup) { return; }

    /* Follow camera — behind and above drone */
    var offset = new THREE.Vector3(0, 3, 8);
    offset.applyQuaternion(_droneGroup.quaternion);
    var target = _droneGroup.position.clone().add(offset);
    _camera.position.lerp(target, 0.1);
    _camera.lookAt(_droneGroup.position);
  }

  /* ════════════════════════════════════════════════════════════════════════
     KEY HANDLING & ACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;

    /* D + R simultaneous — 400ms window */
    if (e.code === 'KeyD' || e.code === 'KeyR') {
      _drPressTime[e.code === 'KeyD' ? 'D' : 'R'] = performance.now();
      var diff = Math.abs(_drPressTime['D'] - _drPressTime['R']);
      if (diff < DR_WINDOW * 1000 && _drPressTime['D'] > 0 && _drPressTime['R'] > 0) {
        launchRace();
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyD') { _drPressTime['D'] = 0; }
    if (e.code === 'KeyR') { _drPressTime['R'] = 0; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
  }

  function update(timestamp) {
    if (!_active) { return; }

    var dt = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime = timestamp;

    if (dt <= 0) { return; }

    updateDrone(dt);
    updateAI(dt);
    updateParticles(dt);
    updateCamera();
    updateHUD();
  }

  function reset() {
    _active = false;

    /* Remove player */
    if (_droneGroup) { _scene.remove(_droneGroup); _droneGroup = null; }
    if (_nitroLight) { _scene.remove(_nitroLight);  _nitroLight  = null; }

    /* Remove gates */
    for (var g = 0; g < _gates.length; g++) {
      _scene.remove(_gates[g].group);
    }
    _gates = [];

    /* Remove AI drones */
    for (var a = 0; a < _aiDrones.length; a++) {
      _scene.remove(_aiDrones[a].group);
    }
    _aiDrones = [];

    /* Remove obstacles */
    for (var o = 0; o < _obstacles.length; o++) {
      _scene.remove(_obstacles[o].mesh);
    }
    _obstacles = [];

    /* Remove particles */
    for (var p = 0; p < _particles.length; p++) {
      _scene.remove(_particles[p].mesh);
    }
    _particles = [];

    /* HUD */
    if (_hud) { _hud.style.display = 'none'; }

    /* Reset state */
    _keys        = {};
    _drPressTime = { D: 0, R: 0 };
    _velocity    = null;
    _angularVel  = null;
    _prevPos     = null;
    _rotors      = [];
  }

  return { init: init, update: update, reset: reset };

}());
