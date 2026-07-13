window.BankHeist = (function() {
  'use strict';

  var _scene, _camera, _active = false;
  var _hud, _overlay;
  var _group;
  var _keys = {};
  var _time = 0;
  var _playerPos = { x: 0, y: 0, z: 0 };

  // State
  var _vaultStage = 0; // 0=locked,1=drilling,2=bypassed,3=open
  var _drillProgress = 0;
  var _bypassProgress = 0;
  var _moneyBags = [];
  var _bagsCarried = 0;
  var _hostages = [];
  var _customers = [];
  var _guards = [];
  var _swatTimer = 360;
  var _policeTimer = 120;
  var _hp = 100;
  var _gameOver = false, _gameWon = false;
  var _interactCooldown = 0;
  var _drillHold = 0, _bypassHold = 0, _openHold = 0;
  var _releasedHostages = 0;
  var _swatArrived = false;
  var _policeArrived = false;
  var _negotiatorCooldown = 0;
  var _undercoverRevealed = false;
  var _undercoverIdx = -1;
  var _moneyTotal = 0;

  function _makeBox(w, h, d, color, ox, oy, oz) {
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(g, m);
    mesh.position.set(ox || 0, oy || 0, oz || 0);
    _group.add(mesh);
    return mesh;
  }

  function _makeCyl(r, h, color, ox, oy, oz) {
    var g = new THREE.CylinderGeometry(r, r, h, 8);
    var m = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(g, m);
    mesh.position.set(ox || 0, oy || 0, oz || 0);
    _group.add(mesh);
    return mesh;
  }

  function _buildBank() {
    // Marble lobby floor
    _makeBox(30, 0.2, 40, 0x998877, 0, 0, 0);
    // Walls
    _makeBox(30, 5, 0.3, 0x887766, 0, 2.5, -20);
    _makeBox(30, 5, 0.3, 0x887766, 0, 2.5, 20);
    _makeBox(0.3, 5, 40, 0x887766, -15, 2.5, 0);
    _makeBox(0.3, 5, 40, 0x887766, 15, 2.5, 0);
    // Teller counters
    for (var i = -2; i <= 2; i++) {
      _makeBox(2, 1.2, 0.5, 0x776655, i * 4, 0.6, -8);
    }
    // Manager office
    _makeBox(12, 4, 10, 0x665544, -8, 2, 8);
    // Vault room
    _makeBox(15, 5, 12, 0x556677, 5, 2.5, 12);
    // Vault door
    _makeCyl(2.5, 0.4, 0x445566, 5, 2.5, 6.2);
    // Money bags
    var bagColors = [0x557722, 0x558833, 0x447711, 0x669933, 0x446611];
    for (var b = 0; b < 5; b++) {
      var bag = _makeBox(0.8, 0.8, 0.5, bagColors[b], 3 + b * 2, 1.2, 12);
      bag.userData = { type: 'money', value: 50000, carried: false };
      _moneyBags.push(bag);
    }
    // Lighting
    var amb = new THREE.AmbientLight(0xffeedd, 0.6);
    _group.add(amb);
    var dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 5);
    _group.add(dir);
    // PointLight over vault
    var vl = new THREE.PointLight(0x88AAFF, 1, 20);
    vl.position.set(5, 4, 12);
    _group.add(vl);
  }

  function _spawnHostages() {
    for (var i = 0; i < 8; i++) {
      var h = _makeBox(0.5, 1.6, 0.5, 0x886655, -5 + i * 1.5, 0.8, -3);
      h.userData = { type: 'hostage', compliant: true, isStaff: true };
      _hostages.push(h);
    }
    // mark one as undercover
    _undercoverIdx = Math.floor(Math.random() * 8);
    // Customers
    for (var j = 0; j < 15; j++) {
      var c = _makeBox(0.5, 1.6, 0.4, j % 2 === 0 ? 0x887755 : 0x665577,
        -10 + (j % 5) * 3, 0.8, 0 + Math.floor(j / 5) * 3);
      _customers.push(c);
    }
  }

  function _spawnGuards() {
    // Lobby guard
    var g1 = _makeBox(0.6, 1.8, 0.6, 0x334455, -10, 0.9, -15);
    g1.userData = { hp: 80, type: 'guard', phase: 'patrol' };
    _guards.push(g1);
    // Vault guard
    var g2 = _makeBox(0.6, 1.8, 0.6, 0x334455, 5, 0.9, 8);
    g2.userData = { hp: 80, type: 'guard', phase: 'patrol' };
    _guards.push(g2);
  }

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = 'position:fixed;top:10px;left:10px;color:#FFD700;font:bold 14px monospace;background:rgba(0,0,0,0.6);padding:10px;border-radius:4px;z-index:9999;pointer-events:none;';
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    if (!_hud) return;
    var vaultStr = ['NOT CRACKED', 'DRILLING', 'BYPASSED', 'OPEN'][_vaultStage];
    var moneyStr = '$' + _moneyTotal.toLocaleString();
    var policeStr = _swatArrived ? 'SWAT BREACHING' : (_policeArrived ? 'SWAT IN ' + Math.ceil(_swatTimer) + 's' : 'POLICE IN ' + Math.ceil(_policeTimer) + 's');
    _hud.innerHTML = 'BANK HEIST<br>' +
      'VAULT: ' + vaultStr + '<br>' +
      'MONEY: ' + moneyStr + '<br>' +
      'HOSTAGES: ' + (_hostages.length + _customers.length - _releasedHostages) + '/23<br>' +
      policeStr + '<br>' +
      'TIMER: ' + _fmtTime(_time) + '<br>' +
      'HP: ' + _hp;
  }

  function _fmtTime(s) {
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function _showMsg(msg, dur) {
    if (!_overlay) return;
    _overlay.textContent = msg;
    _overlay.style.opacity = '1';
    clearTimeout(_overlay._t);
    _overlay._t = setTimeout(function() { _overlay.style.opacity = '0'; }, (dur || 2000));
  }

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _registerKeys();
  }

  function _registerKeys() {
    document.addEventListener('keydown', _onKey);
  }

  function _onKey(e) {
    var k = e.key.toLowerCase();
    if (!_keys[k]) {
      _keys[k] = performance.now();
    }
    if (k === 'b' && _keys['h'] && performance.now() - _keys['h'] < 400) {
      if (!_active) _start();
    }
    if (k === 'h' && _keys['b'] && performance.now() - _keys['b'] < 400) {
      if (!_active) _start();
    }
    if (k === 'g' && _active && !_gameOver) _throwGrenade();
    if (k === 'n' && _active && !_gameOver) _negotiate();
    if (k === 'f' && _active && !_gameOver) _shootNearestGuard();
  }

  function _start() {
    _active = true;
    _gameOver = false;
    _gameWon = false;
    _hp = 100;
    _time = 0;
    _vaultStage = 0;
    _drillProgress = 0;
    _bypassProgress = 0;
    _moneyTotal = 0;
    _bagsCarried = 0;
    _releasedHostages = 0;
    _swatTimer = 240;
    _policeTimer = 120;
    _swatArrived = false;
    _policeArrived = false;
    _negotiatorCooldown = 0;

    _group = new THREE.Group();
    _scene.add(_group);
    _group.position.set(0, 0, 0);

    _buildBank();
    _spawnHostages();
    _spawnGuards();
    _createHUD();

    _overlay = document.createElement('div');
    _overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#FF4400;font:bold 28px monospace;opacity:0;transition:opacity 0.3s;z-index:10000;pointer-events:none;text-align:center;';
    document.body.appendChild(_overlay);

    _showMsg('BANK HEIST — B+H\nCrack the vault! Watch for police!', 3000);
  }

  function _throwGrenade() {
    _showMsg('GRENADE thrown!', 1000);
    // Damage nearby guards
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g || !g.userData) continue;
      var dx = g.position.x - _playerPos.x, dz = g.position.z - _playerPos.z;
      if (Math.sqrt(dx*dx + dz*dz) < 6) {
        g.userData.hp -= 60;
        if (g.userData.hp <= 0) { _group.remove(g); _guards[i] = null; }
      }
    }
  }

  function _negotiate() {
    if (_negotiatorCooldown > 0) { _showMsg('Negotiator busy...', 1000); return; }
    _negotiatorCooldown = 30;
    // Stalling increases police timer but reduces hostage compliance
    _policeTimer += 30;
    _swatTimer += 20;
    _showMsg('Negotiator stalled! +30s delay', 2000);
  }

  function _shootNearestGuard() {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g || !g.userData) continue;
      var dx = g.position.x - _playerPos.x, dz = g.position.z - _playerPos.z;
      if (Math.sqrt(dx*dx + dz*dz) < 10) {
        g.userData.hp -= 40;
        if (g.userData.hp <= 0) { _group.remove(g); _guards[i] = null; }
        return;
      }
    }
  }

  function _dist2(a, b) {
    var dx = a.x - (b.x || b.position.x), dz = a.z - (b.z || b.position.z);
    return Math.sqrt(dx*dx + dz*dz);
  }

  function update(delta, playerPos) {
    if (!_active || _gameOver) return;
    if (playerPos) { _playerPos.x = playerPos.x; _playerPos.y = playerPos.y; _playerPos.z = playerPos.z; }
    _time += delta;
    if (_negotiatorCooldown > 0) _negotiatorCooldown -= delta;
    if (_interactCooldown > 0) _interactCooldown -= delta;

    // Police timers
    if (!_policeArrived) {
      _policeTimer -= delta;
      if (_policeTimer <= 0) { _policeArrived = true; _showMsg('POLICE HAVE ARRIVED!', 3000); }
    } else if (!_swatArrived) {
      _swatTimer -= delta;
      if (_swatTimer <= 0) {
        _swatArrived = true;
        _showMsg('SWAT IS BREACHING!', 3000);
        // SWAT damage
        _hp -= 30;
      }
    }

    // Guard damage to player
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g || !g.userData) continue;
      if (_dist2(_playerPos, g.position) < 3) _hp -= 5 * delta;
    }

    // Vault cracking
    if (_vaultStage === 0 && _dist2(_playerPos, {x:5, z:6}) < 3 && _keys['e']) {
      _drillHold += delta;
      if (_drillHold >= 40) { _vaultStage = 1; _showMsg('Wall drilled!', 2000); }
    } else { _drillHold = Math.max(0, _drillHold - delta * 0.5); }

    if (_vaultStage === 1 && _dist2(_playerPos, {x:5, z:8}) < 3 && _keys['e']) {
      _bypassHold += delta;
      if (_bypassHold >= 20) { _vaultStage = 2; _showMsg('Electronics bypassed!', 2000); }
    } else { _bypassHold = Math.max(0, _bypassHold - delta * 0.5); }

    if (_vaultStage === 2 && _dist2(_playerPos, {x:5, z:6}) < 3 && _keys['e']) {
      _openHold += delta;
      if (_openHold >= 5) { _vaultStage = 3; _showMsg('VAULT OPEN! Grab the money!', 3000); }
    } else { _openHold = Math.max(0, _openHold - delta * 0.5); }

    // Pick up money
    if (_vaultStage === 3 && _bagsCarried < 3) {
      for (var b = 0; b < _moneyBags.length; b++) {
        var bag = _moneyBags[b];
        if (!bag || bag.userData.carried) continue;
        if (_dist2(_playerPos, bag.position) < 2 && _keys['e'] && _interactCooldown <= 0) {
          bag.userData.carried = true;
          bag.visible = false;
          _bagsCarried++;
          _moneyTotal += 50000;
          _interactCooldown = 1;
          _showMsg('Money bag grabbed! ($' + _moneyTotal.toLocaleString() + ')', 1500);
          break;
        }
      }
    }

    // Release hostage
    if (_keys['r'] && _interactCooldown <= 0) {
      if (_releasedHostages < _hostages.length + _customers.length) {
        _releasedHostages++;
        _policeTimer += 90;
        _swatTimer += 45;
        _interactCooldown = 2;
        _showMsg('Hostage released! Police delay +90s', 2000);
      }
    }

    // Win check: escape via armored truck at back (z > 18 with vault open + money)
    if (_vaultStage === 3 && _bagsCarried >= 3 && _playerPos.z > 18) {
      _gameWon = true;
      _gameOver = true;
      _showMsg('HEIST COMPLETE! $' + _moneyTotal.toLocaleString() + ' secured!', 5000);
    }

    // Lose checks
    if (_hp <= 0) { _hp = 0; _gameOver = true; _showMsg('YOU DIED — HEIST FAILED', 4000); }
    if (_swatArrived && _vaultStage < 3) {
      _gameOver = true;
      _showMsg('SWAT breached — vault not cracked. GAME OVER', 4000);
    }

    _updateHUD();
    delete _keys['e'];
  }

  function reset() {
    _active = false;
    _gameOver = false;
    if (_group && _scene) _scene.remove(_group);
    _group = null;
    _moneyBags = [];
    _hostages = [];
    _customers = [];
    _guards = [];
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_overlay && _overlay.parentNode) _overlay.parentNode.removeChild(_overlay);
    _hud = null;
    _overlay = null;
    _keys = {};
  }

  document.addEventListener('keydown', function(e) {
    _keys[e.key.toLowerCase()] = performance.now();
    if (e.key.toLowerCase() === 'b') {
      var h = _keys['h'];
      if (h && performance.now() - h < 400 && !_active) _start();
    }
    if (e.key.toLowerCase() === 'h') {
      var b = _keys['b'];
      if (b && performance.now() - b < 400 && !_active) _start();
    }
  });
  document.addEventListener('keyup', function(e) { delete _keys[e.key.toLowerCase()]; });

  return { init: init, update: update, reset: reset };
}());
