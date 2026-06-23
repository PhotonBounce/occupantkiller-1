/* ───────────────────────────────────────────────────────────────────────────
   RECON DRONE — X key deploys an autonomous quad-rotor reconnaissance drone
   Standalone IIFE module — all var, no let/const, Three.js as global THREE
   Public API: { init(scene, camera), update(delta), deployDrone(),
                 getTaggedEnemies(), reset() }
   ─────────────────────────────────────────────────────────────────────────── */
window.ReconDrone = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────────── */
  var MAX_DRONES        = 2;
  var BATTERY_MAX       = 45;      // seconds of flight time
  var DRONE_HP          = 50;
  var DRONE_ALTITUDE    = 12;      // units above spawn Y
  var SPIRAL_AREA       = 80;      // world units covered (80×80)
  var SPIRAL_DURATION   = 25;      // seconds for one full spiral sweep
  var CAMERA_CONE_HALF  = 0.6;     // radians — half-angle of nadir cone
  var TAG_DURATION      = 10;      // seconds tagged enemies stay highlighted
  var DETECT_RANGE      = 28;      // horizontal units for enemy detection
  var RECALL_SPEED      = 18;      // units/second on return flight
  var CRUISE_SPEED      = 6;       // units/second along spiral
  var ROTOR_SPIN        = 22;      // rad/s rotor rotation
  var SMOKE_INTERVAL    = 0.08;    // seconds between death smoke puffs
  var MINIMAP_SIZE      = 120;     // px
  var AUDIO_FREQ_BASE   = 180;     // Hz rotor buzz
  var AUDIO_FREQ_VARY   = 30;      // Hz swing based on speed
  var LOW_BATTERY_WARN  = 10;      // seconds — flash red below this

  /* ── Private state ─────────────────────────────────────────────────────── */
  var _scene            = null;
  var _camera           = null;
  var _drones           = [];      // array of live drone objects
  var _taggedMap        = {};      // keyed by enemy._reconId -> entry
  var _reconIdSeq       = 0;
  var _smokeParticles   = [];      // [{mesh, life, vel}]
  var _initialized      = false;

  /* HUD / minimap DOM */
  var _hudEl            = null;
  var _batteryBarEl     = null;
  var _batteryFillEl    = null;
  var _minimapEl        = null;
  var _minimapCtx       = null;
  var _toastEl          = null;
  var _toastQueue       = [];

  /* Web Audio */
  var _audioCtx         = null;

  /* ── Time helper ───────────────────────────────────────────────────────── */
  function _now() {
    return (typeof performance !== 'undefined') ? performance.now() : Date.now();
  }

  /* ── Notifications ─────────────────────────────────────────────────────── */
  function _notify(msg, color) {
    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg, color || '#00ccff');
    }
  }

  function _ensureToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'recon-drone-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:28%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffe600',
      'font:bold 18px/1.4 monospace',
      'text-shadow:0 0 8px #ff8800',
      'pointer-events:none',
      'z-index:10001',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function _showToast(msg) {
    _ensureToast();
    _toastQueue.push({ msg: msg, born: _now() });
  }

  function _tickToast() {
    if (!_toastEl) return;
    var nowMs = _now();
    var i;
    for (i = _toastQueue.length - 1; i >= 0; i--) {
      if (nowMs - _toastQueue[i].born > 2500) {
        _toastQueue.splice(i, 1);
      }
    }
    var lines = [];
    for (i = _toastQueue.length - 1; i >= 0; i--) {
      lines.push(_toastQueue[i].msg);
    }
    _toastEl.innerHTML = lines.join('<br>');
  }

  /* ── Audio ─────────────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (ignore) { /* audio unavailable */ }
    }
    return _audioCtx;
  }

  function _createRotorSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return null;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(AUDIO_FREQ_BASE, ctx.currentTime);
      gain.gain.setValueAtTime(0.055, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      return { osc: osc, gain: gain };
    } catch (ignore) {
      return null;
    }
  }

  function _setRotorFreq(audioNode, speed) {
    if (!audioNode || !_audioCtx) return;
    var freq = AUDIO_FREQ_BASE + (speed / CRUISE_SPEED) * AUDIO_FREQ_VARY;
    try {
      audioNode.osc.frequency.setValueAtTime(freq, _audioCtx.currentTime);
    } catch (ignore) { /* ignore */ }
  }

  function _stopRotorSound(audioNode) {
    if (!audioNode) return;
    try {
      audioNode.gain.gain.setValueAtTime(0, _audioCtx.currentTime);
      audioNode.osc.stop(_audioCtx.currentTime + 0.1);
    } catch (ignore) { /* ignore */ }
  }

  /* ── Drone mesh ────────────────────────────────────────────────────────── */
  function _buildDroneMesh() {
    var group = new THREE.Group();

    /* central body — flat box */
    var bodyGeo = new THREE.BoxGeometry(0.6, 0.18, 0.6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    /* 4 arm spokes with rotor discs */
    var armDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    var rotorMeshes = [];
    var i;
    for (i = 0; i < 4; i++) {
      var ax = armDirs[i][0];
      var az = armDirs[i][1];
      var armLen = 0.65;

      /* spoke */
      var armGeo = new THREE.BoxGeometry(
        ax !== 0 ? armLen : 0.08,
        0.07,
        ax !== 0 ? 0.08 : armLen
      );
      var armMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
      var arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(ax * armLen * 0.5, 0, az * armLen * 0.5);
      group.add(arm);

      /* motor housing at tip */
      var motorGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.10, 7);
      var motorMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
      var motor = new THREE.Mesh(motorGeo, motorMat);
      motor.position.set(ax * armLen, 0, az * armLen);
      group.add(motor);

      /* rotor disc (flat cylinder) */
      var rotorGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.025, 10);
      var rotorMat = new THREE.MeshLambertMaterial({
        color: 0x334455,
        transparent: true,
        opacity: 0.75
      });
      var rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(ax * armLen, 0.07, az * armLen);
      group.add(rotor);
      rotorMeshes.push(rotor);
    }

    /* camera pod underneath */
    var camGeo = new THREE.SphereGeometry(0.13, 8, 6);
    var camMat = new THREE.MeshLambertMaterial({ color: 0x080808 });
    var camPod = new THREE.Mesh(camGeo, camMat);
    camPod.position.set(0, -0.18, 0);
    group.add(camPod);

    /* lens glint */
    var lensGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 6);
    var lensMat = new THREE.MeshLambertMaterial({
      color: 0x003366,
      emissive: 0x002255
    });
    var lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.28, 0.06);
    group.add(lens);

    /* running light */
    var runLight = new THREE.PointLight(0x00aaff, 0.5, 5);
    runLight.position.set(0, 0.1, 0);
    group.add(runLight);

    return { group: group, rotorMeshes: rotorMeshes };
  }

  /* ── Spiral path ───────────────────────────────────────────────────────── */
  /* t in [0,1] → {x,z} offset from spawn */
  function _spiralOffset(t) {
    var turns = 4;
    var angle = t * turns * 2 * Math.PI;
    var radius = t * (SPIRAL_AREA * 0.5);
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
  }

  /* ── Enemy helpers ─────────────────────────────────────────────────────── */
  function _getEnemies() {
    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      return window.Enemies.getAll() || [];
    }
    if (Array.isArray(window.enemies)) return window.enemies;
    if (Array.isArray(window._enemies)) return window._enemies;
    return [];
  }

  function _isDead(enemy) {
    return (enemy.hp !== undefined && enemy.hp <= 0) ||
           (enemy.alive !== undefined && !enemy.alive) ||
           (enemy.dead !== undefined && enemy.dead);
  }

  function _ensureReconId(enemy) {
    if (enemy._reconId === undefined) {
      enemy._reconId = ++_reconIdSeq;
    }
    return enemy._reconId;
  }

  /* Is the enemy inside the drone's downward-facing camera cone? */
  function _inCameraCone(dronePos, enemyPos) {
    var dx = enemyPos.x - dronePos.x;
    var dz = enemyPos.z - dronePos.z;
    var dy = dronePos.y - enemyPos.y; /* drone is above */
    if (dy <= 0) return false;
    var horizDist = Math.sqrt(dx * dx + dz * dz);
    var halfConeRadius = Math.tan(CAMERA_CONE_HALF) * dy;
    return horizDist <= halfConeRadius && horizDist <= DETECT_RANGE;
  }

  /* Tag or refresh an enemy */
  function _tagEnemy(enemy) {
    var id = _ensureReconId(enemy);
    var nowMs = _now();
    if (!_taggedMap[id]) {
      /* save original color */
      var origColor = null;
      if (enemy.mesh && enemy.mesh.material && enemy.mesh.material.color) {
        origColor = enemy.mesh.material.color.getHex();
      }
      _taggedMap[id] = {
        enemy: enemy,
        taggedUntil: nowMs + TAG_DURATION * 1000,
        originalColor: origColor,
        killConfirmed: false
      };
    } else {
      /* refresh timer */
      _taggedMap[id].taggedUntil = nowMs + TAG_DURATION * 1000;
    }
    /* apply glowing yellow highlight */
    if (enemy.mesh && enemy.mesh.material && enemy.mesh.material.color) {
      enemy.mesh.material.color.setHex(0xffee00);
    }
  }

  function _tickTaggedEnemies() {
    var nowMs = _now();
    var id;
    for (id in _taggedMap) {
      if (!_taggedMap.hasOwnProperty(id)) continue;
      var entry = _taggedMap[id];
      if (nowMs > entry.taggedUntil) {
        /* restore original color */
        if (entry.enemy && entry.enemy.mesh && entry.enemy.mesh.material &&
            entry.enemy.mesh.material.color && entry.originalColor !== null) {
          entry.enemy.mesh.material.color.setHex(entry.originalColor);
        }
        delete _taggedMap[id];
      } else {
        /* pulse yellow glow */
        if (entry.enemy && entry.enemy.mesh && entry.enemy.mesh.material &&
            entry.enemy.mesh.material.color) {
          var pulse = Math.sin(_now() * 0.006) * 0.5 + 0.5;
          entry.enemy.mesh.material.color.setRGB(1.0, (0.7 + pulse * 0.3), 0.0);
        }
      }
    }
  }

  function _checkKillConfirmations() {
    var id;
    for (id in _taggedMap) {
      if (!_taggedMap.hasOwnProperty(id)) continue;
      var entry = _taggedMap[id];
      if (!entry.killConfirmed && entry.enemy && _isDead(entry.enemy)) {
        entry.killConfirmed = true;
        _showToast('+RECON KILL');
        _notify('+RECON KILL', '#ffe600');
      }
    }
  }

  /* Purge all tags and restore colors (used on reset) */
  function _clearAllTags() {
    var id;
    for (id in _taggedMap) {
      if (!_taggedMap.hasOwnProperty(id)) continue;
      var entry = _taggedMap[id];
      if (entry.enemy && entry.enemy.mesh && entry.enemy.mesh.material &&
          entry.enemy.mesh.material.color && entry.originalColor !== null) {
        entry.enemy.mesh.material.color.setHex(entry.originalColor);
      }
    }
    _taggedMap = {};
  }

  /* ── Smoke particles ───────────────────────────────────────────────────── */
  function _spawnSmoke(pos) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 5, 4);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.55
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _smokeParticles.push({
      mesh: mesh,
      life: 1.2,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        1.5 + Math.random(),
        (Math.random() - 0.5) * 1.5
      )
    });
  }

  function _tickSmoke(delta) {
    var i;
    for (i = _smokeParticles.length - 1; i >= 0; i--) {
      var s = _smokeParticles[i];
      s.life -= delta;
      if (s.life <= 0) {
        if (_scene) _scene.remove(s.mesh);
        _smokeParticles.splice(i, 1);
      } else {
        s.mesh.position.addScaledVector(s.vel, delta);
        s.mesh.material.opacity = Math.max(0, s.life * 0.45);
      }
    }
  }

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'recon-drone-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:18px',
      'right:18px',
      'background:rgba(0,0,0,0.70)',
      'color:#00ccff',
      'font:bold 12px/1.5 monospace',
      'padding:7px 11px',
      'border-radius:5px',
      'border:1px solid rgba(0,200,255,0.35)',
      'pointer-events:none',
      'z-index:9900',
      'min-width:145px'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* battery progress bar */
    _batteryBarEl = document.createElement('div');
    _batteryBarEl.id = 'recon-drone-batt-bar';
    _batteryBarEl.style.cssText = [
      'position:fixed',
      'top:90px',
      'right:18px',
      'width:145px',
      'height:7px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid #005577',
      'border-radius:3px',
      'z-index:9900',
      'pointer-events:none',
      'display:none'
    ].join(';');
    _batteryFillEl = document.createElement('div');
    _batteryFillEl.style.cssText = [
      'height:100%',
      'background:#00ccff',
      'border-radius:2px',
      'width:100%'
    ].join(';');
    _batteryBarEl.appendChild(_batteryFillEl);
    document.body.appendChild(_batteryBarEl);
  }

  function _createMinimap() {
    if (_minimapEl) return;
    _minimapEl = document.createElement('canvas');
    _minimapEl.id = 'recon-drone-minimap';
    _minimapEl.width = MINIMAP_SIZE;
    _minimapEl.height = MINIMAP_SIZE;
    _minimapEl.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'right:12px',
      'width:' + MINIMAP_SIZE + 'px',
      'height:' + MINIMAP_SIZE + 'px',
      'border:2px solid #00ccff',
      'border-radius:4px',
      'background:#080c10',
      'z-index:9800',
      'pointer-events:none',
      'box-shadow:0 0 10px rgba(0,200,255,0.35)',
      'display:none'
    ].join(';');
    document.body.appendChild(_minimapEl);
    _minimapCtx = _minimapEl.getContext('2d');
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var activeDrones = 0;
    var i;
    for (i = 0; i < _drones.length; i++) {
      if (_drones[i].state !== 'dead') activeDrones++;
    }

    var taggedCount = 0;
    var id;
    for (id in _taggedMap) {
      if (_taggedMap.hasOwnProperty(id)) taggedCount++;
    }

    /* battery from first active drone */
    var battSecs = 0;
    var battPct = 0;
    for (i = 0; i < _drones.length; i++) {
      if (_drones[i].state !== 'dead') {
        battSecs = _drones[i].battery;
        battPct = Math.round((battSecs / BATTERY_MAX) * 100);
        break;
      }
    }

    _hudEl.innerHTML = [
      'RECON DRONE',
      'DRONES: ' + activeDrones + '/' + MAX_DRONES,
      (activeDrones > 0 ? 'BATTERY: ' + battPct + '%' : ''),
      'TAGGED: ' + taggedCount
    ].filter(Boolean).join('<br>');

    /* battery bar */
    if (activeDrones > 0) {
      _batteryBarEl.style.display = 'block';
      _batteryFillEl.style.width = battPct + '%';
      if (battSecs <= LOW_BATTERY_WARN) {
        var flash = (Math.floor(_now() / 300) % 2 === 0);
        _batteryFillEl.style.background = flash ? '#ff2200' : '#550000';
      } else {
        _batteryFillEl.style.background = '#00ccff';
      }
    } else {
      _batteryBarEl.style.display = 'none';
    }

    /* minimap visibility */
    if (_minimapEl) {
      _minimapEl.style.display = activeDrones > 0 ? 'block' : 'none';
    }
  }

  /* ── Minimap drawing ───────────────────────────────────────────────────── */
  function _drawMinimap(drone) {
    if (!_minimapCtx || !drone || !_camera) return;

    var ctx = _minimapCtx;
    var W = MINIMAP_SIZE;
    var H = MINIMAP_SIZE;
    var center = drone.mesh.position;
    var mapRadius = SPIRAL_AREA * 0.55;
    var scale = (W * 0.5) / mapRadius;

    /* background */
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, W, H);

    /* grid */
    ctx.strokeStyle = 'rgba(0,180,255,0.10)';
    ctx.lineWidth = 0.5;
    var step = W / 6;
    var g;
    for (g = 0; g <= W; g += step) {
      ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(W, g); ctx.stroke();
    }

    /* VoxelWorld building outlines (white blobs via sampling) */
    if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.getBlock) {
      var sampleStep = 5;
      var wx, wz;
      for (wx = -mapRadius; wx < mapRadius; wx += sampleStep) {
        for (wz = -mapRadius; wz < mapRadius; wz += sampleStep) {
          var block = window.VoxelWorld.getBlock(
            Math.round(center.x + wx),
            Math.round(center.y),
            Math.round(center.z + wz)
          );
          if (block && block !== 0) {
            ctx.fillStyle = 'rgba(200,220,255,0.22)';
            ctx.fillRect(
              W * 0.5 + wx * scale - 1.5,
              H * 0.5 + wz * scale - 1.5,
              3, 3
            );
          }
        }
      }
    }

    /* enemy blips */
    var enemies = _getEnemies();
    var i;
    for (i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy || !enemy.mesh || _isDead(enemy)) continue;
      var ep = enemy.mesh.position;
      var ex = W * 0.5 + (ep.x - center.x) * scale;
      var ez = H * 0.5 + (ep.z - center.z) * scale;
      if (ex < 1 || ex > W - 1 || ez < 1 || ez > H - 1) continue;

      var isTagged = (enemy._reconId !== undefined && _taggedMap[enemy._reconId]);
      ctx.beginPath();
      ctx.arc(ex, ez, isTagged ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isTagged ? '#ffee00' : '#ff3333';
      ctx.fill();
      if (isTagged) {
        ctx.strokeStyle = 'rgba(255,220,0,0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    /* player position — blue dot */
    var playerPos = _camera.position;
    var ppx = W * 0.5 + (playerPos.x - center.x) * scale;
    var ppz = H * 0.5 + (playerPos.z - center.z) * scale;
    ppx = Math.max(3, Math.min(W - 3, ppx));
    ppz = Math.max(3, Math.min(H - 3, ppz));
    ctx.beginPath();
    ctx.arc(ppx, ppz, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4488ff';
    ctx.fill();
    ctx.strokeStyle = '#88bbff';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* drone position — cyan diamond */
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.5 - 5);
    ctx.lineTo(W * 0.5 + 4, H * 0.5);
    ctx.lineTo(W * 0.5, H * 0.5 + 5);
    ctx.lineTo(W * 0.5 - 4, H * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#00ffee';
    ctx.fill();

    /* label */
    ctx.fillStyle = 'rgba(0,200,255,0.65)';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('RECON', 4, 10);
  }

  /* ── Deploy a new drone ────────────────────────────────────────────────── */
  function deployDrone() {
    if (!_initialized || !_scene || !_camera) {
      _notify('RECON DRONE: not initialized', '#ff4400');
      return;
    }
    if (_drones.length >= MAX_DRONES) {
      _notify('RECON DRONE: max ' + MAX_DRONES + ' drones active', '#ff8800');
      return;
    }

    var spawnPos = _camera.position.clone();
    var meshData = _buildDroneMesh();
    meshData.group.position.copy(spawnPos);
    meshData.group.position.y += 1;
    _scene.add(meshData.group);

    var audioNode = _createRotorSound();

    var drone = {
      mesh        : meshData.group,
      rotorMeshes : meshData.rotorMeshes,
      spawnPos    : spawnPos.clone(),
      hp          : DRONE_HP,
      battery     : BATTERY_MAX,
      state       : 'climbing',   /* climbing | patrol | recalling | dead */
      spiralT     : 0,
      smokeTimer  : 0,
      audioNode   : audioNode,
      born        : _now()
    };

    _drones.push(drone);
    _notify('RECON DRONE DEPLOYED — ' + BATTERY_MAX + 's | X to recall', '#00ccff');
    _updateHUD();
  }

  /* ── Recall / destroy helpers ──────────────────────────────────────────── */
  function _recallDrone(drone) {
    if (drone.state === 'dead' || drone.state === 'recalling') return;
    drone.state = 'recalling';
    _notify('RECON DRONE: recalling...', '#ffaa00');
  }

  function _destroyDrone(drone) {
    if (drone.state === 'dead') return;
    drone.state = 'dead';
    _stopRotorSound(drone.audioNode);
    if (typeof window.StageVFX !== 'undefined' && window.StageVFX.spawnExplosion) {
      window.StageVFX.spawnExplosion(drone.mesh.position.clone(), 1.2);
    }
    _notify('RECON DRONE SHOT DOWN!', '#ff2200');
  }

  function _removeDroneFromList(drone) {
    _stopRotorSound(drone.audioNode);
    if (_scene) _scene.remove(drone.mesh);
    var idx = _drones.indexOf(drone);
    if (idx >= 0) _drones.splice(idx, 1);
    _updateHUD();
  }

  /* ── Key handler ───────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.code !== 'KeyX' && e.key !== 'x' && e.key !== 'X') return;

    /* prefer recall over deploy when drones are active */
    var i;
    for (i = 0; i < _drones.length; i++) {
      if (_drones[i].state !== 'dead' && _drones[i].state !== 'recalling') {
        _recallDrone(_drones[i]);
        return;
      }
    }
    /* otherwise deploy a new one */
    deployDrone();
  }

  /* ── Per-drone update ──────────────────────────────────────────────────── */
  function _updateDrone(drone, delta) {
    var nowMs = _now();

    /* spin rotors */
    var ri;
    for (ri = 0; ri < drone.rotorMeshes.length; ri++) {
      drone.rotorMeshes[ri].rotation.y += ROTOR_SPIN * delta;
    }

    /* gentle hover bob */
    drone.mesh.position.y += Math.sin(nowMs * 0.003 + drone.born * 0.001) * 0.003;

    /* ── State: climbing ── */
    if (drone.state === 'climbing') {
      var targetY = drone.spawnPos.y + DRONE_ALTITUDE;
      drone.mesh.position.y += (targetY - drone.mesh.position.y) * 3.5 * delta;
      if (Math.abs(drone.mesh.position.y - targetY) < 0.5) {
        drone.state = 'patrol';
      }
    }

    /* ── State: patrol (spiral) ── */
    if (drone.state === 'patrol') {
      drone.spiralT += delta / SPIRAL_DURATION;
      if (drone.spiralT > 1) drone.spiralT -= 1;

      var offset = _spiralOffset(drone.spiralT);
      var tgtX = drone.spawnPos.x + offset.x;
      var tgtZ = drone.spawnPos.z + offset.z;
      var tgtY = drone.spawnPos.y + DRONE_ALTITUDE;

      var dx = tgtX - drone.mesh.position.x;
      var dz = tgtZ - drone.mesh.position.z;
      var hdist = Math.sqrt(dx * dx + dz * dz);
      var spd = Math.min(CRUISE_SPEED, hdist / (delta + 0.0001));

      if (hdist > 0.1) {
        drone.mesh.position.x += (dx / hdist) * spd * delta;
        drone.mesh.position.z += (dz / hdist) * spd * delta;
      }
      drone.mesh.position.y += (tgtY - drone.mesh.position.y) * 2 * delta;

      if (hdist > 0.5) {
        drone.mesh.rotation.y = Math.atan2(dx, dz);
      }

      _setRotorFreq(drone.audioNode, spd);

      /* scan for enemies in camera cone */
      var enemies = _getEnemies();
      var ei;
      for (ei = 0; ei < enemies.length; ei++) {
        var enemy = enemies[ei];
        if (!enemy || !enemy.mesh || _isDead(enemy)) continue;
        if (_inCameraCone(drone.mesh.position, enemy.mesh.position)) {
          _tagEnemy(enemy);
        }
      }

      /* drain battery */
      drone.battery -= delta;
      if (drone.battery <= 0) {
        drone.battery = 0;
        _notify('RECON DRONE: battery dead — recalling', '#ff4400');
        drone.state = 'recalling';
      }
    }

    /* ── State: recalling ── */
    if (drone.state === 'recalling') {
      var rTarget = _camera.position.clone();
      var rdx = rTarget.x - drone.mesh.position.x;
      var rdy = rTarget.y - drone.mesh.position.y;
      var rdz = rTarget.z - drone.mesh.position.z;
      var rdist = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);

      if (rdist < 1.2) {
        _removeDroneFromList(drone);
        return; /* drone removed */
      }

      var rSpd = RECALL_SPEED * delta;
      drone.mesh.position.x += (rdx / rdist) * rSpd;
      drone.mesh.position.y += (rdy / rdist) * rSpd;
      drone.mesh.position.z += (rdz / rdist) * rSpd;
      _setRotorFreq(drone.audioNode, RECALL_SPEED);
    }

    /* ── State: dead (falling + smoke) ── */
    if (drone.state === 'dead') {
      drone.mesh.position.y -= 8 * delta;
      drone.mesh.rotation.z += 2 * delta;

      drone.smokeTimer -= delta;
      if (drone.smokeTimer <= 0) {
        drone.smokeTimer = SMOKE_INTERVAL;
        _spawnSmoke(drone.mesh.position);
      }

      if (drone.mesh.position.y < drone.spawnPos.y - 4) {
        _removeDroneFromList(drone);
        /* no return needed — index shifts handled by caller iterating backwards */
      }
    }
  }

  /* ── Public: init ──────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene = scene || null;
    _camera = camera || null;

    _createHUD();
    _createMinimap();

    if (!window._reconDroneKeyBound) {
      window.addEventListener('keydown', _onKeyDown, false);
      window._reconDroneKeyBound = true;
    }

    _initialized = true;
  }

  /* ── Public: update (delta = seconds) ─────────────────────────────────── */
  function update(delta) {
    if (!_initialized) return;
    if (!delta || delta <= 0) delta = 0.016;

    _tickTaggedEnemies();
    _checkKillConfirmations();
    _tickSmoke(delta);
    _tickToast();

    /* iterate backwards so splice inside _updateDrone is safe */
    var i;
    for (i = _drones.length - 1; i >= 0; i--) {
      _updateDrone(_drones[i], delta);
    }

    /* draw minimap from first active drone */
    var minimapDrone = null;
    for (i = 0; i < _drones.length; i++) {
      if (_drones[i].state !== 'dead') {
        minimapDrone = _drones[i];
        break;
      }
    }
    if (minimapDrone) {
      _drawMinimap(minimapDrone);
    }

    _updateHUD();
  }

  /* ── Public: getTaggedEnemies ──────────────────────────────────────────── */
  function getTaggedEnemies() {
    var result = [];
    var id;
    for (id in _taggedMap) {
      if (_taggedMap.hasOwnProperty(id)) {
        result.push(_taggedMap[id].enemy);
      }
    }
    return result;
  }

  /* ── Public: takeDamage (external — e.g. enemy bullet hits drone) ──────── */
  function takeDamage(droneIndex, amount) {
    var drone = _drones[droneIndex];
    if (!drone || drone.state === 'dead') return;
    drone.hp -= (amount || 10);
    if (drone.hp <= 0) {
      _destroyDrone(drone);
    }
  }

  /* ── Public: reset ─────────────────────────────────────────────────────── */
  function reset() {
    var i;
    for (i = 0; i < _drones.length; i++) {
      _stopRotorSound(_drones[i].audioNode);
      if (_scene) _scene.remove(_drones[i].mesh);
    }
    _drones = [];

    _clearAllTags();

    for (i = _smokeParticles.length - 1; i >= 0; i--) {
      if (_scene) _scene.remove(_smokeParticles[i].mesh);
    }
    _smokeParticles = [];
    _toastQueue = [];

    _updateHUD();
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  return {
    init             : init,
    update           : update,
    deployDrone      : deployDrone,
    getTaggedEnemies : getTaggedEnemies,
    takeDamage       : takeDamage,
    reset            : reset
  };

}());
