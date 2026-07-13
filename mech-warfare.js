/* ───────────────────────────────────────────────────────────────────────────
   mech-warfare.js — Mech Warfare Mini-Game
   API: window.MechWarfare = { init, update, reset }
   Controls:
     M + W (within 400ms)  → activate mech mode
     WASD                  → move mech (3 u/s)
     R                     → fire shoulder rockets (30° arc, 2s flight, 120 splash r=4)
     SPACE                 → leg stomp (shockwave, 60 dmg r=5)
     Left-click            → arm cannon (80 dmg, overheat after 8 shots)
     V                     → manual vent heat (0.5s animation)
     Q                     → side-step dodge lurch
     F                     → toggle energy shield (30s power, 20s recharge)
   ─────────────────────────────────────────────────────────────────────────── */
window.MechWarfare = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active       = false;
  var _missionClear = false;

  /* ── Activation key tracking (M + W within 400ms) ─────────────────────── */
  var _keyPressTimes = { M: 0, W: 0 };
  var ACTIVATION_WINDOW = 400; // ms

  /* ── Player mech ───────────────────────────────────────────────────────── */
  var _playerMech   = null;  // THREE.Group
  var _mechHP       = 800;
  var _mechMaxHP    = 800;
  var _mechSpeed    = 3;     // units/s
  var _cockpitLight = null;  // PointLight 0x00AAFF
  var _mechPos      = { x: 0, y: 0, z: 0 };
  var _mechFacing   = 0;     // yaw radians

  /* ── Arm cannon / overheat ─────────────────────────────────────────────── */
  var _cannonShots      = 0;    // shots fired since last vent
  var _maxCannonShots   = 8;
  var _overheated       = false;
  var _overheatTimer    = 0;    // countdown to vent done (3s)
  var _ventingManual    = false;
  var _ventTimer        = 0;    // 0.5s
  var _heatLight        = null; // red PointLight when overheated
  var _heatPercent      = 0;    // 0-100

  /* ── Shoulder rockets ──────────────────────────────────────────────────── */
  var _rocketCount    = 6;
  var _maxRockets     = 6;
  var _rockets        = []; // { mesh, vel, life, pos }
  var _rocketCooldown = 0;

  /* ── Arm cannon projectiles ────────────────────────────────────────────── */
  var _cannonBursts   = []; // { mesh, vel, life, pos }

  /* ── Leg stomp ─────────────────────────────────────────────────────────── */
  var _stompCooldown  = 0;
  var _shockwaves     = []; // { mesh, radius, life }
  var _craters        = []; // { mesh, pos }

  /* ── Shield system ─────────────────────────────────────────────────────── */
  var _shieldActive   = false;
  var _shieldMesh     = null;
  var _shieldPower    = 30;    // seconds
  var _shieldMaxPower = 30;
  var _shieldRecharge = 0;    // countdown
  var _shieldRechargeTime = 20;

  /* ── Dodge / side-step ─────────────────────────────────────────────────── */
  var _dodgeCooldown  = 0;
  var _dodgeLurch     = 0;    // lateral offset during lurch
  var _dodgeDir       = 0;    // +1 or -1

  /* ── Enemy mechs (4 cylinder-torso mechs) ──────────────────────────────── */
  var _enemyMechs = []; // { group, hp, pos, vel, fireTimer, alive, missiles:[] }

  /* ── Enemy infantry (6 soldiers) ──────────────────────────────────────── */
  var _infantry = []; // { mesh, pos, hp, fireTimer, alive }

  /* ── Boss mech ─────────────────────────────────────────────────────────── */
  var _bossMech = null; // { group, hp, pos, fireTimer, alive, shockwaves:[] }

  /* ── Homing missiles from enemies ──────────────────────────────────────── */
  var _enemyMissiles  = []; // { mesh, pos, vel, life, damage }
  var _infantryRockets = []; // { mesh, pos, vel, life }

  /* ── Caterpillar tracked vehicles ──────────────────────────────────────── */
  var _vehicles = []; // { mesh, pos, retreating }

  /* ── Explosions ────────────────────────────────────────────────────────── */
  var _explosions = []; // { mesh, light, life }

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud     = null;
  var _hudClear = null;

  /* ── Input state ───────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Internal timers ───────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayerMech() {
    var group = new THREE.Group();

    /* Torso: BoxGeometry 3x4x2 (0x445566) */
    var torsoGeo = new THREE.BoxGeometry(3, 4, 2);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 3.5; // legs=3, torso center at 1.5+2=3.5
    group.add(torso);

    /* Left leg: CylinderGeometry r=0.8 h=3 */
    var legGeo  = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
    var legMat  = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var legL    = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.9, 1.5, 0);
    group.add(legL);

    /* Right leg */
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.9, 1.5, 0);
    group.add(legR);

    /* Left arm: BoxGeometry 0.6x2x0.6 */
    var armGeo = new THREE.BoxGeometry(0.6, 2, 0.6);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var armL   = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-2, 3.5, 0);
    group.add(armL);

    /* Right arm */
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(2, 3.5, 0);
    group.add(armR);

    /* Head: BoxGeometry 1.5x1x1 */
    var headGeo = new THREE.BoxGeometry(1.5, 1, 1);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 6; // top of torso at 5.5, head at 6
    group.add(head);

    /* Cockpit PointLight glow 0x00AAFF */
    var cockpitLight = new THREE.PointLight(0x00AAFF, 1.5, 6);
    cockpitLight.position.set(0, 6, 0.8);
    group.add(cockpitLight);
    _cockpitLight = cockpitLight;

    /* Shoulder rocket pods (visual) */
    var podGeo = new THREE.BoxGeometry(0.5, 0.4, 1);
    var podMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var podL   = new THREE.Mesh(podGeo, podMat);
    podL.position.set(-1.8, 5.5, -0.5);
    group.add(podL);
    var podR = new THREE.Mesh(podGeo, podMat);
    podR.position.set(1.8, 5.5, -0.5);
    group.add(podR);

    /* Heat warning light (hidden by default) */
    var heatLight = new THREE.PointLight(0xFF2200, 0, 5);
    heatLight.position.set(0, 4, 1.5);
    group.add(heatLight);
    _heatLight = heatLight;

    group.position.set(0, 0, 0);
    return group;
  }

  function buildEnemyMechGroup() {
    var group = new THREE.Group();

    /* Torso: CylinderGeometry */
    var torsoGeo = new THREE.CylinderGeometry(1.2, 1.0, 3, 8);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x884444 });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 4;
    group.add(torso);

    /* Legs */
    var legGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x663333 });
    var legL   = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.7, 1.25, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.7, 1.25, 0);
    group.add(legR);

    /* Arms */
    var armGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x884444 });
    var armL   = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-1.8, 4, 0);
    group.add(armL);
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(1.8, 4, 0);
    group.add(armR);

    /* Head */
    var headGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x993333 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 6;
    group.add(head);

    return group;
  }

  function buildBossMechGroup() {
    var group = buildEnemyMechGroup();
    group.scale.set(2, 2, 2);
    /* Recolor boss darker */
    group.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        obj.material = obj.material.clone();
        obj.material.color.setHex(0x551111);
      }
    });
    return group;
  }

  function buildInfantrySoldier() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x556633 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    group.add(body);
    var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    group.add(head);
    /* rocket launcher */
    var rlGeo = new THREE.BoxGeometry(0.15, 0.15, 0.8);
    var rlMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var rl    = new THREE.Mesh(rlGeo, rlMat);
    rl.position.set(0.5, 1.0, -0.3);
    group.add(rl);
    return group;
  }

  function buildVehicle() {
    var group = new THREE.Group();
    /* hull */
    var hullGeo = new THREE.BoxGeometry(3, 1, 1.5);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x666644 });
    var hull    = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.6;
    group.add(hull);
    /* tracks (left and right caterpillar) */
    var trackGeo = new THREE.BoxGeometry(3.2, 0.4, 0.3);
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var trackL   = new THREE.Mesh(trackGeo, trackMat);
    trackL.position.set(0, 0.2, -0.9);
    group.add(trackL);
    var trackR = new THREE.Mesh(trackGeo, trackMat);
    trackR.position.set(0, 0.2, 0.9);
    group.add(trackR);
    return group;
  }

  function buildShieldMesh() {
    var geo = new THREE.BoxGeometry(4, 7, 0.2);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x2244FF,
      transparent: true,
      opacity: 0.4
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 3.5, -1.5); // front-facing
    return mesh;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SPAWN HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnEnemyMechs() {
    var positions = [
      { x: -20, z: -25 },
      { x:  20, z: -25 },
      { x: -30, z: -40 },
      { x:  30, z: -40 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var grp = buildEnemyMechGroup();
      grp.position.set(positions[i].x, 0, positions[i].z);
      _scene.add(grp);
      _enemyMechs.push({
        group: grp,
        hp: 600,
        maxHp: 600,
        pos: { x: positions[i].x, y: 0, z: positions[i].z },
        fireTimer: 2 + i * 1.5,
        alive: true,
        missiles: []
      });
    }
  }

  function spawnInfantry() {
    for (var i = 0; i < 6; i++) {
      var grp  = buildInfantrySoldier();
      var px   = (i - 2.5) * 7;
      var pz   = -15;
      grp.position.set(px, 0, pz);
      _scene.add(grp);
      _infantry.push({
        mesh: grp,
        pos: { x: px, y: 0, z: pz },
        hp: 60,
        fireTimer: 4 + Math.random() * 2,
        alive: true
      });
    }
  }

  function spawnBossMech() {
    var grp = buildBossMechGroup();
    grp.position.set(0, 0, -80);
    _scene.add(grp);
    _bossMech = {
      group: grp,
      hp: 1500,
      maxHp: 1500,
      pos: { x: 0, y: 0, z: -80 },
      fireTimer: 4,
      alive: true,
      shockwaves: []
    };
  }

  function spawnVehicles() {
    var positions = [
      { x: -15, z: -10 },
      { x:  15, z: -12 },
      { x:   0, z: -18 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var grp = buildVehicle();
      grp.position.set(positions[i].x, 0, positions[i].z);
      _scene.add(grp);
      _vehicles.push({
        mesh: grp,
        pos: { x: positions[i].x, y: 0, z: positions[i].z },
        retreating: false,
        retreatDir: { x: 0, z: 0 }
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchMechWarfare() {
    if (_active) return;
    _active       = true;
    _missionClear = false;

    /* Reset player state */
    _mechHP       = 800;
    _mechPos      = { x: 0, y: 0, z: 0 };
    _mechFacing   = 0;
    _cannonShots  = 0;
    _overheated   = false;
    _overheatTimer = 0;
    _ventingManual = false;
    _ventTimer    = 0;
    _heatPercent  = 0;
    _rocketCount  = _maxRockets;
    _rockets      = [];
    _cannonBursts = [];
    _shockwaves   = [];
    _craters      = [];
    _shieldActive = false;
    _shieldPower  = _shieldMaxPower;
    _shieldRecharge = 0;
    _dodgeCooldown = 0;
    _dodgeLurch   = 0;
    _dodgeDir     = 0;
    _enemyMechs   = [];
    _infantry     = [];
    _bossMech     = null;
    _enemyMissiles = [];
    _infantryRockets = [];
    _vehicles     = [];
    _explosions   = [];
    _stompCooldown = 0;
    _rocketCooldown = 0;

    /* Build player mech */
    _playerMech = buildPlayerMech();
    _playerMech.position.set(0, 0, 0);
    _scene.add(_playerMech);

    /* Shield mesh (attached to mech) */
    _shieldMesh = buildShieldMesh();
    _shieldMesh.visible = false;
    _playerMech.add(_shieldMesh);

    /* Spawn enemies */
    spawnEnemyMechs();
    spawnInfantry();
    spawnBossMech();
    spawnVehicles();

    /* HUD */
    if (!_hud) {
      _hud = document.createElement('div');
      _hud.id = 'mech-hud';
      _hud.style.cssText = [
        'position:fixed',
        'bottom:16px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,20,40,0.82)',
        'color:#00EECC',
        'font:bold 13px monospace',
        'padding:8px 18px',
        'border:1px solid #00AAFF',
        'border-radius:4px',
        'z-index:9999',
        'pointer-events:none',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(_hud);
    }
    _hud.style.display = 'block';

    if (!_hudClear) {
      _hudClear = document.createElement('div');
      _hudClear.id = 'mech-clear';
      _hudClear.style.cssText = [
        'position:fixed',
        'top:35%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'color:#FFD700',
        'font:bold 42px monospace',
        'text-shadow:0 0 20px #FF8800',
        'display:none',
        'z-index:10000',
        'pointer-events:none'
      ].join(';');
      _hudClear.textContent = 'MISSION CLEAR';
      document.body.appendChild(_hudClear);
    }
    _hudClear.style.display = 'none';

    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function updateHUD() {
    if (!_hud || !_active) return;

    var shieldStr  = _shieldActive ? 'ON' : (_shieldRecharge > 0 ? 'RECHARGE' : 'READY');
    var bossStr    = 'DEFEATED';
    if (_bossMech && _bossMech.alive) {
      var dx  = _bossMech.pos.x - _mechPos.x;
      var dz  = _bossMech.pos.z - _mechPos.z;
      var dist = Math.round(Math.sqrt(dx * dx + dz * dz));
      bossStr = dist + 'm';
    }
    var hp    = Math.max(0, _mechHP);
    var heat  = Math.round(_heatPercent);
    var rockets = _rocketCount;

    _hud.textContent = 'MECH [HP: ' + hp + '/' + _mechMaxHP + '] [HEAT: ' + heat + '%] [ROCKETS: ' + rockets + '] [SHIELD: ' + shieldStr + '] | BOSS MECH: ' + bossStr;
  }

  /* ════════════════════════════════════════════════════════════════════════
     WEAPON: ARM CANNON
  ════════════════════════════════════════════════════════════════════════ */

  function fireArmCannon() {
    if (!_active || _overheated) return;
    _cannonShots++;
    _heatPercent = (_cannonShots / _maxCannonShots) * 100;

    /* Spawn BoxGeometry burst */
    var geo  = new THREE.BoxGeometry(0.3, 0.3, 1.5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x00FFAA, emissive: 0x00AA55, emissiveIntensity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    var spawnX = _mechPos.x;
    var spawnY = 4;
    var spawnZ = _mechPos.z;
    mesh.position.set(spawnX, spawnY, spawnZ);
    _scene.add(mesh);

    var dir = { x: -Math.sin(_mechFacing), z: -Math.cos(_mechFacing) };
    _cannonBursts.push({
      mesh: mesh,
      pos: { x: spawnX, y: spawnY, z: spawnZ },
      vel: { x: dir.x * 25, y: 0, z: dir.z * 25 },
      life: 1.2,
      damage: 80
    });

    if (_cannonShots >= _maxCannonShots) {
      _overheated    = true;
      _overheatTimer = 3;
      _heatPercent   = 100;
      if (_heatLight) { _heatLight.intensity = 2; }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WEAPON: SHOULDER ROCKETS
  ════════════════════════════════════════════════════════════════════════ */

  function fireShoulderRocket() {
    if (!_active || _rocketCount <= 0 || _rocketCooldown > 0) return;
    _rocketCount--;
    _rocketCooldown = 0.6;

    var geo  = new THREE.SphereGeometry(0.3, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF8800, emissive: 0xFF4400, emissiveIntensity: 0.7 });
    var mesh = new THREE.Mesh(geo, mat);

    /* Launch from shoulder area */
    var spawnX = _mechPos.x - Math.sin(_mechFacing) * 1.8;
    var spawnY = 5.5;
    var spawnZ = _mechPos.z - Math.cos(_mechFacing) * 1.8;
    mesh.position.set(spawnX, spawnY, spawnZ);
    _scene.add(mesh);

    var horizSpeed = 18;
    var arcAngle   = Math.PI / 6; /* 30 degrees upward */
    var dir = { x: -Math.sin(_mechFacing), z: -Math.cos(_mechFacing) };
    _rockets.push({
      mesh: mesh,
      pos: { x: spawnX, y: spawnY, z: spawnZ },
      vel: {
        x: dir.x * horizSpeed * Math.cos(arcAngle),
        y: horizSpeed * Math.sin(arcAngle),
        z: dir.z * horizSpeed * Math.cos(arcAngle)
      },
      life: 2.0,
      splashDamage: 120,
      splashRadius: 4
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     WEAPON: LEG STOMP
  ════════════════════════════════════════════════════════════════════════ */

  function performStomp(isBoss) {
    if (!_active || _stompCooldown > 0) return;
    _stompCooldown = 1.5;

    /* Shockwave ring - BoxGeometry expanding ring */
    var geo  = new THREE.BoxGeometry(1, 0.3, 1);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xAA8833, transparent: true, opacity: 0.7 });
    var mesh = new THREE.Mesh(geo, mat);
    var cx   = isBoss ? _bossMech.pos.x : _mechPos.x;
    var cz   = isBoss ? _bossMech.pos.z : _mechPos.z;
    mesh.position.set(cx, 0.2, cz);
    _scene.add(mesh);

    var maxR = isBoss ? 8 : 5;
    _shockwaves.push({
      mesh: mesh,
      radius: 0.1,
      maxRadius: maxR,
      life: 0.8,
      damage: 60,
      cx: cx,
      cz: cz,
      damageDealt: false
    });

    /* Leave crater in ground */
    var craterGeo = new THREE.BoxGeometry(3, 0.2, 3);
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    var craterMesh = new THREE.Mesh(craterGeo, craterMat);
    craterMesh.position.set(cx, -0.05, cz);
    _scene.add(craterMesh);
    _craters.push({ mesh: craterMesh, pos: { x: cx, z: cz } });

    /* Trigger vehicles to retreat */
    triggerVehicleRetreat(cx, cz, 8);
  }

  function triggerVehicleRetreat(cx, cz, radius) {
    for (var i = 0; i < _vehicles.length; i++) {
      var v  = _vehicles[i];
      var dx = v.pos.x - cx;
      var dz = v.pos.z - cz;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < radius) {
        v.retreating = true;
        var len = d > 0.01 ? d : 1;
        v.retreatDir = { x: dx / len, z: dz / len };
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHIELD
  ════════════════════════════════════════════════════════════════════════ */

  function toggleShield() {
    if (!_active) return;
    if (_shieldActive) {
      /* Deactivate */
      _shieldActive = false;
      if (_shieldMesh) { _shieldMesh.visible = false; }
      _shieldRecharge = _shieldRechargeTime;
    } else {
      /* Only activate if not recharging */
      if (_shieldRecharge > 0) return;
      if (_shieldPower <= 0) return;
      _shieldActive = true;
      if (_shieldMesh) { _shieldMesh.visible = true; }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DODGE
  ════════════════════════════════════════════════════════════════════════ */

  function performDodge() {
    if (!_active || _dodgeCooldown > 0) return;
    _dodgeCooldown = 1.0;
    _dodgeDir  = (_keys['a'] || _keys['A']) ? -1 : 1;
    _dodgeLurch = _dodgeDir * 3;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MANUAL VENT
  ════════════════════════════════════════════════════════════════════════ */

  function manualVent() {
    if (!_active) return;
    if (_ventingManual || !_overheated) return;
    _ventingManual = true;
    _ventTimer     = 0.5;
  }

  /* ════════════════════════════════════════════════════════════════════════
     DAMAGE
  ════════════════════════════════════════════════════════════════════════ */

  function applyDamageToPlayer(dmg, fromFront) {
    if (!_active) return;
    var effective = dmg;
    if (_shieldActive && fromFront) {
      effective = dmg * 0.2; /* Shield blocks 80% */
    }
    _mechHP -= effective;
    if (_mechHP <= 0) {
      _mechHP = 0;
      endMechWarfare(false);
    }
  }

  function applyDamageToEnemy(enemyObj, dmg) {
    if (!enemyObj.alive) return;
    enemyObj.hp -= dmg;
    if (enemyObj.hp <= 0) {
      enemyObj.hp    = 0;
      enemyObj.alive = false;
      spawnExplosion(enemyObj.pos.x, 3, enemyObj.pos.z, 0xFF4400, 4);
      if (enemyObj.group) { _scene.remove(enemyObj.group); }
    }
  }

  function applyRocketSplash(cx, cy, cz, damage, radius) {
    /* vs enemy mechs */
    for (var i = 0; i < _enemyMechs.length; i++) {
      var em = _enemyMechs[i];
      if (!em.alive) continue;
      var dx = em.pos.x - cx;
      var dy = em.pos.y - cy;
      var dz = em.pos.z - cz;
      var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < radius) {
        applyDamageToEnemy(em, damage * (1 - d / radius));
      }
    }
    /* vs infantry */
    for (var j = 0; j < _infantry.length; j++) {
      var inf = _infantry[j];
      if (!inf.alive) continue;
      var dx2 = inf.pos.x - cx;
      var dz2 = inf.pos.z - cz;
      var d2  = Math.sqrt(dx2 * dx2 + dz2 * dz2);
      if (d2 < radius) {
        inf.hp -= damage * (1 - d2 / radius);
        if (inf.hp <= 0) {
          inf.hp    = 0;
          inf.alive = false;
          _scene.remove(inf.mesh);
          spawnExplosion(inf.pos.x, 1, inf.pos.z, 0xFF6600, 1.5);
        }
      }
    }
    /* vs boss */
    if (_bossMech && _bossMech.alive) {
      var dbx = _bossMech.pos.x - cx;
      var dbz = _bossMech.pos.z - cz;
      var db  = Math.sqrt(dbx * dbx + dbz * dbz);
      if (db < radius) {
        _bossMech.hp -= damage * (1 - db / radius);
        if (_bossMech.hp <= 0) {
          _bossMech.hp    = 0;
          _bossMech.alive = false;
          spawnExplosion(_bossMech.pos.x, 5, _bossMech.pos.z, 0xFF2200, 8);
          _scene.remove(_bossMech.group);
          endMechWarfare(true);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(x, y, z, color, size) {
    var geo  = new THREE.SphereGeometry(size || 2, 8, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: color || 0xFF6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);

    var light = new THREE.PointLight(color || 0xFF6600, 3, 12);
    light.position.set(x, y, z);
    _scene.add(light);

    _explosions.push({ mesh: mesh, light: light, life: 0.5, maxLife: 0.5 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     END
  ════════════════════════════════════════════════════════════════════════ */

  function endMechWarfare(victory) {
    _active = false;
    if (victory) {
      _missionClear = true;
      if (_hudClear) { _hudClear.style.display = 'block'; }
    } else {
      /* Player destroyed */
      if (_hud) {
        _hud.textContent = 'MECH DESTROYED';
        _hud.style.color = '#FF4444';
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateEnemyMechs(dt) {
    for (var i = 0; i < _enemyMechs.length; i++) {
      var em = _enemyMechs[i];
      if (!em.alive) continue;

      /* Move toward player slowly */
      var dx   = _mechPos.x - em.pos.x;
      var dz   = _mechPos.z - em.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 8) {
        var spd = 1.5;
        em.pos.x += (dx / dist) * spd * dt;
        em.pos.z += (dz / dist) * spd * dt;
        em.group.position.set(em.pos.x, em.pos.y, em.pos.z);
      }

      /* Fire homing missile */
      em.fireTimer -= dt;
      if (em.fireTimer <= 0) {
        em.fireTimer = 3 + Math.random() * 2;
        fireEnemyMissile(em.pos.x, 4, em.pos.z, 40, false);
      }
    }
  }

  function updateInfantry(dt) {
    for (var i = 0; i < _infantry.length; i++) {
      var inf = _infantry[i];
      if (!inf.alive) continue;
      inf.fireTimer -= dt;
      if (inf.fireTimer <= 0) {
        inf.fireTimer = 4 + Math.random() * 1;
        fireInfantryRocket(inf.pos.x, inf.pos.y + 1.0, inf.pos.z);
      }
      /* face player */
      inf.mesh.position.set(inf.pos.x, inf.pos.y, inf.pos.z);
    }
  }

  function updateBossMech(dt) {
    if (!_bossMech || !_bossMech.alive) return;

    /* Boss advances slowly */
    var dx   = _mechPos.x - _bossMech.pos.x;
    var dz   = _mechPos.z - _bossMech.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 20) {
      var spd = 0.8;
      _bossMech.pos.x += (dx / dist) * spd * dt;
      _bossMech.pos.z += (dz / dist) * spd * dt;
      _bossMech.group.position.set(_bossMech.pos.x, _bossMech.pos.y, _bossMech.pos.z);
    }

    /* Boss fires twin rocket barrage */
    _bossMech.fireTimer -= dt;
    if (_bossMech.fireTimer <= 0) {
      _bossMech.fireTimer = 3;
      fireEnemyMissile(_bossMech.pos.x - 2, 8, _bossMech.pos.z, 60, true);
      fireEnemyMissile(_bossMech.pos.x + 2, 8, _bossMech.pos.z, 60, true);
    }

    /* Boss stomp if player close */
    if (dist < 12) {
      performBossStomp();
    }
  }

  function performBossStomp() {
    if (!_bossMech || !_bossMech.alive) return;
    /* Boss stomp shockwave r=8 */
    var geo  = new THREE.BoxGeometry(1, 0.3, 1);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF5511, transparent: true, opacity: 0.7 });
    var mesh = new THREE.Mesh(geo, mat);
    var cx   = _bossMech.pos.x;
    var cz   = _bossMech.pos.z;
    mesh.position.set(cx, 0.2, cz);
    _scene.add(mesh);
    _shockwaves.push({
      mesh: mesh,
      radius: 0.1,
      maxRadius: 8,
      life: 1.0,
      damage: 80,
      cx: cx,
      cz: cz,
      damageDealt: false,
      isBoss: true
    });
  }

  function fireEnemyMissile(x, y, z, damage, fromBoss) {
    var geo  = new THREE.SphereGeometry(0.25, 6, 6);
    var col  = fromBoss ? 0xFF2200 : 0xFF4400;
    var mat  = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _enemyMissiles.push({
      mesh: mesh,
      pos: { x: x, y: y, z: z },
      vel: { x: 0, y: 0, z: 0 },
      life: 5,
      damage: damage,
      homing: true
    });
  }

  function fireInfantryRocket(x, y, z) {
    var geo  = new THREE.SphereGeometry(0.15, 5, 5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    var dx   = _mechPos.x - x;
    var dz   = _mechPos.z - z;
    var d    = Math.sqrt(dx * dx + dz * dz);
    var spd  = 10;
    _infantryRockets.push({
      mesh: mesh,
      pos: { x: x, y: y, z: z },
      vel: { x: (dx / d) * spd, y: 0.5, z: (dz / d) * spd },
      life: 3,
      damage: 40
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE PROJECTILES
  ════════════════════════════════════════════════════════════════════════ */

  function updateRockets(dt) {
    for (var i = _rockets.length - 1; i >= 0; i--) {
      var r = _rockets[i];
      r.vel.y -= 9.8 * dt * 0.5; /* gentle gravity */
      r.pos.x += r.vel.x * dt;
      r.pos.y += r.vel.y * dt;
      r.pos.z += r.vel.z * dt;
      r.life  -= dt;
      r.mesh.position.set(r.pos.x, r.pos.y, r.pos.z);

      if (r.life <= 0 || r.pos.y <= 0) {
        /* Explode */
        spawnExplosion(r.pos.x, Math.max(0.5, r.pos.y), r.pos.z, 0xFF8800, 2.5);
        applyRocketSplash(r.pos.x, r.pos.y, r.pos.z, r.splashDamage, r.splashRadius);
        _scene.remove(r.mesh);
        _rockets.splice(i, 1);
      }
    }
  }

  function updateCannonBursts(dt) {
    for (var i = _cannonBursts.length - 1; i >= 0; i--) {
      var b = _cannonBursts[i];
      b.pos.x += b.vel.x * dt;
      b.pos.z += b.vel.z * dt;
      b.life  -= dt;
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);

      /* Check hit on enemy mechs */
      var hit = false;
      for (var j = 0; j < _enemyMechs.length; j++) {
        var em = _enemyMechs[j];
        if (!em.alive) continue;
        var dx = b.pos.x - em.pos.x;
        var dz = b.pos.z - em.pos.z;
        if (Math.sqrt(dx * dx + dz * dz) < 2) {
          applyDamageToEnemy(em, b.damage);
          hit = true;
          break;
        }
      }
      /* Check hit on boss */
      if (!hit && _bossMech && _bossMech.alive) {
        var dbx = b.pos.x - _bossMech.pos.x;
        var dbz = b.pos.z - _bossMech.pos.z;
        if (Math.sqrt(dbx * dbx + dbz * dbz) < 4) {
          _bossMech.hp -= b.damage;
          if (_bossMech.hp <= 0) {
            _bossMech.hp    = 0;
            _bossMech.alive = false;
            spawnExplosion(_bossMech.pos.x, 5, _bossMech.pos.z, 0xFF2200, 8);
            _scene.remove(_bossMech.group);
            endMechWarfare(true);
          }
          hit = true;
        }
      }

      if (b.life <= 0 || hit) {
        _scene.remove(b.mesh);
        _cannonBursts.splice(i, 1);
      }
    }
  }

  function updateEnemyMissiles(dt) {
    for (var i = _enemyMissiles.length - 1; i >= 0; i--) {
      var m = _enemyMissiles[i];
      /* Homing: steer toward player */
      if (m.homing) {
        var dx  = _mechPos.x - m.pos.x;
        var dy  = 4 - m.pos.y;
        var dz  = _mechPos.z - m.pos.z;
        var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (len > 0.01) {
          var spd = 14;
          m.vel.x += (dx / len * spd - m.vel.x) * dt * 2;
          m.vel.y += (dy / len * spd - m.vel.y) * dt * 2;
          m.vel.z += (dz / len * spd - m.vel.z) * dt * 2;
        }
      }
      m.pos.x += m.vel.x * dt;
      m.pos.y += m.vel.y * dt;
      m.pos.z += m.vel.z * dt;
      m.life  -= dt;
      m.mesh.position.set(m.pos.x, m.pos.y, m.pos.z);

      /* Check hit on player */
      var px = m.pos.x - _mechPos.x;
      var pz = m.pos.z - _mechPos.z;
      var pd = Math.sqrt(px * px + pz * pz);
      var didHit = pd < 2 || m.life <= 0;
      if (pd < 2) {
        var fromFront = true; /* simplified */
        applyDamageToPlayer(m.damage, fromFront);
        spawnExplosion(m.pos.x, m.pos.y, m.pos.z, 0xFF4400, 1.5);
      }
      if (didHit) {
        _scene.remove(m.mesh);
        _enemyMissiles.splice(i, 1);
      }
    }
  }

  function updateInfantryRockets(dt) {
    for (var i = _infantryRockets.length - 1; i >= 0; i--) {
      var r = _infantryRockets[i];
      r.pos.x += r.vel.x * dt;
      r.pos.y += r.vel.y * dt;
      r.pos.z += r.vel.z * dt;
      r.life  -= dt;
      r.mesh.position.set(r.pos.x, r.pos.y, r.pos.z);
      var dx  = r.pos.x - _mechPos.x;
      var dz  = r.pos.z - _mechPos.z;
      var hit = Math.sqrt(dx * dx + dz * dz) < 2.5 || r.life <= 0;
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        applyDamageToPlayer(r.damage, false);
        spawnExplosion(r.pos.x, r.pos.y, r.pos.z, 0xFF6600, 1);
      }
      if (hit) {
        _scene.remove(r.mesh);
        _infantryRockets.splice(i, 1);
      }
    }
  }

  function updateShockwaves(dt) {
    for (var i = _shockwaves.length - 1; i >= 0; i--) {
      var sw = _shockwaves[i];
      sw.life   -= dt;
      var growFrac = 1 - (sw.life / (sw.maxRadius / 6));
      sw.radius = sw.maxRadius * Math.min(1, growFrac + 0.1);
      var s = sw.radius;
      sw.mesh.scale.set(s, 1, s);
      sw.mesh.material.opacity = 0.7 * (sw.life / 0.8);

      /* Deal damage once when radius expands past enemies */
      if (!sw.damageDealt && sw.radius > sw.maxRadius * 0.4) {
        sw.damageDealt = true;
        /* Damage enemy mechs */
        for (var j = 0; j < _enemyMechs.length; j++) {
          var em = _enemyMechs[j];
          if (!em.alive) continue;
          var dx = em.pos.x - sw.cx;
          var dz = em.pos.z - sw.cz;
          if (Math.sqrt(dx * dx + dz * dz) < sw.maxRadius) {
            applyDamageToEnemy(em, sw.damage);
          }
        }
        /* Damage infantry */
        for (var k = 0; k < _infantry.length; k++) {
          var inf = _infantry[k];
          if (!inf.alive) continue;
          var dx2 = inf.pos.x - sw.cx;
          var dz2 = inf.pos.z - sw.cz;
          if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < sw.maxRadius) {
            inf.hp -= sw.damage;
            if (inf.hp <= 0) {
              inf.hp    = 0;
              inf.alive = false;
              _scene.remove(inf.mesh);
            }
          }
        }
        /* If player shockwave, check boss too */
        if (!sw.isBoss && _bossMech && _bossMech.alive) {
          var dbx = _bossMech.pos.x - sw.cx;
          var dbz = _bossMech.pos.z - sw.cz;
          if (Math.sqrt(dbx * dbx + dbz * dbz) < sw.maxRadius) {
            _bossMech.hp -= sw.damage;
            if (_bossMech.hp <= 0) {
              _bossMech.hp    = 0;
              _bossMech.alive = false;
              spawnExplosion(_bossMech.pos.x, 5, _bossMech.pos.z, 0xFF2200, 8);
              _scene.remove(_bossMech.group);
              endMechWarfare(true);
            }
          }
        }
        /* Boss shockwave damages player */
        if (sw.isBoss) {
          var bpx = _mechPos.x - sw.cx;
          var bpz = _mechPos.z - sw.cz;
          if (Math.sqrt(bpx * bpx + bpz * bpz) < sw.maxRadius) {
            applyDamageToPlayer(sw.damage, false);
          }
        }
        /* Trigger vehicle retreat */
        triggerVehicleRetreat(sw.cx, sw.cz, sw.maxRadius + 3);
      }

      if (sw.life <= 0) {
        _scene.remove(sw.mesh);
        _shockwaves.splice(i, 1);
      }
    }
  }

  function updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      var frac = ex.life / ex.maxLife;
      ex.mesh.material.opacity = frac;
      ex.mesh.scale.setScalar(1 + (1 - frac) * 2);
      if (ex.light) { ex.light.intensity = 3 * frac; }
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        if (ex.light) { _scene.remove(ex.light); }
        _explosions.splice(i, 1);
      }
    }
  }

  function updateVehicles(dt) {
    for (var i = 0; i < _vehicles.length; i++) {
      var v = _vehicles[i];
      if (!v.retreating) continue;
      var spd = 4;
      v.pos.x += v.retreatDir.x * spd * dt;
      v.pos.z += v.retreatDir.z * spd * dt;
      v.mesh.position.set(v.pos.x, v.pos.y || 0, v.pos.z);
      /* Stop retreating after moving far enough */
      var ddx = v.pos.x;
      var ddz = v.pos.z;
      if (Math.sqrt(ddx * ddx + ddz * ddz) > 60) {
        _scene.remove(v.mesh);
        _vehicles.splice(i, 1);
        i--;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     OVERHEAT / VENT
  ════════════════════════════════════════════════════════════════════════ */

  function updateOverheat(dt) {
    if (_ventingManual) {
      _ventTimer -= dt;
      /* Flicker cockpit light during vent */
      if (_cockpitLight) { _cockpitLight.intensity = 0.5 + Math.sin(_ventTimer * 40) * 0.5; }
      if (_ventTimer <= 0) {
        _ventingManual = false;
        _overheated    = false;
        _cannonShots   = 0;
        _heatPercent   = 0;
        if (_heatLight)   { _heatLight.intensity   = 0; }
        if (_cockpitLight) { _cockpitLight.intensity = 1.5; }
      }
    } else if (_overheated) {
      _overheatTimer -= dt;
      /* Flash heat light */
      if (_heatLight) {
        _heatLight.intensity = (Math.floor(_overheatTimer * 4) % 2 === 0) ? 2 : 0;
      }
      if (_overheatTimer <= 0) {
        _overheated    = false;
        _cannonShots   = 0;
        _heatPercent   = 0;
        if (_heatLight)   { _heatLight.intensity   = 0; }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayerMovement(dt) {
    if (!_playerMech) return;

    var moved = false;
    var spd   = _mechSpeed;

    /* Dodge lurch decay */
    if (Math.abs(_dodgeLurch) > 0.01) {
      var lateralX = Math.cos(_mechFacing) * _dodgeLurch * spd * dt * 4;
      var lateralZ = -Math.sin(_mechFacing) * _dodgeLurch * spd * dt * 4;
      _mechPos.x  += lateralX;
      _mechPos.z  += lateralZ;
      _dodgeLurch *= (1 - dt * 6);
      if (Math.abs(_dodgeLurch) < 0.05) { _dodgeLurch = 0; }
      moved = true;
    }

    if (_keys['ArrowUp'] || _keys['w'] || _keys['W']) {
      _mechPos.x -= Math.sin(_mechFacing) * spd * dt;
      _mechPos.z -= Math.cos(_mechFacing) * spd * dt;
      moved = true;
    }
    if (_keys['ArrowDown'] || _keys['s'] || _keys['S']) {
      _mechPos.x += Math.sin(_mechFacing) * spd * dt;
      _mechPos.z += Math.cos(_mechFacing) * spd * dt;
      moved = true;
    }
    if (_keys['ArrowLeft'] || _keys['a'] || _keys['A']) {
      _mechFacing += 1.5 * dt;
    }
    if (_keys['ArrowRight'] || _keys['d'] || _keys['D']) {
      _mechFacing -= 1.5 * dt;
    }

    _playerMech.position.set(_mechPos.x, _mechPos.y, _mechPos.z);
    _playerMech.rotation.y = _mechFacing;

    /* Leg animation (bob) */
    if (moved) {
      var bob = Math.sin(Date.now() * 0.008) * 0.15;
      _playerMech.position.y = _mechPos.y + bob;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHIELD UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateShield(dt) {
    if (_shieldActive) {
      _shieldPower -= dt;
      if (_shieldPower <= 0) {
        _shieldPower    = 0;
        _shieldActive   = false;
        _shieldRecharge = _shieldRechargeTime;
        if (_shieldMesh) { _shieldMesh.visible = false; }
      }
    } else {
      if (_shieldRecharge > 0) {
        _shieldRecharge -= dt;
        if (_shieldRecharge <= 0) {
          _shieldRecharge = 0;
          _shieldPower    = _shieldMaxPower; /* Fully recharged */
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* Track M+W activation */
    if (e.key === 'M' || e.key === 'm') {
      _keyPressTimes['M'] = Date.now();
    }
    if (e.key === 'W' || e.key === 'w') {
      _keyPressTimes['W'] = Date.now();
    }
    /* Check activation window */
    if (!_active) {
      var mTime = _keyPressTimes['M'] || 0;
      var wTime = _keyPressTimes['W'] || 0;
      if (mTime > 0 && wTime > 0) {
        var diff = Math.abs(mTime - wTime);
        if (diff <= ACTIVATION_WINDOW) {
          launchMechWarfare();
          _keyPressTimes['M'] = 0;
          _keyPressTimes['W'] = 0;
        }
      }
      return;
    }

    if (!_active) return;

    if (e.key === 'r' || e.key === 'R') {
      fireShoulderRocket();
    }
    if (e.key === ' ') {
      e.preventDefault();
      performStomp(false);
    }
    if (e.key === 'v' || e.key === 'V') {
      manualVent();
    }
    if (e.key === 'q' || e.key === 'Q') {
      performDodge();
    }
    if (e.key === 'f' || e.key === 'F') {
      toggleShield();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      fireArmCannon();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     COOLDOWN TIMERS
  ════════════════════════════════════════════════════════════════════════ */

  function updateCooldowns(dt) {
    if (_stompCooldown   > 0) { _stompCooldown   -= dt; }
    if (_rocketCooldown  > 0) { _rocketCooldown  -= dt; }
    if (_dodgeCooldown   > 0) { _dodgeCooldown   -= dt; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
  }

  function update(timestamp) {
    if (!_active) return;

    var dt = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime = timestamp;
    if (dt <= 0 || dt > 0.1) { return; }

    updatePlayerMovement(dt);
    updateOverheat(dt);
    updateShield(dt);
    updateCooldowns(dt);

    updateRockets(dt);
    updateCannonBursts(dt);
    updateEnemyMechs(dt);
    updateInfantry(dt);
    updateBossMech(dt);
    updateEnemyMissiles(dt);
    updateInfantryRockets(dt);
    updateShockwaves(dt);
    updateExplosions(dt);
    updateVehicles(dt);

    updateHUD();
  }

  function reset() {
    _active       = false;
    _missionClear = false;

    if (_playerMech)  { _scene && _scene.remove(_playerMech); _playerMech = null; }
    if (_shieldMesh)  { _shieldMesh = null; }
    if (_heatLight)   { _heatLight   = null; }
    if (_cockpitLight){ _cockpitLight = null; }

    for (var i = 0; i < _enemyMechs.length;   i++) { if (_enemyMechs[i].group   && _scene) { _scene.remove(_enemyMechs[i].group); } }
    for (var j = 0; j < _infantry.length;      j++) { if (_infantry[j].mesh      && _scene) { _scene.remove(_infantry[j].mesh); } }
    for (var k = 0; k < _rockets.length;       k++) { if (_rockets[k].mesh       && _scene) { _scene.remove(_rockets[k].mesh); } }
    for (var l = 0; l < _cannonBursts.length;  l++) { if (_cannonBursts[l].mesh  && _scene) { _scene.remove(_cannonBursts[l].mesh); } }
    for (var m = 0; m < _enemyMissiles.length; m++) { if (_enemyMissiles[m].mesh && _scene) { _scene.remove(_enemyMissiles[m].mesh); } }
    for (var n = 0; n < _infantryRockets.length; n++) { if (_infantryRockets[n].mesh && _scene) { _scene.remove(_infantryRockets[n].mesh); } }
    for (var o = 0; o < _shockwaves.length;    o++) { if (_shockwaves[o].mesh    && _scene) { _scene.remove(_shockwaves[o].mesh); } }
    for (var p = 0; p < _explosions.length;    p++) {
      if (_explosions[p].mesh  && _scene) { _scene.remove(_explosions[p].mesh); }
      if (_explosions[p].light && _scene) { _scene.remove(_explosions[p].light); }
    }
    for (var q = 0; q < _craters.length;   q++) { if (_craters[q].mesh   && _scene) { _scene.remove(_craters[q].mesh); } }
    for (var r = 0; r < _vehicles.length;  r++) { if (_vehicles[r].mesh   && _scene) { _scene.remove(_vehicles[r].mesh); } }

    if (_bossMech && _bossMech.group && _scene) { _scene.remove(_bossMech.group); }
    _bossMech = null;

    _enemyMechs      = [];
    _infantry        = [];
    _rockets         = [];
    _cannonBursts    = [];
    _enemyMissiles   = [];
    _infantryRockets = [];
    _shockwaves      = [];
    _explosions      = [];
    _craters         = [];
    _vehicles        = [];

    if (_hud)     { _hud.style.display     = 'none'; }
    if (_hudClear){ _hudClear.style.display = 'none'; }

    _mechHP      = 800;
    _heatPercent = 0;
    _rocketCount = _maxRockets;
    _overheated  = false;
    _shieldActive = false;
    _shieldPower  = _shieldMaxPower;
    _shieldRecharge = 0;
    _keys = {};
    _keyPressTimes = { M: 0, W: 0 };
  }

  return { init: init, update: update, reset: reset };
}());
