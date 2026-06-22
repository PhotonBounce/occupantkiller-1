/* ───────────────────────────────────────────────────────────────────────
   SURRENDER SYSTEM — wounded enemies (low HP) have a chance to surrender
   Player can execute (for points) or spare (for bonus XP + karma)
   ─────────────────────────────────────────────────────────────────────── */
window.SurrenderSystem = (function () {
  'use strict';

  var _scene = null;
  var _surrenderedEnemies = [];   // list of { enemy, flagMesh, flagTime, speechMesh, promptVisible }
  var _promptVisible = false;
  var _promptEnemy = null;
  var _keysDown = {};

  /* ── Key listener ─────────────────────────────────────────────────── */
  function _onKeyDown(evt) {
    _keysDown[evt.key.toUpperCase()] = true;
  }
  function _onKeyUp(evt) {
    _keysDown[evt.key.toUpperCase()] = false;
  }

  /* ── DOM helpers ──────────────────────────────────────────────────── */
  function _getOrCreate(id, tag, styles) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag || 'div');
      el.id = id;
      Object.assign(el.style, styles || {});
      document.body.appendChild(el);
    }
    return el;
  }

  function _createSurrenderPrompt() {
    var el = _getOrCreate('surrenderPrompt', 'div', {
      position: 'fixed',
      bottom: '22%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.82)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '15px',
      padding: '10px 22px',
      borderRadius: '8px',
      border: '1.5px solid #ffd700',
      zIndex: '5000',
      display: 'none',
      letterSpacing: '1.5px',
      textAlign: 'center',
      pointerEvents: 'none'
    });
    el.innerHTML = '<span style="color:#ff4444">E — EXECUTE</span>&nbsp;&nbsp;|&nbsp;&nbsp;<span style="color:#44ff88">F — SPARE</span>';
    return el;
  }

  function _createKarmaBar() {
    var el = _getOrCreate('karmaBar', 'div', {
      position: 'fixed',
      top: '8px',
      left: '70px',
      zIndex: '4900',
      display: 'none',
      fontFamily: 'monospace',
      fontSize: '10px',
      background: 'rgba(0,0,0,0.7)',
      border: '1px solid #555',
      borderRadius: '5px',
      padding: '3px 8px',
      minWidth: '160px',
      pointerEvents: 'none'
    });
    el.innerHTML =
      '<div style="display:flex;gap:4px;align-items:center">' +
        '<span style="color:#ff4444;font-size:9px">WAR CRIMES</span>' +
        '<div id="karmaBarTrack" style="flex:1;height:7px;background:#222;border-radius:3px;overflow:hidden;position:relative">' +
          '<div id="karmaBarRed"  style="position:absolute;left:0;top:0;bottom:0;background:#ff4444;width:0%;transition:width 0.3s"></div>' +
          '<div id="karmaBarGreen" style="position:absolute;right:0;top:0;bottom:0;background:#44ff88;width:0%;transition:width 0.3s"></div>' +
        '</div>' +
        '<span style="color:#44ff88;font-size:9px">MERCY</span>' +
      '</div>';
    return el;
  }

  function _updateKarmaBar() {
    var crimes = window._warCrimesCount || 0;
    var mercy  = window._mercyCount    || 0;
    if (crimes === 0 && mercy === 0) {
      var bar = document.getElementById('karmaBar');
      if (bar) bar.style.display = 'none';
      return;
    }
    var bar = document.getElementById('karmaBar');
    if (bar) bar.style.display = 'block';

    var total = crimes + mercy;
    var redPct   = Math.round((crimes / total) * 100);
    var greenPct = Math.round((mercy  / total) * 100);
    var redEl   = document.getElementById('karmaBarRed');
    var greenEl = document.getElementById('karmaBarGreen');
    if (redEl)   redEl.style.width   = redPct   + '%';
    if (greenEl) greenEl.style.width = greenPct + '%';
  }

  /* ── Show toast (reuse HUD.showToast if available, else roll our own) */
  function _toast(msg, duration, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast(msg, duration || 2000, color || '#ffd700');
        return;
      }
    } catch (eT) {}
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:38%;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.8);color:' + (color || '#ffd700') + ';' +
      'font-family:monospace;font-size:16px;padding:8px 20px;border-radius:6px;' +
      'z-index:6000;pointer-events:none;transition:opacity 0.4s';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 500); }, duration || 2000);
  }

  /* ── Create white flag mesh ────────────────────────────────────────── */
  function _createWhiteFlag() {
    try {
      var flagGeo  = new THREE.PlaneGeometry(0.3, 0.4);
      var flagMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      var flagMesh = new THREE.Mesh(flagGeo, flagMat);
      return flagMesh;
    } catch (e) { return null; }
  }

  /* ── Create speech-bubble "!" sprite above enemy head ─────────────── */
  function _createSpeechBubble(enemyMesh) {
    try {
      var canvas = document.createElement('canvas');
      canvas.width  = 128;
      canvas.height = 64;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(4, 4, 120, 46, 8);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(48, 50); ctx.lineTo(56, 60); ctx.lineTo(68, 50);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('НЕОК!', 64, 27); // НЕЙOK
      var tex = new THREE.CanvasTexture(canvas);
      var mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
      var sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.8, 0.4, 1);
      return sprite;
    } catch (e) { return null; }
  }

  /* ── Attach surrender visuals to enemy ────────────────────────────── */
  function _attachSurrenderVisuals(enemy) {
    // Raise arm meshes if accessible
    try {
      if (enemy.mesh && enemy.mesh.children && enemy.mesh.children.length > 0) {
        enemy.mesh.children.forEach(function (child, idx) {
          // Try to identify arms by position (arms are usually small, near sides)
          // Use first two small-ish children as arms if parts map isn't available
        });
      }
      // Use userData.parts if available (standard enemy mesh structure)
      var parts = (enemy.mesh && enemy.mesh.userData) ? enemy.mesh.userData.parts : null;
      if (parts) {
        if (parts[5]) { parts[5].rotation.x = -2.8; parts[5].rotation.z =  0.2; }
        if (parts[6]) { parts[6].rotation.x = -2.8; parts[6].rotation.z = -0.2; }
      }
    } catch (eArm) {}

    // White flag above enemy
    var flagMesh = _createWhiteFlag();
    if (flagMesh && enemy.mesh && _scene) {
      flagMesh.position.copy(enemy.mesh.position);
      flagMesh.position.y += 2.4;
      _scene.add(flagMesh);
    }

    // Speech bubble
    var speechMesh = _createSpeechBubble(enemy.mesh);
    if (speechMesh && enemy.mesh && _scene) {
      speechMesh.position.copy(enemy.mesh.position);
      speechMesh.position.y += 3.0;
      _scene.add(speechMesh);
    }

    return { flagMesh: flagMesh, speechMesh: speechMesh, flagTime: 0, promptVisible: false };
  }

  /* ── Kill enemy via normal death pipeline ─────────────────────────── */
  function _killEnemy(enemy) {
    try {
      // Mark dead
      enemy.alive = false;
      enemy.hp    = 0;
      // Remove visuals immediately
      if (_scene && enemy.mesh) {
        _scene.remove(enemy.mesh);
      }
      // Remove HP bar group if present
      if (_scene && enemy.hpBar && enemy.hpBar.group) {
        _scene.remove(enemy.hpBar.group);
      }
    } catch (eK) {}
  }

  /* ── Remove entry from _surrenderedEnemies array ──────────────────── */
  function _removeSurrenderEntry(entry) {
    if (!entry) return;
    try {
      if (_scene && entry.flagMesh)   { _scene.remove(entry.flagMesh);   }
      if (_scene && entry.speechMesh) { _scene.remove(entry.speechMesh); }
    } catch (eR) {}
    for (var i = 0; i < _surrenderedEnemies.length; i++) {
      if (_surrenderedEnemies[i] === entry) {
        _surrenderedEnemies.splice(i, 1);
        break;
      }
    }
  }

  /* ── Execute a surrendered enemy ──────────────────────────────────── */
  function _executeEnemy(entry) {
    if (!entry || !entry.enemy) return;
    var enemy = entry.enemy;

    _killEnemy(enemy);
    _removeSurrenderEntry(entry);

    // Score bonus
    if (typeof player !== 'undefined') {
      player.score = (player.score || 0) + 300;
      try { if (typeof HUD !== 'undefined' && HUD.updateScore) HUD.updateScore(player.score); } catch (eS) {}
    }
    _toast('⚡ EXECUTED', 1800, '#ff4444');

    // Karma — war crimes
    window._warCrimesCount = (window._warCrimesCount || 0) + 1;
    window._enemyRageBonus = Math.min(0.5, (window._warCrimesCount || 0) * 0.05);

    if (window._warCrimesCount >= 5) {
      _toast('⚠ WAR CRIMES ALERT — Enemy resistance increased 20%', 3500, '#ff2200');
    }
    _updateKarmaBar();
  }

  /* ── Spare a surrendered enemy ────────────────────────────────────── */
  function _spareEnemy(entry) {
    if (!entry || !entry.enemy) return;
    var enemy = entry.enemy;

    // Drop weapon
    try {
      if (window.ScavengeSystem && ScavengeSystem.spawnWeaponDrop && enemy.mesh) {
        ScavengeSystem.spawnWeaponDrop(enemy.mesh.position, null, 15);
      }
    } catch (eDrop) {}

    // Score + XP
    if (typeof player !== 'undefined') {
      player.score = (player.score || 0) + 500;
      try { if (typeof HUD !== 'undefined' && HUD.updateScore) HUD.updateScore(player.score); } catch (eS) {}
    }
    try {
      if (typeof window.Progression_addKillXP === 'function') {
        window.Progression_addKillXP(200);
      } else if (typeof Progression !== 'undefined' && Progression.addXP) {
        Progression.addXP(200, 'spare');
      }
    } catch (eXP) {}

    _toast('🤝 SPARED — +500 SCORE +200 XP', 2200, '#44ff88');

    // Karma — mercy
    window._mercyCount = (window._mercyCount || 0) + 1;

    // Enemy lies down — make inactive
    enemy.alive = false;
    enemy.hp = 0;
    try {
      if (enemy.mesh) {
        enemy.mesh.rotation.z = Math.PI / 2; // lie flat
        enemy.mesh.position.y -= 0.4;
      }
    } catch (eL) {}

    _removeSurrenderEntry(entry);
    _updateKarmaBar();
  }

  /* ── Find surrender entry by enemy ───────────────────────────────── */
  function _findEntry(enemy) {
    for (var i = 0; i < _surrenderedEnemies.length; i++) {
      if (_surrenderedEnemies[i].enemy === enemy) return _surrenderedEnemies[i];
    }
    return null;
  }

  /* ── PUBLIC: init ─────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene;
    _surrenderedEnemies = [];
    _keysDown = {};
    _promptVisible = false;
    _promptEnemy = null;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _createSurrenderPrompt();
    _createKarmaBar();
    _updateKarmaBar();
  }

  /* ── PUBLIC: checkSurrender — call after enemy takes damage ──────── */
  function checkSurrender(enemy) {
    if (!enemy || !enemy.alive) return;
    if (enemy.isBoss) return;                             // bosses never surrender
    if (enemy._surrendered) return;                       // already surrendered
    if (enemy._surrenderChecked) return;                  // only one chance per enemy

    var threshold = (enemy.maxHp || 100) * 0.15;
    if (enemy.hp > threshold) return;
    if (enemy.hp <= 0) return;

    // 35% chance to surrender (checked once)
    enemy._surrenderChecked = true;
    if (Math.random() > 0.35) return;

    // Surrender!
    enemy._surrendered = true;
    enemy.surrendered  = true;   // for enemies.js compatibility check
    enemy.speed        = 0;      // freeze movement

    var visuals = _attachSurrenderVisuals(enemy);
    _surrenderedEnemies.push({
      enemy:       enemy,
      flagMesh:    visuals.flagMesh,
      speechMesh:  visuals.speechMesh,
      flagTime:    0,
      promptVisible: false
    });
  }

  /* ── PUBLIC: update — wave white flag, check proximity, handle E/F ── */
  function update(delta) {
    if (!delta) delta = 0.016;

    var playerPos = null;
    try {
      if (typeof player !== 'undefined' && player && player.position) {
        playerPos = player.position;
      }
    } catch (eP) {}

    var promptEl = document.getElementById('surrenderPrompt');
    var nearestEntry = null;
    var nearestDist  = Infinity;

    for (var i = _surrenderedEnemies.length - 1; i >= 0; i--) {
      var entry = _surrenderedEnemies[i];
      if (!entry || !entry.enemy) { _surrenderedEnemies.splice(i, 1); continue; }
      var e = entry.enemy;

      // If enemy died externally (e.g. grenade), clean up
      if (!e.alive && !e._surrendered) {
        _removeSurrenderEntry(entry);
        continue;
      }

      entry.flagTime = (entry.flagTime || 0) + delta;

      // Wave the flag: sin oscillation on Y
      if (entry.flagMesh && e.mesh) {
        entry.flagMesh.position.copy(e.mesh.position);
        entry.flagMesh.position.y += 2.4 + Math.sin(entry.flagTime * 4) * 0.1;
        entry.flagMesh.rotation.z  = Math.sin(entry.flagTime * 6) * 0.18;
      }

      // Keep speech bubble above head
      if (entry.speechMesh && e.mesh) {
        entry.speechMesh.position.copy(e.mesh.position);
        entry.speechMesh.position.y += 3.0;
      }

      // Keep hands raised (re-apply in case of frame reset)
      try {
        var parts = (e.mesh && e.mesh.userData) ? e.mesh.userData.parts : null;
        if (parts) {
          if (parts[5]) { parts[5].rotation.x = -2.8; parts[5].rotation.z =  0.2; }
          if (parts[6]) { parts[6].rotation.x = -2.8; parts[6].rotation.z = -0.2; }
        }
      } catch (eArm) {}

      // Proximity check for prompt
      if (playerPos && e.mesh) {
        var dist = e.mesh.position.distanceTo(playerPos);
        if (dist < 2.5 && dist < nearestDist) {
          nearestDist  = dist;
          nearestEntry = entry;
        }
      }
    }

    // Show/hide prompt
    if (promptEl) {
      if (nearestEntry) {
        promptEl.style.display = 'block';
        _promptVisible = true;
        _promptEnemy   = nearestEntry;
      } else {
        promptEl.style.display = 'none';
        _promptVisible = false;
        _promptEnemy   = null;
      }
    }

    // Handle E/F key presses when prompt is visible
    if (_promptVisible && _promptEnemy) {
      if (_keysDown['E']) {
        _keysDown['E'] = false; // consume
        _executeEnemy(_promptEnemy);
        _promptVisible = false;
        _promptEnemy   = null;
        if (promptEl) promptEl.style.display = 'none';
      } else if (_keysDown['F']) {
        _keysDown['F'] = false; // consume
        _spareEnemy(_promptEnemy);
        _promptVisible = false;
        _promptEnemy   = null;
        if (promptEl) promptEl.style.display = 'none';
      }
    }
  }

  /* ── PUBLIC: clear — call in applyStage ──────────────────────────── */
  function clear() {
    for (var i = 0; i < _surrenderedEnemies.length; i++) {
      var entry = _surrenderedEnemies[i];
      if (!entry) continue;
      try {
        if (_scene && entry.flagMesh)   _scene.remove(entry.flagMesh);
        if (_scene && entry.speechMesh) _scene.remove(entry.speechMesh);
      } catch (eC) {}
    }
    _surrenderedEnemies = [];
    _promptVisible = false;
    _promptEnemy   = null;
    var promptEl = document.getElementById('surrenderPrompt');
    if (promptEl) promptEl.style.display = 'none';
  }

  /* ── PUBLIC: reset — call after KillStreak.reset ─────────────────── */
  function reset() {
    clear();
    window._warCrimesCount = 0;
    window._mercyCount     = 0;
    window._enemyRageBonus = 0;
    _updateKarmaBar();
  }

  return {
    init:            init,
    update:          update,
    checkSurrender:  checkSurrender,
    clear:           clear,
    reset:           reset
  };
})();
