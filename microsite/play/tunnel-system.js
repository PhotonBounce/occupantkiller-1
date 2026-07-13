window.TunnelSystem = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _underground = false;
  var _audioCtx = null;
  var _rumbleNode = null;
  var _rumbleGain = null;

  // tunnel geometry
  var _segments = [];   // { mesh, startPt, endPt, lights[], collapsed, rats[], charges[] }
  var _trapdoors = [];  // { mesh, pos, segIdx, discovered }
  var _caches   = [];   // { mesh, type:'ammo'|'med', collected }

  // HUD elements
  var _mapCanvas = null;
  var _mapCtx    = null;
  var _compassEl = null;
  var _scorePopEl = null;

  // charge state
  var _chargePlaced   = false;
  var _chargeTimer    = 0;
  var _chargeSegIdx   = -1;

  // key state
  var _keys = {};

  // score ref (tries window.GameState or falls back to local)
  var _score = 0;

  // ── constants ──────────────────────────────────────────────────────────────
  var TUNNEL_W   = 2;
  var TUNNEL_H   = 2;
  var TUNNEL_LEN = 20;
  var TUNNEL_Y   = -5;
  var LIGHT_INTERVAL = 8;
  var TRAPDOOR_SIZE  = 2;
  var ENTRY_RADIUS   = 2.5;   // distance to trigger E
  var CHARGE_TIME    = 5;     // seconds

  // materials (created lazily after scene is set)
  var _stoneMat  = null;
  var _woodMat   = null;
  var _dirtMat   = null;

  // ── helpers ────────────────────────────────────────────────────────────────
  function _makeMaterials() {
    if (_stoneMat) return;
    _stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    _woodMat  = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    _dirtMat  = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
  }

  function _v3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _camXZ() {
    return { x: _camera.position.x, z: _camera.position.z };
  }

  function _addScore(n, label) {
    _score += n;
    if (window.GameState && typeof window.GameState.addScore === 'function') {
      window.GameState.addScore(n);
    }
    _showScorePop('+' + n + ' ' + label);
  }

  function _showScorePop(txt) {
    if (!_scorePopEl) return;
    _scorePopEl.textContent = txt;
    _scorePopEl.style.opacity = '1';
    clearTimeout(_scorePopEl._t);
    _scorePopEl._t = setTimeout(function () {
      _scorePopEl.style.opacity = '0';
    }, 2000);
  }

  // ── audio ──────────────────────────────────────────────────────────────────
  function _initAudio() {
    try {
      _audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      _rumbleGain = _audioCtx.createGain();
      _rumbleGain.gain.value = 0;
      _rumbleGain.connect(_audioCtx.destination);

      _rumbleNode = _audioCtx.createOscillator();
      _rumbleNode.type = 'sine';
      _rumbleNode.frequency.value = 55;

      var filter = _audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;

      _rumbleNode.connect(filter);
      filter.connect(_rumbleGain);
      _rumbleNode.start();
    } catch (e) {
      // audio not available — ignore
    }
  }

  function _setUndergroundAudio(on) {
    if (!_rumbleGain) return;
    var target = on ? 0.18 : 0;
    _rumbleGain.gain.setTargetAtTime(target, _audioCtx.currentTime, 0.5);
    // surface audio reduction: expose a global gain flag other systems can read
    window.TunnelSystem._surfaceVolumeMult = on ? 0.4 : 1.0;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    // tunnel map canvas
    _mapCanvas       = document.createElement('canvas');
    _mapCanvas.id    = 'tunnel-map';
    _mapCanvas.width  = 200;
    _mapCanvas.height = 200;
    _mapCanvas.style.cssText = [
      'position:fixed', 'bottom:10px', 'right:10px',
      'background:rgba(0,0,0,0.65)', 'border:1px solid #555',
      'display:none', 'z-index:500'
    ].join(';');
    document.body.appendChild(_mapCanvas);
    _mapCtx = _mapCanvas.getContext('2d');

    // compass arrow
    _compassEl      = document.createElement('div');
    _compassEl.id   = 'tunnel-compass';
    _compassEl.style.cssText = [
      'position:fixed', 'bottom:220px', 'right:85px',
      'width:30px', 'height:30px', 'display:none',
      'font-size:24px', 'text-align:center', 'z-index:500',
      'color:#FFD700', 'text-shadow:0 0 4px #000'
    ].join(';');
    _compassEl.textContent = '↑';
    document.body.appendChild(_compassEl);

    // score popup
    _scorePopEl      = document.createElement('div');
    _scorePopEl.id   = 'tunnel-score-pop';
    _scorePopEl.style.cssText = [
      'position:fixed', 'top:40%', 'left:50%',
      'transform:translateX(-50%)',
      'color:#FFD700', 'font-size:22px', 'font-weight:bold',
      'text-shadow:0 0 6px #000', 'opacity:0',
      'transition:opacity 0.5s', 'z-index:600',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_scorePopEl);
  }

  function _updateMap() {
    if (!_underground || !_mapCtx) return;
    var W = _mapCanvas.width, H = _mapCanvas.height;
    _mapCtx.clearRect(0, 0, W, H);

    // compute bounding box of all entry points
    var minX =  Infinity, maxX = -Infinity;
    var minZ =  Infinity, maxZ = -Infinity;
    for (var i = 0; i < _trapdoors.length; i++) {
      var p = _trapdoors[i].pos;
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    }
    var rangeX = Math.max(maxX - minX, 1);
    var rangeZ = Math.max(maxZ - minZ, 1);
    var pad = 20;

    function toMapX(wx) { return pad + (wx - minX) / rangeX * (W - 2 * pad); }
    function toMapZ(wz) { return pad + (wz - minZ) / rangeZ * (H - 2 * pad); }

    // draw segments
    _mapCtx.strokeStyle = '#888';
    _mapCtx.lineWidth   = 4;
    for (var s = 0; s < _segments.length; s++) {
      var seg = _segments[s];
      if (seg.collapsed) { _mapCtx.strokeStyle = '#440'; }
      else               { _mapCtx.strokeStyle = '#888'; }
      _mapCtx.beginPath();
      _mapCtx.moveTo(toMapX(seg.startPt.x), toMapZ(seg.startPt.z));
      _mapCtx.lineTo(toMapX(seg.endPt.x),   toMapZ(seg.endPt.z));
      _mapCtx.stroke();
    }

    // draw trapdoors
    for (var t = 0; t < _trapdoors.length; t++) {
      var td = _trapdoors[t];
      _mapCtx.fillStyle = td.discovered ? '#8B4513' : '#555';
      _mapCtx.fillRect(toMapX(td.pos.x) - 4, toMapZ(td.pos.z) - 4, 8, 8);
    }

    // draw player
    var cp = _camera.position;
    _mapCtx.fillStyle = '#0F0';
    _mapCtx.beginPath();
    _mapCtx.arc(toMapX(cp.x), toMapZ(cp.z), 5, 0, Math.PI * 2);
    _mapCtx.fill();
  }

  function _updateCompass() {
    if (!_underground || !_compassEl) return;
    var nearest = _nearestTrapdoor();
    if (!nearest) return;
    var dx = nearest.pos.x - _camera.position.x;
    var dz = nearest.pos.z - _camera.position.z;
    // camera yaw from quaternion
    var euler = new THREE.Euler().setFromQuaternion(_camera.quaternion, 'YXZ');
    var yaw   = euler.y;
    var angle = Math.atan2(dx, dz) - yaw;
    _compassEl.style.transform = 'rotate(' + (-angle * 180 / Math.PI) + 'deg)';
  }

  function _nearestTrapdoor() {
    var best = null, bestD = Infinity;
    var cp = _camera.position;
    for (var i = 0; i < _trapdoors.length; i++) {
      var d = _dist2D(cp.x, cp.z, _trapdoors[i].pos.x, _trapdoors[i].pos.z);
      if (d < bestD) { bestD = d; best = _trapdoors[i]; }
    }
    return best;
  }

  // ── network spawning ───────────────────────────────────────────────────────
  function spawnNetwork(ox, oz) {
    _makeMaterials();
    ox = ox || 0; oz = oz || 0;

    // 4 entry points arranged roughly in an L/diamond
    var entries = [
      _v3(ox,       0, oz),
      _v3(ox + 25,  0, oz + 5),
      _v3(ox + 10,  0, oz + 25),
      _v3(ox - 10,  0, oz + 15)
    ];

    // Create trapdoors at each entry point
    for (var e = 0; e < entries.length; e++) {
      _makeTrapdoor(entries[e], e);
    }

    // 3 segments connecting the 4 entries in a chain (0→1, 1→2, 2→3)
    var connections = [[0, 1], [1, 2], [2, 3]];
    for (var c = 0; c < connections.length; c++) {
      var aIdx = connections[c][0];
      var bIdx = connections[c][1];
      _makeSegment(entries[aIdx], entries[bIdx], c);
    }
  }

  function _makeTrapdoor(pos, idx) {
    var geo  = new THREE.BoxGeometry(TRAPDOOR_SIZE, 0.1, TRAPDOOR_SIZE);
    var mesh = new THREE.Mesh(geo, _woodMat);
    mesh.position.set(pos.x, 0.05, pos.z);
    _scene.add(mesh);

    _trapdoors.push({
      mesh:       mesh,
      pos:        pos.clone(),
      segIdx:     idx,
      discovered: false
    });
  }

  function _makeSegment(startPt, endPt, idx) {
    // Compute midpoint and orientation
    var mid = new THREE.Vector3().addVectors(startPt, endPt).multiplyScalar(0.5);
    mid.y = TUNNEL_Y;

    var dir = new THREE.Vector3().subVectors(endPt, startPt);
    var len = dir.length();
    dir.normalize();

    // Tunnel box (open-ended visual — just walls + floor + ceiling via BoxGeometry)
    // We build the tunnel as a hollow box using 5 planes: floor, ceiling, left, right, back
    var group = new THREE.Group();

    var halfLen = len / 2;

    // floor
    group.add(_plane(len, TUNNEL_W, 0,            -TUNNEL_H / 2, 0,          0, 0));
    // ceiling
    group.add(_plane(len, TUNNEL_W, 0,             TUNNEL_H / 2, 0,          Math.PI, 0));
    // left wall
    group.add(_plane(len, TUNNEL_H, -TUNNEL_W / 2, 0,            0,          0, Math.PI / 2));
    // right wall
    group.add(_plane(len, TUNNEL_H,  TUNNEL_W / 2, 0,            0,          0, -Math.PI / 2));
    // back wall
    group.add(_plane(TUNNEL_W, TUNNEL_H, 0,        0,            -halfLen,   0, 0, true));

    group.position.copy(mid);
    // orient along segment direction
    var axis  = new THREE.Vector3(0, 0, 1);
    var quat  = new THREE.Quaternion().setFromUnitVectors(axis, dir);
    group.quaternion.copy(quat);

    _scene.add(group);

    // lights along the tunnel
    var lights = [];
    var steps  = Math.floor(len / LIGHT_INTERVAL);
    for (var s = 0; s <= steps; s++) {
      var tVal  = (s / Math.max(steps, 1));
      var lpos  = new THREE.Vector3().lerpVectors(startPt, endPt, tVal);
      lpos.y    = TUNNEL_Y + TUNNEL_H / 2 - 0.3;
      var light = new THREE.PointLight(0xFFDD88, 0.4, 10);
      light.position.copy(lpos);
      _scene.add(light);
      lights.push(light);
    }

    // supply caches in dead-end alcove (use midpoint alcove for segment 0 and 2)
    var caches = [];
    if (idx % 2 === 0) {
      caches = _makeSupplyCaches(mid, dir, idx);
    }

    // spawn enemy rats
    var rats = [];
    rats.push(_makeRat(startPt, endPt, 0.3));
    rats.push(_makeRat(startPt, endPt, 0.7));

    _segments.push({
      mesh:      group,
      startPt:   startPt.clone(),
      endPt:     endPt.clone(),
      lights:    lights,
      collapsed: false,
      rats:      rats,
      charges:   [],
      caches:    caches,
      dir:       dir.clone(),
      len:       len
    });
  }

  function _plane(w, h, ox, oy, oz, rx, ry, isBack) {
    var geo  = new THREE.PlaneGeometry(w, h);
    var mesh = new THREE.Mesh(geo, _stoneMat);
    mesh.position.set(ox, oy, oz);
    if (isBack) {
      // no rotation needed — PlaneGeometry faces Z by default
    } else {
      mesh.rotation.x = rx;
      mesh.rotation.y = ry;
    }
    return mesh;
  }

  function _makeSupplyCaches(mid, dir, segIdx) {
    var caches = [];
    var perpDir = new THREE.Vector3(-dir.z, 0, dir.x); // 90° rotation in XZ

    // 2 ammo boxes
    for (var a = 0; a < 2; a++) {
      var offset = (a === 0) ? 1 : -1;
      var pos    = mid.clone().add(perpDir.clone().multiplyScalar(offset * 0.8));
      pos.y      = TUNNEL_Y - TUNNEL_H / 2 + 0.2;
      var geo    = new THREE.BoxGeometry(0.4, 0.3, 0.5);
      var mat    = new THREE.MeshLambertMaterial({ color: 0x556B2F });
      var mesh   = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      _scene.add(mesh);
      caches.push({ mesh: mesh, type: 'ammo', collected: false, pos: pos.clone() });
      _caches.push(caches[caches.length - 1]);
    }

    // 1 med kit
    var mpos = mid.clone().add(dir.clone().multiplyScalar(2));
    mpos.y   = TUNNEL_Y - TUNNEL_H / 2 + 0.2;
    var mgeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var mmat = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
    var mmesh= new THREE.Mesh(mgeo, mmat);
    mmesh.position.copy(mpos);
    _scene.add(mmesh);
    caches.push({ mesh: mmesh, type: 'med', collected: false, pos: mpos.clone() });
    _caches.push(caches[caches.length - 1]);

    return caches;
  }

  // ── enemy rats ────────────────────────────────────────────────────────────
  function _makeRat(startPt, endPt, t) {
    var pos = new THREE.Vector3().lerpVectors(startPt, endPt, t);
    pos.y   = TUNNEL_Y - TUNNEL_H / 2 + 0.9; // standing in tunnel

    var geo  = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);

    return {
      mesh:    mesh,
      alive:   true,
      hp:      80,
      pos:     pos.clone(),
      startPt: startPt.clone(),
      endPt:   endPt.clone(),
      dir:     1,       // 1 = toward end, -1 = toward start
      speed:   2.5,
      t:       t,
      armed:   true     // SMG
    };
  }

  function _updateRats(delta) {
    for (var s = 0; s < _segments.length; s++) {
      var seg = _segments[s];
      if (seg.collapsed) continue;
      for (var r = 0; r < seg.rats.length; r++) {
        var rat = seg.rats[r];
        if (!rat.alive) continue;
        _patrolRat(rat, delta, seg);
      }
    }
  }

  function _patrolRat(rat, delta, seg) {
    rat.t += rat.dir * rat.speed * delta / seg.len;
    if (rat.t >= 1) { rat.t = 1; rat.dir = -1; }
    if (rat.t <= 0) { rat.t = 0; rat.dir =  1; }

    rat.pos.lerpVectors(rat.startPt, rat.endPt, rat.t);
    rat.pos.y = TUNNEL_Y - TUNNEL_H / 2 + 0.9;
    rat.mesh.position.copy(rat.pos);

    // look toward patrol direction
    var target = rat.dir > 0 ? rat.endPt : rat.startPt;
    rat.mesh.lookAt(target.x, rat.pos.y, target.z);

    // attack player if nearby and underground
    if (_underground) {
      var cp   = _camera.position;
      var dist = rat.pos.distanceTo(cp);
      if (dist < 4 && Math.random() < delta * 0.6) {
        _damagePlayer(8); // SMG burst in confined space
      }
    }
  }

  function _damagePlayer(amount) {
    if (window.GameState && typeof window.GameState.takeDamage === 'function') {
      window.GameState.takeDamage(amount);
    }
  }

  // ── enter / exit tunnel ───────────────────────────────────────────────────
  function _tryEnterExit() {
    var cp = _camera.position;

    if (!_underground) {
      // check proximity to any trapdoor
      for (var t = 0; t < _trapdoors.length; t++) {
        var td = _trapdoors[t];
        var d  = _dist2D(cp.x, cp.z, td.pos.x, td.pos.z);
        if (d < ENTRY_RADIUS) {
          _enterTunnel(t);
          return;
        }
      }
    } else {
      // find nearest trapdoor and exit
      var best = _nearestTrapdoor();
      if (best) {
        _exitTunnel();
      }
    }
  }

  function _enterTunnel(tdIdx) {
    var td = _trapdoors[tdIdx];
    // discovery reward
    if (!td.discovered) {
      td.discovered = true;
      _addScore(100, 'TUNNEL DISCOVERED');
    }
    _underground = true;
    // teleport camera underground
    _camera.position.y = TUNNEL_Y - TUNNEL_H / 2 + 1.7;
    _mapCanvas.style.display  = 'block';
    _compassEl.style.display  = 'block';
    _setUndergroundAudio(true);
  }

  function _exitTunnel() {
    _underground = false;
    // place camera on surface near nearest trapdoor
    var td = _nearestTrapdoor();
    if (td) {
      _camera.position.x = td.pos.x;
      _camera.position.z = td.pos.z;
    }
    _camera.position.y = 1.7;
    _mapCanvas.style.display  = 'none';
    _compassEl.style.display  = 'none';
    _setUndergroundAudio(false);
  }

  // ── tunnel collapse ───────────────────────────────────────────────────────
  // Call this from external explosion system
  function notifyExplosion(pos, damage) {
    if (damage < 30) return;
    for (var t = 0; t < _trapdoors.length; t++) {
      var td   = _trapdoors[t];
      var dist = _dist2D(pos.x, pos.z, td.pos.x, td.pos.z);
      if (dist < 3) {
        var segIdx = Math.floor(t * _segments.length / _trapdoors.length);
        segIdx     = Math.min(segIdx, _segments.length - 1);
        _collapseSegment(segIdx);
      }
    }
  }

  function _collapseSegment(idx) {
    var seg = _segments[idx];
    if (!seg || seg.collapsed) return;
    seg.collapsed = true;

    // drop debris boxes
    var mid = new THREE.Vector3().addVectors(seg.startPt, seg.endPt).multiplyScalar(0.5);
    mid.y   = TUNNEL_Y;
    for (var d = 0; d < 6; d++) {
      var geo  = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var mesh = new THREE.Mesh(geo, _dirtMat);
      mesh.position.set(
        mid.x + (Math.random() - 0.5) * TUNNEL_W,
        mid.y + TUNNEL_H / 2 - 0.25,
        mid.z + (Math.random() - 0.5) * 3
      );
      mesh.userData.fallVel = 0;
      mesh.userData.falling = true;
      _scene.add(mesh);
      seg.charges.push({ isFalling: true, mesh: mesh }); // reuse charges array for debris
    }

    // dim lights
    for (var l = 0; l < seg.lights.length; l++) {
      seg.lights[l].intensity = 0.05;
    }

    // push player out if inside
    if (_underground) {
      _exitTunnel();
    }
  }

  // ── tunnel breaching ──────────────────────────────────────────────────────
  function _placeCharge() {
    if (_chargePlaced) return;
    if (!_underground) return;

    // find nearest segment
    var nearSeg = _nearestSegmentIdx();
    if (nearSeg < 0) return;

    _chargePlaced  = true;
    _chargeTimer   = CHARGE_TIME;
    _chargeSegIdx  = nearSeg;
    _showScorePop('CHARGE SET — ' + CHARGE_TIME + 's');
  }

  function _nearestSegmentIdx() {
    var cp   = _camera.position;
    var best = -1, bestD = Infinity;
    for (var s = 0; s < _segments.length; s++) {
      var seg = _segments[s];
      var mid = new THREE.Vector3().addVectors(seg.startPt, seg.endPt).multiplyScalar(0.5);
      mid.y   = TUNNEL_Y;
      var d   = cp.distanceTo(mid);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  function _updateCharge(delta) {
    if (!_chargePlaced) return;
    _chargeTimer -= delta;
    if (_chargeTimer > 0) {
      _showScorePop('DETONATING IN ' + Math.ceil(_chargeTimer) + 's');
      return;
    }
    // detonate
    _chargePlaced = false;
    var seg = _segments[_chargeSegIdx];
    if (seg) {
      // create a breach — mark a side tunnel alcove
      _showScorePop('BREACH!');
      // collapse if already damaged or random chance
      if (Math.random() < 0.4) {
        _collapseSegment(_chargeSegIdx);
      } else {
        // just add score
        _addScore(50, 'BREACH CREATED');
      }
    }
    _chargeSegIdx = -1;
  }

  // ── supply cache pickup ───────────────────────────────────────────────────
  function _checkCachePickups() {
    if (!_underground) return;
    var cp = _camera.position;
    for (var c = 0; c < _caches.length; c++) {
      var cache = _caches[c];
      if (cache.collected) continue;
      var d = cp.distanceTo(cache.pos);
      if (d < 1.2) {
        cache.collected = true;
        _scene.remove(cache.mesh);
        if (cache.type === 'ammo') {
          _showScorePop('AMMO CACHE +30');
          if (window.GameState && window.GameState.addAmmo) window.GameState.addAmmo(30);
        } else {
          _showScorePop('MED KIT +25 HP');
          if (window.GameState && window.GameState.heal) window.GameState.heal(25);
        }
      }
    }
  }

  // ── crawl mode ────────────────────────────────────────────────────────────
  function _updateCrawlMode() {
    // Side tunnels (odd segments) are 1 unit tall — auto-crouch
    if (!_underground) return;
    var nearSeg = _nearestSegmentIdx();
    if (nearSeg < 0) return;
    // In this implementation all tunnels are TUNNEL_H=2, so no auto-crouch needed
    // but expose the logic hook
    if (window.GameState && typeof window.GameState.setCrouch === 'function') {
      var seg = _segments[nearSeg];
      // future: check if seg.height < 2
      window.GameState.setCrouch(false);
    }
  }

  // ── stealth ───────────────────────────────────────────────────────────────
  // Expose underground status so surface AI can check it
  function isPlayerUnderground() { return _underground; }

  // ── input ─────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (e.code === 'KeyE') { _tryEnterExit(); }
    if (e.code === 'KeyC') { _placeCharge();  }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  // ── falling debris ────────────────────────────────────────────────────────
  function _updateDebris(delta) {
    for (var s = 0; s < _segments.length; s++) {
      var seg = _segments[s];
      for (var d = 0; d < seg.charges.length; d++) {
        var item = seg.charges[d];
        if (!item.isFalling || !item.mesh) continue;
        item.mesh.userData.fallVel = (item.mesh.userData.fallVel || 0) + 9.8 * delta;
        item.mesh.position.y -= item.mesh.userData.fallVel * delta;
        var floor = TUNNEL_Y - TUNNEL_H / 2 + 0.25;
        if (item.mesh.position.y < floor) {
          item.mesh.position.y = floor;
          item.isFalling = false;
        }
      }
    }
  }

  // ── public API ────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _makeMaterials();
    _createHUD();
    _initAudio();
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function update(delta) {
    if (!_scene || !_camera) return;
    _updateRats(delta);
    _updateCharge(delta);
    _checkCachePickups();
    _updateCrawlMode();
    _updateDebris(delta);
    if (_underground) {
      _updateMap();
      _updateCompass();
    }
  }

  function reset() {
    // remove all tunnel objects
    for (var s = 0; s < _segments.length; s++) {
      var seg = _segments[s];
      _scene.remove(seg.mesh);
      for (var l = 0; l < seg.lights.length; l++) { _scene.remove(seg.lights[l]); }
      for (var r = 0; r < seg.rats.length; r++) { if (seg.rats[r].mesh) _scene.remove(seg.rats[r].mesh); }
    }
    for (var t = 0; t < _trapdoors.length; t++) { _scene.remove(_trapdoors[t].mesh); }
    for (var c = 0; c < _caches.length; c++) { if (!_caches[c].collected) _scene.remove(_caches[c].mesh); }

    _segments  = [];
    _trapdoors = [];
    _caches    = [];
    _underground  = false;
    _chargePlaced = false;
    _chargeTimer  = 0;
    _chargeSegIdx = -1;
    _score = 0;

    if (_mapCanvas)  _mapCanvas.style.display  = 'none';
    if (_compassEl)  _compassEl.style.display  = 'none';
    _setUndergroundAudio(false);
  }

  // expose notifyExplosion so external systems can trigger collapse
  return {
    init:               init,
    update:             update,
    reset:              reset,
    spawnNetwork:       spawnNetwork,
    isPlayerUnderground: isPlayerUnderground,
    notifyExplosion:    notifyExplosion,
    _surfaceVolumeMult: 1.0
  };

}());
