// supply-cache.js — Hidden loot boxes scattered in the level that reward exploration
// All var — no let/const. IIFE pattern.

window.SupplyCache = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MIN_CACHES        = 5;
  var MAX_CACHES        = 8;
  var MIN_DIST          = 20;
  var MAX_DIST          = 40;
  var DISCOVER_DIST     = 4;    // units to show HUD prompt
  var OPEN_DIST         = 2;    // units to hold E
  var HOLD_E_TIME       = 2.0;  // seconds to hold E before opening
  var LID_OPEN_DUR      = 0.5;  // seconds for lid animation
  var RESPAWN_TIME      = 180;  // seconds
  var LIGHT_PULSE_SPEED = 1.4;  // radians/s
  var HIDDEN_COUNT      = 2;    // caches that need proximity or heat-vision

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene   = null;
  var _camera  = null;
  var _inited  = false;

  var _caches  = [];   // array of cache objects
  var _eDown   = false;
  var _holdTimer = 0;  // seconds E held for nearest candidate
  var _nearestOpen = null;  // cache currently being opened

  var _hudEl   = null; // HUD banner element
  var _floatCont = null;
  var _floatItems = [];

  var _allClearedShown = false;

  // expose globals as spec requires
  window._supplyCarches = _caches;   // note: spec typo preserved exactly
  window._cachesFound   = 0;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  function _getCamera() {
    return _camera || window._camera || null;
  }

  function _toast(msg, dur) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg, dur || 3000);
    } else {
      console.log('[SupplyCache] ' + msg);
    }
  }

  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        window._audioCtx = new Ctx();
        return window._audioCtx;
      }
    } catch (e) {}
    return null;
  }

  function _playerPos() {
    var cam = _getCamera();
    if (cam) return cam.position;
    if (window.player && window.player.position) return window.player.position;
    return null;
  }

  function _dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── Audio ─────────────────────────────────────────────────────────────────

  function _playCreak() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        var t = i / ctx.sampleRate;
        var env = Math.exp(-t * 5);
        d[i] = (Math.sin(2 * Math.PI * 120 * t) * 0.4 +
                 Math.sin(2 * Math.PI * 80 * t + Math.sin(t * 30)) * 0.3 +
                 (Math.random() * 2 - 1) * 0.1 * env) * env;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.55, ctx.currentTime);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playChime() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var freqs = [880, 1108, 1320];
      for (var i = 0; i < freqs.length; i++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.4);
        })(freqs[i], i * 0.12);
      }
    } catch (e) {}
  }

  function _playFanfare() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var notes = [523, 659, 784];  // C5 E5 G5
      for (var i = 0; i < notes.length; i++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + delay + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.55);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.6);
        })(notes[i], i * 0.18);
      }
    } catch (e) {}
  }

  // ── Floating text ─────────────────────────────────────────────────────────

  function _ensureFloatCont() {
    if (_floatCont) return;
    _floatCont = document.createElement('div');
    _floatCont.style.position = 'fixed';
    _floatCont.style.top = '0';
    _floatCont.style.left = '0';
    _floatCont.style.width = '100%';
    _floatCont.style.height = '100%';
    _floatCont.style.pointerEvents = 'none';
    _floatCont.style.zIndex = '620';
    _floatCont.style.overflow = 'hidden';
    document.body.appendChild(_floatCont);
  }

  function _spawnFloatText(text, color) {
    _ensureFloatCont();
    var sx = window.innerWidth / 2 + (Math.random() * 80 - 40);
    var sy = window.innerHeight / 2 - 60 + (Math.random() * 30 - 15);

    var div = document.createElement('div');
    div.textContent = text;
    div.style.position = 'fixed';
    div.style.left = sx + 'px';
    div.style.top = sy + 'px';
    div.style.color = color || '#FFD700';
    div.style.fontSize = '20px';
    div.style.fontWeight = 'bold';
    div.style.fontFamily = 'monospace, sans-serif';
    div.style.textShadow = '0 0 10px ' + (color || '#FFD700') + ', 1px 1px 2px #000';
    div.style.opacity = '1';
    div.style.pointerEvents = 'none';
    div.style.userSelect = 'none';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.whiteSpace = 'nowrap';
    _floatCont.appendChild(div);

    _floatItems.push({ div: div, sx: sx, sy: sy, elapsed: 0, life: 2.2 });
  }

  function _updateFloatTexts(dt) {
    var i = _floatItems.length - 1;
    while (i >= 0) {
      var fi = _floatItems[i];
      fi.elapsed += dt;
      if (fi.elapsed >= fi.life) {
        if (fi.div.parentNode) fi.div.parentNode.removeChild(fi.div);
        _floatItems.splice(i, 1);
        i--;
        continue;
      }
      var progress = fi.elapsed / fi.life;
      var opacity = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
      fi.div.style.opacity = opacity;
      fi.div.style.top = (fi.sy - fi.elapsed * 40) + 'px';
      i--;
    }
  }

  // ── HUD banner ────────────────────────────────────────────────────────────

  function _ensureHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'supply-cache-hud';
    _hudEl.style.position = 'fixed';
    _hudEl.style.bottom = '110px';
    _hudEl.style.left = '50%';
    _hudEl.style.transform = 'translateX(-50%)';
    _hudEl.style.background = 'rgba(61,28,2,0.85)';
    _hudEl.style.border = '1px solid #FFD700';
    _hudEl.style.borderRadius = '6px';
    _hudEl.style.padding = '6px 16px';
    _hudEl.style.color = '#FFD700';
    _hudEl.style.fontFamily = 'monospace, sans-serif';
    _hudEl.style.fontSize = '14px';
    _hudEl.style.fontWeight = 'bold';
    _hudEl.style.pointerEvents = 'none';
    _hudEl.style.display = 'none';
    _hudEl.style.zIndex = '615';
    _hudEl.style.textShadow = '0 0 8px #FFD700';
    document.body.appendChild(_hudEl);
  }

  function _showHud(text) {
    _ensureHud();
    _hudEl.textContent = text;
    _hudEl.style.display = 'block';
  }

  function _hideHud() {
    if (_hudEl) _hudEl.style.display = 'none';
  }

  // ── Build a cache mesh ────────────────────────────────────────────────────

  function _buildCacheMesh() {
    if (typeof THREE === 'undefined') return null;

    var group = new THREE.Group();

    // Body — dark brown wooden crate
    var bodyGeo = new THREE.BoxGeometry(0.7, 0.5, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x3D1C02 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    group.add(body);  // index 0

    // Lid — slightly larger, pivots from back edge
    var lidGeo = new THREE.BoxGeometry(0.7, 0.06, 0.5);
    var lidMat = new THREE.MeshLambertMaterial({ color: 0x3D1C02 });
    var lid = new THREE.Mesh(lidGeo, lidMat);
    // Offset lid pivot: translate so the hinge is at the back
    lid.position.set(0, 0.28, 0);  // rests on top of body
    group.add(lid);  // index 1

    // Metal corner brackets — 4 gold cubes at top corners of body
    var brGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var brMat = new THREE.MeshLambertMaterial({ color: 0xCCA020 });
    var corners = [
      [-0.31,  0.21, -0.21],
      [ 0.31,  0.21, -0.21],
      [-0.31,  0.21,  0.21],
      [ 0.31,  0.21,  0.21],
    ];
    for (var i = 0; i < corners.length; i++) {
      var br = new THREE.Mesh(brGeo, brMat);
      br.position.set(corners[i][0], corners[i][1], corners[i][2]);
      group.add(br);
    }

    // Pulsing point light — yellow glow
    var light = new THREE.PointLight(0xFFAA00, 2, 3);
    light.position.set(0, 0.5, 0);
    group.add(light);  // index 6 (4 brackets + lid + body = indices 0-5 => light at 6)

    return group;
  }

  // ── Loot table ────────────────────────────────────────────────────────────

  function _rollLoot() {
    var r = Math.random();
    if (r < 0.10) return 'GOLDEN';
    r = Math.random();
    if (r < 0.30) return 'HP';
    if (r < 0.55) return 'AMMO';
    if (r < 0.75) return 'SCORE';
    return 'SPECIALTY';
  }

  function _applyLoot(lootType) {
    var msgs = [];
    var floatColor = '#FFD700';

    function doHp() {
      if (window.player) {
        if (window.player.hp !== undefined) {
          window.player.hp = Math.min((window.player.hp || 0) + 50, 100);
        } else if (window.player.health !== undefined) {
          window.player.health = Math.min((window.player.health || 0) + 50, window.player.maxHealth || 100);
        }
      }
      msgs.push('+50 HP');
      floatColor = '#44FF88';
    }

    function doAmmo() {
      if (window.player && window.player.ammo !== undefined) {
        window.player.ammo = Math.min((window.player.ammo || 0) + 999, 999);
      }
      msgs.push('AMMO RESUPPLY');
      floatColor = '#44AAFF';
    }

    function doScore() {
      if (window.player && window.player.score !== undefined) {
        window.player.score += 500;
      }
      msgs.push('+500 SCORE');
      floatColor = '#FFFF44';
    }

    function doSpecialty() {
      var pick = Math.floor(Math.random() * 2);
      if (pick === 0) {
        window._grenadeCount = (window._grenadeCount || 0) + 1;
        msgs.push('+1 GRENADE');
      } else {
        window._rocketAmmo = (window._rocketAmmo || 0) + 1;
        msgs.push('+1 ROCKET');
      }
      floatColor = '#FF8844';
    }

    if (lootType === 'GOLDEN') {
      doHp();
      doAmmo();
      doScore();
      if (window.player && window.player.score !== undefined) {
        window.player.score += 2000;
      }
      doSpecialty();
      msgs = ['GOLDEN CACHE! +2000 SCORE + ALL LOOT'];
      floatColor = '#FFD700';
      _toast('★ GOLDEN CACHE ★ +2000 SCORE + ALL LOOT!', 5000);
      _playFanfare();
    } else if (lootType === 'HP') {
      doHp();
      _toast('📦 +50 HP from Supply Cache');
      _playChime();
    } else if (lootType === 'AMMO') {
      doAmmo();
      _toast('📦 Ammo Resupply from Supply Cache');
      _playChime();
    } else if (lootType === 'SCORE') {
      doScore();
      _toast('📦 +500 Score from Supply Cache');
      _playChime();
    } else {
      doSpecialty();
      _toast('📦 Specialty Weapon Charge from Supply Cache');
      _playChime();
    }

    for (var i = 0; i < msgs.length; i++) {
      _spawnFloatText(msgs[i], floatColor);
    }
  }

  // ── Open a cache ──────────────────────────────────────────────────────────

  function _openCache(cache) {
    if (cache.opened || cache.opening) return;
    cache.opening = true;
    _playCreak();
    window._cachesFound = (window._cachesFound || 0) + 1;

    // Check if all caches looted
    var allLooted = true;
    for (var i = 0; i < _caches.length; i++) {
      if (!_caches[i].opened && !_caches[i].opening) { allLooted = false; break; }
    }
    if (allLooted) {
      _allClearedShown = false; // will show after this one finishes
    }
  }

  function _finishOpen(cache) {
    if (cache.opened) return;
    cache.opened = true;
    cache.opening = false;
    cache.respawnTimer = RESPAWN_TIME;

    // Turn off light
    if (cache.group) {
      var light = cache.group.children[6];
      if (light && light.isLight) light.intensity = 0;
    }

    var loot = _rollLoot();
    _applyLoot(loot);

    // Check "all caches cleared"
    if (!_allClearedShown) {
      var allDone = true;
      for (var i = 0; i < _caches.length; i++) {
        if (!_caches[i].opened) { allDone = false; break; }
      }
      if (allDone) {
        _allClearedShown = true;
        setTimeout(function () {
          _toast('ALL CACHES CLEARED', 4000);
        }, 800);
      }
    }
  }

  // ── Spawn caches ──────────────────────────────────────────────────────────

  function _spawnCaches() {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;

    var count = MIN_CACHES + Math.floor(Math.random() * (MAX_CACHES - MIN_CACHES + 1));
    _caches.length = 0;
    window._supplyCarches = _caches;
    window._cachesFound = 0;
    _allClearedShown = false;

    // Decide which indices are "hidden"
    var hiddenIndices = {};
    var pool = [];
    for (var h = 0; h < count; h++) pool.push(h);
    for (var hi = 0; hi < HIDDEN_COUNT && pool.length > 0; hi++) {
      var pick = Math.floor(Math.random() * pool.length);
      hiddenIndices[pool[pick]] = true;
      pool.splice(pick, 1);
    }

    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var radius = MIN_DIST + Math.random() * (MAX_DIST - MIN_DIST);
      var px = Math.cos(angle) * radius;
      var pz = Math.sin(angle) * radius;

      var group = _buildCacheMesh();
      if (!group) continue;

      group.position.set(px, 0.25, pz);  // ground level (half-height of 0.5)
      sc.add(group);

      var isHidden = !!hiddenIndices[i];

      var cache = {
        group: group,
        pos: { x: px, y: 0.25, z: pz },
        hidden: isHidden,
        opened: false,
        opening: false,
        lidAngle: 0,
        lidTimer: 0,
        holdTimer: 0,
        respawnTimer: 0,
        lightPhase: Math.random() * Math.PI * 2,
      };

      if (isHidden) {
        group.visible = false;
      }

      _caches.push(cache);
    }
  }

  // ── E key listeners ───────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
      _eDown = true;
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
      _eDown = false;
      _holdTimer = 0;
      _nearestOpen = null;
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  function update(dt) {
    if (!_inited || !dt || dt <= 0) return;

    var pPos = _playerPos();
    var nearbyCache = null;
    var nearbyDist = Infinity;
    var openableCache = null;
    var openableDist = Infinity;

    var heatVision = !!window._heatVisionActive;

    for (var i = 0; i < _caches.length; i++) {
      var cache = _caches[i];
      var group = cache.group;
      if (!group) continue;

      // ── Respawn logic ────────────────────────────────────────────────────
      if (cache.opened && cache.respawnTimer > 0) {
        cache.respawnTimer -= dt;
        if (cache.respawnTimer <= 0) {
          cache.opened = false;
          cache.opening = false;
          cache.lidAngle = 0;
          cache.lidTimer = 0;
          if (group.children[1]) group.children[1].rotation.x = 0;
          var respawnLight = group.children[6];
          if (respawnLight && respawnLight.isLight) respawnLight.intensity = 2;
          if (cache.hidden) group.visible = false;
          else group.visible = true;
          _allClearedShown = false;
        }
        continue;
      }

      // ── Visibility for hidden caches ─────────────────────────────────────
      if (cache.hidden && !cache.opened) {
        if (pPos) {
          var distH = _dist(pPos, cache.pos);
          group.visible = (distH <= 6) || heatVision;
        } else {
          group.visible = heatVision;
        }
      } else if (!cache.opened) {
        group.visible = true;
      }

      // ── Light pulse ──────────────────────────────────────────────────────
      if (!cache.opened && group.children[6] && group.children[6].isLight) {
        cache.lightPhase += dt * LIGHT_PULSE_SPEED;
        group.children[6].intensity = 1.2 + 0.8 * Math.sin(cache.lightPhase);
      }

      // ── Lid animation ────────────────────────────────────────────────────
      if (cache.opening && cache.lidTimer < LID_OPEN_DUR) {
        cache.lidTimer += dt;
        var progress = Math.min(cache.lidTimer / LID_OPEN_DUR, 1);
        cache.lidAngle = -Math.PI * 0.7 * progress;
        if (group.children[1]) group.children[1].rotation.x = cache.lidAngle;
        if (progress >= 1) {
          _finishOpen(cache);
        }
      }

      // ── Proximity ────────────────────────────────────────────────────────
      if (!pPos || cache.opened) continue;

      var d = _dist(pPos, cache.pos);
      if (d < nearbyDist && d <= DISCOVER_DIST) {
        nearbyDist = d;
        nearbyCache = cache;
      }
      if (d < openableDist && d <= OPEN_DIST && !cache.opening) {
        openableDist = d;
        openableCache = cache;
      }
    }

    // ── HUD banner ──────────────────────────────────────────────────────────
    if (nearbyCache && !nearbyCache.opened && !nearbyCache.opening) {
      _showHud('📦 SUPPLY CACHE NEARBY [E]');
    } else {
      _hideHud();
    }

    // ── Hold-E to open ──────────────────────────────────────────────────────
    if (_eDown && openableCache && !openableCache.opening && !openableCache.opened) {
      if (_nearestOpen !== openableCache) {
        _nearestOpen = openableCache;
        _holdTimer = 0;
      }
      _holdTimer += dt;
      if (_holdTimer >= HOLD_E_TIME) {
        _holdTimer = 0;
        _nearestOpen = null;
        _openCache(openableCache);
        openableCache.opening = true;
        openableCache.lidTimer = 0;
      }
    } else if (!_eDown) {
      _holdTimer = 0;
      _nearestOpen = null;
    }

    // ── Float texts ─────────────────────────────────────────────────────────
    _updateFloatTexts(dt);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init(scene, camera) {
    if (_inited) return;
    _inited = true;

    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _ensureHud();
    _ensureFloatCont();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    _spawnCaches();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset() {
    // Remove existing cache meshes
    var sc = _getScene();
    for (var i = 0; i < _caches.length; i++) {
      if (_caches[i].group && sc) sc.remove(_caches[i].group);
    }
    _caches.length = 0;
    window._cachesFound = 0;
    _holdTimer = 0;
    _eDown = false;
    _nearestOpen = null;
    _allClearedShown = false;
    _hideHud();

    // Clear float texts
    for (var j = 0; j < _floatItems.length; j++) {
      if (_floatItems[j].div && _floatItems[j].div.parentNode) {
        _floatItems[j].div.parentNode.removeChild(_floatItems[j].div);
      }
    }
    _floatItems.length = 0;

    // Re-spawn if already inited
    if (_inited) {
      _spawnCaches();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return { init: init, update: update, reset: reset };

})();
