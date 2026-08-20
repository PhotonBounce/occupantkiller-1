/* ═══════════════════════════════════════════════════════════════════════
   RENDER HEALTH WATCHDOG  —  in-game, on-device self-diagnostics.

   Why this exists: headless/software-GPU QA cannot detect a real-device
   graphics failure (blank world, dead FPS, lost WebGL context). This runs
   INSIDE the game on the player's actual hardware and makes such failures
   announce themselves — a red banner the user can screenshot — instead of
   silently shipping a blank screen.

   Signals (engine truth, GPU-independent):
     • FPS            — rAF frame counter over a 1s window
     • triangles/calls— THREE renderer.info.render (was anything drawn?)
     • visible meshes — scene traversal (did the world build?)
     • context loss   — webglcontextlost event on the game canvas
     • GPU name       — WEBGL_debug_renderer_info

   Verdict while playing:
     FAIL  → context lost, OR 0 triangles drawn, OR FPS < 3
     WARN  → FPS < 20
     OK    → otherwise
   On FAIL a red banner shows automatically. Everything is exposed on
   window.__renderHealth for automated QA. Add ?diag=1 to force the full
   overlay always-on. Fully defensive: any error here never touches the game.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var VERBOSE = /[?&]diag=1\b/.test(location.search);
  var _frames = 0, _fps = 0, _lastCtxLost = 0;
  var _boundCanvas = null;

  // ── FPS counter (own rAF; cheap) ──
  (function loop() { _frames++; requestAnimationFrame(loop); })();

  function gm() { return (typeof window.GameManager !== 'undefined') ? window.GameManager : null; }

  function playing() {
    try { var g = gm(); return !!(g && g.getState && (g.getState() === 'playing' || g.getState() === 'preWave')); }
    catch (e) { return false; }
  }

  function bindContextLoss() {
    try {
      var g = gm(); var r = g && g.getRenderer && g.getRenderer();
      var cv = (r && r.domElement) || document.querySelector('#game-container canvas') || document.querySelector('canvas');
      if (cv && cv !== _boundCanvas) {
        _boundCanvas = cv;
        cv.addEventListener('webglcontextlost', function () { _lastCtxLost = Date.now(); });
      }
    } catch (e) {}
  }

  function gpuName(r) {
    try {
      var gl = r && r.getContext && r.getContext();
      if (!gl) return '';
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER) || '');
    } catch (e) { return ''; }
  }

  // ── Banner ──
  var banner = null;
  function ensureBanner() {
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'render-health-banner';
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:100000;display:none;'
      + 'font-family:monospace;font-size:12px;line-height:1.4;padding:8px 12px;'
      + 'background:rgba(150,10,10,.94);color:#fff;text-align:center;'
      + 'border-bottom:2px solid #ff5555;text-shadow:0 1px 2px #000;pointer-events:none;';
    (document.body || document.documentElement).appendChild(banner);
    return banner;
  }
  function overlay() {
    if (!VERBOSE) return null;
    var o = document.getElementById('render-health-overlay');
    if (!o) {
      o = document.createElement('div'); o.id = 'render-health-overlay';
      o.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99999;font-family:monospace;'
        + 'font-size:10px;color:#8fffa8;background:rgba(0,0,0,.6);padding:4px 6px;'
        + 'border:1px solid #2a5;border-radius:3px;white-space:pre;pointer-events:none;';
      (document.body || document.documentElement).appendChild(o);
    }
    return o;
  }

  // ── Frame-cost instrumentation ──
  // Times the main renderer.render() call and watches the shader-program count.
  // On ANGLE/D3D11 a program compile costs tens of ms, so a system that keeps
  // creating new material variants recompiles shaders continuously and pins the
  // game at ~1 FPS regardless of scene size — the banner now shows exactly that.
  var _patchedRenderer = null, _renderMsSum = 0, _renderMsN = 0, _lastProgCount = -1, _progGrowth = 0;
  function instrumentRenderer(r) {
    if (!r || r === _patchedRenderer || !r.render) return;
    var orig = r.render.bind(r);
    r.render = function (sc, cam) {
      var t = performance.now();
      var out = orig(sc, cam);
      _renderMsSum += performance.now() - t; _renderMsN++;
      return out;
    };
    _patchedRenderer = r;
  }

  function sample() {
    try {
      bindContextLoss();
      var g = gm();
      var r = g && g.getRenderer && g.getRenderer();
      instrumentRenderer(r);
      var sc = g && g.getScene && g.getScene();
      var tris = null, calls = null, vis = 0;
      if (r && r.info && r.info.render) { tris = r.info.render.triangles; calls = r.info.render.calls; }
      if (sc && sc.traverse) { sc.traverse(function (o) { if (o.isMesh && o.geometry && o.visible) vis++; }); }
      var ctxLost = (Date.now() - _lastCtxLost) < 3000;

      var live = playing();
      var reason = '';
      if (live) {
        if (ctxLost) reason = 'WEBGL CONTEXT LOST';
        else if (tris != null && tris < 200) reason = 'WORLD NOT DRAWING (0 triangles)';
        else if (_fps > 0 && _fps < 3) reason = 'FROZEN (' + _fps + ' FPS)';
      }
      var status = reason ? 'FAIL' : (live && _fps > 0 && _fps < 20 ? 'WARN' : 'OK');

      // frame-cost readings for this 1s window
      var renderMs = _renderMsN ? +( _renderMsSum / _renderMsN ).toFixed(1) : null;
      _renderMsSum = 0; _renderMsN = 0;
      var progs = null, geos = null, texs = null;
      try {
        if (r && r.info) {
          progs = r.info.programs ? r.info.programs.length : null;
          if (r.info.memory) { geos = r.info.memory.geometries; texs = r.info.memory.textures; }
        }
      } catch (e2) {}
      _progGrowth = (_lastProgCount >= 0 && progs != null) ? (progs - _lastProgCount) : 0;
      if (progs != null) _lastProgCount = progs;
      var canv2d = 0, canvGl = 0;
      try {
        var cvs = document.querySelectorAll('canvas');
        for (var ci = 0; ci < cvs.length; ci++) {
          // getContext returns the existing context (or null if another type owns it)
          if (cvs[ci].getContext('2d')) canv2d++; else canvGl++;
        }
      } catch (e3) {}

      var health = {
        status: status, reason: reason, fps: _fps,
        triangles: tris, drawCalls: calls, visibleMeshes: vis,
        renderMs: renderMs, programs: progs, programGrowth: _progGrowth,
        geometries: geos, textures: texs, canvases2d: canv2d, canvasesGl: canvGl,
        contextLost: ctxLost, gpu: gpuName(r), playing: live, t: Date.now()
      };
      window.__renderHealth = health;

      var b = ensureBanner();
      if (status === 'FAIL') {
        b.style.display = 'block';
        b.textContent = '⚠ RENDER FAULT: ' + reason + ' · ' + _fps + ' FPS · '
          + (tris != null ? tris + ' tris' : '? tris')
          + ' · draw ' + (calls != null ? calls : '?')
          + ' · gpu.render ' + (renderMs != null ? renderMs + 'ms' : '?')
          + ' · progs ' + (progs != null ? progs : '?') + (_progGrowth > 0 ? '(+' + _progGrowth + '/s!)' : '')
          + ' · tex ' + (texs != null ? texs : '?') + ' geo ' + (geos != null ? geos : '?')
          + ' · cv ' + canvGl + 'gl/' + canv2d + '2d'
          + ' · ' + (health.gpu || 'unknown')
          + ' — please screenshot this';
      } else {
        b.style.display = 'none';
      }
      var o = overlay();
      if (o) o.textContent = 'RH ' + status + ' | ' + _fps + ' fps | tris ' + tris
        + ' | calls ' + calls + ' | vis ' + vis + '\nGPU ' + (health.gpu || '?').slice(0, 40);
    } catch (e) { /* diagnostics must never break the game */ }
  }

  var _t0 = Date.now();
  setInterval(function () {
    var dt = (Date.now() - _t0) / 1000; _t0 = Date.now();
    _fps = dt > 0 ? Math.round(_frames / dt) : 0; _frames = 0;
    sample();
  }, 1000);

  window.RenderHealth = {
    get: function () { return window.__renderHealth || null; },
    showOverlay: function () { VERBOSE = true; },
    hideBanner: function () { if (banner) banner.style.display = 'none'; }
  };
})();
