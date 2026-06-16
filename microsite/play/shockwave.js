/* ============================================================
 *  SHOCKWAVE.JS — Explosion ground shockwave rings
 *
 *  Monkey-patches Tracers.spawnExplosion to also trigger:
 *    • A flat expanding torus ring on the terrain (white→fade)
 *    • A brief dust sphere (light grey, expands + fades)
 *    • A dirt kick-up cone (small brown particles via points)
 *  Makes every explosion — grenades, claymores, FPV drone,
 *  airstrike, mortar — look dramatically more impactful.
 *  No key bindings. Fully automatic.
 * ============================================================ */
var ShockwaveSystem = (function () {
  'use strict';

  var _initialized = false;
  var _scene       = null;
  var _active      = []; /* { ring, dust, dirt, t, dur, pos } */
  var _lastTs      = 0;
  var _hooked      = false;

  /* ── Build ring mesh ─────────────────────── */
  function _makeRing(pos, scale) {
    scale = scale || 1;
    var mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    var geo = new THREE.TorusGeometry(0.5, 0.12, 6, 24);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2; /* lay flat */
    mesh.position.copy(pos);
    mesh.position.y += 0.1;
    mesh.scale.set(1, 1, 1);
    return mesh;
  }

  /* ── Build dust sphere ──────────────────── */
  function _makeDust(pos, scale) {
    scale = scale || 1;
    var mat = new THREE.MeshBasicMaterial({
      color: 0xccbb99,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    var geo = new THREE.SphereGeometry(0.8 * scale, 8, 6);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 1.5;
    return mesh;
  }

  /* ── Build dirt particles (Points) ─────── */
  function _makeDirt(pos, scale) {
    scale = scale || 1;
    var count = Math.floor(18 * scale);
    var positions = new Float32Array(count * 3);
    var vels      = [];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd   = (0.5 + Math.random() * 1.5) * scale;
      positions[i*3]   = pos.x;
      positions[i*3+1] = pos.y + 0.2;
      positions[i*3+2] = pos.z;
      vels.push({
        x: Math.cos(angle) * spd,
        y: 2 + Math.random() * 3,
        z: Math.sin(angle) * spd,
        vy: 2 + Math.random() * 3,
      });
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0x997755,
      size: 0.22 * scale,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    var pts = new THREE.Points(geo, mat);
    return { pts: pts, vels: vels, positions: positions, geo: geo };
  }

  /* ── Trigger shockwave at world pos ─────── */
  function trigger(pos, scale) {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }
    if (!_scene) return;

    scale = scale || 1;
    var dur = 0.55 + scale * 0.1;

    var ring = _makeRing(pos, scale);
    var dust = _makeDust(pos, scale);
    var dirt = _makeDirt(pos, scale);

    _scene.add(ring);
    _scene.add(dust);
    _scene.add(dirt.pts);

    _active.push({ ring: ring, dust: dust, dirt: dirt, t: 0, dur: dur, scale: scale });
  }

  /* ── Hook Tracers.spawnExplosion ─────────── */
  function _hookTracers() {
    if (_hooked) return;
    if (typeof Tracers === 'undefined' || !Tracers.spawnExplosion) return;
    var orig = Tracers.spawnExplosion;
    Tracers.spawnExplosion = function (pos, scale) {
      orig.call(Tracers, pos, scale);
      try { trigger(pos, scale || 1); } catch(e){}
    };
    _hooked = true;
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Lazy hook */
    if (!_hooked) _hookTracers();

    /* Animate active shockwaves */
    for (var i = _active.length - 1; i >= 0; i--) {
      var sw = _active[i];
      sw.t += dt;
      var prog = Math.min(1, sw.t / sw.dur);
      var eased = 1 - (1 - prog) * (1 - prog); /* ease-out quad */

      /* Ring: scale out, fade */
      var ringScale = (1 + eased * 9 * sw.scale);
      sw.ring.scale.set(ringScale, ringScale, ringScale);
      sw.ring.material.opacity = 0.75 * (1 - prog);

      /* Dust: expand + fade */
      var dustS = 1 + eased * 3 * sw.scale;
      sw.dust.scale.set(dustS, dustS * 0.6, dustS);
      sw.dust.material.opacity = 0.28 * (1 - prog * 1.4);
      sw.dust.position.y += dt * 0.8;

      /* Dirt particles */
      var dPos = sw.dirt.positions;
      var dVels = sw.dirt.vels;
      for (var j = 0; j < dVels.length; j++) {
        dVels[j].vy -= 9.8 * dt;
        dPos[j*3]   += dVels[j].x * dt;
        dPos[j*3+1] += dVels[j].vy * dt;
        dPos[j*3+2] += dVels[j].z * dt;
      }
      sw.dirt.geo.attributes.position.needsUpdate = true;
      sw.dirt.pts.material.opacity = 0.8 * (1 - prog);

      /* Remove when done */
      if (prog >= 1) {
        if (_scene) {
          _scene.remove(sw.ring);
          _scene.remove(sw.dust);
          _scene.remove(sw.dirt.pts);
        }
        try { sw.ring.geometry.dispose(); sw.ring.material.dispose(); } catch(e){}
        try { sw.dust.geometry.dispose(); sw.dust.material.dispose(); } catch(e){}
        try { sw.dirt.geo.dispose(); sw.dirt.pts.material.dispose(); } catch(e){}
        _active.splice(i, 1);
      }
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;
    requestAnimationFrame(_tick);
  }

  return { init: init, trigger: trigger };
})();

window.ShockwaveSystem = ShockwaveSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ShockwaveSystem.init(); });
} else {
  ShockwaveSystem.init();
}
