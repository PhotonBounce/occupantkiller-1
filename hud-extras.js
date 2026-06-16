/* ============================================================================
   OccupantKiller — HUD Extras (additive, defensive, read-only).
   Three new always-on combat HUD elements, layered over the existing HUD:
     1. Compass heading strip (top-center)        — reads CameraSystem.getYaw()
     2. Tactical readout (top-right)              — FPS · enemies alive · weapon
     3. Animated targeting reticle ring (center)  — cosmetic, complements crosshair
   Every game global is feature-detected; anything missing simply no-ops, so this
   module can never break gameplay. Visible only while in a live match.
   ========================================================================== */
(function () {
  'use strict';

  function el(tag, css, parent) {
    var d = document.createElement(tag);
    if (css) d.style.cssText = css;
    (parent || document.body).appendChild(d);
    return d;
  }

  var root = el('div',
    'position:fixed;inset:0;pointer-events:none;z-index:950;display:none;'
    + 'font-family:"JetBrains Mono",monospace;');

  /* 1. Compass ---------------------------------------------------------------- */
  var compassWrap = el('div',
    'position:absolute;top:10px;left:50%;transform:translateX(-50%);'
    + 'width:280px;height:26px;overflow:hidden;'
    + 'border:1px solid rgba(255,212,0,.35);border-radius:6px;'
    + 'background:rgba(8,12,22,.55);box-shadow:0 0 10px rgba(0,0,0,.4);', root);
  var compassRuler = el('div',
    'position:absolute;top:0;left:0;height:100%;white-space:nowrap;'
    + 'color:#ffe27a;font-size:12px;line-height:26px;letter-spacing:1px;text-shadow:0 0 3px #000;', compassWrap);
  el('div',
    'position:absolute;top:0;left:50%;width:2px;height:100%;background:#ff4d4d;'
    + 'transform:translateX(-1px);box-shadow:0 0 6px #ff4d4d;', compassWrap);

  // Build a long ruler: cardinal + intercardinal ticks every 45deg, repeated.
  var dirs = ['N', '·', 'NE', '·', 'E', '·', 'SE', '·', 'S', '·', 'SW', '·', 'W', '·', 'NW', '·'];
  var rulerHTML = '';
  for (var rep = 0; rep < 3; rep++) {
    for (var i = 0; i < dirs.length; i++) {
      rulerHTML += '<span style="display:inline-block;width:40px;text-align:center;'
        + (dirs[i].length > 1 || /[NESW]/.test(dirs[i]) ? 'color:#fff;font-weight:700;' : 'color:#8aa;')
        + '">' + dirs[i] + '</span>';
    }
  }
  compassRuler.innerHTML = rulerHTML;
  var TICK = 40, PERIOD = dirs.length * TICK; // px for a full 360deg

  /* 2. Tactical readout ------------------------------------------------------- */
  var readout = el('div',
    'position:absolute;top:10px;right:10px;min-width:120px;padding:7px 10px;'
    + 'border:1px solid rgba(0,216,255,.3);border-radius:7px;'
    + 'background:rgba(8,12,22,.55);color:#cfeaff;font-size:11px;line-height:1.7;'
    + 'text-shadow:0 0 3px #000;', root);
  readout.innerHTML =
    '<div><span style="color:#7fd5ff">FPS</span> <b data-ro="fps">--</b></div>'
    + '<div><span style="color:#ff8a8a">HOSTILES</span> <b data-ro="enemies">--</b></div>'
    + '<div><span style="color:#ffe27a">WEAPON</span> <b data-ro="wpn" style="font-size:10px">--</b></div>';
  var roFps = readout.querySelector('[data-ro="fps"]');
  var roEn = readout.querySelector('[data-ro="enemies"]');
  var roWpn = readout.querySelector('[data-ro="wpn"]');

  /* 3. Targeting reticle ring ------------------------------------------------- */
  var reticle = el('div',
    'position:absolute;top:50%;left:50%;width:46px;height:46px;'
    + 'margin:-23px 0 0 -23px;', root);
  reticle.innerHTML =
    '<svg viewBox="0 0 46 46" width="46" height="46" style="overflow:visible">'
    + '<circle cx="23" cy="23" r="16" fill="none" stroke="rgba(0,216,255,.55)" stroke-width="1.5" '
    + 'stroke-dasharray="6 8" data-ret-ring></circle>'
    + '<path d="M23 3 v6 M23 37 v6 M3 23 h6 M37 23 h6" stroke="rgba(255,255,255,.7)" stroke-width="1.5"/>'
    + '<circle cx="23" cy="23" r="1.6" fill="#ff4d4d"/></svg>';
  var retRing = reticle.querySelector('[data-ret-ring]');

  /* Update loop --------------------------------------------------------------- */
  var lastT = performance.now(), frames = 0, fpsAcc = 0, ringAngle = 0;

  function playing() {
    try {
      if (typeof GameManager === 'undefined' || !GameManager.getState) return false;
      var s = GameManager.getState();
      return s === 'playing' || s === 'preWave';
    } catch (e) { return false; }
  }

  function tick(now) {
    requestAnimationFrame(tick);
    var dt = now - lastT; lastT = now;

    var live = playing();
    var on = !(window.__OK_EXTRAS && window.__OK_EXTRAS.hud1 === false);
    root.style.display = (live && on) ? 'block' : 'none';
    if (!live || !on) { frames = 0; fpsAcc = 0; return; }

    // FPS (smoothed, refresh ~3x/sec)
    frames++; fpsAcc += dt;
    if (fpsAcc >= 333) {
      var fps = Math.round(1000 / (fpsAcc / frames));
      if (roFps) {
        roFps.textContent = fps;
        roFps.style.color = fps >= 50 ? '#7CFC8A' : fps >= 30 ? '#ffe27a' : '#ff6a6a';
      }
      frames = 0; fpsAcc = 0;
    }

    // Compass — scroll ruler so the heading sits under the red needle.
    try {
      if (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) {
        var yaw = CameraSystem.getYaw();
        var heading = ((yaw * 180 / Math.PI) % 360 + 360) % 360;     // 0..360
        var center = compassWrap.clientWidth / 2;
        var offset = center - (heading / 360) * PERIOD - PERIOD;     // center the middle repeat
        compassRuler.style.transform = 'translateX(' + offset.toFixed(1) + 'px)';
      }
    } catch (e) {}

    // Tactical readout — live hostiles + current weapon.
    try {
      if (roEn && typeof Enemies !== 'undefined' && Enemies.getAll) {
        var n = 0, arr = Enemies.getAll();
        for (var i = 0; i < arr.length; i++) { var en = arr[i]; if (en && en.alive !== false && !(typeof en.hp === 'number' && en.hp <= 0)) n++; }
        roEn.textContent = n;
      }
      if (roWpn && typeof Weapons !== 'undefined' && Weapons.getWeaponName) {
        roWpn.textContent = String(Weapons.getWeaponName(0) || '--').toUpperCase();
      }
    } catch (e) {}

    // Reticle ring — slow rotation gives a live "scanning" feel.
    ringAngle = (ringAngle + dt * 0.03) % 360;
    if (retRing) retRing.setAttribute('transform', 'rotate(' + ringAngle.toFixed(1) + ' 23 23)');
  }
  requestAnimationFrame(tick);

  // Expose a tiny API for QA / toggling.
  window.HUDExtras = {
    show: function () { root.style.display = 'block'; },
    hide: function () { root.style.display = 'none'; },
    _root: root
  };
})();
