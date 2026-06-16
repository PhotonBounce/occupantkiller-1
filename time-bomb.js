/* ============================================================
 *  TIME-BOMB.JS — Timed explosive charge (Alt+J)
 *
 *  Alt+J places a bomb at player feet. An 8s countdown begins
 *  (shown in top-right HUD, flashes red at <3s). On detonation:
 *  spawnExplosion(3.5), 6u AOE 200 dmg, massive camera shake.
 *  Bomb mesh: dark box + pulsing red LED PointLight. Multiple
 *  bombs can be active simultaneously. 2 per wave.
 * ============================================================ */
var TimeBomb = (function () {
  'use strict';

  var FUSE_TIME    = 8.0;
  var AOE_RADIUS   = 6.0;
  var AOE_DAMAGE   = 200;
  var STOCK_MAX    = 2;

  var _stock       = STOCK_MAX;
  var _waveWas     = -1;
  var _init        = false;
  var _lastTs      = 0;
  var _frameN      = 0;
  var _scene       = null;
  var _bombs       = [];   /* { group, light, t, pos, scene, ledMat } */
  var _hudEl       = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── HUD countdown ──────────────────────── */
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'tb-hud';
    Object.assign(_hudEl.style, {
      position:      'fixed',
      top:           '58px',
      right:         '14px',
      fontFamily:    "'Courier New', monospace",
      fontSize:      '11px',
      letterSpacing: '2px',
      color:         'rgba(255,80,80,0.92)',
      textShadow:    '0 0 7px rgba(255,40,40,0.85)',
      zIndex:        260,
      pointerEvents: 'none',
      display:       'none',
      whiteSpace:    'nowrap'
    });
    document.body.appendChild(_hudEl);
  }

  /* ── Build bomb mesh ─────────────────────── */
  function _buildBombMesh(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    try {
      var group = new THREE.Group();
      group.position.set(pos.x, pos.y + 0.15, pos.z);

      /* Main body */
      var geo = new THREE.BoxGeometry(0.28, 0.18, 0.38);
      var mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, emissive: 0x110000 });
      var box = new THREE.Mesh(geo, mat);
      group.add(box);

      /* LED indicator */
      var ledGeo = new THREE.SphereGeometry(0.04, 5, 4);
      var ledMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
      var led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 0.12, 0.12);
      group.add(led);

      /* Blinking red PointLight */
      var light = new THREE.PointLight(0xff2200, 1.5, 4);
      light.position.y = 0.2;
      group.add(light);

      scene.add(group);
      return { group: group, light: light, ledMat: ledMat, pos: pos.clone(), t: FUSE_TIME, scene: scene };
    } catch (e) { return null; }
  }

  /* ── Place bomb at player feet ──────────── */
  function _place() {
    if (_stock <= 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('TIME BOMB — NO STOCK');
      return;
    }
    var player = window.player;
    if (!player || !player.position) return;

    var py = 0;
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
        py = VoxelWorld.getTerrainHeight(player.position.x, player.position.z);
      } else {
        py = player.position.y - 1;
      }
    } catch (e) {}

    var pos = new THREE.Vector3(player.position.x, py, player.position.z);
    /* Slight offset so not directly underfoot */
    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    if (cam) {
      var back = new THREE.Vector3(0, 0, 1).applyQuaternion(cam.quaternion).setY(0).normalize();
      pos.x += back.x * 0.6;
      pos.z += back.z * 0.6;
    }

    var bomb = _buildBombMesh(pos);
    if (!bomb) return;

    _stock--;
    _bombs.push(bomb);

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('💣 BOMB PLACED — ' + FUSE_TIME.toFixed(0) + 's FUSE');
    }
  }

  /* ── Detonate a bomb ─────────────────────── */
  function _detonate(bomb) {
    try {
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(bomb.pos, 3.5);
      if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) Enemies.damageInRadius(bomb.pos, AOE_RADIUS, AOE_DAMAGE);
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        var player = window.player;
        var intensity = 0.95;
        if (player && player.position) {
          var dx = bomb.pos.x - player.position.x;
          var dz = bomb.pos.z - player.position.z;
          var d = Math.sqrt(dx*dx + dz*dz);
          intensity = Math.max(0.1, 0.95 - d * 0.02);
        }
        CameraSystem.shake(intensity, 0.6);
      }
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('💥 BOMB DETONATED — ' + AOE_DAMAGE + ' DMG');
    } catch (err) {}

    bomb.scene.remove(bomb.group);
    bomb.group.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
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
          /* Clear old bombs without detonating */
          for (var ci = 0; ci < _bombs.length; ci++) {
            _bombs[ci].scene.remove(_bombs[ci].group);
            _bombs[ci].group.traverse(function (o) {
              if (o.geometry) o.geometry.dispose();
              if (o.material) o.material.dispose();
            });
          }
          _bombs = [];
        }
      }
    } catch (e) {}

    /* Update bombs */
    var showHUD  = false;
    var minTime  = Infinity;

    for (var bi = _bombs.length - 1; bi >= 0; bi--) {
      var b = _bombs[bi];
      b.t -= dt;
      if (b.t < minTime) minTime = b.t;

      /* Blink rate increases as time runs out */
      var blinkRate = b.t < 3 ? 8.0 : b.t < 6 ? 4.0 : 2.0;
      var blinkOn   = Math.sin(ts * 0.001 * blinkRate * Math.PI) > 0;
      b.light.intensity    = blinkOn ? (b.t < 3 ? 2.5 : 1.5) : 0;
      b.ledMat.color.setHex(blinkOn ? 0xff2200 : 0x330000);

      if (b.t <= 0) {
        _detonate(b);
        _bombs.splice(bi, 1);
      } else {
        showHUD = true;
      }
    }

    /* Update HUD */
    if (showHUD && isFinite(minTime)) {
      _hudEl.style.display = 'block';
      var secs = Math.ceil(Math.max(0, minTime));
      _hudEl.textContent   = '💣 BOMB ' + secs + 's';
      _hudEl.style.color   = minTime < 3 ? 'rgba(255,40,40,' + (0.7 + Math.sin(ts * 0.008) * 0.3).toFixed(2) + ')' : 'rgba(255,120,80,0.85)';
    } else {
      _hudEl.style.display = 'none';
    }
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyJ' && e.altKey && !e.repeat) {
      e.preventDefault();
      _place();
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

window.TimeBomb = TimeBomb;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TimeBomb.init(); });
} else {
  TimeBomb.init();
}
