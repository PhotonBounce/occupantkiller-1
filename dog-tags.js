/* ============================================================
 *  DOG-TAGS.JS — Enemy soldier ID tags as loot collectibles
 *
 *  On enemy death, 1-in-3 chance to drop a dog-tag collectible.
 *  Walk within 2u and press E (or auto-collect on pass-through).
 *  Each enemy type has unit-specific flavor text (lore).
 *  Tags count toward a "TAGS COLLECTED" tally with bonus XP.
 *  Max 12 active tags in the scene at once (perf guard).
 * ============================================================ */
var DogTagSystem = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    DROP_CHANCE:  0.33,   // probability per death
    COLLECT_DIST: 2.0,    // auto-collect radius
    EXPIRE_SEC:   45,     // disappear if uncollected
    MAX_TAGS:     12,     // max concurrent tags in scene
    SCORE_PER_TAG:75,
    TAG_HEIGHT:   0.5,    // hover height above ground
    BOB_SPEED:    2.2,    // bobbing animation rad/sec
    BOB_AMP:      0.12,   // bobbing amplitude
    SPIN_SPEED:   1.2,    // slow rotation
  };

  /* ── Lore bank per enemy type ─────────────── */
  var LORE = {
    CONSCRIPT: [
      'PFC Dmitry Volkov — 64th Motorized Rifle Brigade. Drafted March 2022.',
      'PFC Ivan Sokolov — 58th Combined Arms Army. Age 19. Missing since Avdiivka.',
      'Sgt. Pavel Petrov — 3rd Regiment, VDV. Call sign: "Zubr".',
      'PFC Aleksei Nikitin — 36th Army. Reported as "serving in Ukraine".',
      'Cpl. Yaroslav Gusev — 155th Marine Brigade. Last known: Kherson.',
    ],
    STORMER: [
      'Sgt. Mikhail Kozlov — Wagner PMC. Former convict. Pardoned to fight.',
      'Lt. Artem Bychkov — 1st Slavic Corps. Volunteer. Storm trooper.',
      'Sgt. Ruslan Medvedev — Wagner assault squad. Bakhmut sector.',
      'Cpl. Gennady Orlov — Assault pioneer. Deminer turned attacker.',
    ],
    ARMORED: [
      'Sgt. Maj. Nikolai Baranov — T-72B3 crewman, 4th Kantemirovskaya Division.',
      'Lt. Sergei Volodymyr — BMP-3 commander, 8th Combined Arms.',
      'Cpl. Danila Trofimov — BTR-82A gunner. Western Military District.',
    ],
    ENGINEER: [
      'Sgt. Oleg Stepanov — Combat engineer, 106th Guards Airborne. Tula.',
      'Cpl. Vitaly Karpov — IED placement specialist. 1st Tank Army.',
    ],
    SNIPER: [
      'WO2 Alexei Utkin — designated marksman, SVD rifle. 98th Airborne.',
      'Sniper "Vityaz" — Spetsnaz FSB. ID unconfirmed. 12 confirmed kills claimed.',
    ],
    HEAVY: [
      'Sgt. Maj. Bogdan Rykov — Turla brigade. MG crew chief. Donetsk native.',
      'Cpl. Maxim Chesnokov — PKP Pecheneg gunner. 1st Guards Tank Army.',
    ],
    DEFAULT: [
      'Unknown soldier — ID unreadable. GRU intelligence, serial 7714.',
      'Unknown combatant — no insignia. Possible private military contractor.',
      'ID tag: classified. Unit and rank redacted by FSB.',
    ],
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _tags       = [];  // active tag objects
  var _total      = 0;   // total collected this session
  var _scene      = null;
  var _promptEl   = null;
  var _counterEl  = null;
  var _patchApplied = false;

  /* ── Helpers ────────────────────────────── */
  function _getScene()  { try { return window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){return null;} }
  function _getPlayer() { try { return window.player || null; } catch(e){return null;} }
  function _notify(msg, color) { try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(msg, color||'#ffd700'); } catch(e){} }

  function _loreFor(typeName) {
    var bank = LORE[typeName] || LORE.DEFAULT;
    return bank[Math.floor(Math.random() * bank.length)];
  }

  /* ── Build tag mesh ──────────────────────── */
  function _buildTagMesh() {
    if (typeof THREE === 'undefined') return null;
    var group = new THREE.Group();
    // Tag body (thin metallic rectangle)
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.28, 0.02),
      new THREE.MeshLambertMaterial({ color: 0xc8c8c8, metalness: 0.8 })
    );
    group.add(body);
    // Hole
    var hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    hole.position.set(0, 0.1, 0);
    hole.rotation.x = Math.PI / 2;
    group.add(hole);
    // Tiny chain link
    var chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.008, 6, 12),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
    );
    chain.position.y = 0.15;
    group.add(chain);
    // Glow sprite above
    var glowMat = new THREE.SpriteMaterial({
      color: 0xffd700, transparent: true, opacity: 0.5,
      blending: typeof THREE.AdditiveBlending !== 'undefined' ? THREE.AdditiveBlending : undefined,
    });
    var glow = new THREE.Sprite(glowMat);
    glow.scale.set(0.4, 0.4, 1);
    glow.position.y = 0.1;
    group.add(glow);
    return group;
  }

  /* ── Spawn a tag at position ──────────────── */
  function _spawn(position, typeName) {
    if (_tags.length >= CFG.MAX_TAGS) return;
    _scene = _getScene();
    if (!_scene || typeof THREE === 'undefined') return;

    var mesh = _buildTagMesh();
    if (!mesh) return;

    var y = CFG.TAG_HEIGHT;
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        y = (VoxelWorld.getTerrainHeight(Math.round(position.x), Math.round(position.z)) || 0) + CFG.TAG_HEIGHT;
      }
    } catch(e) {}

    mesh.position.set(position.x + (Math.random()-0.5)*0.5, y, position.z + (Math.random()-0.5)*0.5);
    _scene.add(mesh);

    _tags.push({
      mesh:   mesh,
      lore:   _loreFor(typeName),
      timer:  0,
      phase:  Math.random() * Math.PI * 2,
    });
  }

  /* ── Collect a tag ───────────────────────── */
  function _collect(tag, idx) {
    _total++;
    _tags.splice(idx, 1);
    try { _scene.remove(tag.mesh); } catch(e) {}
    _notify('🪖 DOG TAG  +' + CFG.SCORE_PER_TAG + '  "' + tag.lore.substring(0, 48) + '…"', '#ffd700');
    // Score
    try {
      var p = _getPlayer();
      if (p) {
        p.score = (p.score || 0) + CFG.SCORE_PER_TAG;
        if (window.HUD && HUD.setScore) HUD.setScore(p.score);
      }
    } catch(e) {}
    // Counter
    if (_counterEl) _counterEl.textContent = '🪖 ' + _total;
    if (_promptEl) _promptEl.style.display = 'none';
  }

  /* ── Patch Enemies to fire on death ──────── */
  function _patchEnemies() {
    if (_patchApplied || typeof Enemies === 'undefined') return;
    // Try hooking by watching damageInRadius return and checking enemy deaths
    // Lighter approach: poll dead enemies each frame
    _patchApplied = true;
  }

  /* ── Update ──────────────────────────────── */
  var _prevDeadSet = new WeakSet();

  function update(dt) {
    _scene = _scene || _getScene();
    var p = _getPlayer();
    var now = performance.now() / 1000;

    // Scan for newly dead enemies → maybe drop tags
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var j = 0; j < all.length; j++) {
          var e = all[j];
          if (!e || !e.mesh) continue;
          if (e.dead && !_prevDeadSet.has(e)) {
            _prevDeadSet.add(e);
            if (Math.random() < CFG.DROP_CHANCE) {
              var tname = (e.typeCfg && e.typeCfg.name) ? e.typeCfg.name.toUpperCase() : 'DEFAULT';
              _spawn(e.mesh.position, tname);
            }
          }
        }
      }
    } catch(err) {}

    // Animate and check collection
    var nearTag = null;
    for (var i = _tags.length - 1; i >= 0; i--) {
      var tag = _tags[i];
      tag.timer += dt;
      if (tag.timer > CFG.EXPIRE_SEC) {
        try { _scene.remove(tag.mesh); } catch(ex) {}
        _tags.splice(i, 1);
        continue;
      }
      // Bob + spin
      tag.phase = (tag.phase || 0) + CFG.BOB_SPEED * dt;
      tag.mesh.position.y = (tag.mesh.position.y || CFG.TAG_HEIGHT) +
        (Math.sin(tag.phase) * CFG.BOB_AMP - Math.sin(tag.phase - CFG.BOB_SPEED * dt) * CFG.BOB_AMP);
      tag.mesh.rotation.y += CFG.SPIN_SPEED * dt;

      // Proximity to player
      if (p && p.position) {
        var dx = p.position.x - tag.mesh.position.x;
        var dz = p.position.z - tag.mesh.position.z;
        var d2 = dx*dx + dz*dz;
        if (d2 < CFG.COLLECT_DIST * CFG.COLLECT_DIST) {
          _collect(tag, i);
          break;
        } else if (d2 < (CFG.COLLECT_DIST * 2.5) * (CFG.COLLECT_DIST * 2.5)) {
          nearTag = tag;
        }
      }
    }

    // Proximity prompt
    if (_promptEl) {
      _promptEl.style.display = nearTag ? 'block' : 'none';
    }
  }

  /* ── Init ────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    // Counter HUD
    _counterEl = document.createElement('div');
    _counterEl.id = 'dogtag-counter';
    _counterEl.style.cssText = [
      'position:fixed;top:68px;right:12px;font-family:monospace;font-size:11px;',
      'color:#ffd700;background:rgba(0,0,0,0.5);border:1px solid rgba(255,215,0,0.3);',
      'padding:2px 7px;border-radius:4px;z-index:210;pointer-events:none;',
    ].join('');
    _counterEl.textContent = '🪖 0';
    document.body.appendChild(_counterEl);

    // Proximity prompt (reuse style from airdrop)
    _promptEl = document.createElement('div');
    _promptEl.id = 'dogtag-prompt';
    _promptEl.style.cssText = [
      'display:none;position:fixed;bottom:200px;left:50%;transform:translateX(-50%);',
      'background:rgba(0,0,0,0.7);border:1px solid rgba(255,215,0,0.5);',
      'color:#ffd700;padding:5px 16px;border-radius:6px;font-size:13px;',
      'font-family:monospace;z-index:210;pointer-events:none;',
    ].join('');
    _promptEl.textContent = '🪖 Walk through to collect tag';
    document.body.appendChild(_promptEl);

    // Self-driven rAF loop
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init, update: update, spawn: _spawn, getTags: function () { return _tags; } };
})();

window.DogTagSystem = DogTagSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DogTagSystem.init(); });
} else {
  DogTagSystem.init();
}
