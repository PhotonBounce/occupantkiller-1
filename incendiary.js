/* ============================================================
 *  INCENDIARY.JS — Incendiary round mode (F7)
 *
 *  F7 activates 8 incendiary shots from current stock (2/wave).
 *  When an enemy takes damage while mode is active, a fire patch
 *  spawns at their position: animated cone flames + PointLight.
 *  Fire persists 4s and deals 14 dmg/s DOT to nearby enemies.
 *  Synergises with OVERKILL mode (3× damage multiplier stacks).
 * ============================================================ */
var Incendiary = (function () {
  'use strict';

  var SHOTS_MAX   = 8;
  var FIRE_DUR    = 4.0;
  var FIRE_RADIUS = 2.4;
  var FIRE_DPS    = 14;
  var STOCK_MAX   = 2;

  var _stock    = STOCK_MAX;
  var _shots    = 0;
  var _active   = false;
  var _fires    = [];          /* active fire patches */
  var _prevHp   = new WeakMap();
  var _scene    = null;
  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;
  var _waveWas  = -1;
  var _hudEl    = null;

  /* ── HUD indicator ─────────────────────── */
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'inc-hud';
    Object.assign(_hudEl.style, {
      position:     'fixed',
      top:          '88px',
      left:         '12px',
      fontFamily:   "'Courier New', monospace",
      fontSize:     '10px',
      letterSpacing:'1.5px',
      color:        'rgba(255,140,30,0.92)',
      textShadow:   '0 0 8px rgba(255,90,0,0.85)',
      zIndex:       250,
      pointerEvents:'none',
      display:      'none'
    });
    document.body.appendChild(_hudEl);
  }

  /* ── Get scene (lazy) ──────────────────── */
  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Spawn 3D fire patch ───────────────── */
  function _spawnFire(worldPos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;

    var group = new THREE.Group();
    /* Place at ground level */
    group.position.set(worldPos.x, worldPos.y - 0.4, worldPos.z);

    /* Outer cone — orange */
    try {
      var geo1 = new THREE.ConeGeometry(0.4, 1.3, 8);
      var mat1 = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.88, depthWrite: false });
      var cone1 = new THREE.Mesh(geo1, mat1);
      cone1.position.y = 0.65;
      group.add(cone1);

      /* Inner cone — bright yellow */
      var geo2 = new THREE.ConeGeometry(0.2, 0.85, 6);
      var mat2 = new THREE.MeshBasicMaterial({ color: 0xffbb00, transparent: true, opacity: 0.92, depthWrite: false });
      var cone2 = new THREE.Mesh(geo2, mat2);
      cone2.position.y = 0.75;
      group.add(cone2);

      /* Top ember glow */
      var geo3 = new THREE.SphereGeometry(0.14, 5, 4);
      var mat3 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
      var sphere = new THREE.Mesh(geo3, mat3);
      sphere.position.y = 1.2;
      group.add(sphere);

      /* PointLight */
      var light = new THREE.PointLight(0xff5500, 2.8, 9);
      light.position.y = 0.7;
      group.add(light);

      scene.add(group);
      _fires.push({
        group:  group,
        light:  light,
        mats:   [mat1, mat2, mat3],
        t:      FIRE_DUR,
        maxT:   FIRE_DUR,
        pos:    new THREE.Vector3(worldPos.x, worldPos.y - 0.4, worldPos.z),
        scene:  scene,
        phase:  Math.random() * Math.PI * 2
      });
    } catch (err) {}
  }

  /* ── Activate a charge ─────────────────── */
  function _activate() {
    if (_stock <= 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('INCENDIARY — NO STOCK');
      return;
    }
    if (_active) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('INCENDIARY ALREADY ACTIVE (' + _shots + ' rds)');
      return;
    }
    _stock--;
    _shots  = SHOTS_MAX;
    _active = true;
    _hudEl.style.display = 'block';
    _hudEl.textContent   = '🔥 INCENDIARY  ' + _shots + ' rds';
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🔥 INCENDIARY LOADED — ' + _shots + ' ROUNDS');
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.18, 0.12);
  }

  /* ── Detect hits via HP delta ──────────── */
  function _scanHits() {
    if (!_active) return;
    try {
      var all = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        var prev = _prevHp.has(e) ? _prevHp.get(e) : e.hp;
        if (!e.dead && e.hp < prev && _shots > 0) {
          _shots--;
          _spawnFire(e.mesh.position);
          if (_shots <= 0) {
            _active = false;
            _hudEl.style.display = 'none';
            if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('INCENDIARY EXHAUSTED');
          } else {
            _hudEl.textContent = '🔥 INCENDIARY  ' + _shots + ' rds';
          }
        }
        _prevHp.set(e, e.hp);
      }
    } catch (err) {}
  }

  /* ── Keep HP map fresh when inactive ───── */
  function _refreshHpMap() {
    try {
      var all = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
      for (var i = 0; i < all.length; i++) {
        if (all[i]) _prevHp.set(all[i], all[i].hp);
      }
    } catch (err) {}
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Restock on new wave */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _stock = STOCK_MAX; _waveWas = w; _shots = 0; _active = false; _hudEl.style.display = 'none'; }
      }
    } catch (e) {}

    /* HP scanning — every 2 frames */
    if (_frameN % 2 === 0) {
      if (_active) _scanHits();
      else         _refreshHpMap();
    }

    /* Animate + damage from fire patches */
    for (var fi = _fires.length - 1; fi >= 0; fi--) {
      var f = _fires[fi];
      f.t -= dt;
      if (f.t <= 0) {
        f.scene.remove(f.group);
        f.group.traverse(function (obj) {
          if (obj.geometry) obj.geometry.dispose();
        });
        f.mats.forEach(function (m) { m.dispose(); });
        _fires.splice(fi, 1);
        continue;
      }

      /* Flicker animation */
      var prog    = f.t / f.maxT;
      var flicker = 0.88 + Math.sin(ts * 0.011 + f.phase + fi * 1.7) * 0.12;
      var sc      = flicker * Math.min(1, prog / 0.15);  /* fade-in on spawn */
      f.group.children[0].scale.setScalar(sc);
      f.group.children[1].scale.setScalar(sc * 0.88);
      f.group.children[0].rotation.y += dt * 2.8;
      f.group.children[2].position.y  = 1.2 + Math.sin(ts * 0.018 + f.phase) * 0.08;

      /* Fade out in last 25% */
      var op = prog < 0.25 ? prog / 0.25 : 1;
      f.mats[0].opacity = 0.88 * op;
      f.mats[1].opacity = 0.92 * op;
      f.mats[2].opacity = 0.70 * op;
      f.light.intensity = 2.8 * op * flicker;

      /* DOT damage — every 6 frames */
      if (_frameN % 6 === 0) {
        try {
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
            Enemies.damageInRadius(f.pos, FIRE_RADIUS, FIRE_DPS * (dt * 3));
          }
        } catch (err) {}
      }
    }
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.key === 'F7' && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHUD();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.Incendiary = Incendiary;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { Incendiary.init(); });
} else {
  Incendiary.init();
}
