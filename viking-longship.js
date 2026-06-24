window.VikingLongship = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────
  var scene, camera, renderer;
  var clock = { elapsed: 0 };
  var gameActive = false;
  var gameOver = false;
  var gameWon = false;

  // Player
  var playerHP = 100;
  var playerPos = { x: -20, y: 4, z: 0 };
  var playerVel = { x: 0, y: 0, z: 0 };
  var playerOnGround = true;
  var keysDown = {};
  var keyTimestamps = {};

  // Game timing
  var elapsed = 0;
  var warshipArrived = false;
  var warshipTimer = 480;

  // Weapons / items
  var throwingAxeCount = 8;
  var shieldBashCooldown = 0;
  var hornActive = false;
  var hornTimer = 0;
  var hornCooldown = 0;

  // Treasures
  var treasures = [];
  var treasuresSecured = 0;
  var treasuresLost = 0;

  // Enemies
  var enemies = [];
  var enemyMeshes = [];

  // Projectiles
  var projectiles = [];

  // Three.js objects
  var vikingShip, saxonShip, ocean;
  var boardingPlanks = [];
  var saxonWarship;
  var hudEl;
  var objects = [];

  // Arrow rain group
  var arrowRain = [];

  // Deck Y levels
  var VIKING_DECK_Y = 2;
  var SAXON_DECK_Y = 2.5;
  var OCEAN_Y = -3;
  var PLANK_Y = 2.2;

  // ── Initialise ────────────────────────────────────────────────────────────
  function init(sc, cam, ren) {
    scene = sc;
    camera = cam;
    renderer = ren;

    buildOcean();
    buildVikingShip();
    buildSaxonShip();
    buildBoardingPlanks();
    buildWarshipPlaceholder();
    spawnTreasures();
    spawnEnemies();
    buildHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    camera.position.set(playerPos.x, playerPos.y + 1.6, playerPos.z);
    gameActive = true;
  }

  // ── Ocean ─────────────────────────────────────────────────────────────────
  function buildOcean() {
    var geo = new THREE.BoxGeometry(300, 1, 300);
    var mat = new THREE.MeshLambertMaterial({ color: 0x224466 });
    ocean = new THREE.Mesh(geo, mat);
    ocean.position.set(0, -4, 0);
    scene.add(ocean);
    objects.push(ocean);
  }

  // ── Viking Longship ───────────────────────────────────────────────────────
  function buildVikingShip() {
    var group = new THREE.Group();

    // Hull
    var hullGeo = new THREE.BoxGeometry(60, 4, 15);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);

    // Dragon prow (cone)
    var prowGeo = new THREE.ConeGeometry(1.5, 8, 8);
    var prowMat = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
    var prow = new THREE.Mesh(prowGeo, prowMat);
    prow.rotation.z = -Math.PI / 2;
    prow.position.set(34, 2, 0);
    group.add(prow);

    // Stern post
    var sternGeo = new THREE.ConeGeometry(1, 5, 8);
    var sternMat = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
    var stern = new THREE.Mesh(sternGeo, sternMat);
    stern.rotation.z = Math.PI / 2;
    stern.position.set(-34, 2, 0);
    group.add(stern);

    // Mast
    var mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 14, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 9, 0);
    group.add(mast);

    // Sail
    var sailGeo = new THREE.BoxGeometry(0.2, 10, 14);
    var sailMat = new THREE.MeshLambertMaterial({ color: 0xDDCC88 });
    var sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(0, 9, 0);
    group.add(sail);

    // Oars (port and starboard)
    var oarPositions = [-20, -10, 0, 10, 20];
    for (var i = 0; i < oarPositions.length; i++) {
      var oarGeoP = new THREE.CylinderGeometry(0.15, 0.15, 10, 6);
      var oarMatP = new THREE.MeshLambertMaterial({ color: 0x553322 });
      var oarP = new THREE.Mesh(oarGeoP, oarMatP);
      oarP.rotation.z = Math.PI / 4;
      oarP.position.set(oarPositions[i], 0, -9);
      group.add(oarP);

      var oarGeoS = new THREE.CylinderGeometry(0.15, 0.15, 10, 6);
      var oarMatS = new THREE.MeshLambertMaterial({ color: 0x553322 });
      var oarS = new THREE.Mesh(oarGeoS, oarMatS);
      oarS.rotation.z = -Math.PI / 4;
      oarS.position.set(oarPositions[i], 0, 9);
      group.add(oarS);
    }

    // Barrels in hold
    var barrelPositions = [{ x: -15, z: -4 }, { x: -15, z: 4 }, { x: -10, z: 0 }];
    for (var b = 0; b < barrelPositions.length; b++) {
      var bGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
      var bMat = new THREE.MeshLambertMaterial({ color: 0x663311 });
      var barrel = new THREE.Mesh(bGeo, bMat);
      barrel.position.set(barrelPositions[b].x, 3, barrelPositions[b].z);
      group.add(barrel);
    }

    group.position.set(-35, 0, 0);
    scene.add(group);
    vikingShip = group;
    objects.push(group);
  }

  // ── Saxon Merchant ────────────────────────────────────────────────────────
  function buildSaxonShip() {
    var group = new THREE.Group();

    // Hull
    var hullGeo = new THREE.BoxGeometry(40, 5, 12);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);

    // Upper deck / forecastle
    var deckGeo = new THREE.BoxGeometry(12, 2, 12);
    var deckMat = new THREE.MeshLambertMaterial({ color: 0x998866 });
    var deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(-14, 3.5, 0);
    group.add(deck);

    // Mast
    var mastGeo = new THREE.CylinderGeometry(0.25, 0.25, 12, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(2, 8, 0);
    group.add(mast);

    // Sail
    var sailGeo = new THREE.BoxGeometry(0.2, 9, 11);
    var sailMat = new THREE.MeshLambertMaterial({ color: 0xCCBB88 });
    var sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(2, 8, 0);
    group.add(sail);

    // Barrels on deck
    var bPos = [{ x: 8, z: -3 }, { x: 8, z: 3 }, { x: 12, z: 0 }];
    for (var b = 0; b < bPos.length; b++) {
      var bGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
      var bMat = new THREE.MeshLambertMaterial({ color: 0x664411 });
      var barrel = new THREE.Mesh(bGeo, bMat);
      barrel.position.set(bPos[b].x, 4, bPos[b].z);
      group.add(barrel);
    }

    group.position.set(25, 0, 0);
    scene.add(group);
    saxonShip = group;
    objects.push(group);
  }

  // ── Boarding Planks ───────────────────────────────────────────────────────
  function buildBoardingPlanks() {
    var plankMat = new THREE.MeshLambertMaterial({ color: 0x886633 });
    var zOffsets = [-6, -3, 0, 3, 6];
    for (var i = 0; i < 5; i++) {
      var plankGeo = new THREE.BoxGeometry(20, 0.3, 1.2);
      var plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(5, PLANK_Y, zOffsets[i]);
      scene.add(plank);
      boardingPlanks.push(plank);
      objects.push(plank);
    }
  }

  // ── Saxon Warship (hidden initially) ──────────────────────────────────────
  function buildWarshipPlaceholder() {
    var group = new THREE.Group();

    var hullGeo = new THREE.BoxGeometry(55, 5, 14);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);

    var prowGeo = new THREE.ConeGeometry(2, 7, 8);
    var prowMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var prow = new THREE.Mesh(prowGeo, prowMat);
    prow.rotation.z = -Math.PI / 2;
    prow.position.set(31, 2, 0);
    group.add(prow);

    var mastGeo = new THREE.CylinderGeometry(0.4, 0.4, 16, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x442200 });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 10, 0);
    group.add(mast);

    group.position.set(-35, 0, -80);
    group.visible = false;
    scene.add(group);
    saxonWarship = group;
  }

  // ── Treasures ─────────────────────────────────────────────────────────────
  function spawnTreasures() {
    var positions = [
      { x: 30, y: 4.5, z: -4 },
      { x: 20, y: 4.5, z: 3 },
      { x: 15, y: 4.5, z: -2 }
    ];
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.BoxGeometry(1.5, 1, 1.5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x997722 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
      scene.add(mesh);

      var light = new THREE.PointLight(0xFFDD00, 1.2, 6);
      light.position.copy(mesh.position);
      light.position.y += 1.5;
      scene.add(light);

      treasures.push({
        mesh: mesh,
        light: light,
        secured: false,
        carried: false,
        lost: false,
        pos: { x: positions[i].x, y: positions[i].y, z: positions[i].z }
      });
    }
  }

  // ── Enemies ───────────────────────────────────────────────────────────────
  function spawnEnemies() {
    // 10 sword+shield on main deck
    for (var i = 0; i < 10; i++) {
      spawnEnemy('swordsman', 30 + Math.random() * 8 - 4, SAXON_DECK_Y + 3, (Math.random() - 0.5) * 10);
    }
    // 10 archers on upper deck
    for (var i = 0; i < 10; i++) {
      spawnEnemy('archer', 15 + Math.random() * 6 - 3, SAXON_DECK_Y + 3 + 2.5, (Math.random() - 0.5) * 8);
    }
    // 5 sergeant / captain
    spawnEnemy('sergeant', 25, SAXON_DECK_Y + 3, 0);
    spawnEnemy('sergeant', 22, SAXON_DECK_Y + 3, 4);
    spawnEnemy('sergeant', 28, SAXON_DECK_Y + 3, -4);
    spawnEnemy('sergeant', 18, SAXON_DECK_Y + 3, 2);
    spawnEnemy('sergeant', 32, SAXON_DECK_Y + 3, -2);
  }

  function spawnEnemy(type, x, y, z) {
    var hp, color, sz;
    if (type === 'swordsman') { hp = 70; color = 0x556677; sz = 1; }
    else if (type === 'archer') { hp = 60; color = 0x445566; sz = 0.9; }
    else { hp = 180; color = 0x884422; sz = 1.3; }

    var geo = new THREE.BoxGeometry(sz, sz * 2, sz);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    // Shield visual for swordsman
    if (type === 'swordsman') {
      var shGeo = new THREE.BoxGeometry(0.1, 1.2, 1.2);
      var shMat = new THREE.MeshLambertMaterial({ color: 0x885522 });
      var shield = new THREE.Mesh(shGeo, shMat);
      shield.position.set(0.7, 0, 0);
      mesh.add(shield);
    }

    enemies.push({
      mesh: mesh,
      type: type,
      hp: hp,
      maxHp: hp,
      alive: true,
      attackCooldown: Math.random() * 2,
      stagger: 0,
      velY: 0,
      inOcean: false,
      aggroRange: type === 'archer' ? 18 : 8,
      phase: 'idle'
    });
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'viking-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#FFEE88',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 16px',
      'border:1px solid #886644',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'text-align:center'
    ].join(';');
    document.body.appendChild(hudEl);

    // Controls hint
    var hint = document.createElement('div');
    hint.id = 'viking-hint';
    hint.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#AABB99',
      'font-family:monospace',
      'font-size:12px',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    hint.textContent = 'WASD:Move  Click:Axe  E:Throw Axe  Q:Shield Bash  H:Horn  F:Carry Treasure';
    document.body.appendChild(hint);
  }

  function updateHUD() {
    if (!hudEl) return;
    var mins = Math.floor(elapsed / 60);
    var secs = Math.floor(elapsed % 60);
    var timerStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var saxonCount = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].alive) saxonCount++;
    }
    var warshipStr = warshipArrived
      ? 'ARRIVED'
      : 'ARRIVING IN ' + Math.max(0, Math.ceil(warshipTimer - elapsed)) + 's';

    hudEl.textContent = 'VIKING LONGSHIP  [TREASURE: ' + treasuresSecured + '/3 SECURED]  ' +
      '[SAXONS: ' + saxonCount + ']  ' +
      '[WARSHIP: ' + warshipStr + ']  ' +
      '[TIMER: ' + timerStr + ']  ' +
      '[HP: ' + Math.max(0, playerHP) + ']';

    if (gameOver) {
      hudEl.textContent = gameWon
        ? '*** VICTORY! SKÅL! Treasures secured, longship away! ***'
        : '*** DEFEATED! The Saxons hold their ground. ***';
      hudEl.style.color = gameWon ? '#88FF88' : '#FF6644';
    }
  }

  // ── Key Input ──────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key.toLowerCase();
    if (!keysDown[key]) {
      keyTimestamps[key] = Date.now();
    }
    keysDown[key] = true;

    if (!gameActive || gameOver) return;

    // V+L combo within 400ms
    if ((key === 'v' && keysDown['l']) || (key === 'l' && keysDown['v'])) {
      var otherKey = key === 'v' ? 'l' : 'v';
      if (keyTimestamps[otherKey] && (Date.now() - keyTimestamps[otherKey]) < 400) {
        activateBerserkMode();
      }
    }

    if (key === 'e') throwAxe();
    if (key === 'q') shieldBash();
    if (key === 'h') callHorn();
    if (key === 'f') tryCarryTreasure();
  }

  function onKeyUp(e) {
    keysDown[e.key.toLowerCase()] = false;
  }

  // ── V+L Berserk ───────────────────────────────────────────────────────────
  function activateBerserkMode() {
    playerHP = Math.min(100, playerHP + 30);
    hornActive = true;
    hornTimer = 15;
  }

  // ── Melee Attack (click) ──────────────────────────────────────────────────
  var meleeClickBound = false;
  function bindMeleeClick() {
    if (meleeClickBound) return;
    meleeClickBound = true;
    document.addEventListener('click', function () {
      if (!gameActive || gameOver) return;
      meleeAttack();
    });
  }

  function meleeAttack() {
    var reach = 4;
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en.alive) continue;
      var dx = en.mesh.position.x - camera.position.x;
      var dy = en.mesh.position.y - camera.position.y;
      var dz = en.mesh.position.z - camera.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < reach) {
        damageEnemy(en, 30);
        break;
      }
    }
  }

  // ── Throw Axe ─────────────────────────────────────────────────────────────
  function throwAxe() {
    if (throwingAxeCount <= 0) return;
    throwingAxeCount--;

    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    var geo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(camera.position);
    scene.add(mesh);

    projectiles.push({
      mesh: mesh,
      vel: { x: dir.x * 30, y: dir.y * 30, z: dir.z * 30 },
      life: 3,
      damage: 45,
      team: 'player'
    });
  }

  // ── Shield Bash ───────────────────────────────────────────────────────────
  function shieldBash() {
    if (shieldBashCooldown > 0) return;
    shieldBashCooldown = 5;

    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en.alive) continue;
      var dx = en.mesh.position.x - camera.position.x;
      var dz = en.mesh.position.z - camera.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        // Knock enemy sideways + off ship
        en.mesh.position.x += dir.x * 8;
        en.mesh.position.z += dir.z * 8;
        en.velY = 3;
        en.stagger = 1.5;
        damageEnemy(en, 10);
      }
    }
  }

  // ── Horn Call ─────────────────────────────────────────────────────────────
  function callHorn() {
    if (hornCooldown > 0) return;
    hornCooldown = 30;
    hornActive = true;
    hornTimer = 10;
  }

  function fireCrewArrows(delta) {
    if (!hornActive) return;
    hornTimer -= delta;
    if (hornTimer <= 0) {
      hornActive = false;
      return;
    }

    // Fire arrows at enemies periodically
    if (Math.random() < delta * 3) {
      for (var i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (!en.alive) continue;
        var dx = en.mesh.position.x - (vikingShip ? vikingShip.position.x : -35);
        var dz = en.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 60 && Math.random() < 0.4) {
          damageEnemy(en, 15);
          break;
        }
      }
    }
  }

  // ── Treasure Carry ────────────────────────────────────────────────────────
  var carriedTreasure = -1;

  function tryCarryTreasure() {
    if (carriedTreasure !== -1) {
      // Try to deposit in longship hold
      if (camera.position.x < -10) {
        var t = treasures[carriedTreasure];
        t.secured = true;
        t.carried = false;
        t.mesh.visible = false;
        t.light.visible = false;
        treasuresSecured++;
        carriedTreasure = -1;
        checkWinCondition();
      }
      return;
    }

    // Pick up nearest treasure
    for (var i = 0; i < treasures.length; i++) {
      var tr = treasures[i];
      if (tr.secured || tr.lost || tr.carried) continue;
      var dx = tr.mesh.position.x - camera.position.x;
      var dy = tr.mesh.position.y - camera.position.y;
      var dz = tr.mesh.position.z - camera.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 3.5) {
        carriedTreasure = i;
        tr.carried = true;
        break;
      }
    }
  }

  // ── Damage Helpers ────────────────────────────────────────────────────────
  function damageEnemy(en, dmg) {
    if (!en.alive) return;
    en.hp -= dmg;
    if (en.hp <= 0) {
      en.alive = false;
      en.mesh.visible = false;
    }
  }

  function damagePlayer(dmg) {
    playerHP -= dmg;
    if (playerHP <= 0) {
      playerHP = 0;
      gameOver = true;
      gameWon = false;
    }
  }

  // ── Win / Lose ────────────────────────────────────────────────────────────
  function checkWinCondition() {
    if (treasuresSecured >= 3) {
      gameOver = true;
      gameWon = true;
    }
  }

  function checkLoseCondition() {
    // Lost if all 3 treasures dropped into ocean
    var lostCount = 0;
    for (var i = 0; i < treasures.length; i++) {
      if (treasures[i].lost) lostCount++;
    }
    if (lostCount >= 3) {
      gameOver = true;
      gameWon = false;
    }
  }

  // ── Saxon Warship Arrival ─────────────────────────────────────────────────
  function arriveWarship() {
    warshipArrived = true;
    saxonWarship.visible = true;
    saxonWarship.position.set(-35, 0, -40);

    // Spawn 15 more enemies
    for (var i = 0; i < 8; i++) {
      spawnEnemy('swordsman', -30 + Math.random() * 10, VIKING_DECK_Y + 2, (Math.random() - 0.5) * 12);
    }
    for (var i = 0; i < 5; i++) {
      spawnEnemy('archer', -35 + Math.random() * 8, VIKING_DECK_Y + 2 + 2, (Math.random() - 0.5) * 8);
    }
    for (var i = 0; i < 2; i++) {
      spawnEnemy('sergeant', -32 + i * 4, VIKING_DECK_Y + 2, 2 - i * 4);
    }
  }

  // ── Player Movement ───────────────────────────────────────────────────────
  function updatePlayer(delta) {
    var speed = 10;
    var forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    var right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    var move = new THREE.Vector3();
    if (keysDown['w'] || keysDown['arrowup']) move.add(forward);
    if (keysDown['s'] || keysDown['arrowdown']) move.sub(forward);
    if (keysDown['a'] || keysDown['arrowleft']) move.sub(right);
    if (keysDown['d'] || keysDown['arrowright']) move.add(right);
    if (move.length() > 0) move.normalize();

    camera.position.x += move.x * speed * delta;
    camera.position.z += move.z * speed * delta;

    // Simple gravity / ground clamp
    var groundY = getGroundY(camera.position.x, camera.position.z);
    if (camera.position.y > groundY + 1.6) {
      playerVel.y -= 18 * delta;
      camera.position.y += playerVel.y * delta;
    }
    if (camera.position.y < groundY + 1.6) {
      camera.position.y = groundY + 1.6;
      playerVel.y = 0;
    }

    // Jump
    if (keysDown[' '] && camera.position.y <= groundY + 1.7) {
      playerVel.y = 8;
    }

    // Ocean death
    if (camera.position.y < OCEAN_Y + 1) {
      damagePlayer(999);
    }
  }

  function getGroundY(x, z) {
    // Viking ship deck
    if (x >= -65 && x <= -5 && z >= -7.5 && z <= 7.5) return VIKING_DECK_Y;
    // Saxon ship deck
    if (x >= 5 && x <= 45 && z >= -6 && z <= 6) return SAXON_DECK_Y;
    // Planks
    for (var i = 0; i < boardingPlanks.length; i++) {
      var p = boardingPlanks[i];
      if (Math.abs(x - p.position.x) < 10 && Math.abs(z - p.position.z) < 0.7) return PLANK_Y;
    }
    return OCEAN_Y;
  }

  // ── Enemy AI ───────────────────────────────────────────────────────────────
  function updateEnemies(delta) {
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en.alive) continue;

      // Fall / gravity
      en.velY -= 18 * delta;
      en.mesh.position.y += en.velY * delta;

      var groundY = getGroundY(en.mesh.position.x, en.mesh.position.z);
      if (en.mesh.position.y < groundY + 1) {
        en.mesh.position.y = groundY + 1;
        en.velY = 0;
      }

      // Ocean kill
      if (en.mesh.position.y < OCEAN_Y + 0.5 && !en.inOcean) {
        en.inOcean = true;
        en.alive = false;
        en.mesh.visible = false;
        continue;
      }

      if (en.stagger > 0) {
        en.stagger -= delta;
        continue;
      }

      // AI: move toward player
      var dx = camera.position.x - en.mesh.position.x;
      var dz = camera.position.z - en.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < en.aggroRange) {
        en.phase = 'aggro';
      }

      if (en.phase === 'aggro') {
        var moveSpeed = en.type === 'sergeant' ? 4 : 3;
        if (dist > 2.5) {
          en.mesh.position.x += (dx / dist) * moveSpeed * delta;
          en.mesh.position.z += (dz / dist) * moveSpeed * delta;
        }

        // Attack player
        en.attackCooldown -= delta;
        if (en.attackCooldown <= 0 && dist < 3.5) {
          var dmg = en.type === 'sergeant' ? 18 : en.type === 'archer' ? 8 : 12;
          damagePlayer(dmg);
          en.attackCooldown = en.type === 'archer' ? 1.5 : 1.2;
        }

        // Archers shoot from range
        if (en.type === 'archer' && dist > 5 && dist < 18) {
          en.attackCooldown -= delta;
          if (en.attackCooldown <= 0) {
            damagePlayer(8);
            en.attackCooldown = 2;
          }
        }
      }

      // Face player
      en.mesh.lookAt(new THREE.Vector3(camera.position.x, en.mesh.position.y, camera.position.z));
    }
  }

  // ── Projectiles ───────────────────────────────────────────────────────────
  function updateProjectiles(delta) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      p.life -= delta;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      p.vel.y -= 9 * delta;

      // Check hit
      var hit = false;
      if (p.team === 'player') {
        for (var j = 0; j < enemies.length; j++) {
          var en = enemies[j];
          if (!en.alive) continue;
          var dx = p.mesh.position.x - en.mesh.position.x;
          var dy = p.mesh.position.y - en.mesh.position.y;
          var dz = p.mesh.position.z - en.mesh.position.z;
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.5) {
            damageEnemy(en, p.damage);
            hit = true;
            break;
          }
        }
      }

      if (hit || p.life <= 0 || p.mesh.position.y < OCEAN_Y) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }
  }

  // ── Treasure Update ───────────────────────────────────────────────────────
  function updateTreasures(delta) {
    for (var i = 0; i < treasures.length; i++) {
      var t = treasures[i];
      if (t.secured || t.lost) continue;

      if (t.carried && carriedTreasure === i) {
        t.mesh.position.x = camera.position.x + 0.5;
        t.mesh.position.y = camera.position.y - 0.5;
        t.mesh.position.z = camera.position.z - 1;
        t.light.position.copy(t.mesh.position);
        t.light.position.y += 1;
      }

      // Check if treasure fell into ocean
      if (t.mesh.position.y < OCEAN_Y + 0.3 && !t.lost) {
        t.lost = true;
        t.mesh.visible = false;
        t.light.visible = false;
        if (carriedTreasure === i) carriedTreasure = -1;
        checkLoseCondition();
      }
    }
  }

  // ── Ocean Bobbing ─────────────────────────────────────────────────────────
  function updateOcean(time) {
    if (ocean) {
      ocean.position.y = -4 + Math.sin(time * 0.8) * 0.3;
    }
    if (vikingShip) {
      vikingShip.position.y = Math.sin(time * 0.6) * 0.25;
    }
    if (saxonShip) {
      saxonShip.position.y = Math.sin(time * 0.5 + 1) * 0.2;
    }
  }

  // ── Cooldown Tick ─────────────────────────────────────────────────────────
  function tickCooldowns(delta) {
    if (shieldBashCooldown > 0) shieldBashCooldown -= delta;
    if (hornCooldown > 0) hornCooldown -= delta;
  }

  // ── Main Update ───────────────────────────────────────────────────────────
  function update(delta) {
    if (!gameActive) return;

    elapsed += delta;

    if (gameOver) {
      updateHUD();
      return;
    }

    // Warship arrival
    if (!warshipArrived && elapsed >= warshipTimer) {
      arriveWarship();
    }

    tickCooldowns(delta);
    updatePlayer(delta);
    updateEnemies(delta);
    updateProjectiles(delta);
    updateTreasures(delta);
    fireCrewArrows(delta);
    updateOcean(elapsed);
    updateHUD();

    // Bind melee lazily
    bindMeleeClick();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    // Remove all dynamic objects from scene
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].mesh) scene.remove(enemies[i].mesh);
    }
    for (var i = 0; i < projectiles.length; i++) {
      if (projectiles[i].mesh) scene.remove(projectiles[i].mesh);
    }
    for (var i = 0; i < treasures.length; i++) {
      if (treasures[i].mesh) scene.remove(treasures[i].mesh);
      if (treasures[i].light) scene.remove(treasures[i].light);
    }
    for (var i = 0; i < boardingPlanks.length; i++) {
      scene.remove(boardingPlanks[i]);
    }
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    if (saxonWarship) scene.remove(saxonWarship);
    if (hudEl && hudEl.parentNode) hudEl.parentNode.removeChild(hudEl);

    var hint = document.getElementById('viking-hint');
    if (hint && hint.parentNode) hint.parentNode.removeChild(hint);

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    // Reset state
    scene = null;
    camera = null;
    renderer = null;
    gameActive = false;
    gameOver = false;
    gameWon = false;
    playerHP = 100;
    playerPos = { x: -20, y: 4, z: 0 };
    playerVel = { x: 0, y: 0, z: 0 };
    elapsed = 0;
    warshipArrived = false;
    throwingAxeCount = 8;
    shieldBashCooldown = 0;
    hornActive = false;
    hornTimer = 0;
    hornCooldown = 0;
    treasures = [];
    treasuresSecured = 0;
    treasuresLost = 0;
    enemies = [];
    projectiles = [];
    boardingPlanks = [];
    objects = [];
    arrowRain = [];
    carriedTreasure = -1;
    keysDown = {};
    keyTimestamps = {};
    meleeClickBound = false;
    vikingShip = null;
    saxonShip = null;
    ocean = null;
    saxonWarship = null;
    hudEl = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
