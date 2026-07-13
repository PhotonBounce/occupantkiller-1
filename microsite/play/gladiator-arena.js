window.GladiatorArena = (function () {
  'use strict';

  // ─── Activation key tracking (G + A within 400ms) ────────────────────────────
  var keysDown = {};
  var gDownAt = 0;
  var aDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;

  // ─── Three.js handles ────────────────────────────────────────────────────────
  var scene, camera, renderer, animFrameId;

  // ─── Game state ──────────────────────────────────────────────────────────────
  var playerHP = 150;
  var playerMaxHP = 150;
  var playerPos = { x: 0, y: 0.5, z: 14 };
  var playerVelX = 0;
  var playerVelZ = 0;
  var currentRound = 0;
  var totalRounds = 5;
  var roundActive = false;
  var gameOver = false;
  var gameWon = false;
  var score = 0;
  var crowdApproval = 50;
  var roundTransitionTimer = 0;
  var roundTransitionActive = false;
  var mercyKillPending = false;
  var mercyKillTimer = 0;
  var moveDir = { x: 0, z: -1 };

  // ─── Attack / weapon state ────────────────────────────────────────────────────
  var attackCooldown = 0;
  var equippedWeapon = 'gladius';
  var shieldEquipped = false;
  var netCooldown = 0;
  var NET_COOLDOWN = 8;
  var lastSwingTime = 0;
  var dodgeDetected = false;
  var dodgeCheckTimer = 0;
  var dodgeLight = null;
  var dodgeLightTimer = 0;

  // ─── Entity lists ─────────────────────────────────────────────────────────────
  var enemies = [];
  var pickups = [];
  var projectiles = [];
  var crowdBlocks = [];
  var chariot = null;
  var chariotLaps = 0;
  var chariotAngle = 0;
  var chariotActive = false;
  var lionMesh = null;
  var lionPos = { x: -18, y: 0.5, z: -14 };
  var lionHP = 60;
  var lionActive = false;
  var lionAttackCooldown = 0;
  var cageDoor = null;
  var cageDoorOpen = false;
  var giftMesh = null;
  var giftActive = false;
  var giftPos = { x: 0, y: 0, z: 0 };

  // ─── Player mesh ──────────────────────────────────────────────────────────────
  var playerMesh = null;
  var playerWeaponMesh = null;
  var playerShieldMesh = null;

  // ─── Environment ──────────────────────────────────────────────────────────────
  var emperorMesh = null;
  var emperorThumbMesh = null;
  var emperorThumbState = 'neutral';
  var emperorThumbTimer = 0;
  var portcullisMesh = null;
  var portcullisOpen = false;
  var portcullisTimer = 0;

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  var hudEl = null;
  var msgEl = null;

  // ─── Audio ───────────────────────────────────────────────────────────────────
  var audioCtx = null;

  // ─── Clock ───────────────────────────────────────────────────────────────────
  var clock = { last: 0 };

  // ─── Keys ────────────────────────────────────────────────────────────────────
  var keys = {};

  // ─────────────────────────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }

  function playBeep(freq, dur, vol) {
    if (!audioCtx) return;
    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }

  function setCrowdApproval(delta) {
    crowdApproval = clamp(crowdApproval + delta, 0, 100);
  }

  function emperorMood() {
    if (crowdApproval > 70) return 'PLEASED';
    if (crowdApproval < 30) return 'ANGRY';
    return 'NEUTRAL';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  HUD
  // ─────────────────────────────────────────────────────────────────────────────
  function updateHUD() {
    if (!hudEl) return;
    var enemyHP = 0;
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) enemyHP += enemies[i].hp;
    }
    var netStr = netCooldown > 0 ? (netCooldown.toFixed(1) + 's') : 'READY';
    var shieldStr = shieldEquipped ? 'YES' : 'NO';
    hudEl.textContent =
      'GLADIATOR ARENA [ROUND: ' + currentRound + '/5]' +
      ' [ENEMY HP: ' + Math.ceil(enemyHP) + ']' +
      ' [CROWD: ' + Math.round(crowdApproval) + '%]' +
      ' [EMPEROR: ' + emperorMood() + ']' +
      ' | NET: ' + netStr +
      ' SHIELD: ' + shieldStr;
  }

  function showMsg(txt, dur) {
    if (!msgEl) return;
    msgEl.textContent = txt;
    msgEl.style.opacity = '1';
    if (dur) {
      setTimeout(function () { if (msgEl) msgEl.style.opacity = '0'; }, dur * 1000);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  SCENE SETUP
  // ─────────────────────────────────────────────────────────────────────────────
  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88AACC);
    scene.fog = new THREE.Fog(0x88AACC, 40, 90);

    var ambient = new THREE.AmbientLight(0xFFDDAA, 0.6);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFEECC, 1.0);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    dodgeLight = new THREE.PointLight(0xFFCC44, 0, 20);
    dodgeLight.position.set(0, 6, 0);
    scene.add(dodgeLight);

    buildArena();
    buildCrowd();
    buildEmperorBox();
    buildGladiatorGate();
    buildWeaponPickups();
    buildPlayer();
  }

  function buildArena() {
    var floorGeo = new THREE.PlaneGeometry(40, 40);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0xDDBB88 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    var wallMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var nw = new THREE.Mesh(new THREE.BoxGeometry(50, 6, 2), wallMat);
    nw.position.set(0, 3, -21);
    scene.add(nw);
    var sw = new THREE.Mesh(new THREE.BoxGeometry(50, 6, 2), wallMat);
    sw.position.set(0, 3, 21);
    scene.add(sw);
    var ew = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 40), wallMat);
    ew.position.set(21, 3, 0);
    scene.add(ew);
    var ww = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 40), wallMat);
    ww.position.set(-21, 3, 0);
    scene.add(ww);

    // 8 arch LineSegments around perimeter
    var archMat = new THREE.LineBasicMaterial({ color: 0xCCAA66 });
    var archPositions = [
      [-10, 21, false], [0, 21, false], [10, 21, false],
      [-10, -21, false], [0, -21, false], [10, -21, false],
      [-21, 0, true], [21, 0, true]
    ];
    var ai;
    for (ai = 0; ai < archPositions.length; ai++) {
      var ap = archPositions[ai];
      var pts = new Float32Array([
        -1.5, 0, 0,  -1.5, 4, 0,
         1.5, 0, 0,   1.5, 4, 0,
        -1.5, 4, 0,   0,   5.5, 0,
         0,   5.5, 0, 1.5, 4, 0
      ]);
      var archGeo = new THREE.BufferGeometry();
      archGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      var archLine = new THREE.LineSegments(archGeo, archMat);
      archLine.position.set(ap[0], 0, ap[1]);
      if (ap[2]) archLine.rotation.y = Math.PI / 2;
      scene.add(archLine);
    }

    // Stand tiers
    var standMat = new THREE.MeshLambertMaterial({ color: 0x998866 });
    var ns1 = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 8), standMat);
    ns1.position.set(0, 1.5, -27);
    scene.add(ns1);
    var ns2 = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 6), standMat);
    ns2.position.set(0, 4.5, -31);
    scene.add(ns2);
    var ss1 = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 8), standMat);
    ss1.position.set(0, 1.5, 27);
    scene.add(ss1);
    var ss2 = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 6), standMat);
    ss2.position.set(0, 4.5, 31);
    scene.add(ss2);
    var es1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 40), standMat);
    es1.position.set(27, 1.5, 0);
    scene.add(es1);
    var es2 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 40), standMat);
    es2.position.set(31, 4.5, 0);
    scene.add(es2);
    var ws1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 40), standMat);
    ws1.position.set(-27, 1.5, 0);
    scene.add(ws1);
    var ws2 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 40), standMat);
    ws2.position.set(-31, 4.5, 0);
    scene.add(ws2);
  }

  function buildCrowd() {
    var crowdColors = [0x884422, 0x448822, 0x6666AA, 0xAA5533, 0x336644];
    var positions = [];
    var i;
    for (i = -22; i <= 22; i += 2.2) {
      positions.push([i, 3.5, -25.5]);
      positions.push([i, 6.5, -30.0]);
    }
    for (i = -22; i <= 22; i += 2.2) {
      positions.push([i, 3.5, 25.5]);
      positions.push([i, 6.5, 30.0]);
    }
    for (i = -18; i <= 18; i += 2.2) {
      positions.push([25.5, 3.5, i]);
      positions.push([30.0, 6.5, i]);
      positions.push([-25.5, 3.5, i]);
      positions.push([-30.0, 6.5, i]);
    }
    while (positions.length > 200) positions.pop();

    for (i = 0; i < positions.length; i++) {
      var col = crowdColors[Math.floor(Math.random() * crowdColors.length)];
      var bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
      var bodyMat = new THREE.MeshLambertMaterial({ color: col });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(positions[i][0], positions[i][1] + 0.6, positions[i][2]);
      scene.add(body);
      var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var headMat = new THREE.MeshLambertMaterial({ color: 0xDDB899 });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(positions[i][0], positions[i][1] + 1.55, positions[i][2]);
      scene.add(head);
      crowdBlocks.push({ body: body, head: head, baseY: positions[i][1] + 0.6, phase: Math.random() * Math.PI * 2 });
    }
  }

  function buildEmperorBox() {
    var platMat = new THREE.MeshLambertMaterial({ color: 0xFFDD44 });
    var plat = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 5), platMat);
    plat.position.set(0, 7, -28);
    scene.add(plat);

    var throneMat = new THREE.MeshLambertMaterial({ color: 0xCC9900 });
    var throne = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 1), throneMat);
    throne.position.set(0, 9, -30);
    scene.add(throne);

    var empMat = new THREE.MeshLambertMaterial({ color: 0x552222 });
    emperorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.8), empMat);
    emperorMesh.position.set(0, 9, -29);
    scene.add(emperorMesh);

    var empHeadMat = new THREE.MeshLambertMaterial({ color: 0xDDAA88 });
    var empHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), empHeadMat);
    empHead.position.set(0, 10.5, -29);
    scene.add(empHead);

    var crownMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
    var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 8), crownMat);
    crown.position.set(0, 11.05, -29);
    scene.add(crown);

    var thumbMat = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
    emperorThumbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.3), thumbMat);
    emperorThumbMesh.position.set(0.9, 9.5, -28.8);
    scene.add(emperorThumbMesh);
  }

  function buildGladiatorGate() {
    var frameMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var frameL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.5), frameMat);
    frameL.position.set(-3, 3, 20.5);
    scene.add(frameL);
    var frameR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.5), frameMat);
    frameR.position.set(3, 3, 20.5);
    scene.add(frameR);
    var frameTop = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.5, 0.5), frameMat);
    frameTop.position.set(0, 6.25, 20.5);
    scene.add(frameTop);

    // Portcullis bars as LineSegments
    var barPtsArr = [
      -2.5, 0, 0,  -2.5, 6, 0,
      -1.5, 0, 0,  -1.5, 6, 0,
      -0.5, 0, 0,  -0.5, 6, 0,
       0.5, 0, 0,   0.5, 6, 0,
       1.5, 0, 0,   1.5, 6, 0,
       2.5, 0, 0,   2.5, 6, 0,
      -2.8, 1.5, 0, 2.8, 1.5, 0,
      -2.8, 3.5, 0, 2.8, 3.5, 0,
      -2.8, 5.5, 0, 2.8, 5.5, 0
    ];
    var barGeo = new THREE.BufferGeometry();
    barGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(barPtsArr), 3));
    var barMat = new THREE.LineBasicMaterial({ color: 0x443322 });
    portcullisMesh = new THREE.LineSegments(barGeo, barMat);
    portcullisMesh.position.set(0, 0, 20.5);
    scene.add(portcullisMesh);

    // Cage door for lion (west side)
    var cagePtsArr = [
      -1.5, 0, 0, -1.5, 3, 0,
      -0.75, 0, 0, -0.75, 3, 0,
       0, 0, 0,  0, 3, 0,
       0.75, 0, 0,  0.75, 3, 0,
       1.5, 0, 0,  1.5, 3, 0,
      -1.8, 1, 0, 1.8, 1, 0,
      -1.8, 2, 0, 1.8, 2, 0
    ];
    var cageGeo = new THREE.BufferGeometry();
    cageGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cagePtsArr), 3));
    var cageMat = new THREE.LineBasicMaterial({ color: 0x665544 });
    cageDoor = new THREE.LineSegments(cageGeo, cageMat);
    cageDoor.position.set(-20, 0, -5);
    cageDoor.rotation.y = Math.PI / 2;
    scene.add(cageDoor);
  }

  function buildWeaponPickups() {
    spawnPickup('gladius',  5, 0,  5);
    spawnPickup('net',     -6, 0,  3);
    spawnPickup('trident',  8, 0, -4);
    spawnPickup('shield',  -8, 0, -6);
  }

  function spawnPickup(type, x, y, z) {
    var mesh;
    if (type === 'gladius') {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.0, 0.15),
        new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
      );
    } else if (type === 'net') {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.5, 0.15, 8),
        new THREE.MeshLambertMaterial({ color: 0xCC8833 })
      );
    } else if (type === 'trident') {
      var tPts = new Float32Array([
        0, 0, 0,  0, 1.4, 0,
        -0.3, 1.4, 0, -0.3, 2.0, 0,
         0.0, 1.4, 0,  0.0, 2.0, 0,
         0.3, 1.4, 0,  0.3, 2.0, 0,
        -0.3, 1.0, 0,  0.3, 1.0, 0
      ]);
      var tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute('position', new THREE.BufferAttribute(tPts, 3));
      mesh = new THREE.LineSegments(tGeo, new THREE.LineBasicMaterial({ color: 0xAAAAAA }));
    } else {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.1, 0.12),
        new THREE.MeshLambertMaterial({ color: 0x886633 })
      );
    }
    mesh.position.set(x, y + 0.5, z);
    scene.add(mesh);
    pickups.push({ type: type, mesh: mesh, pos: { x: x, y: y + 0.5, z: z }, active: true });
  }

  function buildPlayer() {
    playerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.6, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xCC9966 })
    );
    playerMesh.position.set(playerPos.x, playerPos.y + 0.8, playerPos.z);
    scene.add(playerMesh);

    playerWeaponMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.8, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
    );
    playerWeaponMesh.position.set(playerPos.x + 0.55, playerPos.y + 1.0, playerPos.z);
    scene.add(playerWeaponMesh);

    playerShieldMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.1, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x886633 })
    );
    playerShieldMesh.position.set(playerPos.x - 0.65, playerPos.y + 0.9, playerPos.z);
    playerShieldMesh.visible = false;
    scene.add(playerShieldMesh);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  ROUND SETUP
  // ─────────────────────────────────────────────────────────────────────────────
  var ENEMY_DEFS = {
    retiarius:   { hp: 80,  speed: 2.5, damage: 35, attackRange: 3.2, cooldown: 0.9, color: 0x335599, armor: 0,   name: 'Retiarius' },
    secutor:     { hp: 120, speed: 2.0, damage: 45, attackRange: 2.5, cooldown: 0.8, color: 0x884444, armor: 0,   name: 'Secutor' },
    dimachaerus: { hp: 80,  speed: 3.0, damage: 40, attackRange: 2.2, cooldown: 0.7, color: 0x664422, armor: 0,   name: 'Dimachaerus' },
    murmillo:    { hp: 200, speed: 1.5, damage: 55, attackRange: 2.8, cooldown: 1.0, color: 0x445566, armor: 0.5, name: 'Murmillo' },
    champion:    { hp: 400, speed: 2.2, damage: 65, attackRange: 3.0, cooldown: 0.7, color: 0x883333, armor: 0.2, name: 'Champion Maximus' }
  };

  function startRound(roundNum) {
    currentRound = roundNum;
    roundActive = true;
    clearEnemies();

    portcullisOpen = true;
    portcullisTimer = 2.0;
    portcullisMesh.position.y = 0;

    if (roundNum === 4) spawnChariot();

    if (roundNum === 1) {
      spawnEnemy('retiarius', -5, 0, -8);
    } else if (roundNum === 2) {
      spawnEnemy('secutor', 0, 0, -8);
    } else if (roundNum === 3) {
      spawnEnemy('dimachaerus', -4, 0, -8);
      spawnEnemy('dimachaerus',  4, 0, -8);
    } else if (roundNum === 4) {
      spawnEnemy('murmillo', 0, 0, -8);
    } else if (roundNum === 5) {
      spawnEnemy('champion', 0, 0, -8);
    }

    if (roundNum % 2 === 0) spawnLion();

    showMsg('ROUND ' + roundNum + ' - BEGIN!', 2.5);
    playBeep(880, 0.3);
  }

  function clearEnemies() {
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].mesh) scene.remove(enemies[i].mesh);
      if (enemies[i].weaponMesh) scene.remove(enemies[i].weaponMesh);
      if (enemies[i].netOverlay) scene.remove(enemies[i].netOverlay);
    }
    enemies = [];
    if (lionMesh) { scene.remove(lionMesh); lionMesh = null; }
    lionActive = false;
    if (chariot) { scene.remove(chariot); chariot = null; }
    chariotActive = false;
  }

  function spawnEnemy(type, x, y, z) {
    var def = ENEMY_DEFS[type];
    var mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.7, 0.7),
      new THREE.MeshLambertMaterial({ color: def.color })
    );
    mesh.position.set(x, y + 0.85, z);
    scene.add(mesh);

    var wepMesh = makeEnemyWeaponMesh(type);
    wepMesh.position.set(x + 0.6, y + 1.0, z);
    scene.add(wepMesh);

    var enemy = {
      type: type,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      damage: def.damage,
      attackRange: def.attackRange,
      cooldown: def.cooldown,
      attackTimer: randRange(0.3, 1.0),
      armor: def.armor || 0,
      name: def.name,
      pos: { x: x, y: y + 0.85, z: z },
      mesh: mesh,
      weaponMesh: wepMesh,
      netted: false,
      nettedTimer: 0,
      netOverlay: null,
      pinnedTimer: 0,
      defeated: false,
      aiState: 'advance'
    };
    enemies.push(enemy);
    return enemy;
  }

  function makeEnemyWeaponMesh(type) {
    if (type === 'retiarius') {
      return new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6),
        new THREE.MeshLambertMaterial({ color: 0xAAAAAA })
      );
    }
    if (type === 'champion') {
      var pts = new Float32Array([
        0, 0, 0, 0, 1.6, 0,
        -0.3, 1.6, 0, -0.3, 2.1, 0,
         0,   1.6, 0,  0,   2.1, 0,
         0.3, 1.6, 0,  0.3, 2.1, 0
      ]);
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xDDDDDD }));
    }
    return new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.9, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
    );
  }

  function spawnLion() {
    lionHP = 60;
    lionActive = true;
    lionPos = { x: -18, y: 0.5, z: -14 };
    lionAttackCooldown = 1.5;
    cageDoorOpen = false;
    if (cageDoor) cageDoor.visible = true;
    lionMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.55, 1.6, 8),
      new THREE.MeshLambertMaterial({ color: 0xCC8833 })
    );
    lionMesh.rotation.x = Math.PI / 2;
    lionMesh.position.set(lionPos.x, 0.8, lionPos.z);
    scene.add(lionMesh);
    setTimeout(function () {
      cageDoorOpen = true;
      if (cageDoor) cageDoor.visible = false;
    }, 3000);
    showMsg('A LION ENTERS THE ARENA!', 2.0);
  }

  function spawnChariot() {
    chariotActive = true;
    chariotLaps = 0;
    chariotAngle = 0;
    chariot = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.2, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xCC8833 })
    );
    chariot.position.set(16, 0.6, 0);
    scene.add(chariot);
    showMsg('CHARIOT ENTERS! DODGE OR DIE!', 2.5);
    playBeep(440, 0.5);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PLAYER ATTACK
  // ─────────────────────────────────────────────────────────────────────────────
  function playerAttack() {
    if (gameOver || gameWon || !roundActive) return;
    var damage, range, cooldownTime;

    if (equippedWeapon === 'net') {
      if (netCooldown > 0) {
        showMsg('NET RECHARGING: ' + netCooldown.toFixed(1) + 's', 1.0);
        return;
      }
      throwNet();
      netCooldown = NET_COOLDOWN;
      attackCooldown = 0.5;
      return;
    }

    if (equippedWeapon === 'gladius') {
      damage = 40; range = 2.0; cooldownTime = 0.3;
    } else if (equippedWeapon === 'trident') {
      damage = 60; range = 3.0; cooldownTime = 0.5;
    } else {
      damage = 20; range = 1.5; cooldownTime = 0.4;
    }

    if (attackCooldown > 0) return;
    attackCooldown = cooldownTime;
    lastSwingTime = clock.last;

    var i, e, d, dmg;
    var hit = false;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.hp <= 0) continue;
      d = dist2d(playerPos, e.pos);
      if (d <= range) {
        dmg = damage;
        if (e.netted) dmg *= 2;
        dmg *= (1 - (e.armor || 0));
        e.hp -= dmg;
        setCrowdApproval(5);
        hit = true;
        playBeep(660, 0.15);

        if (equippedWeapon === 'trident') {
          var ep = Math.sqrt(e.pos.x * e.pos.x + e.pos.z * e.pos.z);
          if (ep > 17) {
            e.pinnedTimer = 3.0;
            e.aiState = 'pinned';
            showMsg('PINNED TO THE WALL!', 1.5);
          }
        }

        if (e.hp <= 0) killEnemy(e);
      }
    }

    if (lionActive && lionMesh) {
      d = dist2d(playerPos, lionPos);
      if (d <= range) {
        lionHP -= damage;
        hit = true;
        setCrowdApproval(3);
        if (lionHP <= 0) killLion();
      }
    }

    if (hit && playerWeaponMesh) {
      playerWeaponMesh.rotation.z = Math.PI / 3;
      setTimeout(function () { if (playerWeaponMesh) playerWeaponMesh.rotation.z = 0; }, 200);
    }
  }

  function throwNet() {
    var netMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8),
      new THREE.MeshLambertMaterial({ color: 0xCC8833, wireframe: true })
    );
    netMesh.position.set(playerPos.x, 1.0, playerPos.z);
    scene.add(netMesh);
    projectiles.push({
      type: 'net',
      mesh: netMesh,
      pos: { x: playerPos.x, y: 1.0, z: playerPos.z },
      dir: { x: -moveDir.x, z: -moveDir.z },
      speed: 14,
      life: 1.5,
      active: true
    });
    playBeep(330, 0.3);
    showMsg('NET THROWN!', 1.0);
  }

  function killEnemy(e) {
    e.hp = 0;
    e.defeated = true;
    setCrowdApproval(15);
    score += 100;
    playBeep(550, 0.4);
    mercyKillPending = true;
    mercyKillTimer = 3.0;
    showMsg('ENEMY DEFEATED! [M] MERCY | [K] KILL', 3.0);
  }

  function killLion() {
    lionActive = false;
    if (lionMesh) { scene.remove(lionMesh); lionMesh = null; }
    setCrowdApproval(10);
    score += 150;
    showMsg('LION SLAIN!', 1.5);
    playBeep(440, 0.3);
  }

  function executeMercy() {
    if (!mercyKillPending) return;
    mercyKillPending = false;
    if (crowdApproval > 70) {
      showEmperorThumb('up');
      score += 200;
      showMsg('EMPEROR GRANTS MERCY! +200 SCORE!', 2.5);
      playBeep(880, 0.5);
      finishRound();
    } else if (crowdApproval < 30) {
      showEmperorThumb('down');
      showMsg('EMPEROR DEMANDS BLOOD! ENEMY REVIVED!', 2.5);
      playBeep(220, 0.6);
      var i;
      for (i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].defeated) {
          enemies[i].hp = enemies[i].maxHp * 0.5;
          enemies[i].defeated = false;
          enemies[i].aiState = 'advance';
          break;
        }
      }
    } else {
      showEmperorThumb('neutral');
      showMsg('EMPEROR IS UNMOVED. FINISH IT!', 2.0);
    }
  }

  function executeKill() {
    if (!mercyKillPending) return;
    mercyKillPending = false;
    setCrowdApproval(-5);
    score += 50;
    showMsg('DEATH BLOW!', 1.5);
    finishRound();
  }

  function showEmperorThumb(state) {
    emperorThumbState = state;
    emperorThumbTimer = 4.0;
    if (!emperorThumbMesh) return;
    if (state === 'up') {
      emperorThumbMesh.material.color.setHex(0x44FF44);
      emperorThumbMesh.rotation.z = -Math.PI / 4;
    } else if (state === 'down') {
      emperorThumbMesh.material.color.setHex(0xFF4444);
      emperorThumbMesh.rotation.z = Math.PI / 4;
    } else {
      emperorThumbMesh.material.color.setHex(0xDDDDDD);
      emperorThumbMesh.rotation.z = 0;
    }
  }

  function finishRound() {
    roundActive = false;
    mercyKillPending = false;
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].mesh) scene.remove(enemies[i].mesh);
      if (enemies[i].weaponMesh) scene.remove(enemies[i].weaponMesh);
      if (enemies[i].netOverlay) scene.remove(enemies[i].netOverlay);
    }
    enemies = [];
    if (lionMesh) { scene.remove(lionMesh); lionMesh = null; }
    lionActive = false;

    if (currentRound >= totalRounds) {
      gameWon = true;
      showMsg('VICTORY! YOU HAVE EARNED YOUR FREEDOM! SCORE: ' + score, 0);
      if (hudEl) hudEl.textContent = '-- CHAMPION OF ROME --';
      playBeep(880, 0.2);
      setTimeout(function () { playBeep(1100, 0.2); }, 250);
      setTimeout(function () { playBeep(1320, 0.4); }, 500);
      return;
    }

    roundTransitionActive = true;
    roundTransitionTimer = 3.0;
    showMsg('ROUND ' + currentRound + ' COMPLETE! Prepare for Round ' + (currentRound + 1) + '...', 3.0);

    if (crowdApproval > 75 && !giftActive) {
      setTimeout(function () { spawnCrowdGift(); }, 2000);
    }
  }

  function spawnCrowdGift() {
    if (giftActive) return;
    giftActive = true;
    var gx = randRange(-8, 8);
    var gz = randRange(-8, 8);
    giftPos = { x: gx, y: 0.5, z: gz };
    giftMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
    );
    giftMesh.position.set(gx, 0.5, gz);
    scene.add(giftMesh);
    showMsg('THE CROWD THROWS A WEAPON GIFT!', 2.0);
    playBeep(660, 0.2);
    setTimeout(function () { playBeep(880, 0.2); }, 200);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  ENEMY AI
  // ─────────────────────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    var i, e, dx, dz, dist, speed, nx, nz;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.hp <= 0) continue;

      if (e.netted) {
        e.nettedTimer -= dt;
        if (e.nettedTimer <= 0) {
          e.netted = false;
          if (e.netOverlay) { scene.remove(e.netOverlay); e.netOverlay = null; }
        }
      }

      if (e.pinnedTimer > 0) {
        e.pinnedTimer -= dt;
        e.aiState = 'pinned';
        if (e.pinnedTimer <= 0) e.aiState = 'advance';
      }

      if (e.aiState === 'pinned') continue;

      dx = playerPos.x - e.pos.x;
      dz = playerPos.z - e.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      speed = e.speed * (e.netted ? 0.3 : 1.0);

      if (dist > e.attackRange) {
        nx = dx / dist;
        nz = dz / dist;
        e.pos.x += nx * speed * dt;
        e.pos.z += nz * speed * dt;
        e.aiState = 'advance';
      } else {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = e.cooldown;
          enemyAttack(e, dist);
        }
      }

      // Keep in bounds
      var eRad = Math.sqrt(e.pos.x * e.pos.x + e.pos.z * e.pos.z);
      if (eRad > 19) {
        e.pos.x *= 18 / eRad;
        e.pos.z *= 18 / eRad;
      }

      if (e.mesh) {
        e.mesh.position.set(e.pos.x, 0.85, e.pos.z);
        e.mesh.rotation.y = Math.atan2(dx, dz);
      }
      if (e.weaponMesh) {
        e.weaponMesh.position.set(e.pos.x + 0.6, 1.0, e.pos.z);
      }
      if (e.netOverlay) {
        e.netOverlay.position.set(e.pos.x, 1.0, e.pos.z);
      }
    }
  }

  function enemyAttack(e, dist) {
    if (dist > e.attackRange + 0.5) return;

    var dmg = e.damage;

    if (shieldEquipped) {
      var fwdX = camera ? -Math.sin(camera.rotation.y) : 0;
      var fwdZ = camera ? -Math.cos(camera.rotation.y) : 0;
      var ex = e.pos.x - playerPos.x;
      var ez = e.pos.z - playerPos.z;
      var dot = fwdX * ex + fwdZ * ez;
      if (dot < 0) dmg *= 0.3;
    }

    if (dodgeDetected) {
      setCrowdApproval(8);
      triggerDodgeLight();
      showMsg('DODGE! CROWD GOES WILD!', 1.0);
      dodgeDetected = false;
      return;
    }

    playerHP -= dmg;
    setCrowdApproval(-10);
    playBeep(220, 0.2);

    if (playerHP <= 0) {
      playerHP = 0;
      gameOver = true;
      roundActive = false;
      showMsg('YOU HAVE FALLEN. GAME OVER. Score: ' + score, 0);
      if (hudEl) hudEl.textContent = '-- DEFEATED IN THE ARENA --';
      playBeep(110, 1.0);
    }
  }

  function triggerDodgeLight() {
    if (!dodgeLight) return;
    dodgeLight.intensity = 3.0;
    dodgeLightTimer = 0.6;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  LION AI
  // ─────────────────────────────────────────────────────────────────────────────
  function updateLion(dt) {
    if (!lionActive || !lionMesh || !cageDoorOpen) return;

    var dx = playerPos.x - lionPos.x;
    var dz = playerPos.z - lionPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var lionSpeed = 5.5;

    if (dist > 1.6) {
      lionPos.x += (dx / dist) * lionSpeed * dt;
      lionPos.z += (dz / dist) * lionSpeed * dt;
    } else {
      lionAttackCooldown -= dt;
      if (lionAttackCooldown <= 0) {
        lionAttackCooldown = 1.2;
        playerHP -= 30;
        setCrowdApproval(-8);
        playBeep(180, 0.25);
        if (playerHP <= 0) {
          playerHP = 0;
          gameOver = true;
          roundActive = false;
          showMsg('MAULED BY THE LION. GAME OVER. Score: ' + score, 0);
          if (hudEl) hudEl.textContent = '-- DEFEATED IN THE ARENA --';
        }
      }
    }

    var lRad = Math.sqrt(lionPos.x * lionPos.x + lionPos.z * lionPos.z);
    if (lRad > 19) { lionPos.x *= 18 / lRad; lionPos.z *= 18 / lRad; }

    lionMesh.position.set(lionPos.x, 0.8, lionPos.z);
    lionMesh.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  CHARIOT
  // ─────────────────────────────────────────────────────────────────────────────
  function updateChariot(dt) {
    if (!chariotActive || !chariot) return;
    chariotAngle += dt * 1.8;
    chariot.position.x = Math.cos(chariotAngle) * 14;
    chariot.position.z = Math.sin(chariotAngle) * 10;
    chariot.rotation.y = -chariotAngle - Math.PI / 2;

    if (chariotAngle >= Math.PI * 2 * (chariotLaps + 1)) {
      chariotLaps++;
      if (chariotLaps >= 2) {
        chariotActive = false;
        scene.remove(chariot);
        chariot = null;
        showMsg('CHARIOT EXITS. FIGHT!', 1.5);
        return;
      }
    }

    var cdx = chariot.position.x - playerPos.x;
    var cdz = chariot.position.z - playerPos.z;
    var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
    if (cdist < 2.5) {
      playerHP -= 80 * dt;
      setCrowdApproval(-20 * dt);
      playBeep(200, 0.1);
      if (playerHP <= 0) {
        playerHP = 0;
        gameOver = true;
        roundActive = false;
        showMsg('TRAMPLED BY THE CHARIOT. GAME OVER.', 0);
        if (hudEl) hudEl.textContent = '-- DEFEATED IN THE ARENA --';
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PROJECTILES
  // ─────────────────────────────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    var i, j, p, e, nd;
    for (i = projectiles.length - 1; i >= 0; i--) {
      p = projectiles[i];
      if (!p.active) { projectiles.splice(i, 1); continue; }
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
        continue;
      }
      p.pos.x += p.dir.x * p.speed * dt;
      p.pos.z += p.dir.z * p.speed * dt;
      p.mesh.position.set(p.pos.x, p.pos.y, p.pos.z);

      if (p.type === 'net') {
        for (j = 0; j < enemies.length; j++) {
          e = enemies[j];
          if (e.hp <= 0 || e.netted) continue;
          nd = dist2d(p.pos, e.pos);
          if (nd < 1.5) {
            e.netted = true;
            e.nettedTimer = 4.0;
            var ovGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.8, 8);
            var ovMat = new THREE.MeshLambertMaterial({ color: 0xCC8833, wireframe: true });
            e.netOverlay = new THREE.Mesh(ovGeo, ovMat);
            e.netOverlay.position.set(e.pos.x, 1.0, e.pos.z);
            scene.add(e.netOverlay);
            showMsg('ENEMY NETTED! 2x DAMAGE!', 1.5);
            setCrowdApproval(5);
            scene.remove(p.mesh);
            p.active = false;
            break;
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PICKUPS
  // ─────────────────────────────────────────────────────────────────────────────
  function checkPickups() {
    var i, pk, d;
    for (i = 0; i < pickups.length; i++) {
      pk = pickups[i];
      if (!pk.active) continue;
      d = dist2d(playerPos, pk.pos);
      if (d < 1.5) {
        if (pk.type === 'shield') {
          showMsg('Press E to equip SHIELD', 0.5);
        } else {
          pickupWeapon(pk);
        }
      }
    }

    if (giftActive && giftMesh) {
      d = dist2d(playerPos, giftPos);
      if (d < 1.5) {
        scene.remove(giftMesh);
        giftMesh = null;
        giftActive = false;
        equippedWeapon = 'gladius';
        updatePlayerWeaponVisual();
        showMsg('CROWD GIFT: GOLDEN GLADIUS!', 2.0);
        playBeep(880, 0.3);
      }
    }
  }

  function pickupNearShield() {
    var i, pk, d;
    for (i = 0; i < pickups.length; i++) {
      pk = pickups[i];
      if (!pk.active || pk.type !== 'shield') continue;
      d = dist2d(playerPos, pk.pos);
      if (d < 1.8) {
        shieldEquipped = true;
        pk.active = false;
        scene.remove(pk.mesh);
        if (playerShieldMesh) playerShieldMesh.visible = true;
        showMsg('SHIELD EQUIPPED! Blocks 70% frontal damage.', 2.0);
        playBeep(550, 0.25);
        return;
      }
    }
  }

  function pickupWeapon(pk) {
    equippedWeapon = pk.type;
    pk.active = false;
    scene.remove(pk.mesh);
    updatePlayerWeaponVisual();
    showMsg('PICKED UP: ' + pk.type.toUpperCase(), 1.5);
    playBeep(660, 0.2);
  }

  function updatePlayerWeaponVisual() {
    if (!playerWeaponMesh) return;
    if (equippedWeapon === 'gladius') {
      playerWeaponMesh.material.color.setHex(0xCCCCCC);
      playerWeaponMesh.scale.set(1, 1, 1);
    } else if (equippedWeapon === 'trident') {
      playerWeaponMesh.material.color.setHex(0xAAAAAA);
      playerWeaponMesh.scale.set(1.2, 1.5, 1);
    } else if (equippedWeapon === 'net') {
      playerWeaponMesh.material.color.setHex(0xCC8833);
      playerWeaponMesh.scale.set(1.5, 0.5, 1.5);
    } else {
      playerWeaponMesh.material.color.setHex(0x999999);
      playerWeaponMesh.scale.set(1, 1, 1);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PLAYER MOVEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  function onKey(e, down) {
    keys[e.code] = down;
    if (!down) return;

    if (e.code === 'KeyT') {
      if (equippedWeapon === 'net') playerAttack();
      else showMsg('Equip a net first (pick it up).', 1.0);
    }
    if (e.code === 'KeyE') pickupNearShield();
    if (e.code === 'Space' || e.code === 'KeyF') playerAttack();
    if (e.code === 'KeyM') executeMercy();
    if (e.code === 'KeyK') executeKill();
  }

  function updatePlayer(dt) {
    if (gameOver || gameWon) return;

    var speed = 7.0;
    var dx = 0, dz = 0;

    if (keys['KeyW'] || keys['ArrowUp'])    dz -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  dz += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (dx !== 0 || dz !== 0) {
      var len = Math.sqrt(dx * dx + dz * dz);
      dx /= len; dz /= len;
      playerPos.x += dx * speed * dt;
      playerPos.z += dz * speed * dt;
      moveDir.x = dx;
      moveDir.z = dz;
      dodgeCheckTimer = 0.15;
    }

    if (dodgeCheckTimer > 0) {
      dodgeCheckTimer -= dt;
      var i;
      for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (e.hp <= 0) continue;
        if (e.attackTimer < 0.12 && dist2d(playerPos, e.pos) < e.attackRange + 1.5) {
          dodgeDetected = true;
        }
      }
    }

    var pr = Math.sqrt(playerPos.x * playerPos.x + playerPos.z * playerPos.z);
    if (pr > 18.5) {
      playerPos.x = playerPos.x / pr * 18.5;
      playerPos.z = playerPos.z / pr * 18.5;
    }

    if (playerMesh) {
      playerMesh.position.set(playerPos.x, playerPos.y + 0.8, playerPos.z);
      if (dx !== 0 || dz !== 0) playerMesh.rotation.y = Math.atan2(dx, dz);
    }
    if (playerWeaponMesh) {
      playerWeaponMesh.position.set(playerPos.x + 0.55, playerPos.y + 1.0, playerPos.z);
    }
    if (playerShieldMesh) {
      playerShieldMesh.position.set(playerPos.x - 0.65, playerPos.y + 0.9, playerPos.z);
      playerShieldMesh.visible = shieldEquipped;
    }

    if (camera) {
      camera.position.set(playerPos.x, playerPos.y + 14, playerPos.z + 12);
      camera.lookAt(playerPos.x, 0, playerPos.z);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  CROWD ANIMATION
  // ─────────────────────────────────────────────────────────────────────────────
  function updateCrowd(t) {
    var excite = crowdApproval / 100;
    var i, cb, bob;
    for (i = 0; i < crowdBlocks.length; i++) {
      cb = crowdBlocks[i];
      bob = Math.sin(t * 3 + cb.phase) * 0.15 * excite;
      cb.body.position.y = cb.baseY + bob;
      cb.head.position.y = cb.baseY + 0.95 + bob;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PORTCULLIS
  // ─────────────────────────────────────────────────────────────────────────────
  function updatePortcullis(dt) {
    if (!portcullisMesh) return;
    if (portcullisOpen) {
      portcullisTimer -= dt;
      portcullisMesh.position.y = Math.min(portcullisMesh.position.y + dt * 3, 6);
      if (portcullisTimer <= 0) portcullisOpen = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  ROUND CHECK
  // ─────────────────────────────────────────────────────────────────────────────
  function checkRoundEnd() {
    if (!roundActive || gameOver || gameWon || mercyKillPending) return;
    var allDead = true;
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) { allDead = false; break; }
    }
    if (allDead && enemies.length > 0) finishRound();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  MAIN LOOP
  // ─────────────────────────────────────────────────────────────────────────────
  function loop(timestamp) {
    if (!active) return;
    animFrameId = requestAnimationFrame(loop);

    var dt = Math.min((timestamp - clock.last) / 1000, 0.1);
    clock.last = timestamp;
    var t = timestamp / 1000;

    if (!gameOver && !gameWon) {
      if (attackCooldown > 0) attackCooldown -= dt;
      if (netCooldown > 0) netCooldown -= dt;

      if (mercyKillTimer > 0) {
        mercyKillTimer -= dt;
        if (mercyKillTimer <= 0 && mercyKillPending) executeKill();
      }

      if (emperorThumbTimer > 0) {
        emperorThumbTimer -= dt;
        if (emperorThumbTimer <= 0) showEmperorThumb('neutral');
      }

      if (dodgeLightTimer > 0) {
        dodgeLightTimer -= dt;
        dodgeLight.intensity = (dodgeLightTimer / 0.6) * 3.0;
        if (dodgeLightTimer <= 0) dodgeLight.intensity = 0;
      }

      if (roundTransitionActive) {
        roundTransitionTimer -= dt;
        if (roundTransitionTimer <= 0) {
          roundTransitionActive = false;
          startRound(currentRound + 1);
        }
      }

      updatePortcullis(dt);

      if (roundActive) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateLion(dt);
        updateChariot(dt);
        updateProjectiles(dt);
        checkPickups();
        checkRoundEnd();
      } else {
        updatePlayer(dt);
      }

      updateCrowd(t);

      if (emperorMesh) emperorMesh.position.y = 9 + Math.sin(t * 0.8) * 0.05;

      if (giftMesh) {
        giftMesh.rotation.y += dt * 2;
        giftMesh.position.y = 0.5 + Math.sin(t * 3) * 0.15;
      }
    }

    updateHUD();
    renderer.render(scene, camera);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  ACTIVATION
  // ─────────────────────────────────────────────────────────────────────────────
  function handleKeydown(e) {
    keysDown[e.code] = true;
    var now = Date.now();
    if (e.code === 'KeyG') gDownAt = now;
    if (e.code === 'KeyA') aDownAt = now;

    if (keysDown['KeyG'] && keysDown['KeyA']) {
      if (Math.abs(gDownAt - aDownAt) <= ACTIVATION_WINDOW) {
        if (!active) activate();
      }
    }

    if (active) onKey(e, true);
  }

  function handleKeyup(e) {
    keysDown[e.code] = false;
    if (active) onKey(e, false);
  }

  function handleResize() {
    if (!active || !renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function activate() {
    active = true;

    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 14, 22);
    camera.lookAt(0, 0, 0);

    hudEl = document.createElement('div');
    hudEl.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.72);color:#FFD700;font:bold 13px monospace;padding:7px 14px;z-index:9100;white-space:nowrap;overflow:hidden;';
    document.body.appendChild(hudEl);

    msgEl = document.createElement('div');
    msgEl.style.cssText = 'position:fixed;top:40%;left:50%;transform:translateX(-50%);color:#FFD700;font:bold 28px monospace;text-shadow:2px 2px 8px #000;z-index:9101;text-align:center;transition:opacity 0.5s;pointer-events:none;';
    document.body.appendChild(msgEl);

    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = 'position:fixed;top:8px;right:14px;z-index:9200;background:#550000;color:#fff;border:none;padding:6px 14px;font:bold 16px monospace;cursor:pointer;border-radius:3px;';
    closeBtn.onclick = deactivate;
    closeBtn.id = 'gladiator-arena-close';
    document.body.appendChild(closeBtn);

    var ctrlEl = document.createElement('div');
    ctrlEl.style.cssText = 'position:fixed;top:8px;left:8px;color:#FFD700;font:11px monospace;z-index:9101;opacity:0.85;';
    ctrlEl.innerHTML = 'WASD=Move | Space/F=Attack | T=ThrowNet | E=Shield | M=Mercy | K=Kill | G+A=Quit';
    ctrlEl.id = 'gladiator-arena-ctrl';
    document.body.appendChild(ctrlEl);

    window.addEventListener('resize', handleResize);

    buildScene();

    clock.last = performance.now();
    animFrameId = requestAnimationFrame(loop);

    setTimeout(function () {
      showMsg('WELCOME TO THE COLOSSEUM! Win 5 rounds for FREEDOM!', 3.0);
      setTimeout(function () { startRound(1); }, 3500);
    }, 500);
  }

  function deactivate() {
    active = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (renderer) { document.body.removeChild(renderer.domElement); renderer.dispose(); renderer = null; }
    if (hudEl) { document.body.removeChild(hudEl); hudEl = null; }
    if (msgEl) { document.body.removeChild(msgEl); msgEl = null; }
    var cb = document.getElementById('gladiator-arena-close');
    if (cb && cb.parentNode) cb.parentNode.removeChild(cb);
    var cc = document.getElementById('gladiator-arena-ctrl');
    if (cc && cc.parentNode) cc.parentNode.removeChild(cc);
    window.removeEventListener('resize', handleResize);
    reset();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────
  function init() {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
  }

  function update() {}

  function reset() {
    playerHP = 150;
    playerMaxHP = 150;
    playerPos = { x: 0, y: 0.5, z: 14 };
    playerVelX = 0;
    playerVelZ = 0;
    currentRound = 0;
    roundActive = false;
    gameOver = false;
    gameWon = false;
    score = 0;
    crowdApproval = 50;
    roundTransitionTimer = 0;
    roundTransitionActive = false;
    mercyKillPending = false;
    mercyKillTimer = 0;
    moveDir = { x: 0, z: -1 };
    attackCooldown = 0;
    equippedWeapon = 'gladius';
    shieldEquipped = false;
    netCooldown = 0;
    dodgeDetected = false;
    dodgeCheckTimer = 0;
    dodgeLightTimer = 0;
    lastSwingTime = 0;
    enemies = [];
    pickups = [];
    projectiles = [];
    crowdBlocks = [];
    chariot = null;
    chariotLaps = 0;
    chariotAngle = 0;
    chariotActive = false;
    lionMesh = null;
    lionHP = 60;
    lionActive = false;
    lionAttackCooldown = 0;
    cageDoor = null;
    cageDoorOpen = false;
    giftMesh = null;
    giftActive = false;
    playerMesh = null;
    playerWeaponMesh = null;
    playerShieldMesh = null;
    emperorMesh = null;
    emperorThumbMesh = null;
    emperorThumbState = 'neutral';
    emperorThumbTimer = 0;
    portcullisMesh = null;
    portcullisOpen = false;
    portcullisTimer = 0;
    scene = null;
    camera = null;
    dodgeLight = null;
    keys = {};
  }

  return { init: init, update: update, reset: reset };
}());
