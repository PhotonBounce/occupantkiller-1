/* ============================================================
 *  FORCE-BLAST.JS — Omnidirectional force shockwave (Alt+F)
 *
 *  Instant close-range defensive burst: all enemies within 10u
 *  are physically shoved outward 4.5u and take 50 dmg. Visual:
 *  flat white expanding ring (TorusGeometry) + bright PointLight
 *  burst lasting 0.4s. Useful when surrounded. 2/wave, 18s CD.
 * ============================================================ */
var ForceBlast = (function () {
  'use strict';

  var RADIUS     = 10.0;
  var KNOCKBACK  = 4.5;
  var DAMAGE     = 50;
  var RING_DUR   = 0.40;
  var COOLDOWN   = 18.0;
  var STOCK_MAX  = 2;

  var _stock     = STOCK_MAX;
  var _cd        = 0;
  var _waveWas   = -1;
  var _init      = false;
  var _lastTs    = 0;
  var _scene     = null;
  var _rings     = [];  /* active ring animations */
  var _hintEl    = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Build expanding ring ─────────────── */
  function _spawnRing(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      /* Thin flat ring in XZ plane */
      var geo  = new THREE.TorusGeometry(0.5, 0.08, 6, 32);
      var mat  = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
      var ring = new THREE.Mesh(geo, mat);
      ring.position.copy(pos);
      ring.position.y += 0.6;
      ring.rotation.x  = Math.PI / 2;
      scene.add(ring);

      /* Glow ring */
      var geo2  = new THREE.TorusGeometry(0.5, 0.22, 5, 28);
      var mat2  = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35, depthWrite: false });
      var ring2 = new THREE.Mesh(geo2, mat2);
      ring2.position.copy(ring.position);
      ring2.rotation.x = Math.PI / 2;
      scene.add(ring2);

      /* Flash PointLight */
      var light = new THREE.PointLight(0xaaddff, 6.0, RADIUS);
      light.position.copy(pos);
      light.position.y += 0.8;
      scene.add(light);

      _rings.push({ ring: ring, ring2: ring2, mat: mat, mat2: mat2, light: light,
                    t: RING_DUR, maxT: RING_DUR, scene: scene });
    } catch (err) {}
  }

  /* ── Push enemies outward ──────────────── */
  function _knockback(playerPos) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    try {
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || e.dead || !e.mesh) continue;
        var dx   = e.mesh.position.x - playerPos.x;
        var dy   = e.mesh.position.y - playerPos.y;
        var dz   = e.mesh.position.z - playerPos.z;
        var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist > RADIUS || dist < 0.01) continue;

        /* Normalize and push */
        var pushScale = KNOCKBACK * (1 - dist / RADIUS * 0.5);
        e.mesh.position.x += (dx / dist) * pushScale;
        e.mesh.position.z += (dz / dist) * pushScale;
        e.mesh.position.y += Math.abs(dy / dist) * 0.5; /* slight upward pop */
      }

      /* AOE damage */
      if (typeof Enemies.damageInRadius === 'function') {
        Enemies.damageInRadius(playerPos, RADIUS, DAMAGE);
      }
    } catch (err) {}
  }

  /* ── Hint element ─────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'fb-hint';
    Object.assign(_hintEl.style, {
      position:      'fixed',
      bottom:        '34px',
      left:          '12px',
      fontFamily:    "'Courier New', monospace",
      fontSize:      '9px',
      letterSpacing: '1.5px',
      color:         'rgba(140,200,255,0.55)',
      zIndex:        250,
      pointerEvents: 'none',
      whiteSpace:    'nowrap'
    });
    _hintEl.textContent = '[Alt+F] FORCE BLAST ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Activate ─────────────────────────── */
  function _activate() {
    if (_cd > 0)   { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('FORCE BLAST CD ' + Math.ceil(_cd) + 's'); return; }
    if (_stock <= 0) { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('FORCE BLAST — NO STOCK'); return; }

    var player = window.player;
    if (!player || !player.position) return;

    _stock--;
    _cd = COOLDOWN;

    _spawnRing(player.position.clone());
    _knockback(player.position.clone());

    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.55, 0.3);
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('💥 FORCE BLAST — ' + RADIUS + 'u SHOCKWAVE');

    _hintEl.textContent = '[Alt+F] FORCE BLAST ×' + _stock;
  }

  /* ── rAF tick ─────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _stock = STOCK_MAX; _cd = 0; _hintEl.textContent = '[Alt+F] FORCE BLAST ×' + _stock; }
      }
    } catch (e) {}

    /* Cooldown tick */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[Alt+F] FORCE BLAST ×' + _stock; _hintEl.style.color = 'rgba(140,200,255,0.55)'; }
      else { _hintEl.style.color = 'rgba(140,200,255,0.28)'; }
    }

    /* Animate rings */
    for (var ri = _rings.length - 1; ri >= 0; ri--) {
      var r = _rings[ri];
      r.t -= dt;
      var prog  = Math.max(0, r.t / r.maxT);
      var scale = 1 + (1 - prog) * (RADIUS / 0.5);   /* expand from radius 0.5 to RADIUS */
      r.ring.scale.setScalar(scale);
      r.ring2.scale.setScalar(scale);
      r.mat.opacity  = prog * 0.9;
      r.mat2.opacity = prog * 0.35;
      r.light.intensity = prog * 6.0;

      if (r.t <= 0) {
        r.scene.remove(r.ring);  r.ring.geometry.dispose();  r.mat.dispose();
        r.scene.remove(r.ring2); r.ring2.geometry.dispose(); r.mat2.dispose();
        r.scene.remove(r.light);
        _rings.splice(ri, 1);
      }
    }
  }

  /* ── Key handler ─────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyF' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ForceBlast = ForceBlast;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ForceBlast.init(); });
} else {
  ForceBlast.init();
}
