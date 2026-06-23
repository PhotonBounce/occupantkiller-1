window.DogTagCollector = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var COLLECT_RADIUS = 1.0;
  var IDENTIFY_RADIUS = 2.0;
  var DESPAWN_TIME = 45000; // ms
  var LOG_DISPLAY_TIME = 4000; // ms
  var MAX_LOG_ENTRIES = 5;

  var TAG_TYPES = {
    BASIC:     { label: 'BASIC',     xp: 50,   color: 0xC0C0C0, emissive: 0x333333, scale: 1.0 },
    ELITE:     { label: 'ELITE',     xp: 200,  color: 0xFFD700, emissive: 0x886600, scale: 1.0 },
    LEGENDARY: { label: 'LEGENDARY', xp: 1000, color: 0xFF4400, emissive: 0x880000, scale: 1.6 },
    MEDIC:     { label: 'MEDIC',     xp: 100,  color: 0xFFFFFF, emissive: 0x004400, scale: 1.0 }
  };

  var MILESTONES = [5, 10, 25, 50];
  var MILESTONE_BONUSES = {
    5:  { label: '+20 HP BONUS!',       type: 'heal',  value: 20 },
    10: { label: 'AMMO RESUPPLY!',      type: 'ammo',  value: 100 },
    25: { label: '+50 HP MEGA HEAL!',   type: 'heal',  value: 50 },
    50: { label: 'FULL RESUPPLY + HEAL!', type: 'both', value: 100 }
  };

  var RUSSIAN_NAMES = [
    'Dmitri Volkov', 'Ivan Petrov', 'Alexei Sokolov', 'Nikolai Kozlov',
    'Sergei Lebedev', 'Mikhail Novikov', 'Andrei Morozov', 'Pavel Volkov',
    'Viktor Fedorov', 'Boris Sobolev', 'Oleg Rykov', 'Yuri Popov',
    'Vasily Orlov', 'Gennady Ushakov', 'Roman Voronov', 'Maxim Fokin',
    'Timur Zhukov', 'Artem Belov', 'Evgeny Smirnov', 'Konstantin Grigoriev'
  ];

  var KILL_METHODS = [
    'Headshot', 'Double tap', 'Knife kill', 'Grenade blast',
    'Sniper shot', 'Suppressed pistol', 'Breaching charge',
    'Combat shotgun', 'Vehicle strike', 'Melee takedown'
  ];

  var ENEMY_TYPE_MAP = {
    soldier: 'BASIC', standard: 'BASIC', grunt: 'BASIC',
    heavy: 'ELITE', juggernaut: 'ELITE', armored: 'ELITE',
    boss: 'LEGENDARY', commander: 'LEGENDARY',
    medic: 'MEDIC', healer: 'MEDIC'
  };

  // ── State ────────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var activeTags = [];
  var totalCount = 0;
  var totalXP = 0;
  var logEntries = [];
  var logHideTimer = null;
  var initialized = false;
  var floatingTexts = [];
  var milestonesClaimed = {};

  // ── DOM Elements ─────────────────────────────────────────────────────────────
  var hudEl = null;
  var logPanelEl = null;
  var overlayEl = null;

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef) {
    if (initialized) return;
    scene = sceneRef || (window.GameManager && window.GameManager.scene) || null;
    camera = cameraRef || (window.GameManager && window.GameManager.camera) || null;
    _buildHUD();
    _buildLogPanel();
    _buildOverlay();
    _hookEnemyKill();
    _bindKeyboard();
    initialized = true;
  }

  function _hookEnemyKill() {
    var orig = window._onEnemyKilled;
    window._onEnemyKilled = function (enemyMesh, enemyType) {
      onEnemyKill(enemyMesh, enemyType);
      if (orig) orig(enemyMesh, enemyType);
    };
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'dtc-hud';
    hudEl.style.cssText = [
      'position:fixed', 'bottom:20px', 'right:20px',
      'background:rgba(0,0,0,0.65)', 'color:#e8e8e8',
      'font-family:monospace', 'font-size:13px',
      'padding:6px 12px', 'border-radius:4px',
      'border:1px solid rgba(255,255,255,0.15)',
      'z-index:9000', 'pointer-events:none',
      'text-shadow:0 0 4px #000'
    ].join(';');
    hudEl.textContent = 'TAGS: 0 [0 XP]';
    document.body.appendChild(hudEl);
  }

  function _updateHUD() {
    if (hudEl) hudEl.textContent = 'TAGS: ' + totalCount + ' [' + totalXP + ' XP]';
  }

  // ── Log Panel ────────────────────────────────────────────────────────────────
  function _buildLogPanel() {
    logPanelEl = document.createElement('div');
    logPanelEl.id = 'dtc-log';
    logPanelEl.style.cssText = [
      'position:fixed', 'right:-260px', 'top:50%',
      'transform:translateY(-50%)',
      'width:240px', 'background:rgba(0,0,0,0.75)',
      'color:#e8e8e8', 'font-family:monospace', 'font-size:12px',
      'padding:8px 10px', 'border-radius:6px 0 0 6px',
      'border:1px solid rgba(255,255,255,0.2)',
      'border-right:none', 'z-index:9001',
      'transition:right 0.35s ease',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(logPanelEl);
  }

  function _showLog() {
    logPanelEl.style.right = '0px';
    if (logHideTimer) clearTimeout(logHideTimer);
    logHideTimer = setTimeout(function () {
      logPanelEl.style.right = '-260px';
    }, LOG_DISPLAY_TIME);
  }

  function _renderLog() {
    var html = '<div style="color:#aaa;margin-bottom:4px;font-size:11px;">RECENT TAGS</div>';
    var start = Math.max(0, logEntries.length - MAX_LOG_ENTRIES);
    for (var i = logEntries.length - 1; i >= start; i--) {
      var e = logEntries[i];
      var col = e.tagType === 'LEGENDARY' ? '#ff6633' : (e.tagType === 'ELITE' ? '#FFD700' : (e.tagType === 'MEDIC' ? '#88ff88' : '#cccccc'));
      html += '<div style="margin:2px 0;padding:2px 4px;background:rgba(255,255,255,0.05);border-radius:2px;">';
      html += '<span style="color:' + col + '">[' + e.tagType + ']</span> ';
      html += '<span>+' + e.xp + ' XP</span>';
      html += '</div>';
    }
    logPanelEl.innerHTML = html;
    _showLog();
  }

  // ── Overlay ──────────────────────────────────────────────────────────────────
  function _buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'dtc-overlay';
    overlayEl.style.cssText = [
      'position:fixed', 'top:30%', 'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace', 'font-size:28px', 'font-weight:bold',
      'color:#FFD700', 'text-shadow:0 0 12px #FF8800, 0 0 4px #000',
      'z-index:9999', 'pointer-events:none',
      'opacity:0', 'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(overlayEl);
  }

  function _showOverlay(text, duration) {
    overlayEl.textContent = text;
    overlayEl.style.opacity = '1';
    setTimeout(function () {
      overlayEl.style.opacity = '0';
    }, duration || 2500);
  }

  // ── Floating Text ─────────────────────────────────────────────────────────────
  function _spawnFloatingText(text, worldPos, color) {
    if (!camera) return;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'font-family:monospace',
      'font-size:14px', 'font-weight:bold',
      'color:' + (color || '#FFD700'),
      'text-shadow:0 0 4px #000',
      'pointer-events:none', 'z-index:9500',
      'transition:opacity 1.2s, top 1.2s'
    ].join(';');
    el.textContent = text;

    var screenPos = _worldToScreen(worldPos);
    el.style.left = screenPos.x + 'px';
    el.style.top = screenPos.y + 'px';
    el.style.opacity = '1';
    document.body.appendChild(el);

    var entry = { el: el, born: Date.now(), startY: screenPos.y };
    floatingTexts.push(entry);

    setTimeout(function () {
      el.style.opacity = '0';
      el.style.top = (screenPos.y - 60) + 'px';
    }, 50);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      var idx = floatingTexts.indexOf(entry);
      if (idx !== -1) floatingTexts.splice(idx, 1);
    }, 1400);
  }

  function _worldToScreen(worldPos) {
    if (!camera || !worldPos) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var THREE = window.THREE;
    if (!THREE) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var vec = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    vec.project(camera);
    return {
      x: Math.round((vec.x + 1) / 2 * window.innerWidth),
      y: Math.round((-vec.y + 1) / 2 * window.innerHeight)
    };
  }

  // ── Tag Mesh Spawning ─────────────────────────────────────────────────────────
  function _resolveTagType(enemyType) {
    if (!enemyType) return 'BASIC';
    var key = String(enemyType).toLowerCase();
    return ENEMY_TYPE_MAP[key] || 'BASIC';
  }

  function _spawnTag(position, tagTypeName) {
    var THREE = window.THREE;
    if (!THREE || !scene) return null;

    var def = TAG_TYPES[tagTypeName] || TAG_TYPES.BASIC;

    var geo = new THREE.BoxGeometry(0.15 * def.scale, 0.001, 0.2 * def.scale);
    var mat = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.emissive,
      metalness: 0.9,
      roughness: 0.2
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position.x, position.y + 0.05, position.z);
    mesh.rotation.x = 0.1;

    // Medic tag gets white cross marking via a second thin mesh
    if (tagTypeName === 'MEDIC') {
      var crossGeoH = new THREE.BoxGeometry(0.08, 0.002, 0.02);
      var crossGeoV = new THREE.BoxGeometry(0.02, 0.002, 0.08);
      var crossMat = new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.1, roughness: 0.5 });
      var crossH = new THREE.Mesh(crossGeoH, crossMat);
      var crossV = new THREE.Mesh(crossGeoV, crossMat);
      crossH.position.y = 0.002;
      crossV.position.y = 0.002;
      mesh.add(crossH);
      mesh.add(crossV);
    }

    scene.add(mesh);

    var tagData = {
      mesh: mesh,
      tagType: tagTypeName,
      def: def,
      born: Date.now(),
      position: position,
      collected: false,
      identified: false,
      spinAngle: 0,
      bobPhase: Math.random() * Math.PI * 2
    };
    activeTags.push(tagData);
    return tagData;
  }

  // ── Flash pickup effect ───────────────────────────────────────────────────────
  function _flashPickup(tagData) {
    var THREE = window.THREE;
    if (!THREE || !scene) return;
    var geo = new THREE.SphereGeometry(0.3, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 });
    var flash = new THREE.Mesh(geo, mat);
    flash.position.copy(tagData.mesh.position);
    scene.add(flash);
    var start = Date.now();
    var interval = setInterval(function () {
      var t = (Date.now() - start) / 400;
      if (t >= 1) {
        clearInterval(interval);
        scene.remove(flash);
        geo.dispose();
        mat.dispose();
        return;
      }
      mat.opacity = 0.8 * (1 - t);
      flash.scale.setScalar(1 + t * 2);
    }, 16);
  }

  // ── Particle fade on despawn ──────────────────────────────────────────────────
  function _particleFade(position) {
    var THREE = window.THREE;
    if (!THREE || !scene) return;
    var count = 8;
    var particles = [];
    for (var i = 0; i < count; i++) {
      var geo = new THREE.SphereGeometry(0.02, 4, 4);
      var mat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.7 });
      var p = new THREE.Mesh(geo, mat);
      p.position.set(
        position.x + (Math.random() - 0.5) * 0.2,
        position.y + Math.random() * 0.1,
        position.z + (Math.random() - 0.5) * 0.2
      );
      p._vel = {
        x: (Math.random() - 0.5) * 0.02,
        y: 0.015 + Math.random() * 0.02,
        z: (Math.random() - 0.5) * 0.02
      };
      scene.add(p);
      particles.push({ mesh: p, mat: mat, geo: geo });
    }
    var start = Date.now();
    var interval = setInterval(function () {
      var t = (Date.now() - start) / 600;
      if (t >= 1) {
        clearInterval(interval);
        for (var j = 0; j < particles.length; j++) {
          scene.remove(particles[j].mesh);
          particles[j].geo.dispose();
          particles[j].mat.dispose();
        }
        return;
      }
      for (var k = 0; k < particles.length; k++) {
        var pp = particles[k];
        pp.mesh.position.x += pp.mesh._vel.x;
        pp.mesh.position.y += pp.mesh._vel.y;
        pp.mesh.position.z += pp.mesh._vel.z;
        pp.mat.opacity = 0.7 * (1 - t);
      }
    }, 16);
  }

  // ── Collection logic ──────────────────────────────────────────────────────────
  function _collectTag(tagData) {
    if (tagData.collected) return;
    tagData.collected = true;

    _flashPickup(tagData);
    scene.remove(tagData.mesh);
    if (tagData.mesh.geometry) tagData.mesh.geometry.dispose();
    if (tagData.mesh.material) tagData.mesh.material.dispose();

    totalCount++;
    totalXP += tagData.def.xp;
    _updateHUD();

    _spawnFloatingText('+' + tagData.def.xp + ' XP', tagData.position,
      tagData.tagType === 'LEGENDARY' ? '#ff6633' : (tagData.tagType === 'ELITE' ? '#FFD700' : '#88ff88'));

    logEntries.push({ tagType: tagData.tagType, xp: tagData.def.xp });
    _renderLog();

    _checkMilestones();
  }

  // ── Milestones ────────────────────────────────────────────────────────────────
  function _checkMilestones() {
    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (totalCount >= m && !milestonesClaimed[m]) {
        milestonesClaimed[m] = true;
        _triggerMilestone(m);
      }
    }
  }

  function _triggerMilestone(milestone) {
    var bonus = MILESTONE_BONUSES[milestone];
    if (!bonus) return;

    _showOverlay('*** ' + milestone + ' TAGS! ' + bonus.label + ' ***', 3000);

    if (bonus.type === 'heal' || bonus.type === 'both') {
      if (window.GameManager && window.GameManager.healPlayer) {
        window.GameManager.healPlayer(bonus.value);
      } else if (window.playerHealth !== undefined) {
        window.playerHealth = Math.min(100, (window.playerHealth || 0) + bonus.value);
      }
    }
    if (bonus.type === 'ammo' || bonus.type === 'both') {
      if (window.GameManager && window.GameManager.resupplyAmmo) {
        window.GameManager.resupplyAmmo();
      } else if (window.playerAmmo !== undefined) {
        window.playerAmmo = Math.min(999, (window.playerAmmo || 0) + bonus.value);
      }
    }
  }

  // ── Identify (F key) ──────────────────────────────────────────────────────────
  function _identifyNearbyTag() {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    var nearest = null;
    var nearestDist = IDENTIFY_RADIUS;
    for (var i = 0; i < activeTags.length; i++) {
      var tag = activeTags[i];
      if (tag.collected) continue;
      var dist = _dist3(playerPos, tag.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = tag;
      }
    }
    if (!nearest) return;

    var name = RUSSIAN_NAMES[Math.floor(Math.random() * RUSSIAN_NAMES.length)];
    var unit = 'Unit #' + (Math.floor(Math.random() * 900) + 100);
    var method = KILL_METHODS[Math.floor(Math.random() * KILL_METHODS.length)];
    var info = name + ' | ' + unit + ' | KIA: ' + method;

    nearest.identified = true;
    _spawnFloatingText(info, nearest.position, '#00ffff');
    if (!nearest.identified) {
      _spawnFloatingText('[' + nearest.tagType + '] ' + info, nearest.position, '#00ffff');
    }
  }

  function _bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        _identifyNearbyTag();
      }
    });
  }

  // ── Player position ───────────────────────────────────────────────────────────
  function _getPlayerPos() {
    if (window.GameManager && window.GameManager.playerPosition) {
      return window.GameManager.playerPosition;
    }
    if (camera) {
      return camera.position;
    }
    return null;
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── Update loop ───────────────────────────────────────────────────────────────
  function update(delta) {
    if (!initialized) return;
    var now = Date.now();
    var playerPos = _getPlayerPos();
    var dt = delta || 0.016;

    for (var i = activeTags.length - 1; i >= 0; i--) {
      var tag = activeTags[i];
      if (tag.collected) {
        activeTags.splice(i, 1);
        continue;
      }

      // Spin + bob animation
      tag.spinAngle += dt * 1.2;
      tag.bobPhase += dt * 2.0;
      tag.mesh.rotation.y = tag.spinAngle;
      tag.mesh.position.y = tag.position.y + 0.05 + Math.sin(tag.bobPhase) * 0.03;

      // Auto-collect if player nearby
      if (playerPos) {
        var dist = _dist3(playerPos, tag.position);
        if (dist < COLLECT_RADIUS) {
          _collectTag(tag);
          activeTags.splice(i, 1);
          continue;
        }
      }

      // Despawn after DESPAWN_TIME
      if (now - tag.born > DESPAWN_TIME) {
        _particleFade(tag.position);
        scene.remove(tag.mesh);
        if (tag.mesh.geometry) tag.mesh.geometry.dispose();
        if (tag.mesh.material) tag.mesh.material.dispose();
        activeTags.splice(i, 1);
      }
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function onEnemyKill(enemyMesh, enemyType) {
    if (!initialized) {
      // Auto-init with whatever is available
      init();
    }
    if (!scene) {
      scene = (window.GameManager && window.GameManager.scene) || null;
    }
    if (!camera) {
      camera = (window.GameManager && window.GameManager.camera) || null;
    }
    if (!scene) return;

    var position = { x: 0, y: 0, z: 0 };
    if (enemyMesh && enemyMesh.position) {
      position = { x: enemyMesh.position.x, y: enemyMesh.position.y, z: enemyMesh.position.z };
    }

    var tagTypeName = _resolveTagType(enemyType);
    _spawnTag(position, tagTypeName);
  }

  function getCount() {
    return totalCount;
  }

  function reset() {
    for (var i = 0; i < activeTags.length; i++) {
      var tag = activeTags[i];
      if (scene) scene.remove(tag.mesh);
      if (tag.mesh.geometry) tag.mesh.geometry.dispose();
      if (tag.mesh.material) tag.mesh.material.dispose();
    }
    activeTags = [];
    totalCount = 0;
    totalXP = 0;
    logEntries = [];
    milestonesClaimed = {};
    _updateHUD();
    if (logPanelEl) logPanelEl.innerHTML = '';
    if (logPanelEl) logPanelEl.style.right = '-260px';
  }

  return {
    init: init,
    update: update,
    onEnemyKill: onEnemyKill,
    getCount: getCount,
    reset: reset
  };
})();
