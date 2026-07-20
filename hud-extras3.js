/* ============================================================================
   OccupantKiller — HUD Extras III (additive, defensive, read-only).
   Round 3 of combat-feel HUD upgrades:
     1. Damage direction indicator  — red arc points to where you got hit
     2. Kill feed                   — "ENEMY DOWN" toasts as hostiles drop
     3. Speedometer + motion lines  — readout + radial speed-line vignette
   Reads only the #health-value HUD text, GameManager.getCamera, Enemies.getAll,
   CameraSystem.getYaw. Anything missing simply no-ops. Active only in a match.
   Each effect has a test hook (window.HUDExtras3.testX) for QA screenshots.
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
    'position:fixed;inset:0;pointer-events:none;z-index:952;display:none;'
    + 'font-family:"JetBrains Mono",monospace;');

  /* 1. Damage direction indicator ------------------------------------------- */
  var dmg = el('div',
    'position:absolute;top:50%;left:50%;width:72vmin;height:72vmin;'
    + 'margin:-36vmin 0 0 -36vmin;opacity:0;transition:opacity .15s;', root);
  dmg.innerHTML =
    '<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible">'
    + '<path d="M 33 7 A 47 47 0 0 1 67 7" stroke="#ff3b3b" stroke-width="6" fill="none" '
    + 'stroke-linecap="round" style="filter:drop-shadow(0 0 7px #ff0000)"/></svg>';
  var _dmgHideAt = 0;
  function showDamage(bearingDeg) {
    dmg.style.transform = 'rotate(' + bearingDeg.toFixed(0) + 'deg)';
    dmg.style.opacity = '0.92';
    _dmgHideAt = performance.now() + 900;
  }

  /* 2. Kill feed ------------------------------------------------------------- */
  var feed = el('div',
    'position:absolute;top:118px;right:12px;display:flex;flex-direction:column;'
    + 'gap:4px;align-items:flex-end;', root);
  function pushKill(label) {
    var row = el('div',
      'color:#ffd9d9;font-size:11px;background:rgba(120,10,10,.45);'
      + 'border-right:3px solid #ff4d4d;border-radius:3px;padding:2px 8px;'
      + 'text-shadow:0 0 3px #000;opacity:1;transition:opacity .5s;white-space:nowrap;', feed);
    row.innerHTML = '<span style="color:#ff6a6a">✕</span> ' + (label || 'ENEMY DOWN');
    setTimeout(function () { row.style.opacity = '0'; }, 2200);
    setTimeout(function () { if (row.parentNode) row.parentNode.removeChild(row); }, 2800);
    while (feed.children.length > 5) feed.removeChild(feed.firstChild);
  }

  /* 3. Speedometer + motion lines ------------------------------------------- */
  var lines = el('div',
    'position:absolute;inset:0;opacity:0;transition:opacity .2s;'
    + 'background:radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(180,220,255,.16) 78%, rgba(180,220,255,.30) 100%);', root);
  var spd = el('div',
    'position:absolute;left:164px;bottom:16px;color:#9fefff;font-size:11px;'
    + 'letter-spacing:1px;text-shadow:0 0 3px #000;', root);
  spd.innerHTML = '<span style="color:#5fcfff">SPD</span> <b data-spd>0.0</b> <span style="opacity:.6">m/s</span>';
  var spdVal = spd.querySelector('[data-spd]');
  var _lastPos = null, _spdSmooth = 0;

  /* Read player health from the existing HUD text. */
  function readHealth() {
    try {
      var e = document.getElementById('health-value');
      if (!e) return -1;
      var m = /(-?\d+)/.exec(e.textContent || '');
      return m ? parseInt(m[1], 10) : -1;
    } catch (e) { return -1; }
  }

  function nearestEnemyBearing() {
    try {
      var cam = GameManager.getCamera && GameManager.getCamera();
      if (!cam || !cam.position) return null;
      var yaw = (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) ? CameraSystem.getYaw() : 0;
      var list = Enemies.getAll(), best = null, bd = 1e9;
      for (var i = 0; i < list.length; i++) {
        if (!alive(list[i])) continue;
        var p = posOf(list[i]); if (!p) continue;
        var dx = p.x - cam.position.x, dz = p.z - cam.position.z;
        var d2 = dx * dx + dz * dz;
        if (d2 < bd) { bd = d2; best = { dx: dx, dz: dz }; }
      }
      if (!best) return null;
      var world = Math.atan2(best.dx, best.dz);
      return ((world - yaw) * 180 / Math.PI);   // 0 = dead ahead
    } catch (e) { return null; }
  }

  function playing() {
    try { if (typeof GameManager === 'undefined' || !GameManager.getState) return false; var s = GameManager.getState(); return s === 'playing' || s === 'preWave'; } catch (e) { return false; }
  }

  var _lastHealth = -1, _lastHostiles = -1;

  function tick(now) {
    requestAnimationFrame(tick);
    var live = playing();
    var on = !(window.__OK_EXTRAS && window.__OK_EXTRAS.hud3 === false);
    root.style.display = (live && on) ? 'block' : 'none';
    if (!live || !on) { _lastHealth = -1; _lastHostiles = -1; _lastPos = null; return; }

    // Damage direction (health dropped)
    var hp = readHealth();
    if (_lastHealth >= 0 && hp >= 0 && hp < _lastHealth) {
      var b = nearestEnemyBearing();
      showDamage(b == null ? (Math.random() * 360 - 180) : b);
    }
    _lastHealth = hp;
    if (_dmgHideAt && now > _dmgHideAt) { dmg.style.opacity = '0'; _dmgHideAt = 0; }

    // Kill feed (hostile count dropped)
    try {
      var a = Enemies.getAll && Enemies.getAll(), n = 0;
      if (a) { for (var i = 0; i < a.length; i++) if (alive(a[i])) n++; }
      if (_lastHostiles >= 0 && n >= 0 && n < _lastHostiles) {
        var killed = Math.min(_lastHostiles - n, 4);
        for (var k = 0; k < killed; k++) pushKill('ENEMY DOWN');
      }
      _lastHostiles = n;
    } catch (e) {}

    // Speedometer + motion lines (camera position delta)
    try {
      var cam = GameManager.getCamera && GameManager.getCamera();
      if (cam && cam.position) {
        if (_lastPos) {
          var dx = cam.position.x - _lastPos.x, dy = cam.position.y - _lastPos.y, dz = cam.position.z - _lastPos.z;
          var dt = 1 / 60;
          var inst = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
          if (!isFinite(inst)) inst = 0; // guard: a NaN camera pos for one frame otherwise poisons the smoothed value forever (SPD NaN)
          _spdSmooth += (inst - _spdSmooth) * 0.2;
          if (!isFinite(_spdSmooth)) _spdSmooth = 0;
        }
        _lastPos = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
      }
      if (spdVal) spdVal.textContent = _spdSmooth.toFixed(1);
      lines.style.opacity = String(Math.max(0, Math.min(0.85, (_spdSmooth - 6) / 14)));
    } catch (e) {}
  }
  requestAnimationFrame(tick);

  window.HUDExtras3 = {
    show: function () { root.style.display = 'block'; },
    hide: function () { root.style.display = 'none'; },
    testDamage: function (deg) { root.style.display = 'block'; showDamage(typeof deg === 'number' ? deg : -120); },
    testKillFeed: function () { root.style.display = 'block'; pushKill('ENEMY DOWN'); pushKill('HEADSHOT'); pushKill('ENEMY DOWN'); },
    testSpeed: function () { root.style.display = 'block'; lines.style.opacity = '0.7'; if (spdVal) spdVal.textContent = '14.0'; },
    _root: root
  };
})();
