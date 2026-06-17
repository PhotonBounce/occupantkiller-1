/* ============================================================
 *  EMP-PULSE.JS — Electromagnetic pulse burst (Alt+P)
 *
 *  Instant 15u area around player. All enemies: detectionRange
 *  and rangedRange zeroed for 5s (can't detect or shoot back).
 *  Visual: expanding blue-white shockwave sphere + PointLight
 *  strobe on each disabled enemy + brief grey screen desaturate.
 *  Electric arc lines shoot off each enemy on disable.
 *  2 per wave, 25s cooldown.
 * ============================================================ */
var EmpPulse = (function () {
  'use strict';

  var EMP_RADIUS  = 15;
  var STUN_DUR    = 5.0;
  var STOCK_MAX   = 2;
  var COOLDOWN    = 25.0;

  var _stock      = STOCK_MAX;
  var _cd         = 0;
  var _waveWas    = -1;
  var _init       = false;
  var _lastTs     = 0;
  var _scene      = null;

  var _pulses     = [];   /* expanding sphere animations */
  var _arcs       = [];   /* electric arc line animations */
  var _zapped     = [];   /* { e, t, savedDet, savedRng, glow } */
  var _overlay    = null;
  var _overlayT   = 0;
  var _hintEl     = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'emp-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '90px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(160,200,255,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+P] EMP ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Screen desaturate overlay ─────────────── */
  function _buildOverlay() {
    _overlay = document.createElement('div');
    Object.assign(_overlay.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(180,210,255,0.20)',
      zIndex: 315, pointerEvents: 'none', opacity: 0,
      mixBlendMode: 'color'
    });
    document.body.appendChild(_overlay);
  }

  /* ── Expanding sphere pulse ────────────────── */
  function _spawnPulse(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      var geo  = new THREE.SphereGeometry(0.5, 10, 8);
      var mat  = new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.55, wireframe: false, depthWrite: false });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);

      /* Inner bright flash sphere */
      var geo2 = new THREE.SphereGeometry(0.5, 8, 6);
      var mat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.30, depthWrite: false });
      var m2   = new THREE.Mesh(geo2, mat2);
      m2.position.copy(pos);
      scene.add(m2);

      var light = new THREE.PointLight(0x88aaff, 6.0, EMP_RADIUS + 3);
      light.position.copy(pos);
      scene.add(light);

      _pulses.push({ mesh: mesh, mat: mat, m2: m2, mat2: mat2, light: light, t: 0.50, maxT: 0.50, scene: scene });
    } catch (err) {}
  }

  /* ── Electric arc on enemy ─────────────────── */
  function _spawnArc(enemy) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      /* 3 random short arc segments radiating from enemy */
      var points = [];
      var base   = enemy.mesh.position;
      for (var i = 0; i < 3; i++) {
        var ox = base.x + (Math.random() - 0.5) * 0.3;
        var oy = base.y + 0.8 + Math.random() * 0.8;
        var oz = base.z + (Math.random() - 0.5) * 0.3;
        var tx = ox + (Math.random() - 0.5) * 1.5;
        var ty = oy + (Math.random() - 0.5) * 1.0;
        var tz = oz + (Math.random() - 0.5) * 1.5;
        points.push(ox, oy, oz, tx, ty, tz);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
      var mat  = new THREE.LineBasicMaterial({ color: 0x88ccff });
      var line = new THREE.LineSegments(geo, mat);
      scene.add(line);
      _arcs.push({ line: line, mat: mat, t: 0.25, scene: scene });
    } catch (err) {}
  }

  /* ── Fire EMP ──────────────────────────────── */
  function _fire() {
    var player = window.player;
    if (!player || !player.position) return;

    var pos = player.position;
    var count = 0;

    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || e.dead || !e.mesh) continue;
          var dx = e.mesh.position.x - pos.x;
          var dz = e.mesh.position.z - pos.z;
          if (dx*dx + dz*dz > EMP_RADIUS * EMP_RADIUS) continue;

          /* Don't double-zap */
          var already = false;
          for (var zi = 0; zi < _zapped.length; zi++) { if (_zapped[zi].e === e) { already = true; break; } }
          if (already) { continue; }

          var savedDet = e.detectionRange, savedRng = e.rangedRange;
          e.detectionRange = 0.01; e.rangedRange = 0.01;

          /* Blue glow on enemy */
          var glow = null;
          try {
            var scene = _getScene();
            if (scene) {
              glow = new THREE.PointLight(0x4499ff, 1.5, 5);
              glow.position.copy(e.mesh.position); glow.position.y += 1;
              scene.add(glow);
            }
          } catch (ge) {}

          _zapped.push({ e: e, t: STUN_DUR, savedDet: savedDet, savedRng: savedRng, glow: glow });
          _spawnArc(e);
          count++;
        }
      }
    } catch (err) {}

    _spawnPulse({ x: pos.x, y: pos.y + 1.0, z: pos.z });

    /* Screen overlay flash */
    _overlayT = 0.45;
    if (_overlay) _overlay.style.opacity = 1;

    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.22, 0.15); } catch (e) {}

    var msg = count > 0 ? ('⚡ EMP — ' + count + ' ENEM' + (count > 1 ? 'IES' : 'Y') + ' DISABLED ' + STUN_DUR + 's') : '⚡ EMP DISCHARGED';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup(msg); } catch (e) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_cd > 0)     { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('EMP CD ' + Math.ceil(_cd) + 's'); } catch (e) {} return; }
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('EMP — NO CHARGE'); } catch (e) {} return; }
    _stock--;
    _cd = COOLDOWN;
    _hintEl.textContent = '[Alt+P] EMP ×' + _stock;
    _hintEl.style.color = 'rgba(160,200,255,0.3)';
    _fire();
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Restock */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _cd = 0;
          _hintEl.textContent = '[Alt+P] EMP ×' + _stock;
          _hintEl.style.color = 'rgba(160,200,255,0.55)';
          var sc = _getScene();
          for (var zi2 = 0; zi2 < _zapped.length; zi2++) {
            var z2 = _zapped[zi2];
            z2.e.detectionRange = z2.savedDet; z2.e.rangedRange = z2.savedRng;
            if (sc && z2.glow) sc.remove(z2.glow);
          }
          _zapped = [];
        }
      }
    } catch (e) {}

    /* Cooldown */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[Alt+P] EMP ×' + _stock; _hintEl.style.color = 'rgba(160,200,255,0.55)'; }
    }

    /* Screen overlay decay */
    if (_overlayT > 0 && _overlay) {
      _overlayT -= dt;
      _overlay.style.opacity = Math.max(0, _overlayT / 0.45);
      if (_overlayT <= 0) _overlay.style.opacity = 0;
    }

    /* Sphere pulses */
    for (var pi = _pulses.length - 1; pi >= 0; pi--) {
      var p = _pulses[pi];
      p.t -= dt;
      var prog  = Math.max(0, p.t / p.maxT);
      var sc2   = 1 + (1 - prog) * (EMP_RADIUS / 0.5);
      p.mesh.scale.setScalar(sc2); p.m2.scale.setScalar(sc2);
      p.mat.opacity  = prog * 0.55;
      p.mat2.opacity = prog * 0.30;
      p.light.intensity = prog * 6.0;
      if (p.t <= 0) {
        p.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mat.dispose();
        p.scene.remove(p.m2);   p.m2.geometry.dispose();  p.mat2.dispose();
        p.scene.remove(p.light);
        _pulses.splice(pi, 1);
      }
    }

    /* Arc decay */
    for (var ai = _arcs.length - 1; ai >= 0; ai--) {
      var a = _arcs[ai];
      a.t -= dt;
      if (a.t <= 0) {
        a.scene.remove(a.line); a.line.geometry.dispose(); a.mat.dispose();
        _arcs.splice(ai, 1);
      }
    }

    /* Maintain zap (pin detection each frame, follow mesh for glow) */
    var tSec = ts / 1000;
    for (var zi = _zapped.length - 1; zi >= 0; zi--) {
      var z = _zapped[zi];
      z.t -= dt;
      if (z.e.dead || z.t <= 0) {
        z.e.detectionRange = z.savedDet; z.e.rangedRange = z.savedRng;
        var sc3 = _getScene();
        if (sc3 && z.glow) sc3.remove(z.glow);
        _zapped.splice(zi, 1);
        continue;
      }
      z.e.detectionRange = 0.01; z.e.rangedRange = 0.01;
      /* Strobe glow */
      if (z.glow && z.e.mesh) {
        z.glow.position.copy(z.e.mesh.position); z.glow.position.y += 1;
        z.glow.intensity = 0.8 + Math.sin(tSec * 12) * 0.7;
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyP' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    _buildOverlay();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.EmpPulse = EmpPulse;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { EmpPulse.init(); });
} else {
  EmpPulse.init();
}
