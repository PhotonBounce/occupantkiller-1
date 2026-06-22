/* ─────────────────────────────────────────────────────────────────────────
   INTEL SYSTEM — Collectible intelligence documents
   Players collect enemy intel scattered across each level.
   Auto-collect within 1.5 units; triggers toast + doc-reader overlay.
   Depends on: THREE (global), HUD.showToast (optional), window._gameScene,
               window._player, window._onIntelCollected (optional callback)
   ───────────────────────────────────────────────────────────────────────── */
window.IntelSystem = (function () {
  'use strict';

  /* ── Intel document library ─────────────────────────────────────────── */
  var INTEL_DOCUMENTS = [
    { id: 'INF_ORDER_7',      title: 'INFANTRY ORDER 7',               content: 'All units advance on Schedule Bravo. Artillery support arrives 0300. Hold the eastern flank at all costs.',                                                                   bonus: 500  },
    { id: 'SUPPLY_MANIFEST',  title: 'SUPPLY MANIFEST',                content: '2000 rounds 7.62mm. 50x RPG-7. Medical supplies for 3rd Battalion. Delivery point: Grid 447-882.',                                                                            bonus: 300  },
    { id: 'COMM_INTERCEPT',   title: 'COMMUNICATIONS INTERCEPT',       content: 'Command confirms: defensive perimeter collapsing. Requesting immediate reinforcement. Authorization code ZOLOTO.',                                                              bonus: 750  },
    { id: 'TROOP_POSITIONS',  title: 'TROOP POSITIONS MAP',            content: 'Enemy has 3 platoons at markers Alpha, Bravo, Charlie. Heavy MG nest at northern bridge. Snipers on buildings 4 and 7.',                                                       bonus: 600  },
    { id: 'COMMANDER_ORDERS', title: "COMMANDER'S ORDERS",             content: 'Do not engage civilian infrastructure. All prisoners to be processed at FOB VOSTOK. No unauthorized withdrawals.',                                                              bonus: 400  },
    { id: 'CHEMICAL_REPORT',  title: 'CHEMICAL WEAPONS REPORT',        content: 'CLASSIFIED. Deployment authorization denied. Munitions secured at location OMEGA. Keys held by Colonel Petrov only.',                                                           bonus: 1000 },
    { id: 'SURRENDER_TERMS',  title: 'SURRENDER REFUSAL',              content: 'Terms rejected. We hold this position until the last man. Reinforcements en route from 2nd Army. No retreat.',                                                                 bonus: 350  },
    { id: 'NUCLEAR_CODES',    title: 'ENCRYPTED: NUCLEAR AUTHORIZATIONS', content: 'EYES ONLY. Protocol MEDVED active. Two-person rule required. Authentication alpha-seven-three-foxtrot.',                                                                    bonus: 2000 }
  ];

  /* ── Default spawn candidate positions (used when none supplied) ──── */
  var DEFAULT_SPAWN_CANDIDATES = [
    { x:  8, z:  8 }, { x: -8, z:  8 }, { x:  8, z: -8 }, { x: -8, z: -8 },
    { x: 15, z:  0 }, { x: -15, z:  0 }, { x:  0, z: 15 }, { x:  0, z: -15 },
    { x: 12, z: 12 }, { x: -12, z: 12 }, { x: 12, z: -12 }, { x: -12, z: -12 }
  ];

  /* ── State ──────────────────────────────────────────────────────────── */
  var _intelItems    = [];   // { mesh, light, docData, collected, baseY }
  var _collectedIds  = {};   // id → true
  var _totalSpawned  = 0;
  var _allBonusGiven = false;
  var _readerTimer   = null;

  /* ── Geometry / material (shared) ───────────────────────────────────── */
  var _docGeo  = null;
  var _docMat  = null;

  function _getDocGeo() {
    if (!_docGeo) _docGeo = new THREE.BoxGeometry(0.3, 0.4, 0.02);
    return _docGeo;
  }
  function _getDocMat() {
    if (!_docMat) _docMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    return _docMat;
  }

  /* ── Toast helper ──────────────────────────────────────────────────── */
  function _toast(msg, duration, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast(msg, duration || 3000, color || '#44ff88');
        return;
      }
    } catch (eT) {}
    /* Fallback: roll our own */
    var t = document.createElement('div');
    t.style.cssText =
      'position:fixed;top:36%;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.82);color:' + (color || '#44ff88') + ';' +
      'font-family:monospace;font-size:15px;padding:8px 22px;border-radius:6px;' +
      'z-index:7000;pointer-events:none;border:1px solid ' + (color || '#44ff88') + ';' +
      'transition:opacity 0.4s;letter-spacing:1.5px';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 500);
    }, duration || 3000);
  }

  /* ── Doc-reader overlay (bottom-left, 300×120 px, auto-dismiss 4s) ── */
  function _showDocReader(docData) {
    var existing = document.getElementById('intel-doc-reader');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    if (_readerTimer) { clearTimeout(_readerTimer); _readerTimer = null; }

    var overlay = document.createElement('div');
    overlay.id = 'intel-doc-reader';
    overlay.style.cssText =
      'position:fixed;bottom:14px;left:14px;width:300px;min-height:120px;' +
      'background:rgba(8,12,8,0.92);border:1.5px solid #FFD700;border-radius:7px;' +
      'padding:10px 13px;z-index:8000;pointer-events:none;font-family:monospace;' +
      'overflow:hidden;box-shadow:0 0 16px rgba(255,215,0,0.18);' +
      'transition:opacity 0.5s;opacity:1';

    /* Diagonal classified watermark */
    var watermark = document.createElement('div');
    watermark.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);' +
      'color:rgba(220,30,30,0.22);font-size:22px;font-weight:900;letter-spacing:4px;' +
      'pointer-events:none;white-space:nowrap;font-family:monospace;user-select:none';
    watermark.textContent = 'CLASSIFIED';
    overlay.appendChild(watermark);

    /* Title */
    var titleEl = document.createElement('div');
    titleEl.style.cssText =
      'color:#FFD700;font-weight:bold;font-size:12px;letter-spacing:1.5px;' +
      'margin-bottom:6px;text-transform:uppercase';
    titleEl.textContent = '📂 ' + docData.title;
    overlay.appendChild(titleEl);

    /* Content */
    var contentEl = document.createElement('div');
    contentEl.style.cssText =
      'color:#ddd;font-size:10px;line-height:1.5;letter-spacing:0.5px';
    contentEl.textContent = docData.content;
    overlay.appendChild(contentEl);

    /* Bonus line */
    var bonusEl = document.createElement('div');
    bonusEl.style.cssText =
      'color:#44ff88;font-size:10px;margin-top:7px;font-weight:bold';
    bonusEl.textContent = '+' + docData.bonus + ' INTEL BONUS';
    overlay.appendChild(bonusEl);

    document.body.appendChild(overlay);

    /* Auto-dismiss after 4 s */
    _readerTimer = setTimeout(function () {
      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 600);
      _readerTimer = null;
    }, 4000);
  }

  /* ── Collect one item ───────────────────────────────────────────────── */
  function _collect(item) {
    if (item.collected) return;
    item.collected = true;

    var scene = window._gameScene;
    if (scene) {
      if (item.mesh)  scene.remove(item.mesh);
      if (item.light) scene.remove(item.light);
    }

    _collectedIds[item.docData.id] = true;

    /* Score */
    if (window._player) {
      window._player.score = (window._player.score || 0) + item.docData.bonus;
    }

    /* Toast */
    _toast('🗂 INTEL SECURED: +' + item.docData.bonus, 3000, '#44ff88');

    /* Doc reader */
    _showDocReader(item.docData);

    /* Callback hook */
    try {
      if (typeof window._onIntelCollected === 'function') {
        window._onIntelCollected(item.docData);
      }
    } catch (eCb) {}

    /* Check for all-docs bonus */
    var collected = getCollected();
    if (!_allBonusGiven && collected.count > 0 && collected.count === collected.total) {
      _allBonusGiven = true;
      if (window._player) {
        window._player.score = (window._player.score || 0) + 2000;
      }
      setTimeout(function () {
        _toast('🏆 ALL INTEL SECURED — BONUS +2000', 4000, '#FFD700');
      }, 500);
    }
  }

  /* ── Public: init ───────────────────────────────────────────────────── */
  function init() {
    /* nothing to wire up; scene is read from window._gameScene at spawn time */
  }

  /* ── Public: spawnIntel(levelId, spawnCandidates) ───────────────────── */
  function spawnIntel(levelId, spawnCandidates) {
    var scene = window._gameScene;
    if (!scene) return;

    var candidates = spawnCandidates || DEFAULT_SPAWN_CANDIDATES;

    /* 2–4 docs per level */
    var count = 2 + Math.floor(Math.random() * 3); // 2,3,4
    if (count > INTEL_DOCUMENTS.length) count = INTEL_DOCUMENTS.length;

    /* Shuffle doc list to pick random subset */
    var shuffled = INTEL_DOCUMENTS.slice();
    for (var si = shuffled.length - 1; si > 0; si--) {
      var rj = Math.floor(Math.random() * (si + 1));
      var tmp = shuffled[si];
      shuffled[si] = shuffled[rj];
      shuffled[rj] = tmp;
    }

    for (var i = 0; i < count; i++) {
      var docData = shuffled[i];
      var candidate = candidates[Math.floor(Math.random() * candidates.length)];

      var posX = candidate.x + (Math.random() - 0.5) * 6;
      var posZ = candidate.z + (Math.random() - 0.5) * 6;
      var posY = 1.5;

      /* Document mesh */
      var mesh = new THREE.Mesh(_getDocGeo(), _getDocMat().clone());
      mesh.position.set(posX, posY, posZ);
      scene.add(mesh);

      /* Glow point light */
      var light = new THREE.PointLight(0xFFD700, 0.5, 3);
      light.position.set(posX, posY, posZ);
      scene.add(light);

      _intelItems.push({
        mesh:      mesh,
        light:     light,
        docData:   docData,
        collected: false,
        baseY:     posY
      });
    }

    _totalSpawned = _intelItems.length;
  }

  /* ── Public: update(playerPos) ─────────────────────────────────────── */
  function update(playerPos) {
    if (!playerPos) return;
    var now = Date.now();

    for (var i = 0; i < _intelItems.length; i++) {
      var item = _intelItems[i];
      if (item.collected) continue;

      /* Bob animation */
      item.mesh.position.y = item.baseY + Math.sin(now * 0.003) * 0.005;

      /* Rotation */
      item.mesh.rotation.y += 0.02;

      /* Sync light to mesh */
      item.light.position.x = item.mesh.position.x;
      item.light.position.y = item.mesh.position.y;
      item.light.position.z = item.mesh.position.z;

      /* Proximity auto-collect (1.5 units) */
      var dx = item.mesh.position.x - playerPos.x;
      var dz = item.mesh.position.z - playerPos.z;
      var distSq = dx * dx + dz * dz;
      if (distSq < 1.5 * 1.5) {
        _collect(item);
      }
    }
  }

  /* ── Public: getCollected() ─────────────────────────────────────────── */
  function getCollected() {
    var count = 0;
    for (var i = 0; i < _intelItems.length; i++) {
      if (_intelItems[i].collected) count++;
    }
    var bonusAwarded = _allBonusGiven ? 2000 : 0;
    return { count: count, total: _intelItems.length, bonus: bonusAwarded };
  }

  /* ── Public: reset() ────────────────────────────────────────────────── */
  function reset() {
    var scene = window._gameScene;
    for (var i = 0; i < _intelItems.length; i++) {
      var item = _intelItems[i];
      if (scene) {
        if (item.mesh)  scene.remove(item.mesh);
        if (item.light) scene.remove(item.light);
      }
      if (item.mesh && item.mesh.material) {
        item.mesh.material.dispose();
      }
    }
    _intelItems    = [];
    _collectedIds  = {};
    _totalSpawned  = 0;
    _allBonusGiven = false;
    if (_readerTimer) {
      clearTimeout(_readerTimer);
      _readerTimer = null;
    }
    var existing = document.getElementById('intel-doc-reader');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    /* Dispose shared geometry on reset */
    if (_docGeo)  { _docGeo.dispose();  _docGeo  = null; }
    /* Note: _docMat is cloned per item, so shared ref does not hold clone state */
    if (_docMat)  { _docMat.dispose();  _docMat  = null; }
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  return { init: init, spawnIntel: spawnIntel, update: update, getCollected: getCollected, reset: reset };

})();
