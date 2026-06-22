window.Minimap = (function () {
  var _canvas = null;
  var _ctx = null;
  var _visible = true;
  var _size = 150; // minimap canvas size in pixels
  var _range = 40; // world units radius shown on map
  var _scale = _size / 2 / _range; // pixels per world unit
  var _pulse = 0; // animation timer

  function init() {
    // Create a small canvas in the bottom-right corner
    _canvas = document.createElement('canvas');
    _canvas.id = 'minimap-tactical';
    _canvas.width = _size;
    _canvas.height = _size;
    _canvas.style.cssText = [
      'position:fixed;bottom:60px;right:12px;',
      'border:2px solid rgba(255,255,255,0.3);border-radius:50%;',
      'background:rgba(0,0,0,0.5);z-index:8000;',
      'pointer-events:none;'
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  function update(playerPos, playerYaw, enemyPositions, buildingRects) {
    // playerPos: {x, z} (y is height, ignore)
    // playerYaw: camera yaw in radians
    // enemyPositions: array of enemy objects with mesh.position or position, typeCfg, alive
    // buildingRects: optional array of {x, z, w, d} building footprints

    if (!_ctx || !_visible) return;

    _pulse = (performance.now() * 0.004) % (Math.PI * 2);

    var cx = _size / 2;
    var cy = _size / 2;
    var px = playerPos.x;
    var pz = playerPos.z;

    _ctx.clearRect(0, 0, _size, _size);

    // Clip to circle
    _ctx.save();
    _ctx.beginPath();
    _ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    _ctx.clip();

    // Background
    _ctx.fillStyle = 'rgba(0,20,0,0.7)';
    _ctx.fillRect(0, 0, _size, _size);

    // Helper: world pos to minimap canvas pos (north-up, player centered)
    function toMap(wx, wz) {
      var dx = wx - px;
      var dz = wz - pz;
      return {
        x: cx + dx * _scale,
        y: cy + dz * _scale
      };
    }

    // Range circles at 10, 20, 30 units
    _ctx.strokeStyle = 'rgba(0,180,0,0.15)';
    _ctx.lineWidth = 0.5;
    var ringRadii = [10, 20, 30];
    for (var ri = 0; ri < ringRadii.length; ri++) {
      _ctx.beginPath();
      _ctx.arc(cx, cy, ringRadii[ri] * _scale, 0, Math.PI * 2);
      _ctx.stroke();
    }

    // Grid dots every 5 world units
    _ctx.fillStyle = 'rgba(0,180,0,0.2)';
    var gridStep = 5;
    var gridStart = Math.floor((px - _range) / gridStep) * gridStep;
    var gridEnd = Math.ceil((px + _range) / gridStep) * gridStep;
    var gridStartZ = Math.floor((pz - _range) / gridStep) * gridStep;
    var gridEndZ = Math.ceil((pz + _range) / gridStep) * gridStep;
    for (var gx = gridStart; gx <= gridEnd; gx += gridStep) {
      for (var gz = gridStartZ; gz <= gridEndZ; gz += gridStep) {
        var gp = toMap(gx, gz);
        var gdx = gp.x - cx;
        var gdy = gp.y - cy;
        if (gdx * gdx + gdy * gdy < (cx - 2) * (cx - 2)) {
          _ctx.beginPath();
          _ctx.arc(gp.x, gp.y, 0.8, 0, Math.PI * 2);
          _ctx.fill();
        }
      }
    }

    // Buildings as dark gray rectangles
    if (buildingRects && buildingRects.length) {
      _ctx.fillStyle = 'rgba(60,80,60,0.6)';
      _ctx.strokeStyle = 'rgba(80,120,80,0.4)';
      _ctx.lineWidth = 0.5;
      for (var bi = 0; bi < buildingRects.length; bi++) {
        var b = buildingRects[bi];
        var bx = b.x;
        var bz = b.z;
        var bw = b.w;
        var bd = b.d;
        var bp = toMap(bx, bz);
        var bpx = bp.x;
        var bpy = bp.y;
        var bpw = bw * _scale;
        var bpd = bd * _scale;
        // Only draw if near player
        var bcx = bpx + bpw / 2;
        var bcy = bpy + bpd / 2;
        var bddx = bcx - cx;
        var bddy = bcy - cy;
        if (bddx * bddx + bddy * bddy < (cx + 20) * (cx + 20)) {
          _ctx.fillRect(bpx, bpy, bpw, bpd);
          _ctx.strokeRect(bpx, bpy, bpw, bpd);
        }
      }
    }

    // Enemies as red/colored dots
    if (enemyPositions && enemyPositions.length) {
      var nowMs = performance.now() * 0.006;
      var pulseVal = 0.5 + Math.sin(nowMs) * 0.5;
      for (var ei = 0; ei < enemyPositions.length; ei++) {
        var en = enemyPositions[ei];
        if (en.alive === false) continue;
        var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
        if (!epos) continue;
        var ep = toMap(epos.x, epos.z);
        var eddx = ep.x - cx;
        var eddy = ep.y - cy;
        if (eddx * eddx + eddy * eddy > (cx - 2) * (cx - 2)) continue;
        var typeName = (en.typeCfg && en.typeCfg.name) ? en.typeCfg.name : '';
        var isBoss = (typeName === 'BOSS');
        var dotR = isBoss ? (5 + pulseVal * 2) : 3;
        // Color by type (mirrors HUD minimap color scheme)
        var mmColors = {
          CONSCRIPT: '#ff3333', STORMER: '#ff6600', ARMORED: '#cc00cc',
          SNIPER: '#ffff00', SNIPER_ELITE: '#ffff00', OFFICER: '#ff00ff',
          BOMBER: '#ff8800', MEDIC: '#00ff88', ENGINEER: '#00ccff',
          BOSS: '#ffffff', WAR_DOG: '#bb6600', SHIELD_BEARER: '#8888ff',
          MORTAR: '#ff4488', FLAMETHROWER: '#ff4400', SABOTEUR: '#aa00ff',
          DRONE_OP: '#00ffcc'
        };
        var dotColor = mmColors[typeName] || '#ff3333';
        // Pulsing halo for boss
        if (isBoss) {
          _ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 + pulseVal * 0.4) + ')';
          _ctx.lineWidth = 1.5;
          _ctx.beginPath();
          _ctx.arc(ep.x, ep.y, dotR + 3, 0, Math.PI * 2);
          _ctx.stroke();
        }
        _ctx.fillStyle = dotColor;
        _ctx.beginPath();
        _ctx.arc(ep.x, ep.y, dotR, 0, Math.PI * 2);
        _ctx.fill();
      }
    }

    // Player as white equilateral triangle pointing forward (using camera yaw)
    // yaw=0 means facing -Z (north on map). Map is north-up.
    // In screen coords: north = up = negative Y, east = right = positive X
    // A yaw of 0 should point up. Three.js yaw rotates in XZ plane.
    // camera faces -Z at yaw=0, so yaw offset = -PI/2 to point triangle up.
    var triAngle = playerYaw !== undefined ? playerYaw : 0;
    // yaw=0 means player faces -Z (north). On north-up map, north is up (-Y).
    // So triangle tip direction: rotate 90 deg offset
    var tipAngle = -triAngle - Math.PI / 2;
    var triSize = 6;
    _ctx.fillStyle = '#ffffff';
    _ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    _ctx.lineWidth = 1;
    _ctx.beginPath();
    _ctx.moveTo(
      cx + Math.cos(tipAngle) * triSize,
      cy + Math.sin(tipAngle) * triSize
    );
    _ctx.lineTo(
      cx + Math.cos(tipAngle + 2.356) * (triSize * 0.7),
      cy + Math.sin(tipAngle + 2.356) * (triSize * 0.7)
    );
    _ctx.lineTo(
      cx + Math.cos(tipAngle - 2.356) * (triSize * 0.7),
      cy + Math.sin(tipAngle - 2.356) * (triSize * 0.7)
    );
    _ctx.closePath();
    _ctx.fill();
    _ctx.stroke();

    _ctx.restore();

    // North indicator — drawn outside clip region so always at top
    _ctx.fillStyle = 'rgba(255,255,255,0.7)';
    _ctx.font = 'bold 9px monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText('N', cx, 10);
  }

  function setVisible(v) {
    _visible = !!v;
    if (_canvas) _canvas.style.display = _visible ? 'block' : 'none';
  }

  function toggle() {
    setVisible(!_visible);
  }

  return {
    init: init,
    update: update,
    setVisible: setVisible,
    toggle: toggle,
    get isVisible() { return _visible; }
  };
})();
