window.TacticalMap = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _open = false;
  var _overlayEl = null;
  var _canvas = null;
  var _ctx = null;
  var _zoom = 1.0;
  var _panX = 0;
  var _panZ = 0;
  var _waypoint = null;
  var _waypointMesh = null;
  var _updateTimer = 0;
  var _tooltipEl = null;

  var MAP_W = 900;
  var MAP_H = 700;
  var WORLD_RANGE = 100;

  function _worldToCanvas(wx, wz) {
    var cx = ((wx + WORLD_RANGE) / (2 * WORLD_RANGE)) * MAP_W;
    var cy = ((wz + WORLD_RANGE) / (2 * WORLD_RANGE)) * MAP_H;
    var scx = MAP_W / 2 + (cx - MAP_W / 2 + _panX) * _zoom;
    var scy = MAP_H / 2 + (cy - MAP_H / 2 + _panZ) * _zoom;
    return { x: scx, y: scy };
  }

  function _buildUI() {
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'tactical-map-overlay';
    _overlayEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.85)', 'z-index:4000', 'display:none',
      'justify-content:center', 'align-items:center', 'flex-direction:column'
    ].join(';');
    _overlayEl.style.display = 'none';

    var header = document.createElement('div');
    header.style.cssText = 'color:#88FF00;font-family:monospace;font-size:13px;letter-spacing:3px;margin-bottom:8px';
    header.textContent = 'TACTICAL SITUATION MAP  [TAB] CLOSE';
    _overlayEl.appendChild(header);

    _canvas = document.createElement('canvas');
    _canvas.width = MAP_W;
    _canvas.height = MAP_H;
    _canvas.style.cssText = 'border:2px solid #446600;cursor:crosshair';
    _overlayEl.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');

    _canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      _zoom = Math.max(0.5, Math.min(3.0, _zoom - e.deltaY * 0.001));
    });

    _canvas.addEventListener('click', function (e) {
      var rect = _canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var cx = (mx - MAP_W / 2) / _zoom - _panX + MAP_W / 2;
      var cy = (my - MAP_H / 2) / _zoom - _panZ + MAP_H / 2;
      var wx = (cx / MAP_W) * 2 * WORLD_RANGE - WORLD_RANGE;
      var wz = (cy / MAP_H) * 2 * WORLD_RANGE - WORLD_RANGE;
      _setWaypoint(wx, wz);
    });

    _canvas.addEventListener('mousemove', function (e) {
      _updateTooltip(e);
    });

    _tooltipEl = document.createElement('div');
    _tooltipEl.style.cssText = [
      'position:fixed', 'background:rgba(0,0,0,0.8)', 'color:#fff',
      'font-family:monospace', 'font-size:11px', 'padding:4px 8px',
      'pointer-events:none', 'display:none', 'z-index:4001', 'border:1px solid #444'
    ].join(';');
    document.body.appendChild(_tooltipEl);

    var legend = document.createElement('div');
    legend.style.cssText = 'color:#666;font-family:monospace;font-size:10px;margin-top:6px;letter-spacing:1px';
    legend.textContent = '● YOU  ✕ ENEMY  ◆ SNIPER  ★ OBJECTIVE  ▶ DRONE  SCROLL=ZOOM  CLICK=WAYPOINT';
    _overlayEl.appendChild(legend);

    document.body.appendChild(_overlayEl);
  }

  function _setWaypoint(wx, wz) {
    _waypoint = { x: wx, z: wz };
    if (_waypointMesh && _scene) _scene.remove(_waypointMesh);
    if (_scene) {
      var geo = new THREE.BoxGeometry(0.3, 8, 0.3);
      var mat = new THREE.MeshStandardMaterial({ color: 0xFFDD00, emissive: 0xFFDD00, emissiveIntensity: 0.8 });
      _waypointMesh = new THREE.Mesh(geo, mat);
      _waypointMesh.position.set(wx, 4, wz);
      _scene.add(_waypointMesh);
      window._waypointPos = { x: wx, z: wz };
    }
  }

  function _updateTooltip(e) {
    if (!_open || !_tooltipEl) return;
    var rect = _canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var cx = (mx - MAP_W / 2) / _zoom - _panX + MAP_W / 2;
    var cy = (my - MAP_H / 2) / _zoom - _panZ + MAP_H / 2;
    var wx = (cx / MAP_W) * 2 * WORLD_RANGE - WORLD_RANGE;
    var wz = (cy / MAP_H) * 2 * WORLD_RANGE - WORLD_RANGE;

    var enemies = (window.Enemies && Enemies.getAll) ? Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var e2 = enemies[i];
      if (!e2 || !e2.alive || !e2.mesh) continue;
      var dx = e2.mesh.position.x - wx;
      var dz = e2.mesh.position.z - wz;
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        var dist = _camera ? Math.round(Math.sqrt(
          Math.pow(e2.mesh.position.x - _camera.position.x, 2) +
          Math.pow(e2.mesh.position.z - _camera.position.z, 2)
        )) : '?';
        var hp = Math.round(e2.hp || 0);
        var threat = hp > 150 ? 'HIGH' : hp > 80 ? 'MED' : 'LOW';
        _tooltipEl.textContent = (e2.type || 'INFANTRY') + '  HP:' + hp + '  DIST:' + dist + 'm  THREAT:' + threat;
        _tooltipEl.style.display = 'block';
        _tooltipEl.style.left = (e.clientX + 10) + 'px';
        _tooltipEl.style.top = (e.clientY + 10) + 'px';
        return;
      }
    }
    _tooltipEl.style.display = 'none';
  }

  function _drawMap() {
    if (!_ctx) return;
    _ctx.fillStyle = '#050a05';
    _ctx.fillRect(0, 0, MAP_W, MAP_H);

    // Classified watermark
    _ctx.save();
    _ctx.translate(MAP_W / 2, MAP_H / 2);
    _ctx.rotate(-0.3);
    _ctx.fillStyle = 'rgba(100,200,0,0.04)';
    _ctx.font = 'bold 36px monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText('CLASSIFIED — OP OCCUPANT KILLER', 0, 0);
    _ctx.restore();

    // Grid lines
    _ctx.strokeStyle = 'rgba(80,120,40,0.3)';
    _ctx.lineWidth = 0.5;
    var gridStep = 20 * _zoom;
    var offsetX = ((_panX * _zoom) % gridStep + MAP_W) % gridStep;
    var offsetY = ((_panZ * _zoom) % gridStep + MAP_H) % gridStep;
    for (var gx = offsetX; gx < MAP_W; gx += gridStep) {
      _ctx.beginPath(); _ctx.moveTo(gx, 0); _ctx.lineTo(gx, MAP_H); _ctx.stroke();
    }
    for (var gy = offsetY; gy < MAP_H; gy += gridStep) {
      _ctx.beginPath(); _ctx.moveTo(0, gy); _ctx.lineTo(MAP_W, gy); _ctx.stroke();
    }

    // Coordinate labels
    _ctx.fillStyle = 'rgba(80,200,40,0.5)';
    _ctx.font = '10px monospace';
    _ctx.textAlign = 'center';
    var cols = ['A','B','C','D','E','F','G','H','I','J'];
    for (var ci = 0; ci < 10; ci++) {
      _ctx.fillText(cols[ci], (ci + 0.5) * MAP_W / 10, 12);
      _ctx.fillText((ci + 1).toString(), 12, (ci + 0.5) * MAP_H / 10);
    }

    // Scale bar
    _ctx.fillStyle = '#88FF00';
    _ctx.font = '10px monospace';
    _ctx.textAlign = 'left';
    _ctx.fillText('1 GRID = 10m', 10, MAP_H - 10);
    _ctx.fillStyle = '#88FF00';
    _ctx.fillRect(120, MAP_H - 16, 40, 4);

    // Terrain sampling
    if (window.VoxelWorld && VoxelWorld.getBlock) {
      for (var tx = -WORLD_RANGE; tx < WORLD_RANGE; tx += 5) {
        for (var tz = -WORLD_RANGE; tz < WORLD_RANGE; tz += 5) {
          var block = VoxelWorld.getBlock(tx, 1, tz) || 0;
          if (block === 0) continue;
          var color = block === 2 ? '#3a2a15' : block === 3 ? '#3a3a3a' :
                      block === 5 ? '#554433' : block === 1 ? '#1a3a1a' : '#333';
          var cp = _worldToCanvas(tx, tz);
          _ctx.fillStyle = color;
          _ctx.fillRect(cp.x - 1, cp.y - 1, Math.max(2, 3 * _zoom), Math.max(2, 3 * _zoom));
        }
      }
    }

    // Enemies
    var enemies = (window.Enemies && Enemies.getAll) ? Enemies.getAll() : [];
    for (var ei = 0; ei < enemies.length; ei++) {
      var enemy = enemies[ei];
      if (!enemy || !enemy.alive || !enemy.mesh) continue;
      var ep = _worldToCanvas(enemy.mesh.position.x, enemy.mesh.position.z);
      // Threat ring
      var detR = 10 * _zoom * (2 * WORLD_RANGE / MAP_W);
      _ctx.strokeStyle = 'rgba(255,0,0,0.12)';
      _ctx.lineWidth = 1;
      _ctx.beginPath();
      _ctx.arc(ep.x, ep.y, detR, 0, Math.PI * 2);
      _ctx.stroke();
      // Enemy X marker
      _ctx.strokeStyle = '#FF3333';
      _ctx.lineWidth = 2;
      _ctx.beginPath();
      _ctx.moveTo(ep.x - 5, ep.y - 5); _ctx.lineTo(ep.x + 5, ep.y + 5);
      _ctx.moveTo(ep.x + 5, ep.y - 5); _ctx.lineTo(ep.x - 5, ep.y + 5);
      _ctx.stroke();
      // HP bar
      if (enemy.hp !== undefined && enemy.maxHp) {
        var hpPct = enemy.hp / enemy.maxHp;
        _ctx.fillStyle = '#440000';
        _ctx.fillRect(ep.x - 8, ep.y + 7, 16, 2);
        _ctx.fillStyle = hpPct > 0.5 ? '#44FF44' : '#FF4400';
        _ctx.fillRect(ep.x - 8, ep.y + 7, Math.round(16 * hpPct), 2);
      }
    }

    // Player position
    var pp = _camera ? _worldToCanvas(_camera.position.x, _camera.position.z) : { x: MAP_W / 2, y: MAP_H / 2 };
    var yaw = _camera ? _camera.rotation.y : 0;
    _ctx.fillStyle = '#4488FF';
    _ctx.beginPath(); _ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2); _ctx.fill();
    _ctx.strokeStyle = '#88BBFF';
    _ctx.lineWidth = 2;
    _ctx.beginPath();
    _ctx.moveTo(pp.x, pp.y);
    _ctx.lineTo(pp.x + Math.sin(yaw) * 12, pp.y - Math.cos(yaw) * 12);
    _ctx.stroke();
    _ctx.fillStyle = '#88BBFF';
    _ctx.font = '10px monospace';
    _ctx.fillText('YOU', pp.x + 8, pp.y - 5);

    // Waypoint
    if (_waypoint) {
      var wp = _worldToCanvas(_waypoint.x, _waypoint.z);
      _ctx.strokeStyle = '#FFD700';
      _ctx.lineWidth = 2;
      _ctx.beginPath();
      _ctx.moveTo(wp.x, wp.y - 8);
      _ctx.lineTo(wp.x + 7, wp.y + 5);
      _ctx.lineTo(wp.x - 7, wp.y + 5);
      _ctx.closePath(); _ctx.stroke();
      _ctx.fillStyle = 'rgba(255,215,0,0.15)';
      _ctx.fill();
      _ctx.fillStyle = '#FFD700';
      _ctx.font = '9px monospace';
      _ctx.fillText('WP', wp.x + 9, wp.y + 3);
    }
  }

  function _onKey(e) {
    if (e.code === 'Tab') {
      e.preventDefault();
      _open ? close() : open();
    }
  }

  function open() {
    _open = true;
    if (_overlayEl) {
      _overlayEl.style.display = 'flex';
      _overlayEl.style.flexDirection = 'column';
    }
    _drawMap();
  }

  function close() {
    _open = false;
    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_tooltipEl) _tooltipEl.style.display = 'none';
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _buildUI();
    document.addEventListener('keydown', _onKey);
    window._tacticalMapOpen = false;
  }

  function update(dt) {
    window._tacticalMapOpen = _open;
    if (!_open) return;
    _updateTimer -= dt;
    if (_updateTimer <= 0) {
      _updateTimer = 0.25;
      _drawMap();
    }
    if (_waypointMesh) {
      _waypointMesh.rotation.y += dt * 1.2;
    }
  }

  function reset() {
    _open = false;
    _waypoint = null;
    _zoom = 1.0;
    if (_waypointMesh && _scene) { _scene.remove(_waypointMesh); _waypointMesh = null; }
    if (_overlayEl) _overlayEl.style.display = 'none';
    window._waypointPos = null;
  }

  return { init: init, update: update, open: open, close: close, reset: reset };
})();
