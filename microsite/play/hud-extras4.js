/* ============================================================================
   OccupantKiller — HUD Extras IV: Threat Tracking (additive, defensive, read-only).
   Round 6 — tactical awareness via camera projection of live enemy positions:
     1. Off-screen enemy arrows  — ring of arrows pointing to threats out of view
     2. On-screen enemy brackets — target box + distance over visible enemies
     3. Target lock              — the enemy nearest your crosshair turns red/locked
   Uses GameManager.getCamera() (THREE camera), Enemies.getAll(), CameraSystem.getYaw().
   Pooled DOM (no per-frame allocation). Honors window.__OK_EXTRAS.hud4 toggle.
   ========================================================================== */
(function () {
  'use strict';
  function el(tag, css, parent) { var d = document.createElement(tag); if (css) d.style.cssText = css; (parent || document.body).appendChild(d); return d; }
  function posOf(o) { if (!o) return null; if (o.position && typeof o.position.x === 'number') return o.position; if (o.mesh && o.mesh.position) return o.mesh.position; return null; }
  function alive(o) { if (!o) return false; if (o.alive === false) return false; if (typeof o.hp === 'number') return o.hp > 0; if (typeof o.health === 'number') return o.health > 0; return true; }

  var MAXN = 14;
  var root = el('div', 'position:fixed;inset:0;pointer-events:none;z-index:948;display:none;font-family:"JetBrains Mono",monospace;');

  // Pool brackets
  var brackets = [];
  for (var i = 0; i < MAXN; i++) {
    var bk = el('div', 'position:absolute;border:1.5px solid rgba(0,216,255,.8);border-radius:3px;'
      + 'box-shadow:0 0 6px rgba(0,216,255,.4);display:none;transform:translate(-50%,-50%);', root);
    var lab = el('div', 'position:absolute;left:50%;bottom:-15px;transform:translateX(-50%);font-size:9px;'
      + 'color:#9fe7ff;white-space:nowrap;text-shadow:0 0 3px #000;', bk);
    brackets.push({ box: bk, lab: lab });
  }
  // Pool arrows
  var arrows = [];
  for (var j = 0; j < MAXN; j++) {
    var ar = el('div', 'position:absolute;left:50%;top:50%;width:0;height:0;display:none;'
      + 'border-left:7px solid transparent;border-right:7px solid transparent;'
      + 'border-bottom:13px solid rgba(255,90,90,.85);filter:drop-shadow(0 0 4px #ff0000);', root);
    arrows.push(ar);
  }

  var _fwd = null, _wv = null;
  function tmpVec() { if (typeof THREE === 'undefined') return null; if (!_wv) _wv = new THREE.Vector3(); return _wv; }

  function playing() { try { if (typeof GameManager === 'undefined' || !GameManager.getState) return false; var s = GameManager.getState(); return s === 'playing' || s === 'preWave'; } catch (e) { return false; } }

  function tick() {
    requestAnimationFrame(tick);
    var live = playing();
    var on = !(window.__OK_EXTRAS && window.__OK_EXTRAS.hud4 === false);
    root.style.display = (live && on) ? 'block' : 'none';
    if (!live || !on) return;

    var cam = null;
    try { cam = GameManager.getCamera && GameManager.getCamera(); } catch (e) {}
    if (!cam || !cam.position || typeof THREE === 'undefined') { for (var z = 0; z < MAXN; z++) { brackets[z].box.style.display = 'none'; arrows[z].style.display = 'none'; } return; }

    var yaw = 0; try { if (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) yaw = CameraSystem.getYaw(); } catch (e) {}
    var W = window.innerWidth, H = window.innerHeight, cx = W / 2, cy = H / 2;
    if (!_fwd) _fwd = new THREE.Vector3();
    try { cam.getWorldDirection(_fwd); } catch (e) {}

    var list = [];
    try {
      var all = Enemies.getAll();
      for (var k = 0; k < all.length; k++) {
        var e = all[k]; if (!alive(e)) continue;
        var p = posOf(e); if (!p) continue;
        var dx = p.x - cam.position.x, dz = p.z - cam.position.z;
        list.push({ p: p, dx: dx, dz: dz, d2: dx * dx + dz * dz });
      }
    } catch (er) {}
    list.sort(function (a, b) { return a.d2 - b.d2; });
    if (list.length > MAXN) list.length = MAXN;

    var bi = 0, ai = 0, lockIdx = -1, lockScore = 0.16; // ~screen-center radius for lock
    var screen = [];
    for (var n = 0; n < list.length; n++) {
      var it = list[n];
      var v = tmpVec(); v.set(it.p.x, (it.p.y || 0) + 1.5, it.p.z);
      var behind = false;
      try { var rel = new THREE.Vector3(it.p.x - cam.position.x, 0, it.p.z - cam.position.z); behind = rel.dot(new THREE.Vector3(_fwd.x, 0, _fwd.z)) < 0; } catch (e) {}
      v.project(cam);
      var onScreen = !behind && v.x >= -1 && v.x <= 1 && v.y >= -1 && v.y <= 1;
      if (onScreen) {
        var sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
        var dist = Math.sqrt(it.d2);
        var size = Math.max(22, Math.min(120, 1500 / Math.max(4, dist)));
        screen.push({ bi: bi, sx: sx, sy: sy, c: Math.sqrt(v.x * v.x + v.y * v.y) });
        var b = brackets[bi++];
        b.box.style.display = 'block';
        b.box.style.left = sx + 'px'; b.box.style.top = sy + 'px';
        b.box.style.width = size + 'px'; b.box.style.height = (size * 1.3) + 'px';
        b.lab.textContent = Math.round(dist) + 'm';
        if (bi - 1 >= 0 && Math.sqrt(v.x * v.x + v.y * v.y) < lockScore) { lockScore = Math.sqrt(v.x * v.x + v.y * v.y); lockIdx = bi - 1; }
      } else {
        var bearing = Math.atan2(it.dx, it.dz) - yaw; // relative
        var R = Math.min(W, H) * 0.36;
        var ax = cx + Math.sin(bearing) * R, ay = cy - Math.cos(bearing) * R;
        var ar2 = arrows[ai++];
        ar2.style.display = 'block';
        ar2.style.left = ax + 'px'; ar2.style.top = ay + 'px';
        ar2.style.transform = 'translate(-50%,-50%) rotate(' + (bearing + Math.PI) + 'rad)';
      }
      if (bi >= MAXN || ai >= MAXN) break;
    }
    // apply lock styling
    for (var q = 0; q < bi; q++) {
      var locked = (q === lockIdx);
      brackets[q].box.style.borderColor = locked ? 'rgba(255,70,70,.95)' : 'rgba(0,216,255,.8)';
      brackets[q].box.style.boxShadow = locked ? '0 0 10px rgba(255,40,40,.7)' : '0 0 6px rgba(0,216,255,.4)';
      brackets[q].lab.style.color = locked ? '#ffb0b0' : '#9fe7ff';
    }
    for (; bi < MAXN; bi++) brackets[bi].box.style.display = 'none';
    for (; ai < MAXN; ai++) arrows[ai].style.display = 'none';
  }
  requestAnimationFrame(tick);

  window.HUDExtras4 = { show: function () { root.style.display = 'block'; }, hide: function () { root.style.display = 'none'; }, _root: root };
})();
