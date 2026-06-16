/* ============================================================
 *  CLAYMORE.JS — Directional proximity mine
 *
 *  C key → place a claymore at player's feet, facing away from
 *  the player's current aim direction.
 *  Any enemy within 3.5u triggers it → directional blast cone:
 *    front 90° cone: 300 dmg  |  rear half: 40 dmg (back-blast)
 *  Max 3 mines active at once. Start with 2.
 *  Visual: tan box + pulsing red LED + angular "FRONT" glyph.
 *  Restockable from airdrops.
 * ============================================================ */
var ClaymoreSystem = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    MAX_STOCK:    2,
    MAX_ACTIVE:   3,
    TRIGGER_DIST: 3.5,
    FRONT_DMG:    300,
    BACK_DMG:     40,
    CONE_ANGLE:   Math.PI * 0.5,   // ±45° front cone half-angle
    BLAST_RADIUS: 5.0,
    ARM_DELAY:    1.2,             // seconds before mine is armed
    COOLDOWN:     0.8,
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _stock       = CFG.MAX_STOCK;
  var _mines       = [];
  var _scene       = null;
  var _hudEl       = null;
  var _cooldown    = 0;

  /* ── Helpers ────────────────────────────── */
  function _getScene()  { try { return window.GameManager && GameManager.getScene  ? GameManager.getScene()  : null; } catch(e){return null;} }
  function _getCamera() { try { return window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e){return null;} }
  function _getPlayer() { try { return window.player || null; } catch(e){return null;} }

  /* ── Build mine mesh ────────────────────── */
  function _buildMesh() {
    if (typeof THREE === 'undefined') return null;

    var group = new THREE.Group();

    /* Body — tan rectangular block */
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.22, 0.14),
      new THREE.MeshLambertMaterial({ color: 0xc8a96e })
    );
    group.add(body);

    /* "FRONT" face indicator — slightly darker panel */
    var face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x8b6914 })
    );
    face.position.set(0, 0, 0.072);
    group.add(face);

    /* LED (pulsing sphere) */
    var led = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    led.position.set(0.1, 0.05, 0.072);
    group.add(led);

    /* Arming status sprite label */
    return { group: group, led: led };
  }

  /* ── Place mine at player position ─────── */
  function _place() {
    if (_stock <= 0) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('No claymores remaining', '#888'); } catch(e){}
      return;
    }
    if (_mines.length >= CFG.MAX_ACTIVE) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('Max mines placed', '#888'); } catch(e){}
      return;
    }
    if (_cooldown > 0) return;

    var player = _getPlayer();
    var scene  = _getScene();
    var cam    = _getCamera();
    if (!player || !scene || typeof THREE === 'undefined') return;

    var built = _buildMesh();
    if (!built) return;

    /* Orient toward player's aim direction */
    var facing = new THREE.Vector3(0, 0, -1);
    if (cam) { cam.getWorldDirection(facing); }
    facing.y = 0;
    if (facing.length() < 0.001) facing.set(0, 0, -1);
    facing.normalize();

    var gx = player.position.x + facing.x * 1.2;
    var gz = player.position.z + facing.z * 1.2;
    var gy = 0;
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        gy = VoxelWorld.getTerrainHeight(Math.round(gx), Math.round(gz)) || 0;
      }
    } catch(e) {}

    built.group.position.set(gx, gy + 0.11, gz);
    /* Rotate so FRONT face points in the same direction as facing */
    built.group.rotation.y = Math.atan2(facing.x, facing.z);
    scene.add(built.group);

    _mines.push({
      group:   built.group,
      led:     built.led,
      fx:      facing.x,
      fz:      facing.z,
      x:       gx,
      z:       gz,
      timer:   0,
      armed:   false,
      ledPhase:0,
    });

    _stock--;
    _cooldown = CFG.COOLDOWN;
    _updateHUD();

    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('💥 CLAYMORE PLACED — FRONT TOWARD ENEMY', '#ffcc44'); } catch(e){}
  }

  /* ── Detonate a mine ────────────────────── */
  function _detonate(mine, idx) {
    _scene = _scene || _getScene();

    /* Classify all nearby enemies as front/rear */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var j = 0; j < all.length; j++) {
          var e = all[j];
          if (!e || !e.mesh || e.dead) continue;
          var ex = e.mesh.position.x - mine.x;
          var ez = e.mesh.position.z - mine.z;
          var dist = Math.sqrt(ex*ex + ez*ez);
          if (dist > CFG.BLAST_RADIUS) continue;

          /* Dot product with facing direction to determine front/back */
          var dot = (ex * mine.fx + ez * mine.fz) / Math.max(0.001, dist);
          var isFront = dot > Math.cos(CFG.CONE_ANGLE);
          var dmg     = isFront ? CFG.FRONT_DMG : CFG.BACK_DMG;
          try { Enemies.damageInRadius(e.mesh.position, 0.5, dmg); } catch(err){}
        }
      }
    } catch(err) {}

    /* Explosion FX */
    try { if (window.Tracers && Tracers.spawnExplosion) Tracers.spawnExplosion(mine.group.position, 3.5); } catch(e){}
    try { if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(1.2, 0.5); } catch(e){}

    try { if (_scene) _scene.remove(mine.group); } catch(ex) {}
    _mines.splice(idx, 1);
  }

  /* ── Update ──────────────────────────────── */
  function update(dt) {
    _cooldown = Math.max(0, _cooldown - dt);
    var p = _getPlayer();

    for (var i = _mines.length - 1; i >= 0; i--) {
      var m = _mines[i];
      m.timer += dt;

      /* Arm after delay */
      if (!m.armed && m.timer >= CFG.ARM_DELAY) {
        m.armed = true;
        try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('⚠ CLAYMORE ARMED', '#ff4444'); } catch(e){}
      }

      /* LED blink — faster when armed */
      m.ledPhase += dt * (m.armed ? 4.0 : 1.5);
      if (m.led && m.led.material) {
        m.led.material.color.setHex(Math.sin(m.ledPhase) > 0 ? 0xff0000 : 0x220000);
      }

      if (!m.armed) continue;

      /* Check all enemies within trigger distance */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var j = 0; j < all.length; j++) {
            var e = all[j];
            if (!e || !e.mesh || e.dead) continue;
            var ex = e.mesh.position.x - m.x;
            var ez = e.mesh.position.z - m.z;
            if (ex*ex + ez*ez < CFG.TRIGGER_DIST * CFG.TRIGGER_DIST) {
              _detonate(m, i);
              break;
            }
          }
        }
      } catch(err) {}
    }
  }

  /* ── HUD ──────────────────────────────── */
  function _updateHUD() {
    if (_hudEl) {
      _hudEl.textContent = '💥 ' + _stock;
      _hudEl.style.opacity = _stock > 0 ? '1' : '0.35';
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    /* HUD counter */
    _hudEl = document.createElement('div');
    _hudEl.id = 'claymore-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:235px;left:12px;font-family:monospace;font-size:11px;',
      'color:#ffcc44;background:rgba(0,0,0,0.5);border:1px solid rgba(255,200,68,0.3);',
      'padding:2px 7px;border-radius:4px;z-index:210;pointer-events:none;',
    ].join('');
    _updateHUD();
    document.body.appendChild(_hudEl);

    var hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed;bottom:235px;left:52px;font-family:monospace;font-size:9px;',
      'color:rgba(255,200,68,0.45);pointer-events:none;z-index:210;line-height:20px;',
    ].join('');
    hint.textContent = "[\'] CLAYMORE";
    document.body.appendChild(hint);

    /* Key handler */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Quote' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        _place();
      }
    });

    /* rAF loop */
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  function restock(n) {
    _stock = Math.min(CFG.MAX_STOCK, _stock + (n || 1));
    _updateHUD();
  }

  return { init: init, restock: restock };
})();

window.ClaymoreSystem = ClaymoreSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ClaymoreSystem.init(); });
} else {
  ClaymoreSystem.init();
}
