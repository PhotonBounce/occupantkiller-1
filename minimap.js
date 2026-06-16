/* ============================================================
 *  MINIMAP.JS — Real-time tactical overhead minimap
 *
 *  Draws a 160×160 canvas (bottom-left corner, toggle with M).
 *  Shows:
 *    • Player arrow (white, rotates with camera yaw)
 *    • Enemy dots (red)   — scales with distance from center
 *    • Dog-tag pickups    — gold diamonds (if DogTagSystem active)
 *    • Airdrop crates     — yellow squares (if AirdropSystem active)
 *    • North indicator
 *    • Concentric range rings
 *  Uses THREE.js camera + Enemies.getAll() — zero core-file edits.
 * ============================================================ */
var MinimapSystem = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    SIZE:        160,   // canvas px
    SCALE:       0.9,   // world-units per pixel (lower = more zoomed in)
    BG_COLOR:    'rgba(0,8,16,0.82)',
    BORDER:      'rgba(68,170,255,0.35)',
    RING_COLOR:  'rgba(68,170,255,0.10)',
    NUM_RINGS:   3,
    PLAYER_COLOR:'#44aaff',
    ENEMY_COLOR: '#ff3322',
    TAG_COLOR:   '#ffd700',
    DROP_COLOR:  '#ffcc44',
    NORTH_COLOR: '#ff4444',
    LABEL_COLOR: '#88aacc',
    EDGE_MARGIN: 12,    // px from screen edge
    FADE_MS:     180,   // fade in/out duration
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _visible     = true;
  var _canvas      = null;
  var _ctx         = null;
  var _wrapper     = null;
  var _opacity     = 1;
  var _targetOp    = 1;
  var _halfSize    = CFG.SIZE / 2;
  var _keyHandler  = null;

  /* ── Helpers ────────────────────────────── */
  function _getCamera()  { try { return window.GameManager && GameManager.getCamera  ? GameManager.getCamera()  : null; } catch(e){return null;} }
  function _getPlayer()  { try { return window.player || null; } catch(e){return null;} }

  /* World → canvas pixel (relative to player) */
  function _wx(px, playerX) { return _halfSize + (px - playerX) / CFG.SCALE; }
  function _wz(pz, playerZ) { return _halfSize - (pz - playerZ) / CFG.SCALE; } // Z flipped

  /* Rotate a point around origin by -yaw so map is camera-relative */
  function _rotPt(x, y, yaw) {
    var c = Math.cos(-yaw), s = Math.sin(-yaw);
    return { x: c*x - s*y, y: s*x + c*y };
  }

  /* ── Draw one frame ─────────────────────── */
  function _draw() {
    var ctx = _ctx;
    var sz  = CFG.SIZE;
    var h   = _halfSize;

    ctx.clearRect(0, 0, sz, sz);

    var cam    = _getCamera();
    var player = _getPlayer();
    if (!player || !player.position) return;

    var px = player.position.x;
    var pz = player.position.z;
    var yaw = 0;
    if (cam) {
      // Extract Y-rotation from camera
      var camDir = new THREE.Vector3();
      cam.getWorldDirection(camDir);
      yaw = Math.atan2(camDir.x, camDir.z);
    }

    /* ── Background circle ── */
    ctx.save();
    ctx.beginPath();
    ctx.arc(h, h, h - 1, 0, Math.PI * 2);
    ctx.fillStyle = CFG.BG_COLOR;
    ctx.fill();
    ctx.strokeStyle = CFG.BORDER;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip(); // everything below is clipped to the circle

    /* ── Range rings ── */
    for (var r = 1; r <= CFG.NUM_RINGS; r++) {
      ctx.beginPath();
      ctx.arc(h, h, h * r / (CFG.NUM_RINGS + 0.5), 0, Math.PI * 2);
      ctx.strokeStyle = CFG.RING_COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* ── Cardinal north line ── */
    var northDir = _rotPt(0, -1, yaw); // world-north = -Z
    ctx.beginPath();
    ctx.moveTo(h, h);
    ctx.lineTo(h + northDir.x * (h - 6), h + northDir.y * (h - 6));
    ctx.strokeStyle = 'rgba(255,60,60,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* ── Enemies ── */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var enemies = Enemies.getAll();
        for (var i = 0; i < enemies.length; i++) {
          var e = enemies[i];
          if (!e || !e.mesh || e.dead) continue;
          var ex = e.mesh.position.x - px;
          var ez = e.mesh.position.z - pz;
          var rp = _rotPt(ex, ez, yaw);
          var cx = h + rp.x / CFG.SCALE;
          var cy = h - rp.y / CFG.SCALE;
          var uavSpotted = window._uavSpottedEnemies && window._uavSpottedEnemies.has(e);
          var dotR = uavSpotted ? 4 : 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
          ctx.fillStyle = uavSpotted ? ('#ff8800') : CFG.ENEMY_COLOR;
          ctx.fill();
          if (uavSpotted) {
            ctx.beginPath();
            ctx.arc(cx, cy, dotR + 2.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,136,0,0.45)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    } catch(err) {}

    /* ── Dog tags ── */
    try {
      var tagList = (window.DogTagSystem && DogTagSystem.getTags) ? DogTagSystem.getTags() : null;
      if (tagList) {
        for (var t = 0; t < tagList.length; t++) {
          if (!tagList[t] || !tagList[t].mesh) continue;
          var tx = tagList[t].mesh.position.x - px;
          var tz = tagList[t].mesh.position.z - pz;
          var trp = _rotPt(tx, tz, yaw);
          var tcx = h + trp.x / CFG.SCALE;
          var tcy = h - trp.y / CFG.SCALE;
          ctx.save();
          ctx.translate(tcx, tcy);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = CFG.TAG_COLOR;
          ctx.fillRect(-2, -2, 4, 4);
          ctx.restore();
        }
      }
    } catch(err) {}

    /* ── Airdrop crate ── */
    try {
      var activeDrop = (window.AirdropSystem && AirdropSystem.getActiveDrop) ? AirdropSystem.getActiveDrop() : null;
      if (activeDrop && activeDrop.group) {
        var dpos = activeDrop.group.position;
        var ddx = dpos.x - px;
        var ddz = dpos.z - pz;
        var drp = _rotPt(ddx, ddz, yaw);
        var dcx = h + drp.x / CFG.SCALE;
        var dcy = h - drp.y / CFG.SCALE;
        ctx.fillStyle = CFG.DROP_COLOR;
        ctx.fillRect(dcx - 3, dcy - 3, 6, 6);
      }
    } catch(err) {}

    /* ── Player arrow ── */
    ctx.save();
    ctx.translate(h, h);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fillStyle = CFG.PLAYER_COLOR;
    ctx.fill();
    ctx.restore();

    /* ── North label ── */
    var nlx = h + northDir.x * (h - 10);
    var nly = h + northDir.y * (h - 10);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(255,80,80,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nlx, nly);

    ctx.restore(); // end clip
  }

  /* ── Render loop ─────────────────────────── */
  function _rafLoop() {
    if (_wrapper) {
      _wrapper.style.opacity = _opacity.toFixed(2);
    }
    if (_visible && _opacity < 1) { _opacity = Math.min(1, _opacity + 0.06); }
    if (!_visible && _opacity > 0) { _opacity = Math.max(0, _opacity - 0.06); }

    if (_opacity > 0) {
      try { _draw(); } catch(e) {}
    }
    requestAnimationFrame(_rafLoop);
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    /* Only run if THREE is available (game context) */
    if (typeof THREE === 'undefined') return;

    /* Wrapper */
    _wrapper = document.createElement('div');
    _wrapper.id = 'minimap-wrapper';
    _wrapper.style.cssText = [
      'position:fixed;bottom:' + CFG.EDGE_MARGIN + 'px;left:' + CFG.EDGE_MARGIN + 'px;',
      'z-index:200;pointer-events:none;transition:opacity ' + (CFG.FADE_MS/1000) + 's;',
      'user-select:none;',
    ].join('');

    /* Label */
    var label = document.createElement('div');
    label.style.cssText = [
      'text-align:center;font-family:monospace;font-size:9px;',
      'color:rgba(68,170,255,0.55);letter-spacing:0.12em;',
      'margin-bottom:3px;',
    ].join('');
    label.textContent = 'TACTICAL MAP  [\\]';
    _wrapper.appendChild(label);

    /* Canvas */
    _canvas = document.createElement('canvas');
    _canvas.width  = CFG.SIZE;
    _canvas.height = CFG.SIZE;
    _canvas.style.cssText = [
      'display:block;border-radius:50%;',
      'box-shadow:0 0 12px rgba(68,170,255,0.2),inset 0 0 8px rgba(0,0,0,0.5);',
    ].join('');
    _ctx = _canvas.getContext('2d');
    _wrapper.appendChild(_canvas);
    document.body.appendChild(_wrapper);

    /* Toggle with Y key (M is taken by mortar deploy) */
    _keyHandler = function (e) {
      if (e.code === 'Backslash' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        _visible = !_visible;
      }
    };
    window.addEventListener('keydown', _keyHandler);

    /* Expose internal _tags/_drops so draw can read them */
    requestAnimationFrame(_rafLoop);
  }

  return { init: init };
})();

window.MinimapSystem = MinimapSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { MinimapSystem.init(); });
} else {
  MinimapSystem.init();
}
