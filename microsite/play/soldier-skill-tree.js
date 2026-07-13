window.SoldierSkillTree = (function () {
  'use strict';

  /* ── Kill thresholds for levels 1-20 ───────────────────────────────── */
  var LEVEL_KILLS = [0, 5, 15, 30, 50, 75, 105, 140, 180, 225, 275, 330, 390, 455, 525, 600, 680, 765, 855, 950];
  var MAX_POINTS = 20;
  var STARTING_POINTS = 3;
  var STORAGE_KEY = 'ok_skillTree';

  /* ── Skill tree definition ─────────────────────────────────────────── */
  var PATHS = [
    {
      id: 'infantry',
      name: 'INFANTRY',
      icon: '⚔️',
      color: '#4CAF50',
      tiers: [
        { id: 'inf1', name: 'Quick March',   icon: '👟', desc: '+10% movement speed' },
        { id: 'inf2', name: 'Iron Body',     icon: '🛡️', desc: '+20 max HP' },
        { id: 'inf3', name: 'Speed Loader',  icon: '🔄', desc: 'Reload speed ×0.8 (faster)' },
        { id: 'inf4', name: 'Prone Aim',     icon: '🎯', desc: 'Crouch accuracy +30%' },
        { id: 'inf5', name: 'Iron Legs',     icon: '⚡', desc: 'Unlimited sprint 10s / 30s cooldown' }
      ]
    },
    {
      id: 'support',
      name: 'SUPPORT',
      icon: '🩺',
      color: '#2196F3',
      tiers: [
        { id: 'sup1', name: 'Extra Frags',   icon: '💣', desc: '+1 grenade capacity' },
        { id: 'sup2', name: 'Ammo Aura',     icon: '📦', desc: 'Nearby allies +25 ammo every 30s' },
        { id: 'sup3', name: 'Smoke Grenade', icon: '💨', desc: 'Unlocks smoke grenade' },
        { id: 'sup4', name: 'Fortify',       icon: '🏰', desc: 'Fortification HP +50%' },
        { id: 'sup5', name: 'Artillery',     icon: '🔥', desc: 'Artillery strike (Ctrl+G, 60s cooldown)' }
      ]
    },
    {
      id: 'sniper',
      name: 'SNIPER',
      icon: '🔭',
      color: '#FF9800',
      tiers: [
        { id: 'sni1', name: 'Swift Scope',   icon: '⚡', desc: 'Zoom speed +25%' },
        { id: 'sni2', name: 'Hold Breath',   icon: '🫁', desc: 'Space while scoped steadies aim 3s' },
        { id: 'sni3', name: 'Penetrator',    icon: '🧱', desc: 'Shots pass through thin walls' },
        { id: 'sni4', name: 'Headhunter',    icon: '💀', desc: 'One-shot headshot on unarmored enemies' },
        { id: 'sni5', name: 'Ghost Stance',  icon: '👻', desc: 'Invisible while prone 8s / 45s cooldown' }
      ]
    },
    {
      id: 'demo',
      name: 'DEMOLITIONS',
      icon: '💥',
      color: '#F44336',
      tiers: [
        { id: 'dem1', name: 'C4 Expert',     icon: '🧨', desc: '+2 C4 capacity' },
        { id: 'dem2', name: 'Long Arm',      icon: '🏹', desc: 'Grenade throw distance +40%' },
        { id: 'dem3', name: 'Blast Wave',    icon: '💢', desc: 'Explosion radius +25%' },
        { id: 'dem4', name: 'EMP Grenade',   icon: '⚡', desc: 'Unlocks EMP grenade' },
        { id: 'dem5', name: 'Carpet Bomb',   icon: '✈️', desc: 'Airstrike drops 4 bombs instead of 1' }
      ]
    }
  ];

  /* ── State ─────────────────────────────────────────────────────────── */
  var _scene = null;
  var _camera = null;
  var _points = STARTING_POINTS;
  var _purchased = {};           // { skillId: true }
  var _totalPurchased = 0;
  var _open = false;
  var _panel = null;
  var _toastEl = null;
  var _toastTimer = 0;
  var _prevLevel = 0;
  var _levelEl = null;

  /* ability cooldown timers */
  var _sprintActive = false;
  var _sprintTimer = 0;
  var _sprintCooldown = 0;
  var _ghostActive = false;
  var _ghostTimer = 0;
  var _ghostCooldown = 0;
  var _artilleryKeyDown = false;
  var _artilleryCooldown = 0;

  /* ── Kill → level helper ───────────────────────────────────────────── */
  function _killsToLevel(kills) {
    var lvl = 0;
    for (var i = 0; i < LEVEL_KILLS.length; i++) {
      if (kills >= LEVEL_KILLS[i]) lvl = i;
      else break;
    }
    return lvl;
  }

  /* ── Stat application ──────────────────────────────────────────────── */
  function _applyAllStats() {
    /* defaults */
    if (window._maxHP === undefined) window._maxHP = 100;
    if (window._moveSpeedMult === undefined) window._moveSpeedMult = 1.0;
    if (window._reloadSpeedMult === undefined) window._reloadSpeedMult = 1.0;
    if (window._crouchAccuracyBonus === undefined) window._crouchAccuracyBonus = 0;
    if (window._grenadeCapacityBonus === undefined) window._grenadeCapacityBonus = 0;
    if (window._smokeGrenadeUnlocked === undefined) window._smokeGrenadeUnlocked = false;
    if (window._fortificationHPMult === undefined) window._fortificationHPMult = 1.0;
    if (window._artilleryStrikeUnlocked === undefined) window._artilleryStrikeUnlocked = false;
    if (window._zoomSpeedMult === undefined) window._zoomSpeedMult = 1.0;
    if (window._holdBreathUnlocked === undefined) window._holdBreathUnlocked = false;
    if (window._bulletPenetrationUnlocked === undefined) window._bulletPenetrationUnlocked = false;
    if (window._oneshotHeadshotUnlocked === undefined) window._oneshotHeadshotUnlocked = false;
    if (window._ghostStanceUnlocked === undefined) window._ghostStanceUnlocked = false;
    if (window._c4CapacityBonus === undefined) window._c4CapacityBonus = 0;
    if (window._throwDistanceMult === undefined) window._throwDistanceMult = 1.0;
    if (window._explosionRadiusMult === undefined) window._explosionRadiusMult = 1.0;
    if (window._empGrenadeUnlocked === undefined) window._empGrenadeUnlocked = false;
    if (window._airstrikeMultiBomb === undefined) window._airstrikeMultiBomb = false;

    /* reset to base then re-apply purchased skills */
    window._maxHP = 100;
    window._moveSpeedMult = 1.0;
    window._reloadSpeedMult = 1.0;
    window._crouchAccuracyBonus = 0;
    window._grenadeCapacityBonus = 0;
    window._smokeGrenadeUnlocked = false;
    window._fortificationHPMult = 1.0;
    window._artilleryStrikeUnlocked = false;
    window._zoomSpeedMult = 1.0;
    window._holdBreathUnlocked = false;
    window._bulletPenetrationUnlocked = false;
    window._oneshotHeadshotUnlocked = false;
    window._ghostStanceUnlocked = false;
    window._c4CapacityBonus = 0;
    window._throwDistanceMult = 1.0;
    window._explosionRadiusMult = 1.0;
    window._empGrenadeUnlocked = false;
    window._airstrikeMultiBomb = false;

    if (_purchased['inf1']) window._moveSpeedMult = Math.round((window._moveSpeedMult + 0.10) * 100) / 100;
    if (_purchased['inf2']) window._maxHP += 20;
    if (_purchased['inf3']) window._reloadSpeedMult = Math.round((window._reloadSpeedMult * 0.8) * 100) / 100;
    if (_purchased['inf4']) window._crouchAccuracyBonus += 30;
    /* inf5 handled in update() */

    if (_purchased['sup1']) window._grenadeCapacityBonus += 1;
    /* sup2 handled in update() */
    if (_purchased['sup3']) window._smokeGrenadeUnlocked = true;
    if (_purchased['sup4']) window._fortificationHPMult = 1.5;
    if (_purchased['sup5']) window._artilleryStrikeUnlocked = true;

    if (_purchased['sni1']) window._zoomSpeedMult = 1.25;
    if (_purchased['sni2']) window._holdBreathUnlocked = true;
    if (_purchased['sni3']) window._bulletPenetrationUnlocked = true;
    if (_purchased['sni4']) window._oneshotHeadshotUnlocked = true;
    if (_purchased['sni5']) window._ghostStanceUnlocked = true;

    if (_purchased['dem1']) window._c4CapacityBonus += 2;
    if (_purchased['dem2']) window._throwDistanceMult = 1.4;
    if (_purchased['dem3']) window._explosionRadiusMult = 1.25;
    if (_purchased['dem4']) window._empGrenadeUnlocked = true;
    if (_purchased['dem5']) window._airstrikeMultiBomb = true;

    /* propagate maxHP to player if alive */
    if (window.player && window.player.maxHp !== undefined) {
      if (window.player.maxHp < window._maxHP) {
        var bonus = window._maxHP - window.player.maxHp;
        window.player.maxHp = window._maxHP;
        window.player.hp = Math.min((window.player.hp || 100) + bonus, window.player.maxHp);
      }
    }
  }

  /* ── Persistence ───────────────────────────────────────────────────── */
  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        points: _points,
        purchased: _purchased,
        totalPurchased: _totalPurchased
      }));
    } catch (e) {}
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (typeof data.points === 'number') _points = data.points;
      if (data.purchased && typeof data.purchased === 'object') _purchased = data.purchased;
      if (typeof data.totalPurchased === 'number') _totalPurchased = data.totalPurchased;
    } catch (e) {}
  }

  /* ── Toast notification ────────────────────────────────────────────── */
  function _buildToast() {
    _toastEl = document.createElement('div');
    _toastEl.id = 'sst-toast';
    _toastEl.style.cssText = [
      'position:fixed', 'top:60px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)', 'border:2px solid #FFD700',
      'color:#FFD700', 'font-family:monospace', 'font-size:16px',
      'font-weight:bold', 'padding:10px 28px', 'letter-spacing:2px',
      'pointer-events:none', 'z-index:9000', 'display:none',
      'box-shadow:0 0 20px rgba(255,215,0,0.6)', 'text-align:center'
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function _showToast(msg) {
    if (!_toastEl) return;
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    _toastTimer = 3.0;
  }

  /* ── Level HUD ─────────────────────────────────────────────────────── */
  function _buildLevelEl() {
    _levelEl = document.createElement('div');
    _levelEl.id = 'sst-level';
    _levelEl.style.cssText = [
      'position:fixed', 'top:10px', 'left:10px',
      'color:#FFD700', 'font-family:monospace', 'font-size:13px',
      'font-weight:bold', 'letter-spacing:1px',
      'pointer-events:none', 'z-index:2000',
      'text-shadow:1px 1px 3px #000'
    ].join(';');
    document.body.appendChild(_levelEl);
  }

  function _starsForLevel(lvl) {
    var maxStars = 5;
    var filled = Math.min(lvl, maxStars);
    var s = '';
    for (var i = 0; i < filled; i++) s += '★';
    for (var j = filled; j < maxStars; j++) s += '☆';
    return s;
  }

  function _updateLevelEl(lvl) {
    if (!_levelEl) return;
    var rankName = 'PVT';
    if (window.BattlefieldPromotions && window.BattlefieldPromotions.getRank) {
      rankName = window.BattlefieldPromotions.getRank();
    }
    _levelEl.textContent = rankName + ' ' + _starsForLevel(lvl) + '  [K: SKILLS]';
  }

  /* ── Panel CSS helper ──────────────────────────────────────────────── */
  function _injectCSS() {
    if (document.getElementById('sst-css')) return;
    var style = document.createElement('style');
    style.id = 'sst-css';
    style.textContent = [
      '#sst-panel { position:fixed; top:0; left:0; width:100%; height:100%;',
      '  background:rgba(0,0,0,0.92); z-index:8000; display:none; overflow-y:auto;',
      '  font-family:monospace; color:#eee; box-sizing:border-box; padding:20px; }',

      '#sst-header { text-align:center; margin-bottom:16px; }',
      '#sst-header h1 { color:#FFD700; font-size:28px; letter-spacing:4px; margin:0; }',
      '#sst-points { color:#00ff88; font-size:16px; margin-top:6px; letter-spacing:2px; }',
      '#sst-hint { color:#888; font-size:12px; margin-top:4px; }',

      '#sst-paths { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }',

      '.sst-path { flex:1; min-width:200px; max-width:260px;',
      '  background:rgba(255,255,255,0.04); border:1px solid #333;',
      '  border-radius:8px; padding:12px; }',
      '.sst-path-title { text-align:center; font-size:16px; font-weight:bold;',
      '  letter-spacing:2px; margin-bottom:12px; }',

      '.sst-node { border:2px solid #444; border-radius:6px; padding:10px 12px;',
      '  margin-bottom:10px; cursor:default; transition:all 0.2s; }',
      '.sst-node.locked { opacity:0.4; }',
      '.sst-node.available { border-color:#888; cursor:pointer; }',
      '.sst-node.available:hover { border-color:#FFD700; background:rgba(255,215,0,0.08); }',
      '.sst-node.purchased { border-color:#FFD700; background:rgba(255,215,0,0.12);',
      '  box-shadow:0 0 12px rgba(255,215,0,0.5); }',
      '.sst-node.tier5 { animation:sst-rainbow 2s linear infinite; }',

      '@keyframes sst-rainbow {',
      '  0%{border-color:#ff0000} 16%{border-color:#ff8800}',
      '  33%{border-color:#ffff00} 50%{border-color:#00ff00}',
      '  66%{border-color:#0088ff} 83%{border-color:#8800ff}',
      '  100%{border-color:#ff0000} }',

      '.sst-node-top { display:flex; align-items:center; gap:8px; margin-bottom:4px; }',
      '.sst-node-icon { font-size:20px; }',
      '.sst-node-name { font-size:13px; font-weight:bold; flex:1; }',
      '.sst-node-check { color:#00ff88; font-size:16px; }',
      '.sst-node-desc { font-size:11px; color:#aaa; line-height:1.4; }',
      '.sst-node-tier { font-size:10px; color:#666; margin-bottom:2px; }',

      '#sst-reset-btn { display:block; margin:20px auto 0; padding:10px 30px;',
      '  background:#333; color:#FF5555; border:1px solid #FF5555;',
      '  font-family:monospace; font-size:13px; cursor:pointer; letter-spacing:2px; }',
      '#sst-reset-btn:hover { background:#FF5555; color:#000; }',

      '#sst-confirm { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);',
      '  background:#111; border:2px solid #FF5555; padding:30px 40px;',
      '  z-index:9500; text-align:center; display:none; font-family:monospace; }',
      '#sst-confirm h2 { color:#FF5555; margin:0 0 12px; }',
      '#sst-confirm p { color:#ccc; font-size:13px; margin:0 0 20px; }',
      '#sst-confirm-yes { padding:8px 24px; background:#FF5555; color:#000;',
      '  border:none; font-family:monospace; font-size:14px; cursor:pointer; margin-right:10px; }',
      '#sst-confirm-no { padding:8px 24px; background:#333; color:#eee;',
      '  border:1px solid #666; font-family:monospace; font-size:14px; cursor:pointer; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Panel build ───────────────────────────────────────────────────── */
  function _buildPanel() {
    _panel = document.createElement('div');
    _panel.id = 'sst-panel';
    _panel.innerHTML = [
      '<div id="sst-header">',
      '  <h1>&#9876; SOLDIER SKILL TREE</h1>',
      '  <div id="sst-points">SKILL POINTS: ' + _points + '</div>',
      '  <div id="sst-hint">Press K or ESC to close &nbsp;&bull;&nbsp; Alt+K to reset</div>',
      '</div>',
      '<div id="sst-paths"></div>',
      '<button id="sst-reset-btn">&#9850; RESET ALL SKILLS (Alt+K)</button>'
    ].join('');
    document.body.appendChild(_panel);

    var pathsEl = _panel.querySelector('#sst-paths');
    for (var pi = 0; pi < PATHS.length; pi++) {
      pathsEl.appendChild(_buildPathCol(PATHS[pi]));
    }

    _panel.querySelector('#sst-reset-btn').addEventListener('click', function () {
      _showConfirm();
    });

    /* confirm dialog */
    var confirmEl = document.createElement('div');
    confirmEl.id = 'sst-confirm';
    confirmEl.innerHTML = [
      '<h2>RESET SKILLS?</h2>',
      '<p>All skill points will be refunded.<br>Stats return to default.</p>',
      '<button id="sst-confirm-yes">YES, RESET</button>',
      '<button id="sst-confirm-no">CANCEL</button>'
    ].join('');
    document.body.appendChild(confirmEl);

    confirmEl.querySelector('#sst-confirm-yes').addEventListener('click', function () {
      _doReset();
      _hideConfirm();
    });
    confirmEl.querySelector('#sst-confirm-no').addEventListener('click', _hideConfirm);
  }

  function _buildPathCol(path) {
    var col = document.createElement('div');
    col.className = 'sst-path';
    col.setAttribute('data-path', path.id);

    var title = document.createElement('div');
    title.className = 'sst-path-title';
    title.style.color = path.color;
    title.textContent = path.icon + ' ' + path.name;
    col.appendChild(title);

    for (var ti = 0; ti < path.tiers.length; ti++) {
      col.appendChild(_buildNode(path, ti));
    }
    return col;
  }

  function _buildNode(path, tierIndex) {
    var skill = path.tiers[tierIndex];
    var node = document.createElement('div');
    node.className = 'sst-node';
    node.setAttribute('data-skill', skill.id);
    if (tierIndex === 4) node.classList.add('tier5');

    node.innerHTML = [
      '<div class="sst-node-tier">TIER ' + (tierIndex + 1) + '</div>',
      '<div class="sst-node-top">',
      '  <span class="sst-node-icon">' + skill.icon + '</span>',
      '  <span class="sst-node-name">' + skill.name + '</span>',
      '  <span class="sst-node-check" data-check="' + skill.id + '"></span>',
      '</div>',
      '<div class="sst-node-desc">' + skill.desc + '</div>'
    ].join('');

    node.addEventListener('click', function () {
      _onNodeClick(path, tierIndex, skill.id);
    });
    return node;
  }

  function _updatePanelState() {
    if (!_panel) return;
    var pointsEl = _panel.querySelector('#sst-points');
    if (pointsEl) pointsEl.textContent = 'SKILL POINTS: ' + _points;

    for (var pi = 0; pi < PATHS.length; pi++) {
      var path = PATHS[pi];
      for (var ti = 0; ti < path.tiers.length; ti++) {
        var skill = path.tiers[ti];
        var nodeEl = _panel.querySelector('[data-skill="' + skill.id + '"]');
        if (!nodeEl) continue;

        var prevPurchased = ti === 0 || _purchased[path.tiers[ti - 1].id];
        var isPurchased = !!_purchased[skill.id];
        var canBuy = !isPurchased && prevPurchased && _points > 0;

        nodeEl.classList.remove('locked', 'available', 'purchased');
        if (isPurchased) {
          nodeEl.classList.add('purchased');
        } else if (canBuy) {
          nodeEl.classList.add('available');
        } else {
          nodeEl.classList.add('locked');
        }

        var checkEl = nodeEl.querySelector('[data-check]');
        if (checkEl) checkEl.textContent = isPurchased ? '✓' : '';
      }
    }
  }

  function _onNodeClick(path, tierIndex, skillId) {
    if (_purchased[skillId]) return;
    if (_points <= 0) return;
    if (tierIndex > 0 && !_purchased[path.tiers[tierIndex - 1].id]) return;

    _purchased[skillId] = true;
    _points--;
    _totalPurchased++;
    _applyAllStats();
    _save();
    _updatePanelState();
  }

  /* ── Confirm dialog ────────────────────────────────────────────────── */
  function _showConfirm() {
    var el = document.getElementById('sst-confirm');
    if (el) el.style.display = 'block';
  }
  function _hideConfirm() {
    var el = document.getElementById('sst-confirm');
    if (el) el.style.display = 'none';
  }

  /* ── Open / Close ──────────────────────────────────────────────────── */
  function openTree() {
    if (!_panel) _buildPanel();
    _updatePanelState();
    _panel.style.display = 'block';
    _open = true;
  }

  function closeTree() {
    if (_panel) _panel.style.display = 'none';
    _hideConfirm();
    _open = false;
  }

  /* ── addSkillPoint ─────────────────────────────────────────────────── */
  function addSkillPoint() {
    if (_points + _totalPurchased >= MAX_POINTS) return;
    _points++;
    _save();
    _showToast('+1 SKILL POINT AVAILABLE');
    if (_open) _updatePanelState();
  }

  /* ── Reset (full) ──────────────────────────────────────────────────── */
  function _doReset() {
    _points = STARTING_POINTS + _totalPurchased;
    if (_points > MAX_POINTS) _points = MAX_POINTS;
    _purchased = {};
    _totalPurchased = 0;
    _applyAllStats();
    _save();
    _updatePanelState();
  }

  /* ── Keyboard handling ─────────────────────────────────────────────── */
  function _onKeyDown(e) {
    /* K — toggle skill tree */
    if (e.key === 'k' || e.key === 'K') {
      if (e.altKey) {
        /* Alt+K — reset dialog */
        if (_open) _showConfirm();
        else { openTree(); _showConfirm(); }
        e.preventDefault();
        return;
      }
      if (_open) closeTree();
      else openTree();
      e.preventDefault();
      return;
    }

    /* ESC — close panel */
    if (e.key === 'Escape' && _open) {
      var confirmEl = document.getElementById('sst-confirm');
      if (confirmEl && confirmEl.style.display === 'block') {
        _hideConfirm();
      } else {
        closeTree();
      }
      return;
    }

    /* Ctrl+G — artillery strike (sup5) */
    if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
      if (_purchased['sup5'] && _artilleryCooldown <= 0) {
        _artilleryCooldown = 60;
        if (window.ArtilleryBarrage && window.ArtilleryBarrage.fire) {
          window.ArtilleryBarrage.fire();
        }
        _showToast('ARTILLERY STRIKE INBOUND!');
        e.preventDefault();
      }
      return;
    }
  }

  /* ── Init ──────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _load();
    _injectCSS();
    _buildToast();
    _buildLevelEl();
    _applyAllStats();

    document.addEventListener('keydown', _onKeyDown);
    _prevLevel = 0;
  }

  /* ── Update ────────────────────────────────────────────────────────── */
  function update(dt) {
    /* level-up detection */
    var kills = (window.player && window.player.kills) ? window.player.kills : 0;
    var lvl = _killsToLevel(kills);
    if (lvl > _prevLevel) {
      var gained = lvl - _prevLevel;
      for (var gi = 0; gi < gained; gi++) addSkillPoint();
      _prevLevel = lvl;
    }
    _updateLevelEl(lvl);

    /* toast timer */
    if (_toastTimer > 0) {
      _toastTimer -= dt;
      if (_toastTimer <= 0 && _toastEl) _toastEl.style.display = 'none';
    }

    /* artillery cooldown */
    if (_artilleryCooldown > 0) _artilleryCooldown -= dt;

    /* inf5 — unlimited sprint */
    if (_purchased['inf5']) {
      var player = window.player;
      if (player) {
        if (!_sprintActive && _sprintCooldown <= 0 && player.isSprinting) {
          _sprintActive = true;
          _sprintTimer = 10;
          if (window._sprintUnlimited !== undefined) window._sprintUnlimited = true;
        }
        if (_sprintActive) {
          _sprintTimer -= dt;
          if (_sprintTimer <= 0) {
            _sprintActive = false;
            _sprintCooldown = 30;
            if (window._sprintUnlimited !== undefined) window._sprintUnlimited = false;
          }
        }
        if (_sprintCooldown > 0) _sprintCooldown -= dt;
      }
    }

    /* sni5 — ghost stance (invisible while prone) */
    if (_purchased['sni5']) {
      var pl = window.player;
      if (pl) {
        if (!_ghostActive && _ghostCooldown <= 0 && pl.isProne) {
          _ghostActive = true;
          _ghostTimer = 8;
          window._ghostStanceActive = true;
        }
        if (_ghostActive) {
          if (!pl.isProne) {
            _ghostActive = false;
            _ghostCooldown = 45;
            window._ghostStanceActive = false;
          } else {
            _ghostTimer -= dt;
            if (_ghostTimer <= 0) {
              _ghostActive = false;
              _ghostCooldown = 45;
              window._ghostStanceActive = false;
            }
          }
        }
        if (_ghostCooldown > 0) _ghostCooldown -= dt;
      }
    }

    /* sup2 — ammo aura (every 30s, give nearby allies +25 ammo) */
    if (_purchased['sup2']) {
      if (window._ammoAuraTimer === undefined) window._ammoAuraTimer = 0;
      window._ammoAuraTimer -= dt;
      if (window._ammoAuraTimer <= 0) {
        window._ammoAuraTimer = 30;
        window._ammoAuraActive = true;
      }
    }
  }

  /* ── Public reset (called externally) ─────────────────────────────── */
  function reset() {
    closeTree();
    _doReset();
    _prevLevel = 0;
    _sprintActive = false;
    _sprintTimer = 0;
    _sprintCooldown = 0;
    _ghostActive = false;
    _ghostTimer = 0;
    _ghostCooldown = 0;
    _artilleryCooldown = 0;
    window._ghostStanceActive = false;
    window._ammoAuraTimer = 0;
  }

  return { init: init, update: update, addSkillPoint: addSkillPoint, openTree: openTree, closeTree: closeTree, reset: reset };
})();
