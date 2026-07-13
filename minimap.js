window.Minimap = (function() {
  'use strict';
  // var only

  var _canvas = null;
  var _ctx = null;
  var _container = null;
  var _visible = true;
  var _radius = 80;        // pixels, radar circle radius
  var _worldRadius = 50;   // world units visible on radar
  var _rotation = 0;       // current player yaw for rotation
  var _enemies = [];       // reference to enemy list
  var _playerPos = null;
  var _blipHistory = {};   // enemyId -> last blip time (for sweep reveal)
  var _sweepAngle = 0;     // current sweep angle in radians
  var _pingQueue = [];     // {x,z,time} for manual pings

  // Blip colors by enemy type
  var BLIP_COLORS = {
    default: '#ff4444',
    BOSS: '#ff00ff',
    VEHICLE: '#ff8800',
    MEDIC: '#44ff88',
    SNIPER: '#ffff00',
    DRONE: '#00ffff',
  };

  function init(enemiesRef) {
    _enemies = enemiesRef || [];

    _container = document.createElement('div');
    _container.id = 'minimap-container';
    _container.style.cssText = [
      'position:fixed;bottom:20px;left:20px;',
      'width:' + (_radius*2) + 'px;height:' + (_radius*2) + 'px;',
      'border-radius:50%;',
      'border:2px solid rgba(0,255,100,0.4);',
      'background:rgba(0,0,0,0.6);',
      'overflow:hidden;',
      'z-index:4000;pointer-events:none;',
      'box-shadow:0 0 8px rgba(0,255,100,0.2);',
    ].join('');

    _canvas = document.createElement('canvas');
    _canvas.width = _radius * 2;
    _canvas.height = _radius * 2;
    _canvas.style.cssText = 'position:absolute;top:0;left:0;';
    _container.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');

    // N label
    var nLabel = document.createElement('div');
    nLabel.style.cssText = [
      'position:absolute;top:2px;left:50%;transform:translateX(-50%);',
      'font-family:monospace;font-size:9px;color:rgba(0,255,100,0.6);',
      'pointer-events:none;',
    ].join('');
    nLabel.textContent = 'N';
    _container.appendChild(nLabel);

    document.body.appendChild(_container);
  }

  function update(playerPos, playerYaw, enemies) {
    if (!_canvas || !_ctx || !_visible) return;
    _playerPos = playerPos;
    _rotation = playerYaw || 0;
    if (enemies) _enemies = enemies;

    var ctx = _ctx;
    var cx = _radius;
    var cy = _radius;
    var r = _radius;

    ctx.clearRect(0, 0, r*2, r*2);

    // ── Background circle (already clipped by border-radius, but clip for canvas too) ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.clip();

    // Grid rings
    ctx.strokeStyle = 'rgba(0,255,100,0.1)';
    ctx.lineWidth = 1;
    for (var ring = 1; ring <= 2; ring++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (ring / 2), 0, Math.PI*2);
      ctx.stroke();
    }

    // Crosshair lines
    ctx.strokeStyle = 'rgba(0,255,100,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // ── Sweep line ──
    _sweepAngle = (_sweepAngle + 0.03) % (Math.PI * 2);
    var sweepX = cx + Math.cos(_sweepAngle - _rotation) * r;
    var sweepY = cy + Math.sin(_sweepAngle - _rotation) * r;
    var sweepGrad = ctx.createLinearGradient(cx, cy, sweepX, sweepY);
    sweepGrad.addColorStop(0, 'rgba(0,255,100,0.3)');
    sweepGrad.addColorStop(1, 'rgba(0,255,100,0)');
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, _sweepAngle - _rotation - 0.4, _sweepAngle - _rotation);
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // ── Enemy blips ──
    if (_enemies && playerPos) {
      for (var i = 0; i < _enemies.length; i++) {
        var e = _enemies[i];
        if (!e || !e.mesh || e.hp <= 0) continue;
        var ePos = e.mesh.position;

        var dx = ePos.x - playerPos.x;
        var dz = ePos.z - playerPos.z;
        var dist = Math.sqrt(dx*dx + dz*dz);
        if (dist > _worldRadius) continue;

        // Rotate relative to player yaw
        var angle = Math.atan2(dz, dx) - _rotation;
        var scale = (dist / _worldRadius) * (r - 6);
        var bx = cx + Math.cos(angle) * scale;
        var by = cy + Math.sin(angle) * scale;

        // Color by type
        var eType = (e.type && BLIP_COLORS[e.type]) ? e.type : 'default';
        if (e.type && e.type.indexOf('BOSS') !== -1) eType = 'BOSS';
        var color = BLIP_COLORS[eType] || BLIP_COLORS.default;

        // Draw blip
        var blipR = (eType === 'BOSS') ? 5 : (eType === 'VEHICLE') ? 4 : 3;
        ctx.beginPath();
        ctx.arc(bx, by, blipR, 0, Math.PI*2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow for boss
        if (eType === 'BOSS') {
          ctx.beginPath();
          ctx.arc(bx, by, blipR + 3, 0, Math.PI*2);
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.4;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // ── Player dot (center) ──
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Player direction indicator
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 10);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── Ping blips ──
    var now = performance.now();
    for (var p = _pingQueue.length - 1; p >= 0; p--) {
      var ping = _pingQueue[p];
      var age = (now - ping.time) / 1000;
      if (age > 3) { _pingQueue.splice(p, 1); continue; }
      var px_dx = ping.x - (playerPos ? playerPos.x : 0);
      var px_dz = ping.z - (playerPos ? playerPos.z : 0);
      var px_dist = Math.sqrt(px_dx*px_dx + px_dz*px_dz);
      if (px_dist > _worldRadius) continue;
      var px_angle = Math.atan2(px_dz, px_dx) - _rotation;
      var px_scale = (px_dist / _worldRadius) * (r - 6);
      var ppx = cx + Math.cos(px_angle) * px_scale;
      var ppy = cy + Math.sin(px_angle) * px_scale;
      ctx.globalAlpha = Math.max(0, 1 - age / 3);
      ctx.beginPath();
      ctx.arc(ppx, ppy, 5, 0, Math.PI*2);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function show() { _visible = true; if (_container) _container.style.display = ''; }
  function hide() { _visible = false; if (_container) _container.style.display = 'none'; }
  function toggle() { if (_visible) hide(); else show(); }
  function ping(x, z) { _pingQueue.push({x: x, z: z, time: performance.now()}); }
  function setWorldRadius(r) { _worldRadius = r; }

  return {
    init: init,
    update: update,
    show: show,
    hide: hide,
    toggle: toggle,
    ping: ping,
    setWorldRadius: setWorldRadius,
  };
})();
