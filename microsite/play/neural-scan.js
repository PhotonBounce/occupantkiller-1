/* ============================================================
 *  NEURAL-SCAN.JS — Cyberpunk wave-start enemy scanner (passive)
 *
 *  0.3s after each new wave, a cyan scan line sweeps top-to-bottom
 *  over 0.5s, briefly revealing and highlighting all visible enemies
 *  with glowing corner-bracket boxes. Each box fades after scan passes.
 *
 *  Total duration: ~1.2s per wave.
 *  Canvas z-index 392.
 * ============================================================ */
var NeuralScan = (function () {
  'use strict';

  var TRIGGER_DELAY = 0.3;
  var SCAN_DUR      = 0.55;
  var HIGHLIGHT_DUR = 0.55;
  var LINE_H        = 4;

  var _canvas     = null;
  var _ctx        = null;
  var _init       = false;
  var _frameN     = 0;
  var _lastTs     = 0;
  var _cam        = null;

  var _waveWas    = -1;
  var _scanActive = false;
  var _scanT      = 0;
  var _scanDelay  = 0;
  var _highlights = [];

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:392;',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _startScan() {
    _scanActive = true;
    _scanT = 0;
    _highlights = [];
  }

  function _projectEnemy(e) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    try {
      var pos = e.mesh.position;
      var v = new THREE.Vector3(pos.x, pos.y + 1.0, pos.z);
      v.project(cam);
      if (v.z > 1) return null;
      var sx = (v.x * 0.5 + 0.5) * window.innerWidth;
      var sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
      if (sx < -40 || sx > window.innerWidth + 40 || sy < -40 || sy > window.innerHeight + 40) return null;
      return { x: sx, y: sy };
    } catch (e2) { return null; }
  }

  function _drawScanLine(scanY) {
    var ctx = _ctx; var W = _canvas.width;
    var grad = ctx.createLinearGradient(0, scanY - LINE_H * 4, 0, scanY + LINE_H * 4);
    grad.addColorStop(0,   'rgba(0,220,255,0)');
    grad.addColorStop(0.4, 'rgba(0,220,255,0.15)');
    grad.addColorStop(0.5, 'rgba(0,240,255,0.55)');
    grad.addColorStop(0.6, 'rgba(0,220,255,0.15)');
    grad.addColorStop(1,   'rgba(0,220,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - LINE_H * 4, W, LINE_H * 8);
    ctx.fillStyle = 'rgba(180,255,255,0.7)';
    ctx.fillRect(0, scanY - 1, W, LINE_H);
  }

  function _drawHighlight(h) {
    var t = h.life / HIGHLIGHT_DUR;
    var alpha = t * 0.75;
    var ctx = _ctx;
    var box = 22; var c = 7;
    var L = h.x - box; var R = h.x + box;
    var T = h.y - box; var B = h.y + box;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,220,255,' + alpha.toFixed(2) + ')';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0,200,255,0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(L, T + c); ctx.lineTo(L, T); ctx.lineTo(L + c, T);
    ctx.moveTo(R - c, T); ctx.lineTo(R, T); ctx.lineTo(R, T + c);
    ctx.moveTo(L, B - c); ctx.lineTo(L, B); ctx.lineTo(L + c, B);
    ctx.moveTo(R - c, B); ctx.lineTo(R, B); ctx.lineTo(R, B - c);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,255,200,' + (alpha * 0.8).toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(h.x, h.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas !== -1 && w !== _waveWas) _scanDelay = now + TRIGGER_DELAY;
        _waveWas = w;
      }
    } catch (e) {}

    if (_scanDelay > 0 && now >= _scanDelay) { _scanDelay = 0; _startScan(); }

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    if (!_scanActive && _highlights.length === 0) return;

    if (_scanActive) {
      _scanT += dt / SCAN_DUR;
      if (_scanT >= 1) { _scanT = 1; _scanActive = false; }
      var scanY = _scanT * _canvas.height;
      _drawScanLine(scanY);

      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
            var sc = _projectEnemy(e);
            if (!sc || sc.y > scanY) continue;
            var dup = false;
            for (var d = 0; d < _highlights.length; d++) {
              if (Math.abs(_highlights[d].x - sc.x) < 5 && Math.abs(_highlights[d].y - sc.y) < 5) { dup = true; break; }
            }
            if (!dup) _highlights.push({ x: sc.x, y: sc.y, life: HIGHLIGHT_DUR });
          }
        }
      } catch (er) {}
    }

    for (var j = _highlights.length - 1; j >= 0; j--) {
      _highlights[j].life -= dt;
      if (_highlights[j].life <= 0) { _highlights.splice(j, 1); continue; }
      _drawHighlight(_highlights[j]);
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.NeuralScan = NeuralScan;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { NeuralScan.init(); });
} else {
  NeuralScan.init();
}