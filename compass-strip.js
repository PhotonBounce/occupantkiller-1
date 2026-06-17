/* ============================================================
 *  COMPASS-STRIP.JS — tactical yaw compass at top-centre (passive)
 *
 *  Reads the THREE.js camera's quaternion each frame to derive
 *  the player's facing yaw (0°=North, 90°=East, etc.).
 *  Renders a thin horizontal strip of degree ticks and cardinal
 *  labels (N / NE / E / SE / S / SW / W / NW) that scrolls
 *  left/right as the player rotates.
 *
 *  Strip: 280px wide × 18px tall, centred at top:8px.
 *  Canvas-based. z-index 362 (same tier as tactical-compass.js
 *  if that exists, but this is a new, lighter implementation).
 *
 *  Passive — no keybind.
 * ============================================================ */
var CompassStrip = (function () {
  'use strict';

  var W       = 280;
  var H       = 18;
  var TICK_PX = 2.0;    /* px per degree */
  var TOP_PX  = 8;

  var CARDINALS = [
    { deg: 0,   label: 'N'  },
    { deg: 45,  label: 'NE' },
    { deg: 90,  label: 'E'  },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S'  },
    { deg: 225, label: 'SW' },
    { deg: 270, label: 'W'  },
    { deg: 315, label: 'NW' },
  ];

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _yaw     = 0;
  var _cam     = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.width  = W;
    _canvas.height = H;
    _canvas.style.cssText = [
      'position:fixed;',
      'left:50%;top:' + TOP_PX + 'px;',
      'transform:translateX(-50%);',
      'pointer-events:none;',
      'z-index:362;',
      'image-rendering:pixelated;',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  function _draw(yawDeg) {
    var ctx = _ctx;
    ctx.clearRect(0, 0, W, H);

    /* Background strip */
    ctx.fillStyle = 'rgba(0,4,12,0.55)';
    ctx.fillRect(0, 0, W, H);

    /* Bottom border line */
    ctx.strokeStyle = 'rgba(80,200,255,0.25)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, H - 0.5);
    ctx.lineTo(W, H - 0.5);
    ctx.stroke();

    /* Draw ticks for ±(W/2/TICK_PX) degrees around current yaw */
    var halfW    = W / 2;
    var halfSpan = halfW / TICK_PX + 5;
    var startDeg = Math.floor(yawDeg - halfSpan);
    var endDeg   = Math.ceil(yawDeg + halfSpan);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    for (var d = startDeg; d <= endDeg; d++) {
      var x = halfW + (d - yawDeg) * TICK_PX;
      if (x < 0 || x > W) continue;

      var norm = ((d % 360) + 360) % 360;
      var isMajor = (norm % 45 === 0);
      var isMid   = (norm % 10 === 0);

      if (isMajor) {
        /* Cardinal tick + label */
        ctx.strokeStyle = 'rgba(80,200,255,0.7)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(x, 1);
        ctx.lineTo(x, H - 4);
        ctx.stroke();

        var label = '';
        for (var c = 0; c < CARDINALS.length; c++) {
          if (CARDINALS[c].deg === norm) { label = CARDINALS[c].label; break; }
        }
        ctx.fillStyle = (norm === 0 || norm === 180)
          ? 'rgba(255,100,100,0.9)'
          : 'rgba(80,200,255,0.8)';
        ctx.font = 'bold 7px "Courier New"';
        ctx.fillText(label, x, 2);
      } else if (isMid) {
        ctx.strokeStyle = 'rgba(80,200,255,0.35)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, H - 7);
        ctx.lineTo(x, H - 4);
        ctx.stroke();
      } else if (norm % 5 === 0) {
        ctx.strokeStyle = 'rgba(80,200,255,0.15)';
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, H - 5);
        ctx.lineTo(x, H - 4);
        ctx.stroke();
      }
    }

    /* Centre cursor triangle */
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(halfW, H - 2);
    ctx.lineTo(halfW - 3, H + 1);
    ctx.lineTo(halfW + 3, H + 1);
    ctx.closePath();
    ctx.fill();

    /* Current bearing readout */
    var bearStr = Math.round(((yawDeg % 360) + 360) % 360) + '°';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '6px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText(bearStr, W - 3, H - 8);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;

    /* Extract yaw from camera quaternion */
    try {
      var fwd = new THREE.Vector3(0, 0, -1);
      fwd.applyQuaternion(cam.quaternion);
      /* atan2(x, -z) gives yaw where 0=North(+z) → clockwise positive */
      var yawRad = Math.atan2(fwd.x, -fwd.z);
      var yawDeg = yawRad * (180 / Math.PI);
      _yaw = ((yawDeg % 360) + 360) % 360;
      _draw(_yaw);
    } catch (er) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.CompassStrip = CompassStrip;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { CompassStrip.init(); });
} else {
  CompassStrip.init();
}
