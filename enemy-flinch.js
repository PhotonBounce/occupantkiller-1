/* ============================================================
 *  ENEMY-FLINCH.JS — Hit reaction animation on enemies
 *
 *  Tracks each enemy's HP each frame via WeakMap. When HP drops,
 *  the enemy mesh briefly staggers:
 *    • Rotation jerk (roll + slight yaw)
 *    • Mesh position nudge backward
 *    • Brief red flash on enemy material (emissive boost)
 *    • Hit spark at impact point (tiny PointLight flash)
 *  Makes every bullet feel tactile and impactful.
 *  No key bindings. Fully automatic.
 * ============================================================ */
var EnemyFlinch = (function () {
  'use strict';

  var _initialized = false;
  var _hpMap       = new WeakMap(); /* enemy → last known hp */
  var _flinchMap   = new WeakMap(); /* enemy → flinch state */
  var _lastTs      = 0;
  var _frameN      = 0;
  var _scene       = null;
  var _hitLights   = []; /* { light, t } — flash lights at impact */

  /* ── Trigger flinch on a specific enemy ─── */
  function _flinch(e, dmg) {
    var player = window.player;
    if (!player || !player.position || !e.mesh) return;

    /* Direction from player to enemy */
    var dx = e.mesh.position.x - player.position.x;
    var dz = e.mesh.position.z - player.position.z;
    var dist = Math.sqrt(dx*dx + dz*dz) || 1;

    /* Flinch roll: tilt sideways in direction of incoming fire */
    var side = (dx * 0 - dz * 0) < 0 ? 1 : -1; /* simplified: random-ish */
    side = (Math.random() < 0.5) ? 1 : -1;

    /* Store flinch state (doesn't overwrite if stronger flinch already active) */
    var existing = _flinchMap.has(e) ? _flinchMap.get(e) : null;
    var intensity = Math.min(1, dmg / 40); /* 40 HP = full flinch */

    if (existing && existing.t > 0.1) {
      /* Compound flinch */
      existing.roll  += side * 0.18 * intensity;
      existing.t = Math.max(existing.t, 0.3 * intensity + 0.1);
    } else {
      _flinchMap.set(e, {
        roll:     side * 0.25 * intensity,
        yaw:      (Math.random() - 0.5) * 0.12 * intensity,
        nudgeZ:   -0.15 * intensity,  /* nudge back from hit dir */
        nudgeDX:  (dx / dist) * 0.12 * intensity,
        nudgeDZ:  (dz / dist) * 0.12 * intensity,
        t:        0.28 * intensity + 0.12,
        maxT:     0.28 * intensity + 0.12,
        baseRoll: e.mesh.rotation.z,
        baseYaw:  e.mesh.rotation.y,
        emissive: true,
      });
    }

    /* Hit flash light */
    if (_scene) {
      try {
        var light = new THREE.PointLight(0xff4422, 1.8, 3);
        light.position.copy(e.mesh.position);
        light.position.y += 1;
        _scene.add(light);
        _hitLights.push({ light: light, t: 0.1 });
      } catch(ex){}
    }

    /* Emissive red flash on mesh materials */
    try {
      e.mesh.traverse(function (obj) {
        if (obj.isMesh && obj.material) {
          var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(function (mat) {
            if (mat.emissive && !mat._flinchOrig) {
              mat._flinchOrig   = { r: mat.emissive.r, g: mat.emissive.g, b: mat.emissive.b };
              mat._flinchTimer  = 0.15;
              mat.emissive.setRGB(0.8, 0, 0);
            }
          });
        }
      });
    } catch(ex){}
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Get scene lazily */
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }

    /* Hit light decay */
    for (var li = _hitLights.length - 1; li >= 0; li--) {
      var hl = _hitLights[li];
      hl.t -= dt;
      hl.light.intensity = Math.max(0, hl.t / 0.1) * 1.8;
      if (hl.t <= 0) {
        if (_scene) _scene.remove(hl.light);
        _hitLights.splice(li, 1);
      }
    }

    /* Scan enemies — every 2 frames for HP delta */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;

          var prevHp = _hpMap.has(e) ? _hpMap.get(e) : e.hp;
          var curHp  = e.hp;

          if (!e.dead && prevHp > 0 && curHp < prevHp) {
            _flinch(e, prevHp - curHp);
          }
          _hpMap.set(e, curHp);
        }
      } catch(err){}
    }

    /* Apply flinch animations */
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var allE = Enemies.getAll();
      for (var ei = 0; ei < allE.length; ei++) {
        var en = allE[ei];
        if (!en || !en.mesh) continue;

        /* Flinch motion */
        if (_flinchMap.has(en)) {
          var f = _flinchMap.get(en);
          if (f.t > 0) {
            f.t -= dt;
            var prog = Math.max(0, f.t / f.maxT);
            /* Ease-out spring: peak at start, decay to 0 */
            var eased = prog * (2 - prog);
            en.mesh.rotation.z  = f.baseRoll + f.roll  * eased;
            en.mesh.rotation.y  = f.baseYaw  + f.yaw   * eased;
            /* Nudge position */
            en.mesh.position.x += f.nudgeDX * dt * (eased * 4);
            en.mesh.position.z += f.nudgeDZ * dt * (eased * 4);
          } else {
            /* Restore base rotation smoothly */
            en.mesh.rotation.z += (f.baseRoll - en.mesh.rotation.z) * Math.min(1, dt * 8);
            en.mesh.rotation.y += (f.baseYaw  - en.mesh.rotation.y) * Math.min(1, dt * 8);
            if (Math.abs(en.mesh.rotation.z - f.baseRoll) < 0.005) _flinchMap.delete(en);
          }
        }

        /* Emissive fade */
        try {
          en.mesh.traverse(function (obj) {
            if (obj.isMesh && obj.material) {
              var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              mats.forEach(function (mat) {
                if (mat._flinchOrig && mat._flinchTimer !== undefined) {
                  mat._flinchTimer -= dt;
                  if (mat._flinchTimer <= 0) {
                    mat.emissive.setRGB(mat._flinchOrig.r, mat._flinchOrig.g, mat._flinchOrig.b);
                    delete mat._flinchOrig;
                    delete mat._flinchTimer;
                  } else {
                    var fade = mat._flinchTimer / 0.15;
                    mat.emissive.setRGB(0.8 * fade, 0, 0);
                  }
                }
              });
            }
          });
        } catch(ex){}
      }
    } catch(err){}
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.EnemyFlinch = EnemyFlinch;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { EnemyFlinch.init(); });
} else {
  EnemyFlinch.init();
}
