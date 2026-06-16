/* ============================================================
 *  NIGHT-VISION.JS — NVG overlay (N key toggle)
 *
 *  Applies a full-screen green tint + CRT grain + edge vignette
 *  over the Three.js canvas to simulate NVGs.
 *  Also brightens the THREE.js scene while active (ambient boost).
 *
 *  N key → toggle on/off with smooth fade transition.
 *  HUD badge "NVG" appears while active.
 * ============================================================ */
var NightVision = (function () {
  'use strict';

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _active      = false;
  var _canvas      = null;
  var _ctx         = null;
  var _badge       = null;
  var _raf         = 0;
  var _opacity     = 0;
  var _noise       = [];          // prebuilt noise buffer
  var _noiseW      = 256;
  var _noiseH      = 256;
  var _noiseFrame  = 0;
  var _noiseCanvas = null;
  var _noiseCtx    = null;
  var _origAmbient = null;       // stored scene ambient light color

  /* ── Build noise texture ────────────────── */
  function _buildNoise() {
    _noiseCanvas = document.createElement('canvas');
    _noiseCanvas.width  = _noiseW;
    _noiseCanvas.height = _noiseH;
    _noiseCtx = _noiseCanvas.getContext('2d');
  }

  function _refreshNoise() {
    var imgData = _noiseCtx.createImageData(_noiseW, _noiseH);
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 60) | 0;
      d[i]   = 0;
      d[i+1] = v;
      d[i+2] = 0;
      d[i+3] = v * 2;
    }
    _noiseCtx.putImageData(imgData, 0, 0);
  }

  /* ── Draw one NVG frame ─────────────────── */
  function _drawFrame() {
    if (!_canvas || _opacity <= 0) return;

    var w = window.innerWidth;
    var h = window.innerHeight;

    if (_canvas.width !== w || _canvas.height !== h) {
      _canvas.width  = w;
      _canvas.height = h;
    }

    var ctx = _ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = _opacity;

    /* Green tint wash */
    ctx.fillStyle = 'rgba(0, 40, 0, 0.45)';
    ctx.fillRect(0, 0, w, h);

    /* Noise tiles */
    if ((_noiseFrame++ % 2) === 0) _refreshNoise();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = _opacity * 0.18;
    for (var tx = 0; tx < w; tx += _noiseW) {
      for (var ty = 0; ty < h; ty += _noiseH) {
        ctx.drawImage(_noiseCanvas, tx, ty);
      }
    }

    /* Scan lines */
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = _opacity * 0.07;
    ctx.fillStyle = '#000';
    for (var y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    /* Vignette */
    ctx.globalAlpha = _opacity;
    var grad = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,15,0,0.7)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    /* Brightness boost overlay (additive green) */
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = _opacity * 0.12;
    ctx.fillStyle = '#003300';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    /* Corner brackets — military HUD look */
    _drawCorners(ctx, w, h);

    /* Center reticle dot */
    ctx.beginPath();
    ctx.arc(w/2, h/2, 2, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,255,60,' + (_opacity * 0.5) + ')';
    ctx.fill();
  }

  function _drawCorners(ctx, w, h) {
    var c  = 20;
    var a  = 'rgba(0,255,80,' + (_opacity * 0.55) + ')';
    ctx.strokeStyle = a;
    ctx.lineWidth   = 1.5;

    var pairs = [[0,0,1,1],[w,0,-1,1],[0,h,1,-1],[w,h,-1,-1]];
    for (var i = 0; i < pairs.length; i++) {
      var x = pairs[i][0], y = pairs[i][1], dx = pairs[i][2], dy = pairs[i][3];
      ctx.beginPath();
      ctx.moveTo(x + dx*c, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy*c);
      ctx.stroke();
    }
  }

  /* ── Toggle scene ambient light ─────────── */
  function _boostScene(on) {
    try {
      var scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null;
      if (!scene) return;
      scene.traverse(function (obj) {
        if (obj.isAmbientLight) {
          if (on) {
            _origAmbient = { r: obj.color.r, g: obj.color.g, b: obj.color.b, intensity: obj.intensity };
            obj.color.setRGB(0.1, 0.5, 0.1);
            obj.intensity = Math.min(3, (obj.intensity || 1) * 2.5);
          } else if (_origAmbient) {
            obj.color.setRGB(_origAmbient.r, _origAmbient.g, _origAmbient.b);
            obj.intensity = _origAmbient.intensity;
            _origAmbient = null;
          }
        }
      });
    } catch(e) {}
  }

  /* ── rAF loop ───────────────────────────── */
  function _tick() {
    _raf = requestAnimationFrame(_tick);

    if (_active && _opacity < 1) {
      _opacity = Math.min(1, _opacity + 0.06);
      if (_badge) _badge.style.opacity = String(_opacity);
    }
    if (!_active && _opacity > 0) {
      _opacity = Math.max(0, _opacity - 0.06);
      if (_badge) _badge.style.opacity = String(_opacity);
    }

    _drawFrame();
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _buildNoise();

    /* Overlay canvas */
    _canvas = document.createElement('canvas');
    _canvas.id = 'nvg-canvas';
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:108;',
    ].join('');
    _ctx = _canvas.getContext('2d');
    document.body.appendChild(_canvas);

    /* HUD badge */
    _badge = document.createElement('div');
    _badge.id = 'nvg-badge';
    _badge.style.cssText = [
      'position:fixed;top:46px;left:12px;font-family:monospace;font-size:10px;',
      'color:#00ff50;background:rgba(0,0,0,0.6);border:1px solid rgba(0,255,80,0.4);',
      'padding:2px 8px;border-radius:3px;z-index:215;pointer-events:none;',
      'letter-spacing:0.2em;opacity:0;',
    ].join('');
    _badge.textContent = '▶ NVG ACTIVE';
    document.body.appendChild(_badge);

    /* Key handler */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyN' && e.altKey && !e.ctrlKey) {
        e.preventDefault();
        _active = !_active;
        _boostScene(_active);
        try {
          if (window.HUD && HUD.notifyPickup) {
            HUD.notifyPickup(_active ? '🟢 NVG ON' : 'NVG OFF', _active ? '#00ff50' : '#aaa');
          }
        } catch(ex) {}
      }
    });

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.NightVision = NightVision;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { NightVision.init(); });
} else {
  NightVision.init();
}
