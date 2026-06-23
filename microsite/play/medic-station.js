// medic-station.js — Deployable field hospital and healing mechanics for Three.js FPS
// Browser-based — IIFE, all var (no let/const), Three.js as global THREE
//
// Public API:
//   MedicStation.init(scene, camera)
//   MedicStation.update(delta)
//   MedicStation.deployTent()
//   MedicStation.applyBandage()
//   MedicStation.adrenalineShot()
//   MedicStation.reset()

window.MedicStation = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants
  var MAX_TENTS          = 2;
  var TENT_HP_MAX        = 80;
  var HEAL_RADIUS        = 5;
  var HEAL_RADIUS_SQ     = HEAL_RADIUS * HEAL_RADIUS;
  var HEAL_RATE          = 8;       // HP/sec
  var PLAYER_HP_MAX      = 100;
  var BANDAGE_HP         = 40;
  var BANDAGE_APPLY_TIME = 2.5;     // seconds
  var BANDAGE_PER_TENT   = 3;
  var ADRENALINE_SPEED   = 1.5;
  var ADRENALINE_HP      = 20;
  var ADRENALINE_DUR     = 8;       // seconds
  var ADRENALINE_CD      = 60;      // seconds
  var SUPPLY_DROP_DUR    = 4;       // seconds for parachute to land
  var INTEL_BONUS        = 100;
  var CROSS_COLOR        = 0xff2222;
  var CANVAS_COLOR       = 0x2d6a2d;
  var POLE_COLOR         = 0x8b6914;
  var CROSS_ICON_COLOR   = 0x00ff44;
  var BLOOD_VIGNETTE_HP  = 40;
  var CROSS_PULSE_SPEED  = 3.0;

  // ─────────────────────────────────────────────── state
  var _scene         = null;
  var _camera        = null;
  var _tents         = [];    // array of tent objects
  var _playerHP      = 100;
  var _bandageCount  = 0;     // global bandage reserve (sum across tents)
  var _bandaging     = false;
  var _bandageTimer  = 0;
  var _adrenalineActive  = false;
  var _adrenalineTimer   = 0;
  var _adrenalineCd      = 0;
  var _supplyDrops   = [];    // active parachute animations
  var _keysDown      = {};
  var _keyPressed    = {};    // single-frame edge
  var _time          = 0;

  // DOM
  var _bloodVig      = null;
  var _bandageHud    = null;
  var _adrenalineHud = null;
  var _progressBar   = null;
  var _progressFill  = null;
  var _toast         = null;

  // ─────────────────────────────────────────────── DOM helpers
  function _el(id, tag, styles, parent) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag || 'div');
      el.id = id;
      (parent || document.body).appendChild(el);
    }
    Object.assign(el.style, styles || {});
    return el;
  }

  function _createHUD() {
    // Blood vignette overlay
    _bloodVig = _el('ms-bloodVig', 'div', {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '4000',
      background: 'radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.0) 100%)',
      opacity: '0', transition: 'opacity 0.3s'
    });

    // Bandage count HUD
    _bandageHud = _el('ms-bandageHud', 'div', {
      position: 'fixed', bottom: '80px', left: '18px',
      fontFamily: 'monospace', fontSize: '15px', color: '#fff',
      background: 'rgba(0,0,0,0.65)', padding: '6px 12px',
      borderRadius: '6px', border: '1px solid #00ff44',
      zIndex: '3100', pointerEvents: 'none',
      letterSpacing: '1px'
    });

    // Adrenaline cooldown HUD
    _adrenalineHud = _el('ms-adrenalineHud', 'div', {
      position: 'fixed', bottom: '110px', left: '18px',
      fontFamily: 'monospace', fontSize: '13px', color: '#ffaa00',
      background: 'rgba(0,0,0,0.65)', padding: '5px 10px',
      borderRadius: '6px', border: '1px solid #ffaa00',
      zIndex: '3100', pointerEvents: 'none',
      letterSpacing: '1px'
    });

    // Bandage progress bar
    var pbWrap = _el('ms-progressWrap', 'div', {
      position: 'fixed', bottom: '140px', left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.75)', padding: '6px 14px',
      borderRadius: '8px', display: 'none',
      zIndex: '3200', pointerEvents: 'none', minWidth: '180px'
    });
    var pbLabel = document.createElement('div');
    pbLabel.style.cssText = 'color:#fff;font-family:monospace;font-size:12px;text-align:center;margin-bottom:4px;letter-spacing:1px;';
    pbLabel.textContent = 'APPLYING BANDAGE...';
    pbWrap.appendChild(pbLabel);
    var pbTrack = document.createElement('div');
    pbTrack.style.cssText = 'width:160px;height:8px;background:#333;border-radius:4px;overflow:hidden;';
    _progressFill = document.createElement('div');
    _progressFill.style.cssText = 'height:100%;width:0%;background:#00ff44;border-radius:4px;transition:width 0.05s;';
    pbTrack.appendChild(_progressFill);
    pbWrap.appendChild(pbTrack);
    _progressBar = pbWrap;

    // Toast messages
    _toast = _el('ms-toast', 'div', {
      position: 'fixed', top: '22%', left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace', fontSize: '16px', color: '#00ff44',
      background: 'rgba(0,0,0,0.80)', padding: '8px 22px',
      borderRadius: '8px', border: '1px solid #00ff44',
      zIndex: '5100', pointerEvents: 'none', display: 'none',
      letterSpacing: '1.5px', textAlign: 'center'
    });
  }

  function _showToast(msg, color, dur) {
    if (!_toast) return;
    _toast.textContent = msg;
    _toast.style.color = color || '#00ff44';
    _toast.style.borderColor = color || '#00ff44';
    _toast.style.display = 'block';
    clearTimeout(_toast._t);
    _toast._t = setTimeout(function () { _toast.style.display = 'none'; }, (dur || 2000));
  }

  function _updateHUD() {
    if (_bandageHud) {
      var total = _getTotalBandages();
      _bandageHud.innerHTML = '&#10010; BANDAGES: ' + total;
    }
    if (_adrenalineHud) {
      if (_adrenalineActive) {
        _adrenalineHud.textContent = 'ADRENALINE: ' + Math.ceil(_adrenalineTimer) + 's';
        _adrenalineHud.style.color = '#ff6600';
      } else if (_adrenalineCd > 0) {
        _adrenalineHud.textContent = 'ALT+M CD: ' + Math.ceil(_adrenalineCd) + 's';
        _adrenalineHud.style.color = '#888';
      } else {
        _adrenalineHud.textContent = 'ALT+M: ADRENALINE READY';
        _adrenalineHud.style.color = '#ffaa00';
      }
    }
    // Blood vignette
    if (_bloodVig) {
      if (_playerHP < BLOOD_VIGNETTE_HP) {
        var intensity = 1.0 - (_playerHP / BLOOD_VIGNETTE_HP);
        var alpha = intensity * 0.7;
        _bloodVig.style.background = 'radial-gradient(ellipse at center, transparent 30%, rgba(160,0,0,' + alpha + ') 100%)';
        _bloodVig.style.opacity = '1';
      } else {
        _bloodVig.style.opacity = '0';
      }
    }
    // Progress bar
    if (_progressBar) {
      if (_bandaging) {
        _progressBar.style.display = 'block';
        var pct = (_bandageTimer / BANDAGE_APPLY_TIME) * 100;
        _progressFill.style.width = pct + '%';
      } else {
        _progressBar.style.display = 'none';
      }
    }
  }

  // ─────────────────────────────────────────────── tent mesh building
  function _buildTentMesh() {
    var group = new THREE.Group();

    // Canvas roof — cone (pyramid-ish with 4 segments)
    var roofGeo = new THREE.ConeGeometry(2.0, 1.8, 4);
    var roofMat = new THREE.MeshLambertMaterial({ color: CANVAS_COLOR, side: THREE.DoubleSide });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.3;
    group.add(roof);

    // Floor / base
    var floorGeo = new THREE.BoxGeometry(3.6, 0.08, 3.6);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x5a4a1a });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.04;
    group.add(floor);

    // Walls (4 sides, leave front open for entry)
    var wallMat = new THREE.MeshLambertMaterial({ color: CANVAS_COLOR, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });

    // Back wall
    var backWall = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.5), wallMat);
    backWall.position.set(0, 0.75, -1.8);
    group.add(backWall);

    // Left wall
    var leftWall = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.5), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-1.8, 0.75, 0);
    group.add(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.5), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(1.8, 0.75, 0);
    group.add(rightWall);

    // Front wall (partial — two half-panels)
    var frontLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), wallMat);
    frontLeft.rotation.y = Math.PI;
    frontLeft.position.set(-1.3, 0.75, 1.8);
    group.add(frontLeft);

    var frontRight = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), wallMat);
    frontRight.rotation.y = Math.PI;
    frontRight.position.set(1.3, 0.75, 1.8);
    group.add(frontRight);

    // Support poles (4 corners)
    var poleMat = new THREE.MeshLambertMaterial({ color: POLE_COLOR });
    var polePositions = [
      [-1.7, -1.7], [-1.7, 1.7], [1.7, -1.7], [1.7, 1.7]
    ];
    for (var pi = 0; pi < polePositions.length; pi++) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 6), poleMat);
      pole.position.set(polePositions[pi][0], 1.1, polePositions[pi][1]);
      group.add(pole);
    }

    // Red cross on front face — vertical and horizontal bars
    var crossMat = new THREE.MeshBasicMaterial({ color: CROSS_COLOR, side: THREE.DoubleSide });

    var crossV = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.7), crossMat);
    crossV.rotation.y = Math.PI;
    crossV.position.set(0, 0.9, 1.81);
    group.add(crossV);

    var crossH = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), crossMat);
    crossH.rotation.y = Math.PI;
    crossH.position.set(0, 0.9, 1.82);
    group.add(crossH);

    // Floating cross icon (green, pulses when healing)
    var iconGeo = new THREE.PlaneGeometry(0.3, 0.3);
    var iconMat = new THREE.MeshBasicMaterial({ color: CROSS_ICON_COLOR, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    var iconCrossV = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.42), iconMat);
    var iconCrossH = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.12), iconMat);

    var iconGroup = new THREE.Group();
    iconGroup.add(iconCrossV);
    iconGroup.add(iconCrossH);
    iconGroup.position.set(0, 3.4, 0);
    iconGroup._isHealIcon = true;
    iconGroup._baseMat = iconMat;
    group.add(iconGroup);
    group._healIcon = iconGroup;

    // Collision / radius helper (invisible)
    group._tentHP = TENT_HP_MAX;
    group._bandages = BANDAGE_PER_TENT;
    group._healIcon = iconGroup;
    group._collapsed = false;

    return group;
  }

  // ─────────────────────────────────────────────── supply drop (parachute)
  function _buildParachuteMesh() {
    var group = new THREE.Group();

    // Box (supplies)
    var boxMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), boxMat);
    box.position.y = 0;
    group.add(box);

    // Parachute canopy
    var chuteMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    var chute = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), chuteMat);
    chute.position.y = 2.0;
    group.add(chute);

    // Parachute lines (simple rods)
    var lineMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    var lineOffsets = [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]];
    for (var li = 0; li < lineOffsets.length; li++) {
      var lineGeo = new THREE.CylinderGeometry(0.01, 0.01, 2.0, 3);
      var lineMesh = new THREE.Mesh(lineGeo, lineMat);
      // Tilt to connect box to canopy
      lineMesh.position.set(lineOffsets[li][0] * 0.5, 1.0, lineOffsets[li][1] * 0.5);
      lineMesh.rotation.z = lineOffsets[li][0] * 0.35;
      lineMesh.rotation.x = lineOffsets[li][1] * 0.35;
      group.add(lineMesh);
    }

    return group;
  }

  // ─────────────────────────────────────────────── smoke puff
  function _spawnSmokePuff(pos) {
    if (!_scene) return;
    var particles = [];
    for (var si = 0; si < 14; si++) {
      var geo = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 5, 5);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x888888, transparent: true, opacity: 0.6 + Math.random() * 0.3
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.y += Math.random() * 1.5;
      _scene.add(mesh);
      particles.push({
        mesh: mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.2,
          (Math.random() - 0.5) * 1.5
        ),
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0,
        mat: mat
      });
    }
    _smokeParticles = _smokeParticles.concat(particles);
  }

  var _smokeParticles = [];

  function _updateSmoke(dt) {
    for (var si = _smokeParticles.length - 1; si >= 0; si--) {
      var sp = _smokeParticles[si];
      sp.life += dt;
      sp.mesh.position.addScaledVector(sp.vel, dt);
      sp.vel.y += dt * 0.3;
      var t = sp.life / sp.maxLife;
      sp.mat.opacity = (1.0 - t) * 0.55;
      if (sp.life >= sp.maxLife) {
        _scene.remove(sp.mesh);
        _smokeParticles.splice(si, 1);
      }
    }
  }

  // ─────────────────────────────────────────────── helpers
  function _getPlayerPos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return dx * dx + dz * dz;
  }

  function _getTotalBandages() {
    var sum = 0;
    for (var ti = 0; ti < _tents.length; ti++) {
      sum += _tents[ti].mesh._bandages;
    }
    return sum;
  }

  function _nearestTentWith(condition) {
    var ppos = _getPlayerPos();
    var best = null;
    var bestD = Infinity;
    for (var ti = 0; ti < _tents.length; ti++) {
      var t = _tents[ti];
      if (!condition(t)) continue;
      var d = _dist2(ppos, t.mesh.position);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  function _getSquadMembers() {
    if (window.SquadTactics && SquadTactics.getSquad) return SquadTactics.getSquad();
    if (window._squadMembers) return window._squadMembers;
    return [];
  }

  function _getSurrenderedEnemies() {
    if (window.SurrenderSystem && SurrenderSystem.getSurrendered) return SurrenderSystem.getSurrendered();
    if (window._surrenderedEnemies) return window._surrenderedEnemies;
    return [];
  }

  function _addScore(n) {
    if (window.ComboSystem && ComboSystem.addScore) { ComboSystem.addScore(n); return; }
    if (window._score !== undefined) { window._score += n; }
  }

  function _addIntel(n) {
    if (window.IntelSystem && IntelSystem.addIntel) { IntelSystem.addIntel(n); return; }
    if (window._intelPoints !== undefined) { window._intelPoints += n; }
  }

  function _applySpeedMult(m) {
    if (window._moveSpeedMult !== undefined) { window._moveSpeedMult = m; return; }
    // fallback — expose for movement system to read
    window._medicSpeedMult = m;
  }

  // ─────────────────────────────────────────────── wounded enemies near tent
  function _updateWoundedInteract() {
    if (!_keyPressed['F']) return;
    var ppos = _getPlayerPos();

    // First check: bandage self (priority if HP low and near a tent with bandages)
    // (handled in applyBandage, keyed to F when bandaging prompt shows)
    // Second check: interrogate surrendered enemy near tent
    var surrendered = _getSurrenderedEnemies();
    for (var si = 0; si < surrendered.length; si++) {
      var enemy = surrendered[si];
      var epos = enemy.mesh ? enemy.mesh.position : enemy.position;
      if (!epos) continue;
      // Must be near a tent
      var nearTent = false;
      for (var ti = 0; ti < _tents.length; ti++) {
        if (_dist2(epos, _tents[ti].mesh.position) <= HEAL_RADIUS_SQ) { nearTent = true; break; }
      }
      if (!nearTent) continue;
      if (_dist2(ppos, epos) <= 9) { // within 3 units of enemy
        _addIntel(INTEL_BONUS);
        _addScore(INTEL_BONUS);
        _showToast('+' + INTEL_BONUS + ' INTEL — PRISONER INTERROGATED', '#ffd700');
        // Mark as interrogated so it doesn't fire again
        enemy._interrogated = true;
        // Remove from surrendered list if possible
        if (SurrenderSystem && SurrenderSystem.removeSurrendered) {
          SurrenderSystem.removeSurrendered(enemy);
        }
        return;
      }
    }
  }

  // ─────────────────────────────────────────────── healing aura
  function _updateHealingAura(dt) {
    var ppos = _getPlayerPos();
    var anyHealing = false;

    for (var ti = 0; ti < _tents.length; ti++) {
      var tent = _tents[ti];
      if (tent.mesh._collapsed) continue;
      var tpos = tent.mesh.position;

      var healing = false;

      // Heal player
      if (_dist2(ppos, tpos) <= HEAL_RADIUS_SQ) {
        if (_playerHP < PLAYER_HP_MAX) {
          _playerHP = Math.min(PLAYER_HP_MAX, _playerHP + HEAL_RATE * dt);
          window._playerHP = _playerHP;
          healing = true;
        }
        anyHealing = true;
      }

      // Heal squad members
      var squad = _getSquadMembers();
      for (var si = 0; si < squad.length; si++) {
        var member = squad[si];
        var mpos = member.mesh ? member.mesh.position : member.position;
        if (!mpos) continue;
        if (_dist2(mpos, tpos) <= HEAL_RADIUS_SQ) {
          if (member.hp !== undefined && member.hp < PLAYER_HP_MAX) {
            member.hp = Math.min(PLAYER_HP_MAX, member.hp + HEAL_RATE * dt);
          }
          healing = true;
        }
      }

      // Pulse icon
      if (tent.mesh._healIcon) {
        var icon = tent.mesh._healIcon;
        icon.rotation.y = _time * 1.2;
        if (healing) {
          var pulse = 0.85 + 0.15 * Math.sin(_time * CROSS_PULSE_SPEED);
          icon.scale.setScalar(pulse);
          icon._baseMat.opacity = 0.7 + 0.3 * Math.sin(_time * CROSS_PULSE_SPEED);
        } else {
          icon.scale.setScalar(1.0);
          icon._baseMat.opacity = 0.6;
        }
      }
    }
    return anyHealing;
  }

  // ─────────────────────────────────────────────── supply drop update
  function _updateSupplyDrops(dt) {
    for (var si = _supplyDrops.length - 1; si >= 0; si--) {
      var drop = _supplyDrops[si];
      drop.elapsed += dt;
      var t = Math.min(drop.elapsed / SUPPLY_DROP_DUR, 1.0);
      // Fall from sky height to ground
      drop.mesh.position.y = drop.startY * (1.0 - t) + 0.3;
      // Swing the parachute slightly
      drop.mesh.rotation.z = Math.sin(drop.elapsed * 2.0) * 0.08;

      if (t >= 1.0) {
        // Landed — add bandages to nearest tent or global reserve
        var landed = drop.mesh.position;
        var nearTent = null;
        var nearDist = Infinity;
        for (var ti = 0; ti < _tents.length; ti++) {
          var d = _dist2(landed, _tents[ti].mesh.position);
          if (d < nearDist) { nearDist = d; nearTent = _tents[ti]; }
        }
        if (nearTent) {
          nearTent.mesh._bandages += 3;
          _showToast('+3 BANDAGES DELIVERED!', '#00ff44');
        } else {
          _bandageCount += 3;
          _showToast('+3 BANDAGES IN RESERVE', '#00ff44');
        }
        _scene.remove(drop.mesh);
        _supplyDrops.splice(si, 1);
      }
    }
  }

  // ─────────────────────────────────────────────── tent collapse
  function _collapseTent(tent) {
    if (tent.mesh._collapsed) return;
    tent.mesh._collapsed = true;
    _spawnSmokePuff(tent.mesh.position.clone());
    // Tilt the tent sideways
    tent.mesh.rotation.z = 0.6;
    tent.mesh.rotation.x = 0.3;
    tent.mesh.position.y -= 0.3;
    _showToast('FIELD HOSPITAL DESTROYED!', '#ff4444');
  }

  // ─────────────────────────────────────────────── damage interface
  function damageTent(tent, amount) {
    if (!tent || tent.mesh._collapsed) return;
    tent.mesh._tentHP -= amount;
    if (tent.mesh._tentHP <= 0) {
      tent.mesh._tentHP = 0;
      _collapseTent(tent);
    }
  }

  // expose so enemy systems can call it
  function _registerTentDamageHook() {
    window._medicTents = _tents;
    window._damageMedicTent = damageTent;
  }

  // ─────────────────────────────────────────────── key events
  function _onKeyDown(e) {
    _keysDown[e.key] = true;
    _keyPressed[e.key] = true;
  }
  function _onKeyUp(e) {
    _keysDown[e.key] = false;
  }

  // ─────────────────────────────────────────────── public API
  function deployTent() {
    if (!_scene || !_camera) return;
    var ppos = _getPlayerPos();

    // Remove oldest tent if at max
    if (_tents.length >= MAX_TENTS) {
      var oldest = _tents.shift();
      _scene.remove(oldest.mesh);
    }

    var tentMesh = _buildTentMesh();
    tentMesh.position.set(
      ppos.x + Math.sin(_camera.rotation.y) * -2,
      0,
      ppos.z + Math.cos(_camera.rotation.y) * -2
    );
    _scene.add(tentMesh);

    _tents.push({ mesh: tentMesh });
    _registerTentDamageHook();
    _showToast('FIELD HOSPITAL DEPLOYED  [F=BANDAGE]  [CTRL+M=SUPPLY]', '#00ff44', 3000);
  }

  function applyBandage() {
    if (_bandaging) return; // already bandaging

    // Find a tent nearby with bandages
    var ppos = _getPlayerPos();
    var sourceTent = null;

    // Check tents first
    for (var ti = 0; ti < _tents.length; ti++) {
      var t = _tents[ti];
      if (!t.mesh._collapsed && t.mesh._bandages > 0) {
        if (_dist2(ppos, t.mesh.position) <= HEAL_RADIUS_SQ) {
          sourceTent = t;
          break;
        }
      }
    }

    // Fall back to global reserve
    if (!sourceTent && _bandageCount <= 0) {
      _showToast('NO BANDAGES AVAILABLE', '#ff4444');
      return;
    }

    if (_playerHP >= PLAYER_HP_MAX) {
      _showToast('HP IS FULL', '#aaa');
      return;
    }

    _bandaging = true;
    _bandageTimer = 0;
    _bandageSource = sourceTent;

    if (sourceTent) {
      sourceTent.mesh._bandages -= 1;
    } else {
      _bandageCount -= 1;
    }
    _showToast('APPLYING BANDAGE...', '#ffff00', 3000);
  }

  var _bandageSource = null;

  function _finishBandage() {
    _bandaging = false;
    _bandageSource = null;
    _playerHP = Math.min(PLAYER_HP_MAX, _playerHP + BANDAGE_HP);
    window._playerHP = _playerHP;
    _showToast('+' + BANDAGE_HP + ' HP — BANDAGE APPLIED', '#00ff44');
  }

  function adrenalineShot() {
    if (_adrenalineActive) { _showToast('ADRENALINE ALREADY ACTIVE', '#aaa'); return; }
    if (_adrenalineCd > 0) { _showToast('ADRENALINE CD: ' + Math.ceil(_adrenalineCd) + 's', '#aaa'); return; }
    if (_playerHP >= 30) { _showToast('HP TOO HIGH FOR ADRENALINE (need < 30)', '#aaa'); return; }

    _adrenalineActive = true;
    _adrenalineTimer = ADRENALINE_DUR;
    _adrenalineCd = ADRENALINE_CD;
    _playerHP = Math.min(PLAYER_HP_MAX, _playerHP + ADRENALINE_HP);
    window._playerHP = _playerHP;
    _applySpeedMult(ADRENALINE_SPEED);
    _showToast('ADRENALINE! SPEED x' + ADRENALINE_SPEED + ' FOR ' + ADRENALINE_DUR + 's', '#ff6600', 2500);
  }

  function _callSupplyDrop() {
    if (!_scene) return;
    var ppos = _getPlayerPos();
    var dropMesh = _buildParachuteMesh();
    var targetX = ppos.x + (Math.random() - 0.5) * 4;
    var targetZ = ppos.z + (Math.random() - 0.5) * 4;
    var startY = 35;
    dropMesh.position.set(targetX, startY, targetZ);
    _scene.add(dropMesh);
    _supplyDrops.push({ mesh: dropMesh, elapsed: 0, startY: startY });
    _showToast('SUPPLY DROP INCOMING!', '#ffd700', 2500);
  }

  // ─────────────────────────────────────────────── init
  function init(scene, camera) {
    _scene   = scene;
    _camera  = camera;
    _playerHP = (window._playerHP !== undefined) ? window._playerHP : PLAYER_HP_MAX;

    _createHUD();
    _registerTentDamageHook();

    window.addEventListener('keydown', _onKeyDown, false);
    window.addEventListener('keyup',   _onKeyUp,   false);
  }

  // ─────────────────────────────────────────────── update
  function update(delta) {
    _time += delta;

    // Consume single-frame key presses
    var keys = Object.keys(_keyPressed);
    var kpCopy = {};
    for (var ki = 0; ki < keys.length; ki++) { kpCopy[keys[ki]] = true; }
    _keyPressed = {};

    // Sync player HP from global if available
    if (window._playerHP !== undefined) _playerHP = window._playerHP;

    // --- Key: M — deploy tent
    if (kpCopy['m'] || kpCopy['M']) {
      if (!_keysDown['Control'] && !_keysDown['Alt']) {
        deployTent();
      }
    }

    // --- Key: Ctrl+M — supply drop
    if ((kpCopy['m'] || kpCopy['M']) && _keysDown['Control']) {
      _callSupplyDrop();
    }

    // --- Key: Alt+M — adrenaline shot
    if ((kpCopy['m'] || kpCopy['M']) && _keysDown['Alt']) {
      adrenalineShot();
    }

    // --- Key: F — apply bandage (when near a tent) or interrogate
    if (kpCopy['f'] || kpCopy['F']) {
      _updateWoundedInteract();
      if (!_bandaging) {
        var ppos2 = _getPlayerPos();
        var nearBandage = false;
        for (var ti2 = 0; ti2 < _tents.length; ti2++) {
          var t2 = _tents[ti2];
          if (!t2.mesh._collapsed && t2.mesh._bandages > 0 && _dist2(ppos2, t2.mesh.position) <= HEAL_RADIUS_SQ) {
            nearBandage = true; break;
          }
        }
        if (nearBandage || _bandageCount > 0) applyBandage();
      }
    }

    // Bandage progress
    if (_bandaging) {
      _bandageTimer += delta;
      if (_bandageTimer >= BANDAGE_APPLY_TIME) {
        _finishBandage();
      }
    }

    // Adrenaline timer
    if (_adrenalineActive) {
      _adrenalineTimer -= delta;
      if (_adrenalineTimer <= 0) {
        _adrenalineActive = false;
        _adrenalineTimer = 0;
        _applySpeedMult(1.0);
      }
    }
    if (_adrenalineCd > 0) {
      _adrenalineCd = Math.max(0, _adrenalineCd - delta);
    }

    // Healing aura
    _updateHealingAura(delta);

    // Supply drops
    _updateSupplyDrops(delta);

    // Smoke particles
    _updateSmoke(delta);

    // Push HP back to global
    window._playerHP = _playerHP;

    // HUD
    _updateHUD();
  }

  // ─────────────────────────────────────────────── reset
  function reset() {
    for (var ti = 0; ti < _tents.length; ti++) {
      _scene && _scene.remove(_tents[ti].mesh);
    }
    _tents = [];

    for (var si = 0; si < _supplyDrops.length; si++) {
      _scene && _scene.remove(_supplyDrops[si].mesh);
    }
    _supplyDrops = [];

    for (var spi = 0; spi < _smokeParticles.length; spi++) {
      _scene && _scene.remove(_smokeParticles[spi].mesh);
    }
    _smokeParticles = [];

    _playerHP      = PLAYER_HP_MAX;
    _bandageCount  = 0;
    _bandaging     = false;
    _bandageTimer  = 0;
    _bandageSource = null;
    _adrenalineActive = false;
    _adrenalineTimer  = 0;
    _adrenalineCd     = 0;
    _time          = 0;
    _keysDown      = {};
    _keyPressed    = {};
    window._playerHP = _playerHP;
    window._medicTents = _tents;
    if (_bloodVig)   { _bloodVig.style.opacity = '0'; }
    if (_progressBar){ _progressBar.style.display = 'none'; }
    if (_toast)      { _toast.style.display = 'none'; }
  }

  // ─────────────────────────────────────────────── expose
  return {
    init:          init,
    update:        update,
    deployTent:    deployTent,
    applyBandage:  applyBandage,
    adrenalineShot: adrenalineShot,
    reset:         reset
  };
})();
