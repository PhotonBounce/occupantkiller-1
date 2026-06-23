window.SquadTactics = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _squad = [];
  var _commandWheelEl = null;
  var _hudEl = null;
  var _currentCommand = 'DEFEND';
  var _respawnTimers = [];
  var _updateTimer = 0;
  var MEMBER_NAMES = ['BRAVO-1', 'BRAVO-2', 'BRAVO-3'];
  var MEMBER_PITCHES = [230, 280, 320];
  var MAX_SQUAD = 3;
  var FORMATION_OFFSETS = [
    { x: 3, z: 4 }, { x: -3, z: 4 }, { x: 0, z: 6 }
  ];

  function _getEnemies() {
    if (window.Enemies && Enemies.getAll) return Enemies.getAll();
    if (window._enemies) return window._enemies;
    return [];
  }

  function _getPlayerPos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _buildMemberMesh(idx) {
    var group = new THREE.Group();

    // Body
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.9, 0.35),
      new THREE.MeshLambertMaterial({ color: 0x4a5c28 })
    );
    body.position.y = 0.45;
    group.add(body);

    // Head
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xc8a07a })
    );
    head.position.y = 1.1;
    group.add(head);

    // Blue helmet (friendly indicator)
    var helmet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.14, 8),
      new THREE.MeshLambertMaterial({ color: 0x2244AA })
    );
    helmet.position.y = 1.26;
    group.add(helmet);

    // Arms
    var armMat = new THREE.MeshLambertMaterial({ color: 0x4a5c28 });
    var arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), armMat);
    arm1.position.set(0.38, 0.45, 0);
    group.add(arm1);
    var arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), armMat);
    arm2.position.set(-0.38, 0.45, 0);
    group.add(arm2);

    // Legs
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), armMat);
    leg1.position.set(0.14, -0.3, 0);
    group.add(leg1);
    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), armMat);
    leg2.position.set(-0.14, -0.3, 0);
    group.add(leg2);

    // Rifle
    var rifle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.0, 5),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    rifle.rotation.z = Math.PI / 2;
    rifle.position.set(0.5, 0.6, 0.2);
    group.add(rifle);

    // Medic patch on first member
    if (idx === 0) {
      var patch = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.04),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      patch.position.set(0, 0.7, 0.2);
      group.add(patch);
      var cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), new THREE.MeshLambertMaterial({ color: 0xee1111 }));
      cross1.position.set(0, 0.7, 0.22);
      group.add(cross1);
      var cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), new THREE.MeshLambertMaterial({ color: 0xee1111 }));
      cross2.position.set(0, 0.7, 0.22);
      group.add(cross2);
    }

    return group;
  }

  function _spawnMember(idx) {
    var playerPos = _getPlayerPos();
    var off = FORMATION_OFFSETS[idx] || { x: 0, z: 5 };
    var member = {
      mesh: _buildMemberMesh(idx),
      hp: 100,
      maxHp: 100,
      alive: true,
      name: MEMBER_NAMES[idx] || 'BRAVO-' + (idx + 1),
      pitch: MEMBER_PITCHES[idx] || 260,
      idx: idx,
      _target: null,
      _fireTimer: 1.5 + Math.random(),
      _state: 'FOLLOW',
      _healTimer: 0,
      _healTarget: null,
      _isMediac: idx === 0
    };
    member.mesh.position.set(
      playerPos.x + off.x, 0, playerPos.z + off.z
    );
    if (_scene) _scene.add(member.mesh);
    return member;
  }

  function _playVoice(pitch) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = pitch;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  function _showCommandToast(cmd) {
    var el = document.createElement('div');
    el.textContent = 'SQUAD: ' + cmd;
    el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);' +
      'color:#44FFAA;font-family:monospace;font-size:16px;font-weight:bold;' +
      'text-shadow:0 0 8px #00FF88;pointer-events:none;z-index:8000;' +
      'opacity:1;transition:opacity 1.5s,transform 1.5s;';
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translate(-50%,-150%)'; }, 100);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1700);
  }

  function _showCasualtyAlert(name) {
    var el = document.createElement('div');
    el.textContent = name + ' DOWN';
    el.style.cssText = 'position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);' +
      'color:#FF4444;font-family:monospace;font-size:18px;font-weight:bold;' +
      'text-shadow:0 0 12px #FF0000;pointer-events:none;z-index:8001;' +
      'opacity:1;transition:opacity 2s;';
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2200);
  }

  function _createCommandWheel() {
    _commandWheelEl = document.createElement('div');
    _commandWheelEl.id = 'squad-cmd-wheel';
    _commandWheelEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:220px;height:220px;background:rgba(0,0,0,0.85);border:2px solid #44FFAA;border-radius:50%;' +
      'display:none;z-index:9500;pointer-events:all;';

    var commands = [
      { label: 'ATTACK', angle: -90, key: '1' },
      { label: 'DEFEND', angle: 0, key: '2' },
      { label: 'FLANK L', angle: 90, key: '3' },
      { label: 'FLANK R', angle: 180, key: '4' }
    ];
    commands.forEach(function (cmd) {
      var rad = cmd.angle * Math.PI / 180;
      var btn = document.createElement('div');
      btn.style.cssText = 'position:absolute;' +
        'left:' + (110 + Math.cos(rad) * 70 - 30) + 'px;' +
        'top:' + (110 + Math.sin(rad) * 70 - 14) + 'px;' +
        'width:60px;height:28px;' +
        'background:rgba(0,60,30,0.9);border:1px solid #44FFAA;border-radius:3px;' +
        'color:#44FFAA;font-family:monospace;font-size:10px;font-weight:bold;' +
        'display:flex;align-items:center;justify-content:center;cursor:pointer;';
      btn.textContent = '[' + cmd.key + '] ' + cmd.label;
      btn.addEventListener('click', function () {
        issueCommand(cmd.label.replace(' ', '_'));
        _closeCommandWheel();
      });
      _commandWheelEl.appendChild(btn);
    });

    document.body.appendChild(_commandWheelEl);
  }

  function _openCommandWheel() {
    if (_commandWheelEl) _commandWheelEl.style.display = 'block';
  }

  function _closeCommandWheel() {
    if (_commandWheelEl) _commandWheelEl.style.display = 'none';
  }

  function _createSquadHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'squad-tactics-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:100px;left:10px;background:rgba(0,0,0,0.7);' +
      'border:1px solid #44FFAA;border-radius:4px;padding:6px 10px;' +
      'color:#fff;font-family:monospace;font-size:11px;pointer-events:none;z-index:4000;';
    document.body.appendChild(_hudEl);
  }

  function _updateSquadHUD() {
    if (!_hudEl) return;
    var html = '<div style="color:#44FFAA;margin-bottom:4px;">SQUAD [Z=CMD]</div>';
    for (var i = 0; i < MAX_SQUAD; i++) {
      var m = _squad[i];
      if (!m) {
        // Check if respawning
        var rt = _respawnTimers[i];
        html += '<div style="color:#555;">' + MEMBER_NAMES[i] + ' — RESPAWNING</div>';
        continue;
      }
      var hpPct = m.alive ? Math.max(0, m.hp / m.maxHp * 100) : 0;
      var hpColor = hpPct > 60 ? '#44ff44' : hpPct > 30 ? '#ffaa00' : '#ff4444';
      var status = !m.alive ? '<span style="color:#888">DOWN</span>' : '<span style="color:' + hpColor + '">' + m._state + '</span>';
      html += '<div style="margin-bottom:3px;">' +
        '<span style="color:#ccc">' + m.name + '</span> ' + status + '<br>' +
        '<div style="width:80px;height:4px;background:#333;display:inline-block;">' +
          '<div style="width:' + Math.round(hpPct) + '%;height:100%;background:' + hpColor + ';"></div>' +
        '</div>' +
      '</div>';
    }
    _hudEl.innerHTML = html;
  }

  function issueCommand(cmd) {
    _currentCommand = cmd;
    _showCommandToast(cmd);
    _squad.forEach(function (m, idx) {
      if (!m || !m.alive) return;
      _playVoice(m.pitch);
      switch (cmd) {
        case 'ATTACK':
          m._state = 'ATTACK';
          break;
        case 'DEFEND':
          m._state = 'DEFEND';
          m._holdPos = m.mesh.position.clone();
          break;
        case 'FLANK_L':
          m._state = 'FLANK';
          m._flankSide = -1;
          break;
        case 'FLANK_R':
          m._state = 'FLANK';
          m._flankSide = 1;
          break;
      }
    });
  }

  function _nearestEnemy(pos) {
    var enemies = _getEnemies();
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      var d = e.mesh.position.distanceTo(pos);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  function _memberDie(m) {
    m.alive = false;
    m._state = 'DOWN';
    // Fall animation
    if (m.mesh) m.mesh.rotation.z = Math.PI / 2;
    _showCasualtyAlert(m.name);

    // Queue respawn
    var idx = m.idx;
    setTimeout(function () {
      if (!_scene) return;
      // Remove old mesh
      if (m.mesh && _scene) _scene.remove(m.mesh);
      // Spawn new member
      var newMember = _spawnMember(idx);
      _squad[idx] = newMember;
    }, 45000);
  }

  function _memberHeal(medic, target) {
    medic._state = 'HEALING';
    medic._healTarget = target;
    medic._healTimer = 5;
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _squad = [];
    _respawnTimers = [];

    // Spawn initial squad
    for (var i = 0; i < MAX_SQUAD; i++) {
      _squad.push(_spawnMember(i));
    }

    _createCommandWheel();
    _createSquadHUD();

    // Key bindings
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyZ' && !e.altKey) {
        if (_commandWheelEl && _commandWheelEl.style.display === 'block') {
          _closeCommandWheel();
        } else {
          _openCommandWheel();
        }
      }
      // Number keys for commands
      if (_commandWheelEl && _commandWheelEl.style.display === 'block') {
        if (e.code === 'Digit1') { issueCommand('ATTACK'); _closeCommandWheel(); }
        if (e.code === 'Digit2') { issueCommand('DEFEND'); _closeCommandWheel(); }
        if (e.code === 'Digit3') { issueCommand('FLANK_L'); _closeCommandWheel(); }
        if (e.code === 'Digit4') { issueCommand('FLANK_R'); _closeCommandWheel(); }
      }
      // Suppression order
      if (e.code === 'KeyZ' && e.altKey) {
        // Find enemy in crosshair
        if (!_camera) return;
        var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
        var enemies = _getEnemies();
        var bestAngle = 0.1;
        var suppressTarget = null;
        for (var i = 0; i < enemies.length; i++) {
          var en = enemies[i];
          if (!en || !en.alive || !en.mesh) continue;
          var toEnemy = new THREE.Vector3().subVectors(en.mesh.position, _camera.position).normalize();
          var dot = dir.dot(toEnemy);
          if (dot > bestAngle && en.mesh.position.distanceTo(_camera.position) < 50) {
            bestAngle = dot;
            suppressTarget = en;
          }
        }
        if (suppressTarget) {
          _squad.forEach(function (m) {
            if (!m || !m.alive) return;
            m._state = 'SUPPRESS';
            m._suppressTarget = suppressTarget;
            m._suppressTimer = 6;
          });
          _showCommandToast('SUPPRESS TARGET');
        }
      }
    });
  }

  function update(dt) {
    if (!_scene || !_camera) return;
    var playerPos = _getPlayerPos();
    var time = Date.now() * 0.001;

    _updateTimer -= dt;

    for (var i = 0; i < _squad.length; i++) {
      var m = _squad[i];
      if (!m || !m.alive) continue;

      // HP bar always faces camera
      var off = FORMATION_OFFSETS[i] || { x: 0, z: 5 };

      switch (m._state) {
        case 'FOLLOW':
        case 'DEFEND': {
          var targetPos;
          if (m._state === 'DEFEND' && m._holdPos) {
            targetPos = m._holdPos;
          } else {
            // Formation following
            var fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(_camera.quaternion);
            fwd.y = 0; fwd.normalize();
            var right = new THREE.Vector3(1, 0, 0).applyQuaternion(_camera.quaternion);
            right.y = 0; right.normalize();
            targetPos = playerPos.clone()
              .addScaledVector(fwd, off.z)
              .addScaledVector(right, off.x);
            targetPos.y = 0;
          }
          var toTarget = new THREE.Vector3().subVectors(targetPos, m.mesh.position);
          if (toTarget.length() > 1.5) {
            toTarget.normalize();
            m.mesh.position.addScaledVector(toTarget, 3.5 * dt);
            m.mesh.lookAt(targetPos.x, m.mesh.position.y, targetPos.z);
          }

          // Seek cover if enemy near
          if (_updateTimer <= 0) {
            var nearEnemy = _nearestEnemy(m.mesh.position);
            if (nearEnemy && nearEnemy.mesh.position.distanceTo(m.mesh.position) < 25) {
              m._state = 'COVER_FIRE';
              m._target = nearEnemy;
            }
          }
          break;
        }

        case 'ATTACK': {
          var enemy = _nearestEnemy(m.mesh.position);
          if (enemy && enemy.mesh) {
            m._target = enemy;
            var toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, m.mesh.position);
            var dist = toEnemy.length();
            if (dist > 8) {
              toEnemy.normalize();
              m.mesh.position.addScaledVector(toEnemy, 4 * dt);
            }
            m.mesh.lookAt(enemy.mesh.position.x, m.mesh.position.y, enemy.mesh.position.z);

            // Fire
            m._fireTimer -= dt;
            if (m._fireTimer <= 0) {
              m._fireTimer = 1.5 + Math.random();
              if (Math.random() < 0.65 && dist < 30) {
                // Hit
                if (enemy.takeDamage) enemy.takeDamage(30);
                else if (enemy.hp !== undefined) enemy.hp -= 30;
              }
            }
          } else {
            m._state = 'FOLLOW';
          }
          break;
        }

        case 'FLANK': {
          var side = m._flankSide || 1;
          var toPlayer = new THREE.Vector3().subVectors(playerPos, m.mesh.position);
          var flankDir = new THREE.Vector3(-toPlayer.z * side, 0, toPlayer.x * side).normalize();
          m.mesh.position.addScaledVector(flankDir, 5 * dt);
          var fen = _nearestEnemy(m.mesh.position);
          if (fen) {
            m.mesh.lookAt(fen.mesh.position.x, m.mesh.position.y, fen.mesh.position.z);
            m._fireTimer -= dt;
            if (m._fireTimer <= 0) {
              m._fireTimer = 1.2;
              if (Math.random() < 0.65) {
                if (fen.takeDamage) fen.takeDamage(30);
                else if (fen.hp !== undefined) fen.hp -= 30;
              }
            }
          }
          break;
        }

        case 'COVER_FIRE': {
          if (!m._target || !m._target.alive) {
            m._state = 'FOLLOW';
            break;
          }
          var tgt = m._target;
          // Stay at cover distance (8-12 units)
          var toTgt = new THREE.Vector3().subVectors(tgt.mesh.position, m.mesh.position);
          var tgtDist = toTgt.length();
          if (tgtDist > 14) {
            toTgt.normalize();
            m.mesh.position.addScaledVector(toTgt, 3 * dt);
          } else if (tgtDist < 8) {
            toTgt.normalize();
            m.mesh.position.addScaledVector(toTgt, -2 * dt);
          }
          m.mesh.lookAt(tgt.mesh.position.x, m.mesh.position.y, tgt.mesh.position.z);
          m._fireTimer -= dt;
          if (m._fireTimer <= 0) {
            m._fireTimer = 1.5 + Math.random() * 0.5;
            if (Math.random() < 0.6 && tgtDist < 30) {
              if (tgt.takeDamage) tgt.takeDamage(30);
              else if (tgt.hp !== undefined) tgt.hp -= 30;
              if (!tgt.alive) { m._state = 'FOLLOW'; }
            }
          }
          break;
        }

        case 'SUPPRESS': {
          m._suppressTimer -= dt;
          if (!m._suppressTarget || !m._suppressTarget.alive || m._suppressTimer <= 0) {
            m._state = 'FOLLOW';
            m._suppressTarget = null;
            break;
          }
          var st = m._suppressTarget;
          m.mesh.lookAt(st.mesh.position.x, m.mesh.position.y, st.mesh.position.z);
          m._fireTimer -= dt;
          if (m._fireTimer <= 0) {
            m._fireTimer = 0.4; // rapid suppression fire
            if (st.mesh) {
              st._suppressed = true;
              st._suppressedTimer = 2;
            }
          }
          break;
        }

        case 'HEALING': {
          if (!m._healTarget || m._healTimer <= 0) {
            m._state = 'FOLLOW';
            m._healTarget = null;
            break;
          }
          // Move to target
          var ht = m._healTarget;
          if (ht && ht.mesh) {
            var toHT = new THREE.Vector3().subVectors(ht.mesh.position, m.mesh.position);
            if (toHT.length() > 2) {
              toHT.normalize();
              m.mesh.position.addScaledVector(toHT, 4 * dt);
            } else {
              ht.hp = Math.min(ht.maxHp, ht.hp + 5 * dt);
              m._healTimer -= dt;
            }
            m.mesh.lookAt(ht.mesh.position.x, m.mesh.position.y, ht.mesh.position.z);
          }
          break;
        }
      }

      // Medic logic — check injured squad members
      if (m._isMediac && m._state !== 'HEALING') {
        for (var j = 0; j < _squad.length; j++) {
          var other = _squad[j];
          if (!other || !other.alive || other === m) continue;
          if (other.hp < 40) {
            _memberHeal(m, other);
            break;
          }
        }
      }

      // Check if member died
      if (m.hp <= 0 && m.alive) {
        _memberDie(m);
      }
    }

    if (_updateTimer <= 0) _updateTimer = 1.0;

    _updateSquadHUD();
  }

  function getSquad() { return _squad; }

  function reset() {
    for (var i = 0; i < _squad.length; i++) {
      var m = _squad[i];
      if (m && m.mesh && _scene) _scene.remove(m.mesh);
    }
    _squad = [];
    if (_commandWheelEl && _commandWheelEl.parentNode) {
      _commandWheelEl.parentNode.removeChild(_commandWheelEl);
    }
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _commandWheelEl = null;
    _hudEl = null;
  }

  return { init: init, update: update, issueCommand: issueCommand, getSquad: getSquad, reset: reset };
})();
