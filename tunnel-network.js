/* ─────────────────────────────────────────────────────────────────────────
   TUNNEL NETWORK — underground dig, traverse, structural integrity, HUD
   ───────────────────────────────────────────────────────────────────────── */
window.TunnelNetwork = (function () {
  'use strict';

  // ── scene refs ──────────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;

  // ── dig mode state ───────────────────────────────────────────────────────────
  var _digMode        = false;   // T+N activates
  var _ventMode       = false;   // T+V activates
  var _pathPoints     = [];      // Vector3 array, max 5
  var _pathMarkers    = [];      // small sphere meshes shown while planning

  // ── tunnel segments ──────────────────────────────────────────────────────────
  // each: { mesh, beams[], lanterns[], lights[], startPt, endPt,
  //          hp, length, collapsed, flooded, floodMesh }
  var _segments = [];

  // ── enemy tunnels ────────────────────────────────────────────────────────────
  var _enemyTunnels = [];   // { entranceMesh, pos }

  // ── ventilation shafts ───────────────────────────────────────────────────────
  var _vents = [];          // { mesh, pos }

  // ── exit markers ────────────────────────────────────────────────────────────
  var _exitMarkers = [];

  // ── player tunnel traversal ──────────────────────────────────────────────────
  var _inTunnel      = false;
  var _tunnelSegIdx  = -1;   // which segment the player is inside
  var _tunnelT       = 0;    // 0..1 along that segment
  var _tunnelDir     = 1;    // +1 forward, -1 backward

  // ── CO2 / oxygen ────────────────────────────────────────────────────────────
  var _o2Pct         = 100;  // 0-100
  var _co2Timer      = 0;    // accumulator for -1 HP per 5 s when unvented

  // ── cave-in shake ────────────────────────────────────────────────────────────
  var _shakeFrames   = 0;
  var _shakeAmt      = 0;

  // ── key tracking ────────────────────────────────────────────────────────────
  var _keys = {};

  // ── HUD element ─────────────────────────────────────────────────────────────
  var _hudEl = null;

  // ── materials (lazy) ────────────────────────────────────────────────────────
  var _tunnelMat  = null;
  var _woodMat    = null;
  var _lanternMat = null;
  var _exitMat    = null;
  var _waterMat   = null;
  var _ventMat    = null;
  var _rubbleMat  = null;
  var _markerMat  = null;
  var _enemyMat   = null;

  // ── constants ────────────────────────────────────────────────────────────────
  var TUNNEL_RADIUS    = 1;
  var TUNNEL_SEGS      = 8;
  var TUNNEL_Y_TOP     = -1;
  var TUNNEL_Y_BOT     = -3;
  var TUNNEL_Y_CENTER  = (TUNNEL_Y_TOP + TUNNEL_Y_BOT) / 2;  // -2
  var BEAM_INTERVAL    = 3;
  var LANTERN_INTERVAL = 6;
  var SEGMENT_HP       = 100;
  var EXPLOSION_RANGE  = 4;
  var EXPLOSION_DMG    = 50;
  var CRAWL_RADIUS     = 1.5;
  var VENT_DISTANCE    = 15;
  var CO2_TICK         = 5;    // seconds between HP ticks when unvented
  var ENTRY_RADIUS     = 1;
  var PATH_MAX         = 5;
  var LIGHT_RANGE      = 3;
  var FLOODED_SPEED    = 0.5;

  // ─────────────────────────────────────────────────────────────────────────────
  // MATERIALS
  // ─────────────────────────────────────────────────────────────────────────────
  function _makeMaterials() {
    if (_tunnelMat) return;
    _tunnelMat  = new THREE.MeshLambertMaterial({ color: 0x2A2A2A, side: THREE.DoubleSide });
    _woodMat    = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    _lanternMat = new THREE.MeshStandardMaterial({ color: 0xFFAA44, emissive: 0xFFAA44, emissiveIntensity: 1 });
    _exitMat    = new THREE.MeshStandardMaterial({ color: 0x00FF44, emissive: 0x00FF44, emissiveIntensity: 0.8 });
    _waterMat   = new THREE.MeshLambertMaterial({ color: 0x0044AA, transparent: true, opacity: 0.5 });
    _ventMat    = new THREE.MeshLambertMaterial({ color: 0x888888 });
    _rubbleMat  = new THREE.MeshLambertMaterial({ color: 0x555555 });
    _markerMat  = new THREE.MeshBasicMaterial({ color: 0xFFFF00, wireframe: true });
    _enemyMat   = new THREE.MeshLambertMaterial({ color: 0x880000 });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GEOMETRY HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  function _segmentMidpoint(a, b) {
    return new THREE.Vector3(
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      (a.z + b.z) / 2
    );
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────────────────────
  function _initHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'tunnel-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#0f0',
      'font-family:monospace',
      'font-size:13px',
      'padding:4px 12px',
      'border:1px solid #0f0',
      'border-radius:3px',
      'pointer-events:none',
      'display:none',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    if (!_inTunnel && !_digMode) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';

    var depth  = _inTunnel ? Math.round(TUNNEL_Y_CENTER) : 0;
    var o2str  = Math.max(0, Math.round(_o2Pct));
    var intStr = 'STRONG';

    if (_inTunnel && _tunnelSegIdx >= 0 && _tunnelSegIdx < _segments.length) {
      var seg = _segments[_tunnelSegIdx];
      if (seg) {
        var hpRatio = seg.hp / SEGMENT_HP;
        intStr = hpRatio > 0.6 ? 'STRONG' : (hpRatio > 0.3 ? 'DAMAGED' : 'CRITICAL');
      }
    }

    var txt = 'TUNNEL [DEPTH: ' + depth + 'm] [O2: ' + o2str + '%] [INTEGRITY: ' + intStr + ']';
    if (_digMode) {
      txt += '  [DIG MODE: ' + _pathPoints.length + '/' + PATH_MAX + ' pts]';
    }
    _hudEl.textContent = txt;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DIG MODE — path point markers
  // ─────────────────────────────────────────────────────────────────────────────
  function _addPathMarker(pt) {
    var geo  = new THREE.SphereGeometry(0.15, 6, 6);
    var mesh = new THREE.Mesh(geo, _markerMat);
    mesh.position.copy(pt);
    _scene.add(mesh);
    _pathMarkers.push(mesh);
  }

  function _clearPathMarkers() {
    var i;
    for (i = 0; i < _pathMarkers.length; i++) {
      _scene.remove(_pathMarkers[i]);
    }
    _pathMarkers = [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD TUNNEL between two Vector3 points
  // ─────────────────────────────────────────────────────────────────────────────
  function _buildSegment(a, b, isFlooded) {
    _makeMaterials();

    var length = _dist3(a, b);
    if (length < 0.1) return null;

    var dir = new THREE.Vector3().subVectors(b, a).normalize();

    // ── Cylinder (tunnel tube) ───────────────────────────────────────────────
    var geo  = new THREE.CylinderGeometry(TUNNEL_RADIUS, TUNNEL_RADIUS, length, TUNNEL_SEGS);
    var mesh = new THREE.Mesh(geo, _tunnelMat);

    var mid = _segmentMidpoint(a, b);
    mesh.position.copy(mid);

    var up   = new THREE.Vector3(0, 1, 0);
    var quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    mesh.quaternion.copy(quat);

    if (mesh.position.y < TUNNEL_Y_BOT) mesh.position.y = TUNNEL_Y_BOT;
    if (mesh.position.y > TUNNEL_Y_TOP) mesh.position.y = TUNNEL_Y_TOP;

    _scene.add(mesh);

    var seg = {
      mesh:       mesh,
      startPt:    a.clone(),
      endPt:      b.clone(),
      length:     length,
      dir:        dir.clone(),
      hp:         SEGMENT_HP,
      collapsed:  false,
      flooded:    !!isFlooded,
      floodMesh:  null,
      exitMarker: null,
      beams:      [],
      lanterns:   [],
      lights:     []
    };

    // ── Support beams ────────────────────────────────────────────────────────
    var beamCount = Math.floor(length / BEAM_INTERVAL);
    var i, t, bpt, crossGeo, crossMesh, vGeoL, vMeshL, vGeoR, vMeshR, perpX, perpZ;
    for (i = 1; i <= beamCount; i++) {
      t   = i / (beamCount + 1);
      bpt = new THREE.Vector3(
        a.x + dir.x * (t * length),
        mid.y,
        a.z + dir.z * (t * length)
      );

      crossGeo  = new THREE.BoxGeometry(0.08, 0.08, TUNNEL_RADIUS * 2);
      crossMesh = new THREE.Mesh(crossGeo, _woodMat);
      crossMesh.position.set(bpt.x, bpt.y + TUNNEL_RADIUS * 0.6, bpt.z);
      crossMesh.rotation.y = Math.atan2(dir.x, dir.z);
      _scene.add(crossMesh);
      seg.beams.push(crossMesh);

      perpX = -dir.z;
      perpZ =  dir.x;

      vGeoL  = new THREE.BoxGeometry(0.07, TUNNEL_RADIUS * 1.4, 0.07);
      vMeshL = new THREE.Mesh(vGeoL, _woodMat);
      vMeshL.position.set(
        bpt.x + perpX * (TUNNEL_RADIUS - 0.1),
        bpt.y,
        bpt.z + perpZ * (TUNNEL_RADIUS - 0.1)
      );
      _scene.add(vMeshL);
      seg.beams.push(vMeshL);

      vGeoR  = new THREE.BoxGeometry(0.07, TUNNEL_RADIUS * 1.4, 0.07);
      vMeshR = new THREE.Mesh(vGeoR, _woodMat);
      vMeshR.position.set(
        bpt.x - perpX * (TUNNEL_RADIUS - 0.1),
        bpt.y,
        bpt.z - perpZ * (TUNNEL_RADIUS - 0.1)
      );
      _scene.add(vMeshR);
      seg.beams.push(vMeshR);
    }

    // ── Lanterns ─────────────────────────────────────────────────────────────
    var lanternCount = Math.floor(length / LANTERN_INTERVAL);
    var j, lt, lpt, lGeo, lMesh, pl;
    for (j = 1; j <= lanternCount; j++) {
      lt  = j / (lanternCount + 1);
      lpt = new THREE.Vector3(
        a.x + dir.x * (lt * length),
        mid.y + TUNNEL_RADIUS * 0.5,
        a.z + dir.z * (lt * length)
      );

      lGeo  = new THREE.SphereGeometry(0.15, 6, 6);
      lMesh = new THREE.Mesh(lGeo, _lanternMat);
      lMesh.position.copy(lpt);
      _scene.add(lMesh);
      seg.lanterns.push(lMesh);

      pl = new THREE.PointLight(0xFFAA44, 1, LIGHT_RANGE);
      pl.position.copy(lpt);
      _scene.add(pl);
      seg.lights.push(pl);
    }

    // ── Flood water ──────────────────────────────────────────────────────────
    if (isFlooded) {
      var wGeo  = new THREE.BoxGeometry(TUNNEL_RADIUS * 1.8, TUNNEL_RADIUS * 0.8, length * 0.95);
      var wMesh = new THREE.Mesh(wGeo, _waterMat);
      wMesh.position.copy(mid);
      wMesh.position.y -= TUNNEL_RADIUS * 0.3;
      wMesh.quaternion.copy(quat);
      _scene.add(wMesh);
      seg.floodMesh = wMesh;
    }

    // ── Exit marker (at endpoint b) ──────────────────────────────────────────
    var eGeo  = new THREE.SphereGeometry(0.3, 8, 8);
    var eMesh = new THREE.Mesh(eGeo, _exitMat);
    eMesh.position.copy(b);
    eMesh.position.y = TUNNEL_Y_CENTER;
    _scene.add(eMesh);
    _exitMarkers.push(eMesh);
    seg.exitMarker = eMesh;

    _segments.push(seg);
    return seg;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD FULL TUNNEL PATH from _pathPoints
  // ─────────────────────────────────────────────────────────────────────────────
  function _buildTunnel() {
    if (_pathPoints.length < 2) return;

    var floodIdx = Math.floor(Math.random() * (_pathPoints.length - 1));

    var i, a, b;
    for (i = 0; i < _pathPoints.length - 1; i++) {
      a = _pathPoints[i].clone();
      b = _pathPoints[i + 1].clone();
      a.y = TUNNEL_Y_CENTER;
      b.y = TUNNEL_Y_CENTER;
      _buildSegment(a, b, i === floodIdx);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VENTILATION SHAFT
  // ─────────────────────────────────────────────────────────────────────────────
  function _placeVentAt(worldPos) {
    _makeMaterials();
    var shaftHeight = Math.abs(TUNNEL_Y_CENTER) + 1;
    var vGeo  = new THREE.CylinderGeometry(0.25, 0.25, shaftHeight, 8);
    var vMesh = new THREE.Mesh(vGeo, _ventMat);
    vMesh.position.set(worldPos.x, TUNNEL_Y_CENTER + shaftHeight / 2, worldPos.z);
    _scene.add(vMesh);
    _vents.push({ mesh: vMesh, pos: worldPos.clone() });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ENEMY TUNNELS — 2 pre-built entrances at random positions
  // ─────────────────────────────────────────────────────────────────────────────
  function _buildEnemyTunnels() {
    _makeMaterials();
    var i, rx, rz, eGeo, eMesh;
    for (i = 0; i < 2; i++) {
      rx = (Math.random() - 0.5) * 60;
      rz = (Math.random() - 0.5) * 60;

      eGeo  = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 12);
      eMesh = new THREE.Mesh(eGeo, _enemyMat);
      eMesh.position.set(rx, 0, rz);
      eMesh.rotation.x = Math.PI / 2;
      _scene.add(eMesh);

      _enemyTunnels.push({ entranceMesh: eMesh, pos: new THREE.Vector3(rx, 0, rz) });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLAPSE segment
  // ─────────────────────────────────────────────────────────────────────────────
  function _collapseSegment(idx) {
    var seg = _segments[idx];
    if (!seg || seg.collapsed) return;
    seg.collapsed = true;

    _scene.remove(seg.mesh);

    var b, l, pl, r, rGeo, rMesh, mid;
    for (b = 0; b < seg.beams.length; b++) _scene.remove(seg.beams[b]);
    seg.beams = [];

    for (l = 0; l < seg.lanterns.length; l++) _scene.remove(seg.lanterns[l]);
    for (pl = 0; pl < seg.lights.length; pl++) _scene.remove(seg.lights[pl]);
    seg.lanterns = [];
    seg.lights   = [];

    if (seg.floodMesh) { _scene.remove(seg.floodMesh); seg.floodMesh = null; }
    if (seg.exitMarker) _scene.remove(seg.exitMarker);

    // spawn 5 rubble chunks
    mid = _segmentMidpoint(seg.startPt, seg.endPt);
    for (r = 0; r < 5; r++) {
      rGeo  = new THREE.BoxGeometry(
        0.2 + Math.random() * 0.5,
        0.1 + Math.random() * 0.3,
        0.2 + Math.random() * 0.5
      );
      rMesh = new THREE.Mesh(rGeo, _rubbleMat);
      rMesh.position.set(
        mid.x + (Math.random() - 0.5) * 2,
        TUNNEL_Y_CENTER + (Math.random() - 0.5) * 0.5,
        mid.z + (Math.random() - 0.5) * 2
      );
      rMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      _scene.add(rMesh);
    }

    _checkChainCaveIn(idx);
  }

  function _checkChainCaveIn(idx) {
    var run = 1;
    var i;
    for (i = idx - 1; i >= 0; i--) {
      if (_segments[i].collapsed) { run++; } else { break; }
    }
    for (i = idx + 1; i < _segments.length; i++) {
      if (_segments[i].collapsed) { run++; } else { break; }
    }

    if (run >= 3) {
      _shakeFrames = 60;
      _shakeAmt    = 0.15;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPLOSION DAMAGE (called externally by the main game)
  // ─────────────────────────────────────────────────────────────────────────────
  function _handleExplosion(worldPos) {
    var i, seg, mid;
    for (i = 0; i < _segments.length; i++) {
      seg = _segments[i];
      if (seg.collapsed) continue;
      mid = _segmentMidpoint(seg.startPt, seg.endPt);
      if (_dist3(worldPos, mid) < EXPLOSION_RANGE) {
        seg.hp -= EXPLOSION_DMG;
        if (seg.hp <= 0) {
          seg.hp = 0;
          _collapseSegment(i);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TUNNEL TRAVERSAL — enter / exit check
  // ─────────────────────────────────────────────────────────────────────────────
  function _checkEnterTunnel() {
    if (_inTunnel) return;
    var cp = _camera.position;
    var i, seg, d, de;
    for (i = 0; i < _segments.length; i++) {
      seg = _segments[i];
      if (seg.collapsed) continue;
      d = _dist2D(cp.x, cp.z, seg.startPt.x, seg.startPt.z);
      if (d < ENTRY_RADIUS) {
        _inTunnel     = true;
        _tunnelSegIdx = i;
        _tunnelT      = 0;
        _tunnelDir    = 1;
        return;
      }
      de = _dist2D(cp.x, cp.z, seg.endPt.x, seg.endPt.z);
      if (de < ENTRY_RADIUS) {
        _inTunnel     = true;
        _tunnelSegIdx = i;
        _tunnelT      = 1;
        _tunnelDir    = -1;
        return;
      }
    }
  }

  function _updateTunnelTraversal(dt) {
    if (!_inTunnel) return;

    var seg = _segments[_tunnelSegIdx];
    if (!seg || seg.collapsed) {
      _inTunnel = false;
      return;
    }

    var speed = seg.flooded ? FLOODED_SPEED : 1.0;

    var moving = 0;
    if (_keys['w'] || _keys['arrowup'])   moving =  1;
    if (_keys['s'] || _keys['arrowdown']) moving = -1;

    _tunnelT += moving * _tunnelDir * speed * dt * 0.8;

    var nextIdx, prevIdx, s, pos, camY;
    if (_tunnelT > 1) {
      nextIdx = _tunnelSegIdx + 1;
      if (nextIdx < _segments.length && !_segments[nextIdx].collapsed) {
        _tunnelSegIdx = nextIdx;
        _tunnelT      = 0;
        _tunnelDir    = 1;
      } else {
        _tunnelT  = 1;
        _inTunnel = false;
        return;
      }
    } else if (_tunnelT < 0) {
      prevIdx = _tunnelSegIdx - 1;
      if (prevIdx >= 0 && !_segments[prevIdx].collapsed) {
        _tunnelSegIdx = prevIdx;
        _tunnelT      = 1;
        _tunnelDir    = -1;
      } else {
        _tunnelT  = 0;
        _inTunnel = false;
        return;
      }
    }

    s   = _segments[_tunnelSegIdx];
    pos = new THREE.Vector3().lerpVectors(s.startPt, s.endPt, _tunnelT);

    // crawl mode — radius < CRAWL_RADIUS forces lower camera
    camY = pos.y + (TUNNEL_RADIUS < CRAWL_RADIUS ? -0.5 : 0.5);
    _camera.position.set(pos.x, camY, pos.z);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CO2 / OXYGEN SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────
  function _updateO2(dt) {
    if (!_inTunnel) {
      _o2Pct    = Math.min(100, _o2Pct + dt * 5);
      _co2Timer = 0;
      return;
    }

    var cp = _camera.position;
    var vented = false;
    var i;
    for (i = 0; i < _vents.length; i++) {
      if (_dist2D(cp.x, cp.z, _vents[i].pos.x, _vents[i].pos.z) < VENT_DISTANCE) {
        vented = true;
        break;
      }
    }

    if (!vented) {
      _co2Timer += dt;
      _o2Pct = Math.max(0, _o2Pct - dt * 0.8);
      if (_co2Timer >= CO2_TICK) {
        _co2Timer = 0;
        if (window.GameState && typeof window.GameState.damage === 'function') {
          window.GameState.damage(1, 'CO2');
        }
      }
    } else {
      _o2Pct    = Math.min(100, _o2Pct + dt * 2);
      _co2Timer = 0;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAMERA SHAKE
  // ─────────────────────────────────────────────────────────────────────────────
  function _updateShake() {
    if (_shakeFrames <= 0) return;
    _shakeFrames--;
    var s = _shakeAmt * (_shakeFrames / 60);
    if (_camera) {
      _camera.position.x += (Math.random() - 0.5) * s;
      _camera.position.y += (Math.random() - 0.5) * s;
      _camera.position.z += (Math.random() - 0.5) * s;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXIT MARKER PULSE (animate)
  // ─────────────────────────────────────────────────────────────────────────────
  function _updateExitMarkers(elapsed) {
    var i, scale;
    for (i = 0; i < _exitMarkers.length; i++) {
      scale = 1 + 0.2 * Math.sin(elapsed * 3 + i);
      _exitMarkers[i].scale.setScalar(scale);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INPUT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.key.toLowerCase()] = true;

    // T+N = dig mode toggle
    if ((e.key === 'n' || e.key === 'N') && _keys['t']) {
      _digMode  = !_digMode;
      _ventMode = false;
      if (!_digMode) _clearPathMarkers();
    }

    // T+V = ventilation placement mode
    if ((e.key === 'v' || e.key === 'V') && _keys['t']) {
      _ventMode = !_ventMode;
      _digMode  = false;
    }

    // Enter = confirm tunnel from current path points
    if (e.key === 'Enter' && _digMode && _pathPoints.length >= 2) {
      _buildTunnel();
      _clearPathMarkers();
      _pathPoints = [];
      _digMode    = false;
    }

    // Escape = cancel dig
    if (e.key === 'Escape') {
      _digMode  = false;
      _ventMode = false;
      _clearPathMarkers();
      _pathPoints = [];
    }
  }

  function _onKeyUp(e) {
    _keys[e.key.toLowerCase()] = false;
  }

  function _onClick(e) {
    if (!_scene || !_camera) return;

    if (_digMode) {
      if (_pathPoints.length >= PATH_MAX) return;
      var canvas = e.target;
      var rect   = (canvas && canvas.getBoundingClientRect)
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      var ndcX  = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      var ndcY  = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      var ray   = new THREE.Raycaster();
      ray.setFromCamera({ x: ndcX, y: ndcY }, _camera);

      var plane  = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TUNNEL_Y_CENTER);
      var target = new THREE.Vector3();
      ray.ray.intersectPlane(plane, target);

      if (target) {
        var pt = new THREE.Vector3(target.x, TUNNEL_Y_CENTER, target.z);
        _pathPoints.push(pt);
        _addPathMarker(pt);
      }
      return;
    }

    if (_ventMode) {
      var vPos = new THREE.Vector3(_camera.position.x, TUNNEL_Y_CENTER, _camera.position.z);
      _placeVentAt(vPos);
      _ventMode = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────
  var _elapsed = 0;

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _makeMaterials();
    _initHUD();
    _buildEnemyTunnels();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    var canvas = document.querySelector('canvas') || document;
    canvas.addEventListener('click', _onClick);
  }

  function update(dt) {
    if (!_scene || !_camera) return;

    _elapsed += dt;

    _checkEnterTunnel();
    _updateTunnelTraversal(dt);
    _updateO2(dt);
    _updateShake();
    _updateExitMarkers(_elapsed);
    _updateHUD();
  }

  function reset() {
    var i, seg, b, l, pl;
    for (i = 0; i < _segments.length; i++) {
      seg = _segments[i];
      _scene.remove(seg.mesh);
      for (b = 0; b < seg.beams.length; b++)    _scene.remove(seg.beams[b]);
      for (l = 0; l < seg.lanterns.length; l++)  _scene.remove(seg.lanterns[l]);
      for (pl = 0; pl < seg.lights.length; pl++) _scene.remove(seg.lights[pl]);
      if (seg.floodMesh)  _scene.remove(seg.floodMesh);
      if (seg.exitMarker) _scene.remove(seg.exitMarker);
    }
    _segments = [];

    var ei;
    for (ei = 0; ei < _exitMarkers.length; ei++) _scene.remove(_exitMarkers[ei]);
    _exitMarkers = [];

    var vi;
    for (vi = 0; vi < _vents.length; vi++) _scene.remove(_vents[vi].mesh);
    _vents = [];

    var eti;
    for (eti = 0; eti < _enemyTunnels.length; eti++) _scene.remove(_enemyTunnels[eti].entranceMesh);
    _enemyTunnels = [];

    _clearPathMarkers();
    _pathPoints    = [];
    _digMode       = false;
    _ventMode      = false;
    _inTunnel      = false;
    _tunnelSegIdx  = -1;
    _tunnelT       = 0;
    _o2Pct         = 100;
    _co2Timer      = 0;
    _shakeFrames   = 0;
    _elapsed       = 0;

    _tunnelMat  = null;
    _woodMat    = null;
    _lanternMat = null;
    _exitMat    = null;
    _waterMat   = null;
    _ventMat    = null;
    _rubbleMat  = null;
    _markerMat  = null;
    _enemyMat   = null;

    if (_hudEl) _hudEl.style.display = 'none';
  }

  return {
    init:            init,
    update:          update,
    reset:           reset,
    handleExplosion: _handleExplosion
  };

}());
