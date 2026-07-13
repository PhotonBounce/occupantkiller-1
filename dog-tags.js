// dog-tags.js — Collectible enemy dog tags with score bonuses and milestone badges
// Standalone module, no game-manager.js changes required (uses window hooks).
// IIFE pattern, all var (never let/const).

window.DogTags = (function() {
  'use strict';

  var NAMES = ['IVANOV A.', 'PETROV D.', 'SMIRNOV K.', 'VOLKOV M.', 'KOZLOV V.',
               'MOROZOV I.', 'SOKOLOV P.', 'LEBEDEV S.', 'NOVIKOV R.', 'FEDOROV T.',
               'ROMANOV E.', 'GRIGORIEV B.', 'KUZNETSOV N.', 'MAKAROV O.', 'ALEKSEEV G.'];
  var UNITS = ['1st Gd.TD', '5th CAA', '8th CAA', '58th CA', '41st CA',
               '20th CAA', '35th CAA', 'VDV 7th', 'VDV 76th', 'Naval Inf'];

  var MILESTONES = [
    { count: 10,  badge: 'SCAVENGER' },
    { count: 25,  badge: 'COLLECTOR' },
    { count: 50,  badge: "LIBERATOR'S TROPHY" },
    { count: 100, badge: 'UNDERTAKER' }
  ];

  var _scene = null;
  var _activeTags = [];
  var _totalTagsCollected = 0;
  var _initialized = false;
  var _counterEl = null;

  // --- Canvas texture helper ---
  function _makeTextTexture(name, unit) {
    var canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 96;
    var ctx = canvas.getContext('2d');

    // Dark metallic background
    ctx.fillStyle = '#a0a8a8';
    ctx.fillRect(0, 0, 64, 96);

    // Subtle gradient
    var grad = ctx.createLinearGradient(0, 0, 64, 96);
    grad.addColorStop(0, 'rgba(200,210,210,0.5)');
    grad.addColorStop(1, 'rgba(140,150,150,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 96);

    // Engraved border
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, 58, 90);

    // Star symbol
    ctx.fillStyle = '#666';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★', 32, 18);

    // Name text
    ctx.fillStyle = '#444';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    var nameShort = name.length > 10 ? name.substring(0, 10) : name;
    ctx.fillText(nameShort, 32, 36);

    // Separator line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, 44);
    ctx.lineTo(56, 44);
    ctx.stroke();

    // Unit text
    ctx.fillStyle = '#555';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(unit, 32, 56);

    // Serial number placeholder
    ctx.fillStyle = '#666';
    ctx.font = '6px monospace';
    ctx.fillText('RF-' + Math.floor(Math.random() * 99999), 32, 68);

    // Blood type placeholder
    ctx.fillText('A+', 32, 80);

    var texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // --- Build tag mesh group ---
  function _buildTagMesh(name, unit) {
    var group = new THREE.Group();

    // Plaque
    var plaqueGeo = new THREE.BoxGeometry(0.15, 0.20, 0.02);
    var texture = _makeTextTexture(name, unit);
    var plaqueMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.1,
      map: texture,
      transparent: true,
      opacity: 1.0
    });
    var plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    group.add(plaque);

    // Chain link loop at top
    var ringGeo = new THREE.TorusGeometry(0.025, 0.007, 6, 8);
    var ringMat = new THREE.MeshStandardMaterial({
      color: 0xbbbbbb,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 1.0
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.115, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Point light — subtle glint
    var light = new THREE.PointLight(0xffffff, 0.5, 1.5);
    light.position.set(0, 0, 0.1);
    group.add(light);

    // Store references on group for animation
    group.userData.plaqueMat = plaqueMat;
    group.userData.ringMat = ringMat;

    return group;
  }

  // --- Metallic clink SFX ---
  function _playClinkSFX() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // AudioContext unavailable — silent fail
    }
  }

  // --- Update counter HUD ---
  function _updateCounter() {
    if (!_counterEl) return;
    if (_totalTagsCollected === 0) {
      _counterEl.style.display = 'none';
    } else {
      _counterEl.style.display = 'block';
      _counterEl.textContent = '🏷️ TAGS: ' + _totalTagsCollected;
    }
  }

  // --- Show toast ---
  function _showToast(msg, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast(msg, color || '#cccccc');
        return;
      }
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup(msg, color || '#cccccc');
      }
    } catch (e) {}
  }

  // --- Show achievement notification ---
  function _showAchievement(badge) {
    try {
      var achEl = document.getElementById('achievement-popup');
      var nameEl = document.getElementById('achievement-name');
      if (achEl && nameEl) {
        nameEl.textContent = '🏷️ ' + badge;
        achEl.style.display = 'block';
        setTimeout(function() { achEl.style.display = 'none'; }, 3500);
      }
    } catch (e) {}
    _showToast('🏆 BADGE UNLOCKED: ' + badge, '#ffd700');
  }

  // --- Check milestones ---
  function _checkMilestones(count) {
    for (var i = 0; i < MILESTONES.length; i++) {
      if (count === MILESTONES[i].count) {
        _showAchievement(MILESTONES[i].badge);
        break;
      }
    }
  }

  // --- Collect a tag ---
  function _collectTag(tagObj) {
    tagObj.collected = true;

    _totalTagsCollected++;
    _checkMilestones(_totalTagsCollected);

    var bonus = tagObj.isBoss ? 500 : 150;
    // Add score via globals
    try {
      if (typeof player !== 'undefined' && player !== null) {
        player.score = (player.score || 0) + bonus;
        if (typeof HUD !== 'undefined' && HUD.setScore) HUD.setScore(player.score);
      }
    } catch (e) {}

    var toastMsg = '🏷️ DOG TAG — ' + tagObj.name + ' // ' + tagObj.unit + ' [+' + bonus + ']';
    _showToast(toastMsg, '#d4d4ff');

    _playClinkSFX();
    _updateCounter();

    // Remove mesh from scene
    if (_scene && tagObj.group) {
      _scene.remove(tagObj.group);
    }
  }

  // --- Remove tag without collecting ---
  function _removeTag(tagObj) {
    if (_scene && tagObj.group) {
      _scene.remove(tagObj.group);
    }
    tagObj.removed = true;
  }

  // ==============================
  // Public API
  // ==============================

  function init() {
    if (_initialized) return;
    _initialized = true;

    // Find scene from globals
    _scene = window._scene || (typeof scene !== 'undefined' ? scene : null);

    // Create counter HUD element
    _counterEl = document.getElementById('dogTagCounter');
    if (!_counterEl) {
      _counterEl = document.createElement('div');
      _counterEl.id = 'dogTagCounter';
      _counterEl.style.cssText = [
        'position:fixed',
        'top:134px',
        'right:12px',
        'background:rgba(0,0,0,0.6)',
        'border:1px solid rgba(200,200,220,0.4)',
        'color:#d4d4ff',
        'padding:3px 10px',
        'border-radius:4px',
        'font-size:11px',
        'font-family:monospace',
        'z-index:200',
        'pointer-events:none',
        'display:none'
      ].join(';');
      document.body.appendChild(_counterEl);
    }

    // Set up global hook so game-manager can call us on enemy kill
    window._onEnemyKillForDogTags = function(pos, type) {
      DogTags.spawnTag(pos, type);
    };
  }

  function spawnTag(enemyPos, enemyType) {
    // Refresh scene ref if not yet set
    if (!_scene) {
      _scene = window._scene || (typeof scene !== 'undefined' ? scene : null);
    }
    if (!_scene) return;
    if (!enemyPos) return;

    // Determine if boss
    var isBoss = false;
    if (enemyType) {
      var typeStr = String(enemyType).toUpperCase();
      if (typeStr === 'BOSS' || typeStr.indexOf('BOSS') !== -1) {
        isBoss = true;
      }
    }

    // 40% base chance, 100% for boss
    if (!isBoss && Math.random() > 0.40) return;

    // Random name and unit
    var name = NAMES[Math.floor(Math.random() * NAMES.length)];
    var unit = UNITS[Math.floor(Math.random() * UNITS.length)];

    // Position with random offset
    var spawnX = enemyPos.x + (Math.random() * 0.6 - 0.3);
    var spawnY = enemyPos.y + 1.5;
    var spawnZ = enemyPos.z + (Math.random() * 0.6 - 0.3);

    var group = _buildTagMesh(name, unit);
    group.position.set(spawnX, spawnY, spawnZ);
    _scene.add(group);

    var tagObj = {
      group: group,
      name: name,
      unit: unit,
      isBoss: isBoss,
      velY: 1.5,
      onGround: false,
      bounced: false,
      collected: false,
      removed: false,
      age: 0,
      blinkPhase: Math.random() * Math.PI * 2
    };

    _activeTags.push(tagObj);
  }

  function update(delta) {
    if (!delta || delta <= 0) return;

    // Get player position for proximity check
    var playerPos = null;
    try {
      if (typeof player !== 'undefined' && player && player.position) {
        playerPos = player.position;
      }
    } catch (e) {}

    var GRAVITY = 9.8;
    var GROUND_Y = 0.01; // approximate ground level
    var COLLECT_DIST = 0.8;
    var DESPAWN_TIME = 30.0;
    var BLINK_FREQ = 1.0; // Hz
    var ROTATE_SPEED = 0.5; // rad/s

    var toRemove = [];

    for (var i = 0; i < _activeTags.length; i++) {
      var tag = _activeTags[i];
      if (tag.collected || tag.removed) {
        toRemove.push(i);
        continue;
      }

      tag.age += delta;

      // Despawn after 30 seconds
      if (tag.age >= DESPAWN_TIME) {
        _removeTag(tag);
        toRemove.push(i);
        continue;
      }

      var group = tag.group;
      if (!group) { toRemove.push(i); continue; }

      // --- Physics: gravity + bounce ---
      if (!tag.onGround) {
        tag.velY -= GRAVITY * delta;
        group.position.y += tag.velY * delta;

        // Ground contact
        if (group.position.y <= GROUND_Y) {
          group.position.y = GROUND_Y;
          if (!tag.bounced) {
            // Bounce once
            tag.velY = -tag.velY * 0.3;
            tag.bounced = true;
          } else {
            // Settle on ground
            tag.velY = 0;
            tag.onGround = true;
          }
        }
      }

      // --- Slow rotation on ground ---
      if (tag.onGround) {
        group.rotation.y += ROTATE_SPEED * delta;
      }

      // --- Opacity blink (0.7 to 1.0 at 1Hz) ---
      tag.blinkPhase += BLINK_FREQ * Math.PI * 2 * delta;
      var opacityValue = 0.85 + 0.15 * Math.sin(tag.blinkPhase);
      var plaqueMat = group.userData.plaqueMat;
      var ringMat = group.userData.ringMat;
      if (plaqueMat) plaqueMat.opacity = opacityValue;
      if (ringMat) ringMat.opacity = opacityValue;

      // --- Player proximity check ---
      if (playerPos && tag.onGround) {
        var dx = group.position.x - playerPos.x;
        var dy = group.position.y - playerPos.y;
        var dz = group.position.z - playerPos.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= COLLECT_DIST) {
          _collectTag(tag);
          toRemove.push(i);
          continue;
        }
      }
    }

    // Remove collected/despawned entries (iterate in reverse to preserve indices)
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _activeTags.splice(toRemove[j], 1);
    }
  }

  function clear() {
    for (var i = 0; i < _activeTags.length; i++) {
      var tag = _activeTags[i];
      if (!tag.collected && !tag.removed && _scene && tag.group) {
        _scene.remove(tag.group);
      }
    }
    _activeTags = [];
  }

  function reset() {
    clear();
    _totalTagsCollected = 0;
    _updateCounter();
  }

  function getCount() {
    return _totalTagsCollected;
  }

  // --- Auto-init when DOM is ready ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); });
  } else {
    // Defer slightly to let game-manager set up _scene first
    setTimeout(function() { init(); }, 100);
  }

  return { init: init, spawnTag: spawnTag, update: update, clear: clear, reset: reset, getCount: getCount };
})();
