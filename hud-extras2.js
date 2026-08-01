/* ============================================================================
   OccupantKiller — HUD Extras II (additive, defensive, read-only).
   Round 2 of combat HUD upgrades, layered over the existing HUD:
     1. Top-down tactical minimap (bottom-left)  — player + enemy/ally blips
     2. Wave tracker bar (top, under compass)     — WAVE x/y + hostiles remaining
     3. Multi-kill streak announcer (center)      — DOUBLE/TRIPLE/RAMPAGE banners
   Reads only GameManager.getCamera/getCurrentWave/getStageInfo, Enemies.getAll,
   NPCSystem.getAll, CameraSystem.getYaw. Anything missing simply no-ops, so this
   can never break gameplay. Active only while in a live match.
   ========================================================================== */
(function () {
  'use strict';

  function el(tag, css, parent) {
    var d = document.createElement(tag);
    if (css) d.style.cssText = css;
    (parent || document.body).appendChild(d);
    return d;
  }
  function posOf(o) {
    if (!o) return null;
    if (o.position && typeof o.position.x === 'number') return o.position;
    if (o.mesh && o.mesh.position) return o.mesh.position;
    return null;
  }
  function alive(o) {
    if (!o) return false;
    if (o.alive === false) return false;
    if (typeof o.hp === 'number') return o.hp > 0;
    if (typeof o.health === 'number') return o.health > 0;
    return true;
  }

  var root = el('div',
    'position:fixed;inset:0;pointer-events:none;z-index:951;display:none;'
    + 'font-family:"JetBrains Mono",monospace;');
  root.id = 'tacmap-overlay';  // so CSS can hide the bottom-left radar on mobile
                               // (the top-left minimap already covers navigation,
                               // and this radar sat on top of the movement joystick)

  /* 1. Minimap --------------------------------------------------------------- */
  var MM = 140, RANGE = 70, _sweep = 0;
  var mapWrap = el('div',
    'position:absolute;left:12px;bottom:12px;width:' + MM + 'px;height:' + MM + 'px;'
    + 'border:1px solid rgba(0,216,255,.4);border-radius:50%;overflow:hidden;'
    + 'background:rgba(6,10,18,.55);box-shadow:0 0 12px rgba(0,0,0,.5);', root);
  var mapCanvas = el('canvas', 'width:100%;height:100%;display:block;', mapWrap);
  mapCanvas.width = MM; mapCanvas.height = MM;
  var mctx = mapCanvas.getContext('2d');

  function drawMinimap() {
    if (!mctx) return;
    mctx.clearRect(0, 0, MM, MM);
    var cx = MM / 2, cy = MM / 2;
    // range rings
    mctx.strokeStyle = 'rgba(0,216,255,.18)';
    mctx.lineWidth = 1;
    for (var r = 1; r <= 2; r++) { mctx.beginPath(); mctx.arc(cx, cy, (MM / 2) * (r / 2), 0, Math.PI * 2); mctx.stroke(); }

    var cam = null, yaw = 0;
    try { if (typeof GameManager !== 'undefined' && GameManager.getCamera) cam = GameManager.getCamera(); } catch (e) {}
    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) yaw = CameraSystem.getYaw(); } catch (e) {}
    var pp = cam && cam.position ? cam.position : null;

    function plot(list, color) {
      if (!pp || !list) return;
      var sy = Math.sin(yaw), cyr = Math.cos(yaw);
      for (var i = 0; i < list.length; i++) {
        var o = list[i]; if (!alive(o)) continue;
        var p = posOf(o); if (!p) continue;
        var dx = p.x - pp.x, dz = p.z - pp.z;
        // rotate world->map so the player's facing points up
        var rx = dx * cyr - dz * sy;
        var rz = dx * sy + dz * cyr;
        var mx = cx + (rx / RANGE) * (MM / 2 - 6);
        var my = cy + (rz / RANGE) * (MM / 2 - 6);
        var ddist = Math.sqrt(rx * rx + rz * rz);
        if (ddist > RANGE) { // clamp to edge
          var k = (RANGE / ddist);
          mx = cx + (rx * k / RANGE) * (MM / 2 - 6);
          my = cy + (rz * k / RANGE) * (MM / 2 - 6);
        }
        mctx.fillStyle = color;
        mctx.beginPath(); mctx.arc(mx, my, 2.6, 0, Math.PI * 2); mctx.fill();
      }
    }
    try { if (typeof NPCSystem !== 'undefined' && NPCSystem.getAll) plot(NPCSystem.getAll(), '#5dff9e'); } catch (e) {}
    try { if (typeof Enemies !== 'undefined' && Enemies.getAll) plot(Enemies.getAll(), '#ff5a5a'); } catch (e) {}

    // radar sweep line (rotating)
    _sweep = (_sweep + 0.025) % (Math.PI * 2);
    mctx.strokeStyle = 'rgba(0,216,255,.45)'; mctx.lineWidth = 1.5;
    mctx.beginPath(); mctx.moveTo(cx, cy);
    mctx.lineTo(cx + Math.sin(_sweep) * (MM / 2 - 2), cy - Math.cos(_sweep) * (MM / 2 - 2));
    mctx.stroke();

    // player marker (always centered, facing up)
    mctx.fillStyle = '#ffe27a';
    mctx.beginPath(); mctx.moveTo(cx, cy - 6); mctx.lineTo(cx - 4, cy + 5); mctx.lineTo(cx + 4, cy + 5); mctx.closePath(); mctx.fill();
  }
  el('div', 'position:absolute;left:14px;bottom:' + (MM + 14) + 'px;color:#7fd5ff;font-size:9px;letter-spacing:1px;text-shadow:0 0 3px #000;', root).textContent = 'TACMAP';

  /* 2. Wave tracker bar ------------------------------------------------------ */
  var waveWrap = el('div',
    'position:absolute;top:42px;left:50%;transform:translateX(-50%);width:240px;'
    + 'text-align:center;', root);
  var waveLabel = el('div',
    'color:#fff;font-size:11px;letter-spacing:2px;text-shadow:0 0 4px #000;margin-bottom:3px;', waveWrap);
  var waveBarBg = el('div',
    'height:7px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden;'
    + 'border:1px solid rgba(255,90,90,.4);', waveWrap);
  var waveBarFill = el('div',
    'height:100%;width:100%;background:linear-gradient(90deg,#ff5a5a,#ffb14d);transition:width .25s;', waveBarBg);
  var _waveMaxHostiles = 0, _lastWave = -1;

  /* 3. Multi-kill streak announcer ------------------------------------------ */
  var streak = el('div',
    'position:absolute;top:24%;left:50%;transform:translate(-50%,-50%) scale(.6);'
    + 'font-size:34px;font-weight:900;letter-spacing:3px;opacity:0;'
    + 'color:#ffd400;text-shadow:0 0 12px #ff6a00,0 2px 4px #000;transition:opacity .15s,transform .15s;', root);
  var STREAK_NAMES = { 2: 'DOUBLE KILL', 3: 'TRIPLE KILL', 4: 'MULTI KILL', 5: 'RAMPAGE', 6: 'UNSTOPPABLE', 8: 'GODLIKE' };
  var _killWindow = [], _lastHostiles = -1, _streakHideAt = 0;

  function showStreak(n) {
    var name = 'DOUBLE KILL', best = 2;
    for (var k in STREAK_NAMES) { if (n >= +k) { best = +k; name = STREAK_NAMES[k]; } }
    streak.textContent = name + (n >= 4 ? ' x' + n : '');
    streak.style.opacity = '1';
    streak.style.transform = 'translate(-50%,-50%) scale(1)';
    _streakHideAt = performance.now() + 1400;
  }

  /* Update loop -------------------------------------------------------------- */
  function playing() {
    try { if (typeof GameManager === 'undefined' || !GameManager.getState) return false; var s = GameManager.getState(); return s === 'playing' || s === 'preWave'; } catch (e) { return false; }
  }

  function countHostiles() {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return -1;
      var a = Enemies.getAll(), n = 0;
      for (var i = 0; i < a.length; i++) if (alive(a[i])) n++;
      return n;
    } catch (e) { return -1; }
  }

  function tick(now) {
    requestAnimationFrame(tick);
    var live = playing();
    var on = !(window.__OK_EXTRAS && window.__OK_EXTRAS.hud2 === false);
    root.style.display = (live && on) ? 'block' : 'none';
    if (!live || !on) { _lastHostiles = -1; _waveMaxHostiles = 0; return; }

    drawMinimap();

    var hostiles = countHostiles();

    // Wave bar
    var wave = 0, total = 0;
    try { if (GameManager.getCurrentWave) wave = GameManager.getCurrentWave(); } catch (e) {}
    try { var si = GameManager.getStageInfo && GameManager.getStageInfo(); if (si && si.wavesPerStage) total = si.wavesPerStage; } catch (e) {}
    if (wave !== _lastWave) { _lastWave = wave; _waveMaxHostiles = Math.max(1, hostiles); }
    if (hostiles > _waveMaxHostiles) _waveMaxHostiles = hostiles;
    waveLabel.textContent = 'WAVE ' + (wave || 1) + (total ? ' / ' + total : '') + '   ·   ' + (hostiles < 0 ? '--' : hostiles) + ' LEFT';
    var pct = (_waveMaxHostiles > 0 && hostiles >= 0) ? Math.max(0, Math.min(100, (hostiles / _waveMaxHostiles) * 100)) : 100;
    waveBarFill.style.width = pct + '%';

    // Streak detection: hostile count dropping = kills.
    if (_lastHostiles >= 0 && hostiles >= 0 && hostiles < _lastHostiles) {
      var killed = _lastHostiles - hostiles;
      for (var k = 0; k < killed; k++) _killWindow.push(now);
    }
    _lastHostiles = hostiles;
    while (_killWindow.length && now - _killWindow[0] > 1500) _killWindow.shift();
    if (_killWindow.length >= 2 && now > _streakHideAt - 600) {
      // only re-trigger if it grew
      if (_killWindow.length !== streak._lastN) { showStreak(_killWindow.length); streak._lastN = _killWindow.length; }
    }
    if (_streakHideAt && now > _streakHideAt) {
      streak.style.opacity = '0';
      streak.style.transform = 'translate(-50%,-50%) scale(.6)';
      _streakHideAt = 0; streak._lastN = 0; _killWindow.length = 0;
    }
  }
  requestAnimationFrame(tick);

  window.HUDExtras2 = {
    show: function () { root.style.display = 'block'; },
    hide: function () { root.style.display = 'none'; },
    testStreak: function (n) { root.style.display = 'block'; showStreak(n || 3); },
    _root: root
  };
})();
