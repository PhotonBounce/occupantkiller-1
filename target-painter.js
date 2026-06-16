/* ============================================================
 *  TARGET-PAINTER.JS — Mark enemy for bonus damage (Alt+M)
 *
 *  Alt+M paints the aimed enemy: all damage taken by that enemy
 *  is doubled for 8s via HP-delta intercept (extra dmg applied
 *  the same frame HP drops). Visual: red spinning OctahedronGeometry
 *  diamond + PointLight hovering above head + ground ring.
 *  "MARKED TARGET ELIMINATED" on kill. 2 marks/wave.
 * ============================================================ */
var TargetPainter = (function () {
  'use strict';

  var DAMAGE_MULT  = 2.0;
  var DURATION     = 8.0;
  var AIM_DIST     = 45;
  var STOCK_MAX    = 2;

  var _stock       = STOCK_MAX;
  var _waveWas     = -1;
  var _init        = false;
  var _lastTs      = 0;
  var _frameN      = 0;
  var _scene       = null;
  var _marks       = [];   /* { e, t, group, ring, diamond, light, prevHp, justHit } */

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Find aimed enemy ───────────────────── */
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
      var dot = (dx/dist)*fwd.x + (dy/dist)*fwd.y + (dz/dist)*fwd.z;
      if (dot < 0.25) continue;
      var score = dot - dist / (AIM_DIST * 2);
      if (score > bestScore) { best = e; bestScore = score; }
    }
    return best;
  }

  /* ── Build mark visual ──────────────────── */
  function _buildMark(enemy) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    try {
      var group = new THREE.Group();

      /* Spinning diamond above head */
      var dGeo = new THREE.OctahedronGeometry(0.28, 0);
      var dMat = new THREE.MeshBasicMaterial({ color: 0xff2200, wireframe: true });
      var diamond = new THREE.Mesh(dGeo, dMat);
      group.add(diamond);

      /* Solid small inner diamond */
      var dGeo2 = new THREE.OctahedronGeometry(0.12, 0);
      var dMat2 = new THREE.MeshBasicMaterial({ color: 0xff6644, transparent: true, opacity: 0.8 });
      var diamond2 = new THREE.Mesh(dGeo2, dMat2);
      group.add(diamond2);

      /* Pulsing red PointLight */
      var light = new THREE.PointLight(0xff2200, 1.8, 7);
      group.add(light);

      scene.add(group);

      /* Ground ring */
      var rGeo = new THREE.TorusGeometry(0.6, 0.04, 5, 20);
      var rMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.6 });
      var ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);

      return { group: group, diamond: diamond, diamond2: diamond2, dMat: dMat, dMat2: dMat2, rMat: rMat, light: light, ring: ring, scene: scene };
    } catch (err) { return null; }
  }

  /* ── Remove mark visual ─────────────────── */
  function _removeMark(mark) {
    if (!mark.visual) return;
    var v = mark.visual;
    v.scene.remove(v.group);
    v.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    v.scene.remove(v.ring);
    v.ring.geometry.dispose(); v.rMat.dispose();
  }

  /* ── Activate ───────────────────────────── */
  function _activate() {
    if (_stock <= 0) { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('TARGET PAINTER — NO STOCK'); return; }
    if (typeof THREE === 'undefined') return;

    var target = _findTarget();
    if (!target) { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('TARGET PAINTER: AIM AT ENEMY FIRST'); return; }

    /* Don't double-mark */
    for (var i = 0; i < _marks.length; i++) { if (_marks[i].e === target) { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('ALREADY MARKED'); return; } }

    _stock--;
    var visual = _buildMark(target);
    _marks.push({ e: target, t: DURATION, visual: visual, prevHp: target.hp, justHit: false });

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🎯 TARGET PAINTED — ×' + DAMAGE_MULT + ' DAMAGE FOR ' + DURATION + 's');
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.18, 0.12);
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w;
          _stock = STOCK_MAX;
          for (var ci = 0; ci < _marks.length; ci++) _removeMark(_marks[ci]);
          _marks = [];
        }
      }
    } catch (e) {}

    for (var mi = _marks.length - 1; mi >= 0; mi--) {
      var m = _marks[mi];
      m.t -= dt;

      var e = m.e;

      /* Remove if dead or expired */
      if (!e || e.dead || m.t <= 0) {
        if (e && e.dead && m.t > 0) {
          if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🎯 MARKED TARGET ELIMINATED');
        }
        _removeMark(m);
        _marks.splice(mi, 1);
        continue;
      }

      /* HP-delta intercept — apply extra damage */
      if (!m.justHit) {
        var curHp = e.hp;
        var drop  = m.prevHp - curHp;
        if (drop > 0.5) {
          var extra = drop * (DAMAGE_MULT - 1);
          e.hp = Math.max(0, e.hp - extra);
          m.justHit = true;
        }
        m.prevHp = e.hp;
      } else {
        m.justHit = false;
        m.prevHp  = e.hp;
      }

      /* Animate visual */
      if (m.visual && e.mesh) {
        var prog  = m.t / DURATION;
        var tSec  = ts / 1000;
        var pulse = 0.75 + Math.sin(tSec * 6) * 0.25;

        /* Float diamond above enemy head */
        var headPos = e.mesh.position.clone();
        headPos.y  += 2.2 + Math.sin(tSec * 3) * 0.1;
        m.visual.group.position.copy(headPos);
        m.visual.diamond.rotation.y  += dt * 3.5;
        m.visual.diamond2.rotation.y -= dt * 2.8;

        /* Ground ring */
        m.visual.ring.position.set(e.mesh.position.x, e.mesh.position.y + 0.05, e.mesh.position.z);
        m.visual.ring.rotation.z += dt * 2.0;

        /* Pulse light */
        m.visual.light.intensity = 1.8 * pulse * prog;
        m.visual.rMat.opacity    = 0.5 * pulse * prog;

        /* Fade near expiry */
        if (m.t < 2) {
          var fade = m.t / 2;
          m.visual.dMat.opacity  = fade;
          m.visual.dMat2.opacity = 0.8 * fade;
        }
      }
    }
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyM' && e.altKey && !e.repeat) {
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

window.TargetPainter = TargetPainter;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TargetPainter.init(); });
} else {
  TargetPainter.init();
}
