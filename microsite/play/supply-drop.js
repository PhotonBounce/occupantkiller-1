/* ============================================================
 *  SUPPLY-DROP.JS — Emergency resupply airdrop (Alt+D)
 *
 *  Alt+D marks a position with green smoke. After 3s a supply
 *  crate falls from 40u above and lands with an explosion.
 *  Auto-collects after 1.5s, granting a random bonus:
 *    • +50 HP restore
 *    • +2 smoke grenade stock
 *    • +1 medic pack stock
 *    • +2 flashbang stock
 *    • +2 incendiary charges
 *  1 per wave. Parachute mesh visible during descent.
 * ============================================================ */
var SupplyDrop = (function () {
  'use strict';

  var SMOKE_DUR    = 3.0;    /* delay before crate appears */
  var FALL_HEIGHT  = 40;
  var FALL_SPEED   = 18;     /* units/s descent speed */
  var COLLECT_T    = 1.5;    /* seconds on ground before auto-collect */
  var STOCK_MAX    = 1;

  var _stock       = STOCK_MAX;
  var _waveWas     = -1;
  var _init        = false;
  var _lastTs      = 0;
  var _frameN      = 0;
  var _scene       = null;

  /* Active drop state (null if none pending) */
  var _drop        = null;
  /* {
       state: 'smoke' | 'falling' | 'landed',
       smokeT, crate, parachute, landPos,
       collectT, smokeGroup, smokeLight
     } */

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Smoke marker ───────────────────────── */
  function _buildSmoke(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    try {
      var group = new THREE.Group();
      group.position.copy(pos);

      /* Green cylinder smoke column */
      var geo = new THREE.CylinderGeometry(0.18, 0.35, 2.2, 7);
      var mat = new THREE.MeshBasicMaterial({ color: 0x44cc44, transparent: true, opacity: 0.7, depthWrite: false });
      var cyl = new THREE.Mesh(geo, mat);
      cyl.position.y = 1.1;
      group.add(cyl);

      /* Puff sphere at top */
      var geo2 = new THREE.SphereGeometry(0.5, 6, 4);
      var mat2 = new THREE.MeshBasicMaterial({ color: 0x66ee66, transparent: true, opacity: 0.55, depthWrite: false });
      var puff = new THREE.Mesh(geo2, mat2);
      puff.position.y = 2.4;
      group.add(puff);

      var light = new THREE.PointLight(0x44ff44, 1.5, 6);
      light.position.y = 1.5;
      group.add(light);

      scene.add(group);
      return { group: group, mat: mat, mat2: mat2, light: light };
    } catch (e) { return null; }
  }

  /* ── Crate + parachute mesh ─────────────── */
  function _buildCrate(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    try {
      var group = new THREE.Group();
      group.position.set(pos.x, pos.y + FALL_HEIGHT, pos.z);

      /* Crate box */
      var crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b7355, emissive: 0x221100 });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.y = 0.45;
      group.add(crate);

      /* Parachute — inverted cone */
      var paraGeo = new THREE.ConeGeometry(2.2, 2.0, 8, 1, true);
      var paraMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.55,
        side: THREE.DoubleSide, depthWrite: false
      });
      var para = new THREE.Mesh(paraGeo, paraMat);
      para.rotation.x = Math.PI;
      para.position.y = 2.6;
      group.add(para);

      /* Lines from para to crate (thin cylinders) */
      var lineMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.6 });
      [-0.8, 0.8].forEach(function (xo) {
        [-0.8, 0.8].forEach(function (zo) {
          var lineGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.0, 4);
          var line = new THREE.Mesh(lineGeo, lineMat);
          line.position.set(xo * 0.4, 1.8, zo * 0.4);
          line.rotation.z = xo * 0.35;
          line.rotation.x = zo * 0.35;
          group.add(line);
        });
      });

      scene.add(group);
      return group;
    } catch (e) { return null; }
  }

  /* ── Remove a mesh ──────────────────────── */
  function _removeMesh(group) {
    var scene = _getScene();
    if (!scene || !group) return;
    scene.remove(group);
    group.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }

  /* ── Apply random bonus ─────────────────── */
  function _applyBonus() {
    var bonuses = [
      function () {
        var p = window.player;
        if (p && p.hp !== undefined) {
          var restored = Math.min(50, (p.maxHp || 100) - p.hp);
          p.hp += restored;
          try { if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(p.hp, p.maxHp); } catch (e) {}
          return '+' + restored + ' HP RESTORED';
        }
        return 'HP RESTORED';
      },
      function () {
        if (typeof SmokeGrenade !== 'undefined' && SmokeGrenade._stock !== undefined) {
          SmokeGrenade._stock = (SmokeGrenade._stock || 0) + 2;
        }
        return '+2 SMOKE GRENADES';
      },
      function () {
        if (typeof MedicPack !== 'undefined' && MedicPack._stock !== undefined) {
          MedicPack._stock = (MedicPack._stock || 0) + 1;
        }
        return '+1 MEDIC PACK';
      },
      function () {
        if (typeof Flashbang !== 'undefined' && Flashbang._stock !== undefined) {
          Flashbang._stock = (Flashbang._stock || 0) + 2;
        }
        return '+2 FLASHBANGS';
      },
      function () {
        if (typeof Incendiary !== 'undefined') {
          /* Incendiary stock is internal — use global window ref */
          try { window._incStock = (window._incStock || 0) + 2; } catch (e) {}
        }
        return '+2 INCENDIARY CHARGES';
      },
    ];

    var pick = bonuses[Math.floor(Math.random() * bonuses.length)];
    var label = pick();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('📦 SUPPLY DROP: ' + label);
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.3, 0.2);
  }

  /* ── Activate ───────────────────────────── */
  function _activate() {
    if (_drop) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('DROP ALREADY INBOUND');
      return;
    }
    if (_stock <= 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('SUPPLY DROP — NO STOCK');
      return;
    }
    var player = window.player;
    if (!player || !player.position) return;

    /* Land 12-20u in front of player */
    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).setY(0).normalize();
    var dist = 12 + Math.random() * 8;
    var lx   = player.position.x + fwd.x * dist;
    var lz   = player.position.z + fwd.z * dist;
    var ly   = 0;
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ly = VoxelWorld.getTerrainHeight(lx, lz);
    } catch (e) {}

    _stock--;

    var landPos   = new THREE.Vector3(lx, ly, lz);
    var smokeObj  = _buildSmoke(landPos);

    _drop = { state: 'smoke', smokeT: SMOKE_DUR, landPos: landPos, smokeObj: smokeObj, crate: null, collectT: -1 };

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('📦 SUPPLY DROP INBOUND — ' + SMOKE_DUR.toFixed(0) + 's');
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
        if (w !== _waveWas) { _waveWas = w; _stock = STOCK_MAX; }
      }
    } catch (e) {}

    if (!_drop) return;

    if (_drop.state === 'smoke') {
      _drop.smokeT -= dt;

      /* Animate smoke sway */
      if (_drop.smokeObj && _frameN % 2 === 0) {
        var swayT = ts * 0.002;
        _drop.smokeObj.group.rotation.z = Math.sin(swayT) * 0.08;
        _drop.smokeObj.light.intensity = 1.2 + Math.sin(swayT * 4) * 0.3;
      }

      if (_drop.smokeT <= 0) {
        /* Transition to falling */
        _drop.state = 'falling';
        _drop.crate = _buildCrate(_drop.landPos);
        if (_drop.smokeObj) _removeMesh(_drop.smokeObj.group);
        _drop.smokeObj = null;
      }

    } else if (_drop.state === 'falling') {
      if (!_drop.crate) { _drop = null; return; }

      /* Descend */
      _drop.crate.position.y -= FALL_SPEED * dt;
      var targetY = _drop.landPos.y + 0.45;

      if (_drop.crate.position.y <= targetY) {
        _drop.crate.position.y = targetY;
        _drop.state = 'landed';
        _drop.collectT = COLLECT_T;

        /* Remove parachute */
        var para = _drop.crate.children[1];
        if (para) { _drop.crate.remove(para); if (para.geometry) para.geometry.dispose(); }

        /* Landing blast */
        try {
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
            Tracers.spawnExplosion(_drop.landPos, 1.0);
          }
        } catch (e) {}
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.25, 0.2);
      }

    } else if (_drop.state === 'landed') {
      _drop.collectT -= dt;
      if (_drop.collectT <= 0) {
        _applyBonus();
        if (_drop.crate) _removeMesh(_drop.crate);
        _drop = null;
      }
    }
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyD' && e.altKey && !e.repeat) {
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

window.SupplyDrop = SupplyDrop;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SupplyDrop.init(); });
} else {
  SupplyDrop.init();
}
