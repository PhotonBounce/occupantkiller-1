// chain-of-command.js — Military Chain of Command, Unit Hierarchy & Order-Giving
// IIFE module exposing window.ChainOfCommand = { init, update, reset }
window.ChainOfCommand = (function () {
  'use strict';

  // ── rank definitions ──────────────────────────────────────────────────────────
  var RANKS = [
    { abbr: 'PFC', name: 'Private First Class',  killsRequired: 0   },
    { abbr: 'CPL', name: 'Corporal',              killsRequired: 10  },
    { abbr: 'SGT', name: 'Sergeant',              killsRequired: 25  },
    { abbr: 'SSG', name: 'Staff Sergeant',        killsRequired: 50  },
    { abbr: 'SFC', name: 'Sergeant First Class',  killsRequired: 100 },
    { abbr: 'MSG', name: 'Master Sergeant',       killsRequired: 200 }
  ];

  var RANK_XP_PER_KILL = 25;

  // XP thresholds: kills * RANK_XP_PER_KILL gives XP
  // kills needed for each rank index = RANKS[i].killsRequired
  // XP needed = kills * RANK_XP_PER_KILL

  var BUDDY_SPEED         = 5;
  var BUDDY_MAX_HP        = 100;
  var BUDDY_FIRE_RANGE    = 20;
  var BUDDY_FIRE_RATE     = 1.5;
  var BUDDY_DAMAGE        = 15;
  var BUDDY_COLOR         = 0x556B2F;  // OD green
  var SITREP_INTERVAL     = 60;        // seconds between SITREP reports
  var MORTAR_COOLDOWN     = 999999;    // 1× per level; reset on level start
  var PRIORITY_TARGET_DUR = 15;        // seconds
  var CASEVAC_SPEED       = 8;
  var PROMOTION_FLASH_DUR = 3;         // seconds

  // formation offsets (relative to player facing direction)
  // buddy0: 2 units behind + 1 unit left; buddy1: 2 units behind + 1 unit right
  var FORMATION_OFFSETS = [
    { back: 2, side: -1 },
    { back: 2, side:  1 }
  ];

  // ── module state ──────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _playerPos    = null;   // ref to player position vector (THREE.Vector3)
  var _enemies      = null;   // ref to active enemies array

  // rank / progression
  var _kills        = 0;
  var _rankIndex    = 0;      // index into RANKS array
  var _xp           = 0;
  var _rankDownTemp = false;  // temporary rank-down flag (both buddies dead)

  // buddy state array (up to 2 entries)
  var _buddies = [];

  // order state
  var _currentOrder  = 'HOLD FIRE';  // ATTACK / DEFEND / MOVE TO / HOLD FIRE
  var _orderMenuOpen = false;

  // special ability state
  var _mortarUsed          = false;
  var _priorityTargetTimer = 0;
  var _priorityTarget      = null;
  var _casevacSpawned      = false;
  var _casevacMesh         = null;
  var _casevacTarget       = null;
  var _casevacTimer        = 0;

  // HUD refs
  var _hudRoot          = null;
  var _rankHudEl        = null;
  var _xpBarFill        = null;
  var _xpBarLabel       = null;
  var _orderMenuEl      = null;
  var _promotionEl      = null;
  var _promotionTimer   = 0;
  var _promotionFlashEl = null;
  var _sitrepEl         = null;

  // floating XP labels
  var _floatingLabels = [];

  // SITREP timer
  var _sitrepTimer = 0;

  // name tags (DOM elements anchored to 3-D positions)
  var _nameTags = [];

  // ── mesh builder: buddy NPC ───────────────────────────────────────────────────
  function _buildBuddyMesh() {
    var group = new THREE.Group();
    var bodyMat  = new THREE.MeshLambertMaterial({ color: BUDDY_COLOR });
    var helmMat  = new THREE.MeshLambertMaterial({ color: 0x3B4A2F });
    var skinMat  = new THREE.MeshLambertMaterial({ color: 0xC8A882 });
    var gearMat  = new THREE.MeshLambertMaterial({ color: 0x4A5A30 });

    // legs (cylinder for a bit of shape)
    var legGeoL = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 6);
    var legL = new THREE.Mesh(legGeoL, bodyMat);
    legL.position.set(-0.14, 0.28, 0);
    group.add(legL);

    var legGeoR = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 6);
    var legR = new THREE.Mesh(legGeoR, bodyMat);
    legR.position.set(0.14, 0.28, 0);
    group.add(legR);

    // torso (box)
    var torsoGeo = new THREE.BoxGeometry(0.52, 0.65, 0.26);
    var torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.set(0, 0.88, 0);
    group.add(torso);

    // gear / vest overlay
    var vestGeo = new THREE.BoxGeometry(0.54, 0.40, 0.28);
    var vest = new THREE.Mesh(vestGeo, gearMat);
    vest.position.set(0, 0.92, 0);
    group.add(vest);

    // arms
    var armGeoL = new THREE.BoxGeometry(0.16, 0.52, 0.16);
    var armL = new THREE.Mesh(armGeoL, bodyMat);
    armL.position.set(-0.36, 0.84, 0);
    group.add(armL);

    var armGeoR = new THREE.BoxGeometry(0.16, 0.52, 0.16);
    var armR = new THREE.Mesh(armGeoR, bodyMat);
    armR.position.set(0.36, 0.84, 0);
    group.add(armR);

    // head (box)
    var headGeo = new THREE.BoxGeometry(0.34, 0.34, 0.34);
    var head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.38, 0);
    group.add(head);

    // helmet (box + cylinder brim)
    var helmTopGeo = new THREE.BoxGeometry(0.38, 0.18, 0.38);
    var helmTop = new THREE.Mesh(helmTopGeo, helmMat);
    helmTop.position.set(0, 1.57, 0);
    group.add(helmTop);

    var helmBrimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 8);
    var helmBrim = new THREE.Mesh(helmBrimGeo, helmMat);
    helmBrim.position.set(0, 1.49, 0);
    group.add(helmBrim);

    // rifle prop (box)
    var rifleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.7);
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var rifle = new THREE.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.34, 0.82, -0.3);
    group.add(rifle);

    return group;
  }

  // ── build CASEVAC helicopter mesh ─────────────────────────────────────────────
  function _buildCasevacMesh() {
    var group = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4A7A3A });
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.7), bodyMat);
    fuselage.position.set(0, 0, 0);
    group.add(fuselage);

    var tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.2), bodyMat);
    tailBoom.position.set(0, 0, 0.95);
    group.add(tailBoom);

    var rotor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.18), rotorMat);
    rotor.position.set(0, 0.45, 0);
    group.add(rotor);
    group.userData.rotor = rotor;

    var tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), rotorMat);
    tailRotor.position.set(0, 0, 1.5);
    group.add(tailRotor);

    var redCrossMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var cross = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.4), redCrossMat);
    cross.position.set(0, 0.36, 0);
    group.add(cross);

    return group;
  }

  // ── HUD builder ───────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudRoot = document.createElement('div');
    _hudRoot.id = 'coc-hud';
    _hudRoot.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:900',
      'font-family:"Courier New",monospace'
    ].join(';');
    document.body.appendChild(_hudRoot);

    // rank display — top center
    _rankHudEl = document.createElement('div');
    _rankHudEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#E8D080',
      'font-size:16px',
      'font-weight:bold',
      'padding:4px 16px',
      'border:1px solid #E8D080',
      'letter-spacing:2px'
    ].join(';');
    _rankHudEl.textContent = 'ACTUAL — PFC';
    _hudRoot.appendChild(_rankHudEl);

    // XP bar — bottom HUD
    var xpWrap = document.createElement('div');
    xpWrap.style.cssText = [
      'position:absolute',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:260px',
      'background:rgba(0,0,0,0.65)',
      'padding:4px 8px',
      'border:1px solid #666'
    ].join(';');
    _hudRoot.appendChild(xpWrap);

    var xpTitle = document.createElement('div');
    xpTitle.style.cssText = 'color:#AAA;font-size:10px;letter-spacing:1px;margin-bottom:2px;';
    xpTitle.textContent = 'XP — NEXT RANK';
    xpWrap.appendChild(xpTitle);

    var xpBarBg = document.createElement('div');
    xpBarBg.style.cssText = [
      'width:100%',
      'height:8px',
      'background:#333',
      'border:1px solid #555'
    ].join(';');
    xpWrap.appendChild(xpBarBg);

    _xpBarFill = document.createElement('div');
    _xpBarFill.style.cssText = [
      'height:100%',
      'width:0%',
      'background:#5BCC5B',
      'transition:width 0.3s'
    ].join(';');
    xpBarBg.appendChild(_xpBarFill);

    _xpBarLabel = document.createElement('div');
    _xpBarLabel.style.cssText = 'color:#AAA;font-size:10px;margin-top:2px;text-align:right;';
    _xpBarLabel.textContent = '0 XP';
    xpWrap.appendChild(_xpBarLabel);

    // promotion banner
    _promotionEl = document.createElement('div');
    _promotionEl.style.cssText = [
      'position:absolute',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#fff',
      'font-size:32px',
      'font-weight:bold',
      'letter-spacing:4px',
      'text-shadow:0 0 12px #fff,0 2px 0 #000',
      'display:none',
      'text-align:center'
    ].join(';');
    _hudRoot.appendChild(_promotionEl);

    // white flash overlay
    _promotionFlashEl = document.createElement('div');
    _promotionFlashEl.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:#fff',
      'opacity:0',
      'pointer-events:none',
      'transition:opacity 0.15s'
    ].join(';');
    _hudRoot.appendChild(_promotionFlashEl);

    // SITREP ticker (bottom-left)
    _sitrepEl = document.createElement('div');
    _sitrepEl.style.cssText = [
      'position:absolute',
      'bottom:10px',
      'left:10px',
      'color:#90EE90',
      'font-size:12px',
      'background:rgba(0,0,0,0.6)',
      'padding:4px 8px',
      'max-width:340px',
      'display:none'
    ].join(';');
    _hudRoot.appendChild(_sitrepEl);

    // order menu (DOM, pointer-events:auto only when open)
    _orderMenuEl = document.createElement('div');
    _orderMenuEl.id = 'coc-order-menu';
    _orderMenuEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:220px',
      'height:220px',
      'display:none',
      'z-index:950',
      'pointer-events:auto'
    ].join(';');
    document.body.appendChild(_orderMenuEl);

    _buildOrderMenu();
    _buildNameTags();
  }

  function _buildOrderMenu() {
    var orders = ['ATTACK', 'DEFEND', 'MOVE TO', 'HOLD FIRE'];
    var colors  = ['#CC3333', '#3366CC', '#339933', '#AAAA33'];
    var angles  = [-45, 45, 135, 225];  // degrees: top-right, bottom-right, bottom-left, top-left

    // background circle
    var bg = document.createElement('div');
    bg.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:220px',
      'height:220px',
      'border-radius:50%',
      'background:rgba(0,0,0,0.78)',
      'border:2px solid #666'
    ].join(';');
    _orderMenuEl.appendChild(bg);

    // center label
    var center = document.createElement('div');
    center.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#fff',
      'font-size:10px',
      'letter-spacing:1px',
      'font-family:"Courier New",monospace',
      'text-align:center'
    ].join(';');
    center.textContent = 'ORDERS\nF=CLOSE';
    _orderMenuEl.appendChild(center);

    var i;
    for (i = 0; i < orders.length; i++) {
      (function (idx) {
        var rad = (angles[idx] - 90) * Math.PI / 180;
        var r   = 72;
        var x   = 110 + r * Math.cos(rad);
        var y   = 110 + r * Math.sin(rad);

        var btn = document.createElement('div');
        btn.style.cssText = [
          'position:absolute',
          'width:68px',
          'height:40px',
          'left:' + (x - 34) + 'px',
          'top:'  + (y - 20) + 'px',
          'background:' + colors[idx],
          'color:#fff',
          'font-size:11px',
          'font-weight:bold',
          'font-family:"Courier New",monospace',
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'text-align:center',
          'cursor:pointer',
          'border:1px solid rgba(255,255,255,0.3)',
          'border-radius:4px',
          'letter-spacing:1px',
          'user-select:none'
        ].join(';');
        btn.textContent = orders[idx];

        btn.addEventListener('click', function () {
          _issueOrder(orders[idx]);
          _closeOrderMenu();
        });

        _orderMenuEl.appendChild(btn);
      })(i);
    }
  }

  function _buildNameTags() {
    _nameTags = [];
    var callsigns = ['BRAVO-1', 'BRAVO-2'];
    var k;
    for (k = 0; k < 2; k++) {
      (function (idx) {
        var tag = document.createElement('div');
        tag.style.cssText = [
          'position:fixed',
          'color:#90FF90',
          'font-size:10px',
          'font-family:"Courier New",monospace',
          'background:rgba(0,0,0,0.5)',
          'padding:1px 4px',
          'pointer-events:none',
          'display:none',
          'z-index:901'
        ].join(';');
        tag.textContent = callsigns[idx];
        document.body.appendChild(tag);
        _nameTags.push(tag);
      })(k);
    }
  }

  // ── buddy management ──────────────────────────────────────────────────────────
  function _spawnBuddy(idx) {
    if (!_scene || _buddies[idx]) { return; }

    var mesh = _buildBuddyMesh();
    var startPos = _playerPos
      ? new THREE.Vector3(_playerPos.x + (idx === 0 ? -2 : 2), _playerPos.y, _playerPos.z + 2)
      : new THREE.Vector3(idx === 0 ? -2 : 2, 0, 2);
    mesh.position.copy(startPos);
    _scene.add(mesh);

    _buddies[idx] = {
      mesh:           mesh,
      hp:             BUDDY_MAX_HP,
      maxHp:          BUDDY_MAX_HP,
      ammo:           120,
      maxAmmo:        120,
      alive:          true,
      callsign:       idx === 0 ? 'BRAVO-1' : 'BRAVO-2',
      fireTimer:      0,
      crouching:      false,
      crouchTimer:    0,
      currentOrder:   _currentOrder,
      coverPos:       null,
      moveTarget:     null,
      enemyContact:   false
    };

    if (_nameTags[idx]) {
      _nameTags[idx].style.display = 'block';
    }
  }

  function _removeBuddy(idx) {
    if (!_buddies[idx]) { return; }
    if (_buddies[idx].mesh && _scene) {
      _scene.remove(_buddies[idx].mesh);
    }
    _buddies[idx] = null;
    if (_nameTags[idx]) {
      _nameTags[idx].style.display = 'none';
    }
  }

  function _killBuddy(idx) {
    if (!_buddies[idx] || !_buddies[idx].alive) { return; }
    _buddies[idx].alive = false;
    _buddies[idx].mesh.rotation.z = Math.PI / 2;
    _buddies[idx].mesh.position.y -= 0.5;
    if (_nameTags[idx]) {
      _nameTags[idx].style.color = '#FF4444';
      _nameTags[idx].textContent = _buddies[idx].callsign + ' [KIA]';
    }
    _checkBothBuddiesDead();
  }

  function _checkBothBuddiesDead() {
    var b0Dead = !_buddies[0] || !_buddies[0].alive;
    var b1Dead = !_buddies[1] || !_buddies[1].alive;
    if (b0Dead && b1Dead && !_rankDownTemp) {
      _rankDownTemp = true;
      if (_rankIndex > 0) {
        _rankIndex -= 1;
      }
      _showSitrep('COMMANDER — BOTH TEAM MEMBERS DOWN. TEMPORARY RANK REDUCTION.');
      _updateRankHUD();
    }
  }

  // ── order system ──────────────────────────────────────────────────────────────
  function _openOrderMenu() {
    if (_rankIndex < 2) { return; }  // SGT+ required
    _orderMenuOpen = true;
    _orderMenuEl.style.display = 'block';
  }

  function _closeOrderMenu() {
    _orderMenuOpen = false;
    _orderMenuEl.style.display = 'none';
  }

  function _issueOrder(order) {
    _currentOrder = order;
    var k;
    for (k = 0; k < _buddies.length; k++) {
      if (_buddies[k] && _buddies[k].alive) {
        _buddies[k].currentOrder = order;
        if (order === 'MOVE TO' && _playerPos) {
          _buddies[k].moveTarget = _playerPos.clone().add(new THREE.Vector3(
            (k === 0 ? -3 : 3), 0, -4
          ));
        }
      }
    }
    _showSitrep('ORDER ISSUED: ' + order);
  }

  // ── special abilities ─────────────────────────────────────────────────────────
  function requestMortarSupport(targetPos) {
    if (_rankIndex < 3) { return false; }   // SSG+
    if (_mortarUsed)    { return false; }
    _mortarUsed = true;
    // Signal via global event; actual mortar handled by mortar module if present
    if (window.MortarStrikeSystem && window.MortarStrikeSystem.fireAt) {
      window.MortarStrikeSystem.fireAt(targetPos);
    } else {
      // fallback: create a simple explosion effect
      _spawnExplosionEffect(targetPos);
    }
    _showSitrep('MORTAR SUPPORT — ROUNDS ON THE WAY');
    return true;
  }

  function designatePriorityTarget(enemy) {
    if (_rankIndex < 4) { return false; }   // SFC+
    _priorityTarget      = enemy;
    _priorityTargetTimer = PRIORITY_TARGET_DUR;
    if (enemy && enemy.userData) {
      enemy.userData.priorityTarget      = true;
      enemy.userData.damageMultiplier    = 2;
    }
    _showSitrep('PRIORITY TARGET DESIGNATED — 2× DAMAGE FOR 15s');
    return true;
  }

  function callCasevac() {
    if (_rankIndex < 5) { return false; }   // MSG+
    if (_casevacSpawned) { return false; }

    // find nearest wounded buddy
    var target = null;
    var bestDist = Infinity;
    var k;
    for (k = 0; k < _buddies.length; k++) {
      if (_buddies[k] && _buddies[k].mesh) {
        var hp = _buddies[k].hp;
        if (hp < BUDDY_MAX_HP) {
          var d = _playerPos ? _playerPos.distanceTo(_buddies[k].mesh.position) : 0;
          if (d < bestDist) {
            bestDist = d;
            target = _buddies[k];
          }
        }
      }
    }

    if (!target && _playerPos) {
      // default: come to player
      target = { mesh: { position: _playerPos.clone() }, callsign: 'ACTUAL' };
    }

    _casevacMesh = _buildCasevacMesh();
    // spawn at map edge, high altitude
    var spawnX = _playerPos ? _playerPos.x + 50 : 50;
    var spawnZ = _playerPos ? _playerPos.z       : 0;
    _casevacMesh.position.set(spawnX, 15, spawnZ);
    _scene.add(_casevacMesh);
    _casevacSpawned = true;
    _casevacTarget  = target;
    _casevacTimer   = 0;

    _showSitrep('CASEVAC INBOUND — ETA 10 SECONDS');
    return true;
  }

  function _spawnExplosionEffect(pos) {
    if (!_scene || !pos) { return; }
    var geo = new THREE.SphereGeometry(3, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    mesh.userData.life = 0.5;
    mesh.userData.isFX = true;
    // store for cleanup in update
    _fxMeshes.push(mesh);
  }

  var _fxMeshes = [];

  // ── rank & XP ──────────────────────────────────────────────────────────────────
  function registerKill() {
    _kills += 1;
    _xp    += RANK_XP_PER_KILL;
    _checkPromotion();
    _updateXPBar();
    _spawnFloatingXP('+' + RANK_XP_PER_KILL + ' XP');
  }

  function registerObjective(xpAmount) {
    _xp += (xpAmount || 50);
    // convert xp amount to equivalent kill progress
    _kills += Math.floor((xpAmount || 50) / RANK_XP_PER_KILL);
    _checkPromotion();
    _updateXPBar();
    _spawnFloatingXP('+' + (xpAmount || 50) + ' XP');
  }

  function _checkPromotion() {
    var newRankIdx = 0;
    var i;
    for (i = RANKS.length - 1; i >= 0; i--) {
      if (_kills >= RANKS[i].killsRequired) {
        newRankIdx = i;
        break;
      }
    }
    if (newRankIdx > _rankIndex || (_rankDownTemp && newRankIdx >= _rankIndex + 1)) {
      _rankDownTemp = false;
      _rankIndex    = newRankIdx;
      _triggerPromotion(RANKS[_rankIndex]);
      _unlockRankAbilities(_rankIndex);
    }
  }

  function _triggerPromotion(rank) {
    // white flash
    _promotionFlashEl.style.opacity = '0.9';
    var timeout1 = setTimeout(function () {
      _promotionFlashEl.style.opacity = '0';
    }, 300);
    void timeout1;

    // promotion banner
    _promotionEl.textContent = 'PROMOTED TO ' + rank.abbr;
    _promotionEl.style.display = 'block';
    _promotionTimer = PROMOTION_FLASH_DUR;

    _updateRankHUD();
    _showSitrep('CONGRATULATIONS — PROMOTED TO ' + rank.name.toUpperCase());
  }

  function _unlockRankAbilities(idx) {
    var rankAbbr = RANKS[idx].abbr;
    if (rankAbbr === 'CPL' && _buddies.length === 0) {
      _spawnBuddy(0);
    }
    if (rankAbbr === 'SGT') {
      _spawnBuddy(1);
      _showSitrep('SGT UNLOCK: F-MENU ORDERS NOW AVAILABLE');
    }
    if (rankAbbr === 'SSG') {
      _mortarUsed = false;
      _showSitrep('SSG UNLOCK: MORTAR SUPPORT AVAILABLE (1× PER LEVEL)');
    }
    if (rankAbbr === 'SFC') {
      _showSitrep('SFC UNLOCK: PRIORITY TARGET DESIGNATION AVAILABLE');
    }
    if (rankAbbr === 'MSG') {
      _showSitrep('MSG UNLOCK: CASEVAC HELICOPTER AVAILABLE');
    }
  }

  function _updateRankHUD() {
    if (!_rankHudEl) { return; }
    var displayIdx = _rankDownTemp ? Math.max(0, _rankIndex - 1) : _rankIndex;
    var abbr = RANKS[displayIdx].abbr;
    _rankHudEl.textContent = 'ACTUAL — ' + abbr;
    if (_rankDownTemp) {
      _rankHudEl.style.color = '#FF8888';
    } else {
      _rankHudEl.style.color = '#E8D080';
    }
  }

  function _updateXPBar() {
    if (!_xpBarFill || !_xpBarLabel) { return; }
    var currentKillThreshold = RANKS[_rankIndex].killsRequired;
    var nextKillThreshold    = _rankIndex < RANKS.length - 1
      ? RANKS[_rankIndex + 1].killsRequired
      : RANKS[_rankIndex].killsRequired;
    var pct = 0;
    if (nextKillThreshold > currentKillThreshold) {
      pct = Math.min(100, Math.floor(
        (_kills - currentKillThreshold) / (nextKillThreshold - currentKillThreshold) * 100
      ));
    } else {
      pct = 100;
    }
    _xpBarFill.style.width = pct + '%';
    _xpBarLabel.textContent = _xp + ' XP — ' + pct + '%';
  }

  // ── floating XP labels ────────────────────────────────────────────────────────
  function _spawnFloatingXP(text) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'color:#FFE44D',
      'font-size:14px',
      'font-weight:bold',
      'font-family:"Courier New",monospace',
      'pointer-events:none',
      'z-index:910',
      'text-shadow:0 1px 3px #000'
    ].join(';');
    el.textContent = text;

    // place near screen center-right
    var cx = window.innerWidth  * 0.60;
    var cy = window.innerHeight * 0.50;
    el.style.left = cx + 'px';
    el.style.top  = cy + 'px';

    document.body.appendChild(el);
    _floatingLabels.push({ el: el, life: 2.0, vy: -40 });
  }

  // ── SITREP system ─────────────────────────────────────────────────────────────
  function _showSitrep(msg) {
    if (!_sitrepEl) { return; }
    _sitrepEl.textContent = msg;
    _sitrepEl.style.display = 'block';
    var t = setTimeout(function () {
      if (_sitrepEl) { _sitrepEl.style.display = 'none'; }
    }, 6000);
    void t;
  }

  function _sendBuddySitrep(buddy) {
    if (!buddy || !buddy.alive) { return; }
    var ammoRatio = buddy.ammo / buddy.maxAmmo;
    var ammoStatus = ammoRatio > 0.6 ? 'GREEN' : (ammoRatio > 0.3 ? 'YELLOW' : 'RED');
    var hpPct = Math.round(buddy.hp / buddy.maxHp * 100);
    var contact = buddy.enemyContact ? 'YES' : 'NO';
    _showSitrep(
      buddy.callsign + ' ACTUAL — ' +
      'AMMO [' + ammoStatus + '] ' +
      'HEALTH [' + hpPct + '%] ' +
      'ENEMY CONTACT [' + contact + ']'
    );
  }

  // ── buddy AI update ───────────────────────────────────────────────────────────
  function _updateBuddy(buddy, idx, dt, enemies) {
    if (!buddy || !buddy.alive) { return; }

    var mesh = buddy.mesh;
    var order = buddy.currentOrder;

    // enemy detection
    buddy.enemyContact = false;
    var nearestEnemy = null;
    var nearestDist  = Infinity;
    var k;
    if (enemies && enemies.length) {
      for (k = 0; k < enemies.length; k++) {
        var e = enemies[k];
        if (!e || !e.position) { continue; }
        var d = mesh.position.distanceTo(e.position);
        if (d < BUDDY_FIRE_RANGE) {
          buddy.enemyContact = true;
          if (d < nearestDist) {
            nearestDist  = d;
            nearestEnemy = e;
          }
        }
      }
    }

    // cover / crouch behaviour when shot at (simulated: hp < 70)
    if (buddy.hp < 70 && nearestEnemy) {
      buddy.crouching   = true;
      buddy.crouchTimer = 3.0;
    }
    if (buddy.crouching) {
      buddy.crouchTimer -= dt;
      mesh.scale.y = 0.6;
      if (buddy.crouchTimer <= 0) {
        buddy.crouching = false;
        mesh.scale.y    = 1.0;
      }
    }

    // movement
    if (order === 'HOLD FIRE' || order === 'DEFEND') {
      // stay in formation
      _moveToFormation(buddy, idx, dt);
    } else if (order === 'ATTACK') {
      if (nearestEnemy) {
        // advance toward enemy
        var dirToEnemy = new THREE.Vector3()
          .subVectors(nearestEnemy.position, mesh.position)
          .normalize();
        var desiredDist = 8;
        if (nearestDist > desiredDist) {
          mesh.position.addScaledVector(dirToEnemy, BUDDY_SPEED * dt);
        }
        mesh.lookAt(nearestEnemy.position);
      } else {
        _moveToFormation(buddy, idx, dt);
      }
    } else if (order === 'MOVE TO') {
      if (buddy.moveTarget) {
        var dirToTarget = new THREE.Vector3()
          .subVectors(buddy.moveTarget, mesh.position)
          .normalize();
        var distToTarget = mesh.position.distanceTo(buddy.moveTarget);
        if (distToTarget > 0.5) {
          mesh.position.addScaledVector(dirToTarget, BUDDY_SPEED * dt);
        }
      } else {
        _moveToFormation(buddy, idx, dt);
      }
    } else {
      _moveToFormation(buddy, idx, dt);
    }

    // fire at nearest enemy
    if (nearestEnemy && !buddy.crouching && order !== 'HOLD FIRE') {
      buddy.fireTimer -= dt;
      if (buddy.fireTimer <= 0 && buddy.ammo > 0) {
        buddy.fireTimer = BUDDY_FIRE_RATE;
        buddy.ammo     -= 1;
        if (nearestEnemy.userData) {
          var dmg = BUDDY_DAMAGE;
          if (nearestEnemy.userData.priorityTarget) {
            dmg *= (nearestEnemy.userData.damageMultiplier || 1);
          }
          nearestEnemy.userData.hp = (nearestEnemy.userData.hp || 100) - dmg;
          if (nearestEnemy.userData.hp <= 0 && _scene) {
            _scene.remove(nearestEnemy);
            // remove from enemies array
            if (enemies) {
              var eIdx = enemies.indexOf(nearestEnemy);
              if (eIdx !== -1) { enemies.splice(eIdx, 1); }
            }
          }
        }
      }
    }

    // rotate rotor if it's the casevac (not applicable here, but harmless)
  }

  function _moveToFormation(buddy, idx, dt) {
    if (!_playerPos || !buddy) { return; }
    var offset = FORMATION_OFFSETS[idx];
    if (!offset) { return; }

    // get player facing direction from camera if available
    var facingAngle = 0;
    if (_camera) {
      // project camera forward onto XZ plane
      var fwd = new THREE.Vector3();
      _camera.getWorldDirection(fwd);
      facingAngle = Math.atan2(fwd.x, fwd.z);
    }

    // compute target formation position
    var backX = -Math.sin(facingAngle) * offset.back * (-1);
    var backZ = -Math.cos(facingAngle) * offset.back * (-1);
    var sideX = Math.cos(facingAngle) * offset.side;
    var sideZ = -Math.sin(facingAngle) * offset.side;

    var targetX = _playerPos.x + backX + sideX;
    var targetZ = _playerPos.z + backZ + sideZ;
    var targetY = _playerPos.y;

    var dest = new THREE.Vector3(targetX, targetY, targetZ);
    var dist = buddy.mesh.position.distanceTo(dest);
    if (dist > 0.3) {
      var dir = new THREE.Vector3().subVectors(dest, buddy.mesh.position).normalize();
      buddy.mesh.position.addScaledVector(dir, BUDDY_SPEED * dt);
    }
  }

  // ── CASEVAC update ─────────────────────────────────────────────────────────────
  function _updateCasevac(dt) {
    if (!_casevacMesh || !_casevacTarget) { return; }
    _casevacTimer += dt;

    // spin rotor
    var rotor = _casevacMesh.userData.rotor;
    if (rotor) { rotor.rotation.y += dt * 12; }

    var targetPos = _casevacTarget.mesh
      ? _casevacTarget.mesh.position.clone().add(new THREE.Vector3(0, 4, 0))
      : (_playerPos ? _playerPos.clone().add(new THREE.Vector3(0, 4, 0)) : null);

    if (!targetPos) { return; }

    var dist = _casevacMesh.position.distanceTo(targetPos);
    if (dist > 0.5) {
      var dir = new THREE.Vector3().subVectors(targetPos, _casevacMesh.position).normalize();
      _casevacMesh.position.addScaledVector(dir, CASEVAC_SPEED * dt);
    } else {
      // arrived — heal target
      if (_casevacTarget.hp !== undefined) {
        _casevacTarget.hp = Math.min(_casevacTarget.maxHp, _casevacTarget.hp + 60);
        _showSitrep('CASEVAC — ' + (_casevacTarget.callsign || 'UNIT') + ' EXTRACTED AND STABILIZED');
      } else {
        _showSitrep('CASEVAC — MEDEVAC COMPLETE');
      }
      // fly away
      _casevacMesh.position.add(new THREE.Vector3(50, 10, 0));
      _scene.remove(_casevacMesh);
      _casevacMesh    = null;
      _casevacTarget  = null;
      _casevacSpawned = false;
    }
  }

  // ── name tag 3D->2D projection ────────────────────────────────────────────────
  function _updateNameTags() {
    if (!_camera) { return; }
    var canvas = document.querySelector('canvas');
    var cw = canvas ? canvas.clientWidth  : window.innerWidth;
    var ch = canvas ? canvas.clientHeight : window.innerHeight;

    var k;
    for (k = 0; k < _buddies.length; k++) {
      var buddy = _buddies[k];
      var tag   = _nameTags[k];
      if (!tag) { continue; }
      if (!buddy || !buddy.mesh) {
        tag.style.display = 'none';
        continue;
      }

      var worldPos = buddy.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0));
      var projected = worldPos.project(_camera);

      // behind camera check
      if (projected.z > 1) {
        tag.style.display = 'none';
        continue;
      }

      var screenX = ( projected.x * 0.5 + 0.5) * cw;
      var screenY = (-projected.y * 0.5 + 0.5) * ch;

      tag.style.display = 'block';
      tag.style.left    = Math.round(screenX - 24) + 'px';
      tag.style.top     = Math.round(screenY - 20) + 'px';
    }
  }

  // ── floating labels update ────────────────────────────────────────────────────
  function _updateFloatingLabels(dt) {
    var i;
    for (i = _floatingLabels.length - 1; i >= 0; i--) {
      var lbl = _floatingLabels[i];
      lbl.life -= dt;
      var top = parseFloat(lbl.el.style.top) + lbl.vy * dt;
      lbl.el.style.top     = top + 'px';
      lbl.el.style.opacity = Math.max(0, lbl.life / 2.0).toString();
      if (lbl.life <= 0) {
        if (lbl.el.parentNode) { lbl.el.parentNode.removeChild(lbl.el); }
        _floatingLabels.splice(i, 1);
      }
    }
  }

  // ── FX mesh update ────────────────────────────────────────────────────────────
  function _updateFX(dt) {
    var i;
    for (i = _fxMeshes.length - 1; i >= 0; i--) {
      var fx = _fxMeshes[i];
      if (!fx.userData || fx.userData.life === undefined) { continue; }
      fx.userData.life -= dt;
      fx.material.opacity = Math.max(0, fx.userData.life / 0.5 * 0.8);
      fx.scale.setScalar(1 + (0.5 - fx.userData.life) * 4);
      if (fx.userData.life <= 0) {
        _scene.remove(fx);
        _fxMeshes.splice(i, 1);
      }
    }
  }

  // ── key handler ───────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key || e.keyCode;
    if (key === 'f' || key === 'F' || key === 70) {
      if (_orderMenuOpen) {
        _closeOrderMenu();
      } else {
        _openOrderMenu();
      }
    }
  }

  // ── public API ────────────────────────────────────────────────────────────────

  function init(opts) {
    opts = opts || {};
    _scene     = opts.scene     || (window.gameScene  ? window.gameScene  : null);
    _camera    = opts.camera    || (window.gameCamera ? window.gameCamera : null);
    _playerPos = opts.playerPos || null;
    _enemies   = opts.enemies   || null;

    _buildHUD();
    _updateRankHUD();
    _updateXPBar();

    document.addEventListener('keydown', _onKeyDown);

    // CPL: spawn first buddy immediately if already at rank
    if (_rankIndex >= 1) { _spawnBuddy(0); }
    if (_rankIndex >= 2) { _spawnBuddy(1); }
  }

  function update(dt, opts) {
    opts = opts || {};

    // allow caller to push fresh references each frame
    if (opts.scene)     { _scene     = opts.scene;     }
    if (opts.camera)    { _camera    = opts.camera;    }
    if (opts.playerPos) { _playerPos = opts.playerPos; }
    if (opts.enemies)   { _enemies   = opts.enemies;   }

    var enemies = _enemies || opts.enemies || [];

    // update promotion banner
    if (_promotionTimer > 0) {
      _promotionTimer -= dt;
      if (_promotionTimer <= 0) {
        _promotionEl.style.display = 'none';
      }
    }

    // update buddy AIs
    var k;
    for (k = 0; k < 2; k++) {
      if (_buddies[k]) {
        _updateBuddy(_buddies[k], k, dt, enemies);
      }
    }

    // priority target timer
    if (_priorityTargetTimer > 0) {
      _priorityTargetTimer -= dt;
      if (_priorityTargetTimer <= 0 && _priorityTarget) {
        if (_priorityTarget.userData) {
          _priorityTarget.userData.priorityTarget   = false;
          _priorityTarget.userData.damageMultiplier = 1;
        }
        _priorityTarget = null;
        _showSitrep('PRIORITY TARGET — DESIGNATION EXPIRED');
      }
    }

    // CASEVAC update
    if (_casevacSpawned) { _updateCasevac(dt); }

    // SITREP interval
    _sitrepTimer += dt;
    if (_sitrepTimer >= SITREP_INTERVAL) {
      _sitrepTimer = 0;
      // send sitrep for each alive buddy
      for (k = 0; k < _buddies.length; k++) {
        if (_buddies[k] && _buddies[k].alive) {
          _sendBuddySitrep(_buddies[k]);
          break;  // one per interval to avoid spamming
        }
      }
    }

    // name tags
    _updateNameTags();

    // floating XP labels
    _updateFloatingLabels(dt);

    // FX meshes
    _updateFX(dt);
  }

  function reset() {
    // remove buddies
    var k;
    for (k = 0; k < 2; k++) {
      _removeBuddy(k);
    }
    _buddies = [];

    // reset rank state
    _kills        = 0;
    _xp           = 0;
    _rankIndex    = 0;
    _rankDownTemp = false;

    // reset abilities
    _mortarUsed          = false;
    _priorityTargetTimer = 0;
    _priorityTarget      = null;
    _casevacSpawned      = false;
    if (_casevacMesh && _scene) { _scene.remove(_casevacMesh); }
    _casevacMesh    = null;
    _casevacTarget  = null;
    _casevacTimer   = 0;

    _currentOrder = 'HOLD FIRE';
    _closeOrderMenu();

    _sitrepTimer    = 0;
    _promotionTimer = 0;

    // clear floating labels
    var i;
    for (i = 0; i < _floatingLabels.length; i++) {
      if (_floatingLabels[i].el.parentNode) {
        _floatingLabels[i].el.parentNode.removeChild(_floatingLabels[i].el);
      }
    }
    _floatingLabels = [];

    // clear FX
    for (i = 0; i < _fxMeshes.length; i++) {
      if (_scene) { _scene.remove(_fxMeshes[i]); }
    }
    _fxMeshes = [];

    _updateRankHUD();
    _updateXPBar();
  }

  // expose helper methods for external modules
  return {
    init:                  init,
    update:                update,
    reset:                 reset,
    registerKill:          registerKill,
    registerObjective:     registerObjective,
    requestMortarSupport:  requestMortarSupport,
    designatePriorityTarget: designatePriorityTarget,
    callCasevac:           callCasevac,
    issueOrder:            _issueOrder,
    killBuddy:             _killBuddy,
    getBuddies:            function () { return _buddies; },
    getRankIndex:          function () { return _rankIndex; },
    getRankAbbr:           function () { return RANKS[_rankIndex].abbr; },
    getKills:              function () { return _kills; },
    getXP:                 function () { return _xp; }
  };

})();
