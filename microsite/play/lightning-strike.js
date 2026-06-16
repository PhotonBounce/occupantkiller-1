/* ============================================================
 *  LIGHTNING-STRIKE.JS — Divine lightning bolt (Alt+L)
 *
 *  Alt+L targets the enemy most aligned with your aim within
 *  40u. A lightning bolt drops from sky height onto the target
 *  (300 instant damage), then chains to 2 nearest enemies
 *  within 20u (150 each). Visual: glowing white bolt cylinder
 *  + PointLights that flare and decay over 0.25s. Massive
 *  camera shake on hit. 1 per wave.
 * ============================================================ */
var LightningStrike = (function () {
  'use strict';

  var PRIMARY_DMG  = 300;
  var CHAIN_DMG    = 150;
  var CHAIN_RADIUS = 20;
  var AIM_DIST     = 40;
  var BOLT_HEIGHT  = 45;
  var BOLT_DUR     = 0.22;
  var STOCK_MAX    = 1;

  var _stock    = STOCK_MAX;
  var _waveWas  = -1;
  var _init     = false;
  var _lastTs   = 0;
  var _scene    = null;
  var _bolts    = [];  /* { meshes, lights, t } */

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Find best target in camera aim cone ─ */
  function _findTarget() {
    var player = window.player;
    if (!player || !player.position) return null;

    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}

    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).normalize();

    var all = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
    var best = null, bestScore = -Infinity;

    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || e.dead || !e.mesh) continue;
      var dx = e.mesh.position.x - player.position.x;
      var dy = e.mesh.position.y - player.position.y;
      var dz = e.mesh.position.z - player.position.z;
      var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist > AIM_DIST) continue;
      var len = dist || 1;
      var dot = (dx/len) * fwd.x + (dy/len) * fwd.y + (dz/len) * fwd.z;
      if (dot < 0.25) continue;                          /* must be in front */
      var score = dot - dist / (AIM_DIST * 2);
      if (score > bestScore) { best = e; bestScore = score; }
    }
    return best;
  }

  /* ── Find chain targets near primary ─── */
  function _findChains(primary, count) {
    var all = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
    var candidates = [];
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || e === primary || e.dead || !e.mesh) continue;
      var dx = e.mesh.position.x - primary.mesh.position.x;
      var dz = e.mesh.position.z - primary.mesh.position.z;
      var d  = Math.sqrt(dx*dx + dz*dz);
      if (d < CHAIN_RADIUS) candidates.push({ e: e, d: d });
    }
    candidates.sort(function (a, b) { return a.d - b.d; });
    return candidates.slice(0, count).map(function (c) { return c.e; });
  }

  /* ── Spawn bolt visual ─────────────────── */
  function _spawnBolt(from, to) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      var dir = new THREE.Vector3().subVectors(to, from);
      var len = dir.length();
      if (len < 0.1) return;

      var meshes = [], lights = [];

      /* Bolt cylinder — bright white */
      var geo = new THREE.CylinderGeometry(0.06, 0.06, len, 5);
      var mat = new THREE.MeshBasicMaterial({ color: 0xeef8ff, transparent: true, opacity: 0.92 });
      var cyl = new THREE.Mesh(geo, mat);

      /* Orient cylinder from→to */
      var mid = from.clone().add(to).multiplyScalar(0.5);
      cyl.position.copy(mid);
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      scene.add(cyl);
      meshes.push({ mesh: cyl, mat: mat });

      /* Outer glow cylinder */
      var geo2 = new THREE.CylinderGeometry(0.18, 0.18, len, 5);
      var mat2 = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35 });
      var cyl2 = new THREE.Mesh(geo2, mat2);
      cyl2.position.copy(mid);
      cyl2.quaternion.copy(cyl.quaternion);
      scene.add(cyl2);
      meshes.push({ mesh: cyl2, mat: mat2 });

      /* Impact light at bottom */
      var l1 = new THREE.PointLight(0xaaddff, 8, 18);
      l1.position.copy(to);
      l1.position.y += 0.5;
      scene.add(l1);
      lights.push(l1);

      /* Sky light at top */
      var l2 = new THREE.PointLight(0x88ccff, 5, 12);
      l2.position.copy(from);
      scene.add(l2);
      lights.push(l2);

      _bolts.push({ meshes: meshes, lights: lights, t: BOLT_DUR, maxT: BOLT_DUR, scene: scene });
    } catch (err) {}
  }

  /* ── Apply damage directly ─────────────── */
  function _damageEnemy(e, dmg) {
    if (!e || e.dead) return;
    try {
      /* Use damageInRadius centered on enemy (tiny radius = single target) */
      if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
        Enemies.damageInRadius(e.mesh.position, 0.5, dmg);
      }
    } catch (err) {}
  }

  /* ── Activate strike ─────────────────────── */
  function _activate() {
    if (_stock <= 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('LIGHTNING STRIKE — NO STOCK');
      return;
    }
    if (typeof THREE === 'undefined') return;

    var primary = _findTarget();
    if (!primary) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('LIGHTNING: NO TARGET IN AIM');
      return;
    }

    _stock--;

    /* Primary bolt */
    var groundPos = primary.mesh.position.clone();
    var skyPos    = groundPos.clone();
    skyPos.y      += BOLT_HEIGHT;

    _spawnBolt(skyPos, groundPos);
    _damageEnemy(primary, PRIMARY_DMG);

    /* Chain bolts */
    var chains = _findChains(primary, 2);
    for (var ci = 0; ci < chains.length; ci++) {
      var chain = chains[ci];
      _spawnBolt(groundPos, chain.mesh.position.clone());
      _damageEnemy(chain, CHAIN_DMG);
    }

    /* Camera effects */
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.88, 0.5);
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      var chainLabel = chains.length > 0 ? ' → CHAINED ×' + chains.length : '';
      HUD.notifyPickup('⚡ LIGHTNING STRIKE' + chainLabel + '  ' + PRIMARY_DMG + ' DMG');
    }

    /* Full-screen white flash */
    var flash = document.getElementById('ls-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'ls-flash';
      Object.assign(flash.style, {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(200,230,255,0.7)', zIndex: 400,
        pointerEvents: 'none', display: 'none'
      });
      document.body.appendChild(flash);
    }
    flash.style.display = 'block';
    flash._t = 0.18;
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _stock = STOCK_MAX; }
      }
    } catch (e) {}

    /* Flash fade */
    var flash = document.getElementById('ls-flash');
    if (flash && flash._t > 0) {
      flash._t -= dt;
      if (flash._t <= 0) { flash.style.display = 'none'; flash._t = 0; }
      else { flash.style.opacity = (flash._t / 0.18).toFixed(2); }
    }

    /* Decay bolts */
    for (var bi = _bolts.length - 1; bi >= 0; bi--) {
      var bolt = _bolts[bi];
      bolt.t -= dt;
      var prog = Math.max(0, bolt.t / bolt.maxT);

      bolt.meshes.forEach(function (m) { m.mat.opacity = m.mat.opacity > 0.5 ? 0.92 * prog : 0.35 * prog; });
      bolt.lights.forEach(function (l, idx) { l.intensity = (idx === 0 ? 8 : 5) * prog; });

      if (bolt.t <= 0) {
        bolt.meshes.forEach(function (m) {
          bolt.scene.remove(m.mesh);
          m.mesh.geometry.dispose();
          m.mat.dispose();
        });
        bolt.lights.forEach(function (l) { bolt.scene.remove(l); });
        _bolts.splice(bi, 1);
      }
    }
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyL' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.LightningStrike = LightningStrike;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { LightningStrike.init(); });
} else {
  LightningStrike.init();
}
